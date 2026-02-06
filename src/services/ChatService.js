const Config = require('../core/Config');
const G4F = require('../providers/G4FProvider');
const Gemini = require('../providers/GeminiProvider');
const Groq = require('../providers/GroqProvider');
const Puter = require('../providers/PuterProvider');
const Pollinations = require('../providers/PollinationsProvider');
const { parseBridgeResponse } = require('../../utils/parsers');
const { extractContent } = require('../../utils/content');
const Logger = require('../core/Logger');

class ChatService {
    constructor() {
        this.providers = {
            'g4f': G4F,
            'gemini': Gemini,
            'groq': Groq,
            'puter': Puter,
            'pollinations': Pollinations
        };
        this.stats = {
            requests: 0,
            errors: 0,
            fallbacks: 0
        };
        this.history = [];
    }

    async handleRequest(reqBody) {
        this.stats.requests++;
        let { messages, model: requestedModel = 'gpt-4o-mini', prompt, tools } = reqBody;

        // 1. Resolve Aliases
        let model = Config.get(`openclaw.alias.${requestedModel}`) || requestedModel;

        // 2. Normalize messages
        const rawMessages = messages || (prompt ? [{ role: 'user', content: prompt }] : []);
        if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
            throw new Error('Invalid request: messages array is required and cannot be empty');
        }

        const processedMessages = rawMessages.map(m => ({
            role: m.role || 'user',
            content: extractContent(m.content),
            tool_call_id: m.tool_call_id,
            tool_calls: m.tool_calls,
            name: m.name
        }));

        // 3. Chain of Models (with fallbacks)
        const modelChain = [model];
        const fallbacks = Config.get(`providers.fallbacks.${model}`) || [];
        modelChain.push(...fallbacks);

        // Remove duplicates from chain
        const uniqueChain = [...new Set(modelChain)];

        // 4. Try each model in the chain
        let lastError = null;
        for (let i = 0; i < uniqueChain.length; i++) {
            const currentModel = uniqueChain[i];
            try {
                const provider = this.route(currentModel);
                if (!provider) {
                    throw new Error(`No provider found for model: ${currentModel}`);
                }

                Logger.info(`[REQ] ${currentModel} (@${provider.name})`, 'ChatService');

                // Check if provider is ready (for G4F)
                if (provider.name === 'g4f' && !provider.isReady) {
                    // Try to wait a bit for G4F to be ready (max 5 seconds)
                    let waitCount = 0;
                    while (!provider.isReady && waitCount < 5) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        waitCount++;
                    }
                    if (!provider.isReady) {
                        throw new Error('G4F server is not ready yet. Please wait a moment and try again.');
                    }
                }

                const rawResponse = await provider.complete(processedMessages, currentModel, tools);
                if (!rawResponse) {
                    throw new Error('Provider returned empty response');
                }

                const result = {
                    id: `claw-${Date.now()}`,
                    created: Math.floor(Date.now() / 1000),
                    model: currentModel,
                    provider: provider.name
                };

                const latency = ((Date.now() / 1000) - result.created).toFixed(2);
                const parsed = parseBridgeResponse(rawResponse, {
                    provider: provider.name,
                    model: currentModel,
                    latency: latency
                });

                // Check if we got a meaningful response
                // If both content and tool_calls are empty, try next model
                if ((!parsed.content || parsed.content.trim() === '') && parsed.tool_calls.length === 0) {
                    throw new Error('Response was filtered (likely internal reasoning/meta-talk)');
                }

                result.content = parsed.content || null;
                result.tool_calls = parsed.tool_calls.length > 0 ? parsed.tool_calls : undefined;
                result.finish_reason = parsed.tool_calls.length > 0 ? 'tool_calls' : 'stop';

                this.addToHistory(processedMessages, result, provider.name);
                return result;

            } catch (error) {
                lastError = error;
                const errorMsg = error.message || String(error);

                // Check if it's a dependency error - don't try fallback, just throw
                if (errorMsg.includes('Missing Dependencies') || errorMsg.includes('MissingRequirementsError')) {
                    Logger.error(`Dependency Error: ${errorMsg}`, 'ChatService');
                    throw new Error(errorMsg);
                }

                Logger.warn(`FAILED: ${currentModel} -> ${errorMsg.substring(0, 100)}`, 'ChatService');

                this.stats.errors++;

                // If this is the last model in chain, throw the error
                if (i === uniqueChain.length - 1) {
                    // Format error message more clearly
                    if (errorMsg.includes('G4F HTTP 500') && errorMsg.includes('MissingRequirementsError')) {
                        // Extract install command if present
                        const installMatch = errorMsg.match(/pip install[^\|]*\|?\s*([^\|]+)/);
                        if (installMatch) {
                            throw new Error(`G4F Missing Dependencies: Please install required packages:\n${installMatch[1].trim()}`);
                        }
                    }
                    throw new Error(`All models failed. Last error: ${errorMsg}`);
                }

                this.stats.fallbacks++;
                Logger.info(`Trying next in chain: ${uniqueChain[i + 1] || 'LAST RESORT'}...`, 'ChatService');
            }
        }

        // 5. Final Safety Catch: If all models in chain failed, try Pollinations (GPT-4o-mini) as last resort
        Logger.warn('All chain models failed. Attempting last-resort fallback to Pollinations...', 'ChatService');
        try {
            const lastResortProvider = this.providers.pollinations;
            if (lastResortProvider) {
                const lastResortModel = 'gpt-4o-mini';
                const rawResponse = await lastResortProvider.complete(processedMessages, lastResortModel);
                const result = {
                    id: `claw-final-${Date.now()}`,
                    created: Math.floor(Date.now() / 1000),
                    model: lastResortModel,
                    provider: 'pollinations (fallback)'
                };
                const parsed = parseBridgeResponse(rawResponse, { provider: 'pollinations', model: lastResortModel });
                result.content = parsed.content;
                result.finish_reason = 'stop';
                return result;
            }
        } catch (finalError) {
            Logger.error(`Last-resort fallback failed: ${finalError.message}`, 'ChatService');
        }

        // Should never reach here, but just in case
        throw lastError || new Error('Unknown error: all models and safety fallbacks failed');
    }

    addToHistory(messages, response, provider) {
        const entry = {
            timestamp: new Date().toISOString(),
            actual_model: response.model,
            provider: provider,
            request_preview: extractContent(messages[messages.length - 1].content).substring(0, 100),
            response_preview: response.content ? response.content.substring(0, 100) : '[Tool Call]'
        };
        this.history.unshift(entry);
        if (this.history.length > 50) this.history.pop();
    }

    /**
     * Route a model to the appropriate provider
     * Priority: OpenClaw forced provider > Config forced provider > Auto-detect
     */
    route(model) {
        if (!model || typeof model !== 'string') {
            Logger.warn(`Invalid model name: ${model}`, 'ChatService');
            return this.providers.pollinations || this.providers.g4f || null;
        }

        // 1. Check OpenClaw forced provider
        const ocForced = Config.get(`openclaw.force_provider.${model}`);
        if (ocForced && this.providers[ocForced]) {
            return this.providers[ocForced];
        }

        // 2. Check config forced provider
        const forced = Config.get(`models.${model}`);
        if (forced && this.providers[forced]) {
            return this.providers[forced];
        }

        // 3. Groq Priority (Fastest and Most Reliable)
        if (this.providers.groq && this.providers.groq.supports(model) && Config.get('groq.api_key')) {
            return this.providers.groq;
        }

        // 4. Gemini API Priority (Official)
        if (this.providers.gemini && this.providers.gemini.supports(model) && Config.get('gemini.api_key')) {
            return this.providers.gemini;
        }

        // 5. G4F (Free Chain)
        if (this.providers.g4f && this.providers.g4f.isReady && this.providers.g4f.supports(model)) {
            return this.providers.g4f;
        }

        // 6. Puter (Backup)
        if (this.providers.puter && this.providers.puter.supports(model) && Config.get('puter.api_key')) {
            return this.providers.puter;
        }

        // 7. Pollinations (Final Fallback)
        return this.providers.pollinations || this.providers.g4f || null;
    }

    getAllModels() {
        const combinations = [];
        const g4fProvider = this.providers.g4f;

        // G4F models
        if (g4fProvider.workingModels && Array.isArray(g4fProvider.workingModels)) {
            g4fProvider.workingModels.forEach(model => {
                combinations.push({
                    model: model,
                    provider: 'g4f',
                    display: `${model} (@g4f)`,
                    status: g4fProvider.isReady ? 'available' : 'initializing'
                });
            });
        }

        // Pollinations models
        ['gpt-4o-mini', 'openai', 'llama'].forEach(model => {
            combinations.push({
                model: model,
                provider: 'pollinations',
                display: `${model} (@pollinations)`,
                status: 'available'
            });
        });

        // Gemini Models
        ['gemini-1.5-flash', 'gemini-1.5-pro'].forEach(model => {
            combinations.push({
                model: model,
                provider: 'gemini',
                display: `${model} (Google)`,
                status: 'available'
            });
        });

        // Groq Models
        ['llama-3.1-70b', 'mixtral-8x7b'].forEach(model => {
            combinations.push({
                model: model,
                provider: 'groq',
                display: `${model} (Groq)`,
                status: 'available'
            });
        });

        // Puter Models
        ['gpt-4o-mini', 'claude-3-5-sonnet'].forEach(model => {
            combinations.push({
                model: model,
                provider: 'puter',
                display: `${model} (Puter)`,
                status: 'available'
            });
        });

        // Sort by model name
        combinations.sort((a, b) => a.model.localeCompare(b.model));

        return {
            combinations: combinations,
            providers: {
                g4f: {
                    name: 'G4F',
                    description: 'GPT4Free - Free AI models',
                    status: g4fProvider.isReady ? 'online' : 'initializing',
                    modelCount: g4fProvider.workingModels ? g4fProvider.workingModels.length : 0
                },
                pollinations: {
                    name: 'Pollinations',
                    description: 'Pollinations AI - Fast and reliable',
                    status: 'online',
                    modelCount: 3
                },
                gemini: {
                    name: 'Google Gemini',
                    description: 'Official Gemini API',
                    status: 'online',
                    modelCount: 2
                },
                groq: {
                    name: 'Groq',
                    description: 'LPU Inference Engine',
                    status: 'online',
                    modelCount: 2
                },
                puter: {
                    name: 'Puter',
                    description: 'Puter Cloud AI',
                    status: 'online',
                    modelCount: 2
                }
            }
        };
    }
}

module.exports = new ChatService();

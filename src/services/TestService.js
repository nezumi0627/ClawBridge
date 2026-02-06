/**
 * TestService - Model+Provider combination testing
 * Tests all available models across all providers and records results
 */

const Config = require('../core/Config');
const G4F = require('../providers/G4FProvider');
const Logger = require('../core/Logger');

class TestService {
    constructor() {
        this.providers = {
            'g4f': G4F,
            'gemini': require('../providers/GeminiProvider'),
            'groq': require('../providers/GroqProvider'),
            'puter': require('../providers/PuterProvider')
        };

        this.results = [];
        this.isRunning = false;
        this.lastRunTime = null;
        this.abortController = null;

        // Define model-provider mappings
        this.modelProviderMap = {
            // Google Gemini (Free Tier)
            'gemini': [
                'gemini-2.1-flash'
            ],
            // Groq (Free Tier)
            'groq': [
                'llama-3.3-70b-versatile',
                'llama-3.1-8b-instant'
            ],
            // Puter (Free Tier)
            'puter': [
                'gpt-4o-mini',
                'claude-3-7-sonnet-latest',
                'deepseek-chat'
            ],
            // G4F Models
            'g4f': [
                'gpt-4o',
                'gpt-4o-mini',
                'gpt-4',
                'deepseek-chat',
                'command-r'
            ]
        };
    }

    /**
     * Get all testable combinations
     */
    getCombinations() {
        const combinations = [];

        for (const [providerName, models] of Object.entries(this.modelProviderMap)) {
            // If provider is G4F, also merge in working models
            const effectiveModels = [...models];

            if (providerName === 'g4f' && Array.isArray(G4F.workingModels)) {
                // Add working models that aren't already in the static list
                for (const wm of G4F.workingModels) {
                    if (!effectiveModels.includes(wm)) {
                        effectiveModels.push(wm);
                    }
                }
            }

            for (const model of effectiveModels) {
                combinations.push({
                    provider: providerName,
                    model: model,
                    display: `${model} (@${providerName})`
                });
            }
        }

        return combinations;
    }

    /**
     * Test a single model+provider combination
     */
    async testCombination(providerName, model, customPrompt = null) {
        const provider = this.providers[providerName];
        if (!provider) {
            return {
                provider: providerName,
                model: model,
                success: false,
                error: 'Provider not found',
                responseTime: 0,
                content: null,
                timestamp: new Date().toISOString()
            };
        }

        // Check if G4F is ready
        if (providerName === 'g4f' && !provider.isReady) {
            return {
                provider: providerName,
                model: model,
                success: false,
                error: 'G4F server not ready',
                responseTime: 0,
                content: null,
                timestamp: new Date().toISOString()
            };
        }

        const promptText = customPrompt || 'Say "Hello" in one word. Just respond with the word, nothing else.';
        const testMessage = [
            { role: 'user', content: promptText }
        ];

        const startTime = Date.now();

        try {
            const response = await provider.complete(testMessage, model, null);
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Normalize content (handling both string and object responses)
            let content = '';
            if (typeof response === 'string') {
                try {
                    // Try to parse if it's JSON from G4F API
                    const parsed = JSON.parse(response);
                    content = parsed.choices?.[0]?.message?.content ||
                        parsed.message?.content ||
                        parsed.content ||
                        response;
                } catch (e) {
                    content = response;
                }
            } else if (response && typeof response === 'object') {
                content = response.content || JSON.stringify(response);
            }

            // Check if response is valid (meaningful content)
            const isValid = content && content.trim().length > 0;

            return {
                provider: providerName,
                model: model,
                success: isValid,
                error: null,
                responseTime: responseTime,
                content: content,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            let errMsg = error.message || 'Unknown Error';
            let errorType = 'unknown';

            if (errMsg.includes('Missing Puter API Key')) {
                errorType = 'auth_required';
                errMsg = 'Puter APIキーが未設定です。settings.jsonの "puter": { "api_key": "..." } に、puter loginで取得したトークンを設定してください。';
            } else if (errMsg.includes('403') && providerName === 'puter') {
                errorType = 'auth_required';
                errMsg = 'Puter APIから403エラーが返されました。トークンの有効期限か、Origin制限に抵触している可能性があります。';
            } else if (errMsg.includes('404') && providerName === 'puter') {
                errorType = 'model_not_found';
                errMsg = 'Puter APIの指定されたモデルが見つかりません。v1/v2の仕様変更か、モデル名の不一致の可能性があります。';
            } else if (errMsg.includes('MissingAuthError') || errMsg.includes('Authentication Required')) {
                errorType = 'auth_required';
            } else if (errMsg.includes('Rate Limit') || errMsg.includes('429')) {
                errorType = 'rate_limited';
                if (providerName === 'gemini') {
                    errMsg = 'Geminiの無料枠上限に達しました。1分ほど待ってから再試行するか、1.5-flashをご利用ください。';
                }
            } else if (errMsg.includes('404') || errMsg.includes('not found')) {
                errorType = 'model_not_found';
            }

            return {
                provider: providerName,
                model: model,
                success: false,
                error: errMsg,
                errorType: errorType,
                errorDetails: error.stack || errMsg,
                responseTime: responseTime,
                content: null,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Run tests on all combinations
     */
    async runAllTests(options = {}) {
        if (this.isRunning) {
            return { error: 'Tests already running', results: this.results };
        }

        this.isRunning = true;
        this.abortController = new AbortController();
        this.results = [];
        const startTime = Date.now();

        const combinations = this.getCombinations();
        const total = combinations.length;
        let completed = 0;

        Logger.info(`Starting test suite: ${total} combinations`, 'TestService');

        // Test with concurrency limit
        const concurrency = options.concurrency || 3;
        const batches = [];

        for (let i = 0; i < combinations.length; i += concurrency) {
            batches.push(combinations.slice(i, i + concurrency));
        }

        for (const batch of batches) {
            const batchPromises = batch.map(async (combo) => {
                if (this.abortController?.signal?.aborted) return null;
                const result = await this.testCombination(combo.provider, combo.model, options.prompt);

                if (this.abortController?.signal?.aborted) return null;

                this.results.push(result);
                completed++;

                const status = result.success ? '✓' : '✗';
                const time = result.responseTime ? `${result.responseTime}ms` : '-';
                Logger.info(`[${completed}/${total}] ${status} ${combo.display} (${time})`, 'TestService');

                return result;
            });

            await Promise.all(batchPromises);

            if (this.abortController?.signal?.aborted) {
                Logger.info('Test suite aborted by user', 'TestService');
                break;
            }

            // Small delay between batches to avoid overwhelming
            if (batches.indexOf(batch) < batches.length - 1) {
                await new Promise(r => setTimeout(r, 500));
            }
        }

        const endTime = Date.now();
        this.lastRunTime = endTime - startTime;
        this.isRunning = false;

        const summary = this.getSummary();
        Logger.success(`Test suite complete: ${summary.working}/${summary.total} working (${this.lastRunTime}ms)`, 'TestService');

        return {
            summary: summary,
            results: this.results,
            duration: this.lastRunTime
        };
    }

    /**
     * Test specific provider only
     */
    async testProvider(providerName) {
        const models = this.modelProviderMap[providerName];
        if (!models) {
            return { error: 'Provider not found' };
        }

        const results = [];
        for (const model of models) {
            const result = await this.testCombination(providerName, model);
            results.push(result);
        }

        return {
            provider: providerName,
            results: results,
            working: results.filter(r => r.success).length,
            total: results.length
        };
    }

    /**
     * Get test summary
     */
    getSummary() {
        const working = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);

        // Group by provider
        const byProvider = {};
        for (const result of this.results) {
            if (!byProvider[result.provider]) {
                byProvider[result.provider] = { working: 0, failed: 0, total: 0 };
            }
            byProvider[result.provider].total++;
            if (result.success) {
                byProvider[result.provider].working++;
            } else {
                byProvider[result.provider].failed++;
            }
        }

        // Error type breakdown
        const errorTypes = {};
        for (const result of failed) {
            const type = result.errorType || 'unknown';
            errorTypes[type] = (errorTypes[type] || 0) + 1;
        }

        // Speed stats
        const workingTimes = working.map(r => r.responseTime).filter(t => t > 0);
        const avgSpeed = workingTimes.length > 0
            ? Math.round(workingTimes.reduce((a, b) => a + b, 0) / workingTimes.length)
            : 0;
        const fastestResult = working.sort((a, b) => a.responseTime - b.responseTime)[0];
        const slowestResult = working.sort((a, b) => b.responseTime - a.responseTime)[0];

        return {
            total: this.results.length,
            working: working.length,
            failed: failed.length,
            successRate: this.results.length > 0
                ? Math.round((working.length / this.results.length) * 100)
                : 0,
            byProvider: byProvider,
            errorTypes: errorTypes,
            speed: {
                average: avgSpeed,
                fastest: fastestResult ? {
                    model: fastestResult.model,
                    provider: fastestResult.provider,
                    time: fastestResult.responseTime
                } : null,
                slowest: slowestResult ? {
                    model: slowestResult.model,
                    provider: slowestResult.provider,
                    time: slowestResult.responseTime
                } : null
            },
            lastRun: this.lastRunTime ? new Date().toISOString() : null,
            duration: this.lastRunTime
        };
    }

    /**
     * Get working models list
     */
    getWorkingModels() {
        return this.results
            .filter(r => r.success)
            .sort((a, b) => a.responseTime - b.responseTime)
            .map(r => ({
                model: r.model,
                provider: r.provider,
                display: `${r.model} (@${r.provider})`,
                responseTime: r.responseTime,
                contentPreview: r.content
            }));
    }

    /**
     * Get failed models list with reasons
     */
    getFailedModels() {
        return this.results
            .filter(r => !r.success)
            .map(r => ({
                model: r.model,
                provider: r.provider,
                display: `${r.model} (@${r.provider})`,
                error: r.error,
                errorType: r.errorType
            }));
    }

    /**
     * Stop currently running tests
     */
    stopTests() {
        if (this.isRunning && this.abortController) {
            this.abortController.abort();
            this.isRunning = false;
            return true;
        }
        return false;
    }

    /**
     * Update or add a result to the internal registry
     */
    updateResult(result) {
        const index = this.results.findIndex(r => r.provider === result.provider && r.model === result.model);
        if (index !== -1) {
            this.results[index] = result;
        } else {
            this.results.push(result);
        }
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            hasResults: this.results.length > 0,
            resultCount: this.results.length,
            lastRun: this.lastRunTime ? new Date().toISOString() : null
        };
    }
}

module.exports = new TestService();

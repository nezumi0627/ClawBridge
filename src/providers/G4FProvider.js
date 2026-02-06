const BaseProvider = require('./BaseProvider');
const fetch = require('node-fetch');
const { spawn } = require('child_process');
const path = require('path');
const Config = require('../core/Config');
const { processMessagesForG4F } = require('../../services/ToolService');

class G4FProvider extends BaseProvider {
    constructor() {
        super('g4f');
        this.port = Config.get('g4f.port') || 1338;
        this.process = null;
        this.workingModels = [];
        this.isReady = false;
        this.init();
    }

    init() {
        if (Config.get('g4f.enabled')) {
            this.startServer();
            this.updateWorkingModels();
        }
    }

    startServer() {
        const serverPath = path.join(process.cwd(), 'g4f_server.py');
        const Logger = require('../core/Logger');

        Logger.info('Starting G4F server...', 'G4FProvider');

        // Pass API keys to G4F environment
        const env = {
            ...process.env,
            PUTER_API_KEY: Config.get('puter.api_key'),
            GOOGLE_API_KEY: Config.get('gemini.api_key'),
            GROQ_API_KEY: Config.get('groq.api_key')
        };

        this.process = spawn('python3', [serverPath], {
            env: env,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let startupTimeout;
        let healthCheckInterval;
        let startupAttempts = 0;
        const maxStartupAttempts = 60; // 60 seconds max

        // Health check function
        const checkServerHealth = async () => {
            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 2000)
                );

                const fetchPromise = fetch(`http://127.0.0.1:${this.port}/v1/models`, {
                    method: 'GET'
                });

                const res = await Promise.race([fetchPromise, timeoutPromise]);

                if (res.ok) {
                    this.isReady = true;
                    if (startupTimeout) clearTimeout(startupTimeout);
                    if (healthCheckInterval) clearInterval(healthCheckInterval);
                    Logger.success('G4F server is ready', 'G4FProvider');
                    // Update working models once server is ready
                    setTimeout(() => this.updateWorkingModels(), 1000);
                    return true;
                }
            } catch (e) {
                // Server not ready yet
                startupAttempts++;
                if (startupAttempts >= maxStartupAttempts) {
                    Logger.warn('G4F server health check timeout', 'G4FProvider');
                    if (healthCheckInterval) clearInterval(healthCheckInterval);
                }
            }
            return false;
        };

        this.process.stdout.on('data', (data) => {
            const output = data.toString();
            // Check for server ready signals
            if (output.includes('Uvicorn running') ||
                output.includes('Starting server') ||
                output.includes('Application startup complete') ||
                output.includes('127.0.0.1:') ||
                output.includes('Uvicorn')) {
                // Start health check polling
                if (!healthCheckInterval) {
                    healthCheckInterval = setInterval(async () => {
                        if (await checkServerHealth()) {
                            // Server is ready, interval will be cleared in checkServerHealth
                        }
                    }, 1000); // Check every second
                }
            }
        });

        this.process.stderr.on('data', (data) => {
            // Internal G4F logs are often noisy, only log severe errors
            const msg = data.toString();

            // Check for missing requirements in stderr
            if (msg.includes('MissingRequirementsError') ||
                (msg.includes('ImportError') && msg.includes('No module named'))) {
                const packageMatch = msg.match(/No module named ['"]([^'"]+)['"]/);
                if (packageMatch) {
                    Logger.error(`G4F Missing Package: ${packageMatch[1]}. Run: pip install ${packageMatch[1]}`, 'G4FProvider');
                } else {
                    Logger.error(`G4F Missing Requirements: ${msg.substring(0, 300)}`, 'G4FProvider');
                }
            } else if (msg.includes('Traceback') ||
                (msg.includes('ERROR') && !msg.includes('RetryProvider')) ||
                msg.includes('Fatal')) {
                Logger.warn(`G4F Server Error: ${msg.substring(0, 200)}`, 'G4FProvider');
            }
        });

        this.process.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                Logger.warn(`G4F server exited with code ${code}`, 'G4FProvider');
            }
            this.isReady = false;
            if (healthCheckInterval) clearInterval(healthCheckInterval);
            this.kill();
        });

        // Start health check immediately (in case server starts very fast)
        setTimeout(() => {
            if (!this.isReady && !healthCheckInterval) {
                healthCheckInterval = setInterval(async () => {
                    if (await checkServerHealth()) {
                        // Server is ready
                    }
                }, 1000);
            }
        }, 2000);

        // Timeout: if server doesn't start in 60 seconds, mark as not ready
        startupTimeout = setTimeout(() => {
            if (!this.isReady) {
                Logger.warn('G4F server startup timeout - may still be initializing', 'G4FProvider');
                if (healthCheckInterval) clearInterval(healthCheckInterval);
            }
        }, 60000);

        process.on('exit', () => {
            if (healthCheckInterval) clearInterval(healthCheckInterval);
            this.kill();
        });
    }

    kill() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }

    async updateWorkingModels() {
        try {
            const url = "https://raw.githubusercontent.com/maruf009sultan/g4f-working/refs/heads/main/working/models.txt";
            const res = await fetch(url, { timeout: 10000 });
            if (res.ok) {
                const text = await res.text();
                this.workingModels = text.split('\n')
                    .filter(l => l.trim() && l.includes('(text)'))
                    .map(l => l.split('(')[0].trim())
                    .filter(m => m.length > 0);

                // Also try to get models from G4F API if available
                if (this.isReady) {
                    try {
                        const apiRes = await fetch(`http://127.0.0.1:${this.port}/v1/models`, { timeout: 5000 });
                        if (apiRes.ok) {
                            const apiData = await apiRes.json();
                            if (apiData.data && Array.isArray(apiData.data)) {
                                const apiModels = apiData.data.map(m => m.id).filter(Boolean);
                                // Merge and deduplicate
                                this.workingModels = [...new Set([...this.workingModels, ...apiModels])];
                            }
                        }
                    } catch (e) {
                        // API models fetch failed, use working models list only
                    }
                }
            }
        } catch (e) {
            // Fallback: use default models if fetch fails
            this.workingModels = ['gpt-4', 'gpt-4o', 'gpt-3.5-turbo', 'llama3', 'command-r'];
        }
    }

    supports(model) {
        return model.startsWith('g4f') ||
            (model.includes('gpt-4') && !model.includes('mini')) ||
            model.includes('gemini') ||
            this.workingModels.includes(model);
    }

    async complete(messages, model, tools, options = {}) {
        // 1. G4F 互換用にツールポリフィルを適用
        const polyfilled = processMessagesForG4F(messages, tools);

        // 2. すべてのメッセージに必ず content プロパティを付与（G4F 側の厳格チェック対策）
        const finalMessages = polyfilled.map(m => {
            const safe = { ...m };
            if (typeof safe.content !== 'string') {
                // 空文字でも「content キーが存在する」ことが重要
                safe.content = '';
            }
            return safe;
        });

        const backendModel = model === 'gpt-4-turbo' ? 'gpt-4' : model;

        // Map models to their best G4F providers
        let provider = null;
        if (model.includes('llama-3') || model.includes('mixtral') || model.includes('gemma')) {
            provider = 'Groq';
        } else if (model.includes('deepseek')) {
            provider = 'DeepSeek';
        } else if (model.includes('claude')) {
            provider = 'Anthropic';
        } else if (model.includes('gpt-4o-mini') || model.includes('gpt-4o')) {
            provider = 'PuterJS';
        } else if (model.includes('gemini')) {
            // Force API provider for Gemini if possible
            provider = 'GeminiPro';
        }

        // G4F API format - following OpenAI-compatible format
        const body = {
            messages: finalMessages,
            model: backendModel,
            stream: false,
            // Specify provider if determined (or let user/G4F decide)
            ...(options.provider ? { provider: options.provider } : (provider ? { provider: provider } : {})),
            // G4F supports tools parameter if available
            ...(tools && tools.length > 0 ? { tools: tools } : {})
        };

        try {
            const res = await fetch(`http://127.0.0.1:${this.port}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body),
                timeout: 120000 // 2 minutes
            });

            if (!res.ok) {
                let errorData;
                try {
                    errorData = await res.json();
                } catch (e) {
                    errorData = { error: { message: await res.text().catch(() => 'Unknown G4F Error') } };
                }
                const msg = errorData.error?.message || errorData.message || 'Upstream Error';

                // Check for missing requirements error
                if (msg.includes('MissingRequirementsError') ||
                    (msg.includes('Install') && msg.includes('pip install')) ||
                    msg.includes('No module named')) {
                    // Extract package names from error message
                    let installCmd = '';

                    // Try to extract from "pip install" command
                    const pipMatch = msg.match(/pip install[^\|]*\|?\s*([^\|]+)/);
                    if (pipMatch) {
                        installCmd = pipMatch[1].trim();
                    } else {
                        // Try to extract from "Install" directive
                        const installMatch = msg.match(/Install\s+["']([^"']+)["']/);
                        if (installMatch) {
                            installCmd = `pip install -U ${installMatch[1]}`;
                        } else {
                            // Try to extract from "No module named"
                            const moduleMatch = msg.match(/No module named ['"]([^'"]+)['"]/);
                            if (moduleMatch) {
                                installCmd = `pip install ${moduleMatch[1]}`;
                            } else {
                                // Default fallback
                                installCmd = 'pip install -U nodriver platformdirs';
                            }
                        }
                    }

                    throw new Error(`G4F Missing Dependencies: This model requires additional Python packages.\n\nPlease run:\n${installCmd}\n\nOr install all G4F dependencies:\npip install -U g4f[all]`);
                }

                if (res.status === 401 || msg.includes('Auth') || msg.includes('authentication')) {
                    throw new Error(`Authentication Required: ${msg}`);
                }
                if (res.status === 429 || msg.includes('RateLimit') || msg.includes('rate limit')) {
                    throw new Error(`Rate Limited: ${msg}`);
                }
                if (res.status === 503 || msg.includes('503')) {
                    throw new Error(`Service Unavailable: ${msg}`);
                }
                throw new Error(`G4F HTTP ${res.status}: ${msg}`);
            }

            // G4F returns JSON response, but we need to handle both JSON and text
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const jsonData = await res.json();
                // Return the full JSON response as string for parsing
                return JSON.stringify(jsonData);
            } else {
                // Fallback to text
                return await res.text();
            }

        } catch (error) {
            if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
                throw new Error("G4F server is offline or starting up.");
            }
            if (error.message.includes('timeout')) {
                throw new Error("G4F request timed out. The model may be slow or unavailable.");
            }
            throw error;
        }
    }
}

module.exports = new G4FProvider();

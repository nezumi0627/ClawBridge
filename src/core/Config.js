const fs = require('fs');
const path = require('path');

class ConfigManager {
    constructor() {
        this.configPath = path.join(process.cwd(), 'config', 'settings.json');
        this.defaults = {
            server: {
                port: 1337,
                host: '127.0.0.1'
            },
            g4f: {
                port: 1338,
                enabled: true
            },
            providers: {
                default: 'g4f',
                fallbacks: {
                    'gpt-4': ['gpt-4o', 'gpt-4o-mini', 'llama3'],
                    'gpt-4o': ['gpt-4o-mini', 'llama3'],
                    'gpt-3.5-turbo': ['gpt-4o-mini', 'llama3']
                }
            },
            models: {},
            logging: {
                level: 'info',
                file: 'clawbridge.log'
            }
        };
        this.config = this.load();
    }

    deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }

    load() {
        if (!fs.existsSync(this.configPath)) {
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
            this.save(this.defaults);
            return JSON.parse(JSON.stringify(this.defaults));
        }
        try {
            const data = fs.readFileSync(this.configPath, 'utf8');
            const userConfig = JSON.parse(data);
            return this.deepMerge(JSON.parse(JSON.stringify(this.defaults)), userConfig);
        } catch (error) {
            console.error('[Config] Failed to load config, using defaults:', error);
            return JSON.parse(JSON.stringify(this.defaults));
        }
    }

    save(data) {
        try {
            // We only save the flat data passed in, but the constructor uses load() which merges.
            // If data is the whole config, it saves it all.
            fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
            this.config = data;
        } catch (error) {
            console.error('[Config] Failed to save config:', error);
        }
    }

    get(key) {
        // First check if key exists directly (e.g. "providers.fallbacks.gemini-2.5-flash")
        // But since this.config is nested, this check is tricky for nested paths.
        // Instead, handle specific cases where keys might contain dots (like model names) inside 'fallbacks'

        // Special logic for fallbacks to handle keys with dots
        if (key.includes('providers.fallbacks.')) {
            const prefix = 'providers.fallbacks.';
            if (key.startsWith(prefix)) {
                const modelName = key.substring(prefix.length);
                const fallbacks = this.config.providers?.fallbacks;
                if (fallbacks && fallbacks[modelName]) {
                    return fallbacks[modelName];
                }
            }
        }

        return key.split('.').reduce((obj, k) => (obj || {})[k], this.config);
    }

    set(key, value) {
        const keys = key.split('.');
        let current = this.config;
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = current[keys[i]] || {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        this.save(this.config);
    }
}

module.exports = new ConfigManager();

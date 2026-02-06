const BaseProvider = require('./BaseProvider');
const fetch = require('node-fetch');
const { processMessagesForG4F } = require('../../services/ToolService');

class PollinationsProvider extends BaseProvider {
    constructor() {
        super('pollinations');
    }

    supports(model) {
        return model.includes('gpt-4o-mini') || model === 'openai' || model === 'llama';
    }

    async complete(messages, model, tools, options = {}) {
        // 1. Tool Polyfill
        const finalMessages = processMessagesForG4F(messages, tools);

        // Pollinations API format
        const body = {
            messages: finalMessages,
            model: model.includes('llama') ? 'llama' : 'openai',
            seed: Math.floor(Math.random() * 1000000),
            jsonMode: false
        };

        try {
            const res = await fetch('https://text.pollinations.ai/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/plain'
                },
                body: JSON.stringify(body),
                timeout: 60000 // 1 minute timeout
            });

            if (!res.ok) {
                let errorMsg = `Pollinations Error ${res.status}`;
                try {
                    const errorText = await res.text();
                    if (errorText) errorMsg += `: ${errorText.substring(0, 200)}`;
                } catch (e) {
                    // Ignore error text parsing errors
                }
                throw new Error(errorMsg);
            }

            return await res.text();

        } catch (error) {
            if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                throw new Error("Pollinations request timed out. The service may be slow or unavailable.");
            }
            if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
                throw new Error("Pollinations service is unreachable. Check your internet connection.");
            }
            throw error;
        }
    }
}

module.exports = new PollinationsProvider();

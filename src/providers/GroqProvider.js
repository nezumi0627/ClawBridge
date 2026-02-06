const BaseProvider = require('./BaseProvider');
const fetch = require('node-fetch');
const Config = require('../core/Config');

class GroqProvider extends BaseProvider {
    constructor() {
        super('groq');
        this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    }

    supports(model) {
        return ['llama3-8b', 'llama3-70b', 'llama-3', 'mixtral-8x7b', 'gemma-7b'].some(m => model.includes(m)) || model.includes('groq');
    }

    async complete(messages, model, tools, options = {}) {
        const apiKey = Config.get('groq.api_key') || process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error('Missing Groq API Key');

        // Resolve Model Name
        let targetModel = 'llama-3.3-70b-versatile';
        if (model.includes('8b')) {
            targetModel = 'llama-3.1-8b-instant';
        } else if (model.includes('qwen')) {
            targetModel = 'qwen/qwen3-32b';
        } else if (model.includes('llama-3.3')) {
            targetModel = 'llama-3.3-70b-versatile';
        }

        try {
            const res = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messages,
                    model: targetModel
                })
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Groq API Error: ${res.status} ${err}`);
            }

            const data = await res.json();
            return data.choices[0].message.content;
        } catch (e) {
            throw e;
        }
    }
}
module.exports = new GroqProvider();

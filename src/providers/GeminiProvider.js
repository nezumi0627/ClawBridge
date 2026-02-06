const BaseProvider = require('./BaseProvider');
const fetch = require('node-fetch');
const Config = require('../core/Config');
const { processMessagesForG4F } = require('../../services/ToolService');

class GeminiProvider extends BaseProvider {
    constructor() {
        super('gemini');
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1/models';
    }

    supports(model) {
        return model.includes('gemini');
    }

    async complete(messages, model, tools, options = {}) {
        // Get API key
        const apiKey = Config.get('gemini.api_key') || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Missing Gemini API Key');

        // 1. Tool Polyfill
        const finalMessages = processMessagesForG4F(messages, tools);

        // Gemini Model IDs
        let targetModel = 'gemini-2.1-flash';
        if (model.includes('pro')) targetModel = 'gemini-2.5-pro';
        else if (model.includes('2.0-flash')) targetModel = 'gemini-2.0-flash';

        // Convert messages to Gemini format
        const contents = finalMessages.map(m => ({
            role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content || '' }]
        }));

        const url = `${this.baseUrl}/${targetModel}:generateContent?key=${apiKey}`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: contents })
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Gemini API Error: ${res.status} ${err}`);
            }

            const data = await res.json();
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            }
            throw new Error('Gemini returned empty response');
        } catch (e) {
            throw e;
        }
    }
}
module.exports = new GeminiProvider();

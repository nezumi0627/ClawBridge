const BaseProvider = require('./BaseProvider');
const fetch = require('node-fetch');
const Config = require('../core/Config');
const { processMessagesForG4F } = require('../../services/ToolService');

class PuterProvider extends BaseProvider {
    constructor() {
        super('puter');
    }

    supports(model) {
        // Puter typically provides these models
        return ['gpt-4o-mini', 'gpt-4o', 'claude-3-5-sonnet', 'claude-3-7-sonnet-latest', 'deepseek-chat'].includes(model) || model.includes('puter');
    }

    async complete(messages, model, tools, options = {}) {
        const g4fPort = Config.get('g4f.port') || 1338;

        let targetModel = model;
        // Ensure model names are correct for Puter via G4F
        if (model.includes('4o-mini')) targetModel = 'gpt-4o-mini';
        else if (model.includes('4o')) targetModel = 'gpt-4o';
        else if (model === 'claude-3-7-sonnet-latest' || model.includes('claude-3.7')) targetModel = 'claude-3-7-sonnet-latest';
        else if (model.includes('claude-3-5-sonnet') || model.includes('3.5-sonnet')) targetModel = 'claude-3-7-sonnet-latest'; // Map 3.5 to 3.7 as it works better
        else if (model.includes('deepseek')) targetModel = 'deepseek-chat';

        // 1. G4F 互換用にツールポリフィルを適用
        const polyfilled = processMessagesForG4F(messages, tools);

        // 2. すべてのメッセージに必ず content プロパティを付与（G4F 側の厳格チェック対策）
        const finalMessages = polyfilled.map(m => {
            const safe = { ...m };
            if (typeof safe.content !== 'string') {
                safe.content = '';
            }
            return safe;
        });

        try {
            // G4F PuterJS プロバイダ経由で Puter モデルを呼び出す
            const res = await fetch(`http://127.0.0.1:${g4fPort}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: finalMessages,
                    model: targetModel,
                    provider: 'PuterJS',
                    stream: false,
                    ...(tools && tools.length > 0 ? { tools } : {})
                })
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Puter (via G4F) Error: ${res.status} ${err}`);
            }

            const data = await res.json();
            return data.choices && data.choices[0].message ? data.choices[0].message.content : JSON.stringify(data);
        } catch (e) {
            throw e;
        }
    }
}
module.exports = new PuterProvider();

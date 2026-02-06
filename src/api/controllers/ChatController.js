const ChatService = require('../../services/ChatService');

class ChatController {
    async completion(req, res) {
        try {
            const { stream } = req.body;
            const response = await ChatService.handleRequest(req.body);

            if (stream) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                const chunk = (delta, finish = null) => `data: ${JSON.stringify({
                    id: response.id,
                    object: 'chat.completion.chunk',
                    created: response.created,
                    model: response.model,
                    provider: response.provider,
                    choices: [{ index: 0, delta: delta, finish_reason: finish }]
                })}\n\n`;

                res.write(chunk({ role: 'assistant' }));
                
                if (response.content) {
                    res.write(chunk({ content: response.content }));
                }
                
                if (response.tool_calls) {
                    res.write(chunk({ tool_calls: response.tool_calls }));
                }
                
                res.write(chunk({}, response.finish_reason));
                res.write('data: [DONE]\n\n');
                res.end();
            } else {
                res.json({
                    id: response.id,
                    object: 'chat.completion',
                    created: response.created,
                    model: response.model,
                    provider: response.provider,
                    choices: [{
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: response.content,
                            tool_calls: response.tool_calls
                        },
                        finish_reason: response.finish_reason
                    }],
                    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
                });
            }
        } catch (error) {
            res.status(500).json({ error: { message: error.message } });
        }
    }
}

module.exports = new ChatController();

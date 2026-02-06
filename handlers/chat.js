/**
 * Chat completion handler
 * Refactored Version
 */

const { parseBridgeResponse } = require('../utils/parsers');
const { extractContent } = require('../utils/content');
const { formatToolContent } = require('../utils/formatters');
const { callPollinations } = require('../providers/pollinations');
const { retryCallG4F, getWorkingModels } = require('../providers/g4f');

async function handleChatCompletion(req, res) {
  let { messages, model = 'gpt-4o-mini', prompt, stream = false, tools } = req.body;
  let rawMessages = messages || (prompt ? [{ role: 'user', content: prompt }] : []);

  const hasTools = Array.isArray(tools) && tools.length > 0;
  
  // LOGGING
  const lastMsg = rawMessages[rawMessages.length - 1];
  const lastContent = lastMsg ? extractContent(lastMsg.content) : 'None';
  console.log(`[\x1b[35mRequest\x1b[0m] ${model} | Content: ${lastContent.substring(0, 50).replace(/\n/g, ' ')}... | Tools: ${hasTools ? tools.length : 0}`);

  try {
    // 1. Prepare Messages (Standardization)
    const processedMessages = rawMessages.map(m => ({
        role: m.role || 'user',
        content: extractContent(m.content), // Handle multi-part content
        tool_call_id: m.tool_call_id,
        tool_calls: m.tool_calls,
        name: m.name
    }));

    // 2. Select Backend
    const workingModels = getWorkingModels();
    let isG4F = false;
    
    // Explicit Routing
    if (model === 'gpt-4o-mini' || model === 'gpt-4o-mini-free') {
        isG4F = false; 
    } else {
        // Default to G4F for 'gpt-4', 'gpt-4o', or specific G4F models
        isG4F = model.startsWith('g4f') || 
                (model.includes('gpt-4') && !model.includes('mini')) || 
                workingModels.includes(model);
    }
    
    let rawReply;
    if (isG4F) {
       const backendModel = model === 'gpt-4-turbo' ? 'gpt-4' : model;
       // G4F provider handles tool polyfills internally via ToolService
       rawReply = await retryCallG4F(processedMessages, backendModel, tools);
    } else {
       rawReply = await callPollinations(processedMessages, model, tools);
    }

    // 3. Parse Response
    const parsed = parseBridgeResponse(rawReply);
    const resultId = `claw-${Date.now()}`;
    const created = Math.floor(Date.now() / 1000);

    // 4. Log Result
    if (parsed.tool_calls.length > 0) {
        console.log(`[\x1b[32mTool Called\x1b[0m] ${parsed.tool_calls.map(t => t.function.name).join(', ')}`);
    } else {
        console.log(`[\x1b[32mResponse\x1b[0m] ${parsed.content?.substring(0, 100).replace(/\n/g, ' ')}...`);
    }

    // 5. Format Response
    // If tool calls exist, content usually should be null/empty for OpenAI, 
    // but having a thought process in content is sometimes useful.
    
    const responseMessage = {
        role: 'assistant',
        content: parsed.content || null,
        tool_calls: parsed.tool_calls.length > 0 ? parsed.tool_calls : undefined
    };

    // 6. Send Response (Stream Siumulation or JSON)
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      const chunk = (delta, finish = null) => `data: ${JSON.stringify({
          id: resultId,
          object: 'chat.completion.chunk',
          created: created,
          model: model,
          choices: [{ index: 0, delta: delta, finish_reason: finish }]
        })}\n\n`;

      res.write(chunk({ role: 'assistant' }));
      
      // Simulate typing content
      if (responseMessage.content) {
          res.write(chunk({ content: responseMessage.content }));
      }
      
      // Send tools if present
      if (responseMessage.tool_calls) {
           res.write(chunk({ tool_calls: responseMessage.tool_calls }));
      }
      
      const finishReason = responseMessage.tool_calls ? 'tool_calls' : 'stop';
      res.write(chunk({}, finishReason));
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.json({
        id: resultId,
        object: 'chat.completion',
        created: created,
        model: model,
        choices: [{
            index: 0,
            message: responseMessage,
            finish_reason: responseMessage.tool_calls ? 'tool_calls' : 'stop'
        }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      });
    }

  } catch (error) {
    console.error('[\x1b[31mError\x1b[0m]', error.message);
    // Return friendly error to client (often helps with debugging)
    res.status(500).json({ error: { message: `Bridge Error: ${error.message}` } });
  }
}

module.exports = {
  handleChatCompletion
};

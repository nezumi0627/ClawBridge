/**
 * Tool Service - Handles Tool Calling Polyfills
 */

function convertToolsToSystemPrompt(tools) {
    if (!tools || tools.length === 0) return "";
    
    const toolDescs = tools.map(t => {
        const func = t.function;
        return {
            name: func.name,
            description: func.description,
            parameters: func.parameters
        };
    });

    return `
\n\n[Tool Support Enabled]
You have access to the following tools:
${JSON.stringify(toolDescs, null, 2)}

If you decide to use a tool, you MUST respond with a JSON object in the following format ONLY:
{
  "name": "<tool_name>",
  "arguments": <parameters_object>
}

Example:
{
  "name": "exec",
  "arguments": { "command": "echo hello" }
}

Do not include any other text when using a tool. Just the JSON.
`;
}

function processMessagesForG4F(messages, tools) {
    // 1. Convert 'tool' role to 'user' role w/ truncation
    let processed = messages.map(m => {
        if (m.role === 'tool') {
            let content = m.content;
            // Truncate long outcomes
            if (content && content.length > 4000) {
                content = content.substring(0, 4000) + "\n... [Output Truncated] ...";
            }
            return {
                role: 'user',
                content: `[System: Tool Execution Result]\n(ID: ${m.tool_call_id})\n\n${content}\n\nExisting tool results detected. Please analyze the result above and respond to the user.`
            };
        }
        return m;
    });

    // 2. Inject System Prompt if tools exist
    if (tools && tools.length > 0) {
        const toolPrompt = convertToolsToSystemPrompt(tools);
        // Find system message or add one
        const systemMsgIndex = processed.findIndex(m => m.role === 'system');
        if (systemMsgIndex >= 0) {
            processed[systemMsgIndex].content += toolPrompt;
        } else {
            processed.unshift({ role: 'system', content: toolPrompt });
        }

        // 3. Add reminder to last message
        const lastMsg = processed[processed.length - 1];
        if (lastMsg && lastMsg.role === 'user') {
            lastMsg.content += "\n(Remember: If you use a tool, output ONLY the JSON object. No explanation.)";
        }
    }

    return processed;
}

module.exports = {
    convertToolsToSystemPrompt,
    processMessagesForG4F
};

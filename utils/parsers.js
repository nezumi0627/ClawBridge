/**
 * Response parsing utilities
 */

// Helper to extract JSON by balancing brackets
function extractJsonFromText(text) {
    let startIndex = text.indexOf('{');
    if (startIndex === -1) return null;

    let balance = 0;
    let endIndex = -1;
    let inString = false;
    let escape = false;

    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];

        if (escape) {
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === '{') balance++;
            else if (char === '}') {
                balance--;
                if (balance === 0) {
                    endIndex = i;
                    break;
                }
            }
        }
    }

    if (endIndex !== -1) {
        const jsonStr = text.substring(startIndex, endIndex + 1);
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.log(`[\x1b[33mWarn\x1b[0m] JSON parse failed: ${e.message}`);
            return null;
        }
    }
    return null;
}

// Helper to escape Discord markdown if needed (not strictly required for footer but good practice)
function escapeDiscord(text) {
    return text.replace(/([*_~`])/g, '\\$1');
}

function parseBridgeResponse(rawText, metadata = {}) {
    let result = { content: '', tool_calls: [] };

    // Basic validation
    if (typeof rawText !== 'string') {
        try {
            rawText = JSON.stringify(rawText);
        } catch (e) {
            rawText = String(rawText || "");
        }
    }

    let text = rawText.trim();

    // Debug output
    if (process.env.DEBUG) {
        console.log(`[\x1b[36mDebug-Raw\x1b[0m] ${text.substring(0, 500)}...`);
    }

    // 1. Check for OpenClaw-specific "Tool Call" pattern in text
    // The AI sometimes outputs: ツールを呼び出す: `write`{"path":"..."}
    // We need to parse this manually because it's not standard JSON
    const toolPrefixRegex = /ツールを呼び出す: \`([a-zA-Z0-9_]+)\`/g;
    let toolMatch;
    let hasManualToolCalls = false;

    // Use a loop to gather all tool calls
    while ((toolMatch = toolPrefixRegex.exec(text)) !== null) {
        const toolName = toolMatch[1];
        const matchIndex = toolMatch.index;
        // Start looking for JSON after the backtick
        const afterMatch = text.substring(matchIndex + toolMatch[0].length);
        const jsonStart = afterMatch.indexOf('{');

        if (jsonStart !== -1) {
            // Identify the full JSON string using the brace balancer
            const jsonResult = extractJsonFromText(afterMatch.substring(jsonStart));

            if (jsonResult) {
                hasManualToolCalls = true;

                result.tool_calls.push({
                    id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    type: 'function',
                    function: {
                        name: toolName,
                        arguments: JSON.stringify(jsonResult)
                    }
                });

                console.log(`[\x1b[32mTool\x1b[0m] Parsed manual tool call: ${toolName}`);
            } else {
                console.warn(`[\x1b[33mWarn\x1b[0m] Failed to extract valid JSON for manual tool: ${toolName}`);
            }
        }
    }

    // Remove the tool call text from the content so users don't see it (Cleaning Strategy)
    if (hasManualToolCalls) {
        // Regex to remove the pattern and the following {...} block loosely
        // This is a fallback cleanup if exact string matching is hard
        text = text.replace(/ツールを呼び出す: \`[a-zA-Z0-9_]+\`\s*(\{[\s\S]*?\})/g, (match) => {
            // Verify if this match looks like valid JSON we parsed
            try {
                const jsonPart = match.substring(match.indexOf('{'));
                JSON.parse(jsonPart);
                return ''; // Remove it
            } catch (e) {
                return match; // Keep it if it's broken
            }
        }).trim();
    }

    // 2. Standard JSON parsing (for when the whole responseはほぼJSON)
    if (!hasManualToolCalls && (text.startsWith('{') || text.startsWith('```json'))) {
        try {
            const jsonBody = text.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
            const parsed = JSON.parse(jsonBody);

            // Case A: Direct Tool Call format {"name": "...", "arguments": ...}
            if (parsed.name && parsed.arguments) {
                const argsString = typeof parsed.arguments === 'string' ? parsed.arguments : JSON.stringify(parsed.arguments);
                result.tool_calls.push({
                    id: `call_${Date.now()}`,
                    type: 'function',
                    function: { name: parsed.name, arguments: argsString }
                });
                result.content = ""; // Clear content
                return result; // Return immediately
            }

            // Case B: OpenAI Chat Completion format
            const target = parsed.choices?.[0]?.message || parsed.message || parsed;

            if (target.content) result.content = target.content;
            if (target.text) result.content = target.text;

            if (target.tool_calls) {
                result.tool_calls.push(...target.tool_calls);
            }
        } catch (e) {
            // ここでは何もしない（後続で埋め込みJSONとして再トライ）
        }
    }

    // 2-β. テキスト内に埋め込まれた JSON からツールコールを抽出
    // 例: {"name":"message","arguments":{...}}\n-# @g4f - gpt-4o-mini - 0.47s
    if (result.tool_calls.length === 0 && text.includes('{') && text.includes('}')) {
        const embedded = extractJsonFromText(text);
        if (embedded && embedded.name && embedded.arguments) {
            const argsString = typeof embedded.arguments === 'string'
                ? embedded.arguments
                : JSON.stringify(embedded.arguments);

            result.tool_calls.push({
                id: `call_${Date.now()}`,
                type: 'function',
                function: { name: embedded.name, arguments: argsString }
            });

            // ツールコールなので content は空にして即返す
            result.content = "";
            return result;
        }
    }

    // 3. Set content if not already set (and cleanup)
    if (!result.content && text) {
        result.content = text;
    }

    // 4. Content Cleanup & Formatting
    if (result.content && typeof result.content === 'string') {
        // Remove ad signatures
        result.content = result.content
            .replace(/\n\n\*\*Support Pollinations\.AI:\*\*[\s\S]*?everyone\./g, '')
            .replace(/🌸 \*\*Ad\*\* 🌸[\s\S]*?everyone\./g, '')
            .replace(/pollinations\.ai[\s\S]*?community support/g, '')
            .trim();

        // Add Footer Metadata (small text) if metadata is provided
        // Format: (-# @Provider - Model - 1.23s)
        if (metadata && metadata.provider && metadata.model && metadata.latency && result.content.length > 0) {
            // Only add footer if it's not a tool call response (which might be empty or technical)
            if (result.tool_calls.length === 0) {
                result.content += `\n\n-# @${metadata.provider} - ${metadata.model} - ${metadata.latency}s`;
            }
        }
    }

    // 5. OpenAI 互換仕様に合わせて、ツールコールがある場合は content を空にする
    // （Discord などクライアント側で JSON 全体がそのまま表示されてしまうのを防ぐ）
    if (result.tool_calls && result.tool_calls.length > 0) {
        result.content = "";
    }

    return result;
}

module.exports = {
    extractJsonFromText,
    parseBridgeResponse
};

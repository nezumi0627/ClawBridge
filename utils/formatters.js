/**
 * Formatting utilities for responses
 * Includes Discord-specific formatting (only when Discord is detected)
 */

/**
 * Check if the request is from Discord
 * This checks messages for Discord-specific metadata
 */
function isDiscordRequest(messages) {
    if (!Array.isArray(messages)) return false;
    
    // Check if any message contains Discord metadata
    for (const msg of messages) {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        if (content.includes('[Discord') || content.includes('discord') || 
            content.includes('channel') && content.includes('discord')) {
            return true;
        }
    }
    return false;
}

/**
 * Create Discord embed for tool calls
 * Only use this if isDiscordRequest returns true
 */
function createToolEmbed(toolCall) {
    const toolName = toolCall.function.name;
    let toolArgs = {};
    try {
        toolArgs = typeof toolCall.function.arguments === 'string' 
            ? JSON.parse(toolCall.function.arguments) 
            : toolCall.function.arguments;
    } catch (e) {
        toolArgs = { raw: toolCall.function.arguments };
    }
    
    // Create Discord embed JSON
    const embed = {
        embeds: [{
            title: `🔧 ツール実行中: ${toolName}`,
            description: `ツールを実行しています...`,
            color: 0x3498db, // Blue color
            fields: [],
            timestamp: new Date().toISOString(),
            footer: { text: "ClawBridge" }
        }]
    };
    
    // Add tool arguments as fields
    if (toolArgs.command) {
        embed.embeds[0].fields.push({
            name: "コマンド",
            value: `\`\`\`${toolArgs.command}\`\`\``,
            inline: false
        });
    } else if (Object.keys(toolArgs).length > 0) {
        for (const [key, value] of Object.entries(toolArgs)) {
            if (key !== 'timeout' && value) {
                const displayValue = typeof value === 'string' && value.length > 100 
                    ? value.substring(0, 100) + '...' 
                    : String(value);
                embed.embeds[0].fields.push({
                    name: key,
                    value: `\`${displayValue}\``,
                    inline: true
                });
            }
        }
    }
    
    return embed;
}

/**
 * Format tool call message
 * Creates a human-readable message about tool execution
 */
function formatToolMessage(toolCall) {
    const toolName = toolCall.function.name;
    let toolArgs = {};
    try {
        toolArgs = typeof toolCall.function.arguments === 'string' 
            ? JSON.parse(toolCall.function.arguments) 
            : toolCall.function.arguments;
    } catch (e) {
        toolArgs = { raw: toolCall.function.arguments };
    }
    
    // Create human-readable message
    let toolMessage = `🔧 **ツール実行中: ${toolName}**\n\n`;
    if (toolArgs.command) {
        toolMessage += `コマンド: \`${toolArgs.command}\`\n`;
    } else if (Object.keys(toolArgs).length > 0) {
        toolMessage += `パラメータ:\n`;
        for (const [key, value] of Object.entries(toolArgs)) {
            if (key !== 'timeout' && value) {
                const displayValue = typeof value === 'string' && value.length > 200 
                    ? value.substring(0, 200) + '...' 
                    : String(value);
                toolMessage += `- ${key}: \`${displayValue}\`\n`;
            }
        }
    }
    toolMessage += `\n実行中...`;
    
    return toolMessage;
}

/**
 * Format content with tool calls
 * Adds Discord embed if Discord is detected, otherwise just plain text
 */
function formatToolContent(parsed, messages) {
    if (parsed.tool_calls.length === 0) {
        return parsed.content || "";
    }
    
    const toolCall = parsed.tool_calls[0];
    const toolMessage = formatToolMessage(toolCall);
    
    // Check if this is a Discord request
    const isDiscord = isDiscordRequest(messages);
    
    if (isDiscord) {
        // Create Discord embed
        const embed = createToolEmbed(toolCall);
        // Format: [EMBED]...[/EMBED] followed by plain text
        if (!parsed.content || parsed.content.trim().length === 0) {
            return `[EMBED]${JSON.stringify(embed)}[/EMBED]\n\n${toolMessage}`;
        } else {
            return `[EMBED]${JSON.stringify(embed)}[/EMBED]\n\n${toolMessage}\n\n${parsed.content}`;
        }
    } else {
        // Non-Discord: just return plain text message
        if (!parsed.content || parsed.content.trim().length === 0) {
            return toolMessage;
        } else {
            return `${toolMessage}\n\n${parsed.content}`;
        }
    }
}

module.exports = {
    isDiscordRequest,
    createToolEmbed,
    formatToolMessage,
    formatToolContent
};

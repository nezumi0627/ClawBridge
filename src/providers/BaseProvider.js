class BaseProvider {
    constructor(name) {
        this.name = name;
    }

    /**
     * @param {Array} messages - Chat messages
     * @param {string} model - Requested model
     * @param {Array} tools - Tool definitions (optional)
     * @param {Object} options - Extra options (stream, etc.)
     * @returns {Promise<string>} - Raw response text
     */
    async complete(messages, model, tools, options) {
        throw new Error('Method "complete" must be implemented');
    }

    /**
     * Check if provider supports the model
     */
    supports(model) {
        return true; 
    }
}

module.exports = BaseProvider;

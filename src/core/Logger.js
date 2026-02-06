const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logPath = path.join(process.cwd(), 'clawbridge.log');
    }

    getLogPath() {
        return this.logPath;
    }

    /**
     * 起動時などにログファイルをリセットする
     */
    clear() {
        try {
            fs.writeFileSync(this.logPath, '');
        } catch (e) {
            // 権限などで失敗しても致命的ではないので握りつぶす
        }
    }

    log(level, message, context = '') {
        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] [${level.toUpperCase()}] ${context ? `[${context}] ` : ''}${message}\n`;
        
        // Print to console with color
        const colors = {
            info: '\x1b[36m',
            warn: '\x1b[33m',
            error: '\x1b[31m',
            success: '\x1b[32m'
        };
        const reset = '\x1b[0m';
        console.log(`${colors[level] || ''}${line.trim()}${reset}`);

        // Write to file
        fs.appendFileSync(this.logPath, line);
    }

    info(msg, ctx) { this.log('info', msg, ctx); }
    success(msg, ctx) { this.log('success', msg, ctx); }
    warn(msg, ctx) { this.log('warn', msg, ctx); }
    error(msg, ctx) { this.log('error', msg, ctx); }
}

module.exports = new Logger();


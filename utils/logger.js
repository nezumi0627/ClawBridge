/**
 * Logging utilities
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'clawbridge.log');

// --- Global Logging Override ---
const originalLog = console.log;
const originalError = console.error;

function fileLog(prefix, args) {
    try {
        const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        const timestamp = new Date().toLocaleTimeString('ja-JP');
        const cleanMsg = msg.replace(/\x1b\[[0-9;]*m/g, ''); // Strip ANSI
        fs.appendFileSync(LOG_FILE, `[${timestamp}] ${prefix} ${cleanMsg}\n`);
    } catch (e) {
        // Ignore logging errors
    }
}

function setupLogging() {
    console.log = function(...args) {
        originalLog.apply(console, args);
        fileLog('[INFO]', args);
    };

    console.error = function(...args) {
        originalError.apply(console, args);
        fileLog('[ERROR]', args);
    };
}

module.exports = {
    setupLogging
};

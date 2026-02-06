/**
 * ClawBridge Entry Point
 * Refactored v0.3.0
 */

// Boot the App
const App = require('./src/core/App');

try {
    App.start();
} catch (error) {
    console.error('Fatal Error:', error);
    process.exit(1);
}

const express = require('express');
const ChatController = require('./controllers/ChatController');
const Config = require('../core/Config');
const G4F = require('../providers/G4FProvider');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Chat API
router.post(['/v1/chat/completions', '/v1/completions'], (req, res) => ChatController.completion(req, res));

// Models API
router.get('/v1/models', (req, res) => {
    // Merge G4F working models + defaults
    const defaults = ['gpt-4o-mini', 'gpt-4', 'llama3'];
    const all = [...new Set([...defaults, ...G4F.workingModels])];
    res.json({
        object: 'list',
        data: all.map(id => ({ id, object: 'model' }))
    });
});

// --- Management API (for GUI) ---

// Get Status/Stats
router.get('/api/status', (req, res) => {
    const ChatService = require('../services/ChatService');
    const { version } = require('../../package.json');
    res.json({
        version: version,
        port: Config.get('server.port'),
        stats: ChatService.stats,
        providers: {
            g4f: {
                active: Config.get('g4f.enabled'),
                models_count: G4F.workingModels.length
            }
        },
        uptime: process.uptime()
    });
});

// Get Config
router.get('/api/config', (req, res) => {
    res.json(Config.config);
});

// Get Logs
router.get('/api/logs', (req, res) => {
    try {
        const logPath = path.join(process.cwd(), 'clawbridge.log');
        if (fs.existsSync(logPath)) {
            const logs = fs.readFileSync(logPath, 'utf8').split('\n').slice(-50).join('\n');
            res.json({ logs });
        } else {
            res.json({ logs: 'No log file found. Ensure logging is active.' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update Config
router.post('/api/config', (req, res) => {
    Config.save(req.body);
    res.json({ success: true, config: Config.config });
});

// Get History
router.get('/api/history', (req, res) => {
    const ChatService = require('../services/ChatService');
    res.json(ChatService.history);
});

// Providers & Models list for UI
router.get('/api/providers', (req, res) => {
    res.json({
        g4f: {
            models: G4F.workingModels,
            status: G4F.isReady ? 'online' : 'initializing'
        },
        pollinations: {
            models: ['gpt-4o-mini', 'openai', 'llama'],
            status: 'online'
        }
    });
});

// Model-Provider combinations for UI selection
router.get('/api/model-providers', (req, res) => {
    const ChatService = require('../services/ChatService');
    try {
        const data = ChatService.getAllModels();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Debug Chat Execution
router.post('/api/debug/chat', async (req, res) => {
    const ChatService = require('../services/ChatService');
    try {
        const result = await ChatService.handleRequest(req.body);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Test API ---

// Get test status
router.get('/api/test/status', (req, res) => {
    const TestService = require('../services/TestService');
    res.json(TestService.getStatus());
});

// Get all testable combinations
router.get('/api/test/combinations', (req, res) => {
    const TestService = require('../services/TestService');
    res.json({
        combinations: TestService.getCombinations(),
        total: TestService.getCombinations().length
    });
});

// Run all tests
router.post('/api/test/run', async (req, res) => {
    const TestService = require('../services/TestService');

    if (TestService.isRunning) {
        return res.status(409).json({
            error: 'Tests already running',
            status: TestService.getStatus()
        });
    }

    // Run tests in background and return immediately
    res.json({
        message: 'Test suite started',
        combinations: TestService.getCombinations().length
    });

    // Run asynchronously
    TestService.runAllTests(req.body).catch(e => {
        console.error('Test suite error:', e);
    });
});

// Stop all running tests
router.post('/api/test/stop', (req, res) => {
    const TestService = require('../services/TestService');
    const stopped = TestService.stopTests();
    res.json({ success: stopped, message: stopped ? 'Tests stopped' : 'No tests running' });
});

// Run test on a single combination
router.post('/api/test/single', async (req, res) => {
    const { provider, model } = req.body;
    const TestService = require('../services/TestService');
    const result = await TestService.testCombination(provider, model);
    TestService.updateResult(result);
    res.json(result);
});

// Run all tests and wait for results
router.post('/api/test/run-sync', async (req, res) => {
    const TestService = require('../services/TestService');

    if (TestService.isRunning) {
        return res.status(409).json({
            error: 'Tests already running',
            status: TestService.getStatus()
        });
    }

    try {
        const results = await TestService.runAllTests(req.body);
        res.json(results);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Test specific provider
router.post('/api/test/provider/:name', async (req, res) => {
    const TestService = require('../services/TestService');

    try {
        const results = await TestService.testProvider(req.params.name);
        res.json(results);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Test single combination
router.post('/api/test/single', async (req, res) => {
    const TestService = require('../services/TestService');
    const { provider, model } = req.body;

    if (!provider || !model) {
        return res.status(400).json({ error: 'provider and model are required' });
    }

    try {
        const result = await TestService.testCombination(provider, model);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get test results
router.get('/api/test/results', (req, res) => {
    const TestService = require('../services/TestService');
    res.json({
        summary: TestService.getSummary(),
        results: TestService.results
    });
});

// Get working models only
router.get('/api/test/working', (req, res) => {
    const TestService = require('../services/TestService');
    res.json({
        working: TestService.getWorkingModels(),
        count: TestService.getWorkingModels().length
    });
});

// Get failed models with reasons
router.get('/api/test/failed', (req, res) => {
    const TestService = require('../services/TestService');
    res.json({
        failed: TestService.getFailedModels(),
        count: TestService.getFailedModels().length
    });
});

// Get summary only
router.get('/api/test/summary', (req, res) => {
    const TestService = require('../services/TestService');
    res.json(TestService.getSummary());
});

// Download full debug dump
router.get('/api/test/dump', (req, res) => {
    const TestService = require('../services/TestService');
    const dump = {
        timestamp: new Date().toISOString(),
        environment: {
            node: process.version,
            platform: process.platform,
            arch: process.arch,
            tailscale_detected: true // Simplified
        },
        summary: TestService.getSummary(),
        results: TestService.results,
        // Include any captured HAR-like data if we implement that later
    };

    res.setHeader('Content-Disposition', 'attachment; filename="clawbridge_debug_dump.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(dump);
});

module.exports = router;


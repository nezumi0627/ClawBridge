const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('../api/routes');
const Config = require('./Config');
const Logger = require('./Logger');

class App {
    constructor() {
        this.app = express();
        this.port = Config.get('server.port');
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(process.cwd(), 'public')));
    }

    setupRoutes() {
        this.app.use('/', routes);
    }

    start() {
        const host = Config.get('server.host') || '0.0.0.0';
        this.app.listen(this.port, host, () => {
            // 起動毎にログファイルをクリア
            Logger.clear();

            console.clear();
            console.log(`
  ██████╗██╗      █████╗ ██╗    ██╗██████╗ ██████╗ ██╗██████╗  ██████╗ ███████╗
 ██╔════╝██║     ██╔══██╗██║    ██║██╔══██╗██╔══██╗██║██╔══██╗██╔════╝ ██╔════╝
 ██║     ██║     ███████║██║ █╗ ██║██████╔╝██████╔╝██║██║  ██║██║   ███╗█████╗  
 ██║     ██║     ██╔══██║██║███╗██║██╔══██╗██╔══██╗██║██║  ██║██║   ██║██╔══╝  
 ╚██████╗███████╗██║  ██║╚███╔███╔╝██████╔╝██║  ██║██║██████╔╝╚██████╔╝███████╗
  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝ ╚══════╝
            `);
            Logger.success(`ClawBridge v0.3.0 | Port: ${this.port}`, 'Core');
            Logger.info(`Local Interface: http://127.0.0.1:${this.port}`, 'Core');
            
            // Detect and Log Network Interfaces
            const { networkInterfaces } = require('os');
            const nets = networkInterfaces();
            const results = {};

            for (const name of Object.keys(nets)) {
                for (const net of nets[name]) {
                    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                    if (net.family === 'IPv4' && !net.internal) {
                        if (!results[name]) {
                            results[name] = [];
                        }
                        results[name].push(net.address);
                    }
                }
            }

            // Prioritize Tailscale
            let hasTailscale = false;
            if (results['tailscale0']) {
                Logger.info(`🔒 Tailscale: http://${results['tailscale0'][0]}:${this.port}`, 'Core');
                hasTailscale = true;
            }
            
            // Log other interfaces
            Object.keys(results).forEach(name => {
                if (name !== 'tailscale0') {
                     Logger.info(`🌍 Network (${name}): http://${results[name][0]}:${this.port}`, 'Core');
                }
            });

            if (!hasTailscale) {
                Logger.info('💡 Tailscale not detected or likely not active', 'Core');
            }

            Logger.info(`Log File: ${Logger.getLogPath()}`, 'Core');
        });
    }
}

module.exports = new App();

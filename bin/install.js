#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { Select, Confirm, Input } = require('enquirer');
const chalk = require('chalk');
const figlet = require('figlet');

const HOME = os.homedir();
const CLAW_DIR = path.join(HOME, '.openclaw');
const BRIDGE_DIR = path.resolve(__dirname, '..');
const SERVICE_PATH = path.join(HOME, '.config/systemd/user/clawbridge.service');

async function run() {
    console.clear();
    console.log(chalk.cyan(figlet.textSync('ClawBridge', { horizontalLayout: 'full' })));
    console.log(chalk.yellow('  --- Beta Release by nezumi0627 ---\n'));

    // 1. Legal Disclaimer
    console.log(chalk.red.bold(' [LEGAL DISCLAIMER]'));
    console.log(chalk.white(` ClawBridge is an independent personal project.
 It is NOT affiliated with OpenClaw or any other entities.
 
 - The developer (nezumi0627) assumes NO liability for damages, security risks,
   or any issues resulting from the use of this software.
 - This tool is provided "AS IS" for educational/personal use only.
 - Any risks associated with API usage or third-party providers are your own.
`));

    const accept = await new Confirm({
        name: 'question',
        message: 'Do you accept the terms and risks mentioned above?'
    }).run();

    if (!accept) {
        console.log(chalk.red('Installation aborted.'));
        process.exit(1);
    }

    // 2. Path Validation
    console.log(chalk.blue('\n[1/5] Checking environment...'));
    if (!fs.existsSync(CLAW_DIR)) {
        console.log(chalk.red(`Error: OpenClaw directory not found at ${CLAW_DIR}`));
        process.exit(1);
    }
    console.log(chalk.green('✓ OpenClaw detected.'));

    // 3. Patching openclaw.json
    console.log(chalk.blue('\n[2/5] Configuring OpenClaw...'));
    const configPath = path.join(CLAW_DIR, 'openclaw.json');
    if (fs.existsSync(configPath)) {
        let config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        // 1. Models Provider Setup
        if (!config.models) config.models = {};
        config.models.mode = "merge";
        if (!config.models.providers) config.models.providers = {};

        config.models.providers['claw-bridge'] = {
            baseUrl: "http://127.0.0.1:1337/v1",
            apiKey: "claw-free",
            api: "openai-completions",
            models: [
                {
                    id: "claw-model",
                    name: "ClawBridge Auto (Fast)",
                    reasoning: false,
                    input: ["text"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 128000,
                    maxTokens: 4096
                },
                {
                    id: "best",
                    name: "ClawBridge Best (Smart)",
                    reasoning: true,
                    input: ["text"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 128000,
                    maxTokens: 8192
                }
            ]
        };

        // 2. Agent Defaults Setup
        if (!config.agents) config.agents = {};
        if (!config.agents.defaults) config.agents.defaults = {};
        config.agents.defaults.model = { primary: "claw-bridge/claw-model" };
        if (!config.agents.defaults.models) config.agents.defaults.models = {};
        config.agents.defaults.models["claw-bridge/claw-model"] = { alias: "ClawBridge Auto (Fast)" };
        config.agents.defaults.models["claw-bridge/best"] = { alias: "ClawBridge Best (Smart)" };

        // 3. Auth Profile Setup
        if (!config.auth) config.auth = {};
        if (!config.auth.profiles) config.auth.profiles = {};
        config.auth.profiles['claw-bridge:default'] = {
            provider: "claw-bridge",
            mode: "api_key"
        };

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(chalk.green('✓ openclaw.json updated.'));
    }

    // 4. Patching agent auth-profiles.json
    const agentsDir = path.join(CLAW_DIR, 'agents');
    if (fs.existsSync(agentsDir)) {
        const agents = fs.readdirSync(agentsDir);
        for (const agent of agents) {
            const authPath = path.join(agentsDir, agent, 'agent/auth-profiles.json');
            if (fs.existsSync(authPath)) {
                let auth = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
                if (!auth.profiles) auth.profiles = {};
                auth.profiles['claw-bridge:local'] = {
                    type: "api_key",
                    apiKey: "claw-free"
                };
                if (!auth.lastGood) auth.lastGood = {};
                auth.lastGood['claw-bridge'] = "claw-bridge:local";

                fs.writeFileSync(authPath, JSON.stringify(auth, null, 2));
                console.log(chalk.green(`✓ Updated auth-profiles for agent: ${agent}`));
            }
        }
    }

    // 5. Systemd Service
    console.log(chalk.blue('\n[3/5] Setting up background service (systemd)...'));
    const serviceContent = `[Unit]
Description=ClawBridge Server (Free AI Bridge for OpenClaw)
After=network.target

[Service]
Type=simple
WorkingDirectory=${BRIDGE_DIR}
ExecStart=${process.execPath} ${path.join(BRIDGE_DIR, 'server.js')}
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=default.target
`;

    const serviceDir = path.dirname(SERVICE_PATH);
    if (!fs.existsSync(serviceDir)) fs.mkdirSync(serviceDir, { recursive: true });
    fs.writeFileSync(SERVICE_PATH, serviceContent);

    try {
        execSync('systemctl --user daemon-reload');
        execSync('systemctl --user enable clawbridge.service');
        execSync('systemctl --user restart clawbridge.service');
        console.log(chalk.green('✓ Systemd service "clawbridge" is active.'));
    } catch (e) {
        console.log(chalk.yellow('! Failed to start systemd service. Please run manually.'));
    }

    // 6. CLI Command Setup
    console.log(chalk.blue('\n[4/5] Registering "clawbridge" command...'));
    try {
        const binDir = path.join(HOME, '.local', 'bin');
        if (!fs.existsSync(binDir)) {
            fs.mkdirSync(binDir, { recursive: true });
        }

        const startScript = path.join(BRIDGE_DIR, 'start.sh');
        const linkPath = path.join(binDir, 'clawbridge');

        // Make executable
        fs.chmodSync(startScript, '755');

        // Remove existing link/file
        if (fs.existsSync(linkPath)) {
            fs.unlinkSync(linkPath);
        }

        // Create symlink
        fs.symlinkSync(startScript, linkPath);
        console.log(chalk.green(`✓ Linked ${linkPath} -> ${startScript}`));

        // Check PATH
        const currentPath = process.env.PATH || '';
        if (!currentPath.includes(binDir)) {
            console.log(chalk.yellow(`! ~/.local/bin is not in your PATH.`));
            const shellRc = process.env.SHELL.includes('zsh') ? '.zshrc' : '.bashrc';
            const rcPath = path.join(HOME, shellRc);

            const addPath = await new Confirm({
                name: 'addPath',
                message: `Add ~/.local/bin to your ${shellRc}?`
            }).run();

            if (addPath) {
                fs.appendFileSync(rcPath, `\nexport PATH="$HOME/.local/bin:$PATH"\n`);
                console.log(chalk.green(`✓ Added to ${shellRc}. Restart shell to apply.`));
            }
        }
    } catch (e) {
        console.error(chalk.red(`! Failed to register command: ${e.message}`));
    }

    // 7. Summary
    console.log(chalk.cyan('\n[5/5] Installation Complete!'));
    console.log(chalk.white(`
 ClawBridge is now installed and running in the background.
 
 - Bridge URL: http://127.0.0.1:1337
 - Provider Name: claw-bridge
 - Models available: gpt-4o-mini, llama3
 
 To verify, try:
 ${chalk.yellow('openclaw message send --target <ID> --message "こんにちは、ClawBridge！"')}
`));

    console.log(chalk.gray('Author: nezumi0627 | Version: 0.1.0-beta\n'));
}

run().catch(console.error);

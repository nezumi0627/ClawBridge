#!/bin/bash
# ClawBridge Launcher v0.6.0

# 1. Kill existing instances
echo "[Init] Cleaning up ports 1337 and 1338..."
fuser -k 1337/tcp 1338/tcp 2>/dev/null

# 2. Check for systemd service conflict
if systemctl --user is-active --quiet clawbridge; then
    echo "[System] Background service detected. Restarting via systemctl..."
    systemctl --user restart clawbridge
    echo "[Success] Bridge restarted as a service. View logs with: journalctl --user -u clawbridge -f"
    exit 0
fi

# 3. Start in foreground if no service
echo "[Start] Launching ClawBridge v0.6.0..."
npm start

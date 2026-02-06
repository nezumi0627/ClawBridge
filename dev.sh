#!/bin/bash
# ClawBridge Development Launcher (Hot Reload support)

# 1. Kill existing instances
echo "[Init] Cleaning up ports 1337 and 3000..."
fuser -k 1337/tcp 3000/tcp 2>/dev/null

# 2. Check for dependencies in web
if [ ! -d "web/node_modules" ]; then
    echo "[Setup] node_modules not found in web/. Installing..."
    cd web && npm install && cd ..
fi

# 3. Start Backend and Frontend concurrently
echo -e "\033[1;32m[Start] Launching ClawBridge in Development Mode\033[0m"
echo -e "\033[1;34m[Info] Full Stack (Hot Reload): http://127.0.0.1:1337\033[0m"
echo -e "\033[1;35m[Info] Frontend Dev Server: http://127.0.0.1:3000\033[0m"
echo -e "\033[1;33m[Success] Hot Reload is active on both 1337 and 3000!\033[0m"
echo "------------------------------------------------------------"

# Use & and wait to run both
npm run dev:backend &
BACKEND_PID=$!

# Start Frontend Dev Server
cd web && npm run dev -- --port 3000 &
FRONTEND_PID=$!

# Handle shutdown
trap "echo -e '\n\033[1;33m[Stop] Shutting down...\033[0m'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

wait

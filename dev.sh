#!/bin/bash
# ClawBridge Development Launcher
# Usage: ./dev.sh [--fast]
#   --fast: Skip hot reload for faster startup (like start.sh but with dev logs)

FAST_MODE=false
if [ "$1" = "--fast" ] || [ "$1" = "-f" ]; then
    FAST_MODE=true
fi

# 1. Kill existing instances
fuser -k 1337/tcp 3000/tcp 2>/dev/null

# 2. Check for dependencies in web
if [ ! -d "web/node_modules" ]; then
    echo "[Setup] Installing web dependencies..."
    (cd web && npm install)
fi

echo -e "\033[1;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "\033[1;32m🦞 ClawBridge Development Mode\033[0m"

if [ "$FAST_MODE" = true ]; then
    # Fast mode: Build once, serve static (like start.sh but foreground)
    echo -e "\033[1;33m   Mode: Fast (no hot reload)\033[0m"
    echo -e "\033[1;34m   URL: http://127.0.0.1:1337\033[0m"
    echo -e "\033[1;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    
    # Build the UI
    cd web && npm run build && cd ..
    # Clean and move files to public
    rm -rf public/* && cp -r web/out/* public/
    
    # Start Backend in production style (serves static files from /public)
    # Don't set NODE_ENV=development here to avoid proxying
    node server.js
else
    # Normal mode: Hot reload enabled
    echo -e "\033[1;33m   Mode: Hot Reload (use --fast for faster startup)\033[0m"
    echo -e "\033[1;34m   URL: http://127.0.0.1:1337\033[0m"
    echo -e "\033[1;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    
    # Start Backend with proxying enabled
    NODE_ENV=development node server.js &
    BACKEND_PID=$!

    # Start Frontend Dev Server
    (cd web && npm run dev -- --port 3000) &
    FRONTEND_PID=$!

    # Handle shutdown
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
    wait
fi

#!/usr/bin/env bash
set -e

# ClawBridge - Simplified Installer
# This script automates the installation of dependencies and setup.

echo "🦞 ClawBridge Installer"
echo "======================="

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION detected. Node.js 18 or higher is required."
    exit 1
fi

# 2. Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10 or higher."
    exit 1
fi

# 3. Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# 4. Setup Python virtual environment and dependencies
echo "🐍 Setting up Python environment..."
if [ ! -d "gvenv" ]; then
    python3 -m venv gvenv
fi

source gvenv/bin/activate
pip install --upgrade pip
pip install -r requirements.lock || pip install g4f[all] requests curl-cffi uvicorn fastapi python-multipart

# 5. Run the configuration tool
echo "⚙️ Running configuration tool..."
node bin/install.js

echo ""
echo "✅ Installation successful!"
echo "To start ClawBridge, run: ./start.sh"
echo "======================="

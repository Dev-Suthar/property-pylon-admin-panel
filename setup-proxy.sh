#!/bin/bash

# Setup script for Node.js API Proxy
# This script automates the migration from PHP proxy to Node.js proxy

set -e

echo "═══════════════════════════════════════════════════════════"
echo "🚀 Property Pylon API Proxy Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js version: ${NODE_VERSION}${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm is installed${NC}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please update .env file with your configuration${NC}"
    else
        echo "API_BASE_URL=https://api.dreamtobuy.com/api/v1" > .env
        echo "PROXY_PORT=3002" >> .env
        echo "FRONTEND_URL=http://localhost:3001" >> .env
        echo "NODE_ENV=development" >> .env
        echo "VITE_PROXY_URL=http://localhost:3002" >> .env
        echo -e "${YELLOW}⚠️  Created default .env file. Please update with your configuration${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi
echo ""

# Check if port 3002 is available
if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 3002 is already in use${NC}"
    echo "   You may need to stop the existing service or change PROXY_PORT in .env"
else
    echo -e "${GREEN}✅ Port 3002 is available${NC}"
fi
echo ""

# Test proxy server (optional)
read -p "Do you want to test the proxy server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧪 Testing proxy server..."
    echo "   Starting proxy server in background..."
    
    # Start proxy in background
    node proxy-server.js &
    PROXY_PID=$!
    
    # Wait for server to start
    sleep 2
    
    # Test health endpoint
    if curl -s http://localhost:3002/health > /dev/null; then
        echo -e "${GREEN}✅ Proxy server is running and responding${NC}"
        
        # Show health check response
        echo ""
        echo "Health check response:"
        curl -s http://localhost:3002/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3002/health
        echo ""
    else
        echo -e "${RED}❌ Proxy server is not responding${NC}"
    fi
    
    # Stop the test server
    kill $PROXY_PID 2>/dev/null || true
    echo ""
fi

echo "═══════════════════════════════════════════════════════════"
echo "✅ Setup complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. For development, run: ${GREEN}npm run dev:with-proxy${NC}"
echo "3. For production, see PROXY_MIGRATION.md for deployment instructions"
echo ""
echo "Available commands:"
echo "  ${GREEN}npm run proxy${NC}          - Start proxy server only"
echo "  ${GREEN}npm run proxy:prod${NC}     - Start proxy server (production mode)"
echo "  ${GREEN}npm run dev:with-proxy${NC} - Start both proxy and dev server"
echo ""


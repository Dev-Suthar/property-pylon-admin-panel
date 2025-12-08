#!/bin/bash

# Hostinger Deployment Preparation Script
# This script prepares your dist folder for Hostinger deployment

set -e

echo "═══════════════════════════════════════════════════════════"
echo "🚀 Hostinger Deployment Preparation"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ dist folder not found!${NC}"
    echo "   Run 'npm run build' first to create the dist folder."
    exit 1
fi

echo -e "${GREEN}✅ dist folder found${NC}"

# Check required files
echo ""
echo "📋 Checking required files..."

MISSING_FILES=0

if [ ! -f "dist/.htaccess" ]; then
    echo -e "${RED}❌ dist/.htaccess missing${NC}"
    MISSING_FILES=$((MISSING_FILES + 1))
else
    echo -e "${GREEN}✅ dist/.htaccess exists${NC}"
fi

if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ dist/index.html missing${NC}"
    MISSING_FILES=$((MISSING_FILES + 1))
else
    echo -e "${GREEN}✅ dist/index.html exists${NC}"
fi

if [ ! -d "dist/assets" ]; then
    echo -e "${RED}❌ dist/assets folder missing${NC}"
    MISSING_FILES=$((MISSING_FILES + 1))
else
    ASSET_COUNT=$(ls -1 dist/assets/ 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}✅ dist/assets folder exists (${ASSET_COUNT} files)${NC}"
fi

if [ $MISSING_FILES -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ Missing required files. Please run 'npm run build' first.${NC}"
    exit 1
fi

# Check .htaccess configuration
echo ""
echo "⚙️  Checking .htaccess configuration..."

if grep -q "localhost:3002" dist/.htaccess; then
    echo -e "${YELLOW}⚠️  .htaccess points to localhost:3002${NC}"
    echo "   You'll need to update this to point to your proxy server IP/domain"
    echo "   after uploading to Hostinger."
else
    echo -e "${GREEN}✅ .htaccess configured${NC}"
fi

# Show file sizes
echo ""
echo "📊 File Sizes:"
du -sh dist/ | awk '{print "   Total: " $1}'
du -sh dist/assets/ | awk '{print "   Assets: " $1}'

# List files to upload
echo ""
echo "📁 Files to upload to Hostinger public_html:"
echo ""
echo "   Required files:"
echo "   ├── .htaccess"
echo "   ├── index.html"
echo "   └── assets/ (folder with all files)"
echo ""

# Show assets files
if [ -d "dist/assets" ]; then
    echo "   Assets files:"
    ls -1 dist/assets/ | while read file; do
        SIZE=$(du -h "dist/assets/$file" | cut -f1)
        echo "   ├── $file ($SIZE)"
    done | sed '$s/├──/└──/'
fi

# Create deployment package info
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📦 Deployment Package Ready"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ All files are ready for upload!"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Upload to Hostinger:"
echo "   - Go to Hostinger hPanel → File Manager"
echo "   - Navigate to public_html (or your domain folder)"
echo "   - Upload ALL contents of the dist/ folder:"
echo "     • .htaccess"
echo "     • index.html"
echo "     • assets/ (entire folder)"
echo ""
echo "2. Set up Proxy Server:"
echo "   - Upload proxy-server.js to your backend server or VPS"
echo "   - Install dependencies: npm install"
echo "   - Create .env file with your configuration"
echo "   - Start with PM2: pm2 start proxy-server.js --name api-proxy"
echo ""
echo "3. Update .htaccess (if needed):"
echo "   - If proxy is on different server, update localhost:3002"
echo "   - Replace with your proxy server IP/domain"
echo ""
echo "4. Test:"
echo "   - Visit your domain: https://admin.dreamtobuy.com"
echo "   - Check browser console for errors"
echo "   - Try logging in to test API proxy"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Ask if they want to create a zip file
read -p "Do you want to create a ZIP file for easy upload? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ZIP_NAME="hostinger-deploy-$(date +%Y%m%d-%H%M%S).zip"
    echo ""
    echo "📦 Creating ZIP file..."
    cd dist
    zip -r "../$ZIP_NAME" . -x "*.DS_Store" > /dev/null 2>&1
    cd ..
    ZIP_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
    echo -e "${GREEN}✅ Created: $ZIP_NAME (${ZIP_SIZE})${NC}"
    echo ""
    echo "   You can upload this ZIP file to Hostinger and extract it in public_html"
    echo ""
fi

echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Preparation complete!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - HOSTINGER_QUICK_START.md (quick guide)"
echo "   - HOSTINGER_DEPLOYMENT.md (detailed guide)"
echo ""


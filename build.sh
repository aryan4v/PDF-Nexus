#!/bin/bash

# Production Build Script for PDF Nexus

echo "🏗️  Building PDF Nexus for Production..."
echo ""

# Build Frontend
echo "📦 Building Frontend..."
cd "$(dirname "$0")"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend build complete"
echo ""

# Create deployment package
echo "📁 Creating deployment package..."
mkdir -p dist/server
cp -r server/* dist/server/
cp server/package.json dist/server/
cp server/.env dist/server/

echo "✅ Deployment package ready in ./dist"
echo ""

echo "🚀 Production build complete!"
echo ""
echo "Next steps:"
echo "1. Deploy ./dist folder to your hosting service"
echo "2. Set environment variables:"
echo "   - NODE_ENV=production"
echo "   - PORT=3001"
echo "3. Install dependencies: cd dist/server && npm install --production"
echo "4. Start server: node dist/server/server.js"
echo ""

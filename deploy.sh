#!/bin/bash
set -e

# Load NVM and Node/PM2 environment if available (ensures compatibility with GitHub Actions / non-interactive SSH)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH=$PATH:/usr/local/bin:$HOME/.local/bin:$HOME/bin

echo "🚀 Starting CSM Production Deployment..."

echo "📥 [1/5] Pulling latest code from GitHub..."
git pull

echo "📦 [2/5] Installing dependencies..."
npm install
# Ensure Tailwind CSS Oxide & LightningCSS linux native binaries are present on Linux servers
npm install -w csm-web @tailwindcss/oxide-linux-x64-gnu@4.3.3 lightningcss-linux-x64-gnu@1.32.0 --no-save 2>/dev/null || true

echo "🔨 [3/5] Building contracts & backend..."
npm run build:contracts
cd backend
npx prisma generate
npx prisma migrate deploy
npm run build
cd ..

echo "🌐 [4/5] Building Next.js frontend..."
npm run build --workspace=csm-web

echo "🔄 [5/5] Restarting PM2 services..."
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
pm2 save

echo ""
echo "============================================="
echo "✅ CSM DEPLOYMENT / UPDATE COMPLETED!"
echo "============================================="

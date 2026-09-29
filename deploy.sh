#!/bin/bash
set -e

echo "🚀 Starting CSM Production Deployment..."

echo "📥 [1/5] Pulling latest code from GitHub..."
git pull

echo "📦 [2/5] Installing dependencies..."
npm install

echo "🔨 [3/5] Building contracts & backend..."
npm run build:contracts
cd backend
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

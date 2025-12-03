#!/bin/bash

# Render build script with auto-maintenance trigger

echo "🚀 Starting Render deployment..."

# Trigger maintenance mode (if server is already running)
if [ -n "$DEPLOYMENT_SECRET" ]; then
  echo "🔧 Triggering maintenance mode..."
  node trigger-maintenance.js || echo "⚠️ Could not trigger maintenance (server may be down)"
  
  # Wait for maintenance countdown to start
  sleep 2
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build completed
echo "✅ Build completed successfully!"

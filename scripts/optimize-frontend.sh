#!/bin/bash
# Frontend optimization script for AppImage
# This script optimizes the frontend build for AppImage packaging

set -e

echo "⚡ Optimizing frontend for AppImage packaging..."

cd frontend

# Create optimized Vite config for AppImage
cat > vite.config.appimage.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for AppImage
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable source maps for smaller size
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    host: true
  },
  // Replace API URLs for AppImage
  define: {
    'http://localhost:8000': 'location.protocol + "//" + location.hostname + ":8000"'
  }
})
EOF

echo "✅ Created optimized Vite config for AppImage"

# Build with optimized config
echo "🏗️  Building optimized frontend..."
npm run build -- --config vite.config.appimage.ts

echo "📊 Build statistics:"
du -sh dist/
echo "📁 Build contents:"
ls -la dist/

cd ..
echo "✅ Frontend optimization complete!"
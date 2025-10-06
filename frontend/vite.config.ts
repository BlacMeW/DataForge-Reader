import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // load .env files for this mode (development by default)
  const env = loadEnv(mode ?? 'development', '.', '')
  const apiBase = env?.VITE_API_BASE_URL || 'http://localhost:8000'

  return {
  plugins: [react({
    jsxRuntime: 'automatic'
  })],
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime']
  }
  ,
    server: {
      proxy: {
        // Forward API requests to backend during local development
        '/api': {
          target: apiBase,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    }
  }
})

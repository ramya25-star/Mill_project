import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Two pages: the Mill Mate app (index.html) and the Mill Mate Console
  // (console/index.html, served at /console/) for managing companies.
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        console: fileURLToPath(new URL('./console/index.html', import.meta.url))
      }
    }
  },
  // Identifies this web build for over-the-air phone updates; deploy.ps1 sets
  // APP_BUILD (a timestamp) before building. See src/services/liveUpdate.js.
  define: {
    __APP_BUILD__: JSON.stringify(process.env.APP_BUILD || 'dev')
  },
  server: {
    host: '0.0.0.0',
    port: 8002,
    // Forwards API calls to the backend in /server during `npm run dev`, so
    // the frontend can just call same-origin /api paths in every environment.
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
})

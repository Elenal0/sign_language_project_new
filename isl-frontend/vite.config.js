// isl-frontend/vite.config.js

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Use VITE_API_PORT env var — default 8000, fallback to 8001 if needed
  const API_PORT = env.VITE_API_PORT || '8000'
  const httpBackend = `http://localhost:${API_PORT}`
  const wsBackend   = `ws://localhost:${API_PORT}`

  return {
    plugins: [react(), basicSsl()],
    server: {
      port: 5174,
      strictPort: false,   // auto-increment port if 5173 is taken
      host: true,          // exposes to local network
      https: true,         // required for camera access on Android/remote
      open: true,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '.ngrok-free.dev',
        '.ngrok-free.app',
        '.ngrok.app',
        '.ngrok.io',
        '.trycloudflare.com',
        'all',           // allow any host when accessed via ngrok tunnel
      ],
      proxy: {
        // REST endpoints
        '/health':  { target: httpBackend, changeOrigin: true, secure: false },
        '/predict': { target: httpBackend, changeOrigin: true, secure: false },
        // WebSocket signaling + chat relay
        '/ws': {
          target: wsBackend,
          ws: true,
          changeOrigin: true,
          secure: false,
          // prevent ECONNRESET from self-signed cert mismatch
          configure: (proxy) => {
            proxy.on('error', (err) => {
              // suppress noisy proxy errors in dev
              if (err.code !== 'ECONNRESET') console.error('[ws proxy]', err.message)
            })
          },
        },
      },
    },
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { handleVoiceRequest } from './api/voiceHandler.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serverless-voice-dev-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url || '';
          if (url.startsWith('/api/backend/api/voice') || url.startsWith('/api/voice') || url.startsWith('/voice')) {
            const chunks = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const rawBody = Buffer.concat(chunks);
            const path = url.replace(/^\/api\/backend\/api\//, '').replace(/^\/api\//, '').replace(/^\//, '').split('?')[0];
            return handleVoiceRequest(req, res, rawBody, path);
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      },
      '/static': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/n8n-webhook': {
        target: 'https://evoke2026.app.n8n.cloud',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/n8n-webhook/, '/webhook'),
        secure: true,
      },
      '/groq-api': {
        target: 'https://api.groq.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/groq-api/, ''),
        secure: true,
      }
    }
  }
})

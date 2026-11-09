import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  server: {
    port: 3020,
    host: true,
    proxy: {
      // Proxy /llm-gateway/* → public nginx proxy on admin.besewonline.com
      // This avoids CORS in local dev without needing direct server port access
      '/llm-gateway': {
        target: 'https://admin.besewonline.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    port: 3020,
  },
})

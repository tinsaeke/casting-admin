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
      // Proxy /llm-gateway/* → real gateway on server (avoids CORS in local dev)
      '/llm-gateway': {
        target: 'http://196.188.240.111:1218',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/llm-gateway/, ''),
      },
    },
  },
  preview: {
    port: 3020,
  },
})

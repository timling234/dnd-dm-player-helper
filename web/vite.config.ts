import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    allowedHosts: ['.trycloudflare.com', 'app.dmhelper.xyz'],
    hmr: {
      protocol: 'wss',
      clientPort: 443
    },
    proxy: {
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8787', ws: true }
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api-contaazul': {
        target: 'https://api-v2.contaazul.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-contaazul/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['www-authenticate']
            delete proxyRes.headers['WWW-Authenticate']
          })
        }
      },
      '/api-ca-v1': {
        target: 'https://api.contaazul.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-ca-v1/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['www-authenticate']
            delete proxyRes.headers['WWW-Authenticate']
          })
        }
      }
    }
  }
})

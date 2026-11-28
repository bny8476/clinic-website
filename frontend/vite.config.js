import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import viteCompression from 'vite-plugin-compression'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@bklitui/ui/charts': path.resolve(__dirname, './src/components/ui/charts.jsx'),
      '@bklitui/ui/sparkline': path.resolve(__dirname, './src/components/ui/sparkline.jsx'),
      '@bklitui/ui': path.resolve(__dirname, './src/components/ui')
    }
  },
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip' }),
    viteCompression({ algorithm: 'brotliCompress' }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Clinic Management System',
        short_name: 'ClinicApp',
        description: 'Healthcare clinic management platform',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone'
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } },
    watch: {
      ignored: [
        '**/dist/**',
        '**/.git/**',
        '**/coverage/**',
        '**/node_modules/**'
      ]
    }
  }
})

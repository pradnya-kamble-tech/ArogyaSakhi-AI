import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const API = 'http://127.0.0.1:8001';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'ArogyaSakhi Offline DSS',
        short_name: 'ArogyaSakhi',
        theme_color: '#FAF8F5',
        start_url: '/',
        display: 'standalone',
        icons: [{ src: '/vite.svg', sizes: '192x192', type: 'image/svg+xml' }]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/auth': { target: API, changeOrigin: true, secure: false },
      '/api': { target: API, changeOrigin: true, secure: false },
      '/patients': { target: API, changeOrigin: true, secure: false },
      '/ai': { target: API, changeOrigin: true, secure: false },
      '/hospitals': { target: API, changeOrigin: true, secure: false },
      '/admin': { target: API, changeOrigin: true, secure: false },
      '/sync': { target: API, changeOrigin: true, secure: false },
      '/uploads': { target: API, changeOrigin: true, secure: false },
      '/health': { target: API, changeOrigin: true, secure: false }
    }
  }
});

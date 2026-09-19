import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API = 'http://127.0.0.1:8001';

export default defineConfig({
  plugins: [react()],
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

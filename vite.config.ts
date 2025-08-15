import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          // Fallback to direct Google Sheets URL if local API not available
          proxy.on('error', (err, req, res) => {
            console.log('API proxy error, check if backend is running');
          });
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
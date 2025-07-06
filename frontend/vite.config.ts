import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: ".",
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/generate': {
        target: `http://localhost:${process.env.PORT || 5000}`,
        changeOrigin: true,
        secure: false,
      },
      '/history': {
        target: `http://localhost:${process.env.PORT || 5000}`,
        changeOrigin: true,
        secure: false,
      },
    }
  }
});

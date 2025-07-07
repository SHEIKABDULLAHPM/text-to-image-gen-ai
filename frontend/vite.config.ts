import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  
  plugins: [react()],
  build: {
    outDir: 'dist', // <-- this is default but make sure it's present
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
  proxy: {
    '/generate': 'http://localhost:5000',
    '/history': 'http://localhost:5000'
  }
}

});
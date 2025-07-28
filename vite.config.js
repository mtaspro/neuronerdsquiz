import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    root: '.',
    publicDir: 'public',
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            animations: ['framer-motion']
          }
        }
      }
    },
    server: mode === 'development' ? {
      proxy: {
        '/api': 'http://localhost:5000'
      }
    } : {},
    preview: {
      port: 4173
    }
  };
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': 'http://localhost:5000'
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});

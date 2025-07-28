import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    server: mode === 'development' ? {
      proxy: {
        '/api': 'http://localhost:5000'
      }
    } : {}
  };
});

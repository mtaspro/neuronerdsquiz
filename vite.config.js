import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      allowedHosts: true, // ← এখানে নির্দিষ্ট URL-এর বদলে true দিয়ে দিন
      proxy: {
        '/api': 'http://localhost:5000'
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            animation: ['framer-motion'],
            math: ['katex'],
            utils: ['axios', 'socket.io-client']
          }
        }
      }
    }
  };
});
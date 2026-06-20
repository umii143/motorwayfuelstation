import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'unsafe-none',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/server_database.enc', '**/.wwebjs_auth/**', '**/.wwebjs_cache/**'],
      },
    },
    build: {
      target: 'es2015',      // Android WebView compatible
      minify: 'terser' as const,
      terserOptions: {
        compress: {
          drop_console: true,   // remove all console.log
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            animations: ['framer-motion'],
            charts: ['recharts'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});

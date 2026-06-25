import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

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
          drop_console: true,   // remove all console.log in production
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          // Intelligent manual chunking strategy for maximum code splitting
          manualChunks: (id: string) => {
            // Core vendor libs — load first, cached long-term
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            // Animation library
            if (id.includes('node_modules/framer-motion')) {
              return 'vendor-animations';
            }
            // Chart library
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
              return 'vendor-charts';
            }
            // PDF generation (heavy — lazy loaded)
            if (id.includes('node_modules/@react-pdf') || id.includes('node_modules/jspdf')) {
              return 'vendor-pdf';
            }
            // Firebase — frequently shared, keep together
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'vendor-firebase';
            }
            // AI / ML — lazy loaded
            if (id.includes('node_modules/@google/genai') || id.includes('node_modules/groq-sdk')) {
              return 'vendor-ai';
            }
            // Capacitor — only used on native
            if (id.includes('node_modules/@capacitor')) {
              return 'vendor-capacitor';
            }
            // All other node_modules
            if (id.includes('node_modules')) {
              return 'vendor-misc';
            }
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});

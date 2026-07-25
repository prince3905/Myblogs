import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  esbuild: {
    target: 'es2022',
    legalComments: 'none',
  },
  build: {
    outDir: '../server/public',
    emptyOutDir: true,
    target: 'es2022',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui/icons-material')) {
              return 'vendor-icons';
            }
            if (id.includes('@mui') || id.includes('@emotion') || id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-framework';
            }
          }
        }
      }
    }
  },
})

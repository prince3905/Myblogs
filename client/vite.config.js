import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: '../server/public',
    emptyOutDir: true,
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    modulePreload: false, // Disable render-blocking modulepreload links in HTML for heavy vendor chunks
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui/icons-material')) {
              return 'vendor-icons';
            }
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-mui';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) {
              return 'vendor-core';
            }
          }
        }
      }
    }
  },
})

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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('@mui/material') ||
              id.includes('@mui/icons-material') ||
              id.includes('@mui/system') ||
              id.includes('@mui/styled-engine') ||
              id.includes('@emotion')
            ) {
              return 'vendor-mui';
            }
          }
        }
      }
    }
  },
})

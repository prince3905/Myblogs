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
            if (id.includes('@imgly/background-removal')) {
              return 'vendor-bg-removal';
            }
            if (id.includes('jspdf') || id.includes('pdf-lib') || id.includes('pdfjs-dist')) {
              return 'vendor-pdf';
            }
            if (id.includes('html2canvas')) {
              return 'vendor-canvas';
            }
          }
        }
      }
    }
  },
})

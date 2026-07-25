import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function nonBlockingCssPlugin() {
  return {
    name: 'non-blocking-css-plugin',
    transformIndexHtml(html) {
      // 1. Strip modulepreload tags for heavy non-homepage vendor chunks
      let cleaned = html.replace(
        /<link rel="modulepreload"[^>]+href="[^"]*(vendor-pdf-tools|vendor-editor|vendor-date-pickers)[^"]*"[^>]*>/g,
        ''
      );

      // 2. Convert stylesheet links to non-blocking async loaders
      return cleaned.replace(
        /<link rel="stylesheet"([^>]+)href="([^"]+\.css)"([^>]*)>/g,
        '<link rel="stylesheet"$1href="$2"$3 media="print" onload="this.media=\'all\'"><noscript><link rel="stylesheet"$1href="$2"$3></noscript>'
      );
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), nonBlockingCssPlugin()],
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
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: true,
    chunkSizeWarningLimit: 2000,
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
            if (id.includes('@mui/x-date-pickers') || id.includes('date-fns')) {
              return 'vendor-date-pickers';
            }
            if (id.includes('jspdf') || id.includes('pdfjs-dist') || id.includes('pdf-lib') || id.includes('html2canvas')) {
              return 'vendor-pdf-tools';
            }
            if (id.includes('react-quill') || id.includes('prismjs')) {
              return 'vendor-editor';
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

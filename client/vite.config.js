import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function nonBlockingCssPlugin() {
  return {
    name: 'non-blocking-css-plugin',
    transformIndexHtml(html) {
      return html.replace(
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
    sourcemap: true,
    cssCodeSplit: true,
    cssMinify: true,
    chunkSizeWarningLimit: 2000,
    modulePreload: {
      polyfill: false,
      resolveDependencies(filename, deps) {
        return deps.filter(dep => 
          !dep.includes('vendor-pdf-tools') && 
          !dep.includes('vendor-editor') && 
          !dep.includes('vendor-date-pickers')
        );
      }
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

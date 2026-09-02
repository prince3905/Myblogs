import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function nonBlockingCssPlugin() {
  return {
    name: 'non-blocking-css-plugin',
    transformIndexHtml(html) {
      // 1. Strip modulepreload tags for heavy non-homepage vendor chunks
      let cleaned = html.replace(
        /<link rel="modulepreload"[^>]+href="[^"]*(vendor-pdf-tools|vendor-html2canvas|vendor-editor|vendor-date-pickers)[^"]*"[^>]*>/g,
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
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  },
})

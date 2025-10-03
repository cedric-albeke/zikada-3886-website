import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Use default esbuild minification to avoid optional terser dependency
    minify: 'esbuild',
    rollupOptions: {
      // Ensure multi-page build includes the control panel
      input: {
        main: resolve(__dirname, 'index.html'),
        controlPanel: resolve(__dirname, 'control-panel.html')
      },
      output: {
        manualChunks: {
          'three': ['three'],
          'gsap': ['gsap'],
          'effects': ['postprocessing', 'simplex-noise']
        }
      }
    }
  },
  server: {
    port: 3886,
    open: true,
    allowedHosts: ['chaos.3886.io']
  }
});

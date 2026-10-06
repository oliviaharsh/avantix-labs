import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { renderSite } from './src/render/render.js';

// Injects the build-time rendered markup into index.html (dev and build).
const injectSite = () => ({
  name: 'avantix-render',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html.replace('<div id="app"></div>', renderSite()),
  },
});

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: [injectSite(), ...(single ? [viteSingleFile({ removeViteModuleLoader: true })] : [])],
    build: {
      outDir: single ? 'dist-single' : 'dist',
      target: 'es2020',
      assetsInlineLimit: single ? 100_000_000 : 4096,
      chunkSizeWarningLimit: 1600,
      cssCodeSplit: !single,
    },
    server: { port: 5173, host: '127.0.0.1' },
  };
});

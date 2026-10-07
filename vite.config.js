import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { renderSite, structuredData } from './src/render/render.js';
import { site } from './src/content/content.js';

// Injects the build-time rendered markup into index.html (dev and build).
const injectSite = () => ({
  name: 'avantix-render',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => {
      let out = html.replace('<div id="app"></div>', renderSite()).replace('<!-- structured-data -->', structuredData());
      if (site.url) {
        // link previews (WhatsApp, LinkedIn, X) need absolute URLs
        out = out
          .replace('<meta property="og:image" content="og-image.png" />', `<meta property="og:image" content="${site.url}og-image.png" />
  <meta property="og:url" content="${site.url}" />
  <link rel="canonical" href="${site.url}" />`);
      }
      return out;
    },
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

import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { renderSite, structuredData, logo } from './src/render/render.js';
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

// sitemap.xml, robots.txt and a 404 page, written from site.url so they follow the domain.
const siteFiles = () => ({
  name: 'avantix-site-files',
  apply: 'build',
  generateBundle() {
    if (!site.url) return;
    const today = new Date().toISOString().slice(0, 10);
    this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${site.url}</loc><lastmod>${today}</lastmod></url>
</urlset>
` });
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *
Allow: /

Sitemap: ${site.url}sitemap.xml
` });
    this.emitFile({ type: 'asset', fileName: '404.html', source: `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Page not found · Avantix Labs</title>
<meta name="robots" content="noindex" />
<link rel="icon" href="${site.url}favicon.svg" type="image/svg+xml" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Manrope:wght@500;600&display=swap" />
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #F3F0E8; color: #191814; font: 500 16px/1.6 Manrope, system-ui, sans-serif; padding: 24px; box-sizing: border-box; --logo-acc: #8A4B2A; }
  main { max-width: 520px; display: grid; gap: 22px; }
  .logo { width: 170px; height: auto; }
  h1 { margin: 0; font: 400 clamp(40px, 8vw, 64px)/1 "Instrument Serif", Georgia, serif; letter-spacing: -.01em; }
  h1 em { color: #8A4B2A; }
  p { margin: 0; color: #5E5A51; }
  nav { display: flex; flex-wrap: wrap; gap: 12px; }
  main > a { color: #191814; display: inline-block; }
  a.btn { display: inline-flex; padding: 13px 20px; border-radius: 999px; text-decoration: none; font-weight: 600; background: #8A4B2A; color: #F3F0E8; }
  a.btn.ghost { background: transparent; color: #191814; box-shadow: inset 0 0 0 1px rgba(25, 24, 20, .25); }
</style>
</head>
<body>
<main>
  <a href="${site.url}" aria-label="Avantix Labs home">${logo.horizontal('')}</a>
  <h1>This page <em>doesn’t exist.</em></h1>
  <p>The link may be old or mistyped. Everything we do is on the home page.</p>
  <nav><a class="btn" href="${site.url}">Go to the home page</a><a class="btn ghost" href="${site.url}#contact">Start a project</a></nav>
</main>
</body>
</html>
` });
  },
});

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: [injectSite(), ...(single ? [viteSingleFile({ removeViteModuleLoader: true })] : [siteFiles()])],
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

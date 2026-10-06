// Turns the single-file build into a page body for Claude Artifacts (the host adds its own
// <!doctype>, <html>, <head> and <body>), and drops links to public/ files the artifact can't serve.
import { readFileSync, writeFileSync } from 'node:fs';

const src = new URL('../dist-single/index.html', import.meta.url);
let html = readFileSync(src, 'utf8');
const title = (html.match(/<title>[\s\S]*?<\/title>/) || [''])[0];
html = html
  .replace(/<!doctype html>/i, '')
  .replace(/<\/?html[^>]*>/gi, '')
  .replace(/<\/?head>/gi, '')
  .replace(/<body[^>]*>/i, '')
  .replace(/<\/body>/i, '')
  .replace(/<meta charset[^>]*>\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '')
  .replace(/<link rel="(icon|apple-touch-icon|manifest)"[^>]*>\s*/gi, '')
  .replace(/<meta property="og:image"[^>]*>\s*/i, '')
  .replace(title, '');
// the artifact gallery wants a short name; the real site keeps its longer SEO title
html = `<title>Avantix Labs</title>\n${html.trim()}\n`;
const out = new URL('../dist-single/avantix-labs.html', import.meta.url);
writeFileSync(out, html);
console.log(`artifact page: ${(html.length / 1024 / 1024).toFixed(2)} MB`);

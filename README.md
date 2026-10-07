# Avantix Labs website

**Live preview:** https://oliviaharsh.github.io/avantix-labs/ (add `#intro` to replay the intro).
Every push to `main` rebuilds and redeploys automatically (`.github/workflows/deploy.yml`).

The studio's own site: a neural "idea" intro, a 3D sculpture of the Avantix mark in the hero, and a live demo for each of the eight services. Theme: **Sculpted Ivory** (ivory, limestone, espresso, bronze; Instrument Serif + Manrope). Logo: the Keystone kit in `src/assets/logo/`.

## Run it

```bash
npm install
npm run dev          # http://127.0.0.1:5173
npm run build        # production build in dist/ (static, deploy anywhere)
npm run build:single # one self-contained HTML file in dist-single/ (for quick sharing)
```

Add `#intro` to the URL to replay the intro; otherwise it plays once per browser session.

## Edit the words

Everything a visitor reads lives in **`src/content/content.js`**: hero copy, the eight services (taglines, descriptions, what's included, prices, timelines), process steps, founders (Parth first) and contact options. The HTML is generated from that file at build time, so the page stays fully indexable.

Before launch, in the same file:

| Setting | What it does |
|---|---|
| `formEndpoint` | Where the enquiry form posts (Formspree, Basin or your own API). While empty, the form tells the visitor nothing was sent. |
| `bookingUrl` | A Cal.com or Calendly link for every "Book a call" button. Empty = scroll to the form. |
| `showPrices` | Set to `false` to hide prices on the service chapters. |
| `url` | The public address, used for link previews. Change it when the real domain is live. |

## How it is built

| Part | Files | Notes |
|---|---|---|
| Intro | `src/intro/brain.js`, `src/intro/intro.js` | Procedural brain (≈9,500 cortex points, 950 neurons, wiring), electricity spreads along shortest paths from one spark; bloom via `postprocessing`. Ends on ivory, logo flies into the nav. |
| Hero | `src/hero/hero.js`, `src/hero/stone.js` | The logo's own polygons extruded into travertine, dark bronze and polished bronze; procedural stone shaders, window light, N8AO ambient occlusion. Scrolling swings the camera until the pieces line up into the mark. |
| Demos | `src/demos/*.js` | Lazy-loaded per chapter and paused off screen. All businesses in the demos are fictional and labelled as such. |
| Motion | `src/lib/ui.js` | Lenis smooth scroll, GSAP ScrollTrigger and SplitText reveals, magnetic buttons, 3D tilt, custom cursor. |
| Markup | `src/render/render.js` | Build-time renderer used by `vite.config.js`. |

Accessibility and fallbacks: `prefers-reduced-motion` skips the intro and heavy motion; no WebGL falls back to static backgrounds; demos work with mouse, touch and keyboard.

## Assets and credits

- Fonts: Instrument Serif and Manrope (SIL Open Font License), self-hosted via Fontsource.
- Globe land data: Natural Earth 1:110m (public domain), converted by `scripts/land-mask.mjs`.
- Demo photos (`src/assets/demo/`): generated for this site, used only inside the fictional mockups.

## Before going live

- Connect the form and booking link (above), add privacy and cookie pages, and set the final domain in the `og:` tags.
- Confirm founder bios in `content.js`.
- Prices come from the business plan; adjust or hide them.

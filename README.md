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

Prices and the founders section are switched off for now (`showPrices: false`, `showFounders: false`). Their text is still in `content.js`, so either comes back by setting its switch to `true`.

Before launch, in the same file:

| Setting | What it does |
|---|---|
| `formEndpoint` | Where the enquiry form posts (Formspree, Basin or your own API). While empty, the form tells the visitor nothing was sent. |
| `bookingUrl` | A Cal.com or Calendly link for every "Book a call" button. Empty = scroll to the form. |
| `showPrices` | `true` shows the prices on the service chapters and care plans. Off for now. |
| `showFounders` | `true` shows the founders section, its menu link and the founders in the footer and search data. Off for now. |
| `url` | The public address, used for link previews. Change it when the real domain is live. |

## How it is built

| Part | Files | Notes |
|---|---|---|
| Intro | `src/intro/brain.js`, `src/intro/intro.js` | Procedural brain (≈9,500 cortex points, 950 neurons, wiring), electricity spreads along shortest paths from one spark; bloom via `postprocessing`. Ends on ivory, logo flies into the nav. |
| Hero | `src/hero/hero.js`, `src/hero/stone.js` | The logo's own polygons extruded into travertine, dark bronze and polished bronze; procedural stone shaders, window light. Scrolling swings the camera until the pieces line up into the mark. |
| Demos | `src/demos/*.js` | Each demo's markup is built at load (so the page height never changes later); the 3D ones (speaker, globe) are built in quiet moments or as their chapter approaches, and everything pauses off screen. All businesses in the demos are fictional and labelled as such. |
| GPU helpers | `src/lib/gpu.js`, `src/lib/env.js` | Device tiers, the hero's frame-budget governor, background shader compiling, and the pre-baked lighting environment. |
| Motion | `src/lib/ui.js` | Lenis smooth scroll, GSAP ScrollTrigger and SplitText reveals, magnetic buttons, 3D tilt, custom cursor. |
| Markup | `src/render/render.js` | Build-time renderer used by `vite.config.js`. |

## Performance

The site is tuned to stay at 60 fps on an ordinary laptop (measured on Intel Iris Xe at 1920×1080):

- **Hero**: drawn straight to the canvas (multisampling, tone mapping in the materials, CSS vignette) instead of a post-processing chain; shadow maps are drawn once because nothing that casts them moves; `src/lib/gpu.js` picks a pixel budget for the device and lowers the resolution if a frame takes more than about 9 ms of GPU time. About 8 ms per frame on Iris Xe, down from 37.
- **No freezes on load or scroll**: shaders compile in the background (`renderer.compileAsync`, and `compileComposer` for the intro's bloom chain), so the page keeps running. The intro waits on a loading bar until they are ready (about a second on a first visit, much less after).
- **Lighting**: the studio environment used by the hero and the speaker is pre-filtered once and stored as `src/assets/env/room-env.bin.gz` (40 KB). After a three.js upgrade, re-bake it: run `npm run dev`, open `/scripts/bake-env.html` and save the download over that file.
- **Demos**: see the table above. 3D demos run only while visible.

Accessibility and fallbacks: `prefers-reduced-motion` skips the intro and heavy motion; no WebGL falls back to static backgrounds; demos work with mouse, touch and keyboard.

## Assets and credits

- Fonts: Instrument Serif and Manrope (SIL Open Font License), self-hosted via Fontsource.
- Globe land data: Natural Earth 1:110m (public domain), converted by `scripts/land-mask.mjs`.
- Demo photos (`src/assets/demo/`): generated for this site, used only inside the fictional mockups.
- Lighting environment: three.js `RoomEnvironment` (MIT), pre-filtered by `scripts/bake-env.html`.

## Before going live

- Connect the form and booking link (above), add privacy and cookie pages, and set the final domain in `site.url`.
- When ready, confirm founder bios and prices in `content.js` and switch them back on.

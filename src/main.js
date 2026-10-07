import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/manrope';
import './styles/base.css';
import './styles/sections.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { runIntro } from './intro/intro.js';
import { createHero } from './hero/hero.js';
import { initUI, revealHero } from './lib/ui.js';
import { initDemos } from './demos/index.js';

window.__avxBooted = true; // tells the failsafe in index.html that the app started
gsap.registerPlugin(ScrollTrigger, SplitText);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync
const lenis = new Lenis({ lerp: reduce ? 1 : 0.1, smoothWheel: !reduce, anchors: { offset: -40 } });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
// during the intro, a slow frame should pause the story rather than skip part of it;
// once smooth scrolling starts, Lenis wants lag smoothing off (see reveal below)
gsap.ticker.lagSmoothing(500, 33);
lenis.stop();
window.__lenis = lenis;
if (import.meta.env.DEV) { window.__gsap = gsap; window.__onGsap?.(gsap); } // dev only: lets the video recorder slow the clock

// always start at the top; the intro is the front door
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const wantsIntro = location.hash === '#intro';
if (wantsIntro) { try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { /* sandboxed frame */ } }
window.scrollTo(0, 0);

const hero = createHero(document.querySelector('[data-hero-canvas]'));
const heroReady = hero.prepare(); // decode, compile and draw the shadows now, in the background
initUI({ lenis });
const demos = initDemos();

// Keep the scroll animations measured against the real page: if its height changes after load
// (fonts, demos, a sent form), re-measure once scrolling has settled.
let pageH = 0, remeasureTimer = 0;
const remeasure = () => {
  if (lenis.isScrolling) { remeasureTimer = setTimeout(remeasure, 250); return; }
  ScrollTrigger.refresh();
};
new ResizeObserver(() => {
  const h = document.documentElement.scrollHeight;
  if (Math.abs(h - pageH) < 4) return;
  pageH = h;
  clearTimeout(remeasureTimer);
  remeasureTimer = setTimeout(remeasure, 300);
}).observe(document.body);

let revealed = false;
const reveal = () => {
  if (revealed) return;
  revealed = true;
  revealHero();
  hero.reveal();
  gsap.ticker.lagSmoothing(0);
  lenis.start();
  ScrollTrigger.refresh();
  setTimeout(() => demos.warm(), 3400); // once the hero has settled, prepare the demos in quiet moments
};
// if anything in the intro fails, go straight to the site rather than leave a dark screen
const skipToSite = (err) => {
  if (err) console.error('Intro failed, showing the site', err);
  document.querySelector('[data-intro]')?.remove();
  document.body.classList.remove('is-locked', 'is-loading');
  const navLogo = document.querySelector('[data-nav-logo]');
  if (navLogo) navLogo.style.visibility = 'visible';
  hero.start();
  reveal();
};
try {
  runIntro({ force: wantsIntro, heroReady, onLight: () => hero.start(), onReveal: reveal, onFail: skipToSite });
} catch (err) {
  skipToSite(err);
}
// last resort: if the intro is still on screen after 16 seconds and has stopped drawing, show the site
const watchdog = () => {
  if (!document.querySelector('[data-intro]')) return;
  if (performance.now() - (window.__avxIntroAlive || 0) < 1500) { setTimeout(watchdog, 2000); return; }
  skipToSite(new Error('intro stalled'));
};
setTimeout(watchdog, 16000);

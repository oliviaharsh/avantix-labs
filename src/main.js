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

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync
const lenis = new Lenis({ lerp: reduce ? 1 : 0.09, smoothWheel: !reduce, wheelMultiplier: 0.95, anchors: { offset: -40 } });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();
window.__lenis = lenis;
if (import.meta.env.DEV) window.__gsap = gsap;

// always start at the top; the intro is the front door
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const wantsIntro = location.hash === '#intro';
if (wantsIntro) { try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { /* sandboxed frame */ } }
window.scrollTo(0, 0);

const hero = createHero(document.querySelector('[data-hero-canvas]'));
initUI({ lenis });
initDemos();

runIntro({
  force: wantsIntro,
  onLight: () => hero.start(),
  onReveal: () => {
    revealHero();
    hero.reveal();
    lenis.start();
    ScrollTrigger.refresh();
  },
});

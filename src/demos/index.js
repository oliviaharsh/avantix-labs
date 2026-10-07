// Live demos, in two steps:
// 1. Every demo's markup goes in as soon as its code arrives, so the page has its final height from
//    the start (anchor links and the scroll animations are measured against it). This is cheap.
// 2. The heavy parts (the 3D ones) are built in quiet moments after the intro, one at a time, or as
//    soon as their chapter comes near. Nothing heavy is built mid-scroll.
// Demos only run while they are on screen.
import './demos.css';

const loaders = {
  webdev: () => import('./webdev.js'),
  product3d: () => import('./product3d.js'),
  automation: () => import('./automation.js'),
  aiagent: () => import('./aiagent.js'),
  booking: () => import('./booking.js'),
  rota: () => import('./rota.js'),
  monitoring: () => import('./monitoring.js'),
  export: () => import('./export.js'),
};

export function initDemos() {
  const figures = [...document.querySelectorAll('[data-demo]')];

  const visible = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const api = e.target.__demo;
      if (!api) return;
      if (e.isIntersecting) api.resume?.(); else api.pause?.();
    });
  }, { rootMargin: '10% 0px' });

  const mounted = Promise.all(figures.map(async (fig) => {
    const name = fig.dataset.demo;
    const stage = fig.querySelector('[data-demo-stage]');
    try {
      const mod = await loaders[name]();
      fig.__demo = mod.mount(stage, fig) || {};
      visible.observe(fig);
    } catch (err) {
      console.error(`Demo "${name}" failed to load`, err);
      stage.innerHTML = '<p class="demo-error">This demo could not load in your browser.</p>';
    }
  }));

  const start = (fig) => mounted.then(() => fig.__demo?.start?.());
  const near = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { near.unobserve(e.target); start(e.target); } });
  }, { rootMargin: '150% 0px' });
  figures.forEach((f) => near.observe(f));

  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 120));
  let queue = null;
  const next = () => {
    const fig = queue.shift();
    if (fig) idle(() => start(fig).then(() => setTimeout(next, 150)), { timeout: 3000 });
  };
  return {
    mounted,
    warm() {
      if (queue) return;
      queue = [];
      mounted.then(() => { queue.push(...figures.filter((f) => f.__demo?.start)); next(); });
    },
  };
}

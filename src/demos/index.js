// Live demos: each one is lazy-loaded as its chapter approaches, and paused when off screen.
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
  const mounted = new Map();

  const visible = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const api = mounted.get(e.target);
      if (!api) return;
      if (e.isIntersecting) api.resume?.(); else api.pause?.();
    });
  }, { rootMargin: '10% 0px' });

  const near = new IntersectionObserver((entries) => {
    entries.forEach(async (e) => {
      if (!e.isIntersecting) return;
      near.unobserve(e.target);
      const name = e.target.dataset.demo;
      const stage = e.target.querySelector('[data-demo-stage]');
      try {
        const mod = await loaders[name]();
        const api = mod.mount(stage, e.target) || {};
        mounted.set(e.target, api);
        visible.observe(e.target);
      } catch (err) {
        console.error(`Demo "${name}" failed to load`, err);
        stage.innerHTML = '<p class="demo-error">This demo could not load in your browser.</p>';
      }
    });
  }, { rootMargin: '120% 0px' });

  figures.forEach((f) => near.observe(f));
}

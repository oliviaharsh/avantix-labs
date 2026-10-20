// 01 Web development: six client sites (fictional businesses), each before and after our redesign.
// Browser tabs switch between them and the handle compares old and new. Until the visitor touches it,
// the demo tours the sites by itself.
import { clients } from './webdev-sites.js';
import './webdev-sites.css';
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/fraunces/wght-italic.css';
import '@fontsource-variable/cormorant/wght.css';
import '@fontsource-variable/cormorant/wght-italic.css';
import '@fontsource-variable/bodoni-moda/wght.css';
import '@fontsource-variable/bodoni-moda/wght-italic.css';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/newsreader/wght.css';
import '@fontsource-variable/newsreader/wght-italic.css';

const DESIGN_W = 1200;
const TOUR_MS = 7000;
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));

// A site's photo and fonts, each fetched once. Fonts only download when a site is about to be shown:
// every font that arrives makes the page's split headings re-measure, so none should land mid-scroll.
const loads = new Map();
const once = (key, fn) => { if (!loads.has(key)) loads.set(key, fn()); return loads.get(key); };
const loadImage = (c) => once(`img:${c.id}`, () => { const img = new Image(); img.src = c.img; return img.decode().catch(() => {}); });
const loadFonts = (c) => once(`font:${c.id}`, () => Promise.all(c.fonts.map((f) => document.fonts.load(f).catch(() => {}))));
const prepare = (c) => Promise.all([loadImage(c), loadFonts(c)]);

const icon = {
  back: '<svg viewBox="0 0 16 16"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fwd: '<svg viewBox="0 0 16 16"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  reload: '<svg viewBox="0 0 16 16"><path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="4.5" width="7" height="5" rx="1" fill="currentColor"/><path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
};

const notesHtml = (c) => c.notes.map((n, i) => `<span class="wd__note"><b>0${i + 1}</b> ${n}</span>`).join('');

export function mount(stage) {
  const first = clients[0];
  stage.innerHTML = `
  <div class="frame wd" style="--tour:${TOUR_MS}ms">
    <div class="wd__chrome">
      <div class="wd__tabs">
        <span class="wd__dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <div class="wd__strip" role="tablist" aria-label="Client websites" data-strip>
          ${clients.map((c, i) => `
          <button class="wd__tab" type="button" role="tab" id="wd-tab-${c.id}" aria-controls="wd-view" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tab>
            <span class="wd__fav" style="--fav:${c.fav}" aria-hidden="true">${c.initial}</span>
            <span class="wd__tabname">${c.kind}<small> · ${c.name}</small></span>
            <i class="wd__prog" aria-hidden="true"></i>
          </button>`).join('')}
        </div>
      </div>
      <div class="frame__bar wd__bar">
        <span class="wd__navic" aria-hidden="true">${icon.back}${icon.fwd}${icon.reload}</span>
        <div class="frame__url">${icon.lock}<span data-url>${first.url}</span></div>
      </div>
    </div>
    <div class="wd__view" id="wd-view" role="tabpanel" aria-labelledby="wd-tab-${first.id}" data-view>
      <div class="wd__site wd__after" data-site data-after>${first.after()}</div>
      <div class="wd__site wd__before" data-site data-before>${first.before()}</div>
      <span class="wd__label wd__label--b">Before</span>
      <span class="wd__label wd__label--a">After</span>
      <div class="wd__handle" data-handle role="slider" tabindex="0" aria-label="Compare the old and new website" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" data-cursor="Drag">
        <span class="wd__knob"><svg viewBox="0 0 26 14" aria-hidden="true"><path d="M7 2 2 7l5 5M19 2l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </div>
    </div>
  </div>
  <div class="wd__notes" data-notes>${notesHtml(first)}</div>`;

  const frame = stage.querySelector('.wd');
  const view = stage.querySelector('[data-view]');
  const sites = stage.querySelectorAll('[data-site]');
  const afterEl = stage.querySelector('[data-after]');
  const beforeEl = stage.querySelector('[data-before]');
  const handle = stage.querySelector('[data-handle]');
  const strip = stage.querySelector('[data-strip]');
  const tabs = [...stage.querySelectorAll('[data-tab]')];
  const urlEl = stage.querySelector('[data-url]');
  const notesEl = stage.querySelector('[data-notes]');
  let pct = 50, target = 50, raf = 0;
  let auto = true; // false once the visitor drags the handle or picks a tab themselves

  const fit = () => {
    const s = view.clientWidth / DESIGN_W;
    sites.forEach((el) => { el.style.transform = `scale(${s})`; });
  };
  new ResizeObserver(fit).observe(view);
  fit();

  const apply = () => {
    beforeEl.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left = `${pct}%`;
    handle.setAttribute('aria-valuenow', String(Math.round(pct)));
  };
  const tick = () => {
    pct += (target - pct) * 0.18;
    apply();
    raf = Math.abs(target - pct) > 0.05 ? requestAnimationFrame(tick) : 0;
  };
  const go = (v) => { target = Math.max(0, Math.min(100, v)); if (!raf) raf = requestAnimationFrame(tick); };
  apply();

  // a slow sweep across each site, so the before and after both get seen
  let timers = [];
  const sweep = () => {
    timers.forEach(clearTimeout);
    timers = [[500, 80], [1700, 20], [2900, 50]].map(([t, v]) => setTimeout(() => auto && go(v), t));
  };

  // the visitor has taken over: stop the tour and the sweeps
  const takeOver = () => {
    auto = false;
    frame.classList.remove('is-touring');
    timers.forEach(clearTimeout);
  };

  // drag anywhere on the view
  let dragging = false;
  const fromEvent = (e) => { const r = view.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
  view.addEventListener('pointerdown', (e) => { dragging = true; takeOver(); view.setPointerCapture(e.pointerId); go(fromEvent(e)); });
  view.addEventListener('pointermove', (e) => { if (dragging) go(fromEvent(e)); });
  view.addEventListener('pointerup', () => { dragging = false; });
  view.addEventListener('pointercancel', () => { dragging = false; });
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { takeOver(); go(target - 5); e.preventDefault(); }
    if (e.key === 'ArrowRight') { takeOver(); go(target + 5); e.preventDefault(); }
  });

  // switching sites
  let current = 0, token = 0;
  const keepInView = (tab) => {
    const l = tab.offsetLeft, r = l + tab.offsetWidth;
    if (l < strip.scrollLeft) strip.scrollTo({ left: l - 8, behavior: 'smooth' });
    else if (r > strip.scrollLeft + strip.clientWidth) strip.scrollTo({ left: r - strip.clientWidth + 8, behavior: 'smooth' });
  };
  async function select(i) {
    if (i === current) return;
    current = i;
    const c = clients[i], mine = ++token;
    tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; });
    keepInView(tabs[i]);
    urlEl.textContent = c.url;
    view.setAttribute('aria-labelledby', tabs[i].id);
    timers.forEach(clearTimeout);
    view.classList.add('is-switching');
    // wait for the fade, the photo and the fonts (but never long), so the new site appears whole
    await Promise.all([wait(200), Promise.race([prepare(c), wait(900)])]);
    if (mine !== token) return;
    afterEl.innerHTML = c.after();
    beforeEl.innerHTML = c.before();
    notesEl.innerHTML = notesHtml(c);
    pct = target = 50;
    apply();
    view.classList.remove('is-switching');
    if (auto && !reduce()) sweep();
    if (frame.classList.contains('is-touring')) prepare(clients[(i + 1) % clients.length]);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => { takeOver(); select(i); });
    // start fetching a site as soon as the pointer heads for its tab
    tab.addEventListener('pointerenter', () => prepare(clients[i]));
  });
  strip.addEventListener('keydown', (e) => {
    const n = clients.length;
    const to = { ArrowRight: current + 1, ArrowLeft: current - 1 + n, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    takeOver();
    select(to % n);
    tabs[to % n].focus();
  });

  // the tour: when the open tab's progress bar fills, move to the next site
  strip.addEventListener('animationend', (e) => {
    if (e.animationName === 'wdtour' && frame.classList.contains('is-touring')) select((current + 1) % clients.length);
  });

  // fetch the other sites' photos quietly once this demo has been seen (not on data-saver connections)
  const warmAll = () => {
    if (navigator.connection?.saveData) return;
    let k = 0;
    const step = () => { const c = clients[k++]; if (c) idle(() => loadImage(c).then(step), { timeout: 4000 }); };
    step();
  };

  frame.classList.add('is-paused');
  let seen = false;
  return {
    resume() {
      frame.classList.remove('is-paused');
      if (seen) return;
      seen = true;
      if (reduce()) return;
      sweep();
      frame.classList.add('is-touring');
      setTimeout(warmAll, 2500);
      // the tour's next stop, in good time for its turn
      setTimeout(() => frame.classList.contains('is-touring') && !frame.classList.contains('is-paused') && prepare(clients[1]), 4000);
    },
    pause() { frame.classList.add('is-paused'); },
  };
}

// Page-wide motion and interaction: text reveals, nav behaviour, cursor, magnetic buttons,
// marquee, horizontal process track, 3D tilt for mockups, and the enquiry form.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { site } from '../content/content.js';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = () => matchMedia('(pointer: fine)').matches;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------------------------------------------------------- text */
function splitReveal(el, { trigger = true, delay = 0 } = {}) {
  if (reduce()) return null;
  let tween;
  SplitText.create(el, {
    type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
    onSplit(self) {
      tween?.revert?.();
      tween = gsap.from(self.lines, {
        yPercent: 105, duration: 1.25, ease: 'expo.out', stagger: 0.09, delay,
        scrollTrigger: trigger ? { trigger: el, start: 'top 86%', once: true } : undefined,
        paused: !trigger,
      });
      return tween;
    },
  });
  return () => tween;
}

export function revealHero() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  const title = hero.querySelector('.hero__title');
  if (reduce()) return;
  if (title) {
    const split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
    gsap.from(split.lines, { yPercent: 105, duration: 1.4, ease: 'expo.out', stagger: 0.11, onComplete: () => split.revert() });
  }
  gsap.fromTo(hero.querySelectorAll('[data-fade]'), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.12, delay: 0.35, clearProps: 'opacity,transform' });
  gsap.fromTo(hero.querySelectorAll('.hero__side, .hero__bottom, .hero__scroll'), { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out', delay: 0.6, stagger: 0.08, clearProps: 'opacity' });
  gsap.fromTo(document.querySelectorAll('.nav__links a, .nav__cta, .nav__menu'), { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.05, delay: 0.25, clearProps: 'opacity,transform' });
  title?.classList.add('is-in');
}

function initText() {
  const heroTitle = document.querySelector('.hero__title');
  $$('[data-split]').forEach((el) => { if (el !== heroTitle) splitReveal(el); });
  if (!reduce()) {
    $$('[data-fade]').forEach((el) => {
      if (el.closest('[data-hero]')) return;
      gsap.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', clearProps: 'opacity,transform', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  }
  // statement: words light up as you read
  const st = document.querySelector('[data-words]');
  if (st) {
    const words = st.textContent.trim().split(/\s+/);
    st.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
    const spans = st.querySelectorAll('.w');
    if (reduce()) gsap.set(spans, { opacity: 1 });
    else gsap.to(spans, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: st, start: 'top 78%', end: 'bottom 52%', scrub: 0.6 } });
  }
}

/* ---------------------------------------------------------------- nav */
function initNav(lenis) {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  let lastY = 0;
  lenis.on('scroll', ({ scroll }) => {
    nav.classList.toggle('is-scrolled', scroll > 40);
    const down = scroll > lastY + 2, up = scroll < lastY - 2;
    if (scroll > innerHeight * 0.9 && down) nav.classList.add('is-hidden');
    if (up || scroll < innerHeight * 0.5) nav.classList.remove('is-hidden');
    lastY = scroll;
  });
  // light text over dark sections
  $$('.tone-dark').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: () => `top ${nav.offsetHeight / 2}px`, end: () => `bottom ${nav.offsetHeight / 2}px`,
      onToggle: (self) => nav.classList.toggle('on-dark', self.isActive),
    });
  });
  // mobile menu
  const btn = nav.querySelector('.nav__menu');
  const menu = document.getElementById('mobile-menu');
  const close = () => { btn.setAttribute('aria-expanded', 'false'); menu.hidden = true; lenis.start(); nav.classList.remove('on-menu'); };
  btn?.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    nav.classList.toggle('on-dark', open);
    if (open) { lenis.stop(); gsap.from(menu.querySelectorAll('a'), { y: 30, opacity: 0, stagger: 0.05, duration: 0.7, ease: 'expo.out' }); }
    else lenis.start();
  });
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) close(); });
}

/* ---------------------------------------------------------------- cursor & magnetic */
function initCursor() {
  if (!fine() || reduce()) return;
  document.documentElement.classList.add('has-cursor');
  const el = document.querySelector('.cursor');
  const label = el.querySelector('[data-cursor-label]');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
  addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; xTo(pos.x); yTo(pos.y); el.classList.add('is-on'); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => el.classList.remove('is-on'));
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('a, button, [data-cursor], label.chip, input, select, textarea');
    el.classList.toggle('is-hover', !!t && !t.matches('input, select, textarea'));
    label.textContent = t?.dataset.cursor || '';
  });
}
function initMagnetic() {
  if (!fine() || reduce()) return;
  $$('[data-magnetic]').forEach((b) => {
    const xTo = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * 0.22); yTo(dy * 0.32);
      b.style.setProperty('--mx', `${e.clientX - r.left}px`);
      b.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
    b.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------------------------------------------------------------- marquee & process */
function initMarquee() {
  const track = document.querySelector('[data-marquee]');
  if (!track || reduce()) return;
  const loop = gsap.to(track, { xPercent: -50, duration: 60, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    trigger: track, start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const v = gsap.utils.clamp(-6, 6, self.getVelocity() / 260);
      gsap.to(loop, { timeScale: 1 + Math.abs(v), duration: 0.3, overwrite: true });
      gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.3, ease: 'power2.out', overwrite: false });
    },
  });
}
function initProcess() {
  const track = document.querySelector('[data-process]');
  if (!track) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    const section = track.closest('.process');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${dist() + innerHeight * 0.4}`, pin: true, scrub: 0.8, invalidateOnRefresh: true },
    });
    gsap.from(track.querySelectorAll('.step'), { rotateY: -18, opacity: 0.2, transformOrigin: 'left center', stagger: 0.12, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: section, start: 'top 70%', once: true } });
  });
  mm.add('(max-width: 900px)', () => {
    track.style.width = 'auto';
    track.style.flexDirection = 'column';
    $$('.step', track).forEach((s) => { s.style.width = 'auto'; s.style.minHeight = '0'; });
  });
}

/* ---------------------------------------------------------------- 3D tilt */
function initTilt() {
  if (reduce()) return;
  // mockups rise out of the page in 3D as they scroll in
  $$('.chapter__demo [data-demo-stage]').forEach((stage) => {
    const flip = stage.closest('.chapter--flip');
    gsap.fromTo(stage,
      { rotateX: 16, rotateY: flip ? 14 : -14, y: 80, z: -120, opacity: 0.35 },
      { rotateX: 0, rotateY: 0, y: 0, z: 0, opacity: 1, ease: 'power2.out', scrollTrigger: { trigger: stage, start: 'top 95%', end: 'top 35%', scrub: 0.9 } });
  });
  if (!fine()) return;
  $$('[data-tilt]').forEach((el) => {
    const target = el.matches('.chapter__demo') ? el.querySelector('[data-demo-stage]') : el;
    const inner = target.matches('[data-demo-stage]') ? target.firstElementChild || target : target;
    const rx = gsap.quickTo(inner, 'rotateX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(inner, 'rotateY', { duration: 0.8, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      if (e.target.closest('[data-notilt]')) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      const k = el.matches('.founder') ? 7 : 3.2;
      rx(-py * k); ry(px * k);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ---------------------------------------------------------------- booking links, replay, form */
function initLinks() {
  if (site.bookingUrl) {
    $$('[data-book]').forEach((a) => { a.href = site.bookingUrl; a.target = '_blank'; a.rel = 'noopener'; });
  }
  document.querySelector('[data-replay]')?.addEventListener('click', () => {
    try { sessionStorage.removeItem('avx-intro-seen'); } catch (_) { /* ignore */ }
    location.hash = 'intro';
    location.reload();
  });
}
function initForm() {
  const form = document.querySelector('[data-form]');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.elements.name, email = form.elements.email;
    let ok = true;
    [name, email].forEach((f) => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.closest('.field').classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { status.className = 'form__status'; status.textContent = 'Please add your name and a valid email address so we can reply.'; return; }
    const data = Object.fromEntries(new FormData(form));
    data.needs = new FormData(form).getAll('needs');
    if (!site.formEndpoint) {
      status.className = 'form__status';
      status.textContent = 'Preview mode: this form is not connected yet, so nothing was sent. Add an endpoint in src/content/content.js before launch.';
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; status.textContent = 'Sending…';
    try {
      const res = await fetch(site.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      status.className = 'form__status is-ok';
      status.textContent = `Thanks${data.name ? `, ${data.name.split(' ')[0]}` : ''}. We will reply within one working day.`;
    } catch (err) {
      status.className = 'form__status';
      status.textContent = 'That did not send. Please try again, or email us directly.';
    } finally { btn.disabled = false; }
  });
}

export function initUI({ lenis }) {
  initText();
  initNav(lenis);
  initCursor();
  initMagnetic();
  initMarquee();
  initProcess();
  initTilt();
  initLinks();
  initForm();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

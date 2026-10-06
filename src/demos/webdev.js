// 01 Web development: drag between a dated clinic website and our redesign of it (fictional business).
import clinicImg from '../assets/demo/clinic.webp';

const DESIGN_W = 1200;

const before = () => `
<div class="old">
  <div class="old__top">
    <div class="old__logo">Harbour Lane Physio</div>
    <div class="old__phone">CALL US TO BOOK!!<small>Mon–Fri 9am–5pm (closed lunch)</small></div>
  </div>
  <div class="old__nav"><a>Home</a><a>About Us</a><a>Prices (PDF)</a><a>Directions</a><a>Contact</a><a>Links</a></div>
  <div class="old__marquee"><span>*** WELCOME TO OUR NEW WEBSITE *** Online booking coming soon!! *** Please phone to make an appointment ***</span></div>
  <div class="old__body">
    <div class="old__side">
      <h4>Quick Links</h4>
      <ul style="padding-left:18px;margin:0"><li>Back Pain</li><li>Sports Injury</li><li>Download Price List (PDF, 4MB)</li><li>Find Us</li><li>Guestbook</li></ul>
      <p style="margin-top:18px">You are visitor number <span class="old__counter">004187</span></p>
    </div>
    <div class="old__main">
      <h1>Welcome to Harbour Lane Physiotherapy!</h1>
      <div class="old__img" style="background-image:url(${clinicImg})"></div>
      <p>We are a physiotherapy practice. We treat many conditions including back pain, neck pain, sports injuries and much more. Our physiotherapists are fully qualified.</p>
      <p>To book an appointment please telephone the clinic during opening hours. If the line is busy please try again later or leave a message and we will try to call you back.</p>
      <p>Prices are available in our downloadable price list.</p>
      <span class="old__cta">☎ PHONE NOW TO BOOK</span>
    </div>
  </div>
  <div class="old__foot"><span>© Harbour Lane Physio. Best viewed in Internet Explorer at 1024x768.</span><span>Last updated: March 2014</span></div>
</div>`;

const after = () => `
<div class="new">
  <div class="new__nav">
    <div class="new__brand"><i></i>Harbour Lane</div>
    <div class="new__links"><span>Treatments</span><span>Prices</span><span>Our team</span><span>Find us</span></div>
    <span class="new__book">Book online</span>
  </div>
  <div class="new__hero">
    <div>
      <p class="new__eyebrow">Physiotherapy · Moseley, Birmingham</p>
      <h2 class="new__h1">Move without<br/> pain <em>again.</em></h2>
      <p class="new__p">Assessment, hands-on treatment and a plan you can follow at home. Book a time that suits you in under a minute.</p>
      <div class="new__ctas"><span>Book online</span><span>Free 15-minute call</span></div>
      <div class="new__proof"><span class="new__stars">★★★★★</span><span>4.9 from 212 Google reviews</span></div>
    </div>
    <div class="new__img" style="background-image:url(${clinicImg})">
      <div class="new__chip"><small>NEXT AVAILABLE</small><b>Tomorrow, 9:30</b><span>Initial assessment · £60</span></div>
    </div>
  </div>
</div>`;

export function mount(stage) {
  stage.innerHTML = `
  <div class="frame wd">
    <div class="frame__bar"><i></i><i></i><i></i><div class="frame__url">harbourlanephysio.co.uk</div></div>
    <div class="wd__view" data-view>
      <div class="wd__site wd__after" data-site>${after()}</div>
      <div class="wd__site wd__before" data-site data-before>${before()}</div>
      <span class="wd__label wd__label--b">Before</span>
      <span class="wd__label wd__label--a">After</span>
      <div class="wd__handle" data-handle role="slider" tabindex="0" aria-label="Compare the old and new website" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" data-cursor="Drag">
        <span class="wd__knob"><svg viewBox="0 0 26 14" aria-hidden="true"><path d="M7 2 2 7l5 5M19 2l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </div>
    </div>
  </div>
  <div class="wd__notes">
    <span class="wd__note"><b>01</b> Book online in two taps</span>
    <span class="wd__note"><b>02</b> Prices and reviews up front</span>
    <span class="wd__note"><b>03</b> Built mobile-first and fast</span>
  </div>`;

  const view = stage.querySelector('[data-view]');
  const sites = stage.querySelectorAll('[data-site]');
  const beforeEl = stage.querySelector('[data-before]');
  const handle = stage.querySelector('[data-handle]');
  let pct = 50, target = 50, raf = 0, auto = true;

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

  // drag anywhere on the view
  let dragging = false;
  const fromEvent = (e) => { const r = view.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
  view.addEventListener('pointerdown', (e) => { dragging = true; auto = false; view.setPointerCapture(e.pointerId); go(fromEvent(e)); });
  view.addEventListener('pointermove', (e) => { if (dragging) go(fromEvent(e)); });
  view.addEventListener('pointerup', () => { dragging = false; });
  view.addEventListener('pointercancel', () => { dragging = false; });
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { auto = false; go(target - 5); e.preventDefault(); }
    if (e.key === 'ArrowRight') { auto = false; go(target + 5); e.preventDefault(); }
  });

  // a gentle invitation: sweep once when first seen
  let swept = false;
  return {
    resume() {
      if (swept || !auto || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      swept = true;
      setTimeout(() => auto && go(78), 500);
      setTimeout(() => auto && go(22), 1500);
      setTimeout(() => auto && go(50), 2500);
    },
    pause() {},
  };
}

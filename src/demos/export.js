// 08 B2B & export: a manufacturer's export catalogue (fictional) with multi-currency prices and a
// request-for-quote flow, beside a globe that draws the shipping route to the buyer's port.
import * as THREE from 'three';
import { gsap } from 'gsap';
import land from '../assets/data/land.json';
import flangeImg from '../assets/demo/flange.webp';

const ORIGIN = { name: 'Rajkot', lat: 22.3, lon: 70.8 };
const PORTS = [
  { id: 'gb', name: 'Birmingham', lat: 52.48, lon: -1.9 },
  { id: 'nl', name: 'Rotterdam', lat: 51.92, lon: 4.48 },
  { id: 'us', name: 'Houston', lat: 29.76, lon: -95.37 },
  { id: 'ae', name: 'Dubai', lat: 25.2, lon: 55.27 },
  { id: 'sg', name: 'Singapore', lat: 1.35, lon: 103.82 },
  { id: 'za', name: 'Johannesburg', lat: -26.2, lon: 28.05 },
];
const RATES = { USD: [1, '$'], GBP: [0.79, '£'], EUR: [0.92, '€'], AED: [3.67, 'AED '], INR: [83.5, '₹'] }; // example rates
const PRODUCTS = [
  { id: 'wn', name: 'Weld-neck flange', spec: 'ASME B16.5 · ½″–24″ · Class 150–1500', usd: 18.4, moq: 50, svg: 'wn' },
  { id: 'so', name: 'Slip-on flange', spec: 'ASME B16.5 · ½″–24″ · Class 150–600', usd: 11.2, moq: 50, svg: 'so' },
  { id: 'bl', name: 'Blind flange', spec: 'ASME B16.5 · ½″–24″ · Class 150–1500', usd: 14.6, moq: 50, svg: 'bl' },
  { id: 'bv', name: 'Forged ball valve', spec: 'API 6D · ½″–4″ · full bore', usd: 64, moq: 10, svg: 'bv' },
];
const DRAW = {
  wn: '<rect x="24" y="20" width="6" height="40"/><rect x="30" y="8" width="14" height="64"/><path d="M44 22 78 30H112V50H78L44 58Z"/><path class="d" d="M24 32H112M24 48H112M30 14H44M30 66H44"/>',
  so: '<rect x="34" y="20" width="6" height="40"/><rect x="40" y="8" width="14" height="64"/><path d="M54 24H74V56H54"/><path class="d" d="M34 31H74M34 49H74M40 14H54M40 66H54"/>',
  bl: '<rect x="56" y="20" width="6" height="40"/><rect x="62" y="8" width="16" height="64"/><path class="d" d="M62 14H78M62 66H78"/>',
  bv: '<rect x="38" y="16" width="10" height="48"/><rect x="112" y="16" width="10" height="48"/><path d="M48 26C60 20 100 20 112 26V54C100 60 60 60 48 54Z"/><rect x="76" y="10" width="8" height="12"/><path d="M80 10 128 4" stroke-width="3" stroke-linecap="round"/><circle cx="80" cy="40" r="10"/>',
};
const svgFor = (k) => `<svg viewBox="0 0 160 80" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path class="c" d="M10 40H150" stroke-dasharray="10 3 2 3" opacity=".45"/>${DRAW[k]}<style>.d{stroke-dasharray:3 3;opacity:.55}</style></svg>`;

const toVec = (lat, lon, r = 1) => {
  const phi = (90 - lat) * (Math.PI / 180), th = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};

const dotVS = /* glsl */`
  uniform float uPR;
  varying float vFace;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normalize(position));
    vFace = dot(n, normalize(-mv.xyz));
    gl_PointSize = 2.1 * uPR * (3.2 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const dotFS = /* glsl */`
  varying float vFace;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(-0.15, 0.45, vFace);
    gl_FragColor = vec4(vec3(0.95, 0.92, 0.86), 0.12 + 0.78 * a);
  }`;
const atmoVS = /* glsl */`
  varying vec3 vN; varying vec3 vV;
  void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const atmoFS = /* glsl */`
  varying vec3 vN; varying vec3 vV;
  void main() {
    // back faces of a slightly larger sphere: brightest right at the globe's edge, fading outward
    float f = clamp(-dot(vN, vV) * 2.3, 0.0, 1.0);
    f = f * f * f;
    gl_FragColor = vec4(vec3(0.77, 0.54, 0.36) * f * 0.62, f * 0.8);
  }`;
const arcVS = /* glsl */`
  varying float vX;
  void main() { vX = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const arcFS = /* glsl */`
  uniform float uDraw, uTime, uOn;
  varying float vX;
  void main() {
    if (vX > uDraw) discard;
    float head = exp(-abs(vX - uDraw) * 40.0) * step(uDraw, 0.999);
    float pulse = exp(-abs(fract(uTime * 0.35) - vX) * 30.0) * step(0.999, uDraw);
    vec3 col = mix(vec3(0.77, 0.54, 0.36), vec3(1.0, 0.9, 0.75), clamp(head + pulse, 0.0, 1.0));
    float a = (0.35 + 0.65 * uOn) * (0.55 + head + pulse);
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }`;

export function mount(stage) {
  const S = { cur: 'USD', rfq: new Map(), port: 'gb', inco: 'FOB Mundra', sent: 0 };
  stage.innerHTML = `
  <div class="ex">
    <div class="ex__globe" data-globe>
      <canvas role="img" aria-label="Globe showing shipping routes from Rajkot, India to buyers abroad" data-cursor="Drag"></canvas>
      <p class="ex__gtitle">Rajkot to the world<small>Export routes</small></p>
      <div class="ex__legend" data-legend>${PORTS.map((p) => `<span data-port="${p.id}" class="${p.id === S.port ? 'on' : ''}">${p.name}</span>`).join('')}</div>
    </div>
    <div class="ex__cat" data-notilt>
      <div class="ex__bar">
        <b>Rajkot Precision Forge</b><span class="tag">Export catalogue</span>
        <select aria-label="Currency" data-cur>${Object.keys(RATES).map((c) => `<option ${c === S.cur ? 'selected' : ''}>${c}</option>`).join('')}</select>
      </div>
      <div class="ex__items" data-items></div>
      <div class="ex__rfq" data-rfq></div>
    </div>
  </div>`;

  /* ---------------- catalogue */
  const items = stage.querySelector('[data-items]');
  const rfq = stage.querySelector('[data-rfq]');
  const price = (usd) => { const [r, sym] = RATES[S.cur]; const v = usd * r; return `${sym}${v >= 1000 ? Math.round(v).toLocaleString('en-GB') : v.toFixed(2)}`; };
  function renderItems() {
    items.innerHTML = `
      <div class="ex__item" style="grid-column:1/-1;grid-template-columns:120px 1fr;align-items:center;gap:14px">
        <img src="${flangeImg}" alt="Forged stainless steel weld-neck flange" style="width:120px;height:90px;object-fit:cover;border-radius:10px"/>
        <div><b>Forged flanges, valves and fittings</b><br/><small>Made to ASME and EN standards. Mill test certificates with every order. Prices shown are examples.</small></div>
      </div>
      ${PRODUCTS.map((p) => `
      <div class="ex__item">
        ${svgFor(p.svg)}
        <b>${p.name}</b><small>${p.spec}</small>
        <div class="ex__row"><span class="ex__price">${price(p.usd)}<small style="font:500 11px var(--sans);color:var(--muted)"> /pc</small></span>
        <button type="button" class="ex__add${S.rfq.has(p.id) ? ' is-in' : ''}" data-add="${p.id}">${S.rfq.has(p.id) ? 'In RFQ ✓' : 'Add to RFQ'}</button></div>
        <small>MOQ ${p.moq} pcs</small>
      </div>`).join('')}`;
  }
  function renderRfq(message = '') {
    const lines = [...S.rfq.entries()].map(([id, qty]) => { const p = PRODUCTS.find((x) => x.id === id); return `<div><span>${p.name} × ${qty}</span><span>${price(p.usd * qty)}</span></div>`; }).join('');
    rfq.innerHTML = `
      <div class="ex__rfq-list" data-lenis-prevent>${lines || '<div><span style="color:var(--muted)">Add parts to build a request for quote.</span></div>'}</div>
      <div class="ex__rfq-foot">
        <select aria-label="Destination" data-dest>${PORTS.map((p) => `<option value="${p.id}" ${p.id === S.port ? 'selected' : ''}>${p.name}</option>`).join('')}</select>
        <select aria-label="Incoterm" data-inco>${['FOB Mundra', 'CIF destination', 'DAP destination'].map((x) => `<option ${x === S.inco ? 'selected' : ''}>${x}</option>`).join('')}</select>
        <button class="ui-btn ui-btn--acc" type="button" data-send ${S.rfq.size ? '' : 'disabled'}>Send RFQ</button>
      </div>
      ${message}`;
  }
  stage.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      const p = PRODUCTS.find((x) => x.id === add.dataset.add);
      if (S.rfq.has(p.id)) S.rfq.delete(p.id); else S.rfq.set(p.id, p.moq * 2);
      renderItems(); renderRfq();
    }
    if (e.target.closest('[data-send]')) {
      S.sent++;
      const port = PORTS.find((p) => p.id === S.port);
      const ref = `AX-26-${String(141 + S.sent).padStart(4, '0')}`;
      renderRfq(`<p class="ex__sent"><b>RFQ ${ref} received.</b> ${S.rfq.size} line${S.rfq.size > 1 ? 's' : ''}, ${S.inco}, to ${port.name}. Routed to export sales with specs attached, and the buyer got an instant reply with lead times. <s>PDF attached</s></p>`);
      drawArc(S.port, true);
    }
    const leg = e.target.closest('[data-port]');
    if (leg) { S.port = leg.dataset.port; renderRfq(); drawArc(S.port); }
  });
  stage.addEventListener('change', (e) => {
    if (e.target.matches('[data-cur]')) { S.cur = e.target.value; renderItems(); renderRfq(); }
    if (e.target.matches('[data-dest]')) { S.port = e.target.value; drawArc(S.port); }
    if (e.target.matches('[data-inco]')) S.inco = e.target.value;
  });
  renderItems(); renderRfq();

  /* ---------------- globe */
  let arcs = [];
  const wrap = stage.querySelector('[data-globe]');
  const canvas = wrap.querySelector('canvas');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { canvas.remove(); return {}; }
  const PR = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(PR);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.set(0, 0.35, 4.3);
  camera.lookAt(0, 0, 0);
  const globe = new THREE.Group();
  scene.add(globe);

  // land dots on a Fibonacci sphere
  const bits = Uint8Array.from(atob(land.bits), (c) => c.charCodeAt(0));
  const isLand = (lat, lon) => {
    const r = Math.min(land.h - 1, Math.max(0, Math.floor(90 - lat)));
    const c = Math.min(land.w - 1, Math.max(0, Math.floor(lon + 180)));
    const i = r * land.w + c;
    return (bits[i >> 3] >> (i & 7)) & 1;
  };
  const N = innerWidth < 700 ? 9000 : 16000;
  const pos = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const lat = Math.asin(y) * (180 / Math.PI);
    const lon = (((golden * i * 180) / Math.PI) % 360) - 180;
    if (isLand(lat, lon)) { const v = toVec(lat, lon, 1.0); pos.push(v.x, v.y, v.z); }
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  globe.add(new THREE.Points(dg, new THREE.ShaderMaterial({ uniforms: { uPR: { value: PR } }, vertexShader: dotVS, fragmentShader: dotFS, transparent: true, depthWrite: false })));
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(0.985, 64, 48), new THREE.MeshBasicMaterial({ color: '#1C1A16' })));
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.09, 64, 48), new THREE.ShaderMaterial({ vertexShader: atmoVS, fragmentShader: atmoFS, transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(atmo);

  // markers
  const mark = (lat, lon, size, color) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 12), new THREE.MeshBasicMaterial({ color }));
    m.position.copy(toVec(lat, lon, 1.005));
    globe.add(m);
    return m;
  };
  const origin = mark(ORIGIN.lat, ORIGIN.lon, 0.022, '#C4895C');
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.036, 40), new THREE.MeshBasicMaterial({ color: '#C4895C', transparent: true, side: THREE.DoubleSide }));
  ring.position.copy(origin.position); ring.lookAt(origin.position.clone().multiplyScalar(2));
  globe.add(ring);
  PORTS.forEach((p) => mark(p.lat, p.lon, 0.013, '#F3F0E8'));

  // routes
  const a0 = toVec(ORIGIN.lat, ORIGIN.lon);
  arcs = PORTS.map((p) => {
    const b0 = toVec(p.lat, p.lon);
    const ang = a0.angleTo(b0);
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      const v = new THREE.Vector3().copy(a0).lerp(b0, t).normalize();
      // slerp for accuracy
      const s = Math.sin(ang), w1 = Math.sin((1 - t) * ang) / s, w2 = Math.sin(t * ang) / s;
      v.set(a0.x * w1 + b0.x * w2, a0.y * w1 + b0.y * w2, a0.z * w1 + b0.z * w2);
      v.multiplyScalar(1 + Math.sin(Math.PI * t) * (0.06 + 0.22 * (ang / Math.PI)));
      pts.push(v);
    }
    const u = { uDraw: { value: 0 }, uTime: { value: 0 }, uOn: { value: 0 } };
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.0045, 6, false), new THREE.ShaderMaterial({ uniforms: u, vertexShader: arcVS, fragmentShader: arcFS, transparent: true, depthWrite: false }));
    globe.add(tube);
    return { id: p.id, u };
  });
  function drawArc(id, again = false) {
    arcs.forEach((a) => {
      const on = a.id === id;
      gsap.to(a.u.uOn, { value: on ? 1 : 0, duration: 0.6 });
      if (on && (again || a.u.uDraw.value < 1)) gsap.fromTo(a.u.uDraw, { value: 0 }, { value: 1, duration: 1.6, ease: 'power2.inOut' });
    });
    stage.querySelectorAll('[data-port]').forEach((el) => el.classList.toggle('on', el.dataset.port === id));
    const sel = stage.querySelector('[data-dest]'); if (sel) sel.value = id;
  }
  // all routes draw in once, then the selected one stays bright
  arcs.forEach((a, i) => gsap.to(a.u.uDraw, { value: 1, duration: 1.8, delay: 0.3 + i * 0.18, ease: 'power2.inOut' }));
  drawArc(S.port);

  // orientation: India in view, drag to spin
  const R = { y: -2.78, x: 0.32, vy: 0.0009 };
  let dragging = false, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    R.y += (e.clientX - lx) * 0.006; R.x = Math.max(-0.6, Math.min(0.8, R.x + (e.clientY - ly) * 0.004));
    lx = e.clientX; ly = e.clientY;
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });

  const resize = () => {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    camera.position.z = w / h < 1 ? 4.3 / Math.max(0.62, w / h) : 4.3;
  };
  new ResizeObserver(resize).observe(wrap);
  resize();

  let t = 0, running = false;
  const frame = (_time, dms) => {
    t += (dms || 16) / 1000;
    if (!dragging) R.y += R.vy * (dms || 16) / 16;
    globe.rotation.set(R.x, R.y, 0);
    arcs.forEach((a) => { a.u.uTime.value = t; });
    ring.scale.setScalar(1 + (t % 1.6) * 0.9);
    ring.material.opacity = 1 - (t % 1.6) / 1.6;
    renderer.render(scene, camera);
  };
  frame(0, 16);
  return {
    resume() { if (!running) { running = true; gsap.ticker.add(frame); } },
    pause() { if (running) { running = false; gsap.ticker.remove(frame); } },
  };
}

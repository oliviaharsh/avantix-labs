// 02 3D web: a real-time product viewer for a fictional audio brand. A two-way bookshelf speaker:
// hardwood cabinet, acoustic grille, paper-cone woofer, silk-dome tweeter, rear port and terminals.
// Rotate it, change the finish, explode it to see inside. Units: 1 = 10 cm.
// Loads without freezing the page: the lighting is pre-baked (src/lib/env.js), shaders compile in the
// background and the canvas fades in once the first frame is ready.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';
import { studioEnvironment } from '../lib/env.js';

const FINISHES = {
  walnut: { label: 'Walnut', wood: '#654430', grain: true, rough: 0.5, grille: '#2C2824' },
  oak: { label: 'Oak', wood: '#CFA77A', grain: true, rough: 0.56, grille: '#BDB4A6' },
  ivory: { label: 'Ivory', wood: '#EEE7DB', grain: false, rough: 0.3, grille: '#D8D0C3' },
};

function lathe(profile, segments = 72) {
  const g = new THREE.LatheGeometry(profile.map(([r, z]) => new THREE.Vector2(r, z)), segments);
  g.rotateX(Math.PI / 2); // lathe axis Y -> Z (facing forward)
  return g;
}
function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function canvasTexture(w, h, paint, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  const img = x.createImageData(w, h);
  paint(img.data, w, h);
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  return t;
}
// straight-grained hardwood, as a light/dark multiplier for the finish colour
const hash = (x, y) => { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); };
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const grainTexture = () => {
  // the grain pattern across the board, then warped and given pores per pixel
  const N = 1024, profile = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const x = i / N;
    const ring = 0.5 + 0.5 * Math.sin(x * Math.PI * 2 * 21 + 1.8 * Math.sin(x * Math.PI * 2 * 3) + 0.6 * Math.sin(x * Math.PI * 2 * 7));
    profile[i] = 1 - 0.17 * ring ** 5 - 0.11 * vnoise(x * 70, 0.5) - 0.05 * vnoise(x * 240, 3.5);
  }
  return canvasTexture(256, 128, (d, w, h) => {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const u = i / w, v = j / h;
        const x = u + 0.045 * vnoise(u * 3.5, v * 1.3) + 0.008 * Math.sin(v * 23 + u * 9);
        const p = profile[((x % 1) + 1) % 1 * N | 0];
        const g = 236 * p * (0.95 + 0.05 * vnoise(u * 260, v * 9));
        const k = (j * w + i) * 4;
        d[k] = d[k + 1] = d[k + 2] = g; d[k + 3] = 255;
      }
    }
  });
};
const flatTexture = () => canvasTexture(4, 4, (d) => { d.fill(235); });
// woven fabric relief for the grille
const weaveTexture = () => canvasTexture(64, 64, (d, w, h) => {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const over = ((i >> 3) + (j >> 3)) & 1;
      const a = 0.5 + 0.5 * Math.cos(((over ? i : j) % 8) / 8 * Math.PI * 2);
      const b = 0.5 + 0.5 * Math.cos(((over ? j : i) % 4) / 4 * Math.PI * 2);
      const g = 70 + 150 * a * (0.75 + 0.25 * b);
      const k = (j * w + i) * 4;
      d[k] = d[k + 1] = d[k + 2] = g; d[k + 3] = 255;
    }
  }
}, { repeat: [14, 22], srgb: false });
const idle = () => new Promise((r) => setTimeout(r, 0));
function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const grd = x.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,0.6)');
  grd.addColorStop(0.5, 'rgba(0,0,0,0.2)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = grd; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export function mount(stage) {
  stage.innerHTML = `
  <div class="p3" data-p3>
    <canvas aria-label="3D model of a bookshelf speaker. Drag to rotate." role="img" data-cursor="Drag"></canvas>
    <div class="p3__top">
      <p class="p3__title">Bookshelf speaker<small>Two-way · 6.5″ · rear-ported</small></p>
      <p class="p3__spec"><span data-mat-label>Walnut</span><br/>Wool-blend grille · bronze details</p>
    </div>
    <div class="p3__hot" data-hot="cabinet"><i></i><span>Solid hardwood cabinet</span></div>
    <div class="p3__hot" data-hot="grille"><i></i><span>Wool-blend acoustic grille</span></div>
    <div class="p3__hot" data-hot="woofer"><i></i><span>6.5″ paper-cone woofer</span></div>
    <div class="p3__hot" data-hot="tweeter"><i></i><span>1″ silk-dome tweeter</span></div>
    <p class="p3__hint" data-hint>Drag to rotate</p>
    <div class="p3__bar">
      <div class="seg" role="group" aria-label="Finish">
        ${Object.entries(FINISHES).map(([k, f], i) => `<button type="button" data-mat="${k}" aria-pressed="${i === 0}">${f.label}</button>`).join('')}
      </div>
      <div class="seg" role="group" aria-label="View">
        <button type="button" data-explode aria-pressed="false">Explode</button>
        <button type="button" data-labels aria-pressed="false">Labels</button>
      </div>
    </div>
  </div>`;

  const wrap = stage.querySelector('[data-p3]');
  const canvas = wrap.querySelector('canvas');

  // The markup above is built straight away, so the page has its final height from the start; the 3D
  // is built later, when the page is quiet or the chapter comes near (see demos/index.js).
  let running = false, frame = null, started = null;
  const api = {
    start() { started ||= build().catch((err) => console.error('3D demo failed', err)); return started; },
    resume() { if (!running) { running = true; if (frame) gsap.ticker.add(frame); } },
    pause() { if (running) { running = false; if (frame) gsap.ticker.remove(frame); } },
  };
  return api;

  async function build() {
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      wrap.innerHTML = '<p class="demo-error">3D needs WebGL, which this browser has turned off.</p>';
      return;
    }
    renderer.debug.checkShaderErrors = import.meta.env.DEV;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.NeutralToneMapping;

    const scene = new THREE.Scene();
    scene.environmentIntensity = 0.9;
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
    camera.position.set(5.6, 2.2, 7.4);

    scene.add(new THREE.HemisphereLight('#FFF4E6', '#2A2620', 0.5));
    const key = new THREE.DirectionalLight('#FFE9D2', 2.4); key.position.set(4, 6, 5); scene.add(key);
    const rim = new THREE.DirectionalLight('#C4895C', 2.6); rim.position.set(-5, 3, -4); scene.add(rim);

    await idle(); // the work is split into short steps so the page never stalls

    /* ---------------- materials */
    const f0 = FINISHES.walnut;
    const flat = flatTexture();
    let grain = flat; // the real grain is generated in a later step, below
    const wood = new THREE.MeshStandardMaterial({ color: f0.wood, map: flat, roughness: f0.rough, metalness: 0 });
    const fabric = new THREE.MeshStandardMaterial({ color: f0.grille, bumpMap: weaveTexture(), bumpScale: 1.4, roughness: 0.96, metalness: 0 });
    const satin = new THREE.MeshStandardMaterial({ color: '#1B1A18', roughness: 0.55, metalness: 0.1 });
    // turned parts are open surfaces seen from both sides
    const two = THREE.DoubleSide;
    const rubber = new THREE.MeshStandardMaterial({ color: '#141312', roughness: 0.9, metalness: 0, side: two });
    const paper = new THREE.MeshStandardMaterial({ color: '#CFC3AF', roughness: 0.88, metalness: 0, side: two });
    const silk = new THREE.MeshStandardMaterial({ color: '#24221F', roughness: 0.62, metalness: 0, side: two });
    const bronze = new THREE.MeshStandardMaterial({ color: '#C4895C', roughness: 0.24, metalness: 1, side: two });
    const darkMetal = new THREE.MeshStandardMaterial({ color: '#2B2926', roughness: 0.38, metalness: 0.8, side: two });

    /* ---------------- model */
    const W = 2.0, H = 3.2, D = 2.3, FRONT = D / 2;
    const speaker = new THREE.Group();
    scene.add(speaker);
    const cabinet = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 4, 0.1), wood);
    speaker.add(cabinet);

    // front baffle with cut-outs for the drivers
    const bs = roundedRect(1.9, 3.1, 0.06);
    [[0, -0.62, 0.64], [0, 0.92, 0.18]].forEach(([cx, cy, r]) => { const h = new THREE.Path(); h.absarc(cx, cy, r, 0, Math.PI * 2, true); bs.holes.push(h); });
    const baffle = new THREE.Group();
    baffle.add(new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 36 }), satin));
    baffle.position.z = FRONT;
    speaker.add(baffle);
    const FACE = FRONT + 0.12;

    const woofer = new THREE.Group();
    woofer.add(
      new THREE.Mesh(lathe([[0.64, 0.0], [0.75, 0.0], [0.75, 0.03], [0.64, 0.03], [0.64, 0.0]]), darkMetal),
      new THREE.Mesh(lathe([[0.54, 0.0], [0.57, 0.04], [0.6, 0.055], [0.63, 0.04], [0.66, 0.0]]), rubber),
      new THREE.Mesh(lathe([[0.15, -0.11], [0.3, -0.07], [0.44, -0.03], [0.55, 0.0]]), paper),
      new THREE.Mesh(lathe([[0.0, -0.05], [0.08, -0.06], [0.13, -0.085], [0.16, -0.11]]), bronze),
    );
    woofer.position.set(0, -0.62, FACE);
    speaker.add(woofer);

    const tweeter = new THREE.Group();
    tweeter.add(
      new THREE.Mesh(lathe([[0.17, -0.02], [0.28, 0.0], [0.39, 0.025], [0.42, 0.025], [0.42, 0.0]]), darkMetal),
      new THREE.Mesh(lathe([[0.42, 0.0], [0.445, 0.0], [0.445, 0.03], [0.42, 0.03]]), bronze),
      new THREE.Mesh(lathe([[0.0, 0.07], [0.08, 0.06], [0.13, 0.035], [0.165, -0.02]]), silk),
    );
    tweeter.position.set(0, 0.92, FACE);
    speaker.add(tweeter);

    const grille = new THREE.Group();
    grille.add(new THREE.Mesh(new RoundedBoxGeometry(1.96, 3.16, 0.07, 3, 0.03), fabric));
    const badge = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.07, 0.02, 2, 0.008), bronze);
    badge.position.set(0, -1.42, 0.045);
    grille.add(badge);
    grille.position.z = FACE + 0.1;
    speaker.add(grille);

    const back = new THREE.Group();
    back.add(new THREE.Mesh(new RoundedBoxGeometry(0.74, 0.52, 0.03, 2, 0.01), satin));
    [-0.17, 0.17].forEach((x) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 20), bronze);
      post.rotation.x = Math.PI / 2; post.position.set(x, -0.04, -0.09);
      back.add(post);
    });
    back.position.set(0, -0.9, -FRONT - 0.015);
    speaker.add(back);
    const port = new THREE.Group();
    port.add(new THREE.Mesh(lathe([[0.17, 0.0], [0.23, 0.0], [0.23, -0.03], [0.17, -0.03], [0.17, 0.4]]), darkMetal));
    port.position.set(0, 0.9, -FRONT);
    speaker.add(port);

    const feet = [];
    [[-0.72, -0.85], [0.72, -0.85], [-0.72, 0.85], [0.72, 0.85]].forEach(([x, z]) => {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.07, 24), bronze);
      foot.position.set(x, -H / 2 - 0.035, z);
      foot.userData.home = foot.position.y;
      feet.push(foot); speaker.add(foot);
    });

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -H / 2 - 0.075;
    scene.add(shadow);
    speaker.rotation.y = 0.05; // three-quarter view, so exploded parts fan out instead of hiding each other

    await idle();

    /* ---------------- interaction */
    const controls = new OrbitControls(camera, canvas);
    controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.autoRotate = true; controls.autoRotateSpeed = 0.9;
    controls.minPolarAngle = 0.75; controls.maxPolarAngle = 1.75;
    controls.target.set(0, -0.05, 0.3);
    const hint = wrap.querySelector('[data-hint]');
    controls.addEventListener('start', () => { controls.autoRotate = false; hint.style.opacity = '0'; });

    const E = { t: 0 };
    const homes = { grille: grille.position.z, woofer: woofer.position.z, tweeter: tweeter.position.z, baffle: baffle.position.z, back: back.position.z, port: port.position.z };
    const out = gsap.parseEase('power2.out');
    const applyExplode = () => {
      const t = E.t;
      grille.position.z = homes.grille + 1.55 * t;
      grille.position.x = -1.05 * out(t);
      grille.rotation.y = 0.32 * t;
      tweeter.position.z = homes.tweeter + 0.95 * out(Math.min(1, t * 1.2));
      woofer.position.z = homes.woofer + 0.8 * out(Math.min(1, t * 1.1));
      baffle.position.z = homes.baffle + 0.35 * t;
      back.position.z = homes.back - 0.6 * t;
      port.position.z = homes.port - 0.35 * t;
      feet.forEach((f) => { f.position.y = f.userData.home - 0.32 * t; });
    };
    const explodeBtn = wrap.querySelector('[data-explode]');
    explodeBtn.addEventListener('click', () => {
      const on = explodeBtn.getAttribute('aria-pressed') !== 'true';
      explodeBtn.setAttribute('aria-pressed', String(on));
      explodeBtn.textContent = on ? 'Assemble' : 'Explode';
      gsap.to(E, { t: on ? 1 : 0, duration: 1.6, ease: 'power3.inOut', onUpdate: applyExplode });
    });
    const labelsBtn = wrap.querySelector('[data-labels]');
    labelsBtn.addEventListener('click', () => {
      const on = labelsBtn.getAttribute('aria-pressed') !== 'true';
      labelsBtn.setAttribute('aria-pressed', String(on));
      wrap.classList.toggle('show-hot', on);
    });
    let finish = f0;
    wrap.querySelectorAll('[data-mat]').forEach((b) => b.addEventListener('click', () => {
      wrap.querySelectorAll('[data-mat]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      const f = FINISHES[b.dataset.mat];
      finish = f;
      wood.map = f.grain ? grain : flat; // swapping textures keeps the same shader, so nothing recompiles
      gsap.to(wood.color, { ...new THREE.Color(f.wood), duration: 0.7, ease: 'power2.out' });
      gsap.to(wood, { roughness: f.rough, duration: 0.7 });
      gsap.to(fabric.color, { ...new THREE.Color(f.grille), duration: 0.7, ease: 'power2.out' });
      wrap.querySelector('[data-mat-label]').textContent = f.label;
    }));

    // hotspots follow the parts they describe
    const hots = {
      cabinet: { obj: cabinet, local: new THREE.Vector3(W / 2, -0.35, -0.35) },
      grille: { obj: grille, local: new THREE.Vector3(-0.62, 0.2, 0.04) },
      woofer: { obj: woofer, local: new THREE.Vector3(0.36, 0.3, 0.0) },
      tweeter: { obj: tweeter, local: new THREE.Vector3(0.3, 0.2, 0.0) },
    };
    const hotEls = Object.fromEntries([...wrap.querySelectorAll('[data-hot]')].map((el) => [el.dataset.hot, el]));
    const v = new THREE.Vector3();
    function placeHots(w, h) {
      for (const [k, { obj, local }] of Object.entries(hots)) {
        v.copy(local); obj.localToWorld(v); v.project(camera);
        const el = hotEls[k];
        el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -50%)`;
        el.style.opacity = v.z < 1 ? '1' : '0';
      }
    }

    let W2 = 0, H2 = 0;
    const resize = () => {
      W2 = wrap.clientWidth; H2 = wrap.clientHeight;
      if (!W2 || !H2) return;
      renderer.setSize(W2, H2, false);
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(wrap);
    resize();

    const draw = () => {
      controls.update();
      renderer.render(scene, camera);
      placeHots(W2, H2);
    };
    // lighting, wood grain, then the shaders compile in the background
    scene.environment = await studioEnvironment();
    await idle();
    grain = grainTexture();
    if (finish.grain) wood.map = grain;
    if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
    draw();
    canvas.classList.add('is-ready');
    frame = draw;
    if (running) gsap.ticker.add(frame);
  }
}

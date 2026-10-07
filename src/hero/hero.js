// Hero: the Avantix mark as a sculpture. The logo kit's own polygons are extruded into a travertine
// monolith (thick stroke), a dark bronze beam set behind it (thin stroke) and a polished bronze bridge
// (crossbar). Sunlight through a window, drifting dust. Scrolling swings the camera round until, for a
// moment, the three pieces line up into the logo.
//
// Built to stay smooth on ordinary laptops: drawn straight to the canvas (multisampling and tone
// mapping in the materials, no post-processing chain), shadows drawn once because nothing that casts
// them moves, the lighting environment pre-baked (src/lib/env.js), shaders compiled in the background,
// and a governor that lowers the resolution if a frame takes too long on this GPU.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { travertine, limestoneFloor, plaster } from './stone.js';
import { studioEnvironment } from '../lib/env.js';
import { createGovernor } from '../lib/gpu.js';

// logo kit mark geometry (SVG units, y down)
const SLAB = [[0, 193.1], [33.83, 193.1], [154.09, 15.71], [130.91, 0]];
const THIN = [[55.95, 21.1], [64.65, 21.1], [181.26, 193.1], [172.56, 193.1]];
const BAR = [[74.37, 143.1], [135.67, 143.1], [139.73, 149.1], [70.3, 149.1]];

function shapeOf(pts) {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => {
    const X = (x - 90.6) / 100, Y = (193.1 - y) / 100;
    if (i) s.lineTo(X, Y); else s.moveTo(X, Y);
  });
  s.closePath();
  return s;
}
function extrude(pts, depth, bevel) {
  const g = new THREE.ExtrudeGeometry(shapeOf(pts), { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 1 });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}
function windowCookie() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512);
  x.filter = 'blur(14px)';
  x.fillStyle = '#fff';
  const cols = 3, rows = 2, pad = 70, gap = 16;
  const w = (512 - pad * 2 - gap * (cols - 1)) / cols, h = (512 - pad * 2 - gap * (rows - 1)) / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) x.fillRect(pad + i * (w + gap), pad + j * (h + gap), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// a soft warm halo for the moment the crossbar glows (stands in for bloom)
function haloTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,214,160,1)');
  g.addColorStop(0.35, 'rgba(255,186,120,0.42)');
  g.addColorStop(1, 'rgba(255,170,100,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const dustVS = /* glsl */`
  uniform float uTime, uPR;
  attribute float aRand;
  varying float vA;
  void main() {
    vec3 p = position;
    p.y += mod(uTime * (0.02 + aRand * 0.03) + aRand * 3.5, 3.6) - 0.2;
    p.x += sin(uTime * 0.2 + aRand * 20.0) * 0.12;
    p.z += cos(uTime * 0.17 + aRand * 13.0) * 0.1;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vA = (0.35 + 0.65 * sin(uTime * (0.8 + aRand) + aRand * 30.0) * 0.5 + 0.5) * smoothstep(-0.2, 0.4, p.y) * smoothstep(3.6, 2.6, p.y);
    gl_PointSize = (1.4 + aRand * 2.4) * uPR * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const dustFS = /* glsl */`
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vA * 0.75;
    gl_FragColor = vec4(1.0, 0.98, 0.94, a);
  }`;
const shaftFS = /* glsl */`
  uniform float uAmt;
  varying vec2 vUv;
  void main() {
    float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
    float len = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
    gl_FragColor = vec4(1.0, 0.97, 0.9, edge * len * uAmt);
  }`;
const shaftVS = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export function createHero(canvas) {
  const noop = { prepare: () => Promise.resolve(), start() {}, reveal() {} };
  if (!canvas) return noop;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
  } catch (e) {
    canvas.closest('[data-hero]')?.classList.add('no-webgl');
    return noop;
  }
  renderer.debug.checkShaderErrors = import.meta.env.DEV; // the checks wait for each compile to finish
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false; // nothing that casts a shadow moves: draw the shadow maps once

  const scene = new THREE.Scene();
  const WALL = new THREE.Color('#EDE7DB');
  scene.background = WALL;
  scene.fog = new THREE.Fog(WALL, 9, 22);
  scene.environmentIntensity = 0.38;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  const small = Math.min(innerWidth, innerHeight) < 700;

  /* ---------------- sculpture */
  const sculpture = new THREE.Group();
  scene.add(sculpture);
  const stone = travertine({ scale: 2.4, seed: 4 });
  const darkBronze = new THREE.MeshPhysicalMaterial({ color: '#5A3E2B', metalness: 1, roughness: 0.34, clearcoat: 0.25, clearcoatRoughness: 0.3 });
  const brightBronze = new THREE.MeshPhysicalMaterial({ color: '#C88E5C', metalness: 1, roughness: 0.17, clearcoat: 0.6, clearcoatRoughness: 0.12, emissive: '#C4895C', emissiveIntensity: 0 });
  const slab = new THREE.Mesh(extrude(SLAB, 0.42, 0.006), stone);
  const thin = new THREE.Mesh(extrude(THIN, 0.12, 0.004), darkBronze);
  thin.position.z = -0.4;
  const bar = new THREE.Mesh(extrude(BAR, 0.52, 0.003), brightBronze);
  bar.position.z = -0.14;
  [slab, thin, bar].forEach((m) => { m.castShadow = true; m.receiveShadow = true; sculpture.add(m); });

  const plinthStone = travertine({ scale: 2.4, seed: 9 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.2, 1.25), plinthStone);
  plinth.position.set(0.02, -0.1, -0.12);
  plinth.castShadow = plinth.receiveShadow = true;
  scene.add(plinth);
  const step = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.06, 1.75), plinthStone);
  step.position.set(0.02, -0.23, -0.12);
  step.castShadow = step.receiveShadow = true;
  scene.add(step);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), limestoneFloor());
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.26;
  floor.receiveShadow = true;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), plaster());
  wall.position.set(0, 6.74, -3.4);
  wall.receiveShadow = true;
  scene.add(wall);

  /* ---------------- light */
  scene.add(new THREE.HemisphereLight('#FFF7EC', '#CFC1AA', 0.42));
  const sun = new THREE.DirectionalLight('#FFE2BC', 3.1);
  sun.position.set(-6.4, 4.4, 3.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -3, near: 0.5, far: 20 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 5;
  scene.add(sun);
  const windowLight = new THREE.SpotLight('#FFF4E6', 26, 0, 0.36, 0.7, 1.1);
  windowLight.position.set(-5.5, 4.4, 5.5);
  windowLight.target.position.set(1.6, 1.4, -3.4);
  windowLight.map = windowCookie();
  windowLight.castShadow = true;
  windowLight.shadow.mapSize.set(small ? 512 : 1024, small ? 512 : 1024);
  windowLight.shadow.bias = -0.0004;
  windowLight.shadow.radius = 3;
  scene.add(windowLight, windowLight.target);

  /* ---------------- atmosphere */
  const DUST = small ? 220 : 480;
  const dp = new Float32Array(DUST * 3), dr = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) { dp.set([(Math.random() - 0.5) * 7, Math.random() * 3.4, (Math.random() - 0.5) * 4 + 0.3], i * 3); dr[i] = Math.random(); }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  dg.setAttribute('aRand', new THREE.BufferAttribute(dr, 1));
  const dustU = { uTime: { value: 0 }, uPR: { value: 1 } };
  const dust = new THREE.Points(dg, new THREE.ShaderMaterial({ uniforms: dustU, vertexShader: dustVS, fragmentShader: dustFS, transparent: true, depthWrite: false }));
  dust.frustumCulled = false;
  scene.add(dust);
  const shaftU = { uAmt: { value: 0.11 } };
  const shaftMat = new THREE.ShaderMaterial({ uniforms: shaftU, vertexShader: shaftVS, fragmentShader: shaftFS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  [[-2.4, 0.9, 0.6], [-1.6, 0.6, 0.45], [-3.1, 1.1, 0.35]].forEach(([x, w, k]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 8), shaftMat);
    m.position.set(x, 2.6, 0.4);
    m.rotation.z = -0.62;
    m.scale.x = k + 0.6;
    scene.add(m);
  });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: '#FFC98A', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(0.17, 0.47, 0.05);
  halo.scale.set(1.5, 0.62, 1);
  halo.visible = false;
  scene.add(halo);

  /* ---------------- camera rig, scroll & pointer */
  const target = new THREE.Vector3(0, 0.95, -0.1);
  const S = { az: 0.62, el: 0.13, r: 8.3, sun: 1, glow: 0, offset: 1, align: 0 };
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => { ptr.x = e.clientX / innerWidth - 0.5; ptr.y = e.clientY / innerHeight - 0.5; }, { passive: true });

  const hero = canvas.closest('[data-hero]');
  const content = hero?.querySelector('.hero__content');
  const sides = hero?.querySelectorAll('.hero__side, .hero__bottom, .hero__scroll');
  let scrollP = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (hero && !reduce) {
    // text leaves first, then the camera finishes its swing (one timeline, so positions stay in sync with the pin)
    const leave = gsap.timeline()
      .to(content, { y: -90, opacity: 0, ease: 'power1.in', duration: 0.5 }, 0)
      .to(sides, { opacity: 0, ease: 'none', duration: 0.28 }, 0)
      .fromTo(hero.querySelector('.hero__align'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.2 }, 0.66)
      .to({}, { duration: 1 }, 0);
    ScrollTrigger.create({
      trigger: hero, start: 'top top', end: '+=110%', pin: true, pinSpacing: true, scrub: 0.8, animation: leave,
      onUpdate: (self) => { scrollP = self.progress; },
    });
  }

  let cssW = 1, cssH = 1;
  const governor = createGovernor(renderer, { onChange: () => resize() });
  function resize() {
    cssW = canvas.clientWidth || innerWidth; cssH = canvas.clientHeight || innerHeight;
    const pr = governor.pixelRatio(cssW, cssH);
    renderer.setPixelRatio(pr);
    renderer.setSize(cssW, cssH, false);
    dustU.uPR.value = pr;
    camera.aspect = cssW / cssH;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);

  let active = false, started = false, ready = false, time = 0;
  const io = new IntersectionObserver(([e]) => { active = e.isIntersecting; if (!active) governor.pause(); }, { threshold: 0 });
  io.observe(canvas);

  const camPos = new THREE.Vector3();
  function draw(dt) {
    time += dt;
    ptr.sx += (ptr.x - ptr.sx) * dt * 2; ptr.sy += (ptr.y - ptr.sy) * dt * 2;
    // scroll: swing round to the front, where the pieces line up into the mark
    const p = scrollP;
    const swing = gsap.parseEase('power2.inOut')(Math.min(1, p / 0.8));
    const az = S.az * (1 - swing) - 0.05 * Math.max(0, (p - 0.8) / 0.2) + ptr.sx * 0.08 + Math.sin(time * 0.13) * 0.025;
    const el = S.el + (0.04 - S.el) * swing - ptr.sy * 0.04;
    const portrait = camera.aspect < 0.9;
    const r = (S.r + (9.2 - S.r) * swing) * (portrait ? 1 + (0.9 - camera.aspect) * 1.1 : 1);
    camPos.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(r).add(target);
    camera.position.copy(camPos);
    camera.lookAt(target);
    // frame: the sculpture sits right of the headline, then centres as the text leaves
    const wide = camera.aspect >= 1.1;
    const shift = wide ? -0.17 * cssW * (1 - swing) * S.offset : 0;
    const lift = wide ? 0 : (portrait ? 0.27 : 0.17) * cssH * (1 - swing * 0.5);
    camera.setViewOffset(cssW, cssH, shift, lift, cssW, cssH);
    sun.intensity = 3.1 * S.sun;
    windowLight.intensity = 26 * S.sun;
    const glow = S.glow + swing * 0.18;
    brightBronze.emissiveIntensity = glow;
    halo.visible = glow > 0.02;
    halo.material.opacity = Math.min(1, glow * 0.45);
    dustU.uTime.value = time;
    renderer.render(scene, camera);
  }
  function frame(_t, deltaMs) {
    if (!ready || !started || !active || document.hidden) return;
    governor.begin();
    draw(Math.min(0.05, (deltaMs || 16) / 1000));
    governor.end(performance.now());
  }
  gsap.ticker.add(frame);

  // Everything heavy happens here, before the hero is shown: the environment is decoded, the shaders
  // compile on the GPU process's threads (the page keeps running), then one frame draws the shadows.
  let preparing = null;
  function prepare() {
    preparing ||= (async () => {
      resize();
      scene.environment = await studioEnvironment();
      camera.position.set(4, 1.5, 7); camera.lookAt(target);
      if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
      renderer.shadowMap.needsUpdate = true;
      draw(0.016);
      ready = true;
      canvas.classList.add('is-ready');
    })().catch((err) => { console.error('Hero 3D failed', err); hero?.classList.add('no-webgl'); });
    return preparing;
  }
  renderer.domElement.addEventListener('webglcontextrestored', () => { renderer.shadowMap.needsUpdate = true; });
  if (import.meta.env.DEV) window.__hero = { THREE, renderer, scene, camera, governor, S, floor, wall, resize };

  return {
    prepare,
    start() {
      if (started) return;
      prepare();
      started = true;
      active = true;
      S.sun = 1.25; S.r = 6.8; S.el = 0.26; S.az = 0.9;
    },
    reveal() {
      if (reduce) { Object.assign(S, { sun: 1, r: 8.3, el: 0.13, az: 0.62 }); return; }
      gsap.to(S, { sun: 1, r: 8.3, el: 0.13, az: 0.62, duration: 3.2, ease: 'expo.out' });
      gsap.fromTo(S, { glow: 1.6 }, { glow: 0, duration: 2.4, ease: 'power2.out' });
    },
  };
}

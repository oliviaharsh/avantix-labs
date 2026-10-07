// Neural ignition intro: a dark brain, one idea sparks, electricity spreads through the neurons,
// the whole brain lights up, flashes to ivory, the logo forms and settles into the nav.
import * as THREE from 'three';
import * as PP from 'postprocessing';
const { EffectComposer, RenderPass, EffectPass, BloomEffect, VignetteEffect, NoiseEffect, ToneMappingEffect, ToneMappingMode, BlendFunction } = PP;
import { gsap } from 'gsap';
import { buildBrain } from './brain.js';

const SEEN_KEY = 'avx-intro-seen';
const T = { spark: 1.0, ignite: 2.35, alive: 4.35, flash: 5.85, light: 6.55, logo: 6.6, flip: 7.95, done: 9.0 };

const COLD = new THREE.Color(0.40, 0.33, 0.27);
const WARM = new THREE.Color(1.0, 0.58, 0.28);
const HOT = new THREE.Color(1.0, 0.88, 0.70);

/* ------------------------------------------------------------------ shaders */
const pointsVS = /* glsl */`
  uniform float uTime, uBase, uGlow, uFlash, uPR, uSize;
  attribute float aAct, aShade, aRand;
  varying float vI, vHot;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float dt = uTime - aAct;
    float on = step(0.0, dt);
    float pdt = max(dt, 0.0); // keep exp() finite before activation (NaN would poison the bloom)
    float spike = on * exp(-pdt * 4.2);
    float lit = on * (1.0 - exp(-pdt * 3.0));
    float shimmer = 0.7 + 0.3 * sin(uTime * (1.4 + aRand * 2.2) + aRand * 50.0);
    vI = uBase * (0.22 + 0.78 * aShade) + lit * uGlow * shimmer * (0.3 + 0.7 * aShade) + spike * 1.7 + uFlash * 2.6;
    vHot = clamp(spike * 1.25 + uFlash, 0.0, 1.0);
    float size = uSize * (0.55 + 0.9 * aRand * aRand) * (0.7 + 0.55 * aShade) * (1.0 + spike * 1.1 + uFlash * 0.8);
    gl_PointSize = min(size * uPR * (2.7 / max(0.35, -mv.z)), 64.0);
    gl_Position = projectionMatrix * mv;
  }`;
const pointsFS = /* glsl */`
  uniform vec3 uCold, uWarm, uHot;
  varying float vI, vHot;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a *= a * (0.55 + 0.45 * smoothstep(0.22, 0.0, d));
    vec3 col = mix(uCold, uWarm, smoothstep(0.06, 0.55, vI));
    col = mix(col, uHot, vHot);
    gl_FragColor = vec4(col * vI * a, 1.0);
  }`;
const edgesVS = /* glsl */`
  attribute float aAct, aDur, aT, aRand;
  varying float vT, vAct, vDur, vRand, vDepth;
  void main() {
    vT = aT; vAct = aAct; vDur = aDur; vRand = aRand;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const edgesFS = /* glsl */`
  uniform float uTime, uBase, uGlow, uFlash;
  uniform vec3 uWarm, uHot;
  varying float vT, vAct, vDur, vRand, vDepth;
  void main() {
    float dt = uTime - vAct;
    float head = dt / max(vDur, 1e-3);
    float started = step(0.0, dt);
    float lit = started * step(vT, head);
    float headGlow = started * exp(-min(abs(vT - head), 4.0) * 20.0) * step(head, 1.3);
    float settled = smoothstep(0.0, 0.5, dt - vDur);
    float ph = fract(uTime * (0.32 + vRand * 0.5) + vRand * 7.0);
    float pulse = exp(-abs(ph - vT) * 16.0) * settled * step(0.5, vRand);
    float fade = clamp(3.4 / vDepth, 0.45, 1.25);
    float i = (uBase * 0.12 + lit * (0.09 + 0.2 * uGlow) + headGlow * 2.0 + pulse * 0.85 * uGlow + uFlash * 1.8) * fade;
    vec3 col = mix(uWarm, uHot, clamp(headGlow + pulse * 0.6 + uFlash, 0.0, 1.0));
    gl_FragColor = vec4(col * i, 1.0);
  }`;
const pulseVS = /* glsl */`
  uniform float uTime, uGlow, uPR, uSize;
  attribute vec3 aA, aB;
  attribute float aAct, aDur, aRand;
  varying float vI;
  void main() {
    float dt = uTime - aAct;
    float head = dt / max(aDur, 1e-3);
    float travelling = step(0.0, head) * step(head, 1.0);
    float settled = smoothstep(0.0, 0.4, dt - aDur);
    float ph = fract(uTime * (0.32 + aRand * 0.5) + aRand * 7.0);
    float looping = settled * step(0.5, aRand);
    float t = travelling > 0.5 ? head : ph;
    vec3 p = mix(aA, aB, clamp(t, 0.0, 1.0));
    vI = travelling * 2.6 + looping * 1.05 * uGlow;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = vI > 0.001 ? min(uSize * uPR * (2.7 / max(0.35, -mv.z)), 48.0) : 0.0;
    gl_Position = projectionMatrix * mv;
  }`;
const pulseFS = /* glsl */`
  uniform vec3 uHot;
  varying float vI;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = exp(-d * d * 38.0);
    gl_FragColor = vec4(uHot * vI * a, 1.0);
  }`;
const arcVS = /* glsl */`
  attribute float aAlpha;
  varying float vA;
  void main() { vA = aAlpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const arcFS = /* glsl */`
  uniform vec3 uHot;
  varying float vA;
  void main() { gl_FragColor = vec4(uHot * vA * 3.2, 1.0); }`;
const flareVS = /* glsl */`
  uniform float uAmt, uScale;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * uScale * (0.55 + 0.45 * min(uAmt, 1.6));
    gl_Position = projectionMatrix * mv;
  }`;
const flareFS = /* glsl */`
  uniform float uAmt, uStar;
  uniform vec3 uCol;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c);
    float core = exp(-d * d * 1100.0) * 3.2;
    float fall = smoothstep(0.5, 0.0, d);
    float glow = (exp(-d * 13.0) * 0.85 + exp(-d * 5.5) * 0.14) * fall * fall;
    float sx = exp(-abs(c.y) * 170.0) * exp(-abs(c.x) * 4.5);
    float sy = exp(-abs(c.x) * 170.0) * exp(-abs(c.y) * 7.0) * 0.55;
    float i = (core + glow + (sx + sy) * uStar * fall) * uAmt;
    gl_FragColor = vec4(uCol * i, 1.0);
  }`;

function pointsMaterial(uniforms, size) {
  return new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uSize: { value: size }, uCold: { value: COLD }, uWarm: { value: WARM }, uHot: { value: HOT } },
    vertexShader: pointsVS, fragmentShader: pointsFS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

/* ------------------------------------------------------------------ helpers */
const $ = (sel, root = document) => root.querySelector(sel);

function introLogoTimeline(svg) {
  const q = (c) => svg.querySelectorAll(c);
  const tl = gsap.timeline();
  gsap.set(svg.querySelectorAll('path, rect'), { transformBox: 'fill-box' });
  tl.from(q('.lg-slab'), { yPercent: 18, opacity: 0, scaleY: 0.4, transformOrigin: '0% 100%', duration: 0.9, ease: 'expo.out' }, 0)
    .from(q('.lg-thin'), { yPercent: -30, opacity: 0, duration: 0.8, ease: 'expo.out' }, 0.12)
    .from(q('.lg-bar'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.7, ease: 'expo.inOut' }, 0.3)
    .fromTo(q('.lg-bar'), { filter: 'drop-shadow(0 0 0px rgba(196,137,92,0))' }, { filter: 'drop-shadow(0 0 10px rgba(196,137,92,.95))', duration: 0.35, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.6)
    .from(q('.lg-word'), { opacity: 0, x: -14, duration: 0.8, ease: 'expo.out' }, 0.4)
    .from(q('.lg-rule'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.8, ease: 'expo.inOut' }, 0.5)
    .from(q('.lg-labs'), { opacity: 0, x: 10, duration: 0.6, ease: 'expo.out' }, 0.75);
  return tl;
}

function flipToNav(introLogo, navLogo, duration = 0.95) {
  const a = introLogo.getBoundingClientRect();
  const b = navLogo.getBoundingClientRect();
  const s = b.width / a.width;
  return gsap.to(introLogo, {
    x: b.left + b.width / 2 - (a.left + a.width / 2),
    y: b.top + b.height / 2 - (a.top + a.height / 2),
    scale: s, duration, ease: 'expo.inOut',
  });
}

/* ------------------------------------------------------------------ main */
export function runIntro({ onLight, onReveal, onFail, force = false }) {
  const root = $('[data-intro]');
  const navLogo = $('[data-nav-logo]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seen = false;
  try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (_) { /* storage blocked */ }

  const finish = () => {
    gsap.set(navLogo, { visibility: 'visible' });
    root.remove();
    document.body.classList.remove('is-locked', 'is-loading');
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (_) { /* ignore */ }
  };

  if (!root) { onLight(); onReveal(); return; }
  gsap.set(navLogo, { visibility: 'hidden' });
  gsap.set($('[data-intro-logo]', root), { xPercent: -50, yPercent: -50 });

  const canvas = $('[data-intro-canvas]', root);
  let renderer = null;
  if (!((seen && !force) || reduce)) {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true });
    } catch (e) { renderer = null; }
  }

  // returning visitor in this session, reduced motion, or no WebGL: a short, calm entrance
  if (!renderer) {
    const logoWrap = $('[data-intro-logo]', root);
    gsap.set(root, { background: 'transparent' });
    gsap.set($('[data-intro-flash]', root), { opacity: 1 });
    $('[data-intro-canvas]', root).remove();
    $('.intro__ui', root).remove();
    onLight();
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(logoWrap, { opacity: 1, duration: reduce ? 0.01 : 0.5 })
      .add(() => { if (!reduce) flipToNav(logoWrap, navLogo, 0.8); }, '+=0.35')
      .to($('[data-intro-flash]', root), { opacity: 0, duration: reduce ? 0.3 : 0.8, ease: 'power2.inOut' }, '<0.15')
      .add(onReveal, '<0.1')
      .to(logoWrap, { opacity: reduce ? 0 : 1, duration: 0.2 }, '>-0.05');
    return;
  }

  document.body.classList.add('is-locked');

  const small = Math.min(innerWidth, innerHeight) < 700 || navigator.hardwareConcurrency <= 4;
  const PR = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
  renderer.setPixelRatio(PR);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.05, 60);

  const brain = buildBrain(small ? { cortexCount: 5200, nodeCount: 520 } : { cortexCount: 9500, nodeCount: 950 });

  const U = {
    uTime: { value: -10 }, uBase: { value: 0 }, uGlow: { value: 0 }, uFlash: { value: 0 }, uPR: { value: PR },
  };
  const group = new THREE.Group();
  scene.add(group);

  // cortex
  const cg = new THREE.BufferGeometry();
  cg.setAttribute('position', new THREE.BufferAttribute(brain.cortex.pos, 3));
  cg.setAttribute('aAct', new THREE.BufferAttribute(brain.cortex.act, 1));
  cg.setAttribute('aShade', new THREE.BufferAttribute(brain.cortex.shade, 1));
  cg.setAttribute('aRand', new THREE.BufferAttribute(brain.cortex.rand, 1));
  const cortex = new THREE.Points(cg, pointsMaterial(U, small ? 5.2 : 4.4));
  group.add(cortex);

  // neurons
  const ng = new THREE.BufferGeometry();
  ng.setAttribute('position', new THREE.BufferAttribute(brain.nodes.pos, 3));
  ng.setAttribute('aAct', new THREE.BufferAttribute(brain.nodes.act, 1));
  ng.setAttribute('aShade', new THREE.BufferAttribute(new Float32Array(brain.nodes.count).fill(1), 1));
  ng.setAttribute('aRand', new THREE.BufferAttribute(brain.nodes.rand, 1));
  const neurons = new THREE.Points(ng, pointsMaterial(U, small ? 9 : 8));
  group.add(neurons);

  // wiring
  const eg = new THREE.BufferGeometry();
  eg.setAttribute('position', new THREE.BufferAttribute(brain.edges.pos, 3));
  eg.setAttribute('aAct', new THREE.BufferAttribute(brain.edges.act, 1));
  eg.setAttribute('aDur', new THREE.BufferAttribute(brain.edges.dur, 1));
  eg.setAttribute('aT', new THREE.BufferAttribute(brain.edges.t, 1));
  eg.setAttribute('aRand', new THREE.BufferAttribute(brain.edges.rand, 1));
  const wires = new THREE.LineSegments(eg, new THREE.ShaderMaterial({
    uniforms: { ...U, uWarm: { value: WARM }, uHot: { value: HOT } },
    vertexShader: edgesVS, fragmentShader: edgesFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  group.add(wires);

  // travelling impulses
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(brain.pulses.a, 3));
  pg.setAttribute('aA', new THREE.BufferAttribute(brain.pulses.a, 3));
  pg.setAttribute('aB', new THREE.BufferAttribute(brain.pulses.b, 3));
  pg.setAttribute('aAct', new THREE.BufferAttribute(brain.pulses.act, 1));
  pg.setAttribute('aDur', new THREE.BufferAttribute(brain.pulses.dur, 1));
  pg.setAttribute('aRand', new THREE.BufferAttribute(brain.pulses.rand, 1));
  const pulses = new THREE.Points(pg, new THREE.ShaderMaterial({
    uniforms: { ...U, uSize: { value: small ? 13 : 11 }, uHot: { value: HOT } },
    vertexShader: pulseVS, fragmentShader: pulseFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  pulses.frustumCulled = false;
  group.add(pulses);

  // lightning arcs (rebuilt every frame while active)
  const ARCS = 18, SEG = 14;
  const arcPos = new Float32Array(ARCS * SEG * 2 * 3);
  const arcAlpha = new Float32Array(ARCS * SEG * 2);
  const ag = new THREE.BufferGeometry();
  ag.setAttribute('position', new THREE.BufferAttribute(arcPos, 3).setUsage(THREE.DynamicDrawUsage));
  ag.setAttribute('aAlpha', new THREE.BufferAttribute(arcAlpha, 1).setUsage(THREE.DynamicDrawUsage));
  const arcs = new THREE.LineSegments(ag, new THREE.ShaderMaterial({
    uniforms: { uHot: { value: HOT } }, vertexShader: arcVS, fragmentShader: arcFS,
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  }));
  arcs.frustumCulled = false;
  group.add(arcs);
  const live = []; // { a:[x,y,z], b:[x,y,z], born, life, amp }

  // the idea: a flickering filament-like spark; and an inner light for when the brain comes alive
  const sparkPos = brain.spark.pos;
  const glowQuad = (scale, star, col) => {
    const u = { uAmt: { value: 0 }, uScale: { value: scale }, uStar: { value: star }, uCol: { value: col } };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: u, vertexShader: flareVS, fragmentShader: flareFS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
    m.frustumCulled = false;
    m.renderOrder = 10;
    return [m, u];
  };
  const [flare, flareU] = glowQuad(1.05, 1, HOT);
  flare.position.set(...sparkPos);
  group.add(flare);
  const [core, coreU] = glowQuad(5.2, 0, WARM.clone().lerp(HOT, 0.4));
  core.position.set(0, 0.05, 0.05);
  group.add(core);

  // faint dust far behind, for depth
  const DUST = small ? 260 : 520;
  const dpos = new Float32Array(DUST * 3), dAct = new Float32Array(DUST), dRand = new Float32Array(DUST), dShade = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    const r = 5 + Math.random() * 10, a = Math.random() * Math.PI * 2, y = (Math.random() * 2 - 1) * 5;
    dpos.set([Math.cos(a) * r, y, Math.sin(a) * r - 4], i * 3);
    dAct[i] = 99; dRand[i] = Math.random(); dShade[i] = Math.random();
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  dg.setAttribute('aAct', new THREE.BufferAttribute(dAct, 1));
  dg.setAttribute('aRand', new THREE.BufferAttribute(dRand, 1));
  dg.setAttribute('aShade', new THREE.BufferAttribute(dShade, 1));
  const dustU = { ...U, uBase: { value: 0 } };
  const dust = new THREE.Points(dg, pointsMaterial(dustU, 6));
  scene.add(dust);

  // post-processing: bloom does the electricity
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new BloomEffect({ mipmapBlur: true, levels: small ? 5 : 6, luminanceThreshold: 0.1, luminanceSmoothing: 0.35, intensity: 1.1, radius: 0.82 });
  const vignette = new VignetteEffect({ darkness: 0.66, offset: 0.26 });
  const grain = new NoiseEffect({ premultiply: true, blendFunction: BlendFunction.ADD });
  grain.blendMode.opacity.value = 0.12;
  const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
  composer.addPass(new EffectPass(camera, bloom, vignette, grain, tone));
  composer.setSize(innerWidth, innerHeight);

  /* ---------------------------------------------------------------- state & timeline */
  const S = { base: 0, glow: 0, flash: 0, spark: 0, core: 0, bloom: 1.1, dist: 4.7, rot: -0.32, tilt: 0.04 };
  const caps = root.querySelectorAll('[data-cap]');
  const flashEl = $('[data-intro-flash]', root);
  const logoWrap = $('[data-intro-logo]', root);
  const bar = $('[data-intro-bar]', root);
  gsap.set(caps, { opacity: 0, y: 14, filter: 'blur(12px)' });

  const tl = gsap.timeline({ paused: true });
  // darkness, the brain barely there
  tl.to(S, { base: 0.26, duration: 1.4, ease: 'power2.inOut' }, 0.15)
    .to(S, { rot: 0.3, duration: T.flash + 0.6, ease: 'sine.inOut' }, 0)
    .to(bar, { scaleX: 1, duration: T.flash, ease: 'none' }, 0);
  // the idea flickers on like a filament
  const fl = [[0, 1.0, 0.035], [0.05, 0.12, 0.05], [0.11, 0.85, 0.03], [0.16, 0.0, 0.07], [0.27, 1.25, 0.04], [0.33, 0.65, 0.09], [0.45, 1.0, 0.35]];
  fl.forEach(([at, v, d]) => tl.to(S, { spark: v, duration: d, ease: 'none' }, T.spark + at));
  tl.to(S, { spark: 2.6, duration: 0.18, ease: 'power2.in' }, T.ignite - 0.18)
    .to(S, { spark: 0.75, duration: 0.9, ease: 'power2.out' }, T.ignite)
    .to(S, { glow: 0.95, duration: 0.3 }, T.ignite - 0.05)
    .to(S, { bloom: 1.55, duration: 0.6 }, T.ignite - 0.1)
    .to(S, { dist: 4.05, duration: T.alive - T.ignite + 0.4, ease: 'sine.inOut' }, T.ignite - 0.3);
  // the whole brain comes alive
  tl.to(S, { glow: 1.7, bloom: 2.1, core: 0.55, duration: 1.2, ease: 'power2.inOut' }, T.alive)
    .to(S, { dist: 3.25, duration: T.flash - T.alive + 0.2, ease: 'power1.inOut' }, T.alive)
    .to(S, { spark: 0.0, duration: 1.0 }, T.alive);
  // flash
  tl.to(S, { glow: 3.2, core: 3.2, bloom: 5.5, flash: 1, dist: 1.7, duration: T.light - T.flash, ease: 'power3.in' }, T.flash)
    .to(flashEl, { opacity: 1, duration: T.light - T.flash - 0.12, ease: 'power2.in' }, T.flash + 0.12)
    .add(() => root.classList.add('is-light'), T.flash + 0.2);
  // captions
  [[1.35, 2.55], [2.75, 4.05], [4.4, 5.75]].forEach(([a, b], i) => {
    tl.to(caps[i], { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' }, a)
      .to(caps[i], { opacity: 0, y: -10, filter: 'blur(10px)', duration: 0.6, ease: 'power2.in' }, b);
  });
  // ivory: stop WebGL, form the logo, fly it into the nav, reveal the hero
  let stopped = false;
  tl.add(() => {
    stopped = true;
    gsap.set(root, { background: 'transparent' });
    canvas.style.visibility = 'hidden';
    onLight();
  }, T.light);
  tl.set(logoWrap, { opacity: 1 }, T.logo);
  tl.add(introLogoTimeline(logoWrap.querySelector('svg')), T.logo);
  tl.add(() => flipToNav(logoWrap, navLogo), T.flip);
  tl.to(flashEl, { opacity: 0, duration: 0.95, ease: 'power2.inOut' }, T.flip + 0.1);
  tl.add(() => onReveal(), T.flip + 0.2);
  tl.add(() => { cleanup(); finish(); }, T.done);

  /* ---------------------------------------------------------------- lightning */
  const nodePos = (i) => brain.nodes.list[i];
  const spawn = (a, b, now, life, amp) => { if (live.length < ARCS) live.push({ a, b, born: now, life, amp }); };
  let lastFront = 0, lastAlive = 0;
  const firstDone = new Set();
  function updateArcs(now) {
    const ut = now - T.ignite;
    // the spark jumps to its first neurons
    brain.spark.targets.forEach((idx, k) => {
      const at = -0.12 + k * 0.07;
      if (!firstDone.has(k) && ut >= at && ut < 0.9) { firstDone.add(k); spawn(sparkPos, nodePos(idx), now, 0.38 + Math.random() * 0.22, 0.11); }
    });
    // crackle along the travelling front
    if (ut > 0 && ut < 2.25 && now - lastFront > 0.035) {
      lastFront = now;
      for (let n = 0; n < 2; n++) {
        const e = Math.floor(Math.random() * brain.edges.count);
        const act = brain.edges.act[e * 2];
        if (Math.abs(act - ut) < 0.12) { const [a, b] = brain.edges.pairs[e]; spawn(nodePos(a), nodePos(b), now, 0.1 + Math.random() * 0.08, 0.12); }
      }
    }
    // when alive, occasional bright discharges anywhere
    if (now > T.alive && now < T.light && now - lastAlive > 0.07) {
      lastAlive = now;
      const e = Math.floor(Math.random() * brain.edges.count);
      const [a, b] = brain.edges.pairs[e];
      spawn(nodePos(a), nodePos(b), now, 0.12, 0.14);
    }
    // rebuild geometry
    let v = 0;
    for (let i = live.length - 1; i >= 0; i--) if (now - live[i].born > live[i].life || now < live[i].born) live.splice(i, 1);
    for (const arc of live) {
      const k = 1 - (now - arc.born) / arc.life;
      const flick = 0.55 + 0.45 * Math.random();
      const [ax, ay, az] = arc.a, [bx, by, bz] = arc.b;
      const len = Math.hypot(bx - ax, by - ay, bz - az);
      let px = ax, py = ay, pz = az;
      for (let s = 1; s <= SEG; s++) {
        const t = s / SEG, w = Math.sin(Math.PI * t) * arc.amp * len * 1.6;
        const nx = ax + (bx - ax) * t + (s < SEG ? (Math.random() - 0.5) * w : 0);
        const ny = ay + (by - ay) * t + (s < SEG ? (Math.random() - 0.5) * w : 0);
        const nz = az + (bz - az) * t + (s < SEG ? (Math.random() - 0.5) * w : 0);
        arcPos.set([px, py, pz, nx, ny, nz], v * 3);
        arcAlpha[v] = arcAlpha[v + 1] = k * flick;
        v += 2; px = nx; py = ny; pz = nz;
      }
    }
    for (let i = v; i < arcAlpha.length; i++) arcAlpha[i] = 0;
    ag.setDrawRange(0, v);
    ag.attributes.position.needsUpdate = true;
    ag.attributes.aAlpha.needsUpdate = true;
  }

  /* ---------------------------------------------------------------- render loop */
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  const onMove = (e) => { ptr.x = e.clientX / innerWidth - 0.5; ptr.y = e.clientY / innerHeight - 0.5; };
  addEventListener('pointermove', onMove, { passive: true });
  const onResize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    composer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', onResize);

  const look = new THREE.Vector3(0, -0.04, 0);
  let failed = false;
  function frame(_t, deltaMs) {
    if (stopped || failed) return;
    try { draw(deltaMs); } catch (err) { failed = true; tl.kill(); cleanup(); onFail?.(err); }
  }
  function draw(deltaMs) {
    const dt = Math.min(0.05, (deltaMs || 16) / 1000);
    const time = tl.time();
    U.uTime.value = time - T.ignite;
    U.uBase.value = S.base; U.uGlow.value = S.glow; U.uFlash.value = S.flash;
    dustU.uBase.value = S.base * 0.5 + S.glow * 0.08;
    flareU.uAmt.value = S.spark * (0.92 + 0.08 * Math.sin(time * 37));
    coreU.uAmt.value = S.core;
    bloom.intensity = S.bloom;
    ptr.sx += (ptr.x - ptr.sx) * dt * 2.5; ptr.sy += (ptr.y - ptr.sy) * dt * 2.5;
    group.rotation.y = S.rot + ptr.sx * 0.22;
    group.rotation.x = S.tilt + ptr.sy * 0.12 + Math.sin(time * 0.6) * 0.015;
    dust.rotation.y = time * 0.01;
    const portrait = camera.aspect < 1;
    const dist = S.dist * (portrait ? 1 + (1 - camera.aspect) * 1.25 : 1);
    camera.position.set(dist * 0.9, 0.36 + dist * 0.035, dist * 0.42);
    camera.lookAt(look);
    updateArcs(time);
    composer.render(dt);
    if (import.meta.env.DEV) window.__intro && window.__intro.dbg.frames++;
  }

  function cleanup() {
    gsap.ticker.remove(frame);
    removeEventListener('pointermove', onMove);
    removeEventListener('resize', onResize);
    removeEventListener('keydown', onKey);
    scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
    composer.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
  }

  // skip
  const skip = () => {
    if (tl.time() >= T.light) { tl.timeScale(2.2); return; }
    tl.seek(Math.max(tl.time(), T.flash - 0.05));
    tl.timeScale(2);
  };
  const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skip(); } };
  addEventListener('keydown', onKey);
  $('[data-intro-skip]', root).addEventListener('click', skip);

  // start once the serif has loaded (captions), but never wait long
  const fontReady = document.fonts?.load ? Promise.race([document.fonts.load('italic 40px "Instrument Serif"'), new Promise((r) => setTimeout(r, 900))]) : Promise.resolve();
  const dbg = { frames: 0 };
  let started = false;
  if (import.meta.env.DEV) window.__intro = { PP, THREE, gsap, tl, T, dbg, renderer, scene, camera, composer, S, started: () => started, at: (t) => { tl.pause(); tl.seek(t); }, play: () => tl.play() };
  fontReady.then(() => {
    document.body.classList.remove('is-loading');
    renderer.compile(scene, camera);
    gsap.ticker.add(frame);
    started = true;
    tl.play(0);
  }).catch((err) => { cleanup(); onFail?.(err); });
}

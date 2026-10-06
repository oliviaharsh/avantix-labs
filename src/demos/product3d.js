// 02 3D web: a real-time product viewer for a manufacturer (fictional). DN100 PN16 weld-neck flange
// assembly: two flanges, a spiral-wound gasket, eight threaded studs and nuts. Rotate, change material,
// explode the assembly. Units: 1 = 100 mm.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';

const MATERIALS = {
  stainless: { label: 'Stainless 316L', color: '#CDD1D6', roughness: 0.2 },
  carbon: { label: 'Carbon steel', color: '#71757A', roughness: 0.42 },
  bronze: { label: 'Bronze', color: '#C9975C', roughness: 0.26 },
};

function lathe(profile, segments = 96) {
  const g = new THREE.LatheGeometry(profile.map(([r, z]) => new THREE.Vector2(r, z)), segments);
  g.rotateX(Math.PI / 2); // lathe axis Y -> Z
  return g;
}
function ring(rIn, rOut, z0, z1, segments = 96) {
  return lathe([[rIn, z0], [rOut, z0], [rOut, z1], [rIn, z1], [rIn, z0]], segments);
}
function flangeDisc() {
  const s = new THREE.Shape();
  s.absarc(0, 0, 1.1, 0, Math.PI * 2, false);
  const bore = new THREE.Path(); bore.absarc(0, 0, 0.535, 0, Math.PI * 2, true); s.holes.push(bore);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const h = new THREE.Path(); h.absarc(Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0.09, 0, Math.PI * 2, true); s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 40 });
  g.translate(0, 0, 0.03);
  return g;
}
function threadedStud(length = 0.98, r = 0.08) {
  const pts = [[0, -length / 2]];
  const n = 46;
  for (let i = 0; i <= n; i++) {
    const z = -length / 2 + (i / n) * length;
    pts.push([i % 2 ? r : r * 0.86, z]);
  }
  pts.push([0, length / 2]);
  return lathe(pts, 24);
}
function hexNut() {
  const g = new THREE.CylinderGeometry(0.15, 0.15, 0.16, 6, 1);
  g.rotateX(Math.PI / 2);
  const chamfer = new THREE.CylinderGeometry(0.135, 0.135, 0.165, 24, 1);
  chamfer.rotateX(Math.PI / 2);
  return [g, chamfer];
}
function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const grd = x.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)');
  grd.addColorStop(0.55, 'rgba(0,0,0,0.18)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = grd; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export function mount(stage) {
  stage.innerHTML = `
  <div class="p3" data-p3>
    <canvas aria-label="3D model of a flange assembly. Drag to rotate." role="img" data-cursor="Drag"></canvas>
    <div class="p3__top">
      <p class="p3__title">Weld-neck flange assembly<small>DN100 · PN16 · EN 1092-1</small></p>
      <p class="p3__spec"><span data-mat-label>Stainless 316L</span><br/>8 × M16 studs · spiral-wound gasket</p>
    </div>
    <div class="p3__hot" data-hot="face"><i></i><span>Raised face, machined finish</span></div>
    <div class="p3__hot" data-hot="neck"><i></i><span>Tapered weld neck</span></div>
    <div class="p3__hot" data-hot="gasket"><i></i><span>Spiral-wound gasket</span></div>
    <div class="p3__hot" data-hot="stud"><i></i><span>8 × M16 studs with nuts</span></div>
    <p class="p3__hint" data-hint>Drag to rotate</p>
    <div class="p3__bar">
      <div class="seg" role="group" aria-label="Material">
        ${Object.entries(MATERIALS).map(([k, m], i) => `<button type="button" data-mat="${k}" aria-pressed="${i === 0}">${m.label}</button>`).join('')}
      </div>
      <div class="seg" role="group" aria-label="View">
        <button type="button" data-explode aria-pressed="false">Explode</button>
        <button type="button" data-labels aria-pressed="false">Labels</button>
      </div>
    </div>
  </div>`;

  const wrap = stage.querySelector('[data-p3]');
  const canvas = wrap.querySelector('canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    wrap.innerHTML = '<p class="demo-error">3D needs WebGL, which this browser has turned off.</p>';
    return {};
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 1.05;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(5.0, 2.3, 4.3);

  const key = new THREE.DirectionalLight('#FFE9D2', 2.2); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight('#C4895C', 2.4); rim.position.set(-4, 2, -3); scene.add(rim);

  // materials
  const metal = new THREE.MeshPhysicalMaterial({ color: MATERIALS.stainless.color, metalness: 1, roughness: 0.2, clearcoat: 0.15 });
  const studMat = new THREE.MeshStandardMaterial({ color: '#3B3C3F', metalness: 1, roughness: 0.42 });
  const winding = new THREE.MeshStandardMaterial({ color: '#B9BDC3', metalness: 1, roughness: 0.32 });
  const centring = new THREE.MeshStandardMaterial({ color: '#C4895C', metalness: 0.25, roughness: 0.5 });

  const assembly = new THREE.Group();
  scene.add(assembly);
  const disc = flangeDisc();
  const face = ring(0.535, 0.79, 0, 0.03);
  const neck = lathe([[0.77, 0.23], [0.572, 0.68], [0.572, 0.75], [0.535, 0.75], [0.535, 0.23], [0.77, 0.23]]);
  const pipe = ring(0.535, 0.5715, 0.75, 1.18, 64);
  function flange() {
    const g = new THREE.Group();
    [disc, face, neck, pipe].forEach((geo) => g.add(new THREE.Mesh(geo, metal)));
    return g;
  }
  const fa = flange(); fa.position.z = 0.0225;
  const fb = flange(); fb.rotation.y = Math.PI; fb.position.z = -0.0225;
  const gasket = new THREE.Group();
  gasket.add(new THREE.Mesh(ring(0.56, 0.72, -0.0225, 0.0225, 96), winding));
  gasket.add(new THREE.Mesh(ring(0.72, 0.81, -0.016, 0.016, 96), centring));
  assembly.add(fa, fb, gasket);

  const studGeo = threadedStud();
  const [nutGeo, nutCham] = hexNut();
  const nutGeoFinal = nutGeo; // chamfer cylinder intersects visually; keep both for a softer silhouette
  const studs = [], nutsA = [], nutsB = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(a) * 0.9, y = Math.sin(a) * 0.9;
    const s = new THREE.Mesh(studGeo, studMat); s.position.set(x, y, 0); s.userData.home = 0; studs.push(s);
    const na = new THREE.Group(); na.add(new THREE.Mesh(nutGeoFinal, studMat), new THREE.Mesh(nutCham, studMat)); na.position.set(x, y, 0.2525 + 0.08); na.userData.home = na.position.z; nutsA.push(na);
    const nb = na.clone(); nb.position.set(x, y, -0.2525 - 0.08); nb.userData.home = nb.position.z; nutsB.push(nb);
    assembly.add(s, na, nb);
  }
  assembly.rotation.x = -0.05;

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.6), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.3;
  scene.add(shadow);

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.9;
  controls.minPolarAngle = 0.6; controls.maxPolarAngle = 1.9;
  controls.target.set(0, -0.05, 0);
  const hint = wrap.querySelector('[data-hint]');
  controls.addEventListener('start', () => { controls.autoRotate = false; hint.style.opacity = '0'; });

  // explode
  const E = { t: 0 };
  const applyExplode = () => {
    const t = E.t;
    fa.position.z = 0.0225 + 0.95 * t;
    fb.position.z = -0.0225 - 0.95 * t;
    gasket.rotation.x = 0.0; gasket.position.y = 0.0;
    studs.forEach((s, i) => { s.position.z = 2.1 * gsap.parseEase('power2.in')(Math.min(1, t * 1.15)) + 0.02 * i * t; });
    nutsA.forEach((n) => { n.position.z = n.userData.home + 0.95 * t + 1.6 * t; });
    nutsB.forEach((n) => { n.position.z = n.userData.home - 0.95 * t - 0.5 * t; });
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
  wrap.querySelectorAll('[data-mat]').forEach((b) => b.addEventListener('click', () => {
    wrap.querySelectorAll('[data-mat]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    const m = MATERIALS[b.dataset.mat];
    gsap.to(metal.color, { ...new THREE.Color(m.color), duration: 0.7, ease: 'power2.out' });
    gsap.to(metal, { roughness: m.roughness, duration: 0.7 });
    wrap.querySelector('[data-mat-label]').textContent = m.label;
  }));

  // hotspots
  const hots = {
    face: { obj: fa, local: new THREE.Vector3(Math.cos(0.5) * 0.78, Math.sin(0.5) * 0.78, 0.0) },
    neck: { obj: fa, local: new THREE.Vector3(0, 0.66, 0.46) },
    gasket: { obj: gasket, local: new THREE.Vector3(0.81, -0.05, 0) },
    stud: { obj: nutsA[1], local: new THREE.Vector3(0, 0.1, 0.08) },
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

  let W = 0, H = 0;
  const resize = () => {
    W = wrap.clientWidth; H = wrap.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(wrap);
  resize();

  let running = false;
  const frame = () => {
    controls.update();
    renderer.render(scene, camera);
    placeHots(W, H);
  };
  frame();
  return {
    resume() { if (!running) { running = true; gsap.ticker.add(frame); } },
    pause() { if (running) { running = false; gsap.ticker.remove(frame); } },
  };
}

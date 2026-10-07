// GPU helpers shared by the intro, the hero and the 3D demos.
// - gpuTier: a first guess at how much this device can draw, from the GPU's name and the screen.
// - Governor: measures the real cost of each frame and lowers the resolution until it fits.
// - compileComposer: compiles every shader of a post-processing chain in the background. Compiling on
//   first use freezes the page (seconds on a first visit to Windows machines, where shaders go
//   through the D3D compiler); compileAsync lets the GPU process do it on its own threads.
import * as THREE from 'three';

let tierCache = null;
export function gpuTier(renderer) {
  if (tierCache) return tierCache;
  let name = '';
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  } catch (_) { /* hidden by the browser */ }
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(innerWidth, innerHeight) < 700;
  const software = /swiftshader|llvmpipe|software|basic render/i.test(name);
  const discrete = /nvidia|geforce|quadro|\brtx\b|radeon (rx|pro)|\brx \d{3,4}|arc\(tm\) a\d/i.test(name);
  const tier = software ? 'min' : coarse || small ? 'low' : discrete ? 'high' : 'mid';
  tierCache = { name, tier };
  return tierCache;
}

// Pixels to draw per frame by tier; the governor moves within these.
const BUDGET = { high: 2.6e6, mid: 1.45e6, low: 0.8e6, min: 0.4e6 };
const PR_MAX = { high: 1.75, mid: 1.5, low: 1.5, min: 1 };
const FLOOR = 0.3e6;

// GPU time per frame from EXT_disjoint_timer_query_webgl2 (desktop Chrome, Edge, Firefox).
function gpuTimer(gl) {
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (!ext) return null;
  const pending = [];
  let open = null;
  return {
    begin() { if (open || pending.length > 3) return; open = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, open); },
    end() { if (!open) return; gl.endQuery(ext.TIME_ELAPSED_EXT); pending.push(open); open = null; },
    poll() {
      let ms = null;
      while (pending.length && gl.getQueryParameter(pending[0], gl.QUERY_RESULT_AVAILABLE)) {
        const q = pending.shift();
        if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) ms = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
        gl.deleteQuery(q);
      }
      return ms;
    },
  };
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };

// Keeps a canvas inside a frame budget. Wrap each render in begin()/end(); onChange asks the owner
// to resize, and pixelRatio() gives the ratio to use for a CSS size.
export function createGovernor(renderer, { targetMs = 9, onChange = () => {} } = {}) {
  const { tier } = gpuTier(renderer);
  let budget = BUDGET[tier];
  const ceiling = Math.min(3.2e6, budget * 1.6);
  const prMax = PR_MAX[tier];
  const timer = gpuTimer(renderer.getContext());
  const gpu = [], gaps = [];
  let skip = 45, last = 0, lowered = false;
  const stats = { gpuMs: null, frameMs: null, budget };
  const change = (b) => { budget = stats.budget = b; skip = 45; gpu.length = gaps.length = 0; onChange(); };
  return {
    tier,
    stats,
    pixelRatio(w, h) {
      const dpr = window.devicePixelRatio || 1;
      return Math.max(0.5, Math.min(dpr, prMax, Math.sqrt(budget / Math.max(1, w * h))));
    },
    begin() { timer?.begin(); },
    end(now) {
      timer?.end();
      const gap = last ? now - last : 0;
      last = now;
      if (skip > 0) { skip--; timer?.poll(); return; } // first frames after a change: uploads and compiles
      if (gap > 250) return; // tab was hidden or the page paused
      if (timer) { const ms = timer.poll(); if (ms !== null) gpu.push(ms); } else gaps.push(gap);
      if (gpu.length >= 40) {
        const ms = stats.gpuMs = median(gpu); gpu.length = 0;
        if (ms > targetMs * 1.2 && budget > FLOOR) { lowered = true; change(Math.max(FLOOR, budget * Math.max(0.5, Math.min(0.85, targetMs / ms)))); }
        else if (!lowered && ms < targetMs * 0.45 && budget < ceiling) change(Math.min(ceiling, budget * 1.3));
      }
      if (gaps.length >= 70) {
        const ms = stats.frameMs = median(gaps); gaps.length = 0;
        if (ms > 19 && budget > FLOOR) { lowered = true; change(Math.max(FLOOR, budget * 0.7)); }
      }
    },
    pause() { last = 0; },
  };
}

// Every material a pass uses, including those effects keep inside (blur mips, luminance, ...).
function materialsIn(root) {
  const found = new Set(), seen = new Set();
  const walk = (o, depth) => {
    if (!o || typeof o !== 'object' || seen.has(o) || depth > 6) return;
    seen.add(o);
    if (o.isMaterial) { found.add(o); return; }
    if (o.isTexture || o.isBufferGeometry || o.isRenderTarget || o.isWebGLRenderTarget || o.isWebGLRenderer || o.isCamera || ArrayBuffer.isView(o) || (typeof Node !== 'undefined' && o instanceof Node)) return;
    for (const k in o) { let v; try { v = o[k]; } catch (_) { continue; } walk(v, depth + 1); }
  };
  walk(root, 0);
  return found;
}

// Compiles a postprocessing EffectComposer and its scene without blocking the page.
export async function compileComposer(renderer, composer, scene, camera) {
  if (!renderer.compileAsync) return;
  const offscreen = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const quad = new THREE.PlaneGeometry(2, 2);
  const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const prev = renderer.getRenderTarget();
  const jobs = [];
  // programs depend on where they draw: passes into buffers (linear), the last one to the screen
  renderer.setRenderTarget(offscreen);
  jobs.push(renderer.compileAsync(scene, camera));
  const last = composer.passes[composer.passes.length - 1];
  for (const pass of composer.passes) {
    if (pass.scene === scene) continue; // the RenderPass, done above
    for (const m of materialsIn(pass)) {
      const s = new THREE.Scene();
      const mesh = new THREE.Mesh(quad, m);
      mesh.frustumCulled = false;
      s.add(mesh);
      renderer.setRenderTarget(pass === last && m === pass.fullscreenMaterial ? null : offscreen);
      jobs.push(renderer.compileAsync(s, flat));
    }
  }
  renderer.setRenderTarget(prev);
  await Promise.all(jobs);
  offscreen.dispose();
  quad.dispose();
}

// Pre-filters three.js's RoomEnvironment once (PMREM) and saves it as src/assets/env/room-env.bin.gz.
// At runtime src/lib/env.js decodes it in a few milliseconds, so no browser has to compile and run the
// PMREM shaders (about a second of frozen page on a first visit).
// Format (before gzip): 'AVXE', width, height (uint16 LE), then RGB bytes, log encoded
// (byte = log2(1 + v) / log2(1 + ENV_MAX) * 255) and stored as the difference from a
// left + up - upLeft prediction so they compress well. Rows stay in GL order (bottom first).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ENV_MAX, ENV_SIZE, ENV_SIGMA } from '../src/lib/env.js';

async function bake() {
  const renderer = new THREE.WebGLRenderer();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(new RoomEnvironment(), ENV_SIGMA, 0.1, 100, { size: ENV_SIZE });
  const { width: w, height: h } = rt;
  const gl = renderer.getContext();
  renderer.setRenderTarget(rt);
  const f = new Float32Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, f);
  renderer.setRenderTarget(null);
  const k = 255 / Math.log2(1 + ENV_MAX);
  const W = w * 3, raw = new Uint8Array(W * h);
  let peak = 0;
  for (let i = 0; i < w * h; i++) {
    for (let c = 0; c < 3; c++) {
      const v = Math.max(0, f[i * 4 + c]);
      peak = Math.max(peak, v);
      raw[i * 3 + c] = Math.min(255, Math.round(Math.log2(1 + v) * k));
    }
  }
  const out = new Uint8Array(8 + raw.length);
  out.set([65, 86, 88, 69, w & 255, w >> 8, h & 255, h >> 8]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const left = x >= 3 ? raw[i - 3] : 0, up = y ? raw[i - W] : 0, ul = y && x >= 3 ? raw[i - W - 3] : 0;
      out[8 + i] = (raw[i] - (left + up - ul)) & 255;
    }
  }
  const gz = await new Response(new Blob([out]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
  return { w, h, peak, gz: new Uint8Array(gz) };
}

const res = await bake();
const a = document.createElement('a');
a.href = URL.createObjectURL(new Blob([res.gz]));
a.download = 'room-env.bin.gz';
a.textContent = `Download room-env.bin.gz (${res.w}×${res.h}, ${Math.round(res.gz.length / 1024)} KB, peak ${res.peak.toFixed(2)})`;
document.body.append(a);
window.__bake = { w: res.w, h: res.h, peak: res.peak, b64: btoa(String.fromCharCode(...res.gz)) };

// The studio lighting environment for the hero and the 3D demo: three.js's RoomEnvironment,
// pre-filtered offline by scripts/bake-env.html. Decoding it takes a few milliseconds; generating
// it in the browser (PMREM) froze the page for about a second on a first visit.
import * as THREE from 'three';
import envUrl from '../assets/env/room-env.bin.gz?url';

export const ENV_SIZE = 128; // cube face size of the bake
export const ENV_SIGMA = 0.04; // blur
export const ENV_MAX = 64; // brightest value the encoding keeps

let pending = null;
function decode() {
  pending ||= (async () => {
    // the single-file build inlines the file as a data: URL, which some hosts don't allow fetching
    let bytes = envUrl.startsWith('data:')
      ? Uint8Array.from(atob(envUrl.slice(envUrl.indexOf(',') + 1)), (c) => c.charCodeAt(0))
      : new Uint8Array(await (await fetch(envUrl)).arrayBuffer());
    // some servers decompress .gz on the way; only inflate when the gzip header is still there
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
      bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    }
    const w = bytes[4] | (bytes[5] << 8), h = bytes[6] | (bytes[7] << 8), W = w * 3;
    const lut = new Uint16Array(256);
    const k = Math.log2(1 + ENV_MAX) / 255;
    for (let i = 0; i < 256; i++) lut[i] = THREE.DataUtils.toHalfFloat(2 ** (i * k) - 1);
    const one = THREE.DataUtils.toHalfFloat(1);
    const raw = new Uint8Array(W * h);
    const out = new Uint16Array(w * h * 4);
    for (let y = 0, i = 0; y < h; y++) {
      for (let x = 0; x < W; x++, i++) {
        const left = x >= 3 ? raw[i - 3] : 0, up = y ? raw[i - W] : 0, ul = y && x >= 3 ? raw[i - W - 3] : 0;
        const v = (bytes[8 + i] + left + up - ul) & 255;
        raw[i] = v;
        out[(i / 3 | 0) * 4 + (i % 3)] = lut[v];
      }
    }
    for (let p = 3; p < out.length; p += 4) out[p] = one;
    return { w, h, out };
  })();
  return pending;
}

// A scene.environment for one renderer (textures can't be shared between WebGL contexts).
// Resolves to null if the browser can't decode it; materials then fall back to their lights.
export async function studioEnvironment() {
  try {
    const { w, h, out } = await decode();
    const t = new THREE.DataTexture(out, w, h, THREE.RGBAFormat, THREE.HalfFloatType);
    t.mapping = THREE.CubeUVReflectionMapping;
    t.colorSpace = THREE.LinearSRGBColorSpace;
    t.minFilter = t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  } catch (err) {
    console.warn('Studio environment unavailable', err);
    return null;
  }
}

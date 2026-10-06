// Procedural "artificial brain": cortex surface points with folds, neurons inside, a wired network,
// and the time at which electricity reaches every point after the first idea sparks.
// Coordinates: x = left/right, y = up, z = front (+) / back (-). Units ≈ brain length 2.
import { createNoise3D } from 'simplex-noise';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// iq's ellipsoid distance bound
function sdEllipsoid(x, y, z, rx, ry, rz) {
  const k0 = Math.hypot(x / rx, y / ry, z / rz);
  const k1 = Math.hypot(x / (rx * rx), y / (ry * ry), z / (rz * rz));
  return (k0 * (k0 - 1)) / k1;
}
function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }

export function buildBrain({ cortexCount = 9000, nodeCount = 900, seed = 11, span = 2.1 } = {}) {
  const rand = mulberry32(seed);
  const noise = createNoise3D(mulberry32(seed * 7 + 3));

  // sulcus field: 0 on a groove line, ~1 on a gyrus crest
  const sulcus = (x, y, z) => {
    const w = 0.42 * noise(x * 1.5 + 11.3, y * 1.5 - 4.1, z * 1.5 + 2.7);
    return Math.abs(noise(x * 3.25 + w, y * 3.25 - w, z * 3.25 + w * 0.6));
  };
  const HC = 0.37; // hemisphere centre offset
  const cerebrumRaw = (x, y, z, h) => {
    const lx = x - h * HC, ly = y - 0.05;
    const rx = lx * h < 0 ? 0.335 : 0.6; // flat medial wall, leaves a fissure between hemispheres
    const ry = ly < 0 ? 0.45 : 0.66;     // flatter underside
    let d = sdEllipsoid(lx, ly, z, rx, ry, 0.97);
    d = smin(d, sdEllipsoid(x - h * 0.45, y + 0.25, z - 0.12, 0.27, 0.25, 0.52), 0.2); // temporal lobe
    return d;
  };
  const cerebrum = (x, y, z, h) => cerebrumRaw(x, y, z, h) + 0.038 * (1 - smoothstep(0.0, 0.17, sulcus(x, y, z)));
  const cerebellum = (x, y, z) => Math.min(
    sdEllipsoid(x - 0.21, y + 0.4, z + 0.6, 0.27, 0.2, 0.25),
    sdEllipsoid(x + 0.21, y + 0.4, z + 0.6, 0.27, 0.2, 0.25),
  );
  const insideCerebrum = (x, y, z) => Math.min(cerebrumRaw(x, y, z, 1), cerebrumRaw(x, y, z, -1)) < -0.01;

  // ray from origin o along unit u: find the outer surface of f
  function surfaceAlong(f, ox, oy, oz, ux, uy, uz, tMax = 1.7) {
    let t0 = 0, t1 = 0, step = 0.035;
    if (f(ox, oy, oz) >= 0) return null;
    for (let t = step; t <= tMax; t += step) {
      if (f(ox + ux * t, oy + uy * t, oz + uz * t) >= 0) { t1 = t; t0 = t - step; break; }
    }
    if (!t1) return null;
    for (let i = 0; i < 9; i++) {
      const m = (t0 + t1) / 2;
      if (f(ox + ux * m, oy + uy * m, oz + uz * m) >= 0) t1 = m; else t0 = m;
    }
    const t = (t0 + t1) / 2;
    return [ox + ux * t, oy + uy * t, oz + uz * t];
  }
  const randDir = () => {
    const u = rand() * 2 - 1, a = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    return [s * Math.cos(a), u, s * Math.sin(a)];
  };

  /* ---------------- cortex points */
  const cortex = []; // [x,y,z,shade,part]
  const target = { cerebrum: Math.round(cortexCount * 0.82), cerebellum: Math.round(cortexCount * 0.13), stem: 0 };
  target.stem = cortexCount - target.cerebrum - target.cerebellum;
  let guard = 0, cc = 0;
  while (cc < target.cerebrum && guard++ < cortexCount * 30) {
    const h = rand() < 0.5 ? 1 : -1;
    const [ux, uy, uz] = randDir();
    if (ux * h < -0.25 && rand() < 0.75) continue;  // medial wall is mostly hidden
    if (uy < -0.55 && rand() < 0.6) continue;       // and so is the underside
    const p = surfaceAlong((x, y, z) => cerebrum(x, y, z, h), h * 0.4, 0.05, 0, ux, uy, uz);
    if (!p) continue;
    const s = sulcus(p[0], p[1], p[2]);
    const crest = smoothstep(0.07, 0.42, s);
    if (rand() > 0.18 + 0.82 * crest) continue;    // thin out the grooves so the folds read as dark lines
    cortex.push([p[0], p[1], p[2], 0.25 + 0.75 * crest, 0]); cc++;
  }
  guard = 0;
  let cb = 0;
  while (cb < target.cerebellum && guard++ < cortexCount * 30) {
    const h = rand() < 0.5 ? 1 : -1;
    const [ux, uy, uz] = randDir();
    const p = surfaceAlong((x, y, z) => cerebellum(x, y, z), h * 0.21, -0.4, -0.6, ux, uy, uz, 0.6);
    if (!p || insideCerebrum(p[0], p[1], p[2])) continue;
    const folia = 0.5 + 0.5 * Math.sin(p[1] * 95 + noise(p[0] * 4, p[1] * 4, p[2] * 4) * 2.4);
    if (rand() > 0.25 + 0.75 * folia) continue;
    cortex.push([p[0], p[1], p[2], 0.3 + 0.6 * folia, 1]); cb++;
  }
  for (let i = 0; i < target.stem; i++) {
    const t = rand(), a = rand() * Math.PI * 2;
    const r = 0.11 - 0.035 * t;
    const cx = 0, cy = -0.28 - 0.66 * t, cz = -0.3 - 0.14 * t;
    const x = cx + Math.cos(a) * r, y = cy, z = cz + Math.sin(a) * r;
    if (insideCerebrum(x, y, z) || cerebellum(x, y, z) < 0) { i--; if (guard++ > cortexCount * 40) break; continue; }
    cortex.push([x, y, z, 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(a * 9)), 2]);
  }

  /* ---------------- neurons */
  const nodes = [];
  const surf = cortex.filter((p) => p[4] === 0);
  for (let i = 0; i < nodeCount * 0.94; i++) {
    const p = surf[Math.floor(rand() * surf.length)];
    const h = p[0] >= 0 ? 1 : -1;
    const k = 1 - 0.55 * Math.pow(rand(), 1.6);
    const cx = h * 0.4, cy = 0.02, cz = 0;
    nodes.push([cx + (p[0] - cx) * k, cy + (p[1] - cy) * k, cz + (p[2] - cz) * k]);
  }
  while (nodes.length < nodeCount) { // corpus callosum: bridges the hemispheres
    nodes.push([(rand() * 2 - 1) * 0.32, 0.02 + rand() * 0.2, -0.45 + rand() * 0.95]);
  }

  /* ---------------- wiring: k nearest neighbours, then make sure everything is connected */
  const N = nodes.length;
  const d2 = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2]; return dx * dx + dy * dy + dz * dz; };
  const edgeSet = new Set();
  const adj = Array.from({ length: N }, () => []);
  const addEdge = (a, b) => {
    if (a === b) return;
    const key = a < b ? a * 65536 + b : b * 65536 + a;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    const w = Math.sqrt(d2(nodes[a], nodes[b]));
    adj[a].push([b, w]); adj[b].push([a, w]);
  };
  for (let i = 0; i < N; i++) {
    const best = [];
    for (let j = 0; j < N; j++) {
      if (j === i) continue;
      const dd = d2(nodes[i], nodes[j]);
      if (dd > 0.09) continue;
      best.push([dd, j]);
    }
    best.sort((a, b) => a[0] - b[0]);
    const k = 2 + (rand() < 0.45 ? 1 : 0) + (rand() < 0.15 ? 1 : 0);
    for (let m = 0; m < Math.min(k, best.length); m++) addEdge(i, best[m][1]);
  }

  // the idea sparks in the right frontal lobe (faces the camera)
  const S = [0.5, 0.36, 0.56];
  let sparkNode = 0, sb = Infinity;
  nodes.forEach((n, i) => { const dd = d2(n, S); if (dd < sb) { sb = dd; sparkNode = i; } });

  const SPEED = 1.08;
  const arrival = new Float32Array(N).fill(Infinity);
  const relax = () => {
    // Dijkstra (simple O(N²), N < 1200)
    const done = new Uint8Array(N);
    arrival.fill(Infinity); arrival[sparkNode] = 0;
    for (let it = 0; it < N; it++) {
      let u = -1, best = Infinity;
      for (let i = 0; i < N; i++) if (!done[i] && arrival[i] < best) { best = arrival[i]; u = i; }
      if (u < 0) break;
      done[u] = 1;
      for (const [v, w] of adj[u]) {
        const t = arrival[u] + (w / SPEED) * (0.85 + 0.4 * ((u * 7919 + v * 104729) % 97) / 97);
        if (t < arrival[v]) arrival[v] = t;
      }
    }
  };
  relax();
  // connect stragglers to the nearest reached neuron, then recompute
  let changed = false;
  for (let i = 0; i < N; i++) {
    if (arrival[i] !== Infinity) continue;
    let bj = -1, bd = Infinity;
    for (let j = 0; j < N; j++) if (arrival[j] !== Infinity) { const dd = d2(nodes[i], nodes[j]); if (dd < bd) { bd = dd; bj = j; } }
    if (bj >= 0) { addEdge(i, bj); changed = true; }
  }
  if (changed) relax();
  // time-scale so the whole brain lights in `span` seconds
  let maxA = 0;
  for (let i = 0; i < N; i++) if (arrival[i] < Infinity) maxA = Math.max(maxA, arrival[i]);
  const k = span / Math.max(maxA, 1e-3);
  for (let i = 0; i < N; i++) arrival[i] *= k;
  const V = SPEED / k; // effective propagation speed

  /* ---------------- cortex activation: from the nearest neuron (spatial hash) */
  const cell = 0.16, grid = new Map();
  const keyOf = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  nodes.forEach((n, i) => { const k = keyOf(...n); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
  const nearestNode = (p) => {
    const cx = Math.floor(p[0] / cell), cy = Math.floor(p[1] / cell), cz = Math.floor(p[2] / cell);
    let bj = -1, bd = Infinity;
    for (let r = 1; r <= 3 && bj < 0; r++) {
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
        const list = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
        if (!list) continue;
        for (const j of list) { const dd = d2(p, nodes[j]); if (dd < bd) { bd = dd; bj = j; } }
      }
    }
    return [bj, Math.sqrt(bd)];
  };

  const cN = cortex.length;
  const cPos = new Float32Array(cN * 3), cAct = new Float32Array(cN), cShade = new Float32Array(cN), cRand = new Float32Array(cN);
  cortex.forEach((p, i) => {
    cPos.set([p[0], p[1], p[2]], i * 3);
    const [j, dist] = nearestNode(p);
    cAct[i] = (j >= 0 ? arrival[j] : span) + dist / V + rand() * 0.05;
    cShade[i] = p[3]; cRand[i] = rand();
  });

  const nPos = new Float32Array(N * 3), nAct = new Float32Array(N), nRand = new Float32Array(N);
  nodes.forEach((n, i) => { nPos.set(n, i * 3); nAct[i] = arrival[i]; nRand[i] = rand(); });

  const edges = [...edgeSet].map((k) => [Math.floor(k / 65536), k % 65536]);
  const E = edges.length;
  const ePos = new Float32Array(E * 6), eAct = new Float32Array(E * 2), eDur = new Float32Array(E * 2), eT = new Float32Array(E * 2), eRand = new Float32Array(E * 2);
  const pA = new Float32Array(E * 3), pB = new Float32Array(E * 3), pAct = new Float32Array(E), pDur = new Float32Array(E), pRand = new Float32Array(E);
  edges.forEach(([a, b], i) => {
    if (arrival[b] < arrival[a]) [a, b] = [b, a];
    const len = Math.sqrt(d2(nodes[a], nodes[b]));
    const dur = len / V;
    ePos.set(nodes[a], i * 6); ePos.set(nodes[b], i * 6 + 3);
    eAct[i * 2] = eAct[i * 2 + 1] = arrival[a];
    eDur[i * 2] = eDur[i * 2 + 1] = dur;
    eT[i * 2] = 0; eT[i * 2 + 1] = 1;
    const r = rand(); eRand[i * 2] = eRand[i * 2 + 1] = r;
    pA.set(nodes[a], i * 3); pB.set(nodes[b], i * 3); pAct[i] = arrival[a]; pDur[i] = dur; pRand[i] = r;
  });

  // first neurons the spark jumps to (for the lightning)
  // neurons 0.25–0.75 away, so the bolts are long enough to read past the flare
  const sp = nodes[sparkNode];
  const firstTargets = [...Array(N).keys()].filter((i) => { const d = Math.sqrt(d2(nodes[i], sp)); return d > 0.25 && d < 0.75; })
    .sort((a, b) => arrival[a] - arrival[b]).slice(0, 7);

  let maxArrival = 0;
  for (let i = 0; i < N; i++) if (arrival[i] < Infinity) maxArrival = Math.max(maxArrival, arrival[i]);

  return {
    cortex: { pos: cPos, act: cAct, shade: cShade, rand: cRand, count: cN },
    nodes: { pos: nPos, act: nAct, rand: nRand, count: N, list: nodes },
    edges: { pos: ePos, act: eAct, dur: eDur, t: eT, rand: eRand, count: E, pairs: edges },
    pulses: { a: pA, b: pB, act: pAct, dur: pDur, rand: pRand, count: E },
    spark: { node: sparkNode, pos: nodes[sparkNode], targets: firstTargets },
    arrival, maxArrival,
  };
}

// Builds src/assets/data/land.json: a 1-degree land/water bitmap (360 x 180) from Natural Earth's
// public-domain 1:110m land polygons. Used by the export demo's dotted globe. Run once: node scripts/land-mask.mjs
import { writeFileSync } from 'node:fs';

const SRC = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson';
const geo = await (await fetch(SRC)).json();
const polys = [];
for (const f of geo.features) {
  const g = f.geometry;
  if (g.type === 'Polygon') polys.push(g.coordinates);
  else if (g.type === 'MultiPolygon') polys.push(...g.coordinates);
}
const inRing = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const bbox = polys.map((p) => { let a = 180, b = 90, c = -180, d = -90; for (const [x, y] of p[0]) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; });
const W = 360, H = 180;
const bits = new Uint8Array(Math.ceil((W * H) / 8));
let land = 0;
for (let r = 0; r < H; r++) {
  const lat = 89.5 - r;
  for (let c = 0; c < W; c++) {
    const lon = -179.5 + c;
    let hit = false;
    for (let k = 0; k < polys.length && !hit; k++) {
      const [a, b, cc, d] = bbox[k];
      if (lon < a || lon > cc || lat < b || lat > d) continue;
      if (inRing(lon, lat, polys[k][0]) && !polys[k].slice(1).some((h) => inRing(lon, lat, h))) hit = true;
    }
    if (hit) { const i = r * W + c; bits[i >> 3] |= 1 << (i & 7); land++; }
  }
}
writeFileSync(new URL('../src/assets/data/land.json', import.meta.url), JSON.stringify({ w: W, h: H, source: 'Natural Earth 1:110m land (public domain)', bits: Buffer.from(bits).toString('base64') }));
console.log(`land cells: ${land} of ${W * H} (${((land / (W * H)) * 100).toFixed(1)}%)`);

// Procedural stone surfaces for the hero: travertine (banded, pitted), limestone floor slabs, plaster.
// Patterns are computed in the shader from object/world position, so no textures need to load.
import * as THREE from 'three';
import { SIMPLEX3, BUMP } from '../lib/glsl.js';

function patch(material, { varying = 'obj', fragDecl, colorCode, roughCode = '', bumpStrength = 0 }) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vStonePos;')
      .replace('#include <begin_vertex>', varying === 'world'
        ? '#include <begin_vertex>\nvStonePos = (modelMatrix * vec4(position, 1.0)).xyz;'
        : '#include <begin_vertex>\nvStonePos = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vStonePos;\nfloat stoneH = 0.0; float stonePit = 0.0;\n${SIMPLEX3}\n${BUMP}\n${fragDecl}`)
      .replace('#include <map_fragment>', `#include <map_fragment>\n${colorCode}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${roughCode}`)
      .replace('#include <normal_fragment_maps>', bumpStrength
        ? `#include <normal_fragment_maps>\nnormal = avx_bump(-vViewPosition, normal, stoneH, ${bumpStrength.toFixed(4)});`
        : '#include <normal_fragment_maps>');
  };
  material.customProgramCacheKey = () => `stone-${colorCode.length}-${bumpStrength}`;
  return material;
}

export function travertine({ scale = 1, seed = 0 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0 });
  return patch(m, {
    fragDecl: /* glsl */`
      vec3 travertine(vec3 p) {
        p = p * ${scale.toFixed(3)} + vec3(${seed.toFixed(2)});
        float warp = snoise(p * vec3(0.7, 1.8, 0.7)) * 0.4;
        float bands = snoise(vec3(p.x * 0.55, p.y * 8.5 + warp * 4.0, p.z * 0.55));
        float fine = snoise(p * vec3(2.6, 20.0, 2.6));
        float pn = snoise(p * vec3(2.6, 34.0, 2.6) + 3.1) + 0.2 * snoise(p * vec3(14.0, 60.0, 14.0));
        stonePit = smoothstep(0.8, 0.95, pn);
        vec3 c = mix(vec3(0.95, 0.88, 0.76), vec3(0.85, 0.75, 0.60), smoothstep(-0.5, 0.9, bands));
        c = mix(c, vec3(0.78, 0.66, 0.50), 0.2 * smoothstep(0.2, 0.95, fine));
        c = mix(c, vec3(0.62, 0.52, 0.39), stonePit * 0.6);
        stoneH = -stonePit * 0.45 + fine * 0.05 + bands * 0.03;
        return c;
      }`,
    colorCode: 'diffuseColor.rgb *= travertine(vStonePos);',
    roughCode: 'roughnessFactor = mix(roughnessFactor, 0.97, stonePit);',
    bumpStrength: 0.007,
  });
}

export function limestoneFloor() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0 });
  return patch(m, {
    varying: 'world',
    fragDecl: /* glsl */`
      vec3 floorStone(vec3 p) {
        vec2 tile = vec2(1.6, 0.8);
        vec2 q = p.xz / tile;
        vec2 f = fract(q), id = floor(q);
        float seam = 1.0 - smoothstep(0.0, 0.006, min(min(f.x, 1.0 - f.x) * tile.x, min(f.y, 1.0 - f.y) * tile.y));
        float tone = snoise(vec3(id * 3.7, 1.0)) * 0.035;
        float n = snoise(vec3(p.xz * 1.4, 0.0)) * 0.025 + snoise(vec3(p.xz * 9.0, 2.0)) * 0.012;
        stoneH = -seam * 0.4 + n;
        return vec3(0.86, 0.82, 0.75) * (1.0 + tone + n) * (1.0 - seam * 0.12);
      }`,
    colorCode: 'diffuseColor.rgb *= floorStone(vStonePos);',
    bumpStrength: 0.004,
  });
}

export function plaster() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 });
  return patch(m, {
    varying: 'world',
    fragDecl: /* glsl */`
      vec3 plasterTone(vec3 p) {
        float n = snoise(p * 0.6) * 0.02 + snoise(p * 3.0) * 0.012 + snoise(p * 18.0) * 0.006;
        stoneH = n;
        return vec3(0.92, 0.89, 0.83) * (1.0 + n);
      }`,
    colorCode: 'diffuseColor.rgb *= plasterTone(vStonePos);',
    bumpStrength: 0.02,
  });
}

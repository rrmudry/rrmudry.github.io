// Thanksgobbling world: an autumn town at golden hour, built from instanced primitives so it runs on Chromebooks.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Town grid: street lines at these x and z values. The green fills the middle square.
export const GRID = [-125, -75, -25, 25, 75, 125];
export const FEAST_R = 15.5;    // turkeys stop here and start eating
export const AIM_R = 215;       // farthest the gimbal can look from the hall


export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- geometry helpers ----------
function paint(geo, hex) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.deleteAttribute('uv');
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
const merge = list => { const g = mergeGeometries(list); g.computeBoundingSphere(); return g; };

// Gable roof: 1 wide (x, ridge direction), 1 tall, 1 deep (z), base at y = 0.
export function prismGeometry() {
  const A = [-0.5, 0, -0.5], B = [-0.5, 0, 0.5], C = [-0.5, 1, 0], D = [0.5, 0, -0.5], E = [0.5, 0, 0.5], F = [0.5, 1, 0];
  const tris = [A, B, C, D, F, E, B, E, F, B, F, C, A, C, F, A, F, D];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  g.computeVertexNormals();
  return g;
}

// ---------- characters ----------
// Turkey faces +z, feet at y = 0, about 2.1 m tall at scale 1.
export function turkeyGeometry() {
  const parts = [];
  const add = (geo, color) => parts.push(paint(geo, color));
  add(new THREE.SphereGeometry(1, 14, 10).scale(0.72, 0.66, 0.92).translate(0, 1.12, 0), '#6b4226');
  add(new THREE.SphereGeometry(1, 10, 8).scale(0.5, 0.48, 0.42).translate(0, 1.05, 0.55), '#5a341c');
  for (const sx of [-1, 1]) add(new THREE.SphereGeometry(1, 10, 8).scale(0.16, 0.42, 0.68).translate(sx * 0.66, 1.18, -0.05), '#3d2614');
  // tail fan, three layers
  const fan = (n, len, wid, z, color, tipColor) => {
    for (let i = 0; i < n; i++) {
      const a = -1.35 + (2.7 * i) / (n - 1);
      const f = new THREE.BoxGeometry(wid, len, 0.06).translate(0, len / 2, 0).rotateZ(a).rotateX(-0.28).translate(0, 1.2, z);
      add(f, i % 2 ? color : tipColor);
    }
  };
  fan(11, 1.55, 0.34, -0.78, '#4a2c17', '#3a2210');
  for (let i = 0; i < 11; i++) { const a = -1.35 + (2.7 * i) / 10; add(new THREE.BoxGeometry(0.36, 0.22, 0.07).translate(0, 1.45, 0).rotateZ(a).rotateX(-0.28).translate(0, 1.2, -0.8), '#efe2c4'); }
  fan(9, 1.2, 0.3, -0.72, '#a0522d', '#8b4513');
  fan(7, 0.85, 0.28, -0.66, '#d9a066', '#c48a4f');
  add(new THREE.CylinderGeometry(0.11, 0.16, 0.62, 8).rotateX(0.35).translate(0, 1.68, 0.62), '#8a9bb0');
  add(new THREE.SphereGeometry(0.2, 10, 8).translate(0, 2.0, 0.74), '#a3b5ca');
  add(new THREE.ConeGeometry(0.07, 0.22, 6).rotateX(Math.PI / 2).translate(0, 1.98, 0.97), '#e8b33a');
  add(new THREE.SphereGeometry(0.07, 6, 6).scale(1, 2.3, 1).translate(0.03, 1.9, 0.95), '#c8102e');
  add(new THREE.SphereGeometry(0.11, 8, 6).scale(1, 1.7, 0.8).translate(0, 1.76, 0.8), '#c8102e');
  for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.04, 6, 4).translate(sx * 0.13, 2.06, 0.86), '#111111');
  for (const sx of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 5).translate(sx * 0.25, 0.4, 0.05), '#d98b2b');
    add(new THREE.BoxGeometry(0.26, 0.05, 0.34).translate(sx * 0.25, 0.03, 0.15), '#d98b2b');
  }
  return merge(parts);
}

// A neighbor carrying a pie to the feast. Faces +z, about 1.9 m tall.
export function neighborGeometry() {
  const p = [];
  const add = (g, c) => p.push(paint(g, c));
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.2, 0.85, 0.22).translate(sx * 0.13, 0.43, 0), '#2b2b3a');
  add(new THREE.CylinderGeometry(0.27, 0.34, 0.8, 10).translate(0, 1.22, 0), '#2f6fd6');
  add(new THREE.SphereGeometry(0.19, 10, 8).translate(0, 1.82, 0), '#e9b48f');
  add(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 14).translate(0, 1.95, 0), '#222222');
  add(new THREE.CylinderGeometry(0.17, 0.2, 0.3, 12).translate(0, 2.1, 0), '#222222');
  add(new THREE.BoxGeometry(0.1, 0.08, 0.02).translate(0, 2.0, 0.19), '#e8c040');
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.12, 0.12, 0.5).translate(sx * 0.3, 1.32, 0.25), '#2f6fd6');
  add(new THREE.CylinderGeometry(0.34, 0.3, 0.1, 14).translate(0, 1.42, 0.55), '#c98a3c');
  add(new THREE.CylinderGeometry(0.29, 0.29, 0.02, 14).translate(0, 1.48, 0.55), '#e07b24');
  return merge(p);
}

export function pieGeometry() {
  return merge([
    paint(new THREE.CylinderGeometry(1.0, 0.85, 0.28, 18), '#c98a3c'),
    paint(new THREE.CylinderGeometry(0.88, 0.88, 0.02, 18).translate(0, 0.15, 0), '#e07b24'),
    paint(new THREE.SphereGeometry(0.22, 8, 6).scale(1, 0.6, 1).translate(0, 0.2, 0), '#fff8ec'),
  ]);
}

export function yamGeometry() {
  return merge([
    paint(new THREE.SphereGeometry(0.5, 10, 8).scale(0.75, 0.75, 1.5), '#a0522d'),
    paint(new THREE.SphereGeometry(0.15, 6, 4).translate(0, 0, 0.72), '#e2873b'),
  ]);
}

// Irregular splat for ground decals (radius about 1, flat on y = 0).
export function blobGeometry(seed = 3) {
  const r = rng(seed), n = 22, pos = [];
  const rad = [];
  for (let i = 0; i < n; i++) rad.push(0.75 + r() * 0.4 + (i % 3 === 0 ? 0.25 : 0));
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const r0 = rad[i], r1 = rad[(i + 1) % n];
    pos.push(0, 0, 0, Math.cos(a1) * r1, 0, Math.sin(a1) * r1, Math.cos(a0) * r0, 0, Math.sin(a0) * r0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// ---------- the Gravy Boat ----------
function buildPlane() {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: '#b98b5e', roughness: 0.6, metalness: 0.2 });
  const dark = new THREE.MeshStandardMaterial({ color: '#6b4226', roughness: 0.7 });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  add(new THREE.CylinderGeometry(2.1, 2.1, 22, 14).rotateX(Math.PI / 2), body, 0, 0, 0);
  add(new THREE.SphereGeometry(2.1, 14, 10).scale(1, 1, 1.4), body, 0, 0, 11);
  add(new THREE.ConeGeometry(2.1, 7, 14).rotateX(-Math.PI / 2), body, 0, 0.4, -14.4);
  add(new THREE.BoxGeometry(40, 0.5, 4.2), dark, 0, 1.6, 1);
  add(new THREE.BoxGeometry(13, 0.4, 2.6), dark, 0, 1.2, -16);
  add(new THREE.BoxGeometry(0.4, 6, 3.2), dark, 0, 4, -16);
  for (const x of [-13, -7, 7, 13]) {
    add(new THREE.CylinderGeometry(0.9, 0.9, 4, 10).rotateX(Math.PI / 2), body, x, 1.2, 3);
    const prop = add(new THREE.CircleGeometry(2.4, 18), new THREE.MeshBasicMaterial({ color: '#222', transparent: true, opacity: 0.25, side: THREE.DoubleSide }), x, 1.2, 5.2);
    prop.castShadow = false;
  }
  return g;
}

// ---------- the town ----------
// A small grid town: a green with the feast hall in the middle, a ring of downtown blocks around the square,
// a ring of neighborhood blocks, then farms and country roads out to the woods.
const sw = c => (Math.abs(c) === 25 ? 10 : 8);              // street width: the square's streets are wider
const rotK = (k, x, z) => [[x, z], [-z, x], [-x, -z], [z, -x]][k]; // quarter turns for the four sides of town
const node = (i, j) => new THREE.Vector2(GRID[i], GRID[j]);
const inSquare = (i, j) => i >= 2 && i <= 3 && j >= 2 && j <= 3;

export function buildWorld(scene, quality) {
  const R = rng(1121);
  const out = { houses: [], obbs: [], roads: [], entries: [] };
  const obbs = out.obbs, roads = out.roads, flatRects = [];

  // ---------- sky, light, ground ----------
  const horizon = new THREE.Color('#f2a65e'), mid = new THREE.Color('#d97b5b'), top = new THREE.Color('#2c3e6b');
  const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 33), THREE.MathUtils.degToRad(215));
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: top }, mid: { value: mid }, horizon: { value: horizon }, sunDir: { value: sunDir } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 top, mid, horizon, sunDir; varying vec3 vDir;
      void main(){ float h = vDir.y; vec3 c = mix(horizon, mid, smoothstep(0.0, 0.18, h)); c = mix(c, top, smoothstep(0.12, 0.7, h));
        float s = max(dot(normalize(vDir), sunDir), 0.0);
        c += vec3(1.0, 0.75, 0.45) * pow(s, 400.0) * 3.0 + vec3(1.0, 0.55, 0.25) * pow(s, 8.0) * 0.35;
        if (h < 0.0) c = horizon;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  sky.renderOrder = -1;
  scene.add(sky);
  scene.fog = new THREE.Fog(horizon, 280, 780);

  scene.add(new THREE.HemisphereLight('#ffd9b0', '#4a3b2a', 1.25));
  const sun = new THREE.DirectionalLight('#ffc48a', 2.8);
  sun.position.copy(sunDir).multiplyScalar(340);
  sun.castShadow = true;
  const sc = sun.shadow.camera;
  sc.left = -230; sc.right = 230; sc.top = 200; sc.bottom = -200; sc.near = 10; sc.far = 850;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);
  out.sun = sun;

  const groundGeo = new THREE.PlaneGeometry(1400, 1400, 120, 120).rotateX(-Math.PI / 2);
  {
    const p = groundGeo.attributes.position, cols = new Float32Array(p.count * 3);
    const a = new THREE.Color('#7d8a3a'), b = new THREE.Color('#a68d4a'), c = new THREE.Color('#5f6e30'), tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const n = Math.sin(x * 0.021) * Math.cos(z * 0.017) + 0.5 * Math.sin(x * 0.063 + z * 0.041) + 0.25 * Math.sin(x * 0.17 - z * 0.13);
      tmp.copy(a).lerp(b, THREE.MathUtils.clamp(0.5 + n * 0.4, 0, 1)).lerp(c, THREE.MathUtils.clamp(-n * 0.5, 0, 0.6));
      cols.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  }
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  ground.receiveShadow = true;
  scene.add(ground);

  // ---------- instance collectors ----------
  const boxes = [], roofs = [], lit = [], flats = [], cyls = [], cones = [], pumpkins = [], bales = [], shocks = [];
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), Yax = new THREE.Vector3(0, 1, 0);
  const inst = (list, x, y, z, sx, sy, sz, yaw, color) => {
    Q.setFromAxisAngle(Yax, yaw || 0);
    M.compose(P.set(x, y, z), Q, S.set(sx, sy, sz));
    list.push({ m: M.clone(), c: color ? new THREE.Color(color) : null });
  };
  // a part placed in a building's own frame (local +z is the front)
  const part = (list, b, lx, ly, lz, sx, sy, sz, color) => {
    const c = Math.cos(b.yaw), s = Math.sin(b.yaw);
    inst(list, b.x + lx * c + lz * s, ly, b.z - lx * s + lz * c, sx, sy, sz, b.yaw, color);
  };
  const flat = (x0, z0, x1, z1, top, color, keepClear = true) => {
    inst(flats, (x0 + x1) / 2, top / 2, (z0 + z1) / 2, Math.abs(x1 - x0), top, Math.abs(z1 - z0), 0, color);
    if (keepClear) flatRects.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]);
  };
  const addObb = (b, hw, hd, wallH, roofH = 0) => obbs.push({ x: b.x, z: b.z, yaw: b.yaw, hw, hd, wallH, roofH });
  const windowAt = (b, lx, ly, lz, sx, sy, sz, litChance = 0.65) => {
    if (R() < litChance) part(lit, b, lx, ly, lz, sx, sy, sz);
    else part(boxes, b, lx, ly, lz, sx, sy, sz, '#2b3440');
  };

  // ---------- building kits ----------
  const gable = (b, w, d, h, rh, wall, roof) => {
    part(boxes, b, 0, h / 2, 0, w, h, d, wall);
    part(roofs, b, 0, h, 0, w + 0.7, rh, d + 1.0, roof);
    addObb(b, w / 2 + 0.35, d / 2 + 0.5, h, rh);
  };
  const flatTop = (b, w, d, h, wall, cap) => {
    part(boxes, b, 0, h / 2, 0, w, h, d, wall);
    part(boxes, b, 0, h + 0.35, 0, w + 0.3, 0.7, d + 0.3, cap);
    addObb(b, w / 2 + 0.15, d / 2 + 0.15, h + 0.7);
  };
  const HOUSE_WALLS = ['#f3ead8', '#e8d9b5', '#9e2b25', '#d9a441', '#8aa07a', '#6f87a6', '#c9b79c', '#b5651d', '#ffffff', '#5f7a8a'];
  const ROOFS = ['#3b3433', '#5a3b2e', '#7a2a1d', '#2f4a3a', '#4a4a52'];
  const house = (b, w, d, wallC) => {
    const tall = R() < 0.35;
    const h = tall ? 5.8 + R() * 0.6 : 3.5 + R() * 0.6, rh = 2.4 + R() * 1.2;
    const wall = wallC || HOUSE_WALLS[(R() * HOUSE_WALLS.length) | 0];
    gable(b, w, d, h, rh, wall, ROOFS[(R() * ROOFS.length) | 0]);
    part(boxes, b, w * 0.28, h + rh * 0.55, -d * 0.18, 0.8, rh * 0.9, 0.8, '#8a4b3a');
    part(boxes, b, 0, 1.1, d / 2 + 0.04, 1.1, 2.2, 0.12, '#4a2c1a');
    part(boxes, b, 0, 0.12, d / 2 + 0.8, 2.4, 0.24, 1.4, '#9a8f80'); // front step
    const wy = Math.min(2.0, h * 0.55);
    windowAt(b, -w * 0.3, wy, d / 2 + 0.04, 1.0, 1.1, 0.12);
    windowAt(b, w * 0.3, wy, d / 2 + 0.04, 1.0, 1.1, 0.12);
    windowAt(b, w / 2 + 0.04, wy, 0, 0.12, 1.1, 1.0);
    windowAt(b, -w / 2 - 0.04, wy, 0, 0.12, 1.1, 1.0);
    if (tall) for (const lx of [-0.3, 0, 0.3]) windowAt(b, w * lx, h * 0.78, d / 2 + 0.04, 1.0, 1.1, 0.12);
    if (R() < 0.6) { const c = Math.cos(b.yaw), s = Math.sin(b.yaw); pumpkins.push([b.x + 1.4 * c + (d / 2 + 0.9) * s, b.z - 1.4 * s + (d / 2 + 0.9) * c, 0.38]); }
    return { h, wall };
  };
  const BRICKS = ['#8b3a2b', '#a0522d', '#7a4033', '#c2a378', '#9c4f3c', '#6e5a4e', '#b8875a', '#5f6b7a'];
  const AWNINGS = ['#2f6b3a', '#b3122e', '#24426b', '#d9a441', '#6b2a5a', '#2a6b6b'];
  const storefront = (b, w, d) => {
    const floors = 2 + (R() < 0.4 ? 1 : 0), h = floors * 3.4 + 0.4;
    flatTop(b, w, d, h, BRICKS[(R() * BRICKS.length) | 0], ['#77726b', '#66625c', '#857e74', '#5c5853'][(R() * 4) | 0]);
    part(lit, b, -w * 0.12, 1.5, d / 2 + 0.05, w * 0.6, 2.0, 0.12);           // shop window
    part(boxes, b, w * 0.33, 1.2, d / 2 + 0.05, 1.2, 2.4, 0.12, '#3a2618');    // door
    if (R() < 0.85) part(boxes, b, 0, 3.0, d / 2 + 0.85, w * 0.9, 0.18, 1.7, AWNINGS[(R() * AWNINGS.length) | 0]);
    for (let f = 1; f < floors; f++) {
      const n = Math.max(2, Math.floor(w / 2.4));
      for (let i = 0; i < n; i++) windowAt(b, -w / 2 + (i + 0.5) * (w / n), 3.4 * f + 1.7, d / 2 + 0.05, 1.0, 1.4, 0.12, 0.55);
    }
  };
  const CARS = ['#b3122e', '#24426b', '#e8e2d6', '#3a3a3a', '#6b8e23', '#d9a441', '#7a7f87', '#5a2a1a'];
  const car = (x, z, yaw) => {
    inst(boxes, x, 0.7, z, 1.9, 0.85, 4.4, yaw, CARS[(R() * CARS.length) | 0]);
    inst(boxes, x - Math.sin(yaw) * 0.3, 1.45, z - Math.cos(yaw) * 0.3, 1.7, 0.7, 2.3, yaw, '#2b3440');
  };

  // ---------- streets ----------
  for (const c of GRID) {
    roads.push({ x1: -125, z1: c, x2: 125, z2: c, w: sw(c), kind: 'street' });
    roads.push({ x1: c, z1: -125, x2: c, z2: 125, w: sw(c), kind: 'street' });
  }
  // country roads (paved) and farm lanes (dirt) out to the woods; turkeys come in on these
  for (let k = 0; k < 4; k++) {
    for (const [x, w, kind] of [[-25, 8, 'country'], [25, 8, 'country'], [-75, 5, 'lane']]) {
      const [x1, z1] = rotK(k, x, -125), [x2, z2] = rotK(k, x, -270);
      roads.push({ x1, z1, x2, z2, w, kind });
      const [sx, sz] = rotK(k, x, -220), [nx, nz] = rotK(k, x, -125);
      out.entries.push({ spawn: new THREE.Vector2(sx, sz), i: GRID.indexOf(Math.round(nx)), j: GRID.indexOf(Math.round(nz)), lane: kind === 'lane' });
    }
  }
  const ROAD_COL = { street: '#4b4845', country: '#55514c', lane: '#8a7050' };
  for (const r of roads) {
    const horiz = r.z1 === r.z2, len = Math.abs(horiz ? r.x2 - r.x1 : r.z2 - r.z1) + (r.kind === 'street' ? r.w : 0);
    const top = r.kind === 'lane' ? 0.035 : 0.04;
    inst(flats, (r.x1 + r.x2) / 2, top / 2, (r.z1 + r.z2) / 2, horiz ? len : r.w, top, horiz ? r.w : len, 0, ROAD_COL[r.kind]);
  }
  // yellow center dashes on the square's streets
  const nearGrid = t => GRID.some(g => Math.abs(t - g) < 7);
  for (const c of [-25, 25]) for (let t = -122; t <= 122; t += 8) {
    if (nearGrid(t)) continue;
    inst(flats, t, 0.03, c, 3, 0.06, 0.25, 0, '#e2b33a');
    inst(flats, c, 0.03, t, 0.25, 0.06, 3, 0, '#e2b33a');
  }
  // downtown sidewalks, broken at each crossing
  const DT = [-75, -25, 25, 75];
  for (const c of DT) for (let n = 0; n < 3; n++) {
    const a = DT[n] + sw(DT[n]) / 2, b = DT[n + 1] - sw(DT[n + 1]) / 2;
    for (const side of [-1, 1]) {
      const off = c + side * (sw(c) / 2 + 1.25);
      flat(a, off - 1.25, b, off + 1.25, 0.12, '#bdb5a8', false);
      flat(off - 1.25, a, off + 1.25, b, 0.12, '#bdb5a8', false);
    }
  }

  // ---------- the green and the feast hall ----------
  flat(-20, -20, 20, 20, 0.05, '#6e8f3c', false);
  for (const s of [1, -1]) inst(flats, 0, 0.035, 0, 2.2, 0.07, 57, Math.PI / 4 * s, '#cdb894'); // footpaths corner to corner
  const hall = new THREE.Group();
  const hallW = 16, hallD = 11, hallH = 8;
  const mk = (geo, color, x, y, z, opts = {}) => {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...opts }));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; hall.add(m); return m;
  };
  mk(new THREE.BoxGeometry(hallW, hallH, hallD), '#8f2420', 0, hallH / 2, 0);
  const hroof = mk(prismGeometry(), '#3a2a22', 0, hallH, 0); hroof.scale.set(hallW + 1, 5.5, hallD + 1.6);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mk(new THREE.BoxGeometry(0.45, hallH, 0.45), '#f3ead8', x * hallW / 2, hallH / 2, z * hallD / 2);
  for (const z of [-1, 1]) {
    mk(new THREE.BoxGeometry(5.4, 5.6, 0.25), '#f3ead8', 0, 2.8, z * (hallD / 2 + 0.05));
    mk(new THREE.BoxGeometry(4.8, 5.0, 0.3), '#6b1a16', 0, 2.6, z * (hallD / 2 + 0.08));
    for (const s of [-1, 1]) { const b = mk(new THREE.BoxGeometry(0.3, 6.8, 0.34), '#f3ead8', 0, 2.6, z * (hallD / 2 + 0.1)); b.rotation.z = s * Math.atan2(4.8, 5.0); }
    mk(new THREE.BoxGeometry(2.2, 1.8, 0.3), '#ffd38a', 0, 9.6, z * (hallD / 2 + 0.75), { emissive: '#ffa53a', emissiveIntensity: 1.1 });
  }
  for (const x of [-1, 1]) for (const z of [-3, 0, 3]) mk(new THREE.BoxGeometry(0.3, 1.4, 1.2), '#ffd38a', x * (hallW / 2 + 0.05), 4.5, z, { emissive: '#ffa53a', emissiveIntensity: 1.1 });
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
  const cx = cv.getContext('2d');
  cx.fillStyle = '#f3ead8'; cx.fillRect(0, 0, 512, 96);
  cx.fillStyle = '#8f2420'; cx.font = 'bold 64px Georgia, serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.fillText('THE FEAST', 256, 52);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  for (const z of [-1, 1]) {
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.7), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    banner.position.set(0, 6.6, z * (hallD / 2 + 0.2)); if (z < 0) banner.rotation.y = Math.PI;
    hall.add(banner);
  }
  const vane = new THREE.Mesh(turkeyGeometry(), new THREE.MeshStandardMaterial({ color: '#d4a43a', metalness: 0.8, roughness: 0.35 }));
  vane.scale.setScalar(0.75); vane.position.set(0, hallH + 5.6, 0); vane.castShadow = true;
  hall.add(vane); out.vane = vane;
  scene.add(hall);
  obbs.push({ x: 0, z: 0, yaw: 0, hw: hallW / 2 + 0.5, hd: hallD / 2 + 0.8, wallH: hallH, roofH: 5.5 });

  const tableMat = new THREE.MeshStandardMaterial({ color: '#f3ead8', roughness: 0.9 });
  const tables = [[0, 8.6, 12, 0], [0, -8.6, 12, 0], [10.8, 0, 7, Math.PI / 2], [-10.8, 0, 7, Math.PI / 2]];
  const dishCols = ['#b3122e', '#e2873b', '#e07b24', '#f7f1e3', '#6b8e23', '#7a4a2a', '#d4a43a'];
  const dishSpots = [];
  for (const [x, z, L, rot] of tables) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(L, 0.95, 1.7), tableMat);
    t.position.set(x, 0.48, z); t.rotation.y = rot; t.castShadow = t.receiveShadow = true; scene.add(t);
    const n = Math.floor(L / 1.1);
    for (let i = 0; i < n; i++) {
      const u = -L / 2 + 0.6 + i * ((L - 1.2) / (n - 1));
      for (const v of [-0.4, 0.4]) dishSpots.push(rot ? [x + v, z + u] : [x + u, z + v]);
    }
  }
  for (let i = dishSpots.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [dishSpots[i], dishSpots[j]] = [dishSpots[j], dishSpots[i]]; }
  const dishMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32, 0.26, 0.2, 10), new THREE.MeshStandardMaterial({ roughness: 0.6 }), dishSpots.length);
  dishSpots.forEach(([x, z], i) => {
    M.compose(P.set(x, 1.05, z), Q.identity(), S.set(1, 1, 1)); dishMesh.setMatrixAt(i, M);
    dishMesh.setColorAt(i, new THREE.Color(dishCols[i % dishCols.length]));
  });
  dishMesh.castShadow = true;
  scene.add(dishMesh);
  out.dishes = dishMesh; out.dishTotal = dishSpots.length;

  // lamp posts: green edges and downtown sidewalks
  const lamps = [];
  for (const [x, z] of [[-19, -19], [19, -19], [-19, 19], [19, 19], [0, -19], [0, 19], [-19, 0], [19, 0]]) lamps.push([x, z]);
  for (const c of DT) for (let t = -68; t <= 68; t += 22) {
    if (nearGrid(t)) continue;
    const off = sw(c) / 2 + 2.1;
    lamps.push([t, c + off], [t, c - off], [c + off, t], [c - off, t]);
  }

  // ---------- downtown blocks: storefront rows on the square's streets ----------
  const main = c => Math.abs(c) === 25;
  const row = (along, c, inward, from, to) => {
    let t = from;
    while (to - t > 4) {
      let w = 6 + R() * 4.5;
      if (to - t - w < 5) w = to - t;
      const mid = t + w / 2, d = 12 + R() * 4, off = sw(c) / 2 + 2.5 + d / 2;
      const b = along === 'x' ? { x: mid, z: c + inward * off, yaw: inward > 0 ? Math.PI : 0 }
        : { x: c + inward * off, z: mid, yaw: inward > 0 ? -Math.PI / 2 : Math.PI / 2 };
      storefront(b, w - 0.15, d);
      t += w;
    }
  };
  for (let i = 1; i <= 3; i++) for (let j = 1; j <= 3; j++) {
    if (i === 2 && j === 2) continue;
    const x0 = GRID[i], x1 = GRID[i + 1], z0 = GRID[j], z1 = GRID[j + 1];
    // parking lot fills the block; shops sit on top of it along the main streets
    flat(x0 + sw(x0) / 2 + 2.5, z0 + sw(z0) / 2 + 2.5, x1 - sw(x1) / 2 - 2.5, z1 - sw(z1) / 2 - 2.5, 0.03, '#5a5650', false);
    if (i === 2 && j === 1) continue; // the church block
    // Shops line the square's streets. On the middle blocks the row facing the green runs full length;
    // on corner blocks the east-west row does. The other rows stop short of it at the corner.
    const edge = i === 2 || j === 2;
    const sides = [
      { along: 'x', c: z0, inward: 1, e0: x0, e1: x1 }, { along: 'x', c: z1, inward: -1, e0: x0, e1: x1 },
      { along: 'z', c: x0, inward: 1, e0: z0, e1: z1 }, { along: 'z', c: x1, inward: -1, e0: z0, e1: z1 },
    ];
    for (const sd of sides) sd.full = main(sd.c) && (edge ? (i !== 2 ? sd.along === 'z' : sd.along === 'x') : sd.along === 'x');
    for (const sd of sides) {
      if (!main(sd.c)) continue;
      let from = sd.e0 + sw(sd.e0) / 2 + 2.5, to = sd.e1 - sw(sd.e1) / 2 - 2.5;
      if (!sd.full) {
        const perpFull = e => sides.some(o => o.along !== sd.along && o.c === e && o.full);
        if (perpFull(sd.e0)) from += 16.5;
        if (perpFull(sd.e1)) to -= 16.5;
      }
      row(sd.along, sd.c, sd.inward, from, to);
    }
    // corner blocks: two rows of cars in the lot behind the shops
    if (!edge) {
      const cxm = (x0 + x1) / 2, czm = (z0 + z1) / 2, sx = Math.sign(cxm), sz = Math.sign(czm);
      for (const dz of [8, 15]) for (let n = 0; n < 5; n++) if (R() < 0.7) car(cxm + sx * (2 + n * 3.2), czm + sz * dz, 0);
    }
  }
  // curbside cars on the square
  for (const c of [-25, 25]) for (let t = -68; t <= 68; t += 9) {
    if (nearGrid(t) || R() < 0.45) continue;
    const s = c > 0 ? 1 : -1, off = sw(c) / 2 - 1.3;
    if (R() < 0.5) car(t, c + s * off, Math.PI / 2); else car(c + s * off, t, 0);
  }

  // the church faces the green from the north
  {
    const nave = { x: 0, z: -48, yaw: Math.PI / 2 };   // ridge runs north-south
    gable(nave, 24, 13, 9, 7, '#f3efe6', '#3b3433');
    for (const lx of [-8, -4, 0, 4, 8]) for (const s of [-1, 1]) part(lit, nave, lx, 4.5, s * 6.55, 1.2, 3.2, 0.15);
    const tower = { x: 0, z: -33.5, yaw: 0 };
    part(boxes, tower, 0, 9, 0, 5.6, 18, 5.6, '#f3efe6');
    part(boxes, tower, 0, 18.6, 0, 6.2, 1.2, 6.2, '#d8d0c0');
    part(boxes, tower, 0, 1.6, 2.85, 2.0, 3.2, 0.15, '#4a2c1a');
    part(boxes, tower, 0, 14, 2.85, 1.4, 2.4, 0.15, '#2b3440');
    inst(cones, 0, 19.2, -33.5, 3.4, 11, 3.4, Math.PI / 4, '#3b3433');
    addObb(tower, 3.1, 3.1, 30);
    flat(-22, -46, 22, -32, 0.04, '#7a9a40', false); // church lawn
    out.steeple = new THREE.Vector3(0, 30, -33.5);
  }

  // ---------- neighborhoods ----------
  const houses = out.houses;
  const resBlocks = [];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if (!(i >= 1 && i <= 3 && j >= 1 && j <= 3)) resBlocks.push([i, j]);
  const treeSpots = [];
  for (const [i, j] of resBlocks) {
    const x0 = GRID[i], x1 = GRID[i + 1], z0 = GRID[j], z1 = GRID[j + 1];
    const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2;
    if (i === 4 && j === 1) { buildSchool(x0, z0, x1, z1); continue; }
    if (i === 0 && j === 3) { buildWaterTower(xm, zm); continue; }
    const alongX = R() < 0.5; // which pair of streets the houses face
    const sides = alongX ? [[z0, 1], [z1, -1]] : [[x0, 1], [x1, -1]];
    for (const [c, inward] of sides) {
      for (const o of [-13, 0, 13]) {
        if (R() < 0.08) continue; // the odd empty lot
        const w = 7.5 + R() * 2, d = 7.5 + R() * 2;
        const setback = sw(c) / 2 + 4.5 + R() * 3;
        const u = (alongX ? xm : zm) + o + (R() - 0.5) * 2;
        const v = c + inward * (setback + d / 2);
        const b = alongX ? { x: u, z: v, yaw: inward > 0 ? Math.PI : 0 } : { x: v, z: u, yaw: inward > 0 ? -Math.PI / 2 : Math.PI / 2 };
        const hs = house(b, w, d);
        // driveway, maybe a garage, maybe a car
        const dSide = o < 0 ? 1 : o > 0 ? -1 : (R() < 0.5 ? -1 : 1), du = u + dSide * (w / 2 + 2);
        const dv0 = c + inward * (sw(c) / 2), dv1 = c + inward * (setback + d * 0.8);
        if (alongX) flat(du - 1.5, Math.min(dv0, dv1), du + 1.5, Math.max(dv0, dv1), 0.05, '#8d8780');
        else flat(Math.min(dv0, dv1), du - 1.5, Math.max(dv0, dv1), du + 1.5, 0.05, '#8d8780');
        if (R() < 0.4) {
          const gb = alongX ? { x: du, z: v, yaw: b.yaw } : { x: v, z: du, yaw: b.yaw };
          part(boxes, gb, 0, 1.6, 0, 3.8, 3.2, 6, hs.wall);
          part(roofs, gb, 0, 3.2, 0, 4.3, 1.2, 6.6, '#4a4a52');
          part(boxes, gb, 0, 1.2, 3.02, 2.8, 2.4, 0.08, '#e8e2d6');
          addObb(gb, 2.1, 3.2, 3.2, 1.2);
        }
        if (R() < 0.55) {
          const cv2 = c + inward * (sw(c) / 2 + 3.2);
          if (alongX) car(du, cv2, 0); else car(cv2, du, Math.PI / 2);
        }
        const door = new THREE.Vector2(b.x + Math.sin(b.yaw) * (d / 2 + 1.2), b.z + Math.cos(b.yaw) * (d / 2 + 1.2));
        const curb = alongX ? new THREE.Vector2(u, c + inward * 2) : new THREE.Vector2(c + inward * 2, u);
        // the street's nearer crossing toward the green
        const gi = GRID.indexOf(c);
        let ni, nj;
        if (alongX) { nj = gi; ni = Math.abs(x0) < Math.abs(x1) ? i : i + 1; }
        else { ni = gi; nj = Math.abs(z0) < Math.abs(z1) ? j : j + 1; }
        houses.push({ door, curb, ni, nj });
      }
    }
    for (let n = 0; n < 5; n++) treeSpots.push([xm + (R() - 0.5) * 30, zm + (R() - 0.5) * 30, 2]);
  }

  function buildSchool(x0, z0, x1, z1) {
    // faces south onto the square's street (z = -25)
    const bMain = { x: (x0 + x1) / 2, z: z1 - sw(z1) / 2 - 7 - 6, yaw: 0 };
    flatTop(bMain, 38, 12, 8.5, '#9a4a35', '#e8e0d0');
    const bWing = { x: x0 + 13, z: bMain.z - 16, yaw: 0 };
    flatTop(bWing, 12, 20, 8.5, '#9a4a35', '#e8e0d0');
    for (let n = 0; n < 12; n++) for (const y of [2.2, 5.8]) windowAt(bMain, -17 + n * 3.1, y, 6.06, 1.6, 1.6, 0.12, 0.5);
    part(boxes, bMain, 0, 2.2, 7, 6, 4.4, 2, '#e8e0d0');      // entrance
    part(boxes, bMain, 0, 1.4, 8.05, 2.6, 2.8, 0.1, '#3a2618');
    inst(cyls, bMain.x + 8, 6.5, bMain.z + 10, 0.12, 13, 0.12, 0, '#d8d8d8'); // flagpole
    inst(boxes, bMain.x + 9.3, 12.2, bMain.z + 10, 2.4, 1.4, 0.06, 0, '#b3122e');
    flat(x0 + 28, z0 + 5, x1 - 6, z0 + 23, 0.04, '#7fa040');   // ball field behind the school
    inst(flats, x0 + 36, 0.03, z0 + 14, 9, 0.06, 9, Math.PI / 4, '#b08a5a');
  }

  function buildWaterTower(x, z) {
    for (const [lx, lz] of [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]]) inst(cyls, x + lx, 11, z + lz, 0.35, 22, 0.35, 0, '#8d9aa4');
    inst(cyls, x, 26, z, 7, 8, 7, 0, '#a9b8c4');
    inst(cones, x, 30, z, 7.4, 3.5, 7.4, 0, '#8d9aa4');
    const c2 = document.createElement('canvas'); c2.width = 1024; c2.height = 128;
    const g = c2.getContext('2d');
    g.fillStyle = '#a9b8c4'; g.fillRect(0, 0, 1024, 128);
    g.fillStyle = '#7a2a1d'; g.font = 'bold 84px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('GOBBLEVILLE', 256, 68); g.fillText('GOBBLEVILLE', 768, 68);
    const t2 = new THREE.CanvasTexture(c2); t2.colorSpace = THREE.SRGBColorSpace; t2.anisotropy = 4;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(7.05, 7.05, 3.2, 40, 1, true), new THREE.MeshStandardMaterial({ map: t2, roughness: 0.7 }));
    band.position.set(x, 26.5, z);
    scene.add(band);
    obbs.push({ x, z, yaw: 0, hw: 7, hd: 7, wallH: 33.5, roofH: 0 });
    for (let n = 0; n < 6; n++) treeSpots.push([x + (R() - 0.5) * 40, z + (R() - 0.5) * 40, 2]);
  }

  // ---------- farms and fields beyond town (one pattern, turned to each side) ----------
  const fieldRects = [];
  const FIELD_TYPES = ['corn', 'pumpkin', 'plowed', 'hay'];
  for (let k = 0; k < 4; k++) {
    const toW = (x, z) => rotK(k, x, z);
    const yawW = y => y - (k * Math.PI) / 2;
    // farmstead east of the right-hand country road
    const fb = (x, z, yaw) => { const [wx, wz] = toW(x, z); return { x: wx, z: wz, yaw: yawW(yaw) }; };
    const barn = fb(62, -160, 0);
    gable(barn, 20, 13, 7.5, 6, '#8f2420', '#3a2a22');
    part(boxes, barn, -10.05, 2.7, 0, 0.2, 5.4, 5.2, '#f3ead8');
    part(boxes, barn, -10.12, 2.6, 0, 0.25, 5.0, 4.6, '#6b1a16');
    part(boxes, barn, 0, 3.4, 6.56, 3, 3, 0.1, '#f3ead8');
    const [sx2, sz2] = toW(78, -148);
    inst(cyls, sx2, 8.5, sz2, 3.2, 17, 3.2, 0, '#a9b0b4');
    inst(cones, sx2, 17, sz2, 3.5, 2.6, 3.5, 0, '#7d868b');
    obbs.push({ x: sx2, z: sz2, yaw: 0, hw: 3.2, hd: 3.2, wallH: 19.5, roofH: 0 });
    house(fb(41, -141, -Math.PI / 2), 9, 8, '#f3ead8');
    { const [a1, b1] = toW(29, -143), [a2, b2] = toW(36, -139); flat(a1, b1, a2, b2, 0.04, '#8a7050'); }
    car(...toW(33, -150), yawW(0));
    for (let n = 0; n < 6; n++) { const [bx, bz] = toW(90 + R() * 25, -175 + R() * 20); bales.push([bx, bz, R() * 6.28]); }
    // fields between the roads
    const slots = [[-118, -81], [-68, -32], [-20, 20], [90, 118]];
    slots.forEach(([xa, xb], si) => {
      const zNear = -134, zFar = -Math.min(195, Math.sqrt(205 * 205 - Math.max(xa * xa, xb * xb))) + 6;
      if (zNear - zFar < 12) return;
      const type = FIELD_TYPES[(si + k) % 4];
      const [ax, az] = toW(xa, zNear), [bx, bz] = toW(xb, zFar);
      const soil = type === 'hay' ? '#c9b067' : type === 'corn' ? '#9c7a45' : type === 'pumpkin' ? '#6e5434' : '#7a5a3a';
      flat(ax, az, bx, bz, 0.03, soil, false);
      fieldRects.push([Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz)]);
      const len = zNear - zFar;
      for (let x = xa + 1.5; x < xb - 1; x += type === 'corn' ? 2.4 : 1.8) {
        const [rx, rz] = toW(x, (zNear + zFar) / 2);
        const alongZ = k % 2 === 0;
        if (type === 'corn') inst(boxes, rx, 0.95, rz, alongZ ? 0.9 : len - 2, 1.9, alongZ ? len - 2 : 0.9, 0, R() < 0.5 ? '#c8a656' : '#b8984a');
        if (type === 'plowed') inst(flats, rx, 0.08, rz, alongZ ? 0.6 : len - 1, 0.16, alongZ ? len - 1 : 0.6, 0, '#5e4329');
      }
      const area = (xb - xa) * len;
      if (type === 'pumpkin') for (let n = 0; n < area / 14; n++) { const [px, pz] = toW(xa + 1 + R() * (xb - xa - 2), zFar + 1 + R() * (len - 2)); pumpkins.push([px, pz, 0.45 + R() * 0.4]); }
      if (type === 'hay') for (let n = 0; n < area / 120; n++) { const [px, pz] = toW(xa + 2 + R() * (xb - xa - 4), zFar + 2 + R() * (len - 4)); bales.push([px, pz, R() * 6.28]); }
    });
  }

  // ---------- keep scenery off streets, buildings, driveways and fields ----------
  const clear = (x, z, m) => {
    if (Math.abs(x) < 25 + m && Math.abs(z) < 25 + m) return false;
    for (const r of roads) {
      const half = r.w / 2 + m;
      if (r.z1 === r.z2) { if (Math.abs(z - r.z1) < half && x > Math.min(r.x1, r.x2) - half && x < Math.max(r.x1, r.x2) + half) return false; }
      else if (Math.abs(x - r.x1) < half && z > Math.min(r.z1, r.z2) - half && z < Math.max(r.z1, r.z2) + half) return false;
    }
    for (const o of obbs) {
      const dx = x - o.x, dz = z - o.z, c = Math.cos(o.yaw), s = Math.sin(o.yaw);
      if (Math.abs(dx * c - dz * s) < o.hw + m && Math.abs(dx * s + dz * c) < o.hd + m) return false;
    }
    for (const [a, b, c2, d] of flatRects.concat(fieldRects)) if (x > a - m && x < c2 + m && z > b - m && z < d + m) return false;
    if (Math.abs(x) < 80 && Math.abs(z) < 80) return false; // downtown: no wild trees
    return true;
  };
  out.clear = clear;

  // ---------- trees ----------
  const leafCols = ['#d2691e', '#e8a33c', '#b33a1a', '#c8a02a', '#8f2d1b', '#e07b24', '#a0522d', '#c0461f', '#6f7d2e'];
  const trees = [];
  const addTree = (x, z, small) => trees.push({ x, z, conifer: !small && R() < 0.22, h: small ? 5 + R() * 2 : 6 + R() * 6, r: small ? 1.8 + R() * 0.8 : 2.4 + R() * 1.8, c: leafCols[(R() * leafCols.length) | 0] });
  // street trees along neighborhood streets
  for (const c of GRID) for (let t = -120; t <= 120; t += 11 + R() * 5) {
    if (nearGrid(t)) continue;
    for (const s of [-1, 1]) {
      const off = c + s * (sw(c) / 2 + 2.3);
      if (R() < 0.75 && clear(t, off, 0.8)) addTree(t, off, true);
      if (R() < 0.75 && clear(off, t, 0.8)) addTree(off, t, true);
    }
  }
  for (const [x, z, m] of treeSpots) if (clear(x, z, m)) addTree(x, z, false);
  for (const [x, z] of [[-17, 0], [17, 0], [6, -17], [-6, 17]]) addTree(x, z, true);  // on the green
  for (const [x, z] of [[-16, -40], [16, -40], [-16, -56], [16, -56]]) addTree(x, z, true); // churchyard
  const tryTree = (rMin, rMax, margin) => {
    for (let k = 0; k < 30; k++) {
      const a = R() * Math.PI * 2, r = Math.sqrt(rMin * rMin + R() * (rMax * rMax - rMin * rMin));
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (clear(x, z, margin)) { addTree(x, z, false); return; }
    }
  };
  for (let i = 0; i < 90; i++) tryTree(130, 205, 2.5);                  // hedgerows and meadow trees
  const forestN = quality === 'low' ? 700 : 1400;
  for (let i = 0; i < forestN; i++) tryTree(212, 340, 4.5);            // the woods

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const trunkMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.4, 1, 6).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: '#4a3324', roughness: 1 }), trees.length);
  const nCon = trees.filter(t => t.conifer).length;
  const leafMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), trees.length - nCon);
  const conMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), Math.max(1, nCon));
  let li = 0, ci = 0;
  const col = new THREE.Color();
  trees.forEach((t, i) => {
    const trunkH = t.conifer ? t.h * 0.3 : t.h * 0.45;
    M.compose(P.set(t.x, 0, t.z), Q.identity(), S.set(1, trunkH, 1)); trunkMesh.setMatrixAt(i, M);
    Q.setFromAxisAngle(Yax, R() * 6.28);
    if (t.conifer) {
      M.compose(P.set(t.x, trunkH * 0.6, t.z), Q, S.set(t.r * 0.9, t.h, t.r * 0.9)); conMesh.setMatrixAt(ci, M);
      conMesh.setColorAt(ci++, col.set('#3f5a2e').offsetHSL(0, 0, (R() - 0.5) * 0.08));
    } else {
      M.compose(P.set(t.x, trunkH + t.r * 0.7, t.z), Q, S.set(t.r, t.r * 1.15, t.r)); leafMesh.setMatrixAt(li, M);
      leafMesh.setColorAt(li++, col.set(t.c).offsetHSL((R() - 0.5) * 0.03, 0, (R() - 0.5) * 0.1));
    }
  });
  conMesh.count = nCon;

  // meadow props
  for (let i = 0; i < 30; i++) for (let k = 0; k < 30; k++) {
    const a = R() * 6.28, r = 132 + R() * 70, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (clear(x, z, 1.5)) { (R() < 0.5 ? bales : shocks).push([x, z, R() * 6.28]); break; }
  }

  // ---------- turn the collected instances into meshes ----------
  const finish = (list, geo, mat, cast = true, receive = true) => {
    const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((e, i) => { mesh.setMatrixAt(i, e.m); if (e.c) mesh.setColorAt(i, e.c); });
    mesh.count = list.length;
    mesh.castShadow = cast; mesh.receiveShadow = receive;
    return mesh;
  };
  const meshes = [
    finish(boxes, unitBox, new THREE.MeshStandardMaterial({ roughness: 0.88 })),
    finish(roofs, prismGeometry(), new THREE.MeshStandardMaterial({ roughness: 0.85 })),
    finish(lit, unitBox, new THREE.MeshStandardMaterial({ color: '#ffd38a', emissive: '#ffa53a', emissiveIntensity: 1.1 }), false),
    finish(flats, unitBox, new THREE.MeshStandardMaterial({ roughness: 1 }), false),
    finish(cyls, new THREE.CylinderGeometry(1, 1, 1, 18), new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.2 })),
    finish(cones, new THREE.ConeGeometry(1, 1, 18).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ roughness: 0.7 })),
    trunkMesh, leafMesh, conMesh,
  ];
  const postMat = new THREE.MeshStandardMaterial({ color: '#2a2320' });
  const lampMat = new THREE.MeshStandardMaterial({ color: '#ffcf7a', emissive: '#ff9a2a', emissiveIntensity: 1.6 });
  const postMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.12, 4, 6).translate(0, 2, 0), postMat, lamps.length);
  const lampMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 10, 8), lampMat, lamps.length);
  lamps.forEach(([x, z], i) => {
    M.compose(P.set(x, 0, z), Q.identity(), S.set(1, 1, 1)); postMesh.setMatrixAt(i, M);
    M.compose(P.set(x, 4.15, z), Q.identity(), S.set(1, 1, 1)); lampMesh.setMatrixAt(i, M);
  });
  postMesh.castShadow = true;
  const pumpkinMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8).scale(1, 0.75, 1), new THREE.MeshStandardMaterial({ color: '#e8761f', roughness: 0.6 }), Math.max(1, pumpkins.length));
  pumpkins.forEach(([x, z, r], i) => { M.compose(P.set(x, r * 0.7, z), Q.identity(), S.setScalar(r)); pumpkinMesh.setMatrixAt(i, M); });
  const baleMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.85, 0.85, 1.3, 14).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#cfa64b', roughness: 1 }), Math.max(1, bales.length));
  bales.forEach(([x, z, r], i) => { M.compose(P.set(x, 0.85, z), Q.setFromAxisAngle(Yax, r), S.set(1, 1, 1)); baleMesh.setMatrixAt(i, M); });
  const shockMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.9, 2.6, 8).translate(0, 1.3, 0), new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 1, flatShading: true }), Math.max(1, shocks.length));
  shocks.forEach(([x, z, r], i) => { M.compose(P.set(x, 0, z), Q.setFromAxisAngle(Yax, r), S.set(1, 1, 1)); shockMesh.setMatrixAt(i, M); });
  for (const m of [pumpkinMesh, baleMesh, shockMesh]) { m.castShadow = true; m.receiveShadow = true; }
  for (const m of [...meshes, postMesh, lampMesh, pumpkinMesh, baleMesh, shockMesh]) {
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
    scene.add(m);
  }

  out.plane = buildPlane();
  scene.add(out.plane);

  // ---------- paths for turkeys and neighbors ----------
  // From a street crossing, step one block at a time toward the square (random when two ways both get closer).
  const route = (i, j, rnd) => {
    const pts = [];
    while (!inSquare(i, j)) {
      const opts = [];
      if (i < 2) opts.push([i + 1, j]); if (i > 3) opts.push([i - 1, j]);
      if (j < 2) opts.push([i, j + 1]); if (j > 3) opts.push([i, j - 1]);
      [i, j] = opts[(rnd() * opts.length) | 0];
      pts.push(node(i, j));
    }
    return { pts, corner: node(i, j) };
  };
  const ringPoint = (corner, r, spread, rnd) => {
    const a = Math.atan2(corner.y, corner.x) + (rnd() - 0.5) * spread;
    return new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r);
  };
  const jitter = (v, amt, rnd) => v.clone().add(new THREE.Vector2((rnd() - 0.5) * 2 * amt, (rnd() - 0.5) * 2 * amt));
  out.turkeyPath = (entryIdx, rnd) => {
    const e = out.entries[entryIdx];
    const lat = e.lane ? 1 : 2.2;
    const { pts, corner } = route(e.i, e.j, rnd);
    return [jitter(e.spawn, lat, rnd), jitter(node(e.i, e.j), lat, rnd), ...pts.map(p => jitter(p, 2.2, rnd)),
      ringPoint(corner, FEAST_R + rnd() * 3.5, 1.2, rnd)];
  };
  out.neighborPath = (h, rnd) => {
    const { pts, corner } = route(h.ni, h.nj, rnd);
    return [h.door.clone(), h.curb.clone(), jitter(node(h.ni, h.nj), 1.5, rnd), ...pts.map(p => jitter(p, 1.5, rnd)), ringPoint(corner, 13.5, 0.8, rnd)];
  };

  // Is a point inside a building? Roofs slope across the building's depth.
  out.hitBuilding = (p) => {
    if (p.y > 34) return null;
    for (const b of obbs) {
      const dx = p.x - b.x, dz = p.z - b.z;
      if (dx * dx + dz * dz > 400 + (b.hw * b.hw + b.hd * b.hd) * 2) continue;
      const c = Math.cos(b.yaw), s = Math.sin(b.yaw);
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) > b.hw || Math.abs(lz) > b.hd) continue;
      const topY = b.wallH + b.roofH * Math.max(0, 1 - Math.abs(lz) / b.hd);
      if (p.y <= topY) return b;
    }
    return null;
  };

  return out;
}

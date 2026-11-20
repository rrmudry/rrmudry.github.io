// Thanksgobbling world: an autumn town at golden hour, built from instanced primitives so it runs on Chromebooks.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const ROADS = 6;
export const PLAZA_R = 21;      // stone plaza around the feast hall
export const FEAST_R = 15.5;    // turkeys stop here and start eating
export const DELIVER_R = 19;    // neighbors hand off their dish here
export const SPAWN_R = 195;     // turkeys come out of the woods here
export const AIM_R = 200;       // farthest the gimbal can look from the hall

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
export function buildWorld(scene, quality) {
  const R = rng(1121);
  const out = { houses: [], obbs: [], lanes: [], roadAngles: [] };

  // sky and fog
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
  scene.fog = new THREE.Fog(horizon, 260, 760);

  // light
  scene.add(new THREE.HemisphereLight('#ffd9b0', '#4a3b2a', 1.25));
  const sun = new THREE.DirectionalLight('#ffc48a', 2.8);
  sun.position.copy(sunDir).multiplyScalar(320);
  sun.castShadow = true;
  const sc = sun.shadow.camera;
  sc.left = -215; sc.right = 215; sc.top = 190; sc.bottom = -190; sc.near = 10; sc.far = 800;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);
  out.sun = sun;

  // ground
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

  // roads and lanes: turkeys walk in along roads and along the field paths halfway between them
  const roadMat = new THREE.MeshStandardMaterial({ color: '#7a6248', roughness: 1 });
  for (let i = 0; i < ROADS; i++) {
    const a = (i / ROADS) * Math.PI * 2 + Math.PI / 6;
    out.roadAngles.push(a);
    const road = new THREE.Mesh(new THREE.BoxGeometry(200, 0.04, 8), roadMat);
    road.rotation.y = -a;
    road.position.set(Math.cos(a) * 118, 0.01, Math.sin(a) * 118);
    road.receiveShadow = true;
    scene.add(road);
    out.lanes.push({ ang: a, latMax: 3.0, road: true });
    out.lanes.push({ ang: a + Math.PI / ROADS, latMax: 1.4, road: false });
  }
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(PLAZA_R, PLAZA_R, 0.07, 48), new THREE.MeshStandardMaterial({ color: '#9b8566', roughness: 0.95 }));
  plaza.position.y = 0.0; plaza.receiveShadow = true;
  scene.add(plaza);

  // ---- houses (instanced) ----
  const wallCols = ['#f3ead8', '#e8d9b5', '#9e2b25', '#d9a441', '#8aa07a', '#6f87a6', '#c9b79c', '#b5651d'];
  const roofCols = ['#3b3433', '#5a3b2e', '#7a2a1d', '#2f4a3a', '#4a4a52'];
  const houses = out.houses;
  for (const a of out.roadAngles) {
    for (const side of [-1, 1]) {
      for (let s = 38; s < 160; s += 19 + R() * 8) {
        if (R() < 0.17) continue;
        const w = 7 + R() * 3, d = 6 + R() * 1.4;
        const tall = R() < 0.35;
        const h = tall ? 5.6 + R() * 0.8 : 3.4 + R() * 0.8, rh = 2.4 + R() * 1.3;
        const off = 7.5 + d / 2;
        const dir = [Math.cos(a), Math.sin(a)], perp = [-Math.sin(a), Math.cos(a)];
        const x = dir[0] * s + perp[0] * side * off, z = dir[1] * s + perp[1] * side * off;
        const f = [-side * perp[0], -side * perp[1]];
        houses.push({ x, z, yaw: Math.atan2(f[0], f[1]), w, d, h, rh, s, side, roadAng: a,
          wall: wallCols[(R() * wallCols.length) | 0], roof: roofCols[(R() * roofCols.length) | 0] });
      }
    }
  }
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const N = houses.length;
  const wallMesh = new THREE.InstancedMesh(unitBox, new THREE.MeshStandardMaterial({ roughness: 0.9 }), N + 1);
  const roofMesh = new THREE.InstancedMesh(prismGeometry(), new THREE.MeshStandardMaterial({ roughness: 0.85 }), N + 1);
  const chimMesh = new THREE.InstancedMesh(unitBox, new THREE.MeshStandardMaterial({ color: '#8a4b3a', roughness: 0.9 }), N);
  const doorMesh = new THREE.InstancedMesh(unitBox, new THREE.MeshStandardMaterial({ color: '#4a2c1a', roughness: 0.8 }), N);
  const winMesh = new THREE.InstancedMesh(unitBox, new THREE.MeshStandardMaterial({ color: '#ffd38a', emissive: '#ffa53a', emissiveIntensity: 1.1 }), N * 7);
  for (const m of [wallMesh, roofMesh, chimMesh]) { m.castShadow = true; m.receiveShadow = true; }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  const local = (hs, lx, ly, lz) => {
    const c = Math.cos(hs.yaw), s = Math.sin(hs.yaw);
    return P.set(hs.x + lx * c + lz * s, ly, hs.z - lx * s + lz * c);
  };
  let wi = 0;
  houses.forEach((hs, i) => {
    Q.setFromAxisAngle(Y, hs.yaw);
    M.compose(P.set(hs.x, hs.h / 2, hs.z), Q, S.set(hs.w, hs.h, hs.d)); wallMesh.setMatrixAt(i, M); wallMesh.setColorAt(i, new THREE.Color(hs.wall));
    M.compose(P.set(hs.x, hs.h, hs.z), Q, S.set(hs.w + 0.7, hs.rh, hs.d + 1.0)); roofMesh.setMatrixAt(i, M); roofMesh.setColorAt(i, new THREE.Color(hs.roof));
    M.compose(local(hs, hs.w * 0.28, hs.h + hs.rh * 0.55, -hs.d * 0.18), Q, S.set(0.8, hs.rh * 0.9, 0.8)); chimMesh.setMatrixAt(i, M);
    M.compose(local(hs, 0, 1.1, hs.d / 2 + 0.04), Q, S.set(1.1, 2.2, 0.12)); doorMesh.setMatrixAt(i, M);
    const wy = Math.min(2.0, hs.h * 0.55);
    const wins = [[-hs.w * 0.3, wy, hs.d / 2 + 0.04, 0], [hs.w * 0.3, wy, hs.d / 2 + 0.04, 0], [hs.w / 2 + 0.04, wy, 0, 1], [-hs.w / 2 - 0.04, wy, 0, 1]];
    if (hs.h > 5) wins.push([-hs.w * 0.3, hs.h * 0.78, hs.d / 2 + 0.04, 0], [0, hs.h * 0.78, hs.d / 2 + 0.04, 0], [hs.w * 0.3, hs.h * 0.78, hs.d / 2 + 0.04, 0]);
    for (const [lx, ly, lz, sideWin] of wins) {
      M.compose(local(hs, lx, ly, lz), Q, sideWin ? S.set(0.12, 1.1, 1.0) : S.set(1.0, 1.1, 0.12));
      winMesh.setMatrixAt(wi++, M);
    }
    out.obbs.push({ x: hs.x, z: hs.z, yaw: hs.yaw, hw: hs.w / 2 + 0.35, hd: hs.d / 2 + 0.5, wallH: hs.h, roofH: hs.rh });
  });
  winMesh.count = wi;

  // ---- feast hall (a red barn) ----
  const hall = new THREE.Group();
  const hallW = 16, hallD = 11, hallH = 8;
  const mk = (geo, color, x, y, z, opts = {}) => {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...opts }));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; hall.add(m); return m;
  };
  mk(new THREE.BoxGeometry(hallW, hallH, hallD), '#8f2420', 0, hallH / 2, 0);
  const roof = mk(prismGeometry(), '#3a2a22', 0, hallH, 0); roof.scale.set(hallW + 1, 5.5, hallD + 1.6);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mk(new THREE.BoxGeometry(0.45, hallH, 0.45), '#f3ead8', x * hallW / 2, hallH / 2, z * hallD / 2);
  for (const z of [-1, 1]) {
    mk(new THREE.BoxGeometry(5.4, 5.6, 0.25), '#f3ead8', 0, 2.8, z * (hallD / 2 + 0.05));
    mk(new THREE.BoxGeometry(4.8, 5.0, 0.3), '#6b1a16', 0, 2.6, z * (hallD / 2 + 0.08));
    for (const s of [-1, 1]) { const b = mk(new THREE.BoxGeometry(0.3, 6.8, 0.34), '#f3ead8', 0, 2.6, z * (hallD / 2 + 0.1)); b.rotation.z = s * Math.atan2(4.8, 5.0); }
    mk(new THREE.BoxGeometry(2.2, 1.8, 0.3), '#ffd38a', 0, 9.6, z * (hallD / 2 + 0.75), { emissive: '#ffa53a', emissiveIntensity: 1.1 });
  }
  for (const x of [-1, 1]) for (const z of [-3, 0, 3]) mk(new THREE.BoxGeometry(0.3, 1.4, 1.2), '#ffd38a', x * (hallW / 2 + 0.05), 4.5, z, { emissive: '#ffa53a', emissiveIntensity: 1.1 });
  // banner
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
  // golden turkey weathervane
  const vane = new THREE.Mesh(turkeyGeometry(), new THREE.MeshStandardMaterial({ color: '#d4a43a', metalness: 0.8, roughness: 0.35 }));
  vane.scale.setScalar(0.75); vane.position.set(0, hallH + 5.6, 0); vane.castShadow = true;
  hall.add(vane); out.vane = vane;
  scene.add(hall);
  out.obbs.push({ x: 0, z: 0, yaw: 0, hw: hallW / 2 + 0.5, hd: hallD / 2 + 0.8, wallH: hallH, roofH: 5.5, hall: true });

  // tables with dishes; dishes vanish as the feast gets eaten
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

  // lantern posts around the plaza
  const postMat = new THREE.MeshStandardMaterial({ color: '#2a2320' });
  const lampMat = new THREE.MeshStandardMaterial({ color: '#ffcf7a', emissive: '#ff9a2a', emissiveIntensity: 1.6 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const off = out.roadAngles.some(r => Math.abs(Math.atan2(Math.sin(a - r), Math.cos(a - r))) < 0.25);
    const rr = off ? PLAZA_R + 3.5 : PLAZA_R - 0.6;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 6), postMat);
    post.position.set(Math.cos(a) * rr, 1.6, Math.sin(a) * rr); post.castShadow = true; scene.add(post);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), lampMat);
    lamp.position.set(post.position.x, 3.35, post.position.z); scene.add(lamp);
  }

  // ---- placement helper: keep scenery off the turkey lanes, the plaza and the houses ----
  const clear = (x, z, margin) => {
    const r = Math.hypot(x, z);
    if (r < PLAZA_R + 3 + margin) return false;
    for (const L of out.lanes) {
      const s = x * Math.cos(L.ang) + z * Math.sin(L.ang);
      if (s <= 0) continue;
      const lat = -x * Math.sin(L.ang) + z * Math.cos(L.ang);
      if (Math.abs(lat) < (L.road ? 5 : 3.2) + margin) return false;
    }
    for (const hs of houses) if (Math.hypot(x - hs.x, z - hs.z) < Math.max(hs.w, hs.d) * 0.62 + margin + 0.8) return false;
    return true;
  };
  out.clear = clear;

  // ---- trees (instanced) ----
  const leafCols = ['#d2691e', '#e8a33c', '#b33a1a', '#c8a02a', '#8f2d1b', '#e07b24', '#a0522d', '#c0461f', '#6f7d2e'];
  const trees = [];
  const tryTree = (rMin, rMax, margin) => {
    for (let k = 0; k < 30; k++) {
      const a = R() * Math.PI * 2, r = Math.sqrt(rMin * rMin + R() * (rMax * rMax - rMin * rMin));
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (clear(x, z, margin)) { trees.push({ x, z, conifer: R() < 0.22, h: 6 + R() * 6, r: 2.4 + R() * 1.8, c: leafCols[(R() * leafCols.length) | 0] }); return; }
    }
  };
  for (let i = 0; i < 130; i++) tryTree(26, 165, 3.5);
  const forestN = quality === 'low' ? 650 : 1300;
  for (let i = 0; i < forestN; i++) tryTree(172, 330, 4.5);
  const trunkMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.4, 1, 6).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: '#4a3324', roughness: 1 }), trees.length);
  const leafGeo = new THREE.IcosahedronGeometry(1, 1);
  const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true });
  const conGeo = new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0);
  const nCon = trees.filter(t => t.conifer).length;
  const leafMesh = new THREE.InstancedMesh(leafGeo, leafMat, trees.length - nCon);
  const conMesh = new THREE.InstancedMesh(conGeo, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), nCon);
  let li = 0, ci = 0;
  const col = new THREE.Color();
  trees.forEach((t, i) => {
    const trunkH = t.conifer ? t.h * 0.3 : t.h * 0.45;
    M.compose(P.set(t.x, 0, t.z), Q.identity(), S.set(1, trunkH, 1)); trunkMesh.setMatrixAt(i, M);
    Q.setFromAxisAngle(Y, R() * 6.28);
    if (t.conifer) {
      M.compose(P.set(t.x, trunkH * 0.6, t.z), Q, S.set(t.r * 0.9, t.h, t.r * 0.9)); conMesh.setMatrixAt(ci, M);
      conMesh.setColorAt(ci++, col.set('#3f5a2e').offsetHSL(0, 0, (R() - 0.5) * 0.08));
    } else {
      M.compose(P.set(t.x, trunkH + t.r * 0.7, t.z), Q, S.set(t.r, t.r * 1.15, t.r)); leafMesh.setMatrixAt(li, M);
      leafMesh.setColorAt(li++, col.set(t.c).offsetHSL((R() - 0.5) * 0.03, 0, (R() - 0.5) * 0.1));
    }
  });
  for (const m of [trunkMesh, leafMesh, conMesh]) { m.castShadow = true; m.receiveShadow = true; }

  // ---- autumn props: pumpkin patches, hay bales, corn shocks ----
  const pumpkins = [], bales = [], shocks = [];
  for (let p = 0; p < 14; p++) {
    for (let k = 0; k < 40; k++) {
      const a = R() * 6.28, r = 30 + R() * 130, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!clear(x, z, 5)) continue;
      const n = 6 + (R() * 7) | 0;
      for (let j = 0; j < n; j++) pumpkins.push([x + (R() - 0.5) * 9, z + (R() - 0.5) * 9, 0.45 + R() * 0.45]);
      break;
    }
  }
  houses.forEach(hs => { if (R() < 0.6) { const c = Math.cos(hs.yaw), s = Math.sin(hs.yaw); const lx = 1.2, lz = hs.d / 2 + 0.7; pumpkins.push([hs.x + lx * c + lz * s, hs.z - lx * s + lz * c, 0.4]); } });
  for (let i = 0; i < 34; i++) for (let k = 0; k < 30; k++) {
    const a = R() * 6.28, r = 26 + R() * 140, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (clear(x, z, 1.5)) { (R() < 0.55 ? bales : shocks).push([x, z, R() * 6.28]); break; }
  }
  const pumpkinMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8).scale(1, 0.75, 1), new THREE.MeshStandardMaterial({ color: '#e8761f', roughness: 0.6 }), pumpkins.length);
  pumpkins.forEach(([x, z, r], i) => { M.compose(P.set(x, r * 0.7, z), Q.identity(), S.setScalar(r)); pumpkinMesh.setMatrixAt(i, M); });
  const baleMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.85, 0.85, 1.3, 14).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#cfa64b', roughness: 1 }), bales.length);
  bales.forEach(([x, z, r], i) => { M.compose(P.set(x, 0.85, z), Q.setFromAxisAngle(Y, r), S.set(1, 1, 1)); baleMesh.setMatrixAt(i, M); });
  const shockMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.9, 2.6, 8).translate(0, 1.3, 0), new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 1, flatShading: true }), shocks.length);
  shocks.forEach(([x, z, r], i) => { M.compose(P.set(x, 0, z), Q.setFromAxisAngle(Y, r), S.set(1, 1, 1)); shockMesh.setMatrixAt(i, M); });
  for (const m of [pumpkinMesh, baleMesh, shockMesh]) { m.castShadow = true; m.receiveShadow = true; }

  for (const m of [wallMesh, roofMesh, chimMesh, doorMesh, winMesh, trunkMesh, leafMesh, conMesh, pumpkinMesh, baleMesh, shockMesh]) {
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
    scene.add(m);
  }

  // the plane
  out.plane = buildPlane();
  scene.add(out.plane);

  // Is a point inside a building? Returns the obb or null. Roofs slope, so the height test depends on lx.
  out.hitBuilding = (p) => {
    if (p.y > 14) return null;
    for (const b of out.obbs) {
      const dx = p.x - b.x, dz = p.z - b.z;
      if (dx * dx + dz * dz > 100 + b.hw * b.hw * 2) continue;
      const c = Math.cos(b.yaw), s = Math.sin(b.yaw);
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) > b.hw || Math.abs(lz) > b.hd) continue;
      const top = b.wallH + b.roofH * Math.max(0, 1 - Math.abs(lz) / b.hd);
      if (p.y <= top) return b;
    }
    return null;
  };

  return out;
}

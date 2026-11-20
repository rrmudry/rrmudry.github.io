// Thanksgobbling: gunner's-seat game. The Gravy Boat circles the town; the camera gimbal is locked to a point on the ground.
import * as THREE from 'three';
import * as W from './world.js';
import { Sfx } from './audio.js';

const $ = id => document.getElementById(id);
const clamp = THREE.MathUtils.clamp;
const rand = Math.random;

// ---------- physics constants (1 unit = 1 m) ----------
const G = 10;                                   // class convention: g = 10 m/s²
const GRAV = new THREE.Vector3(0, -G, 0);
const ORBIT_R = 135, ORBIT_H = 115, PLANE_V = 22;
const OMEGA = PLANE_V / ORBIT_R;
const BANK = Math.atan(PLANE_V * PLANE_V / (G * ORBIT_R)); // tan(bank) = v²/(g r)
const MUZZLE_DROP = 3;

// ---------- settings ----------
const loadJSON = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } };
const settings = Object.assign({ sound: true, music: true, quality: 'high', computer: true, invert: false, sens: 1 }, loadJSON('tg_settings'));
const saveSettings = () => { try { localStorage.setItem('tg_settings', JSON.stringify(settings)); } catch (e) { } };
let best = 0; try { best = +localStorage.getItem('tg_best') || 0; } catch (e) { }
let TOUCH = matchMedia('(pointer: coarse)').matches;
let lastTouch = 0;

// ---------- weapons ----------
const BASE_WEAPONS = [
  { id: 'cran', name: 'CRANBERRIES', key: '1', speed: 200, rate: 9, mag: 40, reload: 2.0, splash: 2.0, dmg: 1, fov: [50, 30], auto: true, word: 'REFILLING' },
  { id: 'yam', name: 'SWEET POTATOES', key: '2', speed: 150, rate: 2.2, mag: 5, reload: 2.6, splash: 4.5, dmg: 3, fov: [34, 20], auto: false, word: 'PEELING' },
  { id: 'pie', name: 'PUMPKIN PIE', key: '3', speed: 110, rate: 1, mag: 1, reload: 3.4, splash: 10, dmg: 12, fov: [24, 13], auto: false, word: 'BAKING' },
];
let weapons, wi = 0, zoom = 0, switching = 0;

// ---------- turkeys ----------
const TT = {
  turkey: { hp: 1, speed: 3.0, scale: 1.5, pts: 100, tint: new THREE.Color('#ffffff'), drain: 1.6 },
  runner: { hp: 1, speed: 6.2, scale: 1.25, pts: 150, tint: new THREE.Color('#f5dcb4'), drain: 1.2 },
  tom: { hp: 7, speed: 1.9, scale: 2.4, pts: 400, tint: new THREE.Color('#a08070'), drain: 4.0 },
};
const RED = new THREE.Color('#ff3030');

// ---------- renderer & scene ----------
const canvas = $('view');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  $('loading').textContent = 'This game needs WebGL (3D graphics), and this browser has it turned off.';
  throw e;
}
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 1, 2000);
const world = W.buildWorld(scene, settings.quality);
const sfx = new Sfx(settings);

function applyQuality() {
  const high = settings.quality === 'high';
  renderer.setPixelRatio(high ? Math.min(devicePixelRatio, 1.5) : 1);
  const size = high ? 2048 : 1024;
  const sh = world.sun.shadow;
  if (sh.mapSize.x !== size) { sh.mapSize.set(size, size); if (sh.map) { sh.map.dispose(); sh.map = null; } }
  resize();
}
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  updateScale();
}
function updateScale() {
  particles.mat.uniforms.uScale.value = (innerHeight * renderer.getPixelRatio() / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
}
addEventListener('resize', resize);

// ---------- instanced pools ----------
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
function pool(geo, mat, n, shadow = true) {
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false; mesh.castShadow = shadow;
  for (let i = 0; i < n; i++) { mesh.setMatrixAt(i, ZERO); mesh.setColorAt(i, _c.set('#ffffff')); }
  scene.add(mesh);
  const free = []; for (let i = n - 1; i >= 0; i--) free.push(i);
  return { mesh, take: () => (free.length ? free.pop() : -1), give: i => { mesh.setMatrixAt(i, ZERO); free.push(i); } };
}
const tPool = pool(W.turkeyGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }), 160);
const nPool = pool(W.neighborGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }), 24);
const ringPool = pool(new THREE.RingGeometry(1.3, 1.85, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.9, depthWrite: false }), 24, false);
const hideRing = i => ringPool.mesh.setMatrixAt(i, ZERO);
const projPools = {
  cran: pool(new THREE.SphereGeometry(0.42, 8, 6), new THREE.MeshStandardMaterial({ color: '#b3122e', emissive: '#4a0010', roughness: 0.35 }), 140),
  yam: pool(W.yamGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }), 30),
  pie: pool(W.pieGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }), 8),
};
const decalPool = pool(W.blobGeometry(), new THREE.MeshStandardMaterial({ roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), 260, false);
decalPool.mesh.receiveShadow = true;

// ---------- particles ----------
class Particles {
  constructor(max) {
    this.max = max; this.next = 0;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max); this.alpha = new Float32Array(max);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.maxLife = new Float32Array(max);
    this.grav = new Float32Array(max); this.drag = new Float32Array(max);
    const g = this.geo = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('pcolor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uScale: { value: 600 } },
      vertexShader: `attribute float size; attribute float alpha; attribute vec3 pcolor; uniform float uScale; varying vec3 vC; varying float vA;
        void main(){ vC = pcolor; vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
          gl_PointSize = alpha > 0.0 ? max(2.0, size * uScale / -mv.z) : 0.0; }`,
      fragmentShader: `varying vec3 vC; varying float vA;
        void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard; gl_FragColor = vec4(vC, vA * smoothstep(0.5, 0.3, d)); }`,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }
  spawn(x, y, z, vx, vy, vz, hex, size, life, grav = 1, drag = 0) {
    const i = this.next; this.next = (this.next + 1) % this.max;
    this.pos.set([x, y, z], i * 3); this.vel.set([vx, vy, vz], i * 3);
    this.col.set([((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255], i * 3);
    this.size[i] = size; this.life[i] = this.maxLife[i] = life; this.grav[i] = grav; this.drag[i] = drag; this.alpha[i] = 1;
  }
  burst(p, n, hex, speed, up, size, life, grav = 1, drag = 0.5) {
    for (let k = 0; k < n; k++) {
      const a = rand() * 6.283, s = speed * (0.3 + rand() * 0.7);
      this.spawn(p.x, p.y + 0.3, p.z, Math.cos(a) * s, up * (0.4 + rand() * 0.8), Math.sin(a) * s, hex, size * (0.6 + rand() * 0.6), life * (0.6 + rand() * 0.6), grav, drag);
    }
  }
  update(dt) {
    const P = this.pos, V = this.vel;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
      const j = i * 3, dr = 1 - this.drag[i] * dt;
      V[j + 1] -= G * this.grav[i] * dt;
      V[j] *= dr; V[j + 1] *= dr; V[j + 2] *= dr;
      P[j] += V[j] * dt; P[j + 1] += V[j + 1] * dt; P[j + 2] += V[j + 2] * dt;
      if (P[j + 1] < 0.1) { P[j + 1] = 0.1; V[j] *= 0.5; V[j + 1] = 0; V[j + 2] *= 0.5; }
      this.alpha[i] = Math.min(1, (this.life[i] / this.maxLife[i]) * 2.5);
    }
    for (const k of ['position', 'pcolor', 'size', 'alpha']) this.geo.attributes[k].needsUpdate = true;
  }
  clear() { this.life.fill(0); this.alpha.fill(0); }
}
const particles = new Particles(3000);

// shockwave rings for pie hits
const shocks = [];
for (let i = 0; i < 4; i++) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fff3d6', transparent: true, opacity: 0, depthWrite: false }));
  m.visible = false; scene.add(m); shocks.push({ m, t: 1, r: 1 });
}

// ---------- game state ----------
let state = 'loading';     // title | playing | paused | upgrade | over
let time = 0, planeAng = 0;
const planePos = new THREE.Vector3(), planeVel = new THREE.Vector3();
const aim = new THREE.Vector3();      // where the crosshair is now (eases toward aimGoal)
const aimGoal = new THREE.Vector3();  // where the mouse has asked it to go
const camPos = new THREE.Vector3();
let shake = 0;
let turkeys = [], neighbors = [], projectiles = [], decals = [], popups = [];
let score, wave, feast, drainMul, spawnQueue, spawnTimer, neighborsLeft, neighborTimer, waveTimer, stats, picked, waveActive, feastWarned, gobbleTimer, munchTimer;
let fireHeld = false, fireQueued = false;
const keys = {};

function resetGame() {
  for (const t of turkeys) tPool.give(t.idx);
  for (const n of neighbors) { nPool.give(n.idx); hideRing(n.idx); }
  for (const p of projectiles) projPools[p.w.id].give(p.idx);
  for (const d of decals) decalPool.give(d.idx);
  turkeys = []; neighbors = []; projectiles = []; decals = [];
  popups.forEach(p => p.el.remove()); popups = [];
  particles.clear();
  weapons = BASE_WEAPONS.map(w => ({ ...w, ammo: w.mag, cool: 0, reloading: 0 }));
  wi = 0; zoom = 0; switching = 0;
  score = 0; wave = 0; feast = 100; drainMul = 1; picked = {};
  stats = { shots: 0, hits: 0, sauced: 0, delivered: 0, oops: 0, toms: 0, bestMulti: 0 };
  spawnQueue = []; waveActive = false; feastWarned = false; gobbleTimer = 2; munchTimer = 0;
  aim.set(0, 0, 0); aimGoal.set(0, 0, 0);
  setDishes();
  buildWeaponHud();
}

// ---------- plane & gimbal ----------
function updatePlane(dt) {
  planeAng += OMEGA * dt;
  const c = Math.cos(planeAng), s = Math.sin(planeAng);
  planePos.set(ORBIT_R * c, ORBIT_H, ORBIT_R * s);
  planeVel.set(-ORBIT_R * s * OMEGA, 0, ORBIT_R * c * OMEGA);
  const p = world.plane;
  p.position.copy(planePos).add(_p.set(0, 7, 0));
  p.rotation.set(0, 0, 0);
  p.rotation.y = Math.atan2(planeVel.x, planeVel.z);
  p.rotateZ(-BANK); // banked into the turn, left wing toward the town
}

function rotateAim(dx, dy) {
  const dir = _p.copy(aimGoal).sub(camPos).normalize();
  let yaw = Math.atan2(dir.x, dir.z), pitch = Math.asin(clamp(dir.y, -1, 1));
  yaw -= dx; pitch -= settings.invert ? -dy : dy;
  pitch = clamp(pitch, -1.5, -0.2);
  const nd = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  aimGoal.copy(camPos).addScaledVector(nd, -camPos.y / nd.y);
  aimGoal.y = 0;
  const r = Math.hypot(aimGoal.x, aimGoal.z);
  if (r > W.AIM_R) aimGoal.multiplyScalar(W.AIM_R / r);
}
// Radians per pixel. Narrower zoom turns slower so the crosshair moves about the same distance on screen.
const SENS = [0.6, 1, 1.5], SENS_NAMES = ['Slow', 'Normal', 'Fast'];
const lookSens = () => 0.0012 * settings.sens * (camera.fov / 50);
const capPx = v => clamp(v, -120, 120); // pointer lock sometimes reports a huge jump; ignore spikes
function smoothAim(dt) {
  aim.lerp(aimGoal, 1 - Math.exp(-14 * dt)); // eases in about 0.15 s
}

// ---------- ballistics ----------
// Launch velocity (relative to the air) that lands at target: p(t) = p0 + v t + ½ g t², with |v − v_plane| = muzzle speed.
const _D = new THREE.Vector3(), _v = new THREE.Vector3(), _rel = new THREE.Vector3();
function solveLaunch(p0, target, speed) {
  _D.copy(target).sub(p0);
  let t = _D.length() / speed;
  for (let i = 0; i < 14; i++) {
    _v.copy(_D).addScaledVector(GRAV, -0.5 * t * t).divideScalar(t);
    _rel.copy(_v).sub(planeVel);
    t *= _rel.length() / speed;
  }
  _v.copy(_D).addScaledVector(GRAV, -0.5 * t * t).divideScalar(t);
  return { v: _v.clone(), t };
}
function manualLaunch(p0, target, speed) {
  return _v.copy(target).sub(p0).normalize().multiplyScalar(speed).add(planeVel).clone();
}
function muzzle() { return camPos.clone().add(_p.set(0, -MUZZLE_DROP, 0)); }
// where a manual shot would land (for the orange diamond)
function predictImpact(speed) {
  const p = muzzle(), v = manualLaunch(p, aim, speed), dt = 1 / 60;
  for (let t = 0; t < 12; t += dt) {
    const py = p.y;
    v.y -= G * dt; p.addScaledVector(v, dt);
    if (p.y <= 0) { const f = py / (py - p.y); return p.addScaledVector(v, -(1 - f) * dt).setY(0); }
  }
  return null;
}

// ---------- firing ----------
function cur() { return weapons[wi]; }
function selectWeapon(i) {
  if (i === wi || state !== 'playing') return;
  wi = (i + 3) % 3; zoom = 0; switching = 0.3;
  sfx.reload(cur().id);
  buildReticle();
  updateWeaponHud(true);
}
function startReload(w) {
  if (w.reloading > 0 || w.ammo === w.mag) return;
  w.reloading = w.reload;
}
function tryFire() {
  const w = cur();
  if (switching > 0 || w.reloading > 0 || w.cool > 0) return;
  if (w.ammo <= 0) { sfx.empty(); startReload(w); return; }
  w.ammo--; w.cool = 1 / w.rate; stats.shots++;
  const p0 = muzzle();
  let vel, tof;
  if (settings.computer) { const s = solveLaunch(p0, aim, w.speed); vel = s.v; tof = s.t; }
  else { vel = manualLaunch(p0, aim, w.speed); tof = 1.5; }
  if (w.id === 'cran') { vel.x += (rand() - 0.5) * 1.6; vel.z += (rand() - 0.5) * 1.6; } // a little spray
  const idx = projPools[w.id].take();
  if (idx >= 0) projectiles.push({ w, idx, pos: p0, prev: p0.clone(), vel, t: 0, spin: rand() * 6, axis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(), hit: false });
  sfx.fire(w.id);
  if (w.id === 'pie') { sfx.whistle(tof); shake = Math.max(shake, 0.35); }
  else if (w.id === 'yam') shake = Math.max(shake, 0.12);
  if (w.ammo <= 0) startReload(w);
}

function updateWeapons(dt) {
  if (switching > 0) switching -= dt;
  for (const w of weapons) {
    if (w.cool > 0) w.cool -= dt;
    if (w.reloading > 0) {
      w.reloading -= dt;
      if (w.reloading <= 0) { w.reloading = 0; w.ammo = w.mag; if (w === cur()) sfx.reload(w.id); }
    }
  }
  const w = cur();
  if (fireQueued) { tryFire(); fireQueued = false; }
  else if (fireHeld && w.auto) tryFire();
}

// ---------- projectiles & impacts ----------
function updateProjectiles(dt) {
  const steps = 2, h = dt / steps;
  for (const p of projectiles) {
    for (let s = 0; s < steps && !p.hit; s++) {
      p.prev.copy(p.pos);
      p.vel.addScaledVector(GRAV, h);
      p.pos.addScaledVector(p.vel, h);
      p.t += h;
      if (p.pos.y <= 0) {
        const f = p.prev.y / (p.prev.y - p.pos.y);
        const hitP = p.prev.clone().lerp(p.pos, f); hitP.y = 0;
        impact(hitP, p.w); p.hit = true;
      } else if (p.pos.y < 15) {
        const b = world.hitBuilding(p.pos);
        if (b) { impact(p.pos.clone(), p.w, b); p.hit = true; }
      }
      if (p.t > 14) p.hit = true;
    }
    if (p.hit) { projPools[p.w.id].give(p.idx); continue; }
    p.spin += dt * (p.w.id === 'pie' ? 9 : 14);
    if (p.w.id === 'pie') _q.setFromEuler(_e.set(0.25, p.spin, 0));
    else _q.setFromAxisAngle(p.axis, p.spin);
    const sc = p.w.id === 'cran' ? 1 : p.w.id === 'yam' ? 1.2 : 1.6;
    _m.compose(p.pos, _q, _s.setScalar(sc));
    projPools[p.w.id].mesh.setMatrixAt(p.idx, _m);
    // trail
    if (p.t > 0.3) {
      const tc = p.w.id === 'cran' ? 0xd0283e : p.w.id === 'yam' ? 0xe08a3c : 0xfff1d6;
      particles.spawn(p.pos.x, p.pos.y, p.pos.z, 0, 0, 0, tc, p.w.id === 'pie' ? 0.8 : 0.5, p.w.id === 'pie' ? 0.4 : 0.22, 0, 0);
    }
  }
  projectiles = projectiles.filter(p => !p.hit);
  for (const k in projPools) projPools[k].mesh.instanceMatrix.needsUpdate = true;
}

const MULTI = [null, null, 'Double Gobble!', 'Triple Stuffed!', 'Gravy Train!', 'Gravy Train!'];
function impact(pt, w, building) {
  const r = w.splash;
  // A roof hit is above the street, so less of the splash reaches the ground: r_ground = √(r² − h²).
  const rg = building ? Math.sqrt(Math.max(0, r * r - pt.y * pt.y)) : r;
  let kills = 0, hits = 0;
  for (const k of turkeys) {
    if (k.dead) continue;
    const d = Math.hypot(k.pos.x - pt.x, k.pos.z - pt.z);
    if (d < rg + 0.75 * k.T.scale) {
      k.hp -= w.dmg; k.flash = 0.18; hits++;
      if (k.hp <= 0) { killTurkey(k); kills++; }
    }
  }
  for (const n of neighbors) {
    if (n.state !== 'walk') continue;
    if (Math.hypot(n.pos.x - pt.x, n.pos.z - pt.z) < rg * 0.9 + 0.5) oops(n);
  }
  if (hits) { stats.hits++; flashReticle(); }
  if (kills >= 2) {
    const bonus = 50 * kills * (kills - 1);
    score += bonus; stats.bestMulti = Math.max(stats.bestMulti, kills);
    popup(pt.clone().setY(6), `${kills >= 6 ? 'Fowl-tastrophe!' : MULTI[Math.min(kills, 5)]} +${bonus}`, 'big');
  }
  // effects
  const top = building ? pt : null;
  if (w.id === 'cran') {
    particles.burst(pt, 12, 0xa3102a, 4, 4, 0.35, 0.7);
    if (!top) addDecal(pt, 1.1 + rand() * 0.6, '#7d0c1f', 7);
    sfx.splat('cran');
  } else if (w.id === 'yam') {
    particles.burst(pt, 26, 0xe2873b, 7, 7, 0.55, 0.9);
    particles.burst(pt, 8, 0x8b4513, 6, 9, 0.7, 1.0);
    if (!top) addDecal(pt, 2.6 + rand() * 0.8, '#c8641e', 10);
    sfx.splat('yam');
    shake = Math.max(shake, 0.2);
  } else {
    particles.burst(pt, 60, 0xe07b24, 14, 12, 0.8, 1.3);
    particles.burst(pt, 30, 0xfff8ec, 6, 14, 1.0, 1.6, 0.6);
    particles.burst(pt, 24, 0xc98a3c, 12, 10, 0.7, 1.2);
    if (!top) addDecal(pt, 6.5 + rand() * 1.5, '#d9771f', 14);
    shockwave(pt, r);
    sfx.splat('pie');
    shake = Math.max(shake, 1.0);
    flash(0.18);
  }
}

function killTurkey(k) {
  k.dead = true;
  stats.sauced++; if (k.type === 'tom') stats.toms++;
  score += k.T.pts;
  popup(k.pos.clone().setY(3.5 * k.T.scale), `+${k.T.pts}`);
  particles.burst(k.pos, 22, 0x5a341c, 5, 6, 0.6, 2.2, 0.15, 1.2);   // feathers drift
  particles.burst(k.pos, 8, 0xd9a066, 4, 7, 0.5, 2.0, 0.15, 1.2);
  addDecal(k.pos, 1.3 * k.T.scale, '#8e0f22', 8);
  sfx.squawk();
}

function oops(n) {
  n.state = 'flee'; n.t = 0;
  hideRing(n.idx);
  stats.oops++;
  score = Math.max(0, score - 250);
  popup(n.pos.clone().setY(4), 'Oops! −250', 'bad');
  sfx.oops();
}

function addDecal(p, r, hex, life) {
  if (decals.length >= 240) { const old = decals.shift(); decalPool.give(old.idx); }
  const idx = decalPool.take(); if (idx < 0) return;
  const d = { idx, x: p.x, z: p.z, r, life, max: life, rot: rand() * 6.28, y: 0.06 + (idx % 40) * 0.003 };
  decals.push(d);
  decalPool.mesh.setColorAt(idx, _c.set(hex));
  decalPool.mesh.instanceColor.needsUpdate = true;
}
function updateDecals(dt) {
  for (const d of decals) {
    d.life -= dt;
    const k = d.life < 2 ? Math.max(0, d.life / 2) : 1;
    _m.compose(_p.set(d.x, d.y, d.z), _q.setFromAxisAngle(_s.set(0, 1, 0), d.rot), _s.set(d.r * k, 1, d.r * k));
    decalPool.mesh.setMatrixAt(d.idx, _m);
  }
  decals = decals.filter(d => { if (d.life <= 0) { decalPool.give(d.idx); return false; } return true; });
  decalPool.mesh.instanceMatrix.needsUpdate = true;
}
function shockwave(p, r) {
  const s = shocks.find(s => s.t >= 1) || shocks[0];
  s.t = 0; s.r = r; s.m.position.set(p.x, 0.3, p.z); s.m.visible = true;
}
function updateShocks(dt) {
  for (const s of shocks) {
    if (s.t >= 1) continue;
    s.t += dt / 0.45;
    const k = Math.min(1, s.t);
    s.m.scale.setScalar(s.r * (0.3 + 1.1 * k));
    s.m.material.opacity = 0.8 * (1 - k);
    if (s.t >= 1) s.m.visible = false;
  }
}

// ---------- turkeys & neighbors ----------
function spawnTurkey(type, lane, sOff = 0) {
  const idx = tPool.take(); if (idx < 0) return;
  const T = TT[type];
  const L = world.lanes[lane];
  const speedUp = 1 + Math.min(0.45, (wave - 1) * 0.045);
  turkeys.push({
    type, T, idx, hp: T.hp, ang: L.ang, lat0: (rand() * 2 - 1) * L.latMax, s: W.SPAWN_R + sOff,
    speed: T.speed * speedUp * (0.9 + rand() * 0.2), phase: rand() * 10, state: 'walk', peckT: 0, flash: 0,
    pos: new THREE.Vector3(), yaw: 0, feastS: W.FEAST_R + rand() * 3.5, zig: type === 'runner' ? 2.6 : 0.5, dead: false,
  });
  tPool.mesh.setColorAt(idx, T.tint);
  tPool.mesh.instanceColor.needsUpdate = true;
}

function updateTurkeys(dt, demo) {
  let feasting = 0;
  for (const k of turkeys) {
    if (k.dead) continue;
    if (k.state === 'walk') {
      if (k.type !== 'runner' && rand() < dt * 0.12) { k.state = 'peck'; k.peckT = 0.6 + rand() * 0.9; }
      k.s -= k.speed * dt;
      if (k.s <= k.feastS) {
        k.s = k.feastS; k.state = 'feast';
        if (demo) { k.dead = true; continue; }
        sfx.gobble(0.9 + rand() * 0.2, 0.14);
        if (!feastWarned) { feastWarned = true; showHint('Turkeys are eating the feast! Splat them fast!', 3); }
      }
    } else if (k.state === 'peck') {
      k.peckT -= dt; if (k.peckT <= 0) k.state = 'walk';
    } else {
      feasting++;
      feast -= k.T.drain * drainMul * dt;
    }
    const wob = k.state === 'walk' ? 1 : 0.15;
    const lat = k.lat0 + Math.sin(time * (k.type === 'runner' ? 2.2 : 0.7) + k.phase) * k.zig * wob;
    const ca = Math.cos(k.ang), sa = Math.sin(k.ang);
    k.pos.set(ca * k.s - sa * lat, 0, sa * k.s + ca * lat);
    k.yaw = Math.atan2(-ca, -sa) + Math.cos(time * (k.type === 'runner' ? 2.2 : 0.7) + k.phase) * 0.35 * wob * (k.type === 'runner' ? 1.5 : 0.6);
    const moving = k.state === 'walk';
    const ph = time * k.speed * 2.4 + k.phase;
    const bob = moving ? Math.abs(Math.sin(ph)) * 0.16 : 0;
    const roll = moving ? Math.sin(ph) * 0.13 : 0;
    const pitch = moving ? 0 : Math.max(0, Math.sin(time * 7 + k.phase)) * 0.55;
    _q.setFromEuler(_e.set(pitch, k.yaw, roll, 'YXZ'));
    _m.compose(_p.set(k.pos.x, bob * k.T.scale, k.pos.z), _q, _s.setScalar(k.T.scale));
    tPool.mesh.setMatrixAt(k.idx, _m);
    if (k.flash > 0) {
      k.flash -= dt;
      const base = k.type === 'tom' ? _c.copy(k.T.tint).lerp(RED, 0.5 * (1 - k.hp / k.T.hp)) : _c.copy(k.T.tint);
      tPool.mesh.setColorAt(k.idx, k.flash > 0 ? base.lerp(RED, k.flash / 0.18) : base);
      tPool.mesh.instanceColor.needsUpdate = true;
    }
  }
  turkeys = turkeys.filter(k => { if (k.dead) { tPool.give(k.idx); return false; } return true; });
  tPool.mesh.instanceMatrix.needsUpdate = true;
  return feasting;
}

function spawnNeighbor() {
  const idx = nPool.take(); if (idx < 0) return;
  const h = world.houses[(rand() * world.houses.length) | 0];
  neighbors.push({ idx, ang: h.roadAng, s: h.s, lat: h.side * 2.6, speed: 2.0 + rand() * 0.6, state: 'walk', t: 0, phase: rand() * 10, pos: new THREE.Vector3() });
  nPool.mesh.setColorAt(idx, _c.setHSL(rand(), 0.15, 0.95));
  nPool.mesh.instanceColor.needsUpdate = true;
}
function updateNeighbors(dt) {
  for (const n of neighbors) {
    n.t += dt;
    if (n.state === 'walk') {
      n.s -= n.speed * dt;
      if (n.s <= W.DELIVER_R) {
        n.state = 'done'; stats.delivered++; score += 75;
        popup(n.pos.clone().setY(4), 'Pie delivered! +75'); sfx.deliver();
      }
    } else if (n.state === 'flee') {
      n.s += 5.5 * dt;
      if (n.t > 3.5) n.state = 'done';
    }
    const ca = Math.cos(n.ang), sa = Math.sin(n.ang);
    n.pos.set(ca * n.s - sa * n.lat, 0, sa * n.s + ca * n.lat);
    const dirSign = n.state === 'flee' ? 1 : -1;
    const yaw = Math.atan2(ca * dirSign, sa * dirSign);
    const ph = time * (n.state === 'flee' ? 14 : 8) + n.phase;
    _q.setFromEuler(_e.set(0, yaw, Math.sin(ph) * 0.06, 'YXZ'));
    _m.compose(_p.set(n.pos.x, Math.abs(Math.sin(ph)) * 0.1, n.pos.z), _q, _s.setScalar(1.25));
    nPool.mesh.setMatrixAt(n.idx, _m);
    if (n.state === 'walk') {
      _m.compose(_p.set(n.pos.x, 0.12, n.pos.z), _q.identity(), _s.setScalar(1 + Math.sin(time * 4 + n.phase) * 0.08));
      ringPool.mesh.setMatrixAt(n.idx, _m);
    }
  }
  neighbors = neighbors.filter(n => { if (n.state === 'done') { nPool.give(n.idx); hideRing(n.idx); return false; } return true; });
  nPool.mesh.instanceMatrix.needsUpdate = true;
  ringPool.mesh.instanceMatrix.needsUpdate = true;
}

// ---------- waves ----------
function startWave(n) {
  wave = n;
  const count = 8 + 5 * (n - 1);
  const runners = n >= 2 ? Math.floor(count * Math.min(0.35, 0.1 * n)) : 0;
  const toms = n >= 3 ? 1 + Math.floor((n - 3) * 0.75) : 0;
  spawnQueue = [];
  for (let i = 0; i < count - runners - toms; i++) spawnQueue.push('turkey');
  for (let i = 0; i < runners; i++) spawnQueue.push('runner');
  for (let i = 0; i < toms; i++) spawnQueue.push('tom');
  for (let i = spawnQueue.length - 1; i > 0; i--) { const j = (rand() * (i + 1)) | 0; [spawnQueue[i], spawnQueue[j]] = [spawnQueue[j], spawnQueue[i]]; }
  spawnTimer = 2.5; neighborsLeft = 2 + Math.floor(n * 1.3); neighborTimer = 3 + rand() * 4;
  waveActive = true; feastWarned = false;
  banner(`Wave ${n}`, n === 1 ? 'Here they come!' : toms && n === 3 ? 'Watch out for Big Toms!' : runners && n === 2 ? 'Some of these birds are fast!' : `${count} gobblers incoming`);
  sfx.bell();
}
function updateWave(dt) {
  if (!waveActive) {
    if (waveTimer > 0) { waveTimer -= dt; if (waveTimer <= 0) startWave(wave + 1); }
    return;
  }
  spawnTimer -= dt;
  if (spawnTimer <= 0 && spawnQueue.length) {
    const lane = (rand() * world.lanes.length) | 0;
    const g = Math.min(spawnQueue.length, 1 + ((rand() * Math.min(4, 1 + wave / 2)) | 0));
    for (let i = 0; i < g; i++) spawnTurkey(spawnQueue.pop(), lane, i * 2.8 + rand() * 1.5);
    spawnTimer = Math.max(0.5, 1.6 - wave * 0.1) * g * (0.7 + rand() * 0.6);
  }
  if (neighborsLeft > 0) {
    neighborTimer -= dt;
    if (neighborTimer <= 0) { spawnNeighbor(); neighborsLeft--; neighborTimer = 5 + rand() * 7; }
  }
  if (!spawnQueue.length && !turkeys.length) waveCleared();
}
function waveCleared() {
  waveActive = false;
  const bonus = 250 * wave + Math.round(feast) * 3;
  score += bonus;
  sfx.pick();
  banner('Feast saved!', `Wave ${wave} bonus +${bonus}`);
  setTimeout(() => { if (state === 'playing') showUpgrades(bonus); }, 1800);
}

// ---------- upgrades ----------
const UPGRADES = [
  { id: 'rate', e: '🍒', name: 'Extra Tart', desc: 'Cranberries fire 25% faster', apply: () => { weapons[0].rate *= 1.25; } },
  { id: 'bowl', e: '🥣', name: 'Bigger Bowl', desc: '+20 cranberries before a refill', apply: () => { weapons[0].mag += 20; weapons[0].ammo = weapons[0].mag; } },
  { id: 'sauce', e: '🫙', name: 'Thick Sauce', desc: 'Cranberries hit twice as hard', once: true, apply: () => { weapons[0].dmg *= 2; } },
  { id: 'candied', e: '🍠', name: 'Candied Yams', desc: '+2 sweet potatoes per load', apply: () => { weapons[1].mag += 2; weapons[1].ammo = weapons[1].mag; } },
  { id: 'mash', e: '🥔', name: 'Extra Mashed', desc: 'Sweet potato splat 30% wider', apply: () => { weapons[1].splash *= 1.3; } },
  { id: 'oven', e: '🔥', name: 'Convection Oven', desc: 'Pies bake 25% faster', apply: () => { weapons[2].reload *= 0.75; } },
  { id: 'deep', e: '🥧', name: 'Deep Dish', desc: 'Pie splat 25% wider', apply: () => { weapons[2].splash *= 1.25; } },
  { id: 'left', e: '🍗', name: 'Leftovers', desc: 'Refill the feast by 35', apply: () => { feast = Math.min(100, feast + 35); } },
  { id: 'gravy', e: '🥘', name: 'Gravy Moat', desc: 'Turkeys eat 30% slower', apply: () => { drainMul *= 0.7; } },
];
let upgChoices = [];
function showUpgrades(bonus) {
  state = 'upgrade';
  fireHeld = false;
  if (document.pointerLockElement) document.exitPointerLock();
  const pool = UPGRADES.filter(u => !(u.once && picked[u.id]) && !(u.id === 'left' && feast > 92));
  const out = [];
  if (feast < 60) { const l = pool.find(u => u.id === 'left'); if (l) out.push(l); }
  while (out.length < 3 && pool.length) { const u = pool.splice((rand() * pool.length) | 0, 1)[0]; if (!out.includes(u)) out.push(u); }
  upgChoices = out;
  $('banner').classList.remove('show'); bannerTimer = 0;
  $('upTitle').textContent = `Wave ${wave} cleared!`;
  $('upSub').textContent = `Feast left: ${Math.round(feast)}%  •  Score ${score.toLocaleString()}`;
  $('upgList').innerHTML = out.map((u, i) => `<button class="upg" data-i="${i}"><div class="e">${u.e}</div><b>${u.name}</b><small>${u.desc}</small><br><kbd>${i + 1}</kbd></button>`).join('');
  $('upgList').querySelectorAll('.upg').forEach(b => b.onclick = () => chooseUpgrade(+b.dataset.i));
  showScreen('upgrade');
}
function chooseUpgrade(i) {
  const u = upgChoices[i]; if (!u || state !== 'upgrade') return;
  u.apply(); picked[u.id] = true;
  feast = Math.min(100, feast + 10);
  setDishes();
  sfx.pick();
  showScreen(null);
  state = 'playing';
  lockPointer();
  waveTimer = 2.5;
  buildWeaponHud();
}

// ---------- HUD ----------
function buildWeaponHud() {
  $('weapons').innerHTML = weapons.map((w, i) => `<button class="wslot" data-i="${i}"><span class="k">${w.key}</span><span class="n">${w.name}</span><span class="a"><span class="bar"><i></i></span><span class="c"></span></span></button>`).join('');
  $('weapons').querySelectorAll('.wslot').forEach(b => {
    b.addEventListener('pointerdown', e => { e.stopPropagation(); selectWeapon(+b.dataset.i); });
  });
  buildReticle();
  updateWeaponHud(true);
}
let hudCache = '';
function updateWeaponHud(force) {
  const key = weapons.map(w => `${w.ammo}|${Math.ceil(w.reloading * 10)}|${w.mag}`).join(',') + wi;
  if (!force && key === hudCache) return;
  hudCache = key;
  $('weapons').querySelectorAll('.wslot').forEach((b, i) => {
    const w = weapons[i];
    b.classList.toggle('on', i === wi);
    b.classList.toggle('reloading', w.reloading > 0);
    const frac = w.reloading > 0 ? 1 - w.reloading / w.reload : w.ammo / w.mag;
    b.querySelector('.bar i').style.width = `${(frac * 100).toFixed(0)}%`;
    b.querySelector('.c').textContent = w.reloading > 0 ? `${w.word} ${w.reloading.toFixed(1)}s` : w.mag === 1 ? 'READY' : `${w.ammo}/${w.mag}`;
  });
}
function buildReticle() {
  const id = cur().id, c = '#ffe9c2', st = `stroke="${c}" stroke-width="2" fill="none"`;
  let svg;
  if (id === 'cran') svg = `<svg width="80" height="80" viewBox="-40 -40 80 80"><path ${st} d="M-30 0H-9M9 0H30M0 -30V-9M0 9V30"/><circle r="2" fill="${c}"/></svg>`;
  else if (id === 'yam') svg = `<svg width="120" height="120" viewBox="-60 -60 120 120"><path ${st} d="M-40 -28V-40H-28M28 -40H40V-28M40 28V40H28M-28 40H-40V28M-14 0H-5M5 0H14M0 -14V-5M0 5V14"/></svg>`;
  else svg = `<svg width="160" height="160" viewBox="-80 -80 160 160"><path ${st} d="M-80 0H-50M50 0H80M0 -80V-50M0 50V80M-6 0H6M0 -6V6"/><path ${st} stroke-width="3" d="M-24 -24L-16 -16M24 -24L16 -16M-24 24L-16 16M24 24L16 16"/></svg>`;
  $('reticle').innerHTML = svg;
}
let reticleTimer = 0;
function flashReticle() { $('reticle').classList.add('hit'); reticleTimer = 0.12; }
let flashV = 0;
function flash(v) { flashV = Math.max(flashV, v); }

function popup(pos, text, cls = '') {
  const el = document.createElement('div');
  el.className = 'pop ' + cls; el.textContent = text;
  $('popups').appendChild(el);
  popups.push({ el, pos, life: cls === 'big' ? 1.6 : 1.1, max: cls === 'big' ? 1.6 : 1.1 });
}
function updatePopups(dt) {
  const w = innerWidth, h = innerHeight;
  for (const p of popups) {
    p.life -= dt;
    p.pos.y += dt * 4;
    _p.copy(p.pos).project(camera);
    if (_p.z > 1) { p.el.style.display = 'none'; continue; }
    p.el.style.display = '';
    p.el.style.left = `${(_p.x * 0.5 + 0.5) * w}px`;
    p.el.style.top = `${(-_p.y * 0.5 + 0.5) * h}px`;
    p.el.style.opacity = Math.min(1, p.life / p.max * 2.5);
  }
  popups = popups.filter(p => { if (p.life <= 0) { p.el.remove(); return false; } return true; });
}
let bannerTimer = 0;
function banner(t, s) {
  $('banner').querySelector('.t').textContent = t;
  $('banner').querySelector('.s').textContent = s || '';
  $('banner').classList.add('show');
  bannerTimer = 2.6;
}
let hintTimer = 0;
function showHint(text, secs) { $('hint').textContent = text; $('hint').hidden = false; hintTimer = secs; }

function setDishes() {
  world.dishes.count = Math.max(0, Math.ceil(world.dishTotal * clamp(feast, 0, 100) / 100));
}

const radar = $('radar'), rctx = radar.getContext('2d');
function drawRadar() {
  const S = radar.width, c = S / 2, k = (c - 10) / W.AIM_R;
  rctx.clearRect(0, 0, S, S);
  rctx.fillStyle = 'rgba(40, 22, 12, 0.6)';
  rctx.beginPath(); rctx.arc(c, c, c - 2, 0, 6.283); rctx.fill();
  rctx.strokeStyle = 'rgba(255, 233, 194, 0.5)'; rctx.lineWidth = 3; rctx.stroke();
  // rotate so the camera's view points up
  const fx = aim.x - camPos.x, fz = aim.z - camPos.z, fl = Math.hypot(fx, fz) || 1;
  const f = [fx / fl, fz / fl], rt = [-f[1], f[0]];
  const map = (x, z) => [c - (x * rt[0] + z * rt[1]) * k, c - (x * f[0] + z * f[1]) * k];
  rctx.strokeStyle = 'rgba(160, 120, 80, 0.7)'; rctx.lineWidth = 6;
  for (const a of world.roadAngles) { const [x1, y1] = map(Math.cos(a) * 20, Math.sin(a) * 20), [x2, y2] = map(Math.cos(a) * 195, Math.sin(a) * 195); rctx.beginPath(); rctx.moveTo(x1, y1); rctx.lineTo(x2, y2); rctx.stroke(); }
  rctx.fillStyle = '#f2b544'; rctx.beginPath(); rctx.arc(c, c, 10, 0, 6.283); rctx.fill();
  for (const t of turkeys) {
    const [x, y] = map(t.pos.x, t.pos.z);
    rctx.fillStyle = t.state === 'feast' ? (Math.sin(time * 12) > 0 ? '#ff3030' : '#ffd0d0') : t.type === 'tom' ? '#ff7a3a' : '#e5484d';
    rctx.beginPath(); rctx.arc(x, y, t.type === 'tom' ? 7 : 4.5, 0, 6.283); rctx.fill();
  }
  rctx.fillStyle = '#7cc6ff';
  for (const n of neighbors) if (n.state === 'walk') { const [x, y] = map(n.pos.x, n.pos.z); rctx.fillRect(x - 4, y - 4, 8, 8); }
  const [ax, ay] = map(aim.x, aim.z);
  rctx.strokeStyle = '#ffe9c2'; rctx.lineWidth = 3;
  rctx.beginPath(); rctx.moveTo(ax - 9, ay); rctx.lineTo(ax + 9, ay); rctx.moveTo(ax, ay - 9); rctx.lineTo(ax, ay + 9); rctx.stroke();
  const [px, py] = map(planePos.x, planePos.z);
  rctx.fillStyle = '#fff'; rctx.beginPath(); rctx.arc(px, py, 6, 0, 6.283); rctx.fill();
}

let readoutTimer = 0;
function updateHud(dt) {
  const w = cur();
  updateWeaponHud(false);
  $('waveLbl').textContent = waveActive || wave ? `WAVE ${wave}` : 'GET READY';
  const left = spawnQueue.length + turkeys.length;
  $('leftLbl').textContent = waveActive ? `${left} gobbler${left === 1 ? '' : 's'} left` : '';
  $('score').textContent = score.toLocaleString();
  $('best').textContent = best ? `BEST ${best.toLocaleString()}` : '';
  $('feastFill').style.width = `${clamp(feast, 0, 100)}%`;
  const eating = turkeys.some(t => t.state === 'feast');
  $('feast').classList.toggle('danger', eating || feast < 30);
  $('feastLbl').textContent = eating ? 'TURKEYS AT THE TABLE!' : `THE FEAST ${Math.max(0, Math.round(feast))}%`;
  $('switching').hidden = !(switching > 0 || w.reloading > 0);
  $('switching').textContent = switching > 0 ? `LOADING ${w.name}` : `${w.word}…`;
  // splash ring: the splat radius drawn to scale at the aim point
  const dist = camPos.distanceTo(aim);
  const px = (w.splash / dist) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (innerHeight / 2);
  const ring = $('ring'); ring.style.width = ring.style.height = `${(px * 2).toFixed(0)}px`;
  // manual mode: where it will actually land
  const pip = $('pipper');
  if (!settings.computer) {
    const hit = predictImpact(w.speed);
    if (hit) {
      _p.copy(hit).project(camera);
      pip.hidden = false;
      const x = (_p.x * 0.5 + 0.5) * innerWidth, y = (-_p.y * 0.5 + 0.5) * innerHeight;
      const cx = clamp(x, 24, innerWidth - 24), cy = clamp(y, 24, innerHeight - 24);
      pip.classList.toggle('edge', cx !== x || cy !== y || _p.z > 1);
      pip.style.left = `${cx}px`;
      pip.style.top = `${cy}px`;
    } else pip.hidden = true;
  } else pip.hidden = true;
  readoutTimer -= dt;
  if (readoutTimer <= 0) {
    readoutTimer = 0.15;
    const sol = solveLaunch(muzzle(), aim, w.speed);
    $('readout').innerHTML = `GRAVY BOAT   ALT <b>${ORBIT_H} m</b>  SPD <b>${PLANE_V} m/s</b>  BANK <b>${THREE.MathUtils.radToDeg(BANK).toFixed(0)}°</b>\n` +
      `RANGE <b>${dist.toFixed(0)} m</b>  LAUNCH <b>${w.speed} m/s</b>  FALL TIME <b>${sol.t.toFixed(1)} s</b>\n` +
      `A turkey walks about <b>${(3 * sol.t).toFixed(0)} m</b> before your ${w.id === 'pie' ? 'pie' : w.id === 'yam' ? 'potato' : 'berry'} lands\n` +
      `<span id="computer" class="${settings.computer ? '' : 'off'}">BALLISTIC COMPUTER ${settings.computer ? 'ON' : 'OFF'}</span>   ZOOM ${zoom ? '2×' : '1×'}   g = 10 m/s²`;
  }
  if (reticleTimer > 0) { reticleTimer -= dt; if (reticleTimer <= 0) $('reticle').classList.remove('hit'); }
  if (bannerTimer > 0) { bannerTimer -= dt; if (bannerTimer <= 0) $('banner').classList.remove('show'); }
  if (hintTimer > 0) { hintTimer -= dt; if (hintTimer <= 0) $('hint').hidden = true; }
}

// ---------- screens ----------
const SCREENS = ['title', 'how', 'pause', 'upgrade', 'over'];
function showScreen(name) {
  for (const s of SCREENS) $(s).hidden = s !== name;
  $('hud').hidden = !(state === 'playing' || state === 'paused' || state === 'upgrade');
  $('back').hidden = !(name === 'title' || name === 'how');
}
function toTitle() {
  state = 'title';
  resetGame();
  if (document.pointerLockElement) document.exitPointerLock();
  $('hud').hidden = true;
  sfx.setDrone(0.02);
  $('bestLine').textContent = best ? `Best score: ${best.toLocaleString()}` : '';
  showScreen('title');
}
function startGame() {
  sfx.init(); sfx.setDrone(0.05);
  resetGame();
  state = 'playing';
  showScreen(null);
  $('touch').hidden = !TOUCH;
  $('flash').style.opacity = 0;
  lockPointer();
  waveTimer = 0; wave = 0;
  startWave(1);
  showHint(TOUCH ? 'Drag to look • hold FIRE • tap a food to switch' : 'Move the mouse to look • click to drop food • 1 2 3 to switch', 5);
  perf.reset();
}
function pause() {
  if (state !== 'playing') return;
  state = 'paused'; fireHeld = false;
  showScreen('pause');
  $('hud').hidden = false;
}
function resume() {
  if (state !== 'paused') return;
  state = 'playing';
  showScreen(null);
  lockPointer();
}
function gameOver() {
  state = 'over'; fireHeld = false;
  if (document.pointerLockElement) document.exitPointerLock();
  sfx.sadTrombone();
  const newBest = score > best;
  if (newBest) { best = score; try { localStorage.setItem('tg_best', best); } catch (e) { } }
  const acc = stats.shots ? Math.round(100 * stats.hits / stats.shots) : 0;
  $('overStats').innerHTML = [
    ['Score', score.toLocaleString()], ['Waves survived', waveActive ? wave - 1 : wave], ['Turkeys sauced', stats.sauced], ['Big Toms', stats.toms],
    ['Best multi-splat', stats.bestMulti || '—'], ['Shots that hit', `${acc}%`], ['Pies delivered', stats.delivered], ['Neighbors splatted', stats.oops],
  ].map(([a, b]) => `<span>${a}</span><b>${b}</b>`).join('');
  $('overBest').textContent = newBest ? '🏆 New best score!' : `Best: ${best.toLocaleString()}`;
  showScreen('over');
  $('hud').hidden = true;
}

function lockPointer() {
  if (TOUCH || !canvas.requestPointerLock) return;
  try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (e) { }
}

// settings toggles
function renderSettings() {
  const defs = [
    ['sound', () => `Sound: ${settings.sound ? 'On' : 'Off'}`, () => { settings.sound = !settings.sound; sfx.setSound(settings.sound); }],
    ['music', () => `Music: ${settings.music ? 'On' : 'Off'}`, () => { settings.music = !settings.music; sfx.setMusic(settings.music); }],
    ['computer', () => `Ballistic computer: ${settings.computer ? 'On' : 'Off (hard)'}`, () => { settings.computer = !settings.computer; }],
    ['quality', () => `Graphics: ${settings.quality === 'high' ? 'Fancy' : 'Fast'}`, () => { settings.quality = settings.quality === 'high' ? 'low' : 'high'; applyQuality(); }],
    ['sens', () => `Aim speed: ${SENS_NAMES[Math.max(0, SENS.indexOf(settings.sens))] || 'Normal'}`, () => { settings.sens = SENS[(SENS.indexOf(settings.sens) + 1) % SENS.length]; }],
    ['invert', () => `Invert look: ${settings.invert ? 'On' : 'Off'}`, () => { settings.invert = !settings.invert; }],
  ];
  for (const host of [$('settingsTitle'), $('settingsPause')]) {
    host.innerHTML = '';
    for (const [k, label, act] of defs) {
      const b = document.createElement('button');
      b.className = 'tog' + (settings[k] === true || settings[k] === 'high' ? ' on' : '');
      b.textContent = label();
      b.onclick = () => { sfx.init(); act(); saveSettings(); renderSettings(); };
      host.appendChild(b);
    }
  }
}
$('controlsList').innerHTML = (TOUCH ? [
  ['Drag', 'look around'], ['FIRE', 'drop food (hold for cranberries)'], ['ZOOM', 'zoom in and out'], ['Tap a food', 'switch food'],
] : [
  ['Mouse', 'look around'], ['Left click', 'drop food (hold for cranberries)'], ['Right click / Z', 'zoom'], ['1 2 3 / wheel', 'switch food'],
  ['R', 'reload'], ['W A S D', 'look with keys'], ['Esc / P', 'pause'], ['M', 'mute'],
]).map(([k, d]) => `<kbd>${k}</kbd><span>${d}</span>`).join('');

$('playBtn').onclick = startGame;
$('howBtn').onclick = () => showScreen('how');
$('howBack').onclick = () => showScreen('title');
$('resumeBtn').onclick = resume;
$('restartBtn').onclick = startGame;
$('quitBtn').onclick = toTitle;
$('againBtn').onclick = startGame;
$('overMenuBtn').onclick = toTitle;
$('pauseBtn').addEventListener('pointerdown', e => { e.stopPropagation(); pause(); });

// ---------- input ----------
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && state === 'playing') pause();
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', e => {
  if (state !== 'playing' || performance.now() - lastTouch < 1000) return;
  if (!document.pointerLockElement) lockPointer();
  if (e.button === 0) { fireHeld = true; fireQueued = true; }
  if (e.button === 2) zoom = 1 - zoom;
});
addEventListener('mouseup', e => { if (e.button === 0) fireHeld = false; });
addEventListener('mousemove', e => {
  if (state !== 'playing' || performance.now() - lastTouch < 1000) return;
  if (document.pointerLockElement || e.buttons) rotateAim(capPx(e.movementX) * lookSens(), capPx(e.movementY) * lookSens());
});
addEventListener('wheel', e => { if (state === 'playing') selectWeapon(wi + (e.deltaY > 0 ? 1 : -1)); }, { passive: true });
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (state === 'upgrade' && /^Digit[123]$/.test(e.code)) { chooseUpgrade(+e.code.slice(5) - 1); return; }
  if (state === 'paused' && (e.code === 'KeyP' || e.code === 'Escape')) { resume(); return; }
  if (state !== 'playing') return;
  if (/^Digit[123]$/.test(e.code)) selectWeapon(+e.code.slice(5) - 1);
  else if (e.code === 'KeyQ') selectWeapon(wi - 1);
  else if (e.code === 'KeyE' || e.code === 'Tab') { e.preventDefault(); selectWeapon(wi + 1); }
  else if (e.code === 'KeyZ' || e.code === 'ShiftLeft') zoom = 1 - zoom;
  else if (e.code === 'KeyR') startReload(cur());
  else if (e.code === 'KeyP') pause();
  else if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) fireQueued = true; fireHeld = true; }
  else if (e.code === 'KeyM') { settings.sound = !settings.sound; sfx.setSound(settings.sound); saveSettings(); renderSettings(); }
});
addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'Space') fireHeld = false; });
addEventListener('blur', () => { fireHeld = false; for (const k in keys) keys[k] = false; if (state === 'playing') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); });

// touch: drag anywhere to look, buttons to fire and zoom
let dragId = null, dragX = 0, dragY = 0;
addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') { lastTouch = performance.now(); if (state === 'playing') $('touch').hidden = false; }
}, true);
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch' || state !== 'playing') return;
  if (dragId === null) { dragId = e.pointerId; dragX = e.clientX; dragY = e.clientY; }
});
addEventListener('pointermove', e => {
  if (e.pointerId !== dragId) return;
  const s = 0.0026 * settings.sens * (camera.fov / 50);
  rotateAim((e.clientX - dragX) * s, (e.clientY - dragY) * s);
  dragX = e.clientX; dragY = e.clientY;
});
const endDrag = e => { if (e.pointerId === dragId) dragId = null; };
addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
$('tFire').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); fireHeld = true; fireQueued = true; });
$('tFire').addEventListener('pointerup', () => { fireHeld = false; });
$('tFire').addEventListener('pointercancel', () => { fireHeld = false; });
$('tZoom').addEventListener('pointerdown', e => { e.stopPropagation(); zoom = 1 - zoom; });

// ---------- auto graphics: drop to Fast if the first seconds run slow ----------
const perf = {
  t: 0, frames: 0, done: false,
  reset() { this.t = 0; this.frames = 0; this.done = false; },
  tick(dt) {
    if (this.done || settings.quality !== 'high') return;
    this.t += dt; this.frames++;
    if (this.t > 5) {
      this.done = true;
      if (this.frames / this.t < 28) { settings.quality = 'low'; saveSettings(); applyQuality(); renderSettings(); showHint('Switched to Fast graphics to keep things smooth', 3); }
    }
  },
};

let ghost = null;
function setPlaneGhost(on) {
  if (ghost === on) return;
  ghost = on;
  world.plane.traverse(m => { if (m.isMesh && m.castShadow) { m.material.colorWrite = !on; m.material.depthWrite = !on; } else if (m.isMesh) m.visible = !on; });
}

// ---------- main loop ----------
let last = performance.now(), demoTimer = 0, lastDish = -1;
function frame(now) {
  requestAnimationFrame(frame);
  const rdt = Math.min(0.05, (now - last) / 1000); last = now;
  const running = state === 'playing';
  const dt = running || state === 'title' ? rdt : 0;
  time += dt;
  updatePlane(dt);
  world.vane.rotation.y = Math.sin(time * 0.3) * 1.2;

  if (state === 'title') {
    // cinematic orbit with turkeys parading in
    const a = time * 0.06;
    camera.position.set(Math.cos(a) * 250, 120, Math.sin(a) * 250);
    camera.lookAt(0, 8, 0);
    if (camera.fov !== 45) { camera.fov = 45; camera.updateProjectionMatrix(); updateScale(); }
    setPlaneGhost(false);
    demoTimer -= dt;
    if (demoTimer <= 0 && turkeys.length < 30) { spawnTurkey(rand() < 0.15 ? 'runner' : rand() < 0.1 ? 'tom' : 'turkey', (rand() * world.lanes.length) | 0, -40 - rand() * 60); demoTimer = 0.7; }
    updateTurkeys(dt, true);
  } else {
    setPlaneGhost(true);
    camPos.copy(planePos);
    if (running) {
      perf.tick(rdt);
      // keyboard look
      const ks = 1.0 * settings.sens * dt * (camera.fov / 50);
      const kx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
      const ky = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
      if (kx || ky) rotateAim(kx * ks, ky * ks);
      smoothAim(rdt);
      updateWeapons(dt);
      updateProjectiles(dt);
      const eating = updateTurkeys(dt);
      updateNeighbors(dt);
      updateWave(dt);
      updateDecals(dt);
      updateShocks(dt);
      // ambient sounds
      gobbleTimer -= dt;
      if (gobbleTimer <= 0 && turkeys.length) { sfx.gobble(0.85 + rand() * 0.35, 0.06); gobbleTimer = 1.2 + rand() * 2.5; }
      if (eating) { munchTimer -= dt; if (munchTimer <= 0) { sfx.munch(); munchTimer = 0.9; } }
      const dishNow = Math.ceil(world.dishTotal * clamp(feast, 0, 100) / 100);
      if (dishNow !== lastDish) { lastDish = dishNow; setDishes(); }
      if (feast <= 0) { feast = 0; gameOver(); }
    }
    // camera: sits in the gun port, looks at the locked ground point
    const sh = shake * (matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.3 : 1);
    camera.position.copy(camPos).add(_p.set((rand() - 0.5) * sh, (rand() - 0.5) * sh, (rand() - 0.5) * sh));
    camera.position.y += Math.sin(time * 0.7) * 0.4;
    camera.lookAt(aim);
    shake *= Math.exp(-7 * rdt);
    const targetFov = cur().fov[zoom];
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, rdt * 10);
      camera.updateProjectionMatrix(); updateScale();
    }
    if (state !== 'over') { updateHud(rdt); drawRadar(); }
  }
  if (dt > 0) particles.update(dt);
  updatePopups(dt);
  if (flashV > 0) { $('flash').style.opacity = flashV; flashV = Math.max(0, flashV - rdt * 1.5); }
  // the sun's shadow box follows nothing: it already covers the town
  renderer.render(scene, camera);
}

// ---------- boot ----------
resetGame();
applyQuality();
renderSettings();
$('loading').hidden = true;
toTitle();
document.addEventListener('pointerdown', () => sfx.init(), { once: true });
requestAnimationFrame(frame);

// hooks for automated testing
window.TG = {
  get state() { return state; }, get turkeys() { return turkeys; }, get neighbors() { return neighbors; }, get projectiles() { return projectiles; },
  get feast() { return feast; }, set feast(v) { feast = v; }, get score() { return score; }, get wave() { return wave; }, get stats() { return stats; },
  aim, aimGoal, camPos, planeVel, startGame, pause, resume, selectWeapon, tryFire, solveLaunch, settings,
  fireAt(x, z) { aim.set(x, 0, z); aimGoal.set(x, 0, z); cur().cool = 0; cur().reloading = 0; if (cur().ammo <= 0) cur().ammo = cur().mag; switching = 0; tryFire(); },
  clearWave() { spawnQueue = []; for (const t of turkeys) t.dead = true; },
  spawn(type = 'turkey', lane = 0, s = 0) { spawnTurkey(type, lane, s); }, spawnNeighbor,
};

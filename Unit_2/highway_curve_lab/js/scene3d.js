// Highway Curve Lab — the 3D off-ramp (Three.js, vendored in assets/vendor/three.min.js) with a flat 2D canvas fallback
// for Chromebooks that cannot make a WebGL context. Both draw the same world from the same state.
// Map coordinates (X, Y) are meters seen from above: the curve's center is at (0, 0). The car comes up the entry straight
// at X = r, turns left (counterclockwise) through 90°, and leaves along Y = r. World: x = X, y = up, z = −Y.
// Blue arrow = velocity (along the tangent). Rose arrow = friction from the road (toward the center). Purple = the radius.
// The instruments live in the SVG layer drawn by scene.js; this file only reports what the car is doing through onFrame.

(function () {
  const PALETTE = {
    dry: { road: 0x3b4252, rough: 0.92, metal: 0, sky: 0xa7d8ff, fog: 0xcfe9ff, ground: 0x6aa84f, light: 1.0, fx: null },
    damp: { road: 0x2c3442, rough: 0.45, metal: 0.05, sky: 0x9fb2c4, fog: 0xb6c3cf, ground: 0x5c8a4a, light: 0.85, fx: 'rain', n: 260 },
    wet: { road: 0x1e2633, rough: 0.18, metal: 0.15, sky: 0x7f8b97, fog: 0x98a3ad, ground: 0x4f7a42, light: 0.7, fx: 'rain', n: 700 },
    gravel: { road: 0x8a7a63, rough: 1, metal: 0, sky: 0xc9dceb, fog: 0xd8e3ea, ground: 0x7a9a55, light: 1.0, fx: null },
    snow: { road: 0xdfe7ef, rough: 0.8, metal: 0, sky: 0xc5ced8, fog: 0xdde3ea, ground: 0xf1f5f9, light: 0.9, fx: 'snow', n: 500 },
    icy: { road: 0xb9e1f5, rough: 0.08, metal: 0.2, sky: 0xc9d4e0, fog: 0xdfe6ee, ground: 0xeef3f8, light: 0.95, fx: 'snow', n: 380 },
    glare: { road: 0xd6f1ff, rough: 0.04, metal: 0.25, sky: 0xd2dde8, fog: 0xe4ebf2, ground: 0xf3f7fb, light: 1.0, fx: null }
  };
  const ROAD_HALF = 4.5, SHOULDER = 2.5;
  const rad = d => (d * Math.PI) / 180;
  const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ?fast on localhost speeds up every drive, for automated play-throughs
  const FAST = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]fast\b/.test(location.search) ? 6 : 1;

  // ---------- Shared state ----------
  const S = {
    r: 50, surf: 'dry', veh: 'car', lane: 'outer', bank: 0, ice: null, cam: '3d', labelR: true,
    car: { X: 50, Y: -30, psi: 90 }, showV: false, showF: false, slipping: false, hazard: false, hop: 0,
    run: null, skid: [], tangent: null, host: null, area: null, gl: null, flat: null, raf: 0, last: 0, dirty: true, visible: false
  };
  // Lead-in and run-out: long enough to see the car on the straight, short enough that the 3D view can stay close on big curves
  const entryLen = () => 12 + S.r * 0.25;
  const exitLen = () => 12 + S.r * 0.25;
  // Two lanes, each ROAD_HALF wide. r is the radius of the outer lane, where the car normally drives (it keeps right,
  // and on a left-hand curve the right lane is the outer one). The road's center line is half a lane inside it.
  const LANE = ROAD_HALF;
  const roadC = () => S.r - LANE / 2;
  const pathR = () => (S.lane === 'inner' ? S.r - LANE : S.r);
  const railR = () => roadC() + ROAD_HALF + SHOULDER;

  // Where the car is after driving s meters along the road (it never leaves the road here)
  function pose(s) {
    const R = pathR(), L0 = entryLen(), arc = (Math.PI / 2) * R;
    if (s <= L0) return { X: R, Y: -L0 + s, psi: 90, phi: null, seg: 'entry' };
    if (s <= L0 + arc) { const p = (s - L0) / R; return { X: R * Math.cos(p), Y: R * Math.sin(p), psi: (p * 180) / Math.PI + 90, phi: (p * 180) / Math.PI, seg: 'turn' }; }
    return { X: -(s - L0 - arc), Y: R, psi: 180, phi: 90, seg: 'exit' };
  }
  const atPhi = phi => ({ X: pathR() * Math.cos(rad(phi)), Y: pathR() * Math.sin(rad(phi)), psi: phi + 90 });

  // ---------- Runs ----------
  // o = { v, slipAt (degrees into the curve, or null when the tires hold), onFrame(info), onDone(result) }
  function run(o) {
    stopRun();
    const L0 = entryLen(), arc = (Math.PI / 2) * pathR();
    let total;
    if (o.slipAt === null || o.slipAt === undefined) total = L0 + arc + exitLen();
    else total = L0 + rad(o.slipAt) * pathR() + Math.sqrt(railR() ** 2 - pathR() ** 2) - 2.2;
    // On-screen speed is the real speed sped up by the same factor every time, so twice as fast looks twice as fast.
    // The factor grows with the curve's size, so a drive takes about as long on any student's off-ramp.
    // Only very slow drives are capped (at 8 s) so nobody waits forever.
    const speedUp = 2.4 * (S.r / 50) / (calm ? 1.6 : 1);
    const rate = Math.max(Math.max(1, o.v) * speedUp, total / (8 * (calm ? 1.6 : 1)));
    S.run = { o, s: 0, total, rate, phase: 'entry', slip: null, t: 0, crashT: 0 };
    S.skid = []; S.tangent = null; S.slipping = false; S.hazard = false; S.hop = 0;
    S.showV = true; S.showF = false;
    if (S.gl) S.gl.clearSkids();
    kick();
  }
  function stopRun() { S.run = null; }
  function stepRun(dt) {
    const R = S.run;
    if (!R) return;
    R.t += dt;
    if (R.phase === 'crash') {
      R.crashT += dt;
      const k = Math.min(1, R.crashT / 0.35);
      S.hop = Math.sin(Math.min(1, R.crashT / 0.5) * Math.PI) * 0.6;
      S.car.X = R.hit.X - R.dir.x * 1.2 * k; S.car.Y = R.hit.Y - R.dir.y * 1.2 * k; S.car.psi = R.hit.psi + 18 * Math.sin(k * Math.PI * 0.5);
      S.hazard = Math.floor(R.crashT * 3) % 2 === 0;
      // The run is over: hazards stay on, and the controls come back
      if (R.crashT > 1.1) { S.hazard = true; S.hop = 0; S.run = null; R.o.onDone && R.o.onDone({ grip: false }); }
      return;
    }
    R.s += R.rate * dt;
    if (R.slip) {
      const d = R.s - R.slip.s0;
      S.car.X = R.slip.X + R.dir.x * d; S.car.Y = R.slip.Y + R.dir.y * d; S.car.psi = R.slip.psi + Math.min(14, d * 0.9);
      if (S.gl && Math.floor(d * 3) !== R.lastMark) { R.lastMark = Math.floor(d * 3); S.gl.addSkid(S.car); }
      if (S.flat) S.skid.push({ X: S.car.X, Y: S.car.Y, psi: S.car.psi });
      if (R.s >= R.total) {
        R.phase = 'crash'; R.hit = { X: S.car.X, Y: S.car.Y, psi: S.car.psi };
        S.slipping = false;
        R.o.onFrame && R.o.onFrame({ phase: 'crash' });
      }
      return;
    }
    const p = pose(Math.min(R.s, R.total));
    Object.assign(S.car, { X: p.X, Y: p.Y, psi: p.psi });
    S.showF = p.seg === 'turn';
    const slipAt = R.o.slipAt;
    if (slipAt !== null && slipAt !== undefined && p.seg === 'turn' && p.phi >= slipAt) {
      const q = atPhi(slipAt);
      R.slip = { s0: R.s, X: q.X, Y: q.Y, psi: q.psi };
      R.dir = { x: Math.cos(rad(q.psi)), y: Math.sin(rad(q.psi)) };
      S.tangent = { X: q.X, Y: q.Y, psi: q.psi, len: Math.sqrt(railR() ** 2 - pathR() ** 2) + 6 };
      S.slipping = true; S.showF = false; R.phase = 'slide';
      R.o.onFrame && R.o.onFrame({ phase: 'slide', phi: slipAt });
      return;
    }
    if (p.seg !== R.phase) { R.phase = p.seg; R.o.onFrame && R.o.onFrame({ phase: p.seg, phi: p.phi }); }
    if (R.s >= R.total) {
      S.showF = false; R.phase = 'done'; S.run = null;
      R.o.onDone && R.o.onDone({ grip: true });
    }
  }

  // ---------- Placing the car without a run ----------
  function park(o = {}) {
    stopRun();
    const p = o.phi !== undefined && o.phi !== null ? atPhi(o.phi) : pose(o.s || 0);
    Object.assign(S.car, { X: p.X, Y: p.Y, psi: p.psi });
    S.showV = !!o.showV; S.showF = !!o.showF; S.slipping = false; S.hazard = false; S.hop = 0;
    S.skid = []; S.tangent = o.tangent ? { X: p.X, Y: p.Y, psi: p.psi, len: Math.sqrt(railR() ** 2 - pathR() ** 2) + 6 } : null;
    if (S.gl) S.gl.clearSkids();
    if (o.crashed) {
      const d = Math.sqrt(railR() ** 2 - pathR() ** 2) - 3.4, dir = { x: Math.cos(rad(p.psi)), y: Math.sin(rad(p.psi)) };
      S.car.X = p.X + dir.x * d; S.car.Y = p.Y + dir.y * d; S.car.psi = p.psi + 18; S.hazard = true;
      if (S.gl) for (let k = 0; k < d; k += 0.4) S.gl.addSkid({ X: p.X + dir.x * k, Y: p.Y + dir.y * k, psi: p.psi + Math.min(14, k * 0.9) });
      if (S.flat) for (let k = 0; k < d; k += 0.4) S.skid.push({ X: p.X + dir.x * k, Y: p.Y + dir.y * k, psi: p.psi });
    }
    kick();
  }

  // ---------- Frame loop: runs only while something moves ----------
  function frame(now) {
    S.raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000));
    S.last = now;
    stepRun(dt * FAST);
    if (S.gl) S.gl.draw(dt); else if (S.flat) S.flat.draw();
    const busy = S.run || (S.gl && S.gl.animating());
    if (busy && S.visible) S.raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (!S.visible || S.raf) return;
    S.last = performance.now();
    S.raf = requestAnimationFrame(frame);
  }

  // ---------- Three.js renderer ----------
  function makeGL(host) {
    const THREE = window.THREE;
    if (!THREE) return null;
    let renderer;
    try {
      const probe = document.createElement('canvas');
      if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return null;
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    renderer.domElement.className = 'view3d-canvas';

    const scene = new THREE.Scene();
    const persp = new THREE.PerspectiveCamera(44, 1, 0.5, 2000);
    const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.5, 2000);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x445544, 1.6);
    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(60, 120, 40);
    scene.add(hemi, sun);

    const world = new THREE.Group(); scene.add(world);
    const mats = {
      road: new THREE.MeshStandardMaterial({ color: 0x3b4252, roughness: 0.9 }),
      ground: new THREE.MeshStandardMaterial({ color: 0x6aa84f, roughness: 1 }),
      shoulder: new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 1 }),
      yellow: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
      white: new THREE.MeshBasicMaterial({ color: 0xf8fafc }),
      rail: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.7, roughness: 0.35 }),
      post: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 }),
      foam: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.8 }),
      foamW: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 }),
      cone: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 }),
      radius: new THREE.MeshBasicMaterial({ color: 0x7c3aed }),
      ice: new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.85 }),
      skid: new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.55 }),
      tangent: new THREE.MeshBasicMaterial({ color: 0x475569 })
    };
    let track = null, ice = null, rainFx = null, fxKind = null, fxAge = 0;

    // A flat ring segment (an annulus slice), tilted outward by the bank angle
    function ringStrip(r0, r1, a0, a1, seg, y = 0.02, bank = 0) {
      const pos = [], idx = [], t = Math.tan(rad(bank));
      for (let i = 0; i <= seg; i++) {
        const a = a0 + ((a1 - a0) * i) / seg;
        [r0, r1].forEach(rr => pos.push(rr * Math.cos(a), y + (rr - S.r) * t, -rr * Math.sin(a)));
        if (i < seg) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }
    function box(w, h, d, mat, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; }
    function label(text, color, size = 1) {
      const c = document.createElement('canvas'), ctx = c.getContext('2d');
      c.width = 512; c.height = 128;
      ctx.font = '800 64px Outfit, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.strokeText(text, 256, 66);
      ctx.fillStyle = color; ctx.fillText(text, 256, 66);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
      sp.scale.set(16 * size, 4 * size, 1); sp.renderOrder = 10;
      return sp;
    }

    function buildTrack() {
      if (track) { world.remove(track); track.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); }); }
      track = new THREE.Group();
      // The straights are drawn far past the camera's view (the car still starts at entryLen), so the road never just stops
      const rL = S.r, r = roadC(), L0 = entryLen() + rL * 4, L1 = exitLen() + rL * 4, bank = S.bank;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(r * 14, r * 14), mats.ground);
      ground.rotation.x = -Math.PI / 2; ground.position.set(r * 0.3, -0.05, -r * 0.3);
      track.add(ground);
      // Curve
      track.add(new THREE.Mesh(ringStrip(r - ROAD_HALF - 1.2, r + ROAD_HALF + SHOULDER, 0, Math.PI / 2, 48, 0.0, bank), mats.shoulder));
      track.add(new THREE.Mesh(ringStrip(r - ROAD_HALF, r + ROAD_HALF, 0, Math.PI / 2, 64, 0.03, bank), mats.road));
      track.add(new THREE.Mesh(ringStrip(r - ROAD_HALF + 0.3, r - ROAD_HALF + 0.55, 0, Math.PI / 2, 64, 0.05, bank), mats.white));
      track.add(new THREE.Mesh(ringStrip(r + ROAD_HALF - 0.55, r + ROAD_HALF - 0.3, 0, Math.PI / 2, 64, 0.05, bank), mats.white));
      for (let i = 0; i < 18; i += 2) track.add(new THREE.Mesh(ringStrip(r - 0.12, r + 0.12, (i / 18) * Math.PI / 2, ((i + 1) / 18) * Math.PI / 2, 4, 0.06, bank), mats.yellow));
      // Entry and exit straights
      const strip = (w, len, mat, x, z, rotY, y = 0.03) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), mat); m.rotation.x = -Math.PI / 2; m.rotation.z = rotY; m.position.set(x, y, z); return m; };
      track.add(strip(ROAD_HALF * 2 + SHOULDER + 1.2, L0, mats.shoulder, r + SHOULDER / 2 - 0.6, L0 / 2, 0, 0));
      track.add(strip(ROAD_HALF * 2, L0, mats.road, r, L0 / 2, 0));
      track.add(strip(ROAD_HALF * 2 + SHOULDER + 1.2, L1, mats.shoulder, -L1 / 2, -r - SHOULDER / 2 + 0.6, Math.PI / 2, 0));
      track.add(strip(ROAD_HALF * 2, L1, mats.road, -L1 / 2, -r, Math.PI / 2));
      for (let k = 0; k < L0; k += 6) track.add(strip(0.24, 3, mats.yellow, r, k + 1.5, 0, 0.06));
      for (let k = 0; k < L1; k += 6) track.add(strip(0.24, 3, mats.yellow, -k - 1.5, -r, Math.PI / 2, 0.06));
      // Guardrail and foam barrier on the outside of the curve
      const R = railR(), t = Math.tan(rad(bank));
      for (let i = 0; i <= 30; i++) {
        const a = (i / 30) * (Math.PI / 2), yb = (R - r) * t;
        const post = box(0.25, 1.0, 0.25, mats.post, R * Math.cos(a), yb + 0.5, -R * Math.sin(a)); track.add(post);
        if (i % 2 === 0) { const f = box(1.6, 1.1, 1.0, i % 4 === 0 ? mats.foam : mats.foamW, (R + 1.2) * Math.cos(a), yb + 0.55, -(R + 1.2) * Math.sin(a)); f.rotation.y = a; track.add(f); }
      }
      const railGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 31 }, (_, i) => { const a = (i / 30) * Math.PI / 2; return new THREE.Vector3(R * Math.cos(a), (R - r) * t + 0.8, -R * Math.sin(a)); })), 60, 0.16, 6, false);
      track.add(new THREE.Mesh(railGeo, mats.rail));
      // Distance cones on the inside edge and the radius line from the turn's center
      for (let i = 0; i <= 6; i++) { const a = (i / 6) * (Math.PI / 2), rr = r - ROAD_HALF - 1.6; const c = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.2, 10), mats.cone); c.position.set(rr * Math.cos(a), 0.6 + (rr - r) * t, -rr * Math.sin(a)); track.add(c); }
      // The radius line ends at the middle of the outer lane: the path the car drives
      const ra = rad(45), line = new THREE.Mesh(new THREE.BoxGeometry(rL, 0.12, 0.5), mats.radius);
      line.position.set((rL / 2) * Math.cos(ra), 0.15, -(rL / 2) * Math.sin(ra)); line.rotation.y = ra; track.add(line);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.3, 16), mats.radius); hub.position.set(0, 0.15, 0); track.add(hub);
      if (S.labelR) { const lab = label(S.labelR === true ? `r = ${rL} m` : S.labelR, '#7c3aed', rL / 50); lab.position.set((rL * 0.42) * Math.cos(ra) + 2, 3 * (rL / 50), -(rL * 0.42) * Math.sin(ra) + 4); track.add(lab); }
      world.add(track);
      buildIce();
    }
    function buildIce() {
      if (ice) { world.remove(ice); ice.geometry.dispose(); ice = null; }
      if (!S.ice) return;
      ice = new THREE.Mesh(ringStrip(roadC() - ROAD_HALF, roadC() + ROAD_HALF, rad(S.ice[0]), rad(S.ice[1]), 16, 0.07, S.bank), mats.ice);
      world.add(ice);
    }

    // ---------- Vehicles ----------
    function wheel(x, z, rr = 0.38) { const w = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 0.32, 14), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 })); w.rotation.x = Math.PI / 2; w.position.set(x, rr, z); return w; }
    function makeCar() {
      const g = new THREE.Group(), red = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.4 });
      const glass = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.1, metalness: 0.6 });
      g.add(box(4.3, 0.75, 1.9, red, 0, 0.75, 0));
      g.add(box(2.1, 0.6, 1.6, glass, -0.25, 1.38, 0));
      g.add(box(0.2, 0.15, 1.9, new THREE.MeshStandardMaterial({ color: 0x111827 }), -2.15, 1.2, 0));
      [[1.35, 0.95], [1.35, -0.95], [-1.35, 0.95], [-1.35, -0.95]].forEach(([x, z]) => g.add(wheel(x, z)));
      return g;
    }
    function makeTruck() {
      const g = new THREE.Group(), cab = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4, metalness: 0.3 });
      const boxMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 });
      g.add(box(2.0, 2.1, 2.3, cab, 3.0, 1.55, 0));
      g.add(box(0.1, 0.8, 2.0, new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.6, roughness: 0.1 }), 4.02, 2.0, 0));
      g.add(box(5.8, 2.7, 2.4, boxMat, -0.9, 1.95, 0));
      g.add(box(5.8, 0.3, 2.42, new THREE.MeshStandardMaterial({ color: 0xf97316 }), -0.9, 1.0, 0));
      [[3.0, 1.1], [3.0, -1.1], [-0.8, 1.1], [-0.8, -1.1], [-2.6, 1.1], [-2.6, -1.1]].forEach(([x, z]) => g.add(wheel(x, z, 0.5)));
      return g;
    }
    const vehicles = { car: makeCar(), truck: makeTruck() };
    const hazards = [];
    Object.values(vehicles).forEach(v => {
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2; sh.position.y = 0.04; sh.scale.set(v === vehicles.car ? 4.8 : 8.4, v === vehicles.car ? 2.3 : 2.9, 1); v.add(sh);
      const len = v === vehicles.car ? 2.2 : 3.85, hy = v === vehicles.car ? 0.85 : 1.2;
      [-1, 1].forEach(side => [len, -len].forEach(x => { const h = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), new THREE.MeshBasicMaterial({ color: 0x7c2d12 })); h.position.set(x, hy, side * 0.85); v.add(h); hazards.push(h); }));
      v.visible = false; world.add(v);
    });

    // Arrows: velocity (blue) and friction (rose), with labels
    const vArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 10, 0x0369a1, 3, 2);
    const fArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 10, 0xbe123c, 3, 2);
    [vArrow, fArrow].forEach(a => { a.line.material.linewidth = 3; a.renderOrder = 5; world.add(a); });
    // Thick shafts, since lines are 1 pixel wide in WebGL
    const shaft = color => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1, 8), new THREE.MeshBasicMaterial({ color })); world.add(m); return m; };
    const vShaft = shaft(0x0369a1), fShaft = shaft(0xbe123c);
    const vLabel = label('velocity', '#0369a1', 0.9), fLabel = label('friction', '#be123c', 0.9);
    world.add(vLabel, fLabel);
    // The tangent: white dashes painted along the straight path the car took
    const tanLine = new THREE.Group(); world.add(tanLine);
    const dashGeo = new THREE.BoxGeometry(1.6, 0.1, 0.45), dashMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(dashGeo, dashMat); m.position.x = i * 3 + 0.8; tanLine.add(m); }

    // Skid marks: thin dark tiles dropped behind the rear tires while sliding
    const skids = new THREE.Group(); world.add(skids);
    const skidGeo = new THREE.PlaneGeometry(0.9, 0.38);
    function addSkid(c) {
      const len = S.veh === 'truck' ? 2.6 : 1.35, a = rad(c.psi);
      [-0.9, 0.9].forEach(side => {
        const m = new THREE.Mesh(skidGeo, mats.skid);
        m.rotation.x = -Math.PI / 2; m.rotation.z = a;
        const bx = c.X - Math.cos(a) * len - Math.sin(a) * side, by = c.Y - Math.sin(a) * len + Math.cos(a) * side;
        m.position.set(bx, 0.08 + (Math.hypot(bx, by) - S.r) * Math.tan(rad(S.bank)), -by);
        skids.add(m);
      });
    }
    const clearSkids = () => { while (skids.children.length) skids.remove(skids.children[0]); };

    // Rain streaks and snowflakes
    function setFx() {
      const p = PALETTE[S.surf] || PALETTE.dry;
      if (rainFx) { world.remove(rainFx); rainFx.geometry.dispose(); rainFx = null; }
      fxKind = calm ? null : p.fx;
      if (!fxKind) return;
      const n = p.n, span = S.r * 1.8, pos = new Float32Array(n * (fxKind === 'rain' ? 6 : 3));
      for (let i = 0; i < n; i++) {
        const x = -S.r * 0.4 + Math.random() * span, y = Math.random() * 40, z = S.r * 0.4 - Math.random() * span;
        if (fxKind === 'rain') pos.set([x, y, z, x - 0.15, y - 1.6, z], i * 6); else pos.set([x, y, z], i * 3);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      rainFx = fxKind === 'rain'
        ? new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.55 }))
        : new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.55, transparent: true, opacity: 0.9 }));
      world.add(rainFx);
    }
    function stepFx(dt) {
      if (!rainFx) return;
      fxAge += dt;
      const a = rainFx.geometry.attributes.position, arr = a.array, rain = fxKind === 'rain', fall = rain ? 38 : 3.5;
      for (let i = 0; i < arr.length; i += rain ? 6 : 3) {
        arr[i + 1] -= fall * dt;
        if (rain) arr[i + 4] -= fall * dt; else arr[i] += Math.sin(fxAge + i) * 0.02;
        if (arr[i + 1] < 0) { arr[i + 1] += 40; if (rain) arr[i + 4] += 40; }
      }
      a.needsUpdate = true;
    }

    function setLook() {
      const p = PALETTE[S.surf] || PALETTE.dry;
      mats.road.color.setHex(p.road); mats.road.roughness = p.rough; mats.road.metalness = p.metal;
      mats.ground.color.setHex(p.ground);
      scene.background = new THREE.Color(p.sky);
      scene.fog = new THREE.Fog(p.fog, S.r * 3.4, S.r * 8);
      sun.intensity = 1.8 * p.light; hemi.intensity = 1.6 * p.light;
      setFx();
    }

    // ---------- Cameras ----------
    // 3D view: keep the camera's direction, then move it as close as it can go while the whole bend, the radius line,
    // and where the car starts and stops still fit on screen (any curve size, any screen shape)
    const fitV = new THREE.Vector3();
    function fitPersp(c) {
      const r = S.r, R = railR(), pts = [[0, 0], [pathR(), -entryLen()], [-exitLen(), pathR()]];
      for (let a = 0; a <= 90; a += 10) pts.push([R * Math.cos(rad(a)), R * Math.sin(rad(a))]);
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const lx = (Math.min(...xs) + Math.max(...xs)) / 2, ly = (Math.min(...ys) + Math.max(...ys)) / 2;
      const dx = c.pos[0] - c.look[0], dy = c.pos[1] - c.look[1], dz = c.pos[2], n = Math.hypot(dx, dy, dz);
      const place = d => {
        persp.position.set(lx + (dx / n) * d, (dz / n) * d, -(ly + (dy / n) * d));
        persp.lookAt(lx, 0, -ly); persp.updateProjectionMatrix(); persp.updateMatrixWorld();
      };
      const fits = d => {
        place(d);
        return pts.every(([X, Y]) => {
          fitV.set(X, 0, -Y).project(persp);
          return fitV.z < 1 && Math.abs(fitV.x) < 0.9 && fitV.y > -0.9 && fitV.y < 0.76;   // room at the top for the chips and camera buttons
        });
      };
      let lo = r * 0.3, hi = r * 6;
      for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; if (fits(mid)) hi = mid; else lo = mid; }
      place(hi);
    }
    function aimCameras(w, h) {
      const r = S.r, asp = w / h;
      persp.aspect = asp;
      if (S.cam === 'chase') {
        const a = rad(S.car.psi), c = S.car, back = S.veh === 'truck' ? 18 : 13;
        persp.position.set(c.X - Math.cos(a) * back, S.veh === 'truck' ? 8 : 6, -(c.Y - Math.sin(a) * back));
        persp.lookAt(c.X + Math.cos(a) * 12, 1.5, -(c.Y + Math.sin(a) * 12));
      } else {
        fitPersp(S.camView || { pos: [1.8, -1.1, 1.2], look: [0.42, 0.22] });
      }
      persp.updateProjectionMatrix();
      // Top-down: frame the curve, the straights and the barrier
      const cx = r * 0.2 + 4.5, cy = r * 0.26 + 6, half = r * 0.9 + 9;   // a little headroom above the curve for the road labels
      let hw = half, hh = half;
      if (asp > 1) hw = half * asp; else hh = half / asp;
      Object.assign(ortho, { left: -hw, right: hw, top: hh, bottom: -hh });
      ortho.position.set(cx, 300, -cy); ortho.up.set(0, 0, -1); ortho.lookAt(cx, 0, -cy);
      ortho.updateProjectionMatrix();
    }

    function placeVehicle() {
      Object.entries(vehicles).forEach(([id, v]) => { v.visible = id === S.veh; });
      const v = vehicles[S.veh], c = S.car, a = rad(c.psi), lift = (Math.hypot(c.X, c.Y) - S.r) * Math.tan(rad(S.bank));
      const onCurve = Math.hypot(c.X, c.Y) > roadC() - ROAD_HALF - 2 && c.Y > -0.5 && c.X > -0.5;
      v.position.set(c.X, Math.max(0, onCurve ? lift : 0) + S.hop, -c.Y);
      v.rotation.set(0, 0, 0); v.rotateY(a);
      // Drawn a little bigger on the larger curves so it stays easy to see from the 3D and Top cameras (still inside its lane)
      v.scale.setScalar(S.cam === 'chase' ? 1 : Math.min(1.45, Math.sqrt(S.r / 32)));
      if (S.bank && onCurve) v.rotateX(-rad(S.bank));
      hazards.forEach(h => h.material.color.setHex(S.hazard ? 0xfb923c : 0x7c2d12));
      // arrows
      const chase = S.cam === 'chase', len = chase ? 5.5 : Math.max(9, S.r * 0.24), base = new THREE.Vector3(c.X, (chase ? 1.6 : 2.6) + (onCurve ? lift : 0), -c.Y);
      const k = chase ? 0.32 : Math.max(0.9, S.r / 55);
      vLabel.scale.set(16 * k, 4 * k, 1); fLabel.scale.set(16 * k, 4 * k, 1);
      vShaft.scale.x = vShaft.scale.z = fShaft.scale.x = fShaft.scale.z = chase ? 0.4 : 1;
      const show = (arrow, sh, lab, dirMap, on) => {
        arrow.visible = sh.visible = lab.visible = on;
        if (!on) return;
        const d = new THREE.Vector3(dirMap.x, 0, -dirMap.y).normalize();
        const hl = chase ? 1.4 : 3.4, hw = chase ? 1 : 2.4;
        arrow.position.copy(base); arrow.setDirection(d); arrow.setLength(len, hl, hw);
        sh.position.copy(base).addScaledVector(d, (len - hl) / 2); sh.scale.y = len - hl;
        sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
        lab.position.copy(base).addScaledVector(d, len + (chase ? 1.5 : 4)); lab.position.y += chase ? 0.6 : 1.5;
      };
      show(vArrow, vShaft, vLabel, { x: Math.cos(a), y: Math.sin(a) }, S.showV);
      const toC = { x: -c.X, y: -c.Y }, m = Math.hypot(toC.x, toC.y) || 1;
      show(fArrow, fShaft, fLabel, { x: toC.x / m, y: toC.y / m }, S.showF);
      tanLine.visible = !!S.tangent;
      if (S.tangent) {
        const t = S.tangent, ta = rad(t.psi);
        tanLine.position.set(t.X, 0.14, -t.Y); tanLine.rotation.set(0, ta, 0);
        tanLine.children.forEach(m => { m.visible = m.position.x < t.len; });
      }
    }

    let size = { w: 0, h: 0 };
    function draw(dt) {
      const host = S.host, area = S.area || { w: host.clientWidth, h: host.clientHeight };
      const w = Math.max(10, Math.floor(area.w)), h = Math.max(10, Math.floor(area.h));
      if (w !== size.w || h !== size.h) { renderer.setSize(w, h, false); renderer.domElement.style.width = `${w}px`; renderer.domElement.style.height = `${h}px`; size = { w, h }; }
      stepFx(dt || 0);
      placeVehicle();
      aimCameras(w, h);
      // The top-down camera sits high above the road, far past the haze, so the haze is off in that view
      const fog = scene.fog;
      if (S.cam === 'top') scene.fog = null;
      renderer.render(scene, S.cam === 'top' ? ortho : persp);
      scene.fog = fog;
    }
    // Screen point → map point, through the top-down camera only
    function mapPoint(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1, ny = -((clientY - rect.top) / rect.height) * 2 + 1;
      const v = new THREE.Vector3(nx, ny, 0).unproject(ortho);
      return { X: v.x, Y: -v.z };
    }
    return {
      kind: 'gl', buildTrack, buildIce, setLook, draw, addSkid, clearSkids, mapPoint,
      animating: () => !!rainFx,
      dispose: () => { renderer.dispose(); }
    };
  }

  // ---------- Flat 2D fallback: the same world, seen from above ----------
  function makeFlat(host) {
    const c = document.createElement('canvas');
    c.className = 'view3d-canvas';
    host.appendChild(c);
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const look = () => PALETTE[S.surf] || PALETTE.dry;
    const hex = n => `#${n.toString(16).padStart(6, '0')}`;
    function draw() {
      const area = S.area || { w: host.clientWidth, h: host.clientHeight };
      const dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(10, Math.floor(area.w)), h = Math.max(10, Math.floor(area.h));
      if (c.width !== w * dpr || c.height !== h * dpr) { c.width = w * dpr; c.height = h * dpr; c.style.width = `${w}px`; c.style.height = `${h}px`; }
      const rL = S.r, r = roadC(), half = rL * 0.8 + 7, scale = Math.min(w, h) / (2 * half), cx = rL * 0.2 + 4.5, cy = rL * 0.2 + 4.5;
      const P = (X, Y) => [w / 2 + (X - cx) * scale, h / 2 - (Y - cy) * scale];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = hex(look().ground); ctx.fillRect(0, 0, w, h);
      const [ox, oy] = P(0, 0);
      const arc = (rr, color, width) => { ctx.beginPath(); ctx.arc(ox, oy, rr * scale, -Math.PI / 2, 0, false); ctx.strokeStyle = color; ctx.lineWidth = width * scale; ctx.stroke(); };
      const seg = (x1, y1, x2, y2, color, width) => { const a = P(x1, y1), b = P(x2, y2); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.strokeStyle = color; ctx.lineWidth = width * scale; ctx.stroke(); };
      arc(r, hex(look().road), ROAD_HALF * 2);
      seg(r, -entryLen() - r * 4, r, 0, hex(look().road), ROAD_HALF * 2);
      seg(0, r, -exitLen() - r * 4, r, hex(look().road), ROAD_HALF * 2);
      if (S.ice) { ctx.beginPath(); ctx.arc(ox, oy, r * scale, -rad(S.ice[1]), -rad(S.ice[0]), false); ctx.strokeStyle = 'rgba(186,230,253,0.95)'; ctx.lineWidth = ROAD_HALF * 2 * scale; ctx.stroke(); }
      ctx.setLineDash([3 * scale, 3 * scale]); arc(r, '#facc15', 0.25); seg(r, -entryLen() - r * 4, r, 0, '#facc15', 0.25); seg(0, r, -exitLen() - r * 4, r, '#facc15', 0.25); ctx.setLineDash([]);
      arc(railR(), '#64748b', 0.5); arc(railR() + 1.2, '#f97316', 1.0);
      seg(0, 0, rL * Math.cos(rad(45)), rL * Math.sin(rad(45)), '#7c3aed', 0.5);
      if (S.labelR) { const [lx, ly] = P(rL * 0.3, rL * 0.42); ctx.fillStyle = '#7c3aed'; ctx.font = '800 15px Outfit, system-ui, sans-serif'; ctx.fillText(S.labelR === true ? `r = ${rL} m` : S.labelR, lx, ly); }
      S.skid.forEach(p => { const [x, y] = P(p.X, p.Y); ctx.fillStyle = 'rgba(17,17,17,0.5)'; ctx.fillRect(x - 1.5, y - 1.5, 3, 3); });
      if (S.tangent) { const t = S.tangent, a = rad(t.psi); ctx.setLineDash([6, 6]); seg(t.X, t.Y, t.X + Math.cos(a) * t.len, t.Y + Math.sin(a) * t.len, '#475569', 0.35); ctx.setLineDash([]); }
      // vehicle
      const car = S.car, [px, py] = P(car.X, car.Y), L = (S.veh === 'truck' ? 8 : 4.4) * scale, Wd = (S.veh === 'truck' ? 2.4 : 1.9) * scale;
      ctx.save(); ctx.translate(px, py); ctx.rotate(-rad(car.psi));
      ctx.fillStyle = S.veh === 'truck' ? '#2563eb' : '#dc2626'; ctx.fillRect(-L / 2, -Wd / 2, L, Wd);
      if (S.hazard) { ctx.fillStyle = '#fb923c'; [[-L / 2, -Wd / 2], [L / 2 - 3, -Wd / 2], [-L / 2, Wd / 2 - 3], [L / 2 - 3, Wd / 2 - 3]].forEach(([x, y]) => ctx.fillRect(x, y, 3, 3)); }
      ctx.restore();
      const arrow = (dx, dy, color) => {
        const len = Math.max(9, r * 0.24) * scale, x2 = px + dx * len, y2 = py - dy * len;
        ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x2, y2); ctx.stroke();
        const a = Math.atan2(-(dy), dx); ctx.beginPath(); ctx.moveTo(x2 + Math.cos(a) * 8, y2 - Math.sin(a) * 8); ctx.lineTo(x2 + Math.cos(a + 2.4) * 10, y2 - Math.sin(a + 2.4) * 10); ctx.lineTo(x2 + Math.cos(a - 2.4) * 10, y2 - Math.sin(a - 2.4) * 10); ctx.fill();
      };
      if (S.showV) arrow(Math.cos(rad(car.psi)), Math.sin(rad(car.psi)), '#0369a1');
      if (S.showF) { const m = Math.hypot(car.X, car.Y) || 1; arrow(-car.X / m, -car.Y / m, '#be123c'); }
    }
    return { kind: 'flat', draw, buildTrack() {}, buildIce() {}, setLook() {}, addSkid() {}, clearSkids() { S.skid = []; }, animating: () => false };
  }

  // ---------- Public API ----------
  const World = {
    S,
    // Called once with the stage's 3D host element
    init(host) {
      S.host = host;
      if (!S.gl && !S.flat) {
        S.gl = makeGL(host);
        if (!S.gl) S.flat = makeFlat(host);
        World.mode = S.gl ? 'gl' : 'flat';
        if (S.gl) { S.gl.buildTrack(); S.gl.setLook(); }
      }
      return World.mode;
    },
    // Keep the 3D view clear of the instrument panel. area = { w, h } in CSS pixels
    setArea(area) { S.area = area; S.dirty = true; World.redraw(); },
    show(on) {
      S.visible = !!on;
      if (S.host) S.host.style.visibility = on ? 'visible' : 'hidden';
      if (on) World.redraw(); else if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    },
    // o = { r, surf, veh, bank, ice: [from°, to°] | null, labelR: true | false | 'text' }
    setup(o) {
      let track = false, look = false;
      if (o.r !== undefined && o.r !== S.r) { S.r = o.r; track = true; }
      if (o.bank !== undefined && o.bank !== S.bank) { S.bank = o.bank; track = true; }
      if (o.labelR !== undefined && o.labelR !== S.labelR) { S.labelR = o.labelR; track = true; }
      if (o.surf && o.surf !== S.surf) { S.surf = o.surf; look = true; }
      if (o.veh) S.veh = o.veh;
      if (o.lane && o.lane !== S.lane) { S.lane = o.lane; if (!S.run) park({ s: 0 }); }   // the car moves to the start of its new lane
      if (o.ice !== undefined && JSON.stringify(o.ice) !== JSON.stringify(S.ice)) { S.ice = o.ice; if (S.gl && !track) S.gl.buildIce(); }
      if (S.gl) { if (track) S.gl.buildTrack(); if (look) S.gl.setLook(); }
      World.redraw();
    },
    setCam(mode) { S.cam = mode; World.redraw(); },
    run, park,
    stop() { stopRun(); },
    running: () => !!S.run,
    redraw() {
      if (!S.visible) return;
      if (S.raf) return;
      if (S.gl) S.gl.draw(0); else if (S.flat) S.flat.draw();
      kick();
    },
    mode: null
  };
  window.World = World;
})();

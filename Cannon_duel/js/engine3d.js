// Cannon Duel 3D: a three.js renderer that replaces the canvas one (load after engine.js, before game.js).
// It extends Renderer, so physics, shot playback, particles and sound are all shared; only drawing changes.
// The WebGL scene sits under the original 2D canvas, which still draws labels, guides and paths.
// The camera looks level along −z with a lens shift, so the firing plane z = 0 lands on screen exactly
// where toScreen() puts it: every 2D overlay lines up with the 3D world, and angles aren't distorted.
(function () {
  'use strict';
  const E = window.CannonEngine, THREE = window.THREE;
  if (!E || !THREE) return;
  const { WORLD_W, TEAM_COLORS } = E;
  const FORT_HALF = 7;                 // same as engine.js
  const MODEL_URL = 'models/english_naval_cannon_32pdr.glb';
  const MODEL_TRUNNION_Y = 0.82;       // trunnion height in the model (m)
  const MODEL_MUZZLE = 1.65;           // trunnion to muzzle in the model (m)
  const MODEL_BORE_Y = 0.04;           // bore axis sits this far above the trunnions in the model (m)
  // Drawn 1.7× life size like the 2D cannon. The barrel still pivots on its bore axis exactly at the
  // physics pivot (PIVOT_H = 2 m up), so the fort's gun deck is drawn SINK lower than the physics ground.
  const MODEL_SCALE = 1.7 * 2 / MODEL_TRUNNION_Y;
  const SINK = (MODEL_TRUNNION_Y + MODEL_BORE_Y) * MODEL_SCALE - 2;
  const FOV = 24;
  const RAISE = 0.14;                  // camera height above the frame centre, as a fraction of its distance
  const X0 = -70, X1 = WORLD_W + 70, DX = 0.5;
  const ROWS = [-130, -90, -62, -44, -32, -23, -16.5, -12, -8.5, -6, -4, -2.5, -1.2, 0, 1.2, 2.5, 4, 5.5];
  const FRONT_Z = 5.5;
  const LIGHTS = {
    day:    { sky: 0xe0f2ff, ground: 0x6b5030, hemi: 1.5, sun: 0xfff1d6, sunI: 2.6, dir: [90, 170, 140], env: 0.6 },
    sunset: { sky: 0xffd2a8, ground: 0x5b3b5c, hemi: 1.1, sun: 0xffad66, sunI: 2.4, dir: [150, 60, 120], env: 0.45 },
    dusk:   { sky: 0xbfaee0, ground: 0x3b2f4f, hemi: 0.95, sun: 0xffc6a0, sunI: 1.4, dir: [120, 110, 130], env: 0.3 },
    night:  { sky: 0x7288c8, ground: 0x1a1f33, hemi: 0.7, sun: 0xcdd8ff, sunI: 0.9, dir: [110, 170, 120], env: 0.15 },
  };
  const shared = (o) => { o.userData.shared = true; return o; };
  const col = (hex) => new THREE.Color(hex);

  class Renderer3D extends E.Renderer {
    constructor(canvas, sound) {
      super(canvas, sound);            // `canvas` stays as the transparent 2D overlay
      const el = document.createElement('canvas');
      el.id = 'cv3d';
      canvas.parentNode.insertBefore(el, canvas);
      try {
        this.gl = new THREE.WebGLRenderer({ canvas: el, antialias: true });
      } catch (e) {
        el.remove(); this.gl = null; return;   // no WebGL: fall back to the 2D renderer
      }
      this.gl.shadowMap.enabled = true;
      this.gl.shadowMap.type = THREE.PCFSoftShadowMap;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(FOV, 1, 1, 4000);
      if (window.RoomEnvironment) {
        const pm = new THREE.PMREMGenerator(this.gl);
        this.scene.environment = pm.fromScene(new window.RoomEnvironment(), 0.04).texture;
      }
      this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
      this.sun = new THREE.DirectionalLight(0xffffff, 2);
      this.sun.castShadow = true;
      Object.assign(this.sun.shadow.camera, { left: -230, right: 230, top: 140, bottom: -140, near: 1, far: 900 });
      this.sun.shadow.mapSize.set(4096, 2048);
      this.sun.shadow.bias = -0.0004;
      this.sun.shadow.normalBias = 0.3;
      this.sun.target.position.set(WORLD_W / 2, 30, 0);
      this.scene.add(this.hemi, this.sun, this.sun.target);

      this.geo = {
        trunk: shared(new THREE.CylinderGeometry(0.3, 0.45, 3, 7).translate(0, 1.5, 0)),
        cone: shared(new THREE.ConeGeometry(1, 1, 9).translate(0, 0.5, 0)),
        blob: shared(new THREE.IcosahedronGeometry(1, 1)),
        ball: shared(new THREE.SphereGeometry(1, 20, 14)),
        merlon: shared(new THREE.BoxGeometry(1.5, 1.4, 1.3)),
        puff: shared(new THREE.IcosahedronGeometry(1, 2)),
      };
      this.mat = {
        trunk: shared(new THREE.MeshLambertMaterial({ color: 0x5b3a1e })),
        ballStd: shared(new THREE.MeshStandardMaterial({ color: 0x1f2328, metalness: 0.8, roughness: 0.45 })),
        ballHeavy: shared(new THREE.MeshStandardMaterial({ color: 0x7f1d1d, metalness: 0.6, roughness: 0.4 })),
        stone: shared(new THREE.MeshStandardMaterial({ map: stoneTexture(), roughness: 0.95, metalness: 0 })),
      };
      this.ballMeshes = [];
      this.initParticles();

      this.model = null;
      new window.GLTFLoader().load(MODEL_URL, (g) => this.useModel(g.scene), undefined, () => this.useModel(fallbackModel()));
      this.resize();
    }

    useModel(scene) {
      scene.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true; o.receiveShadow = true;
        shared(o.geometry); shared(o.material);
      });
      // Pivot the barrel on its bore axis (not the trunnions just below it), so the line a ball
      // flies along always passes through the pivot, at every angle
      const barrel = scene.getObjectByName('Barrel');
      if (barrel && !barrel.userData.onBore) {
        barrel.position.y += MODEL_BORE_Y;
        barrel.children.forEach((ch) => { ch.position.y -= MODEL_BORE_Y; });
        barrel.userData.onBore = true;
      }
      this.pivot = barrel ? barrel.position.clone() : new THREE.Vector3(0, MODEL_TRUNNION_Y, 0);
      this.model = scene;
      this.built = null;               // rebuild so the cannons appear
    }

    resize() {
      super.resize();
      if (!this.gl) return;
      this.gl.setPixelRatio(this.dpr);
      this.gl.setSize(this.cw, this.ch, false);
      this.skyKey = null;
    }

    // ------------------------------------------------ world building
    build(w) {
      if (this.root) {
        this.scene.remove(this.root);
        this.root.traverse((o) => {
          if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
          if (o.material && !o.material.userData.shared) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
        });
      }
      this.built = w;
      this.root = new THREE.Group();
      this.scene.add(this.root);
      const sk = this.sky(), L = LIGHTS[w.theme] || LIGHTS.day;
      this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemi;
      this.sun.color.set(L.sun); this.sun.intensity = L.sunI;
      this.sun.position.set(WORLD_W / 2 + L.dir[0], 30 + L.dir[1], L.dir[2]);
      this.envI = L.env;
      this.scene.fog = new THREE.Fog(sk.bot, 400, 1400);
      this.skyKey = null;

      this.h0 = Float64Array.from(w.h);
      this.craterBase = w.craters.length;
      this.craterSeen = -1;
      this.buildTerrain(w, sk);
      this.buildForts(w);
      this.buildTrees(w);
      this.buildCannons(w);
      this.buildClouds(w);
      this.applyEnv();
    }

    baseH(x) {
      const f = Math.max(0, Math.min(this.h0.length - 1, x / 0.5)), i = Math.min(this.h0.length - 2, Math.floor(f)), t = f - i;
      return this.h0[i] * (1 - t) + this.h0[i + 1] * t;
    }

    // Height of the visible ground. On z = 0 it is the physics heightmap (except the sunken gun decks);
    // craters are round bowls instead of trenches, and the land behind falls away into lower hills
    // so the firing line stays the front ridge.
    // bare: the ground before any craters (used to colour dug-up dirt)
    groundAt(x, z, bare = false) {
      const w = this.world;
      let y;
      if (z === 0 && !bare) y = w.heightAt(Math.max(0, Math.min(WORLD_W, x)));
      else {
        y = this.baseH(x);
        if (!bare && !w.inFort(x)) {
          for (let k = this.craterBase; k < w.craters.length; k++) {
            const c = w.craters[k], dx = x - c.x, d2 = dx * dx + z * z;
            if (d2 < c.r * c.r) { const b = c.y - Math.sqrt(c.r * c.r - d2); if (y > b) y = Math.max(1, b); }
          }
        }
        if (z < -5) {
          const t = smooth((-z - 5) / 70), ph = this.world.seed % 97;
          const hills = 6 + 5 * Math.sin(x * 0.031 + ph + z * 0.02) + 3 * Math.sin(x * 0.083 - z * 0.05 + ph * 2);
          y = y * (1 - 0.7 * t) + hills * t;
        }
      }
      for (const c of w.cannons) {
        const d = Math.abs(x - c.x);
        if (d < FORT_HALF + 5) y -= SINK * (d <= FORT_HALF + 1 ? 1 : 1 - smooth((d - FORT_HALF - 1) / 4));
      }
      return y;
    }

    buildTerrain(w, sk) {
      const nx = Math.round((X1 - X0) / DX) + 1, nz = ROWS.length;
      this.nx = nx;
      const pos = new Float32Array(nx * nz * 3), colr = new Float32Array(nx * nz * 3), idx = [];
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
      const top = new THREE.BufferGeometry();
      top.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      top.setAttribute('color', new THREE.BufferAttribute(colr, 3));
      top.setIndex(idx);
      this.topMesh = new THREE.Mesh(top, new THREE.MeshLambertMaterial({ vertexColors: true }));
      this.topMesh.receiveShadow = true;

      // Front cut: grass lip, then dirt layers, like a diorama cross-section
      const fpos = new Float32Array(nx * 4 * 3), fcol = new Float32Array(nx * 4 * 3), fidx = [];
      const layers = [col(sk.grassDk), col(sk.dirt[0]), col(sk.dirt[1]), col(sk.dirt[2])];
      for (let i = 0; i < nx; i++) for (let r = 0; r < 4; r++) layers[r].toArray(fcol, (i * 4 + r) * 3);
      for (let i = 0; i < nx - 1; i++) for (let r = 0; r < 3; r++) {
        const a = i * 4 + r, b = a + 1, c = a + 4, d = c + 1;
        fidx.push(a, b, c, b, d, c);
      }
      const front = new THREE.BufferGeometry();
      front.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
      front.setAttribute('color', new THREE.BufferAttribute(fcol, 3));
      front.setIndex(fidx);
      this.frontMesh = new THREE.Mesh(front, new THREE.MeshLambertMaterial({ vertexColors: true }));

      // The firing line: the exact profile the physics uses
      const lpos = new Float32Array(nx * 3);
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
      this.lineMesh = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));

      const rnd = E.mulberry32(w.seed ^ 0x51ed27);
      this.grassJitter = Float32Array.from({ length: nx * nz }, () => rnd());
      this.grassA = col(sk.grass); this.grassB = col(sk.grassDk); this.dirtC = col(sk.dirt[0]);
      this.root.add(this.topMesh, this.frontMesh, this.lineMesh);
      this.updateTerrain();
    }

    updateTerrain() {
      const w = this.world, nx = this.nx;
      const pos = this.topMesh.geometry.attributes.position.array, colr = this.topMesh.geometry.attributes.color.array;
      const fpos = this.frontMesh.geometry.attributes.position.array, lpos = this.lineMesh.geometry.attributes.position.array;
      const c = new THREE.Color();
      for (let j = 0; j < ROWS.length; j++) {
        const z = ROWS[j], fade = Math.max(0, Math.min(1, -z / 130));
        for (let i = 0; i < nx; i++) {
          const x = X0 + i * DX, y = this.groundAt(x, z), k = (j * nx + i) * 3;
          pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
          const dug = this.groundAt(x, z, true) - y;
          c.copy(this.grassA).lerp(this.grassB, 0.25 + 0.5 * this.grassJitter[j * nx + i] * (0.4 + fade));
          if (dug > 0.05) c.lerp(this.dirtC, Math.min(1, dug / 1.5));
          c.toArray(colr, k);
        }
      }
      for (let i = 0; i < nx; i++) {
        const x = X0 + i * DX, y = this.groundAt(x, FRONT_Z), k = i * 12;
        [y + 0.02, y - 0.7, y - 9, -60].forEach((yy, r) => { fpos[k + r * 3] = x; fpos[k + r * 3 + 1] = yy; fpos[k + r * 3 + 2] = FRONT_Z; });
        lpos[i * 3] = x; lpos[i * 3 + 1] = this.groundAt(x, 0) + 0.06; lpos[i * 3 + 2] = 0.05;
      }
      for (const m of [this.topMesh, this.frontMesh, this.lineMesh]) {
        m.geometry.attributes.position.needsUpdate = true;
        if (m.geometry.attributes.color) m.geometry.attributes.color.needsUpdate = true;
      }
      this.topMesh.geometry.computeVertexNormals();
      this.frontMesh.geometry.computeVertexNormals();
      this.craterSeen = w.craters.length;
    }

    buildForts(w) {
      for (const c of w.cannons) {
        const depth = FRONT_Z + 0.3 + 9;
        const top = c.ground - SINK;
        const body = new THREE.Mesh(new THREE.BoxGeometry(FORT_HALF * 2, 5.05, depth), this.mat.stone);
        body.position.set(c.x, top - 2.5, FRONT_Z + 0.3 - depth / 2);
        body.castShadow = body.receiveShadow = true;
        this.root.add(body);
        for (let x = -FORT_HALF + 0.75; x <= FORT_HALF - 0.7; x += 2.5) {
          const m = new THREE.Mesh(this.geo.merlon, this.mat.stone);
          m.position.set(c.x + x, top + 0.72, -8.05);
          m.castShadow = m.receiveShadow = true;
          this.root.add(m);
        }
      }
    }

    buildTrees(w) {
      const night = w.theme === 'night';
      const pineMat = new THREE.MeshLambertMaterial({ color: night ? 0x14532d : 0x15803d, flatShading: true });
      const roundMat = new THREE.MeshLambertMaterial({ color: night ? 0x14532d : 0x16a34a, flatShading: true });
      const make = (kind, s) => {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(this.geo.trunk, this.mat.trunk));
        if (kind === 'pine') {
          for (let k = 0; k < 3; k++) {
            const m = new THREE.Mesh(this.geo.cone, pineMat);
            m.scale.set(3 - k * 0.6, 3.6 + k * 0.2, 3 - k * 0.6); m.position.y = 2.4 + k * 2.2; g.add(m);
          }
        } else {
          [[0, 5, 0, 3], [-1.8, 3.6, 0.4, 2], [1.8, 3.6, -0.4, 2]].forEach(([x, y, z, r]) => {
            const m = new THREE.Mesh(this.geo.blob, roundMat); m.position.set(x, y, z); m.scale.setScalar(r); g.add(m);
          });
        }
        g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        g.scale.setScalar(s);
        return g;
      };
      // Trees on the firing line can be blown away; they stand just behind it so the ball passes in front
      this.treeObjs = w.trees.map((t) => {
        const g = make(t.kind, t.s);
        g.position.set(t.x, this.groundAt(t.x, -3) - 0.3, -3);
        this.root.add(g);
        return g;
      });
      // Scenery further back (never affects play)
      const rnd = E.mulberry32(w.seed ^ 0x7f4a7c15);
      for (let k = 0; k < 90; k++) {
        const x = X0 + rnd() * (X1 - X0), z = -14 - rnd() * 110;
        if (z > -30 && w.cannons.some((c) => Math.abs(x - c.x) < FORT_HALF + 4)) continue;
        const g = make(rnd() < 0.6 ? 'pine' : 'round', 0.7 + rnd() * 0.7);
        g.position.set(x, this.groundAt(x, z) - 0.3, z);
        g.rotation.y = rnd() * 6.28;
        this.root.add(g);
      }
    }

    buildCannons(w) {
      this.cannonObjs = [];
      if (!this.model) return;
      w.cannons.forEach((c, i) => {
        const team = this.teams[i] || { color: i ? 'red' : 'blue' };
        const tc = TEAM_COLORS[team.color] || TEAM_COLORS.blue;
        const outer = new THREE.Group();
        outer.position.set(c.x, c.y, 0);   // outer's origin is the physics pivot
        outer.rotation.y = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        outer.scale.setScalar(MODEL_SCALE);
        const model = this.model.clone(true);
        model.position.copy(this.pivot).negate();   // move the model so its barrel pivot is at the origin
        const mats = [];
        model.traverse((o) => {
          if (!o.isMesh) return;
          o.material = o.material.clone();   // per-team so the carriage can be painted and greyed out
          o.material.userData.shared = false;
          if (/oak|wood|carriage/i.test(o.material.name)) o.material.color.lerp(col(tc.dark), 0.8);
          o.material.userData.base = o.material.color.clone();
          mats.push(o.material);
        });
        outer.add(model);
        const barrel = model.getObjectByName('Barrel') || model;
        // Painted band in the team colour, like the 2D barrel stripe
        const bandMat = new THREE.MeshStandardMaterial({ color: tc.main, roughness: 0.6 });
        bandMat.userData.base = bandMat.color.clone(); mats.push(bandMat);
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.214, 0.03, 8, 40), bandMat);
        band.position.set(0, 0.04, 0.95);
        barrel.add(band);

        // Flag on a pole at the back of the fort
        const fx = c.x - c.dir * 5.5, poleH = 12;
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, poleH, 8).translate(0, poleH / 2, 0),
          new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.5 }));
        pole.position.set(fx, c.ground, -7); pole.castShadow = true;
        const flagGeo = new THREE.PlaneGeometry(4.5, 2.8, 14, 3).translate(2.25, -1.4, 0);
        const flagMat = new THREE.MeshLambertMaterial({ color: tc.main, side: THREE.DoubleSide });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(fx, c.ground + poleH, -7); flag.scale.x = c.dir; flag.castShadow = true;
        flagGeo.userData.x0 = Float32Array.from(flagGeo.attributes.position.array);
        this.root.add(outer, pole, flag);
        this.cannonObjs.push({ outer, model, barrel, mats, flag, flagMat, flagColor: col(tc.main), poleTop: [fx, c.ground + poleH] });
      });
    }

    applyEnv() {
      this.root.traverse((o) => { if (o.material && o.material.isMeshStandardMaterial) o.material.envMapIntensity = this.envI; });
    }

    buildClouds(w) {
      const night = w.theme === 'night';
      const mat = new THREE.MeshLambertMaterial({ color: night ? 0x94a3b8 : 0xffffff, transparent: true, opacity: night ? 0.35 : 0.92, fog: false, flatShading: true });
      this.cloudObjs = w.clouds.map((c) => {
        const g = new THREE.Group();
        [[0, 0, 1], [1, 0.4, 1.2], [2.1, 0, 0.9], [1, -0.3, 0.9]].forEach(([x, y, r]) => {
          const m = new THREE.Mesh(this.geo.puff, mat); m.position.set(x * 1, y, 0); m.scale.set(r, r * 0.8, r * 0.7); g.add(m);
        });
        this.root.add(g);
        return { c, g };
      });
    }

    // Background: sky gradient, stars, sun/moon and mountain silhouettes, fixed to the screen like the 2D version
    paintSky() {
      const w = this.world, sk = this.sky(), W = Math.max(2, Math.round(this.cw)), H = Math.max(2, Math.round(this.ch));
      const key = `${w.seed}|${w.theme}|${W}|${H}`;
      if (key === this.skyKey) return;
      this.skyKey = key;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, sk.top); g.addColorStop(1, sk.bot);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (w.theme === 'night' || w.theme === 'dusk') {
        ctx.fillStyle = '#fff';
        for (const s of w.stars) { ctx.globalAlpha = w.theme === 'night' ? 0.8 : 0.35; ctx.fillRect(s.x * W, s.y * H, s.s, s.s); }
        ctx.globalAlpha = 1;
      }
      const sunX = W * (w.theme === 'sunset' ? 0.78 : 0.82), sunY = H * (w.theme === 'sunset' ? 0.42 : 0.16);
      const sg = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 70);
      sg.addColorStop(0, sk.sun); sg.addColorStop(0.35, sk.sun + 'aa'); sg.addColorStop(1, sk.sun + '00');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sunX, sunY, 70, 0, 7); ctx.fill();
      ctx.fillStyle = sk.sun; ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, 7); ctx.fill();
      if (w.theme === 'night') { ctx.fillStyle = sk.top; ctx.beginPath(); ctx.arc(sunX + 9, sunY - 6, 19, 0, 7); ctx.fill(); }
      w.mountains.forEach((pts, li) => {
        ctx.fillStyle = sk.mtn[li];
        ctx.beginPath(); ctx.moveTo(0, H);
        pts.forEach((p, i) => ctx.lineTo((i / (pts.length - 1)) * W, H - H * p * (li ? 0.75 : 1) - 20));
        ctx.lineTo(W, H); ctx.fill();
      });
      if (this.scene.background) this.scene.background.dispose();
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.scene.background = tex;
    }

    // ------------------------------------------------ particles (one Points cloud, sized in meters)
    initParticles() {
      const MAX = 5000;
      const geo = new THREE.BufferGeometry();
      this.pPos = new Float32Array(MAX * 3); this.pCol = new Float32Array(MAX * 4);
      this.pSize = new Float32Array(MAX); this.pSoft = new Float32Array(MAX);
      geo.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('aColor', new THREE.BufferAttribute(this.pCol, 4).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('aSize', new THREE.BufferAttribute(this.pSize, 1).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('aSoft', new THREE.BufferAttribute(this.pSoft, 1).setUsage(THREE.DynamicDrawUsage));
      this.pMat = new THREE.ShaderMaterial({
        uniforms: { uScale: { value: 1 }, uMin: { value: 2 } },
        vertexShader: `attribute vec4 aColor; attribute float aSize; attribute float aSoft;
          uniform float uScale; uniform float uMin; varying vec4 vColor; varying float vSoft;
          void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
            gl_PointSize = max(aSize * uScale / -mv.z, uMin); vColor = aColor; vSoft = aSoft; }`,
        fragmentShader: `varying vec4 vColor; varying float vSoft;
          void main() { vec2 c = gl_PointCoord - 0.5;
            if (vSoft < 0.5) { gl_FragColor = vColor; return; }
            float r = length(c) * 2.0; if (r > 1.0) discard;
            gl_FragColor = vec4(vColor.rgb, vColor.a * (1.0 - r * r * 0.7) * smoothstep(1.0, 0.8, r)); }`,
        transparent: true, depthWrite: false,
      });
      this.points = new THREE.Points(geo, this.pMat);
      this.points.frustumCulled = false;
      this.points.renderOrder = 5;
      this.scene.add(this.points);
      this.pMax = MAX;
    }

    syncParticles() {
      const s = this.cam.s, tmp = new THREE.Color();
      let n = 0;
      for (const p of this.parts) {
        if (p.type === 'ring' || n >= this.pMax) continue;
        if (p.z === undefined) p.z = p.type === 'puff' ? 0 : p.type === 'confetti' ? -2 + Math.random() * 6 : (Math.random() - 0.35) * 4;
        const a = Math.max(0, p.life / p.max);
        let r, g, b, al, size, soft = 1;
        if (p.type === 'smoke' || p.type === 'puff') {
          const v = p.type === 'puff' ? 230 : 118; r = g = b = v / 255; if (p.type === 'smoke') { g = 113 / 255; b = 108 / 255; }
          al = a * (p.type === 'puff' ? 0.35 : 0.5); size = Math.max(2 * p.size, 3 / s);
        } else if (p.type === 'fire') {
          r = 1; g = (120 + 120 * a) / 255; b = 40 / 255; al = a; size = Math.max(2 * p.size * a, 4 / s);
        } else if (p.type === 'dirt') {
          tmp.set(p.color).convertLinearToSRGB(); r = tmp.r; g = tmp.g; b = tmp.b; al = Math.min(1, a * 2); size = Math.max(p.size, 2 / s); soft = 0;
        } else {                         // confetti
          tmp.set(p.color).convertLinearToSRGB(); r = tmp.r; g = tmp.g; b = tmp.b; al = 1; size = 7 / s; soft = 0;
        }
        this.pPos[n * 3] = p.x; this.pPos[n * 3 + 1] = p.y; this.pPos[n * 3 + 2] = p.z;
        this.pCol[n * 4] = r; this.pCol[n * 4 + 1] = g; this.pCol[n * 4 + 2] = b; this.pCol[n * 4 + 3] = al;
        this.pSize[n] = size; this.pSoft[n] = soft;
        n++;
      }
      const geo = this.points.geometry;
      geo.setDrawRange(0, n);
      for (const k of ['position', 'aColor', 'aSize', 'aSoft']) geo.attributes[k].needsUpdate = true;
    }

    // ------------------------------------------------ per frame
    placeCamera(shx, shy) {
      const s = this.cam.s, P5 = 1 / Math.tan((FOV * Math.PI) / 360);
      const d = (this.ch * P5) / (2 * s);
      const cx = WORLD_W / 2 - shx / s, cy = (this.ch / 2 - 8) / s + shy / s, raise = d * RAISE;
      const cam = this.camera;
      cam.aspect = this.cw / this.ch; cam.near = Math.max(1, d * 0.4); cam.far = d + 3000;
      cam.updateProjectionMatrix();
      cam.projectionMatrix.elements[9] = -P5 * raise / d;   // lens shift: look level, frame lower
      cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
      cam.position.set(cx, cy + raise, d);
      cam.rotation.set(0, 0, 0);
      cam.updateMatrixWorld();
      this.view = { d, raise, cx, cy, wPlane: this.cw / s, hPlane: this.ch / s };
      this.pMat.uniforms.uScale.value = (this.ch * this.dpr * P5) / 2;
      this.pMat.uniforms.uMin.value = 1.5 * this.dpr;
      this.scene.fog.near = d + 60; this.scene.fog.far = d + 900;
    }

    // World point at screen fraction (fx, fy) and depth z, for screen-anchored scenery like clouds
    atScreen(fx, fy, z) {
      const v = this.view, k = (v.d - z) / v.d;
      return [v.cx + (fx - 0.5) * v.wPlane * k, v.cy + v.raise + ((0.5 - fy) * v.hPlane - v.raise) * k];
    }

    draw() {
      if (!this.gl) return super.draw();
      const w = this.world;
      if (w !== this.built) this.build(w);
      if (w.craters.length !== this.craterSeen) this.updateTerrain();
      this.paintSky();
      const shx = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 14 : 0;
      const shy = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 14 : 0;
      this.placeCamera(shx, shy);

      w.trees.forEach((t, i) => { if (this.treeObjs[i]) this.treeObjs[i].visible = t.alive; });
      for (const { c, g } of this.cloudObjs) {
        const z = -320, [x, y] = this.atScreen(((c.x + this.time * c.v) % 1.2) - 0.1, c.y, z);
        g.position.set(x, y, z);
        g.scale.setScalar(c.s * 20 / this.cam.s * (this.view.d - z) / this.view.d);
      }

      this.cannonObjs.forEach((o, i) => {
        const dead = this.hp[i] <= 0, c = w.cannons[i];
        const th = (this.aim[i].angle * Math.PI) / 180;
        o.barrel.rotation.x = dead ? 0.35 : -th;
        o.model.position.z = -this.pivot.z - this.recoil[i] * 0.35;
        for (const m of o.mats) m.color.copy(m.userData.base).lerp(col(0x3f3b38), dead ? 0.75 : 0);
        o.flagMat.color.copy(dead ? col(0x57534e) : o.flagColor);
        const fp = o.flag.geometry.attributes.position, x0 = o.flag.geometry.userData.x0;
        for (let v = 0; v < fp.count; v++) {
          const x = x0[v * 3];
          fp.array[v * 3 + 2] = Math.sin(this.time * 6 + x * 1.6) * 0.35 * (x / 4.5);
          fp.array[v * 3 + 1] = x0[v * 3 + 1] + Math.sin(this.time * 6 + x * 1.6) * 0.15 * (x / 4.5);
        }
        fp.needsUpdate = true;
        if (dead && Math.random() < 0.3) this.parts.push({ x: c.x + (Math.random() - 0.5) * 3, y: c.y + 1, vx: (Math.random() - 0.5), vy: 3, life: 1.6, max: 1.6, size: 1.5, type: 'smoke' });
      });

      // Cannonballs: drawn a little larger than life so they stay visible at any zoom
      const live = this.balls.filter((b) => !b.done);
      while (this.ballMeshes.length < live.length) {
        const m = new THREE.Mesh(this.geo.ball, this.mat.ballStd); m.castShadow = true; this.scene.add(m); this.ballMeshes.push(m);
      }
      this.ballMeshes.forEach((m, k) => {
        const b = live[k];
        m.visible = !!b;
        if (!b) return;
        const heavy = b.ammo === 'heavy';
        m.visible = this.pastMuzzle(b);   // the ball is wider than the bore, so it appears at the muzzle
        m.material = heavy ? this.mat.ballHeavy : this.mat.ballStd;
        m.position.set(b.x, b.y, 0);
        m.scale.setScalar(Math.max(heavy ? 7 : 5.5, this.cam.s * (heavy ? 1.6 : 1.2)) / this.cam.s);
      });

      this.syncParticles();
      this.gl.render(this.scene, this.camera);
      this.drawOverlay(shx, shy);
    }

    pastMuzzle(b) { return Math.hypot(b.x - b.x0, b.y - b.y0) > MODEL_MUZZLE * MODEL_SCALE * 0.9; }

    // Muzzle smoke and flash come from the drawn barrel's tip (the ball itself starts at the pivot)
    muzzle(idx, angle) {
      const c = this.world.cannons[idx], th = (angle * Math.PI) / 180, L = MODEL_MUZZLE * MODEL_SCALE;
      return { x: c.x + c.dir * Math.cos(th) * L, y: c.y + Math.sin(th) * L };
    }

    drawOverlay(shx, shy) {
      const ctx = this.ctx, W = this.cw, H = this.ch;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(shx, shy);
      this.drawGhosts();
      this.drawTrails();
      if (this.measure) this.drawMeasure();
      for (let i = 0; i < 2; i++) this.drawLabel(i);
      this.drawMarkers();
      this.drawJam();
      this.drawAimGuide();
      this.drawParticles(['ring']);
      this.drawOffTop();
      this.drawTexts();
      ctx.restore();
      if (this.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${this.flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
      if (this.clock !== null) {
        ctx.font = '700 16px "JetBrains Mono", monospace';
        const txt = `t = ${this.clock.toFixed(2)} s`;
        const tw = ctx.measureText(txt).width;
        ctx.fillStyle = 'rgba(15,23,42,0.7)'; roundRect(ctx, W / 2 - tw / 2 - 12, 10, tw + 24, 30, 15); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, W / 2, 25);
      }
    }

    drawTrails() {
      const ctx = this.ctx;
      for (const b of this.balls) {
        if (b.done || b.trail.length < 3) continue;
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
        ctx.beginPath();
        // stop just short of the ball so the line doesn't cross it
        b.trail.slice(0, -2).filter(([x, y]) => Math.hypot(x - b.x0, y - b.y0) > MODEL_MUZZLE * MODEL_SCALE).forEach(([x, y], n) => { const [px, py] = this.toScreen(x, y); n ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
        ctx.stroke();
      }
    }

    // Off the top of the screen: arrow with a height readout (same as 2D)
    drawOffTop() {
      const ctx = this.ctx;
      for (const b of this.balls) {
        if (b.done) continue;
        const [px, py] = this.toScreen(b.x, b.y);
        if (py > -6) continue;
        ctx.fillStyle = '#fde047';
        ctx.beginPath(); ctx.moveTo(px, 4); ctx.lineTo(px - 8, 18); ctx.lineTo(px + 8, 18); ctx.fill();
        ctx.font = '700 12px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
        ctx.fillText(`${Math.round(b.y)} m`, px, 32);
      }
    }

    // Team name + HP bar above each fort (the label half of the 2D drawCannon)
    drawLabel(i) {
      const ctx = this.ctx, c = this.world.cannons[i], o = this.cannonObjs[i];
      const team = this.teams[i] || { name: '' };
      const [px] = this.toScreen(c.x, c.y);
      const [, fTop] = this.toScreen(c.x, o ? o.poleTop[1] : c.ground + 12);
      const hpFrac = Math.max(0, this.hp[i]) / E.HP_MAX;
      const lblY = fTop - 26;
      ctx.font = '800 13px "Lilita One", "Outfit", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const name = team.name || '';
      const tw = Math.max(ctx.measureText(name).width + 18, 70);
      ctx.fillStyle = 'rgba(15,23,42,0.72)'; roundRect(ctx, px - tw / 2, lblY - 16, tw, 30, 8); ctx.fill();
      if (this.active === i && this.winner < 0) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2; roundRect(ctx, px - tw / 2, lblY - 16, tw, 30, 8); ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.fillText(name, px, lblY - 2);
      ctx.fillStyle = '#334155'; ctx.fillRect(px - tw / 2 + 7, lblY + 4, tw - 14, 5);
      ctx.fillStyle = hpFrac > 0.5 ? '#22c55e' : hpFrac > 0.25 ? '#facc15' : '#ef4444';
      ctx.fillRect(px - tw / 2 + 7, lblY + 4, (tw - 14) * hpFrac, 5);
      if (this.active === i && this.winner < 0) {
        const bob = Math.sin(this.time * 5) * 3;
        ctx.fillStyle = '#fde047';
        ctx.beginPath(); ctx.moveTo(px - 7, lblY - 26 + bob); ctx.lineTo(px + 7, lblY - 26 + bob); ctx.lineTo(px, lblY - 18 + bob); ctx.fill();
      }
    }
  }

  const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function stoneTexture() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#57534e'; ctx.fillRect(0, 0, 256, 256);
    const rnd = E.mulberry32(7);
    for (let r = 0; r < 8; r++) for (let k = -1; k < 4; k++) {
      const x = k * 64 + (r % 2 ? 32 : 0) + 2, y = r * 32 + 2, v = 108 + Math.floor(rnd() * 34);
      ctx.fillStyle = `rgb(${v + 12},${v + 8},${v + 4})`; ctx.fillRect(x, y, 60, 28);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1.2);
    return t;
  }

  // Simple stand-in if the GLB can't load (e.g. opened straight from disk)
  function fallbackModel() {
    const root = new THREE.Group();
    const iron = new THREE.MeshStandardMaterial({ name: 'CastIron', color: 0x1f2937, metalness: 0.7, roughness: 0.5 });
    const wood = new THREE.MeshStandardMaterial({ name: 'OakCarriage', color: 0x40240f, roughness: 0.85 });
    const car = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.55, 1.7), wood); car.position.set(0, 0.45, 0.5); car.name = 'Carriage';
    [[0.54, 1.3, 0.24], [0.54, -0.2, 0.21], [-0.54, 1.3, 0.24], [-0.54, -0.2, 0.21]].forEach(([x, z, r]) => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.12, 18).rotateZ(Math.PI / 2), wood); wh.position.set(x, r, z); root.add(wh);
    });
    const barrel = new THREE.Group(); barrel.name = 'Barrel'; barrel.position.set(0, MODEL_TRUNNION_Y, 1.1);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.28, 2.9, 24).rotateX(Math.PI / 2), iron); tube.position.z = 0.2;
    barrel.add(tube);
    root.add(car, barrel);
    return root;
  }

  E.Renderer = Renderer3D;
})();

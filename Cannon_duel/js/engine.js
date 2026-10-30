// Cannon Duel engine: seeded terrain, projectile physics (g = 10 m/s², no air resistance),
// the canvas renderer, particles, and synthesized sound. Shared by every game mode.
// Everything in the world is in meters and seconds; the renderer converts to pixels.
(function () {
  'use strict';

  const G = 10;              // m/s², the class value
  const WORLD_W = 320;       // m
  const RES = 0.5;           // m per heightmap sample
  const HP_MAX = 100;
  const PIVOT_H = 2;         // pivot height above the fort top (m)
  const FORT_HALF = 7;       // stone fort half-width; craters never dig into it
  const HIT_R = 4;           // direct-hit radius around the pivot (m)
  const PLAYBACK = 1.5;      // physics seconds shown per real second

  const AMMO = {
    std:    { key: 'std',    name: 'Cannonball',  icon: '●',   blast: 9,  dmg: 34, count: Infinity },
    heavy:  { key: 'heavy',  name: 'Heavy Shell', icon: '⬤',   blast: 15, dmg: 48, count: 2 },
    triple: { key: 'triple', name: 'Triple Shot', icon: '⁂',   blast: 7,  dmg: 20, count: 1, spread: 2.5 },
  };

  // Sabotage: once per battle a team can send a jam with any shot. On the other team's very next
  // turn, its cannon can't fire within JAM_DEG of the angle it launched at last time (exactly
  // JAM_DEG away is allowed). Everything is worked out from the shot list, so online play and
  // rejoining need no extra state.
  const JAM_DEG = 10;
  function jamFor(shots, idx) {
    const last = shots[shots.length - 1];
    if (!last || last.by === idx || !last.sabotage) return null;
    const prev = shots.filter((s) => s.by === idx && !s.skipped).pop();
    if (!prev) return null;
    return { idx, angle: prev.angle, lo: Math.max(0, prev.angle - JAM_DEG), hi: Math.min(90, prev.angle + JAM_DEG) };
  }
  const isJammed = (jam, angle) => !!jam && Math.round(Math.abs(angle - jam.angle) * 10) < JAM_DEG * 10;
  // "θ ≤ 35.0° or θ ≥ 55.0°": the angles that are still allowed
  function jamAllowed(jam) {
    const parts = [];
    if (jam.angle - JAM_DEG >= 0) parts.push(`θ ≤ ${(jam.angle - JAM_DEG).toFixed(1)}°`);
    if (jam.angle + JAM_DEG <= 90) parts.push(`θ ≥ ${(jam.angle + JAM_DEG).toFixed(1)}°`);
    return parts.join(' or ');
  }

  const TEAM_COLORS = {
    blue:   { main: '#3b82f6', dark: '#1d4ed8', light: '#93c5fd' },
    red:    { main: '#ef4444', dark: '#b91c1c', light: '#fca5a5' },
    green:  { main: '#22c55e', dark: '#15803d', light: '#86efac' },
    orange: { main: '#f97316', dark: '#c2410c', light: '#fdba74' },
    purple: { main: '#a855f7', dark: '#7e22ce', light: '#d8b4fe' },
    pink:   { main: '#ec4899', dark: '#be185d', light: '#f9a8d4' },
    teal:   { main: '#14b8a6', dark: '#0f766e', light: '#5eead4' },
    gold:   { main: '#eab308', dark: '#a16207', light: '#fde047' },
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const r1 = (v) => Math.round(v * 10) / 10;
  const deg = (v) => (Number.isInteger(r1(v)) ? r1(v).toFixed(0) : r1(v).toFixed(1)) + '°';
  const r2 = (v) => Math.round(v * 100) / 100;

  // ---------------------------------------------------------------- World
  class World {
    constructor(seed) {
      this.seed = seed >>> 0;
      const rnd = mulberry32(this.seed);
      this.W = WORLD_W;
      this.n = Math.round(WORLD_W / RES) + 1;
      this.theme = ['day', 'sunset', 'day', 'dusk', 'night'][Math.floor(rnd() * 5)];

      const xL = r1(22 + rnd() * 24), xR = r1(WORLD_W - (22 + rnd() * 24));
      const gL = r1(8 + rnd() * 42), gR = r1(8 + rnd() * 42);
      const hill = rnd() < 0.75
        ? { x: WORLD_W / 2 + (rnd() - 0.5) * 70, a: 25 + rnd() * 75, w: 16 + rnd() * 22 }
        : null;
      const base = 18 + rnd() * 14;
      const waves = [0, 1, 2].map((i) => ({
        amp: 2 + rnd() * (7 - i * 2),
        k: (2 * Math.PI) / (40 + rnd() * 110) * (i + 1),
        ph: rnd() * 6.283,
      }));

      const h = new Float64Array(this.n);
      for (let i = 0; i < this.n; i++) {
        const x = i * RES;
        let y = base;
        for (const w of waves) y += w.amp * Math.sin(w.k * x + w.ph);
        if (hill) y += hill.a * Math.exp(-((x - hill.x) ** 2) / (2 * hill.w * hill.w));
        for (const [xc, gc] of [[xL, gL], [xR, gR]]) {
          const d = Math.abs(x - xc);
          if (d < FORT_HALF + 2) y = gc;
          else if (d < FORT_HALF + 30) {
            const t = (d - FORT_HALF - 2) / 28, s = t * t * (3 - 2 * t);
            y = gc * (1 - s) + y * s;
          }
        }
        h[i] = r2(Math.max(4, y));
      }
      this.h = h;
      this.cannons = [
        { x: xL, ground: gL, y: r1(gL + PIVOT_H), dir: 1 },
        { x: xR, ground: gR, y: r1(gR + PIVOT_H), dir: -1 },
      ];
      this.craters = [];

      // Decoration (never affects physics)
      this.trees = [];
      for (let i = 0; i < 26; i++) {
        const x = 4 + rnd() * (WORLD_W - 8);
        if (Math.abs(x - xL) < FORT_HALF + 6 || Math.abs(x - xR) < FORT_HALF + 6) continue;
        this.trees.push({ x, s: 0.7 + rnd() * 0.6, kind: rnd() < 0.6 ? 'pine' : 'round', alive: true });
      }
      this.mountains = [0, 1].map((layer) => {
        const pts = [];
        for (let i = 0; i <= 24; i++) pts.push(0.25 + rnd() * 0.35 + (layer ? 0.1 : 0));
        return pts;
      });
      this.clouds = Array.from({ length: 6 }, () => ({ x: rnd(), y: 0.08 + rnd() * 0.3, s: 0.6 + rnd() * 0.8, v: 0.004 + rnd() * 0.006 }));
      this.stars = Array.from({ length: 90 }, () => ({ x: rnd(), y: rnd() * 0.7, s: rnd() * 1.6 + 0.3, p: rnd() * 6 }));
    }

    heightAt(x) {
      const f = x / RES;
      if (f <= 0) return this.h[0];
      if (f >= this.n - 1) return this.h[this.n - 1];
      const i = Math.floor(f), t = f - i;
      return this.h[i] * (1 - t) + this.h[i + 1] * t;
    }

    inFort(x) {
      return this.cannons.some((c) => Math.abs(x - c.x) < FORT_HALF + 1);
    }

    applyCrater(c) {
      const i0 = Math.max(0, Math.floor((c.x - c.r) / RES)), i1 = Math.min(this.n - 1, Math.ceil((c.x + c.r) / RES));
      for (let i = i0; i <= i1; i++) {
        const x = i * RES, dx = x - c.x;
        if (Math.abs(dx) >= c.r || this.inFort(x)) continue;
        const bottom = c.y - Math.sqrt(c.r * c.r - dx * dx);
        if (this.h[i] > bottom) this.h[i] = Math.max(1, bottom);
      }
      for (const t of this.trees) if (t.alive && Math.abs(t.x - c.x) < c.r * 0.9) t.alive = false;
      this.craters.push(c);
    }

    // One cannonball from cannon `idx`. Returns the sampled path and where it stops.
    simulate(idx, angleDeg, speed) {
      const c = this.cannons[idx];
      const th = (angleDeg * Math.PI) / 180;
      const vx = c.dir * speed * Math.cos(th), vy = speed * Math.sin(th);
      const pos = (t) => ({ x: c.x + vx * t, y: c.y + vy * t - 0.5 * G * t * t });
      const dt = 1 / 240;
      let impact = null;
      for (let t = dt; t < 60; t += dt) {
        const p = pos(t);
        for (let j = 0; j < 2; j++) {
          if (j === idx && t < 0.5) continue;
          const o = this.cannons[j];
          if (Math.hypot(p.x - o.x, p.y - o.y) < HIT_R) { impact = { ...p, t, type: 'cannon', target: j }; break; }
        }
        if (impact) break;
        if (p.x < -30 || p.x > WORLD_W + 30) { impact = { ...p, t, type: 'out' }; break; }
        if (p.y <= this.heightAt(p.x)) {
          let a = t - dt, b = t;
          for (let k = 0; k < 20; k++) {
            const m = (a + b) / 2, q = pos(m);
            if (q.y <= this.heightAt(q.x)) b = m; else a = m;
          }
          impact = { ...pos(b), t: b, type: 'ground' };
          break;
        }
      }
      if (!impact) impact = { ...pos(60), t: 60, type: 'out' };
      const tp = vy / G;
      const peak = tp > 0 && tp < impact.t ? { ...pos(tp), t: tp } : { x: c.x, y: c.y, t: 0 };
      return { impact: { x: r2(impact.x), y: r2(impact.y), t: r2(impact.t), type: impact.type, target: impact.target }, peak };
    }

    // Full shot: every ball, the damage to both cannons, and new craters. The shooter's
    // client computes this once; online it is stored so everyone replays the same result.
    resolveShot(idx, angle, speed, ammoKey) {
      const ammo = AMMO[ammoKey] || AMMO.std;
      const angles = ammo.spread ? [angle - ammo.spread, angle, angle + ammo.spread] : [angle];
      const impacts = [], craters = [], dmg = [0, 0];
      let peak = null;
      for (const a of angles) {
        const sim = this.simulate(idx, a, speed);
        const im = sim.impact;
        if (a === angle) peak = sim.peak;
        impacts.push({ ...im, angle: a });
        if (im.type === 'out') continue;
        for (let j = 0; j < 2; j++) {
          const o = this.cannons[j];
          const d = Math.hypot(im.x - o.x, im.y - o.y);
          if (im.type === 'cannon' && im.target === j) dmg[j] += ammo.dmg;
          else if (d < ammo.blast) dmg[j] += Math.round(ammo.dmg * 0.7 * (1 - d / ammo.blast));
        }
        craters.push({ x: im.x, y: im.y, r: r1(ammo.blast * 0.55) });
      }
      const main = impacts[ammoKey === 'triple' ? 1 : 0];
      const enemy = this.cannons[1 - idx], me = this.cannons[idx];
      const offset = main.type === 'out' ? null : r1((main.x - enemy.x) * me.dir);
      return {
        ammo: ammo.key, angle, speed, impacts, craters, dmg,
        offset,                                  // + long, − short (horizontal, m)
        direct: impacts.some((im) => im.type === 'cannon' && im.target === 1 - idx),
        range: main.type === 'out' ? null : r1(Math.abs(main.x - me.x)),
        flight: main.t, peak: peak ? r1(peak.y - me.y) : 0,
      };
    }

    // What the recon panel tells students: horizontal and vertical distance pivot to pivot.
    recon(idx) {
      const me = this.cannons[idx], en = this.cannons[1 - idx];
      return { dx: r1(Math.abs(en.x - me.x)), dy: r1(en.y - me.y) };
    }
  }

  // ---------------------------------------------------------------- Sound
  class Sound {
    constructor() {
      this.ctx = null;
      try { this.muted = localStorage.getItem('cd_muted') === '1'; } catch (e) { this.muted = false; }
      // A hidden tab pauses the animation, so silence everything until it's visible again
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) { this.stopWhistle(); this.ctx.suspend(); } else this.ctx.resume();
      });
    }
    ensure() {
      if (this.muted || this.quiet) return null;
      if (this.ctx) return this.ctx;
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
      return this.ctx;
    }
    toggle() {
      this.muted = !this.muted;
      try { localStorage.setItem('cd_muted', this.muted ? '1' : '0'); } catch (e) { /* storage blocked */ }
      if (this.whistleOsc) this.stopWhistle();
      return this.muted;
    }
    noise(dur, freq, gain, q = 1) {
      const ctx = this.ensure(); if (!ctx || this.muted) return;
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = gain;
      src.connect(f); f.connect(g); g.connect(ctx.destination); src.start();
    }
    tone(freq, dur, type = 'sine', gain = 0.2, slideTo = null, delay = 0) {
      const ctx = this.ensure(); if (!ctx || this.muted) return;
      const t0 = ctx.currentTime + delay;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    boom() { this.noise(0.5, 900, 0.9); this.tone(120, 0.35, 'sine', 0.6, 40); }
    explode(big) { this.noise(big ? 1.4 : 1.0, big ? 500 : 700, big ? 1.2 : 0.9); this.tone(80, 0.6, 'sine', 0.7, 30); }
    hit() { this.tone(660, 0.15, 'square', 0.12); this.tone(990, 0.25, 'square', 0.1, null, 0.1); }
    click() { this.tone(900, 0.05, 'triangle', 0.08); }
    jam() { this.noise(0.18, 3200, 0.35, 4); this.tone(1400, 0.22, 'square', 0.06, 260, 0.04); this.tone(180, 0.12, 'square', 0.12, null, 0.12); }
    turn() { this.tone(520, 0.12, 'triangle', 0.12); this.tone(780, 0.16, 'triangle', 0.1, null, 0.09); }
    win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.16, null, i * 0.13)); }
    lose() { [392, 330, 262].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.14, null, i * 0.18)); }
    startWhistle() {
      const ctx = this.ensure(); if (!ctx || this.muted) return;
      this.stopWhistle();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 1400; g.gain.value = 0.025;
      o.connect(g); g.connect(ctx.destination); o.start();
      this.whistleOsc = o; this.whistleGain = g;
    }
    setWhistle(frac) { if (this.whistleOsc) this.whistleOsc.frequency.value = 600 + 1000 * frac; }
    stopWhistle() { if (this.whistleOsc) { try { this.whistleOsc.stop(); } catch (e) { /* already stopped */ } this.whistleOsc = null; } }
  }

  // ---------------------------------------------------------------- Renderer
  const SKIES = {
    day:    { top: '#4aa3ff', bot: '#bfe6ff', mtn: ['#9bbbd8', '#7f9fbf'], sun: '#fff6b0', grass: '#4ade80', grassDk: '#16a34a', dirt: ['#a16207', '#713f12', '#3f2306'] },
    sunset: { top: '#5b3b9c', bot: '#ffb36b', mtn: ['#a86a8f', '#7c4a78'], sun: '#ffd27a', grass: '#84cc16', grassDk: '#4d7c0f', dirt: ['#9a5b2b', '#6b3a1c', '#36190a'] },
    dusk:   { top: '#1e2a5a', bot: '#d9708a', mtn: ['#5b4a78', '#3e3460'], sun: '#ffc6a0', grass: '#34d399', grassDk: '#047857', dirt: ['#7c4a2a', '#52301b', '#2a170b'] },
    night:  { top: '#050a1e', bot: '#1f2f5c', mtn: ['#25325a', '#1a2445'], sun: '#f1f5f9', grass: '#22c55e', grassDk: '#166534', dirt: ['#5c3a1e', '#3d2513', '#1c1009'] },
  };

  class Renderer {
    constructor(canvas, sound) {
      this.cv = canvas; this.ctx = canvas.getContext('2d');
      this.sound = sound;
      this.world = null;
      this.teams = [];
      this.hp = [HP_MAX, HP_MAX];
      this.aim = [{ angle: 45, speed: 40 }, { angle: 45, speed: 40 }];
      this.active = -1;           // whose barrel shows the aim guide
      this.jam = null;            // sabotage on the active cannon this turn (from jamFor)
      this.showAimGuide = true;
      this.measure = false;
      this.recoil = [0, 0];
      this.ghosts = [[], []];     // previous shot paths per cannon
      this.balls = [];
      this.parts = [];
      this.texts = [];
      this.markers = [];
      this.shake = 0;
      this.flash = 0;
      this.clock = null;          // flight clock readout
      this.cam = { s: 3, targetS: 3, focusY: 0 };
      this.winner = -1;
      this.time = 0;
      this.last = performance.now();
      this.resize();
      window.addEventListener('resize', () => this.resize());
      const loop = (now) => { this.frame(now); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }

    setWorld(world, teams) {
      this.world = world; this.teams = teams;
      this.sound.stopWhistle();
      this.ghosts = [[], []]; this.balls = []; this.parts = []; this.texts = []; this.markers = []; this.jam = null;
      this.winner = -1; this.clock = null; this.hp = [HP_MAX, HP_MAX];
      this.cam.s = this.cam.targetS = this.baseScale();
    }

    resize() {
      const r = this.cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.cv.width = Math.max(1, Math.round(r.width * dpr));
      this.cv.height = Math.max(1, Math.round(r.height * dpr));
      this.dpr = dpr; this.cw = r.width; this.ch = r.height;
      if (this.world) this.cam.s = this.cam.targetS = this.baseScale();
    }

    baseScale(extraY = 0) {
      const w = this.world;
      let maxY = 120;
      if (w) for (let i = 0; i < w.n; i += 8) maxY = Math.max(maxY, w.h[i] + 45);
      maxY = Math.max(maxY, extraY + 25);
      return Math.min(this.cw / (WORLD_W + 16), (this.ch - 14) / maxY);
    }

    toScreen(x, y) {
      const s = this.cam.s;
      return [this.cw / 2 + (x - WORLD_W / 2) * s, this.ch - 8 - y * s];
    }
    toWorld(px, py) {
      const s = this.cam.s;
      return [(px - this.cw / 2) / s + WORLD_W / 2, (this.ch - 8 - py) / s];
    }

    // Animate a resolved shot. Ball paths come from physics; each ball stops at the stored impact.
    playShot(idx, shot, onDone) {
      const w = this.world, c = w.cannons[idx];
      this.recoil[idx] = 1;
      this.sound.boom();
      this.sound.startWhistle();
      const th = (shot.angle * Math.PI) / 180;
      const tip = this.muzzle(idx, shot.angle);
      for (let i = 0; i < 14; i++) {
        this.parts.push({ x: tip.x, y: tip.y, vx: c.dir * Math.cos(th) * (6 + Math.random() * 10) + (Math.random() - 0.5) * 4,
          vy: Math.sin(th) * (6 + Math.random() * 10) + (Math.random() - 0.5) * 4, life: 0.9, max: 0.9, size: 1.4 + Math.random(), type: 'smoke' });
      }
      for (let i = 0; i < 8; i++) {
        this.parts.push({ x: tip.x, y: tip.y, vx: c.dir * Math.cos(th) * 18 + (Math.random() - 0.5) * 8, vy: Math.sin(th) * 18 + (Math.random() - 0.5) * 8,
          life: 0.25, max: 0.25, size: 1, type: 'fire' });
      }
      this.shake = Math.max(this.shake, 0.35);
      shot.impacts.forEach((im) => {
        const a = (im.angle * Math.PI) / 180;
        this.balls.push({ idx, x0: c.x, y0: c.y, vx: c.dir * shot.speed * Math.cos(a), vy: shot.speed * Math.sin(a),
          t: 0, tEnd: im.t, im, ammo: shot.ammo, trail: [], done: false });
      });
      this.pending = { idx, shot, onDone, remaining: this.balls.length };
      const main = shot.impacts[shot.ammo === 'triple' ? 1 : 0];
      this.ghostPath = { idx, angle: main.angle, speed: shot.speed, tEnd: main.t };
    }

    muzzle(idx, angle) {
      const c = this.world.cannons[idx], th = (angle * Math.PI) / 180;
      return { x: c.x + c.dir * Math.cos(th) * 4.2, y: c.y + Math.sin(th) * 4.2 };
    }

    ballLanded(b) {
      const im = b.im, w = this.world, ammo = AMMO[b.ammo];
      this.sound.stopWhistle();
      if (im.type !== 'out') {
        const big = b.ammo === 'heavy';
        this.sound.explode(big);
        this.flash = big ? 0.5 : 0.3;
        this.shake = Math.max(this.shake, big ? 1 : 0.6);
        const crater = { x: im.x, y: im.y, r: Math.round(ammo.blast * 5.5) / 10 };
        w.applyCrater(crater);
        const n = big ? 60 : 36;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI, sp = 8 + Math.random() * (big ? 30 : 22);
          this.parts.push({ x: im.x, y: im.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.2 + Math.random(), max: 2,
            size: 0.6 + Math.random() * 0.9, type: 'dirt', g: true, color: this.sky().dirt[Math.floor(Math.random() * 2)] });
        }
        for (let i = 0; i < n / 2; i++) {
          const a = Math.random() * Math.PI * 2, sp = Math.random() * 14;
          this.parts.push({ x: im.x, y: im.y + 1, vx: Math.cos(a) * sp, vy: Math.abs(Math.sin(a)) * sp, life: 0.5, max: 0.5, size: 2 + Math.random() * 2, type: 'fire' });
          this.parts.push({ x: im.x, y: im.y + 1, vx: (Math.random() - 0.5) * 6, vy: 2 + Math.random() * 6, life: 2.2, max: 2.2, size: 2.5 + Math.random() * 2, type: 'smoke' });
        }
        this.parts.push({ x: im.x, y: im.y, life: 0.35, max: 0.35, size: ammo.blast, type: 'ring' });
      } else {
        this.texts.push({ x: Math.max(8, Math.min(WORLD_W - 8, im.x)), y: Math.max(20, im.y), text: 'Off the map!', color: '#fff', life: 1.6, max: 1.6 });
      }
      this.pending.remaining--;
      if (this.pending.remaining <= 0) setTimeout(() => this.finishShot(), 450);
    }

    finishShot() {
      const p = this.pending; if (!p) return;
      this.pending = null; this.clock = null;
      const { idx, shot } = p;
      if (this.ghostPath) {
        this.ghosts[idx].push(this.ghostPath);
        if (this.ghosts[idx].length > 3) this.ghosts[idx].shift();
        this.ghostPath = null;
      }
      const main = shot.impacts[shot.ammo === 'triple' ? 1 : 0];
      if (shot.direct) { this.sound.hit(); this.texts.push({ x: this.world.cannons[1 - idx].x, y: this.world.cannons[1 - idx].y + 16, text: 'DIRECT HIT!', color: '#fde047', life: 2, max: 2, big: true }); }
      if (main.type !== 'out') {
        this.markers = this.markers.filter((m) => m.idx !== idx);
        this.markers.push({ idx, x: main.x, y: main.y, label: shot.offset === null || shot.direct ? '' : (Math.abs(shot.offset) < 0.05 ? 'on target' : `${Math.abs(shot.offset).toFixed(1)} m ${shot.offset > 0 ? 'long' : 'short'}`) });
      }
      shot.dmg.forEach((d, j) => {
        if (d > 0) {
          const c = this.world.cannons[j];
          this.texts.push({ x: c.x, y: c.y + 9, text: `−${d}`, color: j === idx ? '#fb923c' : '#f87171', life: 1.8, max: 1.8, big: true });
        }
      });
      p.onDone && p.onDone();
    }

    burst(idx) {
      const c = this.world.cannons[idx];
      for (let i = 0; i < 60; i++) {
        const a = Math.random() * Math.PI, sp = 6 + Math.random() * 20;
        this.parts.push({ x: c.x, y: c.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.5 + Math.random(), max: 2.5, size: 0.8 + Math.random(), type: 'dirt', g: true, color: '#44403c' });
      }
      this.shake = 1.2; this.flash = 0.6;
    }

    confetti() {
      const cols = ['#f43f5e', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#fb923c'];
      const [, top] = this.toWorld(0, 0);
      for (let i = 0; i < 160; i++) {
        this.parts.push({ x: Math.random() * WORLD_W, y: top + Math.random() * 20, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 5,
          life: 4 + Math.random() * 2, max: 6, size: 0.8 + Math.random() * 0.6, type: 'confetti', color: cols[i % cols.length], spin: Math.random() * 6 });
      }
    }

    sky() { return SKIES[this.world ? this.world.theme : 'day']; }

    // ------------------------------------------------ frame
    frame(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now; this.time += dt;
      if (!this.world) return;
      this.update(dt);
      this.draw();
    }

    update(dt) {
      let highest = 0;
      for (const b of this.balls) {
        if (b.done) continue;
        b.t = Math.min(b.tEnd, b.t + dt * PLAYBACK);
        b.x = b.x0 + b.vx * b.t; b.y = b.y0 + b.vy * b.t - 0.5 * G * b.t * b.t;
        b.trail.push([b.x, b.y]);
        if (b.trail.length > 400) b.trail.shift();
        if (Math.random() < 0.6) this.parts.push({ x: b.x, y: b.y, vx: 0, vy: 0.5, life: 0.7, max: 0.7, size: 0.7, type: 'puff' });
        highest = Math.max(highest, b.y);
        this.clock = b.t;
        if (b.t >= b.tEnd) { b.done = true; this.ballLanded(b); }
      }
      if (this.balls.length && this.balls.every((b) => b.done)) this.balls = [];
      if (!this.balls.length) this.sound.stopWhistle();
      if (this.balls.length) {
        const vy = this.balls[0].vy - G * this.balls[0].t;
        this.sound.setWhistle(Math.max(0, Math.min(1, 0.5 + vy / 80)));
      }
      this.cam.targetS = this.baseScale(highest);
      this.cam.s += (this.cam.targetS - this.cam.s) * Math.min(1, dt * 3);

      for (const p of this.parts) {
        p.life -= dt;
        if (p.type === 'ring') continue;
        if (p.g) p.vy -= G * 1.5 * dt;
        if (p.type === 'smoke') { p.vx *= 0.97; p.vy *= 0.97; p.size += dt * 2.2; }
        if (p.type === 'confetti') { p.vy = Math.max(p.vy - 4 * dt, -6); p.vx += Math.sin(this.time * 3 + p.spin) * 0.2; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.type === 'dirt' && p.y < this.world.heightAt(p.x)) { p.y = this.world.heightAt(p.x); p.vx *= 0.3; p.vy = 0; }
      }
      this.parts = this.parts.filter((p) => p.life > 0);
      for (const t of this.texts) { t.life -= dt; t.y += dt * 5; }
      this.texts = this.texts.filter((t) => t.life > 0);
      this.recoil = this.recoil.map((r) => Math.max(0, r - dt * 3));
      this.shake = Math.max(0, this.shake - dt * 2);
      this.flash = Math.max(0, this.flash - dt * 2);
    }

    draw() {
      const ctx = this.ctx, w = this.world, sk = this.sky();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const W = this.cw, H = this.ch;
      // Sky
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, sk.top); g.addColorStop(1, sk.bot);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (w.theme === 'night' || w.theme === 'dusk') {
        for (const s of w.stars) {
          ctx.globalAlpha = (w.theme === 'night' ? 0.9 : 0.4) * (0.6 + 0.4 * Math.sin(this.time * 2 + s.p));
          ctx.fillStyle = '#fff'; ctx.fillRect(s.x * W, s.y * H, s.s, s.s);
        }
        ctx.globalAlpha = 1;
      }
      // Sun / moon
      const sunX = W * (w.theme === 'sunset' ? 0.78 : 0.82), sunY = H * (w.theme === 'sunset' ? 0.42 : 0.16);
      const sg = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 70);
      sg.addColorStop(0, sk.sun); sg.addColorStop(0.35, sk.sun + 'aa'); sg.addColorStop(1, sk.sun + '00');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sunX, sunY, 70, 0, 7); ctx.fill();
      ctx.fillStyle = sk.sun; ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, 7); ctx.fill();
      if (w.theme === 'night') { ctx.fillStyle = sk.top; ctx.beginPath(); ctx.arc(sunX + 9, sunY - 6, 19, 0, 7); ctx.fill(); }
      // Mountains (parallax layers fixed to the screen)
      w.mountains.forEach((pts, li) => {
        ctx.fillStyle = sk.mtn[li];
        ctx.beginPath(); ctx.moveTo(0, H);
        pts.forEach((p, i) => ctx.lineTo((i / (pts.length - 1)) * W, H - H * p * (li ? 0.75 : 1) - 20));
        ctx.lineTo(W, H); ctx.fill();
      });
      // Clouds
      for (const c of w.clouds) {
        const cx = ((c.x + this.time * c.v) % 1.2 - 0.1) * W, cy = c.y * H, s = c.s * 26;
        ctx.fillStyle = w.theme === 'night' ? 'rgba(148,163,184,0.25)' : 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(cx, cy, s, 0, 7); ctx.arc(cx + s, cy - s * 0.4, s * 1.2, 0, 7); ctx.arc(cx + s * 2.1, cy, s * 0.9, 0, 7);
        ctx.fill();
      }

      ctx.save();
      if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake * 14, (Math.random() - 0.5) * this.shake * 14);

      this.drawGhosts();
      this.drawTerrain();
      if (this.measure) this.drawMeasure();
      for (let i = 0; i < 2; i++) this.drawCannon(i);
      this.drawMarkers();
      this.drawJam();
      this.drawAimGuide();
      this.drawParticles(['smoke', 'puff']);
      this.drawBalls();
      this.drawParticles(['fire', 'dirt', 'ring', 'confetti']);
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

    drawTerrain() {
      const ctx = this.ctx, w = this.world, sk = this.sky(), H = this.ch;
      const [x0] = this.toWorld(0, 0), [x1] = this.toWorld(this.cw, 0);
      const step = Math.max(RES, 1 / this.cam.s);
      ctx.beginPath();
      let first = true;
      for (let x = x0 - 2; x <= x1 + 2; x += step) {
        const [px, py] = this.toScreen(x, w.heightAt(x));
        if (first) { ctx.moveTo(px, H + 5); ctx.lineTo(px, py); first = false; } else ctx.lineTo(px, py);
      }
      const [pe] = this.toScreen(x1 + 2, 0);
      ctx.lineTo(pe, H + 5); ctx.closePath();
      const [, gTop] = this.toScreen(0, 80);
      const dg = ctx.createLinearGradient(0, gTop, 0, H);
      dg.addColorStop(0, sk.dirt[0]); dg.addColorStop(0.55, sk.dirt[1]); dg.addColorStop(1, sk.dirt[2]);
      ctx.fillStyle = dg; ctx.fill();
      // Grass edge
      ctx.save(); ctx.clip();
      ctx.strokeStyle = sk.grass; ctx.lineWidth = Math.max(4, this.cam.s * 1.6); ctx.lineJoin = 'round';
      ctx.beginPath(); first = true;
      for (let x = x0 - 2; x <= x1 + 2; x += step) {
        const [px, py] = this.toScreen(x, w.heightAt(x));
        if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.strokeStyle = sk.grassDk; ctx.lineWidth = Math.max(2, this.cam.s * 0.6);
      ctx.translate(0, Math.max(4, this.cam.s * 1.6) * 0.6); ctx.stroke();
      ctx.restore();
      // Trees
      for (const t of w.trees) {
        if (!t.alive) continue;
        const [px, py] = this.toScreen(t.x, w.heightAt(t.x) - 0.3);
        const s = this.cam.s * t.s;
        ctx.fillStyle = '#5b3a1e'; ctx.fillRect(px - s * 0.4, py - s * 3, s * 0.8, s * 3);
        ctx.fillStyle = w.theme === 'night' ? '#14532d' : (t.kind === 'pine' ? '#15803d' : '#16a34a');
        if (t.kind === 'pine') {
          for (let k = 0; k < 3; k++) {
            ctx.beginPath(); ctx.moveTo(px - s * (3 - k * 0.6), py - s * (2.4 + k * 2.2)); ctx.lineTo(px + s * (3 - k * 0.6), py - s * (2.4 + k * 2.2));
            ctx.lineTo(px, py - s * (6 + k * 2.4)); ctx.fill();
          }
        } else {
          ctx.beginPath(); ctx.arc(px, py - s * 5, s * 3, 0, 7); ctx.arc(px - s * 1.8, py - s * 3.6, s * 2, 0, 7); ctx.arc(px + s * 1.8, py - s * 3.6, s * 2, 0, 7); ctx.fill();
        }
      }
      // Stone forts
      for (const c of w.cannons) {
        const [lx, ty] = this.toScreen(c.x - FORT_HALF, c.ground), [rx, by] = this.toScreen(c.x + FORT_HALF, c.ground - 5);
        ctx.fillStyle = '#78716c'; ctx.fillRect(lx, ty, rx - lx, by - ty);
        ctx.strokeStyle = '#57534e'; ctx.lineWidth = 1;
        const rows = 3, rh = (by - ty) / rows;
        for (let r = 0; r < rows; r++) {
          ctx.beginPath(); ctx.moveTo(lx, ty + r * rh); ctx.lineTo(rx, ty + r * rh); ctx.stroke();
          const bw = (rx - lx) / 4;
          for (let k = 0; k <= 4; k++) { const bx = lx + k * bw + (r % 2 ? bw / 2 : 0); if (bx < rx) { ctx.beginPath(); ctx.moveTo(bx, ty + r * rh); ctx.lineTo(bx, ty + (r + 1) * rh); ctx.stroke(); } }
        }
        ctx.fillStyle = '#a8a29e'; ctx.fillRect(lx, ty - 2, rx - lx, 3);
      }
    }

    drawCannon(i) {
      const ctx = this.ctx, w = this.world, c = w.cannons[i];
      const team = this.teams[i] || { name: '', color: i ? 'red' : 'blue' };
      const col = TEAM_COLORS[team.color] || TEAM_COLORS.blue;
      const k = Math.max(this.cam.s * 1.7, 6);          // px per meter for the cannon drawing (drawn larger than life)
      const [px, py] = this.toScreen(c.x, c.y);
      const [, gy] = this.toScreen(c.x, c.ground);
      const dead = this.hp[i] <= 0;
      const aim = this.aim[i];
      const th = (aim.angle * Math.PI) / 180;

      // Flag
      const fx = px - c.dir * 5 * k, fTop = gy - 11 * k;
      ctx.strokeStyle = '#e7e5e4'; ctx.lineWidth = Math.max(1.5, k * 0.25);
      ctx.beginPath(); ctx.moveTo(fx, gy); ctx.lineTo(fx, fTop); ctx.stroke();
      ctx.fillStyle = dead ? '#57534e' : col.main;
      ctx.beginPath(); ctx.moveTo(fx, fTop);
      for (let s = 0; s <= 8; s++) {
        const fxs = fx + c.dir * s * 0.5 * k;
        ctx.lineTo(fxs, fTop + Math.sin(this.time * 6 + s) * 0.35 * k * (s / 8));
      }
      ctx.lineTo(fx, fTop + 2.6 * k); ctx.fill();

      // Barrel
      ctx.save(); ctx.translate(px, py);
      ctx.scale(c.dir, 1);
      ctx.rotate(-(dead ? -0.35 : th));
      const rec = this.recoil[i] * 1.2 * k;
      const bl = 5 * k, bw = 1.7 * k;
      const bg = ctx.createLinearGradient(0, -bw / 2, 0, bw / 2);
      bg.addColorStop(0, '#6b7280'); bg.addColorStop(0.4, '#1f2937'); bg.addColorStop(1, '#030712');
      ctx.fillStyle = bg;
      roundRect(ctx, -1.6 * k - rec, -bw / 2, bl, bw, bw * 0.35); ctx.fill();
      ctx.fillStyle = col.main; ctx.fillRect(1.6 * k - rec, -bw / 2 - 0.15 * k, 0.45 * k, bw + 0.3 * k);
      ctx.fillStyle = '#111827'; roundRect(ctx, bl - 1.9 * k - rec, -bw / 2 - 0.25 * k, 0.6 * k, bw + 0.5 * k, 2); ctx.fill();
      ctx.restore();

      // Carriage + wheel
      ctx.fillStyle = dead ? '#44403c' : col.dark;
      ctx.beginPath();
      ctx.moveTo(px - 2.6 * k, gy - 0.6 * k); ctx.lineTo(px + 2.6 * k, gy - 0.6 * k); ctx.lineTo(px + 1.2 * k, py + 0.2 * k); ctx.lineTo(px - 1.2 * k, py + 0.2 * k);
      ctx.closePath(); ctx.fill();
      const wr = 1.35 * k, wx = px, wy = gy - wr * 0.85;
      ctx.fillStyle = '#3f2a14'; ctx.beginPath(); ctx.arc(wx, wy, wr, 0, 7); ctx.fill();
      ctx.strokeStyle = '#a16207'; ctx.lineWidth = Math.max(1, k * 0.22);
      ctx.beginPath(); ctx.arc(wx, wy, wr * 0.8, 0, 7); ctx.stroke();
      for (let s = 0; s < 6; s++) {
        const a = s * Math.PI / 3 + (dead ? 0.3 : 0);
        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * wr * 0.8, wy + Math.sin(a) * wr * 0.8); ctx.stroke();
      }
      ctx.fillStyle = col.light; ctx.beginPath(); ctx.arc(wx, wy, wr * 0.22, 0, 7); ctx.fill();
      if (dead && Math.random() < 0.3) this.parts.push({ x: c.x + (Math.random() - 0.5) * 3, y: c.y + 1, vx: (Math.random() - 0.5), vy: 3, life: 1.6, max: 1.6, size: 1.5, type: 'smoke' });

      // Name + HP above
      const hpFrac = Math.max(0, this.hp[i]) / HP_MAX;
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

    // Sabotage: a red wedge over the blocked launch angles (shown even with the aim arrow off)
    drawJam() {
      const j = this.jam;
      if (!j || this.active !== j.idx || this.balls.length || this.winner >= 0) return;
      const ctx = this.ctx, c = this.world.cannons[j.idx];
      const [px, py] = this.toScreen(c.x, c.y);
      const r = Math.max(this.cam.s, 3) * 34;
      const a0 = (j.lo * Math.PI) / 180, a1 = (j.hi * Math.PI) / 180;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(px, py);
      if (c.dir > 0) ctx.arc(px, py, r, -a1, -a0); else ctx.arc(px, py, r, Math.PI + a0, Math.PI + a1);
      ctx.closePath();
      ctx.fillStyle = `rgba(239,68,68,${0.32 + 0.1 * Math.sin(this.time * 4)})`; ctx.fill();
      ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
      // Label under the fort, where the aim labels never go
      ctx.font = '700 12px "JetBrains Mono", monospace'; ctx.textBaseline = 'middle';
      pill(ctx, `🔧 JAMMED ${deg(j.lo)}–${deg(j.hi)}`, px, py + Math.max(this.cam.s, 3) * 9, 0, '#fca5a5');
      ctx.restore();
    }

    drawAimGuide() {
      const i = this.active;
      if (i < 0 || !this.showAimGuide || this.balls.length || this.winner >= 0) return;
      const ctx = this.ctx, c = this.world.cannons[i], aim = this.aim[i];
      const blocked = this.jam && this.jam.idx === i && isJammed(this.jam, aim.angle);
      const th = (aim.angle * Math.PI) / 180;
      const [px, py] = this.toScreen(c.x, c.y);
      const k = Math.max(this.cam.s, 3);
      const len = (10 + aim.speed * 0.45) * k;
      const ex = px + c.dir * Math.cos(th) * len, ey = py - Math.sin(th) * len;
      ctx.save();
      ctx.strokeStyle = blocked ? '#f87171' : 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.5; ctx.setLineDash([7, 6]);
      ctx.lineDashOffset = -this.time * 20;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.setLineDash([]);
      const ah = 10;
      ctx.fillStyle = blocked ? '#f87171' : '#fff';
      ctx.beginPath(); ctx.moveTo(ex, ey);
      ctx.lineTo(ex - c.dir * Math.cos(th - 0.4) * ah, ey + Math.sin(th - 0.4) * ah);
      ctx.lineTo(ex - c.dir * Math.cos(th + 0.4) * ah, ey + Math.sin(th + 0.4) * ah); ctx.fill();
      // Horizontal reference + angle arc
      const ar = 9 * k;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + c.dir * ar * 1.4, py); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
      ctx.beginPath();
      if (c.dir > 0) ctx.arc(px, py, ar, -th, 0); else ctx.arc(px, py, ar, Math.PI, Math.PI + th);
      ctx.stroke();
      ctx.font = '700 13px "JetBrains Mono", monospace'; ctx.textBaseline = 'middle';
      const lx = px + c.dir * (ar + 10) * Math.cos(th / 2), ly = py - (ar + 10) * Math.sin(th / 2);
      ctx.textAlign = c.dir > 0 ? 'left' : 'right';
      pill(ctx, `θ = ${aim.angle.toFixed(1)}°`, lx, ly, c.dir);
      ctx.textAlign = c.dir > 0 ? 'left' : 'right';
      drawSubLabel(ctx, ex + c.dir * 8, ey - 10, 'v', '0', ` = ${aim.speed.toFixed(1)} m/s`, c.dir);
      ctx.restore();
    }

    drawGhosts() {
      const ctx = this.ctx, w = this.world;
      for (let i = 0; i < 2; i++) {
        const col = (TEAM_COLORS[(this.teams[i] || {}).color] || TEAM_COLORS.blue).light;
        this.ghosts[i].forEach((gp, n) => {
          const c = w.cannons[i], th = (gp.angle * Math.PI) / 180;
          const vx = c.dir * gp.speed * Math.cos(th), vy = gp.speed * Math.sin(th);
          ctx.strokeStyle = col; ctx.globalAlpha = 0.35 + 0.45 * (n + 1) / this.ghosts[i].length;
          ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]);
          ctx.beginPath();
          for (let t = 0; t <= gp.tEnd; t += 0.05) {
            const [px, py] = this.toScreen(c.x + vx * t, c.y + vy * t - 5 * t * t);
            t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        });
      }
    }

    drawBalls() {
      const ctx = this.ctx;
      for (const b of this.balls) {
        if (b.done) continue;
        if (b.trail.length > 1) {
          ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
          ctx.beginPath();
          b.trail.forEach(([x, y], n) => { const [px, py] = this.toScreen(x, y); n ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
          ctx.stroke();
        }
        const [px, py] = this.toScreen(b.x, b.y);
        const r = Math.max(b.ammo === 'heavy' ? 7 : 5.5, this.cam.s * (b.ammo === 'heavy' ? 1.6 : 1.2));
        if (py < -r) {
          // Off the top: arrow with height readout
          ctx.fillStyle = '#fde047';
          ctx.beginPath(); ctx.moveTo(px, 4); ctx.lineTo(px - 8, 18); ctx.lineTo(px + 8, 18); ctx.fill();
          ctx.font = '700 12px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
          ctx.fillText(`${Math.round(b.y)} m`, px, 32);
          continue;
        }
        const g = ctx.createRadialGradient(px - r * 0.35, py - r * 0.35, r * 0.1, px, py, r);
        g.addColorStop(0, b.ammo === 'heavy' ? '#fca5a5' : '#9ca3af'); g.addColorStop(1, b.ammo === 'heavy' ? '#7f1d1d' : '#111827');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
      }
    }

    drawParticles(types) {
      const ctx = this.ctx, s = this.cam.s;
      for (const p of this.parts) {
        if (!types.includes(p.type)) continue;
        const [px, py] = this.toScreen(p.x, p.y);
        const a = Math.max(0, p.life / p.max);
        if (p.type === 'smoke' || p.type === 'puff') {
          ctx.fillStyle = `rgba(${p.type === 'puff' ? '230,230,230' : '120,113,108'},${a * (p.type === 'puff' ? 0.35 : 0.45)})`;
          ctx.beginPath(); ctx.arc(px, py, Math.max(1.5, p.size * s), 0, 7); ctx.fill();
        } else if (p.type === 'fire') {
          ctx.fillStyle = `rgba(255,${Math.round(120 + 120 * a)},40,${a})`;
          ctx.beginPath(); ctx.arc(px, py, Math.max(2, p.size * s * a), 0, 7); ctx.fill();
        } else if (p.type === 'dirt') {
          ctx.fillStyle = p.color; ctx.globalAlpha = Math.min(1, a * 2);
          const sz = Math.max(2, p.size * s); ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz); ctx.globalAlpha = 1;
        } else if (p.type === 'ring') {
          const prog = 1 - a;
          ctx.strokeStyle = `rgba(255,255,220,${a})`; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(px, py, p.size * s * (0.3 + prog), 0, 7); ctx.stroke();
          ctx.fillStyle = `rgba(255,220,120,${a * 0.6})`; ctx.beginPath(); ctx.arc(px, py, p.size * s * 0.7 * (0.5 + prog), 0, 7); ctx.fill();
        } else if (p.type === 'confetti') {
          ctx.save(); ctx.translate(px, py); ctx.rotate(this.time * 4 + p.spin);
          ctx.fillStyle = p.color; ctx.fillRect(-4, -2.5, 8, 5); ctx.restore();
        }
      }
    }

    drawMarkers() {
      const ctx = this.ctx;
      for (const m of this.markers) {
        if (!m.label) continue;
        const [px, py] = this.toScreen(m.x, m.y);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 26); ctx.stroke();
        ctx.fillStyle = (TEAM_COLORS[(this.teams[m.idx] || {}).color] || TEAM_COLORS.blue).main; ctx.beginPath(); ctx.moveTo(px, py - 26); ctx.lineTo(px + 12, py - 21); ctx.lineTo(px, py - 16); ctx.fill();
        ctx.font = '700 12px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        pill(ctx, m.label, px, py - 40, 0);
      }
    }

    drawMeasure() {
      const ctx = this.ctx, w = this.world;
      const i = this.active >= 0 ? this.active : 0;
      const me = w.cannons[i], en = w.cannons[1 - i];
      const [ax, ay] = this.toScreen(me.x, me.y), [bx, by] = this.toScreen(en.x, en.y);
      const rec = w.recon(i);
      ctx.save();
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2; ctx.setLineDash([8, 5]);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, ay); ctx.lineTo(bx, by); ctx.stroke();
      ctx.setLineDash([]);
      [[ax, ay], [bx, ay], [bx, by]].forEach(([x, y]) => { ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); });
      ctx.font = '700 13px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      pill(ctx, `Δx = ${rec.dx.toFixed(1)} m`, (ax + bx) / 2, ay + 16, 0, '#fde047');
      if (Math.abs(rec.dy) >= 0.05) {
        ctx.textAlign = me.dir > 0 ? 'left' : 'right';
        pill(ctx, `Δy = ${rec.dy > 0 ? '+' : ''}${rec.dy.toFixed(1)} m`, bx + me.dir * 10, (ay + by) / 2, me.dir, '#fde047');
      }
      ctx.restore();
    }

    drawTexts() {
      const ctx = this.ctx;
      for (const t of this.texts) {
        const [px, py] = this.toScreen(t.x, t.y);
        const a = Math.min(1, t.life / t.max * 2);
        ctx.globalAlpha = a;
        ctx.font = `${t.big ? 26 : 18}px "Lilita One", "Outfit", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(15,23,42,0.85)'; ctx.strokeText(t.text, px, py);
        ctx.fillStyle = t.color; ctx.fillText(t.text, px, py);
        ctx.globalAlpha = 1;
      }
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // Text in a dark pill. align: 1 = starts at x, −1 = ends at x, 0 = centered.
  function pill(ctx, text, x, y, align, color = '#fff') {
    const w = ctx.measureText(text).width + 14;
    let left = align > 0 ? x : align < 0 ? x - w : x - w / 2;
    left = Math.max(4, Math.min(ctx.canvas.width / ctx.getTransform().a - w - 4, left));
    ctx.fillStyle = 'rgba(15,23,42,0.78)'; roundRect(ctx, left, y - 11, w, 22, 11); ctx.fill();
    ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.fillText(text, left + 7, y);
  }

  // "v₀ = 42.0 m/s" with a real subscript drawn smaller and lower.
  function drawSubLabel(ctx, x, y, base, sub, rest, align) {
    const big = '700 13px "JetBrains Mono", monospace', small = '700 9px "JetBrains Mono", monospace';
    ctx.font = big; const wb = ctx.measureText(base).width, wr = ctx.measureText(rest).width;
    ctx.font = small; const ws = ctx.measureText(sub).width;
    const w = wb + ws + wr + 14;
    const left = align > 0 ? x : x - w;
    ctx.fillStyle = 'rgba(15,23,42,0.78)'; roundRect(ctx, left, y - 11, w, 22, 11); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = big; ctx.fillText(base, left + 7, y);
    ctx.font = small; ctx.fillText(sub, left + 7 + wb, y + 4);
    ctx.font = big; ctx.fillText(rest, left + 7 + wb + ws, y);
  }

  // ---------------------------------------------------------------- CPU aiming
  // Finds a speed that lands on the enemy for a chosen angle (by simulation, so hills count),
  // then adds an error that shrinks with every shot it takes.
  // When jammed it only tries allowed angles, and a forced new angle costs it some accuracy.
  function cpuAim(world, idx, diff, shotNum, jam) {
    const en = world.cannons[1 - idx];
    const tryAngles = [];
    for (let a = jam ? 10 : 25; a <= (jam ? 80 : 75); a += 2.5) if (!isJammed(jam, a)) tryAngles.push(a);
    let best = null;
    for (const a of tryAngles) {
      let lo = 5, hi = 80;          // the same speed limit as the slider
      for (let k = 0; k < 28; k++) {
        const m = (lo + hi) / 2, im = world.simulate(idx, a, m).impact;
        const reach = im.type === 'out' ? 1e9 : (im.x - world.cannons[idx].x) * world.cannons[idx].dir;
        if (reach < (en.x - world.cannons[idx].x) * world.cannons[idx].dir) lo = m; else hi = m;
      }
      const sp = (lo + hi) / 2, im = world.simulate(idx, a, sp).impact;
      const err = im.type === 'cannon' && im.target === 1 - idx ? 0 : Math.hypot(im.x - en.x, im.y - en.y);
      if (!best || err < best.err - 0.5 || (Math.abs(err - best.err) < 0.5 && Math.abs(a - 45) < Math.abs(best.a - 45))) best = { a, sp, err };
    }
    const spread = { easy: 0.14, medium: 0.07, hard: 0.03 }[diff] || 0.07;
    const learn = { easy: 0.85, medium: 0.7, hard: 0.55 }[diff] || 0.7;
    const sd = spread * Math.pow(learn, Math.max(0, shotNum - (jam ? 2 : 0)));
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 0.5;
    let angle = Math.max(5, Math.min(85, Math.round((best.a + gauss() * sd * 30) * 2) / 2));
    if (isJammed(jam, angle)) angle = best.a;
    const speed = Math.max(5, Math.round(best.sp * (1 + gauss() * sd) * 2) / 2);
    return { angle, speed };
  }

  window.CannonEngine = { G, WORLD_W, HP_MAX, PLAYBACK, AMMO, TEAM_COLORS, JAM_DEG, World, Renderer, Sound, cpuAim, jamFor, isJammed, jamAllowed, mulberry32 };
})();

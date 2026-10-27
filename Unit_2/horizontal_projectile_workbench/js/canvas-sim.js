// Horizontal Projectile Workbench — HTML5 Canvas apparatus renderer
// Draws the cliff with its height ruler, the launcher + photogate display, the floor runway ruler,
// the target bucket, the flight timer, and the flight: parabola trail, numbered strobe ghosts
// (equal sideways steps, growing downward steps), landing marks from earlier trials,
// the measuring crosshair, optional velocity vectors, and the 2.5× optical loupe.
// World units are meters, with x = 0 at the cliff face and y = 0 at the floor.

(function () {
  const { Phys, fmt } = window.Engine;
  const STEPS = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
  const DECIMAL = [0.01, 0.1, 1, 10];
  const isMultiple = (v, step) => Math.abs(v / step - Math.round(v / step)) < 1e-6;
  const decimalsFor = step => step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
  const fmtTick = v => String(Number(v.toFixed(3)));
  // Number every 10th tick, unless that leaves fewer than 3 numbers on the ruler: then every 5th, 2nd or every tick
  const labelEvery = (span, step, scale, minPx) => [10, 5, 2, 1].find(n => span / (n * step) >= 3 && n * step * scale >= minPx) || 10;

  class ProjectileStage {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.buffer = document.createElement('canvas');
      this.cfg = null;
      this.flight = null;      // { vx, t, T, ghosts: [], onLand }
      this.rest = null;        // where the ball came to rest after a launch (or a saved strobe photo)
      this.particles = [];
      this.loupe = null;       // { x, y } in CSS px, set by measurement-tool.js
      this.highlightBucket = false;
      this.showStrobe = true;
      this.refreshPalette();
      this.resize();
    }

    refreshPalette() {
      const cs = getComputedStyle(document.documentElement);
      const v = name => cs.getPropertyValue(name).trim();
      this.pal = {
        sky: v('--canvas-bg'), ink: v('--canvas-text'), dim: v('--text-dim'),
        cliff: v('--canvas-cliff'), cliffEdge: v('--canvas-cliff-edge'),
        ground: v('--canvas-ground'), ruler: v('--canvas-ruler'), rulerInk: v('--canvas-ruler-ink'),
        x: v('--accent-x'), y: v('--accent-y'), vec: v('--accent-v'),
        bucket: v('--bucket'), led: v('--led-bg'), ledText: v('--led-text'),
        launcher: v('--canvas-launcher'), ball: v('--canvas-ball'), red: '#dc2626', ghost: v('--canvas-ghost'),
        glow: v('--accent-violet')
      };
    }

    resize() {
      const r = this.canvas.parentElement.getBoundingClientRect();
      const w = Math.max(320, Math.floor(r.width));
      const h = Math.max(300, Math.floor(r.height));
      const dpr = window.devicePixelRatio || 1;
      this.W = w; this.H = h; this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.layout();
    }

    // cfg: { dy, runway, tol, launchVx|null, bucketX, bucketLocked, noBucket, hideTarget, vectors,
    //        strobeDt, numberGhosts, photoVx, crosshair:{x,y}, highlightGhost, highlight, timer,
    //        marks:[{x,label}], pastPaths:[vx] }
    setScenario(cfg) {
      this.cfg = Object.assign({
        launchVx: null, bucketLocked: false, noBucket: false, hideTarget: false, vectors: false,
        strobeDt: null, numberGhosts: false, photoVx: null, crosshair: null, highlightGhost: null,
        highlight: null, practice: null, readPoint: null, timer: false, marks: [], pastPaths: [], tol: 0.1, bucketX: 0
      }, cfg);
      this.flight = null;
      this.rest = null;
      this.particles = [];
      this.layout();
      if (this.cfg.photoVx) this.showPhoto(this.cfg.photoVx);
    }

    layout() {
      if (!this.cfg) return;
      const { W, H } = this;
      this.fs = Math.min(1.7, Math.max(1, W / 900));           // canvas text scale (projector mode)
      this.rulerW = 54 * this.fs;
      this.left = 8;
      this.cliffLeft = this.left + this.rulerW + 4;
      this.x0 = this.cliffLeft + 74 * this.fs;                   // world x = 0 (cliff face)
      this.floorY = H - 58 * this.fs;
      this.top = 70 * this.fs;                                   // room for the photogate display
      const availX = W - this.x0 - 26;
      const availY = this.floorY - this.top;
      this.scale = Math.min(availX / this.cfg.runway, availY / this.cfg.dy);
      this.runwayShown = availX / this.scale;

      // Height ruler: smallest tick that is ≥ 5 px apart AND lands exactly on the launch height
      // Prefer "decimal" ticks (0.01, 0.1, 1, 10 m): easiest to count. Use 2s and 5s only when those don't fit.
      const fitsY = s => s * this.scale >= 5 && isMultiple(this.cfg.dy, s);
      this.yStep = DECIMAL.find(fitsY) || STEPS.find(fitsY) || STEPS.find(s => s * this.scale >= 5) || 1;
      const fitsX = s => s * this.scale >= 5 && s * 10 * this.scale >= 46;
      this.xStep = DECIMAL.find(fitsX) || STEPS.find(fitsX) || 1;
      this.xEvery = labelEvery(this.runwayShown, this.xStep, this.scale, 30 * this.fs);
      this.yEvery = labelEvery(this.cfg.dy, this.yStep, this.scale, 16 * this.fs);
      // Bucket drag resolution and readout precision
      this.snap = this.runwayShown <= 10 ? 0.01 : 0.1;
    }

    X(xw) { return this.x0 + xw * this.scale; }
    Y(yw) { return this.floorY - yw * this.scale; }
    worldX(px) { return (px - this.x0) / this.scale; }
    worldY(py) { return (this.floorY - py) / this.scale; }

    // ---------- Regions (for the loupe, "click on…" tasks and highlights) ----------
    heightRect() {
      const yTop = this.Y(this.cfg.dy) - 26 * this.fs;
      return { x: this.left, y: yTop, w: this.rulerW, h: this.floorY - yTop };
    }
    floorRect() {
      const y = this.floorY + 24 * this.fs;
      return { x: this.x0 - 4, y, w: this.W - this.x0, h: this.H - y };
    }
    gateBox() {
      const w = 124 * this.fs, h = 40 * this.fs;
      return { x: Math.max(this.left, this.x0 - w + 10 * this.fs), y: this.Y(this.cfg.dy) - h - 20 * this.fs, w, h };
    }
    timerBox() {
      const w = 150 * this.fs, h = 44 * this.fs;
      return { x: this.W - w - 10, y: 10, w, h };
    }
    bucketRect() {
      const half = this.bucketHalfPx();
      const cx = this.X(this.cfg.bucketX);
      return { x: cx - half - 10, y: this.floorY - 44 * this.fs, w: 2 * half + 20, h: 80 * this.fs };
    }
    static inside(r, px, py, pad = 0) { return px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad; }

    regionAt(px, py) {
      if (!this.cfg) return null;
      const inside = ProjectileStage.inside;
      if (this.cfg.timer && inside(this.timerBox(), px, py, 4)) return 'timer';
      if (inside(this.gateBox(), px, py, 4)) return 'gate';
      if (inside(this.heightRect(), px, py, 6)) return 'height';
      if (!this.cfg.noBucket && inside(this.bucketRect(), px, py)) return 'bucket';
      if (py >= this.floorY + 20 * this.fs && px >= this.x0 - 10) return 'floor';
      if (px >= this.cliffLeft && px <= this.x0 && py >= this.Y(this.cfg.dy) - 14 * this.fs) return px >= this.x0 - 62 * this.fs && py <= this.Y(this.cfg.dy) + 14 * this.fs ? 'launcher' : 'cliff';
      return 'scene';
    }
    // Regions the loupe magnifies
    loupeRegion(px, py) {
      const r = this.regionAt(px, py);
      return r === 'height' || r === 'floor' || r === 'gate' || r === 'timer' ? r : null;
    }

    bucketHalfPx() { return Math.max(this.cfg.tol * this.scale, 14); }
    // Effective catch radius in meters: the visible mouth, never smaller than the ±3% window
    catchTol() { return this.bucketHalfPx() / this.scale; }

    // ---------- Flight ----------
    strobeDtFor(T) { return this.cfg.strobeDt || (T >= 1.5 ? 0.5 : 0.1); }

    ghostsFor(vx) {
      const T = Phys.time(this.cfg.dy);
      const dt = this.strobeDtFor(T);
      const out = [];
      for (let k = 1; k * dt <= T + 1e-9; k++) out.push({ x: vx * k * dt, y: Math.max(0, this.cfg.dy - 5 * (k * dt) ** 2) });
      return out;
    }

    // A finished launch, drawn without animating (restores a strobe photo after a reload)
    showPhoto(vx) {
      const T = Phys.time(this.cfg.dy);
      this.rest = { x: vx * T, y: 0, result: 'none', ghosts: this.ghostsFor(vx), vx, strobeDt: this.strobeDtFor(T), T };
    }

    launch(vx, onLand) {
      const T = Phys.time(this.cfg.dy);
      this.rest = null;
      this.particles = [];
      this.flight = { vx, t: 0, T, ghosts: [], strobeDt: this.strobeDtFor(T), onLand };
    }

    get flying() { return !!this.flight; }

    update(dt) {
      const f = this.flight;
      if (f) {
        const prev = f.t;
        f.t = Math.min(f.T, f.t + dt);
        // Drop a ghost each time the clock passes a strobe mark
        for (let k = Math.floor(prev / f.strobeDt + 1e-9) + 1; k * f.strobeDt <= f.t + 1e-9; k++) {
          const tk = k * f.strobeDt;
          f.ghosts.push({ x: f.vx * tk, y: Math.max(0, this.cfg.dy - 5 * tk * tk) });
        }
        if (f.t >= f.T) {
          const xLand = f.vx * f.T;
          const result = this.cfg.noBucket ? 'none' : this.judge(xLand);
          this.rest = { x: xLand, y: 0, result, ghosts: f.ghosts, vx: f.vx, strobeDt: f.strobeDt, T: f.T };
          this.flight = null;
          this.burst(xLand, result);
          if (f.onLand) f.onLand({ xLand, result, T: f.T });
        }
      }
      this.particles = this.particles.filter(p => (p.life -= dt) > 0);
      this.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; });
    }

    judge(xLand) {
      const miss = Math.abs(xLand - this.cfg.bucketX);
      const tol = this.catchTol();
      return miss <= tol ? 'hit' : miss <= tol * 3 ? 'rim' : 'miss';
    }

    burst(xw, result) {
      const px = this.X(xw), py = this.floorY;
      const hit = result === 'hit';
      const colors = hit ? ['#f59e0b', '#0284c7', '#16a34a', '#db2777', '#7c3aed'] : [this.pal.dim];
      const n = hit ? 70 : 14;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI * Math.random();
        const sp = (hit ? 180 : 60) + Math.random() * (hit ? 260 : 60);
        this.particles.push({ x: px, y: py - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1 + Math.random() * 0.8, c: colors[i % colors.length], s: hit ? 3 + Math.random() * 3 : 2 });
      }
    }

    // ---------- Drawing ----------
    draw() {
      const { ctx, dpr, W, H } = this;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = this.pal.sky;
      ctx.fillRect(0, 0, W, H);
      if (!this.cfg) return;

      this.drawGround();
      this.drawFloorRuler();
      this.drawCliff();
      this.drawHeightRuler();
      this.drawPastPaths();
      if (!this.cfg.noBucket) this.drawBucket();
      this.drawMarks();
      this.drawFlight();
      this.drawLauncher();
      if (this.cfg.timer) this.drawTimer();
      if (this.cfg.crosshair) this.drawCrosshair();
      if (this.cfg.readPoint && !this.flight) this.drawReadingStrips();
      if (this.cfg.highlight) this.drawHighlight(this.cfg.highlight);
      if (this.cfg.practice) this.drawPracticeArrow(this.cfg.practice);
      this.drawTickLegend();
      this.drawParticles();
      this.drawLegend();
      if (this.loupe) this.drawLoupe();
    }

    font(px, weight = 600, mono = false) {
      return `${weight} ${Math.round(px * this.fs)}px ${mono ? "'JetBrains Mono', ui-monospace, monospace" : "'Outfit', system-ui, sans-serif"}`;
    }

    pulse() { return 0.5 + 0.5 * Math.sin(performance.now() / 220); }

    drawGround() {
      const { ctx } = this;
      ctx.fillStyle = this.pal.ground;
      ctx.fillRect(0, this.floorY, this.W, 24 * this.fs);
      ctx.strokeStyle = this.pal.ink;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, this.floorY); ctx.lineTo(this.W, this.floorY); ctx.stroke();
    }

    currentGhosts() { return this.flight ? this.flight.ghosts : this.rest ? this.rest.ghosts : []; }

    drawFloorRuler() {
      const { ctx } = this;
      const r = this.floorRect();
      const y0 = r.y;
      ctx.fillStyle = this.pal.ruler;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = this.pal.rulerInk; ctx.fillStyle = this.pal.rulerInk;
      ctx.lineWidth = 1;
      const s = this.xStep;
      const n = Math.floor(this.runwayShown / s + 1e-6);
      ctx.font = this.font(12, 800);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const every = this.xEvery;
      for (let i = 0; i <= n; i++) {
        const px = Math.round(this.X(i * s)) + 0.5;
        const len = i % 10 === 0 ? 14 : i % 5 === 0 ? 9 : 5;
        ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px, y0 + len * this.fs); ctx.stroke();
        if (i % every === 0) ctx.fillText(fmt(i * s, decimalsFor(s * every)), px, y0 + 16 * this.fs);
      }
      ctx.textAlign = 'right';
      ctx.fillText('m', this.W - 4, y0 + 2);
      // Strobe projections onto the floor: equal sideways steps
      if (this.showStrobe && !this.cfg.numberGhosts) {
        ctx.fillStyle = this.pal.x;
        this.currentGhosts().forEach(p => this.tri(this.X(p.x), y0 - 1, 5 * this.fs, 'up'));
      }
    }

    drawCliff() {
      const { ctx } = this;
      const topY = this.Y(this.cfg.dy) + 9 * this.fs;
      const grad = ctx.createLinearGradient(this.cliffLeft, 0, this.x0, 0);
      grad.addColorStop(0, this.pal.cliff);
      grad.addColorStop(1, this.pal.cliffEdge);
      ctx.fillStyle = grad;
      ctx.fillRect(this.cliffLeft, topY, this.x0 - this.cliffLeft, this.floorY - topY);
      // Rock texture: a few horizontal strata lines
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      for (let y = topY + 14; y < this.floorY; y += 18) {
        ctx.beginPath(); ctx.moveTo(this.cliffLeft + 4, y); ctx.lineTo(this.x0 - 3, y + 3); ctx.stroke();
      }
      ctx.strokeStyle = this.pal.ink; ctx.lineWidth = 2;
      ctx.strokeRect(this.cliffLeft, topY, this.x0 - this.cliffLeft, this.floorY - topY);
    }

    drawHeightRuler() {
      const { ctx } = this;
      const s = this.yStep;
      const r = this.heightRect();
      const topW = this.worldY(r.y);
      const x1 = r.x, x2 = r.x + r.w;
      ctx.fillStyle = this.pal.ruler;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = this.pal.rulerInk; ctx.lineWidth = 1.5;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = this.pal.rulerInk;
      ctx.lineWidth = 1;
      ctx.font = this.font(12, 800);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      const n = Math.floor(topW / s + 1e-6);
      const every = this.yEvery;
      for (let i = 0; i <= n; i++) {
        const py = Math.round(this.Y(i * s)) + 0.5;
        const len = (i % 10 === 0 ? 20 : i % 5 === 0 ? 13 : 7) * this.fs;
        ctx.beginPath(); ctx.moveTo(x2, py); ctx.lineTo(x2 - len, py); ctx.stroke();
        if (i % every === 0 && py > r.y + 8) ctx.fillText(fmt(i * s, decimalsFor(s * every)), x2 - 22 * this.fs, py);
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.font = this.font(10, 700);
      ctx.fillText('m', x1 + r.w / 2, r.y + 2);
      // Launch-height line: from the ball across the cliff top to the ruler
      const ly = this.Y(this.cfg.dy);
      ctx.strokeStyle = this.pal.red; ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(x1, ly); ctx.lineTo(this.x0, ly); ctx.stroke();
      ctx.setLineDash([]);
      // Strobe projections onto the ruler: growing downward steps
      if (this.showStrobe && !this.cfg.numberGhosts) {
        ctx.fillStyle = this.pal.y;
        this.currentGhosts().forEach(p => this.tri(x2 + 1, this.Y(p.y), 5 * this.fs, 'left'));
      }
    }

    drawLauncher() {
      const { ctx } = this;
      const fs = this.fs;
      const cy = this.Y(this.cfg.dy);
      const bx = this.x0 - 60 * fs, bw = 60 * fs, bh = 18 * fs;
      // Air tank + barrel (0° elevation: perfectly horizontal)
      ctx.fillStyle = this.pal.launcher;
      ctx.strokeStyle = this.pal.ink; ctx.lineWidth = 1.5;
      this.roundRect(bx - 4 * fs, cy - 6 * fs, 16 * fs, 15 * fs, 3); ctx.fill(); ctx.stroke();
      this.roundRect(bx, cy - bh / 2, bw, bh, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.pal.x;
      ctx.fillRect(bx + 14 * fs, cy - 2, bw - 30 * fs, 4);
      // Photogate at the muzzle (a light beam across the barrel exit)
      const gx = this.x0 - 12 * fs;
      ctx.fillStyle = this.pal.ink;
      ctx.fillRect(gx, cy - bh / 2 - 7 * fs, 8 * fs, 5 * fs);
      ctx.fillRect(gx, cy + bh / 2 + 2 * fs, 8 * fs, 5 * fs);
      ctx.strokeStyle = this.pal.red; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx + 4 * fs, cy - bh / 2 - 2 * fs); ctx.lineTo(gx + 4 * fs, cy + bh / 2 + 2 * fs); ctx.stroke();

      // Digital photogate display
      const g = this.gateBox();
      ctx.strokeStyle = this.pal.dim; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx + 4 * fs, cy - bh / 2 - 7 * fs); ctx.lineTo(gx + 4 * fs, g.y + g.h); ctx.stroke();
      this.ledBox(g, 'PHOTOGATE', this.cfg.launchVx === null || this.cfg.launchVx === undefined ? '--.- m/s' : `${fmt(this.cfg.launchVx, 1)} m/s`);

      // Ball waiting in the muzzle
      if (!this.flight && !this.rest) this.ball(this.x0, cy, 1);
    }

    ledBox(g, title, value) {
      const { ctx } = this;
      const fs = this.fs;
      ctx.fillStyle = this.pal.led;
      this.roundRect(g.x, g.y, g.w, g.h, 6); ctx.fill();
      ctx.strokeStyle = this.pal.ink; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = this.pal.ledText;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = this.font(8.5, 700);
      ctx.fillText(title, g.x + 7 * fs, g.y + 4 * fs);
      ctx.font = this.font(19, 800, true);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'right';
      ctx.fillText(value, g.x + g.w - 8 * fs, g.y + g.h - 6 * fs);
    }

    // Flight timer: starts when the ball leaves the photogate, stops when it hits the floor
    drawTimer() {
      const t = this.flight ? this.flight.t : this.rest ? this.rest.T : (this.cfg.timerValue || 0);
      this.ledBox(this.timerBox(), '⏱ FLIGHT TIMER', `${fmt(t, 2)} s`);
    }

    // Earlier trials (Lab 2): faded dashed paths, so trials can be compared
    drawPastPaths() {
      const { ctx } = this;
      const T = Phys.time(this.cfg.dy);
      ctx.strokeStyle = this.pal.ghost; ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      this.cfg.pastPaths.forEach(vx => {
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const t = T * i / 40;
          const px = this.X(vx * t), py = this.Y(this.cfg.dy - 5 * t * t);
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // Landing marks (Lab 2): a small flag at each earlier landing spot, labeled by trial
    drawMarks() {
      const { ctx } = this;
      const fs = this.fs;
      this.cfg.marks.forEach(m => {
        const px = this.X(m.x);
        ctx.strokeStyle = this.pal.ink; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(px, this.floorY); ctx.lineTo(px, this.floorY - 20 * fs); ctx.stroke();
        ctx.fillStyle = this.pal.glow;
        ctx.beginPath(); ctx.moveTo(px, this.floorY - 20 * fs); ctx.lineTo(px + 13 * fs, this.floorY - 16 * fs); ctx.lineTo(px, this.floorY - 12 * fs); ctx.closePath(); ctx.fill();
        ctx.fillStyle = this.pal.ink;
        ctx.font = this.font(10, 800);
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(m.label, px, this.floorY - 22 * fs);
      });
    }

    drawBucket() {
      const { ctx } = this;
      const fs = this.fs;
      const cx = this.X(this.cfg.bucketX);
      const half = this.bucketHalfPx();
      const y = this.floorY, depth = 20 * fs;
      if (this.highlightBucket && !this.cfg.bucketLocked) {
        ctx.fillStyle = 'rgba(234, 88, 12, 0.16)';
        ctx.beginPath(); ctx.arc(cx, y, half + 16 * fs + 3 * Math.sin(performance.now() / 180), 0, Math.PI * 2); ctx.fill();
      }
      // Cup recessed into the floor, mouth level with the ground
      ctx.fillStyle = this.pal.bucket;
      ctx.strokeStyle = this.pal.ink; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - half - 3, y - 3); ctx.lineTo(cx + half + 3, y - 3);
      ctx.lineTo(cx + half * 0.7, y + depth); ctx.lineTo(cx - half * 0.7, y + depth); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(cx - half, y - 3, half * 2, 4);
      // Pointer line to the floor ruler
      ctx.strokeStyle = this.pal.red; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, y + depth); ctx.lineTo(cx, y + 34 * fs); ctx.stroke();
      ctx.fillStyle = this.pal.red;
      this.tri(cx, y + 34 * fs, 5 * fs, 'down');
      // Label (a locked target hides its distance: students measure it on the floor ruler)
      const d = this.snap < 0.1 ? 2 : 1;
      const text = this.cfg.bucketLocked ? (this.cfg.hideTarget ? '🔒 Target' : `🔒 Target: ${fmt(this.cfg.bucketX, d)} m`) : `Bucket at ${fmt(this.cfg.bucketX, d)} m`;
      ctx.font = this.font(12.5, 800);
      const tw = ctx.measureText(text).width + 14;
      const lx = Math.min(this.W - tw / 2 - 4, Math.max(tw / 2 + 4, cx));
      const ly = y - 30 * fs;
      ctx.fillStyle = this.pal.sky;
      ctx.strokeStyle = this.pal.bucket; ctx.lineWidth = 2;
      this.roundRect(lx - tw / 2, ly - 11 * fs, tw, 22 * fs, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.pal.ink;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, lx, ly + 1);
    }

    drawFlight() {
      const { ctx } = this;
      const f = this.flight || this.rest;
      if (!f) return;
      const vx = f.vx;
      const tNow = this.flight ? this.flight.t : Phys.time(this.cfg.dy);
      // Trail
      ctx.strokeStyle = this.pal.x; ctx.lineWidth = this.cfg.numberGhosts ? 1.5 : 2.5;
      ctx.globalAlpha = this.cfg.numberGhosts ? 0.5 : 1;
      ctx.beginPath();
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const t = tNow * i / steps;
        const px = this.X(vx * t), py = this.Y(this.cfg.dy - 5 * t * t);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Strobe ghosts (numbered in the strobe-photo lab: ghost 0 is the launch point)
      if (this.showStrobe || this.cfg.numberGhosts) {
        const pts = [{ x: 0, y: this.cfg.dy }].concat(f.ghosts);
        ctx.globalAlpha = this.cfg.numberGhosts ? 0.85 : 0.38;
        pts.forEach(p => this.ball(this.X(p.x), this.Y(p.y), 1));
        ctx.globalAlpha = 1;
        if (this.cfg.numberGhosts) {
          ctx.font = this.font(11, 800);
          ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
          pts.forEach((p, i) => {
            const px = this.X(p.x) + 7 * this.fs, py = this.Y(p.y) - 6 * this.fs;
            ctx.fillStyle = this.pal.sky;
            ctx.fillRect(px - 1, py - 13 * this.fs, (i > 9 ? 16 : 9) * this.fs, 13 * this.fs);
            ctx.fillStyle = this.pal.glow;
            ctx.fillText(String(i), px, py);
          });
          const k = this.cfg.highlightGhost;
          if (k !== null && pts[k]) {
            ctx.strokeStyle = this.pal.glow; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(this.X(pts[k].x), this.Y(pts[k].y), (11 + 4 * this.pulse()) * this.fs, 0, Math.PI * 2); ctx.stroke();
          }
        }
      }
      // Ball
      if (this.flight) {
        const px = this.X(vx * tNow), py = this.Y(this.cfg.dy - 5 * tNow * tNow);
        this.ball(px, py, 1);
        if (this.cfg.vectors) this.drawVectors(px, py, vx, 10 * tNow);
      } else {
        const r = this.rest;
        if (r.result === 'none') return;   // strobe photo: the last ghost marks the landing
        const restY = r.result === 'hit' ? this.floorY + 8 * this.fs : this.floorY - 6 * this.fs;
        const restX = r.result === 'rim' ? this.X(r.x) + Math.sign(r.x - this.cfg.bucketX || 1) * 12 * this.fs : this.X(r.x);
        this.ball(restX, restY, 1);
        if (this.cfg.vectors) this.drawImpactTriangle(this.X(r.x), this.floorY - 6 * this.fs, vx, 10 * Phys.time(this.cfg.dy));
      }
    }

    vectorScale(vx) { return 70 * this.fs / Math.max(vx, 10 * Phys.time(this.cfg.dy), 1); }

    // Velocity component arrows (Honors): v_x blue, v_y orange, resultant purple
    drawVectors(px, py, vx, vy) {
      const k = this.vectorScale(vx);
      this.arrow(px, py, px + vx * k, py, this.pal.x, 'v_x');
      this.arrow(px, py, px, py + vy * k, this.pal.y, 'v_y');
      if (vy > 0.05) this.arrow(px, py, px + vx * k, py + vy * k, this.pal.vec, 'v');
    }

    // After landing: tip-to-tail triangle that ends at the impact point (stays above the floor)
    drawImpactTriangle(px, py, vx, vy) {
      const k = this.vectorScale(vx);
      const ox = px - vx * k, oy = py - vy * k;
      this.arrow(ox, oy, px, oy, this.pal.x, 'v_x');
      this.arrow(px, oy, px, py, this.pal.y, 'v_y');
      this.arrow(ox, oy, px, py, this.pal.vec, 'v');
    }

    // Measuring crosshair: red guide lines run straight across to the height ruler and down to the floor ruler
    drawCrosshair() {
      const { ctx } = this;
      const c = this.cfg.crosshair;
      const px = this.X(c.x), py = this.Y(c.y);
      const fs = this.fs;
      ctx.strokeStyle = this.pal.red; ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(this.left, py); ctx.lineTo(px - 12 * fs, py);
      ctx.moveTo(px, py + 12 * fs); ctx.lineTo(px, this.H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, 12 * fs, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 17 * fs, py); ctx.lineTo(px - 4, py);
      ctx.moveTo(px + 4, py); ctx.lineTo(px + 17 * fs, py);
      ctx.moveTo(px, py - 17 * fs); ctx.lineTo(px, py - 4);
      ctx.moveTo(px, py + 4); ctx.lineTo(px, py + 17 * fs);
      ctx.stroke();
    }

    // Tick sizes, always shown in the empty corner under the cliff (students read rulers; they don't derive the spacing)
    drawTickLegend() {
      const { ctx } = this;
      const fs = this.fs;
      const x = this.left, y = this.floorY + 25 * fs, w = this.x0 - this.left - 8, h = this.H - y - 3;
      ctx.fillStyle = this.pal.ruler;
      ctx.strokeStyle = this.pal.rulerInk; ctx.lineWidth = 1.5;
      this.roundRect(x, y, w, h, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.pal.rulerInk;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = this.font(10, 800);
      ctx.fillText(`Height: 1 tick = ${fmtTick(this.yStep)} m`, x + 4, y + h * 0.3);
      ctx.fillText(`Floor: 1 tick = ${fmtTick(this.xStep)} m`, x + 4, y + h * 0.74);
    }

    // Practice reading (Lab 1 tour): a purple arrow pointing at one spot on a ruler
    drawPracticeArrow(p) {
      const { ctx } = this;
      const fs = this.fs;
      ctx.fillStyle = this.pal.glow; ctx.strokeStyle = this.pal.glow; ctx.lineWidth = 3;
      if (p.ruler === 'height') {
        const x = this.left + this.rulerW + 2, y = this.Y(p.value);
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x + 44 * fs, y); ctx.lineTo(x + 10 * fs, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14 * fs, y - 9 * fs); ctx.lineTo(x + 14 * fs, y + 9 * fs); ctx.closePath(); ctx.fill();
      } else {
        const x = this.X(p.value), y = this.floorRect().y;
        ctx.beginPath(); ctx.moveTo(x, y - 30 * fs); ctx.lineTo(x, y - 8 * fs); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 7 * fs, y - 11 * fs); ctx.lineTo(x + 7 * fs, y - 11 * fs); ctx.closePath(); ctx.fill();
      }
    }

    // Pulsing outline: "look here"
    drawHighlight(name) {
      const r = name === 'height' ? this.heightRect() : name === 'floor' ? this.floorRect() : name === 'gate' ? this.gateBox()
        : name === 'timer' ? this.timerBox() : name === 'bucket' ? this.bucketRect() : null;
      if (!r) return;
      const { ctx } = this;
      ctx.strokeStyle = this.pal.glow;
      ctx.lineWidth = 3 + 2 * this.pulse();
      this.roundRect(r.x - 4, r.y - 4, r.w + 8, Math.min(r.h + 8, this.H - r.y + 2), 8);
      ctx.stroke();
    }

    arrow(x1, y1, x2, y2, color, label) {
      const { ctx } = this;
      const len = Math.hypot(x2 - x1, y2 - y1);
      if (len < 3) return;
      const a = Math.atan2(y2 - y1, x2 - x1);
      const h = 9 * this.fs;
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * h * 0.8, y2 - Math.sin(a) * h * 0.8); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45));
      ctx.lineTo(x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45));
      ctx.closePath(); ctx.fill();
      ctx.font = this.font(13, 800);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      window.SubText.fill(ctx, label, x2 + 5, y2 + (label === 'v_x' ? -9 : 4));
    }

    drawParticles() {
      const { ctx } = this;
      this.particles.forEach(p => {
        ctx.globalAlpha = Math.min(1, p.life);
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      });
      ctx.globalAlpha = 1;
    }

    drawLegend() {
      const f = this.flight || this.rest;
      if (!f || !(this.showStrobe || this.cfg.numberGhosts)) return;
      if (this.cfg.readPoint && !this.cfg.numberGhosts) return;   // the zoom box uses this corner
      const { ctx } = this;
      const y0 = this.cfg.timer ? this.timerBox().y + this.timerBox().h + 8 : 10;
      ctx.font = this.font(11.5, 700);
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillStyle = this.pal.ink;
      ctx.fillText(`Strobe: one ghost every ${f.strobeDt} s`, this.W - 10, y0);
      if (this.cfg.numberGhosts) return;
      ctx.fillStyle = this.pal.x;
      ctx.fillText('▲ sideways steps (equal)', this.W - 10, y0 + 16 * this.fs);
      ctx.fillStyle = this.pal.y;
      ctx.fillText('◀ downward steps (growing)', this.W - 10, y0 + 32 * this.fs);
    }

    // Copy of the finished scene, so loupes can magnify it
    snapshot() {
      if (this.buffer.width !== this.canvas.width || this.buffer.height !== this.canvas.height) {
        this.buffer.width = this.canvas.width;
        this.buffer.height = this.canvas.height;
      }
      const bctx = this.buffer.getContext('2d');
      bctx.clearRect(0, 0, this.buffer.width, this.buffer.height);
      bctx.drawImage(this.canvas, 0, 0);
    }

    // A round magnifier showing the scene around (sx, sy), drawn centered at (cx, cy).
    // hair: 'both' | 'h' | 'v' red reading line(s) through the center.
    lens(sx, sy, cx, cy, R, Z, hair, label) {
      const { ctx, dpr } = this;
      const sr = R / Z;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = this.pal.sky; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.drawImage(this.buffer, (sx - sr) * dpr, (sy - sr) * dpr, sr * 2 * dpr, sr * 2 * dpr, cx - R, cy - R, R * 2, R * 2);
      ctx.strokeStyle = this.pal.red; ctx.lineWidth = 2;
      ctx.beginPath();
      if (hair !== 'v') { ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); }
      if (hair !== 'h') { ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); }
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = this.pal.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      if (label) {
        ctx.font = this.font(11, 800);
        const tw = ctx.measureText(label).width + 10;
        ctx.fillStyle = this.pal.glow;
        this.roundRect(cx - tw / 2, cy + R - 9 * this.fs, tw, 18 * this.fs, 5); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy + R);
      }
    }

    // Hover loupe: 2.5× optical loupe with a red crosshair, centered on the pointer
    drawLoupe() {
      const { x, y } = this.loupe;
      const R = 62 * this.fs;
      this.snapshot();
      // Show the loupe above-right of the pointer so the hand doesn't cover it; keep it on the canvas
      let cx = x + R + 18, cy = y - R - 12;
      if (cx + R > this.W - 2) cx = x - R - 18;
      if (cy - R < 2) cy = y + R + 12;
      if (cy + R > this.H - 2) cy = this.H - R - 2;
      this.lens(x, y, cx, cy, R, 2.5, 'both', '2.5×');
      // Small marker at the spot being magnified
      this.ctx.strokeStyle = this.pal.red; this.ctx.lineWidth = 1.5;
      this.ctx.beginPath(); this.ctx.arc(x, y, R / 2.5, 0, Math.PI * 2); this.ctx.stroke();
    }

    // Measuring (Lab 1): two zoom boxes in the empty sky on the right. Each shows one numbered section
    // of a ruler (from a number to the next number) with the red reading line, so students can count
    // ticks from the number. The student reads the scale; nothing is read for them.
    drawReadingStrips() {
      const { ctx } = this;
      const c = this.cfg.readPoint;
      const fs = this.fs;
      const px = this.X(c.x), py = c.y === null ? 0 : this.Y(c.y);
      this.snapshot();
      const section = (v, step, every) => {
        const span = step * every;
        let base = Math.floor(v / span + 1e-9) * span;
        if (v - base < 1e-9 && base > 0) base -= span;   // value on a number: show the section ending there
        return { base, top: base + span };
      };
      const xr = this.floorRect();
      const xs = section(c.x, this.xStep, this.xEvery);
      const sx0 = this.X(xs.base) - 12 * fs, sx1 = this.X(xs.top) + 12 * fs;
      const sy0 = xr.y - 2, sy1 = Math.min(this.H, xr.y + 31 * fs);
      const ys = section(c.y === null ? 0 : c.y, this.yStep, this.yEvery);
      const ty0 = this.Y(ys.top) - 9 * fs, ty1 = this.Y(ys.base) + 9 * fs;
      const tx0 = this.left, tx1 = this.left + this.rulerW;
      const zx = Math.min(3, 230 * fs / (sx1 - sx0));
      const zy = Math.min(2.6, 165 * fs / (ty1 - ty0));
      const xw = (sx1 - sx0) * zx, xh = (sy1 - sy0) * zx;
      const yw = (tx1 - tx0) * zy, yh = (ty1 - ty0) * zy;
      const right = this.W - 12;
      const yTop = (this.cfg.timer ? this.timerBox().y + this.timerBox().h : 30 * fs) + 22 * fs;
      const boxX = { x: right - xw, y: yTop, w: xw, h: xh };
      const boxY = { x: right - yw, y: yTop + xh + 30 * fs, w: yw, h: yh };
      const inset = (sx, sy, sw, sh, box, line, label) => {
        ctx.fillStyle = this.pal.glow;
        ctx.font = this.font(11.5, 800);
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText(label, box.x + box.w, box.y - 4);
        ctx.save();
        ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip();
        ctx.drawImage(this.buffer, sx * this.dpr, sy * this.dpr, sw * this.dpr, sh * this.dpr, box.x, box.y, box.w, box.h);
        ctx.strokeStyle = this.pal.red; ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (line.v !== undefined) { ctx.moveTo(line.v, box.y); ctx.lineTo(line.v, box.y + box.h); }
        else { ctx.moveTo(box.x, line.h); ctx.lineTo(box.x + box.w, line.h); }
        ctx.stroke();
        ctx.restore();
        ctx.strokeStyle = this.pal.glow; ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
      };
      inset(sx0, sy0, sx1 - sx0, sy1 - sy0, boxX, { v: boxX.x + (px - sx0) * zx }, c.y === null ? 'Δx: floor ruler zoom' : 'x: floor ruler zoom');
      if (c.y !== null) inset(tx0, ty0, tx1 - tx0, ty1 - ty0, boxY, { h: boxY.y + (py - ty0) * zy }, 'y: height ruler zoom');
    }

    // ---------- Primitives ----------
    ball(x, y, a) {
      const { ctx } = this;
      const r = 6 * this.fs;
      ctx.fillStyle = this.pal.ball;
      ctx.strokeStyle = this.pal.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, r * a, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    tri(x, y, s, dir) {
      const { ctx } = this;
      ctx.beginPath();
      if (dir === 'up') { ctx.moveTo(x, y - s); ctx.lineTo(x - s * 0.8, y + s * 0.4); ctx.lineTo(x + s * 0.8, y + s * 0.4); }
      else if (dir === 'down') { ctx.moveTo(x, y + s); ctx.lineTo(x - s * 0.8, y - s * 0.4); ctx.lineTo(x + s * 0.8, y - s * 0.4); }
      else { ctx.moveTo(x - s, y); ctx.lineTo(x + s * 0.4, y - s * 0.8); ctx.lineTo(x + s * 0.4, y + s * 0.8); }
      ctx.closePath(); ctx.fill();
    }

    roundRect(x, y, w, h, r) {
      const { ctx } = this;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
  }

  window.ProjectileStage = ProjectileStage;
})();

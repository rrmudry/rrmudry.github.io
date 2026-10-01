// Station 1: Spatial Volume Chamber
// Isometric laser-caliper scan (L × W × H) and a liquid-immersion displacement tank.
// Deliberately never shows mass: volume alone says nothing about inertia.

const TANK = { width: 60, depth: 60, height: 75, L0: 45 }; // cm; 1 cm of water height = 3.6 L

class SimVolume {
  constructor(onMeasure) {
    this.onMeasure = onMeasure;
    this.mode = 'calipers';
    this.obj = null;
    this.reset();
  }

  setObject(obj) {
    this.obj = obj;
    this.start();
  }

  setMode(mode) {
    this.mode = mode;
    this.start();
  }

  reset() {
    this.t = 0;
    this.running = false;
    this.done = false;
    this.splashed = false;
    this.clock = 0;
  }

  start() {
    this.reset();
    if (!this.obj) return;
    this.running = true;
    if (this.mode === 'calipers') window.soundFx.playScan();
  }

  update(dt) {
    this.clock += dt;
    if (!this.running || !this.obj) return;
    const dur = this.mode === 'calipers' ? 1.5 : 2.6;
    this.t = Math.min(1, this.t + dt / dur);
    if (this.mode === 'tank' && !this.splashed && this.tankState().bottom < TANK.L0) {
      this.splashed = true;
      window.soundFx.playSplash();
    }
    if (this.t >= 1) {
      this.running = false;
      this.done = true;
      this.onMeasure(this.obj.id, 'volume', MWS.volumeOf(this.obj));
    }
  }

  tankState() {
    const [L, W, H] = this.obj.dims;
    const A = TANK.width * TANK.depth;
    const startBottom = TANK.height + 14;
    const endBottom = TANK.L0 - 3 - H;
    const e = this.t < 0.5 ? 2 * this.t * this.t : 1 - Math.pow(-2 * this.t + 2, 2) / 2;
    const bottom = startBottom + (endBottom - startBottom) * e;
    const r = (L * W) / A;
    // Water level with the object partially submerged: level = L0 + r · (level − bottom)
    let level = (TANK.L0 - r * bottom) / (1 - r);
    if (level <= bottom) level = TANK.L0;
    else if (level - bottom >= H) level = TANK.L0 + (L * W * H) / A;
    return { bottom, level };
  }

  getTelemetry() {
    const obj = this.obj;
    const V = MWS.volumeOf(obj);
    const [L, W, H] = obj.dims;
    const ready = this.done;
    const pct = Math.round((V / MWS.BACKPACK_CM3) * 100);
    return [
      { label: 'Dimensions (L × W × H)', value: ready ? `${L} × ${W} × ${H} cm` : 'Scanning…' },
      { label: 'Volume', value: ready ? `${MWS.fmt(V, 0)} cm³` : '…' },
      { label: 'Volume in Liters', value: ready ? `${MWS.fmt(V / 1000, V < 10000 ? 2 : 1)} L` : '…' },
      { label: 'vs. School Backpack (25 L)', value: ready ? `${pct}% of a backpack` : '…' }
    ];
  }

  render(view) {
    if (!this.obj) return;
    const { ctx, w, h, pal } = view;
    ctx.fillStyle = pal.sceneBg;
    ctx.fillRect(0, 0, w, h);
    if (this.mode === 'calipers') this.renderCalipers(view);
    else this.renderTank(view);
  }

  renderCalipers(view) {
    const { ctx, w, h, fs, pal } = view;
    const obj = this.obj;
    const s = Math.min(w / 122, h / 108);
    const C30 = Math.cos(Math.PI / 6);
    const ox = w * 0.5;
    const oy = h * 0.08 + 62.5 * s;
    const P = (x, y, z) => [ox + (x - y) * C30 * s, oy + (x + y) * 0.5 * s - z * s];
    const line = (a, b) => {
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    };
    const poly = (pts) => {
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
    };

    // Metric floor grid (10 cm squares)
    ctx.strokeStyle = pal.sceneLine;
    ctx.lineWidth = 1;
    for (let g = -30; g <= 30; g += 10) {
      line(P(g, -30, 0), P(g, 30, 0));
      line(P(-30, g, 0), P(30, g, 0));
    }
    ctx.fillStyle = pal.textDim;
    ctx.font = `600 ${11 * fs}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const gl = P(30, 30, 0);
    ctx.fillText('grid = 10 cm', gl[0], gl[1] + 14 * fs);

    const [L, W, H] = obj.dims;
    const x0 = -L / 2, x1 = L / 2, y0 = -W / 2, y1 = W / 2;
    const base = MWS.baseColor(obj);

    // Visible faces: top, front-left (y = y1), front-right (x = x1)
    poly([P(x0, y1, 0), P(x1, y1, 0), P(x1, y1, H), P(x0, y1, H)]);
    ctx.fillStyle = MWS.shade(base, 0.78);
    ctx.fill();
    poly([P(x1, y0, 0), P(x1, y1, 0), P(x1, y1, H), P(x1, y0, H)]);
    ctx.fillStyle = MWS.shade(base, 0.6);
    ctx.fill();
    poly([P(x0, y0, H), P(x1, y0, H), P(x1, y1, H), P(x0, y1, H)]);
    ctx.fillStyle = MWS.shade(base, 1.08);
    ctx.fill();
    ctx.strokeStyle = MWS.shade(base, 0.4);
    ctx.lineWidth = 1.2;
    [
      [P(x0, y1, 0), P(x1, y1, 0)], [P(x1, y1, 0), P(x1, y0, 0)],
      [P(x0, y1, 0), P(x0, y1, H)], [P(x1, y1, 0), P(x1, y1, H)], [P(x1, y0, 0), P(x1, y0, H)],
      [P(x0, y0, H), P(x1, y0, H)], [P(x1, y0, H), P(x1, y1, H)], [P(x1, y1, H), P(x0, y1, H)], [P(x0, y1, H), P(x0, y0, H)]
    ].forEach(([a, b]) => line(a, b));

    if (obj.style === 'crate') {
      const c = P(0, 0, H);
      ctx.font = `800 ${Math.max(14, Math.min(L, W) * s * 0.35)}px 'Outfit', sans-serif`;
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      ctx.strokeText(obj.label, c[0], c[1]);
      ctx.fillText(obj.label, c[0], c[1]);
    }

    // Laser scan plane sweeping top → bottom, bounding wireframe drawn behind it
    const scanZ = H * (1 - this.t) + 4 * (1 - this.t);
    const wireTop = this.done ? H : Math.max(scanZ, 0);
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = pal.accentPurple;
    ctx.lineWidth = 1.6;
    [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].forEach(([x, y]) => line(P(x, y, wireTop), P(x, y, H)));
    poly([P(x0, y0, H), P(x1, y0, H), P(x1, y1, H), P(x0, y1, H)]);
    ctx.stroke();
    if (this.done) {
      poly([P(x0, y0, 0), P(x1, y0, 0), P(x1, y1, 0), P(x0, y1, 0)]);
      ctx.stroke();
    }
    ctx.restore();

    if (this.running) {
      const m = 6;
      poly([P(x0 - m, y0 - m, scanZ), P(x1 + m, y0 - m, scanZ), P(x1 + m, y1 + m, scanZ), P(x0 - m, y1 + m, scanZ)]);
      ctx.fillStyle = pal.isLight ? 'rgba(126, 34, 206, 0.12)' : 'rgba(192, 132, 252, 0.18)';
      ctx.fill();
      ctx.strokeStyle = pal.accentPurple;
      ctx.lineWidth = 2;
      ctx.shadowColor = pal.accentPurple;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Caliper dimension lines (appear once the scan completes)
    if (this.done) {
      ctx.strokeStyle = pal.accentPurple;
      ctx.lineWidth = 2;
      const off = 5;
      const tick = (a, b) => { line(a, b); };
      // Length along front-left edge
      const la = P(x0, y1 + off, 0), lb = P(x1, y1 + off, 0);
      line(la, lb);
      tick(P(x0, y1 + off - 2, 0), P(x0, y1 + off + 2, 0));
      tick(P(x1, y1 + off - 2, 0), P(x1, y1 + off + 2, 0));
      // Width along front-right edge
      const wa = P(x1 + off, y0, 0), wb = P(x1 + off, y1, 0);
      line(wa, wb);
      tick(P(x1 + off - 2, y0, 0), P(x1 + off + 2, y0, 0));
      tick(P(x1 + off - 2, y1, 0), P(x1 + off + 2, y1, 0));
      // Height along back-right vertical edge
      const ha = P(x1 + off, y0 - off, 0), hb = P(x1 + off, y0 - off, H);
      line(ha, hb);
      const pillOpts = { size: 13 * fs, weight: 700, mono: true, bg: pal.labelBg, fg: pal.accentPurple, border: pal.accentPurple, align: 'center' };
      const lm = P(0, y1 + off + 7, 0);
      MWS.pill(ctx, `L = ${L} cm`, lm[0], lm[1], pillOpts);
      const wm = P(x1 + off + 8, 0, 0);
      MWS.pill(ctx, `W = ${W} cm`, wm[0] + 30 * fs, wm[1], pillOpts);
      const hm = P(x1 + off, y0 - off, H / 2);
      MWS.pill(ctx, `H = ${H} cm`, hm[0] + 48 * fs, hm[1], pillOpts);
    }

    // HUD header
    MWS.pill(ctx, `🔦 LASER CALIPERS · ${obj.name}`, 14, 22 * fs, { size: 13 * fs, weight: 700, bg: pal.labelBg, fg: pal.labelText, border: pal.border });
    if (this.done) {
      const V = MWS.volumeOf(obj);
      MWS.pill(ctx, `V = ${L} × ${W} × ${H} = ${MWS.fmt(V, 0)} cm³`, w - 14, 22 * fs, {
        size: 14 * fs, weight: 800, mono: true, bg: pal.labelBg, fg: pal.accentPurple, border: pal.accentPurple, align: 'right'
      });
    } else {
      MWS.pill(ctx, 'SCANNING…', w - 14, 22 * fs, { size: 13 * fs, weight: 800, mono: true, bg: pal.labelBg, fg: pal.accentPurple, align: 'right' });
    }
  }

  renderTank(view) {
    const { ctx, w, h, fs, pal } = view;
    const obj = this.obj;
    const [L, W, H] = obj.dims;
    const s = Math.min((h * 0.8) / (TANK.height + 16), (w * 0.38) / TANK.width);
    const floorY = h * 0.93;
    const tankW = TANK.width * s;
    const tx = w * 0.06 + 40 * fs;
    const Y = (cm) => floorY - cm * s;
    const { bottom, level } = this.tankState();

    // Water
    const wg = ctx.createLinearGradient(0, Y(level), 0, floorY);
    wg.addColorStop(0, pal.isLight ? 'rgba(14, 165, 233, 0.45)' : 'rgba(56, 189, 248, 0.45)');
    wg.addColorStop(1, pal.isLight ? 'rgba(3, 105, 161, 0.55)' : 'rgba(14, 116, 144, 0.65)');
    ctx.fillStyle = wg;
    ctx.fillRect(tx, Y(level), tankW, floorY - Y(level));

    // Starting water line (dashed) for comparison
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = pal.textDim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx - 10, Y(TANK.L0));
    ctx.lineTo(tx + tankW + 10, Y(TANK.L0));
    ctx.stroke();
    ctx.restore();

    // Holding rod + object
    const objW = L * s;
    const objH = H * s;
    const objX = tx + tankW / 2 - objW / 2;
    const objY = Y(bottom + H);
    ctx.strokeStyle = pal.textMuted;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tx + tankW / 2, 0);
    ctx.lineTo(tx + tankW / 2, objY);
    ctx.stroke();
    MWS.drawObjectSide(ctx, obj, objX, objY, objW, Math.max(objH, 3));

    // Water surface on top of the object (front glass effect)
    ctx.fillStyle = pal.isLight ? 'rgba(14, 165, 233, 0.18)' : 'rgba(56, 189, 248, 0.16)';
    ctx.fillRect(tx, Y(level), tankW, floorY - Y(level));
    ctx.strokeStyle = pal.accentCyan;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tx, Y(level));
    ctx.lineTo(tx + tankW, Y(level));
    ctx.stroke();

    // Glass tank walls
    ctx.strokeStyle = pal.textMain;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tx, Y(TANK.height));
    ctx.lineTo(tx, floorY);
    ctx.lineTo(tx + tankW, floorY);
    ctx.lineTo(tx + tankW, Y(TANK.height));
    ctx.stroke();

    // Graduations in liters (60 cm × 60 cm footprint → 3.6 L per cm)
    ctx.font = `600 ${10.5 * fs}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let cm = 0; cm <= TANK.height; cm += 5) {
      const y = Y(cm);
      const major = cm % 10 === 0;
      ctx.strokeStyle = pal.textDim;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, y);
      ctx.lineTo(tx + (major ? 12 : 6), y);
      ctx.stroke();
      if (major) {
        ctx.fillStyle = pal.textDim;
        ctx.fillText(`${Math.round(cm * 3.6)} L`, tx - 6, y);
      }
    }

    const floats = obj.mass / MWS.volumeOf(obj) < 0.001; // density < 1 g/cm³
    if (floats && this.t > 0.5) {
      MWS.pill(ctx, 'Held under by a thin rod (it would float!)', tx + tankW / 2, Y(TANK.height) - 14 * fs, {
        size: 11.5 * fs, weight: 600, bg: pal.labelBg, fg: pal.textMuted, border: pal.border, align: 'center'
      });
    }

    // Readout panel
    const startL = TANK.L0 * 3.6;
    const nowL = level * 3.6;
    const dV = nowL - startL;
    const px = tx + tankW + 28 * fs;
    let py = h * 0.3;
    const big = { size: 15 * fs, weight: 800, mono: true, bg: pal.labelBg, fg: pal.textMain, border: pal.border };
    MWS.pill(ctx, `Start:  ${MWS.fmt(startL, 2)} L`, px, py, big);
    py += 34 * fs;
    MWS.pill(ctx, `Now:    ${MWS.fmt(nowL, 2)} L`, px, py, { ...big, fg: pal.accentCyan, border: pal.accentCyan });
    py += 40 * fs;
    MWS.pill(ctx, `Displaced ΔV = ${MWS.fmt(dV, 2)} L`, px, py, { ...big, size: 16 * fs, fg: pal.accentPurple, border: pal.accentPurple });
    if (this.done) {
      py += 36 * fs;
      MWS.pill(ctx, `= ${MWS.fmt(MWS.volumeOf(obj), 0)} cm³ = object's volume`, px, py, {
        size: 12 * fs, weight: 600, bg: pal.labelBg, fg: pal.textMuted
      });
    }

    MWS.pill(ctx, `💧 DISPLACEMENT TANK · ${obj.name}`, 14, 22 * fs, { size: 13 * fs, weight: 700, bg: pal.labelBg, fg: pal.labelText, border: pal.border });
  }
}

// Station 2: Planetary Gravity Platform
// Industrial platform scale with damped analog needle + LED readout across 5 locations.
// Mass stays locked; weight W = m · g follows local gravity and drops to 0 N in deep space.

// One fixed dial for every object and every world, so needle swings compare directly:
// the foam barely twitches while the anvil and heavy crates swing it hard.
// 1,600 N covers the heaviest case (a ~61 kg crate on Jupiter ≈ 1,525 N).
const DIAL_MAX = 1600;
const DIAL_MINOR = 50;  // N per minor tick
const DIAL_MAJOR = 200; // N per labeled tick

class SimWeight {
  constructor(onMeasure) {
    this.onMeasure = onMeasure;
    this.planet = MWS.planet('earth');
    this.prevPlanet = null;
    this.fade = 1;
    this.obj = null;
    this.val = 0;
    this.vel = 0;
    this.lift = 0;
    this.clock = 0;
    this.logged = false;
  }

  setObject(obj) {
    this.obj = obj;
    this.range = DIAL_MAX;
    this.val = 0;
    this.vel = 0;
    this.logged = false;
    if (this.planet.g > 0) window.soundFx.playThud(Math.min(1, 0.25 + obj.mass / 50));
  }

  setPlanet(id) {
    if (id === this.planet.id) return;
    this.prevPlanet = this.planet;
    this.planet = MWS.planet(id);
    this.fade = 0;
    this.logged = false;
    window.soundFx.playHum();
  }

  reset() {
    if (this.obj) this.setObject(this.obj);
  }

  weight() {
    return this.obj ? this.obj.mass * this.planet.g : 0;
  }

  update(dt) {
    this.clock += dt;
    this.fade = Math.min(1, this.fade + dt / 0.7);
    if (!this.obj) return;
    const target = this.weight();
    // Underdamped spring needle (ζ ≈ 0.22) → visible overshoot and settle
    const k = 55, c = 3.2;
    const steps = Math.max(1, Math.ceil(dt / 0.004));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const acc = -k * (this.val - target) - c * this.vel;
      this.vel += acc * h;
      this.val += this.vel * h;
    }
    const liftTarget = this.planet.g === 0 ? 1 : 0;
    this.lift += (liftTarget - this.lift) * Math.min(1, dt * 1.8);

    const tol = Math.max(0.05, 0.005 * target);
    if (!this.logged && Math.abs(this.val - target) < tol && Math.abs(this.vel) < tol * 4) {
      this.logged = true;
      this.onMeasure(this.obj.id, this.planet.id, target);
    }
  }

  reading() {
    return Math.max(0, this.val);
  }

  getTelemetry() {
    const obj = this.obj;
    const g = this.planet.g;
    return [
      { label: 'Location', value: `${this.planet.icon} ${this.planet.name}` },
      { label: 'Acceleration of Gravity (g)', value: g === 0 ? '≈ 0 m/s²' : `${MWS.fmt(g, 1)} m/s²` },
      { label: 'Scale Reading (Weight)', value: `${MWS.fmt(this.reading(), 1)} N` },
      { label: 'Mass (Inertia)', value: obj.hidden ? '🔒 ? kg (sealed)' : `${MWS.fmt(obj.mass, 1)} kg` }
    ];
  }

  drawSky(ctx, planetId, w, h, groundY) {
    let g;
    switch (planetId) {
      case 'earth':
        g = ctx.createLinearGradient(0, 0, 0, groundY);
        g.addColorStop(0, '#3b82f6');
        g.addColorStop(1, '#bfdbfe');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(253, 224, 71, 0.9)';
        ctx.beginPath();
        ctx.arc(w * 0.1, h * 0.15, h * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        [[0.25, 0.2], [0.55, 0.12]].forEach(([cx, cy]) => {
          ctx.beginPath();
          ctx.ellipse(w * cx, h * cy, w * 0.06, h * 0.03, 0, 0, Math.PI * 2);
          ctx.ellipse(w * cx + w * 0.04, h * cy + h * 0.01, w * 0.05, h * 0.025, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        g = ctx.createLinearGradient(0, groundY, 0, h);
        g.addColorStop(0, '#65a30d');
        g.addColorStop(1, '#3f6212');
        ctx.fillStyle = g;
        ctx.fillRect(0, groundY, w, h - groundY);
        break;
      case 'moon':
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, w, h);
        MWS.drawStars(ctx, 0, 0, w, groundY, this.clock);
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(w * 0.12, h * 0.18, h * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(w * 0.11, h * 0.17, h * 0.025, 0, Math.PI * 2);
        ctx.fill();
        g = ctx.createLinearGradient(0, groundY, 0, h);
        g.addColorStop(0, '#9ca3af');
        g.addColorStop(1, '#4b5563');
        ctx.fillStyle = g;
        ctx.fillRect(0, groundY, w, h - groundY);
        ctx.fillStyle = 'rgba(55, 65, 81, 0.55)';
        [[0.08, 0.3, 0.05], [0.6, 0.55, 0.04], [0.9, 0.35, 0.06], [0.42, 0.8, 0.03]].forEach(([cx, cy, r]) => {
          ctx.beginPath();
          ctx.ellipse(w * cx, groundY + (h - groundY) * cy, w * r, w * r * 0.28, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      case 'mars':
        g = ctx.createLinearGradient(0, 0, 0, groundY);
        g.addColorStop(0, '#c2763a');
        g.addColorStop(1, '#f2c48d');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#9a3412';
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        for (let x = 0; x <= w; x += 10) ctx.lineTo(x, groundY - Math.sin(x / w * 7) * h * 0.03 - h * 0.02);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();
        g = ctx.createLinearGradient(0, groundY, 0, h);
        g.addColorStop(0, '#c2410c');
        g.addColorStop(1, '#7c2d12');
        ctx.fillStyle = g;
        ctx.fillRect(0, groundY, w, h - groundY);
        break;
      case 'jupiter': {
        const bands = ['#e9d5b7', '#b7835a', '#d6b38a', '#8b5a3c', '#efe0c6', '#a9714b', '#d9bf99'];
        const bh = groundY / bands.length;
        bands.forEach((c, i) => {
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.moveTo(0, i * bh);
          for (let x = 0; x <= w; x += 12) ctx.lineTo(x, i * bh + Math.sin(x / 60 + i + this.clock * 0.4) * 4);
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.fill();
        });
        ctx.fillStyle = 'rgba(180, 60, 40, 0.85)';
        ctx.beginPath();
        ctx.ellipse(w * 0.16, groundY * 0.55, w * 0.07, groundY * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        g = ctx.createLinearGradient(0, groundY, 0, h);
        g.addColorStop(0, '#64748b');
        g.addColorStop(1, '#334155');
        ctx.fillStyle = g;
        ctx.fillRect(0, groundY, w, h - groundY);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, groundY);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        break;
      }
      default: { // deep space
        g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#020617');
        g.addColorStop(1, '#0f172a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        MWS.drawStars(ctx, 0, 0, w, h, this.clock);
        const neb = ctx.createRadialGradient(w * 0.15, h * 0.25, 0, w * 0.15, h * 0.25, w * 0.2);
        neb.addColorStop(0, 'rgba(192, 132, 252, 0.25)');
        neb.addColorStop(1, 'rgba(192, 132, 252, 0)');
        ctx.fillStyle = neb;
        ctx.fillRect(0, 0, w, h);
      }
    }
  }

  render(view) {
    if (!this.obj) return;
    const { ctx, w, h, fs, pal } = view;
    const obj = this.obj;
    const groundY = h * 0.8;

    this.drawSky(ctx, this.planet.id, w, h, groundY);
    if (this.prevPlanet && this.fade < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - this.fade;
      this.drawSky(ctx, this.prevPlanet.id, w, h, groundY);
      ctx.restore();
    }

    // --- Platform scale ---
    const sx = w * 0.34;
    const bw = w * 0.32;
    const baseH = h * 0.075;
    const baseY = groundY - baseH;
    const frac = Math.max(0, Math.min(1.1, this.val / this.range));
    const compress = frac * h * 0.035;
    const plateY = baseY - h * 0.065 + compress;
    const plateH = h * 0.025;

    ctx.fillStyle = '#334155';
    MWS.rr(ctx, sx - bw / 2, baseY, bw, baseH, 6);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();
    // hazard stripe
    ctx.save();
    MWS.rr(ctx, sx - bw / 2 + 8, baseY + baseH * 0.62, bw - 16, baseH * 0.22, 3);
    ctx.clip();
    for (let x = sx - bw / 2; x < sx + bw / 2; x += 16) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x, baseY + baseH * 0.6, 8, baseH * 0.3);
      ctx.fillStyle = '#111827';
      ctx.fillRect(x + 8, baseY + baseH * 0.6, 8, baseH * 0.3);
    }
    ctx.restore();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `800 ${11 * fs}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HYDRAULIC PLATFORM SCALE', sx, baseY + baseH * 0.32);

    // Springs between base and plate
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    [-0.32, 0, 0.32].forEach(f => {
      const x = sx + f * bw;
      const top = plateY + plateH;
      const n = 6;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      for (let i = 1; i <= n; i++) {
        const y = baseY + ((top - baseY) * i) / n;
        ctx.lineTo(x + (i % 2 ? 7 : -7), y);
      }
      ctx.lineTo(x, top);
      ctx.stroke();
    });
    ctx.fillStyle = '#cbd5e1';
    MWS.rr(ctx, sx - bw * 0.46, plateY, bw * 0.92, plateH, 4);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Object resting on (or floating above) the plate
    const ps = Math.min((bw * 0.85) / 50, (h * 0.34) / 40);
    const ow = Math.max(8, obj.dims[0] * ps);
    const oh = Math.max(5, obj.dims[2] * ps);
    const bob = this.lift * (Math.sin(this.clock * 1.4) * h * 0.012);
    const oy = plateY - oh - this.lift * h * 0.12 + bob;
    const tilt = this.lift * Math.sin(this.clock * 0.8) * 0.08;
    ctx.save();
    ctx.translate(sx, oy + oh / 2);
    ctx.rotate(tilt);
    MWS.drawObjectSide(ctx, obj, -ow / 2, -oh / 2, ow, oh);
    ctx.restore();

    if (this.lift > 0.5) {
      MWS.pill(ctx, 'Floating! Nothing pulls it onto the scale.', sx, oy - 26 * fs - 6, {
        size: 12 * fs, weight: 700, bg: pal.labelBg, fg: pal.accentCyan, border: pal.accentCyan, align: 'center'
      });
    }
    MWS.pill(ctx, `${obj.short} · m = ${MWS.fmtMass(obj)}`, sx, oy - 8 * fs - 6, {
      size: 12.5 * fs, weight: 700, bg: pal.labelBg, fg: pal.labelText, border: pal.border, align: 'center'
    });

    // --- Analog dial gauge ---
    const R = Math.min(w * 0.15, h * 0.27);
    const cx = w * 0.76;
    const cy = h * 0.1 + R + 6;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, R + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    const a0 = (135 * Math.PI) / 180;
    const sweep = (270 * Math.PI) / 180;
    const ticks = DIAL_MAX / DIAL_MINOR;
    const perMajor = DIAL_MAJOR / DIAL_MINOR;
    for (let i = 0; i <= ticks; i++) {
      const a = a0 + (sweep * i) / ticks;
      const major = i % perMajor === 0;
      const r1 = R * (major ? 0.78 : 0.86);
      ctx.strokeStyle = major ? '#0f172a' : '#64748b';
      ctx.lineWidth = major ? 2.5 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * R * 0.94, cy + Math.sin(a) * R * 0.94);
      ctx.stroke();
      if (major) {
        ctx.fillStyle = '#0f172a';
        ctx.font = `700 ${Math.max(9, R * 0.1)}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i * DIAL_MINOR), cx + Math.cos(a) * R * 0.63, cy + Math.sin(a) * R * 0.63);
      }
    }
    ctx.fillStyle = '#334155';
    ctx.font = `800 ${Math.max(9, R * 0.1)}px 'Outfit', sans-serif`;
    ctx.fillText('NEWTONS (N)', cx, cy + R * 0.72);
    const na = a0 + sweep * Math.max(-0.02, Math.min(1.04, this.val / this.range));
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(na) * R * 0.12, cy - Math.sin(na) * R * 0.12);
    ctx.lineTo(cx + Math.cos(na) * R * 0.86, cy + Math.sin(na) * R * 0.86);
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // LED digital readout
    const ledW = R * 1.9;
    const ledH = Math.max(30, R * 0.36);
    const ledY = cy + R + 18;
    ctx.fillStyle = '#020617';
    MWS.rr(ctx, cx - ledW / 2, ledY, ledW, ledH, 6);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 10;
    ctx.font = `800 ${ledH * 0.62}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${MWS.fmt(this.reading(), 1)} N`, cx, ledY + ledH / 2 + 1);
    ctx.shadowBlur = 0;

    // Location tag
    const p = this.planet;
    const tag = p.g === 0
      ? `${p.icon} Deep Space · g ≈ 0 m/s² · WEIGHTLESS`
      : `${p.icon} ${p.name} · g = ${MWS.fmt(p.g, 1)} m/s²`;
    MWS.pill(ctx, tag, 14, 22 * fs, { size: 14 * fs, weight: 800, bg: pal.labelBg, fg: pal.labelText, border: pal.border });
    if (p.id === 'jupiter') {
      MWS.pill(ctx, '(imaginary platform floating at the cloud tops)', 14, 50 * fs, { size: 11 * fs, weight: 600, bg: pal.labelBg, fg: pal.textMuted });
    }
  }
}

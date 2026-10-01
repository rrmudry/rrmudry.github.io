// Station 3: Zero-G Inertia Chamber (Newton's First Law, qualitative only)
// Mode A "Nudge Test": identical robotic push, very different responses → inertia of rest
// Mode B "Airlock Catch": coasting cargo with 0 N forward force → inertia of motion

const BAY = { length: 6.0, barrierX: 4.2, cruise: 1.0, k: 139 };

class SimInertia {
  constructor(onMeasure) {
    this.onMeasure = onMeasure;
    this.mode = 'nudge';
    this.obj = null;
    this.clock = 0;
    this.reset();
  }

  setObject(obj) {
    this.obj = obj;
    this.reset();
  }

  setMode(mode) {
    this.mode = mode;
    this.reset();
  }

  // Objects are drawn 1.6× life size so the gold bar stays visible; collisions use the same size
  sizeM() {
    return { len: (this.obj.dims[0] / 100) * 1.6, ht: (this.obj.dims[2] / 100) * 1.6 };
  }

  reset() {
    this.phase = this.mode === 'nudge' ? 'idle' : 'ready';
    this.v = 0;
    this.pushSpeed = null;
    this.trail = [];
    this.trailTimer = 0;
    this.coastTime = 0;
    this.armT = 0;
    this.shake = 0;
    this.message = null;
    // catch mode
    this.barrierDeploy = 0;
    this.barrierOn = false;
    this.dent = 0;
    this.maxDent = null;
    this.contactT = 0;
    this.buckled = false;
    this.sparks = [];
    if (this.obj) {
      const { len } = this.sizeM();
      this.x = this.mode === 'nudge' ? 1.5 + len / 2 : 0.6 + len / 2; // object center (m)
    }
  }

  // ---------------- Mode A ----------------
  push() {
    if (this.mode !== 'nudge') return;
    if (this.phase !== 'idle') this.reset();
    this.phase = 'extend';
    this.armT = 0;
    window.soundFx.playClick();
  }

  // ---------------- Mode B ----------------
  release() {
    if (this.mode !== 'catch') return;
    if (this.phase !== 'ready') this.reset();
    this.phase = 'drift';
    this.v = BAY.cruise;
    window.soundFx.playWhoosh(0.4);
  }

  deployBarrier() {
    if (this.mode !== 'catch' || this.barrierOn) return;
    const { len } = this.sizeM();
    if (this.x + len / 2 > BAY.barrierX + 0.02) {
      this.message = { text: 'Too late! The cargo is already past the barrier.', tone: 'warn' };
      window.soundFx.playBuzzer();
      return;
    }
    this.barrierOn = true;
    window.soundFx.playClick();
  }

  update(dt) {
    this.clock += dt;
    if (!this.obj) return;
    const { len } = this.sizeM();
    this.shake = Math.max(0, this.shake - dt * 1.6);
    this.sparks.forEach(s => {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
    });
    this.sparks = this.sparks.filter(s => s.life > 0);

    if (this.mode === 'nudge') this.updateNudge(dt, len);
    else this.updateCatch(dt, len);
  }

  updateNudge(dt, len) {
    if (this.phase === 'extend') {
      this.armT = Math.min(1, this.armT + dt / 0.35);
      if (this.armT >= 1) {
        // Contact: the identical standard push for every object
        this.v = MWS.STANDARD_PUSH / this.obj.mass;
        this.pushSpeed = this.v;
        this.phase = 'drift';
        this.trail = [this.x];
        this.trailTimer = 0;
        const m = this.obj.mass;
        if (m >= 25) {
          this.shake = 1;
          window.soundFx.playGroan();
          window.soundFx.playThud(0.9);
        } else if (m >= 5) {
          window.soundFx.playThud(0.45);
          window.soundFx.playWhoosh(0.35);
        } else {
          window.soundFx.playWhoosh(1);
        }
        this.onMeasure(this.obj.id, 'nudge', this.pushSpeed);
      }
      return;
    }
    if (this.phase === 'drift' || this.phase === 'stopped') {
      this.armT = Math.max(0, this.armT - dt / 0.5);
    }
    if (this.phase === 'drift') {
      this.x += this.v * dt;
      this.coastTime += dt;
      this.trailTimer += dt;
      const trailEvery = this.v > 2 ? 0.1 : 0.5;
      if (this.trailTimer >= trailEvery) {
        this.trailTimer -= trailEvery;
        this.trail.push(this.x);
        if (this.trail.length > 40) this.trail.shift();
      }
      const wall = BAY.length - 0.12;
      if (this.x + len / 2 >= wall) {
        this.x = wall - len / 2;
        this.phase = 'stopped';
        window.soundFx.playSoftBump();
        this.message = { text: 'Stopped only because the padded wall pushed back on it.', tone: 'info' };
      }
    }
  }

  updateCatch(dt, len) {
    if (this.barrierOn) this.barrierDeploy = Math.min(1, this.barrierDeploy + dt / 0.35);
    if (this.phase === 'drift') {
      const prevRight = this.x + len / 2;
      this.x += this.v * dt;
      this.coastTime += dt;
      const right = this.x + len / 2;
      if (this.barrierOn && this.barrierDeploy > 0.5 && prevRight <= BAY.barrierX && right > BAY.barrierX) {
        this.phase = 'contact';
        this.contactT = 0;
        this.x = BAY.barrierX - len / 2;
        const m = this.obj.mass;
        if (m >= 25) window.soundFx.playCrash(1);
        else if (m >= 8) window.soundFx.playCrash(0.45);
        else if (m >= 3) window.soundFx.playThud(0.5);
        else window.soundFx.playSoftBump();
      }
      // Fully through the airlock: announce it, but keep it coasting off-screen (Newton's 1st Law)
      if (this.x - len / 2 > BAY.length) {
        this.phase = 'lost';
        this.message = { text: 'CARGO LOST through the airlock! With nothing to stop it, it will coast at 1.0 m/s forever.', tone: 'warn' };
        window.soundFx.playBuzzer();
        this.onMeasure(this.obj.id, 'dent', 'lost');
      }
    } else if (this.phase === 'lost') {
      this.x += this.v * dt;
    } else if (this.phase === 'contact') {
      // Barrier acts like a stiff spring: dent grows until the cargo is stopped
      const omega = Math.sqrt(BAY.k / this.obj.mass);
      const amp = BAY.cruise / omega;
      this.contactT += dt;
      const th = Math.min(Math.PI / 2, omega * this.contactT);
      this.dent = amp * Math.sin(th);
      this.v = BAY.cruise * Math.cos(th);
      this.x = BAY.barrierX + this.dent - len / 2;
      if (this.obj.mass >= 8 && Math.random() < dt * 60) {
        this.sparks.push({ x: BAY.barrierX + this.dent, y: (Math.random() - 0.5) * 0.4, vx: (Math.random() - 0.3) * 1.5, vy: (Math.random() - 0.5) * 2, life: 0.4 });
      }
      if (th >= Math.PI / 2) {
        this.v = 0;
        this.phase = 'caught';
        this.maxDent = this.dent;
        this.buckled = this.maxDent > 0.3;
        this.onMeasure(this.obj.id, 'dent', this.maxDent);
        this.message = this.buckled
          ? { text: `Barrier brackets BUCKLED (${Math.round(this.maxDent * 100)} cm dent). Huge mass = huge resistance to stopping!`, tone: 'warn' }
          : { text: `Caught! Only a ${Math.round(this.maxDent * 100)} cm dent. Small mass = easy to stop.`, tone: 'good' };
      }
    }
  }

  getTelemetry() {
    const obj = this.obj;
    const massVal = obj.hidden ? '🔒 ? kg (sealed)' : `${MWS.fmt(obj.mass, 1)} kg`;
    if (this.mode === 'nudge') {
      return [
        { label: 'Mass (Inertia)', value: massVal },
        { label: 'Weight in This Bay', value: '0.0 N' },
        { label: 'Speed After Standard Push', value: this.pushSpeed == null ? '— push it!' : `${MWS.fmt(this.pushSpeed, 2)} m/s` },
        { label: 'Forward Force While Coasting', value: this.phase === 'drift' ? '0 N (coasting)' : '0 N' }
      ];
    }
    let force = '0 N (coasting)';
    if (this.phase === 'contact') force = '← Barrier pushing back';
    if (this.phase === 'ready' || this.phase === 'caught') force = '0 N';
    let dent = '—';
    if (this.phase === 'contact') dent = `${Math.round(this.dent * 100)} cm…`;
    if (this.maxDent != null) dent = `${Math.round(this.maxDent * 100)} cm`;
    if (this.phase === 'lost') dent = 'Cargo lost!';
    return [
      { label: 'Mass (Inertia)', value: massVal },
      { label: 'Cargo Speed', value: `${MWS.fmt(this.v, 2)} m/s` },
      { label: 'Forward Force on Cargo', value: force },
      { label: 'Barrier Dent (how hard to stop)', value: dent }
    ];
  }

  render(view) {
    if (!this.obj) return;
    const { ctx, w, h, fs, pal } = view;
    const obj = this.obj;
    const { len, ht } = this.sizeM();
    const marginL = w * 0.07;
    const marginR = w * 0.1;
    const ppm = (w - marginL - marginR) / BAY.length;
    const X = (m) => marginL + m * ppm;
    const ceilY = h * 0.14;
    const floorY = h * 0.86;
    const midY = (ceilY + floorY) / 2 + h * 0.03;
    const shakeX = this.shake * Math.sin(this.clock * 70) * 5;

    // Bay interior
    ctx.fillStyle = pal.sceneBg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = pal.scenePanel;
    ctx.fillRect(X(0), ceilY, ppm * BAY.length, floorY - ceilY);
    ctx.strokeStyle = pal.sceneLine;
    ctx.lineWidth = 1;
    for (let m = 0; m <= BAY.length; m += 0.5) {
      ctx.beginPath();
      ctx.moveTo(X(m), ceilY);
      ctx.lineTo(X(m), floorY);
      ctx.stroke();
    }
    // Portholes
    [1.2, 3.0, 4.8].forEach(m => {
      const r = Math.min(ppm * 0.28, (floorY - ceilY) * 0.11);
      const py = ceilY + r + 10;
      ctx.save();
      ctx.beginPath();
      ctx.arc(X(m), py, r, 0, Math.PI * 2);
      ctx.fillStyle = '#020617';
      ctx.fill();
      ctx.clip();
      MWS.drawStars(ctx, X(m) - r, py - r, r * 2, r * 2, this.clock);
      ctx.restore();
      ctx.strokeStyle = pal.scenePanel2;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(X(m), py, r, 0, Math.PI * 2);
      ctx.stroke();
    });
    // Ceiling & floor rails
    ctx.fillStyle = pal.scenePanel2;
    ctx.fillRect(0, ceilY - 10, w, 10);
    ctx.fillRect(0, floorY, w, 10);

    // Distance ruler
    ctx.fillStyle = pal.textDim;
    ctx.strokeStyle = pal.textDim;
    ctx.font = `600 ${10.5 * fs}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let m = 0; m <= BAY.length; m += 1) {
      ctx.beginPath();
      ctx.moveTo(X(m), floorY + 10);
      ctx.lineTo(X(m), floorY + 18);
      ctx.stroke();
      ctx.fillText(`${m} m`, X(m), floorY + 20);
    }

    // Left wall
    ctx.fillStyle = pal.scenePanel2;
    ctx.fillRect(X(0) - 14, ceilY, 14, floorY - ceilY);

    if (this.mode === 'nudge') {
      // Right padded wall
      ctx.fillStyle = pal.isLight ? '#94a3b8' : '#334155';
      ctx.fillRect(X(BAY.length), ceilY, marginR, floorY - ceilY);
      ctx.fillStyle = pal.isLight ? '#fda4af' : '#9f1239';
      ctx.fillRect(X(BAY.length) - 0.12 * ppm, ceilY + 6, 0.12 * ppm, floorY - ceilY - 12);
      ctx.save();
      ctx.translate(X(BAY.length) - 0.06 * ppm, (ceilY + floorY) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#f8fafc';
      ctx.font = `800 ${10 * fs}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PADDED WALL', 0, 0);
      ctx.restore();
    } else {
      // Open airlock → space
      const ax = X(BAY.length);
      ctx.save();
      ctx.beginPath();
      ctx.rect(ax, ceilY + (floorY - ceilY) * 0.18, w - ax, (floorY - ceilY) * 0.64);
      ctx.fillStyle = '#020617';
      ctx.fill();
      ctx.clip();
      MWS.drawStars(ctx, ax, ceilY, w - ax, floorY - ceilY, this.clock);
      ctx.restore();
      ctx.fillStyle = pal.scenePanel2;
      ctx.fillRect(ax, ceilY, w - ax, (floorY - ceilY) * 0.18);
      ctx.fillRect(ax, floorY - (floorY - ceilY) * 0.18, w - ax, (floorY - ceilY) * 0.18);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 ? '#111827' : '#facc15';
        ctx.fillRect(ax - 6, ceilY + ((floorY - ceilY) * i) / 6, 6, (floorY - ceilY) / 6);
      }
      MWS.pill(ctx, 'AIRLOCK', ax + (w - ax) / 2, ceilY + (floorY - ceilY) * 0.09, {
        size: 10 * fs, weight: 800, bg: '#b91c1c', fg: '#ffffff', align: 'center'
      });

      // Safety catch barrier (drops from the ceiling)
      if (this.barrierOn || this.barrierDeploy > 0) {
        const bx = X(BAY.barrierX);
        const bottom = ceilY + (floorY - ceilY) * this.barrierDeploy;
        const bulge = this.dent * ppm;
        const bendY = midY;
        ctx.strokeStyle = this.buckled ? '#dc2626' : (pal.isLight ? '#0369a1' : '#38bdf8');
        ctx.lineWidth = 7;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, ceilY);
        if (bottom > bendY) {
          ctx.quadraticCurveTo(bx + bulge * 0.3, (ceilY + bendY) / 2, bx + bulge, bendY);
          const endY = bottom;
          ctx.quadraticCurveTo(bx + bulge * 0.3, (bendY + floorY) / 2, bx, endY);
        } else {
          ctx.lineTo(bx, bottom);
        }
        ctx.stroke();
        // Brackets
        const bracket = (y, dir) => {
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(bx - 14, y);
          if (this.buckled) ctx.lineTo(bx + 6, y + dir * 16);
          else ctx.lineTo(bx + 14, y);
          ctx.stroke();
        };
        bracket(ceilY + 4, 1);
        if (this.barrierDeploy >= 1) bracket(floorY - 4, -1);
        if (this.barrierDeploy >= 1 && this.phase !== 'contact' && this.phase !== 'caught') {
          MWS.pill(ctx, 'SAFETY BARRIER', bx, floorY - 22 * fs, { size: 10 * fs, weight: 800, bg: pal.labelBg, fg: pal.labelText, border: pal.border, align: 'center' });
        }
      }
    }

    // Robotic arm (Mode A) or launch cradle (Mode B)
    if (this.mode === 'nudge') {
      const retractTip = 0.35;
      const contactTip = (this.phase === 'extend' || this.phase === 'idle') ? this.x - len / 2 : 1.5;
      const tipM = retractTip + (contactTip - retractTip) * this.armT;
      const tipX = X(tipM) + shakeX;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(X(0), midY);
      ctx.lineTo(tipX - 18, midY);
      ctx.stroke();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(X(0), midY);
      ctx.lineTo(tipX - 18, midY);
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.fillStyle = '#e2e8f0';
      MWS.rr(ctx, tipX - 20, midY - 18, 20, 36, 7);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#334155';
      ctx.fillRect(X(0) - 14, midY - 26, 18, 52);
      if (this.shake > 0.3) {
        MWS.pill(ctx, 'STRAIN!', tipX - 10, midY - 44 * fs, { size: 12 * fs, weight: 800, bg: '#b91c1c', fg: '#fff', align: 'center' });
      }
    }

    // Strobe trail: equal spacing = constant velocity
    const ow = Math.max(10, len * ppm);
    const oh = Math.max(6, ht * ppm);
    if (this.trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = pal.accentCyan;
      ctx.globalAlpha = 0.45;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.3;
      this.trail.forEach(tx => {
        ctx.strokeRect(X(tx) - ow / 2, midY - oh / 2, ow, oh);
      });
      ctx.restore();
    }

    const ox = X(this.x) + (this.mode === 'nudge' ? shakeX * 0.2 : 0);
    const bob = Math.sin(this.clock * 1.3) * 3;
    const rot = Math.sin(this.clock * 0.7) * 0.03;
    ctx.save();
    ctx.translate(ox, midY + bob);
    ctx.rotate(rot);
    MWS.drawObjectSide(ctx, obj, -ow / 2, -oh / 2, ow, oh);
    ctx.restore();

    // Sparks
    this.sparks.forEach(s => {
      ctx.fillStyle = `rgba(251, 191, 36, ${Math.max(0, s.life / 0.4)})`;
      ctx.beginPath();
      ctx.arc(X(s.x), midY + s.y * ppm, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Floating vector HUD over the object
    const hudY = midY - oh / 2 - 22 * fs;
    if (this.mode === 'catch' && (this.phase === 'drift' || this.phase === 'ready')) {
      MWS.pill(ctx, 'FORWARD FORCE = 0 N  (moving purely by Newton\'s First Law!)', ox, hudY, {
        size: 11.5 * fs, weight: 800, bg: pal.labelBg, fg: pal.accentCyan, border: pal.accentCyan, align: 'center'
      });
    }
    if (this.mode === 'nudge' && this.phase === 'drift') {
      MWS.pill(ctx, 'Forward force = 0 N (coasting)', ox, hudY, {
        size: 11.5 * fs, weight: 700, bg: pal.labelBg, fg: pal.accentCyan, border: pal.accentCyan, align: 'center'
      });
    }
    // Once lost cargo has coasted off the canvas, its labels go with it (pills would otherwise clamp to the edge)
    const onScreen = ox - ow / 2 < w;
    if (this.v > 0.001 && this.phase !== 'contact' && onScreen) {
      const arrowLen = 16 + 34 * Math.log10(1 + this.v * 10);
      const ay = midY + oh / 2 + 18;
      ctx.strokeStyle = pal.accentEmerald;
      ctx.fillStyle = pal.accentEmerald;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ox - arrowLen / 2, ay);
      ctx.lineTo(ox + arrowLen / 2, ay);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox + arrowLen / 2 + 8, ay);
      ctx.lineTo(ox + arrowLen / 2 - 2, ay - 6);
      ctx.lineTo(ox + arrowLen / 2 - 2, ay + 6);
      ctx.fill();
      MWS.pill(ctx, `v = ${MWS.fmt(this.v, 2)} m/s`, ox, ay + 20 * fs, {
        size: 11.5 * fs, weight: 700, mono: true, bg: pal.labelBg, fg: pal.accentEmerald, align: 'center'
      });
    }
    if (this.phase === 'contact') {
      const ay = midY - oh / 2 - 22 * fs;
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ox + 30, ay);
      ctx.lineTo(ox - 30, ay);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox - 40, ay);
      ctx.lineTo(ox - 28, ay - 7);
      ctx.lineTo(ox - 28, ay + 7);
      ctx.fill();
      MWS.pill(ctx, "Barrier's stopping push", ox, ay - 20 * fs, { size: 11 * fs, weight: 700, bg: pal.labelBg, fg: '#ef4444', align: 'center' });
    }

    // Header + status
    const title = this.mode === 'nudge' ? '✋ MODE A · ZERO-G NUDGE TEST' : '🛡️ MODE B · AIRLOCK CATCH TEST';
    MWS.pill(ctx, `${title} · ${obj.short} · W = 0.0 N`, 14, 22 * fs, { size: 12.5 * fs, weight: 800, bg: pal.labelBg, fg: pal.labelText, border: pal.border });
    if (this.message) {
      const colors = { warn: pal.accentRose, good: pal.accentEmerald, info: pal.textMuted };
      const c = colors[this.message.tone] || pal.textMain;
      MWS.pill(ctx, this.message.text, w / 2, ceilY + (floorY - ceilY) * 0.3, {
        size: 12.5 * fs, weight: 700, bg: pal.labelBg, fg: c, border: c, align: 'center'
      });
    }
  }
}

// Canvas Renderer & Physics Simulation Engine for Projectile Target Range
// Full 60 FPS projectile kinematics, stroboscopic position trails, and target detection.

class TargetCanvas {
  constructor(canvasEl, onBucketMove) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.onBucketMove = onBucketMove;

    this.mission = null;
    this.bucketX = 10.0;
    this.dialVx = 0.0;
    this.isDraggingBucket = false;
    this.dragOffsetX = 0;

    // Simulation flight state
    this.isFlying = false;
    this.flightT = 0;
    this.flightDuration = 0;
    this.currentBallX = 0;
    this.currentBallY = 0;
    this.strobeGhosts = [];
    this.confetti = [];
    this.lastResult = null; // 'hit' | 'miss' | null
    this.showStrobe = true;

    // Colors
    this.colors = this.getThemeColors();

    this.initEvents();
    this.resize();
    this.startLoop();
  }

  getThemeColors() {
    const isDark = document.documentElement.classList.contains('theme-dark');
    const isProj = document.documentElement.classList.contains('projector');

    if (isProj) {
      return {
        bg: '#ffffff',
        text: '#000000',
        cliff: '#64748b',
        cliffEdge: '#0f172a',
        ground: '#e2e8f0',
        groundLine: '#000000',
        rulerBg: '#fef08a',
        rulerInk: '#000000',
        launcher: '#1e293b',
        photogateLed: '#000000',
        photogateText: '#22c55e',
        bucket: '#ea580c',
        ball: '#0284c7',
        trajectory: '#0284c7',
        ghost: 'rgba(2, 132, 199, 0.45)',
        strobeTick: '#d97706',
        border: '#000000'
      };
    }

    if (isDark) {
      return {
        bg: '#090d16',
        text: '#f8fafc',
        cliff: '#334155',
        cliffEdge: '#64748b',
        ground: '#1e293b',
        groundLine: '#475569',
        rulerBg: '#fef9c3',
        rulerInk: '#0f172a',
        launcher: '#475569',
        photogateLed: '#022c22',
        photogateText: '#4ade80',
        bucket: '#f97316',
        ball: '#38bdf8',
        trajectory: '#38bdf8',
        ghost: 'rgba(56, 189, 248, 0.4)',
        strobeTick: '#fbbf24',
        border: 'rgba(56, 189, 248, 0.4)'
      };
    }

    // Default High-Contrast Light Mode (WCAG AAA)
    return {
      bg: '#ffffff',
      text: '#0f172a',
      cliff: '#94a3b8',
      cliffEdge: '#475569',
      ground: '#f1f5f9',
      groundLine: '#334155',
      rulerBg: '#fef9c3',
      rulerInk: '#0f172a',
      launcher: '#334155',
      photogateLed: '#052e16',
      photogateText: '#4ade80',
      bucket: '#ea580c',
      ball: '#0284c7',
      trajectory: '#0284c7',
      ghost: 'rgba(2, 132, 199, 0.4)',
      strobeTick: '#d97706',
      border: '#cbd5e1'
    };
  }

  updateTheme() {
    this.colors = this.getThemeColors();
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = Math.max(340, rect.width);
    this.height = Math.max(260, rect.height || 340);

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.updateMetrics();
  }

  updateMetrics() {
    if (!this.mission) return;
    // Layout coordinate origins
    this.floorY = this.height - 52;
    this.cliffX = 85; // Right edge of cliff
    this.cliffLeft = 20;

    // Determine scale (pixels per meter)
    const maxHeight = Math.max(10, this.mission.height * 1.3);
    const expectedDx = this.mission.isReverse ? this.mission.lockedDx : this.mission.expectedDx;
    const maxRange = Math.max(15, expectedDx * 1.35);

    const availW = this.width - this.cliffX - 35;
    const availH = this.floorY - 50;

    this.scaleX = availW / maxRange;
    this.scaleY = availH / maxHeight;
    this.scale = Math.min(this.scaleX, this.scaleY);

    // Minimum bucket catch radius in meters (±4% of distance or 0.6m)
    this.catchToleranceM = Math.max(0.6, expectedDx * 0.045);
  }

  setMission(mission) {
    this.mission = mission;
    this.isFlying = false;
    this.flightT = 0;
    this.strobeGhosts = [];
    this.confetti = [];
    this.lastResult = null;

    if (mission.isReverse) {
      this.bucketX = mission.lockedDx;
      this.dialVx = 0.0;
    } else {
      // Start bucket away from answer so student must interact
      this.bucketX = Math.max(2.0, Number((mission.expectedDx * 0.4).toFixed(1)));
    }

    this.updateMetrics();
  }

  setBucketPos(pos) {
    if (!this.mission || this.mission.isReverse) return;
    this.bucketX = Math.max(0.5, Math.min(200, Number(pos.toFixed(1))));
    if (this.onBucketMove) this.onBucketMove(this.bucketX);
  }

  setDialSpeed(val) {
    this.dialVx = Math.max(0, Math.min(40, Number(val.toFixed(1))));
  }

  initEvents() {
    const getPos = e => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const isNearBucket = pos => {
      if (!this.mission || this.mission.isReverse) return false;
      const bCanvasX = this.toCanvasX(this.bucketX);
      return Math.abs(pos.x - bCanvasX) <= 28 && pos.y >= this.floorY - 30 && pos.y <= this.floorY + 25;
    };

    this.canvas.addEventListener('pointerdown', e => {
      const pos = getPos(e);
      if (isNearBucket(pos)) {
        this.isDraggingBucket = true;
        this.canvas.setPointerCapture(e.pointerId);
        this.canvas.style.cursor = 'grabbing';
      }
    });

    this.canvas.addEventListener('pointermove', e => {
      const pos = getPos(e);
      if (this.isDraggingBucket) {
        const worldX = this.toWorldX(pos.x);
        this.setBucketPos(worldX);
      } else {
        this.canvas.style.cursor = isNearBucket(pos) ? 'grab' : 'default';
      }
    });

    const stopDrag = e => {
      if (this.isDraggingBucket) {
        this.isDraggingBucket = false;
        try { this.canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        this.canvas.style.cursor = 'default';
        window.soundFx.playClick();
      }
    };

    this.canvas.addEventListener('pointerup', stopDrag);
    this.canvas.addEventListener('pointercancel', stopDrag);
  }

  toCanvasX(worldX) {
    return this.cliffX + worldX * this.scale;
  }

  toCanvasY(worldY) {
    return this.floorY - worldY * this.scale;
  }

  toWorldX(canvasX) {
    return Math.max(0, (canvasX - this.cliffX) / this.scale);
  }

  launch(onFinish) {
    if (!this.mission || this.isFlying) return;
    this.isFlying = true;
    this.flightT = 0;
    this.strobeGhosts = [];
    this.confetti = [];
    this.lastResult = null;

    const vx = this.mission.isReverse ? this.dialVx : this.mission.vx;
    const h = this.mission.height;
    this.flightDuration = Math.sqrt(h / 5); // t = √(Δy / 5) with g = 10
    this.onFlightFinish = onFinish;

    window.soundFx.playLaunch();
  }

  startLoop() {
    let lastTime = performance.now();
    const loop = now => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      this.update(dt);
      this.draw();
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    if (this.isFlying && this.mission) {
      const vx = this.mission.isReverse ? this.dialVx : this.mission.vx;
      const h = this.mission.height;
      const prevT = this.flightT;
      this.flightT = Math.min(this.flightDuration, this.flightT + dt);

      // Current positions
      this.currentBallX = vx * this.flightT;
      this.currentBallY = Math.max(0, h - 5 * this.flightT * this.flightT);

      // Strobe ghosts every 0.5 seconds
      const strobeInterval = 0.5;
      const lastK = Math.floor(prevT / strobeInterval);
      const currK = Math.floor(this.flightT / strobeInterval);
      if (currK > lastK) {
        const tSnap = currK * strobeInterval;
        this.strobeGhosts.push({
          x: vx * tSnap,
          y: Math.max(0, h - 5 * tSnap * tSnap),
          t: tSnap
        });
      }

      // Check impact when flight reaches duration
      if (this.flightT >= this.flightDuration) {
        this.isFlying = false;
        const landingX = vx * this.flightDuration;
        const targetX = this.bucketX;
        const dist = Math.abs(landingX - targetX);
        const isHit = dist <= this.catchToleranceM;

        this.lastResult = isHit ? 'hit' : 'miss';

        if (isHit) {
          window.soundFx.playClang();
          window.soundFx.playSuccessChime();
          this.spawnConfetti(this.toCanvasX(landingX), this.floorY);
        } else {
          window.soundFx.playThud();
        }

        if (this.onFlightFinish) {
          this.onFlightFinish({
            isHit,
            landingX,
            targetX,
            diff: landingX - targetX,
            hangTime: this.flightDuration
          });
        }
      }
    }

    // Update confetti particles
    this.confetti = this.confetti.filter(p => (p.life -= dt) > 0);
    this.confetti.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 450 * dt; // gravity on confetti
    });
  }

  spawnConfetti(cx, cy) {
    const colors = ['#f59e0b', '#0284c7', '#10b981', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < 65; i++) {
      const angle = -Math.PI * (0.15 + Math.random() * 0.7);
      const speed = 120 + Math.random() * 260;
      this.confetti.push({
        x: cx,
        y: cy - 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: colors[i % colors.length],
        life: 0.8 + Math.random() * 0.9
      });
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Background fill
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    if (!this.mission) return;

    this.drawGround();
    this.drawCliff();
    this.drawLauncher();
    this.drawTargetBucket();
    this.drawStrobeGhosts();
    this.drawTrajectory();
    this.drawBall();
    this.drawConfetti();
  }

  drawGround() {
    const ctx = this.ctx;
    const y = this.floorY;

    // Floor runway block
    ctx.fillStyle = this.colors.ground;
    ctx.fillRect(0, y, this.width, this.height - y);

    // High-contrast ground line
    ctx.strokeStyle = this.colors.groundLine;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(this.width, y);
    ctx.stroke();

    // Metric runway tick marks
    const maxRange = this.toWorldX(this.width - 20);
    const tickInterval = maxRange > 60 ? 10 : maxRange > 25 ? 5 : 2;

    ctx.fillStyle = this.colors.text;
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let x = 0; x <= maxRange; x += tickInterval) {
      const cx = this.toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx, y + 8);
      ctx.strokeStyle = this.colors.groundLine;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillText(`${x}m`, cx, y + 10);
    }
  }

  drawCliff() {
    const ctx = this.ctx;
    const cliffH = this.mission.height;
    const topY = this.toCanvasY(cliffH);
    const cliffW = this.cliffX - this.cliffLeft;

    // Cliff structure
    ctx.fillStyle = this.colors.cliff;
    ctx.fillRect(this.cliffLeft, topY, cliffW, this.floorY - topY);

    // Cliff boundary line
    ctx.strokeStyle = this.colors.cliffEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.cliffLeft, topY, cliffW, this.floorY - topY);

    // Vertical height ruler (on face of cliff)
    const rulerW = 22;
    const rx = this.cliffLeft - rulerW - 4;
    ctx.fillStyle = this.colors.rulerBg;
    ctx.fillRect(rx, topY, rulerW, this.floorY - topY);
    ctx.strokeStyle = this.colors.rulerInk;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rx, topY, rulerW, this.floorY - topY);

    // Ruler ticks
    ctx.fillStyle = this.colors.rulerInk;
    ctx.font = '800 10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const step = cliffH > 30 ? 10 : cliffH > 10 ? 5 : 1;
    for (let h = 0; h <= cliffH; h += step) {
      const cy = this.toCanvasY(h);
      ctx.beginPath();
      ctx.moveTo(rx + rulerW, cy);
      ctx.lineTo(rx + rulerW - 7, cy);
      ctx.stroke();
      if (h > 0 && h < cliffH) {
        ctx.fillText(`${h}m`, rx - 2, cy);
      }
    }

    // Height badge at top of cliff
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(this.cliffLeft + cliffW / 2, topY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '800 12px monospace';
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'left';
    ctx.fillText(`Δy = ${cliffH.toFixed(1)} m`, this.cliffLeft + 8, topY - 10);
  }

  drawLauncher() {
    const ctx = this.ctx;
    const cliffH = this.mission.height;
    const topY = this.toCanvasY(cliffH);

    // Pneumatic launch barrel
    const barrelW = 34;
    const barrelH = 12;
    const bx = this.cliffX - barrelW;
    const by = topY - barrelH / 2;

    ctx.fillStyle = this.colors.launcher;
    ctx.fillRect(bx, by, barrelW, barrelH);
    ctx.strokeStyle = this.colors.cliffEdge;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, barrelW, barrelH);

    // Digital Photogate display box mounted above barrel
    const gateW = 68;
    const gateH = 22;
    const gx = bx - 14;
    const gy = by - gateH - 4;

    ctx.fillStyle = this.colors.photogateLed;
    ctx.fillRect(gx, gy, gateW, gateH);
    ctx.strokeStyle = this.colors.cliffEdge;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(gx, gy, gateW, gateH);

    // LED speed readout
    const currentSpeed = this.mission.isReverse ? this.dialVx : this.mission.vx;
    ctx.fillStyle = this.colors.photogateText;
    ctx.font = '800 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${currentSpeed.toFixed(1)} m/s`, gx + gateW / 2, gy + gateH / 2);
  }

  drawTargetBucket() {
    const ctx = this.ctx;
    const bx = this.toCanvasX(this.bucketX);
    const by = this.floorY;
    const bw = 34;
    const bh = 18;

    // Bucket catch container
    ctx.fillStyle = this.colors.bucket;
    ctx.beginPath();
    ctx.moveTo(bx - bw / 2, by - 2);
    ctx.lineTo(bx + bw / 2, by - 2);
    ctx.lineTo(bx + bw / 3, by + bh);
    ctx.lineTo(bx - bw / 3, by + bh);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Target bullseye reticle inside bucket mouth
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(bx - bw / 2 + 2, by - 2, bw - 4, 3);

    // Distance pin pointer below bucket
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, by + bh);
    ctx.lineTo(bx, by + bh + 8);
    ctx.stroke();

    // Distance label badge
    ctx.fillStyle = this.colors.text;
    ctx.font = '800 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const label = this.mission.isReverse ? `🔒 TARGET: ${this.bucketX.toFixed(1)}m` : `BUCKET: ${this.bucketX.toFixed(1)}m`;
    ctx.fillText(label, bx, by - 22);
  }

  drawTrajectory() {
    if (!this.isFlying && !this.lastResult) return;
    const ctx = this.ctx;
    const vx = this.mission.isReverse ? this.dialVx : this.mission.vx;
    const h = this.mission.height;
    const dur = this.isFlying ? this.flightT : this.flightDuration;

    ctx.strokeStyle = this.colors.trajectory;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();

    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = dur * (i / steps);
      const x = this.toCanvasX(vx * t);
      const y = this.toCanvasY(Math.max(0, h - 5 * t * t));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawStrobeGhosts() {
    if (!this.showStrobe) return;
    const ctx = this.ctx;
    this.strobeGhosts.forEach(g => {
      const cx = this.toCanvasX(g.x);
      const cy = this.toCanvasY(g.y);

      // Semi-transparent ghost ball
      ctx.fillStyle = this.colors.ghost;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      // Small time stamp
      ctx.fillStyle = this.colors.strobeTick;
      ctx.font = '700 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${g.t.toFixed(1)}s`, cx, cy - 6);
    });
  }

  drawBall() {
    const ctx = this.ctx;
    let bx, by;

    if (this.isFlying) {
      bx = this.toCanvasX(this.currentBallX);
      by = this.toCanvasY(this.currentBallY);
    } else if (this.lastResult) {
      const vx = this.mission.isReverse ? this.dialVx : this.mission.vx;
      const finalX = vx * this.flightDuration;
      bx = this.toCanvasX(finalX);
      by = this.floorY - 6;
    } else {
      // In the launcher ready to fire
      bx = this.cliffX;
      by = this.toCanvasY(this.mission.height);
    }

    ctx.fillStyle = this.colors.ball;
    ctx.beginPath();
    ctx.arc(bx, by, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  drawConfetti() {
    const ctx = this.ctx;
    this.confetti.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;
  }
}

window.TargetCanvas = TargetCanvas;

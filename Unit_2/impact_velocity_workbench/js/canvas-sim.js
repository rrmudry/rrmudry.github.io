// Impact Velocity & Vector Angle Workbench — HTML5 Canvas Physics & 2D Vector Simulator
// 60 FPS Parabolic Trajectory, In-Flight Vector HUD, and Landing Vector Triangle Inspector

(function () {
  const { Phys, fmt, fmtExact, fmtAns } = window.CalculationEngine;

  class ImpactSimCanvas {
    constructor(canvasEl) {
      this.canvas = canvasEl;
      this.ctx = canvasEl.getContext('2d');
      this.scenario = null;
      this.flight = null; // { t, maxT, active, vx, vy, ghosts: [] }
      this.showVectors = true;
      this.showStrobe = true;
      this.playbackSpeed = 1.0;
      this.particles = [];
      this.impactReached = false;
      this.inspectZoom = false; // toggle magnified vector overlay
      this.showPip = true; // Picture-in-Picture vector view
      this.onTimeUpdate = null; // callback(t, maxT)

      this.pal = {};
      this.refreshPalette();
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    refreshPalette() {
      const isDark = document.documentElement.classList.contains('theme-dark');
      const isProj = document.documentElement.classList.contains('projector');

      if (isProj) {
        this.pal = {
          bg: '#ffffff',
          ink: '#0f172a',
          cliff: '#64748b',
          cliffFace: '#475569',
          ground: '#000000',
          rulerBg: '#fef08a',
          rulerBorder: '#000000',
          rulerInk: '#000000',
          ball: '#0f172a',
          ballGlow: 'rgba(15, 23, 42, 0.2)',
          ghost: '#94a3b8',
          vx: '#0284c7',   // blue
          vy: '#d97706',   // orange
          v: '#7c3aed',    // purple
          theta: '#059669', // emerald
          bucket: '#ea580c',
          ledBg: '#022c22',
          ledText: '#22c55e',
          arcLine: '#0284c7'
        };
      } else if (isDark) {
        this.pal = {
          bg: '#0b1324',
          ink: '#f8fafc',
          cliff: '#334155',
          cliffFace: '#1e293b',
          ground: '#475569',
          rulerBg: '#fef9c3',
          rulerBorder: '#eab308',
          rulerInk: '#0f172a',
          ball: '#ffffff',
          ballGlow: 'rgba(56, 189, 248, 0.4)',
          ghost: '#64748b',
          vx: '#38bdf8',
          vy: '#fbbf24',
          v: '#c084fc',
          theta: '#34d399',
          bucket: '#fb923c',
          ledBg: '#052e16',
          ledText: '#4ade80',
          arcLine: '#38bdf8'
        };
      } else {
        // High contrast light mode (WCAG AAA)
        this.pal = {
          bg: '#ffffff',
          ink: '#0f172a',
          cliff: '#94a3b8',
          cliffFace: '#64748b',
          ground: '#334155',
          rulerBg: '#fef9c3',
          rulerBorder: '#ca8a04',
          rulerInk: '#0f172a',
          ball: '#0f172a',
          ballGlow: 'rgba(2, 132, 199, 0.2)',
          ghost: '#94a3b8',
          vx: '#0284c7',
          vy: '#d97706',
          v: '#7c3aed',
          theta: '#059669',
          bucket: '#ea580c',
          ledBg: '#064e3b',
          ledText: '#34d399',
          arcLine: '#0284c7'
        };
      }
      this.draw();
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const w = Math.max(340, Math.floor(rect.width));
      const h = Math.max(300, Math.floor(rect.height || 420));
      const dpr = window.devicePixelRatio || 1;

      this.W = w;
      this.H = h;
      this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';

      this.computeLayout();
      this.draw();
    }

    setScenario(sc) {
      this.scenario = sc;
      this.flight = {
        t: 0,
        maxT: sc.t,
        active: false,
        ghosts: [],
        lastGhostT: 0
      };
      this.particles = [];
      this.impactReached = false;
      this.computeLayout();
      this.draw();
      if (this.onTimeUpdate) {
        this.onTimeUpdate(0, sc.t);
      }
    }

    computeLayout() {
      if (!this.scenario) return;
      const { W, H } = this;
      this.scaleUi = Math.min(1.6, Math.max(0.9, W / 800));

      this.marginL = 14 * this.scaleUi;
      this.rulerW = 48 * this.scaleUi;
      this.cliffW = 60 * this.scaleUi;
      this.floorH = 46 * this.scaleUi;

      this.x0 = this.marginL + this.rulerW + this.cliffW; // world x = 0 (launch edge)
      this.floorY = H - this.floorH; // world y = 0
      this.topY = 65 * this.scaleUi; // top margin for photogate readout

      const availW = W - this.x0 - (40 * this.scaleUi);
      const availH = this.floorY - this.topY;

      // Coordinate scaling (pixels per meter)
      const scaleX = availW / (this.scenario.dx * 1.35 || 10);
      const scaleY = availH / (this.scenario.dy || 1);
      this.mScale = Math.min(scaleX, scaleY);

      // Launcher position
      this.cliffTopY = this.floorY - (this.scenario.dy * this.mScale);
    }

    worldToScreen(xM, yM) {
      return {
        x: this.x0 + (xM * this.mScale),
        y: this.floorY - (yM * this.mScale)
      };
    }

    launch(onImpactCallback) {
      if (!this.scenario) return;
      this.flight = {
        t: 0,
        maxT: this.scenario.t,
        active: true,
        ghosts: [],
        lastGhostT: 0,
        onImpact: onImpactCallback
      };
      this.particles = [];
      this.impactReached = false;
      this.animate();
    }

    reset() {
      if (!this.scenario) return;
      this.flight = {
        t: 0,
        maxT: this.scenario.t,
        active: false,
        ghosts: [],
        lastGhostT: 0
      };
      this.particles = [];
      this.impactReached = false;
      this.draw();
      if (this.onTimeUpdate) {
        this.onTimeUpdate(0, this.scenario.t);
      }
    }

    setTime(t) {
      if (!this.scenario) return;
      const maxT = this.scenario.t;
      const clampedT = Math.max(0, Math.min(t, maxT));
      if (!this.flight) {
        this.flight = {
          t: clampedT,
          maxT,
          active: false,
          ghosts: [],
          lastGhostT: 0
        };
      } else {
        this.flight.t = clampedT;
        this.flight.active = false; // pause when manually scrubbing
      }

      // Rebuild strobe ghosts up to clampedT
      this.flight.ghosts = [];
      if (this.showStrobe) {
        for (let st = 0.5; st <= clampedT; st += 0.5) {
          const curY = Math.max(0, this.scenario.dy - 5 * (st * st));
          const curX = this.scenario.vx * st;
          this.flight.ghosts.push({ x: curX, y: curY, t: st });
        }
      }

      this.impactReached = (clampedT >= maxT - 0.001);
      this.draw();
      if (this.onTimeUpdate) {
        this.onTimeUpdate(clampedT, maxT);
      }
    }

    togglePlay(onImpactCallback) {
      if (!this.scenario) return false;
      if (!this.flight) {
        this.launch(onImpactCallback);
        return true;
      }
      if (this.flight.active) {
        this.flight.active = false;
        return false;
      } else {
        if (this.flight.t >= this.flight.maxT - 0.001) {
          this.flight.t = 0;
          this.flight.ghosts = [];
          this.flight.lastGhostT = 0;
          this.impactReached = false;
        }
        this.flight.active = true;
        if (onImpactCallback) this.flight.onImpact = onImpactCallback;
        this.animate();
        return true;
      }
    }

    togglePip() {
      this.showPip = !this.showPip;
      this.draw();
      return this.showPip;
    }

    toggleZoom() {
      this.inspectZoom = !this.inspectZoom;
      this.draw();
      return this.inspectZoom;
    }

    animate() {
      if (!this.flight || !this.flight.active) return;

      const dt = 0.016 * this.playbackSpeed;
      this.flight.t += dt;

      // Record 0.5s strobe ghost
      if (this.showStrobe && (this.flight.t - this.flight.lastGhostT >= 0.5)) {
        this.flight.lastGhostT = this.flight.t;
        const curY = Math.max(0, this.scenario.dy - 5 * (this.flight.t * this.flight.t));
        const curX = this.scenario.vx * this.flight.t;
        this.flight.ghosts.push({ x: curX, y: curY, t: this.flight.t });
      }

      // Check impact
      if (this.flight.t >= this.flight.maxT) {
        this.flight.t = this.flight.maxT;
        this.flight.active = false;
        this.impactReached = true;
        this.spawnImpactParticles();
        if (this.flight.onImpact) this.flight.onImpact();
      }

      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.flight.t, this.flight.maxT);
      }

      this.draw();

      if (this.flight && this.flight.active) {
        requestAnimationFrame(() => this.animate());
      }
    }

    spawnImpactParticles() {
      const landPos = this.worldToScreen(this.scenario.dx, 0);
      for (let i = 0; i < 28; i++) {
        const angle = -Math.PI * (0.1 + Math.random() * 0.8);
        const spd = 2 + Math.random() * 6;
        this.particles.push({
          x: landPos.x,
          y: landPos.y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 1.0,
          color: [this.pal.vx, this.pal.vy, this.pal.v, '#eab308'][Math.floor(Math.random() * 4)]
        });
      }
    }

    draw() {
      const { ctx, W, H, dpr } = this;
      if (!ctx || !W || !H) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = this.pal.bg;
      ctx.fillRect(0, 0, W, H);

      if (!this.scenario) {
        ctx.restore();
        return;
      }

      this.drawEnvironment();
      this.drawTrajectoryTrail();
      this.drawStrobeGhosts();
      this.drawTargetBucket();
      this.drawBallAndVectors();
      this.drawParticles();
      this.drawImpactVectorTriangle();
      this.drawPipVectorInset();

      ctx.restore();
    }

    drawEnvironment() {
      const { ctx } = this;
      const cliffTop = this.cliffTopY;
      const cliffL = this.marginL + this.rulerW;

      // 1. Cliff face / body
      ctx.fillStyle = this.pal.cliffFace;
      ctx.fillRect(cliffL, cliffTop, this.cliffW, this.floorY - cliffTop);

      // Cliff top ledge highlight
      ctx.fillStyle = this.pal.cliff;
      ctx.fillRect(cliffL, cliffTop, this.cliffW, 6);

      // 2. Height Ruler (Yellow vertical scale on left)
      const rulerX = this.marginL;
      ctx.fillStyle = this.pal.rulerBg;
      ctx.fillRect(rulerX, cliffTop, this.rulerW, this.floorY - cliffTop);
      ctx.strokeStyle = this.pal.rulerBorder;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rulerX, cliffTop, this.rulerW, this.floorY - cliffTop);

      // Height ticks
      ctx.fillStyle = this.pal.rulerInk;
      ctx.font = `bold ${Math.max(9, 10 * this.scaleUi)}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const dy = this.scenario.dy;
      const numTicks = Math.min(10, Math.ceil(dy));
      const stepM = dy <= 2 ? 0.2 : dy <= 5 ? 1 : dy <= 20 ? 5 : 10;

      for (let m = 0; m <= dy + 1e-5; m += stepM) {
        const yPx = this.floorY - (m * this.mScale);
        ctx.beginPath();
        ctx.moveTo(rulerX + this.rulerW - 12, yPx);
        ctx.lineTo(rulerX + this.rulerW, yPx);
        ctx.stroke();

        ctx.fillText(`${fmtExact(m)}m`, rulerX + this.rulerW - 14, yPx);
      }

      // Height indicator line to cliff top
      ctx.strokeStyle = '#dc2626';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(rulerX, cliffTop);
      ctx.lineTo(this.x0 + 15, cliffTop);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Ground / Floor runway
      ctx.fillStyle = this.pal.ground;
      ctx.fillRect(0, this.floorY, this.W, this.H - this.floorY);

      // Floor ruler (yellow strip right beneath floor line)
      const fRulerY = this.floorY + 2;
      const fRulerH = 26 * this.scaleUi;
      ctx.fillStyle = this.pal.rulerBg;
      ctx.fillRect(this.x0, fRulerY, this.W - this.x0, fRulerH);
      ctx.strokeStyle = this.pal.rulerBorder;
      ctx.strokeRect(this.x0, fRulerY, this.W - this.x0, fRulerH);

      // Floor ticks
      ctx.fillStyle = this.pal.rulerInk;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const dxMax = (this.W - this.x0) / this.mScale;
      const xStep = dxMax <= 5 ? 0.5 : dxMax <= 15 ? 1 : dxMax <= 50 ? 5 : 20;

      for (let xm = 0; xm <= dxMax; xm += xStep) {
        const xPx = this.x0 + (xm * this.mScale);
        ctx.beginPath();
        ctx.moveTo(xPx, fRulerY);
        ctx.lineTo(xPx, fRulerY + 6);
        ctx.stroke();
        ctx.fillText(`${fmtExact(xm)}m`, xPx, fRulerY + 8);
      }

      // 4. Spring Launcher & Photogate LED display on cliff
      const launchX = this.x0 - 15 * this.scaleUi;
      const launchY = cliffTop - 12 * this.scaleUi;
      ctx.fillStyle = '#475569';
      ctx.fillRect(launchX - 35 * this.scaleUi, launchY, 40 * this.scaleUi, 12 * this.scaleUi);

      // Photogate LED Box
      const ledW = 90 * this.scaleUi;
      const ledH = 34 * this.scaleUi;
      const ledX = this.x0 - ledW - 5;
      const ledY = cliffTop - ledH - 18 * this.scaleUi;

      ctx.fillStyle = this.pal.ledBg;
      ctx.beginPath();
      ctx.roundRect(ledX, ledY, ledW, ledH, 6);
      ctx.fill();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = this.pal.ledText;
      ctx.font = `bold ${Math.max(12, 13 * this.scaleUi)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${fmtExact(this.scenario.vx)} m/s`, ledX + ledW / 2, ledY + ledH / 2 + 1);

      // Small photogate label
      ctx.fillStyle = '#94a3b8';
      ctx.font = `bold ${Math.max(8, 9 * this.scaleUi)}px sans-serif`;
      ctx.fillText('PHOTOGATE (v_x)', ledX + ledW / 2, ledY - 6);
    }

    drawTargetBucket() {
      const { ctx } = this;
      const targetM = this.targetBucketX !== undefined && this.targetBucketX !== null ? this.targetBucketX : this.scenario.dx;
      const pos = this.worldToScreen(targetM, 0);
      const bW = 28 * this.scaleUi;
      const bH = 22 * this.scaleUi;

      // Draggable / target bucket at landing position
      ctx.fillStyle = this.pal.bucket;
      ctx.beginPath();
      ctx.moveTo(pos.x - bW / 2, pos.y);
      ctx.lineTo(pos.x + bW / 2, pos.y);
      ctx.lineTo(pos.x + (bW / 2) * 0.75, pos.y + bH);
      ctx.lineTo(pos.x - (bW / 2) * 0.75, pos.y + bH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bucket label banner
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.roundRect(pos.x - 38 * this.scaleUi, pos.y - 28 * this.scaleUi, 76 * this.scaleUi, 16 * this.scaleUi, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(9, 9.5 * this.scaleUi)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Target: ${fmtAns(targetM)}m`, pos.x, pos.y - 20 * this.scaleUi);

      // Downward pointer arrow
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - 12 * this.scaleUi);
      ctx.lineTo(pos.x, pos.y - 2);
      ctx.stroke();
    }

    drawTrajectoryTrail() {
      const { ctx } = this;
      ctx.strokeStyle = this.pal.arcLine;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      const start = this.worldToScreen(0, this.scenario.dy);
      ctx.moveTo(start.x, start.y);

      const maxT = this.flight ? this.flight.t : this.scenario.t;
      for (let t = 0; t <= maxT + 1e-5; t += 0.04) {
        const xM = this.scenario.vx * t;
        const yM = Math.max(0, this.scenario.dy - 5 * (t * t));
        const pt = this.worldToScreen(xM, yM);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    drawStrobeGhosts() {
      if (!this.flight || !this.showStrobe) return;
      const { ctx } = this;

      this.flight.ghosts.forEach((g, idx) => {
        const pt = this.worldToScreen(g.x, g.y);
        ctx.fillStyle = this.pal.ghost;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.5 * this.scaleUi, 0, Math.PI * 2);
        ctx.fill();

        // Strobe second label
        ctx.fillStyle = this.pal.ink;
        ctx.font = `600 ${Math.max(8, 8.5 * this.scaleUi)}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`t=${fmtExact(g.t)}s`, pt.x + 6, pt.y - 4);
      });
    }

    drawBallAndVectors() {
      const { ctx } = this;
      const t = this.flight ? this.flight.t : 0;
      const curX = this.scenario.vx * t;
      const curY = Math.max(0, this.scenario.dy - 5 * (t * t));
      const pos = this.worldToScreen(curX, curY);

      // Ball
      const r = 7 * this.scaleUi;
      ctx.fillStyle = this.pal.ball;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.pal.ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // In-flight velocity vectors
      if (this.showVectors && (t > 0 || (this.flight && this.flight.active))) {
        const vxM = this.scenario.vx;
        const vyM = 10 * t; // accelerates downward

        const vecScale = 2.2 * this.scaleUi; // pixel length per m/s

        // 1. Horizontal vector v_x (Blue)
        this.drawArrow(pos.x, pos.y, pos.x + vxM * vecScale, pos.y, this.pal.vx, 2.5);

        // 2. Vertical vector v_y (Orange - points straight down)
        if (vyM > 0.1) {
          this.drawArrow(pos.x, pos.y, pos.x, pos.y + vyM * vecScale, this.pal.vy, 2.5);
        }

        // 3. Resultant velocity vector v (Purple - tangent)
        const vEnd = {
          x: pos.x + vxM * vecScale,
          y: pos.y + vyM * vecScale
        };
        this.drawArrow(pos.x, pos.y, vEnd.x, vEnd.y, this.pal.v, 3);
      }
    }

    // THE HERO FEATURE: Magnified 2D Impact Vector Triangle at landing site
    drawImpactVectorTriangle() {
      if (!this.impactReached && !this.inspectZoom) return;

      const { ctx } = this;
      const landPos = this.worldToScreen(this.scenario.dx, 0);

      // Magnified vector triangle drawing dimensions
      const triScale = Math.min(6.5, Math.max(3.5, 120 / Math.max(this.scenario.vx, this.scenario.vy))) * this.scaleUi;
      const lenX = this.scenario.vx * triScale;
      const lenY = this.scenario.vy * triScale;

      // Anchor origin of triangle slightly shifted above ground so it's beautifully visible
      const ox = landPos.x;
      const oy = landPos.y;

      ctx.save();

      // Soft circular spotlight highlight behind the vector triangle
      const spotlightR = Math.max(70, Math.hypot(lenX, lenY) * 0.75 + 25);
      const grad = ctx.createRadialGradient(ox + lenX / 2, oy + lenY / 2, 10, ox + lenX / 2, oy + lenY / 2, spotlightR);
      grad.addColorStop(0, 'rgba(124, 58, 237, 0.15)');
      grad.addColorStop(1, 'rgba(124, 58, 237, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ox + lenX / 2, oy + lenY / 2, spotlightR, 0, Math.PI * 2);
      ctx.fill();

      // Right-angle square at corner (ox + lenX, oy)
      const sqSize = 12 * this.scaleUi;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ox + lenX - sqSize, oy, sqSize, sqSize);

      // 1. Horizontal Vector Component: v_x (Blue arrow, pointing right)
      this.drawArrow(ox, oy, ox + lenX, oy, this.pal.vx, 3.5);
      ctx.fillStyle = this.pal.vx;
      ctx.font = `bold ${Math.max(11, 12 * this.scaleUi)}px "JetBrains Mono", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`v_x = ${fmtExact(this.scenario.vx)} m/s`, ox + lenX / 2, oy - 6);

      // 2. Vertical Vector Component: v_y (Orange arrow, pointing DOWN)
      this.drawArrow(ox + lenX, oy, ox + lenX, oy + lenY, this.pal.vy, 3.5);
      ctx.fillStyle = this.pal.vy;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`v_y = ${fmtAns(this.scenario.vy)} m/s`, ox + lenX + 8, oy + lenY / 2);

      // 3. Resultant Impact Velocity: v (Purple arrow, along hypotenuse)
      this.drawArrow(ox, oy, ox + lenX, oy + lenY, this.pal.v, 4.5);
      ctx.fillStyle = this.pal.v;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      const midHyp = { x: ox + lenX * 0.45, y: oy + lenY * 0.45 };
      ctx.fillText(`v = ${fmtAns(this.scenario.v)} m/s`, midHyp.x - 8, midHyp.y + 4);

      // 4. Angle Arc θ (Emerald green arc at origin between horizontal and hypotenuse)
      const arcR = Math.min(38 * this.scaleUi, lenX * 0.4);
      const radAngle = Math.atan2(lenY, lenX);
      ctx.strokeStyle = this.pal.theta;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ox, oy, arcR, 0, radAngle);
      ctx.stroke();

      ctx.fillStyle = this.pal.theta;
      ctx.font = `bold ${Math.max(11, 12 * this.scaleUi)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const textAngle = radAngle / 2;
      const labelX = ox + (arcR + 10) * Math.cos(textAngle);
      const labelY = oy + (arcR + 10) * Math.sin(textAngle);
      ctx.fillText(`θ = ${fmt(this.scenario.theta, 1)}°`, labelX, labelY);

      ctx.restore();
    }

    // PICTURE-IN-PICTURE (PiP) Velocity Vector HUD & Real-time Triangle
    drawPipVectorInset() {
      if (!this.showPip || !this.scenario) return;

      const { ctx, W, H } = this;
      const t = this.flight ? this.flight.t : 0;
      const vx = this.scenario.vx;
      const vy = 10 * t; // downward speed accelerates dynamically
      const v = Math.hypot(vx, vy);
      const thetaDeg = Math.atan2(vy, vx) * (180 / Math.PI);

      const scale = this.scaleUi;
      const pipW = Math.min(270, Math.max(200, W * 0.35));
      const pipH = Math.min(190, Math.max(145, H * 0.38));
      const pipX = W - pipW - (12 * scale);
      const pipY = 10 * scale;

      ctx.save();

      // Card Body (High-contrast glassmorphic fill)
      const isLight = this.pal.bg === '#ffffff';
      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(15, 23, 42, 0.94)';
      ctx.beginPath();
      ctx.roundRect(pipX, pipY, pipW, pipH, 10 * scale);
      ctx.fill();

      // Card Border with Resultant Accent
      ctx.strokeStyle = this.pal.v;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Top Header Bar
      const headerH = 24 * scale;
      ctx.fillStyle = isLight ? '#f1f5f9' : '#1e293b';
      ctx.beginPath();
      ctx.roundRect(pipX, pipY, pipW, headerH, [10 * scale, 10 * scale, 0, 0]);
      ctx.fill();

      // Header Text
      ctx.fillStyle = this.pal.v;
      ctx.font = `bold ${Math.max(9, 10 * scale)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('📐 VELOCITY VECTORS (PiP)', pipX + 8 * scale, pipY + headerH / 2);

      // Current Time Badge
      ctx.fillStyle = this.pal.ink;
      ctx.font = `bold ${Math.max(9, 9.5 * scale)}px monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(`t = ${t.toFixed(2)}s`, pipX + pipW - 8 * scale, pipY + headerH / 2);

      // PiP Vector Triangle Canvas Origin
      const ox = pipX + 24 * scale;
      const oy = pipY + headerH + 18 * scale;
      const availW = pipW - (50 * scale);
      const availH = pipH - headerH - (44 * scale);

      // Max vector scaling factor
      const maxVy = 10 * this.scenario.t;
      const maxVx = this.scenario.vx;
      const vecScale = Math.min(availW / (maxVx * 1.15 || 1), availH / (maxVy * 1.15 || 1));

      const lenX = Math.max(16, vx * vecScale);
      const lenY = Math.max(0, vy * vecScale);

      // Right-angle square at corner (ox + lenX, oy)
      if (lenY > 10 * scale) {
        const sq = Math.min(8 * scale, lenY * 0.35, lenX * 0.35);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.strokeRect(ox + lenX - sq, oy, sq, sq);
      }

      // 1. Horizontal Vector: v_x (Blue)
      this.drawArrow(ox, oy, ox + lenX, oy, this.pal.vx, 2.5);
      ctx.fillStyle = this.pal.vx;
      ctx.font = `bold ${Math.max(8.5, 9 * scale)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`v_x = ${fmtExact(vx)}`, ox + lenX / 2, oy - 2);

      // 2. Vertical Vector: v_y (Orange, pointing down)
      if (lenY > 4) {
        this.drawArrow(ox + lenX, oy, ox + lenX, oy + lenY, this.pal.vy, 2.5);
        ctx.fillStyle = this.pal.vy;
        ctx.font = `bold ${Math.max(8.5, 9 * scale)}px monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`v_y = ${fmtAns(vy)}`, ox + lenX + 4, oy + lenY / 2);
      }

      // 3. Resultant Vector: v (Purple, along hypotenuse)
      this.drawArrow(ox, oy, ox + lenX, oy + lenY, this.pal.v, 3.2);

      // 4. Angle Arc θ (Emerald)
      if (lenY > 6) {
        const arcR = Math.min(22 * scale, lenX * 0.45);
        const rad = Math.atan2(lenY, lenX);
        ctx.strokeStyle = this.pal.theta;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ox, oy, arcR, 0, rad);
        ctx.stroke();

        ctx.fillStyle = this.pal.theta;
        ctx.font = `bold ${Math.max(8.5, 9 * scale)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const midA = rad / 2;
        ctx.fillText(`θ=${thetaDeg.toFixed(1)}°`, ox + (arcR + 4) * Math.cos(midA), oy + (arcR + 4) * Math.sin(midA));
      }

      // Origin Ball Icon
      ctx.fillStyle = this.pal.ball;
      ctx.beginPath();
      ctx.arc(ox, oy, 4.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Bottom Telemetry Bar
      const footerY = pipY + pipH - (18 * scale);
      ctx.fillStyle = isLight ? '#f8fafc' : '#0f172a';
      ctx.fillRect(pipX, footerY, pipW, 18 * scale);
      ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pipX, footerY);
      ctx.lineTo(pipX + pipW, footerY);
      ctx.stroke();

      ctx.font = `bold ${Math.max(8.5, 9 * scale)}px monospace`;
      ctx.textBaseline = 'middle';

      // Left: Resultant speed v
      ctx.fillStyle = this.pal.v;
      ctx.textAlign = 'left';
      ctx.fillText(`v = ${fmtAns(v)} m/s`, pipX + 8 * scale, footerY + 9 * scale);

      // Right: Angle θ
      ctx.fillStyle = this.pal.theta;
      ctx.textAlign = 'right';
      ctx.fillText(`θ = ${thetaDeg.toFixed(1)}°`, pipX + pipW - 8 * scale, footerY + 9 * scale);

      ctx.restore();
    }

    drawArrow(fromX, fromY, toX, toY, color, width) {
      const { ctx } = this;
      const headLen = Math.max(8, width * 3.5);
      const angle = Math.atan2(toY - fromY, toX - fromX);

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }

    drawParticles() {
      const { ctx } = this;
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // particle gravity
        p.life -= 0.025;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * this.scaleUi, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }
  }

  window.ImpactSimCanvas = ImpactSimCanvas;
})();

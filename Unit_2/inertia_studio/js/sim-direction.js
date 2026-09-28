// Inertia of Direction Simulation Module: Whirling Tether & Tangential Release
// Accurate physics: Centripetal force, tangential velocity, straight-line inertial escape, misconception contrast

class SimDirection {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.mode = 'tether'; // 'tether' or 'mud_spray'
    this.scale = 130; // pixels per meter

    // Physics parameters
    this.radius = 1.2; // meters
    this.omega = 4.0; // rad/s (~38 RPM)
    this.mass = 0.5; // kg
    this.showMisconception = true;

    // State
    this.angle = 0;
    this.state = 'rotating'; // 'rotating', 'released'
    this.time = 0;
    this.dt = 1 / 60;

    // Released object state (world coords in meters)
    this.objX = 0;
    this.objY = 0;
    this.objVx = 0;
    this.objVy = 0;

    // Cut point snapshot
    this.cutAngle = 0;
    this.cutX = 0;
    this.cutY = 0;
    this.cutVx = 0;
    this.cutVy = 0;

    // Droplets for mud spray mode
    this.droplets = [];

    this.reset();
  }

  reset() {
    this.state = 'rotating';
    this.time = 0;
    this.angle = 0;
    this.droplets = [];
  }

  setSpeed(rpmOrOmega) {
    this.omega = Math.max(1.0, Math.min(10.0, rpmOrOmega));
  }

  setRadius(r) {
    this.radius = Math.max(0.6, Math.min(1.8, r));
  }

  setShowMisconception(bool) {
    this.showMisconception = bool;
  }

  setMode(mode) {
    this.mode = mode;
    this.reset();
  }

  cutString() {
    if (this.state === 'released') return;
    this.state = 'released';

    // Snapshot release conditions
    this.cutAngle = this.angle;
    this.cutX = this.radius * Math.cos(this.cutAngle);
    this.cutY = this.radius * Math.sin(this.cutAngle);

    // Tangential velocity: perpendicular to radius vector (-sin, cos)
    const tangSpeed = this.omega * this.radius;
    this.cutVx = -tangSpeed * Math.sin(this.cutAngle);
    this.cutVy = tangSpeed * Math.cos(this.cutAngle);

    this.objX = this.cutX;
    this.objY = this.cutY;
    this.objVx = this.cutVx;
    this.objVy = this.cutVy;

    window.soundFx.playCutString();
  }

  update(timeStep) {
    const dt = timeStep || this.dt;
    this.time += dt;

    if (this.mode === 'tether') {
      if (this.state === 'rotating') {
        this.angle += this.omega * dt;
        if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;

        this.objX = this.radius * Math.cos(this.angle);
        this.objY = this.radius * Math.sin(this.angle);
        const tangSpeed = this.omega * this.radius;
        this.objVx = -tangSpeed * Math.sin(this.angle);
        this.objVy = tangSpeed * Math.cos(this.angle);
      } else {
        // Released! Newton's 1st Law: Constant velocity along straight tangent!
        this.objX += this.objVx * dt;
        this.objY += this.objVy * dt;

        // Auto-loop when flying far off-screen
        const distFromCenter = Math.hypot(this.objX, this.objY);
        if (distFromCenter > 4.5) {
          this.reset();
        }
      }
    } else {
      // Mud Spray Mode
      this.angle += this.omega * dt;
      if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;

      // Spawn spray droplets at wheel surface
      if (Math.random() < 0.65) {
        const dropAngle = this.angle + (Math.random() - 0.5) * 0.4;
        const tangSpeed = this.omega * this.radius;
        this.droplets.push({
          x: this.radius * Math.cos(dropAngle),
          y: this.radius * Math.sin(dropAngle),
          vx: -tangSpeed * Math.sin(dropAngle) + (Math.random() - 0.5) * 0.4,
          vy: tangSpeed * Math.cos(dropAngle) + (Math.random() - 0.5) * 0.4,
          life: 1.0,
          color: Math.random() > 0.4 ? '#38bdf8' : '#e2e8f0'
        });
      }

      // Update droplets (straight line inertial motion)
      for (let i = this.droplets.length - 1; i >= 0; i--) {
        const d = this.droplets[i];
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.life -= dt * 0.8;
        if (d.life <= 0) {
          this.droplets.splice(i, 1);
        }
      }
    }
  }

  getTelemetry() {
    const tangSpeed = (this.omega * this.radius).toFixed(2);
    const centripetalA = (this.omega * this.omega * this.radius).toFixed(1);
    const tensionForce = (this.mass * this.omega * this.omega * this.radius).toFixed(1);

    return {
      radius: this.radius.toFixed(2),
      tangSpeed: tangSpeed,
      angularSpeed: this.omega.toFixed(1),
      centripetalA: this.state === 'rotating' ? centripetalA : '0.0',
      tensionForce: this.state === 'rotating' ? tensionForce : '0.0',
      state: this.state
    };
  }

  render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2 + 10;
    const scale = this.scale;

    // 1. Draw Subtle Circular Orbit Grid
    ctx.save();
    const isLightOrbit = document.body.classList.contains('light-theme');
    ctx.strokeStyle = isLightOrbit ? '#cbd5e1' : '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.radius * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.strokeStyle = isLightOrbit ? '#94a3b8' : '#0f172a';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(centerX - this.radius * scale - 40, centerY);
    ctx.lineTo(centerX + this.radius * scale + 40, centerY);
    ctx.moveTo(centerX, centerY - this.radius * scale - 40);
    ctx.lineTo(centerX, centerY + this.radius * scale + 40);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 2. Draw Center Pivot Post
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.mode === 'tether') {
      this.renderTetherScene(centerX, centerY, scale);
    } else {
      this.renderMudSprayScene(centerX, centerY, scale);
    }

    // 3. Draw Educational Status Banner
    this.drawStatusBanner(w, h);
  }

  renderTetherScene(centerX, centerY, scale) {
    const ctx = this.ctx;
    const pxX = centerX + this.objX * scale;
    const pxY = centerY + this.objY * scale;

    // A. Draw String / Tether (if not cut)
    if (this.state === 'rotating') {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(pxX, pxY);
      ctx.stroke();

      // Inward Centripetal Tension Force Arrow (Amber)
      const tLen = Math.min(65, this.omega * this.radius * 7);
      const angleToCenter = Math.atan2(centerY - pxY, centerX - pxX);
      this.drawArrow(pxX, pxY, pxX + Math.cos(angleToCenter) * tLen, pxY + Math.sin(angleToCenter) * tLen, '#f59e0b', 'F_tension (Inward)');

      // Tangential Velocity Vector (Cyan)
      const vLen = Math.min(80, this.omega * this.radius * 14);
      const tangAngle = this.angle + Math.PI / 2;
      this.drawArrow(pxX, pxY, pxX + Math.cos(tangAngle) * vLen, pxY + Math.sin(tangAngle) * vLen, '#06b6d4', 'v_tangent');
    } else {
      // Snapped String Remnant
      const cutPxX = centerX + this.cutX * scale;
      const cutPxY = centerY + this.cutY * scale;

      const isLightTether = document.body.classList.contains('light-theme');
      ctx.strokeStyle = isLightTether ? 'rgba(2, 132, 199, 0.4)' : 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(cutPxX, cutPxY);
      ctx.stroke();
      ctx.setLineDash([]);

      // ✂️ Cut Icon at break point
      ctx.fillStyle = isLightTether ? '#b91c1c' : '#ef4444';
      ctx.font = '16px Outfit, sans-serif';
      ctx.fillText('✂️ Cut!', cutPxX + 8, cutPxY - 8);

      // Tangent Straight Path Line (Newtonian Reality)
      ctx.save();
      ctx.strokeStyle = isLightTether ? '#047857' : '#10b981';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(cutPxX - this.cutVx * scale * 0.4, cutPxY - this.cutVy * scale * 0.4);
      ctx.lineTo(cutPxX + this.cutVx * scale * 1.5, cutPxY + this.cutVy * scale * 1.5);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = isLightTether ? '#047857' : '#10b981';
      ctx.font = '700 12px JetBrains Mono, monospace';
      ctx.fillText('✓ REALITY: Straight Tangent Line (F_net = 0)', cutPxX + 15, cutPxY + 28);
      ctx.restore();

      // Misconception Curved Line (Outward Spiral)
      if (this.showMisconception) {
        ctx.save();
        ctx.strokeStyle = isLightTether ? 'rgba(185, 28, 28, 0.8)' : 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);

        // Draw fake centrifugal outward spiral
        ctx.beginPath();
        for (let t = 0; t <= 1.2; t += 0.05) {
          const fakeR = (this.radius + t * 0.9) * scale;
          const fakeA = this.cutAngle + t * 0.8;
          const fx = centerX + fakeR * Math.cos(fakeA);
          const fy = centerY + fakeR * Math.sin(fakeA);
          if (t === 0) ctx.moveTo(fx, fy);
          else ctx.lineTo(fx, fy);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = isLightTether ? '#b91c1c' : '#ef4444';
        ctx.font = '600 11px Outfit, sans-serif';
        ctx.fillText('❌ FALSE MYTH: "Curved Outward Spiral"', cutPxX + 25, cutPxY + 46);
        ctx.restore();
      }

      // Velocity Arrow of Flying Object
      const vLen = Math.min(80, Math.hypot(this.objVx, this.objVy) * 12);
      const curVAngle = Math.atan2(this.objVy, this.objVx);
      this.drawArrow(pxX, pxY, pxX + Math.cos(curVAngle) * vLen, pxY + Math.sin(curVAngle) * vLen, '#06b6d4', 'v (Constant!)');
    }

    // B. Draw Whirling Mass Ball
    ctx.save();
    ctx.fillStyle = this.state === 'rotating' ? '#f43f5e' : '#10b981';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(pxX, pxY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  renderMudSprayScene(centerX, centerY, scale) {
    const ctx = this.ctx;
    const rPx = this.radius * scale;

    // Draw Bicycle Tire Wheel
    ctx.save();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rPx, 0, Math.PI * 2);
    ctx.stroke();

    // Spokes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
      const a = this.angle + (i * Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + rPx * Math.cos(a), centerY + rPx * Math.sin(a));
      ctx.stroke();
    }
    ctx.restore();

    // Draw Droplets
    for (const d of this.droplets) {
      const pxX = centerX + d.x * scale;
      const pxY = centerY + d.y * scale;

      ctx.save();
      ctx.fillStyle = d.color;
      ctx.globalAlpha = d.life;
      ctx.beginPath();
      ctx.arc(pxX, pxY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Mini tangent tail
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pxX, pxY);
      ctx.lineTo(pxX - d.vx * 2, pxY - d.vy * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Annotation
    const isLightMud = document.body.classList.contains('light-theme');
    ctx.fillStyle = isLightMud ? '#0284c7' : '#38bdf8';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Droplets leave along straight tangent lines at the instant friction breaks!', centerX, centerY + rPx + 40);
  }

  drawStatusBanner(w, h) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '600 13px Outfit, sans-serif';

    let text = '';
    let badgeColor = '#38bdf8';

    if (this.mode === 'mud_spray') {
      text = `Every single water droplet flies in a straight line tangent to the tire (Newton's 1st Law)!`;
      badgeColor = '#38bdf8';
    } else if (this.state === 'rotating') {
      text = `Inward Tension force continuously turns the ball. Click '✂️ Cut String' to test inertia!`;
      badgeColor = '#94a3b8';
    } else {
      text = `✓ INERTIA OF DIRECTION: When string cuts (F_net = 0), ball flies straight along tangent vector!`;
      badgeColor = '#10b981';
    }

    const isLight = document.body.classList.contains('light-theme');
    let effectiveStroke = badgeColor;
    let effectiveText = badgeColor;
    if (isLight) {
      if (badgeColor === '#10b981') { effectiveStroke = '#047857'; effectiveText = '#047857'; }
      else if (badgeColor === '#ef4444') { effectiveStroke = '#b91c1c'; effectiveText = '#b91c1c'; }
      else if (badgeColor === '#f59e0b') { effectiveStroke = '#b45309'; effectiveText = '#b45309'; }
      else if (badgeColor === '#38bdf8') { effectiveStroke = '#0284c7'; effectiveText = '#0284c7'; }
      else if (badgeColor === '#94a3b8') { effectiveStroke = '#475569'; effectiveText = '#334155'; }
    }

    ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = effectiveStroke;
    ctx.lineWidth = 1.5;
    const bw = ctx.measureText(text).width + 30;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(w / 2 - bw / 2, 16, bw, 32, 8);
    } else {
      ctx.rect(w / 2 - bw / 2, 16, bw, 32);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = effectiveText;
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, 36);
    ctx.restore();
  }

  drawArrow(fromX, fromY, toX, toY, color, label) {
    const ctx = this.ctx;
    const headLen = 9;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, (fromX + toX) / 2, Math.min(fromY, toY) - 6);
    }
    ctx.restore();
  }
}

window.SimDirection = SimDirection;

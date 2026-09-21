/**
 * Acceleration Rate & Sign Studio - Physics Simulation Engine
 * Features multi-layer parallax mountain backgrounds (from Newton's Second Law),
 * ultra-smooth 60fps camera tracking, dynamic vector arrows (v & a),
 * and metric road coordinate integration with strobe trails.
 */

class ParallaxLayer {
  constructor(imageSrc, speedModifier) {
    this.image = new Image();
    this.image.src = imageSrc;
    this.speedModifier = speedModifier;
    this.isLoaded = false;
    this.image.onload = () => {
      this.isLoaded = true;
    };
  }

  draw(ctx, positionMeters, pixelsPerMeter, canvasWidth, targetHeight, yOffset = 0) {
    if (!this.isLoaded || !this.image.naturalWidth) return;

    // Scale layer to targetHeight
    const scale = targetHeight / this.image.naturalHeight;
    const drawWidth = this.image.naturalWidth * scale;

    // Calculate world pixel shift based on vehicle position and speed modifier
    const worldPixelX = positionMeters * pixelsPerMeter * this.speedModifier;
    
    // Seamless modulo offset for continuous tiling in both directions (+ and -)
    let offsetX = -(worldPixelX % drawWidth);
    while (offsetX > 0) offsetX -= drawWidth;

    // Tile across canvas width + margin to prevent gaps
    for (let x = offsetX; x < canvasWidth + drawWidth; x += drawWidth) {
      ctx.drawImage(this.image, x, yOffset, drawWidth, targetHeight);
    }
  }
}

class MotionSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Physics State
    this.x0 = 0;          // initial position (meters)
    this.v0 = 10;         // initial velocity (m/s)
    this.a = 3;           // acceleration (m/s^2)
    
    this.x = 0;           // current position (meters)
    this.v = 10;          // current velocity (m/s)
    this.t = 0;           // elapsed time (seconds)
    
    this.isRunning = false;
    this.animId = null;
    this.lastTimestamp = 0;
    
    // Coordinate Mapping (pixels per meter on screen)
    this.pixelsPerMeter = 16;
    
    // Parallax Layers: ultra-slow speeds for true distant horizon scale
    this.layers = [
      new ParallaxLayer('layers/parallax-mountain-bg.png', 0.0),
      new ParallaxLayer('layers/parallax-mountain-montain-far.png', 0.004),
      new ParallaxLayer('layers/parallax-mountain-mountains.png', 0.012),
      new ParallaxLayer('layers/parallax-mountain-trees.png', 0.03),
      new ParallaxLayer('layers/parallax-mountain-foreground-trees.png', 0.07)
    ];

    // Strobe / Ticker Tape Drops
    this.strobes = [];
    this.lastStrobeTime = 0;
    this.strobeInterval = 1.0; // drop a strobe every 1.0 s
    
    // Turnaround visual alert
    this.turnaroundFlash = 0;
    this.lastVelSign = Math.sign(this.v0);
    
    // Flame animation counter
    this.flameFlicker = 0;
    
    // Callback for UI updates
    this.onUpdate = null;
    
    // Handle resizing
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Redraw once images finish loading
    this.layers.forEach(layer => {
      layer.image.addEventListener('load', () => this.draw());
    });

    this.reset();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = (rect.height || 240) * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height || 240;
    this.draw();
  }

  setState(v0, a, x0 = 0) {
    this.v0 = parseFloat(v0);
    this.a = parseFloat(a);
    this.x0 = parseFloat(x0);
    this.reset();
  }

  reset() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = null;
    this.lastTimestamp = 0;
    
    this.t = 0;
    this.x = this.x0;
    this.v = this.v0;
    this.lastVelSign = Math.sign(this.v0);
    this.strobes = [];
    this.lastStrobeTime = 0;
    this.turnaroundFlash = 0;
    
    // Add initial strobe at t = 0
    this.dropStrobe(0, this.x, this.v);
    
    this.notifyUpdate();
    this.draw();
  }

  play() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = performance.now();

    const loop = (currentTimestamp) => {
      if (!this.isRunning) return;
      const elapsedSec = (currentTimestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = currentTimestamp;
      
      // Cap delta time to 50ms (prevents huge jumps if tab was backgrounded)
      const cappedDelta = Math.min(elapsedSec, 0.05);
      this.step(cappedDelta);
      
      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  pause() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = null;
    this.notifyUpdate();
    this.draw();
  }

  step(delta) {
    const prevV = this.v;
    this.t += delta;
    this.flameFlicker += delta * 15;
    
    // Exact Kinematics Integration:
    // v(t) = v0 + a*t
    // x(t) = x0 + v0*t + 0.5*a*t^2
    this.v = this.v0 + this.a * this.t;
    this.x = this.x0 + this.v0 * this.t + 0.5 * this.a * Math.pow(this.t, 2);
    
    // Check for directional reversal (v crosses 0)
    if (prevV !== 0 && Math.sign(prevV) !== Math.sign(this.v) && prevV !== this.v) {
      this.turnaroundFlash = 1.0;
      if (window.AudioEngine) window.AudioEngine.playTurnaroundSound();
    }
    
    // Strobe tape drop check (every 1.0s)
    if (this.t - this.lastStrobeTime >= this.strobeInterval) {
      this.dropStrobe(Math.round(this.t * 10) / 10, this.x, this.v);
      this.lastStrobeTime = this.t;
      if (window.AudioEngine) window.AudioEngine.playStrobeTick();
    }
    
    // Turnaround flash decay
    if (this.turnaroundFlash > 0) {
      this.turnaroundFlash = Math.max(0, this.turnaroundFlash - delta * 1.5);
    }
    
    this.notifyUpdate();
    this.draw();
  }

  dropStrobe(time, position, velocity) {
    this.strobes.push({
      t: time,
      x: position,
      v: velocity
    });
    // Keep last 40 strobes
    if (this.strobes.length > 40) this.strobes.shift();
  }

  clearStrobes() {
    this.strobes = [];
    this.draw();
  }

  notifyUpdate() {
    if (typeof this.onUpdate === 'function') {
      let status = 'Constant Speed';
      if (Math.abs(this.v) < 0.05 && Math.abs(this.a) > 0) {
        status = 'Instantaneous Turnaround (v = 0)';
      } else if (this.a === 0) {
        status = 'Moving at Constant Speed';
      } else if (Math.sign(this.v) === Math.sign(this.a)) {
        status = 'Speeding Up (' + (this.v >= 0 ? '+x Right' : '-x Left') + ')';
      } else {
        status = 'Slowing Down (' + (this.v >= 0 ? '+x Right' : '-x Left') + ')';
      }
      
      this.onUpdate({
        t: this.t,
        x: this.x,
        v: this.v,
        a: this.a,
        isRunning: this.isRunning,
        status: status
      });
    }
  }

  // Converts world meter coordinate to canvas pixel coordinate.
  // Smoothly centered on the vehicle pod at w * 0.5.
  meterToCanvasX(meter) {
    const podScreenX = this.width * 0.5;
    return podScreenX + (meter - this.x) * this.pixelsPerMeter;
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    const roadY = h * 0.68;
    const backdropHeight = roadY + 12;

    // 1. Draw Sky Background Layer (Layer 0)
    if (this.layers[0]) {
      this.layers[0].draw(ctx, this.x, this.pixelsPerMeter, w, backdropHeight, 0);
    }

    // 2. Draw Exactly ONE Celestial Sun (does not duplicate across screen width)
    this.drawSingleSun(ctx, w, backdropHeight);

    // 3. Draw Parallax Mountain & Forest Layers (Layers 1-4, in front of the sun)
    for (let i = 1; i < this.layers.length; i++) {
      this.layers[i].draw(ctx, this.x, this.pixelsPerMeter, w, backdropHeight, 0);
    }

    // 4. Draw Road and Metric Coordinate Grid
    this.drawTrackGrid(roadY);

    // 3. Draw Strobe Drops on the Road
    this.drawStrobeDots(roadY);

    // 4. Draw Vehicle Pod (centered on screen at w * 0.5)
    const podScreenX = w * 0.5;
    this.drawPod(podScreenX, roadY - 14);

    // 5. Draw Vector Arrows (Velocity above, Acceleration below/above)
    this.drawVectorArrows(podScreenX, roadY - 55);

    // 6. Draw Turnaround Flash Alert if active
    if (this.turnaroundFlash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(244, 63, 94, ${this.turnaroundFlash * 0.35})`;
      ctx.fillRect(0, 0, w, h);
      
      ctx.font = '700 13px "Space Grotesk", sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${this.turnaroundFlash})`;
      ctx.textAlign = 'center';
      ctx.fillText('⚡ DIRECTION REVERSAL: v = 0 m/s (Acceleration still active!)', w / 2, 28);
      ctx.restore();
    }
  }

  drawSingleSun(ctx, w, backdropHeight) {
    // Single Celestial Sun positioned in the upper right sky
    const sunX = w * 0.76;
    const sunY = backdropHeight * 0.28;
    const sunRadius = 24 * Math.min(1.25, Math.max(0.85, backdropHeight / 168));

    ctx.save();
    // Warm atmospheric corona glow
    const glowGrad = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 2.4);
    glowGrad.addColorStop(0, 'rgba(255, 247, 226, 0.45)');
    glowGrad.addColorStop(0.4, 'rgba(255, 235, 180, 0.18)');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Solid Sun disk (#fff7e2 matching pixel pack)
    ctx.fillStyle = '#fff7e2';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawTrackGrid(roadY) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Road Surface Bar
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, roadY, w, h - roadY);

    // Cyber Road Top Edge Line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, roadY);
    ctx.lineTo(w, roadY);
    ctx.stroke();

    // Secondary lower asphalt guard line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, roadY + 34);
    ctx.lineTo(w, roadY + 34);
    ctx.stroke();

    // Determine visible meter range
    const halfWidthMeters = (w / 2) / this.pixelsPerMeter;
    const leftMeter = Math.floor(this.x - halfWidthMeters) - 2;
    const rightMeter = Math.ceil(this.x + halfWidthMeters) + 2;

    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    for (let m = leftMeter; m <= rightMeter; m++) {
      const cx = this.meterToCanvasX(m);
      const isFive = (m % 5 === 0);
      const isTen = (m % 10 === 0);
      const isOrigin = (m === 0);

      // Minor tick (every 1m)
      if (!isFive && !isOrigin) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.lineWidth = 1;
        ctx.moveTo(cx, roadY);
        ctx.lineTo(cx, roadY + 5);
        ctx.stroke();
        continue;
      }

      // Major tick (every 5m or 10m or origin)
      ctx.beginPath();
      if (isOrigin) {
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 3;
      } else if (isTen) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
        ctx.lineWidth = 1.5;
      }
      ctx.moveTo(cx, roadY);
      ctx.lineTo(cx, roadY + (isOrigin ? 18 : (isTen ? 12 : 8)));
      ctx.stroke();

      // Label coordinate markers
      if (isOrigin) {
        ctx.fillStyle = '#00f2fe';
        ctx.font = '800 10px "JetBrains Mono", monospace';
        ctx.fillText('0m ORIGIN', cx, roadY + 28);
      } else if (isTen) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        const signStr = m > 0 ? `+${m}m` : `${m}m`;
        ctx.fillText(signStr, cx, roadY + 26);
      }
    }
  }

  drawStrobeDots(roadY) {
    const ctx = this.ctx;
    for (let i = 0; i < this.strobes.length; i++) {
      const s = this.strobes[i];
      const cx = this.meterToCanvasX(s.x);

      // Only draw if within canvas view
      if (cx < -40 || cx > this.width + 40) continue;
      
      // Strobe Dot
      ctx.beginPath();
      ctx.arc(cx, roadY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#a855f7';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Timestamp Tag
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#d8b4fe';
      ctx.textAlign = 'center';
      ctx.fillText(`t=${s.t.toFixed(0)}s`, cx, roadY - 9);
      
      // Velocity readout below tick
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${s.v >= 0 ? '+' : ''}${s.v.toFixed(1)}`, cx, roadY + 48);
    }
  }

  drawPod(x, y) {
    const ctx = this.ctx;
    const podW = 56;
    const podH = 22;

    ctx.save();
    ctx.translate(x, y);

    // Active Thruster / Retro-Rockets
    if (this.a !== 0 && this.isRunning) {
      // Thrust direction: accelerates object in direction of 'a'.
      // If a > 0, thruster pushes right by blasting flame to the left.
      // If a < 0, thruster pushes left by blasting flame to the right.
      const thrustDir = this.a > 0 ? -1 : 1;
      const flameX = thrustDir * (podW / 2);
      const flickerSize = Math.sin(this.flameFlicker) * 4;
      const flameLen = Math.min(45, Math.abs(this.a) * 4.5 + 16) + flickerSize;

      const grad = ctx.createRadialGradient(flameX, 0, 2, flameX + thrustDir * flameLen, 0, 18);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, '#00f2fe');
      grad.addColorStop(0.65, 'rgba(56, 189, 248, 0.6)');
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(flameX + thrustDir * (flameLen / 2), 0, flameLen / 2, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pod Shadow on Road
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, podH / 2 + 8, podW / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pod Main Hull
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-podW / 2, -podH / 2, podW, podH, 8);
    ctx.fill();
    ctx.stroke();

    // Hull Cyber Accents
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-podW / 2 + 10, podH / 2 - 3);
    ctx.lineTo(podW / 2 - 10, podH / 2 - 3);
    ctx.stroke();

    // Cockpit Visor (facing direction of velocity)
    const visorOffset = this.v >= 0 ? 5 : -5;
    ctx.fillStyle = '#00f2fe';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(-podW / 4 + visorOffset, -podH / 2 + 4, podW / 2 - 6, 6, 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Levitation Glow Pods
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(-podW / 3, podH / 2 + 2, 3, 0, Math.PI * 2);
    ctx.arc(podW / 3, podH / 2 + 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Directional Headlight Beam
    if (Math.abs(this.v) > 0.1) {
      const headingDir = Math.sign(this.v);
      const lightX = headingDir * (podW / 2);
      const beamGrad = ctx.createRadialGradient(lightX, 0, 0, lightX + headingDir * 35, 0, 25);
      beamGrad.addColorStop(0, 'rgba(0, 242, 254, 0.45)');
      beamGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(lightX, -4);
      ctx.lineTo(lightX + headingDir * 45, -12);
      ctx.lineTo(lightX + headingDir * 45, 12);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  drawVectorArrows(x, y) {
    const ctx = this.ctx;

    // 1. Velocity Vector (Green Arrow)
    if (Math.abs(this.v) > 0.1) {
      const vLength = Math.max(28, Math.min(110, Math.abs(this.v) * 3.8)) * Math.sign(this.v);
      this.drawArrow(x, y - 8, x + vLength, y - 8, '#4ade80', `v = ${this.v >= 0 ? '+' : ''}${this.v.toFixed(1)} m/s`, -12);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('v = 0 m/s (Rest / Turnaround)', x, y - 16);
    }

    // 2. Acceleration Vector (Cyan/Blue Arrow)
    if (Math.abs(this.a) > 0.05) {
      const aLength = Math.max(28, Math.min(95, Math.abs(this.a) * 12)) * Math.sign(this.a);
      this.drawArrow(x, y + 14, x + aLength, y + 14, '#38bdf8', `a = ${this.a >= 0 ? '+' : ''}${this.a.toFixed(1)} m/s²`, 16);
    }
  }

  drawArrow(fromX, fromY, toX, toY, color, label, labelOffsetY) {
    const ctx = this.ctx;
    const headLength = 9;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;

    // Shaft
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Label with glowing pill background for readability
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const midX = (fromX + toX) / 2;
    const labelY = fromY + labelOffsetY;

    ctx.fillStyle = 'rgba(6, 9, 19, 0.75)';
    const textWidth = ctx.measureText(label).width;
    ctx.fillRect(midX - textWidth / 2 - 4, labelY - 9, textWidth + 8, 13);

    ctx.fillStyle = color;
    ctx.fillText(label, midX, labelY);

    ctx.restore();
  }
}

window.MotionSimulator = MotionSimulator;

/**
 * Traveler System - Animated Adventurer on the Fantasy Map
 * Controls sprite path-following, footstep sounds, particles, speed multipliers,
 * and the Homecoming round-trip journey.
 */
class Traveler {
  constructor(mapInstance) {
    this.map = mapInstance;
    this.role = 'scout'; // 'knight', 'scout', 'mage', 'rogue'
    this.roleIcons = {
      scout: '🏹',
      knight: '🛡️',
      mage: '🧙',
      rogue: '🗡️'
    };

    // Explicit Motion State Machine: 'IDLE', 'FORWARD', 'PAUSED_FORWARD', 'RETURN', 'PAUSED_RETURN', 'FINISHED'
    this.motionState = 'IDLE';
    this.isReturning = false;
    this.progress = 0; // 0.0 to 1.0 along the trail
    this.speedMultiplier = 1.0;
    this.baseDurationSeconds = 12.0;
    this.lastTimestamp = null;
    this.particles = [];

    // Current position
    this.currentPosPx = { x: 0, y: 0 };
    this.currentPosGrid = { x: 0, y: 0 };

    // Cumulative Distance tracked during journey
    this.distanceTraveledCm = 0;
    this.roundTripDistanceCm = 0;

    // Cache sampled trail points
    this.trailPoints = [];
    this.cachedTotalLengthCm = 0;
    this.refreshTrail();

    // Bind animation loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  get isRunning() {
    return this.motionState === 'FORWARD' || this.motionState === 'RETURN';
  }

  refreshTrail() {
    this.trailPoints = this.map.getSampledTrailPoints(-1, 50);
    this.cachedTotalLengthCm = this.map.calculatePathLengthCm(-1);
    this.resetToOrigin();
  }

  resetToOrigin() {
    this.motionState = 'IDLE';
    this.isReturning = false;
    this.progress = 0;
    this.lastTimestamp = null;
    this.particles = [];
    this.distanceTraveledCm = 0;

    if (this.trailPoints.length > 0) {
      const p = this.trailPoints[0];
      this.currentPosGrid = { x: p.cmX, y: p.cmY };
      this.currentPosPx = this.map.gridToPixel(p.cmX, p.cmY);
    }
    this.updateStatsUI();
  }

  startForward() {
    this.isReturning = false;
    if (this.progress >= 1.0) {
      this.progress = 0;
    }
    this.motionState = 'FORWARD';
    this.lastTimestamp = null;
    if (window.soundFX) window.soundFX.playClick();
    this.updateStatsUI();
  }

  pause() {
    if (this.motionState === 'FORWARD') {
      this.motionState = 'PAUSED_FORWARD';
    } else if (this.motionState === 'RETURN') {
      this.motionState = 'PAUSED_RETURN';
    }
    this.lastTimestamp = null;
    if (window.soundFX) window.soundFX.playClick();
    this.updateStatsUI();
  }

  resume() {
    if (this.motionState === 'PAUSED_FORWARD') {
      this.motionState = 'FORWARD';
    } else if (this.motionState === 'PAUSED_RETURN') {
      this.motionState = 'RETURN';
    } else if (this.motionState === 'IDLE' || this.motionState === 'FINISHED') {
      this.startForward();
      return;
    }
    this.lastTimestamp = null;
    if (window.soundFX) window.soundFX.playClick();
    this.updateStatsUI();
  }

  togglePlay() {
    if (this.isRunning) {
      this.pause();
    } else if (this.motionState === 'PAUSED_FORWARD' || this.motionState === 'PAUSED_RETURN') {
      this.resume();
    } else {
      this.startForward();
    }
    return this.isRunning;
  }

  triggerHomecoming() {
    // Return from Destination (D) back to Origin (A)
    this.isReturning = true;
    this.motionState = 'RETURN';
    this.lastTimestamp = null;
    if (window.soundFX) {
      window.soundFX.playHomecoming();
    }
    this.updateStatsUI();
  }

  setSpeed(mult) {
    this.speedMultiplier = mult;
  }

  setRole(newRole) {
    if (this.roleIcons[newRole]) {
      this.role = newRole;
      if (window.soundFX) window.soundFX.playClick();
    }
  }

  // Animation Loop
  animate(timestamp) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;

    if (this.isRunning && this.trailPoints.length > 1) {
      const rate = (1.0 / this.baseDurationSeconds) * this.speedMultiplier;

      if (!this.isReturning) {
        // Forward journey
        this.progress += rate * dt;
        if (this.progress >= 1.0) {
          this.progress = 1.0;
          this.motionState = 'FINISHED';
          if (window.soundFX) window.soundFX.playSuccess();
          if (window.questEngine) window.questEngine.onTravelerReachedDestination();
          this.updateStatsUI();
        }
      } else {
        // Homecoming return journey
        this.progress -= rate * dt;
        if (this.progress <= 0) {
          this.progress = 0;
          this.motionState = 'IDLE';
          this.isReturning = false;
          if (window.soundFX) window.soundFX.playSuccess();
          if (window.questEngine) window.questEngine.onTravelerReturnedHome();
          this.updateStatsUI();
        }
      }

      // Compute current point along sampled polyline
      const totalPts = this.trailPoints.length;
      const idxFloat = this.progress * (totalPts - 1);
      const idxLow = Math.floor(idxFloat);
      const idxHigh = Math.min(totalPts - 1, idxLow + 1);
      const frac = idxFloat - idxLow;

      const p0 = this.trailPoints[idxLow];
      const p1 = this.trailPoints[idxHigh];

      const interpX = p0.cmX + (p1.cmX - p0.cmX) * frac;
      const interpY = p0.cmY + (p1.cmY - p0.cmY) * frac;

      this.currentPosGrid = { x: interpX, y: interpY };
      this.currentPosPx = this.map.gridToPixel(interpX, interpY);

      // Footstep particle emitter
      if (Math.random() < 0.35) {
        this.particles.push({
          x: this.currentPosPx.x + (Math.random() * 8 - 4),
          y: this.currentPosPx.y + (Math.random() * 8 - 4),
          alpha: 0.6,
          radius: 2 + Math.random() * 2,
          life: 0.5
        });
        if (window.soundFX && Math.random() < 0.15) {
          window.soundFX.playStep();
        }
      }

      this.updateStatsUI();
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 0.5);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Redraw
    this.map.render();
    this.drawParticles(this.map.ctx);
    this.drawTraveler(this.map.ctx);

    requestAnimationFrame(this.animate);
  }

  drawParticles(ctx) {
    ctx.save();
    this.particles.forEach(p => {
      ctx.fillStyle = `rgba(139, 94, 60, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawTraveler(ctx) {
    const px = this.currentPosPx.x;
    const py = this.currentPosPx.y;

    ctx.save();

    // Pulse aura underneath traveler
    ctx.strokeStyle = this.isReturning ? 'rgba(59, 130, 246, 0.6)' : 'rgba(234, 179, 8, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(px, py, 20, 0, Math.PI * 2);
    ctx.stroke();

    // Avatar Badge Circle
    ctx.fillStyle = '#fff9e6';
    ctx.strokeStyle = '#2a1b0e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Avatar Icon
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.roleIcons[this.role] || '🏹', px, py);

    // Mini traveler coordinates indicator
    ctx.fillStyle = '#2a1b0e';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillText(`(${this.currentPosGrid.x.toFixed(1)}, ${(-this.currentPosGrid.y).toFixed(1)})`, px, py - 20);

    ctx.restore();
  }

  // Update dynamic stats on the UI
  updateStatsUI() {
    const legDistanceCm = this.cachedTotalLengthCm * this.progress;
    const totalDistCm = this.isReturning 
      ? this.cachedTotalLengthCm + (this.cachedTotalLengthCm * (1 - this.progress))
      : legDistanceCm;

    const totalDistRealm = totalDistCm * this.map.scaleFactor;

    // Instantaneous Net Displacement from Origin A (0,0)
    const dispCm = Math.hypot(this.currentPosGrid.x, this.currentPosGrid.y);
    const dispRealm = dispCm * this.map.scaleFactor;

    const elDistCm = document.getElementById('stat-dist-cm');
    const elDistRealm = document.getElementById('stat-dist-realm');
    const elDispCm = document.getElementById('stat-disp-cm');
    const elDispRealm = document.getElementById('stat-disp-realm');
    const elPlayBtn = document.getElementById('btn-play-traveler');

    if (elDistCm) elDistCm.innerText = `${totalDistCm.toFixed(1)} cm`;
    if (elDistRealm) elDistRealm.innerText = `${totalDistRealm.toFixed(1)} ${this.map.scaleUnit}`;
    if (elDispCm) elDispCm.innerText = `${dispCm.toFixed(1)} cm`;
    if (elDispRealm) elDispRealm.innerText = `${dispRealm.toFixed(1)} ${this.map.scaleUnit}`;

    if (elPlayBtn) {
      if (this.isRunning) {
        elPlayBtn.innerHTML = '<span>⏸️ Pause</span>';
        elPlayBtn.className = "px-3 py-1.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 border border-amber-400 text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5";
      } else if (this.motionState === 'PAUSED_FORWARD' || this.motionState === 'PAUSED_RETURN') {
        elPlayBtn.innerHTML = '<span>▶️ Resume Walk</span>';
        elPlayBtn.className = "px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500 text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 animate-pulse";
      } else if (this.motionState === 'FINISHED') {
        elPlayBtn.innerHTML = '<span>↺ Walk Again</span>';
        elPlayBtn.className = "px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5";
      } else {
        elPlayBtn.innerHTML = '<span>▶️ Walk Journey</span>';
        elPlayBtn.className = "px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5";
      }
    }
  }
}

window.Traveler = Traveler;

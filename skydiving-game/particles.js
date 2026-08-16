/**
 * Terminal Velocity: Skydive Academy
 * Particle & Visual FX System
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  reset() {
    this.particles = [];
  }

  // Spawn wind / speed streak lines during high speed freefall
  spawnSpeedStreak(width, height, speed) {
    if (Math.random() > 0.45) return;
    const x = Math.random() * width;
    const y = -20;
    const length = 20 + Math.random() * (speed * 0.8);
    const alpha = 0.15 + Math.min(speed / 80, 0.4);
    
    this.particles.push({
      type: 'STREAK',
      x, y,
      vx: (Math.random() - 0.5) * 20,
      vy: speed * 12 + 200,
      length,
      width: 1 + Math.random() * 2,
      color: `rgba(220, 240, 255, ${alpha})`,
      life: 0.8,
      maxLife: 0.8
    });
  }

  // Spawn cloud vapor trail behind skydiver limbs
  spawnVaporWisp(x, y, vx, vy) {
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        type: 'VAPOR',
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 30 - vx * 0.1,
        vy: -40 - Math.random() * 60,
        radius: 4 + Math.random() * 6,
        growth: 18 + Math.random() * 12,
        color: '240, 245, 255',
        alpha: 0.5,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8
      });
    }
  }

  // Sparkle burst on collecting aerial ring
  spawnRingBurst(x, y, colorHex = '#38bdf8', count = 22) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 80 + Math.random() * 140;
      this.particles.push({
        type: 'RING_SPARKLE',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.5 + Math.random() * 3,
        color: colorHex,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        spin: Math.random() * 10
      });
    }
  }

  // Golden starburst for bonus stars
  spawnStarBurst(x, y, count = 28) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 180;
      this.particles.push({
        type: 'STAR_BURST',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.3 ? '#fbbf24' : '#f59e0b',
        life: 0.7 + Math.random() * 0.3,
        maxLife: 1.0
      });
    }
  }

  // Dust cloud on landing
  spawnLandingDust(x, y, intensity = 1.0) {
    const count = Math.floor(30 * intensity);
    for (let i = 0; i < count; i++) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      const speed = (60 + Math.random() * 140) * dir;
      this.particles.push({
        type: 'DUST',
        x: x + (Math.random() - 0.5) * 30,
        y: y,
        vx: speed,
        vy: -20 - Math.random() * 60,
        radius: 5 + Math.random() * 8,
        growth: 20 + Math.random() * 15,
        color: '200, 185, 160',
        alpha: 0.65,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2
      });
    }
  }

  // Celebratory confetti on perfect bullseye landing
  spawnConfetti(width, height) {
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        type: 'CONFETTI',
        x: Math.random() * width,
        y: height * 0.4 + (Math.random() - 0.5) * (height * 0.4),
        vx: (Math.random() - 0.5) * 160,
        vy: -150 - Math.random() * 200,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 12,
        life: 2.0 + Math.random() * 1.5,
        maxLife: 3.5
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics update per type
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'VAPOR' || p.type === 'DUST') {
        p.radius += p.growth * dt;
        p.vx *= 0.95;
        p.vy *= 0.95;
      } else if (p.type === 'RING_SPARKLE' || p.type === 'STAR_BURST') {
        p.vx *= 0.92;
        p.vy *= 0.92;
      } else if (p.type === 'CONFETTI') {
        p.vy += 220 * dt; // Gravity
        p.vx *= 0.98;
        p.rotation += p.rotSpeed * dt;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const progress = p.life / p.maxLife;

      if (p.type === 'STREAK') {
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.width;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 0.05, p.y + p.length);
        ctx.stroke();
      } else if (p.type === 'VAPOR' || p.type === 'DUST') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha * progress})`;
        ctx.fill();
      } else if (p.type === 'RING_SPARKLE') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * progress, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (p.type === 'STAR_BURST') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        const s = p.size * progress;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      } else if (p.type === 'CONFETTI') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1.0, progress * 1.5);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }
    ctx.restore();
  }
}

window.ParticleSystem = ParticleSystem;

/**
 * Particle system for character controller effects
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.ambientParticles = [];
  }

  initAmbient(worldWidth, worldHeight, count = 40, theme = 'forest') {
    this.ambientParticles = [];
    for (let i = 0; i < count; i++) {
      this.ambientParticles.push(this.createAmbientParticle(worldWidth, worldHeight, theme, true));
    }
  }

  createAmbientParticle(w, h, theme, randomY = false) {
    if (theme === 'forest') {
      return {
        type: 'leaf',
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -10,
        vx: (Math.random() - 0.3) * 30,
        vy: 20 + Math.random() * 30,
        size: 3 + Math.random() * 4,
        color: ['#86efac', '#4ade80', '#fbbf24', '#f59e0b', '#34d399'][Math.floor(Math.random() * 5)],
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 4,
        swayPhase: Math.random() * Math.PI * 2
      };
    } else if (theme === 'sunset') {
      return {
        type: 'petal',
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -10,
        vx: (Math.random() - 0.5) * 40 - 20,
        vy: 25 + Math.random() * 35,
        size: 3 + Math.random() * 3,
        color: ['#f472b6', '#fda4af', '#fcd34d', '#fb7185'][Math.floor(Math.random() * 4)],
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 3,
        swayPhase: Math.random() * Math.PI * 2
      };
    } else if (theme === 'synthwave') {
      return {
        type: 'glow_dust',
        x: Math.random() * w,
        y: randomY ? Math.random() * h : h + 10,
        vx: (Math.random() - 0.5) * 15,
        vy: -20 - Math.random() * 30,
        size: 2 + Math.random() * 3,
        color: ['#38bdf8', '#c084fc', '#f43f5e', '#a855f7'][Math.floor(Math.random() * 4)],
        rot: 0,
        rotSpeed: 0,
        swayPhase: Math.random() * Math.PI * 2
      };
    }
    return {
      type: 'dot',
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -10,
      vx: (Math.random() - 0.5) * 10,
      vy: 15 + Math.random() * 20,
      size: 2,
      color: 'rgba(255, 255, 255, 0.4)',
      rot: 0,
      rotSpeed: 0,
      swayPhase: 0
    };
  }

  spawnFootstepDust(x, y, facing) {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const angle = (facing > 0 ? Math.PI * 0.85 : Math.PI * 0.15) + (Math.random() - 0.5) * 0.5;
      const speed = 25 + Math.random() * 45;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y - 2,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed * 0.6,
        size: 3 + Math.random() * 3,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.35,
        color: 'rgba(215, 225, 235, 0.85)',
        type: 'dust'
      });
    }
  }

  spawnJumpDust(x, y) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI / count) * i + Math.PI;
      const speed = 40 + Math.random() * 45;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y - 2,
        vx: Math.cos(angle) * speed,
        vy: -Math.abs(Math.sin(angle)) * speed * 0.5 - 10,
        size: 4 + Math.random() * 3,
        life: 0.35,
        maxLife: 0.35,
        color: 'rgba(230, 240, 255, 0.8)',
        type: 'dust'
      });
    }
  }

  spawnDoubleJumpBurst(x, y) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const speed = 60 + Math.random() * 40;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        life: 0.3,
        maxLife: 0.3,
        color: '#60a5fa',
        type: 'sparkle'
      });
    }
  }

  spawnLandDust(x, y, speed) {
    const count = Math.min(16, 6 + Math.floor(Math.abs(speed) / 60));
    for (let i = 0; i < count; i++) {
      const dir = (i % 2 === 0 ? 1 : -1);
      const spd = 30 + Math.random() * 70;
      this.particles.push({
        x: x + dir * (Math.random() * 8),
        y: y - 2,
        vx: dir * spd,
        vy: -15 - Math.random() * 30,
        size: 4 + Math.random() * 4,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.45,
        color: 'rgba(210, 225, 240, 0.9)',
        type: 'dust'
      });
    }
  }

  spawnSprintTrail(x, y, facing) {
    this.particles.push({
      x: x - facing * (12 + Math.random() * 8),
      y: y - 10 - Math.random() * 20,
      vx: -facing * (20 + Math.random() * 30),
      vy: (Math.random() - 0.5) * 15,
      size: 3 + Math.random() * 3,
      life: 0.2,
      maxLife: 0.2,
      color: 'rgba(56, 189, 248, 0.7)',
      type: 'trail'
    });
  }

  spawnCoinSparkles(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.6,
        color: ['#facc15', '#fde047', '#f59e0b', '#ffffff'][Math.floor(Math.random() * 4)],
        type: 'sparkle'
      });
    }
  }

  update(dt, worldWidth, worldHeight, theme) {
    // Update active action particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === 'dust') {
        p.vy += 80 * dt; // slight gravity
        p.vx *= (1 - 3 * dt);
      }
    }

    // Update ambient particles
    for (let i = 0; i < this.ambientParticles.length; i++) {
      const p = this.ambientParticles[i];
      p.swayPhase += dt * 2;
      p.x += (p.vx + Math.sin(p.swayPhase) * 15) * dt;
      p.y += p.vy * dt;
      p.rot += p.rotSpeed * dt;

      // Wrap around world
      if (p.y > worldHeight + 20) {
        Object.assign(p, this.createAmbientParticle(worldWidth, worldHeight, theme, false));
      } else if (p.y < -30 && p.vy < 0) {
        Object.assign(p, this.createAmbientParticle(worldWidth, worldHeight, theme, false));
      }
      if (p.x < -20) p.x = worldWidth + 10;
      if (p.x > worldWidth + 20) p.x = -10;
    }
  }

  draw(ctx, camera) {
    // Draw ambient particles
    for (const p of this.ambientParticles) {
      const screenX = p.x - camera.x;
      const screenY = p.y - camera.y;
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.type === 'leaf' || p.type === 'petal') {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw active effect particles
    for (const p of this.particles) {
      const screenX = p.x - camera.x;
      const screenY = p.y - camera.y;
      const progress = p.life / p.maxLife;
      const alpha = Math.max(0, Math.min(1, progress));
      const size = p.size * progress;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'sparkle') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

window.ParticleSystem = ParticleSystem;

/**
 * Character Controller Engine
 * Supports 2D platforming, responsive animations, touch/gamepad inputs, and live parameter tuning.
 */

class CharacterController {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sound = new SoundEngine();
    this.particles = new ParticleSystem();

    // Sprite image & metadata
    this.spritesheet = new Image();
    this.spritesheet.src = 'assets/character_atlas.png';
    this.spritesheetLoaded = false;
    this.spritesheet.onload = () => {
      this.spritesheetLoaded = true;
    };

    // Frame configuration
    this.frameW = 128;
    this.frameH = 128;
    this.anchorX = 64;
    this.anchorY = 120; // Ground contact point relative to 128x128 frame

    // Animation definition mappings
    // row 0: walk_a (6 frames)
    // row 1: walk_b (6 frames)
    // row 2: idle (6 frames)
    // row 3: run (6 frames)
    this.animations = {
      idle: { row: 2, count: 6, fps: 8, loop: true },
      walk_a: { row: 0, count: 6, fps: 10, loop: true },
      walk_b: { row: 1, count: 6, fps: 10, loop: true },
      walk_12: { rows: [0, 1], count: 12, fps: 12, loop: true }, // Combined 12 frame walk
      run: { row: 3, count: 6, fps: 14, loop: true },
      jump_rise: { row: 3, count: 6, frameIndex: 1, fps: 0, loop: false },
      jump_apex: { row: 3, count: 6, frameIndex: 2, fps: 0, loop: false },
      jump_fall: { row: 0, count: 6, frameIndex: 4, fps: 0, loop: false },
      crouch: { row: 2, count: 6, frameIndex: 0, fps: 0, loop: false }
    };

    // Mode: 'playground' or 'studio'
    this.mode = 'playground';
    this.theme = 'forest'; // 'forest', 'sunset', 'synthwave', 'studio'

    // Physics parameters (user-tunable)
    this.params = {
      walkSpeed: 210,
      runMultiplier: 1.85,
      acceleration: 1400,
      deceleration: 1600,
      airControl: 0.75,
      jumpSpeed: 520,
      jumpCut: 0.5,
      gravity: 1250,
      maxFallSpeed: 750,
      doubleJumpEnabled: true,
      coyoteTime: 0.12,
      jumpBufferTime: 0.12,
      scale: 1.0,
      showHitbox: false,
      showOrigin: false,
      showVelocity: false,
      particlesEnabled: true
    };

    // Character State
    this.player = {
      x: 350,
      y: 420,
      vx: 0,
      vy: 0,
      facing: 1, // 1: right, -1: left
      isGrounded: false,
      isCrouching: false,
      isSprinting: false,
      canDoubleJump: true,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      hitboxW: 38,
      hitboxH: 88,
      // Animation State
      currentAnim: 'idle',
      animTimer: 0,
      currentFrame: 0,
      footstepDistAccum: 0
    };

    // Studio Inspector State
    this.studio = {
      selectedAnim: 'idle',
      fps: 8,
      isPlaying: true,
      currentFrame: 0,
      timer: 0,
      zoom: 2.0
    };

    // World & Level
    this.worldWidth = 2400;
    this.worldHeight = 800;
    this.camera = { x: 0, y: 0, targetX: 0, targetY: 0 };

    this.platforms = [];
    this.collectibles = [];
    this.springs = [];
    this.score = 0;

    // Inputs
    this.keys = {};
    this.touchInput = { x: 0, jump: false, sprint: false, crouch: false };
    this.gamepadConnected = false;

    // Clock
    this.lastTime = performance.now();
    this.isRunning = false;

    // Build World
    this.initLevel();
    this.particles.initAmbient(this.worldWidth, this.worldHeight, 45, this.theme);
    this.setupListeners();
  }

  initLevel() {
    // Ground level across entire world
    const groundY = 620;
    this.platforms = [
      // Main Floor
      { x: 0, y: groundY, w: this.worldWidth, h: 200, solid: true, type: 'ground' },
      
      // Floating Islands / Platforms
      { x: 200, y: 480, w: 180, h: 26, oneWay: true, type: 'wood' },
      { x: 440, y: 390, w: 220, h: 26, oneWay: true, type: 'stone' },
      { x: 740, y: 480, w: 160, h: 26, oneWay: true, type: 'wood' },
      { x: 980, y: 360, w: 240, h: 26, oneWay: true, type: 'stone' },
      { x: 1300, y: 440, w: 200, h: 26, oneWay: true, type: 'wood' },
      { x: 1580, y: 320, w: 260, h: 26, oneWay: true, type: 'stone' },
      { x: 1920, y: 420, w: 220, h: 26, oneWay: true, type: 'wood' },
      { x: 1050, y: 220, w: 180, h: 26, oneWay: true, type: 'gold' }
    ];

    // Collectibles (Gems)
    this.collectibles = [
      { x: 290, y: 430, base_y: 430, collected: false, bobOffset: 0 },
      { x: 550, y: 340, base_y: 340, collected: false, bobOffset: 1 },
      { x: 820, y: 430, base_y: 430, collected: false, bobOffset: 2 },
      { x: 1100, y: 310, base_y: 310, collected: false, bobOffset: 3 },
      { x: 1140, y: 170, base_y: 170, collected: false, bobOffset: 4 },
      { x: 1400, y: 390, base_y: 390, collected: false, bobOffset: 5 },
      { x: 1710, y: 270, base_y: 270, collected: false, bobOffset: 6 },
      { x: 2030, y: 370, base_y: 370, collected: false, bobOffset: 7 }
    ];

    // Spring bounce pads
    this.springs = [
      { x: 670, y: groundY - 14, w: 40, h: 14, bounce: 780, animTimer: 0 },
      { x: 1510, y: groundY - 14, w: 40, h: 14, bounce: 840, animTimer: 0 }
    ];
  }

  setTheme(theme) {
    this.theme = theme;
    this.particles.initAmbient(this.worldWidth, this.worldHeight, 45, this.theme);
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      // Avoid capturing shortcuts like F12, Ctrl+R, etc.
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;

      // Jump press trigger
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.player.jumpBufferTimer = this.params.jumpBufferTime;
      }
      // Reset
      if (e.code === 'KeyR') {
        this.resetPlayer();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      // Variable jump height cut
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        if (this.player.vy < -80) {
          this.player.vy *= this.params.jumpCut;
        }
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
    this.resizeCanvas();
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
    this.dpr = dpr;
  }

  resetPlayer() {
    this.player.x = 350;
    this.player.y = 520;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isGrounded = false;
    this.collectibles.forEach(c => c.collected = false);
    this.score = 0;
    if (window.updateScoreUI) window.updateScoreUI(0);
  }

  pollGamepad() {
    if (!navigator.getGamepads) return { x: 0, jump: false, sprint: false, crouch: false };
    const gamepads = navigator.getGamepads();
    if (!gamepads || !gamepads[0]) {
      this.gamepadConnected = false;
      return { x: 0, jump: false, sprint: false, crouch: false };
    }
    this.gamepadConnected = true;
    const gp = gamepads[0];
    
    let x = 0;
    if (Math.abs(gp.axes[0]) > 0.15) x = gp.axes[0];
    if (gp.buttons[14] && gp.buttons[14].pressed) x = -1; // D-pad left
    if (gp.buttons[15] && gp.buttons[15].pressed) x = 1;  // D-pad right

    const jump = gp.buttons[0] && gp.buttons[0].pressed; // Button A
    const sprint = (gp.buttons[2] && gp.buttons[2].pressed) || (gp.buttons[7] && gp.buttons[7].pressed); // Button X / R2
    const crouch = (gp.axes[1] > 0.5) || (gp.buttons[13] && gp.buttons[13].pressed); // D-pad down

    return { x, jump, sprint, crouch };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(currentTime) {
    if (!this.isRunning) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.mode === 'studio') {
      this.updateStudio(dt);
      return;
    }

    const p = this.player;
    const gp = this.pollGamepad();

    // 1. Gather directional input
    let moveDir = 0;
    if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchInput.x < -0.2 || gp.x < -0.2) {
      moveDir -= 1;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchInput.x > 0.2 || gp.x > 0.2) {
      moveDir += 1;
    }

    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyK'] || this.touchInput.sprint || gp.sprint;
    const isCrouching = this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchInput.crouch || gp.crouch;
    const isJumpPressed = this.keys['Space'] || this.keys['KeyW'] || this.keys['ArrowUp'] || this.touchInput.jump || gp.jump;

    if (isJumpPressed && p.jumpBufferTimer <= 0) {
      p.jumpBufferTimer = this.params.jumpBufferTime;
    }

    p.isSprinting = isSprinting && Math.abs(moveDir) > 0.1 && p.isGrounded;
    p.isCrouching = isCrouching && p.isGrounded;

    if (moveDir !== 0) {
      p.facing = moveDir > 0 ? 1 : -1;
    }

    // 2. Horizontal Velocity & Acceleration
    const targetSpeed = moveDir * this.params.walkSpeed * (p.isSprinting ? this.params.runMultiplier : 1.0) * (p.isCrouching ? 0.35 : 1.0);
    const accel = p.isGrounded ? this.params.acceleration : this.params.acceleration * this.params.airControl;
    const decel = p.isGrounded ? this.params.deceleration : this.params.deceleration * 0.4;

    if (moveDir !== 0) {
      p.vx = this.approach(p.vx, targetSpeed, accel * dt);
    } else {
      p.vx = this.approach(p.vx, 0, decel * dt);
    }

    // 3. Coyote Time & Jump Logic
    if (p.isGrounded) {
      p.coyoteTimer = this.params.coyoteTime;
      p.canDoubleJump = true;
    } else {
      p.coyoteTimer -= dt;
      p.jumpBufferTimer -= dt;
    }

    // Jump Execution
    if (p.jumpBufferTimer > 0) {
      if (p.coyoteTimer > 0) {
        // Ground Jump
        p.vy = -this.params.jumpSpeed;
        p.isGrounded = false;
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
        this.sound.playJump();
        if (this.params.particlesEnabled) {
          this.particles.spawnJumpDust(p.x, p.y);
        }
      } else if (this.params.doubleJumpEnabled && p.canDoubleJump) {
        // Double Jump
        p.vy = -this.params.jumpSpeed * 0.92;
        p.canDoubleJump = false;
        p.jumpBufferTimer = 0;
        this.sound.playDoubleJump();
        if (this.params.particlesEnabled) {
          this.particles.spawnDoubleJumpBurst(p.x, p.y - p.hitboxH * 0.5);
        }
      }
    }

    // 4. Gravity & Vertical Movement
    p.vy += this.params.gravity * dt;
    if (p.vy > this.params.maxFallSpeed) p.vy = this.params.maxFallSpeed;

    // 5. Position & Collision Resolution
    const oldX = p.x;
    const oldY = p.y;

    // Move X
    p.x += p.vx * dt;
    this.resolveWorldBounds();

    // Move Y
    p.y += p.vy * dt;
    const wasGrounded = p.isGrounded;
    p.isGrounded = false;

    // Check Platform Collisions
    for (const plat of this.platforms) {
      // Solid Ground
      if (plat.solid) {
        if (p.y >= plat.y && oldY <= plat.y + 10 && p.x >= plat.x && p.x <= plat.x + plat.w) {
          p.y = plat.y;
          if (!wasGrounded && p.vy > 120) {
            this.sound.playLand();
            if (this.params.particlesEnabled) {
              this.particles.spawnLandDust(p.x, p.y, p.vy);
            }
          }
          p.vy = 0;
          p.isGrounded = true;
        }
      } 
      // One-Way Platform (Can drop through with Down + Jump)
      else if (plat.oneWay) {
        const isDropping = isCrouching && isJumpPressed;
        if (!isDropping && oldY <= plat.y && p.y >= plat.y && p.vy >= 0 && p.x >= plat.x - 10 && p.x <= plat.x + plat.w + 10) {
          p.y = plat.y;
          if (!wasGrounded && p.vy > 120) {
            this.sound.playLand();
            if (this.params.particlesEnabled) {
              this.particles.spawnLandDust(p.x, p.y, p.vy);
            }
          }
          p.vy = 0;
          p.isGrounded = true;
        }
      }
    }

    // Check Spring Bounce Pads
    for (const spring of this.springs) {
      if (spring.animTimer > 0) spring.animTimer -= dt;
      if (p.x >= spring.x && p.x <= spring.x + spring.w && p.y >= spring.y && oldY <= spring.y + 15 && p.vy >= 0) {
        p.y = spring.y;
        p.vy = -spring.bounce;
        p.isGrounded = false;
        spring.animTimer = 0.25;
        this.sound.playBounce();
        if (this.params.particlesEnabled) {
          this.particles.spawnDoubleJumpBurst(spring.x + spring.w / 2, spring.y);
        }
      }
    }

    // Check Collectibles
    this.collectibles.forEach((c, idx) => {
      c.bobOffset += dt * 3;
      c.y = c.base_y + Math.sin(c.bobOffset) * 6;
      if (!c.collected) {
        const dist = Math.hypot(p.x - c.x, (p.y - p.hitboxH * 0.5) - c.y);
        if (dist < 34) {
          c.collected = true;
          this.score += 100;
          this.sound.playCoin();
          if (this.params.particlesEnabled) {
            this.particles.spawnCoinSparkles(c.x, c.y);
          }
          if (window.updateScoreUI) window.updateScoreUI(this.score);
        }
      }
    });

    // 6. Particle Spawning (Footsteps & Sprint Trails)
    if (this.params.particlesEnabled) {
      if (p.isGrounded && Math.abs(p.vx) > 30) {
        p.footstepDistAccum += Math.abs(p.vx) * dt;
        const stepThreshold = p.isSprinting ? 32 : 24;
        if (p.footstepDistAccum > stepThreshold) {
          p.footstepDistAccum = 0;
          this.particles.spawnFootstepDust(p.x, p.y, p.facing);
          this.sound.playFootstep();
        }
      }
      if (p.isSprinting) {
        this.particles.spawnSprintTrail(p.x, p.y, p.facing);
      }
    }

    // 7. Update Particles
    this.particles.update(dt, this.worldWidth, this.worldHeight, this.theme);

    // 8. Animation State Machine
    this.updateAnimation(dt);

    // 9. Camera Tracking
    this.updateCamera(dt);
  }

  updateAnimation(dt) {
    const p = this.player;
    let nextAnim = 'idle';

    if (!p.isGrounded) {
      if (p.vy < -60) nextAnim = 'jump_rise';
      else if (p.vy > 60) nextAnim = 'jump_fall';
      else nextAnim = 'jump_apex';
    } else {
      if (p.isCrouching && Math.abs(p.vx) < 20) {
        nextAnim = 'crouch';
      } else if (Math.abs(p.vx) > 220) {
        nextAnim = 'run';
      } else if (Math.abs(p.vx) > 15) {
        nextAnim = 'walk_12'; // Smooth 12-frame walk cycle
      } else {
        nextAnim = 'idle';
      }
    }

    if (p.currentAnim !== nextAnim) {
      p.currentAnim = nextAnim;
      p.animTimer = 0;
      p.currentFrame = 0;
    }

    const animConfig = this.animations[p.currentAnim] || this.animations.idle;
    if (animConfig.fps > 0) {
      p.animTimer += dt;
      const frameDuration = 1 / animConfig.fps;
      if (p.animTimer >= frameDuration) {
        p.animTimer -= frameDuration;
        p.currentFrame = (p.currentFrame + 1) % animConfig.count;
      }
    } else if (animConfig.frameIndex !== undefined) {
      p.currentFrame = animConfig.frameIndex;
    }
  }

  updateStudio(dt) {
    const st = this.studio;
    if (st.isPlaying && st.fps > 0) {
      st.timer += dt;
      const frameDur = 1 / st.fps;
      if (st.timer >= frameDur) {
        st.timer -= frameDur;
        const animCfg = this.animations[st.selectedAnim] || this.animations.idle;
        st.currentFrame = (st.currentFrame + 1) % animCfg.count;
        if (window.updateStudioFrameUI) window.updateStudioFrameUI(st.currentFrame);
      }
    }
  }

  updateCamera(dt) {
    const targetX = this.player.x - (this.displayWidth / 2) / this.params.scale;
    const targetY = this.player.y - (this.displayHeight * 0.65) / this.params.scale;

    // Smooth Lerp Damping
    this.camera.x += (targetX - this.camera.x) * Math.min(1, dt * 7);
    this.camera.y += (targetY - this.camera.y) * Math.min(1, dt * 7);

    // World clamping
    const maxCamX = this.worldWidth - this.displayWidth / this.params.scale;
    const maxCamY = this.worldHeight - this.displayHeight / this.params.scale;
    this.camera.x = Math.max(0, Math.min(maxCamX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(maxCamY, this.camera.y));
  }

  resolveWorldBounds() {
    const p = this.player;
    if (p.x < 30) {
      p.x = 30;
      p.vx = 0;
    }
    if (p.x > this.worldWidth - 30) {
      p.x = this.worldWidth - 30;
      p.vx = 0;
    }
  }

  approach(val, target, step) {
    if (val < target) return Math.min(val + step, target);
    if (val > target) return Math.max(val - step, target);
    return target;
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    if (this.mode === 'studio') {
      this.renderStudio();
    } else {
      this.renderPlayground();
    }

    ctx.restore();
  }

  renderPlayground() {
    const ctx = this.ctx;
    const dw = this.displayWidth;
    const dh = this.displayHeight;

    // 1. Background Theme Sky & Parallax
    this.drawBackground(ctx, dw, dh);

    // Apply Camera Transform & Scale
    ctx.save();
    ctx.scale(this.params.scale, this.params.scale);
    ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    // 2. Parallax scenery / backdrop elements
    this.drawWorldScenery(ctx);

    // 3. Platforms & Terrain
    this.drawPlatforms(ctx);

    // 4. Springs & Collectibles
    this.drawInteractiveObjects(ctx);

    // 5. Ambient & Action Particles
    this.particles.draw(ctx, { x: 0, y: 0 });

    // 6. Player Character
    this.drawPlayer(ctx);

    // 7. Debug Overlays (if toggled)
    if (this.params.showHitbox || this.params.showOrigin || this.params.showVelocity) {
      this.drawDebugOverlay(ctx);
    }

    ctx.restore();

    // 8. HUD & UI Overlay
    this.drawHUD(ctx, dw, dh);
  }

  drawBackground(ctx, w, h) {
    if (this.theme === 'forest') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1e3a8a');
      grad.addColorStop(0.4, '#38bdf8');
      grad.addColorStop(0.85, '#bae6fd');
      grad.addColorStop(1, '#6ee7b7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Clouds
      this.drawClouds(ctx, w, h, '#ffffff');
    } else if (this.theme === 'sunset') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#311042');
      grad.addColorStop(0.35, '#831843');
      grad.addColorStop(0.7, '#ea580c');
      grad.addColorStop(0.9, '#f59e0b');
      grad.addColorStop(1, '#fde68a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      this.drawClouds(ctx, w, h, '#f472b6', 0.4);
    } else if (this.theme === 'synthwave') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#090514');
      grad.addColorStop(0.6, '#1e1035');
      grad.addColorStop(1, '#3b0764');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Neon Grid Sun
      const sunX = w / 2;
      const sunY = h * 0.45;
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 120);
      sunGrad.addColorStop(0, '#f43f5e');
      sunGrad.addColorStop(0.8, '#e11d48');
      sunGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.theme === 'studio') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);
      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
  }

  drawClouds(ctx, w, h, color, alpha = 0.6) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    const time = performance.now() * 0.0002;
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 350 + time * 12000) % (w + 400)) - 200;
      const cy = 60 + (i % 3) * 45;
      ctx.beginPath();
      ctx.arc(cx, cy, 35, 0, Math.PI * 2);
      ctx.arc(cx + 30, cy - 10, 45, 0, Math.PI * 2);
      ctx.arc(cx + 70, cy, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawWorldScenery(ctx) {
    if (this.theme === 'forest') {
      // Distant Hills
      ctx.fillStyle = 'rgba(22, 101, 52, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, 620);
      for (let x = 0; x <= this.worldWidth; x += 100) {
        ctx.lineTo(x, 500 + Math.sin(x * 0.004) * 60);
      }
      ctx.lineTo(this.worldWidth, 620);
      ctx.fill();

      // Closer Hills
      ctx.fillStyle = 'rgba(21, 128, 61, 0.6)';
      ctx.beginPath();
      ctx.moveTo(0, 620);
      for (let x = 0; x <= this.worldWidth; x += 80) {
        ctx.lineTo(x, 540 + Math.cos(x * 0.006) * 40);
      }
      ctx.lineTo(this.worldWidth, 620);
      ctx.fill();
    }
  }

  drawPlatforms(ctx) {
    for (const plat of this.platforms) {
      if (plat.solid) {
        // Ground
        if (this.theme === 'synthwave') {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(plat.x, plat.y);
          ctx.lineTo(plat.x + plat.w, plat.y);
          ctx.stroke();
        } else {
          // Lush Grass Top
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(plat.x, plat.y, plat.w, 16);
          // Dark Earth Underneath
          ctx.fillStyle = '#78350f';
          ctx.fillRect(plat.x, plat.y + 16, plat.w, plat.h - 16);

          // Grass blades
          ctx.fillStyle = '#22c55e';
          for (let gx = plat.x; gx < plat.x + plat.w; gx += 16) {
            ctx.beginPath();
            ctx.moveTo(gx, plat.y);
            ctx.lineTo(gx + 6, plat.y - 6);
            ctx.lineTo(gx + 12, plat.y);
            ctx.fill();
          }
        }
      } else {
        // Floating Wooden/Stone Platforms
        ctx.save();
        if (plat.type === 'stone') {
          ctx.fillStyle = '#475569';
          ctx.strokeStyle = '#94a3b8';
        } else if (plat.type === 'gold') {
          ctx.fillStyle = '#b45309';
          ctx.strokeStyle = '#fde047';
        } else {
          ctx.fillStyle = '#92400e';
          ctx.strokeStyle = '#d97706';
        }

        // Rounded Box
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.w, plat.h, 8);
        ctx.fill();
        ctx.stroke();

        // Platform highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(plat.x + 4, plat.y + 2, plat.w - 8, 4);
        ctx.restore();
      }
    }
  }

  drawInteractiveObjects(ctx) {
    // Springs
    for (const s of this.springs) {
      ctx.save();
      const compress = s.animTimer > 0 ? 6 : 0;
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.roundRect(s.x, s.y + compress, s.w, s.h - compress, 4);
      ctx.fill();

      // Yellow top pad
      ctx.fillStyle = '#facc15';
      ctx.fillRect(s.x - 2, s.y + compress, s.w + 4, 4);
      ctx.restore();
    }

    // Collectibles (Crystal Gems)
    for (const c of this.collectibles) {
      if (c.collected) continue;
      ctx.save();
      ctx.translate(c.x, c.y);

      // Glowing Diamond
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#fde047';

      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 14);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();

      // Diamond Inner Facet
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(6, -2);
      ctx.lineTo(0, 6);
      ctx.lineTo(-6, -2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  drawPlayer(ctx) {
    if (!this.spritesheetLoaded) return;
    const p = this.player;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    const shadowScale = p.isGrounded ? 1 : Math.max(0.4, 1 - (p.y - 620) / 400);
    ctx.ellipse(0, 0, 24 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flip Sprite Horizontally if facing left
    if (p.facing < 0) {
      ctx.scale(-1, 1);
    }

    // Get active frame source rectangle
    const frameRect = this.getFrameRect(p.currentAnim, p.currentFrame);
    if (frameRect) {
      // Draw pixel art crisply
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        this.spritesheet,
        frameRect.sx,
        frameRect.sy,
        this.frameW,
        this.frameH,
        -this.anchorX,
        -this.anchorY,
        this.frameW,
        this.frameH
      );
    }

    ctx.restore();
  }

  getFrameRect(animName, frameIndex) {
    const anim = this.animations[animName] || this.animations.idle;
    if (anim.rows) {
      // Multi-row animation (e.g. walk_12 combining walk_a and walk_b)
      const rowIndex = anim.rows[Math.floor(frameIndex / 6)];
      const colIndex = frameIndex % 6;
      return {
        sx: colIndex * this.frameW,
        sy: rowIndex * this.frameH
      };
    } else {
      const rowIndex = anim.row;
      const colIndex = (frameIndex !== undefined ? frameIndex : (anim.frameIndex || 0)) % anim.count;
      return {
        sx: colIndex * this.frameW,
        sy: rowIndex * this.frameH
      };
    }
  }

  drawDebugOverlay(ctx) {
    const p = this.player;
    ctx.save();

    // Hitbox
    if (this.params.showHitbox) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x - p.hitboxW / 2, p.y - p.hitboxH, p.hitboxW, p.hitboxH);
    }

    // Origin / Feet Anchor
    if (this.params.showOrigin) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - 12, p.y);
      ctx.lineTo(p.x + 12, p.y);
      ctx.moveTo(p.x, p.y - 12);
      ctx.lineTo(p.x, p.y + 12);
      ctx.stroke();
    }

    // Velocity Arrow
    if (this.params.showVelocity) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.hitboxH * 0.5);
      ctx.lineTo(p.x + p.vx * 0.15, p.y - p.hitboxH * 0.5 + p.vy * 0.15);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawHUD(ctx, w, h) {
    // Top-left Velocity / State badge
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(16, 16, 210, 78, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText(`ANIM: ${this.player.currentAnim.toUpperCase()}`, 28, 38);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 12px monospace';
    ctx.fillText(`SPEED: ${Math.round(Math.abs(this.player.vx))} px/s`, 28, 56);
    ctx.fillText(`AIR: ${!this.player.isGrounded ? 'JUMPING/FALL' : 'GROUNDED'}`, 28, 74);

    ctx.restore();
  }

  renderStudio() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    // Dark grid background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2 + 40;
    const zoom = this.studio.zoom;

    // Draw Studio Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Floor Line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 180, centerY);
    ctx.lineTo(centerX + 180, centerY);
    ctx.stroke();

    if (!this.spritesheetLoaded) return;

    // Render Character Frame Scaled
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(zoom, zoom);

    const frameRect = this.getFrameRect(this.studio.selectedAnim, this.studio.currentFrame);
    if (frameRect) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        this.spritesheet,
        frameRect.sx,
        frameRect.sy,
        this.frameW,
        this.frameH,
        -this.anchorX,
        -this.anchorY,
        this.frameW,
        this.frameH
      );

      // Hitbox / Origin Overlay
      if (this.params.showHitbox) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1 / zoom;
        ctx.strokeRect(-this.player.hitboxW / 2, -this.player.hitboxH, this.player.hitboxW, this.player.hitboxH);
      }
      if (this.params.showOrigin) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(16, 0);
        ctx.moveTo(0, -16);
        ctx.lineTo(0, 16);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

window.CharacterController = CharacterController;

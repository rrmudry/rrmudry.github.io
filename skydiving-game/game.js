/**
 * Terminal Velocity: Skydive Academy
 * Main Game Controller & Canvas Renderer
 */

const SPRITE_ATLAS = {
  freefall_1: { x: 64, y: 8, w: 38, h: 35, anchorX: 0.5, anchorY: 0.5 },
  freefall_2: { x: 240, y: 8, w: 38, h: 34, anchorX: 0.5, anchorY: 0.5 },
  freefall_3: { x: 416, y: 8, w: 36, h: 34, anchorX: 0.5, anchorY: 0.5 },
  deploy_1: { x: 592, y: 8, w: 52, h: 49, anchorX: 0.5, anchorY: 0.5 },
  deploy_2: { x: 768, y: 8, w: 75, h: 84, anchorX: 0.5, anchorY: 0.5 },
  glide_left: { x: 64, y: 200, w: 106, h: 125, anchorX: 0.5, anchorY: 0.85 },
  glide_neutral_1: { x: 185, y: 200, w: 145, h: 168, anchorX: 0.5, anchorY: 0.85 },
  glide_neutral_2: { x: 361, y: 200, w: 145, h: 168, anchorX: 0.5, anchorY: 0.85 },
  glide_right_1: { x: 595, y: 230, w: 104, h: 152, anchorX: 0.5, anchorY: 0.85 },
  glide_right_2: { x: 777, y: 270, w: 87, h: 112, anchorX: 0.5, anchorY: 0.85 },
  landed: { x: 73, y: 524, w: 97, h: 50, anchorX: 0.5, anchorY: 0.95 }
};

const MISSIONS = [
  {
    id: 1,
    name: "Mission 1: First Drop",
    location: "Sunny Valley DZ",
    altitude: 1500, // meters (~5,000 ft)
    wind: 2.0,
    ringsCount: 14,
    theme: "sunny",
    description: "Learn body positioning, collect aerial rings, and deploy your parachute safely in the designated zone."
  },
  {
    id: 2,
    name: "Mission 2: Coastal Crosswind",
    location: "Pacific Bluffs",
    altitude: 2400, // meters (~8,000 ft)
    wind: 8.5,
    ringsCount: 22,
    theme: "coastal",
    description: "Heavy crosswinds will push you sideways. Crab into the wind and time your flare for a soft touchdown on the beach target."
  },
  {
    id: 3,
    name: "Mission 3: Neon Night Skyline",
    location: "Metro Skyscraper LZ",
    altitude: 3000, // meters (~10,000 ft)
    wind: 4.0,
    ringsCount: 28,
    theme: "night",
    description: "Dive through glowing laser rings and land pinpoint on the illuminated rooftop helipad."
  },
  {
    id: 4,
    name: "Mission 4: Alpine Storm Chaser",
    location: "Thunder Peak Mountain",
    altitude: 4000, // meters (~13,000 ft)
    wind: 14.0,
    ringsCount: 35,
    theme: "storm",
    description: "Turbulent storm clouds, severe gusts, and lightning. Dodge turbulent updrafts and stick the landing."
  },
  {
    id: 5,
    name: "Mission 5: HALO Space Edge",
    location: "Stratosphere Island",
    altitude: 7500, // meters (~25,000 ft)
    wind: 6.0,
    ringsCount: 45,
    theme: "halo",
    description: "Extreme high-altitude military drop. Thin air yields supersonic terminal speeds! Pull your cord before the hard deck."
  }
];

class SkydiveGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.physics = new SkydivingPhysics();
    this.particles = new ParticleSystem();
    this.sound = window.soundEngine;

    // Sprite Sheet Image
    this.spriteSheet = new Image();
    this.spriteSheet.src = 'assets/spritesheet.png';
    this.spritesLoaded = false;
    this.spriteSheet.onload = () => { this.spritesLoaded = true; };

    // Game Mode & State
    this.mode = 'CAMPAIGN'; // 'CAMPAIGN', 'ARCADE', 'SANDBOX'
    this.currentMissionIndex = 0;
    this.state = 'MENU'; // 'MENU', 'COUNTDOWN', 'PLAYING', 'DEPLOYING', 'GLIDING', 'LANDED', 'CRASHED', 'PAUSED'
    
    // Scoring & Stats
    this.score = 0;
    this.ringsCollected = 0;
    this.totalRings = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.openAltitude = 0;
    this.touchdownDist = 0;
    this.landingRating = '';
    this.highScores = this.loadHighScores();

    // Input States
    this.keys = {};
    this.touchControls = { left: false, right: false, up: false, down: false, deploy: false };

    // World & Level Elements
    this.rings = [];
    this.clouds = [];
    this.birds = [];
    this.windGusts = [];
    this.cameraY = 0;
    this.screenShake = 0;

    // Animation Timers
    this.animTime = 0;
    this.deployTimer = 0;
    this.countdownTimer = 3.0;
    this.lastTime = performance.now();
    this.unitSystem = 'imperial'; // 'imperial' (ft, mph) or 'metric' (m, km/h)

    // Telemetry Graph History for Sandbox
    this.graphHistory = [];

    this.initCanvasSize();
    this.initEventListeners();
    this.initClouds();

    // Start Main Loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  loadHighScores() {
    try {
      const saved = localStorage.getItem('terminal_velocity_scores');
      return saved ? JSON.parse(saved) : { mission1: 0, mission2: 0, mission3: 0, mission4: 0, mission5: 0, arcade: 0 };
    } catch (e) {
      return { mission1: 0, mission2: 0, mission3: 0, mission4: 0, mission5: 0, arcade: 0 };
    }
  }

  saveHighScore(key, val) {
    if (val > (this.highScores[key] || 0)) {
      this.highScores[key] = val;
      try {
        localStorage.setItem('terminal_velocity_scores', JSON.stringify(this.highScores));
      } catch (e) {}
    }
  }

  initCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = Math.floor(rect.width);
    this.height = Math.floor(rect.height);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false; // Keep crisp pixel art
  }

  initEventListeners() {
    window.addEventListener('resize', () => this.initCanvasSize());

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      this.sound.resume();
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;

      if (e.code === 'Space') {
        this.handleDeployTrigger();
      } else if (e.code === 'KeyP') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Touch / Button listeners
    this.bindTouchButton('btn-left', 'left');
    this.bindTouchButton('btn-right', 'right');
    this.bindTouchButton('btn-dive', 'up');
    this.bindTouchButton('btn-arch', 'down');
    this.bindTouchButton('btn-deploy', 'deploy', () => this.handleDeployTrigger());
  }

  bindTouchButton(elemId, keyName, callback) {
    const el = document.getElementById(elemId);
    if (!el) return;

    const start = (e) => {
      e.preventDefault();
      this.sound.resume();
      this.touchControls[keyName] = true;
      if (callback) callback();
    };
    const end = (e) => {
      e.preventDefault();
      this.touchControls[keyName] = false;
    };

    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', end, { passive: false });
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
  }

  initClouds() {
    this.clouds = [];
    for (let i = 0; i < 45; i++) {
      this.clouds.push({
        x: (Math.random() - 0.5) * 2400,
        alt: 300 + Math.random() * 8000,
        w: 120 + Math.random() * 260,
        h: 60 + Math.random() * 90,
        density: 0.3 + Math.random() * 0.5,
        speed: (Math.random() - 0.5) * 15
      });
    }
  }

  generateLevel(mission) {
    this.rings = [];
    this.birds = [];
    this.totalRings = mission.ringsCount;
    this.ringsCollected = 0;
    this.score = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.graphHistory = [];

    const dropAlt = mission.altitude;
    const deployFloor = 400; // Parachute must open around 500-1000m
    const freefallDistance = dropAlt - deployFloor;
    const ringSpacing = freefallDistance / (mission.ringsCount + 2);

    let currentX = 0;
    for (let i = 0; i < mission.ringsCount; i++) {
      const alt = dropAlt - 120 - i * ringSpacing;
      // Zig-zag path with wind drift influence
      currentX += (Math.random() - 0.5) * 80 + mission.wind * 1.5;
      currentX = Math.max(-280, Math.min(280, currentX));

      const isSpecial = (i + 1) % 5 === 0;
      this.rings.push({
        x: currentX,
        alt: alt,
        radius: isSpecial ? 38 : 30,
        type: isSpecial ? 'STAR' : 'RING',
        collected: false,
        pulse: Math.random() * Math.PI * 2
      });
    }

    // Add flocks of soaring birds at mid-altitudes
    for (let i = 0; i < 6; i++) {
      this.birds.push({
        x: (Math.random() - 0.5) * 600,
        alt: 800 + Math.random() * 1600,
        vx: (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 25),
        wingTime: Math.random() * 10
      });
    }
  }

  startMission(missionIndex) {
    this.currentMissionIndex = missionIndex;
    const mission = MISSIONS[missionIndex];
    this.mode = 'CAMPAIGN';
    this.generateLevel(mission);
    this.physics.reset(mission.altitude, 0, mission.wind);
    this.state = 'COUNTDOWN';
    this.countdownTimer = 3.0;
    this.sound.resume();
    this.sound.playJump();
    this.updateUIOverlay();
  }

  startArcade() {
    this.mode = 'ARCADE';
    const arcadeMission = {
      id: 99,
      name: "Endless Skyfall",
      location: "Infinite Atmosphere",
      altitude: 10000,
      wind: 5.0,
      ringsCount: 60,
      theme: "sunny"
    };
    this.generateLevel(arcadeMission);
    this.physics.reset(arcadeMission.altitude, 0, arcadeMission.wind);
    this.state = 'COUNTDOWN';
    this.countdownTimer = 3.0;
    this.sound.resume();
    this.sound.playJump();
    this.updateUIOverlay();
  }

  startSandbox() {
    this.mode = 'SANDBOX';
    const mission = MISSIONS[0];
    this.generateLevel(mission);
    this.physics.reset(2500, 0, 0);
    this.state = 'PLAYING';
    this.sound.resume();
    this.updateUIOverlay();
  }

  handleDeployTrigger() {
    if (this.state === 'PLAYING' && this.physics.state === 'FREEFALL') {
      this.state = 'DEPLOYING';
      this.physics.state = 'DEPLOYING_1';
      this.deployTimer = 0;
      this.openAltitude = this.physics.altitude;
      this.sound.playDeploy();

      // Check opening conditions for bonuses/penalties
      const speed = this.physics.vy;
      if (speed < 45) {
        this.score += 500; // Stable flared opening bonus
      } else if (speed > 75) {
        this.screenShake = 15; // Hard slam deceleration shock
      }
    }
  }

  togglePause() {
    if (this.state === 'PLAYING' || this.state === 'DEPLOYING' || this.state === 'GLIDING') {
      this.state = 'PAUSED';
      this.sound.stopWind();
    } else if (this.state === 'PAUSED') {
      this.state = this.physics.state === 'FREEFALL' ? 'PLAYING' : 'GLIDING';
    }
    this.updateUIOverlay();
  }

  // --- Main Update Loop ---
  update(dt) {
    this.animTime += dt;

    if (this.state === 'COUNTDOWN') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.state = 'PLAYING';
      }
      return;
    }

    if (this.state === 'PAUSED') return;

    if (this.state === 'PLAYING' || this.state === 'DEPLOYING' || this.state === 'GLIDING') {
      // Process Inputs
      let steer = 0;
      let pitch = 0;
      let flare = false;

      if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchControls.left) steer -= 1;
      if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchControls.right) steer += 1;
      if (this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchControls.up) pitch -= 1;
      if (this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchControls.down) pitch += 1;
      if (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.touchControls.down) flare = true;

      this.physics.steerInput = steer;
      this.physics.pitchInput = pitch;
      this.physics.isFlaring = (this.state === 'GLIDING' && (flare || pitch > 0));

      // Handle Parachute Opening Stages
      if (this.state === 'DEPLOYING') {
        this.deployTimer += dt;
        if (this.deployTimer > 0.4 && this.physics.state === 'DEPLOYING_1') {
          this.physics.state = 'DEPLOYING_2';
        }
        if (this.deployTimer > 1.0) {
          this.physics.state = 'GLIDING';
          this.state = 'GLIDING';
        }
      }

      // Step Physics
      this.physics.update(dt);

      // Sound update
      const isInFreefall = this.physics.state === 'FREEFALL' || this.physics.state.startsWith('DEPLOY');
      this.sound.updateWind(this.physics.vy, 80, isInFreefall);

      // Low Altitude Warnings
      if (this.physics.state === 'FREEFALL') {
        if (this.physics.altitude < 400) {
          if (Math.floor(this.animTime * 6) % 2 === 0) this.sound.playBeep(true);
        } else if (this.physics.altitude < 800) {
          if (Math.floor(this.animTime * 2.5) % 2 === 0) this.sound.playBeep(false);
        }
      }

      // Check Ring Collisions
      this.checkRingCollisions();

      // Screen shake decay
      if (this.screenShake > 0) {
        this.screenShake = Math.max(0, this.screenShake - dt * 25);
      }

      // Particle Spawning
      if (isInFreefall) {
        this.particles.spawnSpeedStreak(this.width, this.height, this.physics.vy);
        if (Math.random() < 0.3) {
          this.particles.spawnVaporWisp(this.width / 2, this.height * 0.45, this.physics.vx, this.physics.vy);
        }
      }

      // Record Telemetry for Sandbox
      if (this.mode === 'SANDBOX') {
        this.graphHistory.push({
          t: this.physics.timeElapsed,
          alt: this.physics.altitude,
          vy: this.physics.vy,
          drag: this.physics.dragForce,
          gForce: this.physics.gForce
        });
        if (this.graphHistory.length > 240) this.graphHistory.shift();
      }

      // Check Landing / Crash Termination
      if (this.physics.state === 'LANDED') {
        this.handleTouchdown();
      } else if (this.physics.state === 'CRASHED') {
        this.handleCrash();
      }
    }

    // Update Particles & World
    this.particles.update(dt);

    // Update Birds
    this.birds.forEach(b => {
      b.x += b.vx * dt;
      b.wingTime += dt * 8;
      if (b.x > 800) b.x = -800;
      if (b.x < -800) b.x = 800;
    });
  }

  checkRingCollisions() {
    const skydiverX = this.physics.x;
    const skydiverAlt = this.physics.altitude;

    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      if (ring.collected) continue;

      const dx = skydiverX - ring.x;
      const dAlt = Math.abs(skydiverAlt - ring.alt);

      // Collision box in world space (meters)
      if (Math.abs(dx) < ring.radius * 0.35 && dAlt < 12) {
        ring.collected = true;
        this.ringsCollected++;
        this.combo = Math.min(8, this.combo + 1);
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        const pts = (ring.type === 'STAR' ? 500 : 150) * this.combo;
        this.score += pts;

        // Visual screen coord
        const screenX = this.width / 2 + dx * 3.5;
        const screenY = this.height * 0.45;

        if (ring.type === 'STAR') {
          this.sound.playGem();
          this.particles.spawnStarBurst(screenX, screenY);
        } else {
          this.sound.playRing(this.combo);
          this.particles.spawnRingBurst(screenX, screenY, '#38bdf8');
        }
      }
    }
  }

  handleTouchdown() {
    this.state = 'LANDED';
    this.sound.stopWind();
    
    // Distance from target bullseye (meters)
    this.touchdownDist = Math.abs(this.physics.x);
    let accuracyPts = 0;

    if (this.touchdownDist < 5) {
      this.landingRating = "PERFECT BULLSEYE! 🎯 (100% Accuracy)";
      accuracyPts = 2000;
      this.particles.spawnConfetti(this.width, this.height);
      this.sound.playTouchdown(100);
    } else if (this.touchdownDist < 15) {
      this.landingRating = "GREAT LANDING! 🔵 (Inner Blue Ring)";
      accuracyPts = 1000;
      this.sound.playTouchdown(80);
    } else if (this.touchdownDist < 35) {
      this.landingRating = "ON TARGET! 🟢 (Outer Green Ring)";
      accuracyPts = 500;
      this.sound.playTouchdown(50);
    } else {
      this.landingRating = "OFF FIELD LANDING 🌾 (Rough Grass)";
      accuracyPts = 150;
      this.sound.playTouchdown(20);
    }

    this.score += accuracyPts;
    this.particles.spawnLandingDust(this.width / 2, this.height * 0.85, 1.5);

    // Save High Score
    const key = this.mode === 'CAMPAIGN' ? `mission${this.currentMissionIndex + 1}` : 'arcade';
    this.saveHighScore(key, this.score);

    this.updateUIOverlay();
  }

  handleCrash() {
    this.state = 'CRASHED';
    this.sound.stopWind();
    this.sound.playCrash();
    this.screenShake = 30;
    this.particles.spawnLandingDust(this.width / 2, this.height * 0.85, 3.0);
    this.landingRating = this.physics.altitude <= 0 && this.physics.state === 'CRASHED' && this.physics.vy > 10 ?
      "FATAL FREEFALL IMPACT! (Failed to Deploy Chute)" : "HARD CRASH LANDING! (Excessive Touchdown Speed)";
    this.updateUIOverlay();
  }

  // --- Rendering ---
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.save();
    if (this.screenShake > 0) {
      this.ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }

    // 1. Sky & Atmospheric Background Gradient
    this.drawSkyBackground();

    // 2. Distant Parallax Terrain & Horizon
    this.drawTerrain();

    // 3. Multilayer Clouds
    this.drawClouds();

    // 4. Aerial Rings & Stars
    this.drawRings();

    // 5. Landing Target & Drop Zone Runway
    this.drawLandingZone();

    // 6. Flying Birds
    this.drawBirds();

    // 7. Particle Effects (Wind Streaks, Vapors, Sparkles)
    this.particles.draw(this.ctx);

    // 8. The Skydiver Sprite (Centered in Screen)
    this.drawSkydiverSprite();

    // 9. Cockpit & Aviation HUD Overlay
    this.drawHUD();

    this.ctx.restore();
  }

  drawSkyBackground() {
    const mission = MISSIONS[this.currentMissionIndex] || MISSIONS[0];
    const altRatio = Math.max(0, Math.min(this.physics.altitude / (mission.altitude || 3000), 1.0));
    
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);

    if (mission.theme === 'night') {
      grad.addColorStop(0, '#030712');
      grad.addColorStop(0.6, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
    } else if (mission.theme === 'storm') {
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.5, '#334155');
      grad.addColorStop(1, '#475569');
    } else if (mission.theme === 'halo') {
      // Stratosphere into space
      grad.addColorStop(0, '#020617'); // Black space
      grad.addColorStop(0.35, '#0c1a30'); // Deep cosmic blue
      grad.addColorStop(0.8, '#1d4ed8'); // Stratosphere blue
      grad.addColorStop(1, '#60a5fa');
    } else {
      // Sunny & Coastal
      const topColor = `rgb(${Math.floor(15 + (1 - altRatio) * 60)}, ${Math.floor(60 + (1 - altRatio) * 120)}, ${Math.floor(180 + (1 - altRatio) * 65)})`;
      const bottomColor = `rgb(${Math.floor(140 + altRatio * 50)}, ${Math.floor(210 + altRatio * 30)}, ${Math.floor(250)})`;
      grad.addColorStop(0, topColor);
      grad.addColorStop(1, bottomColor);
    }

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Stars at high altitude (HALO / Night)
    if (this.physics.altitude > 4000 || mission.theme === 'night') {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 137.5) % this.width);
        const sy = ((i * 219.3) % (this.height * 0.45));
        this.ctx.fillRect(sx, sy, 1.5, 1.5);
      }
    }
  }

  drawTerrain() {
    const alt = this.physics.altitude;
    // Ground emerges when altitude < 1200 meters
    if (alt > 1400) return;

    const groundRatio = 1.0 - (alt / 1400); // 0 at 1400m, 1 at 0m
    const horizonY = this.height * (0.55 + groundRatio * 0.35);

    // Distant Mountain Ranges
    this.ctx.fillStyle = '#1e3a8a';
    this.ctx.beginPath();
    this.ctx.moveTo(0, horizonY);
    for (let x = 0; x <= this.width; x += 40) {
      const my = horizonY - Math.sin((x + this.physics.x * 2) * 0.005) * 30 * (1 - groundRatio * 0.5);
      this.ctx.lineTo(x, my);
    }
    this.ctx.lineTo(this.width, this.height);
    this.ctx.lineTo(0, this.height);
    this.ctx.fill();

    // Rolling Green / Coastal Plains
    this.ctx.fillStyle = '#15803d';
    this.ctx.fillRect(0, horizonY, this.width, this.height - horizonY);
  }

  drawLandingZone() {
    const alt = this.physics.altitude;
    if (alt > 800) return; // Only visible near ground

    const groundProgress = 1.0 - (alt / 800);
    const targetScreenX = this.width / 2 - (this.physics.x * 6 * groundProgress);
    const targetScreenY = this.height * (0.65 + groundProgress * 0.25);
    const scale = 0.2 + groundProgress * 1.8;

    this.ctx.save();
    this.ctx.translate(targetScreenX, targetScreenY);

    // Runway / Field pad
    this.ctx.fillStyle = '#334155';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 180 * scale, 55 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Outer Target Ring (Green - 250 pts)
    this.ctx.fillStyle = '#22c55e';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 120 * scale, 38 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner Target Ring (Blue - 500 pts)
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 75 * scale, 24 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Bullseye Ring (Gold - 1000 pts)
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 30 * scale, 10 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Crosshairs
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(-140 * scale, 0);
    this.ctx.lineTo(140 * scale, 0);
    this.ctx.moveTo(0, -45 * scale);
    this.ctx.lineTo(0, 45 * scale);
    this.ctx.stroke();

    // Target Marker Text
    if (groundProgress > 0.4) {
      this.ctx.font = 'bold 12px monospace';
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('DROP ZONE TARGET', 0, -52 * scale);
    }

    this.ctx.restore();
  }

  drawClouds() {
    this.clouds.forEach(c => {
      const dAlt = c.alt - this.physics.altitude;
      // Only render clouds in viewport altitude range
      if (Math.abs(dAlt) > 600) return;

      const screenY = this.height * 0.45 - (dAlt * 2.2);
      const screenX = this.width / 2 + (c.x - this.physics.x * 2.5);

      this.ctx.fillStyle = `rgba(255, 255, 255, ${c.density})`;
      this.ctx.beginPath();
      this.ctx.ellipse(screenX, screenY, c.w, c.h, 0, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawRings() {
    this.rings.forEach(ring => {
      if (ring.collected) return;
      const dAlt = ring.alt - this.physics.altitude;
      if (Math.abs(dAlt) > 400) return;

      const screenY = this.height * 0.45 - (dAlt * 3.5);
      const screenX = this.width / 2 + (ring.x - this.physics.x) * 4.0;
      const distScale = Math.max(0.3, 1.0 - Math.abs(dAlt) / 400);

      this.ctx.save();
      this.ctx.translate(screenX, screenY);
      this.ctx.scale(distScale, distScale);

      ring.pulse += 0.05;
      const pulseSize = Math.sin(ring.pulse) * 3;

      if (ring.type === 'STAR') {
        // Glowing Star Gem
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.shadowColor = '#f59e0b';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        const r = ring.radius + pulseSize;
        for (let i = 0; i < 5; i++) {
          this.ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r, -Math.sin((18 + i * 72) * Math.PI / 180) * r);
          this.ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (r * 0.5), -Math.sin((54 + i * 72) * Math.PI / 180) * (r * 0.5));
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      } else {
        // Neon Target Ring Gate
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 6;
        this.ctx.shadowColor = '#0284c7';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, ring.radius + pulseSize, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner glowing core
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, ring.radius + pulseSize, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }

      this.ctx.restore();
    });
  }

  drawBirds() {
    this.birds.forEach(b => {
      const dAlt = b.alt - this.physics.altitude;
      if (Math.abs(dAlt) > 200) return;

      const screenY = this.height * 0.45 - (dAlt * 3.0);
      const screenX = this.width / 2 + (b.x - this.physics.x) * 3.0;

      this.ctx.save();
      this.ctx.translate(screenX, screenY);
      this.ctx.strokeStyle = '#1e293b';
      this.ctx.lineWidth = 2;

      const wingFlap = Math.sin(b.wingTime) * 8;
      this.ctx.beginPath();
      this.ctx.moveTo(-12, wingFlap);
      this.ctx.quadraticCurveTo(-6, -8, 0, 0);
      this.ctx.quadraticCurveTo(6, -8, 12, wingFlap);
      this.ctx.stroke();
      this.ctx.restore();
    });
  }

  // Draw the Player Skydiver from the Sprite Atlas
  drawSkydiverSprite() {
    if (!this.spritesLoaded) return;

    let spriteKey = 'freefall_2';
    let rotation = 0;
    const pState = this.physics.state;
    const steer = this.physics.steerInput;

    if (pState === 'FREEFALL') {
      // 3-frame cycling animation
      const frameCycle = Math.floor(this.animTime * 9) % 3;
      if (frameCycle === 0) spriteKey = 'freefall_1';
      else if (frameCycle === 1) spriteKey = 'freefall_2';
      else spriteKey = 'freefall_3';

      // Tilt skydiver based on lateral track
      rotation = (steer * 0.25) + (this.physics.vx * 0.015);
    } else if (pState === 'DEPLOYING_1') {
      spriteKey = 'deploy_1';
      rotation = (Math.random() - 0.5) * 0.1;
    } else if (pState === 'DEPLOYING_2') {
      spriteKey = 'deploy_2';
      rotation = (Math.random() - 0.5) * 0.05;
    } else if (pState === 'GLIDING') {
      if (steer < -0.2) {
        spriteKey = 'glide_left';
        rotation = -0.15;
      } else if (steer > 0.6) {
        spriteKey = 'glide_right_2'; // Hard bank
        rotation = 0.25;
      } else if (steer > 0.2) {
        spriteKey = 'glide_right_1'; // Moderate turn
        rotation = 0.12;
      } else {
        // Neutral forward glide (cycle legs animation)
        const frameCycle = Math.floor(this.animTime * 3) % 2;
        spriteKey = frameCycle === 0 ? 'glide_neutral_1' : 'glide_neutral_2';
      }
    } else if (pState === 'LANDED') {
      spriteKey = 'landed';
    } else if (pState === 'CRASHED') {
      spriteKey = 'freefall_1';
      rotation = Math.PI * 0.6; // Faceplant rotation
    }

    const frame = SPRITE_ATLAS[spriteKey];
    if (!frame) return;

    const screenX = this.width / 2;
    const screenY = pState === 'LANDED' || pState === 'CRASHED' ? this.height * 0.85 : this.height * 0.45;
    const renderScale = 1.8; // Crisp pixel scale

    this.ctx.save();
    this.ctx.translate(screenX, screenY);
    this.ctx.rotate(rotation);

    // Draw sprite using pixelated image rendering
    const destW = frame.w * renderScale;
    const destH = frame.h * renderScale;
    const anchorOffsetX = -destW * frame.anchorX;
    const anchorOffsetY = -destH * frame.anchorY;

    this.ctx.drawImage(
      this.spriteSheet,
      frame.x, frame.y, frame.w, frame.h,
      anchorOffsetX, anchorOffsetY, destW, destH
    );

    // Draw Physics Force Vectors in Sandbox Mode
    if (this.mode === 'SANDBOX' && (pState === 'FREEFALL' || pState === 'GLIDING')) {
      this.drawForceVectors();
    }

    this.ctx.restore();
  }

  drawForceVectors() {
    const scale = 0.25;
    const fg = this.physics.gravityForce * scale;
    const fd = this.physics.dragForce * scale;

    // Gravity Vector (Fg - Red, Downwards)
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, Math.min(fg, 120));
    this.ctx.stroke();

    // Drag Vector (Fd - Cyan, Upwards)
    this.ctx.strokeStyle = '#06b6d4';
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, -Math.min(fd, 140));
    this.ctx.stroke();

    // Labels
    this.ctx.font = 'bold 11px monospace';
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillText(`Fg: ${Math.round(this.physics.gravityForce)} N`, 10, 30);
    this.ctx.fillStyle = '#06b6d4';
    this.ctx.fillText(`Fd: ${Math.round(this.physics.dragForce)} N`, 10, -30);
  }

  // Cockpit & Aviation HUD Overlay
  drawHUD() {
    if (this.state === 'MENU') return;

    const alt = this.physics.altitude;
    const vy = this.physics.vy;
    const vx = this.physics.vx;

    // Conversion for imperial/metric
    const altDisplay = this.unitSystem === 'imperial' ? Math.round(alt * 3.28084) : Math.round(alt);
    const altUnit = this.unitSystem === 'imperial' ? 'FT' : 'M';
    const speedDisplay = this.unitSystem === 'imperial' ? Math.round(vy * 2.23694) : Math.round(vy * 3.6);
    const speedUnit = this.unitSystem === 'imperial' ? 'MPH' : 'KM/H';

    // Left HUD Box: Altimeter & Airspeed
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(16, 16, 210, 110, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = 'bold 13px system-ui, sans-serif';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillText('ALTITUDE', 28, 38);
    this.ctx.font = 'bold 24px monospace';
    this.ctx.fillStyle = alt < 800 ? '#ef4444' : '#38bdf8';
    this.ctx.fillText(`${altDisplay} ${altUnit}`, 28, 66);

    this.ctx.font = 'bold 12px system-ui, sans-serif';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillText(`DESCENT SPEED: `, 28, 92);
    this.ctx.font = 'bold 15px monospace';
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillText(`${speedDisplay} ${speedUnit}`, 135, 92);

    this.ctx.font = 'bold 11px system-ui, sans-serif';
    this.ctx.fillStyle = '#64748b';
    this.ctx.fillText(`AIR DENSITY: ${this.physics.currentAirDensity.toFixed(3)} kg/m³`, 28, 112);

    // Right HUD Box: Score, Combo & Mission Info
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.beginPath();
    this.ctx.roundRect(this.width - 200, 16, 184, 110, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = 'bold 13px system-ui, sans-serif';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillText('SCORE', this.width - 188, 38);
    this.ctx.font = 'bold 22px monospace';
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.fillText(`${this.score.toLocaleString()}`, this.width - 188, 64);

    this.ctx.font = 'bold 12px system-ui, sans-serif';
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.fillText(`COMBO: ${this.combo}x`, this.width - 188, 88);
    this.ctx.fillStyle = '#a855f7';
    this.ctx.fillText(`RINGS: ${this.ringsCollected}/${this.totalRings}`, this.width - 188, 108);

    // Center Top: Deployment Alert Flasher
    if (this.state === 'PLAYING' && this.physics.state === 'FREEFALL') {
      if (alt < 1000) {
        const flash = Math.floor(this.animTime * 8) % 2 === 0;
        this.ctx.fillStyle = flash ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.9)';
        this.ctx.beginPath();
        this.ctx.roundRect(this.width / 2 - 130, 20, 260, 42, 8);
        this.ctx.fill();

        this.ctx.font = 'bold 16px system-ui, sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚠️ PULL CHUTE NOW! (SPACE)', this.width / 2, 47);
        this.ctx.textAlign = 'left';
      }
    }

    // Bottom Flare Advice during canopy flight
    if (this.state === 'GLIDING' && alt < 40 && alt > 3) {
      this.ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
      this.ctx.beginPath();
      this.ctx.roundRect(this.width / 2 - 120, this.height - 80, 240, 36, 8);
      this.ctx.fill();

      this.ctx.font = 'bold 14px system-ui, sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('⬇️ FLARE BRAKES! (DOWN/SHIFT)', this.width / 2, this.height - 57);
      this.ctx.textAlign = 'left';
    }

    // Countdown Overlay
    if (this.state === 'COUNTDOWN') {
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.font = 'bold 48px system-ui, sans-serif';
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.textAlign = 'center';
      const countNum = Math.ceil(this.countdownTimer);
      this.ctx.fillText(countNum > 0 ? `READY... ${countNum}` : 'JUMP!', this.width / 2, this.height / 2);
      this.ctx.textAlign = 'left';
    }
  }

  updateUIOverlay() {
    const modalEl = document.getElementById('game-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalBtn = document.getElementById('modal-action-btn');

    if (!modalEl) return;

    if (this.state === 'LANDED' || this.state === 'CRASHED') {
      modalEl.classList.remove('hidden');
      modalTitle.innerText = this.state === 'LANDED' ? '🎉 TOUCHDOWN COMPLETE!' : '💥 HARD IMPACT!';
      modalTitle.className = this.state === 'LANDED' ? 'title-success' : 'title-danger';

      modalBody.innerHTML = `
        <div class="result-card">
          <p class="rating-badge">${this.landingRating}</p>
          <div class="stat-grid">
            <div><span>Final Score:</span> <strong>${this.score.toLocaleString()}</strong></div>
            <div><span>Touchdown Speed:</span> <strong>${(this.physics.touchdownSpeed * (this.unitSystem === 'imperial' ? 2.23694 : 3.6)).toFixed(1)} ${this.unitSystem === 'imperial' ? 'mph' : 'km/h'}</strong></div>
            <div><span>Bullseye Offset:</span> <strong>${this.touchdownDist.toFixed(1)} m</strong></div>
            <div><span>Rings Collected:</span> <strong>${this.ringsCollected} / ${this.totalRings}</strong></div>
            <div><span>Max Combo:</span> <strong>${this.maxCombo}x</strong></div>
            <div><span>Opening Altitude:</span> <strong>${Math.round(this.openAltitude * (this.unitSystem === 'imperial' ? 3.28084 : 1))} ${this.unitSystem === 'imperial' ? 'ft' : 'm'}</strong></div>
          </div>
        </div>
      `;

      if (this.state === 'LANDED' && this.mode === 'CAMPAIGN' && this.currentMissionIndex < MISSIONS.length - 1) {
        modalBtn.innerText = 'Next Mission 🚀';
        modalBtn.onclick = () => {
          modalEl.classList.add('hidden');
          this.startMission(this.currentMissionIndex + 1);
        };
      } else {
        modalBtn.innerText = 'Play Again 🔄';
        modalBtn.onclick = () => {
          modalEl.classList.add('hidden');
          if (this.mode === 'CAMPAIGN') this.startMission(this.currentMissionIndex);
          else if (this.mode === 'ARCADE') this.startArcade();
          else this.startSandbox();
        };
      }
    } else if (this.state === 'PAUSED') {
      modalEl.classList.remove('hidden');
      modalTitle.innerText = '⏸️ GAME PAUSED';
      modalTitle.className = '';
      modalBody.innerHTML = `
        <p>Take a breath at ${Math.round(this.physics.altitude)}m altitude!</p>
        <p class="hint">Use <strong>Arrow Keys / WASD</strong> to steer & pitch, <strong>Space</strong> to Deploy Parachute, and <strong>Down / Shift</strong> to Flare.</p>
      `;
      modalBtn.innerText = 'Resume Flight ▶️';
      modalBtn.onclick = () => {
        modalEl.classList.add('hidden');
        this.togglePause();
      };
    } else {
      modalEl.classList.add('hidden');
    }
  }

  gameLoop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

window.SkydiveGame = SkydiveGame;

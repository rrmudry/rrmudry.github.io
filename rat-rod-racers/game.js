/**
 * Rat Rod Racers - Main Game Controller & Orchestrator
 * Manages game loop, 2D drag strip track rendering, Christmas tree staging,
 * race states, timeslip calculations, garage customizer, crate shop, and dyno lab.
 */

class RatRodGame {
  constructor() {
    window.game = this;
    this.canvas = document.getElementById('raceCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    // Subsystems
    this.audio = new RatRodAudio();
    this.inventory = new InventoryManager();
    this.challenges = new PhysicsChallengeEngine();
    this.crates = new CrateShopEngine(this.inventory);
    this.authManager = typeof RatRodAuthManager !== 'undefined' ? new RatRodAuthManager(this) : null;
    this.isSubmittingDyno = false;

    // Player car
    this.playerCar = new RatRodCar({
      name: "Rusty Rocket",
      driver: "You",
      number: 77
    });

    // Opponent car
    this.opponentRoster = STUDENT_GHOST_ROSTER;
    this.opponentIndex = 0;
    this.opponentCar = this.opponentRoster[0].car;

    // Physics engines
    this.playerPhysics = new RatRodPhysics();
    this.opponentPhysics = new RatRodPhysics();

    // Telemetry viewer
    this.telemetryViewer = new TelemetryViewer('telemetryCanvas');

    // State
    this.activeTab = 'race'; // 'race', 'garage', 'crates', 'dyno'
    this.raceState = 'IDLE'; // 'IDLE', 'COUNTDOWN', 'RACING', 'FINISHED'
    this.countdownTimer = 0;
    this.treeStep = 0; // 0: off, 1: stage, 2: amber1, 3: amber2, 4: amber3, 5: green, 6: red
    this.greenTimestamp = 0;
    this.playerReacted = false;
    this.playerFoul = false;
    this.playerReactionTime = null;
    this.lastTime = 0;
    this.cameraX = 0;

    // Unit toggle: 'metric' vs 'imperial'
    this.units = 'imperial'; // high school students love mph / ft

    this.leaderboardMode = 'points'; // 'points' or 'et'
    this.lastRacePoints = 0;

    this._initUI();
    this._bindEvents();
    this.syncPlayerCarPhysics();
    this.syncOpponentPhysics();
    this.updateHUD();

    // Start game loop
    this.isRunning = true;
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  syncPlayerCarPhysics() {
    this.playerCar.recomputeStats();
    this.playerPhysics.mass = this.playerCar.mass;
    this.playerPhysics.peakForce = this.playerCar.peakForce;
    this.playerPhysics.frictionCoeff = this.playerCar.mu;
    this.playerPhysics.cdA = this.playerCar.cdA;
    this.playerPhysics.powerBand = this.playerCar.powerBand;
    this.playerPhysics.nitroBoost = this.playerCar.nitroBoost;
    this.playerPhysics.nitroDuration = this.playerCar.nitroDuration;
    this.playerPhysics.reset();
    this.updateHUD();
    this.updateMatchupBadge();
  }

  syncOpponentPhysics() {
    this.opponentCar.recomputeStats();
    this.opponentPhysics.mass = this.opponentCar.mass;
    this.opponentPhysics.peakForce = this.opponentCar.peakForce;
    this.opponentPhysics.frictionCoeff = this.opponentCar.mu;
    this.opponentPhysics.cdA = this.opponentCar.cdA;
    this.opponentPhysics.powerBand = this.opponentCar.powerBand;
    this.opponentPhysics.nitroBoost = this.opponentCar.nitroBoost;
    this.opponentPhysics.nitroDuration = this.opponentCar.nitroDuration;
    this.opponentPhysics.reset();
  }

  _initUI() {
    this.populateOpponentDropdown();
    this.autoMatchOpponent(false);
    this.renderGarage();
    this.renderCrateShop();
    this.loadNextDynoChallenge();
    this.renderLeaderboard();
  }

  _bindEvents() {
    // Navigation Tabs
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Audio Button
    const audioBtn = document.getElementById('btn-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = this.audio.toggleMute();
        audioBtn.textContent = isMuted ? '🔇 Muted' : '🔊 Sound';
      });
      audioBtn.textContent = this.audio.muted ? '🔇 Muted' : '🔊 Sound';
    }

    // Units Toggle
    const unitsBtn = document.getElementById('btn-units');
    if (unitsBtn) {
      unitsBtn.addEventListener('click', () => {
        this.units = this.units === 'imperial' ? 'metric' : 'imperial';
        unitsBtn.textContent = this.units === 'imperial' ? '📐 MPH / FT' : '📐 M/S / M';
        this.telemetryViewer.setUnits(this.units);
        this.updateHUD();
        this.renderGarage();
      });
    }

    // Race Controls
    const launchBtn = document.getElementById('btn-launch');
    if (launchBtn) {
      launchBtn.addEventListener('click', () => this.handleLaunchButton());
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        if (this.activeTab === 'race') {
          e.preventDefault();
          this.handleLaunchButton();
        }
      }
    });

    // Opponent Selection Change
    const oppSelect = document.getElementById('opponent-select');
    if (oppSelect) {
      oppSelect.addEventListener('change', (e) => {
        this.opponentIndex = parseInt(e.target.value, 10);
        this.opponentCar = this.opponentRoster[this.opponentIndex].car;
        this.syncOpponentPhysics();
        this.updateMatchupBadge();
        this.resetRace();
      });
    }

    // Auto-Match Button
    const autoMatchBtn = document.getElementById('btn-automatch');
    if (autoMatchBtn) {
      autoMatchBtn.addEventListener('click', () => {
        this.autoMatchOpponent(true);
      });
    }

    // Import Share Code
    const importBtn = document.getElementById('btn-import-code');
    const codeInput = document.getElementById('input-share-code');
    if (importBtn && codeInput) {
      importBtn.addEventListener('click', () => {
        const code = codeInput.value.trim();
        const imported = RatRodCar.fromShareCode(code);
        if (imported) {
          this.opponentCar = imported;
          this.syncOpponentPhysics();
          this.updateMatchupBadge();
          this.resetRace();
          alert(`Successfully loaded classmate ghost: ${imported.name} (${imported.driver})!`);
        } else {
          alert("Invalid share code. Format should look like 'ROD-...'");
        }
      });
    }

    // Copy My Share Code
    const copyBtn = document.getElementById('btn-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const code = this.playerCar.toShareCode();
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.textContent = '✅ Copied!';
          setTimeout(() => { copyBtn.textContent = '📋 Copy Share Code'; }, 2000);
        }).catch(() => {
          prompt("Copy your car's share code:", code);
        });
      });
    }

    // Dyno Lab Submit
    const dynoSubmit = document.getElementById('btn-dyno-submit');
    const dynoInput = document.getElementById('dyno-input-val');
    if (dynoSubmit && dynoInput) {
      dynoSubmit.addEventListener('click', () => this.submitDynoAnswer());
      dynoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (this.challenges.currentChallenge && this.challenges.currentChallenge.answered) {
            this.loadNextDynoChallenge();
          } else {
            this.submitDynoAnswer();
          }
        }
      });
    }

    const dynoNext = document.getElementById('btn-dyno-next');
    if (dynoNext) {
      dynoNext.addEventListener('click', () => this.loadNextDynoChallenge());
    }

    // Telemetry Mode Buttons
    const teleBtns = document.querySelectorAll('.tele-mode-btn');
    teleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        teleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.telemetryViewer.setMode(btn.dataset.mode);
      });
    });

    // Modal Close
    const modalClose = document.getElementById('btn-close-modal');
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        document.getElementById('race-results-modal').classList.add('hidden');
      });
    }

    // Leaderboard Tabs (Points vs Fastest ET)
    const lbTabBtns = document.querySelectorAll('.lb-tab-btn');
    lbTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        lbTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.leaderboardMode = btn.dataset.mode;
        this.renderLeaderboard();
      });
    });

    const refreshLbBtn = document.getElementById('btn-refresh-lb');
    if (refreshLbBtn) {
      refreshLbBtn.addEventListener('click', () => {
        this.renderLeaderboard();
      });
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));

    const panels = document.querySelectorAll('.tab-panel');
    panels.forEach(p => p.classList.toggle('hidden', p.id !== `tab-${tabName}`));

    if (tabName === 'race') {
      if (this.raceState === 'COUNTDOWN' || this.raceState === 'RACING') {
        this.audio.startEngine();
      } else {
        this.audio.stopEngine();
      }
    } else {
      this.audio.stopEngine();
    }

    if (tabName === 'garage') {
      this.renderGarage();
    } else if (tabName === 'crates') {
      this.renderCrateShop();
    } else if (tabName === 'leaderboard') {
      this.renderLeaderboard();
    }
  }

  handleLaunchButton() {
    this.audio.resume();

    if (this.raceState === 'IDLE') {
      this.startCountdown();
    } else if (this.raceState === 'COUNTDOWN') {
      // Triggered before Green light! False start / Red light foul
      this.playerFoul = true;
      this.treeStep = 6; // Red foul light
      this.raceState = 'FINISHED';
      this.audio.stopEngine();
      this.audio.playTireSqueal(0.5);
      this.showFalseStart();
    } else if (this.raceState === 'RACING') {
      if (!this.playerReacted) {
        this.playerReacted = true;
        const now = performance.now();
        this.playerReactionTime = Number(((now - this.greenTimestamp) / 1000).toFixed(3));
        const reactLabel = document.getElementById('reaction-time-display');
        if (reactLabel) reactLabel.textContent = `${this.playerReactionTime}s`;
        this.audio.playTireSqueal(0.4);
      }
    } else if (this.raceState === 'FINISHED') {
      this.resetRace();
    }
  }

  startCountdown() {
    this.raceState = 'COUNTDOWN';
    this.countdownTimer = 0;
    this.treeStep = 1; // Pre-stage & Stage on
    this.playerReacted = false;
    this.playerFoul = false;
    this.playerReactionTime = null;
    this.audio.startEngine();

    const launchBtn = document.getElementById('btn-launch');
    if (launchBtn) {
      launchBtn.textContent = 'WAIT FOR GREEN...';
      launchBtn.classList.remove('btn-ready');
      launchBtn.classList.add('btn-waiting');
    }
  }

  resetRace() {
    this.raceState = 'IDLE';
    this.treeStep = 0;
    this.countdownTimer = 0;
    this.playerReacted = false;
    this.playerFoul = false;
    this.playerReactionTime = null;
    this.cameraX = 0;
    this.audio.stopEngine();

    this.playerPhysics.reset();
    this.opponentPhysics.reset();

    const launchBtn = document.getElementById('btn-launch');
    if (launchBtn) {
      launchBtn.textContent = '🚦 STAGE & START';
      launchBtn.classList.remove('btn-waiting', 'btn-racing');
      launchBtn.classList.add('btn-ready');
    }

    const reactLabel = document.getElementById('reaction-time-display');
    if (reactLabel) reactLabel.textContent = '--';
  }

  showFalseStart() {
    this.audio.stopEngine();
    const launchBtn = document.getElementById('btn-launch');
    if (launchBtn) {
      launchBtn.textContent = '❌ FALSE START (RED LIGHT) - TAP TO RESET';
      launchBtn.classList.remove('btn-waiting');
      launchBtn.classList.add('btn-danger');
    }
  }

  gameLoop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    if (this.isRunning) {
      requestAnimationFrame((t) => this.gameLoop(t));
    }
  }

  update(dt) {
    if (this.activeTab !== 'race') return;

    // Countdown Tree Logic
    if (this.raceState === 'COUNTDOWN') {
      this.countdownTimer += dt;
      if (this.countdownTimer >= 0.5 && this.treeStep === 1) {
        this.treeStep = 2; // Amber 1
        this.audio.playTreeBeep(false);
      } else if (this.countdownTimer >= 1.0 && this.treeStep === 2) {
        this.treeStep = 3; // Amber 2
        this.audio.playTreeBeep(false);
      } else if (this.countdownTimer >= 1.5 && this.treeStep === 3) {
        this.treeStep = 4; // Amber 3
        this.audio.playTreeBeep(false);
      } else if (this.countdownTimer >= 2.0 && this.treeStep === 4) {
        this.treeStep = 5; // GREEN!
        this.audio.playTreeBeep(true);
        this.greenTimestamp = performance.now();
        this.raceState = 'RACING';

        const launchBtn = document.getElementById('btn-launch');
        if (launchBtn) {
          launchBtn.textContent = '🔥 LAUNCH! (TAP / SPACE)';
          launchBtn.classList.remove('btn-waiting');
          launchBtn.classList.add('btn-racing');
        }
      }
    }

    // Racing Simulation
    if (this.raceState === 'RACING') {
      // Step player physics (begins rolling forward after reaction time or default bot reaction)
      if (this.playerReacted) {
        this.playerPhysics.step(dt);
      }

      // Step opponent ghost (with realistic 0.22s reaction time)
      const oppElapsedSinceGreen = (performance.now() - this.greenTimestamp) / 1000;
      if (oppElapsedSinceGreen >= 0.22) {
        this.opponentPhysics.step(dt);
      }

      // Update engine audio pitch based on player speed
      const playerSpeed = this.playerPhysics.v;
      const rpmRatio = Math.min(1.0, playerSpeed / 45);
      this.audio.updateEngine(rpmRatio);

      // Check for finish
      if (this.playerPhysics.finished && this.opponentPhysics.finished) {
        this.finishRace();
      }
    }
  }

  finishRace() {
    this.raceState = 'FINISHED';
    this.audio.stopEngine();
    const playerWon = (this.playerPhysics.elapsedTime || 99) < (this.opponentPhysics.elapsedTime || 99);

    let earnedPoints = 0;
    if (playerWon) {
      this.audio.playVictoryFanfare();
      const prizeCash = 120;
      this.inventory.addCash(prizeCash);
      earnedPoints = this.inventory.recordRaceResult(true, this.playerPhysics.elapsedTime, this.playerPhysics.trapSpeed, {
        oppPI: this.opponentCar?.pi || 350,
        playerPI: this.playerCar?.pi || 350,
        reactionTime: this.playerReactionTime
      });
    } else {
      earnedPoints = this.inventory.recordRaceResult(false, this.playerPhysics.elapsedTime, this.playerPhysics.trapSpeed, {
        oppPI: this.opponentCar?.pi || 350,
        playerPI: this.playerCar?.pi || 350,
        reactionTime: this.playerReactionTime
      });
    }
    this.lastRacePoints = earnedPoints;

    this.updateHUD();
    if (this.authManager) this.authManager.autoSave();

    const launchBtn = document.getElementById('btn-launch');
    if (launchBtn) {
      launchBtn.textContent = playerWon ? '🏆 YOU WON! TAP TO RACE AGAIN' : '🏁 RACE COMPLETE - TAP TO RESET';
      launchBtn.classList.remove('btn-racing');
      launchBtn.classList.add('btn-ready');
    }

    // Display Timeslip & Telemetry
    this.showRaceResultsModal(playerWon);
  }

  showRaceResultsModal(playerWon) {
    const modal = document.getElementById('race-results-modal');
    if (!modal) return;

    const title = document.getElementById('modal-results-title');
    if (title) {
      title.textContent = playerWon ? '🏆 VICTORY! SLIP SHEET WINNER' : '🥈 RUN COMPLETED';
      title.style.color = playerWon ? '#00f0ff' : '#ffd166';
    }

    const pET = this.playerPhysics.elapsedTime ? this.playerPhysics.elapsedTime.toFixed(3) + 's' : 'DNF';
    const oET = this.opponentPhysics.elapsedTime ? this.opponentPhysics.elapsedTime.toFixed(3) + 's' : 'DNF';

    const pTrap = this.playerPhysics.trapSpeed ?
      (this.units === 'imperial' ? (this.playerPhysics.trapSpeed * 2.23694).toFixed(1) + ' mph' : this.playerPhysics.trapSpeed.toFixed(1) + ' m/s') : '--';
    const oTrap = this.opponentPhysics.trapSpeed ?
      (this.units === 'imperial' ? (this.opponentPhysics.trapSpeed * 2.23694).toFixed(1) + ' mph' : this.opponentPhysics.trapSpeed.toFixed(1) + ' m/s') : '--';

    const slipHtml = `
      <div class="timeslip-grid">
        <div class="slip-col">
          <h4>YOUR RAT ROD</h4>
          <p>Reaction: <strong>${this.playerReactionTime ? this.playerReactionTime + 's' : '0.00s'}</strong></p>
          <p>60 ft: <strong>${this.playerPhysics.split60ft ? this.playerPhysics.split60ft.toFixed(3) + 's' : '--'}</strong></p>
          <p>330 ft: <strong>${this.playerPhysics.split330ft ? this.playerPhysics.split330ft.toFixed(3) + 's' : '--'}</strong></p>
          <p>1/8 mi (660 ft): <strong>${this.playerPhysics.split660ft ? this.playerPhysics.split660ft.toFixed(3) + 's' : '--'}</strong></p>
          <p class="slip-et">1/4 Mile ET: <strong>${pET}</strong></p>
          <p class="slip-trap">Trap Speed: <strong>${pTrap}</strong></p>
        </div>
        <div class="slip-divider">VS</div>
        <div class="slip-col">
          <h4>${this.opponentCar.name}</h4>
          <p>Driver: <em>${this.opponentCar.driver}</em></p>
          <p>60 ft: <strong>${this.opponentPhysics.split60ft ? this.opponentPhysics.split60ft.toFixed(3) + 's' : '--'}</strong></p>
          <p>330 ft: <strong>${this.opponentPhysics.split330ft ? this.opponentPhysics.split330ft.toFixed(3) + 's' : '--'}</strong></p>
          <p>1/8 mi (660 ft): <strong>${this.opponentPhysics.split660ft ? this.opponentPhysics.split660ft.toFixed(3) + 's' : '--'}</strong></p>
          <p class="slip-et">1/4 Mile ET: <strong>${oET}</strong></p>
          <p class="slip-trap">Trap Speed: <strong>${oTrap}</strong></p>
        </div>
      </div>
    `;

    const slipContainer = document.getElementById('modal-slip-container');
    if (slipContainer) slipContainer.innerHTML = slipHtml;

    // Load Telemetry into Graph
    this.telemetryViewer.setData(this.playerPhysics.telemetry, this.opponentPhysics.telemetry);

    modal.classList.remove('hidden');
  }

  render() {
    if (this.activeTab === 'garage') {
      this.renderGaragePreview();
      return;
    }
    if (this.activeTab !== 'race') return;
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.clientWidth || 800;
    const h = this.canvas.clientHeight || 450;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    // Track scaling: 1 meter = 4 pixels
    const ppm = 3.5;
    const playerX = this.playerPhysics.x * ppm;
    const opponentX = this.opponentPhysics.x * ppm;

    // Smooth camera tracking: center on leading car
    const leadX = Math.max(playerX, opponentX);
    const targetCamX = Math.max(0, leadX - w * 0.4);
    this.cameraX += (targetCamX - this.cameraX) * 0.12;

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // 1. Render Sky & Distant Sunset Parallax
    this._renderEnvironment(ctx, w, h);

    // 2. Render Drag Strip Track & Distance Marks
    this._renderTrack(ctx, w, h, ppm);

    // 3. Render Christmas Tree Staging Gantry
    this._renderChristmasTree(ctx, 45, 230);

    // 4. Render Opponent Car (Lane 2 - Upper Lane)
    const oppWheelAngle = (this.opponentPhysics.x / 0.5) % (Math.PI * 2);
    drawRatRodCanvas(ctx, this.opponentCar, 60 + opponentX, 260, {
      v: this.opponentPhysics.v,
      a: this.opponentPhysics.a,
      wheelAngle: oppWheelAngle,
      isSlipping: this.opponentPhysics.isSlipping,
      nitroActive: this.opponentPhysics.nitroActive
    }, { scale: 0.85, idle: this.raceState === 'IDLE' });

    // 5. Render Player Car (Lane 1 - Lower Lane)
    const pWheelAngle = (this.playerPhysics.x / 0.5) % (Math.PI * 2);
    drawRatRodCanvas(ctx, this.playerCar, 60 + playerX, 340, {
      v: this.playerPhysics.v,
      a: this.playerPhysics.a,
      wheelAngle: pWheelAngle,
      isSlipping: this.playerPhysics.isSlipping,
      nitroActive: this.playerPhysics.nitroActive
    }, { scale: 1.0, idle: this.raceState === 'IDLE' });

    ctx.restore();

    // 6. Live HUD overlay on Canvas (Speedometer, Acceleration, G-Force)
    this._renderCanvasHUD(ctx, w, h);
  }

  _renderEnvironment(ctx, w, h) {
    const stripEnd = 402.336 * 3.5 + 400;

    // Sunset gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
    skyGrad.addColorStop(0, '#1a1423');
    skyGrad.addColorStop(0.5, '#3d1a24');
    skyGrad.addColorStop(1, '#9b4b2a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(this.cameraX - 100, 0, w + 200, 200);

    // Distant mountain ridge
    ctx.fillStyle = '#17111e';
    ctx.beginPath();
    ctx.moveTo(this.cameraX - 100, 200);
    for (let x = this.cameraX - 100; x < this.cameraX + w + 100; x += 120) {
      ctx.lineTo(x + 60, 140 + Math.sin(x * 0.005) * 30);
    }
    ctx.lineTo(this.cameraX + w + 100, 200);
    ctx.closePath();
    ctx.fill();

    // Grandstands & Cheering crowd banner
    ctx.fillStyle = '#2c223b';
    ctx.fillRect(this.cameraX - 100, 160, w + 200, 40);

    // Decorative festival bunting / flags
    for (let f = 0; f < stripEnd; f += 60) {
      ctx.fillStyle = f % 120 === 0 ? '#ff7b00' : '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(f, 150);
      ctx.lineTo(f + 25, 150);
      ctx.lineTo(f + 12, 165);
      ctx.closePath();
      ctx.fill();
    }
  }

  _renderTrack(ctx, w, h, ppm) {
    const trackStart = 0;
    const trackEnd = 402.336 * ppm + 400;

    // Safety concrete barrier
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(trackStart - 50, 195, trackEnd + 100, 15);
    ctx.fillStyle = '#343a40';
    ctx.fillRect(trackStart - 50, 210, trackEnd + 100, 4);

    // Asphalt road surface
    ctx.fillStyle = '#1a1c23';
    ctx.fillRect(trackStart - 50, 214, trackEnd + 100, 175);

    // Lane divider line (dashed white)
    ctx.strokeStyle = '#f8f9fa';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([16, 16]);
    ctx.beginPath();
    ctx.moveTo(trackStart - 50, 295);
    ctx.lineTo(trackEnd + 50, 295);
    ctx.stroke();
    ctx.setLineDash([]);

    // Track Distance Markers
    const markers = [
      { d: 18.288, label: '60 FT' },
      { d: 100.584, label: '330 FT' },
      { d: 201.168, label: '660 FT (1/8 MI)' },
      { d: 304.8, label: '1000 FT' },
      { d: 402.336, label: '1/4 MILE FINISH' }
    ];

    markers.forEach(m => {
      const mx = 60 + m.d * ppm;

      // Track hash line
      ctx.strokeStyle = m.d === 402.336 ? '#ffbe0b' : '#6c757d';
      ctx.lineWidth = m.d === 402.336 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(mx, 214);
      ctx.lineTo(mx, 389);
      ctx.stroke();

      // Signboard atop track
      ctx.fillStyle = m.d === 402.336 ? '#ffbe0b' : '#343a40';
      ctx.fillRect(mx - 35, 175, 70, 20);
      ctx.fillStyle = m.d === 402.336 ? '#111' : '#ffd166';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, mx, 189);
    });

    // Checkered Finish Line Overhead Gantry (at 1/4 mile)
    const finishX = 60 + 402.336 * ppm;
    ctx.fillStyle = '#e5e5e5';
    ctx.fillRect(finishX - 8, 120, 16, 95);
    // Checkered banner
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 6; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#000' : '#fff';
        ctx.fillRect(finishX - 30 + col * 10, 120 + row * 10, 10, 10);
      }
    }
    ctx.fillStyle = '#ff0055';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("FINISH", finishX, 114);
  }

  _renderChristmasTree(ctx, x, y) {
    // Tree vertical pole
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(x - 6, y - 85, 12, 110);

    // Bulbs (Stage, Amber1, Amber2, Amber3, Green, Red)
    const bulbs = [
      { yOffset: -75, active: this.treeStep >= 1, color: '#ffd166' }, // Pre-Stage / Stage
      { yOffset: -58, active: this.treeStep >= 2 && this.treeStep <= 4, color: '#ff9e00' }, // Amber 1
      { yOffset: -41, active: this.treeStep >= 3 && this.treeStep <= 4, color: '#ff9e00' }, // Amber 2
      { yOffset: -24, active: this.treeStep === 4, color: '#ff9e00' }, // Amber 3
      { yOffset: -7, active: this.treeStep === 5, color: '#00f0ff' }, // Green!
      { yOffset: 10, active: this.treeStep === 6, color: '#ff0055' } // Red Foul
    ];

    bulbs.forEach(b => {
      // Left bulb
      ctx.fillStyle = b.active ? b.color : '#333';
      ctx.beginPath(); ctx.arc(x - 14, y + b.yOffset, 6, 0, Math.PI * 2); ctx.fill();
      // Right bulb
      ctx.beginPath(); ctx.arc(x + 14, y + b.yOffset, 6, 0, Math.PI * 2); ctx.fill();

      // Glow effect if active
      if (b.active) {
        ctx.fillStyle = b.color;
        ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.arc(x - 14, y + b.yOffset, 12, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 14, y + b.yOffset, 12, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    });
  }

  _renderCanvasHUD(ctx, w, h) {
    const pState = this.playerPhysics.getState();
    const speed = this.units === 'imperial' ? (pState.vMph).toFixed(1) + ' MPH' : (pState.v).toFixed(1) + ' M/S';
    const accel = this.units === 'imperial' ? (pState.a * 3.28084).toFixed(1) + ' ft/s²' : (pState.a).toFixed(1) + ' m/s²';

    // HUD Glass Panel Top Left
    ctx.fillStyle = 'rgba(18, 21, 28, 0.85)';
    ctx.strokeStyle = '#3b4252';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(15, 15, 240, 80, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SPEED: ${speed}`, 28, 40);

    ctx.fillStyle = '#ffd166';
    ctx.font = '12px monospace';
    ctx.fillText(`ACCEL (F/m): ${accel}`, 28, 62);
    ctx.fillText(`FORCE: ${pState.fNet} N | MASS: ${this.playerCar.mass} kg`, 28, 80);

    // Traction Slip Alert
    if (pState.isSlipping) {
      ctx.fillStyle = '#ff3366';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`⚠️ WHEEL SLIP! (F_drive > μ·m·g)`, 28, 110);
    }
  }

  // Render Live 2D Car Preview on Garage Lift
  renderGaragePreview() {
    const canvas = document.getElementById('garagePreviewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Garage Workshop Spotlight & Atmospheric Vignette
    const spotGrad = ctx.createRadialGradient(w / 2, 25, 10, w / 2, 90, 140);
    spotGrad.addColorStop(0, 'rgba(255, 190, 11, 0.18)');
    spotGrad.addColorStop(0.6, 'rgba(255, 190, 11, 0.05)');
    spotGrad.addColorStop(1, 'rgba(14, 17, 25, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle workshop brick/panel lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 15; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 145); ctx.stroke();
    }

    // 2. Hydraulic Lift Stand
    const beamY = 138;
    // Hydraulic Ground Base & Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(w / 2, 175, 90, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Center Hydraulic Ram & Chrome Piston
    ctx.fillStyle = '#222530';
    ctx.fillRect(w / 2 - 14, beamY + 8, 28, 35);
    ctx.strokeStyle = '#12121c';
    ctx.lineWidth = 2;
    ctx.strokeRect(w / 2 - 14, beamY + 8, 28, 35);
    // Chrome ram ring
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(w / 2 - 16, beamY + 6, 32, 4);

    // Heavy Yellow Industrial Lift Beam with Hazard Stripes
    ctx.fillStyle = '#ffbe0b';
    ctx.fillRect(w / 2 - 115, beamY, 230, 8);
    ctx.strokeRect(w / 2 - 115, beamY, 230, 8);
    // Hazard Chevrons on Beam
    ctx.fillStyle = '#14141c';
    for (let bx = w / 2 - 110; bx < w / 2 + 110; bx += 20) {
      ctx.beginPath();
      ctx.moveTo(bx, beamY);
      ctx.lineTo(bx + 6, beamY);
      ctx.lineTo(bx + 2, beamY + 8);
      ctx.lineTo(bx - 4, beamY + 8);
      ctx.closePath();
      ctx.fill();
    }

    // Heavy Rubber Lift Pads under Tires
    // Rear pad
    ctx.fillStyle = '#1e1f29';
    ctx.fillRect(w / 2 - 74, beamY - 4, 38, 5);
    ctx.strokeRect(w / 2 - 74, beamY - 4, 38, 5);
    // Front riser pad (accommodates hot rod rake stance)
    ctx.fillStyle = '#1e1f29';
    ctx.fillRect(w / 2 + 45, beamY - 9, 32, 10);
    ctx.strokeRect(w / 2 + 45, beamY - 9, 32, 10);

    // 3. Complete Assembled Rat Rod Car with all 6 equipped parts
    // Perfectly grounded on the lift pads!
    drawRatRodCanvas(ctx, this.playerCar, w / 2, 104, {
      v: 0,
      a: 0,
      wheelAngle: 0,
      isSlipping: false,
      nitroActive: false
    }, { scale: 1.25, idle: true });
  }

  // --- GARAGE & CUSTOMIZER RENDERING ---
  renderGarage() {
    this.renderGaragePreview();

    const statsContainer = document.getElementById('garage-specs-sheet');
    if (statsContainer) {
      this.playerCar.recomputeStats();
      const p = this.playerCar;
      statsContainer.innerHTML = `
        <div class="spec-row">
          <span>Total Mass (m):</span>
          <strong>${p.mass} kg</strong>
        </div>
        <div class="spec-row">
          <span>Engine Drive Force (F):</span>
          <strong>${p.peakForce} N</strong>
        </div>
        <div class="spec-row">
          <span>Max Acceleration (a = F/m):</span>
          <strong style="color:#00f0ff">${p.maxTheoreticalAccel} m/s²</strong>
        </div>
        <div class="spec-row">
          <span>Tire Static Grip (μ):</span>
          <strong>${p.mu} (Grip Limit: ${p.staticGripLimitForce} N)</strong>
        </div>
        <div class="spec-row">
          <span>Drag Area (CdA):</span>
          <strong>${p.cdA} m²</strong>
        </div>
        <div class="spec-row">
          <span>Traction Balance:</span>
          <strong style="color:${p.burnoutRisk ? '#ff5555' : '#00f0ff'}">
            ${p.burnoutRisk ? '⚠️ High Wheelspin Risk' : '✅ Full Traction Hook'}
          </strong>
        </div>
      `;
    }

    // Render Slots & Inventory Parts
    const slots = ['chassis', 'engines', 'wheels', 'aero', 'exhaust', 'charms'];
    slots.forEach(slot => {
      const listEl = document.getElementById(`inv-list-${slot}`);
      if (!listEl) return;
      listEl.innerHTML = '';

      const ownedInSlot = this.inventory.owned[slot] || {};
      const catalog = RAT_ROD_ASSETS[slot];
      const carSlotKey = (slot === 'engines' ? 'engine' : (slot === 'charms' ? 'charm' : slot));

      Object.keys(ownedInSlot).forEach(partId => {
        const part = catalog[partId];
        if (!part) return;
        const entry = ownedInSlot[partId];
        const isEquipped = (this.playerCar.parts[carSlotKey] === partId);

        const card = document.createElement('div');
        card.className = `inv-part-card rarity-${part.rarity} ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="part-header">
            <span class="part-name">${part.name}</span>
            <span class="part-lvl">Lvl ${entry.level}</span>
          </div>
          <div class="part-svg-wrap">
            ${RatRodSVG.getPartSVG(part, 80)}
          </div>
          <div class="part-count">Copies: ${entry.count}</div>
          <div class="part-actions">
            <button class="btn btn-sm ${isEquipped ? 'btn-equipped' : 'btn-equip'}">
              ${isEquipped ? 'Equipped' : 'Equip'}
            </button>
            ${entry.count >= 2 && entry.level < 3 ? `<button class="btn btn-sm btn-upgrade">Upgrade</button>` : ''}
            ${entry.count > 1 ? `<button class="btn btn-sm btn-scrap">Scrap</button>` : ''}
          </div>
        `;

        // Equip
        card.querySelector('.btn-equip')?.addEventListener('click', () => {
          this.playerCar.equip(carSlotKey, partId, entry.level);
          this.syncPlayerCarPhysics();
          this.renderGarage();
          if (this.authManager) this.authManager.autoSave();
        });

        // Upgrade / Fuse
        card.querySelector('.btn-upgrade')?.addEventListener('click', () => {
          const res = this.inventory.upgradePart(slot, partId);
          alert(res.msg);
          if (res.success) {
            if (isEquipped) {
              this.playerCar.levels[carSlotKey] = res.newLevel;
            }
            this.syncPlayerCarPhysics();
            this.renderGarage();
            this.updateHUD();
            if (this.authManager) this.authManager.autoSave();
          }
        });

        // Scrap
        card.querySelector('.btn-scrap')?.addEventListener('click', () => {
          const res = this.inventory.scrapPart(slot, partId);
          alert(res.msg);
          if (res.success) {
            this.syncPlayerCarPhysics();
            this.renderGarage();
            this.updateHUD();
            if (this.authManager) this.authManager.autoSave();
          }
        });

        listEl.appendChild(card);
      });
    });
  }

  // --- CRATE SHOP RENDERING ---
  renderCrateShop() {
    const shopContainer = document.getElementById('crate-shop-container');
    if (!shopContainer) return;
    shopContainer.innerHTML = '';

    Object.values(CRATE_TIERS).forEach(crate => {
      const card = document.createElement('div');
      card.className = 'crate-tier-card';
      card.innerHTML = `
        <div class="crate-icon">${crate.icon}</div>
        <h3>${crate.name}</h3>
        <p class="crate-desc">${crate.description}</p>
        <div class="crate-cost">$${crate.cost} Cash</div>
        <button class="btn primary btn-buy-crate" data-crate="${crate.id}">Open Crate</button>
      `;

      card.querySelector('.btn-buy-crate').addEventListener('click', () => {
        if (this.inventory.spendCash(crate.cost)) {
          this.audio.playCratePop();
          const results = this.crates.openCrate(crate.id);
          this.showCrateUnboxingModal(crate, results);
          this.updateHUD();
          if (this.authManager) this.authManager.autoSave();
        } else {
          alert(`Not enough funds! Complete calculations in the Dyno Lab to earn more cash.`);
        }
      });

      shopContainer.appendChild(card);
    });
  }

  showCrateUnboxingModal(crate, results) {
    const modal = document.getElementById('crate-unboxing-modal');
    if (!modal) return;

    const cardsContainer = document.getElementById('unboxing-cards-row');
    cardsContainer.innerHTML = '';

    results.forEach((res, idx) => {
      const card = document.createElement('div');
      card.className = `unboxing-card rarity-${res.part.rarity}`;
      card.innerHTML = `
        <div class="card-badge">${res.part.rarity.toUpperCase()}</div>
        ${RatRodSVG.getPartSVG(res.part, 110)}
        <h4>${res.part.name}</h4>
        <p class="card-lore">${res.part.lore}</p>
        <div class="card-status">${res.isNew ? '✨ NEW PART!' : '🔄 DUPLICATE'}</div>
      `;
      cardsContainer.appendChild(card);

      setTimeout(() => {
        this.audio.playCardTwinkle(res.part.rarity);
      }, idx * 250);
    });

    modal.classList.remove('hidden');

    const closeBtn = document.getElementById('btn-close-unboxing');
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.classList.add('hidden');
        this.renderGarage();
      };
    }
  }

  // --- DYNO LAB PROVING GROUNDS ---
  loadNextDynoChallenge() {
    this.isSubmittingDyno = false;
    const challenge = this.challenges.generateChallenge();
    const titleEl = document.getElementById('dyno-challenge-title');
    const badgeEl = document.getElementById('dyno-formula-badge');
    const promptEl = document.getElementById('dyno-prompt-text');
    const visualEl = document.getElementById('dyno-visual-container');
    const unitEl = document.getElementById('dyno-input-unit');
    const feedbackEl = document.getElementById('dyno-feedback-box');
    const inputEl = document.getElementById('dyno-input-val');

    if (titleEl) titleEl.textContent = challenge.title;
    if (badgeEl) badgeEl.textContent = challenge.badge;
    if (promptEl) promptEl.innerHTML = challenge.prompt;
    if (unitEl) unitEl.textContent = challenge.unit;
    if (feedbackEl) feedbackEl.innerHTML = '';
    if (inputEl) {
      inputEl.value = '';
      inputEl.disabled = false;
      inputEl.focus();
    }

    if (visualEl) {
      visualEl.innerHTML = challenge.svg || challenge.tableHtml || '';
    }

    const nextBtn = document.getElementById('btn-dyno-next');
    if (nextBtn) nextBtn.classList.add('hidden');
    const submitBtn = document.getElementById('btn-dyno-submit');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('hidden');
    }
  }

  submitDynoAnswer() {
    if (this.isSubmittingDyno) return;

    // If current question was already evaluated, advance rather than re-submitting
    const current = this.challenges.currentChallenge;
    if (!current || current.answered) {
      this.loadNextDynoChallenge();
      return;
    }

    const inputEl = document.getElementById('dyno-input-val');
    if (!inputEl) return;
    const val = inputEl.value;
    if (val === '' || isNaN(Number(val))) return;

    this.isSubmittingDyno = true;
    inputEl.disabled = true;

    const submitBtn = document.getElementById('btn-dyno-submit');
    const nextBtn = document.getElementById('btn-dyno-next');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('hidden');
    }
    if (nextBtn) {
      nextBtn.classList.remove('hidden');
    }

    const res = this.challenges.checkAnswer(val);
    if (res.alreadyAnswered) {
      this.isSubmittingDyno = false;
      return;
    }

    const feedbackEl = document.getElementById('dyno-feedback-box');

    if (res.success) {
      this.audio.playCashSound();
      this.inventory.addCash(res.earnedCash);
      const dynoPts = 15 + Math.min(20, (res.streak - 1) * 5);
      this.inventory.addScore(dynoPts);
      this.updateHUD();

      feedbackEl.innerHTML = `
        <div class="feedback-success">
          <h3>✅ Correct! +$${res.earnedCash} Cash & +${dynoPts} Driver Points!</h3>
          ${res.multiplier > 1 ? `<p class="streak-badge">🔥 ${res.streak} Answer Streak (${res.multiplier}x Cash Multiplier!)</p>` : ''}
          <div class="solution-steps">
            ${res.steps.map(s => `<p>${s}</p>`).join('')}
          </div>
        </div>
      `;
    } else {
      feedbackEl.innerHTML = `
        <div class="feedback-error">
          <h3>❌ Not Quite! (Expected: ${res.expected})</h3>
          <div class="solution-steps">
            ${res.steps.map(s => `<p>${s}</p>`).join('')}
          </div>
        </div>
      `;
    }

    if (this.authManager) this.authManager.autoSave();
    this.isSubmittingDyno = false;

    if (nextBtn) {
      nextBtn.focus();
    }
  }

  updateHUD() {
    const bankEls = document.querySelectorAll('.hud-bank-val');
    bankEls.forEach(el => {
      el.textContent = `$${this.inventory.bankCash}`;
    });

    const scoreEls = document.querySelectorAll('.hud-score-val');
    scoreEls.forEach(el => {
      el.textContent = `${(this.inventory.driverScore || 1000).toLocaleString()} pts`;
    });

    const carClassEls = document.querySelectorAll('.hud-car-class-val');
    carClassEls.forEach(el => {
      if (this.playerCar) {
        el.textContent = `Class ${this.playerCar.carClass} • ${this.playerCar.pi} PI`;
        el.style.color = this.playerCar.classColor || '#00f0ff';
      }
    });

    const streakEl = document.getElementById('hud-streak-val');
    if (streakEl) streakEl.textContent = `${this.challenges.streak}x`;

    const recordEl = document.getElementById('hud-record-val');
    if (recordEl) {
      recordEl.textContent = this.inventory.bestEt ? `${this.inventory.bestEt.toFixed(3)}s` : '--';
    }

    this.updateMatchupBadge();
  }

  // --- MATCHMAKING & LEADERBOARD METHODS ---

  populateOpponentDropdown() {
    const oppSelect = document.getElementById('opponent-select');
    if (!oppSelect) return;
    oppSelect.innerHTML = '';
    this.opponentRoster.forEach((r, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      const pi = r.pi || r.car.pi;
      const carClass = r.carClass || r.car.carClass;
      opt.textContent = `[Class ${carClass} • ${pi} PI] ${r.name} (${r.driver})`;
      oppSelect.appendChild(opt);
    });
    oppSelect.value = this.opponentIndex;
    this.updateMatchupBadge();
  }

  updateMatchupBadge() {
    const badge = document.getElementById('matchup-diff-badge');
    if (!badge || !this.playerCar || !this.opponentCar) return;

    const pPI = this.playerCar.pi || 350;
    const oPI = this.opponentCar.pi || 350;
    const diff = oPI - pPI;

    if (Math.abs(diff) <= 40) {
      badge.className = 'matchup-badge matchup-fair';
      badge.innerHTML = `⚖️ FAIR MATCH (Δ ${Math.abs(diff)} PI)`;
      badge.title = 'Closely matched speed & traction! A pure driver skill showdown.';
    } else if (diff > 40) {
      badge.className = 'matchup-badge matchup-underdog';
      badge.innerHTML = `🔥 UNDERDOG (+${diff} PI)`;
      badge.title = `Tough rival! Winning earns high underdog bonus driver points.`;
    } else {
      badge.className = 'matchup-badge matchup-advantage';
      badge.innerHTML = `🟢 ADVANTAGE (${diff} PI)`;
      badge.title = 'Your vehicle has superior power and traction in this matchup.';
    }
  }

  autoMatchOpponent(notify = false) {
    if (!this.playerCar || !this.opponentRoster || !this.opponentRoster.length) return;
    const pPI = this.playerCar.pi || 350;

    // Find rival whose PI is closest to the player's PI
    let bestIdx = 0;
    let minDiff = Infinity;

    this.opponentRoster.forEach((r, idx) => {
      const oPI = r.pi || r.car.pi || 350;
      const diff = Math.abs(oPI - pPI);
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = idx;
      }
    });

    this.opponentIndex = bestIdx;
    this.opponentCar = this.opponentRoster[bestIdx].car;
    const oppSelect = document.getElementById('opponent-select');
    if (oppSelect) oppSelect.value = bestIdx;

    this.syncOpponentPhysics();
    this.updateMatchupBadge();
    this.resetRace();

    if (notify) {
      const rival = this.opponentRoster[bestIdx];
      const badge = document.getElementById('matchup-diff-badge');
      if (badge) {
        badge.style.transform = 'scale(1.2)';
        setTimeout(() => badge.style.transform = 'scale(1)', 300);
      }
    }
  }

  getBaselineLeaderboard() {
    const list = [];
    const inv = this.inventory;
    const pc = this.playerCar;
    const auth = this.authManager;
    const myName = (auth && auth.studentName) ? auth.studentName : "You";
    const myId = (auth && auth.studentId) ? auth.studentId : "local_racer";

    list.push({
      id: myId,
      name: myName + " (You)",
      driver: myName,
      carName: pc ? pc.name : "Your Rat Rod",
      driverScore: inv ? (inv.driverScore || 1000) : 1000,
      winStreak: inv ? (inv.winStreak || 0) : 0,
      racesWon: inv ? (inv.racesWon || 0) : 0,
      racesTotal: inv ? (inv.racesTotal || 0) : 0,
      bestEt: inv ? inv.bestEt : null,
      bestTrapSpeed: inv ? inv.bestTrapSpeed : null,
      carPi: pc ? pc.pi : 350,
      carClass: pc ? pc.carClass : 'D',
      shareCode: pc ? pc.toShareCode() : "",
      carData: pc ? pc.toJSON() : null,
      isCurrentPlayer: true,
      isGhost: false
    });

    const ghostRoster = (typeof STUDENT_GHOST_ROSTER !== 'undefined' ? STUDENT_GHOST_ROSTER : window.STUDENT_GHOST_ROSTER) || [];
    ghostRoster.forEach((g, idx) => {
      const gCar = g.car;
      const gPi = gCar ? (gCar.pi || 350) : 350;
      const gClass = gCar ? (gCar.carClass || 'D') : 'D';
      const simET = gPi >= 900 ? 9.24 : (gPi >= 750 ? 11.45 : (gPi >= 600 ? 13.82 : (gPi >= 450 ? 15.60 : 17.95)));
      const simSpeed = gPi >= 900 ? 71.5 : (gPi >= 750 ? 59.2 : (gPi >= 600 ? 49.5 : (gPi >= 450 ? 43.1 : 38.0)));
      const simScore = gPi >= 900 ? 3200 : (gPi >= 750 ? 2450 : (gPi >= 600 ? 1850 : (gPi >= 450 ? 1420 : 1100)));
      const simWins = gPi >= 900 ? 28 : (gPi >= 750 ? 19 : (gPi >= 600 ? 12 : (gPi >= 450 ? 7 : 3)));

      list.push({
        id: `ghost_${idx}`,
        name: g.driver,
        driver: g.driver,
        carName: g.name,
        driverScore: simScore,
        winStreak: Math.floor(simWins / 4),
        racesWon: simWins,
        racesTotal: simWins + 3,
        bestEt: simET,
        bestTrapSpeed: simSpeed,
        carPi: gPi,
        carClass: gClass,
        shareCode: gCar ? gCar.toShareCode() : "",
        carObj: gCar,
        isCurrentPlayer: false,
        isGhost: true
      });
    });

    return list;
  }

  async renderLeaderboard() {
    const tableBody = document.getElementById('leaderboard-table-body');
    const loadingEl = document.getElementById('leaderboard-loading');
    if (!tableBody) return;

    // 1. Instantly display cached records or baseline so board is NEVER blank
    if (!this._cachedLeaderboard || !this._cachedLeaderboard.length) {
      this._cachedLeaderboard = this.getBaselineLeaderboard();
    }
    this._drawLeaderboardTable(this._cachedLeaderboard);

    if (loadingEl) loadingEl.classList.remove('hidden');

    let records = [];
    if (this.authManager && typeof this.authManager.fetchLeaderboard === 'function') {
      try {
        records = await this.authManager.fetchLeaderboard();
      } catch (e) {
        console.warn("Leaderboard fetch error:", e);
      }
    }

    if (loadingEl) loadingEl.classList.add('hidden');

    if (records && records.length) {
      this._cachedLeaderboard = records;
      this._drawLeaderboardTable(this._cachedLeaderboard);
    }
  }

  _drawLeaderboardTable(rawRecords) {
    const tableBody = document.getElementById('leaderboard-table-body');
    if (!tableBody) return;

    const records = [...rawRecords];

    // Sort according to active leaderboard tab
    if (this.leaderboardMode === 'et') {
      records.sort((a, b) => {
        const etA = (a.bestEt && a.bestEt > 0) ? a.bestEt : 999;
        const etB = (b.bestEt && b.bestEt > 0) ? b.bestEt : 999;
        if (etA !== etB) return etA - etB;
        return (b.driverScore || 1000) - (a.driverScore || 1000);
      });
    } else {
      records.sort((a, b) => {
        const scoreDiff = (b.driverScore || 1000) - (a.driverScore || 1000);
        if (scoreDiff !== 0) return scoreDiff;
        const etA = (a.bestEt && a.bestEt > 0) ? a.bestEt : 999;
        const etB = (b.bestEt && b.bestEt > 0) ? b.bestEt : 999;
        return etA - etB;
      });
    }

    tableBody.innerHTML = '';

    if (records.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:28px; color:var(--text-muted);">No leaderboard records recorded yet. Set the first record!</td></tr>`;
      return;
    }

    records.forEach((r, idx) => {
      const rank = idx + 1;
      let rankBadge = `#${rank}`;
      let rankClass = 'rank-normal';
      if (rank === 1) { rankBadge = '🥇 1st'; rankClass = 'rank-gold'; }
      else if (rank === 2) { rankBadge = '🥈 2nd'; rankClass = 'rank-silver'; }
      else if (rank === 3) { rankBadge = '🥉 3rd'; rankClass = 'rank-bronze'; }

      const isYou = r.isCurrentPlayer;
      const row = document.createElement('tr');
      row.className = `lb-row ${isYou ? 'lb-row-you' : ''}`;

      const etDisplay = (r.bestEt && r.bestEt > 0) ? `${Number(r.bestEt).toFixed(3)}s` : '--';
      const speedMph = (r.bestTrapSpeed && r.bestTrapSpeed > 0) ? (r.bestTrapSpeed * 2.23694).toFixed(1) + ' mph' : '--';
      const winRate = r.racesTotal > 0 ? Math.round((r.racesWon / r.racesTotal) * 100) + '%' : '--';

      row.innerHTML = `
        <td class="lb-cell-rank"><span class="rank-pill ${rankClass}">${rankBadge}</span></td>
        <td class="lb-cell-driver">
          <strong>${r.name}</strong>
          ${isYou ? '<span class="you-badge">YOU</span>' : ''}
          ${r.isGhost ? '<span class="ghost-badge">BENCHMARK</span>' : ''}
        </td>
        <td class="lb-cell-car">
          <span>${r.carName}</span>
          <span class="car-class-badge class-${(r.carClass || 'D').toLowerCase()}">Class ${r.carClass || 'D'} • ${r.carPi || 350} PI</span>
        </td>
        <td class="lb-cell-score"><strong>${(r.driverScore || 1000).toLocaleString()}</strong> pts</td>
        <td class="lb-cell-et">${etDisplay}</td>
        <td class="lb-cell-speed">${speedMph}</td>
        <td class="lb-cell-record">${r.racesWon}W / ${r.racesTotal}R (${winRate})</td>
        <td class="lb-cell-action" style="text-align:center;">
          ${!isYou ? `<button class="btn btn-sm btn-race-ghost" data-id="${r.id}">⚔️ Race Ghost</button>` : `<span class="you-indicator">★ Your Car</span>`}
        </td>
      `;

      const raceBtn = row.querySelector('.btn-race-ghost');
      if (raceBtn) {
        raceBtn.addEventListener('click', () => {
          this.stageRivalFromLeaderboard(r);
        });
      }

      tableBody.appendChild(row);
    });
  }

  stageRivalFromLeaderboard(rivalRecord) {
    let opponentCar = null;
    if (rivalRecord.carObj) {
      opponentCar = rivalRecord.carObj;
    } else if (rivalRecord.shareCode) {
      opponentCar = RatRodCar.fromShareCode(rivalRecord.shareCode);
    } else if (rivalRecord.carData && rivalRecord.carData.parts) {
      opponentCar = new RatRodCar({
        name: rivalRecord.carName,
        driver: rivalRecord.driver,
        parts: rivalRecord.carData.parts,
        levels: rivalRecord.carData.levels
      });
    }

    if (!opponentCar) {
      alert("Unable to stage this rival build.");
      return;
    }

    this.opponentCar = opponentCar;
    this.syncOpponentPhysics();
    this.updateMatchupBadge();
    this.resetRace();
    this.switchTab('race');

    const launchBtn = document.getElementById('btn-launch');
    if (launchBtn) {
      launchBtn.textContent = `⚔️ STAGE: VS ${rivalRecord.driver.toUpperCase()}`;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.ratRodGame = new RatRodGame();
});

window.RatRodGame = RatRodGame;

/**
 * Rat Rod Racers - Main Game Controller & Orchestrator
 * Based on rat_rod_part_balance_synergy_design_document.md
 * Manages game loop, 5 Track Environments, Jalopy Budget Cap (20 pts),
 * Archetype matrix, 5-slot customizer, mystery crates, and dyno proving grounds.
 */

if (typeof formatStudentDriverName === 'undefined') {
  var formatStudentDriverName = function(rawName, isGhost = false) {
    if (isGhost) return rawName;
    if (!rawName || typeof rawName !== 'string') return 'Racer';
    let str = rawName.trim();
    if (!str) return 'Racer';
    let suffix = '';
    const parenMatch = str.match(/\s*(\([^)]+\))\s*$/);
    if (parenMatch) {
      suffix = ' ' + parenMatch[1].trim();
      str = str.replace(/\s*(\([^)]+\))\s*$/, '').trim();
    }
    if (str.includes('@')) {
      const emailPrefix = str.split('@')[0];
      if (emailPrefix.includes('.')) {
        const parts = emailPrefix.split('.').filter(Boolean);
        const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
        return `${first} ${lastInitial}.${suffix}`;
      } else {
        str = emailPrefix;
      }
    }
    if (str.includes(',')) {
      const commaParts = str.split(',').map(s => s.trim()).filter(Boolean);
      if (commaParts.length >= 2) {
        const lastName = commaParts[0];
        const firstNamePart = commaParts[1];
        const firstTokens = firstNamePart.split(/\s+/).filter(Boolean);
        const first = firstTokens[0] || '';
        const lastInitial = lastName.charAt(0).toUpperCase();
        if (first && lastInitial) return `${first} ${lastInitial}.${suffix}`;
      }
    }
    const tokens = str.split(/\s+/).filter(Boolean);
    if (tokens.length <= 1) return `${tokens[0] || 'Racer'}${suffix}`;
    const lastToken = tokens[tokens.length - 1];

    // If last token is purely numeric (e.g. 'Racer 42'), do not abbreviate as an initial
    if (/^\d+$/.test(lastToken)) {
      return `${tokens.join(' ')}${suffix}`;
    }

    if (/^[A-Za-z]\.?$/.test(lastToken)) {
      const cleanInitial = lastToken.replace('.', '').toUpperCase();
      const rest = tokens.slice(0, -1).join(' ');
      return `${rest} ${cleanInitial}.${suffix}`;
    }
    if (/^[A-Za-z]/.test(lastToken)) {
      const firstName = tokens[0];
      const lastInitial = lastToken.charAt(0).toUpperCase();
      return `${firstName} ${lastInitial}.${suffix}`;
    }
    return `${tokens.join(' ')}${suffix}`;
  };
}

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

    // Track Environment Selection (Section 5)
    this.selectedTrack = 'airfield'; // 'airfield', 'bonneville', 'dirt_oval', 'quarry', 'mountain'

    // Player car with 5 slots
    this.playerCar = new RatRodCar({
      name: "Rusty Rocket",
      driver: "You",
      number: 77
    });

    // Opponent car & roster
    this.opponentRoster = STUDENT_GHOST_ROSTER;
    this.opponentIndex = 0;
    this.opponentCar = this.opponentRoster[0].car;

    // Physics simulation engines
    this.playerPhysics = new RatRodPhysics();
    this.opponentPhysics = new RatRodPhysics();

    // Telemetry viewer
    this.telemetryViewer = new TelemetryViewer('telemetryCanvas');

    // Racing State
    this.activeTab = 'race'; // 'race', 'garage', 'crates', 'dyno', 'leaderboard'
    if (typeof document !== 'undefined' && document.body) {
      document.body.dataset.activeTab = this.activeTab;
    }
    this.raceState = 'IDLE'; // 'IDLE', 'COUNTDOWN', 'RACING', 'FINISHED'
    this.countdownTimer = 0;
    this.treeStep = 0; // 0: off, 1: stage, 2: amber1, 3: amber2, 4: amber3, 5: green, 6: red
    this.greenTimestamp = 0;
    this.playerReacted = false;
    this.playerFoul = false;
    this.playerReactionTime = null;
    this.lastTime = 0;
    this.cameraX = 0;

    // Units toggle
    this.units = 'imperial'; // 'imperial' (mph / ft) or 'metric' (m/s / m)

    this.leaderboardMode = 'points';
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
    const c = this.playerCar;
    this.playerPhysics.configure({
      mass: c.mass,
      frontBias: c.frontWeightBias,
      hCG: c.hCG,
      wheelbase: c.wheelbase,
      peakForce: c.peakForce,
      powerBand: c.powerBand,
      blowerSurge: c.blowerSurge,
      turboLag: c.turboLag,
      boostCreep: c.boostCreep,
      tractorChug: c.tractorChug,
      immuneToHeat: c.immuneToHeat,
      ignoreDebris: c.ignoreDebris,
      heatRate: c.heatRate,
      critTemp: c.critTemp,
      heatCapacity: c.heatCapacity,
      radiatorArea: c.radiatorArea,
      grilleAirflow: c.grilleAirflow,
      suspTravel: c.suspTravel,
      suspKappa: c.suspKappa,
      roughnessTol: c.roughnessTol,
      mu: c.mu,
      tireType: c.tireType,
      cdA: c.cdA
    });

    const trackData = TRACK_ENVIRONMENTS[this.selectedTrack] || TRACK_ENVIRONMENTS.airfield;
    this.playerPhysics.setTrack(trackData);
    this.playerPhysics.reset();

    this.updateHUD();
    this.updateMatchupBadge();
    this.updateBudgetWarning();
  }

  syncOpponentPhysics() {
    this.opponentCar.recomputeStats();
    const c = this.opponentCar;
    this.opponentPhysics.configure({
      mass: c.mass,
      frontBias: c.frontWeightBias,
      hCG: c.hCG,
      wheelbase: c.wheelbase,
      peakForce: c.peakForce,
      powerBand: c.powerBand,
      blowerSurge: c.blowerSurge,
      turboLag: c.turboLag,
      boostCreep: c.boostCreep,
      tractorChug: c.tractorChug,
      immuneToHeat: c.immuneToHeat,
      ignoreDebris: c.ignoreDebris,
      heatRate: c.heatRate,
      critTemp: c.critTemp,
      heatCapacity: c.heatCapacity,
      radiatorArea: c.radiatorArea,
      grilleAirflow: c.grilleAirflow,
      suspTravel: c.suspTravel,
      suspKappa: c.suspKappa,
      roughnessTol: c.roughnessTol,
      mu: c.mu,
      tireType: c.tireType,
      cdA: c.cdA
    });

    const trackData = TRACK_ENVIRONMENTS[this.selectedTrack] || TRACK_ENVIRONMENTS.airfield;
    this.opponentPhysics.setTrack(trackData);
    this.opponentPhysics.reset();
  }

  updateBudgetWarning() {
    const banner = document.getElementById('budget-warning-banner');
    const overPtsEl = document.getElementById('budget-over-pts');
    const launchBtn = document.getElementById('btn-launch');
    const isValid = this.playerCar.isBudgetValid;

    if (banner) {
      if (!isValid) {
        banner.classList.remove('hidden');
        if (overPtsEl) overPtsEl.textContent = this.playerCar.jalopyPoints;
      } else {
        banner.classList.add('hidden');
      }
    }

    if (launchBtn && this.raceState === 'IDLE') {
      if (!isValid) {
        launchBtn.textContent = '⚠️ OVER BUDGET - CANNOT RACE';
        launchBtn.classList.add('btn-overbudget');
        launchBtn.classList.remove('btn-ready');
      } else {
        launchBtn.textContent = '🚦 STAGE & START';
        launchBtn.classList.remove('btn-overbudget');
        launchBtn.classList.add('btn-ready');
      }
    }
  }

  updateTrackBadge() {
    const track = TRACK_ENVIRONMENTS[this.selectedTrack] || TRACK_ENVIRONMENTS.airfield;
    const optBadge = document.getElementById('track-optimal-badge');
    const loreText = document.getElementById('track-lore-text');

    if (optBadge) {
      optBadge.textContent = `Optimal: ${track.optimalArchetype}`;
    }
    if (loreText) {
      loreText.textContent = track.decidingFactor || track.lore;
    }
  }

  _initUI() {
    this.populateOpponentDropdown();
    this.autoMatchOpponent(false);
    this.updateTrackBadge();
    this.renderGarage();
    this.renderCrateShop();
    this.loadNextDynoChallenge();
    this.renderLeaderboard();
    setTimeout(() => this.ensureDesmosCalculator(), 300);
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

    // Ambient Background Dimmer Preset Cycle Button (Auto / Dark / Vibrant)
    const dimBtn = document.getElementById('btn-bg-dim');
    if (dimBtn) {
      const savedDim = localStorage.getItem('ratrod_bg_dim') || 'auto';
      document.body.dataset.bgDim = savedDim;
      this._updateDimmerButtonText(dimBtn, savedDim);

      dimBtn.addEventListener('click', () => {
        const current = document.body.dataset.bgDim || 'auto';
        let next = 'auto';
        if (current === 'auto') next = 'dark';
        else if (current === 'dark') next = 'vibrant';
        else next = 'auto';

        document.body.dataset.bgDim = next;
        localStorage.setItem('ratrod_bg_dim', next);
        this._updateDimmerButtonText(dimBtn, next);
      });
    }

    // Dyno jump shortcut from Crates hero banner
    const dynoJumpBtn = document.getElementById('btn-dyno-jump');
    if (dynoJumpBtn) {
      dynoJumpBtn.addEventListener('click', () => this.switchTab('dyno'));
    }

    // Track Environment Selector Change
    const trackSelect = document.getElementById('track-select');
    if (trackSelect) {
      trackSelect.addEventListener('change', (e) => {
        this.selectedTrack = e.target.value;
        const trackData = TRACK_ENVIRONMENTS[this.selectedTrack] || TRACK_ENVIRONMENTS.airfield;
        this.playerPhysics.setTrack(trackData);
        this.opponentPhysics.setTrack(trackData);
        this.updateTrackBadge();
        this.resetRace();
      });
    }

    // Launch Button
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
          alert(`Successfully loaded classmate ghost: ${imported.name} (${formatStudentDriverName(imported.driver, false)})!`);
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

    // Leaderboard Tabs
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

    // Dyno Calculator Collapse / Toggle
    const collapseCalcBtn = document.getElementById('btn-dyno-calc-collapse');
    const calcWrapper = document.getElementById('desmos-wrapper');
    if (collapseCalcBtn && calcWrapper) {
      collapseCalcBtn.addEventListener('click', () => {
        const isCollapsed = calcWrapper.classList.toggle('collapsed');
        collapseCalcBtn.textContent = isCollapsed ? '➕' : '↕';
        collapseCalcBtn.title = isCollapsed ? 'Expand Calculator' : 'Collapse Calculator';
        if (!isCollapsed && this.desmosCalculator && typeof this.desmosCalculator.resize === 'function') {
          setTimeout(() => this.desmosCalculator.resize(), 100);
        }
      });
    }

    const mobileCalcToggle = document.getElementById('btn-toggle-calc-mobile');
    const calcStation = document.getElementById('dyno-calc-station');
    if (mobileCalcToggle && calcStation) {
      mobileCalcToggle.addEventListener('click', () => {
        this.ensureDesmosCalculator();
        if (calcWrapper && calcWrapper.classList.contains('collapsed')) {
          calcWrapper.classList.remove('collapsed');
          if (collapseCalcBtn) collapseCalcBtn.textContent = '↕';
        }
        calcStation.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    if (typeof document !== 'undefined' && document.body) {
      document.body.dataset.activeTab = tabName;
    }
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
    } else if (tabName === 'dyno') {
      this.ensureDesmosCalculator();
    }
  }

  handleLaunchButton() {
    this.audio.resume();

    // Check Jalopy Budget validity before allowing stage or race
    if (!this.playerCar.isBudgetValid) {
      alert(`Your Rat Rod exceeds the 20-Point Jalopy Budget (${this.playerCar.jalopyPoints} / 20 pts)!\nGo to the Garage and swap to cheaper parts to make your rig legal.`);
      this.switchTab('garage');
      return;
    }

    if (this.raceState === 'IDLE') {
      this.startCountdown();
    } else if (this.raceState === 'COUNTDOWN') {
      // False start / red light foul
      this.playerFoul = true;
      this.treeStep = 6; // Red light
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
    this.treeStep = 1; // Stage on
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
      if (!this.playerCar.isBudgetValid) {
        launchBtn.textContent = '⚠️ OVER BUDGET - CANNOT RACE';
        launchBtn.classList.add('btn-overbudget');
      } else {
        launchBtn.textContent = '🚦 STAGE & START';
        launchBtn.classList.remove('btn-waiting', 'btn-racing', 'btn-overbudget', 'btn-danger');
        launchBtn.classList.add('btn-ready');
      }
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
      // Step player physics
      if (this.playerReacted) {
        this.playerPhysics.step(dt);
      }

      // Step opponent physics with realistic reaction time
      const oppElapsed = (performance.now() - this.greenTimestamp) / 1000;
      if (oppElapsed >= 0.22) {
        this.opponentPhysics.step(dt);
      }

      // Update engine audio pitch
      const playerSpeed = this.playerPhysics.v;
      const rpmRatio = Math.min(1.0, playerSpeed / 48);
      this.audio.updateEngine(rpmRatio);

      // Check for race finish
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
      const prizeCash = 140;
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

    const track = TRACK_ENVIRONMENTS[this.selectedTrack] || TRACK_ENVIRONMENTS.airfield;

    const slipHtml = `
      <div style="background:rgba(255,190,11,0.08); border:1px solid rgba(255,190,11,0.25); border-radius:6px; padding:6px 12px; margin-bottom:12px; font-size:12px; text-align:center;">
        Track: <strong>${track.name}</strong> • ${track.badge}
      </div>
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
          <p>Driver: <em>${formatStudentDriverName(this.opponentCar.driver, this.opponentCar.isGhost)}</em></p>
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

    // Load Telemetry data into Graph
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

    // Track scaling: 1 meter = 3.5 pixels
    const ppm = 3.5;
    const playerX = this.playerPhysics.x * ppm;
    const opponentX = this.opponentPhysics.x * ppm;

    // Smooth camera tracking
    const leadX = Math.max(playerX, opponentX);
    const targetCamX = Math.max(0, leadX - w * 0.4);
    this.cameraX += (targetCamX - this.cameraX) * 0.12;

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // 1. Render Sky & Track Environmental Background
    this._renderEnvironment(ctx, w, h);

    // 2. Render Track Road Surface & Distance Marks
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
      isOverheating: this.opponentPhysics.isOverheating
    }, { scale: 0.88, idle: this.raceState === 'IDLE' });

    // 5. Render Player Car (Lane 1 - Lower Lane)
    const pWheelAngle = (this.playerPhysics.x / 0.5) % (Math.PI * 2);
    drawRatRodCanvas(ctx, this.playerCar, 60 + playerX, 340, {
      v: this.playerPhysics.v,
      a: this.playerPhysics.a,
      wheelAngle: pWheelAngle,
      isSlipping: this.playerPhysics.isSlipping,
      isOverheating: this.playerPhysics.isOverheating
    }, { scale: 1.0, idle: this.raceState === 'IDLE' });

    ctx.restore();

    // 6. Live HUD overlay on Canvas (Speed, Accel, Temperature & Wheelspin Alert)
    this._renderCanvasHUD(ctx, w, h);
  }

  _renderEnvironment(ctx, w, h) {
    const track = TRACK_ENVIRONMENTS[this.selectedTrack] || TRACK_ENVIRONMENTS.airfield;
    const stripEnd = 402.336 * 3.5 + 400;

    // Atmospheric Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
    const colors = track.skyColors || ['#1a1423', '#3d1a24', '#9b4b2a'];
    skyGrad.addColorStop(0, colors[0]);
    skyGrad.addColorStop(0.5, colors[1]);
    skyGrad.addColorStop(1, colors[2]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(this.cameraX - 100, 0, w + 200, 200);

    if (this.selectedTrack === 'bonneville') {
      // Mirages & distant stark white mountain peaks
      ctx.fillStyle = '#3a4b68';
      ctx.beginPath();
      ctx.moveTo(this.cameraX - 100, 200);
      for (let x = this.cameraX - 100; x < this.cameraX + w + 100; x += 150) {
        ctx.lineTo(x + 75, 155 + Math.sin(x * 0.003) * 18);
      }
      ctx.lineTo(this.cameraX + w + 100, 200);
      ctx.closePath();
      ctx.fill();

    } else if (this.selectedTrack === 'mountain') {
      // Pine forest ridgeline
      ctx.fillStyle = '#1c2e1f';
      ctx.beginPath();
      ctx.moveTo(this.cameraX - 100, 200);
      for (let x = this.cameraX - 100; x < this.cameraX + w + 100; x += 40) {
        ctx.lineTo(x + 20, 130 + Math.sin(x * 0.02) * 25);
      }
      ctx.lineTo(this.cameraX + w + 100, 200);
      ctx.closePath();
      ctx.fill();

    } else if (this.selectedTrack === 'quarry') {
      // Rocky cut limestone cliffs
      ctx.fillStyle = '#383d3b';
      ctx.beginPath();
      ctx.moveTo(this.cameraX - 100, 200);
      for (let x = this.cameraX - 100; x < this.cameraX + w + 100; x += 90) {
        ctx.lineTo(x + 45, 120 + Math.sin(x * 0.01) * 35);
      }
      ctx.lineTo(this.cameraX + w + 100, 200);
      ctx.closePath();
      ctx.fill();

    } else {
      // Default distant ridge & grandstand
      ctx.fillStyle = '#17111e';
      ctx.beginPath();
      ctx.moveTo(this.cameraX - 100, 200);
      for (let x = this.cameraX - 100; x < this.cameraX + w + 100; x += 120) {
        ctx.lineTo(x + 60, 140 + Math.sin(x * 0.005) * 30);
      }
      ctx.lineTo(this.cameraX + w + 100, 200);
      ctx.closePath();
      ctx.fill();

      // Grandstands
      ctx.fillStyle = '#2c223b';
      ctx.fillRect(this.cameraX - 100, 160, w + 200, 40);

      // Decorative flags
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
  }

  _renderTrack(ctx, w, h, ppm) {
    const track = TRACK_ENVIRONMENTS[this.selectedTrack] || TRACK_ENVIRONMENTS.airfield;
    const trackStart = 0;
    const trackEnd = 402.336 * ppm + 400;

    // Safety barrier / Guardrail
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(trackStart - 50, 195, trackEnd + 100, 15);
    ctx.fillStyle = '#343a40';
    ctx.fillRect(trackStart - 50, 210, trackEnd + 100, 4);

    // Track surface ground
    ctx.fillStyle = track.groundColor || '#1a1c23';
    ctx.fillRect(trackStart - 50, 214, trackEnd + 100, 175);

    // Surface texture for dirt / salt / gravel
    if (this.selectedTrack === 'dirt_oval') {
      ctx.strokeStyle = '#3b2416';
      ctx.lineWidth = 1.8;
      for (let dy = 230; dy <= 370; dy += 25) {
        ctx.beginPath();
        ctx.moveTo(trackStart - 50, dy);
        ctx.lineTo(trackEnd + 50, dy);
        ctx.stroke();
      }
    } else if (this.selectedTrack === 'bonneville') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      for (let sx = 0; sx < trackEnd; sx += 80) {
        ctx.fillRect(sx, 220 + (sx % 120), 40, 2);
      }
    }

    // Lane divider line (dashed)
    ctx.strokeStyle = track.stripeColor || '#f8f9fa';
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
      ctx.strokeStyle = m.d === 402.336 ? '#ffbe0b' : '#6c757d';
      ctx.lineWidth = m.d === 402.336 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(mx, 214);
      ctx.lineTo(mx, 389);
      ctx.stroke();

      ctx.fillStyle = m.d === 402.336 ? '#ffbe0b' : '#343a40';
      ctx.fillRect(mx - 35, 175, 70, 20);
      ctx.fillStyle = m.d === 402.336 ? '#111' : '#ffd166';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, mx, 189);
    });

    // Overhead Checkered Finish Line Gantry
    const finishX = 60 + 402.336 * ppm;
    ctx.fillStyle = '#e5e5e5';
    ctx.fillRect(finishX - 8, 120, 16, 95);
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
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(x - 6, y - 85, 12, 110);

    const bulbs = [
      { yOffset: -75, active: this.treeStep >= 1, color: '#ffd166' },
      { yOffset: -58, active: this.treeStep >= 2 && this.treeStep <= 4, color: '#ff9e00' },
      { yOffset: -41, active: this.treeStep >= 3 && this.treeStep <= 4, color: '#ff9e00' },
      { yOffset: -24, active: this.treeStep === 4, color: '#ff9e00' },
      { yOffset: -7, active: this.treeStep === 5, color: '#00f0ff' },
      { yOffset: 10, active: this.treeStep === 6, color: '#ff0055' }
    ];

    bulbs.forEach(b => {
      ctx.fillStyle = b.active ? b.color : '#333';
      ctx.beginPath(); ctx.arc(x - 14, y + b.yOffset, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 14, y + b.yOffset, 6, 0, Math.PI * 2); ctx.fill();

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
    const tempF = Math.round(pState.temp);

    // Panel box
    ctx.fillStyle = 'rgba(18, 21, 28, 0.88)';
    ctx.strokeStyle = '#3b4252';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(15, 15, 255, 96, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SPEED: ${speed}`, 26, 38);

    ctx.fillStyle = '#ffd166';
    ctx.font = '11px monospace';
    ctx.fillText(`ACCEL (F/m): ${accel}`, 26, 58);
    ctx.fillText(`FORCE: ${pState.fNet} N | MASS: ${this.playerCar.mass} kg`, 26, 75);

    // Temperature with color shifting
    let tempColor = '#00f0ff';
    if (tempF > 225) tempColor = '#ff3366';
    else if (tempF > 200) tempColor = '#ffbe0b';

    ctx.fillStyle = tempColor;
    ctx.fillText(`ENGINE TEMP: ${tempF}°F ${pState.isOverheating ? '🔥 OVERHEAT (-Power)!' : ''}`, 26, 92);

    // Traction Wheelspin Alert
    if (pState.isSlipping) {
      ctx.fillStyle = '#ff3366';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`⚠️ WHEELSPIN! (-${pState.fSpin} N loss)`, 26, 126);
    }
  }

  // --- GARAGE WORKSHOP PREVIEW & SPECS ---
  renderGaragePreview() {
    const canvas = document.getElementById('garagePreviewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Spotlight vignette
    const spotGrad = ctx.createRadialGradient(w / 2, 25, 10, w / 2, 90, 140);
    spotGrad.addColorStop(0, 'rgba(255, 190, 11, 0.18)');
    spotGrad.addColorStop(0.6, 'rgba(255, 190, 11, 0.05)');
    spotGrad.addColorStop(1, 'rgba(14, 17, 25, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, w, h);

    // Lift Stand
    const beamY = 138;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(w / 2, 175, 90, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hydraulic cylinder
    ctx.fillStyle = '#222530';
    ctx.fillRect(w / 2 - 14, beamY + 8, 28, 35);
    ctx.strokeStyle = '#12121c';
    ctx.lineWidth = 2;
    ctx.strokeRect(w / 2 - 14, beamY + 8, 28, 35);

    // Yellow Beam with hazard stripes
    ctx.fillStyle = '#ffbe0b';
    ctx.fillRect(w / 2 - 115, beamY, 230, 8);
    ctx.strokeRect(w / 2 - 115, beamY, 230, 8);
    ctx.fillStyle = '#14141c';
    for (let bx = w / 2 - 110; bx < w / 2 + 110; bx += 20) {
      ctx.beginPath();
      ctx.moveTo(bx, beamY); ctx.lineTo(bx + 6, beamY);
      ctx.lineTo(bx + 2, beamY + 8); ctx.lineTo(bx - 4, beamY + 8);
      ctx.closePath();
      ctx.fill();
    }

    // Pads
    ctx.fillStyle = '#1e1f29';
    ctx.fillRect(w / 2 - 74, beamY - 4, 38, 5); ctx.strokeRect(w / 2 - 74, beamY - 4, 38, 5);
    ctx.fillRect(w / 2 + 45, beamY - 9, 32, 10); ctx.strokeRect(w / 2 + 45, beamY - 9, 32, 10);

    // Complete assembled rat rod on lift
    drawRatRodCanvas(ctx, this.playerCar, w / 2, 104, {
      v: 0, a: 0, wheelAngle: 0, isSlipping: false, isOverheating: false
    }, { scale: 1.25, idle: true });
  }

  renderGarage() {
    this.renderGaragePreview();

    // Update Jalopy Budget Meter (Section 6.1)
    const ratio = Math.min(100, (this.playerCar.jalopyPoints / 20) * 100);
    const ratioText = document.getElementById('garage-budget-ratio');
    const fillEl = document.getElementById('garage-budget-bar-fill');
    const statusEl = document.getElementById('garage-budget-status');

    if (ratioText) {
      ratioText.textContent = `${this.playerCar.jalopyPoints} / 20 pts`;
      ratioText.style.color = this.playerCar.isBudgetValid ? 'var(--accent-cyan)' : 'var(--accent-red)';
    }
    if (fillEl) {
      fillEl.style.width = ratio + '%';
      fillEl.style.background = this.playerCar.isBudgetValid ? 'linear-gradient(90deg, #00f0ff, #10b981)' : 'linear-gradient(90deg, #ff5400, #ff0055)';
    }
    if (statusEl) {
      statusEl.className = this.playerCar.isBudgetValid ? 'budget-status-valid' : 'budget-status-invalid';
      statusEl.textContent = this.playerCar.isBudgetValid ?
        `✅ Build Legal (Under 20 pt Jalopy Ceiling)` :
        `⚠️ OVER BUDGET (+${this.playerCar.budgetDeficit} pts) — Must swap to cheaper parts!`;
    }

    // Specs Sheet
    const statsContainer = document.getElementById('garage-specs-sheet');
    if (statsContainer) {
      this.playerCar.recomputeStats();
      const p = this.playerCar;
      const affinity = p.archetypeAffinity;

      statsContainer.innerHTML = `
        <div class="spec-row" style="background:rgba(255,255,255,0.03); padding:4px 6px; border-radius:4px;">
          <span>Archetype Affinity:</span>
          <strong style="color:var(--accent-amber);">${affinity.primary} (${affinity.highestPct}%)</strong>
        </div>
        <div class="spec-row">
          <span>Jalopy Points:</span>
          <strong style="color:${p.isBudgetValid ? '#00f0ff' : '#ff3366'}">${p.jalopyPoints} / 20 pts</strong>
        </div>
        <div class="spec-row">
          <span>Total Mass (m):</span>
          <strong>${p.mass} kg</strong>
        </div>
        <div class="spec-row">
          <span>Weight Distribution:</span>
          <strong>Front ${Math.round(p.frontWeightBias * 100)}% / Rear ${Math.round(p.rearWeightBias * 100)}%</strong>
        </div>
        <div class="spec-row">
          <span>Drive Force (F):</span>
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
          <span>Traction Balance:</span>
          <strong style="color:${p.burnoutRisk ? '#ff5555' : '#00f0ff'}">
            ${p.burnoutRisk ? '⚠️ High Wheelspin Risk' : '✅ Full Traction Hook'}
          </strong>
        </div>
        <div class="spec-row">
          <span>Cooling Capacity:</span>
          <strong>${p.radiatorArea}x Radiator Area</strong>
        </div>
        <div class="spec-row">
          <span>Drag Area (CdA):</span>
          <strong>${p.cdA} m²</strong>
        </div>
      `;
    }

    // Render Inventory Cards across 5 Canonical Slots
    const slots = ['powertrain', 'chassis', 'suspension', 'wheels', 'ancillary'];
    slots.forEach(slot => {
      const listEl = document.getElementById(`inv-list-${slot}`);
      if (!listEl) return;
      listEl.innerHTML = '';

      const ownedInSlot = this.inventory.owned[slot] || {};
      const catalog = RAT_ROD_ASSETS[slot] || {};

      Object.keys(ownedInSlot).forEach(partId => {
        const part = catalog[partId];
        if (!part) return;
        const entry = ownedInSlot[partId];
        const isEquipped = (this.playerCar.parts[slot] === partId);

        const card = document.createElement('div');
        card.className = `inv-part-card rarity-${part.rarity || 'common'} ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="part-header">
            <span class="part-name">${part.name}</span>
            <span class="part-cost-badge">⚡ ${part.cost} pts</span>
          </div>
          <div class="part-archetype-tag archetype-${(part.archetype || 'Balanced').toLowerCase().replace(/[^a-z]/g, '')}">
            ${part.archetype || 'Balanced'}
          </div>
          <div class="part-svg-wrap">
            ${RatRodSVG.getPartSVG(part, 80)}
          </div>
          <div class="part-trait-box">
            <strong>${part.trait || 'Standard'}</strong>: ${part.traitDesc || part.lore || ''}
          </div>
          <div class="part-count">Level ${entry.level} • Copies: ${entry.count}</div>
          <div class="part-actions">
            <button class="btn btn-sm ${isEquipped ? 'btn-equipped' : 'btn-equip'}">
              ${isEquipped ? 'Equipped' : 'Equip'}
            </button>
            ${entry.count >= 2 && entry.level < 3 ? `<button class="btn btn-sm btn-upgrade">Upgrade</button>` : ''}
            ${entry.count > 1 ? `<button class="btn btn-sm btn-scrap">Scrap</button>` : ''}
          </div>
        `;

        // Equip Part
        card.querySelector('.btn-equip')?.addEventListener('click', () => {
          this.playerCar.equip(slot, partId, entry.level);
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
              this.playerCar.levels[slot] = res.newLevel;
            }
            this.syncPlayerCarPhysics();
            this.renderGarage();
            this.updateHUD();
            if (this.authManager) this.authManager.autoSave();
          }
        });

        // Scrap / Recycle
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
      card.className = `unboxing-card rarity-${res.part.rarity || 'common'}`;
      card.innerHTML = `
        <div class="card-badge">${(res.part.rarity || 'common').toUpperCase()}</div>
        ${RatRodSVG.getPartSVG(res.part, 110)}
        <h4>${res.part.name}</h4>
        <div style="font-size:11px; font-weight:700; color:var(--accent-amber); margin:4px 0;">
          ⚡ ${res.part.cost || 2} pts • ${res.part.archetype || 'Custom'}
        </div>
        <p class="card-lore">${res.part.lore || res.part.traitDesc || ''}</p>
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

  // --- DYNO PROVING GROUNDS ---
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

    const current = this.challenges.currentChallenge;
    if (!current || current.answered) {
      this.loadNextDynoChallenge();
      return;
    }

    const inputEl = document.getElementById('dyno-input-val');
    const feedbackEl = document.getElementById('dyno-feedback-box');
    const submitBtn = document.getElementById('btn-dyno-submit');
    const nextBtn = document.getElementById('btn-dyno-next');

    if (!inputEl) return;
    const rawVal = parseFloat(inputEl.value);
    if (isNaN(rawVal)) {
      alert("Please enter a valid numeric value.");
      return;
    }

    this.isSubmittingDyno = true;
    inputEl.disabled = true;
    if (submitBtn) submitBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.remove('hidden');

    const result = this.challenges.checkAnswer(rawVal);

    if (result.correct) {
      this.audio.playDynoSuccess();
      this.inventory.addCash(result.earnedCash);
      this.inventory.addScore(15);
      this.updateHUD();

      feedbackEl.innerHTML = `
        <div class="dyno-feedback-card correct">
          <div class="fb-title">✅ EXCELLENT CALCULATION! +$${result.earnedCash} Cash (${result.streak}x Streak)</div>
          <p class="fb-text">Your telemetry calibration hooked cleanly into the Dyno database.</p>
          <div class="solution-steps">
            <strong>Physics Solution:</strong>
            <ul>${result.solutionSteps.map(s => `<li>${s}</li>`).join('')}</ul>
          </div>
        </div>
      `;
    } else {
      this.audio.playDynoFail();
      this.updateHUD();

      feedbackEl.innerHTML = `
        <div class="dyno-feedback-card wrong">
          <div class="fb-title">❌ CALCULATION ERROR (Off by ${result.diff.toFixed(2)})</div>
          <p class="fb-text">Review Newton's laws below and calibrate your working.</p>
          <div class="solution-steps">
            <strong>Correct Procedure:</strong>
            <ul>${result.solutionSteps.map(s => `<li>${s}</li>`).join('')}</ul>
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

  ensureDesmosCalculator() {
    const container = document.getElementById('desmos-dyno-calculator');
    if (!container) return;

    if (!this.desmosCalculator) {
      if (typeof window.Desmos !== 'undefined' && typeof window.Desmos.ScientificCalculator === 'function') {
        try {
          this.desmosCalculator = window.Desmos.ScientificCalculator(container, {
            fontSize: (window.Desmos.FontSizes && window.Desmos.FontSizes.SMALL) ? window.Desmos.FontSizes.SMALL : 14,
            keypad: true,
            settingsMenu: false
          });
          window.desmosCalculator = this.desmosCalculator;
        } catch (e) {
          console.warn("Desmos ScientificCalculator init error:", e);
          this._fallbackToDesmosIframe();
        }
      } else {
        this._fallbackToDesmosIframe();
      }
    }

    if (this.desmosCalculator && typeof this.desmosCalculator.resize === 'function') {
      setTimeout(() => {
        try {
          this.desmosCalculator.resize();
        } catch (err) {}
      }, 60);
    }
  }

  _fallbackToDesmosIframe() {
    const calcContainer = document.getElementById('desmos-dyno-calculator');
    const fallbackBox = document.getElementById('desmos-fallback-frame');
    const iframe = document.getElementById('desmos-dyno-iframe');
    if (calcContainer) calcContainer.style.display = 'none';
    if (fallbackBox && iframe) {
      fallbackBox.classList.remove('hidden');
      if (!iframe.src || iframe.src === 'about:blank' || iframe.src === window.location.href) {
        iframe.src = 'https://www.desmos.com/scientific?embed';
      }
    }
  }

  updateHUD() {
    const budgetVal = document.getElementById('hud-budget-val');
    if (budgetVal && this.playerCar) {
      budgetVal.textContent = `${this.playerCar.jalopyPoints} / 20 pts`;
      budgetVal.style.color = this.playerCar.isBudgetValid ? 'var(--accent-cyan)' : 'var(--accent-red)';
    }

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

    this.updateMatchupBadge();
    this.updateBudgetWarning();
  }

  _updateDimmerButtonText(btn, mode) {
    if (!btn) return;
    if (mode === 'dark') {
      btn.textContent = '🖼️ BG: Dark';
      btn.title = 'Background: Extra Dark (maximum high-contrast focus)';
    } else if (mode === 'vibrant') {
      btn.textContent = '🖼️ BG: Vibrant';
      btn.title = 'Background: Vibrant (richer hot rod banner atmosphere)';
    } else {
      btn.textContent = '🖼️ BG: Auto';
      btn.title = 'Background: Auto (dimmed for most pages/tabs, vibrant in Crates)';
    }
  }

  populateOpponentDropdown() {
    const oppSelect = document.getElementById('opponent-select');
    if (!oppSelect) return;
    oppSelect.innerHTML = '';
    this.opponentRoster.forEach((r, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      const pi = r.pi || r.car.pi;
      const carClass = r.carClass || r.car.carClass;
      const driverDisplay = formatStudentDriverName(r.driver, true);
      opt.textContent = `[Class ${carClass} • ${pi} PI] ${r.name} (${driverDisplay})`;
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
  }

  getBaselineLeaderboard() {
    const list = [];
    const inv = this.inventory;
    const pc = this.playerCar;
    const auth = this.authManager;
    const rawMyName = (auth && auth.studentName) ? auth.studentName : "You";
    const myName = formatStudentDriverName(rawMyName, false);
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

      let displayName = formatStudentDriverName(r.name || r.driver, r.isGhost);
      if (isYou) {
        displayName = displayName.replace(/\s*\(You\)\s*$/i, '');
      }

      const etDisplay = (r.bestEt && r.bestEt > 0) ? `${Number(r.bestEt).toFixed(3)}s` : '--';
      const speedMph = (r.bestTrapSpeed && r.bestTrapSpeed > 0) ? (r.bestTrapSpeed * 2.23694).toFixed(1) + ' mph' : '--';
      const winRate = r.racesTotal > 0 ? Math.round((r.racesWon / r.racesTotal) * 100) + '%' : '--';

      row.innerHTML = `
        <td class="lb-cell-rank"><span class="rank-pill ${rankClass}">${rankBadge}</span></td>
        <td class="lb-cell-driver">
          <strong>${displayName}</strong>
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
      const rivalName = formatStudentDriverName(rivalRecord.driver || rivalRecord.name, rivalRecord.isGhost);
      launchBtn.textContent = `⚔️ STAGE: VS ${rivalName.toUpperCase()}`;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.ratRodGame = new RatRodGame();
});

window.RatRodGame = RatRodGame;

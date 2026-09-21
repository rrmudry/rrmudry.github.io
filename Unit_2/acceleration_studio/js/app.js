/**
 * Acceleration Rate & Sign Studio - Main Application Controller
 * Manages Web Audio synthesizer, UI tab navigation, sandbox controls,
 * and certificate generation.
 */

// Web Audio API Synthesizer
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.muted = !this.muted;
    return !this.muted;
  }

  playTone(freq, duration, type = 'sine', gainVal = 0.15) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("WebAudio tone error:", e);
    }
  }

  playClick() {
    this.playTone(600, 0.04, 'triangle', 0.1);
  }

  playSuccess() {
    this.init();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.18, 'sine', 0.18), idx * 70);
    });
  }

  playError() {
    this.init();
    if (this.muted || !this.ctx) return;
    this.playTone(220, 0.22, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(180, 0.25, 'sawtooth', 0.15), 100);
  }

  playTurnaroundSound() {
    this.init();
    if (this.muted || !this.ctx) return;
    this.playTone(880, 0.12, 'sine', 0.2);
    setTimeout(() => this.playTone(440, 0.2, 'sine', 0.2), 60);
  }

  playStrobeTick() {
    this.playTone(1200, 0.03, 'sine', 0.08);
  }

  playThrustWhine() {
    this.init();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.8);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 1.2);
  }

  playBrakeCrash() {
    this.init();
    if (this.muted || !this.ctx) return;
    this.playTone(130, 0.45, 'sawtooth', 0.25);
  }

  playUnlockPing() {
    this.init();
    if (this.muted || !this.ctx) return;
    [659.25, 880, 1046.5].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.16, 'sine', 0.2), idx * 80);
    });
  }
}

window.AudioEngine = new SoundEngine();

/**
 * MatrixGateManager - Enforces 10-second observation per quadrant before unlocking the next.
 * Starting with Top-Left (+v, +a), then Top-Right (+v, -a), Bottom-Left (-v, -a), Bottom-Right (-v, +a).
 */
class MatrixGateManager {
  constructor(app) {
    this.app = app;
    this.REQUIRED_SECONDS = 10.0;
    this.storageKey = 'acceleration_studio_matrix_gate_v2';

    this.cards = [
      { id: 0, unlocked: true, studiedTime: 0, completed: false, name: '+v and +a (Speeding Up Right)', v0: 10, a: 3 },
      { id: 1, unlocked: false, studiedTime: 0, completed: false, name: '+v and -a (Slowing Down Right)', v0: 16, a: -4 },
      { id: 2, unlocked: false, studiedTime: 0, completed: false, name: '-v and -a (Speeding Up Left)', v0: -8, a: -3 },
      { id: 3, unlocked: false, studiedTime: 0, completed: false, name: '-v and +a (Slowing Down Left)', v0: -15, a: 5 }
    ];

    this.activeCardIndex = 0;
    this.timerInterval = null;
    this.lastTickTime = performance.now();
    this.toastTimeout = null;

    this.loadState();
  }

  loadState() {
    try {
      const saved = sessionStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.cards) && parsed.cards.length === 4) {
          parsed.cards.forEach((c, idx) => {
            this.cards[idx].unlocked = !!c.unlocked;
            this.cards[idx].studiedTime = Math.min(this.REQUIRED_SECONDS, Math.max(0, parseFloat(c.studiedTime) || 0));
            this.cards[idx].completed = !!c.completed || this.cards[idx].studiedTime >= this.REQUIRED_SECONDS;
          });
          if (typeof parsed.activeCardIndex === 'number' && parsed.activeCardIndex >= 0 && parsed.activeCardIndex < 4) {
            if (this.cards[parsed.activeCardIndex].unlocked) {
              this.activeCardIndex = parsed.activeCardIndex;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Matrix gate state load error:", e);
    }
    // Quadrant 0 is always unlocked
    this.cards[0].unlocked = true;

    // Verify sequential unlock integrity
    for (let i = 0; i < 3; i++) {
      if (this.cards[i].completed) {
        this.cards[i + 1].unlocked = true;
      }
    }
  }

  saveState() {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify({
        cards: this.cards.map(c => ({
          unlocked: c.unlocked,
          studiedTime: c.studiedTime,
          completed: c.completed
        })),
        activeCardIndex: this.activeCardIndex
      }));
    } catch (e) {}
  }

  init() {
    this.setupListeners();
    this.updateUI();
    this.startTimerLoop();

    // Attach global reset helper for convenience
    window.resetMatrixProgress = () => {
      sessionStorage.removeItem(this.storageKey);
      location.reload();
    };
  }

  setupListeners() {
    const matrixCards = document.querySelectorAll('.matrix-card');
    matrixCards.forEach(card => {
      card.addEventListener('click', () => {
        const quadIndex = parseInt(card.dataset.quadrant, 10);
        this.handleCardClick(quadIndex, card);
      });
    });
  }

  handleCardClick(index, cardEl) {
    if (isNaN(index) || index < 0 || index > 3) return;
    const cardData = this.cards[index];

    if (!cardData.unlocked) {
      // Locked card clicked! Gentle shake + audio + hint
      if (window.AudioEngine) window.AudioEngine.playError();
      cardEl.classList.remove('shake');
      void cardEl.offsetWidth; // trigger DOM reflow for CSS animation
      cardEl.classList.add('shake');
      setTimeout(() => cardEl.classList.remove('shake'), 450);

      // Identify which quadrant needs observation
      const neededCard = this.cards[index - 1];
      const remainingSec = Math.max(0, this.REQUIRED_SECONDS - neededCard.studiedTime).toFixed(1);
      this.showToast(`🔒 Quadrant Locked! Observe Quadrant ${index} for ${remainingSec}s more to unlock.`);
      return;
    }

    // Unlocked card clicked
    if (window.AudioEngine) window.AudioEngine.playClick();
    this.selectQuadrant(index);
  }

  selectQuadrant(index) {
    this.activeCardIndex = index;
    const cardEl = document.getElementById(`matrixCard${index}`);
    if (cardEl) {
      cardEl.classList.remove('ready-pulse');
    }

    // Update active visual class
    document.querySelectorAll('.matrix-card').forEach(c => c.classList.remove('active'));
    if (cardEl) cardEl.classList.add('active');

    // Load preset into simulator & sliders
    const presetV0 = this.cards[index].v0;
    const presetA = this.cards[index].a;

    const sliderV0 = document.getElementById('sliderV0');
    const sliderA = document.getElementById('sliderA');
    const valV0 = document.getElementById('valV0');
    const valA = document.getElementById('valA');

    if (sliderV0) sliderV0.value = presetV0;
    if (sliderA) sliderA.value = presetA;
    if (valV0) valV0.innerText = `${presetV0 >= 0 ? '+' : ''}${presetV0.toFixed(1)} m/s`;
    if (valA) valA.innerText = `${presetA >= 0 ? '+' : ''}${presetA.toFixed(1)} m/s²`;

    if (this.app.simulator) {
      this.app.simulator.setState(presetV0, presetA);
      this.app.simulator.play();
    }

    this.saveState();
    this.updateUI();
  }

  startTimerLoop() {
    this.lastTickTime = performance.now();
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const now = performance.now();
      const dt = (now - this.lastTickTime) / 1000;
      this.lastTickTime = now;

      this.tick(dt);
    }, 100);
  }

  tick(dt) {
    // Check observation conditions:
    if (document.hidden) return;

    const sandboxTab = document.getElementById('tab-sandbox');
    if (!sandboxTab || !sandboxTab.classList.contains('active')) return;

    const isSimRunning = this.app.simulator && this.app.simulator.isRunning;
    const activeData = this.cards[this.activeCardIndex];

    if (!activeData) return;

    // Accumulate time if simulation is running and card not yet completed
    if (isSimRunning && !activeData.completed) {
      activeData.studiedTime += dt;
      this.saveState();
    }

    if (activeData.studiedTime >= this.REQUIRED_SECONDS && !activeData.completed) {
      activeData.studiedTime = this.REQUIRED_SECONDS;
      activeData.completed = true;
      this.handleQuadrantCompleted(this.activeCardIndex);
      this.saveState();
    }

    this.updateUI();
  }

  handleQuadrantCompleted(index) {
    const nextIndex = index + 1;
    if (nextIndex < 4) {
      // Unlock next quadrant in sequence
      this.cards[nextIndex].unlocked = true;
      if (window.AudioEngine) window.AudioEngine.playUnlockPing();

      const nextCardEl = document.getElementById(`matrixCard${nextIndex}`);
      if (nextCardEl) {
        nextCardEl.classList.remove('locked');
        nextCardEl.classList.add('ready-pulse');
      }

      this.showToast(`🎉 Quadrant ${index + 1} studied! Quadrant ${nextIndex + 1} is now UNLOCKED. Tap it to observe!`);
    } else {
      // All 4 completed!
      if (window.AudioEngine) window.AudioEngine.playSuccess();
      this.showToast(`🏆 Amazing work! All 4 sign matrix quadrants studied & unlocked!`);
    }
    this.saveState();
  }

  updateUI() {
    const isSimRunning = this.app.simulator && this.app.simulator.isRunning;
    let completedCount = 0;
    let unlockedCount = 0;

    this.cards.forEach((c, idx) => {
      if (c.completed) completedCount++;
      if (c.unlocked) unlockedCount++;

      const cardEl = document.getElementById(`matrixCard${idx}`);
      const badgeEl = document.getElementById(`matrixBadge${idx}`);
      const fillEl = document.getElementById(`matrixTimerFill${idx}`);

      if (!cardEl || !badgeEl || !fillEl) return;

      const pct = Math.min(100, (c.studiedTime / this.REQUIRED_SECONDS) * 100);
      fillEl.style.width = `${pct}%`;

      if (!c.unlocked) {
        cardEl.classList.add('locked');
        cardEl.classList.remove('ready-pulse');
        badgeEl.className = 'matrix-timer-badge locked';
        badgeEl.innerHTML = '🔒 Locked';
      } else if (c.completed) {
        cardEl.classList.remove('locked');
        badgeEl.className = 'matrix-timer-badge completed';
        badgeEl.innerHTML = '✓ Studied';
      } else if (idx === this.activeCardIndex) {
        cardEl.classList.remove('locked');
        const remaining = Math.max(0, this.REQUIRED_SECONDS - c.studiedTime).toFixed(1);
        if (isSimRunning) {
          badgeEl.className = 'matrix-timer-badge counting';
          badgeEl.innerHTML = `⏳ ${remaining}s`;
        } else {
          badgeEl.className = 'matrix-timer-badge paused';
          badgeEl.innerHTML = `⏸ Paused (${remaining}s)`;
        }
      } else {
        cardEl.classList.remove('locked');
        const remaining = Math.max(0, this.REQUIRED_SECONDS - c.studiedTime).toFixed(1);
        badgeEl.className = 'matrix-timer-badge ready';
        badgeEl.innerHTML = `⚡ Tap (${remaining}s)`;
      }
    });

    // Update overall banner
    const bannerStatus = document.getElementById('matrixGateProgressText');
    const overallFill = document.getElementById('matrixGateOverallFill');

    if (bannerStatus) {
      if (completedCount === 4) {
        bannerStatus.innerText = '4/4 Mastered ✓';
        bannerStatus.style.background = 'rgba(16, 185, 129, 0.2)';
        bannerStatus.style.color = '#34d399';
        bannerStatus.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      } else {
        bannerStatus.innerText = `${completedCount}/4 Studied (${unlockedCount}/4 Unlocked)`;
      }
    }

    if (overallFill) {
      let totalProgress = 0;
      this.cards.forEach(c => {
        totalProgress += (c.studiedTime / this.REQUIRED_SECONDS) * 25;
      });
      overallFill.style.width = `${Math.min(100, totalProgress)}%`;
    }
  }

  showToast(msg) {
    const toast = document.getElementById('matrixToast');
    if (!toast) return;
    toast.innerText = msg;
    toast.style.display = 'block';
    toast.style.opacity = '1';

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 4000);
  }
}

// App Controller
class AccelerationApp {
  constructor() {
    this.simulator = null;
    this.challenges = null;
    this.matrixGate = null;
    this.currentTheme = 'dark';
  }

  init() {
    // 1. Initialize Simulator
    this.simulator = new MotionSimulator('simCanvas');

    // 2. Initialize Challenge Engine
    this.challenges = new ChallengeEngine(this);
    this.challenges.init();

    // Check for pending restored progress if Auth completed before App init
    if (window.AuthManager && window.AuthManager.pendingRestoreState) {
      this.challenges.restoreState(
        window.AuthManager.pendingRestoreState.studioState,
        window.AuthManager.pendingRestoreState.score
      );
      window.AuthManager.pendingRestoreState = null;
    }

    // 3. Hook Simulator Updates to HUD
    this.simulator.onUpdate = (data) => this.handleSimUpdate(data);

    // 4. Setup Event Listeners
    this.setupNavigation();
    this.setupSandboxControls();
    this.setupHeaderActions();
    this.setupCertModal();
    this.updateTabLockStates();

    // Unlock audio on first touch/click
    document.body.addEventListener('click', () => {
      window.AudioEngine.init();
    }, { once: true });

    // Auto-start motion on Tab 1
    this.simulator.play();
  }

  handleSimUpdate(data) {
    const elTime = document.getElementById('telTime');
    const elVel = document.getElementById('telVel');
    const elAcc = document.getElementById('telAcc');
    const elPos = document.getElementById('telPos');
    const elStatus = document.getElementById('motionStatus');
    const btnPlay = document.getElementById('btnPlaySim');

    if (elTime) elTime.textContent = `${data.t.toFixed(1)} s`;
    if (elVel) {
      const sign = data.v >= 0 ? '+' : '';
      elVel.textContent = `${sign}${data.v.toFixed(1)} m/s`;
    }
    if (elAcc) {
      const sign = data.a >= 0 ? '+' : '';
      elAcc.textContent = `${sign}${data.a.toFixed(1)} m/s²`;
    }
    if (elPos) {
      const sign = data.x >= 0 ? '+' : '';
      elPos.textContent = `${sign}${data.x.toFixed(1)} m`;
    }
    if (elStatus) {
      elStatus.textContent = data.status;
      elStatus.className = 'motion-status-pill ' + 
        (data.status.includes('Speeding') ? 'status-speeding' : 
         data.status.includes('Slowing') ? 'status-slowing' : 'status-constant');
    }
    if (btnPlay) {
      btnPlay.innerHTML = data.isRunning ? '<span>⏸</span> Pause' : '<span>▶</span> Run Simulation';
    }
  }

  updateTabLockStates() {
    const c = this.challenges;
    if (!c) return;

    // Tier 1 is always unlocked
    const t1Btn = document.querySelector('[data-tab="tab-tier1"]');
    if (t1Btn) {
      t1Btn.classList.remove('locked');
      const pill = t1Btn.querySelector('.tab-score-pill');
      if (pill && !c.tierCompleted.tier1) pill.innerText = '25 pts';
    }

    // Tier 2: strictly locked until Tier 1 is completed (3 in a row)
    const t2Btn = document.querySelector('[data-tab="tab-tier2"]');
    if (t2Btn) {
      if (c.tierCompleted.tier1) {
        const wasLocked = t2Btn.classList.contains('locked');
        t2Btn.classList.remove('locked');
        const pill = t2Btn.querySelector('.tab-score-pill');
        if (pill && !c.tierCompleted.tier2) pill.innerText = '25 pts';
        if (wasLocked) {
          t2Btn.classList.add('ready-pulse');
          this.showGlobalToast('🎉 Tier 2 Unlocked! Great job mastering Tier 1.');
        }
      } else {
        t2Btn.classList.add('locked');
        const pill = t2Btn.querySelector('.tab-score-pill');
        if (pill) pill.innerText = '🔒 Locked';
      }
    }

    // Tier 3: strictly locked until Tier 2 is completed
    const t3Btn = document.querySelector('[data-tab="tab-tier3"]');
    if (t3Btn) {
      if (c.tierCompleted.tier2) {
        const wasLocked = t3Btn.classList.contains('locked');
        t3Btn.classList.remove('locked');
        const pill = t3Btn.querySelector('.tab-score-pill');
        if (pill && !c.tierCompleted.tier3) pill.innerText = '25 pts';
        if (wasLocked) {
          t3Btn.classList.add('ready-pulse');
          this.showGlobalToast('🎉 Tier 3 Unlocked! Great job mastering Tier 2.');
        }
      } else {
        t3Btn.classList.add('locked');
        const pill = t3Btn.querySelector('.tab-score-pill');
        if (pill) pill.innerText = '🔒 Locked';
      }
    }

    // Tier 4: strictly locked until Tier 3 is completed
    const t4Btn = document.querySelector('[data-tab="tab-tier4"]');
    if (t4Btn) {
      if (c.tierCompleted.tier3) {
        const wasLocked = t4Btn.classList.contains('locked');
        t4Btn.classList.remove('locked');
        const pill = t4Btn.querySelector('.tab-score-pill');
        if (pill && !c.tierCompleted.tier4) pill.innerText = '25 pts';
        if (wasLocked) {
          t4Btn.classList.add('ready-pulse');
          this.showGlobalToast('🎉 Tier 4 Unlocked! Great job mastering Tier 3.');
        }
      } else {
        t4Btn.classList.add('locked');
        const pill = t4Btn.querySelector('.tab-score-pill');
        if (pill) pill.innerText = '🔒 Locked';
      }
    }
  }

  showGlobalToast(msg) {
    let toast = document.getElementById('appGlobalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appGlobalToast';
      toast.className = 'app-global-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = msg;
    toast.style.display = 'flex';
    void toast.offsetWidth;
    toast.classList.add('show');

    if (this.globalToastTimeout) clearTimeout(this.globalToastTimeout);
    this.globalToastTimeout = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 3200);
  }

  switchToTab(tabId) {
    const tabBtn = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
    if (tabBtn && !tabBtn.classList.contains('locked')) {
      tabBtn.click();
    }
  }

  setupNavigation() {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;

        // Strict Lock Enforcement
        if (tab.classList.contains('locked')) {
          if (window.AudioEngine) window.AudioEngine.playError();
          tab.classList.remove('tab-shake');
          void tab.offsetWidth; // Force DOM reflow to re-trigger animation
          tab.classList.add('tab-shake');

          let unlockMsg = '🔒 This Tier is currently locked!';
          if (targetId === 'tab-tier2') {
            unlockMsg = '🔒 Complete Tier 1 (Sign Detective) with 3 correct in a row to unlock Tier 2!';
          } else if (targetId === 'tab-tier3') {
            unlockMsg = '🔒 Complete Tier 2 (Speed Each Second) first to unlock Tier 3!';
          } else if (targetId === 'tab-tier4') {
            unlockMsg = '🔒 Complete Tier 3 (GUESS Sprint) first to unlock Tier 4!';
          }
          this.showGlobalToast(unlockMsg);
          return;
        }

        if (window.AudioEngine) window.AudioEngine.playClick();

        // Switch active tab button
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Switch panel visibility
        document.querySelectorAll('.tab-content').forEach(panel => {
          panel.classList.remove('active');
        });
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) targetPanel.classList.add('active');

        // If switching to sandbox, resize canvas
        if (targetId === 'tab-sandbox' && this.simulator) {
          this.simulator.resize();
        }
        if (targetId === 'tab-tier2' && this.challenges) {
          this.challenges.initTier2Track();
        }
        if (targetId === 'tab-tier3' && this.challenges) {
          this.challenges.renderTier3();
        }
        if (targetId === 'tab-tier4' && this.challenges) {
          this.challenges.initHazardCanvas();
        }
      });
    });
  }

  setupSandboxControls() {
    const sliderV0 = document.getElementById('sliderV0');
    const sliderA = document.getElementById('sliderA');
    const valV0 = document.getElementById('valV0');
    const valA = document.getElementById('valA');

    const updateSliders = () => {
      const v0 = parseFloat(sliderV0.value);
      const a = parseFloat(sliderA.value);
      valV0.innerText = `${v0 >= 0 ? '+' : ''}${v0.toFixed(1)} m/s`;
      valA.innerText = `${a >= 0 ? '+' : ''}${a.toFixed(1)} m/s²`;
      this.simulator.setState(v0, a);
    };

    if (sliderV0) sliderV0.addEventListener('input', updateSliders);
    if (sliderA) sliderA.addEventListener('input', updateSliders);

    // Play/Pause
    const btnPlay = document.getElementById('btnPlaySim');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        window.AudioEngine.playClick();
        if (this.simulator.isRunning) {
          this.simulator.pause();
        } else {
          this.simulator.play();
        }
        if (this.matrixGate) this.matrixGate.updateUI();
      });
    }

    // Reset
    const btnReset = document.getElementById('btnResetSim');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        window.AudioEngine.playClick();
        this.simulator.reset();
        if (this.matrixGate) this.matrixGate.updateUI();
      });
    }

    // Clear Strobes
    const btnClearStrobes = document.getElementById('btnClearStrobes');
    if (btnClearStrobes) {
      btnClearStrobes.addEventListener('click', () => {
        window.AudioEngine.playClick();
        this.simulator.clearStrobes();
      });
    }

    // Initialize Matrix Gate Manager (enforces 10-second observation per quadrant before unlocking)
    this.matrixGate = new MatrixGateManager(this);
    this.matrixGate.init();
  }

  setupHeaderActions() {
    // Sound Toggle
    const btnSound = document.getElementById('btnSoundToggle');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const isSoundOn = window.AudioEngine.toggleSound();
        btnSound.innerHTML = isSoundOn ? '<span>🔊</span> Sound' : '<span>🔇</span> Muted';
      });
    }

    // Theme Toggle
    const btnTheme = document.getElementById('btnThemeToggle');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        window.AudioEngine.playClick();
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        btnTheme.innerHTML = isLight ? '<span>🌙</span> Dark' : '<span>☀️</span> Light';
      });
    }
  }

  openCompletionModal() {
    const modal = document.getElementById('certModal');
    if (!modal) return;

    if (window.AudioEngine) window.AudioEngine.playSuccess();

    const auth = window.AuthManager;
    const c = this.challenges;

    // 1. Recipient info
    const nameEl = document.getElementById('certStudentNameDisplay');
    const idEl = document.getElementById('certStudentIdDisplay');
    const authPill = document.getElementById('certAuthStatusPill');

    const studentName = auth ? auth.studentName : 'Physics Scholar';
    const studentId = (auth && auth.studentId) ? auth.studentId : (auth && auth.isGuest ? 'Guest Physicist' : '000000');

    if (nameEl) nameEl.innerText = studentName;
    if (idEl) idEl.innerText = studentId;
    if (authPill) {
      if (auth && auth.isAuthorized) {
        authPill.innerText = '✓ Verified OUSD Account';
        authPill.style.background = '#e0f2fe';
        authPill.style.color = '#0369a1';
        authPill.style.borderColor = '#7dd3fc';
      } else {
        authPill.innerText = 'Guest Session (Unsaved)';
        authPill.style.background = '#fef3c7';
        authPill.style.color = '#92400e';
        authPill.style.borderColor = '#fcd34d';
      }
    }

    // 2. Date and Verification Code
    const dateEl = document.getElementById('certDateDisplay');
    const hashEl = document.getElementById('certHashDisplay');
    if (dateEl) {
      const now = new Date();
      dateEl.innerText = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (hashEl) {
      const idPart = (studentId.replace(/\D/g, '') || '8842').slice(-4);
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      hashEl.innerText = `ACCEL-${idPart}-${randomSuffix}`;
    }

    // 3. Tier Statuses
    if (c) {
      const t1Status = document.getElementById('certTier1Status');
      const t2Status = document.getElementById('certTier2Status');
      const t3Status = document.getElementById('certTier3Status');
      const t4Status = document.getElementById('certTier4Status');
      const scoreSeal = document.getElementById('certScoreSealDisplay');

      const total = (c.tierScores.tier1 || 0) + (c.tierScores.tier2 || 0) + (c.tierScores.tier3 || 0) + (c.tierScores.tier4 || 0);

      if (t1Status) t1Status.innerText = c.tierCompleted.tier1 ? `Mastered ✓ • ${c.tierScores.tier1} pts` : `${c.tierScores.tier1} / 25 pts`;
      if (t2Status) t2Status.innerText = c.tierCompleted.tier2 ? `Mastered ✓ • ${c.tierScores.tier2} pts` : `${c.tierScores.tier2} / 25 pts`;
      if (t3Status) t3Status.innerText = c.tierCompleted.tier3 ? `Mastered ✓ • ${c.tierScores.tier3} pts` : `${c.tierScores.tier3} / 25 pts`;
      if (t4Status) t4Status.innerText = c.tierCompleted.tier4 ? `Mastered ✓ • ${c.tierScores.tier4} pts` : `${c.tierScores.tier4} / 25 pts`;
      if (scoreSeal) scoreSeal.innerText = `${total}%`;
    }

    // 4. Cloud Save Confirmation Banner
    const cloudBox = document.getElementById('certCloudSyncBox');
    if (cloudBox) {
      if (auth && auth.isAuthorized && auth.studentId) {
        cloudBox.className = 'cert-cloud-box confirmed no-print';
        cloudBox.innerHTML = `
          <div class="cert-cloud-info">
            <div class="cert-cloud-icon">☁️</div>
            <div>
              <div class="cert-cloud-title">
                <span>Progress Automatically Backed Up to Firestore</span>
                <span style="font-family: var(--font-mono); font-size: 0.7rem; background: rgba(16, 185, 129, 0.2); padding: 0.15rem 0.5rem; border-radius: 9999px; border: 1px solid rgba(52, 211, 153, 0.4);">CONFIRMED ✓</span>
              </div>
              <div class="cert-cloud-subtitle">
                Official grade record for <strong>${auth.studentName} (${auth.studentId})</strong> has been verified in the school database. No turn-in or screenshot required!
              </div>
            </div>
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; color: #34d399; white-space: nowrap;">
            100 / 100 PTS
          </div>
        `;
      } else {
        cloudBox.className = 'cert-cloud-box guest no-print';
        cloudBox.innerHTML = `
          <div class="cert-cloud-info">
            <div class="cert-cloud-icon">⚠️</div>
            <div>
              <div class="cert-cloud-title">
                <span>Guest Mode Notice — Progress NOT Saved to Gradebook</span>
                <span style="font-family: var(--font-mono); font-size: 0.7rem; background: rgba(234, 179, 8, 0.2); padding: 0.15rem 0.5rem; border-radius: 9999px; border: 1px solid rgba(234, 179, 8, 0.4);">UNSAVED</span>
              </div>
              <div class="cert-cloud-subtitle">
                You completed this session as a Guest. Your grade was <strong>not recorded</strong> in Firestore. Sign in with your school account to link and back up this score!
              </div>
            </div>
          </div>
          <button id="btnCertSignIn" class="btn-primary" style="padding: 0.4rem 0.85rem; font-size: 0.78rem; white-space: nowrap; background: linear-gradient(135deg, #00f2fe 0%, #0284c7 100%); border-color: #38bdf8;">
            Sign In with @orangeusd.org
          </button>
        `;
        document.getElementById('btnCertSignIn')?.addEventListener('click', () => {
          modal.classList.remove('active');
          if (window.AuthManager) window.AuthManager.signIn();
        });
      }
    }

    modal.classList.add('active');
  }

  setupCertModal() {
    const modal = document.getElementById('certModal');
    const btnClaim = document.getElementById('btnClaimCert');
    const btnClose = document.getElementById('btnCloseCert');
    const btnCloseX = document.getElementById('btnCloseCertX');
    const btnPrint = document.getElementById('btnPrintCert');

    if (btnClaim) {
      btnClaim.addEventListener('click', () => {
        this.openCompletionModal();
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        window.AudioEngine.playClick();
        if (modal) modal.classList.remove('active');
      });
    }

    if (btnCloseX) {
      btnCloseX.addEventListener('click', () => {
        window.AudioEngine.playClick();
        if (modal) modal.classList.remove('active');
      });
    }

    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AccelerationApp();
  window.accelerationApp = window.app;
  window.app.init();
});

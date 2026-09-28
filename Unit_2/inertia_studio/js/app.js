// Inertia Studio: Master Application Controller
// Orchestrates 3 category simulations, UI state, sound, responsive canvas, and telemetry sync

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('mainCanvas');
  const simRest = new SimRest(canvas);
  const simMotion = new SimMotion(canvas);
  const simDirection = new SimDirection(canvas);
  const challenges = new ChallengeEngine();

  let activeTab = 'rest'; // 'rest', 'motion', 'direction', 'arena'
  let isPlaying = true;
  let speedMultiplier = 1.0;
  let animId = null;

  // App container reference for tab switcher in challenge engine
  const app = {
    simRest,
    simMotion,
    simDirection,
    challenges,
    switchTab: (tabId) => switchTab(tabId)
  };

  // Resize canvas for crisp rendering on high-DPI displays
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    renderCurrentSim();
  });
  resizeCanvas();

  // Tab Switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  const controlPanels = {
    rest: document.getElementById('panelRest'),
    motion: document.getElementById('panelMotion'),
    direction: document.getElementById('panelDirection'),
    arena: document.getElementById('panelArena')
  };

  function switchTab(tabId) {
    activeTab = tabId;
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    Object.keys(controlPanels).forEach(key => {
      if (controlPanels[key]) {
        controlPanels[key].classList.toggle('active', key === tabId);
      }
    });

    // Update Category Indicator Banner
    const catBadge = document.getElementById('categoryBadge');
    const catDesc = document.getElementById('categoryDescription');

    if (tabId === 'rest') {
      catBadge.textContent = 'CATEGORY 1: INERTIA OF REST';
      catBadge.className = 'category-badge badge-rest';
      catDesc.innerHTML = '<strong>Newton\'s First Law:</strong> An object at rest stubbornly stays at rest unless an external net force accelerates it. If the base moves too quickly for friction to grab it, the object stays put!';
      simRest.reset();
    } else if (tabId === 'motion') {
      catBadge.textContent = 'CATEGORY 2: INERTIA OF MOTION';
      catBadge.className = 'category-badge badge-motion';
      catDesc.innerHTML = '<strong>Newton\'s First Law:</strong> An object in motion maintains constant velocity forward indefinitely. <em>NO FORWARD FORCE EXISTS</em>—the passenger keeps moving simply because matter is lazy and resists stopping!';
      simMotion.reset();
    } else if (tabId === 'direction') {
      catBadge.textContent = 'CATEGORY 3: INERTIA OF DIRECTION';
      catBadge.className = 'category-badge badge-direction';
      catDesc.innerHTML = '<strong>Newton\'s First Law:</strong> Matter wants to travel in a <em>straight line</em>. Turning requires a continuous inward centripetal force. When that force vanishes, the object escapes along a perfect straight tangent line!';
      simDirection.reset();
    } else if (tabId === 'arena') {
      catBadge.textContent = '🎯 INERTIA MASTERY ARENA';
      catBadge.className = 'category-badge badge-arena';
      catDesc.innerHTML = 'Test your predictive physics mastery across all 3 categories of Inertia! Score 90+ points to earn your official <strong>Newtonian Mechanics Credential</strong>.';
    }

    window.soundFx.playClick();
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Main Animation Loop
  let lastTime = performance.now();

  function loop(now) {
    const elapsed = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    if (isPlaying) {
      const dt = elapsed * speedMultiplier;
      if (activeTab === 'rest') {
        simRest.update(dt);
      } else if (activeTab === 'motion') {
        simMotion.update(dt);
      } else if (activeTab === 'direction') {
        simDirection.update(dt);
      }
    }

    renderCurrentSim();
    updateTelemetry();
    animId = requestAnimationFrame(loop);
  }

  function renderCurrentSim() {
    if (activeTab === 'rest') {
      simRest.render();
    } else if (activeTab === 'motion') {
      simMotion.render();
    } else if (activeTab === 'direction') {
      simDirection.render();
    } else {
      // In arena, render whichever simulation is being tested or resting
      simRest.render();
    }
  }

  // Live Telemetry Sync
  function updateTelemetry() {
    if (activeTab === 'rest') {
      const tel = simRest.getTelemetry();
      document.getElementById('tel1Label').textContent = 'Pull Acceleration';
      document.getElementById('tel1Val').textContent = `${tel.pullAccel} m/s²`;
      document.getElementById('tel2Label').textContent = 'Static Slip Threshold (μ_s · g)';
      document.getElementById('tel2Val').textContent = `${tel.maxStaticAccel} m/s²`;
      document.getElementById('tel3Label').textContent = 'Dish Net Force';
      document.getElementById('tel3Val').textContent = `${tel.netForce} N`;
      document.getElementById('tel4Label').textContent = 'Dish Shift (Δx)';
      document.getElementById('tel4Val').textContent = `${tel.objectDispCm} cm`;
    } else if (activeTab === 'motion') {
      const tel = simMotion.getTelemetry();
      document.getElementById('tel1Label').textContent = 'Vehicle Velocity';
      document.getElementById('tel1Val').textContent = `${tel.carVel} m/s (${tel.speedMph} mph)`;
      document.getElementById('tel2Label').textContent = 'Passenger Velocity';
      document.getElementById('tel2Val').textContent = `${tel.passengerVel} m/s`;
      document.getElementById('tel3Label').textContent = 'Forward Force on Passenger';
      document.getElementById('tel3Val').textContent = `${tel.forwardForce} N (ZERO!)`;
      document.getElementById('tel4Label').textContent = 'Restraining Stopping Force';
      document.getElementById('tel4Val').textContent = `${tel.restraintForce} N`;
    } else if (activeTab === 'direction') {
      const tel = simDirection.getTelemetry();
      document.getElementById('tel1Label').textContent = 'Tangential Speed (v)';
      document.getElementById('tel1Val').textContent = `${tel.tangSpeed} m/s`;
      document.getElementById('tel2Label').textContent = 'Orbit Radius (r)';
      document.getElementById('tel2Val').textContent = `${tel.radius} m`;
      document.getElementById('tel3Label').textContent = 'Inward Centripetal Accel';
      document.getElementById('tel3Val').textContent = `${tel.centripetalA} m/s²`;
      document.getElementById('tel4Label').textContent = 'String Tension Force (F_T)';
      document.getElementById('tel4Val').textContent = `${tel.tensionForce} N`;
    }
  }

  // Global Controls
  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnReset = document.getElementById('btnReset');
  const speedPills = document.querySelectorAll('.speed-pill');

  btnPlayPause.addEventListener('click', () => {
    isPlaying = !isPlaying;
    btnPlayPause.innerHTML = isPlaying ? '⏸ Pause' : '▶ Play';
    btnPlayPause.classList.toggle('active', isPlaying);
    window.soundFx.playClick();
  });

  btnReset.addEventListener('click', () => {
    if (activeTab === 'rest') simRest.reset();
    if (activeTab === 'motion') simMotion.reset();
    if (activeTab === 'direction') simDirection.reset();
    window.soundFx.playClick();
  });

  speedPills.forEach(pill => {
    pill.addEventListener('click', () => {
      speedPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      speedMultiplier = parseFloat(pill.dataset.speed);
      window.soundFx.playClick();
    });
  });

  // Header Tools: Sound
  const btnSound = document.getElementById('btnSound');
  btnSound.addEventListener('click', () => {
    const on = window.soundFx.toggle();
    btnSound.textContent = on ? '🔊 Sound: ON' : '🔇 Sound: OFF';
    btnSound.classList.toggle('active', on);
  });

  // Universal Root Font Size Switcher (Projector Mode)
  const fontBtns = document.querySelectorAll('.font-btn');
  const rootEl = document.documentElement;

  function applyFontSize(size) {
    rootEl.classList.remove('font-normal', 'font-large', 'font-huge');
    rootEl.classList.add(`font-${size}`);
    fontBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === size);
    });
    resizeCanvas();
    renderCurrentSim();
  }

  const savedFontSize = localStorage.getItem('inertia_font_size') || 'normal';
  applyFontSize(savedFontSize);

  fontBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      applyFontSize(size);
      localStorage.setItem('inertia_font_size', size);
    });
  });

  // Persistent High-Contrast Light / Dark Theme Switcher
  const btnTheme = document.getElementById('btnTheme');
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');

  function updateThemeUI(isLight) {
    if (themeIcon) themeIcon.textContent = isLight ? '🌙' : '☀️';
    if (themeText) themeText.textContent = isLight ? 'Dark Mode' : 'Light Mode';
    if (!themeIcon && !themeText && btnTheme) {
      btnTheme.textContent = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
    }
  }

  function applyTheme(isLight) {
    document.body.classList.toggle('light-theme', isLight);
    updateThemeUI(isLight);
    renderCurrentSim();
  }

  const savedTheme = localStorage.getItem('inertia_theme') || 'dark';
  applyTheme(savedTheme === 'light');

  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      const isCurrentlyLight = document.body.classList.contains('light-theme');
      const newLight = !isCurrentlyLight;
      applyTheme(newLight);
      localStorage.setItem('inertia_theme', newLight ? 'light' : 'dark');
    });
  }

  // -------------------------------------------------------------
  // CONTROLS: Category 1 (Inertia of Rest)
  // -------------------------------------------------------------
  const restAccelSlider = document.getElementById('restAccelSlider');
  const restAccelVal = document.getElementById('restAccelVal');
  const btnPullWhip = document.getElementById('btnPullWhip');
  const restMaterialSelect = document.getElementById('restMaterialSelect');
  const restDishSelect = document.getElementById('restDishSelect');
  const modeRestButtons = document.querySelectorAll('.rest-mode-btn');

  restAccelSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    restAccelVal.textContent = `${val.toFixed(1)} m/s²`;
    simRest.setPullAccel(val);
  });

  btnPullWhip.addEventListener('click', () => {
    simRest.triggerPull();
  });

  restMaterialSelect.addEventListener('change', (e) => {
    simRest.setMaterial(e.target.value);
    simRest.reset();
  });

  restDishSelect.addEventListener('change', (e) => {
    simRest.setDish(e.target.value);
  });

  modeRestButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeRestButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simRest.mode = btn.dataset.mode;
      btnPullWhip.textContent = simRest.mode === 'coin_beaker' ? '⚡ FLICK INDEX CARD!' : '⚡ WHIP TABLECLOTH!';
      simRest.reset();
      window.soundFx.playClick();
    });
  });

  // -------------------------------------------------------------
  // CONTROLS: Category 2 (Inertia of Motion)
  // -------------------------------------------------------------
  const motionSpeedSlider = document.getElementById('motionSpeedSlider');
  const motionSpeedVal = document.getElementById('motionSpeedVal');
  const btnMotionRun = document.getElementById('btnMotionRun');
  const seatbeltToggle = document.getElementById('seatbeltToggle');
  const stopTypeSelect = document.getElementById('stopTypeSelect');

  motionSpeedSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    motionSpeedVal.textContent = `${val.toFixed(0)} m/s (~${(val * 2.24).toFixed(0)} mph)`;
    simMotion.setInitialVelocity(val);
  });

  btnMotionRun.addEventListener('click', () => {
    simMotion.triggerRun();
  });

  seatbeltToggle.addEventListener('change', (e) => {
    simMotion.setSeatbelt(e.target.checked);
    window.soundFx.playClick();
  });

  stopTypeSelect.addEventListener('change', (e) => {
    simMotion.setStopType(e.target.value);
    window.soundFx.playClick();
  });

  // -------------------------------------------------------------
  // CONTROLS: Category 3 (Inertia of Direction)
  // -------------------------------------------------------------
  const dirSpeedSlider = document.getElementById('dirSpeedSlider');
  const dirSpeedVal = document.getElementById('dirSpeedVal');
  const dirRadiusSlider = document.getElementById('dirRadiusSlider');
  const dirRadiusVal = document.getElementById('dirRadiusVal');
  const btnCutString = document.getElementById('btnCutString');
  const dirModeButtons = document.querySelectorAll('.dir-mode-btn');
  const checkShowMisconception = document.getElementById('checkShowMisconception');

  dirSpeedSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    dirSpeedVal.textContent = `${val.toFixed(1)} rad/s (~${(val * 9.55).toFixed(0)} RPM)`;
    simDirection.setSpeed(val);
  });

  dirRadiusSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    dirRadiusVal.textContent = `${val.toFixed(2)} m`;
    simDirection.setRadius(val);
  });

  btnCutString.addEventListener('click', () => {
    simDirection.cutString();
  });

  dirModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      dirModeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simDirection.setMode(btn.dataset.mode);
      window.soundFx.playClick();
    });
  });

  checkShowMisconception.addEventListener('change', (e) => {
    simDirection.setShowMisconception(e.target.checked);
  });

  // -------------------------------------------------------------
  // CONTROLS: Category 4 (Mastery Challenge Arena)
  // -------------------------------------------------------------
  const btnSubmitTier1 = document.getElementById('btnSubmitTier1');
  const tier1Input = document.getElementById('tier1Input');
  const tier1Feedback = document.getElementById('tier1Feedback');

  btnSubmitTier1.addEventListener('click', () => {
    const res = challenges.submitTier1(tier1Input.value, app);
    tier1Feedback.textContent = res.message;
    tier1Feedback.className = `feedback-box ${res.success ? 'success' : 'error'}`;
    updateScoreUI();
  });

  const btnSubmitTier2 = document.getElementById('btnSubmitTier2');
  const tier2ForceSelect = document.getElementById('tier2ForceSelect');
  const tier2SpeedSelect = document.getElementById('tier2SpeedSelect');
  const tier2Feedback = document.getElementById('tier2Feedback');

  btnSubmitTier2.addEventListener('click', () => {
    const res = challenges.submitTier2(tier2ForceSelect.value, tier2SpeedSelect.value, app);
    tier2Feedback.textContent = res.message;
    tier2Feedback.className = `feedback-box ${res.success ? 'success' : 'error'}`;
    updateScoreUI();
  });

  const btnSubmitTier3 = document.getElementById('btnSubmitTier3');
  const tier3PathSelect = document.getElementById('tier3PathSelect');
  const tier3Feedback = document.getElementById('tier3Feedback');

  btnSubmitTier3.addEventListener('click', () => {
    const res = challenges.submitTier3(tier3PathSelect.value, app);
    tier3Feedback.textContent = res.message;
    tier3Feedback.className = `feedback-box ${res.success ? 'success' : 'error'}`;
    updateScoreUI();
  });

  function updateScoreUI() {
    const totalScoreEl = document.getElementById('arenaTotalScore');
    const badgeStatusEl = document.getElementById('arenaBadgeStatus');
    const score = challenges.totalScore;
    totalScoreEl.textContent = `${score} / 100`;

    if (challenges.isAllCompleted()) {
      badgeStatusEl.innerHTML = '🏆 <strong>NEWTONIAN INERTIA MASTER CERTIFIED!</strong>';
      badgeStatusEl.className = 'arena-badge badge-earned';
      document.getElementById('btnOpenCert').style.display = 'inline-block';
    }
  }

  // Certificate Modal Handlers
  const modalCert = document.getElementById('modalCert');
  const btnOpenCert = document.getElementById('btnOpenCert');
  const btnCloseCert = document.getElementById('btnCloseCert');
  const certDate = document.getElementById('certDate');
  const certStudentName = document.getElementById('certStudentName');
  const inputStudentName = document.getElementById('inputStudentName');

  btnOpenCert.addEventListener('click', () => {
    certDate.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    modalCert.classList.add('open');
    window.soundFx.playSuccess();
  });

  btnCloseCert.addEventListener('click', () => {
    modalCert.classList.remove('open');
  });

  inputStudentName.addEventListener('input', (e) => {
    certStudentName.textContent = e.target.value.trim() || 'Physics Scholar';
  });

  // Start animation loop
  loop(performance.now());
});

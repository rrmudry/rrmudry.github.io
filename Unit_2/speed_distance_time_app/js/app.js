/**
 * Speed, Distance & Time Studio - Main Application Logic
 * Compliant with strict No-LaTeX policy and NGSS HS-PS2-1.
 */

// --- Audio Synthesizer (Web Audio API) ---
const SoundEngine = {
  ctx: null,
  enabled: true,

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
  },

  playClick() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  },

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
  },

  playError() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.setValueAtTime(180, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  },

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.12 + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.12);
      osc.stop(this.ctx.currentTime + idx * 0.12 + 0.6);
    });
  }
};

// --- Global App State ---
const State = {
  currentTab: 'triangle-tab',
  selectedFormula: 'd', // 'd', 'v', or 't'
  sim: {
    distance: 20.0, // cm
    speed: 4.0, // cm/s
    time: 5.0, // s
    animId: null,
    progress: 0, // 0 to 1
    isRunning: false,
    startTime: null
  },
  practice: {
    tier: 1,
    streak: 0,
    currentProblem: null
  }
};

// --- Tab Switching ---
function switchTab(tabId) {
  State.currentTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === tabId);
  });
  SoundEngine.playClick();
  if (tabId === 'triangle-tab') {
    resizeCanvas();
    drawSimTrack();
  }
}

// --- Formula Triangle Controller ---
function selectFormulaVariable(variable) {
  State.selectedFormula = variable;
  const segD = document.getElementById('segDistance');
  const segV = document.getElementById('segSpeed');
  const segT = document.getElementById('segTime');
  const mathEl = document.getElementById('formulaMath');
  const expEl = document.getElementById('formulaExplanation');

  segD.classList.toggle('active', variable === 'd');
  segV.classList.toggle('active', variable === 'v');
  segT.classList.toggle('active', variable === 't');

  if (variable === 'd') {
    mathEl.textContent = 'd = v · t';
    expEl.innerHTML = '<strong>Solving for Distance:</strong> Multiply speed by time traveled.';
  } else if (variable === 'v') {
    mathEl.textContent = 'v = d / t';
    expEl.innerHTML = '<strong>Solving for Speed:</strong> Divide total distance by the time taken.';
  } else if (variable === 't') {
    mathEl.textContent = 't = d / v';
    expEl.innerHTML = '<strong>Solving for Time:</strong> Divide total distance by the speed.';
  }
  SoundEngine.playClick();
}

// --- Canvas Simulation Engine ---
const canvas = document.getElementById('motionCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  if (ctx) ctx.scale(dpr, dpr);
}

function updateSimTelemetry() {
  const d = parseFloat(document.getElementById('inputDistance').value);
  const v = parseFloat(document.getElementById('inputSpeed').value);
  const t = v > 0 ? d / v : 0;

  State.sim.distance = d;
  State.sim.speed = v;
  State.sim.time = t;

  document.getElementById('valDistance').textContent = d.toFixed(1) + ' cm';
  document.getElementById('valSpeed').textContent = v.toFixed(1) + ' cm/s';
  document.getElementById('telDistance').textContent = d.toFixed(1) + ' cm';
  document.getElementById('telSpeed').textContent = v.toFixed(1) + ' cm/s';
  document.getElementById('telTime').textContent = t.toFixed(2) + ' s';
}

function drawSimTrack() {
  if (!ctx || !canvas) return;
  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;
  const dpr = window.devicePixelRatio || 1;

  ctx.clearRect(0, 0, w, h);

  // Background track lines
  const trackY = h * 0.58;
  const startX = 40;
  const endX = w - 40;
  const trackLen = endX - startX;

  // Track base
  ctx.fillStyle = document.body.classList.contains('light-theme') ? '#e2e8f0' : '#1e293b';
  ctx.fillRect(startX, trackY - 4, trackLen, 8);

  // Ruler tick marks (every 10% of track)
  ctx.strokeStyle = document.body.classList.contains('light-theme') ? '#94a3b8' : '#64748b';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = document.body.classList.contains('light-theme') ? '#475569' : '#94a3b8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';

  for (let i = 0; i <= 10; i++) {
    const x = startX + (trackLen * i) / 10;
    const isMajor = i % 2 === 0;
    const tickH = isMajor ? 12 : 6;
    ctx.beginPath();
    ctx.moveTo(x, trackY + 4);
    ctx.lineTo(x, trackY + 4 + tickH);
    ctx.stroke();

    if (isMajor) {
      const cmVal = ((State.sim.distance * i) / 10).toFixed(0);
      ctx.fillText(cmVal + 'cm', x, trackY + 28);
    }
  }

  // Start & Finish Flags
  ctx.font = '16px sans-serif';
  ctx.fillText('🏁', endX + 8, trackY - 8);
  ctx.font = '12px sans-serif';
  ctx.fillText('START', startX, trackY - 14);

  // Vehicle position based on progress
  const carX = startX + trackLen * State.sim.progress;

  // Draw Trail
  if (State.sim.progress > 0) {
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startX, trackY);
    ctx.lineTo(carX, trackY);
    ctx.stroke();
  }

  // Draw Wind-Up Toy / Car
  ctx.save();
  ctx.translate(carX, trackY - 16);
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏎️', 0, 0);
  ctx.restore();

  // Elapsed Time Display on Canvas
  const elapsed = (State.sim.progress * State.sim.time).toFixed(2);
  ctx.fillStyle = '#00f2fe';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`⏱️ Elapsed: ${elapsed} s`, startX, 22);

  // Progress percentage
  ctx.textAlign = 'right';
  ctx.fillText(`${(State.sim.progress * 100).toFixed(0)}%`, endX, 22);
}

function runSimulation() {
  if (State.sim.isRunning) return;
  State.sim.isRunning = true;
  State.sim.progress = 0;
  State.sim.startTime = performance.now();
  SoundEngine.playClick();

  const totalDurationMs = Math.max(800, State.sim.time * 1000); // at least 0.8s for visual clarity

  function step(now) {
    const elapsed = now - State.sim.startTime;
    State.sim.progress = Math.min(1, elapsed / totalDurationMs);
    drawSimTrack();

    if (State.sim.progress < 1) {
      State.sim.animId = requestAnimationFrame(step);
    } else {
      State.sim.isRunning = false;
      SoundEngine.playSuccess();
    }
  }

  State.sim.animId = requestAnimationFrame(step);
}

function resetSimulation() {
  if (State.sim.animId) cancelAnimationFrame(State.sim.animId);
  State.sim.isRunning = false;
  State.sim.progress = 0;
  drawSimTrack();
  SoundEngine.playClick();
}

// --- Leveled GUESS Problem Generator & Validator ---

const ProblemGenerator = {
  // Generates randomized, realistic problems for each tier
  generate(tier) {
    let p = {};
    if (tier === 1) {
      // Calculate Speed (v = d / t)
      const distances = [12, 15, 20, 24, 30, 40, 50, 80, 100];
      const times = [2, 3, 4, 5, 8, 10];
      const d = distances[Math.floor(Math.random() * distances.length)];
      const t = times[Math.floor(Math.random() * times.length)];
      const unitD = Math.random() > 0.4 ? 'cm' : 'm';
      const speed = parseFloat((d / t).toFixed(2));

      const items = ['wind-up beetle', 'motorized tumble buggy', 'RC electric truck', 'student walking steadily', 'toy robot'];
      const item = items[Math.floor(Math.random() * items.length)];

      p = {
        tier: 1,
        prompt: `A <strong>${item}</strong> travels a total distance of <span class="highlight-val">${d} ${unitD}</span> across the classroom in exactly <span class="highlight-val">${t} s</span>. What is its constant speed?`,
        given1: d,
        givenUnit1: unitD,
        given2: t,
        givenUnit2: 's',
        unknown: 'v',
        equation: 'v = d / t',
        correctAnswer: speed,
        correctUnit: `${unitD}/s`,
        formulaHint: `Speed is distance divided by time: v = ${d} ${unitD} / ${t} s = ${speed} ${unitD}/s.`
      };
    } else if (tier === 2) {
      // Solve for Distance (d = v · t)
      const speeds = [2, 2.5, 3, 4, 5, 6, 8, 12];
      const times = [3, 4, 5, 6, 10, 12, 15];
      const v = speeds[Math.floor(Math.random() * speeds.length)];
      const t = times[Math.floor(Math.random() * times.length)];
      const unitSpeed = Math.random() > 0.5 ? 'cm/s' : 'm/s';
      const unitD = unitSpeed === 'cm/s' ? 'cm' : 'm';
      const d = parseFloat((v * t).toFixed(2));

      const scenarios = [
        `A motorized wind-up toy moves along a lab bench at a steady speed of <span class="highlight-val">${v} ${unitSpeed}</span> for <span class="highlight-val">${t} s</span>. How far does the toy travel?`,
        `A student jogs down the hallway at a constant speed of <span class="highlight-val">${v} ${unitSpeed}</span> for <span class="highlight-val">${t} s</span>. What total distance do they cover?`,
        `A small drone glides horizontally at <span class="highlight-val">${v} ${unitSpeed}</span> for <span class="highlight-val">${t} s</span>. What is its displacement?`
      ];

      p = {
        tier: 2,
        prompt: scenarios[Math.floor(Math.random() * scenarios.length)],
        given1: v,
        givenUnit1: unitSpeed,
        given2: t,
        givenUnit2: 's',
        unknown: 'd',
        equation: 'd = v * t',
        correctAnswer: d,
        correctUnit: unitD,
        formulaHint: `Distance is speed multiplied by time: d = (${v} ${unitSpeed}) · (${t} s) = ${d} ${unitD}.`
      };
    } else if (tier === 3) {
      // Solve for Time (t = d / v)
      const speeds = [2, 4, 5, 10, 20, 25];
      const times = [3, 4, 5, 6, 8, 10, 12];
      const v = speeds[Math.floor(Math.random() * speeds.length)];
      const t = times[Math.floor(Math.random() * times.length)];
      const d = v * t;
      const unitD = Math.random() > 0.5 ? 'cm' : 'm';
      const unitSpeed = `${unitD}/s`;

      const scenarios = [
        `How many seconds will it take a battery-powered car traveling at a constant speed of <span class="highlight-val">${v} ${unitSpeed}</span> to travel a track distance of <span class="highlight-val">${d} ${unitD}</span>?`,
        `A rolling soccer ball cruises at a steady <span class="highlight-val">${v} ${unitSpeed}</span>. How long will it take the ball to reach a teammate <span class="highlight-val">${d} ${unitD}</span> away?`
      ];

      p = {
        tier: 3,
        prompt: scenarios[Math.floor(Math.random() * scenarios.length)],
        given1: d,
        givenUnit1: unitD,
        given2: v,
        givenUnit2: unitSpeed,
        unknown: 't',
        equation: 't = d / v',
        correctAnswer: t,
        correctUnit: 's',
        formulaHint: `Time is distance divided by speed: t = ${d} ${unitD} / ${v} ${unitSpeed} = ${t} s.`
      };
    } else {
      // Tier 4: Mixed Master Challenge (1, 2, or 3 chosen dynamically)
      const randomSubTier = Math.floor(Math.random() * 3) + 1;
      p = this.generate(randomSubTier);
      p.tier = 4;
    }
    return p;
  }
};

function loadNewProblem() {
  const p = ProblemGenerator.generate(State.practice.tier);
  State.practice.currentProblem = p;

  document.getElementById('problemPrompt').innerHTML = p.prompt;
  document.getElementById('problemTag').textContent = `Tier ${State.practice.tier} • Challenge Problem`;

  // Reset inputs
  document.getElementById('inputGiven1').value = '';
  document.getElementById('selectGivenUnit1').value = '';
  document.getElementById('inputGiven2').value = '';
  document.getElementById('selectGivenUnit2').value = '';
  document.getElementById('selectUnknown').value = '';
  document.getElementById('selectEquation').value = '';
  document.getElementById('inputFinalAnswer').value = '';
  document.getElementById('selectFinalUnit').value = '';

  // Reset feedback
  const fb = document.getElementById('diagnosticFeedback');
  fb.className = 'diagnostic-hint';
  fb.style.display = 'none';
  fb.innerHTML = '';
}

function checkProblemAnswer() {
  const p = State.practice.currentProblem;
  if (!p) return;

  const fb = document.getElementById('diagnosticFeedback');
  const ansVal = parseFloat(document.getElementById('inputFinalAnswer').value);
  const ansUnit = document.getElementById('selectFinalUnit').value;
  const unknown = document.getElementById('selectUnknown').value;
  const eq = document.getElementById('selectEquation').value;

  if (isNaN(ansVal) || !ansUnit) {
    fb.className = 'diagnostic-hint error';
    fb.innerHTML = '⚠️ Please enter both a <strong>numerical answer</strong> and select its <strong>unit</strong>.';
    SoundEngine.playError();
    return;
  }

  // 1. Check Unknown
  if (unknown && unknown !== p.unknown) {
    fb.className = 'diagnostic-hint error';
    fb.innerHTML = `⚠️ <strong>Unknown Check:</strong> The problem asks you to find <strong>${p.unknown.toUpperCase()}</strong>, but you selected ${unknown.toUpperCase()}. Reread what the question asks!`;
    SoundEngine.playError();
    return;
  }

  // 2. Check Equation
  if (eq && eq !== p.equation) {
    fb.className = 'diagnostic-hint error';
    fb.innerHTML = `⚠️ <strong>Formula Check:</strong> To isolate the unknown, you should use <strong>${p.equation}</strong> from the formula triangle.`;
    SoundEngine.playError();
    return;
  }

  // 3. Check Numerical Answer and Unit
  const isValueCorrect = Math.abs(ansVal - p.correctAnswer) <= 0.05 * p.correctAnswer || Math.abs(ansVal - p.correctAnswer) <= 0.1;
  const isUnitCorrect = ansUnit.toLowerCase() === p.correctUnit.toLowerCase();

  if (isValueCorrect && isUnitCorrect) {
    State.practice.streak++;
    document.getElementById('streakCount').textContent = State.practice.streak;
    fb.className = 'diagnostic-hint success';
    fb.innerHTML = `🎉 <strong>Outstanding Work!</strong> That is correct! ${p.formulaHint}`;
    SoundEngine.playSuccess();

    if (State.practice.streak % 5 === 0) {
      setTimeout(() => {
        openCertificateModal();
      }, 700);
    }
  } else if (!isUnitCorrect && isValueCorrect) {
    fb.className = 'diagnostic-hint error';
    fb.innerHTML = `⚠️ <strong>Unit Check:</strong> Your numerical value (${ansVal}) is correct, but your unit (${ansUnit}) is wrong! The answer should be in <strong>${p.correctUnit}</strong>.`;
    SoundEngine.playError();
  } else {
    // Check for common conceptual misconceptions
    let customDiagnostic = '';
    if (p.unknown === 'v' && Math.abs(ansVal - (p.given1 * p.given2)) < 0.1) {
      customDiagnostic = '<br><em>Diagnostic Hint: Did you multiply distance and time? Speed is distance <strong>divided</strong> by time (v = d / t).</em>';
    } else if (p.unknown === 'd' && Math.abs(ansVal - (p.given1 / p.given2)) < 0.1) {
      customDiagnostic = '<br><em>Diagnostic Hint: Did you divide instead of multiply? Distance is speed <strong>multiplied</strong> by time (d = v · t).</em>';
    } else if (p.unknown === 't' && Math.abs(ansVal - (p.given1 * p.given2)) < 0.1) {
      customDiagnostic = '<br><em>Diagnostic Hint: Did you multiply distance and speed? Time is distance <strong>divided</strong> by speed (t = d / v).</em>';
    }

    fb.className = 'diagnostic-hint error';
    fb.innerHTML = `❌ <strong>Not quite.</strong> Check your calculation and formula triangle.${customDiagnostic}`;
    SoundEngine.playError();
  }
}

// --- Certificate Modal ---
function openCertificateModal() {
  const modal = document.getElementById('certModal');
  if (!modal) return;
  document.getElementById('certDate').textContent = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  modal.classList.add('open');
  SoundEngine.playFanfare();
}

function closeCertificateModal() {
  const modal = document.getElementById('certModal');
  if (modal) modal.classList.remove('open');
  SoundEngine.playClick();
}

// --- Initialization & Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Tab Listeners
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // 2. Triangle Segment Clicks
  const segD = document.getElementById('segDistance');
  const segV = document.getElementById('segSpeed');
  const segT = document.getElementById('segTime');
  if (segD) segD.addEventListener('click', () => selectFormulaVariable('d'));
  if (segV) segV.addEventListener('click', () => selectFormulaVariable('v'));
  if (segT) segT.addEventListener('click', () => selectFormulaVariable('t'));

  // 3. Slider Listeners
  const inputD = document.getElementById('inputDistance');
  const inputV = document.getElementById('inputSpeed');
  if (inputD) {
    inputD.addEventListener('input', () => {
      updateSimTelemetry();
      drawSimTrack();
    });
  }
  if (inputV) {
    inputV.addEventListener('input', () => {
      updateSimTelemetry();
      drawSimTrack();
    });
  }

  // 4. Simulation Action Buttons
  const btnRun = document.getElementById('btnRunSim');
  const btnReset = document.getElementById('btnResetSim');
  if (btnRun) btnRun.addEventListener('click', runSimulation);
  if (btnReset) btnReset.addEventListener('click', resetSimulation);

  // 5. Tier Buttons
  document.querySelectorAll('.tier-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.practice.tier = parseInt(btn.dataset.tier);
      loadNewProblem();
      SoundEngine.playClick();
    });
  });

  // 6. Practice Action Buttons
  const btnCheck = document.getElementById('btnCheckAnswer');
  const btnNew = document.getElementById('btnNewProblem');
  if (btnCheck) btnCheck.addEventListener('click', checkProblemAnswer);
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      loadNewProblem();
      SoundEngine.playClick();
    });
  }

  // 7. Certificate Buttons
  const btnPrint = document.getElementById('btnPrintCert');
  const btnClose = document.getElementById('btnCloseCert');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }
  if (btnClose) btnClose.addEventListener('click', closeCertificateModal);

  // 8. Theme Toggle
  const btnTheme = document.getElementById('btnThemeToggle');
  if (btnTheme) {
    const savedTheme = localStorage.getItem('physics-theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      document.getElementById('themeIcon').textContent = '🌙';
    }
    btnTheme.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      document.getElementById('themeIcon').textContent = isLight ? '🌙' : '☀️';
      localStorage.setItem('physics-theme', isLight ? 'light' : 'dark');
      drawSimTrack();
      SoundEngine.playClick();
    });
  }

  // 9. Sound Toggle
  const btnSound = document.getElementById('btnSoundToggle');
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      SoundEngine.enabled = !SoundEngine.enabled;
      document.getElementById('soundIcon').textContent = SoundEngine.enabled ? '🔊' : '🔇';
      if (SoundEngine.enabled) SoundEngine.playClick();
    });
  }

  // 10. Initial Canvas & Problem Setup
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawSimTrack();
  });

  updateSimTelemetry();
  resizeCanvas();
  drawSimTrack();
  loadNewProblem();
});

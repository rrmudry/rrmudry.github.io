/**
 * LabEngine - Main Logic & Graphing for Graphing Pull-Back Toy Motion Lab
 * Enforces CAST alignment, productive friction, and dynamic x vs t curve rendering.
 */

class PullBackLabEngine {
  constructor() {
    this.distances = [0.0, 20.0, 40.0, 60.0, 80.0, 100.0]; // cm
    this.times = [0.0, null, null, null, null, null]; // seconds
    this.useMeters = false; // toggle between cm and m

    this.calcValues = {
      vAvg: null,
      vFinal: null,
      accel: null
    };

    this.calcStatus = {
      vAvg: false,
      vFinal: false,
      accel: false
    };

    this.desmosCalculator = null;
    this.init();
  }

  init() {
    this.bindTableInputs();
    this.bindCalcInputs();
    this.bindButtons();
    this.initCanvasGraph();
    this.initDesmos();
    this.loadLocalDraft();
    this.updateUI();
  }

  // -------------------------------------------------------------
  // Data Table & Time Entry
  // -------------------------------------------------------------
  bindTableInputs() {
    for (let i = 1; i <= 5; i++) {
      const input = document.getElementById(`time-input-${i}`);
      if (input) {
        input.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          this.times[i] = !isNaN(val) && val > 0 ? val : null;
          this.validateTimes();
          this.computeIntervalSpeeds();
          this.renderGraph();
          this.saveLocalDraft();
          this.updateUI();
        });
      }
    }
  }

  insertStopwatchTime(markerIndex, seconds) {
    if (markerIndex >= 1 && markerIndex <= 5) {
      const input = document.getElementById(`time-input-${markerIndex}`);
      if (input) {
        input.value = seconds;
        this.times[markerIndex] = parseFloat(seconds);
        this.validateTimes();
        this.computeIntervalSpeeds();
        this.renderGraph();
        this.saveLocalDraft();
        this.updateUI();
      }
    }
  }

  validateTimes() {
    let isValid = true;
    let errorMsg = "";

    // Check if times are strictly increasing
    for (let i = 1; i <= 5; i++) {
      const input = document.getElementById(`time-input-${i}`);
      if (!input) continue;

      const current = this.times[i];
      const prev = this.times[i - 1] !== null ? this.times[i - 1] : 0;

      if (current === null) {
        input.classList.remove('valid', 'invalid');
        isValid = false;
      } else if (current <= prev) {
        input.classList.remove('valid');
        input.classList.add('invalid');
        isValid = false;
        errorMsg = `Time at ${this.distances[i]} cm must be greater than previous time (${prev} s).`;
      } else {
        input.classList.remove('invalid');
        input.classList.add('valid');
      }
    }

    const warnEl = document.getElementById('table-validation-msg');
    if (warnEl) {
      if (errorMsg) {
        warnEl.textContent = `⚠️ ${errorMsg}`;
        warnEl.classList.remove('hidden');
      } else {
        warnEl.classList.add('hidden');
      }
    }

    return isValid;
  }

  computeIntervalSpeeds() {
    for (let i = 1; i <= 5; i++) {
      const cell = document.getElementById(`speed-interval-${i}`);
      if (!cell) continue;

      const tCurrent = this.times[i];
      const tPrev = this.times[i - 1];

      if (tCurrent !== null && tPrev !== null && tCurrent > tPrev) {
        const deltaX = this.distances[i] - this.distances[i - 1]; // 20 cm
        const deltaT = tCurrent - tPrev;
        const speed = (deltaX / deltaT).toFixed(1);
        cell.textContent = `${speed} cm/s`;
        cell.className = 'px-3 py-2 text-right font-mono font-bold text-sky-400';
      } else {
        cell.textContent = '--';
        cell.className = 'px-3 py-2 text-right font-mono text-slate-500';
      }
    }
  }

  // -------------------------------------------------------------
  // Kinematic Calculations Verification
  // -------------------------------------------------------------
  bindCalcInputs() {
    const btnCheckVAvg = document.getElementById('btn-check-vavg');
    const btnCheckVFinal = document.getElementById('btn-check-vfinal');
    const btnCheckAccel = document.getElementById('btn-check-accel');

    if (btnCheckVAvg) btnCheckVAvg.onclick = () => this.checkVAvg();
    if (btnCheckVFinal) btnCheckVFinal.onclick = () => this.checkVFinal();
    if (btnCheckAccel) btnCheckAccel.onclick = () => this.checkAccel();

    // Auto check on enter
    ['input-vavg', 'input-vfinal', 'input-accel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            if (id === 'input-vavg') this.checkVAvg();
            if (id === 'input-vfinal') this.checkVFinal();
            if (id === 'input-accel') this.checkAccel();
          }
        });
      }
    });
  }

  checkVAvg() {
    const input = document.getElementById('input-vavg');
    const feedback = document.getElementById('feedback-vavg');
    const tFinal = this.times[5];

    if (!tFinal || tFinal <= 0) {
      this.showFeedback(feedback, 'error', '⚠️ Record your time at 100 cm (Row 5) in the data table first!');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    const userVal = parseFloat(input.value);
    if (isNaN(userVal) || userVal <= 0) {
      this.showFeedback(feedback, 'error', '⚠️ Enter your calculated average speed value.');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    // Expected: 100 cm / tFinal (or 1.0 m / tFinal if student used meters)
    const expectedCm = 100.0 / tFinal;
    const expectedM = 1.0 / tFinal;

    const isMatchCm = Math.abs(userVal - expectedCm) / expectedCm <= 0.08;
    const isMatchM = Math.abs(userVal - expectedM) / expectedM <= 0.08;

    if (isMatchCm || isMatchM) {
      this.calcStatus.vAvg = true;
      this.calcValues.vAvg = userVal;
      input.classList.remove('invalid');
      input.classList.add('valid');
      const units = isMatchM ? 'm/s' : 'cm/s';
      this.showFeedback(feedback, 'success', `✅ Correct! Average speed = ${userVal} ${units} (Δx / Δt = 100 cm / ${tFinal} s).`);
      if (window.labSound) window.labSound.playSuccess();
    } else {
      this.calcStatus.vAvg = false;
      input.classList.remove('valid');
      input.classList.add('invalid');
      this.showFeedback(feedback, 'error', `⚠️ Not quite. Use v_avg = Δx / Δt. Total distance is 100 cm and total time is ${tFinal} s. (Expected ~${expectedCm.toFixed(1)} cm/s).`);
      if (window.labSound) window.labSound.playWarning();
    }
    this.saveLocalDraft();
    this.updateUI();
  }

  checkVFinal() {
    const input = document.getElementById('input-vfinal');
    const feedback = document.getElementById('feedback-vfinal');

    if (!this.calcStatus.vAvg) {
      this.showFeedback(feedback, 'error', '⚠️ Calculate and verify your Average Speed in Step 1 first!');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    const userVal = parseFloat(input.value);
    if (isNaN(userVal) || userVal <= 0) {
      this.showFeedback(feedback, 'error', '⚠️ Enter your calculated final speed value.');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    // Expected: v_f = 2 * v_avg (since v_0 = 0)
    const expected = 2.0 * this.calcValues.vAvg;
    const isMatch = Math.abs(userVal - expected) / expected <= 0.08;

    if (isMatch) {
      this.calcStatus.vFinal = true;
      this.calcValues.vFinal = userVal;
      input.classList.remove('invalid');
      input.classList.add('valid');
      this.showFeedback(feedback, 'success', `✅ Spot on! Because the car starts from rest (v₀ = 0), v_f = 2 · v_avg = ${userVal}.`);
      if (window.labSound) window.labSound.playSuccess();
    } else {
      this.calcStatus.vFinal = false;
      input.classList.remove('valid');
      input.classList.add('invalid');
      this.showFeedback(feedback, 'error', `⚠️ Hint: v_avg = (v₀ + v_f) / 2. Since v₀ = 0, v_f = 2 · v_avg. Multiply your average speed (${this.calcValues.vAvg}) by 2!`);
      if (window.labSound) window.labSound.playWarning();
    }
    this.saveLocalDraft();
    this.updateUI();
  }

  checkAccel() {
    const input = document.getElementById('input-accel');
    const feedback = document.getElementById('feedback-accel');
    const tFinal = this.times[5];

    if (!this.calcStatus.vFinal) {
      this.showFeedback(feedback, 'error', '⚠️ Calculate and verify your Final Speed in Step 2 first!');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    const userVal = parseFloat(input.value);
    if (isNaN(userVal) || userVal <= 0) {
      this.showFeedback(feedback, 'error', '⚠️ Enter your calculated acceleration value.');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    // Expected: a = (v_f - v_0) / tFinal = v_final / tFinal
    const expected = this.calcValues.vFinal / tFinal;
    const isMatch = Math.abs(userVal - expected) / expected <= 0.08;

    if (isMatch) {
      this.calcStatus.accel = true;
      this.calcValues.accel = userVal;
      input.classList.remove('invalid');
      input.classList.add('valid');
      this.showFeedback(feedback, 'success', `✅ Outstanding! Acceleration a = ${userVal} (v_f / t = ${this.calcValues.vFinal} / ${tFinal} s).`);
      if (window.labSound) window.labSound.playSuccess();
      this.renderGraph(); // updates graph with fitted acceleration line!
    } else {
      this.calcStatus.accel = false;
      input.classList.remove('valid');
      input.classList.add('invalid');
      this.showFeedback(feedback, 'error', `⚠️ Check your math: a = (v_f - v₀) / t = ${this.calcValues.vFinal} / ${tFinal} s. (Expected ~${expected.toFixed(1)}).`);
      if (window.labSound) window.labSound.playWarning();
    }
    this.saveLocalDraft();
    this.updateUI();
  }

  showFeedback(el, type, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden', 'text-emerald-400', 'text-rose-400', 'text-amber-400');
    if (type === 'success') {
      el.classList.add('text-emerald-400');
    } else {
      el.classList.add('text-rose-400');
    }
  }

  // -------------------------------------------------------------
  // Interactive Canvas Graph
  // -------------------------------------------------------------
  initCanvasGraph() {
    this.canvas = document.getElementById('motion-graph-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Handle high DPI
    const resize = () => {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.renderGraph();
    };

    window.addEventListener('resize', resize);
    setTimeout(resize, 50);
  }

  renderGraph() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const isLight = document.documentElement.classList.contains('light');

    ctx.clearRect(0, 0, width, height);

    if (isLight) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    const padLeft = 60;
    const padBottom = 40;
    const padTop = 25;
    const padRight = 30;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Time domain: 0 to max(2.0, t5 * 1.25)
    const t5 = this.times[5] || 1.5;
    const maxTime = Math.max(2.0, Math.ceil(t5 * 1.25 * 10) / 10);
    const maxDist = 100.0; // cm

    const toX = (t) => padLeft + (t / maxTime) * plotW;
    const toY = (d) => padTop + plotH - (d / maxDist) * plotH;

    // Draw Gridlines
    ctx.lineWidth = 1;
    ctx.strokeStyle = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.08)';

    // Vertical time gridlines
    const tStep = maxTime <= 2.5 ? 0.2 : 0.5;
    ctx.fillStyle = isLight ? '#0f172a' : '#94a3b8';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    for (let t = 0; t <= maxTime + 0.01; t += tStep) {
      const xPos = toX(t);
      ctx.beginPath();
      ctx.moveTo(xPos, padTop);
      ctx.lineTo(xPos, padTop + plotH);
      ctx.stroke();

      ctx.fillText(t.toFixed(1), xPos, padTop + plotH + 18);
    }

    // Horizontal distance gridlines (every 20 cm)
    ctx.textAlign = 'right';
    for (let d = 0; d <= 100; d += 20) {
      const yPos = toY(d);
      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(padLeft + plotW, yPos);
      ctx.stroke();

      ctx.fillText(`${d}`, padLeft - 10, yPos + 4);
    }

    // Axis Lines
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isLight ? '#0f172a' : 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    // Y axis
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, padTop + plotH);
    // X axis
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.stroke();

    // Axis Labels
    ctx.font = 'bold 13px "Outfit", sans-serif';
    ctx.fillStyle = isLight ? '#0369a1' : '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('Time t (seconds)', padLeft + plotW / 2, height - 6);

    ctx.save();
    ctx.translate(16, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Distance x (cm)', 0, 0);
    ctx.restore();

    // Theoretical Constant Acceleration Curve if calculated: x(t) = 0.5 * a * t^2
    const accel = this.calcValues.accel;
    if (accel && accel > 0) {
      ctx.save();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isLight ? '#0284c7' : 'rgba(56, 189, 248, 0.5)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      for (let px = 0; px <= plotW; px += 4) {
        const t = (px / plotW) * maxTime;
        const d = 0.5 * accel * t * t;
        if (d > 105) break;
        const xPos = toX(t);
        const yPos = toY(d);
        if (px === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
      }
      ctx.stroke();
      ctx.restore();

      // Legend note
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = isLight ? '#0369a1' : 'rgba(56, 189, 248, 0.9)';
      ctx.textAlign = 'left';
      ctx.fillText(`Theoretical Curve: x = ½at² (a = ${accel.toFixed(1)} cm/s²)`, padLeft + 10, padTop + 16);
    }

    // Average Speed Secant Line (from (0,0) to (t5, 100))
    if (this.times[5] && this.times[5] > 0) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isLight ? '#b45309' : 'rgba(245, 158, 11, 0.6)';
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(0));
      ctx.lineTo(toX(this.times[5]), toY(100));
      ctx.stroke();
      ctx.restore();
    }

    // Plot Student Points
    const validPoints = [];
    for (let i = 0; i <= 5; i++) {
      const t = this.times[i];
      const d = this.distances[i];
      if (t !== null && !isNaN(t)) {
        validPoints.push({ t, d, index: i });
      }
    }

    // Connect student points with solid bold line
    if (validPoints.length > 1) {
      ctx.save();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = isLight ? '#0284c7' : '#38bdf8';
      ctx.beginPath();
      validPoints.forEach((pt, idx) => {
        const xPos = toX(pt.t);
        const yPos = toY(pt.d);
        if (idx === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Draw Coordinate Dots with readable label pill
    validPoints.forEach((pt) => {
      const xPos = toX(pt.t);
      const yPos = toY(pt.d);

      ctx.save();
      if (!isLight) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(xPos, yPos, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(xPos, yPos, 3, 0, Math.PI * 2);
      ctx.fill();

      // Coordinate text pill above dot
      const coordText = `(${pt.t}s, ${pt.d}cm)`;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      const textW = ctx.measureText(coordText).width;

      if (isLight) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(xPos - textW / 2 - 3, yPos - 21, textW + 6, 13);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(xPos - textW / 2 - 3, yPos - 21, textW + 6, 13);
        ctx.fillStyle = '#0f172a';
      } else {
        ctx.fillStyle = '#e2e8f0';
      }
      ctx.textAlign = 'center';
      ctx.fillText(coordText, xPos, yPos - 11);
      ctx.restore();
    });
  }

  // -------------------------------------------------------------
  // Desmos Scientific Calculator Drawer
  // -------------------------------------------------------------
  initDesmos() {
    const drawer = document.getElementById('desmos-drawer');
    const btnToggle = document.getElementById('btn-toggle-calculator');
    const btnClose = document.getElementById('btn-close-desmos');

    if (btnToggle && drawer) {
      btnToggle.onclick = () => {
        drawer.classList.toggle('open');
        if (drawer.classList.contains('open') && !this.desmosCalculator) {
          const calcContainer = document.getElementById('desmos-calculator-container');
          if (calcContainer && typeof Desmos !== 'undefined') {
            this.desmosCalculator = Desmos.ScientificCalculator(calcContainer, {
              fontSize: 14,
              keypad: true
            });
          }
        }
      };
    }

    if (btnClose && drawer) {
      btnClose.onclick = () => drawer.classList.remove('open');
    }
  }

  // -------------------------------------------------------------
  // UI & Submit Progress
  // -------------------------------------------------------------
  bindButtons() {
    const btnSubmit = document.getElementById('btn-submit-lab');
    if (btnSubmit) {
      btnSubmit.onclick = () => this.handleLabSubmit();
    }

    const soundToggle = document.getElementById('btn-sound-toggle');
    if (soundToggle) {
      soundToggle.onclick = () => {
        const isMuted = window.labSound.toggleMute();
        soundToggle.textContent = isMuted ? '🔇' : '🔊';
      };
    }

    const themeToggle = document.getElementById('btn-theme-toggle');
    if (themeToggle) {
      themeToggle.onclick = () => {
        document.documentElement.classList.toggle('light');
        const isLight = document.documentElement.classList.contains('light');
        themeToggle.textContent = isLight ? '🌙' : '☀️';
        this.renderGraph();
      };
    }
  }

  updateUI() {
    const allTimesEntered = this.times.slice(1).every(t => t !== null && t > 0);
    const calcsComplete = this.calcStatus.vAvg && this.calcStatus.vFinal && this.calcStatus.accel;

    // Progress Bar
    let progress = 0;
    if (this.times[1] !== null) progress += 10;
    if (this.times[2] !== null) progress += 10;
    if (this.times[3] !== null) progress += 10;
    if (this.times[4] !== null) progress += 10;
    if (this.times[5] !== null) progress += 10;
    if (this.calcStatus.vAvg) progress += 15;
    if (this.calcStatus.vFinal) progress += 15;
    if (this.calcStatus.accel) progress += 20;

    const bar = document.getElementById('lab-progress-bar');
    const label = document.getElementById('lab-progress-label');
    if (bar) bar.style.width = `${progress}%`;
    if (label) label.textContent = `${progress}% Complete`;

    // Unlock Submit Button
    const btnSubmit = document.getElementById('btn-submit-lab');
    if (btnSubmit) {
      if (allTimesEntered && calcsComplete) {
        btnSubmit.disabled = false;
        btnSubmit.classList.remove('opacity-50', 'cursor-not-allowed');
        btnSubmit.classList.add('animate-bounce');
      } else {
        btnSubmit.disabled = true;
        btnSubmit.classList.add('opacity-50', 'cursor-not-allowed');
        btnSubmit.classList.remove('animate-bounce');
      }
    }
  }

  async handleLabSubmit() {
    const allTimesEntered = this.times.slice(1).every(t => t !== null && t > 0);
    const calcsComplete = this.calcStatus.vAvg && this.calcStatus.vFinal && this.calcStatus.accel;

    if (!allTimesEntered || !calcsComplete) {
      alert("Please complete the data table and verify all three kinematic calculations before submitting.");
      return;
    }

    const labReport = {
      distances: this.distances,
      times: this.times,
      calcValues: this.calcValues,
      submittedAt: new Date().toISOString()
    };

    const success = await window.labAuth.submitLabGrade(labReport);
    if (success) {
      if (typeof confetti === 'function') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
      if (window.labSound) window.labSound.playSuccess();

      const modal = document.getElementById('submit-success-modal');
      if (modal) modal.classList.remove('hidden');
    }
  }

  // -------------------------------------------------------------
  // Local Draft Persistence
  // -------------------------------------------------------------
  saveLocalDraft() {
    const draft = {
      times: this.times,
      calcValues: this.calcValues,
      calcStatus: this.calcStatus
    };
    try {
      localStorage.setItem('pull_back_toy_draft', JSON.stringify(draft));
    } catch (e) {}
  }

  loadLocalDraft() {
    try {
      const raw = localStorage.getItem('pull_back_toy_draft');
      if (raw) {
        const draft = JSON.parse(raw);
        this.restoreSavedState(draft);
      }
    } catch (e) {}
  }

  restoreSavedState(state) {
    if (!state) return;
    if (state.times) {
      this.times = state.times;
      for (let i = 1; i <= 5; i++) {
        const input = document.getElementById(`time-input-${i}`);
        if (input && this.times[i] !== null) {
          input.value = this.times[i];
        }
      }
      this.validateTimes();
      this.computeIntervalSpeeds();
    }
    if (state.calcValues) {
      this.calcValues = state.calcValues;
      if (state.calcValues.vAvg) document.getElementById('input-vavg').value = state.calcValues.vAvg;
      if (state.calcValues.vFinal) document.getElementById('input-vfinal').value = state.calcValues.vFinal;
      if (state.calcValues.accel) document.getElementById('input-accel').value = state.calcValues.accel;
    }
    if (state.calcStatus) {
      this.calcStatus = state.calcStatus;
      if (this.calcStatus.vAvg) {
        const el = document.getElementById('input-vavg');
        el.classList.add('valid');
        this.showFeedback(document.getElementById('feedback-vavg'), 'success', '✅ Verified');
      }
      if (this.calcStatus.vFinal) {
        const el = document.getElementById('input-vfinal');
        el.classList.add('valid');
        this.showFeedback(document.getElementById('feedback-vfinal'), 'success', '✅ Verified');
      }
      if (this.calcStatus.accel) {
        const el = document.getElementById('input-accel');
        el.classList.add('valid');
        this.showFeedback(document.getElementById('feedback-accel'), 'success', '✅ Verified');
      }
    }
    this.renderGraph();
    this.updateUI();
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.labEngine = new PullBackLabEngine();
  window.labStopwatch = new PrecisionStopwatch('stopwatch-display', {
    toggleBtnId: 'btn-stopwatch-toggle',
    resetBtnId: 'btn-stopwatch-reset',
    lapBtnId: 'btn-stopwatch-lap',
    lapsListId: 'stopwatch-laps-list'
  });
});

/**
 * LabEngine - Main Logic & Graphing for Graphing Pull-Back Toy Motion Lab
 * Enforces CAST alignment, productive friction, and dynamic x vs t curve rendering.
 */

class PullBackLabEngine {
  constructor() {
    this.distances = [0.0, 20.0, 40.0, 60.0, 80.0, 100.0]; // cm
    this.rawTimes = [null, null, null, null, null, null]; // seconds from video/stopwatch
    this.times = [0.0, null, null, null, null, null]; // zeroed elapsed seconds (t_raw - t0)
    this.currentStep = 1;
    this.totalSteps = 5;

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
    this.activeGraphMode = 'xt'; // 'xt' (distance) or 'vt' (velocity)
    this.init();
  }

  init() {
    this.initStepper();
    this.bindTableInputs();
    this.bindCalcInputs();
    this.bindButtons();
    this.initCanvasGraph();
    this.initDesmos();
    this.loadLocalDraft();
    this.updateUI();
  }

  // -------------------------------------------------------------
  // Step 1: Sequential Procedure Stepper
  // -------------------------------------------------------------
  initStepper() {
    const tabBtns = document.querySelectorAll('#stepper-tabs .step-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.dataset.step, 10);
        if (step) this.goToStep(step);
      });
    });

    const btnPrev = document.getElementById('btn-prev-step');
    const btnNext = document.getElementById('btn-next-step');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (this.currentStep > 1) {
          this.goToStep(this.currentStep - 1);
        }
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (this.currentStep < this.totalSteps) {
          this.goToStep(this.currentStep + 1);
        } else {
          // If on last step, smooth scroll down to data table
          const tableEl = document.getElementById('time-input-0');
          if (tableEl) {
            tableEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            tableEl.focus();
          }
        }
      });
    }

    this.updateStepperUI();
  }

  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;
    if (window.labTTS) window.labTTS.stop();
    this.currentStep = step;
    this.updateStepperUI();
    if (window.labSound) window.labSound.playClick();
    this.saveLocalDraft();
  }

  updateStepperUI() {
    for (let i = 1; i <= this.totalSteps; i++) {
      const panel = document.getElementById(`step-panel-${i}`);
      if (panel) {
        if (i === this.currentStep) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      }

      const tabBtn = document.querySelector(`#stepper-tabs button[data-step="${i}"]`);
      if (tabBtn) {
        if (i === this.currentStep) {
          tabBtn.classList.add('active');
        } else {
          tabBtn.classList.remove('active');
        }
        if (i < this.currentStep) {
          tabBtn.classList.add('completed');
        } else {
          tabBtn.classList.remove('completed');
        }
      }

      const dot = document.querySelector(`#stepper-dots .dot-${i}`);
      if (dot) {
        if (i === this.currentStep) {
          dot.className = `w-2.5 h-2.5 rounded-full bg-sky-400 dot-${i}`;
        } else if (i < this.currentStep) {
          dot.className = `w-2.5 h-2.5 rounded-full bg-emerald-400/80 dot-${i}`;
        } else {
          dot.className = `w-2.5 h-2.5 rounded-full bg-white/20 dot-${i}`;
        }
      }
    }

    const btnPrev = document.getElementById('btn-prev-step');
    const btnNext = document.getElementById('btn-next-step');
    if (btnPrev) {
      btnPrev.disabled = this.currentStep === 1;
    }
    if (btnNext) {
      if (this.currentStep === this.totalSteps) {
        btnNext.textContent = 'Go to Data Table ⬇';
        btnNext.className = 'px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm';
      } else {
        btnNext.textContent = 'Next Step ➔';
        btnNext.className = 'px-3.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-sm';
      }
    }
  }

  // -------------------------------------------------------------
  // Data Table & Time Entry with Time Zeroing Subtraction
  // -------------------------------------------------------------
  bindTableInputs() {
    for (let i = 0; i <= 5; i++) {
      const input = document.getElementById(`time-input-${i}`);
      if (input) {
        input.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          this.rawTimes[i] = !isNaN(val) && val >= 0 ? val : null;
          this.computeZeroedTimes();
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
    if (markerIndex >= 0 && markerIndex <= 5) {
      const input = document.getElementById(`time-input-${markerIndex}`);
      if (input) {
        input.value = seconds;
        this.rawTimes[markerIndex] = parseFloat(seconds);
        this.computeZeroedTimes();
        this.validateTimes();
        this.computeIntervalSpeeds();
        this.renderGraph();
        this.saveLocalDraft();
        this.updateUI();
      }
    }
  }

  computeZeroedTimes() {
    const t0 = this.rawTimes[0];
    const zeroedCell0 = document.getElementById('zeroed-time-0');
    if (zeroedCell0) {
      zeroedCell0.textContent = t0 !== null ? '0.00 s' : '--';
    }

    if (t0 === null) {
      this.times = [null, null, null, null, null, null];
      for (let i = 1; i <= 5; i++) {
        const cell = document.getElementById(`zeroed-time-${i}`);
        if (cell) cell.textContent = '--';
      }
      return;
    }

    this.times[0] = 0.0;

    for (let i = 1; i <= 5; i++) {
      const raw = this.rawTimes[i];
      const cell = document.getElementById(`zeroed-time-${i}`);
      if (raw !== null && raw > t0) {
        const zeroed = +(raw - t0).toFixed(2);
        this.times[i] = zeroed;
        if (cell) {
          cell.textContent = `${zeroed.toFixed(2)} s`;
        }
      } else {
        this.times[i] = null;
        if (cell) cell.textContent = '--';
      }
    }
  }

  validateTimes() {
    let isValid = true;
    let errorMsg = "";

    const t0Input = document.getElementById('time-input-0');
    if (t0Input) {
      if (this.rawTimes[0] === null) {
        t0Input.classList.remove('valid', 'invalid');
        isValid = false;
      } else if (this.rawTimes[0] < 0) {
        t0Input.classList.add('invalid');
        isValid = false;
        errorMsg = "Start Time (t₀) cannot be negative.";
      } else {
        t0Input.classList.remove('invalid');
        t0Input.classList.add('valid');
      }
    }

    for (let i = 1; i <= 5; i++) {
      const input = document.getElementById(`time-input-${i}`);
      if (!input) continue;

      const current = this.rawTimes[i];
      const prev = this.rawTimes[i - 1];

      if (current === null) {
        input.classList.remove('valid', 'invalid');
        isValid = false;
      } else if (prev === null) {
        input.classList.remove('valid');
        input.classList.add('invalid');
        isValid = false;
        if (!errorMsg) errorMsg = `Enter Start Time (t₀) and previous marker times first.`;
      } else if (current <= prev) {
        input.classList.remove('valid');
        input.classList.add('invalid');
        isValid = false;
        if (!errorMsg) {
          const prevLabel = i === 1 ? `Start Time t₀ (${prev} s)` : `time at ${this.distances[i-1]} cm (${prev} s)`;
          errorMsg = `Time at ${this.distances[i]} cm (${current} s) must be greater than ${prevLabel}.`;
        }
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

      const tCurrent = this.rawTimes[i];
      const tPrev = this.rawTimes[i - 1];

      if (tCurrent !== null && tPrev !== null && tCurrent > tPrev) {
        const deltaX = this.distances[i] - this.distances[i - 1]; // 20.0 cm
        const deltaT = tCurrent - tPrev;
        const speed = (deltaX / deltaT).toFixed(1);
        cell.textContent = `${speed} cm/s`;
        cell.className = (i === 5)
          ? 'py-2 px-1 text-right font-mono font-black text-amber-300 whitespace-nowrap text-xs sm:text-sm'
          : 'py-2 px-1 text-right font-mono font-bold text-sky-400 whitespace-nowrap text-xs sm:text-sm';
      } else {
        cell.textContent = '--';
        cell.className = 'py-2 px-1 text-right font-mono text-slate-400 font-semibold whitespace-nowrap text-xs sm:text-sm';
      }
    }
  }

  // -------------------------------------------------------------
  // Kinematic Calculations Verification (Using Zeroed Elapsed Times)
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
    const tFinalZeroed = this.times[5]; // zeroed elapsed time to 100 cm

    if (!tFinalZeroed || tFinalZeroed <= 0) {
      this.showFeedback(feedback, 'error', '⚠️ Record your Start Time (t₀) and 100 cm time in the data table first!');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    const userVal = parseFloat(input.value);
    if (isNaN(userVal) || userVal <= 0) {
      this.showFeedback(feedback, 'error', '⚠️ Enter your calculated average speed value.');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    // Expected: 100 cm / tFinalZeroed
    const expectedCm = 100.0 / tFinalZeroed;
    const expectedM = 1.0 / tFinalZeroed;

    const isMatchCm = Math.abs(userVal - expectedCm) / expectedCm <= 0.08;
    const isMatchM = Math.abs(userVal - expectedM) / expectedM <= 0.08;

    if (isMatchCm || isMatchM) {
      this.calcStatus.vAvg = true;
      this.calcValues.vAvg = userVal;
      input.classList.remove('invalid');
      input.classList.add('valid');
      const units = isMatchM ? 'm/s' : 'cm/s';
      this.showFeedback(feedback, 'success', `✅ Correct! Average speed = ${userVal} ${units} (Δx / Δt = 100 cm / ${tFinalZeroed.toFixed(2)} s).`);
      if (window.labSound) window.labSound.playSuccess();
    } else {
      this.calcStatus.vAvg = false;
      input.classList.remove('valid');
      input.classList.add('invalid');
      const rawT0 = this.rawTimes[0] !== null ? `${this.rawTimes[0]}s` : 't₀';
      const rawT5 = this.rawTimes[5] !== null ? `${this.rawTimes[5]}s` : 't₅';
      this.showFeedback(feedback, 'error', `⚠️ Not quite. Use v<sub>avg</sub> = Δx / Δt. Total distance is 100 cm and zeroed elapsed time is ${tFinalZeroed.toFixed(2)} s (${rawT5} − ${rawT0}). (Expected ~${expectedCm.toFixed(1)} cm/s).`);
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
      this.showFeedback(feedback, 'success', `✅ Spot on! Because the car starts from rest (v₀ = 0), v<sub>f</sub> = 2 · v<sub>avg</sub> = ${userVal}.`);
      if (window.labSound) window.labSound.playSuccess();
    } else {
      this.calcStatus.vFinal = false;
      input.classList.remove('valid');
      input.classList.add('invalid');
      this.showFeedback(feedback, 'error', `⚠️ Hint: v<sub>avg</sub> = (v₀ + v<sub>f</sub>) / 2. Since v₀ = 0, v<sub>f</sub> = 2 · v<sub>avg</sub>. Multiply your average speed (${this.calcValues.vAvg}) by 2!`);
      if (window.labSound) window.labSound.playWarning();
    }
    this.saveLocalDraft();
    this.updateUI();
  }

  checkAccel() {
    const input = document.getElementById('input-accel');
    const feedback = document.getElementById('feedback-accel');
    const tFinalZeroed = this.times[5];

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

    // Expected: a = (v_f - v_0) / tFinalZeroed = v_final / tFinalZeroed
    const expected = this.calcValues.vFinal / tFinalZeroed;
    const isMatch = Math.abs(userVal - expected) / expected <= 0.08;

    if (isMatch) {
      this.calcStatus.accel = true;
      this.calcValues.accel = userVal;
      input.classList.remove('invalid');
      input.classList.add('valid');
      this.showFeedback(feedback, 'success', `✅ Outstanding! Acceleration a = ${userVal} (v<sub>f</sub> / Δt = ${this.calcValues.vFinal} / ${tFinalZeroed.toFixed(2)} s).`);
      if (window.labSound) window.labSound.playSuccess();
      this.renderGraph();
    } else {
      this.calcStatus.accel = false;
      input.classList.remove('valid');
      input.classList.add('invalid');
      this.showFeedback(feedback, 'error', `⚠️ Check your math: a = (v<sub>f</sub> − v₀) / Δt = ${this.calcValues.vFinal} / ${tFinalZeroed.toFixed(2)} s. (Expected ~${expected.toFixed(1)}).`);
      if (window.labSound) window.labSound.playWarning();
    }
    this.saveLocalDraft();
    this.updateUI();
  }

  showFeedback(el, type, msg) {
    if (!el) return;
    el.innerHTML = msg;
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

    const btnXt = document.getElementById('btn-graph-mode-xt');
    const btnVt = document.getElementById('btn-graph-mode-vt');
    if (btnXt) {
      btnXt.addEventListener('click', () => this.setGraphMode('xt'));
    }
    if (btnVt) {
      btnVt.addEventListener('click', () => this.setGraphMode('vt'));
    }

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

  setGraphMode(mode) {
    if (this.activeGraphMode === mode) return;
    this.activeGraphMode = mode;

    const btnXt = document.getElementById('btn-graph-mode-xt');
    const btnVt = document.getElementById('btn-graph-mode-vt');
    const legendXt = document.getElementById('legend-xt-group');
    const legendVt = document.getElementById('legend-vt-group');
    const heading = document.getElementById('graph-heading-text');
    const desc = document.getElementById('graph-description');

    if (mode === 'xt') {
      if (btnXt) btnXt.classList.add('active');
      if (btnVt) btnVt.classList.remove('active');
      if (legendXt) legendXt.classList.remove('hidden');
      if (legendVt) legendVt.classList.add('hidden');
      if (heading) heading.innerHTML = 'Step 3: Distance vs. Time <span class="whitespace-nowrap text-sky-300 font-extrabold">(x vs. t)</span> Graph';
      if (desc) desc.textContent = 'Watch the curve update in real time as you enter your measured times. Notice the characteristic parabolic curve of uniform acceleration from rest!';
    } else {
      if (btnXt) btnXt.classList.remove('active');
      if (btnVt) btnVt.classList.add('active');
      if (legendXt) legendXt.classList.add('hidden');
      if (legendVt) legendVt.classList.remove('hidden');
      if (heading) heading.innerHTML = 'Step 3: Velocity vs. Time <span class="whitespace-nowrap text-sky-300 font-extrabold">(v vs. t)</span> Graph';
      if (desc) desc.textContent = 'Notice how velocity increases linearly over time! The constant slope of this line is the car\'s acceleration (a), and the shaded triangular area beneath equals the total 100 cm distance traveled.';
    }

    if (window.labSound) window.labSound.playClick();
    this.renderGraph();
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

    if (this.activeGraphMode === 'vt') {
      this.renderVelocityGraph(ctx, width, height, isLight);
    } else {
      this.renderPositionGraph(ctx, width, height, isLight);
    }
  }

  renderPositionGraph(ctx, width, height, isLight) {
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

  renderVelocityGraph(ctx, width, height, isLight) {
    const padLeft = 60;
    const padBottom = 40;
    const padTop = 25;
    const padRight = 30;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Time domain: 0 to max(2.0, t5 * 1.25)
    const t5 = this.times[5] || 1.5;
    const maxTime = Math.max(2.0, Math.ceil(t5 * 1.25 * 10) / 10);

    // Collect valid interval speeds and midpoint times
    const intervalPoints = [];
    let peakSpeed = 0;

    for (let i = 1; i <= 5; i++) {
      const tPrev = this.times[i - 1];
      const tCurr = this.times[i];
      if (tPrev !== null && tCurr !== null && tCurr > tPrev) {
        const deltaX = this.distances[i] - this.distances[i - 1]; // 20 cm
        const deltaT = tCurr - tPrev;
        const v = deltaX / deltaT;
        const tMid = +((tPrev + tCurr) / 2).toFixed(3);
        intervalPoints.push({ index: i, tMid, v: +v.toFixed(1), deltaT });
        if (v > peakSpeed) peakSpeed = v;
      }
    }

    // Final velocity vf = 2 * v_avg = 2 * (100 / t5)
    const vFinal = (this.calcValues.vFinal && this.calcValues.vFinal > 0)
      ? this.calcValues.vFinal
      : (t5 > 0 ? (2 * 100 / t5) : 80);

    if (vFinal > peakSpeed) peakSpeed = vFinal;

    // Velocity domain (clean round increments)
    const maxVelocity = Math.max(80.0, Math.ceil((peakSpeed * 1.25) / 20) * 20);

    const toX = (t) => padLeft + (t / maxTime) * plotW;
    const toY = (v) => padTop + plotH - (v / maxVelocity) * plotH;

    // 1. Gridlines
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

    // Horizontal velocity gridlines
    const vStep = maxVelocity <= 120 ? 20 : 25;
    ctx.textAlign = 'right';
    for (let v = 0; v <= maxVelocity + 0.01; v += vStep) {
      const yPos = toY(v);
      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(padLeft + plotW, yPos);
      ctx.stroke();

      ctx.fillText(`${v}`, padLeft - 10, yPos + 4);
    }

    // 2. Axis Lines
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
    ctx.fillText('Velocity v (cm/s)', 0, 0);
    ctx.restore();

    // 3. Shaded Displacement Area (Triangle under v = at curve to t5)
    if (this.times[5] && this.times[5] > 0 && vFinal > 0) {
      const x0 = toX(0);
      const y0 = toY(0);
      const x5 = toX(t5);
      const y5 = toY(vFinal);

      ctx.save();
      const areaGrad = ctx.createLinearGradient(0, y5, 0, y0);
      if (isLight) {
        areaGrad.addColorStop(0, 'rgba(5, 150, 105, 0.25)');
        areaGrad.addColorStop(1, 'rgba(5, 150, 105, 0.06)');
      } else {
        areaGrad.addColorStop(0, 'rgba(16, 185, 129, 0.30)');
        areaGrad.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
      }
      ctx.fillStyle = areaGrad;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x5, y0);
      ctx.lineTo(x5, y5);
      ctx.closePath();
      ctx.fill();

      // Shaded area dashed border
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isLight ? 'rgba(5, 150, 105, 0.5)' : 'rgba(16, 185, 129, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();

      // Area Callout Badge inside triangle
      ctx.save();
      const badgeX = x0 + (x5 - x0) * 0.62;
      const badgeY = y0 - (y0 - y5) * 0.32;
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      const areaText = 'Area = Δx = 100 cm (Displacement)';
      const subText = `½ · (${t5.toFixed(2)}s) · (${vFinal.toFixed(1)} cm/s) = 100 cm`;
      const badgeW = Math.max(ctx.measureText(areaText).width, ctx.measureText(subText).width) + 16;
      const badgeH = 34;

      if (isLight) {
        ctx.fillStyle = '#ecfdf5';
        ctx.fillRect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH);
        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 1;
        ctx.strokeRect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH);
        ctx.fillStyle = '#065f46';
      } else {
        ctx.fillStyle = 'rgba(6, 78, 59, 0.85)';
        ctx.fillRect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH);
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH);
        ctx.fillStyle = '#6ee7b7';
      }
      ctx.textAlign = 'center';
      ctx.fillText(areaText, badgeX, badgeY - 3);
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(subText, badgeX, badgeY + 11);
      ctx.restore();
    }

    // 4. Linear Acceleration Line (v = at)
    const accel = (this.calcValues.accel && this.calcValues.accel > 0)
      ? this.calcValues.accel
      : (t5 > 0 ? (vFinal / t5) : null);

    if (t5 > 0 && vFinal > 0 && accel) {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = isLight ? '#7e22ce' : '#c084fc';
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(0));
      ctx.lineTo(toX(t5), toY(vFinal));
      ctx.stroke();

      // Dash extension to edge of graph
      if (t5 < maxTime) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isLight ? 'rgba(126, 34, 206, 0.4)' : 'rgba(192, 132, 252, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(toX(t5), toY(vFinal));
        ctx.lineTo(toX(maxTime), toY(accel * maxTime));
        ctx.stroke();
      }
      ctx.restore();

      // Slope Callout near line
      ctx.save();
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = isLight ? '#6b21a8' : '#e9d5ff';
      ctx.textAlign = 'left';
      const slopeText = `Slope = a = ${accel.toFixed(1)} cm/s² (Uniform Accel)`;
      ctx.fillText(slopeText, padLeft + 10, padTop + 16);
      ctx.restore();
    }

    // 5. Connect Interval Speeds if points exist
    if (intervalPoints.length > 1) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.5)' : 'rgba(56, 189, 248, 0.5)';
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(0));
      intervalPoints.forEach((pt) => {
        ctx.lineTo(toX(pt.tMid), toY(pt.v));
      });
      ctx.stroke();
      ctx.restore();
    }

    // 6. Draw Interval Speed Coordinate Dots (at midpoint times)
    intervalPoints.forEach((pt) => {
      const xPos = toX(pt.tMid);
      const yPos = toY(pt.v);

      ctx.save();
      if (!isLight) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(xPos, yPos, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(xPos, yPos, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Label pill
      const coordText = `v${pt.index}=${pt.v}`;
      ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
      const textW = ctx.measureText(coordText).width;

      if (isLight) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(xPos - textW / 2 - 3, yPos - 19, textW + 6, 12);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(xPos - textW / 2 - 3, yPos - 19, textW + 6, 12);
        ctx.fillStyle = '#0f172a';
      } else {
        ctx.fillStyle = '#e2e8f0';
      }
      ctx.textAlign = 'center';
      ctx.fillText(coordText, xPos, yPos - 10);
      ctx.restore();
    });

    // 7. Initial Velocity point at (0, 0)
    const x0 = toX(0);
    const y0 = toY(0);
    ctx.save();
    ctx.fillStyle = isLight ? '#0284c7' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(x0, y0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillStyle = isLight ? '#0f172a' : '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.fillText('v₀ = 0', x0 + 8, y0 - 6);
    ctx.restore();

    // 8. Final Velocity Anchor Point at (t5, vf)
    if (this.times[5] && this.times[5] > 0 && vFinal > 0) {
      const xEnd = toX(t5);
      const yEnd = toY(vFinal);

      ctx.save();
      if (!isLight) {
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(xEnd, yEnd, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(xEnd, yEnd, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Label for vf
      const vfLabel = `vf = ${vFinal.toFixed(1)} cm/s`;
      ctx.font = 'bold 10.5px "JetBrains Mono", monospace';
      const vfTextW = ctx.measureText(vfLabel).width;

      if (isLight) {
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(xEnd - vfTextW - 12, yEnd - 12, vfTextW + 8, 16);
        ctx.strokeStyle = '#fcd34d';
        ctx.lineWidth = 1;
        ctx.strokeRect(xEnd - vfTextW - 12, yEnd - 12, vfTextW + 8, 16);
        ctx.fillStyle = '#b45309';
      } else {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.fillRect(xEnd - vfTextW - 12, yEnd - 12, vfTextW + 8, 16);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(xEnd - vfTextW - 12, yEnd - 12, vfTextW + 8, 16);
        ctx.fillStyle = '#fcd34d';
      }
      ctx.textAlign = 'right';
      ctx.fillText(vfLabel, xEnd - 8, yEnd);
      ctx.restore();
    }
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
    const allTimesEntered = this.rawTimes.every(t => t !== null && t >= 0) && this.validateTimes();
    const calcsComplete = this.calcStatus.vAvg && this.calcStatus.vFinal && this.calcStatus.accel;

    // Progress Bar (out of 100%)
    let progress = 0;
    if (this.rawTimes[0] !== null) progress += 8;
    if (this.rawTimes[1] !== null && this.times[1] !== null) progress += 8;
    if (this.rawTimes[2] !== null && this.times[2] !== null) progress += 8;
    if (this.rawTimes[3] !== null && this.times[3] !== null) progress += 8;
    if (this.rawTimes[4] !== null && this.times[4] !== null) progress += 8;
    if (this.rawTimes[5] !== null && this.times[5] !== null) progress += 8;
    if (this.calcStatus.vAvg) progress += 17;
    if (this.calcStatus.vFinal) progress += 17;
    if (this.calcStatus.accel) progress += 18;

    const bar = document.getElementById('lab-progress-bar');
    const label = document.getElementById('lab-progress-label');
    const statusBadge = document.getElementById('badge-lab-status');

    if (bar) bar.style.width = `${progress}%`;
    if (label) label.textContent = `${progress}% Complete`;

    if (statusBadge) {
      if (progress >= 100) {
        statusBadge.textContent = 'Ready for Submission (10/10)';
        statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap animate-pulse';
      } else {
        const completedParts = Math.round(progress / 10);
        statusBadge.textContent = `In Progress (${completedParts}/10)`;
        statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap';
      }
    }

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
    const allTimesEntered = this.rawTimes.every(t => t !== null && t >= 0) && this.validateTimes();
    const calcsComplete = this.calcStatus.vAvg && this.calcStatus.vFinal && this.calcStatus.accel;

    if (!allTimesEntered || !calcsComplete) {
      alert("Please complete the data table (including Start Time t₀) and verify all three kinematic calculations before submitting.");
      return;
    }

    const labReport = {
      distances: this.distances,
      rawTimes: this.rawTimes,
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
      rawTimes: this.rawTimes,
      times: this.times,
      currentStep: this.currentStep,
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
    if (state.currentStep) {
      this.goToStep(state.currentStep);
    }
    if (state.rawTimes) {
      this.rawTimes = state.rawTimes;
      for (let i = 0; i <= 5; i++) {
        const input = document.getElementById(`time-input-${i}`);
        if (input && this.rawTimes[i] !== null) {
          input.value = this.rawTimes[i];
        }
      }
      this.computeZeroedTimes();
      this.validateTimes();
      this.computeIntervalSpeeds();
    } else if (state.times) {
      // Legacy fallback
      this.rawTimes = [0.0, ...state.times.slice(1)];
      for (let i = 0; i <= 5; i++) {
        const input = document.getElementById(`time-input-${i}`);
        if (input && this.rawTimes[i] !== null) {
          input.value = this.rawTimes[i];
        }
      }
      this.computeZeroedTimes();
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
    resetBtnId: 'btn-stopwatch-reset'
  });
});

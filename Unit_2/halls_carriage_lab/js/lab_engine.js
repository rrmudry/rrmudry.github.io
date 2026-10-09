/**
 * LabEngine - Main Logic, Kinematic Verification & Dynamic Graphing
 * Modified Atwood Machine: Hall's Carriage Lab
 * Enforces CAST alignment, productive pedagogical friction, and dual-mode motion graphing.
 */

class HallsCarriageLabEngine {
  constructor() {
    this.trackDistance = 100.0; // cm
    this.hangingMass = 50.0; // grams

    this.configs = [
      { id: 0, label: "Config 1", cartMass: null, rawT0: null, rawTf: null, vAvg: null, vFinal: null, accel: null, vAvgVerified: false, vFinalVerified: false, accelVerified: false },
      { id: 1, label: "Config 2", cartMass: null, rawT0: null, rawTf: null, vAvg: null, vFinal: null, accel: null, vAvgVerified: false, vFinalVerified: false, accelVerified: false },
      { id: 2, label: "Config 3", cartMass: null, rawT0: null, rawTf: null, vAvg: null, vFinal: null, accel: null, vAvgVerified: false, vFinalVerified: false, accelVerified: false },
      { id: 3, label: "Config 4", cartMass: null, rawT0: null, rawTf: null, vAvg: null, vFinal: null, accel: null, vAvgVerified: false, vFinalVerified: false, accelVerified: false },
      { id: 4, label: "Config 5", cartMass: null, rawT0: null, rawTf: null, vAvg: null, vFinal: null, accel: null, vAvgVerified: false, vFinalVerified: false, accelVerified: false }
    ];

    this.activeConfigIdx = 0;
    this.currentStep = 1;
    this.totalSteps = 5;

    this.activeGraphMode = 'inverse'; // 'inverse' (a vs m) or 'linear' (a vs 1/m)
    this.desmosCalculator = null;

    this.cerAnswers = {
      q1: null,
      q2: null,
      q3: null,
      claim: "",
      evidence: "",
      reasoning: ""
    };

    this.init();
  }

  init() {
    this.initStepper();
    this.bindGlobalInputs();
    this.bindTableInputs();
    this.bindCalcWorkbench();
    this.bindAnalysisInputs();
    this.initCanvasGraph();
    this.initDesmos();
    this.loadLocalDraft();
    this.updateUI();
  }

  // -------------------------------------------------------------
  // Step 1: Protocol Stepper
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
          const tableEl = document.getElementById('mass-cart-0');
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
    if (btnPrev) btnPrev.disabled = this.currentStep === 1;
    if (btnNext) {
      if (this.currentStep === this.totalSteps) {
        btnNext.textContent = 'Go to Data Table ⬇';
        btnNext.className = 'px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm';
      } else {
        btnNext.textContent = 'Next Step ➔';
        btnNext.className = 'px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-sm';
      }
    }
  }

  // -------------------------------------------------------------
  // Global Setup Inputs (Track Distance & Hanging Mass)
  // -------------------------------------------------------------
  bindGlobalInputs() {
    const distInput = document.getElementById('input-track-distance');
    if (distInput) {
      distInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val > 0) {
          this.trackDistance = val;
          this.updateAllCalculations();
          this.saveLocalDraft();
          this.updateUI();
        }
      });
    }

    const hangInput = document.getElementById('input-hanging-mass');
    if (hangInput) {
      hangInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val > 0) {
          this.hangingMass = val;
          this.updateAllCalculations();
          this.saveLocalDraft();
          this.updateUI();
        }
      });
    }
  }

  // -------------------------------------------------------------
  // Data Table Inputs
  // -------------------------------------------------------------
  bindTableInputs() {
    for (let i = 0; i < 5; i++) {
      const massInput = document.getElementById(`mass-cart-${i}`);
      const t0Input = document.getElementById(`raw-t0-${i}`);
      const tfInput = document.getElementById(`raw-tf-${i}`);

      if (massInput) {
        massInput.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          this.configs[i].cartMass = !isNaN(val) && val > 0 ? val : null;
          this.updateRowDerived(i);
          this.saveLocalDraft();
          this.updateUI();
        });
      }

      if (t0Input) {
        t0Input.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          this.configs[i].rawT0 = !isNaN(val) && val >= 0 ? val : null;
          this.updateRowDerived(i);
          this.saveLocalDraft();
          this.updateUI();
        });
      }

      if (tfInput) {
        tfInput.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          this.configs[i].rawTf = !isNaN(val) && val > 0 ? val : null;
          this.updateRowDerived(i);
          this.saveLocalDraft();
          this.updateUI();
        });
      }
    }
  }

  getElapsedTime(idx) {
    const c = this.configs[idx];
    if (c.rawT0 !== null && c.rawTf !== null && c.rawTf > c.rawT0) {
      return +(c.rawTf - c.rawT0).toFixed(2);
    }
    return null;
  }

  getTotalMassG(idx) {
    const c = this.configs[idx];
    if (c.cartMass !== null && this.hangingMass !== null) {
      return +(c.cartMass + this.hangingMass).toFixed(1);
    }
    return null;
  }

  updateRowDerived(idx) {
    const c = this.configs[idx];
    const totalMG = this.getTotalMassG(idx);
    const dt = this.getElapsedTime(idx);

    // Update table cells
    const cellTotal = document.getElementById(`total-mass-${idx}`);
    if (cellTotal) {
      if (totalMG !== null) {
        const totalKg = (totalMG / 1000).toFixed(3);
        cellTotal.innerHTML = `<span class="text-sky-300 font-bold">${totalMG} g</span> <span class="text-slate-400 text-xs">(${totalKg} kg)</span>`;
      } else {
        cellTotal.textContent = '--';
      }
    }

    const cellDt = document.getElementById(`elapsed-time-${idx}`);
    if (cellDt) {
      if (dt !== null) {
        cellDt.innerHTML = `<span class="text-emerald-400 font-extrabold font-mono">${dt.toFixed(2)} s</span>`;
      } else {
        cellDt.textContent = '--';
      }
    }

    // Row status badge
    const badge = document.getElementById(`row-status-${idx}`);
    if (badge) {
      if (c.accelVerified) {
        badge.innerHTML = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Verified ✓</span>`;
      } else if (totalMG !== null && dt !== null) {
        badge.innerHTML = `<button type="button" onclick="window.labEngine.selectConfigForCalc(${idx})" class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-all">Calculate ➔</button>`;
      } else {
        badge.innerHTML = `<span class="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-white/5">Needs Data</span>`;
      }
    }

    // If active config changed, update calc workbench values
    if (this.activeConfigIdx === idx) {
      this.refreshCalcWorkbench();
    }

    this.renderGraph();
  }

  // -------------------------------------------------------------
  // Kinematic Calculations Workbench
  // -------------------------------------------------------------
  bindCalcWorkbench() {
    // Config selector tabs
    const tabBtns = document.querySelectorAll('.config-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.config, 10);
        if (!isNaN(idx)) this.selectConfigForCalc(idx);
      });
    });

    // Check Math buttons
    const btnVAvg = document.getElementById('btn-check-vavg');
    const btnVFinal = document.getElementById('btn-check-vfinal');
    const btnAccel = document.getElementById('btn-check-accel');

    if (btnVAvg) btnVAvg.onclick = () => this.checkVAvg();
    if (btnVFinal) btnVFinal.onclick = () => this.checkVFinal();
    if (btnAccel) btnAccel.onclick = () => this.checkAccel();

    // Auto check on Enter key
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

  selectConfigForCalc(idx) {
    if (idx < 0 || idx >= 5) return;
    this.activeConfigIdx = idx;

    // Update config tab UI
    const tabBtns = document.querySelectorAll('.config-tab-btn');
    tabBtns.forEach(btn => {
      const btnIdx = parseInt(btn.dataset.config, 10);
      if (btnIdx === idx) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.refreshCalcWorkbench();
    if (window.labSound) window.labSound.playClick();
  }

  refreshCalcWorkbench() {
    const c = this.configs[this.activeConfigIdx];
    const dt = this.getElapsedTime(this.activeConfigIdx);
    const totalMG = this.getTotalMassG(this.activeConfigIdx);

    // Title & Parameters
    const labelEl = document.getElementById('calc-active-label');
    if (labelEl) {
      labelEl.textContent = `${c.label}: Cart = ${c.cartMass || '--'} g, Total = ${totalMG || '--'} g, Δt = ${dt !== null ? dt.toFixed(2) + ' s' : '--'}`;
    }

    // Input fields & feedback
    const vAvgInput = document.getElementById('input-vavg');
    const vFinalInput = document.getElementById('input-vfinal');
    const accelInput = document.getElementById('input-accel');

    const fbVAvg = document.getElementById('feedback-vavg');
    const fbVFinal = document.getElementById('feedback-vfinal');
    const fbAccel = document.getElementById('feedback-accel');

    if (vAvgInput) {
      vAvgInput.value = c.vAvg !== null ? c.vAvg : '';
      vAvgInput.className = c.vAvgVerified ? 'lab-input w-36 text-center text-sm font-bold py-2 valid' : 'lab-input w-36 text-center text-sm font-bold py-2';
    }
    if (vFinalInput) {
      vFinalInput.value = c.vFinal !== null ? c.vFinal : '';
      vFinalInput.className = c.vFinalVerified ? 'lab-input w-36 text-center text-sm font-bold py-2 valid' : 'lab-input w-36 text-center text-sm font-bold py-2';
    }
    if (accelInput) {
      accelInput.value = c.accel !== null ? c.accel : '';
      accelInput.className = c.accelVerified ? 'lab-input w-36 text-center text-sm font-bold py-2 valid' : 'lab-input w-36 text-center text-sm font-bold py-2';
    }

    if (fbVAvg) {
      if (c.vAvgVerified) {
        this.showFeedback(fbVAvg, 'success', `✅ Verified: v<sub>avg</sub> = ${c.vAvg} cm/s`);
      } else {
        fbVAvg.classList.add('hidden');
      }
    }
    if (fbVFinal) {
      if (c.vFinalVerified) {
        this.showFeedback(fbVFinal, 'success', `✅ Verified: v<sub>f</sub> = ${c.vFinal} cm/s`);
      } else {
        fbVFinal.classList.add('hidden');
      }
    }
    if (fbAccel) {
      if (c.accelVerified) {
        this.showFeedback(fbAccel, 'success', `✅ Verified: a = ${c.accel} cm/s² (${(c.accel / 100).toFixed(2)} m/s²)`);
      } else {
        fbAccel.classList.add('hidden');
      }
    }

    this.updateConfigTabBadges();
  }

  updateConfigTabBadges() {
    this.configs.forEach((c, idx) => {
      const tabBtn = document.querySelector(`.config-tab-btn[data-config="${idx}"]`);
      if (tabBtn) {
        if (c.accelVerified) {
          tabBtn.classList.add('verified');
          tabBtn.innerHTML = `<span>Config ${idx + 1}</span> <span class="text-emerald-400 font-bold">✓</span>`;
        } else {
          tabBtn.classList.remove('verified');
          tabBtn.innerHTML = `<span>Config ${idx + 1}</span>`;
        }
      }
    });
  }

  checkVAvg() {
    const input = document.getElementById('input-vavg');
    const feedback = document.getElementById('feedback-vavg');
    const dt = this.getElapsedTime(this.activeConfigIdx);

    if (dt === null || dt <= 0) {
      this.showFeedback(feedback, 'error', '⚠️ Record Start Time (t₀) and Finish Time in the data table for this configuration first!');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    const userVal = parseFloat(input.value);
    if (isNaN(userVal) || userVal <= 0) {
      this.showFeedback(feedback, 'error', '⚠️ Enter your calculated average speed.');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    // Expected: d / dt (in cm/s or m/s)
    const expectedCm = this.trackDistance / dt;
    const expectedM = (this.trackDistance / 100.0) / dt;

    const matchCm = Math.abs(userVal - expectedCm) / expectedCm <= 0.08;
    const matchM = Math.abs(userVal - expectedM) / expectedM <= 0.08;

    if (matchCm || matchM) {
      const c = this.configs[this.activeConfigIdx];
      c.vAvgVerified = true;
      c.vAvg = userVal;
      input.classList.remove('invalid');
      input.classList.add('valid');
      const units = matchM ? 'm/s' : 'cm/s';
      this.showFeedback(feedback, 'success', `✅ Correct! v<sub>avg</sub> = ${userVal} ${units} (${this.trackDistance} cm / ${dt.toFixed(2)} s).`);
      if (window.labSound) window.labSound.playSuccess();
    } else {
      input.classList.remove('valid');
      input.classList.add('invalid');
      this.showFeedback(feedback, 'error', `⚠️ Check your math: v<sub>avg</sub> = d / Δt = ${this.trackDistance} cm / ${dt.toFixed(2)} s. (Expected ~${expectedCm.toFixed(1)} cm/s).`);
      if (window.labSound) window.labSound.playWarning();
    }

    this.saveLocalDraft();
    this.updateUI();
  }

  checkVFinal() {
    const input = document.getElementById('input-vfinal');
    const feedback = document.getElementById('feedback-vfinal');
    const c = this.configs[this.activeConfigIdx];

    if (!c.vAvgVerified) {
      this.showFeedback(feedback, 'error', '⚠️ Calculate and verify your Average Speed in Calculation 1 first!');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    const userVal = parseFloat(input.value);
    if (isNaN(userVal) || userVal <= 0) {
      this.showFeedback(feedback, 'error', '⚠️ Enter your calculated final speed.');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    // Expected: 2 * v_avg (since v0 = 0)
    const expected = 2.0 * c.vAvg;
    const isMatch = Math.abs(userVal - expected) / expected <= 0.08;

    if (isMatch) {
      c.vFinalVerified = true;
      c.vFinal = userVal;
      input.classList.remove('invalid');
      input.classList.add('valid');
      this.showFeedback(feedback, 'success', `✅ Correct! Since the cart started from rest (v₀ = 0), v<sub>f</sub> = 2 · v<sub>avg</sub> = ${userVal}.`);
      if (window.labSound) window.labSound.playSuccess();
    } else {
      input.classList.remove('valid');
      input.classList.add('invalid');
      this.showFeedback(feedback, 'error', `⚠️ Hint: v<sub>f</sub> = 2 · v<sub>avg</sub>. Double your verified average speed (${c.vAvg})!`);
      if (window.labSound) window.labSound.playWarning();
    }

    this.saveLocalDraft();
    this.updateUI();
  }

  checkAccel() {
    const input = document.getElementById('input-accel');
    const feedback = document.getElementById('feedback-accel');
    const c = this.configs[this.activeConfigIdx];
    const dt = this.getElapsedTime(this.activeConfigIdx);

    if (!c.vFinalVerified) {
      this.showFeedback(feedback, 'error', '⚠️ Calculate and verify your Final Speed in Calculation 2 first!');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    const userVal = parseFloat(input.value);
    if (isNaN(userVal) || userVal <= 0) {
      this.showFeedback(feedback, 'error', '⚠️ Enter your calculated acceleration.');
      if (window.labSound) window.labSound.playWarning();
      return;
    }

    // Expected: v_f / dt in cm/s² or m/s²
    const expectedCm = c.vFinal / dt;
    const expectedM = (c.vFinal / 100.0) / dt;

    const matchCm = Math.abs(userVal - expectedCm) / expectedCm <= 0.08;
    const matchM = Math.abs(userVal - expectedM) / expectedM <= 0.08;

    if (matchCm || matchM) {
      c.accelVerified = true;
      c.accel = matchM ? +(userVal * 100).toFixed(1) : userVal; // store internal in cm/s²
      input.classList.remove('invalid');
      input.classList.add('valid');
      const accelM = (c.accel / 100).toFixed(2);
      this.showFeedback(feedback, 'success', `✅ Outstanding! Acceleration a = ${c.accel} cm/s² (${accelM} m/s²).`);
      if (window.labSound) window.labSound.playSuccess();
      this.updateRowDerived(this.activeConfigIdx);
      this.updateConfigTabBadges();
      this.renderGraph();
    } else {
      input.classList.remove('valid');
      input.classList.add('invalid');
      this.showFeedback(feedback, 'error', `⚠️ Check your math: a = v<sub>f</sub> / Δt = ${c.vFinal} / ${dt.toFixed(2)} s. (Expected ~${expectedCm.toFixed(1)} cm/s²).`);
      if (window.labSound) window.labSound.playWarning();
    }

    this.saveLocalDraft();
    this.updateUI();
  }

  updateAllCalculations() {
    for (let i = 0; i < 5; i++) {
      this.updateRowDerived(i);
    }
  }

  showFeedback(el, type, msg) {
    if (!el) return;
    el.innerHTML = msg;
    el.classList.remove('hidden', 'text-emerald-400', 'text-rose-400');
    if (type === 'success') {
      el.classList.add('text-emerald-400');
    } else {
      el.classList.add('text-rose-400');
    }
  }

  // -------------------------------------------------------------
  // Dynamic Canvas Motion Graphs (a vs m and a vs 1/m)
  // -------------------------------------------------------------
  initCanvasGraph() {
    this.canvas = document.getElementById('motion-graph-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    const btnInverse = document.getElementById('btn-graph-mode-inverse');
    const btnLinear = document.getElementById('btn-graph-mode-linear');

    if (btnInverse) {
      btnInverse.addEventListener('click', () => this.setGraphMode('inverse'));
    }
    if (btnLinear) {
      btnLinear.addEventListener('click', () => this.setGraphMode('linear'));
    }

    const resize = () => {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.renderGraph();
    };

    window.addEventListener('resize', resize);
    setTimeout(resize, 50);
  }

  setGraphMode(mode) {
    if (this.activeGraphMode === mode) return;
    this.activeGraphMode = mode;

    const btnInverse = document.getElementById('btn-graph-mode-inverse');
    const btnLinear = document.getElementById('btn-graph-mode-linear');

    if (btnInverse && btnLinear) {
      if (mode === 'inverse') {
        btnInverse.classList.add('active');
        btnLinear.classList.remove('active');
      } else {
        btnInverse.classList.remove('active');
        btnLinear.classList.add('active');
      }
    }

    const heading = document.getElementById('graph-heading-text');
    const desc = document.getElementById('graph-description');
    const legendInverse = document.getElementById('legend-inverse-group');
    const legendLinear = document.getElementById('legend-linear-group');

    if (mode === 'inverse') {
      if (heading) heading.innerHTML = `Step 4: Acceleration vs. Total Mass <span class="whitespace-nowrap text-sky-300 font-extrabold">(a vs. m)</span> Graph`;
      if (desc) desc.textContent = "Observe the inverse relationship (hyperbolic curve) between acceleration and total system mass under constant hanging force!";
      if (legendInverse) legendInverse.classList.remove('hidden');
      if (legendLinear) legendLinear.classList.add('hidden');
    } else {
      if (heading) heading.innerHTML = `Step 4: Linearized Graph: Acceleration vs. Inverse Mass <span class="whitespace-nowrap text-purple-300 font-extrabold">(a vs. 1/m)</span>`;
      if (desc) desc.textContent = "Linearizing the curve: Plotting acceleration against 1/Total Mass produces a straight line through the origin whose slope equals the Net Pulling Force in Newtons!";
      if (legendInverse) legendInverse.classList.add('hidden');
      if (legendLinear) legendLinear.classList.remove('hidden');
    }

    this.renderGraph();
    if (window.labSound) window.labSound.playClick();
  }

  renderGraph() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    const isLight = document.documentElement.classList.contains('light');

    // Palettes
    const bgFill = isLight ? '#ffffff' : '#090d16';
    const gridColor = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)';
    const axisColor = isLight ? '#475569' : '#94a3b8';
    const textColor = isLight ? '#0f172a' : '#cbd5e1';
    const pointColor = '#38bdf8';
    const curveColor = '#f59e0b';
    const lineColor = '#a855f7';

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, W, H);

    const padLeft = 65;
    const padRight = 35;
    const padTop = 35;
    const padBottom = 55;

    const graphW = W - padLeft - padRight;
    const graphH = H - padTop - padBottom;

    // Collect verified points
    // Point: { massKg, invMass, accelM, label }
    const points = [];
    this.configs.forEach((c, idx) => {
      const dt = this.getElapsedTime(idx);
      const totalMG = this.getTotalMassG(idx);
      if (totalMG !== null && dt !== null) {
        // use verified accel or calculated direct accel
        const a_cm = c.accel !== null ? c.accel : (2 * this.trackDistance) / (dt * dt);
        const a_m = a_cm / 100.0;
        const m_kg = totalMG / 1000.0;
        const inv_m = 1.0 / m_kg;
        points.push({
          idx,
          label: `C${idx + 1}`,
          massKg: m_kg,
          invMass: inv_m,
          accelM: a_m,
          verified: c.accelVerified
        });
      }
    });

    if (this.activeGraphMode === 'inverse') {
      // -------------------------------------------------------------
      // Mode 1: a vs m
      // -------------------------------------------------------------
      const maxM = Math.max(1.0, ...points.map(p => p.massKg * 1.2));
      const maxA = Math.max(2.5, ...points.map(p => p.accelM * 1.3));

      // Grid
      this.drawGrid(ctx, padLeft, padTop, graphW, graphH, 5, 5, gridColor);
      this.drawAxes(ctx, padLeft, padTop, graphW, graphH, axisColor, textColor, "Total Mass M_total (kg)", "Acceleration a (m/s²)", maxM, maxA);

      // Theoretical curve: a = (m_hang * g) / M_total
      const Fnet = (this.hangingMass / 1000.0) * 9.8; // Newtons
      ctx.beginPath();
      ctx.strokeStyle = curveColor;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);

      let first = true;
      for (let px = 0; px <= graphW; px += 2) {
        const m = (px / graphW) * maxM;
        if (m < 0.05) continue;
        const a = Fnet / m;
        const py = graphH - (a / maxA) * graphH;
        if (py >= 0 && py <= graphH) {
          if (first) {
            ctx.moveTo(padLeft + px, padTop + py);
            first = false;
          } else {
            ctx.lineTo(padLeft + px, padTop + py);
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Plot Points
      points.forEach(p => {
        const px = padLeft + (p.massKg / maxM) * graphW;
        const py = padTop + graphH - (p.accelM / maxA) * graphH;

        ctx.fillStyle = p.verified ? pointColor : 'rgba(56, 189, 248, 0.4)';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText(`${p.label} (${p.accelM.toFixed(2)})`, px + 8, py - 4);
      });

    } else {
      // -------------------------------------------------------------
      // Mode 2: Linearized a vs 1/m
      // -------------------------------------------------------------
      const maxInvM = Math.max(8.0, ...points.map(p => p.invMass * 1.25));
      const maxA = Math.max(2.5, ...points.map(p => p.accelM * 1.3));

      this.drawGrid(ctx, padLeft, padTop, graphW, graphH, 5, 5, gridColor);
      this.drawAxes(ctx, padLeft, padTop, graphW, graphH, axisColor, textColor, "Inverse Mass 1/M_total (kg⁻¹)", "Acceleration a (m/s²)", maxInvM, maxA);

      // Best fit line through origin: slope = sum(x*y) / sum(x^2)
      let sumXY = 0;
      let sumX2 = 0;
      points.forEach(p => {
        sumXY += p.invMass * p.accelM;
        sumX2 += p.invMass * p.invMass;
      });
      const slope = sumX2 > 0 ? (sumXY / sumX2) : (this.hangingMass / 1000.0) * 9.8;

      // Draw trendline
      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2.5;
      const xEnd = maxInvM;
      const yEnd = slope * xEnd;
      const pyEnd = graphH - (yEnd / maxA) * graphH;

      ctx.moveTo(padLeft, padTop + graphH);
      ctx.lineTo(padLeft + graphW, padTop + Math.max(0, pyEnd));
      ctx.stroke();

      // Plot Points
      points.forEach(p => {
        const px = padLeft + (p.invMass / maxInvM) * graphW;
        const py = padTop + graphH - (p.accelM / maxA) * graphH;

        ctx.fillStyle = p.verified ? '#a855f7' : 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText(`${p.label} (${p.accelM.toFixed(2)})`, px + 8, py - 4);
      });

      // Overlay Slope Banner
      if (points.length >= 2) {
        const Ftheory = ((this.hangingMass / 1000.0) * 9.8).toFixed(2);
        const Fexp = slope.toFixed(2);
        ctx.fillStyle = isLight ? 'rgba(241, 245, 249, 0.95)' : 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(padLeft + 10, padTop + 10, 260, 48);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(padLeft + 10, padTop + 10, 260, 48);

        ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.fillText(`Experimental Slope (F_net) = ${Fexp} N`, padLeft + 18, padTop + 28);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`Theoretical Pull (m_hang·g) = ${Ftheory} N`, padLeft + 18, padTop + 45);
      }
    }
  }

  drawGrid(ctx, left, top, w, h, xDivs, yDivs, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let i = 1; i <= xDivs; i++) {
      const x = left + (i / xDivs) * w;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + h);
      ctx.stroke();
    }
    for (let j = 0; j < yDivs; j++) {
      const y = top + (j / yDivs) * h;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + w, y);
      ctx.stroke();
    }
  }

  drawAxes(ctx, left, top, w, h, axisColor, textColor, xLabel, yLabel, maxX, maxY) {
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 2;

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, top + h);
    ctx.stroke();

    // X Axis
    ctx.beginPath();
    ctx.moveTo(left, top + h);
    ctx.lineTo(left + w, top + h);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = textColor;
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, left + w / 2, top + h + 42);

    ctx.save();
    ctx.translate(left - 45, top + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    // Tick labels
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    for (let j = 0; j <= 5; j++) {
      const val = ((5 - j) / 5) * maxY;
      const y = top + (j / 5) * h;
      ctx.fillText(val.toFixed(1), left - 8, y + 4);
    }

    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const val = (i / 5) * maxX;
      const x = left + (i / 5) * w;
      ctx.fillText(val.toFixed(1), x, top + h + 18);
    }
  }

  // -------------------------------------------------------------
  // Analysis Questions & CER Studio
  // -------------------------------------------------------------
  bindAnalysisInputs() {
    ['analysis-q1', 'analysis-q2', 'analysis-q3'].forEach((id, qIdx) => {
      const inputs = document.querySelectorAll(`input[name="${id}"]`);
      inputs.forEach(r => {
        r.addEventListener('change', (e) => {
          this.cerAnswers[`q${qIdx + 1}`] = e.target.value;
          this.checkQuestion(qIdx + 1, e.target.value);
          this.saveLocalDraft();
          this.updateUI();
        });
      });
    });

    ['cer-claim', 'cer-evidence', 'cer-reasoning'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          const key = id.replace('cer-', '');
          this.cerAnswers[key] = e.target.value;
          this.saveLocalDraft();
          this.updateUI();
        });
      }
    });

    const btnSubmit = document.getElementById('btn-submit-lab');
    if (btnSubmit) {
      btnSubmit.onclick = () => this.handleLabSubmit();
    }

    const btnViewCert = document.getElementById('btn-view-certificate');
    if (btnViewCert) {
      btnViewCert.onclick = () => this.openCertificateModal();
    }

    const btnModalOpenCert = document.getElementById('btn-modal-open-cert');
    if (btnModalOpenCert) {
      btnModalOpenCert.onclick = () => {
        const successModal = document.getElementById('submit-success-modal');
        if (successModal) successModal.classList.add('hidden');
        this.openCertificateModal();
      };
    }

    const btnCopySummary = document.getElementById('btn-copy-summary');
    if (btnCopySummary) {
      btnCopySummary.onclick = () => this.copyClassroomSummary();
    }
  }

  checkQuestion(qNum, selected) {
    const fb = document.getElementById(`feedback-q${qNum}`);
    if (!fb) return;

    if (qNum === 1) {
      if (selected === 'decreased') {
        fb.innerHTML = `✅ Correct! Increasing the mass of the carriage adds inertia, which decreases acceleration for a constant hanging force.`;
        fb.className = 'text-xs text-emerald-400 font-semibold mt-1.5';
      } else {
        fb.innerHTML = `⚠️ Remember Newton's 2nd Law: a = F_net / m. More mass means greater resistance to acceleration!`;
        fb.className = 'text-xs text-rose-400 font-semibold mt-1.5';
      }
    } else if (qNum === 2) {
      if (selected === 'net_force') {
        fb.innerHTML = `✅ Exactly! In a = F_net · (1/m), the slope of the linearized graph equals the Net Force (F_net) in Newtons.`;
        fb.className = 'text-xs text-emerald-400 font-semibold mt-1.5';
      } else {
        fb.innerHTML = `⚠️ Think about the equation y = m · x. Here y = a and x = (1/M_total). The constant multiplying x is Net Force!`;
        fb.className = 'text-xs text-rose-400 font-semibold mt-1.5';
      }
    } else if (qNum === 3) {
      if (selected === 'reduced_friction') {
        fb.innerHTML = `✅ Spot on! Friction between the string and the table edge opposes motion, making the experimental acceleration slightly lower than ideal.`;
        fb.className = 'text-xs text-emerald-400 font-semibold mt-1.5';
      } else {
        fb.innerHTML = `⚠️ Sliding contact without a rolling pulley introduces friction resistance, which reduces the effective net accelerating force.`;
        fb.className = 'text-xs text-rose-400 font-semibold mt-1.5';
      }
    }
  }

  // -------------------------------------------------------------
  // Desmos Drawer Integration
  // -------------------------------------------------------------
  initDesmos() {
    const toggleBtn = document.getElementById('btn-toggle-calculator');
    const closeBtn = document.getElementById('btn-close-desmos');
    const drawer = document.getElementById('desmos-drawer');

    const toggle = () => {
      if (!drawer) return;
      drawer.classList.toggle('open');
      if (drawer.classList.contains('open') && !this.desmosCalculator && window.Desmos) {
        const container = document.getElementById('desmos-calculator-container');
        if (container) {
          this.desmosCalculator = window.Desmos.ScientificCalculator(container, {
            fontSize: 14,
            invertedColors: !document.documentElement.classList.contains('light')
          });
        }
      }
    };

    if (toggleBtn) toggleBtn.onclick = toggle;
    if (closeBtn) closeBtn.onclick = toggle;
  }

  // -------------------------------------------------------------
  // Progress & Submission
  // -------------------------------------------------------------
  updateUI() {
    // 1. Data table completeness (all 5 configs have mass and valid elapsed time)
    const validConfigs = this.configs.filter((c, idx) => c.cartMass !== null && this.getElapsedTime(idx) !== null).length;
    const verifiedCalcs = this.configs.filter(c => c.accelVerified).length;

    // 2. CER completeness
    const cerComplete = (this.cerAnswers.claim && this.cerAnswers.claim.trim().length > 10) &&
                        (this.cerAnswers.evidence && this.cerAnswers.evidence.trim().length > 10) &&
                        (this.cerAnswers.reasoning && this.cerAnswers.reasoning.trim().length > 10) &&
                        (this.cerAnswers.q1 === 'decreased') &&
                        (this.cerAnswers.q2 === 'net_force') &&
                        (this.cerAnswers.q3 === 'reduced_friction');

    // Calculate score points (out of 10)
    let points = 0;
    points += Math.round((validConfigs / 5) * 4); // up to 4 pts
    points += Math.round((verifiedCalcs / 5) * 3); // up to 3 pts
    if (cerComplete) points += 3; // 3 pts

    points = Math.min(10, Math.max(0, points));

    const progressLabel = document.getElementById('lab-progress-label');
    const progressBar = document.getElementById('lab-progress-bar');
    const badgeStatus = document.getElementById('badge-lab-status');
    const btnSubmit = document.getElementById('btn-submit-lab');

    if (progressLabel) progressLabel.textContent = `${points * 10}% Complete (${points}/10 Points)`;
    if (progressBar) progressBar.style.width = `${points * 10}%`;

    if (badgeStatus && !(window.labAuth && window.labAuth.isCompleted)) {
      if (points >= 10) {
        badgeStatus.textContent = `Ready to Submit (${points}/10)`;
        badgeStatus.className = "px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap";
      } else {
        badgeStatus.textContent = `In Progress (${points}/10)`;
        badgeStatus.className = "px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap";
      }
    }

    if (btnSubmit && !(window.labAuth && window.labAuth.isCompleted)) {
      if (points >= 10) {
        btnSubmit.disabled = false;
        btnSubmit.className = "px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm sm:text-base shadow-lg transition-all cursor-pointer active:scale-95";
      } else {
        btnSubmit.disabled = true;
        btnSubmit.className = "px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg transition-all opacity-50 cursor-not-allowed";
      }
    }

    const btnViewCert = document.getElementById('btn-view-certificate');
    if (btnViewCert) {
      if (points >= 10 || (window.labAuth && window.labAuth.isCompleted)) {
        btnViewCert.classList.remove('hidden');
      } else {
        btnViewCert.classList.add('hidden');
      }
    }
  }

  async handleLabSubmit() {
    const verifiedCalcs = this.configs.filter(c => c.accelVerified).length;
    if (verifiedCalcs < 5) {
      alert("Please verify the kinematic acceleration calculations for all 5 configurations before submitting.");
      return;
    }

    const labReport = {
      trackDistance: this.trackDistance,
      hangingMass: this.hangingMass,
      configs: this.configs,
      cerAnswers: this.cerAnswers,
      submittedAt: new Date().toISOString()
    };

    const success = await window.labAuth.submitLabGrade(labReport);
    if (success) {
      if (typeof confetti === 'function') {
        confetti({ particleCount: 140, spread: 85, origin: { y: 0.6 } });
      }
      if (window.labSound) window.labSound.playSuccess();
      const modal = document.getElementById('submit-success-modal');
      if (modal) modal.classList.remove('hidden');
    }
  }

  // -------------------------------------------------------------
  // Completion Certificate & Classroom Summary Export
  // -------------------------------------------------------------
  generateSecurityHash(name, score, slope, dateStr) {
    const raw = `${name}_${score}_${slope}_${dateStr}_unit2_day28_halls_carriage`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `HC-${hex.substring(0, 4)}-${hex.substring(4, 8)}`;
  }

  calculateExpSlope() {
    let sumXY = 0;
    let sumX2 = 0;
    this.configs.forEach((c, idx) => {
      const dt = this.getElapsedTime(idx);
      const totalMG = this.getTotalMassG(idx);
      if (totalMG !== null && dt !== null) {
        const a_cm = c.accel !== null ? c.accel : (2 * this.trackDistance) / (dt * dt);
        const a_m = a_cm / 100.0;
        const m_kg = totalMG / 1000.0;
        const inv_m = 1.0 / m_kg;
        sumXY += inv_m * a_m;
        sumX2 += inv_m * inv_m;
      }
    });
    return sumX2 > 0 ? (sumXY / sumX2) : (this.hangingMass / 1000.0) * 9.8;
  }

  openCertificateModal() {
    const modal = document.getElementById('certificate-modal');
    if (!modal) return;

    const auth = window.labAuth;
    const name = (auth && auth.studentName) ? auth.studentName : "Student Investigator";
    const studentId = (auth && auth.studentId) ? auth.studentId : "Guest";
    const period = (auth && auth.classPeriod !== null && auth.classPeriod !== undefined) ? auth.classPeriod : "Unassigned";

    const verifiedConfigs = this.configs.filter(c => c.accelVerified).length;
    const slope = this.calculateExpSlope();
    const fPull = (this.hangingMass / 1000.0) * 9.8;
    const dateObj = new Date();
    const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const hash = this.generateSecurityHash(name, 10, slope.toFixed(3), dateStr);

    const elName = document.getElementById('cert-student-name');
    const elId = document.getElementById('cert-student-id');
    const elPeriod = document.getElementById('cert-period');
    const elScore = document.getElementById('cert-score');
    const elTrials = document.getElementById('cert-trials');
    const elSlope = document.getElementById('cert-slope');
    const elPull = document.getElementById('cert-pull');
    const elDate = document.getElementById('cert-date');
    const elHash = document.getElementById('cert-hash');

    if (elName) elName.textContent = name;
    if (elId) elId.textContent = studentId;
    if (elPeriod) elPeriod.textContent = typeof period === 'number' ? `Period ${period}` : period;
    if (elScore) elScore.textContent = "10 / 10 (100%)";
    if (elTrials) elTrials.textContent = `${verifiedConfigs} / 5 Verified`;
    if (elSlope) elSlope.textContent = `${slope.toFixed(3)} N`;
    if (elPull) elPull.textContent = `${fPull.toFixed(3)} N`;
    if (elDate) elDate.textContent = `${dateStr} at ${timeStr}`;
    if (elHash) elHash.textContent = hash;

    modal.classList.remove('hidden');

    if (typeof confetti === 'function') {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
    }
  }

  async copyClassroomSummary() {
    const auth = window.labAuth;
    const name = (auth && auth.studentName) ? auth.studentName : "Student Investigator";
    const studentId = (auth && auth.studentId) ? auth.studentId : "Guest";
    const period = (auth && auth.classPeriod !== null && auth.classPeriod !== undefined) ? auth.classPeriod : "Unassigned";
    const slope = this.calculateExpSlope();
    const fPull = (this.hangingMass / 1000.0) * 9.8;
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const hash = this.generateSecurityHash(name, 10, slope.toFixed(3), dateStr);

    const summaryText = `🎓 Hall's Carriage Modified Atwood Lab Completion Certificate
Investigator: ${name} (ID: ${studentId} | Period: ${period})
Score: 10/10 Points (100%)
Verified Mass Configurations: 5/5
Hanging Pulling Force (F_hang): ${fPull.toFixed(3)} N
Experimental Net Force (Slope k): ${slope.toFixed(3)} N
Verification Hash: ${hash}
Date: ${dateStr}`;

    try {
      await navigator.clipboard.writeText(summaryText);
      const btn = document.getElementById('btn-copy-summary');
      if (btn) {
        const origHTML = btn.innerHTML;
        btn.innerHTML = `<span>✓ Copied to Clipboard!</span>`;
        btn.classList.add('bg-emerald-700', 'text-white');
        setTimeout(() => {
          btn.innerHTML = origHTML;
          btn.classList.remove('bg-emerald-700', 'text-white');
        }, 2200);
      }
    } catch (e) {
      alert(summaryText);
    }
  }

  // -------------------------------------------------------------
  // Draft Persistence
  // -------------------------------------------------------------
  saveLocalDraft() {
    const draft = {
      trackDistance: this.trackDistance,
      hangingMass: this.hangingMass,
      configs: this.configs,
      activeConfigIdx: this.activeConfigIdx,
      currentStep: this.currentStep,
      cerAnswers: this.cerAnswers
    };
    try {
      localStorage.setItem('halls_carriage_draft', JSON.stringify(draft));
    } catch (e) {}

    if (window.labAuth && typeof window.labAuth.autoSaveDraft === 'function') {
      window.labAuth.autoSaveDraft(draft);
    }
  }

  loadLocalDraft() {
    try {
      const userKey = (window.labAuth && window.labAuth.studentId)
        ? `halls_carriage_draft_${window.labAuth.studentId}`
        : 'halls_carriage_draft';
      const raw = localStorage.getItem(userKey) || localStorage.getItem('halls_carriage_draft');
      if (raw) {
        const draft = JSON.parse(raw);
        this.restoreSavedState(draft);
      }
    } catch (e) {}
  }

  restoreSavedState(state) {
    if (!state) return;
    if (state.trackDistance) {
      this.trackDistance = state.trackDistance;
      const el = document.getElementById('input-track-distance');
      if (el) el.value = state.trackDistance;
    }
    if (state.hangingMass) {
      this.hangingMass = state.hangingMass;
      const el = document.getElementById('input-hanging-mass');
      if (el) el.value = state.hangingMass;
    }
    if (state.currentStep) {
      this.goToStep(state.currentStep);
    }
    if (state.configs && Array.isArray(state.configs)) {
      this.configs = state.configs;
      for (let i = 0; i < 5; i++) {
        const c = this.configs[i];
        if (!c) continue;
        const massEl = document.getElementById(`mass-cart-${i}`);
        const t0El = document.getElementById(`raw-t0-${i}`);
        const tfEl = document.getElementById(`raw-tf-${i}`);
        if (massEl && c.cartMass !== null) massEl.value = c.cartMass;
        if (t0El && c.rawT0 !== null) t0El.value = c.rawT0;
        if (tfEl && c.rawTf !== null) tfEl.value = c.rawTf;
        this.updateRowDerived(i);
      }
    }
    if (state.cerAnswers) {
      this.cerAnswers = state.cerAnswers;
      if (state.cerAnswers.q1) {
        const r = document.querySelector(`input[name="analysis-q1"][value="${state.cerAnswers.q1}"]`);
        if (r) { r.checked = true; this.checkQuestion(1, state.cerAnswers.q1); }
      }
      if (state.cerAnswers.q2) {
        const r = document.querySelector(`input[name="analysis-q2"][value="${state.cerAnswers.q2}"]`);
        if (r) { r.checked = true; this.checkQuestion(2, state.cerAnswers.q2); }
      }
      if (state.cerAnswers.q3) {
        const r = document.querySelector(`input[name="analysis-q3"][value="${state.cerAnswers.q3}"]`);
        if (r) { r.checked = true; this.checkQuestion(3, state.cerAnswers.q3); }
      }
      if (state.cerAnswers.claim) {
        const el = document.getElementById('cer-claim');
        if (el) el.value = state.cerAnswers.claim;
      }
      if (state.cerAnswers.evidence) {
        const el = document.getElementById('cer-evidence');
        if (el) el.value = state.cerAnswers.evidence;
      }
      if (state.cerAnswers.reasoning) {
        const el = document.getElementById('cer-reasoning');
        if (el) el.value = state.cerAnswers.reasoning;
      }
    }

    if (state.activeConfigIdx !== undefined) {
      this.selectConfigForCalc(state.activeConfigIdx);
    }

    this.renderGraph();
    this.updateUI();
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.labEngine = new HallsCarriageLabEngine();
  window.labStopwatch = new PrecisionStopwatch('stopwatch-display', {
    toggleBtnId: 'btn-stopwatch-toggle',
    resetBtnId: 'btn-stopwatch-reset'
  });
});

/**
 * LabEngine - Interactive Guided Lab Wizard for Wind-Up Toy Speed Lab
 * Aligned with CAST Science Standards and HS-PS2-1.
 */

class WindUpLabEngine {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 6;
    this.distanceCm = 20.0; // 20.0 cm track

    // Default 3 toys
    this.toys = [
      {
        id: 0,
        name: "Toy 1: Flipping Frog",
        color: "#10b981", // Emerald
        trials: [null, null, null],
        checks: [
          { fullDist: true, precise: true },
          { fullDist: true, precise: true },
          { fullDist: true, precise: true }
        ],
        outlierIndex: -1,
        studentAvgTime: null,
        correctAvgTime: null,
        avgTimeVerified: false,
        studentSpeed: null,
        correctSpeed: null,
        speedVerified: false
      },
      {
        id: 1,
        name: "Toy 2: Racing Beetle",
        color: "#38bdf8", // Sky
        trials: [null, null, null],
        checks: [
          { fullDist: true, precise: true },
          { fullDist: true, precise: true },
          { fullDist: true, precise: true }
        ],
        outlierIndex: -1,
        studentAvgTime: null,
        correctAvgTime: null,
        avgTimeVerified: false,
        studentSpeed: null,
        correctSpeed: null,
        speedVerified: false
      },
      {
        id: 2,
        name: "Toy 3: Wind-Up Robot",
        color: "#f59e0b", // Amber
        trials: [null, null, null],
        checks: [
          { fullDist: true, precise: true },
          { fullDist: true, precise: true },
          { fullDist: true, precise: true }
        ],
        outlierIndex: -1,
        studentAvgTime: null,
        correctAvgTime: null,
        avgTimeVerified: false,
        studentSpeed: null,
        correctSpeed: null,
        speedVerified: false
      }
    ];

    this.activeToyIndex = 0;
    this.activeTrialIndex = 0;
    this.graphEngine = null;

    // CER responses
    this.cer = {
      claim: "",
      evidence: "",
      reasoning: ""
    };
  }

  init() {
    this.setupNavigation();
    this.setupStep1Toys();
    this.renderActiveStep();
  }

  setupNavigation() {
    const btnNext = document.getElementById('btn-lab-next');
    const btnPrev = document.getElementById('btn-lab-prev');

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (this.validateCurrentStep()) {
          this.goToStep(this.currentStep + 1);
        }
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        this.goToStep(this.currentStep - 1);
      });
    }

    // Step dots click
    const dots = document.querySelectorAll('.step-indicator-dot');
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        if (idx + 1 < this.currentStep || this.validateCurrentStep(true)) {
          this.goToStep(idx + 1);
        }
      });
    });
  }

  goToStep(stepNum) {
    if (stepNum < 1) stepNum = 1;
    if (stepNum > this.totalSteps) stepNum = this.totalSteps;
    this.currentStep = stepNum;
    if (window.labSound) window.labSound.playClick();
    this.renderActiveStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderActiveStep() {
    // Hide all step sections
    for (let i = 1; i <= this.totalSteps; i++) {
      const el = document.getElementById(`step-section-${i}`);
      if (el) el.classList.toggle('hidden', i !== this.currentStep);
    }

    // Update Step Indicators
    const dots = document.querySelectorAll('.step-indicator-dot');
    dots.forEach((dot, idx) => {
      const stepIdx = idx + 1;
      if (stepIdx === this.currentStep) {
        dot.className = 'step-indicator-dot px-3 py-1 rounded-full text-xs font-bold bg-sky-500 text-slate-950 ring-2 ring-sky-400/50 flex items-center gap-1.5 transition-all';
      } else if (stepIdx < this.currentStep) {
        dot.className = 'step-indicator-dot px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all';
      } else {
        dot.className = 'step-indicator-dot px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-400 border border-white/10 flex items-center gap-1.5 transition-all';
      }
    });

    // Update Prev / Next Buttons
    const btnPrev = document.getElementById('btn-lab-prev');
    const btnNext = document.getElementById('btn-lab-next');
    if (btnPrev) btnPrev.classList.toggle('hidden', this.currentStep === 1);
    if (btnNext) {
      if (this.currentStep === this.totalSteps) {
        btnNext.innerHTML = `<span>Submit Lab Results</span> <span>🚀</span>`;
      } else {
        btnNext.innerHTML = `<span>Next Step &rarr;</span>`;
      }
    }

    // Dynamic Step Inits
    if (this.currentStep === 2) {
      this.renderStep2DataCollection();
    } else if (this.currentStep === 3) {
      this.renderStep3Averages();
    } else if (this.currentStep === 4) {
      this.renderStep4Speeds();
    } else if (this.currentStep === 5) {
      this.renderStep5BarChart();
    } else if (this.currentStep === 6) {
      this.renderStep6CER();
    }
  }

  // -----------------------------------------------------------------
  // STEP 1: Toy Setup & Experimental Setup
  // -----------------------------------------------------------------
  setupStep1Toys() {
    const container = document.getElementById('toys-setup-container');
    if (!container) return;

    container.innerHTML = this.toys.map((toy, idx) => `
      <div class="glass-card p-4 rounded-2xl border border-white/10 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono px-2 py-0.5 rounded uppercase font-bold" style="background: ${toy.color}22; color: ${toy.color}; border: 1px solid ${toy.color}44;">
            Toy ${idx + 1}
          </span>
          <span class="text-xs text-slate-400">Fixed Distance: <strong>20.0 cm</strong></span>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Toy Name / Description:</label>
          <input type="text" id="toy-name-input-${idx}" value="${toy.name}" class="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-sm text-white font-medium focus:border-sky-400 outline-none transition-colors">
        </div>
        <div class="text-[11px] text-slate-400">
          Wind up uniformly (e.g. 3-4 full turns) so each replication receives consistent initial spring tension.
        </div>
      </div>
    `).join('');

    // Input change listeners
    this.toys.forEach((toy, idx) => {
      const inp = document.getElementById(`toy-name-input-${idx}`);
      if (inp) {
        inp.addEventListener('input', (e) => {
          toy.name = e.target.value.trim() || `Toy ${idx + 1}`;
        });
      }
    });
  }

  // -----------------------------------------------------------------
  // STEP 2: Data Collection, Stopwatch & Quality Checkpoints
  // -----------------------------------------------------------------
  renderStep2DataCollection() {
    const tabsContainer = document.getElementById('step2-toy-tabs');
    const tableContainer = document.getElementById('step2-data-table-container');
    if (!tabsContainer || !tableContainer) return;

    // Render Toy Selection Tabs
    tabsContainer.innerHTML = this.toys.map((toy, idx) => `
      <button class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
        idx === this.activeToyIndex
          ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 ring-2 ring-sky-400'
          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
      }" onclick="window.labEngine.switchActiveToy(${idx})">
        <span class="w-2.5 h-2.5 rounded-full" style="background: ${toy.color}"></span>
        <span>${toy.name}</span>
      </button>
    `).join('');

    const currentToy = this.toys[this.activeToyIndex];

    // Check for outliers across the 3 replications
    this.detectOutliers(currentToy);

    // Render 3 Replications Table
    tableContainer.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h4 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" style="background: ${currentToy.color}"></span>
              <span>Replication Data for: ${currentToy.name}</span>
            </h4>
            <p class="text-xs text-slate-400">Track Distance: <strong>20.0 cm</strong> &bull; Complete 3 precision trials.</p>
          </div>
          <button onclick="window.labEngine.prefillSampleData(${this.activeToyIndex})" class="text-[11px] text-sky-300 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg border border-sky-500/20 transition-colors">
            Demo Autofill
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${[0, 1, 2].map(trialIdx => {
            const val = currentToy.trials[trialIdx];
            const check = currentToy.checks[trialIdx];
            const isOutlier = (currentToy.outlierIndex === trialIdx);
            const isActive = (this.activeTrialIndex === trialIdx);

            return `
              <div class="glass-card p-4 rounded-2xl border transition-all ${
                isOutlier 
                  ? 'border-amber-500/60 bg-amber-950/20 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40' 
                  : (isActive ? 'border-sky-500/50 ring-1 ring-sky-400/40' : 'border-white/10')
              }" onclick="window.labEngine.setActiveTrial(${trialIdx})">
                
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-mono font-bold ${isActive ? 'text-sky-300' : 'text-slate-300'}">
                    Replication ${trialIdx + 1}
                  </span>
                  ${isOutlier ? `
                    <span class="text-[10px] font-mono bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">
                      ⚠️ Outlier
                    </span>
                  ` : (val !== null ? `<span class="text-xs text-emerald-400">✓ Recorded</span>` : `<span class="text-xs text-slate-500">Pending</span>`)}
                </div>

                <div class="space-y-2">
                  <label class="block text-[11px] text-slate-400">Recorded Time (seconds):</label>
                  <div class="flex items-center gap-2">
                    <input type="number" step="0.01" min="0.1" id="trial-input-${trialIdx}" value="${val !== null ? val : ''}" 
                           placeholder="0.00" 
                           class="w-full bg-slate-900 border ${isOutlier ? 'border-amber-500' : 'border-white/15'} rounded-xl px-3 py-2 text-base text-white font-mono font-bold focus:border-sky-400 outline-none"
                           onchange="window.labEngine.updateTrialValue(${this.activeToyIndex}, ${trialIdx}, this.value)">
                    <span class="text-xs font-mono text-slate-400">s</span>
                  </div>

                  <!-- Quality Control Checkpoints -->
                  <div class="pt-2 border-t border-white/5 space-y-2 text-[11px]">
                    <div class="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Quality Checkpoints:</div>
                    
                    <label class="flex items-start gap-2 cursor-pointer text-slate-300">
                      <input type="checkbox" id="check-full-${trialIdx}" ${check.fullDist ? 'checked' : ''} 
                             onchange="window.labEngine.updateQualityCheck(${this.activeToyIndex}, ${trialIdx}, 'fullDist', this.checked)"
                             class="mt-0.5 rounded border-white/20 bg-slate-800 text-sky-500 focus:ring-0">
                      <span>Traveled full 20.0 cm without stopping or veering</span>
                    </label>

                    <label class="flex items-start gap-2 cursor-pointer text-slate-300">
                      <input type="checkbox" id="check-precise-${trialIdx}" ${check.precise ? 'checked' : ''} 
                             onchange="window.labEngine.updateQualityCheck(${this.activeToyIndex}, ${trialIdx}, 'precise', this.checked)"
                             class="mt-0.5 rounded border-white/20 bg-slate-800 text-sky-500 focus:ring-0">
                      <span>Stopwatch start &amp; stop synchronized precisely</span>
                    </label>
                  </div>

                  ${isOutlier ? `
                    <div class="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 space-y-1">
                      <p><strong>Outlier Notice:</strong> This trial (${val} s) differs substantially from your other trials. We recommend repeating this replication.</p>
                      <button onclick="window.labEngine.clearTrial(${this.activeToyIndex}, ${trialIdx})" class="px-2 py-1 rounded bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 font-bold text-[10px] uppercase transition-colors">
                        🔄 Repeat Trial ${trialIdx + 1}
                      </button>
                    </div>
                  ` : ''}

                  ${(!check.fullDist || !check.precise) ? `
                    <div class="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[10px] text-rose-300">
                      ⚠️ Quality warning: If the toy stalled or timing had reaction error, re-run this replication for scientific rigor.
                    </div>
                  ` : ''}

                </div>

              </div>
            `;
          }).join('')}
        </div>

        <div class="p-3 rounded-xl bg-slate-900/50 border border-white/10 flex items-center justify-between text-xs">
          <span class="text-slate-300">Active Target: <strong>Replication ${this.activeTrialIndex + 1}</strong> of ${currentToy.name}</span>
          <span class="text-slate-400 font-mono">Use the stopwatch above, then click <strong>"Capture Stopwatch Time"</strong></span>
        </div>
      </div>
    `;
  }

  switchActiveToy(idx) {
    this.activeToyIndex = idx;
    this.activeTrialIndex = 0;
    if (window.labSound) window.labSound.playClick();
    this.renderStep2DataCollection();
  }

  setActiveTrial(trialIdx) {
    this.activeTrialIndex = trialIdx;
    this.renderStep2DataCollection();
  }

  fillActiveTrial(seconds) {
    const toy = this.toys[this.activeToyIndex];
    toy.trials[this.activeTrialIndex] = seconds;
    if (window.labSound) window.labSound.playClick();

    // Move to next pending trial automatically if available
    const nextPending = toy.trials.findIndex(t => t === null);
    if (nextPending !== -1) {
      this.activeTrialIndex = nextPending;
    }

    this.renderStep2DataCollection();
  }

  updateTrialValue(toyIdx, trialIdx, valStr) {
    const val = parseFloat(valStr);
    this.toys[toyIdx].trials[trialIdx] = isNaN(val) ? null : parseFloat(val.toFixed(2));
    this.renderStep2DataCollection();
  }

  updateQualityCheck(toyIdx, trialIdx, checkField, isChecked) {
    this.toys[toyIdx].checks[trialIdx][checkField] = isChecked;
    this.renderStep2DataCollection();
  }

  clearTrial(toyIdx, trialIdx) {
    this.toys[toyIdx].trials[trialIdx] = null;
    this.activeToyIndex = toyIdx;
    this.activeTrialIndex = trialIdx;
    if (window.labSound) window.labSound.playClick();
    this.renderStep2DataCollection();
  }

  detectOutliers(toy) {
    const valid = toy.trials.filter(t => t !== null && !isNaN(t));
    toy.outlierIndex = -1;
    if (valid.length < 3) return;

    // Find median of the 3 numbers
    const sorted = [...toy.trials].sort((a, b) => a - b);
    const median = sorted[1];

    // If any trial deviates from median by > 25% or > 0.6s
    for (let i = 0; i < 3; i++) {
      const diff = Math.abs(toy.trials[i] - median);
      if (diff / median > 0.25 || diff > 0.6) {
        toy.outlierIndex = i;
        if (window.labSound) window.labSound.playOutlierAlert();
        break;
      }
    }
  }

  prefillSampleData(toyIdx) {
    // Helpful demo helper if student needs quick testing
    const presets = [
      [2.35, 2.42, 2.38],
      [4.10, 4.25, 4.18],
      [1.75, 1.82, 1.79]
    ];
    this.toys[toyIdx].trials = [...presets[toyIdx]];
    if (window.labSound) window.labSound.playSuccess();
    this.renderStep2DataCollection();
  }

  // -----------------------------------------------------------------
  // STEP 3: Guided Average Time Calculation (t_avg)
  // -----------------------------------------------------------------
  renderStep3Averages() {
    const container = document.getElementById('step3-averages-container');
    if (!container) return;

    container.innerHTML = this.toys.map((toy, idx) => {
      const t1 = toy.trials[0] || 0;
      const t2 = toy.trials[1] || 0;
      const t3 = toy.trials[2] || 0;
      const correctAvg = parseFloat(((t1 + t2 + t3) / 3).toFixed(2));
      toy.correctAvgTime = correctAvg;

      return `
        <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full" style="background: ${toy.color}"></span>
              <span>${toy.name}</span>
            </h4>
            <span class="text-xs font-mono text-slate-400">Fixed Distance: 20.0 cm</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-300">
            <div class="p-2 rounded bg-black/30 border border-white/5">Trial 1: <strong>${t1} s</strong></div>
            <div class="p-2 rounded bg-black/30 border border-white/5">Trial 2: <strong>${t2} s</strong></div>
            <div class="p-2 rounded bg-black/30 border border-white/5">Trial 3: <strong>${t3} s</strong></div>
          </div>

          <div class="p-3 rounded-xl bg-sky-950/20 border border-sky-500/20 text-xs text-slate-300 space-y-1 font-mono">
            <span class="text-sky-300 font-bold block">Averaging Formula:</span>
            <div>t<sub>avg</sub> = (t<sub>1</sub> + t<sub>2</sub> + t<sub>3</sub>) / 3</div>
            <div>t<sub>avg</sub> = (${t1} + ${t2} + ${t3}) / 3</div>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <div class="flex items-center gap-2">
              <label class="text-xs text-slate-300">Your Calculated Average (s):</label>
              <input type="number" step="0.01" id="input-avg-${idx}" value="${toy.studentAvgTime !== null ? toy.studentAvgTime : ''}"
                     placeholder="0.00" 
                     class="w-28 bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-sm text-white font-mono font-bold focus:border-sky-400 outline-none">
            </div>

            <button onclick="window.labEngine.checkAverage(${idx})" class="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95">
              Check Average ✓
            </button>

            <span id="feedback-avg-${idx}" class="text-xs font-medium">
              ${toy.avgTimeVerified ? '<span class="text-emerald-300 font-bold">✓ Verified Correct!</span>' : ''}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  checkAverage(idx) {
    const toy = this.toys[idx];
    const input = document.getElementById(`input-avg-${idx}`);
    const feedback = document.getElementById(`feedback-avg-${idx}`);
    if (!input || !feedback) return;

    const val = parseFloat(input.value);
    if (isNaN(val)) {
      feedback.innerHTML = `<span class="text-rose-400">Please enter a numerical average time.</span>`;
      return;
    }

    toy.studentAvgTime = val;
    const diff = Math.abs(val - toy.correctAvgTime);

    if (diff <= 0.06) {
      toy.avgTimeVerified = true;
      if (window.labSound) window.labSound.playSuccess();
      feedback.innerHTML = `<span class="text-emerald-300 font-bold">✓ Excellent! Your average calculation is accurate.</span>`;
    } else if (Math.abs(val - (toy.trials[0] + toy.trials[1] + toy.trials[2])) <= 0.2) {
      toy.avgTimeVerified = false;
      if (window.labSound) window.labSound.playOutlierAlert();
      feedback.innerHTML = `<span class="text-amber-300">You added the three times together, but forgot to divide by 3!</span>`;
    } else {
      toy.avgTimeVerified = false;
      if (window.labSound) window.labSound.playOutlierAlert();
      feedback.innerHTML = `<span class="text-rose-400">Check your arithmetic in the Desmos calculator on the right. Sum the 3 trials first: (${toy.trials.join(' + ')}) / 3.</span>`;
    }
  }

  // -----------------------------------------------------------------
  // STEP 4: Guided Average Speed Calculation (v = d / t_avg)
  // -----------------------------------------------------------------
  renderStep4Speeds() {
    const container = document.getElementById('step4-speeds-container');
    if (!container) return;

    container.innerHTML = this.toys.map((toy, idx) => {
      const tAvg = toy.studentAvgTime || toy.correctAvgTime || 2.0;
      const correctSpeed = parseFloat((this.distanceCm / tAvg).toFixed(2));
      toy.correctSpeed = correctSpeed;

      return `
        <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full" style="background: ${toy.color}"></span>
              <span>${toy.name}</span>
            </h4>
            <span class="text-xs font-mono text-slate-400">Distance d = <strong>20.0 cm</strong></span>
          </div>

          <div class="p-3 rounded-xl bg-sky-950/20 border border-sky-500/20 text-xs text-slate-300 space-y-1 font-mono">
            <span class="text-sky-300 font-bold block">Speed Calculation Formula:</span>
            <div>Speed (v) = Distance (d) / Average Time (t<sub>avg</sub>)</div>
            <div>v = 20.0 cm / ${tAvg} s</div>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <div class="flex items-center gap-2">
              <label class="text-xs text-slate-300">Calculated Speed (cm/s):</label>
              <input type="number" step="0.01" id="input-speed-${idx}" value="${toy.studentSpeed !== null ? toy.studentSpeed : ''}"
                     placeholder="0.00" 
                     class="w-28 bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-sm text-white font-mono font-bold focus:border-sky-400 outline-none">
            </div>

            <button onclick="window.labEngine.checkSpeed(${idx})" class="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95">
              Verify Speed ✓
            </button>

            <span id="feedback-speed-${idx}" class="text-xs font-medium">
              ${toy.speedVerified ? '<span class="text-emerald-300 font-bold">✓ Speed Verified!</span>' : ''}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  checkSpeed(idx) {
    const toy = this.toys[idx];
    const input = document.getElementById(`input-speed-${idx}`);
    const feedback = document.getElementById(`feedback-speed-${idx}`);
    if (!input || !feedback) return;

    const val = parseFloat(input.value);
    if (isNaN(val)) {
      feedback.innerHTML = `<span class="text-rose-400">Please enter a numerical speed.</span>`;
      return;
    }

    toy.studentSpeed = val;
    const diff = Math.abs(val - toy.correctSpeed);

    if (diff <= 0.15) {
      toy.speedVerified = true;
      if (window.labSound) window.labSound.playSuccess();
      feedback.innerHTML = `<span class="text-emerald-300 font-bold">✓ Great work! Speed = ${toy.correctSpeed} cm/s.</span>`;
    } else {
      toy.speedVerified = false;
      if (window.labSound) window.labSound.playOutlierAlert();
      feedback.innerHTML = `<span class="text-rose-400">Check division in Desmos: 20.0 cm divided by ${toy.studentAvgTime} s.</span>`;
    }
  }

  // -----------------------------------------------------------------
  // STEP 5: CAST Data Studio Scientific Bar Chart
  // -----------------------------------------------------------------
  renderStep5BarChart() {
    const container = document.getElementById('cast-graph-container');
    if (!container) return;

    // Check if CASTGraphEngine is loaded
    if (typeof CASTGraphEngine === 'undefined') {
      console.warn("CASTGraphEngine not loaded.");
      return;
    }

    const toyNames = this.toys.map(t => t.name);
    const speeds = this.toys.map(t => t.studentSpeed || t.correctSpeed || 5.0);

    // Instantiate CASTGraphEngine bar chart
    try {
      this.graphEngine = new CASTGraphEngine(container, {
        title: "Comparison of Wind-Up Toy Speeds (20.0 cm Track)",
        chartType: "bar",
        theme: "dark",
        xAxis: {
          label: "Wind-Up Toy Identifier",
          unit: ""
        },
        yAxis: {
          label: "Average Speed",
          unit: "cm/s",
          beginAtZero: true
        },
        xValues: [1, 2, 3],
        pointLabels: toyNames,
        series: [
          {
            id: "speed-series",
            label: "Average Speed",
            unit: "cm/s",
            color: "#38bdf8",
            values: speeds
          }
        ]
      });
    } catch (e) {
      console.error("Error creating CAST graph:", e);
    }
  }

  exportChartPng() {
    if (this.graphEngine && this.graphEngine.exportImage) {
      this.graphEngine.exportImage("wind_up_toy_speed_chart.png");
    } else {
      const canvas = document.querySelector('#cast-graph-container canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = 'wind_up_toy_speed_chart.png';
        link.href = canvas.toDataURL();
        link.click();
      }
    }
  }

  // -----------------------------------------------------------------
  // STEP 6: Scientific CER Studio (Claim, Evidence, Reasoning)
  // -----------------------------------------------------------------
  renderStep6CER() {
    const claimInput = document.getElementById('cer-claim-input');
    const evidenceInput = document.getElementById('cer-evidence-input');
    const reasoningInput = document.getElementById('cer-reasoning-input');

    if (claimInput) claimInput.value = this.cer.claim;
    if (evidenceInput) evidenceInput.value = this.cer.evidence;
    if (reasoningInput) reasoningInput.value = this.cer.reasoning;
  }

  insertDataSnippet() {
    const evidenceInput = document.getElementById('cer-evidence-input');
    if (!evidenceInput) return;

    const dataSummary = this.toys.map(t => {
      const s = t.studentSpeed || t.correctSpeed || 0;
      const tm = t.studentAvgTime || t.correctAvgTime || 0;
      return `${t.name} (average time: ${tm} s, speed: ${s} cm/s)`;
    }).join('; ');

    const snippet = `Based on our lab data over the 20.0 cm distance: ${dataSummary}.`;
    evidenceInput.value = (evidenceInput.value ? evidenceInput.value + "\n" : "") + snippet;
    this.cer.evidence = evidenceInput.value;
    if (window.labSound) window.labSound.playClick();
  }

  // -----------------------------------------------------------------
  // Validation & Submission
  // -----------------------------------------------------------------
  validateCurrentStep(silent = false) {
    if (this.currentStep === 1) {
      // Validate toy names
      return true;
    }

    if (this.currentStep === 2) {
      // Check if all 3 toys have 3 trials recorded
      for (let i = 0; i < this.toys.length; i++) {
        const toy = this.toys[i];
        const missing = toy.trials.some(t => t === null || isNaN(t));
        if (missing) {
          if (!silent) alert(`Please record all 3 replications for ${toy.name} before moving forward.`);
          return false;
        }
      }
      return true;
    }

    if (this.currentStep === 3) {
      // Check if all 3 averages verified
      const allVerified = this.toys.every(t => t.avgTimeVerified);
      if (!allVerified && !silent) {
        alert("Please click 'Check Average ✓' for all 3 toys and verify your calculations before continuing.");
        return false;
      }
      return true;
    }

    if (this.currentStep === 4) {
      // Check if all 3 speeds verified
      const allVerified = this.toys.every(t => t.speedVerified);
      if (!allVerified && !silent) {
        alert("Please click 'Verify Speed ✓' for all 3 toys before continuing to the bar chart.");
        return false;
      }
      return true;
    }

    if (this.currentStep === 6) {
      // Validate CER fields
      const claim = document.getElementById('cer-claim-input').value.trim();
      const evidence = document.getElementById('cer-evidence-input').value.trim();
      const reasoning = document.getElementById('cer-reasoning-input').value.trim();

      if (!claim || !evidence || !reasoning) {
        if (!silent) alert("Please complete all three sections of your scientific explanation (Claim, Evidence, and Reasoning).");
        return false;
      }

      this.cer.claim = claim;
      this.cer.evidence = evidence;
      this.cer.reasoning = reasoning;
      this.submitLab();
      return true;
    }

    return true;
  }

  async submitLab() {
    const payload = {
      labTitle: "Wind-Up Toy Speed Lab",
      distanceCm: this.distanceCm,
      toys: this.toys.map(t => ({
        name: t.name,
        trials: t.trials,
        avgTime: t.studentAvgTime,
        speedCmPerSec: t.studentSpeed
      })),
      cer: this.cer
    };

    if (window.labAuth) {
      const success = await window.labAuth.saveLabResults(payload);
      if (success) {
        if (window.labSound) window.labSound.playSuccess();
        if (window.confetti) {
          window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
        document.getElementById('modal-completion').classList.remove('hidden');
      }
    }
  }

  restoreSavedState(state) {
    if (state.toys) this.toys = state.toys;
    if (state.cer) this.cer = state.cer;
    this.renderActiveStep();
  }
}

window.labEngine = new WindUpLabEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.labEngine.init();
});

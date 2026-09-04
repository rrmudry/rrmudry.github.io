/**
 * LabEngine - Interactive Guided Lab Wizard for Wind-Up Toy Speed Lab
 * Aligned with CAST Science Standards and HS-PS2-1.
 * Sequential workflow: One toy at a table at a time.
 */

class WindUpLabEngine {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.distanceCm = 20.0; // 20.0 cm track

    // 3 toys tested sequentially
    this.toys = [
      {
        id: 0,
        name: "Toy 1",
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
        name: "Toy 2",
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
        name: "Toy 3",
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
    if (this.currentStep === 1) {
      this.renderStep1DataCollection();
    } else if (this.currentStep === 2) {
      this.renderStep2Averages();
    } else if (this.currentStep === 3) {
      this.renderStep3Speeds();
    } else if (this.currentStep === 4) {
      this.renderStep4BarChart();
    } else if (this.currentStep === 5) {
      this.renderStep5CER();
    }
  }

  // -----------------------------------------------------------------
  // STEP 1: Data Collection & Timing (One Toy at a Time)
  // -----------------------------------------------------------------
  renderStep1DataCollection() {
    const tabsContainer = document.getElementById('step1-toy-tabs');
    const tableContainer = document.getElementById('step1-data-table-container');
    if (!tabsContainer || !tableContainer) return;

    // Render Toy Selection Tabs
    tabsContainer.innerHTML = this.toys.map((toy, idx) => {
      const isComplete = toy.trials.every(t => t !== null && !isNaN(t));
      return `
        <button class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
          idx === this.activeToyIndex
            ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 ring-2 ring-sky-400'
            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
        }" onclick="window.labEngine.switchActiveToy(${idx})">
          <span class="w-2.5 h-2.5 rounded-full" style="background: ${toy.color}"></span>
          <span id="tab-label-${idx}">${toy.name}</span>
          ${isComplete ? '<span class="text-emerald-300 text-[10px] ml-1">✓</span>' : ''}
        </button>
      `;
    }).join('');

    const currentToy = this.toys[this.activeToyIndex];

    // Check for outliers across the 3 replications
    this.detectOutliers(currentToy);

    const hasAllTrials = currentToy.trials.every(t => t !== null && !isNaN(t));

    // Render Active Toy Details & 3 Replications
    tableContainer.innerHTML = `
      <div class="space-y-4">
        
        <!-- Active Toy Name Input Banner -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-white/10">
          <div class="flex-1">
            <label class="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Active Toy at Table (Toy ${this.activeToyIndex + 1} of 3):
            </label>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full flex-shrink-0" style="background: ${currentToy.color}"></span>
              <input type="text" id="active-toy-name-input" value="${currentToy.name}" placeholder="e.g., Green Flipping Frog, Racing Beetle..." 
                     class="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-1.5 text-sm text-white font-semibold focus:border-sky-400 outline-none transition-colors"
                     oninput="window.labEngine.updateActiveToyName(this.value)">
            </div>
          </div>
          <div class="text-right sm:border-l sm:border-white/10 sm:pl-4">
            <span class="text-[11px] text-slate-400 font-mono block">Track Distance</span>
            <span class="text-sm font-bold text-sky-300 font-mono">20.0 cm</span>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-300">
            Record 3 trials for <strong>${currentToy.name}</strong> before returning it:
          </span>
          <button onclick="window.labEngine.prefillSampleData(${this.activeToyIndex})" class="text-[11px] text-sky-300 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg border border-sky-500/20 transition-colors">
            Demo Autofill
          </button>
        </div>

        <!-- 3 Replications Grid -->
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
                  <div class="pt-2 border-t border-white/5 space-y-1.5 text-[11px]">
                    <label class="flex items-start gap-2 cursor-pointer text-slate-300">
                      <input type="checkbox" id="check-full-${trialIdx}" ${check.fullDist ? 'checked' : ''} 
                             onchange="window.labEngine.updateQualityCheck(${this.activeToyIndex}, ${trialIdx}, 'fullDist', this.checked)"
                             class="mt-0.5 rounded border-white/20 bg-slate-800 text-sky-500 focus:ring-0">
                      <span>Traveled full 20.0 cm</span>
                    </label>

                    <label class="flex items-start gap-2 cursor-pointer text-slate-300">
                      <input type="checkbox" id="check-precise-${trialIdx}" ${check.precise ? 'checked' : ''} 
                             onchange="window.labEngine.updateQualityCheck(${this.activeToyIndex}, ${trialIdx}, 'precise', this.checked)"
                             class="mt-0.5 rounded border-white/20 bg-slate-800 text-sky-500 focus:ring-0">
                      <span>Stopwatch synchronized</span>
                    </label>
                  </div>

                  ${isOutlier ? `
                    <div class="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 space-y-1">
                      <p><strong>Outlier Notice:</strong> This trial (${val} s) differs substantially from your other trials. We recommend repeating this replication now while you have the toy.</p>
                      <button onclick="window.labEngine.clearTrial(${this.activeToyIndex}, ${trialIdx})" class="px-2 py-1 rounded bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 font-bold text-[10px] uppercase transition-colors">
                        🔄 Repeat Trial ${trialIdx + 1}
                      </button>
                    </div>
                  ` : ''}

                </div>

              </div>
            `;
          }).join('')}
        </div>

        <!-- Guidance Banner for Toy Transition -->
        ${hasAllTrials ? (
          this.activeToyIndex === 0 ? `
            <div class="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2 text-slate-300">
                <span class="text-lg">🔁</span>
                <span><strong>Toy 1 Finished:</strong> Return ${currentToy.name} to the supply table, then grab your next toy.</span>
              </div>
              <button onclick="window.labEngine.switchActiveToy(1)" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-all shadow-md active:scale-95 whitespace-nowrap">
                Test Toy 2 &rarr;
              </button>
            </div>
          ` : this.activeToyIndex === 1 ? `
            <div class="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2 text-slate-300">
                <span class="text-lg">🔁</span>
                <span><strong>Toy 2 Finished:</strong> Return ${currentToy.name} to the supply table, then grab your final toy.</span>
              </div>
              <button onclick="window.labEngine.switchActiveToy(2)" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-all shadow-md active:scale-95 whitespace-nowrap">
                Test Toy 3 &rarr;
              </button>
            </div>
          ` : `
            <div class="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2 text-emerald-300">
                <span class="text-lg">✅</span>
                <span><strong>All 3 Toys Complete!</strong> Return Toy 3 to the supply table and proceed to calculations.</span>
              </div>
              <button onclick="window.labEngine.goToStep(2)" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-md active:scale-95 whitespace-nowrap">
                Calculate Averages &rarr;
              </button>
            </div>
          `
        ) : `
          <div class="p-3 rounded-xl bg-slate-900/50 border border-white/10 flex items-center justify-between text-xs">
            <span class="text-slate-300">Active Target: <strong>Replication ${this.activeTrialIndex + 1}</strong> of ${currentToy.name}</span>
            <span class="text-slate-400 font-mono">Use the stopwatch above, then click <strong>"Capture Time"</strong></span>
          </div>
        `}

      </div>
    `;
  }

  updateActiveToyName(val) {
    const trimmed = val.trim();
    this.toys[this.activeToyIndex].name = trimmed || `Toy ${this.activeToyIndex + 1}`;
    const tabLabel = document.getElementById(`tab-label-${this.activeToyIndex}`);
    if (tabLabel) tabLabel.textContent = this.toys[this.activeToyIndex].name;
  }

  switchActiveToy(idx) {
    this.activeToyIndex = idx;
    this.activeTrialIndex = 0;
    if (window.stopwatch) window.stopwatch.reset();
    if (window.labSound) window.labSound.playClick();
    this.renderStep1DataCollection();
  }

  setActiveTrial(trialIdx) {
    this.activeTrialIndex = trialIdx;
    this.renderStep1DataCollection();
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

    this.renderStep1DataCollection();
  }

  updateTrialValue(toyIdx, trialIdx, valStr) {
    const val = parseFloat(valStr);
    this.toys[toyIdx].trials[trialIdx] = isNaN(val) ? null : parseFloat(val.toFixed(2));
    this.renderStep1DataCollection();
  }

  updateQualityCheck(toyIdx, trialIdx, checkField, isChecked) {
    this.toys[toyIdx].checks[trialIdx][checkField] = isChecked;
    this.renderStep1DataCollection();
  }

  clearTrial(toyIdx, trialIdx) {
    this.toys[toyIdx].trials[trialIdx] = null;
    this.activeToyIndex = toyIdx;
    this.activeTrialIndex = trialIdx;
    if (window.stopwatch) window.stopwatch.reset();
    if (window.labSound) window.labSound.playClick();
    this.renderStep1DataCollection();
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
    const presets = [
      { name: "Green Flipping Frog", trials: [2.35, 2.42, 2.38] },
      { name: "Blue Racing Beetle", trials: [4.10, 4.25, 4.18] },
      { name: "Clockwork Robot", trials: [1.75, 1.82, 1.79] }
    ];
    this.toys[toyIdx].name = presets[toyIdx].name;
    this.toys[toyIdx].trials = [...presets[toyIdx].trials];
    if (window.labSound) window.labSound.playSuccess();
    this.renderStep1DataCollection();
  }

  // -----------------------------------------------------------------
  // STEP 2: Calculate Average Time (Plain Language)
  // -----------------------------------------------------------------
  renderStep2Averages() {
    const container = document.getElementById('step2-averages-container');
    if (!container) return;

    this.updateCalculatorNumbers();

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
              <span class="w-3 h-3 rounded-full" style="background: ${toy.color}"></span>
              <span>${toy.name}</span>
            </h4>
            <span class="text-xs font-mono text-slate-400">Track Distance: <strong>20.0 cm</strong></span>
          </div>

          <!-- 3 Recorded Times Display -->
          <div class="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div class="p-2.5 rounded-xl bg-slate-900 border border-white/10">
              <span class="text-[10px] text-slate-400 block uppercase tracking-wider mb-0.5">Trial 1</span>
              <strong class="text-base text-white">${t1} s</strong>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900 border border-white/10">
              <span class="text-[10px] text-slate-400 block uppercase tracking-wider mb-0.5">Trial 2</span>
              <strong class="text-base text-white">${t2} s</strong>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900 border border-white/10">
              <span class="text-[10px] text-slate-400 block uppercase tracking-wider mb-0.5">Trial 3</span>
              <strong class="text-base text-white">${t3} s</strong>
            </div>
          </div>

          <!-- Plain Language Instructions -->
          <div class="p-3.5 rounded-xl bg-sky-950/25 border border-sky-500/25 space-y-1.5 text-xs text-slate-200">
            <div class="font-bold text-sky-300 text-sm">How to find the average time:</div>
            <div class="space-y-1 text-slate-200">
              <div><strong>Step 1:</strong> Add your 3 times together: <span class="font-mono text-white font-bold bg-black/40 px-1.5 py-0.5 rounded border border-white/10">${t1} + ${t2} + ${t3}</span></div>
              <div><strong>Step 2:</strong> Divide that total by <strong>3</strong>.</div>
            </div>
            <div class="pt-1 text-[11px] text-slate-400">
              In the calculator: type <code>(${t1} + ${t2} + ${t3}) / 3</code>
            </div>
          </div>

          <!-- Student Input & Check Button -->
          <div class="flex flex-wrap items-center gap-3 pt-1">
            <div class="flex items-center gap-2">
              <label class="text-xs text-slate-300 font-medium">Average Time (in seconds):</label>
              <input type="number" step="0.01" id="input-avg-${idx}" value="${toy.studentAvgTime !== null ? toy.studentAvgTime : ''}"
                     placeholder="0.00" 
                     class="w-28 bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-sm text-white font-mono font-bold focus:border-sky-400 outline-none">
            </div>

            <button onclick="window.labEngine.checkAverage(${idx})" class="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95">
              Check Average ✓
            </button>

            <span id="feedback-avg-${idx}" class="text-xs font-medium">
              ${toy.avgTimeVerified ? '<span class="text-emerald-300 font-bold">✓ Correct average!</span>' : ''}
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
      feedback.innerHTML = `<span class="text-rose-400">Please enter a number for average time.</span>`;
      return;
    }

    toy.studentAvgTime = val;
    const diff = Math.abs(val - toy.correctAvgTime);

    if (diff <= 0.06) {
      toy.avgTimeVerified = true;
      if (window.labSound) window.labSound.playSuccess();
      feedback.innerHTML = `<span class="text-emerald-300 font-bold">✓ Correct! The average time is ${toy.correctAvgTime} seconds.</span>`;
      this.updateCalculatorNumbers();
    } else if (Math.abs(val - (toy.trials[0] + toy.trials[1] + toy.trials[2])) <= 0.2) {
      toy.avgTimeVerified = false;
      if (window.labSound) window.labSound.playOutlierAlert();
      feedback.innerHTML = `<span class="text-amber-300">You added the 3 times together, but forgot to divide by 3!</span>`;
    } else {
      toy.avgTimeVerified = false;
      if (window.labSound) window.labSound.playOutlierAlert();
      feedback.innerHTML = `<span class="text-rose-400">In the calculator: add your 3 times in parentheses (${toy.trials.join(' + ')}), then divide by 3.</span>`;
    }
  }

  // -----------------------------------------------------------------
  // STEP 3: Calculate Speed (Plain Language)
  // -----------------------------------------------------------------
  renderStep3Speeds() {
    const container = document.getElementById('step3-speeds-container');
    if (!container) return;

    this.updateCalculatorNumbers();

    container.innerHTML = this.toys.map((toy, idx) => {
      const tAvg = toy.studentAvgTime || toy.correctAvgTime || 2.0;
      const correctSpeed = parseFloat((this.distanceCm / tAvg).toFixed(2));
      toy.correctSpeed = correctSpeed;

      return `
        <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" style="background: ${toy.color}"></span>
              <span>${toy.name}</span>
            </h4>
            <span class="text-xs font-mono text-slate-400">Track Distance: <strong>20.0 cm</strong></span>
          </div>

          <!-- Plain Language Instructions -->
          <div class="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/25 space-y-1.5 text-xs text-slate-200">
            <div class="font-bold text-emerald-300 text-sm">How to find speed:</div>
            <div>
              Speed tells you how many centimeters the toy traveled each second.
            </div>
            <div>
              <strong>Divide the distance (20.0 cm) by your average time (${tAvg} s):</strong>
            </div>
            <div class="font-mono text-sm text-white bg-black/40 px-2.5 py-1 rounded-lg border border-white/10 inline-block font-bold">
              20.0 ÷ ${tAvg} = ?
            </div>
            <div class="text-[11px] text-slate-400">
              In the calculator: type <code>20 / ${tAvg}</code>
            </div>
          </div>

          <!-- Student Input & Check Button -->
          <div class="flex flex-wrap items-center gap-3 pt-1">
            <div class="flex items-center gap-2">
              <label class="text-xs text-slate-300 font-medium">Speed (in cm per second):</label>
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
      feedback.innerHTML = `<span class="text-rose-400">Please enter a number for speed.</span>`;
      return;
    }

    toy.studentSpeed = val;
    const diff = Math.abs(val - toy.correctSpeed);

    if (diff <= 0.15) {
      toy.speedVerified = true;
      if (window.labSound) window.labSound.playSuccess();
      feedback.innerHTML = `<span class="text-emerald-300 font-bold">✓ Great work! Speed is ${toy.correctSpeed} cm per second.</span>`;
    } else {
      toy.speedVerified = false;
      if (window.labSound) window.labSound.playOutlierAlert();
      feedback.innerHTML = `<span class="text-rose-400">In the calculator: divide 20 by your average time: 20 ÷ ${toy.studentAvgTime}.</span>`;
    }
  }

  updateCalculatorNumbers() {
    const display = document.getElementById('calc-numbers-display');
    if (!display) return;

    display.innerHTML = this.toys.map((toy, idx) => {
      const t1 = toy.trials[0] !== null ? `${toy.trials[0]} s` : '---';
      const t2 = toy.trials[1] !== null ? `${toy.trials[1]} s` : '---';
      const t3 = toy.trials[2] !== null ? `${toy.trials[2]} s` : '---';
      const avg = toy.studentAvgTime !== null ? `${toy.studentAvgTime} s` : (toy.correctAvgTime ? `${toy.correctAvgTime} s` : 'not calculated');
      
      return `
        <div class="p-2 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full" style="background: ${toy.color}"></span>
            <span>${toy.name}</span>
          </div>
          <div class="text-[11px] text-slate-300">Times: <strong>${t1}</strong>, <strong>${t2}</strong>, <strong>${t3}</strong></div>
          ${toy.studentAvgTime !== null ? `<div class="text-[11px] text-emerald-300">Average: <strong>${avg}</strong></div>` : ''}
        </div>
      `;
    }).join('');
  }

  // -----------------------------------------------------------------
  // STEP 4: CAST Data Studio Scientific Bar Chart
  // -----------------------------------------------------------------
  renderStep4BarChart() {
    const container = document.getElementById('cast-graph-container');
    if (!container) return;

    if (typeof CASTGraphEngine === 'undefined') {
      console.warn("CASTGraphEngine not loaded.");
      return;
    }

    const toyNames = this.toys.map(t => t.name);
    const speeds = this.toys.map(t => t.studentSpeed || t.correctSpeed || 5.0);

    try {
      this.graphEngine = new CASTGraphEngine(container, {
        title: "Comparison of Wind-Up Toy Speeds (20.0 cm Track)",
        chartType: "bar",
        theme: "dark",
        xAxis: {
          label: "Wind-Up Toy",
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
  // STEP 5: Scientific CER Studio (Claim, Evidence, Reasoning)
  // -----------------------------------------------------------------
  renderStep5CER() {
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
      // Check if all 3 toys have 3 trials recorded
      for (let i = 0; i < this.toys.length; i++) {
        const toy = this.toys[i];
        const missing = toy.trials.some(t => t === null || isNaN(t));
        if (missing) {
          if (!silent) alert(`Please record all 3 replications for ${toy.name} before proceeding to calculations.`);
          return false;
        }
      }
      return true;
    }

    if (this.currentStep === 2) {
      // Check if all 3 averages verified
      const allVerified = this.toys.every(t => t.avgTimeVerified);
      if (!allVerified && !silent) {
        alert("Please click 'Check Average ✓' for all 3 toys and verify your calculations before continuing.");
        return false;
      }
      return true;
    }

    if (this.currentStep === 3) {
      // Check if all 3 speeds verified
      const allVerified = this.toys.every(t => t.speedVerified);
      if (!allVerified && !silent) {
        alert("Please click 'Verify Speed ✓' for all 3 toys before continuing to the bar chart.");
        return false;
      }
      return true;
    }

    if (this.currentStep === 4) {
      // Bar chart step
      return true;
    }

    if (this.currentStep === 5) {
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

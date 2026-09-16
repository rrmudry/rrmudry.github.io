/**
 * LabEngine - Interactive Guided Lab Wizard for Marble Ramp Motion & Graphing Lab
 * Step-by-step workflow with low floor / high ceiling pedagogy.
 * Enforces authentic stopwatch timing (no manual typing), rigorous data consistency (outliers),
 * and requires actual measurement of stack height before advancing.
 */

class MarbleRampLabEngine {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 6;

    this.rampLengthCm = 30.0;
    this.distanceCm = 60.0; // Marked distance across flat table

    // Initial stack heights start as null - students MUST measure them!
    this.levels = [
      {
        id: "low",
        label: "Low Ramp",
        books: 1,
        stackHeightCm: null,
        color: "#d97706",
        darkColor: "#fbbf24",
        trials: [null, null, null],
        checks: [
          { cleanRelease: true, fullDist: true },
          { cleanRelease: true, fullDist: true },
          { cleanRelease: true, fullDist: true }
        ],
        outlierIndex: -1,
        studentAvgTime: null,
        correctAvgTime: null,
        avgTimeVerified: false,
        studentSpeed: null,
        correctSpeed: null,
        speedVerified: false,
        posPoints: [],
        velPoints: []
      },
      {
        id: "med",
        label: "Medium Ramp",
        books: 2,
        stackHeightCm: null,
        color: "#0284c7",
        darkColor: "#38bdf8",
        trials: [null, null, null],
        checks: [
          { cleanRelease: true, fullDist: true },
          { cleanRelease: true, fullDist: true },
          { cleanRelease: true, fullDist: true }
        ],
        outlierIndex: -1,
        studentAvgTime: null,
        correctAvgTime: null,
        avgTimeVerified: false,
        studentSpeed: null,
        correctSpeed: null,
        speedVerified: false,
        posPoints: [],
        velPoints: []
      },
      {
        id: "high",
        label: "High Ramp",
        books: 3,
        stackHeightCm: null,
        color: "#059669",
        darkColor: "#34d399",
        trials: [null, null, null],
        checks: [
          { cleanRelease: true, fullDist: true },
          { cleanRelease: true, fullDist: true },
          { cleanRelease: true, fullDist: true }
        ],
        outlierIndex: -1,
        studentAvgTime: null,
        correctAvgTime: null,
        avgTimeVerified: false,
        studentSpeed: null,
        correctSpeed: null,
        speedVerified: false,
        posPoints: [],
        velPoints: []
      }
    ];

    this.activeLevelIdx = 0;
    this.activeTrialIdx = 0;

    this.posGraph = null;
    this.velGraph = null;

    this.cer = {
      claim: "",
      evidence: "",
      reasoning: ""
    };

    this.init();
  }

  init() {
    this.loadLocalStorage();
    this.setupNavigation();
    this.renderActiveStep();
  }

  // --- LOCAL STORAGE + FIRESTORE PERSISTENCE ---
  saveLocalStorage() {
    try {
      const state = {
        currentStep: this.currentStep,
        distanceCm: this.distanceCm,
        levels: this.levels,
        cer: this.cer
      };
      localStorage.setItem('marble_ramp_lab_data', JSON.stringify(state));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  /**
   * saveProgress - saves to localStorage immediately AND debounces a Firestore
   * cloud write so student progress is never lost (even on tab close / refresh).
   * Use this instead of saveLocalStorage() everywhere.
   */
  saveProgress() {
    this.saveLocalStorage();
    this._debouncedCloudSave();
  }

  _debouncedCloudSave() {
    if (this._cloudSaveTimer) clearTimeout(this._cloudSaveTimer);
    this._cloudSaveTimer = setTimeout(() => {
      this._cloudSaveTimer = null;
      if (window.labAuth && typeof window.labAuth.autoSaveDraft === 'function') {
        const draftData = {
          currentStep: this.currentStep,
          distanceCm: this.distanceCm,
          rampLengthCm: this.rampLengthCm,
          levels: this.levels,
          cer: this.cer
        };
        window.labAuth.autoSaveDraft(draftData);
      }
    }, 1500); // 1.5s debounce to batch rapid changes
  }

  loadLocalStorage() {
    try {
      const saved = localStorage.getItem('marble_ramp_lab_data');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.distanceCm) this.distanceCm = state.distanceCm;
        if (state.levels && state.levels.length === 3) {
          this.levels.forEach((lvl, idx) => {
            const savedLvl = state.levels[idx];
            if (savedLvl) {
              lvl.stackHeightCm = savedLvl.stackHeightCm !== undefined ? savedLvl.stackHeightCm : null;
              lvl.trials = savedLvl.trials || [null, null, null];
              lvl.checks = savedLvl.checks || [
                { cleanRelease: true, fullDist: true },
                { cleanRelease: true, fullDist: true },
                { cleanRelease: true, fullDist: true }
              ];
              lvl.studentAvgTime = savedLvl.studentAvgTime;
              lvl.studentSpeed = savedLvl.studentSpeed;
              lvl.avgTimeVerified = !!savedLvl.avgTimeVerified;
              lvl.speedVerified = !!savedLvl.speedVerified;
              lvl.posPoints = savedLvl.posPoints || [];
              lvl.velPoints = savedLvl.velPoints || [];
              this.detectOutliers(lvl);
            }
          });
        }
        if (state.cer) this.cer = state.cer;
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
  }

  loadExternalState(cloudData) {
    if (!cloudData) return;
    if (cloudData.distanceCm) this.distanceCm = cloudData.distanceCm;
    if (cloudData.levels && cloudData.levels.length === 3) {
      this.levels = cloudData.levels;
      this.levels.forEach(lvl => this.detectOutliers(lvl));
    }
    if (cloudData.cer) this.cer = cloudData.cer;
    this.computeCorrectAveragesAndSpeeds();
    this.renderActiveStep();
  }

  // --- STEP NAVIGATION ---
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

    const dots = document.querySelectorAll('.step-indicator-dot');
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        const targetStep = idx + 1;
        if (targetStep < this.currentStep) {
          this.goToStep(targetStep);
          return;
        }
        for (let s = this.currentStep; s < targetStep; s++) {
          const orig = this.currentStep;
          this.currentStep = s;
          const valid = this.validateCurrentStep(false);
          this.currentStep = orig;
          if (!valid) return;
        }
        this.goToStep(targetStep);
      });
    });
  }

  goToStep(stepNum) {
    if (window.labAuth && !window.labAuth.currentUser) {
      const gate = document.getElementById('loginGateModal');
      if (gate) gate.classList.remove('hidden');
      return;
    }
    if (stepNum < 1) stepNum = 1;
    if (stepNum > this.totalSteps) stepNum = this.totalSteps;
    this.currentStep = stepNum;
    if (window.labSound) window.labSound.playClick();
    this.renderActiveStep();
    this.saveProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderActiveStep() {
    // Hide all step sections
    for (let s = 1; s <= this.totalSteps; s++) {
      const el = document.getElementById(`step-section-${s}`);
      if (el) el.classList.add('hidden');
    }

    // Show active step section
    const activeSec = document.getElementById(`step-section-${this.currentStep}`);
    if (activeSec) activeSec.classList.remove('hidden');

    // Update stepper dot classes
    const dots = document.querySelectorAll('.step-indicator-dot');
    dots.forEach((dot, idx) => {
      const stepIdx = idx + 1;
      dot.classList.remove('bg-sky-600', 'dark:bg-sky-500', 'text-white', 'dark:text-slate-950', 'ring-2', 'ring-sky-300', 'bg-slate-100', 'dark:bg-white/5', 'text-slate-600', 'dark:text-slate-400');
      if (stepIdx === this.currentStep) {
        dot.className = "step-indicator-dot px-3 py-1 rounded-full text-xs font-bold bg-sky-600 dark:bg-sky-500 text-white dark:text-slate-950 shadow-sm ring-2 ring-sky-300 dark:ring-sky-400/50 flex items-center gap-1.5 transition-all cursor-pointer";
      } else if (stepIdx < this.currentStep) {
        dot.className = "step-indicator-dot px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer";
      } else {
        dot.className = "step-indicator-dot px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 flex items-center gap-1.5 transition-all cursor-pointer";
      }
    });

    // Update bottom nav buttons
    const btnPrev = document.getElementById('btn-lab-prev');
    const btnNext = document.getElementById('btn-lab-next');
    if (btnPrev) {
      if (this.currentStep === 1) btnPrev.classList.add('hidden');
      else btnPrev.classList.remove('hidden');
    }
    if (btnNext) {
      if (this.currentStep === this.totalSteps) {
        btnNext.innerHTML = '<span>🚀</span> <span>Submit Lab Investigation</span>';
        btnNext.className = "px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5";
      } else {
        btnNext.innerHTML = '<span>Next Step &rarr;</span>';
        btnNext.className = "px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5";
      }
    }

    // Step-specific render routines
    if (this.currentStep === 1) this.renderStep1Setup();
    else if (this.currentStep === 2) this.renderStep2DataCollection();
    else if (this.currentStep === 3) this.renderStep3Calculations();
    else if (this.currentStep === 4) this.renderStep4PositionGraph();
    else if (this.currentStep === 5) this.renderStep5VelocityGraph();
    else if (this.currentStep === 6) this.renderStep6CER();

    this.updateCalculatorNumbers();
  }

  // --- STEP 1: SETUP & MATERIALS ---
  renderStep1Setup() {
    const distInput = document.getElementById('setup-distance-input');
    if (distInput) {
      distInput.value = this.distanceCm;
      distInput.onchange = (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val >= 30 && val <= 200) {
          this.distanceCm = val;
          this.saveProgress();
        }
      };
    }
  }

  // --- STEP 2: DATA COLLECTION & OUTLIER DETECTION ---
  detectOutliers(lvl) {
    const valid = lvl.trials.filter(t => t !== null && !isNaN(t) && t > 0);
    lvl.outlierIndex = -1;
    if (valid.length < 3) return;

    // Find median of the 3 numbers
    const sorted = [...lvl.trials].sort((a, b) => a - b);
    const median = sorted[1];

    // If any trial deviates from median by > 22% or > 0.45s
    for (let i = 0; i < 3; i++) {
      const diff = Math.abs(lvl.trials[i] - median);
      if (diff > 0.45 || (median > 0 && diff / median > 0.22)) {
        lvl.outlierIndex = i;
        if (window.labSound) window.labSound.playOutlierAlert();
        break;
      }
    }
  }

  renderStep2DataCollection() {
    const tabsContainer = document.getElementById('step2-level-tabs');
    const tableContainer = document.getElementById('step2-trials-container');
    if (!tabsContainer || !tableContainer) return;

    // Render Ramp Level Tabs (Low, Med, High)
    tabsContainer.innerHTML = this.levels.map((lvl, idx) => {
      const isActive = idx === this.activeLevelIdx;
      const hasHeight = lvl.stackHeightCm !== null && lvl.stackHeightCm > 0;
      const isDone = hasHeight && lvl.trials.every(t => t !== null && t > 0) && lvl.outlierIndex === -1;
      const activeClass = isActive
        ? 'bg-sky-600 dark:bg-sky-500 text-white dark:text-slate-950 shadow-md ring-2 ring-sky-300 dark:ring-sky-400/50'
        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10';

      return `
        <button onclick="window.labEngine.setActiveLevel(${idx})" class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeClass}">
          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${lvl.color}"></span>
          <span>${lvl.label}</span>
          ${isDone ? '<span class="text-[10px] text-emerald-400 font-bold">✓ Complete</span>' : (hasHeight ? '<span class="text-[10px] text-sky-400 font-medium">(In Progress)</span>' : '<span class="text-[10px] text-amber-400 font-medium">⚠️ No Height</span>')}
        </button>
      `;
    }).join('');

    const activeLvl = this.levels[this.activeLevelIdx];
    this.detectOutliers(activeLvl);

    const hasHeight = activeLvl.stackHeightCm !== null && activeLvl.stackHeightCm > 0;
    const heightPlaceholder = activeLvl.id === 'low' ? 'e.g. 2.8' : (activeLvl.id === 'med' ? 'e.g. 5.6' : 'e.g. 8.4');

    // Check consistency across trials
    const validTrials = activeLvl.trials.filter(t => t !== null && !isNaN(t) && t > 0);
    let outlierNotice = '';
    if (activeLvl.outlierIndex !== -1) {
      const outVal = activeLvl.trials[activeLvl.outlierIndex];
      outlierNotice = `
        <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/50 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
          <div class="flex items-center gap-2 font-bold">
            <span class="text-base">⚠️</span>
            <span>Data Consistency Alert: Trial ${activeLvl.outlierIndex + 1} (${outVal}s) is an Outlier!</span>
          </div>
          <p class="text-[11px] leading-relaxed">
            In physics, replications must be consistent. This trial differs significantly from your other runs (likely due to a push or late stopwatch stop). Click <strong>Repeat Trial ${activeLvl.outlierIndex + 1}</strong> to re-roll and capture consistent data!
          </p>
        </div>
      `;
    } else if (validTrials.length === 3) {
      outlierNotice = `
        <div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <span>✓</span>
          <span><strong>Good Data Verified:</strong> All 3 timing trials are consistent and within expected scientific tolerance!</span>
        </div>
      `;
    }

    tableContainer.innerHTML = `
      <div class="space-y-4">
        <!-- Level Header & Stack Height Input (Empty by default) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" style="background-color: ${activeLvl.color}"></span>
              ${activeLvl.label} (${activeLvl.books} Book${activeLvl.books > 1 ? 's' : ''})
            </h3>
            <p class="text-xs text-slate-600 dark:text-slate-400">
              Measure the actual stack height with a ruler, then time 3 rolls across the <strong>${this.distanceCm.toFixed(1)} cm</strong> table distance.
            </p>
          </div>

          <!-- Stack Height Required Input -->
          <div class="p-2.5 rounded-xl ${hasHeight ? 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10' : 'bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-500/50'} flex items-center gap-2.5">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider ${hasHeight ? 'text-slate-600 dark:text-slate-400' : 'text-amber-800 dark:text-amber-300'}">
                Stack Height (Required):
              </div>
              <div class="text-[9px] text-slate-500">Measure with ruler</div>
            </div>
            <div class="flex items-center gap-1">
              <input type="number" step="0.1" min="0.5" max="30" 
                     id="stack-height-input"
                     value="${activeLvl.stackHeightCm !== null ? activeLvl.stackHeightCm : ''}" 
                     placeholder="${heightPlaceholder}"
                     onchange="window.labEngine.updateStackHeight(${this.activeLevelIdx}, this.value)"
                     class="w-20 px-2 py-1 bg-white dark:bg-slate-950 border ${hasHeight ? 'border-slate-300 dark:border-white/20' : 'border-amber-500'} rounded-lg text-xs font-mono font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none">
              <span class="font-mono text-xs text-slate-600 dark:text-slate-400">cm</span>
            </div>
          </div>
        </div>

        ${outlierNotice}

        <!-- 3 Trial Replication Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${[0, 1, 2].map(trialIdx => {
            const val = activeLvl.trials[trialIdx];
            const isFilled = val !== null && val > 0;
            const isSelected = this.activeTrialIdx === trialIdx;
            const isOutlier = activeLvl.outlierIndex === trialIdx;
            const check = activeLvl.checks[trialIdx] || { cleanRelease: true, fullDist: true };

            return `
              <div id="trial-card-${trialIdx}" 
                   onclick="window.labEngine.setActiveTrial(${trialIdx})" 
                   class="glass-card p-4 rounded-2xl border transition-all cursor-pointer ${
                     isOutlier 
                       ? 'outlier-card border-amber-500 dark:border-amber-500/60 ring-2 ring-amber-300 dark:ring-amber-500/40' 
                       : (isSelected 
                           ? 'border-sky-500 ring-2 ring-sky-300 dark:ring-sky-500/40 bg-sky-50/40 dark:bg-sky-950/20' 
                           : (isFilled ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60'))
                   }">
                
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-mono font-bold ${isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'}">
                    Replication ${trialIdx + 1}
                  </span>
                  ${isOutlier ? `
                    <span class="text-[10px] font-mono bg-amber-200 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded border border-amber-400 font-bold">
                      ⚠️ Outlier
                    </span>
                  ` : (isFilled ? '<span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">✓ Recorded</span>' : (isSelected ? '<span class="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">Active</span>' : '<span class="text-[11px] text-slate-400">Pending</span>'))}
                </div>

                <!-- Readonly Trial Input (Blocks Manual Typing) -->
                <div class="space-y-1.5">
                  <label class="block text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Stopwatch Time:
                  </label>
                  <div class="relative flex items-center">
                    <input type="text" readonly
                           id="trial-display-${trialIdx}"
                           value="${isFilled ? val.toFixed(2) + ' s' : '--'}" 
                           placeholder="Use Stopwatch"
                           onclick="window.labEngine.handleManualTypeAttempt(${trialIdx})"
                           onkeydown="window.labEngine.handleManualTypeAttempt(${trialIdx})"
                           class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border ${isOutlier ? 'border-amber-500' : 'border-slate-300 dark:border-white/15'} rounded-xl font-mono text-base font-bold text-center text-slate-900 dark:text-white cursor-pointer select-none outline-none">
                    <span class="absolute right-3 text-xs text-slate-400">⏱️</span>
                  </div>
                  <div class="text-[10px] text-slate-500 text-center">
                    ${isFilled ? 'Captured via stopwatch' : 'Click card &amp; press Spacebar to record'}
                  </div>
                </div>

                <!-- Quality Checkpoints -->
                <div class="mt-3 pt-2.5 border-t border-slate-200 dark:border-white/10 space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" ${check.cleanRelease ? 'checked' : ''} 
                           onchange="window.labEngine.updateQualityCheck(${this.activeLevelIdx}, ${trialIdx}, 'cleanRelease', this.checked)"
                           class="rounded">
                    <span>Clean release from rest (no push)</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" ${check.fullDist ? 'checked' : ''} 
                           onchange="window.labEngine.updateQualityCheck(${this.activeLevelIdx}, ${trialIdx}, 'fullDist', this.checked)"
                           class="rounded">
                    <span>Rolled full ${this.distanceCm.toFixed(0)} cm distance</span>
                  </label>
                </div>

                <!-- Re-roll Trial Action -->
                ${isFilled ? `
                  <div class="mt-3 pt-2 border-t border-slate-200 dark:border-white/10 flex justify-end">
                    <button onclick="window.labEngine.repeatTrial(${trialIdx})" class="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1">
                      <span>🔄</span> <span>Repeat Trial ${trialIdx + 1}</span>
                    </button>
                  </div>
                ` : ''}

              </div>
            `;
          }).join('')}
        </div>

        <!-- Guidance Banner -->
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span>💡</span>
            <span><strong>Stopwatch Active:</strong> Spacebar starts/stops the timer. Click <strong>Capture Time</strong> to record directly into the active trial. Direct typing is blocked.</span>
          </div>
          <button onclick="window.labEngine.clearActiveTrials()" class="text-rose-500 hover:text-rose-600 font-semibold transition-colors shrink-0 ml-2">
            Clear This Level
          </button>
        </div>
      </div>
    `;
  }

  // Intercept any attempt to manually type into a trial field
  handleManualTypeAttempt(trialIdx) {
    this.setActiveTrial(trialIdx);

    // Show toast banner
    const toast = document.getElementById('stopwatch-required-toast');
    if (toast) {
      toast.classList.remove('hidden');
      toast.classList.remove('shake-animation');
      void toast.offsetWidth; // Force reflow
      toast.classList.add('shake-animation');
    }

    // Shake the stopwatch banner
    const swContainer = document.getElementById('stopwatch-container');
    if (swContainer) {
      swContainer.classList.remove('shake-animation');
      void swContainer.offsetWidth;
      swContainer.classList.add('shake-animation');
    }

    if (window.labSound) window.labSound.playOutlierAlert();
  }

  setActiveLevel(targetIdx) {
    const currentLvl = this.levels[this.activeLevelIdx];

    // Check if current level has stack height entered before switching away
    if (!currentLvl.stackHeightCm || currentLvl.stackHeightCm <= 0) {
      alert(`📏 Measurement Required: Please measure and enter the actual height of your ${currentLvl.label} book stack in centimeters before moving to another ramp height!`);
      if (window.labSound) window.labSound.playOutlierAlert();
      const input = document.getElementById('stack-height-input');
      if (input) input.focus();
      return;
    }

    this.activeLevelIdx = targetIdx;
    this.activeTrialIdx = 0;
    if (window.labSound) window.labSound.playClick();
    this.renderStep2DataCollection();
    this.updateCalculatorNumbers();
  }

  setActiveTrial(idx) {
    this.activeTrialIdx = idx;
    if (window.labSound) window.labSound.playClick();
    this.renderStep2DataCollection();
  }

  updateStackHeight(lvlIdx, val) {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      this.levels[lvlIdx].stackHeightCm = num;
      this.saveProgress();
      this.renderStep2DataCollection();
      this.updateCalculatorNumbers();
    } else {
      this.levels[lvlIdx].stackHeightCm = null;
      this.saveProgress();
      this.renderStep2DataCollection();
    }
  }

  updateQualityCheck(lvlIdx, trialIdx, checkField, isChecked) {
    if (this.levels[lvlIdx] && this.levels[lvlIdx].checks[trialIdx]) {
      this.levels[lvlIdx].checks[trialIdx][checkField] = isChecked;
      this.saveProgress();
    }
  }

  repeatTrial(trialIdx) {
    const activeLvl = this.levels[this.activeLevelIdx];
    activeLvl.trials[trialIdx] = null;
    this.activeTrialIdx = trialIdx;
    this.detectOutliers(activeLvl);
    this.computeCorrectAveragesAndSpeeds();
    this.saveProgress();
    if (window.labSound) window.labSound.playClick();
    this.renderStep2DataCollection();
    this.updateCalculatorNumbers();
  }

  receiveStopwatchTime(seconds) {
    const activeLvl = this.levels[this.activeLevelIdx];
    activeLvl.trials[this.activeTrialIdx] = seconds;

    // Detect outliers immediately after capture
    this.detectOutliers(activeLvl);
    this.computeCorrectAveragesAndSpeeds();
    this.saveProgress();

    // Advance to next empty trial in this level if available
    const nextEmptyIdx = activeLvl.trials.findIndex(t => t === null);
    if (nextEmptyIdx >= 0) {
      this.activeTrialIdx = nextEmptyIdx;
    } else if (activeLvl.outlierIndex !== -1) {
      this.activeTrialIdx = activeLvl.outlierIndex;
    }

    this.renderStep2DataCollection();
    this.updateCalculatorNumbers();
    return true;
  }

  clearActiveTrials() {
    this.levels[this.activeLevelIdx].trials = [null, null, null];
    this.levels[this.activeLevelIdx].outlierIndex = -1;
    this.computeCorrectAveragesAndSpeeds();
    this.saveProgress();
    this.renderStep2DataCollection();
    this.updateCalculatorNumbers();
  }

  computeCorrectAveragesAndSpeeds() {
    this.levels.forEach(lvl => {
      const valid = lvl.trials.filter(t => t !== null && !isNaN(t) && t > 0);
      if (valid.length === 3) {
        const sum = valid.reduce((acc, v) => acc + v, 0);
        lvl.correctAvgTime = parseFloat((sum / 3).toFixed(2));
        lvl.correctSpeed = parseFloat((this.distanceCm / lvl.correctAvgTime).toFixed(2));
      } else {
        lvl.correctAvgTime = null;
        lvl.correctSpeed = null;
      }
    });
  }

  // --- STEP 3: CALCULATIONS (AVERAGES & SPEEDS) ---
  renderStep3Calculations() {
    const container = document.getElementById('step3-calculations-container');
    if (!container) return;

    this.computeCorrectAveragesAndSpeeds();

    container.innerHTML = this.levels.map((lvl, idx) => {
      const t1 = lvl.trials[0] || 0;
      const t2 = lvl.trials[1] || 0;
      const t3 = lvl.trials[2] || 0;
      const sum = (t1 + t2 + t3).toFixed(2);
      const heightStr = lvl.stackHeightCm ? parseFloat(lvl.stackHeightCm).toFixed(1) + ' cm' : 'Unspecified';

      return `
        <div class="glass-card p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" style="background-color: ${lvl.color}"></span>
              ${lvl.label} (Height: ${heightStr})
            </h3>
            <span class="text-xs font-mono text-slate-500 dark:text-slate-400">
              Trials: [${t1}s, ${t2}s, ${t3}s] &bull; Sum = ${sum}s
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Part A: Average Time Calculation -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
                  1. Average Time (t_avg)
                </span>
                ${lvl.avgTimeVerified ? '<span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">✓ Verified</span>' : ''}
              </div>
              <p class="text-[11px] text-slate-600 dark:text-slate-400">
                Formula: (Trial 1 + Trial 2 + Trial 3) / 3
              </p>
              <div class="flex items-center gap-2">
                <input type="number" step="0.01" min="0.1" max="20"
                       id="calc-avg-${idx}"
                       value="${lvl.studentAvgTime !== null ? lvl.studentAvgTime : ''}"
                       placeholder="e.g. 2.45"
                       onchange="window.labEngine.verifyAverageTime(${idx}, this.value)"
                       class="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/15 rounded-xl font-mono text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                <span class="font-mono text-xs text-slate-500">seconds</span>
              </div>
              <div id="feedback-avg-${idx}" class="text-xs font-semibold"></div>
            </div>

            <!-- Part B: Velocity Across Table Calculation -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider">
                  2. Speed Across Table (v)
                </span>
                ${lvl.speedVerified ? '<span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">✓ Verified</span>' : ''}
              </div>
              <p class="text-[11px] text-slate-600 dark:text-slate-400">
                Formula: Table Distance (${this.distanceCm.toFixed(1)} cm) / t_avg
              </p>
              <div class="flex items-center gap-2">
                <input type="number" step="0.1" min="1" max="300"
                       id="calc-spd-${idx}"
                       value="${lvl.studentSpeed !== null ? lvl.studentSpeed : ''}"
                       placeholder="e.g. 24.5"
                       onchange="window.labEngine.verifySpeed(${idx}, this.value)"
                       class="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/15 rounded-xl font-mono text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none">
                <span class="font-mono text-xs text-slate-500">cm/s</span>
              </div>
              <div id="feedback-spd-${idx}" class="text-xs font-semibold"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  verifyAverageTime(lvlIdx, val) {
    const studentVal = parseFloat(val);
    const lvl = this.levels[lvlIdx];
    const fbEl = document.getElementById(`feedback-avg-${lvlIdx}`);

    if (isNaN(studentVal) || studentVal <= 0) {
      if (fbEl) fbEl.innerHTML = '';
      return;
    }

    lvl.studentAvgTime = studentVal;
    const correct = lvl.correctAvgTime;
    const tolerance = 0.06; // generous ±0.06s tolerance

    if (Math.abs(studentVal - correct) <= tolerance) {
      lvl.avgTimeVerified = true;
      if (fbEl) fbEl.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400">✓ Perfect! Average is ${correct.toFixed(2)}s.</span>`;
      if (window.labSound) window.labSound.playSuccess();
    } else {
      lvl.avgTimeVerified = false;
      if (fbEl) fbEl.innerHTML = `<span class="text-rose-600 dark:text-rose-400">Check your math: Add the 3 times together (${lvl.trials.join(' + ')}), then divide by 3.</span>`;
    }
    this.saveProgress();
    this.updateCalculatorNumbers();
  }

  verifySpeed(lvlIdx, val) {
    const studentVal = parseFloat(val);
    const lvl = this.levels[lvlIdx];
    const fbEl = document.getElementById(`feedback-spd-${lvlIdx}`);

    if (isNaN(studentVal) || studentVal <= 0) {
      if (fbEl) fbEl.innerHTML = '';
      return;
    }

    lvl.studentSpeed = studentVal;
    const correct = lvl.correctSpeed;
    const tolerance = Math.max(0.6, correct * 0.05);

    if (Math.abs(studentVal - correct) <= tolerance) {
      lvl.speedVerified = true;
      if (fbEl) fbEl.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400">✓ Excellent! Speed is ${correct.toFixed(1)} cm/s.</span>`;
      if (window.labSound) window.labSound.playSuccess();
    } else {
      lvl.speedVerified = false;
      if (fbEl) fbEl.innerHTML = `<span class="text-rose-600 dark:text-rose-400">Check your division: ${this.distanceCm.toFixed(1)} cm divided by your average time.</span>`;
    }
    this.saveProgress();
  }

  // --- STEP 4: POSITION VS TIME GRAPH ---
  renderStep4PositionGraph() {
    const legendContainer = document.getElementById('step4-level-toggles');

    const seriesList = this.levels.map(lvl => {
      const tAvg = lvl.studentAvgTime || lvl.correctAvgTime || 2.5;
      const targetPts = [
        { t: 0, y: 0 },
        { t: tAvg, y: this.distanceCm }
      ];

      return {
        id: lvl.id,
        name: lvl.label,
        color: lvl.color,
        darkColor: lvl.darkColor,
        targetPoints: targetPts,
        studentPoints: lvl.posPoints || []
      };
    });

    if (!this.posGraph) {
      this.posGraph = new InteractiveGraphCanvas('canvas-position-graph', {
        type: 'position',
        title: 'Position vs. Time (Across Table)',
        xLabel: 'Time across table (seconds)',
        yLabel: 'Position (cm)',
        series: seriesList,
        activeSeriesId: this.levels[this.activeLevelIdx].id,
        onPointsUpdated: (updatedSeries) => {
          updatedSeries.forEach(s => {
            const foundLvl = this.levels.find(l => l.id === s.id);
            if (foundLvl) {
              foundLvl.posPoints = s.studentPoints;
            }
          });
          this.saveProgress();
          this.updateStep4Guidance();
        }
      });
    } else {
      this.posGraph.setSeries(seriesList, this.levels[this.activeLevelIdx].id);
    }

    if (legendContainer) {
      legendContainer.innerHTML = this.levels.map((lvl, idx) => {
        const isActive = idx === this.activeLevelIdx;
        const ptsCount = (lvl.posPoints || []).length;
        const isPlotted = ptsCount >= 2;
        const activeClass = isActive
          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md ring-2 ring-sky-400'
          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10';

        return `
          <button onclick="window.labEngine.setStep4ActiveLevel(${idx})" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeClass}">
            <span class="w-3 h-3 rounded-full" style="background-color: ${lvl.color}"></span>
            <span>${lvl.label}</span>
            <span class="text-[10px] ${isPlotted ? 'text-emerald-500 font-bold' : 'text-slate-400'}">
              ${isPlotted ? '✓ Plotted' : `(${ptsCount}/2 pts)`}
            </span>
          </button>
        `;
      }).join('');
    }

    this.updateStep4Guidance();
  }

  setStep4ActiveLevel(idx) {
    this.activeLevelIdx = idx;
    if (this.posGraph) {
      this.posGraph.setActiveSeries(this.levels[idx].id);
    }
    if (window.labSound) window.labSound.playClick();
    this.renderStep4PositionGraph();
  }

  updateStep4Guidance() {
    const guidanceEl = document.getElementById('step4-guidance');
    if (!guidanceEl) return;

    const activeLvl = this.levels[this.activeLevelIdx];
    const tAvg = activeLvl.studentAvgTime || activeLvl.correctAvgTime || 2.5;
    const pts = activeLvl.posPoints || [];

    if (pts.length === 0) {
      guidanceEl.innerHTML = `
        <div class="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/30 text-xs text-sky-900 dark:text-sky-200 flex items-center justify-between">
          <div>
            <strong>Step A:</strong> Click on the graph at <strong>(0.0s, 0cm)</strong> where the marble first enters the flat table.
          </div>
          <button onclick="window.labEngine.autoPlotPoint('pos', 0, 0)" class="text-[11px] px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-500 transition-all">
            Plot (0, 0)
          </button>
        </div>
      `;
    } else if (pts.length === 1) {
      guidanceEl.innerHTML = `
        <div class="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
          <div>
            <strong>Step B:</strong> Click at your average time <strong>(${tAvg.toFixed(2)}s, ${this.distanceCm.toFixed(0)}cm)</strong> where the marble reached the finish mark!
          </div>
          <button onclick="window.labEngine.autoPlotPoint('pos', ${tAvg}, ${this.distanceCm})" class="text-[11px] px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 transition-all">
            Plot Finish Point
          </button>
        </div>
      `;
    } else {
      const slope = ((pts[1].y - pts[0].y) / (pts[1].t - pts[0].t)).toFixed(1);
      guidanceEl.innerHTML = `
        <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
          <div>
            <strong>✓ ${activeLvl.label} Complete!</strong> Calculated Slope = <strong>${slope} cm/s</strong> (Rise: ${this.distanceCm}cm / Run: ${tAvg}s). Notice how the slope directly equals your speed!
          </div>
          <button onclick="window.labEngine.clearSeries('pos')" class="text-[11px] text-slate-500 hover:text-rose-500 font-semibold transition-colors">
            Redo Points
          </button>
        </div>
      `;
    }
  }

  // --- STEP 5: VELOCITY VS TIME GRAPH ---
  renderStep5VelocityGraph() {
    const legendContainer = document.getElementById('step5-level-toggles');

    const seriesList = this.levels.map(lvl => {
      const tAvg = lvl.studentAvgTime || lvl.correctAvgTime || 2.5;
      const speed = lvl.studentSpeed || lvl.correctSpeed || 25.0;
      const targetPts = [
        { t: 0, y: speed },
        { t: tAvg, y: speed }
      ];

      return {
        id: lvl.id,
        name: lvl.label,
        color: lvl.color,
        darkColor: lvl.darkColor,
        targetPoints: targetPts,
        studentPoints: lvl.velPoints || []
      };
    });

    if (!this.velGraph) {
      this.velGraph = new InteractiveGraphCanvas('canvas-velocity-graph', {
        type: 'velocity',
        title: 'Velocity vs. Time (Constant Speed Across Table)',
        xLabel: 'Time across table (seconds)',
        yLabel: 'Velocity (cm/s)',
        series: seriesList,
        activeSeriesId: this.levels[this.activeLevelIdx].id,
        onPointsUpdated: (updatedSeries) => {
          updatedSeries.forEach(s => {
            const foundLvl = this.levels.find(l => l.id === s.id);
            if (foundLvl) {
              foundLvl.velPoints = s.studentPoints;
            }
          });
          this.saveProgress();
          this.updateStep5Guidance();
        }
      });
    } else {
      this.velGraph.setSeries(seriesList, this.levels[this.activeLevelIdx].id);
    }

    if (legendContainer) {
      legendContainer.innerHTML = this.levels.map((lvl, idx) => {
        const isActive = idx === this.activeLevelIdx;
        const ptsCount = (lvl.velPoints || []).length;
        const isPlotted = ptsCount >= 2;
        const activeClass = isActive
          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md ring-2 ring-sky-400'
          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10';

        return `
          <button onclick="window.labEngine.setStep5ActiveLevel(${idx})" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeClass}">
            <span class="w-3 h-3 rounded-full" style="background-color: ${lvl.color}"></span>
            <span>${lvl.label}</span>
            <span class="text-[10px] ${isPlotted ? 'text-emerald-500 font-bold' : 'text-slate-400'}">
              ${isPlotted ? '✓ Plotted' : `(${ptsCount}/2 pts)`}
            </span>
          </button>
        `;
      }).join('');
    }

    this.updateStep5Guidance();
  }

  setStep5ActiveLevel(idx) {
    this.activeLevelIdx = idx;
    if (this.velGraph) {
      this.velGraph.setActiveSeries(this.levels[idx].id);
    }
    if (window.labSound) window.labSound.playClick();
    this.renderStep5VelocityGraph();
  }

  updateStep5Guidance() {
    const guidanceEl = document.getElementById('step5-guidance');
    if (!guidanceEl) return;

    const activeLvl = this.levels[this.activeLevelIdx];
    const tAvg = activeLvl.studentAvgTime || activeLvl.correctAvgTime || 2.5;
    const speed = activeLvl.studentSpeed || activeLvl.correctSpeed || 25.0;
    const pts = activeLvl.velPoints || [];

    if (pts.length === 0) {
      guidanceEl.innerHTML = `
        <div class="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/30 text-xs text-sky-900 dark:text-sky-200 flex items-center justify-between">
          <div>
            <strong>Step A:</strong> Since velocity is constant across the table, click at <strong>(0.0s, ${speed.toFixed(1)} cm/s)</strong> to start the velocity line.
          </div>
          <button onclick="window.labEngine.autoPlotPoint('vel', 0, ${speed})" class="text-[11px] px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-500 transition-all">
            Plot (0, ${speed.toFixed(0)})
          </button>
        </div>
      `;
    } else if (pts.length === 1) {
      guidanceEl.innerHTML = `
        <div class="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
          <div>
            <strong>Step B:</strong> Click at the finish time <strong>(${tAvg.toFixed(2)}s, ${speed.toFixed(1)} cm/s)</strong>. Notice how a constant speed forms a flat horizontal line!
          </div>
          <button onclick="window.labEngine.autoPlotPoint('vel', ${tAvg}, ${speed})" class="text-[11px] px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 transition-all">
            Plot Finish Point
          </button>
        </div>
      `;
    } else {
      const area = ((pts[1].t - pts[0].t) * pts[0].y).toFixed(1);
      guidanceEl.innerHTML = `
        <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
          <div>
            <strong>✓ ${activeLvl.label} Complete!</strong> Flat line confirmed at ${speed.toFixed(1)} cm/s. Bounded Area = <strong>${area} cm</strong> (which matches the ${this.distanceCm} cm distance across the table!).
          </div>
          <button onclick="window.labEngine.clearSeries('vel')" class="text-[11px] text-slate-500 hover:text-rose-500 font-semibold transition-colors">
            Redo Points
          </button>
        </div>
      `;
    }
  }

  autoPlotPoint(graphType, t, y) {
    const activeLvl = this.levels[this.activeLevelIdx];
    const targetArr = graphType === 'pos' ? (activeLvl.posPoints || (activeLvl.posPoints = [])) : (activeLvl.velPoints || (activeLvl.velPoints = []));

    targetArr.push({
      t: parseFloat(t.toFixed(2)),
      y: parseFloat(y.toFixed(1))
    });
    targetArr.sort((a, b) => a.t - b.t);

    if (window.labSound) window.labSound.playPointPlot();
    this.saveProgress();

    if (graphType === 'pos') {
      this.renderStep4PositionGraph();
    } else {
      this.renderStep5VelocityGraph();
    }
  }

  clearSeries(graphType) {
    const activeLvl = this.levels[this.activeLevelIdx];
    if (graphType === 'pos') {
      activeLvl.posPoints = [];
      if (this.posGraph) this.posGraph.clearSeriesPoints(activeLvl.id);
      this.renderStep4PositionGraph();
    } else {
      activeLvl.velPoints = [];
      if (this.velGraph) this.velGraph.clearSeriesPoints(activeLvl.id);
      this.renderStep5VelocityGraph();
    }
    this.saveProgress();
  }

  // --- STEP 6: CER SCIENTIFIC STUDIO ---
  renderStep6CER() {
    const claimInput = document.getElementById('cer-claim-input');
    const evidInput = document.getElementById('cer-evidence-input');
    const reasInput = document.getElementById('cer-reasoning-input');

    if (claimInput) {
      claimInput.value = this.cer.claim || '';
      claimInput.oninput = (e) => { this.cer.claim = e.target.value; this.saveProgress(); };
    }
    if (evidInput) {
      evidInput.value = this.cer.evidence || '';
      evidInput.oninput = (e) => { this.cer.evidence = e.target.value; this.saveProgress(); };
    }
    if (reasInput) {
      reasInput.value = this.cer.reasoning || '';
      reasInput.oninput = (e) => { this.cer.reasoning = e.target.value; this.saveProgress(); };
    }
  }

  insertDataSnippet() {
    const evidInput = document.getElementById('cer-evidence-input');
    if (!evidInput) return;

    const dataLines = this.levels.map(lvl => {
      const h = lvl.stackHeightCm !== null ? `${lvl.stackHeightCm} cm` : 'unmeasured';
      const t = lvl.studentAvgTime || lvl.correctAvgTime || '--';
      const v = lvl.studentSpeed || lvl.correctSpeed || '--';
      return `${lvl.label} (Height ${h}): avg time = ${t} s, speed = ${v} cm/s`;
    }).join('; ');

    const snippet = `During our lab investigation across the ${this.distanceCm.toFixed(1)} cm table track: ${dataLines}.`;
    evidInput.value = snippet;
    this.cer.evidence = snippet;
    this.saveProgress();
    if (window.labSound) window.labSound.playSuccess();
  }

  // --- VALIDATION & TRANSITIONS (RIGOROUS SCIENTIFIC ACCOUNTABILITY) ---
  validateCurrentStep(showAlert = true) {
    if (window.labAuth && !window.labAuth.currentUser) {
      const gate = document.getElementById('loginGateModal');
      if (gate) gate.classList.remove('hidden');
      if (showAlert) alert("Please sign in with your school Google account (@orangeusd.org) to continue.");
      return false;
    }

    if (this.currentStep === 1) {
      if (!this.distanceCm || this.distanceCm < 30) {
        if (showAlert) alert("Please enter a valid marked distance across the table (50 to 100 cm).");
        return false;
      }
      return true;
    }

    if (this.currentStep === 2) {
      // 1. Every level MUST have measured stack height
      for (const lvl of this.levels) {
        if (!lvl.stackHeightCm || lvl.stackHeightCm <= 0) {
          if (showAlert) {
            alert(`📏 Missing Stack Height: Please measure and enter the actual height of the book stack in centimeters for ${lvl.label}.`);
            if (window.labSound) window.labSound.playOutlierAlert();
          }
          return false;
        }
      }

      // 2. Stack heights must follow realistic progression: Low < Med < High
      const hLow = this.levels[0].stackHeightCm;
      const hMed = this.levels[1].stackHeightCm;
      const hHigh = this.levels[2].stackHeightCm;
      if (hMed <= hLow || hHigh <= hMed) {
        if (showAlert) {
          alert(`📏 Stack Height Logic Error: Medium Ramp stack height (${hMed} cm) must be taller than Low (${hLow} cm), and High (${hHigh} cm) must be taller than Medium. Please re-measure!`);
          if (window.labSound) window.labSound.playOutlierAlert();
        }
        return false;
      }

      // 3. Every level MUST have all 3 replications recorded via stopwatch
      for (const lvl of this.levels) {
        const count = lvl.trials.filter(t => t !== null && t > 0).length;
        if (count < 3) {
          if (showAlert) {
            alert(`⏱️ Incomplete Trials: Please complete all 3 timing replications for ${lvl.label} using the stopwatch.`);
            if (window.labSound) window.labSound.playOutlierAlert();
          }
          return false;
        }
      }

      // 4. Data Consistency & Outlier Accountability
      for (const lvl of this.levels) {
        this.detectOutliers(lvl);
        if (lvl.outlierIndex !== -1) {
          if (showAlert) {
            alert(`⚠️ Inconsistent Data in ${lvl.label}: Trial ${lvl.outlierIndex + 1} (${lvl.trials[lvl.outlierIndex]}s) is an outlier! High-precision scientific inquiry requires consistent data. Please repeat this trial with the stopwatch before advancing.`);
            if (window.labSound) window.labSound.playOutlierAlert();
          }
          return false;
        }

        const validTrials = lvl.trials.filter(t => t !== null && t > 0);
        const minT = Math.min(...validTrials);
        const maxT = Math.max(...validTrials);
        if (maxT - minT > 0.55) {
          if (showAlert) {
            alert(`⚠️ High Timing Spread in ${lvl.label}: Your recorded times differ by ${(maxT - minT).toFixed(2)}s. In a controlled experiment, replications should be consistent within ~0.4s. Please re-roll the inconsistent trial.`);
            if (window.labSound) window.labSound.playOutlierAlert();
          }
          return false;
        }
      }

      // 5. Physics Consistency Check (Steeper ramp must roll faster across table!)
      this.computeCorrectAveragesAndSpeeds();
      const avgLow = this.levels[0].correctAvgTime;
      const avgMed = this.levels[1].correctAvgTime;
      const avgHigh = this.levels[2].correctAvgTime;

      if (avgHigh >= avgLow) {
        if (showAlert) {
          alert(`⚠️ Physical Inconsistency: Your High Ramp average time (${avgHigh}s) is not faster than your Low Ramp (${avgLow}s)! A higher ramp produces greater acceleration down the incline, delivering the marble to the table with higher speed. Please check your setup and re-time the trials.`);
          if (window.labSound) window.labSound.playOutlierAlert();
        }
        return false;
      }

      return true;
    }

    if (this.currentStep === 3) {
      const allAveragesCalculated = this.levels.every(lvl => lvl.studentAvgTime && lvl.studentAvgTime > 0);
      const allSpeedsCalculated = this.levels.every(lvl => lvl.studentSpeed && lvl.studentSpeed > 0);
      if (!allAveragesCalculated || !allSpeedsCalculated) {
        if (showAlert) alert("Please enter and verify your calculated average time and speed for all 3 ramp levels.");
        return false;
      }
      return true;
    }

    if (this.currentStep === 4) {
      const allPlotted = this.levels.every(lvl => (lvl.posPoints || []).length >= 2);
      if (!allPlotted) {
        if (showAlert) alert("Please plot both start (0,0) and finish points for all 3 ramp levels on the Position vs. Time graph.");
        return false;
      }
      return true;
    }

    if (this.currentStep === 5) {
      const allPlotted = this.levels.every(lvl => (lvl.velPoints || []).length >= 2);
      if (!allPlotted) {
        if (showAlert) alert("Please plot both start and finish velocity points for all 3 ramp levels on the Velocity vs. Time graph.");
        return false;
      }
      return true;
    }

    if (this.currentStep === 6) {
      if (!this.cer.claim || this.cer.claim.trim().length < 15) {
        if (showAlert) alert("Please complete your scientific claim stating how ramp height affected the marble's speed.");
        return false;
      }
      if (!this.cer.evidence || this.cer.evidence.trim().length < 20) {
        if (showAlert) alert("Please provide data evidence (cite exact times and speeds from your lab data).");
        return false;
      }
      if (!this.cer.reasoning || this.cer.reasoning.trim().length < 25) {
        if (showAlert) alert("Please explain the physics reasoning connecting ramp height, graph slopes, and multi-trial averaging.");
        return false;
      }

      this.submitFinalLab();
      return true;
    }

    return true;
  }

  submitFinalLab() {
    if (window.labSound) window.labSound.playFanfare();

    const payload = {
      score: 100,
      distanceCm: this.distanceCm,
      rampLengthCm: this.rampLengthCm,
      levels: this.levels,
      cer: this.cer
    };

    if (window.labAuth && window.labAuth.saveLabProgress) {
      window.labAuth.saveLabProgress(payload, true);
    }

    const modal = document.getElementById('modal-completion');
    if (modal) modal.classList.remove('hidden');
  }

  updateCalculatorNumbers() {
    const numbersEl = document.getElementById('calc-numbers-display');
    if (!numbersEl) return;

    numbersEl.innerHTML = this.levels.map(lvl => {
      const valid = lvl.trials.filter(t => t !== null && t > 0);
      const timesStr = valid.length ? valid.join('s, ') + 's' : 'No times yet';
      const avgStr = lvl.studentAvgTime ? `${lvl.studentAvgTime}s` : '--';
      const speedStr = lvl.studentSpeed ? `${lvl.studentSpeed} cm/s` : '--';
      const hStr = lvl.stackHeightCm !== null ? `${lvl.stackHeightCm} cm` : 'unmeasured';

      return `
        <div class="border-b border-slate-200 dark:border-white/10 pb-1.5 last:border-0">
          <div class="flex items-center justify-between font-bold">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" style="background-color: ${lvl.color}"></span>
              <span>${lvl.label}:</span>
            </div>
            <span class="text-[10px] text-slate-500 font-mono">H = ${hStr}</span>
          </div>
          <div class="text-[11px] text-slate-600 dark:text-slate-400 pl-3.5">
            Times: [${timesStr}]
          </div>
          <div class="text-[10px] text-slate-500 pl-3.5">
            Avg: <strong class="text-purple-600 dark:text-purple-300">${avgStr}</strong> &bull; 
            Speed: <strong class="text-sky-600 dark:text-sky-300">${speedStr}</strong>
          </div>
        </div>
      `;
    }).join('');
  }

  exportPosGraphPng() {
    if (this.posGraph) this.posGraph.exportPng("marble_ramp_position_graph.png");
  }

  exportVelGraphPng() {
    if (this.velGraph) this.velGraph.exportPng("marble_ramp_velocity_graph.png");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.labEngine = new MarbleRampLabEngine();
});

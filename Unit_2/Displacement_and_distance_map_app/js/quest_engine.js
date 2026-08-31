/**
 * QuestEngine - Interactive Student Challenges, Calculations & Analysis
 * Mirrors the 3-day classroom inquiry project (Fantasy_Map_Quest_Project.md).
 */
class QuestEngine {
  constructor(mapInstance, travelerInstance, measurementTool) {
    this.map = mapInstance;
    this.traveler = travelerInstance;
    this.tool = measurementTool;

    this.currentStep = 1;
    this.totalSteps = 5;
    this.stepScores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    this.initUI();
    this.renderStep(1);
  }

  initUI() {
    const btnNext = document.getElementById('btn-quest-next');
    const btnPrev = document.getElementById('btn-quest-prev');
    const btnCheck = document.getElementById('btn-quest-check');
    const btnPrint = document.getElementById('btn-print-certificate');

    if (btnNext) btnNext.onclick = () => this.nextStep();
    if (btnPrev) btnPrev.onclick = () => this.prevStep();
    if (btnCheck) btnCheck.onclick = () => this.checkCurrentStep();
    if (btnPrint) btnPrint.onclick = () => this.openCertificateModal();
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.renderStep(this.currentStep);
      if (window.soundFX) window.soundFX.playClick();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.renderStep(this.currentStep);
      if (window.soundFX) window.soundFX.playClick();
    }
  }

  renderStep(step) {
    const titleEl = document.getElementById('quest-step-title');
    const badgeEl = document.getElementById('quest-step-badge');
    const container = document.getElementById('quest-step-content');
    const feedbackEl = document.getElementById('quest-feedback');
    const btnCheck = document.getElementById('btn-quest-check');

    if (feedbackEl) feedbackEl.classList.add('hidden');
    if (btnCheck) btnCheck.disabled = false;

    if (badgeEl) badgeEl.innerText = `Step ${step} of ${this.totalSteps}`;

    switch (step) {
      case 1:
        titleEl.innerText = "Step 1: Choose Realm & Calibrate Reference Origin";
        container.innerHTML = `
          <div class="p-3 mb-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
            <span class="text-base">🗺️</span>
            <div>
              <strong class="text-emerald-300">How to Begin:</strong>
              <p class="mt-0.5 text-slate-200">
                1. Select your realm using the <strong>Choose Realm</strong> dropdown on the map toolbar. A unique quest path will generate immediately!<br>
                2. Look at the map canvas for the glowing green beacon labeled <strong>🚩 START HERE (0,0)</strong>.<br>
                3. Answer the calibration questions below to begin your quest.
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <label class="block text-xs font-bold text-amber-300 mb-1">
                1. What is the reference point (Origin 0,0) of this quest?
              </label>
              <select id="q1-origin" class="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white focus:border-amber-400">
                <option value="">-- Choose Origin --</option>
                <option value="A">🚩 Landmark A: Starting Village (0, 0)</option>
                <option value="B">Landmark B: Obstacle</option>
                <option value="D">Landmark D: Final Destination</option>
                <option value="center">Center of the paper</option>
              </select>
            </div>

            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <label class="block text-xs font-bold text-amber-300 mb-1">
                2. Enter the active Map Scale Factor (from the scale key in top-left corner):
              </label>
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-300">1.0 cm on paper = </span>
                <input id="q1-scale" type="number" step="0.1" placeholder="Scale..." 
                  class="w-28 bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white font-mono text-center focus:border-amber-400">
                <span class="text-xs text-amber-400 font-bold">${this.map.scaleUnit}</span>
              </div>
            </div>
          </div>
        `;
        break;

      case 2:
        titleEl.innerText = "Step 2: Measuring Winding Trail Legs (Distance)";
        const l1 = this.map.calculatePathLengthCm(0);
        const l2 = this.map.calculatePathLengthCm(1);
        const l3 = this.map.calculatePathLengthCm(2);
        container.innerHTML = `
          <p class="text-xs text-slate-300 mb-3">
            Real trails curve around mountains and swamps! Use the <strong>Virtual String Tool</strong> to measure each leg along its curves.
          </p>
          <div class="space-y-3">
            <div class="flex flex-wrap gap-2 mb-2">
              <button onclick="window.measurementTool.setMode('string_leg1')" 
                onmouseenter="window.fantasyMap.setHoveredLeg(0)" onmouseleave="window.fantasyMap.setHoveredLeg(-1)"
                class="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 cursor-pointer">
                📏 Measure Leg 1 (A→B)
              </button>
              <button onclick="window.measurementTool.setMode('string_leg2')" 
                onmouseenter="window.fantasyMap.setHoveredLeg(1)" onmouseleave="window.fantasyMap.setHoveredLeg(-1)"
                class="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 cursor-pointer">
                📏 Measure Leg 2 (B→C)
              </button>
              <button onclick="window.measurementTool.setMode('string_leg3')" 
                onmouseenter="window.fantasyMap.setHoveredLeg(2)" onmouseleave="window.fantasyMap.setHoveredLeg(-1)"
                class="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 cursor-pointer">
                📏 Measure Leg 3 (C→D)
              </button>
            </div>

            <div class="bg-black/40 p-3 rounded-xl border border-white/10 space-y-2">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-[10px] font-bold text-slate-300">Leg 1 Paper String (cm):</label>
                  <input id="q2-l1" type="number" step="0.1" placeholder="Measure cm..." class="w-full bg-slate-900 border border-white/20 rounded p-1.5 text-xs text-white font-mono text-center focus:border-amber-400">
                </div>
                <div>
                  <label class="text-[10px] font-bold text-slate-300">Leg 1 Real (${this.map.scaleUnit}):</label>
                  <input id="q2-l1-real" type="number" step="0.1" placeholder="Calculate..." class="w-full bg-slate-900 border border-white/20 rounded p-1.5 text-xs text-white font-mono text-center focus:border-amber-400">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-[10px] font-bold text-slate-300">Leg 2 Paper String (cm):</label>
                  <input id="q2-l2" type="number" step="0.1" placeholder="Measure cm..." class="w-full bg-slate-900 border border-white/20 rounded p-1.5 text-xs text-white font-mono text-center focus:border-amber-400">
                </div>
                <div>
                  <label class="text-[10px] font-bold text-slate-300">Leg 2 Real (${this.map.scaleUnit}):</label>
                  <input id="q2-l2-real" type="number" step="0.1" placeholder="Calculate..." class="w-full bg-slate-900 border border-white/20 rounded p-1.5 text-xs text-white font-mono text-center focus:border-amber-400">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-[10px] font-bold text-slate-300">Leg 3 Paper String (cm):</label>
                  <input id="q2-l3" type="number" step="0.1" placeholder="Measure cm..." class="w-full bg-slate-900 border border-white/20 rounded p-1.5 text-xs text-white font-mono text-center focus:border-amber-400">
                </div>
                <div>
                  <label class="text-[10px] font-bold text-slate-300">Leg 3 Real (${this.map.scaleUnit}):</label>
                  <input id="q2-l3-real" type="number" step="0.1" placeholder="Calculate..." class="w-full bg-slate-900 border border-white/20 rounded p-1.5 text-xs text-white font-mono text-center focus:border-amber-400">
                </div>
              </div>
            </div>
          </div>
        `;
        break;

      case 3:
        titleEl.innerText = "Step 3: Calculating Total Distance Traveled";
        const totalCm = this.map.calculatePathLengthCm(-1);
        const totalRealm = totalCm * this.map.scaleFactor;
        container.innerHTML = `
          <p class="text-xs text-slate-300 mb-3">
            Total distance is a <strong>scalar quantity</strong>. To find total distance, add the lengths of all three legs together: <code>Total Distance = Leg 1 + Leg 2 + Leg 3</code>.
          </p>
          <div class="space-y-3">
            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <label class="block text-xs font-bold text-amber-300 mb-1">
                Enter the Sum of Paper String Lengths (cm):
              </label>
              <input id="q3-total-cm" type="number" step="0.1" placeholder="Sum of Legs 1+2+3 (cm)..." class="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white font-mono text-center focus:border-amber-400">
            </div>

            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <label class="block text-xs font-bold text-amber-300 mb-1">
                Enter Total Real Distance in ${this.map.scaleUnit}:
              </label>
              <input id="q3-total-real" type="number" step="0.1" placeholder="Sum in ${this.map.scaleUnit}..." class="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white font-mono text-center focus:border-amber-400">
            </div>
          </div>
        `;
        break;

      case 4:
        titleEl.innerText = "Step 4: Measuring Net Displacement Vector (Δr)";
        const disp = this.map.calculateDisplacementVector('D');
        container.innerHTML = `
          <p class="text-xs text-slate-300 mb-3">
            Displacement is a <strong>vector quantity</strong> that depends ONLY on the initial position and final position: <code>Δr = r_final - r_initial</code>.
          </p>
          <div class="space-y-3">
            <div class="mb-2">
              <button onclick="window.measurementTool.setMode('displacement')" 
                onmouseenter="window.fantasyMap.setHoveredLeg('disp')" onmouseleave="window.fantasyMap.setHoveredLeg(-1)"
                class="w-full px-3 py-2 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/50 text-xs font-bold hover:bg-rose-600/40 flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                <span>🧭 Draw Net Displacement Vector Arrow (A → D)</span>
              </button>
            </div>

            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <label class="block text-xs font-bold text-rose-300 mb-1">
                Direct Straight-Line Measurement on Paper (cm):
              </label>
              <input id="q4-disp-cm" type="number" step="0.1" placeholder="Straight distance (cm)..." class="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white font-mono text-center focus:border-rose-400">
            </div>

            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <label class="block text-xs font-bold text-rose-300 mb-1">
                Net Displacement Magnitude in ${this.map.scaleUnit}:
              </label>
              <input id="q4-disp-real" type="number" step="0.1" placeholder="Displacement in ${this.map.scaleUnit}..." class="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white font-mono text-center focus:border-rose-400">
            </div>

            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <label class="block text-xs font-bold text-rose-300 mb-1">
                Which direction does the displacement vector point?
              </label>
              <select id="q4-disp-dir" class="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white">
                <option value="">-- Select Direction --</option>
                <option value="ne">Northeast (North of East)</option>
                <option value="nw">Northwest (North of West)</option>
                <option value="se">Southeast (South of East)</option>
                <option value="sw">Southwest (South of West)</option>
                <option value="south">Directly South</option>
              </select>
            </div>
          </div>
        `;
        break;

      case 5:
        titleEl.innerText = "Step 5: Analysis & The Homecoming Paradox";
        container.innerHTML = `
          <p class="text-xs text-slate-300 mb-3">
            Solve the core inquiry questions and investigate what happens when the traveler returns home!
          </p>
          <div class="space-y-3">
            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <label class="block text-xs font-bold text-amber-300 mb-1">
                1. Scalar vs. Vector: Why is total distance almost always greater than displacement magnitude?
              </label>
              <select id="q5-scalar-vector" class="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white">
                <option value="">-- Choose Scientific Explanation --</option>
                <option value="correct">Trails bend and curve around obstacles, accumulating path length, while displacement is the shortest straight line.</option>
                <option value="wrong1">Displacement is always measured in different units than distance.</option>
                <option value="wrong2">Speed changes the scale factor of the map.</option>
              </select>
            </div>

            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <label class="block text-xs font-bold text-blue-400 mb-1">
                2. The Homecoming Paradox: The adventurer walks back to Origin A along the same trail. What is their new NET DISPLACEMENT?
              </label>
              <div class="flex items-center gap-2">
                <input id="q5-home-disp" type="number" placeholder="0" class="w-24 bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white font-mono text-center">
                <span class="text-xs text-slate-300">${this.map.scaleUnit}</span>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">Hint: Recall Δx = x_final - x_initial.</p>
            </div>

            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <label class="block text-xs font-bold text-emerald-400 mb-1">
                3. Speed vs Velocity: If the round trip took 20 days, why was average velocity 0 while average speed was positive?
              </label>
              <select id="q5-speed-velocity" class="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white">
                <option value="">-- Choose Scientific Explanation --</option>
                <option value="correct">Average velocity depends on displacement (v_avg = Δr / t = 0), while speed depends on total distance (v = d / t > 0).</option>
                <option value="wrong1">The traveler walked backwards on the way home, reversing their speed.</option>
                <option value="wrong2">Velocity cannot be calculated on fantasy maps.</option>
              </select>
            </div>
          </div>
        `;
        break;
    }
  }

  // Validate the student's inputs for the current step
  checkCurrentStep() {
    const feedbackEl = document.getElementById('quest-feedback');
    if (!feedbackEl) return;

    let isCorrect = false;
    let message = "";
    let stepScore = 20; // 5 steps * 20 pts = 100 max

    switch (this.currentStep) {
      case 1: {
        const originVal = document.getElementById('q1-origin')?.value;
        const scaleVal = parseFloat(document.getElementById('q1-scale')?.value);
        if (originVal === 'A' && Math.abs(scaleVal - this.map.scaleFactor) < 0.2) {
          isCorrect = true;
          message = `✨ Excellent calibration! Landmark A (0,0) is the established reference origin, and 1.0 cm = ${this.map.scaleFactor.toFixed(1)} ${this.map.scaleUnit}.`;
        } else {
          message = `⚠️ Check the map origin coordinates and scale key legend in the lower corner.`;
        }
        break;
      }
      case 2: {
        const inputL1 = document.getElementById('q2-l1');
        const inputL1Real = document.getElementById('q2-l1-real');
        const inputL2 = document.getElementById('q2-l2');
        const inputL2Real = document.getElementById('q2-l2-real');
        const inputL3 = document.getElementById('q2-l3');
        const inputL3Real = document.getElementById('q2-l3-real');

        const l1 = parseFloat(inputL1?.value);
        const l1Real = parseFloat(inputL1Real?.value);
        const l2 = parseFloat(inputL2?.value);
        const l2Real = parseFloat(inputL2Real?.value);
        const l3 = parseFloat(inputL3?.value);
        const l3Real = parseFloat(inputL3Real?.value);

        const trueL1 = this.map.calculatePathLengthCm(0);
        const trueL2 = this.map.calculatePathLengthCm(1);
        const trueL3 = this.map.calculatePathLengthCm(2);
        const scale = this.map.scaleFactor;

        // Reset borders
        [inputL1, inputL1Real, inputL2, inputL2Real, inputL3, inputL3Real].forEach(el => {
          if (el) el.classList.remove('border-emerald-500', 'border-rose-500');
        });

        // Check if any field is empty
        if ([l1, l1Real, l2, l2Real, l3, l3Real].some(v => isNaN(v))) {
          message = `⚠️ Please measure all 3 legs and enter all 6 values (Paper cm and Real ${this.map.scaleUnit}).`;
          break;
        }

        // Rigorous measurement tolerance (±0.3 cm using the 2.5x magnifying loupe)
        const tolCm = 0.35;
        const tolReal = tolCm * scale + 1.0;

        const check1 = Math.abs(l1 - trueL1) <= tolCm;
        const check1Real = Math.abs(l1Real - (trueL1 * scale)) <= tolReal || Math.abs(l1Real - (l1 * scale)) <= 1.0;

        const check2 = Math.abs(l2 - trueL2) <= tolCm;
        const check2Real = Math.abs(l2Real - (trueL2 * scale)) <= tolReal || Math.abs(l2Real - (l2 * scale)) <= 1.0;

        const check3 = Math.abs(l3 - trueL3) <= tolCm;
        const check3Real = Math.abs(l3Real - (trueL3 * scale)) <= tolReal || Math.abs(l3Real - (l3 * scale)) <= 1.0;

        // Mark individual field status
        if (inputL1) inputL1.classList.add(check1 ? 'border-emerald-500' : 'border-rose-500');
        if (inputL1Real) inputL1Real.classList.add(check1Real ? 'border-emerald-500' : 'border-rose-500');
        if (inputL2) inputL2.classList.add(check2 ? 'border-emerald-500' : 'border-rose-500');
        if (inputL2Real) inputL2Real.classList.add(check2Real ? 'border-emerald-500' : 'border-rose-500');
        if (inputL3) inputL3.classList.add(check3 ? 'border-emerald-500' : 'border-rose-500');
        if (inputL3Real) inputL3Real.classList.add(check3Real ? 'border-emerald-500' : 'border-rose-500');

        if (check1 && check1Real && check2 && check2Real && check3 && check3Real) {
          isCorrect = true;
          message = `✨ Fantastic measurement precision! All 3 legs are accurately measured within ±0.3 cm and converted correctly using the scale factor.`;
        } else {
          const errors = [];
          if (!check1) errors.push("Leg 1 paper cm");
          if (!check1Real) errors.push("Leg 1 real distance");
          if (!check2) errors.push("Leg 2 paper cm");
          if (!check2Real) errors.push("Leg 2 real distance");
          if (!check3) errors.push("Leg 3 paper cm");
          if (!check3Real) errors.push("Leg 3 real distance");

          message = `⚠️ Please re-check the red-bordered field(s): <strong>${errors.join(', ')}</strong>. Use the <strong>🔍 2.5x Loupe</strong> to inspect the millimeter marks on the ruler!`;
        }
        break;
      }
      case 3: {
        const inputTotCm = document.getElementById('q3-total-cm');
        const inputTotReal = document.getElementById('q3-total-real');
        const totCm = parseFloat(inputTotCm?.value);
        const totReal = parseFloat(inputTotReal?.value);

        const trueTotCm = this.map.calculatePathLengthCm(-1);
        const scale = this.map.scaleFactor;
        const trueTotReal = trueTotCm * scale;

        // Reset borders
        if (inputTotCm) inputTotCm.classList.remove('border-emerald-500', 'border-rose-500');
        if (inputTotReal) inputTotReal.classList.remove('border-emerald-500', 'border-rose-500');

        if (isNaN(totCm) || isNaN(totReal)) {
          message = `⚠️ Please enter both total paper distance (cm) and total real distance (${this.map.scaleUnit}).`;
          break;
        }

        // Must equal the sum within ±0.6 cm
        const checkTotCm = Math.abs(totCm - trueTotCm) <= 0.6;
        const checkTotReal = Math.abs(totReal - trueTotReal) <= (0.6 * scale + 2.0) || Math.abs(totReal - (totCm * scale)) <= 2.0;

        if (inputTotCm) inputTotCm.classList.add(checkTotCm ? 'border-emerald-500' : 'border-rose-500');
        if (inputTotReal) inputTotReal.classList.add(checkTotReal ? 'border-emerald-500' : 'border-rose-500');

        if (checkTotCm && checkTotReal) {
          isCorrect = true;
          message = `✨ Spot on! Total path distance traveled is ${trueTotReal.toFixed(1)} ${this.map.scaleUnit} (Leg 1 + Leg 2 + Leg 3).`;
        } else {
          message = `⚠️ Total distance is the sum of all legs: <code>Leg 1 + Leg 2 + Leg 3</code>. Check your addition and scale multiplication!`;
        }
        break;
      }
      case 4: {
        const inputDispCm = document.getElementById('q4-disp-cm');
        const inputDispReal = document.getElementById('q4-disp-real');
        const inputDispDir = document.getElementById('q4-disp-dir');

        const dispCm = parseFloat(inputDispCm?.value);
        const dispReal = parseFloat(inputDispReal?.value);
        const dispDir = inputDispDir?.value;

        const trueDisp = this.map.calculateDisplacementVector('D');
        const scale = this.map.scaleFactor;

        // Reset borders
        if (inputDispCm) inputDispCm.classList.remove('border-emerald-500', 'border-rose-500');
        if (inputDispReal) inputDispReal.classList.remove('border-emerald-500', 'border-rose-500');
        if (inputDispDir) inputDispDir.classList.remove('border-emerald-500', 'border-rose-500');

        if (isNaN(dispCm) || isNaN(dispReal) || !dispDir) {
          message = `⚠️ Please fill in all 3 fields: paper displacement (cm), real displacement (${this.map.scaleUnit}), and compass direction.`;
          break;
        }

        // Determine correct direction code based on target Landmark D grid coordinates
        const landmarkD = this.map.activeRealm.landmarks[3];
        const isNorth = landmarkD.gridY < 0; // Negative gridY is North
        const isEast = landmarkD.gridX > 0;
        let expectedDir = 'ne';
        if (isNorth && isEast) expectedDir = 'ne';
        else if (isNorth && !isEast) expectedDir = 'nw';
        else if (!isNorth && isEast) expectedDir = 'se';
        else expectedDir = 'sw';

        const checkDispCm = Math.abs(dispCm - trueDisp.magnitudeCm) <= 0.4;
        const checkDispReal = Math.abs(dispReal - trueDisp.magnitudeRealm) <= (0.4 * scale + 2.0) || Math.abs(dispReal - (dispCm * scale)) <= 2.0;
        const checkDir = (dispDir === expectedDir);

        if (inputDispCm) inputDispCm.classList.add(checkDispCm ? 'border-emerald-500' : 'border-rose-500');
        if (inputDispReal) inputDispReal.classList.add(checkDispReal ? 'border-emerald-500' : 'border-rose-500');
        if (inputDispDir) inputDispDir.classList.add(checkDir ? 'border-emerald-500' : 'border-rose-500');

        if (checkDispCm && checkDispReal && checkDir) {
          isCorrect = true;
          message = `✨ Outstanding! Net displacement is the direct straight arrow from (0,0) to Destination D: ${trueDisp.magnitudeRealm.toFixed(1)} ${this.map.scaleUnit} pointing ${expectedDir.toUpperCase()}.`;
        } else {
          message = `⚠️ Please re-check the red-bordered field(s). Click 'Draw Net Displacement Vector' to inspect the straight arrow and its compass direction.`;
        }
        break;
      }
      case 5: {
        const q1 = document.getElementById('q5-scalar-vector')?.value;
        const homeDisp = parseFloat(document.getElementById('q5-home-disp')?.value);
        const q3 = document.getElementById('q5-speed-velocity')?.value;
        if (q1 === 'correct' && homeDisp === 0 && q3 === 'correct') {
          isCorrect = true;
          message = `🏆 Quest Mastered! You solved the Homecoming Paradox: returning home makes displacement exactly 0 while distance doubles!`;
        } else {
          message = `⚠️ Remember: Displacement = x_final - x_initial. When you return home, where did you end compared to where you started?`;
        }
        break;
      }
    }

    feedbackEl.classList.remove('hidden');
    if (isCorrect) {
      this.stepScores[this.currentStep] = stepScore;
      feedbackEl.className = "mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold";
      feedbackEl.innerHTML = message;
      if (window.soundFX) window.soundFX.playSuccess();
    } else {
      this.stepScores[this.currentStep] = Math.max(0, this.stepScores[this.currentStep] - 5);
      feedbackEl.className = "mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold";
      feedbackEl.innerHTML = message;
    }

    this.updateOverallScore();
  }

  updateOverallScore() {
    const total = Object.values(this.stepScores).reduce((a, b) => a + b, 0);
    const scoreBadge = document.getElementById('quest-current-score');
    if (scoreBadge) {
      scoreBadge.innerText = `${total}%`;
    }

    // If student achieved a score on step 5 or all steps completed, submit to Firestore
    if (this.currentStep === 5 && total >= 80) {
      if (window.authManager) {
        window.authManager.submitScore(total, {
          realm: this.map.currentRealmKey,
          distanceRealm: this.map.calculatePathLengthCm(-1) * this.map.scaleFactor,
          displacementRealm: this.map.calculateDisplacementVector('D').magnitudeRealm
        });
      }
    }
  }

  onTravelerReachedDestination() {
    const elNotice = document.getElementById('traveler-status-banner');
    if (elNotice) {
      elNotice.innerHTML = `
        <div class="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between">
          <span>🏆 The Adventurer reached the Destination! Relic secured!</span>
          <button onclick="window.traveler.triggerHomecoming()" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs">
            Return Home (Test Paradox) ↺
          </button>
        </div>
      `;
    }
  }

  onTravelerReturnedHome() {
    const elNotice = document.getElementById('traveler-status-banner');
    if (elNotice) {
      elNotice.innerHTML = `
        <div class="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs flex items-center justify-between">
          <span>🏠 Traveler Returned Home! Total Distance Doubled, Displacement = 0!</span>
          <button onclick="window.measurementTool.setMode('homecoming')" class="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs">
            Inspect Homecoming Vector 🔍
          </button>
        </div>
      `;
    }
  }

  openCertificateModal() {
    const modal = document.getElementById('certificate-modal');
    if (!modal) return;

    const certName = document.getElementById('cert-student-name');
    const certScore = document.getElementById('cert-score');
    const certDist = document.getElementById('cert-total-dist');
    const certDisp = document.getElementById('cert-net-disp');

    const total = Object.values(this.stepScores).reduce((a, b) => a + b, 0);
    const dist = this.map.calculatePathLengthCm(-1) * this.map.scaleFactor;
    const disp = this.map.calculateDisplacementVector('D').magnitudeRealm;

    if (certName) certName.innerText = window.authManager?.studentName || "Royal Cartographer";
    if (certScore) certScore.innerText = `${total}%`;
    if (certDist) certDist.innerText = `${dist.toFixed(1)} ${this.map.scaleUnit}`;
    if (certDisp) certDisp.innerText = `${disp.toFixed(1)} ${this.map.scaleUnit}`;

    modal.classList.remove('hidden');
    if (window.soundFX) window.soundFX.playParchment();
  }

  closeCertificateModal() {
    const modal = document.getElementById('certificate-modal');
    if (modal) modal.classList.add('hidden');
  }
}

window.QuestEngine = QuestEngine;

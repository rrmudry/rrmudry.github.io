/**
 * VectorQuestEngine - 5-Step Guided Inquiry for Coordinate-Based Vector Calculations
 * Assesses student mastery of Cartesian deltas, the Pythagorean Theorem, component addition,
 * and the Triangle Inequality in kinematics.
 */
class VectorQuestEngine {
  constructor(mapInstance, toolInstance) {
    this.map = mapInstance;
    this.tool = toolInstance;
    this.currentStep = 1;
    this.maxSteps = 5;
    this.stepScores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    this.initUI();
    this.renderStep(1);
  }

  initUI() {
    const prevBtn = document.getElementById('btn-quest-prev');
    const nextBtn = document.getElementById('btn-quest-next');
    const checkBtn = document.getElementById('btn-quest-check');
    const certBtn = document.getElementById('btn-print-certificate');

    if (prevBtn) prevBtn.onclick = () => this.changeStep(-1);
    if (nextBtn) nextBtn.onclick = () => this.changeStep(1);
    if (checkBtn) checkBtn.onclick = () => this.checkCurrentStep();
    if (certBtn) certBtn.onclick = () => this.openCertificateModal();
  }

  changeStep(delta) {
    const target = this.currentStep + delta;
    if (target >= 1 && target <= this.maxSteps) {
      this.currentStep = target;
      this.renderStep(this.currentStep);
      if (window.soundFX) window.soundFX.playParchment();
    }
  }

  renderStep(stepNum) {
    this.currentStep = stepNum;

    // Header updates
    const badge = document.getElementById('quest-step-badge');
    const title = document.getElementById('quest-step-title');
    const container = document.getElementById('quest-step-content');
    const feedback = document.getElementById('quest-feedback');

    if (badge) badge.innerText = `Step ${stepNum} of 5`;
    if (feedback) feedback.classList.add('hidden');

    // Auto-focus inspected leg on map to guide the student
    if (stepNum === 1 || stepNum === 2) {
      this.tool.setMode('leg1');
    } else if (stepNum === 3) {
      this.tool.setMode('leg2');
    } else if (stepNum === 4) {
      this.tool.setMode('net');
    } else if (stepNum === 5) {
      this.tool.setMode('all');
    }

    const lmA = this.map.landmarks[0];
    const lmB = this.map.landmarks[1];
    const lmC = this.map.landmarks[2];
    const lmD = this.map.landmarks[3];
    const unit = this.map.activeRealm.scaleUnit;
    const scale = this.map.activeRealm.scaleFactor;

    switch (stepNum) {
      case 1:
        if (title) title.innerText = "Step 1: Reading Coordinates & Component Deltas (Leg 1)";
        if (container) {
          container.innerHTML = `
            <div class="space-y-3 text-xs">
              <p class="text-slate-300 leading-relaxed">
                Before we can find the length of a vector, we must find its <strong>horizontal change (Δx)</strong> and <strong>vertical change (Δy)</strong> between the two endpoints on the grid.
              </p>

              <div class="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] font-mono">
                <div class="text-amber-300 font-bold">Endpoint Coordinates from Map:</div>
                <div class="mt-1 text-white">Landmark A (Origin): <strong>(${lmA.x.toFixed(1)}, ${lmA.y.toFixed(1)}) cm</strong></div>
                <div class="text-white">Landmark B: <strong>(${lmB.x.toFixed(1)}, ${lmB.y.toFixed(1)}) cm</strong></div>
              </div>

              <!-- Input: Δx -->
              <div class="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5">
                <label class="block font-bold text-amber-300">
                  1. Horizontal Change: &Delta;x = x_B - x_A
                </label>
                <div class="flex items-center gap-2">
                  <input id="q1-dx" type="number" step="0.1" placeholder="e.g. 5.5" class="w-28 bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white font-mono text-center">
                  <span class="text-xs text-slate-300">cm (East/West)</span>
                </div>
              </div>

              <!-- Input: Δy -->
              <div class="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5">
                <label class="block font-bold text-cyan-300">
                  2. Vertical Change: &Delta;y = y_B - y_A
                </label>
                <div class="flex items-center gap-2">
                  <input id="q1-dy" type="number" step="0.1" placeholder="e.g. 4.0" class="w-28 bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white font-mono text-center">
                  <span class="text-xs text-slate-300">cm (North/South)</span>
                </div>
              </div>

              <div class="p-2 rounded-lg bg-black/30 border border-white/10 text-[10px] text-slate-400">
                💡 <strong>Hint:</strong> Observe the dashed right triangle on the canvas! The base is &Delta;x and the vertical leg is &Delta;y.
              </div>
            </div>
          `;
        }
        break;

      case 2:
        if (title) title.innerText = "Step 2: Pythagorean Vector Magnitude & Scale Conversion (Leg 1)";
        if (container) {
          const l1 = this.map.getLegData('leg1');
          container.innerHTML = `
            <div class="space-y-3 text-xs">
              <p class="text-slate-300 leading-relaxed">
                Because &Delta;x and &Delta;y meet at a 90&deg; right angle, the displacement vector &Delta;r forms the <strong>hypotenuse</strong>. We calculate its length using the Pythagorean Theorem:
                <span class="font-mono text-emerald-300 font-bold block mt-1">|&Delta;r| = &radic;(&Delta;x&sup2; + &Delta;y&sup2;)</span>
              </p>

              <!-- Given components summary -->
              <div class="p-2 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono text-slate-300">
                &Delta;x = ${l1.dx.toFixed(1)} cm &bull; &Delta;y = ${l1.dy.toFixed(1)} cm &bull; Scale: 1 cm = ${scale.toFixed(1)} ${unit}
              </div>

              <!-- Input: Paper Δr1 (cm) -->
              <div class="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5">
                <label class="block font-bold text-emerald-300">
                  1. Paper Displacement Magnitude: |&Delta;r₁| = &radic;(&Delta;x&sup2; + &Delta;y&sup2;)
                </label>
                <div class="flex items-center gap-2">
                  <input id="q2-mag-cm" type="number" step="0.01" placeholder="e.g. 7.21" class="w-32 bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white font-mono text-center">
                  <span class="text-xs text-slate-300">cm on paper</span>
                </div>
                <p class="text-[10px] text-slate-400">Round to 2 decimal places.</p>
              </div>

              <!-- Input: Real realm displacement (leagues) -->
              <div class="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5">
                <label class="block font-bold text-yellow-300">
                  2. Real Realm Displacement: Real &Delta;r₁ = |&Delta;r₁| &times; Scale Factor
                </label>
                <div class="flex items-center gap-2">
                  <input id="q2-mag-real" type="number" step="0.1" placeholder="e.g. 72.1" class="w-32 bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white font-mono text-center">
                  <span class="text-xs text-slate-300">${unit}</span>
                </div>
              </div>
            </div>
          `;
        }
        break;

      case 3:
        if (title) title.innerText = "Step 3: Multi-Leg Displacements with Directional Signs (Leg 2 & 3)";
        if (container) {
          const l2 = this.map.getLegData('leg2');
          const l3 = this.map.getLegData('leg3');
          container.innerHTML = `
            <div class="space-y-3 text-xs">
              <p class="text-slate-300 leading-relaxed">
                Now calculate the displacements for the remaining two legs. Remember: moving West or South results in a <strong>negative (&minus;)</strong> component change!
              </p>

              <!-- Leg 2 Card -->
              <div class="bg-black/40 p-3 rounded-xl border border-amber-500/30 space-y-2">
                <div class="flex justify-between font-bold text-amber-300 text-[11px] pb-1 border-b border-white/10">
                  <span>Leg 2: B(${lmB.x.toFixed(1)}, ${lmB.y.toFixed(1)}) &rarr; C(${lmC.x.toFixed(1)}, ${lmC.y.toFixed(1)})</span>
                  <button onclick="window.vectorTool.setMode('leg2')" class="text-amber-400 underline hover:text-amber-200">Inspect 🔍</button>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-[10px] text-slate-300 block">&Delta;x₂ (cm):</label>
                    <input id="q3-dx2" type="number" step="0.1" class="w-full bg-slate-900 border border-white/20 rounded p-1.5 text-xs text-white font-mono text-center">
                  </div>
                  <div>
                    <label class="text-[10px] text-slate-300 block">&Delta;y₂ (cm):</label>
                    <input id="q3-dy2" type="number" step="0.1" class="w-full bg-slate-900 border border-white/20 rounded p-1.5 text-xs text-white font-mono text-center">
                  </div>
                </div>
                <div class="pt-1">
                  <label class="text-[10px] text-emerald-300 font-bold block">Magnitude |&Delta;r₂| = &radic;(&Delta;x&sup2; + &Delta;y&sup2;) [cm]:</label>
                  <input id="q3-mag2" type="number" step="0.01" placeholder="cm" class="w-32 bg-slate-900 border border-white/20 rounded p-1.5 text-xs text-white font-mono text-center">
                </div>
              </div>

              <!-- Leg 3 Card -->
              <div class="bg-black/40 p-3 rounded-xl border border-purple-500/30 space-y-2">
                <div class="flex justify-between font-bold text-purple-300 text-[11px] pb-1 border-b border-white/10">
                  <span>Leg 3: C(${lmC.x.toFixed(1)}, ${lmC.y.toFixed(1)}) &rarr; D(${lmD.x.toFixed(1)}, ${lmD.y.toFixed(1)})</span>
                  <button onclick="window.vectorTool.setMode('leg3')" class="text-purple-400 underline hover:text-purple-200">Inspect 🔍</button>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-[10px] text-slate-300 block">&Delta;x₃ (cm):</label>
                    <input id="q3-dx3" type="number" step="0.1" class="w-full bg-slate-900 border border-white/20 rounded p-1.5 text-xs text-white font-mono text-center">
                  </div>
                  <div>
                    <label class="text-[10px] text-slate-300 block">&Delta;y₃ (cm):</label>
                    <input id="q3-dy3" type="number" step="0.1" class="w-full bg-slate-900 border border-white/20 rounded p-1.5 text-xs text-white font-mono text-center">
                  </div>
                </div>
                <div class="pt-1">
                  <label class="text-[10px] text-emerald-300 font-bold block">Magnitude |&Delta;r₃| = &radic;(&Delta;x&sup2; + &Delta;y&sup2;) [cm]:</label>
                  <input id="q3-mag3" type="number" step="0.01" placeholder="cm" class="w-32 bg-slate-900 border border-white/20 rounded p-1.5 text-xs text-white font-mono text-center">
                </div>
              </div>
            </div>
          `;
        }
        break;

      case 4:
        if (title) title.innerText = "Step 4: Vector Component Addition (The Net Resultant)";
        if (container) {
          container.innerHTML = `
            <div class="space-y-3 text-xs">
              <p class="text-slate-300 leading-relaxed">
                To find the overall Net Displacement from <strong>Origin A to Destination D</strong>, you do NOT simply add the diagonal lengths. You must add the components independently:
                <span class="font-mono text-amber-300 font-bold block mt-0.5">&Delta;x_net = &Delta;x₁ + &Delta;x₂ + &Delta;x₃</span>
                <span class="font-mono text-cyan-300 font-bold block">&Delta;y_net = &Delta;y₁ + &Delta;y₂ + &Delta;y₃</span>
              </p>

              <!-- Net Component Sums -->
              <div class="grid grid-cols-2 gap-2 bg-black/40 p-3 rounded-xl border border-white/10">
                <div>
                  <label class="block font-bold text-amber-300 text-[11px] mb-1">Total &Delta;x_net (cm):</label>
                  <input id="q4-net-dx" type="number" step="0.1" class="w-full bg-slate-900 border border-white/20 rounded p-2 text-xs text-white font-mono text-center">
                </div>
                <div>
                  <label class="block font-bold text-cyan-300 text-[11px] mb-1">Total &Delta;y_net (cm):</label>
                  <input id="q4-net-dy" type="number" step="0.1" class="w-full bg-slate-900 border border-white/20 rounded p-2 text-xs text-white font-mono text-center">
                </div>
              </div>

              <!-- Net Resultant Magnitude -->
              <div class="bg-black/40 p-3 rounded-xl border border-rose-500/30 space-y-2">
                <label class="block font-bold text-rose-300 text-[11px]">
                  Net Resultant Magnitude: |&Delta;r_net| = &radic;(&Delta;x_net&sup2; + &Delta;y_net&sup2;)
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <span class="text-[10px] text-slate-300 block">Paper Resultant (cm):</span>
                    <input id="q4-net-cm" type="number" step="0.01" placeholder="cm" class="w-full bg-slate-900 border border-white/20 rounded p-2 text-xs text-white font-mono text-center">
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-300 block">Real Realm (${unit}):</span>
                    <input id="q4-net-real" type="number" step="0.1" placeholder="${unit}" class="w-full bg-slate-900 border border-white/20 rounded p-2 text-xs text-white font-mono text-center">
                  </div>
                </div>
              </div>
            </div>
          `;
        }
        break;

      case 5:
        if (title) title.innerText = "Step 5: Vector Sum vs. Scalar Sum (The Triangle Inequality)";
        if (container) {
          container.innerHTML = `
            <div class="space-y-3 text-xs">
              <p class="text-slate-300 leading-relaxed">
                Compare the <strong>total scalar distance traveled along the three straight legs</strong> versus the <strong>direct net displacement</strong> from Origin A to Destination D.
              </p>

              <!-- Scalar Sum Input -->
              <div class="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5">
                <label class="block font-bold text-amber-300">
                  1. Sum of Individual Leg Lengths: |&Delta;r₁| + |&Delta;r₂| + |&Delta;r₃|
                </label>
                <div class="flex items-center gap-2">
                  <input id="q5-sum-legs" type="number" step="0.01" class="w-32 bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white font-mono text-center">
                  <span class="text-xs text-slate-300">cm on paper</span>
                </div>
              </div>

              <!-- Concept Multiple Choice -->
              <div class="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5">
                <label class="block font-bold text-rose-300">
                  2. Triangle Inequality in Physics: Why is the direct net displacement |&Delta;r_net| smaller than the scalar sum of the individual legs?
                </label>
                <select id="q5-triangle-concept" class="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white">
                  <option value="">-- Choose Scientific Explanation --</option>
                  <option value="correct">A straight line is the shortest distance between two points; taking turns causes horizontal and vertical changes that don't all point in the same direction.</option>
                  <option value="wrong1">Displacement vectors cancel each other out due to friction.</option>
                  <option value="wrong2">The Pythagorean theorem only works on paper, not in real physics.</option>
                </select>
              </div>

              <!-- Final Synthesis Question -->
              <div class="bg-black/40 p-3 rounded-xl border border-emerald-500/30 space-y-1.5">
                <label class="block font-bold text-emerald-300">
                  3. Under what unique condition would |&Delta;r_net| equal the scalar sum |&Delta;r₁| + |&Delta;r₂| + |&Delta;r₃|?
                </label>
                <select id="q5-collinear-concept" class="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-white">
                  <option value="">-- Choose Scientific Condition --</option>
                  <option value="correct">Only if all legs point in the EXACT same straight-line direction (collinear vectors with zero turning).</option>
                  <option value="wrong1">Only if the traveler walks backwards on leg 2.</option>
                  <option value="wrong2">Only if the map grid is rotated 45 degrees.</option>
                </select>
              </div>
            </div>
          `;
        }
        break;
    }
  }

  checkCurrentStep() {
    const feedbackEl = document.getElementById('quest-feedback');
    if (!feedbackEl) return;

    let isCorrect = false;
    let message = "";
    const stepScore = 20;

    const l1 = this.map.getLegData('leg1');
    const l2 = this.map.getLegData('leg2');
    const l3 = this.map.getLegData('leg3');
    const net = this.map.getLegData('net');
    const scale = this.map.activeRealm.scaleFactor;
    const unit = this.map.activeRealm.scaleUnit;

    switch (this.currentStep) {
      case 1: {
        const dx = parseFloat(document.getElementById('q1-dx')?.value);
        const dy = parseFloat(document.getElementById('q1-dy')?.value);

        if (isNaN(dx) || isNaN(dy)) {
          message = "⚠️ Please enter both Δx and Δy values.";
          break;
        }

        const checkDx = Math.abs(dx - l1.dx) < 0.15;
        const checkDy = Math.abs(dy - l1.dy) < 0.15;

        if (checkDx && checkDy) {
          isCorrect = true;
          message = `✨ Correct component resolution! Δx = ${l1.dx.toFixed(1)} cm and Δy = ${l1.dy.toFixed(1)} cm.`;
        } else {
          message = `⚠️ Re-check your subtraction: Δx = x_B - x_A and Δy = y_B - y_A.`;
        }
        break;
      }

      case 2: {
        const magCm = parseFloat(document.getElementById('q2-mag-cm')?.value);
        const magReal = parseFloat(document.getElementById('q2-mag-real')?.value);

        if (isNaN(magCm) || isNaN(magReal)) {
          message = `⚠️ Please enter both paper displacement (cm) and realm displacement (${unit}).`;
          break;
        }

        const checkCm = Math.abs(magCm - l1.magnitudeCm) < 0.25;
        const checkReal = Math.abs(magReal - l1.magnitudeRealm) < (0.25 * scale + 1.5) || Math.abs(magReal - (magCm * scale)) < 1.5;

        if (checkCm && checkReal) {
          isCorrect = true;
          message = `✨ Fantastic Pythagorean calculation! |Δr₁| = ${l1.magnitudeCm.toFixed(2)} cm, which converts to ${l1.magnitudeRealm.toFixed(1)} ${unit}.`;
        } else {
          message = `⚠️ Re-calculate the square root: √((${l1.dx.toFixed(1)})² + (${l1.dy.toFixed(1)})²).`;
        }
        break;
      }

      case 3: {
        const dx2 = parseFloat(document.getElementById('q3-dx2')?.value);
        const dy2 = parseFloat(document.getElementById('q3-dy2')?.value);
        const mag2 = parseFloat(document.getElementById('q3-mag2')?.value);

        const dx3 = parseFloat(document.getElementById('q3-dx3')?.value);
        const dy3 = parseFloat(document.getElementById('q3-dy3')?.value);
        const mag3 = parseFloat(document.getElementById('q3-mag3')?.value);

        if ([dx2, dy2, mag2, dx3, dy3, mag3].some(isNaN)) {
          message = "⚠️ Please fill in all 6 fields for Leg 2 and Leg 3.";
          break;
        }

        const cDx2 = Math.abs(dx2 - l2.dx) < 0.2;
        const cDy2 = Math.abs(dy2 - l2.dy) < 0.2;
        const cMag2 = Math.abs(mag2 - l2.magnitudeCm) < 0.25;

        const cDx3 = Math.abs(dx3 - l3.dx) < 0.2;
        const cDy3 = Math.abs(dy3 - l3.dy) < 0.2;
        const cMag3 = Math.abs(mag3 - l3.magnitudeCm) < 0.25;

        if (cDx2 && cDy2 && cMag2 && cDx3 && cDy3 && cMag3) {
          isCorrect = true;
          message = `✨ Outstanding vector calculation! You accurately tracked directional signs (+ and -) across Legs 2 and 3.`;
        } else {
          message = "⚠️ Double-check your coordinate differences and signs: remember x_final - x_initial can be negative!";
        }
        break;
      }

      case 4: {
        const netDx = parseFloat(document.getElementById('q4-net-dx')?.value);
        const netDy = parseFloat(document.getElementById('q4-net-dy')?.value);
        const netCm = parseFloat(document.getElementById('q4-net-cm')?.value);
        const netReal = parseFloat(document.getElementById('q4-net-real')?.value);

        if ([netDx, netDy, netCm, netReal].some(isNaN)) {
          message = "⚠️ Please enter all net resultant values.";
          break;
        }

        const cNetDx = Math.abs(netDx - net.dx) < 0.25;
        const cNetDy = Math.abs(netDy - net.dy) < 0.25;
        const cNetCm = Math.abs(netCm - net.magnitudeCm) < 0.3;
        const cNetReal = Math.abs(netReal - net.magnitudeRealm) < (0.3 * scale + 2.0) || Math.abs(netReal - (netCm * scale)) < 2.0;

        if (cNetDx && cNetDy && cNetCm && cNetReal) {
          isCorrect = true;
          message = `✨ Superb vector component addition! Net resultant |Δr_net| = ${net.magnitudeCm.toFixed(2)} cm (${net.magnitudeRealm.toFixed(1)} ${unit}).`;
        } else {
          message = "⚠️ Add horizontal components (ΣΔx) and vertical components (ΣΔy), then apply √(Δx_net² + Δy_net²).";
        }
        break;
      }

      case 5: {
        const sumLegs = parseFloat(document.getElementById('q5-sum-legs')?.value);
        const qTriangle = document.getElementById('q5-triangle-concept')?.value;
        const qCollinear = document.getElementById('q5-collinear-concept')?.value;

        const trueSum = l1.magnitudeCm + l2.magnitudeCm + l3.magnitudeCm;

        if (isNaN(sumLegs) || !qTriangle || !qCollinear) {
          message = "⚠️ Please calculate the sum of legs and answer both conceptual questions.";
          break;
        }

        const cSum = Math.abs(sumLegs - trueSum) < 0.4;
        const cTri = (qTriangle === 'correct');
        const cCol = (qCollinear === 'correct');

        if (cSum && cTri && cCol) {
          isCorrect = true;
          message = `🏆 <strong>Vector Kinematics Mastered!</strong> You proved the Triangle Inequality: straight-line net displacement is always shorter than or equal to the sum of turns!<br>
          <div class="mt-3 flex flex-wrap gap-2">
            <button onclick="window.vectorQuestEngine.showCompletionAnnouncement()" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95">
              <span>🎉</span> <span>View Completion Announcement</span>
            </button>
            <button onclick="window.vectorQuestEngine.openCertificateModal()" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer">
              <span>📜</span> <span>Print Certificate</span>
            </button>
          </div>`;
        } else {
          message = "⚠️ Re-check your leg sum (|Δr₁| + |Δr₂| + |Δr₃|) and verify the geometric physics principles.";
        }
        break;
      }
    }

    feedbackEl.classList.remove('hidden');
    if (isCorrect) {
      this.stepScores[this.currentStep] = stepScore;
      feedbackEl.className = "mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold";
      feedbackEl.innerHTML = message;

      if (this.currentStep === 5) {
        if (window.soundFX && typeof window.soundFX.playFanfare === 'function') {
          window.soundFX.playFanfare();
        } else if (window.soundFX) {
          window.soundFX.playSuccess();
        }

        const btnViewAnnounce = document.getElementById('btn-view-completion-announcement');
        if (btnViewAnnounce) btnViewAnnounce.classList.remove('hidden');

        setTimeout(() => {
          this.showCompletionAnnouncement();
        }, 550);
      } else {
        if (window.soundFX) window.soundFX.playSuccess();
      }
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

    if (this.currentStep === 5 && total >= 60) {
      if (window.authManager) {
        const net = this.map.getLegData('net');
        window.authManager.submitScore(total, {
          realm: this.map.currentRealmKey,
          netDisplacementCm: net.magnitudeCm,
          netDisplacementRealm: net.magnitudeRealm,
          dx_net: net.dx,
          dy_net: net.dy
        });
      }
    }
  }

  showCompletionAnnouncement() {
    const modal = document.getElementById('quest-completion-modal');
    if (!modal) return;

    const total = Object.values(this.stepScores).reduce((a, b) => a + b, 0);
    const net = this.map.getLegData('net');
    const l1 = this.map.getLegData('leg1');
    const l2 = this.map.getLegData('leg2');
    const l3 = this.map.getLegData('leg3');
    const scalarSumRealm = (l1.magnitudeCm + l2.magnitudeCm + l3.magnitudeCm) * this.map.activeRealm.scaleFactor;

    const scoreEl = document.getElementById('announcement-score');
    const studentEl = document.getElementById('announcement-student');
    const distEl = document.getElementById('announcement-dist');
    const dispEl = document.getElementById('announcement-disp');
    const authMsgEl = document.getElementById('announcement-auth-msg');

    if (scoreEl) scoreEl.innerText = `${total}%`;
    if (distEl) distEl.innerText = `${scalarSumRealm.toFixed(1)} ${this.map.activeRealm.scaleUnit}`;
    if (dispEl) dispEl.innerText = `${net.magnitudeRealm.toFixed(1)} ${this.map.activeRealm.scaleUnit}`;

    const studentName = window.authManager?.studentName;
    const studentEmail = window.authManager?.currentUser?.email;

    if (studentName || studentEmail) {
      if (studentEl) studentEl.innerText = `${studentName || studentEmail}`;
      if (authMsgEl) {
        authMsgEl.innerHTML = `Signed in as <strong>${studentEmail || studentName}</strong>. Your score of <strong>${total}%</strong> has been saved to Firestore and is ready for Google Classroom grade sync!`;
      }
    } else {
      if (studentEl) studentEl.innerText = "Guest Cartographer (Not Signed In)";
      if (authMsgEl) {
        authMsgEl.innerHTML = `Your score of <strong>${total}%</strong> is saved in this browser. <strong>Tip:</strong> Sign in with your school Google account (<code>@orangeusd.org</code>) so your name and grade sync to Classroom!`;
      }
    }

    modal.classList.remove('hidden');

    const btnViewAnnounce = document.getElementById('btn-view-completion-announcement');
    if (btnViewAnnounce) btnViewAnnounce.classList.remove('hidden');

    if (typeof confetti === 'function') {
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => {
          confetti({ particleCount: 70, angle: 60, spread: 55, origin: { x: 0.1, y: 0.7 } });
          confetti({ particleCount: 70, angle: 120, spread: 55, origin: { x: 0.9, y: 0.7 } });
        }, 350);
      } catch (e) {
        console.log("Confetti trigger:", e);
      }
    }
  }

  closeCompletionModal() {
    const modal = document.getElementById('quest-completion-modal');
    if (modal) modal.classList.add('hidden');
    if (window.soundFX) window.soundFX.playClick();
  }

  openCertificateModalFromAnnouncement() {
    this.closeCompletionModal();
    this.openCertificateModal();
  }

  openCertificateModal() {
    const modal = document.getElementById('certificate-modal');
    if (!modal) return;

    const certName = document.getElementById('cert-student-name');
    const certScore = document.getElementById('cert-score');
    const certDist = document.getElementById('cert-total-dist');
    const certDisp = document.getElementById('cert-net-disp');

    const total = Object.values(this.stepScores).reduce((a, b) => a + b, 0);
    const net = this.map.getLegData('net');
    const l1 = this.map.getLegData('leg1');
    const l2 = this.map.getLegData('leg2');
    const l3 = this.map.getLegData('leg3');
    const scalarSumRealm = (l1.magnitudeCm + l2.magnitudeCm + l3.magnitudeCm) * this.map.activeRealm.scaleFactor;

    if (certName) certName.innerText = window.authManager?.studentName || "Royal Vector Cartographer";
    if (certScore) certScore.innerText = `${total}%`;
    if (certDist) certDist.innerText = `${scalarSumRealm.toFixed(1)} ${this.map.activeRealm.scaleUnit}`;
    if (certDisp) certDisp.innerText = `${net.magnitudeRealm.toFixed(1)} ${this.map.activeRealm.scaleUnit}`;

    modal.classList.remove('hidden');
    if (window.soundFX) window.soundFX.playParchment();
  }

  closeCertificateModal() {
    const modal = document.getElementById('certificate-modal');
    if (modal) modal.classList.add('hidden');
  }
}

window.VectorQuestEngine = VectorQuestEngine;

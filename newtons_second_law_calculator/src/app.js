    // -------------------------------------------------------------
    // AUDIO SYNTHESIZER (Web Audio API)
    // -------------------------------------------------------------
    class SynthManager {
      constructor() {
        this.ctx = null;
      }

      init() {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }

      playBeep() {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
      }

      playSuccess() {
        this.init();
        if (!this.ctx) return;
        
        const now = this.ctx.currentTime;
        const playNote = (freq, delay, dur) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + delay);
          gain.gain.setValueAtTime(0, now + delay);
          gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

          osc.start(now + delay);
          osc.stop(now + delay + dur);
        };

        playNote(261.63, 0, 0.4);      // C4
        playNote(329.63, 0.08, 0.4);   // E4
        playNote(392.00, 0.16, 0.4);   // G4
        playNote(523.25, 0.24, 0.6);   // C5
      }

      playError() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.35);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.start();
        osc.stop(now + 0.35);
      }

      playCombo() {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
      }
    }

    const sound = new SynthManager();

    // -------------------------------------------------------------
    // QUESTIONS DATABASE (curated in questions.js, injected by build-html.js)
    // -------------------------------------------------------------
    /*__QUESTIONS__*/

    // -------------------------------------------------------------
    // SPEECH SYNTHESIS ACCESSIBILITY
    // -------------------------------------------------------------
    class SpeechManager {
      constructor() {
        this.synth = window.speechSynthesis;
        this.speaking = false;
        this.utterance = null;
      }

      speak(text) {
        if (!this.synth) {
          console.warn("Speech synthesis not supported.");
          return;
        }
        
        this.cancel();
        
        // Expand abbreviations to make it sound natural and clear
        let cleanText = text;
        const expansions = {
          "m/s²": "meters per second squared",
          "m/s2": "meters per second squared",
          "m/s": "meters per second",
          "km/h/s": "kilometers per hour per second",
          "km/h": "kilometers per hour",
          "mph": "miles per hour",
          "kg": "kilograms",
          "N": "newtons",
          "s": "seconds",
          "h": "hours"
        };
        
        for (let key in expansions) {
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          cleanText = cleanText.replace(regex, expansions[key]);
        }

        this.utterance = new SpeechSynthesisUtterance(cleanText);
        this.utterance.onstart = () => {
          this.speaking = true;
          this.updateSpeakButton();
        };
        this.utterance.onend = () => {
          this.speaking = false;
          this.updateSpeakButton();
        };
        this.utterance.onerror = () => {
          this.speaking = false;
          this.updateSpeakButton();
        };

        this.synth.speak(this.utterance);
      }

      cancel() {
        if (this.synth && this.synth.speaking) {
          this.synth.cancel();
        }
        this.speaking = false;
        this.updateSpeakButton();
      }

      updateSpeakButton() {
        const btn = document.getElementById("btn-tts");
        if (!btn) return;
        if (this.speaking) {
          btn.innerHTML = `<i data-lucide="square" class="w-5 h-5 text-rose-500"></i>`;
          btn.classList.add("ring-2", "ring-rose-500/50");
          btn.title = "Stop reading aloud";
        } else {
          btn.innerHTML = `<i data-lucide="volume-2" class="w-5 h-5"></i>`;
          btn.classList.remove("ring-2", "ring-rose-500/50");
          btn.title = "Read aloud";
        }
        if (typeof lucide !== 'undefined' && lucide && lucide.createIcons) {
          lucide.createIcons();
        }
      }
    }

    const speech = new SpeechManager();

    // -------------------------------------------------------------
    // DESMOS INTEGRATION
    // -------------------------------------------------------------
    let desmosLoaded = false;
    let desmosCalculator = null;
    let isCurrentQuestionSolved = false;

    function initDesmos() {
      const container = document.getElementById('desmos-calculator-container');
      if (!container) return;

      if (window.Desmos && !desmosCalculator) {
        try {
          desmosCalculator = Desmos.ScientificCalculator(container, {
            fontSize: Desmos.FontSizes.SMALL,
            keypad: true,
            settingsMenu: false
          });
          window.desmosCalculator = desmosCalculator;
          desmosLoaded = true;

          desmosCalculator.observeEvent('change', () => {
            onDesmosChange();
          });

          // Also hook onEvaluationUpdate on model if present so async evaluations immediately update UI
          try {
            const model = desmosCalculator.controller && desmosCalculator.controller.model;
            if (model && typeof model.onEvaluationUpdate === 'function') {
              const origOnEval = model.onEvaluationUpdate.bind(model);
              model.onEvaluationUpdate = function(...args) {
                origOnEval(...args);
                onDesmosChange();
              };
            }
          } catch (e) {}

          onDesmosChange();
        } catch (err) {
          console.error("Desmos init error:", err);
        }
      } else if (!window.Desmos && !desmosLoaded) {
        setTimeout(() => {
          if (window.Desmos && !desmosCalculator) initDesmos();
        }, 400);
      }
    }

    function getDesmosExpressions() {
      if (!desmosCalculator) return [];
      try {
        const calcState = desmosCalculator.getState();
        return calcState?.expressions?.list || [];
      } catch (e) {
        return [];
      }
    }

    function evaluateLatex(latex) {
      if (!latex) return null;
      let s = latex
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
        .replace(/\\cdot|\\times/g, "*")
        .replace(/\\div/g, "/")
        .replace(/\\left\(/g, "(")
        .replace(/\\right\)/g, ")")
        .replace(/\\sqrt\{([^}]+)\}/g, "Math.sqrt($1)")
        .replace(/\^\{([^}]+)\}/g, "**($1)")
        .replace(/\^([0-9]+)/g, "**$1")
        .replace(/[^0-9+\-*\/().Mathsqrt]/g, "");
      try {
        const val = Function('"use strict"; return (' + s + ')')();
        return typeof val === "number" && !isNaN(val) && isFinite(val) ? val : null;
      } catch (e) {
        return null;
      }
    }

    // Comprehensive extraction of the latest calculated result from Desmos Scientific Calculator
    function getDesmosLatestCalculation() {
      if (!desmosCalculator) return null;

      // Tier 1: Desmos internal controller model (handles ans, fractions, trig, parenthesized operations)
      try {
        const model = desmosCalculator.controller && desmosCalculator.controller.model;
        if (model && typeof model.getExpressionOrder === 'function') {
          const order = model.getExpressionOrder();
          for (let i = order.length - 1; i >= 0; i--) {
            const id = order[i];
            let val = null;
            if (typeof model.getExpressionValue === 'function') {
              val = model.getExpressionValue(id);
            }
            if ((val === null || val === undefined || isNaN(val)) && model._evaluations && model._evaluations[id]) {
              val = model._evaluations[id].value;
            }
            if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
              const latex = typeof model.getExpressionLatex === 'function' ? model.getExpressionLatex(id) : '';
              return { id, latex, value: val };
            }
          }
        }
      } catch (e) {
        console.warn("Desmos model evaluation check:", e);
      }

      // Tier 2: DOM display elements (.dcg-basic-expression-value)
      try {
        const domValues = document.querySelectorAll('.dcg-basic-expression-value');
        for (let i = domValues.length - 1; i >= 0; i--) {
          const text = (domValues[i].innerText || '').trim();
          const m = text.match(/=\s*([+\-−]?\d+(?:\.\d+)?)/);
          if (m) {
            const val = parseFloat(m[1].replace('−', '-'));
            if (!isNaN(val) && isFinite(val)) {
              return { id: 'dom-' + i, latex: '', value: val };
            }
          }
        }
      } catch (e) {}

      // Tier 3: getState fallback with regex parser
      try {
        const list = getDesmosExpressions();
        for (let i = list.length - 1; i >= 0; i--) {
          const item = list[i];
          if (!item || !item.latex) continue;
          const val = evaluateLatex(item.latex);
          if (val !== null && !isNaN(val) && isFinite(val)) {
            return { latex: item.latex, value: val };
          }
        }
      } catch (e) {}

      return null;
    }

    function onDesmosChange() {
      const calc = getDesmosLatestCalculation();
      const statusBadge = document.getElementById('desmos-status-badge');
      const liveFeedback = document.getElementById('desmos-live-feedback');
      const pasteHeaderBtn = document.getElementById('btn-desmos-paste-header');
      const telemetryReqBadge = document.getElementById('telemetry-req-badge');
      const telemetryStatus = document.getElementById('calc-telemetry-status');

      if (calc && typeof calc.value === 'number' && !isNaN(calc.value)) {
        const rounded = Number(calc.value.toFixed(2));
        if (statusBadge) {
          statusBadge.textContent = "RESULT: " + rounded;
          statusBadge.className = "text-[8px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 uppercase tracking-wider font-mono";
        }
        if (liveFeedback) {
          liveFeedback.textContent = "Computed: " + rounded;
          liveFeedback.className = "text-[11px] text-emerald-400 font-mono font-bold truncate";
        }
        if (pasteHeaderBtn) pasteHeaderBtn.classList.remove('hidden');
        if (telemetryReqBadge) {
          telemetryReqBadge.textContent = "CALCULATION READY ✓";
          telemetryReqBadge.className = "text-[8px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider";
        }
        if (telemetryStatus) {
          telemetryStatus.innerHTML = `Desmos Result: <span class="text-emerald-400 font-bold">${rounded}</span> (click Paste Desmos to insert)`;
        }
      } else {
        if (statusBadge) {
          statusBadge.textContent = state && state.currentLevel >= 2 ? "WORK REQUIRED" : "STANDBY";
          statusBadge.className = state && state.currentLevel >= 2 ?
            "text-[8px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 uppercase tracking-wider font-mono" :
            "text-[8px] font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/30 uppercase tracking-wider font-mono";
        }
        if (liveFeedback) {
          liveFeedback.textContent = "Ready for calculation...";
          liveFeedback.className = "text-[11px] text-slate-400 font-mono truncate";
        }
        if (pasteHeaderBtn) pasteHeaderBtn.classList.add('hidden');
        if (telemetryReqBadge) {
          telemetryReqBadge.textContent = "DESMOS REQUIRED";
          telemetryReqBadge.className = "text-[8px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 uppercase tracking-wider";
        }
        if (telemetryStatus) {
          telemetryStatus.textContent = "Use the Desmos calculator on the right to compute your answer.";
        }
      }
      if (window.lucide) lucide.createIcons();
    }

    function pasteDesmosResult() {
      const calc = getDesmosLatestCalculation();
      const feedbackBox = document.getElementById('feedback-box');
      if (!calc || typeof calc.value !== 'number' || isNaN(calc.value)) {
        sound.playError();
        if (feedbackBox) {
          feedbackBox.innerText = "No calculated result found in Desmos yet. Enter your calculation in Desmos first!";
          feedbackBox.className = "glass rounded-xl p-3 text-center font-bold text-amber-400 text-xs min-h-[48px] flex items-center justify-center border border-amber-500/30 animate-shake";
        }
        toggleCalculatorModal(true);
        return;
      }

      sound.playBeep();
      const rounded = Number(calc.value.toFixed(2));

      // 1. Populate manual telemetry input
      const manualInput = document.getElementById('manual-user-answer');
      if (manualInput) {
        manualInput.value = rounded;
        manualInput.focus();
      }

      // 2. Populate equation inline slot input if present
      const inlineInput = document.getElementById('equation-inline-input');
      if (inlineInput) {
        inlineInput.value = rounded;
      }

      // 3. Telemetry feedback
      const telemetryStatus = document.getElementById('calc-telemetry-status');
      if (telemetryStatus) {
        telemetryStatus.innerHTML = `<span class="text-emerald-400 font-bold">Pasted ${rounded} from Desmos ✓</span>`;
      }

      if (feedbackBox) {
        feedbackBox.innerText = `Pasted ${rounded} into your answer box. Click Check Answer to verify!`;
        feedbackBox.className = "glass rounded-xl p-3 text-center font-bold text-sky-300 text-xs min-h-[48px] flex items-center justify-center border border-sky-500/20";
      }
    }

    function syncManualInput(val) {
      const inlineInput = document.getElementById('equation-inline-input');
      if (inlineInput && inlineInput.value !== val) {
        inlineInput.value = val;
      }
    }

    // Desmos is required at Levels 2 and 3: the number the student enters must appear in Desmos.
    // Signs are ignored here so a student who computed 32 and typed −32 is not blocked.
    function verifyDesmosWork(userValue) {
      if (!state || state.currentLevel < 2) return true;
      const target = Math.abs(userValue);
      const near = (val) => typeof val === 'number' && !isNaN(val) && answerMatches(Math.abs(val), target);

      const calc = getDesmosLatestCalculation();
      if (calc && near(calc.value)) return true;

      // Scan all expressions in Desmos model
      if (desmosCalculator && desmosCalculator.controller && desmosCalculator.controller.model) {
        try {
          const model = desmosCalculator.controller.model;
          if (typeof model.getExpressionOrder === 'function') {
            for (let id of model.getExpressionOrder()) {
              let val = typeof model.getExpressionValue === 'function' ? model.getExpressionValue(id) : null;
              if ((val === null || val === undefined || isNaN(val)) && model._evaluations && model._evaluations[id]) {
                val = model._evaluations[id].value;
              }
              if (near(val)) return true;
            }
          }
        } catch (e) {}
      }

      // Check DOM display values
      try {
        for (let el of document.querySelectorAll('.dcg-basic-expression-value')) {
          const m = (el.innerText || '').trim().match(/=\s*([+\-−]?\d+(?:\.\d+)?)/);
          if (m && near(parseFloat(m[1].replace('−', '-')))) return true;
        }
      } catch (e) {}

      return false;
    }

    // -------------------------------------------------------------
    // LIGHT / DARK THEME (choice saved on this device only)
    // -------------------------------------------------------------
    function updateThemeButton() {
      const btn = document.getElementById('btn-theme');
      if (!btn) return;
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const label = isLight ? 'Switch to dark mode' : 'Switch to light mode';
      btn.title = label;
      btn.setAttribute('aria-label', label);
      btn.innerHTML = `<i data-lucide="${isLight ? 'moon' : 'sun'}" class="w-4 h-4"></i>`;
      if (window.lucide) lucide.createIcons();
    }

    function toggleTheme() {
      const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('nsl_calc_theme', next); } catch (e) {}
      updateThemeButton();
    }

    // With no saved choice, follow the device setting if it changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        let saved = null;
        try { saved = localStorage.getItem('nsl_calc_theme'); } catch (err) {}
        if (saved) return;
        document.documentElement.setAttribute('data-theme', e.matches ? 'light' : 'dark');
        updateThemeButton();
      });
    }

    // -------------------------------------------------------------
    // VARIABLE LABELS & NUMBER FORMATTING
    // -------------------------------------------------------------
    const VARS = {
      F: { html: 'F<sub>net</sub>', name: 'net force', sub: 'net force', unit: 'N', badge: 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30', slot: 'bg-emerald-950/90 border-emerald-500 text-emerald-400' },
      m: { html: 'm', name: 'mass', sub: 'mass', unit: 'kg', badge: 'bg-sky-950/80 text-sky-400 border border-sky-500/30', slot: 'bg-sky-950/90 border-sky-500 text-sky-400' },
      a: { html: 'a', name: 'acceleration', article: 'an', sub: 'accel', unit: 'm/s²', badge: 'bg-amber-950/80 text-amber-400 border border-amber-500/30', slot: 'bg-amber-950/90 border-amber-500 text-amber-400' }
    };
    const SLOT_ORDER = ['F', 'm', 'a'];

    // "a net force", "a mass", "an acceleration"
    function aName(variable) {
      return `${VARS[variable].article || 'a'} ${VARS[variable].name}`;
    }

    // Up to 3 decimals, true minus sign
    function fmt(x) {
      const n = Math.round(x * 1000) / 1000;
      return n < 0 ? `−${Math.abs(n)}` : `${n}`;
    }

    // In parentheses when negative, e.g. 50 + (−20)
    function fmtTerm(x) {
      return x < 0 ? `(${fmt(x)})` : fmt(x);
    }

    function arrow(dir) {
      return dir === 'left' ? '←' : (dir === 'right' ? '→' : '');
    }

    // Accepts normal 2-decimal rounding; a wrong sign is never close enough
    function answerMatches(user, exact) {
      const delta = Math.abs(user - exact);
      return delta <= 0.006 || (exact !== 0 && delta / Math.abs(exact) <= 0.02);
    }

    function valuesOf(q, variable) {
      return q.values.filter(v => v.variable === variable);
    }

    // Worked solution, e.g. "Fnet = 50 + (−20) = 30 N · a = Fnet ÷ m = 30 ÷ 10 = 3 m/s²"
    // Each step is wrapped in nowrap so a calculation never breaks across lines.
    function workedSolutionHTML(q) {
      const steps = [];
      const total = {};
      ['F', 'm', 'a'].forEach(variable => {
        const vals = valuesOf(q, variable);
        if (!vals.length) return;
        total[variable] = vals.reduce((s, v) => s + signedValue(v), 0);
        if (vals.length > 1) {
          const label = variable === 'm' ? 'm<sub>total</sub>' : VARS[variable].html;
          steps.push(`${label} = ${vals.map((v, i) => i === 0 ? fmt(signedValue(v)) : fmtTerm(signedValue(v))).join(' + ')} = ${fmt(total[variable])} ${VARS[variable].unit}`);
        }
      });
      const exact = solveQuestion(q);
      const unit = VARS[q.solveFor].unit;
      if (q.solveFor === 'F') {
        steps.push(`F<sub>net</sub> = m · a = ${fmt(total.m)} · ${fmtTerm(total.a)} = ${fmt(exact)} ${unit}`);
      } else if (q.solveFor === 'a') {
        steps.push(`a = F<sub>net</sub> ÷ m = ${fmt(total.F)} ÷ ${fmt(total.m)} = ${fmt(exact)} ${unit}`);
      } else {
        steps.push(`m = F<sub>net</sub> ÷ a = ${fmt(total.F)} ÷ ${fmtTerm(total.a)} = ${fmt(exact)} ${unit}`);
      }
      return steps.map(s => `<span class="whitespace-nowrap">${s}</span>`).join(' &nbsp;·&nbsp; ');
    }

    // Common mistakes, solved the wrong way, so feedback can say what went wrong
    function solveWithMistake(q, mistake) {
      const sum = (variable) => {
        let vals = valuesOf(q, variable);
        if (mistake === 'oneMass' && variable === 'm') vals = vals.slice(0, 1);
        if (mistake === 'otherMass' && variable === 'm') vals = vals.slice(-1);
        return vals.reduce((s, v) => s + (mistake === 'noSigns' ? v.value : signedValue(v)), 0);
      };
      const F = sum('F'), m = sum('m'), a = sum('a');
      if (mistake === 'multiplied') return q.solveFor === 'a' ? F * m : F * a;
      if (mistake === 'flipped') return q.solveFor === 'a' ? m / F : (q.solveFor === 'm' ? a / F : null);
      if (q.solveFor === 'F') return m * a;
      if (q.solveFor === 'a') return F / m;
      return F / a;
    }

    function diagnoseWrongNumber(q, user) {
      const exact = solveQuestion(q);
      const forces = valuesOf(q, 'F');
      const masses = valuesOf(q, 'm');
      const hasLeft = q.values.some(v => v.dir === 'left');
      if (forces.length > 1 && answerMatches(user, solveWithMistake(q, 'noSigns'))) {
        return 'You added the two forces as if they pointed the same way. Forces in opposite directions work against each other: right is +, left is −.';
      }
      if (masses.length > 1 && (answerMatches(user, solveWithMistake(q, 'oneMass')) || answerMatches(user, solveWithMistake(q, 'otherMass')))) {
        return 'You used only one mass. The objects move together, so add the masses to get the total mass.';
      }
      if (exact !== 0 && answerMatches(user, -exact)) {
        if (!hasLeft) return 'Check the sign. Nothing in this problem points left, so the answer is positive.';
        return exact < 0
          ? 'Check the sign. Right is +, left is −. This answer points left, so it is negative.'
          : 'Check the sign. Right is +, left is −. This answer points right, so it is positive.';
      }
      if (q.solveFor !== 'F' && answerMatches(user, solveWithMistake(q, 'multiplied'))) {
        return `You multiplied. To find ${VARS[q.solveFor].name}, divide instead.`;
      }
      const flipped = solveWithMistake(q, 'flipped');
      if (flipped !== null && answerMatches(user, flipped)) {
        return 'You divided in the wrong order. Net force goes on top: divide the net force by the other number.';
      }
      return 'Not quite. Check which numbers you used and what you typed into Desmos.';
    }

    // -------------------------------------------------------------
    // HELP MODAL FORMULA EXPLANATIONS
    // -------------------------------------------------------------
    function selectHelpVariable(vName) {
      sound.playBeep();

      SLOT_ORDER.forEach(v => {
        const btn = document.getElementById(`btn-help-${v}`);
        if (v === vName) {
          btn.className = "py-3 rounded-xl font-bold text-center border-2 border-sky-500 bg-sky-600/10 text-sky-400 transition-all text-base mono glow-neon";
        } else {
          btn.className = "py-3 rounded-xl font-bold text-center border border-white/5 bg-slate-900/60 hover:bg-slate-800 text-slate-400 transition-all text-base mono";
        }
      });

      const F = '<span class="text-emerald-400">F<sub>net</sub></span>';
      const m = '<span class="text-sky-400">m</span>';
      const a = '<span class="text-amber-400">a</span>';
      const eq = '<span class="font-sans text-slate-500">=</span>';
      const fraction = (top, bottom) => `
        <div class="flex flex-col items-center">
          <span>${top}</span>
          <div class="w-16 sm:w-20 h-0.5 bg-slate-500 my-1 rounded"></div>
          <span>${bottom}</span>
        </div>`;

      const equationRender = document.getElementById('help-equation-render');
      const equationDesc = document.getElementById('help-equation-desc');

      if (vName === 'F') {
        equationRender.innerHTML = `${F} ${eq} ${m} <span class="font-sans text-slate-500">&middot;</span> ${a}`;
        equationDesc.innerText = "To find the net force (in newtons, N), multiply the mass (kg) by the acceleration (m/s²).";
      } else if (vName === 'm') {
        equationRender.innerHTML = `${m} ${eq} ${fraction(F, a)}`;
        equationDesc.innerText = "To find the mass (in kilograms, kg), divide the net force by the acceleration. Work backward from the forces.";
      } else {
        equationRender.innerHTML = `${a} ${eq} ${fraction(F, m)}`;
        equationDesc.innerText = "To find the acceleration (in m/s²), divide the net force by the mass. More net force means more acceleration. More mass means less.";
      }
    }

    // -------------------------------------------------------------
    // GAME LOOPS & STATE MANAGEMENT
    // -------------------------------------------------------------
    function freshState() {
      return {
        studentId: '',
        displayName: '',
        photoURL: '',
        period: null,
        honorsRequired: false,
        honorsOn: false,
        currentLevel: 1,
        unlockedLevels: [1],
        score: 0,
        answered: 0,
        streak: 0,
        bestQuizScore: 0,
        bestPct: 0,
        quizDone: false,
        completed: false,
        completedAt: '',
        certificateId: '',
        deck: [],
        currentQuestionIndex: 0
      };
    }

    let state = freshState();

    const MIN_QUESTIONS = 6;
    const REQUIRED_STREAK = 4;
    const MASTERY_PASS = 4; // quiz score needed for the certificate
    const MAX_POINTS = 10;
    const ASSIGNMENT_ID = 'newtons_second_law_calculator';
    const PHYSICS_LABS_COLLECTION = 'physics_labs';
    const LAB_FIELD = 'newtons_second_law';
    const HONORS_PERIODS = [0];
    const TEACHER_EMAILS = ['rmudry@orangeusd.org', 'ryan.mudry@gmail.com', 'ryanmudry@gmail.com'];

    function updateCloudStatus(status) {
      const el = document.getElementById('hud-cloud-status');
      const text = document.getElementById('hud-cloud-text');
      if (!el || !text) return;
      if (status === 'saving') {
        text.innerText = 'Saving...';
        el.className = 'flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-950/70 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-all font-mono';
      } else if (status === 'saved') {
        text.innerText = 'Auto-Saved';
        el.className = 'flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all font-mono';
      } else if (status === 'preview') {
        text.innerText = 'Preview Mode';
        el.className = 'flex items-center gap-1.5 text-[10px] text-sky-400 bg-sky-950/70 border border-sky-500/30 px-2.5 py-1 rounded-lg transition-all font-mono';
      } else if (status === 'error') {
        text.innerText = 'Sync Offline';
        el.className = 'flex items-center gap-1.5 text-[10px] text-rose-400 bg-rose-950/70 border border-rose-500/30 px-2.5 py-1 rounded-lg transition-all font-mono';
      }
    }

    function updateCertButtonHUD() {
      const btn = document.getElementById('btn-view-cert');
      if (!btn) return;
      btn.classList.toggle('hidden', !state.completed);
    }

    // Only Period 0 (Honors) and the teacher ever see Honors. Other classes get no badge or toggle.
    function isTeacher() {
      return state.period === 'T';
    }

    function updateHonorsButton() {
      const btn = document.getElementById('btn-honors');
      if (!btn) return;
      if (state.honorsRequired) {
        btn.innerText = '⭐ Honors: Required';
        btn.title = 'Honors problems are part of your class (Period 0).';
        btn.className = 'px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default';
      } else if (state.honorsOn) {
        btn.innerText = '⭐ Honors: On';
        btn.title = 'Teacher only: tap to turn off the Honors problems.';
        btn.className = 'px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-amber-500 text-slate-950 border border-amber-400 hover:bg-amber-400';
      } else {
        btn.innerText = '⭐ Honors: Off';
        btn.title = 'Teacher only: preview the Honors problems (two forces with signs, total system mass).';
        btn.className = 'px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-slate-800 text-amber-300/80 border border-amber-500/20 hover:bg-slate-700';
      }
      // After className is set, so it isn't overwritten
      btn.classList.toggle('hidden', !state.honorsRequired && !isTeacher());
      document.getElementById('help-honors').classList.toggle('hidden', !state.honorsOn);
    }

    function toggleHonors() {
      if (state.honorsRequired) {
        setFeedback('⭐ Honors problems are part of your class (Period 0), so they stay on.', 'info');
        return;
      }
      if (!isTeacher()) return;
      state.honorsOn = !state.honorsOn;
      updateHonorsButton();
      // A Level 3 quiz restarts so every quiz has one consistent mix of problems
      if (state.currentLevel === 3) {
        state.answered = 0;
        state.score = 0;
        state.quizDone = false;
      }
      state.deck = buildDeck(state.currentLevel);
      loadQuestion(0);
      setFeedback(state.honorsOn
        ? '⭐ Honors is on! Every other problem has two forces (right +, left −) or two masses to add.'
        : 'Honors is off. Back to standard problems.', 'info');
      saveState();
    }

    // Preview views (?view=cp or ?view=honors): see the app the way a student does.
    // Student views start with only Level 1 unlocked; nothing is saved in any preview.
    const PREVIEW_VIEWS = {
      teacher: { displayName: 'Preview Mode', unlockedLevels: [1, 2, 3], period: 'T' },
      cp: { displayName: 'Preview: Regular / CP student', unlockedLevels: [1], period: 3 },
      honors: { displayName: 'Preview: Honors student (P0)', unlockedLevels: [1], period: 0 }
    };

    function startGuestMode() {
      const requested = new URLSearchParams(window.location.search).get('view');
      const viewKey = PREVIEW_VIEWS[requested] ? requested : 'teacher';
      const view = PREVIEW_VIEWS[viewKey];
      const honorsRequired = HONORS_PERIODS.includes(view.period);
      Object.assign(state, freshState(), {
        studentId: 'teacher_preview',
        displayName: view.displayName,
        unlockedLevels: [...view.unlockedLevels],
        period: view.period,
        honorsRequired,
        honorsOn: honorsRequired
      });
      const wrap = document.getElementById('preview-view-wrap');
      wrap.classList.remove('hidden');
      wrap.classList.add('flex');
      document.getElementById('preview-view').value = viewKey;
      hudInitialize();
      updateCloudStatus('preview');
    }

    function switchPreviewView(viewKey) {
      const params = new URLSearchParams(window.location.search);
      params.set('preview', '');
      params.set('view', viewKey);
      window.location.search = params.toString().replace('preview=&', 'preview&').replace(/preview=$/, 'preview');
    }

    window.addEventListener('DOMContentLoaded', () => {
      if (typeof lucide !== 'undefined' && lucide && lucide.createIcons) {
        lucide.createIcons();
      }
      updateThemeButton();

      // Check redirect result for devices that fallback to signInWithRedirect
      if (fbAuth && fbAuth.getRedirectResult) {
        fbAuth.getRedirectResult().catch(err => {
          console.warn('Redirect sign-in notice:', err);
        });
      }

      // Auto-detect preview mode: local file, localhost, or query parameters (?preview, ?test, ?guest)
      const urlParams = new URLSearchParams(window.location.search);
      const isAutoPreview = window.location.protocol === 'file:' ||
                            window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1' ||
                            urlParams.has('preview') ||
                            urlParams.has('test') ||
                            urlParams.has('guest');

      if (isAutoPreview) {
        startGuestMode();
      } else {
        showSection('view-register');
      }

      // Firebase Auth observer
      fbAuth.onAuthStateChanged(async user => {
        if (user) {
          const emailLower = (user.email || '').toLowerCase();
          const isAllowed = emailLower.endsWith('@orangeusd.org') || TEACHER_EMAILS.includes(emailLower);

          if (!isAllowed) {
            document.getElementById('register-error').classList.remove('hidden');
            document.getElementById('register-status').classList.add('hidden');
            await fbAuth.signOut();
            return;
          }

          const prefix = emailLower.split('@')[0];
          state.studentId = prefix;
          state.displayName = user.displayName || prefix;
          state.photoURL = user.photoURL || '';

          await loadProgressFromFirestore(prefix);
          await lookupRosterPeriod(prefix, emailLower);
          hudInitialize();
        } else {
          // If in preview mode, do not kick back to login screen
          if (state.studentId !== 'teacher_preview') {
            showSection('view-register');
            document.getElementById('register-status').classList.add('hidden');
          }
        }
      });

      document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => sound.playBeep());
      });

      bindDragAndDropEvents();
    });

    async function handleGoogleSignIn() {
      const errEl = document.getElementById('register-error');
      const statusEl = document.getElementById('register-status');
      errEl.classList.add('hidden');
      statusEl.classList.remove('hidden');
      statusEl.innerText = 'Connecting to Google...';
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ hd: 'orangeusd.org', prompt: 'select_account' });
      try {
        await fbAuth.signInWithPopup(provider);
      } catch (e) {
        console.warn('Popup sign-in encounter:', e);
        if (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request' || (e.message && e.message.includes('Cross-Origin-Opener-Policy'))) {
          statusEl.innerText = 'Redirecting to Google sign-in...';
          try {
            await fbAuth.signInWithRedirect(provider);
            return;
          } catch (rErr) {
            console.error('Redirect sign-in error:', rErr);
          }
        }
        if (e.code !== 'auth/popup-closed-by-user') {
          console.error(e);
          statusEl.classList.add('hidden');
          errEl.classList.remove('hidden');
          errEl.innerText = 'Sign-in failed — please try again or use Preview Mode';
        } else {
          statusEl.classList.add('hidden');
        }
      }
    }

    // Class period from the roster decides whether the Honors problems are required
    async function lookupRosterPeriod(studentId, email) {
      if (TEACHER_EMAILS.includes(email)) {
        state.period = 'T';
        state.honorsRequired = false;
        return;
      }
      try {
        const snap = await fbDb.collection('roster').doc(studentId).get();
        if (snap.exists) {
          const d = snap.data();
          const p = (d.class_period !== undefined && d.class_period !== null)
            ? d.class_period
            : (d.period !== undefined && d.period !== null ? d.period : null);
          if (p !== null) {
            const num = parseInt(p, 10);
            state.period = Number.isNaN(num) ? p : num;
          }
        }
      } catch (e) {
        console.warn('Roster lookup failed; treating as a standard class (no Honors):', e);
      }
      state.honorsRequired = HONORS_PERIODS.includes(state.period);
      // Honors is on for Period 0 and off for every other class, whatever was saved before
      state.honorsOn = state.honorsRequired;
    }

    // Grade (best ever, never lowered):
    // Level 1: 5% per correct answer up to 30%. Level 2: 30% + 5% per correct answer up to 60%.
    // Level 3 quiz: 60% + 40% × (best quiz score ÷ 6).
    function progressPct() {
      let pct = 0;
      if (state.unlockedLevels.includes(3)) pct = 60;
      else if (state.unlockedLevels.includes(2)) pct = 30 + (state.currentLevel === 2 ? Math.min(state.answered, MIN_QUESTIONS) * 5 : 0);
      else pct = Math.min(state.answered, MIN_QUESTIONS) * 5;
      if (state.bestQuizScore > 0) pct = Math.max(pct, 60 + Math.round(40 * state.bestQuizScore / MIN_QUESTIONS));
      return Math.min(100, pct);
    }

    async function saveState() {
      if (!state.studentId) return;
      if (state.studentId === 'teacher_preview') {
        updateCloudStatus('preview');
        return;
      }
      state.bestPct = Math.max(state.bestPct || 0, progressPct());
      updateCloudStatus('saving');
      const periodVal = (state.period !== undefined && state.period !== null) ? state.period : null;
      try {
        // 1. Save to physics_labs for student lab resumption
        await fbDb.collection(PHYSICS_LABS_COLLECTION)
          .doc(state.studentId)
          .set({
            studentId: state.studentId,
            student_id: state.studentId,
            displayName: state.displayName || state.studentId,
            class_period: periodVal,
            [LAB_FIELD]: {
              currentLevel: state.currentLevel,
              unlockedLevels: state.unlockedLevels,
              answered: state.answered,
              streak: state.streak,
              score: state.score,
              quizDone: !!state.quizDone,
              honorsOn: !!state.honorsOn,
              bestQuizScore: state.bestQuizScore,
              bestPct: state.bestPct,
              completed: !!state.completed,
              completedAt: state.completedAt || null,
              certificateId: state.certificateId || null
            },
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

        // 2. Save to standard student_results collection for Gradebook sync
        await fbDb.collection('student_results')
          .doc(ASSIGNMENT_ID)
          .collection('students')
          .doc(state.studentId)
          .set({
            student_id: state.studentId,
            studentId: state.studentId,
            student_name: state.displayName || state.studentId,
            displayName: state.displayName || state.studentId,
            score: Math.round((state.bestPct / 100) * MAX_POINTS),
            maxScore: MAX_POINTS,
            maxPoints: MAX_POINTS,
            percentage: state.bestPct,
            class_period: periodVal,
            honors: !!state.honorsOn,
            honors_required: !!state.honorsRequired,
            completed: !!state.completed,
            completedAt: state.completedAt || new Date().toISOString(),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

        updateCloudStatus('saved');
      } catch (e) {
        console.error('Firestore save error', e);
        updateCloudStatus('error');
      }
    }

    async function loadProgressFromFirestore(studentId) {
      Object.assign(state, {
        unlockedLevels: [1], currentLevel: 1, answered: 0, streak: 0, score: 0, quizDone: false,
        honorsOn: false, bestQuizScore: 0, bestPct: 0, completed: false, completedAt: '', certificateId: ''
      });
      try {
        const snap = await fbDb.collection(PHYSICS_LABS_COLLECTION).doc(studentId).get();
        const labData = snap.exists ? (snap.data()[LAB_FIELD] || {}) : {};
        state.unlockedLevels = labData.unlockedLevels || [1];
        state.bestQuizScore = labData.bestQuizScore || 0;
        state.bestPct = labData.bestPct || 0;
        state.honorsOn = !!labData.honorsOn;
        state.completed = !!labData.completed;
        state.completedAt = labData.completedAt || '';
        state.certificateId = labData.certificateId || '';
        const savedLevel = labData.currentLevel || 1;
        state.currentLevel = state.unlockedLevels.includes(savedLevel) ? savedLevel : 1;
        state.answered = typeof labData.answered === 'number' ? labData.answered : 0;
        state.streak = typeof labData.streak === 'number' ? labData.streak : 0;
        state.score = typeof labData.score === 'number' ? labData.score : 0;
        state.quizDone = !!labData.quizDone;

        // Never lower a grade that is already in the gradebook
        const resultSnap = await fbDb.collection('student_results').doc(ASSIGNMENT_ID).collection('students').doc(studentId).get();
        if (resultSnap.exists) {
          state.bestPct = Math.max(state.bestPct, Number(resultSnap.data().percentage) || 0);
        }
      } catch (e) {
        console.error('Firestore load error', e);
      }
      updateCertButtonHUD();
    }

    function showSection(id) {
      ['view-register', 'view-workspace'].forEach(s => {
        const el = document.getElementById(s);
        if (s === id) {
          el.classList.remove('hidden');
          el.style.opacity = '0';
          setTimeout(() => el.style.opacity = '1', 50);
        } else {
          el.classList.add('hidden');
        }
      });
      document.getElementById('student-badge').classList.toggle('hidden', id === 'view-register');
    }

    function logout() {
      if (confirm("Sign out of the lab? Your progress is saved to your account.")) {
        state = freshState();
        speech.cancel();
        showSection('view-register');
        if (fbAuth.currentUser) {
          fbAuth.signOut();
        }
      }
    }

    function hudInitialize() {
      const displayLabel = state.displayName || state.studentId;
      document.getElementById('badge-id').innerText = displayLabel;
      document.getElementById('hud-student-id').innerText = displayLabel;

      const avatarEl = document.getElementById('badge-avatar');
      if (state.photoURL) {
        avatarEl.src = state.photoURL;
        avatarEl.classList.remove('hidden');
      } else {
        avatarEl.classList.add('hidden');
      }

      updateCertButtonHUD();
      updateHonorsButton();
      updateLevelButtonsUI();

      changeLevel(state.currentLevel || 1, true);
      showSection('view-workspace');
    }

    function updateLevelButtonsUI() {
      for (let lvl = 1; lvl <= 3; lvl++) {
        const btn = document.getElementById(`btn-level-${lvl}`);
        if (state.unlockedLevels.includes(lvl)) {
          btn.disabled = false;
          if (state.currentLevel === lvl) {
            btn.className = "px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-sky-600 text-white shadow-md glow-neon";
          } else if (lvl > state.currentLevel) {
            btn.className = "px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 pulse-amber";
          } else {
            btn.className = "px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-white text-slate-800 hover:bg-slate-100 border border-white/5";
          }
        } else {
          btn.disabled = true;
          btn.className = "px-3 py-1.5 text-xs rounded-lg font-bold transition-all bg-slate-900 text-slate-500 border border-white/5 cursor-not-allowed";
        }
      }
    }

    // Standard problems for the level; with Honors on, every other problem is an Honors problem
    function buildDeck(levelNum) {
      const regular = shuffleArray(QUESTIONS.filter(q => q.level === levelNum && !q.honors));
      if (!state.honorsOn) return regular;
      const honors = shuffleArray(QUESTIONS.filter(q => q.level === levelNum && q.honors));
      const deck = [];
      for (let i = 0; i < Math.max(regular.length, honors.length); i++) {
        if (i < regular.length) deck.push(regular[i]);
        if (i < honors.length) deck.push(honors[i]);
      }
      return deck;
    }

    function changeLevel(levelNum, preserveProgress = false) {
      if (!state.unlockedLevels.includes(levelNum)) return;

      sound.playBeep();
      speech.cancel();

      state.currentLevel = levelNum;
      if (!preserveProgress) {
        state.answered = 0;
        state.streak = 0;
        state.score = 0;
        state.quizDone = false;
      }

      updateLevelButtonsUI();

      state.deck = buildDeck(levelNum);
      state.currentQuestionIndex = 0;

      document.getElementById('hud-streak-container').classList.toggle('hidden', levelNum === 3);
      toggleCalculatorModal(levelNum >= 2);

      loadQuestion(0);
      saveState();
    }

    function shuffleArray(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    // -------------------------------------------------------------
    // PLAYING QUESTION & SLOTS STATE
    // -------------------------------------------------------------
    // Each slot holds a list: given value objects, or the 'unknown' marker.
    // A slot holds two values only when the problem has two of that variable (Honors: two forces or two masses).
    let placed = { F: [], m: [], a: [] };
    let selectedDragItem = null;
    let hintsShown = 0;

    function currentQuestion() {
      return state.deck[state.currentQuestionIndex];
    }

    function feedbackClass(tone) {
      const tones = {
        neutral: 'text-slate-300 border-white/5',
        info: 'text-sky-300 border-sky-500/20',
        success: 'text-emerald-400 border-emerald-500/20',
        warn: 'text-amber-400 border-amber-500/30 animate-shake',
        error: 'text-rose-300 border-rose-500/30 animate-shake'
      };
      return `glass rounded-xl p-3 text-center font-bold text-xs min-h-[48px] flex flex-col items-center justify-center gap-1 border ${tones[tone] || tones.neutral}`;
    }

    function setFeedback(html, tone = 'neutral') {
      const box = document.getElementById('feedback-box');
      box.className = feedbackClass(tone);
      box.innerHTML = html;
    }

    function loadQuestion(idx = state.currentQuestionIndex || 0) {
      if (typeof idx !== 'number' || isNaN(idx) || idx < 0 || idx >= state.deck.length) {
        state.deck = buildDeck(state.currentLevel);
        idx = 0;
      }

      state.currentQuestionIndex = idx;
      isCurrentQuestionSolved = false;
      placed = { F: [], m: [], a: [] };
      selectedDragItem = null;
      hintsShown = 0;
      renderHints();

      document.getElementById('selection-helper').innerText = '';
      document.getElementById('manual-user-answer').value = '';
      setFeedback(getLevelInstruction());

      document.getElementById('btn-next-question').classList.add('hidden');
      document.getElementById('btn-new-problem').classList.add('hidden');
      document.getElementById('btn-check-answer').classList.remove('hidden');
      document.getElementById('calc-input-helper').classList.add('hidden');

      if (state.currentLevel >= 2) {
        if (desmosCalculator) {
          try {
            desmosCalculator.setBlank();
          } catch (e) {}
        }
        onDesmosChange();
      }

      updateProgressHUD();
      renderQuestionBadges();
      updateEquationSlotsUI();

      // Quiz already finished (e.g. resumed after reload): offer the retake
      if (state.currentLevel === 3 && state.quizDone) showQuizResult();
    }

    function getLevelInstruction() {
      const honors = currentQuestion() && currentQuestion().honors ? '⭐ Honors problem! ' : '';
      if (state.currentLevel === 1) {
        return honors + "Drag or tap each given value and the unknown into the equation, then check your answer.";
      } else if (state.currentLevel === 2) {
        return honors + "Place the values, calculate in Desmos, paste or type your answer, then check it.";
      }
      return honors + "Mastery quiz! Each problem counts. A wrong answer moves on to the next problem.";
    }

    function updateProgressHUD() {
      const total = MIN_QUESTIONS;
      document.getElementById('progress-bar-fill').style.width = `${Math.min((state.answered / total) * 100, 100)}%`;
      const answeredHUD = document.getElementById('hud-answered');

      if (state.currentLevel === 3) {
        answeredHUD.innerText = `${Math.min(state.answered, total)} / ${total} Answered · Score: ${state.score} / ${total}`;
      } else {
        answeredHUD.innerText = `${Math.min(state.answered, total)} / ${total} Correct`;
        document.getElementById('hud-streak').innerText = `${Math.min(state.streak, REQUIRED_STREAK)} / ${REQUIRED_STREAK}`;
      }
    }

    function isValuePlaced(id) {
      return SLOT_ORDER.some(s => placed[s].some(item => item !== 'unknown' && item.id === id));
    }

    function findSlotForValue(id) {
      return SLOT_ORDER.find(s => placed[s].some(item => item !== 'unknown' && item.id === id)) || null;
    }

    function findUnknownSlotName() {
      return SLOT_ORDER.find(s => placed[s].includes('unknown')) || null;
    }

    function valueText(v) {
      return `${v.value} ${v.unit}`;
    }

    function renderQuestionBadges() {
      const q = currentQuestion();
      const container = document.getElementById('question-text');
      container.innerHTML = '';

      const makeBadge = (text, activeClass, placedClass, payload, isPlaced, slotName) => {
        const badge = document.createElement('span');
        badge.innerText = text;

        if (isPlaced) {
          badge.className = `badge-token ${placedClass}`;
          badge.title = "Placed in equation. Click to remove from slot.";
          badge.addEventListener('click', () => {
            if (isCurrentQuestionSolved) return;
            sound.playBeep();
            selectedDragItem = null;
            document.getElementById('selection-helper').innerText = '';
            if (slotName) {
              if (payload.type === 'unknown') {
                clearSlot(slotName);
              } else if (payload.type === 'value') {
                placed[slotName] = (placed[slotName] || []).filter(item => item !== 'unknown' && item.id !== payload.value.id);
                updateEquationSlotsUI();
                renderQuestionBadges();
                validateLevel2InputHelperVisibility();
              }
            }
          });
        } else {
          badge.className = `badge-token ${activeClass} drag-item`;
          badge.draggable = true;
          badge.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('application/json', JSON.stringify(payload));
            badge.classList.add('opacity-40');
          });
          badge.addEventListener('dragend', () => badge.classList.remove('opacity-40'));
          badge.addEventListener('click', () => selectBadgeClick(badge, payload, text));
        }

        return badge;
      };

      q.textParts.forEach(part => {
        if (typeof part === 'string') {
          const span = document.createElement('span');
          span.innerText = part;
          container.appendChild(span);
        } else if (part.isUnknown) {
          const unknownSlot = findUnknownSlotName();
          container.appendChild(makeBadge(
            q.unknownText,
            "badge-token-active-unknown",
            "badge-token-placed-unknown",
            { type: 'unknown' },
            Boolean(unknownSlot),
            unknownSlot
          ));
        } else if (part.valueId) {
          const v = q.values.find(x => x.id === part.valueId);
          if (!v) return;
          const placedSlot = findSlotForValue(v.id);
          // Badge color is neutral so students identify the variable from the unit, not the color
          container.appendChild(makeBadge(
            valueText(v),
            "badge-token-active-value",
            "badge-token-placed-value",
            { type: 'value', value: v },
            Boolean(placedSlot),
            placedSlot
          ));
        }
      });
    }

    function selectBadgeClick(el, payload, text) {
      if (isCurrentQuestionSolved) return;
      sound.playBeep();
      document.querySelectorAll('.drag-item').forEach(b => b.classList.remove('glow-neon', 'ring-2', 'ring-sky-400'));

      if (selectedDragItem && selectedDragItem.text === text) {
        selectedDragItem = null;
        document.getElementById('selection-helper').innerText = '';
      } else {
        selectedDragItem = { payload, text };
        el.classList.add('glow-neon', 'ring-2', 'ring-sky-400');
        document.getElementById('selection-helper').innerText = `Selected ${text}. Now tap a slot in the equation to place it.`;
      }
    }

    function handleSlotClick(slotEl) {
      if (isCurrentQuestionSolved) return;
      sound.playBeep();
      const slotName = slotEl.getAttribute('data-slot');

      if (selectedDragItem) {
        placePayloadInSlot(selectedDragItem.payload, slotName);
        selectedDragItem = null;
        document.getElementById('selection-helper').innerText = '';
      } else if (placed[slotName].length) {
        clearSlot(slotName);
      }
    }

    function placePayloadInSlot(payload, slotName) {
      if (isCurrentQuestionSolved) return;
      const q = currentQuestion();
      if (payload.type === 'unknown') {
        SLOT_ORDER.forEach(s => { placed[s] = placed[s].filter(item => item !== 'unknown'); });
        placed[slotName] = ['unknown'];
      } else if (payload.type === 'value') {
        const v = q.values.find(x => x.id === payload.value.id);
        if (!v) return;
        SLOT_ORDER.forEach(s => { placed[s] = placed[s].filter(item => item === 'unknown' || item.id !== v.id); });
        const current = placed[slotName];
        const twoOfThisVariable = valuesOf(q, v.variable).length > 1;
        const canStack = twoOfThisVariable && current.length > 0 && current.every(item => item !== 'unknown' && item.variable === v.variable);
        placed[slotName] = canStack ? [...current, v] : [v];
      }

      updateEquationSlotsUI();
      renderQuestionBadges();
      validateLevel2InputHelperVisibility();
    }

    function clearSlot(slotName) {
      placed[slotName] = [];
      updateEquationSlotsUI();
      renderQuestionBadges();
      validateLevel2InputHelperVisibility();
    }

    function validateLevel2InputHelperVisibility() {
      const helper = document.getElementById('calc-input-helper');
      if (state.currentLevel >= 2 && findUnknownSlotName()) {
        helper.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
        onDesmosChange();
      } else {
        helper.classList.add('hidden');
      }
    }

    function updateEquationSlotsUI() {
      const q = currentQuestion();

      SLOT_ORDER.forEach(slotName => {
        const slotEl = document.querySelector(`[data-slot="${slotName}"]`);
        const items = placed[slotName];
        const label = VARS[slotName].html;

        if (items.includes('unknown')) {
          if (state.currentLevel >= 2 && slotName === q.solveFor) {
            slotEl.innerHTML = `
              <span class="text-[8px] sm:text-[9px] text-slate-400 block select-none tracking-wider mb-0.5">${label} (solve)</span>
              <div onclick="event.stopPropagation();" class="w-full px-1 sm:px-2">
                <input
                  type="number"
                  step="0.01"
                  id="equation-inline-input"
                  placeholder="?"
                  value="${document.getElementById('manual-user-answer').value || ''}"
                  oninput="syncInlineInputs(this.value)"
                  class="w-full bg-slate-950/90 border border-indigo-500/40 text-center font-bold text-lg sm:text-xl py-0.5 sm:py-1 rounded-lg text-indigo-300 focus:outline-none focus:border-indigo-400 mono"
                >
              </div>
            `;
            slotEl.className = "drag-target equation-slot bg-slate-900 border-2 border-slate-700 rounded-xl flex flex-col items-center justify-center transition-all scale-102";
          } else {
            slotEl.innerHTML = `
              <span class="text-[8px] sm:text-[9px] text-slate-400 block select-none tracking-wider">${label}</span>
              <span class="text-[10px] sm:text-xs font-bold text-center px-1 leading-tight line-clamp-3">${q.unknownText}</span>
            `;
            slotEl.className = "drag-target equation-slot bg-indigo-950/80 border-indigo-500 text-indigo-300 border-2 rounded-xl flex flex-col items-center justify-center transition-all scale-102";
          }
        } else if (items.length) {
          // Color comes from the slot, so a value in the wrong slot is not flagged by color
          const lines = items.map(item => `<span class="text-sm sm:text-base font-black mono leading-tight whitespace-nowrap">${item.value}${item.dir ? ' ' + arrow(item.dir) : ''}</span>`).join('');
          const units = [...new Set(items.map(item => item.unit))].join(', ');
          slotEl.innerHTML = `
            <span class="text-[8px] sm:text-[9px] text-slate-400 block select-none tracking-wider">${label}</span>
            ${lines}
            <span class="text-[9px] text-slate-400 mono">${units}</span>
          `;
          slotEl.className = `drag-target equation-slot ${VARS[slotName].slot} border-2 rounded-xl flex flex-col items-center justify-center transition-all scale-102`;
        } else {
          slotEl.innerHTML = `
            <span class="text-slate-500 text-xl sm:text-3xl font-mono select-none">${label}</span>
            <span class="text-[8px] sm:text-[9px] text-slate-600 font-sans tracking-wider uppercase font-semibold select-none mt-0.5">${VARS[slotName].sub}</span>
          `;
          slotEl.className = "drag-target equation-slot bg-slate-950/80 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 select-none cursor-pointer transition-all";
        }
      });
    }

    function syncInlineInputs(val) {
      document.getElementById('manual-user-answer').value = val;
    }

    function bindDragAndDropEvents() {
      document.querySelectorAll('.drag-target').forEach(slot => {
        slot.addEventListener('dragover', (e) => {
          e.preventDefault();
          slot.classList.add('drag-over');
        });
        slot.addEventListener('dragleave', () => {
          slot.classList.remove('drag-over');
        });
        slot.addEventListener('drop', (e) => {
          e.preventDefault();
          slot.classList.remove('drag-over');
          try {
            const payload = JSON.parse(e.dataTransfer.getData('application/json'));
            placePayloadInSlot(payload, slot.getAttribute('data-slot'));
          } catch (err) {
            console.error("Failed to drop payload", err);
          }
        });
      });
    }

    function resetWorkspace() {
      if (isCurrentQuestionSolved) return;
      sound.playBeep();
      placed = { F: [], m: [], a: [] };
      selectedDragItem = null;
      document.getElementById('selection-helper').innerText = '';
      document.getElementById('manual-user-answer').value = '';
      setFeedback(getLevelInstruction());

      validateLevel2InputHelperVisibility();
      renderQuestionBadges();
      updateEquationSlotsUI();
    }

    // -------------------------------------------------------------
    // STEP-BY-STEP HINTS (one at a time, no penalty)
    // -------------------------------------------------------------
    function getHints(q) {
      const target = VARS[q.solveFor];
      const forces = valuesOf(q, 'F');
      const masses = valuesOf(q, 'm');
      const hints = [
        `You are looking for <b>${q.unknownText}</b>. That is ${target.article || 'a'} <b>${target.name}</b>, so the purple unknown goes in the <b>${target.html}</b> slot.`,
        `Match each value by its unit: <b>N</b> (newtons) is a force, <b>kg</b> (kilograms) is a mass, and <b>m/s²</b> is an acceleration.`
      ];
      if (forces.length > 1) {
        hints.push(`There are two forces. Put both in the F<sub>net</sub> slot. The net force is what is left over when they push against each other: right is +, left is −.`);
      }
      if (masses.length > 1) {
        hints.push(`The objects move together, so they share one acceleration. Put both masses in the m slot. Add them to get the total mass.`);
      }
      if (forces.length < 2 && q.values.some(v => v.dir === 'left')) {
        hints.push(`Something points left. Left is negative, so use a minus sign for it.`);
      }
      if (q.solveFor === 'F') {
        hints.push(`Multiply: <span class="whitespace-nowrap">F<sub>net</sub> = m · a</span>.`);
      } else if (q.solveFor === 'a') {
        hints.push(`Divide: <span class="whitespace-nowrap">a = F<sub>net</sub> ÷ m</span>. The net force goes on top.`);
      } else {
        hints.push(`Work backward. Divide: <span class="whitespace-nowrap">m = F<sub>net</sub> ÷ a</span>. The net force goes on top.`);
      }
      if (state.currentLevel >= 2) {
        hints.push(`In Desmos, type the numbers with <b>×</b> to multiply or <b>÷</b> to divide, then tap <b>Paste Desmos</b>.`);
      }
      return hints;
    }

    function renderHints() {
      const panel = document.getElementById('hint-panel');
      const list = document.getElementById('hint-list');
      const btn = document.getElementById('btn-hint');
      const q = currentQuestion();
      const hints = q ? getHints(q) : [];
      panel.classList.toggle('hidden', hintsShown === 0);
      list.innerHTML = hints.slice(0, hintsShown).map(h => `<li>${h}</li>`).join('');
      document.getElementById('hint-count').innerText = `${hintsShown} / ${hints.length}`;
      const done = hintsShown >= hints.length;
      btn.disabled = done;
      btn.classList.toggle('opacity-40', done);
      btn.classList.toggle('cursor-not-allowed', done);
    }

    function showNextHint() {
      const q = currentQuestion();
      if (!q || hintsShown >= getHints(q).length) return;
      hintsShown++;
      renderHints();
    }

    // -------------------------------------------------------------
    // ALGEBRAIC EQUATION VALIDATION CHECK
    // -------------------------------------------------------------
    // Explains a misplaced value or unknown, or returns null when every slot is right
    function placementProblem(q) {
      const unknownSlot = findUnknownSlotName();
      if (unknownSlot !== q.solveFor) {
        return `The unknown is ${q.unknownText}. That is ${aName(q.solveFor)}, so it goes in the ${VARS[q.solveFor].html} slot.`;
      }
      for (const slotName of SLOT_ORDER) {
        for (const item of placed[slotName]) {
          if (item !== 'unknown' && item.variable !== slotName) {
            return `${valueText(item)} is ${aName(item.variable)} (its unit is ${item.unit}), so it goes in the ${VARS[item.variable].html} slot.`;
          }
        }
      }
      return null;
    }

    function checkCurrentAnswer() {
      if (isCurrentQuestionSolved) return;
      const q = currentQuestion();

      // Not finished placing: no penalty, just a reminder
      const needed = q.values.length + 1;
      const placedCount = SLOT_ORDER.reduce((n, s) => n + placed[s].length, 0);
      if (placedCount < needed) {
        setFeedback(`Place all ${q.values.length} given values and the unknown into the equation first.`, 'warn');
        sound.playError();
        return;
      }

      const why = placementProblem(q);
      if (why) {
        markWrong(why);
        return;
      }

      const exactVal = solveQuestion(q);

      if (state.currentLevel === 1) {
        // Level 1: placement is the task, so the answer is calculated for the student
        isCurrentQuestionSolved = true;
        sound.playSuccess();
        confetti({ particleCount: 40, spread: 50 });

        const unknownSlotEl = document.querySelector(`[data-slot="${q.solveFor}"]`);
        unknownSlotEl.innerHTML = `
          <span class="text-[8px] sm:text-[9px] text-slate-400 block tracking-wider">${VARS[q.solveFor].html}</span>
          <span class="text-sm sm:text-base font-extrabold text-emerald-400 mono whitespace-nowrap">${fmt(exactVal)}</span>
          <span class="text-[9px] text-slate-400 mono">${VARS[q.solveFor].unit}</span>
        `;
        unknownSlotEl.className = "drag-target equation-slot bg-emerald-950/20 border-2 border-emerald-500 rounded-xl flex flex-col items-center justify-center transition-all scale-105";

        const leftNote = exactVal < 0 ? '<span class="text-slate-300 font-semibold">The answer is negative, so it points left.</span>' : '';
        setFeedback(`<span>Correct! Every value is in the right place.</span><span class="text-slate-300 font-semibold">${workedSolutionHTML(q)}</span>${leftNote}`, 'success');
        incrementStateStats(true);
        return;
      }

      // Level 2 & 3: check the student's own calculation
      const userInput = parseFloat(document.getElementById('manual-user-answer').value);
      if (isNaN(userInput)) {
        setFeedback("Type or paste your answer as a number first.", 'warn');
        sound.playError();
        return;
      }

      if (!verifyDesmosWork(userInput)) {
        setFeedback("⚠️ Do the calculation in the Desmos calculator first, then paste or type that answer.", 'warn');
        sound.playError();
        toggleCalculatorModal(true);
        const desmosCard = document.getElementById('desmos-card-wrapper');
        if (desmosCard) {
          desmosCard.classList.add('ring-2', 'ring-amber-400');
          setTimeout(() => desmosCard.classList.remove('ring-2', 'ring-amber-400'), 1500);
        }
        return;
      }

      if (answerMatches(userInput, exactVal)) {
        isCurrentQuestionSolved = true;
        sound.playSuccess();
        confetti({ particleCount: 50, spread: 60 });

        setFeedback(`<span>${state.currentLevel === 3 ? 'Correct! You earned a point.' : 'Correct! Calculation checked.'}</span><span class="text-slate-300 font-semibold">${workedSolutionHTML(q)}</span>`, 'success');

        const inlineInput = document.getElementById('equation-inline-input');
        if (inlineInput) {
          inlineInput.disabled = true;
          inlineInput.classList.remove('border-indigo-500/40', 'text-indigo-300');
          inlineInput.classList.add('border-emerald-500', 'text-emerald-400', 'bg-emerald-950/20');
        }
        incrementStateStats(true);
      } else {
        markWrong(diagnoseWrongNumber(q, userInput), true);
      }
    }

    // Wrong answer: say why, show the worked solution, then the student gets a NEW problem
    function markWrong(why, showWork = false) {
      const q = currentQuestion();
      isCurrentQuestionSolved = true;
      sound.playError();
      const work = showWork ? `<span class="text-slate-300 font-semibold">Correct work: ${workedSolutionHTML(q)}</span>` : '';
      setFeedback(`<span>${why}</span>${work}`, 'error');
      incrementStateStats(false);
    }

    function incrementStateStats(isCorrect) {
      if (state.currentLevel === 3) {
        // Quiz: every problem counts, right or wrong
        state.answered++;
        if (isCorrect) state.score++;
      } else if (isCorrect) {
        state.answered++;
        state.streak++;
      } else {
        state.streak = 0;
      }

      document.getElementById('btn-check-answer').classList.add('hidden');
      const nextBtn = document.getElementById(isCorrect ? 'btn-next-question' : 'btn-new-problem');
      nextBtn.innerText = isCorrect ? 'Next Question' : (state.currentLevel === 3 ? 'Next Question' : 'Try a New Problem');
      nextBtn.classList.remove('hidden');

      evaluateLevelUnlocks();
      updateProgressHUD();
      saveState();
    }

    function evaluateLevelUnlocks() {
      if (state.currentLevel === 1 || state.currentLevel === 2) {
        const next = state.currentLevel + 1;
        if (state.answered >= MIN_QUESTIONS && state.streak >= REQUIRED_STREAK && !state.unlockedLevels.includes(next)) {
          state.unlockedLevels.push(next);
          setTimeout(() => {
            triggerLevelUnlockModal(next);
            updateLevelButtonsUI();
          }, 800);
        }
      } else if (state.currentLevel === 3 && state.answered >= MIN_QUESTIONS && !state.quizDone) {
        finishQuiz();
      }
    }

    function makeCertificateId(score) {
      const dateStr = new Date().toLocaleDateString();
      const dataStr = `${state.studentId}-3-${score}-${dateStr}`;
      let check = 0;
      for (let i = 0; i < dataStr.length; i++) {
        check += dataStr.charCodeAt(i) * (i + 1);
      }
      return `MUD-NEWTON2-${state.studentId}-3-${score}-${check.toString(16).toUpperCase()}`;
    }

    function finishQuiz() {
      state.quizDone = true;
      const improved = state.score > state.bestQuizScore;
      state.bestQuizScore = Math.max(state.bestQuizScore, state.score);

      if (state.score >= MASTERY_PASS && (improved || !state.completed)) {
        state.completed = true;
        state.completedAt = new Date().toISOString();
        state.certificateId = makeCertificateId(state.bestQuizScore);
        updateCertButtonHUD();
        setTimeout(() => triggerCompletionCertificate(), 1200);
      }
      setTimeout(() => showQuizResult(), 1200);
    }

    function showQuizResult() {
      const passed = state.score >= MASTERY_PASS;
      const msg = passed
        ? `Quiz complete: ${state.score} / ${MIN_QUESTIONS}! Your best score is ${state.bestQuizScore} / ${MIN_QUESTIONS}. Retake the quiz any time — your best score is kept.`
        : `Quiz complete: ${state.score} / ${MIN_QUESTIONS}. You need ${MASTERY_PASS} / ${MIN_QUESTIONS} for the certificate. Use the Hint button and try again — your best score is kept.`;
      isCurrentQuestionSolved = true;
      setFeedback(msg, passed ? 'success' : 'warn');
      document.getElementById('btn-check-answer').classList.add('hidden');
      document.getElementById('btn-next-question').classList.add('hidden');
      const retake = document.getElementById('btn-new-problem');
      retake.innerText = 'Retake Quiz';
      retake.classList.remove('hidden');
    }

    function nextQuestion() {
      if (state.currentLevel === 3 && state.quizDone) {
        changeLevel(3);
        return;
      }
      loadQuestion(state.currentQuestionIndex + 1);
    }

    let nextUnlockedLevel = 2;

    function triggerLevelUnlockModal(levelNum) {
      nextUnlockedLevel = levelNum;
      document.getElementById('unlock-level-num').innerText = levelNum;

      const titleEl = document.getElementById('unlock-level-title');
      const descEl = document.getElementById('unlock-level-description');

      if (levelNum === 2) {
        titleEl.innerText = "LEVEL 2 IS NOW ACCESSIBLE";
        descEl.innerText = "Place the values, then calculate the answer yourself with the Desmos calculator.";
      } else {
        titleEl.innerText = "LEVEL 3 IS NOW ACCESSIBLE";
        descEl.innerText = `Mastery quiz! Solve ${MIN_QUESTIONS} problems with Desmos. Get ${MASTERY_PASS} or more right to earn your Certificate of Mastery.`;
      }

      sound.playSuccess();
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });

      const modal = document.getElementById('modal-level-unlocked');
      modal.classList.remove('hidden');
      setTimeout(() => {
        modal.querySelector('.transform').classList.remove('scale-95');
        modal.querySelector('.transform').classList.add('scale-100');
      }, 50);

      if (typeof lucide !== 'undefined' && lucide && lucide.createIcons) {
        lucide.createIcons();
      }
    }

    function startUnlockedLevel() {
      closeUnlockModal();
      changeLevel(nextUnlockedLevel);
    }

    function closeUnlockModal() {
      const modal = document.getElementById('modal-level-unlocked');
      modal.querySelector('.transform').classList.remove('scale-100');
      modal.querySelector('.transform').classList.add('scale-95');
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 150);
    }

    // -------------------------------------------------------------
    // ACCESSIBILITY & AUDIO READ ALOUD
    // -------------------------------------------------------------
    function readQuestionAloud() {
      sound.playBeep();
      if (speech.speaking) {
        speech.cancel();
        return;
      }
      const q = currentQuestion();
      const text = q.textParts.map(part => {
        if (typeof part === 'string') return part;
        if (part.isUnknown) return q.unknownText;
        const v = q.values.find(x => x.id === part.valueId);
        return v ? valueText(v) : '';
      }).join('')
        .replace(/Right is \+, left is −\./g, 'Right is positive, left is negative.');
      speech.speak(text);
    }

    // -------------------------------------------------------------
    // MODALS TRIGGERS
    // -------------------------------------------------------------
    function toggleHelpModal(open) {
      sound.playBeep();
      const el = document.getElementById('modal-help');
      if (open) {
        el.classList.remove('hidden');
        const q = currentQuestion();
        selectHelpVariable(q ? q.solveFor : 'F');
      } else {
        el.classList.add('hidden');
      }
    }

    function toggleCalculatorModal(open) {
      const el = document.getElementById('modal-calculator');
      const workspaceEl = document.getElementById('view-workspace');
      if (open) {
        workspaceEl.classList.remove('max-w-4xl');
        workspaceEl.classList.add('max-w-[1280px]');
        el.classList.remove('hidden');
        if (!desmosLoaded || !desmosCalculator) {
          initDesmos();
        } else {
          onDesmosChange();
        }
        if (window.lucide) lucide.createIcons();
      } else {
        if (state && state.currentLevel >= 2) {
          setFeedback(`Notice: Level ${state.currentLevel} needs the Desmos calculator. Reopen it any time with the Calculator button.`, 'info');
        }
        workspaceEl.classList.remove('max-w-[1280px]');
        workspaceEl.classList.add('max-w-4xl');
        el.classList.add('hidden');
      }
    }

    // -------------------------------------------------------------
    // COMPLETION CERTIFICATE & VERIFICATION
    // -------------------------------------------------------------
    function triggerCompletionCertificate() {
      const modal = document.getElementById('modal-completion');
      if (!modal) return;

      document.getElementById('cert-student-name').innerText = state.displayName || state.studentId;
      document.getElementById('cert-student-id').innerText = state.studentId;
      document.getElementById('cert-score').innerText = `${state.bestQuizScore} / ${MIN_QUESTIONS}`;
      document.getElementById('cert-honors-note').innerText = state.honorsOn ? ', including ⭐ Honors problems with signed net force and total system mass' : '';
      document.getElementById('cert-save-title').innerText = state.studentId === 'teacher_preview'
        ? 'Preview Mode (not saved)'
        : 'Score Automatically Saved to Teacher Gradebook';
      document.getElementById('cert-save-badge').classList.toggle('hidden', state.studentId === 'teacher_preview');
      document.getElementById('cert-save-text').innerText = state.studentId === 'teacher_preview'
        ? 'Preview Mode: nothing is saved in preview mode.'
        : 'Your results have been automatically recorded. No screenshot or manual turn-in is required!';

      const dateStr = state.completedAt
        ? new Date(state.completedAt).toLocaleDateString()
        : new Date().toLocaleDateString();
      document.getElementById('cert-date').innerText = dateStr;

      if (!state.certificateId) state.certificateId = makeCertificateId(state.bestQuizScore);
      document.getElementById('cert-token').innerText = state.certificateId;

      modal.classList.remove('hidden');
      sound.playSuccess();
      confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } });
      if (window.lucide) lucide.createIcons();
    }

    function openCompletionCertificateModal() {
      sound.playBeep();
      triggerCompletionCertificate();
    }

    function closeCompletionModal(restartPractice = false) {
      sound.playBeep();
      document.getElementById('modal-completion').classList.add('hidden');
      if (restartPractice) {
        changeLevel(3);
      }
    }

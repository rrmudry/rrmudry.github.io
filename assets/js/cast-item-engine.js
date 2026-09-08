/**
 * CASTItemEngine v2.0 - California Science Test (CAST) Interactive Question Engine
 * Author: CAST Science Studio
 *
 * Implements Technology-Enhanced Items (TEIs) and 3D Performance Tasks:
 * 1. Three-Dimensional NGSS Alignment (DCI, SEP, CCC badges)
 * 2. Phenomena-Based Stimuli (Graphs, Data Tables, Visual Models, Real-World Contexts)
 * 3. Technology-Enhanced Formats:
 *    - Inline Dropdown Menus (Cloze CER Sentences)
 *    - Data Analysis & Mathematical Thinking with Tolerance Checking
 *    - Tap & Drag Categorization / Sequence Matching
 *    - Structured Claim-Evidence-Reasoning (CER) 3-Box Scaffolds
 *    - AI Reasoning Chat ("Defending the Why with AI Physics Mentor")
 * 4. Multi-Step Performance Task Progression, Auto-Scoring & Real-Time Sync
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CASTItemEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // --- Utility Helpers ---
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  class CASTItemEngine {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) {
        throw new Error('[CASTItemEngine] Container not found.');
      }
      this.options = options;
      this.currentStepIndex = 0;
      this.userState = {
        steps: {}
      };
      this.onStateChange = options.onStateChange || function() {};
      this.onSubmit = options.onSubmit || function() {};
      this.onChatSend = options.onChatSend || null;
    }

    /**
     * Load and render a CAST Challenge specification
     */
    loadChallenge(challengeData, savedState = null) {
      this.challenge = challengeData;
      if (savedState && savedState.steps) {
        this.userState = savedState;
      } else {
        this.userState = { steps: {} };
      }
      this.currentStepIndex = 0;
      this.render();
    }

    /**
     * Compile student's answers across earlier steps for the AI's contextual awareness
     */
    getAllAnswers() {
      const summary = {};
      const steps = this.challenge?.steps || [];
      steps.forEach((step, idx) => {
        const key = `step_${idx}`;
        const st = this.userState.steps[key];
        if (st) {
          const stepTitle = step.stepTitle || step.title || `Part ${idx + 1}`;
          if (st.selections) summary[`${stepTitle} (Choices)`] = st.selections;
          if (st.value !== undefined) summary[`${stepTitle} (Calculation)`] = `${st.value} ${step.unit || ''}`.trim();
          if (st.claim || st.evidence || st.reasoning) {
            summary[`${stepTitle} (CER)`] = { claim: st.claim, evidence: st.evidence, reasoning: st.reasoning };
          }
          if (st.placements) summary[`${stepTitle} (Sorting)`] = st.placements;
        }
      });
      return summary;
    }

    render() {
      if (!this.challenge) {
        this.container.innerHTML = '<div class="p-4 text-center text-slate-400">No active CAST task.</div>';
        return;
      }

      const ch = this.challenge;
      const steps = ch.steps || [];
      const currentStep = steps[this.currentStepIndex];
      const stepType = currentStep?.itemType || currentStep?.type || 'unknown';

      // Standards mapping
      const std = ch.standards || {};
      const dci = ch.dci || (typeof std === 'object' ? std.dci : null);
      const sep = ch.sep || (typeof std === 'object' ? std.sep : null);
      const ccc = ch.ccc || (typeof std === 'object' ? std.ccc : null);
      const standardsList = Array.isArray(std) ? std : (ch.standardsList || []);

      let html = `
        <div class="cast-engine-root flex flex-col h-full w-full space-y-4 text-slate-100 font-sans">
          <!-- Top 3D Dimensions Bar -->
          <div class="rounded-2xl bg-slate-900/90 border border-white/10 p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-2.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm flex items-center gap-1">
                <span>🎯</span> CAST 3D TASK
              </span>
              ${standardsList && standardsList.length ? `
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ${standardsList.join(', ')}
                </span>
              ` : ''}
              ${dci ? `
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" title="Disciplinary Core Idea">
                  <strong>DCI:</strong> ${escapeHtml(dci)}
                </span>
              ` : ''}
              ${sep ? `
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" title="Science & Engineering Practice">
                  <strong>SEP:</strong> ${escapeHtml(sep)}
                </span>
              ` : ''}
              ${ccc ? `
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30" title="Crosscutting Concept">
                  <strong>CCC:</strong> ${escapeHtml(ccc)}
                </span>
              ` : ''}
            </div>

            <!-- Multi-Step Progress Tracker -->
            <div class="flex items-center gap-1.5 font-mono text-xs">
              ${steps.map((s, idx) => {
                const isCurrent = idx === this.currentStepIndex;
                const isDone = this.isStepCompleted(s, idx);
                let badgeClass = "bg-slate-800 text-slate-400 border-white/5";
                if (isCurrent) badgeClass = "bg-orange-500 text-white font-bold border-orange-400 shadow-md shadow-orange-500/30 ring-2 ring-orange-500/30";
                else if (isDone) badgeClass = "bg-emerald-950/80 text-emerald-300 border-emerald-500/40";
                return `
                  <button type="button" data-step-btn="${idx}" class="px-2.5 py-1 rounded-lg border text-[11px] transition-all flex items-center gap-1 ${badgeClass}">
                    <span>${isDone ? '✓' : idx + 1}</span>
                    <span class="hidden sm:inline">Part ${idx + 1}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Main Body Grid: Left = Stimulus, Right = Active Step Item -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            <!-- Left Stimulus Panel (5 Cols) -->
            <div class="lg:col-span-5 rounded-2xl bg-slate-900/80 border border-white/10 p-4 sm:p-5 flex flex-col gap-3.5 shadow-lg overflow-hidden">
              <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div class="flex items-center gap-2">
                  <span class="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold border border-cyan-500/30">🔭</span>
                  <h3 class="text-sm font-mono font-bold uppercase tracking-wider text-cyan-300">
                    ${escapeHtml(ch.phenomenon?.title || "Scientific Phenomenon")}
                  </h3>
                </div>
                ${ch.phenomenon?.type === 'graph' ? `
                  <button type="button" id="cast-expand-graph-btn" class="text-xs font-mono text-cyan-400 hover:text-cyan-200 flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-500/30">
                    🔍 Inspect
                  </button>
                ` : ''}
              </div>

              <!-- Phenomenon Context Narrative -->
              ${(ch.phenomenon?.text || ch.phenomenon?.scenario) ? `
                <div class="text-sm sm:text-base text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-white/10">
                  ${escapeHtml(ch.phenomenon.text || ch.phenomenon.scenario)}
                </div>
              ` : ''}

              <!-- Visual Stimulus Container (Graph, Data Table, Image) -->
              <div id="cast-stimulus-container" class="flex-1 min-h-[220px] rounded-xl bg-slate-950/80 border border-white/5 p-3 flex flex-col justify-center items-center overflow-auto relative">
                <!-- Dynamically populated below -->
              </div>
            </div>

            <!-- Right Question & TEI Panel (7 Cols) -->
            <div class="lg:col-span-7 rounded-2xl bg-slate-900/90 border border-white/10 p-4 sm:p-6 flex flex-col justify-between shadow-xl space-y-4">
              <div class="space-y-4">
                <!-- Step Header -->
                <div class="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <span class="text-xs font-mono text-orange-400 font-bold uppercase tracking-wider">
                      Part ${this.currentStepIndex + 1} of ${steps.length}
                    </span>
                    <h2 class="text-base sm:text-lg font-bold text-white mt-0.5">
                      ${escapeHtml(currentStep?.title || currentStep?.stepTitle || `Question ${this.currentStepIndex + 1}`)}
                    </h2>
                  </div>
                  <span class="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10 text-slate-300">
                    ${this.formatItemTypeLabel(stepType)}
                  </span>
                </div>

                <!-- Step Prompt Text -->
                ${currentStep?.prompt ? `
                  <div class="text-sm sm:text-base text-slate-100 leading-relaxed font-medium">
                    ${escapeHtml(currentStep.prompt)}
                  </div>
                ` : ''}

                <!-- Active TEI Interactive Container -->
                <div id="cast-active-tei-container" class="space-y-4 pt-1">
                  <!-- Rendered by specific TEI handlers -->
                </div>

                <!-- Formative Feedback Box -->
                <div id="cast-step-feedback" class="hidden text-sm p-3.5 rounded-xl border transition-all"></div>
              </div>

              <!-- Step Navigation Footer -->
              <div class="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <button type="button" id="cast-prev-step-btn" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs sm:text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed" ${this.currentStepIndex === 0 ? 'disabled' : ''}>
                  ← Previous Part
                </button>

                <div class="flex items-center gap-2">
                  ${this.currentStepIndex < steps.length - 1 ? `
                    <button type="button" id="cast-next-step-btn" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/20 transition-all">
                      Next Part →
                    </button>
                  ` : `
                    <button type="button" id="cast-finish-submit-btn" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5">
                      <span>✓</span> Submit CAST Task
                    </button>
                  `}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      this.container.innerHTML = html;

      // Attach Step Tab Click Listeners
      this.container.querySelectorAll('[data-step-btn]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-step-btn'), 10);
          if (!isNaN(idx) && idx >= 0 && idx < steps.length) {
            this.currentStepIndex = idx;
            this.render();
          }
        });
      });

      // Attach Prev/Next Listeners
      const prevBtn = this.container.querySelector('#cast-prev-step-btn');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.render();
          }
        });
      }

      const nextBtn = this.container.querySelector('#cast-next-step-btn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (this.currentStepIndex < steps.length - 1) {
            this.currentStepIndex++;
            this.render();
          }
        });
      }

      const finishBtn = this.container.querySelector('#cast-finish-submit-btn');
      if (finishBtn) {
        finishBtn.addEventListener('click', () => {
          this.submitAll();
        });
      }

      // Render Stimulus (Graph, Table, Image, or Diagram)
      this.renderStimulus();

      // Render Active TEI Step
      this.renderActiveStep();
    }

    formatItemTypeLabel(type) {
      switch(type) {
        case 'dropdown_cloze':
        case 'cloze_dropdown':
          return 'Cloze Concept Dropdown';
        case 'math_data':
        case 'data_calculation':
          return 'Quantitative Data Analysis';
        case 'drag_drop':
        case 'categorize':
          return 'Classification Sorting';
        case 'cer_scaffold':
        case 'cer':
          return 'Claim-Evidence-Reasoning (CER)';
        case 'ai_reasoning_chat':
        case 'chat_reasoning':
          return 'AI Mentor "Why" Challenge';
        default:
          return 'Technology-Enhanced Item';
      }
    }

    // --- Stimulus Rendering ---
    renderStimulus() {
      const container = this.container.querySelector('#cast-stimulus-container');
      if (!container) return;

      const phen = this.challenge?.phenomenon;
      if (!phen) {
        container.classList.add('hidden');
        return;
      }

      if (phen.type === 'graph' && phen.graphData) {
        container.classList.remove('hidden');
        container.innerHTML = '<div id="cast-stimulus-graph-wrapper" class="w-full h-full min-h-[240px]"></div>';
        const wrapper = container.querySelector('#cast-stimulus-graph-wrapper');
        if (typeof CASTGraphEngine !== 'undefined') {
          new CASTGraphEngine(wrapper, {
            ...phen.graphData,
            theme: 'dark'
          });
        } else {
          wrapper.innerHTML = '<div class="text-sm text-slate-400 p-4">Graph loaded.</div>';
        }
      } else if (phen.type === 'data_table' || phen.dataTable) {
        container.classList.remove('hidden');
        const table = phen.dataTable || {};
        const caption = table.caption || table.title || phen.tableTitle || "";
        const headers = table.headers || [];
        const rawRows = table.rows || [];
        const rows = rawRows.map(row => {
          if (Array.isArray(row)) return row;
          if (row && typeof row === 'object') {
            if (Array.isArray(row.cells)) return row.cells;
            if (Array.isArray(row.cols)) return row.cols;
            const keys = Object.keys(row).sort((a, b) => {
              const na = parseInt(a.replace(/\D/g, ''), 10);
              const nb = parseInt(b.replace(/\D/g, ''), 10);
              if (!isNaN(na) && !isNaN(nb)) return na - nb;
              return a.localeCompare(b);
            });
            return keys.map(k => row[k]);
          }
          return [String(row)];
        });
        let tHtml = `
          <div class="w-full h-full flex flex-col justify-center">
            ${caption ? `<div class="text-xs sm:text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><span>📊</span> ${escapeHtml(caption)}</div>` : ''}
            <div class="w-full overflow-x-auto rounded-xl border border-white/10 shadow-md">
              <table class="w-full text-left border-collapse">
                <thead class="bg-slate-800 text-cyan-300 font-mono text-xs sm:text-sm">
                  <tr>
                    ${headers.map(h => `<th class="px-3.5 py-2.5 border-b border-white/10 font-bold">${escapeHtml(h)}</th>`).join('')}
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 bg-slate-950/80 text-sm sm:text-base text-slate-100 font-sans">
                  ${rows.map((row, rIdx) => `
                    <tr class="${rIdx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-950/60'} hover:bg-cyan-950/30 transition-colors">
                      ${row.map(cell => `<td class="px-3.5 py-2.5 font-medium">${escapeHtml(String(cell))}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
        container.innerHTML = tHtml;
      } else if (phen.imageUrl || phen.type === 'image') {
        container.classList.remove('hidden');
        container.innerHTML = `
          <div class="w-full h-full flex flex-col items-center justify-center p-1">
            <img src="${escapeHtml(phen.imageUrl)}" alt="${escapeHtml(phen.title || 'Phenomenon')}" class="max-h-[260px] max-w-full rounded-lg object-contain shadow-md border border-white/10">
          </div>
        `;
      } else {
        // Prevent duplicate text: if no graph, table, or image is provided, do not re-render phenomenon text
        container.classList.add('hidden');
      }
    }

    // --- Active Step Router ---
    renderActiveStep() {
      const container = this.container.querySelector('#cast-active-tei-container');
      if (!container) return;

      const step = this.challenge?.steps?.[this.currentStepIndex];
      if (!step) {
        container.innerHTML = '<div class="text-slate-400">Step not found.</div>';
        return;
      }

      const stepKey = `step_${this.currentStepIndex}`;
      const stepState = this.userState.steps[stepKey] || {};
      const type = step.itemType || step.type;

      if (type === 'dropdown_cloze' || type === 'cloze_dropdown') {
        this.renderDropdownCloze(step, container, stepState, stepKey);
      } else if (type === 'math_data' || type === 'data_calculation') {
        this.renderMathData(step, container, stepState, stepKey);
      } else if (type === 'drag_drop' || type === 'categorize') {
        this.renderDragDrop(step, container, stepState, stepKey);
      } else if (type === 'cer_scaffold' || type === 'cer') {
        this.renderCERScaffold(step, container, stepState, stepKey);
      } else if (type === 'ai_reasoning_chat' || type === 'concept_chat' || type === 'chat_reasoning') {
        this.renderAIReasoningChat(step, container, stepState, stepKey);
      } else {
        container.innerHTML = `<div class="text-slate-400 text-xs">Standard question type: ${escapeHtml(type)}</div>`;
      }
    }

    // --- Format 1: Inline Dropdown Menus (Cloze Concept Selection) ---
    renderDropdownCloze(step, container, stepState, stepKey) {
      const template = step.template || step.text || "";
      const dropdowns = step.dropdowns || step.blanks || {};
      const selections = stepState.selections || {};

      // Replace {key} or [key] with <select>
      let renderedHtml = template.replace(/\{([a-zA-Z0-9_-]+)\}|\[([a-zA-Z0-9_-]+)\]/g, (match, k1, k2) => {
        const key = k1 || k2;
        const dd = dropdowns[key];
        if (!dd) return match;
        const currentVal = selections[key] || "";
        const optionsHtml = (dd.options || []).map(opt => `
          <option value="${escapeHtml(opt)}" ${opt === currentVal ? 'selected' : ''}>${escapeHtml(opt)}</option>
        `).join('');

        return `
          <span class="inline-block my-1 mx-1">
            <select data-cloze-key="${key}" class="px-3 py-1.5 rounded-xl bg-slate-900 border-2 border-orange-500/60 text-orange-200 text-sm sm:text-base font-semibold font-sans focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-md cursor-pointer hover:border-orange-400 transition-colors">
              <option value="">-- select --</option>
              ${optionsHtml}
            </select>
          </span>
        `;
      });

      container.innerHTML = `
        <div class="p-5 sm:p-6 rounded-2xl bg-slate-950/70 border border-orange-500/30 leading-loose text-base sm:text-lg text-slate-100 shadow-inner font-normal">
          ${renderedHtml}
        </div>
        <div class="flex items-center justify-between gap-3 pt-2">
          <div class="text-xs sm:text-sm text-slate-300 font-sans">
            Select all dropdown terms to complete the scientific explanation.
          </div>
          <button type="button" id="cast-check-cloze-btn" class="px-4 py-2 rounded-xl bg-orange-600/30 hover:bg-orange-600/50 text-orange-200 border border-orange-500/50 text-xs sm:text-sm font-bold font-sans transition-all shadow-sm">
            Check Statements
          </button>
        </div>
      `;

      // Attach Change Listeners
      container.querySelectorAll('[data-cloze-key]').forEach(select => {
        select.addEventListener('change', () => {
          const key = select.getAttribute('data-cloze-key');
          if (!this.userState.steps[stepKey]) this.userState.steps[stepKey] = {};
          if (!this.userState.steps[stepKey].selections) this.userState.steps[stepKey].selections = {};
          this.userState.steps[stepKey].selections[key] = select.value;
          this.onStateChange(this.userState);
        });
      });

      // Check Button
      const checkBtn = container.querySelector('#cast-check-cloze-btn');
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          this.evaluateDropdownCloze(step, stepKey);
        });
      }
    }

    evaluateDropdownCloze(step, stepKey) {
      const selections = this.userState.steps[stepKey]?.selections || {};
      const dropdowns = step.dropdowns || step.blanks || {};
      let total = 0;
      let correct = 0;

      Object.entries(dropdowns).forEach(([key, dd]) => {
        total++;
        const chosen = selections[key] || "";
        const selEl = this.container.querySelector(`[data-cloze-key="${key}"]`);
        if (chosen.trim().toLowerCase() === String(dd.correct || '').trim().toLowerCase()) {
          correct++;
          if (selEl) {
            selEl.classList.remove('border-orange-500/50', 'border-red-500');
            selEl.classList.add('border-emerald-500', 'bg-emerald-950/60', 'text-emerald-200');
          }
        } else {
          if (selEl) {
            selEl.classList.remove('border-orange-500/50', 'border-emerald-500');
            selEl.classList.add('border-red-500', 'bg-red-950/50', 'text-red-200');
          }
        }
      });

      const fb = this.container.querySelector('#cast-step-feedback');
      if (fb) {
        fb.classList.remove('hidden', 'bg-emerald-950/80', 'border-emerald-500/50', 'text-emerald-300', 'bg-amber-950/80', 'border-amber-500/50', 'text-amber-300');
        if (correct === total) {
          fb.classList.add('bg-emerald-950/80', 'border-emerald-500/50', 'text-emerald-300');
          fb.innerHTML = `<strong>✓ Excellent 3D Reasoning!</strong> All ${total} statements are accurate and scientifically consistent.`;
        } else {
          fb.classList.add('bg-amber-950/80', 'border-amber-500/50', 'text-amber-300');
          fb.innerHTML = `<strong>Feedback (${correct}/${total} correct):</strong> Review the highlighted dropdowns. Use the phenomenon graph and Crosscutting Concept relationships to refine your choices.`;
        }
      }
    }

    // --- Format 2: Data Analysis & Mathematical Calculations ---
    renderMathData(step, container, stepState, stepKey) {
      const currentVal = (stepState.value !== undefined) ? stepState.value : '';
      const formulaHint = step.formulaHint || step.hint;
      const unit = step.unit || '';

      container.innerHTML = `
        <div class="p-5 sm:p-6 rounded-2xl bg-slate-950/70 border border-cyan-500/30 space-y-4 shadow-inner">
          ${formulaHint ? `
            <div class="flex items-center gap-2 text-xs sm:text-sm font-mono bg-cyan-950/50 text-cyan-200 p-3 rounded-xl border border-cyan-500/30">
              <span class="font-bold text-cyan-400">📐 Formula Reference:</span>
              <span>${escapeHtml(formulaHint)}</span>
            </div>
          ` : ''}

          <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <div class="flex-1 flex items-center gap-2.5 bg-slate-900 border-2 border-white/15 rounded-xl px-4 py-3 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/30">
              <span class="text-sm sm:text-base text-slate-300 font-medium font-sans">${escapeHtml(step.inputLabel || "Calculated Value:")}</span>
              <input type="number" step="any" id="cast-math-input" value="${escapeHtml(String(currentVal))}" placeholder="e.g. 0.40" class="flex-1 bg-transparent text-white font-mono text-base sm:text-lg font-bold focus:outline-none">
              ${unit ? `
                <span class="text-sm sm:text-base font-mono font-bold px-3 py-1 rounded-lg bg-slate-800 text-cyan-300 border border-white/15">
                  ${escapeHtml(unit)}
                </span>
              ` : ''}
            </div>

            <button type="button" id="cast-check-math-btn" class="px-5 py-3 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/50 text-sm font-bold font-sans transition-all shadow-sm">
              Verify Value
            </button>
          </div>
        </div>
      `;

      const inputEl = container.querySelector('#cast-math-input');
      if (inputEl) {
        inputEl.addEventListener('input', () => {
          if (!this.userState.steps[stepKey]) this.userState.steps[stepKey] = {};
          this.userState.steps[stepKey].value = parseFloat(inputEl.value);
          this.onStateChange(this.userState);
        });
      }

      const checkBtn = container.querySelector('#cast-check-math-btn');
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          this.evaluateMathData(step, stepKey);
        });
      }
    }

    evaluateMathData(step, stepKey) {
      const inputEl = this.container.querySelector('#cast-math-input');
      const val = parseFloat(inputEl ? inputEl.value : NaN);
      const target = (step.targetValue !== undefined) ? step.targetValue : step.target;
      const tol = step.tolerance !== undefined ? step.tolerance : 0.1;
      const fb = this.container.querySelector('#cast-step-feedback');

      if (isNaN(val)) {
        if (fb) {
          fb.classList.remove('hidden');
          fb.className = 'text-xs p-3 rounded-xl border bg-amber-950/80 border-amber-500/50 text-amber-300';
          fb.innerText = 'Please enter a numerical calculation from your data analysis.';
        }
        return;
      }

      const isCorrect = Math.abs(val - target) <= tol;
      if (fb) {
        fb.classList.remove('hidden');
        if (isCorrect) {
          fb.className = 'text-xs p-3 rounded-xl border bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
          fb.innerHTML = `<strong>✓ Accurate Calculation:</strong> ${escapeHtml(step.feedback?.correct || `Your calculated value of ${val} ${step.unit || ''} matches the data model within acceptable tolerance.`)}`;
        } else if (val > target + tol) {
          fb.className = 'text-xs p-3 rounded-xl border bg-red-950/80 border-red-500/50 text-red-300';
          fb.innerHTML = `<strong>Calibration Hint:</strong> ${escapeHtml(step.feedback?.tooHigh || `Your reading (${val}) is slightly higher than expected. Re-check your initial and final coordinates on the graph.`)}`;
        } else {
          fb.className = 'text-xs p-3 rounded-xl border bg-red-950/80 border-red-500/50 text-red-300';
          fb.innerHTML = `<strong>Calibration Hint:</strong> ${escapeHtml(step.feedback?.tooLow || `Your reading (${val}) is slightly lower than expected. Double check your rate of change interval.`)}`;
        }
      }
    }

    // --- Format 3: Drag-and-Drop / Tap-to-Place Categorization ---
    renderDragDrop(step, container, stepState, stepKey) {
      const categories = step.categories || [];
      const items = step.items || [];
      const placements = stepState.placements || {}; // itemId -> catId

      container.innerHTML = `
        <div class="space-y-3">
          <!-- Unassigned Bank -->
          <div class="p-3 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
            <span class="text-[10px] font-mono uppercase text-slate-400 font-bold">Unassigned Items (Tap or drag to categorize):</span>
            <div id="cast-dd-bank" class="flex flex-wrap gap-2 min-h-[44px] p-2 rounded-lg bg-slate-900 border border-dashed border-white/10">
              ${items.filter(it => !placements[it.id]).map(it => `
                <div data-dd-item="${it.id}" draggable="true" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/15 text-xs text-white cursor-pointer select-none font-medium shadow-sm transition-all hover:scale-105 active:scale-95">
                  ${escapeHtml(it.text)}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Category Target Zones -->
          <div class="grid grid-cols-1 sm:grid-cols-${Math.min(categories.length, 3)} gap-2.5">
            ${categories.map(cat => `
              <div data-dd-cat="${cat.id}" class="rounded-xl bg-slate-950/80 border border-indigo-500/30 p-3 space-y-2 flex flex-col justify-between min-h-[110px]">
                <div class="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span class="text-xs font-mono font-bold text-indigo-300">${escapeHtml(cat.title)}</span>
                  <span class="text-[9px] text-slate-500 font-mono">Drop here</span>
                </div>
                <div class="flex flex-wrap gap-1.5 min-h-[50px] p-1.5 rounded-lg bg-slate-900/60 border border-dashed border-white/10">
                  ${items.filter(it => placements[it.id] === cat.id).map(it => `
                    <div data-dd-item="${it.id}" class="px-2.5 py-1 rounded bg-indigo-900/70 border border-indigo-400/40 text-[11px] text-indigo-200 cursor-pointer font-medium hover:bg-indigo-800/80">
                      ${escapeHtml(it.text)} ✕
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="flex justify-end pt-1">
            <button type="button" id="cast-check-dd-btn" class="px-3.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold font-mono transition-all">
              Check Placements
            </button>
          </div>
        </div>
      `;

      // Tap-to-Place interactions
      let selectedItemId = null;
      container.querySelectorAll('[data-dd-item]').forEach(el => {
        el.addEventListener('click', () => {
          const itemId = el.getAttribute('data-dd-item');
          if (placements[itemId]) {
            delete placements[itemId];
            this.userState.steps[stepKey] = { placements };
            this.renderDragDrop(step, container, this.userState.steps[stepKey], stepKey);
            this.onStateChange(this.userState);
          } else {
            selectedItemId = itemId;
            container.querySelectorAll('[data-dd-item]').forEach(i => i.classList.remove('ring-2', 'ring-orange-400'));
            el.classList.add('ring-2', 'ring-orange-400');
          }
        });
      });

      container.querySelectorAll('[data-dd-cat]').forEach(catEl => {
        catEl.addEventListener('click', () => {
          const catId = catEl.getAttribute('data-dd-cat');
          if (selectedItemId) {
            placements[selectedItemId] = catId;
            selectedItemId = null;
            this.userState.steps[stepKey] = { placements };
            this.renderDragDrop(step, container, this.userState.steps[stepKey], stepKey);
            this.onStateChange(this.userState);
          }
        });
      });

      const checkBtn = container.querySelector('#cast-check-dd-btn');
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          this.evaluateDragDrop(step, stepKey);
        });
      }
    }

    evaluateDragDrop(step, stepKey) {
      const placements = this.userState.steps[stepKey]?.placements || {};
      const items = step.items || [];
      let correct = 0;
      let total = items.length;

      items.forEach(it => {
        if (placements[it.id] === it.correctCat) {
          correct++;
        }
      });

      const fb = this.container.querySelector('#cast-step-feedback');
      if (fb) {
        fb.classList.remove('hidden');
        if (correct === total) {
          fb.className = 'text-xs p-3 rounded-xl border bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
          fb.innerHTML = `<strong>✓ Perfect Classification!</strong> All items successfully placed into their correct scientific categories.`;
        } else {
          fb.className = 'text-xs p-3 rounded-xl border bg-amber-950/80 border-amber-500/50 text-amber-300';
          fb.innerHTML = `<strong>Placements (${correct}/${total} correct):</strong> Some items do not match their intended categories. Re-examine the criteria and try again.`;
        }
      }
    }

    // --- Format 4: Structured CER 3-Box Scaffold ---
    renderCERScaffold(step, container, stepState, stepKey) {
      const claimVal = stepState.claim || '';
      const evidenceVal = stepState.evidence || '';
      const reasoningVal = stepState.reasoning || '';
      const scaffold = step.scaffold || {};

      container.innerHTML = `
        <div class="space-y-3.5">
          <!-- Claim Box -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label for="cast-cer-claim" class="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>1️⃣</span> Claim (Direct Scientific Answer)
              </label>
              <span class="text-[10px] text-slate-400 font-mono" id="claim-word-count">0 words</span>
            </div>
            <textarea id="cast-cer-claim" placeholder="${escapeHtml(scaffold.claimPlaceholder || "State your direct, testable answer to the phenomenon prompt...")}" class="w-full min-h-[55px] rounded-xl bg-slate-950/70 border border-amber-500/30 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans resize-y">${escapeHtml(claimVal)}</textarea>
          </div>

          <!-- Evidence Box -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label for="cast-cer-evidence" class="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>2️⃣</span> Evidence (Specific Data & Observations)
              </label>
              <span class="text-[10px] text-slate-400 font-mono" id="evidence-word-count">0 words</span>
            </div>
            <textarea id="cast-cer-evidence" placeholder="${escapeHtml(scaffold.evidencePlaceholder || "Cite exact numerical points, graph coordinates, or experimental observations...")}" class="w-full min-h-[60px] rounded-xl bg-slate-950/70 border border-cyan-500/30 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans resize-y">${escapeHtml(evidenceVal)}</textarea>
          </div>

          <!-- Reasoning Box -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label for="cast-cer-reasoning" class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>3️⃣</span> Scientific Reasoning (Physical Laws & Mechanisms)
              </label>
              <span class="text-[10px] text-slate-400 font-mono" id="reasoning-word-count">0 words</span>
            </div>
            <textarea id="cast-cer-reasoning" placeholder="${escapeHtml(scaffold.reasoningPlaceholder || "Explain WHY the evidence supports your claim using physics principles (e.g. Newton's Laws, conservation)...")}" class="w-full min-h-[70px] rounded-xl bg-slate-950/70 border border-emerald-500/30 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-sans resize-y">${escapeHtml(reasoningVal)}</textarea>
          </div>
        </div>
      `;

      const updateCounts = () => {
        const c = container.querySelector('#cast-cer-claim')?.value || '';
        const e = container.querySelector('#cast-cer-evidence')?.value || '';
        const r = container.querySelector('#cast-cer-reasoning')?.value || '';

        const countWords = (text) => text.trim() ? text.trim().split(/\s+/).length : 0;
        const cEl = container.querySelector('#claim-word-count');
        const eEl = container.querySelector('#evidence-word-count');
        const rEl = container.querySelector('#reasoning-word-count');
        if (cEl) cEl.innerText = `${countWords(c)} words`;
        if (eEl) eEl.innerText = `${countWords(e)} words`;
        if (rEl) rEl.innerText = `${countWords(r)} words`;

        this.userState.steps[stepKey] = {
          claim: c,
          evidence: e,
          reasoning: r,
          fullResponse: `[CLAIM]: ${c}\n[EVIDENCE]: ${e}\n[REASONING]: ${r}`
        };
        this.onStateChange(this.userState);
      };

      ['cast-cer-claim', 'cast-cer-evidence', 'cast-cer-reasoning'].forEach(id => {
        const el = container.querySelector(`#${id}`);
        if (el) el.addEventListener('input', updateCounts);
      });

      updateCounts();
    }

    // --- Format 5: AI Reasoning Chat ("Defending the Why with AI Mentor") ---
    renderAIReasoningChat(step, container, stepState, stepKey) {
      if (!stepState.chatMessages) {
        stepState.chatMessages = [];
      }

      // Context summary of previous choices
      const allAnswers = this.getAllAnswers();
      const answerEntries = Object.entries(allAnswers);
      let contextSummaryText = "";
      if (answerEntries.length > 0) {
        contextSummaryText = answerEntries.map(([k, v]) => {
          if (typeof v === 'object') {
            return `${k}: ${Object.entries(v).map(([subK, subV]) => `${subK}=${typeof subV === 'object' ? JSON.stringify(subV) : subV}`).join(', ')}`;
          }
          return `${k}: ${v}`;
        }).join(' | ');
      }

      // Opening mentor message
      if (stepState.chatMessages.length === 0) {
        let initialMsg = step.openingPrompt || step.openingMessage;
        if (!initialMsg) {
          if (contextSummaryText) {
            initialMsg = `Hi! I saw your work on the earlier parts (${contextSummaryText}). In your own words, **why** do you think the answer you selected/calculated is scientifically correct? What specific evidence from the phenomenon convinced you?`;
          } else {
            initialMsg = `Hi! Look closely at the scientific phenomenon on the left. In your own words, what is happening here, and **why** does the physical system behave this way?`;
          }
        }
        stepState.chatMessages.push({
          role: 'model',
          text: initialMsg,
          timestamp: new Date()
        });
        if (!this.userState.steps[stepKey]) this.userState.steps[stepKey] = {};
        this.userState.steps[stepKey].chatMessages = stepState.chatMessages;
        this.onStateChange(this.userState);
      }

      const quickChips = step.quickChips || [
        "Because the slope is constant",
        "The forces balance out to 0 N",
        "Based on the distance formula",
        "Can you give me a hint on why?"
      ];

      const userMessagesCount = stepState.chatMessages.filter(m => m.role === 'user').length;
      const minTurns = step.minTurns || 1;
      const isMet = userMessagesCount >= minTurns;

      let chatHtml = `
        <div class="flex flex-col h-[380px] rounded-2xl bg-slate-950/70 border border-cyan-500/30 overflow-hidden shadow-inner">
          <!-- Chat Header -->
          <div class="px-4 py-2.5 bg-slate-900 border-b border-white/10 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs">🤖</span>
              <div>
                <span class="text-xs font-bold text-cyan-300 font-mono block leading-none">Physics AI Mentor</span>
                <span class="text-[9px] text-slate-400 font-mono">Exploring the "Why" & Challenging Your Reasoning</span>
              </div>
            </div>
            <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full ${isMet ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'}">
              ${isMet ? '✓ Discussion Complete' : `${userMessagesCount}/${minTurns} Replies`}
            </span>
          </div>

          <!-- Chat Feed -->
          <div id="cast-chat-messages-feed" class="flex-1 p-4 overflow-y-auto space-y-3.5 text-sm sm:text-base font-sans">
            ${stepState.chatMessages.map(msg => {
              const isUser = msg.role === 'user';
              const bubbleClass = isUser 
                ? 'bg-orange-600/20 text-orange-100 border-orange-500/30 ml-auto' 
                : 'bg-cyan-950/40 text-cyan-100 border-cyan-500/30 mr-auto';
              const roleTag = isUser ? 'You (Student)' : 'AI Mentor';
              const tagColor = isUser ? 'text-orange-400' : 'text-cyan-400';
              return `
                <div class="flex flex-col max-w-[85%] ${isUser ? 'items-end ml-auto' : 'items-start mr-auto'} animate-in fade-in duration-150">
                  <span class="text-[11px] font-mono font-bold ${tagColor} mb-1 px-1 uppercase tracking-wider">${roleTag}</span>
                  <div class="p-3.5 rounded-2xl border text-sm sm:text-base leading-relaxed ${bubbleClass}">
                    ${escapeHtml(msg.text || (msg.parts && msg.parts[0] ? msg.parts[0].text : ''))}
                  </div>
                </div>
              `;
            }).join('')}
            <div id="cast-chat-typing-dot" class="hidden flex items-center gap-1.5 text-xs sm:text-sm text-cyan-400 italic p-1.5 animate-pulse">
              <span>🤖</span> AI Mentor is thinking...
            </div>
          </div>

          <!-- Quick Thought Chips -->
          <div class="px-3 py-2 bg-slate-900/60 border-t border-white/5 flex gap-2 overflow-x-auto">
            ${quickChips.map(chip => `
              <button type="button" data-cast-chip="${escapeHtml(chip)}" class="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs sm:text-sm text-cyan-200 font-sans transition-all">
                ${escapeHtml(chip)}
              </button>
            `).join('')}
          </div>

          <!-- Input Bar -->
          <form id="cast-chat-input-form" class="p-3 bg-slate-900 border-t border-white/10 flex items-center gap-2.5">
            <input type="text" id="cast-chat-text-input" placeholder="Explain your thinking / why you chose that answer..." class="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans">
            <button type="submit" id="cast-chat-send-submit" class="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold font-sans transition-all shadow-md flex items-center gap-1.5">
              <span>Send</span> <span>➤</span>
            </button>
          </form>
        </div>
      `;

      container.innerHTML = chatHtml;

      // Auto-scroll feed to bottom
      const feed = container.querySelector('#cast-chat-messages-feed');
      if (feed) feed.scrollTop = feed.scrollHeight;

      // Quick Chips Handler
      container.querySelectorAll('[data-cast-chip]').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.getAttribute('data-cast-chip');
          const input = container.querySelector('#cast-chat-text-input');
          if (input) {
            input.value = text;
            input.focus();
          }
        });
      });

      // Form Submit Handler
      const form = container.querySelector('#cast-chat-input-form');
      const input = container.querySelector('#cast-chat-text-input');
      if (form && input) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const userText = input.value.trim();
          if (!userText) return;
          input.value = "";

          // Append student turn
          stepState.chatMessages.push({
            role: 'user',
            text: userText,
            timestamp: new Date()
          });
          if (!this.userState.steps[stepKey]) this.userState.steps[stepKey] = {};
          this.userState.steps[stepKey].chatMessages = stepState.chatMessages;
          this.onStateChange(this.userState);
          this.renderAIReasoningChat(step, container, stepState, stepKey);

          // Typing indicator
          const typingDot = container.querySelector('#cast-chat-typing-dot');
          if (typingDot) typingDot.classList.remove('hidden');

          // Delegate to host callback (Bell-Ringer/index.html)
          if (typeof this.options.onChatSend === 'function') {
            try {
              const reply = await this.options.onChatSend({
                message: userText,
                messages: stepState.chatMessages,
                step: step,
                allAnswers: this.getAllAnswers(),
                phenomenon: this.challenge?.phenomenon
              });

              const replyText = typeof reply === 'string' ? reply : (reply?.text || reply?.message || "Great explanation! Keep expanding on that evidence.");
              stepState.chatMessages.push({
                role: 'model',
                text: replyText,
                timestamp: new Date()
              });
              this.userState.steps[stepKey].chatMessages = stepState.chatMessages;
              this.onStateChange(this.userState);
              this.renderAIReasoningChat(step, container, stepState, stepKey);
            } catch (err) {
              console.error("AI reasoning chat error:", err);
              if (typingDot) typingDot.classList.add('hidden');
            }
          } else {
            // Local fallback if no host callback attached
            setTimeout(() => {
              stepState.chatMessages.push({
                role: 'model',
                text: "Thank you for explaining your reasoning! How does that connect to the physical laws of motion?",
                timestamp: new Date()
              });
              this.userState.steps[stepKey].chatMessages = stepState.chatMessages;
              this.onStateChange(this.userState);
              this.renderAIReasoningChat(step, container, stepState, stepKey);
            }, 600);
          }
        });
      }
    }

    isStepCompleted(step, index) {
      const stepKey = `step_${index}`;
      const state = this.userState.steps[stepKey];
      if (!state) return false;

      const type = step.itemType || step.type;
      switch(type) {
        case 'dropdown_cloze':
        case 'cloze_dropdown':
          const keys = Object.keys(step.dropdowns || step.blanks || {});
          return keys.length > 0 && keys.every(k => state.selections && state.selections[k]);
        case 'math_data':
        case 'data_calculation':
          return state.value !== undefined && !isNaN(state.value);
        case 'drag_drop':
        case 'categorize':
          const items = step.items || [];
          return items.length > 0 && items.every(it => state.placements && state.placements[it.id]);
        case 'cer_scaffold':
        case 'cer':
          return !!(state.claim && state.evidence && state.reasoning);
        case 'ai_reasoning_chat':
        case 'chat_reasoning':
          return !!(state.chatMessages && state.chatMessages.filter(m => m.role === 'user').length >= (step.minTurns || 1));
        default:
          return false;
      }
    }

    submitAll() {
      const steps = this.challenge?.steps || [];
      const summary = {
        challengeTitle: this.challenge.title,
        standards: this.challenge.standards,
        dci: this.challenge.dci,
        sep: this.challenge.sep,
        ccc: this.challenge.ccc,
        completedSteps: 0,
        totalSteps: steps.length,
        stepResults: []
      };

      steps.forEach((s, idx) => {
        const isDone = this.isStepCompleted(s, idx);
        if (isDone) summary.completedSteps++;
        summary.stepResults.push({
          stepNumber: idx + 1,
          title: s.stepTitle || s.title || `Part ${idx + 1}`,
          itemType: s.itemType || s.type,
          isCompleted: isDone,
          state: this.userState.steps[`step_${idx}`] || {}
        });
      });

      this.onSubmit(summary, this.userState);
    }
  }

  return CASTItemEngine;
}));

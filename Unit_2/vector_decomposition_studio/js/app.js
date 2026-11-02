// Vector Decomposition Studio — task engine, Practice Gym, Mastery Check, scoring
// One task on screen at a time. Correct answers advance; a wrong answer explains why and then
// loads a new scenario (lab data is kept, since re-measuring would erase the student's work).
// Grade (10 pts, best ever, never lowered): 6 pts shared across the parts, earned step by step,
// + 4 pts × best Mastery Check. A student who stops partway keeps credit for every finished step.
// Modeled on Unit_2/horizontal_projectile_workbench/js/app.js.

const VDApp = (() => {
  const STATE_VERSION = 1;
  const QUIZ_POINTS = 4, PART_POINTS = 6;
  const CERT_PERCENT = 75;   // Mastery Check score needed, on top of finishing every part, to earn the certificate
  const $ = id => document.getElementById(id);
  const E = () => window.Engine;
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  let state = null, cloud = null, profile = { guest: true };
  let view = 'teacher';
  let labAngle = 30;
  let drafts = {};        // inputs typed but not yet checked (survive re-render)
  let fb = null;          // feedback for the current task
  let hintsOpen = 0;
  let gymQ = null;        // current gym question
  let honorsQ = null;
  let mcOrder = null;     // shuffled display order of the current multiple-choice task

  function newState() {
    return {
      v: STATE_VERSION, current: 'p1', done: {}, idx: {}, sc: {},
      seen: {},   // per part: { far: furthest task reached, sc: { taskIndex: that page's numbers } }
      data: null,
      gym: { streak: 0, best: 0, right: 0, total: 0, skills: {}, focus: null },
      honors: { i: 0 },
      quiz: { best: 0, attempts: [], cur: null, last: null },
      mistakes: {}, bestPoints: 0, savedAt: 0
    };
  }
  const validState = st => !!(st && st.v === STATE_VERSION && st.done && st.quiz && st.gym && typeof st.current === 'string');

  // ---------- Who sees what ----------
  const isTeacher = () => !!profile.teacher;
  const teacherView = () => isTeacher() && view === 'teacher';
  const honorsOn = () => !!profile.honorsRequired || (isTeacher() && (view === 'teacher' || view === 'honors'));
  // Periods 1–3: extra support with no badge (worked rows, first hint open, calculations split into boxes)
  const supportOn = () => !honorsOn() && (!!profile.support || (isTeacher() && view === 'support'));
  const testing = () => teacherView() || !!profile.preview;
  const available = () => PARTS.filter(p => !p.honors || honorsOn());
  const part = () => PARTS.find(p => p.id === state.current) || PARTS[0];
  const unlocked = id => {
    if (testing()) return true;
    const list = available();
    const i = list.findIndex(p => p.id === id);
    return i >= 0 && list.slice(0, i).every(p => state.done[p.id]);
  };
  const gymGoal = () => (supportOn() ? 4 : honorsOn() ? 6 : 5);

  // ---------- Score ----------
  // How much of a part is finished, 0 to 1: pages passed, the best Gym streak, or Honors challenges solved
  function partProgress(st, p) {
    if (st.done[p.id]) return 1;
    if (p.kind === 'gym') return Math.min(1, (st.gym.best || 0) / gymGoal());
    if (p.kind === 'honorsSet') return Math.min(1, (st.honors.i || 0) / p.kinds.length);
    const seen = st.seen && st.seen[p.id];
    return seen ? Math.min(1, seen.far / tasksOf(p).length) : 0;
  }

  function scoreState(st) {
    const required = PARTS.filter(p => p.weight > 0 && (!p.honors || profile.honorsRequired));
    const total = required.reduce((a, p) => a + p.weight, 0);
    const partPts = PART_POINTS * required.reduce((a, p) => a + p.weight * partProgress(st, p), 0) / total;
    const now = Math.round((partPts + QUIZ_POINTS * (st.quiz.best || 0) / 100) * 10) / 10;
    st.bestPoints = Math.max(st.bestPoints || 0, now);
    const last = st.quiz.attempts[st.quiz.attempts.length - 1];
    return {
      points: st.bestPoints,
      percentage: Math.round(st.bestPoints * 10),
      done: PARTS.filter(p => st.done[p.id]).map(p => p.id),
      progress: Object.fromEntries(required.map(p => [p.id, Math.round(partProgress(st, p) * 100)])),
      required: required.map(p => p.id).concat('quiz'),
      honors: !!profile.honorsRequired,
      quizBest: st.quiz.best || 0,
      quizHistory: st.quiz.attempts.map(a => a.pct),
      skills: last ? last.skills : {},
      gym: { best: st.gym.best, right: st.gym.right, total: st.gym.total, skills: st.gym.skills },
      mistakes: st.mistakes || {},
      calcUnavailable: !!st.calcUnavailable,
      cert: st.cert || null
    };
  }

  function save() {
    if (!cloud) return;
    scoreState(state);
    cloud.queueSave(true);
  }

  function noteMistake(id) {
    if (!id) return;
    state.mistakes[id] = (state.mistakes[id] || 0) + 1;
  }

  // ---------- Context for lesson content ----------
  function ctx() {
    return {
      sc: state.sc[state.current] || {},
      data: state.data || { v0: 20, rows: [] },
      support: supportOn(), honors: honorsOn(), angle: labAngle,
      answered: !!(fb && fb.ok)
    };
  }

  function ensureLab() {
    if (state.data) return;
    const v0 = E().pick([16, 18, 20]);
    state.data = { v0, thing: Math.floor(Math.random() * E().THINGS.length), rows: LAB.ANGLES.map(th => ({ th, x: null, y: null })) };
  }

  // noSupport tasks are left out for Periods 1–3 (no label; those students simply never see them)
  const tasksOf = p => (p.tasks || []).filter(t => !(t.noSupport && supportOn()));
  const idx = () => state.idx[state.current] || 0;
  const task = () => tasksOf(part())[idx()];

  function seenPart() {
    state.seen = state.seen || {};
    state.seen[state.current] = state.seen[state.current] || { far: 0, sc: {} };
    return state.seen[state.current];
  }

  // restore = moving with Back/forward: show the page with the numbers it had before
  function enterTask(restore) {
    const t = task();
    fb = null; drafts = {};
    hintsOpen = 0;
    mcOrder = null;
    if (!t) return;
    const seen = seenPart();
    const saved = restore ? seen.sc[idx()] : null;
    if (saved) state.sc[state.current] = JSON.parse(JSON.stringify(saved));
    else if (t.fresh) state.sc[state.current] = t.fresh(state.sc[state.current]);
    if (state.sc[state.current]) seen.sc[idx()] = JSON.parse(JSON.stringify(state.sc[state.current]));
    seen.far = Math.max(seen.far, idx());
    if (restore && t.type === 'measure') labAngle = t.th;
    if (part().lab || part().needsData) ensureLab();
    if (t.type === 'measure' && supportOn() && (t.th === 0 || t.th === 15)) fillRow(t.th);
    if (supportOn() && t.hints) hintsOpen = 1;
    if (desmos && desmos.setBlank) desmos.setBlank();
  }

  // Periods 1–3: the first rows are worked examples, already recorded
  function fillRow(th) {
    const row = state.data.rows.find(r => r.th === th);
    if (row.x !== null) return;
    const tr = LAB.trueRow(state.data.v0, th);
    row.x = Math.round(tr.x * 2) / 2;
    row.y = Math.round(tr.y * 2) / 2;
    row.worked = true;
  }

  function goPart(id) {
    if (!unlocked(id)) return;
    state.current = id;
    if (id === 'gym' && !gymQ) nextGym();
    if (id === 'honors') nextHonors();
    if (part().tasks && task()) {
      // Coming back mid-scenario: restart from the scenario's first task
      if (!state.sc[id]) restartScenario();
      else enterTask();
    }
    save();
    render();
  }

  // Back up to the task that starts this scenario and load new numbers
  function restartScenario() {
    const list = tasksOf(part());
    let i = idx();
    while (i >= 0 && !list[i].fresh) i--;
    if (i >= 0) state.idx[state.current] = i;
    enterTask();
  }

  function completePart() {
    const first = !state.done[state.current];
    state.done[state.current] = true;
    save();
    fb = null;
    render();
    if (first && window.soundFx) soundFx.playFanfare();
  }

  // ---------- Back / forward through pages already reached ----------
  function canGoBack() {
    if (state.current === 'quiz' && state.quiz.cur) return false;   // questions have their own Back
    return idx() > 0 || available()[0].id !== state.current;
  }

  function canGoForward() {
    const p = part();
    if (!p.tasks || fb || idx() >= tasksOf(p).length) return false;
    return task().type !== 'info' && idx() < seenPart().far;
  }

  function goBack() {
    if (!canGoBack()) return;
    if (part().tasks && idx() > 0) {
      state.idx[state.current] = idx() - 1;
      enterTask(true);
    } else {
      const list = available();
      state.current = list[list.findIndex(p => p.id === state.current) - 1].id;
      fb = null; drafts = {};
      if (state.current === 'gym' && !gymQ) nextGym();
      if (state.current === 'honors' && !honorsQ) nextHonors();
      if (part().tasks && task()) enterTask(true);
    }
    save();
    render();
  }

  function goForward() {
    if (!canGoForward()) return;
    if (idx() + 1 >= tasksOf(part()).length) { state.idx[state.current] = tasksOf(part()).length; return completePart(); }
    state.idx[state.current] = idx() + 1;
    enterTask(true);
    save();
    render();
  }

  function advance() {
    const list = tasksOf(part());
    if (idx() + 1 >= list.length) {
      seenPart().far = list.length;
      state.idx[state.current] = list.length;
      completePart();
      return;
    }
    state.idx[state.current] = idx() + 1;
    enterTask();
    save();
    render();
  }

  function nextPart() {
    const list = available();
    const i = list.findIndex(p => p.id === state.current);
    if (list[i + 1]) {
      state.current = list[i + 1].id;
      if (state.current === 'gym') nextGym();
      if (state.current === 'honors') nextHonors();
      if (part().tasks) enterTask();
      save();
    }
    render();
  }

  // ---------- Rendering helpers ----------
  const hintsHTML = (hints) => {
    if (!hints || !hints.length) return '';
    const open = hints.slice(0, hintsOpen).map((h, i) => `<li>${h}</li>`).join('');
    const more = hintsOpen < hints.length
      ? `<button class="btn-hint" data-hint>💡 ${hintsOpen ? 'Next hint' : 'Show a hint'}</button>` : '';
    return `<div class="hints">${open ? `<ol class="hint-list">${open}</ol>` : ''}${more}</div>`;
  };

  // ---------- Calculations can only be answered from the calculator ----------
  let calcNeeds = {};   // what the current page's calculator answers must show, by box

  // attr marks the box for the existing read paths (data-input="x", data-qinput, data-gymfrac)
  function calcBox(key, attr, value, disabled, needs, label) {
    if (!window.Desmos) {   // Blocked or offline: students can still work, and the teacher monitor flags it
      state.calcUnavailable = true;
      return `<input type="text" inputmode="decimal" autocomplete="off" ${attr} value="${esc(value || '')}" ${disabled ? 'disabled' : ''} aria-label="${label}">`;
    }
    if (!disabled) calcNeeds[key] = { needs, label };
    return `<span class="calc-answer" data-calcbox="${key}">
      <input type="text" readonly tabindex="-1" class="calc-readonly" ${attr} value="${esc(value || '')}" ${disabled ? 'disabled' : ''} placeholder="calculator" aria-label="${label}, filled in from the calculator">
    </span>`;
  }

  // The button lives in the calculator panel. With two answers on a page it fills the one that is
  // highlighted: the first empty box, or whichever box the student clicked.
  let calcTarget = null;
  const calcBoxes = () => [...$('taskCard').querySelectorAll('[data-calcbox]')].filter(b => calcNeeds[b.dataset.calcbox]);

  function updateGrabButton() {
    const boxes = calcBoxes();
    $('calcFoot').hidden = !boxes.length;
    if (!boxes.length) { calcTarget = null; return; }
    if (!boxes.some(b => b.dataset.calcbox === calcTarget)) {
      const empty = boxes.find(b => !b.querySelector('input').value);
      calcTarget = (empty || boxes[0]).dataset.calcbox;
    }
    boxes.forEach(b => b.classList.toggle('calc-target', boxes.length > 1 && b.dataset.calcbox === calcTarget));
    $('btnUseCalc').innerHTML = subHTML(boxes.length > 1
      ? `📥 Use calculator answer for ${calcNeeds[calcTarget].label.replace(/\s*=\s*$/, '').replace(/\bv 0(x|y)\b/, 'v_0$1')}`
      : '📥 Use calculator answer');
  }

  function sayCalc(msg) {
    $('calcMsg').hidden = !msg;
    $('calcMsg').innerHTML = msg ? subHTML(msg) : '';
    if (msg && window.soundFx) soundFx.playBuzzer();
  }

  function grabAnswer() {
    const box = $('taskCard').querySelector(`[data-calcbox="${calcTarget}"]`);
    if (!box) return;
    const input = box.querySelector('input');
    if (!desmos) return sayCalc('Type your calculation into the calculator first.');
    const work = E().readCalculator(desmos.getState());
    if (work.empty) return sayCalc('Type your calculation into the calculator first.');
    if (work.unreadable) return sayCalc('The calculator line is not finished. Check it, or press "clear all" and type it again.');
    const problem = E().checkWork(work, calcNeeds[calcTarget].needs);
    if (problem) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return sayCalc(problem);
    }
    sayCalc('');
    input.value = String(Number(work.value.toFixed(3)));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    window.soundFx && soundFx.playClick();
    const signedQ = activeQuestion();
    if (signedQ) signedQ.work = work.latex;   // kept with the graded question for the teacher's record check
    if (signedQ && E().QUESTION[signedQ.kind].signed) {
      if (work.value < 0 && !signedQ.sign) { signedQ.sign = '-'; readDrafts(); render(); }   // typed the minus: same choice
      applySign(signedQ);
    }
    if (state.current === 'quiz' && state.quiz.cur) {   // an answer in progress survives leaving
      saveQuizAnswer();
      save();
    }
    const empty = calcBoxes().find(b => !b.querySelector('input').value);
    if (empty) calcTarget = empty.dataset.calcbox;
    updateGrabButton();
  }

  function clearCalculator() {
    if (desmos && desmos.setBlank) desmos.setBlank();
  }

  // Pages with a calculator answer open the calculator; other pages give the room back to the picture
  let calcOpenedByHand = false;
  function syncCalcPanel() {
    if (calcBoxes().length) toggleCalc(true);
    else if (!calcOpenedByHand && !$('calcPanel').hidden) toggleCalc(false);   // answered: show the feedback in full
    sayCalc('');
    updateGrabButton();
  }

  function inputRow(inp, disabled) {
    if (inp.calc) {
      return `<label class="ans-row ans-calc"><span>${inp.label}</span>${calcBox(inp.k, `data-input="${inp.k}"`, drafts[inp.k], disabled, inp.needs, inp.label.replace(/_/g, ' '))}${inp.unit ? `<span>${inp.unit}</span>` : ''}</label>`;
    }
    const v = drafts[inp.k] !== undefined ? esc(drafts[inp.k]) : '';
    return `<label class="ans-row"><span>${inp.label}</span><input type="text" inputmode="decimal" autocomplete="off" data-input="${inp.k}" value="${v}" ${disabled ? 'disabled' : ''} aria-label="${inp.label.replace(/_/g, ' ')}">${inp.unit ? `<span>${inp.unit}</span>` : ''}</label>`;
  }

  function feedbackHTML() {
    if (!fb) return '';
    return `<div class="feedback ${fb.ok ? 'fb-ok' : 'fb-bad'}" role="status"><strong>${fb.ok ? '✓ Correct!' : '✗ Not yet.'}</strong> ${fb.msg || ''}</div>`;
  }

  function labTableHTML(opts = {}) {
    const d = state.data;
    const ratio = opts.ratio;
    const head = `<tr><th>θ</th><th class="w-x">v_0x (m/s)</th><th class="w-y">v_0y (m/s)</th>${ratio ? '<th class="w-x">v_0x ÷ v_0</th><th class="w-y">v_0y ÷ v_0</th>' : ''}</tr>`;
    const cell = v => (v === null || v === undefined ? '<span class="blank">—</span>' : E().fmt(v, 1).replace(/\.0$/, ''));
    const body = d.rows.map(r => {
      const active = opts.activeTh === r.th;
      const hl = opts.markTh === r.th;
      let xCell = cell(r.x), yCell = cell(r.y);
      if (active) {
        xCell = `<input type="text" inputmode="decimal" autocomplete="off" data-input="x" value="${esc(drafts.x || '')}" aria-label="v 0 x at ${r.th} degrees">`;
        yCell = `<input type="text" inputmode="decimal" autocomplete="off" data-input="y" value="${esc(drafts.y || '')}" aria-label="v 0 y at ${r.th} degrees">`;
      }
      const ratios = ratio ? `<td class="${hl ? 'fill' : 'blank'}">${hl ? '?' : '·'}</td><td class="${hl ? 'fill' : 'blank'}">${hl ? '?' : '·'}</td>` : '';
      return `<tr class="${active ? 'row-active' : ''} ${hl ? 'row-picked' : ''}"><td class="given">${r.th}°</td><td class="${active ? 'cell-active' : ''}">${xCell}</td><td class="${active ? 'cell-active' : ''}">${yCell}</td>${ratios}</tr>`;
    }).join('');
    return `<p class="table-cap">My data: <span class="formula">v_0 = ${d.v0} m/s</span></p><div class="table-wrap"><table class="data-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
  }

  // Top of the task card: title, progress, read aloud, calculator, teacher skip
  function topHTML(badge, dots) {
    return `<div class="task-top">
      ${canGoBack() ? '<button class="btn-nav" data-back aria-label="Go back one page">← Back</button>' : ''}
      ${canGoForward() ? '<button class="btn-nav" data-forward aria-label="Go forward one page">Next →</button>' : ''}
      <span class="step-badge ${part().honors ? 'badge-honors' : part().kind === 'quiz' ? 'badge-quiz' : ''}">${badge}</span>
      ${dots ? `<div class="dots" aria-label="Progress">${dots}</div>` : ''}
      <button class="btn-read" data-read>🔊 Read to me</button>
      <button class="btn-read" data-calc>🧮 Calculator</button>
      ${testing() ? '<button class="btn-skip" data-skip>Skip step</button>' : ''}
    </div>`;
  }

  function dotsHTML(n, i) {
    return Array.from({ length: n }, (_, k) => `<span class="dot ${k < i ? 'done' : k === i ? 'now' : ''}"></span>`).join('');
  }

  // ---------- Completion certificate ----------
  function certStatus() {
    const missing = PARTS.filter(p => p.weight > 0 && (!p.honors || profile.honorsRequired) && !state.done[p.id]);
    const best = state.quiz.best || 0;
    const attempted = state.quiz.attempts.length > 0;
    return { ready: !missing.length && attempted && best >= CERT_PERCENT, missing, best, attempted };
  }

  // Remembers the day it was first earned; the code follows the best score, which can still rise
  function updateCert() {
    if (profile.guest && !profile.preview) return;
    if (!certStatus().ready) return;
    const id = profile.preview ? 'SAMPLE' : (cloud && cloud.studentId) || 'TEACHER';
    const code = Certificate.code(id, state.quiz.best);
    if (state.cert && state.cert.code === code) return;
    state.cert = { code, at: (state.cert && state.cert.at) || Date.now() };
    save();
  }

  function certHTML() {
    const c = certStatus();
    if (profile.guest && !profile.preview) {
      return `<div class="cert-box cert-wait">🎓 <strong>Certificates are for signed-in students.</strong> Sign in with your school account to earn yours.</div>`;
    }
    if (c.ready) {
      return `<div class="cert-box cert-ready"><strong>🎓 You earned your certificate!</strong><button class="btn-primary" data-cert>📄 Download certificate (PDF)</button></div>`;
    }
    const need = c.missing.length ? `finish ${c.missing.map(p => p.label).join(', ')} and ` : '';
    return `<div class="cert-box cert-wait">🎓 <strong>Earn your certificate:</strong> ${need}score ${CERT_PERCENT}% or higher on the Mastery Check. Your best so far is ${c.best}%.</div>`;
  }

  async function downloadCertificate(btn) {
    updateCert();
    if (!state.cert) return;
    if (btn) btn.disabled = true;
    setStatus('Making your certificate…');
    try {
      await Certificate.download({
        name: profile.preview ? 'Sample Student' : profile.name,
        sample: !!profile.preview,
        best: state.quiz.best,
        honors: !!profile.honorsRequired,
        period: profile.teacher ? 'Teacher' : (profile.period !== null && profile.period !== undefined) ? `Period ${profile.period}` : '',
        earned: state.cert.at,
        code: state.cert.code
      });
      setStatus('');
      window.soundFx && soundFx.playChime();
    } catch (e) {
      console.error('Certificate failed:', e);
      setStatus('The certificate did not download. Refresh the page and try again.');
    }
    if (btn) btn.disabled = false;
  }

  function renderStrip() {
    const s = scoreState(state);
    $('partStrip').innerHTML = available().map(p => {
      const done = !!state.done[p.id], open = unlocked(p.id), cur = state.current === p.id;
      return `<button class="part-pill ${done ? 'done' : ''} ${cur ? 'active' : ''} ${p.honors ? 'honors' : ''}" data-part="${p.id}" ${open ? '' : 'disabled'} title="${esc(p.title)}">${p.icon} ${p.label}<span class="mp-icon">${done ? ' ✓' : open ? '' : ' 🔒'}</span></button>`;
    }).join('') + `<span class="strip-right">${certStatus().ready && (!profile.guest || profile.preview) ? '<button class="cert-chip" data-cert title="Download your certificate as a PDF">🎓 Certificate</button>' : ''}<span class="score-chip" title="Your best score so far">⭐ ${E().fmt(s.points, 1)} / 10</span></span>`;
  }

  function setAngleCtl(on) {
    $('angleCtl').hidden = !on;
    if (on) $('angleSlider').value = labAngle;
  }

  function showScene(spec, lab) {
    setAngleCtl(!!lab);
    Diagram.show(spec);
  }

  // ---------- Main render ----------
  function render() {
    calcNeeds = {};
    renderStrip();
    Promise.resolve().then(syncCalcPanel);
    const p = part();
    if (p.kind === 'gym') return renderGym();
    if (p.kind === 'quiz') return renderQuiz();
    if (p.kind === 'honorsSet') return renderHonors();
    if (idx() >= tasksOf(p).length || !task()) return renderPartDone();
    const t = task();
    if ((p.needsData || p.lab) && !state.data) ensureLab();
    const c = ctx();
    let html = topHTML(p.title, dotsHTML(tasksOf(p).length, idx()));

    if (t.type === 'measure') html += measureHTML(t);
    else {
      html += `<div class="prompt">${t.text(c)}</div>`;
      if (t.table) html += labTableHTML({ ratio: t.table === 'ratio', markTh: c.sc.rowTh });
      if (t.type === 'mc') html += mcHTML(t, c);
      if (t.type === 'num') html += numHTML(t, c);
      if (t.type === 'info') html += `<div class="task-actions"><button class="btn-primary" data-next>Got it →</button></div>`;
    }
    html += feedbackHTML();
    html += actionsHTML(t);
    $('taskCard').innerHTML = subHTML(html);
    showScene(t.scene(c), t.labAngle);
    focusFirst();
    revealFeedback();
  }

  // Big projector text can push the Next button below the fold: keep it in view after every answer
  function revealFeedback() {
    if (!fb) return;
    const b = $('taskCard').querySelector('.task-actions:last-of-type');
    if (b) b.scrollIntoView({ block: 'nearest' });
  }

  function focusFirst() {
    const el = $('taskCard').querySelector('input:not([disabled]):not([readonly])');
    if (el && !fb) el.focus({ preventScroll: true });
  }

  function mcHTML(t, c) {
    const opts = t.options(c);
    if (!mcOrder || mcOrder.length !== opts.length) mcOrder = E().shuffled(opts.length);
    return `<div class="mc-list">${mcOrder.map(i => `<button class="mc-opt ${opts[i].formula ? 'formula-opt' : ''}" data-mc="${i}" ${fb ? 'disabled' : ''}>${opts[i].t}</button>`).join('')}</div>`;
  }

  function numHTML(t, c) {
    const inputs = t.inputs(c);
    const answered = !!fb;
    return `${t.setupFn ? setupHTML(t, inputs, answered) : `<div class="ans-grid ${t.big ? 'ans-big' : ''}">${inputs.map(i => inputRow(i, answered)).join('')}</div>`}
      ${answered ? '' : `<div class="task-actions"><button class="btn-primary" data-check>Check ✓</button></div>`}
      ${answered ? '' : hintsHTML(t.hints ? t.hints(c) : null)}`;
  }

  // The formula on top, with each box lined up under the symbol it replaces
  function setupHTML(t, inputs, answered) {
    const box = (k, label) => {
      const v = drafts[k] !== undefined ? esc(drafts[k]) : '';
      return `<input type="text" inputmode="decimal" autocomplete="off" data-input="${k}" value="${v}" ${answered ? 'disabled' : ''} aria-label="${label}">`;
    };
    return `<div class="setup-grid">
      <span class="sg-sym">${t.setupSym}</span><span>=</span><span class="sg-sym sg-v0">v_0</span><span>×</span><span class="sg-sym">${t.setupFn}(θ)</span>
      <span class="sg-sym">${t.setupSym}</span><span>=</span><span class="sg-entry">${box('v0', 'launch speed in meters per second')} m/s</span><span>×</span><span class="sg-entry">${t.setupFn}( ${box('th', 'angle in degrees')} °)</span>
    </div>`;
  }

  function measureHTML(t) {
    const d = state.data;
    const row = d.rows.find(r => r.th === t.th);
    if (row.x !== null && !row.worked && !fb) {
      return `<div class="prompt">You already recorded the ${t.th}° row. Your numbers are in the table.</div>${labTableHTML({})}`;
    }
    if (row.worked) {
      return `<div class="prompt"><strong>Example:</strong> move the slider to ${t.th}°. This row is already filled in so you can see how to read it: follow the blue line down, and the orange line left.</div>${labTableHTML({})}`;
    }
    const pre = t.th === 0 || t.th === 90
      ? `<strong>Set θ to ${t.th}°.</strong> Read v_0x and v_0y. One of them will be zero.`
      : `<strong>Set θ to ${t.th}° on the protractor.</strong> Read both parts off the grid to the nearest half square, then record them.`;
    return `<div class="prompt">${pre}</div>
      ${labTableHTML({ activeTh: fb ? null : t.th })}
      ${fb ? '' : `<div class="task-actions"><button class="btn-primary" data-measure>Record ✓</button></div>`}
      ${fb ? '' : hintsHTML(['Move your mouse over the grid to zoom in.', 'v_0x: follow the blue dashed line down from the tip to the bottom axis.', 'v_0y: follow the orange dashed line left from the tip to the left axis.', 'Each small square is 1 m/s. Halfway across a square is 0.5.'])}`;
  }

  function actionsHTML(t) {
    if (!fb) {
      const row = t.type === 'measure' && state.data.rows.find(r => r.th === t.th);
      return row && row.x !== null ? '<div class="task-actions"><button class="btn-primary" data-next>Got it →</button></div>' : '';
    }
    if (fb.ok) return '<div class="task-actions"><button class="btn-primary" data-next>Next →</button></div>';
    return `<div class="task-actions"><button class="btn-primary" data-retry>${keepsNumbers(t) ? 'Try again' : '🔄 Try new numbers'}</button></div>`;
  }

  function renderPartDone() {
    const p = part();
    const list = available();
    const next = list[list.findIndex(x => x.id === p.id) + 1];
    const c = ctx();
    $('taskCard').innerHTML = subHTML(`${topHTML(p.title, '')}
      <div class="done-box"><div class="done-big">✅ ${p.label} complete!</div>
      <p>Your work is saved.</p></div>
      ${next ? `<div class="task-actions"><button class="btn-primary" data-nextpart>Go to ${next.label} →</button></div>` : ''}`);
    const tasks = tasksOf(p);
    const last = tasks[tasks.length - 1];
    showScene(last.scene(c), false);
  }

  // ---------- Answer handling ----------
  function readDrafts() {
    $('taskCard').querySelectorAll('[data-input]').forEach(el => { drafts[el.dataset.input] = el.value; });
    const q = $('taskCard').querySelector('[data-qinput]');
    if (q) drafts.q = q.value;
  }

  function checkNum() {
    readDrafts();
    const t = task();
    const c = ctx();
    const inputs = t.inputs(c);
    const results = inputs.map(i => ({ i, r: i.check(drafts[i.k] === undefined ? '' : drafts[i.k]) }));
    if (results.some(x => x.r.ok === null)) {
      setStatus('Fill in each box first. For a calculation, press Use calculator answer.');
      return;
    }
    const wrong = results.find(x => !x.r.ok);
    if (wrong) {
      fb = { ok: false, msg: wrong.r.msg };
      noteMistake(wrong.r.mistake);
      window.soundFx && soundFx.playBuzzer();
    } else {
      fb = { ok: true, msg: results.map(x => x.r.msg).filter(Boolean).join('<br>') };
      window.soundFx && soundFx.playChime();
    }
    save();
    render();
  }

  function checkMC(i) {
    const t = task();
    const o = t.options(ctx())[i];
    fb = o.ok ? { ok: true, msg: t.right ? t.right(ctx()) : '' } : { ok: false, msg: o.why || '' };
    window.soundFx && (o.ok ? soundFx.playChime() : soundFx.playBuzzer());
    save();
    render();
  }

  function checkMeasure() {
    readDrafts();
    const t = task();
    const row = state.data.rows.find(r => r.th === t.th);
    const tr = LAB.trueRow(state.data.v0, t.th);
    if (labAngle !== t.th) {
      fb = { ok: false, msg: `The protractor is not at ${t.th}° yet. Move the slider so the purple arrow points to the ${t.th}° mark.` };
      window.soundFx && soundFx.playBuzzer();
      return render();
    }
    const x = E().parseNum(drafts.x), y = E().parseNum(drafts.y);
    if (x === null || y === null) { setStatus('Type a number in both boxes first.'); return; }
    const TOL = 1;
    const xOk = Math.abs(x - tr.x) <= TOL, yOk = Math.abs(y - tr.y) <= TOL;
    if (xOk && yOk) {
      row.x = x; row.y = y;
      fb = { ok: true, msg: `Recorded. Your values are within one square of the true reading.` };
      window.soundFx && soundFx.playChime();
    } else {
      const swapped = Math.abs(x - tr.y) <= TOL && Math.abs(y - tr.x) <= TOL;
      noteMistake(swapped ? 'swap' : 'read');
      fb = {
        ok: false,
        msg: swapped ? 'You switched them. v_0x is the sideways part (blue, bottom axis). v_0y is the upward part (orange, left axis).'
          : !xOk ? 'Check v_0x. Follow the blue dashed line from the tip straight down to the bottom axis.'
            : 'Check v_0y. Follow the orange dashed line from the tip straight left to the left axis.'
      };
      window.soundFx && soundFx.playBuzzer();
    }
    save();
    render();
  }

  // Lab data and number-free concept questions retry as they are; everything else gets new numbers
  const keepsNumbers = t => t.type === 'measure' || t.retrySame || (t.type === 'mc' && !t.fresh && !t.chain);

  function retry() {
    const t = task();
    if (keepsNumbers(t)) {
      fb = null;
      mcOrder = null;
      const row = t.type === 'measure' ? state.data.rows.find(r => r.th === t.th) : null;
      if (!row) drafts = {};
      render();
      return;
    }
    restartScenario();
    save();
    render();
  }

  // ---------- Shared question UI (Gym, Honors, Quiz) ----------
  // Direction is a choice, so the student never has to get a minus sign into the calculator first
  function signPickHTML(q, disabled) {
    const btn = (sign, label) => `<button class="sign-btn ${q.sign === sign ? 'sign-on' : ''}" data-sign="${sign}" ${disabled ? 'disabled' : ''} aria-pressed="${q.sign === sign}">${label}</button>`;
    return `<div class="sign-pick"><strong>Which way does it point?</strong>${btn('+', '⬆ Up (+)')}${btn('-', '⬇ Down (−)')}</div>`;
  }

  const activeQuestion = () => (state.current === 'quiz' && state.quiz.cur ? state.quiz.cur.qs[state.quiz.cur.i] : state.current === 'honors' ? honorsQ : null);

  function applySign(q) {
    const el = $('taskCard').querySelector('[data-qinput]');
    const v = E().parseNum(el.value);
    if (v === null || !q.sign) return;
    el.value = String(q.sign === '-' ? -Math.abs(v) : Math.abs(v));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function questionBody(q, disabled, picked) {
    const def = E().QUESTION[q.kind];
    let html = `<div class="prompt">${def.text(q)}</div>`;
    if (def.type === 'mc') {
      const opts = def.options(q);
      const order = q.order || opts.map((_, i) => i);
      html += `<div class="mc-list">${order.map(i => `<button class="mc-opt ${opts[i].formula ? 'formula-opt' : ''} ${picked === opts[i].id ? 'mc-picked' : ''}" data-q="${esc(opts[i].id)}" ${disabled ? 'disabled' : ''}>${opts[i].t}</button>`).join('')}</div>`;
    } else {
      const v = picked !== undefined && picked !== null ? esc(picked) : '';
      const box = def.needs
        ? calcBox('q', 'data-qinput', picked, disabled, def.needs(q), 'Answer')
        : `<input type="text" inputmode="decimal" autocomplete="off" data-qinput value="${v}" ${disabled ? 'disabled' : ''} aria-label="Answer">`;
      html += `<div class="ans-grid"><label class="ans-row ${def.needs ? 'ans-calc' : ''}"><span>Answer:</span>${box}<span>${def.unit || ''}</span></label></div>`;
      if (def.signed) html += signPickHTML(q, disabled);
    }
    return html;
  }

  // ---------- Practice Gym ----------
  const GYM_MIX = ['calc_x', 'calc_y', 'choose', 'calc_y', 'calc_x', 'concept', 'sense', 'read'];
  const SUPPORT_STEPS = kind => kind === 'calc_x' || kind === 'calc_y';

  function nextGym() {
    const g = state.gym;
    let kind;
    if (g.focus) {
      const map = { read: ['read'], concept: ['concept'], choose: ['choose'], calc_x: ['calc_x'], calc_y: ['calc_y'], sense: ['sense'], honors: ['calc_x', 'calc_y'] };
      kind = E().pick(map[g.focus] || GYM_MIX);
    } else kind = GYM_MIX[g.total % GYM_MIX.length];
    gymQ = E().QUESTION[kind].make();
    // Warm up with friendly numbers before any angle is fair game
    if (SUPPORT_STEPS(kind) && g.streak < 2) gymQ.sc = E().launch(1);
    gymQ.step = supportOn() && SUPPORT_STEPS(kind) ? 'pick' : 'answer';
    fb = null; drafts = {};
    hintsOpen = supportOn() ? 1 : 0;
    if (desmos && desmos.setBlank) desmos.setBlank();
  }

  function renderGym() {
    if (!gymQ) nextGym();
    const g = state.gym, q = gymQ;
    const goal = gymGoal();
    const def = E().QUESTION[q.kind];
    const met = !!state.done.gym;
    let html = topHTML('Practice Gym', '');
    html += `<div class="streak-row"><strong>Streak:</strong> <div class="dots">${dotsHTML(goal, Math.min(g.streak, goal)).replace(/now/, 'next')}</div>
      <span class="streak-note">${met ? `Goal met ✓ Keep practicing as long as you like.` : `Get ${goal} right in a row. A miss starts the streak over.`}</span></div>`;
    if (g.focus) html += `<p class="focus-note">Focus: <strong>${E().SKILLS[g.focus].label}</strong> <button class="btn-link" data-clearfocus>Mix all skills</button></p>`;

    if (q.step === 'pick') {
      const asked = q.asked;
      html += `<div class="prompt">${def.text(q)}</div><p><strong>Step 1:</strong> Which do you need?</p>
        <div class="mc-list">${['sin', 'cos'].map(f => `<button class="mc-opt formula-opt" data-gympick="${f}" ${fb ? 'disabled' : ''}>${f}(θ)</button>`).join('')}</div>`;
    } else if (q.step === 'frac') {
      html += `<div class="prompt">${def.text(q)}</div><p><strong>Step 2:</strong> Find the decimal with the calculator.</p>
        <div class="ans-grid"><label class="ans-row ans-calc"><span>${E().fn(q.asked)}(${q.sc.th}°) =</span>${calcBox('frac', 'data-gymfrac', drafts.frac, !!fb, { fn: E().fn(q.asked), nums: [q.sc.th] }, 'Decimal')}</label></div>`;
    } else {
      if (supportOn() && SUPPORT_STEPS(q.kind)) {
        html += `<div class="prompt">${def.text(q)}</div><p><strong>Step 3:</strong> Multiply: <span class="formula">v_0 × ${q.frac}</span></p>
          <div class="ans-grid"><label class="ans-row ans-calc"><span>${E().sym(q.asked)} =</span>${calcBox('q', 'data-qinput', drafts.q, !!fb, def.needs(q), 'Answer')}<span>m/s</span></label></div>`;
      } else html += questionBody(q, !!fb, drafts.q);
    }

    if (!fb && def.type === 'num' && q.step !== 'pick') html += `<div class="task-actions"><button class="btn-primary" data-gymcheck>Check ✓</button></div>`;
    if (!fb && SUPPORT_STEPS(q.kind) && q.step === 'answer') {
      html += hintsHTML(calcHintsFor(q));
    }
    html += feedbackHTML();
    if (fb) {
      html += `<div class="task-actions"><button class="${met ? 'btn-secondary' : 'btn-primary'}" data-gymnext>${fb.ok ? 'Next problem →' : '🔄 New problem'}</button>${met ? '<button class="btn-primary" data-nextpart>Go on →</button>' : ''}</div>`;
    } else if (met) html += `<div class="task-actions"><button class="btn-secondary" data-nextpart>Go on →</button></div>`;
    html += skillStatsHTML();
    $('taskCard').innerHTML = subHTML(html);
    showScene(def.scene(q), false);
    focusFirst();
    revealFeedback();
  }

  function calcHintsFor(q) {
    return [
      q.asked === 'x' ? 'Sideways touches θ, so use cos.' : 'Upward is across from θ, so use sin.',
      `Type this in the calculator: <span class="formula">${q.sc.v0} × ${E().fn(q.asked)}(${q.sc.th})</span>`,
      'Check it: the answer must be smaller than v_0.'
    ];
  }

  function skillStatsHTML() {
    const st = state.gym.skills;
    const keys = Object.keys(st).filter(k => E().SKILLS[k]);
    if (!keys.length) return '';
    const rows = keys.map(k => {
      const p = Math.round(100 * st[k].right / st[k].total);
      return `<div class="skill-row"><span class="skill-name">${E().SKILLS[k].label}</span><span class="skill-bar"><span style="width:${p}%"></span></span><span class="skill-val">${st[k].right}/${st[k].total}</span></div>`;
    }).join('');
    return `<details class="skills-box"><summary>My practice so far</summary>${rows}</details>`;
  }

  function gymRecord(ok, mistake, msg) {
    const g = state.gym, q = gymQ;
    g.total++;
    const sk = g.skills[q.skill] = g.skills[q.skill] || { right: 0, total: 0 };
    sk.total++;
    if (ok) { sk.right++; g.right++; g.streak++; g.best = Math.max(g.best, g.streak); } else { g.streak = 0; noteMistake(mistake); }
    fb = { ok, msg };
    window.soundFx && (ok ? soundFx.playChime() : soundFx.playBuzzer());
    if (g.streak >= gymGoal() && !state.done.gym) {
      state.done.gym = true;
      window.soundFx && soundFx.playFanfare();
    }
    save();
    render();
  }

  function gymAnswer(val) {
    const q = gymQ;
    const r = E().QUESTION[q.kind].grade(q, val);
    gymRecord(!!r.ok, r.mistake, r.msg);
  }

  function gymFrac(raw) {
    const q = gymQ;
    const v = E().parseNum(raw);
    if (v === null) { setStatus('Press Use calculator answer first.'); return; }
    const t = (q.asked === 'x' ? Math.cos : Math.sin)(E().rad(q.sc.th));
    if (Math.abs(v - t) <= 0.02) {
      q.frac = t.toFixed(2);
      q.step = 'answer';
      clearCalculator();
      render();
    } else {
      const radMode = Math.abs(v - (q.asked === 'x' ? Math.cos : Math.sin)(q.sc.th)) <= 0.02;
      gymRecord(false, radMode ? 'radians' : 'other', radMode ? 'Your calculator is in radian mode. Switch it to degrees (DEG).' : `${E().fn(q.asked)}(${q.sc.th}°) = ${t.toFixed(2)}. Type it in the calculator just like that.`);
    }
  }

  // ---------- Honors: one of each challenge, new numbers after a miss ----------
  function nextHonors() {
    const p = PARTS.find(x => x.id === 'honors');
    const i = Math.min(state.honors.i, p.kinds.length - 1);
    honorsQ = E().QUESTION[p.kinds[i]].make();
    fb = null; drafts = {}; hintsOpen = 0;
    clearCalculator();
  }

  function renderHonors() {
    const p = part();
    if (state.done.honors && state.honors.i >= p.kinds.length) {
      $('taskCard').innerHTML = subHTML(`${topHTML(p.title, '')}<div class="done-box"><div class="done-big">✅ Honors challenges complete!</div></div><div class="task-actions"><button class="btn-primary" data-nextpart>Go to Mastery Check →</button></div>`);
      return showScene(E().QUESTION[p.kinds[p.kinds.length - 1]].scene(honorsQ || E().QUESTION[p.kinds[0]].make()), false);
    }
    if (!honorsQ) nextHonors();
    const q = honorsQ;
    let html = topHTML(p.title, dotsHTML(p.kinds.length, state.honors.i));
    html += questionBody(q, !!fb, drafts.q);
    if (!fb) html += `<div class="task-actions"><button class="btn-primary" data-honorscheck>Check ✓</button></div>`;
    if (!fb && E().QUESTION[q.kind].hints) html += hintsHTML(E().QUESTION[q.kind].hints(q));
    html += feedbackHTML();
    if (fb) html += `<div class="task-actions"><button class="btn-primary" data-honorsnext>${fb.ok ? 'Next →' : '🔄 Try new numbers'}</button></div>`;
    $('taskCard').innerHTML = subHTML(html);
    showScene(E().QUESTION[q.kind].scene(q), false);
    focusFirst();
  }

  // ---------- Mastery Check ----------
  function startQuiz() {
    state.quiz.cur = { qs: E().buildQuiz(honorsOn()), answers: [], i: 0, startedAt: Date.now() };
    if (desmos && desmos.setBlank) desmos.setBlank();
    save();
    render();
  }

  function finishQuiz() {
    const cur = state.quiz.cur;
    const out = E().gradeQuiz(cur.qs, cur.answers);
    state.quiz.attempts.push({
      pct: out.pct, correct: out.correct, total: out.total, skills: out.skills, at: Date.now(),
      secs: cur.startedAt ? Math.round((Date.now() - cur.startedAt) / 1000) : null
    });
    state.quiz.best = Math.max(state.quiz.best || 0, out.pct);
    state.quiz.last = { qs: cur.qs, answers: cur.answers };
    state.quiz.cur = null;
    state.done.quiz = true;
    updateCert();
    out.results.forEach(r => noteMistake(r.mistake));
    save();
    window.soundFx && (out.pct >= 75 ? soundFx.playFanfare() : soundFx.playChime());
    render();
  }

  function renderQuiz() {
    const z = state.quiz;
    if (z.cur) return renderQuizQuestion();
    if (z.last) return renderQuizResults();
    const n = honorsOn() ? 10 : 8;
    $('taskCard').innerHTML = subHTML(`${topHTML('Mastery Check', '')}
      <div class="prompt"><p><strong>Show what you can do on your own.</strong></p>
      <ul class="howto"><li>${n} questions, one at a time.</li><li>You may use the 🧮 calculator.</li><li>No hints, and you see your results at the end.</li>
      <li>You can retake it with new numbers. <strong>Only your best score counts.</strong></li></ul></div>
      <div class="task-actions"><button class="btn-primary" data-startquiz>Start the Mastery Check →</button></div>`);
    showScene({ mode: 'scene', sc: { v0: 25, th: 37, x: E().Phys.vx(25, 37), y: E().Phys.vy(25, 37), thing: 6 }, showX: true, showY: true, nameV0: 'v_0', nameX: 'v_0x', nameY: 'v_0y', hideAngle: true }, false);
  }

  function renderQuizQuestion() {
    const cur = state.quiz.cur;
    const q = cur.qs[cur.i];
    const def = E().QUESTION[q.kind];
    let html = topHTML(`Question ${cur.i + 1} of ${cur.qs.length}`, dotsHTML(cur.qs.length, cur.i));
    html += questionBody(q, false, cur.answers[cur.i]);
    const isLast = cur.i === cur.qs.length - 1;
    html += `<div class="task-actions">${cur.i > 0 ? '<button class="btn-secondary" data-quizback>← Back</button>' : ''}<button class="btn-primary" data-quiznext>${isLast ? 'Finish ✓' : 'Next →'}</button></div>`;
    $('taskCard').innerHTML = subHTML(html);
    showScene(def.scene(q), false);
    focusFirst();
  }

  function saveQuizAnswer() {
    const cur = state.quiz.cur;
    const el = $('taskCard').querySelector('[data-qinput]');
    if (el) cur.answers[cur.i] = el.value;
    else if (cur.answers[cur.i] === undefined) cur.answers[cur.i] = null;
  }

  function renderQuizResults() {
    const z = state.quiz;
    const out = E().gradeQuiz(z.last.qs, z.last.answers);
    const hist = z.attempts.map((a, i) => `<span class="attempt ${a.pct === z.best ? 'attempt-best' : ''}">#${i + 1}: ${a.pct}%</span>`).join('<span class="attempt-sep">→</span>');
    const skillRows = Object.keys(out.skills).map(k => {
      const s = out.skills[k];
      const ok = s.right === s.total;
      return `<div class="skill-row"><span class="skill-name">${ok ? '✓' : '○'} ${E().SKILLS[k].label}</span><span class="skill-val">${s.right}/${s.total}</span>${ok ? '' : `<button class="btn-link" data-focus="${k}">Practice this</button>`}</div>`;
    }).join('');
    const review = out.results.map((r, i) => {
      const q = z.last.qs[i];
      return `<details class="review-item ${r.ok ? '' : 'review-miss'}"><summary>${r.ok ? '✓' : '✗'} Question ${i + 1}: ${E().SKILLS[q.skill].label}</summary><p>${E().QUESTION[q.kind].text(q)}</p><p>${r.msg || ''}</p></details>`;
    }).join('');
    const pct = out.pct;
    const msg = pct === 100 ? 'Perfect! You own this skill.' : pct >= 75 ? 'Strong work. Check what you missed, then try for higher.' : 'Good start. Practice the skills marked ○, then retake it.';
    $('taskCard').innerHTML = subHTML(`${topHTML('Mastery Check Results', '')}
      <div class="score-big"><span class="score-num">${out.correct}/${out.total}</span><span>${pct}%</span></div>
      <p class="score-msg">${msg}</p>
      <div class="history"><strong>My progress:</strong> ${hist}</div>
      <p class="score-note">Best score counts: <strong>${z.best}%</strong> · Total grade so far: <strong>${E().fmt(state.bestPoints, 1)} / 10</strong></p>
      ${certHTML()}
      <div class="task-actions"><button class="${certStatus().ready ? 'btn-secondary' : 'btn-primary'}" data-startquiz>🔄 Retake with new numbers</button></div>
      <div class="skills-box"><strong>Skills on this attempt</strong>${skillRows}</div>
      <div class="review-list">${review}</div>`);
    const firstMiss = out.results.findIndex(r => !r.ok);
    const q = z.last.qs[firstMiss >= 0 ? firstMiss : 0];
    showScene(E().QUESTION[q.kind].scene(q), false);
  }

  // ---------- Calculator ----------
  let desmos = null;
  function toggleCalc(force) {
    const panel = $('calcPanel');
    const open = force !== undefined ? force : panel.hidden;
    panel.hidden = !open;
    document.body.classList.toggle('calc-open', open);
    if (!open) return;
    if (!window.Desmos) {
      $('calcFoot').hidden = true;
      $('calcHost').innerHTML = '<p class="calc-missing">The calculator did not load (no internet?). Use your own calculator in degree mode.</p>';
      return;
    }
    if (!desmos) {
      try {
        desmos = Desmos.ScientificCalculator($('calcHost'), {
          degreeMode: true,
          invertedColors: document.documentElement.classList.contains('theme-dark'),
          fontSize: Desmos.FontSizes ? Desmos.FontSizes.LARGE : undefined
        });
      } catch (e) {
        $('calcHost').innerHTML = '<p class="calc-missing">The calculator did not load. Use your own calculator in degree mode.</p>';
      }
    } else if (desmos.resize) desmos.resize();
  }

  // Drag by the title bar; stays fully on screen
  function bindCalcDrag() {
    const panel = $('calcPanel'), head = $('calcHead');
    let grab = null;
    head.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      const r = panel.getBoundingClientRect();
      grab = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      head.setPointerCapture(e.pointerId);
    });
    head.addEventListener('pointermove', e => {
      if (!grab) return;
      const r = panel.getBoundingClientRect();
      panel.style.left = `${Math.max(0, Math.min(innerWidth - r.width, e.clientX - grab.dx))}px`;
      panel.style.top = `${Math.max(0, Math.min(innerHeight - r.height, e.clientY - grab.dy))}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    });
    head.addEventListener('pointerup', () => { grab = null; });
  }

  // ---------- Read aloud, saying units and symbols as words ----------
  function speakTask() {
    if (!('speechSynthesis' in window)) { setStatus('Read-aloud is not available in this browser.'); return; }
    const card = $('taskCard').cloneNode(true);
    card.querySelectorAll('.task-top, .task-actions, details:not([open]), input, .btn-hint, .step-calc').forEach(el => el.remove());
    // Pause between answer choices, list items and paragraphs
    card.querySelectorAll('.mc-opt, li, p').forEach(el => el.append('. '));
    const text = card.textContent
      .replace(/\b(sin|cos|tan)\(/g, '$1 of (')
      .replace(/m\/s²/g, ' meters per second squared')
      .replace(/m\/s/g, ' meters per second')
      .replace(/(\d)\s*m\b/g, '$1 meters')
      .replace(/°/g, ' degrees')
      .replace(/\bsin\b/g, 'sine').replace(/\bcos\b/g, 'cosine').replace(/\btan⁻¹/g, 'inverse tangent of ').replace(/\btan\b/g, 'tangent')
      .replace(/v0x/g, 'v naught x').replace(/v0y/g, 'v naught y').replace(/v0/g, 'v naught')
      .replace(/θ/g, 'theta').replace(/√/g, ' the square root of ').replace(/²/g, ' squared')
      .replace(/÷/g, ' divided by ').replace(/−/g, ' minus ').replace(/×/g, ' times ').replace(/≈/g, ' about ')
      .replace(/→/g, ', ').replace(/[🔊🧮✓✗🔄💡⭐🔵🟠🟣✅🏆]/gu, ' ').replace(/\s+/g, ' ');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  function setStatus(msg) { $('simStatus').textContent = msg; }

  // ---------- Events ----------
  function onCardClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (b.hasAttribute('data-cert')) return downloadCertificate(b);
    if (d.sign) {
      const q = activeQuestion();
      q.sign = d.sign;
      readDrafts();
      if (state.current === 'quiz') saveQuizAnswer();
      applySign(q);
      if (state.current === 'quiz') { saveQuizAnswer(); save(); }
      readDrafts();
      return render();
    }
    if (b.hasAttribute('data-back')) { window.soundFx && soundFx.playClick(); return goBack(); }
    if (b.hasAttribute('data-forward')) { window.soundFx && soundFx.playClick(); return goForward(); }
    if (b.hasAttribute('data-read')) return speakTask();
    if (b.hasAttribute('data-calc')) { calcOpenedByHand = $('calcPanel').hidden; return toggleCalc(); }
    if (b.hasAttribute('data-hint')) { readDrafts(); hintsOpen++; return render(); }
    if (b.hasAttribute('data-skip')) return skipStep();
    if (b.hasAttribute('data-next')) { window.soundFx && soundFx.playClick(); return advance(); }
    if (b.hasAttribute('data-check')) return checkNum();
    if (b.hasAttribute('data-measure')) return checkMeasure();
    if (d.mc !== undefined) return checkMC(Number(d.mc));
    if (b.hasAttribute('data-retry')) return retry();
    if (b.hasAttribute('data-nextpart')) return nextPart();
    if (d.gympick) {
      const right = E().fn(gymQ.asked);
      if (d.gympick === right) { gymQ.step = 'frac'; return render(); }
      const r = gymQ.asked === 'x' ? 'Sideways touches θ, so it uses cos.' : 'Upward is across from θ, so it uses sin.';
      return gymRecord(false, 'swap', r);
    }
    if (b.hasAttribute('data-gymcheck')) {
      const frac = $('taskCard').querySelector('[data-gymfrac]');
      if (frac) { drafts.frac = frac.value; return gymFrac(frac.value); }
      const el = $('taskCard').querySelector('[data-qinput]');
      if (E().parseNum(el.value) === null) { setStatus(el.readOnly ? 'Press Use calculator answer first.' : 'Type a number first.'); return; }
      drafts.q = el.value;
      return gymAnswer(el.value);
    }
    if (d.q !== undefined && state.current === 'gym') return gymAnswer(d.q);
    if (b.hasAttribute('data-gymnext')) { nextGym(); return render(); }
    if (b.hasAttribute('data-clearfocus')) { state.gym.focus = null; nextGym(); return render(); }
    if (d.focus) { state.gym.focus = d.focus; state.gym.streak = 0; state.current = 'gym'; nextGym(); save(); return render(); }
    if (d.q !== undefined && state.current === 'honors') return honorsAnswer(d.q);
    if (b.hasAttribute('data-honorscheck')) {
      const el = $('taskCard').querySelector('[data-qinput]');
      if (el && E().parseNum(el.value) === null) { setStatus(el.readOnly ? 'Press Use calculator answer first.' : 'Type a number first.'); return; }
      if (E().QUESTION[honorsQ.kind].signed && !honorsQ.sign) { setStatus('Choose Up or Down first.'); return; }
      if (el) drafts.q = el.value;
      return honorsAnswer(el ? el.value : null);
    }
    if (b.hasAttribute('data-honorsnext')) {
      if (fb && fb.ok) state.honors.i++;
      const p = PARTS.find(x => x.id === 'honors');
      if (state.honors.i >= p.kinds.length) { state.done.honors = true; fb = null; save(); window.soundFx && soundFx.playFanfare(); return render(); }
      nextHonors();
      save();
      return render();
    }
    if (b.hasAttribute('data-startquiz')) return startQuiz();
    if (d.q !== undefined && state.current === 'quiz') {
      state.quiz.cur.answers[state.quiz.cur.i] = d.q;
      save();
      return render();
    }
    if (b.hasAttribute('data-quiznext')) {
      saveQuizAnswer();
      const cur = state.quiz.cur;
      if (cur.i >= cur.qs.length - 1) {
        const blanks = cur.qs.map((_, i) => cur.answers[i]).filter(a => a === null || a === undefined || a === '').length;
        if (blanks && !window.confirm(`You left ${blanks} question${blanks > 1 ? 's' : ''} blank. Finish anyway?`)) return;
        return finishQuiz();
      }
      cur.i++;
      clearCalculator();
      save();
      return render();
    }
    if (b.hasAttribute('data-quizback')) { saveQuizAnswer(); state.quiz.cur.i--; clearCalculator(); save(); return render(); }
  }

  function honorsAnswer(val) {
    const r = E().QUESTION[honorsQ.kind].grade(honorsQ, val);
    fb = { ok: !!r.ok, msg: r.msg };
    if (!r.ok) noteMistake(r.mistake);
    window.soundFx && (r.ok ? soundFx.playChime() : soundFx.playBuzzer());
    save();
    render();
  }

  function skipStep() {
    const p = part();
    if (p.kind === 'gym') { state.done.gym = true; save(); return nextPart(); }
    if (p.kind === 'honors' || p.kind === 'honorsSet') { state.honors.i = p.kinds.length; state.done.honors = true; save(); return render(); }
    if (p.kind === 'quiz') {
      if (!state.quiz.cur) return startQuiz();
      return finishQuiz();
    }
    const t = task();
    if (t && t.type === 'measure') fillRow(t.th);
    if (t && p.lab && idx() + 1 < tasksOf(p).length && tasksOf(p)[idx() + 1].showGraph) {
      LAB.ANGLES.forEach(fillRow);
    }
    advance();
  }

  function bindEvents() {
    $('taskCard').addEventListener('click', e => {
      const box = e.target.closest('[data-calcbox]');
      if (box && calcNeeds[box.dataset.calcbox]) { calcTarget = box.dataset.calcbox; updateGrabButton(); return; }
      onCardClick(e);
    });
    $('btnUseCalc').addEventListener('click', grabAnswer);
    $('taskCard').addEventListener('input', e => {
      if (e.target.dataset.input) drafts[e.target.dataset.input] = e.target.value;
      setStatus('');
    });
    $('taskCard').addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
      e.preventDefault();
      const b = $('taskCard').querySelector('[data-check],[data-measure],[data-gymcheck],[data-honorscheck],[data-quiznext]');
      if (b) b.click();
    });
    $('partStrip').addEventListener('click', e => {
      const cert = e.target.closest('[data-cert]');
      if (cert) { downloadCertificate(cert); return; }
      const b = e.target.closest('[data-part]');
      if (b && !b.disabled) goPart(b.dataset.part);
    });
    const setAngle = a => {
      labAngle = Math.max(0, Math.min(90, a));
      $('angleSlider').value = labAngle;
      const t = task();
      if (t && t.labAngle) Diagram.show(t.scene(ctx()));
    };
    $('angleSlider').addEventListener('input', e => setAngle(Number(e.target.value)));
    $('btnAngleDown').addEventListener('click', () => setAngle(labAngle - 5));
    $('btnAngleUp').addEventListener('click', () => setAngle(labAngle + 5));
    Diagram.init($('simCanvas'), setAngle);
    bindCalcDrag();
    $('btnCloseCalc').addEventListener('click', () => { calcOpenedByHand = false; toggleCalc(false); });
    bindTools();
  }

  function bindTools() {
    const root = document.documentElement;
    const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
    const syncLabels = () => {
      $('btn-theme-toggle').textContent = root.classList.contains('theme-dark') ? '☀️ Light' : '🌙 Dark';
      $('btn-projector-mode').classList.toggle('active', root.classList.contains('projector'));
      $('btnAudio').textContent = soundFx.enabled ? '🔊 On' : '🔇 Off';
    };
    $('btn-theme-toggle').addEventListener('click', () => {
      root.classList.remove('projector');
      store('vds_projector', 'off');
      const dark = root.classList.toggle('theme-dark');
      store('vds_theme', dark ? 'dark' : 'light');
      if (desmos && desmos.updateSettings) desmos.updateSettings({ invertedColors: dark });
      syncLabels();
      Diagram.render();
    });
    $('btn-projector-mode').addEventListener('click', () => {
      const on = root.classList.toggle('projector');
      if (on) root.classList.remove('theme-dark');
      store('vds_projector', on ? 'on' : 'off');
      syncLabels();
      Diagram.render();
    });
    $('btnAudio').addEventListener('click', () => { soundFx.setEnabled(!soundFx.enabled); syncLabels(); });
    $('viewSelect').addEventListener('change', e => {
      view = e.target.value;
      gymQ = null;
      if (state.current === 'honors' && !honorsOn()) state.current = 'gym';
      render();
    });
    syncLabels();
  }

  // The header wraps at projector size and in the teacher view; keep the workbench exactly on screen
  function fitWorkbench() {
    const header = document.querySelector('.app-header');
    const fit = () => {
      document.documentElement.style.setProperty('--header-h', `${header.offsetHeight + 1}px`);
      Diagram.render();
    };
    if (window.ResizeObserver) new ResizeObserver(fit).observe(header);
    fit();
  }

  function start(st, cl, prof) {
    state = st; cloud = cl; profile = prof;
    state.mistakes = state.mistakes || {};
    updateCert();
    if (isTeacher()) {
      $('viewWrap').hidden = false;
      $('btnMonitor').hidden = false;
    }
    if (profile.preview) {
      const params = new URLSearchParams(window.location.search);
      view = params.get('view') || 'cp';
    }
    bindEvents();
    fitWorkbench();
    // A worked row or lab data always needs the lab set up; a reload resumes the part's current scenario
    if (part().lab || part().needsData) ensureLab();
    if (part().kind === 'gym') nextGym();
    else if (part().kind === 'honorsSet') nextHonors();
    else if (idx() < tasksOf(part()).length) enterTask(true);   // same page, same numbers as when they left
    render();
  }

  return { start, newState, validState, scoreState, current: () => ({ gymQ, honorsQ, task: task(), desmos }) };
})();

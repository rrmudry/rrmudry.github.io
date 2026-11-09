// Centripetal Acceleration Workshop — runs the lesson: one page at a time, picture on the left, one task on the right.
// Saved after every step, so a student resumes on any device with the same numbers. Credit never drops.
// Built from Unit_2/monkey_hunter_studio/js/app.js.

const WorkshopApp = (function () {
  if (typeof document !== 'undefined') {
    document.addEventListener('contextmenu', e => e.preventDefault());
  }
  const $ = id => document.getElementById(id);
  const PR = window.PR, Lesson = window.Lesson, Scene = window.Scene;
  const STATE_VERSION = 1;
  const CERT_PERCENT = 75;   // Mastery Check score needed, on top of finishing every part, to earn the certificate
  const esc = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  let state, cloud, profile, tier;
  let fb = null;              // feedback on the current page
  let draft = '';             // what is in the answer box
  let draftWork = null;       // calculator line behind the answer
  let hintsOpen = 0;
  let sim = { t: 0, raf: null, reachedEnd: false };
  let desmos = null;

  // ---------- State ----------
  function newState() {
    const parts = {};
    Lesson.PARTS.filter(p => p.id !== 'quiz').forEach(p => { parts[p.id] = { i: 0, far: 0, done: false, sc: null, scAt: -1, ans: {}, q: null, trail: [] }; });
    return { v: STATE_VERSION, current: 'turn', parts, prediction: null, quiz: { best: 0, attempts: [], cur: null, last: null }, mistakes: {}, calcUnavailable: false, bestPoints: 0, savedAt: 0 };
  }
  const validState = st => !!(st && st.v === STATE_VERSION && st.parts && st.quiz && typeof st.current === 'string' && st.parts.turn);

  function scoreState(st, forTier = tier) {
    const earned = Math.round(Lesson.earnedPoints(st, forTier) * 10) / 10;
    st.bestPoints = Math.max(st.bestPoints || 0, earned);
    const req = Lesson.PARTS.filter(p => p.weight > 0);
    const progress = Object.fromEntries(req.map(p => [p.id, Math.round(Lesson.partProgress(st, p, forTier) * 100)]));
    const done = req.filter(p => st.parts[p.id] && st.parts[p.id].done).map(p => p.id);
    if ((st.quiz.attempts || []).length) done.push('quiz');
    const last = st.quiz.attempts[st.quiz.attempts.length - 1];
    return {
      points: st.bestPoints,
      percentage: Math.round(st.bestPoints * 10),
      progress, done,
      required: req.length + 1,
      quizBest: st.quiz.best || 0,
      quizHistory: st.quiz.attempts.map(a => a.pct),
      skills: last ? last.skills : {},
      mistakes: st.mistakes,
      calcUnavailable: !!st.calcUnavailable,
      cert: st.cert || null
    };
  }

  function save(immediate) {
    scoreState(state);
    if (cloud) cloud.queueSave(immediate);
    updateScoreChip();
  }

  const unlockedAll = () => profile.teacher || profile.preview;
  function isUnlocked(id) {
    if (unlockedAll()) return true;
    const list = Lesson.PARTS;
    const idx = list.findIndex(p => p.id === id);
    return idx === 0 || !!(state.parts[list[idx - 1].id] && state.parts[list[idx - 1].id].done);
  }

  // ---------- Where we are ----------
  const part = () => state.parts[state.current];
  const pages = () => Lesson.pages(state.current, tier);
  const page = () => (state.current === 'quiz' || !part() || part().i >= pages().length ? null : pages()[part().i]);
  const support = () => tier === 'conceptual';   // first hint open; never labeled

  function freshPage() { fb = null; draft = ''; draftWork = null; hintsOpen = support() ? 1 : 0; resetSim(); clearCalc(); }

  // A page marked fresh deals a new problem. The saved numbers come back on resume because scAt still matches.
  function dealIfNeeded() {
    const pg = page();
    if (!pg || !pg.fresh) return;
    const p = part();
    if (p.scAt === p.i) return;
    if (p.scAt >= 0) keepProblem(p);
    if (pg.mc) p.q = PR.makeConcept(pg.mc);
    else {
      p.sc = PR.newProblem(pg.make, pg.level || 2, p.sc);
      p.ans = {};
    }
    p.scAt = p.i;
    save();
  }

  // Each problem replaced by a new one is kept, so Back returns to the same numbers and answers.
  function keepProblem(p) {
    (p.trail = p.trail || []).push({ sc: p.sc, ans: p.ans, q: p.q, scAt: p.scAt });
  }
  function restoreProblem(p) {
    Object.assign(p, p.trail.pop());
  }

  // A page already answered correctly reopens answered, so Back never asks for it again.
  function showSavedAnswer() {
    const pg = page(), p = part();
    if (!pg) return;
    if (pg.mc && p.q && p.q.picked) { draft = p.q.picked; fb = PR.gradeConcept(p.q, draft); return; }
    if (!pg.ask) return;
    const step = PR.STEP[tier][pg.ask];
    if (typeof p.ans[step.k] !== 'number') return;
    const saved = String(p.ans[step.k]), r = PR.gradeStep(step, saved, p.sc, p.ans);
    if (r.ok) { draft = saved; fb = r; }
  }

  function enterPage() {
    freshPage();
    dealIfNeeded();
    showSavedAnswer();
  }

  function goTo(i) {
    const p = part();
    p.far = Math.max(p.far || 0, i);
    p.i = i;
    enterPage();
    save();
    render();
  }

  function previousPart() {
    const list = Lesson.PARTS, idx = list.findIndex(x => x.id === state.current);
    return idx > 0 ? list[idx - 1].id : null;
  }

  // Hidden while a wrong answer is showing: that answer's way forward is new numbers.
  const canGoBack = () => {
    if (fb && !fb.ok && !fb.retry) return false;
    return !!previousPart() || (part() && part().i > 0);
  };
  const backBtn = () => (canGoBack() ? '<button type="button" class="btn-secondary" id="btnBack">◀ Back</button>' : '');

  function goBack() {
    if (state.current === 'quiz') {
      const c = state.quiz.cur;
      if (c && c.i > 0) { c.i--; save(); loadQuizQuestion(); } else openPart(previousPart());
      return;
    }
    const p = part(), list = pages();
    p.trail = p.trail || [];
    if (p.i === 0) { if (previousPart()) openPart(previousPart()); return; }
    p.i = Math.min(p.i, list.length) - 1;
    const usesProblem = list[p.i].ask || list[p.i].mc;
    while (usesProblem && p.scAt > p.i && p.trail.length) restoreProblem(p);
    enterPage();
    save();
    render();
  }

  function advance() {
    const p = part(), list = pages();
    if (p.i + 1 >= list.length) { finishPart(); return; }
    goTo(p.i + 1);
  }

  function finishPart() {
    const p = part();
    p.far = pages().length;
    p.done = true;
    p.i = pages().length;
    freshPage();
    save(true);
    render();
  }

  // Wrong answer: same part, new numbers, back to where this problem began.
  function restartProblem() {
    const p = part(), list = pages();
    let i = p.i;
    while (i > 0 && !list[i].fresh) i--;
    p.i = i; p.scAt = -1;
    freshPage();
    dealIfNeeded();
    save();
    render();
  }

  function openPart(id) {
    if (!isUnlocked(id)) return;
    state.current = id;
    const p = part();
    if (p && p.done && p.i >= pages().length) p.i = pages().length;
    enterPage();
    if (id === 'quiz' && state.quiz.cur) {
      const c = state.quiz.cur;
      draft = c.answers[c.i] === null || c.answers[c.i] === undefined ? '' : c.answers[c.i];
    }
    save();
    render();
  }

  function recordMistake(id) {
    if (!id || id === 'blank') return;
    state.mistakes[id] = (state.mistakes[id] || 0) + 1;
  }

  // ---------- Stepping through motion ----------
  function resetSim() {
    if (sim.raf) cancelAnimationFrame(sim.raf);
    sim = { t: 0, raf: null, reachedEnd: false };
  }

  // { T, launch: one press plays it all, require: must finish before Next, label }
  function stepperOf() {
    if (state.current === 'quiz') return null;
    const pg = page();
    return pg && pg.stepper ? pg.stepper : null;
  }

  function animateTo(target, ms, done) {
    if (sim.raf) cancelAnimationFrame(sim.raf);
    const from = sim.t, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || ms <= 0) { sim.t = target; renderScene(); renderReadout(); done && done(); return; }
    const start = performance.now();
    const tick = now => {
      const f = Math.min(1, (now - start) / ms);
      sim.t = from + (target - from) * f;
      renderScene();
      if (f < 1) sim.raf = requestAnimationFrame(tick);
      else { sim.raf = null; sim.t = target; renderScene(); renderReadout(); done && done(); }
    };
    sim.raf = requestAnimationFrame(tick);
  }

  function nextSecond() {
    const st = stepperOf();
    if (!st || sim.raf || sim.t >= st.T - 1e-6) return;
    animateTo(Math.min(st.T, Math.floor(sim.t + 1e-6) + 1), 650, afterMove);
  }

  function afterMove() {
    const st = stepperOf();
    if (st && sim.t >= st.T - 1e-6 && !sim.reachedEnd) {
      sim.reachedEnd = true;
      renderTask();   // shows the takeaway and opens the Next button
    }
    renderControls();
  }

  function playFlight() {
    const st = stepperOf();
    if (!st) return;
    sim.t = 0;
    animateTo(st.T, Math.min(5200, Math.max(1800, st.T * 700)), afterMove);
  }

  function restartSim() {
    if (sim.raf) cancelAnimationFrame(sim.raf);
    sim.raf = null; sim.t = 0;
    renderScene(); renderReadout(); renderControls();
  }

  // ---------- Picture ----------
  const TEACH_END = () => ({ mode: 'circle', phi: 60, showA: true, aLabel: 'a_c', vLabel: 'v' });

  function sceneOpts() {
    if (state.current === 'quiz') return quizScene();
    const p = part(), pg = page();
    if (!pg) return TEACH_END();
    if (pg.scene) {
      const o = pg.scene();
      if (pg.stepper) o.t = sim.t;
      return o;
    }
    if (pg.mc) return PR.CONCEPT[pg.mc].scene(p.q);
    return Lesson.problemScene(tier, p.sc, p.ans);
  }

  function renderScene() {
    $('stage').innerHTML = Scene.render(sceneOpts());
  }

  function renderReadout() {
    const box = $('readout');
    const st = stepperOf();
    if (!st || st.launch || st.label) { box.hidden = true; return; }
    box.innerHTML = `<span class="clock"><span class="clock-label">Time</span> <strong>${Math.floor(sim.t + 1e-6)} s</strong></span>`;
    box.hidden = false;
  }

  function renderControls() {
    const box = $('stageCtl');
    const st = stepperOf();
    if (!st) { box.hidden = true; return; }
    box.hidden = false;
    const ended = sim.t >= st.T - 1e-6;
    if (st.launch) {
      $('btnNextSecond').hidden = true;
      $('btnPlay').hidden = false;
      $('btnPlay').textContent = sim.t > 0 ? `↺ ${st.label || 'Play'} again` : `▶ ${st.label || 'Play'}`;
      $('btnPlay').disabled = !!sim.raf;
      $('btnStartOver').hidden = true;
    } else {
      $('btnNextSecond').hidden = false;
      $('btnNextSecond').textContent = `▶ ${st.label || 'Next second'}`;
      $('btnNextSecond').disabled = ended;
      $('btnPlay').hidden = true;
      // Holds its place at the start so the step button never moves under the student's finger
      $('btnStartOver').hidden = false;
      $('btnStartOver').style.visibility = sim.t === 0 ? 'hidden' : '';
    }
  }

  // What the student has found so far stays on screen
  function renderSolved() {
    const box = $('solved');
    let ans = null;
    if (state.current === 'quiz') {
      const c = state.quiz.cur, q = c && c.qs[c.i];
      if (q && q.kind === 'step') ans = chainFor(c, q.f, c.i);
    } else if (page() && page().ask) ans = part().ans;
    const rows = [['factor', 'new a_c is', '× as big', 'a'], ['newac', 'new a_c', 'm/s²', 'a'], ['v', 'v', 'm/s', 'v'], ['ac', 'a_c', 'm/s²', 'a'], ['vmax', 'v', 'm/s', 'v']];
    const html = ans ? rows.filter(([k]) => typeof ans[k] === 'number')
      .map(([k, sym, unit, cls]) => `<span class="solved-chip solved-${cls}">${subHTML(k === 'factor' ? `${sym} ${PR.fmt(ans[k])} ${unit}` : `${sym} = ${PR.fmt(ans[k])} ${unit}`)}</span>`).join('') : '';
    box.innerHTML = html;
  }

  // ---------- Task card ----------
  function renderTask() {
    if (state.current === 'quiz') { renderQuiz(); syncCalc(); return; }
    const pg = page();
    let html;
    if (!pg) html = donePartHTML();
    else if (pg.mc) html = mcHTML(part().q, pg.mc, pageHeader());
    else if (pg.predict) html = predictHTML(pg);
    else if (pg.ask) html = stepHTML(PR.STEP[tier][pg.ask], part().sc, part().ans);
    else html = teachHTML(pg);
    $('taskCard').innerHTML = subHTML(html);
    bindTask();
    syncCalc();
  }

  function progressLabel() {
    const p = part(), n = pages().length;
    return `Step ${Math.min(p.i + 1, n)} of ${n}`;
  }

  const readBtn = '<button type="button" class="btn-read" id="btnRead" title="Read this page out loud">🔊 Read to me</button>';
  const pageHeader = () => `<div class="task-top"><span class="task-count">${progressLabel()}</span>${readBtn}</div>`;

  function teachHTML(pg) {
    const needsEnd = pg.stepper && pg.stepper.require && !sim.reachedEnd;
    const wait = pg.stepper ? `Press ${pg.stepper.label || 'Next second'} first` : '';
    return `${pageHeader()}<h2 class="task-title">${pg.title}</h2>
      <div class="task-body" id="readable">${pg.body}${pg.after && sim.reachedEnd ? `<div class="takeaway">${pg.after}</div>` : ''}</div>
      <div class="task-actions">
        ${backBtn()}
        <button type="button" class="btn-primary" id="btnNext" ${needsEnd ? 'disabled' : ''}>${needsEnd ? wait : 'Next ▶'}</button>
      </div>`;
  }

  function predictHTML(pg) {
    const opts = pg.options.map(o => `<button type="button" class="opt ${state.prediction === o.id ? 'opt-picked' : ''}" data-predict="${o.id}">${o.t}</button>`).join('');
    return `${pageHeader()}<h2 class="task-title">${pg.title}</h2>
      <div class="task-body" id="readable">${pg.body}</div>
      <div class="opts">${opts}</div>
      <div class="task-actions">${backBtn()}</div>`;
  }

  function hintsHTML(hints) {
    if (!hints.length) return '';
    const shown = hints.slice(0, hintsOpen).map(h => `<div class="hint">💡 ${h}</div>`).join('');
    const more = hintsOpen < hints.length ? `<button type="button" class="btn-hint" id="btnHint">${hintsOpen ? 'Another hint' : 'Show a hint'}</button>` : '';
    return `<div class="hints">${shown}${more}</div>`;
  }

  function answerBox(step, disabled) {
    const useCalc = step.calc && window.Desmos;
    if (step.calc && !window.Desmos) state.calcUnavailable = true;
    return `<label class="ans-row"><span class="ans-sym">${step.sym}${step.noEq ? '' : ' ='}</span>
      <input id="answer" type="text" inputmode="decimal" autocomplete="off" value="${esc(draft)}"
        ${useCalc ? 'readonly tabindex="-1" class="calc-readonly" placeholder="calculator"' : ''} ${disabled ? 'disabled' : ''}
        aria-label="${step.sym.replace(/_/g, ' ')}${useCalc ? ', filled in from the calculator' : ''}">
      <span class="ans-unit">${step.unit}</span></label>`;
  }

  function stepHTML(step, sc, ans) {
    const answered = !!fb && !fb.retry;
    const formula = step.formula(sc, ans);
    const hints = step.hints(sc, ans);
    return `${pageHeader()}<h2 class="task-title" id="readable">${step.ask(sc, ans)}</h2>
      ${formula ? `<p class="formula-box"><span class="formula">${formula}</span></p>` : ''}
      ${answerBox(step, answered)}
      ${fbHTML()}
      <div class="task-actions">${backBtn()}${answered ? fbActions() : '<button type="button" class="btn-primary" id="btnCheck">Check</button>'}</div>
      ${answered ? '' : hintsHTML(hints)}`;
  }

  function fbHTML() {
    if (!fb) return '';
    if (fb.retry) return `<div class="feedback fb-retry" role="status">${fb.msg}</div>`;
    return `<div class="feedback ${fb.ok ? 'fb-ok' : 'fb-bad'}" role="status"><strong>${fb.ok ? '✓ Correct!' : '✗ Not yet.'}</strong> ${fb.msg || ''}</div>`;
  }

  const fbActions = () => (fb.ok
    ? '<button type="button" class="btn-primary" id="btnNext">Next ▶</button>'
    : '<button type="button" class="btn-primary" id="btnNew">Try new numbers ▶</button>');

  function mcHTML(q, id, top) {
    const def = PR.CONCEPT[id];
    const answered = !!fb;
    const opts = PR.conceptOptions(q).map(o => {
      const cls = !answered ? '' : o.id === def.right(q) ? 'opt-right' : o.id === draft ? 'opt-wrong' : '';
      return `<button type="button" class="opt ${cls} ${o.id === draft ? 'opt-picked' : ''} ${def.letters ? 'opt-letter' : ''}" data-opt="${o.id}" ${answered ? 'disabled' : ''}>${o.t}</button>`;
    }).join('');
    return `${top}<h2 class="task-title" id="readable">${def.text(q)}</h2>
      <div class="opts ${def.letters ? 'opts-letters' : ''}">${opts}</div>${fbHTML()}
      <div class="task-actions">${backBtn()}${answered ? fbActions() : ''}</div>`;
  }

  function donePartHTML() {
    const list = Lesson.PARTS, idx = list.findIndex(p => p.id === state.current);
    const next = list[idx + 1];
    return `<div class="done-card"><div class="done-mark" aria-hidden="true">✅</div>
      <h2 class="task-title">${list[idx].label} finished!</h2>
      <p>Your credit for this part is saved.</p>
      <div class="task-actions">
        ${backBtn()}
        <button type="button" class="btn-secondary" id="btnReview">Go through it again</button>
        ${next ? `<button type="button" class="btn-primary" data-part="${next.id}">${next.label} ▶</button>` : ''}
      </div></div>`;
  }

  // ---------- Checking ----------
  function check() {
    const pg = page(), step = PR.STEP[tier][pg.ask], p = part();
    if (PR.parseNum(draft) === null) { showBoxError(step.calc && window.Desmos ? 'Use the calculator, then press its Use calculator answer button.' : 'Type a number first.'); return; }
    const r = PR.gradeStep(step, draft, p.sc, p.ans);
    fb = r;
    if (r.ok) p.ans[step.k] = PR.parseNum(draft);
    else if (r.retry) { draft = ''; recordMistake(r.mistake); }
    else recordMistake(r.mistake);
    save();
    render();
  }

  function showBoxError(msg) {
    fb = { retry: true, msg };
    renderTask();
  }

  function pickOption(id) {
    if (state.current === 'quiz') {
      const c = state.quiz.cur;
      c.answers[c.i] = id;
      save();
      renderTask();
      return;
    }
    draft = id;
    const r = PR.gradeConcept(part().q, id);
    fb = r;
    if (r.ok) part().q.picked = id;
    else recordMistake(r.mistake);
    save();
    render();
  }

  function bindTask() {
    const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
    on('btnNext', advance);
    on('btnNew', restartProblem);
    on('btnCheck', check);
    on('btnBack', goBack);
    on('btnHint', () => { hintsOpen++; renderTask(); });
    on('btnRead', readAloud);
    on('btnReview', () => { part().i = 0; part().scAt = -1; part().trail = []; enterPage(); save(); render(); });
    on('btnStartQuiz', startQuiz);
    on('btnQuizNext', quizNext);
    document.querySelectorAll('#taskCard [data-cert]').forEach(b => b.addEventListener('click', () => downloadCertificate(b)));
    document.querySelectorAll('#taskCard [data-opt]').forEach(b => b.addEventListener('click', () => pickOption(b.dataset.opt)));
    document.querySelectorAll('#taskCard [data-part]').forEach(b => b.addEventListener('click', () => openPart(b.dataset.part)));
    document.querySelectorAll('#taskCard [data-predict]').forEach(b => b.addEventListener('click', () => { state.prediction = b.dataset.predict; advance(); }));
    const input = $('answer');
    if (input && !input.readOnly) {
      input.addEventListener('input', () => { draft = input.value; quizSaveDraft(); });
      input.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        if ($('btnCheck')) check();
        else if ($('btnQuizNext')) quizNext();
      });
      if (!input.disabled) input.focus({ preventScroll: true });
    }
  }

  function readAloud() {
    if (!window.speechSynthesis) return;
    const el = $('readable');
    if (!el) return;
    speechSynthesis.cancel();
    const clean = el.innerText.replace(/\s*\n+\s*=\s*\n+\s*/g, ' equals ')
      .replace(/a\s*c\b/g, 'a c').replace(/v²/g, 'v squared').replace(/²/g, ' squared')
      .replace(/√/g, 'the square root of ').replace(/π/g, ' pi ').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/→/g, ' gives ');
    speechSynthesis.speak(new SpeechSynthesisUtterance(clean));
  }

  // ---------- Mastery Check ----------
  const chainFor = (quiz, f, upTo) => {
    const chain = {};
    quiz.qs.forEach((q, i) => {
      if (i >= upTo || q.kind !== 'step' || q.f !== f) return;
      const v = PR.parseNum(quiz.answers[i]);
      if (v !== null) chain[PR.STEP[quiz.tier][q.k].k] = v;
    });
    return chain;
  };

  function quizScene() {
    const c = state.quiz.cur;
    if (!c) return TEACH_END();
    const q = c.qs[c.i];
    if (q.kind === 'mc') return PR.CONCEPT[q.id].scene(q);
    return Lesson.problemScene(tier, c.probs[q.f], chainFor(c, q.f, c.i));
  }

  function startQuiz() {
    state.quiz.cur = PR.buildQuiz(tier);
    state.quiz.cur.startedAt = Date.now();
    loadQuizQuestion();
    save(true);
  }

  function loadQuizQuestion() {
    const c = state.quiz.cur;
    freshPage();
    draft = c.answers[c.i] === null || c.answers[c.i] === undefined ? '' : c.answers[c.i];
    render();
  }

  function quizSaveDraft() {
    if (state.current !== 'quiz' || !state.quiz.cur) return;
    const c = state.quiz.cur;
    c.answers[c.i] = draft;
    c.work[c.i] = draftWork;
    save();
  }

  function quizNext() {
    const c = state.quiz.cur, q = c.qs[c.i];
    const value = q.kind === 'mc' ? c.answers[c.i] : draft;
    if (value === null || value === undefined || value === '') {
      $('quizMsg').textContent = q.kind === 'mc' ? 'Choose an answer first.' : 'Enter an answer first.';
      return;
    }
    if (q.kind === 'step') { c.answers[c.i] = draft; c.work[c.i] = draftWork || c.work[c.i]; }
    if (c.i + 1 < c.qs.length) { c.i++; save(); loadQuizQuestion(); return; }
    finishQuiz();
  }

  function finishQuiz() {
    const c = state.quiz.cur;
    const g = PR.gradeQuiz(c);
    g.results.forEach(r => { if (!r.ok) recordMistake(r.mistake); });
    state.quiz.attempts.push({
      pct: g.pct, correct: g.correct, total: g.total, at: Date.now(),
      secs: c.startedAt ? Math.round((Date.now() - c.startedAt) / 1000) : null,
      skills: g.skills
    });
    state.quiz.best = Math.max(state.quiz.best || 0, g.pct);
    state.quiz.last = c;
    state.quiz.cur = null;
    updateCert();
    freshPage();
    save(true);
    render();
  }

  const SKILL_LABEL = { pattern: 'Speed and radius patterns', ac: 'Finding a_c', period: 'Speed from one lap', backward: 'Fastest safe speed', concept: 'Big ideas' };

  function quizIntro() {
    const n = PR.buildQuiz(tier);
    const steps = n.qs.filter(q => q.kind === 'step').length, mcs = n.qs.length - steps;
    return `You will answer <strong>${steps} calculation steps</strong> and <strong>${mcs} questions</strong>.`;
  }

  function renderQuiz() {
    const q = state.quiz;
    let html;
    if (q.cur) html = quizQuestionHTML();
    else if (q.attempts.length) html = quizResultsHTML();
    else {
      html = `<h2 class="task-title">Mastery Check</h2>
        <div class="task-body" id="readable">
          <p>${quizIntro()}</p>
          <p>You will not see right or wrong until the end. If one answer is off, later steps that use it still earn credit when your work is right.</p>
          <p>You can retake it with new numbers. Your <strong>best score</strong> counts for 4 of your 10 points.</p>
        </div>
        ${certHTML()}
        <div class="task-actions">${backBtn()}<button type="button" class="btn-primary" id="btnStartQuiz">Start ▶</button></div>`;
    }
    $('taskCard').innerHTML = subHTML(html);
    bindTask();
  }

  function quizQuestionHTML() {
    const c = state.quiz.cur, q = c.qs[c.i];
    const top = `<div class="task-top"><span class="task-count">Question ${c.i + 1} of ${c.qs.length}</span>${readBtn}</div>`;
    const nextLabel = c.i + 1 < c.qs.length ? 'Next ▶' : 'Finish';
    const actions = `<p id="quizMsg" class="quiz-msg" role="alert"></p><div class="task-actions">
      ${backBtn()}
      <button type="button" class="btn-primary" id="btnQuizNext">${nextLabel}</button></div>`;
    if (q.kind === 'mc') {
      const def = PR.CONCEPT[q.id];
      const opts = PR.conceptOptions(q).map(o => `<button type="button" class="opt ${c.answers[c.i] === o.id ? 'opt-picked' : ''} ${def.letters ? 'opt-letter' : ''}" data-opt="${o.id}">${o.t}</button>`).join('');
      return `${top}<h2 class="task-title" id="readable">${def.text(q)}</h2><div class="opts ${def.letters ? 'opts-letters' : ''}">${opts}</div>${actions}`;
    }
    const step = PR.STEP[tier][q.k], sc = c.probs[q.f], ans = chainFor(c, q.f, c.i);
    const formula = step.formula(sc, ans);
    return `${top}<p class="launch-tag">Problem ${q.f + 1}</p><h2 class="task-title" id="readable">${step.ask(sc, ans)}</h2>
      ${formula ? `<p class="formula-box"><span class="formula">${formula}</span></p>` : ''}
      ${answerBox(step, false)}${fbHTML()}${actions}`;
  }

  function quizResultsHTML() {
    const q = state.quiz, last = q.attempts[q.attempts.length - 1];
    const g = q.last ? PR.gradeQuiz(q.last) : null;
    const skills = Object.entries(last.skills || {}).map(([k, v]) => {
      const pct = Math.round(100 * v.right / v.total);
      return `<div class="skill-row"><span>${SKILL_LABEL[k] || k}</span><span class="skill-bar"><span style="width:${pct}%"></span></span><span class="skill-val">${v.right}/${v.total}</span></div>`;
    }).join('');
    const misses = g ? g.results.filter(r => !r.ok).slice(0, 3).map(r => `<li>${r.msg}</li>`).join('') : '';
    const s = scoreState(state);
    return `<h2 class="task-title">Mastery Check results</h2>
      <div class="score-big"><strong>${last.pct}%</strong><span>this try · best ${q.best}%</span></div>
      <p class="grade-line">Your grade so far: <strong class="nowrap">${s.points.toFixed(1)} / 10</strong></p>
      ${certHTML()}
      <div class="skills">${skills}</div>
      ${misses ? `<div class="task-body"><p><strong>Look at these:</strong></p><ul class="misses">${misses}</ul></div>` : ''}
      <div class="task-actions">${backBtn()}<button type="button" class="${certStatus().ready ? 'btn-secondary' : 'btn-primary'}" id="btnStartQuiz">Retake with new numbers ▶</button></div>`;
  }

  // ---------- Part strip + score ----------
  function renderStrip() {
    $('partStrip').innerHTML = Lesson.PARTS.map(p => {
      const open = isUnlocked(p.id), on = state.current === p.id;
      const pct = p.id === 'quiz' ? (state.quiz.best || 0) : Math.round(Lesson.partProgress(state, p, tier) * 100);
      const finished = p.id === 'quiz' ? state.quiz.attempts.length > 0 : state.parts[p.id].done;
      return `<button type="button" class="part-tab ${on ? 'part-on' : ''} ${finished ? 'part-done' : ''}" data-part="${p.id}" ${open ? '' : 'disabled'} ${on ? 'aria-current="step"' : ''}>
        <span class="part-name">${open ? p.icon : '🔒'} ${p.label}${finished && p.id !== 'quiz' ? ' ✓' : ''}</span>
        <span class="part-bar"><span style="width:${pct}%"></span></span></button>`;
    }).join('');
    document.querySelectorAll('#partStrip [data-part]').forEach(b => b.addEventListener('click', () => openPart(b.dataset.part)));
  }

  function updateScoreChip() {
    const el = $('scoreChip');
    if (el && state) el.textContent = `${(state.bestPoints || 0).toFixed(1)} / 10`;
    $('btnCert').hidden = !(certStatus().ready && (!profile.guest || profile.preview));
  }

  // ---------- Completion certificate ----------
  function certStatus() {
    const missing = Lesson.PARTS.filter(p => p.weight > 0 && !state.parts[p.id].done);
    const best = state.quiz.best || 0;
    return { ready: !missing.length && state.quiz.attempts.length > 0 && best >= CERT_PERCENT, missing, best };
  }

  // Remembers the day it was first earned; the code follows the best score, which can still rise
  function updateCert() {
    if (profile.guest && !profile.preview) return;
    if (!certStatus().ready) return;
    const id = profile.preview ? 'SAMPLE' : (cloud && cloud.studentId) || 'TEACHER';
    const code = Certificate.code(id, state.quiz.best);
    if (state.cert && state.cert.code === code) return;
    state.cert = { code, at: (state.cert && state.cert.at) || Date.now() };
  }

  function certHTML() {
    const c = certStatus();
    if (profile.guest && !profile.preview) {
      return '<div class="cert-box cert-wait">🎓 <strong>Certificates are for signed-in students.</strong> Sign in with your school account to earn yours.</div>';
    }
    if (c.ready) {
      return '<div class="cert-box cert-ready"><strong>🎓 You earned your certificate!</strong><button type="button" class="btn-primary" data-cert>📄 Download certificate (PDF)</button></div>';
    }
    const need = c.missing.length ? `finish ${c.missing.map(p => p.label).join(', ')} and ` : '';
    return `<div class="cert-box cert-wait">🎓 <strong>Earn your certificate:</strong> ${need}score ${CERT_PERCENT}% or higher on the Mastery Check. Your best so far is <span class="nowrap">${c.best}%</span>.</div>`;
  }

  async function downloadCertificate(btn) {
    updateCert();
    if (!state.cert) return;
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Making your certificate…';
    try {
      await Certificate.download({
        name: profile.preview ? 'Sample Student' : profile.name,
        sample: !!profile.preview,
        best: state.quiz.best,
        honors: tier === 'honors',
        period: profile.teacher ? 'Teacher' : (profile.period !== null && profile.period !== undefined) ? `Period ${profile.period}` : '',
        earned: state.cert.at,
        code: state.cert.code
      });
      btn.textContent = label;
    } catch (e) {
      console.error('Certificate failed:', e);
      btn.textContent = 'It did not download. Try again';
    }
    btn.disabled = false;
    save(true);
  }

  function render() {
    renderStrip();
    renderScene();
    renderReadout();
    renderControls();
    renderSolved();
    renderTask();
    updateScoreChip();
  }

  // ---------- Calculator ----------
  function toggleCalc(open) {
    const panel = $('calcPanel');
    panel.hidden = !open;
    document.body.classList.toggle('calc-open', open);
    if (!open) return;
    if (!window.Desmos) return;
    if (!desmos) {
      try {
        desmos = Desmos.ScientificCalculator($('calcHost'), {
          degreeMode: true,
          invertedColors: document.documentElement.classList.contains('theme-dark'),
          fontSize: Desmos.FontSizes ? Desmos.FontSizes.LARGE : undefined
        });
      } catch (e) {
        $('calcHost').innerHTML = '<p class="calc-missing">The calculator did not load.</p>';
      }
    } else if (desmos.resize) desmos.resize();
  }

  function clearCalc() { if (desmos && desmos.setBlank) desmos.setBlank(); sayCalc(''); }

  function sayCalc(msg) {
    $('calcMsg').hidden = !msg;
    $('calcMsg').innerHTML = msg ? subHTML(msg) : '';
  }

  // The step whose answer the calculator should fill in right now, with its needs
  function calcTarget() {
    if (state.current === 'quiz') {
      const c = state.quiz.cur, q = c && c.qs[c.i];
      if (!q || q.kind !== 'step') return null;
      const step = PR.STEP[tier][q.k];
      return step.calc ? { step, sc: c.probs[q.f], ans: chainFor(c, q.f, c.i) } : null;
    }
    const pg = page();
    if (!pg || !pg.ask || (fb && !fb.retry)) return null;
    const step = PR.STEP[tier][pg.ask];
    return step.calc ? { step, sc: part().sc, ans: part().ans } : null;
  }

  function syncCalc() {
    const t = calcTarget();
    toggleCalc(!!(t && window.Desmos));
  }

  function grabAnswer() {
    const t = calcTarget();
    if (!t || !desmos) return;
    const work = window.Engine.readCalculator(desmos.getState());
    if (work.empty) return sayCalc('Type your calculation into the calculator first.');
    if (work.unreadable) return sayCalc('The calculator line is not finished. Check it, or press "clear all" and type it again.');
    const problem = PR.workProblem(work, t.step.needs ? t.step.needs(t.sc, t.ans) : {});
    if (problem) return sayCalc(problem);
    sayCalc('');
    draft = String(Number(work.value.toFixed(3)));
    draftWork = work.latex;
    if (fb && fb.retry) fb = null;
    quizSaveDraft();
    renderTask();
  }

  function bindCalcDrag() {
    const panel = $('calcPanel'), head = $('calcHead');
    let grab = null;
    head.addEventListener('pointerdown', e => {
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

  // ---------- Display tools ----------
  function bindTools() {
    const root = document.documentElement;
    const setTheme = () => {
      $('btn-theme-toggle').textContent = root.classList.contains('theme-dark') ? '☀️ Light' : '🌙 Dark';
      $('btn-projector-mode').classList.toggle('btn-on', root.classList.contains('projector'));
    };
    $('btn-theme-toggle').addEventListener('click', () => {
      root.classList.remove('projector');
      root.classList.toggle('theme-dark');
      try {
        localStorage.setItem('caw_theme', root.classList.contains('theme-dark') ? 'dark' : 'light');
        localStorage.setItem('caw_projector', 'off');
      } catch (e) { /* storage blocked */ }
      if (desmos && desmos.updateSettings) desmos.updateSettings({ invertedColors: root.classList.contains('theme-dark') });
      setTheme();
    });
    $('btn-projector-mode').addEventListener('click', () => {
      const on = !root.classList.contains('projector');
      root.classList.toggle('projector', on);
      if (on) root.classList.remove('theme-dark');
      try { localStorage.setItem('caw_projector', on ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
      setTheme();
    });
    setTheme();
  }

  function start(s, c, prof) {
    state = s; cloud = c; profile = prof; tier = prof.tier;
    $('btnNextSecond').addEventListener('click', nextSecond);
    $('btnPlay').addEventListener('click', playFlight);
    $('btnStartOver').addEventListener('click', restartSim);
    $('btnUseCalc').addEventListener('click', grabAnswer);
    $('btnCert').addEventListener('click', () => downloadCertificate($('btnCert')));
    bindCalcDrag();
    bindTools();
    if (state.current !== 'quiz' && !state.parts[state.current]) state.current = 'turn';
    enterPage();
    if (state.current === 'quiz' && state.quiz.cur) {
      const cur = state.quiz.cur;
      draft = cur.answers[cur.i] === null || cur.answers[cur.i] === undefined ? '' : cur.answers[cur.i];
    }
    if (prof.teacher || prof.preview) {
      $('viewWrap').hidden = false;
      $('viewSelect').value = prof.previewView || 'teacher';
      $('viewSelect').addEventListener('change', e => {
        location.search = e.target.value === 'teacher' ? '' : `?preview&view=${e.target.value}`;
      });
    }
    if (prof.teacher) $('btnMonitor').hidden = false;
    render();
  }

  return { start, newState, validState, scoreState, debug: () => ({ state, tier, sim, fb, desmos }) };
})();

window.WorkshopApp = WorkshopApp;

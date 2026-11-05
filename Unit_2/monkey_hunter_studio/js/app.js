// Monkey Hunter Studio — runs the lesson: one page at a time, picture on the left, one task on the right.
// Saved after every step, so a student resumes on any device with the same numbers. Credit never drops.

const HunterApp = (function () {
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
  let rig = { tilt: 30, speed: 30 };   // where the sliders sit; a resting setting, so it isn't saved
  let dragging = null;        // the mark whose string is being pulled
  let desmos = null;

  // ---------- State ----------
  function newState() {
    const parts = {};
    Lesson.PARTS.filter(p => p.id !== 'quiz').forEach(p => { parts[p.id] = { i: 0, far: 0, done: false, sc: null, scAt: -1, ans: {}, q: null, trail: [] }; });
    return { v: STATE_VERSION, current: 'line', parts, table: {}, build: [0, 0, 0, 0], built: false, prediction: null, quiz: { best: 0, attempts: [], cur: null, last: null }, mistakes: {}, calcUnavailable: false, bestPoints: 0, savedAt: 0 };
  }
  const validState = st => !!(st && st.v === STATE_VERSION && st.parts && st.quiz && typeof st.current === 'string' && st.parts.line);

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
      if (pg.make === 'at') p.sc = { at: PR.pick(tier === 'conceptual' ? [5, 6, 7] : [1.5, 2.5, 3.5, 5, 6].filter(a => !p.sc || a !== p.sc.at)) };
      else if (pg.make === 'min') p.sc = PR.newMinSpeed();
      else p.sc = PR.newHunt(tier, pg.level || 2, p.sc);
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
    if (pg.build) { if (state.built) fb = { ok: true, msg: 'Your strings match your drop table.' }; return; }
    if (pg.measure) {
      sim.t = pg.measure - 1;
      if (typeof state.table[pg.measure] !== 'number') return;
      sim.t = pg.measure;
      sim.reachedEnd = true;
      draft = String(state.table[pg.measure]);
      fb = PR.gradeStep(PR.STEP[tier][pg.ask], draft, null, null);
      return;
    }
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
    const pg = page();
    if (pg && pg.control === 'tilt') rig.tilt = 0;
    if (pg && pg.control === 'speed') { rig.tilt = 30; rig.speed = 30; }
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
    const usesProblem = list[p.i].ask || list[p.i].mc || list[p.i].replay;
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

  // ---------- Stepping through a launch ----------
  function resetSim() {
    if (sim.raf) cancelAnimationFrame(sim.raf);
    sim = { t: 0, raf: null, reachedEnd: false };
  }

  // { T, launch: one press plays it all, require: must finish before Next }
  function stepperOf() {
    if (state.current === 'quiz') return null;
    const pg = page();
    if (!pg) return null;
    if (pg.stepper) return pg.stepper;
    if (pg.measure) return { T: pg.measure, require: true, from: pg.measure - 1 };
    if (pg.replay) return { T: part().sc.t, launch: true, replay: true };
    return null;
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

  // The tilt and speed pages count only after the student really changed the setting
  function settingChanged() {
    const pg = page();
    if (pg && pg.control === 'tilt') return rig.tilt >= 20;
    if (pg && pg.control === 'speed') return rig.speed !== 30;
    return true;
  }

  function afterMove() {
    const st = stepperOf();
    if (st && sim.t >= st.T - 1e-6 && !sim.reachedEnd && settingChanged()) {
      sim.reachedEnd = true;
      renderTask();   // shows the takeaway and opens the Next button
    }
    renderControls();
  }

  function playFlight() {
    const st = stepperOf();
    if (!st) return;
    sim.t = 0;
    animateTo(st.T, Math.min(4200, Math.max(1800, st.T * 700)), afterMove);
  }

  function restartSim() {
    const st = stepperOf();
    if (sim.raf) cancelAnimationFrame(sim.raf);
    sim.raf = null; sim.t = st && st.from ? st.from : 0;
    renderScene(); renderReadout(); renderControls();
  }

  // ---------- Picture ----------
  const TEACH_END = () => ({ mode: 'hunt', sc: PR.teachHunt(), t: 4, fullPath: true });

  function askScene(pg, sc, ans) {
    if (pg.sceneKind === 'at') return { mode: 'ruler', t: 0, note: `t = ${PR.fmt(sc.at)} s` };
    if (pg.sceneKind === 'min') return { mode: 'hunt', sc: PR.hunt(sc.D / 2, sc.H / 2, 2), t: 0, noStrings: true, labels: { D: true, H: true } };
    if (pg.sceneKind === 'line' || pg.sceneKind === 'split') {
      const labels = pg.sceneKind === 'split' ? { v0: true, th: true } : { vox: true, voy: true };
      return { mode: 'hunt', sc, gravity: false, noMonkey: true, stickT: sc.t, starAt: sc.t, labels, note: `The star is at t = ${PR.fmt(sc.t)} s` };
    }
    if (pg.kind === 'early') {
      return Object.assign(Lesson.problemScene(tier, sc, ans, 'hold'), { hold: false, early: 1, note: 'Monkey lets go 1 s before launch' });
    }
    return Lesson.problemScene(tier, sc, ans, pg.kind || 'meet');
  }

  function sceneOpts() {
    if (state.current === 'quiz') return quizScene();
    const p = part(), pg = page();
    if (!pg) return TEACH_END();
    if (pg.build) return { mode: 'rig', tilt: 0, speed: 30, strings: state.build, drag: !state.built, active: dragging };
    if (pg.scene) {
      const o = pg.scene();
      if (pg.stepper) o.t = sim.t;
      if (o.mode === 'rig') {
        if (pg.control) { o.tilt = rig.tilt; o.speed = pg.control === 'speed' ? rig.speed : 30; }
        if (!o.strings) o.strings = PR.DROPS;
      }
      return o;
    }
    if (pg.mc) return PR.CONCEPT[pg.mc].scene(p.q);
    if (pg.measure) return { mode: 'ruler', t: sim.t };
    if (pg.replay === 'hold') return { mode: 'hunt', sc: p.sc, t: sim.t, hold: true, aimH: p.ans.aimH, branchH: p.sc.H, note: `Your aim height: ${PR.fmt(p.ans.aimH)} m`, fullPath: true };
    if (pg.replay) return { mode: 'hunt', sc: p.sc, t: sim.t, fullPath: true, note: `Your meet height: ${PR.fmt(p.ans.meet)} m` };
    return askScene(pg, p.sc, p.ans);
  }

  function renderScene() {
    $('stage').innerHTML = Scene.render(sceneOpts());
    const pg = page();
    $('stage').classList.toggle('stage-drag', !!(pg && pg.build && !state.built));
  }

  // The student's own drop table stays under the picture once they have measured it
  function renderReadout() {
    const box = $('readout'), slot = $('ladderSlot');
    const st = stepperOf();
    slot.innerHTML = '';
    if (!st || st.replay) box.hidden = true;
    else {
      box.innerHTML = `<span class="clock"><span class="clock-label">Time</span> <strong>${Math.floor(sim.t + 1e-6)} s</strong></span>`;
      box.hidden = false;
    }
    const measuredOnly = state.current === 'drop';
    if (state.current === 'line') return;
    const rows = PR.DROPS.map((d, i) => [i + 1, measuredOnly ? state.table[i + 1] : d]).filter(([, d]) => typeof d === 'number');
    if (!rows.length) return;
    const pieces = rows.map(([t, d]) => `<span class="chip"><span class="chip-t">${t} s</span> ${d} m</span>`).join('');
    slot.innerHTML = `<span class="ladder" aria-label="Your drop table"><span class="ladder-label">Your drop table</span>${pieces}</span>`;
  }

  function renderControls() {
    const box = $('stageCtl'), wrap = $('sliderWrap');
    const st = stepperOf(), pg = page();
    wrap.hidden = !(pg && pg.control);
    if (pg && pg.control) {
      const tilt = pg.control === 'tilt', sl = $('rigSlider');
      sl.min = tilt ? 0 : 15; sl.max = tilt ? 55 : 35; sl.step = tilt ? 5 : 5;
      sl.value = tilt ? rig.tilt : rig.speed;
      sl.setAttribute('aria-label', tilt ? 'Tilt of the stick' : 'Launch speed');
      $('sliderLabel').textContent = tilt ? `Tilt: ${rig.tilt}°` : `Speed: ${rig.speed} m/s`;
    }
    if (!st) { box.hidden = true; return; }
    box.hidden = false;
    const ended = sim.t >= st.T - 1e-6;
    if (st.launch) {
      $('btnNextSecond').hidden = true;
      $('btnPlay').hidden = false;
      $('btnPlay').textContent = st.replay ? (ended ? '↺ Watch again' : '▶ Play') : (sim.t > 0 ? '↺ Launch again' : '▶ Launch');
      $('btnPlay').disabled = !!sim.raf;
      $('btnStartOver').hidden = true;
    } else {
      $('btnNextSecond').hidden = false;
      $('btnNextSecond').disabled = ended;
      $('btnPlay').hidden = true;
      // Holds its place at the start so Next second never moves under the student's finger
      $('btnStartOver').hidden = false;
      $('btnStartOver').style.visibility = sim.t === (st.from || 0) ? 'hidden' : '';
    }
  }

  // What the student has found so far stays on screen
  function renderSolved() {
    const box = $('solved');
    let ans = null;
    if (state.current === 'quiz') {
      const c = state.quiz.cur, q = c && c.qs[c.i];
      if (q && q.kind === 'step') ans = chainFor(c, q.f, c.i);
    } else if (page() && (page().ask || page().replay)) ans = part().ans;
    const rows = [['th', 'θ', '°', ''], ['vox', 'v_ox', 'm/s', 'x'], ['voy', 'v_oy', 'm/s', 'y'], ['t', 't', 's', ''], ['fall', 't', 's', ''], ['line', 'line height', 'm', ''], ['drop', 'drop', 'm', 'g'], ['early', 'monkey drop', 'm', 'g']];
    const html = ans ? rows.filter(([k]) => typeof ans[k] === 'number')
      .map(([k, sym, unit, cls]) => `<span class="solved-chip ${cls ? 'solved-' + cls : ''}">${subHTML(`${sym} = ${PR.fmt(ans[k])} ${unit}`)}</span>`).join('') : '';
    box.innerHTML = html;
  }

  // ---------- Task card ----------
  function renderTask() {
    if (state.current === 'quiz') { renderQuiz(); syncCalc(); return; }
    const pg = page();
    let html;
    if (!pg) html = donePartHTML();
    else if (pg.mc) html = mcHTML(part().q, pg.mc, pageHeader());
    else if (pg.build) html = buildHTML();
    else if (pg.predict) html = predictHTML(pg);
    else if (pg.ask) html = stepHTML(PR.STEP[tier][pg.ask], part().sc, part().ans);
    else if (pg.replay) html = replayHTML();
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
    const wait = pg.control === 'tilt' ? 'Tilt the stick up, then Launch' : pg.control === 'speed' ? 'Change the speed, then Launch' : pg.stepper && pg.stepper.launch ? 'Press Launch first' : 'Press Next second first';
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

  function buildHTML() {
    const done = state.built;
    return `${pageHeader()}<h2 class="task-title">Build your meter stick</h2>
      <div class="task-body" id="readable">
        <p>Drag each ball down until its string matches your drop table.</p>
        <p>The string at 1 s is the drop for 1 s, and so on.</p>
      </div>
      ${fbHTML()}
      <div class="task-actions">${backBtn()}${done ? '<button type="button" class="btn-primary" id="btnNext">Next ▶</button>' : '<button type="button" class="btn-primary" id="btnCheckBuild">Check my strings</button>'}</div>`;
  }

  function checkBuild() {
    const wrong = PR.DROPS.map((d, i) => (state.build[i] === d ? null : i + 1)).filter(Boolean);
    if (!wrong.length) {
      state.built = true;
      fb = { ok: true, msg: 'Your strings match your drop table.' };
    } else {
      recordMistake('build_strings');
      wrong.forEach(n => { state.build[n - 1] = 0; });
      fb = { retry: true, msg: `Check your table for ${wrong.map(n => `${n} s`).join(' and ')}. Those balls went back to the stick. Drag them down again.` };
    }
    save();
    render();
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
    return `<label class="ans-row"><span class="ans-sym">${step.sym} =</span>
      <input id="answer" type="text" inputmode="decimal" autocomplete="off" value="${esc(draft)}"
        ${useCalc ? 'readonly tabindex="-1" class="calc-readonly" placeholder="calculator"' : ''} ${disabled ? 'disabled' : ''}
        aria-label="${step.sym.replace(/_/g, ' ')}${useCalc ? ', filled in from the calculator' : ''}">
      <span class="ans-unit">${step.unit}</span></label>`;
  }

  function stepHTML(step, sc, ans) {
    const answered = !!fb && !fb.retry;
    const waiting = step.measure && !sim.reachedEnd;
    const formula = step.formula(sc, ans);
    const hints = step.measure ? step.hints() : step.hints(sc, ans);
    const ask = waiting ? `Press <strong>Next second</strong> to catch the ball at ${step.measure} s.` : step.ask(sc, ans);
    return `${pageHeader()}<h2 class="task-title" id="readable">${ask}</h2>
      ${formula ? `<p class="formula-box"><span class="formula">${formula}</span></p>` : ''}
      ${answerBox(step, answered || waiting)}
      ${fbHTML()}
      <div class="task-actions">${backBtn()}${answered ? fbActions() : `<button type="button" class="btn-primary" id="btnCheck" ${waiting ? 'disabled' : ''}>Check</button>`}</div>
      ${answered || waiting ? '' : hintsHTML(hints)}`;
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
      return `<button type="button" class="opt ${cls} ${o.id === draft ? 'opt-picked' : ''}" data-opt="${o.id}" ${answered ? 'disabled' : ''}>${o.t}</button>`;
    }).join('');
    return `${top}<h2 class="task-title" id="readable">${def.text(q)}</h2>
      <div class="opts">${opts}</div>${fbHTML()}
      <div class="task-actions">${backBtn()}${answered ? fbActions() : ''}</div>`;
  }

  function replayHTML() {
    const p = part(), hold = page().replay === 'hold';
    const landed = sim.reachedEnd;
    const said = hold
      ? `You pointed the stick at <strong class="nowrap">${PR.fmt(p.ans.aimH)} m</strong>. The star marks it. The monkey holds on.`
      : `You said they meet <strong class="nowrap">${PR.fmt(p.ans.meet)} m</strong> above the ground.`;
    const result = hold
      ? '<div class="takeaway"><p>The ball fell one string below your aim and landed on the monkey.</p></div>'
      : '<div class="takeaway"><p>They met right where you said: the same drop, at the same moment.</p></div>';
    return `${pageHeader()}<h2 class="task-title">Test your answer</h2>
      <div class="task-body" id="readable"><p>${said}</p>${landed ? result : '<p>Watch the launch.</p>'}</div>
      <div class="task-actions">${backBtn()}<button type="button" class="btn-primary" id="btnNext" ${landed ? '' : 'disabled'}>${landed ? 'Next ▶' : 'Watch it first'}</button></div>`;
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
    if (r.ok) {
      p.ans[step.k] = PR.parseNum(draft);
      if (step.measure) state.table[step.measure] = PR.parseNum(draft);
    } else if (r.retry) { draft = ''; recordMistake(r.mistake); }
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
    on('btnCheckBuild', checkBuild);
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
    const clean = el.innerText.replace(/\s*\n+\s*=\s*\n+\s*/g, ' equals ').replace(/v\s*ox/g, 'v o x').replace(/v\s*oy/g, 'v o y').replace(/ΔX/g, 'delta X').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/tan⁻¹/g, 'inverse tangent').replace(/t²/g, 't squared');
    speechSynthesis.speak(new SpeechSynthesisUtterance(clean));
  }

  // ---------- Dragging the balls down ----------
  function bindDrag() {
    const stage = $('stage');
    const pointIn = e => {
      const svg = stage.querySelector('svg');
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
      return p;
    };
    const geom = () => Scene.rigGeom({ tilt: 0, speed: 30 });
    const editable = () => { const pg = page(); return !!(pg && pg.build && !state.built); };
    const setLength = (i, len) => { state.build[i] = Math.max(0, Math.min(85, Math.round(len / 5) * 5)); };
    stage.addEventListener('pointerdown', e => {
      if (!editable()) return;
      const p = pointIn(e), q = geom();
      let best = 0, bestGap = Infinity;
      state.build.forEach((_, i) => { const gap = Math.abs(q.markX(i) - p.x); if (gap < bestGap) { bestGap = gap; best = i; } });
      if (bestGap > 62) return;
      dragging = best;
      stage.setPointerCapture(e.pointerId);
      setLength(best, (p.y - q.markY(best)) / q.scale);
      e.preventDefault();
      renderScene();
    });
    stage.addEventListener('pointermove', e => {
      if (dragging === null || !editable()) return;
      const q = geom();
      setLength(dragging, (pointIn(e).y - q.markY(dragging)) / q.scale);
      renderScene();
    });
    const end = () => { if (dragging === null) return; dragging = null; if (fb && fb.retry) { fb = null; renderTask(); } save(); renderScene(); };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    // Keyboard: left and right choose a ball, up and down change its string
    stage.addEventListener('keydown', e => {
      if (!editable() || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      keyFocus = (keyFocus + (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? 3 : 0)) % 4;
      if (e.key === 'ArrowDown') setLength(keyFocus, state.build[keyFocus] + 5);
      if (e.key === 'ArrowUp') setLength(keyFocus, state.build[keyFocus] - 5);
      dragging = keyFocus;
      renderScene();
      dragging = null;
      save();
    });
  }
  let keyFocus = 0;

  function bindSlider() {
    $('rigSlider').addEventListener('input', e => {
      const pg = page(), v = Number(e.target.value);
      if (!pg || !pg.control) return;
      if (sim.raf) cancelAnimationFrame(sim.raf);
      sim.raf = null;
      sim.t = 0;
      if (pg.control === 'tilt') rig.tilt = v; else rig.speed = v;
      renderScene(); renderReadout(); renderControls();
    });
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
    return Lesson.problemScene(tier, c.hunts[q.f], chainFor(c, q.f, c.i), c.kinds[q.f]);
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

  const SKILL_LABEL = { count: 'Counting marks', table: 'Using the drop table', time: 'Time to the monkey', trig: 'Aim and trig', drop: 'Finding the drop', meet: 'Where they meet', aim: 'Aiming high', speed: 'Smallest speed', concept: 'Big ideas' };

  function renderQuiz() {
    const q = state.quiz;
    let html;
    if (q.cur) html = quizQuestionHTML();
    else if (q.attempts.length) html = quizResultsHTML();
    else {
      html = `<h2 class="task-title">Mastery Check</h2>
        <div class="task-body" id="readable">
          <p>You will solve <strong>2 hunts</strong> and answer <strong>2 questions</strong>.</p>
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
      const opts = PR.conceptOptions(q).map(o => `<button type="button" class="opt ${c.answers[c.i] === o.id ? 'opt-picked' : ''}" data-opt="${o.id}">${o.t}</button>`).join('');
      return `${top}<h2 class="task-title" id="readable">${def.text(q)}</h2><div class="opts">${opts}</div>${actions}`;
    }
    const step = PR.STEP[tier][q.k], sc = c.hunts[q.f], ans = chainFor(c, q.f, c.i);
    const formula = step.formula(sc, ans);
    return `${top}<p class="launch-tag">Hunt ${q.f + 1}</p><h2 class="task-title" id="readable">${step.ask(sc, ans)}</h2>
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
    if (page() && page().replay && sim.t === 0 && !sim.raf) setTimeout(() => { if (page() && page().replay && sim.t === 0 && !sim.raf) playFlight(); }, 350);
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
      return step.calc ? { step, sc: c.hunts[q.f], ans: chainFor(c, q.f, c.i) } : null;
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
        localStorage.setItem('mhs_theme', root.classList.contains('theme-dark') ? 'dark' : 'light');
        localStorage.setItem('mhs_projector', 'off');
      } catch (e) { /* storage blocked */ }
      if (desmos && desmos.updateSettings) desmos.updateSettings({ invertedColors: root.classList.contains('theme-dark') });
      setTheme();
    });
    $('btn-projector-mode').addEventListener('click', () => {
      const on = !root.classList.contains('projector');
      root.classList.toggle('projector', on);
      if (on) root.classList.remove('theme-dark');
      try { localStorage.setItem('mhs_projector', on ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
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
    bindDrag();
    bindSlider();
    if (state.current !== 'quiz' && !state.parts[state.current]) state.current = 'line';
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

  return { start, newState, validState, scoreState, debug: () => ({ state, tier, sim, fb, rig, desmos }) };
})();

window.HunterApp = HunterApp;

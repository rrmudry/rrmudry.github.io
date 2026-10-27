// Horizontal Projectile Workbench — Master controller
// One guided task engine for both Labs (measure → data table → graphs → questions) and Target
// Missions (find givens → plan → T-chart → place bucket → launch). One task on screen at a time.
// Wrong answers: Missions explain why, then load new numbers. Labs can't throw away measured data,
// so they explain why and the student redoes that step (with new values where the step has them).
// Also: units navigation, scoring, theme / projector / audio, teacher view + reveal, animation loop.

(function () {
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const sfx = window.soundFx;
  const { Engine, MISSIONS, TASKS, LABS } = window;
  const { fmt, fmtExact, fmtAns } = Engine;
  const UNITS = [...LABS, ...MISSIONS];
  const LAUNCH_TYPES = ['launch', 'place', 'dial', 'trial', 'test'];

  const stage = new ProjectileStage($('simCanvas'));
  const tool = new MeasurementTool(stage, {
    canDrag: () => taskType() === 'place' && sess().status === 'ask' && !stage.flying,
    onMove: x => { sess().bucketX = x; updateStageBar(); save(true); },
    canCross: () => taskType() === 'measure' && sess().status === 'ask',
    onCross: c => {
      // Snap onto the nearest ghost (lining it up by eye is not the skill being practiced)
      const rows = sess().sc.rows || [];
      let best = null, bd = 18;
      rows.forEach(g => { const d = Math.hypot((g.x - c.x) * stage.scale, (g.y - c.y) * stage.scale); if (d < bd) { bd = d; best = g; } });
      const snapped = best ? { x: best.x, y: best.y } : c;
      stage.cfg.crosshair = snapped;
      sess().crosshair = snapped;
      save(true);
    },
    onClick: (region, p) => stageClick(region, p)
  });
  const plots = { a: new Plot($('plotA'), i => plotPick('a', i)), b: new Plot($('plotB'), i => plotPick('b', i)) };
  const plotKeys = { a: null, b: null };

  const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(p => p[1]);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const same = (a, b) => a !== null && b !== null && a !== undefined && b !== undefined && Math.abs(a - b) < 1e-6;

  // ---------- Persistent state ----------
  // Saved by js/auth.js: Firestore for signed-in students, this device only for guests.
  // Bump STATE_VERSION when the unit structure changes.
  const STATE_VERSION = 3;
  function newState() {
    return { v: STATE_VERSION, current: 'lab1', done: {}, sessions: {}, bestPoints: 0, savedAt: 0 };
  }
  const validState = st => !!(st && st.v === STATE_VERSION && st.done && st.sessions && typeof st.current === 'string');
  let state = null;
  let cloud = null;
  let profile = { guest: true, honorsRequired: false };
  let view = 'teacher';        // teacher only: 'teacher' (everything + reveal) | 'cp' | 'honors'
  let speed = 1;
  let saveTimer = null;
  let leftView = 'stage';

  // Light save while typing/dragging (debounced 800ms) vs. immediate save on answers
  function save(soft) {
    if (!state) return;
    scoreState(state);
    if (!cloud) return;
    if (soft) { clearTimeout(saveTimer); saveTimer = setTimeout(() => cloud.queueSave(true), 800); }
    else cloud.queueSave(true);
  }

  // ---------- Who sees what ----------
  const isTeacher = () => !!profile.teacher;
  const teacherView = () => isTeacher() && view === 'teacher';
  const honorsOn = () => profile.honorsRequired || (isTeacher() && (view === 'teacher' || view === 'honors'));
  // Periods 1–3: extra support with no badge (worked example rows, first hint open, slope in 3 boxes)
  const supportOn = () => !honorsOn() && (!!profile.support || (isTeacher() && view === 'support'));
  const unitById = id => UNITS.find(u => u.id === id);
  const isLab = u => u.kind === 'strobe' || u.kind === 'speed';
  const available = () => UNITS.filter(u => !u.honors || honorsOn());
  const taskActive = k => !!TASKS[k] && (!TASKS[k].honors || honorsOn());

  // Gradebook: weighted share of required units finished × 10 pts (best ever, never lowered).
  // Lab 1 = 3, Lab 2 = 2, each mission = 1 (Period 0 also needs H1 and H2).
  function scoreState(st) {
    const required = UNITS.filter(u => !u.honors || profile.honorsRequired);
    const total = required.reduce((a, u) => a + u.weight, 0);
    const doneUnits = required.filter(u => st.done[u.id]);
    const now = Math.round(10 * doneUnits.reduce((a, u) => a + u.weight, 0) / total * 10) / 10;
    st.bestPoints = Math.max(st.bestPoints || 0, now);
    return { required: required.map(u => u.id), done: doneUnits.map(u => u.id), honors: !!profile.honorsRequired, points: st.bestPoints, percentage: Math.round(st.bestPoints * 10) };
  }

  // Testing: the teacher view and ?preview open every unit and show a "Skip step" button
  const testing = () => teacherView() || !!profile.preview;

  function unlocked(id) {
    if (testing()) return true;
    const list = available();
    const i = list.findIndex(u => u.id === id);
    return i >= 0 && list.slice(0, i).every(u => state.done[u.id]);
  }

  // ---------- Session (one attempt at one unit with one set of numbers) ----------
  const sess = () => state && state.sessions[state.current];
  const unit = () => state && unitById(state.current);
  const taskKey = () => { const s = sess(); return s && !s.finished ? unit().tasks[s.task] : null; };
  const taskDef = () => { const k = taskKey(); return k ? TASKS[k] : null; };
  const taskType = () => { const t = taskDef(); return t ? t.type : null; };

  function ctx() {
    const s = sess(), u = unit();
    const c = {
      sc: s.sc, sess: s, mission: u, unit: u, honors: honorsOn(),
      ruler: { x: stage.xStep, y: stage.yStep }, scale: stage.scale,
      full: honorsOn(), support: supportOn(),
      val: (r, col) => {
        const def = u.columns && u.columns.find(cd => cd.key === col);
        if (def && def.givenIf && def.givenIf(c)) return def.value(r, c);
        return s.table && s.table[r] ? Engine.parseNum(s.table[r][col]) : null;
      },
      // How a reading is made: number before the line + k ticks
      readParts: (v, axis) => {
        const step = axis === 'x' ? stage.xStep : stage.yStep, every = axis === 'x' ? stage.xEvery : stage.yEvery;
        const base = Math.floor(v / (step * every) + 1e-9) * step * every;
        return { base: Number(base.toFixed(4)), k: Math.round((v - base) / step), step };
      },
      reached: key => s.finished || u.tasks.indexOf(key) <= s.task,
      color: name => getComputedStyle(root).getPropertyValue(`--accent-${name}`).trim()
    };
    c.plotPoints = key => u.plots[key](c).points;
    return c;
  }

  function startUnit(id) {
    state.current = id;
    if (state.sessions[id]) {
      leftView = 'stage';
      configureStage();
      syncLeft();
      renderAll();
      return;
    }
    newSession(id, null, 0);
  }

  function newSession(id, avoidKey, tries) {
    const u = unitById(id);
    const sc = u.gen(avoidKey);
    state.current = id;
    state.sessions[id] = {
      id, sc, task: 0, status: 'ask', fb: '', fbKind: '', hints: 0, inputs: {}, order: null, picked: null,
      phase: 'find', row: 0, picks: [], crosshair: null, table: u.newTable ? u.newTable(sc) : null, vals: {},
      launched: false, landed: {}, landedVx: {}, bucketX: u.kind === 'reverse' ? sc.dx : null, dial: null,
      tries: tries || 0, finished: false
    };
    if (desmos && desmos.setBlank) desmos.setBlank();
    setStatus(DEFAULT_STATUS);
    tool.unpin();
    leftView = 'stage';
    configureStage();
    enterTask();
  }

  // Labs only, before any data is collected: new launch numbers, same step
  function refreshScenario() {
    const s = sess(), u = unit();
    s.sc = u.gen(s.sc.key);
    s.table = u.newTable ? u.newTable(s.sc) : null;
    s.vals = {};
    s.tries = (s.tries || 0) + 1;
    configureStage();
  }

  function configureStage() {
    const s = sess(), u = unit(), sc = s.sc;
    let cfg;
    if (isLab(u)) {
      cfg = Object.assign({ dy: sc.dy, runway: sc.runway, tol: 0.1, launchVx: sc.vx }, u.stage(null, s));
    } else {
      const rev = u.kind === 'reverse';
      cfg = {
        dy: sc.dy, runway: sc.runway, tol: 0.03 * sc.dx,
        launchVx: rev ? s.dial : sc.vx,
        bucketX: s.bucketX === null ? 0 : s.bucketX,
        bucketLocked: rev, hideTarget: rev, vectors: !!u.honors
      };
    }
    stage.setScenario(cfg);
    if (!isLab(u) && s.bucketX === null) {
      // Start the bucket well away from the answer so it must be moved
      const far = sc.dx < stage.runwayShown * 0.5 ? 0.85 : 0.15;
      s.bucketX = Number((Math.round(stage.runwayShown * far / stage.snap) * stage.snap).toFixed(2));
      stage.cfg.bucketX = s.bucketX;
    }
    syncStageTask();
    updateStageBar();
  }

  // Per-task apparatus settings that don't need a fresh scenario
  function syncStageTask() {
    const s = sess(), u = unit(), t = taskDef(), cfg = stage.cfg;
    if (!cfg || !s) return;
    const type = t ? t.type : null;
    cfg.crosshair = type === 'measure' && s.status === 'ask' ? (s.crosshair || null) : null;
    // Zoom boxes: at the crosshair while measuring; at the landing flag while recording a trial
    const lr = type === 'test' ? 4 : s.row;
    cfg.readPoint = cfg.crosshair ? cfg.crosshair
      : (type === 'trial' || type === 'test') && s.status === 'ask' && rowLaunched(lr) ? { x: s.landed[lr], y: null } : null;
    cfg.highlightGhost = type === 'measure' ? s.row : null;
    cfg.highlight = type === 'findread' && s.phase === 'read' && t.highlight ? t.highlight : null;
    cfg.practice = type === 'practice' && s.vals.practice ? { ruler: t.ruler, value: s.vals.practice.value } : null;
    if (u.kind === 'speed') {
      Object.assign(cfg, u.stage(null, s));
      cfg.timerValue = Object.keys(s.landed).length ? s.sc.T : 0;
    }
  }

  function enterTask() {
    const s = sess(), u = unit();
    while (s.task < u.tasks.length && !taskActive(u.tasks[s.task])) s.task++;
    if (s.task >= u.tasks.length) { finishUnit(); return; }
    const t = taskDef();
    s.status = 'ask';
    s.fb = '';
    s.fbKind = '';
    s.hints = supportOn() && t.hints ? 1 : 0;
    s.picked = null;
    s.picks = [];
    s.inputs.ans = ''; s.inputs.rise = ''; s.inputs.run = '';
    s.phase = 'find';
    s.row = 0;
    s.order = t.type === 'mc' ? shuffle(t.options(ctx()).map((_, i) => i)) : null;
    if ((t.type === 'dial' || t.type === 'trial' || t.type === 'test') && s.dial === null) s.dial = 0;
    if (t.type === 'dial') stage.cfg.launchVx = s.dial;
    if (t.enter) t.enter(s);
    if (t.type === 'practice') newPracticeSpot(t);
    if (t.type === 'measure') startMeasuring(t);
    if (t.type === 'trial' && supportOn() && s.landed[0] === undefined) workedTrial();
    if (desmos && desmos.setBlank) desmos.setBlank();
    tool.unpin();
    save();
    syncStageTask();
    syncLeft();
    renderAll();
    focusActive();
  }

  function advance() {
    sess().task++;
    enterTask();
  }

  function finishUnit() {
    const s = sess();
    s.finished = true;
    s.status = 'finished';
    state.done[s.id] = true;
    sfx.playFanfare();
    save();
    syncStageTask();
    renderAll();
  }

  function markCorrect(msg) {
    const s = sess();
    s.status = 'correct';
    s.fb = msg;
    s.fbKind = 'good';
    sfx.playChime();
    save();
    syncStageTask();
    renderAll();
  }

  // Missions: explain why, then the student loads new numbers. Labs: explain why, then redo the step.
  function markWrong(msg) {
    const s = sess();
    s.status = 'wrong';
    s.fb = msg;
    s.fbKind = 'bad';
    sfx.playBuzzer();
    save();
    renderAll();
  }

  // Wrong cell(s) in the table: explain, clear the wrong boxes, stay on the step
  function softWrong(msg) {
    const s = sess();
    s.fb = msg;
    s.fbKind = 'bad';
    sfx.playBuzzer();
    save();
    renderTask();
  }

  function retryTask() {
    const s = sess();
    const t = taskDef();
    s.status = 'ask';
    s.fb = '';
    s.fbKind = '';
    s.picks = [];
    s.picked = null;
    s.inputs.ans = ''; s.inputs.rise = ''; s.inputs.run = '';
    if (t.type === 'findread') { s.phase = 'find'; tool.unpin(); }
    if (t.type === 'mc') s.order = shuffle(s.order);
    if (t.enter) t.enter(s);
    if (t.type === 'practice') newPracticeSpot(t);
    save();
    syncStageTask();
    renderAll();
    focusActive();
  }

  // ---------- Checking ----------
  const readInput = (id, store) => {
    const el = $(id);
    const raw = el ? el.value : store();
    return raw || '';
  };

  function dataFields() { return unit().kind === 'reverse' ? ['dy', 'dx'] : ['dy', 'vx']; }
  const readingStep = q => (q === 'dy' ? stage.yStep : q === 'vx' ? 0.1 : stage.xStep);

  function readingProblem(q, raw) {
    const sc = sess().sc;
    if (q === 'dy') return `You read Δy = ${esc(raw)} m, but the red launch line crosses the height ruler at ${fmtExact(sc.dy)} m. Each small tick on this ruler is ${fmtExact(stage.yStep)} m.`;
    if (q === 'vx') return `The photogate shows v_x = ${fmt(sc.vx, 1)} m/s. Copy the display exactly.`;
    return `The bucket's red pointer touches the floor ruler at Δx = ${fmtExact(sc.dx)} m. Each small tick on this ruler is ${fmtExact(stage.xStep)} m.`;
  }

  function submitData() {
    const s = sess();
    const sc = s.sc;
    const fields = dataFields();
    const raws = fields.map(q => { s.inputs[q] = readInput(`in_${q}`, () => s.inputs[q]); return s.inputs[q]; });
    if (raws.some(v => Engine.parseNum(v) === null)) { flash('Fill in both boxes with numbers first.'); return; }
    const problems = fields.map((q, i) => Engine.checkReading(raws[i], sc[q], readingStep(q)).ok ? null : readingProblem(q, raws[i])).filter(Boolean);
    if (problems.length) { markWrong(problems.join('<br>')); return; }
    const second = unit().kind === 'reverse' ? `Δx = ${fmtExact(sc.dx)} m` : `v_x = ${fmt(sc.vx, 1)} m/s`;
    markCorrect(`✓ Data recorded: <span class="formula">Δy = ${fmtExact(sc.dy)} m</span> and <span class="formula">${second}</span>. Nice careful reading!`);
  }

  // Mission T-chart number (Engine diagnostics) or a lab answer box (task's own check)
  function submitNum() {
    const s = sess();
    const t = taskDef();
    if (t.kind) {
      s.inputs[t.kind] = readInput(`in_${t.kind}`, () => s.inputs[t.kind]);
      const res = Engine.check(t.kind, s.inputs[t.kind], s.sc);
      if (res.ok === null) { flash(res.msg); return; }
      if (res.ok) markCorrect(`✓ <span class="formula">${res.msg}</span>`);
      else markWrong(`✗ ${res.msg}`);
      return;
    }
    s.inputs.ans = readInput('in_ans', () => s.inputs.ans);
    const c = ctx();
    if (t.type === 'pick2' && supportOn()) {
      // Check rise and run first, so the student hears exactly which part went wrong
      const pts = c.plotPoints(t.plot), a = pts[s.picks[0]], b = pts[s.picks[1]];
      const rise = Engine.parseNum(s.inputs.rise = readInput('in_rise', () => s.inputs.rise));
      const run = Engine.parseNum(s.inputs.run = readInput('in_run', () => s.inputs.run));
      if (rise === null || run === null || Engine.parseNum(s.inputs.ans) === null) { flash('Fill in all 3 boxes first.'); return; }
      const bad = [];
      if (Math.abs(rise - (b.y - a.y)) > 0.011) bad.push(`<strong>Rise:</strong> <span class="formula">${fmtExact(b.y, 3)} − ${fmtExact(a.y, 3)} = ${fmtExact(b.y - a.y, 3)}</span>`);
      if (Math.abs(run - (b.x - a.x)) > 0.011) bad.push(`<strong>Run:</strong> <span class="formula">${fmtExact(b.x, 3)} − ${fmtExact(a.x, 3)} = ${fmtExact(b.x - a.x, 3)}</span>`);
      if (bad.length) { markWrong(`✗ ${bad.join('<br>')}<br>Pick two points again and try once more.`); return; }
    }
    const res = t.check(s.inputs.ans, c);
    if (res.ok === null) { flash(res.msg); return; }
    if (res.ok) {
      if (t.onCorrect) t.onCorrect(c, Engine.parseNum(s.inputs.ans));
      markCorrect(`✓ ${res.msg}`);
    } else markWrong(`✗ ${res.msg}`);
  }

  // Second half of a "click on it, then read it" task
  function submitRead() {
    const s = sess();
    const t = taskDef();
    if (t.field) {
      const q = t.field;
      s.inputs[q] = readInput(`in_${q}`, () => s.inputs[q]);
      const c = Engine.checkReading(s.inputs[q], s.sc[q], readingStep(q));
      if (c.ok === null) { flash('Type a number first.'); return; }
      if (!c.ok) { markWrong(`✗ ${readingProblem(q, s.inputs[q])}`); return; }
      const names = { dy: 'Δy', vx: 'v_x', dx: 'Δx' };
      markCorrect(`✓ ${names[q]} recorded in the ${q === 'dy' ? 'vertical' : 'horizontal'} motion column.`);
      return;
    }
    s.inputs.ans = readInput('in_ans', () => s.inputs.ans);
    const v = Engine.parseNum(s.inputs.ans);
    if (v === null) { flash('Type a number first.'); return; }
    const c = ctx();
    if (Math.abs(v - t.read.answer(c)) <= t.read.tol(c)) {
      if (t.read.store) s.vals[t.read.store] = v;
      markCorrect(`✓ Yes: ${t.read.label} ${fmtExact(t.read.answer(c), 2)} ${t.read.unit}.`);
    } else {
      s.vals.newScenario = !!t.read.retryNew;
      markWrong(`✗ ${t.read.wrong(c)}${t.read.retryNew ? ' The apparatus will get new numbers.' : ''}`);
    }
  }

  // Practice reading: arrow at (numbered mark) + k ticks, k = 1–4, never the same spot twice in a row
  function newPracticeSpot(t) {
    const s = sess();
    const h = t.ruler === 'height';
    const step = h ? stage.yStep : stage.xStep;
    const every = h ? stage.yEvery : stage.xEvery;
    const max = h ? s.sc.dy : stage.runwayShown * 0.9;
    const kMax = Math.min(4, every - 1);
    const spots = [];
    for (let m = 0; m * every * step + kMax * step <= max + 1e-9; m++) {
      for (let k = 1; k <= kMax; k++) spots.push({ base: Number((m * every * step).toFixed(4)), k, step });
    }
    const prev = s.vals.practice;
    const choices = spots.filter(p => !prev || p.base !== prev.base || p.k !== prev.k);
    const p = choices[Math.floor(Math.random() * choices.length)];
    p.value = Number((p.base + p.k * p.step).toFixed(4));
    s.vals.practice = p;
    ['p1', 'p2', 'p3'].forEach(k => { s.inputs[k] = ''; });
  }

  function submitPractice() {
    const s = sess(), t = taskDef(), p = s.vals.practice;
    const vals = ['p1', 'p2', 'p3'].map(k => { s.inputs[k] = readInput(`in_${k}`, () => s.inputs[k]); return Engine.parseNum(s.inputs[k]); });
    if (vals.some(v => v === null)) { flash('Fill in all 3 boxes first.'); return; }
    const below = t.ruler === 'height' ? 'below' : 'to the left of';
    const dir = t.ruler === 'height' ? 'up' : 'right';
    const okBase = Math.abs(vals[0] - p.base) < 1e-6;
    const okK = Math.abs(vals[1] - p.k) < 1e-6;
    const okR = Math.abs(vals[2] - p.value) <= p.step * 0.3;
    if (okBase && okK && okR) {
      markCorrect(`✓ <span class="formula">${fmtExact(p.base, 3)} + ${p.k} × ${fmtExact(p.step, 3)} = ${fmtExact(p.value, 3)} m</span>. That's how you read any spot on this ruler.`);
      return;
    }
    const why = [];
    if (!okBase) why.push(`<strong>Step 1:</strong> the numbered mark just ${below} the arrow is ${fmtExact(p.base, 3)} m.`);
    if (!okK) why.push(`<strong>Step 2:</strong> from ${fmtExact(p.base, 3)}, count the small spaces ${dir} to the arrow: there are ${p.k}.`);
    if (!okR) why.push(`<strong>Step 3:</strong> <span class="formula">${fmtExact(p.base, 3)} + ${p.k} × ${fmtExact(p.step, 3)} = ${fmtExact(p.value, 3)} m</span>.`);
    markWrong(`✗ ${why.join('<br>')}<br>The arrow will move to a new spot. Try again!`);
  }

  function submitMC(idx) {
    const t = taskDef();
    const opt = t.options(ctx())[idx];
    sess().picked = idx;
    if (opt.ok) markCorrect('✓ ' + opt.why);
    else markWrong('✗ ' + opt.why);
  }

  // Table cells the current task lets the student fill in
  function activeCells() {
    const s = sess(), t = taskDef();
    if (!t || s.status !== 'ask') return [];
    if (t.type === 'measure') return [[s.row, 'x'], [s.row, 'y']];
    if (t.type === 'column') return t.rows(ctx()).map(r => [r, t.col]);
    if (t.type === 'trial' && rowLaunched(s.row)) return [[s.row, 'dx'], [s.row, 't']];
    if (t.type === 'test' && rowLaunched(4)) return [[4, 'dx'], [4, 't']];
    return [];
  }
  function rowLaunched(r) {
    const s = sess();
    const need = r < 4 ? s.sc.speeds[r] : s.vals.p;
    return s.landed[r] !== undefined && same(s.landedVx[r], need);
  }
  const cellId = (r, col) => `cell_${r}_${col}`;
  function syncCells() {
    const s = sess();
    activeCells().forEach(([r, col]) => { const el = $(cellId(r, col)); if (el) s.table[r][col] = el.value; });
  }

  function submitRow() {
    const s = sess(), t = taskDef();
    syncCells();
    const r = t.type === 'test' ? 4 : s.row;
    const res = t.checkRow(r, ctx());
    if (res.ok === null) { flash(res.msg); return; }
    if (!res.ok) {
      res.bad.forEach(col => { s.table[r][col] = ''; });
      softWrong(`✗ ${res.msg}`);
      return;
    }
    if (t.type === 'test') { markCorrect(`✓ ${res.msg}`); return; }
    let finished;
    if (t.type === 'measure') { s.mi++; finished = s.mi >= s.mrows.length; if (!finished) s.row = s.mrows[s.mi]; }
    else { s.row++; finished = s.row >= 4; }
    if (finished) {
      markCorrect(t.type === 'trial' ? '✓ All 4 trials measured and recorded. Nice lab work!' : '✓ Every ghost measured! Your data table is complete. Next, you\'ll graph it.');
      return;
    }
    if (t.type === 'measure') aimAtGhost(s.row);
    s.fb = t.type === 'trial' ? `✓ Trial ${r + 1} recorded. On to trial ${r + 2}.` : `✓ Ghost ${r} recorded. The crosshair moved to ghost ${s.row}.`;
    s.fbKind = 'good';
    if (t.type === 'trial') { s.dial = 0; stage.cfg.launchVx = 0; }
    sfx.playChime();
    save();
    syncStageTask();
    renderAll();
    focusActive();
  }

  // Measuring: the student measures some rows; the others are filled in ("by your lab partner")
  function startMeasuring() {
    const s = sess(), u = unit(), c = ctx();
    s.mrows = u.measureRows(c).filter(r => r < s.sc.rows.length);
    s.mi = 0;
    s.row = s.mrows[0];
    s.prefilled = {};
    s.sc.rows.forEach((g, r) => {
      if (s.mrows.includes(r)) return;
      s.table[r].x = fmtExact(g.x, 3);
      s.table[r].y = fmtExact(g.y, 3);
      s.prefilled[r] = true;
    });
    aimAtGhost(s.row);
  }

  // Periods 1–3: trial 1 is launched and recorded for them as a worked example
  function workedTrial() {
    const s = sess(), sc = s.sc;
    s.landed[0] = sc.speeds[0] * sc.T;
    s.landedVx[0] = sc.speeds[0];
    s.table[0].dx = fmtExact(sc.speeds[0] * sc.T, 3);
    s.table[0].t = fmt(sc.T, 2);
    s.prefilled = { 0: true };
    s.row = 1;
  }

  // Measuring: the crosshair starts on the ghost for this row
  function aimAtGhost(r) {
    const g = sess().sc.rows[r];
    if (g) sess().crosshair = { x: g.x, y: g.y };
  }

  function submitColumn() {
    const s = sess(), t = taskDef();
    syncCells();
    const c = ctx();
    const rows = t.rows(c);
    if (rows.some(r => c.val(r, t.col) === null)) { flash('Fill in every box in the column first.'); return; }
    const wrong = rows.filter(r => Math.abs(c.val(r, t.col) - t.expected(r, c)) > t.tol(r, c));
    if (!wrong.length) {
      markCorrect(`✓ Column complete. Every value checks out with your data.`);
      return;
    }
    const example = t.explain(wrong[0], c);
    wrong.forEach(r => { s.table[r][t.col] = ''; });
    softWrong(`✗ ${wrong.length === 1 ? '1 box was' : `${wrong.length} boxes were`} off, so ${wrong.length === 1 ? 'it was' : 'they were'} cleared. Example: <span class="formula">${example.replace(/= [^=]*$/, '= ?')}</span> Fill them in again.`);
  }

  function rowClick(r) {
    const s = sess(), t = taskDef();
    if (!t || t.type !== 'pickRow' || s.status !== 'ask') return;
    s.picked = r;
    const res = t.okRow(r, ctx());
    if (res.ok) markCorrect(`✓ ${res.msg}`);
    else markWrong(`✗ ${res.msg}`);
  }

  function plotPick(slot, i) {
    const s = sess(), t = taskDef();
    if (!t || s.status !== 'ask' || t.plot !== plotKeys[slot]) return;
    if (t.type === 'pickPoint') {
      s.picked = i;
      const res = t.okPoint(i, ctx());
      if (res.ok) markCorrect(`✓ ${res.msg}`);
      else markWrong(`✗ ${res.msg}`);
      return;
    }
    if (t.type !== 'pick2') return;
    if (s.picks.includes(i)) s.picks = s.picks.filter(x => x !== i);
    else {
      if (s.picks.length >= 2) s.picks = [s.picks[1]];
      s.picks.push(i);
    }
    s.picks.sort((a, b) => a - b);
    const pts = ctx().plotPoints(t.plot);
    if (s.picks.length === 2 && same(pts[s.picks[0]].x, pts[s.picks[1]].x)) { s.picks = [i]; flash('Pick two points at different places along the bottom axis.'); }
    sfx.playClick();
    save(true);
    renderTask();
    renderPlots();
    focusActive();
  }

  function stageClick(region, p) {
    const s = sess(), t = taskDef();
    if (!t || t.type !== 'findread' || s.phase !== 'find' || s.status !== 'ask') return;
    const ok = t.find.test ? t.find.test(region, p, stage) : t.find.regions.includes(region);
    if (!ok) { softWrong(`✗ ${t.find.wrong(region)}`); return; }
    s.phase = 'read';
    s.fb = '';
    s.fbKind = '';
    sfx.playChime();
    if (stage.loupeRegion(p.x, p.y)) setTimeout(() => tool.pinAt(p), 0);
    if (!t.read && !t.field) { markCorrect('✓ Found it!'); return; }
    save();
    syncStageTask();
    renderAll();
    focusActive();
  }

  // ---------- Launching ----------
  function launch() {
    const s = sess();
    const type = taskType();
    if (stage.flying || s.status !== 'ask' || !LAUNCH_TYPES.includes(type)) return;
    const vx = type === 'place' ? s.sc.vx : type === 'launch' ? s.sc.vx : s.dial;
    if (!(vx > 0)) { flash('Turn the speed dial up first.'); return; }
    sfx.playLaunch();
    setTimeout(() => sfx.playBeep(), 60);
    setStatus('🚀 Launched!');
    tool.unpin();
    stage.launch(vx, res => landed(res, vx));
    updateStageBar();
  }

  function landed({ xLand, result }, vx) {
    const s = sess();
    const type = taskType();
    const d = stage.snap < 0.1 ? 2 : 1;
    updateStageBar();
    if (type === 'launch') {
      s.launched = true;
      sfx.playThud();
      setStatus('📸 Strobe photo taken.');
      markCorrect(`✓ ${taskDef().landed(ctx())}`);
      return;
    }
    if (type === 'trial' || type === 'test') {
      const r = type === 'test' ? 4 : s.row;
      const need = type === 'test' ? s.vals.p : s.sc.speeds[r];
      s.landed[r] = xLand;
      s.landedVx[r] = vx;
      sfx.playThud();
      setStatus('Landed. A flag marks the spot.');
      if (!same(vx, need)) {
        s.fb = `You launched at ${fmt(vx, 1)} m/s, but ${type === 'test' ? 'the test' : `row ${r + 1}`} needs ${fmt(need, 1)} m/s. Set the dial and launch again.`;
        s.fbKind = 'warn';
      } else { s.fb = ''; s.fbKind = ''; }
      save();
      syncStageTask();
      renderAll();
      focusActive();
      return;
    }
    const off = Math.abs(xLand - s.bucketX);
    if (result === 'hit') {
      sfx.playClang();
      setTimeout(() => sfx.playFanfare(), 250);
      setStatus(`🎯 BULLSEYE! Landed at ${fmt(xLand, d)} m.`);
      markCorrect(`🎯 <strong>BULLSEYE!</strong> Direct hit at ${fmt(xLand, d)} m.`);
      return;
    }
    if (result === 'rim') sfx.playRim(); else sfx.playThud();
    const short = xLand < s.bucketX ? 'short of' : 'past';
    const why = type === 'dial'
      ? `The dial was set to ${fmt(s.dial, 1)} m/s, but your answer was <span class="formula">v_x = ${fmtAns(s.sc.vx)} m/s</span>. Set the dial to your answer and launch again.`
      : `The bucket was at ${fmt(s.bucketX, d)} m, but your answer was <span class="formula">Δx = ${fmtAns(s.sc.dx)} m</span>. Drag the bucket to your answer and launch again.`;
    const head = result === 'rim' ? `🥁 <strong>Rim shot!</strong> So close: the ball landed ${fmt(off, d)} m ${short} the bucket.` : `💥 <strong>Miss.</strong> The ball landed ${fmt(off, d)} m ${short} the bucket.`;
    setStatus(`Landed at ${fmt(xLand, d)} m.`);
    // Physics is already correct at this point, so a miss is a placement slip: no new numbers
    s.fb = `${head} ${why}`;
    s.fbKind = 'warn';
    save();
    renderAll();
  }

  // ---------- Rendering ----------
  function flash(msg) {
    const el = document.querySelector('#taskCard .task-flash');
    if (el) el.textContent = msg;
    sfx.playBuzzer();
  }

  const DEFAULT_STATUS = $('simStatus').textContent;
  function setStatus(text) { $('simStatus').textContent = text; }

  function renderAll() {
    renderStrip();
    renderTask();
    renderPlots();
    updateStageBar();
    syncLeftTabs();
  }

  function renderStrip() {
    const list = available();
    const s = scoreState(state);
    const pill = u => {
      const done = !!state.done[u.id];
      const open = unlocked(u.id);
      const cur = state.current === u.id;
      const cls = ['mission-pill', isLab(u) ? 'lab' : '', done ? 'done' : '', cur ? 'active' : '', u.honors ? 'honors' : '', u.arena ? 'arena' : ''].join(' ');
      const icon = done ? '✓' : open ? '' : '🔒';
      const text = isLab(u) ? `${u.icon} ${u.label}` : `${u.honors ? '⭐' : ''}${u.label}`;
      return `<button class="${cls}" data-unit="${u.id}" ${open ? '' : 'disabled'} title="${esc(u.title)}"><span class="mp-num">${text}</span><span class="mp-icon">${icon}</span></button>`;
    };
    const labs = list.filter(isLab), missions = list.filter(u => !isLab(u));
    $('missionStrip').innerHTML = labs.map(pill).join('')
      + `<span class="strip-label">🎯 Missions</span>` + missions.map(pill).join('')
      + `<span class="score-chip" title="Best score so far">${profile.guest ? 'Not graded' : `Score: ${fmt(s.points, s.points % 1 ? 1 : 0)} / 10`}</span>`;
  }

  const SPOKEN = { dy: 'Delta y', vx: 'v sub x', dx: 'Delta x', t: 'time t', vy: 'v sub y', vimp: 'impact speed v', theta: 'impact angle theta' };

  // ---- Mission T-chart ----
  function fieldOwner(q) {
    return unit().tasks.findIndex(k => {
      const d = TASKS[k];
      return (d.type === 'data' && dataFields().includes(q)) || d.field === q || d.kind === q;
    });
  }
  function fieldState(q) {
    const s = sess();
    const i = fieldOwner(q);
    if (i < 0) return 'none';
    if (s.finished || i < s.task) return 'done';
    if (i > s.task) return 'locked';
    if (TASKS[unit().tasks[i]].type === 'findread' && s.phase === 'find') return 'locked';
    return s.status === 'ask' ? 'active' : s.status === 'correct' ? 'done' : 'wrong';
  }
  function field(q, label, unitTxt) {
    const st = fieldState(q);
    if (st === 'none') return '';
    const val = sess().inputs[q] || '';
    const dis = st === 'active' ? '' : 'disabled';
    const ph = st === 'locked' ? '🔒' : '?';
    return `<label class="tc-field st-${st}"><span class="tc-sym">${label} =</span>
      <input id="in_${q}" type="text" inputmode="decimal" autocomplete="off" value="${esc(st === 'locked' ? '' : val)}" placeholder="${ph}" ${dis} data-field="${q}" aria-label="${SPOKEN[q]} in ${unitTxt}">
      <span class="tc-unit">${unitTxt}</span>${st === 'done' ? '<span class="tc-ok">✓</span>' : ''}</label>`;
  }

  function tchartHTML() {
    const u = unit();
    const rev = u.kind === 'reverse';
    const yCol = `<div class="tc-col tc-y">
        <div class="tc-head"><strong>⬇ Vertical motion (y)</strong><span>Free fall: a = 10 m/s² down</span></div>
        <div class="tc-row"><span class="tc-tag">Given</span>${field('dy', 'Δy', 'm')}</div>
        <div class="tc-row tc-formula"><span class="tc-tag">Formula</span><span class="formula">t = √(Δy ÷ 5)</span></div>
        <div class="tc-row"><span class="tc-tag">Step 1</span>${field('t', 't', 's')}</div>
      </div>`;
    const xCol = `<div class="tc-col tc-x">
        <div class="tc-head"><strong>➡ Horizontal motion (x)</strong><span>Constant speed: a = 0</span></div>
        <div class="tc-row"><span class="tc-tag">Given</span>${rev ? field('dx', 'Δx', 'm') : field('vx', 'v_x', 'm/s')}</div>
        <div class="tc-row tc-formula"><span class="tc-tag">Formula</span><span class="formula">${rev ? 'v_x = Δx ÷ t' : 'Δx = v_x × t'}</span></div>
        <div class="tc-row"><span class="tc-tag">Step 2</span>${rev ? field('vx', 'v_x', 'm/s') : field('dx', 'Δx', 'm')}</div>
      </div>`;
    let impact = '';
    if (u.honors && (fieldState('vy') !== 'locked' || sess().finished)) {
      impact = `<div class="tc-impact">
          <div class="tc-head"><strong>⭐ Impact velocity</strong><span>The instant before it lands</span></div>
          <div class="tc-impact-grid">
            <div class="tc-row"><span class="formula">v_y = 10 × t</span>${field('vy', 'v_y', 'm/s')}</div>
            <div class="tc-row"><span class="formula">v = √(v_x² + v_y²)</span>${field('vimp', 'v', 'm/s')}</div>
            <div class="tc-row"><span class="formula">θ = tan⁻¹(v_y ÷ v_x)</span>${field('theta', 'θ', '°')}</div>
          </div></div>`;
    }
    return `<div class="tchart">${yCol}${xCol}</div>${impact}`;
  }

  // ---- Lab data table ----
  function tableHTML() {
    const u = unit(), s = sess(), c = ctx(), t = taskDef();
    const isGiven = col => !!col.given && (!col.givenIf || col.givenIf(c));
    const cols = u.columns.filter(col => (!col.honors || honorsOn()) && (isGiven(col) || c.reached(col.from)));
    if (!cols.some(col => !isGiven(col))) return '';
    const n = u.visibleRows ? u.visibleRows(c) : s.table.length;
    const active = activeCells();
    const isActive = (r, k) => active.some(([ar, ak]) => ar === r && ak === k);
    const activeRow = active.length ? active[0][0] : (t && (t.type === 'measure' || t.type === 'trial') ? s.row : -1);
    const pickable = t && t.type === 'pickRow' && s.status === 'ask';
    const head = cols.map(col => `<th class="${col.world ? 'w-' + col.world : ''}">${col.label}</th>`).join('');
    let body = '';
    for (let r = 0; r < n; r++) {
      const cells = cols.map(col => {
        if (isGiven(col)) return `<td class="given">${col.given(r, c)}</td>`;
        if (col.blankRow0 && r === 0) return '<td class="blank">—</td>';
        if (isActive(r, col.key)) return `<td class="cell-active"><input id="${cellId(r, col.key)}" data-cell="${r}|${col.key}" type="text" inputmode="decimal" autocomplete="off" value="${esc(s.table[r][col.key])}" aria-label="Row ${r} ${col.label.replace(/<[^>]+>/g, '')}"></td>`;
        const pre = s.prefilled && s.prefilled[r] && s.table[r][col.key] !== '';
        return `<td${pre ? ' class="prefilled" title="Filled in for you"' : ''}>${esc(s.table[r][col.key] || '')}</td>`;
      }).join('');
      const cls = [r === activeRow ? 'row-active' : '', pickable ? 'row-pick' : '', s.picked === r && t && t.type === 'pickRow' ? 'row-picked' : ''].join(' ');
      body += `<tr class="${cls}" data-row="${r}">${cells}</tr>`;
    }
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function hintsHTML(t, s) {
    if (!t.hints || s.status !== 'ask') return '';
    const all = t.hints(ctx());
    const shown = Math.min(s.hints || 0, all.length);
    const list = all.slice(0, shown).map((h, i) => `<li><strong>Hint ${i + 1}:</strong> ${h}</li>`).join('');
    const more = shown < all.length ? `<button class="btn-hint" data-hint>💡 ${shown ? 'Next hint' : 'Show a hint'} (${all.length - shown} left)</button>` : '';
    return `<div class="hints">${list ? `<ol class="hint-list">${list}</ol>` : ''}${more}</div>`;
  }

  function dialHTML(s, max) {
    return `<div class="dial-row"><label for="dial">Launch speed</label>
      <button class="btn-nudge" data-dial="-1" aria-label="Slower">−</button>
      <input type="range" id="dial" min="0" max="${max}" step="0.1" value="${s.dial || 0}">
      <button class="btn-nudge" data-dial="1" aria-label="Faster">+</button>
      <output id="dialOut" class="dial-out">${fmt(s.dial || 0, 1)} m/s</output></div>`;
  }

  const ansRow = (label, unitTxt, s) => `<label class="ans-row"><span class="tc-sym">${label}</span>
    <input id="in_ans" type="text" inputmode="decimal" autocomplete="off" value="${esc(s.inputs.ans || '')}" data-ans="1" aria-label="Your answer in ${unitTxt}">
    <span class="tc-unit">${unitTxt}</span></label>`;

  function renderTask() {
    const card = $('taskCard');
    const s = sess();
    if (!s) { card.innerHTML = ''; return; }
    const u = unit();
    const lab = isLab(u);
    const list = available();
    const missions = list.filter(x => !isLab(x) && !x.honors);
    const badge = lab ? `${u.icon} ${u.label}` : u.honors ? `⭐ Honors ${u.label}` : u.arena ? `🏟️ Target Arena · Mission ${u.label}` : `Mission ${u.label} of ${missions.length}`;

    if (s.finished) {
      card.innerHTML = subHTML(finishedHTML(u, list, badge) + (lab ? tableHTML() : ''));
      return;
    }
    const t = taskDef();
    const c = ctx();
    const act = u.tasks.map((k, i) => [k, i]).filter(([k]) => taskActive(k));
    const dots = act.map(([, i]) => `<span class="dot ${i < s.task ? 'done' : i === s.task ? 'now' : ''}"></span>`).join('');

    let body = '';
    let actions = '';
    const ask = s.status === 'ask';
    const calcBtn = '<button class="btn-secondary" data-calc>🧮 Calculator</button>';
    if (t.type === 'mc') {
      const opts = t.options(c);
      if (!s.order) s.order = opts.map((_, i) => i);
      body = `<div class="mc-grid">${s.order.map(i => {
        const cls = ask ? '' : s.picked === i ? (opts[i].ok ? 'right' : 'wrong') : (opts[i].ok && s.status === 'correct' ? 'right' : 'dim');
        return `<button class="mc-btn ${cls}" data-mc="${i}" ${ask ? '' : 'disabled'}>${opts[i].t}</button>`;
      }).join('')}</div>`;
    }
    if (ask) {
      if (t.type === 'info') actions = '<button class="btn-primary" data-continue>Got it →</button>';
      if (t.type === 'data') actions = '<button class="btn-primary" data-check>Record my data ✓</button>';
      if (t.type === 'num') {
        if (!t.kind) body += ansRow(t.label, t.unit, s);
        actions = `<button class="btn-primary" data-check>Check ✓</button>${t.calc !== false ? calcBtn : ''}`;
      }
      if (t.type === 'findread' && s.phase === 'read') {
        if (!t.field && t.read) body += ansRow(t.read.label, t.read.unit, s);
        actions = '<button class="btn-primary" data-read-check>Check ✓</button>';
      }
      if (t.type === 'practice') {
        const step = fmtExact(s.vals.practice.step, 3);
        const h = t.ruler === 'height';
        const box = (k, u2, w) => `<input id="in_${k}" type="text" inputmode="decimal" autocomplete="off" value="${esc(s.inputs[k] || '')}" data-field="${k}" class="${w || ''}"> ${u2}`;
        body += `<ol class="practice">
          <li><span>Numbered mark just <strong>${h ? 'BELOW' : 'LEFT of'}</strong> the arrow:</span> ${box('p1', 'm')}</li>
          <li><span>Small ticks from that mark <strong>${h ? 'UP' : 'RIGHT'}</strong> to the arrow:</span> ${box('p2', 'ticks', 'short')}</li>
          <li><span>Reading = mark + ticks × ${step} =</span> ${box('p3', 'm')}</li></ol>`;
        actions = `<button class="btn-primary" data-practice-check>Check ✓</button>${calcBtn}`;
      }
      if (t.type === 'measure') actions = `<button class="btn-primary" data-row-check>Record ghost ${s.row} ✓</button>`;
      if (t.type === 'column') actions = `<button class="btn-primary" data-col-check>Check column ✓</button>${calcBtn}`;
      if (t.type === 'pick2' && s.picks.length === 2) {
        if (supportOn()) {
          const box = k => `<input id="in_${k}" type="text" inputmode="decimal" autocomplete="off" value="${esc(s.inputs[k] || '')}" data-field="${k}">`;
          body += `<ol class="practice">
            <li><span><strong>Rise</strong> = P2's up-value − P1's up-value =</span> ${box('rise')}</li>
            <li><span><strong>Run</strong> = P2's across-value − P1's across-value =</span> ${box('run')}</li>
            <li><span><strong>Slope</strong> = rise ÷ run =</span> <input id="in_ans" type="text" inputmode="decimal" autocomplete="off" value="${esc(s.inputs.ans || '')}" data-ans="1"> ${t.unit}</li></ol>`;
        } else body += ansRow(t.label, t.unit, s);
        actions = `<button class="btn-primary" data-check>Check ✓</button>${calcBtn}`;
      }
      if (t.type === 'trial' || t.type === 'test') {
        const max = Math.ceil(Math.max(...s.sc.speeds) * 1.5);
        body += dialHTML(s, max);
        const r = t.type === 'test' ? 4 : s.row;
        if (rowLaunched(r)) actions = `<button class="btn-primary" data-row-check>Record ${t.type === 'test' ? 'test' : `trial ${r + 1}`} ✓</button>`;
      }
      if (t.type === 'dial') body += dialHTML(s, Math.ceil(s.sc.vx * 2 / 5) * 5);
      if (teacherView() && ['data', 'num', 'measure', 'column', 'trial', 'test', 'findread', 'practice'].includes(t.type) && canReveal(t)) {
        actions += '<button class="btn-reveal" data-reveal title="Teacher only: fill in the answer to model it">👁 Reveal</button>';
      }
    }

    let fb = '';
    if (s.status === 'correct') {
      fb = `<div class="feedback good">${s.fb}</div><div class="task-actions"><button class="btn-primary" data-continue>Continue →</button></div>`;
    } else if (s.status === 'wrong') {
      const retry = lab && !s.vals.newScenario;
      fb = `<div class="feedback bad">${s.fb}</div><div class="task-actions">${retry
        ? '<button class="btn-accent" data-retry>↺ Try again</button>'
        : '<button class="btn-accent" data-newvals>🔄 New launch, new numbers</button>'}</div>`;
    } else if (s.fb) {
      fb = `<div class="feedback ${s.fbKind || 'info'}">${s.fb}</div>`;
    }

    card.innerHTML = subHTML(`
      <div class="task-top">
        <span class="step-badge ${lab ? 'badge-lab' : u.honors ? 'badge-honors' : u.arena ? 'badge-arena' : ''}">${badge}</span>
        <span class="mission-title">${u.title}</span>
        <button class="btn-read" data-read title="Read this task out loud">🔊 Read to me</button>
        ${testing() ? '<button class="btn-skip" data-skip title="Testing only: fill in this step and move on">⏭ Skip step</button>' : ''}
      </div>
      <div class="dots" aria-label="Progress">${dots}</div>
      <div class="prompt">${t.text(c, s)}</div>
      ${body}
      ${!lab && t.type !== 'info' ? tchartHTML() : ''}
      ${lab ? tableHTML() : ''}
      ${actions ? `<div class="task-actions">${actions}</div>` : ''}
      <p class="task-flash" aria-live="assertive"></p>
      ${fb}
      ${hintsHTML(t, s)}`);

    const dial = $('dial');
    if (dial) dial.addEventListener('input', () => setDial(parseFloat(dial.value)));
    // Keep the newest feedback, its button and the active box inside the panel (students won't scroll for it)
    const target = card.querySelector('.feedback ~ .task-actions') || card.querySelector('.feedback') || card.querySelector('.row-active') || card.querySelector('.tc-field.st-active');
    if (target) target.scrollIntoView({ block: 'nearest' });
  }

  function finishedHTML(u, list, badge) {
    const i = list.findIndex(x => x.id === u.id);
    const next = list.slice(i + 1).find(x => !state.done[x.id]) || list[i + 1];
    const s = scoreState(state);
    const allDone = s.required.every(id => state.done[id]);
    const lab = isLab(u);
    const scoreLine = profile.guest ? '' : `<p class="score-line">Score: <strong>${fmt(s.points, s.points % 1 ? 1 : 0)} / 10</strong> (best score saved)</p>`;
    const nextName = n => isLab(n) ? `${n.icon} ${n.label}: ${n.title}` : `${n.honors ? '⭐ ' : ''}Mission ${n.label}`;
    const nextBtn = next ? `<button class="btn-primary" data-unit="${next.id}">Next: ${nextName(next)} →</button>` : '';
    const msg = allDone ? 'You predicted every landing spot using the vertical and horizontal motion of a projectile, each on its own.'
      : lab ? 'Your data showed it: sideways motion is steady, and falling speeds up. Your table and graphs stay here to look back at.'
        : 'Bullseye! The vertical motion set the time, and the horizontal motion used it.';
    return `<div class="task-top"><span class="step-badge">${badge}</span><span class="mission-title">${u.title}</span></div>
      <div class="complete-card">
        <div class="complete-icon">${allDone ? '🏆' : '✅'}</div>
        <h2>${allDone ? 'All done!' : lab ? 'Lab complete!' : 'Mission complete!'}</h2>
        <p>${msg}</p>
        ${scoreLine}
        ${allDone && !profile.guest ? '<p class="score-line">✅ Your score saves automatically. Nothing to turn in.</p>' : ''}
        <div class="task-actions">${nextBtn}<button class="btn-secondary" data-replay>🔁 ${lab ? 'Redo this lab' : 'Replay'} with new numbers</button></div>
      </div>`;
  }

  // ---- Graphs ----
  function defaultPlots(u) { return u.kind === 'strobe' ? ['xt', 'yt'] : ['rv']; }

  function renderPlots() {
    const u = unit();
    if (!u || !isLab(u) || !sess()) return;
    const s = sess(), t = taskDef(), c = ctx();
    const keys = (t && t.plots) || defaultPlots(u);
    ['a', 'b'].forEach((slot, i) => {
      const key = keys[i] || null;
      const changed = plotKeys[slot] !== key;
      plotKeys[slot] = key;
      $(`plotWrap${slot.toUpperCase()}`).hidden = !key;
      if (!key) return;
      const d = u.plots[key](c);
      const picking = t && s.status === 'ask' && (t.type === 'pick2' || t.type === 'pickPoint') && t.plot === key;
      d.pickMode = picking ? (t.type === 'pick2' ? 'two' : 'one') : 'none';
      d.picks = t && t.type === 'pick2' && t.plot === key ? s.picks : t && t.type === 'pickPoint' && t.plot === key && s.picked !== null ? [s.picked] : [];
      if (t && t.type === 'pickPoint') d.pickLabels = ['your pick'];
      plots[slot].setData(d);
      if (changed) requestAnimationFrame(() => plots[slot].resize());
    });
    $('graphsCard').classList.toggle('two', keys.length > 1);
  }

  function graphsAvailable() {
    const u = unit();
    if (!u || !isLab(u) || !sess()) return false;
    const c = ctx();
    return c.reached(u.kind === 'strobe' ? 'st_measure' : 'sp_trial');
  }

  function syncLeft() {
    const t = taskDef();
    leftView = t && t.left === 'graphs' && graphsAvailable() ? 'graphs' : 'stage';
    syncLeftTabs();
  }

  function syncLeftTabs() {
    const lab = unit() && isLab(unit());
    $('leftTabs').hidden = !lab;
    $('tabGraphs').disabled = !graphsAvailable();
    if (!graphsAvailable()) leftView = 'stage';
    $('stageCard').hidden = leftView !== 'stage';
    $('graphsCard').hidden = leftView !== 'graphs';
    $('tabStage').classList.toggle('active', leftView === 'stage');
    $('tabGraphs').classList.toggle('active', leftView === 'graphs');
    if (leftView === 'graphs') requestAnimationFrame(() => { plots.a.resize(); plots.b.resize(); });
    else requestAnimationFrame(() => stage.resize());
  }

  function updateStageBar() {
    const s = sess();
    if (!s) return;
    const u = unit();
    const type = taskType();
    const canLaunch = !s.finished && LAUNCH_TYPES.includes(type) && s.status === 'ask' && !stage.flying;
    const btn = $('btnLaunch');
    btn.disabled = !canLaunch;
    btn.classList.toggle('pulse', canLaunch);
    $('bucketCtl').hidden = isLab(u);
    const d = stage.snap < 0.1 ? 2 : 1;
    const rev = u.kind === 'reverse';
    $('bucketReadout').textContent = rev ? 'locked' : `${fmt(s.bucketX || 0, d)} m`;
    $('bucketLabel').textContent = rev ? '🔒 Target:' : '🎯 Target position:';
    const canMove = !s.finished && type === 'place' && s.status === 'ask' && !stage.flying;
    $('btnLeft').disabled = !canMove;
    $('btnRight').disabled = !canMove;
  }

  function setDial(v) {
    const s = sess();
    s.dial = Math.max(0, Math.round(v * 10) / 10);
    stage.cfg.launchVx = s.dial;
    const out = $('dialOut');
    if (out) out.textContent = `${fmt(s.dial, 1)} m/s`;
    const dial = $('dial');
    if (dial && parseFloat(dial.value) !== s.dial) dial.value = s.dial;
    save(true);
  }

  function focusActive() {
    const el = document.querySelector('#taskCard .cell-active input, #taskCard .tc-field.st-active input, #taskCard .practice input, #in_ans');
    if (el) el.focus({ preventScroll: true });
  }

  // ---------- Teacher reveal: fill in the answer so the class can follow along on the projector ----------
  function canReveal(t) {
    if (t.type === 'num') return !!t.kind;
    if (t.type === 'findread') return sess().phase === 'read' && (t.field || t.read);
    if (t.type === 'trial' || t.type === 'test') return activeCells().length > 0;
    return true;
  }

  function reveal() {
    const s = sess(), t = taskDef(), sc = s.sc, c = ctx();
    if (t.type === 'data') {
      dataFields().forEach(q => { s.inputs[q] = q === 'vx' ? fmt(sc.vx, 1) : fmtExact(sc[q]); });
    } else if (t.type === 'num') {
      const target = sc[t.kind === 'vimp' ? 'v' : t.kind];
      s.inputs[t.kind] = t.kind === 'theta' ? fmt(target, 1) : fmtAns(target);
    } else if (t.type === 'findread') {
      if (t.field) s.inputs[t.field] = t.field === 'vx' ? fmt(sc.vx, 1) : fmtExact(sc[t.field]);
      else s.inputs.ans = fmtExact(t.read.answer(c), 2);
    } else if (t.type === 'practice') {
      const p = s.vals.practice;
      s.inputs.p1 = fmtExact(p.base, 3); s.inputs.p2 = String(p.k); s.inputs.p3 = fmtExact(p.value, 3);
    } else if (t.type === 'measure') {
      const row = sc.rows[s.row];
      s.table[s.row].x = fmtExact(row.x, 2);
      s.table[s.row].y = fmtExact(row.y, 2);
    } else if (t.type === 'column') {
      t.rows(c).forEach(r => { s.table[r][t.col] = fmtExact(t.expected(r, c), 3); });
    } else if (t.type === 'trial' || t.type === 'test') {
      const r = t.type === 'test' ? 4 : s.row;
      const v = r < 4 ? sc.speeds[r] : s.vals.p;
      s.table[r].dx = fmtExact(v * sc.T, 2);
      s.table[r].t = fmt(sc.T, 2);
    }
    s.fb = '👁 Teacher reveal: answer filled in. Press Check to continue.';
    s.fbKind = 'info';
    renderAll();
  }

  // ---------- Testing only: fill in what later steps need from this one, then move on ----------
  function skipStep() {
    const s = sess(), t = taskDef(), sc = s.sc, c = ctx();
    if (!t || !testing()) return;
    const onTick = (v, step) => fmtExact(Math.round(v / step) * step, 3);
    const fill = q => { s.inputs[q] = q === 'vx' ? fmt(sc.vx, 1) : fmtExact(sc[q], 3); };
    if (t.type === 'launch') s.launched = true;
    if (t.type === 'data') dataFields().forEach(fill);
    if (t.type === 'findread') {
      if (t.field) fill(t.field);
      if (t.read && t.read.store) s.vals[t.read.store] = t.read.answer(c);
    }
    if (t.type === 'num' && t.kind) s.inputs[t.kind] = fmtAns(sc[t.kind === 'vimp' ? 'v' : t.kind]);
    if (taskKey() === 'sp_predict') s.vals.prediction = s.vals.p * (s.vals.slopeR || sc.T);
    if (t.type === 'measure') sc.rows.forEach((g, r) => { s.table[r].x = onTick(g.x, stage.xStep); s.table[r].y = onTick(g.y, stage.yStep); });
    if (t.type === 'column') t.rows(c).forEach(r => { s.table[r][t.col] = fmtExact(t.expected(r, c), 4); });
    if (t.type === 'pick2' && t.onCorrect) {
      const pts = c.plotPoints(t.plot);
      const a = pts[0], b = pts[pts.length - 1];
      t.onCorrect(c, (b.y - a.y) / (b.x - a.x));
    }
    const record = (r, v) => {
      s.landed[r] = v * sc.T; s.landedVx[r] = v;
      s.table[r].dx = onTick(v * sc.T, stage.xStep); s.table[r].t = fmt(sc.T, 2);
    };
    if (t.type === 'trial') sc.speeds.forEach((v, r) => record(r, v));
    if (t.type === 'test') record(4, s.vals.p);
    if (t.type === 'place') { s.bucketX = Number(sc.dx.toFixed(2)); stage.cfg.bucketX = s.bucketX; }
    if (t.type === 'launch') configureStage();
    advance();
  }

  // ---------- Desmos calculator (floating, so it never pushes the work off screen) ----------
  let desmos = null;
  function toggleCalc(force) {
    const panel = $('calcPanel');
    const open = force !== undefined ? force : panel.hidden;
    panel.hidden = !open;
    if (!open) return;
    if (!window.Desmos) {
      $('calcHost').innerHTML = '<p class="calc-missing">The calculator did not load (no internet?). Use your own calculator.</p>';
      return;
    }
    if (!desmos) {
      try {
        desmos = Desmos.ScientificCalculator($('calcHost'), {
          degreeMode: true,
          invertedColors: root.classList.contains('theme-dark'),
          fontSize: Desmos.FontSizes ? Desmos.FontSizes.LARGE : undefined
        });
      } catch (e) {
        $('calcHost').innerHTML = '<p class="calc-missing">The calculator did not load. Use your own calculator.</p>';
      }
    } else if (desmos.resize) desmos.resize();
  }

  // ---------- Read aloud, saying units and symbols as words ----------
  function speakTask() {
    if (!('speechSynthesis' in window)) { setStatus('Read-aloud is not available in this browser.'); return; }
    const s = sess();
    const t = taskDef();
    if (!t) return;
    let text = t.text(ctx(), s);
    if (t.type === 'mc') text += ' ' + t.options(ctx()).map((o, i) => `Choice ${i + 1}: ${o.t}.`).join(' ');
    if (s.fb) text += ' ' + s.fb;
    text = text.replace(/<summary>[\s\S]*?<\/summary>[\s\S]*?<\/details>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/m\/s²/g, ' meters per second squared')
      .replace(/m\/s/g, ' meters per second')
      .replace(/(\d)\s*m\b/g, '$1 meters')
      .replace(/(\d)\s*s\b/g, '$1 seconds')
      .replace(/°/g, ' degrees')
      .replace(/tan⁻¹/g, 'inverse tangent of ')
      .replace(/√/g, ' the square root of ')
      .replace(/²/g, ' squared').replace(/[₁]/g, ' 1').replace(/[₂]/g, ' 2')
      .replace(/Δy/g, 'delta y').replace(/Δx/g, 'delta x')
      .replace(/\bv_(x|y)\b/g, 'v $1').replace(/θ/g, 'theta')
      .replace(/÷/g, ' divided by ').replace(/−/g, ' minus ').replace(/×/g, ' times ')
      .replace(/→/g, ', so ').replace(/[•⭐📏✓✗🔄🎯🤔🎛️🚀🔒🥁💥⬇➡🔎📝🧮📸🔬📈📐🔍🔮🧪👆⏱⊕]/gu, ' ').replace(/\s+/g, ' ');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  // ---------- Events ----------
  $('taskCard').addEventListener('click', e => {
    const row = e.target.closest('tr[data-row]');
    if (row && row.classList.contains('row-pick')) { rowClick(parseInt(row.dataset.row, 10)); return; }
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const s = sess();
    if (b.hasAttribute('data-read')) { speakTask(); return; }
    if (b.hasAttribute('data-calc')) { sfx.playClick(); toggleCalc(); return; }
    if (b.hasAttribute('data-hint')) { s.hints = (s.hints || 0) + 1; sfx.playClick(); save(); renderTask(); return; }
    if (b.hasAttribute('data-continue')) { sfx.playClick(); advance(); return; }
    if (b.hasAttribute('data-retry')) {
      sfx.playClick();
      retryTask();
      return;
    }
    if (b.hasAttribute('data-newvals')) {
      sfx.playClick();
      toggleCalc(false);
      if (isLab(unit())) { s.vals.newScenario = false; refreshScenario(); retryTask(); setStatus('New launch loaded.'); return; }
      newSession(s.id, s.sc.key, (s.tries || 0) + 1);
      setStatus('New launch loaded. Gather your data again.');
      return;
    }
    if (b.hasAttribute('data-check')) { if (taskType() === 'data') submitData(); else submitNum(); return; }
    if (b.hasAttribute('data-read-check')) { submitRead(); return; }
    if (b.hasAttribute('data-row-check')) { submitRow(); return; }
    if (b.hasAttribute('data-practice-check')) { submitPractice(); return; }
    if (b.hasAttribute('data-col-check')) { submitColumn(); return; }
    if (b.hasAttribute('data-mc')) { submitMC(parseInt(b.dataset.mc, 10)); return; }
    if (b.hasAttribute('data-dial')) { setDial((s.dial || 0) + parseInt(b.dataset.dial, 10) * 0.1); sfx.playClick(); return; }
    if (b.hasAttribute('data-unit')) { sfx.playClick(); startUnit(b.dataset.unit); return; }
    if (b.hasAttribute('data-replay')) {
      if (isLab(unit()) && !window.confirm('Start this lab over with a new launch? Your table will be cleared (your score is kept).')) return;
      sfx.playClick();
      newSession(s.id, s.sc.key, 0);
      return;
    }
    if (b.hasAttribute('data-reveal')) { reveal(); return; }
    if (b.hasAttribute('data-skip')) { if (!stage.flying) { sfx.playClick(); skipStep(); } return; }
  });

  // Keep typed values in the saved state; graphs update live; Enter moves on or checks
  $('taskCard').addEventListener('input', e => {
    const s = sess();
    const d = e.target.dataset || {};
    if (d.field) s.inputs[d.field] = e.target.value;
    if (d.ans) s.inputs.ans = e.target.value;
    if (d.cell) {
      const [r, col] = d.cell.split('|');
      s.table[parseInt(r, 10)][col] = e.target.value;
      renderPlots();
    }
    save(true);
  });
  $('taskCard').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT' || e.target.type === 'range') return;
    e.preventDefault();
    const inputs = [...document.querySelectorAll('#taskCard .cell-active input, #taskCard .tc-field.st-active input, #taskCard .practice input')];
    const i = inputs.indexOf(e.target);
    if (i >= 0 && i < inputs.length - 1) { inputs[i + 1].focus(); return; }
    const t = taskDef();
    if (!t) return;
    if (t.type === 'data') submitData();
    else if (t.type === 'findread') submitRead();
    else if (t.type === 'measure' || t.type === 'trial' || t.type === 'test') submitRow();
    else if (t.type === 'column') submitColumn();
    else if (t.type === 'practice') submitPractice();
    else submitNum();
  });

  $('missionStrip').addEventListener('click', e => {
    const b = e.target.closest('button[data-unit]');
    if (!b || b.disabled || stage.flying) return;
    sfx.playClick();
    toggleCalc(false);
    startUnit(b.dataset.unit);
  });

  $('tabStage').addEventListener('click', () => { leftView = 'stage'; sfx.playClick(); syncLeftTabs(); });
  $('tabGraphs').addEventListener('click', () => { leftView = 'graphs'; sfx.playClick(); renderPlots(); syncLeftTabs(); });

  $('btnLaunch').addEventListener('click', launch);
  $('btnLeft').addEventListener('click', () => { tool.nudge(-1); sfx.playClick(); });
  $('btnRight').addEventListener('click', () => { tool.nudge(1); sfx.playClick(); });
  $('chkStrobe').addEventListener('change', e => { stage.showStrobe = e.target.checked; });
  document.querySelectorAll('.speed-pill').forEach(b => b.addEventListener('click', () => {
    speed = parseFloat(b.dataset.speed);
    document.querySelectorAll('.speed-pill').forEach(x => x.classList.toggle('active', x === b));
    sfx.playClick();
  }));
  $('btnCloseCalc').addEventListener('click', () => toggleCalc(false));

  // ---------- Theme / projector / audio / teacher view ----------
  function syncButtons() {
    const dark = root.classList.contains('theme-dark');
    const proj = root.classList.contains('projector');
    $('btn-theme-toggle').textContent = dark ? '☀️ Light' : '🌙 Dark';
    $('btn-theme-toggle').disabled = proj;
    $('btn-projector-mode').textContent = proj ? '🖥️ Projector: ON' : '🖥️ Projector';
    $('btn-projector-mode').classList.toggle('active', proj);
    $('btnAudio').textContent = sfx.enabled ? '🔊 On' : '🔇 Off';
  }

  function refreshPalette() {
    stage.refreshPalette();
    plots.a.refreshPalette();
    plots.b.refreshPalette();
    if (state) renderPlots();
    if (desmos && desmos.updateSettings) desmos.updateSettings({ invertedColors: root.classList.contains('theme-dark') });
  }

  $('btn-theme-toggle').addEventListener('click', () => {
    const dark = !root.classList.contains('theme-dark');
    root.classList.toggle('theme-dark', dark);
    try { localStorage.setItem('hpw_theme', dark ? 'dark' : 'light'); } catch (e) { /* ignore */ }
    syncButtons(); sfx.playClick(); refreshPalette();
  });

  // Projector mode: 22px root text, forced ultra-contrast light theme, full-width stage
  $('btn-projector-mode').addEventListener('click', () => {
    const on = !root.classList.contains('projector');
    root.classList.toggle('projector', on);
    let dark = false;
    try {
      localStorage.setItem('hpw_projector', on ? 'on' : 'off');
      dark = localStorage.getItem('hpw_theme') === 'dark';
    } catch (e) { /* ignore */ }
    root.classList.toggle('theme-dark', !on && dark);
    syncButtons(); sfx.playClick();
    requestAnimationFrame(() => { refreshPalette(); stage.resize(); plots.a.resize(); plots.b.resize(); });
  });

  $('btnAudio').addEventListener('click', () => { sfx.setEnabled(!sfx.enabled); syncButtons(); sfx.playClick(); });

  $('viewSelect').addEventListener('change', e => {
    view = e.target.value;
    try { localStorage.setItem('hpw_view', view); } catch (err) { /* ignore */ }
    // Leaving an Honors unit when switching to a P1–6 view
    if (!available().some(u => u.id === state.current)) startUnit('lab1');
    else if (sess() && !sess().finished && !taskActive(taskKey())) enterTask();
    else { configureStage(); renderAll(); }
  });

  new ResizeObserver(() => { if (leftView === 'stage') stage.resize(); }).observe($('simCanvas').parentElement);
  new ResizeObserver(() => { if (leftView === 'graphs') { plots.a.resize(); plots.b.resize(); } }).observe($('graphsCard'));
  // The workbench fills exactly the space under the sticky header (which can wrap to two rows)
  new ResizeObserver(([e]) => root.style.setProperty('--header-h', `${Math.ceil(e.target.getBoundingClientRect().height)}px`))
    .observe(document.querySelector('.app-header'));

  // ---------- Loop ----------
  let last = performance.now();
  function frame(now) {
    // Queue the next frame first, so one error can never freeze the apparatus
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const wasFlying = stage.flying;
    stage.update(dt * speed);
    if (wasFlying && !stage.flying) updateStageBar();
    stage.highlightBucket = taskType() === 'place' && sess().status === 'ask';
    if (leftView === 'stage') stage.draw();
    else { if (plotKeys.a) plots.a.draw(); if (plotKeys.b) plots.b.draw(); }
  }

  // ---------- Start (called by js/auth.js once the student's saved state is loaded) ----------
  function start(loaded, cloudSaver, prof) {
    cloud = cloudSaver;
    profile = prof || profile;
    state = validState(loaded) ? loaded : newState();
    if (cloud) cloud.state = state;
    if (isTeacher()) {
      try { view = localStorage.getItem('hpw_view') || 'teacher'; } catch (e) { view = 'teacher'; }
      $('viewSelect').value = view;
      $('viewWrap').hidden = false;
    }
    syncButtons();
    refreshPalette();
    const asked = new URLSearchParams(window.location.search).get('unit');
    const cur = asked && available().some(u => u.id === asked) && unlocked(asked) ? asked
      : available().find(u => u.id === state.current) ? state.current : 'lab1';
    startUnit(cur);
    requestAnimationFrame(frame);
  }

  window.HPWApp = { start, newState, validState, scoreState };
})();

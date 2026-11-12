// Highway Curve Lab — what every page shares: saved work, credit, moving between pages, wait timers and the task card.
// Each kind of page (aim, run, trial, plot, …) adds itself to FLApp.kinds in the files that follow.
// Saved after every step, so a student resumes on any device with the same numbers. Credit never drops.

(function () {
  if (typeof document !== 'undefined') document.addEventListener('contextmenu', e => e.preventDefault());
  const $ = id => document.getElementById(id);
  const FL = window.FL, Lesson = window.Lesson;
  const esc = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const A = window.FLApp = { $, esc, kinds: {}, state: null, cloud: null, profile: null, tier: null, CERT_PERCENT: 75 };
  A.ui = { fb: null, draft: '', work: null, hints: 0 };   // what is on screen right now; never saved

  // ---------- Saved work ----------
  A.newState = () => {
    const parts = {};
    Lesson.PARTS.filter(p => p.id !== 'quiz').forEach(p => { parts[p.id] = { i: 0, far: 0, done: false }; });
    return { v: 1, tier: null, current: 'skid', rig: null, parts, pg: {}, table: [], limits: {}, graph: {}, found: {}, prediction: null,
      quiz: { best: 0, attempts: [], cur: null, last: null, lockUntil: 0 }, mistakes: {}, tries: {}, time: {}, calcUnavailable: false, bestPoints: 0, savedAt: 0 };
  };
  A.validState = s => !!(s && s.v === 1 && s.parts && s.parts.skid && s.quiz && s.pg && typeof s.current === 'string');

  A.scoreState = (st, forTier) => {
    const tier = forTier || A.tier || st.tier || 'cp';
    const earned = Math.round(Lesson.earnedPoints(st, tier) * 10) / 10;
    st.bestPoints = Math.max(st.bestPoints || 0, earned);
    const req = Lesson.PARTS.filter(p => p.weight > 0);
    const done = req.filter(p => st.parts[p.id] && st.parts[p.id].done).map(p => p.id);
    if ((st.quiz.attempts || []).length) done.push('quiz');
    const last = st.quiz.attempts[st.quiz.attempts.length - 1];
    const tries = Object.values(st.tries || {});
    return {
      points: st.bestPoints, percentage: Math.round(st.bestPoints * 10),
      progress: Object.fromEntries(req.map(p => [p.id, Math.round(Lesson.partProgress(st, p.id, tier) * 100)])),
      done, required: req.length + 1,
      quizBest: st.quiz.best || 0, quizHistory: st.quiz.attempts.map(a => a.pct), skills: last ? last.skills : {},
      mistakes: st.mistakes, calcUnavailable: !!st.calcUnavailable, cert: st.cert || null,
      questions: tries.length, firstTry: tries.length ? Math.round((100 * tries.filter(t => t.first).length) / tries.length) : null,
      minutes: Math.round(Object.values(st.time || {}).reduce((s, v) => s + v, 0) / 60)
    };
  };
  A.save = immediate => { A.scoreState(A.state); if (A.cloud) A.cloud.queueSave(immediate); A.updateScoreChip(); };

  A.recordMistake = id => { if (id && id !== 'blank') A.state.mistakes[id] = (A.state.mistakes[id] || 0) + 1; };
  // First-try accuracy: what the teacher's monitor shows next to the score
  A.recordTry = (key, ok) => { const t = A.state.tries[key] || (A.state.tries[key] = { n: 0, first: !!ok }); t.n++; };

  // ---------- Wait timers: a button that counts down before it can be pressed. The end time is saved, so a reload does not skip it. ----------
  A.fast = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]fast\b/.test(location.search);
  A.wait = secs => Date.now() + secs * (A.fast ? 50 : 1000);
  A.left = until => { const ms = (until || 0) - Date.now(); return ms > 0 && ms < 120000 ? Math.ceil(ms / 1000) : 0; };
  A.btn = (id, label, cls = 'btn-primary', until = 0, attrs = '') => {
    const left = A.left(until);
    return `<button type="button" class="${cls}" id="${id}" ${attrs} ${left ? `disabled data-until="${until}" data-label="${esc(label)}"` : ''}>${label}${left ? ` (${left})` : ''}</button>`;
  };
  setInterval(() => document.querySelectorAll('[data-until]').forEach(b => {
    const left = A.left(Number(b.dataset.until));
    if (left) { b.textContent = `${b.dataset.label} (${left})`; return; }
    b.disabled = false; b.textContent = b.dataset.label; b.removeAttribute('data-until');
  }), 250);

  // Time on each page, counted only while the tab is showing and the student is doing something
  let lastTick = Date.now(), lastInput = Date.now();
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { lastInput = Date.now(); }, true));
  setInterval(() => {
    const now = Date.now(), gap = Math.min(30, (now - lastTick) / 1000);
    lastTick = now;
    if (!A.state || document.hidden || now - lastInput > 120000) return;
    const key = A.state.current === 'quiz' ? 'quiz' : (A.page() ? A.page().id : null);
    if (key) A.state.time[key] = Math.round(((A.state.time[key] || 0) + gap) * 10) / 10;
  }, 5000);

  // ---------- Where we are ----------
  A.part = () => A.state.parts[A.state.current];
  A.pages = () => Lesson.pages(A.state.current, A.tier);
  A.page = () => (A.state.current === 'quiz' || !A.part() || A.part().i >= A.pages().length ? null : A.pages()[A.part().i]);
  A.d = id => { const k = id || A.page().id; return A.state.pg[k] || (A.state.pg[k] = {}); };
  A.kind = () => { const pg = A.page(); return pg ? A.kinds[pg.kind] : null; };
  A.partName = id => Lesson.PARTS.find(p => p.id === id).name;

  const unlockedAll = () => A.profile.teacher || A.profile.preview;
  A.isUnlocked = id => {
    if (unlockedAll()) return true;
    const list = Lesson.PARTS, idx = list.findIndex(p => p.id === id);
    return idx === 0 || !!(A.state.parts[list[idx - 1].id] && A.state.parts[list[idx - 1].id].done);
  };

  // Teacher / preview helper: fill in an honest sample data table (and optionally the plotted points) so Graph It
  // and the later parts can be inspected without running every trial first.
  A.fillSampleData = (opts = {}) => {
    if (!unlockedAll()) return;
    const st = A.state, tier = A.tier, rig = st.rig || (st.rig = FL.newRig(tier));
    const nTrials = FL.TRIALS[tier];
    if (!st.table || st.table.length < nTrials || opts.force) st.table = FL.sampleTable(tier, rig);
    if (tier === 'cp' && (!st.limits || !st.limits.icy || opts.force)) { st.limits = FL.sampleLimits(); A.d('t_limits').done = true; }
    for (let n = 1; n <= nTrials; n++) { const td = A.d(`t${n}`); td.step = 'done'; if (tier === 'honors') td.q = { ok: true, val: st.table[n - 1].v2 }; }
    st.parts.measure.done = true; st.parts.measure.far = Lesson.pages('measure', tier).length;
    if (opts.plotAll) {
      for (let n = 1; n <= nTrials; n++) A.d(`pl${n}`).ok = true;
      st.graph.n = nTrials;
      if (tier === 'honors' && opts.linearize) { A.d('g_straight').ok = true; st.graph.yKey = 'vmax2'; }
      if (tier === 'honors' && !st.graph.slope) {
        const pts = st.table.map(r => FL.rowXY(tier, r, 'vmax2')), p = pts[1], q = pts[0];
        st.graph.pts = [1, 0]; st.graph.slope = FL.round((q.y - p.y) / (q.x - p.x), 1);
      }
      if (tier === 'cp' && opts.linearize) ['dry', 'wet', 'icy'].forEach(s => { if (!st.graph[`cross_${s}`]) st.graph[`cross_${s}`] = FL.round(FL.crossAt(FL.fitK(st.table), st.limits[s]), 1); });
      if (tier === 'conceptual' && !st.predV) st.predV = st.table.find(r => r.surf === 'icy').v;
      if (tier === 'honors' && !st.predV) st.predV = FL.round(Math.sqrt(st.graph.slope * FL.SURF.gravel.mu), 2);
      if (tier === 'honors') st.rShown = true;
    }
  };
  // The wet-road fastest speed the student found, used for the speed sign
  A.wetSpeed = () => {
    const st = A.state;
    if (A.tier === 'cp') return st.found.wet || FL.safeSpeed(FL.SURF.wet.mu, st.rig.r);
    const row = (st.table || []).find(r => r.surf === 'wet' && (r.veh || 'car') === 'car');
    return row ? row.v : FL.safeSpeed(FL.SURF.wet.mu, st.rig.r, FL.SLIDER[A.tier].step);
  };

  A.fresh = () => {
    A.ui = { fb: null, draft: '', work: null, hints: A.tier === 'conceptual' ? 1 : 0 };   // first hint open; never labeled
    if (A.resetSim) A.resetSim();
    if (A.clearCalc) A.clearCalc();
  };
  A.enter = () => {
    A.fresh();
    const pg = A.page(), k = A.kind();
    if (pg && k && k.enter) k.enter(pg, A.d());
    if (A.quizEnter) A.quizEnter();
  };
  A.goTo = i => { const p = A.part(); p.far = Math.max(p.far || 0, i); p.i = i; A.enter(); A.save(); A.render(); };
  A.advance = () => {
    const p = A.part(), n = A.pages().length;
    if (p.i + 1 < n) return A.goTo(p.i + 1);
    p.far = n; p.i = n; p.done = true;
    A.fresh(); A.save(true); A.render();
  };
  const previousPart = () => { const list = Lesson.PARTS, idx = list.findIndex(x => x.id === A.state.current); return idx > 0 ? list[idx - 1].id : null; };
  // Hidden while a wrong answer is showing: that answer's way forward is a new version.
  A.canBack = () => !(A.ui.fb && A.ui.fb.bad) && (!!previousPart() || (A.part() && A.part().i > 0));
  A.goBack = () => {
    if (A.state.current === 'quiz') return A.quizBack();
    const p = A.part();
    if (p.i === 0) return A.openPart(previousPart());
    p.i = Math.min(p.i, A.pages().length) - 1;
    A.enter(); A.save(); A.render();
  };
  A.openPart = id => {
    if (!id || !A.isUnlocked(id)) return;
    A.state.current = id;
    if (['graph', 'weather', 'engineer'].includes(id) && unlockedAll() && (!A.state.table || A.state.table.length < FL.TRIALS[A.tier])) {
      A.fillSampleData({ plotAll: id !== 'graph', linearize: id !== 'graph' });
    }
    A.enter(); A.save(); A.render();
  };

  // ---------- The task card ----------
  const READ = '<button type="button" class="btn-read" id="btnRead" title="Read this page out loud">🔊 Read to me</button>';
  A.top = label => {
    const canJump = unlockedAll() && A.state.current !== 'quiz' && A.pages().length > 1;
    const stepSelect = canJump ? `<select id="stepJump" class="step-jump" aria-label="Teacher: jump to step">${A.pages().map((pg, idx) => `<option value="${idx}" ${idx === A.part().i ? 'selected' : ''}>Step ${idx + 1}: ${esc(pg.title)}</option>`).join('')}</select>` : '';
    return `<div class="task-top"><span class="task-count">${label}</span><div class="task-top-tools">${stepSelect}${READ}</div></div>`;
  };
  A.header = () => A.top(`${A.partName(A.state.current)} · Step ${A.part().i + 1} of ${A.pages().length}`);
  A.backBtn = () => (A.canBack() ? '<button type="button" class="btn-secondary" id="btnBack">◀ Back</button>' : '');
  A.nextBtn = (label = 'Next ▶') => `<button type="button" class="btn-primary" id="btnNext">${label}</button>`;
  A.actions = (...buttons) => `<div class="task-actions">${A.backBtn()}${buttons.join('')}</div>`;
  A.title = t => `<h2 class="task-title" id="readable">${t}</h2>`;
  A.note = (cls, html) => `<div class="feedback ${cls}" role="status">${html}</div>`;
  A.okNote = msg => A.note('fb-ok', `<strong>✓ Correct!</strong> ${msg || ''}`);
  A.fbHTML = () => {
    const fb = A.ui.fb;
    if (!fb) return '';
    if (fb.retry) return A.note('fb-retry', fb.msg);
    return A.note(fb.ok ? 'fb-ok' : 'fb-bad', `<strong>${fb.ok ? '✓ Correct!' : '✗ Not yet.'}</strong> ${fb.msg || ''}`);
  };
  A.hintsHTML = hints => {
    if (!hints || !hints.length) return '';
    const open = A.ui.hints, shown = hints.slice(0, open).map(h => `<div class="hint">💡 ${h}</div>`).join('');
    const more = open < hints.length ? `<button type="button" class="btn-hint" id="btnHint">${open ? 'Another hint' : 'Show a hint'}</button>` : '';
    return `<div class="hints">${shown}${more}</div>`;
  };
  A.answerBox = (q, disabled, value) => {
    const useCalc = q.calc && window.Desmos;
    if (q.calc && !window.Desmos) A.state.calcUnavailable = true;
    return `<label class="ans-row"><span class="ans-sym">${q.sym}${q.noEq ? '' : ' ='}</span>
      <input id="answer" type="text" inputmode="decimal" autocomplete="off" value="${esc(value)}"
        ${useCalc ? 'readonly tabindex="-1" class="calc-readonly" placeholder="calculator"' : ''} ${disabled ? 'disabled' : ''}
        aria-label="${q.sym.replace(/_/g, ' ')}${useCalc ? ', filled in from the calculator' : ''}">
      <span class="ans-unit">${q.unit}</span></label>`;
  };

  // One number question. s is its saved record: { ok, val, msg, miss, until, bad }.
  A.qHTML = (q, s, o = {}) => {
    const done = !!s.ok, bad = !done && !!s.bad;
    const button = done ? (o.next || A.nextBtn()) : bad ? A.btn('btnNew', 'Try new numbers ▶', 'btn-primary', s.until) : A.btn('btnCheck', 'Check', 'btn-primary', s.until);
    return `${o.tag ? `<p class="launch-tag">${o.tag}</p>` : ''}${A.title(o.title || q.ask)}
      ${q.formula ? `<p class="formula-box"><span class="formula">${q.formula}</span></p>` : ''}
      ${A.answerBox(q, done || bad, done ? FL.fmt(s.val) : A.ui.draft)}
      ${done ? A.okNote(s.msg) : bad ? A.note('fb-bad', `<strong>✗ Not yet.</strong> ${s.bad}`) : A.fbHTML()}
      ${A.actions(button + (o.extra || ''))}${done || bad ? '' : A.hintsHTML(q.hints)}`;
  };
  // Checks the answer in the box. A miss on the student's own data keeps the data and makes them wait a little longer each time.
  // A miss on a dealt problem shows the right way, then waits before new numbers.
  A.checkQ = (q, s, key, o = {}) => {
    if (s.ok || A.left(s.until)) return;
    const r = FL.grade(q, A.ui.draft);
    if (r.mistake === 'blank') { A.ui.fb = { retry: true, msg: r.msg }; return A.renderTask(); }
    A.recordTry(key, r.ok);
    if (r.ok) {
      s.ok = true; s.val = FL.parseNum(A.ui.draft); s.msg = o.okMsg ? o.okMsg(s.val) : r.msg;
      if (A.ui.work) s.work = A.ui.work;
      A.ui.fb = null;
      if (o.onOk) o.onOk(s.val);
      A.ui.draft = ''; A.ui.work = null;
      if (A.clearCalc) A.clearCalc();
    } else {
      A.recordMistake(r.mistake);
      s.miss = (s.miss || 0) + 1;
      if (r.retry) { s.until = A.wait(Math.min(20, 4 + 4 * s.miss)); A.ui.fb = { retry: true, msg: r.msg }; } else { s.until = A.wait(8); s.bad = r.msg; A.ui.fb = { bad: true, msg: r.msg }; }
      A.ui.draft = ''; A.ui.work = null;
      if (A.clearCalc) A.clearCalc();
    }
    A.save(); A.render();
  };

  A.readAloud = () => {
    const el = $('readable');
    if (!window.speechSynthesis || !el) return;
    speechSynthesis.cancel();
    const clean = el.innerText.replace(/\s*\n+\s*=\s*\n+\s*/g, ' equals ')
      .replace(/μ/g, ' mu ').replace(/v\s*max/g, 'v max').replace(/v²/g, 'v squared').replace(/kN/g, ' kilonewtons').replace(/m\/s²/g, ' meters per second squared').replace(/m\/s/g, ' meters per second').replace(/²/g, ' squared')
      .replace(/√/g, 'the square root of ').replace(/π/g, ' pi ').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/→/g, ' gives ');
    speechSynthesis.speak(new SpeechSynthesisUtterance(clean));
  };
})();

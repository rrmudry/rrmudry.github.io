// Work & Simple Machines Practice — core state, scoring, navigation, GUESS strip, timers, hints, and read-aloud.
// Saved after every step so a student resumes on any device with the exact same numbers. Credit never drops.

(function () {
  if (typeof document !== 'undefined') document.addEventListener('contextmenu', e => e.preventDefault());
  const $ = id => document.getElementById(id);
  const SMP = window.SMP, Lesson = window.Lesson, Scene = window.Scene;
  const esc = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const A = window.SMPApp = { $, esc, kinds: {}, state: null, cloud: null, profile: null, tier: 'cp', CERT_PERCENT: 75 };
  A.ui = { fb: null, draft: '', work: null, hints: 0, selectedChip: null };

  A.newState = () => {
    const parts = {};
    Lesson.PARTS.filter(p => p.id !== 'quiz').forEach(p => { parts[p.id] = { i: 0, far: 0, done: false }; });
    return {
      v: 1, tier: null, current: 'setup', parts, pg: {}, prediction: null,
      quiz: { best: 0, attempts: [], cur: null, last: null, lockUntil: 0 },
      mistakes: {}, tries: {}, time: {}, calcUnavailable: false, bestPoints: 0, savedAt: 0
    };
  };
  A.validState = s => !!(s && s.v === 1 && s.parts && s.parts.setup && s.quiz && s.pg && typeof s.current === 'string');

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
      quizBest: st.quiz.best || 0, quizHistory: st.quiz.attempts.map(a => a.pct),
      skills: last ? last.skills : {}, mistakes: st.mistakes,
      calcUnavailable: !!st.calcUnavailable, cert: st.cert || null,
      questions: tries.length,
      firstTry: tries.length ? Math.round((100 * tries.filter(t => t.first).length) / tries.length) : null,
      minutes: Math.round(Object.values(st.time || {}).reduce((s, v) => s + v, 0) / 60)
    };
  };
  A.save = immediate => { A.scoreState(A.state); if (A.cloud) A.cloud.queueSave(immediate); A.updateScoreChip(); };
  A.recordMistake = id => { if (id && id !== 'blank') A.state.mistakes[id] = (A.state.mistakes[id] || 0) + 1; };
  A.recordTry = (key, ok) => { const t = A.state.tries[key] || (A.state.tries[key] = { n: 0, first: !!ok }); t.n++; };

  // Cooldown wait timers (accelerated on localhost?fast for testing)
  A.fast = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]fast\b/.test(location.search);
  A.wait = secs => Date.now() + secs * (A.fast ? 40 : 1000);
  A.left = until => { const ms = (until || 0) - Date.now(); return ms > 0 && ms < 120000 ? Math.ceil(ms / 1000) : 0; };
  A.btn = (id, label, cls = 'btn-primary', until = 0, attrs = '') => {
    const left = A.left(until);
    return `<button type="button" class="${cls}" id="${id}" ${attrs} ${left ? `disabled data-until="${until}" data-label="${esc(label)}"` : ''}>${label}${left ? ` (${left})` : ''}</button>`;
  };
  if (typeof document !== 'undefined') {
    setInterval(() => document.querySelectorAll('[data-until]').forEach(b => {
      const left = A.left(Number(b.dataset.until));
      if (left) { b.textContent = `${b.dataset.label} (${left})`; return; }
      b.disabled = false; b.textContent = b.dataset.label; b.removeAttribute('data-until');
    }), 250);

    let lastTick = Date.now(), lastInput = Date.now();
    ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { lastInput = Date.now(); }, true));
    setInterval(() => {
      const now = Date.now(), gap = Math.min(30, (now - lastTick) / 1000);
      lastTick = now;
      if (!A.state || document.hidden || now - lastInput > 120000) return;
      const key = A.state.current === 'quiz' ? 'quiz' : (A.page() ? A.page().id : null);
      if (key) A.state.time[key] = Math.round(((A.state.time[key] || 0) + gap) * 10) / 10;
    }, 5000);
  }

  A.part = () => A.state.parts[A.state.current];
  A.pages = () => Lesson.pages(A.state.current, A.tier);
  A.page = () => (A.state.current === 'quiz' || !A.part() || A.part().i >= A.pages().length ? null : A.pages()[A.part().i]);
  A.d = id => { const k = id || A.page().id; return A.state.pg[k] || (A.state.pg[k] = {}); };
  A.kind = () => { const pg = A.page(); return pg ? A.kinds[pg.kind] : null; };
  A.partName = id => Lesson.PARTS.find(p => p.id === id).name;

  const unlockedAll = () => A.profile && (A.profile.teacher || A.profile.preview);
  A.isUnlocked = id => {
    if (unlockedAll()) return true;
    const list = Lesson.PARTS, idx = list.findIndex(p => p.id === id);
    return idx === 0 || !!(A.state.parts[list[idx - 1].id] && A.state.parts[list[idx - 1].id].done);
  };

  A.fresh = () => { A.ui = { fb: null, draft: '', work: null, hints: A.tier === 'conceptual' ? 1 : 0, selectedChip: null }; if (A.clearCalc) A.clearCalc(); };
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
    A.enter(); A.save(); A.render();
  };

  // ---------- Strip, Header, GUESS Board ----------
  A.renderStrip = () => {
    const st = A.state;
    $('partStrip').innerHTML = Lesson.PARTS.map(p => {
      const open = A.isUnlocked(p.id), on = st.current === p.id;
      const pct = p.id === 'quiz' ? (st.quiz.best || 0) : Math.round(Lesson.partProgress(st, p.id, A.tier) * 100);
      const finished = p.id === 'quiz' ? st.quiz.attempts.length > 0 : st.parts[p.id].done;
      return `<button type="button" class="part-tab ${on ? 'part-on' : ''} ${finished ? 'part-done' : ''}" data-part="${p.id}" ${open ? '' : 'disabled'} ${on ? 'aria-current="step"' : ''}>
        <span class="part-name">${open ? p.icon : '🔒'} ${p.name}${finished && p.id !== 'quiz' ? ' ✓' : ''}</span>
        <span class="part-bar"><span style="width:${pct}%"></span></span></button>`;
    }).join('');
    document.querySelectorAll('#partStrip [data-part]').forEach(b => b.addEventListener('click', () => A.openPart(b.dataset.part)));
  };

  A.updateScoreChip = () => {
    const el = $('scoreChip');
    if (el && A.state) el.textContent = `${(A.state.bestPoints || 0).toFixed(1)} / 10`;
    if (A.certStatus) $('btnCert').hidden = !(A.certStatus().ready && (!A.profile.guest || A.profile.preview));
  };

  A.guessStripHTML = cells => `<div class="guess-strip">${cells.map(([l, name, val, state]) =>
    `<div class="gs-cell ${state ? `gs-${state}` : ''}"><div class="gs-head"><span class="gs-letter">${l}</span><span>${name}</span></div>`
    + `<div class="gs-val ${val ? '' : 'gs-blank'}">${val || '—'}</div></div>`
  ).join('')}</div>`;

  // ---------- Task Card Helpers ----------
  const READ = '<button type="button" class="btn-read" id="btnRead" title="Read this page out loud">🔊 Read to me</button>';
  A.top = label => {
    const canJump = unlockedAll() && A.state.current !== 'quiz' && A.pages().length > 1;
    const stepSelect = canJump
      ? `<select id="stepJump" class="step-jump" aria-label="Teacher: jump to step">${A.pages().map((pg, idx) => `<option value="${idx}" ${idx === A.part().i ? 'selected' : ''}>Step ${idx + 1}: ${esc(pg.title)}</option>`).join('')}</select>`
      : '';
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
    return `<label class="ans-row"><span class="ans-sym">${q.sym} =</span>
      <input id="answer" type="text" inputmode="decimal" autocomplete="off" value="${esc(value)}"
        ${useCalc ? 'readonly tabindex="-1" class="calc-readonly" placeholder="calculator"' : ''} ${disabled ? 'disabled' : ''}
        aria-label="${q.sym.replace(/_/g, ' ')}${useCalc ? ', filled in from the calculator' : ''}">
      <span class="ans-unit">${q.unit}</span></label>`;
  };

  A.symKeyHTML = symbols => (symbols && symbols.length
    ? `<div class="sym-key">${symbols.map(x => `<span class="sym-pill">${x}</span>`).join('')}</div>` : '');

  A.triWrapHTML = (tri, note) => {
    if (!tri) return '';
    const svg = tri.kind === 'ma' ? Scene.maTriangleSVG(tri.cover) : Scene.triangleSVG(tri.cover);
    return `<div class="tri-wrap">${svg}<div class="tri-note">${note || 'Cover the unknown in the triangle:<br>Top ÷ Bottom, or Bottom × Bottom'}</div></div>`;
  };

  A.qHTML = (q, s, o = {}) => {
    const done = !!s.ok, bad = !done && !!s.bad;
    const button = done ? (o.next || A.nextBtn()) : bad ? A.btn('btnNew', 'Try new numbers ▶', 'btn-primary', s.until) : A.btn('btnCheck', 'Check', 'btn-primary', s.until);
    const triObj = q.tri === 'triangle' ? { kind: 'work', cover: null } : q.tri;
    const tri = triObj ? A.triWrapHTML(triObj, q.formula ? `Cover <strong>${triObj.cover === 'Fout' ? 'F_out' : triObj.cover === 'Fin' ? 'F_in' : triObj.cover}</strong> in the triangle:<br><strong>${q.formula}</strong>` : null) : '';
    const ratio = q.ratio
      ? `<div class="ratio"><span>height: ${SMP.fmt(q.ratio.h)} m</span><span class="r-op">× ${q.ratio.mult} →</span><span>ramp: ${SMP.fmt(q.ratio.d)} m</span><span></span>`
        + `<span class="wk-F-text">straight lift: ${SMP.fmt(q.ratio.Fout)} N</span><span class="r-op r-ask">÷ ${q.ratio.mult} →</span><span class="r-ask">ramp push: ? N</span><span></span></div>` : '';
    return `${o.tag ? `<p class="launch-tag">${o.tag}</p>` : ''}${A.title(o.title || q.ask)}
      ${A.symKeyHTML(q.symbols)}
      ${q.teach ? `<div class="teach-box">${q.teach}</div>` : ''}
      ${o.fricBarHTML || ''}
      ${tri}${ratio}
      ${q.formula ? `<p class="formula-box"><span class="formula">${q.formula}</span></p>` : ''}
      ${A.answerBox(q, done || bad, done ? SMP.fmt(s.val) : A.ui.draft)}
      ${done ? A.okNote(s.msg) : bad ? A.note('fb-bad', `<strong>✗ Not yet.</strong> ${s.bad}`) : A.fbHTML()}
      ${A.actions(button + (o.extra || ''))}${done || bad ? '' : A.hintsHTML(q.hints)}`;
  };

  A.checkQ = (q, s, key, o = {}) => {
    if (s.ok || A.left(s.until)) return;
    const r = SMP.grade(q, A.ui.draft);
    if (r.mistake === 'blank') { A.ui.fb = { retry: true, msg: r.msg }; return A.renderTask(); }
    A.recordTry(key, r.ok);
    if (r.ok) {
      s.ok = true; s.val = SMP.parseNum(A.ui.draft); s.msg = o.okMsg ? o.okMsg(s.val) : r.msg;
      if (A.ui.work) s.work = A.ui.work;
      A.ui.fb = null;
      if (o.onOk) o.onOk(s.val);
      A.ui.draft = ''; A.ui.work = null;
      if (A.clearCalc) A.clearCalc();
    } else {
      A.recordMistake(r.mistake);
      s.miss = (s.miss || 0) + 1;
      if (r.retry) { s.until = A.wait(Math.min(20, 4 + 4 * s.miss)); A.ui.fb = { retry: true, msg: r.msg }; }
      else { s.until = A.wait(8); s.bad = r.msg; A.ui.fb = { bad: true, msg: r.msg }; }
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
      .replace(/m\/s²/g, 'meters per second squared').replace(/²/g, ' squared')
      .replace(/\bJ\b/g, 'joules').replace(/\bN\b/g, 'newtons').replace(/\bMA\b/g, 'mechanical advantage')
      .replace(/−/g, ' minus ').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/→/g, ' gives ');
    speechSynthesis.speak(new SpeechSynthesisUtterance(clean));
  };

  function doneHTML() {
    const list = Lesson.PARTS, idx = list.findIndex(p => p.id === A.state.current), next = list[idx + 1];
    return `<div class="done-card"><div class="done-mark" aria-hidden="true">✅</div>
      <h2 class="task-title">${list[idx].name} finished!</h2>
      <p>Your credit for this part is saved.</p>
      <div class="task-actions">${A.backBtn()}
        <button type="button" class="btn-secondary" id="btnReview">Go through it again</button>
        ${next ? `<button type="button" class="btn-primary" data-part="${next.id}">${next.name} ▶</button>` : ''}
      </div></div>`;
  }

  A.renderStage = () => {
    const pg = A.page(), k = A.kind();
    if (A.state.current === 'quiz') {
      $('stage').innerHTML = A.quizScene();
      $('stageCtl').innerHTML = '';
      $('guessBoard').innerHTML = window.subHTML(A.quizGuessBoard ? A.quizGuessBoard() : '');
      return;
    }
    $('stage').innerHTML = pg && k.scene ? k.scene(pg, A.d()) : Scene.tradeoffDemo(1, true);
    $('stageCtl').innerHTML = pg && k.ctl ? k.ctl(pg, A.d()) : '';
    $('guessBoard').innerHTML = window.subHTML(pg && k.board ? k.board(pg, A.d()) : '');
    if (pg && k.bindStage) k.bindStage(pg, A.d());
  };

  A.renderTask = () => {
    if (A.state.current === 'quiz') { A.quizTask(); A.syncCalc(); return; }
    const pg = A.page(), k = A.kind();
    $('taskCard').innerHTML = window.subHTML(pg ? A.header() + k.task(pg, A.d()) : doneHTML());
    bindTask();
    if (pg && k.bindTask) k.bindTask(pg, A.d());
    A.syncCalc();
  };

  A.render = () => {
    A.renderStrip();
    A.renderStage();
    A.renderTask();
    A.updateScoreChip();
  };

  A.on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };

  function bindTask() {
    A.on('btnNext', () => A.advance());
    A.on('btnBack', () => A.goBack());
    A.on('btnHint', () => { A.ui.hints++; A.renderTask(); });
    A.on('btnRead', A.readAloud);
    A.on('btnReview', () => { A.part().i = 0; A.enter(); A.save(); A.render(); });
    const jump = $('stepJump');
    if (jump) jump.addEventListener('change', e => A.goTo(Number(e.target.value)));
    document.querySelectorAll('#taskCard [data-part]').forEach(b => b.addEventListener('click', () => A.openPart(b.dataset.part)));
    const input = $('answer');
    if (input && !input.readOnly) {
      input.addEventListener('input', () => { A.ui.draft = input.value; if (A.quizDraft) A.quizDraft(); });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { const b = $('btnCheck') || $('btnQuizNext'); if (b && !b.disabled) b.click(); } });
      if (!input.disabled) input.focus({ preventScroll: true });
    }
  }
  A.bindCommon = bindTask;
})();

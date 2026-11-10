// Centripetal Force Lab — draws the page: the part strip, the picture, the controls under it, the student's own data table,
// and the task card. The data table is always on screen and is never filled in for the student.

(function () {
  const A = window.FLApp, { $, esc } = A, FL = window.FL, Lesson = window.Lesson, Scene = window.Scene;

  // ---------- Part strip + score ----------
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

  // ---------- The data table: one column per trial ----------
  const two = v => (typeof v === 'number' ? v.toFixed(2) : v);
  const ROWS = {
    conceptual: [['speed (m/s)', r => r.v], ['force (N)', r => r.F]],
    cp: [['speed, v (m/s)', r => r.v], ['force, F (N)', r => r.F], ['a_c (m/s²)', r => r.a]],
    honors: [['time for 10 laps (s)', r => two(r.t10)], ['speed, v (m/s)', r => r.v], ['force, F (N)', r => r.F],
      ['v² (m²/s²)', r => (A.state.graph.xKey === 'v2' && typeof r.v === 'number' ? FL.round(r.v * r.v, 1) : undefined)]]
  };
  A.tableHTML = () => {
    const n = FL.TRIALS[A.tier], table = A.state.table, pg = A.page();
    const now = pg && (pg.kind === 'trial' || pg.kind === 'plot') ? pg.n - 1 : -1;
    const cls = i => (i === now ? ' class="cell-now"' : '');
    const cols = Array.from({ length: n }, (_, i) => i);
    const head = `<tr><th>Trial</th>${cols.map(i => `<th${cls(i)}>${i + 1}</th>`).join('')}</tr>`;
    const body = ROWS[A.tier].map(([label, get]) => `<tr><th>${label}</th>${cols.map(i => {
      const v = table[i] ? get(table[i]) : undefined;
      return `<td${cls(i)}>${v === undefined || v === null ? '' : esc(typeof v === 'number' ? FL.fmt(v) : v)}</td>`;
    }).join('')}</tr>`).join('');
    return `<table class="data-table" aria-label="Your data table">${head}${body}</table>`;
  };
  A.renderTable = () => { $('dataTable').innerHTML = window.subHTML(A.tableHTML()); };

  // ---------- A finished part ----------
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
  const restScene = () => (A.state.current === 'graph' && A.graphScene ? A.graphScene({}) : A.labScene({ phi: 40, v: 4, showV: true, showF: true }));

  // ---------- Drawing ----------
  A.renderTask = () => {
    if (A.state.current === 'quiz') { A.quizTask(); A.syncCalc(); return; }
    const pg = A.page(), k = A.kind();
    $('taskCard').innerHTML = window.subHTML(pg ? A.header() + k.task(pg, A.d()) : doneHTML());
    bindTask();
    if (pg && k.bindTask) k.bindTask(pg, A.d());
    A.syncCalc();
  };
  // Draws only the picture and the controls under it
  A.renderStage = () => {
    if (A.stopAnim) A.stopAnim();
    const pg = A.page(), k = A.kind();
    if (A.state.current === 'quiz') { $('stage').innerHTML = A.quizScene(); $('stageCtl').innerHTML = ''; if (A.quizBindStage) A.quizBindStage(); return; }
    $('stage').innerHTML = pg ? k.scene(pg, A.d()) : restScene();
    $('stageCtl').innerHTML = pg && k.ctl ? k.ctl(pg, A.d()) : '';
    if (pg && k.bindStage) k.bindStage(pg, A.d());
    if (pg && k.live) k.live(pg, A.d());
  };
  A.render = () => {
    A.renderStrip();
    A.renderStage();
    A.renderTable();
    A.renderTask();
    A.updateScoreChip();
  };

  // A click on the picture, in the picture's own 760 × 520 coordinates
  A.scenePoint = e => {
    const svg = $('stage').querySelector('svg');
    if (!svg || !svg.createSVGPoint) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : null;
  };
  A.onStageClick = fn => { const svg = $('stage').querySelector('svg'); if (svg) svg.addEventListener('click', e => { const p = A.scenePoint(e); if (p) fn(p, e); }); };
  A.on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };

  function bindTask() {
    A.on('btnNext', () => A.advance());
    A.on('btnBack', () => A.goBack());
    A.on('btnHint', () => { A.ui.hints++; A.renderTask(); });
    A.on('btnRead', A.readAloud);
    A.on('btnReview', () => { A.part().i = 0; A.enter(); A.save(); A.render(); });
    document.querySelectorAll('#taskCard [data-part]').forEach(b => b.addEventListener('click', () => A.openPart(b.dataset.part)));
    const input = $('answer');
    if (input && !input.readOnly) {
      input.addEventListener('input', () => { A.ui.draft = input.value; if (A.quizDraft) A.quizDraft(); });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { const b = $('btnCheck') || $('btnQuizNext'); if (b && !b.disabled) b.click(); } });
      if (!input.disabled) input.focus({ preventScroll: true });
    }
  }
  A.bindCommon = bindTask;

  // Small inputs used to record a measurement. Their values survive a redraw of the task card.
  A.rec = {};
  A.recInput = (key, label, unit) => `<label>${label} <input type="text" inputmode="decimal" autocomplete="off" data-rec="${key}" value="${esc(A.rec[key] || '')}" aria-label="${esc(label)}"> ${unit}</label>`;
  A.bindRec = submit => document.querySelectorAll('#taskCard [data-rec]').forEach(el => {
    el.addEventListener('input', () => { A.rec[el.dataset.rec] = el.value; });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' && submit) submit(); });
  });
})();

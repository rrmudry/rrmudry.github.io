// Mechanical Work Studio — the Mastery Check (five new situations, no right or wrong until the end) and the certificate.

(function () {
  const A = window.FLApp, { $ } = A, FL = window.FL, Scene = window.Scene, Lesson = window.Lesson;
  const Q = () => A.state.quiz;
  const cur = () => Q().cur;
  const item = () => cur().items[cur().i];
  const ans = () => cur().answers[cur().i] || {};
  const isNum = it => it.type === 'calc' || it.type === 'graph';

  // ---------- Certificate ----------
  A.certStatus = () => {
    const missing = Lesson.PARTS.filter(p => p.weight > 0 && !A.state.parts[p.id].done);
    const best = Q().best || 0;
    return { ready: !missing.length && Q().attempts.length > 0 && best >= A.CERT_PERCENT, missing, best };
  };
  // Remembers the day it was first earned; the code follows the best score, which can still rise
  A.updateCert = () => {
    const p = A.profile;
    if ((p.guest && !p.preview) || !A.certStatus().ready) return;
    const id = p.preview ? 'SAMPLE' : (A.cloud && A.cloud.studentId) || 'TEACHER';
    const code = window.Certificate.code(id, Q().best);
    if (A.state.cert && A.state.cert.code === code) return;
    A.state.cert = { code, at: (A.state.cert && A.state.cert.at) || Date.now() };
  };
  const certHTML = () => {
    const c = A.certStatus();
    if (A.profile.guest && !A.profile.preview) return '<div class="cert-box cert-wait">🎓 <strong>Certificates are for signed-in students.</strong> Sign in with your school account to earn yours.</div>';
    if (c.ready) return '<div class="cert-box cert-ready"><strong>🎓 You earned your certificate!</strong><button type="button" class="btn-primary" data-cert>📄 Download certificate (PDF)</button></div>';
    const need = c.missing.length ? `finish ${c.missing.map(p => p.name).join(', ')} and ` : '';
    return `<div class="cert-box cert-wait">🎓 <strong>Earn your certificate:</strong> ${need}score ${A.CERT_PERCENT}% or higher on the Mastery Check. Your best so far is <span class="nowrap">${c.best}%</span>.</div>`;
  };
  A.downloadCertificate = async btn => {
    A.updateCert();
    if (!A.state.cert) return;
    const label = btn.textContent, p = A.profile;
    btn.disabled = true; btn.textContent = 'Making your certificate…';
    try {
      await window.Certificate.download({
        name: p.preview ? 'Sample Student' : p.name, sample: !!p.preview, best: Q().best, honors: A.tier === 'honors',
        period: p.teacher ? 'Teacher' : (p.period !== null && p.period !== undefined) ? `Period ${p.period}` : '',
        earned: A.state.cert.at, code: A.state.cert.code
      });
      btn.textContent = label;
    } catch (e) { console.error('Certificate failed:', e); btn.textContent = 'It did not download. Try again'; }
    btn.disabled = false;
    A.save(true);
  };

  // ---------- Pictures ----------
  A.quizScene = () => {
    if (!cur()) return A.labScene({ d: 0, F: 0, W: 0 });
    const it = item(), a = ans();
    if (it.type === 'dir') return Scene.dirScene({ id: it.scene, preds: [a.cat], waiting: !A.seenMove(it.scene) });
    if (it.type === 'calc') return Scene.problem(it.sc, {});
    const g = FL.quizGraph(it);
    return Scene.graph({ spec: FL.specFor(g.slope), points: g.points, line: { slope: g.slope }, note: it.kind === 'tension' ? `rope angle θ = ${it.th}°` : '' });
  };
  A.quizCtl = () => '';
  A.quizBindStage = () => {
    if (!cur() || item().type !== 'dir') return;
    if (A.sim.on) return;
    const id = item().scene;
    if (!A.seenMove(id)) { A.previewDir(id, () => { A.markSeen(id); A.renderStage(); A.renderTask(); }); return; }
    A.bindPicks((i, cat) => { cur().answers[cur().i] = { cat }; A.save(); A.renderStage(); A.renderTask(); });
  };

  // ---------- Moving through it ----------
  // Going back to a number question brings its answer back
  A.quizEnter = () => { if (A.state.current === 'quiz' && cur() && isNum(item())) { A.ui.draft = ans().value || ''; A.ui.work = ans().work || null; } };
  function load() { A.enter(); A.save(); A.render(); }
  function start() {
    if (A.left(Q().lockUntil)) return;
    const items = FL.buildQuiz(A.tier);
    Q().cur = { items, answers: items.map(() => null), i: 0, startedAt: Date.now() };
    load();
  }
  A.quizDraft = () => { if (cur() && isNum(item())) { cur().answers[cur().i] = { value: A.ui.draft, work: A.ui.work || null }; A.save(); } };
  A.quizCalc = () => (A.state.current === 'quiz' && cur() && isNum(item()) ? (q => (q.calc ? q : null))(FL.quizQuestion(item())) : null);
  A.quizBack = () => { if (cur() && cur().i > 0) { cur().i--; return load(); } A.openPart('much'); };
  function next() {
    const it = item(), a = ans();
    const empty = it.type === 'dir' ? !a.cat : FL.parseNum(a.value) === null;
    if (empty) { $('quizMsg').textContent = it.type === 'dir' ? 'Tap +W, 0 J or −W on the work meter first.' : 'Enter an answer first.'; return; }
    if (cur().i + 1 < cur().items.length) { cur().i++; return load(); }
    finish();
  }
  function finish() {
    const c = cur(), g = FL.gradeQuiz(c.items, c.answers);
    g.mistakes.forEach(A.recordMistake);
    g.results.forEach((r, i) => A.recordTry(`quiz${Q().attempts.length + 1}_${i + 1}`, r.ok));
    Q().attempts.push({ pct: g.percent, score: g.score, total: g.total, at: Date.now(), secs: c.startedAt ? Math.round((Date.now() - c.startedAt) / 1000) : null, skills: g.skills });
    Q().best = Math.max(Q().best || 0, g.percent);
    Q().last = { items: c.items, answers: c.answers };
    Q().cur = null;
    Q().lockUntil = g.score < g.total ? A.wait(10 * (g.total - g.score)) : 0;   // time to read what was missed
    A.updateCert();
    A.fresh(); A.save(true); A.render();
  }

  // ---------- The task card ----------
  function questionHTML() {
    const c = cur(), it = item(), a = ans(), last = c.i + 1 === c.items.length;
    const top = A.top(`Mastery Check · Question ${c.i + 1} of ${c.items.length}`);
    const actions = `<p id="quizMsg" class="quiz-msg" role="alert"></p>${A.actions(`<button type="button" class="btn-primary" id="btnQuizNext">${last ? 'Finish' : 'Next ▶'}</button>`)}`;
    if (it.type === 'dir') {
      const s0 = FL.SCENES[it.scene];
      const t = s0.track[0];
      const step = A.sim.on ? `Watch the ${s0.obj} and the arrow for ${t.label}.`
        : `What work does ${t.label} do on the ${s0.obj}? Tap <strong>+W</strong>, <strong>0 J</strong> or <strong>−W</strong> on the work meter. <button type="button" class="btn-ghost btn-inline" id="btnWatch">↻ Watch again</button>`;
      return top + A.title(s0.title) + `<p class="task-body">${step}</p>` + actions;
    }
    const q = FL.quizQuestion(it);
    return top + A.title(q.ask) + (q.formula ? `<p class="formula-box"><span class="formula">${q.formula}</span></p>` : '') + A.answerBox(q, false, A.ui.draft) + A.fbHTML() + actions;
  }
  function resultsHTML() {
    const q = Q(), last = q.attempts[q.attempts.length - 1], s = A.scoreState(A.state);
    const g = q.last ? FL.gradeQuiz(q.last.items, q.last.answers) : null;
    const right = g ? g.results.filter(r => r.ok).map(r => FL.QUIZ_SKILLS[r.skill]) : [];
    const misses = g ? g.results.filter(r => !r.ok).map(r => `<li><strong>${FL.QUIZ_SKILLS[r.skill]}.</strong> ${r.msg}</li>`).join('') : '';
    return `${A.top('Mastery Check · Results')}<h2 class="task-title">Mastery Check results</h2>
      <div class="score-big"><strong>${last.pct}%</strong><span>this try · best ${q.best}%</span></div>
      <p class="grade-line">Your grade so far: <strong class="nowrap">${s.points.toFixed(1)} / 10</strong></p>
      ${certHTML()}
      <div class="task-body" id="readable">${right.length ? `<p><strong>✓ You showed:</strong> ${right.join(' · ')}</p>` : ''}
      ${misses ? `<p><strong>Read these before you try again:</strong></p><ul class="misses">${misses}</ul>` : ''}</div>
      ${A.actions(A.btn('btnStartQuiz', 'Retake with new situations ▶', A.certStatus().ready ? 'btn-secondary' : 'btn-primary', q.lockUntil))}`;
  }
  const introHTML = () => `${A.top('Mastery Check')}<h2 class="task-title">Mastery Check</h2>
    <div class="task-body" id="readable">
      <p><strong>5 new situations.</strong> You will aim force and motion arrows, calculate work, and read a graph you did not make.</p>
      <p>You will not see right or wrong until the end. You can go back and change an answer before you finish.</p>
      <p>You can retake it with new situations. Your <strong>best score</strong> counts for 4 of your 10 points.</p>
    </div>${certHTML()}${A.actions('<button type="button" class="btn-primary" id="btnStartQuiz">Start ▶</button>')}`;

  A.quizTask = () => {
    $('taskCard').innerHTML = window.subHTML(cur() ? questionHTML() : Q().attempts.length ? resultsHTML() : introHTML());
    A.bindCommon();
    A.on('btnStartQuiz', start);
    A.on('btnQuizNext', next);
    A.on('btnWatch', () => { A.ui.seen = Object.assign({}, A.ui.seen, { [item().scene]: false }); A.renderStage(); A.renderTask(); });
    document.querySelectorAll('#taskCard [data-cert]').forEach(b => b.addEventListener('click', () => A.downloadCertificate(b)));
  };
})();

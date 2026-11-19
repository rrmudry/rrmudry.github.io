// Work & Simple Machines Practice — Mastery Check (5 new situations, including Day 2 0 J callback) and PDF Certificate.

(function () {
  const A = window.SMPApp, { $ } = A, SMP = window.SMP, Scene = window.Scene, Lesson = window.Lesson;
  const Q = () => A.state.quiz;
  const cur = () => Q().cur;
  const item = () => cur().items[cur().i];
  const ans = () => cur().answers[cur().i] || {};

  A.certStatus = () => {
    const missing = Lesson.PARTS.filter(p => p.weight > 0 && !A.state.parts[p.id].done);
    const best = Q().best || 0;
    return { ready: !missing.length && Q().attempts.length > 0 && best >= A.CERT_PERCENT, missing, best };
  };

  A.updateCert = () => {
    const p = A.profile;
    if (!p || (p.guest && !p.preview) || !A.certStatus().ready) return;
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

  A.quizScene = () => (!cur() ? Scene.tradeoffDemo(1, true) : Scene.forScenario(item(), {}, A.tier));
  A.quizGuessBoard = () => {
    if (!cur()) return '';
    const q = SMP.quizQuestion(item());
    return A.guessStripHTML([
      ['G', 'Givens', q.guessG || '', 'done'],
      ['U', 'Unknown', q.guessU || `${q.sym} = ?`, 'done'],
      ['E', 'Equation', '', ''],
      ['S', 'Substitute', A.ui.work || '', A.ui.work ? 'done' : 'now'],
      ['S', 'Solve', A.ui.draft ? `${q.sym} = ${A.ui.draft}` : '', A.ui.draft ? 'done' : 'now']
    ]);
  };

  A.quizEnter = () => {
    if (A.state.current === 'quiz' && cur()) {
      A.ui.draft = ans().value || '';
      A.ui.work = ans().work || null;
    }
  };

  function load() { A.enter(); A.save(); A.render(); }
  function start() {
    if (A.left(Q().lockUntil)) return;
    const items = SMP.buildQuiz(A.tier);
    Q().cur = { items, answers: items.map(() => null), i: 0, startedAt: Date.now() };
    load();
  }
  A.quizDraft = () => { if (cur()) { cur().answers[cur().i] = { value: A.ui.draft, work: A.ui.work || null }; A.save(); } };
  A.quizCalc = () => (A.state.current === 'quiz' && cur() ? (q => (q.calc ? q : null))(SMP.quizQuestion(item())) : null);
  A.quizBack = () => { if (cur() && cur().i > 0) { cur().i--; return load(); } A.openPart('machines'); };

  function next() {
    const a = ans();
    if (SMP.parseNum(a.value) === null) {
      $('quizMsg').textContent = SMP.quizQuestion(item()).calc ? 'Use the calculator, then press "Use calculator answer".' : 'Type your answer first.';
      return;
    }
    if (cur().i + 1 < cur().items.length) { cur().i++; return load(); }
    finish();
  }

  function finish() {
    const c = cur(), g = SMP.gradeQuiz(c.items, c.answers);
    g.mistakes.forEach(A.recordMistake);
    g.results.forEach((r, i) => A.recordTry(`quiz${Q().attempts.length + 1}_${i + 1}`, r.ok));
    Q().attempts.push({ pct: g.percent, score: g.score, total: g.total, at: Date.now(), secs: c.startedAt ? Math.round((Date.now() - c.startedAt) / 1000) : null, skills: g.skills });
    Q().best = Math.max(Q().best || 0, g.percent);
    Q().last = { items: c.items, answers: c.answers };
    Q().cur = null;
    Q().lockUntil = g.score < g.total ? A.wait(8 * (g.total - g.score)) : 0;
    A.updateCert();
    A.fresh(); A.save(true); A.render();
  }

  function questionHTML() {
    const c = cur(), last = c.i + 1 === c.items.length, q = SMP.quizQuestion(item());
    const top = A.top(`Mastery Check · Question ${c.i + 1} of ${c.items.length}`);
    const actions = `<p id="quizMsg" class="quiz-msg" role="alert"></p>${A.actions(`<button type="button" class="btn-primary" id="btnQuizNext">${last ? 'Finish' : 'Next ▶'}</button>`)}`;
    return top + A.title(q.ask) + A.answerBox(q, false, A.ui.draft) + actions;
  }

  function resultsHTML() {
    const q = Q(), last = q.attempts[q.attempts.length - 1], s = A.scoreState(A.state);
    const g = q.last ? SMP.gradeQuiz(q.last.items, q.last.answers) : null;
    const right = g ? g.results.filter(r => r.ok).map(r => SMP.QUIZ_SKILLS[r.skill]) : [];
    const misses = g ? g.results.filter(r => !r.ok).map(r => `<li><strong>${SMP.QUIZ_SKILLS[r.skill]}.</strong> ${r.msg}</li>`).join('') : '';
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
      <p><strong>5 new situations:</strong> tow truck winch, boat trailer ramp, theater fly rig, moving-van friction ramp, and a Day 2 work-direction callback.</p>
      <p>You will not see right or wrong until the end. You can go back and change an answer before finishing.</p>
      <p>Your <strong>best score</strong> counts for 4 of your 10 points.</p>
    </div>${certHTML()}${A.actions('<button type="button" class="btn-primary" id="btnStartQuiz">Start ▶</button>')}`;

  A.quizTask = () => {
    $('taskCard').innerHTML = window.subHTML(cur() ? questionHTML() : Q().attempts.length ? resultsHTML() : introHTML());
    A.bindCommon();
    A.on('btnStartQuiz', start);
    A.on('btnQuizNext', next);
    document.querySelectorAll('#taskCard [data-cert]').forEach(b => b.addEventListener('click', () => A.downloadCertificate(b)));
  };
})();

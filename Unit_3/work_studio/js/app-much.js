// Mechanical Work Studio — the "How Much?" problems: new numbers on a picture, worked on the calculator one step at a time.

(function () {
  const A = window.FLApp, FL = window.FL, Scene = window.Scene;

  // d = { sc (the dealt problem), steps: { questionId: record } }
  function dealProblem(pg, d) {
    const old = d.sc ? JSON.stringify(d.sc) : '';
    for (let i = 0; i < 20; i++) { d.sc = FL.GEN[pg.gen](); if (JSON.stringify(d.sc) !== old) break; }
    d.steps = {};
  }
  const rec = (d, q) => d.steps[q.id] || (d.steps[q.id] = {});
  function now(d) {
    const steps = FL.stepsOf(d.sc), i = steps.findIndex(q => !rec(d, q).ok);
    return { steps, i: i < 0 ? steps.length - 1 : i, done: i < 0 };
  }
  A.kinds.problem = {
    enter(pg, d) {
      if (!d.sc) dealProblem(pg, d);
      const { steps, i } = now(d), s = rec(d, steps[i]);
      if (s.bad && !s.ok) A.ui.fb = { bad: true, msg: s.bad };
    },
    scene(pg, d) {
      const solved = {};
      FL.stepsOf(d.sc).forEach(q => { if (rec(d, q).ok) solved[q.id] = true; });
      return Scene.problem(d.sc, solved);
    },
    task(pg, d) {
      const { steps, i } = now(d), q = steps[i];
      // Every finished box stays on screen as its answer, so a later box can use all of them
      const finalOf = q => { const parts = q.right.split(' = '); return `${parts[0]} = ${parts[parts.length - 1]}`; };
      const done = steps.slice(0, i).filter(q => rec(d, q).ok);
      const before = done.length ? `<div class="prev-steps">${done.map(q => `<span class="prev-chip">✓ <span class="formula">${finalOf(q)}</span></span>`).join('')}</div>` : '';
      return (steps.length > 1 ? `<p class="launch-tag">Box ${i + 1} of ${steps.length}</p>${before}` : '') + A.qHTML(q, rec(d, q));
    },
    bindTask(pg, d) {
      const { steps, i } = now(d), q = steps[i], s = rec(d, q);
      A.on('btnCheck', () => A.checkQ(q, s, `${pg.id}_${q.id}`));
      A.on('btnNew', () => {
        if (A.left(s.until)) return;
        dealProblem(pg, d);
        A.ui.fb = null; A.ui.draft = ''; A.ui.work = null;
        A.save(); A.render();
      });
    },
    calc(pg, d) {
      const { steps, i, done } = now(d), q = steps[i], s = rec(d, q);
      return !done && q.calc && !s.bad ? q : null;
    }
  };
})();

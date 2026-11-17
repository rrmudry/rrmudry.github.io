// Mechanical Work Studio — one trial of the investigation: set the distance, pull, read the three instruments, record the row.
// Nothing is filled in for the student. A wrong reading keeps the trial and waits a little longer each time.
// Also the page that tests a prediction at a distance nobody tried.

(function () {
  const A = window.FLApp, { $ } = A, FL = window.FL, S = A.sim;
  const rig = () => A.state.rig;
  // Each miss on the student's own measurement waits a little longer, so typing guesses is slower than looking.
  const missed = (d, id, msg) => { A.recordMistake(id); d.miss = (d.miss || 0) + 1; d.until = A.wait(Math.min(20, 4 + 4 * d.miss)); A.ui.fb = { retry: true, msg }; };
  const READ_HINTS = [
    'Distance: find the red pointer at the front of the crate. Read the tape close-up: big numbers are meters, each small mark is 0.1 m.',
    'Force: on the spring scale, find the last number the needle passed, then count small marks. Each small mark is 1 N.',
    'Work: copy the number on the work meter, in joules.'
  ];

  const finish = (d, step) => () => { if (!S.on && d.step === step) { d.step = 'read'; S.tick = null; A.save(); A.render(); } };

  A.kinds.trial = {
    enter(pg, d) {
      if (!d.step) d.step = 'set';
      if (d.step === 'run') d.step = 'read';   // a reload in the middle of a pull comes back ready to read
      if (d.step === 'read' || d.step === 'done') A.showPulled(d.set);
    },
    scene(pg, d) {
      const o = {};
      if (d.step === 'set') o.stop = S.set === null || S.set === undefined ? FL.D_RANGE[A.tier].min : S.set;
      if (d.step === 'read' && pg.n === 1) o.coach = true;
      return A.labScene(o);
    },
    ctl(pg, d) {
      if (d.step === 'set') return A.distCtl();
      return `<span class="ctl-note">${d.step === 'run' ? 'Pulling… watch the crate, the dial and the meter.' : d.step === 'done' ? 'Recorded in your table' : 'Pulled. Read the three instruments.'}</span>`;
    },
    bindStage(pg, d) {
      if (d.step !== 'set') return;
      const rule = FL.distRule(A.tier, pg.n, A.state.table);
      A.bindDistCtl(set => {
        if (!rule.ok(set)) { A.ui.fb = { retry: true, msg: rule.why }; return A.renderTask(); }
        d.set = set; d.step = 'run'; A.ui.fb = null;
        A.save(); A.render();
        A.pull(set, { tick: finish(d, 'run') });
      });
    },
    task(pg, d) {
      const tag = `<p class="launch-tag">Trial ${pg.n} of ${FL.TRIALS[A.tier]}</p>`;
      if (d.step === 'set') {
        const rule = FL.distRule(A.tier, pg.n, A.state.table);
        const how = A.tier === 'conceptual' ? 'Use the slider under the picture. Then press <strong>▶ Pull</strong>.' : 'Slide the orange stop cone with the slider under the picture. Then press <strong>▶ Pull</strong>.';
        return tag + A.title(rule.text) + `<p class="task-body">${how}</p>` + A.fbHTML() + A.actions();
      }
      if (d.step === 'run') return tag + A.title('Watch the instruments.') + A.note('fb-retry', 'The rope pulls the crate. Watch the work meter climb.') + A.actions();
      if (d.step === 'read') {
        return tag + A.title('Read the three instruments. Record this trial.')
          + '<p class="task-body">The tape, the spring scale and the work meter are on the picture. Type what they show.</p>'
          + `<div class="rec-row">${A.recInput('d', '<span class="wk-d-text">distance</span>', 'm')}${A.recInput('F', '<span class="wk-F-text">force</span>', 'N')}${A.recInput('W', '<span class="wk-W-text">work</span>', 'J')}</div>`
          + A.fbHTML() + A.actions(A.btn('btnRecord', 'Record in my table', 'btn-primary', d.until)) + A.hintsHTML(READ_HINTS);
      }
      return tag + A.title(`Trial ${pg.n} is in your table.`) + A.okNote('Look at your table under the picture.') + A.actions(A.nextBtn());
    },
    bindTask(pg, d) {
      const record = () => {
        if (d.step !== 'read' || A.left(d.until)) return;
        const dist = d.set, F = rig().F, Wm = FL.meter(rig(), dist);
        const checks = [['d', FL.checkDist(A.rec.d || '', dist, F, Wm)], ['F', FL.checkForce(A.rec.F || '', F, dist, Wm)], ['W', FL.checkWork(A.rec.W || '', Wm, F, dist)]];
        const blank = checks.find(([, r]) => r.mistake === 'blank');
        if (blank) { A.ui.fb = { retry: true, msg: blank[1].msg }; return A.renderTask(); }
        const bad = checks.find(([, r]) => !r.ok);
        A.recordTry(`${pg.id}_read`, !bad);
        if (bad) { missed(d, bad[1].mistake, bad[1].msg); A.save(); return A.render(); }
        A.state.table[pg.n - 1] = { set: d.set, d: FL.round(FL.parseNum(A.rec.d), 2), F: FL.parseNum(A.rec.F), W: FL.round(FL.parseNum(A.rec.W), 1) };
        d.step = 'done'; d.until = 0; A.rec = {}; A.ui.fb = null;
        A.save(); A.render();
      };
      A.on('btnRecord', record);
      A.bindRec(record);
    }
  };

  // ---------- Test the prediction at a distance nobody tried ----------
  const D = () => FL.TEST_D[A.tier];
  // Close enough to count: a small slope error grows a little over a longer pull
  const predictionHeld = () => Math.abs(A.state.testW - A.state.predW) <= Math.max(2, 0.04 * A.state.testW);
  A.kinds.test = {
    enter(pg, d) { if (!d.step || d.step === 'run') d.step = d.step === 'run' ? 'read' : 'go'; if (d.step === 'read' || d.step === 'done') A.showPulled(D()); },
    scene(pg, d) {
      return A.labScene({ boxes: [{ label: 'Distance to test', value: `${FL.fmt(D())} m` }, { label: 'Your prediction', value: `${FL.fmt(A.state.predW)} J` }] });
    },
    ctl: (pg, d) => `<span class="ctl-label">Pull ${FL.fmt(D())} m</span>${d.step === 'go' ? '<button type="button" class="btn-step" id="btnRun">▶ Pull</button>' : ''}<span class="ctl-note">${d.step === 'go' ? 'A distance you never tested' : d.step === 'run' ? 'Pulling…' : d.step === 'read' ? 'Read the work meter.' : 'Tested'}</span>`,
    bindStage(pg, d) { A.on('btnRun', () => { d.step = 'run'; A.save(); A.render(); A.pull(D(), { tick: finish(d, 'run') }); }); },
    task(pg, d) {
      if (d.step === 'go') return A.title('Now test your prediction.') + `<p class="task-body">The stop cone is set to ${FL.fmt(D())} m. Press <strong>▶ Pull</strong> under the picture and watch the work meter.</p>` + A.actions();
      if (d.step === 'run') return A.title('Watch the work meter.') + A.actions();
      if (d.step === 'read') {
        return A.title('Read the work meter.') + `<div class="rec-row">${A.recInput('W', '<span class="wk-W-text">work</span>', 'J')}</div>` + A.fbHTML()
          + A.actions(A.btn('btnRecord', 'Check my reading', 'btn-primary', d.until));
      }
      const why = A.tier === 'conceptual' ? 'Twice the distance takes twice the work.' : A.tier === 'cp' ? 'W = F × d works for any distance.' : 'W = F × d × cos θ works for any distance.';
      const head = A.title(`You predicted ${FL.fmt(A.state.predW)} J. The meter reads ${FL.fmt(A.state.testW)} J.`);
      if (predictionHeld()) return head + A.note('fb-ok', `<strong>Your prediction held up</strong> at a distance you never tested. ${why}`) + A.actions(A.nextBtn());
      // A miss: say what went wrong, then go back and fix the prediction
      const hit = A.predictionQ().mistake(A.state.predW);
      return head + A.note('fb-bad', `<strong>Your prediction missed.</strong> ${hit ? hit[1] : 'Check how you used your graph.'}`) + A.actions('<button type="button" class="btn-primary" id="btnFix">◀ Fix my prediction</button>');
    },
    bindTask(pg, d) {
      const record = () => {
        if (d.step !== 'read' || A.left(d.until)) return;
        const Wm = FL.meter(rig(), D()), res = FL.checkWork(A.rec.W || '', Wm, rig().F, D());
        if (res.mistake === 'blank') { A.ui.fb = { retry: true, msg: res.msg }; return A.renderTask(); }
        A.recordTry(pg.id, res.ok);
        if (!res.ok) { missed(d, res.mistake, res.msg); A.save(); return A.render(); }
        A.state.testW = FL.round(FL.parseNum(A.rec.W), 1); d.step = 'done'; A.rec = {}; A.ui.fb = null;
        A.recordTry('g_predict', predictionHeld());
        if (!predictionHeld()) A.recordMistake('prediction_missed');
        A.save(); A.render();
      };
      A.on('btnRecord', record);
      A.bindRec(record);
      A.on('btnFix', () => {
        const pred = A.d('g_predict');
        delete pred.ok; delete pred.val;
        d.step = 'go';
        A.goTo(A.pages().findIndex(p => p.id === 'g_predict'));
      });
    }
  };
})();

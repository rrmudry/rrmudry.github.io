// Centripetal Force Lab — one trial of the investigation: set the speed, read the instruments, record the row.
// Nothing is filled in for the student. A wrong reading keeps the trial running and waits a little longer each time.
// Also the two pages that test a prediction on a speed nobody tried.

(function () {
  const A = window.FLApp, { $ } = A, FL = window.FL, S = A.sim;
  const honors = () => A.tier === 'honors';
  const rig = () => A.state.rig;
  const trueV = set => FL.speedOf(A.tier, rig(), set);
  const trueF = set => FL.force(rig().m, trueV(set), rig().r);
  const t10 = set => FL.tenLaps(rig(), trueV(set));
  const TIMER = 2.5;   // seconds before the lap timer shows its reading

  const boxes = d => {
    const set = d.step === 'set' ? null : d.set;
    if (!honors()) return [A.speedBox(set === null ? 0 : set)];
    return [{ label: 'Motor level', value: set === null ? '–' : String(set) },
      { label: 'Time for 10 laps', value: set === null ? '–' : (!S.on || S.t >= TIMER ? `${t10(set).toFixed(2)} s` : 'timing…'), id: 'boxTimer' }];
  };
  const timerTick = set => () => { const el = $('boxTimer'); if (el && S.t >= TIMER && el.textContent === 'timing…') el.textContent = `${t10(set).toFixed(2)} s`; };
  const start = (set, shown) => { A.spin(trueV(set), { tick: honors() ? timerTick(set) : null }); if (shown) S.t = TIMER + 1; };
  const question = (pg, d) => { const row = A.state.table[pg.n - 1]; return honors() ? FL.Q.lapSpeed(row, rig()) : FL.Q.ac(row, rig()); };
  // Each miss on the student's own measurement waits a little longer, so typing guesses is slower than looking.
  const missed = (d, id, msg) => { A.recordMistake(id); d.miss = (d.miss || 0) + 1; d.until = A.wait(Math.min(20, 4 + 4 * d.miss)); A.ui.fb = { retry: true, msg }; };
  const READ_HINTS = ['Find the last numbered mark the needle has passed. Each small mark after it is 1 N.', 'The magnifier under the dial shows the needle close up. Between two marks, use the half.'];

  A.kinds.trial = {
    enter(pg, d) {
      if (!d.step) d.step = 'set';
      if (d.step === 'read' || d.step === 'calc') { S.set = d.set; start(d.set, true); }
    },
    scene(pg, d) {
      const o = { boxes: boxes(d) };
      if (d.step === 'done') { S.Fshow = trueF(d.set); o.F = S.Fshow; }
      if (d.step === 'read' && pg.n === 1) { o.coach = true; o.hint = 'Each small mark on the dial is 1 N'; }
      return A.labScene(o);
    },
    ctl: (pg, d) => (d.step === 'set' ? A.speedCtl(honors() ? { list: FL.LEVELS, level: true } : {}) : `<span class="ctl-label">${honors() ? `Motor level ${d.set}` : `Speed ${d.set} m/s`}</span><span class="ctl-note">${d.step === 'done' ? 'Recorded in your table' : 'Running. Read the instruments.'}</span>`),
    bindStage(pg, d) {
      if (d.step !== 'set') return;
      const rule = FL.speedRule(A.tier, pg.n, A.state.table);
      A.bindSpeedCtl(set => {
        if (!rule.ok(set)) { A.ui.fb = { retry: true, msg: rule.why }; return A.renderTask(); }
        d.set = set; d.step = 'read'; A.ui.fb = null;
        start(set);
        A.save(); A.render();
      }, { level: honors() });
    },
    live() { if (S.on) A.startAnim(); },
    task(pg, d) {
      const tag = `<p class="launch-tag">Trial ${pg.n} of ${FL.TRIALS[A.tier]}</p>`;
      if (d.step === 'set') {
        const rule = FL.speedRule(A.tier, pg.n, A.state.table);
        return tag + A.title(rule.text) + '<p class="task-body">Use the slider under the picture. Then press <strong>▶ Run</strong>.</p>' + A.fbHTML() + A.actions();
      }
      if (d.step === 'read') {
        const first = honors() ? A.recInput('t', 'time for 10 laps', 's') : A.recInput('v', 'speed', 'm/s');
        return tag + A.title('Read the instruments. Record this trial.')
          + `<p class="task-body">${honors() ? 'The timer and the dial are on the picture.' : 'The speed and the dial are on the picture.'} Type what they show.</p>`
          + `<div class="rec-row">${first}${A.recInput('F', 'force', 'N')}</div>` + A.fbHTML()
          + A.actions(A.btn('btnRecord', 'Record in my table', 'btn-primary', d.until)) + A.hintsHTML(READ_HINTS);
      }
      const q = A.tier === 'conceptual' ? null : question(pg, d);
      if (!q) return tag + A.title(`Trial ${pg.n} is in your table.`) + A.okNote('Look at your table under the picture.') + A.actions(A.nextBtn());
      return A.qHTML(q, d.q || (d.q = {}), { tag: `Trial ${pg.n} of ${FL.TRIALS[A.tier]}` });
    },
    bindTask(pg, d) {
      const record = () => {
        if (d.step !== 'read' || A.left(d.until)) return;
        const row = { set: d.set }, F = trueF(d.set), v = trueV(d.set);
        if (honors()) {
          const t = FL.parseNum(A.rec.t || '');
          if (t === null) { A.ui.fb = { retry: true, msg: 'Type the time for 10 laps from the timer.' }; return A.renderTask(); }
          if (S.t < TIMER) { A.ui.fb = { retry: true, msg: 'Wait for the timer to finish its 10 laps.' }; return A.renderTask(); }
          if (Math.abs(t - t10(d.set)) > 0.011) { A.recordTry(`${pg.id}_read`, false); missed(d, 'read_timer', FL.near(t, t10(d.set) / 10, 0.01, 0.011) ? 'The timer shows the time for all 10 laps. Record that number: you will divide by 10 later.' : 'That does not match the timer. Copy the time for 10 laps exactly.'); A.save(); return A.render(); }
          row.t10 = t10(d.set);
        } else {
          const sp = FL.parseNum(A.rec.v || '');
          if (sp === null) { A.ui.fb = { retry: true, msg: 'Type the speed from the Speed box on the picture.' }; return A.renderTask(); }
          if (Math.abs(sp - v) > 0.051) { A.recordTry(`${pg.id}_read`, false); missed(d, 'read_speed_box', 'That is not the speed this trial is running at. Look at the Speed box under the dial.'); A.save(); return A.render(); }
          row.v = v;
        }
        const res = FL.checkReading(A.rec.F || '', F, v);
        if (res.mistake === 'blank') { A.ui.fb = { retry: true, msg: res.msg }; return A.renderTask(); }
        A.recordTry(`${pg.id}_read`, res.ok);
        if (!res.ok) { missed(d, res.mistake, res.msg); A.save(); return A.render(); }
        row.F = FL.parseNum(A.rec.F);
        A.state.table[pg.n - 1] = row;
        d.step = A.tier === 'conceptual' ? 'done' : 'calc';
        d.until = 0; A.rec = {}; A.ui.fb = null; A.ui.hints = A.tier === 'conceptual' ? 1 : 0;
        if (d.step === 'done') A.stopSpin(true);
        A.save(); A.render();
      };
      A.on('btnRecord', record);
      A.bindRec(record);
      A.on('btnCheck', () => {
        const row = A.state.table[pg.n - 1];
        A.checkQ(question(pg, d), d.q, `${pg.id}_calc`, {
          okMsg: val => (honors() ? `v = ${FL.fmt(FL.round(val, 2))} m/s is in your table.` : `a_c = ${FL.fmt(FL.round(val, 1))} m/s² is in your table.`),
          onOk: val => { if (honors()) row.v = FL.round(val, 2); else row.a = FL.round(val, 1); d.step = 'done'; A.stopSpin(true); }
        });
      });
    },
    calc: (pg, d) => (d.step === 'calc' && !(d.q && d.q.ok) ? question(pg, d) : null)
  };

  // ---------- Test the prediction at 8 m/s (Periods 1–6) ----------
  const F8 = () => FL.force(rig().m, FL.TEST_SPEED, rig().r);
  A.kinds.test = {
    enter(pg, d) { if (!d.step) d.step = 'run'; if (d.step === 'read') A.spin(FL.TEST_SPEED); },
    scene(pg, d) {
      const o = { boxes: [A.speedBox(d.step === 'run' ? 0 : FL.TEST_SPEED), { label: 'Your prediction', value: `${FL.fmt(A.state.predF)} N` }] };
      if (d.step === 'done') { S.Fshow = F8(); o.F = S.Fshow; }
      return A.labScene(o);
    },
    ctl: (pg, d) => `<span class="ctl-label">Speed ${FL.TEST_SPEED} m/s</span>${d.step === 'run' ? '<button type="button" class="btn-step" id="btnRun">▶ Run</button>' : ''}<span class="ctl-note">${d.step === 'run' ? 'A speed you never tested' : d.step === 'read' ? 'Running. Read the dial.' : 'Tested'}</span>`,
    bindStage(pg, d) { A.on('btnRun', () => { d.step = 'read'; A.spin(FL.TEST_SPEED); A.save(); A.render(); }); },
    live() { if (S.on) A.startAnim(); },
    task(pg, d) {
      if (d.step === 'run') return A.title('Now test your prediction.') + `<p class="task-body">The speed is set to ${FL.TEST_SPEED} m/s. Press <strong>▶ Run</strong> under the picture.</p>` + A.actions();
      if (d.step === 'read') {
        return A.title('Read the force dial.') + `<div class="rec-row">${A.recInput('F', 'force', 'N')}</div>` + A.fbHTML()
          + A.actions(A.btn('btnRecord', 'Check my reading', 'btn-primary', d.until)) + A.hintsHTML(READ_HINTS);
      }
      const diff = Math.abs(A.state.testF - A.state.predF), close = diff <= Math.max(1.5, 0.05 * F8());
      return A.title(`You predicted ${FL.fmt(A.state.predF)} N. The dial reads ${FL.fmt(A.state.testF)} N.`)
        + A.note('fb-ok', close ? `<strong>Your prediction held up</strong> at a speed you never tested. ${A.tier === 'conceptual' ? 'Twice the speed needs 4 times the force.' : 'F_net = m × v² ÷ r works for any speed.'}`
          : 'Those are close. A small reading error in a trial gets bigger when you multiply it. The pattern still holds.') + A.actions(A.nextBtn());
    },
    bindTask(pg, d) {
      const record = () => {
        if (d.step !== 'read' || A.left(d.until)) return;
        const res = FL.checkReading(A.rec.F || '', F8(), FL.TEST_SPEED);
        if (res.mistake === 'blank') { A.ui.fb = { retry: true, msg: res.msg }; return A.renderTask(); }
        A.recordTry(pg.id, res.ok);
        if (!res.ok) { missed(d, res.mistake, res.msg); A.save(); return A.render(); }
        A.state.testF = FL.parseNum(A.rec.F); d.step = 'done'; A.rec = {}; A.ui.fb = null; A.stopSpin(true);
        A.save(); A.render();
      };
      A.on('btnRecord', record);
      A.bindRec(record);
    }
  };

  // ---------- Period 0: run at the predicted top speed, then a little faster ----------
  A.kinds.snap = {
    enter(pg, d) { if (!d.step) d.step = 'run'; if (d.step === 'hold') d.step = 'run'; },
    scene(pg, d) {
      const v = A.state.predV, limit = { label: 'String limit', value: `${FL.DIAL.limit} N` };
      if (d.step === 'done') return A.cutScene(d.phi, { limit: FL.DIAL.limit, boxes: [A.speedBox(v + 0.5), limit] });
      return A.labScene({ limit: FL.DIAL.limit, boxes: [A.speedBox(S.on ? S.v : 0), limit] });
    },
    ctl(pg, d) {
      if (d.step === 'done') return '<span class="ctl-note">The string snapped</span>';
      return `<span class="ctl-label">Speed ${FL.fmt(d.step === 'hold' ? S.v : A.state.predV)} m/s</span>
        <button type="button" class="btn-step" id="btnRun" ${S.on ? 'disabled' : ''}>▶ Run</button>
        <button type="button" class="btn-step" id="btnFaster" ${d.step === 'hold' && d.ready ? '' : 'disabled'}>Go 0.5 m/s faster</button>`;
    },
    bindStage(pg, d) {
      A.on('btnRun', () => {
        d.step = 'hold'; d.ready = false;
        A.spin(A.state.predV, { tick: () => { if (S.t > 3 && !d.ready) { d.ready = true; A.renderStage(); A.renderTask(); } } });
        A.renderStage(); A.renderTask();
      });
      A.on('btnFaster', () => {
        A.spin(A.state.predV + 0.5, { tick: () => {
          if (!S.free && S.t > 1.2) { d.phi = Math.round(S.phi); A.release(); }
          if (S.landed) { S.tick = null; S.free = null; d.step = 'done'; A.save(); A.render(); }
        } });
        $('btnFaster').disabled = true; $('boxSpeed').textContent = `${FL.fmt(A.state.predV + 0.5)} m/s`;
      });
    },
    live() { if (S.on) A.startAnim(); },
    task(pg, d) {
      const v = A.state.predV;
      if (d.step === 'done') return A.title('It snapped.') + A.note('fb-ok', `At ${FL.fmt(v)} m/s the string held, right at its limit. At ${FL.fmt(v + 0.5)} m/s it needed more than ${FL.DIAL.limit} N. With no pull, the puck left in a straight line.`) + A.actions(A.nextBtn());
      if (d.step === 'hold' && d.ready) return A.title('The needle is on the red line, and the string holds.') + '<p class="task-body">Now press <strong>Go 0.5 m/s faster</strong> under the picture.</p>' + A.actions();
      return A.title(`Test your prediction: ${FL.fmt(v)} m/s.`) + '<p class="task-body">Press <strong>▶ Run</strong> under the picture. Watch the needle and the red line.</p>' + A.actions();
    }
  };
})();

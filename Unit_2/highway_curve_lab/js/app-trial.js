// Highway Curve Lab — one trial of the investigation, the grip limits (CP), and testing a prediction on a road or
// vehicle nobody tried. Nothing is filled in for the student. A wrong reading keeps the trial and waits a little longer.
//   conceptual / honors: drive faster and faster on one road until the car slides; the fastest speed that held is the data.
//   cp: drive one speed on dry road, then read the tire grip gauge.

(function () {
  const A = window.FLApp, FL = window.FL, World = () => window.World;
  const rig = () => A.state.rig;
  const honors = () => A.tier === 'honors';
  const missed = (d, id, msg) => { A.recordMistake(id); d.miss = (d.miss || 0) + 1; d.until = A.wait(Math.min(20, 4 + 4 * d.miss)); A.ui.fb = { retry: true, msg }; };
  const READ_HINTS = veh => [`Find the last numbered mark the needle has passed. Each small mark after it is ${FL.fmt(FL.GAUGE[veh].minor)} kN.`, 'The magnifier under the gauge shows the needle close up.'];
  // The runs made on this page, shown as a short log so the student can see the edge
  const runLog = runs => {
    if (!runs || !runs.length) return '';
    const sorted = runs.slice().sort((a, b) => a.v - b.v), seen = new Set();
    const items = sorted.filter(r => { const k = `${r.v}${r.grip}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .map(r => `<span class="run-chip ${r.grip ? 'run-ok' : 'run-bad'}">${r.grip ? '✅' : '💥'} ${FL.fmt(r.v)}</span>`).join('');
    return `<div class="run-log"><span>Your runs (m/s):</span>${items}</div>`;
  };
  A.runLog = runLog;
  // A drive that adds itself to the page's run log
  const testDrive = (d, surf, veh, v, after) => {
    A.lockCtl(true);
    A.drive({ surf, veh, v, onDone: grip => { (d.runs || (d.runs = [])).push({ v, grip }); A.save(); A.renderTask(); A.lockCtl(false); if (after) after(grip); } });
  };

  // ---------- A trial ----------
  A.kinds.trial = {
    enter(pg, d) {
      if (!d.step) d.step = A.tier === 'cp' ? 'set' : 'find';
      World().park({ s: 0 });
      if (A.tier === 'cp' && (d.step === 'read' || d.step === 'done')) {
        const v = d.v, F = FL.fNeed(1000, v, rig().r) / 1000;
        World().park({ s: 0 });
        A.setGauge({ v, F, snap: true });
        A.ui.speed = v;
      }
    },
    world: (pg) => { const p = FL.trialPlan(A.tier, pg.n); return { surf: p.surf, veh: p.veh }; },
    scene(pg, d) {
      const p = FL.trialPlan(A.tier, pg.n);
      return A.panelScene({ surf: p.surf, veh: p.veh, coach: A.tier === 'cp' && d.step === 'read' && pg.n === 1 });
    },
    ctl(pg, d) {
      if (A.tier === 'cp' && d.step === 'read') return `<span class="ctl-label">Speed ${FL.fmt(d.v)} m/s</span>` + A.replayCtl([{ label: 'Watch again' }], 'The gauge holds its reading from the turn.');
      if (d.step === 'done' || d.step === 'calc') return A.freeCtl(A.tier === 'cp' ? d.v : (A.state.table[pg.n - 1] || {}).v || 8);
      return A.speedCtl({ start: A.tier === 'cp' ? 4 : 8 });
    },
    bindStage(pg, d) {
      const p = FL.trialPlan(A.tier, pg.n);
      if (A.tier === 'cp' && d.step === 'read') return A.bindReplay([{ surf: 'dry', veh: 'car', v: d.v }]);
      if (d.step === 'done' || d.step === 'calc') return A.bindFree(p.surf, p.veh);
      if (d.step !== 'set' && d.step !== 'find') return;
      A.bindSpeedCtl(v => {
        A.ui.fb = null;
        if (A.tier !== 'cp') return testDrive(d, p.surf, p.veh, v);
        const rule = FL.speedRule(rig(), pg.n, A.state.table);
        if (!rule.ok(v)) { A.ui.fb = { retry: true, msg: rule.why }; return A.renderTask(); }
        A.lockCtl(true);
        A.drive({ surf: 'dry', veh: 'car', v, onDone: grip => {
          if (!grip) { A.ui.fb = { retry: true, msg: 'It slid off! The gauge can only measure a turn that holds. Pick a slower speed.' }; A.lockCtl(false); return A.renderTask(); }
          d.v = v; d.step = 'read'; A.save(); A.renderTask(); A.renderTable(); A.renderStage();
        } });
      });
    },
    task(pg, d) {
      const tag = `<p class="launch-tag">Trial ${pg.n} of ${FL.TRIALS[A.tier]}</p>`, p = FL.trialPlan(A.tier, pg.n);
      const road = `${FL.SURF[p.surf].icon} ${FL.SURF[p.surf].name} road, ${FL.VEH[p.veh].icon} ${FL.VEH[p.veh].name.toLowerCase()}`;
      if (d.step === 'find') {
        const muBox = honors() ? A.recInput('mu', 'μ', '') : '';
        return tag + A.title(`${road}: find the fastest speed that holds.`)
          + `<p class="task-body">Drive faster each time until it slides. Record the last speed that held.</p>`
          + runLog(d.runs) + `<div class="rec-row">${muBox}${A.recInput('v', 'fastest safe speed', 'm/s')}</div>` + A.fbHTML()
          + A.actions(A.btn('btnRecord', 'Record in my table', 'btn-primary', d.until)) + A.hintsHTML(FIND_HINTS());
      }
      if (d.step === 'set') {
        const rule = FL.speedRule(rig(), pg.n, A.state.table);
        return tag + A.title(rule.text) + '<p class="task-body">Set the speed under the picture. Then press <strong>▶ Drive</strong>.</p>' + A.fbHTML() + A.actions();
      }
      if (d.step === 'read') {
        return tag + A.title('Read the tire grip gauge. Record this trial.')
          + `<div class="rec-row">${A.recInput('v', 'speed', 'm/s')}${A.recInput('F', 'friction', 'kN')}</div>` + A.fbHTML()
          + A.actions(A.btn('btnRecord', 'Record in my table', 'btn-primary', d.until)) + A.hintsHTML(READ_HINTS('car'));
      }
      if (d.step === 'calc') {
        const row = A.state.table[pg.n - 1];
        return A.qHTML(FL.Q.vsq(row), d.q || (d.q = {}), { tag: `Trial ${pg.n} of ${FL.TRIALS[A.tier]}` });
      }
      return tag + A.title(`Trial ${pg.n} is in your table.`) + A.okNote('Look at your table under the picture.') + A.actions(A.nextBtn());
    },
    bindTask(pg, d) {
      const p = FL.trialPlan(A.tier, pg.n);
      const record = () => {
        if (A.left(d.until)) return;
        if (d.step === 'find') {
          if (honors()) {
            const mu = FL.parseNum(A.rec.mu || '');
            if (mu === null) { A.ui.fb = { retry: true, msg: 'Type μ for this road. It is on the picture, next to the road name.' }; return A.renderTask(); }
            if (Math.abs(mu - FL.SURF[p.surf].mu) > 0.001) { A.recordTry(`${pg.id}_mu`, false); missed(d, 'read_mu', 'That is not μ for this road. Look at the road label on the picture.'); A.save(); return A.render(); }
          }
          const res = FL.checkFastest(A.rec.v || '', d.runs || [], A.slider().step);
          if (res.mistake === 'blank') { A.ui.fb = { retry: true, msg: res.msg }; return A.renderTask(); }
          if (res.retry) { A.ui.fb = { retry: true, msg: res.msg }; return A.renderTask(); }
          A.recordTry(`${pg.id}_read`, res.ok);
          if (!res.ok) { missed(d, res.mistake, res.msg); A.save(); return A.render(); }
          const v = FL.parseNum(A.rec.v);
          A.state.table[pg.n - 1] = honors() ? { surf: p.surf, mu: FL.SURF[p.surf].mu, v } : { surf: p.surf, veh: p.veh, v };
          d.step = honors() ? 'calc' : 'done';
        } else if (d.step === 'read') {
          const sp = FL.parseNum(A.rec.v || '');
          if (sp === null) { A.ui.fb = { retry: true, msg: 'Type the speed from the speedometer.' }; return A.renderTask(); }
          if (Math.abs(sp - d.v) > 0.051) { A.recordTry(`${pg.id}_read`, false); missed(d, 'read_speedo', 'That is not the speed of this trial. Read the outer scale of the speedometer.'); A.save(); return A.render(); }
          const F = FL.fNeed(1000, d.v, rig().r) / 1000;
          const res = FL.checkGauge(A.rec.F || '', F, 'car', { v: d.v, limit: FL.fMax(0.8, 1000) / 1000 });
          if (res.mistake === 'blank') { A.ui.fb = { retry: true, msg: res.msg }; return A.renderTask(); }
          A.recordTry(`${pg.id}_read`, res.ok);
          if (!res.ok) { missed(d, res.mistake, res.msg); A.save(); return A.render(); }
          A.state.table[pg.n - 1] = { v: d.v, F: FL.parseNum(A.rec.F) };
          d.step = 'done';
        } else return;
        d.until = 0; A.rec = {}; A.ui.fb = null; A.ui.hints = A.tier === 'conceptual' ? 1 : 0;
        A.save(); A.render();
      };
      A.on('btnRecord', record);
      A.bindRec(record);
      A.on('btnCheck', () => {
        const row = A.state.table[pg.n - 1];
        A.checkQ(FL.Q.vsq(row), d.q, `${pg.id}_calc`, { okMsg: v => `v_max² = ${FL.fmt(FL.round(v, 1))} m²/s² is in your table.`, onOk: v => { row.v2 = FL.round(v, 2); d.step = 'done'; } });
      });
    },
    calc: (pg, d) => (d.step === 'calc' && !(d.q && d.q.ok) ? FL.Q.vsq(A.state.table[pg.n - 1]) : null)
  };
  const FIND_HINTS = () => (A.tier === 'conceptual'
    ? ['Start slow. Go up 2 m/s at a time. When it slides, go back down 1.', 'You need two runs: one that holds, and one that slides 1 m/s faster.']
    : [`Go up in big steps, then close in. The slider moves ${FL.fmt(A.slider().step)} m/s at a time.`, `You need a run that holds and a run that slides ${FL.fmt(A.slider().step)} m/s faster.`]);

  // ---------- CP: read the red grip-limit mark on each road ----------
  const LIM_ROADS = ['dry', 'wet', 'icy'];
  A.kinds.limits = {
    enter(pg, d) { if (!d.surf) d.surf = 'dry'; World().park({ s: 0 }); },
    world: (pg, d) => ({ surf: d.surf, veh: 'car' }),
    scene: (pg, d) => A.panelScene({ surf: d.surf, veh: 'car' }),
    ctl: (pg, d) => '<span class="ctl-note">Road:</span>' + LIM_ROADS.map(s => `<button type="button" class="btn-test ${d.surf === s ? 'on' : ''}" data-road="${s}">${FL.SURF[s].icon} ${FL.SURF[s].name}</button>`).join(''),
    bindStage(pg, d) {
      document.querySelectorAll('#stageCtl [data-road]').forEach(b => b.addEventListener('click', () => { d.surf = b.dataset.road; A.save(); A.renderStage(); }));
    },
    task(pg, d) {
      const L = A.state.limits || {}, done = LIM_ROADS.every(s => L[s] !== undefined);
      if (done) return A.title('All three grip limits are in your table.') + A.okNote('Rain and ice lower the most friction the road can give.') + A.actions(A.nextBtn());
      const next = LIM_ROADS.find(s => L[s] === undefined);
      return A.title(`Switch to the ${FL.SURF[next].name.toLowerCase()} road. Read the red grip-limit mark.`)
        + `<div class="rec-row">${A.recInput('L', `${FL.SURF[next].icon} grip limit`, 'kN')}</div>` + A.fbHTML()
        + A.actions(A.btn('btnRecord', 'Record in my table', 'btn-primary', d.until)) + A.hintsHTML(['The red mark on the gauge is the most friction this road can give.', 'Use the road buttons under the picture.']);
    },
    bindTask(pg, d) {
      const record = () => {
        if (A.left(d.until)) return;
        const L = A.state.limits || (A.state.limits = {}), next = LIM_ROADS.find(s => L[s] === undefined);
        if (!next) return;
        if (d.surf !== next) { A.ui.fb = { retry: true, msg: `Switch the road to ${FL.SURF[next].name} first, with the buttons under the picture.` }; return A.renderTask(); }
        const lim = FL.fMax(FL.SURF[next].mu, 1000) / 1000, res = FL.checkGauge(A.rec.L || '', lim, 'car', { wantLimit: true, needle: 0 });
        if (res.mistake === 'blank') { A.ui.fb = { retry: true, msg: 'Read the red mark on the gauge and type the number.' }; return A.renderTask(); }
        A.recordTry(`${pg.id}_${next}`, res.ok);
        if (!res.ok) { missed(d, res.mistake, res.msg); A.save(); return A.render(); }
        L[next] = FL.parseNum(A.rec.L); A.rec = {}; A.ui.fb = null; d.until = 0;
        const after = LIM_ROADS.find(s => L[s] === undefined);
        if (after) d.surf = after;
        A.save(); A.render();
      };
      A.on('btnRecord', record);
      A.bindRec(record);
    }
  };

  // ---------- Test a prediction: find the real edge on a road or vehicle nobody tested ----------
  const predOf = pg => (pg.pred === 'crossWet' ? A.state.graph.cross_wet : A.state.predV);
  A.kinds.find = {
    enter(pg, d) { World().park({ s: 0 }); if (!d.runs) d.runs = []; },
    world: pg => ({ surf: pg.surf, veh: pg.veh }),
    scene: (pg, d) => A.panelScene({ surf: pg.surf, veh: pg.veh, more: [`Your prediction: ${FL.fmt(predOf(pg))} m/s`] }),
    ctl: (pg, d) => (d.ok ? A.freeCtl(d.edge) : A.speedCtl({ start: Math.max(A.slider().min, Math.floor(predOf(pg) || 8) - 2) })),
    bindStage(pg, d) {
      if (d.ok) return A.bindFree(pg.surf, pg.veh);
      A.bindSpeedCtl(v => testDrive(d, pg.surf, pg.veh, v, () => {
        const step = A.slider().step, edge = FL.safeSpeed(FL.SURF[pg.surf].mu, rig().r, step);
        const held = d.runs.some(r => r.grip && Math.abs(r.v - edge) < 1e-6), slid = d.runs.some(r => !r.grip && Math.abs(r.v - edge - step) < 1e-6);
        if (held && slid) { d.ok = true; d.edge = edge; A.state.found[pg.surf] = edge; A.save(); A.render(); }
      }));
    },
    task(pg, d) {
      const pred = predOf(pg), step = A.slider().step;
      const s = A.title(d.ok ? `Your prediction: ${FL.fmt(pred)} m/s. It held at ${FL.fmt(d.edge)} m/s and slid at ${FL.fmt(d.edge + step)}.` : `Your prediction is ${FL.fmt(pred)} m/s. Test it.`);
      if (!d.ok) return s + `<p class="task-body">Find the fastest speed that holds, and the one ${FL.fmt(step)} m/s faster that slides.</p>` + runLog(d.runs) + A.fbHTML() + A.actions();
      const close = Math.abs(pred - d.edge) <= step + 0.6;
      const why = { conceptual: 'Heavy or light, the truck and the car have the same fastest safe speed.', cp: 'Where your curve crossed the wet grip line was the real limit.', honors: 'Your straight line of v_max² against μ predicted a road you never drove.' }[A.tier];
      return s + runLog(d.runs) + A.note('fb-ok', close ? `<strong>Your prediction held up.</strong> ${why}` : `Those are close. A small error in your table moves the prediction a little. ${why}`) + A.actions(A.nextBtn());
    }
  };
})();

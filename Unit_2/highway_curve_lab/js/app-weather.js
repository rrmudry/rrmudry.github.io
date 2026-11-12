// Highway Curve Lab — Part 4 (Mass & Weather) and Part 5 (Engineer the Sign).
//   double: drive at one speed and twice that speed, read the gauge both times: twice as fast needs 4 times the friction.
//   mass:   car and truck on ice at the same speed: 4 times the grip, but also 4 times the friction needed.
//   mph → sign → cer: read your wet-road speed in mph, choose a curve sign, test it, defend it.
//   bank (Period 0): tilt the curve so the road's push alone turns the car, even on glare ice.

(function () {
  const A = window.FLApp, { $ } = A, FL = window.FL, Scene = window.Scene, World = () => window.World;
  const rig = () => A.state.rig;
  const missed = (d, id, msg) => { A.recordMistake(id); d.miss = (d.miss || 0) + 1; d.until = A.wait(Math.min(20, 4 + 4 * d.miss)); A.ui.fb = { retry: true, msg }; };
  const kN = (veh, v, surf) => Math.min(FL.fNeed(FL.VEH[veh].m, v, rig().r), FL.fMax(FL.SURF[surf].mu, FL.VEH[veh].m)) / 1000;
  const limitKN = (veh, surf) => FL.fMax(FL.SURF[surf].mu, FL.VEH[veh].m) / 1000;
  // A fixed-speed drive button
  const driveBtn = (v, label = '▶ Drive') => `<span class="ctl-label">Speed ${FL.fmt(v)} m/s</span><button type="button" class="btn-step" id="btnRun" ${A.driving() ? 'disabled' : ''}>${label}</button>`;
  const fixedDrive = (o, after) => {
    if (A.driving()) return;
    A.lockCtl(true);
    A.drive(Object.assign({}, o, { onDone: grip => { A.lockCtl(false); after(grip); } }));
  };

  // ---------- Twice as fast ----------
  const vSlow = () => Math.sqrt(2 * rig().r);   // 8, 10 or 12 m/s: 2 kN for the car; twice as fast lands on the dry limit
  const doubleReplays = d => [{ label: `Watch ${FL.fmt(vSlow())} m/s`, surf: 'dry', veh: 'car', v: vSlow() }, { label: `Watch ${FL.fmt(2 * vSlow())} m/s`, surf: 'dry', veh: 'car', v: 2 * vSlow() }]
    .filter((r, i) => (d.step === 'read1' ? i === 0 : d.step === 'read2' ? i === 1 : true));
  A.kinds.double = {
    enter(pg, d) {
      if (!d.step) d.step = 'run1';
      World().park({ s: 0 });
      const held = { read1: vSlow(), run2: vSlow(), read2: 2 * vSlow(), ask: 2 * vSlow(), done: 2 * vSlow() }[d.step];
      if (held) A.setGauge({ v: held, F: kN('car', held, 'dry'), snap: true });
    },
    world: () => ({ surf: 'dry', veh: 'car' }),
    scene: () => A.panelScene({ surf: 'dry', veh: 'car' }),
    ctl(pg, d) {
      if (d.step === 'run1') return driveBtn(vSlow());
      if (d.step === 'run2') return driveBtn(2 * vSlow(), '▶ Drive twice as fast');
      return A.replayCtl(doubleReplays(d), d.step.startsWith('read') ? 'The gauge holds its reading.' : '');
    },
    bindStage(pg, d) {
      if (d.step !== 'run1' && d.step !== 'run2') return A.bindReplay(doubleReplays(d));
      A.on('btnRun', () => {
        const v = d.step === 'run1' ? vSlow() : 2 * vSlow();
        fixedDrive({ surf: 'dry', veh: 'car', v }, () => { d.step = d.step === 'run1' ? 'read1' : 'read2'; A.save(); A.render(); });
      });
    },
    task(pg, d) {
      const rows = `<div class="mini-rows"><span>Run 1 (${FL.fmt(vSlow())} m/s): <strong>${d.F1 === undefined ? '…' : `${FL.fmt(d.F1)} kN`}</strong></span><span>Run 2 (${FL.fmt(2 * vSlow())} m/s): <strong>${d.F2 === undefined ? '…' : `${FL.fmt(d.F2)} kN`}</strong></span></div>`;
      if (d.step === 'run1') return A.title('Drive at this speed. Watch the tire grip gauge.') + rows + A.fbHTML() + A.actions();
      if (d.step === 'run2') return A.title('Now drive twice as fast.') + rows + A.actions();
      if (d.step === 'read1' || d.step === 'read2') {
        return A.title('Read the tire grip gauge.') + rows + `<div class="rec-row">${A.recInput('F', 'friction', 'kN')}</div>` + A.fbHTML()
          + A.actions(A.btn('btnRecord', 'Record it', 'btn-primary', d.until)) + A.hintsHTML(['Each small mark on the car’s gauge is 0.5 kN.', 'The magnifier shows the needle close up.']);
      }
      const q = FL.Q.factor(d.F1, d.F2, 2);
      if (d.step === 'ask') return rows + A.qHTML(q, d.q || (d.q = {}), { next: A.nextBtn() });
      return rows + A.title('Twice as fast needed 4 times the friction.') + A.okNote(`The fast run used <strong>all</strong> the grip of the dry road: the needle sat on the red mark. ${A.tier === 'conceptual' ? 'Speed counts twice: 2 × 2 = 4.' : 'Friction needed = m × v² ÷ r: double v, and v² is 4 times as big.'}`) + A.actions(A.nextBtn());
    },
    bindTask(pg, d) {
      const record = () => {
        if (A.left(d.until) || (d.step !== 'read1' && d.step !== 'read2')) return;
        const v = d.step === 'read1' ? vSlow() : 2 * vSlow(), res = FL.checkGauge(A.rec.F || '', kN('car', v, 'dry'), 'car', { v, limit: limitKN('car', 'dry') });
        if (res.mistake === 'blank') { A.ui.fb = { retry: true, msg: res.msg }; return A.renderTask(); }
        A.recordTry(`${pg.id}_${d.step}`, res.ok);
        if (!res.ok) { missed(d, res.mistake, res.msg); A.save(); return A.render(); }
        if (d.step === 'read1') { d.F1 = FL.parseNum(A.rec.F); d.step = 'run2'; } else { d.F2 = FL.parseNum(A.rec.F); d.step = 'ask'; }
        A.rec = {}; A.ui.fb = null; d.until = 0; A.save(); A.render();
      };
      A.on('btnRecord', record); A.bindRec(record);
      A.on('btnCheck', () => A.checkQ(FL.Q.factor(d.F1, d.F2, 2), d.q, `${pg.id}_factor`, { onOk: () => { d.step = 'done'; } }));
    },
    calc: () => null
  };

  // ---------- Heavy truck on ice ----------
  const vIce = () => Math.sqrt(2 * rig().r);   // exactly the icy limit for any mass
  const MASS_STEPS = ['runCar', 'readCar', 'runTruck', 'readTruck', 'ask', 'done'];
  const massReplays = d => [{ label: 'Watch the car', surf: 'icy', veh: 'car', v: vIce() }, { label: 'Watch the truck', surf: 'icy', veh: 'truck', v: vIce() }]
    .filter(r => (d.step === 'readCar' ? r.veh === 'car' : d.step === 'readTruck' ? r.veh === 'truck' : true));
  A.kinds.mass = {
    enter(pg, d) {
      if (!d.step) d.step = 'runCar';
      d.veh = MASS_STEPS.indexOf(d.step) >= 2 ? 'truck' : 'car';
      World().park({ s: 0 });
      if (d.step === 'readCar' || d.step === 'readTruck') A.setGauge({ v: vIce(), F: kN(d.veh, vIce(), 'icy'), snap: true });
    },
    world: (pg, d) => ({ surf: 'icy', veh: A.watch().veh || d.veh }),
    scene: (pg, d) => A.panelScene({ surf: 'icy', veh: A.watch().veh || d.veh }),
    ctl(pg, d) {
      if (d.step === 'runCar' || d.step === 'runTruck') return driveBtn(vIce(), d.step === 'runCar' ? '▶ Drive the car' : '▶ Drive the truck');
      return A.replayCtl(massReplays(d), d.step.startsWith('read') ? 'The gauge holds its reading.' : '');
    },
    bindStage(pg, d) {
      if (d.step !== 'runCar' && d.step !== 'runTruck') return A.bindReplay(massReplays(d));
      A.on('btnRun', () => fixedDrive({ surf: 'icy', veh: d.veh, v: vIce() }, () => { d.step = d.step === 'runCar' ? 'readCar' : 'readTruck'; A.save(); A.render(); }));
    },
    task(pg, d) {
      const R = d.read || {}, cell = (veh, k) => (R[veh] && R[veh][k] !== undefined ? `${FL.fmt(R[veh][k])} kN` : '…');
      const grid = `<table class="mini-table"><tr><th></th><th>friction needed</th><th>grip limit</th></tr><tr><th>🚗 car</th><td>${cell('car', 'F')}</td><td>${cell('car', 'L')}</td></tr><tr><th>🚚 truck</th><td>${cell('truck', 'F')}</td><td>${cell('truck', 'L')}</td></tr></table>`;
      if (d.step === 'runCar') return A.title('Drive the car on ice at this speed.') + grid + A.actions();
      if (d.step === 'runTruck') return A.title('Now drive the truck, 4 times as heavy, at the same speed.') + grid + A.actions();
      if (d.step === 'readCar' || d.step === 'readTruck') {
        return A.title('Read the needle and the red grip-limit mark.') + grid + `<div class="rec-row">${A.recInput('F', 'friction', 'kN')}${A.recInput('L', 'grip limit', 'kN')}</div>` + A.fbHTML()
          + A.actions(A.btn('btnRecord', 'Record it', 'btn-primary', d.until)) + A.hintsHTML([`The truck’s gauge goes up to 40 kN. Each small mark is ${FL.fmt(FL.GAUGE[d.veh].minor)} kN.`]);
      }
      const q = massQ(d);
      if (d.step === 'ask') return grid + A.qHTML(q, d.q || (d.q = {}), { next: A.nextBtn() });
      return grid + A.title('Same speed, same result: both just held.') + A.okNote('The truck has 4 times the grip, but it also needs 4 times the friction to turn. They cancel. Heavy or light, the fastest safe speed is the same.') + A.actions(A.nextBtn());
    },
    bindTask(pg, d) {
      const record = () => {
        if (A.left(d.until) || !d.step.startsWith('read')) return;
        const veh = d.veh, F = kN(veh, vIce(), 'icy'), L = limitKN(veh, 'icy');
        const a = FL.checkGauge(A.rec.F || '', F, veh, { v: vIce() }), b = FL.checkGauge(A.rec.L || '', L, veh, { wantLimit: true });
        if (a.mistake === 'blank' || b.mistake === 'blank') { A.ui.fb = { retry: true, msg: 'Type both readings: the needle and the red mark.' }; return A.renderTask(); }
        A.recordTry(`${pg.id}_${veh}`, a.ok && b.ok);
        if (!a.ok) { missed(d, a.mistake, `Friction: ${a.msg}`); A.save(); return A.render(); }
        if (!b.ok) { missed(d, b.mistake, `Grip limit: ${b.msg}`); A.save(); return A.render(); }
        (d.read || (d.read = {}))[veh] = { F: FL.parseNum(A.rec.F), L: FL.parseNum(A.rec.L) };
        d.step = veh === 'car' ? 'runTruck' : 'ask'; d.veh = 'truck';
        if (veh === 'car') { World().park({ s: 0 }); A.setGauge({ v: 0, F: 0, snap: true }); A.setBanner(null); }
        A.rec = {}; A.ui.fb = null; d.until = 0; A.save(); A.render();
      };
      A.on('btnRecord', record); A.bindRec(record);
      A.on('btnCheck', () => A.checkQ(massQ(d), d.q, `${pg.id}_q`, { onOk: () => { d.step = 'done'; } }));
    },
    calc: (pg, d) => (d.step === 'ask' && !(d.q && d.q.ok) && massQ(d).calc ? massQ(d) : null)
  };
  // Conceptual: read the pattern (no division). CP: one forward formula. Honors: the rearranged formula with a square root.
  const massQ = d => (A.tier === 'conceptual' ? FL.Q.gripFactor(d.read.car.L, d.read.truck.L) : A.tier === 'cp' ? FL.Q.gripMax() : FL.Q.vmaxIce(rig().r));

  // ---------- CP and Honors: the same speed in the inner and the outer lane ----------
  // d.step: predict → outer (drive) → inner (drive) → ask → done
  const vLane = () => FL.safeSpeed(FL.SURF.dry.mu, rig().r);   // the outer lane's fastest safe speed: exactly the dry limit
  const laneQ = () => (A.tier === 'cp' ? FL.Q.laneNeed(rig().r, vLane()) : FL.Q.laneVmax(rig().r));
  const laneReplays = () => [{ label: 'Watch the outer lane', surf: 'dry', veh: 'car', lane: 'outer', v: vLane() }, { label: 'Watch the inner lane', surf: 'dry', veh: 'car', lane: 'inner', v: vLane(), r: FL.innerR(rig().r) }];
  const PRED = [['outer', 'The outer lane'], ['inner', 'The inner lane'], ['same', 'Both the same']];
  const laneNow = d => A.watch().lane || (['inner', 'ask', 'done'].includes(d.step) ? 'inner' : 'outer');
  A.kinds.lane = {
    enter(pg, d) { if (!d.step) d.step = 'predict'; World().park({ s: 0 }); },
    world: (pg, d) => ({ surf: 'dry', veh: 'car', lane: laneNow(d) }),
    scene: (pg, d) => A.panelScene({ surf: 'dry', veh: 'car', more: [`Outer lane: r = ${FL.fmt(rig().r)} m`, `Inner lane: r = ${FL.fmt(FL.innerR(rig().r))} m`, `Driving: ${laneNow(d)} lane`] }),
    ctl(pg, d) {
      if (d.step === 'outer') return driveBtn(vLane(), '▶ Drive the outer lane');
      if (d.step === 'inner') return driveBtn(vLane(), '▶ Same speed, inner lane');
      if (d.step === 'ask' || d.step === 'done') return A.replayCtl(laneReplays());
      return '';
    },
    bindStage(pg, d) {
      if (d.step === 'ask' || d.step === 'done') return A.bindReplay(laneReplays());
      A.on('btnRun', () => {
        const lane = d.step === 'outer' ? 'outer' : 'inner';
        // The physics uses the radius of the lane being driven
        const r = lane === 'outer' ? rig().r : FL.innerR(rig().r);
        if (A.driving()) return;
        A.lockCtl(true);
        A.drive({ surf: 'dry', veh: 'car', v: vLane(), r, onDone: () => { A.lockCtl(false); d.step = lane === 'outer' ? 'inner' : 'ask'; if (d.step === 'inner') World().park({ s: 0 }); A.save(); A.render(); } });
      });
    },
    task(pg, d) {
      const v = vLane();
      if (d.step === 'predict') {
        return A.title(`Which lane can take the curve faster?`) + '<p class="task-body">The inner lane is a tighter circle. Not graded.</p>'
          + `<div class="opts">${PRED.map(([id, t]) => `<button type="button" class="opt" data-pred="${id}">${t}</button>`).join('')}</div>`;
      }
      if (d.step === 'outer') return A.title(`Drive ${FL.fmt(v)} m/s in the outer lane.`) + '<p class="task-body">That is the fastest safe speed for this lane. Watch the grip gauge.</p>' + A.actions();
      if (d.step === 'inner') return A.title('It held, right at the red mark. Now the inner lane, same speed.') + A.actions();
      const q = laneQ(), said = { outer: 'You predicted the outer lane.', inner: 'You predicted the inner lane.', same: 'You predicted no difference.' }[d.pred] || '';
      if (d.step === 'ask') return `<p class="launch-tag">Same speed: the outer lane held, the inner lane slid. ${said}</p>` + A.qHTML(q, d.q || (d.q = {}), { next: A.nextBtn() });
      const msg = A.tier === 'cp'
        ? `The inner lane needs ${FL.fmt(Math.round(q.target))} N, more than the 8,000 N the dry road can give. A tighter curve needs more friction at the same speed.`
        : `The inner lane’s limit is ${FL.fmt(FL.round(q.target, 1))} m/s, slower than the outer lane’s ${FL.fmt(v)} m/s. A smaller r means a lower v_max.`;
      return A.title('The outer lane is faster.') + A.okNote(msg) + A.actions(A.nextBtn());
    },
    bindTask(pg, d) {
      document.querySelectorAll('#taskCard [data-pred]').forEach(b => b.addEventListener('click', () => { d.pred = b.dataset.pred; d.step = 'outer'; A.save(); A.render(); }));
      A.on('btnCheck', () => A.checkQ(laneQ(), d.q, pg.id, { onOk: () => { d.step = 'done'; } }));
    },
    calc: (pg, d) => (d.step === 'ask' && !(d.q && d.q.ok) ? laneQ() : null)
  };

  // ---------- Your wet-road speed in mph ----------
  A.kinds.mph = {
    enter(pg, d) { World().park({ s: 0 }); if (d.ok) A.setGauge({ v: A.wetSpeed(), F: kN('car', A.wetSpeed(), 'wet'), snap: true }); },
    world: () => ({ surf: 'wet', veh: 'car' }),
    scene: () => A.panelScene({ surf: 'wet', veh: 'car', more: [`Your fastest safe wet speed: ${FL.fmt(A.wetSpeed())} m/s`] }),
    ctl: (pg, d) => (d.ran ? `<span class="ctl-label">Speed ${FL.fmt(A.wetSpeed())} m/s</span>` + A.replayCtl([{ label: 'Watch again' }], 'The speedometer holds its reading.') : A.speedCtl({ start: 6 })),
    bindStage(pg, d) {
      if (d.ran) return A.bindReplay([{ surf: 'wet', veh: 'car', v: A.wetSpeed() }]);
      A.bindSpeedCtl(v => {
        if (Math.abs(v - A.wetSpeed()) > 1e-6) { A.ui.fb = { retry: true, msg: `Set the speed to your fastest safe wet speed: ${FL.fmt(A.wetSpeed())} m/s.` }; return A.renderTask(); }
        A.ui.fb = null;
        fixedDrive({ surf: 'wet', veh: 'car', v }, () => { d.ran = true; A.save(); A.render(); });
      });
    },
    task(pg, d) {
      if (d.ok) return A.title(`${FL.fmt(A.wetSpeed())} m/s is about ${FL.fmt(Math.round(A.state.wetMph))} mph.`) + A.okNote('Speed signs in the US use mph. Next you will choose one.') + A.actions(A.nextBtn());
      if (!d.ran) return A.title('Drive at your fastest safe wet speed.') + '<p class="task-body">It is on the picture. Set it under the picture, then press <strong>▶ Drive</strong>.</p>' + A.fbHTML() + A.actions();
      return A.title('Read the inner scale of the speedometer: mph.') + `<div class="rec-row">${A.recInput('mph', 'speed', 'mph')}</div>` + A.fbHTML()
        + A.actions(A.btn('btnRecord', 'Check my reading', 'btn-primary', d.until)) + A.hintsHTML(['The inner numbers go up by 10 mph. Each small mark is 2 mph.']);
    },
    bindTask(pg, d) {
      const record = () => {
        if (!d.ran || d.ok || A.left(d.until)) return;
        const res = FL.checkMph(A.rec.mph || '', A.wetSpeed());
        if (res.mistake === 'blank') { A.ui.fb = { retry: true, msg: res.msg }; return A.renderTask(); }
        A.recordTry(pg.id, res.ok);
        if (!res.ok) { missed(d, res.mistake, res.msg); A.save(); return A.render(); }
        A.state.wetMph = FL.mph(A.wetSpeed()); d.ok = true; A.rec = {}; A.ui.fb = null; A.save(); A.render();
      };
      A.on('btnRecord', record); A.bindRec(record);
    }
  };

  // ---------- Choose the curve sign, then test it in the rain and on ice ----------
  // d.step: pick → rain (test drive at the sign speed) → ice → done
  const signV = n => FL.round(n / FL.MPH, 2);
  const wetMph = () => A.state.wetMph || FL.mph(A.wetSpeed());
  const signReplays = d => [{ label: 'Watch it in the rain', surf: 'wet', veh: 'car', v: signV(d.sign) }, { label: 'Watch it on ice', surf: 'icy', veh: 'car', v: signV(d.sign) }];
  A.kinds.sign = {
    enter(pg, d) {
      if (!d.step) d.step = 'pick';
      if (d.bad && d.step === 'pick') A.ui.fb = { bad: true, msg: d.bad };
      if (d.step !== 'pick') World().park(d.step === 'done' ? { phi: 7, crashed: true } : { s: 0 });
    },
    world: (pg, d) => (d.step === 'pick' ? null : { surf: A.watch().surf || (d.step === 'rain' ? 'wet' : 'icy'), veh: 'car' }),
    scene(pg, d) {
      if (d.step === 'pick') return Scene.signs({ pick: d.pick, clickable: !d.bad, note: `Your fastest safe wet speed: about ${FL.fmt(Math.round(wetMph()))} mph` });
      return A.panelScene({ surf: A.watch().surf || (d.step === 'rain' ? 'wet' : 'icy'), veh: 'car', more: [`🚧 Sign: ${d.sign} mph = ${FL.fmt(signV(d.sign))} m/s`] });
    },
    ctl(pg, d) {
      if (d.step === 'rain') return driveBtn(signV(d.sign), '▶ Test it in the rain');
      if (d.step === 'ice') return driveBtn(signV(d.sign), '▶ Now try it on ice');
      if (d.step === 'done') return A.replayCtl(signReplays(d));
      return '';
    },
    bindStage(pg, d) {
      if (d.step === 'done') return A.bindReplay(signReplays(d));
      if (d.step === 'pick' && !d.bad) document.querySelectorAll('#stageSvg [data-sign]').forEach(g => g.addEventListener('click', () => { d.pick = Number(g.dataset.sign); A.ui.fb = null; A.save(); A.render(); }));
      A.on('btnRun', () => {
        const surf = d.step === 'rain' ? 'wet' : 'icy';
        fixedDrive({ surf, veh: 'car', v: signV(d.sign) }, grip => {
          if (d.step === 'rain') {
            if (!grip) { d.miss = (d.miss || 0) + 1; Object.assign(d, { step: 'pick', bad: `At ${d.sign} mph the car slid off the wet curve. Your fastest safe wet speed was about ${Math.round(wetMph())} mph. Pick a sign at or below it.`, until: A.wait(Math.min(16, 6 + 3 * d.miss)), pick: null }); A.recordMistake('sign_too_fast'); A.recordTry(`${pg.id}_rain`, false); }
            else { d.step = 'ice'; A.recordTry(`${pg.id}_rain`, true); }
          } else { d.step = 'done'; A.state.sign = d.sign; }
          A.save(); A.render();
        });
      });
    },
    task(pg, d) {
      if (d.step === 'pick') {
        const s = A.title('Click the sign you would post for drivers on a rainy day.');
        if (d.bad) return s + A.note('fb-bad', `<strong>✗ Not safe.</strong> ${d.bad}`) + A.actions(A.btn('btnNew', 'Pick again ▶', 'btn-primary', d.until));
        return s + `<p class="task-body">${d.pick ? `You picked ${d.pick} mph.` : 'No sign picked yet.'}</p>` + A.fbHTML() + A.actions('<button type="button" class="btn-primary" id="btnCheck">Post this sign</button>');
      }
      if (d.step === 'rain') return A.title(`Test your ${d.sign} mph sign on the wet curve.`) + '<p class="task-body">Press the button under the picture.</p>' + A.actions();
      if (d.step === 'ice') return A.title('It held in the rain. What about ice?') + '<p class="task-body">Same sign speed, icy road. Press the button under the picture.</p>' + A.actions();
      return A.title(`Your ${d.sign} mph sign is safe in the rain.`) + A.okNote('On ice it is still too fast. That is why real roads add “Slow when icy” signs.') + A.actions(A.nextBtn());
    },
    bindTask(pg, d) {
      A.on('btnCheck', () => {
        if (!d.pick) { A.ui.fb = { retry: true, msg: 'Click a sign on the picture first.' }; return A.renderTask(); }
        if (d.pick < wetMph() - 10) { A.recordTry(`${pg.id}_pick`, false); A.recordMistake('sign_too_slow'); d.until = A.wait(4); A.ui.fb = { retry: true, msg: `That is safe, but much slower than needed. Drivers ignore signs that are far too low. Pick the fastest sign at or below about ${Math.round(wetMph())} mph.` }; A.save(); return A.render(); }
        d.sign = d.pick; d.step = 'rain'; A.ui.fb = null;
        World().park({ s: 0 });
        A.save(); A.render();
      });
      A.on('btnNew', () => { if (A.left(d.until)) return; d.bad = null; A.ui.fb = null; A.save(); A.render(); });
    }
  };

  // ---------- Claim, evidence, reasoning: built from the student's own numbers ----------
  function evidence() {
    const st = A.state, T = st.table || [], r = rig().r;
    const row = (s, veh = 'car') => T.find(x => x.surf === s && (x.veh || 'car') === veh);
    const mph = v => Math.round(FL.mph(v));
    if (A.tier === 'cp') {
      const w = st.found.wet || FL.safeSpeed(0.5, r), g = st.graph;
      return [
        { id: 'right', t: `On the wet road my car held at ${w} m/s (${mph(w)} mph) and slid at ${w + 1} m/s.` },
        { id: 'dry', t: `My curve crossed the dry grip line at about ${FL.fmt(g.cross_dry || FL.vMax(0.8, r))} m/s.` },
        { id: 'icy', t: `My curve crossed the icy grip line at about ${FL.fmt(g.cross_icy || FL.vMax(0.2, r))} m/s.` }
      ];
    }
    const dry = row('dry'), icy = row('icy'), wet = row('wet');
    const v = x => (x ? x.v : 0);
    return [
      { id: 'right', t: `In my table, the car on the wet road held at ${FL.fmt(v(wet))} m/s (${mph(v(wet))} mph).` },
      { id: 'dry', t: `In my table, the car on the dry road held at ${FL.fmt(v(dry))} m/s (${mph(v(dry))} mph).` },
      { id: 'icy', t: `In my table, the car on the icy road held at ${FL.fmt(v(icy))} m/s (${mph(v(icy))} mph).` }
    ];
  }
  const REASONS = [
    { key: 'faster', stem: 'Going faster needs', opts: [['more', 'more friction to turn.'], ['less', 'less friction to turn.'], ['same', 'the same friction to turn.']], why: 'Friction needed grows with speed: twice as fast needed 4 times the friction.' },
    { key: 'rain', stem: 'Rain', opts: [['lowers', 'lowers the most friction the road can give.'], ['raises', 'raises the most friction the road can give.'], ['nochange', 'does not change the road’s grip.']], why: 'Your grip limits were lower on wet and icy roads.' },
    { key: 'slide', stem: 'If the car needs more friction than the road can give, it slides', opts: [['tangent', 'straight off, along the tangent.'], ['center', 'toward the center.'], ['tighter', 'into a tighter circle.']], why: 'Without enough friction nothing turns the car, so it keeps going straight.' }
  ];
  const RIGHT = { faster: 'more', rain: 'lowers', slide: 'tangent' };
  A.kinds.cer = {
    enter(pg, d) {
      if (!d.pick) d.pick = {};
      if (!d.order) d.order = { ev: FL.shuffle(['right', 'dry', 'icy']), faster: FL.shuffle(['more', 'less', 'same']), rain: FL.shuffle(['lowers', 'raises', 'nochange']), slide: FL.shuffle(['tangent', 'center', 'tighter']) };
      if (d.bad && !d.ok) A.ui.fb = { bad: true, msg: d.bad };
    },
    scene: () => Scene.signs({ pick: A.state.sign, note: `Your posted sign: ${A.state.sign || '?'} mph` }),
    task(pg, d) {
      const lock = d.ok || d.bad ? 'disabled' : '', ev = evidence();
      const sel = (key, opts) => `<select class="cer-select" data-cer="${key}" ${lock}><option value="">choose…</option>${opts.map(([id, t]) => `<option value="${id}" ${d.pick[key] === id ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
      let s = A.title('Defend your sign. Finish each part.');
      s += `<div class="cer"><p><strong>Claim:</strong> The curve sign should say ${A.state.sign || '?'} mph.</p>`;
      s += `<p><strong>Evidence:</strong> ${sel('ev', d.order.ev.map(id => [id, ev.find(e => e.id === id).t]))}</p>`;
      s += '<p><strong>Reasoning:</strong></p>' + REASONS.map(R => `<p class="cer-line">${R.stem} ${sel(R.key, d.order[R.key].map(id => R.opts.find(o => o[0] === id)))}</p>`).join('') + '</div>';
      if (d.ok) return s + A.okNote('A strong argument: your claim, your own number as evidence, and the physics that connects them.') + A.actions(A.nextBtn());
      if (d.bad) return s + A.note('fb-bad', `<strong>✗ Not yet.</strong> ${d.bad}`) + A.actions(A.btn('btnNew', 'Fix it ▶', 'btn-primary', d.until));
      return s + A.fbHTML() + A.actions('<button type="button" class="btn-primary" id="btnCheck">Check</button>');
    },
    bindTask(pg, d) {
      document.querySelectorAll('#taskCard [data-cer]').forEach(el => el.addEventListener('change', () => { d.pick[el.dataset.cer] = el.value; A.ui.fb = null; A.save(); }));
      A.on('btnCheck', () => {
        const keys = ['ev', 'faster', 'rain', 'slide'];
        if (keys.some(k => !d.pick[k])) { A.ui.fb = { retry: true, msg: 'Choose something in every box first.' }; return A.renderTask(); }
        let msg = null;
        if (d.pick.ev !== 'right') msg = 'Your sign is for rainy days, so the evidence should be your wet-road number.';
        else { const R = REASONS.find(x => d.pick[x.key] !== RIGHT[x.key]); if (R) msg = R.why; }
        A.recordTry(pg.id, !msg);
        if (!msg) { d.ok = true; A.ui.fb = null; } else {
          A.recordMistake('cer'); d.miss = (d.miss || 0) + 1;
          Object.assign(d, { bad: msg, until: A.wait(Math.min(20, 6 + 4 * d.miss)) }); A.ui.fb = { bad: true, msg };
        }
        A.save(); A.render();
      });
      A.on('btnNew', () => {
        if (A.left(d.until)) return;
        // Wrong boxes are cleared and every list is shuffled, so the fix has to be read
        if (d.pick.ev !== 'right') delete d.pick.ev;
        REASONS.forEach(R => { if (d.pick[R.key] !== RIGHT[R.key]) delete d.pick[R.key]; });
        Object.keys(d.order).forEach(k => { d.order[k] = FL.shuffle(d.order[k]); });
        d.bad = null; A.ui.fb = null; A.save(); A.render();
      });
    }
  };

  // ---------- Period 0: bank the curve ----------
  const bankV = () => A.wetSpeed();
  const bankQ = () => FL.Q.bank(bankV(), rig().r);
  const bankReplay = () => [{ label: 'Watch again', surf: 'glare', veh: 'car', run: done => {
    A.setBanner(null); A.setGauge({ v: bankV(), F: 0, slip: false });
    World().run({ v: bankV(), slipAt: null, onDone: () => { A.setBanner({ text: '✅ It held, with the friction gauge at 0', cls: 'hc-ok' }); done(); } });
  } }];
  A.kinds.bank = {
    enter(pg, d) { if (!d.q) d.q = {}; World().park({ s: 0 }); },
    world: (pg, d) => ({ surf: 'glare', veh: 'car', bank: d.q.ok ? FL.round(d.q.val, 1) : 0 }),
    scene: (pg, d) => A.panelScene({ surf: 'glare', veh: 'car', more: [`Design speed: ${FL.fmt(bankV())} m/s`].concat(d.q.ok ? [`Banked at ${FL.fmt(FL.round(d.q.val, 1))}°`] : []) }),
    ctl: (pg, d) => (d.q.ok && !d.ok ? driveBtn(bankV(), '▶ Drive on glare ice') : d.ok ? A.replayCtl(bankReplay(), 'It held with no friction at all.') : '<span class="ctl-note">Glare ice: μ = 0. No friction at all.</span>'),
    bindStage(pg, d) {
      if (d.ok) return A.bindReplay(bankReplay());
      A.on('btnRun', () => {
        if (A.driving()) return;
        A.lockCtl(true); A.setBanner(null); A.setGauge({ v: bankV(), F: 0, slip: false });
        World().run({ v: bankV(), slipAt: null, onDone: () => { A.setBanner({ text: '✅ It held, with the friction gauge at 0', cls: 'hc-ok' }); d.ok = true; A.save(); A.render(); } });
      });
    },
    task(pg, d) {
      if (!d.q.ok) return A.qHTML(bankQ(), d.q);
      if (!d.ok) return A.title(`The curve is now banked at ${FL.fmt(FL.round(d.q.val, 1))}°. Test it.`) + '<p class="task-body">Glare ice has no friction. Press the button under the picture.</p>' + A.actions();
      return A.title('No friction, and the car still turned.') + A.okNote('On a banked road, the road pushes the car partly sideways, toward the center. At the design speed that push alone turns the car.') + A.actions(A.nextBtn());
    },
    bindTask(pg, d) { A.on('btnCheck', () => A.checkQ(bankQ(), d.q, pg.id, { okMsg: v => `θ = ${FL.fmt(FL.round(v, 1))}°` })); },
    calc: (pg, d) => (!d.q.ok ? bankQ() : null)
  };
})();

// Centripetal Force Lab — the graph: plot your own points, then get answers out of your own graph and table.

(function () {
  const A = window.FLApp, { $ } = A, FL = window.FL, Scene = window.Scene;
  const rig = () => A.state.rig, G = () => A.state.graph, T = () => A.state.table;
  const N = () => FL.TRIALS[A.tier];

  A.graphKey = () => G().xKey || (A.tier === 'cp' ? 'a' : 'v');
  A.graphPts = (key, n) => T().slice(0, n).map((row, i) => Object.assign(FL.rowXY(row, key), { i }));
  // o = { xKey, n (points shown), fit: false (no line or curve), …anything Scene.graph takes }
  A.graphScene = (o = {}) => {
    const key = o.xKey || A.graphKey(), n = o.n === undefined ? (G().n || 0) : o.n;
    const base = { spec: FL.graphSpec(A.tier, rig(), key), points: A.graphPts(key, n) };
    if (o.fit !== false && n >= N()) {
      if (A.tier === 'conceptual') base.curve = rig().m / rig().r;
      else if (G().pts && key === (A.tier === 'cp' ? 'a' : 'v2')) base.line = G().pts.map(i => base.points[i]);
    }
    return Scene.graph(Object.assign(base, o));
  };

  // ---------- Plot one trial ----------
  const LAST = {
    conceptual: 'Your points do not make a straight line. They curve upward: the force grows faster and faster.',
    cp: 'Look at your points. They fall close to one straight line.',
    honors: 'Your points curve upward. It is hard to read a rule from a curve.'
  };
  A.kinds.plot = {
    scene(pg, d) {
      const key = A.graphKey(), pts = A.graphPts(key, Math.max(G().n || 0, d.ok ? pg.n : 0));
      if (d.ok && pts[pg.n - 1]) pts[pg.n - 1].cls = 'fl-pt-new';
      const target = FL.rowXY(T()[pg.n - 1], key);
      return A.graphScene({ points: pts, n: pts.length, guide: pg.n === 1 && !d.ok ? target : null, miss: d.ok ? null : d.miss || null, clickable: !d.ok });
    },
    bindStage(pg, d) {
      if (d.ok) return;
      const key = A.graphKey(), spec = FL.graphSpec(A.tier, rig(), key);
      A.onStageClick(p => {
        const res = FL.checkPlot(spec, p, FL.rowXY(T()[pg.n - 1], key));
        A.recordTry(pg.id, res.ok);
        if (res.ok) { d.ok = true; d.miss = null; G().n = Math.max(G().n || 0, pg.n); A.ui.fb = null; } else { A.recordMistake(res.mistake); d.miss = { x: Math.round(p.x), y: Math.round(p.y) }; A.ui.fb = { retry: true, msg: res.msg }; }
        A.save(); A.render();
      });
    },
    task(pg, d) {
      const x = A.tier === 'conceptual' ? 'speed' : A.tier === 'cp' ? 'a_c' : 'speed';
      const s = `<p class="launch-tag">Point ${pg.n} of ${N()}</p>` + A.title(`Plot Trial ${pg.n} on the graph.`);
      if (d.ok) return s + A.okNote(pg.n === N() ? LAST[A.tier] : 'That point is on your graph.') + A.actions(A.nextBtn());
      return s + `<p class="task-body">Use the column in your table that is marked. Find its ${x} along the bottom and its force up the side. Click that spot.${pg.n === 1 ? ' The dashed lines show the way for this first point.' : ''}</p>` + A.fbHTML() + A.actions();
    }
  };

  // ---------- A number question answered from the student's own table or graph ----------
  const BUILD = {
    factor2: () => FL.Q.factor(T(), 2), factor3: () => FL.Q.factor(T(), 3), pfactor: () => FL.Q.pfactor(T()), predictC: () => FL.Q.predictC(T()),
    predictCP: () => FL.Q.predictCP(rig()), massFromSlope: () => FL.Q.massFromSlope(G().slope, rig()), breakSpeed: () => FL.Q.breakSpeed(rig())
  };
  const OK = {
    factor2: () => 'Twice the speed took about 4 times the force. 4 = 2 × 2.',
    factor3: () => '3 times the speed took about 9 times the force. 9 = 3 × 3. Speed counts twice.',
    pfactor: () => 'Twice the speed needs 4 times the force, every time.',
    predictC: v => `Your prediction is ${FL.fmt(v)} N. Next you will test it.`,
    predictCP: v => `Your prediction is ${FL.fmt(v)} N. Next you will test it.`,
    massFromSlope: v => `Your graph says the puck has a mass of ${FL.fmt(FL.round(v, 3))} kg. Next you will check it on a scale.`,
    breakSpeed: v => `Your prediction: the string holds up to ${FL.fmt(FL.round(v, 2))} m/s. Next you will test it.`
  };
  const KEEP = {
    predictC: v => { A.state.predF = v; }, predictCP: v => { A.state.predF = v; },
    massFromSlope: v => { G().mass = FL.round(v, 3); }, breakSpeed: v => { A.state.predV = FL.round(v, 2); }
  };
  const slopeNote = () => `slope = ${FL.fmt(G().slope)}`;
  A.kinds.ask = {
    scene(pg) {
      if (pg.pic === 'graph') return A.graphScene(pg.q === 'massFromSlope' ? { note: `${slopeNote()}    r = ${FL.fmt(rig().r)} m` } : {});
      if (pg.q === 'breakSpeed') return A.labScene({ F: 0, limit: FL.DIAL.limit, boxes: [{ label: 'String limit', value: `${FL.DIAL.limit} N` }] });
      return A.labScene({ F: 0, boxes: [{ label: 'Speed to test', value: `${FL.TEST_SPEED} m/s` }] });
    },
    task: (pg, d) => A.qHTML(BUILD[pg.q](), d),
    bindTask(pg, d) { A.on('btnCheck', () => A.checkQ(BUILD[pg.q](), d, pg.id, { okMsg: OK[pg.q], onOk: KEEP[pg.q] })); },
    calc: (pg, d) => { const q = BUILD[pg.q](); return q.calc && !d.ok ? q : null; }
  };

  // ---------- Slope from two of the student's own points ----------
  const slopeUnit = () => (A.tier === 'cp' ? ['a_c', 'N per m/s²'] : ['v²', 'N per m²/s²']);
  const picked = d => (typeof d.a === 'number' && typeof d.b === 'number' ? [d.a, d.b].map(i => A.graphPts(A.graphKey(), N())[i]).sort((p, q) => p.x - q.x) : null);
  const slopeQ = d => { const [p, q] = picked(d); return FL.Q.slope(p, q, ...slopeUnit()); };
  A.kinds.slope = {
    enter(pg, d) { if (!d.q) d.q = {}; },
    scene(pg, d) {
      const pts = A.graphPts(A.graphKey(), N()), two = picked(d);
      pts.forEach(p => { if (p.i === d.a || p.i === d.b) { p.cls = 'fl-pt-new'; p.label = `(${FL.fmt(p.x)}, ${FL.fmt(p.y)})`; } });
      return A.graphScene({ points: pts, n: N(), fit: false, line: two || null, clickable: !two });
    },
    bindStage(pg, d) {
      if (picked(d)) return;
      const spec = FL.graphSpec(A.tier, rig(), A.graphKey()), pts = A.graphPts(A.graphKey(), N());
      document.querySelectorAll('#stage [data-pt]').forEach(c => c.addEventListener('click', e => {
        e.stopPropagation();
        const i = Number(c.dataset.pt);
        A.ui.fb = null;
        if (typeof d.a !== 'number') d.a = i;
        else if (i === d.a) delete d.a;
        else if (!FL.farApart(spec, pts[d.a], pts[i])) A.ui.fb = { retry: true, msg: 'Those two points are close together. Pick two that are far apart, so the slope is easier to trust.' };
        else d.b = i;
        A.save(); A.render();
      }));
    },
    task(pg, d) {
      if (!picked(d)) return A.title('Click two of your points that are far apart.') + '<p class="task-body">A line will be drawn through the two points you pick.</p>' + A.fbHTML() + A.actions();
      return A.qHTML(slopeQ(d), d.q, { extra: d.q.ok ? '' : '<button type="button" class="btn-ghost" id="btnRepick">Pick different points</button>' });
    },
    bindTask(pg, d) {
      A.on('btnRepick', () => { delete d.a; delete d.b; d.q = {}; A.ui.fb = null; A.ui.draft = ''; A.save(); A.render(); });
      A.on('btnCheck', () => A.checkQ(slopeQ(d), d.q, pg.id, {
        okMsg: v => `slope = ${FL.fmt(FL.round(v, 3))} ${slopeUnit()[1]}`,
        onOk: v => { G().pts = [d.a, d.b]; G().slope = FL.round(v, 3); }
      }));
    },
    calc: (pg, d) => (picked(d) && !d.q.ok ? slopeQ(d) : null)
  };

  // ---------- What the slope means: check the mass on a scale ----------
  const massQ = () => ({
    id: 'mass_is_slope', sym: 'm', unit: 'kg', own: true, target: G().slope, rel: 0.03, abs: 0.003, skill: 'graph',
    ask: 'Your graph is F against a_c, and F_net = m × a_c. So the slope of your line is the mass. What mass should a scale show?',
    formula: 'slope = F ÷ a_c = m', hints: ['Your slope is on the graph. A newton per m/s² is a kilogram.'],
    mistake: v => (FL.near(v, 1 / G().slope, 0.05) ? ['slope_flip', 'That is 1 ÷ slope. The slope itself is the mass.'] : ['mass_other', 'The slope of F against a_c is the mass. Use the slope you found.'])
  });
  A.kinds.weigh = {
    enter(pg, d) { if (!d.q) d.q = A.tier === 'cp' ? {} : { ok: true }; },
    scene: (pg, d) => (d.w ? A.labScene({ F: 0 }) : A.graphScene({ note: A.tier === 'cp' ? `${slopeNote()} N per m/s²` : `From your graph: m = ${FL.fmt(G().mass)} kg` })),
    task(pg, d) {
      const est = A.tier === 'cp' ? G().slope : G().mass, m = rig().m;
      if (!d.q.ok) return A.qHTML(massQ(), d.q);
      if (!d.w) return A.title('Now check it on a scale.') + `<p class="task-body">Your graph says the mass is ${FL.fmt(est)} kg.</p>` + A.actions('<button type="button" class="btn-primary" id="btnWeigh">⚖ Weigh the puck</button>');
      const pct = Math.round((100 * Math.abs(est - m)) / m);
      return A.title(`The scale shows ${FL.fmt(m)} kg. Your graph said ${FL.fmt(est)} kg.`)
        + A.note('fb-ok', pct <= 5 ? `<strong>Your graph found the mass</strong>, within ${Math.max(pct, 1)}%, without a scale.` : `That is ${pct}% apart. Small errors reading the dial change the slope a little.`) + A.actions(A.nextBtn());
    },
    bindTask(pg, d) {
      A.on('btnCheck', () => A.checkQ(massQ(), d.q, pg.id, { okMsg: v => `The scale should show about ${FL.fmt(v)} kg.` }));
      A.on('btnWeigh', () => { d.w = true; A.state.weighed = true; A.save(); A.render(); });
    }
  };

  // ---------- Period 0: change the bottom axis until the points line up ----------
  const AXIS_WHY = {
    v: 'These are the axes you started with. The points curve upward.',
    rootv: 'With √v on the bottom, the points curve upward even more.',
    inv: 'With 1 ÷ v on the bottom, the points fall as you go right, and they still curve.'
  };
  let axisNow = 'v';
  A.kinds.axis = {
    enter() { axisNow = 'v'; },
    scene: (pg, d) => A.graphScene({ xKey: d.ok ? 'v2' : axisNow, n: N(), fit: false }),
    ctl: (pg, d) => (d.ok ? '<span class="ctl-note">Bottom axis: v²</span>' : '<span class="ctl-note">Bottom axis:</span>' + ['v', 'v2', 'rootv', 'inv'].map(k => `<button type="button" class="btn-test ${k === axisNow ? 'on' : ''}" data-axis="${k}">${FL.AXES[k].sym}</button>`).join('')),
    bindStage() { document.querySelectorAll('#stageCtl [data-axis]').forEach(b => b.addEventListener('click', () => { axisNow = b.dataset.axis; A.ui.fb = null; A.renderStage(); A.renderTask(); })); },
    task(pg, d) {
      const s = A.title('Your points make a curve. Find axes that make them a straight line.');
      if (d.ok) return s + A.okNote('F against v² is a straight line through the origin. So F is proportional to v². Your table has a new row: v².') + A.actions(A.nextBtn());
      return s + '<p class="task-body">The buttons under the picture change what is on the bottom axis. When your points line up, press Check.</p>' + A.fbHTML() + A.actions(A.btn('btnCheck', 'Check: my points are straight', 'btn-primary', d.until));
    },
    bindTask(pg, d) {
      A.on('btnCheck', () => {
        if (d.ok || A.left(d.until)) return;
        const ok = axisNow === 'v2';
        A.recordTry(pg.id, ok);
        if (ok) { d.ok = true; G().xKey = 'v2'; A.ui.fb = null; } else {
          A.recordMistake(`axis_${axisNow}`); d.miss = (d.miss || 0) + 1; d.until = A.wait(Math.min(20, 4 + 4 * d.miss));
          A.ui.fb = { retry: true, msg: AXIS_WHY[axisNow] };
        }
        A.save(); A.render();
      });
    }
  };

  // ---------- On paper: the record that stays in the notebook ----------
  const B = '<span class="paper-blank"></span>';
  const PAPER = {
    conceptual: ['Copy your data table.', 'Sketch your graph. Show the shape of the curve.',
      `Finish with your own numbers: “From 2 m/s to 4 m/s, the force went from ${B} N to ${B} N. That is about ${B} times as big.”`,
      `“At 8 m/s I predicted ${B} N and measured ${B} N.”`],
    cp: ['Copy your data table.', 'Sketch your graph of F against a_c, with your line.',
      `Finish with your own numbers: “The slope of my line was ${B}. The scale showed ${B} kg.”`,
      `“At 8 m/s I predicted ${B} N and measured ${B} N.”`, 'In your own words: why is the slope the mass?'],
    honors: ['Copy your data table.', 'Sketch both graphs: F against v, and F against v².',
      `Finish with your own numbers: “My slope was ${B}, so m = ${B} kg. The scale showed ${B} kg.”`,
      `“The string held at ${B} m/s and snapped at ${B} m/s.”`, 'In your own words: why does v² on the bottom axis make a straight line?']
  };
  A.kinds.paper = {
    enter(pg, d) { if (!d.until) d.until = A.wait(20); },
    scene: () => A.graphScene({}),
    task: (pg, d) => A.title('Write it in your notebook.') + `<ol class="paper-list">${PAPER[A.tier].map(t => `<li>${t}</li>`).join('')}</ol>`
      + '<p class="task-body">Mr. Mudry may ask to see it.</p>' + A.actions(A.btn('btnNext', 'It is in my notebook ▶', 'btn-primary', d.until))
  };
})();

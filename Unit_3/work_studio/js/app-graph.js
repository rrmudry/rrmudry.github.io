// Mechanical Work Studio — the graph: plot your own points, then get answers out of your own graph and table.

(function () {
  const A = window.FLApp, { $ } = A, FL = window.FL, Scene = window.Scene;
  const rig = () => A.state.rig, G = () => A.state.graph, T = () => A.state.table;
  const N = () => FL.TRIALS[A.tier];
  const spec = () => FL.graphSpec(rig());

  A.graphPts = n => T().slice(0, n).map((row, i) => Object.assign(FL.rowXY(row), { i }));
  // The line on the graph: Periods 1–3 get a line through the origin once every point is down; the others draw it from two picked points.
  const lineFor = () => {
    if (A.tier === 'conceptual') return { slope: FL.along(rig()) };
    const pts = A.graphPts(N());
    return G().pts ? G().pts.map(i => pts[i]) : null;
  };
  // o = { n (points shown), fit: false (no line), …anything Scene.graph takes }
  A.graphScene = (o = {}) => {
    const n = o.n === undefined ? (G().n || 0) : o.n;
    const base = { spec: spec(), points: A.graphPts(n) };
    if (o.fit !== false && n >= N()) base.line = lineFor();
    return Scene.graph(Object.assign(base, o));
  };

  // ---------- Before plotting: drag each label onto an axis ----------
  // The drop slots carry the rule on the graph itself ("what you SET" along the bottom, "what CHANGED" up the side),
  // so a student who skips the words still sees what to do. d = { x, y (chip in each slot), ok, bad, until, miss }
  const CHIPS = {
    d: { label: 'distance, d (m)', tag: 'you SET this with the slider', cls: 'wk-d' },
    W: { label: 'work, W (J)', tag: 'the meter SHOWED this', cls: 'wk-W' }
  };
  const SLOT = { x: { x: 250, y: 482, w: 320, h: 38 }, y: { x: 8, y: 106, w: 40, h: 260 } };
  const HOME = { d: { x: 300, y: 196 }, W: { x: 520, y: 196 } };
  const chipSvg = (id, x, y, extra = '') => {
    const c = CHIPS[id];
    return `<g class="wk-chip ${c.cls}-chip" data-chip="${id}" transform="translate(${x} ${y})"${extra}><rect x="-104" y="-22" width="208" height="44" rx="10" class="wk-chip-box"/>`
      + `<text x="0" y="7" class="sv-text wk-chip-text" text-anchor="middle">${c.label}</text><text x="0" y="42" class="sv-text sv-small fl-dim" text-anchor="middle">${c.tag}</text></g>`;
  };
  function axesOverlay(d) {
    const X = SLOT.x, Y = SLOT.y, bad = d.bad && !d.ok;
    let s = `<g id="slotX" class="wk-slot ${bad ? 'wk-slot-bad' : ''}"><rect x="${X.x}" y="${X.y}" width="${X.w}" height="${X.h}" rx="9"/></g>`
      + `<g id="slotY" class="wk-slot ${bad ? 'wk-slot-bad' : ''}"><rect x="${Y.x}" y="${Y.y}" width="${Y.w}" height="${Y.h}" rx="9"/></g>`;
    const inX = d.x ? CHIPS[d.x] : null, inY = d.y ? CHIPS[d.y] : null;
    s += inX ? `<text x="${X.x + X.w / 2}" y="${X.y + 26}" class="sv-text wk-slot-fill ${inX.cls}-text" text-anchor="middle">${inX.label}</text>`
      : `<text x="${X.x + X.w / 2}" y="${X.y + 25}" class="sv-text wk-slot-text" text-anchor="middle">bottom: what you SET</text>`;
    s += `<text transform="translate(${Y.x + 26} ${Y.y + Y.h / 2}) rotate(-90)" class="sv-text ${inY ? `wk-slot-fill ${inY.cls}-text` : 'wk-slot-text'}" text-anchor="middle">${inY ? inY.label : 'side: what CHANGED'}</text>`;
    Object.keys(CHIPS).filter(id => d.x !== id && d.y !== id).forEach(id => { s += chipSvg(id, HOME[id].x, HOME[id].y); });
    return s;
  }
  const inSlot = (p, k) => { const r = SLOT[k], m = 28; return p.x > r.x - m && p.x < r.x + r.w + m && p.y > r.y - m && p.y < r.y + r.h + m; };

  A.kinds.axes = {
    enter(pg, d) { if (d.bad && !d.ok) A.ui.fb = { retry: true, msg: d.bad }; },
    scene(pg, d) {
      const sp = spec();
      if (d.ok) return Scene.graph({ spec: sp, points: [] });
      sp.x = Object.assign({}, sp.x, { label: '' }); sp.y = Object.assign({}, sp.y, { label: '' });
      return A.inject(Scene.graph({ spec: sp, points: [], hideNums: true }), axesOverlay(d));
    },
    bindStage(pg, d) {
      if (d.ok || d.bad) return;
      const svg = $('stage').querySelector('svg');
      if (!svg) return;
      let drag = null, picked = null;
      const place = (id, k) => {
        const other = k === 'x' ? 'y' : 'x';
        if (d[other] === id) delete d[other];
        d[k] = id; A.ui.fb = null;
        if (d.x && d.y) return check();
        A.save(); A.renderStage(); A.renderTask();
      };
      svg.addEventListener('pointerdown', e => {
        const chip = e.target.closest && e.target.closest('[data-chip]');
        const p = A.scenePoint(e);
        if (!chip) {   // a tap on a slot after tapping a chip
          if (picked && p) { const k = inSlot(p, 'x') ? 'x' : inSlot(p, 'y') ? 'y' : null; if (k) place(picked, k); }
          return;
        }
        drag = { id: chip.dataset.chip, el: chip, start: p, moved: false };
        try { svg.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
        e.preventDefault();
      });
      svg.addEventListener('pointermove', e => {
        if (!drag) return;
        const p = A.scenePoint(e); if (!p) return;
        if (Math.hypot(p.x - drag.start.x, p.y - drag.start.y) > 6) drag.moved = true;
        const h = HOME[drag.id];
        drag.el.setAttribute('transform', `translate(${h.x + p.x - drag.start.x} ${h.y + p.y - drag.start.y})`);
        $('slotX').classList.toggle('wk-slot-hot', inSlot(p, 'x')); $('slotY').classList.toggle('wk-slot-hot', inSlot(p, 'y'));
      });
      svg.addEventListener('pointerup', e => {
        if (!drag) return;
        const p = A.scenePoint(e), id = drag.id, moved = drag.moved;
        drag = null;
        const k = p && moved ? (inSlot(p, 'x') ? 'x' : inSlot(p, 'y') ? 'y' : null) : null;
        if (k) return place(id, k);
        if (!moved) { picked = id; document.querySelectorAll('#stage [data-chip]').forEach(c => c.classList.toggle('wk-chip-picked', c.dataset.chip === id)); return; }
        A.renderStage();   // dropped somewhere else: back home
      });
    },
    task(pg, d) {
      const s = A.title('Drag each label onto an axis.')
        + '<p class="task-body">Look at the gray boxes on the graph: they tell you which goes where.</p>';
      if (d.ok) return s + A.okNote('<span class="wk-d-text">Distance</span> goes along the bottom (x) because <strong>you set it</strong>. <span class="wk-W-text">Work</span> goes up the side (y) because <strong>it changed when the distance changed</strong>: work depends on distance. Each trial becomes one point.') + A.actions(A.nextBtn());
      if (d.bad) return s + A.note('fb-retry', d.bad) + A.actions(A.btn('btnRetry', 'Try again', 'btn-primary', d.until));
      return s + A.fbHTML() + A.actions();
    },
    bindTask(pg, d) {
      A.on('btnRetry', () => { if (A.left(d.until)) return; delete d.x; delete d.y; d.bad = null; A.ui.fb = null; A.save(); A.render(); });
    }
  };
  function check() {
    const d = A.d(), ok = d.x === 'd' && d.y === 'W';
    A.recordTry('g_axes', ok);
    if (ok) { d.ok = true; d.bad = null; A.ui.fb = null; } else {
      A.recordMistake('axes_swapped');
      d.miss = (d.miss || 0) + 1; d.until = A.wait(4 + 3 * d.miss);
      d.bad = 'Swapped. You SET the distance with the slider before each pull, so it goes along the bottom. The work CHANGED because of the distance, so it goes up the side.';
    }
    A.save(); A.render();
  }

  // ---------- Plot one trial ----------
  A.kinds.plot = {
    scene(pg, d) {
      const pts = A.graphPts(Math.max(G().n || 0, d.ok ? pg.n : 0));
      if (d.ok && pts[pg.n - 1]) pts[pg.n - 1].cls = 'fl-pt-new';
      const target = FL.rowXY(T()[pg.n - 1]);
      return A.graphScene({ points: pts, n: pts.length, guide: pg.n === 1 && !d.ok ? target : null, miss: d.ok ? null : d.miss || null, clickable: !d.ok });
    },
    bindStage(pg, d) {
      if (d.ok) return;
      A.onStageClick(p => {
        const res = FL.checkPlot(spec(), p, FL.rowXY(T()[pg.n - 1]));
        A.recordTry(pg.id, res.ok);
        if (res.ok) { d.ok = true; d.miss = null; G().n = Math.max(G().n || 0, pg.n); A.ui.fb = null; } else { A.recordMistake(res.mistake); d.miss = { x: Math.round(p.x), y: Math.round(p.y) }; A.ui.fb = { retry: true, msg: res.msg }; }
        A.save(); A.render();
      });
    },
    task(pg, d) {
      const s = `<p class="launch-tag">Point ${pg.n} of ${N()}</p>` + A.title(`Plot Trial ${pg.n} on the graph.`);
      const last = A.tier === 'conceptual'
        ? 'Look at your points: they fall on a straight line that starts at 0. The line is drawn for you now.'
        : 'Look at your points: they fall close to one straight line that starts at 0.';
      if (d.ok) return s + A.okNote(pg.n === N() ? last : 'That point is on your graph.') + A.actions(A.nextBtn());
      return s + `<p class="task-body">Use the marked column in your table. Find its <span class="wk-d-text">distance</span> on the x-axis (bottom) and its <span class="wk-W-text">work</span> on the y-axis (side). Click where they meet.${pg.n === 1 ? ' The dashed lines show the way for this first point.' : ''}</p>` + A.fbHTML() + A.actions();
    }
  };

  // ---------- A number question answered from the student's own table or graph ----------
  const BUILD = {
    factor2: () => FL.Q.factor(T(), 1, 2, 2),
    factor3: () => FL.Q.factor(T(), 1, 3, 3),
    pfactor: () => FL.Q.pfactor(T()),
    predictC: () => FL.Q.predictC(T()),
    readLine: () => FL.Q.readLine(G().readX || (G().readX = FL.readSpot(T())), A.tier === 'conceptual' ? FL.along(rig()) : G().slope, spec()),
    parallel: () => FL.Q.parallel(rig()),
    predict: () => FL.Q.predict(G().slope, rig(), A.tier)
  };
  const OK = {
    factor2: () => 'Twice the distance took twice the work.',
    factor3: () => '3 times the distance took 3 times the work. Work grows in step with distance.',
    pfactor: () => 'Twice the distance takes twice the work, every time.',
    predictC: v => `Your prediction is ${FL.fmt(v)} J. Next you will test it.`,
    predict: v => `Your prediction is ${FL.fmt(FL.round(v, 1))} J. Next you will test it.`,
    readLine: v => `Your line says about ${FL.fmt(FL.round(v, 0))} J. A graph answers questions about distances you never tried.`,
    parallel: v => `F × cos θ = ${FL.fmt(FL.round(v, 1))} N. Compare it with your slope, ${FL.fmt(G().slope)} J per m: they match. Only the part of the pull along the motion does work.`
  };
  const KEEP = { predictC: v => { A.state.predW = v; }, predict: v => { A.state.predW = FL.round(v, 1); } };
  const slopeNote = () => `slope = ${FL.fmt(G().slope)} J per m`;
  const LAB_NOTE = {
    parallel: () => [{ label: 'Your slope', value: `${FL.fmt(G().slope)} J/m` }],
    predict: () => [{ label: 'Distance to test', value: `${FL.fmt(FL.TEST_D[A.tier])} m` }, { label: 'Your slope', value: `${FL.fmt(G().slope)} J/m` }],
    predictC: () => [{ label: 'Distance to test', value: `${FL.fmt(FL.TEST_D.conceptual)} m` }]
  };
  const isPrediction = pg => pg.q === 'predict' || pg.q === 'predictC';
  // The prediction question, for the test page to explain a miss
  A.predictionQ = () => (A.tier === 'conceptual' ? FL.Q.predictC(T()) : FL.Q.predict(G().slope, rig(), A.tier));
  A.kinds.ask = {
    enter(pg, d) {
      if (pg.pic === 'lab') A.showPulled(pg.q === 'parallel' ? T()[T().length - 1].set : 0);
    },
    scene(pg) {
      if (pg.pic === 'graph') {
        const opts = {};
        if (pg.q === 'readLine') {
          opts.readX = G().readX || (G().readX = FL.readSpot(T()));
          if (A.tier !== 'conceptual') opts.note = slopeNote();
        }
        return A.graphScene(opts);
      }
      return A.labScene({ boxes: LAB_NOTE[pg.q] ? LAB_NOTE[pg.q]() : [] });
    },
    // A prediction is not graded here: it is locked in, and the pull on the next page checks it.
    task(pg, d) {
      const q = BUILD[pg.q]();
      if (!isPrediction(pg)) return A.qHTML(q, d);
      if (d.ok) return A.title(q.ask) + A.answerBox(q, true, FL.fmt(d.val)) + A.note('fb-ok', `<strong>Prediction locked in: ${FL.fmt(d.val)} J.</strong> Next, pull the crate and see if the meter agrees.`) + A.actions(A.nextBtn());
      return A.qHTML(q, d);
    },
    bindTask(pg, d) {
      A.on('btnCheck', () => {
        if (!isPrediction(pg)) return A.checkQ(BUILD[pg.q](), d, pg.id, { okMsg: OK[pg.q], onOk: KEEP[pg.q] });
        const v = FL.parseNum(A.ui.draft);
        if (v === null) { A.ui.fb = { retry: true, msg: 'Use the calculator, then press "Use calculator answer".' }; return A.renderTask(); }
        d.ok = true; d.val = FL.round(v, 1); if (A.ui.work) d.work = A.ui.work;
        A.state.predW = d.val; A.ui.fb = null; A.ui.draft = ''; A.ui.work = null;
        if (A.clearCalc) A.clearCalc();
        A.d('g_test').step = 'go';   // a new prediction gets a fresh test
        A.save(); A.render();
      });
    },
    calc: (pg, d) => { const q = BUILD[pg.q](); return q.calc && !d.ok ? q : null; }
  };

  // ---------- Slope from two of the student's own points ----------
  const picked = d => (typeof d.a === 'number' && typeof d.b === 'number' ? [d.a, d.b].map(i => A.graphPts(N())[i]).sort((p, q) => p.x - q.x) : null);
  const slopeQ = d => { const [p, q] = picked(d); return FL.Q.slope(p, q); };
  A.kinds.slope = {
    enter(pg, d) { if (!d.q) d.q = {}; },
    scene(pg, d) {
      const pts = A.graphPts(N()), two = picked(d);
      pts.forEach(p => { if (p.i === d.a || p.i === d.b) { p.cls = 'fl-pt-new'; p.label = `(${FL.fmt(p.x)} m, ${FL.fmt(p.y)} J)`; } });
      return A.graphScene({ points: pts, n: N(), fit: false, line: two || null, showTriangle: !!two, clickable: !two });
    },
    bindStage(pg, d) {
      if (picked(d)) return;
      const pts = A.graphPts(N());
      document.querySelectorAll('#stage [data-pt]').forEach(c => c.addEventListener('click', e => {
        e.stopPropagation();
        const i = Number(c.dataset.pt);
        A.ui.fb = null;
        if (typeof d.a !== 'number') d.a = i;
        else if (i === d.a) delete d.a;
        else if (!FL.farApart(spec(), pts[d.a], pts[i])) {
          const anyFar = pts.some(p => p.i !== d.a && FL.farApart(spec(), pts[d.a], p));
          A.ui.fb = { retry: true, msg: anyFar
            ? 'Those two points are close together. Pick two that are far apart, so the slope is easier to trust.'
            : 'No other point is far enough from this one. Click it again or tap Pick a different point, then choose two points near opposite ends.' };
        }
        else d.b = i;
        A.save(); A.render();
      }));
    },
    task(pg, d) {
      if (!picked(d)) {
        const hasA = typeof d.a === 'number';
        const clearBtn = hasA ? '<button type="button" class="btn-ghost" id="btnClearPick">Pick a different point</button>' : '';
        const body = hasA
          ? 'First point selected. Click a second point far away from it, or click it again to unselect.'
          : 'A line will be drawn through the two points you pick. Their numbers appear next to them.';
        return A.title('Click two of your points that are far apart.') + `<p class="task-body">${body}</p>` + A.fbHTML() + A.actions(clearBtn);
      }
      return A.qHTML(slopeQ(d), d.q, { extra: d.q.ok ? '' : '<button type="button" class="btn-ghost" id="btnRepick">Pick different points</button>' });
    },
    bindTask(pg, d) {
      A.on('btnClearPick', () => { delete d.a; A.ui.fb = null; A.save(); A.render(); });
      A.on('btnRepick', () => { delete d.a; delete d.b; d.q = {}; A.ui.fb = null; A.ui.draft = ''; A.save(); A.render(); });
      A.on('btnCheck', () => A.checkQ(slopeQ(d), d.q, pg.id, {
        okMsg: v => `slope = ${FL.fmt(FL.round(v, 2))} J per m`,
        onOk: v => { G().pts = [d.a, d.b]; G().slope = FL.round(v, 3); }
      }));
    },
    calc: (pg, d) => (picked(d) && !d.q.ok ? slopeQ(d) : null)
  };

  // ---------- What the slope means: compare it with the spring scale ----------
  A.kinds.match = {
    enter(pg, d) { if (!d.q) d.q = A.tier === 'cp' ? {} : { ok: true }; if (d.seen) A.showPulled(T()[0].set); },
    scene: (pg, d) => (d.seen ? A.labScene({ boxes: [{ label: 'Your slope', value: `${FL.fmt(G().slope)} J/m` }] }) : A.graphScene({ note: slopeNote() })),
    task(pg, d) {
      const s = G().slope, F = rig().F;
      if (!d.q.ok) return A.qHTML(FL.Q.slopeForce(s), d.q);
      if (!d.seen) {
        const ask = A.tier === 'cp' ? `Your graph says the rope pulled with ${FL.fmt(s)} N.` : `Your slope is ${FL.fmt(s)} J per m. If the slope were the whole pull, the spring scale would read ${FL.fmt(s)} N.`;
        return A.title('Now check it against the spring scale.') + `<p class="task-body">${ask} Press the button to look at the spring scale again.</p>` + A.actions('<button type="button" class="btn-primary" id="btnLook">🔍 Look at the spring scale</button>');
      }
      if (A.tier === 'cp') {
        const pct = Math.round((100 * Math.abs(s - F)) / F);
        return A.title(`The spring scale reads ${FL.fmt(F)} N. Your slope is ${FL.fmt(s)} J per m.`)
          + A.note('fb-ok', pct <= 4 ? `<strong>Your graph found the force</strong>, within ${Math.max(pct, 1)}%. The slope of W against d is the force: W = F × d.` : `They are ${pct}% apart. Small reading errors change the slope a little. The slope of W against d is still the force.`) + A.actions(A.nextBtn());
      }
      return A.title(`The spring scale reads ${FL.fmt(F)} N, but your slope is only ${FL.fmt(s)} J per m.`)
        + A.note('fb-retry', `The rope pulls at θ = ${rig().theta}°: partly forward, partly up. The upward part does not move the crate along the track, so it does no work. Next you will find the forward part.`) + A.actions(A.nextBtn());
    },
    bindTask(pg, d) {
      A.on('btnCheck', () => A.checkQ(FL.Q.slopeForce(G().slope), d.q, pg.id, { okMsg: v => `Your slope says F = ${FL.fmt(v)} N.` }));
      A.on('btnLook', () => { d.seen = true; A.showPulled(T()[0].set); A.save(); A.render(); });
    }
  };
})();

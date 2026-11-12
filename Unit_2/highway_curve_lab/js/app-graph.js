// Highway Curve Lab — the graph: plot your own points, then get answers out of your own graph and table.
//   conceptual: fastest safe speed for each road (car = circle, truck = square)
//   cp:         friction needed against speed, with each road's grip limit as a dashed line
//   honors:     v_max against μ, then straightened with v_max²

(function () {
  const A = window.FLApp, FL = window.FL, Scene = window.Scene;
  const G = () => A.state.graph, T = () => A.state.table;
  const N = () => FL.TRIALS[A.tier];

  A.graphKey = () => G().yKey || 'vmax';
  A.graphPts = (key, n) => T().slice(0, n).map((row, i) => Object.assign(FL.rowXY(A.tier, row, key), { i }));
  const LIMIT_LABEL = s => `${FL.SURF[s].icon} ${FL.SURF[s].name} grip limit`;
  // o = { yKey, n (points shown), fit: false, limits: [...surf ids], …anything Scene.graph takes }
  A.graphScene = (o = {}) => {
    const key = o.yKey || A.graphKey(), n = o.n === undefined ? (G().n || 0) : o.n;
    const base = { spec: FL.graphSpec(A.tier, key), points: A.graphPts(key, n), legend: A.tier === 'conceptual' };
    // Conceptual: once the truck on ice has been tested, its column joins the graph, marked as the tested prediction
    if (A.tier === 'conceptual' && n >= N() && A.state.found.icy !== undefined && !o.points) base.points.push({ x: 2 + FL.SLOT, y: A.state.found.icy, veh: 'truck', cls: 'hc-bar-tested', label: 'tested' });
    if (A.tier === 'cp' && n >= N() && o.fit !== false) {
      base.curve = FL.fitK(T());
      base.limits = (o.limits || ['dry', 'wet', 'icy']).filter(s => A.state.limits[s] !== undefined).map(s => ({ kN: A.state.limits[s], label: LIMIT_LABEL(s) }));
      base.marks = ['dry', 'wet', 'icy'].filter(s => G()[`cross_${s}`]).map(s => ({ x: G()[`cross_${s}`], y: A.state.limits[s] }));
    }
    if (A.tier === 'honors' && G().pts && key === 'vmax2' && o.fit !== false && n >= N()) base.line = G().pts.map(i => base.points[i]);
    delete o.limits;
    return Scene.graph(Object.assign(base, o));
  };

  // ---------- Plot one trial ----------
  const LAST = {
    conceptual: 'Look at the heights. Rain and ice pull the fastest safe speed down. Compare the car and truck columns.',
    cp: 'Your points curve upward: a little faster needs a lot more friction.',
    honors: 'Your points curve. The fastest speed grows more and more slowly as μ grows.'
  };
  A.kinds.plot = {
    scene(pg, d) {
      const key = A.graphKey(), pts = A.graphPts(key, Math.max(G().n || 0, d.ok ? pg.n : 0));
      if (d.ok && pts[pg.n - 1]) pts[pg.n - 1].cls = 'fl-pt-new';
      const target = FL.rowXY(A.tier, T()[pg.n - 1], key);
      return A.graphScene({ points: pts, n: pts.length, guide: pg.n === 1 && !d.ok && A.tier !== 'conceptual' ? target : null, miss: d.ok ? null : d.miss || null, clickable: !d.ok, fit: false });
    },
    bindStage(pg, d) {
      if (d.ok) return;
      const key = A.graphKey(), spec = FL.graphSpec(A.tier, key);
      A.onStageClick(p => {
        const res = FL.checkPlot(spec, p, FL.rowXY(A.tier, T()[pg.n - 1], key));
        A.recordTry(pg.id, res.ok);
        if (res.ok) { d.ok = true; d.miss = null; G().n = Math.max(G().n || 0, pg.n); A.ui.fb = null; } else { A.recordMistake(res.mistake); d.miss = { x: Math.round(p.x), y: Math.round(p.y) }; A.ui.fb = { retry: true, msg: res.msg }; }
        A.save(); A.render();
      });
    },
    task(pg, d) {
      const s = `<p class="launch-tag">Point ${pg.n} of ${N()}</p>` + A.title(`Plot Trial ${pg.n} on the graph.`);
      if (d.ok) return s + A.okNote(pg.n === N() ? LAST[A.tier] : 'That point is on your graph.') + A.actions(A.nextBtn());
      const how = {
        conceptual: `Use the marked column in your table. Find its road, then the ${T()[pg.n - 1].veh === 'truck' ? '🚚 truck slot (right)' : '🚗 car slot (left)'}. Click at its speed to build the column.`,
        cp: `Use the marked column. Find its speed along the bottom and its friction up the side. Click that spot.${pg.n === 1 ? ' The dashed lines show the way.' : ''}`,
        honors: `Use the marked column. Find its μ along the bottom and its v_max up the side. Click that spot.${pg.n === 1 ? ' The dashed lines show the way.' : ''}`
      }[A.tier];
      return s + `<p class="task-body">${how}</p>` + A.fbHTML() + A.actions();
    }
  };

  // ---------- A number question answered from the student's own table or graph ----------
  const BUILD = {
    half: () => FL.Q.half(T()), truckDiff: () => FL.Q.truckDiff(T()), predictTruck: () => FL.Q.predictTruck(T()),
    radius: () => FL.Q.radius(G().slope), predictGravel: () => FL.Q.predictGravel(G().slope)
  };
  const OK = {
    half: () => 'Ice has a quarter of the grip, and the fastest safe speed is cut in half.',
    truckDiff: () => 'The heavy truck has the same fastest safe speed as the car.',
    predictTruck: v => `Your prediction is ${FL.fmt(v)} m/s. Next you will test it.`,
    radius: v => `Your graph says the curve has a radius of about ${FL.fmt(FL.round(v, 1))} m. The radius label is now on the 3D curve.`,
    predictGravel: v => `Your prediction: ${FL.fmt(FL.round(v, 2))} m/s on gravel. Next you will test it.`
  };
  const KEEP = {
    predictTruck: v => { A.state.predV = v; }, predictGravel: v => { A.state.predV = FL.round(v, 2); },
    radius: v => { G().rFound = FL.round(v, 1); A.state.rShown = true; }
  };
  A.kinds.ask = {
    scene: pg => A.graphScene(pg.q === 'radius' ? { note: `slope = ${FL.fmt(G().slope)} m²/s²` } : pg.q === 'predictGravel' ? { note: `slope = ${FL.fmt(G().slope)} m²/s²    gravel: μ = 0.4` } : {}),
    task: (pg, d) => A.qHTML(BUILD[pg.q](), d),
    bindTask(pg, d) { A.on('btnCheck', () => A.checkQ(BUILD[pg.q](), d, pg.id, { okMsg: OK[pg.q], onOk: KEEP[pg.q] })); },
    calc: (pg, d) => { const q = BUILD[pg.q](); return q.calc && !d.ok ? q : null; }
  };

  // ---------- CP: click where your curve crosses a road's grip line ----------
  A.kinds.cross = {
    scene: (pg, d) => A.graphScene({ limits: ['dry', 'wet', 'icy'], clickable: !d.ok, miss: d.ok ? null : d.miss || null }),
    bindStage(pg, d) {
      if (d.ok) return;
      const spec = FL.graphSpec('cp'), k = FL.fitK(T()), lim = A.state.limits[pg.surf];
      A.onStageClick(p => {
        if (A.left(d.until)) return;
        const res = FL.checkCross(spec, p, k, lim);
        A.recordTry(pg.id, res.ok);
        if (res.ok) { d.ok = true; d.miss = null; G()[`cross_${pg.surf}`] = res.v; A.ui.fb = null; } else { A.recordMistake(res.mistake); d.miss = { x: Math.round(p.x), y: Math.round(p.y) }; d.n = (d.n || 0) + 1; d.until = d.n > 2 ? A.wait(4) : 0; A.ui.fb = { retry: true, msg: res.msg }; }
        A.save(); A.render();
      });
    },
    task(pg, d) {
      const name = FL.SURF[pg.surf].name.toLowerCase();
      const s = A.title(`Click where your curve crosses the ${name} grip line.`);
      if (d.ok) return s + A.okNote(`Your graph says the fastest safe speed on a ${name} road is about <span class="nowrap">${FL.fmt(G()[`cross_${pg.surf}`])} m/s</span>. Any faster needs more friction than the road can give.`) + A.actions(A.nextBtn());
      return s + '<p class="task-body">Past that point the car needs more friction than the road has.</p>' + A.fbHTML() + A.actions();
    }
  };

  // ---------- Honors: change the side axis until the points line up ----------
  const AXIS_WHY = {
    vmax: 'These are the axes you started with. The points curve.',
    rootv: 'With √v_max up the side, the points bend even more.'
  };
  let axisNow = 'vmax';
  A.kinds.axis = {
    enter() { axisNow = 'vmax'; },
    scene: (pg, d) => A.graphScene({ yKey: d.ok ? 'vmax2' : axisNow, n: N(), fit: false }),
    ctl: (pg, d) => (d.ok ? '<span class="ctl-note">Side axis: v_max²</span>' : '<span class="ctl-note">Side axis:</span>' + ['vmax', 'vmax2', 'rootv'].map(k => `<button type="button" class="btn-test ${k === axisNow ? 'on' : ''}" data-axis="${k}">${window.subHTML(FL.AX[k].sym)}</button>`).join('')),
    bindStage() { document.querySelectorAll('#stageCtl [data-axis]').forEach(b => b.addEventListener('click', () => { axisNow = b.dataset.axis; A.ui.fb = null; A.renderStage(); A.renderTask(); })); },
    task(pg, d) {
      const s = A.title('Your points make a curve. Change the side axis until they line up.');
      if (d.ok) return s + A.okNote('v_max² against μ is a straight line through the origin. So v_max² is proportional to μ.') + A.actions(A.nextBtn());
      return s + '<p class="task-body">The buttons under the picture change the side axis. Then press Check.</p>' + A.fbHTML() + A.actions(A.btn('btnCheck', 'Check: my points are straight', 'btn-primary', d.until));
    },
    bindTask(pg, d) {
      A.on('btnCheck', () => {
        if (d.ok || A.left(d.until)) return;
        const ok = axisNow === 'vmax2';
        A.recordTry(pg.id, ok);
        if (ok) { d.ok = true; G().yKey = 'vmax2'; A.ui.fb = null; } else {
          A.recordMistake(`axis_${axisNow}`); d.miss = (d.miss || 0) + 1; d.until = A.wait(Math.min(20, 4 + 4 * d.miss));
          A.ui.fb = { retry: true, msg: AXIS_WHY[axisNow] };
        }
        A.save(); A.render();
      });
    }
  };

  // ---------- Honors: slope from two of the student's own points ----------
  const picked = d => (typeof d.a === 'number' && typeof d.b === 'number' ? [d.a, d.b].map(i => A.graphPts('vmax2', N())[i]).sort((p, q) => p.x - q.x) : null);
  const slopeQ = d => { const [p, q] = picked(d); return FL.Q.slope(p, q); };
  A.kinds.slope = {
    enter(pg, d) { if (!d.q) d.q = {}; },
    scene(pg, d) {
      const pts = A.graphPts('vmax2', N()), two = picked(d);
      pts.forEach(p => { if (p.i === d.a || p.i === d.b) { p.cls = 'fl-pt-new'; p.label = `(${FL.fmt(p.x)}, ${FL.fmt(p.y)})`; } });
      return A.graphScene({ yKey: 'vmax2', points: pts, n: N(), fit: false, line: two || null, clickable: !two });
    },
    bindStage(pg, d) {
      if (picked(d)) return;
      const spec = FL.graphSpec('honors', 'vmax2'), pts = A.graphPts('vmax2', N());
      document.querySelectorAll('#stageSvg [data-pt]').forEach(c => c.addEventListener('click', e => {
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
      if (!picked(d)) return A.title('Click two of your points that are far apart.') + '<p class="task-body">A line will go through the two points you pick.</p>' + A.fbHTML() + A.actions();
      return A.qHTML(slopeQ(d), d.q, { extra: d.q.ok ? '' : '<button type="button" class="btn-ghost" id="btnRepick">Pick different points</button>' });
    },
    bindTask(pg, d) {
      A.on('btnRepick', () => { delete d.a; delete d.b; d.q = {}; A.ui.fb = null; A.ui.draft = ''; A.save(); A.render(); });
      A.on('btnCheck', () => A.checkQ(slopeQ(d), d.q, pg.id, {
        okMsg: v => `slope = ${FL.fmt(FL.round(v, 1))} m²/s²`,
        onOk: v => { G().pts = [d.a, d.b]; G().slope = FL.round(v, 1); }
      }));
    },
    calc: (pg, d) => (picked(d) && !d.q.ok ? slopeQ(d) : null)
  };
})();

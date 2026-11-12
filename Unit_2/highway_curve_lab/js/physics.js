// Highway Curve Lab — physics, the instruments, data checks, graph checks and showing work.
// The big idea: on a flat curve, friction from the road is the only force that turns the car. It points to the center.
// The friction needed is F = m × v² ÷ r. The most the road can give is F_max = μ × m × g. Too fast, and the car slides
// off in a straight line along the tangent. Setting the two equal gives v_max = √(μ × g × r): mass cancels.
//   conceptual (P1–3): finds the fastest safe speed for each road and vehicle by testing. Reads the pattern. No division.
//   cp (P4–6):         reads the friction gauge at 5 speeds, graphs F against v, and reads where it crosses each road's limit.
//   honors (P0):       finds v_max for 5 road surfaces, straightens v_max against μ with v_max², and gets g × r from the slope.
// Every wrong answer is compared against known mistakes, so the student hears WHY. Mistake ids feed the teacher monitor.

(function () {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
  function fmt(v) {
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    return Math.abs(v) < 10 ? String(round(v, 2)) : String(round(v, 1));
  }
  const near = (v, target, rel = 0.02, abs = 0.05) => Math.abs(v - target) <= Math.max(Math.abs(target) * rel, abs);
  function parseNum(raw) {
    const v = parseFloat(String(raw).replace(',', '.').replace(/[−–]/g, '-').replace(/[^0-9.\-eE]/g, ''));
    return isFinite(v) ? v : null;
  }

  // ---------- The road, the vehicles and the curve ----------
  const G = 10;   // m/s²
  const SURF = {
    dry: { id: 'dry', name: 'Dry', icon: '☀️', mu: 0.8 },
    damp: { id: 'damp', name: 'Damp', icon: '🌦️', mu: 0.6 },
    wet: { id: 'wet', name: 'Wet', icon: '🌧️', mu: 0.5 },
    gravel: { id: 'gravel', name: 'Gravel', icon: '🪨', mu: 0.4 },
    snow: { id: 'snow', name: 'Packed snow', icon: '🌨️', mu: 0.3 },
    icy: { id: 'icy', name: 'Icy', icon: '❄️', mu: 0.2 },
    glare: { id: 'glare', name: 'Glare ice', icon: '🧊', mu: 0 }
  };
  const VEH = {
    car: { id: 'car', name: 'Sports car', icon: '🚗', m: 1000 },
    truck: { id: 'truck', name: 'Cargo truck', icon: '🚚', m: 4000 }
  };
  // Each student gets their own off-ramp, so two Chromebooks side by side never show the same numbers.
  // r = 2k² keeps the dry (μ = 0.8) and icy (μ = 0.2) limits on whole numbers: 16/8, 20/10, 24/12 m/s.
  const RADII = [32, 50, 72];
  const newRig = () => ({ r: pick(RADII) });
  // Each lane is 4.5 m wide. r is the outer lane, where the car normally drives; the inner lane is 4.5 m tighter.
  const LANE = 4.5;
  const innerR = r => r - LANE;

  const fNeed = (m, v, r) => (m * v * v) / r;                     // newtons
  const fMax = (mu, m) => mu * m * G;                              // newtons
  const vMax = (mu, r) => Math.sqrt(mu * G * r);
  const grips = (mu, v, r) => v * v <= mu * G * r * (1 + 1e-9);   // right at the limit still holds
  const safeSpeed = (mu, r, step = 1) => Math.floor(vMax(mu, r) / step + 1e-9) * step;
  const MPH = 2.23694;
  const mph = v => v * MPH;

  // ---------- Instruments ----------
  // The tire grip gauge reads the friction the road gives, in kilonewtons. The red mark is the grip limit, μ × m × g.
  // A truck is 4 times as heavy, so its gauge has 4 times the range: the needle sits at the same angle at the same speed.
  const GAUGE = {
    car: { max: 10, label: 2, mid: 1, minor: 0.5, tol: 0.3, tight: 0.15 },
    truck: { max: 40, label: 10, mid: 5, minor: 1, tol: 1, tight: 0.5 }
  };
  const SPEEDO = { max: 30, label: 5, minor: 1, mphMax: 65, mphLabel: 10, mphMinor: 2 };
  // What the gauge shows during a run: the friction needed, or the limit while the tires are slipping
  const gaugeKN = (mu, m, v, r) => Math.min(fNeed(m, v, r), fMax(mu, m)) / 1000;

  // A gauge reading against the simulation. Never says the value or which way to go.
  function checkGauge(raw, kN, veh, o = {}) {
    const x = parseNum(raw), g = GAUGE[veh];
    if (x === null) return { ok: false, mistake: 'blank', msg: 'Read the tire grip gauge and type the number.' };
    const onMark = Math.abs(kN / g.minor - Math.round(kN / g.minor)) < 0.02;
    if (Math.abs(x - kN) <= (onMark ? g.tight : g.tol) + 1e-9) return { ok: true };
    if (o.v !== undefined && Math.abs(x - o.v) < 0.051) return { ok: false, mistake: 'read_speed', msg: 'That is the speed. The friction is on the tire grip gauge. Read where the needle points.' };
    if (near(x, kN * 1000, 0.03)) return { ok: false, mistake: 'read_newtons', msg: 'The gauge is in kilonewtons (kN). Type the number the needle points to.' };
    if (o.limit !== undefined && !o.wantLimit && Math.abs(x - o.limit) <= g.tight && Math.abs(kN - o.limit) > g.tol) return { ok: false, mistake: 'read_limit', msg: 'That is the red grip limit mark. Read the needle instead.' };
    if (o.wantLimit && o.needle !== undefined && Math.abs(x - o.needle) <= g.tol && Math.abs(kN - o.needle) > g.tol) return { ok: false, mistake: 'read_needle', msg: 'That is the needle. The grip limit is the red mark on the gauge.' };
    if (Math.abs(x - kN) <= g.label * 1.25) return { ok: false, mistake: 'read_close', msg: `Close. Find the last numbered mark, then count the small marks. Each small mark is ${fmt(g.minor)} kN on this gauge.` };
    return { ok: false, mistake: 'read_far', msg: `That does not match the gauge. Find the two numbers it is between. Each small mark is ${fmt(g.minor)} kN.` };
  }
  // mph read from the inner scale of the speedometer
  function checkMph(raw, v) {
    const x = parseNum(raw), want = mph(v);
    if (x === null) return { ok: false, mistake: 'blank', msg: 'Read the inner mph scale of the speedometer and type the number.' };
    if (Math.abs(x - want) <= 1.6) return { ok: true };
    if (Math.abs(x - v) < 0.6) return { ok: false, mistake: 'mph_ms', msg: 'That is the speed in m/s, on the outer scale. Read the inner scale: mph.' };
    return { ok: false, mistake: 'mph_far', msg: 'Read the inner scale, where the needle crosses it. Each small mark is 2 mph.' };
  }

  // ---------- The trials for each class ----------
  const TRIALS = { conceptual: 5, cp: 5, honors: 5 };
  // Speeds on the slider (m/s)
  const SLIDER = { conceptual: { min: 4, max: 30, step: 1 }, cp: { min: 2, max: 30, step: 1 }, honors: { min: 4, max: 30, step: 0.5 } };
  // Conceptual and Honors test a road until the car just holds. CP runs 5 speeds on dry road and reads the gauge.
  const PLAN = {
    conceptual: [['dry', 'car'], ['wet', 'car'], ['icy', 'car'], ['dry', 'truck'], ['wet', 'truck']],
    honors: [['dry', 'car'], ['icy', 'car'], ['wet', 'car'], ['snow', 'car'], ['damp', 'car']]
  };
  const trialPlan = (tier, n) => (tier === 'cp' ? { surf: 'dry', veh: 'car' } : { surf: PLAN[tier][n - 1][0], veh: PLAN[tier][n - 1][1] });

  // CP: which speed each trial asks for. Slow first, then close to the limit, then the student's choice.
  function speedRule(rig, n, table = []) {
    const used = table.slice(0, n - 1).map(r => r.v), top = safeSpeed(SURF.dry.mu, rig.r);
    const fresh = s => !used.includes(s);
    if (n === 1) return { text: 'Start slow: set a speed of 8 m/s or less.', ok: s => s <= 8, why: 'Start with a slow trial: 8 m/s or less.' };
    if (n === 2) return { text: `Now go fast: ${top - 2} m/s or more, without sliding.`, ok: s => s >= top - 2, why: `This trial needs a fast speed: ${top - 2} m/s or more.` };
    return { text: 'Pick a speed you have not tried yet.', ok: fresh, why: 'That speed is already in your table. Pick a new one.' };
  }

  // A "fastest safe speed" is proven by two runs: one that holds at that speed, one that slides a step faster.
  function checkFastest(raw, runs, step) {
    const x = parseNum(raw);
    if (x === null) return { ok: false, mistake: 'blank', msg: 'Type the fastest speed that held.' };
    const at = s => runs.filter(r => Math.abs(r.v - s) < 1e-6);
    const held = at(x).some(r => r.grip), slid = at(x).some(r => !r.grip);
    const next = at(x + step), nextHeld = next.some(r => r.grip), nextSlid = next.some(r => !r.grip);
    if (!at(x).length) return { ok: false, retry: true, mistake: 'not_tested', msg: `You have not run ${fmt(x)} m/s yet. Test it first.` };
    if (slid && !held) return { ok: false, mistake: 'slid', msg: `At ${fmt(x)} m/s the car slid off. That is too fast to be safe.` };
    if (nextHeld) return { ok: false, mistake: 'not_fastest', msg: `At ${fmt(x + step)} m/s the tires still held. Your fastest safe speed is higher.` };
    if (!nextSlid) return { ok: false, retry: true, mistake: 'not_proven', msg: `Prove it is the fastest: run ${fmt(x + step)} m/s and show the car slides.` };
    return { ok: true };
  }

  // ---------- Graphs ----------
  const BOX = { x0: 96, x1: 724, y0: 436, y1: 36 };
  // Conceptual: road condition along the bottom (categories), fastest safe speed up the side
  const CATS = ['dry', 'wet', 'icy'];
  // Conceptual graph: grouped columns. Each road is a group; the car's column sits left of center, the truck's right.
  const SLOT = 0.19, BAR_W = 52;
  const AX = {
    cat: { key: 'cat', sym: 'road', label: 'road condition', max: 3, cats: CATS },
    v: { key: 'v', sym: 'v', label: 'speed, v (m/s)', max: 30, step: 5, minor: 1 },
    mu: { key: 'mu', sym: 'μ', label: 'how grippy the road is, μ', max: 1, step: 0.1, minor: 0.05 },
    safe: { key: 'safe', sym: 'v_max', label: 'fastest safe speed (m/s)', max: 30, step: 5, minor: 1 },
    F: { key: 'F', sym: 'F', label: 'friction needed, F (kN)', max: 10, step: 2, minor: 0.5 },
    vmax: { key: 'vmax', sym: 'v_max', label: 'fastest safe speed, v_max (m/s)', max: 30, step: 5, minor: 1, f: v => v },
    vmax2: { key: 'vmax2', sym: 'v_max²', label: 'v_max² (m²/s²)', max: 600, step: 100, minor: 20, f: v => v * v },
    rootv: { key: 'rootv', sym: '√v_max', label: '√v_max', max: 6, step: 1, minor: 0.2, f: v => Math.sqrt(v) }
  };
  function graphSpec(tier, yKey) {
    if (tier === 'conceptual') return { x: AX.cat, y: AX.safe, box: BOX };
    if (tier === 'cp') return { x: AX.v, y: AX.F, box: BOX };
    return { x: AX.mu, y: AX[yKey || 'vmax'], box: BOX };
  }
  const xPx = (spec, x) => spec.x.cats ? spec.box.x0 + ((x + 0.5) / spec.x.max) * (spec.box.x1 - spec.box.x0) : spec.box.x0 + (x / spec.x.max) * (spec.box.x1 - spec.box.x0);
  const toPx = (spec, x, y) => ({ x: xPx(spec, x), y: spec.box.y0 - (y / spec.y.max) * (spec.box.y0 - spec.box.y1) });
  const fromPx = (spec, px, py) => ({
    x: ((px - spec.box.x0) / (spec.box.x1 - spec.box.x0)) * spec.x.max - (spec.x.cats ? 0.5 : 0),
    y: ((spec.box.y0 - py) / (spec.box.y0 - spec.box.y1)) * spec.y.max
  });
  // A table row's place on the graph, from the student's own recorded numbers
  function rowXY(tier, row, yKey) {
    if (tier === 'conceptual') { const cat = CATS.indexOf(row.surf); return { x: cat + (row.veh === 'truck' ? SLOT : -SLOT), y: row.v, veh: row.veh, cat }; }
    if (tier === 'cp') return { x: row.v, y: row.F };
    return { x: row.mu, y: round(AX[yKey || 'vmax'].f(row.v), yKey === 'vmax2' ? 1 : 2) };
  }
  const PLOT_TOL = 16;   // scene pixels
  function checkPlot(spec, click, target) {
    const t = toPx(spec, target.x, target.y), dx = Math.abs(click.x - t.x), dy = Math.abs(click.y - t.y);
    const xTol = spec.x.cats ? BAR_W / 2 + 4 : PLOT_TOL;
    const ySym = spec.y.sym, yUnit = spec.y.label.match(/\(([^)]+)\)/), yu = yUnit ? ` ${yUnit[1]}` : '';
    const who = target.veh === 'truck' ? 'truck' : 'car';
    const where = spec.x.cats ? `the ${who} column (${who === 'car' ? 'left' : 'right'}) above ${SURF[spec.x.cats[target.cat]].name}` : `${spec.x.sym} = ${fmt(target.x)}`;
    if (spec.x.cats) {
      // Right road, wrong vehicle: clicked the other column of the same group
      const other = xPx(spec, target.cat + (who === 'car' ? SLOT : -SLOT));
      if (Math.abs(click.x - other) <= xTol) return { ok: false, mistake: 'plot_slot', msg: `That is the ${who === 'car' ? 'truck' : 'car'} column. The ${who} column is on the ${who === 'car' ? 'left' : 'right'} of the ${SURF[spec.x.cats[target.cat]].name} group.` };
    }
    if ((spec.x.cats ? dx <= xTol && dy <= PLOT_TOL : Math.hypot(dx, dy) <= PLOT_TOL)) return { ok: true };
    if (!spec.x.cats) {
      const swapped = toPx(spec, target.y, target.x);
      if (Math.hypot(click.x - swapped.x, click.y - swapped.y) <= PLOT_TOL * 1.5) return { ok: false, mistake: 'plot_swapped', msg: `The two numbers are switched. ${spec.x.sym} goes along the bottom. ${ySym} goes up the side.` };
    }
    if (dx <= xTol) return { ok: false, mistake: 'plot_y', msg: `You are in the right place along the bottom. Now check the height: go up to ${ySym} = ${fmt(target.y)}${yu}.` };
    if (dy <= PLOT_TOL) return { ok: false, mistake: 'plot_x', msg: `The height is right. Now slide sideways to ${where}.` };
    return { ok: false, mistake: 'plot_off', msg: `Start on the bottom axis at ${where}. Go straight up until you are level with ${ySym} = ${fmt(target.y)}${yu}.` };
  }
  const farApart = (spec, p, q) => Math.abs(p.x - q.x) >= spec.x.max * 0.25;
  // CP: the curve through the student's own points, F = k × v² (least squares)
  function fitK(table) {
    let num = 0, den = 0;
    table.forEach(r => { num += r.F * r.v * r.v; den += r.v ** 4; });
    return den ? num / den : 0;
  }
  const crossAt = (k, limit) => (k > 0 ? Math.sqrt(limit / k) : 0);
  // CP: a click where the curve crosses a road's grip line
  function checkCross(spec, click, k, limit) {
    const p = fromPx(spec, click.x, click.y), xc = crossAt(k, limit);
    if (Math.abs(p.x - xc) <= 1 && Math.abs(p.y - limit) <= 0.6) return { ok: true, v: round(xc, 1) };
    if (Math.abs(p.y - limit) > 0.6) {
      if (Math.abs(p.y - k * p.x * p.x) <= 0.6) return { ok: false, mistake: 'cross_curve', msg: 'That is on your curve, but not where it meets the dashed grip line. Follow the curve until it touches the line.' };
      return { ok: false, mistake: 'cross_off', msg: 'Find the dashed line for this road. Click right where your curve crosses it.' };
    }
    return { ok: false, mistake: 'cross_line', msg: 'That is on the grip line, but your curve does not cross it there. Slide along the line to where the curve meets it.' };
  }
  function straightness(points) {
    const n = points.length, mx = points.reduce((s, p) => s + p.x, 0) / n, my = points.reduce((s, p) => s + p.y, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    points.forEach(p => { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; });
    return sxx && syy ? (sxy * sxy) / (sxx * syy) : 0;
  }

  // ---------- Showing and checking work ----------
  function workProblem(work, needs = {}) {
    if (!work.fns.length && work.nums.length <= 1) return 'Type the whole calculation into the calculator, not just the answer.';
    if (needs.fn && !work.fns.includes(needs.fn)) return `Your calculation needs to use the ${needs.label || needs.fn} button.`;
    const has = n => work.nums.some(w => Math.abs(w - Math.abs(n)) <= Math.max(Math.abs(n) * 0.015, 0.0051));
    const routes = needs.routes || [];
    if (routes.length && !routes.some(r => r.every(has))) {
      return `Your calculation needs to use ${needs.from || 'the numbers from this problem'}. Look for ${routes[0].map(fmt).join(' and ')}.`;
    }
    return null;
  }
  function stack(calc) {
    const [sym, ...steps] = calc.split(' = ');
    if (!steps.length) return `<span class="formula">${calc}</span>`;
    return `<span class="calc-stack">${steps.map(s => `<span class="calc-sym">${sym}</span><span>=</span><span>${s}</span>`).join('')}</span>`;
  }
  function grade(q, raw) {
    const v = parseNum(raw);
    const worked = q.right ? `<br><span class="worked">The right way: ${stack(q.right)}</span>` : '';
    if (v === null) return { ok: false, retry: true, mistake: 'blank', msg: q.calc ? 'Use the calculator, then press "Use calculator answer".' : 'Type your answer in the box.' };
    if (near(v, q.target, q.rel === undefined ? 0.02 : q.rel, q.abs === undefined ? 0.05 : q.abs)) return { ok: true, msg: q.right ? stack(q.right) : '' };
    const hit = q.mistake ? q.mistake(v) : null;
    if (q.own || (hit && hit[2])) return { ok: false, retry: true, mistake: hit ? hit[0] : 'other', msg: hit ? hit[1] : 'Not quite. Check the numbers you used.' };
    return { ok: false, mistake: hit ? hit[0] : 'other', msg: (hit ? hit[1] : 'Not quite.') + worked };
  }

  // Simulated data for the teacher's preview of Graph It, from honest readings of the instruments
  function sampleTable(tier, rig) {
    if (tier === 'cp') {
      const top = safeSpeed(SURF.dry.mu, rig.r);
      return [6, top - 1, 9, Math.round(top * 0.6) + 1, Math.round(top * 0.8)].map(v => ({ v, F: round(fNeed(1000, v, rig.r) / 1000, 1) }));
    }
    return PLAN[tier].map(([surf, veh]) => {
      const mu = SURF[surf].mu, v = safeSpeed(mu, rig.r, SLIDER[tier].step);
      return tier === 'honors' ? { surf, mu, v, v2: round(v * v, 2) } : { surf, veh, v };
    });
  }
  const sampleLimits = () => ({ dry: 8, wet: 5, icy: 2 });

  window.FLcore = {
    pick, shuffle, round, fmt, near, parseNum, G, SURF, VEH, RADII, newRig, LANE, innerR, fNeed, fMax, vMax, grips, safeSpeed, MPH, mph,
    GAUGE, SPEEDO, gaugeKN, checkGauge, checkMph, TRIALS, SLIDER, PLAN, trialPlan, speedRule, checkFastest,
    BOX, CATS, SLOT, BAR_W, AX, graphSpec, toPx, fromPx, rowXY, PLOT_TOL, checkPlot, farApart, fitK, crossAt, checkCross, straightness,
    workProblem, stack, grade, sampleTable, sampleLimits
  };
})();

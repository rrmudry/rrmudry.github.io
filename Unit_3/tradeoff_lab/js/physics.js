// Force–Distance Trade-Off Lab — physics, instrument checks, the graph, and grading.
// The big idea: a pulley or a smooth ramp lowers the force you need, but you pull the rope farther by the same factor.
// The work you put in, W = F × d, stays the same as lifting straight up: m × g × h.
// Students lift their own load to the same height with 1–4 supporting ropes and with ramps of different lengths,
// read the spring scale (N) and the rope tape (m), record each trial, graph F against d, and test an untested case.
//   conceptual (P1–3): reads the pattern from the table: twice the distance, half the force. No division needed.
//   cp (P4–6):         computes W = F × d for rows of the table and predicts a force with F = W ÷ d.
//   honors (P0):       also finds the ramp length that gives a chosen force, L = W ÷ F, then tests it.
// No friction and no force components anywhere: every ramp is perfectly smooth.

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
    const s = Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : Math.abs(v) < 10 ? String(round(v, 2)) : String(round(v, 1));
    return s.replace(/^-/, '−');
  }
  const near = (v, target, rel = 0.02, abs = 0.05) => Math.abs(v - target) <= Math.max(Math.abs(target) * rel, abs);
  function parseNum(raw) {
    const v = parseFloat(String(raw).replace(',', '.').replace(/[−–]/g, '-').replace(/[^0-9.\-eE]/g, ''));
    return isFinite(v) ? v : null;
  }

  // ---------- The apparatus ----------
  const G = 10;                       // m/s², on Earth, in this class
  const H = 1.5;                      // every lift ends 1.5 m above the floor
  const SCALE = { max: 250, minor: 5, label: 25, tol: 2.6 };   // spring scale in newtons
  const TAPE = { max: 7 };            // the rope tape runs from 0 to 7 m
  const ROPES = [1, 2, 3, 4];
  // Ramp trials. Periods 1–3 use 2, 3 and 4 times the height so the pattern sits in the table.
  const RAMP_C = [3, 4.5, 6];
  const RAMP_RANGE = { min: 1.6, max: 6.5, step: 0.1 };
  const TRIALS = { conceptual: 7, cp: 7, honors: 7 };

  // Each student gets their own load. Periods 1–3 get loads whose forces land on the scale's marks.
  const MASSES = { conceptual: [12, 18, 24], cp: [12, 14, 16, 18, 20, 22, 24], honors: [14, 16, 18, 20, 22] };
  function newRig(tier) {
    const m = pick(MASSES[tier] || MASSES.cp);
    return { m, h: H, test: null, Ftest: null };
  }
  const weight = rig => rig.m * G;
  const workOut = rig => rig.m * G * rig.h;
  // A machine: { mach: 'pulley', n } or { mach: 'ramp', L }. k = how many times farther the rope moves than the load rises.
  const factor = (rig, mc) => (mc.mach === 'pulley' ? mc.n : mc.L / rig.h);
  const ropeDist = (rig, mc) => (mc.mach === 'pulley' ? mc.n * rig.h : mc.L);
  const forceNeed = (rig, mc) => weight(rig) / factor(rig, mc);
  const machLabel = mc => (mc.mach === 'pulley' ? `${mc.n} rope${mc.n > 1 ? 's' : ''}` : `ramp ${fmt(mc.L)} m`);

  // The machine each trial uses. Trials 1–4 are pulleys, 5–7 are ramps.
  function trialMachine(n) { return n <= 4 ? { mach: 'pulley', n: ROPES[n - 1] } : { mach: 'ramp', L: null }; }
  function rampRule(tier, n, table = []) {
    const i = n - 5;
    if (tier === 'conceptual') {
      const L = RAMP_C[i], k = L / H;
      return { text: `Set the ramp to ${fmt(L)} m long: ${k} times the 1.5 m height.`, ok: s => Math.abs(s - L) < 0.05, why: `This trial uses a ${fmt(L)} m ramp. Slide the ramp length to ${fmt(L)} m.` };
    }
    const used = table.slice(0, n - 1).map(r => r.d);
    if (i === 0) return { text: 'Start with a short, steep ramp: 2.5 m or shorter.', ok: s => s <= 2.5001, why: 'This ramp needs to be short and steep: 2.5 m or less.' };
    if (i === 1) return { text: 'Now a long, gentle ramp: 5.0 m or longer.', ok: s => s >= 4.9999, why: 'This ramp needs to be long: 5.0 m or more.' };
    return {
      text: 'Pick a length in between that is not close to any rope distance in your table.',
      ok: s => used.every(u => Math.abs(u - s) >= 0.4),
      why: 'That is too close to a distance already in your table. Move at least 0.4 m away from every distance you have.'
    };
  }

  // Simulated table for teacher inspection
  const SAMPLE_RAMPS = { conceptual: RAMP_C, cp: [2.2, 5.6, 3.8], honors: [2.4, 5.2, 3.7] };
  function sampleTable(tier, rig) {
    const rows = ROPES.map(n => ({ mach: 'pulley', n }));
    (SAMPLE_RAMPS[tier] || SAMPLE_RAMPS.cp).forEach(L => rows.push({ mach: 'ramp', L }));
    return rows.map(mc => ({ mach: mc.mach, set: mc.mach === 'pulley' ? mc.n : mc.L, d: round(ropeDist(rig, mc), 2), F: round(forceNeed(rig, mc), 1) }));
  }
  const rowMachine = row => (row.mach === 'pulley' ? { mach: 'pulley', n: row.set } : { mach: 'ramp', L: row.set });

  // ---------- Reading the two instruments. Never says the value or which way to go. ----------
  function checkForce(raw, F, d, rig) {
    const x = parseNum(raw);
    if (x === null) return { ok: false, mistake: 'blank', msg: 'Read the spring scale and type the force.' };
    if (Math.abs(x - F) <= SCALE.tol) return { ok: true };
    if (Math.abs(x - weight(rig)) <= 1 && Math.abs(F - weight(rig)) > 3) return { ok: false, mistake: 'force_gave_weight', msg: 'That is the whole weight of the load. Read the spring scale on the rope: it shows how hard you pull.' };
    if (Math.abs(x - d) <= 0.06) return { ok: false, mistake: 'force_gave_dist', msg: 'That is the rope distance in meters. The force is on the spring scale, in newtons (N).' };
    if (Math.abs(x - F) <= 8) return { ok: false, mistake: 'force_close', msg: 'Close. Find the last numbered mark above the needle, then count the small marks. Each small mark is 5 N.' };
    return { ok: false, mistake: 'force_far', msg: 'That does not match the spring scale. Find the two numbers the needle is between. Each small mark is 5 N.' };
  }
  function checkDist(raw, d, F) {
    const x = parseNum(raw);
    if (x === null) return { ok: false, mistake: 'blank', msg: 'Read the rope tape at the red tag and type the distance.' };
    if (Math.abs(x - d) <= 0.051) return { ok: true };
    if (Math.abs(x - F) <= 2 && Math.abs(F - d) > 2) return { ok: false, mistake: 'dist_gave_force', msg: 'That is the force in N. The distance is on the rope tape, in meters (m).' };
    if (Math.abs(x - 1.5) <= 0.051) return { ok: false, mistake: 'dist_gave_height', msg: 'That is how high the load went. Read how far YOU pulled the rope: the red tag on the rope tape.' };
    if (near(x, d * 100, 0.01, 0.6)) return { ok: false, mistake: 'dist_cm', msg: 'That is in centimeters. Record meters: the big numbers on the tape are meters.' };
    if (Math.abs(x - d) <= 0.35) return { ok: false, mistake: 'dist_close', msg: 'Close. Find the last big number before the red tag, then count small marks. Each small mark is 0.1 m.' };
    return { ok: false, mistake: 'dist_far', msg: 'That does not match the tape. Look where the red tag on the rope points.' };
  }

  // ---------- The graph: force against rope distance ----------
  const BOX = { x0: 96, x1: 724, y0: 436, y1: 36 };
  const X_AXIS = { key: 'd', sym: 'd', label: 'rope pulled, d (m)', max: 7, step: 1, minor: 0.5 };
  function forceAxis(Fg) {
    const max = [100, 125, 150, 175, 200, 225, 250, 275, 300].find(m => m >= Fg * 1.08) || 300;
    return { sym: 'F', label: 'force on the rope, F (N)', max, step: 25, minor: 5 };
  }
  const graphSpec = rig => ({ x: Object.assign({}, X_AXIS), y: forceAxis(weight(rig)), box: BOX });
  const specFor = Fg => ({ x: Object.assign({}, X_AXIS), y: forceAxis(Fg), box: BOX });
  const toPx = (spec, x, y) => ({
    x: spec.box.x0 + (x / spec.x.max) * (spec.box.x1 - spec.box.x0),
    y: spec.box.y0 - (y / spec.y.max) * (spec.box.y0 - spec.box.y1)
  });
  const fromPx = (spec, px, py) => ({
    x: ((px - spec.box.x0) / (spec.box.x1 - spec.box.x0)) * spec.x.max,
    y: ((spec.box.y0 - py) / (spec.box.y0 - spec.box.y1)) * spec.y.max
  });
  const rowXY = row => ({ x: row.d, y: row.F });
  const PLOT_TOL = 14;
  function checkPlot(spec, click, target) {
    const t = toPx(spec, target.x, target.y);
    const dx = Math.abs(click.x - t.x), dy = Math.abs(click.y - t.y);
    if (Math.hypot(dx, dy) <= PLOT_TOL) return { ok: true };
    if (dx <= PLOT_TOL) return { ok: false, mistake: 'plot_y', msg: `You are above the right spot on the bottom axis. Now check the height: F = ${fmt(target.y)} N.` };
    if (dy <= PLOT_TOL) return { ok: false, mistake: 'plot_x', msg: `The height is right. Now slide sideways to d = ${fmt(target.x)} m on the bottom axis.` };
    return { ok: false, mistake: 'plot_off', msg: `Start on the bottom axis at d = ${fmt(target.x)} m. Go straight up until you are level with F = ${fmt(target.y)} N.` };
  }

  // A rope distance for reading the curve: not in the table, and not the distance that will be tested
  function readSpot(table, avoid) {
    const used = table.map(r => r.d).concat(avoid ? [avoid] : []);
    const options = [2.5, 3.5, 4.0, 5.0, 5.5].filter(x => used.every(u => Math.abs(u - x) >= 0.3));
    return options.length ? pick(options) : 5.5;
  }
  // The ramp tested at the end. Periods 1–3 and 4–6 predict the force for a length they never used.
  function testLength(table) {
    const used = table.map(r => r.d);
    const options = [2.0, 2.5, 3.5, 4.0, 5.0, 5.5, 6.5].filter(x => used.every(u => Math.abs(u - x) >= 0.3));
    return options.length ? pick(options) : 6.5;
  }
  // Period 0 is given a force and finds the ramp length. The length lands on the tape's 0.1 m marks.
  function testForce(rig, table) {
    const used = table.map(r => r.d);
    const W = workOut(rig);
    const options = [2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0].filter(L => used.every(u => Math.abs(u - L) >= 0.3) && Number.isInteger(round(W / L, 4)));
    const L = options.length ? pick(options) : 5.0;
    return { L, F: round(W / L, 2) };
  }

  // ---------- Showing and checking work (same rules as the Day 2 studio) ----------
  function workProblem(work, needs = {}) {
    if (!work.fns.length && work.nums.length <= 1) return 'Type the whole calculation into the calculator, not just the answer.';
    if (needs.fn && !work.fns.includes(needs.fn)) return `Your calculation needs to use the ${needs.label || needs.fn} button.`;
    const has = n => work.nums.some(w => Math.abs(w - Math.abs(n)) <= Math.max(Math.abs(n) * 0.015, 0.0051));
    const routes = needs.routes || [];
    if (routes.length && !routes.some(r => r.every(has))) {
      return `Your calculation needs to use ${needs.from || 'the numbers from this problem'}. Look for ${routes[0].map(n => fmt(Math.abs(n))).join(' and ')}.`;
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

  window.FLcore = {
    pick, shuffle, round, fmt, near, parseNum, G, H, SCALE, TAPE, ROPES, RAMP_C, RAMP_RANGE, TRIALS, MASSES, newRig, weight, workOut,
    factor, ropeDist, forceNeed, machLabel, trialMachine, rampRule, sampleTable, rowMachine, checkForce, checkDist,
    BOX, X_AXIS, forceAxis, graphSpec, specFor, toPx, fromPx, rowXY, PLOT_TOL, checkPlot, readSpot, testLength, testForce,
    workProblem, stack, grade
  };
})();

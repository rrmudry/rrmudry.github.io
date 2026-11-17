// Mechanical Work Studio — physics, instrument checks, the graph, and grading.
// The big idea: a force does work only along the motion. W = F × d, measured in joules (1 J = 1 N × 1 m).
// Students pull a crate along a track, read the spring scale (N), the tape measure (m) and the work meter (J),
// record each trial in a table, graph W against d, and predict a distance they never tested.
//   conceptual (P1–3): reads the pattern from the table: twice the distance, twice the work. No division.
//   cp (P4–6):         finds the slope of W against d and matches it to the spring scale: slope = force.
//   honors (P0):       the rope is angled, so the slope is the part of the force along the track: F × cos θ.
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

  // Whole numbers stay whole, then 1 decimal, 2 when small
  function fmt(v) {
    const s = Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : Math.abs(v) < 10 ? String(round(v, 2)) : String(round(v, 1));
    return s.replace(/^-/, '−');   // a real minus sign
  }
  const near = (v, target, rel = 0.02, abs = 0.05) => Math.abs(v - target) <= Math.max(Math.abs(target) * rel, abs);
  function parseNum(raw) {
    const v = parseFloat(String(raw).replace(',', '.').replace(/[−–]/g, '-').replace(/[^0-9.\-eE]/g, ''));
    return isFinite(v) ? v : null;
  }
  const cosd = deg => Math.cos(deg * Math.PI / 180);

  // ---------- The apparatus: a crate pulled along a warehouse track ----------
  const G = 10;                                     // m/s², on Earth, in this class
  const DIAL = { max: 50, tol: 0.3 };               // spring scale in newtons; every force is a whole number on a mark
  const TRACK = { max: 8 };                         // the tape measure runs from 0 to 8 m
  const TRIALS = { conceptual: 5, cp: 5, honors: 6 };
  const TEST_D = { conceptual: 8, cp: 7.5, honors: 7.5 };   // never offered during the trials, so the prediction is a new case
  const D_RANGE = { conceptual: { min: 1, max: 6, step: 1 }, cp: { min: 0.8, max: 6.2, step: 0.1 }, honors: { min: 0.8, max: 6.2, step: 0.1 } };

  // Each student gets their own crate and pull, so no two tables match.
  const RIGS = {
    conceptual: [10, 15, 20, 25, 30].map(F => [F, 0]),
    cp: [12, 14, 16, 18, 22, 24, 26, 28, 32, 35].map(F => [F, 0]),
    honors: [24, 28, 30, 32, 36, 40].reduce((all, F) => all.concat([30, 40, 50, 60].map(th => [F, th])), [])
  };
  function newRig(tier) {
    const [F, theta] = pick(RIGS[tier] || RIGS.cp);
    return { F, theta };
  }
  // The part of the rope's pull that points along the track
  const along = rig => rig.F * cosd(rig.theta || 0);
  const work = (rig, d) => along(rig) * d;
  // The work meter shows one decimal place
  const meter = (rig, d) => round(work(rig, d), 1);

  // Which distance each trial asks for. Periods 1–3 use 1, 2, 3, 4, 5 m so doubling and tripling sit in the table.
  // Everyone else starts short, then long, then fills in, so the graph has spread.
  const WORDS = ['', '', 'twice', '3 times'];
  function distRule(tier, n, table = []) {
    const used = table.slice(0, n - 1).map(r => r.set);
    if (tier === 'conceptual') {
      if (n === 1) return { text: 'Set the pull distance to 1 m.', ok: s => s === 1, why: 'Trial 1 uses 1 m. Slide the distance to 1 m.' };
      if (n === 2 || n === 3) return { text: `Set the distance to ${WORDS[n]} as far as Trial 1.`, ok: s => s === n, why: `Trial 1 was 1 m. ${WORDS[n][0].toUpperCase() + WORDS[n].slice(1)} as far is ${n} × 1 m.` };
      if (n === 4) return { text: 'Set the distance to twice as far as Trial 2.', ok: s => s === 4, why: 'Trial 2 was 2 m. Twice as far is 2 × 2 m.' };
      return { text: 'Set the pull distance to 5 m.', ok: s => s === 5, why: 'This trial uses 5 m.' };
    }
    if (n === 1) return { text: 'Start short: a pull of 2 m or less.', ok: s => s <= 2.0001, why: 'Start with a short pull: 2 m or less. Watch the stop cone on the tape.' };
    if (n === 2) return { text: 'Now go long: a pull of 5 m or more.', ok: s => s >= 4.9999, why: 'This trial needs a long pull: 5 m or more.' };
    return {
      text: 'Pick a distance in between, not close to one you tried.',
      ok: s => used.every(u => Math.abs(u - s) >= 0.45),
      why: 'That is too close to a distance already in your table. Move the stop cone at least half a meter away from the others.'
    };
  }

  // Simulated trial table for teacher/preview inspection of Graph It without running every trial
  const SAMPLE_SETS = { conceptual: [1, 2, 3, 4, 5], cp: [1.5, 5.5, 3.2, 2.4, 4.3], honors: [1.2, 5.6, 2.5, 3.4, 4.4, 6.2] };
  function sampleTable(tier, rig) {
    return (SAMPLE_SETS[tier] || SAMPLE_SETS.cp).map(set => ({ set, d: set, F: rig.F, W: meter(rig, set) }));
  }

  // ---------- Reading the three instruments. Never says the value or which way to go. ----------
  const isAbout = (x, v, tol) => typeof v === 'number' && Math.abs(x - v) <= tol;
  function checkForce(raw, F, d, W) {
    const x = parseNum(raw);
    if (x === null) return { ok: false, mistake: 'blank', msg: 'Read the spring scale dial and type the force.' };
    if (Math.abs(x - F) <= DIAL.tol) return { ok: true };
    if (isAbout(x, W, 0.6)) return { ok: false, mistake: 'force_gave_work', msg: 'That is the work meter, in joules (J). The force is on the round spring scale dial, in newtons (N).' };
    if (isAbout(x, d, 0.051)) return { ok: false, mistake: 'force_gave_dist', msg: 'That is the distance on the tape. The force is on the round spring scale dial.' };
    if (near(x, F * 10, 0.03) || near(x, F / 10, 0.03)) return { ok: false, mistake: 'force_scale', msg: 'Check the size of the marks. The numbers on the dial go up by 10 N, and each small mark is 1 N.' };
    if (Math.abs(x - F) <= 3) return { ok: false, mistake: 'force_close', msg: 'Close. Find the last numbered mark the needle has passed, then count the small marks after it. Each small mark is 1 N. Use the close-up.' };
    return { ok: false, mistake: 'force_far', msg: 'That does not match the dial. Find the two numbers the needle is between. Each small mark between them is 1 N.' };
  }
  function checkDist(raw, d, F, W) {
    const x = parseNum(raw);
    if (x === null) return { ok: false, mistake: 'blank', msg: 'Read the tape measure at the front edge of the crate and type the distance.' };
    if (Math.abs(x - d) <= 0.051) return { ok: true };
    if (isAbout(x, F, 0.3) && Math.abs(F - d) > 0.3) return { ok: false, mistake: 'dist_gave_force', msg: 'That is the force in N. The distance is on the tape measure, in meters (m).' };
    if (isAbout(x, W, 0.6)) return { ok: false, mistake: 'dist_gave_work', msg: 'That is the work meter. The distance is on the tape measure under the crate.' };
    if (near(x, d * 100, 0.01, 0.6)) return { ok: false, mistake: 'dist_cm', msg: 'That is in centimeters. Record the distance in meters: the big numbers on the tape are meters.' };
    if (Math.abs(x - d) <= 0.35) return { ok: false, mistake: 'dist_close', msg: 'Close. Find the last big number before the red pointer. Then count the small marks after it: each one is 0.1 m. Use the tape close-up.' };
    return { ok: false, mistake: 'dist_far', msg: 'That does not match the tape. Look where the red pointer at the front of the crate touches the tape.' };
  }
  function checkWork(raw, W, F, d) {
    const x = parseNum(raw);
    if (x === null) return { ok: false, mistake: 'blank', msg: 'Read the work meter and type the work.' };
    if (Math.abs(x - W) <= 0.55) return { ok: true };
    if (isAbout(x, F, 0.3)) return { ok: false, mistake: 'work_gave_force', msg: 'That is the force in N. Read the work meter, in joules (J).' };
    if (isAbout(x, d, 0.051)) return { ok: false, mistake: 'work_gave_dist', msg: 'That is the distance in m. Read the work meter, in joules (J).' };
    return { ok: false, mistake: 'work_far', msg: 'That does not match the work meter. Copy the number on the work meter.' };
  }

  // ---------- The graph: work against distance ----------
  const BOX = { x0: 96, x1: 724, y0: 436, y1: 36 };
  const X_AXIS = { key: 'd', sym: 'd', label: 'distance pulled, d (m)', max: 8, step: 1, minor: 0.5 };
  // The work axis fits this student's crate: tall enough for 8 m, in steps that are easy to count
  function workAxis(slope) {
    const top = slope * TRACK.max * 1.02;
    const max = [50, 100, 150, 200, 250, 300, 350, 400].find(m => m >= top) || 400;
    const step = max <= 100 ? 10 : max <= 200 ? 25 : 50;
    return { sym: 'W', label: 'work done, W (J)', max, step, minor: step / 5 };
  }
  function graphSpec(rig) { return { x: Object.assign({}, X_AXIS), y: workAxis(along(rig)), box: BOX }; }
  const specFor = slope => ({ x: Object.assign({}, X_AXIS), y: workAxis(slope), box: BOX });
  const toPx = (spec, x, y) => ({
    x: spec.box.x0 + (x / spec.x.max) * (spec.box.x1 - spec.box.x0),
    y: spec.box.y0 - (y / spec.y.max) * (spec.box.y0 - spec.box.y1)
  });
  const fromPx = (spec, px, py) => ({
    x: ((px - spec.box.x0) / (spec.box.x1 - spec.box.x0)) * spec.x.max,
    y: ((spec.box.y0 - py) / (spec.box.y0 - spec.box.y1)) * spec.y.max
  });
  const rowXY = row => ({ x: row.d, y: row.W });
  const PLOT_TOL = 14;   // scene pixels
  function checkPlot(spec, click, target) {
    const t = toPx(spec, target.x, target.y);
    const dx = Math.abs(click.x - t.x), dy = Math.abs(click.y - t.y);
    if (Math.hypot(dx, dy) <= PLOT_TOL) return { ok: true };
    if (dx <= PLOT_TOL) return { ok: false, mistake: 'plot_y', msg: `You are above the right spot on the bottom axis. Now check the height: go up to W = ${fmt(target.y)} J.` };
    if (dy <= PLOT_TOL) return { ok: false, mistake: 'plot_x', msg: `The height is right. Now slide sideways to d = ${fmt(target.x)} m on the bottom axis.` };
    return { ok: false, mistake: 'plot_off', msg: `Start on the bottom axis at d = ${fmt(target.x)} m. Go straight up until you are level with W = ${fmt(target.y)} J.` };
  }
  // The two points used for a slope have to be far enough apart for the slope to mean something.
  const farApart = (spec, p, q) => Math.abs(p.x - q.x) >= spec.x.max * 0.2;

  // A distance for reading the line: between the student's trials, not in the table
  function readSpot(table) {
    const used = table.map(r => r.d);
    const options = [1.5, 2.5, 3.5, 4.5, 5.5].filter(x => used.every(u => Math.abs(u - x) >= 0.3));
    return options.length ? pick(options) : 2.75;
  }

  // ---------- Showing and checking work ----------
  // A calculator line has to be real work: more than one number, the right button, and this problem's numbers.
  function workProblem(work, needs = {}) {
    if (!work.fns.length && work.nums.length <= 1 && !/\\pi/.test(work.latex || '')) return 'Type the whole calculation into the calculator, not just the answer.';
    if (needs.fn && !work.fns.includes(needs.fn)) return `Your calculation needs to use the ${needs.label || needs.fn} button.`;
    const has = n => work.nums.some(w => Math.abs(w - Math.abs(n)) <= Math.max(Math.abs(n) * 0.015, 0.0051));
    const routes = needs.routes || [];
    if (routes.length && !routes.some(r => r.every(has))) {
      return `Your calculation needs to use ${needs.from || 'the numbers from this problem'}. Look for ${routes[0].map(n => fmt(Math.abs(n))).join(' and ')}.`;
    }
    return null;
  }

  // A calculation reads one step per line with the equals signs lined up, never as one long chain.
  function stack(calc) {
    const [sym, ...steps] = calc.split(' = ');
    if (!steps.length) return `<span class="formula">${calc}</span>`;
    return `<span class="calc-stack">${steps.map(s => `<span class="calc-sym">${sym}</span><span>=</span><span>${s}</span>`).join('')}</span>`;
  }

  // q = { target, rel, abs, mistake(v) → [id, msg, retry?], right }. Returns { ok, retry, mistake, msg }. retry = same numbers.
  function grade(q, raw) {
    const v = parseNum(raw);
    const worked = q.right ? `<br><span class="worked">The right way: ${stack(q.right)}</span>` : '';
    if (v === null) return { ok: false, retry: true, mistake: 'blank', msg: q.calc ? 'Use the calculator, then press "Use calculator answer".' : 'Type your answer in the box.' };
    if (near(v, q.target, q.rel === undefined ? 0.02 : q.rel, q.abs === undefined ? 0.05 : q.abs)) return { ok: true, msg: q.right ? stack(q.right) : '' };
    const hit = q.mistake ? q.mistake(v) : null;
    // The student's own data is never dealt again, and its answer is never given away.
    if (q.own || (hit && hit[2])) return { ok: false, retry: true, mistake: hit ? hit[0] : 'other', msg: hit ? hit[1] : 'Not quite. Check the numbers you used.' };
    return { ok: false, mistake: hit ? hit[0] : 'other', msg: (hit ? hit[1] : 'Not quite.') + worked };
  }

  window.FLcore = {
    pick, shuffle, round, fmt, near, parseNum, cosd, G, DIAL, TRACK, TRIALS, TEST_D, D_RANGE, RIGS, newRig, along, work, meter,
    distRule, sampleTable, checkForce, checkDist, checkWork, BOX, X_AXIS, workAxis, graphSpec, specFor, toPx, fromPx, rowXY,
    PLOT_TOL, checkPlot, farApart, readSpot, workProblem, stack, grade
  };
})();

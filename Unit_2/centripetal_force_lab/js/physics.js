// Centripetal Force Lab — physics, measurements, graph checks, problems for each class, Mastery Check.
// The big idea: an object only moves in a circle when a net force pulls it toward the center. F_net = m × v² ÷ r.
// Students measure that force on a dial, record it in a table, graph their own points, and predict a case they did not test.
//   conceptual (P1–3): reads the pattern from the table: twice the speed needs 4 times the force. No division.
//   cp (P4–6):         finds a_c for each trial, graphs F against a_c, and finds the slope: the mass.
//   honors (P0):       finds each speed from a lap time, straightens the curve with v², and finds the speed that snaps the string.
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
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    return Math.abs(v) < 10 ? String(round(v, 2)) : String(round(v, 1));
  }
  const near = (v, target, rel = 0.02, abs = 0.05) => Math.abs(v - target) <= Math.max(Math.abs(target) * rel, abs);
  function parseNum(raw) {
    const v = parseFloat(String(raw).replace(',', '.').replace(/[−–]/g, '-').replace(/[^0-9.\-eE]/g, ''));
    return isFinite(v) ? v : null;
  }

  // ---------- The apparatus ----------
  const force = (m, v, r) => (m * v * v) / r;
  const DIAL = { max: 50, tol: 0.55, limit: 40 };   // newtons; tol accepts the nearest mark or half mark; limit = where the Honors string snaps
  const TEST_SPEED = 8;                              // never offered during the trials, so the prediction is a new case
  const SPEEDS = [2, 3, 4, 5, 6, 7];
  const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];
  const TRIALS = { conceptual: 5, cp: 5, honors: 6 };

  // Each student gets their own puck and string, so no two tables match.
  const RIGS = {
    conceptual: [[0.2, 0.8], [0.25, 0.5], [0.2, 0.4], [0.4, 0.8], [0.3, 0.4], [0.6, 0.8]],   // forces land on dial marks at 2, 4, 6 m/s
    cp: [[0.2, 0.5], [0.22, 0.5], [0.24, 0.5], [0.25, 0.5], [0.26, 0.5], [0.28, 0.5], [0.3, 0.5], [0.2, 0.4], [0.22, 0.4], [0.24, 0.4], [0.25, 0.4]]
  };
  RIGS.honors = RIGS.cp;
  function newRig(tier) {
    const [m, r] = pick(RIGS[tier] || RIGS.cp);
    return { m, r, base: pick([1.6, 1.8, 2.0]) };
  }
  // Honors: the motor has numbered levels, not speeds. The speed comes from the lap timer.
  const levelSpeed = (rig, L) => round(rig.base + 0.6 * L, 2);
  const tenLaps = (rig, v) => round((10 * 2 * Math.PI * rig.r) / v, 2);
  const speedOf = (tier, rig, setting) => (tier === 'honors' ? levelSpeed(rig, setting) : setting);

  // Which speed each trial asks for. The first trials are spread out so the pattern shows; the rest are the student's choice.
  function speedRule(tier, n, table = []) {
    const used = table.slice(0, n - 1).map(r => r.set);
    const fresh = s => !used.includes(s);
    if (tier === 'conceptual') {
      if (n === 1) return { text: 'Set the speed to 2 m/s.', ok: s => s === 2, why: 'Trial 1 uses 2 m/s. Slide the speed to 2.' };
      if (n === 2) return { text: 'Set the speed to twice as fast as Trial 1.', ok: s => s === 4, why: 'Trial 1 was 2 m/s. Twice as fast is 2 × 2.' };
      if (n === 3) return { text: 'Set the speed to 3 times as fast as Trial 1.', ok: s => s === 6, why: 'Trial 1 was 2 m/s. 3 times as fast is 3 × 2.' };
      return { text: 'Pick a speed you have not tried yet.', ok: fresh, why: 'That speed is already in your table. Pick a new one.' };
    }
    if (tier === 'cp') {
      if (n === 1) return { text: 'Start slow: set a speed of 3 m/s or less.', ok: s => s <= 3, why: 'Start with a slow trial: 3 m/s or less.' };
      if (n === 2) return { text: 'Now go fast: set a speed of 6 m/s or more.', ok: s => s >= 6, why: 'This trial needs a fast speed: 6 m/s or more.' };
      return { text: 'Pick a speed you have not tried yet.', ok: fresh, why: 'That speed is already in your table. Pick a new one.' };
    }
    if (n === 1) return { text: 'Start slow: set the motor to level 1 or 2.', ok: s => s <= 2, why: 'Start with a slow trial: level 1 or 2.' };
    if (n === 2) return { text: 'Now go fast: set the motor to level 7 or 8.', ok: s => s >= 7, why: 'This trial needs a fast level: 7 or 8.' };
    return { text: 'Pick a motor level you have not tried yet.', ok: fresh, why: 'That level is already in your table. Pick a new one.' };
  }

  // The dial reading the student typed, against the simulation. Never says the value or which way to go.
  function checkReading(raw, F, v) {
    const x = parseNum(raw);
    if (x === null) return { ok: false, mistake: 'blank', msg: 'Read the force dial and type the number.' };
    // A needle sitting right on a mark has to be read as that mark.
    const onMark = Math.abs(F - Math.round(F)) < 0.05;
    if (Math.abs(x - F) <= (onMark ? 0.3 : DIAL.tol) + 1e-9) return { ok: true };
    if (Math.abs(x - v) < 0.051) return { ok: false, mistake: 'read_speed', msg: 'That is the speed. The force is on the round dial. Read where the needle points.' };
    if (near(x, F * 10, 0.03) || near(x, F / 10, 0.03)) return { ok: false, mistake: 'read_scale', msg: 'Check the size of the marks. The numbers on the dial go up by 10 N, and each small mark is 1 N.' };
    if (Math.abs(x - F) <= 2.5) return { ok: false, mistake: 'read_close', msg: 'Close. Look again: find the last mark the needle has passed, then count the small marks. Each small mark is 1 N. If the needle sits between two marks, use the half: 12.5, for example.' };
    return { ok: false, mistake: 'read_far', msg: 'That does not match the dial. Find the two numbers the needle is between. Each small mark between them is 1 N.' };
  }

  // ---------- The graph ----------
  // One picture size for every graph: the plot box in the 760 × 520 scene.
  const BOX = { x0: 96, x1: 724, y0: 436, y1: 36 };
  const AXES = {
    v: { key: 'v', sym: 'v', label: 'speed, v (m/s)', max: 8, step: 1, minor: 0.5, f: v => v },
    v2: { key: 'v2', sym: 'v²', label: 'speed squared, v² (m²/s²)', max: 60, step: 10, minor: 2, f: v => v * v },
    rootv: { key: 'rootv', sym: '√v', label: 'square root of speed, √v', max: 3, step: 0.5, minor: 0.1, f: v => Math.sqrt(v) },
    inv: { key: 'inv', sym: '1 ÷ v', label: 'one over speed, 1 ÷ v (s/m)', max: 0.6, step: 0.1, minor: 0.02, f: v => 1 / v },
    a: { key: 'a', sym: 'a_c', label: 'centripetal acceleration, a_c (m/s²)', max: 140, step: 20, minor: 5, f: null }
  };
  const Y_AXIS = { sym: 'F', label: 'force toward the center, F (N)', max: 50, step: 10, minor: 2 };
  function graphSpec(tier, rig, xKey) {
    const key = xKey || (tier === 'cp' ? 'a' : 'v');
    const x = Object.assign({}, AXES[key]);
    if (key === 'a' && rig.r < 0.45) x.max = 180;
    return { x, y: Y_AXIS, box: BOX };
  }
  const toPx = (spec, x, y) => ({
    x: spec.box.x0 + (x / spec.x.max) * (spec.box.x1 - spec.box.x0),
    y: spec.box.y0 - (y / spec.y.max) * (spec.box.y0 - spec.box.y1)
  });
  const fromPx = (spec, px, py) => ({
    x: ((px - spec.box.x0) / (spec.box.x1 - spec.box.x0)) * spec.x.max,
    y: ((spec.box.y0 - py) / (spec.box.y0 - spec.box.y1)) * spec.y.max
  });
  // A table row's place on a graph, from the student's own recorded numbers
  function rowXY(row, xKey) {
    if (xKey === 'a') return { x: row.a, y: row.F };
    return { x: round(AXES[xKey].f(row.v), xKey === 'v2' ? 1 : 2), y: row.F };
  }
  const PLOT_TOL = 16;   // scene pixels
  function checkPlot(spec, click, target) {
    const t = toPx(spec, target.x, target.y);
    const dx = Math.abs(click.x - t.x), dy = Math.abs(click.y - t.y);
    if (Math.hypot(dx, dy) <= PLOT_TOL) return { ok: true };
    const swapped = toPx(spec, target.y, target.x);
    if (Math.hypot(click.x - swapped.x, click.y - swapped.y) <= PLOT_TOL * 1.5) {
      return { ok: false, mistake: 'plot_swapped', msg: `The two numbers are switched. ${spec.x.sym} goes along the bottom. F goes up the side.` };
    }
    if (dx <= PLOT_TOL) return { ok: false, mistake: 'plot_y', msg: `You are above the right spot on the bottom axis. Now check the height: go up to F = ${fmt(target.y)} N.` };
    if (dy <= PLOT_TOL) return { ok: false, mistake: 'plot_x', msg: `The height is right. Now slide sideways to ${spec.x.sym} = ${fmt(target.x)} on the bottom axis.` };
    return { ok: false, mistake: 'plot_off', msg: `Start on the bottom axis at ${spec.x.sym} = ${fmt(target.x)}. Go straight up until you are level with F = ${fmt(target.y)} N.` };
  }
  // The two points used for a slope have to be far enough apart for the slope to mean something.
  const farApart = (spec, p, q) => Math.abs(p.x - q.x) >= spec.x.max * 0.2;

  // How straight the student's points are on a set of axes (1 = perfectly straight)
  function straightness(points) {
    const n = points.length, mx = points.reduce((s, p) => s + p.x, 0) / n, my = points.reduce((s, p) => s + p.y, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    points.forEach(p => { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; });
    return sxx && syy ? (sxy * sxy) / (sxx * syy) : 0;
  }

  // ---------- Showing and checking work ----------
  // A calculator line has to be real work: more than one number, the right button, and this problem's numbers.
  function workProblem(work, needs = {}) {
    if (!work.fns.length && work.nums.length <= 1 && !/\\pi/.test(work.latex || '')) return 'Type the whole calculation into the calculator, not just the answer.';
    if (needs.fn && !work.fns.includes(needs.fn)) return `Your calculation needs to use the ${needs.label || needs.fn} button.`;
    if (needs.pi && !/\\pi/.test(work.latex || '')) return 'Your calculation needs to use the π button.';
    const has = n => work.nums.some(w => Math.abs(w - Math.abs(n)) <= Math.max(Math.abs(n) * 0.015, 0.0051));
    const routes = needs.routes || [];
    if (routes.length && !routes.some(r => r.every(has))) {
      return `Your calculation needs to use ${needs.from || 'the numbers from this problem'}. Look for ${routes[0].map(fmt).join(' and ')}.`;
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

  window.FLcore = { pick, shuffle, round, fmt, near, parseNum, force, DIAL, TEST_SPEED, SPEEDS, LEVELS, TRIALS, RIGS, newRig, levelSpeed, tenLaps, speedOf, speedRule, checkReading, BOX, AXES, Y_AXIS, graphSpec, toPx, fromPx, rowXY, PLOT_TOL, checkPlot, farApart, straightness, workProblem, stack, grade };
})();

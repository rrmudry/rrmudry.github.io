// Horizontal Projectile Workbench — Lab investigations (measure → table → graph → questions)
// Lab 1 (Speed Test, first for everyone): learn the floor ruler and timer, run a fair test
//   (change only the launch speed), measure each landing spot and flight time, graph Δx vs v_x,
//   find the slope, then predict and test a new launch.
// Lab 2 (Strobe Photo): learn the height ruler, launch, measure ghosts with the crosshair + zoom
//   boxes, and read YOUR graphs. Periods 1–6 do a short version: they measure 3 ghosts and a
//   "lab partner" fills the other rows. Period 0 (Honors) measures every ghost and does the full
//   analysis (difference columns, slope, graph reading, formula check, g from t²).
// Periods 1–3 also get extra support (no badge): a worked example row, the first hint already
// open, and the slope split into rise / run / slope boxes (see js/app.js, supportOn).
// Answers to the analysis questions come from the student's own measurements, so they can't be
// looked up. They have to collect the data first. Honors steps (⭐) run only for Period 0.
//
// Task types used here (run by js/app.js): info, launch, findread, practice, column, measure, mc,
// pickRow, pickPoint, pick2, num, trial, test.

(function () {
  const { Phys, fmt, fmtExact, near } = window.Engine;
  const X = n => fmtExact(n);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const NICE = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50];
  const niceCeil = v => NICE.find(n => n >= v) || Math.ceil(v / 10) * 10;
  const f2 = v => fmt(v, 2);
  // Show a student's own number the way they would write it
  const show = v => v === null || v === undefined ? '?' : fmtExact(v, 2);

  // ---------- Lab 1: Strobe Photo ----------
  // Every ghost lands exactly on a 0.1 m tick of both rulers (no 0.05 m or 0.5 m tick counting)
  const L1_POOL = [
    { dy: 5, dt: 0.2, vxs: [3, 4, 5] },
    { dy: 3.2, dt: 0.2, vxs: [2, 2.5, 3] }
  ];

  function genLab1(avoidKey) {
    const opts = L1_POOL.flatMap(p => p.vxs.map(vx => ({ ...p, vx }))).filter(o => `${o.dy}|${o.vx}` !== avoidKey);
    const o = pick(opts);
    const T = Phys.time(o.dy);
    const rows = [];
    for (let k = 0; k * o.dt <= T + 1e-9; k++) {
      const t = Number((k * o.dt).toFixed(3));
      rows.push({ k, t, x: o.vx * t, y: Math.max(0, o.dy - 5 * t * t) });
    }
    return { dy: o.dy, vx: o.vx, dt: o.dt, T, dx: o.vx * T, rows, runway: niceCeil(o.vx * T * 1.3), key: `${o.dy}|${o.vx}` };
  }

  // Interpolate the student's own (t, value) points at time tq
  function interp(points, tq) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      if (tq >= a.x && tq <= b.x) return a.y + (b.y - a.y) * (tq - a.x) / (b.x - a.x);
    }
    return null;
  }

  // Points from two table columns (skips rows not filled in yet)
  const colPoints = (ctx, cx, cy, rows) => (rows || ctx.sess.table.map((_, i) => i))
    .map(i => ({ x: ctx.val(i, cx), y: ctx.val(i, cy), row: i }))
    .filter(p => p.x !== null && p.y !== null);

  // Slope between the two picked graph points, from the student's data
  function pickedSlope(ctx, plotKey) {
    const pts = ctx.plotPoints(plotKey);
    const [a, b] = (ctx.sess.picks || []).map(i => pts[i]);
    if (!a || !b || a.x === b.x) return null;
    return { a, b, m: (b.y - a.y) / (b.x - a.x) };
  }

  function slopeCheck(raw, ctx, plotKey, unit) {
    const v = Engine.parseNum(raw);
    if (v === null) return { ok: null, msg: 'Type a number first.' };
    const s = pickedSlope(ctx, plotKey);
    const rise = s.b.y - s.a.y, run = s.b.x - s.a.x;
    if (near(v, s.m, 0.03, 0.02)) return { ok: true, msg: `slope = ${show(rise)} ÷ ${show(run)} = ${fmt(s.m, 2)} ${unit}` };
    let why = 'Not quite.';
    if (near(v, run / rise, 0.03, 0.02)) why = 'You divided upside down. Slope = rise ÷ run: the change UP the graph goes on top.';
    else if (near(v, s.b.y / s.b.x, 0.03, 0.02) || near(v, s.a.y / s.a.x, 0.03, 0.02)) why = 'You used only one point. Slope uses the CHANGE between two points: (second − first).';
    else if (near(v, rise, 0.03, 0.02)) why = 'That is only the rise. Divide it by the run (the change in time).';
    return { ok: false, msg: `${why} With your two points: <span class="formula">slope = ${show(rise)} ÷ ${show(run)} = ${fmt(s.m, 2)} ${unit}</span>. Pick two different points and try again.` };
  }

  const STROBE = {
    id: 'lab2', label: 'Lab 2', title: 'Strobe Photo Lab', kind: 'strobe', weight: 2, icon: '🔬',
    gen: genLab1,
    newTable: sc => sc.rows.map(() => ({ t: '', x: '', y: '', dx: '', drop: '', fall: '', t2: '' })),
    columns: [
      { key: 'k', label: 'Ghost #', given: (r) => String(r) },
      // Periods 1–6 get the times; Honors calculates them
      { key: 't', label: 't (s)', from: 'st_tCol', givenIf: ctx => !ctx.full, value: (r, ctx) => ctx.sc.rows[r].t },
      { key: 'x', label: 'x (m)', from: 'st_measure', world: 'x' },
      { key: 'y', label: 'y (m)', from: 'st_measure', world: 'y' },
      { key: 'dx', label: 'Δx (m)', from: 'st_dxCol', world: 'x', blankRow0: true, honors: true },
      { key: 'drop', label: 'Drop (m)', from: 'st_dropCol', world: 'y', blankRow0: true, honors: true },
      { key: 'fall', label: 'Fallen (m)', from: 'st_fallCol', honors: true },
      { key: 't2', label: 't² (s²)', from: 'st_t2Col', honors: true }
    ],
    plots: {
      xt: ctx => ({ title: 'Sideways position x vs. time', xLabel: 't (s)', yLabel: 'x (m)', color: ctx.color('x'), points: colPoints(ctx, 't', 'x'), connect: true }),
      yt: ctx => ({ title: 'Height y vs. time', xLabel: 't (s)', yLabel: 'y (m)', color: ctx.color('y'), points: colPoints(ctx, 't', 'y'), connect: true }),
      ft2: ctx => ({ title: 'Distance fallen vs. t²', xLabel: 't² (s²)', yLabel: 'fallen (m)', color: ctx.color('v'), points: colPoints(ctx, 't2', 'fall'), connect: true })
    },
    stage: (ctx, sess) => ({ strobeDt: sess.sc.dt, numberGhosts: true, noBucket: true, photoVx: sess.launched ? sess.sc.vx : null }),
    // Ghosts the student measures. The rest are filled in ("by your lab partner") so the graphs are complete.
    measureRows: ctx => ctx.full ? ctx.sc.rows.map((_, i) => i) : ctx.support ? [2, 3] : [1, 2, 3],
    tasks: ['st_intro', 'st_launch', 'st_findHeight', 'st_readHeight', 'st_findGate', 'st_tCol', 'st_measure',
      'st_shapeX', 'st_shapeY', 'st_dxCol', 'st_dxPattern', 'st_dropCol', 'st_biggestDrop', 'st_fastest',
      'st_slope', 'st_slopeMeaning', 'st_readGraph', 'st_formula',
      'st_fallCol', 'st_t2Col', 'st_gSlope', 'st_g']
  };

  // ---------- Lab 2: Speed Test ----------
  const L2_POOL = [{ dy: 5, as: [1.5, 2] }, { dy: 20, as: [1, 1.5] }, { dy: 3.2, as: [1, 1.5] }];

  function genLab2(avoidKey) {
    const opts = L2_POOL.flatMap(p => p.as.map(a => ({ dy: p.dy, a }))).filter(o => `${o.dy}|${o.a}` !== avoidKey);
    const o = pick(opts);
    const T = Phys.time(o.dy);
    const speeds = [1, 2, 3, 4].map(n => Number((n * o.a).toFixed(2)));
    return { dy: o.dy, a: o.a, T, speeds, runway: niceCeil(4 * o.a * T * 1.25), key: `${o.dy}|${o.a}`, dx: speeds[3] * T, vx: speeds[0] };
  }
  // Untested speeds between trials, on the dial's 0.1 m/s steps
  const predictSpeeds = sc => [1.5, 2.5, 3.5].map(n => Math.round(n * sc.a * 10) / 10);

  const SPEED = {
    id: 'lab1', label: 'Lab 1', title: 'Speed Test Lab', kind: 'speed', weight: 3, icon: '📈',
    gen: genLab2,
    newTable: sc => sc.speeds.map(() => ({ dx: '', t: '' })).concat([{ dx: '', t: '' }]),
    rowLabel: (r, ctx) => r < 4 ? String(r + 1) : '🔮',
    columns: [
      { key: 'n', label: 'Trial', given: (r, ctx) => (r < 4 ? String(r + 1) : '🔮 Test') },
      { key: 'v', label: 'v_x (m/s)', given: (r, ctx) => r < 4 ? fmt(ctx.sc.speeds[r], 1) : (ctx.sess.vals.p ? fmt(ctx.sess.vals.p, 1) : '') },
      { key: 'dx', label: 'Δx (m)', from: 'sp_trial', world: 'x' },
      { key: 't', label: 't (s)', from: 'sp_trial' }
    ],
    visibleRows: ctx => ctx.reached('sp_predict') ? 5 : 4,
    plots: {
      rv: ctx => ({
        title: 'Landing distance Δx vs. launch speed v_x', xLabel: 'v_x (m/s)', yLabel: 'Δx (m)', color: ctx.color('x'),
        points: [0, 1, 2, 3].map(i => ({ x: ctx.sc.speeds[i], y: ctx.val(i, 'dx'), row: i })).filter(p => p.y !== null), connect: true
      })
    },
    stage: (ctx, sess) => {
      const done = [0, 1, 2, 3, 4].filter(i => sess.landed && sess.landed[i] !== undefined);
      return {
        noBucket: true, timer: true,
        launchVx: sess.dial === null ? null : sess.dial,
        marks: done.map(i => ({ x: sess.landed[i], label: i < 4 ? String(i + 1) : '🔮' })),
        pastPaths: done.map(i => sess.landedVx[i])
      };
    },
    tasks: ['sp_intro', 'sp_plan', 'sp_findFloor', 'sp_readFloor', 'sp_findTimer', 'sp_trial', 'sp_timeCol', 'sp_shape', 'sp_slope', 'sp_slopeMeaning',
      'sp_predict', 'sp_test', 'sp_height4x']
  };

  // ---------- Task definitions ----------
  const T = {
    // ===== Lab 1 =====
    st_intro: {
      type: 'info',
      text: () => `<p><strong>🔬 Strobe Photo Lab.</strong> A <strong>strobe light</strong> flashes again and again at a steady beat, like a camera flash going off every split second.
        Each flash leaves a "ghost" picture of the ball. That lets you see where the ball was at each moment.</p>
        <p>You will: <strong>1)</strong> launch the ball, <strong>2)</strong> measure ghosts, <strong>3)</strong> graph your data, and <strong>4)</strong> find out what your data says about sideways and downward motion.</p>`
    },

    st_launch: {
      type: 'launch',
      text: () => `<p><strong>🚀 Launch the ball.</strong> Press <strong>LAUNCH</strong> under the picture and watch the ball fly. The ghosts will stay on the screen, numbered 0, 1, 2, …</p>`,
      landed: () => '📸 Strobe photo taken! Ghost 0 is the ball leaving the launcher. The last ghost is the ball hitting the floor.'
    },

    st_findHeight: {
      type: 'findread',
      text: (ctx, sess) => sess.phase === 'find'
        ? `<p><strong>🔎 Where to look: height.</strong> One ruler measures how HIGH the ball is. <strong>Click on that ruler.</strong></p>`
        : `<p>✓ That's the <strong>height ruler</strong>. It stands on the floor, so <strong>0 m is the floor</strong>. The numbers are meters.</p>
           <p>The yellow box in the bottom-left corner tells you what one small tick is worth. On this ruler: <strong>1 small tick = ${X(ctx.ruler.y)} m</strong>.</p>`,
      find: { regions: ['height'], wrong: r => r === 'floor' ? 'That ruler lies flat on the floor. It measures sideways distance. Look for the ruler that stands UP.' : 'Look for the yellow ruler standing up on the LEFT, next to the cliff.' },
      highlight: 'height'
    },

    st_readHeight: {
      type: 'practice', ruler: 'height',
      text: ctx => `<p><strong>🎯 Practice reading the height ruler.</strong> The purple arrow ➤ points at one spot. Read it in 3 steps. Zoom in with your mouse.</p>`,
      hints: ctx => [
        'Step 1: find the closest NUMBER on the ruler that is BELOW the arrow.',
        'Step 2: start at that number and count the small tick spaces going UP until you reach the arrow.',
        `Step 3: each tick is ${X(ctx.ruler.y)} m. Multiply the ticks by ${X(ctx.ruler.y)}, then add the number from step 1.`
      ]
    },

    st_findGate: {
      honors: true, type: 'findread',
      text: (ctx, sess) => sess.phase === 'find'
        ? `<p><strong>🔎 Where to look: launch speed.</strong> A sensor measured how fast the ball left the launcher. <strong>Click on its display.</strong></p>`
        : `<p>✓ That's the <strong>photogate</strong>. A photogate is a beam of invisible light across the launcher's opening, like the sensor that stops a garage door.
           The ball blocks the beam for a split second. Ball width ÷ blocked time = speed.</p>
           <p><strong>Read the launch speed v_x.</strong></p>`,
      find: { regions: ['gate'], wrong: () => 'Look for the green number display above the launcher. It shows a speed in m/s.' },
      highlight: 'gate',
      read: { label: 'v_x =', unit: 'm/s', answer: ctx => ctx.sc.vx, tol: () => 0.05, store: 'vx', retryNew: true,
        wrong: ctx => `The photogate display shows ${fmt(ctx.sc.vx, 1)} m/s. Copy the display exactly.` }
    },

    st_tCol: {
      honors: true, type: 'column', col: 't', rows: ctx => ctx.sess.table.map((_, i) => i),
      text: () => `<p><strong>⏱ Fill in the time column.</strong> Find the strobe's beat in the top-right corner of the picture ("one ghost every … s").</p>
        <p>Each ghost is one flash later: <span class="formula">t = ghost # × time between flashes</span></p>`,
      expected: (r, ctx) => r * ctx.sc.dt,
      tol: () => 0.0011,
      explain: (r, ctx) => `Ghost ${r}: t = ${r} × ${X(ctx.sc.dt)} s = ${X(r * ctx.sc.dt)} s.`,
      hints: ctx => ['Look in the top-right corner of the picture for "one ghost every … s".', 'Ghost 0 is the launch, so its time is 0 s.', `Ghost 2 is two flashes later: 2 × ${X(ctx.sc.dt)} = ?`],
      calc: true
    },

    st_measure: {
      type: 'measure',
      text: (ctx, sess) => {
        const r = sess.row;
        const lead = `<p><strong>📏 Measure ghost ${r}</strong> (row ${r} of your table).</p>`;
        if (sess.mi > 0) return lead + `<p>The crosshair moved to ghost ${r}. Read <strong>x</strong> and <strong>y</strong> at the red lines in the two zoom boxes on the right.</p>`;
        // First ghost: full directions, plus a worked example from a row the "lab partner" filled in
        let worked = '';
        const w = r - 1;
        if (!ctx.full && w >= 0) {
          const g = ctx.sc.rows[w];
          const px = ctx.readParts(g.x, 'x'), py = ctx.readParts(g.y, 'y');
          const say = (p, v) => p.k ? `${X(p.base)} + ${p.k} tick${p.k > 1 ? 's' : ''} × ${X(p.step)} = <strong>${X(v)} m</strong>` : `right on ${X(p.base)} → <strong>${X(v)} m</strong>`;
          worked = `<div class="worked-note">📋 Your lab partner filled in the gray rows. <strong>Row ${w} worked example:</strong><br>
            x: ${say(px, g.x)}<br>y: ${say(py, g.y)}</div>`;
        }
        return lead + worked + `<p>The crosshair ⊕ is on ghost ${r}. Read <strong>x</strong> and <strong>y</strong> at the red lines in the two purple <strong>zoom boxes</strong> on the right: the number before the line + ticks × tick size.</p>`;
      },
      checkRow: (r, ctx) => {
        const truth = ctx.sc.rows[r];
        const xs = ctx.ruler.x * 1.01 + 1e-9, ys = ctx.ruler.y * 1.01 + 1e-9;
        const x = ctx.val(r, 'x'), y = ctx.val(r, 'y');
        const bad = [];
        if (x === null || y === null) return { ok: null, msg: 'Type both x and y for this row.' };
        if (Math.abs(x - truth.x) > xs) bad.push(['x', x > truth.x ? `x is too big. Follow the red line straight DOWN from ghost ${r} to the floor ruler.` : `x is too small. Follow the red line straight DOWN from ghost ${r} to the floor ruler.`]);
        if (Math.abs(y - truth.y) > ys) bad.push(['y', y > truth.y ? `y is too big. Follow the red line straight LEFT from ghost ${r} to the height ruler.` : `y is too small. Follow the red line straight LEFT from ghost ${r} to the height ruler.`]);
        if (!bad.length) return { ok: true };
        const c = ctx.sess.crosshair;
        const g = truth;
        const off = c ? Math.hypot((c.x - g.x) * ctx.scale, (c.y - g.y) * ctx.scale) : 99;
        const where = off > 9 ? ` The crosshair isn't on ghost ${r}: click ghost ${r} to put it back.` : '';
        return { ok: false, bad: bad.map(b => b[0]), msg: bad.map(b => b[1]).join(' ') + where + ` Each small tick is ${X(ctx.ruler.x)} m on the floor ruler and ${X(ctx.ruler.y)} m on the height ruler.` };
      },
      hints: ctx => [
        'Look inside each purple zoom box. The red line shows the exact spot to read.',
        'Find the number just before the red line, then count the small ticks up to the line. Reading = number + ticks × tick size (see the yellow box in the corner).',
        'Ghost 0 is still at the launcher, so its x is 0 m (the cliff edge). Its y is the launch height.'
      ]
    },

    st_shapeX: {
      type: 'mc', retry: true, left: 'graphs', plots: ['xt', 'yt'],
      text: () => `<p><strong>📈 Your data is graphed!</strong> Look at the LEFT graph: <strong>sideways position x vs. time</strong>.</p><p>What shape do your points make?</p>`,
      options: () => [
        { t: 'A straight line going up', ok: true, why: 'Yes! A straight line means x grows by the same amount every flash: steady sideways speed.' },
        { t: 'A curve that gets steeper and steeper', ok: false, why: 'Look again at the LEFT graph (x vs. time). The points line up in a straight line.' },
        { t: 'A flat line', ok: false, why: 'A flat line would mean the ball never moves sideways. Your x values grow every flash.' }
      ]
    },

    st_shapeY: {
      type: 'mc', retry: true, left: 'graphs', plots: ['xt', 'yt'],
      text: () => `<p>Now look at the RIGHT graph: <strong>height y vs. time</strong>.</p><p>What shape do your points make?</p>`,
      options: () => [
        { t: 'A curve that drops slowly at first, then faster', ok: true, why: 'Yes! The curve gets steeper. The ball falls a little at first, then more and more each flash.' },
        { t: 'A straight line going down', ok: false, why: 'Look closely: the first steps down are small and the last ones are big. It curves.' },
        { t: 'A straight line going up', ok: false, why: 'Height goes DOWN as the ball falls, and the line bends.' }
      ]
    },

    st_dxCol: {
      honors: true, type: 'column', col: 'dx', left: 'graphs', plots: ['xt', 'yt'], rows: ctx => ctx.sess.table.map((_, i) => i).slice(1),
      text: () => `<p><strong>➡ How far sideways between flashes?</strong> Fill in the <strong>Δx</strong> column using YOUR x values.</p>
        <p><span class="formula">Δx = x in this row − x in the row above</span></p>`,
      expected: (r, ctx) => ctx.val(r, 'x') - ctx.val(r - 1, 'x'),
      tol: (r, ctx) => 0.011 + 0.005 * Math.abs(ctx.val(r, 'x')),
      explain: (r, ctx) => `Row ${r}: Δx = ${show(ctx.val(r, 'x'))} − ${show(ctx.val(r - 1, 'x'))} = ${show(ctx.val(r, 'x') - ctx.val(r - 1, 'x'))} m.`,
      hints: () => ['Use the x column of YOUR table.', 'Row 1: subtract row 0\'s x from row 1\'s x.', 'Then row 2 minus row 1, row 3 minus row 2, and so on.'],
      calc: true
    },

    st_dxPattern: {
      honors: true, type: 'mc', retry: true, left: 'graphs', plots: ['xt', 'yt'],
      text: () => `<p>Look down your <strong>Δx</strong> column. What do you notice?</p>`,
      options: () => [
        { t: 'The Δx values are all about the same', ok: true, why: 'Right! The ball moves the same distance sideways every flash. Its sideways speed never changes (a = 0 sideways).' },
        { t: 'The Δx values get bigger', ok: false, why: 'Check your Δx column again. The numbers stay about the same (small differences are just measuring error).' },
        { t: 'The Δx values get smaller', ok: false, why: 'Check your Δx column again. The numbers stay about the same (small differences are just measuring error).' }
      ]
    },

    st_dropCol: {
      honors: true, type: 'column', col: 'drop', left: 'graphs', plots: ['xt', 'yt'], rows: ctx => ctx.sess.table.map((_, i) => i).slice(1),
      text: () => `<p><strong>⬇ How far does it drop between flashes?</strong> Fill in the <strong>Drop</strong> column using YOUR y values.</p>
        <p><span class="formula">Drop = y in the row above − y in this row</span> (bigger minus smaller, so it is positive)</p>`,
      expected: (r, ctx) => ctx.val(r - 1, 'y') - ctx.val(r, 'y'),
      tol: (r, ctx) => 0.011 + 0.005 * Math.abs(ctx.val(r - 1, 'y')),
      explain: (r, ctx) => `Row ${r}: Drop = ${show(ctx.val(r - 1, 'y'))} − ${show(ctx.val(r, 'y'))} = ${show(ctx.val(r - 1, 'y') - ctx.val(r, 'y'))} m.`,
      hints: () => ['Use the y column of YOUR table.', 'Row 1: row 0\'s y minus row 1\'s y.', 'Then row 1 minus row 2, row 2 minus row 3, and so on.'],
      calc: true
    },

    st_biggestDrop: {
      honors: true, type: 'pickRow', retry: true, left: 'graphs', plots: ['xt', 'yt'],
      text: () => `<p><strong>👆 Click the row in your table</strong> where the ball dropped the MOST in one flash.</p>`,
      okRow: (r, ctx) => {
        const drops = ctx.sess.table.map((_, i) => i).slice(1).map(i => ({ i, d: ctx.val(i, 'drop') }));
        const max = Math.max(...drops.map(d => d.d));
        const ok = r > 0 && Math.abs(ctx.val(r, 'drop') - max) < 1e-9;
        return ok ? { ok: true, msg: `Yes! Row ${r} has the biggest drop (${show(max)} m). Each flash the ball falls farther than the flash before: it is <strong>speeding up</strong> downward. That's gravity.` }
          : { ok: false, msg: r === 0 ? 'Row 0 has no drop yet. Look at the Drop column.' : `Row ${r} dropped ${show(ctx.val(r, 'drop'))} m. Look down the Drop column for the biggest number.` };
      }
    },

    st_fastest: {
      type: 'pickPoint', retry: true, left: 'graphs', plots: ['xt', 'yt'], plot: 'yt',
      text: () => `<p><strong>👆 On the height graph (right)</strong>, click the point where the ball was falling the FASTEST.</p>
        <p>Hint: where is the curve the steepest?</p>`,
      okPoint: (i, ctx) => {
        const pts = ctx.plotPoints('yt');
        return i >= pts.length - 2 ? { ok: true, msg: 'Yes! The graph is steepest at the end. Steep means the height is changing fast: the ball is falling fastest just before it lands.' }
          : { ok: false, msg: 'That part of the curve is not the steepest. Find where the curve goes down most sharply.' };
      }
    },

    st_slope: {
      honors: true, type: 'pick2', retry: true, left: 'graphs', plots: ['xt', 'yt'], plot: 'xt', unit: 'm/s', label: 'slope =',
      text: (ctx, sess) => {
        const s = pickedSlope(ctx, 'xt');
        const head = `<p><strong>📐 Find the slope of your x vs. time graph (left).</strong> Click TWO points on it.</p>`;
        if (!s) return head + `<p>Picked: ${(sess.picks || []).length} of 2.</p>`;
        return head + `<p>Your points: <span class="formula">P1 = (${show(s.a.x)} s, ${show(s.a.y)} m)</span> and <span class="formula">P2 = (${show(s.b.x)} s, ${show(s.b.y)} m)</span></p>
          <p><span class="formula">slope = (x₂ − x₁) ÷ (t₂ − t₁)</span></p>`;
      },
      check: (raw, ctx) => slopeCheck(raw, ctx, 'xt', 'm/s'),
      onCorrect: (ctx, v) => { ctx.sess.vals.slopeX = v; },
      hints: () => ['Points far apart give the best slope. Try the first and last points.', 'Rise = x₂ − x₁ (meters). Run = t₂ − t₁ (seconds).', 'Divide: rise ÷ run.'],
      calc: true
    },

    st_slopeMeaning: {
      honors: true, type: 'mc', retry: true, left: 'graphs', plots: ['xt', 'yt'],
      text: ctx => `<p>Your slope: <span class="formula">${show(ctx.sess.vals.slopeX)} m/s</span>. The photogate read <span class="formula">v_x = ${show(ctx.sess.vals.vx)} m/s</span>.</p>
        <p>What does the slope of the x vs. time graph tell you?</p>`,
      options: () => [
        { t: 'The ball\'s sideways speed, v_x', ok: true, why: 'Yes! Slope = meters per second = speed. It matches the photogate, and it stays the same the whole flight.' },
        { t: 'How fast the ball falls', ok: false, why: 'The x graph only shows sideways motion. Its slope (m/s) is the sideways speed, the same number the photogate shows.' },
        { t: 'The height of the cliff', ok: false, why: 'The slope has units of m/s, so it is a speed. It matches the photogate: the sideways speed.' }
      ]
    },

    st_readGraph: {
      honors: true, type: 'num', retry: true, left: 'graphs', plots: ['xt', 'yt'], unit: 'm', label: 'x =',
      enter: sess => { const opts = [0.5, 1.5, 2.5, 3.5].filter(v => v !== sess.vals.tqN); sess.vals.tqN = pick(opts); },
      text: ctx => `<p><strong>🔍 Read your graph.</strong> No ghost was taken at <span class="formula">t = ${X(ctx.sess.vals.tqN * ctx.sc.dt)} s</span>. Where was the ball sideways then?</p>
        <p>On the LEFT graph, find ${X(ctx.sess.vals.tqN * ctx.sc.dt)} s on the time axis, go UP to the line, then across to the x axis. The red dashed lines follow your mouse.</p>`,
      check: (raw, ctx) => {
        const v = Engine.parseNum(raw);
        if (v === null) return { ok: null, msg: 'Type a number first.' };
        const tq = ctx.sess.vals.tqN * ctx.sc.dt;
        const mine = interp(ctx.plotPoints('xt'), tq);
        const truth = ctx.sc.vx * tq;
        const tol = Math.max(ctx.ruler.x * 1.5, 0.05 * truth);
        if ((mine !== null && Math.abs(v - mine) <= tol) || Math.abs(v - truth) <= tol) return { ok: true, msg: `About ${show(mine === null ? truth : mine)} m. Reading between data points is called <strong>interpolating</strong>.` };
        return { ok: false, msg: `Not quite. Halfway between two ghosts in time, the ball is halfway between their x values. Your graph gives about ${show(mine === null ? truth : mine)} m. You'll get a new time to try.` };
      },
      hints: ctx => [`Find ${X(ctx.sess.vals.tqN * ctx.sc.dt)} s on the bottom axis.`, 'It is halfway between two of your points. Go up to the line between them.', 'Then go straight left to the x axis and read the value.']
    },

    st_formula: {
      honors: true, type: 'num', retry: true, unit: 's', label: 't =',
      text: ctx => `<p><strong>🧮 Check with the formula.</strong> Your row 0 says the launch height was <span class="formula">Δy = ${show(ctx.val(0, 'y'))} m</span>.</p>
        <p>Use <span class="formula">t = √(Δy ÷ 5)</span> to find how long the ball should fall.</p>`,
      check: (raw, ctx) => {
        const v = Engine.parseNum(raw);
        if (v === null) return { ok: null, msg: 'Type a number first.' };
        const y0 = ctx.val(0, 'y');
        const mine = Math.sqrt(Math.max(y0, 0) / 5);
        const last = ctx.val(ctx.sess.table.length - 1, 't');
        if (near(v, mine) || near(v, ctx.sc.T)) return { ok: true, msg: `t = √(${show(y0)} ÷ 5) = ${f2(mine)} s. Your strobe photo shows the ball landing at the last ghost, t = ${show(last)} s. The formula matches your data!` };
        const res = Engine.check('t', raw, { dy: y0, vx: ctx.sc.vx, t: mine });
        return { ok: false, msg: res.msg + ' You can try again.' };
      },
      hints: ctx => [`Δy = ${show(ctx.val(0, 'y'))} m (from row 0).`, `Divide by 5 first: ${show(ctx.val(0, 'y'))} ÷ 5 = ?`, 'Then take the square root (√).'],
      calc: true
    },

    st_fallCol: {
      type: 'column', col: 'fall', honors: true, left: 'graphs', plots: ['xt', 'yt'], rows: ctx => ctx.sess.table.map((_, i) => i),
      text: () => `<p><strong>⭐ Honors: test g = 10 m/s² with your data.</strong> Fill in the <strong>Fallen</strong> column: the total distance the ball has fallen.</p>
        <p><span class="formula">Fallen = y in row 0 − y in this row</span></p>`,
      expected: (r, ctx) => ctx.val(0, 'y') - ctx.val(r, 'y'),
      tol: (r, ctx) => 0.011 + 0.005 * Math.abs(ctx.val(0, 'y')),
      explain: (r, ctx) => `Row ${r}: Fallen = ${show(ctx.val(0, 'y'))} − ${show(ctx.val(r, 'y'))} = ${show(ctx.val(0, 'y') - ctx.val(r, 'y'))} m.`,
      calc: true
    },

    st_t2Col: {
      type: 'column', col: 't2', honors: true, left: 'graphs', plots: ['ft2'], rows: ctx => ctx.sess.table.map((_, i) => i),
      text: () => `<p><strong>⭐ Fill in the t² column.</strong> Square each time: <span class="formula">t² = t × t</span></p>
        <p>The graph on the left will plot Fallen vs. t².</p>`,
      expected: (r, ctx) => ctx.val(r, 't') ** 2,
      tol: (r, ctx) => 0.0011 + 0.005 * ctx.val(r, 't') ** 2,
      explain: (r, ctx) => `Row ${r}: t² = ${show(ctx.val(r, 't'))} × ${show(ctx.val(r, 't'))} = ${fmtExact(ctx.val(r, 't') ** 2, 4)} s².`,
      calc: true
    },

    st_gSlope: {
      type: 'pick2', retry: true, honors: true, left: 'graphs', plots: ['ft2'], plot: 'ft2', unit: 'm/s²', label: 'slope =',
      text: (ctx, sess) => {
        const s = pickedSlope(ctx, 'ft2');
        const head = `<p><strong>⭐ Fallen vs. t² is a straight line.</strong> Since fallen = ½ g t², its slope is ½ g. Click TWO points to find the slope.</p>`;
        if (!s) return head + `<p>Picked: ${(sess.picks || []).length} of 2.</p>`;
        return head + `<p><span class="formula">P1 = (${fmtExact(s.a.x, 4)}, ${show(s.a.y)})</span> and <span class="formula">P2 = (${fmtExact(s.b.x, 4)}, ${show(s.b.y)})</span></p>`;
      },
      check: (raw, ctx) => slopeCheck(raw, ctx, 'ft2', 'm/s²'),
      onCorrect: (ctx, v) => { ctx.sess.vals.slopeG = v; },
      calc: true
    },

    st_g: {
      type: 'num', retry: true, honors: true, left: 'graphs', plots: ['ft2'], unit: 'm/s²', label: 'g =',
      text: ctx => `<p><strong>⭐ Your slope = ½ g = ${show(ctx.sess.vals.slopeG)} m/s².</strong> What value of g does your data give?</p>
        <p><span class="formula">g = 2 × slope</span></p>`,
      check: (raw, ctx) => {
        const v = Engine.parseNum(raw);
        if (v === null) return { ok: null, msg: 'Type a number first.' };
        const g = 2 * ctx.sess.vals.slopeG;
        if (near(v, g)) return { ok: true, msg: `g = 2 × ${show(ctx.sess.vals.slopeG)} = ${fmt(g, 1)} m/s². ${Math.abs(g - 10) <= 1 ? 'Very close to 10 m/s²!' : 'Close to 10 m/s². Measuring error makes small differences.'} Your own measurements found gravity.` };
        return { ok: false, msg: `Multiply your slope by 2: <span class="formula">g = 2 × ${show(ctx.sess.vals.slopeG)} = ${fmt(g, 1)} m/s²</span>. Try again.` };
      },
      calc: true
    },

    // ===== Lab 2 =====
    sp_intro: {
      type: 'info',
      text: () => `<p><strong>📈 Speed Test Lab.</strong> Question: <strong>If you launch the ball faster, does it stay in the air longer? Does it land farther?</strong></p>
        <p>You will run 4 trials, measure each landing spot and flight time, then graph your results.</p>`
    },

    sp_plan: {
      type: 'mc', retry: true,
      text: () => `<p><strong>📝 Plan a fair test.</strong> To find out what launch speed does, what should you change from trial to trial?</p>`,
      options: () => [
        { t: 'Change ONLY the launch speed. Keep the same cliff.', ok: true, why: 'Yes! Change one thing (launch speed) and keep everything else the same (cliff height). Then any difference is caused by the speed.' },
        { t: 'Change the launch speed AND the cliff height', ok: false, why: 'If you change two things, you can\'t tell which one caused the difference. Change only one thing.' },
        { t: 'Change only the cliff height', ok: false, why: 'Our question is about launch speed, so launch speed is the thing to change. Keep the cliff the same.' }
      ]
    },

    sp_findFloor: {
      type: 'findread',
      text: (ctx, sess) => sess.phase === 'find'
        ? `<p><strong>🔎 Where to look: landing distance.</strong> One ruler measures how far the ball lands from the bottom of the cliff. <strong>Click on that ruler.</strong></p>`
        : `<p>✓ That's the <strong>floor ruler</strong>. <strong>0 m is the bottom of the cliff</strong>, right under the launcher.</p>
           <p>The yellow corner box says: <strong>Floor: 1 small tick = ${X(ctx.ruler.x)} m</strong>.</p>`,
      find: { regions: ['floor'], wrong: r => r === 'height' ? 'That ruler stands up. It measures height. Look for the ruler lying flat along the floor.' : 'Look for the yellow ruler lying flat along the bottom of the picture.' },
      highlight: 'floor'
    },

    sp_readFloor: {
      type: 'practice', ruler: 'floor',
      text: ctx => `<p><strong>🎯 Practice reading the floor ruler.</strong> The purple arrow points down at one spot. Read it in 3 steps.</p>`,
      hints: ctx => [
        'Step 1: find the closest NUMBER on the ruler to the LEFT of the arrow.',
        'Step 2: start at that number and count the small tick spaces going RIGHT until you reach the arrow.',
        `Step 3: each tick is ${X(ctx.ruler.x)} m. Multiply the ticks by ${X(ctx.ruler.x)}, then add the number from step 1.`
      ]
    },

    sp_findTimer: {
      type: 'findread',
      text: (ctx, sess) => sess.phase === 'find'
        ? `<p><strong>🔎 Where to look: flight time.</strong> This lab adds a <strong>flight timer</strong>. <strong>Click on it.</strong></p>`
        : `<p>✓ That's the <strong>flight timer</strong>. It starts when the ball leaves the photogate and stops when the ball hits the floor.</p>`,
      find: { regions: ['timer'], wrong: r => r === 'gate' ? 'That is the photogate. It shows speed. Look for the display that shows seconds (s).' : 'Look for the green display in the top-RIGHT corner of the picture.' },
      highlight: 'timer'
    },

    sp_trial: {
      type: 'trial',
      text: (ctx, sess) => {
        const r = sess.row;
        const v = fmt(ctx.sc.speeds[r], 1);
        const launched = sess.landed[r] !== undefined && Math.abs(sess.landedVx[r] - ctx.sc.speeds[r]) < 1e-6;
        let worked = '';
        if (ctx.support && r === 1) {
          // Periods 1–3: trial 1 was run and recorded as a worked example
          const d = ctx.sc.speeds[0] * ctx.sc.T, p = ctx.readParts(d, 'x');
          worked = `<div class="worked-note">📋 <strong>Trial 1 was done for you as an example.</strong> Flag 1 is ${p.k ? `${p.k} tick${p.k > 1 ? 's' : ''} past ${X(p.base)}: ${X(p.base)} + ${p.k} × ${X(p.step)} = <strong>${X(d)} m</strong>` : `right on <strong>${X(d)} m</strong>`}. The timer read <strong>${f2(ctx.sc.T)} s</strong>.</div>`;
        }
        if (!launched) return worked + `<p><strong>🧪 Trial ${r + 1} of 4.</strong> Set the dial to <strong>${v} m/s</strong> (the speed in row ${r + 1}). Check the photogate, then press <strong>LAUNCH</strong>.</p>`;
        return worked + `<p><strong>🧪 Trial ${r + 1}: measure.</strong> Read where the ball landed (flag ${r + 1}) in the purple <strong>floor ruler zoom</strong> box, and read the <strong>flight timer</strong>. Type both in row ${r + 1}.</p>`;
      },
      checkRow: (r, ctx) => {
        const truthX = ctx.sc.speeds[r] * ctx.sc.T;
        const x = ctx.val(r, 'dx'), t = ctx.val(r, 't');
        if (x === null || t === null) return { ok: null, msg: 'Type both Δx and t for this row.' };
        const bad = [], msgs = [];
        if (Math.abs(x - truthX) > ctx.ruler.x * 1.01 + 1e-9) { bad.push('dx'); msgs.push(`Δx is too ${x > truthX ? 'big' : 'small'}. Zoom in on the floor ruler right under flag ${r + 1}. Each small tick is ${X(ctx.ruler.x)} m.`); }
        if (Math.abs(t - ctx.sc.T) > 0.011) { bad.push('t'); msgs.push('Read the flight timer (top right) exactly. It shows seconds.'); }
        return bad.length ? { ok: false, bad, msg: msgs.join(' ') } : { ok: true };
      },
      hints: ctx => ['Use the + and − buttons or slide the dial until it shows the speed in your table.', 'After landing, a numbered flag marks the spot. Read the floor ruler under it.', 'The timer is the green display in the top-right corner.']
    },

    sp_timeCol: {
      type: 'mc', retry: true, left: 'graphs', plots: ['rv'],
      text: () => `<p><strong>🔍 Look at the t column</strong> in your table. As the launch speed went UP, what happened to the time in the air?</p>`,
      options: () => [
        { t: 'It stayed the same', ok: true, why: 'Yes! Every trial fell for the same time. Only the cliff height sets the time in the air. Sideways speed has nothing to do with falling.' },
        { t: 'It got longer', ok: false, why: 'Check your t column: all four times are the same.' },
        { t: 'It got shorter', ok: false, why: 'Check your t column: all four times are the same.' }
      ]
    },

    sp_shape: {
      type: 'mc', retry: true, left: 'graphs', plots: ['rv'],
      text: () => `<p><strong>📈 Look at your graph</strong> of landing distance Δx vs. launch speed v_x. What shape do your points make?</p>`,
      options: () => [
        { t: 'A straight line going up', ok: true, why: 'Yes! Double the speed → double the distance. Distance is proportional to launch speed.' },
        { t: 'A curve that levels off', ok: false, why: 'Look again: each extra bit of speed adds the same extra distance. The points make a straight line.' },
        { t: 'A flat line', ok: false, why: 'A flat line would mean speed doesn\'t matter. Faster launches landed farther.' }
      ]
    },

    sp_slope: {
      type: 'pick2', retry: true, left: 'graphs', plots: ['rv'], plot: 'rv', unit: 's', label: 'slope =',
      text: (ctx, sess) => {
        const s = pickedSlope(ctx, 'rv');
        const head = `<p><strong>📐 Find the slope of your graph.</strong> Click TWO points.</p>`;
        if (!s) return head + `<p>Picked: ${(sess.picks || []).length} of 2.</p>`;
        return head + `<p><span class="formula">P1 = (${show(s.a.x)} m/s, ${show(s.a.y)} m)</span> and <span class="formula">P2 = (${show(s.b.x)} m/s, ${show(s.b.y)} m)</span></p>
          <p><span class="formula">slope = (Δx₂ − Δx₁) ÷ (v₂ − v₁)</span></p>`;
      },
      check: (raw, ctx) => slopeCheck(raw, ctx, 'rv', 's'),
      onCorrect: (ctx, v) => { ctx.sess.vals.slopeR = v; },
      hints: () => ['Use points far apart, like trial 1 and trial 4.', 'Rise = the change in Δx (meters). Run = the change in v_x (m/s).', 'Divide: rise ÷ run. The units come out to m ÷ (m/s) = seconds.'],
      calc: true
    },

    sp_slopeMeaning: {
      type: 'mc', retry: true, left: 'graphs', plots: ['rv'],
      text: ctx => `<p>Your slope: <span class="formula">${show(ctx.sess.vals.slopeR)} s</span>. Its unit is <strong>seconds</strong>. Look at your t column.</p><p>What is the slope?</p>`,
      options: () => [
        { t: 'The time the ball is in the air', ok: true, why: 'Yes! Δx = v_x × t, so the slope of Δx vs. v_x is t. That is why Δx = v_x × t works.' },
        { t: 'The launch speed', ok: false, why: 'The slope is in seconds, not m/s. Compare it to your t column.' },
        { t: 'The cliff height', ok: false, why: 'The slope is in seconds, not meters. Compare it to your t column.' }
      ]
    },

    sp_predict: {
      type: 'num', retry: true, left: 'graphs', plots: ['rv'], unit: 'm', label: 'Δx =',
      enter: sess => { const opts = predictSpeeds(sess.sc).filter(v => v !== sess.vals.p); sess.vals.p = pick(opts); },
      text: ctx => `<p><strong>🔮 Predict.</strong> You did NOT test <span class="formula">v_x = ${fmt(ctx.sess.vals.p, 1)} m/s</span>. Where will it land?</p>
        <p>Use your graph (find ${fmt(ctx.sess.vals.p, 1)} on the bottom axis, go up to your line, then across), or use your slope: <span class="formula">Δx = v_x × slope</span>.</p>`,
      check: (raw, ctx) => {
        const v = Engine.parseNum(raw);
        if (v === null) return { ok: null, msg: 'Type a number first.' };
        const p = ctx.sess.vals.p;
        const mine = p * ctx.sess.vals.slopeR, truth = p * ctx.sc.T;
        const tol = Math.max(ctx.ruler.x * 1.5, 0.05 * truth);
        if (Math.abs(v - mine) <= tol || Math.abs(v - truth) <= tol) { ctx.sess.vals.prediction = v; return { ok: true, msg: `Prediction: about ${show(v)} m. Now test it!` }; }
        return { ok: false, msg: `Not quite. With your slope: <span class="formula">Δx = ${fmt(p, 1)} × ${show(ctx.sess.vals.slopeR)} = ${f2(mine)} m</span>. You'll get a new speed to predict.` };
      },
      hints: ctx => [`Find ${fmt(ctx.sess.vals.p, 1)} m/s on the bottom axis. It is between two of your trials.`, 'Go straight up to the line, then straight left to the Δx axis.', `Or multiply: ${fmt(ctx.sess.vals.p, 1)} × your slope.`],
      calc: true
    },

    sp_test: {
      type: 'test',
      text: (ctx, sess) => {
        const launched = sess.landed[4] !== undefined && Math.abs(sess.landedVx[4] - sess.vals.p) < 1e-6;
        if (!launched) return `<p><strong>🔮 Test your prediction (${show(sess.vals.prediction)} m).</strong> Set the dial to <strong>${fmt(sess.vals.p, 1)} m/s</strong> and press <strong>LAUNCH</strong>.</p>`;
        return '<p><strong>Measure it.</strong> Read where the ball landed (the 🔮 flag) in the purple floor ruler zoom box, and read the flight timer. Type them in the 🔮 row.</p>';
      },
      checkRow: (r, ctx) => {
        const truthX = ctx.sess.vals.p * ctx.sc.T;
        const x = ctx.val(4, 'dx'), t = ctx.val(4, 't');
        if (x === null || t === null) return { ok: null, msg: 'Type both Δx and t in the 🔮 row.' };
        const bad = [], msgs = [];
        if (Math.abs(x - truthX) > ctx.ruler.x * 1.01 + 1e-9) { bad.push('dx'); msgs.push(`Δx is too ${x > truthX ? 'big' : 'small'}. Zoom in on the floor ruler under the 🔮 flag.`); }
        if (Math.abs(t - ctx.sc.T) > 0.011) { bad.push('t'); msgs.push('Read the flight timer exactly.'); }
        if (bad.length) return { ok: false, bad, msg: msgs.join(' ') };
        const pred = ctx.sess.vals.prediction;
        const pct = Math.abs(x - pred) / x * 100;
        return { ok: true, msg: `Predicted ${show(pred)} m, measured ${show(x)} m: ${pct < 1 ? 'less than 1%' : `${fmt(pct, 0)}%`} off. ${pct <= 6 ? 'Great prediction! Your graph works.' : 'Pretty close! Measuring error explains the gap.'}` };
      }
    },

    sp_height4x: {
      type: 'mc', honors: true, retry: true, left: 'graphs', plots: ['rv'],
      text: () => `<p><strong>⭐ Honors.</strong> Suppose you repeat this whole lab on a cliff <strong>4 times as high</strong>. How would the slope of your graph change?</p>`,
      options: () => [
        { t: 'It would be 2 times as big', ok: true, why: 'Yes! The slope is the time in the air, t = √(Δy ÷ 5). Four times the height → √4 = 2 times the time.' },
        { t: 'It would be 4 times as big', ok: false, why: 'The slope is the time in the air, t = √(Δy ÷ 5). Time grows with the SQUARE ROOT of height: √4 = 2.' },
        { t: 'It would stay the same', ok: false, why: 'The slope is the time in the air, and a higher cliff means a longer fall. t = √(Δy ÷ 5), so 4× height → 2× time.' }
      ]
    }
  };

  window.LABS = [SPEED, STROBE];
  Object.assign(window.TASKS, T);
})();

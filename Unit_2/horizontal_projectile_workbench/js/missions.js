// Horizontal Projectile Workbench — Mission database (Target Missions, after Labs 1–2)
// Each mission is a pool of scenarios plus an ordered list of tasks (one shown at a time).
// A wrong answer loads a NEW scenario from the same pool and restarts that mission.
// Scaffolds fade: Missions 1–2 make students click WHERE each given is before reading it and
// plan which motion (vertical or horizontal) to solve first; later missions read both givens in one step.
// Missions 1–5 are for every class. Missions H1–H2 (impact velocity) are required for
// Period 0 (Honors) and never shown to Periods 1–6.
// Text is written for Conceptual Physics readers: short sentences, everyday words.

(function () {
  const { Phys, fmtExact, fmtAns } = window.Engine;

  const NICE = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150, 200];
  const niceCeil = v => NICE.find(n => n >= v) || Math.ceil(v / 50) * 50;

  // Turn (Δy, v_x) into a full scenario with every answer pre-computed
  function build(dy, vx, extra) {
    const t = Phys.time(dy);
    const dx = Phys.range(vx, t);
    const vy = Phys.vy(t);
    return Object.assign({
      dy, vx, t, dx, vy,
      v: Phys.speed(vx, vy),
      theta: Phys.angle(vx, vy),
      // Runway is longer than the answer by a random amount, so the landing spot isn't always mid-screen
      runway: niceCeil(dx * (1.3 + Math.random() * 0.35)),
      key: `${dy}|${vx}`
    }, extra || {});
  }

  const pick = (arr, avoidKey, keyOf) => {
    const choices = arr.filter(a => keyOf(a) !== avoidKey);
    return (choices.length ? choices : arr)[Math.floor(Math.random() * (choices.length || arr.length))];
  };
  const fromPairs = pairs => avoid => {
    const [dy, vx] = pick(pairs, avoid, p => `${p[0]}|${p[1]}`);
    return build(dy, vx);
  };
  const cross = (dys, vxs) => dys.flatMap(dy => vxs.map(vx => [dy, vx]));

  const MISSIONS = [
    {
      id: 'm1', label: '1', title: 'The One-Second Drop', kind: 'forward', weight: 1,
      gen: fromPairs(cross([5], [4, 5, 6, 7, 8, 9])),
      tasks: ['welcome', 'findDy', 'findVx', 'plan', 't', 'dx', 'place']
    },
    {
      id: 'm2', label: '2', title: 'The 20-Meter Cliff', kind: 'forward', weight: 1,
      gen: fromPairs(cross([20], [3, 4, 5, 6, 7.5, 8])),
      tasks: ['findDy', 'findVx', 'plan', 't', 'dx', 'place']
    },
    {
      id: 'm3', label: '3', title: 'Lab Tabletop Launch', kind: 'forward', weight: 1,
      gen: fromPairs([[3.2, 4.6], [3.2, 2.5], [0.8, 2.5], [0.8, 3.5], [1.8, 2.5], [1.8, 4.0]]),
      tasks: ['data', 't', 'dx', 'place']
    },
    {
      id: 'm4', label: '4', title: 'The Height Challenge', kind: 'forward', arena: true, weight: 1,
      gen: fromPairs(cross([45, 80], [8, 9.5, 12, 15])),
      tasks: ['data', 't', 'dx', 'place']
    },
    {
      id: 'm5', label: '5', title: 'The Target Hunter', kind: 'reverse', arena: true, weight: 1,
      gen: fromPairs(cross([5, 20, 45, 80], [6, 7.5, 9, 12])),
      tasks: ['findDy', 'findDx', 't', 'vx', 'dial']
    },
    {
      id: 'h1', label: 'H1', title: 'Impact Velocity: Tabletop', kind: 'forward', honors: true, weight: 1,
      gen: fromPairs([[3.2, 6], [1.8, 8], [0.8, 3]]),
      tasks: ['data', 't', 'dx', 'vy', 'vimp', 'theta', 'place']
    },
    {
      id: 'h2', label: 'H2', title: 'Impact Velocity: Cliff', kind: 'forward', honors: true, weight: 1,
      gen: fromPairs([[80, 30], [20, 15], [5, 7.5], [45, 20]]),
      tasks: ['data', 't', 'dx', 'vy', 'vimp', 'theta', 'place']
    }
  ];

  // ---------- Task definitions ----------
  // ctx = { sc, sess, mission, ruler: { x, y }, honors }
  const X = n => fmtExact(n);
  const A = n => fmtAns(n);

  const PHOTOGATE_INFO = `<details class="explain"><summary>What is a photogate?</summary>
    <p>A <strong>photogate</strong> is a beam of invisible light shining across a gap, like the sensor that stops a garage door from closing on your foot.
    When the ball passes through, it blocks the beam for a split second. The photogate times how long the beam is blocked.
    Ball width ÷ blocked time = the ball's speed. The display shows that speed in m/s.</p></details>`;

  const TASKS = {
    welcome: {
      type: 'info',
      text: () => `<p><strong>🎯 Target Missions.</strong> Your labs showed that falling and moving sideways happen at the same time, but don't affect each other. Now use that to land the ball in a bucket.</p>
        <ol class="howto">
          <li><strong>🔎 Find the givens</strong> on the apparatus.</li>
          <li><strong>📝 Plan</strong>: solve the vertical or the horizontal motion first?</li>
          <li><strong>🧮 Calculate</strong> in the T-chart: the <span class="tag tag-y">vertical motion</span>, then the <span class="tag tag-x">horizontal motion</span>.</li>
          <li><strong>🎯 Place the bucket</strong> and launch!</li>
        </ol>`
    },

    // Click WHERE the given is, then read it into the T-chart
    findDy: {
      type: 'findread', field: 'dy',
      text: (ctx, sess) => sess.phase === 'find'
        ? `<p><strong>🔎 Find Δy</strong>, the height the ball falls.</p>
           <p>The red dashed line marks the launch height. <strong>Click the spot where the red line crosses the height ruler.</strong></p>`
        : `<p>✓ Found it. The loupe zooms in on that spot. <strong>Read the ruler there</strong> and type Δy in the <span class="tag tag-y">vertical motion</span> column.</p>
           <p>Each small tick is ${X(ctx.ruler.y)} m.</p>`,
      find: {
        regions: ['height'],
        test: (region, p, stage) => region === 'height' && Math.abs(p.y - stage.Y(stage.cfg.dy)) <= 14 * stage.fs,
        wrong: r => r === 'height' ? 'That\'s the right ruler. Now click right where the red dashed line meets it.' : 'Δy is read on the height ruler: the yellow ruler standing up on the LEFT. Click where the red dashed line meets it.'
      },
      highlight: 'height',
      hints: ctx => [
        'The height ruler is the yellow ruler standing up on the left. 0 m is the floor.',
        `Find the last numbered mark below the red line, then count small ticks up to the line. Each tick is ${X(ctx.ruler.y)} m.`
      ]
    },

    findVx: {
      type: 'findread', field: 'vx',
      text: (ctx, sess) => sess.phase === 'find'
        ? '<p><strong>🔎 Find v_x</strong>, the launch speed. <strong>Click the display that shows it.</strong></p>'
        : `<p>✓ That's the photogate. <strong>Read the speed</strong> and type v_x in the <span class="tag tag-x">horizontal motion</span> column.</p>${PHOTOGATE_INFO}`,
      find: { regions: ['gate'], wrong: () => 'v_x is a speed in m/s. Look for the green PHOTOGATE display above the launcher.' },
      highlight: 'gate'
    },

    findDx: {
      type: 'findread', field: 'dx',
      text: (ctx, sess) => sess.phase === 'find'
        ? `<p><strong>🔎 Find Δx</strong>, how far away the target is. The bucket is locked 🔒 and its label doesn't say the distance.</p>
           <p><strong>Click the floor ruler right where the bucket's red pointer touches it.</strong></p>`
        : `<p>✓ Found it. <strong>Read the floor ruler</strong> at the red pointer and type Δx in the <span class="tag tag-x">horizontal motion</span> column.</p>
           <p>Each small tick is ${X(ctx.ruler.x)} m.</p>`,
      find: {
        regions: ['floor', 'bucket'],
        test: (region, p, stage) => (region === 'floor' || region === 'bucket') && Math.abs(p.x - stage.X(stage.cfg.bucketX)) <= 14 * stage.fs,
        wrong: r => r === 'floor' ? 'Right ruler! Now click exactly where the bucket\'s red pointer meets it.' : 'Δx is read on the floor ruler, under the bucket. Click where the red pointer meets the ruler.'
      },
      highlight: 'floor',
      hints: ctx => [
        '0 m on the floor ruler is the bottom of the cliff.',
        `Find the last numbered mark before the pointer, then count small ticks. Each tick is ${X(ctx.ruler.x)} m.`
      ]
    },

    plan: {
      type: 'mc',
      text: () => '<p><strong>📝 Plan.</strong> You know Δy and v_x. Which do you find FIRST?</p>',
      options: () => [
        { t: 'The time t, from the vertical motion (Δy)', ok: true, why: 'Yes! Time is the one thing the two motions share. The height decides how long the ball falls, so find t first. Then use t sideways.' },
        { t: 'The distance Δx, from the horizontal motion', ok: false, why: 'Δx = v_x × t needs the time first. The height decides how long the ball falls, so find t from the vertical motion first.' },
        { t: 'It doesn\'t matter', ok: false, why: 'It matters: Δx = v_x × t needs t, and t comes from the height. Solve the vertical motion first.' }
      ]
    },

    data: {
      type: 'data',
      text: ctx => `<p><strong>📏 Gather your data.</strong> Read the cliff height <strong>Δy</strong> where the red dashed line meets the height ruler (zoom in with your mouse).</p>
           <p>Then read the launch speed <strong>v_x</strong> on the photogate display.</p>`,
      hints: ctx => [
        'Δy: the yellow ruler standing up on the left, where the red dashed line crosses it.',
        `Each small tick on the height ruler is ${X(ctx.ruler.y)} m. Count the ticks after the last number.`,
        'v_x: the green PHOTOGATE display above the launcher. Copy the number exactly.'
      ]
    },

    t: {
      type: 'num', kind: 't', world: 'y', unit: 's',
      text: () => `<p><strong>Step 1 · Vertical motion.</strong> How long is the ball in the air?</p>
        <p>Gravity pulls it down from rest. Use <span class="formula">t = √(Δy ÷ 5)</span></p>`,
      hints: ctx => [
        `Find Δy in your data: Δy = ${X(ctx.sc.dy)} m.`,
        `Divide by 5 first: ${X(ctx.sc.dy)} ÷ 5 = ?`,
        `Now take the square root of that answer. On the calculator, type √(${X(ctx.sc.dy)} ÷ 5).`
      ]
    },

    dx: {
      type: 'num', kind: 'dx', world: 'x', unit: 'm',
      text: () => `<p><strong>Step 2 · Horizontal motion.</strong> Sideways, nothing speeds the ball up or slows it down. It coasts at v_x the whole time it falls.</p>
        <p>How far does it land from the cliff? <span class="formula">Δx = v_x × t</span></p>`,
      hints: ctx => [
        `Use your T-chart: v_x = ${X(ctx.sc.vx)} m/s and t = ${A(ctx.sc.t)} s.`,
        `The ball moves ${X(ctx.sc.vx)} meters every second, for ${A(ctx.sc.t)} seconds.`,
        `Multiply: ${X(ctx.sc.vx)} × ${A(ctx.sc.t)} = ?`
      ]
    },

    vx: {
      type: 'num', kind: 'vx', world: 'x', unit: 'm/s',
      text: () => `<p><strong>Step 2 · Horizontal motion.</strong> What launch speed will carry the ball to the target in that time?</p>
        <p>Speed = distance ÷ time: <span class="formula">v_x = Δx ÷ t</span></p>`,
      hints: ctx => [
        `Use your T-chart: Δx = ${X(ctx.sc.dx)} m and t = ${A(ctx.sc.t)} s.`,
        'Speed = distance ÷ time.',
        `Divide: ${X(ctx.sc.dx)} ÷ ${A(ctx.sc.t)} = ?`
      ]
    },

    vy: {
      type: 'num', kind: 'vy', world: 'impact', unit: 'm/s',
      text: () => `<p><strong>⭐ Impact · Part A.</strong> How fast is the ball moving <strong>downward</strong> when it lands?</p>
        <p>Gravity adds 10 m/s of downward speed every second: <span class="formula">v_y = 10 × t</span></p>`,
      hints: ctx => [
        'The ball starts with 0 m/s downward. It was launched straight sideways.',
        `It falls for t = ${A(ctx.sc.t)} s.`,
        `Multiply: 10 × ${A(ctx.sc.t)} = ?`
      ]
    },

    vimp: {
      type: 'num', kind: 'vimp', world: 'impact', unit: 'm/s',
      text: () => `<p><strong>⭐ Impact · Part B.</strong> What is the ball's total speed when it lands?</p>
        <p>v_x and v_y are at a right angle. Use the Pythagorean theorem: <span class="formula">v = √(v_x² + v_y²)</span></p>`,
      hints: ctx => [
        'v_x and v_y are the two legs of a right triangle. The total speed v is the long side.',
        `Square each one: ${X(ctx.sc.vx)}² and ${A(ctx.sc.vy)}². Add them.`,
        `Take the square root. On the calculator, type √(${X(ctx.sc.vx)}^2 + ${A(ctx.sc.vy)}^2).`
      ]
    },

    theta: {
      type: 'num', kind: 'theta', world: 'impact', unit: '°',
      text: () => `<p><strong>⭐ Impact · Part C.</strong> At what angle below the ground does the ball hit?</p>
        <p>Measure from the horizontal: <span class="formula">θ = tan⁻¹(v_y ÷ v_x)</span></p>`,
      hints: ctx => [
        'The angle is measured from the flat ground, down to the ball\'s path.',
        'tan θ = opposite ÷ adjacent = v_y ÷ v_x.',
        `On the calculator (in degrees), type arctan(${A(ctx.sc.vy)} ÷ ${X(ctx.sc.vx)}).`
      ]
    },

    place: {
      type: 'place',
      text: ctx => `<p><strong>🎯 Target unlocked!</strong> Drag the orange bucket on the runway to your answer: <span class="formula">Δx = ${A(ctx.sc.dx)} m</span></p>
        <p>Watch the <strong>Bucket at</strong> readout. The ◀ ▶ buttons nudge it. Then press <strong>🚀 Launch</strong>.</p>`
    },

    dial: {
      type: 'dial',
      text: ctx => `<p><strong>🎛️ Set the launcher.</strong> Turn the speed dial to your answer: <span class="formula">v_x = ${A(ctx.sc.vx)} m/s</span></p>
        <p>The photogate will show your setting. Then press <strong>🚀 Launch</strong>.</p>`
    }
  };

  window.MISSIONS = MISSIONS;
  window.TASKS = TASKS;
})();

// Centripetal Acceleration Workshop — the lesson, one page at a time.
// The order builds the idea before any math: velocity has a direction, so turning is accelerating; let go and it goes
// straight along the tangent; the change in velocity points to the center; then how big a_c is.
//   page = { title, body, after, scene(), stepper: { T, require, launch, label }, predict, options,
//            ask: stepKey | mc: conceptId, fresh, make: problem kind, level }
// A wrong answer shows why, then restarts from the page marked `fresh` with new numbers.

(function () {
  const PR = window.PR, stack = PR.stack;
  const OMEGA = 57.2958;   // the teaching circle turns one radian each second: 10 m/s on a 10 m circle

  function problemScene(tier, sc, ans = {}) {
    return { mode: 'problem', sc, ans, tier };
  }

  // ---------- Part 1: turning is accelerating ----------
  const turnPages = () => [
    {
      title: 'Steady speed, new direction',
      body: `<p>A car drives around a circular track. You are looking down from above. Its speedometer never changes.</p>
        <p>Press <strong>Next second</strong>. Watch the blue arrow. It shows the car's <strong>velocity</strong>.</p>`,
      after: `<p>The speed stayed the same, but the blue arrow pointed a <strong>new way</strong> every second.</p>
        <p><strong>Velocity</strong> is speed <em>and</em> direction. When the direction changes, the velocity changes.</p>`,
      stepper: { T: 4, require: true },
      scene: () => ({ mode: 'circle', phi: -30, omega: OMEGA, car: true, vLabel: 'v = 10 m/s', speedNote: 'Speedometer: 10 m/s' })
    },
    {
      title: 'Turning is accelerating',
      body: `<p><strong>Acceleration</strong> means the velocity is changing. There are three ways to change velocity:</p>
        <ul><li>speed up</li><li>slow down</li><li><strong>turn</strong></li></ul>
        <p>So a car going around a curve at a steady speed <strong>is accelerating</strong>, the whole time.</p>`,
      scene: () => ({ mode: 'circle', phi: 120, car: true, ghosts: [-120, -60], vLabel: 'v' })
    },
    { mc: 'accel_turn', fresh: true },
    {
      title: 'The velocity arrow',
      body: `<p>The velocity arrow points the way the car is going <strong>right now</strong>.</p>
        <p>It just touches the circle at one point. A line like that is called a <strong>tangent line</strong>.</p>`,
      scene: () => ({ mode: 'circle', phi: 40, tangentLine: true, vLabel: 'v' })
    },
    { mc: 'v_dir', fresh: true },
    { mc: 'v_dir', fresh: true }
  ];

  // ---------- Part 2: let go ----------
  const letGoPages = () => [
    {
      predict: true,
      title: 'What if you let go?',
      body: `<p>A rubber stopper whirls on a string. The star marks where the string will be let go.</p>
        <p>Which way will the stopper fly? There is no wrong answer here. Make your best prediction.</p>`,
      options: [
        { id: 'tan', t: 'Straight ahead, the way it was moving' },
        { id: 'out', t: 'Straight out, away from the center' },
        { id: 'curve', t: 'It keeps curving around' }
      ],
      scene: () => ({ mode: 'release', t: 4, tRel: 4, noV: true })
    },
    {
      title: 'Let go!',
      body: `<p>Press <strong>Let go</strong>. The stopper whirls, and the string is let go at the star.</p>`,
      after: `<p>It flew off in a <strong>straight line</strong> along the tangent. It did not fly straight out from the center.</p>
        <p>With no string, nothing pulls it toward the center. Newton's 1st Law says it keeps going straight, the way it was already moving.</p>`,
      stepper: { T: 6, require: true, launch: true, label: 'Let go' },
      scene: () => ({ mode: 'release', tRel: 4 })
    },
    {
      title: 'So what was the string doing?',
      body: `<p>While the string was on, it pulled the stopper <strong>toward the center</strong>, all the time.</p>
        <p>That pull kept bending the path into a circle. Take the pull away, and the path goes straight.</p>`,
      scene: () => ({ mode: 'circle', phi: 90, showA: true, aLabel: 'pull toward the center', vLabel: 'v' })
    },
    { mc: 'release_path', fresh: true },
    { mc: 'paint', fresh: true },
    { mc: 'release_path', fresh: true }
  ];

  // ---------- Part 3: toward the center ----------
  const centerPages = () => [
    {
      title: 'Which way does the velocity change?',
      body: `<p>Here is the puck at two moments. Same speed, but the arrow turned.</p>
        <p>Press <strong>Next step</strong> to see what changed.</p>`,
      after: `<p>The change in velocity points <strong>toward the center</strong> of the circle.</p>`,
      stepper: { T: 2, require: true, label: 'Next step' },
      scene: () => ({ mode: 'dv' })
    },
    {
      title: 'Centripetal acceleration',
      body: `<p>Acceleration points the same way as the change in velocity. So on a circle, the acceleration points <strong>toward the center</strong>.</p>
        <p>We call it <strong>centripetal acceleration</strong>, a_c. <em>Centripetal</em> means "center-seeking."</p>`,
      scene: () => ({ mode: 'circle', phi: 60, showA: true, aLabel: 'a_c', vLabel: 'v' })
    },
    { mc: 'a_dir', fresh: true },
    {
      title: 'A right angle',
      body: `<p>Velocity runs along the tangent. a_c points to the center.</p>
        <p>The two arrows are always at a <strong>right angle</strong>. That is why a_c only turns the puck. It never speeds it up or slows it down.</p>`,
      scene: () => ({ mode: 'circle', phi: 130, showA: true, aLabel: 'a_c', vLabel: 'v' })
    },
    { mc: 'a_dir', fresh: true },
    { mc: 'right_angle', fresh: true }
  ];

  // ---------- Part 4: how big is a_c? ----------
  const SPEED_BASE = { change: 'v2', v1: 10, r1: 20, a1: 5, v2: 20, r2: 20 };
  const RADIUS_BASE = { change: 'rhalf', v1: 10, r1: 20, a1: 5, v2: 10, r2: 10 };

  const bigger = {
    conceptual: `<p>a_c gets bigger when the car goes <strong>faster</strong> or turns a <strong>tighter</strong> circle.</p>
      <p><strong>Speed counts twice.</strong> Twice the speed makes a_c 2 × 2 = <strong>4 times as big</strong>.</p>
      <p>Three times the speed makes it 3 × 3 = <strong>9 times as big</strong>.</p>`,
    cp: `<p>a_c gets bigger when the puck goes <strong>faster</strong> or the circle is <strong>smaller</strong>.</p>
      <p class="worked-line"><span class="formula">a_c = v² ÷ r</span></p>
      <p>v² means v × v, so speed counts twice. For the first circle:</p>
      <p class="worked-line">${stack('a_c = (10 m/s)² ÷ 20 m = 100 ÷ 20 = 5 m/s²')}</p>`
  };
  bigger.honors = bigger.cp;

  const periodTeach = {
    title: 'Speed from one lap',
    body: `<p>Sometimes you know how long <strong>one lap</strong> takes instead of the speed. One lap is the distance around the circle: 2πr.</p>
      <p class="worked-line"><span class="formula">v = 2πr ÷ T</span></p>
      <p>T is the time for one lap. Then use a_c = v² ÷ r as before.</p>`,
    scene: () => problemScene('honors', { kind: 'period', r: 4, T: 2 }, {})
  };

  const vmaxTeach = {
    title: 'The fastest safe speed',
    body: `<p>Tires can only grip so hard, so a curve has a <strong>most</strong> a_c it can give. Work backward to find the fastest safe speed:</p>
      <p class="worked-line"><span class="formula">a_c = v² ÷ r</span></p>
      <p class="worked-line"><span class="formula">v² = a_c × r</span></p>
      <p class="worked-line"><span class="formula">v = √(a_c × r)</span></p>`,
    scene: () => problemScene('honors', { kind: 'vmax', a: 8, r: 50 }, {})
  };

  const sizePages = tier => {
    const pages = [
      {
        title: 'Two things make a_c bigger',
        body: bigger[tier],
        scene: () => ({ mode: 'compare', sc: SPEED_BASE, newA: 20 })
      },
      {
        title: 'A tighter circle',
        body: `<p>Now keep the speed the same and make the circle <strong>half as wide</strong>.</p>
          <p>The turn is tighter, so a_c is <strong>2 times as big</strong>.</p>`,
        scene: () => ({ mode: 'compare', sc: RADIUS_BASE, newA: 10 })
      },
      { mc: 'speed_double', fresh: true },
      { mc: 'radius_half', fresh: true }
    ];
    if (tier === 'conceptual') {
      [1, 2, 2].forEach(level => pages.push({ ask: 'factor', fresh: true, make: 'compare', level }, { ask: 'newac' }));
    } else if (tier === 'cp') {
      [1, 1, 2, 2].forEach(level => pages.push({ ask: 'ac', fresh: true, make: 'ac', level }));
    } else {
      pages.push(
        { ask: 'ac', fresh: true, make: 'ac', level: 1 },
        { ask: 'ac', fresh: true, make: 'ac', level: 2 },
        periodTeach,
        { ask: 'v', fresh: true, make: 'period' },
        { ask: 'ac' },
        vmaxTeach,
        { ask: 'vmax', fresh: true, make: 'vmax' }
      );
    }
    return pages;
  };

  const PAGES = { turn: turnPages, letgo: letGoPages, center: centerPages, size: sizePages };

  // weight = share of the 6 step-by-step points
  const PARTS = [
    { id: 'turn', label: 'Turning', icon: '🔄', weight: 1 },
    { id: 'letgo', label: 'Let Go', icon: '🪢', weight: 1 },
    { id: 'center', label: 'Toward the Center', icon: '🎯', weight: 1 },
    { id: 'size', label: 'How Big?', icon: '📐', weight: 2 },
    { id: 'quiz', label: 'Mastery Check', icon: '🏆', weight: 0 }
  ];

  // ---------- Grade: 10 pts. 6 pts grow step by step across the parts, 4 pts × best Mastery Check. ----------
  const PART_POINTS = 6, QUIZ_POINTS = 4;

  function partProgress(st, p, tier) {
    const part = st.parts[p.id];
    if (!part) return 0;
    if (part.done) return 1;
    return Math.min(part.far || 0, PAGES[p.id](tier).length) / PAGES[p.id](tier).length;
  }

  function earnedPoints(st, tier) {
    const req = PARTS.filter(p => p.weight > 0);
    const total = req.reduce((a, p) => a + p.weight, 0);
    const parts = PART_POINTS * req.reduce((a, p) => a + p.weight * partProgress(st, p, tier), 0) / total;
    return parts + QUIZ_POINTS * (st.quiz.best || 0) / 100;
  }

  window.Lesson = { PARTS, PAGES, PART_POINTS, QUIZ_POINTS, problemScene, partProgress, earnedPoints, pages: (id, tier) => PAGES[id](tier) };
})();

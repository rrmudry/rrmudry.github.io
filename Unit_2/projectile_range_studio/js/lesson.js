// Projectile Range Studio — the lesson, one page at a time.
// A page either teaches (text + picture, sometimes "press Next second") or asks one thing.
// New ideas are taught with a concrete example before anything is asked.
//   page = { title, body, formula, stepper, scene(sc, ans) | ask: stepKey | mc: conceptId, fresh: 'new launch here', given, flightEnd }
// A wrong answer shows why, then restarts from the page marked `fresh` with new numbers.

(function () {
  const T = window.PR.TEACH_LAUNCH;

  // ---------- What the picture shows on a problem page ----------
  // The numbers for a problem live on the picture, never in the words.
  function problemScene(tier, sc, ans = {}) {
    const fmt = window.PR.fmt;
    const done = k => (typeof ans[k] === 'number' ? fmt(ans[k]) : null);
    if (tier === 'cp') {
      return {
        mode: 'grid', sc,
        labels: {
          vox: done('vox') ? `v_ox = ${done('vox')} m/s` : 'v_ox',
          voy: done('voy') ? `v_oy = ${done('voy')} m/s` : 'v_oy'
        }
      };
    }
    if (tier === 'honors') {
      return {
        mode: 'launch', sc,
        labels: {
          v0: true, th: true,
          vox: done('vox') ? `v_ox = ${done('vox')} m/s` : 'v_ox = ?',
          voy: done('voy') ? `v_oy = ${done('voy')} m/s` : 'v_oy = ?'
        }
      };
    }
    return { mode: 'launch', sc, labels: { vox: true, voy: true } };
  }

  // ---------- Part 1: See the two motions ----------
  const seePages = tier => {
    const pages = [
      {
        title: 'One launch, two motions',
        body: `<p>The purple arrow is the launch velocity, v_o.</p>
          <p>It splits into two arrows that work at the same time:</p>
          <ul class="key-list">
            <li><span class="dot dot-x"></span><strong>v_ox</strong> is how fast the ball moves <strong>sideways</strong>.</li>
            <li><span class="dot dot-y"></span><strong>v_oy</strong> is how fast the ball moves <strong>upward</strong>.</li>
          </ul>`,
        scene: () => ({ mode: 'launch', sc: T, labels: { v0: true, vox: true, voy: true } })
      },
      {
        title: 'Sideways: v_ox never changes',
        body: `<p>Press <strong>Next second</strong>. Watch the blue arrow.</p>`,
        after: `<p>The blue arrow is the same every second. Nothing pushes the ball sideways, so it moves <strong>${T.vox} m every second</strong>.</p>`,
        stepper: { view: 'x', stop: 'land', require: true, tiles: true },
        scene: () => ({ mode: 'flight', sc: T, view: 'x', tiles: true })
      },
      {
        title: 'Upward: v_oy changes',
        body: `<p>Gravity changes v_oy by <strong>10 m/s every second</strong> (g = 10 m/s²).</p><p>Press <strong>Next second</strong>. Watch the orange arrow.</p>`,
        after: `<p>Going up, the arrow shrinks until it is <strong>0 at the top</strong>. Coming down, it grows back to the same size.</p>`,
        stepper: { view: 'y', stop: 'land', require: true, ladder: true },
        scene: () => ({ mode: 'flight', sc: T, view: 'y', fullPath: false })
      },
      {
        title: 'Both at once',
        body: `<p>Now see both arrows on the same flight.</p><p>At the top, the orange arrow is gone. The blue arrow is still there, so the ball keeps moving sideways.</p>`,
        stepper: { view: 'both', stop: 'land', require: false, ladder: true },
        scene: () => ({ mode: 'flight', sc: T, view: 'both', fullPath: true })
      },
      { mc: 'top', fresh: true }
    ];

    if (tier === 'conceptual') {
      pages.push(
        { title: 'Your numbers are on the picture', body: `<p>In this studio, each launch shows v_ox and v_oy beside the arrows.</p><p>Blue is always sideways. Orange is always upward.</p>`, scene: () => ({ mode: 'launch', sc: T, labels: { v0: true, vox: true, voy: true } }) },
        { ask: 'vox', fresh: true },
        { ask: 'voy' }
      );
    } else if (tier === 'cp') {
      const ex = { scale: 5, gx: 4, gy: 6, vox: T.vox, voy: T.voy };
      pages.push(
        {
          title: 'Read the arrows from the grid',
          body: `<p>A vector diagram lets you read a speed by counting squares.</p>
            <ol class="key-list numbered">
              <li>Read the scale. Here, 1 square = 5 m/s.</li>
              <li>Count the squares along the arrow.</li>
              <li>Multiply.</li>
            </ol>
            <p class="worked-line"><span class="formula">v_ox = 4 squares × 5 m/s = 20 m/s</span></p>
            <p class="worked-line"><span class="formula">v_oy = 6 squares × 5 m/s = 30 m/s</span></p>`,
          scene: () => ({ mode: 'grid', sc: ex, labels: { vox: 'v_ox = 20 m/s', voy: 'v_oy = 30 m/s' } })
        },
        { ask: 'vox', fresh: true, level: 1 },
        { ask: 'voy' }
      );
    } else {
      const ex = { v0: 20, th: 30, vox: 20 * Math.cos(Math.PI / 6), voy: 10 };
      pages.push(
        {
          title: 'Split the launch with trig',
          body: `<p>You know v_o and θ. Your two arrows make a right triangle, so use cos and sin in <strong>degree mode</strong>.</p>
            <p class="worked-line"><span class="formula">v_ox = v_o × cos(θ) = 20 × cos(30°) = 17.3 m/s</span></p>
            <p class="worked-line"><span class="formula">v_oy = v_o × sin(θ) = 20 × sin(30°) = 10 m/s</span></p>
            <p>The side that touches θ uses cos. The side across from θ uses sin.</p>`,
          scene: () => ({ mode: 'launch', sc: ex, labels: { v0: true, th: true, vox: 'v_ox = 17.3 m/s', voy: 'v_oy = 10 m/s' } })
        },
        { ask: 'vox', fresh: true, level: 2 },
        { ask: 'voy' }
      );
    }
    return pages;
  };

  // ---------- Part 2: Hang time ----------
  const onlyVoyPage = {
    title: 'Only v_oy decides the hang time',
    body: `<p><strong>Hang time</strong> is how long the ball is in the air.</p>
      <p>These balls have different v_ox but the same v_oy. Both are in the air for <strong>6 s</strong>.</p>
      <p>A ball lands when its up-and-down motion ends. Moving faster sideways does not change that.</p>`,
    scene: () => ({ mode: 'compare', a: { vox: 30, voy: 30 }, b: { vox: 10, voy: 30 }, showTimes: true })
  };

  const countdownPage = {
    title: 'Count the seconds',
    body: `<p>This ball starts with v_oy = 30 m/s. Gravity takes away 10 m/s every second.</p><p>Press <strong>Next second</strong> until it lands.</p>`,
    after: `<p><span class="formula">3 s up + 3 s down = 6 s</span></p><p>The trip down takes the same time as the trip up.</p>`,
    stepper: { view: 'y', stop: 'land', require: true, ladder: true },
    scene: () => ({ mode: 'flight', sc: T, view: 'y', fullPath: true })
  };

  const timePages = tier => {
    if (tier === 'conceptual') {
      return [
        onlyVoyPage, countdownPage,
        { ask: 'up', fresh: true, level: 1 }, { ask: 't' },
        { ask: 'up', fresh: true }, { ask: 't' }
      ];
    }
    if (tier === 'cp') {
      return [
        onlyVoyPage, countdownPage,
        {
          title: 'The same thing as a calculation',
          body: `<p>Counting works, but dividing is faster. Each second takes away 10 m/s, so:</p>
            <p class="worked-line"><span class="formula">time up = v_oy ÷ g = 30 ÷ 10 = 3 s</span></p>
            <p class="worked-line"><span class="formula">t = 2 × time up = 2 × 3 = 6 s</span></p>
            <p>Both steps at once:</p>
            <p class="worked-line"><span class="formula">t = 2 × v_oy ÷ g</span></p>`,
          scene: () => ({ mode: 'flight', sc: T, view: 'y', fullPath: true, t: 3 })
        },
        { ask: 'voy', fresh: true, level: 1 }, { ask: 'up' }, { ask: 'double' },
        { ask: 'voy', fresh: true }, { ask: 't' }
      ];
    }
    return [
      onlyVoyPage, countdownPage,
      {
        title: 'The same thing from your notes',
        body: `<p>Your notes use the position equation. The ball starts and ends on the ground, so X_f = X_o = 0, and a = −10 m/s².</p>
          <p class="worked-line"><span class="formula">X_f = X_o + v_oy t + ½at²</span></p>
          <p class="worked-line"><span class="formula">0 = v_oy t − 5t²</span></p>
          <p>Divide both sides by t and solve:</p>
          <p class="worked-line"><span class="formula">t = v_oy ÷ 5 = 2 × v_oy ÷ g</span></p>`,
        scene: () => ({ mode: 'flight', sc: T, view: 'y', fullPath: true, t: 3 })
      },
      { ask: 'voy', fresh: true, level: 1 }, { ask: 't' },
      { ask: 'voy', fresh: true }, { ask: 't' }
    ];
  };

  // ---------- Part 3: Range. The hang time is handed over here so the new idea stands alone. ----------
  const rangePages = () => [
    {
      title: 'Range is built from equal steps',
      body: `<p><strong>Range</strong> (ΔX) is how far the ball goes along the ground.</p><p>Press <strong>Next second</strong>. Each second adds one block of ${T.vox} m.</p>`,
      after: `<p><span class="formula">ΔX = v_ox × t = ${T.vox} × 6 = 120 m</span></p><p>This is your v = ΔX ÷ Δt equation, solved for ΔX.</p>`,
      stepper: { view: 'x', stop: 'land', require: true, tiles: true },
      scene: () => ({ mode: 'flight', sc: T, view: 'x', tiles: true, showRange: true, fullPath: true })
    },
    { ask: 'dx', given: true, fresh: true, level: 1 },
    { replay: true },
    { ask: 'dx', given: true, fresh: true },
    { replay: true }
  ];

  // ---------- Part 4: Whole flights ----------
  const FLIGHTS_TO_SOLVE = 3;
  const fullPages = tier => {
    const steps = window.PR.FLIGHT[tier].map((k, i) => ({ ask: k, fresh: i === 0 }));
    steps.push({ replay: true, flightEnd: true });
    return steps;
  };

  const PAGES = { see: seePages, time: timePages, range: rangePages, full: fullPages };

  // weight = share of the 6 step-by-step points
  const PARTS = [
    { id: 'see', label: 'See It', icon: '👀', weight: 1 },
    { id: 'time', label: 'Hang Time', icon: '⏱️', weight: 2 },
    { id: 'range', label: 'Range', icon: '📏', weight: 1 },
    { id: 'full', label: 'Full Flights', icon: '🎯', weight: 2 },
    { id: 'quiz', label: 'Mastery Check', icon: '🏆', weight: 0 }
  ];

  // ---------- Grade: 10 pts. 6 pts grow step by step across the parts, 4 pts × best Mastery Check. ----------
  const PART_POINTS = 6, QUIZ_POINTS = 4;

  function partProgress(st, p, tier) {
    const part = st.parts[p.id];
    if (!part) return 0;
    if (part.done) return 1;
    const n = PAGES[p.id](tier).length;
    const pageShare = Math.min(part.far || 0, n) / n;
    if (p.id === 'full') return Math.min(1, ((part.solved || 0) + pageShare) / FLIGHTS_TO_SOLVE);
    return pageShare;
  }

  function earnedPoints(st, tier) {
    const req = PARTS.filter(p => p.weight > 0);
    const total = req.reduce((a, p) => a + p.weight, 0);
    const parts = PART_POINTS * req.reduce((a, p) => a + p.weight * partProgress(st, p, tier), 0) / total;
    return parts + QUIZ_POINTS * (st.quiz.best || 0) / 100;
  }

  window.Lesson = { PARTS, PAGES, FLIGHTS_TO_SOLVE, PART_POINTS, QUIZ_POINTS, problemScene, partProgress, earnedPoints, pages: (id, tier) => PAGES[id](tier) };
})();

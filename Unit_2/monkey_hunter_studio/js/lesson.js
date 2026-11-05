// Monkey Hunter Studio — the lesson, one page at a time.
// The order builds toward the why: the straight inertial path, then a measured drop, then the meter stick with strings,
// and only then the monkey. Aiming at the monkey is not the finish: the later hunts ask what the strings predict.
//   page = { title, body, after, scene(), stepper: { T, require }, control: 'tilt'|'speed', build, predict,
//            ask: stepKey | mc: conceptId, fresh, level, make, replay }
// A wrong answer shows why, then restarts from the page marked `fresh` with new numbers.

(function () {
  const PR = window.PR, stack = PR.stack;
  const T = PR.teachHunt();

  // The numbers for a problem live on the picture, never in the words.
  function problemScene(tier, sc, ans = {}, kind = 'meet') {
    const hold = kind === 'hold';
    const labels = { H: true };
    if (tier === 'cp') Object.assign(labels, { D: true, vox: true });
    if (tier === 'honors') {
      labels.D = true;
      labels.v0 = true;
      if (hold || typeof ans.th === 'number') labels.th = true;
    }
    return { mode: 'hunt', sc, t: 0, noStrings: true, hold, labels };
  }

  // ---------- Part 1: the inertial path ----------
  const linePages = tier => {
    const pages = [
      {
        title: 'Pretend gravity is off',
        body: `<p>Launch a ball with <strong>no gravity</strong>. No force acts on it, so nothing changes its motion.</p>
          <p>Press <strong>Next second</strong>. Watch how far it goes each second.</p>`,
        after: `<p>A straight line, with <strong>equal steps</strong> every second. This straight line is the ball's <strong>inertial path</strong>: where inertia alone would carry it.</p>`,
        stepper: { T: 4, require: true },
        scene: () => ({ mode: 'hunt', sc: T, gravity: false, noMonkey: true, stickT: 4 })
      },
      {
        title: 'Lay a meter stick on the path',
        body: `<p>Think of a <strong>meter stick</strong> lying along the inertial path.</p>
          <p>The marks on it are <strong>evenly spaced</strong>. With no gravity, the ball passes <strong>one mark every second</strong>.</p>
          <p>The first step splits into two parts: <span class="dot dot-x"></span>v_ox sideways and <span class="dot dot-y"></span>v_oy upward.</p>`,
        scene: () => ({ mode: 'hunt', sc: T, gravity: false, noMonkey: true, stickT: 4, markLabels: true, labels: { vox: true, voy: true } })
      },
      { mc: 'no_gravity', fresh: true }
    ];
    if (tier === 'honors') {
      pages.push(
        { ask: 'voy', fresh: true, level: 2, sceneKind: 'split' },
        { ask: 'line', sceneKind: 'split' }
      );
    } else {
      pages.push(
        { ask: 'line', fresh: true, level: 1, sceneKind: 'line' },
        { ask: 'line', fresh: true, sceneKind: 'line' }
      );
    }
    return pages;
  };

  // ---------- Part 2: measure a real drop ----------
  const worked = {
    conceptual: `<p>Look at your drops: 5, 20, 45, 80. Each one is <strong>5 × t × t</strong>.</p>
      <p class="worked-line">${stack('drop = 5 × 3 × 3 = 45 m')}</p>`,
    cp: `<p>Your table matches an equation you know: ½ × g × t². With g = 10 m/s², the ½ × 10 makes 5.</p>
      <p class="worked-line"><span class="formula">drop = ½ × g × t² = 5 × t²</span></p>
      <p class="worked-line">${stack('drop = 5 × 3² = 45 m')}</p>`,
    honors: `<p>This is your position equation with v_oy = 0 and a = −10 m/s², so X_f − X_o = −5t². The ball is 5t² below where it started.</p>
      <p class="worked-line"><span class="formula">drop = ½ × g × t² = 5 × t²</span></p>
      <p class="worked-line">${stack('drop = 5 × 3² = 45 m')}</p>`
  };

  const dropPages = tier => {
    const measure = [1, 2, 3, 4].map(at => ({ ask: `read${at}`, measure: at }));
    return [
      {
        title: 'Now turn gravity on',
        body: `<p>Drop a ball. No launch, just let go. A flash camera catches it once every second.</p>
          <p>You will press <strong>Next second</strong> and read the ruler. Your readings become your <strong>drop table</strong>, and you will use it for the rest of this studio.</p>`,
        scene: () => ({ mode: 'ruler', t: 0 })
      },
      ...measure,
      {
        title: 'Your drop table',
        body: `<p>Your table is under the picture. The ball does not fall the same distance each second. It keeps speeding up.</p>${worked[tier]}`,
        scene: () => ({ mode: 'ruler', t: 4 })
      },
      { ask: 'dropNew', fresh: true, make: 'at', sceneKind: 'at' },
      {
        title: 'Sideways does not change the drop',
        body: `<p>Ball A is dropped. Ball B is launched straight sideways at the same moment.</p><p>Press <strong>Next second</strong>. Watch how high each ball is.</p>`,
        after: `<p>They stay level the whole way. Each second, both have the <strong>same drop</strong> from your table. Moving sideways changes nothing about falling.</p>`,
        stepper: { T: 4, require: true },
        scene: () => ({ mode: 'pair' })
      },
      { mc: 'same_fall', fresh: true }
    ];
  };

  // ---------- Part 3: the strings ----------
  const stringPages = tier => [
    {
      title: 'A stick with hanging balls',
      body: `<p>Hold the meter stick flat. Now hang a ball from each mark.</p>
        <p>Each string is as long as the <strong>drop</strong> for that second. The string at 1 s is as long as a ball falls in 1 s.</p>
        <p>You will build it next, using your drop table.</p>`,
      scene: () => ({ mode: 'rig', tilt: 0, strings: [0, 0, 0, 0], drag: false })
    },
    { build: true },
    {
      title: 'Launch along the stick',
      body: `<p>Press <strong>Launch</strong>. The ball leaves straight along the stick.</p><p>Gravity pulls it below the stick. Watch where it goes.</p>`,
      after: `<p>The ball passes through <strong>every hanging ball</strong>. Your strings already knew the path.</p>`,
      stepper: { T: 4, require: true, launch: true },
      scene: () => ({ mode: 'rig', tilt: 0 })
    },
    {
      title: 'Now tilt the stick',
      body: `<p>Move the slider to tilt the stick up. Then press <strong>Launch</strong>.</p>
        <p>The stick tilts, but the strings still hang <strong>straight down</strong>, the same length. Gravity only pulls down.</p>`,
      after: `<p>Same strings, new angle, and the ball still goes through every one. <strong>The path is the stick, minus the strings.</strong></p>`,
      stepper: { T: 4, require: true, launch: true },
      control: 'tilt',
      scene: () => ({ mode: 'rig' })
    },
    {
      title: 'Now change the speed',
      body: `<p>Move the slider to change the launch speed. Then press <strong>Launch</strong>.</p>
        <p>Speed changes how far apart the marks are, because the ball covers more or less of the stick each second. The strings stay the same, because they only depend on <strong>time</strong>.</p>`,
      after: `<p>Any angle and any speed. The drop at 3 s is always 45 m.</p>`,
      stepper: { T: 4, require: true, launch: true },
      control: 'speed',
      scene: () => ({ mode: 'rig' })
    },
    { mc: 'tilted_string', fresh: true },
    ...(tier === 'honors' ? [{ ask: 'voy', fresh: true, sceneKind: 'split' }] : [{ ask: 'line', fresh: true, level: 1, sceneKind: 'line' }]),
    ...(tier === 'honors' ? [{ ask: 'line', sceneKind: 'split' }] : []),
    { ask: 'drop', sceneKind: 'line', ownCount: true },
    { ask: 'ballH', sceneKind: 'line' }
  ];

  // ---------- Part 4: the monkey ----------
  const prediction = {
    predict: true,
    title: 'Where should you aim?',
    body: `<p>A monkey hangs from a branch. The second it sees your launch, it <strong>lets go</strong>.</p><p>Where should you point the stick? There is no wrong answer here. Make your best prediction.</p>`,
    options: [
      { id: 'at', t: 'Right at the monkey' },
      { id: 'above', t: 'Above the monkey' },
      { id: 'below', t: 'Below the monkey' }
    ],
    scene: () => ({ mode: 'hunt', sc: T, t: 0, noStrings: true, stickT: 0.2 })
  };

  const proofPage = {
    title: 'Why speed does not matter',
    body: `<p>Write both heights with time in them. Each one loses the same 5t².</p>
      <p class="worked-line"><span class="formula">ball height = v_oy × t − 5t²</span></p>
      <p class="worked-line"><span class="formula">monkey height = H − 5t²</span></p>
      <p>They match when v_oy × t = H. The ball takes t = ΔX ÷ v_ox to arrive, so:</p>
      <p class="worked-line"><span class="formula">v_oy ÷ v_ox = H ÷ ΔX</span></p>
      <p>Both sides are tan(θ). v_o is gone, so <strong>any speed</strong> gives the same aim.</p>`,
    scene: () => ({ mode: 'hunt', sc: T, t: 4, fullPath: true })
  };

  const monkeyPages = tier => {
    const pages = [
      prediction,
      {
        title: 'First, with gravity off',
        body: `<p>Aim the stick right at the monkey. Turn gravity off.</p><p>Press <strong>Next second</strong>.</p>`,
        after: `<p>The ball rides the stick to the monkey, and the monkey stays put. A hit, the easy way.</p>`,
        stepper: { T: 4, require: true },
        scene: () => ({ mode: 'hunt', sc: T, gravity: false, markLabels: true })
      },
      {
        title: 'Now gravity is on',
        body: `<p>Same aim. Gravity pulls <strong>both</strong> of them down, starting at the same moment.</p>
          <p>Press <strong>Next second</strong>. Compare the rose strings: one above the ball, one above the monkey.</p>`,
        after: `<p>The ball is below the stick by exactly as far as the monkey has fallen. <strong>Same time, same drop, same string.</strong> That is why they meet.</p>`,
        stepper: { T: 4, require: true },
        scene: () => ({ mode: 'hunt', sc: T, markLabels: true })
      },
      { mc: 'same_drop', fresh: true }
    ];
    if (tier === 'honors') pages.push({ ask: 'th', fresh: true, level: 2, kind: 'meet' }, { ask: 'vox', kind: 'meet' });
    else pages.push({ ask: 't', fresh: true, level: 1, kind: 'meet' });
    if (tier === 'honors') pages.push({ ask: 't', kind: 'meet' });
    pages.push({ ask: 'drop', kind: 'meet' }, { ask: 'meet', kind: 'meet' }, { replay: 'meet' });
    if (tier === 'honors') pages.push(proofPage);
    return pages;
  };

  // ---------- Part 5: hunts where "aim at the monkey" is not the whole answer ----------
  const holdShot = () => PR.hunt(20, 30, 3);
  const aimShot = () => Object.assign(PR.hunt(20, 45, 3), { H: 135 });

  const huntPages = tier => {
    const hold = PR.HUNT[tier].hold.map((k, i) => ({ ask: k, fresh: i === 0, kind: 'hold' }));
    const meet = PR.HUNT[tier].meet.map((k, i) => ({ ask: k, fresh: i === 0, kind: 'meet' }));
    const pages = [
      {
        title: 'A smarter monkey',
        body: `<p>This monkey has learned your trick. It <strong>holds on</strong>.</p><p>Aim right at it and press <strong>Next second</strong>.</p>`,
        after: `<p>The ball passes <strong>under</strong> the monkey by the length of the 3 s string: 45 m. The strings still tell the truth.</p>`,
        stepper: { T: 3, require: true },
        scene: () => ({ mode: 'hunt', sc: holdShot(), hold: true, markLabels: true })
      },
      {
        title: 'Aim high by one string',
        body: `<p>If the ball will fall 45 m below the stick, point the stick <strong>45 m above</strong> the monkey. The sideways speed stays the same, so it still takes 3 s.</p><p>Press <strong>Next second</strong>.</p>`,
        after: `<p>The star is your aim. The ball falls one string below it and lands right on the monkey.</p>
          <p class="worked-line">${stack('aim height = 90 m + 45 m = 135 m')}</p>`,
        stepper: { T: 3, require: true },
        scene: () => ({ mode: 'hunt', sc: holdShot(), hold: true, aimH: 135, branchH: 90, markLabels: true })
      },
      ...hold,
      { replay: 'hold' },
      {
        title: 'Too slow',
        body: `<p>Aim right at a monkey that lets go, but launch <strong>slowly</strong>.</p><p>Slow means more time. More time means a longer string. Press <strong>Next second</strong>.</p>`,
        after: `<p>The aim was perfect, but both hit the ground first. To meet in the air, the drop must be <strong>less than H</strong>. Aim is not the only thing that counts.</p>`,
        stepper: { T: 3, require: true },
        scene: () => ({ mode: 'hunt', sc: PR.hunt(10, 10, 4), labels: { H: true } })
      },
      { mc: 'slow_call', fresh: true },
      { mc: 'slow_call', fresh: true },
      ...meet,
      { replay: 'meet' },
      { mc: 'moon', fresh: true }
    ];
    if (tier === 'honors') {
      pages.push(
        {
          title: 'The smallest speed',
          body: `<p>The monkey lands when its drop equals H, so 5t² = H.</p>
            <p class="worked-line"><span class="formula">t = √(H ÷ 5)</span></p>
            <p>The ball must cover ΔX in that time, or it arrives too late.</p>
            <p class="worked-line"><span class="formula">smallest v_ox = ΔX ÷ t</span></p>`,
          scene: () => ({ mode: 'hunt', sc: PR.hunt(20, 30, 4), t: 0, noStrings: true, labels: { D: true, H: true } })
        },
        { ask: 'fall', fresh: true, make: 'min', sceneKind: 'min' },
        { ask: 'vmin', sceneKind: 'min' },
        {
          title: 'A monkey that lets go early',
          body: `<p>This monkey lets go 1 s <strong>before</strong> your launch. Its string is the one for t + 1, and the ball's is for t.</p><p>Press <strong>Next second</strong>.</p>`,
          after: `<p>The strings no longer match, so the ball passes <strong>over</strong> the monkey. The gap is the difference between the two strings.</p>`,
          stepper: { T: 3, require: true },
          scene: () => ({ mode: 'hunt', sc: PR.hunt(20, 40, 3), early: 1, markLabels: true })
        },
        { ask: 'vox', fresh: true, kind: 'early' },
        { ask: 't', kind: 'early' },
        { ask: 'drop', kind: 'early' },
        { ask: 'early', kind: 'early' },
        { ask: 'gap', kind: 'early' }
      );
    }
    return pages;
  };

  const PAGES = { line: linePages, drop: dropPages, strings: stringPages, monkey: monkeyPages, hunts: huntPages };

  // weight = share of the 6 step-by-step points
  const PARTS = [
    { id: 'line', label: 'The Straight Line', icon: '📏', weight: 1 },
    { id: 'drop', label: 'The Drop', icon: '⬇️', weight: 1 },
    { id: 'strings', label: 'The Strings', icon: '🪀', weight: 1 },
    { id: 'monkey', label: 'The Monkey', icon: '🐒', weight: 1 },
    { id: 'hunts', label: 'Hunts', icon: '🎯', weight: 2 },
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

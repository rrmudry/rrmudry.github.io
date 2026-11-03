// Projectile Range Studio — physics, launches for each class, answer checking, diagnostics, Mastery Check.
// Level ground only. g = 10 m/s². Symbols match the Day 46 guided notes: v_o, v_ox, v_oy, t, ΔX.
// All three classes solve the same flight. They only differ in where v_ox and v_oy come from:
//   conceptual (P1–3): both are printed on the picture, and hang time is found by counting seconds. No trig, no division.
//   cp (P4–6):         both are read off a vector diagram on a grid, then t = 2 × v_oy ÷ g.
//   honors (P0):       both are calculated from v_o and θ with cos and sin, then t = 2 × v_oy ÷ g.
// Every wrong answer is compared against known mistakes, so the student hears WHY. Mistake ids feed the teacher monitor.

(function () {
  const G = 10;
  const rad = d => d * Math.PI / 180;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const TEACH_LAUNCH = { vox: 20, voy: 30 };

  const hangTime = sc => 2 * sc.voy / G;
  const timeUp = sc => sc.voy / G;
  const range = sc => sc.vox * hangTime(sc);
  const apex = sc => sc.voy * sc.voy / (2 * G);

  // Whole numbers stay whole, then 1 decimal, 2 when small
  function fmt(v) {
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    return Math.abs(v) < 10 ? v.toFixed(2) : v.toFixed(1);
  }
  const near = (v, target, rel = 0.02, abs = 0.05) => Math.abs(v - target) <= Math.max(Math.abs(target) * rel, abs);
  function parseNum(raw) {
    const v = parseFloat(String(raw).replace(',', '.').replace(/[−–]/g, '-').replace(/[^0-9.\-eE]/g, ''));
    return isFinite(v) ? v : null;
  }

  // ---------- Launches. Level 1 is friendly numbers; level 2 is the full range. ----------
  const makers = {
    conceptual: level => ({
      vox: pick(level === 1 ? [10, 20] : [5, 10, 15, 20, 25, 30]),
      voy: pick(level === 1 ? [20, 30, 40] : [10, 20, 30, 40, 50])
    }),
    // gx ≠ gy so the two arrows can't be mixed up by accident
    cp: level => {
      const scale = level === 1 ? 5 : pick([2, 4, 5, 10]);
      const gx = pick([2, 3, 4, 5, 6, 7, 8]);
      let gy;
      do { gy = pick(scale === 10 ? [2, 3, 4] : [2, 3, 4, 5, 6, 7]); } while (gy === gx);
      return { scale, gx, gy, vox: gx * scale, voy: gy * scale };
    },
    // No angles near 45°: sin and cos must give clearly different answers.
    honors: level => {
      const v0 = pick(level === 1 ? [20, 30, 40] : [14, 16, 18, 22, 24, 25, 26, 28, 32, 35, 36]);
      const th = pick(level === 1 ? [30, 60] : [20, 25, 30, 35, 55, 60, 65, 70]);
      return { v0, th, vox: v0 * Math.cos(rad(th)), voy: v0 * Math.sin(rad(th)) };
    }
  };

  function newLaunch(tier, level = 2, not) {
    let sc;
    do { sc = makers[tier](level); } while (not && near(sc.vox, not.vox, 0, 0.01) && near(sc.voy, not.voy, 0, 0.01));
    return sc;
  }

  // ---------- Calculator work: a looked-up number alone can't pass ----------
  // needs = { fn: 'sin' | 'cos', routes: [[numbers], ...] }. Any one route of the problem's numbers counts.
  // Numbers match loosely so carried rounding (16.3 for 16.31) is fine. Returns a message, or null when it is real work.
  function workProblem(work, needs = {}) {
    if (!work.fns.length && work.nums.length <= 1) return 'Type the whole calculation into the calculator, not just the answer.';
    if (needs.fn && !work.fns.includes(needs.fn)) return `Your calculation needs to use the ${needs.fn} button.`;
    const has = n => work.nums.some(w => Math.abs(w - Math.abs(n)) <= Math.max(Math.abs(n) * 0.015, 0.051));
    const routes = needs.routes || [];
    if (routes.length && !routes.some(r => r.every(has))) {
      return `Your calculation needs to use the numbers from this problem. Look for ${routes[0].map(fmt).join(' and ')}.`;
    }
    return null;
  }

  // Student's own earlier answer when there is one, for follow-through credit and for matching their work
  const own = (ans, k, fallback) => (ans && typeof ans[k] === 'number' ? ans[k] : fallback);

  // ---------- Diagnostics for the steps every class shares ----------
  function timeMistake(v, sc) {
    if (near(v, timeUp(sc), 0.01)) return ['no_double', `${fmt(timeUp(sc))} s is only the way up. The ball still has to fall back down, and that takes the same time. Double it.`];
    if (near(v, 2 * sc.vox / G, 0.01)) return ['used_vox', `You used v_ox. Sideways speed does not change the time in the air. Use v_oy.`];
    if (near(v, 2 * sc.voy, 0.01) || near(v, sc.voy, 0.01)) return ['no_g', `That is a speed, not a time. Gravity takes away 10 m/s each second, so divide v_oy by 10.`];
    if (near(v, 2 * sc.voy * G, 0.01) || near(v, sc.voy * G, 0.01)) return ['times_g', `You multiplied by 10. Gravity takes away 10 m/s each second, so divide v_oy by 10.`];
    return null;
  }

  function rangeMistake(v, sc, t) {
    if (near(v, sc.voy * t, 0.01)) return ['used_voy', `You used v_oy. Distance along the ground comes from the sideways speed, v_ox.`];
    if (near(v, sc.vox * timeUp(sc), 0.01)) return ['half_time', `You used only the time to the top. The ball keeps moving sideways the whole flight, so use the full hang time.`];
    if (near(v, sc.vox + t, 0.01)) return ['added', `You added. Each second covers v_ox meters, so multiply: v_ox × t.`];
    if (near(v, sc.vox / t, 0.01)) return ['divided', `You divided. Each second covers v_ox meters, so multiply: v_ox × t.`];
    if (near(v, sc.vox, 0.01)) return ['no_time', `That is how far it goes in 1 second. Multiply by the hang time.`];
    return null;
  }

  function splitMistake(asked, v, sc) {
    const th = rad(sc.th), value = asked === 'x' ? Math.cos(th) : Math.sin(th);
    const other = asked === 'x' ? sc.voy : sc.vox;
    const fn = asked === 'x' ? 'cos' : 'sin';
    const raw = asked === 'x' ? Math.cos(sc.th) : Math.sin(sc.th);
    if (near(v, sc.v0 * raw, 0.01)) return ['radians', `Your calculator is in radian mode. Switch it to degrees (DEG) and calculate again.`, true];
    if (near(v, other, 0.01)) return ['swap', `You found the other part. ${asked === 'x' ? 'The sideways side touches θ, so it uses cos.' : 'The upward side is across from θ, so it uses sin.'}`];
    if (near(v, value, 0.03, 0.01)) return ['no_speed', `${fn}(${sc.th}°) is only a decimal. Multiply it by v_o to get m/s.`];
    if (near(v, sc.v0 / value, 0.01)) return ['divided_split', `You divided. A part can never be bigger than v_o. Multiply v_o by ${fn}(${sc.th}°).`];
    if (near(v, sc.v0, 0.01)) return ['whole_speed', `That is the whole launch speed v_o. Only part of it goes ${asked === 'x' ? 'sideways' : 'up'}.`];
    return null;
  }

  function readMistake(asked, v, sc) {
    const squares = asked === 'x' ? sc.gx : sc.gy;
    const otherValue = asked === 'x' ? sc.voy : sc.vox;
    if (sc.scale && sc.scale !== 1 && near(v, squares, 0, 0.01)) return ['scale', `You counted ${squares} squares, but each square is worth ${sc.scale} m/s. Multiply: ${squares} × ${sc.scale}.`];
    if (near(v, otherValue, 0, 0.01)) return ['swap_read', `You read the other arrow. ${asked === 'x' ? 'v_ox is the blue arrow along the ground.' : 'v_oy is the orange arrow going up.'}`];
    return ['misread', sc.scale ? `Count the squares along the arrow, then multiply by the scale.` : `Look at the number beside the ${asked === 'x' ? 'blue' : 'orange'} arrow.`];
  }

  // ---------- Steps ----------
  // Each step: sym, unit, skill, ask, formula, hints, target, own (follow-through), calc (needs Desmos), needs, mistake, right.
  const dxStep = (extraRoutes) => ({
    k: 'dx', sym: 'ΔX', unit: 'm', skill: 'range', calc: true,
    ask: () => 'How far does it go before it lands?',
    formula: () => 'ΔX = v_ox × t',
    hints: (sc, ans) => ['The ball moves v_ox meters every second. It flies for t seconds.', `In the calculator: ${fmt(own(ans, 'vox', sc.vox))} × ${fmt(own(ans, 't', hangTime(sc)))}`],
    target: sc => range(sc),
    own: (sc, ans) => own(ans, 'vox', sc.vox) * own(ans, 't', hangTime(sc)),
    needs: (sc, ans) => ({ routes: [[own(ans, 'vox', sc.vox), own(ans, 't', hangTime(sc))], ...(extraRoutes ? extraRoutes(sc) : [])] }),
    mistake: (v, sc, ans) => rangeMistake(v, sc, own(ans, 't', hangTime(sc))),
    right: (sc, ans) => `ΔX = ${fmt(own(ans, 'vox', sc.vox))} m/s × ${fmt(own(ans, 't', hangTime(sc)))} s = ${fmt(own(ans, 'vox', sc.vox) * own(ans, 't', hangTime(sc)))} m`
  });

  const readStep = (asked) => ({
    k: asked === 'x' ? 'vox' : 'voy', sym: asked === 'x' ? 'v_ox' : 'v_oy', unit: 'm/s', skill: 'read',
    ask: sc => sc.scale
      ? `Use the grid. How fast is the ${asked === 'x' ? 'sideways' : 'upward'} part?`
      : `Look at the picture. How fast is the ${asked === 'x' ? 'sideways' : 'upward'} part?`,
    formula: sc => sc.scale ? `squares × ${sc.scale} m/s` : '',
    hints: sc => sc.scale
      ? [`Count the squares along the ${asked === 'x' ? 'blue' : 'orange'} arrow.`, `Each square is worth ${sc.scale} m/s. Multiply your count by ${sc.scale}.`]
      : [`The ${asked === 'x' ? 'blue' : 'orange'} arrow has its speed printed beside it.`],
    target: sc => (asked === 'x' ? sc.vox : sc.voy),
    mistake: (v, sc) => readMistake(asked, v, sc),
    right: sc => (sc.scale
      ? `${asked === 'x' ? 'v_ox' : 'v_oy'} = ${asked === 'x' ? sc.gx : sc.gy} squares × ${sc.scale} m/s = ${fmt(asked === 'x' ? sc.vox : sc.voy)} m/s`
      : `${asked === 'x' ? 'v_ox' : 'v_oy'} = ${fmt(asked === 'x' ? sc.vox : sc.voy)} m/s`)
  });

  const splitStep = (asked) => {
    const fn = asked === 'x' ? 'cos' : 'sin';
    const sym = asked === 'x' ? 'v_ox' : 'v_oy';
    return {
      k: asked === 'x' ? 'vox' : 'voy', sym, unit: 'm/s', skill: 'split', calc: true,
      ask: () => `Split the launch. Find the ${asked === 'x' ? 'sideways' : 'upward'} part.`,
      formula: () => `${sym} = v_o × ${fn}(θ)`,
      hints: sc => [`The ${asked === 'x' ? 'sideways side touches θ' : 'upward side is across from θ'}, so use ${fn}.`, `In the calculator: ${sc.v0} × ${fn}(${sc.th})`],
      target: sc => (asked === 'x' ? sc.vox : sc.voy),
      needs: sc => ({ fn, routes: [[sc.v0, sc.th]] }),
      mistake: (v, sc) => splitMistake(asked, v, sc),
      right: sc => `${sym} = ${sc.v0} m/s × ${fn}(${sc.th}°) = ${fmt(asked === 'x' ? sc.vox : sc.voy)} m/s`
    };
  };

  // Time up alone (CP's first problem breaks the hang time into two boxes)
  const upCalcStep = {
    k: 'up', sym: 'time up', unit: 's', skill: 'time', calc: true,
    ask: () => 'How long does the ball take to reach the top?',
    formula: () => 'time up = v_oy ÷ g',
    hints: (sc, ans) => ['Gravity takes away 10 m/s each second. The ball reaches the top when v_oy is 0.', `In the calculator: ${fmt(own(ans, 'voy', sc.voy))} ÷ 10`],
    target: sc => timeUp(sc),
    own: (sc, ans) => own(ans, 'voy', sc.voy) / G,
    needs: (sc, ans) => ({ routes: [[own(ans, 'voy', sc.voy), G]] }),
    mistake: (v, sc) => {
      if (near(v, hangTime(sc), 0.01)) return ['whole_trip', 'That is the whole trip. This step is only the way up.'];
      if (near(v, sc.vox / G, 0.01)) return ['used_vox', 'You used v_ox. Only the upward speed decides the time. Use v_oy.'];
      if (near(v, sc.voy * G, 0.01)) return ['times_g', 'You multiplied by 10. Divide v_oy by 10.'];
      return null;
    },
    right: (sc, ans) => `time up = ${fmt(own(ans, 'voy', sc.voy))} m/s ÷ 10 m/s² = ${fmt(own(ans, 'voy', sc.voy) / G)} s`
  };

  // Double the time up, for the same first problem
  const doubleStep = {
    k: 't', sym: 't', unit: 's', skill: 'time', calc: true,
    ask: () => 'Going down takes the same time as going up. What is the hang time?',
    formula: () => 't = 2 × time up',
    hints: (sc, ans) => [`In the calculator: 2 × ${fmt(own(ans, 'up', timeUp(sc)))}`],
    target: sc => hangTime(sc),
    own: (sc, ans) => 2 * own(ans, 'up', timeUp(sc)),
    needs: (sc, ans) => ({ routes: [[own(ans, 'up', timeUp(sc))]] }),
    mistake: timeMistake,
    right: (sc, ans) => `t = 2 × ${fmt(own(ans, 'up', timeUp(sc)))} s = ${fmt(2 * own(ans, 'up', timeUp(sc)))} s`
  };

  const hangStep = (extraRoutes) => ({
    k: 't', sym: 't', unit: 's', skill: 'time', calc: true,
    ask: () => 'How long is the ball in the air? This is the hang time.',
    formula: () => 't = 2 × v_oy ÷ g',
    hints: (sc, ans) => ['Only v_oy matters here. g = 10 m/s².', `In the calculator: 2 × ${fmt(own(ans, 'voy', sc.voy))} ÷ 10`],
    target: sc => hangTime(sc),
    own: (sc, ans) => 2 * own(ans, 'voy', sc.voy) / G,
    needs: (sc, ans) => ({ routes: [[own(ans, 'voy', sc.voy)], [timeUp(sc)], ...(extraRoutes ? extraRoutes(sc) : [])] }),
    mistake: timeMistake,
    right: (sc, ans) => `t = 2 × ${fmt(own(ans, 'voy', sc.voy))} m/s ÷ 10 m/s² = ${fmt(2 * own(ans, 'voy', sc.voy) / G)} s`
  });

  // Conceptual: count seconds on the picture (a reading, so it stays typed), then add the way down.
  const countStep = {
    k: 'up', sym: 'seconds up', unit: 's', skill: 'count', stepper: { view: 'y', stop: 'land' },
    ask: () => 'Press Next second. How many seconds until v_oy is 0 at the top?',
    formula: () => '',
    hints: () => ['v_oy drops by 10 every second. Count the presses until the orange arrow is gone.'],
    target: sc => timeUp(sc),
    mistake: (v, sc) => {
      if (near(v, hangTime(sc), 0, 0.01)) return ['whole_trip', 'That is the whole trip, up and down. This step stops at the top.'];
      if (near(v, sc.voy, 0, 0.01)) return ['speed_not_time', `${sc.voy} is the speed. Count the seconds it takes to reach 0.`];
      return ['miscount', 'Count the presses until the orange arrow is gone.'];
    },
    right: sc => `${sc.voy} m/s drops to 0 in ${fmt(timeUp(sc))} s`
  };

  const addStep = {
    k: 't', sym: 't', unit: 's', skill: 'time', calc: true,
    ask: () => 'Going down takes the same time as going up. What is the hang time?',
    formula: () => 't = seconds up + seconds down',
    hints: (sc, ans) => [`In the calculator: ${fmt(own(ans, 'up', timeUp(sc)))} + ${fmt(own(ans, 'up', timeUp(sc)))}`],
    target: sc => hangTime(sc),
    own: (sc, ans) => 2 * own(ans, 'up', timeUp(sc)),
    needs: (sc, ans) => ({ routes: [[own(ans, 'up', timeUp(sc))]] }),
    mistake: (v, sc) => {
      if (near(v, timeUp(sc), 0, 0.01)) return ['no_double', 'That is only the way up. Add the same time for the way down.'];
      return ['add_up', 'Add the seconds up and the seconds down.'];
    },
    right: (sc, ans) => `t = ${fmt(own(ans, 'up', timeUp(sc)))} s + ${fmt(own(ans, 'up', timeUp(sc)))} s = ${fmt(2 * own(ans, 'up', timeUp(sc)))} s`
  };

  const STEP = {
    conceptual: { vox: readStep('x'), voy: readStep('y'), up: countStep, t: addStep, dx: dxStep() },
    cp: { vox: readStep('x'), voy: readStep('y'), up: upCalcStep, double: doubleStep, t: hangStep(), dx: dxStep() },
    honors: {
      vox: splitStep('x'), voy: splitStep('y'), up: upCalcStep, double: doubleStep,
      t: hangStep(sc => [[sc.v0, sc.th]]), dx: dxStep(sc => [[sc.v0, sc.th]])
    }
  };
  // A full flight, in order, for each class
  const FLIGHT = { conceptual: ['up', 't', 'dx'], cp: ['vox', 'voy', 't', 'dx'], honors: ['vox', 'voy', 't', 'dx'] };

  // Returns { ok, retry, mistake, msg }. retry = no penalty (calculator in the wrong mode).
  function gradeStep(step, raw, sc, ans) {
    const v = parseNum(raw);
    if (v === null) return { ok: false, mistake: 'blank', msg: `<span class="formula">${step.right(sc, ans)}</span>` };
    const ok = near(v, step.target(sc, ans)) || (step.own && near(v, step.own(sc, ans), 0.01));
    if (ok) return { ok: true, msg: `<span class="formula">${step.right(sc, ans)}</span>` };
    const hit = step.mistake ? step.mistake(v, sc, ans) : null;
    if (hit && hit[2]) return { ok: false, retry: true, mistake: hit[0], msg: hit[1] };
    return {
      ok: false,
      mistake: hit ? hit[0] : 'other',
      msg: `${hit ? hit[1] : 'Not quite.'}<br><span class="worked">The right way: <span class="formula">${step.right(sc, ans)}</span></span>`
    };
  }

  // ---------- Concept questions. Plain JSON so a Mastery Check resumes with the same numbers. ----------
  const shuffled = n => {
    const a = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const CONCEPT = {
    top: {
      make: () => ({ sc: { vox: pick([10, 15, 20, 25]), voy: pick([20, 30, 40]) } }),
      text: () => 'The ball is at the very top. What are its speeds right now?',
      scene: q => ({ mode: 'flight', sc: q.sc, t: timeUp(q.sc), view: 'x', hideValues: true, fullPath: true }),
      options: () => [
        { id: 'r', t: 'v_oy is 0. v_ox has not changed.' },
        { id: 'both', t: 'v_oy and v_ox are both 0.' },
        { id: 'x0', t: 'v_ox is 0. v_oy has not changed.' }
      ],
      right: () => 'r',
      mistake: () => 'top_stops',
      why: () => 'At the top the ball stops rising, so v_oy is 0. Nothing pushes it sideways, so v_ox stays the same.'
    },
    same_voy: {
      make: () => { const voy = pick([20, 30, 40]); return { a: { vox: 30, voy }, b: { vox: 10, voy } }; },
      text: () => 'Ball A and ball B have the same v_oy. Ball A has a bigger v_ox. Which lands first?',
      scene: q => ({ mode: 'compare', a: q.a, b: q.b }),
      options: () => [{ id: 'r', t: 'They land at the same time.' }, { id: 'a', t: 'Ball A lands first.' }, { id: 'b', t: 'Ball B lands first.' }],
      right: () => 'r',
      mistake: () => 'vox_changes_time',
      why: q => `Hang time depends only on v_oy. Both balls have v_oy = ${q.a.voy} m/s, so both stay up ${fmt(hangTime(q.a))} s.`
    },
    more_voy: {
      make: () => {
        const big = pick(['a', 'b']), vox = pick([10, 15, 20]);
        const hi = { vox, voy: 40 }, lo = { vox, voy: 20 };
        return { big, a: big === 'a' ? hi : lo, b: big === 'a' ? lo : hi };
      },
      text: () => 'Ball A and ball B have the same v_ox. Look at their v_oy. Which one lands farther away?',
      scene: q => ({ mode: 'compare', a: q.a, b: q.b, hideLanding: true }),
      options: () => [{ id: 'a', t: 'Ball A' }, { id: 'b', t: 'Ball B' }, { id: 'same', t: 'They land in the same spot.' }],
      right: q => q.big,
      mistake: () => 'voy_no_range',
      why: () => 'A bigger v_oy keeps the ball in the air longer. More seconds at the same v_ox means more distance.'
    },
    double_vox: {
      make: () => ({ sc: { vox: pick([10, 15, 20]), voy: pick([20, 30]) } }),
      text: () => 'Keep the same v_oy. Make v_ox twice as big. What happens to the range?',
      scene: q => ({ mode: 'launch', sc: q.sc, labels: { vox: true, voy: true } }),
      options: () => [{ id: 'r', t: 'The range doubles.' }, { id: 'same', t: 'The range stays the same.' }, { id: 'half', t: 'The range is cut in half.' }],
      right: () => 'r',
      mistake: () => 'range_not_linear',
      why: () => 'The hang time stays the same because v_oy did not change. ΔX = v_ox × t, so twice the v_ox means twice the distance.'
    },
    steeper: {
      make: () => ({ sc: { v0: 30, th: 30, vox: 30 * Math.cos(rad(30)), voy: 30 * Math.sin(rad(30)) } }),
      text: () => 'Keep the same launch speed. Raise the angle from 30° to 60°. What happens to the hang time?',
      scene: q => ({ mode: 'launch', sc: q.sc, labels: { v0: true, th: true } }),
      options: () => [{ id: 'r', t: 'It gets longer.' }, { id: 'short', t: 'It gets shorter.' }, { id: 'same', t: 'It stays the same.' }],
      right: () => 'r',
      mistake: () => 'angle_time',
      why: () => 'A steeper launch sends more of the speed upward. v_oy goes from 15 m/s to about 26 m/s, so the ball stays up longer.'
    }
  };

  const conceptOptions = q => q.order.map(i => CONCEPT[q.id].options(q)[i]);
  function makeConcept(id) {
    const def = CONCEPT[id];
    return Object.assign({ kind: 'mc', id, skill: 'concept', order: shuffled(def.options({}).length) }, def.make());
  }
  function gradeConcept(q, picked) {
    const def = CONCEPT[q.id];
    const ok = picked === def.right(q);
    return { ok, mistake: ok ? null : def.mistake(q), msg: def.why(q) };
  }

  // ---------- Mastery Check: same blueprint every retake, new numbers. 2 flights + 2 concept questions. ----------
  function buildQuiz(tier) {
    const flights = [newLaunch(tier, 2), null];
    flights[1] = newLaunch(tier, 2, flights[0]);
    const qs = [];
    flights.forEach((sc, f) => FLIGHT[tier].forEach(k => qs.push({ kind: 'step', k, f, skill: STEP[tier][k].skill })));
    const first = pick(['same_voy', 'top']);
    const second = tier === 'honors' ? 'steeper' : pick(['more_voy', 'double_vox']);
    qs.push(makeConcept(first), makeConcept(second));
    return { tier, flights, qs, answers: qs.map(() => null), work: qs.map(() => null), i: 0 };
  }

  // Follow-through: a later step is graded against the student's own earlier answers, so one slip costs one point.
  function gradeQuiz(quiz) {
    const chains = quiz.flights.map(() => ({}));
    const results = quiz.qs.map((q, i) => {
      const raw = quiz.answers[i];
      if (q.kind === 'mc') return Object.assign({ skill: q.skill }, gradeConcept(q, raw));
      const step = STEP[quiz.tier][q.k];
      const r = gradeStep(step, raw === null || raw === undefined ? '' : raw, quiz.flights[q.f], chains[q.f]);
      const v = parseNum(raw);
      if (v !== null) chains[q.f][q.k] = v;
      return { skill: q.skill, ok: r.ok, mistake: r.ok ? null : r.mistake, msg: r.msg };
    });
    const correct = results.filter(r => r.ok).length;
    const skills = {};
    results.forEach(r => {
      skills[r.skill] = skills[r.skill] || { right: 0, total: 0 };
      skills[r.skill].total++;
      if (r.ok) skills[r.skill].right++;
    });
    return { results, correct, total: results.length, pct: Math.round(100 * correct / results.length), skills };
  }

  window.PR = {
    G, TEACH_LAUNCH, STEP, FLIGHT, CONCEPT,
    hangTime, timeUp, range, apex, fmt, near, parseNum, pick, rad, own,
    newLaunch, workProblem, gradeStep, makeConcept, conceptOptions, gradeConcept, buildQuiz, gradeQuiz
  };
})();

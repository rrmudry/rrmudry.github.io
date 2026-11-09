// Centripetal Acceleration Workshop — physics, problems for each class, answer checking, diagnostics, Mastery Check.
// The big idea: going around a circle at a steady speed is still accelerating, because the direction of the velocity
// keeps changing. The acceleration points to the center: a_c = v² ÷ r.
// All three classes see the same circles. They differ in how they find a_c:
//   conceptual (P1–3): compare two circles. Twice the speed makes a_c 4 times as big; half the radius makes it twice as
//                      big. They multiply the old a_c by that factor. No division.
//   cp (P4–6):         v and r are on the picture: a_c = v² ÷ r.
//   honors (P0):       the same, plus v from the time for one lap (v = 2πr ÷ T), and working backward to the fastest
//                      safe speed on a curve (v = √(a_c × r)).
// Every wrong answer is compared against known mistakes, so the student hears WHY. Mistake ids feed the teacher monitor.

(function () {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffled = n => {
    const a = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // The circle used on every teaching page: 10 m/s on a 10 m circle, so one second turns it one radian.
  const TEACH = { v: 10, r: 10 };

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
  const accel = (v, r) => (v * v) / r;

  // ---------- Problems ----------
  // a_c = v² ÷ r with friendly results. Level 1: whole numbers. Level 2: up to one decimal place.
  const SPEEDS_1 = [4, 5, 6, 8, 10, 12, 15, 20];
  const SPEEDS_2 = [6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 25, 30];
  const RADII = [5, 8, 10, 12, 15, 16, 18, 20, 24, 25, 30, 32, 36, 40, 45, 50, 60, 64, 75, 80, 90, 100];
  const AC_PAIRS = level => {
    const out = [];
    (level === 1 ? SPEEDS_1 : SPEEDS_2).forEach(v => RADII.forEach(r => {
      const a = accel(v, r), tenths = Math.round(a * 10);
      if (a < 2 || a > 25 || Math.abs(a * 10 - tenths) > 1e-9) return;
      if (level === 1 && Math.abs(a - Math.round(a)) > 1e-9) return;
      out.push({ v, r });
    }));
    return out;
  };
  const PAIRS = { 1: AC_PAIRS(1), 2: AC_PAIRS(2) };

  function acProblem(level = 2) {
    const { v, r } = pick(PAIRS[level === 1 ? 1 : 2]);
    return { kind: 'ac', v, r, a: accel(v, r) };
  }

  // Conceptual: the same circle changed one way. The old a_c is on the picture; the new one is that times a factor.
  const BASES = [[10, 20], [10, 50], [6, 12], [8, 16], [8, 32], [4, 8], [12, 24], [12, 36], [6, 18], [4, 4], [6, 6]];
  function compareProblem(level = 2) {
    for (;;) {
      const [v1, r1] = pick(BASES), a1 = accel(v1, r1);
      const change = pick(level === 1 ? ['v2', 'rhalf'] : ['v2', 'v2', 'v3', 'rhalf']);
      if (change === 'v3' && v1 > 8) continue;
      const v2 = change === 'v2' ? 2 * v1 : change === 'v3' ? 3 * v1 : v1;
      const r2 = change === 'rhalf' ? r1 / 2 : r1;
      const factor = change === 'v2' ? 4 : change === 'v3' ? 9 : 2;
      return { kind: 'compare', change, v1, r1, a1, v2, r2, factor, a2: a1 * factor };
    }
  }

  // Honors: speed from the time for one lap
  function periodProblem() {
    for (;;) {
      const r = pick([2, 3, 4, 5, 6, 8, 10, 12]), T = pick([2, 3, 4, 5, 6, 8]);
      const v = 2 * Math.PI * r / T, a = accel(v, r);
      if (a < 2 || a > 60) continue;
      return { kind: 'period', r, T, v, a };
    }
  }

  // Honors: the fastest speed around a curve when the tires can only give so much a_c
  function vmaxProblem() {
    const a = pick([4, 5, 6, 8]), r = pick([20, 25, 30, 40, 45, 50, 80, 100]);
    return { kind: 'vmax', a, r, v: Math.sqrt(a * r) };
  }

  const MAKERS = { ac: acProblem, compare: compareProblem, period: periodProblem, vmax: vmaxProblem };
  const same = (a, b) => !!(a && b) && a.kind === b.kind && ['v', 'r', 'v1', 'r1', 'change', 'T', 'a'].every(k => a[k] === b[k]);

  function newProblem(kind, level = 2, not) {
    let sc;
    do { sc = MAKERS[kind](level); } while (same(sc, not));
    return sc;
  }

  // ---------- Calculator work: a looked-up number alone can't pass ----------
  // needs = { fn: 'sqrt', pi: true, routes: [[numbers], ...] }. Any one route of the problem's numbers counts.
  function workProblem(work, needs = {}) {
    if (!work.fns.length && work.nums.length <= 1 && !/\\pi/.test(work.latex || '')) return 'Type the whole calculation into the calculator, not just the answer.';
    if (needs.fn && !work.fns.includes(needs.fn)) return `Your calculation needs to use the ${needs.label || needs.fn} button.`;
    if (needs.pi && !/\\pi/.test(work.latex || '')) return 'Your calculation needs to use the π button.';
    const has = n => work.nums.some(w => Math.abs(w - Math.abs(n)) <= Math.max(Math.abs(n) * 0.015, 0.051));
    const routes = needs.routes || [];
    if (routes.length && !routes.some(r => r.every(has))) {
      return `Your calculation needs to use the numbers from this problem. Look for ${routes[0].map(fmt).join(' and ')}.`;
    }
    return null;
  }

  // Student's own earlier answer when there is one, for follow-through credit and for matching their work
  const own = (ans, k, fallback) => (ans && typeof ans[k] === 'number' ? ans[k] : fallback);

  // ---------- Steps ----------
  // Each step: k, sym, unit, skill, ask, formula, hints, target, own (follow-through), calc (needs Desmos), needs, mistake, right.
  const changeWords = {
    v2: 'The speed doubled. Same circle.',
    v3: 'The speed tripled. Same circle.',
    rhalf: 'The circle is half as wide. Same speed.'
  };

  const factorStep = {
    k: 'factor', sym: 'new a_c is', noEq: true, unit: 'times as big', skill: 'pattern',
    ask: sc => `${changeWords[sc.change]} How many times as big is the new a_c?`,
    formula: sc => (sc.change === 'rhalf' ? 'smaller circle → bigger a_c' : 'speed counts twice: speed change × speed change'),
    hints: sc => (sc.change === 'rhalf'
      ? ['A tighter turn bends the path faster, so a_c gets bigger.', 'Half the radius makes a_c 2 times as big.']
      : [`Compare the two speeds on the picture. The new one is ${sc.change === 'v2' ? 2 : 3} times as fast.`, `Speed counts twice: ${sc.change === 'v2' ? '2 × 2' : '3 × 3'}.`]),
    target: sc => sc.factor,
    mistake: (v, sc) => {
      if (sc.change !== 'rhalf' && near(v, sc.factor === 4 ? 2 : 3, 0, 0.01)) return ['no_square', `Speed counts twice. ${sc.factor === 4 ? '2 × 2 = 4' : '3 × 3 = 9'}, not ${fmt(v)}.`];
      if (sc.change === 'v3' && near(v, 6, 0, 0.01)) return ['added_not_squared', 'That is 3 + 3. Speed counts twice, so multiply: 3 × 3 = 9.'];
      if (sc.change === 'rhalf' && near(v, 0.5, 0, 0.01)) return ['radius_flip', 'A smaller circle makes a_c bigger, not smaller. It is a tighter turn.'];
      if (sc.change === 'rhalf' && near(v, 4, 0, 0.01)) return ['radius_squared', 'Only speed counts twice. Half the radius makes a_c 2 times as big.'];
      if (near(v, 1, 0, 0.01)) return ['no_change', 'It does change. Look at what is different in the second circle.'];
      return null;
    },
    right: sc => (sc.change === 'rhalf' ? 'Half the radius → 2 times as big' : `${sc.change === 'v2' ? '2 × 2' : '3 × 3'} → ${sc.factor} times as big`)
  };

  const newAcStep = {
    k: 'newac', sym: 'new a_c', unit: 'm/s²', skill: 'pattern', calc: true,
    ask: () => 'Now find the new a_c.',
    formula: () => 'new a_c = old a_c × how many times as big',
    hints: (sc, ans) => ['The old a_c is on the first circle.', `In the calculator: ${fmt(sc.a1)} × ${fmt(own(ans, 'factor', sc.factor))}`],
    target: sc => sc.a2,
    own: (sc, ans) => sc.a1 * own(ans, 'factor', sc.factor),
    needs: (sc, ans) => ({ routes: [[sc.a1, own(ans, 'factor', sc.factor)]] }),
    mistake: (v, sc) => {
      if (sc.change !== 'rhalf' && near(v, sc.a1 * (sc.factor === 4 ? 2 : 3), 0.01)) return ['no_square', `Speed counts twice. Multiply by ${sc.factor}, not ${sc.factor === 4 ? 2 : 3}.`];
      if (near(v, sc.a1 / 2, 0.01)) return ['radius_flip', 'A smaller circle makes a_c bigger, not smaller.'];
      if (near(v, sc.a1 + sc.factor, 0.01)) return ['added', 'You added. "Times as big" means multiply.'];
      if (near(v, sc.a1, 0.01)) return ['no_change', 'That is the old a_c. The new one is bigger.'];
      return null;
    },
    right: (sc, ans) => {
      const f = own(ans, 'factor', sc.factor);
      return `new a_c = ${fmt(sc.a1)} m/s² × ${fmt(f)} = ${fmt(sc.a1 * f)} m/s²`;
    }
  };

  const ownV = (sc, ans) => own(ans, 'v', sc.v);

  const acStep = {
    k: 'ac', sym: 'a_c', unit: 'm/s²', skill: 'ac', calc: true,
    ask: sc => (sc.kind === 'period' ? 'Now find the centripetal acceleration.' : 'Find the centripetal acceleration.'),
    formula: () => 'a_c = v² ÷ r',
    hints: (sc, ans) => ['v² means v × v. Speed counts twice.', `In the calculator: ${fmt(ownV(sc, ans))} × ${fmt(ownV(sc, ans))} ÷ ${fmt(sc.r)}`],
    target: sc => sc.a,
    own: (sc, ans) => accel(ownV(sc, ans), sc.r),
    needs: (sc, ans) => ({ routes: [[ownV(sc, ans), sc.r]] }),
    mistake: (x, sc, ans) => {
      const v = ownV(sc, ans), r = sc.r;
      if (near(x, v / r, 0.01)) return ['no_square', 'You used v, not v². Speed counts twice: v × v.'];
      if (near(x, v * v * r, 0.01)) return ['times_r', 'You multiplied by r. A bigger circle makes a_c smaller, so divide by r.'];
      if (near(x, r / (v * v), 0.01)) return ['flipped', 'You divided the wrong way. v² goes on top: v² ÷ r.'];
      if (near(x, 2 * v / r, 0.01)) return ['doubled', 'That is 2 × v. v² means v × v, not v + v.'];
      if (near(x, v * v, 0.01)) return ['no_r', 'That is v². Now divide by r.'];
      return null;
    },
    right: (sc, ans) => {
      const v = ownV(sc, ans);
      return `a_c = ${fmt(v)}² ÷ ${fmt(sc.r)} = ${fmt(v * v)} ÷ ${fmt(sc.r)} = ${fmt(accel(v, sc.r))} m/s²`;
    }
  };

  const speedStep = {
    k: 'v', sym: 'v', unit: 'm/s', skill: 'period', calc: true,
    ask: () => 'The picture shows the time for one lap. How fast does it move?',
    formula: () => 'v = 2πr ÷ T',
    hints: sc => ['One lap is 2πr, the distance around. Use the π button.', `In the calculator: 2 × π × ${fmt(sc.r)} ÷ ${fmt(sc.T)}`],
    target: sc => sc.v,
    needs: sc => ({ pi: true, routes: [[sc.r, sc.T]] }),
    mistake: (x, sc) => {
      const { r, T } = sc;
      if (near(x, Math.PI * r / T, 0.01)) return ['half_lap', 'That is πr, half a lap. One lap is 2πr.'];
      if (near(x, 2 * Math.PI * r * T, 0.01)) return ['times_T', 'You multiplied by T. Distance ÷ time gives speed.'];
      if (near(x, r / T, 0.01)) return ['used_r', 'r only reaches from the center to the edge. One lap is 2πr.'];
      if (near(x, 2 * Math.PI * r, 0.01)) return ['no_T', 'That is the distance around. Divide by the time for one lap.'];
      if (near(x, Math.PI * r * r / T, 0.01)) return ['area', 'πr² is the area inside the circle. The distance around is 2πr.'];
      return null;
    },
    right: sc => `v = 2 × π × ${fmt(sc.r)} ÷ ${fmt(sc.T)} = ${fmt(sc.v)} m/s`
  };

  const vmaxStep = {
    k: 'vmax', sym: 'v', unit: 'm/s', skill: 'backward', calc: true,
    ask: () => 'The tires can give at most the a_c on the picture. What is the fastest speed around this curve?',
    formula: () => 'v = √(a_c × r)',
    hints: sc => ['v² = a_c × r, so take the square root.', `In the calculator: √(${fmt(sc.a)} × ${fmt(sc.r)})`],
    target: sc => sc.v,
    needs: sc => ({ fn: 'sqrt', label: 'square root', routes: [[sc.a, sc.r]] }),
    mistake: (x, sc) => {
      if (near(x, sc.a * sc.r, 0.01)) return ['no_root', 'That is v². Take the square root to get v.'];
      if (near(x, Math.sqrt(sc.a / sc.r), 0.01)) return ['divided', 'a_c = v² ÷ r, so v² = a_c × r. Multiply, then take the square root.'];
      if (near(x, sc.a / sc.r, 0.01) || near(x, sc.r / sc.a, 0.01)) return ['divided', 'Multiply a_c by r, then take the square root.'];
      return null;
    },
    right: sc => `v = √(${fmt(sc.a)} × ${fmt(sc.r)}) = ${fmt(sc.v)} m/s`
  };

  const STEP = {
    conceptual: { factor: factorStep, newac: newAcStep },
    cp: { ac: acStep },
    honors: { ac: acStep, v: speedStep, vmax: vmaxStep }
  };

  // The steps of a whole problem, in order
  const SOLVE = { compare: ['factor', 'newac'], ac: ['ac'], period: ['v', 'ac'], vmax: ['vmax'] };

  // A calculation reads one step per line with the equals signs lined up, never as one long chain.
  function stack(calc) {
    const [sym, ...steps] = calc.split(' = ');
    if (!steps.length) return `<span class="formula">${calc}</span>`;
    return `<span class="calc-stack">${steps.map(s => `<span class="calc-sym">${sym}</span><span>=</span><span>${s}</span>`).join('')}</span>`;
  }

  // Returns { ok, retry, mistake, msg }. retry = no new numbers.
  function gradeStep(step, raw, sc, ans) {
    const v = parseNum(raw);
    if (v === null) return { ok: false, mistake: 'blank', msg: stack(step.right(sc, ans)) };
    const ok = near(v, step.target(sc, ans)) || (step.own && near(v, step.own(sc, ans), 0.01));
    if (ok) return { ok: true, msg: stack(step.right(sc, ans)) };
    const hit = step.mistake ? step.mistake(v, sc, ans) : null;
    if (hit && hit[2]) return { ok: false, retry: true, mistake: hit[0], msg: hit[1] };
    return {
      ok: false,
      mistake: hit ? hit[0] : 'other',
      msg: `${hit ? hit[1] : 'Not quite.'}<br><span class="worked">The right way: ${stack(step.right(sc, ans))}</span>`
    };
  }

  // ---------- Concept questions. Plain JSON so a Mastery Check resumes with the same numbers. ----------
  const LETTERS = ['A', 'B', 'C', 'D'];
  // Gives each direction on the picture a random letter
  function letterMap(keys) {
    const order = shuffled(keys.length);
    const map = {};
    keys.forEach((k, i) => { map[k] = LETTERS[order[i]]; });
    return map;
  }
  const typeOf = (q, letter) => Object.keys(q.letters || {}).find(k => q.letters[k] === letter);
  const letterOptions = (n, word) => LETTERS.slice(0, n).map(l => ({ id: l, t: `${word} ${l}` }));
  const SPOTS = [20, 45, 70, 110, 135, 160, 200, 225, 250, 290, 315, 340];

  const CONCEPT = {
    accel_turn: {
      make: () => ({ v: pick([8, 10, 12, 15]) }),
      text: () => 'This car goes around the track at a steady speed. Is it accelerating?',
      scene: q => ({ mode: 'circle', phi: 60, vLabel: `v = ${q.v || 10} m/s`, speedNote: `Speed: ${q.v || 10} m/s the whole way`, ghosts: [-60, 0], car: true }),
      options: () => [
        { id: 'r', t: 'Yes. Its direction keeps changing, so its velocity changes.' },
        { id: 'no', t: 'No. Its speed never changes.' },
        { id: 'speed', t: 'Only if it speeds up or slows down.' }
      ],
      right: () => 'r',
      mistake: () => 'speed_only',
      why: () => 'Velocity is speed and direction. Turning changes the direction, so the velocity changes. A change in velocity is acceleration.'
    },
    v_dir: {
      letters: true,
      make: () => ({ phi: pick(SPOTS), letters: letterMap(['fwd', 'back', 'in', 'out']) }),
      text: () => 'The puck goes around the circle the way the curved arrow shows. Which arrow shows its velocity right now?',
      scene: q => ({ mode: 'pick', phi: q.phi, letters: q.letters, kind: 'arrows' }),
      options: () => letterOptions(4, 'Arrow'),
      right: q => q.letters.fwd,
      mistake: (q, picked) => ({ in: 'v_inward', out: 'v_outward', back: 'v_backward' }[typeOf(q, picked)] || 'v_dir'),
      why: q => `Arrow ${q.letters.fwd}. Velocity points the way the puck is moving right now. That is along the tangent line, which just touches the circle.`
    },
    a_dir: {
      letters: true,
      make: () => ({ phi: pick(SPOTS), letters: letterMap(['fwd', 'back', 'in', 'out']) }),
      text: () => 'The puck goes around the circle at a steady speed. Which arrow shows its acceleration right now?',
      scene: q => ({ mode: 'pick', phi: q.phi, letters: q.letters, kind: 'arrows' }),
      options: () => letterOptions(4, 'Arrow'),
      right: q => q.letters.in,
      mistake: (q, picked) => ({ out: 'a_outward', fwd: 'a_along_v', back: 'a_along_v' }[typeOf(q, picked)] || 'a_dir'),
      why: q => `Arrow ${q.letters.in}. The acceleration points toward the center of the circle. That is why it is called centripetal: center-seeking.`
    },
    release_path: {
      letters: true,
      make: () => ({ phi: pick(SPOTS), letters: letterMap(['tan', 'out', 'curve']) }),
      text: () => 'The stopper whirls the way the curved arrow shows. The string is let go right now. Which path does the stopper take?',
      scene: q => ({ mode: 'pick', phi: q.phi, letters: q.letters, kind: 'paths' }),
      options: () => letterOptions(3, 'Path'),
      right: q => q.letters.tan,
      mistake: (q, picked) => ({ out: 'flies_outward', curve: 'keeps_curving' }[typeOf(q, picked)] || 'release_path'),
      why: q => `Path ${q.letters.tan}. Once the string lets go, nothing pulls the stopper toward the center. With no force, it keeps going straight the way it was moving: along the tangent line.`
    },
    paint: {
      letters: true,
      make: () => ({ phi: pick(SPOTS), letters: letterMap(['tan', 'out', 'curve']) }),
      text: () => 'A drop of paint slides off the edge of a spinning sheet of paper. Seen from above, which path does it take after it leaves?',
      scene: q => ({ mode: 'pick', phi: q.phi, letters: q.letters, kind: 'paths', paper: true }),
      options: () => letterOptions(3, 'Path'),
      right: q => q.letters.tan,
      mistake: (q, picked) => ({ out: 'flies_outward', curve: 'keeps_curving' }[typeOf(q, picked)] || 'release_path'),
      why: q => `Path ${q.letters.tan}. Off the paper, nothing pulls the drop toward the center, so it goes straight along the tangent line.`
    },
    speed_double: {
      make: () => { const [v, r] = pick(BASES); return { v, r, a: accel(v, r) }; },
      text: () => 'Same circle, but now twice as fast. What happens to the centripetal acceleration?',
      scene: q => ({ mode: 'compare', sc: { change: 'v2', v1: q.v || 10, r1: q.r || 20, a1: q.a || 5, v2: 2 * (q.v || 10), r2: q.r || 20 } }),
      options: q => [
        { id: 'r', t: `It is 4 times as big: ${fmt(4 * (q.a || 5))} m/s².` },
        { id: 'two', t: `It is 2 times as big: ${fmt(2 * (q.a || 5))} m/s².` },
        { id: 'same', t: `It stays the same: ${fmt(q.a || 5)} m/s².` }
      ],
      right: () => 'r',
      mistake: (q, picked) => (picked === 'two' ? 'no_square' : 'speed_no_effect'),
      why: () => 'Speed counts twice in a_c = v² ÷ r. Twice the speed makes a_c 2 × 2 = 4 times as big.'
    },
    radius_half: {
      make: () => { const [v, r] = pick(BASES.filter(([, r]) => r % 2 === 0)); return { v, r, a: accel(v, r) }; },
      text: () => 'Same speed, but the circle is half as wide. What happens to the centripetal acceleration?',
      scene: q => ({ mode: 'compare', sc: { change: 'rhalf', v1: q.v || 10, r1: q.r || 20, a1: q.a || 5, v2: q.v || 10, r2: (q.r || 20) / 2 } }),
      options: q => [
        { id: 'r', t: `It is 2 times as big: ${fmt(2 * (q.a || 5))} m/s².` },
        { id: 'half', t: `It is half as big: ${fmt((q.a || 5) / 2)} m/s².` },
        { id: 'same', t: `It stays the same: ${fmt(q.a || 5)} m/s².` }
      ],
      right: () => 'r',
      mistake: (q, picked) => (picked === 'half' ? 'radius_flip' : 'radius_no_effect'),
      why: () => 'A tighter turn bends the path faster. Half the radius makes a_c 2 times as big.'
    },
    right_angle: {
      make: () => ({ phi: pick(SPOTS) }),
      text: () => 'On a circle at a steady speed, how do the velocity arrow and the acceleration arrow line up?',
      scene: q => ({ mode: 'circle', phi: q.phi || 45, showA: true, vLabel: 'v', aLabel: 'a_c', ghosts: [] }),
      options: () => [
        { id: 'r', t: 'At a right angle. Velocity is along the tangent, and a_c points to the center.' },
        { id: 'same', t: 'They point the same way.' },
        { id: 'opposite', t: 'They point opposite ways.' }
      ],
      right: () => 'r',
      mistake: () => 'a_along_v',
      why: () => 'a_c is always at a right angle to v. That is why it only turns the puck and never speeds it up or slows it down.'
    }
  };

  const conceptOptions = q => (CONCEPT[q.id].letters ? CONCEPT[q.id].options(q) : q.order.map(i => CONCEPT[q.id].options(q)[i]));
  function makeConcept(id) {
    const def = CONCEPT[id];
    return Object.assign({ kind: 'mc', id, skill: 'concept', order: shuffled(def.options({}).length) }, def.make());
  }
  function gradeConcept(q, picked) {
    const def = CONCEPT[q.id];
    const ok = picked === def.right(q);
    return { ok, mistake: ok ? null : def.mistake(q, picked), msg: def.why(q) };
  }

  // ---------- Mastery Check: same blueprint every retake, new numbers. ----------
  const QUIZ_PROBLEMS = { conceptual: ['compare', 'compare'], cp: ['ac', 'ac'], honors: ['period', 'vmax'] };

  function buildQuiz(tier) {
    const probs = [];
    QUIZ_PROBLEMS[tier].forEach((kind, f) => probs.push(newProblem(kind, 2, probs[f - 1])));
    const qs = [];
    probs.forEach((sc, f) => SOLVE[sc.kind].forEach(k => qs.push({ kind: 'step', k, f, skill: STEP[tier][k].skill })));
    const dirs = pick(['v_dir', 'a_dir', 'release_path']);
    const ideas = tier === 'conceptual' ? pick(['accel_turn', 'paint', 'right_angle']) : pick(['speed_double', 'radius_half', 'accel_turn']);
    qs.push(makeConcept(dirs), makeConcept(ideas));
    if (tier === 'cp') qs.push(makeConcept(pick(['paint', 'right_angle'].concat(dirs === 'release_path' ? [] : ['release_path']))));
    return { tier, probs, qs, answers: qs.map(() => null), work: qs.map(() => null), i: 0 };
  }

  // Follow-through: a later step is graded against the student's own earlier answers, so one slip costs one point.
  function gradeQuiz(quiz) {
    const chains = quiz.probs.map(() => ({}));
    const results = quiz.qs.map((q, i) => {
      const raw = quiz.answers[i];
      if (q.kind === 'mc') return Object.assign({ skill: q.skill }, gradeConcept(q, raw));
      const step = STEP[quiz.tier][q.k];
      const r = gradeStep(step, raw === null || raw === undefined ? '' : raw, quiz.probs[q.f], chains[q.f]);
      const v = parseNum(raw);
      if (v !== null) chains[q.f][step.k] = v;
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
    TEACH, STEP, SOLVE, CONCEPT, PAIRS, BASES,
    accel, fmt, near, parseNum, pick, own,
    newProblem, workProblem, stack, gradeStep, makeConcept, conceptOptions, gradeConcept, buildQuiz, gradeQuiz
  };
})();

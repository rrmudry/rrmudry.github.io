// Monkey Hunter Studio — physics, problems for each class, answer checking, diagnostics, Mastery Check.
// g = 10 m/s². The big idea: a projectile falls below its straight inertial path by exactly the distance a dropped
// ball falls in the same time: drop = 5 × t². The strings on the meter stick are those drops.
// All three classes solve the same hunt. They only differ in how they find the time and the launch numbers:
//   conceptual (P1–3): count the marks on the stick, then read the drop from their own measured table. No division.
//   cp (P4–6):         v_ox and ΔX are on the picture: t = ΔX ÷ v_ox, then drop = 5 × t².
//   honors (P0):       find the aim angle with tan⁻¹, split v_o with cos, then the same steps. Adds the proof that speed
//                      cancels, the smallest speed that works, and a monkey that lets go early.
// Every wrong answer is compared against known mistakes, so the student hears WHY. Mistake ids feed the teacher monitor.

(function () {
  const G = 10;
  const rad = d => d * Math.PI / 180;
  const deg = r => r * 180 / Math.PI;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const dropAt = (t, g = G) => 0.5 * g * t * t;
  const DROPS = [5, 20, 45, 80];   // what a dropped ball falls in 1, 2, 3, 4 s

  // The shot used on every teaching page: 4 s to the monkey, so all four strings show
  const teachHunt = () => hunt(20, 30, 4);
  function hunt(vox, voy, t) { return { vox, voy, t, D: vox * t, H: voy * t }; }

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

  // ---------- Problems. Level 1 is friendly numbers; level 2 is the full range. ----------
  // Every hunt meets above the ground, with room to see it.
  const makers = {
    conceptual: level => hunt(pick([10, 15, 20, 25]), pick([30, 40]), pick(level === 1 ? [2, 3] : [2, 3, 4])),
    cp: level => hunt(pick([8, 10, 12, 16, 20, 24]), pick([25, 30, 35, 40]), pick(level === 1 ? [2, 3, 4] : [2, 2.5, 3, 4])),
    honors: () => {
      for (;;) {
        const D = pick([40, 50, 60, 80, 100]), H = pick([30, 40, 50, 60, 80]), v0 = pick([30, 35, 40, 45, 50]);
        const a = Math.atan(H / D), th = deg(a);
        const vox = v0 * Math.cos(a), t = D / vox;
        if (H - dropAt(t) < 8 || Math.abs(th - 45) < 4) continue;
        return { v0, th, vox, voy: v0 * Math.sin(a), t, D, H };
      }
    }
  };

  function newHunt(tier, level = 2, not) {
    let sc;
    do { sc = makers[tier](level); } while (not && near(sc.D, not.D, 0, 0.01) && near(sc.H, not.H, 0, 0.01) && near(sc.t, not.t, 0, 0.01));
    return sc;
  }

  // A hunt that may be too slow. Always whole seconds, so the drop can be read from the table.
  function newSlowCall() {
    const slow = Math.random() < 0.5;
    const t = slow ? pick([3, 4]) : pick([2, 3]);
    const voy = slow ? (t === 3 ? 10 : pick([10, 15])) : pick([30, 40]);
    return { slow, sc: hunt(pick([10, 15, 20]), voy, t) };
  }

  // Honors: how slow can the shot go? Monkey hits the ground at t = √(H ÷ 5).
  const newMinSpeed = () => ({ D: pick([40, 60, 80, 100]), H: pick([20, 30, 45, 50, 60, 80]) });

  // ---------- Calculator work: a looked-up number alone can't pass ----------
  // needs = { fn: 'cos' | 'arctan' | ..., routes: [[numbers], ...] }. Any one route of the problem's numbers counts.
  function workProblem(work, needs = {}) {
    if (!work.fns.length && work.nums.length <= 1) return 'Type the whole calculation into the calculator, not just the answer.';
    if (needs.fn && !work.fns.includes(needs.fn)) return `Your calculation needs to use the ${needs.label || needs.fn} button.`;
    const has = n => work.nums.some(w => Math.abs(w - Math.abs(n)) <= Math.max(Math.abs(n) * 0.015, 0.051));
    const routes = needs.routes || [];
    if (routes.length && !routes.some(r => r.every(has))) {
      return `Your calculation needs to use the numbers from this problem. Look for ${routes[0].map(fmt).join(' and ')}.`;
    }
    return null;
  }

  // Student's own earlier answer when there is one, for follow-through credit and for matching their work
  const own = (ans, k, fallback) => (ans && typeof ans[k] === 'number' ? ans[k] : fallback);
  const ownT = (sc, ans) => own(ans, 't', sc.t);
  const ownDrop = (sc, ans) => own(ans, 'drop', dropAt(ownT(sc, ans)));

  // ---------- Steps ----------
  // Each step: k, sym, unit, skill, ask, formula, hints, target, own (follow-through), calc (needs Desmos), needs, mistake, right.
  const readStep = at => ({
    k: `read${at}`, sym: 'drop', unit: 'm', skill: 'measure', measure: at,
    ask: () => 'Read the ruler. How far has the ball dropped?',
    formula: () => '',
    hints: () => ['Follow the dashed line from the ball to the ruler.', 'Each small mark on the ruler is 5 m.'],
    target: () => DROPS[at - 1],
    mistake: v => {
      if (near(v, at, 0, 0.01)) return ['read_time', `${at} is the time. Read the distance from the ruler.`, true];
      return ['misread_ruler', 'Follow the dashed line to the ruler. Each small mark is 5 m. Look again.', true];
    },
    right: () => `drop = ${DROPS[at - 1]} m`
  });

  const countStep = {
    k: 't', sym: 't', unit: 's', skill: 'count',
    ask: () => "Count the marks on the stick up to the monkey's spot. The ball passes one mark each second. When does it get there?",
    formula: () => '',
    hints: () => ['Start at the launcher. Do not count the launcher as a mark.'],
    target: sc => sc.t,
    mistake: (v, sc) => (near(v, sc.t + 1, 0, 0.01) ? ['count_launcher', 'You counted the launcher too. The launcher is time 0.'] : ['miscount', 'Count one mark for each second, starting after the launcher.']),
    right: sc => `t = ${fmt(sc.t)} s`
  };

  const timeStep = (extra = []) => ({
    k: 't', sym: 't', unit: 's', skill: 'time', calc: true,
    ask: () => "When does the ball reach the monkey's spot?",
    formula: () => 't = ΔX ÷ v_ox',
    hints: (sc, ans) => ['The ball moves v_ox meters sideways every second. It has to go ΔX meters.', `In the calculator: ${fmt(sc.D)} ÷ ${fmt(own(ans, 'vox', sc.vox))}`],
    target: sc => sc.t,
    own: (sc, ans) => sc.D / own(ans, 'vox', sc.vox),
    needs: (sc, ans) => ({ routes: [[sc.D, own(ans, 'vox', sc.vox)], ...extra.map(f => f(sc))] }),
    mistake: (v, sc, ans) => {
      const vox = own(ans, 'vox', sc.vox);
      if (near(v, sc.D * vox, 0.01)) return ['time_times', 'You multiplied. Distance ÷ speed gives the time.'];
      if (near(v, vox / sc.D, 0.01)) return ['time_flipped', 'You divided the wrong way. Use ΔX ÷ v_ox.'];
      if (sc.voy && near(v, sc.D / sc.voy, 0.01)) return ['time_voy', 'You used v_oy with ΔX. Sideways distance goes with sideways speed.'];
      return null;
    },
    right: (sc, ans) => `t = ${fmt(sc.D)} m ÷ ${fmt(own(ans, 'vox', sc.vox))} m/s = ${fmt(sc.D / own(ans, 'vox', sc.vox))} s`
  });

  function dropMistake(v, t) {
    if (near(v, 5 * t, 0.01)) return ['drop_no_square', `That is 5 × t. Time counts twice: 5 × ${fmt(t)} × ${fmt(t)}.`];
    if (near(v, 10 * t * t, 0.01)) return ['drop_used_g', `You used 10. The ½ in ½ × g × t² makes it 5: 5 × ${fmt(t)} × ${fmt(t)}.`];
    if (near(v, 10 * t, 0.01)) return ['drop_speed', `${fmt(10 * t)} m/s is how fast it falls then, not how far. Use 5 × ${fmt(t)} × ${fmt(t)}.`];
    if (near(v, t * t, 0.01)) return ['drop_no_five', `You found t × t. Multiply by 5 as well.`];
    return null;
  }

  const dropStep = (formula) => ({
    k: 'drop', sym: 'drop', unit: 'm', skill: 'drop', calc: true,
    ask: () => 'How far has the ball dropped below the stick by then?',
    formula: () => formula,
    hints: (sc, ans) => ['This is the same distance as a dropped ball falls in that time. It is the length of the string.', `In the calculator: 5 × ${fmt(ownT(sc, ans))} × ${fmt(ownT(sc, ans))}`],
    target: sc => dropAt(sc.t),
    own: (sc, ans) => dropAt(ownT(sc, ans)),
    needs: (sc, ans) => ({ routes: [[5, ownT(sc, ans)], [10, ownT(sc, ans)]] }),
    mistake: (v, sc, ans) => dropMistake(v, ownT(sc, ans)),
    right: (sc, ans) => `drop = 5 × ${fmt(ownT(sc, ans))} × ${fmt(ownT(sc, ans))} = ${fmt(dropAt(ownT(sc, ans)))} m`
  });

  // Conceptual: the drop is a reading from the student's own table, so it stays typed
  const dropReadStep = {
    k: 'drop', sym: 'drop', unit: 'm', skill: 'table',
    ask: sc => 'Use your drop table under the picture. How long is the string at that time?',
    formula: (sc, ans) => `t = ${fmt(ownT(sc, ans))} s`,
    hints: (sc, ans) => [`Find ${fmt(ownT(sc, ans))} s in your drop table. The number beside it is the string length.`],
    target: sc => dropAt(sc.t),
    own: (sc, ans) => dropAt(ownT(sc, ans)),
    mistake: (v, sc, ans) => {
      const t = ownT(sc, ans);
      if (near(v, t, 0, 0.01)) return ['gave_time', `${fmt(t)} is the time. Find the number beside it in your drop table.`];
      return dropMistake(v, t) || ['misread_table', `Find ${fmt(t)} s in your drop table and read the number beside it.`];
    },
    right: (sc, ans) => `drop = ${fmt(dropAt(ownT(sc, ans)))} m`
  };

  // The drop at a time past the table, for practicing the pattern
  const dropNewStep = (formula) => Object.assign(dropStep(formula), {
    ask: () => 'The picture shows a new time. How far does a dropped ball fall in that time?',
    target: sc => dropAt(sc.at),
    own: null,
    needs: sc => ({ routes: [[5, sc.at], [10, sc.at]] }),
    hints: sc => ['Time counts twice.', `In the calculator: 5 × ${fmt(sc.at)} × ${fmt(sc.at)}`],
    mistake: (v, sc) => dropMistake(v, sc.at),
    right: sc => `drop = 5 × ${fmt(sc.at)} × ${fmt(sc.at)} = ${fmt(dropAt(sc.at))} m`
  });

  const lineStep = {
    k: 'line', sym: 'line height', unit: 'm', skill: 'line', calc: true,
    ask: () => 'With no gravity, how high would the ball be at the star?',
    formula: () => 'line height = v_oy × t',
    hints: (sc, ans) => ['With no gravity, v_oy never changes. The ball rises v_oy meters every second.', `In the calculator: ${fmt(own(ans, 'voy', sc.voy))} × ${fmt(sc.t)}`],
    target: sc => sc.voy * sc.t,
    own: (sc, ans) => own(ans, 'voy', sc.voy) * sc.t,
    needs: (sc, ans) => ({ routes: [[own(ans, 'voy', sc.voy), sc.t]] }),
    mistake: (v, sc, ans) => {
      const voy = own(ans, 'voy', sc.voy);
      if (near(v, sc.vox * sc.t, 0.01)) return ['line_vox', 'You used v_ox. That is how far sideways. Height comes from v_oy.'];
      if (near(v, voy + sc.t, 0.01)) return ['line_added', 'You added. The ball rises v_oy meters each second, so multiply.'];
      if (near(v, voy, 0.01)) return ['line_one_second', 'That is one second of rising. Multiply by the time.'];
      return null;
    },
    right: (sc, ans) => `line height = ${fmt(own(ans, 'voy', sc.voy))} m/s × ${fmt(sc.t)} s = ${fmt(own(ans, 'voy', sc.voy) * sc.t)} m`
  };

  const ballHeightStep = {
    k: 'ballH', sym: 'ball height', unit: 'm', skill: 'meet', calc: true,
    ask: () => 'Now gravity is on. How high is the ball really at that time?',
    formula: () => 'ball height = line height − drop',
    hints: (sc, ans) => ['The ball hangs below the stick by the length of the string.', `In the calculator: ${fmt(own(ans, 'line', sc.H))} − ${fmt(ownDrop(sc, ans))}`],
    target: sc => sc.H - dropAt(sc.t),
    own: (sc, ans) => own(ans, 'line', sc.H) - ownDrop(sc, ans),
    needs: (sc, ans) => ({ routes: [[own(ans, 'line', sc.H), ownDrop(sc, ans)]] }),
    mistake: (v, sc, ans) => {
      const line = own(ans, 'line', sc.H), d = ownDrop(sc, ans);
      if (near(v, d, 0.01)) return ['gave_drop', 'That is only the string. The ball is that far below the stick.'];
      if (near(v, line, 0.01)) return ['gave_line', 'That is the stick, where the ball would be with no gravity. Take away the string.'];
      if (near(v, line + d, 0.01)) return ['added_drop', 'Gravity pulls the ball down, so subtract the drop.'];
      return null;
    },
    right: (sc, ans) => `ball height = ${fmt(own(ans, 'line', sc.H))} m − ${fmt(ownDrop(sc, ans))} m = ${fmt(own(ans, 'line', sc.H) - ownDrop(sc, ans))} m`
  };

  const meetStep = (extra = []) => ({
    k: 'meet', sym: 'meet height', unit: 'm', skill: 'meet', calc: true,
    ask: () => 'How high above the ground do they meet?',
    formula: () => 'meet height = H − drop',
    hints: (sc, ans) => ['H is how high the monkey started. It has fallen by the drop.', `In the calculator: ${fmt(sc.H)} − ${fmt(ownDrop(sc, ans))}`],
    target: sc => sc.H - dropAt(sc.t),
    own: (sc, ans) => sc.H - ownDrop(sc, ans),
    needs: (sc, ans) => ({ routes: [[sc.H, ownDrop(sc, ans)], ...extra.map(f => f(sc))] }),
    mistake: (v, sc, ans) => {
      const d = ownDrop(sc, ans);
      if (near(v, d, 0.01)) return ['gave_drop', 'That is how far they fell. Take it away from H.'];
      if (near(v, sc.H, 0.01)) return ['gave_branch', 'That is where the monkey started. It has fallen since then.'];
      if (near(v, sc.H + d, 0.01)) return ['added_drop', 'They fall down, so subtract the drop.'];
      return null;
    },
    right: (sc, ans) => `meet height = ${fmt(sc.H)} m − ${fmt(ownDrop(sc, ans))} m = ${fmt(sc.H - ownDrop(sc, ans))} m`
  });

  const aimStep = {
    k: 'aimH', sym: 'aim height', unit: 'm', skill: 'aim', calc: true,
    ask: () => 'This monkey holds on. Keep the same v_ox. How high must the stick point?',
    formula: () => 'aim height = H + drop',
    hints: (sc, ans) => ['The ball will fall below the stick by the drop. Point that much above the monkey.', `In the calculator: ${fmt(sc.H)} + ${fmt(ownDrop(sc, ans))}`],
    target: sc => sc.H + dropAt(sc.t),
    own: (sc, ans) => sc.H + ownDrop(sc, ans),
    needs: (sc, ans) => ({ routes: [[sc.H, ownDrop(sc, ans)]] }),
    mistake: (v, sc, ans) => {
      const d = ownDrop(sc, ans);
      if (near(v, sc.H, 0.01)) return ['aim_at_monkey', 'That aims right at the monkey. It is not letting go, so the ball would fall below it.'];
      if (near(v, d, 0.01)) return ['gave_drop', 'That is only the drop. Measure from the ground: add the height of the monkey.'];
      if (near(v, sc.H - d, 0.01)) return ['aim_low', 'That aims below the monkey, and the ball falls lower still. Aim above it.'];
      return null;
    },
    right: (sc, ans) => `aim height = ${fmt(sc.H)} m + ${fmt(ownDrop(sc, ans))} m = ${fmt(sc.H + ownDrop(sc, ans))} m`
  };

  // ---------- Honors ----------
  const thetaStep = {
    k: 'th', sym: 'θ', unit: '°', skill: 'trig', calc: true,
    ask: () => 'Aim the stick straight at the monkey. What angle is that?',
    formula: () => 'θ = tan⁻¹(H ÷ ΔX)',
    hints: sc => ['H is across from θ and ΔX touches θ, so this is tan.', 'The tan⁻¹ button is on the func tab of the calculator.', `In the calculator: tan⁻¹(${fmt(sc.H)} ÷ ${fmt(sc.D)})`],
    target: sc => sc.th,
    needs: sc => ({ fn: 'atan', label: 'tan⁻¹', routes: [[sc.H, sc.D]] }),
    mistake: (v, sc) => {
      if (near(v, Math.atan(sc.H / sc.D), 0.01)) return ['radians', 'Your calculator is in radian mode. Switch it to degrees (DEG) and calculate again.', true];
      if (near(v, sc.H / sc.D, 0.01)) return ['no_arctan', 'That is H ÷ ΔX, which is only tan(θ). Use the tan⁻¹ button to get the angle.'];
      if (near(v, 90 - sc.th, 0.01)) return ['flip_tan', 'You flipped the sides. H is across from θ, so it goes on top.'];
      return null;
    },
    right: sc => `θ = tan⁻¹(${fmt(sc.H)} ÷ ${fmt(sc.D)}) = ${fmt(sc.th)}°`
  };

  const splitStep = asked => {
    const fn = asked === 'x' ? 'cos' : 'sin', sym = asked === 'x' ? 'v_ox' : 'v_oy';
    const value = sc => (asked === 'x' ? sc.vox : sc.voy);
    const ownTh = (sc, ans) => own(ans, 'th', sc.th);
    const calcd = (sc, ans) => sc.v0 * Math[fn](rad(ownTh(sc, ans)));
    return {
      k: asked === 'x' ? 'vox' : 'voy', sym, unit: 'm/s', skill: 'trig', calc: true,
      ask: () => `Split the launch. Find the ${asked === 'x' ? 'sideways' : 'upward'} part.`,
      formula: () => `${sym} = v_o × ${fn}(θ)`,
      hints: (sc, ans) => [`The ${asked === 'x' ? 'sideways side touches θ' : 'upward side is across from θ'}, so use ${fn}.`, `In the calculator: ${fmt(sc.v0)} × ${fn}(${fmt(ownTh(sc, ans))})`],
      target: value,
      own: calcd,
      needs: (sc, ans) => ({ fn, routes: [[sc.v0, ownTh(sc, ans)]] }),
      mistake: (v, sc, ans) => {
        const th = ownTh(sc, ans), other = asked === 'x' ? sc.voy : sc.vox;
        if (near(v, sc.v0 * Math[fn](th), 0.01)) return ['radians', 'Your calculator is in radian mode. Switch it to degrees (DEG) and calculate again.', true];
        if (near(v, other, 0.01)) return ['swap', `You found the other part. ${asked === 'x' ? 'The sideways side touches θ, so it uses cos.' : 'The upward side is across from θ, so it uses sin.'}`];
        if (near(v, sc.v0, 0.01)) return ['whole_speed', `That is the whole launch speed v_o. Only part of it goes ${asked === 'x' ? 'sideways' : 'up'}.`];
        return null;
      },
      right: (sc, ans) => `${sym} = ${fmt(sc.v0)} m/s × ${fn}(${fmt(ownTh(sc, ans))}°) = ${fmt(calcd(sc, ans))} m/s`
    };
  };

  const earlyStep = {
    k: 'early', sym: 'monkey drop', unit: 'm', skill: 'drop', calc: true,
    ask: () => 'The monkey let go 1 s before the launch. How far has it fallen when the ball arrives?',
    formula: () => 'monkey drop = 5 × (t + 1)²',
    hints: (sc, ans) => ['The monkey has been falling 1 s longer than the ball.', `In the calculator: 5 × ${fmt(ownT(sc, ans) + 1)} × ${fmt(ownT(sc, ans) + 1)}`],
    target: sc => dropAt(sc.t + 1),
    own: (sc, ans) => dropAt(ownT(sc, ans) + 1),
    needs: (sc, ans) => ({ routes: [[5, ownT(sc, ans) + 1], [10, ownT(sc, ans) + 1]] }),
    mistake: (v, sc, ans) => {
      const t = ownT(sc, ans);
      if (near(v, dropAt(t), 0.01)) return ['early_same', 'That is the ball\'s drop. The monkey has been falling 1 s longer.'];
      if (near(v, dropAt(t) + 5, 0.01)) return ['early_add_five', 'The extra second matters more than 5 m. Square (t + 1), not t.'];
      return dropMistake(v, t + 1);
    },
    right: (sc, ans) => `monkey drop = 5 × ${fmt(ownT(sc, ans) + 1)} × ${fmt(ownT(sc, ans) + 1)} = ${fmt(dropAt(ownT(sc, ans) + 1))} m`
  };

  const gapStep = {
    k: 'gap', sym: 'gap', unit: 'm', skill: 'meet', calc: true,
    ask: () => 'How far above the monkey does the ball pass?',
    formula: () => 'gap = monkey drop − ball drop',
    hints: (sc, ans) => [`In the calculator: ${fmt(own(ans, 'early', dropAt(sc.t + 1)))} − ${fmt(ownDrop(sc, ans))}`],
    target: sc => dropAt(sc.t + 1) - dropAt(sc.t),
    own: (sc, ans) => own(ans, 'early', dropAt(sc.t + 1)) - ownDrop(sc, ans),
    needs: (sc, ans) => ({ routes: [[own(ans, 'early', dropAt(sc.t + 1)), ownDrop(sc, ans)]] }),
    mistake: (v, sc, ans) => {
      if (near(v, own(ans, 'early', dropAt(sc.t + 1)), 0.01)) return ['gave_drop', 'That is how far the monkey fell. The ball fell too, so subtract its drop.'];
      return null;
    },
    right: (sc, ans) => {
      const a = own(ans, 'early', dropAt(sc.t + 1)), b = ownDrop(sc, ans);
      return `gap = ${fmt(a)} m − ${fmt(b)} m = ${fmt(a - b)} m`;
    }
  };

  const fallTimeStep = {
    k: 'fall', sym: 't', unit: 's', skill: 'speed', calc: true,
    ask: () => 'How long until the monkey reaches the ground?',
    formula: () => 't = √(H ÷ 5)',
    hints: sc => ['The monkey lands when its drop equals H: 5 × t² = H.', `In the calculator: √(${fmt(sc.H)} ÷ 5)`],
    target: sc => Math.sqrt(sc.H / 5),
    needs: sc => ({ fn: 'sqrt', label: 'square root', routes: [[sc.H, 5], [sc.H, 10]] }),
    mistake: (v, sc) => {
      if (near(v, sc.H / 5, 0.01)) return ['no_root', 'That is t². Take the square root to get t.'];
      if (near(v, Math.sqrt(sc.H / 10), 0.01)) return ['fall_used_g', 'You divided by 10. 5 × t² = H, so divide by 5.'];
      return null;
    },
    right: sc => `t = √(${fmt(sc.H)} ÷ 5) = ${fmt(Math.sqrt(sc.H / 5))} s`
  };

  const minSpeedStep = {
    k: 'vmin', sym: 'smallest v_ox', unit: 'm/s', skill: 'speed', calc: true,
    ask: () => 'The ball must reach the tree before the monkey lands. What is the smallest v_ox that works?',
    formula: () => 'smallest v_ox = ΔX ÷ t',
    hints: (sc, ans) => [`In the calculator: ${fmt(sc.D)} ÷ ${fmt(own(ans, 'fall', Math.sqrt(sc.H / 5)))}`],
    target: sc => sc.D / Math.sqrt(sc.H / 5),
    own: (sc, ans) => sc.D / own(ans, 'fall', Math.sqrt(sc.H / 5)),
    needs: (sc, ans) => ({ routes: [[sc.D, own(ans, 'fall', Math.sqrt(sc.H / 5))]] }),
    mistake: (v, sc, ans) => {
      const t = own(ans, 'fall', Math.sqrt(sc.H / 5));
      if (near(v, sc.D * t, 0.01)) return ['time_times', 'You multiplied. Distance ÷ time gives the speed.'];
      if (near(v, sc.H / t, 0.01)) return ['min_used_h', 'You used H. The sideways speed has to cover ΔX.'];
      return null;
    },
    right: (sc, ans) => {
      const t = own(ans, 'fall', Math.sqrt(sc.H / 5));
      return `smallest v_ox = ${fmt(sc.D)} m ÷ ${fmt(t)} s = ${fmt(sc.D / t)} m/s`;
    }
  };

  const reads = { read1: readStep(1), read2: readStep(2), read3: readStep(3), read4: readStep(4) };
  const STEP = {
    conceptual: Object.assign({ t: countStep, drop: dropReadStep, dropNew: dropNewStep('drop = 5 × t × t'), line: lineStep, ballH: ballHeightStep, meet: meetStep(), aim: aimStep }, reads),
    cp: Object.assign({ t: timeStep(), drop: dropStep('drop = 5 × t²'), dropNew: dropNewStep('drop = 5 × t²'), line: lineStep, ballH: ballHeightStep, meet: meetStep(), aim: aimStep }, reads),
    honors: Object.assign({
      th: thetaStep, vox: splitStep('x'), voy: splitStep('y'), t: timeStep(), drop: dropStep('drop = 5 × t²'), dropNew: dropNewStep('drop = 5 × t²'),
      line: lineStep, ballH: ballHeightStep, meet: meetStep(), aim: aimStep, early: earlyStep, gap: gapStep, fall: fallTimeStep, vmin: minSpeedStep
    }, reads)
  };

  // A whole hunt, in order, for each class. The Mastery Check uses one of each kind.
  const HUNT = {
    conceptual: { meet: ['t', 'drop', 'meet'], hold: ['t', 'drop', 'aim'] },
    cp: { meet: ['t', 'drop', 'meet'], hold: ['t', 'drop', 'aim'] },
    honors: { meet: ['th', 'vox', 't', 'drop', 'meet'], hold: ['vox', 't', 'drop', 'aim'] }
  };

  // A calculation reads one step per line with the equals signs lined up, never as one long chain.
  function stack(calc) {
    const [sym, ...steps] = calc.split(' = ');
    if (!steps.length) return `<span class="formula">${calc}</span>`;
    return `<span class="calc-stack">${steps.map(s => `<span class="calc-sym">${sym}</span><span>=</span><span>${s}</span>`).join('')}</span>`;
  }

  // Returns { ok, retry, mistake, msg }. retry = no new numbers (calculator mode, or re-reading the ruler).
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
  const shuffled = n => {
    const a = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const huntOpts = (sc, extra) => Object.assign({ mode: 'hunt', sc }, extra);

  const CONCEPT = {
    no_gravity: {
      make: () => ({ sc: hunt(pick([15, 20, 25]), pick([20, 30]), 3) }),
      text: () => 'Pretend gravity is turned off. What path does the ball follow after it leaves the launcher?',
      scene: q => huntOpts(q.sc, { gravity: false, noMonkey: true, stickT: q.sc.t, t: 0 }),
      options: () => [
        { id: 'r', t: 'A straight line along the stick, at a steady speed.' },
        { id: 'curve', t: 'It curves down toward the ground.' },
        { id: 'slow', t: 'A straight line, but it slows down and stops.' }
      ],
      right: () => 'r',
      mistake: () => 'needs_force',
      why: () => 'With no force on it, inertia keeps the ball going in a straight line at a steady speed. That straight line is its inertial path.'
    },
    same_fall: {
      make: () => ({}),
      text: () => 'Ball A is dropped. Ball B is launched sideways at the same moment, from the same height. Which reaches the ground first?',
      scene: () => ({ mode: 'pair', t: 0 }),
      options: () => [{ id: 'r', t: 'They land at the same time.' }, { id: 'a', t: 'Ball A, the dropped ball.' }, { id: 'b', t: 'Ball B, the sideways ball.' }],
      right: () => 'r',
      mistake: () => 'sideways_changes_fall',
      why: () => 'Moving sideways does not change how fast a ball falls. Both drop the same distance every second.'
    },
    tilted_string: {
      make: () => ({ sc: hunt(20, 30, 4) }),
      text: () => 'The stick is tilted up. Which way do the strings hang?',
      scene: q => huntOpts(q.sc, { noMonkey: true, stickT: 4, t: 0, gravity: false, markLabels: true }),
      options: () => [
        { id: 'r', t: 'Straight down toward the ground, the same length as before.' },
        { id: 'square', t: 'Straight out from the stick, at a right angle to it.' },
        { id: 'short', t: 'Straight down, but shorter because the stick is tilted.' }
      ],
      right: () => 'r',
      mistake: () => 'tilted_string',
      why: () => 'Gravity always pulls straight down. It does not care which way the stick points, so the strings do not change.'
    },
    same_drop: {
      make: () => { const t = pick([1, 2, 3]); return { t, sc: teachHunt() }; },
      text: q => `The picture shows the ball after ${q.t} s. It is ${dropAt(q.t || 1)} m below the stick. How far has the monkey fallen?`,
      scene: q => huntOpts(q.sc, { t: q.t, stringLabelBallOnly: true }),
      options: q => [
        { id: 'r', t: q.t ? `${dropAt(q.t)} m, the same as the ball.` : 'The same as the ball.' },
        { id: 'half', t: q.t ? `${dropAt(q.t) / 2} m, half as far.` : 'Half as far.' },
        { id: 'more', t: q.t ? `${dropAt(q.t) * 2} m, twice as far.` : 'Twice as far.' }
      ],
      right: () => 'r',
      mistake: () => 'different_drops',
      why: () => 'Gravity gives everything the same drop in the same time. The ball and the monkey started falling at the same moment.'
    },
    holds_on: {
      make: () => ({ sc: hunt(20, 30, 3) }),
      text: () => 'You aim right at the monkey, but this monkey holds on to the branch. What does the ball do?',
      scene: q => huntOpts(q.sc, { t: 0, hold: true, noStrings: true }),
      options: () => [
        { id: 'r', t: 'It passes below the monkey by the length of the string.' },
        { id: 'hit', t: 'It hits the monkey.' },
        { id: 'above', t: 'It passes above the monkey.' }
      ],
      right: () => 'r',
      mistake: () => 'holds_on',
      why: () => 'The ball still falls below the stick. The monkey did not fall, so the ball goes under it by the length of the string.'
    },
    faster: {
      make: () => ({ sc: hunt(20, 30, 4) }),
      text: () => 'Same aim, but the launch is twice as fast. Where do the ball and the monkey meet?',
      scene: q => huntOpts(q.sc, { t: 0, noStrings: true }),
      options: () => [
        { id: 'r', t: 'Higher up, because they fall for less time.' },
        { id: 'same', t: 'At the same height as before.' },
        { id: 'miss', t: 'They miss. The ball goes over the monkey.' }
      ],
      right: () => 'r',
      mistake: () => 'faster_misses',
      why: () => 'A faster ball reaches the tree sooner. Less time means a shorter drop for both, so they meet higher up. It is still a hit.'
    },
    moon: {
      make: () => ({ sc: hunt(20, 30, 4) }),
      text: () => 'Same aim, on the Moon, where g = 1.6 m/s². What happens?',
      scene: q => huntOpts(q.sc, { t: 0, noStrings: true, note: 'On the Moon: g = 1.6 m/s²' }),
      options: () => [
        { id: 'r', t: 'It still hits. Both fall less, by the same amount.' },
        { id: 'over', t: 'It misses. The ball goes over the monkey.' },
        { id: 'under', t: 'It misses. The ball goes under the monkey.' }
      ],
      right: () => 'r',
      mistake: () => 'moon_misses',
      why: () => 'Gravity is weaker, so every string is shorter. But the ball and the monkey still share the same string length, so they still meet.'
    },
    slow_call: {
      make: () => newSlowCall(),
      text: () => "Aimed right at the monkey. Count the marks, then find that time in your drop table. Compare the drop with H. What happens?",
      scene: q => huntOpts(q.sc || teachHunt(), { t: 0, noStrings: true, labels: { H: true } }),
      options: () => [
        { id: 'hit', t: 'The ball hits the monkey above the ground.' },
        { id: 'ground', t: 'Both reach the ground first. There is no hit in the air.' }
      ],
      right: q => (q.slow ? 'ground' : 'hit'),
      mistake: q => (q.slow ? 'slow_still_hits' : 'fast_call_wrong'),
      why: q => (q.slow
        ? `The drop is ${dropAt(q.sc.t)} m, but the monkey is only ${q.sc.H} m high. They would have to meet below the ground, so the ball is too slow.`
        : `The drop is ${dropAt(q.sc.t)} m and the monkey is ${q.sc.H} m high. The drop is smaller, so they meet ${q.sc.H - dropAt(q.sc.t)} m above the ground.`)
    },
    head_start: {
      make: () => ({ sc: hunt(20, 30, 3) }),
      text: () => 'You aim right at the monkey, but it lets go 1 s before you launch. What does the ball do?',
      scene: q => huntOpts(q.sc, { t: 0, early: 1, noStrings: true, note: 'Monkey lets go 1 s early' }),
      options: () => [
        { id: 'r', t: 'It passes above the monkey.' },
        { id: 'below', t: 'It passes below the monkey.' },
        { id: 'hit', t: 'It still hits the monkey.' }
      ],
      right: () => 'r',
      mistake: () => 'head_start',
      why: () => 'The monkey falls for 1 s longer, so its drop is bigger than the ball\'s. The ball goes over it.'
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

  // ---------- Mastery Check: same blueprint every retake, new numbers. 2 hunts + 2 concept questions. ----------
  function buildQuiz(tier) {
    const a = newHunt(tier, 2), b = newHunt(tier, 2, a);
    const hunts = [a, b], kinds = ['meet', 'hold'];
    const qs = [];
    hunts.forEach((sc, f) => HUNT[tier][kinds[f]].forEach(k => qs.push({ kind: 'step', k, f, skill: STEP[tier][k].skill })));
    const first = pick(['same_drop', 'holds_on', 'tilted_string']);
    const second = tier === 'honors' ? pick(['head_start', 'slow_call']) : pick(['faster', 'moon', 'slow_call']);
    qs.push(makeConcept(first), makeConcept(second));
    return { tier, hunts, kinds, qs, answers: qs.map(() => null), work: qs.map(() => null), i: 0 };
  }

  // Follow-through: a later step is graded against the student's own earlier answers, so one slip costs one point.
  function gradeQuiz(quiz) {
    const chains = quiz.hunts.map(() => ({}));
    const results = quiz.qs.map((q, i) => {
      const raw = quiz.answers[i];
      if (q.kind === 'mc') return Object.assign({ skill: q.skill }, gradeConcept(q, raw));
      const step = STEP[quiz.tier][q.k];
      const r = gradeStep(step, raw === null || raw === undefined ? '' : raw, quiz.hunts[q.f], chains[q.f]);
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
    G, DROPS, STEP, HUNT, CONCEPT,
    dropAt, teachHunt, hunt, fmt, near, parseNum, pick, rad, own,
    newHunt, newSlowCall, newMinSpeed, workProblem, stack, gradeStep, makeConcept, conceptOptions, gradeConcept, buildQuiz, gradeQuiz
  };
})();

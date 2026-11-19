// Work & Simple Machines Practice — physics, GUESS setup scenarios, scaffolded problem generators,
// Desmos work verification, mistake diagnostics, and Mastery Check builder.
// g = 10 m/s² everywhere. Every generated scenario is plain JSON so reload/Firestore resume keeps the exact numbers.

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

  function fmt(v) {
    const s = Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : Math.abs(v) < 10 ? String(round(v, 2)) : String(round(v, 1));
    return s.replace(/^-/, '−');
  }
  const near = (v, target, rel = 0.02, abs = 0.05) => Math.abs(v - target) <= Math.max(Math.abs(target) * rel, abs);
  function parseNum(raw) {
    const v = parseFloat(String(raw).replace(',', '.').replace(/[−–]/g, '-').replace(/[^0-9.\-eE]/g, ''));
    return isFinite(v) ? v : null;
  }

  const G = 10; // m/s², on Earth, in this class

  // A calculator line has to be real work: more than one number, and uses this problem's numbers.
  function workProblem(work, needs = {}) {
    if (!work.fns.length && work.nums.length <= 1 && !/\\pi/.test(work.latex || '')) {
      return 'Type the whole calculation into the calculator, not just the answer.';
    }
    if (needs.fn && !work.fns.includes(needs.fn)) {
      return `Your calculation needs to use the ${needs.label || needs.fn} button.`;
    }
    const has = n => work.nums.some(w => Math.abs(w - Math.abs(n)) <= Math.max(Math.abs(n) * 0.015, 0.0051));
    const routes = needs.routes || [];
    if (routes.length && !routes.some(r => r.every(has))) {
      return `Your calculation needs to use ${needs.from || 'the numbers from this problem'}. Look for ${routes[0].map(n => fmt(Math.abs(n))).join(' and ')}.`;
    }
    return null;
  }

  // Stacked vertical equation steps, one line per step with equals signs lined up.
  function stack(calc) {
    const [sym, ...steps] = calc.split(' = ');
    if (!steps.length) return `<span class="formula">${calc}</span>`;
    return `<span class="calc-stack">${steps.map(s => `<span class="calc-sym">${sym}</span><span>=</span><span>${s}</span>`).join('')}</span>`;
  }

  function grade(q, raw) {
    const v = parseNum(raw);
    const worked = q.right ? `<br><span class="worked">The right way: ${stack(q.right)}</span>` : '';
    if (v === null) {
      return { ok: false, retry: true, mistake: 'blank', msg: q.calc ? 'Use the calculator, then press "Use calculator answer".' : 'Type your answer in the box.' };
    }
    if (near(v, q.target, q.rel === undefined ? 0.02 : q.rel, q.abs === undefined ? 0.05 : q.abs)) {
      return { ok: true, msg: q.right ? stack(q.right) : '' };
    }
    const hit = q.mistake ? q.mistake(v) : null;
    if (hit && hit[2]) return { ok: false, retry: true, mistake: hit[0], msg: hit[1] };
    return { ok: false, mistake: hit ? hit[0] : 'other', msg: (hit ? hit[1] : 'Not quite.') + worked };
  }

  // ---------- Part 1: GUESS Setup Scenarios (zero arithmetic, interactive G / U / E matching) ----------
  const SETUP_GEN = {
    setup_w() {
      const F = pick([150, 200, 250, 300]), d = pick([3, 4, 5, 6]);
      return { kind: 'setup_w', sceneKind: 'pulley_w', F, d, W: F * d, title: 'Mechanic lifting an engine with a pulley hoist' };
    },
    setup_f() {
      const F = pick([80, 100, 120, 150]), d = pick([4, 5, 6, 8]);
      return { kind: 'setup_f', sceneKind: 'pulley_f', F, d, W: F * d, title: 'Stagehand pulling rope to hoist a stage light' };
    },
    setup_d() {
      const F = pick([80, 100, 120, 150]), d = pick([4, 5, 6]);
      return { kind: 'setup_d', sceneKind: 'ramp_givenW_d', F, d, W: F * d, h: 1.5, title: 'Worker pushing a cart up a smooth loading ramp' };
    },
    setup_ma() {
      const ma = pick([3, 4, 5]), Fin = pick([60, 80, 90, 100]);
      return { kind: 'setup_ma', sceneKind: 'ma_find', Fout: ma * Fin, Fin, ma, title: 'Worker lifting a heavy crate with a block-and-tackle pulley' };
    }
  };

  function setupSpec(sc) {
    if (sc.kind === 'setup_w') {
      return {
        prompt: 'Sort the picture labels into <strong>Givens (G)</strong> and <strong>Unknown (U)</strong>, then pick the matching <strong>Equation (E)</strong>.',
        symbols: ['F = pull force (N)', 'd = rope distance (m)', 'W = work done (J)'],
        teach: 'Work measures force applied over a distance. Cover <strong>W</strong> in the triangle: <strong>F</strong> and <strong>d</strong> sit side by side, so you multiply.',
        triangle: { kind: 'work', cover: 'W' },
        guHints: [
          'Numbers you can read right off the picture belong in Givens (G).',
          'Look for the ? badge (W = ? J) — put that one in Unknown (U).'
        ],
        eqHints: [
          `We are solving for W. Cover W in the triangle — F (${fmt(sc.F)} N) and d (${fmt(sc.d)} m) are next to each other on the bottom.`,
          'Side-by-side in the triangle means multiply: W = F × d.'
        ],
        chips: [
          { id: 'F', text: `F = ${fmt(sc.F)} N`, cls: 'wk-F-text' },
          { id: 'd', text: `d = ${fmt(sc.d)} m`, cls: 'wk-d-text' },
          { id: 'W', text: 'W = ? J', cls: 'wk-W-text' }
        ],
        givens: ['F', 'd'],
        unknown: 'W',
        eqChoices: ['W = F × d', 'F = W ÷ d', 'd = W ÷ F'],
        rightEq: 'W = F × d',
        explainWrongEq: eq => (eq.startsWith('F =')
          ? `That solves for force F, but Unknown (U) has W = ? J. With F = ${fmt(sc.F)} N and d = ${fmt(sc.d)} m, multiply to find W = F × d.`
          : `That solves for distance d, but Unknown (U) has W = ? J. Cover W in the triangle to get W = F × d.`),
        worked: `W = F × d = ${fmt(sc.F)} N × ${fmt(sc.d)} m = ${fmt(sc.W)} J`
      };
    }
    if (sc.kind === 'setup_f') {
      return {
        prompt: 'Sort the picture labels into <strong>Givens (G)</strong> and <strong>Unknown (U)</strong>, then pick the matching <strong>Equation (E)</strong>.',
        symbols: ['W = work done (J)', 'd = rope distance (m)', 'F = pull force (N)'],
        teach: 'You already know the work <strong>W</strong> and rope distance <strong>d</strong>. Cover <strong>F</strong> in the triangle: <strong>W</strong> sits over <strong>d</strong>, so you divide.',
        triangle: { kind: 'work', cover: 'F' },
        guHints: [
          'The Work Meter gives W and the tape line gives d — both are Givens (G).',
          'F = ? N is missing, so F goes in Unknown (U).'
        ],
        eqHints: [
          `Cover F in the triangle: W (${fmt(sc.W)} J) is on top and d (${fmt(sc.d)} m) is on bottom.`,
          'Top ÷ bottom gives F = W ÷ d.'
        ],
        chips: [
          { id: 'W', text: `W = ${fmt(sc.W)} J`, cls: 'wk-W-text' },
          { id: 'd', text: `d = ${fmt(sc.d)} m`, cls: 'wk-d-text' },
          { id: 'F', text: 'F = ? N', cls: 'wk-F-text' }
        ],
        givens: ['W', 'd'],
        unknown: 'F',
        eqChoices: ['F = W ÷ d', 'W = F × d', 'F = d ÷ W'],
        rightEq: 'F = W ÷ d',
        explainWrongEq: eq => (eq === 'W = F × d'
          ? `We already know W = ${fmt(sc.W)} J! Unknown (U) is F = ? N, so cover F in the triangle: F = W ÷ d.`
          : `That flips the fraction upside down (${fmt(sc.d)} ÷ ${fmt(sc.W)} gives a tiny decimal!). Keep W on top: F = W ÷ d.`),
        worked: `F = W ÷ d = ${fmt(sc.W)} J ÷ ${fmt(sc.d)} m = ${fmt(sc.F)} N`
      };
    }
    if (sc.kind === 'setup_d') {
      return {
        prompt: 'The work needed to lift the cart is already shown on the dock. Sort <strong>Givens (G)</strong> and <strong>Unknown (U)</strong>, then pick the <strong>Equation (E)</strong>.',
        symbols: ['W = work needed (J)', 'F = push force (N)', 'd = ramp length (m)'],
        teach: 'A smooth ramp uses the same lifting work <strong>W</strong> shown on the dock. Cover <strong>d</strong> in the triangle: <strong>W</strong> sits over <strong>F</strong>, so you divide.',
        triangle: { kind: 'work', cover: 'd' },
        guHints: [
          'Work Needed (W) and push force (F) both have numbers — put them in Givens (G).',
          'Ramp length d = ? m is Unknown (U).'
        ],
        eqHints: [
          `Cover d in the triangle: W (${fmt(sc.W)} J) is on top and F (${fmt(sc.F)} N) is on bottom.`,
          'Top ÷ bottom gives d = W ÷ F.'
        ],
        chips: [
          { id: 'W', text: `W = ${fmt(sc.W)} J`, cls: 'wk-W-text' },
          { id: 'F', text: `F = ${fmt(sc.F)} N`, cls: 'wk-F-text' },
          { id: 'd', text: 'd = ? m', cls: 'wk-d-text' }
        ],
        givens: ['W', 'F'],
        unknown: 'd',
        eqChoices: ['d = W ÷ F', 'd = W × F', 'd = F ÷ W'],
        rightEq: 'd = W ÷ F',
        explainWrongEq: eq => (eq === 'd = W × F'
          ? `Multiplying ${fmt(sc.W)} J × ${fmt(sc.F)} N would make a ramp ${fmt(sc.W * sc.F)} m long! Divide work by force instead: d = W ÷ F.`
          : `Putting F on top gives ${fmt(sc.F)} ÷ ${fmt(sc.W)}, a tiny fraction of a meter. Keep W on top: d = W ÷ F.`),
        worked: `d = W ÷ F = ${fmt(sc.W)} J ÷ ${fmt(sc.F)} N = ${fmt(sc.d)} m`
      };
    }
    return {
      prompt: 'Sort the pulley forces into <strong>Givens (G)</strong> and <strong>Unknown (U)</strong>, then pick the <strong>Mechanical Advantage Equation (E)</strong>.',
      symbols: ['F_out = crate weight lifted (N)', 'F_in = your pull force (N)', 'MA = how many times easier'],
      teach: 'Remember Step 1: lifting a <strong>300 N</strong> crate with a <strong>100 N</strong> pull was <strong>3× easier</strong> (300 ÷ 100 = 3), so <strong>MA = 3</strong>. A helpful machine always has <strong>MA &gt; 1</strong>.',
      triangle: { kind: 'ma', cover: 'MA' },
      guHints: [
        'Both forces (F_out on the crate and F_in on the pull rope) have numbers — put them in Givens (G).',
        'MA = ? has the question mark, so put MA in Unknown (U).'
      ],
      eqHints: [
        `Test with this crate's numbers (${fmt(sc.Fout)} N weight, ${fmt(sc.Fin)} N pull): which formula gives a number bigger than 1?`,
        'Cover MA in the triangle: F_out is on top and F_in is on bottom, so MA = F_out ÷ F_in.'
      ],
      chips: [
        { id: 'Fout', text: `F_out = ${fmt(sc.Fout)} N`, cls: 'wk-F-text' },
        { id: 'Fin', text: `F_in = ${fmt(sc.Fin)} N`, cls: 'wk-F-text' },
        { id: 'MA', text: 'MA = ?', cls: 'wk-MA-text' }
      ],
      givens: ['Fout', 'Fin'],
      unknown: 'MA',
      eqChoices: ['MA = F_out ÷ F_in', 'MA = F_out × F_in', 'MA = F_in ÷ F_out'],
      rightEq: 'MA = F_out ÷ F_in',
      explainWrongEq: eq => (eq === 'MA = F_out × F_in'
        ? `Multiplying gives ${fmt(sc.Fout)} × ${fmt(sc.Fin)} = ${fmt(sc.Fout * sc.Fin)} — way too big! MA asks how many TIMES bigger the crate weight (${fmt(sc.Fout)} N) is than your pull (${fmt(sc.Fin)} N), so divide: MA = F_out ÷ F_in.`
        : `Dividing ${fmt(sc.Fin)} ÷ ${fmt(sc.Fout)} gives ${round(sc.Fin / sc.Fout, 2)} (less than 1). A helpful pulley always has MA > 1, so put the heavier crate weight F_out on top: MA = F_out ÷ F_in.`),
      worked: `MA = F_out ÷ F_in = ${fmt(sc.Fout)} N ÷ ${fmt(sc.Fin)} N = ${fmt(sc.ma)}`
    };
  }

  // ---------- Parts 2–4: Scaffolded Word Problem Generators ----------
  const GEN = {
    // Part 2: Pulley Work
    pulley_w() {
      const F = pick([150, 200, 250, 300, 350]), d = pick([3, 4, 5, 6]);
      return { kind: 'pulley_w', F, d, W: F * d };
    },
    pulley_f() {
      const F = pick([80, 90, 120, 140, 160]), d = pick([4, 5, 6, 8]);
      return { kind: 'pulley_f', F, d, W: F * d };
    },
    pulley_d() {
      const F = pick([120, 150, 180, 200]), d = pick([5, 6, 8, 10]);
      return { kind: 'pulley_d', F, d, W: F * d };
    },
    pulley_2step() {
      const F = pick([160, 200, 240, 300]), d = pick([3, 4, 5]), d2 = d * 2;
      return { kind: 'pulley_2step', F, d, d2, W: F * d, F2: F / 2 };
    },
    pulley_lift_h() {
      const m = pick([30, 40, 50, 60]), h = pick([2, 3, 4]), d = h * pick([2, 3]);
      const W = m * G * h;
      return { kind: 'pulley_lift_h', m, h, d, W, F: round(W / d, 2) };
    },

    // Part 3: Ramp Trade-Off (bridge W-given -> 2-box weight/mgh)
    ramp_givenW_f() {
      const F = pick([100, 120, 150, 200, 250]), d = pick([3, 4, 5, 6]);
      return { kind: 'ramp_givenW_f', F, d, W: F * d, h: 1.5 };
    },
    ramp_givenW_d() {
      const F = pick([60, 80, 100, 120]), d = pick([4, 5, 6, 8]);
      return { kind: 'ramp_givenW_d', F, d, W: F * d, h: 1.2 };
    },
    ramp_ratio_c() {
      const mult = pick([2, 3, 4]), F = pick([60, 80, 100, 120]);
      const Fout = F * mult, h = pick([1, 1.5, 2]), d = h * mult;
      return { kind: 'ramp_ratio_c', mult, Fout, F, h, d, W: Fout * h };
    },
    ramp_2box_d_cp() {
      const F = pick([80, 100, 120, 150]), d = pick([4, 5, 6]), h = pick([1.2, 1.5, 2]);
      const W = round(F * d, 1);
      const Fg = round(W / h, 1);
      // Keep Fg clean integer
      if (!Number.isInteger(Fg)) return GEN.ramp_2box_d_cp();
      return { kind: 'ramp_2box_d_cp', Fg, h, F, d, W };
    },
    ramp_2box_h_cp() {
      const Fg = pick([400, 500, 600, 800]), h = pick([1.2, 1.5, 2]), d = pick([4, 5, 6, 8]);
      const W = round(Fg * h, 1), F = round(W / d, 2);
      if (!Number.isInteger(F)) return GEN.ramp_2box_h_cp();
      return { kind: 'ramp_2box_h_cp', Fg, h, F, d, W };
    },
    ramp_2box_d_h() {
      const m = pick([30, 40, 50, 60]), h = pick([1.2, 1.5, 2]), d = pick([4, 5, 6, 8]);
      const W = round(m * G * h, 1), F = round(W / d, 2);
      if (!Number.isInteger(F)) return GEN.ramp_2box_d_h();
      return { kind: 'ramp_2box_d_h', m, h, F, d, W };
    },
    ramp_2box_h_h() {
      const m = pick([40, 50, 60, 80]), h = pick([1.5, 2, 2.5]), d = pick([5, 6, 8, 10]);
      const W = round(m * G * h, 1), F = round(W / d, 2);
      if (!Number.isInteger(F)) return GEN.ramp_2box_h_h();
      return { kind: 'ramp_2box_h_h', m, h, F, d, W };
    },
    compare_ab() {
      const m = pick([20, 30, 40]), h = pick([1.5, 2, 2.5]), d = pick([6, 8]);
      const Fg = m * G, W = round(Fg * h, 1), Fb = round(W / d, 1);
      return { kind: 'compare_ab', m, Fg, h, d, W, Fb };
    },

    // Part 4: Mechanical Advantage & Rough-Ramp Friction
    ma_find() {
      const ma = pick([3, 4, 5, 6]), Fin = pick([60, 75, 80, 90, 120]);
      return { kind: 'ma_find', ma, Fin, Fout: ma * Fin };
    },
    ma_pull_c() {
      const ma = pick([3, 4, 5]), Fin = pick([150, 200, 250, 300]);
      return { kind: 'ma_pull_c', ma, Fin, Fout: ma * Fin };
    },
    ma_pull_2box() {
      const ma = pick([3, 4, 5]), m = pick([60, 80, 100, 120, 150]);
      const Fout = m * G, Fin = round(Fout / ma, 2);
      if (!Number.isInteger(Fin)) return GEN.ma_pull_2box();
      return { kind: 'ma_pull_2box', ma, m, Fout, Fin };
    },
    ma_pull_h() {
      const ma = pick([3, 4, 5, 6]), m = pick([60, 90, 120, 150]);
      const Fout = m * G, Fin = round(Fout / ma, 2);
      if (!Number.isInteger(Fin)) return GEN.ma_pull_h();
      return { kind: 'ma_pull_h', ma, m, Fout, Fin };
    },
    ma_ramp_len() {
      const ma = pick([3, 4, 5]), h = pick([0.8, 0.9, 1.2, 1.5]);
      return { kind: 'ma_ramp_len', ma, h, d: round(ma * h, 2) };
    },
    ma_ramp_2box_h() {
      const ma = pick([3, 4, 5]), h = pick([0.8, 0.9, 1.2, 1.5]), m = pick([60, 70, 80, 90]);
      return { kind: 'ma_ramp_2box_h', ma, h, m, d: round(ma * h, 2), W: round(m * G * h, 1) };
    },
    rough_2box() {
      const d = pick([4, 5, 6]), F = pick([100, 110, 120, 140]);
      const Win = F * d;
      const Ff = pick([15, 20, 25, 30]);
      const Wf = Ff * d, Wout = Win - Wf;
      if (Wout <= 100) return GEN.rough_2box();
      return { kind: 'rough_2box', d, F, Win, Wout, Wf, Ff, h: 1.5 };
    },
    rough_3box_h() {
      const d = pick([4, 5, 6]), F = pick([110, 120, 130, 150]);
      const Win = F * d;
      const Ff = pick([15, 20, 25, 30]);
      const Wf = Ff * d, Wout = Win - Wf;
      if (Wout <= 100) return GEN.rough_3box_h();
      return { kind: 'rough_3box_h', d, F, Win, Wout, Wf, Ff, h: 1.5 };
    }
  };

  // Mistake helpers
  const mulDivMistake = (a, b, sym, eq) => x => {
    if (near(x, a + b)) return ['added_instead', `You added. Use ${eq}.`];
    if (near(x, a / b, 0.03) || near(x, b / a, 0.03)) return ['divided_instead', `You divided instead of multiplying. Use ${eq}.`];
    return null;
  };
  const divMistake = (top, bot, topSym, botSym) => x => {
    if (near(x, top * bot)) return ['multiplied_instead', `You multiplied. Divide ${topSym} by ${botSym}: ${topSym} ÷ ${botSym}.`];
    if (near(x, bot / top, 0.03)) return ['divide_flip', `That is ${botSym} ÷ ${topSym}. Put ${topSym} on top.`];
    if (near(x, top + bot) || near(x, Math.abs(top - bot))) return ['added_instead', `Divide ${topSym} by ${botSym}; do not add or subtract.`];
    return null;
  };

  function stepsOf(sc, tier = 'cp') {
    const showTri = tier === 'conceptual' || tier === 'cp';
    const workTri = cover => (showTri ? { kind: 'work', cover } : null);
    const maTri = cover => (showTri ? { kind: 'ma', cover } : null);
    const maSymbols = ['F_out = crate weight lifted', 'F_in = your pull force', 'MA = times easier'];
    const fricSymbols = ['W_in = total push work', 'W_out = useful lift', 'W_f = lost to friction'];
    switch (sc.kind) {
      case 'pulley_w':
        return [{
          id: 'w', sym: 'W', unit: 'J', calc: true, target: sc.W, skill: 'pulley',
          ask: 'A mechanic pulls the pulley chain to lift an engine. How much work is done?',
          formula: 'W = F × d',
          guessG: `F = ${fmt(sc.F)} N, d = ${fmt(sc.d)} m`, guessU: 'W = ? J',
          hints: ['Multiply the pulling force by the chain distance.', `In the calculator: ${fmt(sc.F)} × ${fmt(sc.d)}`],
          needs: { routes: [[sc.F, sc.d]], from: 'F and d on the picture' },
          mistake: mulDivMistake(sc.F, sc.d, 'W', 'W = F × d'),
          right: `W = F × d = ${fmt(sc.F)} N × ${fmt(sc.d)} m = ${fmt(sc.W)} J`
        }];
      case 'pulley_f':
        return [{
          id: 'f', sym: 'F', unit: 'N', calc: true, target: sc.F, skill: 'pulley',
          tri: workTri('F'),
          ask: 'The pulley work meter shows how much work lifted the stage light. How hard does the stagehand pull?',
          formula: 'F = W ÷ d',
          guessG: `W = ${fmt(sc.W)} J, d = ${fmt(sc.d)} m`, guessU: 'F = ? N',
          hints: ['Cover F in W = F × d: divide work by distance.', `In the calculator: ${fmt(sc.W)} ÷ ${fmt(sc.d)}`],
          needs: { routes: [[sc.W, sc.d]], from: 'W and d on the picture' },
          mistake: divMistake(sc.W, sc.d, 'W', 'd'),
          right: `F = W ÷ d = ${fmt(sc.W)} J ÷ ${fmt(sc.d)} m = ${fmt(sc.F)} N`
        }];
      case 'pulley_d':
        return [{
          id: 'd', sym: 'd', unit: 'm', calc: true, target: sc.d, skill: 'pulley',
          tri: workTri('d'),
          ask: 'Raising the sail takes the work shown on the meter. How many meters of rope must the sailor pull?',
          formula: 'd = W ÷ F',
          guessG: `W = ${fmt(sc.W)} J, F = ${fmt(sc.F)} N`, guessU: 'd = ? m',
          hints: ['Cover d in W = F × d: divide work by force.', `In the calculator: ${fmt(sc.W)} ÷ ${fmt(sc.F)}`],
          needs: { routes: [[sc.W, sc.F]], from: 'W and F on the picture' },
          mistake: divMistake(sc.W, sc.F, 'W', 'F'),
          right: `d = W ÷ F = ${fmt(sc.W)} J ÷ ${fmt(sc.F)} N = ${fmt(sc.d)} m`
        }];
      case 'pulley_2step':
        return [
          {
            id: 'w', sym: 'W', unit: 'J', calc: true, target: sc.W, skill: 'pulley',
            ask: 'Step 1: Find the work done by the single-rope hoist.',
            formula: 'W = F × d',
            guessG: `F = ${fmt(sc.F)} N, d = ${fmt(sc.d)} m`, guessU: 'W = ? J',
            hints: [`Multiply force by distance: ${fmt(sc.F)} × ${fmt(sc.d)}`],
            needs: { routes: [[sc.F, sc.d]], from: 'F and d' },
            mistake: mulDivMistake(sc.F, sc.d, 'W', 'W = F × d'),
            right: `W = F × d = ${fmt(sc.F)} N × ${fmt(sc.d)} m = ${fmt(sc.W)} J`
          },
          {
            id: 'f2', sym: 'F_2', unit: 'N', calc: true, target: sc.F2, skill: 'pulley',
            ask: `Step 2: A double pulley needs the same ${fmt(sc.W)} J of work, pulled over d_2 = ${fmt(sc.d2)} m of rope. Find the new pull force.`,
            formula: 'F_2 = W ÷ d_2',
            guessG: `W = ${fmt(sc.W)} J, d_2 = ${fmt(sc.d2)} m`, guessU: 'F_2 = ? N',
            hints: ['Twice as much rope cuts the pull force in half.', `In the calculator: ${fmt(sc.W)} ÷ ${fmt(sc.d2)}`],
            needs: { routes: [[sc.W, sc.d2]], from: 'W and d_2' },
            mistake: divMistake(sc.W, sc.d2, 'W', 'd_2'),
            right: `F_2 = W ÷ d_2 = ${fmt(sc.W)} J ÷ ${fmt(sc.d2)} m = ${fmt(sc.F2)} N`
          }
        ];
      case 'pulley_lift_h':
        return [
          {
            id: 'w', sym: 'W', unit: 'J', calc: true, target: sc.W, skill: 'pulley',
            ask: 'Step 1: Find the work needed to lift the crate straight up by height h.',
            formula: 'W = m × g × h',
            guessG: `m = ${fmt(sc.m)} kg, h = ${fmt(sc.h)} m, g = 10 m/s²`, guessU: 'W = ? J',
            hints: ['Weight = m × g with g = 10 m/s², then multiply by h.', `In the calculator: ${fmt(sc.m)} × 10 × ${fmt(sc.h)}`],
            needs: { routes: [[sc.m, G, sc.h], [sc.m * G, sc.h]], from: 'm, g = 10, and h' },
            mistake: x => (near(x, sc.m * sc.h) ? ['forgot_g', 'Multiply by g = 10 m/s² to convert mass to weight.'] : near(x, sc.m * 9.8 * sc.h) ? ['g98', 'This class uses g = 10 m/s².'] : null),
            right: `W = m × g × h = ${fmt(sc.m)} kg × 10 m/s² × ${fmt(sc.h)} m = ${fmt(sc.W)} J`
          },
          {
            id: 'f', sym: 'F', unit: 'N', calc: true, target: sc.F, skill: 'pulley',
            ask: `Step 2: Using a pulley hoist, a worker pulls ${fmt(sc.d)} m of rope to do that same ${fmt(sc.W)} J of work. Find the pull force.`,
            formula: 'F = W ÷ d',
            guessG: `W = ${fmt(sc.W)} J, d = ${fmt(sc.d)} m`, guessU: 'F = ? N',
            hints: [`In the calculator: ${fmt(sc.W)} ÷ ${fmt(sc.d)}`],
            needs: { routes: [[sc.W, sc.d]], from: 'W and d' },
            mistake: divMistake(sc.W, sc.d, 'W', 'd'),
            right: `F = W ÷ d = ${fmt(sc.W)} J ÷ ${fmt(sc.d)} m = ${fmt(sc.F)} N`
          }
        ];

      // Part 3: Ramps
      case 'ramp_givenW_f':
        return [{
          id: 'f', sym: 'F', unit: 'N', calc: true, target: sc.F, skill: 'ramp',
          tri: workTri('F'),
          ask: 'The work needed to get the speaker onto the stage is shown on the dock. How much push force is needed up this smooth ramp?',
          formula: 'F = W ÷ d',
          guessG: `W = ${fmt(sc.W)} J, d = ${fmt(sc.d)} m`, guessU: 'F = ? N',
          hints: ['A smooth ramp does the same work W, stretched over ramp length d.', `In the calculator: ${fmt(sc.W)} ÷ ${fmt(sc.d)}`],
          needs: { routes: [[sc.W, sc.d]], from: 'W and d on the picture' },
          mistake: divMistake(sc.W, sc.d, 'W', 'd'),
          right: `F = W ÷ d = ${fmt(sc.W)} J ÷ ${fmt(sc.d)} m = ${fmt(sc.F)} N`
        }];
      case 'ramp_givenW_d':
        return [{
          id: 'd', sym: 'd', unit: 'm', calc: true, target: sc.d, skill: 'ramp',
          tri: workTri('d'),
          ask: 'The cart needs the work shown on the dock, and the worker can push with force F. How long must the smooth ramp be?',
          formula: 'd = W ÷ F',
          guessG: `W = ${fmt(sc.W)} J, F = ${fmt(sc.F)} N`, guessU: 'd = ? m',
          hints: ['Divide the work needed by the push force.', `In the calculator: ${fmt(sc.W)} ÷ ${fmt(sc.F)}`],
          needs: { routes: [[sc.W, sc.F]], from: 'W and F on the picture' },
          mistake: divMistake(sc.W, sc.F, 'W', 'F'),
          right: `d = W ÷ F = ${fmt(sc.W)} J ÷ ${fmt(sc.F)} N = ${fmt(sc.d)} m`
        }];
      case 'ramp_ratio_c':
        return [{
          id: 'f', sym: 'F', unit: 'N', calc: true, target: sc.F, skill: 'ramp',
          ratio: { mult: sc.mult, h: sc.h, d: sc.d, Fout: sc.Fout },
          ask: `The ramp is ${sc.mult} times as long as the straight-up height. How hard do you push to move the ${fmt(sc.Fout)} N weight up the ramp?`,
          formula: `F = F_out ÷ ${sc.mult}`,
          guessG: `F_out = ${fmt(sc.Fout)} N, ramp is ${sc.mult}× longer`, guessU: 'F = ? N',
          hints: [`${sc.mult} times the distance cuts the force to 1/${sc.mult}.`, `In the calculator: ${fmt(sc.Fout)} ÷ ${sc.mult} (or ${fmt(sc.W)} ÷ ${fmt(sc.d)})`],
          needs: { routes: [[sc.Fout, sc.mult], [sc.W, sc.d]], from: 'F_out and the ramp factor' },
          mistake: x => (near(x, sc.Fout * sc.mult) ? ['multiplied_instead', `A ramp makes pushing EASIER, not harder. Divide ${fmt(sc.Fout)} N by ${sc.mult}.`] : near(x, sc.Fout) ? ['ignored_ramp', 'That is the straight-up weight. The ramp cuts the force down.'] : null),
          right: `F = F_out ÷ ${sc.mult} = ${fmt(sc.Fout)} N ÷ ${sc.mult} = ${fmt(sc.F)} N`
        }];
      case 'ramp_2box_d_cp':
        return [
          {
            id: 'w', sym: 'W', unit: 'J', calc: true, target: sc.W, skill: 'ramp',
            ask: 'Step 1: Find the work needed to lift the cart straight up to the dock.',
            formula: 'W = F_g × h',
            guessG: `F_g = ${fmt(sc.Fg)} N, h = ${fmt(sc.h)} m`, guessU: 'W = ? J',
            hints: ['Multiply the weight F_g by the vertical height h.', `In the calculator: ${fmt(sc.Fg)} × ${fmt(sc.h)}`],
            needs: { routes: [[sc.Fg, sc.h]], from: 'F_g and h' },
            mistake: mulDivMistake(sc.Fg, sc.h, 'W', 'W = F_g × h'),
            right: `W = F_g × h = ${fmt(sc.Fg)} N × ${fmt(sc.h)} m = ${fmt(sc.W)} J`
          },
          {
            id: 'd', sym: 'd', unit: 'm', calc: true, target: sc.d, skill: 'ramp',
            ask: 'Step 2: A smooth ramp does that same work W using push force F. How long must the ramp be?',
            formula: 'd = W ÷ F',
            guessG: `W = ${fmt(sc.W)} J, F = ${fmt(sc.F)} N`, guessU: 'd = ? m',
            hints: [`In the calculator: ${fmt(sc.W)} ÷ ${fmt(sc.F)}`],
            needs: { routes: [[sc.W, sc.F]], from: 'W and F' },
            mistake: divMistake(sc.W, sc.F, 'W', 'F'),
            right: `d = W ÷ F = ${fmt(sc.W)} J ÷ ${fmt(sc.F)} N = ${fmt(sc.d)} m`
          }
        ];
      case 'ramp_2box_h_cp':
        return [
          {
            id: 'w', sym: 'W', unit: 'J', calc: true, target: sc.W, skill: 'ramp',
            ask: 'Step 1: Find the work the mover does pushing up the smooth ramp.',
            formula: 'W = F × d',
            guessG: `F = ${fmt(sc.F)} N, d = ${fmt(sc.d)} m`, guessU: 'W = ? J',
            hints: [`Multiply push force by ramp length: ${fmt(sc.F)} × ${fmt(sc.d)}`],
            needs: { routes: [[sc.F, sc.d]], from: 'F and d' },
            mistake: mulDivMistake(sc.F, sc.d, 'W', 'W = F × d'),
            right: `W = F × d = ${fmt(sc.F)} N × ${fmt(sc.d)} m = ${fmt(sc.W)} J`
          },
          {
            id: 'h', sym: 'h', unit: 'm', calc: true, target: sc.h, skill: 'ramp',
            ask: 'Step 2: Because the ramp is smooth, that work equals the lifting work F_g × h. How high is the truck bed?',
            formula: 'h = W ÷ F_g',
            guessG: `W = ${fmt(sc.W)} J, F_g = ${fmt(sc.Fg)} N`, guessU: 'h = ? m',
            hints: [`In the calculator: ${fmt(sc.W)} ÷ ${fmt(sc.Fg)}`],
            needs: { routes: [[sc.W, sc.Fg]], from: 'W and F_g' },
            mistake: divMistake(sc.W, sc.Fg, 'W', 'F_g'),
            right: `h = W ÷ F_g = ${fmt(sc.W)} J ÷ ${fmt(sc.Fg)} N = ${fmt(sc.h)} m`
          }
        ];
      case 'ramp_2box_d_h':
        return [
          {
            id: 'w', sym: 'W', unit: 'J', calc: true, target: sc.W, skill: 'ramp',
            ask: 'Step 1: Find the lifting work needed to raise the cart to height h.',
            formula: 'W = m × g × h',
            guessG: `m = ${fmt(sc.m)} kg, h = ${fmt(sc.h)} m, g = 10 m/s²`, guessU: 'W = ? J',
            hints: [`In the calculator: ${fmt(sc.m)} × 10 × ${fmt(sc.h)}`],
            needs: { routes: [[sc.m, G, sc.h], [sc.m * G, sc.h]], from: 'm, g = 10, and h' },
            mistake: x => (near(x, sc.m * sc.h) ? ['forgot_g', 'Include g = 10 m/s² to convert mass to weight.'] : near(x, sc.m * 9.8 * sc.h) ? ['g98', 'Use g = 10 m/s².'] : null),
            right: `W = m × g × h = ${fmt(sc.m)} kg × 10 m/s² × ${fmt(sc.h)} m = ${fmt(sc.W)} J`
          },
          {
            id: 'd', sym: 'd', unit: 'm', calc: true, target: sc.d, skill: 'ramp',
            ask: 'Step 2: With push limit F on a frictionless ramp, how long does the ramp need to be?',
            formula: 'd = W ÷ F',
            guessG: `W = ${fmt(sc.W)} J, F = ${fmt(sc.F)} N`, guessU: 'd = ? m',
            hints: [`In the calculator: ${fmt(sc.W)} ÷ ${fmt(sc.F)}`],
            needs: { routes: [[sc.W, sc.F]], from: 'W and F' },
            mistake: divMistake(sc.W, sc.F, 'W', 'F'),
            right: `d = W ÷ F = ${fmt(sc.W)} J ÷ ${fmt(sc.F)} N = ${fmt(sc.d)} m`
          }
        ];
      case 'ramp_2box_h_h':
        return [
          {
            id: 'w', sym: 'W', unit: 'J', calc: true, target: sc.W, skill: 'ramp',
            ask: 'Step 1: Find the total work done pushing up the frictionless ramp.',
            formula: 'W = F × d',
            guessG: `F = ${fmt(sc.F)} N, d = ${fmt(sc.d)} m`, guessU: 'W = ? J',
            hints: [`In the calculator: ${fmt(sc.F)} × ${fmt(sc.d)}`],
            needs: { routes: [[sc.F, sc.d]], from: 'F and d' },
            mistake: mulDivMistake(sc.F, sc.d, 'W', 'W = F × d'),
            right: `W = F × d = ${fmt(sc.F)} N × ${fmt(sc.d)} m = ${fmt(sc.W)} J`
          },
          {
            id: 'h', sym: 'h', unit: 'm', calc: true, target: sc.h, skill: 'ramp',
            ask: 'Step 2: Set W equal to m × g × h and solve for the truck bed height h.',
            formula: 'h = W ÷ (m × g)',
            guessG: `W = ${fmt(sc.W)} J, m = ${fmt(sc.m)} kg, g = 10 m/s²`, guessU: 'h = ? m',
            hints: [`Divide W by weight (m × 10): ${fmt(sc.W)} ÷ (${fmt(sc.m)} × 10)`],
            needs: { routes: [[sc.W, sc.m, G], [sc.W, sc.m * G]], from: 'W, m, and g = 10' },
            mistake: x => (near(x, sc.W / sc.m) ? ['forgot_g', 'Divide by weight (m × g), not just mass.'] : null),
            right: `h = W ÷ (m × g) = ${fmt(sc.W)} J ÷ (${fmt(sc.m)} kg × 10 m/s²) = ${fmt(sc.h)} m`
          }
        ];
      case 'compare_ab': {
        const useMass = tier === 'honors';
        return [{
          id: 'w', sym: 'W', unit: 'J', calc: true, target: sc.W, skill: 'ramp',
          ask: 'Now calculate the work each student does to get the box onto the shelf.',
          formula: useMass ? 'W = m × g × h' : 'W = F_g × h',
          guessG: useMass ? `m = ${fmt(sc.m)} kg, h = ${fmt(sc.h)} m, g = 10 m/s²` : `F_g = ${fmt(sc.Fg)} N, h = ${fmt(sc.h)} m`,
          guessU: 'W_A = W_B = ? J',
          hints: [useMass ? `In the calculator: ${fmt(sc.m)} × 10 × ${fmt(sc.h)}` : `In the calculator: ${fmt(sc.Fg)} × ${fmt(sc.h)}`],
          needs: { routes: useMass ? [[sc.m, G, sc.h], [sc.Fg, sc.h]] : [[sc.Fg, sc.h], [sc.Fb, sc.d]], from: 'the load and height' },
          mistake: x => (useMass && near(x, sc.m * sc.h) ? ['forgot_g', 'Include g = 10 m/s².'] : null),
          right: useMass
            ? `W = m × g × h = ${fmt(sc.m)} kg × 10 m/s² × ${fmt(sc.h)} m = ${fmt(sc.W)} J`
            : `W = F_g × h = ${fmt(sc.Fg)} N × ${fmt(sc.h)} m = ${fmt(sc.W)} J`
        }];
      }

      // Part 4: Mechanical Advantage & Friction
      case 'ma_find':
        return [{
          id: 'ma', sym: 'MA', unit: '', calc: true, target: sc.ma, skill: 'ma',
          symbols: maSymbols,
          tri: maTri('MA'),
          ask: 'A pulley lets the worker lift a heavy crate with a smaller pull force. What is the mechanical advantage?',
          formula: 'MA = F_out ÷ F_in',
          guessG: `F_out = ${fmt(sc.Fout)} N, F_in = ${fmt(sc.Fin)} N`, guessU: 'MA = ?',
          hints: ['Divide the crate weight (F_out) by your pull force (F_in).', `In the calculator: ${fmt(sc.Fout)} ÷ ${fmt(sc.Fin)}`],
          needs: { routes: [[sc.Fout, sc.Fin]], from: 'F_out and F_in' },
          mistake: x => (near(x, sc.Fin / sc.Fout, 0.04) ? ['ma_flip', 'That is F_in ÷ F_out. Mechanical advantage is larger than 1: F_out ÷ F_in.'] : near(x, sc.Fout * sc.Fin) ? ['multiplied_instead', 'Divide F_out by F_in; do not multiply.'] : null),
          right: `MA = F_out ÷ F_in = ${fmt(sc.Fout)} N ÷ ${fmt(sc.Fin)} N = ${fmt(sc.ma)}`
        }];
      case 'ma_pull_c':
        return [{
          id: 'fin', sym: 'F_in', unit: 'N', calc: true, target: sc.Fin, skill: 'ma',
          symbols: maSymbols,
          tri: maTri('Fin'),
          ask: `An ideal pulley has a mechanical advantage of ${sc.ma}. How much pull force is needed to lift the ${fmt(sc.Fout)} N engine?`,
          formula: 'F_in = F_out ÷ MA',
          guessG: `F_out = ${fmt(sc.Fout)} N, MA = ${sc.ma}`, guessU: 'F_in = ? N',
          hints: [`A mechanical advantage of ${sc.ma} divides the force by ${sc.ma}.`, `In the calculator: ${fmt(sc.Fout)} ÷ ${sc.ma}`],
          needs: { routes: [[sc.Fout, sc.ma]], from: 'F_out and MA' },
          mistake: divMistake(sc.Fout, sc.ma, 'F_out', 'MA'),
          right: `F_in = F_out ÷ MA = ${fmt(sc.Fout)} N ÷ ${sc.ma} = ${fmt(sc.Fin)} N`
        }];
      case 'ma_pull_2box':
        return [
          {
            id: 'fout', sym: 'F_out', unit: 'N', calc: true, target: sc.Fout, skill: 'ma',
            ask: 'Step 1: First find the engine block weight F_out in newtons.',
            formula: 'F_out = m × g',
            guessG: `m = ${fmt(sc.m)} kg, g = 10 m/s²`, guessU: 'F_out = ? N',
            hints: [`Multiply mass by g = 10 m/s²: ${fmt(sc.m)} × 10`],
            needs: { routes: [[sc.m, G]], from: 'm and g = 10' },
            mistake: x => (near(x, sc.m * 9.8) ? ['g98', 'Use g = 10 m/s².'] : null),
            right: `F_out = m × g = ${fmt(sc.m)} kg × 10 m/s² = ${fmt(sc.Fout)} N`
          },
          {
            id: 'fin', sym: 'F_in', unit: 'N', calc: true, target: sc.Fin, skill: 'ma',
            symbols: maSymbols,
            tri: maTri('Fin'),
            ask: `Step 2: Now divide that weight by the pulley's mechanical advantage (MA = ${sc.ma}) to find the pull force.`,
            formula: 'F_in = F_out ÷ MA',
            guessG: `F_out = ${fmt(sc.Fout)} N, MA = ${sc.ma}`, guessU: 'F_in = ? N',
            hints: [`In the calculator: ${fmt(sc.Fout)} ÷ ${sc.ma}`],
            needs: { routes: [[sc.Fout, sc.ma]], from: 'F_out and MA' },
            mistake: divMistake(sc.Fout, sc.ma, 'F_out', 'MA'),
            right: `F_in = F_out ÷ MA = ${fmt(sc.Fout)} N ÷ ${sc.ma} = ${fmt(sc.Fin)} N`
          }
        ];
      case 'ma_pull_h':
        return [{
          id: 'fin', sym: 'F_in', unit: 'N', calc: true, target: sc.Fin, skill: 'ma',
          symbols: ['F_out = m × g (weight)', 'F_in = your pull force', 'MA = times easier'],
          ask: `An ideal pulley system has MA = ${sc.ma}. How much pull force is required to lift the ${fmt(sc.m)} kg engine block?`,
          formula: 'F_in = (m × g) ÷ MA',
          guessG: `m = ${fmt(sc.m)} kg, g = 10 m/s², MA = ${sc.ma}`, guessU: 'F_in = ? N',
          hints: ['First find weight m × 10, then divide by MA.', `In the calculator: (${fmt(sc.m)} × 10) ÷ ${sc.ma}`],
          needs: { routes: [[sc.m, G, sc.ma], [sc.Fout, sc.ma]], from: 'm, g = 10, and MA' },
          mistake: x => (near(x, sc.m / sc.ma) ? ['forgot_g', 'Convert mass to weight (m × 10) first.'] : near(x, sc.Fout * sc.ma) ? ['multiplied_instead', 'Divide by MA, do not multiply.'] : null),
          right: `F_in = (m × g) ÷ MA = (${fmt(sc.m)} kg × 10 m/s²) ÷ ${sc.ma} = ${fmt(sc.Fin)} N`
        }];
      case 'ma_ramp_len':
        return [{
          id: 'd', sym: 'd', unit: 'm', calc: true, target: sc.d, skill: 'ma',
          teach: 'For a smooth ramp, <strong>MA</strong> also tells how many times longer the ramp is than the height (<strong>MA = d ÷ h</strong>), so <strong>d = MA × h</strong>.',
          ask: `A wheelchair ramp has MA = ${sc.ma} and rises to a doorway h = ${fmt(sc.h)} m high. How long is the ramp?`,
          formula: 'd = MA × h',
          guessG: `MA = ${sc.ma}, h = ${fmt(sc.h)} m`, guessU: 'd = ? m',
          hints: [`For an ideal ramp, MA = d ÷ h, so d = MA × h.`, `In the calculator: ${sc.ma} × ${fmt(sc.h)}`],
          needs: { routes: [[sc.ma, sc.h]], from: 'MA and h' },
          mistake: mulDivMistake(sc.ma, sc.h, 'd', 'd = MA × h'),
          right: `d = MA × h = ${sc.ma} × ${fmt(sc.h)} m = ${fmt(sc.d)} m`
        }];
      case 'ma_ramp_2box_h':
        return [
          {
            id: 'd', sym: 'd', unit: 'm', calc: true, target: sc.d, skill: 'ma',
            teach: 'For a smooth ramp, <strong>MA</strong> also tells how many times longer the ramp is than the height (<strong>MA = d ÷ h</strong>), so <strong>d = MA × h</strong>.',
            ask: `Step 1: A ramp with MA = ${sc.ma} leads up to a doorway ${fmt(sc.h)} m high. How long is the ramp?`,
            formula: 'd = MA × h',
            guessG: `MA = ${sc.ma}, h = ${fmt(sc.h)} m`, guessU: 'd = ? m',
            hints: [`In the calculator: ${sc.ma} × ${fmt(sc.h)}`],
            needs: { routes: [[sc.ma, sc.h]], from: 'MA and h' },
            mistake: mulDivMistake(sc.ma, sc.h, 'd', 'd = MA × h'),
            right: `d = MA × h = ${sc.ma} × ${fmt(sc.h)} m = ${fmt(sc.d)} m`
          },
          {
            id: 'w', sym: 'W', unit: 'J', calc: true, target: sc.W, skill: 'ma',
            ask: `Step 2: How much work is done lifting an ${fmt(sc.m)} kg wheelchair to that ${fmt(sc.h)} m doorway?`,
            formula: 'W = m × g × h',
            guessG: `m = ${fmt(sc.m)} kg, h = ${fmt(sc.h)} m, g = 10 m/s²`, guessU: 'W = ? J',
            hints: [`In the calculator: ${fmt(sc.m)} × 10 × ${fmt(sc.h)}`],
            needs: { routes: [[sc.m, G, sc.h], [sc.m * G, sc.h]], from: 'm, g = 10, and h' },
            mistake: x => (near(x, sc.m * sc.h) ? ['forgot_g', 'Multiply by g = 10 m/s² too.'] : null),
            right: `W = m × g × h = ${fmt(sc.m)} kg × 10 m/s² × ${fmt(sc.h)} m = ${fmt(sc.W)} J`
          }
        ];
      case 'rough_2box':
        return [
          {
            id: 'win', sym: 'W_in', unit: 'J', calc: true, target: sc.Win, skill: 'friction',
            symbols: fricSymbols,
            fricBar: true,
            ask: 'Step 1: Find the total input work the worker puts in pushing up the rough ramp.',
            formula: 'W_in = F × d',
            guessG: `F = ${fmt(sc.F)} N, d = ${fmt(sc.d)} m`, guessU: 'W_in = ? J',
            hints: [`Multiply push force by ramp length: ${fmt(sc.F)} × ${fmt(sc.d)}`],
            needs: { routes: [[sc.F, sc.d]], from: 'F and d' },
            mistake: mulDivMistake(sc.F, sc.d, 'W_in', 'W_in = F × d'),
            right: `W_in = F × d = ${fmt(sc.F)} N × ${fmt(sc.d)} m = ${fmt(sc.Win)} J`
          },
          {
            id: 'wf', sym: 'W_f', unit: 'J', calc: true, target: sc.Wf, skill: 'friction',
            symbols: fricSymbols,
            fricBar: true,
            ask: `Step 2: Only ${fmt(sc.Wout)} J went into useful lifting work. How many joules were lost to friction?`,
            formula: 'W_f = W_in − W_out',
            guessG: `W_in = ${fmt(sc.Win)} J, W_out = ${fmt(sc.Wout)} J`, guessU: 'W_f = ? J',
            hints: ['Subtract useful output work from total input work.', `In the calculator: ${fmt(sc.Win)} − ${fmt(sc.Wout)}`],
            needs: { routes: [[sc.Win, sc.Wout]], from: 'W_in and W_out' },
            mistake: x => (near(x, sc.Win + sc.Wout) ? ['added_instead', 'Subtract W_out from W_in to find what was lost to friction.'] : null),
            right: `W_f = W_in − W_out = ${fmt(sc.Win)} J − ${fmt(sc.Wout)} J = ${fmt(sc.Wf)} J`
          }
        ];
      case 'rough_3box_h':
        return [
          {
            id: 'win', sym: 'W_in', unit: 'J', calc: true, target: sc.Win, skill: 'friction',
            symbols: fricSymbols,
            fricBar: true,
            ask: 'Step 1: Find the total input work the worker puts in pushing up the rough ramp.',
            formula: 'W_in = F × d',
            guessG: `F = ${fmt(sc.F)} N, d = ${fmt(sc.d)} m`, guessU: 'W_in = ? J',
            hints: [`In the calculator: ${fmt(sc.F)} × ${fmt(sc.d)}`],
            needs: { routes: [[sc.F, sc.d]], from: 'F and d' },
            mistake: mulDivMistake(sc.F, sc.d, 'W_in', 'W_in = F × d'),
            right: `W_in = F × d = ${fmt(sc.F)} N × ${fmt(sc.d)} m = ${fmt(sc.Win)} J`
          },
          {
            id: 'wf', sym: 'W_f', unit: 'J', calc: true, target: sc.Wf, skill: 'friction',
            symbols: fricSymbols,
            fricBar: true,
            ask: `Step 2: Useful lifting work was W_out = ${fmt(sc.Wout)} J. How many joules of work were lost to friction?`,
            formula: 'W_f = W_in − W_out',
            guessG: `W_in = ${fmt(sc.Win)} J, W_out = ${fmt(sc.Wout)} J`, guessU: 'W_f = ? J',
            hints: [`In the calculator: ${fmt(sc.Win)} − ${fmt(sc.Wout)}`],
            needs: { routes: [[sc.Win, sc.Wout]], from: 'W_in and W_out' },
            mistake: x => (near(x, sc.Win + sc.Wout) ? ['added_instead', 'Subtract W_out from W_in.'] : null),
            right: `W_f = W_in − W_out = ${fmt(sc.Win)} J − ${fmt(sc.Wout)} J = ${fmt(sc.Wf)} J`
          },
          {
            id: 'ff', sym: 'F_f', unit: 'N', calc: true, target: sc.Ff, skill: 'friction',
            fricBar: true,
            ask: `Step 3: That ${fmt(sc.Wf)} J friction loss happened over the ${fmt(sc.d)} m ramp. Find the friction force.`,
            formula: 'F_f = W_f ÷ d',
            guessG: `W_f = ${fmt(sc.Wf)} J, d = ${fmt(sc.d)} m`, guessU: 'F_f = ? N',
            hints: [`In the calculator: ${fmt(sc.Wf)} ÷ ${fmt(sc.d)}`],
            needs: { routes: [[sc.Wf, sc.d]], from: 'W_f and d' },
            mistake: divMistake(sc.Wf, sc.d, 'W_f', 'd'),
            right: `F_f = W_f ÷ d = ${fmt(sc.Wf)} J ÷ ${fmt(sc.d)} m = ${fmt(sc.Ff)} N`
          }
        ];
      default:
        return [];
    }
  }

  // ---------- Part 5: Mastery Check (5 fresh situations, including Day 2 0 J callback) ----------
  const QUIZ_SKILLS = {
    pulley: 'Pulley Work (W, F, d)',
    ramp: 'Ramp Trade-Off',
    ma: 'Mechanical Advantage',
    friction: 'Rough-Ramp Friction',
    direction: 'Day 2: 0 J Perpendicular Force'
  };

  function buildQuiz(tier) {
    // 1. Tow Truck Winch
    const winchF = pick([200, 250, 300]), winchD = pick([4, 5, 6]);
    const q1 = tier === 'conceptual'
      ? { kind: 'q_pulley', sub: 'w', skill: 'pulley', F: winchF, d: winchD, W: winchF * winchD }
      : { kind: 'q_pulley', sub: pick(['f', 'd']), skill: 'pulley', F: winchF, d: winchD, W: winchF * winchD };

    // 2. Boat Trailer Ramp
    const rF = pick([80, 100, 120]), rD = pick([5, 6, 8]), rW = rF * rD;
    const rH = 2, rM = round(rW / (G * rH), 2);
    const q2 = tier === 'honors' && Number.isInteger(rM)
      ? { kind: 'q_ramp', sub: 'honors_d', skill: 'ramp', F: rF, d: rD, h: rH, m: rM, W: rW }
      : { kind: 'q_ramp', sub: tier === 'conceptual' ? 'f' : pick(['f', 'd']), skill: 'ramp', F: rF, d: rD, h: rH, W: rW };

    // 3. Theater Fly Rig (MA)
    const ma = pick([3, 4, 5]), maFin = pick([70, 80, 90, 110]);
    const q3 = { kind: 'q_ma', sub: tier === 'conceptual' ? 'ma' : pick(['ma', 'fin']), skill: 'ma', ma, Fin: maFin, Fout: ma * maFin };

    // 4. Moving Van Rough Ramp
    const vD = pick([4, 5]), vF = pick([120, 140]), vFf = pick([20, 25]);
    const vWin = vD * vF, vWf = vD * vFf, vWout = vWin - vWf;
    const q4 = {
      kind: 'q_rough',
      sub: tier === 'honors' ? 'ff' : 'wf',
      skill: 'friction',
      d: vD, F: vF, Ff: vFf, Win: vWin, Wf: vWf, Wout: vWout, h: 1.5
    };

    // 5. Day 2 Callback: Carrying a pallet flat (0 J)
    const cM = pick([15, 20, 25]), cD = pick([6, 8, 10]);
    const q5 = { kind: 'q_carry0', skill: 'direction', m: cM, F: cM * G, d: cD };

    return [q1, q2, q3, q4, q5];
  }

  function quizQuestion(it) {
    if (it.kind === 'q_pulley') {
      if (it.sub === 'w') {
        return {
          id: 'qp', sym: 'W', unit: 'J', calc: true, target: it.W, skill: it.skill,
          ask: 'A tow truck winch pulls a stalled car along the cable. How much work does the winch do?',
          formula: 'W = F × d',
          guessG: `F = ${fmt(it.F)} N, d = ${fmt(it.d)} m`, guessU: 'W = ? J',
          needs: { routes: [[it.F, it.d]], from: 'F and d' },
          mistake: mulDivMistake(it.F, it.d, 'W', 'W = F × d'),
          right: `W = F × d = ${fmt(it.F)} N × ${fmt(it.d)} m = ${fmt(it.W)} J`
        };
      }
      if (it.sub === 'f') {
        return {
          id: 'qp', sym: 'F', unit: 'N', calc: true, target: it.F, skill: it.skill,
          ask: 'The tow truck winch does the work shown on the meter over cable distance d. How strong is the cable pull?',
          formula: 'F = W ÷ d',
          guessG: `W = ${fmt(it.W)} J, d = ${fmt(it.d)} m`, guessU: 'F = ? N',
          needs: { routes: [[it.W, it.d]], from: 'W and d' },
          mistake: divMistake(it.W, it.d, 'W', 'd'),
          right: `F = W ÷ d = ${fmt(it.W)} J ÷ ${fmt(it.d)} m = ${fmt(it.F)} N`
        };
      }
      return {
        id: 'qp', sym: 'd', unit: 'm', calc: true, target: it.d, skill: it.skill,
        ask: 'The tow truck winch pulls with force F and does the work shown. How far does the cable reel in?',
        formula: 'd = W ÷ F',
        guessG: `W = ${fmt(it.W)} J, F = ${fmt(it.F)} N`, guessU: 'd = ? m',
        needs: { routes: [[it.W, it.F]], from: 'W and F' },
        mistake: divMistake(it.W, it.F, 'W', 'F'),
        right: `d = W ÷ F = ${fmt(it.W)} J ÷ ${fmt(it.F)} N = ${fmt(it.d)} m`
      };
    }
    if (it.kind === 'q_ramp') {
      if (it.sub === 'honors_d') {
        return {
          id: 'qr', sym: 'd', unit: 'm', calc: true, target: it.d, skill: it.skill,
          ask: 'How long must this frictionless boat trailer ramp be so a pull force F lifts the load to height h?',
          formula: 'd = (m × g × h) ÷ F',
          guessG: `m = ${fmt(it.m)} kg, h = ${fmt(it.h)} m, F = ${fmt(it.F)} N`, guessU: 'd = ? m',
          needs: { routes: [[it.m, G, it.h, it.F], [it.W, it.F]], from: 'm, g = 10, h, and F' },
          mistake: x => (near(x, (it.m * it.h) / it.F) ? ['forgot_g', 'Include g = 10 m/s².'] : null),
          right: `d = (m × g × h) ÷ F = (${fmt(it.m)} kg × 10 m/s² × ${fmt(it.h)} m) ÷ ${fmt(it.F)} N = ${fmt(it.d)} m`
        };
      }
      if (it.sub === 'f') {
        return {
          id: 'qr', sym: 'F', unit: 'N', calc: true, target: it.F, skill: it.skill,
          ask: 'The work needed to get the boat onto the trailer is shown. What pull force is needed up this smooth ramp?',
          formula: 'F = W ÷ d',
          guessG: `W = ${fmt(it.W)} J, d = ${fmt(it.d)} m`, guessU: 'F = ? N',
          needs: { routes: [[it.W, it.d]], from: 'W and d' },
          mistake: divMistake(it.W, it.d, 'W', 'd'),
          right: `F = W ÷ d = ${fmt(it.W)} J ÷ ${fmt(it.d)} m = ${fmt(it.F)} N`
        };
      }
      return {
        id: 'qr', sym: 'd', unit: 'm', calc: true, target: it.d, skill: it.skill,
        ask: 'The boat trailer requires the work shown, and you can pull with force F. How long must the ramp be?',
        formula: 'd = W ÷ F',
        guessG: `W = ${fmt(it.W)} J, F = ${fmt(it.F)} N`, guessU: 'd = ? m',
        needs: { routes: [[it.W, it.F]], from: 'W and F' },
        mistake: divMistake(it.W, it.F, 'W', 'F'),
        right: `d = W ÷ F = ${fmt(it.W)} J ÷ ${fmt(it.F)} N = ${fmt(it.d)} m`
      };
    }
    if (it.kind === 'q_ma') {
      if (it.sub === 'ma') {
        return {
          id: 'qm', sym: 'MA', unit: '', calc: true, target: it.ma, skill: it.skill,
          ask: 'A theater fly rig supports a backdrop of weight F_out using pull force F_in. Find the mechanical advantage.',
          formula: 'MA = F_out ÷ F_in',
          guessG: `F_out = ${fmt(it.Fout)} N, F_in = ${fmt(it.Fin)} N`, guessU: 'MA = ?',
          needs: { routes: [[it.Fout, it.Fin]], from: 'F_out and F_in' },
          mistake: x => (near(x, it.Fin / it.Fout, 0.04) ? ['ma_flip', 'Mechanical advantage is F_out ÷ F_in.'] : null),
          right: `MA = F_out ÷ F_in = ${fmt(it.Fout)} N ÷ ${fmt(it.Fin)} N = ${fmt(it.ma)}`
        };
      }
      return {
        id: 'qm', sym: 'F_in', unit: 'N', calc: true, target: it.Fin, skill: it.skill,
        ask: `A theater fly rig has MA = ${it.ma}. How much pull force F_in holds a ${fmt(it.Fout)} N backdrop?`,
        formula: 'F_in = F_out ÷ MA',
        guessG: `F_out = ${fmt(it.Fout)} N, MA = ${it.ma}`, guessU: 'F_in = ? N',
        needs: { routes: [[it.Fout, it.ma]], from: 'F_out and MA' },
        mistake: divMistake(it.Fout, it.ma, 'F_out', 'MA'),
        right: `F_in = F_out ÷ MA = ${fmt(it.Fout)} N ÷ ${it.ma} = ${fmt(it.Fin)} N`
      };
    }
    if (it.kind === 'q_rough') {
      if (it.sub === 'ff') {
        return {
          id: 'qf', sym: 'F_f', unit: 'N', calc: true, target: it.Ff, skill: it.skill,
          ask: 'On a rough moving-van ramp, find the friction force acting against the box.',
          formula: 'F_f = (W_in − W_out) ÷ d',
          guessG: `W_in = ${fmt(it.Win)} J, W_out = ${fmt(it.Wout)} J, d = ${fmt(it.d)} m`, guessU: 'F_f = ? N',
          needs: { routes: [[it.Win, it.Wout, it.d], [it.Wf, it.d]], from: 'W_in, W_out, and d' },
          mistake: x => (near(x, it.Wf) ? ['gave_wf', `That is the friction work W_f in joules. Divide by d = ${fmt(it.d)} m to get F_f.`] : null),
          right: `F_f = (W_in − W_out) ÷ d = (${fmt(it.Win)} J − ${fmt(it.Wout)} J) ÷ ${fmt(it.d)} m = ${fmt(it.Ff)} N`
        };
      }
      return {
        id: 'qf', sym: 'W_f', unit: 'J', calc: true, target: it.Wf, skill: it.skill,
        ask: `The mover put in W_in = ${fmt(it.Win)} J pushing up a rough ramp, and ${fmt(it.Wout)} J went into useful lifting. How much work was lost to friction?`,
        formula: 'W_f = W_in − W_out',
        guessG: `W_in = ${fmt(it.Win)} J, W_out = ${fmt(it.Wout)} J`, guessU: 'W_f = ? J',
        needs: { routes: [[it.Win, it.Wout]], from: 'W_in and W_out' },
        mistake: x => (near(x, it.Win + it.Wout) ? ['added_instead', 'Subtract W_out from W_in.'] : null),
        right: `W_f = W_in − W_out = ${fmt(it.Win)} J − ${fmt(it.Wout)} J = ${fmt(it.Wf)} J`
      };
    }
    return {
      id: 'qc', sym: 'W', unit: 'J', calc: false, target: 0, rel: 0, abs: 0.01, skill: it.skill,
      ask: "Day 2 Callback: A worker holds a pallet up and carries it sideways across a level floor. How much work do the worker's hands do on the pallet?",
      formula: 'W = F × d only for force along the motion',
      guessG: `F_hand = ${fmt(it.F)} N up, d = ${fmt(it.d)} m sideways (90°)`, guessU: 'W = ? J',
      mistake: x => (near(x, it.F * it.d) || near(x, it.m * it.d) ? ['carry_90', 'The hands push up while the pallet moves sideways. Force at 90° to motion does 0 J of work.'] : null),
      right: 'W = 0 J, because the upward force is at 90° to the sideways motion'
    };
  }

  function gradeQuiz(items, answers) {
    let score = 0;
    const mistakes = [], skills = {};
    const results = items.map((it, i) => {
      const a = answers[i] || {};
      const q = quizQuestion(it);
      const r = grade(q, a.value);
      const sk = skills[it.skill] || (skills[it.skill] = { right: 0, total: 0 });
      sk.total++;
      if (r.ok) { score++; sk.right++; }
      else if (r.mistake && r.mistake !== 'blank') mistakes.push(r.mistake);
      return { ok: r.ok, skill: it.skill, msg: r.msg, mistake: r.mistake };
    });
    const total = items.length;
    return { score, total, percent: Math.round((score / total) * 100), results, mistakes, skills };
  }

  window.SMP = {
    pick, shuffle, round, fmt, near, parseNum, G,
    workProblem, stack, grade,
    SETUP_GEN, setupSpec, GEN, stepsOf,
    QUIZ_SKILLS, buildQuiz, quizQuestion, gradeQuiz
  };
})();

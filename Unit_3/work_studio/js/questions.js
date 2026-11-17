// Mechanical Work Studio — every number question, built from the student's own table or from a new problem.
// Each question: { id, sym, unit, calc (needs Desmos), own (student's own data: a miss keeps the numbers), ask, formula,
//                  hints, target, rel, abs, needs → { routes, fn }, mistake(v) → [id, msg, retry?], right }.

(function () {
  const C = window.FLcore;
  const { fmt, near, round, pick, cosd, G } = C;

  // A ratio table from the student's own numbers: the distance row shows the jump, the work row has the blank.
  // rows: [distance from, distance to, distance factor], [work from, work to (or '?'), work factor (or '?')]
  const ratio = (d1, d2, dm, w1, w2, wm) => `<div class="ratio"><span class="r-lab wk-d-text">distance</span><span class="r-val">${d1} m</span><span class="r-op">× ${dm} →</span><span class="r-val">${d2} m</span>`
    + `<span class="r-lab wk-W-text">work</span><span class="r-val">${w1} J</span><span class="r-op ${wm === '?' ? 'r-ask' : ''}">× ${wm} →</span><span class="r-val ${w2 === '?' ? 'r-ask' : ''}">${w2}${w2 === '?' ? '' : ' J'}</span></div>`;

  // ---------- Questions about the student's own data ----------
  const Q = {
    // Periods 1–3: how many times as much work, straight from two rows of the table
    factor(table, a, b, mult) {
      const lo = table[a - 1], hi = table[b - 1];
      return {
        id: `factor_${a}_${b}`, sym: 'work ×', noEq: true, unit: '', own: true, target: mult, rel: 0, abs: 0.25, skill: 'pattern',
        ask: `Trial ${b} went ${mult === 2 ? 'twice' : `${mult} times`} as far as Trial ${a}. What was the work multiplied by?`,
        visual: ratio(fmt(lo.d), fmt(hi.d), mult, fmt(lo.W), fmt(hi.W), '?'),
        hints: [`Try it on the calculator: ${fmt(lo.W)} × 2, then ${fmt(lo.W)} × 3. Which one lands on ${fmt(hi.W)}?`],
        mistake: v => {
          if (near(v, mult * mult, 0, 0.01) && mult > 1) return ['factor_squared', `Check your table. ${fmt(lo.W)} J × ${mult * mult} is ${fmt(lo.W * mult * mult)} J. That is more than your Trial ${b} work.`];
          if (near(v, hi.W, 0, 0.6)) return ['factor_gave_work', `That is the work itself. The question is how many TIMES as much as Trial ${a}.`];
          if (near(v, hi.W - lo.W, 0, 0.6)) return ['factor_subtracted', `That is how much MORE work. "Times as much" asks what you multiply Trial ${a} by.`];
          return ['factor_other', `Not yet. What do you multiply ${fmt(lo.W)} J by to get about ${fmt(hi.W)} J?`];
        }
      };
    },
    // Periods 1–3: the pattern carried to a distance that was never tested
    pfactor(table) {
      return {
        id: 'pfactor', sym: 'work ×', noEq: true, unit: '', own: true, target: 2, rel: 0, abs: 0.01, skill: 'pattern',
        ask: `You never tested ${C.TEST_D.conceptual} m. It is twice as far as Trial 4. What will the work be multiplied by?`,
        visual: ratio(4, C.TEST_D.conceptual, 2, fmt(table[3].W), '?', '?'),
        hints: ['You already found this pattern going from Trial 1 to Trial 2.'],
        mistake: v => (near(v, 4, 0, 0.01)
          ? ['factor_squared', 'Work did not grow that fast in your table. Look at Trial 1 and Trial 2 again.']
          : ['factor_other', 'Use the pattern from your table: Trial 2 went twice as far as Trial 1.'])
      };
    },
    predictC(table) {
      const W4 = table[3].W, D = C.TEST_D.conceptual;
      return {
        id: 'predict', sym: 'W', unit: 'J', calc: true, own: true, target: W4 * 2, skill: 'predict',
        ask: `Predict the work for a ${D} m pull.`,
        visual: ratio(4, D, 2, fmt(W4), '?', 2),
        hints: ['Your Trial 4 work is in your table.', `In the calculator: ${fmt(W4)} × 2`],
        needs: { routes: [[W4, 2], [table[1].W, 4], [table[0].W, 8]], from: 'your own work numbers' },
        mistake: v => (near(v, W4 * 4)
          ? ['predict_squared', 'Twice the distance needs twice the work, not 4 times.']
          : near(v, W4 + 2) ? ['predict_added', 'You added 2. "Twice as much" means multiply by 2.']
            : ['predict_other', 'Multiply your Trial 4 work by how many times as much it will be.'])
      };
    },
    // Read a value off the line, at a distance that is not in the table
    readLine(x, slope, spec) {
      const W = slope * x;
      return {
        id: 'readline', sym: 'W', unit: 'J', own: true, target: W, rel: 0, abs: Math.max(2, spec.y.max * 0.03), skill: 'graph',
        ask: `Your table has no trial at d = ${fmt(x)} m. Use the line on your graph: about how much work would a ${fmt(x)} m pull take?`,
        formula: 'up from d to the line, then across to W',
        hints: [`Find ${fmt(x)} m on the bottom axis. Go straight up to the line, then straight across to the W axis.`, `Each small square up the side is ${fmt(spec.y.minor)} J.`],
        mistake: v => {
          if (near(v, x, 0, 0.01)) return ['read_gave_d', 'That is the distance. Go up from that distance to the line, then across to the work.'];
          if (near(v, slope, 0.05)) return ['read_gave_slope', 'That is the force (the slope). Read the W axis where the line is at this distance.'];
          return ['read_other', 'Not quite. Go straight up from the distance to the line, then straight across to the W axis and read it.'];
        }
      };
    },
    // Slope from two of the student's own plotted points
    slope(p, q) {
      const s = (q.y - p.y) / (q.x - p.x);
      return {
        id: 'slope', sym: 'slope', unit: 'J per m', calc: true, own: true, target: s, rel: 0.02, abs: 0.02, skill: 'graph',
        ask: 'Find the slope of your line from the two points you picked.',
        formula: 'slope = (W₂ − W₁) ÷ (d₂ − d₁)',
        hints: ['Rise over run: how far up, divided by how far across.', `In the calculator: (${fmt(q.y)} − ${fmt(p.y)}) ÷ (${fmt(q.x)} − ${fmt(p.x)})`],
        needs: { routes: [[p.y, q.y, p.x, q.x], [round(q.y - p.y, 1), round(q.x - p.x, 2)]], from: 'your two points, or the ΔW and Δd on the graph' },   // the graph labels ΔW and Δd, so using them is real work
        mistake: v => {
          if (near(v, 1 / s, 0.03)) return ['slope_flip', 'That is run ÷ rise. Slope is rise ÷ run: the W numbers go on top.'];
          if (near(v, q.y - p.y, 0.02)) return ['slope_rise', 'That is only the rise. Divide it by the run.'];
          if (near(v, q.y / q.x, 0.02) || near(v, p.y / p.x, 0.02)) return ['slope_one_point', 'Use both points: subtract the two W values, subtract the two d values, then divide.'];
          return ['slope_other', 'Not quite. Subtract the two W values. Subtract the two d values in the same order. Then divide.'];
        }
      };
    },
    // Periods 4–6: what the slope means
    slopeForce(slope) {
      return {
        id: 'slope_force', sym: 'F', unit: 'N', own: true, target: slope, rel: 0.03, abs: 0.2, skill: 'graph',
        ask: 'W = F × d, so on a graph of W against d, the slope is the force. A joule per meter is a newton. What force does your slope say the rope pulled with?',
        formula: 'slope = W ÷ d = F',
        hints: ['Your slope is on the graph. No new calculation is needed.'],
        mistake: v => (near(v, 1 / slope, 0.05) ? ['slope_flip', 'That is 1 ÷ slope. The slope itself is the force.'] : ['slope_force_other', 'The slope of W against d is the force. Use the slope you found.'])
      };
    },
    // Period 0: the slope is the part of the pull along the track
    parallel(rig) {
      const par = rig.F * cosd(rig.theta);
      return {
        id: 'parallel', sym: 'F_par', unit: 'N', calc: true, own: true, target: par, rel: 0.015, abs: 0.05, skill: 'graph',
        ask: 'Your slope is smaller than the spring scale reading. Only the part of the pull along the track does work. Find that part, using the spring scale and the rope angle.',
        formula: 'F_par = F × cos θ',
        hints: ['The spring scale reading and the angle θ are on the picture.', `In the calculator: ${fmt(rig.F)} × cos(${rig.theta})`],
        needs: { fn: 'cos', label: 'cos', routes: [[rig.F, rig.theta]], from: 'the spring scale reading and the angle' },
        mistake: v => {
          if (near(v, rig.F * Math.sin(rig.theta * Math.PI / 180), 0.02)) return ['used_sin', 'That used sin. The part along the track is next to the angle, so it uses cos.'];
          if (near(v, rig.F, 0.01)) return ['no_cos', 'That is the whole pull. Multiply by cos θ to keep only the part along the track.'];
          if (near(v, rig.F / cosd(rig.theta), 0.02)) return ['cos_divide', 'Multiply by cos θ. Do not divide.'];
          return ['parallel_other', 'Not quite. Multiply the spring scale reading by cos θ.'];
        }
      };
    },
    // Periods 4–6 and 0: work at a distance that was never tested, from the student's own slope
    predict(slope, rig, tier) {
      const D = C.TEST_D[tier], par = rig.F * cosd(rig.theta || 0);
      const rel = Math.max(0.03, Math.abs(slope - par) / par + 0.01);
      const target = slope * D;
      return {
        id: 'predict', sym: 'W', unit: 'J', calc: true, own: true, target, rel, abs: 0.5, skill: 'predict',
        ask: `You never pulled ${D} m. Predict the work the meter will show.`,
        formula: tier === 'honors' ? 'W = F × d × cos θ' : 'W = F × d',
        hints: [tier === 'honors' ? 'Your slope is F × cos θ. Multiply it by the new distance.' : 'Your slope is the force. Multiply it by the new distance.', `In the calculator: ${fmt(round(slope, 2))} × ${D}`],
        needs: { routes: [[round(slope, 2), D], [rig.F, D], [round(par, 2), D]], from: 'the force and the new distance' },
        mistake: x => {
          if (near(x, slope + D, 0.02)) return ['predict_added', 'You added. Work is force TIMES distance.'];
          if (tier === 'honors' && near(x, rig.F * D, 0.02)) return ['no_cos', 'That uses the whole pull. Only F × cos θ (your slope) does work along the track.'];
          if (near(x, slope / D, 0.03) || near(x, D / slope, 0.03)) return ['predict_divide', 'Multiply the force by the distance. Do not divide.'];
          return ['predict_other', 'Not quite. Multiply your slope by the new distance.'];
        }
      };
    }
  };

  // ---------- New problems (practice and Mastery Check). Plain JSON so they resume with the same numbers. ----------
  function pullProblem() {
    const F = pick([20, 25, 30, 40, 45, 50, 60, 75, 80]), d = pick([2, 3, 4, 5, 6, 8, 10, 12]);
    return { kind: 'pull', F, d, W: F * d };
  }
  function liftProblem(two) {
    const m = pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25]), h = pick([0.5, 1, 1.5, 2, 2.5, 3, 4]);
    return { kind: two ? 'liftC' : 'lift', m, h, Fg: m * G, W: round(m * G * h, 3) };
  }
  function netProblem() {
    for (let i = 0; i < 100; i++) {
      const push = pick([60, 80, 90, 100, 120, 150]), f = pick([10, 20, 25, 30, 40, 50]), d = pick([4, 5, 6, 8, 10, 12]);
      if (f < push) return { kind: 'net', push, f, d, Fnet: push - f, W: (push - f) * d };
    }
    return { kind: 'net', push: 120, f: 40, d: 10, Fnet: 80, W: 800 };
  }
  function angleProblem() {
    const F = pick([20, 30, 40, 50, 60, 80]), th = pick([30, 45, 60]), d = pick([5, 8, 10, 12, 15]);
    return { kind: 'angle', F, th, d, W: round(F * d * cosd(th), 3) };
  }
  function fricProblem() {
    const push = pick([60, 80, 90, 100, 120]), d = pick([5, 8, 10]), f = pick([10, 15, 20, 25, 30]);
    return { kind: 'fric', push, d, f, Wpush: push * d, Wf: -f * d, Wnet: (push - f) * d };
  }
  function brakeProblem() {
    const f = pick([20, 30, 40, 50, 60, 80]), d = pick([3, 4, 5, 6, 8]);
    return { kind: 'brake', f, d, W: -f * d };
  }

  function revFProblem() {
    const F = pick([20, 25, 30, 40, 50, 60, 75]), d = pick([2, 4, 5, 6, 8, 10, 12]);
    return { kind: 'revF', F, d, W: F * d };
  }
  function carry0Problem() {
    return { kind: 'carry0', m: pick([5, 8, 10, 12, 15, 20]), d: pick([6, 10, 12, 15, 20]) };
  }
  function revHProblem() {
    const m = pick([2, 4, 5, 8, 10, 20, 50, 60]), h = pick([0.5, 1, 1.5, 2, 3, 4, 5, 10, 20]);
    return { kind: 'revH', m, h, Fg: m * G, W: round(m * G * h, 3) };
  }
  function multiProblem() {
    const m = pick([5, 8, 10, 12]), h1 = pick([0.5, 1, 1.2, 1.5]), walk = pick([4, 6, 8]), h2 = pick([0.5, 0.8, 1]);
    return { kind: 'multi', m, h1, walk, h2, Fg: m * G, W1: round(m * G * h1, 3), W2: round(m * G * h2, 3), W: round(m * G * (h1 + h2), 3) };
  }

  const P = {
    // Work backward: the meter shows the work, find the force
    revF(sc) {
      return {
        id: 'revF', sym: 'F', unit: 'N', calc: true, target: sc.F, skill: 'backward',
        ask: 'The work meter shows the work done pulling the crate. How strong was the pull?',
        formula: 'F = W ÷ d',
        hints: ['W = F × d, so to get F, divide the work by the distance.', `In the calculator: ${fmt(sc.W)} ÷ ${fmt(sc.d)}`],
        needs: { routes: [[sc.W, sc.d]] },
        mistake: x => (near(x, sc.W * sc.d) ? ['times_d', 'Divide the work by the distance. Do not multiply.'] : near(x, sc.d / sc.W, 0.03) ? ['divide_flip', 'That is d ÷ W. Force is work ÷ distance.'] : null),
        right: `F = W ÷ d = ${fmt(sc.W)} J ÷ ${fmt(sc.d)} m = ${fmt(sc.F)} N`
      };
    },
    // The 0 J trap: carrying at the same height
    carry0(sc) {
      return {
        id: 'carry0', sym: 'W', unit: 'J', target: 0, rel: 0, abs: 0.01, skill: 'calc',
        ask: "The worker carries the crate across the room at the same height. How much work do the worker's hands do on the crate?",
        formula: 'W = F × d, only for the part of the force along the motion',
        hints: ['Which way do the hands push on the crate? Which way does the crate move?'],
        mistake: x => (near(x, sc.m * G * sc.d) || near(x, sc.m * sc.d) ? ['cat_90', 'The hands push up, but the crate moves sideways. A force at 90° to the motion does no work.'] : null),
        right: 'W = 0 J, because the upward push is at 90° to the sideways motion'
      };
    },
    // Work backward: the meter shows the work, find the height
    revH(sc) {
      return {
        id: 'revH', sym: 'h', unit: 'm', calc: true, target: sc.h, skill: 'backward',
        ask: 'The work meter shows the work done lifting this mass. How high was it lifted?',
        formula: 'h = W ÷ (m × g)',
        hints: ['First the weight: m × g, with g = 10 m/s². Then divide the work by the weight.', `In the calculator: ${fmt(sc.W)} ÷ (${fmt(sc.m)} × 10)`],
        needs: { routes: [[sc.W, sc.m, G], [sc.W, sc.Fg]] },
        mistake: x => (near(x, sc.W / sc.m) ? ['forgot_g', 'That divided by the mass. Divide by the weight, m × g.'] : near(x, sc.W * sc.Fg) ? ['times_d', 'Divide the work by the weight. Do not multiply.'] : null),
        right: `h = W ÷ (m × g) = ${fmt(sc.W)} J ÷ (${fmt(sc.m)} kg × 10 m/s²) = ${fmt(sc.h)} m`
      };
    },
    // Lift, walk, lift: add the pieces
    up1(sc) {
      return {
        id: 'up1', sym: 'W_1', unit: 'J', calc: true, target: sc.W1, skill: 'calc',
        ask: 'Box 1: Find the work done on the first lift.',
        formula: 'W_1 = m × g × h_1',
        hints: ['g = 10 m/s². The first height is on the picture.', `In the calculator: ${fmt(sc.m)} × 10 × ${fmt(sc.h1)}`],
        needs: { routes: [[sc.m, G, sc.h1], [sc.Fg, sc.h1]] },
        mistake: x => (near(x, sc.m * sc.h1) ? ['forgot_g', 'Multiply by g = 10 m/s² too: the lifting force is m × g.'] : null),
        right: `W_1 = m × g × h_1 = ${fmt(sc.m)} kg × 10 m/s² × ${fmt(sc.h1)} m = ${fmt(sc.W1)} J`
      };
    },
    up2(sc) {
      return {
        id: 'up2', sym: 'W_2', unit: 'J', calc: true, target: sc.W2, skill: 'calc',
        ask: 'Box 2: Walking across at the same height does 0 J. Now find the work done on the second lift.',
        formula: 'W_2 = m × g × h_2',
        hints: [`In the calculator: ${fmt(sc.m)} × 10 × ${fmt(sc.h2)}`],
        needs: { routes: [[sc.m, G, sc.h2], [sc.Fg, sc.h2]] },
        mistake: x => (near(x, sc.m * G * sc.walk) ? ['cat_90', 'That used the walking distance. Walking at the same height does 0 J. Use the second height.'] : null),
        right: `W_2 = m × g × h_2 = ${fmt(sc.m)} kg × 10 m/s² × ${fmt(sc.h2)} m = ${fmt(sc.W2)} J`
      };
    },
    total(sc) {
      return {
        id: 'total', sym: 'W_total', unit: 'J', calc: true, target: sc.W, skill: 'calc',
        ask: 'Box 3: Add up the work for the whole trip.',
        formula: 'W_total = W_1 + 0 J + W_2',
        hints: ['The walk in the middle adds 0 J.', `In the calculator: ${fmt(sc.W1)} + ${fmt(sc.W2)}`],
        needs: { routes: [[sc.W1, sc.W2]] },
        mistake: x => (near(x, sc.W + sc.m * G * sc.walk) ? ['cat_90', 'Do not add work for the walk. A force at 90° to the motion does 0 J.'] : null),
        right: `W_total = W_1 + 0 J + W_2 = ${fmt(sc.W1)} J + ${fmt(sc.W2)} J = ${fmt(sc.W)} J`
      };
    },
    pull(sc) {
      return {
        id: 'pull', sym: 'W', unit: 'J', calc: true, target: sc.W, skill: 'calc',
        ask: 'How much work does the rope do on the crate?',
        formula: 'W = F × d',
        hints: ['The force and the distance are on the picture.', `In the calculator: ${fmt(sc.F)} × ${fmt(sc.d)}`],
        needs: { routes: [[sc.F, sc.d]] },
        mistake: x => {
          if (near(x, sc.F + sc.d)) return ['added', 'You added. Work is force TIMES distance.'];
          if (near(x, sc.F / sc.d) || near(x, sc.d / sc.F)) return ['divided', 'You divided. Work is force TIMES distance.'];
          return null;
        },
        right: `W = F × d = ${fmt(sc.F)} N × ${fmt(sc.d)} m = ${fmt(sc.W)} J`
      };
    },
    // Periods 1–3, Box 1 of 2
    weight(sc) {
      return {
        id: 'weight', sym: 'F_g', unit: 'N', calc: true, target: sc.Fg, skill: 'calc',
        ask: 'Box 1: To lift the crate at a steady speed, you pull up with a force equal to its weight. How much does the crate weigh?',
        formula: 'F_g = m × g',
        hints: ['The mass is on the crate. On Earth, g = 10 m/s².', `In the calculator: ${fmt(sc.m)} × 10`],
        needs: { routes: [[sc.m, G]] },
        mistake: x => {
          if (near(x, sc.m * 9.8)) return ['g98', 'In this class, g = 10 m/s². Multiply the mass by 10.'];
          if (near(x, sc.m + G)) return ['added', 'You added. Weight is mass TIMES 10.'];
          return null;
        },
        right: `F_g = m × g = ${fmt(sc.m)} kg × 10 m/s² = ${fmt(sc.Fg)} N`
      };
    },
    // Periods 1–3, Box 2 of 2
    liftW(sc) {
      return {
        id: 'liftW', sym: 'W', unit: 'J', calc: true, target: sc.W, skill: 'calc',
        ask: 'Box 2: Now find the work done lifting the crate up to the shelf.',
        formula: 'W = F_g × h',
        hints: ['Use the weight from Box 1. The height is on the picture.', `In the calculator: ${fmt(sc.Fg)} × ${fmt(sc.h)}`],
        needs: { routes: [[sc.Fg, sc.h], [sc.m, G, sc.h]] },
        mistake: x => {
          if (near(x, sc.m * sc.h)) return ['forgot_g', 'That used the mass. Work uses the force: the weight from Box 1.'];
          if (near(x, sc.Fg + sc.h)) return ['added', 'You added. Work is force TIMES height.'];
          return null;
        },
        right: `W = F_g × h = ${fmt(sc.Fg)} N × ${fmt(sc.h)} m = ${fmt(sc.W)} J`
      };
    },
    lift(sc) {
      return {
        id: 'lift', sym: 'W', unit: 'J', calc: true, target: sc.W, skill: 'calc',
        ask: 'The crate is lifted to the shelf at a steady speed. How much work does the hoist do?',
        formula: 'W = m × g × h',
        hints: ['Lifting at a steady speed takes a force equal to the weight, m × g. On Earth, g = 10 m/s².', `In the calculator: ${fmt(sc.m)} × 10 × ${fmt(sc.h)}`],
        needs: { routes: [[sc.m, G, sc.h], [sc.Fg, sc.h]] },
        mistake: x => {
          if (near(x, sc.m * sc.h)) return ['forgot_g', 'That is m × h. The lifting force is the weight, m × g, so multiply by g = 10 m/s² too.'];
          if (near(x, sc.m * 9.8 * sc.h)) return ['g98', 'In this class, g = 10 m/s².'];
          if (near(x, sc.Fg)) return ['weight_only', 'That is the weight. Multiply it by the height to get the work.'];
          return null;
        },
        right: `W = m × g × h = ${fmt(sc.m)} kg × 10 m/s² × ${fmt(sc.h)} m = ${fmt(sc.W)} J`
      };
    },
    fnet(sc) {
      return {
        id: 'fnet', sym: 'F_net', unit: 'N', calc: true, target: sc.Fnet, skill: 'net',
        ask: 'Step 1: The push and friction point opposite ways. What is the net force on the crate?',
        formula: 'F_net = F_push − F_f',
        hints: ['Opposite forces fight each other, so subtract.', `In the calculator: ${fmt(sc.push)} − ${fmt(sc.f)}`],
        needs: { routes: [[sc.push, sc.f]] },
        mistake: x => (near(x, sc.push + sc.f) ? ['added_forces', 'The forces point opposite ways, so they fight each other. Subtract.'] : null),
        right: `F_net = F_push − F_f = ${fmt(sc.push)} N − ${fmt(sc.f)} N = ${fmt(sc.Fnet)} N`
      };
    },
    wnet(sc) {
      return {
        id: 'wnet', sym: 'W_net', unit: 'J', calc: true, target: sc.W, skill: 'net',
        ask: 'Step 2: Find the net work done on the crate.',
        formula: 'W_net = F_net × d',
        hints: ['Use the net force from Step 1. The distance is on the picture.', `In the calculator: ${fmt(sc.Fnet)} × ${fmt(sc.d)}`],
        needs: { routes: [[sc.Fnet, sc.d], [sc.push, sc.f, sc.d]] },
        mistake: x => {
          if (near(x, sc.push * sc.d)) return ['push_only', 'That is only the work of the push. Friction does negative work, so use the net force.'];
          if (near(x, (sc.push + sc.f) * sc.d)) return ['added_forces', 'Friction works against the push. Use the net force from Step 1.'];
          return null;
        },
        right: `W_net = F_net × d = ${fmt(sc.Fnet)} N × ${fmt(sc.d)} m = ${fmt(sc.W)} J`
      };
    },
    // One-line net work, used on the Mastery Check
    wnet1(sc) {
      return {
        id: 'wnet1', sym: 'W_net', unit: 'J', calc: true, target: sc.W, skill: 'net',
        ask: 'Find the net work done on the crate.',
        formula: 'W_net = (F_push − F_f) × d',
        hints: [], needs: { routes: [[sc.push, sc.f, sc.d], [sc.Fnet, sc.d]] },
        mistake: x => {
          if (near(x, sc.push * sc.d)) return ['push_only', 'That is only the work of the push. Friction does negative work and takes some away.'];
          if (near(x, (sc.push + sc.f) * sc.d)) return ['added_forces', 'Friction points against the motion. Subtract it from the push.'];
          return null;
        },
        right: `W_net = (F_push − F_f) × d = (${fmt(sc.push)} N − ${fmt(sc.f)} N) × ${fmt(sc.d)} m = ${fmt(sc.W)} J`
      };
    },
    angle(sc) {
      return {
        id: 'angle', sym: 'W', unit: 'J', calc: true, target: sc.W, skill: 'calc',
        ask: 'The rope pulls at an angle. How much work does it do on the crate?',
        formula: 'W = F × d × cos θ',
        hints: ['Only the part of the pull along the motion does work.', `In the calculator: ${fmt(sc.F)} × ${fmt(sc.d)} × cos(${sc.th})`],
        needs: { fn: 'cos', label: 'cos', routes: [[sc.F, sc.d, sc.th]] },
        mistake: x => {
          if (near(x, sc.F * sc.d)) return ['no_cos', 'That uses the whole pull. Multiply by cos θ to keep only the part along the motion.'];
          if (near(x, sc.F * sc.d * Math.sin(sc.th * Math.PI / 180))) return ['used_sin', 'That used sin. The part along the motion is next to the angle: use cos.'];
          return null;
        },
        right: `W = F × d × cos θ = ${fmt(sc.F)} N × ${fmt(sc.d)} m × cos ${sc.th}° = ${fmt(round(sc.W, 1))} J`
      };
    },
    // Period 0: work backward to the friction
    wf(sc) {
      return {
        id: 'wf', sym: 'W_f', unit: 'J', calc: true, target: sc.Wf, skill: 'backward',
        ask: 'Step 1: The work meter shows the net work. The push did F_push × d. How much work did friction do? Keep its sign.',
        formula: 'W_f = W_net − F_push × d',
        hints: ['Friction takes work away, so its work is negative.', `In the calculator: ${fmt(sc.Wnet)} − ${fmt(sc.push)} × ${fmt(sc.d)}`],
        needs: { routes: [[sc.Wnet, sc.push, sc.d], [sc.Wnet, sc.Wpush]] },
        mistake: x => {
          if (near(x, -sc.Wf)) return ['sign', 'Friction points against the motion, so its work is negative. Keep the minus sign.', true];
          if (near(x, sc.Wpush)) return ['push_only', 'That is the work of the push. Friction did the difference between the net work and that.'];
          return null;
        },
        right: `W_f = W_net − F_push × d = ${fmt(sc.Wnet)} J − ${fmt(sc.push)} N × ${fmt(sc.d)} m = ${fmt(sc.Wf)} J`
      };
    },
    ff(sc) {
      return {
        id: 'ff', sym: 'F_f', unit: 'N', calc: true, target: sc.f, skill: 'backward',
        ask: 'Step 2: How big is the friction force? Give its size, with no sign.',
        formula: 'F_f = size of W_f ÷ d',
        hints: ['Use the friction work from Step 1 and the distance on the picture.', `In the calculator: ${fmt(-sc.Wf)} ÷ ${fmt(sc.d)}`],
        needs: { routes: [[sc.Wf, sc.d]] },
        mistake: x => {
          if (near(x, -sc.f)) return ['force_sign', 'A force size has no sign. The minus only told you the direction. Drop it.', true];
          if (near(x, sc.Wf * sc.d) || near(x, -sc.Wf * sc.d)) return ['times_d', 'Divide the work by the distance. Do not multiply.'];
          return null;
        },
        right: `F_f = ${fmt(-sc.Wf)} J ÷ ${fmt(sc.d)} m = ${fmt(sc.f)} N`
      };
    },
    // Mastery Check: work done by brakes
    brake(sc) {
      return {
        id: 'brake', sym: 'W_f', unit: 'J', calc: true, target: sc.W, skill: 'net',
        ask: 'The brakes push backward while the cart rolls forward. How much work do the brakes do on the cart?',
        formula: 'W_f = −F_f × d',
        hints: [], needs: { routes: [[sc.f, sc.d]] },
        mistake: x => (near(x, -sc.W) ? ['sign', 'The brake force points against the motion, so its work is negative.'] : near(x, sc.f + sc.d) ? ['added', 'Work is force TIMES distance.'] : null),
        right: `W_f = −F_f × d = −${fmt(sc.f)} N × ${fmt(sc.d)} m = ${fmt(sc.W)} J`
      };
    }
  };
  const STEPS = { revF: ['revF'], carry0: ['carry0'], revH: ['revH'], multi: ['up1', 'up2', 'total'], pull: ['pull'], liftC: ['weight', 'liftW'], lift: ['lift'], net: ['fnet', 'wnet'], angle: ['angle'], fric: ['wf', 'ff'], brake: ['brake'] };
  const stepsOf = sc => STEPS[sc.kind].map(k => P[k](sc));
  const GEN = { revF: revFProblem, carry0: carry0Problem, revH: revHProblem, multi: multiProblem, pull: pullProblem, liftC: () => liftProblem(true), lift: () => liftProblem(false), net: netProblem, angle: angleProblem, fric: fricProblem, brake: brakeProblem };

  window.FLq = { Q, P, STEPS, stepsOf, GEN, pullProblem, liftProblem, netProblem, angleProblem, fricProblem, brakeProblem };
})();

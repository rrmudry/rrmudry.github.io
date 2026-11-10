// Centripetal Force Lab — every number question, built from the student's own table or from a new problem.
// Each question: { id, sym, unit, calc (needs Desmos), own (student's own data: a miss keeps the numbers), ask, formula,
//                  hints, target, rel, abs, needs → { routes, fn, pi }, mistake(v) → [id, msg], right }.

(function () {
  const C = window.FLcore;
  const { fmt, near, round, pick, force } = C;
  const sq = v => v * v;

  // ---------- Questions about the student's own data ----------
  const Q = {
    // CP: a_c for one trial
    ac(row, rig) {
      const a = sq(row.v) / rig.r;
      return {
        id: 'ac', sym: 'a_c', unit: 'm/s²', calc: true, own: true, target: a, skill: 'calc',
        ask: 'Now find a_c for this trial. The speed and the radius are on the picture.',
        formula: 'a_c = v² ÷ r',
        hints: ['Square the speed first. Then divide by the radius.', `In the calculator: ${fmt(row.v)}² ÷ ${fmt(rig.r)}`],
        needs: { routes: [[row.v, rig.r]] },
        mistake: v => {
          if (near(v, row.v / rig.r)) return ['no_square', 'The speed has to be squared: v × v, then divide by r.'];
          if (near(v, sq(row.v) * rig.r)) return ['times_r', 'Divide by the radius. Do not multiply by it.'];
          if (near(v, sq(row.v))) return ['no_divide', 'That is v². Now divide it by the radius.'];
          return ['ac_other', 'Not quite. Use a_c = v² ÷ r with the speed and radius on the picture.'];
        }
      };
    },
    // Honors: speed from the lap timer
    lapSpeed(row, rig) {
      const T = row.t10 / 10, v = (2 * Math.PI * rig.r) / T;
      return {
        id: 'lap', sym: 'v', unit: 'm/s', calc: true, own: true, target: v, rel: 0.015, skill: 'calc',
        ask: 'The timer shows the time for 10 laps. Find the speed of the puck.',
        formula: 'v = 2πr ÷ T',
        hints: ['T is the time for ONE lap: the timer reading ÷ 10.', `One lap is the distance around the circle: 2 × π × ${fmt(rig.r)} m.`],
        needs: { pi: true, routes: [[rig.r, T], [rig.r, row.t10, 10]], from: 'the radius and the timer reading' },
        mistake: x => {
          if (near(x, v / 10)) return ['ten_laps', 'That uses the time for all 10 laps. One lap takes the timer reading ÷ 10.'];
          if (near(x, v / 2)) return ['no_two', 'The distance around is 2 × π × r. You left out the 2.'];
          if (near(x, T / (2 * Math.PI * rig.r), 0.03)) return ['lap_flip', 'That is time ÷ distance. Speed is distance ÷ time.'];
          return ['lap_other', 'Not quite. Distance around the circle (2πr) divided by the time for one lap.'];
        }
      };
    },
    // Conceptual: how many times as big, straight from two rows of the table
    factor(table, mult) {
      const lo = table[0], hi = table[mult === 2 ? 1 : 2], want = mult * mult;
      return {
        id: mult === 2 ? 'factor2' : 'factor3', sym: 'the force is about', noEq: true, unit: 'times as big', own: true, target: want, rel: 0, abs: 0.45, skill: 'pattern',
        ask: `Look at your table. Trial ${mult === 2 ? 2 : 3} was ${mult === 2 ? 'twice' : '3 times'} as fast as Trial 1. About how many times as big is the force?`,
        formula: `Trial 1 force × ? = Trial ${mult === 2 ? 2 : 3} force`,
        hints: [`Try it on the calculator: ${fmt(lo.F)} × 2, then ${fmt(lo.F)} × 3, then ${fmt(lo.F)} × 4, and keep going. Which one lands on ${fmt(hi.F)}?`],
        mistake: v => {
          if (near(v, mult, 0, 0.01)) return ['no_square', `Check your table. ${fmt(lo.F)} N × ${mult} is only ${fmt(lo.F * mult)} N. Your Trial ${mult === 2 ? 2 : 3} force is bigger than that.`];
          if (near(v, hi.F, 0, 0.36)) return ['gave_force', 'That is the force itself. The question is how many TIMES as big it is than Trial 1.'];
          if (near(v, hi.F - lo.F, 0, 0.36)) return ['subtracted', 'That is how much MORE force. "Times as big" asks what you multiply Trial 1 by.'];
          return ['factor_other', `Not yet. What do you multiply ${fmt(lo.F)} N by to get about ${fmt(hi.F)} N?`];
        }
      };
    },
    // Conceptual: the pattern carried to a speed that was never tested
    pfactor(table) {
      return {
        id: 'pfactor', sym: 'the force will be', noEq: true, unit: 'times as big', own: true, target: 4, rel: 0, abs: 0.01, skill: 'pattern',
        ask: `You never tested ${C.TEST_SPEED} m/s. It is twice as fast as Trial 2 (4 m/s). How many times as big will the force be?`,
        formula: 'twice the speed → ? times the force',
        hints: ['You already found this pattern going from Trial 1 to Trial 2.'],
        mistake: v => (near(v, 2, 0, 0.01)
          ? ['no_square', 'Twice the speed did not give twice the force in your table. Look at Trial 1 and Trial 2 again.']
          : ['factor_other', 'Use the pattern from your table: Trial 2 was twice as fast as Trial 1.'])
      };
    },
    predictC(table) {
      const F4 = table[1].F;
      return {
        id: 'predict', sym: 'F', unit: 'N', calc: true, own: true, target: F4 * 4, skill: 'predict',
        ask: `Predict the force at ${C.TEST_SPEED} m/s. Use your Trial 2 force.`,
        formula: 'new force = Trial 2 force × how many times as big',
        hints: ['Your Trial 2 force is in your table.', `In the calculator: ${fmt(F4)} × 4`],
        needs: { routes: [[F4, 4]], from: 'your Trial 2 force' },
        mistake: v => (near(v, F4 * 2)
          ? ['no_square', 'Twice the speed needs 4 times the force, not 2 times.']
          : ['predict_other', 'Multiply your Trial 2 force by how many times as big it will be.'])
      };
    },
    // Slope from two of the student's own plotted points
    slope(p, q, xSym, unit) {
      const s = (q.y - p.y) / (q.x - p.x);
      return {
        id: 'slope', sym: 'slope', unit, calc: true, own: true, target: s, rel: 0.02, abs: 0.002, skill: 'graph',
        ask: 'Find the slope of your line from the two points you picked.',
        formula: `slope = (F₂ − F₁) ÷ (${xSym}₂ − ${xSym}₁)`,
        hints: ['Rise over run: how far up, divided by how far across.', `In the calculator: (${fmt(q.y)} − ${fmt(p.y)}) ÷ (${fmt(q.x)} − ${fmt(p.x)})`],
        needs: { routes: [[p.y, q.y, p.x, q.x]], from: 'both of your points' },
        mistake: v => {
          if (near(v, 1 / s, 0.03)) return ['slope_flip', 'That is run ÷ rise. Slope is rise ÷ run: the F numbers go on top.'];
          if (near(v, q.y - p.y, 0.02)) return ['slope_rise', 'That is only the rise. Divide it by the run.'];
          return ['slope_other', 'Not quite. Subtract the two F values. Subtract the two bottom-axis values in the same order. Then divide.'];
        }
      };
    },
    // Honors: mass from the slope of F against v²
    massFromSlope(slope, rig) {
      return {
        id: 'mass', sym: 'm', unit: 'kg', calc: true, own: true, target: slope * rig.r, rel: 0.02, abs: 0.002, skill: 'graph',
        ask: 'F = (m ÷ r) × v², so your slope is m ÷ r. Find the mass of the puck.',
        formula: 'm = slope × r',
        hints: ['The radius is on the picture.', `In the calculator: ${fmt(round(slope, 3))} × ${fmt(rig.r)}`],
        needs: { routes: [[round(slope, 3), rig.r]], from: 'your slope and the radius' },
        mistake: v => (near(v, slope / rig.r, 0.03)
          ? ['mass_divide', 'slope = m ÷ r, so undo the ÷ r: multiply the slope by r.']
          : ['mass_other', 'Multiply your slope by the radius.'])
      };
    },
    // CP: the formula used on a speed that was never tested
    predictCP(rig) {
      const v = C.TEST_SPEED, F = force(rig.m, v, rig.r);
      return {
        id: 'predict', sym: 'F_net', unit: 'N', calc: true, own: true, target: F, skill: 'predict',
        ask: `You never tested ${v} m/s. Predict the force the string will need.`,
        formula: 'F_net = m × v² ÷ r',
        hints: ['The mass is the one you measured on the scale. The radius is on the picture.', `In the calculator: ${fmt(rig.m)} × ${v}² ÷ ${fmt(rig.r)}`],
        needs: { routes: [[rig.m, v, rig.r], [rig.m, v * v, rig.r], [rig.m, (v * v) / rig.r]], from: 'the mass, the speed and the radius' },
        mistake: x => {
          if (near(x, (rig.m * v) / rig.r)) return ['no_square', 'The speed has to be squared: v × v.'];
          if (near(x, (v * v) / rig.r)) return ['no_mass', 'That is a_c. Multiply it by the mass to get the force.'];
          if (near(x, rig.m * v * v * rig.r)) return ['times_r', 'Divide by the radius. Do not multiply by it.'];
          return ['predict_other', 'Not quite. Mass × speed squared ÷ radius.'];
        }
      };
    },
    // Honors: the speed that takes the string to its limit
    breakSpeed(rig) {
      const v = Math.sqrt((C.DIAL.limit * rig.r) / rig.m);
      return {
        id: 'break', sym: 'v_max', unit: 'm/s', calc: true, own: true, target: v, rel: 0.015, skill: 'predict',
        ask: `The string snaps at ${C.DIAL.limit} N: the red line on the dial. Find the fastest speed it can hold.`,
        formula: 'v_max = √(F_max × r ÷ m)',
        hints: ['Start from F = m × v² ÷ r and get v by itself.', `In the calculator: √(${C.DIAL.limit} × ${fmt(rig.r)} ÷ ${fmt(rig.m)})`],
        needs: { fn: 'sqrt', label: 'square root (√)', routes: [[C.DIAL.limit, rig.r, rig.m]], from: 'the limit, the radius and the mass' },
        mistake: x => {
          if (near(x, v * v)) return ['no_root', 'That is v². Take the square root to get v.'];
          if (near(x, Math.sqrt((C.DIAL.limit * rig.m) / rig.r))) return ['break_flip', 'Multiply by the radius and divide by the mass, not the other way around.'];
          return ['break_other', 'Not quite. Multiply the limit by r, divide by m, then take the square root.'];
        }
      };
    }
  };

  // ---------- New problems (practice and Mastery Check). Plain JSON so they resume with the same numbers. ----------
  const SKINS = {
    rope: { obj: 'ball', m: [0.2, 0.5, 1, 2], r: [0.5, 1, 1.5, 2], v: [2, 3, 4, 5, 6], pull: 'the rope', limit: 'The rope breaks at' },
    car: { obj: 'car', m: [800, 1000, 1200, 1500], r: [40, 50, 80, 100], v: [10, 15, 20], pull: 'friction from the road', limit: 'The most friction the tires can give is' },
    ride: { obj: 'rider', m: [40, 50, 60], r: [4, 5, 8], v: [6, 8, 10], pull: 'the wall of the ride', limit: 'The wall can safely push with' }
  };
  const whole = x => Math.abs(x - Math.round(x)) < 1e-9;
  function fnetProblem(skinId) {
    const skin = skinId || pick(Object.keys(SKINS)), S = SKINS[skin];
    for (let i = 0; i < 200; i++) {
      const m = pick(S.m), r = pick(S.r), v = pick(S.v), F = force(m, v, r);
      if (whole(F * 10)) return { kind: 'fnet', skin, m, r, v, F };
    }
    return { kind: 'fnet', skin: 'car', m: 1000, r: 50, v: 20, F: 8000 };
  }
  function vmaxProblem(skinId) {
    const sc = fnetProblem(skinId || pick(['rope', 'car']));
    return { kind: 'vmax', skin: sc.skin, m: sc.m, r: sc.r, Fmax: sc.F, v: sc.v };
  }
  function compareProblem() {
    const skin = pick(['rope', 'car', 'ride']), big = skin !== 'rope';
    const mult = pick([2, 3]), v1 = pick(big ? [4, 5, 6] : [2, 3]), F1 = pick(big ? [200, 300, 400, 500] : [2, 3, 4, 5, 6]);
    return { kind: 'compare', skin, mult, v1, v2: v1 * mult, F1, factor: mult * mult, F2: F1 * mult * mult };
  }

  const P = {
    fnet(sc) {
      return {
        id: 'fnet', sym: 'F_net', unit: 'N', calc: true, target: sc.F, skill: 'calc',
        ask: `How much net force does the ${SKINS[sc.skin].obj} need to stay on this circle?`,
        formula: 'F_net = m × v² ÷ r',
        hints: ['The mass, speed and radius are on the picture.', `In the calculator: ${fmt(sc.m)} × ${fmt(sc.v)}² ÷ ${fmt(sc.r)}`],
        needs: { routes: [[sc.m, sc.v, sc.r]] },
        mistake: x => {
          if (near(x, (sc.m * sc.v) / sc.r)) return ['no_square', 'The speed has to be squared: v × v.'];
          if (near(x, sq(sc.v) / sc.r)) return ['no_mass', 'That is a_c. Multiply it by the mass to get the force.'];
          if (near(x, sc.m * sq(sc.v) * sc.r)) return ['times_r', 'Divide by the radius. Do not multiply by it.'];
          if (near(x, sc.m * 10)) return ['weight', 'That is the weight (m × g). The force toward the center depends on speed and radius.'];
          return null;
        },
        right: `F_net = m × v² ÷ r = ${fmt(sc.m)} kg × (${fmt(sc.v)} m/s)² ÷ ${fmt(sc.r)} m = ${fmt(sc.F)} N`
      };
    },
    vmax(sc) {
      return {
        id: 'vmax', sym: 'v_max', unit: 'm/s', calc: true, target: sc.v, skill: 'backward',
        ask: `${SKINS[sc.skin].limit} the force on the picture. What is the fastest safe speed?`,
        formula: 'v_max = √(F_max × r ÷ m)',
        hints: ['Start from F = m × v² ÷ r and get v by itself.', `In the calculator: √(${fmt(sc.Fmax)} × ${fmt(sc.r)} ÷ ${fmt(sc.m)})`],
        needs: { fn: 'sqrt', label: 'square root (√)', routes: [[sc.Fmax, sc.r, sc.m]] },
        mistake: x => {
          if (near(x, sq(sc.v))) return ['no_root', 'That is v². Take the square root to get v.'];
          if (near(x, Math.sqrt((sc.Fmax * sc.m) / sc.r))) return ['break_flip', 'Multiply by the radius and divide by the mass, not the other way around.'];
          return null;
        },
        right: `v_max = √(F_max × r ÷ m) = √(${fmt(sc.Fmax)} N × ${fmt(sc.r)} m ÷ ${fmt(sc.m)} kg) = ${fmt(sc.v)} m/s`
      };
    },
    cfactor(sc) {
      return {
        id: 'cfactor', sym: 'the force is', noEq: true, unit: 'times as big', target: sc.factor, rel: 0, abs: 0.01, skill: 'pattern',
        ask: `Same circle, but ${sc.mult === 2 ? 'twice' : '3 times'} as fast. How many times as big is the force it needs?`,
        formula: 'speed counts twice: speed change × speed change',
        hints: [`Compare the two speeds on the picture. The new one is ${sc.mult} times as fast.`, `Speed counts twice: ${sc.mult} × ${sc.mult}.`],
        mistake: v => {
          if (near(v, sc.mult, 0, 0.01)) return ['no_square', `Speed counts twice, just like in your table. ${sc.mult} × ${sc.mult} = ${sc.factor}, not ${sc.mult}.`];
          if (sc.mult === 3 && near(v, 6, 0, 0.01)) return ['added_not_squared', 'That is 3 + 3. Speed counts twice, so multiply: 3 × 3 = 9.'];
          return null;
        },
        right: `times as big = ${sc.mult} × ${sc.mult} = ${sc.factor}`
      };
    },
    cnew(sc) {
      return {
        id: 'cnew', sym: 'new F_net', unit: 'N', calc: true, target: sc.F2, skill: 'pattern',
        ask: 'Now find the new force.',
        formula: 'new F_net = old F_net × how many times as big',
        hints: ['The old force is on the first circle.', `In the calculator: ${fmt(sc.F1)} × ${sc.factor}`],
        needs: { routes: [[sc.F1, sc.factor]] },
        mistake: v => {
          if (near(v, sc.F1 * sc.mult)) return ['no_square', `Speed counts twice. Multiply by ${sc.factor}, not ${sc.mult}.`];
          if (near(v, sc.F1 + sc.factor)) return ['added', 'You added. "Times as big" means multiply.'];
          return null;
        },
        right: `new F_net = old F_net × ${sc.factor} = ${fmt(sc.F1)} N × ${sc.factor} = ${fmt(sc.F2)} N`
      };
    }
  };
  const STEPS = { fnet: ['fnet'], vmax: ['vmax'], compare: ['cfactor', 'cnew'] };
  const stepsOf = sc => STEPS[sc.kind].map(k => P[k](sc));

  window.FLq = { Q, P, SKINS, fnetProblem, vmaxProblem, compareProblem, stepsOf };
})();

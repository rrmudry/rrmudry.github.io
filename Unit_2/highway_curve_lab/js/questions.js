// Highway Curve Lab — every number question, built from the student's own table or from a new problem.
// Each question: { id, sym, unit, calc (needs Desmos), own (student's own data: a miss keeps the numbers), ask, formula,
//                  hints, target, rel, abs, needs → { routes, fn }, mistake(v) → [id, msg], right }.

(function () {
  const C = window.FLcore;
  const { fmt, near, round, pick, G, SURF } = C;
  const sq = v => v * v;
  const row = (table, surf, veh) => table.find(r => r.surf === surf && (!veh || r.veh === veh));

  // ---------- Questions about the student's own data ----------
  const Q = {
    // Conceptual: dry speed compared with icy speed, from the graph. No division: what do you multiply by?
    half(table) {
      const dry = row(table, 'dry', 'car').v, icy = row(table, 'icy', 'car').v;
      return {
        id: 'half', sym: 'dry is', noEq: true, unit: 'times as fast', own: true, target: dry / icy, rel: 0, abs: 0.25, skill: 'pattern',
        ask: 'Look at your car columns. Dry road is how many times as fast as icy road?',
        formula: 'icy speed × ? = dry speed',
        hints: [`Try it: ${fmt(icy)} × 2, then ${fmt(icy)} × 3. Which one lands on ${fmt(dry)}?`],
        mistake: v => {
          if (near(v, dry - icy, 0, 0.3)) return ['subtracted', 'That is how many m/s MORE. "Times as fast" asks what you multiply the icy speed by.'];
          if (near(v, 4, 0, 0.3)) return ['grip_not_speed', `Ice has a quarter of the grip, but check your speeds: ${fmt(icy)} × 4 is ${fmt(icy * 4)}, not ${fmt(dry)}.`];
          return ['factor_other', `Not yet. What do you multiply ${fmt(icy)} m/s by to get ${fmt(dry)} m/s?`];
        }
      };
    },
    // Conceptual: car against truck on dry road
    truckDiff(table) {
      const car = row(table, 'dry', 'car').v, truck = row(table, 'dry', 'truck').v;
      return {
        id: 'truck', sym: 'the truck can go', noEq: true, unit: 'm/s faster', own: true, target: truck - car, rel: 0, abs: 0.5, skill: 'pattern',
        ask: 'On the dry road, how much faster could the heavy truck go than the car?',
        formula: 'truck speed − car speed',
        hints: ['Find the two Dry columns on your graph: the car on the left, the truck on the right.'],
        mistake: v => {
          if (near(v, 4, 0, 0.3) || near(v, 3000, 0, 1)) return ['mass_ratio', 'The truck is 4 times as heavy, but look at the speeds in your table, not the masses.'];
          if (near(v, truck, 0, 0.5)) return ['gave_speed', 'That is the truck speed itself. How much FASTER is it than the car?'];
          return ['truck_other', 'Look at the two Dry points. Are they at different heights?'];
        }
      };
    },
    // Conceptual: the truck on ice, which nobody tested
    predictTruck(table) {
      const icy = row(table, 'icy', 'car').v;
      return {
        id: 'predict', sym: 'v_max', unit: 'm/s', own: true, target: icy, rel: 0, abs: 0.5, skill: 'predict',
        ask: 'You never tested the truck on ice. Predict its fastest safe speed.',
        formula: 'use your graph: car and truck',
        hints: ['On dry and wet roads, how did the truck compare with the car?', 'Your car on ice is in your table.'],
        mistake: v => {
          if (near(v, icy / 4, 0, 0.6) || near(v, icy / 2, 0, 0.6)) return ['heavy_slower', 'On dry and wet roads the truck was not slower than the car. Check your table.'];
          if (near(v, icy * 4, 0, 0.6) || near(v, icy * 2, 0, 0.6)) return ['heavy_faster', 'On dry and wet roads the truck was not faster than the car. Check your table.'];
          return ['predict_other', 'Use your table: compare car and truck on the same road, then look at the car on ice.'];
        }
      };
    },
    // Part 4: how many times as big, from two gauge readings
    factor(F1, F2, mult) {
      const want = F2 / F1;
      return {
        id: 'factor', sym: 'the friction is', noEq: true, unit: 'times as big', own: true, target: want, rel: 0, abs: 0.3, skill: 'pattern',
        ask: `The second run was ${mult === 2 ? 'twice' : `${mult} times`} as fast. How many times as big is the friction it needed?`,
        formula: 'slow friction × ? = fast friction',
        hints: [`Try it: ${fmt(F1)} × 2, then ${fmt(F1)} × 3, then ${fmt(F1)} × 4. Which one lands on ${fmt(F2)}?`],
        mistake: v => {
          if (near(v, mult, 0, 0.01)) return ['no_square', `Check your readings. ${fmt(F1)} kN × ${mult} is only ${fmt(F1 * mult)} kN. The fast run needed more than that.`];
          if (near(v, F2 - F1, 0, 0.2)) return ['subtracted', 'That is how much MORE friction. "Times as big" asks what you multiply by.'];
          return ['factor_other', `What do you multiply ${fmt(F1)} kN by to get ${fmt(F2)} kN?`];
        }
      };
    },
    gripFactor(car, truck) {
      return {
        id: 'grip', sym: 'the truck has', noEq: true, unit: 'times the grip', own: true, target: truck / car, rel: 0, abs: 0.3, skill: 'pattern',
        ask: 'Look at the two red grip limits you read. The truck has how many times the grip of the car?',
        formula: 'car grip limit × ? = truck grip limit',
        hints: [`Try it: ${fmt(car)} × 2, then ${fmt(car)} × 3, then ${fmt(car)} × 4.`],
        mistake: v => (near(v, truck - car, 0, 0.3) ? ['subtracted', 'That is how much MORE. "Times" asks what you multiply by.'] : ['factor_other', `What do you multiply ${fmt(car)} kN by to get ${fmt(truck)} kN?`])
      };
    },
    // CP and Honors: the formula for the fastest safe speed, used on the truck on ice
    vmaxIce(r) {
      const mu = SURF.icy.mu, v = Math.sqrt(mu * G * r);
      return {
        id: 'vmax', sym: 'v_max', unit: 'm/s', calc: true, own: true, target: v, rel: 0.015, skill: 'calc',
        ask: 'Find the truck’s fastest safe speed on ice. μ and r are on the picture.',
        formula: 'v_max = √(μ × g × r)',
        hints: ['g = 10 m/s². The truck’s mass is not in the formula.', `In the calculator: √(${fmt(mu)} × 10 × ${fmt(r)})`],
        needs: { fn: 'sqrt', label: 'square root (√)', routes: [[mu, 10, r], [2, r]], from: 'μ, g and r' },
        mistake: x => {
          if (near(x, mu * G * r)) return ['no_root', 'That is v_max². Take the square root to get v_max.'];
          if (near(x, Math.sqrt(mu * G * r * 4000), 0.02)) return ['used_mass', 'The mass cancels: it is on both sides of μ × m × g = m × v² ÷ r. Leave it out.'];
          if (near(x, Math.sqrt(mu * r))) return ['no_g', 'Multiply by g = 10 m/s² too.'];
          return ['vmax_other', 'Multiply μ × g × r, then take the square root.'];
        }
      };
    },
    // CP: one formula, forward: the truck's grip limit on ice, checked against the red mark they read
    gripMax() {
      const mu = SURF.icy.mu, m = 4000, F = mu * m * G;
      return {
        id: 'gripmax', sym: 'F_max', unit: 'N', calc: true, own: true, target: F, skill: 'calc',
        ask: 'Check the truck’s red grip mark with the formula. μ and m are on the picture.',
        formula: 'F_max = μ × m × g',
        hints: ['g = 10 m/s².', `In the calculator: ${fmt(mu)} × ${m} × 10`],
        needs: { routes: [[mu, m, 10]], from: 'μ, the truck’s mass and g' },
        mistake: x => {
          if (near(x, mu * m)) return ['no_g', 'Multiply by g = 10 m/s² too.'];
          if (near(x, mu * 1000 * G)) return ['car_mass', 'That uses the car’s mass. Use the truck: 4,000 kg.'];
          if (near(x, F / 1000)) return ['kn_not_n', 'That is in kN. The formula gives newtons: 1 kN = 1,000 N.'];
          return ['gripmax_other', 'Multiply μ × m × g.'];
        }
      };
    },
    // CP: friction needed in the inner lane at the outer lane's fastest speed (one formula, forward)
    laneNeed(r, v) {
      const ri = C.innerR(r), F = (1000 * v * v) / ri;
      return {
        id: 'laneneed', sym: 'F', unit: 'N', calc: true, own: true, target: F, skill: 'calc',
        ask: 'How much friction does the car need in the inner lane at this speed?',
        formula: 'F = m × v² ÷ r',
        hints: ['Use the inner lane’s radius. It is on the picture.', `In the calculator: 1000 × ${fmt(v)}² ÷ ${fmt(ri)}`],
        needs: { routes: [[1000, v, ri], [1000, v * v, ri]], from: 'the mass, the speed and the inner lane’s radius' },
        mistake: x => {
          if (near(x, (1000 * v * v) / r)) return ['outer_r', 'That uses the outer lane’s radius. The car is in the inner lane now.'];
          if (near(x, (1000 * v) / ri)) return ['no_square', 'The speed has to be squared: v × v.'];
          if (near(x, F / 1000, 0.03)) return ['kn_not_n', 'That is in kN. The formula gives newtons.'];
          return ['lane_other', 'Mass × speed squared ÷ the inner radius.'];
        }
      };
    },
    // Honors: the inner lane's own fastest safe speed
    laneVmax(r) {
      const ri = C.innerR(r), v = Math.sqrt(SURF.dry.mu * G * ri);
      return {
        id: 'lanevmax', sym: 'v_max', unit: 'm/s', calc: true, own: true, target: v, rel: 0.01, skill: 'calc',
        ask: 'Find the fastest safe speed in the inner lane on this dry road.',
        formula: 'v_max = √(μ × g × r)',
        hints: ['Use the inner lane’s radius. It is on the picture.', `In the calculator: √(0.8 × 10 × ${fmt(ri)})`],
        needs: { fn: 'sqrt', label: 'square root (√)', routes: [[0.8, 10, ri], [8, ri]], from: 'μ, g and the inner radius' },
        mistake: x => (near(x, Math.sqrt(SURF.dry.mu * G * r), 0.005) ? ['outer_r', 'That uses the outer lane’s radius. Use the inner lane.'] : near(x, SURF.dry.mu * G * ri) ? ['no_root', 'That is v_max². Take the square root.'] : ['lane_other', 'Multiply μ × g × the inner radius, then take the square root.'])
      };
    },
    // Honors: v_max² for one trial
    vsq(r) {
      return {
        id: 'vsq', sym: 'v_max²', unit: 'm²/s²', calc: true, own: true, target: sq(r.v), rel: 0.01, abs: 0.06, skill: 'calc',
        ask: 'Now square your fastest safe speed for this road.',
        formula: 'v_max² = v_max × v_max',
        hints: [`In the calculator: ${fmt(r.v)}²`],
        needs: { routes: [[r.v]], from: 'your fastest safe speed' },
        mistake: x => (near(x, 2 * r.v) ? ['doubled', 'That is 2 × v_max. Squared means v_max × v_max.'] : ['vsq_other', 'Multiply your fastest safe speed by itself.'])
      };
    },
    slope(p, q) {
      const s = (q.y - p.y) / (q.x - p.x);
      return {
        id: 'slope', sym: 'slope', unit: 'm²/s²', calc: true, own: true, target: s, rel: 0.02, abs: 0.5, skill: 'graph',
        ask: 'Find the slope of your line from the two points you picked.',
        formula: 'slope = (v_max²₂ − v_max²₁) ÷ (μ₂ − μ₁)',
        hints: ['Rise over run: how far up, divided by how far across.', `In the calculator: (${fmt(q.y)} − ${fmt(p.y)}) ÷ (${fmt(q.x)} − ${fmt(p.x)})`],
        needs: { routes: [[p.y, q.y, p.x, q.x]], from: 'both of your points' },
        mistake: v => {
          if (near(v, 1 / s, 0.03)) return ['slope_flip', 'That is run ÷ rise. Slope is rise ÷ run: the v_max² numbers go on top.'];
          if (near(v, q.y - p.y, 0.02)) return ['slope_rise', 'That is only the rise. Divide it by the run.'];
          return ['slope_other', 'Subtract the two v_max² values. Subtract the two μ values in the same order. Then divide.'];
        }
      };
    },
    radius(slope) {
      return {
        id: 'radius', sym: 'r', unit: 'm', calc: true, own: true, target: slope / G, rel: 0.02, abs: 0.1, skill: 'graph',
        ask: 'v_max² = (g × r) × μ, so your slope is g × r. Find the radius of your curve.',
        formula: 'r = slope ÷ g',
        hints: ['g = 10 m/s².', `In the calculator: ${fmt(round(slope, 1))} ÷ 10`],
        needs: { routes: [[round(slope, 1), 10], [round(slope, 0), 10]], from: 'your slope and g' },
        mistake: v => (near(v, slope * G, 0.03) ? ['radius_times', 'slope = g × r, so undo the × g: divide the slope by 10.'] : ['radius_other', 'Divide your slope by g = 10 m/s².'])
      };
    },
    predictGravel(slope) {
      const mu = SURF.gravel.mu, v = Math.sqrt(slope * mu);
      return {
        id: 'predict', sym: 'v_max', unit: 'm/s', calc: true, own: true, target: v, rel: 0.015, skill: 'predict',
        ask: `You never tested gravel, μ = ${fmt(mu)}. Use your slope to predict its fastest safe speed.`,
        formula: 'v_max = √(slope × μ)',
        hints: ['Your line says v_max² = slope × μ. Then take the square root.', `In the calculator: √(${fmt(round(slope, 1))} × ${fmt(mu)})`],
        needs: { fn: 'sqrt', label: 'square root (√)', routes: [[round(slope, 1), mu], [round(slope, 0), mu]], from: 'your slope and μ' },
        mistake: x => (near(x, slope * mu) ? ['no_root', 'That is v_max². Take the square root.'] : ['predict_other', 'Multiply your slope by μ = 0.4, then take the square root.'])
      };
    },
    // Honors: bank the curve so nothing but the road's push turns the car
    bank(v, r) {
      const th = Math.atan((v * v) / (r * G)) * 180 / Math.PI;
      return {
        id: 'bank', sym: 'θ', unit: '°', calc: true, own: true, target: th, rel: 0.01, abs: 0.2, skill: 'calc',
        ask: `Bank the curve for ${fmt(v)} m/s so a car needs no friction at all. Find the angle.`,
        formula: 'θ = tan⁻¹(v² ÷ (r × g))',
        hints: ['The tan⁻¹ button is on the calculator’s func tab.', `In the calculator: tan⁻¹(${fmt(v)}² ÷ (${fmt(r)} × 10))`],
        needs: { fn: 'atan', label: 'tan⁻¹', routes: [[v, r, 10]], from: 'the speed, r and g' },
        mistake: x => {
          if (near(x, (v * v) / (r * G), 0.02)) return ['no_atan', 'That is tan θ. Use tan⁻¹ to turn it into an angle.'];
          if (near(x, Math.atan(v / (r * G)) * 180 / Math.PI, 0.03)) return ['no_square', 'The speed is squared: v × v.'];
          return ['bank_other', 'Square the speed, divide by r × g, then press tan⁻¹.'];
        }
      };
    }
  };

  // ---------- New problems (Mastery Check). Plain JSON so they resume with the same numbers. ----------
  const MUS = [0.8, 0.7, 0.5, 0.4, 0.3, 0.2];
  function vmaxProblem() {
    for (let i = 0; i < 200; i++) {
      const mu = pick(MUS), r = pick([20, 40, 45, 60, 80, 90, 120, 160]), v = Math.sqrt(mu * G * r);
      if (Math.abs(v * 2 - Math.round(v * 2)) < 1e-9 || i > 150) return { kind: 'vmax', mu, r, v };
    }
    return { kind: 'vmax', mu: 0.8, r: 80, v: Math.sqrt(640) };
  }
  function fmaxProblem() {
    return { kind: 'fmax', mu: pick([0.8, 0.7, 0.5, 0.3, 0.2]), m: pick([800, 1200, 1500, 2000, 3000]) };
  }
  function muProblem() {
    const mu = pick([0.3, 0.4, 0.6, 0.7]), r = pick([40, 60, 90, 160]), v = round(Math.sqrt(mu * G * r), 1);
    return { kind: 'mu', r, v, mu: (v * v) / (G * r) };
  }
  // Day 52 idea: speed counts twice
  function recallProblem() {
    const mult = pick([2, 3]), v1 = pick([8, 10, 12]), F1 = pick([1500, 2000, 2500, 3000]);
    return { kind: 'recall', mult, v1, v2: v1 * mult, F1, factor: mult * mult, F2: F1 * mult * mult };
  }
  const P = {
    vmax(sc) {
      return {
        id: 'q_vmax', sym: 'v_max', unit: 'm/s', calc: true, target: sc.v, skill: 'table', hints: [],
        ask: 'A new off-ramp. Use the table. What is the fastest safe speed?',
        formula: 'v_max = √(μ × g × r)',
        needs: { fn: 'sqrt', label: 'square root (√)', routes: [[sc.mu, 10, sc.r], [sc.mu * 10, sc.r]] },
        mistake: x => {
          if (near(x, sq(sc.v))) return ['no_root', 'That is v_max². Take the square root to get v_max.'];
          if (near(x, Math.sqrt(sc.mu * sc.r))) return ['no_g', 'Multiply by g = 10 m/s² too.'];
          return null;
        },
        right: `v_max = √(μ × g × r) = √(${fmt(sc.mu)} × 10 m/s² × ${fmt(sc.r)} m) = ${fmt(round(sc.v, 2))} m/s`
      };
    },
    fmax(sc) {
      const F = sc.mu * sc.m * G;
      return {
        id: 'q_fmax', sym: 'F_max', unit: 'N', calc: true, target: F, skill: 'table', hints: [],
        ask: 'A new car on a new road. Use the table. What is the most friction the road can give?',
        formula: 'F_max = μ × m × g',
        needs: { routes: [[sc.mu, sc.m, 10]] },
        mistake: x => (near(x, sc.mu * sc.m) ? ['no_g', 'Multiply by g = 10 m/s² too.'] : near(x, sc.m * G) ? ['no_mu', 'Multiply by μ too: the road’s grip.'] : null),
        right: `F_max = μ × m × g = ${fmt(sc.mu)} × ${fmt(sc.m)} kg × 10 m/s² = ${fmt(F)} N`
      };
    },
    mu(sc) {
      return {
        id: 'q_mu', sym: 'μ', unit: '', calc: true, target: sc.mu, rel: 0.02, abs: 0.005, skill: 'table', hints: [],
        ask: 'A car just held on this curve at the speed in the table. How grippy is the road?',
        formula: 'μ = v_max² ÷ (g × r)',
        needs: { routes: [[sc.v, 10, sc.r]] },
        mistake: x => (near(x, sc.v / (G * sc.r), 0.03) ? ['no_square', 'The speed is squared: v × v.'] : near(x, (G * sc.r) / (sc.v * sc.v), 0.03) ? ['flip', 'v_max² goes on top, g × r on the bottom.'] : null),
        right: `μ = v_max² ÷ (g × r) = (${fmt(sc.v)} m/s)² ÷ (10 m/s² × ${fmt(sc.r)} m) = ${fmt(round(sc.mu, 2))}`
      };
    },
    recallFactor(sc) {
      return {
        id: 'q_recall', sym: 'the friction is', noEq: true, unit: 'times as big', target: sc.factor, rel: 0, abs: 0.01, skill: 'recall', hints: [],
        ask: `Same curve, ${sc.mult === 2 ? 'twice' : '3 times'} as fast. How many times as big is the friction it needs?`,
        formula: 'speed change × speed change',
        mistake: v => (near(v, sc.mult, 0, 0.01) ? ['no_square', `Speed counts twice: ${sc.mult} × ${sc.mult} = ${sc.factor}.`] : sc.mult === 3 && near(v, 6, 0, 0.01) ? ['added_not_squared', 'That is 3 + 3. Speed counts twice, so multiply: 3 × 3 = 9.'] : null),
        right: `times as big = ${sc.mult} × ${sc.mult} = ${sc.factor}`
      };
    },
    recallNew(sc) {
      return {
        id: 'q_recall', sym: 'new F', unit: 'N', calc: true, target: sc.F2, skill: 'recall', hints: [],
        ask: `Same curve, ${sc.mult === 2 ? 'twice' : '3 times'} as fast. How much friction does it need now?`,
        formula: 'new F = old F × speed change²',
        needs: { routes: [[sc.F1, sc.factor], [sc.F1, sc.mult]] },
        mistake: v => (near(v, sc.F1 * sc.mult) ? ['no_square', `Speed counts twice. Multiply by ${sc.mult} × ${sc.mult} = ${sc.factor}, not ${sc.mult}.`] : null),
        right: `new F = old F × ${sc.factor} = ${fmt(sc.F1)} N × ${sc.factor} = ${fmt(sc.F2)} N`
      };
    }
  };

  window.FLq = { Q, P, vmaxProblem, fmaxProblem, muProblem, recallProblem };
})();

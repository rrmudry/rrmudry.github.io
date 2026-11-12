// Highway Curve Lab — aiming arrows on the top-down map, naming the force, and the Mastery Check.

(function () {
  const C = window.FLcore, QS = window.FLq;
  const { pick, shuffle, fmt, near, round, G } = C;

  // ---------- Aiming an arrow on the map ----------
  // Angles are degrees, counterclockwise from the right. The car drives counterclockwise around the curve's center.
  // phi = where the car is on the curve (0 = curve start). rot turns the whole map, so a new version looks new.
  const norm = d => ((d % 360) + 540) % 360 - 180;
  const SPOTS = [20, 32, 45, 58, 70];
  const ROTS = [0, 90, 180, 270];
  const AIM_TOL = 18;
  function aimCategory(phi, angle) {
    const off = norm(angle - phi);
    if (Math.abs(norm(off - 180)) <= AIM_TOL) return 'center';
    if (Math.abs(norm(off - 90)) <= AIM_TOL) return 'forward';
    if (Math.abs(off) <= AIM_TOL) return 'outward';
    if (Math.abs(norm(off + 90)) <= AIM_TOL) return 'backward';
    return 'other';
  }
  const AIM_MSG = {
    force: {
      forward: ['force_forward', 'That is the way the car is moving: its velocity. A force that way would speed it up, not turn it.'],
      outward: ['force_outward', 'Nothing pushes the car outward. A force pointing out would bend the path away from the curve.'],
      backward: ['force_backward', 'A force pointing backward would only slow the car down. Something has to turn it.'],
      other: ['force_other', 'Not quite. Think about which way the path keeps bending.']
    },
    path: {
      outward: ['path_outward', 'The car does not fly straight out from the center. With no grip, it keeps going the way it was already moving.'],
      center: ['path_center', 'With no grip, nothing pushes the car toward the center any more.'],
      backward: ['path_backward', 'The car cannot turn around. It keeps going the way it was already moving.'],
      other: ['path_curve', 'Not quite. With no friction to turn it, the car goes in a straight line along the tangent: the line that just touches the curve.']
    }
  };
  function checkAim(what, phi, angle) {
    const cat = aimCategory(phi, angle), want = what === 'force' ? 'center' : 'forward';
    if (cat === want) return { ok: true, cat };
    const hit = AIM_MSG[what][cat] || AIM_MSG[what].other;
    return { ok: false, cat, mistake: hit[0], msg: hit[1] };
  }
  const newSpot = (not = {}) => {
    const spots = [];
    SPOTS.forEach(phi => ROTS.forEach(rot => { if (phi !== not.phi || rot !== not.rot) spots.push({ phi, rot }); }));
    return pick(spots);
  };

  // ---------- Which force turns the car? ----------
  const FORCES = [
    { id: 'friction', t: 'Friction: the grip of the road on the tires' },
    { id: 'normal', t: 'Normal force: the road pushing up' },
    { id: 'gravity', t: 'Weight: the pull of gravity' },
    { id: 'centrifugal', t: 'Centrifugal force: a push outward' }
  ];
  const NAME_WHY = {
    normal: 'The normal force points straight up, off the road. It holds the car up. It does not point toward the center.',
    gravity: 'Weight points straight down. It does not point toward the center.',
    centrifugal: 'There is no outward push. The car only feels thrown outward because it keeps trying to go straight.'
  };
  function checkForceName(id) {
    if (id === 'friction') return { ok: true, msg: 'The road grips the tires and pushes the car sideways, toward the center of the curve. That grip is friction. On ice, the grip is gone and the car goes straight.' };
    return { ok: false, mistake: `name_${id}`, msg: `${NAME_WHY[id]} The arrow toward the center is the one that went away on the ice.` };
  }

  // ---------- Mastery Check: five new situations. Plain JSON so it resumes with the same numbers. ----------
  const QUIZ_SKILLS = { path: 'Path when the grip is gone', force: 'Which way friction points', table: 'Using a table for a new curve', graph: 'Reading a new graph', recall: 'Speed counts twice (Day 52)' };
  function buildQuiz(tier) {
    const a = newSpot(), b = newSpot(a);
    const items = [
      { type: 'path', skill: 'path', phi: a.phi, rot: a.rot },
      { type: 'force', skill: 'force', phi: b.phi, rot: b.rot }
    ];
    if (tier === 'conceptual') items.push({ type: 'table', skill: 'table', kind: 'half', dry: pick([14, 16, 18, 22, 24, 26, 28]) });
    else if (tier === 'cp') items.push({ type: 'table', skill: 'table', kind: 'fmax', sc: QS.fmaxProblem() });
    else items.push({ type: 'table', skill: 'table', kind: 'mu', sc: QS.muProblem() });
    if (tier === 'honors') {
      const r = pick([40, 45, 60, 70]);
      items.push({ type: 'graph', skill: 'graph', kind: 'radius', r, target: r });
    } else {
      const r = pick([40, 45, 60, 80, 90]), mu = pick([0.3, 0.5, 0.6]);
      items.push({ type: 'graph', skill: 'graph', kind: 'cross', r, mu, target: Math.sqrt(mu * G * r) });
    }
    items.push({ type: 'recall', skill: 'recall', sc: QS.recallProblem() });
    return items;
  }

  function quizQuestion(item, tier) {
    if (item.type === 'table' && item.kind === 'half') {
      // Read the pattern, no arithmetic: heavy or light, the same road gives the same fastest safe speed
      return {
        id: 'q_same', sym: 'v_max', unit: 'm/s', target: item.dry / 2, abs: 0.3, skill: 'table', hints: [],
        ask: 'A new off-ramp. One speed is missing. What is the truck’s fastest safe speed on ice?',
        mistake: v => (near(v, item.dry / 8, 0, 0.3) || near(v, item.dry / 4, 0, 0.3) ? ['heavy_slower', 'Look at the dry road: the truck matched the car. Heavy does not change the safe speed.'] : near(v, item.dry, 0, 0.3) ? ['same_speed', 'Ice is much slipperier than dry road. The safe speed drops.'] : null),
        right: `The truck matches the car on the same road: ${fmt(item.dry / 2)} m/s`
      };
    }
    if (item.type === 'table') return QS.P[item.kind](item.sc);
    if (item.type === 'recall') return tier === 'conceptual' ? QS.P.recallFactor(item.sc) : QS.P.recallNew(item.sc);
    if (item.kind === 'cross') {
      return {
        id: 'q_cross', sym: 'v_max', unit: 'm/s', target: item.target, rel: 0, abs: 1.1, skill: 'graph', hints: [],
        ask: 'A different car on a different curve. Use the graph. About how fast can it go before it slides?',
        mistake: v => (near(v, item.mu * G, 0, 0.3) ? ['read_force', 'That is the grip limit, in kN. Find where the curve crosses the dashed line, then go down to the speed.'] : null),
        right: `v_max = about ${fmt(round(item.target, 1))} m/s, where the curve crosses the grip line`
      };
    }
    return {
      id: 'q_radius', sym: 'r', unit: 'm', calc: true, target: item.target, rel: 0.06, abs: 0.5, skill: 'graph', hints: [],
      ask: 'This graph is for a different curve. Find its radius.',
      formula: 'slope = g × r', needs: {},
      mistake: v => (near(v, item.r * G, 0.06) ? ['radius_slope', 'That is the slope, g × r. Divide it by g = 10 m/s².'] : null),
      right: `r = slope ÷ g = ${fmt(item.r * G)} m²/s² ÷ 10 m/s² = ${fmt(item.r)} m`
    };
  }

  function gradeQuizItem(item, ans, tier) {
    const a = ans || {};
    if (item.type === 'path' || item.type === 'force') {
      const what = item.type === 'force' ? 'force' : 'path', phi = item.phi + item.rot;
      const res = typeof a.angle === 'number' ? checkAim(what, phi, a.angle) : { ok: false, mistake: 'blank', msg: 'No arrow was aimed.' };
      const truth = what === 'force'
        ? 'Friction from the road points to the center of the curve. That is what turns the car.'
        : 'With no grip there is no force to turn the car, so it goes in a straight line along the tangent.';
      return { ok: res.ok, mistake: res.mistake, msg: res.ok ? truth : `${res.msg} ${truth}` };
    }
    return C.grade(quizQuestion(item, tier), a.value === undefined ? '' : a.value);
  }
  function gradeQuiz(items, answers, tier) {
    const results = items.map((it, i) => Object.assign({ skill: it.skill }, gradeQuizItem(it, answers[i], tier)));
    const score = results.filter(r => r.ok).length;
    const skills = {};
    // { skill: { right, total } }, the shape the teacher monitor adds up
    results.forEach(r => { const k = skills[r.skill] || (skills[r.skill] = { right: 0, total: 0 }); k.total++; if (r.ok) k.right++; });
    return { results, score, total: items.length, percent: Math.round((score / items.length) * 100), skills, mistakes: results.filter(r => !r.ok && r.mistake).map(r => r.mistake) };
  }
  // The picture behind a graph item
  function quizGraph(item) {
    if (item.kind === 'cross') {
      const k = 1 / item.r;   // a 1000 kg car: friction in kN = v² ÷ r
      return { spec: { x: C.AX.v, y: C.AX.F, box: C.BOX }, curve: k, limits: [{ kN: item.mu * G, label: `grip limit` }] };
    }
    const pts = [0.2, 0.4, 0.6, 0.8].map(mu => ({ x: mu, y: G * item.r * mu }));
    return { spec: { x: C.AX.mu, y: C.AX.vmax2, box: C.BOX }, points: pts, line: [pts[0], pts[3]] };
  }

  window.FL = Object.assign({}, C, QS, { norm, SPOTS, ROTS, AIM_TOL, aimCategory, checkAim, newSpot, FORCES, checkForceName, QUIZ_SKILLS, buildQuiz, quizQuestion, gradeQuizItem, gradeQuiz, quizGraph });
})();

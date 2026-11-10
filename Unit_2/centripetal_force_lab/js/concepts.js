// Centripetal Force Lab — direction questions, the "what does the pulling?" stations, and the Mastery Check.

(function () {
  const C = window.FLcore, QS = window.FLq;
  const { pick, shuffle, fmt, near, round, force } = C;

  // ---------- Aiming an arrow ----------
  // Angles are in degrees, counterclockwise from the right, the way the scene draws them. Everything circles counterclockwise.
  const norm = d => ((d % 360) + 540) % 360 - 180;            // −180 … 180
  const SPOTS = [20, 50, 75, 105, 130, 160, 200, 230, 255, 285, 310, 340];
  const AIM_TOL = 18;
  function aimCategory(phi, angle) {
    const off = norm(angle - phi);                              // 0 = straight out from the center
    if (Math.abs(norm(off - 180)) <= AIM_TOL) return 'center';
    if (Math.abs(norm(off - 90)) <= AIM_TOL) return 'forward';
    if (Math.abs(off) <= AIM_TOL) return 'outward';
    if (Math.abs(norm(off + 90)) <= AIM_TOL) return 'backward';
    return 'other';
  }
  const AIM_MSG = {
    force: {
      forward: ['force_forward', 'That is the way it is moving: its velocity. A net force that way would speed it up, not turn it.'],
      outward: ['force_outward', 'Nothing pushes it outward. A net force pointing out would bend its path away from the circle.'],
      backward: ['force_backward', 'A net force pointing backward would only slow it down. Something has to turn it.'],
      other: ['force_other', 'Not quite. Think about which way the path keeps bending.']
    },
    path: {
      outward: ['path_outward', 'It does not fly straight out from the center. With no pull, it keeps going the way it was already moving.'],
      center: ['path_center', 'With the string gone, nothing pulls it toward the center any more.'],
      backward: ['path_backward', 'It cannot turn around. It keeps going the way it was already moving.'],
      other: ['path_curve', 'Not quite. With no net force it moves in a straight line, along the tangent: the line that just touches the circle.']
    }
  };
  // what = 'force' (answer: toward the center) or 'path' (answer: along the tangent)
  function checkAim(what, phi, angle) {
    const cat = aimCategory(phi, angle), want = what === 'force' ? 'center' : 'forward';
    if (cat === want) return { ok: true, cat };
    const hit = AIM_MSG[what][cat] || AIM_MSG[what].other;
    return { ok: false, cat, mistake: hit[0], msg: hit[1] };
  }
  const newSpot = not => pick(SPOTS.filter(s => s !== not));

  // ---------- Stations: what does the pulling? ----------
  const FORCES = [
    { id: 'tension', t: 'Tension: the pull of a rope, string or wire' },
    { id: 'friction', t: 'Friction: the grip between two surfaces' },
    { id: 'gravity', t: 'Gravity: the pull of a planet' },
    { id: 'normal', t: 'Normal force: the push of a wall or surface' }
  ];
  const test = (id, t, real) => ({ id, t, real: !!real });
  const STATIONS = {
    rope: { title: 'A ball swung on a rope', obj: 'ball', force: 'tension', thing: 'the rope', tests: [test('cut', 'Cut the rope', 1), test('air', 'Take away the air'), test('spin', "Stop the ball's own spin")], why: 'The rope pulls the ball toward the center. The pull of a rope is called tension.' },
    car: { title: 'A car on a flat curve', obj: 'car', force: 'friction', thing: 'the grip of the road', tests: [test('ice', 'Cover the road with ice', 1), test('engine', 'Shift into neutral'), test('air', 'Take away the air')], why: 'The road grips the tires and pushes the car toward the center of the curve. That grip is friction.' },
    moon: { title: 'The Moon going around Earth', obj: 'Moon', force: 'gravity', thing: "Earth's gravity", tests: [test('grav', "Switch off Earth's gravity", 1), test('light', "Block the Sun's light"), test('spin', "Stop the Moon's own spin")], why: "Earth's gravity pulls the Moon toward Earth, the center of its circle." },
    ride: { title: 'A rider on a spinning ride', obj: 'rider', force: 'normal', thing: 'the wall', tests: [test('wall', 'Take away the wall', 1), test('floor', 'Drop the floor'), test('belt', 'Undo the seat belt')], why: 'The wall pushes on the rider, toward the center. The push of a surface is called the normal force.' },
    hammer: { title: 'A hammer-throw ball on a wire', obj: 'ball', force: 'tension', thing: 'the wire', tests: [test('cut', 'Let go of the wire', 1), test('air', 'Take away the air'), test('crowd', 'Send the crowd home')], why: 'The wire pulls the ball toward the thrower. The pull of a wire is tension.' },
    penny: { title: 'A penny riding on a turntable', obj: 'penny', force: 'friction', thing: 'the grip of the turntable', tests: [test('ice', 'Make the turntable slippery', 1), test('air', 'Take away the air'), test('light', 'Turn off the lights')], why: 'The turntable grips the penny and pushes it toward the center. That grip is friction.' },
    sat: { title: 'A satellite going around Earth', obj: 'satellite', force: 'gravity', thing: "Earth's gravity", tests: [test('grav', "Switch off Earth's gravity", 1), test('radio', 'Turn off its radio'), test('light', "Block the Sun's light")], why: "Earth's gravity pulls the satellite toward Earth, the center of its circle." },
    washer: { title: 'A wet sock in a spinning washer', obj: 'sock', force: 'normal', thing: 'the wall of the drum', tests: [test('wall', 'Take away the drum wall', 1), test('water', 'Drain the water'), test('light', 'Turn off the light')], why: 'The drum wall pushes on the sock, toward the center. The push of a surface is the normal force.' }
  };
  const MAIN_STATIONS = ['rope', 'car', 'moon', 'ride'];
  const EXTRA_STATIONS = ['hammer', 'penny', 'sat', 'washer'];
  // After a miss: a station not seen in this streak, pulled by a different force than the last one.
  function nextStation(seen = [], last) {
    const open = EXTRA_STATIONS.concat(MAIN_STATIONS).filter(id => !seen.includes(id) && (!last || STATIONS[id].force !== STATIONS[last].force));
    return pick(open.length ? open : EXTRA_STATIONS.filter(id => id !== last));
  }
  function checkForceName(stationId, forceId) {
    const st = STATIONS[stationId];
    if (forceId === st.force) return { ok: true, msg: st.why };
    const picked = FORCES.find(f => f.id === forceId);
    return { ok: false, mistake: `name_${st.force}`, msg: `Not ${picked ? picked.id === 'normal' ? 'the normal force' : picked.id : 'that'}. Look at what you had to take away to make the ${st.obj} leave: ${st.thing}. ${st.why}` };
  }

  // ---------- Mastery Check: five new situations. Plain JSON so it resumes with the same numbers. ----------
  const QUIZ_SKILLS = { direction: 'Which way the net force points', name: 'Naming the force', path: 'Path when the force is gone', table: 'Using a data table', graph: 'Reading a graph' };
  function buildQuiz(tier) {
    const stations = shuffle(Object.keys(STATIONS));
    const items = [
      { type: 'aim', skill: 'direction', station: stations[0], phi: pick(SPOTS) },
      { type: 'name', skill: 'name', station: stations.find(s => STATIONS[s].force !== STATIONS[stations[0]].force) },
      { type: 'path', skill: 'path', station: pick(['rope', 'hammer']), phi: pick(SPOTS) }
    ];
    if (tier === 'conceptual') {
      const F1 = pick([1.5, 2, 2.5, 3, 4]);
      items.push({ type: 'table', skill: 'table', kind: 'missing', F1, target: F1 * 9 });
      const k = pick([0.5, 0.75, 1, 1.25]), v = pick([4, 6]);
      items.push({ type: 'graph', skill: 'graph', kind: 'read', k, v, target: k * v * v });
    } else if (tier === 'cp') {
      items.push({ type: 'table', skill: 'table', kind: 'fnet', sc: QS.fnetProblem() });
      const m = pick([0.2, 0.25, 0.3, 0.4]);
      items.push({ type: 'graph', skill: 'graph', kind: 'slope', m, target: m });
    } else {
      items.push({ type: 'table', skill: 'table', kind: 'vmax', sc: QS.vmaxProblem() });
      const m = pick([0.2, 0.3, 0.4]), r = pick([0.4, 0.5]);
      items.push({ type: 'graph', skill: 'graph', kind: 'massv2', m, r, target: m });
    }
    return items;
  }

  // The number question behind a table or graph item
  function quizQuestion(item) {
    if (item.type === 'table' && item.kind === 'missing') {
      return {
        id: 'q_missing', sym: 'F', unit: 'N', calc: true, target: item.target, skill: 'table',
        ask: 'One force is missing from this table. Find it.',
        formula: '3 times the speed → ? times the force',
        hints: [], needs: {},
        mistake: v => (near(v, item.F1 * 3) ? ['no_square', '3 times the speed needs 9 times the force, not 3 times.'] : near(v, item.F1 * 4 * 1.5) ? ['no_square', 'Speed counts twice. Compare 6 m/s with 2 m/s: 3 times as fast needs 9 times the force.'] : null),
        right: `F = ${fmt(item.F1)} N × 9 = ${fmt(item.target)} N`
      };
    }
    if (item.type === 'table') return Object.assign(QS.P[item.kind](item.sc), { ask: item.kind === 'fnet' ? 'Use the table. How much net force does it need to stay on the circle?' : 'Use the table. What is the fastest safe speed?', hints: [] });
    if (item.kind === 'read') {
      return {
        id: 'q_read', sym: 'F', unit: 'N', target: item.target, rel: 0, abs: 1.6, skill: 'graph',
        ask: `Use the graph. About how much force is needed at ${item.v} m/s?`, hints: [],
        mistake: v => (near(v, item.v, 0, 0.01) ? ['read_speed', 'That is the speed. Go up from that speed to the curve, then across to the force.'] : null),
        right: `F = about ${fmt(item.target)} N`
      };
    }
    if (item.kind === 'slope') {
      return {
        id: 'q_slope', sym: 'm', unit: 'kg', calc: true, target: item.target, rel: 0.08, abs: 0.005, skill: 'graph',
        ask: 'This graph is for a different puck. Its slope is the mass. Find the mass.',
        formula: 'slope = (F₂ − F₁) ÷ (a_c₂ − a_c₁)', hints: [], needs: {},
        mistake: v => (near(v, 1 / item.m, 0.08) ? ['slope_flip', 'That is run ÷ rise. Slope is rise ÷ run.'] : null),
        right: `m = slope = ${fmt(item.m * 100)} N ÷ 100 m/s² = ${fmt(item.m)} kg`
      };
    }
    return {
      id: 'q_massv2', sym: 'm', unit: 'kg', calc: true, target: item.target, rel: 0.08, abs: 0.005, skill: 'graph',
      ask: 'This graph is for a different puck. The radius is on the graph. Find the mass.',
      formula: 'slope = m ÷ r', hints: [], needs: {},
      mistake: v => (near(v, item.m / item.r, 0.08) ? ['mass_slope_only', 'That is the slope, m ÷ r. Multiply it by the radius to get the mass.'] : near(v, item.m / item.r / item.r, 0.08) ? ['mass_divide', 'Multiply the slope by r. Do not divide.'] : null),
      right: `m = slope × r = ${fmt(round(item.m / item.r, 2))} × ${fmt(item.r)} m = ${fmt(item.m)} kg`
    };
  }

  // answers[i]: { angle } for aim and path, { pick } for name, { value } for table and graph
  function gradeQuizItem(item, ans) {
    const a = ans || {};
    if (item.type === 'aim' || item.type === 'path') {
      const what = item.type === 'aim' ? 'force' : 'path';
      const res = typeof a.angle === 'number' ? checkAim(what, item.phi, a.angle) : { ok: false, mistake: 'blank', msg: 'No arrow was aimed.' };
      const truth = what === 'force'
        ? `The net force points to the center of the circle. ${STATIONS[item.station].why}`
        : 'With the pull gone there is no net force, so it moves in a straight line along the tangent: the way it was already moving.';
      return { ok: res.ok, mistake: res.mistake, msg: res.ok ? truth : `${res.msg} ${truth}` };
    }
    if (item.type === 'name') return a.pick ? checkForceName(item.station, a.pick) : { ok: false, mistake: 'blank', msg: STATIONS[item.station].why };
    return C.grade(quizQuestion(item), a.value === undefined ? '' : a.value);
  }
  function gradeQuiz(items, answers) {
    const results = items.map((it, i) => Object.assign({ skill: it.skill }, gradeQuizItem(it, answers[i])));
    const score = results.filter(r => r.ok).length;
    const skills = {};
    results.forEach(r => { skills[r.skill] = r.ok ? 1 : 0; });
    return { results, score, total: items.length, percent: Math.round((score / items.length) * 100), skills, mistakes: results.filter(r => !r.ok && r.mistake).map(r => r.mistake) };
  }
  // Points for a quiz graph: a curve F = k v², a line F = m a_c, or a line F = (m ÷ r) v²
  function quizGraph(item) {
    if (item.kind === 'read') return { xKey: 'v', points: [1, 2, 3, 4, 5, 6].map(v => ({ x: v, y: item.k * v * v })), curve: true };
    if (item.kind === 'slope') return { xKey: 'a', points: [20, 40, 60, 80, 100].map(a => ({ x: a, y: item.m * a })), line: true };
    return { xKey: 'v2', points: [10, 20, 30, 40, 50].map(x => ({ x, y: (item.m / item.r) * x })), line: true, note: `r = ${fmt(item.r)} m` };
  }

  window.FL = Object.assign({}, C, QS, { norm, SPOTS, AIM_TOL, aimCategory, checkAim, newSpot, FORCES, STATIONS, MAIN_STATIONS, EXTRA_STATIONS, nextStation, checkForceName, QUIZ_SKILLS, buildQuiz, quizQuestion, gradeQuizItem, gradeQuiz, quizGraph });
})();

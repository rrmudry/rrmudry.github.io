// Mechanical Work Studio — the direction check (+W, −W or 0 J) and the Mastery Check.

(function () {
  const C = window.FLcore, QS = window.FLq;
  const { pick, shuffle, fmt, near, round } = C;

  // ---------- Direction check: aim the force, aim the motion, then decide the work ----------
  const DIRS = ['up', 'down', 'left', 'right'];
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const WORD = { up: 'up', down: 'down', left: 'to the left', right: 'to the right', none: 'nowhere: it does not move' };
  // The work a force does, from its direction and the direction of motion
  function categoryOf(F, d) {
    if (d === 'none') return 'zero';
    if (F === d) return 'pos';
    if (OPP[F] === d) return 'neg';
    return 'zero';
  }
  // The three kinds of work a force can do
  const CATS = [{ id: 'pos', t: '+W', short: '+W (positive work)' }, { id: 'zero', t: '0 J', short: '0 J (no work)' }, { id: 'neg', t: '−W', short: '−W (negative work)' }];

  // Every scene: how the object moves (d, and how far, dist in m), the forces we follow (track: each with a work meter),
  // and the full free-body diagram (fbd: [direction, label]). F, force: the first tracked force, used by the Mastery Check.
  const T = (label, dir, mag, desc, tag) => ({ label, dir, mag, desc, tag });
  const sc = (title, obj, d, dist, caption, track, fbd) => ({ title, obj, d, dist, caption, track, fbd, F: track[0].dir, force: track[0].desc });
  const HANDS = "the upward push of the worker's hands";
  const SCENES = {
    push: sc('Pushing a sled', 'sled', 'right', 3, 'The worker pushes the sled to the right across a rough floor.',
      [T('F_push', 'right', 60, "the push of the worker's hands", "worker's push")],
      [['right', 'F_push'], ['left', 'F_f'], ['up', 'F_N'], ['down', 'F_g']]),
    lower: sc('Lowering a crate', 'crate', 'down', 1, 'The worker slowly lowers a crate down to the floor.',
      [T('F_hand', 'up', 100, HANDS, "worker's hands")],
      [['up', 'F_hand'], ['down', 'F_g']]),
    carry: sc('Carrying a box', 'box', 'right', 4, 'The worker carries a box across the room. The box stays at the same height.',
      [T('F_hand', 'up', 50, HANDS, "worker's hands")],
      [['up', 'F_hand'], ['down', 'F_g']]),
    brake: sc('A sled sliding to a stop', 'sled', 'right', 2, 'Nobody pushes. The sled slides to the right on a rough floor and slows down.',
      [T('F_f', 'left', 30, 'friction from the rough floor', 'friction')],
      [['left', 'F_f'], ['up', 'F_N'], ['down', 'F_g']]),
    lift: sc('Lifting a box onto a shelf', 'box', 'up', 1.5, 'The worker lifts a box up onto a high shelf.',
      [T('F_hand', 'up', 50, HANDS, "worker's hands")],
      [['up', 'F_hand'], ['down', 'F_g']]),
    hold: sc('Holding a crate still', 'crate', 'none', 0, 'The worker holds a crate overhead, perfectly still, for 30 seconds.',
      [T('F_hand', 'up', 100, HANDS, "worker's hands")],
      [['up', 'F_hand'], ['down', 'F_g']]),
    pull: sc('Pulling a cart', 'cart', 'left', 3, 'The worker pulls the cart with a rope. It rolls to the left.',
      [T('F_pull', 'left', 40, 'the pull of the rope', 'rope')],
      [['left', 'F_pull'], ['up', 'F_N'], ['down', 'F_g']]),
    stop: sc('Stopping a rolling cart', 'cart', 'left', 2, 'A cart rolls to the left. The worker pushes on it to slow it down.',
      [T('F_push', 'right', 40, "the push of the worker's hands", "worker's push")],
      [['right', 'F_push'], ['up', 'F_N'], ['down', 'F_g']]),
    // Mastery Check only
    forklift: sc('A forklift raising a pallet', 'pallet', 'up', 2, 'The forklift raises a pallet of boxes straight up.',
      [T('F_lift', 'up', 500, 'the upward push of the forks', 'forks')], [['up', 'F_lift'], ['down', 'F_g']]),
    elevator: sc('An elevator going down', 'elevator', 'down', 3, 'The elevator moves down at a steady speed. The cable holds it from above.',
      [T('F_pull', 'up', 800, 'the pull of the cable', 'cable')], [['up', 'F_pull'], ['down', 'F_g']]),
    tray: sc('A server carrying a tray', 'tray', 'left', 4, 'The server walks to the left, carrying a tray at the same height.',
      [T('F_hand', 'up', 10, "the upward push of the server's hand", "server's hand")], [['up', 'F_hand'], ['down', 'F_g']]),
    wall: sc('Pushing on a wall', 'wall', 'none', 0, 'The worker pushes hard on a brick wall for a whole minute. The wall does not move.',
      [T('F_push', 'right', 200, "the push of the worker's hands", "worker's push")], [['right', 'F_push'], ['left', 'F_N']])
  };
  // Four scenes, one force each: +W, −W, and both ways to get 0 J (90° to the motion, and no motion)
  const MAIN_SCENES = ['push', 'lower', 'carry', 'hold'];
  const EXTRA_SCENES = ['lift', 'brake', 'pull', 'stop'];
  const QUIZ_SCENES = { sign: ['forklift', 'elevator'], zero: ['tray', 'wall'] };
  // After a miss: a scene not seen in this streak, preferring one with a different first answer than the last one
  function nextScene(seen = [], last) {
    const lastCat = last ? categoryOf(SCENES[last].F, SCENES[last].d) : null;
    const pool = EXTRA_SCENES.concat(MAIN_SCENES).filter(id => !seen.includes(id));
    const open = pool.filter(id => categoryOf(SCENES[id].F, SCENES[id].d) !== lastCat);
    return pick(open.length ? open : pool.length ? pool : EXTRA_SCENES.filter(id => id !== last));
  }
  // The work each tracked force does over the whole motion, for its meter
  const workOf = (s, t) => { const c = categoryOf(t.dir, s.d); return c === 'pos' ? t.mag * s.dist : c === 'neg' ? -t.mag * s.dist : 0; };

  const RULE = {
    pos: 'points the same way as the motion, so it does positive work (+W).',
    neg: 'points against the motion, so it does negative work (−W). It takes energy away.',
    zero90: 'is at 90° to the motion, so it does no work: 0 J.',
    still: 'pushes, but nothing moves. d = 0 m, so W = 0 J.'
  };
  const ruleOf = (s, t) => { const c = categoryOf(t.dir, s.d); return `${t.label} ${c === 'zero' ? (s.d === 'none' ? RULE.still : RULE.zero90) : RULE[c]}`; };
  const ruleFor = s => ruleOf(s, s.track[0]);
  const mistakeFor = (s, t) => { const c = categoryOf(t.dir, s.d); return c === 'zero' ? (s.d === 'none' ? 'cat_still' : 'cat_90') : c === 'neg' ? 'cat_neg' : 'cat_pos'; };

  // A whole scene. a = { d, arrows: [dir per tracked force], preds: [meter prediction per tracked force] }.
  // Returns one result per tracked force, and the first thing to fix.
  function checkScene(id, a) {
    const s = SCENES[id];
    const results = s.track.map((t, i) => {
      const W = workOf(s, t);
      if (a.arrows[i] !== t.dir) return { ok: false, W, mistake: a.arrows[i] === s.d ? 'dir_force_is_motion' : 'dir_force', msg: `${t.label} is ${t.desc}. It points ${WORD[t.dir]}.` };
      if (a.preds[i] !== categoryOf(t.dir, s.d)) return { ok: false, W, mistake: mistakeFor(s, t), msg: `Your arrow for ${t.label} is right. It ${ruleOf(s, t).slice(t.label.length + 1)}` };
      return { ok: true, W, msg: ruleOf(s, t) };
    });
    if (a.d !== s.d) {
      return { ok: false, results, mistake: s.d === 'none' ? 'dir_motion_none' : 'dir_motion', msg: s.d === 'none' ? `The ${s.obj} does not move at all. With d = 0 m, every meter stays at 0 J.` : `The ${s.obj} moves ${WORD[s.d]}. Every force is compared with that direction.` };
    }
    const bad = results.find(r => !r.ok);
    return bad ? { ok: false, results, mistake: bad.mistake, msg: bad.msg } : { ok: true, results, msg: results.map(r => r.msg).join(' ') };
  }
  // The student predicts the work of each force; the motion and the force direction are shown on the picture
  const checkPreds = (id, preds) => { const s = SCENES[id]; return checkScene(id, { d: s.d, arrows: s.track.map(t => t.dir), preds }); };
  // The Mastery Check asks about one force. a = { F, d, cat }.
  function checkDir(id, a) {
    const r = checkScene(id, { d: a.d, arrows: [a.F], preds: [a.cat] });
    return r.ok ? { ok: true, msg: ruleFor(SCENES[id]) } : { ok: false, mistake: r.mistake, msg: `${r.msg} ${r.mistake.startsWith('cat_') ? '' : ruleFor(SCENES[id])}`.trim() };
  }

  // ---------- Mastery Check: new situations. Plain JSON so it resumes with the same numbers. ----------
  const QUIZ_SKILLS = { sign: 'Sign of work (+W or −W)', zero: 'When work is 0 J', calc: 'Calculating work', graph: 'Reading a W against d graph', net: 'Negative and net work' };
  function buildQuiz(tier) {
    const items = [
      { type: 'dir', skill: 'sign', scene: pick(QUIZ_SCENES.sign) },
      { type: 'dir', skill: 'zero', scene: pick(QUIZ_SCENES.zero) }
    ];
    if (tier === 'honors') items.push({ type: 'calc', skill: 'calc', sc: QS.angleProblem() });
    else items.push({ type: 'calc', skill: 'calc', sc: QS.liftProblem(false) });
    const F = pick([15, 20, 25, 30, 35, 40]);
    if (tier === 'conceptual') items.push({ type: 'graph', skill: 'graph', kind: 'read', F, x: pick([2.5, 3.5, 4.5]) });
    else if (tier === 'cp') items.push({ type: 'graph', skill: 'graph', kind: 'slope', F });
    else items.push({ type: 'graph', skill: 'graph', kind: 'tension', F, th: pick([37, 53, 60]) });
    items.push(tier === 'conceptual' ? { type: 'calc', skill: 'net', sc: QS.brakeProblem() } : { type: 'calc', skill: 'net', sc: Object.assign(QS.netProblem(), { one: true }) });
    return shuffle(items.slice(0, 2)).concat(items.slice(2));
  }
  // Points for a quiz graph: a line W = slope × d
  function quizGraph(item) {
    const slope = item.kind === 'tension' ? item.F * Math.cos(item.th * Math.PI / 180) : item.F;
    return { slope, points: [1, 2, 3, 4, 5, 6].map(x => ({ x, y: round(slope * x, 1) })) };
  }

  // The number question behind a calc or graph item
  function quizQuestion(item) {
    if (item.type === 'calc') {
      const sc = item.sc;
      if (sc.kind === 'net') return QS.P.wnet1(sc);
      const q = QS.P[sc.kind](sc);
      return Object.assign(q, { hints: [] });
    }
    const g = quizGraph(item);
    if (item.kind === 'read') {
      const W = item.F * item.x;
      return {
        id: 'q_read', sym: 'W', unit: 'J', target: W, rel: 0, abs: Math.max(3, C.specFor(item.F).y.max * 0.03), skill: 'graph',
        ask: `This graph is for a different crate. Use it: about how much work does a ${fmt(item.x)} m pull take?`, hints: [],
        mistake: v => (near(v, item.x, 0, 0.01) ? ['read_gave_d', 'That is the distance. Go up from that distance to the line, then across to the work.'] : null),
        right: `W = about ${fmt(W)} J`
      };
    }
    if (item.kind === 'slope') {
      return {
        id: 'q_slope', sym: 'F', unit: 'N', calc: true, target: item.F, rel: 0.05, abs: 0.3, skill: 'graph',
        ask: 'This graph is for a different crate. What force pulled it?', formula: 'F = slope = (W₂ − W₁) ÷ (d₂ − d₁)', hints: [], needs: {},
        mistake: v => (near(v, 1 / item.F, 0.08) ? ['slope_flip', 'That is run ÷ rise. Slope is rise ÷ run.'] : null),
        right: `F = slope = ${fmt(item.F * 4)} J ÷ 4 m = ${fmt(item.F)} N`
      };
    }
    return {
      id: 'q_tension', sym: 'F', unit: 'N', calc: true, target: item.F, rel: 0.04, abs: 0.3, skill: 'graph',
      ask: 'This graph is for a crate pulled by a rope at the angle shown. What did the spring scale on the rope read?', formula: 'slope = F × cos θ', hints: [], needs: { fn: 'cos', label: 'cos' },
      mistake: v => (near(v, g.slope, 0.04) ? ['tension_slope_only', 'That is the slope: only the part along the track. Divide it by cos θ to get the whole pull.'] : near(v, g.slope * Math.cos(item.th * Math.PI / 180), 0.04) ? ['cos_times', 'Divide the slope by cos θ. Do not multiply.'] : null),
      right: `F = slope ÷ cos θ = ${fmt(round(g.slope, 1))} N ÷ cos ${item.th}° = ${fmt(item.F)} N`
    };
  }

  // answers[i]: { F, d, cat } for dir, { value, work } for calc and graph
  function gradeQuizItem(item, ans) {
    const a = ans || {};
    if (item.type === 'dir') {
      if (!a.cat) return { ok: false, mistake: 'blank', msg: `No answer was given. ${ruleFor(SCENES[item.scene])}` };
      const s0 = SCENES[item.scene], r = checkDir(item.scene, { F: s0.F, d: s0.d, cat: a.cat });
      return r.ok ? r : { ok: false, mistake: r.mistake, msg: `${SCENES[item.scene].title}: ${r.msg}` };
    }
    return C.grade(quizQuestion(item), a.value === undefined ? '' : a.value);
  }
  function gradeQuiz(items, answers) {
    const results = items.map((it, i) => Object.assign({ skill: it.skill }, gradeQuizItem(it, answers[i])));
    const score = results.filter(r => r.ok).length;
    const skills = {};
    results.forEach(r => { skills[r.skill] = r.ok ? 1 : 0; });
    return { results, score, total: items.length, percent: Math.round((score / items.length) * 100), skills, mistakes: results.filter(r => !r.ok && r.mistake).map(r => r.mistake) };
  }

  window.FL = Object.assign({}, C, QS, {
    DIRS, OPP, WORD, categoryOf, CATS, SCENES, MAIN_SCENES, EXTRA_SCENES, QUIZ_SCENES, nextScene, workOf, ruleOf, ruleFor, checkScene, checkPreds, checkDir,
    QUIZ_SKILLS, buildQuiz, quizGraph, quizQuestion, gradeQuizItem, gradeQuiz
  });
})();

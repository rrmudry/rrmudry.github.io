// Vector Decomposition Studio — Physics, scenario generators, answer checking, diagnostics, quiz builder
// Angle θ is measured up from the ground unless a scenario says fromVertical.
// Every wrong answer is compared against known mistakes so the student hears WHY, not just "wrong".
// Questions are plain JSON so an unfinished Mastery Check can be saved and resumed with the same numbers.

(function () {
  const rad = d => d * Math.PI / 180;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const Phys = {
    vx: (v0, th) => v0 * Math.cos(rad(th)),
    vy: (v0, th) => v0 * Math.sin(rad(th)),
    speed: (x, y) => Math.hypot(x, y),
    angle: (x, y) => Math.atan2(y, x) * 180 / Math.PI
  };

  function fmt(v, d) {
    const s = Number(v).toFixed(d);
    return /^-0\.?0*$/.test(s) ? s.slice(1) : s;
  }
  // Answers students compute: 1 decimal, 2 when small
  const fmtAns = v => fmt(v, Math.abs(v) < 10 ? 2 : 1);

  const near = (v, target, rel = 0.02, abs = 0.1) => Math.abs(v - target) <= Math.max(Math.abs(target) * rel, abs);

  function parseNum(raw) {
    const v = parseFloat(String(raw).replace(',', '.').replace(/[−–]/g, '-').replace(/[^0-9.\-eE]/g, ''));
    return isFinite(v) ? v : null;
  }

  // ---------- Scenario contexts: the words never contain the numbers (those live on the picture) ----------
  const THINGS = [
    { icon: '⚽', name: 'soccer ball', verb: 'is kicked' },
    { icon: '🏀', name: 'basketball', verb: 'is shot' },
    { icon: '🏈', name: 'football', verb: 'is punted' },
    { icon: '⛳', name: 'golf ball', verb: 'is hit' },
    { icon: '🎾', name: 'tennis ball', verb: 'is lobbed' },
    { icon: '🐸', name: 'frog', verb: 'jumps' },
    { icon: '💣', name: 'cannonball', verb: 'is fired' },
    { icon: '🚀', name: 'toy rocket', verb: 'is launched' }
  ];

  // No angles close to 45° in calculations: sin and cos must give clearly different answers.
  const EASY_ANGLES = [30, 60];
  const ALL_ANGLES = [15, 20, 25, 30, 35, 37, 40, 50, 53, 55, 60, 65, 70, 75];
  const FIVE_ANGLES = [20, 25, 30, 35, 40, 50, 55, 60, 65, 70];
  const EASY_SPEEDS = [10, 20, 30, 40];
  const ALL_SPEEDS = [12, 14, 15, 16, 18, 20, 22, 24, 25, 26, 28, 30, 32, 35, 36, 40, 45, 50];

  function launch(level = 2, not) {
    let sc;
    do {
      sc = {
        v0: pick(level <= 1 ? EASY_SPEEDS : ALL_SPEEDS),
        th: pick(level <= 1 ? EASY_ANGLES : level === 'five' ? FIVE_ANGLES : ALL_ANGLES),
        thing: Math.floor(Math.random() * THINGS.length)
      };
    } while (not && not.v0 === sc.v0 && not.th === sc.th);
    sc.x = Phys.vx(sc.v0, sc.th);
    sc.y = Phys.vy(sc.v0, sc.th);
    return sc;
  }

  // Whole-number arrows that land exactly on grid corners, for reading squares with no trig
  const TRIPLES = [[8, 6], [6, 8], [12, 5], [5, 12], [12, 9], [9, 12], [15, 8], [8, 15], [4, 3], [3, 4], [16, 12], [12, 16]];
  function gridArrow(scales = [1], not) {
    let sc;
    do {
      const [gx, gy] = pick(TRIPLES);
      const scale = pick(scales);
      sc = { gx, gy, scale, x: gx * scale, y: gy * scale, v0: Math.hypot(gx, gy) * scale, thing: Math.floor(Math.random() * THINGS.length) };
    } while (not && not.gx === sc.gx && not.gy === sc.gy && not.scale === sc.scale);
    sc.th = Phys.angle(sc.x, sc.y);
    return sc;
  }

  // ---------- Worked solutions ----------
  const fn = asked => asked === 'x' ? 'cos' : 'sin';
  const sym = asked => asked === 'x' ? 'v_0x' : 'v_0y';
  const work = (asked, sc) =>
    `${sym(asked)} = v_0 × ${fn(asked)}(θ) = ${sc.v0} m/s × ${fn(asked)}(${sc.th}°) = ${fmtAns(asked === 'x' ? sc.x : sc.y)} m/s`;

  // ---------- Diagnostics: [id, test(v, sc), message(sc)] — first match wins. Ids feed the teacher monitor. ----------
  function calcMistakes(asked) {
    const f = asked === 'x' ? Math.cos : Math.sin;
    const part = asked === 'x' ? 'sideways' : 'upward';
    const other = asked === 'x' ? 'upward' : 'sideways';
    const value = sc => f(rad(sc.th));
    return [
      ['swap', (v, s) => near(v, asked === 'x' ? s.y : s.x),
        () => `You found the ${other} part. The ${part} part is the side that ${asked === 'x' ? 'touches' : 'is across from'} θ, so it uses ${fn(asked)}.`],
      ['radians', (v, s) => near(v, s.v0 * f(s.th)) || near(v, f(s.th)),
        () => `Your calculator is in radian mode. Switch it to degrees (DEG) and try again.`],
      ['no_speed', (v, s) => near(v, value(s), 0.03, 0.01),
        s => `${fn(asked)}(${s.th}°) only tells how much of the speed, as a decimal. Multiply it by v_0 to get m/s.`],
      ['divided', (v, s) => near(v, s.v0 / value(s)),
        () => `You divided. A part can never be bigger than the whole speed. Multiply v_0 by the decimal.`],
      ['tan', (v, s) => near(v, s.v0 * Math.tan(rad(s.th))),
        () => `That is tangent. Use sin or cos, because v_0 is the long side (the hypotenuse) of the triangle.`],
      ['no_trig', (v, s) => near(v, s.v0 * s.th),
        () => `You multiplied by the angle itself. Multiply by ${fn(asked)} of the angle.`],
      ['added', (v, s) => near(v, s.v0 + value(s)),
        () => `You added. Multiply the speed by the decimal: v_0 × ${fn(asked)}(θ).`],
      ['whole_speed', (v, s) => near(v, s.v0),
        () => `That is the whole launch speed v_0. Only part of it goes ${asked === 'x' ? 'sideways' : 'up'}.`],
      ['angle_read', (v, s) => near(v, s.th),
        () => `That is the angle. The answer is a speed in m/s. Use v_0 × ${fn(asked)}(θ).`],
      ['decimal', (v, s) => { const t = asked === 'x' ? s.x : s.y; return near(v, t * 10) || near(v, t / 10); },
        () => `Your digits are right but the decimal point moved. Check your typing.`]
    ];
  }

  // Check a calculated component. Returns { ok, msg, mistake }.
  function checkCalc(asked, raw, sc) {
    const v = parseNum(raw);
    if (v === null) return { ok: null, msg: 'Type a number first.' };
    const target = asked === 'x' ? sc.x : sc.y;
    if (near(v, target)) return { ok: true, msg: `<span class="formula">${work(asked, sc)}</span>` };
    const hit = calcMistakes(asked).find(([, test]) => test(v, sc));
    const why = hit ? hit[2](sc) : 'Not quite. Check each step: which function, then multiply by v_0.';
    return {
      ok: false,
      mistake: hit ? hit[0] : 'other',
      msg: `${why}<br><span class="worked">The right way: <span class="formula">${work(asked, sc)}</span></span>`
    };
  }

  // ---------- Mastery Check questions ----------
  // Each is plain JSON: { kind, skill, sc, asked?, order? }. QUESTION[kind] knows how to show and grade it.
  const SKILLS = {
    read: { label: 'Read parts off a grid' },
    concept: { label: 'Angle and the parts' },
    choose: { label: 'Choose sin or cos' },
    calc_x: { label: 'Calculate v_0x' },
    calc_y: { label: 'Calculate v_0y' },
    sense: { label: 'Does the answer make sense?' },
    honors: { label: 'Honors challenges' }
  };

  function shuffled(n) {
    const a = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const QUESTION = {
    // Read one part off a grid (the scale changes, so students must read the key)
    read: {
      make: () => ({ kind: 'read', skill: 'read', asked: pick(['x', 'y']), sc: gridArrow([1, 2, 5]) }),
      type: 'num',
      text: q => `Use the grid. Read the scale first. How fast is the ${q.asked === 'x' ? 'sideways' : 'upward'} part, ${sym(q.asked)}?`,
      scene: q => ({ mode: 'grid', sc: q.sc, showArrow: true, showX: q.asked === 'x', showY: q.asked === 'y', keyLabel: true }),
      unit: 'm/s',
      grade: (q, raw) => {
        const v = parseNum(raw);
        const t = q.asked === 'x' ? q.sc.x : q.sc.y;
        if (v === null) return { ok: false, msg: `No answer. ${sym(q.asked)} = ${t} m/s.`, mistake: 'blank' };
        if (near(v, t, 0, 0.01)) return { ok: true, msg: `${sym(q.asked)} = ${t} m/s.` };
        const squares = q.asked === 'x' ? q.sc.gx : q.sc.gy;
        if (near(v, squares, 0, 0.01) && q.sc.scale !== 1) {
          return { ok: false, mistake: 'scale', msg: `You counted ${squares} squares, but each square is worth ${q.sc.scale} m/s here. ${squares} × ${q.sc.scale} = ${t} m/s.` };
        }
        if (near(v, q.asked === 'x' ? q.sc.y : q.sc.x, 0, 0.01)) {
          return { ok: false, mistake: 'swap', msg: `You read the other part. ${q.asked === 'x' ? 'Sideways is along the ground' : 'Upward is the height of the tip'}. ${sym(q.asked)} = ${t} m/s.` };
        }
        return { ok: false, mistake: 'read', msg: `Count squares, then multiply by the scale. ${sym(q.asked)} = ${t} m/s.` };
      }
    },

    // Which part is bigger at this angle?
    concept: {
      make: () => {
        const th = pick([15, 20, 30, 45, 60, 70, 75]);
        return { kind: 'concept', skill: 'concept', sc: { v0: pick([20, 30, 40]), th, thing: Math.floor(Math.random() * THINGS.length) }, order: shuffled(3) };
      },
      type: 'mc',
      text: () => 'Look at the launch angle. Which part of the launch velocity is bigger?',
      scene: q => ({ mode: 'scene', sc: q.sc, showX: false, showY: false, labelV0: false }),
      options: () => [{ t: 'The sideways part, v_0x', id: 'x' }, { t: 'The upward part, v_0y', id: 'y' }, { t: 'They are equal', id: 'eq' }],
      grade: (q, id) => {
        const right = q.sc.th === 45 ? 'eq' : q.sc.th < 45 ? 'x' : 'y';
        const why = q.sc.th === 45 ? 'At 45° the speed splits evenly.' : q.sc.th < 45 ? 'A low angle aims mostly sideways, so v_0x is bigger.' : 'A steep angle aims mostly up, so v_0y is bigger.';
        return { ok: id === right, msg: why, mistake: id === right ? null : 'angle_concept' };
      }
    },

    // Pick the correct setup from symbols
    choose: {
      make: () => ({ kind: 'choose', skill: 'choose', asked: pick(['x', 'y']), sc: launch(2), order: shuffled(4) }),
      type: 'mc',
      text: q => `Which setup finds the part marked with "?" in the picture?`,
      scene: q => ({ mode: 'scene', sc: q.sc, showX: q.asked === 'x', showY: q.asked === 'y', mark: q.asked }),
      options: () => [
        { t: 'v_0 × cos(θ)', id: 'x', formula: true }, { t: 'v_0 × sin(θ)', id: 'y', formula: true },
        { t: 'v_0 ÷ cos(θ)', id: 'dc', formula: true }, { t: 'v_0 × tan(θ)', id: 't', formula: true }
      ],
      grade: (q, id) => {
        const ok = id === q.asked;
        return {
          ok,
          mistake: ok ? null : (id === 'x' || id === 'y') ? 'swap' : id === 't' ? 'tan' : 'divided',
          msg: q.asked === 'x' ? 'The sideways side touches θ (adjacent), so it uses cos.' : 'The upward side is across from θ (opposite), so it uses sin.'
        };
      }
    },

    calc_x: {
      make: () => ({ kind: 'calc_x', skill: 'calc_x', asked: 'x', sc: launch(2) }),
      type: 'num',
      text: q => `A ${THINGS[q.sc.thing].name} ${THINGS[q.sc.thing].verb}. Use the picture to find the sideways part, v_0x.`,
      scene: q => ({ mode: 'scene', sc: q.sc, showX: true, showY: false, mark: 'x' }),
      unit: 'm/s',
      needs: q => ({ trig: true, nums: [q.sc.v0, q.sc.th] }),
      grade: (q, raw) => gradeCalc('x', raw, q.sc)
    },

    calc_y: {
      make: () => ({ kind: 'calc_y', skill: 'calc_y', asked: 'y', sc: launch(2) }),
      type: 'num',
      text: q => `A ${THINGS[q.sc.thing].name} ${THINGS[q.sc.thing].verb}. Use the picture to find the upward part, v_0y.`,
      scene: q => ({ mode: 'scene', sc: q.sc, showX: false, showY: true, mark: 'y' }),
      unit: 'm/s',
      needs: q => ({ trig: true, nums: [q.sc.v0, q.sc.th] }),
      grade: (q, raw) => gradeCalc('y', raw, q.sc)
    },

    // A claimed answer: possible or not, and why?
    sense: {
      make: () => {
        const sc = launch(2);
        const bad = Math.random() < 0.5;
        const asked = pick(['x', 'y']);
        // Bad claims are bigger than the launch speed, a mistake students can catch without a calculator
        const claim = bad ? Math.round(sc.v0 * pick([1.2, 1.4, 1.5])) : Math.round(asked === 'x' ? sc.x : sc.y);
        return { kind: 'sense', skill: 'sense', asked, sc, claim, bad, order: shuffled(3) };
      },
      type: 'mc',
      text: q => `A student says the ${q.asked === 'x' ? 'sideways' : 'upward'} part of this launch is ${q.claim} m/s. Without calculating, could that be right?`,
      scene: q => ({ mode: 'scene', sc: q.sc, showX: q.asked === 'x', showY: q.asked === 'y', mark: q.asked }),
      options: () => [
        { t: 'No. A part cannot be bigger than the launch speed.', id: 'no' },
        { t: 'Yes. It could be right, because it is smaller than the launch speed.', id: 'yes' },
        { t: 'Yes. Parts are always bigger than the launch speed.', id: 'bigger' }
      ],
      grade: (q, id) => {
        const right = q.bad ? 'no' : 'yes';
        return {
          ok: id === right,
          mistake: id === right ? null : 'part_bigger',
          msg: q.bad ? `v_0 is the long side of the triangle, so each part must be smaller than ${q.sc.v0} m/s.` : `${q.claim} m/s is smaller than ${q.sc.v0} m/s, so it passes the check.`
        };
      }
    },

    // ---------- Honors (Period 0 only) ----------
    h_vertical: {
      make: () => ({ kind: 'h_vertical', skill: 'honors', asked: pick(['x', 'y']), sc: Object.assign(launch(2), {}) }),
      type: 'num',
      text: q => `Careful: this angle is measured from the vertical, not the ground. Find ${sym(q.asked)}.`,
      hints: () => ['Look at which side touches the marked angle. Here it is the upward side.', 'The side that touches the angle uses cos. The side across from it uses sin.'],
      scene: q => ({ mode: 'scene', sc: q.sc, showX: q.asked === 'x', showY: q.asked === 'y', mark: q.asked, fromVertical: true }),
      unit: 'm/s',
      needs: q => ({ trig: true, nums: [q.sc.v0, 90 - q.sc.th] }),
      // sc.th is the angle from the GROUND; the picture shows 90° − th from the vertical.
      grade: (q, raw) => {
        const v = parseNum(raw);
        const t = q.asked === 'x' ? q.sc.x : q.sc.y;
        const shown = 90 - q.sc.th;
        const right = `${sym(q.asked)} = ${q.sc.v0} m/s × ${q.asked === 'x' ? 'sin' : 'cos'}(${shown}°) = ${fmtAns(t)} m/s`;
        if (v !== null && near(v, t)) return { ok: true, msg: `<span class="formula">${right}</span>` };
        const flipped = v !== null && near(v, q.asked === 'x' ? q.sc.y : q.sc.x);
        return {
          ok: false,
          mistake: flipped ? 'vertical_angle' : 'other',
          msg: `${flipped ? `You used the ground rule. Here the UPWARD side touches the angle, so cos goes with v_0y and sin goes with v_0x.<br>` : ''}<span class="worked">The right way: <span class="formula">${right}</span></span>`
        };
      }
    },

    h_down: {
      make: () => ({ kind: 'h_down', skill: 'honors', asked: 'y', sc: launch(2) }),
      type: 'num',
      text: () => 'This launch aims BELOW the horizontal. Up is positive and down is negative. Calculate how fast the vertical part is. Then choose its direction.',
      signed: true,
      hints: () => ['Use v_0 × sin(θ) in the calculator. You do not need a minus sign there.', 'Look at the arrow. Which way does the vertical part point? Choose Up or Down.'],
      scene: q => ({ mode: 'scene', sc: q.sc, showX: false, showY: true, mark: 'y', downward: true }),
      unit: 'm/s',
      needs: q => ({ trig: true, nums: [q.sc.v0, q.sc.th] }),
      grade: (q, raw) => {
        const v = parseNum(raw);
        const t = -q.sc.y;
        const right = `v_0y = −(${q.sc.v0} m/s × sin(${q.sc.th}°)) = ${fmtAns(t).replace('-', '−')} m/s`;
        if (v !== null && near(v, t)) return { ok: true, msg: `<span class="formula">${right}</span>` };
        const noSign = v !== null && near(v, q.sc.y);
        return { ok: false, mistake: noSign ? 'sign' : 'other', msg: `${noSign ? 'Right size, wrong sign. Downward is negative.<br>' : ''}<span class="worked">The right way: <span class="formula">${right}</span></span>` };
      }
    },

    h_speed: {
      make: () => ({ kind: 'h_speed', skill: 'honors', sc: gridArrow([1, 2]) }),
      type: 'num',
      text: () => 'Work backward. Read both parts off the grid, then find the launch speed v_0.',
      hints: () => ['The parts are at a right angle, so use the Pythagorean theorem.', 'On the calculator: press the √ button. Inside it, type the first part, press a², press +, type the second part, press a².'],
      scene: q => ({ mode: 'grid', sc: q.sc, showArrow: true, showX: true, showY: true, keyLabel: true }),
      unit: 'm/s',
      needs: q => ({ fn: 'sqrt', nums: [q.sc.x, q.sc.y] }),
      grade: (q, raw) => {
        const v = parseNum(raw);
        const right = `v_0 = √(v_0x² + v_0y²) = √(${q.sc.x}² + ${q.sc.y}²) = ${fmtAns(q.sc.v0)} m/s`;
        if (v !== null && near(v, q.sc.v0)) return { ok: true, msg: `<span class="formula">${right}</span>` };
        const added = v !== null && near(v, q.sc.x + q.sc.y);
        return { ok: false, mistake: added ? 'added_parts' : 'other', msg: `${added ? 'You added the parts. They are at a right angle, so use the Pythagorean theorem.<br>' : ''}<span class="worked">The right way: <span class="formula">${right}</span></span>` };
      }
    },

    h_angle: {
      make: () => ({ kind: 'h_angle', skill: 'honors', sc: gridArrow([1, 2]) }),
      type: 'num',
      text: () => 'Work backward. Read both parts off the grid, then find the launch angle θ above the ground.',
      hints: () => ['Use θ = tan⁻¹(v_0y ÷ v_0x).', 'The tan⁻¹ button is on the calculator\'s func tab. Press func, then tan⁻¹.', 'Press main to get the numbers back. Type the upward part, press ÷, then type the sideways part.'],
      scene: q => ({ mode: 'grid', sc: q.sc, showArrow: true, showX: true, showY: true, keyLabel: true }),
      unit: '°',
      needs: q => ({ fn: 'atan', nums: [q.sc.x, q.sc.y] }),
      grade: (q, raw) => {
        const v = parseNum(raw);
        const right = `θ = tan⁻¹(v_0y ÷ v_0x) = tan⁻¹(${q.sc.y} ÷ ${q.sc.x}) = ${fmt(q.sc.th, 1)}°`;
        if (v !== null && Math.abs(v - q.sc.th) <= 1) return { ok: true, msg: `<span class="formula">${right}</span>` };
        const flipped = v !== null && Math.abs(v - (90 - q.sc.th)) <= 1;
        return { ok: false, mistake: flipped ? 'vertical_angle' : 'other', msg: `${flipped ? 'That angle is from the vertical. Divide up by sideways.<br>' : ''}<span class="worked">The right way: <span class="formula">${right}</span></span>` };
      }
    },

    h_back: {
      make: () => ({ kind: 'h_back', skill: 'honors', sc: launch(2) }),
      type: 'num',
      text: () => 'The picture gives v_0x and θ. Work backward to find the launch speed v_0.',
      hints: () => ['Normally v_0x = v_0 × cos(θ). Here you know v_0x, so divide instead.', 'On the calculator: type v_0x, press ÷, then press cos and type the angle.'],
      scene: q => ({ mode: 'scene', sc: q.sc, showX: true, showY: false, labelV0: false, giveX: true }),
      unit: 'm/s',
      needs: q => ({ fn: 'cos', nums: [Number(fmt(q.sc.x, 1)), q.sc.th] }),
      grade: (q, raw) => {
        const v = parseNum(raw);
        const shownX = Number(fmt(q.sc.x, 1));
        const t = shownX / Math.cos(rad(q.sc.th));
        const right = `v_0 = v_0x ÷ cos(θ) = ${fmt(shownX, 1)} ÷ cos(${q.sc.th}°) = ${fmtAns(t)} m/s`;
        if (v !== null && near(v, t)) return { ok: true, msg: `<span class="formula">${right}</span>` };
        const times = v !== null && near(v, shownX * Math.cos(rad(q.sc.th)));
        return { ok: false, mistake: times ? 'multiplied' : 'other', msg: `${times ? 'You multiplied, so your answer came out smaller than v_0x. The whole speed must be bigger. Divide.<br>' : ''}<span class="worked">The right way: <span class="formula">${right}</span></span>` };
      }
    }
  };

  function gradeCalc(asked, raw, sc) {
    const r = checkCalc(asked, raw, sc);
    if (r.ok === null) return { ok: false, mistake: 'blank', msg: `No answer. <span class="formula">${work(asked, sc)}</span>` };
    return r;
  }

  // Mastery Check: one blueprint so every retake tests the same skills with new numbers.
  function buildQuiz(honors) {
    const list = ['read', 'concept', 'choose', 'calc_x', 'calc_x', 'calc_y', 'calc_y', 'sense'];
    if (honors) list.push(pick(['h_speed', 'h_angle']), pick(['h_vertical', 'h_down', 'h_back']));
    return list.map(kind => QUESTION[kind].make());
  }

  function gradeQuiz(questions, answers) {
    const results = questions.map((q, i) => {
      const r = QUESTION[q.kind].grade(q, answers[i]);
      return { skill: q.skill, ok: !!r.ok, msg: r.msg, mistake: r.mistake || null };
    });
    const correct = results.filter(r => r.ok).length;
    const skills = {};
    results.forEach(r => {
      skills[r.skill] = skills[r.skill] || { right: 0, total: 0 };
      skills[r.skill].total++;
      if (r.ok) skills[r.skill].right++;
    });
    return { results, correct, total: questions.length, pct: Math.round(100 * correct / questions.length), skills };
  }

  // ---------- Reading the Desmos scientific calculator ----------
  // Its API reports what was typed (LaTeX) but not the result, so this evaluates the LaTeX itself.
  // It also records which numbers and functions were used, so "17.3" alone can't pass as work.
  function parseCalc(latex, degrees, prev) {
    let src = String(latex)
      .replace(/\\left|\\right/g, '').replace(/\\cdot|\\times/g, '*').replace(/\\div/g, '/')
      .replace(/\\operatorname\{([a-z]+)\}/g, '\\$1').replace(/\\ /g, '').replace(/\s+/g, '')
      .replace(/−/g, '-').replace(/\^\{?\\circ\}?|°/g, '°');
    let i = 0;
    const nums = [], fns = [];
    const peek = t => src.startsWith(t, i);
    const take = t => (peek(t) ? (i += t.length, true) : false);
    const fail = () => { throw new Error('unreadable'); };
    const need = t => { if (!take(t)) fail(); };
    const group = () => { need('{'); const v = expr(); need('}'); return v; };

    const FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
    const INV = { sin: Math.asin, cos: Math.acos, tan: Math.atan };
    const toRad = x => (degrees ? rad(x) : x);
    const fromRad = x => (degrees ? x * 180 / Math.PI : x);

    function funcCall() {
      for (const name of ['arcsin', 'arccos', 'arctan', 'sin', 'cos', 'tan']) {
        if (!take('\\' + name)) continue;
        const base = name.replace('arc', '');
        let inverse = name.startsWith('arc');
        if (take('^{-1}')) inverse = true;
        const arg = unary();
        fns.push((inverse ? 'a' : '') + base);
        return inverse ? fromRad(INV[base](arg)) : FN[base](toRad(arg));
      }
      return null;
    }

    function atom() {
      if (take('(')) { const v = expr(); need(')'); return v; }
      if (take('\\frac')) { const a = group(); const b = group(); return a / b; }
      if (take('\\sqrt')) {
        let n = 2;
        if (take('[')) { n = expr(); need(']'); }
        fns.push('sqrt');
        return Math.pow(group(), 1 / n);
      }
      if (take('\\pi')) return Math.PI;
      if (take('ans') || take('\\ans')) {
        if (!prev) fail();
        nums.push(...prev.nums); fns.push(...prev.fns);
        return prev.value;
      }
      const m = src.slice(i).match(/^(\d+\.?\d*|\.\d+)/);
      if (m) { i += m[0].length; const v = parseFloat(m[0]); nums.push(v); return v; }
      const f = funcCall();
      if (f !== null) return f;
      return fail();
    }

    function postfix() {
      let v = atom();
      for (;;) {
        if (take('°')) { if (!degrees) v = rad(v); }
        else if (take('\\%')) v /= 100;
        else if (take('^')) {
          if (peek('{')) v = Math.pow(v, group());
          else { const m = src.slice(i).match(/^\d/); if (!m) fail(); i++; v = Math.pow(v, Number(m[0])); }
        } else return v;
      }
    }
    function unary() { return take('-') ? -unary() : postfix(); }
    function term() {
      let v = unary();
      for (;;) {
        if (take('*')) v *= unary();
        else if (take('/')) v /= unary();
        else if (i < src.length && /[\d(\\.a]/.test(src[i])) v *= unary();   // 20\cos(30)
        else return v;
      }
    }
    function expr() {
      let v = term();
      for (;;) {
        if (take('+')) v += term();
        else if (take('-')) v -= term();
        else return v;
      }
    }

    try {
      const value = expr();
      if (i !== src.length || !isFinite(value)) return null;
      return { value, nums, fns, latex };
    } catch (e) {
      return null;
    }
  }

  // state = desmos.getState(). Uses the student's latest line, as the calculator itself would show it.
  function readCalculator(state) {
    const list = (state && state.expressions && state.expressions.list) || [];
    const degrees = !state || !state.settings || state.settings.degreeMode !== false;
    let prev = null, last = null, unreadable = false;
    list.forEach(item => {
      if (!item || !item.latex) return;
      const parsed = parseCalc(item.latex, degrees, prev);
      unreadable = !parsed;
      last = item.latex;
      if (parsed) prev = parsed;
    });
    if (last === null) return { empty: true };
    if (unreadable) return { unreadable: true };
    return prev;
  }

  // needs = { nums: [...], fn: 'sin' | 'cos' | 'sqrt' | 'atan', trig: true }. Returns a message, or null when it is real work.
  // These stop a looked-up answer without costing a streak, so a real mistake still gets its diagnosis at Check.
  function checkWork(work, needs = {}) {
    if (!work.fns.length && work.nums.length <= 1) {
      return 'Type the whole calculation into the calculator, not just the answer.';
    }
    if (needs.fn && !work.fns.includes(needs.fn)) {
      const names = { sin: 'the sin button', cos: 'the cos button', sqrt: 'the square root button', atan: 'the tan⁻¹ button' };
      return `Your calculation needs to use ${names[needs.fn]}.`;
    }
    if (needs.trig && !work.fns.some(f => ['sin', 'cos', 'tan'].includes(f))) {
      return 'Your calculation needs to use the sin or cos button.';
    }
    const missing = (needs.nums || []).filter(n => !work.nums.some(w => Math.abs(w - Math.abs(n)) < 1e-6));
    if (missing.length) return `Your calculation needs to use the numbers from the problem. Look for ${missing.join(' and ')}.`;
    return null;
  }

  window.Engine = { parseCalc, readCalculator, checkWork, Phys, THINGS, SKILLS, QUESTION, fmt, fmtAns, near, parseNum, pick, shuffled, rad, launch, gridArrow, work, fn, sym, checkCalc, buildQuiz, gradeQuiz };
})();

// Physics, data checks, grading, lesson structure and saving for Unit_2/centripetal_force_lab
global.window = global;
require('../Unit_2/vector_decomposition_studio/js/engine.js');
['physics', 'questions', 'concepts', 'lesson', 'integrity', 'certificate'].forEach(f => require(`../Unit_2/centripetal_force_lab/js/${f}.js`));
const FL = global.FL, Lesson = global.Lesson, Integrity = global.Integrity, Certificate = global.Certificate;

const TIERS = ['conceptual', 'cp', 'honors'];
const settings = tier => (tier === 'honors' ? FL.LEVELS : FL.SPEEDS);
// A full, honest data table: the speeds a student could pick, with the forces the dial would show
function fullTable(tier, rig) {
  const table = [];
  for (let n = 1; n <= FL.TRIALS[tier]; n++) {
    const set = settings(tier).find(s => FL.speedRule(tier, n, table).ok(s));
    const v = FL.speedOf(tier, rig, set), F = Math.round(FL.force(rig.m, v, rig.r) * 2) / 2;
    table.push({ set, v, F, a: FL.round(v * v / rig.r, 1) });
  }
  return table;
}

describe('the physics', () => {
  test('F = m v² ÷ r: twice the speed needs 4 times the force, 3 times needs 9 times', () => {
    expect(FL.force(0.5, 4, 2)).toBe(4);
    expect(FL.force(0.2, 4, 0.8)).toBeCloseTo(4 * FL.force(0.2, 2, 0.8));
    expect(FL.force(0.2, 6, 0.8)).toBeCloseTo(9 * FL.force(0.2, 2, 0.8));
  });

  test('every puck and string keeps the needle on the dial, and under the breaking force at the test speed', () => {
    TIERS.forEach(tier => FL.RIGS[tier].forEach(([m, r]) => [1.6, 1.8, 2.0].forEach(base => {
      const rig = { m, r, base };
      settings(tier).forEach(s => expect(FL.force(m, FL.speedOf(tier, rig, s), r)).toBeLessThanOrEqual(FL.DIAL.max));
    })));
    FL.RIGS.conceptual.forEach(([m, r]) => {
      [2, 4, 6].forEach(v => expect(Number.isInteger(FL.round(FL.force(m, v, r), 6))).toBe(true));   // lands on a dial mark
      expect(FL.force(m, FL.TEST_SPEED, r)).toBeLessThanOrEqual(FL.DIAL.max);
    });
  });

  test('the lap timer and the motor level give the same speed', () => {
    const rig = { m: 0.25, r: 0.5, base: 1.8 };
    FL.LEVELS.forEach(L => {
      const v = FL.levelSpeed(rig, L);
      expect((10 * 2 * Math.PI * rig.r) / FL.tenLaps(rig, v)).toBeCloseTo(v, 1);
    });
  });
});

describe('collecting data', () => {
  test('the first trials are spread out, and no speed can be used twice', () => {
    expect([2, 4, 6].map((s, i) => FL.speedRule('conceptual', i + 1).ok(s))).toEqual([true, true, true]);
    expect(FL.speedRule('conceptual', 2).ok(3)).toBe(false);
    expect(FL.speedRule('cp', 1).ok(5)).toBe(false);
    expect(FL.speedRule('cp', 2).ok(6)).toBe(true);
    expect(FL.speedRule('honors', 1).ok(2)).toBe(true);
    expect(FL.speedRule('honors', 2).ok(6)).toBe(false);
    const rule = FL.speedRule('cp', 3, [{ set: 2 }, { set: 7 }]);
    expect(rule.ok(7)).toBe(false);
    expect(rule.ok(4)).toBe(true);
  });

  test('a full table can always be collected', () => {
    TIERS.forEach(tier => expect(fullTable(tier, { m: 0.25, r: 0.5, base: 1.8 })).toHaveLength(FL.TRIALS[tier]));
    TIERS.forEach(tier => {
      const st = FL.sampleTable(tier, { m: 0.25, r: 0.5, base: 1.8 });
      expect(st).toHaveLength(FL.TRIALS[tier]);
      st.forEach((row, idx) => expect(FL.speedRule(tier, idx + 1, st.slice(0, idx)).ok(row.set)).toBe(true));
    });
  });

  test('a dial reading has to match the dial, and a miss never gives the value away', () => {
    expect(FL.checkReading('12.5', 12.6, 4).ok).toBe(true);
    expect(FL.checkReading('8', 8, 4).ok).toBe(true);
    expect(FL.checkReading('8.5', 8, 4).ok).toBe(false);            // the needle is right on a mark
    expect(FL.checkReading('', 8, 4).mistake).toBe('blank');
    expect(FL.checkReading('4', 18, 4).mistake).toBe('read_speed');
    expect(FL.checkReading('1.8', 18, 4).mistake).toBe('read_scale');
    expect(FL.checkReading('16', 18, 4).mistake).toBe('read_close');
    expect(FL.checkReading('30', 18, 4).mistake).toBe('read_far');
    ['4', '1.8', '16', '30'].forEach(raw => expect(FL.checkReading(raw, 18, 4).msg).not.toMatch(/18/));
  });

  test('a plotted point has to be in the right place', () => {
    const spec = FL.graphSpec('conceptual', { m: 0.2, r: 0.8 }), target = { x: 4, y: 4 }, at = FL.toPx(spec, 4, 4);
    expect(FL.checkPlot(spec, { x: at.x + 5, y: at.y - 5 }, target).ok).toBe(true);
    expect(FL.checkPlot(spec, { x: at.x, y: at.y - 60 }, target).mistake).toBe('plot_y');
    expect(FL.checkPlot(spec, { x: at.x + 60, y: at.y }, target).mistake).toBe('plot_x');
    expect(FL.checkPlot(spec, { x: at.x + 60, y: at.y - 60 }, target).mistake).toBe('plot_off');
    const spec2 = FL.graphSpec('conceptual', { m: 0.2, r: 0.8 }), sw = FL.toPx(spec2, 8, 2);
    expect(FL.checkPlot(spec2, sw, { x: 2, y: 8 }).mistake).toBe('plot_swapped');
    const back = FL.fromPx(spec, at.x, at.y);
    expect(back.x).toBeCloseTo(4); expect(back.y).toBeCloseTo(4);
  });

  test('force against v² is a straight line, and force against v is not as straight', () => {
    const pts = k => [2, 3, 4, 5, 6, 7].map(v => ({ x: FL.AXES[k].f(v), y: FL.force(0.25, v, 0.5) }));
    expect(FL.straightness(pts('v2'))).toBeCloseTo(1, 6);
    expect(FL.straightness(pts('v'))).toBeLessThan(0.99);
    expect(FL.straightness(pts('inv'))).toBeLessThan(FL.straightness(pts('v')));
  });
});

describe('checking work and answers', () => {
  const work = (nums, fns = [], latex = '') => ({ nums, fns, latex });
  test('a calculation has to be real work with this problem\'s numbers', () => {
    expect(FL.workProblem(work([8]))).toMatch(/whole calculation/);
    expect(FL.workProblem(work([2, 4]), { routes: [[0.25, 4, 0.5]] })).toMatch(/0\.25 and 4 and 0\.5/);
    expect(FL.workProblem(work([0.25, 4, 0.5]), { routes: [[0.25, 4, 0.5]] })).toBeNull();
    expect(FL.workProblem(work([2, 0.5, 12.08]), { pi: true })).toMatch(/π button/);
    expect(FL.workProblem(work([2, 0.5, 12.08], [], '\\frac{2\\cdot \\pi \\cdot 0.5}{1.208}'), { pi: true })).toBeNull();
    expect(FL.workProblem(work([40, 0.5, 0.25]), { fn: 'sqrt', label: '√' })).toMatch(/√ button/);
  });

  test('a miss on a dealt problem shows the right way; a miss on the student\'s own data does not', () => {
    const q = { target: 8, right: 'F = 0.25 kg × (4 m/s)² ÷ 0.5 m = 8 N', mistake: v => (v === 2 ? ['no_square', 'Square the speed.'] : null) };
    expect(FL.grade(q, '8').ok).toBe(true);
    expect(FL.grade(q, '').mistake).toBe('blank');
    const miss = FL.grade(q, '2');
    expect(miss).toMatchObject({ ok: false, mistake: 'no_square' });
    expect(miss.retry).toBeFalsy();
    expect(miss.msg).toMatch(/The right way/);
    const own = FL.grade(Object.assign({ own: true }, q), '2');
    expect(own.retry).toBe(true);
    expect(own.msg).not.toMatch(/The right way|8 N/);
  });

  test('every dealt problem has friendly numbers and a correct key', () => {
    for (let i = 0; i < 300; i++) {
      const f = FL.fnetProblem(), v = FL.vmaxProblem(), c = FL.compareProblem();
      expect(f.F).toBeCloseTo(FL.force(f.m, f.v, f.r), 6);
      expect(Number.isInteger(FL.round(f.F * 10, 6))).toBe(true);
      expect(Math.sqrt(v.Fmax * v.r / v.m)).toBeCloseTo(v.v, 6);
      expect(c.F2).toBe(c.F1 * c.mult * c.mult);
      [f, v, c].forEach(sc => FL.stepsOf(sc).forEach(q => {
        expect(FL.grade(q, String(q.target)).ok).toBe(true);
        expect(q.calc ? Array.isArray(q.needs.routes) : true).toBe(true);
      }));
    }
  });

  test('aiming: the net force points to the center and the freed path follows the tangent', () => {
    FL.SPOTS.forEach(phi => {
      expect(FL.checkAim('force', phi, phi + 180).ok).toBe(true);
      expect(FL.checkAim('force', phi, phi + 90).mistake).toBe('force_forward');
      expect(FL.checkAim('force', phi, phi).mistake).toBe('force_outward');
      expect(FL.checkAim('path', phi, phi + 90).ok).toBe(true);
      expect(FL.checkAim('path', phi, phi).mistake).toBe('path_outward');
      expect(FL.checkAim('path', phi, phi + 180).mistake).toBe('path_center');
    });
  });

  test('every station has exactly one test that frees the object, and one right force', () => {
    Object.keys(FL.STATIONS).forEach(id => {
      expect(FL.STATIONS[id].tests.filter(t => t.real)).toHaveLength(1);
      expect(FL.STATIONS[id].tests.length).toBeGreaterThanOrEqual(3);
      expect(FL.FORCES.filter(f => FL.checkForceName(id, f.id).ok)).toHaveLength(1);
    });
    expect(FL.checkForceName('car', 'tension')).toMatchObject({ ok: false, mistake: 'name_friction' });
    for (let i = 0; i < 100; i++) {
      const next = FL.nextStation(['rope'], 'rope');
      expect(next).not.toBe('rope');
      expect(FL.STATIONS[next].force).not.toBe(FL.STATIONS.rope.force);
    }
  });
});

describe('the lesson', () => {
  test('each class collects a full table, graphs every trial, and tests a prediction', () => {
    TIERS.forEach(tier => {
      const kinds = id => Lesson.pages(id, tier).map(p => p.kind);
      expect(kinds('measure')).toEqual(Array(FL.TRIALS[tier]).fill('trial'));
      expect(kinds('graph').filter(k => k === 'plot')).toHaveLength(FL.TRIALS[tier]);
      expect(kinds('graph').some(k => k === 'test' || k === 'snap')).toBe(true);
      const ids = Lesson.PARTS.flatMap(p => Lesson.pages(p.id, tier).map(pg => `${p.id}/${pg.id}`));
      expect(new Set(ids).size).toBe(ids.length);
    });
    expect(Lesson.pages('much', 'conceptual').every(p => p.gen === 'compare')).toBe(true);   // no division in Periods 1–3
  });

  test('no page a student sees names a class level', () => {
    const text = JSON.stringify(TIERS.map(tier => Lesson.PARTS.map(p => Lesson.pages(p.id, tier)))) + JSON.stringify(FL.STATIONS) + JSON.stringify(FL.QUIZ_SKILLS);
    expect(text).not.toMatch(/honors|conceptual|\bCP\b/i);
  });
});

describe('the Mastery Check', () => {
  const rightAnswer = it => (it.type === 'aim' ? { angle: it.phi + 180 } : it.type === 'path' ? { angle: it.phi + 90 }
    : it.type === 'name' ? { pick: FL.STATIONS[it.station].force } : { value: String(FL.quizQuestion(it).target) });

  test('five new questions, one for each skill, and the key is right', () => {
    TIERS.forEach(tier => {
      for (let i = 0; i < 100; i++) {
        const items = FL.buildQuiz(tier);
        expect(items.map(it => it.skill).sort()).toEqual(Object.keys(FL.QUIZ_SKILLS).sort());
        expect(FL.STATIONS[items[1].station].force).not.toBe(FL.STATIONS[items[0].station].force);
        expect(FL.gradeQuiz(items, items.map(rightAnswer)).percent).toBe(100);
        expect(() => JSON.stringify(items, (k, v) => { if (v === undefined) throw new Error(k); return v; })).not.toThrow();
        const g = items.find(it => it.type === 'graph');
        expect(FL.quizGraph(g).points.length).toBeGreaterThanOrEqual(5);
      }
    });
  });

  test('blank or wrong answers score nothing and are named', () => {
    const items = FL.buildQuiz('cp');
    const blank = FL.gradeQuiz(items, []);
    expect(blank).toMatchObject({ score: 0, percent: 0, total: 5 });
    const one = FL.gradeQuiz(items, items.map((it, i) => (i === 0 ? rightAnswer(it) : it.type === 'path' ? { angle: it.phi } : {})));
    expect(one.percent).toBe(20);
    expect(one.skills.direction).toBe(1);
    expect(one.mistakes).toContain('path_outward');
  });
});

describe('credit and saved work', () => {
  const state = (tier, over = {}) => Object.assign({
    parts: Object.fromEntries(Lesson.PARTS.filter(p => p.weight).map(p => [p.id, { i: 0, far: 0, done: false }])),
    quiz: { best: 0, attempts: [] }, table: []
  }, over);
  const finished = tier => { const st = state(tier); Object.values(st.parts).forEach(p => { p.done = true; }); st.table = fullTable(tier, { m: 0.25, r: 0.5, base: 1.8 }); return st; };

  test('credit grows page by page: 6 points for the parts, 4 for the Mastery Check', () => {
    TIERS.forEach(tier => {
      const st = state(tier);
      expect(Lesson.earnedPoints(st, tier)).toBe(0);
      let last = 0;
      Lesson.PARTS.filter(p => p.weight).forEach(p => {
        const n = Lesson.pages(p.id, tier).length;
        for (let far = 1; far <= n; far++) {
          st.parts[p.id].far = far;
          const now = Lesson.earnedPoints(st, tier);
          expect(now).toBeGreaterThan(last);
          last = now;
        }
        st.parts[p.id].done = true;
      });
      expect(Lesson.earnedPoints(st, tier)).toBeCloseTo(Lesson.PART_POINTS);
      st.quiz.best = 80;
      expect(Lesson.earnedPoints(st, tier)).toBeCloseTo(Lesson.PART_POINTS + 0.8 * Lesson.QUIZ_POINTS);
    });
    expect(Lesson.PART_POINTS + Lesson.QUIZ_POINTS).toBe(10);
  });

  test('honest saved work raises no flags', () => {
    TIERS.forEach(tier => {
      const st = finished(tier), items = FL.buildQuiz(tier);
      const answers = items.map(it => (it.type === 'aim' ? { angle: it.phi + 180 } : it.type === 'path' ? { angle: it.phi + 90 } : it.type === 'name' ? { pick: FL.STATIONS[it.station].force } : { value: String(FL.quizQuestion(it).target) }));
      st.quiz = { best: 100, attempts: [{ pct: 100, secs: 240 }], last: { items, answers } };
      expect(Integrity.check({ score: 10, quiz_best: 100, track: tier, studioState: st })).toEqual([]);
    });
  });

  test('records that do not add up are flagged', () => {
    expect(Integrity.check({ score: 10 })).toHaveLength(1);
    expect(Integrity.check({ score: 0 })).toEqual([]);
    expect(Integrity.check({ score: 9, track: 'cp', studioState: state('cp') }).join(' ')).toMatch(/higher than the saved work/);
    const noTable = finished('cp'); noTable.table = noTable.table.slice(0, 1);
    expect(Integrity.check({ score: 6, track: 'cp', studioState: noTable }).join(' ')).toMatch(/1 of 5 trials/);
    const items = FL.buildQuiz('cp'), st = finished('cp');
    st.quiz = { best: 100, attempts: [{ pct: 100, secs: 300 }], last: { items, answers: [] } };
    expect(Integrity.check({ score: 10, quiz_best: 100, track: 'cp', studioState: st }).join(' ')).toMatch(/saved answers grade to 0%/);
    st.quiz = { best: 100, attempts: [{ pct: 60, secs: 300 }] };
    expect(Integrity.check({ score: 10, quiz_best: 100, track: 'cp', studioState: st }).join(' ')).toMatch(/does not match any attempt/);
  });

  test('a certificate code depends on the student and the score', () => {
    expect(Certificate.code('abc123', 100)).toMatch(/^MUD-CFL-abc123-100-[0-9A-F]{8}$/);
    expect(Certificate.code('abc123', 100)).not.toBe(Certificate.code('abc123', 80));
    expect(Certificate.code('abc123', 100)).not.toBe(Certificate.code('abc124', 100));
  });
});

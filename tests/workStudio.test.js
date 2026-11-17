// Physics, instrument checks, grading, lesson structure and saving for Unit_3/work_studio
global.window = global;
require('../Unit_2/vector_decomposition_studio/js/engine.js');
['physics', 'questions', 'concepts', 'lesson', 'integrity', 'certificate'].forEach(f => require(`../Unit_3/work_studio/js/${f}.js`));
const FL = global.FL, Lesson = global.Lesson, Integrity = global.Integrity, Certificate = global.Certificate;
const fs = require('fs');

const TIERS = ['conceptual', 'cp', 'honors'];
// A full, honest data table: the distances a student could pick, with the readings the instruments show
function fullTable(tier, rig) {
  const table = [], R = FL.D_RANGE[tier];
  for (let n = 1; n <= FL.TRIALS[tier]; n++) {
    const rule = FL.distRule(tier, n, table);
    let set = null;
    for (let v = R.min; v <= R.max + 1e-9; v = FL.round(v + R.step, 1)) if (rule.ok(v)) { set = v; break; }
    table.push({ set, d: set, F: rig.F, W: FL.meter(rig, set) });
  }
  return table;
}

describe('the physics', () => {
  test('W = F × d along the track, and only F × cos θ counts for an angled strap', () => {
    expect(FL.work({ F: 20, theta: 0 }, 3)).toBe(60);
    expect(FL.work({ F: 30, theta: 60 }, 4)).toBeCloseTo(60);
    expect(FL.work({ F: 25, theta: 0 }, 4)).toBeCloseTo(2 * FL.work({ F: 25, theta: 0 }, 2));
  });

  test('every strap stays on the spring scale and every graph fits the work at the test distance', () => {
    TIERS.forEach(tier => FL.RIGS[tier].forEach(([F, theta]) => {
      expect(F).toBeLessThanOrEqual(FL.DIAL.max);
      expect(Number.isInteger(F)).toBe(true);   // the needle sits on a mark
      const spec = FL.graphSpec({ F, theta });
      expect(spec.y.max).toBeGreaterThanOrEqual(FL.work({ F, theta }, FL.TRACK.max));
      expect(FL.TEST_D[tier]).toBeGreaterThan(FL.D_RANGE[tier].max);   // the prediction is a distance never tried
    }));
  });

  test('Periods 1–3 get whole-number work in every trial', () => {
    FL.RIGS.conceptual.forEach(([F]) => [1, 2, 3, 4, 5, 8].forEach(d => expect(Number.isInteger(FL.meter({ F, theta: 0 }, d))).toBe(true)));
  });
});

describe('collecting data', () => {
  test('Periods 1–3 run 1, 2, 3, 4, 5 m; the others start short, go long, then spread out', () => {
    expect([1, 2, 3, 4, 5].map((s, i) => FL.distRule('conceptual', i + 1).ok(s))).toEqual([true, true, true, true, true]);
    expect(FL.distRule('conceptual', 2).ok(3)).toBe(false);
    expect(FL.distRule('cp', 1).ok(2.5)).toBe(false);
    expect(FL.distRule('cp', 2).ok(5)).toBe(true);
    const rule = FL.distRule('honors', 3, [{ set: 1.2 }, { set: 5.6 }]);
    expect(rule.ok(5.4)).toBe(false);
    expect(rule.ok(3.0)).toBe(true);
  });

  test('a full table can always be collected, and the sample table follows the rules', () => {
    TIERS.forEach(tier => {
      const rig = FL.newRig(tier);
      expect(fullTable(tier, rig).every(r => r.set !== null)).toBe(true);
      const st = FL.sampleTable(tier, rig);
      expect(st).toHaveLength(FL.TRIALS[tier]);
      st.forEach((row, idx) => expect(FL.distRule(tier, idx + 1, st.slice(0, idx)).ok(row.set)).toBe(true));
    });
  });

  test('each instrument reading has to match, and a miss never gives the value away', () => {
    expect(FL.checkForce('24', 24, 3.2, 76.8).ok).toBe(true);
    expect(FL.checkForce('', 24, 3.2, 76.8).mistake).toBe('blank');
    expect(FL.checkForce('76.8', 24, 3.2, 76.8).mistake).toBe('force_gave_work');
    expect(FL.checkForce('2.4', 24, 3.2, 76.8).mistake).toBe('force_scale');
    expect(FL.checkForce('22', 24, 3.2, 76.8).mistake).toBe('force_close');
    expect(FL.checkDist('3.2', 3.2, 24, 76.8).ok).toBe(true);
    expect(FL.checkDist('3.3', 3.2, 24, 76.8).mistake).toBe('dist_close');
    expect(FL.checkDist('320', 3.2, 24, 76.8).mistake).toBe('dist_cm');
    expect(FL.checkDist('24', 3.2, 24, 76.8).mistake).toBe('dist_gave_force');
    expect(FL.checkWork('77', 76.8, 24, 3.2).ok).toBe(true);
    expect(FL.checkWork('24', 76.8, 24, 3.2).mistake).toBe('work_gave_force');
    ['2.4', '22', '76.8'].forEach(raw => expect(FL.checkForce(raw, 24, 3.2, 76.8).msg).not.toMatch(/\b24\b/));
    ['3.3', '320'].forEach(raw => expect(FL.checkDist(raw, 3.2, 24, 76.8).msg).not.toMatch(/3\.2/));
  });

  test('a plotted point has to be in the right place', () => {
    const spec = FL.graphSpec({ F: 20, theta: 0 }), t = FL.toPx(spec, 3, 60);
    expect(FL.checkPlot(spec, t, { x: 3, y: 60 }).ok).toBe(true);
    expect(FL.checkPlot(spec, { x: t.x, y: t.y - 60 }, { x: 3, y: 60 }).mistake).toBe('plot_y');
    expect(FL.checkPlot(spec, { x: t.x + 60, y: t.y }, { x: 3, y: 60 }).mistake).toBe('plot_x');
  });
});

describe('checking work and answers', () => {
  test('a calculation has to be real work with this problem\'s numbers', () => {
    expect(FL.workProblem({ fns: [], nums: [270], latex: '270' }, { routes: [[45, 6]] })).toMatch(/whole calculation/);
    expect(FL.workProblem({ fns: [], nums: [45, 5], latex: '45\\cdot5' }, { routes: [[45, 6]] })).toMatch(/45 and 6/);
    expect(FL.workProblem({ fns: [], nums: [45, 6], latex: '45\\cdot6' }, { routes: [[45, 6]] })).toBeNull();
    expect(FL.workProblem({ fns: [], nums: [40, 15, 60], latex: '' }, { fn: 'cos', routes: [[40, 15, 60]] })).toMatch(/cos/);
  });

  test('every dealt problem has a correct key, and its common mistakes are named', () => {
    for (let i = 0; i < 40; i++) {
      Object.keys(FL.GEN).forEach(k => {
        const sc = FL.GEN[k]();
        FL.stepsOf(sc).forEach(q => {
          expect(FL.grade(q, String(q.target)).ok).toBe(true);
          expect(q.right).toMatch(/ = /);
          expect(q.formula).toBeTruthy();
        });
      });
    }
    const net = { kind: 'net', push: 120, f: 40, d: 10, Fnet: 80, W: 800 };
    expect(FL.grade(FL.P.wnet(net), '1200').mistake).toBe('push_only');
    expect(FL.grade(FL.P.fnet(net), '160').mistake).toBe('added_forces');
    const lift = { kind: 'lift', m: 4, h: 1.5, Fg: 40, W: 60 };
    expect(FL.grade(FL.P.lift(lift), '6').mistake).toBe('forgot_g');
    const fric = { kind: 'fric', push: 90, d: 10, f: 25, Wpush: 900, Wf: -250, Wnet: 650 };
    const wf = FL.grade(FL.P.wf(fric), '250');
    expect(wf.mistake).toBe('sign');
    expect(wf.retry).toBe(true);   // same numbers: just fix the sign
  });

  test('a miss on the student\'s own data keeps the numbers and does not give the answer', () => {
    const table = [{ d: 1, W: 20 }, { d: 2, W: 40 }, { d: 3, W: 60 }, { d: 4, W: 80 }, { d: 5, W: 100 }];
    const r = FL.grade(FL.Q.predictC(table), '320');
    expect(r.retry).toBe(true);
    expect(r.mistake).toBe('predict_squared');
    expect(r.msg).not.toMatch(/160/);
    expect(FL.grade(FL.Q.factor(table, 1, 2, 2), '4').mistake).toBe('factor_squared');
  });

  test('the direction check: each tracked force gets an arrow and a meter prediction, and the meter agrees', () => {
    Object.entries(FL.SCENES).forEach(([id, s]) => {
      const right = { d: s.d, arrows: s.track.map(t => t.dir), preds: s.track.map(t => FL.categoryOf(t.dir, s.d)) };
      expect(FL.checkScene(id, right).ok).toBe(true);
      s.track.forEach((t, i) => {
        // every wrong meter prediction fails, and the meter's sign matches the right prediction
        FL.CATS.filter(c => c.id !== right.preds[i]).forEach(c => {
          const preds = right.preds.slice(); preds[i] = c.id;
          expect(FL.checkScene(id, Object.assign({}, right, { preds })).ok).toBe(false);
        });
        const W = FL.workOf(s, t), cat = right.preds[i];
        expect(cat === 'pos' ? W > 0 : cat === 'neg' ? W < 0 : W === 0).toBe(true);
        expect(s.fbd.some(([dir, label]) => label === t.label && dir === t.dir)).toBe(true);   // the true diagram has it
      });
      expect(FL.checkScene(id, Object.assign({}, right, { d: s.d === 'none' ? 'right' : 'none' })).ok).toBe(false);
    });
    expect(FL.categoryOf('up', 'right')).toBe('zero');
    expect(FL.categoryOf('up', 'down')).toBe('neg');
    expect(FL.categoryOf('up', 'none')).toBe('zero');
    expect(FL.checkDir('carry', { F: 'right', d: 'right', cat: 'pos' }).mistake).toBe('dir_force_is_motion');
    // one force per scene, no normal force, and the main scenes teach +W, −W and both kinds of 0 J
    Object.values(FL.SCENES).forEach(s => { expect(s.track).toHaveLength(1); expect(s.track[0].label).not.toBe('F_N'); expect(s.track[0].tag).toBeTruthy(); });
    const cats = FL.MAIN_SCENES.map(id => FL.categoryOf(FL.SCENES[id].F, FL.SCENES[id].d));
    expect(new Set(cats)).toEqual(new Set(['pos', 'neg', 'zero']));
    expect(FL.MAIN_SCENES.map(id => FL.SCENES[id].d)).toContain('none');
    expect(FL.checkPreds('lower', ['neg']).ok).toBe(true);
    expect(FL.checkPreds('lower', ['pos']).ok).toBe(false);
  });
});

describe('the lesson', () => {
  test('each class collects a full table, graphs every trial, and tests a prediction', () => {
    TIERS.forEach(tier => {
      expect(Lesson.pages('measure', tier)).toHaveLength(FL.TRIALS[tier]);
      const graph = Lesson.pages('graph', tier);
      expect(graph.filter(p => p.kind === 'plot')).toHaveLength(FL.TRIALS[tier]);
      expect(graph.some(p => p.kind === 'test')).toBe(true);
      expect(Lesson.pages('much', tier)).toHaveLength({ conceptual: 6, cp: 8, honors: 9 }[tier]);
      expect(Lesson.pages('dir', tier)[0].ungraded).toBe(true);
    });
    expect(FL.TRIALS.honors).toBe(6);
    expect(Lesson.pages('graph', 'conceptual').some(p => p.kind === 'slope')).toBe(false);   // no division for Periods 1–3
    expect(Lesson.pages('much', 'conceptual').map(p => p.gen)).toContain('liftC');           // the lift split into two boxes
    ['revF', 'revH'].forEach(g => expect(Lesson.pages('much', 'conceptual').map(p => p.gen)).not.toContain(g));   // no division for Periods 1–3
  });

  test('no page a student sees names a class level, and there is no notebook page', () => {
    const src = ['lesson', 'app-lab', 'app-trial', 'app-graph', 'app-much', 'app-quiz', 'questions', 'concepts']
      .map(f => fs.readFileSync(`${__dirname}/../Unit_3/work_studio/js/${f}.js`, 'utf8')).join('\n');
    expect(src).not.toMatch(/['"`][^'"`]*\b(Honors|Conceptual Physics|CP Physics)\b[^'"`]*['"`]/);
    expect(src).not.toMatch(/notebook/i);
  });
});

describe('the Mastery Check', () => {
  test('five new questions, including a 0 J (Day 1) question, and the key is right', () => {
    TIERS.forEach(tier => {
      for (let k = 0; k < 15; k++) {
        const items = FL.buildQuiz(tier);
        expect(items).toHaveLength(5);
        expect(items.some(it => it.skill === 'zero')).toBe(true);
        expect(new Set(items.map(it => it.skill)).size).toBe(5);
        items.filter(it => it.type === 'dir').forEach(it => expect(FL.MAIN_SCENES.concat(FL.EXTRA_SCENES)).not.toContain(it.scene));
        const answers = items.map(it => (it.type === 'dir'
          ? { F: FL.SCENES[it.scene].F, d: FL.SCENES[it.scene].d, cat: FL.categoryOf(FL.SCENES[it.scene].F, FL.SCENES[it.scene].d) }
          : { value: String(FL.quizQuestion(it).target) }));
        expect(FL.gradeQuiz(items, answers).percent).toBe(100);
      }
    });
  });

  test('blank or wrong answers score nothing and are named', () => {
    const items = FL.buildQuiz('cp');
    const g = FL.gradeQuiz(items, items.map(() => null));
    expect(g.score).toBe(0);
    g.results.forEach(r => expect(r.msg).toBeTruthy());
  });
});

describe('credit and saved work', () => {
  const blank = () => ({ parts: { dir: { i: 0, far: 0, done: false }, measure: { i: 0, far: 0, done: false }, graph: { i: 0, far: 0, done: false }, much: { i: 0, far: 0, done: false } }, quiz: { best: 0, attempts: [] } });

  test('credit grows page by page: 6 points for the parts, 4 for the Mastery Check', () => {
    TIERS.forEach(tier => {
      const st = blank();
      expect(Lesson.earnedPoints(st, tier)).toBe(0);
      st.parts.dir.far = 3;
      const some = Lesson.earnedPoints(st, tier);
      expect(some).toBeGreaterThan(0);
      Object.values(st.parts).forEach(p => { p.done = true; });
      expect(Lesson.earnedPoints(st, tier)).toBeCloseTo(6);
      st.quiz.best = 100;
      expect(Lesson.earnedPoints(st, tier)).toBeCloseTo(10);
    });
  });

  test('honest saved work raises no flags, and a score the work does not support is flagged', () => {
    const st = blank();
    Object.values(st.parts).forEach(p => { p.done = true; });
    st.table = fullTable('cp', { F: 20, theta: 0 });
    const items = FL.buildQuiz('cp');
    const answers = items.map(it => (it.type === 'dir' ? { F: FL.SCENES[it.scene].F, d: FL.SCENES[it.scene].d, cat: FL.categoryOf(FL.SCENES[it.scene].F, FL.SCENES[it.scene].d) } : { value: String(FL.quizQuestion(it).target) }));
    st.quiz = { best: 100, attempts: [{ pct: 100, secs: 400 }], last: { items, answers } };
    expect(Integrity.check({ score: 10, track: 'cp', quiz_best: 100, studioState: st })).toEqual([]);
    const bad = blank();
    expect(Integrity.check({ score: 9, track: 'cp', studioState: bad }).length).toBeGreaterThan(0);
  });

  test('saved work holds no undefined values or arrays inside arrays (Firestore rules)', () => {
    const items = FL.buildQuiz('honors');
    const json = JSON.parse(JSON.stringify({ items, table: fullTable('honors', { F: 30, theta: 60 }) }));
    const walk = (v, inArray) => {
      expect(v).not.toBeUndefined();
      if (Array.isArray(v)) { expect(inArray).toBe(false); v.forEach(x => walk(x, true)); } else if (v && typeof v === 'object') Object.values(v).forEach(x => walk(x, false));
    };
    walk(json, false);
  });

  test('a certificate code depends on the student and the score', () => {
    expect(Certificate.code('a', 100)).not.toBe(Certificate.code('b', 100));
    expect(Certificate.code('a', 100)).not.toBe(Certificate.code('a', 75));
  });
});

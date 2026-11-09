// Physics, grading, lesson structure and saving for Unit_2/centripetal_workshop
global.window = global;
require('../Unit_2/vector_decomposition_studio/js/engine.js');
require('../Unit_2/centripetal_workshop/js/physics.js');
require('../Unit_2/centripetal_workshop/js/lesson.js');
require('../Unit_2/centripetal_workshop/js/integrity.js');
require('../Unit_2/centripetal_workshop/js/certificate.js');
const PR = global.PR, Lesson = global.Lesson, Integrity = global.Integrity, Certificate = global.Certificate, Engine = global.Engine;

const TIERS = ['conceptual', 'cp', 'honors'];
const KIND_FOR = { factor: 'compare', newac: 'compare', ac: 'ac', v: 'period', vmax: 'vmax' };

describe('the physics', () => {
  test('a_c = v² ÷ r, and the teaching circle turns one radian per second', () => {
    expect(PR.accel(10, 20)).toBe(5);
    expect(PR.accel(20, 20)).toBe(4 * PR.accel(10, 20));
    expect(PR.accel(10, 10)).toBe(2 * PR.accel(10, 20));
    expect(PR.TEACH.v / PR.TEACH.r).toBe(1);
  });

  test('every a_c problem is friendly: whole numbers at level 1, one decimal at most at level 2', () => {
    for (let i = 0; i < 400; i++) {
      const a = PR.newProblem('ac', 1), b = PR.newProblem('ac', 2);
      expect(a.a).toBeCloseTo(PR.accel(a.v, a.r), 9);
      expect(Number.isInteger(a.a)).toBe(true);
      expect(Math.abs(b.a * 10 - Math.round(b.a * 10))).toBeLessThan(1e-9);
      [a, b].forEach(p => { expect(p.a).toBeGreaterThanOrEqual(2); expect(p.a).toBeLessThanOrEqual(25); });
    }
  });

  test('conceptual problems need no division: the answer is the old a_c times a whole factor', () => {
    for (let i = 0; i < 400; i++) {
      const p = PR.newProblem('compare', i % 2 ? 1 : 2);
      expect(Number.isInteger(p.a1)).toBe(true);
      expect([2, 4, 9]).toContain(p.factor);
      expect(p.a2).toBe(p.a1 * p.factor);
      expect(PR.accel(p.v2, p.r2)).toBeCloseTo(p.a2, 9);
      if (i % 2) expect(p.change).not.toBe('v3');
    }
  });

  test('honors lap and fastest-speed problems are consistent', () => {
    for (let i = 0; i < 200; i++) {
      const p = PR.newProblem('period');
      expect(p.v).toBeCloseTo(2 * Math.PI * p.r / p.T, 9);
      expect(p.a).toBeCloseTo(p.v * p.v / p.r, 9);
      const m = PR.newProblem('vmax');
      expect(PR.accel(m.v, m.r)).toBeCloseTo(m.a, 9);
    }
  });

  test('a retry never deals the same numbers', () => {
    ['ac', 'compare', 'period', 'vmax'].forEach(kind => {
      for (let i = 0; i < 100; i++) {
        const a = PR.newProblem(kind), b = PR.newProblem(kind, 2, a);
        expect(['v', 'r', 'v1', 'r1', 'change', 'T', 'a'].every(k => a[k] === b[k])).toBe(false);
      }
    });
  });
});

describe('answer checking', () => {
  const ac = { kind: 'ac', v: 10, r: 20, a: 5 };
  test('right answers pass with a stacked calculation and units', () => {
    const r = PR.gradeStep(PR.STEP.cp.ac, '5', ac, {});
    expect(r.ok).toBe(true);
    expect(r.msg).toContain('calc-stack');
    expect(r.msg).toContain('m/s²');
  });

  test('common a_c mistakes are named', () => {
    const m = raw => PR.gradeStep(PR.STEP.cp.ac, raw, ac, {}).mistake;
    expect(m('0.5')).toBe('no_square');
    expect(m('2000')).toBe('times_r');
    expect(m('0.2')).toBe('flipped');
    expect(m('1')).toBe('doubled');
    expect(m('100')).toBe('no_r');
    expect(PR.gradeStep(PR.STEP.cp.ac, '7', ac, {}).msg).toContain('The right way');
  });

  test('conceptual factor and new a_c', () => {
    const v2 = { kind: 'compare', change: 'v2', v1: 10, r1: 20, a1: 5, v2: 20, r2: 20, factor: 4, a2: 20 };
    const half = { kind: 'compare', change: 'rhalf', v1: 10, r1: 20, a1: 5, v2: 10, r2: 10, factor: 2, a2: 10 };
    const v3 = { kind: 'compare', change: 'v3', v1: 4, r1: 8, a1: 2, v2: 12, r2: 8, factor: 9, a2: 18 };
    expect(PR.gradeStep(PR.STEP.conceptual.factor, '4', v2, {}).ok).toBe(true);
    expect(PR.gradeStep(PR.STEP.conceptual.factor, '2', v2, {}).mistake).toBe('no_square');
    expect(PR.gradeStep(PR.STEP.conceptual.factor, '6', v3, {}).mistake).toBe('added_not_squared');
    expect(PR.gradeStep(PR.STEP.conceptual.factor, '0.5', half, {}).mistake).toBe('radius_flip');
    expect(PR.gradeStep(PR.STEP.conceptual.newac, '20', v2, { factor: 4 }).ok).toBe(true);
    expect(PR.gradeStep(PR.STEP.conceptual.newac, '10', v2, { factor: 4 }).mistake).toBe('no_square');
    expect(PR.gradeStep(PR.STEP.conceptual.newac, '2.5', half, { factor: 2 }).mistake).toBe('radius_flip');
  });

  test('honors lap speed and fastest speed', () => {
    const p = { kind: 'period', r: 4, T: 2, v: 2 * Math.PI * 2, a: 0 };
    p.a = p.v * p.v / p.r;
    expect(PR.gradeStep(PR.STEP.honors.v, p.v.toFixed(2), p, {}).ok).toBe(true);
    expect(PR.gradeStep(PR.STEP.honors.v, (Math.PI * 2).toFixed(3), p, {}).mistake).toBe('half_lap');
    expect(PR.gradeStep(PR.STEP.honors.v, '2', p, {}).mistake).toBe('used_r');
    expect(PR.gradeStep(PR.STEP.honors.v, (8 * Math.PI).toFixed(3), p, {}).mistake).toBe('no_T');
    const m = { kind: 'vmax', a: 8, r: 50, v: 20 };
    expect(PR.gradeStep(PR.STEP.honors.vmax, '20', m, {}).ok).toBe(true);
    expect(PR.gradeStep(PR.STEP.honors.vmax, '400', m, {}).mistake).toBe('no_root');
  });

  test('follow-through: a_c uses the student\'s own rounded speed', () => {
    const p = { kind: 'period', r: 4, T: 3, v: 2 * Math.PI * 4 / 3, a: 0 };
    p.a = p.v * p.v / p.r;
    const ownV = 8.4;   // rounded
    expect(PR.gradeStep(PR.STEP.honors.ac, String(ownV * ownV / 4), p, { v: ownV }).ok).toBe(true);
  });
});

describe('calculator work', () => {
  const work = latex => Engine.parseCalc(latex, true);
  test('a bare number is not work', () => {
    expect(PR.workProblem(work('5'), { routes: [[10, 20]] })).toMatch(/whole calculation/);
  });
  test('the problem\'s numbers, π and √ are required where needed', () => {
    expect(PR.workProblem(work('10\\cdot 10\\div 20'), PR.STEP.cp.ac.needs({ v: 10, r: 20 }, {}))).toBeNull();
    expect(PR.workProblem(work('10^{2}\\div 20'), PR.STEP.cp.ac.needs({ v: 10, r: 20 }, {}))).toBeNull();
    expect(PR.workProblem(work('12\\cdot 12\\div 20'), PR.STEP.cp.ac.needs({ v: 10, r: 20 }, {}))).toMatch(/numbers from this problem/);
    const p = { r: 4, T: 2 };
    expect(PR.workProblem(work('2\\pi \\cdot 4\\div 2'), PR.STEP.honors.v.needs(p, {}))).toBeNull();
    expect(PR.workProblem(work('2\\cdot 3.14\\cdot 4\\div 2'), PR.STEP.honors.v.needs(p, {}))).toMatch(/π button/);
    expect(PR.workProblem(work('\\sqrt{8\\cdot 50}'), PR.STEP.honors.vmax.needs({ a: 8, r: 50 }, {}))).toBeNull();
    expect(PR.workProblem(work('8\\cdot 50'), PR.STEP.honors.vmax.needs({ a: 8, r: 50 }, {}))).toMatch(/square root/);
  });
});

describe('concept questions', () => {
  test('each has exactly one right answer, and lettered pictures match the options', () => {
    Object.keys(PR.CONCEPT).forEach(id => {
      for (let i = 0; i < 50; i++) {
        const q = PR.makeConcept(id), def = PR.CONCEPT[id];
        const ids = PR.conceptOptions(q).map(o => o.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toContain(def.right(q));
        expect(PR.gradeConcept(q, def.right(q)).ok).toBe(true);
        ids.filter(x => x !== def.right(q)).forEach(x => {
          const r = PR.gradeConcept(q, x);
          expect(r.ok).toBe(false);
          expect(typeof r.mistake).toBe('string');
        });
        if (def.letters) expect(Object.values(q.letters).sort()).toEqual(ids.slice().sort());
      }
    });
  });
});

describe('lesson structure', () => {
  test('every page points at a real step or concept, and asked steps have a problem dealt first', () => {
    TIERS.forEach(tier => Lesson.PARTS.filter(p => p.weight).forEach(part => {
      let dealt = null;
      Lesson.pages(part.id, tier).forEach(pg => {
        if (pg.mc) expect(PR.CONCEPT[pg.mc]).toBeDefined();
        if (pg.ask) {
          expect(PR.STEP[tier][pg.ask]).toBeDefined();
          if (pg.fresh) { expect(pg.make).toBeDefined(); dealt = pg.make; }
          expect(PR.SOLVE[dealt]).toContain(pg.ask);
        }
        if (!pg.ask && !pg.mc && !pg.predict) { expect(pg.title).toBeTruthy(); expect(typeof pg.scene).toBe('function'); }
      });
    }));
  });

  test('the conceptual path never asks for division', () => {
    Lesson.pages('size', 'conceptual').filter(p => p.ask).forEach(p => {
      const step = PR.STEP.conceptual[p.ask];
      expect(step.formula(PR.newProblem('compare'), {})).not.toContain('÷');
    });
  });

  test('every step has at most two hints, so they stay clear of the calculator', () => {
    TIERS.forEach(tier => Object.entries(PR.STEP[tier]).forEach(([k, step]) => {
      expect(step.hints(PR.newProblem(KIND_FOR[k]), {}).length).toBeLessThanOrEqual(2);
    }));
  });

  test('full credit is exactly 10 points', () => {
    TIERS.forEach(tier => {
      const parts = {};
      Lesson.PARTS.filter(p => p.weight).forEach(p => { parts[p.id] = { done: true }; });
      expect(Lesson.earnedPoints({ parts, quiz: { best: 100 } }, tier)).toBeCloseTo(10, 9);
      expect(Lesson.earnedPoints({ parts: {}, quiz: { best: 0 } }, tier)).toBe(0);
    });
  });
});

// Answers each quiz question correctly, the way a student would, using their own earlier answers
function answerQuiz(quiz, mistakeAt = -1) {
  const chains = quiz.probs.map(() => ({}));
  quiz.qs.forEach((q, i) => {
    if (q.kind === 'mc') { quiz.answers[i] = PR.CONCEPT[q.id].right(q); return; }
    const step = PR.STEP[quiz.tier][q.k], sc = quiz.probs[q.f];
    let v = step.own ? step.own(sc, chains[q.f]) : step.target(sc, chains[q.f]);
    if (i === mistakeAt) v = v * 3 + 1;
    quiz.answers[i] = String(Number(v.toFixed(3)));
    quiz.work[i] = 'work';
    chains[q.f][step.k] = Number(v.toFixed(3));
  });
}

describe('Mastery Check', () => {
  test('perfect answers score 100% in every class', () => {
    TIERS.forEach(tier => {
      for (let i = 0; i < 30; i++) {
        const quiz = PR.buildQuiz(tier);
        answerQuiz(quiz);
        expect(PR.gradeQuiz(quiz).pct).toBe(100);
      }
    });
  });

  test('one slip early in a problem costs one point, not the whole problem', () => {
    const quiz = PR.buildQuiz('honors');
    const first = quiz.qs.findIndex(q => q.kind === 'step' && q.k === 'v');
    answerQuiz(quiz, first);
    const g = PR.gradeQuiz(quiz);
    expect(g.correct).toBe(g.total - 1);
  });
});

describe('saving', () => {
  const hasNestedArray = v => (Array.isArray(v) ? v.some(x => Array.isArray(x) || hasNestedArray(x)) : v && typeof v === 'object' ? Object.values(v).some(hasNestedArray) : false);
  const hasUndefined = v => v === undefined || (v && typeof v === 'object' ? Object.values(v).some(hasUndefined) : false);

  test('a saved Mastery Check and problems pass Firestore\'s rules: no arrays inside arrays, no undefined', () => {
    TIERS.forEach(tier => {
      const quiz = PR.buildQuiz(tier);
      answerQuiz(quiz);
      const state = { v: 1, current: 'quiz', parts: { size: { sc: PR.newProblem(KIND_FOR[Object.keys(PR.STEP[tier])[0]]), q: PR.makeConcept('v_dir'), trail: [] } }, quiz: { best: 100, attempts: [{ pct: 100 }], cur: quiz, last: quiz } };
      const saved = JSON.parse(JSON.stringify(state));
      expect(hasNestedArray(saved)).toBe(false);
      expect(hasUndefined(saved)).toBe(false);
      expect(PR.gradeQuiz(saved.quiz.cur).pct).toBe(100);
    });
  });

  test('integrity: an honest record has no flags, an inflated score is flagged', () => {
    const parts = {};
    Lesson.PARTS.filter(p => p.weight).forEach(p => { parts[p.id] = { done: true }; });
    const quiz = PR.buildQuiz('cp');
    answerQuiz(quiz);
    quiz.work = quiz.work.map((w, i) => (quiz.qs[i].kind === 'step' ? String(quiz.answers[i]) : null));
    const st = { v: 1, parts, quiz: { best: 100, attempts: [{ pct: 100, secs: 300 }], last: quiz } };
    expect(Integrity.check({ score: 10, quiz_best: 100, track: 'cp', studioState: st })).toEqual([]);
    const low = { v: 1, parts: { turn: { done: true } }, quiz: { best: 0, attempts: [] } };
    expect(Integrity.check({ score: 9, track: 'cp', studioState: low }).join(' ')).toMatch(/higher than the saved work/);
  });

  test('certificate codes are stable and change with the score', () => {
    expect(Certificate.code('123456', 80)).toBe(Certificate.code('123456', 80));
    expect(Certificate.code('123456', 80)).not.toBe(Certificate.code('123456', 100));
    expect(Certificate.code('123456', 80)).toMatch(/^MUD-CAW-/);
  });
});

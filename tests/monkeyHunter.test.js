// Physics, grading and scoring for Unit_2/monkey_hunter_studio
global.window = global;
require('../Unit_2/vector_decomposition_studio/js/engine.js');
require('../Unit_2/monkey_hunter_studio/js/physics.js');
require('../Unit_2/monkey_hunter_studio/js/lesson.js');
require('../Unit_2/monkey_hunter_studio/js/integrity.js');
require('../Unit_2/monkey_hunter_studio/js/certificate.js');
const PR = global.PR, Lesson = global.Lesson, Integrity = global.Integrity, Certificate = global.Certificate, Engine = global.Engine;

const TIERS = ['conceptual', 'cp', 'honors'];
const blank = () => {
  const parts = {};
  Lesson.PARTS.filter(p => p.weight).forEach(p => { parts[p.id] = { far: 0, done: false }; });
  return { parts, quiz: { best: 0, attempts: [] } };
};

describe('the big idea', () => {
  test('the strings are what a dropped ball falls: 5, 20, 45, 80 m', () => {
    expect([1, 2, 3, 4].map(t => PR.dropAt(t))).toEqual(PR.DROPS);
  });
  test('the ball and the monkey meet at any speed, when aimed at the monkey', () => {
    [10, 20, 40, 80].forEach(v => {
      const sc = PR.hunt(v, v * 1.5, 120 / v);
      expect(sc.voy * sc.t - PR.dropAt(sc.t)).toBeCloseTo(sc.H - PR.dropAt(sc.t), 8);
      expect(sc.H / sc.D).toBeCloseTo(1.5, 8);
    });
  });
  test('they still meet on the Moon, and a held-on monkey needs one string of aim', () => {
    const sc = PR.teachHunt();
    expect(sc.voy * sc.t - PR.dropAt(sc.t, 1.6)).toBeCloseTo(sc.H - PR.dropAt(sc.t, 1.6), 8);
    const aim = sc.H + PR.dropAt(sc.t);
    expect((aim / sc.t) * sc.t - PR.dropAt(sc.t)).toBeCloseTo(sc.H, 8);
  });
});

describe('problems', () => {
  test('every hunt meets above the ground', () => {
    TIERS.forEach(t => {
      for (let i = 0; i < 300; i++) {
        const s = PR.newHunt(t, i % 2 ? 1 : 2);
        expect(s.H - PR.dropAt(s.t)).toBeGreaterThan(0);
        expect(s.vox * s.t).toBeCloseTo(s.D, 6);
        expect(s.voy * s.t).toBeCloseTo(s.H, 6);
      }
    });
  });
  test('conceptual hunts use whole seconds found in the drop table, with no launch speed or angle', () => {
    for (let i = 0; i < 300; i++) {
      const s = PR.newHunt('conceptual');
      expect([1, 2, 3, 4]).toContain(s.t);
      expect(s.v0).toBeUndefined();
      expect(s.th).toBeUndefined();
    }
  });
  test('a slow call matches its label, and its time is in the table', () => {
    for (let i = 0; i < 300; i++) {
      const q = PR.newSlowCall();
      expect(PR.dropAt(q.sc.t) > q.sc.H).toBe(q.slow);
      expect(q.sc.H).not.toBe(PR.dropAt(q.sc.t));
      expect([1, 2, 3, 4]).toContain(q.sc.t);
    }
  });
  test('a retry never deals the same numbers', () => {
    TIERS.forEach(t => {
      for (let i = 0; i < 100; i++) {
        const a = PR.newHunt(t), b = PR.newHunt(t, 2, a);
        expect(a.D === b.D && a.H === b.H && a.t === b.t).toBe(false);
      }
    });
  });
});

describe('answer checking', () => {
  const sc = PR.hunt(20, 30, 3);
  const cp = PR.STEP.cp;
  test('right answers pass, with a stacked calculation', () => {
    expect(PR.gradeStep(cp.drop, '45', sc, { t: 3 }).ok).toBe(true);
    expect(PR.gradeStep(cp.meet, '45', sc, { t: 3, drop: 45 }).ok).toBe(true);
    expect(PR.gradeStep(cp.aim, '135', sc, { t: 3, drop: 45 }).ok).toBe(true);
    expect(PR.gradeStep(cp.t, '3', sc, {}).msg).toContain('calc-stack');
  });
  test.each([
    ['15', 'drop_no_square'], ['90', 'drop_used_g'], ['30', 'drop_speed'], ['9', 'drop_no_five']
  ])('a drop of %s is diagnosed as %s', (raw, id) => {
    expect(PR.gradeStep(cp.drop, raw, sc, { t: 3 }).mistake).toBe(id);
  });
  test('aiming right at a monkey that holds on is named', () => {
    expect(PR.gradeStep(cp.aim, '90', sc, { t: 3, drop: 45 }).mistake).toBe('aim_at_monkey');
  });
  test('a wrong ruler reading asks to look again, without new numbers', () => {
    const r = PR.gradeStep(cp.read3, '40', null, null);
    expect(r.ok).toBe(false);
    expect(r.retry).toBe(true);
    expect(PR.gradeStep(cp.read3, '45', null, null).ok).toBe(true);
  });
  test('radian mode gets a retry on the aim angle', () => {
    const h = { v0: 40, th: Math.atan(0.75) * 180 / Math.PI, D: 80, H: 60, vox: 32, voy: 24, t: 2.5 };
    const r = PR.gradeStep(PR.STEP.honors.th, String(Math.atan(0.75)), h, {});
    expect(r.retry).toBe(true);
  });
  test('follow-through: a later step accepts work from the student\'s own earlier answer', () => {
    expect(PR.gradeStep(cp.meet, '75', sc, { t: 3, drop: 15 }).ok).toBe(true);
  });
  test('calculator work must really use the numbers', () => {
    const need = cp.drop.needs(sc, { t: 3 });
    expect(PR.workProblem(Engine.parseCalc('5\\times3^{2}', true), need)).toBeNull();
    expect(PR.workProblem(Engine.parseCalc('45', true), need)).toMatch(/whole calculation/);
    expect(PR.workProblem(Engine.parseCalc('9\\times5', true), need)).toMatch(/numbers from this problem/);
  });
  test('honors needs the inverse tangent button for the aim', () => {
    const h = { D: 80, H: 60, th: 36.87 };
    const need = PR.STEP.honors.th.needs(h);
    expect(PR.workProblem(Engine.parseCalc('\\tan^{-1}\\left(60\\div80\\right)', true), need)).toBeNull();
    expect(PR.workProblem(Engine.parseCalc('60\\div80', true), need)).toMatch(/tan⁻¹/);
  });
});

describe('lesson', () => {
  test('every page in every class points at a real step or concept', () => {
    TIERS.forEach(t => Object.keys(Lesson.PAGES).forEach(id => Lesson.pages(id, t).forEach(pg => {
      if (pg.ask) expect(PR.STEP[t][pg.ask]).toBeDefined();
      if (pg.mc) expect(PR.CONCEPT[pg.mc]).toBeDefined();
    })));
  });
  test('honors-only pages stay out of the other classes', () => {
    ['conceptual', 'cp'].forEach(t => {
      const asks = Object.keys(Lesson.PAGES).flatMap(id => Lesson.pages(id, t)).map(p => p.ask);
      ['th', 'vox', 'fall', 'vmin', 'early', 'gap'].forEach(k => expect(asks).not.toContain(k));
    });
  });
  test('conceptual math has no division sign in its steps', () => {
    Object.values(PR.STEP.conceptual).forEach(s => {
      expect(s.formula(PR.hunt(20, 30, 3), {})).not.toContain('÷');
    });
  });
  test('no words in student text mention Honors', () => {
    const words = JSON.stringify(TIERS.flatMap(t => Object.keys(Lesson.PAGES).flatMap(id => Lesson.pages(id, t))).map(p => [p.title, p.body, p.after]));
    expect(words).not.toMatch(/honors/i);
  });
  test('each concept question resumes from plain JSON and grades its right answer', () => {
    Object.keys(PR.CONCEPT).forEach(id => {
      for (let i = 0; i < 20; i++) {
        const q = JSON.parse(JSON.stringify(PR.makeConcept(id)));
        expect(PR.conceptOptions(q).length).toBeGreaterThanOrEqual(2);
        expect(PR.gradeConcept(q, PR.CONCEPT[id].right(q)).ok).toBe(true);
      }
    });
  });
});

describe('grade', () => {
  test('6 points for parts plus 4 for the best Mastery Check', () => {
    TIERS.forEach(t => {
      const st = blank();
      expect(Lesson.earnedPoints(st, t)).toBe(0);
      Object.values(st.parts).forEach(p => { p.done = true; });
      expect(Lesson.earnedPoints(st, t)).toBeCloseTo(6, 8);
      st.quiz.best = 100;
      expect(Lesson.earnedPoints(st, t)).toBeCloseTo(10, 8);
    });
  });
  test('credit grows step by step inside a part', () => {
    const st = blank();
    st.parts.hunts.far = 7;
    expect(Lesson.earnedPoints(st, 'cp')).toBeGreaterThan(0);
    expect(Lesson.earnedPoints(st, 'cp')).toBeLessThan(2);
  });
});

describe('Mastery Check', () => {
  test('2 hunts and 2 questions, and it survives a JSON round trip', () => {
    TIERS.forEach(t => {
      const q = JSON.parse(JSON.stringify(PR.buildQuiz(t)));
      expect(q.qs.filter(x => x.kind === 'mc').length).toBe(2);
      expect(new Set(q.qs.filter(x => x.kind === 'step').map(x => x.f)).size).toBe(2);
      expect(q.qs.filter(x => x.kind === 'step').map(x => x.k)).toContain('aim');
    });
  });
  function perfect(t) {
    const q = PR.buildQuiz(t), chains = q.hunts.map(() => ({}));
    q.qs.forEach((x, i) => {
      if (x.kind === 'mc') { q.answers[i] = PR.CONCEPT[x.id].right(x); return; }
      const step = PR.STEP[t][x.k], v = step.target(q.hunts[x.f], chains[x.f]);
      q.answers[i] = String(v);
      chains[x.f][step.k] = v;
    });
    return q;
  }
  test('all right answers grade to 100% in every class', () => {
    TIERS.forEach(t => { for (let i = 0; i < 30; i++) expect(PR.gradeQuiz(perfect(t)).pct).toBe(100); });
  });
  test('one slip early costs one point, not the whole hunt', () => {
    const q = perfect('cp');
    const iDrop = q.qs.findIndex(x => x.k === 'drop' && x.f === 0);
    const iMeet = q.qs.findIndex(x => x.k === 'meet' && x.f === 0);
    const sc = q.hunts[0], slipped = PR.dropAt(sc.t) + 10;
    q.answers[iDrop] = String(slipped);
    q.answers[iMeet] = String(sc.H - slipped);
    const g = PR.gradeQuiz(q);
    expect(g.results[iDrop].ok).toBe(false);
    expect(g.results[iMeet].ok).toBe(true);
  });
});

describe('records', () => {
  test('a score above the saved work is flagged', () => {
    const st = { parts: blank().parts, quiz: { best: 0, attempts: [] } };
    const flags = Integrity.check({ score: 9, track: 'cp', studioState: st });
    expect(flags.join(' ')).toMatch(/higher than the saved work/);
  });
  test('a matching record is not flagged', () => {
    const st = { parts: blank().parts, quiz: { best: 0, attempts: [] } };
    expect(Integrity.check({ score: 0, quiz_best: 0, track: 'cp', studioState: st })).toEqual([]);
  });
  test('certificate codes change with the student and the score', () => {
    expect(Certificate.code('123456', 80)).toMatch(/^MUD-MHS-123456-80-/);
    expect(Certificate.code('123456', 80)).not.toBe(Certificate.code('123456', 90));
    expect(Certificate.code('123456', 80)).not.toBe(Certificate.code('123457', 80));
  });
});

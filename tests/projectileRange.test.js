// Physics, grading and scoring for Unit_2/projectile_range_studio
global.window = global;
require('../Unit_2/vector_decomposition_studio/js/engine.js');
require('../Unit_2/projectile_range_studio/js/physics.js');
require('../Unit_2/projectile_range_studio/js/lesson.js');
require('../Unit_2/projectile_range_studio/js/integrity.js');
require('../Unit_2/projectile_range_studio/js/certificate.js');
const PR = global.PR, Lesson = global.Lesson, Integrity = global.Integrity, Engine = global.Engine;

const TIERS = ['conceptual', 'cp', 'honors'];
const sc = { vox: 20, voy: 30 };

test('the teaching flight: 3 s up, 6 s in the air, 120 m', () => {
  expect(PR.timeUp(sc)).toBe(3);
  expect(PR.hangTime(sc)).toBe(6);
  expect(PR.range(sc)).toBe(120);
});

test('matches the guided notes cannon: 18 m/s at 65°', () => {
  const c = { vox: 18 * Math.cos(PR.rad(65)), voy: 18 * Math.sin(PR.rad(65)) };
  expect(c.voy).toBeCloseTo(16.31, 2);
  expect(PR.hangTime(c)).toBeCloseTo(3.26, 2);
  expect(PR.range(c)).toBeCloseTo(24.8, 1);
});

describe('launches', () => {
  test('conceptual numbers always count down to 0 in whole seconds, with whole-number ranges', () => {
    for (let i = 0; i < 300; i++) {
      const s = PR.newLaunch('conceptual', i % 2 ? 1 : 2);
      expect(Number.isInteger(PR.timeUp(s))).toBe(true);
      expect(Number.isInteger(PR.range(s))).toBe(true);
      expect(s.v0).toBeUndefined();   // no launch speed or angle, so no trig is even possible
      expect(s.th).toBeUndefined();
    }
  });
  test('cp arrows land on grid corners and the two arrows differ', () => {
    for (let i = 0; i < 300; i++) {
      const s = PR.newLaunch('cp');
      expect(s.vox).toBe(s.gx * s.scale);
      expect(s.voy).toBe(s.gy * s.scale);
      expect(s.gx).not.toBe(s.gy);
    }
  });
  test('honors angles stay away from 45° so sin and cos give different answers', () => {
    for (let i = 0; i < 300; i++) {
      const s = PR.newLaunch('honors');
      expect(Math.abs(s.th - 45)).toBeGreaterThanOrEqual(10);
      expect(Math.abs(s.vox - s.voy)).toBeGreaterThan(1);
    }
  });
  test('a retry never deals the same numbers', () => {
    TIERS.forEach(t => {
      for (let i = 0; i < 100; i++) {
        const a = PR.newLaunch(t), b = PR.newLaunch(t, 2, a);
        expect(a.vox === b.vox && a.voy === b.voy).toBe(false);
      }
    });
  });
});

describe('every step accepts the right answer on every class', () => {
  test.each(TIERS)('%s', tier => {
    for (let i = 0; i < 50; i++) {
      const s = PR.newLaunch(tier), ans = {};
      PR.FLIGHT[tier].forEach(k => {
        const step = PR.STEP[tier][k];
        const value = step.target(s, ans);
        expect(PR.gradeStep(step, String(value), s, ans).ok).toBe(true);
        ans[k] = value;
      });
    }
  });
});

test('the Conceptual flight has no trig and needs no division', () => {
  PR.FLIGHT.conceptual.forEach(k => {
    const step = PR.STEP.conceptual[k];
    expect(`${step.formula(sc, {})} ${step.hints(sc, {}).join(' ')}`).not.toMatch(/sin|cos|÷/);
  });
});

test('Honors keeps sin and cos, and CP reads the grid instead', () => {
  expect(PR.FLIGHT.honors.slice(0, 2).map(k => PR.STEP.honors[k].skill)).toEqual(['split', 'split']);
  expect(PR.FLIGHT.cp.slice(0, 2).map(k => PR.STEP.cp[k].skill)).toEqual(['read', 'read']);
  expect(PR.STEP.cp.vox.calc).toBeFalsy();
});

describe('diagnoses', () => {
  const grid = { scale: 5, gx: 4, gy: 6, vox: 20, voy: 30 };
  const honors = { v0: 20, th: 37, vox: 20 * Math.cos(PR.rad(37)), voy: 20 * Math.sin(PR.rad(37)) };
  test.each([
    ['no_double', 'cp', 't', '3', sc],
    ['used_vox', 'cp', 't', '4', sc],
    ['no_g', 'cp', 't', '60', sc],
    ['times_g', 'cp', 't', '600', sc],
    ['used_voy', 'cp', 'dx', '180', sc],
    ['half_time', 'cp', 'dx', '60', sc],
    ['added', 'cp', 'dx', '26', sc],
    ['divided', 'cp', 'dx', '3.33', sc],
    ['no_time', 'cp', 'dx', '20', sc],
    ['scale', 'cp', 'vox', '4', grid],
    ['swap_read', 'cp', 'vox', '30', grid],
    ['swap', 'honors', 'vox', String(honors.voy), honors],
    ['no_speed', 'honors', 'voy', '0.6', honors],
    ['whole_speed', 'honors', 'vox', '20', honors],
    ['whole_trip', 'conceptual', 'up', '6', sc],
    ['speed_not_time', 'conceptual', 'up', '30', sc],
    ['no_double', 'conceptual', 't', '3', sc]
  ])('%s', (id, tier, k, raw, s) => {
    const r = PR.gradeStep(PR.STEP[tier][k], raw, s, {});
    expect(r.ok).toBe(false);
    expect(r.mistake).toBe(id);
  });
  test('radian mode gets a retry, not a penalty', () => {
    const r = PR.gradeStep(PR.STEP.honors.vox, String(20 * Math.cos(37)), honors, {});
    expect(r.ok).toBe(false);
    expect(r.retry).toBe(true);
  });
});

test('rounded answers carried from an earlier step still pass', () => {
  const c = { v0: 18, th: 65, vox: 18 * Math.cos(PR.rad(65)), voy: 18 * Math.sin(PR.rad(65)) };
  expect(PR.gradeStep(PR.STEP.honors.t, '3.3', c, { voy: 16.3 }).ok).toBe(true);
  expect(PR.gradeStep(PR.STEP.honors.dx, '25.1', c, { vox: 7.6, t: 3.3 }).ok).toBe(true);
});

describe('calculator work', () => {
  const read = latex => Engine.readCalculator({ expressions: { list: [{ latex }] }, settings: { degreeMode: true } });
  const needs = (tier, k, s, ans = {}) => PR.STEP[tier][k].needs(s, ans);
  test('a bare answer is refused', () => {
    expect(PR.workProblem(read('120'), needs('cp', 'dx', sc))).toMatch(/whole calculation/);
  });
  test('the real multiplication passes', () => {
    expect(PR.workProblem(read('20\\cdot6'), needs('cp', 'dx', sc))).toBeNull();
  });
  test('numbers from another problem are refused', () => {
    expect(PR.workProblem(read('15\\cdot8'), needs('cp', 'dx', sc))).toMatch(/numbers from this problem/);
  });
  test('Honors must use the right function', () => {
    const c = { v0: 18, th: 65, vox: 7.6, voy: 16.3 };
    expect(PR.workProblem(read('18\\sin(65)'), needs('honors', 'vox', c))).toMatch(/cos button/);
    expect(PR.workProblem(read('18\\cos(65)'), needs('honors', 'vox', c))).toBeNull();
  });
  test('any honest route to hang time passes', () => {
    ['2\\cdot30\\div10', '30\\div5', '\\frac{2\\cdot30}{10}'].forEach(l => {
      expect(PR.workProblem(read(l), needs('cp', 't', sc))).toBeNull();
    });
  });
  test('Conceptual can add or double the seconds', () => {
    ['3+3', '2\\cdot3'].forEach(l => expect(PR.workProblem(read(l), needs('conceptual', 't', sc, { up: 3 }))).toBeNull());
  });
});

describe('Mastery Check', () => {
  const key = quiz => {
    const chains = quiz.flights.map(() => ({}));
    return quiz.qs.map(q => {
      if (q.kind === 'mc') return PR.CONCEPT[q.id].right(q);
      const v = PR.STEP[quiz.tier][q.k].target(quiz.flights[q.f], chains[q.f]);
      chains[q.f][q.k] = v;
      return String(v);
    });
  };
  test.each(TIERS)('%s: all right scores 100%%, blank scores 0%%', tier => {
    for (let i = 0; i < 40; i++) {
      const quiz = PR.buildQuiz(tier);
      quiz.answers = key(quiz);
      expect(PR.gradeQuiz(quiz).pct).toBe(100);
      quiz.answers = quiz.qs.map(() => null);
      expect(PR.gradeQuiz(quiz).pct).toBe(0);
    }
  });
  test('survives being saved and resumed as JSON', () => {
    const quiz = PR.buildQuiz('honors');
    quiz.answers = key(quiz);
    expect(PR.gradeQuiz(JSON.parse(JSON.stringify(quiz))).pct).toBe(100);
  });
  test('one slip costs one point: later steps follow through', () => {
    const quiz = PR.buildQuiz('cp');
    quiz.answers = key(quiz);
    const iT = quiz.qs.findIndex(q => q.k === 't' && q.f === 0);
    const iDx = quiz.qs.findIndex(q => q.k === 'dx' && q.f === 0);
    const wrongT = PR.hangTime(quiz.flights[0]) + 3;
    quiz.answers[iT] = String(wrongT);
    quiz.answers[iDx] = String(quiz.flights[0].vox * wrongT);
    const g = PR.gradeQuiz(quiz);
    expect(g.results[iT].ok).toBe(false);
    expect(g.results[iDx].ok).toBe(true);
    expect(g.correct).toBe(g.total - 1);
  });
  test('only Honors gets the launch-angle question', () => {
    for (let i = 0; i < 30; i++) {
      expect(PR.buildQuiz('honors').qs.some(q => q.id === 'steeper')).toBe(true);
      expect(PR.buildQuiz('conceptual').qs.some(q => q.id === 'steeper')).toBe(false);
      expect(PR.buildQuiz('cp').qs.some(q => q.id === 'steeper')).toBe(false);
    }
  });
});

describe('grade', () => {
  const fresh = () => ({ parts: { see: { far: 0 }, time: { far: 0 }, range: { far: 0 }, full: { far: 0, solved: 0 } }, quiz: { best: 0, attempts: [] } });
  test('starts at 0, grows step by step, tops out at 10', () => {
    const st = fresh();
    expect(Lesson.earnedPoints(st, 'cp')).toBe(0);
    st.parts.see.far = 2;
    const some = Lesson.earnedPoints(st, 'cp');
    expect(some).toBeGreaterThan(0);
    st.parts.see.far = 4;
    expect(Lesson.earnedPoints(st, 'cp')).toBeGreaterThan(some);
    ['see', 'time', 'range', 'full'].forEach(id => { st.parts[id].done = true; });
    expect(Lesson.earnedPoints(st, 'cp')).toBeCloseTo(6);
    st.quiz.best = 100;
    expect(Lesson.earnedPoints(st, 'cp')).toBeCloseTo(10);
  });
  test('each flight in Full Flights adds credit', () => {
    const st = fresh();
    st.parts.full.solved = 1;
    const one = Lesson.earnedPoints(st, 'conceptual');
    st.parts.full.solved = 2;
    expect(Lesson.earnedPoints(st, 'conceptual')).toBeGreaterThan(one);
  });
  test('a problem page never comes before its lesson, in any class', () => {
    TIERS.forEach(tier => ['see', 'time', 'range'].forEach(id => {
      const pages = Lesson.pages(id, tier);
      expect(pages[0].title).toBeTruthy();
      expect(pages[0].ask || pages[0].mc).toBeFalsy();
    }));
  });
  test('every asked step exists for its class', () => {
    TIERS.forEach(tier => ['see', 'time', 'range', 'full'].forEach(id => {
      Lesson.pages(id, tier).forEach(p => { if (p.ask) expect(PR.STEP[tier][p.ask]).toBeDefined(); });
    }));
  });
});

describe('record check', () => {
  const clean = () => ({ parts: { see: { done: true }, time: { done: true }, range: { done: true }, full: { done: true, solved: 3 } }, quiz: { best: 0, attempts: [] } });
  test('an honest record has no flags', () => {
    expect(Integrity.check({ track: 'cp', score: 6, studioState: clean() })).toEqual([]);
  });
  test('a score with no saved work is flagged', () => {
    expect(Integrity.check({ track: 'cp', score: 10 })[0]).toMatch(/no saved work/);
  });
  test('a score above the saved work is flagged', () => {
    expect(Integrity.check({ track: 'cp', score: 10, studioState: clean() })[0]).toMatch(/higher than the saved work/);
  });
  test('a Mastery score that its answers do not support is flagged', () => {
    const st = clean();
    const quiz = PR.buildQuiz('cp');
    st.quiz = { best: 100, attempts: [{ pct: 100, secs: 400 }], last: quiz };
    const flags = Integrity.check({ track: 'cp', score: 10, quiz_best: 100, studioState: st });
    expect(flags.some(f => /grade to 0%/.test(f))).toBe(true);
  });
});

describe('certificate code', () => {
  test('includes the student and score, and changes with either', () => {
    const c = global.Certificate.code('123456', 80);
    expect(c).toMatch(/^MUD-PRS-123456-80-[0-9A-F]{8}$/);
    expect(global.Certificate.code('123456', 90)).not.toBe(c);
    expect(global.Certificate.code('654321', 80)).not.toBe(c);
  });
});

describe('stacked calculations', () => {
  test('each step gets its own row with the symbol repeated', () => {
    const html = PR.stack('ΔX = 20 m/s × 6 s = 120 m');
    expect((html.match(/calc-sym/g) || []).length).toBe(2);
    expect(html).toContain('20 m/s × 6 s');
    expect(html).toContain('120 m');
  });
  test('text with no equals sign stays one plain line', () => {
    expect(PR.stack('30 m/s drops to 0 in 3 s')).not.toContain('calc-stack');
  });
});

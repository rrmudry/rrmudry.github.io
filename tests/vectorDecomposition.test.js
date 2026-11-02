// Physics and diagnostics for Unit_2/vector_decomposition_studio/js/engine.js
global.window = global;
require('../Unit_2/vector_decomposition_studio/js/engine.js');
const { Phys, checkCalc, buildQuiz, gradeQuiz, QUESTION, launch, near, parseCalc, readCalculator, checkWork } = global.Engine;

const sc = (v0, th) => ({ v0, th, x: Phys.vx(v0, th), y: Phys.vy(v0, th) });

test('matches the Day 46 bell ringer: 20 m/s at 30°', () => {
  expect(Phys.vx(20, 30)).toBeCloseTo(17.32, 2);
  expect(Phys.vy(20, 30)).toBeCloseTo(10, 5);
});

test('rounded table values (20 × 0.87 = 17.4) still earn credit', () => {
  expect(checkCalc('x', '17.4', sc(20, 30)).ok).toBe(true);
});

test.each([
  ['swap', 'x', '10', 20, 30],
  ['radians', 'x', String(20 * Math.cos(37)), 20, 37],
  ['no_speed', 'y', '0.6', 20, 37],
  ['divided', 'x', String(20 / Math.cos(Math.PI * 37 / 180)), 20, 37],
  ['tan', 'y', String(20 * Math.tan(Math.PI * 37 / 180)), 20, 37],
  ['no_trig', 'x', '740', 20, 37],
  ['whole_speed', 'x', '20', 20, 37],
  ['angle_read', 'y', '37', 20, 37]
])('diagnoses the %s mistake', (id, asked, raw, v0, th) => {
  const r = checkCalc(asked, raw, sc(v0, th));
  expect(r.ok).toBe(false);
  expect(r.mistake).toBe(id);
});

test('blank input is not graded as wrong during practice', () => {
  expect(checkCalc('x', '', sc(20, 30)).ok).toBe(null);
});

test('generated launches never make sin and cos give the same answer', () => {
  for (let i = 0; i < 500; i++) {
    const s = launch(2);
    expect(near(s.x, s.y)).toBe(false);
  }
});

test('a quiz can be saved as JSON, resumed and graded', () => {
  for (const honors of [false, true]) {
    const quiz = JSON.parse(JSON.stringify(buildQuiz(honors)));
    expect(quiz).toHaveLength(honors ? 10 : 8);
    const blank = gradeQuiz(quiz, quiz.map(() => null));
    expect(blank.correct).toBe(0);
    quiz.forEach(q => {
      const def = QUESTION[q.kind];
      expect(def.text(q).length).toBeGreaterThan(0);
      expect(def.scene(q).sc).toBeTruthy();
    });
  }
});

test('every question kind accepts its right answer', () => {
  const answers = {
    read: q => (q.asked === 'x' ? q.sc.x : q.sc.y),
    concept: q => (q.sc.th === 45 ? 'eq' : q.sc.th < 45 ? 'x' : 'y'),
    choose: q => q.asked,
    calc_x: q => q.sc.x,
    calc_y: q => q.sc.y,
    sense: q => (q.bad ? 'no' : 'yes'),
    h_vertical: q => (q.asked === 'x' ? q.sc.x : q.sc.y),
    h_down: q => -q.sc.y,
    h_speed: q => q.sc.v0,
    h_angle: q => q.sc.th,
    h_back: q => q.sc.v0
  };
  Object.keys(QUESTION).forEach(kind => {
    for (let i = 0; i < 40; i++) {
      const q = QUESTION[kind].make();
      expect(QUESTION[kind].grade(q, answers[kind](q)).ok).toBe(true);
    }
  });
});

test('no calculation question prints its numbers in the prompt', () => {
  ['calc_x', 'calc_y', 'h_vertical', 'h_down', 'h_back'].forEach(kind => {
    for (let i = 0; i < 30; i++) {
      const q = QUESTION[kind].make();
      expect(QUESTION[kind].text(q)).not.toMatch(/\d{2}/);
    }
  });
});

describe('reading the Desmos scientific calculator', () => {
  const val = (latex, deg = true) => parseCalc(latex, deg).value;

  test.each([
    ['20\\cdot\\cos\\left(30\\right)', 17.3205],
    ['20\\times\\sin\\left(30\\right)', 10],
    ['20\\cos\\left(30\\right)', 17.3205],
    ['20\\cos30', 17.3205],
    ['\\frac{9}{18}', 0.5],
    ['\\sqrt{8^{2}+6^{2}}', 10],
    ['\\tan^{-1}\\left(\\frac{6}{8}\\right)', 36.8699],
    ['\\arctan\\left(\\frac{6}{8}\\right)', 36.8699],
    ['-25\\cdot\\sin\\left(30\\right)', -12.5],
    ['\\cos\\left(30^{\\circ}\\right)', 0.866],
    ['\\frac{10}{\\cos\\left(60\\right)}', 20]
  ])('%s', (latex, want) => {
    expect(val(latex)).toBeCloseTo(want, 3);
  });

  test('radian mode gives the radian answer, so that mistake still gets diagnosed', () => {
    expect(val('\\sin\\left(30\\right)', false)).toBeCloseTo(Math.sin(30), 5);
  });

  test('uses the latest line, and "ans" carries the earlier work with it', () => {
    const list = l => ({ expressions: { list: l.map((latex, id) => ({ id, latex })) }, settings: { degreeMode: true } });
    expect(readCalculator(list(['5+5', '20\\cos\\left(30\\right)', ''])).value).toBeCloseTo(17.32, 2);
    const a = readCalculator(list(['\\cos\\left(30\\right)', '20\\cdot ans']));
    expect(a.value).toBeCloseTo(17.32, 2);
    expect(checkWork(a, { trig: true, nums: [20, 30] })).toBeNull();
    expect(readCalculator(list(['', ''])).empty).toBe(true);
    expect(readCalculator(list(['20\\cos\\left('])).unreadable).toBe(true);
  });

  const needs = { trig: true, nums: [20, 30] };
  test.each([
    ['a number copied from an AI', '17.3'],
    ['an AI number dressed up', '17.3\\cdot1'],
    ['skips the trig button', '20\\cdot0.866'],
    ['wrong speed', '17\\cos\\left(30\\right)']
  ])('rejected as work: %s', (_, latex) => {
    expect(checkWork(parseCalc(latex, true), needs)).toEqual(expect.any(String));
  });

  test('a real mistake is allowed through, so Check can explain it', () => {
    const swapped = parseCalc('20\\sin\\left(30\\right)', true);
    expect(checkWork(swapped, needs)).toBeNull();
    expect(checkCalc('x', String(swapped.value), sc(20, 30)).mistake).toBe('swap');
  });

  test('every calculating question can be answered with its own real work', () => {
    const work = {
      calc_x: q => `${q.sc.v0}\\cos\\left(${q.sc.th}\\right)`,
      calc_y: q => `${q.sc.v0}\\sin\\left(${q.sc.th}\\right)`,
      h_vertical: q => `${q.sc.v0}\\${q.asked === 'x' ? 'sin' : 'cos'}\\left(${90 - q.sc.th}\\right)`,
      h_down: q => `-${q.sc.v0}\\sin\\left(${q.sc.th}\\right)`,
      h_speed: q => `\\sqrt{${q.sc.x}^{2}+${q.sc.y}^{2}}`,
      h_angle: q => `\\tan^{-1}\\left(\\frac{${q.sc.y}}{${q.sc.x}}\\right)`,
      h_back: q => `\\frac{${Number(q.sc.x.toFixed(1))}}{\\cos\\left(${q.sc.th}\\right)}`
    };
    Object.keys(work).forEach(kind => {
      for (let i = 0; i < 40; i++) {
        const q = QUESTION[kind].make();
        const parsed = parseCalc(work[kind](q), true);
        expect(checkWork(parsed, QUESTION[kind].needs(q))).toBeNull();
        expect(QUESTION[kind].grade(q, String(Number(parsed.value.toFixed(3)))).ok).toBe(true);
      }
    });
  });
});

test('the downward launch needs its direction: right size with the wrong sign is diagnosed', () => {
  const q = QUESTION.h_down.make();
  expect(QUESTION.h_down.signed).toBe(true);
  expect(QUESTION.h_down.grade(q, String(q.sc.y)).mistake).toBe('sign');
  expect(QUESTION.h_down.grade(q, String(-q.sc.y)).ok).toBe(true);
});

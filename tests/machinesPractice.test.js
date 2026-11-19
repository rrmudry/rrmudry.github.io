// Physics, GUESS setup, grading, lesson structure, integrity, certificate, and built bundle tests for Unit_3/machines_practice
global.window = global;
require('../Unit_2/vector_decomposition_studio/js/engine.js');
['physics', 'lesson', 'integrity', 'certificate'].forEach(f => require(`../Unit_3/machines_practice/js/${f}.js`));
const SMP = global.SMP;
const Lesson = global.Lesson;
const Integrity = global.Integrity;
const Certificate = global.Certificate;
const Engine = global.Engine;
const fs = require('fs');
const path = require('path');

const TIERS = ['conceptual', 'cp', 'honors'];

function noNestedArraysOrUndef(val) {
  if (val === undefined) return false;
  if (Array.isArray(val)) {
    for (const item of val) {
      if (Array.isArray(item)) return false;
      if (!noNestedArraysOrUndef(item)) return false;
    }
    return true;
  }
  if (val && typeof val === 'object') {
    return Object.values(val).every(noNestedArraysOrUndef);
  }
  return true;
}

describe('Unit 3 Day 4 GUESS Practice: generators and physics', () => {
  test('every SETUP_GEN generator produces valid plain JSON and consistent GUESS specs', () => {
    Object.keys(SMP.SETUP_GEN).forEach(k => {
      for (let i = 0; i < 8; i++) {
        const sc = SMP.SETUP_GEN[k]();
        expect(noNestedArraysOrUndef(sc)).toBe(true);
        const spec = SMP.setupSpec(sc);
        expect(spec.chips.length).toBe(3);
        expect(spec.givens.length).toBe(2);
        expect(spec.eqChoices).toContain(spec.rightEq);
        expect(spec.worked).toMatch(/ = /);
        expect(Array.isArray(spec.symbols) && spec.symbols.length).toBe(3);
        expect(typeof spec.teach === 'string' && spec.teach.length > 20).toBe(true);
        expect(spec.triangle && spec.triangle.kind && spec.triangle.cover).toBeTruthy();
        expect(Array.isArray(spec.guHints) && spec.guHints.length).toBe(2);
        expect(Array.isArray(spec.eqHints) && spec.eqHints.length).toBe(2);
        spec.eqChoices.filter(c => c !== spec.rightEq).forEach(wrong => {
          const msg = spec.explainWrongEq(wrong);
          expect(typeof msg === 'string' && msg.length > 25).toBe(true);
        });
      }
    });
  });

  test('scaffolding triangles, symbol legends, and friction bars appear on target tiers', () => {
    const scMA = SMP.GEN.ma_find();
    const sMA = SMP.stepsOf(scMA, 'cp')[0];
    expect(sMA.tri).toEqual({ kind: 'ma', cover: 'MA' });
    expect(sMA.symbols.length).toBe(3);

    const scPf = SMP.GEN.pulley_f();
    expect(SMP.stepsOf(scPf, 'cp')[0].tri).toEqual({ kind: 'work', cover: 'F' });
    expect(SMP.stepsOf(scPf, 'honors')[0].tri).toBeNull();

    const scRough = SMP.GEN.rough_2box();
    expect(SMP.stepsOf(scRough, 'conceptual')[0].fricBar).toBe(true);
    expect(SMP.stepsOf(scRough, 'conceptual')[0].symbols.length).toBe(3);
  });

  test('every GEN generator produces finite targets, zero NaN/undefined, and valid Desmos routes', () => {
    Object.keys(SMP.GEN).forEach(k => {
      for (let i = 0; i < 10; i++) {
        const sc = SMP.GEN[k]();
        expect(noNestedArraysOrUndef(sc)).toBe(true);
        expect(JSON.parse(JSON.stringify(sc))).toEqual(sc);
        TIERS.forEach(tier => {
          const steps = SMP.stepsOf(sc, tier);
          expect(steps.length).toBeGreaterThanOrEqual(1);
          steps.forEach(q => {
            expect(Number.isFinite(q.target)).toBe(true);
            expect(q.needs && Array.isArray(q.needs.routes) && q.needs.routes.length > 0).toBe(true);
            expect(q.right).toMatch(/ = /);
          });
        });
      }
    });
  });

  test('ramp_givenW_f and ramp_givenW_d give W directly without requiring mgh', () => {
    const scF = SMP.GEN.ramp_givenW_f();
    expect(scF.W).toBe(scF.F * scF.d);
    const qF = SMP.stepsOf(scF, 'conceptual')[0];
    expect(qF.formula).toBe('F = W ÷ d');
    expect(qF.guessG).toContain('W =');

    const scD = SMP.GEN.ramp_givenW_d();
    expect(scD.W).toBe(scD.F * scD.d);
    const qD = SMP.stepsOf(scD, 'cp')[0];
    expect(qD.formula).toBe('d = W ÷ F');
    expect(qD.guessG).toContain('W =');
  });

  test('workProblem rejects single-number answers and accepts valid Desmos expressions', () => {
    const sc = { kind: 'pulley_w', F: 250, d: 4, W: 1000 };
    const q = SMP.stepsOf(sc, 'cp')[0];
    const single = Engine.parseCalc('1000', true);
    expect(SMP.workProblem(single, q.needs)).toBeTruthy();

    const wrongNums = Engine.parseCalc('200*5', true);
    expect(SMP.workProblem(wrongNums, q.needs)).toBeTruthy();

    const valid = Engine.parseCalc('250*4', true);
    expect(SMP.workProblem(valid, q.needs)).toBeNull();
  });

  test('grade and mistake diagnostics catch common physics errors', () => {
    const qDiv = SMP.stepsOf({ kind: 'pulley_f', F: 120, d: 5, W: 600 }, 'cp')[0];
    expect(SMP.grade(qDiv, '120').ok).toBe(true);
    expect(SMP.grade(qDiv, '3000').mistake).toBe('multiplied_instead');
    expect(SMP.grade(qDiv, String(5 / 600)).mistake).toBe('divide_flip');

    const qMass = SMP.stepsOf({ kind: 'ramp_2box_d_h', m: 40, h: 1.5, F: 100, d: 6, W: 600 }, 'honors')[0];
    expect(SMP.grade(qMass, '60').mistake).toBe('forgot_g');

    const qMA = SMP.stepsOf({ kind: 'ma_find', ma: 5, Fin: 90, Fout: 450 }, 'cp')[0];
    expect(SMP.grade(qMA, '0.2').mistake).toBe('ma_flip');

    const qFric = SMP.stepsOf({ kind: 'rough_2box', d: 5, F: 110, Win: 550, Wout: 450, Wf: 100, Ff: 20 }, 'cp')[1];
    expect(SMP.grade(qFric, '1000').mistake).toBe('added_instead');

    const qCarry = SMP.quizQuestion({ kind: 'q_carry0', skill: 'direction', m: 20, F: 200, d: 8 });
    expect(SMP.grade(qCarry, '0').ok).toBe(true);
    expect(SMP.grade(qCarry, '1600').mistake).toBe('carry_90');
  });
});

describe('Lesson progression, Mastery Check, Integrity, and Certificate', () => {
  test('Lesson.earnedPoints reaches exactly 10.0 across all 3 tiers', () => {
    TIERS.forEach(tier => {
      const parts = {};
      Lesson.PARTS.filter(p => p.id !== 'quiz').forEach(p => {
        expect(Lesson.pages(p.id, tier).length).toBeGreaterThan(0);
        parts[p.id] = { i: 0, far: Lesson.pages(p.id, tier).length, done: true };
      });
      const st = { v: 1, parts, quiz: { best: 100, attempts: [{ pct: 100 }] } };
      expect(Lesson.earnedPoints(st, tier)).toBeCloseTo(10, 5);
    });
  });

  test('buildQuiz returns 5 plain-JSON items including 0 J callback and grades accurately', () => {
    TIERS.forEach(tier => {
      const items = SMP.buildQuiz(tier);
      expect(items).toHaveLength(5);
      expect(items[4].kind).toBe('q_carry0');
      expect(noNestedArraysOrUndef(items)).toBe(true);
      expect(JSON.parse(JSON.stringify(items))).toEqual(items);

      const answers = items.map(it => ({ value: String(SMP.quizQuestion(it).target) }));
      const graded = SMP.gradeQuiz(items, answers);
      expect(graded.score).toBe(5);
      expect(graded.percent).toBe(100);
    });
  });

  test('Integrity.check passes honest records and flags tampered or sub-60s passing Mastery Checks', () => {
    const items = SMP.buildQuiz('cp');
    const answers = items.map(it => ({ value: String(SMP.quizQuestion(it).target) }));
    const parts = {};
    Lesson.PARTS.filter(p => p.id !== 'quiz').forEach(p => {
      parts[p.id] = { i: 0, far: Lesson.pages(p.id, 'cp').length, done: true };
    });
    const honestDoc = {
      score: 10,
      track: 'cp',
      quiz_best: 100,
      studioState: {
        v: 1, parts, pg: {},
        quiz: { best: 100, attempts: [{ pct: 100, secs: 180 }], last: { items, answers } }
      }
    };
    expect(Integrity.check(honestDoc)).toEqual([]);

    const inflated = Object.assign({}, honestDoc, { score: 10, studioState: { v: 1, parts: { setup: { done: false }, pulley: { done: false }, ramp: { done: false }, machines: { done: false } }, pg: {}, quiz: { best: 0, attempts: [] } } });
    expect(Integrity.check(inflated).length).toBeGreaterThan(0);

    const fastDoc = Object.assign({}, honestDoc, {
      studioState: Object.assign({}, honestDoc.studioState, {
        quiz: { best: 100, attempts: [{ pct: 100, secs: 25 }], last: { items, answers } }
      })
    });
    expect(Integrity.check(fastDoc).some(f => /25 seconds/.test(f))).toBe(true);
  });

  test('Certificate.code generates deterministic MUD-SMP codes', () => {
    const c1 = Certificate.code('jdoe', 80);
    const c2 = Certificate.code('jdoe', 80);
    const c3 = Certificate.code('jdoe', 100);
    expect(c1).toMatch(/^MUD-SMP-jdoe-80-[0-9A-F]{8}$/);
    expect(c1).toBe(c2);
    expect(c1).not.toBe(c3);
  });

  test('built index.html has inlined code and zero unpkg, Babel, or student-facing LaTeX', () => {
    const html = fs.readFileSync(path.join(__dirname, '../Unit_3/machines_practice/index.html'), 'utf8');
    expect(html).not.toMatch(/unpkg\.com/i);
    expect(html).not.toMatch(/babel/i);
    expect(html).toContain('unit3_day4_machines_practice');
    expect(html).toContain('window.MachinesPractice');

    const srcDir = path.join(__dirname, '../Unit_3/machines_practice');
    const srcFiles = [path.join(srcDir, 'src.html')].concat(
      fs.readdirSync(path.join(srcDir, 'js')).map(f => path.join(srcDir, 'js', f))
    );
    srcFiles.forEach(file => {
      const body = fs.readFileSync(file, 'utf8');
      expect(body).not.toMatch(/\\frac|\\Delta|\\vec/);
    });
  });
});

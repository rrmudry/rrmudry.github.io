// Physics, data checks, grading, lesson structure and saving for Unit_2/highway_curve_lab
global.window = global;
require('../Unit_2/vector_decomposition_studio/js/engine.js');
['physics', 'questions', 'concepts', 'lesson', 'integrity', 'certificate'].forEach(f => require(`../Unit_2/highway_curve_lab/js/${f}.js`));
const FL = global.FL, Lesson = global.Lesson, Integrity = global.Integrity;

const TIERS = ['conceptual', 'cp', 'honors'];
const step = tier => FL.SLIDER[tier].step;
// An honest table for each class, the way a student fills it in by driving
function fullTable(tier, rig) {
  if (tier === 'cp') {
    const table = [];
    for (let n = 1; n <= FL.TRIALS.cp; n++) {
      const rule = FL.speedRule(rig, n, table);
      const v = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].filter(s => FL.grips(0.8, s, rig.r)).reverse().find(s => rule.ok(s) && (n !== 1 || s <= 8));
      table.push({ v, F: Math.round((FL.fNeed(1000, v, rig.r) / 1000) * 2) / 2 });
    }
    return table;
  }
  return FL.PLAN[tier].map(([surf, veh]) => {
    const v = FL.safeSpeed(FL.SURF[surf].mu, rig.r, step(tier));
    return tier === 'honors' ? { surf, mu: FL.SURF[surf].mu, v, v2: v * v } : { surf, veh, v };
  });
}

describe('the physics (g = 10 m/s²)', () => {
  test('friction needed is m × v² ÷ r, and the most the road gives is μ × m × g', () => {
    expect(FL.G).toBe(10);
    expect(FL.fNeed(1000, 20, 50)).toBe(8000);
    expect(FL.fMax(0.8, 1000)).toBe(8000);
    expect(FL.fNeed(1000, 20, 50)).toBeCloseTo(4 * FL.fNeed(1000, 10, 50));
  });

  test('every off-ramp puts the dry and icy limits on whole numbers, and ice halves the safe speed', () => {
    FL.RADII.forEach(r => {
      const dry = FL.vMax(0.8, r), icy = FL.vMax(0.2, r);
      expect(Number.isInteger(FL.round(dry, 9))).toBe(true);
      expect(Number.isInteger(FL.round(icy, 9))).toBe(true);
      expect(dry / icy).toBeCloseTo(2);
    });
  });

  test('mass cancels: the car and the truck hold and slide at the same speeds', () => {
    FL.RADII.forEach(r => ['dry', 'wet', 'icy', 'snow'].forEach(s => {
      const mu = FL.SURF[s].mu;
      [5, 10, 15, 20, 25].forEach(v => {
        const car = FL.fNeed(1000, v, r) <= FL.fMax(mu, 1000) * (1 + 1e-9), truck = FL.fNeed(4000, v, r) <= FL.fMax(mu, 4000) * (1 + 1e-9);
        expect(car).toBe(truck);
        expect(FL.grips(mu, v, r)).toBe(car);
      });
    }));
  });

  test('right at the limit the tires still hold; one step faster they slide', () => {
    FL.RADII.forEach(r => {
      expect(FL.grips(0.8, FL.vMax(0.8, r), r)).toBe(true);
      expect(FL.grips(0.8, FL.vMax(0.8, r) + 1, r)).toBe(false);
    });
  });

  test('Part 4 speeds land exactly on gauge marks: twice as fast uses all the dry grip, and the ice speed is the icy limit', () => {
    FL.RADII.forEach(r => {
      const v = Math.sqrt(2 * r);
      expect(FL.fNeed(1000, v, r) / 1000).toBeCloseTo(2);
      expect(FL.fNeed(1000, 2 * v, r) / 1000).toBeCloseTo(8);
      expect(FL.grips(0.8, 2 * v, r)).toBe(true);
      expect(FL.grips(0.2, v, r)).toBe(true);
      expect(FL.grips(0.2, v + 1, r)).toBe(false);
      expect(FL.fNeed(4000, v, r) / 1000).toBeCloseTo(FL.fMax(0.2, 4000) / 1000);
    });
  });

  test('every speed a CP student can hold on dry road stays on the car gauge', () => {
    FL.RADII.forEach(r => { for (let v = 2; v <= 30; v++) if (FL.grips(0.8, v, r)) expect(FL.fNeed(1000, v, r) / 1000).toBeLessThanOrEqual(FL.GAUGE.car.max); });
  });
});

describe('reading the instruments', () => {
  test('the gauge check accepts the needle and explains common misreadings without giving the value', () => {
    expect(FL.checkGauge('2', 2, 'car').ok).toBe(true);
    expect(FL.checkGauge('2.25', 2, 'car').ok).toBe(false);     // on a mark: read the mark
    expect(FL.checkGauge('1.4', 1.28, 'car').ok).toBe(true);    // between marks: fair tolerance
    expect(FL.checkGauge('2000', 2, 'car').mistake).toBe('read_newtons');
    expect(FL.checkGauge('10', 2, 'car', { v: 10 }).mistake).toBe('read_speed');
    expect(FL.checkGauge('8', 2, 'car', { limit: 8 }).mistake).toBe('read_limit');
    expect(FL.checkGauge('8', 8, 'truck', { wantLimit: true }).ok).toBe(true);
    const far = FL.checkGauge('9', 2, 'car');
    expect(far.ok).toBe(false);
    expect(far.msg).not.toMatch(/\b2\b/);
  });

  test('mph is read from the inner scale', () => {
    expect(FL.checkMph('34', 15).ok).toBe(true);
    expect(FL.checkMph('15', 15).mistake).toBe('mph_ms');
    expect(FL.checkMph('45', 15).ok).toBe(false);
  });

  test('a fastest safe speed needs proof: a run that held, and a run one step faster that slid', () => {
    const runs = [{ v: 14, grip: true }, { v: 15, grip: true }, { v: 16, grip: false }];
    expect(FL.checkFastest('15', runs, 1).ok).toBe(true);
    expect(FL.checkFastest('14', runs, 1).mistake).toBe('not_fastest');
    expect(FL.checkFastest('16', runs, 1).mistake).toBe('slid');
    expect(FL.checkFastest('12', runs, 1).mistake).toBe('not_tested');
    expect(FL.checkFastest('15', [{ v: 15, grip: true }], 1).mistake).toBe('not_proven');
  });

  test('CP speed rules spread the trials out and never repeat a speed', () => {
    const rig = { r: 50 };
    expect(FL.speedRule(rig, 1).ok(8)).toBe(true);
    expect(FL.speedRule(rig, 1).ok(9)).toBe(false);
    expect(FL.speedRule(rig, 2).ok(18)).toBe(true);
    expect(FL.speedRule(rig, 2).ok(12)).toBe(false);
    expect(FL.speedRule(rig, 3, [{ v: 4 }, { v: 19 }]).ok(19)).toBe(false);
  });
});

describe('graphs from the student’s own data', () => {
  test('plot checks work for every class, including the road-condition columns', () => {
    TIERS.forEach(tier => FL.RADII.forEach(r => {
      const table = fullTable(tier, { r }), key = tier === 'honors' ? 'vmax' : undefined, spec = FL.graphSpec(tier, key);
      table.forEach(row => {
        const t = FL.rowXY(tier, row, key), px = FL.toPx(spec, t.x, t.y);
        expect(t.y).toBeLessThanOrEqual(spec.y.max);
        expect(FL.checkPlot(spec, px, t).ok).toBe(true);
        expect(FL.checkPlot(spec, { x: px.x, y: px.y - 60 }, t).ok).toBe(false);
      });
    }));
  });

  test('Conceptual grouped columns: car left, truck right; the other slot of the same road gets its own reason', () => {
    const spec = FL.graphSpec('conceptual');
    const car = FL.rowXY('conceptual', { surf: 'dry', veh: 'car', v: 20 }), truck = FL.rowXY('conceptual', { surf: 'dry', veh: 'truck', v: 20 });
    const pc = FL.toPx(spec, car.x, car.y), pt = FL.toPx(spec, truck.x, truck.y);
    expect(pt.x - pc.x).toBeGreaterThan(FL.BAR_W);           // the two columns never overlap
    expect(FL.checkPlot(spec, pc, car).ok).toBe(true);
    expect(FL.checkPlot(spec, pt, car).mistake).toBe('plot_slot');
    expect(FL.checkPlot(spec, pc, truck).mistake).toBe('plot_slot');
  });

  test('CP: the fitted curve crosses each grip line near the real fastest safe speed', () => {
    FL.RADII.forEach(r => {
      const table = fullTable('cp', { r }), k = FL.fitK(table), spec = FL.graphSpec('cp');
      [['dry', 8], ['wet', 5], ['icy', 2]].forEach(([s, lim]) => {
        const x = FL.crossAt(k, lim);
        expect(Math.abs(x - FL.vMax(FL.SURF[s].mu, r))).toBeLessThan(0.6);
        expect(FL.checkCross(spec, FL.toPx(spec, x, lim), k, lim).ok).toBe(true);
        expect(FL.checkCross(spec, FL.toPx(spec, x - 3, lim), k, lim).mistake).toBe('cross_line');
      });
    });
  });

  test('Honors: v_max² against μ is straighter than v_max against μ, and its slope is about g × r', () => {
    FL.RADII.forEach(r => {
      const table = fullTable('honors', { r });
      const curve = table.map(row => FL.rowXY('honors', row, 'vmax')), line = table.map(row => FL.rowXY('honors', row, 'vmax2'));
      expect(FL.straightness(line)).toBeGreaterThan(FL.straightness(curve));
      line.forEach(p => expect(p.y).toBeLessThanOrEqual(FL.AX.vmax2.max));
      const p = line[1], q = line[0], slope = (q.y - p.y) / (q.x - p.x);   // icy and dry: far apart
      expect(Math.abs(slope - 10 * r) / (10 * r)).toBeLessThan(0.06);
    });
  });
});

describe('questions about the student’s own data', () => {
  test('Conceptual: dry is twice as fast as icy, and the truck matches the car', () => {
    FL.RADII.forEach(r => {
      const table = fullTable('conceptual', { r });
      expect(FL.grade(FL.Q.half(table), '2').ok).toBe(true);
      expect(FL.grade(FL.Q.half(table), '4').mistake).toBe('grip_not_speed');
      expect(FL.grade(FL.Q.truckDiff(table), '0').ok).toBe(true);
      expect(FL.grade(FL.Q.truckDiff(table), '4').mistake).toBe('mass_ratio');
      const icy = table.find(x => x.surf === 'icy').v;
      expect(FL.grade(FL.Q.predictTruck(table), String(icy)).ok).toBe(true);
      expect(FL.grade(FL.Q.predictTruck(table), String(icy / 4)).mistake).toBe('heavy_slower');
    });
  });

  test('a wrong answer on the student’s own data never deals new numbers', () => {
    const table = fullTable('conceptual', { r: 50 });
    const res = FL.grade(FL.Q.half(table), '3');
    expect(res.ok).toBe(false);
    expect(res.retry).toBe(true);
  });

  test('Part 4: twice as fast needs 4 times the friction; the truck has 4 times the grip', () => {
    expect(FL.grade(FL.Q.factor(2, 8, 2), '4').ok).toBe(true);
    expect(FL.grade(FL.Q.factor(2, 8, 2), '2').mistake).toBe('no_square');
    expect(FL.grade(FL.Q.gripFactor(2, 8), '4').ok).toBe(true);
    const q = FL.Q.vmaxIce(50);
    expect(FL.grade(q, '10').ok).toBe(true);
    expect(FL.grade(q, '100').mistake).toBe('no_root');
  });

  test('Honors: radius from the slope, gravel prediction, and the bank angle', () => {
    expect(FL.grade(FL.Q.radius(500), '50').ok).toBe(true);
    expect(FL.grade(FL.Q.radius(500), '5000').mistake).toBe('radius_times');
    expect(FL.grade(FL.Q.predictGravel(500), String(Math.sqrt(200))).ok).toBe(true);
    const bank = FL.Q.bank(15, 50);
    expect(bank.target).toBeCloseTo(24.23, 1);
    expect(FL.grade(bank, '0.45').mistake).toBe('no_atan');
    expect(bank.needs.fn).toBe('atan');
  });

  test('calculations need real work with this problem’s numbers', () => {
    const q = FL.Q.vmaxIce(50);
    expect(FL.workProblem({ fns: [], nums: [10], latex: '10' }, q.needs)).toMatch(/whole calculation/);
    expect(FL.workProblem({ fns: [], nums: [0.2, 10, 50], latex: '0.2\\cdot10\\cdot50' }, q.needs)).toMatch(/square root/);
    expect(FL.workProblem({ fns: ['sqrt'], nums: [0.2, 10, 50], latex: '\\sqrt{0.2\\cdot10\\cdot50}' }, q.needs)).toBe(null);
  });
});

describe('math level for each class', () => {
  // Every number question each class can meet, guided parts and Mastery Check
  function questionsFor(tier) {
    const table = fullTable(tier, { r: 50 }), qs = [FL.Q.factor(2, 8, 2)];
    if (tier === 'conceptual') qs.push(FL.Q.half(table), FL.Q.truckDiff(table), FL.Q.predictTruck(table), FL.Q.gripFactor(2, 8));
    if (tier === 'cp') qs.push(FL.Q.gripMax());
    if (tier === 'honors') qs.push(FL.Q.vsq(table[0]), FL.Q.radius(500), FL.Q.predictGravel(500), FL.Q.vmaxIce(50), FL.Q.bank(15, 50));
    for (let i = 0; i < 30; i++) FL.buildQuiz(tier).filter(it => it.type !== 'path' && it.type !== 'force').forEach(it => qs.push(FL.quizQuestion(it, tier)));
    return qs;
  }
  test('Periods 1–3: no calculator, no formulas, no division, no square roots', () => {
    questionsFor('conceptual').forEach(q => {
      expect(q.calc).toBeFalsy();
      expect(`${q.ask} ${q.formula || ''}`).not.toMatch(/[÷√²]|tan⁻¹|μ/);
    });
  });
  test('Periods 4–6: one formula at a time, no square roots or tan⁻¹', () => {
    questionsFor('cp').forEach(q => {
      expect(`${q.ask} ${q.formula || ''}`).not.toMatch(/√|tan⁻¹/);
      expect((q.needs && q.needs.fn) || null).toBe(null);
    });
  });
  test('CP checks the truck’s grip limit with F_max = μ × m × g', () => {
    const q = FL.Q.gripMax();
    expect(FL.grade(q, '8000').ok).toBe(true);
    expect(FL.grade(q, '8').mistake).toBe('kn_not_n');
    expect(FL.grade(q, '800').mistake).toBe('no_g');
  });
});

describe('aiming on the map', () => {
  test('friction points to the center; with no grip the path is the tangent, at every spot and turn of the map', () => {
    FL.SPOTS.forEach(phi => FL.ROTS.forEach(rot => {
      const at = phi + rot;
      expect(FL.checkAim('force', at, at + 180).ok).toBe(true);
      expect(FL.checkAim('path', at, at + 90).ok).toBe(true);
      expect(FL.checkAim('path', at, at).mistake).toBe('path_outward');
      expect(FL.checkAim('force', at, at + 90).mistake).toBe('force_forward');
    }));
  });
  test('a new spot is always different from the last one', () => {
    for (let i = 0; i < 50; i++) { const a = FL.newSpot(), b = FL.newSpot(a); expect(b.phi === a.phi && b.rot === a.rot).toBe(false); }
  });
  test('friction is the force that turns the car', () => {
    expect(FL.checkForceName('friction').ok).toBe(true);
    ['normal', 'gravity', 'centrifugal'].forEach(id => expect(FL.checkForceName(id).ok).toBe(false));
  });
});

describe('the lesson for each class', () => {
  test('6 parts worth 6 points plus a 4-point Mastery Check; Measure and Graph It count 1.5 each', () => {
    expect(Lesson.PARTS.map(p => p.id)).toEqual(['skid', 'measure', 'graph', 'weather', 'engineer', 'quiz']);
    const total = Lesson.PARTS.reduce((s, p) => s + p.weight, 0);
    const pts = Object.fromEntries(Lesson.PARTS.filter(p => p.weight).map(p => [p.id, (p.weight / total) * 6]));
    expect(pts).toEqual({ skid: 1, measure: 1.5, graph: 1.5, weather: 1, engineer: 1 });
  });
  test('each class has its own measure and graph pages; only Honors banks the curve', () => {
    expect(Lesson.pages('measure', 'cp').map(p => p.id)).toContain('t_limits');
    expect(Lesson.pages('measure', 'conceptual').map(p => p.id)).not.toContain('t_limits');
    expect(Lesson.pages('graph', 'honors').map(p => p.kind)).toEqual(expect.arrayContaining(['axis', 'slope', 'find']));
    expect(Lesson.pages('graph', 'cp').map(p => p.kind)).toEqual(expect.arrayContaining(['cross', 'find']));
    expect(Lesson.pages('engineer', 'honors').map(p => p.id)).toContain('e_bank');
    expect(Lesson.pages('engineer', 'cp').map(p => p.id)).not.toContain('e_bank');
    TIERS.forEach(t => expect(Lesson.pages('graph', t).filter(p => p.kind === 'plot').length).toBe(FL.TRIALS[t]));
  });
  test('page text stays short: one instruction', () => {
    TIERS.forEach(t => Lesson.PARTS.forEach(p => Lesson.pages(p.id, t).forEach(pg => {
      if (pg.text) expect(pg.text.split(/\s+/).length).toBeLessThanOrEqual(18);
    })));
  });
  test('earned points grow step by step and reach 10', () => {
    const st = { parts: {}, quiz: { best: 0 } };
    Lesson.PARTS.filter(p => p.weight).forEach(p => { st.parts[p.id] = { far: 0, done: false }; });
    expect(Lesson.earnedPoints(st, 'cp')).toBe(0);
    st.parts.skid.far = 2;
    expect(Lesson.earnedPoints(st, 'cp')).toBeCloseTo(2 / 5);
    Object.values(st.parts).forEach(p => { p.done = true; });
    st.quiz.best = 100;
    expect(Lesson.earnedPoints(st, 'cp')).toBeCloseTo(10);
  });
});

describe('the Mastery Check', () => {
  test('5 new situations for every class, graded right when answered right', () => {
    TIERS.forEach(tier => {
      for (let i = 0; i < 20; i++) {
        const items = FL.buildQuiz(tier);
        expect(items.map(x => x.skill)).toEqual(['path', 'force', 'table', 'graph', 'recall']);
        const answers = items.map(it => (it.type === 'path' || it.type === 'force')
          ? { angle: it.phi + it.rot + (it.type === 'path' ? 90 : 180) }
          : { value: String(FL.quizQuestion(it, tier).target) });
        const g = FL.gradeQuiz(items, JSON.parse(JSON.stringify(answers)), tier);
        expect(g.percent).toBe(100);
        expect(g.skills.recall).toEqual({ right: 1, total: 1 });
        expect(FL.gradeQuiz(items, items.map(() => null), tier).percent).toBe(0);
      }
    });
  });
  test('quiz items are plain JSON, so they resume with the same numbers', () => {
    TIERS.forEach(tier => { const items = FL.buildQuiz(tier); expect(JSON.parse(JSON.stringify(items))).toEqual(items); });
  });
  test('Honors calculations in the quiz use the calculator; Conceptual reads the graph', () => {
    const h = FL.buildQuiz('honors'), c = FL.buildQuiz('conceptual');
    expect(FL.quizQuestion(h[2], 'honors').calc).toBe(true);
    expect(FL.quizQuestion(c[3], 'conceptual').calc).toBeFalsy();
  });
});

describe('simulated data for the teacher preview', () => {
  test('the sample table is an honest table for every class and radius', () => {
    TIERS.forEach(tier => FL.RADII.forEach(r => {
      const t = FL.sampleTable(tier, { r });
      expect(t.length).toBe(FL.TRIALS[tier]);
      if (tier === 'cp') t.forEach(row => { expect(FL.grips(0.8, row.v, r)).toBe(true); expect(FL.checkGauge(String(row.F), FL.fNeed(1000, row.v, r) / 1000, 'car').ok).toBe(true); });
      else t.forEach(row => { expect(FL.grips(FL.SURF[row.surf].mu, row.v, r)).toBe(true); expect(FL.grips(FL.SURF[row.surf].mu, row.v + step(tier), r)).toBe(false); });
      expect(new Set(t.map(row => JSON.stringify(row))).size).toBe(t.length);
    }));
  });
});

describe('saved records', () => {
  const state = done => ({
    v: 1, parts: Object.fromEntries(['skid', 'measure', 'graph', 'weather', 'engineer'].map(p => [p, { i: 0, far: 12, done }])),
    pg: {}, table: done ? fullTable('cp', { r: 50 }) : [], limits: {}, graph: {}, found: {}, quiz: { best: 0, attempts: [] }
  });
  test('an honest record raises no flags', () => {
    expect(Integrity.check({ score: 6, track: 'cp', studioState: state(true) })).toEqual([]);
  });
  test('a score the saved work cannot support is flagged', () => {
    expect(Integrity.check({ score: 9, track: 'cp', studioState: state(false) }).join(' ')).toMatch(/higher than the saved work/);
  });
  test('saved state has no arrays inside arrays (Firestore)', () => {
    const items = FL.buildQuiz('honors');
    const nested = v => Array.isArray(v) ? v.some(x => Array.isArray(x) || nested(x)) : v && typeof v === 'object' ? Object.values(v).some(nested) : false;
    expect(nested({ items, table: fullTable('honors', { r: 50 }), runs: [{ v: 1, grip: true }] })).toBe(false);
  });
});

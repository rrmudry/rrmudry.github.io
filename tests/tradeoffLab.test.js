// Physics and instrument checks for Unit_3/tradeoff_lab (the page itself is checked by a puppeteer play-through)
global.window = global;
require('../Unit_3/tradeoff_lab/js/physics.js');
const FL = global.FLcore;

describe('machines trade force for distance', () => {
  test('F × d equals m × g × h for every pulley and ramp the sliders allow', () => {
    FL.MASSES.cp.forEach(m => {
      const rig = { m, h: 1.5 };
      const machines = [1, 2, 3, 4].map(n => ({ mach: 'pulley', n })).concat([1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5].map(L => ({ mach: 'ramp', L })));
      machines.forEach(mc => expect(FL.forceNeed(rig, mc) * FL.ropeDist(rig, mc)).toBeCloseTo(m * 15, 6));
    });
  });
  test('every force fits on the 0–250 N spring scale', () => {
    FL.MASSES.cp.forEach(m => expect(m * 10).toBeLessThanOrEqual(FL.SCALE.max));
  });
  test('every rope distance fits on the 7 m tape', () => {
    expect(FL.ropeDist({ m: 20, h: 1.5 }, { mach: 'pulley', n: 4 })).toBeLessThanOrEqual(FL.TAPE.max);
    expect(FL.ropeDist({ m: 20, h: 1.5 }, { mach: 'ramp', L: 6.5 })).toBeLessThanOrEqual(FL.TAPE.max);
  });
});

describe('reading the instruments', () => {
  const rig = { m: 18, h: 1.5 };
  test('close readings pass', () => {
    expect(FL.checkForce('61', 60, 4.5, rig).ok).toBe(true);
    expect(FL.checkDist('4.5', 4.5, 60).ok).toBe(true);
  });
  test('common slips are named', () => {
    expect(FL.checkForce('180', 60, 4.5, rig).mistake).toBe('force_gave_weight');
    expect(FL.checkDist('1.5', 4.5, 60).mistake).toBe('dist_gave_height');
    expect(FL.checkDist('450', 4.5, 60).mistake).toBe('dist_cm');
  });
});

describe('block and tackle animation speeds', () => {
  require('../Unit_3/tradeoff_lab/js/scene.js');
  const Scene = global.Scene;
  test('the free end moves n times as fast as the load, and each wheel turns at its own rate', () => {
    [1, 2, 3, 4].forEach(n => {
      const r = Scene.reeving(n);
      expect(Math.abs(r.speeds[n - 1])).toBe(n);                       // rope leaving the last strand
      expect(r.wheels.map(w => Math.abs(w.rel)).sort()).toEqual(Array.from({ length: n }, (_, i) => i + 1));
      expect(r.speeds[0]).toBe(n % 2 === 0 ? 0 : 1);                   // the dead end moves with its block
    });
  });
});

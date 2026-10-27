// Impact Velocity & Vector Angle Workbench — Scenario Catalog & Generator
// Earth standard gravity: g = 10 m/s²
// Strictly NO LaTeX syntax

(function () {
  const { Phys } = window.CalculationEngine;

  function buildScenario(opts) {
    const { id, title, subtitle, dy, vx, badge = 'Standard', isHonors = false } = opts;
    const t = Phys.time(dy);
    const dx = Phys.range(vx, t);
    const vy = Phys.vy(t);
    const v = Phys.speed(vx, vy);
    const theta = Phys.angle(vx, vy);

    return {
      id: id || `sc_${Math.random().toString(36).substring(2, 7)}`,
      title,
      subtitle: subtitle || 'Measure from the horizontal: θ = tan⁻¹(v<sub>y</sub> ÷ v<sub>x</sub>)',
      dy,
      vx,
      t,
      dx,
      vy,
      v,
      theta,
      badge,
      isHonors
    };
  }

  // 8 Handcrafted Progressive Mastery Levels
  // Structured around clean Pythagorean right triangles so students build confidence with clean math
  const PRESET_LEVELS = [
    {
      id: 'level-1',
      title: 'Level 1: Lab Tabletop (3-4-5 Triangle)',
      subtitle: 'Part C: At what angle below the ground does the ball hit? Measure from the horizontal: θ = tan⁻¹(v<sub>y</sub> ÷ v<sub>x</sub>)',
      dy: 0.8,
      vx: 3.0,
      badge: '★ HONORS H1',
      isHonors: true
    },
    {
      id: 'level-2',
      title: 'Level 2: High Table Drop (8-6-10 Triangle)',
      subtitle: 'Notice how a higher launch speed creates a shallower landing angle θ.',
      dy: 1.8,
      vx: 8.0,
      badge: 'Level 2',
      isHonors: false
    },
    {
      id: 'level-3',
      title: 'Level 3: Classroom Balcony (6-8-10 Triangle)',
      subtitle: 'Compare with Level 2: swapping v<sub>x</sub> and v<sub>y</sub> makes the landing angle steeper!',
      dy: 3.2,
      vx: 6.0,
      badge: 'Level 3',
      isHonors: false
    },
    {
      id: 'level-4',
      title: 'Level 4: Gymnasium Bleachers (5-12-13 Triangle)',
      subtitle: 'Classic 5-12-13 Pythagorean triple: downward speed dominates over forward speed.',
      dy: 7.2,
      vx: 5.0,
      badge: 'Level 4',
      isHonors: false
    },
    {
      id: 'level-5',
      title: 'Level 5: 45° Symmetry Impact',
      subtitle: 'When vertical speed v<sub>y</sub> equals horizontal speed v<sub>x</sub>, what must the angle θ be?',
      dy: 20.0,
      vx: 20.0,
      badge: 'Level 5',
      isHonors: false
    },
    {
      id: 'level-6',
      title: 'Level 6: Seaside Cliff Launch (15-20-25 Triangle)',
      subtitle: 'Scales up the 3-4-5 triangle by a factor of 5! See how the angle stays identical.',
      dy: 20.0,
      vx: 15.0,
      badge: 'Level 6',
      isHonors: false
    },
    {
      id: 'level-7',
      title: 'Level 7: Observation Deck (30-40-50 Triangle)',
      subtitle: 'High cliff drop: 4.0 seconds of free fall yields 40 m/s downward velocity.',
      dy: 80.0,
      vx: 30.0,
      badge: '★ HONORS H2',
      isHonors: true
    },
    {
      id: 'level-8',
      title: 'Level 8: Mountain Canyon Drone Drop (40-30-50 Triangle)',
      subtitle: 'Fast high-speed horizontal launch: combine high horizontal velocity with vertical free fall.',
      dy: 45.0,
      vx: 40.0,
      badge: '★ HONORS H3',
      isHonors: true
    }
  ].map(buildScenario);

  // Random Scenario Generator for infinite practice
  function generateRandomScenario() {
    // Pick clean square times: t in [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0]
    const niceTimes = [0.4, 0.5, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 2.0, 2.4, 3.0];
    const t = niceTimes[Math.floor(Math.random() * niceTimes.length)];
    // dy = 5 * t²
    const dy = Math.round((5 * t * t) * 100) / 100;

    // Pick nice vx
    const niceVx = [2.0, 3.0, 4.0, 5.0, 6.0, 7.5, 8.0, 10.0, 12.0, 15.0, 20.0, 25.0];
    const vx = niceVx[Math.floor(Math.random() * niceVx.length)];

    return buildScenario({
      id: `rand_${Date.now()}`,
      title: `Random Challenge: Δy = ${dy} m, v<sub>x</sub> = ${vx} m/s`,
      subtitle: 'Solve all steps: find fall time, landing distance, final vertical speed, total speed, and angle θ.',
      dy,
      vx,
      badge: '⚡ RANDOM',
      isHonors: true
    });
  }

  window.Scenarios = {
    PRESET_LEVELS,
    buildScenario,
    generateRandomScenario
  };
})();

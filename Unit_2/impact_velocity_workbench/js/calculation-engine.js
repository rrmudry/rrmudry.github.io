// Impact Velocity & Vector Angle Workbench — Calculation Engine & Diagnostic Parser
// Earth standard gravity: g = 10 m/s²
// Strictly NO LaTeX syntax — clean Unicode formulas only

(function () {
  const G = 10;

  const Phys = {
    G,
    time: dy => Math.sqrt(dy / 5),
    range: (vx, t) => vx * t,
    vy: t => G * t,
    speed: (vx, vy) => Math.hypot(vx, vy),
    angle: (vx, vy) => Math.atan2(vy, vx) * (180 / Math.PI)
  };

  // Format a number with d decimals (strips -0.0)
  function fmt(v, d = 1) {
    if (v === null || v === undefined || isNaN(v)) return '--';
    const s = Number(v).toFixed(d);
    return /^-0\.?0*$/.test(s) ? s.slice(1) : s;
  }

  // Fewest decimals up to max that show exact value: 20 -> "20", 1.25 -> "1.25"
  function fmtExact(v, max = 2) {
    if (v === null || v === undefined || isNaN(v)) return '--';
    for (let d = 0; d <= max; d++) {
      if (Math.abs(v - Number(v.toFixed(d))) < 1e-9) return fmt(v, d);
    }
    return fmt(v, max);
  }

  // Clean answer format: 1 or 2 decimals
  const fmtAns = v => {
    if (v === null || v === undefined || isNaN(v)) return '--';
    return fmt(v, Math.abs(v) < 10 ? 2 : 1).replace(/(\.\d)0$/, '$1');
  };

  // Tolerance checking: relative 3% with 0.02 absolute floor
  const near = (v, target, rel = 0.03, abs = 0.02) => {
    return Math.abs(v - target) <= Math.max(Math.abs(target) * rel, abs);
  };

  function parseNum(raw) {
    if (raw === null || raw === undefined) return null;
    const clean = String(raw).trim().replace(',', '.').replace(/[−–]/g, '-').replace(/[^0-9.\-eE]/g, '');
    const v = parseFloat(clean);
    return isFinite(v) ? v : null;
  }

  // Step-by-step worked solutions for student feedback
  const work = {
    t: sc => `t = √(Δy ÷ 5) = √(${fmtExact(sc.dy)} ÷ 5) = √${fmtExact(sc.dy / 5, 3)} = ${fmtAns(sc.t)} s`,
    dx: sc => `Δx = v<sub>x</sub> × t = ${fmtExact(sc.vx)} m/s × ${fmtAns(sc.t)} s = ${fmtAns(sc.dx)} m`,
    vy: sc => `v<sub>y</sub> = 10 × t = 10 m/s² × ${fmtAns(sc.t)} s = ${fmtAns(sc.vy)} m/s`,
    v: sc => `v = √(v<sub>x</sub>² + v<sub>y</sub>²) = √(${fmtExact(sc.vx)}² + ${fmtAns(sc.vy)}²) = √(${fmtExact(sc.vx * sc.vx)} + ${fmtExact(sc.vy * sc.vy)}) = ${fmtAns(sc.v)} m/s`,
    theta: sc => `θ = tan⁻¹(v<sub>y</sub> ÷ v<sub>x</sub>) = tan⁻¹(${fmtAns(sc.vy)} ÷ ${fmtExact(sc.vx)}) = tan⁻¹(${fmtExact(sc.vy / sc.vx, 3)}) = ${fmt(sc.theta, 1)}°`
  };

  // Targeted misconceptions catalog
  const MISTAKES = {
    t: [
      [(v, s) => near(v, s.dy / 5), (v, s) => `Almost! Δy ÷ 5 = ${fmtExact(s.dy / 5, 3)}. That value is t², not t. Take the square root (√) to finish.`],
      [(v, s) => near(v, s.dy / 10), () => `You divided Δy by 10. That assumes constant speed. Gravity accelerates the ball, so use t = √(Δy ÷ 5).`],
      [(v, s) => near(v, Math.sqrt(s.dy / 10)), () => `You divided by 10 inside the square root. The formula divides by 5, because Δy = ½ × 10 × t² = 5t².`],
      [(v, s) => near(v, Math.sqrt(s.dy)), () => `You took the square root of Δy directly. Divide by 5 BEFORE taking the square root.`],
      [(v, s) => near(v, s.dy / s.vx), () => `You divided height by launch speed. Horizontal speed does not change how long the ball takes to drop!`],
      [(v, s) => near(v, Math.sqrt(s.dy * 5)), () => `You multiplied by 5 instead of dividing. Use t = √(Δy ÷ 5).`]
    ],
    dx: [
      [(v, s) => near(v, s.vx * s.dy), () => `Watch your variables: you multiplied launch speed by cliff height Δy. Horizontal distance requires time in the air: Δx = v<sub>x</sub> × t.`],
      [(v, s) => near(v, s.vx / s.t), () => `You divided speed by time. Distance equals speed multiplied by time: Δx = v<sub>x</sub> × t.`],
      [(v, s) => near(v, 0.5 * s.vx * s.t), () => `You included ½. That's only for accelerated motion. Sideways motion has zero acceleration (a = 0), so Δx = v<sub>x</sub> × t with no ½.`],
      [(v, s) => near(v, s.vx * s.t * s.t), () => `You squared the time. Time is only squared vertically (Δy = 5t²). Sideways distance is simply Δx = v<sub>x</sub> × t.`]
    ],
    vy: [
      [(v, s) => near(v, 5 * s.t), () => `You used 5 × t. "5" belongs in distance (Δy = 5t²). Speed increases by 10 m/s every second: v<sub>y</sub> = 10 × t.`],
      [(v, s) => near(v, s.dy / s.t), () => `That is the AVERAGE falling speed. Starting from 0 m/s, final downward speed is twice that: v<sub>y</sub> = 10 × t.`],
      [(v, s) => near(v, s.vx), () => `That is the horizontal speed. Horizontal and vertical motions are independent! Use v<sub>y</sub> = 10 × t.`],
      [(v, s) => near(v, 10), () => `10 m/s² is the acceleration rate. Multiply by the seconds of fall: v<sub>y</sub> = 10 × t.`]
    ],
    v: [
      [(v, s) => near(v, s.vx + s.vy), () => `You added v<sub>x</sub> and v<sub>y</sub> like simple numbers! They meet at a right angle (90°), so you must combine them with the Pythagorean theorem: v = √(v<sub>x</sub>² + v<sub>y</sub>²).`],
      [(v, s) => near(v, s.vx * s.vx + s.vy * s.vy), () => `You calculated v<sub>x</sub>² + v<sub>y</sub>², but forgot to take the square root (√) at the end!`],
      [(v, s) => near(v, s.vy), () => `That is only the vertical component (v<sub>y</sub>). The ball is also moving sideways at v<sub>x</sub>! Combine both: v = √(v<sub>x</sub>² + v<sub>y</sub>²).`],
      [(v, s) => near(v, s.vx), () => `That is only the horizontal component (v<sub>x</sub>). Combine both horizontal and vertical components: v = √(v<sub>x</sub>² + v<sub>y</sub>²).`],
      [(v, s) => near(v, Math.abs(s.vy - s.vx)), () => `You subtracted the components. Perpendicular vectors combine via v = √(v<sub>x</sub>² + v<sub>y</sub>²).`]
    ],
    theta: [
      [(v, s) => near(v, 90 - s.theta, 0.05, 1.2), () => `You found the angle from the VERTICAL wall. Measure from the horizontal ground: θ = tan⁻¹(v<sub>y</sub> ÷ v<sub>x</sub>).`],
      [(v, s) => near(v, s.theta * (Math.PI / 180), 0.08, 0.05), () => `Your calculator is in RADIANS mode! Switch to DEGREES (DEG) or multiply by 180 ÷ π.`],
      [(v, s) => near(v, s.vy / s.vx), () => `That is the ratio (v<sub>y</sub> ÷ v<sub>x</sub>). Now press tan⁻¹ (inverse tangent) of that ratio to get the angle in degrees!`],
      [(v, s) => near(v, Math.atan(s.vx / s.vy) * 180 / Math.PI, 0.05, 1.0), () => `You inverted the fraction: tangent is opposite over adjacent (v<sub>y</sub> ÷ v<sub>x</sub>), not (v<sub>x</sub> ÷ v<sub>y</sub>). Use θ = tan⁻¹(v<sub>y</sub> ÷ v<sub>x</sub>).`]
    ]
  };

  function checkField(field, raw, sc) {
    const v = parseNum(raw);
    if (v === null) return { ok: null, msg: 'Please enter a number.' };
    const target = sc[field];
    const ok = field === 'theta' ? Math.abs(v - target) <= 1.2 : near(v, target);
    if (ok) {
      return { ok: true, v, msg: work[field](sc) };
    }
    const hit = (MISTAKES[field] || []).find(([test]) => test(v, sc));
    const hint = hit ? hit[1](v, sc) : `Not quite. Double-check your formula and substitution.`;
    return {
      ok: false,
      v,
      msg: `${hint}<div class="worked-callout"><strong>Worked Formula:</strong> <span class="formula">${work[field](sc)}</span></div>`
    };
  }

  window.CalculationEngine = {
    Phys,
    fmt,
    fmtExact,
    fmtAns,
    near,
    parseNum,
    checkField,
    work
  };
})();

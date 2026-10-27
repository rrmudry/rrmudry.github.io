// Horizontal Projectile Workbench — Physics, answer checking and diagnostic feedback
// g = 10 m/s² (class standard), so Δy = 5t² and t = √(Δy ÷ 5).
// Every wrong answer is compared against known mistakes so the student hears WHY, not just "wrong".
// The worked solution is always added, because a wrong answer loads a new scenario next.

(function () {
  const G = 10;

  const Phys = {
    G,
    time: dy => Math.sqrt(dy / 5),
    range: (vx, t) => vx * t,
    vy: t => G * t,
    speed: (vx, vy) => Math.hypot(vx, vy),
    angle: (vx, vy) => Math.atan2(vy, vx) * 180 / Math.PI
  };

  // Format a number with a fixed number of decimals (no "-0.0")
  function fmt(v, d) {
    const s = Number(v).toFixed(d);
    return /^-0\.?0*$/.test(s) ? s.slice(1) : s;
  }
  // Fewest decimals (up to max) that show the value exactly: 20 → "20", 1.25 → "1.25", 7.5 → "7.5"
  function fmtExact(v, max = 2) {
    for (let d = 0; d <= max; d++) if (Math.abs(v - Number(v.toFixed(d))) < 1e-9) return fmt(v, d);
    return fmt(v, max);
  }
  // Answers students compute: at least 1 decimal, 2 when small
  const fmtAns = v => fmt(v, Math.abs(v) < 10 ? 2 : 1).replace(/(\.\d)0$/, '$1');

  // Relative tolerance with an absolute floor (so 0-ish values and rounding still pass)
  const near = (v, target, rel = 0.03, abs = 0.01) => Math.abs(v - target) <= Math.max(Math.abs(target) * rel, abs);

  function parseNum(raw) {
    const v = parseFloat(String(raw).replace(',', '.').replace(/[−–]/g, '-').replace(/[^0-9.\-eE]/g, ''));
    return isFinite(v) ? v : null;
  }

  // ---------- Worked solutions ----------
  const work = {
    t: sc => `t = √(Δy ÷ 5) = √(${fmtExact(sc.dy)} ÷ 5) = √${fmtExact(sc.dy / 5, 3)} = ${fmtAns(sc.t)} s`,
    dx: sc => `Δx = v_x × t = ${fmtExact(sc.vx)} m/s × ${fmtAns(sc.t)} s = ${fmtAns(sc.dx)} m`,
    vx: sc => `v_x = Δx ÷ t = ${fmtExact(sc.dx)} m ÷ ${fmtAns(sc.t)} s = ${fmtAns(sc.vx)} m/s`,
    vy: sc => `v_y = 10 × t = 10 m/s² × ${fmtAns(sc.t)} s = ${fmtAns(sc.vy)} m/s`,
    vimp: sc => `v = √(v_x² + v_y²) = √(${fmtExact(sc.vx)}² + ${fmtAns(sc.vy)}²) = ${fmtAns(sc.v)} m/s`,
    theta: sc => `θ = tan⁻¹(v_y ÷ v_x) = tan⁻¹(${fmtAns(sc.vy)} ÷ ${fmtExact(sc.vx)}) = ${fmt(sc.theta, 1)}°`
  };

  // ---------- Diagnostics: [test(v, sc), message(v, sc)] — first match wins ----------
  const MISTAKES = {
    t: [
      [(v, s) => near(v, s.dy / 5), (v, s) => `Almost! Δy ÷ 5 = ${fmtExact(s.dy / 5, 3)}. That number is t², not t. You still need to take the square root (√).`],
      [(v, s) => near(v, s.dy / 10), () => `You divided Δy by 10 and stopped. That treats the fall like constant speed (time = distance ÷ speed). Gravity speeds the ball up, so use t = √(Δy ÷ 5).`],
      [(v, s) => near(v, Math.sqrt(s.dy / 10)), () => `You divided by 10. The formula divides by 5, because Δy = ½ × 10 × t² = 5t².`],
      [(v, s) => near(v, Math.sqrt(s.dy)), () => `You took the square root of Δy without dividing by 5 first. Divide by 5 BEFORE the square root.`],
      [(v, s) => near(v, s.dy / s.vx) || near(v, s.vx / s.dy), () => `You used the launch speed. How fast the ball goes sideways does not change how long it falls. Only the height Δy sets the time.`],
      [(v, s) => near(v, Math.sqrt(s.dy * 5)) || near(v, s.dy * 5), () => `You multiplied by 5. Divide Δy by 5 instead, then take the square root.`]
    ],
    dx: [
      [(v, s) => near(v, s.vx * s.dy), () => `Check your variables: you multiplied by the cliff height Δy. Horizontal distance depends on the TIME in the air: Δx = v_x × t.`],
      [(v, s) => near(v, s.vx / s.t) || near(v, s.t / s.vx), () => `You divided. The ball covers v_x meters every second, so multiply: Δx = v_x × t.`],
      [(v, s) => near(v, 0.5 * s.vx * s.t), () => `You used ½. That's only for speeding up. Sideways there is NO acceleration (a = 0), so Δx = v_x × t with no ½.`],
      [(v, s) => near(v, s.vx * s.t * s.t), () => `You squared the time. Time is only squared for the vertical motion (Δy = 5t²). Sideways, Δx = v_x × t.`],
      [(v, s) => near(v, s.vx + s.t), () => `You added. Multiply the speed by the time: Δx = v_x × t.`],
      [(v, s) => near(v, s.dy), () => `That's the cliff height (Δy), not the landing distance. Use Δx = v_x × t.`],
      [(v, s) => near(v, s.dx * 10) || near(v, s.dx / 10), () => `Your digits are right but the decimal point moved. Check where the decimal goes.`]
    ],
    vx: [
      [(v, s) => near(v, s.dx * s.t), () => `You multiplied. To find the speed, divide the distance by the time: v_x = Δx ÷ t.`],
      [(v, s) => near(v, s.t / s.dx), () => `You divided the wrong way. Distance goes on top: v_x = Δx ÷ t.`],
      [(v, s) => near(v, s.dx / s.dy), () => `You divided by the cliff height. Divide by the TIME in the air: v_x = Δx ÷ t.`],
      [(v, s) => near(v, s.dx / (s.t * s.t)), () => `You divided by t². Sideways there is no acceleration, so v_x = Δx ÷ t (not t²).`],
      [(v, s) => near(v, s.dx), () => `That's the target distance. Divide it by the time to get the speed.`]
    ],
    vy: [
      [(v, s) => near(v, 5 * s.t), () => `You used 5 × t. "5" belongs in the distance formula (Δy = 5t²). Speed grows by 10 m/s every second: v_y = 10 × t.`],
      [(v, s) => near(v, s.dy / s.t), () => `That's the AVERAGE falling speed. The ball starts at 0 m/s down and speeds up, so its final speed is twice that: v_y = 10 × t.`],
      [(v, s) => near(v, s.vx), () => `That's the sideways speed. Vertical and horizontal motion are independent: v_x does not change v_y. Use v_y = 10 × t.`],
      [(v, s) => near(v, 10 * s.t * s.t), () => `You squared the time. Velocity grows in a straight line: v_y = 10 × t.`],
      [(v) => near(v, 10), () => `10 m/s² is how much v_y grows EACH second. Multiply by the time in the air: v_y = 10 × t.`]
    ],
    vimp: [
      [(v, s) => near(v, s.vx + s.vy), () => `You added v_x and v_y like plain numbers. They point at a right angle, so combine them with the Pythagorean theorem: v = √(v_x² + v_y²).`],
      [(v, s) => near(v, s.vx * s.vx + s.vy * s.vy), () => `You found v_x² + v_y² but forgot the square root at the end.`],
      [(v, s) => near(v, s.vy), () => `That's only the downward part (v_y). The ball also moves sideways. Combine both: v = √(v_x² + v_y²).`],
      [(v, s) => near(v, s.vx), () => `That's only the sideways part (v_x). Combine both parts: v = √(v_x² + v_y²).`],
      [(v, s) => near(v, Math.abs(s.vy - s.vx)), () => `You subtracted. Vectors at right angles combine with the Pythagorean theorem: v = √(v_x² + v_y²).`]
    ],
    theta: [
      [(v, s) => near(v, 90 - s.theta, 0, 1), () => `You found the angle from the VERTICAL. Measure from the horizontal ground: θ = tan⁻¹(v_y ÷ v_x).`],
      [(v, s) => near(v, s.theta * Math.PI / 180, 0.03, 0.02), () => `Your calculator is in radians. Switch it to degrees (DEG) and try that number again.`],
      [(v, s) => near(v, s.vy / s.vx) || near(v, s.vx / s.vy), () => `That's the fraction v_y ÷ v_x. Now take tan⁻¹ (inverse tangent) of it to get the angle.`]
    ]
  };

  // Check one calculated answer. Returns { ok, msg }.
  function check(kind, raw, sc) {
    const v = parseNum(raw);
    if (v === null) return { ok: null, msg: 'Type a number first.' };
    const target = sc[kind === 'vimp' ? 'v' : kind];
    const ok = kind === 'theta' ? Math.abs(v - target) <= 1 : near(v, target);
    if (ok) return { ok: true, msg: work[kind](sc) };
    const hit = (MISTAKES[kind] || []).find(([test]) => test(v, sc));
    const why = hit ? hit[1](v, sc) : 'Not quite. Check each step of your math.';
    return { ok: false, msg: `${why}<br><span class="worked">The right way: <span class="formula">${work[kind](sc)}</span></span>` };
  }

  // Check a value read from the apparatus. `step` is the smallest mark the reading must match.
  function checkReading(raw, actual, step) {
    const v = parseNum(raw);
    if (v === null) return { ok: null };
    return { ok: Math.abs(v - actual) <= step / 2 + 1e-9, v };
  }

  window.Engine = { Phys, fmt, fmtExact, fmtAns, near, parseNum, check, checkReading, work };
})();

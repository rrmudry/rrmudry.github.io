// Work & Simple Machines Practice — crisp SVG apparatus pictures (760 × 520).
// Every number needed by the student lives on the picture, never hidden in prose.
// Colors match CSS: cyan = F, amber = d/h, emerald = W, purple = MA, rose = F_f.

(function () {
  const W = 760, H = 520, PF = 368;
  const SUB_RE = /\b(F|W|d|h)_(in|out|g|f|pull|ramp|A|B|1|2)\b/g;
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const fmt = v => (window.SMP ? window.SMP.fmt(v) : String(v));

  function rich(str) {
    let out = '', last = 0, shifted = false;
    const s = String(str);
    s.replace(SUB_RE, (m, base, sub, idx) => {
      out += (shifted ? `<tspan dy="-5">${esc(s.slice(last, idx))}</tspan>` : esc(s.slice(last, idx))) + base;
      out += `<tspan dy="5" font-size="72%">${sub}</tspan>`;
      shifted = true;
      last = idx + m.length;
      return m;
    });
    const rest = s.slice(last);
    return out + (shifted ? `<tspan dy="-5">${esc(rest) || '&#8203;'}</tspan>` : esc(rest));
  }
  const text = (x, y, str, cls = '', anchor = 'middle') => `<text x="${x}" y="${y}" class="sv-text ${cls}" text-anchor="${anchor}">${rich(str)}</text>`;

  function plate(x, y, str, cls = '', anchor = 'middle') {
    const w = String(str).replace(/_/g, '').length * 9.4 + 16;
    const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    const cx = Math.max(6, Math.min(W - w - 6, left));
    return `<rect x="${cx}" y="${y - 19}" width="${w}" height="27" rx="6" class="sv-plate"/>${text(cx + w / 2, y, str, cls)}`;
  }

  function arrow(x1, y1, x2, y2, cls, width = 5) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 3) return '';
    const head = Math.min(width * 3.1, len * 0.6);
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const bx = x2 - ux * head, by = y2 - uy * head;
    const nx = -uy * head * 0.55, ny = ux * head * 0.55;
    return `<g class="${cls}"><line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke-width="${width}" stroke-linecap="round"/><polygon points="${x2},${y2} ${bx + nx},${by + ny} ${bx - nx},${by - ny}"/></g>`;
  }

  function dim(x1, y1, x2, y2, label, cls = 'wk-d', side = 'auto') {
    const horiz = Math.abs(y2 - y1) < Math.abs(x2 - x1);
    const bar = horiz
      ? (x, y) => `<line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}"/>`
      : (x, y) => `<line x1="${x - 9}" y1="${y}" x2="${x + 9}" y2="${y}"/>`;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const lx = horiz ? mx : (side === 'left' ? mx - 14 : mx + 14);
    const ly = horiz ? (side === 'top' ? my - 18 : my + 27) : my + 6;
    const anchor = horiz ? 'middle' : (side === 'left' ? 'end' : 'start');
    return `<g class="${cls} wk-dim">${bar(x1, y1)}${bar(x2, y2)}<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/></g>`
      + plate(lx, ly, label, `${cls}-text`, anchor);
  }

  function bayBackdrop(floor = PF) {
    let s = '';
    [36, W * 0.5, W - 36].forEach(cx => { s += `<rect x="${cx - 7}" y="0" width="14" height="${floor}" class="wk-bay-wall"/>`; });
    s += `<line x1="0" y1="14" x2="${W}" y2="14" class="wk-bay-truss"/><line x1="0" y1="32" x2="${W}" y2="32" class="wk-bay-truss"/>`;
    let zig = '';
    for (let x = 0; x < W; x += 36) zig += `M ${x} 32 L ${x + 18} 14 L ${x + 36} 32 `;
    s += `<path d="${zig}" class="wk-bay-truss"/>`;
    s += `<rect x="0" y="${floor}" width="${W}" height="${H - floor}" class="wk-ground"/>`;
    s += `<line x1="0" y1="${floor}" x2="${W}" y2="${floor}" class="wk-floor-line"/>`;
    s += `<rect x="0" y="${floor}" width="${W}" height="6" class="wk-hazard"/>`;
    return s;
  }

  const crate = (x, y, w, h, cls = '') => `<g class="${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="wk-crate"/><path d="M ${x} ${y} L ${x + w} ${y + h} M ${x + w} ${y} L ${x} ${y + h}" class="wk-crate-x"/></g>`;

  function workMeter(x, y, val, title = 'Work Meter') {
    return `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="164" height="72" rx="10" class="wk-meter"/>`
      + `<rect x="10" y="25" width="144" height="37" rx="5" class="wk-meter-screen"/>`
      + text(82, 18, title, 'sv-small wk-W-text')
      + `<text x="144" y="52" class="wk-meter-val" text-anchor="end">${esc(val)}</text></g>`;
  }

  const frame = inner => `<svg viewBox="0 0 ${W} ${H}" class="scene-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><rect x="0" y="0" width="${W}" height="${H}" class="sv-floor"/>${inner}</svg>`;

  // Side-by-side pulley trade-off demo (Part 1 Page 1)
  function tradeoffDemo(p = 0, tested = false) {
    let s = bayBackdrop(390);
    s += plate(W / 2, 34, 'Two ways to lift the same 300 N crate 2 m up', 'fl-title');
    // Left: 1 rope
    const yA = 320 - p * 120;
    s += `<rect x="70" y="64" width="240" height="12" class="wk-beam"/><circle cx="190" cy="92" r="18" class="wk-pulley"/>`;
    s += `<line x1="172" y1="92" x2="172" y2="${yA}" class="wk-strap"/>`;
    s += `<line x1="208" y1="92" x2="262" y2="230" class="wk-strap"/>`;
    s += crate(134, yA, 76, 62) + plate(172, yA + 37, '300 N', '');
    s += arrow(228, 142, 266, 240, 'wk-F', 5) + plate(286, 178, 'F = 300 N', 'wk-F-text', 'start');
    s += plate(190, 426, '1-Rope Pulley: pull 2 m of rope', 'sv-small wk-d-text');
    s += plate(190, 464, tested ? 'Work = 300 N × 2 m = 600 J' : 'Work = ?', 'wk-W-text');

    // Right: 3 ropes
    const yB = 320 - p * 120;
    s += `<rect x="430" y="64" width="260" height="12" class="wk-beam"/>`;
    s += `<circle cx="535" cy="92" r="16" class="wk-pulley"/><circle cx="535" cy="${yB - 20}" r="14" class="wk-pulley"/>`;
    s += `<line x1="519" y1="92" x2="519" y2="${yB - 20}" class="wk-strap"/><line x1="535" y1="92" x2="535" y2="${yB - 20}" class="wk-strap"/><line x1="551" y1="92" x2="551" y2="${yB - 20}" class="wk-strap"/>`;
    s += `<line x1="551" y1="92" x2="625" y2="255" class="wk-strap"/>`;
    s += crate(497, yB, 76, 62) + plate(535, yB + 37, '300 N', '');
    s += arrow(576, 142, 626, 250, 'wk-F', 5) + plate(636, 178, tested ? 'F = 100 N' : 'F = ?', 'wk-F-text', 'start');
    s += plate(560, 426, '3-Rope Pulley: pull 6 m of rope (3× farther)', 'sv-small wk-d-text');
    s += plate(560, 464, tested ? 'Work = 100 N × 6 m = 600 J' : 'Work = ?', 'wk-W-text');
    return frame(s);
  }

  // Pulley problems (setup_w, setup_f, setup_ma, pulley_*, ma_find, ma_pull_*, q_pulley, q_ma)
  function pulley(sc, solved = {}, titleOverride) {
    let s = bayBackdrop(PF);
    const k = sc.kind;
    const title = titleOverride || (
      k === 'pulley_w' || k === 'setup_w' ? 'Pulley Hoist Lifting an Engine' :
      k === 'pulley_f' || k === 'setup_f' ? 'Stagehand Hoisting a Stage Light' :
      k === 'pulley_d' ? 'Sailor Raising a Sailboat Sail' :
      k === 'pulley_2step' ? 'Single Pulley vs. Double Pulley' :
      k === 'pulley_lift_h' ? 'Lifting & Hoisting a Heavy Crate' :
      k === 'ma_find' || k === 'setup_ma' ? 'Block-and-Tackle Crate Lift' :
      k === 'ma_pull_c' || k === 'ma_pull_2box' || k === 'ma_pull_h' ? 'Ideal Pulley Mechanical Advantage' :
      k === 'q_pulley' ? 'Tow Truck Winch' :
      'Theater Fly Rig'
    );
    s += plate(W / 2, 34, title, 'fl-title');

    // Overhead beam & pulley
    s += `<rect x="190" y="62" width="380" height="12" class="wk-beam"/>`;
    s += `<circle cx="320" cy="92" r="20" class="wk-pulley"/>`;
    s += `<line x1="300" y1="92" x2="300" y2="235" class="wk-strap"/>`;
    s += `<line x1="340" y1="92" x2="465" y2="260" class="wk-strap"/>`;

    // Crate / load
    s += `<rect x="258" y="${PF - 76}" width="84" height="76" rx="4" class="wk-crate wk-ghost-outline"/>`;
    s += crate(258, 225, 84, 72);

    // Labels on crate (weight / mass / MA)
    if (k === 'ma_find' || k === 'setup_ma' || k === 'ma_pull_c' || k === 'q_ma') {
      s += plate(300, 267, `F_out = ${fmt(sc.Fout)} N`, 'sv-small');
    } else if (k === 'ma_pull_2box' || k === 'ma_pull_h') {
      s += plate(300, 267, `m = ${fmt(sc.m)} kg`, '');
      if (k === 'ma_pull_2box') {
        s += plate(128, 200, solved.fout ? `F_out = ${fmt(sc.Fout)} N` : 'F_out = ?', 'wk-F-text');
      }
      s += plate(128, 130, 'g = 10 m/s²', 'sv-small');
    } else if (k === 'pulley_lift_h') {
      s += plate(300, 267, `m = ${fmt(sc.m)} kg`, '');
      s += dim(222, PF, 222, PF - 125, `h = ${fmt(sc.h)} m`, 'wk-d', 'left');
      s += plate(128, 125, 'g = 10 m/s²', 'sv-small');
    } else {
      s += plate(300, 267, 'Load', 'sv-small');
    }

    // Pull force arrow & label
    s += arrow(374, 136, 462, 255, 'wk-F', 6);
    const fLabel =
      (k === 'pulley_f' || k === 'setup_f' || (k === 'q_pulley' && sc.sub === 'f'))
        ? (solved.f || solved.qp ? `F = ${fmt(sc.F)} N` : 'F = ? N')
        : (k === 'ma_find' || k === 'setup_ma' || (k === 'q_ma' && sc.sub === 'ma'))
          ? `F_in = ${fmt(sc.Fin)} N`
          : (k === 'ma_pull_c' || k === 'ma_pull_2box' || k === 'ma_pull_h' || (k === 'q_ma' && sc.sub === 'fin'))
            ? (solved.fin || solved.qm ? `F_in = ${fmt(sc.Fin)} N` : 'F_in = ? N')
            : (k === 'pulley_lift_h')
              ? (solved.f ? `F = ${fmt(sc.F)} N` : 'F = ? N')
              : `F = ${fmt(sc.F)} N`;
    s += plate(426, 152, fLabel, 'wk-F-text', 'start');

    // Distance label
    if (k === 'pulley_d' || (k === 'q_pulley' && sc.sub === 'd')) {
      s += dim(556, 110, 556, 255, solved.d || solved.qp ? `d = ${fmt(sc.d)} m` : 'd = ? m', 'wk-d', 'right');
    } else if (sc.d !== undefined && k !== 'ma_find' && k !== 'setup_ma' && k !== 'ma_pull_c' && k !== 'ma_pull_2box' && k !== 'ma_pull_h' && k !== 'q_ma') {
      const dTxt = k === 'pulley_2step'
        ? (solved.w ? `d_2 = ${fmt(sc.d2)} m` : `d_1 = ${fmt(sc.d)} m`)
        : `d = ${fmt(sc.d)} m`;
      s += dim(556, 110, 556, 255, dTxt, 'wk-d', 'right');
    }

    // Work meter or MA badge
    if (k === 'pulley_w' || k === 'setup_w' || (k === 'q_pulley' && sc.sub === 'w')) {
      s += workMeter(565, 285, solved.w || solved.qp ? `${fmt(sc.W)} J` : '? J');
    } else if (k === 'pulley_f' || k === 'setup_f' || k === 'pulley_d' || k === 'q_pulley') {
      s += workMeter(565, 285, `${fmt(sc.W)} J`);
    } else if (k === 'pulley_2step') {
      s += workMeter(565, 285, solved.w ? `${fmt(sc.W)} J` : '? J');
      s += plate(W / 2, PF + 56, solved.f2 ? `Double Pulley: F_2 = ${fmt(sc.F2)} N` : (solved.w ? `Double Pulley: d_2 = ${fmt(sc.d2)} m → F_2 = ? N` : 'Step 1: Find Work W first'), 'fl-value wk-F-text');
      return frame(s);
    } else if (k === 'pulley_lift_h') {
      s += workMeter(565, 285, solved.w ? `${fmt(sc.W)} J` : '? J');
    } else if (k === 'ma_find' || k === 'setup_ma' || (k === 'q_ma' && sc.sub === 'ma')) {
      s += plate(W / 2, PF + 56, solved.ma || solved.qm ? `MA = ${fmt(sc.ma)}` : 'MA = ?', 'fl-value wk-MA-text');
      return frame(s);
    } else if (k === 'ma_pull_c' || k === 'ma_pull_2box' || k === 'ma_pull_h' || k === 'q_ma') {
      s += plate(585, 115, `MA = ${fmt(sc.ma)}`, 'fl-value wk-MA-text');
    }

    // Bottom readout summary
    const bottomTxt =
      (k === 'pulley_w' || k === 'setup_w' || (k === 'q_pulley' && sc.sub === 'w'))
        ? (solved.w || solved.qp ? `Work Done: W = ${fmt(sc.W)} J` : 'Work Done: W = ? J')
        : (k === 'pulley_f' || k === 'setup_f' || (k === 'q_pulley' && sc.sub === 'f'))
          ? (solved.f || solved.qp ? `Pull Force: F = ${fmt(sc.F)} N` : 'Pull Force: F = ? N')
          : (k === 'pulley_d' || (k === 'q_pulley' && sc.sub === 'd'))
            ? (solved.d || solved.qp ? `Rope Distance: d = ${fmt(sc.d)} m` : 'Rope Distance: d = ? m')
            : (k === 'pulley_lift_h')
              ? (solved.f ? `F = ${fmt(sc.F)} N` : solved.w ? `W = ${fmt(sc.W)} J → Find F` : 'Step 1: Find lifting work W')
              : (solved.fin || solved.qm ? `Pull Force: F_in = ${fmt(sc.Fin)} N` : 'Pull Force: F_in = ? N');
    s += plate(W / 2, PF + 56, bottomTxt, 'fl-value');
    return frame(s);
  }

  // Ramp & Rough-Ramp problems
  function ramp(sc, solved = {}) {
    let s = bayBackdrop(PF);
    const k = sc.kind;
    const isRough = k === 'rough_2box' || k === 'rough_3box_h' || k === 'q_rough';
    const title =
      k === 'ramp_givenW_f' ? 'Smooth Stage Loading Ramp' :
      k === 'ramp_givenW_d' || k === 'setup_d' ? 'Designing a Smooth Ramp' :
      k === 'ramp_ratio_c' ? 'Ramp Force–Distance Trade-Off' :
      k === 'ramp_2box_d_cp' || k === 'ramp_2box_d_h' ? 'Smooth Cart Ramp' :
      k === 'ramp_2box_h_cp' || k === 'ramp_2box_h_h' ? 'Smooth Refrigerator Loading Ramp' :
      k === 'ma_ramp_len' || k === 'ma_ramp_2box_h' ? 'Wheelchair Access Ramp' :
      k === 'q_ramp' ? 'Boat Trailer Ramp' :
      k === 'q_rough' ? 'Rough Moving-Van Ramp' :
      'Rough Loading Dock Ramp';
    s += plate(W / 2, 34, title, 'fl-title');

    // Ramp geometry: base x=140..500, dock x=500..690, top y=210, floor y=PF
    const rx0 = 140, rx1 = 500, ry1 = 210;
    s += `<polygon points="${rx0},${PF} ${rx1},${PF} ${rx1},${ry1}" class="wk-ramp"/>`;
    s += `<rect x="${rx1}" y="${ry1}" width="190" height="${PF - ry1}" class="wk-dock"/>`;
    if (isRough) {
      let spikes = '';
      for (let t = 0.08; t <= 0.92; t += 0.06) {
        const px = rx0 + (rx1 - rx0) * t, py = PF - (PF - ry1) * t;
        spikes += `M ${px.toFixed(1)} ${py.toFixed(1)} l -4 -7 `;
      }
      s += `<path d="${spikes}" class="wk-rough"/>`;
    }

    // Crate midway up ramp (rotated along slope)
    const ang = -Math.atan2(PF - ry1, rx1 - rx0) * 180 / Math.PI;
    const cx = 305, cy = PF - (PF - ry1) * ((cx - rx0) / (rx1 - rx0));
    s += `<g transform="translate(${cx} ${cy}) rotate(${ang.toFixed(1)})">${crate(-35, -52, 70, 50)}`;
    if (k === 'ramp_2box_d_cp' || k === 'ramp_2box_h_cp' || k === 'ramp_ratio_c') {
      s += plate(0, -21, `F_g = ${fmt(sc.Fg || sc.Fout)} N`, 'sv-small');
    } else if (k === 'ramp_2box_d_h' || k === 'ramp_2box_h_h' || k === 'ma_ramp_2box_h' || (k === 'q_ramp' && sc.sub === 'honors_d')) {
      s += plate(0, -21, `m = ${fmt(sc.m)} kg`, 'sv-small');
    }
    s += `</g>`;

    // Push arrow up the slope
    const rad = Math.abs(ang) * Math.PI / 180;
    const ux = Math.cos(rad), uy = -Math.sin(rad);
    s += arrow(cx - 85 * ux, cy - 85 * uy - 24, cx - 22 * ux, cy - 22 * uy - 24, 'wk-F', 6);
    const showF =
      (k === 'ramp_givenW_f' || k === 'ramp_ratio_c' || (k === 'q_ramp' && sc.sub === 'f'))
        ? (solved.f || solved.qr ? `F = ${fmt(sc.F)} N` : 'F = ? N')
        : (k === 'ma_ramp_len' || k === 'ma_ramp_2box_h')
          ? ''
          : `F = ${fmt(sc.F)} N`;
    if (showF) s += plate(cx - 125, cy - 40, showF, 'wk-F-text', 'end');

    // Ramp distance d along hypotenuse
    const dLabel =
      (k === 'ramp_givenW_d' || k === 'setup_d' || k === 'ramp_2box_d_cp' || k === 'ramp_2box_d_h' || k === 'ma_ramp_len' || k === 'ma_ramp_2box_h' || (k === 'q_ramp' && (sc.sub === 'd' || sc.sub === 'honors_d')))
        ? (solved.d || solved.qr ? `d = ${fmt(sc.d)} m` : 'd = ? m')
        : `d = ${fmt(sc.d)} m`;
    s += `<line x1="${rx0 - 12}" y1="${PF - 26}" x2="${rx1 - 12}" y2="${ry1 - 26}" stroke="var(--c-d)" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    s += plate((rx0 + rx1) / 2 - 42, (PF + ry1) / 2 - 44, dLabel, 'wk-d-text');

    // Vertical height h
    if (k !== 'ramp_givenW_f' && k !== 'ramp_givenW_d' && k !== 'setup_d' && !isRough && k !== 'q_ramp') {
      const hLabel = (k === 'ramp_2box_h_cp' || k === 'ramp_2box_h_h')
        ? (solved.h ? `h = ${fmt(sc.h)} m` : 'h = ? m')
        : `h = ${fmt(sc.h)} m`;
      s += dim(rx1 + 26, PF, rx1 + 26, ry1, hLabel, 'wk-d', 'right');
    } else if (k === 'q_ramp' && sc.sub === 'honors_d') {
      s += dim(rx1 + 26, PF, rx1 + 26, ry1, `h = ${fmt(sc.h)} m`, 'wk-d', 'right');
    }

    // Dock badges (Lift Work Needed W, MA, g = 10, or Rough-Ramp W_out / W_in / F_f)
    if (k === 'ramp_givenW_f' || k === 'ramp_givenW_d' || k === 'setup_d' || k === 'ramp_ratio_c' || (k === 'q_ramp' && sc.sub !== 'honors_d')) {
      s += workMeter(516, 126, `${fmt(sc.W)} J`, 'Work Needed (W)');
    } else if (k === 'ramp_2box_d_cp' || k === 'ramp_2box_h_cp' || k === 'ramp_2box_d_h' || k === 'ramp_2box_h_h') {
      s += workMeter(516, 126, solved.w ? `${fmt(sc.W)} J` : '? J', 'Lift Work (W)');
      if (k === 'ramp_2box_d_h' || k === 'ramp_2box_h_h') s += plate(115, 110, 'g = 10 m/s²', 'sv-small');
    } else if (k === 'ma_ramp_len' || k === 'ma_ramp_2box_h') {
      s += plate(595, 130, `MA = ${fmt(sc.ma)}`, 'fl-value wk-MA-text');
      if (k === 'ma_ramp_2box_h') {
        s += plate(115, 110, 'g = 10 m/s²', 'sv-small');
        s += workMeter(516, 232, solved.w ? `${fmt(sc.W)} J` : '? J', 'Lift Work (W)');
      }
    } else if (isRough) {
      s += arrow(cx + 30 * ux, cy + 30 * uy - 12, cx - 28 * ux, cy - 28 * uy - 12, 'wk-Ff', 4);
      s += plate(cx + 38, cy + 28, k === 'rough_3box_h' ? (solved.ff ? `F_f = ${fmt(sc.Ff)} N` : 'F_f = ?') : (k === 'q_rough' && sc.sub === 'ff' ? (solved.qf ? `F_f = ${fmt(sc.Ff)} N` : 'F_f = ?') : 'Friction'), 'sv-small wk-Ff-text', 'start');
      if (k === 'q_rough') {
        s += workMeter(516, 95, `${fmt(sc.Win)} J`, 'Input Work (W_in)');
        s += workMeter(516, 180, `${fmt(sc.Wout)} J`, 'Useful Lift (W_out)');
      } else {
        s += workMeter(516, 95, solved.win ? `${fmt(sc.Win)} J` : '? J', 'Input Work (W_in)');
        s += workMeter(516, 180, `${fmt(sc.Wout)} J`, 'Useful Lift (W_out)');
      }
    }

    const bottomTxt = isRough
      ? (solved.ff ? `Friction Force: F_f = ${fmt(sc.Ff)} N` : solved.wf ? `Lost to Friction: W_f = ${fmt(sc.Wf)} J` : 'Rough Ramp: W_f = W_in − W_out')
      : (k === 'ramp_ratio_c' ? `Ramp is ${sc.mult}× longer than lift height` : 'Smooth (Frictionless) Ramp');
    s += plate(W / 2, PF + 56, bottomTxt, isRough ? 'fl-value wk-Ff-text' : 'sv-small fl-dim');
    return frame(s);
  }

  // Student A vs Student B work comparison
  function compare(sc, solved = {}, tier = 'cp') {
    let s = bayBackdrop(PF);
    s += plate(W / 2, 34, 'Same box, same shelf height — lift straight up or push up a smooth ramp?', 'fl-title');
    const shelfY = 215;
    const loadLabel = tier === 'honors' ? `m = ${fmt(sc.m)} kg` : `F_g = ${fmt(sc.Fg)} N`;

    // Student A (left): straight lift
    s += `<rect x="190" y="${shelfY}" width="110" height="12" class="wk-dock"/>`;
    s += `<rect x="95" y="${PF - 52}" width="60" height="52" rx="4" class="wk-crate wk-ghost-outline"/>`;
    s += crate(95, shelfY - 52, 60, 52) + plate(125, shelfY - 22, loadLabel, 'sv-small');
    s += arrow(125, PF - 60, 125, shelfY + 12, 'wk-F', 5);
    s += dim(65, PF, 65, shelfY, `h = ${fmt(sc.h)} m`, 'wk-d', 'left');
    s += plate(175, PF + 50, solved.w ? `Student A: W_A = ${fmt(sc.W)} J` : 'Student A: straight lift', 'wk-W-text');

    // Student B (right): smooth ramp
    s += `<polygon points="360,${PF} 615,${PF} 615,${shelfY}" class="wk-ramp"/>`;
    s += `<rect x="615" y="${shelfY}" width="90" height="${PF - shelfY}" class="wk-dock"/>`;
    s += crate(500, shelfY - 52, 60, 52) + plate(530, shelfY - 22, loadLabel, 'sv-small');
    s += plate(475, 290, `d = ${fmt(sc.d)} m`, 'wk-d-text');
    s += dim(640, PF, 640, shelfY, `h = ${fmt(sc.h)} m`, 'wk-d', 'right');
    s += plate(555, PF + 50, solved.w ? `Student B: W_B = ${fmt(sc.W)} J` : 'Student B: smooth ramp', 'wk-W-text');
    if (tier === 'honors') s += plate(350, 86, 'g = 10 m/s²', 'sv-small');
    return frame(s);
  }

  // Day 2 callback: carrying flat (0 J)
  function carry0(sc, solved = {}) {
    let s = bayBackdrop(PF);
    s += plate(W / 2, 34, 'Day 2 Callback: Carrying a Pallet Across the Warehouse', 'fl-title');
    s += `<g opacity="0.28"><rect x="132" y="${PF - 122}" width="64" height="44" rx="3" class="wk-box"/>`
      + `<circle cx="164" cy="${PF - 148}" r="14" class="wk-p-skin"/><line x1="164" y1="${PF - 134}" x2="164" y2="${PF - 64}" class="wk-p-shirt"/>`
      + `<line x1="164" y1="${PF - 64}" x2="152" y2="${PF - 4}" class="wk-p-leg"/><line x1="164" y1="${PF - 64}" x2="176" y2="${PF - 4}" class="wk-p-leg"/></g>`;
    s += `<rect x="498" y="${PF - 122}" width="64" height="44" rx="3" class="wk-box"/>`;
    s += `<circle cx="530" cy="${PF - 148}" r="14" class="wk-p-skin"/><line x1="530" y1="${PF - 134}" x2="530" y2="${PF - 64}" class="wk-p-shirt"/>`;
    s += `<line x1="530" y1="${PF - 64}" x2="518" y2="${PF - 4}" class="wk-p-leg"/><line x1="530" y1="${PF - 64}" x2="542" y2="${PF - 4}" class="wk-p-leg"/>`;
    s += arrow(530, PF - 166, 530, PF - 246, 'wk-F', 6) + plate(544, PF - 230, `F_hand = ${fmt(sc.F)} N (up)`, 'wk-F-text', 'start');
    s += arrow(220, PF - 100, 460, PF - 100, 'wk-d', 5) + plate(340, PF - 120, `d = ${fmt(sc.d)} m (sideways)`, 'wk-d-text');
    s += `<path d="M 514 ${PF - 166} V ${PF - 182} H 530" class="wk-90-sq"/>`;
    s += plate(W / 2, PF + 56, solved.qc ? 'Work by hands: W = 0 J' : 'Work by hands: W = ? J', 'fl-value wk-W-text');
    return frame(s);
  }

  function forScenario(sc, solved = {}, tier = 'cp') {
    if (!sc) return tradeoffDemo(0, false);
    const k = sc.sceneKind || sc.kind;
    if (k === 'compare_ab') return compare(sc, solved, tier);
    if (k === 'q_carry0') return carry0(sc, solved);
    if (k.startsWith('ramp') || k.startsWith('rough') || k === 'ma_ramp_len' || k === 'ma_ramp_2box_h' || k === 'q_ramp' || k === 'q_rough') {
      return ramp(sc, solved);
    }
    return pulley(sc, solved, sc.title);
  }

  function makeTriangle(top, left, right, cover, aria) {
    const spots = {
      [top.id]: [65, 34, 15],
      [left.id]: [43, 73, 14],
      [right.id]: [87, 73, 14]
    };
    const ring = cover && spots[cover]
      ? `<circle cx="${spots[cover][0]}" cy="${spots[cover][1]}" r="${spots[cover][2]}" fill="color-mix(in srgb, var(--accent) 18%, transparent)" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 2"/>`
      : '';
    return `<svg viewBox="0 0 130 100" width="92" height="70" aria-label="${esc(aria)}">`
      + `<polygon points="65,8 122,92 8,92" fill="var(--bg-card)" stroke="var(--accent)" stroke-width="2.5"/>`
      + `<line x1="36" y1="52" x2="94" y2="52" stroke="var(--text-dim)" stroke-width="2"/>`
      + `<line x1="65" y1="52" x2="65" y2="92" stroke="var(--text-dim)" stroke-width="2"/>`
      + ring
      + `<text x="65" y="41" text-anchor="middle" class="sv-text ${top.cls}" font-size="18">${rich(top.label)}</text>`
      + `<text x="43" y="79" text-anchor="middle" class="sv-text ${left.cls}" font-size="16">${rich(left.label)}</text>`
      + `<text x="87" y="79" text-anchor="middle" class="sv-text ${right.cls}" font-size="16">${rich(right.label)}</text>`
      + `</svg>`;
  }

  function triangleSVG(cover = null) {
    return makeTriangle(
      { id: 'W', label: 'W', cls: 'wk-W-text' },
      { id: 'F', label: 'F', cls: 'wk-F-text' },
      { id: 'd', label: 'd', cls: 'wk-d-text' },
      cover,
      'Work formula triangle: W on top, F and d on bottom'
    );
  }

  function maTriangleSVG(cover = null) {
    return makeTriangle(
      { id: 'Fout', label: 'F_out', cls: 'wk-F-text' },
      { id: 'MA', label: 'MA', cls: 'wk-MA-text' },
      { id: 'Fin', label: 'F_in', cls: 'wk-F-text' },
      cover,
      'Mechanical advantage triangle: F_out on top, MA and F_in on bottom'
    );
  }

  function frictionBarHTML(sc, solved = {}) {
    const outPct = Math.max(30, Math.min(68, Math.round((sc.Wout / sc.Win) * 100)));
    const inTxt = solved.win ? `${fmt(sc.Win)} J` : '? J';
    const wfTxt = solved.wf ? `${fmt(sc.Wf)} J` : '? J';
    return `<div class="fric-bar" aria-label="Energy work split: total input work equals useful lift plus friction loss">`
      + `<div class="fb-in"><span>Total Push Work (W_in): ${inTxt}</span></div>`
      + `<div class="fb-split">`
      + `<div class="fb-out" style="width:${outPct}%">Useful (W_out): ${fmt(sc.Wout)} J</div>`
      + `<div class="fb-loss" style="width:${100 - outPct}%">Friction (W_f): ${wfTxt}</div>`
      + `</div></div>`;
  }

  window.Scene = { tradeoffDemo, pulley, ramp, compare, carry0, forScenario, triangleSVG, maTriangleSVG, frictionBarHTML };
})();

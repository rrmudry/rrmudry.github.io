// Monkey Hunter Studio — the picture. Every view is drawn as SVG so it stays sharp on a projector.
// Colors are fixed for the whole lesson: purple = the stick (the inertial path, along v_o), blue = v_ox, orange = v_oy,
// rose = a drop (every string, on the ball and on the monkey). Distances use one scale both ways, so the arc is true to life.
// Views: hunt (stick, strings, ball, monkey), rig (the meter stick the student builds and tilts), ruler (the drop test), pair (dropped and sideways).

(function () {
  const W = 760, H = 520;
  const GROUND = 464, LEFT = 66, RIGHT = 700, TOP = 34;
  const CHEST = 7;          // the monkey's chest sits this far below the point monkey() is drawn from
  const RIG_SCALE = 3.8;    // the rig keeps one scale, so tilting never changes how long a string looks
  const SUB_RE = /\b(v)_(ox|oy|o)\b/g;

  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const fmt = v => window.PR.fmt(v);
  const G = () => window.PR.G;

  // Real subscripts inside SVG text
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

  // Label on a soft plate so it stays readable over lines and arcs
  function plate(x, y, str, cls, anchor = 'middle') {
    const w = String(str).replace(/_/g, '').length * 9.2 + 12;
    const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w + 6 : x - 6;
    const cx = Math.max(4, Math.min(W - w - 4, left));
    return `<rect x="${cx}" y="${y - 17}" width="${w}" height="24" rx="5" class="sv-plate"/>${text(cx + w / 2, y, str, cls)}`;
  }

  function arrow(x1, y1, x2, y2, cls, width = 5) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 3) return '';
    const head = Math.min(width * 3, len * 0.6);
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const bx = x2 - ux * head, by = y2 - uy * head;
    const nx = -uy * head * 0.55, ny = ux * head * 0.55;
    return `<g class="${cls}"><line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke-width="${width}" stroke-linecap="round"/><polygon points="${x2},${y2} ${bx + nx},${by + ny} ${bx - nx},${by - ny}"/></g>`;
  }

  const frame = inner => `<svg viewBox="0 0 ${W} ${H}" class="scene-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">${inner}</svg>`;
  const backdrop = () => `<rect x="-1500" y="${GROUND}" width="${W + 3000}" height="${H - GROUND}" class="sv-ground"/><line x1="-1500" y1="${GROUND}" x2="${W + 1500}" y2="${GROUND}" class="sv-ground-line"/>`;

  // ---------- Parts ----------
  function launcher(x, y, angle, towerTop) {
    const c = Math.cos(angle), s = Math.sin(angle);
    let g = '';
    if (towerTop !== undefined && towerTop < GROUND - 1) g += `<rect x="${x - 15}" y="${towerTop + 7}" width="30" height="${GROUND - towerTop - 7}" class="sv-tower"/>`;
    g += `<line x1="${x}" y1="${y}" x2="${x + 28 * c}" y2="${y - 28 * s}" class="sv-barrel"/>`;
    g += `<circle cx="${x}" cy="${y}" r="9" class="sv-launcher"/>`;
    return g;
  }

  function monkey(x, y, falling) {
    const armY = falling ? y - 26 : y - 29;
    return `<g class="sv-monkey">
      <path d="M ${x + 8} ${y + 14} q 16 6 13 -12" class="sv-tail"/>
      <line x1="${x - 7}" y1="${y - 4}" x2="${x - 11}" y2="${armY}" class="sv-limb"/>
      <line x1="${x + 7}" y1="${y - 4}" x2="${x + 11}" y2="${armY}" class="sv-limb"/>
      <line x1="${x - 5}" y1="${y + 14}" x2="${x - 10}" y2="${y + 25}" class="sv-limb"/>
      <line x1="${x + 5}" y1="${y + 14}" x2="${x + 10}" y2="${y + 25}" class="sv-limb"/>
      <ellipse cx="${x}" cy="${y + 7}" rx="9.5" ry="11" class="sv-fur"/>
      <circle cx="${x - 11}" cy="${y - 11}" r="4.5" class="sv-fur"/><circle cx="${x + 11}" cy="${y - 11}" r="4.5" class="sv-fur"/>
      <circle cx="${x}" cy="${y - 11}" r="10.5" class="sv-fur"/>
      <ellipse cx="${x}" cy="${y - 8.5}" rx="7" ry="6" class="sv-face"/>
      <circle cx="${x - 3}" cy="${y - 11}" r="1.5" class="sv-eye"/><circle cx="${x + 3}" cy="${y - 11}" r="1.5" class="sv-eye"/>
    </g>`;
  }

  function burst(x, y) {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const r = i % 2 ? 11 : 27, a = i * Math.PI / 8;
      pts.push(`${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" class="sv-burst"/>`;
  }

  // The meter stick: a thick bar with a tick at every mark
  function stick(x0, y0, x1, y1, ticks) {
    let g = `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" class="sv-stick"/>`;
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = -(y1 - y0) / len * 7, ny = (x1 - x0) / len * 7;
    ticks.forEach(([x, y]) => { g += `<line x1="${x - nx}" y1="${y - ny}" x2="${x + nx}" y2="${y + ny}" class="sv-tick"/>`; });
    return g;
  }

  const stringLine = (x, y0, y1) => `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" class="sv-string"/>`;

  function star(x, y) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 5 : 12, a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push(`${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" class="sv-star"/>`;
  }

  // Bracket beside a height or under a distance
  function heightBar(x, yBottom, yTop, label) {
    return `<line x1="${x}" y1="${yBottom}" x2="${x}" y2="${yTop}" class="sv-dim"/><line x1="${x - 7}" y1="${yTop}" x2="${x + 7}" y2="${yTop}" class="sv-dim"/><line x1="${x - 7}" y1="${yBottom}" x2="${x + 7}" y2="${yBottom}" class="sv-dim"/>${plate(x, (yBottom + yTop) / 2 + 6, label, 'sv-dim-text')}`;
  }

  // ---------- The hunt ----------
  // o = { sc, t, gravity, g, hold, early, noMonkey, noStrings, stickT, markLabels, starAt, aimH, labels, note }
  // Time runs from the moment of launch. Strings show where the ball is below the stick at each passed second.
  function hunt(o) {
    const PR = window.PR, sc = o.sc, L = o.labels || {};
    const g0 = o.gravity === false ? 0 : (o.g === undefined ? G() : o.g);
    const t = o.t || 0;
    const T = sc.t;
    const branchH = o.branchH === undefined ? sc.H : o.branchH;
    const aimVoy = o.aimH === undefined ? sc.voy : o.aimH / T;
    const stickT = o.stickT === undefined ? T : o.stickT;
    const lineTop = aimVoy * stickT;
    const widest = Math.max(sc.vox * stickT, o.noMonkey ? 0 : sc.D);
    const tallest = Math.max(lineTop, branchH);
    const s = Math.min((RIGHT - LEFT - (o.noMonkey ? 0 : 26)) / Math.max(widest, 1), (GROUND - TOP - (o.noMonkey ? 22 : 50)) / Math.max(tallest, 1));
    const X = u => LEFT + s * sc.vox * u;
    const YH = h => GROUND - s * h;
    const lineH = u => aimVoy * u;
    const dropOf = u => 0.5 * g0 * u * u;
    const landT = g0 > 0 ? 2 * aimVoy / g0 : Infinity;
    const uBall = Math.min(t, landT);
    const ballH = u => Math.max(0, lineH(u) - dropOf(u));
    const angle = Math.atan2(aimVoy, sc.vox);

    let g = backdrop();

    // Tree and branch
    const treeX = X(T);
    if (!o.noMonkey) {
      const limbY = YH(branchH) - CHEST - 29;   // the arms reach up to the branch from a monkey whose chest is at height H
      g += `<rect x="${treeX + 16}" y="${limbY - 14}" width="15" height="${GROUND - limbY + 14}" class="sv-trunk"/>`;
      g += `<line x1="${treeX - 22}" y1="${limbY}" x2="${treeX + 24}" y2="${limbY}" class="sv-branch"/>`;
    }

    // The stick and its marks
    const marks = [];
    for (let i = 1; i <= Math.floor(stickT + 1e-6); i++) marks.push([X(i), YH(lineH(i))]);
    g += stick(X(0), YH(0), X(stickT), YH(lineH(stickT)), marks);
    if (o.markLabels) {
      for (let i = 1; i <= Math.floor(stickT + 1e-6); i++) {
        const atMonkey = !o.noMonkey && Math.abs(i - T) < 1e-6;   // clear of the monkey's arm
        g += text(X(i) - (atMonkey ? 24 : 12), YH(lineH(i)) - 12, `${i} s`, 'sv-small', 'end');
      }
    }

    // Aim point when the stick does not point at the monkey
    if (o.aimH !== undefined && !o.noMonkey) {
      g += `<line x1="${treeX}" y1="${YH(branchH)}" x2="${treeX}" y2="${YH(o.aimH)}" class="sv-aim-gap"/>`;
      g += star(treeX, YH(o.aimH));
    }

    // Launch triangle: the first second of the stick split into its two parts
    if (L.vox) {
      const ex = X(1), ey = YH(0);
      g += arrow(X(0), ey, ex, ey, 'sv-x', 4);
      g += plate((X(0) + ex) / 2 + 10, ey + 22, `v_ox = ${fmt(sc.vox)} m/s`, 'sv-x-text');
    }
    if (L.voy) {
      const ex = X(1);
      g += arrow(ex, YH(0), ex, YH(lineH(1)), 'sv-y', 4);
      g += plate(ex + 10, (YH(0) + YH(lineH(1))) / 2 + 6, `v_oy = ${fmt(aimVoy)} m/s`, 'sv-y-text', 'start');
    }
    if (L.v0) g += plate(X(0) + 96, YH(0) - 76, typeof L.v0 === 'string' ? L.v0 : `v_o = ${fmt(sc.v0)} m/s`, 'sv-v-text', 'end');
    if (L.th) g += text(X(0) + 58 * Math.cos(angle / 2), YH(0) - 58 * Math.sin(angle / 2) + 6, `${fmt(sc.th)}°`, 'sv-angle');

    // Strings left behind at every passed second
    if (!o.noStrings && g0 > 0) {
      for (let i = 1; i <= Math.floor(uBall + 1e-6); i++) {
        if (Math.abs(i - uBall) < 1e-6) break;
        const y0 = YH(lineH(i)), y1 = YH(ballH(i));
        g += stringLine(X(i), y0, y1) + `<circle cx="${X(i)}" cy="${y1}" r="6" class="sv-ghost"/>`;
      }
    }
    if (o.fullPath && g0 > 0) {
      const pts = [];
      for (let i = 0; i <= 60; i++) { const u = uBall * i / 60; pts.push(`${X(u).toFixed(1)},${YH(ballH(u)).toFixed(1)}`); }
      if (uBall > 0) g += `<polyline points="${pts.join(' ')}" class="sv-path"/>`;
    }

    // The monkey, and its own string from the branch
    if (!o.noMonkey) {
      const mDrop = (o.hold || g0 === 0) ? 0 : dropOf(t + (o.early || 0));
      const hM = Math.max(0, branchH - mDrop);
      const moved = mDrop > 0;
      const onGround = hM <= 0;
      const atY = onGround ? GROUND - 26 : YH(hM) - CHEST;
      if (moved && !o.noStrings) {
        // Hangs from where the monkey started, the same length as the ball's string
        const stringEnd = Math.min(atY + CHEST, GROUND);
        g += stringLine(treeX, YH(branchH), stringEnd);
        if (!o.stringLabelBallOnly) g += plate(treeX + 24, (YH(branchH) + stringEnd) / 2 + 6, `${fmt(Math.min(mDrop, branchH))} m`, 'sv-string-text', 'start');
      }
      g += monkey(treeX, atY, moved);
    }

    if (L.H) g += heightBar(treeX + 56, GROUND, YH(branchH), L.H === true ? `H = ${fmt(branchH)} m` : L.H);
    if (L.D) {
      const y = L.vox ? GROUND + 42 : GROUND + 26;
      g += `<line x1="${X(0)}" y1="${y}" x2="${treeX}" y2="${y}" class="sv-dim"/><line x1="${X(0)}" y1="${y - 7}" x2="${X(0)}" y2="${y + 7}" class="sv-dim"/><line x1="${treeX}" y1="${y - 7}" x2="${treeX}" y2="${y + 7}" class="sv-dim"/>`;
      g += plate((X(0) + treeX) / 2 + 36, y + 6, L.D === true ? `ΔX = ${fmt(sc.D)} m` : L.D, 'sv-dim-text');
    }
    if (o.starAt !== undefined) g += star(X(o.starAt), YH(lineH(o.starAt)));

    g += launcher(X(0), YH(0), angle);
    marks.forEach(([x, y]) => { g += `<circle cx="${x}" cy="${y}" r="5.5" class="sv-mark"/>`; });

    // The live ball, hanging from the stick on its string
    const moving = t > 0;
    if (moving) {
      const bx = X(uBall), by = YH(ballH(uBall)), ly = YH(lineH(uBall));
      if (g0 > 0 && !o.noStrings) {
        g += stringLine(bx, ly, by);
        if (dropOf(uBall) >= 4) g += plate(bx - 12, (ly + by) / 2 + 6, `${fmt(Math.round(dropOf(uBall)))} m`, 'sv-string-text', 'end');
      }
      g += `<circle cx="${bx}" cy="${by}" r="9" class="sv-ball"/>`;
      if (!o.noMonkey && (!o.hold || o.aimH !== undefined) && !o.early && g0 > 0 && Math.abs(t - T) < 1e-6 && ballH(T) > 0) g += burst(bx, by) + `<circle cx="${bx}" cy="${by}" r="9" class="sv-ball"/>`;
    } else {
      g += `<circle cx="${X(0)}" cy="${YH(0)}" r="6" class="sv-ball"/>`;
    }
    if (o.note) g += plate(W / 2, 26, o.note, 'sv-note');
    return frame(g);
  }

  // Launch time for the replay: stops when the ball arrives, or lands first
  function huntEnd(sc, voy) {
    return Math.min(sc.t, 2 * (voy === undefined ? sc.voy : voy) / G());
  }

  // ---------- The rig: the student's meter stick with balls hanging from it ----------
  // o = { tilt (deg), speed (m/s per mark), strings: [..], t, drag, active, showCurve }
  function rigGeom(o) {
    const a = window.PR.rad(o.tilt || 0), v = o.speed || 30;
    const vox = v * Math.cos(a), voy = v * Math.sin(a);
    const h0 = Math.max(0, 80 - 4 * voy) + 6;
    const X = u => LEFT + RIG_SCALE * vox * u;
    const YH = h => GROUND - RIG_SCALE * h;
    return { a, v, vox, voy, h0, X, YH, markX: i => X(i + 1), markY: i => YH(h0 + voy * (i + 1)), scale: RIG_SCALE };
  }

  function rig(o) {
    const q = rigGeom(o), { vox, voy, h0, X, YH } = q;
    const strings = o.strings || window.PR.DROPS;
    const t = o.t || 0;
    let g = backdrop();
    const ticks = strings.map((_, i) => [q.markX(i), q.markY(i)]);
    g += stick(X(0), YH(h0), X(4.25), YH(h0 + voy * 4.25), ticks);
    strings.forEach((len, i) => {
      const x = q.markX(i), y0 = q.markY(i), y1 = y0 + len * RIG_SCALE;
      g += stringLine(x, y0, y1);
      const reached = o.playing !== false && t >= i + 1 - 1e-6;
      if (o.drag) {
        g += `<circle cx="${x}" cy="${y1}" r="17" class="sv-handle ${o.active === i ? 'sv-handle-on' : ''}"/>`;
        g += plate(x + 21, y1 + 6, `${len} m`, 'sv-string-text', 'start');
      }
      g += `<circle cx="${x}" cy="${y1}" r="9" class="sv-hang ${reached ? 'sv-hang-hit' : ''}"/>`;
      if (!o.drag) g += plate(x + (len < 15 ? 20 : 14), (y0 + y1) / 2 + 6 + (len < 15 ? 12 : 0), `${len} m`, 'sv-string-text', 'start');
      g += text(x - 10, y0 - 13, `${i + 1} s`, 'sv-small', 'end');
    });
    if (t > 0) {
      const pts = [];
      for (let i = 0; i <= 60; i++) { const u = t * i / 60; pts.push(`${X(u).toFixed(1)},${YH(h0 + voy * u - 5 * u * u).toFixed(1)}`); }
      g += `<polyline points="${pts.join(' ')}" class="sv-path"/>`;
    }
    g += launcher(X(0), YH(h0), q.a, h0 > 0.5 ? YH(h0) : undefined);
    g += `<circle cx="${X(t)}" cy="${YH(h0 + voy * t - 5 * t * t)}" r="10" class="sv-ball"/>`;
    if (o.note) g += plate(W / 2, 26, o.note, 'sv-note');
    return frame(g);
  }

  // ---------- The drop test: a dropped ball beside a ruler ----------
  // o = { t, at (the second being read) }. No number sits beside the ball: the student reads the ruler.
  function ruler(o) {
    const PR = window.PR, s = 4.75, top = 48, cx = 300, rx = 366;
    const t = o.t || 0;
    const Y = d => top + d * s;
    let g = backdrop();
    g += `<rect x="${cx - 110}" y="${top - 10}" width="96" height="${GROUND - top + 10}" class="sv-tower"/>`;
    g += `<line x1="${cx - 14}" y1="${top}" x2="${cx + 14}" y2="${top}" class="sv-branch"/>`;
    g += `<rect x="${rx}" y="${top - 12}" width="74" height="${GROUND - top + 12}" rx="3" class="sv-ruler"/>`;
    for (let d = 0; d <= 85; d += 5) {
      const big = d % 20 === 0;
      if (Y(d) > GROUND) break;
      g += `<line x1="${rx}" y1="${Y(d)}" x2="${rx + (big ? 26 : 14)}" y2="${Y(d)}" class="sv-ruler-tick ${big ? 'sv-ruler-big' : ''}"/>`;
      if (big) g += text(rx + 32, Y(d) + 6, `${d}`, 'sv-ruler-num', 'start');
    }
    g += text(rx + 37, top - 20, 'drop (m)', 'sv-small');
    const whole = Math.floor(t + 1e-6);
    for (let i = 1; i <= whole; i++) {
      if (Math.abs(i - t) < 1e-6) break;
      g += `<circle cx="${cx}" cy="${Y(PR.dropAt(i))}" r="7" class="sv-ghost"/>${text(cx - 18, Y(PR.dropAt(i)) + 6, `${i} s`, 'sv-small', 'end')}`;
    }
    const by = Y(PR.dropAt(t));
    if (t > 0) g += `<line x1="${cx}" y1="${by}" x2="${rx + 14}" y2="${by}" class="sv-pointer"/>`;
    g += `<circle cx="${cx}" cy="${by}" r="10" class="sv-ball"/>`;
    if (o.note) g += plate(cx - 170, 90, o.note, 'sv-note');
    return frame(g);
  }

  // ---------- Dropped and launched sideways, side by side, same drop ----------
  function pair(o) {
    const PR = window.PR, s = 4.9, y0 = GROUND - 80 * s, ax = 110, vx = 25;
    const t = Math.min(o.t || 0, 4);
    const Y = u => y0 + PR.dropAt(u) * s;
    const BX = u => ax + 32 + vx * u * s;
    let g = backdrop();
    g += `<rect x="${ax - 58}" y="${y0 + 10}" width="46" height="${GROUND - y0 - 10}" class="sv-tower"/><rect x="${ax - 58}" y="${y0 + 6}" width="210" height="6" class="sv-tower"/>`;
    for (let i = 1; i <= Math.floor(t + 1e-6); i++) {
      g += `<line x1="${ax}" y1="${Y(i)}" x2="${BX(i)}" y2="${Y(i)}" class="sv-level"/>`;
      g += plate(BX(i) + 44, Y(i) + 6, `${PR.dropAt(i)} m`, 'sv-string-text', 'middle');
      g += `<circle cx="${ax}" cy="${Y(i)}" r="6" class="sv-ghost"/><circle cx="${BX(i)}" cy="${Y(i)}" r="6" class="sv-ghost"/>`;
    }
    if (t > 0) {
      const pts = [];
      for (let i = 0; i <= 40; i++) { const u = t * i / 40; pts.push(`${BX(u).toFixed(1)},${Y(u).toFixed(1)}`); }
      g += `<polyline points="${pts.join(' ')}" class="sv-path"/>`;
    }
    g += `<circle cx="${ax}" cy="${Y(t)}" r="10" class="sv-ball"/><circle cx="${BX(t)}" cy="${Y(t)}" r="10" class="sv-ball sv-ball-b"/>`;
    g += text(ax - 22, y0 - 4, 'A', 'sv-tag');
    g += text(BX(0) + 18, y0 - 4, 'B', 'sv-tag');
    return frame(g);
  }

  function render(o) {
    if (o.mode === 'rig') return rig(o);
    if (o.mode === 'ruler') return ruler(o);
    if (o.mode === 'pair') return pair(o);
    return hunt(o);
  }

  window.Scene = { render, rigGeom, huntEnd, W, H };
})();

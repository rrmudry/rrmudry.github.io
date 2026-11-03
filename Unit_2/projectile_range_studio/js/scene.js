// Projectile Range Studio — the picture. Every view is drawn as SVG so it stays sharp on a projector.
// Colors are fixed for the whole lesson: blue = v_ox, orange = v_oy, purple = v_o.
// Views: flight (the ball with its arrows), launch (the split triangle), grid (vector diagram), compare (two arcs).
// Flight distances use one scale in both directions, so the arc is true to life. Arrows are velocities, not distances.

(function () {
  const W = 760, H = 520;
  const GROUND = 464, LEFT = 60, RIGHT = 722, TOP = 44;
  const SUB_RE = /\b(v)_(ox|oy|o)\b/g;

  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const fmt = v => window.PR.fmt(v);

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

  function text(x, y, str, cls = '', anchor = 'middle') {
    return `<text x="${x}" y="${y}" class="sv-text ${cls}" text-anchor="${anchor}">${rich(str)}</text>`;
  }

  // Label on a soft plate so it stays readable over grid lines and arcs
  function plate(x, y, str, cls, anchor = 'middle') {
    const w = String(str).replace(/_/g, '').length * 9.4 + 12;
    const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w + 6 : x - 6;
    const cx = Math.max(4, Math.min(W - w - 4, left));
    return `<rect x="${cx}" y="${y - 17}" width="${w}" height="24" rx="5" class="sv-plate"/>${text(cx + w / 2, y, str, cls)}`;
  }

  function arrow(x1, y1, x2, y2, cls, width = 5, opacity = 1) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 3) return '';
    const head = Math.min(width * 3, len * 0.6);
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const bx = x2 - ux * head, by = y2 - uy * head;
    const nx = -uy * head * 0.55, ny = ux * head * 0.55;
    return `<g class="${cls}" opacity="${opacity}"><line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke-width="${width}" stroke-linecap="round"/><polygon points="${x2},${y2} ${bx + nx},${by + ny} ${bx - nx},${by - ny}"/></g>`;
  }

  const frame = inner => `<svg viewBox="0 0 ${W} ${H}" class="scene-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">${inner}</svg>`;
  const backdrop = () => `<rect x="-1500" y="${GROUND}" width="${W + 3000}" height="${H - GROUND}" class="sv-ground"/><line x1="-1500" y1="${GROUND}" x2="${W + 1500}" y2="${GROUND}" class="sv-ground-line"/>`;

  // ---------- Flight ----------
  function flightScale(sc) {
    return Math.min((RIGHT - LEFT) / Math.max(window.PR.range(sc), 1), (GROUND - TOP) / Math.max(window.PR.apex(sc), 1));
  }

  function flight(o) {
    const PR = window.PR, sc = o.sc;
    const T = PR.hangTime(sc), t = Math.min(o.t === undefined ? 0 : o.t, T);
    const s = flightScale(sc);
    const X = u => LEFT + s * sc.vox * u;
    const Y = u => GROUND - s * (sc.voy * u - 0.5 * PR.G * u * u);
    const pxSec = s * sc.vox;
    // Arrows must not run into the next second's ball. One size per flight, so the sizes can be compared.
    const k = Math.min(3, sc.vox > 0 ? pxSec * 0.72 / sc.vox : 3);
    const view = o.view || 'both';
    const showX = view === 'x' || view === 'both', showY = view === 'y' || view === 'both';
    let g = backdrop();

    const pathTo = u => {
      const pts = [];
      for (let i = 0; i <= 60; i++) pts.push(`${X(u * i / 60).toFixed(1)},${Y(u * i / 60).toFixed(1)}`);
      return pts.join(' ');
    };
    if (o.fullPath) g += `<polyline points="${pathTo(T)}" class="sv-path-faint"/>`;
    if (t > 0) g += `<polyline points="${pathTo(t)}" class="sv-path"/>`;

    // One tile on the ground per second: the sideways distance is built out of equal steps
    if (o.tiles) {
      const whole = Math.floor(t + 1e-6);
      for (let i = 0; i < whole; i++) {
        g += `<rect x="${X(i)}" y="${GROUND + 2}" width="${pxSec}" height="20" class="sv-tile ${i % 2 ? 'sv-tile-alt' : ''}"/>`;
        if (pxSec >= 42) g += text(X(i) + pxSec / 2, GROUND + 18, `${fmt(sc.vox)} m`, 'sv-tile-text');
      }
    }

    const wholeSeconds = Math.floor(t + 1e-6);
    for (let i = 0; i <= wholeSeconds; i++) {
      if (Math.abs(i - t) < 1e-6) break;   // the live ball is drawn below
      const vy = sc.voy - PR.G * i;
      if (showX && !o.hideValues) g += arrow(X(i), Y(i), X(i) + sc.vox * k, Y(i), 'sv-x', 3, 0.42);
      if (showY && !o.hideValues) g += arrow(X(i), Y(i), X(i), Y(i) - vy * k, 'sv-y', 3, 0.42);
      g += `<circle cx="${X(i)}" cy="${Y(i)}" r="5" class="sv-ghost"/>`;
    }
    if (!o.tiles && o.secondMarks) {
      for (let i = 1; i <= wholeSeconds; i++) g += `<line x1="${X(i)}" y1="${Y(i)}" x2="${X(i)}" y2="${GROUND}" class="sv-drop"/>${text(X(i), GROUND + 20, `${i} s`, 'sv-small')}`;
    }

    if (o.flag !== undefined) {
      const fx = LEFT + s * o.flag;
      g += `<line x1="${fx}" y1="${GROUND}" x2="${fx}" y2="${GROUND - 44}" class="sv-flagpole"/><polygon points="${fx},${GROUND - 44} ${fx + 22},${GROUND - 36} ${fx},${GROUND - 28}" class="sv-flag"/>`;
    }

    // The live ball with bold arrows and values
    const landed = t >= T - 1e-6;
    const bx = X(t), by = Y(t), vyNow = sc.voy - PR.G * t;
    if (!landed || o.keepArrows) {
      if (showX) {
        g += arrow(bx, by, bx + sc.vox * k, by, 'sv-x', 5);
        if (!o.hideValues) g += plate(bx + sc.vox * k + 8, by + 5, `v_ox = ${fmt(sc.vox)} m/s`, 'sv-x-text', 'start');
      }
      if (showY) {
        g += arrow(bx, by, bx, by - vyNow * k, 'sv-y', 5);
        if (!o.hideValues) {
          // Whole numbers only, so the label stays calm while the ball is moving between seconds
          const shown = Math.round(Math.abs(vyNow));
          const atTop = Math.abs(vyNow) < 1e-6;
          const up = vyNow >= 0;
          const label = shown === 0 ? 'v_oy = 0' : `v_oy = ${shown} m/s ${up ? 'up' : 'down'}`;
          const ly = atTop ? by - 16 : up ? by - vyNow * k - 8 : by - vyNow * k + 20;
          g += plate(bx, Math.max(22, Math.min(GROUND - 6, ly)), label, 'sv-y-text', 'end');
        }
      }
    }
    g += `<circle cx="${bx}" cy="${by}" r="9" class="sv-ball"/>`;

    if (o.showRange && landed) {
      const y = H - 18;
      g += arrow(LEFT + 20, y, LEFT, y, 'sv-range', 2.5) + arrow(X(T) - 20, y, X(T), y, 'sv-range', 2.5);
      g += `<line x1="${LEFT + 20}" y1="${y}" x2="${X(T) - 20}" y2="${y}" class="sv-range-line"/>`;
      g += plate((LEFT + X(T)) / 2, y + 6, `ΔX = ${fmt(o.rangeValue !== undefined ? o.rangeValue : PR.range(sc))} m`, 'sv-range-text');
    }
    if (o.note) g += plate(W / 2, 28, o.note, 'sv-note');
    return frame(g);
  }

  // ---------- The split triangle: v_o, then v_ox along the ground and v_oy up the far side ----------
  function launch(o) {
    const sc = o.sc, L = o.labels || {};
    const ox = 170, oy = GROUND - 26;
    const k = Math.min(430 / sc.vox, 350 / sc.voy, 14);
    const tx = ox + sc.vox * k, ty = oy - sc.voy * k;
    let g = backdrop();
    g += `<circle cx="${ox}" cy="${oy}" r="9" class="sv-ball"/>`;
    if (L.vox !== undefined) {
      g += arrow(ox, oy, tx, oy, 'sv-x', 7);
      g += plate((ox + tx) / 2, oy + 30, L.vox === true ? `v_ox = ${fmt(sc.vox)} m/s` : L.vox, 'sv-x-text');
    }
    if (L.voy !== undefined) {
      g += arrow(tx, oy, tx, ty, 'sv-y', 7);
      g += plate(tx + 12, (oy + ty) / 2 + 5, L.voy === true ? `v_oy = ${fmt(sc.voy)} m/s` : L.voy, 'sv-y-text', 'start');
    }
    g += arrow(ox, oy, tx, ty, 'sv-v', 7);
    if (L.v0) {
      g += plate((ox + tx) / 2 - 18, (oy + ty) / 2 - 10, L.v0 === true ? (sc.v0 ? `v_o = ${fmt(sc.v0)} m/s` : 'v_o') : L.v0, 'sv-v-text', 'end');
    }
    if (L.th) {
      const a = Math.atan2(sc.voy, sc.vox), r = 52;
      g += `<path d="M ${ox + r} ${oy} A ${r} ${r} 0 0 0 ${ox + r * Math.cos(a)} ${oy - r * Math.sin(a)}" class="sv-arc"/>`;
      g += text(ox + 74 * Math.cos(a / 2), oy - 74 * Math.sin(a / 2) + 6, `${sc.th}°`, 'sv-angle');
    }
    if (o.note) g += plate(W / 2, 28, o.note, 'sv-note');
    return frame(g);
  }

  // ---------- Vector diagram on a grid: read the arrows by counting squares ----------
  function grid(o) {
    const sc = o.sc, L = o.labels || {};
    // Same grid every time, so a square always looks the same size and only the scale changes
    const cols = 10, rows = 8, cell = 52;
    const left = 40, bottom = H - 50;
    const gw = cols * cell, gh = rows * cell;
    const X = c => left + c * cell, Y = r => bottom - r * cell;
    let g = '';
    for (let c = 0; c <= cols; c++) g += `<line x1="${X(c)}" y1="${bottom}" x2="${X(c)}" y2="${bottom - gh}" class="sv-grid"/>`;
    for (let r = 0; r <= rows; r++) g += `<line x1="${left}" y1="${Y(r)}" x2="${left + gw}" y2="${Y(r)}" class="sv-grid"/>`;
    g += arrow(X(0), Y(0), X(sc.gx), Y(0), 'sv-x', 7);
    g += arrow(X(sc.gx), Y(0), X(sc.gx), Y(sc.gy), 'sv-y', 7);
    g += arrow(X(0), Y(0), X(sc.gx), Y(sc.gy), 'sv-v', 6);
    g += plate(X(sc.gx / 2), bottom + 28, L.vox || 'v_ox', 'sv-x-text');
    g += plate(X(sc.gx) + 12, Y(sc.gy / 2) + 5, L.voy || 'v_oy', 'sv-y-text', 'start');
    // Scale key beside the grid, drawn at true size so "one square" means this square
    const keyY = 34;
    const size = Math.min(cell, 34);
    g += `<rect x="${W - 176}" y="${keyY - 18}" width="166" height="${size + 44}" rx="8" class="sv-key"/>`;
    g += `<rect x="${W - 164}" y="${keyY - 6}" width="${size}" height="${size}" class="sv-key-square"/>`;
    g += text(W - 164 + size + 10, keyY + size / 2 - 2, '1 square', 'sv-key-text', 'start');
    g += text(W - 93, keyY + size + 16, `= ${sc.scale} m/s`, 'sv-key-value');
    return frame(g);
  }

  // ---------- Two flights on one set of axes ----------
  function compare(o) {
    const PR = window.PR, a = o.a, b = o.b;
    const reach = Math.max(PR.range(a), PR.range(b));
    const peak = Math.max(PR.apex(a), PR.apex(b));
    const s = Math.min((RIGHT - LEFT) / reach, (GROUND - TOP - 30) / peak);
    let g = backdrop();
    const arc = (sc, name, cls) => {
      const T = PR.hangTime(sc), pts = [];
      for (let i = 0; i <= 60; i++) {
        const u = T * i / 60;
        pts.push(`${(LEFT + s * sc.vox * u).toFixed(1)},${(GROUND - s * (sc.voy * u - 5 * u * u)).toFixed(1)}`);
      }
      const lx = LEFT + s * sc.vox * T * 0.5, ly = GROUND - s * PR.apex(sc);
      let out = `<polyline points="${pts.join(' ')}" class="sv-arc-line ${cls}"/>`;
      out += plate(lx, ly - 12, `${name}: v_ox = ${fmt(sc.vox)}, v_oy = ${fmt(sc.voy)}`, 'sv-cmp-text');
      if (!o.hideLanding && o.showTimes) out += plate(LEFT + s * PR.range(sc), GROUND + 28, `${name} lands at ${fmt(T)} s`, 'sv-small');
      return out;
    };
    g += arc(a, 'A', 'sv-arc-a') + arc(b, 'B', 'sv-arc-b');
    g += `<circle cx="${LEFT}" cy="${GROUND}" r="9" class="sv-ball"/>`;
    return frame(g);
  }

  function render(o) {
    if (o.mode === 'launch') return launch(o);
    if (o.mode === 'grid') return grid(o);
    if (o.mode === 'compare') return compare(o);
    return flight(o);
  }

  window.Scene = { render, W, H };
})();

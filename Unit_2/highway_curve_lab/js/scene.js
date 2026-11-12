// Highway Curve Lab — everything drawn as SVG: the instrument panel beside the 3D view (speedometer, tire grip gauge
// with a magnifier), the top-down map used for aiming arrows, the force diagrams, graphs, signs and the quiz table.
// Colors are fixed for the whole lesson: blue = velocity, rose = friction toward the center, purple = the radius.
// An arrow the student is still aiming is gray, so color never gives the answer away.
// The needles (#speedNeedle, #gripNeedle, #loupeUse) are moved by the app on every frame; this file only draws.

(function () {
  const W = 760, H = 520;
  const PANEL_X = 516;                                   // the instrument panel starts here; the 3D view fills the rest
  const SPD = { cx: 636, cy: 100, R: 72 };
  const GAUGE_G = { cx: 636, cy: 308, R: 80 };
  const LOUPE = { cx: 636, cy: 460, r: 44, zoom: 2.6 };
  const SUB_RE = /\b(F|a|v)_(net|max|c|need)\b/g;

  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const fmt = v => window.FL.fmt(v);
  const rad = d => d * Math.PI / 180;
  function rich(str) {
    let out = '', last = 0, shifted = false;
    const s = String(str);
    s.replace(SUB_RE, (m, base, sub, idx) => {
      out += (shifted ? `<tspan dy="-5">${esc(s.slice(last, idx))}</tspan>` : esc(s.slice(last, idx))) + base;
      out += `<tspan dy="5" font-size="72%">${sub}</tspan>`;
      shifted = true; last = idx + m.length;
      return m;
    });
    const rest = s.slice(last);
    return out + (shifted ? `<tspan dy="-5">${esc(rest) || '&#8203;'}</tspan>` : esc(rest));
  }
  const text = (x, y, str, cls = '', anchor = 'middle', id = '') => `<text x="${x}" y="${y}" class="sv-text ${cls}" text-anchor="${anchor}"${id ? ` id="${id}"` : ''}>${rich(str)}</text>`;
  function plate(x, y, str, cls = '', anchor = 'middle') {
    const w = String(str).replace(/_/g, '').length * 8.6 + 16;
    const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    const cx = Math.max(4, Math.min(W - w - 4, left));
    return `<rect x="${cx}" y="${y - 18}" width="${w}" height="26" rx="6" class="sv-plate"/>${text(cx + w / 2, y, str, cls)}`;
  }
  function arrow(x1, y1, x2, y2, cls, width = 5) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 3) return '';
    const head = Math.min(width * 3.2, len * 0.6), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const bx = x2 - ux * head, by = y2 - uy * head, nx = -uy * head * 0.55, ny = ux * head * 0.55;
    return `<g class="${cls}"><line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke-width="${width}" stroke-linecap="round"/><polygon points="${x2},${y2} ${bx + nx},${by + ny} ${bx - nx},${by - ny}"/></g>`;
  }
  const frame = (inner, cls = '') => `<svg viewBox="0 0 ${W} ${H}" class="scene-svg ${cls}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><rect x="0" y="0" width="${W}" height="${H}" class="sv-floor"/>${inner}</svg>`;
  // A see-through frame: the 3D view shows through everywhere except the instrument panel
  const clear = (inner, cls = '') => `<svg viewBox="0 0 ${W} ${H}" class="scene-svg scene-over ${cls}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
  const at = (phi, r, cx, cy) => ({ x: cx + r * Math.cos(rad(phi)), y: cy - r * Math.sin(rad(phi)) });
  const dir = angle => ({ x: Math.cos(rad(angle)), y: -Math.sin(rad(angle)) });
  const angleOf = (from, to) => Math.atan2(-(to.y - from.y), to.x - from.x) * 180 / Math.PI;
  // The student's own arrow gets a white halo drawn underneath, so it shows on the dark road and the light ground alike
  const aimed = (p, angle, len, cls, width = 5) => {
    const d = dir(angle), x1 = p.x + d.x * 18, y1 = p.y + d.y * 18, x2 = p.x + d.x * len, y2 = p.y + d.y * len;
    const halo = cls === 'fl-aim' ? arrow(x1 - d.x * 2, y1 - d.y * 2, x2 + d.x * 4, y2 + d.y * 4, 'fl-aim-halo', width + 6) : '';
    return halo + arrow(x1, y1, x2, y2, cls, width);
  };

  // ---------- Dials: 270° sweeps, angle in degrees clockwise from straight up ----------
  const sweep = (val, max) => -135 + 270 * (Math.max(0, Math.min(max * 1.02, val)) / max);
  const onDial = (D, a, r) => ({ x: D.cx + r * Math.sin(rad(a)), y: D.cy - r * Math.cos(rad(a)) });
  function ticks(D, max, minor, mid, label, rOut, lens, numR, numCls, every = 1) {
    let s = '';
    const n = Math.round(max / minor);
    for (let i = 0; i <= n; i++) {
      const v = i * minor, isLab = Math.abs(v / label - Math.round(v / label)) < 1e-6, isMid = mid && Math.abs(v / mid - Math.round(v / mid)) < 1e-6;
      const a = sweep(v, max), p = onDial(D, a, rOut), q = onDial(D, a, rOut - (isLab ? lens[0] : isMid ? lens[1] : lens[2]));
      s += `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" class="hc-tick${isLab ? ' hc-tick-major' : isMid ? ' hc-tick-mid' : ''}"/>`;
      if (isLab && i % every === 0) { const t = onDial(D, a, numR); s += text(t.x.toFixed(1), (t.y + 5).toFixed(1), fmt(v), numCls); }
    }
    return s;
  }
  // Speedometer: m/s on the outside, mph on the inside
  function speedo(v) {
    const D = SPD, F = window.FL.SPEEDO, MPH = window.FL.MPH;
    let s = `<circle cx="${D.cx}" cy="${D.cy}" r="${D.R + 8}" class="hc-rim"/><circle cx="${D.cx}" cy="${D.cy}" r="${D.R}" class="hc-face"/>`;
    s += ticks(D, F.max, F.minor, 0, F.label, D.R - 2, [12, 8, 6], D.R - 21, 'hc-num');
    // mph ring, on the same sweep as m/s
    const mphD = { cx: D.cx, cy: D.cy };
    for (let m = 0; m <= F.mphMax; m += F.mphMinor) {
      const a = sweep(m / MPH, F.max), major = m % F.mphLabel === 0, p = onDial(mphD, a, D.R - 31), q = onDial(mphD, a, D.R - 31 - (major ? 7 : 4));
      s += `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" class="hc-tick hc-tick-mph"/>`;
      if (major && m > 0) { const t = onDial(mphD, a, D.R - 46); s += text(t.x.toFixed(1), (t.y + 4).toFixed(1), String(m), 'hc-num-mph'); }
    }
    s += `<text x="${D.cx}" y="${D.cy + D.R + 22}" class="sv-text hc-unit" text-anchor="middle">m/s outside · <tspan class="hc-mph">mph inside</tspan></text>`;
    s += `<g id="speedNeedle" transform="rotate(${sweep(v || 0, F.max).toFixed(2)} ${D.cx} ${D.cy})"><line x1="${D.cx}" y1="${D.cy + 12}" x2="${D.cx}" y2="${D.cy - D.R + 8}" class="hc-needle"/></g><circle cx="${D.cx}" cy="${D.cy}" r="6" class="hc-hub"/>`;
    return s + text(D.cx, 18, 'Speedometer', 'hc-title');
  }
  // Tire grip gauge (kN): the needle is the friction the road is giving; the red mark is the grip limit μ × m × g
  function grip(o) {
    const D = GAUGE_G, g = window.FL.GAUGE[o.veh || 'car'];
    let s = `<circle cx="${D.cx}" cy="${D.cy}" r="${D.R + 8}" class="hc-rim"/><circle cx="${D.cx}" cy="${D.cy}" r="${D.R}" class="hc-face"/><g id="gripG">`;
    if (typeof o.limit === 'number') {
      const a = sweep(o.limit, g.max), b = sweep(g.max, g.max), p = onDial(D, a, D.R - 6), q = onDial(D, b, D.R - 6);
      s += `<path d="M ${p.x} ${p.y} A ${D.R - 6} ${D.R - 6} 0 ${b - a > 180 ? 1 : 0} 1 ${q.x} ${q.y}" class="hc-redzone"/>`;
      const m1 = onDial(D, a, D.R + 6), m2 = onDial(D, a, D.R - 26);
      s += `<line x1="${m1.x.toFixed(1)}" y1="${m1.y.toFixed(1)}" x2="${m2.x.toFixed(1)}" y2="${m2.y.toFixed(1)}" class="hc-limit"/>`;
    }
    s += ticks(D, g.max, g.minor, g.mid, g.label, D.R - 2, [15, 10, 6], D.R - 27, 'hc-num');
    s += `<g id="gripNeedle" transform="rotate(${sweep(o.F || 0, g.max).toFixed(2)} ${D.cx} ${D.cy})"><line x1="${D.cx}" y1="${D.cy + 14}" x2="${D.cx}" y2="${D.cy - D.R + 10}" class="hc-needle"/></g></g><circle cx="${D.cx}" cy="${D.cy}" r="7" class="hc-hub"/>`;
    s += text(D.cx, D.cy + 36, 'kN', 'hc-unit hc-unit-big') + text(D.cx, D.cy + 62, 'SLIP!', 'hc-slip', 'middle', 'slipLamp');
    s += text(D.cx, D.cy - D.R - 14, 'Tire grip gauge (kN)', 'hc-title');
    if (o.coach) {
      const p = onDial(D, sweep(g.label, g.max), D.R + 10);
      s += plate(PANEL_X - 8, D.cy - 40, `small mark = ${fmt(g.minor)} kN`, 'sv-small hc-coach', 'end') + `<line x1="${PANEL_X - 8}" y1="${D.cy - 46}" x2="${p.x}" y2="${p.y}" class="hc-coach-line"/>`;
    }
    return s + loupe(o.F || 0, g.max);
  }
  const loupeTransform = (F, max) => { const t = onDial(GAUGE_G, sweep(F, max), GAUGE_G.R - 14); return `translate(${LOUPE.cx} ${LOUPE.cy}) scale(${LOUPE.zoom}) translate(${(-t.x).toFixed(2)} ${(-t.y).toFixed(2)})`; };
  function loupe(F, max) {
    const { cx, cy, r } = LOUPE;
    return `<clipPath id="loupeClip"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><circle cx="${cx}" cy="${cy}" r="${r}" class="hc-face"/>`
      + `<g clip-path="url(#loupeClip)"><use id="loupeUse" href="#gripG" transform="${loupeTransform(F, max)}"/></g><circle cx="${cx}" cy="${cy}" r="${r}" class="hc-loupe"/>`
      + text(cx - r - 6, cy + 4, '🔍', 'sv-small', 'end');
  }

  // ---------- The panel over the 3D view ----------
  // o = { v, F, veh, limit, chips: [text], banner: { text, cls }, coach, extra }
  function panel(o) {
    let s = `<rect x="${PANEL_X}" y="0" width="${W - PANEL_X}" height="${H}" class="hc-panel" id="panelRect"/>`;
    s += speedo(o.v) + grip(o);
    (o.chips || []).forEach((c, i) => { s += plate(10, 26 + i * 32, c, 'sv-small hc-chip', 'start'); });
    if (o.banner) s += `<g id="runBanner">${plate(PANEL_X / 2, H - 16, o.banner.text, `hc-banner ${o.banner.cls || ''}`)}</g>`;
    else s += '<g id="runBanner"></g>';
    return clear(s + (o.extra || ''));
  }

  // ---------- The top-down map, for aiming arrows ----------
  // o = { phi, rot, aim (angle) , aimCls, showV, showF, ice, tangent, clickable, hint, title }
  const MAP_R = 210;
  function mapGeo(rot) {
    const m = 45 + rot, d = dir(m);
    return { cx: 380 - d.x * MAP_R * 0.5, cy: 262 - d.y * MAP_R * 0.5, R: MAP_R, rot };
  }
  function map(o) {
    // The car keeps to the outer (right-hand) lane: the road's center line is half a lane inside its path
    const g = mapGeo(o.rot || 0), { cx, cy } = g, R = g.R - 11, rot = g.rot, ph = (o.phi || 0) + rot;
    const a0 = at(rot, R, cx, cy), a1 = at(rot + 90, R, cx, cy);
    const back = dir(rot + 90 + 180), fwd = dir(rot + 180);
    const e0 = { x: a0.x + back.x * 130, y: a0.y + back.y * 130 }, x1 = { x: a1.x + fwd.x * 130, y: a1.y + fwd.y * 130 };
    const road = (cls, w) => `<path d="M ${e0.x} ${e0.y} L ${a0.x} ${a0.y} A ${R} ${R} 0 0 0 ${a1.x} ${a1.y} L ${x1.x} ${x1.y}" class="${cls}" stroke-width="${w}"/>`;
    const railR = R + 34, r0 = at(rot, railR, cx, cy), r1 = at(rot + 90, railR, cx, cy);
    let s = road('hc-map-shoulder', 64) + road('hc-map-road', 46) + road('hc-map-line', 2.5);
    s += `<path d="M ${r0.x} ${r0.y} A ${railR} ${railR} 0 0 0 ${r1.x} ${r1.y}" class="hc-map-rail"/>`;
    const p = at(ph, g.R, cx, cy);
    if (o.ice) { const i0 = at(ph - 5, R, cx, cy), i1 = at(ph + 14, R, cx, cy); s += `<path d="M ${i0.x} ${i0.y} A ${R} ${R} 0 0 0 ${i1.x} ${i1.y}" class="hc-map-ice"/>`; }
    s += `<circle cx="${cx}" cy="${cy}" r="6" class="hc-map-center"/>${text(cx, cy + 24, 'center of the curve', 'sv-small hc-dim')}`;
    // Which way the car drives: a curved arrow inside the road, with a real arrowhead at its end
    const Ra = R - 62, A0 = rot + 14, A1 = rot + 66;
    const t0 = at(A0, Ra, cx, cy), t1 = at(A1, Ra, cx, cy), hd = dir(A1 + 90), nx = -hd.y, ny = hd.x;
    s += `<path d="M ${t0.x.toFixed(1)} ${t0.y.toFixed(1)} A ${Ra} ${Ra} 0 0 0 ${t1.x.toFixed(1)} ${t1.y.toFixed(1)}" class="hc-turn"/>`;
    s += `<polygon points="${(t1.x + hd.x * 16).toFixed(1)},${(t1.y + hd.y * 16).toFixed(1)} ${(t1.x + nx * 9).toFixed(1)},${(t1.y + ny * 9).toFixed(1)} ${(t1.x - nx * 9).toFixed(1)},${(t1.y - ny * 9).toFixed(1)}" class="hc-turn-head"/>`;
    const lab = at((A0 + A1) / 2, Ra - 42, cx, cy);
    s += text(lab.x.toFixed(1), lab.y.toFixed(1), 'drives this way', 'sv-small hc-dim');
    if (o.tangent) { const d = dir(ph + 90); s += `<line x1="${p.x}" y1="${p.y}" x2="${p.x + d.x * 260}" y2="${p.y + d.y * 260}" class="hc-tangent"/>`; }
    s += `<g transform="translate(${p.x} ${p.y}) rotate(${-(ph + 90)})"><rect x="-21" y="-10" width="42" height="20" rx="6" class="hc-map-car"/><rect x="2" y="-8" width="10" height="16" rx="2" class="hc-map-glass"/></g>`;
    if (o.showV) s += aimed(p, ph + 90, 100, 'fl-vel');
    if (o.showF) s += aimed(p, ph + 180, 100, 'fl-force');
    if (typeof o.aim === 'number') s += aimed(p, o.aim, 104, o.aimCls || 'fl-aim', 6);
    if (o.title) s += plate(W / 2, 28, o.title, 'hc-title');
    if (o.hint) s += plate(W / 2, H - 14, o.hint, 'sv-small hc-coach');
    return frame(s, o.clickable ? 'fl-click' : '');
  }
  const mapCar = (phi, rot) => { const g = mapGeo(rot || 0); return at(phi + g.rot, g.R, g.cx, g.cy); };

  // ---------- Two force diagrams side by side: the car from behind, and a free-body diagram ----------
  // o = { label: the name chosen for the sideways arrow, or null for "?" }
  function forces(o) {
    const q = o.label || '?';
    let s = text(196, 34, 'Forces on the car, seen from behind', 'hc-title') + text(572, 34, 'Free-body diagram', 'hc-title');
    s += `<line x1="384" y1="56" x2="384" y2="${H - 24}" class="fl-divider"/>`;
    // pictorial: road surface, car from behind, curve center to the left
    s += `<rect x="30" y="330" width="330" height="18" class="hc-road-side"/><rect x="30" y="348" width="330" height="60" class="hc-ground-side"/>`;
    // The car seen from behind: cabin and rear window, body, taillights, plate, bumper, tires on the road
    s += arrow(200, 262, 200, 410, 'hc-weight', 5);   // behind the car: it acts at the center, the dot shows where
    s += '<ellipse cx="200" cy="331" rx="88" ry="6" class="hc-shadow"/>';
    s += '<rect x="134" y="288" width="30" height="44" rx="7" class="hc-tire"/><rect x="236" y="288" width="30" height="44" rx="7" class="hc-tire"/>';
    s += '<path d="M 150 252 L 164 210 Q 168 202 178 202 L 222 202 Q 232 202 236 210 L 250 252 Z" class="hc-body-side"/>';
    s += '<path d="M 162 246 L 173 214 Q 175 210 180 210 L 220 210 Q 225 210 227 214 L 238 246 Z" class="hc-map-glass"/>';
    s += '<rect x="122" y="246" width="156" height="58" rx="16" class="hc-body-side"/>';
    s += '<rect x="130" y="258" width="26" height="13" rx="4" class="hc-taillight"/><rect x="244" y="258" width="26" height="13" rx="4" class="hc-taillight"/>';
    s += '<rect x="181" y="266" width="38" height="18" rx="3" class="hc-plate"/>';
    s += '<rect x="126" y="292" width="148" height="12" rx="5" class="hc-bumper"/>';
    // Forces drawn where they act, beside the car so they never hide it
    s += '<circle cx="200" cy="262" r="6" class="hc-dot"/>' + plate(248, 404, 'weight', 'sv-small');
    s += arrow(120, 330, 120, 190, 'hc-normal', 5) + arrow(280, 330, 280, 190, 'hc-normal', 5) + plate(200, 180, 'normal force (both tires)', 'sv-small');
    s += arrow(140, 338, 46, 338, 'fl-force', 6) + plate(92, 372, q, 'sv-small fl-force-text');
    s += arrow(84, 450, 40, 450, 'hc-dimarrow', 3) + text(96, 456, 'center of the curve', 'sv-small hc-dim', 'start');
    // free-body diagram
    const c = { x: 572, y: 280 };
    s += `<circle cx="${c.x}" cy="${c.y}" r="9" class="hc-dot"/>`;
    s += arrow(c.x, c.y, c.x, c.y + 130, 'hc-weight', 5) + plate(c.x + 50, c.y + 120, 'weight', 'sv-small');
    s += arrow(c.x, c.y, c.x, c.y - 130, 'hc-normal', 5) + plate(c.x + 66, c.y - 116, 'normal force', 'sv-small');
    s += arrow(c.x, c.y, c.x - 130, c.y, 'fl-force', 6) + plate(c.x - 92, c.y - 22, q, 'sv-small fl-force-text');
    s += text(c.x, H - 34, 'toward the center ←', 'sv-small hc-dim');
    return frame(s);
  }

  // ---------- Graphs ----------
  // o = { spec, points: [{ x, y, veh, label, cls, i }], guide, miss, line: [p, q], curve: k, limits: [{ kN, label }], note, clickable, legend }
  function graph(o) {
    const { spec } = o, b = spec.box, px = (x, y) => window.FL.toPx(spec, x, y);
    let s = `<rect x="${b.x0}" y="${b.y1}" width="${b.x1 - b.x0}" height="${b.y0 - b.y1}" class="fl-plot"/>`;
    if (spec.x.cats) {
      // Each road is a group of two column slots: car on the left, truck on the right
      const SL = window.FL.SLOT, bw = window.FL.BAR_W;
      spec.x.cats.forEach((id, i) => {
        const X = px(i, 0).x;
        [[-SL, '🚗'], [SL, '🚚']].forEach(([off, icon]) => { const sx = px(i + off, 0).x; s += `<rect x="${(sx - bw / 2).toFixed(1)}" y="${b.y1}" width="${bw}" height="${b.y0 - b.y1}" class="hc-slot"/>` + text(sx.toFixed(1), b.y0 + 19, icon, 'sv-small'); });
        s += text(X, b.y0 + 42, `${window.FL.SURF[id].icon} ${window.FL.SURF[id].name}`, 'sv-small');
      });
      for (let i = 1; i < spec.x.cats.length; i++) { const X = (px(i - 1, 0).x + px(i, 0).x) / 2; s += `<line x1="${X}" y1="${b.y0}" x2="${X}" y2="${b.y1}" class="fl-grid-minor"/>`; }
    } else {
      const dec = spec.x.step < 1 ? 1 : 0;
      for (let i = 1; i * spec.x.minor <= spec.x.max + 1e-9; i++) {
        const v = i * spec.x.minor, major = Math.abs(v / spec.x.step - Math.round(v / spec.x.step)) < 1e-6, X = px(v, 0).x.toFixed(1);
        s += `<line x1="${X}" y1="${b.y0}" x2="${X}" y2="${b.y1}" class="${major ? 'fl-grid-major' : 'fl-grid-minor'}"/>`;
        if (major) s += text(X, b.y0 + 22, v.toFixed(dec), 'sv-small');
      }
      s += text(b.x0 - 10, b.y0 + 22, '0', 'sv-small', 'end');
    }
    for (let i = 1; i * spec.y.minor <= spec.y.max + 1e-9; i++) {
      const v = i * spec.y.minor, major = Math.abs(v / spec.y.step - Math.round(v / spec.y.step)) < 1e-6, Y = px(0, v).y.toFixed(1);
      s += `<line x1="${b.x0}" y1="${Y}" x2="${b.x1}" y2="${Y}" class="${major ? 'fl-grid-major' : 'fl-grid-minor'}"/>`;
      if (major) s += text(b.x0 - 10, Number(Y) + 5, fmt(v), 'sv-small', 'end');
    }
    s += `<path d="M ${b.x0} ${b.y1} V ${b.y0} H ${b.x1}" class="fl-axis"/>`;
    s += text((b.x0 + b.x1) / 2, H - (spec.x.cats ? 8 : 18), spec.x.label, 'fl-axis-label');
    s += `<text transform="translate(26 ${(b.y0 + b.y1) / 2}) rotate(-90)" class="sv-text fl-axis-label" text-anchor="middle">${rich(spec.y.label)}</text>`;
    (o.limits || []).forEach(L => {
      const Y = px(0, L.kN).y;
      s += `<line x1="${b.x0}" y1="${Y}" x2="${b.x1}" y2="${Y}" class="hc-gripline"/>` + plate(b.x1 - 6, Y - 6, L.label, 'sv-small hc-grip-text', 'end');
    });
    if (o.guide) { const g = px(o.guide.x, o.guide.y); s += `<path d="M ${g.x} ${b.y0} V ${g.y} H ${b.x0}" class="fl-guide"/>`; }
    if (typeof o.curve === 'number') {
      const pts = [];
      for (let i = 0; i <= 80; i++) { const x = (spec.x.max * i) / 80, y = o.curve * x * x; if (y <= spec.y.max) pts.push(px(x, y)); }
      s += `<polyline points="${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" class="fl-fit"/>`;
    }
    if (o.line) {
      const [p, q] = o.line, m = (q.y - p.y) / (q.x - p.x), y0 = p.y - m * p.x;
      const xa = Math.max(0, m > 0 ? -y0 / m : 0), xb = Math.min(spec.x.max, m > 0 ? (spec.y.max - y0) / m : spec.x.max);
      const A = px(xa, y0 + m * xa), B = px(xb, y0 + m * xb);
      s += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="fl-fit"/>`;
    }
    (o.marks || []).forEach(mk => { const c = px(mk.x, mk.y); s += `<path d="M ${c.x} ${b.y0} V ${c.y}" class="fl-guide"/><circle cx="${c.x}" cy="${c.y}" r="7" class="hc-cross"/>`; });
    (o.points || []).forEach(pt => {
      const c = px(pt.x, pt.y), big = pt.cls === 'fl-pt-new';
      const data = pt.i !== undefined ? ` data-pt="${pt.i}"` : '';
      if (spec.x.cats) {   // a column from the axis up to the value
        const bw = window.FL.BAR_W;
        s += `<rect x="${(c.x - bw / 2).toFixed(1)}" y="${c.y.toFixed(1)}" width="${bw}" height="${Math.max(0, b.y0 - c.y).toFixed(1)}" class="hc-bar hc-bar-${pt.veh || 'car'} ${pt.cls || ''}"${data}/>`;
        return;
      }
      s += pt.veh === 'truck'
        ? `<rect x="${(c.x - (big ? 9 : 7.5)).toFixed(1)}" y="${(c.y - (big ? 9 : 7.5)).toFixed(1)}" width="${big ? 18 : 15}" height="${big ? 18 : 15}" class="fl-pt hc-pt-truck ${pt.cls || ''}"${data}/>`
        : `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${big ? 9 : 7}" class="fl-pt ${pt.cls || ''}"${data}/>`;
    });
    (o.points || []).filter(pt => pt.label).forEach(pt => { const c = px(pt.x, pt.y); s += text(c.x + 12, c.y - 10, pt.label, 'sv-small fl-pt-label', 'start'); });
    if (o.miss) s += `<path d="M ${o.miss.x - 7} ${o.miss.y - 7} l 14 14 m 0 -14 l -14 14" class="fl-miss"/>`;
    if (o.legend) s += `<rect x="${b.x1 - 172}" y="${b.y1 + 8}" width="164" height="58" rx="8" class="sv-plate"/><rect x="${b.x1 - 161.5}" y="${b.y1 + 18.5}" width="15" height="15" class="hc-bar hc-bar-car"/>${text(b.x1 - 140, b.y1 + 31, 'sports car', 'sv-small', 'start')}<rect x="${b.x1 - 161.5}" y="${b.y1 + 41.5}" width="15" height="15" class="hc-bar hc-bar-truck"/>${text(b.x1 - 140, b.y1 + 54, 'cargo truck', 'sv-small', 'start')}`;
    if (o.note) s += plate(b.x0 + 14, b.y1 + 28, o.note, 'sv-small', 'start');
    return frame(s, o.clickable ? 'fl-click fl-cross' : '');
  }

  // ---------- Curve advisory signs ----------
  const SIGNS = [15, 20, 25, 30, 35, 40, 45, 50, 55];
  function signs(o) {
    let s = text(W / 2, 34, 'Pick the curve speed sign for your off-ramp', 'hc-title');
    // California style: a yellow diamond with a left-curve arrow, and a separate square speed plaque below it
    SIGNS.forEach((n, i) => {
      const x = 92 + (i % 5) * 144, y = 112 + Math.floor(i / 5) * 200, on = o.pick === n;
      s += `<g class="hc-sign ${on ? 'hc-sign-on' : ''} ${o.clickable ? 'fl-click' : ''}" data-sign="${n}" transform="translate(${x} ${y})">`
        + '<rect x="-3" y="30" width="6" height="56" class="hc-sign-post"/>'
        + '<rect x="-38" y="-38" width="76" height="76" rx="7" transform="rotate(45)" class="hc-sign-back"/>'
        + '<rect x="-32" y="-32" width="64" height="64" rx="5" transform="rotate(45)" class="hc-sign-inner"/>'
        // the arrow is scaled down and centered so it stays inside the inner border
        + '<g transform="translate(5 1) scale(0.75)"><path d="M 9 30 L 9 2 Q 9 -18 -11 -18" class="hc-sign-arrow"/><polygon points="-30,-18 -11,-34 -11,-2" class="hc-sign-ink"/></g>'
        + '<rect x="-34" y="66" width="68" height="56" rx="6" class="hc-sign-back"/>'
        + '<rect x="-30" y="70" width="60" height="48" rx="4" class="hc-sign-inner"/>'
        + `${text(0, 100, String(n), 'hc-sign-num')}${text(0, 114, 'MPH', 'hc-sign-mph')}</g>`;
    });
    if (o.note) s += plate(W / 2, H - 16, o.note, 'sv-small');
    return frame(s);
  }

  // ---------- A small data table drawn as a picture (Mastery Check) ----------
  function dataTable(o) {
    const cols = o.head.length, cw = Math.min(220, 640 / cols), x0 = (W - cw * cols) / 2, rh = 54, y0 = 110;
    let s = text(W / 2, 62, o.title, 'hc-title');
    [o.head].concat(o.rows).forEach((row, r) => row.forEach((cell, c) => {
      s += `<rect x="${x0 + c * cw}" y="${y0 + r * rh}" width="${cw}" height="${rh}" class="${r === 0 ? 'fl-cell-head' : 'fl-cell'}"/>${text(x0 + c * cw + cw / 2, y0 + r * rh + 34, cell, r === 0 ? 'sv-small' : 'hc-value')}`;
    }));
    return frame(s);
  }

  window.Scene = { W, H, PANEL_X, SPD, GAUGE_G, LOUPE, sweep, loupeTransform, at, angleOf, panel, map, mapCar, mapGeo, forces, graph, signs, SIGNS, dataTable, plate, text, frame };
})();

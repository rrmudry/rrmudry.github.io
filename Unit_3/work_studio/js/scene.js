// Mechanical Work Studio — the warehouse pull track, seen from the side. Drawn as SVG so it stays sharp on a projector.
// Colors are fixed for the whole lesson: cyan = force (F), amber = distance (d), emerald = work (W).
// An arrow the student is still aiming is gray, so color never gives the answer away.
// The moving parts (#mover, #needle, #loupeUse, #tapeUse, #meterVal) are placed by the app on every frame; this file only draws.

(function () {
  const W = 760, H = 520;
  // The track: 0 m at x0, 70 px per meter, floor at y = 205
  const TRK = { x0: 70, pxm: 70, floor: 205, tapeTop: 211, tapeH: 34, crateW: 62, crateH: 52 };
  const DIALG = { cx: 112, cy: 410, R: 80 };      // the spring scale dial
  const LOUPE = { cx: 272, cy: 418, r: 52, zoom: 2.4 };
  const TAPEZ = { x: 344, y: 352, w: 216, h: 116, zoom: 2.1 };
  const METER = { x: 580, y: 330, w: 164, h: 138 };
  const SUB_RE = /\b(F|W|a|v|d|h)_(net|max|push|pull|hand|lift|par|total|f|g|N|1|2)\b/g;

  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const fmt = v => window.FL.fmt(v);
  const rad = d => d * Math.PI / 180;

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
  const text = (x, y, str, cls = '', anchor = 'middle', id = '') => `<text x="${x}" y="${y}" class="sv-text ${cls}" text-anchor="${anchor}"${id ? ` id="${id}"` : ''}>${rich(str)}</text>`;

  // Label on a soft plate so it stays readable over lines
  function plate(x, y, str, cls = '', anchor = 'middle') {
    const w = String(str).replace(/_/g, '').length * 9.2 + 14;
    const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    const cx = Math.max(4, Math.min(W - w - 4, left));
    return `<rect x="${cx}" y="${y - 18}" width="${w}" height="26" rx="6" class="sv-plate"/>${text(cx + w / 2, y, str, cls)}`;
  }

  function arrow(x1, y1, x2, y2, cls, width = 5) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 3) return '';
    const head = Math.min(width * 3.2, len * 0.6);
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const bx = x2 - ux * head, by = y2 - uy * head;
    const nx = -uy * head * 0.55, ny = ux * head * 0.55;
    return `<g class="${cls}"><line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke-width="${width}" stroke-linecap="round"/><polygon points="${x2},${y2} ${bx + nx},${by + ny} ${bx - nx},${by - ny}"/></g>`;
  }
  // A dimension line with end bars, for distances and heights on problem pictures
  function dim(x1, y1, x2, y2, label, cls = 'wk-d') {
    const horiz = Math.abs(y2 - y1) < Math.abs(x2 - x1);
    const bar = horiz ? (x, y) => `<line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}"/>` : (x, y) => `<line x1="${x - 9}" y1="${y}" x2="${x + 9}" y2="${y}"/>`;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return `<g class="${cls} wk-dim">${bar(x1, y1)}${bar(x2, y2)}<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/></g>`
      + plate(horiz ? mx : mx + 12, horiz ? my + 26 : my + 6, label, `${cls}-text`, horiz ? 'middle' : 'start');
  }

  const frame = (inner, cls = '') => `<svg viewBox="0 0 ${W} ${H}" class="scene-svg ${cls}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><rect x="0" y="0" width="${W}" height="${H}" class="sv-floor"/>${inner}</svg>`;

  // Architectural warehouse test-bay backdrop (ceiling truss, columns, and floor trim)
  function bayBackdrop(w, floor, topY = 0) {
    const colXs = [36, Math.round(w * 0.5), w - 36];
    let s = '';
    // Subtle vertical steel bay columns
    colXs.forEach(cx => {
      s += `<rect x="${cx - 7}" y="${topY}" width="14" height="${Math.max(0, floor - topY)}" class="wk-bay-wall"/>`;
    });
    // Overhead truss rail
    const ty = topY + 14;
    if (ty + 24 < floor) {
      s += `<line x1="0" y1="${ty}" x2="${w}" y2="${ty}" class="wk-bay-truss"/>`
        + `<line x1="0" y1="${ty + 18}" x2="${w}" y2="${ty + 18}" class="wk-bay-truss"/>`;
      let zig = '';
      for (let x = 0; x < w; x += 36) {
        zig += `M ${x} ${ty + 18} L ${x + 18} ${ty} L ${x + 36} ${ty + 18} `;
      }
      s += `<path d="${zig}" class="wk-bay-truss"/>`;
    }
    // Safety floor strip along the top edge of the deck
    s += `<rect x="0" y="${floor}" width="${w}" height="6" class="wk-hazard"/>`;
    return s;
  }

  // ---------- The spring scale: 0 to 50 N, one small mark per newton ----------
  const dialAngle = F => -135 + 270 * (Math.max(0, Math.min(52, F)) / 50);   // degrees clockwise from straight up
  const onDial = (F, r) => { const a = rad(dialAngle(F)); return { x: DIALG.cx + r * Math.sin(a), y: DIALG.cy - r * Math.cos(a) }; };
  function dial(F, coach) {
    const { cx, cy, R } = DIALG;
    let s = text(cx, cy - R - 16, 'Spring scale (N)', 'fl-title wk-F-text');
    s += `<circle cx="${cx}" cy="${cy}" r="${R + 8}" class="fl-dial-rim"/><circle cx="${cx}" cy="${cy}" r="${R}" class="fl-dial-face"/><g id="dialG">`;
    for (let n = 0; n <= 50; n++) {
      const major = n % 10 === 0, mid = n % 5 === 0;
      const p = onDial(n, R - 2), q = onDial(n, R - (major ? 19 : mid ? 14 : 8));
      s += `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" class="fl-tick${major ? ' fl-tick-major' : mid ? ' fl-tick-mid' : ''}"/>`;
      if (major) { const t = onDial(n, R - 33); s += text(t.x.toFixed(1), (t.y + 6).toFixed(1), String(n), 'fl-dial-num'); }
    }
    s += `<g id="needle" transform="rotate(${dialAngle(F || 0)} ${cx} ${cy})"><line x1="${cx}" y1="${cy + 14}" x2="${cx}" y2="${cy - R + 10}" class="fl-needle"/></g></g><circle cx="${cx}" cy="${cy}" r="7" class="fl-needle-hub"/>`;
    s += text(cx, cy - 24, 'newtons', 'sv-small fl-dim');
    if (coach) s += plate(cx, cy + R + 14, 'each small mark = 1 N', 'sv-small fl-coach');
    // A magnifier that follows the needle tip, with crosshair lines
    const L = LOUPE;
    s += text(L.cx, L.cy - L.r - 10, '🔍 needle close-up', 'sv-small fl-dim');
    s += `<clipPath id="loupeClip"><circle cx="${L.cx}" cy="${L.cy}" r="${L.r}"/></clipPath><circle cx="${L.cx}" cy="${L.cy}" r="${L.r}" class="fl-dial-face"/>`
      + `<g clip-path="url(#loupeClip)"><use id="loupeUse" href="#dialG" transform="${loupeTransform(F || 0)}"/>`
      + `<line x1="${L.cx - L.r}" y1="${L.cy}" x2="${L.cx + L.r}" y2="${L.cy}" class="wk-loupe-cross"/>`
      + `<line x1="${L.cx}" y1="${L.cy - L.r}" x2="${L.cx}" y2="${L.cy + L.r}" class="wk-loupe-cross"/></g>`
      + `<circle cx="${L.cx}" cy="${L.cy}" r="${L.r}" class="fl-loupe-rim"/>`;
    return s;
  }
  const loupeTransform = F => { const t = onDial(F, DIALG.R - 12); return `translate(${LOUPE.cx} ${LOUPE.cy}) scale(${LOUPE.zoom}) translate(${(-t.x).toFixed(2)} ${(-t.y).toFixed(2)})`; };

  // ---------- The tape measure along the floor: numbers every meter, small marks every 0.1 m ----------
  const xAt = d => TRK.x0 + d * TRK.pxm;
  function tape() {
    const { tapeTop: y, tapeH: h } = TRK;
    let s = `<rect x="${xAt(0) - 14}" y="${y}" width="${xAt(8) - xAt(0) + 28}" height="${h}" rx="3" class="wk-tape"/>`;
    for (let i = 0; i <= 80; i++) {
      const x = xAt(i / 10).toFixed(1), major = i % 10 === 0, mid = i % 5 === 0;
      s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + (major ? 17 : mid ? 12 : 7)}" class="wk-tape-tick${major ? ' major' : ''}"/>`;
      if (major) s += `<text x="${x}" y="${y + h - 3}" class="sv-text wk-tape-num" text-anchor="middle">${i / 10}</text>`;
    }
    return s + `<text x="${xAt(8) + 18}" y="${y + h - 3}" class="sv-text wk-tape-num" text-anchor="start">m</text>`;
  }
  // The crate, the rope and the tug robot, drawn with the crate's front edge at 0 m. The app slides #mover.
  function mover(theta) {
    const fx = xAt(0), { floor, crateW: cw, crateH: ch } = TRK;
    let s = `<rect x="${fx - cw}" y="${floor - ch}" width="${cw}" height="${ch}" rx="4" class="wk-crate"/>`
      + `<path d="M ${fx - cw} ${floor - ch} L ${fx} ${floor} M ${fx} ${floor - ch} L ${fx - cw} ${floor}" class="wk-crate-x"/>`
      + `<rect x="${fx - cw + 4}" y="${floor - ch + 4}" width="${cw - 8}" height="${ch - 8}" rx="2" class="wk-crate-trim"/>`
      + `<circle cx="${fx}" cy="${floor - ch + 12}" r="4.5" class="wk-hand"/>`;
    // Rope: from the top front corner, at angle θ, through a small in-line scale to the robot's hand
    const ax = fx, ay = floor - ch + 12, L = 86, t = rad(theta || 0);
    const gx = ax + L * Math.cos(t), gy = ay - L * Math.sin(t);
    s += `<line x1="${ax}" y1="${ay}" x2="${gx}" y2="${gy}" class="wk-strap"/>`;
    // Force vector arrow hovering slightly above the rope
    const fOffX = -Math.sin(t) * 14, fOffY = -Math.cos(t) * 14;
    s += arrow(ax + fOffX + 4 * Math.cos(t), ay + fOffY - 4 * Math.sin(t), ax + fOffX + 58 * Math.cos(t), ay + fOffY - 58 * Math.sin(t), 'wk-F', 4);
    const mx = ax + 0.5 * L * Math.cos(t), my = ay - 0.5 * L * Math.sin(t);
    s += `<g transform="translate(${mx} ${my}) rotate(${-(theta || 0)})"><rect x="-13" y="-7" width="26" height="14" rx="3" class="wk-scale-mini"/></g>`;
    if (theta) {
      s += `<line x1="${ax}" y1="${ay}" x2="${ax + 54}" y2="${ay}" class="wk-ref"/><path d="M ${ax + 34} ${ay} A 34 34 0 0 0 ${ax + 34 * Math.cos(t)} ${ay - 34 * Math.sin(t)}" class="wk-arc"/>`;
      s += plate(fx - 34, floor - ch - 14, `θ = ${theta}°`, 'sv-small wk-angle');
    }
    // The tug robot walks along with the crate
    const rx = gx + 12;
    s += `<rect x="${rx}" y="${floor - 70}" width="32" height="58" rx="6" class="wk-robot"/><rect x="${rx + 5}" y="${floor - 60}" width="22" height="16" rx="3" class="wk-scale-mini"/><circle cx="${rx + 16}" cy="${floor - 82}" r="11" class="wk-robot"/>`
      + `<rect x="${rx + 15}" y="${floor - 87}" width="11" height="6" rx="2" class="wk-robot-eye"/><circle cx="${rx + 8}" cy="${floor - 6}" r="6" class="wk-wheel"/><circle cx="${rx + 24}" cy="${floor - 6}" r="6" class="wk-wheel"/>`
      + `<line x1="${rx + 4}" y1="${floor - 52}" x2="${gx}" y2="${gy}" class="wk-arm"/><circle cx="${gx}" cy="${gy}" r="4" class="wk-hand"/>`;
    // The red pointer at the crate's front edge, down onto the tape
    s += `<line x1="${fx}" y1="${floor - ch}" x2="${fx}" y2="${TRK.tapeTop + 19}" class="wk-pointer"/><polygon points="${fx - 6},${TRK.tapeTop - 7} ${fx + 6},${TRK.tapeTop - 7} ${fx},${TRK.tapeTop}" class="wk-pointer-head"/>`;
    return s;
  }
  const moverTransform = d => `translate(${(d * TRK.pxm).toFixed(2)} 0)`;
  const tapeTransform = d => `translate(${TAPEZ.x + TAPEZ.w / 2} ${TAPEZ.y + TAPEZ.h / 2 + 8}) scale(${TAPEZ.zoom}) translate(${(-xAt(d)).toFixed(2)} ${-(TRK.tapeTop + TRK.tapeH / 2 - 6)})`;

  // ---------- The work meter: a digital readout in joules ----------
  function workMeter(Wv, label) {
    const m = METER;
    return `<rect x="${m.x}" y="${m.y}" width="${m.w}" height="${m.h}" rx="12" class="wk-meter"/>`
      + text(m.x + m.w / 2, m.y + 26, label || 'Work meter', 'fl-title wk-W-text')
      + `<rect x="${m.x + 12}" y="${m.y + 42}" width="${m.w - 24}" height="56" rx="8" class="wk-meter-screen"/>`
      + `<text x="${m.x + m.w - 22}" y="${m.y + 82}" class="sv-text wk-meter-val" text-anchor="end" id="meterVal">${esc(Wv)}</text>`
      + text(m.x + m.w / 2, m.y + 122, 'joules (J)', 'sv-small fl-dim');
  }
  const meterText = v => `${(Math.round(v * 10) / 10).toFixed(1)} J`;

  // Readouts across the top. Each is { label, value, id }.
  function readouts(list) {
    return list.map((b, i) => {
      const x = 16 + i * 250;
      return `<rect x="${x}" y="10" width="238" height="38" rx="10" class="fl-box"/>${text(x + 11, 35, b.label, 'sv-small fl-dim', 'start')}<text x="${x + 228}" y="37" class="sv-text fl-value" text-anchor="end"${b.id ? ` id="${b.id}"` : ''}>${esc(b.value)}</text>`;
    }).join('');
  }

  // ---------- The whole track ----------
  // o = { rig, d (crate position), F (needle), W (meter), stop (cone at this distance), boxes, coach, hint, meterLabel }
  function lab(o) {
    const theta = (o.rig && o.rig.theta) || 0;
    let s = bayBackdrop(W, TRK.floor, 52);
    s += readouts(o.boxes || []);
    s += `<rect x="0" y="${TRK.floor}" width="${W}" height="${H - TRK.floor}" class="wk-ground"/><line x1="0" y1="${TRK.floor}" x2="${W}" y2="${TRK.floor}" class="wk-floor-line"/>`;
    // Start bumper and amber distance bar along the track
    s += `<rect x="${xAt(0) - TRK.crateW - 10}" y="${TRK.floor - 42}" width="8" height="42" rx="2" class="wk-mast"/>`;
    s += `<rect x="${xAt(0)}" y="${TRK.floor - 5}" width="${Math.max(0, (o.d || 0) * TRK.pxm).toFixed(1)}" height="5" class="wk-dist-bar" id="distBar"/>`;
    s += text(xAt(0) - 20, TRK.tapeTop + TRK.tapeH + 20, 'start ▲', 'sv-small fl-dim');
    s += `<g id="trackG">${tape()}`;
    if (typeof o.stop === 'number') s += `<g id="stopCone" transform="translate(${xAt(o.stop).toFixed(1)} 0)"><polygon points="0,${TRK.floor - 26} -9,${TRK.floor} 9,${TRK.floor}" class="wk-cone"/></g>`;
    s += `<g id="mover" transform="${moverTransform(o.d || 0)}">${mover(theta)}</g></g>`;
    s += `<line x1="0" y1="282" x2="${W}" y2="282" class="fl-divider"/>`;
    s += `<rect x="10" y="288" width="${W - 20}" height="226" rx="14" class="wk-console"/>`;
    s += dial(o.F || 0, o.coach);
    // Tape close-up: the same tape, magnified around the red pointer
    const Z = TAPEZ;
    s += text(Z.x + Z.w / 2, Z.y - 10, '🔍 tape at the red pointer', 'sv-small fl-dim');
    s += `<clipPath id="tapeClip"><rect x="${Z.x}" y="${Z.y}" width="${Z.w}" height="${Z.h}" rx="10"/></clipPath><rect x="${Z.x}" y="${Z.y}" width="${Z.w}" height="${Z.h}" rx="10" class="fl-dial-face"/>`
      + `<g clip-path="url(#tapeClip)"><use id="tapeUse" href="#trackG" transform="${tapeTransform(o.d || 0)}"/></g><rect x="${Z.x}" y="${Z.y}" width="${Z.w}" height="${Z.h}" rx="10" class="fl-loupe-rim"/>`;
    if (o.coach) s += plate(Z.x + Z.w / 2, Z.y + Z.h + 24, 'each small mark = 0.1 m', 'sv-small fl-coach');
    s += workMeter(meterText(o.W || 0), o.meterLabel);
    if (o.hint) s += plate(W / 2, 74, o.hint, 'sv-small fl-coach');
    return frame(s, o.clickable ? 'fl-click' : '');
  }

  window.SceneKit = { W, H, TRK, DIALG, esc, fmt, rad, rich, text, plate, arrow, dim, frame, bayBackdrop, readouts, workMeter, meterText };
  window.Scene = { W, H, TRK, xAt, dialAngle, loupeTransform, moverTransform, tapeTransform, meterText, lab };
})();

// Centripetal Force Lab — the pictures, seen from above. Drawn as SVG so they stay sharp on a projector.
// Colors are fixed for the whole lesson: blue = velocity, rose = the net force toward the center, purple = the radius.
// An arrow the student is still aiming is gray, so color never gives the answer away. Everything moves counterclockwise.
// The moving parts (#puck, #string, #needle) are placed by the app on every frame; this file only draws.

(function () {
  const W = 760, H = 520;
  const LAB = { cx: 250, cy: 268, R: 165 };      // the air table
  const DIALG = { cx: 612, cy: 158, R: 104 };    // the force dial
  const ST = { cx: 380, cy: 272, R: 160 };       // stations and problems
  const SUB_RE = /\b(F|a|v)_(net|max|c)\b/g;

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
  const text = (x, y, str, cls = '', anchor = 'middle') => `<text x="${x}" y="${y}" class="sv-text ${cls}" text-anchor="${anchor}">${rich(str)}</text>`;

  // Label on a soft plate so it stays readable over lines and arcs
  function plate(x, y, str, cls = '', anchor = 'middle') {
    const w = String(str).replace(/_/g, '').length * 9.4 + 14;
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

  const frame = (inner, cls = '') => `<svg viewBox="0 0 ${W} ${H}" class="scene-svg ${cls}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><rect x="0" y="0" width="${W}" height="${H}" class="sv-floor"/>${inner}</svg>`;

  // Screen y points down; angles are degrees, counterclockwise from the right.
  const at = (phi, r, cx, cy) => ({ x: cx + r * Math.cos(rad(phi)), y: cy - r * Math.sin(rad(phi)) });
  const dir = angle => ({ x: Math.cos(rad(angle)), y: -Math.sin(rad(angle)) });
  const angleOf = (from, to) => Math.atan2(-(to.y - from.y), to.x - from.x) * 180 / Math.PI;
  // An arrow from a point, aimed by angle
  const aimed = (p, angle, len, cls, width) => { const d = dir(angle); return arrow(p.x + d.x * 16, p.y + d.y * 16, p.x + d.x * len, p.y + d.y * len, cls, width); };
  const turnArrow = (cx, cy, r) => {
    const a = at(118, r, cx, cy), b = at(62, r, cx, cy);
    return `<path d="M ${b.x} ${b.y} A ${r} ${r} 0 0 0 ${a.x} ${a.y}" class="fl-turn"/><polygon points="${a.x - 9},${a.y + 3} ${a.x + 4},${a.y - 8} ${a.x + 5},${a.y + 8}" class="fl-turn-head"/>${text(cx, cy - r + 26, 'moves this way', 'sv-small fl-dim')}`;
  };

  // ---------- The force dial: 0 to 50 N, one small mark per newton ----------
  const dialAngle = F => -135 + 270 * (Math.max(0, Math.min(52, F)) / 50);   // degrees clockwise from straight up
  const onDial = (F, r) => { const a = rad(dialAngle(F)); return { x: DIALG.cx + r * Math.sin(a), y: DIALG.cy - r * Math.cos(a) }; };
  function dial(o) {
    const { cx, cy, R } = DIALG;
    let s = `<circle cx="${cx}" cy="${cy}" r="${R + 10}" class="fl-dial-rim"/><circle cx="${cx}" cy="${cy}" r="${R}" class="fl-dial-face"/><g id="dialG">`;
    if (o.limit) {
      const a = onDial(o.limit, R - 7), b = onDial(50, R - 7);
      s += `<path d="M ${a.x} ${a.y} A ${R - 7} ${R - 7} 0 0 1 ${b.x} ${b.y}" class="fl-dial-red"/>`;
    }
    for (let n = 0; n <= 50; n++) {
      const major = n % 10 === 0, mid = n % 5 === 0;
      const p = onDial(n, R - 2), q = onDial(n, R - (major ? 20 : mid ? 15 : 9));
      s += `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" class="fl-tick${major ? ' fl-tick-major' : mid ? ' fl-tick-mid' : ''}"/>`;
      if (major) { const t = onDial(n, R - 35); s += text(t.x.toFixed(1), (t.y + 6).toFixed(1), String(n), 'fl-dial-num'); }
    }
    s += `<g id="needle" transform="rotate(${dialAngle(o.F || 0)} ${cx} ${cy})"><line x1="${cx}" y1="${cy + 16}" x2="${cx}" y2="${cy - R + 12}" class="fl-needle"/></g></g><circle cx="${cx}" cy="${cy}" r="8" class="fl-needle-hub"/>`;
    s += text(cx, cy + 46, 'newtons (N)', 'sv-small fl-dim');
    s += text(cx, 30, 'Force on the string', 'fl-title');
    if (o.coach) {
      // Where to look, on the first trial only
      const a = onDial(3, R + 4), b = onDial(4, R + 4);
      s += `<path d="M ${a.x} ${a.y} L ${a.x - 26} ${a.y - 4} M ${b.x} ${b.y} L ${b.x - 28} ${b.y - 12}" class="fl-coach-line"/>`;
    }
    return s + loupe(o.F || 0);
  }

  // A magnifier that follows the needle tip, so the small marks can be read on a small screen
  const LOUPE = { cx: 612, cy: 458, r: 54, zoom: 2.4 };
  const loupeTransform = F => { const t = onDial(F, DIALG.R - 13); return `translate(${LOUPE.cx} ${LOUPE.cy}) scale(${LOUPE.zoom}) translate(${(-t.x).toFixed(2)} ${(-t.y).toFixed(2)})`; };
  function loupe(F) {
    const { cx, cy, r } = LOUPE;
    return `<clipPath id="loupeClip"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><circle cx="${cx}" cy="${cy}" r="${r}" class="fl-dial-face"/>`
      + `<g clip-path="url(#loupeClip)"><use id="loupeUse" href="#dialG" transform="${loupeTransform(F)}"/></g><circle cx="${cx}" cy="${cy}" r="${r}" class="fl-loupe-rim"/>`
      + text(cx, cy - r - 8, '🔍 the needle, close up', 'sv-small fl-dim');
  }

  // Readouts under the dial (two at most). Each is { label, value, id }.
  function readouts(list) {
    return list.map((b, i) => {
      const y = 286 + i * 46;
      return `<rect x="500" y="${y}" width="224" height="40" rx="10" class="fl-box"/>${text(511, y + 25, b.label, 'sv-small fl-dim', 'start')}<text x="714" y="${y + 27}" class="sv-text fl-value" text-anchor="end"${b.id ? ` id="${b.id}"` : ''}>${esc(b.value)}</text>`;
    }).join('');
  }

  // ---------- The air table ----------
  // o = { rig, phi, F, massText, boxes, limit, coach, showV, showF, aim (angle or null), aimCls, hint, cut }
  function lab(o) {
    const { cx, cy, R } = LAB, p = at(o.phi || 0, R, cx, cy);
    let s = `<circle cx="${cx}" cy="${cy}" r="${R + 44}" class="fl-table"/><circle cx="${cx}" cy="${cy}" r="${R}" class="fl-track"/>`;
    s += turnArrow(cx, cy, R - 34);
    // The radius is drawn toward the lower left, clear of the puck's starting place
    const rEnd = at(218, R, cx, cy), rMid = at(218, R * 0.55, cx, cy);
    s += `<line x1="${cx}" y1="${cy}" x2="${rEnd.x}" y2="${rEnd.y}" class="fl-radius"/>${plate(rMid.x + 8, rMid.y + 30, `r = ${fmt(o.rig.r)} m`, 'fl-radius-text')}`;
    s += `<line id="string" x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" class="fl-string"${o.cut ? ' style="display:none"' : ''}/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="9" class="fl-hole"/>${text(cx + 14, cy - 12, 'string goes down to the dial', 'sv-small fl-dim', 'start')}`;
    s += `<g id="puck" transform="translate(${p.x} ${p.y})"><circle r="17" class="fl-puck"/><circle r="6" class="fl-puck-dot"/></g>`;
    if (o.showV) s += aimed(p, (o.phi || 0) + 90, 96, 'fl-vel') + plate(...Object.values(at((o.phi || 0) + 90, 118, p.x, p.y)), 'velocity', 'sv-small fl-vel-text');
    if (o.showF) s += aimed(p, (o.phi || 0) + 180, 96, 'fl-force') + plate(...Object.values(at((o.phi || 0) + 160, 86, p.x, p.y)), 'net force', 'sv-small fl-force-text');
    if (typeof o.aim === 'number') s += aimed(p, o.aim, 96, o.aimCls || 'fl-aim', 6);
    s += plate(LAB.cx, H - 14, o.massText, 'sv-small');
    if (o.hint) s += plate(LAB.cx, 26, o.hint, 'sv-small fl-coach');
    return frame(s + dial(o) + readouts(o.boxes || []), o.clickable ? 'fl-click' : '');
  }

  window.SceneKit = { W, H, LAB, DIALG, ST, esc, fmt, rad, rich, text, plate, arrow, frame, at, dir, angleOf, aimed, turnArrow, dialAngle };
  window.Scene = { W, H, LAB, DIALG, ST, at, angleOf, dialAngle, loupeTransform, lab };
})();

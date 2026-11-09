// Centripetal Acceleration Workshop — the picture, seen from above. Drawn as SVG so it stays sharp on a projector.
// Colors are fixed for the whole lesson: blue = velocity v (along the tangent), rose = acceleration a_c (toward the
// center), purple = the radius r. Answer-choice arrows on the "which arrow" questions are all the same dark gray,
// so color never gives the answer away. Everything moves counterclockwise.
// Views: circle (one circle, with steps in time), release (whirl and let go), pick (lettered arrows or paths),
// dv (why the change in velocity points to the center), compare (before and after), problem (numbers to solve).

(function () {
  const W = 760, H = 520;
  const CX = 380, CY = 272, R = 170;
  const SUB_RE = /\b(v|a)_(c|o)\b/g;

  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const fmt = v => window.PR.fmt(v);
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

  const frame = inner => `<svg viewBox="0 0 ${W} ${H}" class="scene-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><rect x="0" y="0" width="${W}" height="${H}" class="sv-floor"/>${inner}</svg>`;

  // ---------- Geometry (screen y points down; angles are degrees, counterclockwise from the right) ----------
  const at = (phi, r = R, cx = CX, cy = CY) => ({ x: cx + r * Math.cos(rad(phi)), y: cy - r * Math.sin(rad(phi)) });
  const fwd = phi => ({ x: -Math.sin(rad(phi)), y: -Math.cos(rad(phi)) });   // velocity direction, counterclockwise
  const inward = phi => ({ x: -Math.cos(rad(phi)), y: Math.sin(rad(phi)) });

  // Puts a label just past an arrow's tip, pushed outward from the arrow
  const tipLabel = (p, d, len, str, cls) => plate(p.x + d.x * (len + 26), p.y + d.y * (len + 26) + 6, str, cls);

  // ---------- Parts ----------
  function track(cx = CX, cy = CY, r = R) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" class="sv-circle"/><circle cx="${cx}" cy="${cy}" r="5" class="sv-center"/>`;
  }

  function radiusLine(phi, label, cx = CX, cy = CY, r = R) {
    const p = at(phi, r, cx, cy);
    const mid = at(phi, r / 2, cx, cy);
    const off = { x: Math.sin(rad(phi)) * 18, y: Math.cos(rad(phi)) * 18 };
    return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" class="sv-radius"/>${label ? plate(mid.x + off.x, mid.y + off.y + 6, label, 'sv-r-text') : ''}`;
  }

  function puck(p, car, phi) {
    if (!car) return `<circle cx="${p.x}" cy="${p.y}" r="12" class="sv-ball"/>`;
    const d = fwd(phi), ang = Math.atan2(d.y, d.x) * 180 / Math.PI;
    return `<g transform="translate(${p.x} ${p.y}) rotate(${ang})"><rect x="-19" y="-11" width="38" height="22" rx="6" class="sv-car"/><rect x="4" y="-8" width="9" height="16" rx="2" class="sv-car-glass"/></g>`;
  }

  // Small curved arrow inside the circle that shows which way things go around
  function turnSign(cx = CX, cy = CY, r = R * 0.42) {
    const a = at(200, r, cx, cy), b = at(340, r, cx, cy);
    const tipDir = fwd(340);
    const tip = { x: b.x + tipDir.x * 2, y: b.y + tipDir.y * 2 };
    const low = at(270, r, cx, cy);
    return `<path d="M ${a.x} ${a.y} A ${r} ${r} 0 0 0 ${b.x} ${b.y}" class="sv-turn"/>
      ${arrow(b.x - tipDir.x * 14, b.y - tipDir.y * 14, tip.x, tip.y, 'sv-turn-head', 3)}
      ${text(low.x, low.y + 24, 'moves this way', 'sv-small sv-dim')}`;
  }

  function trail(phi, cx = CX, cy = CY, r = R) {
    return [12, 24, 36].map((d, i) => {
      const p = at(phi - d, r, cx, cy);
      return `<circle cx="${p.x}" cy="${p.y}" r="${8 - i * 1.5}" class="sv-trail" style="opacity:${0.45 - i * 0.12}"/>`;
    }).join('');
  }

  function vArrow(phi, label, len = 110, cx = CX, cy = CY, r = R, faint = false) {
    const p = at(phi, r, cx, cy), d = fwd(phi);
    return arrow(p.x, p.y, p.x + d.x * len, p.y + d.y * len, faint ? 'sv-v sv-faint' : 'sv-v') + (label ? tipLabel(p, d, len, label, 'sv-v-text') : '');
  }

  function aArrow(phi, label, len = 82, cx = CX, cy = CY, r = R) {
    const p = at(phi, r, cx, cy), d = inward(phi);
    return arrow(p.x, p.y, p.x + d.x * len, p.y + d.y * len, 'sv-a') + (label ? plate(p.x + d.x * (len + 30), p.y + d.y * (len + 30) + 6, label, 'sv-a-text') : '');
  }

  // The longest a line from p along d can be and still end inside the picture, with room for a label
  function fit(p, d, len, pad = 46) {
    let best = len;
    if (d.x > 1e-6) best = Math.min(best, (W - pad - p.x) / d.x);
    if (d.x < -1e-6) best = Math.min(best, (pad - p.x) / d.x);
    if (d.y > 1e-6) best = Math.min(best, (H - pad - p.y) / d.y);
    if (d.y < -1e-6) best = Math.min(best, (pad + 30 - p.y) / d.y);
    return Math.max(40, best);
  }

  const note = str => (str ? plate(20, 36, str, 'sv-note', 'start') : '');

  // ---------- Views ----------
  // One circle. With `omega` and `t`, it steps around and leaves faded copies at each whole second.
  function circleView(o) {
    const omega = o.omega || 0;
    const phi = (o.phi || 0) + omega * (o.t || 0);
    let g = track() + turnSign();
    if (o.rLabel) g += radiusLine(phi, o.rLabel);
    if (o.tangentLine) {
      const p = at(phi), d = fwd(phi);
      g += `<line x1="${p.x - d.x * 230}" y1="${p.y - d.y * 230}" x2="${p.x + d.x * 230}" y2="${p.y + d.y * 230}" class="sv-tangent"/>`;
      g += plate(p.x - d.x * 170, p.y - d.y * 170 - 14, 'tangent line', 'sv-small');
    }
    const ghosts = [];
    if (omega) for (let s = 0; s < Math.floor((o.t || 0) + 1e-6); s++) ghosts.push((o.phi || 0) + omega * s);
    else (o.ghosts || []).forEach(d => ghosts.push(phi + d));
    ghosts.forEach(gp => { g += vArrow(gp, '', 90, CX, CY, R, true) + `<circle cx="${at(gp).x}" cy="${at(gp).y}" r="10" class="sv-ghost"/>`; });
    if (o.showA) g += aArrow(phi, o.aLabel);
    if (o.showV !== false) g += vArrow(phi, o.vLabel);
    g += puck(at(phi), o.car, phi);
    return frame(g + note(o.speedNote || o.note));
  }

  // Whirl on a string, then let go at phiRel when t reaches tRel. After that it moves in a straight line.
  function releaseView(o) {
    const omega = o.omega || 57.2958, tRel = o.tRel || 4, phiRel = o.phiRel === undefined ? 90 : o.phiRel;
    const t = o.t || 0;
    const rel = at(phiRel);
    let g = track() + turnSign();
    const so = at(phiRel, R + 34);
    g += `<path d="M ${so.x} ${so.y - 14} l 4.5 9 l 10 1.5 l -7.5 7 l 2 10 l -9 -5 l -9 5 l 2 -10 l -7.5 -7 l 10 -1.5 z" class="sv-star"/>`;
    if (t <= tRel + 1e-9) {
      const phi = phiRel - omega * (tRel - t);
      const p = at(phi);
      g += `<line x1="${CX}" y1="${CY}" x2="${p.x}" y2="${p.y}" class="sv-string"/>`;
      if (!o.noV) g += vArrow(phi, o.vLabel || '', 90);
      g += puck(p);
      return frame(g + note(o.note || 'The star marks where the string is let go'));
    }
    const d = fwd(phiRel), vpx = R * rad(omega);
    const dist = vpx * (t - tRel);
    const p = { x: rel.x + d.x * dist, y: rel.y + d.y * dist };
    g += `<line x1="${rel.x}" y1="${rel.y}" x2="${p.x}" y2="${p.y}" class="sv-path"/>`;
    for (let s = 1; s * vpx * 0.5 < dist; s++) {
      const q = { x: rel.x + d.x * s * vpx * 0.5, y: rel.y + d.y * s * vpx * 0.5 };
      g += `<circle cx="${q.x}" cy="${q.y}" r="7" class="sv-trail" style="opacity:0.35"/>`;
    }
    g += `<line x1="${CX}" y1="${CY}" x2="${CX + (rel.x - CX) * 0.35}" y2="${CY + (rel.y - CY) * 0.35}" class="sv-string sv-faint"/>`;
    const vl = Math.max(0, Math.min(90, fit(p, d, 90, 8)));
    g += arrow(p.x, p.y, p.x + d.x * vl, p.y + d.y * vl, 'sv-v') + puck(p);
    return frame(g + note('No string: it keeps going straight'));
  }

  // Lettered answer choices drawn on the picture: four arrows, or three paths. A smaller circle leaves room for the
  // arrows and letters at every spot on it.
  function pickView(o) {
    const PR_ = 118, phi = o.phi || 45, p = at(phi, PR_), L = o.letters || {};
    let g = '';
    if (o.paper) {
      const corners = [0, 90, 180, 270].map(d => at(phi + d, PR_ + 4));
      g += `<polygon points="${corners.map(c => `${c.x},${c.y}`).join(' ')}" class="sv-paper"/><circle cx="${CX}" cy="${CY}" r="5" class="sv-center"/>`;
    } else g += track(CX, CY, PR_);
    g += turnSign(CX, CY, PR_ * 0.45);
    if (o.kind === 'paths') {
      g += trail(phi, CX, CY, PR_);
      if (!o.paper) g += `<line x1="${CX}" y1="${CY}" x2="${p.x}" y2="${p.y}" class="sv-string sv-faint"/>`;
      const d = fwd(phi), out = { x: -inward(phi).x, y: -inward(phi).y };
      const curve = [];
      for (let i = 0; i < 16; i++) {
        const q = at(phi + i * 6, PR_ + i * i * 0.5);
        if (q.x < 40 || q.x > W - 40 || q.y < 76 || q.y > H - 40) break;
        curve.push(q);
      }
      const tanLen = fit(p, d, 210), outLen = fit(p, out, 160);
      const paths = {
        tan: [p, { x: p.x + d.x * tanLen, y: p.y + d.y * tanLen }],
        out: [p, { x: p.x + out.x * outLen, y: p.y + out.y * outLen }],
        curve
      };
      Object.entries(paths).forEach(([k, pts]) => {
        if (pts.length < 2) return;
        g += `<polyline points="${pts.map(q => `${q.x},${q.y}`).join(' ')}" class="sv-choice-path"/>`;
        const end = pts[pts.length - 1], prev = pts[pts.length - 2];
        const len = Math.hypot(end.x - prev.x, end.y - prev.y) || 1;
        const ux = (end.x - prev.x) / len, uy = (end.y - prev.y) / len;
        g += arrow(end.x - ux * 16, end.y - uy * 16, end.x, end.y, 'sv-choice', 3);
        if (L[k]) g += plate(end.x + ux * 22, end.y + uy * 22 + 7, L[k], 'sv-letter');
      });
      g += puck(p, false, phi);
      return frame(g + note(o.paper ? 'Spinning paper, seen from above' : 'The string is let go when the stopper is where it is now'));
    }
    const dirs = { fwd: fwd(phi), back: { x: -fwd(phi).x, y: -fwd(phi).y }, in: inward(phi), out: { x: -inward(phi).x, y: -inward(phi).y } };
    Object.entries(dirs).forEach(([k, d]) => {
      g += arrow(p.x, p.y, p.x + d.x * 86, p.y + d.y * 86, 'sv-choice', 4);
      if (L[k]) g += plate(p.x + d.x * 112, p.y + d.y * 112 + 7, L[k], 'sv-letter');
    });
    g += puck(p, false, phi);
    return frame(g);
  }

  // Why the change in velocity points to the center. t = 0: two moments on the circle; 1: tail to tail; 2: the change.
  function dvView(o) {
    const t = Math.floor((o.t || 0) + 1e-6);
    const p1 = 60, p2 = 120, len = 100;
    let g = track() + turnSign();
    g += vArrow(p1, 'v before', len) + puck(at(p1));
    g += vArrow(p2, 'v after', len) + puck(at(p2));
    if (t >= 1) {
      const o0 = { x: 140, y: 330 };
      const a = fwd(p1), b = fwd(p2);
      g += `<rect x="20" y="186" width="200" height="236" rx="12" class="sv-panel"/>` + text(120, 214, 'Tail to tail', 'sv-small');
      g += arrow(o0.x, o0.y, o0.x + a.x * len, o0.y + a.y * len, 'sv-v');
      g += arrow(o0.x, o0.y, o0.x + b.x * len, o0.y + b.y * len, 'sv-v');
      g += text(o0.x + a.x * len - 8, o0.y + a.y * len - 10, 'before', 'sv-small sv-v-text', 'middle');
      g += text(o0.x + b.x * len - 8, o0.y + b.y * len + 24, 'after', 'sv-small sv-v-text', 'middle');
      if (t >= 2) {
        const s = { x: o0.x + a.x * len, y: o0.y + a.y * len }, e = { x: o0.x + b.x * len, y: o0.y + b.y * len };
        g += arrow(s.x, s.y, e.x, e.y, 'sv-a', 5) + text(s.x + 34, (s.y + e.y) / 2 + 6, 'change', 'sv-small sv-a-text', 'start');
        g += aArrow(90, 'change points to the center', 90);
        g += puck(at(90));
      }
    }
    return frame(g + note(t >= 2 ? 'The change in velocity points to the center' : t >= 1 ? 'Slide them so their tails touch' : 'Same speed, new direction'));
  }

  // Before and after: the same circle changed one way
  function compareView(o) {
    const sc = o.sc;
    const left = { cx: 200, cy: 300, r: 120 };
    const right = { cx: 565, cy: 300, r: sc.change === 'rhalf' ? 60 : 120 };
    const vLen = v => Math.min(185, 62 * v / sc.v1);
    let g = '';
    [[left, sc.v1, sc.r1, `a_c = ${fmt(sc.a1)} m/s²`, 'Before'], [right, sc.v2, sc.r2, o.newA !== undefined ? `a_c = ${fmt(o.newA)} m/s²` : 'a_c = ?', 'After']].forEach(([c, v, r, aText, title]) => {
      g += track(c.cx, c.cy, c.r) + text(c.cx, 64, title, 'sv-title');
      g += radiusLine(-90, `r = ${fmt(r)} m`, c.cx, c.cy, c.r);
      const top = at(90, c.r, c.cx, c.cy), d = fwd(90);
      g += arrow(top.x, top.y, top.x + d.x * vLen(v), top.y + d.y * vLen(v), 'sv-v');
      g += plate(top.x + d.x * vLen(v) / 2, top.y - 18, `v = ${fmt(v)} m/s`, 'sv-v-text');
      g += arrow(top.x, top.y, top.x, top.y + Math.min(62, c.r * 0.7), 'sv-a');
      g += plate(c.cx + 40, top.y + 52, aText, 'sv-a-text', 'start');
      g += puck(top);
    });
    return frame(g);
  }

  // A problem to solve. The numbers live here, never in the words.
  function problemView(o) {
    const sc = o.sc, ans = o.ans || {}, phi = 50;
    let g = track() + turnSign();
    if (sc.kind === 'compare') return compareView({ sc, newA: typeof ans.newac === 'number' ? ans.newac : undefined });
    g += radiusLine(200, `r = ${fmt(sc.r)} m`);   // the radius is the same everywhere; drawn away from the a_c arrow so labels never collide
    const vKnown = sc.kind === 'ac' ? sc.v : typeof ans.v === 'number' ? ans.v : typeof ans.vmax === 'number' ? ans.vmax : null;
    g += vArrow(phi, vKnown === null ? 'v = ?' : `v = ${fmt(vKnown)} m/s`);
    let aText = typeof ans.ac === 'number' ? `a_c = ${fmt(ans.ac)} m/s²` : 'a_c = ?';
    if (sc.kind === 'vmax') aText = `a_c = ${fmt(sc.a)} m/s²`;
    g += aArrow(phi, aText, 82);
    g += puck(at(phi), sc.kind === 'vmax', phi);
    let tag = '';
    if (sc.kind === 'period') tag = `One lap takes T = ${fmt(sc.T)} s`;
    if (sc.kind === 'vmax') tag = 'Highway curve: the a_c arrow is the most the tires can give';
    return frame(g + (tag ? plate(20, H - 22, tag, 'sv-note', 'start') : ''));
  }

  function render(o) {
    if (!o) return frame('');
    if (o.mode === 'release') return releaseView(o);
    if (o.mode === 'pick') return pickView(o);
    if (o.mode === 'dv') return dvView(o);
    if (o.mode === 'compare') return compareView(o);
    if (o.mode === 'problem') return problemView(o);
    return circleView(o);
  }

  window.Scene = { render, W, H };
})();

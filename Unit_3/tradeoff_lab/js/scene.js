// Force–Distance Trade-Off Lab — the pictures. Everything is SVG in a 760 × 520 box.
// lab(): a block-and-tackle or a smooth ramp, the rope tape along the bottom, and a spring scale on the right.
// The parts that move (load, rope, tag, needle, hold bar) carry ids, and place() moves them every frame.
// graph(): force against rope distance, with the student's own points. problem(): pictures for the Mastery Check.

(function () {
  const W = 760, H = 520, FLOOR = 430;
  const TAPE = { x0: 96, pxm: 76, y: 486, rope: 474 };          // rope tape: 0–7 m
  const SC = { x: 656, w: 100, top: 56, bot: 404, max: 250 };   // spring scale tube; a digital readout can sit under it
  const PUL = { cx: 330, pxm: 90, beam: 40, topY: 67, r: 8, crateW: 64, crateH: 50 };   // topY: centers of the top wheels; r: wheel radius (strands are 2r apart)
  const RAMP = { pxm: 66, platL: 62, platR: 172, extra: 0.3 };   // the ramp runs 0.3 m higher than the hold line
  const ROPE_X = 40;                                          // the rope comes down the left edge to the floor pulley
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const fmt = v => window.FL.fmt(v);
  const SUB_RE = /\b(F|W|d|h|L)_(g|in|out|need)\b/g;
  const rich = str => esc(str).replace(SUB_RE, '$1<tspan class="sv-sub" dy="5">$2</tspan><tspan dy="-5">​</tspan>');
  const text = (x, y, str, cls = '', anchor = 'middle', id = '') => `<text x="${x}" y="${y}" class="sv-text ${cls}" text-anchor="${anchor}"${id ? ` id="${id}"` : ''}>${rich(str)}</text>`;
  function plate(x, y, str, cls = '', anchor = 'middle') {
    const w = String(str).replace(/_/g, '').length * 9.2 + 18, x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w + 6 : x - 6;
    return `<rect x="${x0.toFixed(1)}" y="${y - 19}" width="${w.toFixed(1)}" height="27" rx="6" class="sv-plate"/>${text(x, y, str, cls, anchor)}`;
  }
  const frame = (inner, cls = '') => `<svg viewBox="0 0 ${W} ${H}" class="scene-svg ${cls}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><rect x="0" y="0" width="${W}" height="${H}" class="sv-floor"/>${inner}</svg>`;
  const wheel = (x, y, r, cls = 'to-wheel') => `<circle cx="${x}" cy="${y}" r="${r}" class="${cls}"/><circle cx="${x}" cy="${y}" r="2.5" class="to-axle"/>`;
  // A wheel with spokes that place() can turn. ang in degrees, clockwise.
  const spun = (id, x, y, r, ang = 0) => `<g id="${id}" transform="rotate(${ang.toFixed(1)} ${x} ${y})"><circle cx="${x}" cy="${y}" r="${r}" class="to-wheel"/>`
    + `<path d="M ${x - r + 2} ${y} H ${x + r - 2} M ${x - (r - 2) / 2} ${y - (r - 2) * 0.866} L ${x + (r - 2) / 2} ${y + (r - 2) * 0.866} M ${x - (r - 2) / 2} ${y + (r - 2) * 0.866} L ${x + (r - 2) / 2} ${y - (r - 2) * 0.866}" class="to-spoke"/>`
    + `<circle cx="${x}" cy="${y}" r="2.2" class="to-axle"/></g>`;
  // A rope section: a solid rope with a braided texture on top. The texture's offset shows the rope material moving.
  const ropeSeg = (id, d, off = 0) => `<path id="${id}" d="${d}" class="to-rope"/><path id="${id}t" d="${d}" class="to-rope-tex" stroke-dashoffset="${off.toFixed(1)}"/>`;
  const CORNER_X = 49, CR = 9, FLOOR_PULLEY = { x: 49, y: 465 };
  const deg = rad => rad * 180 / Math.PI;
  const FL_r = v => Math.round(v * 10) / 10;

  // ---------- Geometry of each machine ----------
  // x = rope pulled (m).
  // Block and tackle with n supporting strands, numbered 1..n from the dead end (right) toward the free end (left).
  // With an even n the dead end is on the top block; with an odd n it is on the moving block. Wheel k joins strands k and k+1,
  // on whichever block strand k ends at, and a last top wheel turns strand n toward the free end.
  // Rope speeds (in units of the load speed u): the dead end moves with its block; across a wheel moving at b, w(k+1) = 2b − w(k).
  // That makes the free end move at n·u, and every wheel turns at its own rate: (w(k) − b) / r.
  function reeving(n) {
    const deadTop = n % 2 === 0, xs = [], wheels = [];
    for (let k = 1; k <= n; k++) xs.push(PUL.cx + PUL.r + 2 * PUL.r * ((n - 1) / 2 - (k - 1)));
    let w = deadTop ? 0 : 1;
    const speeds = [w];
    for (let k = 1; k < n; k++) {
      const bot = deadTop ? k % 2 === 1 : k % 2 === 0, b = bot ? 1 : 0;
      wheels.push({ id: `wk${k}`, bot, x: (xs[k - 1] + xs[k]) / 2, rel: w - b });
      w = 2 * b - w; speeds.push(w);
    }
    wheels.push({ id: 'wkf', bot: false, x: xs[n - 1] - PUL.r, rel: w });
    return { deadTop, xs, wheels, speeds };
  }
  function geo(rig, mc, x) {
    if (mc.mach === 'pulley') {
      const n = mc.n, y = x / n, crateBot = FLOOR - y * PUL.pxm, crateTop = crateBot - PUL.crateH;
      const botY = n > 1 ? crateTop - 22 : crateTop;   // centers of the moving wheels (or the crate's hook for 1 rope)
      return Object.assign({ y, crateBot, crateTop, botY, cornerY: PUL.topY - PUL.r + CR }, reeving(n));
    }
    // L is the distance along the ramp from the floor up to the hold line (height h). The board keeps going a little higher.
    const L = mc.L, h = rig.h, hTop = h + RAMP.extra, Lf = L * hTop / h, run = Math.sqrt(Math.max(0, Lf * Lf - hTop * hTop));
    const top = { x: RAMP.platR, y: FLOOR - hTop * RAMP.pxm }, foot = { x: RAMP.platR + run * RAMP.pxm, y: FLOOR };
    const ux = (top.x - foot.x) / (Lf * RAMP.pxm), uy = (top.y - foot.y) / (Lf * RAMP.pxm);   // up-the-ramp, unit
    const nx = -uy, ny = ux;                                                                  // unit normal, pointing to the sky side of the board
    const line = { x: foot.x + ux * L * RAMP.pxm, y: FLOOR - h * RAMP.pxm };
    // The rope runs 25 px above the board, so the ramp pulley's center sits 25 − r above the board's top end
    const P = { x: top.x + nx * (25 - PUL.r), y: top.y + ny * (25 - PUL.r) };
    return { L, Lf, top, foot, line, ux, uy, nx, ny, P, y: (x / L) * h, cornerY: P.y - PUL.r + CR };
  }

  // ---------- The spring scale, with an optional digital readout ----------
  const needleY = F => SC.top + Math.max(0, Math.min(SC.max * 1.02, F)) / SC.max * (SC.bot - SC.top);
  function springScale(digital) {
    const tx = SC.x + 54, tw = 30;
    let s = `<rect x="${SC.x}" y="8" width="${SC.w}" height="${SC.bot + 58}" rx="12" class="to-scale-body"/>`
      + text(SC.x + SC.w / 2, 28, 'Spring', 'sv-small to-scale-title') + text(SC.x + SC.w / 2, 44, 'scale (N)', 'sv-small to-scale-title')
      + `<rect x="${tx}" y="${SC.top - 6}" width="${tw}" height="${SC.bot - SC.top + 12}" class="to-scale-tube"/>`;
    for (let f = 0; f <= SC.max; f += 5) {
      const y = needleY(f), lab = f % 25 === 0;
      s += `<line x1="${tx}" y1="${y.toFixed(1)}" x2="${tx + (lab ? 16 : 8)}" y2="${y.toFixed(1)}" class="to-tick ${lab ? 'to-tick-major' : ''}"/>`;
      if (lab) s += `<text x="${tx - 4}" y="${(y + 7).toFixed(1)}" class="sv-text to-scale-num" text-anchor="end">${f}</text>`;
    }
    s += `<g id="needle" transform="translate(0 ${needleY(0).toFixed(1)})"><rect x="${tx - 6}" y="-2" width="${tw + 12}" height="4" class="to-needle"/><path d="M ${tx + tw + 6} 0 l 9 -7 v 14 z" class="to-needle-tip"/></g>`;
    if (digital) s += `<rect x="${SC.x + 6}" y="${SC.bot + 16}" width="${SC.w - 12}" height="30" rx="5" class="to-lcd"/><text id="digital" x="${SC.x + SC.w / 2}" y="${SC.bot + 37}" class="sv-text to-lcd-text" text-anchor="middle">0 N</text>`;
    return s;
  }

  // ---------- The rope tape along the bottom ----------
  function ropeTape() {
    const x0 = TAPE.x0, x1 = x0 + 7 * TAPE.pxm;
    let s = `<rect x="${x0 - 10}" y="${TAPE.y}" width="${x1 - x0 + 20}" height="32" rx="3" class="to-tape"/>`;
    for (let i = 0; i <= 70; i++) {
      const x = x0 + i * TAPE.pxm / 10, big = i % 10 === 0, mid = i % 5 === 0;
      s += `<line x1="${x.toFixed(1)}" y1="${TAPE.y}" x2="${x.toFixed(1)}" y2="${TAPE.y + (big ? 12 : mid ? 9 : 5)}" class="to-tape-tick ${big ? 'to-tape-tick-big' : ''}"/>`;
      if (big) s += `<text x="${x.toFixed(1)}" y="${TAPE.y + 30}" class="sv-text to-tape-num" text-anchor="middle">${i / 10}</text>`;
    }
    s += text(x0 - 14, TAPE.y + 22, 'd (m)', 'sv-small to-tape-label', 'end');
    return s;
  }
  const tagX = x => TAPE.x0 + x * TAPE.pxm;
  // The grip you pull: the red tag marks the rope, the little scale sits in the rope, the grip shows the P key
  const grip = () => `<g id="grip"><path d="M 0 ${TAPE.rope} l -6 -14 h 12 z" class="to-tag"/><rect x="6" y="${TAPE.rope - 7}" width="22" height="14" rx="3" class="to-mini-scale"/>`
    + `<rect x="30" y="${TAPE.rope - 12}" width="24" height="24" rx="5" class="to-grip"/><text x="42" y="${TAPE.rope + 6}" class="sv-text to-grip-key" text-anchor="middle">P</text></g>`;

  // ---------- The two machines ----------
  function pulleyStatic(rig, mc) {
    const g = geo(rig, mc, 0), R = PUL.r, tops = g.wheels.filter(w => !w.bot);
    const lineY = FLOOR - rig.h * PUL.pxm, band = 0.20 * PUL.pxm;
    const xsTop = tops.map(w => w.x).concat(g.deadTop ? [g.xs[0]] : []);
    const bx0 = Math.min(...xsTop) - R - 5, bx1 = Math.max(...xsTop) + R + 5;
    let s = `<rect x="150" y="${PUL.beam - 14}" width="360" height="14" class="to-beam"/>`;
    s += `<rect x="${(bx0 + bx1) / 2 - 4}" y="${PUL.beam}" width="8" height="${PUL.topY - R - 5 - PUL.beam}" class="to-hanger"/>`;
    s += `<rect x="${bx0}" y="${PUL.topY - R - 5}" width="${bx1 - bx0}" height="${2 * R + 10}" rx="7" class="to-block"/>`;
    // the hold line and its band
    s += `<rect x="250" y="${(lineY - band).toFixed(1)}" width="210" height="${(2 * band).toFixed(1)}" class="to-band"/>`;
    s += `<line x1="250" y1="${lineY}" x2="460" y2="${lineY}" class="to-line"/>` + text(244, lineY + 5, 'hold line', 'sv-small to-line-text', 'end');
    s += ruler(470, FLOOR, PUL.pxm, 1.8);
    return s;
  }
  function ruler(x, floor, pxm, maxH) {
    let s = `<rect x="${x}" y="${floor - maxH * pxm}" width="38" height="${maxH * pxm}" class="to-ruler"/>`;
    for (let i = 0; i <= Math.round(maxH * 10); i++) {
      const y = floor - i * pxm / 10, major = i % 5 === 0;
      s += `<line x1="${x}" y1="${y.toFixed(1)}" x2="${x + (major ? 12 : 6)}" y2="${y.toFixed(1)}" class="to-ruler-tick"/>`;
      if (major && i) s += `<text x="${x + 13}" y="${(y + 5).toFixed(1)}" class="sv-text to-ruler-num">${(i / 10).toFixed(1)}</text>`;
    }
    return s + `<text x="${x + 13}" y="${floor - 4}" class="sv-text to-ruler-num">m</text>`;
  }
  function rampStatic(rig, mc) {
    const g = geo(rig, mc, 0), band = 0.20 * RAMP.pxm;
    let s = `<rect x="${g.top.x - 6}" y="${g.top.y}" width="12" height="${FLOOR - g.top.y}" class="to-platform"/>`;
    s += ruler(60, FLOOR, RAMP.pxm, 1.8);
    s += `<path d="M ${g.foot.x} ${FLOOR} L ${g.top.x} ${g.top.y} L ${g.top.x} ${FLOOR} Z" class="to-wedge"/>`;
    s += `<line x1="${g.foot.x}" y1="${FLOOR}" x2="${g.top.x}" y2="${g.top.y}" class="to-ramp"/>`;
    const x0 = 100, x1 = Math.min(g.foot.x, g.line.x + 70);
    s += `<rect x="${x0}" y="${(g.line.y - band).toFixed(1)}" width="${(x1 - x0).toFixed(1)}" height="${(2 * band).toFixed(1)}" class="to-band"/>`;
    s += `<line x1="${x0}" y1="${g.line.y}" x2="${x1.toFixed(1)}" y2="${g.line.y}" class="to-line"/>` + text(x0 + 2, g.line.y - 9, 'hold line', 'sv-small to-line-text', 'start');
    // a dimension line on the open side, above the cart's path: from the floor up to the hold line, parallel to the board
    const off = 54, ext = (x, y) => `M ${(x + g.nx * 6).toFixed(1)} ${(y + g.ny * 6).toFixed(1)} L ${(x + g.nx * (off + 6)).toFixed(1)} ${(y + g.ny * (off + 6)).toFixed(1)}`;
    const ax = g.foot.x + g.nx * off, ay = FLOOR + g.ny * off, bx = g.line.x + g.nx * off, by = g.line.y + g.ny * off;
    const ang = deg(Math.atan2(g.foot.y - g.line.y, g.foot.x - g.line.x));
    s += `<path d="${ext(g.foot.x, FLOOR)} ${ext(g.line.x, g.line.y)}" class="to-dimext"/><path d="M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}" class="to-dimline"/>`
      + `<g transform="translate(${(ax + (bx - ax) * 0.3).toFixed(1)} ${(ay + (by - ay) * 0.3).toFixed(1)}) rotate(${ang.toFixed(1)})"><rect x="-27" y="-11" width="54" height="21" rx="10" class="to-dim-pill"/><text x="0" y="4.5" class="sv-text to-dim-text" text-anchor="middle">${fmt(mc.L)} m</text></g>`;
    s += `<line x1="${g.top.x}" y1="${g.top.y}" x2="${g.P.x.toFixed(1)}" y2="${g.P.y.toFixed(1)}" class="to-bracket"/>`;
    return s;
  }

  // The cart rolls up the ramp to the LEFT. Its frame starts at the front wheel and points back toward the rear wheel,
  // so the body is always drawn right side up.
  const WB = 0.5;   // wheelbase, m
  function cartFrame(g, x) {
    const path = s => (s >= 0 ? { x: g.foot.x + g.ux * s * RAMP.pxm, y: g.foot.y + g.uy * s * RAMP.pxm } : { x: g.foot.x - s * RAMP.pxm, y: FLOOR });
    const F = path(x), R = path(x - WB);
    return { F, a: Math.atan2(R.y - F.y, R.x - F.x) };
  }
  function cartSvg(rig, g, x) {
    const { F, a } = cartFrame(g, x), len = WB * RAMP.pxm;
    return `<g transform="translate(${F.x.toFixed(1)} ${F.y.toFixed(1)}) rotate(${(a * 180 / Math.PI).toFixed(2)})">`
      + `<rect x="-8" y="-40" width="${len + 16}" height="30" rx="4" class="to-crate"/>`
      + `<text x="${len / 2}" y="-19" class="sv-text to-crate-text" text-anchor="middle">${rig.m} kg</text>`
      + wheel(0, -6, 6, 'to-cartwheel') + wheel(len, -6, 6, 'to-cartwheel') + '</g>';
  }
  function cartFront(g, x) {
    const { F, a } = cartFrame(g, x), lx = -8, ly = -25;
    return { x: F.x + lx * Math.cos(a) - ly * Math.sin(a), y: F.y + lx * Math.sin(a) + ly * Math.cos(a) };
  }
  // ---------- The rope, section by section ----------
  // Each section's texture moves with the rope material in that section, so a strand tied to a block stays still and the free end moves fastest.
  // The free end: over the last wheel, along the top, down the left edge to the floor pulley. Then the floor run to the tag.
  const freeTail = g => `L ${CORNER_X} ${g.cornerY - CR} A ${CR} ${CR} 0 0 0 ${CORNER_X - CR} ${g.cornerY} L ${FLOOR_PULLEY.x - CR} ${FLOOR_PULLEY.y} A ${CR} ${CR} 0 0 0 ${FLOOR_PULLEY.x} ${FLOOR_PULLEY.y + CR}`;
  const freePath = (x0, y0, g) => `M ${x0.toFixed(1)} ${y0.toFixed(1)} ${freeTail(g)}`;
  const floorPath = x => `M ${FLOOR_PULLEY.x} ${FLOOR_PULLEY.y + CR} L ${tagX(x).toFixed(1)} ${TAPE.rope}`;
  function ropeParts(rig, mc, x) {
    const g = geo(rig, mc, x), parts = [];
    if (mc.mach === 'pulley') {
      const u = g.y, R = PUL.r, spd = PUL.pxm;
      g.xs.forEach((xx, i) => parts.push({ id: `st${i + 1}`, d: `M ${xx} ${PUL.topY} L ${xx} ${g.botY.toFixed(1)}`, off: g.speeds[i] * u * spd }));
      parts.push({ id: 'rfree', d: freePath(g.xs[g.xs.length - 1] - R, PUL.topY - R, g), off: -x * spd });
    } else {
      const f = cartFront(g, x), R = PUL.r, T1 = { x: g.P.x + g.nx * R, y: g.P.y + g.ny * R };   // where the ramp rope touches the pulley
      // drawn from the ramp pulley down to the cart: the material moves back toward the pulley as you pull
      parts.push({ id: 'rcart', d: `M ${T1.x.toFixed(1)} ${T1.y.toFixed(1)} L ${f.x.toFixed(1)} ${f.y.toFixed(1)}`, off: x * RAMP.pxm });
      parts.push({ id: 'rfree', d: `M ${T1.x.toFixed(1)} ${T1.y.toFixed(1)} A ${R} ${R} 0 0 0 ${g.P.x.toFixed(1)} ${(g.P.y - R).toFixed(1)} ${freeTail(g)}`, off: -x * RAMP.pxm });
    }
    parts.push({ id: 'rfloor', d: floorPath(x), off: -x * TAPE.pxm });
    return parts;
  }
  // How far each wheel has turned, in degrees (negative = counterclockwise on screen)
  function wheelAngles(rig, mc, x) {
    const g = geo(rig, mc, x), a = {};
    if (mc.mach === 'pulley') {
      g.wheels.forEach(w => { a[w.id] = -deg(w.rel * g.y * PUL.pxm / PUL.r); });
      a.wcorner = -deg(x * PUL.pxm / CR);
    } else {
      a.wramp = -deg(x * RAMP.pxm / PUL.r);
      a.wcorner = -deg(x * RAMP.pxm / CR);
    }
    a.wfloor = -deg(x * TAPE.pxm / CR);
    return a;
  }

  // The moving parts, drawn at rope position x
  function movers(rig, mc, x) {
    let s = '';
    const ang = wheelAngles(rig, mc, x), R = PUL.r;
    if (mc.mach === 'pulley') {
      const g0 = geo(rig, mc, 0), n = mc.n, bots = g0.wheels.filter(w => w.bot);
      // ropes first, so the wheels sit on top of them
      ropeParts(rig, mc, x).forEach(p => { s += ropeSeg(p.id, p.d, p.off); });
      // the moving block: drawn at the floor and lifted by the transform
      s += `<g id="load" transform="translate(0 ${(-(x / n) * PUL.pxm).toFixed(2)})">`;
      // the crate hangs centered under the moving block (or right under the single rope)
      let cxC = g0.xs[0];
      if (n > 1) {
        const xsBot = bots.map(w => w.x).concat(g0.deadTop ? [] : [g0.xs[0]]);
        const bx0 = Math.min(...xsBot) - R - 5, bx1 = Math.max(...xsBot) + R + 5;
        cxC = (bx0 + bx1) / 2;
        bots.forEach(w => { s += `<path d="M ${w.x - R} ${g0.botY} A ${R} ${R} 0 0 0 ${w.x + R} ${g0.botY}" class="to-rope"/>`; });
        s += `<rect x="${bx0}" y="${g0.botY - R - 5}" width="${bx1 - bx0}" height="${2 * R + 10}" rx="7" class="to-block to-block-front"/>`;
        bots.forEach(w => { s += spun(w.id, w.x, g0.botY, R, ang[w.id]); });
        s += `<line x1="${cxC}" y1="${g0.botY + R + 5}" x2="${cxC}" y2="${g0.crateTop}" class="to-link"/>`;
      }
      s += `<rect x="${cxC - PUL.crateW / 2}" y="${g0.crateTop}" width="${PUL.crateW}" height="${PUL.crateH}" rx="4" class="to-crate"/>`
        + text(cxC, g0.crateTop + 31, `${rig.m} kg`, 'to-crate-text')
        + `<path d="M ${cxC + PUL.crateW / 2} ${g0.crateBot} H 470" class="to-pointer"/></g>`;
      // the top wheels, with the rope over the top of each
      g0.wheels.filter(w => !w.bot).forEach(w => { s += `<path d="M ${w.x - R} ${PUL.topY} A ${R} ${R} 0 0 1 ${w.x + R} ${PUL.topY}" class="to-rope"/>` + spun(w.id, w.x, PUL.topY, R, ang[w.id]); });
    } else {
      const g = geo(rig, mc, x);
      s += `<g id="load">${cartSvg(rig, g, x)}</g>`;
      ropeParts(rig, mc, x).forEach(p => { s += ropeSeg(p.id, p.d, p.off); });
      s += spun('wramp', FL_r(g.P.x), FL_r(g.P.y), R, ang.wramp);
    }
    return s;
  }

  // o = { rig, mc, x, F, hold (0–1), locked, digital }
  function lab(o) {
    const { rig, mc } = o, x = o.x || 0;
    let s = `<rect x="0" y="${FLOOR}" width="${SC.x - 8}" height="${H - FLOOR}" class="to-ground"/><line x1="0" y1="${FLOOR}" x2="${SC.x - 8}" y2="${FLOOR}" class="to-floor-line"/>`;
    s += mc.mach === 'pulley' ? pulleyStatic(rig, mc) : rampStatic(rig, mc);
    s += ropeTape();
    const g = geo(rig, mc, 0), ang = wheelAngles(rig, mc, x);
    s += movers(rig, mc, x);
    s += spun('wcorner', CORNER_X, g.cornerY, CR, ang.wcorner) + spun('wfloor', FLOOR_PULLEY.x, FLOOR_PULLEY.y, CR, ang.wfloor);
    s += `<g id="gripG" transform="translate(${tagX(x).toFixed(1)} 0)">${grip()}</g>`;
    s += springScale(o.digital);
    s += `<g id="holdG"><rect x="62" y="${mc.mach === 'pulley' ? 92 : 14}" width="170" height="44" rx="8" class="sv-plate to-hold-box"/>`
      + `<text id="holdTxt" x="72" y="${mc.mach === 'pulley' ? 110 : 32}" class="sv-text sv-small">${o.locked ? '🔒 Latched' : 'Hold steady'}</text>`
      + `<rect x="72" y="${mc.mach === 'pulley' ? 118 : 40}" width="150" height="9" rx="4" class="to-hold-track"/>`
      + `<rect id="holdBar" x="72" y="${mc.mach === 'pulley' ? 118 : 40}" width="${(150 * (o.locked ? 1 : o.hold || 0)).toFixed(1)}" height="9" rx="4" class="to-hold-fill"/></g>`;
    return frame(s, 'to-lab');
  }
  // Move the parts already on screen
  function place(root, o) {
    if (!root) return;
    const { rig, mc, x } = o;
    const set = (id, attr, v) => { const el = root.querySelector('#' + id); if (el) el.setAttribute(attr, v); };
    const load = root.querySelector('#load');
    if (load) {
      const g = geo(rig, mc, x);
      if (mc.mach === 'pulley') load.setAttribute('transform', `translate(0 ${(-(g.y) * PUL.pxm).toFixed(2)})`);
      else load.innerHTML = cartSvg(rig, g, x);
    }
    ropeParts(rig, mc, x).forEach(p => { set(p.id, 'd', p.d); set(`${p.id}t`, 'd', p.d); set(`${p.id}t`, 'stroke-dashoffset', p.off.toFixed(1)); });
    const ang = wheelAngles(rig, mc, x);
    Object.keys(ang).forEach(id => {
      const el = root.querySelector('#' + id); if (!el) return;
      const c = el.querySelector('circle');
      el.setAttribute('transform', `rotate(${ang[id].toFixed(1)} ${c.getAttribute('cx')} ${c.getAttribute('cy')})`);
    });
    set('gripG', 'transform', `translate(${tagX(x).toFixed(1)} 0)`);
    set('needle', 'transform', `translate(0 ${needleY(o.F || 0).toFixed(1)})`);
    const dg = root.querySelector('#digital');
    if (dg) dg.textContent = `${o.locked ? window.FL.fmt(window.FL.round(o.F || 0, 1)) : Math.round(o.F || 0)} N`;
    set('holdBar', 'width', (150 * (o.locked ? 1 : Math.min(1, o.hold || 0))).toFixed(1));
    const ht = root.querySelector('#holdTxt');
    if (ht) ht.textContent = o.locked ? '🔒 Latched' : (o.hold > 0 ? 'Hold steady…' : 'Hold steady');
  }

  // ---------- The graph: force against rope distance ----------
  function graph(o) {
    const { spec } = o, b = spec.box, FL = window.FL, px = (x, y) => FL.toPx(spec, x, y);
    let s = `<rect x="${b.x0}" y="${b.y1}" width="${b.x1 - b.x0}" height="${b.y0 - b.y1}" class="fl-plot"/>`;
    for (let i = 1; i * spec.x.minor <= spec.x.max + 1e-9; i++) {
      const v = i * spec.x.minor, major = Math.abs(v / spec.x.step - Math.round(v / spec.x.step)) < 1e-6, X = px(v, 0).x.toFixed(1);
      s += `<line x1="${X}" y1="${b.y0}" x2="${X}" y2="${b.y1}" class="${major ? 'fl-grid-major' : 'fl-grid-minor'}"/>`;
      if (major && !o.hideNums) s += text(X, b.y0 + 24, String(v), 'fl-tick-num');
    }
    for (let i = 1; i * spec.y.minor <= spec.y.max + 1e-9; i++) {
      const v = i * spec.y.minor, major = Math.abs(v / spec.y.step - Math.round(v / spec.y.step)) < 1e-6, Y = px(0, v).y.toFixed(1);
      s += `<line x1="${b.x0}" y1="${Y}" x2="${b.x1}" y2="${Y}" class="${major ? 'fl-grid-major' : 'fl-grid-minor'}"/>`;
      if (major && !o.hideNums) s += text(b.x0 - 10, Number(Y) + 6, String(Math.round(v)), 'fl-tick-num', 'end');
    }
    if (!o.hideNums) s += text(b.x0 - 10, b.y0 + 24, '0', 'fl-tick-num', 'end');
    // rectangles: the area under a point is F × d
    (o.rects || []).forEach(r => {
      const P = px(r.x, r.y);
      s += `<rect x="${b.x0}" y="${P.y.toFixed(1)}" width="${(P.x - b.x0).toFixed(1)}" height="${(b.y0 - P.y).toFixed(1)}" class="to-area ${r.cls || ''}"/>`;
      if (r.label) s += plate((b.x0 + P.x) / 2, b.y0 - 14 - (r.lift || 0), r.label, 'sv-small to-area-text');
    });
    s += `<path d="M ${b.x0} ${b.y1} V ${b.y0} H ${b.x1}" class="fl-axis"/>` + text(b.x1 + 16, b.y0 + 7, 'x', 'fl-axis-tag') + text(b.x0, b.y1 - 12, 'y', 'fl-axis-tag');
    s += text((b.x0 + b.x1) / 2, H - 18, spec.x.label, 'fl-axis-label wk-d-text');
    s += `<text transform="translate(26 ${(b.y0 + b.y1) / 2}) rotate(-90)" class="sv-text fl-axis-label wk-F-text" text-anchor="middle">${esc(spec.y.label)}</text>`;
    if (o.curve) {
      const Wc = o.curve, xa = Math.max(0.2, Wc / spec.y.max), pts = [];
      for (let i = 0; i <= 60; i++) { const x = xa + (spec.x.max - xa) * i / 60; const P = px(x, Wc / x); pts.push(`${P.x.toFixed(1)} ${P.y.toFixed(1)}`); }
      s += `<path d="M ${pts.join(' L ')}" class="fl-fit"/>`;
    }
    if (o.guide) { const g = px(o.guide.x, o.guide.y); s += `<path d="M ${g.x} ${b.y0} V ${g.y} H ${b.x0}" class="fl-guide"/>`; }
    if (typeof o.readX === 'number') {
      const rx = px(o.readX, 0).x.toFixed(1);
      s += `<line x1="${rx}" y1="${b.y0}" x2="${rx}" y2="${b.y1}" class="wk-read-line"/>` + plate(Number(rx), b.y1 + 24, `d = ${fmt(o.readX)} m`, 'sv-small wk-d-text');
    }
    (o.points || []).forEach(pt => {
      const c = px(pt.x, pt.y), big = pt.cls === 'fl-pt-new' ? 1.3 : 1, attr = pt.i !== undefined ? ` data-pt="${pt.i}"` : '';
      if (pt.mach === 'ramp') {
        const r = 13 * big;   // bigger than a pulley circle, so it shows around one at the same spot
        s += `<path d="M ${c.x.toFixed(1)} ${(c.y - r).toFixed(1)} l ${r} ${(r * 1.6).toFixed(1)} h ${(-2 * r)} z" class="fl-pt to-pt-ramp ${pt.cls || ''}"${attr}/>`;
      } else s += `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${(7 * big).toFixed(1)}" class="fl-pt ${pt.cls || ''}"${attr}/>`;
    });
    (o.points || []).filter(pt => pt.label).forEach(pt => { const c = px(pt.x, pt.y); s += text(c.x + 12, c.y - 12, pt.label, 'sv-small fl-pt-label', c.x > b.x1 - 150 ? 'end' : 'start'); });
    if (o.miss) s += `<path d="M ${o.miss.x - 7} ${o.miss.y - 7} l 14 14 m 0 -14 l -14 14" class="fl-miss"/>`;
    if (o.legend !== false && (o.points || []).length) {
      s += `<g transform="translate(${b.x1 - 150} ${b.y1 + 14})"><rect x="0" y="0" width="146" height="54" rx="6" class="sv-plate"/>`
        + `<circle cx="16" cy="18" r="6" class="fl-pt"/>${text(30, 23, 'pulley', 'sv-small', 'start')}`
        + `<path d="M 16 32 l 8 13 h -16 z" class="fl-pt to-pt-ramp"/>${text(30, 45, 'ramp', 'sv-small', 'start')}</g>`;
    }
    if (o.note) s += plate(b.x0 + 14, b.y1 + 28, o.note, 'sv-small', 'start');
    return frame(s, o.clickable ? 'fl-click fl-cross' : '');
  }

  // ---------- Mastery Check pictures: every number is on the picture ----------
  function problem(it) {
    const F0 = 380;
    let s = `<rect x="0" y="${F0}" width="${W}" height="${H - F0}" class="to-ground"/><line x1="0" y1="${F0}" x2="${W}" y2="${F0}" class="to-floor-line"/>`;
    const crate = (x, y, w, h, label) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="to-crate"/>${label ? text(x + w / 2, y + h / 2 + 6, label, 'to-crate-text') : ''}`;
    const dimV = (x, y1, y2, label) => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" class="to-dim"/><path d="M ${x - 6} ${y1} h 12 M ${x - 6} ${y2} h 12" class="to-dim"/>` + plate(x + 12, (y1 + y2) / 2 + 6, label, 'wk-d-text', 'start');
    if (it.kind === 'pulleyD' || it.kind === 'pulleyF' || it.kind === 'same') {
      const n = it.n, cx = 300, xs = Array.from({ length: n }, (_, i) => cx + (i - (n - 1) / 2) * 18), bw = n * 18 + 20, top = 70, low = 250;
      s += `<rect x="150" y="40" width="300" height="14" class="to-beam"/><rect x="${cx - bw / 2}" y="${top}" width="${bw}" height="30" rx="8" class="to-block"/>`;
      xs.forEach(x => { s += wheel(x, top + 15, 7) + `<line x1="${x}" y1="${top + 22}" x2="${x}" y2="${low}" class="to-rope"/>`; });
      s += `<rect x="${cx - bw / 2}" y="${low}" width="${bw}" height="26" rx="8" class="to-block"/>` + crate(cx - 45, low + 34, 90, 64, it.kind === 'same' ? 'crate' : `${fmt(it.Fg)} N`);
      s += `<path d="M ${xs[0] - 7} ${top + 15} H ${cx - 80} V 330" class="to-rope"/>` + plate(cx - 88, 350, 'pull ↓', 'sv-small', 'end');
      s += plate(560, 120, `${n} supporting ropes`, 'fl-value');
      if (it.kind === 'pulleyD') s += `<rect x="470" y="${F0 - it.h / 3.2 * 150}" width="140" height="${it.h / 3.2 * 150}" class="to-platform"/>` + dimV(630, F0 - it.h / 3.2 * 150, F0, `h = ${fmt(it.h)} m`);
      if (it.kind === 'same') s += plate(560, 170, `straight up: W = ${fmt(it.W)} J`, 'sv-small');
      return frame(s);
    }
    if (it.kind === 'rampW' || it.kind === 'rampL') {
      const x0 = 110, x1 = 620, topY = 220;
      s += `<rect x="${x1}" y="${topY}" width="120" height="${F0 - topY}" class="to-platform"/><path d="M ${x0} ${F0} L ${x1} ${topY} L ${x1} ${F0} Z" class="to-wedge"/><line x1="${x0}" y1="${F0}" x2="${x1}" y2="${topY}" class="to-ramp"/>`;
      const a = Math.atan2(topY - F0, x1 - x0) * 180 / Math.PI, mx = x0 + (x1 - x0) * 0.35, my = F0 + (topY - F0) * 0.35;
      s += `<g transform="translate(${mx} ${my}) rotate(${a.toFixed(1)})"><rect x="-40" y="-50" width="80" height="50" rx="4" class="to-crate"/>`
        + `<line x1="44" y1="-25" x2="120" y2="-25" class="to-arrow-F"/><path d="M 128 -25 l -12 -7 v 14 z" class="to-arrow-F-head"/></g>`;
      s += plate(mx + 90, my - 70, it.kind === 'rampW' ? `push F = ${fmt(it.F)} N` : `push at most ${fmt(it.F)} N`, 'wk-F-text');
      s += plate((x0 + x1) / 2 + 30, (F0 + topY) / 2 + 50, it.kind === 'rampW' ? `smooth ramp, L = ${fmt(it.L)} m` : 'smooth ramp, L = ?', 'wk-d-text', 'start');
      if (it.kind === 'rampL') s += dimV(x1 + 135, topY, F0, `h = ${fmt(it.h)} m`) + plate(mx, my + 40, `box: F_g = ${fmt(it.Fg)} N`, 'sv-small');
      s += plate(W / 2, 40, it.kind === 'rampW' ? 'Pushing a box up a smooth ramp' : 'Moving day: how long a ramp?', 'fl-title');
      return frame(s);
    }
    if (it.kind === 'lift') {
      const shH = Math.min(220, it.h / 3 * 220);
      s += `<rect x="460" y="${F0 - shH}" width="200" height="${shH}" class="to-platform"/>` + crate(200, F0 - 70, 100, 70, `${it.m} kg`);
      s += `<path d="M 250 ${F0 - 80} V ${F0 - shH - 40} H 430" class="to-arrow-path"/>` + dimV(680, F0 - shH, F0, `h = ${fmt(it.h)} m`);
      s += plate(W / 2, 40, 'Lifting a box straight up onto a shelf', 'fl-title');
      return frame(s);
    }
    const c = window.FL.quizCurve(it), spec = window.FL.specFor(it.W);
    return graph({ spec, points: c.points, curve: it.W, readX: it.x, legend: false });
  }

  window.Scene = { W, H, FLOOR, TAPE, SC, lab, place, graph, problem, geo, reeving, tagX, needleY, plate, text, frame };
})();

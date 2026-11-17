// Mechanical Work Studio — the direction-check pictures (a "what is happening" picture beside a free-body diagram),
// the hoist demo, graphs, and the problem pictures. Numbers live on these pictures, not in the question.

(function () {
  const K = window.SceneKit, FL = window.FL;
  const { W, H, fmt, text, plate, arrow, dim, frame, bayBackdrop, readouts, workMeter, meterText, esc } = K;
  const VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  // ---------- Small drawings ----------
  const ease = p => p * p * (3 - 2 * p);            // slow start, slow stop
  const easeOut = p => 1 - (1 - p) * (1 - p);       // fast start, slowing down
  // A worker standing at x with feet on the floor: filled shirt, pants, head, helmet, and hands.
  // hands: [[x, y], [x, y]]. o: { lean (pixels the shoulders lean forward, + is right), walk (0–1 for a stride), cls }
  function person(x, floor, hands, o = {}) {
    if (typeof o === 'string') o = { cls: o };
    const lean = o.lean || 0, swing = typeof o.walk === 'number' ? Math.sin(o.walk * Math.PI * 6) * 11 : 0;
    const hip = { x, y: floor - 60 }, sh = { x: x + lean, y: floor - 122 }, head = { x: x + lean * 1.25, y: floor - 148 };
    const arm = ([hx, hy]) => {
      const mx = (sh.x + hx) / 2, my = (sh.y + hy) / 2, dx = hx - sh.x, dy = hy - sh.y, L = Math.hypot(dx, dy) || 1;
      const bend = Math.max(0, 62 - L) * 0.6;   // a short reach bends the elbow outward and down
      return `<polyline points="${sh.x},${sh.y} ${(mx - (dy / L) * bend).toFixed(1)},${(my + Math.abs(dx / L) * bend).toFixed(1)} ${hx},${hy}" class="wk-p-arm"/><circle cx="${hx}" cy="${hy}" r="5.5" class="wk-p-skin"/>`;
    };
    return `<g class="wk-p ${o.cls || ''}">`
      + `<line x1="${hip.x}" y1="${hip.y}" x2="${x - 11 + swing}" y2="${floor - 3}" class="wk-p-leg"/><line x1="${hip.x}" y1="${hip.y}" x2="${x + 11 - swing}" y2="${floor - 3}" class="wk-p-leg"/>`
      + `<line x1="${hip.x}" y1="${hip.y}" x2="${sh.x}" y2="${sh.y + 6}" class="wk-p-shirt"/>`
      + `<circle cx="${head.x}" cy="${head.y}" r="15" class="wk-p-skin"/><path d="M ${head.x - 16} ${head.y - 4} a 16 14 0 0 1 32 0 z" class="wk-helmet"/><line x1="${head.x - 18}" y1="${head.y - 4}" x2="${head.x + 18}" y2="${head.y - 4}" class="wk-helmet-brim"/>`
      + (hands || []).map(arm).join('') + '</g>';
  }
  const crate = (x, y, w, h, cls = '') => `<g class="${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="wk-crate"/><path d="M ${x} ${y} L ${x + w} ${y + h} M ${x + w} ${y} L ${x} ${y + h}" class="wk-crate-x"/></g>`;
  const sled = (x, floor, cls = '') => `<g class="${cls}">${crate(x, floor - 62, 80, 52)}<path d="M ${x - 6} ${floor - 4} H ${x + 84} q 10 0 10 -10" class="wk-runner"/></g>`;
  const box = (x, y, cls = '') => `<g class="${cls}"><rect x="${x}" y="${y}" width="60" height="42" rx="3" class="wk-box"/><line x1="${x}" y1="${y + 14}" x2="${x + 60}" y2="${y + 14}" class="wk-tape-line"/></g>`;
  const cart = (x, floor, cls = '') => `<g class="${cls}"><rect x="${x}" y="${floor - 58}" width="90" height="40" rx="4" class="wk-cart"/><circle cx="${x + 18}" cy="${floor - 10}" r="10" class="wk-wheel"/><circle cx="${x + 72}" cy="${floor - 10}" r="10" class="wk-wheel"/>${crate(x + 22, floor - 96, 46, 38)}</g>`;
  const ground = (x1, x2, floor) => `<rect x="${x1}" y="${floor}" width="${x2 - x1}" height="${H - floor}" class="wk-ground"/><line x1="${x1}" y1="${floor}" x2="${x2}" y2="${floor}" class="wk-floor-line"/>`;
  const rough = (x1, n) => `<path d="${Array.from({ length: n }, (_, i) => `M ${x1 + i * 11} ${F0 + 2} l -8 12`).join(' ')}" class="wk-rough"/>`;

  // ---------- Pictures for each direction scene, at progress p (0 = start, 1 = end of the motion) ----------
  // Each returns { svg, at }: at is the point on the object where the motion arrow starts. Floor at y = 400, panel 472 wide.
  const F0 = 400;
  const PIC = {
    push(p) { const x = 270 - 160 * (1 - p); return { svg: rough(40, 40) + sled(x, F0) + person(x - 52, F0, [[x, 358], [x + 2, 368]], { lean: 16, walk: p }), at: { x: x + 40, y: 364, r: 46 } }; },
    brake(p) { const x = 300 - 190 * (1 - easeOut(p)); return { svg: rough(40, 40) + sled(x, F0) + text(240, F0 + 42, 'rough floor', 'sv-small fl-dim'), at: { x: x + 40, y: 364, r: 46 } }; },
    carry(p) { const x = 280 - 170 * (1 - p); return { svg: box(x - 28, 288) + person(x, F0, [[x - 22, 330], [x + 24, 330]], { walk: p }), at: { x: x + 2, y: 309, r: 36 } }; },
    lower(p) { const y = 300 - 100 * (1 - ease(p)); return { svg: crate(226, y, 70, 52) + person(200, F0, [[238, y + 54], [256, y + 54]], { lean: 10 }), at: { x: 261, y: y + 26, r: 40 } }; },
    lift(p) {
      const y = 184 + 174 * (1 - ease(p));
      return { svg: `<rect x="292" y="226" width="160" height="10" class="wk-shelf"/><line x1="442" y1="236" x2="442" y2="${F0}" class="wk-shelf-leg"/>` + box(230, y) + person(196, F0, [[240, y + 42], [256, y + 42]], { lean: 8 }), at: { x: 260, y: y + 21, r: 36 } };
    },
    hold(p) {
      const a = 360 * p, rad = a * Math.PI / 180;
      return { svg: crate(198, 160, 76, 56) + person(236, F0, [[212, 216], [260, 216]])
        + `<circle cx="390" cy="150" r="30" class="wk-clock"/><line x1="390" y1="150" x2="${(390 + 22 * Math.sin(rad)).toFixed(1)}" y2="${(150 - 22 * Math.cos(rad)).toFixed(1)}" class="wk-clock-hand"/><line x1="390" y1="150" x2="406" y2="158" class="wk-clock-hand"/>`
        + text(390, 204, '30 s, not moving', 'sv-small fl-dim'), at: { x: 236, y: 188, r: 42 } };
    },
    pull(p) { const s = 150 * (1 - p); return { svg: cart(220 + s, F0) + `<line x1="${220 + s}" y1="${F0 - 40}" x2="${150 + s}" y2="${F0 - 92}" class="wk-strap"/>` + person(118 + s, F0, [[150 + s, F0 - 92], [146 + s, F0 - 96]], { lean: -14, walk: p }), at: { x: 265 + s, y: 350, r: 52 } }; },
    stop(p) { const s = 170 * (1 - easeOut(p)); return { svg: cart(150 + s, F0) + person(104 + s, F0, [[150 + s, F0 - 46], [150 + s, F0 - 36]], { lean: 10 }), at: { x: 195 + s, y: 350, r: 52 } }; },
    forklift(p) {
      const y = F0 - 160 + 110 * (1 - ease(p));
      const pal = `<rect x="232" y="0" width="110" height="10" class="wk-pallet"/>${box(236, -42)}${box(280, -42)}<rect x="208" y="8" width="132" height="6" class="wk-mast"/>`;
      return { svg: `<rect x="70" y="${F0 - 110}" width="120" height="80" rx="10" class="wk-forklift"/><rect x="88" y="${F0 - 160}" width="70" height="52" rx="6" class="wk-forklift-cab"/>`
        + `<circle cx="100" cy="${F0 - 22}" r="20" class="wk-wheel"/><circle cx="168" cy="${F0 - 22}" r="20" class="wk-wheel"/><rect x="198" y="120" width="12" height="${F0 - 120}" class="wk-mast"/>`
        + `<g transform="translate(0 ${y.toFixed(1)})">${pal}</g>`, at: { x: 287, y: y - 20, r: 58 } };
    },
    elevator(p) {
      const y = 250 - 120 * (1 - ease(p));
      return { svg: `<rect x="170" y="44" width="150" height="${F0 - 44}" class="wk-shaft"/><circle cx="245" cy="56" r="12" class="wk-wheel"/><line x1="245" y1="56" x2="245" y2="${y}" class="wk-strap"/>`
        + `<rect x="190" y="${y}" width="110" height="90" rx="6" class="wk-elev"/><line x1="245" y1="${y}" x2="245" y2="${y + 90}" class="wk-elev-door"/>`, at: { x: 245, y: y + 45, r: 60 } };
    },
    tray(p) {
      const s = 170 * (1 - p);
      return { svg: `<rect x="${146 + s}" y="226" width="76" height="8" rx="3" class="wk-tray"/><rect x="${160 + s}" y="204" width="14" height="22" class="wk-cup"/><rect x="${192 + s}" y="210" width="14" height="16" class="wk-cup"/>`
        + person(196 + s, F0, [[184 + s, 236], [184 + s, 236]], { walk: p }), at: { x: 184 + s, y: 222, r: 44 } };
    },
    wall: () => ({ svg: `<rect x="300" y="170" width="70" height="${F0 - 170}" class="wk-wall"/><path d="${Array.from({ length: 9 }, (_, i) => `M 300 ${196 + i * 25} H 370`).join(' ')}" class="wk-brick"/>`
      + person(250, F0, [[300, 284], [300, 296]], { lean: 14 }), at: { x: 335, y: 270, r: 40 } })
  };

  // How far along the motion the object is at progress p, for the meters (matches each picture's easing)
  const EASING = { brake: easeOut, stop: easeOut, lower: ease, lift: ease, forklift: ease, elevator: ease };
  const fracOf = (id, p) => (EASING[id] || (x => x))(p);

  // ---------- The free-body diagram panel, with a work meter for each force we follow ----------
  const FBD = { x: 486, y: 46, w: 262, h: 442, cx: 617, cy: 262, box: 24 };
  const PANEL_W = 472;
  const TRACK_CLS = ['wk-F', 'wk-F2'];
  function fbdArrow(dir, len, cls, label) {
    const [ux, uy] = VEC[dir], b = FBD.box + 2;
    const x1 = FBD.cx + ux * b, y1 = FBD.cy + uy * b, x2 = FBD.cx + ux * len, y2 = FBD.cy + uy * len;
    let s = arrow(x1, y1, x2, y2, cls, 5);
    // Labels sit beside the arrow, inside the panel: above a sideways arrow, to the right of an up or down arrow
    if (label) s += ux ? text(x2 - ux * 30, y2 - 14, label, `${cls}-text`) : text(x2 + 14, y2 + (uy > 0 ? -2 : 16), label, `${cls}-text`, 'start');
    return s;
  }
  // Which way a drag points, snapped to up, down, left or right. Null for a drag too short to count.
  function snapDir(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y;
    if (Math.hypot(dx, dy) < 16) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }
  const motionArrow = (at, d, cls = 'wk-d') => {
    const r = at.r || 20;
    if (d === 'none') return plate(at.x, at.y - r - 14, 'does not move', 'sv-small wk-d-text');
    const [ux, uy] = VEC[d], a = r + 6, b = r + 74;
    return arrow(at.x + ux * a, at.y + uy * a, at.x + ux * b, at.y + uy * b, cls, 6) + text(at.x + ux * (b + 14) + (uy ? 16 : 0), at.y + uy * (b + 14) + (ux ? -12 : 6), 'd', `${cls}-text`);
  };
  // Four arrow buttons around a point. Clicking one picks that direction (dragging still works too).
  // kind: 'motion' or 'force', so the page knows which answer the click sets.
  function aimCompass(cx, cy, r1, r2, kind) {
    return ['up', 'down', 'left', 'right'].map(dir => {
      const [ux, uy] = VEC[dir], mx = cx + ux * (r1 + r2) / 2, my = cy + uy * (r1 + r2) / 2;
      return `<g class="wk-aim-btn" data-aim="${kind}:${dir}"><circle cx="${mx}" cy="${my}" r="${(r2 - r1) / 2 + 8}" class="wk-aim-hit"/>`
        + arrow(cx + ux * r1, cy + uy * r1, cx + ux * r2, cy + uy * r2, 'wk-aim-arrow', 6) + '</g>';
    }).join('');
  }
  const isPerp = (a, b) => a && b && b !== 'none' && ((['up', 'down'].includes(a) && ['left', 'right'].includes(b)) || (['left', 'right'].includes(a) && ['up', 'down'].includes(b)));

  // The moving picture, with the one force we follow drawn on the object and labeled in plain words
  const PIC_DX = (W - PANEL_W) / 2;   // the scenes were drawn 472 wide; centered on the full picture now
  function forceArrow(at, t) {
    const [ux, uy] = VEC[t.dir], r = at.r || 20, a = r + 2, b = r + 72;
    const x2 = at.x + ux * b, y2 = at.y + uy * b;
    return arrow(at.x + ux * a, at.y + uy * a, x2, y2, 'wk-F', 7)
      + plate(x2 + ux * 18 + (uy ? 0 : 0), y2 + uy * 22 + (ux ? -22 : 6), `${t.label}: ${t.tag}`, 'sv-small wk-F-text', ux > 0 ? 'start' : ux < 0 ? 'end' : 'middle');
  }
  function dirPic(o) {
    const s0 = FL.SCENES[o.id], pic = PIC[o.id](o.p || 0);
    return pic.svg + forceArrow(pic.at, s0.track[0]);
  }
  // The work meters sit under the picture, one per tracked force. The student predicts on the meter itself:
  // tap ▲ (climbs), ■ (stays at 0 J) or ▼ (drops). Before Play the screen shows "?"; after Play it shows the work.
  // o = { id, preds, values (null = not run yet), results (true/false per force after Play), locked }
  const METER_Y = 410, METER_W = 340, METER_H = 74;
  const PICKS = [['pos', '+W'], ['zero', '0 J'], ['neg', '−W']];
  function dirMeters(o) {
    const s0 = FL.SCENES[o.id], n = s0.track.length;
    let s = '';
    s0.track.forEach((t, i) => {
      const x = (W - n * METER_W - (n - 1) * 8) / 2 + i * (METER_W + 8), y = METER_Y, v = o.values ? o.values[i] : null, pred = (o.preds || [])[i];
      const res = o.results ? o.results[i] : null;
      s += `<rect x="${x}" y="${y}" width="${METER_W}" height="${METER_H}" rx="10" class="wk-meter-card ${res === true ? 'r-ok' : res === false ? 'r-bad' : ''}"/>`
        + text(x + 14, y + 22, `Work meter: work done by ${t.label}`, 'sv-small wk-F-text', 'start');
      PICKS.forEach(([cat, lab], k) => {
        const bx = x + 12 + k * 66, by = y + 30, on = pred === cat, off = o.locked || o.waiting;
        s += `<g class="wk-pick wk-pick-${cat} ${on ? 'on' : ''} ${off ? 'locked' : ''}" ${off ? '' : `data-pred="${i}:${cat}"`}>`
          + `<rect x="${bx}" y="${by}" width="60" height="36" rx="8"/><text x="${bx + 30}" y="${by + 25}" class="sv-text wk-pick-icon" text-anchor="middle">${lab}</text></g>`;
      });
      s += `<rect x="${x + 214}" y="${y + 30}" width="${METER_W - 226}" height="36" rx="6" class="wk-meter-screen"/>`
        + `<text x="${x + METER_W - 22}" y="${y + 56}" class="sv-text wk-meter-small" text-anchor="end">${v === null || v === undefined ? '?' : `${v > 0.5 ? '+' : ''}${fmt(Math.round(v))} J`}</text>`;
    });
    return s;
  }
  // o = { id, p, d, arrows (student's force arrows), cur (force being aimed), full (true diagram), preds, values, results, locked, prompt, clickable }
  function dirScene(o) {
    const s0 = FL.SCENES[o.id];
    let s = `<rect x="0" y="0" width="${W}" height="${F0}" class="sv-floor"/>` + bayBackdrop(W, F0, 0) + ground(0, W, F0);
    s += `<g id="dirPic" transform="translate(${PIC_DX} 0)">${dirPic(o)}</g>` + plate(W / 2, 30, s0.title, 'fl-title');
    s += `<g id="dirMeters">${dirMeters(o)}</g>`;
    s += plate(W / 2, H - 14, s0.caption, 'sv-small');
    return frame(s);
  }

  // ---------- The hoist demo: hold a crate still, then lift it ----------
  // The moving parts (rope, pulley, crate, worker) are drawn by hoistLive() and redrawn every frame by the app.
  // o = { y (meters above the floor), t (seconds), mode ('hold' | 'lift'), W (meter), boxes }
  const HO = { floor: 400, pxm: 80, cx: 348, crateW: 76, crateH: 60, pulley: { x: 330, y: 84, r: 18 } };
  const ROPE_TOP = { x: HO.pulley.x - HO.pulley.r, y: HO.pulley.y };
  const ROPE_DIR = (() => { const dx = 190 - ROPE_TOP.x, dy = 292 - ROPE_TOP.y, L = Math.hypot(dx, dy); return { x: dx / L, y: dy / L }; })();
  const onRope = u => ({ x: ROPE_TOP.x + ROPE_DIR.x * u, y: ROPE_TOP.y + ROPE_DIR.y * u });
  function hoistLive(o) {
    const { floor, pxm, cx, crateW: cw, crateH: ch, pulley: p } = HO;
    const y = o.y || 0, pulled = y * pxm, top = floor - ch - pulled;
    let s = '';
    // The pulley turns as the rope runs over it (counterclockwise: the crate side goes up)
    const turn = -(pulled / p.r) * 180 / Math.PI;
    s += `<g transform="rotate(${turn.toFixed(1)} ${p.x} ${p.y})"><circle cx="${p.x}" cy="${p.y}" r="${p.r}" class="wk-pulley"/>`
      + [0, 60, 120].map(a => `<line x1="${p.x - p.r * 0.8 * Math.cos(a * Math.PI / 180)}" y1="${p.y - p.r * 0.8 * Math.sin(a * Math.PI / 180)}" x2="${p.x + p.r * 0.8 * Math.cos(a * Math.PI / 180)}" y2="${p.y + p.r * 0.8 * Math.sin(a * Math.PI / 180)}" class="wk-spoke"/>`).join('')
      + `</g><circle cx="${p.x}" cy="${p.y}" r="4" class="wk-hand"/>`;
    // Crate side of the rope. The little marks ride along with the rope, so you can see it being pulled.
    const rx = p.x + p.r;
    s += `<line x1="${rx}" y1="${p.y}" x2="${rx}" y2="${top}" class="wk-strap"/><line x1="${rx}" y1="${p.y}" x2="${rx}" y2="${top}" class="wk-rope-marks" stroke-dashoffset="${pulled.toFixed(1)}"/>`;
    // The crate, with a red pointer onto the height ruler
    const left = cx - cw / 2 + p.r;
    s += `<g transform="translate(0 ${(-pulled).toFixed(1)})">${crate(left, floor - ch, cw, ch)}${text(cx + p.r, floor - ch / 2 + 6, '10 kg', 'sv-small wk-crate-label')}`
      + `<line x1="${left}" y1="${floor}" x2="290" y2="${floor}" class="wk-pointer"/><polygon points="290,${floor} 298,${floor - 5} 298,${floor + 5}" class="wk-pointer-head"/></g>`;
    // Worker side: hand over hand. The pulling hand grips and slides down with the rope; the other reaches back up.
    const L = 30, ph = (pulled % (2 * L)) / L, base = 196;
    const shake = o.mode === 'hold' ? Math.sin((o.t || 0) * 38) * 1.4 : 0;   // a held rope: arms strain, nothing moves
    const hand = (u, grip) => { const q = onRope(base + u); return grip ? [q.x + shake, q.y + shake * 0.5] : [q.x - ROPE_DIR.y * 9, q.y + ROPE_DIR.x * 9]; };
    const moving = o.mode === 'lift' && y > 0 && y < 1.5;
    const hA = moving ? hand(ph < 1 ? ph * L : (2 - ph) * L, ph < 1) : hand(0, true);
    const hB = moving ? hand(26 + (ph < 1 ? (1 - ph) * L : (ph - 1) * L) - L / 2, ph >= 1) : hand(22, true);
    const end = onRope(base + 64), tail = { x: 112, y: floor - 2 };
    s += `<line x1="${ROPE_TOP.x}" y1="${ROPE_TOP.y}" x2="${end.x}" y2="${end.y}" class="wk-strap"/><line x1="${ROPE_TOP.x}" y1="${ROPE_TOP.y}" x2="${end.x}" y2="${end.y}" class="wk-rope-marks" stroke-dashoffset="${(-pulled).toFixed(1)}"/>`;
    s += `<path d="M ${end.x} ${end.y} Q ${end.x - 16} ${floor - 30} ${tail.x} ${tail.y} q -12 0 -20 -2" class="wk-rope-tail"/>`;
    s += person(158, floor, [hA, hB], moving ? 'wk-lean' : '');
    return s;
  }
  function hoist(o) {
    const { floor, pxm } = HO;
    let s = bayBackdrop(560, floor, 58) + readouts(o.boxes || []);
    s += ground(0, 560, floor) + `<rect x="122" y="58" width="10" height="${floor - 58}" class="wk-mast"/><rect x="408" y="58" width="10" height="${floor - 58}" class="wk-mast"/>`
      + '<rect x="120" y="58" width="300" height="12" class="wk-beam"/>';
    // A height ruler beside the crate
    s += `<rect x="266" y="${floor - 2 * pxm - 6}" width="22" height="${2 * pxm + 6}" class="wk-tape"/>`;
    for (let i = 0; i <= 20; i++) { const y = floor - i * pxm / 10; s += `<line x1="266" y1="${y}" x2="${266 + (i % 10 === 0 ? 14 : i % 5 === 0 ? 10 : 6)}" y2="${y}" class="wk-tape-tick"/>`; if (i % 10 === 0) s += text(258, y + 5, `${i / 10} m`, 'sv-small', 'end'); }
    s += `<rect x="406" y="${floor - 1.5 * pxm}" width="124" height="10" class="wk-shelf"/><line x1="520" y1="${floor - 1.5 * pxm + 10}" x2="520" y2="${floor}" class="wk-shelf-leg"/>` + text(470, floor - 1.5 * pxm - 10, 'shelf, 1.5 m', 'sv-small fl-dim');
    s += plate(HO.pulley.x + HO.pulley.r + 58, 152, 'F = 100 N ↑', 'sv-small wk-F-text');
    s += `<g id="hoistLive">${hoistLive(o)}</g>`;
    s += workMeter(meterText(o.W || 0));
    return frame(s);
  }

  // ---------- Graphs ----------
  // o = { spec, points: [{ x, y, label, cls, i }], guide: { x, y }, miss: { x, y } in pixels, line: [p, q] or { slope }, note, clickable }
  function graph(o) {
    const { spec } = o, b = spec.box, px = (x, y) => FL.toPx(spec, x, y);
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
    s += `<path d="M ${b.x0} ${b.y1} V ${b.y0} H ${b.x1}" class="fl-axis"/>` + text(b.x1 + 16, b.y0 + 7, 'x', 'fl-axis-tag') + text(b.x0, b.y1 - 12, 'y', 'fl-axis-tag');
    s += text((b.x0 + b.x1) / 2, H - 18, spec.x.label, 'fl-axis-label wk-d-text');
    s += `<text transform="translate(26 ${(b.y0 + b.y1) / 2}) rotate(-90)" class="sv-text fl-axis-label wk-W-text" text-anchor="middle">${esc(spec.y.label)}</text>`;
    if (o.guide) {
      const g = px(o.guide.x, o.guide.y);
      s += `<path d="M ${g.x} ${b.y0} V ${g.y} H ${b.x0}" class="fl-guide"/>`;
    }
    if (typeof o.readX === 'number') {
      const rx = px(o.readX, 0).x.toFixed(1);
      s += `<line x1="${rx}" y1="${b.y0}" x2="${rx}" y2="${b.y1}" class="wk-read-line"/>`
        + plate(Number(rx), b.y0 - 16, `d = ${fmt(o.readX)} m`, 'sv-small wk-d-text');
    }
    if (o.line) {
      // A line drawn across the whole plot: through two picked points, or through the origin with a slope
      const [p, q] = Array.isArray(o.line) ? o.line : [{ x: 0, y: 0 }, { x: 1, y: o.line.slope }];
      const m = (q.y - p.y) / (q.x - p.x), y0 = p.y - m * p.x;
      const xa = Math.max(0, m > 0 && y0 < 0 ? -y0 / m : 0), xb = Math.min(spec.x.max, m > 0 ? (spec.y.max - y0) / m : spec.x.max);
      const A = px(xa, y0 + m * xa), B = px(xb, y0 + m * xb);
      s += `<line x1="${A.x.toFixed(1)}" y1="${A.y.toFixed(1)}" x2="${B.x.toFixed(1)}" y2="${B.y.toFixed(1)}" class="fl-fit"/>`;
      if (o.showTriangle && Array.isArray(o.line)) {
        const [p1, p2] = o.line.slice().sort((a, b2) => a.x - b2.x);
        const P1 = px(p1.x, p1.y), P2 = px(p2.x, p2.y), C = px(p2.x, p1.y);
        s += `<line x1="${P1.x.toFixed(1)}" y1="${P1.y.toFixed(1)}" x2="${C.x.toFixed(1)}" y2="${C.y.toFixed(1)}" class="wk-slope-run"/>`
          + `<line x1="${C.x.toFixed(1)}" y1="${C.y.toFixed(1)}" x2="${P2.x.toFixed(1)}" y2="${P2.y.toFixed(1)}" class="wk-slope-rise"/>`
          + `<path d="M ${C.x - 10} ${C.y} V ${C.y - 10} H ${C.x}" class="wk-90-sq"/>`
          + plate((P1.x + C.x) / 2, C.y + 20, `Δd = ${fmt(FL.round(p2.x - p1.x, 2))} m`, 'sv-small wk-d-text')
          + plate(C.x + 12, (C.y + P2.y) / 2, `ΔW = ${fmt(FL.round(p2.y - p1.y, 1))} J`, 'sv-small wk-W-text', C.x > b.x1 - 125 ? 'end' : 'start');
      }
    }
    (o.points || []).forEach(pt => {
      const c = px(pt.x, pt.y);
      s += `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${pt.cls === 'fl-pt-new' ? 9 : 7}" class="fl-pt ${pt.cls || ''}"${pt.i !== undefined ? ` data-pt="${pt.i}"` : ''}/>`;
    });
    // Labels go on last, with a halo, so a neighboring point never hides the numbers
    (o.points || []).filter(pt => pt.label).forEach(pt => { const c = px(pt.x, pt.y); s += text(c.x + 12, c.y - 12, pt.label, 'sv-small fl-pt-label', c.x > b.x1 - 150 ? 'end' : 'start'); });
    if (o.miss) s += `<path d="M ${o.miss.x - 7} ${o.miss.y - 7} l 14 14 m 0 -14 l -14 14" class="fl-miss"/>`;
    if (o.note) s += plate(b.x0 + 14, b.y1 + 28, o.note, 'sv-small', 'start');
    return frame(s, o.clickable ? 'fl-click fl-cross' : '');
  }

  // ---------- Problem pictures ----------
  const PF = 330;   // floor
  function problem(sc, solved = {}) {
    let s = bayBackdrop(W, PF, 0) + ground(0, W, PF);
    const answer = (txt, cls = 'fl-value wk-W-text') => plate(W / 2, PF + 120, txt, cls);
    // Work backward for the force: the meter shows the work
    if (sc.kind === 'revF') {
      s += plate(W / 2, 34, 'A crate pulled along the floor', 'fl-title');
      s += `<rect x="440" y="${PF - 70}" width="90" height="70" rx="4" class="wk-crate wk-ghost-outline"/>` + crate(150, PF - 70, 90, 70);
      s += arrow(240, PF - 40, 370, PF - 40, 'wk-F', 6) + plate(420, PF - 36, solved.revF ? `F = ${fmt(sc.F)} N` : 'F = ?', 'wk-F-text', 'start');
      s += dim(240, PF + 34, 530, PF + 34, `d = ${fmt(sc.d)} m`);
      s += `<g transform="translate(-10 -260)">${workMeter(`${fmt(sc.W)} J`)}</g>`;
      return frame(s);
    }
    // The 0 J trap: carrying a crate across the room at the same height
    if (sc.kind === 'carry0') {
      s += plate(W / 2, 34, 'Carrying a crate across the room', 'fl-title');
      s += `<g opacity="0.3">${box(118, PF - 112)}${person(148, PF, [[125, PF - 70], [171, PF - 70]])}</g>`;
      s += box(498, PF - 112) + person(528, PF, [[505, PF - 70], [551, PF - 70]]) + plate(528, PF - 126, `m = ${fmt(sc.m)} kg`, '');
      s += arrow(528, PF - 150, 528, PF - 220, 'wk-F', 6) + plate(560, PF - 214, "F_hand: worker's hands", 'sv-small wk-F-text', 'start');
      s += dim(148, PF + 34, 528, PF + 34, `d = ${fmt(sc.d)} m`);
      s += answer(solved.carry0 ? 'W = 0 J' : 'W = ?');
      return frame(s);
    }
    // Work backward for the height: the meter shows the work
    if (sc.kind === 'revH') {
      s += plate(W / 2, 34, 'A hoist lifts a load', 'fl-title');
      s += `<rect x="250" y="62" width="300" height="12" class="wk-beam"/><circle cx="400" cy="88" r="16" class="wk-pulley"/>`;
      s += `<rect x="374" y="${PF - 64}" width="80" height="64" rx="4" class="wk-crate wk-ghost-outline"/>`;
      s += `<line x1="414" y1="88" x2="414" y2="${PF - 230}" class="wk-strap"/>` + crate(374, PF - 230, 80, 64) + plate(414, PF - 192, `m = ${fmt(sc.m)} kg`, '');
      s += dim(340, PF, 340, PF - 166, solved.revH ? `h = ${fmt(sc.h)} m` : 'h = ?');
      s += plate(150, 120, 'g = 10 m/s²', 'sv-small');
      s += `<g transform="translate(-10 -250)">${workMeter(`${fmt(sc.W)} J`)}</g>`;
      return frame(s);
    }
    // Lift, walk, lift: the crate's path, with the two heights and the walk
    if (sc.kind === 'multi') {
      s += plate(W / 2, 34, 'Lift, walk across, lift again', 'fl-title');
      const y1 = PF - 110, y2 = PF - 190;
      s += `<rect x="150" y="${y1}" width="300" height="10" class="wk-shelf"/><line x1="160" y1="${y1 + 10}" x2="160" y2="${PF}" class="wk-shelf-leg"/><line x1="440" y1="${y1 + 10}" x2="440" y2="${PF}" class="wk-shelf-leg"/>`;
      s += `<rect x="450" y="${y2}" width="190" height="10" class="wk-shelf"/><line x1="630" y1="${y2 + 10}" x2="630" y2="${PF}" class="wk-shelf-leg"/>`;
      s += `<rect x="104" y="${PF - 44}" width="60" height="44" rx="3" class="wk-crate wk-ghost-outline"/>` + crate(560, y2 - 44, 60, 44) + plate(590, y2 - 58, `m = ${fmt(sc.m)} kg`, '');
      s += `<path d="M 134 ${PF - 50} V ${y1 - 24} H 470 V ${y2 - 24} H 556" class="wk-path"/>`;
      s += dim(60, PF, 60, y1, `h_1 = ${fmt(sc.h1)} m`) + dim(180, y1 - 50, 440, y1 - 50, `walk ${fmt(sc.walk)} m`) + dim(670, y1, 670, y2, `h_2 = ${fmt(sc.h2)} m`);
      s += plate(150, 80, 'g = 10 m/s²', 'sv-small');
      // Each box's answer appears on the picture beside its part of the trip
      s += plate(210, PF - 40, solved.up1 ? `W_1 = ${fmt(sc.W1)} J` : 'W_1 = ?', 'wk-W-text', 'start');
      s += plate(310, y1 - 82, 'walk: 0 J', 'sv-small wk-W-text');
      s += plate(680, y2 - 70, solved.up2 ? `W_2 = ${fmt(sc.W2)} J` : 'W_2 = ?', 'wk-W-text');
      s += answer(solved.total ? `W_total = ${fmt(sc.W)} J` : 'W_total = ?');
      return frame(s);
    }
    if (sc.kind === 'pull' || sc.kind === 'angle') {
      const th = sc.kind === 'angle' ? sc.th : 0, t = th * Math.PI / 180;
      s += plate(W / 2, 34, sc.kind === 'angle' ? 'A crate pulled by a rope at an angle' : 'A crate pulled along the floor', 'fl-title');
      s += `<rect x="440" y="${PF - 70}" width="90" height="70" rx="4" class="wk-crate wk-ghost-outline"/>` + crate(150, PF - 70, 90, 70);
      const ax = 240, ay = PF - 52;
      s += arrow(ax, ay, ax + 130 * Math.cos(t), ay - 130 * Math.sin(t), 'wk-F', 6);
      s += plate(ax + 65 * Math.cos(t), ay - 65 * Math.sin(t) - 24, `F = ${fmt(sc.F)} N`, 'wk-F-text');
      if (th) s += `<line x1="${ax}" y1="${ay}" x2="${ax + 80}" y2="${ay}" class="wk-ref"/><path d="M ${ax + 52} ${ay} A 52 52 0 0 0 ${ax + 52 * Math.cos(t)} ${ay - 52 * Math.sin(t)}" class="wk-arc"/>` + text(ax + 62, ay - 12, `θ = ${th}°`, 'sv-small wk-angle', 'start');
      s += dim(240, PF + 34, 530, PF + 34, `d = ${fmt(sc.d)} m`);
      s += plate(W / 2, PF + 120, solved[sc.kind] ? `W = ${fmt(FL.round(sc.W, 1))} J` : 'W = ?', 'fl-value wk-W-text');
      return frame(s);
    }
    if (sc.kind === 'lift' || sc.kind === 'liftC') {
      const hpx = Math.min(200, 40 + sc.h * 46), top = PF - hpx;
      s += plate(W / 2, 34, 'A hoist lifts a crate onto a shelf', 'fl-title');
      s += `<rect x="250" y="62" width="300" height="12" class="wk-beam"/><circle cx="400" cy="88" r="16" class="wk-pulley"/>`;
      s += `<rect x="440" y="${top}" width="180" height="10" class="wk-shelf"/><line x1="610" y1="${top + 10}" x2="610" y2="${PF}" class="wk-shelf-leg"/>`;
      s += `<rect x="374" y="${PF - 64}" width="80" height="64" rx="4" class="wk-crate wk-ghost-outline"/>`;
      s += `<line x1="414" y1="88" x2="414" y2="${top - 64}" class="wk-strap"/>` + crate(374, top - 64, 80, 64) + plate(414, top - 26, `m = ${fmt(sc.m)} kg`, '');
      s += dim(340, PF, 340, PF - hpx, `h = ${fmt(sc.h)} m`);
      s += plate(150, 120, 'g = 10 m/s²', 'sv-small');
      if (sc.kind === 'liftC') s += plate(150, 160, solved.weight ? `F_g = ${fmt(sc.Fg)} N` : 'F_g = ?', 'wk-F-text');
      s += plate(W / 2, PF + 120, solved.lift || solved.liftW ? `W = ${fmt(sc.W)} J` : 'W = ?', 'fl-value wk-W-text');
      return frame(s);
    }
    if (sc.kind === 'net' || sc.kind === 'fric') {
      s += plate(W / 2, 34, 'A crate pushed across a rough floor', 'fl-title');
      s += `<rect x="460" y="${PF - 70}" width="90" height="70" rx="4" class="wk-crate wk-ghost-outline"/>` + crate(200, PF - 70, 90, 70);
      s += person(150, PF, [[200, PF - 40], [200, PF - 32]]);
      s += arrow(206, PF - 96, 330, PF - 96, 'wk-F', 6) + plate(380, PF - 92, `F_push = ${fmt(sc.push)} N`, 'wk-F-text', 'start');
      s += `<path d="${Array.from({ length: 40 }, (_, i) => `M ${120 + i * 14} ${PF + 2} l -8 12`).join(' ')}" class="wk-rough"/>`;
      s += arrow(260, PF - 8, 160, PF - 8, 'wk-other', 5) + plate(110, PF - 20, sc.kind === 'fric' ? (solved.ff ? `F_f = ${fmt(sc.f)} N` : 'F_f = ?') : `F_f = ${fmt(sc.f)} N`, 'wk-other-text', 'end');
      s += dim(290, PF + 40, 550, PF + 40, `d = ${fmt(sc.d)} m`);
      if (sc.kind === 'net') {
        if (!sc.one) s += plate(630, 120, solved.fnet ? `F_net = ${fmt(sc.Fnet)} N` : 'F_net = ?', '');
        s += plate(W / 2, PF + 124, solved.wnet || solved.wnet1 ? `W_net = ${fmt(sc.W)} J` : 'W_net = ?', 'fl-value wk-W-text');
      } else {
        s += `<g transform="translate(-10 -250)">${workMeter(`${fmt(sc.Wnet)} J`, 'Net work meter')}</g>`;
        s += plate(W / 2, PF + 124, solved.wf ? `W_f = ${fmt(sc.Wf)} J` : 'W_f = ?', 'fl-value wk-W-text');
      }
      return frame(s);
    }
    // brake
    s += plate(W / 2, 34, 'A cart rolls forward while its brakes push back', 'fl-title');
    s += `<g opacity="0.25">${cart(470, PF)}</g>` + cart(200, PF);
    s += arrow(300, PF - 110, 410, PF - 110, 'wk-d', 5) + plate(470, PF - 106, 'moving', 'wk-d-text', 'start');
    s += arrow(218, PF - 30, 120, PF - 30, 'wk-F', 6) + plate(60, PF - 60, `F_f = ${fmt(sc.f)} N`, 'wk-F-text', 'start');
    s += dim(290, PF + 40, 560, PF + 40, `d = ${fmt(sc.d)} m`);
    s += plate(W / 2, PF + 124, solved.brake ? `W_f = ${fmt(sc.W)} J` : 'W_f = ?', 'fl-value wk-W-text');
    return frame(s);
  }

  Object.assign(window.Scene, { fracOf, dirScene, dirPic, dirMeters, snapDir, motionArrow, fbdArrow, FBD, PANEL_W, TRACK_CLS, PIC, hoist, hoistLive, HO, graph, problem, person, crate });
})();

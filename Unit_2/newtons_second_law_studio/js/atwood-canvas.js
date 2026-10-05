// Newton's 2nd Law Studio — Canvas 2D renderer
// Horizontal track, rolling cart, two flanged pulleys, taut strings, hanging token stacks,
// dual photogates and the live Free-Body Diagram overlay.

const TOKEN_STYLE = {
  10:  { name: 'Bronze 10 g',  fill: '#b87333', edge: '#7c4a1e', w: 26, h: 4 },
  20:  { name: 'Silver 20 g',  fill: '#c0c9d4', edge: '#64748b', w: 28, h: 6 },
  50:  { name: 'Brass 50 g',   fill: '#d4a017', edge: '#8a6508', w: 32, h: 9 },
  100: { name: 'Steel 100 g',  fill: '#7b8794', edge: '#3f4a56', w: 36, h: 13 },
  200: { name: 'Lead 200 g',   fill: '#4b5563', edge: '#1f2937', w: 40, h: 18 },
  500: { name: 'Iron 500 g',   fill: '#334155', edge: '#0f172a', w: 44, h: 26 }
};

class AtwoodCanvas {
  constructor(canvas, physics) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.physics = physics;
    this.showVectors = true;
    this.hideValues = false;   // hide numbers while a question asks students to calculate them
    this.hideCartMass = false; // ⭐ mystery-cargo task: cart mass and cargo are hidden
    this.cargoTop = 0;
    this.travelPct = 35;
    this.palette = null;
    this.W = 800; this.H = 440;
    this.resize();
  }

  refreshPalette() {
    const cs = getComputedStyle(document.documentElement);
    const v = name => cs.getPropertyValue(name).trim();
    this.palette = {
      bg: v('--canvas-bg'), grid: v('--canvas-grid'), text: v('--canvas-text'),
      track: v('--canvas-track'), table: v('--canvas-table'), cart: v('--canvas-cart'),
      string: v('--canvas-string'), dim: v('--text-dim'),
      cyan: v('--accent-cyan'), amber: v('--accent-amber'), emerald: v('--accent-emerald'),
      rose: v('--accent-rose'), violet: v('--accent-violet'),
      mono: '"JetBrains Mono", ui-monospace, monospace', sans: 'Outfit, system-ui, sans-serif'
    };
  }

  resize() {
    const parent = this.canvas.parentElement;
    const W = Math.max(300, parent.clientWidth);
    const H = Math.round(Math.max(235, Math.min(W * 0.34, 420)));
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this.canvas.style.height = H + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = W; this.H = H;
    this.k = Math.max(0.55, Math.min(1.3, W / 1000));
    this.margin = Math.max(44, W * 0.075);
    this.s = (W - 2 * this.margin) / NSL.TRACK_LENGTH;
    this.trackY = Math.round(Math.max(H * 0.30, 112 * this.k));  // room above the cart for the force arrows
  }

  sx(x) { return this.margin + x * this.s; }

  draw() {
    if (!this.palette) this.refreshPalette();
    const { ctx, W, H, k, palette: P } = this;
    const p = this.physics;
    const f = p.computePhysics();

    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, W, H);

    // Floor
    const floorY = H - 14 * k;
    ctx.strokeStyle = P.grid;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(W, floorY); ctx.stroke();

    // Geometry
    const wheelR = 7 * k, bodyH = 26 * k;
    const bodyBottom = this.trackY - 2 * wheelR;
    const eyeY = bodyBottom - bodyH / 2;
    const pulleyR = 16 * k;
    const pulleyY = eyeY + pulleyR;
    const xL = this.sx(0), xR = this.sx(NSL.TRACK_LENGTH);

    this._drawTable(floorY);
    this._drawScale();
    this._drawBumpers(bodyBottom);

    // Hanger positions: right hanger descends as the cart moves right, left hanger rises
    // Vertical travel is compressed so the full 1.70 m of hanger motion fits between the table and floor.
    const dMin = this.trackY + 30 * k - pulleyY;           // highest hanger hook sits just below the table top
    const stackAllowance = 88 * k;
    const travel = Math.max(10, (floorY - 6 * k - stackAllowance - (pulleyY + dMin)) / (NSL.X_MAX - NSL.X_MIN));
    this.travelPct = Math.round(100 * travel / this.s);
    const dropR = dMin + (p.x - NSL.X_MIN) * travel;
    const dropL = dMin + (NSL.X_MAX - p.x) * travel;

    const cx = this.sx(p.x);
    const halfW = (NSL.CART_WIDTH / 2) * this.s;

    // Strings (drawn before cart and pulleys so they tuck behind)
    ctx.strokeStyle = P.string;
    ctx.lineWidth = Math.max(1.5, 2 * k);
    ctx.beginPath();
    if (p.mL > 0) {
      ctx.moveTo(cx - halfW, eyeY); ctx.lineTo(xL, eyeY);
      ctx.arc(xL, pulleyY, pulleyR, -Math.PI / 2, Math.PI, true);
      ctx.lineTo(xL - pulleyR, pulleyY + dropL);
    }
    if (p.mR > 0) {
      ctx.moveTo(cx + halfW, eyeY); ctx.lineTo(xR, eyeY);
      ctx.arc(xR, pulleyY, pulleyR, -Math.PI / 2, 0, false);
      ctx.lineTo(xR + pulleyR, pulleyY + dropR);
    }
    ctx.stroke();

    const spin = p.x / 0.016;
    // The string runs over the top of each pulley, so both turn the same way.
    // A pulley with no string over it (no hanging mass on that side) does not turn.
    this._drawPulley(xL, pulleyY, pulleyR, p.mL > 0 ? spin : 0);
    this._drawPulley(xR, pulleyY, pulleyR, p.mR > 0 ? spin : 0);

    this._drawHanger(xL - pulleyR, pulleyY + dropL, p.mL, 'm_L');
    this._drawHanger(xR + pulleyR, pulleyY + dropR, p.mR, 'm_R');

    this._drawGates(bodyBottom - bodyH - 22 * k, bodyBottom - 4 * k, this.trackY + 62 * k);
    this._drawClock(this.trackY + 80 * k + 14);  // just below the photogate readouts
    this._drawCart(cx, halfW, bodyBottom, bodyH, wheelR, p.x / (wheelR / this.s));

    if (p.phase === 'held') this._drawHold(cx, halfW, bodyBottom, bodyH, f.tensionL - f.tensionR < -1e-9 ? 1 : -1);
    if (this.showVectors) this._drawFBD(cx, bodyBottom - bodyH - Math.max(26 * k, this.cargoTop + 12 * k), f);

    // Honest scale note for the compressed vertical travel
    ctx.fillStyle = P.dim;
    ctx.font = `${Math.round(10 * k + 2)}px ${P.sans}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Hanger drop drawn at ${this.travelPct}% scale so the full 2 m track fits on screen`, W / 2, H - 1);
  }

  _drawTable(floorY) {
    const { ctx, k, palette: P } = this;
    const x0 = this.sx(0), x1 = this.sx(NSL.TRACK_LENGTH);
    const railH = 6 * k, slabH = 16 * k;
    // Legs
    ctx.fillStyle = P.table;
    const legW = 10 * k;
    [this.sx(0.12), this.sx(NSL.TRACK_LENGTH - 0.12)].forEach(lx => {
      ctx.fillRect(lx - legW / 2, this.trackY + railH + slabH, legW, floorY - (this.trackY + railH + slabH));
    });
    // Table slab
    ctx.fillRect(x0, this.trackY + railH, x1 - x0, slabH);
    // Aluminum rail with highlight
    const grad = ctx.createLinearGradient(0, this.trackY, 0, this.trackY + railH);
    grad.addColorStop(0, P.track);
    grad.addColorStop(1, P.grid);
    ctx.fillStyle = grad;
    ctx.fillRect(x0, this.trackY, x1 - x0, railH);
  }

  _drawScale() {
    const { ctx, k, palette: P } = this;
    const y = this.trackY + 6 * k + 16 * k + 4;
    ctx.strokeStyle = P.text;
    ctx.fillStyle = P.text;
    ctx.lineWidth = 1;
    ctx.font = `${Math.round(10 * k + 3)}px ${P.mono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= 20; i++) {
      const x = this.sx(i * 0.1);
      const major = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + (major ? 9 : 5) * k);
      ctx.stroke();
      if (major && i > 0 && i < 20) ctx.fillText((i / 10).toFixed(1) + ' m', x, y + 11 * k);
    }
  }

  _drawBumpers(bodyBottom) {
    const { ctx, k, palette: P } = this;
    ctx.fillStyle = P.rose;
    const bw = 5 * k, bh = 16 * k;
    const left = this.sx(NSL.X_MIN - NSL.CART_WIDTH / 2) - bw;
    const right = this.sx(NSL.X_MAX + NSL.CART_WIDTH / 2);
    ctx.fillRect(left, bodyBottom - bh + 10 * k, bw, bh);
    ctx.fillRect(right, bodyBottom - bh + 10 * k, bw, bh);
  }

  _drawPulley(x, y, r, angle) {
    const { ctx, k, palette: P } = this;
    // Clamp bracket to table edge
    ctx.fillStyle = P.table;
    ctx.fillRect(x - 3 * k, y, 6 * k, this.trackY + 22 * k - y);
    // Flange + groove
    ctx.beginPath(); ctx.arc(x, y, r + 2 * k, 0, Math.PI * 2);
    ctx.fillStyle = P.track; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = P.text; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
    ctx.fillStyle = P.bg; ctx.fill(); ctx.stroke();
    // Spokes rotate with the string
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle);
    ctx.strokeStyle = P.text; ctx.lineWidth = 2 * k;
    for (let i = 0; i < 3; i++) {
      ctx.rotate(Math.PI * 2 / 3);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.75, 0); ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, 3 * k, 0, Math.PI * 2);
    ctx.fillStyle = P.text; ctx.fill();
  }

  _drawHanger(x, topY, grams, label) {
    const { ctx, k, palette: P } = this;
    if (grams <= 0) return;
    const hookH = 10 * k;
    // Hook + rod
    ctx.strokeStyle = P.text; ctx.lineWidth = 2 * k;
    ctx.beginPath(); ctx.arc(x, topY + 4 * k, 4 * k, -Math.PI / 2, Math.PI * 1.2); ctx.stroke();
    const tokens = NSL.decompose(grams);
    let y = topY + hookH;
    let stackH = 0;
    tokens.forEach(g => { stackH += ((TOKEN_STYLE[g] || TOKEN_STYLE[10]).h + 1) * k; });
    ctx.beginPath(); ctx.moveTo(x, topY + 8 * k); ctx.lineTo(x, y + stackH + 2 * k); ctx.stroke();
    // Smallest tokens on top, heaviest on the base plate
    tokens.slice().reverse().forEach(g => {
      const st = TOKEN_STYLE[g] || TOKEN_STYLE[10];
      const w = st.w * k, h = st.h * k;
      this._roundRect(x - w / 2, y, w, h, Math.min(3 * k, h / 2));
      ctx.fillStyle = st.fill; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = st.edge; ctx.stroke();
      y += h + 1 * k;
    });
    // Base plate
    ctx.fillStyle = P.text;
    ctx.fillRect(x - 15 * k, y, 30 * k, 3 * k);
    // Label below the base plate, extending inward (clamped inside the canvas)
    ctx.font = `700 ${Math.round(11 * k + 3)}px ${P.mono}`;
    ctx.fillStyle = P.text;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    const text = `${label} = ${grams} g`;
    const tw = SubText.measure(ctx, text);
    let lx = label === 'm_L' ? x - 15 * k : x + 15 * k - tw;
    lx = Math.max(3, Math.min(this.W - 3 - tw, lx));
    const fh = Math.round(11 * k + 3);
    this._roundRect(lx - 3, y + 4 * k, tw + 6, fh + 8, 3);
    ctx.fillStyle = P.bg; ctx.fill();
    ctx.strokeStyle = P.grid; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = P.text;
    SubText.fill(ctx, text, lx, y + 6 * k);
  }

  // Stopwatch under the table: runs from the moment the cart is released, so students can see
  // the simulation is live even when the cart is not moving.
  _hides(sym) {
    const h = this.hideValues;
    return h === true || (Array.isArray(h) && h.includes(sym));
  }

  _drawClock(topY) {
    const { ctx, k, W, palette: P } = this;
    const p = this.physics;
    const running = p.phase === 'running' && !p.timeUp;
    const state = p.phase === 'held' ? 'READY' : running ? 'RUNNING' : p.timeUp ? 'PAUSED' : 'STOPPED';
    const color = running ? P.rose : p.phase === 'held' ? P.dim : P.amber;
    const big = Math.round(22 * k + 6), small = Math.round(9 * k + 4);
    const text = `⏱ ${p.t.toFixed(2)} s`;
    ctx.font = `800 ${big}px ${P.mono}`;
    const tw = ctx.measureText(text).width;
    const bw = tw + 34 * k, bh = big + small + 18 * k;
    const x = W / 2 - bw / 2;
    this._roundRect(x, topY, bw, bh, 8 * k);
    ctx.fillStyle = P.bg; ctx.fill();
    ctx.lineWidth = running ? 3 : 2; ctx.strokeStyle = color; ctx.stroke();
    ctx.fillStyle = P.text;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(text, W / 2, topY + 6 * k);
    // Status word with a blinking dot while running
    ctx.font = `800 ${small}px ${P.sans}`;
    ctx.fillStyle = color;
    const label = `CLOCK ${state}`;
    const lw = ctx.measureText(label).width;
    const ly = topY + big + 10 * k;
    ctx.fillText(label, W / 2 + 6 * k, ly);
    if (running && Math.floor(performance.now() / 400) % 2 === 0) {
      ctx.beginPath();
      ctx.arc(W / 2 - lw / 2 - 4 * k, ly + small / 2, 4 * k, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawGates(topY, bottomY, readoutY) {
    const { ctx, k, palette: P } = this;
    const p = this.physics;
    ['A', 'B'].forEach(key => {
      const gate = p.gates[key];
      const x = this.sx(gate.pos);
      const postW = 5 * k, gap = 22 * k;
      ctx.fillStyle = P.cart;
      ctx.strokeStyle = P.text;
      ctx.lineWidth = 1;
      // Inverted-U frame
      ctx.fillRect(x - gap / 2 - postW, topY, postW, bottomY - topY);
      ctx.fillRect(x + gap / 2, topY, postW, bottomY - topY);
      ctx.fillRect(x - gap / 2 - postW, topY - 5 * k, gap + 2 * postW, 5 * k);
      // Beam
      const beamY = topY + 6 * k;
      ctx.strokeStyle = gate.blocked ? P.rose : P.emerald;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x - gap / 2, beamY); ctx.lineTo(x + gap / 2, beamY); ctx.stroke();
      ctx.setLineDash([]);
      // Status LED on the frame
      ctx.beginPath(); ctx.arc(x, topY - 9 * k, 4 * k, 0, Math.PI * 2);
      ctx.fillStyle = gate.blocked ? P.rose : P.emerald; ctx.fill();
      // Digital timer readout below the track (keeps the space above the cart clear for force vectors)
      const timer = gate.blockTime !== null ? (gate.blockTime * 1000).toFixed(1) + ' ms'
        : gate.blocked ? 'timing…' : '--.- ms';
      ctx.font = `700 ${Math.round(10 * k + 3)}px ${P.mono}`;
      const text = `Gate ${key}  ${timer}`;
      const tw = ctx.measureText(text).width + 14 * k;
      const th = 18 * k + 4;
      this._roundRect(x - tw / 2, readoutY, tw, th, 4 * k);
      ctx.fillStyle = P.bg; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = gate.blocked ? P.rose : P.emerald; ctx.stroke();
      ctx.fillStyle = P.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, readoutY + th / 2);
    });
  }

  _drawCart(cx, halfW, bodyBottom, bodyH, wheelR, wheelAngle) {
    const { ctx, k, palette: P } = this;
    const p = this.physics;
    const left = cx - halfW;
    const top = bodyBottom - bodyH;
    // Chassis
    this._roundRect(left, top, halfW * 2, bodyH, 5 * k);
    ctx.fillStyle = P.cart; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.cyan; ctx.stroke();
    // Cargo stacks sit on the bed, one stack on each side of the flag
    const flagW = NSL.FLAG_WIDTH * this.s;
    const slots = [
      { x0: left + 3 * k, x1: cx - flagW / 2 - 2 * k, h: 0 },
      { x0: cx + flagW / 2 + 2 * k, x1: cx + halfW - 3 * k, h: 0 }
    ];
    const CARGO_H = { 10: 3, 20: 4, 50: 5, 100: 6, 200: 8, 500: 10 };
    (this.hideCartMass ? [] : NSL.decompose(p.cargo)).forEach(g => {
      const st = TOKEN_STYLE[g] || TOKEN_STYLE[10];
      const slot = slots[0].h <= slots[1].h ? slots[0] : slots[1];
      const sw = slot.x1 - slot.x0;
      const w = sw * (0.55 + 0.45 * (st.w - 26) / 18);
      const h = (CARGO_H[g] || 3) * k;
      const bx = slot.x0 + (sw - w) / 2;
      const by = top - slot.h - h;
      ctx.fillStyle = st.fill; ctx.strokeStyle = st.edge; ctx.lineWidth = 1;
      ctx.fillRect(bx, by, w, h);
      ctx.strokeRect(bx, by, w, h);
      slot.h += h + 1;
    });
    this.cargoTop = Math.max(slots[0].h, slots[1].h);
    // Flag (photogate interrupter), drawn last so it stays visible
    ctx.fillStyle = P.violet;
    ctx.fillRect(cx - flagW / 2, top - 18 * k, flagW, 18 * k);
    // Mass label on the chassis
    ctx.fillStyle = P.text;
    ctx.font = `700 ${Math.round(10 * k + 3)}px ${P.mono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.hideCartMass ? '? g' : `${p.mCart} g`, cx, top + bodyH / 2);
    if (this.hideCartMass && p.cargo > 0) {
      // A covered crate: students can't count the cargo tokens
      const cw = halfW * 1.3, ch = 16 * k;
      ctx.fillStyle = P.violet;
      ctx.fillRect(cx - cw / 2, top - ch - 1, cw, ch);
      ctx.fillStyle = P.bg;
      ctx.font = `800 ${Math.round(10 * k + 4)}px ${P.mono}`;
      ctx.fillText('?', cx, top - ch / 2 - 1);
    }
    // Eyelets
    ctx.fillStyle = P.text;
    [left, cx + halfW].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex, bodyBottom - bodyH / 2, 3 * k, 0, Math.PI * 2); ctx.fill();
    });
    // Spoked wheels
    [left + halfW * 0.45, cx + halfW * 0.55].forEach(wx => {
      const wy = bodyBottom + wheelR;
      ctx.beginPath(); ctx.arc(wx, wy, wheelR, 0, Math.PI * 2);
      ctx.fillStyle = P.track; ctx.fill();
      ctx.strokeStyle = P.text; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.save(); ctx.translate(wx, wy); ctx.rotate(wheelAngle);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(wheelR, 0); ctx.stroke();
      }
      ctx.restore();
    });
  }

  // side = −1 holds from the left, +1 from the right (the side a hand would push from)
  _drawHold(cx, halfW, bodyBottom, bodyH, side) {
    const { ctx, k, palette: P } = this;
    const w = 14 * k;
    const x = side < 0 ? cx - halfW - w - 2 * k : cx + halfW + 2 * k;
    ctx.fillStyle = P.rose;
    ctx.fillRect(x, bodyBottom - bodyH, w, bodyH + 10 * k);
    ctx.font = `800 ${Math.round(9 * k + 3)}px ${P.sans}`;
    ctx.textAlign = side < 0 ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('HELD', side < 0 ? x - 4 * k : x + w + 4 * k, bodyBottom - bodyH / 2);
  }

  _drawFBD(cx, baseY, f) {
    const { k, palette: P } = this;
    const pxPerN = 70 * k;
    const maxLen = 0.42 * (this.W - 2 * this.margin);
    const len = F => Math.min(maxLen, Math.max(Math.abs(F) > 1e-9 ? 8 * k : 0, Math.abs(F) * pxPerN));
    const balanced = Math.abs(f.tensionL - f.tensionR) < 1e-9;
    const colL = balanced ? P.emerald : P.cyan;
    const colR = balanced ? P.emerald : P.amber;
    const rowT = baseY;
    const rowF = baseY - 30 * k;

    if (this.physics.mL > 0) this._arrow(cx, rowT, cx - len(f.tensionL), rowT, colL, 3 * k, this._hides('T_L') ? 'T_L = ?' : `T_L = ${f.tensionL.toFixed(2)} N`, 'left');
    if (this.physics.mR > 0) this._arrow(cx, rowT, cx + len(f.tensionR), rowT, colR, 3 * k, this._hides('T_R') ? 'T_R = ?' : `T_R = ${f.tensionR.toFixed(2)} N`, 'right');

    if (this._hides('sum')) return;
    const ctx = this.ctx;
    ctx.font = `800 ${Math.round(11 * k + 3)}px ${P.mono}`;
    ctx.textBaseline = 'bottom';
    const held = this.physics.phase !== 'running';
    // Net force on the CART alone (T_R − T_L). While held, the hand (or bumper) balances it to zero.
    // This is smaller than the system's F_net = Δm·g, because part of that pull accelerates the hangers.
    const Fshown = held ? 0 : f.tensionR - f.tensionL;
    if (Math.abs(Fshown) < 1e-9) {
      ctx.fillStyle = P.emerald;
      ctx.textAlign = 'center';
      const why = held && Math.abs(f.F_net) > 1e-9
        ? (this.physics.phase === 'held' ? 'Net force on cart = 0 N (hand holds it)' : 'Net force on cart = 0 N (bumper holds it)')
        : 'Net force on cart = 0 N  ✓ balanced';
      const tw = SubText.measure(ctx, why);
      SubText.fill(ctx, why, Math.max(4 + tw / 2, Math.min(this.W - 4 - tw / 2, cx)), rowF + 6 * k);
    } else {
      const dir = Math.sign(Fshown);
      this._arrow(cx, rowF, cx + dir * len(Fshown), rowF, P.rose, 5 * k, `Net force on cart = ${Math.abs(Fshown).toFixed(2)} N`, dir > 0 ? 'right' : 'left');
    }
  }

  _arrow(x0, y0, x1, y1, color, width, label, side) {
    const { ctx, k, palette: P } = this;
    const head = Math.max(7, 9 * k);
    const dir = Math.sign(x1 - x0) || 1;
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - dir * head * 0.8, y1); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - dir * head * 1.4, y1 - head * 0.75);
    ctx.lineTo(x1 - dir * head * 1.4, y1 + head * 0.75);
    ctx.closePath(); ctx.fill();
    ctx.lineCap = 'butt';
    if (label) {
      ctx.font = `700 ${Math.round(10 * k + 3)}px ${P.mono}`;
      ctx.textBaseline = 'bottom';
      const tw = SubText.measure(ctx, label);
      let lx = side === 'left' ? x1 - 4 - tw : x1 + 4;
      lx = Math.max(4, Math.min(this.W - 4 - tw, lx));
      ctx.textAlign = 'left';
      SubText.fill(ctx, label, lx, y1 - 4 * k);
    }
  }

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

window.AtwoodCanvas = AtwoodCanvas;
window.TOKEN_STYLE = TOKEN_STYLE;

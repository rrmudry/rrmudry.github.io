// Newton's 2nd Law Studio — Force diagrams
// Left: "Forces on the cart" picture (each force drawn where it acts, labeled with what exerts it).
// Right: technically correct free-body diagram (cart = dot, every force drawn from the dot, to scale).

class ForceDiagrams {
  constructor(pictureCanvas, freeCanvas, physics) {
    this.pc = pictureCanvas;
    this.fc = freeCanvas;
    this.physics = physics;
    this.hideValues = false;
    this.hideCartMass = false;
    this.legendEl = document.getElementById('fbdLegend');
    this.palette = null;
    this.resize();
  }

  refreshPalette() {
    const cs = getComputedStyle(document.documentElement);
    const v = n => cs.getPropertyValue(n).trim();
    this.palette = {
      bg: v('--canvas-bg'), grid: v('--canvas-grid'), text: v('--canvas-text'), dim: v('--text-dim'),
      track: v('--canvas-track'), cart: v('--canvas-cart'), string: v('--canvas-string'),
      cyan: v('--accent-cyan'), amber: v('--accent-amber'), emerald: v('--accent-emerald'),
      rose: v('--accent-rose'), violet: v('--accent-violet'),
      mono: '"JetBrains Mono", ui-monospace, monospace', sans: 'Outfit, system-ui, sans-serif'
    };
  }

  _fit(canvas) {
    const W = Math.max(220, canvas.parentElement.clientWidth);
    const H = Math.round(Math.max(160, Math.min(W * 0.5, 240)));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W, H };
  }

  resize() {
    this.p = this._fit(this.pc);
    this.f = this._fit(this.fc);
  }

  // Every force acting ON the cart, in newtons. dx/dy give direction (+x right, +y down on screen).
  forces() {
    const p = this.physics;
    const P = this.palette;
    const f = p.computePhysics();
    const weight = p.mCart / 1000 * NSL.G;
    const list = [];
    if (p.mL > 0) list.push({ sym: 'T_L', mag: f.tensionL, dx: -1, dy: 0, color: P.cyan, by: 'left string' });
    if (p.mR > 0) list.push({ sym: 'T_R', mag: f.tensionR, dx: 1, dy: 0, color: P.amber, by: 'right string' });
    list.push({ sym: 'F_N', mag: weight, dx: 0, dy: -1, color: P.emerald, by: 'track' });
    list.push({ sym: 'F_g', mag: weight, dx: 0, dy: 1, color: P.rose, by: 'Earth' });
    // While held (or parked on a bumper) something else balances the strings
    if (p.phase !== 'running') {
      const push = f.tensionL - f.tensionR; // + = pushes the cart to the right
      if (Math.abs(push) > 1e-9) {
        const held = p.phase === 'held';
        list.push({ sym: held ? 'F_hand' : 'F_bumper', mag: Math.abs(push), dx: Math.sign(push), dy: 0, color: P.violet, by: held ? 'hand' : 'bumper', contact: true });
      }
    }
    return list;
  }

  _label(f) {
    const h = this.hideValues;
    const hidden = h === true || (Array.isArray(h) && h.includes(f.sym));
    return hidden ? `${f.sym} = ?` : `${f.sym} = ${f.mag.toFixed(2)} N`;
  }

  draw() {
    if (!this.palette) this.refreshPalette();
    const list = this.forces();
    const maxMag = Math.max(...list.map(f => f.mag), 0.01);
    this._drawPicture(list, maxMag);
    this._drawFree(list, maxMag);
  }

  _arrow(ctx, x0, y0, x1, y1, color, width) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 1) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
    const head = Math.min(11, Math.max(7, len * 0.35));
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - ux * head * 0.8, y1 - uy * head * 0.8); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - ux * head - uy * head * 0.55, y1 - uy * head + ux * head * 0.55);
    ctx.lineTo(x1 - ux * head + uy * head * 0.55, y1 - uy * head - ux * head * 0.55);
    ctx.closePath(); ctx.fill();
    ctx.lineCap = 'butt';
  }

  _text(ctx, text, x, y, color, size, weight, align, baseline) {
    const P = this.palette;
    ctx.font = `${weight || 700} ${size}px ${P.mono}`;
    ctx.fillStyle = color;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = baseline || 'middle';
    const w = SubText.measure(ctx, text);
    const W = ctx.canvas.width / (window.devicePixelRatio || 1);
    let ax = x;
    if (ctx.textAlign === 'center') ax = Math.max(3 + w / 2, Math.min(W - 3 - w / 2, x));
    else if (ctx.textAlign === 'left') ax = Math.min(W - 3 - w, Math.max(3, x));
    else ax = Math.max(3 + w, Math.min(W - 3, x));
    SubText.fill(ctx, text, ax, y);
  }

  _drawPicture(list, maxMag) {
    const { ctx, W, H } = this.p;
    const P = this.palette;
    const fs = Math.round(Math.max(11, Math.min(14, W / 26)));
    ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const trackY = H * 0.58;
    const bw = W * 0.30, bh = H * 0.16, wr = H * 0.035;
    const bodyBottom = trackY - 2 * wr;
    const bodyTop = bodyBottom - bh;
    const eyeY = bodyBottom - bh / 2;
    const maxLen = Math.min(W * 0.30, H * 0.30);
    const L = mag => mag > 1e-9 ? Math.max(8, mag / maxMag * maxLen) : 0;

    // Track
    ctx.fillStyle = P.track;
    ctx.fillRect(W * 0.04, trackY, W * 0.92, 5);
    // Strings run off toward the pulleys
    ctx.strokeStyle = P.string; ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    if (this.physics.mL > 0) { ctx.moveTo(cx - bw / 2, eyeY); ctx.lineTo(4, eyeY); }
    if (this.physics.mR > 0) { ctx.moveTo(cx + bw / 2, eyeY); ctx.lineTo(W - 4, eyeY); }
    ctx.stroke();
    // Cart
    ctx.fillStyle = P.cart; ctx.strokeStyle = P.cyan; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(cx - bw / 2, bodyTop, bw, bh); ctx.fill(); ctx.stroke();
    [cx - bw * 0.28, cx + bw * 0.28].forEach(x => {
      ctx.beginPath(); ctx.arc(x, bodyBottom + wr, wr, 0, Math.PI * 2);
      ctx.fillStyle = P.track; ctx.fill(); ctx.strokeStyle = P.text; ctx.lineWidth = 1.5; ctx.stroke();
    });
    this._text(ctx, this.hideCartMass ? '? g' : `${this.physics.mCart} g`, cx, bodyTop + bh * 0.3, P.text, fs - 2, 700);

    list.forEach(f => {
      const len = L(f.mag);
      if (!len) return;
      let x0, y0, x1, y1, lx, ly, align = 'center';
      if (f.sym === 'T_L') {
        x0 = cx - bw / 2; y0 = eyeY; x1 = x0 - len; y1 = y0;
        lx = x1 - 4; ly = y0 - fs * 0.9; align = 'right';
      } else if (f.sym === 'T_R') {
        x0 = cx + bw / 2; y0 = eyeY; x1 = x0 + len; y1 = y0;
        lx = x1 + 4; ly = y0 - fs * 0.9; align = 'left';
      } else if (f.sym === 'F_g') {
        x0 = cx - bw * 0.22; y0 = bodyTop + bh / 2; x1 = x0; y1 = y0 + len;
        lx = x0; ly = y1 + fs * 0.8;
      } else if (f.sym === 'F_N') {
        x0 = cx + bw * 0.22; y0 = trackY; x1 = x0; y1 = y0 - len;
        lx = x0; ly = y1 - fs * 0.8;
      } else {
        // Contact push from a hand or bumper: arrow points INTO the cart, ending at its side
        const side = f.dx > 0 ? -1 : 1;            // which side the pusher is on
        y0 = bodyBottom - bh * 0.25;
        x1 = cx + side * bw / 2; y1 = y0;
        x0 = x1 + side * len;
        lx = (x0 + x1) / 2; ly = y0 + fs * 1.1;
        this._text(ctx, f.sym === 'F_hand' ? '✋' : '▮', x0 + side * 11, y0, P.violet, fs + 6, 400);
      }
      this._arrow(ctx, x0, y0, x1, y1, f.color, 4);
      this._text(ctx, f.sym, lx, ly, f.color, fs + 1, 800, align);
    });
    this._updateLegend(list);
  }

  // HTML legend: what exerts each force (room for full words, real subscripts)
  _updateLegend(list) {
    if (!this.legendEl) return;
    const key = list.map(f => f.sym).join('|');
    if (key === this._legendKey) return;
    this._legendKey = key;
    const what = {
      T_L: 'tension: the left string pulls the cart',
      T_R: 'tension: the right string pulls the cart',
      F_N: 'normal force: the track pushes up on the cart',
      F_g: 'weight: Earth pulls down on the cart',
      F_hand: 'a hand holds the cart still',
      F_bumper: 'the bumper pushes on the cart'
    };
    const cls = { T_L: 'cyan', T_R: 'amber', F_N: 'emerald', F_g: 'rose', F_hand: 'violet', F_bumper: 'violet' };
    this.legendEl.innerHTML = subHTML(list.map(f =>
      `<li><span class="lg-sym lg-${cls[f.sym]}">${f.sym}</span> ${what[f.sym]}</li>`).join(''));
  }

  _drawFree(list, maxMag) {
    const { ctx, W, H } = this.f;
    const P = this.palette;
    const fs = Math.round(Math.max(11, Math.min(14, W / 26)));
    ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H * 0.48;
    const maxLen = Math.min(W * 0.30, H * 0.36);
    const pxPerN = maxLen / maxMag;
    const L = mag => mag > 1e-9 ? Math.max(10, mag * pxPerN) : 0;

    // Faint axes
    ctx.strokeStyle = P.grid; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - maxLen - 20, cy); ctx.lineTo(cx + maxLen + 20, cy);
    ctx.moveTo(cx, cy - maxLen - 14); ctx.lineTo(cx, cy + maxLen + 14);
    ctx.stroke(); ctx.setLineDash([]);

    list.forEach(f => {
      const len = L(f.mag);
      if (!len) return;
      // A contact push shares the horizontal axis with a tension; nudge it down so both stay visible
      const off = f.contact ? 9 : 0;
      const x1 = cx + f.dx * len, y1 = cy + f.dy * len + off;
      this._arrow(ctx, cx, cy + off, x1, y1, f.color, 3.5);
      const label = this._label(f);
      if (f.dy === 0) {
        const below = f.contact;
        this._text(ctx, label, x1 + f.dx * 4, y1 + (below ? fs * 1.1 : -fs * 0.9), f.color, fs, 800, f.dx > 0 ? 'left' : 'right');
      } else {
        this._text(ctx, label, cx + 8, y1 + (f.dy > 0 ? -fs * 0.4 : fs * 0.4), f.color, fs, 800, 'left');
      }
    });

    // The object itself
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = P.text; ctx.fill();

    // Scale bar (hidden for the mystery-cargo task: measuring the F_g arrow against it would reveal the mass)
    if (this.hideCartMass) return;
    const choices = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20];
    const unit = choices.find(c => c * pxPerN >= 28) || 20;
    const barLen = unit * pxPerN;
    const by = H - fs * 0.9;
    ctx.strokeStyle = P.text; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, by); ctx.lineTo(8 + barLen, by);
    ctx.moveTo(8, by - 4); ctx.lineTo(8, by + 4);
    ctx.moveTo(8 + barLen, by - 4); ctx.lineTo(8 + barLen, by + 4);
    ctx.stroke();
    this._text(ctx, `${unit} N`, 14 + barLen, by, P.text, fs - 1, 700, 'left');
  }
}

window.ForceDiagrams = ForceDiagrams;

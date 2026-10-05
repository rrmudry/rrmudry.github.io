// Newton's 2nd Law Studio — Canvas graphing engine
// Small, dependency-free plotter for live kinematics curves and trial scatter plots with fits.

class Graph {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.palette = null;
    this.resize();
  }

  refreshPalette() {
    const cs = getComputedStyle(document.documentElement);
    const v = n => cs.getPropertyValue(n).trim();
    this.palette = {
      bg: v('--canvas-bg'), grid: v('--canvas-grid'), axis: v('--canvas-text'), text: v('--canvas-text'),
      cyan: v('--accent-cyan'), amber: v('--accent-amber'), emerald: v('--accent-emerald'),
      rose: v('--accent-rose'), violet: v('--accent-violet'),
      mono: '"JetBrains Mono", ui-monospace, monospace'
    };
  }

  resize() {
    const W = Math.max(240, this.canvas.parentElement.clientWidth);
    const H = Math.round(Math.max(190, Math.min(W * 0.62, 340)));
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this.canvas.style.height = H + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = W; this.H = H;
  }

  static niceStep(range, targetTicks) {
    const raw = range / Math.max(1, targetTicks);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }

  static fmt(v, step) {
    const d = Math.max(0, Math.min(4, -Math.floor(Math.log10(step) + 1e-9)));
    return v.toFixed(d);
  }

  // opts: { xLabel, yLabel, xMin, xMax, yMin, yMax, series:[{points:[{x,y}], color, line, dots}],
  //         curve:{ fn, color, label }, emptyMessage }
  draw(opts) {
    if (!this.palette) this.refreshPalette();
    const { ctx, W, H, palette: P } = this;
    const fs = Math.round(Math.max(11, Math.min(14, W / 34)));
    const padL = fs * 4.4, padR = fs * 1.2, padT = fs * 1.4, padB = fs * 3.2;
    const pw = W - padL - padR, ph = H - padT - padB;

    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, W, H);

    const xMin = opts.xMin, xMax = opts.xMax > opts.xMin ? opts.xMax : opts.xMin + 1;
    const yMin = opts.yMin, yMax = opts.yMax > opts.yMin ? opts.yMax : opts.yMin + 1;
    const X = x => padL + (x - xMin) / (xMax - xMin) * pw;
    const Y = y => padT + ph - (y - yMin) / (yMax - yMin) * ph;

    // Grid + tick labels
    ctx.font = `${fs}px ${P.mono}`;
    ctx.lineWidth = 1;
    const xs = Graph.niceStep(xMax - xMin, Math.max(3, Math.floor(pw / 70)));
    const ys = Graph.niceStep(yMax - yMin, Math.max(3, Math.floor(ph / 40)));
    ctx.fillStyle = P.text;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let x = Math.ceil(xMin / xs) * xs; x <= xMax + 1e-9; x += xs) {
      ctx.strokeStyle = P.grid;
      ctx.beginPath(); ctx.moveTo(X(x), padT); ctx.lineTo(X(x), padT + ph); ctx.stroke();
      ctx.fillText(Graph.fmt(x, xs), X(x), padT + ph + 4);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let y = Math.ceil(yMin / ys) * ys; y <= yMax + 1e-9; y += ys) {
      ctx.strokeStyle = P.grid;
      ctx.beginPath(); ctx.moveTo(padL, Y(y)); ctx.lineTo(padL + pw, Y(y)); ctx.stroke();
      ctx.fillText(Graph.fmt(y, ys), padL - 5, Y(y));
    }

    // Axes (y = 0 line drawn bold when in range)
    ctx.strokeStyle = P.axis; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + ph); ctx.lineTo(padL + pw, padT + ph);
    ctx.stroke();
    if (yMin < 0 && yMax > 0) {
      ctx.beginPath(); ctx.moveTo(padL, Y(0)); ctx.lineTo(padL + pw, Y(0)); ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = P.text;
    ctx.font = `700 ${fs}px ${P.mono}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    SubText.fill(ctx, opts.xLabel, padL + pw / 2, H - 2);
    ctx.save();
    ctx.translate(fs * 0.9, padT + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle';
    SubText.fill(ctx, opts.yLabel, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.beginPath(); ctx.rect(padL, padT, pw, ph); ctx.clip();

    // Fit curve
    if (opts.curve) {
      ctx.strokeStyle = opts.curve.color || P.violet;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= 200; i++) {
        const x = xMin + (xMax - xMin) * i / 200;
        const y = opts.curve.fn(x);
        if (!isFinite(y)) { started = false; continue; }
        if (!started) { ctx.moveTo(X(x), Y(y)); started = true; } else ctx.lineTo(X(x), Y(y));
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Series
    (opts.series || []).forEach(s => {
      const pts = s.points || [];
      ctx.strokeStyle = s.color; ctx.fillStyle = s.color;
      if (s.line && pts.length > 1) {
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        pts.forEach((pt, i) => i ? ctx.lineTo(X(pt.x), Y(pt.y)) : ctx.moveTo(X(pt.x), Y(pt.y)));
        ctx.stroke();
      }
      if (s.dots) {
        pts.forEach(pt => {
          ctx.beginPath(); ctx.arc(X(pt.x), Y(pt.y), 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = P.bg; ctx.stroke();
        });
      }
    });
    ctx.restore();

    if (opts.curve && opts.curve.label) {
      ctx.font = `700 ${fs}px ${P.mono}`;
      ctx.fillStyle = opts.curve.color || P.violet;
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      SubText.fill(ctx, opts.curve.label, padL + pw - 6, padT + 4);
    }

    const empty = !(opts.series || []).some(s => (s.points || []).length);
    if (empty && opts.emptyMessage) {
      ctx.fillStyle = P.text;
      ctx.font = `${fs}px ${P.mono}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      SubText.fill(ctx, opts.emptyMessage, padL + pw / 2, padT + ph / 2);
    }
  }
}

// Least-squares fits used by the trial graphs
const Fits = {
  // y = m·x (line forced through the origin)
  throughOrigin(points) {
    let sxy = 0, sxx = 0;
    points.forEach(p => { sxy += p.x * p.y; sxx += p.x * p.x; });
    return sxx > 0 ? sxy / sxx : null;
  },
  // y = k / x  (equivalent to a line through the origin on a y vs 1/x plot)
  inverse(points) {
    return Fits.throughOrigin(points.map(p => ({ x: 1 / p.x, y: p.y })));
  }
};

window.Graph = Graph;
window.Fits = Fits;

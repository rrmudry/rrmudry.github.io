// Horizontal Projectile Workbench — Data graphs drawn from the student's own table
// Scatter points (optionally connected), gridlines, axis labels with real subscripts,
// dashed hover guide lines to both axes (no number readout: students read the axes),
// and point picking ("click two points to find the slope", "click the point where…").

(function () {
  const { fmt } = window.Engine;

  // Tick spacing of 1, 2, 2.5 or 5 × 10ⁿ giving about `target` ticks
  function niceStep(max, target = 6) {
    const raw = max / target;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }
  // Enough decimals to show every tick exactly (a 0.25 step needs 2)
  const decimals = step => { for (let d = 0; d < 4; d++) if (Math.abs(step * 10 ** d - Math.round(step * 10 ** d)) < 1e-9) return d; return 4; };

  class Plot {
    constructor(canvas, onPick) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.onPick = onPick;
      this.data = null;
      this.hover = null;
      this.refreshPalette();
      canvas.addEventListener('pointermove', e => { this.hover = this.pos(e); this.updateCursor(); });
      canvas.addEventListener('pointerleave', () => { this.hover = null; });
      canvas.addEventListener('pointerdown', e => this.click(this.pos(e)));
    }

    refreshPalette() {
      const cs = getComputedStyle(document.documentElement);
      const v = name => cs.getPropertyValue(name).trim();
      this.pal = { bg: v('--bg-card'), ink: v('--text-main'), dim: v('--text-dim'), grid: v('--border-subtle'), axis: v('--text-muted'), pick: v('--accent-violet'), red: '#dc2626' };
    }

    resize() {
      const r = this.canvas.parentElement.getBoundingClientRect();
      const w = Math.max(200, Math.floor(r.width)), h = Math.max(160, Math.floor(r.height));
      const dpr = window.devicePixelRatio || 1;
      this.W = w; this.H = h; this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
    }

    // data: { title, xLabel, yLabel, color, points:[{x,y}], connect, pickMode:'none'|'one'|'two', picks:[i] }
    setData(data) {
      this.data = data;
      const pts = data.points;
      const maxX = Math.max(...pts.map(p => p.x), data.xMin || 0.0001);
      const maxY = Math.max(...pts.map(p => p.y), data.yMin || 0.0001);
      this.xStep = niceStep(maxX * 1.08);
      this.yStep = niceStep(maxY * 1.08);
      this.xMax = Math.ceil(maxX * 1.08 / this.xStep) * this.xStep;
      this.yMax = Math.ceil(maxY * 1.08 / this.yStep) * this.yStep;
    }

    get fs() { return Math.min(1.6, Math.max(1, this.W / 420)); }
    area() {
      const fs = this.fs;
      return { l: 52 * fs, r: this.W - 14, t: 30 * fs, b: this.H - 40 * fs };
    }
    PX(x) { const a = this.area(); return a.l + (x / this.xMax) * (a.r - a.l); }
    PY(y) { const a = this.area(); return a.b - (y / this.yMax) * (a.b - a.t); }

    pos(e) {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    nearest(p) {
      if (!this.data) return -1;
      let best = -1, bd = 18;
      this.data.points.forEach((pt, i) => {
        const d = Math.hypot(this.PX(pt.x) - p.x, this.PY(pt.y) - p.y);
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    }

    updateCursor() {
      const picking = this.data && this.data.pickMode !== 'none';
      this.canvas.style.cursor = picking && this.nearest(this.hover) >= 0 ? 'pointer' : 'crosshair';
    }

    click(p) {
      if (!this.data || this.data.pickMode === 'none') return;
      const i = this.nearest(p);
      if (i >= 0 && this.onPick) this.onPick(i);
    }

    draw() {
      const { ctx, dpr } = this;
      if (!this.W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = this.pal.bg;
      ctx.fillRect(0, 0, this.W, this.H);
      if (!this.data) return;
      const d = this.data;
      const a = this.area();
      const fs = this.fs;

      // Title
      ctx.fillStyle = this.pal.ink;
      ctx.font = `800 ${Math.round(13 * fs)}px 'Outfit', system-ui, sans-serif`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      window.SubText.fill(ctx, d.title, a.l, 6 * fs);

      // Grid + ticks
      ctx.lineWidth = 1;
      ctx.font = `700 ${Math.round(11 * fs)}px 'Outfit', system-ui, sans-serif`;
      for (let i = 0; i * this.xStep <= this.xMax + 1e-9; i++) {
        const v = i * this.xStep, px = Math.round(this.PX(v)) + 0.5;
        ctx.strokeStyle = this.pal.grid;
        ctx.beginPath(); ctx.moveTo(px, a.t); ctx.lineTo(px, a.b); ctx.stroke();
        ctx.fillStyle = this.pal.axis; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(fmt(v, decimals(this.xStep)), px, a.b + 4);
      }
      for (let i = 0; i * this.yStep <= this.yMax + 1e-9; i++) {
        const v = i * this.yStep, py = Math.round(this.PY(v)) + 0.5;
        ctx.strokeStyle = this.pal.grid;
        ctx.beginPath(); ctx.moveTo(a.l, py); ctx.lineTo(a.r, py); ctx.stroke();
        ctx.fillStyle = this.pal.axis; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(fmt(v, decimals(this.yStep)), a.l - 5, py);
      }
      ctx.strokeStyle = this.pal.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a.l, a.t); ctx.lineTo(a.l, a.b); ctx.lineTo(a.r, a.b); ctx.stroke();

      // Axis labels
      ctx.fillStyle = this.pal.ink;
      ctx.font = `800 ${Math.round(12 * fs)}px 'Outfit', system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      window.SubText.fill(ctx, d.xLabel, (a.l + a.r) / 2, this.H - 3);
      ctx.save();
      ctx.translate(13 * fs, (a.t + a.b) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = 'middle';
      window.SubText.fill(ctx, d.yLabel, 0, 0);
      ctx.restore();

      // Hover guide lines to both axes
      const h = this.hover;
      if (h && h.x >= a.l && h.x <= a.r && h.y >= a.t && h.y <= a.b) {
        ctx.strokeStyle = this.pal.red; ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x, a.b); ctx.moveTo(h.x, h.y); ctx.lineTo(a.l, h.y); ctx.stroke();
        ctx.setLineDash([]);
      }

      // Data: connecting line, then points
      const color = d.color || this.pal.ink;
      if (d.connect && d.points.length > 1) {
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        d.points.forEach((p, i) => i ? ctx.lineTo(this.PX(p.x), this.PY(p.y)) : ctx.moveTo(this.PX(p.x), this.PY(p.y)));
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      const hoverIdx = d.pickMode !== 'none' && h ? this.nearest(h) : -1;
      d.points.forEach((p, i) => {
        const px = this.PX(p.x), py = this.PY(p.y);
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(px, py, (i === hoverIdx ? 7 : 5) * fs, 0, Math.PI * 2); ctx.fill();
      });
      (d.picks || []).forEach((i, n) => {
        const p = d.points[i];
        if (!p) return;
        const px = this.PX(p.x), py = this.PY(p.y);
        ctx.strokeStyle = this.pal.pick; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(px, py, 10 * fs, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = this.pal.pick;
        ctx.font = `800 ${Math.round(12 * fs)}px 'Outfit', system-ui, sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(d.pickLabels ? d.pickLabels[n] : `P${n + 1}`, px + 10 * fs, py - 8 * fs);
      });
    }
  }

  window.Plot = Plot;
})();

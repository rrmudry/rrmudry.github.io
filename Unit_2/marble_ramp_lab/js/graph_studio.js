/**
 * GraphStudio - Interactive Click-to-Plot Graphing Engine for Marble Ramp Lab
 * Supports:
 * 1. Position vs. Time (x vs t) with dynamic slope triangles (Rise / Run = velocity)
 * 2. Velocity vs. Time (v vs t) with constant-speed horizontal lines and shaded area rectangles
 * Provides click/tap-to-place, dragging, snap assistance, coordinate HUD reticle, and PNG export.
 */

class InteractiveGraphCanvas {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn(`Canvas #${canvasId} not found in DOM.`);
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.type = options.type || 'position'; // 'position' or 'velocity'
    this.title = options.title || 'Motion Graph';
    this.xLabel = options.xLabel || 'Time (s)';
    this.yLabel = options.yLabel || (this.type === 'position' ? 'Position (cm)' : 'Velocity (cm/s)');

    this.padding = { top: 38, right: 35, bottom: 44, left: 60 };

    this.tMax = options.tMax || 5.0;
    this.yMax = options.yMax || (this.type === 'position' ? 80.0 : 60.0);
    this.yMin = 0;

    // Series definitions for 3 ramp levels
    // Each series has: { id, name, color, darkColor, targetPoints: [{t, y}, {t, y}], studentPoints: [] }
    this.series = options.series || [];
    this.activeSeriesId = options.activeSeriesId || 'low';

    this.draggingPoint = null; // { seriesId, pointIndex }
    this.hoverPoint = null;
    this.pointerPos = null;

    this.showSlopeTriangle = true;
    this.showAreaShading = true;

    this.onPointsUpdated = options.onPointsUpdated || null;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindEvents();
    this.render();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || 600;
    const height = Math.min(360, Math.max(260, window.innerHeight * 0.38));

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this.width = width;
    this.height = height;
    this.render();
  }

  // Coordinate transformations
  timeToPx(t) {
    const plotW = this.width - this.padding.left - this.padding.right;
    return this.padding.left + (t / this.tMax) * plotW;
  }

  pxToTime(px) {
    const plotW = this.width - this.padding.left - this.padding.right;
    const t = ((px - this.padding.left) / plotW) * this.tMax;
    return Math.max(0, Math.min(this.tMax, t));
  }

  yToPx(y) {
    const plotH = this.height - this.padding.top - this.padding.bottom;
    const norm = (y - this.yMin) / (this.yMax - this.yMin);
    return this.height - this.padding.bottom - norm * plotH;
  }

  pxToY(py) {
    const plotH = this.height - this.padding.top - this.padding.bottom;
    const norm = (this.height - this.padding.bottom - py) / plotH;
    const y = this.yMin + norm * (this.yMax - this.yMin);
    return Math.max(this.yMin, Math.min(this.yMax, y));
  }

  // Series management
  setSeries(seriesList, activeId = null) {
    this.series = seriesList;
    if (activeId) this.activeSeriesId = activeId;
    this.updateBounds();
    this.render();
  }

  setActiveSeries(seriesId) {
    this.activeSeriesId = seriesId;
    this.render();
  }

  updateBounds() {
    let maxT = 3.0;
    let maxY = this.type === 'position' ? 70.0 : 40.0;

    this.series.forEach(s => {
      if (s.targetPoints) {
        s.targetPoints.forEach(p => {
          if (p.t > maxT) maxT = p.t;
          if (p.y > maxY) maxY = p.y;
        });
      }
      if (s.studentPoints) {
        s.studentPoints.forEach(p => {
          if (p.t > maxT) maxT = p.t;
          if (p.y > maxY) maxY = p.y;
        });
      }
    });

    // Add 15% headroom for breathing room and clear slope/area visualizers
    this.tMax = Math.max(3.0, Math.ceil(maxT * 1.2));
    this.yMax = Math.max(this.type === 'position' ? 60 : 30, Math.ceil(maxY * 1.15 / 10) * 10);
  }

  bindEvents() {
    let isDown = false;

    const getCoords = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      isDown = true;
      try { this.canvas.setPointerCapture(e.pointerId); } catch (err) {}
      const pos = getCoords(e);
      this.pointerPos = pos;

      // Check if clicking existing point in active series or any series
      const hit = this.hitTestPoint(pos.x, pos.y);
      if (hit) {
        this.draggingPoint = hit;
        this.canvas.style.cursor = 'grabbing';
      }
      this.render();
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const pos = getCoords(e);
      this.pointerPos = pos;

      if (isDown && this.draggingPoint) {
        // Drag existing point
        const rawT = this.pxToTime(pos.x);
        const rawY = this.pxToY(pos.y);

        const seriesObj = this.series.find(s => s.id === this.draggingPoint.seriesId);
        if (seriesObj && seriesObj.studentPoints[this.draggingPoint.pointIndex]) {
          seriesObj.studentPoints[this.draggingPoint.pointIndex] = {
            t: parseFloat(rawT.toFixed(2)),
            y: parseFloat(rawY.toFixed(1))
          };
          this.render();
          if (this.onPointsUpdated) this.onPointsUpdated(this.series);
        }
      } else if (!isDown) {
        // Hover state
        const hit = this.hitTestPoint(pos.x, pos.y);
        this.hoverPoint = hit;
        this.canvas.style.cursor = hit ? 'grab' : 'crosshair';
        this.render();
      }
    });

    this.canvas.addEventListener('pointerup', (e) => {
      if (!isDown) return;
      isDown = false;
      try { this.canvas.releasePointerCapture(e.pointerId); } catch (err) {}

      const pos = getCoords(e);

      if (this.draggingPoint) {
        // Finished dragging: Snap to target if near target
        this.snapActivePoint(this.draggingPoint.seriesId, this.draggingPoint.pointIndex);
        this.draggingPoint = null;
        this.canvas.style.cursor = 'crosshair';
        if (window.labSound) window.labSound.playSnap();
        this.render();
        if (this.onPointsUpdated) this.onPointsUpdated(this.series);
      } else {
        // Click on empty space: place next point in active series
        this.placePointAt(pos.x, pos.y);
      }
    });

    this.canvas.addEventListener('pointerleave', () => {
      this.pointerPos = null;
      this.hoverPoint = null;
      this.render();
    });
  }

  hitTestPoint(px, py) {
    const threshold = 18; // px tolerance for easy mobile/touch grabbing

    // Check active series first
    const activeSeries = this.series.find(s => s.id === this.activeSeriesId);
    if (activeSeries && activeSeries.studentPoints) {
      for (let i = 0; i < activeSeries.studentPoints.length; i++) {
        const pt = activeSeries.studentPoints[i];
        const pX = this.timeToPx(pt.t);
        const pY = this.yToPx(pt.y);
        const dist = Math.hypot(px - pX, py - pY);
        if (dist <= threshold) {
          return { seriesId: activeSeries.id, pointIndex: i };
        }
      }
    }

    // Check other series
    for (const s of this.series) {
      if (s.id === this.activeSeriesId || !s.studentPoints) continue;
      for (let i = 0; i < s.studentPoints.length; i++) {
        const pt = s.studentPoints[i];
        const pX = this.timeToPx(pt.t);
        const pY = this.yToPx(pt.y);
        const dist = Math.hypot(px - pX, py - pY);
        if (dist <= threshold) {
          return { seriesId: s.id, pointIndex: i };
        }
      }
    }

    return null;
  }

  placePointAt(px, py) {
    // Check if within graph plot area
    if (px < this.padding.left - 10 || px > this.width - this.padding.right + 10 ||
        py < this.padding.top - 10 || py > this.height - this.padding.bottom + 10) {
      return;
    }

    const seriesObj = this.series.find(s => s.id === this.activeSeriesId);
    if (!seriesObj) return;

    if (!seriesObj.studentPoints) seriesObj.studentPoints = [];

    // Max 2 points per ramp level (start point and end point)
    if (seriesObj.studentPoints.length >= 2) {
      // If already has 2 points, allow clicking near one to replace or clear
      return;
    }

    let t = this.pxToTime(px);
    let y = this.pxToY(py);

    // Pedagogical snapping assistance:
    // If placing point 0 (start point): snap to origin (0, 0) if close to t=0
    if (seriesObj.studentPoints.length === 0) {
      if (this.type === 'position') {
        if (t < 0.4 && y < 10) {
          t = 0; y = 0;
        }
      } else {
        // Velocity start point: (0, v)
        if (t < 0.4 && seriesObj.targetPoints && seriesObj.targetPoints[0]) {
          const targetV = seriesObj.targetPoints[0].y;
          if (Math.abs(y - targetV) < 8) {
            t = 0; y = targetV;
          }
        }
      }
    } else if (seriesObj.studentPoints.length === 1) {
      // If placing point 1 (end point): snap to target (t_avg, d) or (t_avg, v) if near
      if (seriesObj.targetPoints && seriesObj.targetPoints[1]) {
        const targetPt = seriesObj.targetPoints[1];
        if (Math.abs(t - targetPt.t) < 0.35 && Math.abs(y - targetPt.y) < (this.type === 'position' ? 8 : 6)) {
          t = targetPt.t;
          y = targetPt.y;
        }
      }
    }

    seriesObj.studentPoints.push({
      t: parseFloat(t.toFixed(2)),
      y: parseFloat(y.toFixed(1))
    });

    // Sort chronologically by time
    seriesObj.studentPoints.sort((a, b) => a.t - b.t);

    if (window.labSound) window.labSound.playPointPlot();
    this.render();

    if (this.onPointsUpdated) this.onPointsUpdated(this.series);
  }

  snapActivePoint(seriesId, pointIndex) {
    const seriesObj = this.series.find(s => s.id === seriesId);
    if (!seriesObj || !seriesObj.targetPoints || !seriesObj.studentPoints[pointIndex]) return;

    const pt = seriesObj.studentPoints[pointIndex];
    // Find closest target point
    seriesObj.targetPoints.forEach(target => {
      const dt = Math.abs(pt.t - target.t);
      const dy = Math.abs(pt.y - target.y);
      const tTolerance = 0.35;
      const yTolerance = this.type === 'position' ? 6.0 : 4.0;
      if (dt <= tTolerance && dy <= yTolerance) {
        pt.t = target.t;
        pt.y = target.y;
      }
    });

    seriesObj.studentPoints.sort((a, b) => a.t - b.t);
  }

  clearSeriesPoints(seriesId) {
    const s = this.series.find(item => item.id === seriesId);
    if (s) {
      s.studentPoints = [];
      this.render();
      if (this.onPointsUpdated) this.onPointsUpdated(this.series);
    }
  }

  // --- RENDERING ---
  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const isDark = document.documentElement.classList.contains('dark');

    ctx.clearRect(0, 0, this.width, this.height);

    this.drawGridAndAxes(ctx, isDark);

    // Draw shaded area for velocity graphs (behind lines)
    if (this.type === 'velocity' && this.showAreaShading) {
      this.drawAreaShading(ctx, isDark);
    }

    // Draw series lines and points
    this.series.forEach(s => {
      const isActive = s.id === this.activeSeriesId;
      this.drawSeries(ctx, s, isActive, isDark);
    });

    // Draw slope triangle for position graphs
    if (this.type === 'position' && this.showSlopeTriangle) {
      this.drawSlopeTriangle(ctx, isDark);
    }

    // Draw coordinate reticle/crosshair if hovering
    if (this.pointerPos) {
      this.drawReticle(ctx, this.pointerPos.x, this.pointerPos.y, isDark);
    }
  }

  drawGridAndAxes(ctx, isDark) {
    const pad = this.padding;
    const plotW = this.width - pad.left - pad.right;
    const plotH = this.height - pad.top - pad.bottom;

    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const axisColor = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    // Horizontal grid lines
    const yStep = this.yMax <= 40 ? 5 : (this.yMax <= 80 ? 10 : 20);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '11px "JetBrains Mono", monospace';

    for (let y = 0; y <= this.yMax; y += yStep) {
      const py = this.yToPx(y);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, py);
      ctx.lineTo(this.width - pad.right, py);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.fillText(y.toString(), pad.left - 8, py);
    }

    // Vertical grid lines
    const tStep = this.tMax <= 4 ? 0.5 : 1.0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let t = 0; t <= this.tMax; t += tStep) {
      const px = this.timeToPx(t);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, pad.top);
      ctx.lineTo(px, this.height - pad.bottom);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.fillText(t.toFixed(tStep < 1 ? 1 : 0), px, this.height - pad.bottom + 8);
    }

    // Solid Axis Lines
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Y Axis
    ctx.moveTo(pad.left, pad.top - 10);
    ctx.lineTo(pad.left, this.height - pad.bottom);
    // X Axis
    ctx.lineTo(this.width - pad.right + 10, this.height - pad.bottom);
    ctx.stroke();

    // Axis Labels
    ctx.save();
    ctx.font = '12px "Outfit", sans-serif';
    ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';

    // X Axis Label
    ctx.textAlign = 'center';
    ctx.fillText(this.xLabel, pad.left + plotW / 2, this.height - 10);

    // Y Axis Label (Rotated)
    ctx.translate(16, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(this.yLabel, 0, 0);
    ctx.restore();

    // Title
    ctx.font = 'bold 13px "Space Grotesk", sans-serif';
    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText(this.title, pad.left, 22);
  }

  drawSeries(ctx, s, isActive, isDark) {
    const pts = s.studentPoints || [];
    const color = isDark ? s.darkColor : s.color;

    // Draw Target Ghost Line (faint dashed) to guide student
    if (s.targetPoints && s.targetPoints.length === 2 && isActive) {
      const p1 = s.targetPoints[0];
      const p2 = s.targetPoints[1];
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.timeToPx(p1.t), this.yToPx(p1.y));
      ctx.lineTo(this.timeToPx(p2.t), this.yToPx(p2.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Connect student points with solid line if 2 points
    if (pts.length >= 2) {
      ctx.strokeStyle = color;
      ctx.lineWidth = isActive ? 3 : 2;
      ctx.globalAlpha = isActive ? 1.0 : 0.65;
      ctx.beginPath();
      ctx.moveTo(this.timeToPx(pts[0].t), this.yToPx(pts[0].y));
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(this.timeToPx(pts[i].t), this.yToPx(pts[i].y));
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // Draw individual points
    pts.forEach((p, idx) => {
      const px = this.timeToPx(p.t);
      const py = this.yToPx(p.y);
      const isHovered = this.hoverPoint && this.hoverPoint.seriesId === s.id && this.hoverPoint.pointIndex === idx;
      const isDragged = this.draggingPoint && this.draggingPoint.seriesId === s.id && this.draggingPoint.pointIndex === idx;

      ctx.save();
      // Outer glow if active or hovered
      if (isActive || isHovered || isDragged) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(px, py, isDragged ? 16 : (isHovered ? 13 : 10), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Point circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      // White inner ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Coordinate Label Badge
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.textAlign = 'center';
      const labelText = `(${p.t.toFixed(1)}s, ${p.y.toFixed(0)}${this.type === 'position' ? 'cm' : 'cm/s'})`;
      ctx.fillText(labelText, px, py - 12);
      ctx.restore();
    });
  }

  drawSlopeTriangle(ctx, isDark) {
    const activeSeries = this.series.find(s => s.id === this.activeSeriesId);
    if (!activeSeries || !activeSeries.studentPoints || activeSeries.studentPoints.length < 2) return;

    const p1 = activeSeries.studentPoints[0];
    const p2 = activeSeries.studentPoints[1];
    if (Math.abs(p2.t - p1.t) < 0.05) return;

    const x1 = this.timeToPx(p1.t);
    const y1 = this.yToPx(p1.y);
    const x2 = this.timeToPx(p2.t);
    const y2 = this.yToPx(p2.y);

    const cornerX = x2;
    const cornerY = y1;

    // Dashed slope triangle legs
    ctx.save();
    ctx.setLineDash([4, 4]);

    // Horizontal run line (Delta t)
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(cornerX, cornerY);
    ctx.stroke();

    // Vertical rise line (Delta x)
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cornerX, cornerY);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Text labels for Rise and Run
    const dt = (p2.t - p1.t).toFixed(2);
    const dx = (p2.y - p1.y).toFixed(1);
    const slope = ((p2.y - p1.y) / (p2.t - p1.t)).toFixed(1);

    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    // Run label (below run line)
    ctx.fillStyle = '#0284c7';
    ctx.textAlign = 'center';
    ctx.fillText(`Δt = ${dt}s`, (x1 + cornerX) / 2, cornerY + 14);

    // Rise label (right of rise line)
    ctx.fillStyle = '#e11d48';
    ctx.textAlign = 'left';
    ctx.fillText(`Δx = ${dx}cm`, cornerX + 6, (y1 + y2) / 2);

    // Slope Badge on top right of graph
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = activeSeries.color;
    ctx.lineWidth = 1;
    const badgeW = 160;
    const badgeH = 26;
    const badgeX = this.width - this.padding.right - badgeW;
    const badgeY = this.padding.top + 6;

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(`Slope = ${slope} cm/s`, badgeX + badgeW / 2, badgeY + 17);

    ctx.restore();
  }

  drawAreaShading(ctx, isDark) {
    const activeSeries = this.series.find(s => s.id === this.activeSeriesId);
    if (!activeSeries || !activeSeries.studentPoints || activeSeries.studentPoints.length < 2) return;

    const p1 = activeSeries.studentPoints[0];
    const p2 = activeSeries.studentPoints[1];

    const x1 = this.timeToPx(p1.t);
    const y1 = this.yToPx(p1.y);
    const x2 = this.timeToPx(p2.t);
    const y2 = this.yToPx(p2.y);
    const groundY = this.yToPx(0);

    ctx.save();
    // Shaded rectangle
    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)';
    ctx.fillRect(x1, y1, x2 - x1, groundY - y1);

    // Dashed border down to time axis
    ctx.strokeStyle = activeSeries.color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1, groundY);
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2, groundY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Area Label in center of rectangle
    const dt = (p2.t - p1.t);
    const vAvg = ((p1.y + p2.y) / 2);
    const area = (dt * vAvg).toFixed(1);

    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.textAlign = 'center';
    ctx.fillText(`Area = ${area} cm`, (x1 + x2) / 2, (y1 + groundY) / 2);
    ctx.font = '9px "Outfit", sans-serif';
    ctx.fillText(`(Distance traveled across table)`, (x1 + x2) / 2, (y1 + groundY) / 2 + 14);

    ctx.restore();
  }

  drawReticle(ctx, px, py, isDark) {
    // Only draw if inside graph area
    if (px < this.padding.left || px > this.width - this.padding.right ||
        py < this.padding.top || py > this.height - this.padding.bottom) {
      return;
    }

    const t = this.pxToTime(px);
    const y = this.pxToY(py);

    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Crosshair lines
    ctx.beginPath();
    ctx.moveTo(this.padding.left, py);
    ctx.lineTo(this.width - this.padding.right, py);
    ctx.moveTo(px, this.padding.top);
    ctx.lineTo(px, this.height - this.padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Reticle center ring
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.stroke();

    // Small coordinate tooltips near cursor
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.fillText(`${t.toFixed(2)}s, ${y.toFixed(1)}`, px + 8, py - 8);
    ctx.restore();
  }

  exportPng(filename = "graph.png") {
    if (!this.canvas) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}

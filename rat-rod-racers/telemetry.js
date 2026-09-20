/**
 * Rat Rod Racers - Interactive Telemetry Graphing Viewer
 * Renders Dual-Car Comparative Curves: Position (x-t), Velocity (v-t), Acceleration (a-t), Net Force (F_net-t).
 * Interactive scrub inspection tooltips & physical slope/area annotations.
 */

class TelemetryViewer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.playerData = [];
    this.opponentData = [];
    this.mode = 'v-t'; // 'x-t', 'v-t', 'a-t', 'f-t'
    this.hoverT = null;
    this.units = 'metric'; // 'metric' or 'imperial'

    if (this.canvas) {
      this._initEvents();
    }
  }

  setData(playerTelemetry, opponentTelemetry) {
    this.playerData = playerTelemetry || [];
    this.opponentData = opponentTelemetry || [];
    this.render();
  }

  setMode(newMode) {
    this.mode = newMode;
    this.render();
  }

  setUnits(newUnits) {
    this.units = newUnits;
    this.render();
  }

  _initEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const padLeft = 60;
      const padRight = 30;
      const w = this.canvas.width - padLeft - padRight;

      if (mouseX >= padLeft && mouseX <= this.canvas.width - padRight) {
        const tMax = this._getMaxTime();
        if (tMax > 0) {
          this.hoverT = ((mouseX - padLeft) / w) * tMax;
          this.render();
        }
      } else {
        if (this.hoverT !== null) {
          this.hoverT = null;
          this.render();
        }
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverT = null;
      this.render();
    });
  }

  _getMaxTime() {
    const tP = this.playerData.length > 0 ? this.playerData[this.playerData.length - 1].t : 0;
    const tO = this.opponentData.length > 0 ? this.opponentData[this.opponentData.length - 1].t : 0;
    return Math.max(1, Math.max(tP, tO));
  }

  _getValue(entry, mode) {
    if (!entry) return 0;
    switch (mode) {
      case 'x-t':
        return this.units === 'imperial' ? entry.x * 3.28084 : entry.x; // ft or m
      case 'v-t':
        return this.units === 'imperial' ? entry.v * 2.23694 : entry.v; // mph or m/s
      case 'a-t':
        return this.units === 'imperial' ? entry.a * 3.28084 : entry.a; // ft/s² or m/s²
      case 'f-t':
        return entry.fNet; // N
      default:
        return entry.v;
    }
  }

  _getYUnitLabel() {
    switch (this.mode) {
      case 'x-t': return this.units === 'imperial' ? 'Position x (ft)' : 'Position x (m)';
      case 'v-t': return this.units === 'imperial' ? 'Velocity v (mph)' : 'Velocity v (m/s)';
      case 'a-t': return this.units === 'imperial' ? 'Acceleration a (ft/s²)' : 'Acceleration a (m/s²)';
      case 'f-t': return 'Net Force F_net (N)';
      default: return '';
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return;

    // Handle high DPI scaling
    const w = this.canvas.clientWidth || 600;
    const h = this.canvas.clientHeight || 280;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    const padLeft = 65;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const tMax = Math.ceil(this._getMaxTime() * 1.05);

    // Calculate Y Max
    let yMax = 10;
    this.playerData.forEach(p => {
      const val = this._getValue(p, this.mode);
      if (val > yMax) yMax = val;
    });
    this.opponentData.forEach(o => {
      const val = this._getValue(o, this.mode);
      if (val > yMax) yMax = val;
    });
    yMax = Math.ceil(yMax * 1.15);

    // 1. Draw Grid Lines
    ctx.strokeStyle = '#252936';
    ctx.lineWidth = 1;

    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const yVal = (yMax / ySteps) * i;
      const yPos = padTop + plotH - (i / ySteps) * plotH;

      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(padLeft + plotW, yPos);
      ctx.stroke();

      ctx.fillStyle = '#8d99ae';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(yVal), padLeft - 8, yPos + 3);
    }

    const xSteps = 5;
    for (let j = 0; j <= xSteps; j++) {
      const tVal = ((tMax / xSteps) * j).toFixed(1);
      const xPos = padLeft + (j / xSteps) * plotW;

      ctx.beginPath();
      ctx.moveTo(xPos, padTop);
      ctx.lineTo(xPos, padTop + plotH);
      ctx.stroke();

      ctx.fillStyle = '#8d99ae';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(tVal + 's', xPos, padTop + plotH + 18);
    }

    // Axes
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#adb5bd';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Elapsed Time t (seconds)", padLeft + plotW / 2, padTop + plotH + 34);

    ctx.save();
    ctx.translate(18, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(this._getYUnitLabel(), 0, 0);
    ctx.restore();

    // 2. Draw Opponent Curve (Orange)
    this._drawCurve(ctx, this.opponentData, '#ff7b00', padLeft, padTop, plotW, plotH, tMax, yMax);

    // 3. Draw Player Curve (Cyan)
    this._drawCurve(ctx, this.playerData, '#00f0ff', padLeft, padTop, plotW, plotH, tMax, yMax);

    // 4. Scrubbing Cursor and Tooltip
    if (this.hoverT !== null) {
      this._drawScrubTooltip(ctx, padLeft, padTop, plotW, plotH, tMax, yMax);
    }

    // 5. Legend
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px sans-serif';
    // Player
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(padLeft + 10, 10, 14, 4);
    ctx.fillText("Your Rat Rod", padLeft + 30, 15);
    // Opponent
    ctx.fillStyle = '#ff7b00';
    ctx.fillRect(padLeft + 130, 10, 14, 4);
    ctx.fillText("Opponent Ghost", padLeft + 150, 15);
  }

  _drawCurve(ctx, data, color, padLeft, padTop, plotW, plotH, tMax, yMax) {
    if (!data || data.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      const val = this._getValue(entry, this.mode);
      const xPos = padLeft + (entry.t / tMax) * plotW;
      const yPos = padTop + plotH - (val / yMax) * plotH;

      if (i === 0) ctx.moveTo(xPos, yPos);
      else ctx.lineTo(xPos, yPos);
    }
    ctx.stroke();

    // End point mark
    const last = data[data.length - 1];
    const valLast = this._getValue(last, this.mode);
    const xEnd = padLeft + (last.t / tMax) * plotW;
    const yEnd = padTop + plotH - (valLast / yMax) * plotH;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(xEnd, yEnd, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  _findClosest(data, t) {
    if (!data || data.length === 0) return null;
    let closest = data[0];
    let minDiff = Math.abs(data[0].t - t);
    for (let i = 1; i < data.length; i++) {
      const diff = Math.abs(data[i].t - t);
      if (diff < minDiff) {
        minDiff = diff;
        closest = data[i];
      }
    }
    return closest;
  }

  _drawScrubTooltip(ctx, padLeft, padTop, plotW, plotH, tMax, yMax) {
    const t = this.hoverT;
    const xPos = padLeft + (t / tMax) * plotW;

    // Vertical cursor line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xPos, padTop);
    ctx.lineTo(xPos, padTop + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    const pEntry = this._findClosest(this.playerData, t);
    const oEntry = this._findClosest(this.opponentData, t);

    const pVal = pEntry ? this._getValue(pEntry, this.mode) : 0;
    const oVal = oEntry ? this._getValue(oEntry, this.mode) : 0;

    // Dots on curves
    if (pEntry) {
      const yP = padTop + plotH - (pVal / yMax) * plotH;
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath(); ctx.arc(xPos, yP, 5, 0, Math.PI * 2); ctx.fill();
    }
    if (oEntry) {
      const yO = padTop + plotH - (oVal / yMax) * plotH;
      ctx.fillStyle = '#ff7b00';
      ctx.beginPath(); ctx.arc(xPos, yO, 5, 0, Math.PI * 2); ctx.fill();
    }

    // Tooltip box
    const boxW = 140;
    const boxH = 65;
    let boxX = xPos + 10;
    if (boxX + boxW > padLeft + plotW) boxX = xPos - boxW - 10;
    const boxY = padTop + 20;

    ctx.fillStyle = 'rgba(18, 21, 28, 0.92)';
    ctx.strokeStyle = '#3b4252';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${t.toFixed(2)}s`, boxX + 10, boxY + 18);

    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`You: ${pVal.toFixed(1)}`, boxX + 10, boxY + 36);

    ctx.fillStyle = '#ff7b00';
    ctx.fillText(`Rival: ${oVal.toFixed(1)}`, boxX + 10, boxY + 54);
  }
}

window.TelemetryViewer = TelemetryViewer;

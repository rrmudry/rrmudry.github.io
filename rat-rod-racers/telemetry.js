/**
 * Rat Rod Racers - Interactive Telemetry Graphing Viewer
 * Renders Dual-Car Comparative Curves:
 * - Position (x-t)
 * - Velocity (v-t)
 * - Acceleration (a-t)
 * - Net Force (F_net-t)
 * - Engine Temperature (T-t) with Overheat Threshold
 * - Wheelspin Loss (F_spin-t)
 * Interactive scrub inspection tooltips & physical slope/area annotations.
 */

class TelemetryViewer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.playerData = [];
    this.opponentData = [];
    this.mode = 'v-t'; // 'x-t', 'v-t', 'a-t', 'f-t', 'temp', 'wheelspin'
    this.hoverT = null;
    this.units = 'imperial'; // 'imperial' or 'metric'

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
      const padLeft = 65;
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
        return entry.fNet || 0; // N
      case 'temp':
        const tempF = entry.temp !== undefined ? entry.temp : 85;
        return this.units === 'imperial' ? tempF : (tempF - 32) * (5 / 9); // °F or °C
      case 'wheelspin':
        return entry.fSpin || 0; // N
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
      case 'temp': return this.units === 'imperial' ? 'Engine Temp (°F)' : 'Engine Temp (°C)';
      case 'wheelspin': return 'Wheelspin Excess Loss (N)';
      default: return '';
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.clientWidth || 600;
    const h = this.canvas.clientHeight || 280;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    const padLeft = 68;
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

    if (this.mode === 'temp') {
      const critLine = this.units === 'imperial' ? 225 : (225 - 32) * (5 / 9);
      yMax = Math.max(yMax, critLine * 1.15);
    }
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

    // Critical Overheat Threshold Line if viewing temperature
    if (this.mode === 'temp') {
      const critVal = this.units === 'imperial' ? 225 : (225 - 32) * (5 / 9);
      const critY = padTop + plotH - (critVal / yMax) * plotH;

      ctx.save();
      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(padLeft, critY);
      ctx.lineTo(padLeft + plotW, critY);
      ctx.stroke();

      ctx.fillStyle = '#e63946';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`🔥 OVERHEAT THRESHOLD (${Math.round(critVal)}°)`, padLeft + plotW - 6, critY - 4);
      ctx.restore();
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
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'left';
    ctx.fillText("■ YOUR CAR", padLeft + 12, padTop + 16);

    ctx.fillStyle = '#ff7b00';
    ctx.fillText("■ OPPONENT GHOST", padLeft + 115, padTop + 16);
  }

  _drawCurve(ctx, data, color, padLeft, padTop, plotW, plotH, tMax, yMax) {
    if (!data || data.length < 2) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    data.forEach((pt, i) => {
      const val = this._getValue(pt, this.mode);
      const x = padLeft + (pt.t / tMax) * plotW;
      const y = padTop + plotH - (Math.max(0, val) / yMax) * plotH;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Fill underneath curve slightly
    const lastPt = data[data.length - 1];
    const lastX = padLeft + (lastPt.t / tMax) * plotW;
    ctx.lineTo(lastX, padTop + plotH);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.closePath();
    ctx.fillStyle = color === '#00f0ff' ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 123, 0, 0.06)';
    ctx.fill();
    ctx.restore();
  }

  _drawScrubTooltip(ctx, padLeft, padTop, plotW, plotH, tMax, yMax) {
    const xPos = padLeft + (this.hoverT / tMax) * plotW;

    // Vertical cursor line
    ctx.strokeStyle = '#f8f9fa';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xPos, padTop);
    ctx.lineTo(xPos, padTop + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Find nearest telemetry points
    const pPt = this._findNearestPoint(this.playerData, this.hoverT);
    const oPt = this._findNearestPoint(this.opponentData, this.hoverT);

    const pVal = this._getValue(pPt, this.mode);
    const oVal = this._getValue(oPt, this.mode);

    // Tooltip Box
    const boxW = 160;
    const boxH = 68;
    let boxX = xPos + 12;
    if (boxX + boxW > padLeft + plotW) {
      boxX = xPos - boxW - 12;
    }
    const boxY = padTop + 20;

    ctx.fillStyle = 'rgba(18, 22, 32, 0.94)';
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${this.hoverT.toFixed(2)}s`, boxX + 10, boxY + 18);

    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`You: ${pVal.toFixed(1)} ${this._getShortUnit()}`, boxX + 10, boxY + 36);

    ctx.fillStyle = '#ff7b00';
    ctx.fillText(`Ghost: ${oVal.toFixed(1)} ${this._getShortUnit()}`, boxX + 10, boxY + 54);
  }

  _getShortUnit() {
    switch (this.mode) {
      case 'x-t': return this.units === 'imperial' ? 'ft' : 'm';
      case 'v-t': return this.units === 'imperial' ? 'mph' : 'm/s';
      case 'a-t': return this.units === 'imperial' ? 'ft/s²' : 'm/s²';
      case 'f-t': return 'N';
      case 'temp': return '°';
      case 'wheelspin': return 'N';
      default: return '';
    }
  }

  _findNearestPoint(data, t) {
    if (!data || data.length === 0) return null;
    let best = data[0];
    let minDiff = Math.abs(best.t - t);
    for (let i = 1; i < data.length; i++) {
      const diff = Math.abs(data[i].t - t);
      if (diff < minDiff) {
        minDiff = diff;
        best = data[i];
      }
    }
    return best;
  }
}

window.TelemetryViewer = TelemetryViewer;

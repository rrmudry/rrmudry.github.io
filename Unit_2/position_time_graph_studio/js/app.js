/**
 * Position vs. Time Graphing Studio - Main Application Engine
 * Low Floor, High Ceiling Architecture
 * High School Physics (Unit 2 Kinematics - Day 11)
 * Strictly No LaTeX Math Notation.
 */

(function () {
  'use strict';

  // --- Sound FX Engine (Web Audio API) ---
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    }

    playTone(freq, duration, type = 'sine', gainVal = 0.15) {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn('Audio FX note:', e);
      }
    }

    click() {
      this.playTone(800, 0.05, 'triangle', 0.08);
    }

    success() {
      this.playTone(523.25, 0.12, 'sine', 0.12); // C5
      setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.12), 100); // E5
      setTimeout(() => this.playTone(783.99, 0.25, 'sine', 0.15), 200); // G5
    }

    fanfare() {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, 0.2, 'triangle', 0.15), i * 120);
      });
    }

    error() {
      this.playTone(180, 0.25, 'sawtooth', 0.1);
    }
  }

  const sfx = new SoundFX();

  // --- Dual-Canvas Graph & Ground Track Visualizer ---
  class MotionVisualizer {
    constructor(graphCanvasId, trackCanvasId) {
      this.graphCanvas = document.getElementById(graphCanvasId);
      this.trackCanvas = document.getElementById(trackCanvasId);
      this.gCtx = this.graphCanvas ? this.graphCanvas.getContext('2d') : null;
      this.tCtx = this.trackCanvas ? this.trackCanvas.getContext('2d') : null;

      // Coordinate ranges
      this.tMax = 10; // seconds
      this.xMin = -2; // meters
      this.xMax = 20; // meters

      // Playback state
      this.currentTime = 0;
      this.isPlaying = false;
      this.playbackSpeed = 1.0;
      this.animFrameId = null;
      this.lastFrameTimestamp = null;

      // Journey segments
      this.segments = [];
      this.runners = [];

      // Interactive plotting mode (Level 6)
      this.isPlottingMode = false;
      this.plottedPoints = [];
      this.maxPlottedPoints = 4;

      // Slope triangle overlay
      this.slopeTriangle = null; // { p1: {t, x}, p2: {t, x}, labelRise, labelRun }

      // Highlight line beacon (e.g. for "Look at 3 seconds")
      this.highlightTime = null;

      this.padding = { left: 45, right: 20, top: 25, bottom: 35 };

      this.initEvents();
      this.resizeCanvases();
      window.addEventListener('resize', () => this.resizeCanvases());
    }

    resizeCanvases() {
      if (!this.graphCanvas || !this.trackCanvas) return;

      const dpr = window.devicePixelRatio || 1;
      const gRect = this.graphCanvas.getBoundingClientRect();
      const tRect = this.trackCanvas.getBoundingClientRect();

      this.graphCanvas.width = Math.floor(gRect.width * dpr);
      this.graphCanvas.height = Math.floor(gRect.height * dpr);
      this.gCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.gWidth = gRect.width;
      this.gHeight = gRect.height;

      this.trackCanvas.width = Math.floor(tRect.width * dpr);
      this.trackCanvas.height = Math.floor(tRect.height * dpr);
      this.tCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.tWidth = tRect.width;
      this.tHeight = tRect.height;

      this.render();
    }

    initEvents() {
      if (!this.graphCanvas) return;

      const loupe = document.getElementById('loupeOverlay');
      const loupeCoord = document.getElementById('loupeCoordText');

      this.graphCanvas.addEventListener('mousemove', (e) => {
        const rect = this.graphCanvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (
          mx >= this.padding.left &&
          mx <= this.gWidth - this.padding.right &&
          my >= this.padding.top &&
          my <= this.gHeight - this.padding.bottom
        ) {
          const t = this.pixelToTime(mx);
          const x = this.pixelToPos(my);

          if (loupe && loupeCoord) {
            loupe.classList.remove('hidden');
            const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
            loupe.style.left = `${mx / zoom}px`;
            loupe.style.top = `${my / zoom}px`;
            loupeCoord.textContent = `${t.toFixed(1)}s, ${x.toFixed(1)}m`;
          }
        } else if (loupe) {
          loupe.classList.add('hidden');
        }
      });

      this.graphCanvas.addEventListener('mouseleave', () => {
        if (loupe) loupe.classList.add('hidden');
      });

      // Interactive Click Plotting (Level 6) OR Accessible Click-to-Scrub (Levels 1-5)
      this.graphCanvas.addEventListener('click', (e) => {
        const rect = this.graphCanvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (
          mx >= this.padding.left &&
          mx <= this.gWidth - this.padding.right &&
          my >= this.padding.top &&
          my <= this.gHeight - this.padding.bottom
        ) {
          const rawT = this.pixelToTime(mx);
          const rawX = this.pixelToPos(my);

          if (this.isPlottingMode) {
            const snappedT = Math.round(rawT);
            const snappedX = Math.round(rawX);

            const existingIdx = this.plottedPoints.findIndex((p) => p.t === snappedT);
            if (existingIdx >= 0) {
              this.plottedPoints[existingIdx].x = snappedX;
            } else if (this.plottedPoints.length < this.maxPlottedPoints) {
              this.plottedPoints.push({ t: snappedT, x: snappedX });
              this.plottedPoints.sort((a, b) => a.t - b.t);
            }
            sfx.click();
            this.render();

            if (window.studioApp && window.studioApp.onPointPlotted) {
              window.studioApp.onPointPlotted(this.plottedPoints);
            }
          } else {
            // Accessible Click-to-Scrub: snap to nearest integer if within 0.2s, else 0.1s
            const nearestInt = Math.round(rawT);
            const finalT = Math.abs(rawT - nearestInt) < 0.2 ? nearestInt : Math.round(rawT * 10) / 10;
            this.pause();
            this.setTime(Math.max(0, Math.min(this.tMax, finalT)));
            sfx.click();
          }
        }
      });
    }

    setJourneySegments(segments) {
      this.segments = segments;
      this.runners = [];
      this.isPlottingMode = false;
      this.slopeTriangle = null;
      this.highlightTime = null;
      this.currentTime = 0;
      this.render();
      this.updateTelemetry();
    }

    setMultiRunners(runnersList) {
      this.runners = runnersList;
      this.segments = [];
      this.isPlottingMode = false;
      this.slopeTriangle = null;
      this.highlightTime = null;
      this.currentTime = 0;
      this.render();
      this.updateTelemetry();
    }

    setSlopeTriangle(p1, p2, labelRise, labelRun) {
      this.slopeTriangle = { p1, p2, labelRise, labelRun };
      this.render();
    }

    clearSlopeTriangle() {
      this.slopeTriangle = null;
      this.render();
    }

    setHighlightTime(t) {
      this.highlightTime = t;
      this.render();
    }

    enablePlottingMode(initialPoints = [], maxPoints = 4) {
      this.isPlottingMode = true;
      this.plottedPoints = [...initialPoints];
      this.maxPlottedPoints = maxPoints;
      this.segments = [];
      this.runners = [];
      this.slopeTriangle = null;
      this.highlightTime = null;
      this.currentTime = 0;
      this.render();
      this.updateTelemetry();
    }

    // Coordinate conversions
    timeToPixel(t) {
      const plotW = this.gWidth - this.padding.left - this.padding.right;
      return this.padding.left + (t / this.tMax) * plotW;
    }

    pixelToTime(px) {
      const plotW = this.gWidth - this.padding.left - this.padding.right;
      const val = ((px - this.padding.left) / plotW) * this.tMax;
      return Math.max(0, Math.min(this.tMax, val));
    }

    posToPixel(x) {
      const plotH = this.gHeight - this.padding.top - this.padding.bottom;
      const norm = (x - this.xMin) / (this.xMax - this.xMin);
      return this.gHeight - this.padding.bottom - norm * plotH;
    }

    pixelToPos(py) {
      const plotH = this.gHeight - this.padding.top - this.padding.bottom;
      const norm = (this.gHeight - this.padding.bottom - py) / plotH;
      const val = this.xMin + norm * (this.xMax - this.xMin);
      return Math.max(this.xMin, Math.min(this.xMax, val));
    }

    trackPosToPixel(x) {
      const tPad = 40;
      const trackW = this.tWidth - tPad * 2;
      const norm = (x - this.xMin) / (this.xMax - this.xMin);
      return tPad + norm * trackW;
    }

    getStateAtTime(t, segs = this.segments) {
      if (!segs || segs.length === 0) return { x: 0, v: 0 };

      if (t <= segs[0].t0) {
        const dur = segs[0].t1 - segs[0].t0;
        return { x: segs[0].x0, v: dur > 0 ? (segs[0].x1 - segs[0].x0) / dur : 0 };
      }

      for (const s of segs) {
        if (t >= s.t0 && t <= s.t1) {
          const duration = s.t1 - s.t0;
          const dt = t - s.t0;
          const v = duration > 0 ? (s.x1 - s.x0) / duration : 0;
          return { x: s.x0 + v * dt, v };
        }
      }

      const last = segs[segs.length - 1];
      return { x: last.x1, v: 0 };
    }

    setTime(t) {
      this.currentTime = Math.max(0, Math.min(this.tMax, t));
      this.render();
      this.updateTelemetry();
    }

    play() {
      if (this.isPlaying) return;
      this.isPlaying = true;
      if (this.currentTime >= this.tMax) {
        this.currentTime = 0;
      }
      this.lastFrameTimestamp = performance.now();
      this.tick();
      this.updatePlayBtnUI();
    }

    pause() {
      this.isPlaying = false;
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      this.updatePlayBtnUI();
    }

    togglePlay() {
      if (this.isPlaying) this.pause();
      else this.play();
    }

    reset() {
      this.pause();
      this.setTime(0);
    }

    tick() {
      if (!this.isPlaying) return;

      const now = performance.now();
      const dtSec = (now - this.lastFrameTimestamp) / 1000;
      this.lastFrameTimestamp = now;

      this.currentTime += dtSec * this.playbackSpeed;

      if (this.currentTime >= this.tMax) {
        this.currentTime = this.tMax;
        this.pause();
        this.render();
        this.updateTelemetry();
        return;
      }

      this.render();
      this.updateTelemetry();
      this.animFrameId = requestAnimationFrame(() => this.tick());
    }

    updatePlayBtnUI() {
      const icon = document.getElementById('playIcon');
      const label = document.getElementById('playLabel');
      if (icon && label) {
        if (this.isPlaying) {
          icon.textContent = '⏸';
          label.textContent = 'Pause';
        } else {
          icon.textContent = '▶';
          label.textContent = 'Play Car';
        }
      }
    }

    updateTelemetry() {
      const state = this.getStateAtTime(this.currentTime);

      const timeSlider = document.getElementById('timeScrubber');
      const timeDisp = document.getElementById('timeDisplay');
      const posDisp = document.getElementById('telemetryPos');
      const velDisp = document.getElementById('telemetryVel');

      if (timeSlider) timeSlider.value = this.currentTime.toFixed(1);
      if (timeDisp) timeDisp.textContent = `${this.currentTime.toFixed(1)}s`;
      if (posDisp) posDisp.textContent = `${state.x.toFixed(1)} m`;
      if (velDisp) {
        velDisp.textContent = `${Math.abs(state.v).toFixed(1)} m/s`;
      }

      // Sync active styling on time preset chips
      document.querySelectorAll('.time-chip').forEach((chip) => {
        const val = parseFloat(chip.dataset.time);
        if (Math.abs(val - this.currentTime) < 0.15) {
          chip.classList.add('active');
        } else {
          chip.classList.remove('active');
        }
      });
    }

    // --- RENDER METHODS ---
    render() {
      this.drawGraph();
      this.drawTrack();
    }

    getContrastColor(color, isDark) {
      if (isDark) return color || '#ccff00';
      if (!color) return '#15803d';
      const c = color.toLowerCase();
      if (c === '#ccff00' || c === '#a3e635' || c.includes('lime')) return '#15803d';
      if (c === '#facc15' || c.includes('yellow') || c.includes('amber')) return '#b45309';
      if (c === '#38bdf8' || c.includes('cyan') || c.includes('sky')) return '#0369a1';
      if (c === '#f43f5e' || c.includes('rose') || c.includes('red')) return '#be123c';
      if (c === '#10b981' || c.includes('emerald')) return '#15803d';
      return color;
    }

    drawGraph() {
      if (!this.gCtx) return;
      const ctx = this.gCtx;
      const w = this.gWidth;
      const h = this.gHeight;
      const pad = this.padding;

      ctx.clearRect(0, 0, w, h);

      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#040804' : '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // Grid Lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? 'rgba(163, 230, 53, 0.09)' : 'rgba(148, 163, 184, 0.28)';

      // Vertical Time Lines (every 1s)
      for (let t = 0; t <= this.tMax; t += 1) {
        const x = this.timeToPixel(t);
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, h - pad.bottom);
        ctx.stroke();

        if (t % 2 === 0) {
          ctx.fillStyle = t === 0 ? (isDark ? '#ccff00' : '#15803d') : (isDark ? '#f1f5f9' : '#0f172a');
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${t}s`, x, h - pad.bottom + 14);
        }
      }

      // Subtle 1-meter intermediate grid lines
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = isDark ? 'rgba(163, 230, 53, 0.04)' : 'rgba(148, 163, 184, 0.15)';
      for (let xPos = 1; xPos <= this.xMax; xPos += 2) {
        const y = this.posToPixel(xPos);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(w - pad.right, y);
        ctx.stroke();
      }

      // Horizontal Position Lines (every 2m: 0m, 2m, 4m, 6m, 8m, 10m, 12m, 14m, 16m, 18m, 20m)
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? 'rgba(163, 230, 53, 0.12)' : 'rgba(148, 163, 184, 0.28)';
      for (let xPos = 0; xPos <= this.xMax; xPos += 2) {
        const y = this.posToPixel(xPos);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(w - pad.right, y);
        ctx.stroke();

        // Uniformly bold and legible labels for every 2m increment
        ctx.fillStyle = xPos === 0 ? (isDark ? '#ccff00' : '#15803d') : (isDark ? '#f1f5f9' : '#0f172a');
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${xPos}m`, pad.left - 6, y + 3.5);
      }

      // Highlight Time Beacon (e.g. for question visual prompt)
      if (this.highlightTime !== null) {
        const hX = this.timeToPixel(this.highlightTime);
        ctx.fillStyle = isDark ? 'rgba(204, 255, 0, 0.12)' : 'rgba(21, 128, 61, 0.14)';
        ctx.fillRect(hX - 15, pad.top, 30, h - pad.top - pad.bottom);

        ctx.lineWidth = 2;
        ctx.strokeStyle = isDark ? '#ccff00' : '#15803d';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hX, pad.top);
        ctx.lineTo(hX, h - pad.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Main Axes
      ctx.lineWidth = 2;
      ctx.strokeStyle = isDark ? 'rgba(204, 255, 0, 0.5)' : '#15803d';

      // Horizontal axis: x = 0m
      const zeroY = this.posToPixel(0);
      ctx.beginPath();
      ctx.moveTo(pad.left, zeroY);
      ctx.lineTo(w - pad.right, zeroY);
      ctx.stroke();

      // Vertical axis: t = 0s
      const zeroX = this.timeToPixel(0);
      ctx.beginPath();
      ctx.moveTo(zeroX, pad.top);
      ctx.lineTo(zeroX, h - pad.bottom);
      ctx.stroke();

      // Friendly Big Axis Labels
      ctx.fillStyle = isDark ? '#ccff00' : '#15803d';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Time (seconds)', pad.left + (w - pad.left - pad.right) / 2, h - 5);

      ctx.save();
      ctx.translate(14, pad.top + (h - pad.top - pad.bottom) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Car Position (meters)', 0, 0);
      ctx.restore();

      // Multi-Runners (Level 2)
      if (this.runners && this.runners.length > 0) {
        this.runners.forEach((r) => {
          const rColor = this.getContrastColor(r.color, isDark);
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = rColor;
          ctx.beginPath();
          r.segments.forEach((seg, idx) => {
            const px0 = this.timeToPixel(seg.t0);
            const py0 = this.posToPixel(seg.x0);
            const px1 = this.timeToPixel(seg.t1);
            const py1 = this.posToPixel(seg.x1);
            if (idx === 0) ctx.moveTo(px0, py0);
            ctx.lineTo(px1, py1);
          });
          ctx.stroke();

          if (r.segments.length > 0) {
            const lastSeg = r.segments[r.segments.length - 1];
            const endX = this.timeToPixel(lastSeg.t1);
            const endY = this.posToPixel(lastSeg.x1);
            ctx.fillStyle = rColor;
            ctx.font = 'bold 11px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(` ${r.name}`, endX, endY - 4);
          }
        });
      }

      // Main Segments
      if (this.segments && this.segments.length > 0) {
        this.segments.forEach((seg) => {
          const x0 = this.timeToPixel(seg.t0);
          const y0 = this.posToPixel(seg.x0);
          const x1 = this.timeToPixel(seg.t1);
          const y1 = this.posToPixel(seg.x1);

          const segColor = this.getContrastColor(seg.color || '#ccff00', isDark);

          ctx.shadowColor = isDark ? segColor : 'transparent';
          ctx.shadowBlur = isDark ? 8 : 0;
          ctx.lineWidth = 4;
          ctx.strokeStyle = segColor;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // End nodes (Solid circle with colored border for clean contrast)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x0, y0, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = segColor;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x1, y1, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = segColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

      // Interactive Plotted Points (Level 6)
      if (this.isPlottingMode) {
        const plotStrokeColor = isDark ? '#facc15' : '#b45309';
        if (this.plottedPoints.length >= 2) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = plotStrokeColor;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          this.plottedPoints.forEach((p, idx) => {
            const px = this.timeToPixel(p.t);
            const py = this.posToPixel(p.x);
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        }

        this.plottedPoints.forEach((p) => {
          const px = this.timeToPixel(p.t);
          const py = this.posToPixel(p.x);

          ctx.fillStyle = plotStrokeColor;
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isDark ? '#040804' : '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`(${p.t}s, ${p.x}m)`, px, py - 10);
        });
      }

      // Slope Triangle Overlay (Level 3)
      if (this.slopeTriangle) {
        const { p1, p2, labelRise, labelRun } = this.slopeTriangle;
        const x1 = this.timeToPixel(p1.t);
        const y1 = this.posToPixel(p1.x);
        const x2 = this.timeToPixel(p2.t);
        const y2 = this.posToPixel(p2.x);
        const cornerX = x2;
        const cornerY = y1;

        const runColor = isDark ? '#38bdf8' : '#0369a1';
        const riseColor = isDark ? '#f43f5e' : '#be123c';

        // Run (across)
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = runColor;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(cornerX, cornerY);
        ctx.stroke();

        // Rise (up)
        ctx.strokeStyle = riseColor;
        ctx.beginPath();
        ctx.moveTo(cornerX, cornerY);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.fillStyle = runColor;
        ctx.textAlign = 'center';
        ctx.fillText(`Run = ${labelRun}`, (x1 + cornerX) / 2, cornerY + 16);

        ctx.fillStyle = riseColor;
        ctx.textAlign = 'left';
        ctx.fillText(` Rise = ${labelRise}`, cornerX + 8, (cornerY + y2) / 2);
      }

      // Time Cursor (Active Playback / Scrubber)
      const curX = this.timeToPixel(this.currentTime);
      ctx.lineWidth = 2;
      ctx.strokeStyle = isDark ? '#facc15' : '#b45309';
      ctx.beginPath();
      ctx.moveTo(curX, pad.top);
      ctx.lineTo(curX, h - pad.bottom);
      ctx.stroke();

      const activeState = this.getStateAtTime(this.currentTime);
      const curY = this.posToPixel(activeState.x);

      const dotColor = isDark ? '#ccff00' : '#15803d';
      ctx.fillStyle = dotColor;
      ctx.shadowColor = isDark ? '#ccff00' : 'transparent';
      ctx.shadowBlur = isDark ? 10 : 0;
      ctx.beginPath();
      ctx.arc(curX, curY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isDark ? '#040804' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    drawTrack() {
      if (!this.tCtx) return;
      const ctx = this.tCtx;
      const w = this.tWidth;
      const h = this.tHeight;

      ctx.clearRect(0, 0, w, h);

      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#040804' : '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      const trackY = Math.floor(h * 0.58);
      const tPad = 40;

      // Track Lane
      ctx.fillStyle = isDark ? 'rgba(163, 230, 53, 0.05)' : 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(tPad - 15, trackY - 22, w - (tPad - 15) * 2, 44);

      // Track Baseline
      ctx.lineWidth = 3;
      ctx.strokeStyle = isDark ? 'rgba(204, 255, 0, 0.4)' : '#15803d';
      ctx.beginPath();
      ctx.moveTo(tPad, trackY);
      ctx.lineTo(w - tPad, trackY);
      ctx.stroke();

      // Number Line Markers (every 2m: 0m, 2m, 4m, 6m, 8m, 10m, 12m, 14m, 16m, 18m, 20m)
      for (let xPos = 0; xPos <= this.xMax; xPos += 2) {
        const px = this.trackPosToPixel(xPos);

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = xPos === 0 ? (isDark ? '#ccff00' : '#15803d') : (isDark ? '#64748b' : '#94a3b8');
        ctx.beginPath();
        ctx.moveTo(px, trackY - 6);
        ctx.lineTo(px, trackY + 6);
        ctx.stroke();

        ctx.fillStyle = xPos === 0 ? (isDark ? '#ccff00' : '#15803d') : (isDark ? '#f1f5f9' : '#0f172a');
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${xPos}m`, px, trackY + 22);
      }

      // Start Flag at 0m
      const originPx = this.trackPosToPixel(0);
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏁', originPx, trackY - 14);

      // Multi-runner rendering (Level 2)
      if (this.runners && this.runners.length > 0) {
        const laneOffsets = [-14, 14];
        this.runners.forEach((r, idx) => {
          const rColor = this.getContrastColor(r.color, isDark);
          const rState = this.getStateAtTime(this.currentTime, r.segments);
          const rPx = this.trackPosToPixel(rState.x);
          const rY = trackY + laneOffsets[idx % 2];

          ctx.fillStyle = rColor;
          ctx.beginPath();
          ctx.roundRect(rPx - 12, rY - 8, 24, 12, 3);
          ctx.fill();

          ctx.fillStyle = isDark ? '#040804' : '#ffffff';
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(r.name.slice(0, 1), rPx, rY + 1);
        });
        return;
      }

      // Single Car Position
      let activePos = 0;
      let activeVel = 0;

      if (this.isPlottingMode && this.plottedPoints.length >= 2) {
        const segs = [];
        for (let i = 0; i < this.plottedPoints.length - 1; i++) {
          segs.push({
            t0: this.plottedPoints[i].t,
            x0: this.plottedPoints[i].x,
            t1: this.plottedPoints[i + 1].t,
            x1: this.plottedPoints[i + 1].x
          });
        }
        const s = this.getStateAtTime(this.currentTime, segs);
        activePos = s.x;
        activeVel = s.v;
      } else {
        const s = this.getStateAtTime(this.currentTime);
        activePos = s.x;
        activeVel = s.v;
      }

      const carPx = this.trackPosToPixel(activePos);

      // Velocity direction arrow
      if (Math.abs(activeVel) > 0.05) {
        const arrowLen = Math.max(-35, Math.min(35, activeVel * 5));
        const arrowColor = activeVel > 0 ? (isDark ? '#38bdf8' : '#0369a1') : (isDark ? '#f43f5e' : '#be123c');
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = arrowColor;
        ctx.beginPath();
        ctx.moveTo(carPx, trackY - 26);
        ctx.lineTo(carPx + arrowLen, trackY - 26);
        ctx.stroke();

        const arrowDir = activeVel > 0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(carPx + arrowLen, trackY - 26);
        ctx.lineTo(carPx + arrowLen - arrowDir * 5, trackY - 29);
        ctx.lineTo(carPx + arrowLen - arrowDir * 5, trackY - 23);
        ctx.fillStyle = arrowColor;
        ctx.fill();
      }

      // Animated Cyber Car Sprite
      ctx.save();
      ctx.translate(carPx, trackY - 2);

      const carBorder = isDark ? '#ccff00' : '#15803d';
      ctx.fillStyle = isDark ? '#1e293b' : '#334155';
      ctx.strokeStyle = carBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-15, -12, 30, 14, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = carBorder;
      ctx.fillRect(-6, -10, 12, 5);

      ctx.fillStyle = isDark ? '#0f172a' : '#0f172a';
      ctx.fillRect(-13, 0, 7, 5);
      ctx.fillRect(6, 0, 7, 5);

      ctx.restore();

      // Clear Floating Badge above Car
      ctx.fillStyle = isDark ? '#ccff00' : '#15803d';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${activePos.toFixed(1)}m`, carPx, trackY - 32);
    }
  }

  // ==============================================================
  // ANTI-COPYING PARAMETERIZED PROBLEM VARIANTS (4,096 COMBINATIONS)
  // ==============================================================
  const L1_VARIANTS = [
    // Variant 0: 0s-3s (0m to 6m), 3s-6s (flat at 6m), 6s-10s (down to 0m)
    {
      journey: [
        { t0: 0, t1: 3, x0: 0, x1: 6, color: '#ccff00' },
        { t0: 3, t1: 6, x0: 6, x1: 6, color: '#facc15' },
        { t0: 6, t1: 10, x0: 6, x1: 0, color: '#f43f5e' }
      ],
      step0: {
        time: 3,
        correctVal: '6',
        choices: [
          { val: '0', label: 'A) 0 meters' },
          { val: '6', label: 'B) 6 meters' },
          { val: '12', label: 'C) 12 meters' }
        ]
      },
      step1: { time: 5, tRange: '3s and 6s' },
      step2: { time: 8, afterT: '6 seconds' }
    },
    // Variant 1: 0s-4s (0m to 8m), 4s-7s (flat at 8m), 7s-10s (down to 0m)
    {
      journey: [
        { t0: 0, t1: 4, x0: 0, x1: 8, color: '#ccff00' },
        { t0: 4, t1: 7, x0: 8, x1: 8, color: '#facc15' },
        { t0: 7, t1: 10, x0: 8, x1: 0, color: '#f43f5e' }
      ],
      step0: {
        time: 4,
        correctVal: '8',
        choices: [
          { val: '0', label: 'A) 0 meters' },
          { val: '8', label: 'B) 8 meters' },
          { val: '16', label: 'C) 16 meters' }
        ]
      },
      step1: { time: 6, tRange: '4s and 7s' },
      step2: { time: 8.5, afterT: '7 seconds' }
    },
    // Variant 2: 0s-2s (0m to 8m), 2s-5s (flat at 8m), 5s-10s (down to 0m)
    {
      journey: [
        { t0: 0, t1: 2, x0: 0, x1: 8, color: '#ccff00' },
        { t0: 2, t1: 5, x0: 8, x1: 8, color: '#facc15' },
        { t0: 5, t1: 10, x0: 8, x1: 0, color: '#f43f5e' }
      ],
      step0: {
        time: 2,
        correctVal: '8',
        choices: [
          { val: '0', label: 'A) 0 meters' },
          { val: '8', label: 'B) 8 meters' },
          { val: '14', label: 'C) 14 meters' }
        ]
      },
      step1: { time: 4, tRange: '2s and 5s' },
      step2: { time: 7.5, afterT: '5 seconds' }
    },
    // Variant 3: 0s-3s (0m to 12m), 3s-6s (flat at 12m), 6s-10s (down to 0m)
    {
      journey: [
        { t0: 0, t1: 3, x0: 0, x1: 12, color: '#ccff00' },
        { t0: 3, t1: 6, x0: 12, x1: 12, color: '#facc15' },
        { t0: 6, t1: 10, x0: 12, x1: 0, color: '#f43f5e' }
      ],
      step0: {
        time: 3,
        correctVal: '12',
        choices: [
          { val: '0', label: 'A) 0 meters' },
          { val: '6', label: 'B) 6 meters' },
          { val: '12', label: 'C) 12 meters' }
        ]
      },
      step1: { time: 5, tRange: '3s and 6s' },
      step2: { time: 8, afterT: '6 seconds' }
    }
  ];

  const L2_VARIANTS = [
    // Variant 0: Green fast (4s to 16m), Blue slow (10s to 16m)
    {
      runners: [
        { name: 'Green Car', color: '#ccff00', segments: [{ t0: 0, t1: 4, x0: 0, x1: 16 }, { t0: 4, t1: 10, x0: 16, x1: 16 }] },
        { name: 'Blue Car', color: '#38bdf8', segments: [{ t0: 0, t1: 10, x0: 0, x1: 16 }] }
      ],
      finishDist: 16,
      steeperColor: 'green',
      winnerColor: 'green',
      car1Name: 'Green line',
      car2Name: 'Blue line',
      car1Option: 'A) Green line (steeper slope — covers distance fast)',
      car2Option: 'B) Blue line (gentle slope — covers distance slowly)',
      raceWinnerChoiceA: 'A) Green car (wins in 4 seconds!)',
      raceWinnerChoiceB: 'B) Blue car (takes 10 seconds)'
    },
    // Variant 1: Blue fast (3s to 18m), Green slow (9s to 18m)
    {
      runners: [
        { name: 'Green Car', color: '#ccff00', segments: [{ t0: 0, t1: 9, x0: 0, x1: 18 }, { t0: 9, t1: 10, x0: 18, x1: 18 }] },
        { name: 'Blue Car', color: '#38bdf8', segments: [{ t0: 0, t1: 3, x0: 0, x1: 18 }, { t0: 3, t1: 10, x0: 18, x1: 18 }] }
      ],
      finishDist: 18,
      steeperColor: 'blue',
      winnerColor: 'blue',
      car1Name: 'Green line',
      car2Name: 'Blue line',
      car1Option: 'A) Green line (gentle slope — covers distance slowly)',
      car2Option: 'B) Blue line (steeper slope — covers distance fast)',
      raceWinnerChoiceA: 'A) Green car (takes 9 seconds)',
      raceWinnerChoiceB: 'B) Blue car (wins in 3 seconds!)'
    },
    // Variant 2: Green fast (5s to 20m), Blue slow (10s to 20m)
    {
      runners: [
        { name: 'Green Car', color: '#ccff00', segments: [{ t0: 0, t1: 5, x0: 0, x1: 20 }, { t0: 5, t1: 10, x0: 20, x1: 20 }] },
        { name: 'Blue Car', color: '#38bdf8', segments: [{ t0: 0, t1: 10, x0: 0, x1: 20 }] }
      ],
      finishDist: 20,
      steeperColor: 'green',
      winnerColor: 'green',
      car1Name: 'Green line',
      car2Name: 'Blue line',
      car1Option: 'A) Green line (steeper slope — covers distance fast)',
      car2Option: 'B) Blue line (gentle slope — covers distance slowly)',
      raceWinnerChoiceA: 'A) Green car (wins in 5 seconds!)',
      raceWinnerChoiceB: 'B) Blue car (takes 10 seconds)'
    },
    // Variant 3: Blue fast (2s to 14m), Green slow (7s to 14m)
    {
      runners: [
        { name: 'Green Car', color: '#ccff00', segments: [{ t0: 0, t1: 7, x0: 0, x1: 14 }, { t0: 7, t1: 10, x0: 14, x1: 14 }] },
        { name: 'Blue Car', color: '#38bdf8', segments: [{ t0: 0, t1: 2, x0: 0, x1: 14 }, { t0: 2, t1: 10, x0: 14, x1: 14 }] }
      ],
      finishDist: 14,
      steeperColor: 'blue',
      winnerColor: 'blue',
      car1Name: 'Green line',
      car2Name: 'Blue line',
      car1Option: 'A) Green line (gentle slope — covers distance slowly)',
      car2Option: 'B) Blue line (steeper slope — covers distance fast)',
      raceWinnerChoiceA: 'A) Green car (takes 7 seconds)',
      raceWinnerChoiceB: 'B) Blue car (wins in 2 seconds!)'
    }
  ];

  const L3_VARIANTS = [
    // Variant 0: Rise = 6m, Run = 2s -> 3 m/s
    {
      rise: 6,
      run: 2,
      speed: 3,
      journey: [
        { t0: 0, t1: 2, x0: 0, x1: 6, color: '#ccff00' },
        { t0: 2, t1: 10, x0: 6, x1: 6, color: '#facc15' }
      ],
      p1: { t: 0, x: 0 },
      p2: { t: 2, x: 6 }
    },
    // Variant 1: Rise = 8m, Run = 2s -> 4 m/s
    {
      rise: 8,
      run: 2,
      speed: 4,
      journey: [
        { t0: 0, t1: 2, x0: 0, x1: 8, color: '#ccff00' },
        { t0: 2, t1: 10, x0: 8, x1: 8, color: '#facc15' }
      ],
      p1: { t: 0, x: 0 },
      p2: { t: 2, x: 8 }
    },
    // Variant 2: Rise = 12m, Run = 3s -> 4 m/s
    {
      rise: 12,
      run: 3,
      speed: 4,
      journey: [
        { t0: 0, t1: 3, x0: 0, x1: 12, color: '#ccff00' },
        { t0: 3, t1: 10, x0: 12, x1: 12, color: '#facc15' }
      ],
      p1: { t: 0, x: 0 },
      p2: { t: 3, x: 12 }
    },
    // Variant 3: Rise = 10m, Run = 2s -> 5 m/s
    {
      rise: 10,
      run: 2,
      speed: 5,
      journey: [
        { t0: 0, t1: 2, x0: 0, x1: 10, color: '#ccff00' },
        { t0: 2, t1: 10, x0: 10, x1: 10, color: '#facc15' }
      ],
      p1: { t: 0, x: 0 },
      p2: { t: 2, x: 10 }
    }
  ];

  const L4_VARIANTS = [
    // Variant 0: vel = -2 m/s (6m down in 3s), speed = 2 m/s. Comp: +2 vs -5 -> 5. Check: -8 -> 8.
    {
      journey: [
        { t0: 0, t1: 3, x0: 0, x1: 6, color: '#ccff00' },
        { t0: 3, t1: 5, x0: 6, x1: 6, color: '#facc15' },
        { t0: 5, t1: 8, x0: 6, x1: 0, color: '#f43f5e' }
      ],
      tBackStart: 5,
      tBackEnd: 8,
      xBackStart: 6,
      xBackEnd: 0,
      backDuration: 3,
      negVel: -2,
      posSpeed: 2,
      compCarA: '+2 m/s',
      compCarB: '-5 m/s',
      compWinner: 'B',
      compWinnerOption: 'A) Car B (speed of 5 m/s is faster!)',
      compLoserOption: 'B) Car A (speed of 2 m/s)',
      quickNeg: -8,
      quickPos: 8
    },
    // Variant 1: vel = -3 m/s (9m down in 3s), speed = 3 m/s. Comp: +3 vs -6 -> 6. Check: -7 -> 7.
    {
      journey: [
        { t0: 0, t1: 3, x0: 0, x1: 9, color: '#ccff00' },
        { t0: 3, t1: 5, x0: 9, x1: 9, color: '#facc15' },
        { t0: 5, t1: 8, x0: 9, x1: 0, color: '#f43f5e' }
      ],
      tBackStart: 5,
      tBackEnd: 8,
      xBackStart: 9,
      xBackEnd: 0,
      backDuration: 3,
      negVel: -3,
      posSpeed: 3,
      compCarA: '+3 m/s',
      compCarB: '-6 m/s',
      compWinner: 'B',
      compWinnerOption: 'A) Car B (speed of 6 m/s is faster!)',
      compLoserOption: 'B) Car A (speed of 3 m/s)',
      quickNeg: -7,
      quickPos: 7
    },
    // Variant 2: vel = -4 m/s (8m down in 2s), speed = 4 m/s. Comp: +4 vs -7 -> 7. Check: -9 -> 9.
    {
      journey: [
        { t0: 0, t1: 3, x0: 0, x1: 8, color: '#ccff00' },
        { t0: 3, t1: 6, x0: 8, x1: 8, color: '#facc15' },
        { t0: 6, t1: 8, x0: 8, x1: 0, color: '#f43f5e' }
      ],
      tBackStart: 6,
      tBackEnd: 8,
      xBackStart: 8,
      xBackEnd: 0,
      backDuration: 2,
      negVel: -4,
      posSpeed: 4,
      compCarA: '+4 m/s',
      compCarB: '-7 m/s',
      compWinner: 'B',
      compWinnerOption: 'A) Car B (speed of 7 m/s is faster!)',
      compLoserOption: 'B) Car A (speed of 4 m/s)',
      quickNeg: -9,
      quickPos: 9
    },
    // Variant 3: vel = -2 m/s (8m down in 4s), speed = 2 m/s. Comp: +1 vs -4 -> 4. Check: -6 -> 6.
    {
      journey: [
        { t0: 0, t1: 2, x0: 0, x1: 8, color: '#ccff00' },
        { t0: 2, t1: 5, x0: 8, x1: 8, color: '#facc15' },
        { t0: 5, t1: 9, x0: 8, x1: 0, color: '#f43f5e' }
      ],
      tBackStart: 5,
      tBackEnd: 9,
      xBackStart: 8,
      xBackEnd: 0,
      backDuration: 4,
      negVel: -2,
      posSpeed: 2,
      compCarA: '+1 m/s',
      compCarB: '-4 m/s',
      compWinner: 'B',
      compWinnerOption: 'A) Car B (speed of 4 m/s is faster!)',
      compLoserOption: 'B) Car A (speed of 1 m/s)',
      quickNeg: -6,
      quickPos: 6
    }
  ];

  const L5_VARIANTS = [
    // Variant 0: 0s-2s (0m to 6m), 2s-5s (at 6m), 5s-8s (down to 0m)
    {
      journey: [
        { t0: 0, t1: 2, x0: 0, x1: 6, color: '#ccff00' },
        { t0: 2, t1: 5, x0: 6, x1: 6, color: '#facc15' },
        { t0: 5, t1: 8, x0: 6, x1: 0, color: '#f43f5e' }
      ],
      rows: [
        { time: 0, expectedPos: 0, label: '0s (Start)' },
        { time: 2, expectedPos: 6, label: '2 seconds' },
        { time: 5, expectedPos: 6, label: '5 seconds' },
        { time: 8, expectedPos: 0, label: '8 seconds' }
      ]
    },
    // Variant 1: 0s-3s (0m to 9m), 3s-6s (at 9m), 6s-10s (down to 0m)
    {
      journey: [
        { t0: 0, t1: 3, x0: 0, x1: 9, color: '#ccff00' },
        { t0: 3, t1: 6, x0: 9, x1: 9, color: '#facc15' },
        { t0: 6, t1: 10, x0: 9, x1: 0, color: '#f43f5e' }
      ],
      rows: [
        { time: 0, expectedPos: 0, label: '0s (Start)' },
        { time: 3, expectedPos: 9, label: '3 seconds' },
        { time: 6, expectedPos: 9, label: '6 seconds' },
        { time: 10, expectedPos: 0, label: '10 seconds' }
      ]
    },
    // Variant 2: 0s-2s (0m to 8m), 2s-6s (at 8m), 6s-9s (down to 0m)
    {
      journey: [
        { t0: 0, t1: 2, x0: 0, x1: 8, color: '#ccff00' },
        { t0: 2, t1: 6, x0: 8, x1: 8, color: '#facc15' },
        { t0: 6, t1: 9, x0: 8, x1: 0, color: '#f43f5e' }
      ],
      rows: [
        { time: 0, expectedPos: 0, label: '0s (Start)' },
        { time: 2, expectedPos: 8, label: '2 seconds' },
        { time: 6, expectedPos: 8, label: '6 seconds' },
        { time: 9, expectedPos: 0, label: '9 seconds' }
      ]
    },
    // Variant 3: 0s-4s (0m to 8m), 4s-7s (at 8m), 7s-10s (down to 0m)
    {
      journey: [
        { t0: 0, t1: 4, x0: 0, x1: 8, color: '#ccff00' },
        { t0: 4, t1: 7, x0: 8, x1: 8, color: '#facc15' },
        { t0: 7, t1: 10, x0: 8, x1: 0, color: '#f43f5e' }
      ],
      rows: [
        { time: 0, expectedPos: 0, label: '0s (Start)' },
        { time: 4, expectedPos: 8, label: '4 seconds' },
        { time: 7, expectedPos: 8, label: '7 seconds' },
        { time: 10, expectedPos: 0, label: '10 seconds' }
      ]
    }
  ];

  const L6_VARIANTS = [
    // Variant 0: (0s, 0m), (3s, 9m), (6s, 9m), (10s, 0m)
    {
      points: [
        { t: 0, x: 0 },
        { t: 3, x: 9 },
        { t: 6, x: 9 },
        { t: 10, x: 0 }
      ]
    },
    // Variant 1: (0s, 0m), (2s, 8m), (5s, 8m), (9s, 0m)
    {
      points: [
        { t: 0, x: 0 },
        { t: 2, x: 8 },
        { t: 5, x: 8 },
        { t: 9, x: 0 }
      ]
    },
    // Variant 2: (0s, 0m), (4s, 8m), (7s, 8m), (10s, 0m)
    {
      points: [
        { t: 0, x: 0 },
        { t: 4, x: 8 },
        { t: 7, x: 8 },
        { t: 10, x: 0 }
      ]
    },
    // Variant 3: (0s, 0m), (3s, 6m), (6s, 6m), (8s, 0m)
    {
      points: [
        { t: 0, x: 0 },
        { t: 3, x: 6 },
        { t: 6, x: 6 },
        { t: 8, x: 0 }
      ]
    }
  ];

  // --- STUDIO ENGINE WITH LOW FLOOR HIGH CEILING PROGRESSION ---
  class StudioEngine {
    constructor() {
      this.visualizer = null;
      this.currentLevelId = 1;
      this.currentStep = 0;

      // 100 Points total across 6 levels
      this.levelScores = {
        m1: 0, // Level 1 (15 pts: 3 steps @ 5 pts)
        m2: 0, // Level 2 (15 pts: 3 steps @ 5 pts)
        m3: 0, // Level 3 (20 pts: 3 steps: 6, 7, 7 pts)
        m4: 0, // Level 4 (15 pts: 3 steps @ 5 pts)
        m5: 0, // Level 5 (15 pts: 4 rows + check)
        m6: 0  // Level 6 (20 pts: 4 points plot + drive)
      };

      this.completedSteps = {};

      // Anti-copying deterministic seed per student
      this.studentSeed = this.initSeed();

      // Sandbox custom segments
      this.sandboxSegments = [
        { t0: 0, t1: 3, x0: 0, x1: 9, color: '#ccff00' },
        { t0: 3, t1: 6, x0: 9, x1: 9, color: '#facc15' },
        { t0: 6, t1: 10, x0: 9, x1: 0, color: '#f43f5e' }
      ];

      this.initVisualizer();
      this.initTabs();
      this.initControls();

      // Check if guest state exists in local storage
      const guestStateRaw = localStorage.getItem('pvt_studio_guest_state');
      if (guestStateRaw) {
        try {
          const guestState = JSON.parse(guestStateRaw);
          if (guestState) this.restoreSavedState(guestState);
        } catch (e) {
          console.warn("Could not parse guest state:", e);
        }
      }

      this.loadLevel(1, 0);
    }

    initSeed() {
      if (window.studioAuth && window.studioAuth.studentId) {
        return this.hashString(window.studioAuth.studentId);
      }
      const savedSeed = localStorage.getItem('pvt_studio_guest_seed');
      if (savedSeed) {
        return parseInt(savedSeed, 10) || 12345;
      }
      const newSeed = Math.floor(10000 + Math.random() * 90000);
      localStorage.setItem('pvt_studio_guest_seed', newSeed.toString());
      return newSeed;
    }

    hashString(str) {
      let hash = 2166136261;
      for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return Math.abs(hash);
    }

    getVariant(levelIndex, totalVariants = 4) {
      const primes = [17, 31, 53, 71, 89, 107, 131];
      const p = primes[levelIndex % primes.length];
      return Math.abs(Math.floor(this.studentSeed / p) + levelIndex) % totalVariants;
    }

    initVisualizer() {
      this.visualizer = new MotionVisualizer('graphCanvas', 'trackCanvas');
      window.motionViz = this.visualizer;
    }

    initTabs() {
      const tabs = document.querySelectorAll('.nav-tab');
      tabs.forEach((btn) => {
        btn.addEventListener('click', () => {
          tabs.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');

          const targetId = btn.dataset.tab;
          document.querySelectorAll('.tab-panel').forEach((panel) => {
            panel.classList.add('hidden');
          });
          const activePanel = document.getElementById(targetId);
          if (activePanel) activePanel.classList.remove('hidden');

          sfx.click();

          if (targetId === 'tab-sandbox') {
            this.initSandboxVisualizer();
          } else if (targetId === 'tab-missions') {
            this.loadLevel(this.currentLevelId, this.currentStep);
          }
        });
      });
    }

    nudgeTime(delta) {
      this.visualizer.pause();
      const current = this.visualizer.currentTime;
      const nextTime = Math.max(0, Math.min(this.visualizer.tMax, Math.round((current + delta) * 10) / 10));
      this.visualizer.setTime(nextTime);
      sfx.click();
    }

    initControls() {
      // Play / Pause
      const playBtn = document.getElementById('btnPlayPause');
      if (playBtn) playBtn.onclick = () => this.visualizer.togglePlay();

      // Reset
      const resetBtn = document.getElementById('btnResetSim');
      if (resetBtn) resetBtn.onclick = () => this.visualizer.reset();

      // Scrubber
      const scrubber = document.getElementById('timeScrubber');
      if (scrubber) {
        scrubber.oninput = (e) => {
          this.visualizer.pause();
          this.visualizer.setTime(parseFloat(e.target.value));
        };
      }

      // Stepper Nudge Buttons (-1s / +1s)
      const minusBtn = document.getElementById('btnTimeMinus');
      if (minusBtn) minusBtn.onclick = () => this.nudgeTime(-1.0);

      const plusBtn = document.getElementById('btnTimePlus');
      if (plusBtn) plusBtn.onclick = () => this.nudgeTime(1.0);

      // Quick Jump Time Chips
      document.querySelectorAll('.time-chip').forEach((chip) => {
        chip.onclick = () => {
          const t = parseFloat(chip.dataset.time);
          this.visualizer.pause();
          this.visualizer.setTime(t);
          sfx.click();
        };
      });

      // Interactive Jump Buttons inside Questions
      document.addEventListener('click', (e) => {
        const jumpBtn = e.target.closest('.btn-jump-time');
        if (jumpBtn && jumpBtn.dataset.jump !== undefined) {
          const targetT = parseFloat(jumpBtn.dataset.jump);
          this.visualizer.pause();
          this.visualizer.setTime(targetT);
          sfx.click();
        }
      });

      // Accessible Keyboard Navigation
      window.addEventListener('keydown', (e) => {
        // Don't intercept when student is typing into an input field
        if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;

        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.nudgeTime(-0.5);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.nudgeTime(0.5);
        } else if (e.key === 'Home') {
          e.preventDefault();
          this.visualizer.pause();
          this.visualizer.setTime(0);
          sfx.click();
        } else if (e.key === 'End') {
          e.preventDefault();
          this.visualizer.pause();
          this.visualizer.setTime(this.visualizer.tMax);
          sfx.click();
        } else if (e.code === 'Space' && e.target.tagName !== 'BUTTON') {
          e.preventDefault();
          this.visualizer.togglePlay();
        }
      });

      // Level Selector Buttons
      document.querySelectorAll('.level-btn').forEach((btn) => {
        btn.onclick = () => {
          const lvl = parseInt(btn.dataset.level, 10);
          this.loadLevel(lvl, 0);
          sfx.click();
        };
      });

      // Sound Toggle
      const sndBtn = document.getElementById('btnSoundToggle');
      const sndIcon = document.getElementById('soundIcon');
      if (sndBtn && sndIcon) {
        sndBtn.onclick = () => {
          sfx.enabled = !sfx.enabled;
          sndIcon.textContent = sfx.enabled ? '🔊' : '🔇';
        };
      }

      // Theme Toggle & Persistence
      const themeBtn = document.getElementById('btnThemeToggle');
      const themeIcon = document.getElementById('themeIcon');
      const savedTheme = localStorage.getItem('studio_theme');
      if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        if (themeIcon) themeIcon.textContent = '🌙';
      }

      if (themeBtn && themeIcon) {
        themeBtn.onclick = () => {
          const isDark = document.documentElement.classList.toggle('dark');
          themeIcon.textContent = isDark ? '☀️' : '🌙';
          localStorage.setItem('studio_theme', isDark ? 'dark' : 'light');
          this.visualizer.resizeCanvases();
          if (this.sbVisualizer) this.sbVisualizer.resizeCanvases();
        };
      }

      // Grade Submission
      const submitBtn = document.getElementById('btnSubmitGrade');
      const submitNav = document.getElementById('btnSubmitGradeNav');
      if (submitBtn) submitBtn.onclick = () => this.submitGrade();
      if (submitNav) submitNav.onclick = () => this.submitGrade();

      // Certificate Modal
      const certBtn = document.getElementById('btnViewCert');
      const certModal = document.getElementById('certModal');
      const closeCert = document.getElementById('btnCloseCert');
      const dismissCert = document.getElementById('btnDismissCert');
      const printCert = document.getElementById('btnPrintCert');

      if (certBtn && certModal) certBtn.onclick = () => this.showCertificate();
      if (closeCert && certModal) closeCert.onclick = () => certModal.classList.add('hidden');
      if (dismissCert && certModal) dismissCert.onclick = () => certModal.classList.add('hidden');
      if (printCert) printCert.onclick = () => window.print();
    }

    updateScoreUI() {
      const total =
        this.levelScores.m1 +
        this.levelScores.m2 +
        this.levelScores.m3 +
        this.levelScores.m4 +
        this.levelScores.m5 +
        this.levelScores.m6;

      const totalDisplay = document.getElementById('totalPointsDisplay');
      const percentDisplay = document.getElementById('scorePercentDisplay');
      const circle = document.getElementById('scoreProgressCircle');
      const badge = document.getElementById('badgeCompletion');
      const encourage = document.getElementById('progressEncouragement');

      if (totalDisplay) totalDisplay.textContent = total;
      if (percentDisplay) percentDisplay.textContent = `${total}%`;

      if (circle) {
        const circumference = 125.6;
        const offset = circumference - (total / 100) * circumference;
        circle.style.strokeDashoffset = offset;
      }

      if (badge) {
        if (total >= 100) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
      }

      if (encourage) {
        if (total === 0) encourage.textContent = "Let's ease into it! Complete Level 1 to get your first points.";
        else if (total < 50) encourage.textContent = `Great start! You've got ${total} points. Keep going!`;
        else if (total < 100) encourage.textContent = `Awesome progress! ${total} points earned. You're almost at mastery!`;
        else encourage.textContent = 'Incredible job! 100% Mastered. You can submit your grade and print your certificate!';
      }

      // Update level button score badges
      document.getElementById('m1-status').textContent = `${this.levelScores.m1}/15`;
      document.getElementById('m2-status').textContent = `${this.levelScores.m2}/15`;
      document.getElementById('m3-status').textContent = `${this.levelScores.m3}/20`;
      document.getElementById('m4-status').textContent = `${this.levelScores.m4}/15`;
      document.getElementById('m5-status').textContent = `${this.levelScores.m5}/15`;
      document.getElementById('m6-status').textContent = `${this.levelScores.m6}/20`;

      // Level button classes
      document.querySelectorAll('.level-btn').forEach((btn) => {
        const lvl = parseInt(btn.dataset.level, 10);
        if (lvl === this.currentLevelId) btn.classList.add('active');
        else btn.classList.remove('active');

        const scoreKey = `m${lvl}`;
        const maxScore = lvl === 3 || lvl === 6 ? 20 : 15;
        if (this.levelScores[scoreKey] >= maxScore) btn.classList.add('completed');
        else btn.classList.remove('completed');
      });
    }

    async submitGrade() {
      const total =
        this.levelScores.m1 +
        this.levelScores.m2 +
        this.levelScores.m3 +
        this.levelScores.m4 +
        this.levelScores.m5 +
        this.levelScores.m6;

      if (window.studioAuth) {
        const result = await window.studioAuth.saveStudioGrade(total, {
          studentSeed: this.studentSeed,
          levelScores: this.levelScores,
          completedSteps: this.completedSteps,
          lastUpdated: new Date().toISOString()
        });
        if (result && result.success) {
          sfx.success();
          if (total >= 80) {
            this.showCertificate();
          } else {
            alert(`Great work! Your grade of ${total}% has been saved.`);
          }
        }
      }
    }

    showCertificate() {
      const modal = document.getElementById('certModal');
      const scoreDisp = document.getElementById('certScoreDisplay');
      const dateDisp = document.getElementById('certDateDisplay');

      const total =
        this.levelScores.m1 +
        this.levelScores.m2 +
        this.levelScores.m3 +
        this.levelScores.m4 +
        this.levelScores.m5 +
        this.levelScores.m6;

      if (scoreDisp) scoreDisp.textContent = `${total}%`;
      if (dateDisp) dateDisp.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      if (modal) {
        modal.classList.remove('hidden');
        if (total >= 100) sfx.fanfare();
        else sfx.success();
      }
    }

    onStudentLoggedIn(studentId) {
      if (!studentId) return;
      this.studentSeed = this.hashString(studentId);
    }

    restoreSavedState(savedState, savedScore) {
      if (!savedState) return;
      if (savedState.studentSeed) {
        this.studentSeed = savedState.studentSeed;
      }
      if (savedState.levelScores) {
        this.levelScores = { ...this.levelScores, ...savedState.levelScores };
      }
      if (savedState.completedSteps) {
        this.completedSteps = { ...this.completedSteps, ...savedState.completedSteps };
      }

      // Resume at saved level & step, or highest uncompleted level
      let resumeLevel = savedState.currentLevelId || this.currentLevelId || 1;
      let resumeStep = savedState.currentStep || 0;

      // If saved level is already completed, find the first incomplete level
      const maxLevels = [15, 15, 20, 15, 15, 20];
      for (let i = 1; i <= 6; i++) {
        const scoreKey = `m${i}`;
        const maxScore = maxLevels[i - 1];
        if (this.levelScores[scoreKey] < maxScore) {
          resumeLevel = i;
          resumeStep = 0;
          break;
        }
      }

      this.updateScoreUI();
      // Reload level to resume student exactly where they left off
      this.loadLevel(resumeLevel, resumeStep);
    }

    // ==============================================================
    // LEVEL LOADER & BITE-SIZED STEP RENDERER
    // ==============================================================
    loadLevel(levelId, stepIndex = 0) {
      this.currentLevelId = levelId;
      this.currentStep = stepIndex;
      this.updateScoreUI();

      const ws = document.getElementById('activeStepWorkspace');
      const modeLabel = document.getElementById('canvasModeLabel');

      if (levelId === 1) this.renderLevel1(ws, modeLabel, stepIndex);
      else if (levelId === 2) this.renderLevel2(ws, modeLabel, stepIndex);
      else if (levelId === 3) this.renderLevel3(ws, modeLabel, stepIndex);
      else if (levelId === 4) this.renderLevel4(ws, modeLabel, stepIndex);
      else if (levelId === 5) this.renderLevel5(ws, modeLabel, stepIndex);
      else if (levelId === 6) this.renderLevel6(ws, modeLabel, stepIndex);
    }

    renderStepHeader(levelNum, levelTitle, totalSteps, currentStep) {
      let dotsHtml = '';
      for (let i = 0; i < totalSteps; i++) {
        let cls = 'step-dot';
        if (i === currentStep) cls += ' active';
        else if (i < currentStep || this.completedSteps[`l${levelNum}_s${i}`]) cls += ' completed';
        dotsHtml += `<div class="${cls}"></div>`;
      }

      return `
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <span class="text-[11px] font-mono text-lime-400 font-bold uppercase tracking-wider">Level ${levelNum}</span>
            <h3 class="text-base font-bold text-white">${levelTitle}</h3>
          </div>
          <div class="flex flex-col items-end gap-1">
            <div class="step-indicator">${dotsHtml}</div>
            <span class="text-[10px] font-mono text-slate-400">Step ${currentStep + 1} of ${totalSteps}</span>
          </div>
        </div>
      `;
    }

    // Helper: Render Multiple Choice Buttons with Deterministic Seeded Permutation
    // Guarantees correct answers are distributed across positions (not always Choice A)
    renderChoiceButtons(choices, seedSalt = 0) {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      // Deterministic shift based on studentSeed and salt
      const shift = Math.abs(Math.floor((this.studentSeed || 12345) / 7) + seedSalt) % choices.length;
      const permuted = [];
      for (let i = 0; i < choices.length; i++) {
        permuted.push(choices[(i + shift) % choices.length]);
      }
      return permuted
        .map((c, idx) => {
          const letter = letters[idx] || `${idx + 1}`;
          // Strip existing leading 'A) ', 'B) ', etc. if present in text
          const cleanText = c.text.replace(/^[A-Z]\)\s*/, '');
          return `<button class="choice-card" data-val="${c.val}">${letter}) ${cleanText}</button>`;
        })
        .join('');
    }

    // --------------------------------------------------------------
    // LEVEL 1: Where is the Car? (Zero Math, Concrete Location)
    // --------------------------------------------------------------
    renderLevel1(ws, modeLabel, step) {
      modeLabel.textContent = 'Level 1: Finding Position';

      const vIndex = this.getVariant(1, L1_VARIANTS.length);
      const vData = L1_VARIANTS[vIndex];

      this.visualizer.setJourneySegments(vData.journey);

      if (step === 0) {
        this.visualizer.setHighlightTime(vData.step0.time);

        const choices = vData.step0.choices.map((c) => ({
          val: c.val,
          text: c.label
        }));
        const choicesHtml = this.renderChoiceButtons(choices, 101);

        ws.innerHTML = `
          ${this.renderStepHeader(1, 'Where is the Car?', 3, 0)}
          
          <div class="space-y-4 py-2">
            <p class="text-sm text-slate-200 leading-relaxed font-medium">
              👉 Move the timer to <strong>${vData.step0.time} seconds</strong> (look for the glowing line).
              <button class="btn-jump-time ml-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-lime-950/70 border border-lime-500/40 text-[#ccff00] hover:bg-lime-900/90 text-xs font-mono font-bold transition-all shadow-[0_0_8px_rgba(204,255,0,0.2)] active:scale-95" data-jump="${vData.step0.time}">
                ⚡ Set to ${vData.step0.time}s
              </button>
              <br><br>
              Look at the car on the ground track. <strong>What number is the car on?</strong>
            </p>

            <div class="space-y-2">
              ${choicesHtml}
            </div>

            <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

            <div id="nextArea" class="hidden pt-2">
              <button id="btnNextStep" class="btn-next-step w-full py-3 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-sm hover:bg-lime-300 transition-all flex items-center justify-center gap-2">
                <span>Awesome! Next Question</span> <span>➜</span>
              </button>
            </div>
          </div>
        `;

        const diagClues = {
          '0': 'Clue: 0m is where the car started at 0s! At 3s, the car has already driven forward. Look directly under the car wheels on the ground track.',
          '6': 'Correct!',
          '8': 'Clue: Check the number directly under the car wheels on the track line.',
          '12': 'Clue: 12m is farther ahead than where the car traveled. Look closely at the number under the car wheels.',
          '14': 'Clue: Look closely at the number under the car wheels on the ground track.',
          '16': 'Clue: Look closely at the number under the car wheels on the ground track.'
        };

        this.bindChoices(
          vData.step0.correctVal,
          5,
          'm1',
          'l1_s0',
          () => {
            this.loadLevel(1, 1);
          },
          diagClues,
          () => {
            // Retry with alternate seed variant
            this.studentSeed = (this.studentSeed + 13) % 99999;
            this.loadLevel(1, 0);
          }
        );
      } else if (step === 1) {
        this.visualizer.setHighlightTime(vData.step1.time);

        const choices = [
          { val: 'stopped', text: 'The car is parked / stopped (not moving)' },
          { val: 'fast', text: 'The car is driving super fast' },
          { val: 'backward', text: 'The car is driving backward' }
        ];
        const choicesHtml = this.renderChoiceButtons(choices, 102);

        ws.innerHTML = `
          ${this.renderStepHeader(1, 'Where is the Car?', 3, 1)}

          <div class="space-y-4 py-2">
            <p class="text-sm text-slate-200 leading-relaxed font-medium">
              👉 Now move the timer to <strong>${vData.step1.time} seconds</strong>.
              <button class="btn-jump-time ml-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-lime-950/70 border border-lime-500/40 text-[#ccff00] hover:bg-lime-900/90 text-xs font-mono font-bold transition-all shadow-[0_0_8px_rgba(204,255,0,0.2)] active:scale-95" data-jump="${vData.step1.time}">
                ⚡ Set to ${vData.step1.time}s
              </button>
              <br><br>
              Look at the line on the graph between ${vData.step1.tRange}. It is completely flat! <strong>What is the car doing?</strong>
            </p>

            <div class="space-y-2">
              ${choicesHtml}
            </div>

            <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

            <div id="nextArea" class="hidden pt-2">
              <button id="btnNextStep" class="btn-next-step w-full py-3 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-sm hover:bg-lime-300 transition-all flex items-center justify-center gap-2">
                <span>Spot On! Next Question</span> <span>➜</span>
              </button>
            </div>
          </div>
        `;

        const diagClues = {
          fast: 'Clue: If the car was driving fast, it would cover meters down the track quickly! Here the line is flat, meaning the car stays in one spot and does not move at all.',
          backward: 'Clue: Driving backward means returning toward 0 meters. A flat line means position is not changing at all.'
        };

        this.bindChoices(
          'stopped',
          5,
          'm1',
          'l1_s1',
          () => {
            this.loadLevel(1, 2);
          },
          diagClues,
          () => {
            this.studentSeed = (this.studentSeed + 17) % 99999;
            this.loadLevel(1, 1);
          }
        );
      } else {
        this.visualizer.setHighlightTime(vData.step2.time);

        const choices = [
          { val: 'backward', text: 'Driving backwards toward the start (0m)' },
          { val: 'forward', text: 'Driving forward away from the start' }
        ];
        const choicesHtml = this.renderChoiceButtons(choices, 103);

        ws.innerHTML = `
          ${this.renderStepHeader(1, 'Where is the Car?', 3, 2)}

          <div class="space-y-4 py-2">
            <p class="text-sm text-slate-200 leading-relaxed font-medium">
              👉 Now move the timer past <strong>${vData.step2.afterT}</strong>.
              <button class="btn-jump-time ml-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-lime-950/70 border border-lime-500/40 text-[#ccff00] hover:bg-lime-900/90 text-xs font-mono font-bold transition-all shadow-[0_0_8px_rgba(204,255,0,0.2)] active:scale-95" data-jump="${vData.step2.time}">
                ⚡ Set to ${vData.step2.time}s
              </button>
              <br><br>
              The line slopes downward back toward 0. <strong>Which way is the car driving along the track?</strong>
            </p>

            <div class="space-y-2">
              ${choicesHtml}
            </div>

            <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

            <div id="nextArea" class="hidden pt-2">
              <button id="btnNextStep" class="btn-next-step w-full py-3 rounded-xl bg-gradient-to-r from-[#ccff00] to-emerald-400 text-slate-950 font-bold font-mono text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <span>🎉 Level 1 Complete! Go to Level 2</span> <span>➜</span>
              </button>
            </div>
          </div>
        `;

        const diagClues = {
          forward: 'Clue: Driving forward means moving forward to larger meter marks (10m, 12m). This line slopes back toward 0 meters (the starting line)!'
        };

        this.bindChoices(
          'backward',
          5,
          'm1',
          'l1_s2',
          () => {
            this.loadLevel(2, 0);
          },
          diagClues,
          () => {
            this.studentSeed = (this.studentSeed + 19) % 99999;
            this.loadLevel(1, 2);
          }
        );
      }
    }

    // --------------------------------------------------------------
    // LEVEL 2: Fast or Slow? (Steepness & Racing, Zero Math)
    // --------------------------------------------------------------
    renderLevel2(ws, modeLabel, step) {
      modeLabel.textContent = 'Level 2: Fast or Slow?';

      const vIndex = this.getVariant(2, L2_VARIANTS.length);
      const vData = L2_VARIANTS[vIndex];

      this.visualizer.setMultiRunners(vData.runners);

      if (step === 0) {
        const greenText = vData.car1Option.includes('Green') ? vData.car1Option : vData.car2Option;
        const blueText = vData.car1Option.includes('Blue') ? vData.car1Option : vData.car2Option;
        const choices = [
          { val: 'green', text: greenText },
          { val: 'blue', text: blueText }
        ];
        // Distribute choices evenly across A and B
        const choicesHtml = this.renderChoiceButtons(choices, 201);

        ws.innerHTML = `
          ${this.renderStepHeader(2, 'Fast or Slow?', 3, 0)}

          <div class="space-y-4 py-2">
            <p class="text-sm text-slate-200 leading-relaxed font-medium">
              Look at the <strong>${vData.car1Name}</strong> and the <strong>${vData.car2Name}</strong> on the graph.
              <br><br>
              Both cars are moving forward horizontally along the track, but one line has a <strong>steeper slope</strong> (covering meters much faster in less time). Which line has the steeper slope?
            </p>

            <div class="space-y-2">
              ${choicesHtml}
            </div>

            <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

            <div id="nextArea" class="hidden pt-2">
              <button id="btnNextStep" class="btn-next-step w-full py-3 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-sm hover:bg-lime-300 transition-all flex items-center justify-center gap-2">
                <span>Great eye! Next Step</span> <span>➜</span>
              </button>
            </div>
          </div>
        `;

        const otherColor = vData.steeperColor === 'green' ? 'blue' : 'green';
        const diagClues = {
          [otherColor]: 'Clue: Check the tilt! The steeper line covers more meters on the vertical axis in very few seconds, while the other line takes much longer.'
        };

        this.bindChoices(
          vData.steeperColor,
          5,
          'm2',
          'l2_s0',
          () => {
            this.loadLevel(2, 1);
          },
          diagClues,
          () => {
            this.studentSeed = (this.studentSeed + 23) % 99999;
            this.loadLevel(2, 0);
          }
        );
      } else if (step === 1) {
        const greenText = vData.raceWinnerChoiceA.includes('Green') ? vData.raceWinnerChoiceA : vData.raceWinnerChoiceB;
        const blueText = vData.raceWinnerChoiceA.includes('Blue') ? vData.raceWinnerChoiceA : vData.raceWinnerChoiceB;
        const choices = [
          { val: 'green', text: greenText },
          { val: 'blue', text: blueText }
        ];
        const choicesHtml = this.renderChoiceButtons(choices, 202);

        ws.innerHTML = `
          ${this.renderStepHeader(2, 'Fast or Slow?', 3, 1)}

          <div class="space-y-4 py-2">
            <p class="text-sm text-slate-200 leading-relaxed font-medium">
              Let's test it! Hit the <strong>[▶ Race the Cars]</strong> button below to watch them drive together along the track.
            </p>

            <button id="btnRace" class="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono text-lime-300 font-bold flex items-center justify-center gap-2">
              <span>🏎️💨</span> <span>Race the Cars</span>
            </button>

            <p class="text-sm text-slate-200 font-medium pt-1">
              <strong>Which car reaches the ${vData.finishDist}-meter finish line first?</strong>
            </p>

            <div class="space-y-2">
              ${choicesHtml}
            </div>

            <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

            <div id="nextArea" class="hidden pt-2">
              <button id="btnNextStep" class="btn-next-step w-full py-3 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-sm hover:bg-lime-300 transition-all flex items-center justify-center gap-2">
                <span>Boom! Next Question</span> <span>➜</span>
              </button>
            </div>
          </div>
        `;

        const raceBtn = document.getElementById('btnRace');
        if (raceBtn) {
          raceBtn.onclick = () => {
            this.visualizer.reset();
            this.visualizer.play();
            sfx.click();
          };
        }

        const loserColor = vData.winnerColor === 'green' ? 'blue' : 'green';
        const diagClues = {
          [loserColor]: 'Clue: Hit the [▶ Race the Cars] button above and keep your eyes on the finish line! Notice which car arrives at the flag first.'
        };

        this.bindChoices(
          vData.winnerColor,
          5,
          'm2',
          'l2_s1',
          () => {
            this.loadLevel(2, 2);
          },
          diagClues,
          () => {
            this.studentSeed = (this.studentSeed + 29) % 99999;
            this.loadLevel(2, 1);
          }
        );
      } else {
        const choices = [
          { val: 'faster', text: 'Faster (covering more meters every second)' },
          { val: 'slower', text: 'Slower' },
          { val: 'stopped', text: 'Stopped' }
        ];
        const choicesHtml = this.renderChoiceButtons(choices, 203);

        ws.innerHTML = `
          ${this.renderStepHeader(2, 'Fast or Slow?', 3, 2)}

          <div class="space-y-4 py-2">
            <p class="text-sm text-slate-200 leading-relaxed font-medium">
              Here is the big idea:
              <br><br>
              On a position-time graph, a <strong>steeper line</strong> always means the car is moving:
            </p>

            <div class="space-y-2">
              ${choicesHtml}
            </div>

            <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

            <div id="nextArea" class="hidden pt-2">
              <button id="btnNextStep" class="btn-next-step w-full py-3 rounded-xl bg-gradient-to-r from-[#ccff00] to-emerald-400 text-slate-950 font-bold font-mono text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <span>🎉 Level 2 Complete! Go to Level 3</span> <span>➜</span>
              </button>
            </div>
          </div>
        `;

        const diagClues = {
          slower: 'Clue: In the race, the car with the steeper line reached the finish line in much less time! Taking less time means it moved FASTER.',
          stopped: 'Clue: A stopped car stays at the same position, which creates a completely FLAT horizontal line.'
        };

        this.bindChoices(
          'faster',
          5,
          'm2',
          'l2_s2',
          () => {
            this.loadLevel(3, 0);
          },
          diagClues,
          () => {
            this.studentSeed = (this.studentSeed + 31) % 99999;
            this.loadLevel(2, 2);
          }
        );
      }
    }

    // --------------------------------------------------------------
    // LEVEL 3: Rise over Run (Slope = Speed, Box Counting)
    // --------------------------------------------------------------
    renderLevel3(ws, modeLabel, step) {
      modeLabel.textContent = 'Level 3: Rise over Run';

      const vIndex = this.getVariant(3, L3_VARIANTS.length);
      const vData = L3_VARIANTS[vIndex];

      this.visualizer.setJourneySegments(vData.journey);
      this.visualizer.setSlopeTriangle(vData.p1, vData.p2, `Δx = ${vData.rise}m`, `Δt = ${vData.run}s`);

      if (step === 0) {
        ws.innerHTML = `
          ${this.renderStepHeader(3, 'Rise over Run', 3, 0)}

          <div class="space-y-4 py-2">
            <p class="text-sm text-slate-200 leading-relaxed font-medium">
              Speed is simply: <strong>How far did it go?</strong> divided by <strong>How long did it take?</strong>
              <br><br>
              Look at the <strong class="text-rose-400">red Rise bracket (Δx)</strong> measuring change in position. Notice the car is moving forward along the horizontal track. <strong>How many meters forward did the car travel from 0m to ${vData.rise}m?</strong>
            </p>

            <div class="flex items-center gap-3">
              <input id="stepInput" type="number" placeholder="Enter meters" class="big-input w-36">
              <span class="text-sm font-mono text-slate-300">meters</span>
              <button id="btnCheckInput" class="px-4 py-2.5 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-xs hover:bg-lime-300">Check</button>
            </div>

            <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

            <div id="nextArea" class="hidden pt-2">
              <button id="btnNextStep" class="btn-next-step w-full py-3 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-sm hover:bg-lime-300 transition-all flex items-center justify-center gap-2">
                <span>Nice! Next Step</span> <span>➜</span>
              </button>
            </div>
          </div>
        `;

        this.bindNumberInput(vData.rise, 6, 'm3', 'l3_s0', () => {
          this.loadLevel(3, 1);
        });
      } else if (step === 1) {
        ws.innerHTML = `
          ${this.renderStepHeader(3, 'Rise over Run', 3, 1)}

          <div class="space-y-4 py-2">
            <p class="text-sm text-slate-200 leading-relaxed font-medium">
              Now look at the <strong class="text-sky-400">blue Run bracket (Δt)</strong> along the horizontal time axis.
              <br><br>
              How much time passed from 0s to ${vData.run}s?
            </p>

            <div class="flex items-center gap-3">
              <input id="stepInput" type="number" placeholder="Enter seconds" class="big-input w-36">
              <span class="text-sm font-mono text-slate-300">seconds</span>
              <button id="btnCheckInput" class="px-4 py-2.5 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-xs hover:bg-lime-300">Check</button>
            </div>

            <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

            <div id="nextArea" class="hidden pt-2">
              <button id="btnNextStep" class="btn-next-step w-full py-3 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-sm hover:bg-lime-300 transition-all flex items-center justify-center gap-2">
                <span>Awesome! Final Step</span> <span>➜</span>
              </button>
            </div>
          </div>
        `;

        this.bindNumberInput(vData.run, 7, 'm3', 'l3_s1', () => {
          this.loadLevel(3, 2);
        });
      } else {
        ws.innerHTML = `
          ${this.renderStepHeader(3, 'Rise over Run', 3, 2)}

          <div class="space-y-4 py-2">
            <p class="text-sm text-slate-200 leading-relaxed font-medium">
              Now calculate the speed using the slope formula:
              <br><br>
              <strong>Speed = Rise (Distance) ÷ Run (Time) = ${vData.rise}m ÷ ${vData.run}s = ?</strong>
            </p>

            <div class="flex items-center gap-3">
              <input id="stepInput" type="number" placeholder="Speed" class="big-input w-36">
              <span class="text-sm font-mono text-slate-300">m/s</span>
              <button id="btnCheckInput" class="px-4 py-2.5 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-xs hover:bg-lime-300">Check</button>
            </div>

            <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

            <div id="nextArea" class="hidden pt-2">
              <button id="btnNextStep" class="btn-next-step w-full py-3 rounded-xl bg-gradient-to-r from-[#ccff00] to-emerald-400 text-slate-950 font-bold font-mono text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <span>🎉 Level 3 Complete! Go to Level 4</span> <span>➜</span>
              </button>
            </div>
          </div>
        `;

        this.bindNumberInput(vData.speed, 7, 'm3', 'l3_s2', () => {
          this.loadLevel(4, 0);
        });
      }
    }

    // --------------------------------------------------------------
    // LEVEL 4: Driving Backwards & Speed vs Velocity
    // --------------------------------------------------------------
    renderLevel4(ws, modeLabel, step) {
      modeLabel.textContent = 'Level 4: Driving Backwards';

      const vIndex = this.getVariant(4, L4_VARIANTS.length);
      const vData = L4_VARIANTS[vIndex];

      this.visualizer.setJourneySegments(vData.journey);

      if (step === 0) {
        const midBackT = (vData.tBackStart + vData.tBackEnd) / 2;
        this.visualizer.setHighlightTime(midBackT);

        const choices = [
          { val: 'pos', text: `${vData.posSpeed} m/s (speed is always positive!)` },
          { val: 'neg', text: `${vData.negVel} m/s` }
        ];
        const choicesHtml = this.renderChoiceButtons(choices, 401);

        ws.innerHTML = `
          ${this.renderStepHeader(4, 'Driving Backwards', 3, 0)}

          <div class="space-y-4 py-2">
            <p class="text-sm text-slate-200 leading-relaxed font-medium">
              From ${vData.tBackStart}s to ${vData.tBackEnd}s, the car drives backward from ${vData.xBackStart}m to ${vData.xBackEnd}m (covers ${vData.xBackStart}m in ${vData.backDuration}s = ${vData.posSpeed} m/s).
              <br><br>
              In physics, direction backward is written with a minus: <strong>velocity = ${vData.negVel} m/s</strong>.
              <br><br>
              What does the car's <strong>speedometer</strong> show?
            </p>

            <div class="space-y-2">
              ${choicesHtml}
            </div>

            <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

            <div id="nextArea" class="hidden pt-2">
              <button id="btnNextStep" class="btn-next-step w-full py-3 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-sm hover:bg-lime-300 transition-all flex items-center justify-center gap-2">
                <span>Spot On! Next Step</span> <span>➜</span>
              </button>
            </div>
          </div>
        `;

        const diagClues = {
          neg: `Clue: Speedometers never show negative numbers! Speed is always a positive number (${vData.posSpeed} m/s). The minus sign is only for velocity (direction).`
        };

        this.bindChoices(
          'pos',
          5,
          'm4',
          'l4_s0',
          () => {
            this.loadLevel(4, 1);
          },
          diagClues,
          () => {
            this.studentSeed = (this.studentSeed + 37) % 99999;
            this.loadLevel(4, 0);
          }
        );
      } else if (step === 1) {
        const choices = [
          { val: 'B', text: vData.compWinnerOption },
          { val: 'A', text: vData.compLoserOption }
        ];
        const choicesHtml = this.renderChoiceButtons(choices, 402);

        ws.innerHTML = `
          ${this.renderStepHeader(4, 'Driving Backwards', 3, 1)}

          <div class="space-y-4 py-2">
            <p class="text-sm text-slate-200 leading-relaxed font-medium">
              Which car is driving with greater <strong>speed</strong> (faster)?
              <br><br>
              • Car A: driving forward at ${vData.compCarA}
              <br>
              • Car B: driving in reverse at ${vData.compCarB}
            </p>

            <div class="space-y-2">
              ${choicesHtml}
            </div>

            <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

            <div id="nextArea" class="hidden pt-2">
              <button id="btnNextStep" class="btn-next-step w-full py-3 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-sm hover:bg-lime-300 transition-all flex items-center justify-center gap-2">
                <span>Exactly! Next Step</span> <span>➜</span>
              </button>
            </div>
          </div>
        `;

        const diagClues = {
          A: `Clue: Ignore the minus sign when comparing speeds! Car B is driving at ${vData.compCarB.replace('-', '')}, which is faster than Car A (${vData.compCarA}).`
        };

        this.bindChoices(
          'B',
          5,
          'm4',
          'l4_s1',
          () => {
            this.loadLevel(4, 2);
          },
          diagClues,
          () => {
            this.studentSeed = (this.studentSeed + 41) % 99999;
            this.loadLevel(4, 1);
          }
        );
      } else {
        ws.innerHTML = `
          ${this.renderStepHeader(4, 'Driving Backwards', 3, 2)}

          <div class="space-y-4 py-2">
            <p class="text-sm text-slate-200 leading-relaxed font-medium">
              Quick check:
              <br><br>
              If a vehicle has a velocity of <strong>${vData.quickNeg} m/s</strong>, what is its <strong>speed</strong>?
            </p>

            <div class="flex items-center gap-3">
              <input id="stepInput" type="number" placeholder="Positive speed" class="big-input w-36">
              <span class="text-sm font-mono text-slate-300">m/s</span>
              <button id="btnCheckInput" class="px-4 py-2.5 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-xs hover:bg-lime-300">Check</button>
            </div>

            <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

            <div id="nextArea" class="hidden pt-2">
              <button id="btnNextStep" class="btn-next-step w-full py-3 rounded-xl bg-gradient-to-r from-[#ccff00] to-emerald-400 text-slate-950 font-bold font-mono text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <span>🎉 Level 4 Complete! Go to Level 5</span> <span>➜</span>
              </button>
            </div>
          </div>
        `;

        this.bindNumberInput(vData.quickPos, 5, 'm4', 'l4_s2', () => {
          this.loadLevel(5, 0);
        });
      }
    }

    // --------------------------------------------------------------
    // LEVEL 5: Read the Table (Graph to Data Table - 3 Datasets)
    // --------------------------------------------------------------
    renderLevel5(ws, modeLabel, step = 0) {
      modeLabel.textContent = `Level 5: Reading the Table (Dataset ${step + 1} of 3)`;

      const baseVariant = this.getVariant(5, L5_VARIANTS.length);
      const vIndex = (baseVariant + step) % L5_VARIANTS.length;
      const vData = L5_VARIANTS[vIndex];

      this.visualizer.setJourneySegments(vData.journey);

      const rowsHtml = vData.rows
        .map(
          (r, idx) => `
            <tr>
              <td class="py-1.5 px-2 font-bold text-[#ccff00]">
                <button class="btn-jump-time flex items-center gap-1.5 px-2 py-1 rounded bg-lime-950/80 border border-lime-500/40 text-[#ccff00] hover:bg-lime-900 active:scale-95 font-bold text-xs" data-jump="${r.time}" title="Click to jump simulation to ${r.time} seconds">
                  <span>⚡ ${r.label}</span>
                </button>
              </td>
              <td class="py-1.5 px-2"><input id="t5_${idx}" type="number" class="data-table-input" placeholder="${idx === 0 ? '0m' : '? meters'}"></td>
              <td id="s5_${idx}" class="py-1.5 px-2 text-right text-slate-500 font-mono text-[10px]">Pending</td>
            </tr>
          `
        )
        .join('');

      const isLastDataset = step === 2;
      const nextBtnText = isLastDataset
        ? '<span>🎉 Level 5 Complete! Go to Level 6</span> <span>➜</span>'
        : `<span>Nice Job! Go to Dataset ${step + 2} of 3</span> <span>➜</span>`;
      const nextBtnClass = isLastDataset
        ? 'btn-next-step w-full py-3 rounded-xl bg-gradient-to-r from-[#ccff00] to-emerald-400 text-slate-950 font-bold font-mono text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2'
        : 'btn-next-step w-full py-3 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-sm hover:bg-lime-300 transition-all flex items-center justify-center gap-2';

      ws.innerHTML = `
        ${this.renderStepHeader(5, 'Fill the Motion Log', 3, step)}

        <div class="space-y-3 py-2">
          <p class="text-xs text-slate-300">
            Slide the timer or click the <strong>⚡ Jump</strong> buttons to read the car's position for <strong>Dataset ${step + 1} of 3</strong>:
          </p>

          <table class="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr class="border-b border-white/15 text-slate-400">
                <th class="py-1.5 px-2">Time</th>
                <th class="py-1.5 px-2">Car Position (m)</th>
                <th class="py-1.5 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${rowsHtml}
            </tbody>
          </table>

          <button id="btnCheckTbl" class="w-full py-2.5 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-xs hover:bg-lime-300 transition-all">
            Verify Table ✓
          </button>

          <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

          <div id="nextArea" class="hidden pt-2">
            <button id="btnNextStep" class="${nextBtnClass}">
              ${nextBtnText}
            </button>
          </div>
        </div>
      `;

      document.getElementById('btnCheckTbl').onclick = () => {
        let allCorrect = true;

        vData.rows.forEach((r, idx) => {
          const val = parseFloat(document.getElementById(`t5_${idx}`).value);
          const isCorrect = val === r.expectedPos;
          if (!isCorrect) allCorrect = false;
          this.setTableStatus(`t5_${idx}`, `s5_${idx}`, isCorrect, `${r.expectedPos}m`);
        });

        const fb = document.getElementById('stepFeedback');
        const next = document.getElementById('nextArea');

        if (allCorrect) {
          fb.className = 'text-xs font-mono text-emerald-400 font-bold';
          fb.textContent = `✓ Fantastic! Dataset ${step + 1} of 3 verified (+5 pts).`;
          sfx.success();
          this.awardPoints('m5', 5, `l5_s${step}`);
          if (next) next.classList.remove('hidden');
        } else {
          fb.className = 'text-xs font-mono text-rose-400';
          fb.textContent = 'Hint: Slide the timer to each second and look at the car position above.';
          sfx.error();
        }
      };

      const nxtBtn = document.getElementById('btnNextStep');
      if (nxtBtn) {
        nxtBtn.onclick = () => {
          if (step < 2) {
            this.loadLevel(5, step + 1);
          } else {
            this.loadLevel(6, 0);
          }
        };
      }
    }

    setTableStatus(inpId, statId, isOk, hint) {
      const inp = document.getElementById(inpId);
      const stat = document.getElementById(statId);
      if (inp && stat) {
        if (isOk) {
          inp.className = 'data-table-input correct';
          stat.className = 'py-1.5 px-2 text-right text-emerald-400 font-mono text-[10px]';
          stat.textContent = '✓ Correct';
        } else {
          inp.className = 'data-table-input incorrect';
          stat.className = 'py-1.5 px-2 text-right text-rose-400 font-mono text-[10px]';
          stat.textContent = `Needs ${hint}`;
        }
      }
    }

    // --------------------------------------------------------------
    // LEVEL 6: Draw the Drive! (Table to Graph - 3 Datasets)
    // --------------------------------------------------------------
    renderLevel6(ws, modeLabel, step = 0) {
      modeLabel.textContent = `Level 6: Draw the Drive! (Mission ${step + 1} of 3)`;

      const baseVariant = this.getVariant(6, L6_VARIANTS.length);
      const vIndex = (baseVariant + step) % L6_VARIANTS.length;
      const vData = L6_VARIANTS[vIndex];
      const p = vData.points; // [p0, p1, p2, p3]

      // Start with origin point plotted
      this.visualizer.enablePlottingMode([{ t: p[0].t, x: p[0].x }], 4);

      const isLastMission = step === 2;
      const ptsForThisStep = step === 0 ? 6 : 7; // 6 + 7 + 7 = 20 pts total
      const nextBtnText = isLastMission
        ? '<span>🏆 View &amp; Print Mastery Certificate!</span> <span>➜</span>'
        : `<span>Awesome Drive! Go to Mission ${step + 2} of 3</span> <span>➜</span>`;
      const nextBtnClass = isLastMission
        ? 'btn-next-step w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ccff00] via-[#a3e635] to-[#facc15] text-slate-950 font-black font-mono text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.4)]'
        : 'btn-next-step w-full py-3 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-sm hover:bg-lime-300 transition-all flex items-center justify-center gap-2';

      ws.innerHTML = `
        ${this.renderStepHeader(6, 'Draw the Drive!', 3, step)}

        <div class="space-y-3 py-2">
          <p class="text-xs text-slate-300">
            Click on the <strong>graph grid</strong> to place the 4 points for <strong>Mission ${step + 1} of 3</strong>:
          </p>

          <div class="p-2.5 rounded-xl bg-slate-950/60 border border-white/10 space-y-1.5 text-xs font-mono">
            <div class="flex justify-between items-center text-slate-300">
              <span>Point 1: Time = ${p[0].t}s, Pos = ${p[0].x}m</span>
              <span id="l6_p1" class="text-emerald-400 font-bold">✓ Ready</span>
            </div>
            <div class="flex justify-between items-center text-slate-300">
              <span>Point 2: Time = ${p[1].t}s, Pos = ${p[1].x}m</span>
              <span id="l6_p2" class="text-slate-500">Pending</span>
            </div>
            <div class="flex justify-between items-center text-slate-300">
              <span>Point 3: Time = ${p[2].t}s, Pos = ${p[2].x}m</span>
              <span id="l6_p3" class="text-slate-500">Pending</span>
            </div>
            <div class="flex justify-between items-center text-slate-300">
              <span>Point 4: Time = ${p[3].t}s, Pos = ${p[3].x}m</span>
              <span id="l6_p4" class="text-slate-500">Pending</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button id="btnCheckPlot" class="flex-1 py-2.5 rounded-xl bg-[#ccff00] text-slate-950 font-bold font-mono text-xs hover:bg-lime-300 transition-all shadow-[0_0_12px_rgba(204,255,0,0.3)]">
              ▶ Test My Drive!
            </button>
            <button id="btnResetPlot" class="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-mono text-xs text-slate-300">
              Reset Points
            </button>
          </div>

          <div id="stepFeedback" class="text-xs font-mono min-h-[24px]"></div>

          <div id="nextArea" class="hidden pt-2">
            <button id="btnNextStep" class="${nextBtnClass}">
              ${nextBtnText}
            </button>
          </div>
        </div>
      `;

      this.onPointPlotted = (pts) => {
        const hasP2 = pts.some((pt) => pt.t === p[1].t && pt.x === p[1].x);
        const hasP3 = pts.some((pt) => pt.t === p[2].t && pt.x === p[2].x);
        const hasP4 = pts.some((pt) => pt.t === p[3].t && pt.x === p[3].x);

        const el2 = document.getElementById('l6_p2');
        const el3 = document.getElementById('l6_p3');
        const el4 = document.getElementById('l6_p4');

        if (el2) {
          el2.textContent = hasP2 ? '✓ Plotted' : 'Pending';
          el2.className = hasP2 ? 'text-emerald-400 font-bold' : 'text-slate-500';
        }
        if (el3) {
          el3.textContent = hasP3 ? '✓ Plotted' : 'Pending';
          el3.className = hasP3 ? 'text-emerald-400 font-bold' : 'text-slate-500';
        }
        if (el4) {
          el4.textContent = hasP4 ? '✓ Plotted' : 'Pending';
          el4.className = hasP4 ? 'text-emerald-400 font-bold' : 'text-slate-500';
        }
      };

      document.getElementById('btnResetPlot').onclick = () => {
        this.visualizer.enablePlottingMode([{ t: p[0].t, x: p[0].x }], 4);
        sfx.click();
      };

      document.getElementById('btnCheckPlot').onclick = () => {
        const pts = this.visualizer.plottedPoints;
        const fb = document.getElementById('stepFeedback');
        const next = document.getElementById('nextArea');

        const hasP1 = pts.some((pt) => pt.t === p[0].t && pt.x === p[0].x);
        const hasP2 = pts.some((pt) => pt.t === p[1].t && pt.x === p[1].x);
        const hasP3 = pts.some((pt) => pt.t === p[2].t && pt.x === p[2].x);
        const hasP4 = pts.some((pt) => pt.t === p[3].t && pt.x === p[3].x);

        if (hasP1 && hasP2 && hasP3 && hasP4) {
          fb.className = 'text-xs font-mono text-emerald-400 font-bold';
          fb.textContent = `✓ Perfect Plot for Mission ${step + 1} of 3! (+${ptsForThisStep} pts). Watching the car follow your path...`;

          const segs = [
            { t0: p[0].t, t1: p[1].t, x0: p[0].x, x1: p[1].x, color: '#ccff00' },
            { t0: p[1].t, t1: p[2].t, x0: p[1].x, x1: p[2].x, color: '#facc15' },
            { t0: p[2].t, t1: p[3].t, x0: p[2].x, x1: p[3].x, color: '#f43f5e' }
          ];
          this.visualizer.setJourneySegments(segs);
          this.visualizer.play();
          sfx.fanfare();

          this.awardPoints('m6', ptsForThisStep, `l6_s${step}`);
          if (next) next.classList.remove('hidden');
        } else {
          fb.className = 'text-xs font-mono text-rose-400';
          fb.textContent = `Check the points in the box above. Make sure your dots match (${p[1].t}s, ${p[1].x}m), (${p[2].t}s, ${p[2].x}m), and (${p[3].t}s, ${p[3].x}m).`;
          sfx.error();
        }
      };

      const nxtBtn = document.getElementById('btnNextStep');
      if (nxtBtn) {
        nxtBtn.onclick = () => {
          if (isLastMission) {
            this.showCertificate();
          } else {
            this.loadLevel(6, step + 1);
          }
        };
      }
    }

    // Helper: Bind Choice Buttons with Diagnostic Feedback & Attentive Mastery
    bindChoices(correctVal, points, levelKey, stepKey, nextCallback, diagnosticClues = {}, retryCallback = null) {
      const cards = document.querySelectorAll('.choice-card');
      const fb = document.getElementById('stepFeedback');
      const next = document.getElementById('nextArea');
      const nxtBtn = document.getElementById('btnNextStep');

      let attempts = 0;

      cards.forEach((c) => {
        c.onclick = () => {
          if (c.classList.contains('disabled') || c.classList.contains('correct')) return;

          attempts++;
          const val = c.dataset.val;

          if (val === correctVal) {
            cards.forEach((x) => x.classList.add('disabled'));
            c.classList.remove('disabled');
            c.classList.add('correct');

            const isFirstTry = attempts === 1;
            const starBadge = isFirstTry
              ? `<span class="attentive-badge">⭐ Attentive Reader!</span> `
              : '';

            fb.innerHTML = `
              <div class="flex items-center gap-2 pt-1">
                ${starBadge}
                <span class="text-xs font-mono text-emerald-400 font-bold">
                  ✓ That is correct! Well done (+${points} pts).
                </span>
              </div>
            `;
            if (isFirstTry) sfx.fanfare();
            else sfx.success();

            this.awardPoints(levelKey, points, stepKey);
            if (next) next.classList.remove('hidden');
          } else {
            // Lock ALL choices so the student cannot guess by elimination without reloading
            cards.forEach((x) => x.classList.add('disabled'));
            c.classList.add('incorrect');
            sfx.error();

            const customClue = diagnosticClues[val] || 'Look carefully at the glowing line and the numbers on the track above!';
            
            // Mandatory retry button when retryCallback is provided
            const retryHtml = retryCallback
              ? `<div class="pt-2">
                   <button id="btnRetryFresh" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 font-mono font-bold text-xs hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md">
                     <span>🔄 Load Fresh Scenario to Master This</span> <span>➜</span>
                   </button>
                 </div>`
              : `<div class="pt-1 text-[11px] text-amber-300 font-mono">Review the graph and track, then try again.</div>`;

            fb.innerHTML = `
              <div class="diagnostic-clue-card mt-1">
                <span class="text-base shrink-0">💡</span>
                <div class="space-y-1 w-full">
                  <div class="font-bold text-rose-300">Not quite:</div>
                  <div class="text-slate-200 text-xs leading-relaxed">${customClue}</div>
                  ${retryHtml}
                </div>
              </div>
            `;

            const retryBtn = document.getElementById('btnRetryFresh');
            if (retryBtn && retryCallback) {
              retryBtn.onclick = () => retryCallback();
            } else if (!retryCallback) {
              // If no specific retryCallback provided, allow unlocking for this step after brief pause
              setTimeout(() => {
                cards.forEach((x) => {
                  if (x !== c) x.classList.remove('disabled');
                });
              }, 1200);
            }
          }
        };
      });

      if (nxtBtn) {
        nxtBtn.onclick = () => nextCallback();
      }
    }

    // Helper: Bind Number Input
    bindNumberInput(targetNum, points, levelKey, stepKey, nextCallback) {
      const inp = document.getElementById('stepInput');
      const btn = document.getElementById('btnCheckInput');
      const fb = document.getElementById('stepFeedback');
      const next = document.getElementById('nextArea');
      const nxtBtn = document.getElementById('btnNextStep');

      const check = () => {
        const val = parseFloat(inp.value);
        if (val === targetNum || Math.abs(val - targetNum) < 0.1) {
          inp.className = 'big-input correct w-36';
          fb.className = 'text-xs font-mono text-emerald-400 font-bold';
          fb.textContent = `✓ Correct! The answer is ${targetNum}.`;
          sfx.success();
          this.awardPoints(levelKey, points, stepKey);
          if (next) next.classList.remove('hidden');
        } else {
          inp.className = 'big-input incorrect w-36';
          fb.className = 'text-xs font-mono text-rose-400';
          fb.textContent = 'Check your counting and try again!';
          sfx.error();
        }
      };

      if (btn) btn.onclick = check;
      if (inp) {
        inp.onkeydown = (e) => {
          if (e.key === 'Enter') check();
        };
      }

      if (nxtBtn) {
        nxtBtn.onclick = () => nextCallback();
      }
    }

    awardPoints(levelKey, points, stepKey) {
      if (!this.completedSteps[stepKey]) {
        this.completedSteps[stepKey] = true;
        const max = levelKey === 'm3' || levelKey === 'm6' ? 20 : 15;
        this.levelScores[levelKey] = Math.min(max, this.levelScores[levelKey] + points);
        this.updateScoreUI();

        // Live Backup & Autosave
        const total =
          this.levelScores.m1 +
          this.levelScores.m2 +
          this.levelScores.m3 +
          this.levelScores.m4 +
          this.levelScores.m5 +
          this.levelScores.m6;

        const liveStatePayload = {
          studentSeed: this.studentSeed,
          levelScores: this.levelScores,
          completedSteps: this.completedSteps,
          currentLevelId: this.currentLevelId,
          currentStep: this.currentStep,
          lastActiveAt: new Date().toISOString()
        };

        if (window.studioAuth && window.studioAuth.studentId) {
          window.studioAuth.saveStudioGrade(total, liveStatePayload, true);
        } else {
          // Guest autosave
          try {
            localStorage.setItem(
              'pvt_studio_guest_state',
              JSON.stringify(liveStatePayload)
            );
          } catch (e) {
            console.warn('Could not save guest state:', e);
          }
        }
      }
    }

    // ==============================================================
    // FREE SANDBOX ENGINE
    // ==============================================================
    initSandboxVisualizer() {
      if (this.sbVisualizer) {
        this.sbVisualizer.resizeCanvases();
        return;
      }
      this.sbVisualizer = new MotionVisualizer('sbGraphCanvas', 'sbTrackCanvas');
      this.sbVisualizer.setJourneySegments(this.sandboxSegments);
      this.renderSandboxSegmentsList();
      this.updateSandboxStats();

      const addBtn = document.getElementById('btnAddSbSegment');
      if (addBtn) {
        addBtn.onclick = () => {
          const v = parseFloat(document.getElementById('sbVelocity').value);
          const dt = parseFloat(document.getElementById('sbDuration').value);
          if (isNaN(v) || isNaN(dt) || dt <= 0) return;

          const lastSeg = this.sandboxSegments[this.sandboxSegments.length - 1];
          const t0 = lastSeg ? lastSeg.t1 : 0;
          const x0 = lastSeg ? lastSeg.x1 : 0;
          const t1 = t0 + dt;
          const x1 = x0 + v * dt;

          const colors = ['#ccff00', '#38bdf8', '#facc15', '#f43f5e', '#a855f7'];
          const color = colors[this.sandboxSegments.length % colors.length];

          this.sandboxSegments.push({ t0, t1, x0, x1, color });
          this.sbVisualizer.tMax = Math.max(10, Math.ceil(t1));
          this.sbVisualizer.setJourneySegments(this.sandboxSegments);
          this.renderSandboxSegmentsList();
          this.updateSandboxStats();
          sfx.click();
        };
      }

      const p1Btn = document.getElementById('btnSandboxPreset1');
      if (p1Btn) {
        p1Btn.onclick = () => {
          this.sandboxSegments = [
            { t0: 0, t1: 3, x0: 0, x1: 12, color: '#ccff00' },
            { t0: 3, t1: 6, x0: 12, x1: 12, color: '#facc15' },
            { t0: 6, t1: 10, x0: 12, x1: 20, color: '#38bdf8' }
          ];
          this.sbVisualizer.setJourneySegments(this.sandboxSegments);
          this.renderSandboxSegmentsList();
          this.updateSandboxStats();
          sfx.click();
        };
      }

      const p2Btn = document.getElementById('btnSandboxPreset2');
      if (p2Btn) {
        p2Btn.onclick = () => {
          this.sandboxSegments = [
            { t0: 0, t1: 4, x0: 0, x1: 16, color: '#ccff00' },
            { t0: 4, t1: 6, x0: 16, x1: 16, color: '#facc15' },
            { t0: 6, t1: 10, x0: 16, x1: 0, color: '#f43f5e' }
          ];
          this.sbVisualizer.setJourneySegments(this.sandboxSegments);
          this.renderSandboxSegmentsList();
          this.updateSandboxStats();
          sfx.click();
        };
      }

      const resetBtn = document.getElementById('btnSandboxReset');
      if (resetBtn) {
        resetBtn.onclick = () => {
          this.sandboxSegments = [];
          this.sbVisualizer.setJourneySegments([]);
          this.renderSandboxSegmentsList();
          this.updateSandboxStats();
          sfx.click();
        };
      }

      const playBtn = document.getElementById('btnSbPlay');
      if (playBtn) {
        playBtn.onclick = () => {
          this.sbVisualizer.reset();
          this.sbVisualizer.play();
          sfx.click();
        };
      }

      const sbReset = document.getElementById('btnSbReset');
      if (sbReset) {
        sbReset.onclick = () => {
          this.sbVisualizer.reset();
          sfx.click();
        };
      }
    }

    renderSandboxSegmentsList() {
      const list = document.getElementById('sbSegmentsList');
      if (!list) return;

      if (this.sandboxSegments.length === 0) {
        list.innerHTML = `<div class="text-xs text-slate-500 italic">No segments added yet. Add a segment above or load a preset!</div>`;
        return;
      }

      list.innerHTML = this.sandboxSegments
        .map((s, idx) => {
          const v = (s.x1 - s.x0) / (s.t1 - s.t0);
          const sign = v > 0 ? '+' : '';
          return `
          <div class="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" style="background:${s.color}"></span>
              <span class="font-bold">Step ${idx + 1}:</span>
              <span>${s.t0}s ➜ ${s.t1}s</span>
              <span class="text-slate-400">|</span>
              <span>${s.x0}m ➜ ${s.x1}m</span>
              <span class="text-slate-400">|</span>
              <span class="text-lime-300 font-bold">${sign}${v.toFixed(1)} m/s</span>
            </div>
            <button onclick="window.studioApp.removeSandboxSegment(${idx})" class="text-rose-400 hover:text-rose-300 text-sm font-bold">&times;</button>
          </div>
        `;
        })
        .join('');
    }

    removeSandboxSegment(idx) {
      this.sandboxSegments.splice(idx, 1);
      let curT = 0;
      let curX = 0;
      for (const s of this.sandboxSegments) {
        const dt = s.t1 - s.t0;
        const dx = s.x1 - s.x0;
        s.t0 = curT;
        s.t1 = curT + dt;
        s.x0 = curX;
        s.x1 = curX + dx;
        curT = s.t1;
        curX = s.x1;
      }
      this.sbVisualizer.setJourneySegments(this.sandboxSegments);
      this.renderSandboxSegmentsList();
      this.updateSandboxStats();
      sfx.click();
    }

    updateSandboxStats() {
      let totalTime = 0;
      let finalPos = 0;
      let netDisp = 0;
      let totalDist = 0;

      if (this.sandboxSegments.length > 0) {
        const last = this.sandboxSegments[this.sandboxSegments.length - 1];
        totalTime = last.t1;
        finalPos = last.x1;
        netDisp = finalPos - this.sandboxSegments[0].x0;

        for (const s of this.sandboxSegments) {
          totalDist += Math.abs(s.x1 - s.x0);
        }
      }

      const avgSpeed = totalTime > 0 ? totalDist / totalTime : 0;

      const tEl = document.getElementById('sbTotalTime');
      const pEl = document.getElementById('sbFinalPos');
      const dEl = document.getElementById('sbNetDisp');
      const distEl = document.getElementById('sbTotalDist');
      const spdEl = document.getElementById('sbAvgSpeed');

      if (tEl) tEl.textContent = `${totalTime.toFixed(1)} s`;
      if (pEl) pEl.textContent = `${finalPos.toFixed(1)} m`;
      if (dEl) dEl.textContent = `${netDisp.toFixed(1)} m`;
      if (distEl) distEl.textContent = `${totalDist.toFixed(1)} m`;
      if (spdEl) spdEl.textContent = `${avgSpeed.toFixed(1)} m/s`;
    }
  }

  // Instantiate Application
  document.addEventListener('DOMContentLoaded', () => {
    window.studioApp = new StudioEngine();
  });
})();

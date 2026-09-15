/**
 * Dual-Graph Motion Studio - Core Engine
 * Units & Kinematics (x-t to v-t translation)
 * Low Floor, High Ceiling Pedagogy
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
        // Audio error ignored
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

    alert() {
      this.playTone(440, 0.15, 'sawtooth', 0.15);
      setTimeout(() => this.playTone(880, 0.2, 'sawtooth', 0.15), 160);
    }
  }

  const sfx = new SoundFX();

  // --- Multi-Mode Visualizer Engine ---
  class DualVisualizer {
    constructor() {
      this.primaryCanvas = document.getElementById('primaryGraphCanvas');
      this.trackCanvas = document.getElementById('trackCanvas');
      this.dualLeftCanvas = document.getElementById('dualLeftCanvas');
      this.dualRightCanvas = document.getElementById('dualRightCanvas');

      this.pCtx = this.primaryCanvas ? this.primaryCanvas.getContext('2d') : null;
      this.tCtx = this.trackCanvas ? this.trackCanvas.getContext('2d') : null;
      this.dlCtx = this.dualLeftCanvas ? this.dualLeftCanvas.getContext('2d') : null;
      this.drCtx = this.dualRightCanvas ? this.dualRightCanvas.getContext('2d') : null;

      // Coordinate ranges for Position-Time (x-t)
      this.tMax = 10; // seconds
      this.xMin = -2; // meters
      this.xMax = 18; // meters

      // Coordinate ranges for Velocity-Time (v-t)
      this.vMin = -4; // m/s
      this.vMax = 6;  // m/s

      // Playback state
      this.currentTime = 0;
      this.isPlaying = false;
      this.animFrameId = null;
      this.lastFrameTimestamp = null;

      // Journey data
      this.graphMode = 'xt'; // 'xt', 'vt', or 'dual'
      this.segments = []; // 3 segments: [{ t0, t1, x0, x1, v, color }]

      // Level 6: Student Draggable Velocity Bars
      // [{ t0, t1, v, expectedV }]
      this.studentVelocityBars = [];
      this.draggingBarIdx = null;

      // Highlights & overlays
      this.highlightSectionIdx = null;
      this.slopeTriangle = null; // { p1, p2, labelRise, labelRun }
      this.hideValueTags = false;

      this.padding = { left: 45, right: 20, top: 25, bottom: 35 };

      this.initEvents();
      this.resizeCanvases();
      window.addEventListener('resize', () => this.resizeCanvases());
    }

    isDarkMode() {
      return document.documentElement.classList.contains('dark');
    }

    getContrastColor(colorHex) {
      if (this.isDarkMode()) return colorHex;
      const map = {
        '#ccff00': '#15803d',
        '#facc15': '#b45309',
        '#38bdf8': '#0284c7',
        '#f43f5e': '#be123c',
        '#a3e635': '#16a34a'
      };
      return map[colorHex] || colorHex;
    }

    resizeCanvases() {
      const dpr = window.devicePixelRatio || 1;
      
      const setup = (c, ctx) => {
        if (!c || !ctx) return { w: 0, h: 0 };
        const rect = c.getBoundingClientRect();
        c.width = Math.floor(rect.width * dpr);
        c.height = Math.floor(rect.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { w: rect.width, h: rect.height };
      };

      const pDim = setup(this.primaryCanvas, this.pCtx);
      this.pW = pDim.w; this.pH = pDim.h;

      const tDim = setup(this.trackCanvas, this.tCtx);
      this.tW = tDim.w; this.tH = tDim.h;

      const dlDim = setup(this.dualLeftCanvas, this.dlCtx);
      this.dlW = dlDim.w; this.dlH = dlDim.h;

      const drDim = setup(this.dualRightCanvas, this.drCtx);
      this.drW = drDim.w; this.drH = drDim.h;

      this.render();
    }

    initEvents() {
      // Loupe for Primary Canvas
      if (this.primaryCanvas) {
        const loupe = document.getElementById('loupeOverlay');
        const loupeCoord = document.getElementById('loupeCoordText');

        const updateLoupe = (e) => {
          if (this.graphMode === 'dual') return;
          const rect = this.primaryCanvas.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;

          if (mx >= this.padding.left && mx <= this.pW - this.padding.right &&
              my >= this.padding.top && my <= this.pH - this.padding.bottom) {
            loupe.classList.remove('hidden');
            loupe.style.left = `${mx}px`;
            loupe.style.top = `${my}px`;

            const t = this.pixelToTime(mx, this.pW);
            if (this.graphMode === 'xt') {
              const x = this.pixelToPos(my, this.pH);
              loupeCoord.textContent = `(${t.toFixed(1)}s, ${x.toFixed(1)}m)`;
            } else {
              const v = this.pixelToVel(my, this.pH);
              loupeCoord.textContent = `(${t.toFixed(1)}s, ${v.toFixed(1)} m/s)`;
            }
          } else {
            loupe.classList.add('hidden');
          }
        };

        this.primaryCanvas.addEventListener('pointermove', updateLoupe);
        this.primaryCanvas.addEventListener('pointerleave', () => loupe && loupe.classList.add('hidden'));

        this.primaryCanvas.addEventListener('pointerdown', (e) => {
          const rect = this.primaryCanvas.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const t = this.pixelToTime(mx, this.pW);
          this.setTime(Math.round(t * 10) / 10);
        });
      }

      // Drag and Drop on Dual Right Canvas (Velocity Bars in Level 6)
      if (this.dualRightCanvas) {
        const getPointerPos = (e) => {
          const rect = this.dualRightCanvas.getBoundingClientRect();
          return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          };
        };

        this.dualRightCanvas.addEventListener('pointerdown', (e) => {
          if (this.graphMode !== 'dual' || !this.studentVelocityBars.length) return;
          const { x, y } = getPointerPos(e);
          const t = this.pixelToTime(x, this.drW);

          // Find bar corresponding to time t
          const barIdx = this.studentVelocityBars.findIndex(b => t >= b.t0 && t <= b.t1);
          if (barIdx !== -1) {
            this.draggingBarIdx = barIdx;
            this.dualRightCanvas.setPointerCapture(e.pointerId);
            const rawV = this.pixelToVel(y, this.drH);
            const snappedV = Math.round(rawV * 2) / 2;
            this.studentVelocityBars[barIdx].v = Math.max(this.vMin, Math.min(this.vMax, snappedV));
            sfx.click();
            this.render();
            if (window.dualStudioApp && window.dualStudioApp.onVelocityBarMoved) {
              window.dualStudioApp.onVelocityBarMoved(this.studentVelocityBars);
            }
          }
        });

        this.dualRightCanvas.addEventListener('pointermove', (e) => {
          if (this.draggingBarIdx === null) return;
          const { y } = getPointerPos(e);
          const rawV = this.pixelToVel(y, this.drH);
          const snappedV = Math.round(rawV * 2) / 2;
          const clampedV = Math.max(this.vMin, Math.min(this.vMax, snappedV));
          if (this.studentVelocityBars[this.draggingBarIdx].v !== clampedV) {
            this.studentVelocityBars[this.draggingBarIdx].v = clampedV;
            sfx.click();
            this.render();
            if (window.dualStudioApp && window.dualStudioApp.onVelocityBarMoved) {
              window.dualStudioApp.onVelocityBarMoved(this.studentVelocityBars);
            }
          }
        });

        const endDrag = (e) => {
          if (this.draggingBarIdx !== null) {
            try { this.dualRightCanvas.releasePointerCapture(e.pointerId); } catch(err){}
            this.draggingBarIdx = null;
            this.render();
          }
        };

        this.dualRightCanvas.addEventListener('pointerup', endDrag);
        this.dualRightCanvas.addEventListener('pointercancel', endDrag);
      }
    }

    // Coordinate conversions
    timeToPixel(t, width) {
      const plotW = width - this.padding.left - this.padding.right;
      return this.padding.left + (t / this.tMax) * plotW;
    }

    pixelToTime(px, width) {
      const plotW = width - this.padding.left - this.padding.right;
      const val = ((px - this.padding.left) / plotW) * this.tMax;
      return Math.max(0, Math.min(this.tMax, val));
    }

    posToPixel(x, height) {
      const plotH = height - this.padding.top - this.padding.bottom;
      const norm = (x - this.xMin) / (this.xMax - this.xMin);
      return height - this.padding.bottom - norm * plotH;
    }

    pixelToPos(py, height) {
      const plotH = height - this.padding.top - this.padding.bottom;
      const norm = (height - this.padding.bottom - py) / plotH;
      const val = this.xMin + norm * (this.xMax - this.xMin);
      return Math.max(this.xMin, Math.min(this.xMax, val));
    }

    velToPixel(v, height) {
      const plotH = height - this.padding.top - this.padding.bottom;
      const norm = (v - this.vMin) / (this.vMax - this.vMin);
      return height - this.padding.bottom - norm * plotH;
    }

    pixelToVel(py, height) {
      const plotH = height - this.padding.top - this.padding.bottom;
      const norm = (height - this.padding.bottom - py) / plotH;
      const val = this.vMin + norm * (this.vMax - this.vMin);
      return Math.max(this.vMin, Math.min(this.vMax, val));
    }

    trackPosToPixel(x) {
      const tPad = 40;
      const trackW = this.tW - tPad * 2;
      const norm = (x - this.xMin) / (this.xMax - this.xMin);
      return tPad + norm * trackW;
    }

    setMode(mode) {
      this.graphMode = mode; // 'xt', 'vt', 'dual'
      const singleEl = this.primaryCanvas;
      const dualWrapper = document.getElementById('dualCanvasWrapper');
      const dot = document.getElementById('graphTypeDot');
      const label = document.getElementById('graphTypeLabel');

      if (mode === 'dual') {
        singleEl.classList.add('hidden');
        dualWrapper.classList.remove('hidden');
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse';
        if (label) {
          label.textContent = 'Dual Mode: x-t (Left) ➔ v-t Translation (Right)';
          label.className = 'font-mono text-xs font-bold text-sky-300 uppercase tracking-wider';
        }
      } else {
        singleEl.classList.remove('hidden');
        dualWrapper.classList.add('hidden');
        if (mode === 'vt') {
          if (dot) dot.className = 'w-2 h-2 rounded-full bg-rose-400 animate-pulse';
          if (label) {
            label.textContent = 'Velocity vs. Time Graph (v-t)';
            label.className = 'font-mono text-xs font-bold text-rose-300 uppercase tracking-wider';
          }
        } else {
          if (dot) dot.className = 'w-2 h-2 rounded-full bg-[#ccff00] animate-pulse';
          if (label) {
            label.textContent = 'Position vs. Time Graph (x-t)';
            label.className = 'font-mono text-xs font-bold text-lime-300 uppercase tracking-wider';
          }
        }
      }
      this.resizeCanvases();
    }

    set3Segments(segs) {
      // Ensure each segment has calculated velocity v = (x1 - x0) / (t1 - t0)
      this.segments = segs.map((s, idx) => {
        const dt = s.t1 - s.t0;
        const dx = s.x1 - s.x0;
        const v = dt !== 0 ? Math.round((dx / dt) * 10) / 10 : 0;
        const defaultColors = ['#ccff00', '#facc15', '#38bdf8'];
        return {
          ...s,
          v,
          color: s.color || defaultColors[idx % defaultColors.length]
        };
      });

      this.highlightSectionIdx = null;
      this.slopeTriangle = null;
      this.currentTime = 0;
      this.render();
      this.updateTelemetry();
    }

    setupDualBars(expectedBars) {
      // [{ t0, t1, expectedV }] -> initial v placed at 0
      this.studentVelocityBars = expectedBars.map(b => ({
        t0: b.t0,
        t1: b.t1,
        expectedV: b.expectedV,
        v: 0 // starting neutral on the axis
      }));
      this.draggingBarIdx = null;
      this.render();
    }

    setHighlightSection(idx) {
      this.highlightSectionIdx = idx;
      this.render();
    }

    setSlopeTriangle(p1, p2, labelRise, labelRun) {
      this.slopeTriangle = { p1, p2, labelRise, labelRun };
      this.render();
    }

    clearSlopeTriangle() {
      this.slopeTriangle = null;
      this.render();
    }

    getStateAtTime(t) {
      if (!this.segments.length) return { x: 0, v: 0 };
      for (const seg of this.segments) {
        if (t >= seg.t0 && t <= seg.t1) {
          const dt = seg.t1 - seg.t0;
          const prog = dt > 0 ? (t - seg.t0) / dt : 0;
          const x = seg.x0 + prog * (seg.x1 - seg.x0);
          return { x, v: seg.v };
        }
      }
      const last = this.segments[this.segments.length - 1];
      return { x: last.x1, v: 0 };
    }

    setTime(t) {
      this.currentTime = Math.max(0, Math.min(this.tMax, t));
      const scrubber = document.getElementById('timeScrubber');
      const display = document.getElementById('timeDisplay');
      if (scrubber) scrubber.value = this.currentTime;
      if (display) display.textContent = `${this.currentTime.toFixed(1)}s`;
      this.render();
      this.updateTelemetry();
    }

    updateTelemetry() {
      const state = this.getStateAtTime(this.currentTime);
      const posEl = document.getElementById('telemetryPos');
      const velEl = document.getElementById('telemetryVel');
      if (posEl) posEl.textContent = `${state.x.toFixed(1)} m`;
      if (velEl) velEl.textContent = `${state.v >= 0 ? '+' : ''}${state.v.toFixed(1)} m/s`;
    }

    play() {
      if (this.isPlaying) return;
      sfx.init();
      this.isPlaying = true;
      if (this.currentTime >= this.tMax) this.currentTime = 0;
      this.lastFrameTimestamp = performance.now();
      const playBtn = document.getElementById('btnPlayPause');
      const playIcon = document.getElementById('playIcon');
      const playLabel = document.getElementById('playLabel');
      if (playBtn) {
        playBtn.classList.remove('bg-[#38bdf8]', 'hover:bg-sky-300');
        playBtn.classList.add('bg-amber-400', 'hover:bg-amber-300');
      }
      if (playIcon) playIcon.textContent = '⏸';
      if (playLabel) playLabel.textContent = 'Pause';

      const tick = (now) => {
        if (!this.isPlaying) return;
        const deltaSec = (now - this.lastFrameTimestamp) / 1000;
        this.lastFrameTimestamp = now;

        const nextT = this.currentTime + deltaSec;
        if (nextT >= this.tMax) {
          this.setTime(this.tMax);
          this.pause();
          return;
        }
        this.setTime(nextT);
        this.animFrameId = requestAnimationFrame(tick);
      };
      this.animFrameId = requestAnimationFrame(tick);
    }

    pause() {
      this.isPlaying = false;
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      const playBtn = document.getElementById('btnPlayPause');
      const playIcon = document.getElementById('playIcon');
      const playLabel = document.getElementById('playLabel');
      if (playBtn) {
        playBtn.classList.remove('bg-amber-400', 'hover:bg-amber-300');
        playBtn.classList.add('bg-[#38bdf8]', 'hover:bg-sky-300');
      }
      if (playIcon) playIcon.textContent = '▶';
      if (playLabel) playLabel.textContent = 'Play Car';
    }

    togglePlay() {
      if (this.isPlaying) this.pause();
      else this.play();
    }

    reset() {
      this.pause();
      this.setTime(0);
    }

    // --- Master Render Coordinator ---
    render() {
      if (this.graphMode === 'dual') {
        this.renderDualLeft();
        this.renderDualRight();
      } else {
        this.renderPrimary();
      }
      this.renderTrack();
    }

    // Grid Renderer Helper
    drawGrid(ctx, w, h, xMin, xMax, yMin, yMax, yAxisLabel, isVelocity = false) {
      const isDark = this.isDarkMode();
      ctx.clearRect(0, 0, w, h);

      // Background fill
      ctx.fillStyle = isDark ? '#020502' : '#ffffff';
      ctx.fillRect(0, 0, w, h);

      const p = this.padding;
      const plotW = w - p.left - p.right;
      const plotH = h - p.top - p.bottom;

      // Vertical Grid Lines (Time)
      ctx.lineWidth = 1;
      for (let t = 0; t <= this.tMax; t += 1) {
        const px = p.left + (t / this.tMax) * plotW;
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.moveTo(px, p.top);
        ctx.lineTo(px, h - p.bottom);
        ctx.stroke();

        // Ticks & numbers
        ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${t}s`, px, h - p.bottom + 14);
      }

      // Horizontal Grid Lines
      const step = isVelocity ? 2 : 2;
      for (let y = yMin; y <= yMax; y += step) {
        const norm = (y - yMin) / (yMax - yMin);
        const py = h - p.bottom - norm * plotH;
        
        ctx.strokeStyle = y === 0 
          ? (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)')
          : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)');
        ctx.lineWidth = y === 0 ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(p.left, py);
        ctx.lineTo(w - p.right, py);
        ctx.stroke();

        ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${y}`, p.left - 6, py + 3);
      }

      // Axis labels
      ctx.fillStyle = isDark ? '#cbd5e1' : '#0f172a';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Time (seconds)', p.left + plotW / 2, h - 8);

      ctx.save();
      ctx.translate(14, p.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yAxisLabel, 0, 0);
      ctx.restore();
    }

    // --- Primary Canvas Render (Levels 1 to 5) ---
    renderPrimary() {
      if (!this.pCtx || !this.pW || !this.pH) return;
      const ctx = this.pCtx;
      const w = this.pW;
      const h = this.pH;
      const isDark = this.isDarkMode();

      if (this.graphMode === 'xt') {
        this.drawGrid(ctx, w, h, 0, this.tMax, this.xMin, this.xMax, 'Position x (meters)');

        // Draw Section Highlight Shade
        if (this.highlightSectionIdx !== null && this.segments[this.highlightSectionIdx]) {
          const seg = this.segments[this.highlightSectionIdx];
          const px0 = this.timeToPixel(seg.t0, w);
          const px1 = this.timeToPixel(seg.t1, w);
          ctx.fillStyle = isDark ? 'rgba(56,189,248,0.15)' : 'rgba(2,132,199,0.12)';
          ctx.fillRect(px0, this.padding.top, px1 - px0, h - this.padding.top - this.padding.bottom);
        }

        // Draw Slope Triangle if active
        if (this.slopeTriangle) {
          const st = this.slopeTriangle;
          const px1 = this.timeToPixel(st.p1.t, w);
          const py1 = this.posToPixel(st.p1.x, h);
          const px2 = this.timeToPixel(st.p2.t, w);
          const py2 = this.posToPixel(st.p2.x, h);

          // Horizontal Run dashed line
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px1, py1);
          ctx.lineTo(px2, py1);
          ctx.stroke();

          // Vertical Rise dashed line
          ctx.strokeStyle = '#f43f5e';
          ctx.beginPath();
          ctx.moveTo(px2, py1);
          ctx.lineTo(px2, py2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Labels
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`Δt = ${st.labelRun || ''}`, (px1 + px2) / 2, py1 + 14);

          ctx.fillStyle = '#f43f5e';
          ctx.textAlign = 'left';
          ctx.fillText(`Δx = ${st.labelRise || ''}`, px2 + 6, (py1 + py2) / 2);
        }

        // Draw 3-segment journey
        for (let i = 0; i < this.segments.length; i++) {
          const seg = this.segments[i];
          const color = this.getContrastColor(seg.color);
          const isHighlighted = this.highlightSectionIdx === null || this.highlightSectionIdx === i;

          ctx.strokeStyle = isHighlighted ? color : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)');
          ctx.lineWidth = isHighlighted ? 4 : 2;
          ctx.beginPath();
          ctx.moveTo(this.timeToPixel(seg.t0, w), this.posToPixel(seg.x0, h));
          ctx.lineTo(this.timeToPixel(seg.t1, w), this.posToPixel(seg.x1, h));
          ctx.stroke();

          // Endpoint dots
          const px = this.timeToPixel(seg.t1, w);
          const py = this.posToPixel(seg.x1, h);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Current scrubber point
        const state = this.getStateAtTime(this.currentTime);
        const curPx = this.timeToPixel(this.currentTime, w);
        const curPy = this.posToPixel(state.x, h);

        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(curPx, this.padding.top);
        ctx.lineTo(curPx, h - this.padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ccff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(curPx, curPy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

      } else if (this.graphMode === 'vt') {
        // Level 4 & Level 5: Velocity-Time Graph Mode
        this.drawGrid(ctx, w, h, 0, this.tMax, this.vMin, this.vMax, 'Velocity v (m/s)', true);

        // Draw horizontal velocity steps
        for (let i = 0; i < this.segments.length; i++) {
          const seg = this.segments[i];
          const color = this.getContrastColor(seg.color);
          const isHighlighted = this.highlightSectionIdx === null || this.highlightSectionIdx === i;
          const px0 = this.timeToPixel(seg.t0, w);
          const px1 = this.timeToPixel(seg.t1, w);
          const py = this.velToPixel(seg.v, h);

          // Horizontal flat bar
          ctx.strokeStyle = isHighlighted ? color : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)');
          ctx.lineWidth = isHighlighted ? 5 : 2;
          ctx.beginPath();
          ctx.moveTo(px0, py);
          ctx.lineTo(px1, py);
          ctx.stroke();

          // Value tag (shown in Level 4, or when hideValueTags is false)
          if (!this.hideValueTags) {
            ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${seg.v >= 0 ? '+' : ''}${seg.v} m/s`, (px0 + px1) / 2, py - 8);
          }

          // Vertical transition connector
          if (i < this.segments.length - 1) {
            const nextSeg = this.segments[i + 1];
            const nextPy = this.velToPixel(nextSeg.v, h);
            ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
            ctx.setLineDash([2, 2]);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px1, py);
            ctx.lineTo(px1, nextPy);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // Current scrubber line
        const state = this.getStateAtTime(this.currentTime);
        const curPx = this.timeToPixel(this.currentTime, w);
        const curPy = this.velToPixel(state.v, h);

        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(curPx, this.padding.top);
        ctx.lineTo(curPx, h - this.padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(curPx, curPy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // --- Dual Mode Render (Level 6: Left x-t Source, Right v-t Student Target) ---
    renderDualLeft() {
      if (!this.dlCtx || !this.dlW || !this.dlH) return;
      const ctx = this.dlCtx;
      const w = this.dlW;
      const h = this.dlH;
      const isDark = this.isDarkMode();

      this.drawGrid(ctx, w, h, 0, this.tMax, this.xMin, this.xMax, 'Position x (m)');

      // Draw 3-segment source path
      for (const seg of this.segments) {
        const color = this.getContrastColor(seg.color);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(this.timeToPixel(seg.t0, w), this.posToPixel(seg.x0, h));
        ctx.lineTo(this.timeToPixel(seg.t1, w), this.posToPixel(seg.x1, h));
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.timeToPixel(seg.t1, w), this.posToPixel(seg.x1, h), 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Scrubber time line
      const state = this.getStateAtTime(this.currentTime);
      const curPx = this.timeToPixel(this.currentTime, w);
      const curPy = this.posToPixel(state.x, h);
      ctx.fillStyle = '#ccff00';
      ctx.beginPath();
      ctx.arc(curPx, curPy, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    renderDualRight() {
      if (!this.drCtx || !this.drW || !this.drH) return;
      const ctx = this.drCtx;
      const w = this.drW;
      const h = this.drH;
      const isDark = this.isDarkMode();

      this.drawGrid(ctx, w, h, 0, this.tMax, this.vMin, this.vMax, 'Velocity v (m/s)', true);

      // Render Student Draggable Velocity Bars
      for (let i = 0; i < this.studentVelocityBars.length; i++) {
        const bar = this.studentVelocityBars[i];
        const px0 = this.timeToPixel(bar.t0, w);
        const px1 = this.timeToPixel(bar.t1, w);
        const py = this.velToPixel(bar.v, h);
        const isDragging = this.draggingBarIdx === i;

        // Glowing track bounds
        ctx.fillStyle = isDragging 
          ? (isDark ? 'rgba(56,189,248,0.18)' : 'rgba(2,132,199,0.15)')
          : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)');
        ctx.fillRect(px0, this.padding.top, px1 - px0, h - this.padding.top - this.padding.bottom);

        // Draggable Horizontal Velocity Bar
        ctx.strokeStyle = isDragging ? '#facc15' : '#38bdf8';
        ctx.lineWidth = isDragging ? 6 : 4;
        ctx.beginPath();
        ctx.moveTo(px0, py);
        ctx.lineTo(px1, py);
        ctx.stroke();

        // Left and Right Drag Handles
        ctx.fillStyle = isDragging ? '#facc15' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(px0, py, isDragging ? 7 : 5, 0, Math.PI * 2);
        ctx.arc(px1, py, isDragging ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();

        // Center readout tag
        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`v = ${bar.v >= 0 ? '+' : ''}${bar.v} m/s`, (px0 + px1) / 2, py - 9);
      }
    }

    // --- 1D Number Line Track Canvas Render (Exact Match to Position vs Time Studio) ---
    renderTrack() {
      if (!this.tCtx || !this.tW || !this.tH) return;
      const ctx = this.tCtx;
      const w = this.tW;
      const h = this.tH;
      const isDark = this.isDarkMode();

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = isDark ? '#040804' : '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      const trackY = Math.floor(h * 0.58);
      const tPad = 40;

      // Track Lane (Padded asphalt run)
      ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(tPad - 15, trackY - 22, w - (tPad - 15) * 2, 44);

      // Track Baseline
      ctx.lineWidth = 3;
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.45)' : '#0284c7';
      ctx.beginPath();
      ctx.moveTo(tPad, trackY);
      ctx.lineTo(w - tPad, trackY);
      ctx.stroke();

      // Number Line Markers (every 2m: 0m, 2m, 4m, 6m, 8m, 10m, 12m, 14m, 16m, 18m)
      for (let xPos = 0; xPos <= this.xMax; xPos += 2) {
        const px = this.trackPosToPixel(xPos);

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = xPos === 0 ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#64748b' : '#94a3b8');
        ctx.beginPath();
        ctx.moveTo(px, trackY - 6);
        ctx.lineTo(px, trackY + 6);
        ctx.stroke();

        ctx.fillStyle = xPos === 0 ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#f1f5f9' : '#0f172a');
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${xPos}m`, px, trackY + 22);
      }

      // Start Flag at 0m
      const originPx = this.trackPosToPixel(0);
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏁', originPx, trackY - 14);

      // Single Car Position & Velocity
      const state = this.getStateAtTime(this.currentTime);
      const carPx = this.trackPosToPixel(state.x);

      // Velocity direction arrow
      if (Math.abs(state.v) > 0.05) {
        const arrowLen = Math.max(-35, Math.min(35, state.v * 6));
        const arrowColor = state.v > 0 ? (isDark ? '#38bdf8' : '#0369a1') : (isDark ? '#f43f5e' : '#be123c');
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = arrowColor;
        ctx.beginPath();
        ctx.moveTo(carPx, trackY - 26);
        ctx.lineTo(carPx + arrowLen, trackY - 26);
        ctx.stroke();

        const arrowDir = state.v > 0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(carPx + arrowLen, trackY - 26);
        ctx.lineTo(carPx + arrowLen - arrowDir * 5, trackY - 29);
        ctx.lineTo(carPx + arrowLen - arrowDir * 5, trackY - 23);
        ctx.fillStyle = arrowColor;
        ctx.fill();
      }

      // Cyber Car Sprite (Exact replica from position_time_graph_studio)
      ctx.save();
      ctx.translate(carPx, trackY - 2);

      const carBorder = isDark ? '#38bdf8' : '#0284c7';
      ctx.fillStyle = isDark ? '#0f172a' : '#334155';
      ctx.strokeStyle = carBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-15, -12, 30, 14, 4);
      ctx.fill();
      ctx.stroke();

      // Cyber Car Cockpit Window
      ctx.fillStyle = carBorder;
      ctx.fillRect(-6, -10, 12, 5);

      // Cyber Car Wheels
      ctx.fillStyle = isDark ? '#020617' : '#0f172a';
      ctx.fillRect(-13, 0, 7, 5);
      ctx.fillRect(6, 0, 7, 5);

      ctx.restore();

      // Clear Floating Position Badge above Car
      ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${state.x.toFixed(1)}m`, carPx, trackY - 32);
    }
  }

  // --- Parameterized Problem Scenarios & Seeding ---
  // Clean integer math: Δx / Δt produces round velocities
  const SCENARIOS = [
    // Scenario 0: Forward (0-4s: 0 -> 12m, dx=+12, v=+3), Stopped (4-7s: 12 -> 12m, dx=0, v=0), Reverse (7-10s: 12 -> 6m, dx=-6, v=-2)
    {
      id: 0,
      segments: [
        { t0: 0, t1: 4, x0: 0, x1: 12, color: '#38bdf8' },
        { t0: 4, t1: 7, x0: 12, x1: 12, color: '#facc15' },
        { t0: 7, t1: 10, x0: 12, x1: 6, color: '#f43f5e' }
      ],
      sec1: { dir: 'forward', dx: 12, dt: 4, v: 3, label: '0s to 4s' },
      sec2: { dir: 'stopped', dx: 0, dt: 3, v: 0, label: '4s to 7s' },
      sec3: { dir: 'backward', dx: -6, dt: 3, v: -2, label: '7s to 10s' }
    },
    // Scenario 1: Reverse fast (0-3s: 14 -> 2m, dx=-12, v=-4), Stopped (3-6s: 2 -> 2m, dx=0, v=0), Forward (6-10s: 2 -> 14m, dx=+12, v=+3)
    {
      id: 1,
      segments: [
        { t0: 0, t1: 3, x0: 14, x1: 2, color: '#f43f5e' },
        { t0: 3, t1: 6, x0: 2, x1: 2, color: '#facc15' },
        { t0: 6, t1: 10, x0: 2, x1: 14, color: '#38bdf8' }
      ],
      sec1: { dir: 'backward', dx: -12, dt: 3, v: -4, label: '0s to 3s' },
      sec2: { dir: 'stopped', dx: 0, dt: 3, v: 0, label: '3s to 6s' },
      sec3: { dir: 'forward', dx: 12, dt: 4, v: 3, label: '6s to 10s' }
    },
    // Scenario 2: Stopped at start (0-3s: at 6m, dx=0, v=0), Forward Fast (3-6s: 6 -> 18m, dx=+12, v=+4), Reverse (6-10s: 18 -> 10m, dx=-8, v=-2)
    {
      id: 2,
      segments: [
        { t0: 0, t1: 3, x0: 6, x1: 6, color: '#facc15' },
        { t0: 3, t1: 6, x0: 6, x1: 18, color: '#38bdf8' },
        { t0: 6, t1: 10, x0: 18, x1: 10, color: '#f43f5e' }
      ],
      sec1: { dir: 'stopped', dx: 0, dt: 3, v: 0, label: '0s to 3s' },
      sec2: { dir: 'forward', dx: 12, dt: 3, v: 4, label: '3s to 6s' },
      sec3: { dir: 'backward', dx: -8, dt: 4, v: -2, label: '6s to 10s' }
    },
    // Scenario 3: Forward (0-3s: 2 -> 11m, dx=+9, v=+3), Reverse (3-7s: 11 -> 3m, dx=-8, v=-2), Stopped (7-10s: at 3m, dx=0, v=0)
    {
      id: 3,
      segments: [
        { t0: 0, t1: 3, x0: 2, x1: 11, color: '#38bdf8' },
        { t0: 3, t1: 7, x0: 11, x1: 3, color: '#f43f5e' },
        { t0: 7, t1: 10, x0: 3, x1: 3, color: '#facc15' }
      ],
      sec1: { dir: 'forward', dx: 9, dt: 3, v: 3, label: '0s to 3s' },
      sec2: { dir: 'backward', dx: -8, dt: 4, v: -2, label: '3s to 7s' },
      sec3: { dir: 'stopped', dx: 0, dt: 3, v: 0, label: '7s to 10s' }
    },
    // Scenario 4: Reverse (0-4s: 16 -> 8m, dx=-8, v=-2), Stopped (4-7s: at 8m, dx=0, v=0), Forward (7-10s: 8 -> 17m, dx=+9, v=+3)
    {
      id: 4,
      segments: [
        { t0: 0, t1: 4, x0: 16, x1: 8, color: '#f43f5e' },
        { t0: 4, t1: 7, x0: 8, x1: 8, color: '#facc15' },
        { t0: 7, t1: 10, x0: 8, x1: 17, color: '#38bdf8' }
      ],
      sec1: { dir: 'backward', dx: -8, dt: 4, v: -2, label: '0s to 4s' },
      sec2: { dir: 'stopped', dx: 0, dt: 3, v: 0, label: '4s to 7s' },
      sec3: { dir: 'forward', dx: 9, dt: 3, v: 3, label: '7s to 10s' }
    },
    // Scenario 5: Forward gentle (0-4s: 1 -> 5m, dx=+4, v=+1), Forward fast (4-7s: 5 -> 14m, dx=+9, v=+3), Reverse (7-10s: 14 -> 2m, dx=-12, v=-4)
    {
      id: 5,
      segments: [
        { t0: 0, t1: 4, x0: 1, x1: 5, color: '#38bdf8' },
        { t0: 4, t1: 7, x0: 5, x1: 14, color: '#a855f7' },
        { t0: 7, t1: 10, x0: 14, x1: 2, color: '#f43f5e' }
      ],
      sec1: { dir: 'forward', dx: 4, dt: 4, v: 1, label: '0s to 4s' },
      sec2: { dir: 'forward', dx: 9, dt: 3, v: 3, label: '4s to 7s' },
      sec3: { dir: 'backward', dx: -12, dt: 3, v: -4, label: '7s to 10s' }
    },
    // Scenario 6: Stopped (0-3s: at 15m, dx=0, v=0), Reverse (3-7s: 15 -> 3m, dx=-12, v=-3), Forward (7-10s: 3 -> 9m, dx=+6, v=+2)
    {
      id: 6,
      segments: [
        { t0: 0, t1: 3, x0: 15, x1: 15, color: '#facc15' },
        { t0: 3, t1: 7, x0: 15, x1: 3, color: '#f43f5e' },
        { t0: 7, t1: 10, x0: 3, x1: 9, color: '#38bdf8' }
      ],
      sec1: { dir: 'stopped', dx: 0, dt: 3, v: 0, label: '0s to 3s' },
      sec2: { dir: 'backward', dx: -12, dt: 4, v: -3, label: '3s to 7s' },
      sec3: { dir: 'forward', dx: 6, dt: 3, v: 2, label: '7s to 10s' }
    },
    // Scenario 7: Forward fast (0-3s: 2 -> 14m, dx=+12, v=+4), Stopped (3-6s: at 14m, dx=0, v=0), Reverse (6-10s: 14 -> 6m, dx=-8, v=-2)
    {
      id: 7,
      segments: [
        { t0: 0, t1: 3, x0: 2, x1: 14, color: '#38bdf8' },
        { t0: 3, t1: 6, x0: 14, x1: 14, color: '#facc15' },
        { t0: 6, t1: 10, x0: 14, x1: 6, color: '#f43f5e' }
      ],
      sec1: { dir: 'forward', dx: 12, dt: 3, v: 4, label: '0s to 3s' },
      sec2: { dir: 'stopped', dx: 0, dt: 3, v: 0, label: '3s to 6s' },
      sec3: { dir: 'backward', dx: -8, dt: 4, v: -2, label: '6s to 10s' }
    },
    // Scenario 8: Reverse (0-3s: 15 -> 9m, dx=-6, v=-2), Forward slow (3-6s: 9 -> 12m, dx=+3, v=+1), Reverse fast (6-10s: 12 -> 0m, dx=-12, v=-3)
    {
      id: 8,
      segments: [
        { t0: 0, t1: 3, x0: 15, x1: 9, color: '#f43f5e' },
        { t0: 3, t1: 6, x0: 9, x1: 12, color: '#38bdf8' },
        { t0: 6, t1: 10, x0: 12, x1: 0, color: '#f43f5e' }
      ],
      sec1: { dir: 'backward', dx: -6, dt: 3, v: -2, label: '0s to 3s' },
      sec2: { dir: 'forward', dx: 3, dt: 3, v: 1, label: '3s to 6s' },
      sec3: { dir: 'backward', dx: -12, dt: 4, v: -3, label: '6s to 10s' }
    },
    // Scenario 9: Forward (0-4s: 0 -> 12m, dx=+12, v=+3), Stopped (4-8s: at 12m, dx=0, v=0), Reverse (8-10s: 12 -> 4m, dx=-8, v=-4)
    {
      id: 9,
      segments: [
        { t0: 0, t1: 4, x0: 0, x1: 12, color: '#38bdf8' },
        { t0: 4, t1: 8, x0: 12, x1: 12, color: '#facc15' },
        { t0: 8, t1: 10, x0: 12, x1: 4, color: '#f43f5e' }
      ],
      sec1: { dir: 'forward', dx: 12, dt: 4, v: 3, label: '0s to 4s' },
      sec2: { dir: 'stopped', dx: 0, dt: 4, v: 0, label: '4s to 8s' },
      sec3: { dir: 'backward', dx: -8, dt: 2, v: -4, label: '8s to 10s' }
    }
  ];

  // --- Main Application Manager ---
  class DualStudioApp {
    constructor() {
      this.visualizer = new DualVisualizer();
      this.currentLevel = 1;
      this.currentStep = 0;
      this.levelScores = [0, 0, 0, 0, 0, 0];
      this.completedSteps = {};
      this.studentSeed = 0;
      this.hasPlayedCurrentStep = false;
      this.attemptOffsets = {}; // tracks how many reviews/retries per step

      this.initDOM();
      this.initApp();
    }

    hashString(str) {
      let hash = 2166136261;
      for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return Math.abs(hash);
    }

    getScenario(levelIdx, round = 0) {
      if (levelIdx <= 4) {
        // Levels 1-4: The 3 section questions investigate one consistent, cohesive trip
        const key = `L${levelIdx}`;
        const offset = this.attemptOffsets[key] || 0;
        const idx = (this.studentSeed + levelIdx * 19 + offset * 37) % SCENARIOS.length;
        return SCENARIOS[idx];
      } else {
        // Levels 5 and 6: 3 distinct graphs to analyze or translate (round = 0, 1, 2)
        const key = `L${levelIdx}_S${round}`;
        const offset = this.attemptOffsets[key] || 0;
        const idx = (this.studentSeed + levelIdx * 17 + (round + offset) * 31) % SCENARIOS.length;
        return SCENARIOS[idx];
      }
    }

    triggerConceptReview(title, conceptHtml) {
      const offsetKey = (this.currentLevel <= 4) ? `L${this.currentLevel}` : `L${this.currentLevel}_S${this.currentStep}`;
      this.attemptOffsets[offsetKey] = (this.attemptOffsets[offsetKey] || 0) + 1;
      this.hasPlayedCurrentStep = false;

      const modal = document.getElementById('conceptReviewModal');
      const titleEl = document.getElementById('reviewModalTitle');
      const bodyEl = document.getElementById('reviewModalBody');

      if (titleEl) titleEl.textContent = title;
      if (bodyEl) bodyEl.innerHTML = conceptHtml;
      if (modal) modal.classList.remove('hidden');

      sfx.error();
    }

    checkCarPlayed() {
      if (this.hasPlayedCurrentStep || this.visualizer.isPlaying || this.visualizer.currentTime > 0.1) {
        return true;
      }
      const playBtn = document.getElementById('btnPlayPause');
      if (playBtn) {
        playBtn.classList.add('play-prompt-glow');
        setTimeout(() => playBtn.classList.remove('play-prompt-glow'), 4000);
      }
      const fb = document.getElementById('stepFeedback');
      if (fb) {
        fb.className = 'p-3 rounded-xl text-xs font-sans bg-sky-950/80 border border-sky-400 text-sky-200 question-locked-banner';
        fb.innerHTML = '🏎️ <strong>Observe the motion first!</strong> Please click <strong>▶ Play Car</strong> above to watch how the car moves before answering.';
        fb.classList.remove('hidden');
      }
      sfx.click();
      return false;
    }

    initDOM() {
      // Navigation Tabs (Missions, Dual Sandbox, Help Guide)
      const tabs = document.querySelectorAll('.nav-tab');
      tabs.forEach(btn => {
        btn.addEventListener('click', () => {
          tabs.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const targetId = btn.dataset.tab;
          document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.add('hidden');
          });

          if (targetId === 'tab-missions') {
            const missionsBar = document.getElementById('tab-missions');
            const missionsWs = document.getElementById('tab-missions-workspace');
            if (missionsBar) missionsBar.classList.remove('hidden');
            if (missionsWs) missionsWs.classList.remove('hidden');
            this.switchLevel(this.currentLevel);
          } else {
            const activePanel = document.getElementById(targetId);
            if (activePanel) activePanel.classList.remove('hidden');
            // When in sandbox or help, hide missions progression bar
            const missionsBar = document.getElementById('tab-missions');
            if (missionsBar) missionsBar.classList.add('hidden');
          }

          sfx.click();

          if (targetId === 'tab-sandbox') {
            const modeLabel = document.getElementById('canvasModeLabel');
            if (modeLabel) modeLabel.textContent = 'Free-Play Dual Sandbox';
            // Run initial sandbox state
            const sbApply = document.getElementById('btnApplySandbox');
            if (sbApply) sbApply.click();
          }
        });
      });

      // Sandbox Presets & Reset
      const btnPreset1 = document.getElementById('btnSbPreset1');
      if (btnPreset1) {
        btnPreset1.addEventListener('click', () => {
          document.getElementById('sbVel1').value = '2.0';
          document.getElementById('sbVel2').value = '0.0';
          document.getElementById('sbVel3').value = '-2.0';
          sfx.click();
          const sbApply = document.getElementById('btnApplySandbox');
          if (sbApply) sbApply.click();
        });
      }

      const btnPreset2 = document.getElementById('btnSbPreset2');
      if (btnPreset2) {
        btnPreset2.addEventListener('click', () => {
          document.getElementById('sbVel1').value = '1.0';
          document.getElementById('sbVel2').value = '3.0';
          document.getElementById('sbVel3').value = '-3.0';
          sfx.click();
          const sbApply = document.getElementById('btnApplySandbox');
          if (sbApply) sbApply.click();
        });
      }

      const btnSbReset = document.getElementById('btnSbReset');
      if (btnSbReset) {
        btnSbReset.addEventListener('click', () => {
          document.getElementById('sbVel1').value = '0.0';
          document.getElementById('sbVel2').value = '0.0';
          document.getElementById('sbVel3').value = '0.0';
          sfx.click();
          const sbApply = document.getElementById('btnApplySandbox');
          if (sbApply) sbApply.click();
        });
      }

      // Level Buttons
      document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const lvl = parseInt(btn.dataset.level, 10);
          this.switchLevel(lvl);
        });
      });

      // Simulation Controls
      const playBtn = document.getElementById('btnPlayPause');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          this.hasPlayedCurrentStep = true;
          playBtn.classList.remove('play-prompt-glow');
          const fb = document.getElementById('stepFeedback');
          if (fb && fb.classList.contains('question-locked-banner')) {
            fb.classList.add('hidden');
          }
          this.visualizer.togglePlay();
        });
      }

      const resetBtn = document.getElementById('btnResetSim');
      if (resetBtn) resetBtn.addEventListener('click', () => this.visualizer.reset());

      const scrubber = document.getElementById('timeScrubber');
      if (scrubber) {
        scrubber.addEventListener('input', (e) => {
          this.visualizer.setTime(parseFloat(e.target.value));
        });
      }

      const minusBtn = document.getElementById('btnTimeMinus');
      if (minusBtn) {
        minusBtn.addEventListener('click', () => {
          this.visualizer.setTime(Math.max(0, this.visualizer.currentTime - 1.0));
        });
      }

      const plusBtn = document.getElementById('btnTimePlus');
      if (plusBtn) {
        plusBtn.addEventListener('click', () => {
          this.visualizer.setTime(Math.min(10, this.visualizer.currentTime + 1.0));
        });
      }

      // Section Jump Chips
      document.querySelectorAll('.section-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          document.querySelectorAll('.section-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          const secIdx = parseInt(chip.dataset.section, 10);
          if (this.visualizer.segments[secIdx]) {
            this.visualizer.setTime(this.visualizer.segments[secIdx].t0);
            this.visualizer.setHighlightSection(secIdx);
          }
        });
      });

      // Sound Toggle
      const soundBtn = document.getElementById('btnSoundToggle');
      const soundIcon = document.getElementById('soundIcon');
      if (soundBtn) {
        soundBtn.addEventListener('click', () => {
          sfx.enabled = !sfx.enabled;
          if (soundIcon) soundIcon.textContent = sfx.enabled ? '🔊' : '🔇';
        });
      }

      // Theme Toggle
      const themeBtn = document.getElementById('btnThemeToggle');
      const themeIcon = document.getElementById('themeIcon');
      if (themeBtn) {
        themeBtn.addEventListener('click', () => {
          const isDark = document.documentElement.classList.toggle('dark');
          localStorage.setItem('dual_studio_theme', isDark ? 'dark' : 'light');
          if (themeIcon) themeIcon.textContent = isDark ? '☀️' : '🌙';
          this.visualizer.resizeCanvases();
        });
      }

      // Alert Dismiss
      const btnDismissAlert = document.getElementById('btnDismissAlert');
      if (btnDismissAlert) {
        btnDismissAlert.addEventListener('click', () => {
          const b = document.getElementById('redAlertBanner');
          if (b) b.classList.add('hidden');
        });
      }

      // Certificate Modal Controls
      const btnViewCert = document.getElementById('btnViewCert');
      if (btnViewCert) btnViewCert.addEventListener('click', () => this.showCertificate());
      const btnCloseCert = document.getElementById('btnCloseCert');
      if (btnCloseCert) btnCloseCert.addEventListener('click', () => this.hideCertificate());
      const btnCloseCert2 = document.getElementById('btnCloseCert2');
      if (btnCloseCert2) btnCloseCert2.addEventListener('click', () => this.hideCertificate());

      // Concept Review Dismiss Button
      const btnDismissReview = document.getElementById('btnDismissReview');
      if (btnDismissReview) {
        btnDismissReview.addEventListener('click', () => {
          const modal = document.getElementById('conceptReviewModal');
          if (modal) modal.classList.add('hidden');
          sfx.click();
          this.loadStep();
        });
      }

      // Guest explore button
      const guestBtn = document.getElementById('btnContinueGuest');
      if (guestBtn) {
        guestBtn.addEventListener('click', () => {
          const gate = document.getElementById('loginGateModal');
          if (gate) gate.classList.add('hidden');
        });
      }

      // Google gate login button
      const gateLoginBtn = document.getElementById('btnGateSignIn');
      if (gateLoginBtn && window.authManager) {
        gateLoginBtn.addEventListener('click', () => window.authManager.signIn());
      }

      // Grade submit button
      const submitBtn = document.getElementById('btnSubmitGrade');
      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          const total = this.getTotalScore();
          if (window.authManager && window.authManager.currentUser) {
            window.authManager.saveStudioGrade(total, {
              levelScores: this.levelScores,
              completedSteps: this.completedSteps,
              currentLevel: this.currentLevel,
              currentStep: this.currentStep
            }, false);
          } else {
            alert(`Score: ${total}/100 pts. Please sign in to sync your grade!`);
          }
        });
      }

      // Sandbox Tab Apply Button
      const sbApply = document.getElementById('btnApplySandbox');
      if (sbApply) {
        sbApply.addEventListener('click', () => {
          const v1 = parseFloat(document.getElementById('sbVel1').value) || 0;
          const v2 = parseFloat(document.getElementById('sbVel2').value) || 0;
          const v3 = parseFloat(document.getElementById('sbVel3').value) || 0;

          const x0 = 0;
          const x1 = x0 + v1 * 3;
          const x2 = x1 + v2 * 3;
          const x3 = x2 + v3 * 4;

          this.visualizer.setMode('dual');
          this.visualizer.set3Segments([
            { t0: 0, t1: 3, x0, x1, color: '#ccff00' },
            { t0: 3, t1: 6, x0: x1, x1: x2, color: '#facc15' },
            { t0: 6, t1: 10, x0: x2, x1: x3, color: '#38bdf8' }
          ]);
          this.visualizer.setupDualBars([
            { t0: 0, t1: 3, expectedV: v1 },
            { t0: 3, t1: 6, expectedV: v2 },
            { t0: 6, t1: 10, expectedV: v3 }
          ]);
          this.visualizer.play();
        });
      }
    }

    initApp() {
      // Restore Theme
      const savedTheme = localStorage.getItem('dual_studio_theme');
      if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) themeIcon.textContent = '🌙';
      }

      this.switchLevel(1);
    }

    onStudentLoggedIn(studentId) {
      this.studentSeed = this.hashString(studentId);
      this.switchLevel(this.currentLevel);
    }

    restoreSavedState(studioState, score) {
      if (!studioState) return;

      // Restore level scores (handle both array and object formats)
      if (Array.isArray(studioState.levelScores)) {
        this.levelScores = studioState.levelScores.slice(0, 6);
        while (this.levelScores.length < 6) this.levelScores.push(0);
      } else if (studioState.levelScores && typeof studioState.levelScores === 'object') {
        // Legacy object format from guest state: {m1: 15, m2: 15, ...}
        this.levelScores = [
          studioState.levelScores.m1 || studioState.levelScores[0] || 0,
          studioState.levelScores.m2 || studioState.levelScores[1] || 0,
          studioState.levelScores.m3 || studioState.levelScores[2] || 0,
          studioState.levelScores.m4 || studioState.levelScores[3] || 0,
          studioState.levelScores.m5 || studioState.levelScores[4] || 0,
          studioState.levelScores.m6 || studioState.levelScores[5] || 0
        ];
      }

      // Restore completed steps
      if (studioState.completedSteps && typeof studioState.completedSteps === 'object') {
        this.completedSteps = { ...studioState.completedSteps };
      }

      // Restore position (level and step)
      if (typeof studioState.currentLevel === 'number' && studioState.currentLevel >= 1 && studioState.currentLevel <= 6) {
        this.currentLevel = studioState.currentLevel;
      }
      if (typeof studioState.currentStep === 'number') {
        this.currentStep = studioState.currentStep;
      }

      // Refresh UI
      this.updateScoreDisplay();
      this.switchLevel(this.currentLevel);

      console.log(`[DualStudio] Restored state: score=${score}, levels=${this.levelScores}, completed=${Object.keys(this.completedSteps).length} steps`);
    }

    getTotalScore() {
      return this.levelScores.reduce((a, b) => a + b, 0);
    }

    updateScoreDisplay() {
      const total = this.getTotalScore();
      const totalDisplay = document.getElementById('totalPointsDisplay');
      const percentDisplay = document.getElementById('scorePercentDisplay');
      const circle = document.getElementById('scoreProgressCircle');
      const badge = document.getElementById('badgeCompletion');

      if (totalDisplay) totalDisplay.textContent = total;
      if (percentDisplay) percentDisplay.textContent = `(${total}%)`;
      if (circle) {
        const offset = 125.6 - (total / 100) * 125.6;
        circle.style.strokeDashoffset = offset;
      }
      if (badge) {
        if (total >= 100) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
      }

      // Update level button points
      for (let i = 1; i <= 6; i++) {
        const el = document.getElementById(`m${i}-status`);
        const maxPts = (i === 3 || i === 6) ? 20 : 15;
        if (el) el.textContent = `${this.levelScores[i - 1]}/${maxPts}`;
        const btn = document.querySelector(`.level-btn[data-level="${i}"]`);
        if (btn) {
          if (this.levelScores[i - 1] >= maxPts) btn.classList.add('completed');
          else btn.classList.remove('completed');
        }
      }

      // Autosave if logged in
      if (window.authManager && window.authManager.currentUser) {
        window.authManager.saveStudioGrade(total, {
          levelScores: this.levelScores,
          completedSteps: this.completedSteps,
          currentLevel: this.currentLevel,
          currentStep: this.currentStep
        }, true);
      }
    }

    switchLevel(level) {
      this.currentLevel = level;
      this.currentStep = 0;

      // Update button styles
      document.querySelectorAll('.level-btn').forEach(b => {
        if (parseInt(b.dataset.level, 10) === level) b.classList.add('active');
        else b.classList.remove('active');
      });

      const alertBanner = document.getElementById('redAlertBanner');
      if (level === 4 || level === 5 || level === 6) {
        if (alertBanner && level === 4) alertBanner.classList.remove('hidden');
        else if (alertBanner) alertBanner.classList.add('hidden');
        if (level === 4 || level === 6) sfx.alert();
      } else {
        if (alertBanner) alertBanner.classList.add('hidden');
      }

      const modeLabel = document.getElementById('canvasModeLabel');

      if (level === 6) {
        this.visualizer.setMode('dual');
        this.visualizer.hideValueTags = false;
        if (modeLabel) modeLabel.textContent = 'Level 6: Dual-Graph Translation';
      } else if (level === 4 || level === 5) {
        this.visualizer.setMode('vt');
        this.visualizer.hideValueTags = (level === 5); // In Level 5, students read values off the v-t graph axis
        if (modeLabel) modeLabel.textContent = level === 4 ? 'Level 4: Velocity vs. Time (v-t)' : 'Level 5: Velocity Table (from v-t graph)';
      } else {
        this.visualizer.setMode('xt');
        this.visualizer.hideValueTags = false;
        const names = ['', 'Direction', 'Displacement Δx', 'Slope to Velocity', 'v-t Alert', 'Velocity Table', 'Dual Translation'];
        if (modeLabel) modeLabel.textContent = `Level ${level}: ${names[level]}`;
      }

      this.loadStep();
    }

    loadStep() {
      const workspace = document.getElementById('activeStepWorkspace');
      if (!workspace) return;

      const stepKey = `L${this.currentLevel}_S${this.currentStep}`;
      this.hasPlayedCurrentStep = !!this.completedSteps[stepKey];

      const sc = this.getScenario(this.currentLevel, this.currentStep);
      this.visualizer.set3Segments(sc.segments);

      if (this.currentLevel === 5) {
        this.visualizer.setMode('vt');
        this.visualizer.hideValueTags = true;
      }

      if (this.currentLevel === 1) this.renderLevel1(workspace, sc);
      else if (this.currentLevel === 2) this.renderLevel2(workspace, sc);
      else if (this.currentLevel === 3) this.renderLevel3(workspace, sc);
      else if (this.currentLevel === 4) this.renderLevel4(workspace, sc);
      else if (this.currentLevel === 5) this.renderLevel5(workspace, sc);
      else if (this.currentLevel === 6) this.renderLevel6(workspace, sc);
    }

    // =========================================================================
    // LEVEL 1: 3-SECTION MOTION DIRECTION (Forward, Stopped, Backward)
    // =========================================================================
    renderLevel1(ws, sc) {
      const stepKey = `L1_S${this.currentStep}`;
      const isDone = !!this.completedSteps[stepKey];
      const secIdx = this.currentStep; // 0 = Section 1, 1 = Section 2, 2 = Section 3
      const sec = secIdx === 0 ? sc.sec1 : (secIdx === 1 ? sc.sec2 : sc.sec3);
      const seg = sc.segments[secIdx];

      ws.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-sky-500/20 pb-2">
            <div>
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">Level 1 • Qualitative Motion</span>
              <h2 class="text-base font-bold text-white">Question ${secIdx + 1} of 3: Section ${secIdx + 1} Direction</h2>
            </div>
            <span class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-sky-950 border border-sky-500/30 text-sky-300">5 pts</span>
          </div>

          <div class="p-3 rounded-xl bg-slate-950/60 border border-sky-500/30 text-xs font-sans text-slate-200 leading-relaxed space-y-1">
            <p>Inspect <strong>Section ${secIdx + 1} (${sec.label})</strong> on the graph. As time ticks from ${seg.t0}s to ${seg.t1}s, what is the car doing?</p>
            <p class="text-slate-400 text-[11px]">💡 Watch the Ground Track cyber car or scrub the time slider!</p>
          </div>

          <div class="space-y-2">
            <button class="choice-btn w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-left text-xs font-mono text-white transition-all flex items-center justify-between" data-choice="forward">
              <span>A) Moving Forward (position is increasing)</span>
              <span class="text-sky-300 font-bold">↗</span>
            </button>
            <button class="choice-btn w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-left text-xs font-mono text-white transition-all flex items-center justify-between" data-choice="stopped">
              <span>B) Stopped at rest (position is not changing)</span>
              <span class="text-amber-300 font-bold">―</span>
            </button>
            <button class="choice-btn w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-left text-xs font-mono text-white transition-all flex items-center justify-between" data-choice="backward">
              <span>C) Moving Backward (heading back toward 0m)</span>
              <span class="text-rose-300 font-bold">↘</span>
            </button>
          </div>

          <div id="stepFeedback" class="hidden p-3 rounded-xl text-xs font-sans"></div>
          <button id="btnNextStep" class="hidden w-full py-2.5 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#a855f7] text-slate-950 font-mono font-bold text-xs hover:brightness-110 transition-all shadow-[0_0_10px_rgba(56,189,248,0.3)]">
            ${secIdx < 2 ? 'Next Section Question ➜' : 'Level 1 Complete! Go to Level 2 ➜'}
          </button>
        </div>
      `;

      this.visualizer.setHighlightSection(secIdx);
      this.visualizer.setTime(seg.t0);

      ws.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!this.checkCarPlayed()) return;
          const choice = btn.dataset.choice;
          const correct = sec.dir;
          const fb = document.getElementById('stepFeedback');
          const nextBtn = document.getElementById('btnNextStep');

          if (choice === correct) {
            sfx.success();
            btn.classList.add('bg-emerald-950', 'border-emerald-500', 'text-emerald-300');
            fb.className = 'p-3 rounded-xl text-xs font-sans bg-emerald-950/70 border border-emerald-500/40 text-emerald-200';
            const actionText = correct === 'forward' 
              ? 'slopes upward, so the car is driving forward.' 
              : (correct === 'stopped' ? 'is horizontal, so the car is stopped at rest.' : 'slopes downward, so the car is moving backward in reverse.');
            fb.innerHTML = `<strong>⭐ Correct!</strong> In Section ${secIdx + 1}, the line ${actionText}`;
            fb.classList.remove('hidden');
            nextBtn.classList.remove('hidden');

            if (!this.completedSteps[stepKey]) {
              this.completedSteps[stepKey] = true;
              this.levelScores[0] = Math.min(15, this.levelScores[0] + 5);
              this.updateScoreDisplay();
            }
          } else {
            btn.classList.add('bg-rose-950', 'border-rose-500', 'text-rose-300');
            this.triggerConceptReview(
              `Review: Direction on Position-Time Graphs`,
              `
                <p>On a <strong>Position vs. Time (x-t)</strong> graph, the direction of motion is given by the <strong>slope</strong> of the line:</p>
                <div class="space-y-1.5 font-mono text-[11px] my-2 p-2.5 rounded bg-black/40 border border-white/10">
                  <div class="text-sky-300">↗ Slopes UP = Moving Forward (position increases)</div>
                  <div class="text-amber-300">― FLAT line = Stopped at rest (position does not change)</div>
                  <div class="text-rose-300">↘ Slopes DOWN = Moving Backward (heading in reverse toward 0m)</div>
                </div>
                <p>Take a breath, watch the cyber car, and see which way the position number line changes!</p>
              `
            );
          }
        });
      });

      const nextBtn = document.getElementById('btnNextStep');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (this.currentStep < 2) {
            this.currentStep++;
            this.loadStep();
          } else {
            sfx.fanfare();
            this.switchLevel(2);
          }
        });
      }
    }

    // =========================================================================
    // LEVEL 2: SECTION DISPLACEMENT (How Far Did It Go?)
    // =========================================================================
    renderLevel2(ws, sc) {
      const stepKey = `L2_S${this.currentStep}`;
      const sec = this.currentStep === 0 ? sc.sec1 : (this.currentStep === 1 ? sc.sec2 : sc.sec3);
      const secIdx = this.currentStep;

      ws.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-lime-400">Level 2 • Section Displacement</span>
              <h2 class="text-base font-bold text-white">Section ${secIdx + 1} (${sec.label}): Distance Traveled</h2>
            </div>
            <span class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-lime-950 border border-lime-500/30 text-lime-300">5 pts</span>
          </div>

          <div class="p-3 rounded-xl bg-slate-950/60 border border-lime-500/30 text-xs font-sans text-slate-200 leading-relaxed space-y-1">
            <p>How far did the car travel in <strong>Section ${secIdx + 1} (${sec.label})</strong>?</p>
            <p class="text-slate-400 text-[11px]">Calculate change in position: <span class="font-mono text-lime-300 font-bold">Δx = x_final - x_initial</span></p>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-mono text-slate-300 mb-1">Displacement Δx (in meters):</label>
              <div class="flex items-center gap-2">
                <input id="inpDx" type="number" step="1" placeholder="for example: 6 or -6" class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm font-mono text-white outline-none focus:border-[#ccff00]">
                <span class="font-mono text-xs text-slate-400">meters</span>
              </div>
            </div>
            <button id="btnCheckDx" class="w-full py-2.5 rounded-xl bg-[#ccff00] text-slate-950 font-mono font-bold text-xs hover:bg-lime-300 transition-all shadow-[0_0_10px_rgba(204,255,0,0.3)]">
              Check Displacement
            </button>
          </div>

          <div id="stepFeedback" class="hidden p-3 rounded-xl text-xs font-sans"></div>
          <button id="btnNextStep" class="hidden w-full py-2.5 rounded-xl bg-[#ccff00] text-slate-950 font-mono font-bold text-xs hover:bg-lime-300 transition-all shadow-[0_0_10px_rgba(204,255,0,0.3)]">
            Next Section ➜
          </button>
        </div>
      `;

      this.visualizer.setHighlightSection(secIdx);

      const checkBtn = document.getElementById('btnCheckDx');
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          if (!this.checkCarPlayed()) return;
          const val = parseFloat(document.getElementById('inpDx').value);
          const fb = document.getElementById('stepFeedback');
          const nextBtn = document.getElementById('btnNextStep');

          if (Math.abs(val - sec.dx) < 0.05) {
            sfx.success();
            fb.className = 'p-3 rounded-xl text-xs font-sans bg-emerald-950/70 border border-emerald-500/40 text-emerald-200';
            fb.innerHTML = `<strong>⭐ Excellent!</strong> In Section ${secIdx + 1}, the car started at ${sc.segments[secIdx].x0}m and ended at ${sc.segments[secIdx].x1}m. Displacement = <strong>${sec.dx} m</strong>.`;
            fb.classList.remove('hidden');
            nextBtn.classList.remove('hidden');

            if (!this.completedSteps[stepKey]) {
              this.completedSteps[stepKey] = true;
              this.levelScores[1] = Math.min(15, this.levelScores[1] + 5);
              this.updateScoreDisplay();
            }
          } else {
            this.triggerConceptReview(
              `Review: Calculating Section Displacement (Δx)`,
              `
                <p>To find the displacement for a specific section, always subtract the starting position from the ending position:</p>
                <div class="my-2 p-2.5 rounded bg-black/40 border border-white/10 font-mono text-[11px] text-lime-300">
                  Δx = x_final - x_initial
                </div>
                <p>For Section ${secIdx + 1}:</p>
                <ul class="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                  <li>Start: <strong>${sc.segments[secIdx].x0} m</strong> at ${sc.segments[secIdx].t0}s</li>
                  <li>End: <strong>${sc.segments[secIdx].x1} m</strong> at ${sc.segments[secIdx].t1}s</li>
                  <li>Displacement: (${sc.segments[secIdx].x1}m) - (${sc.segments[secIdx].x0}m) = <strong>${sec.dx} m</strong></li>
                </ul>
                <p class="text-rose-300 text-[11px] mt-1">Remember: if the car moves backward, the displacement must be <strong>negative</strong>!</p>
              `
            );
          }
        });
      }

      const nextBtn = document.getElementById('btnNextStep');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (this.currentStep < 2) {
            this.currentStep++;
            this.loadStep();
          } else {
            sfx.fanfare();
            this.switchLevel(3);
          }
        });
      }
    }

    // =========================================================================
    // LEVEL 3: SLOPE TO VELOCITY (v = Δx ÷ Δt)
    // =========================================================================
    renderLevel3(ws, sc) {
      const stepKey = `L3_S${this.currentStep}`;
      const sec = this.currentStep === 0 ? sc.sec1 : (this.currentStep === 1 ? sc.sec2 : sc.sec3);
      const secIdx = this.currentStep;
      const pts = (secIdx === 2) ? 10 : 5; // 5 + 5 + 10 = 20

      ws.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-lime-400">Level 3 • Slope = Velocity</span>
              <h2 class="text-base font-bold text-white">Section ${secIdx + 1} (${sec.label}): Calculate Velocity</h2>
            </div>
            <span class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-lime-950 border border-lime-500/30 text-lime-300">${pts} pts</span>
          </div>

          <div class="p-3 rounded-xl bg-slate-950/60 border border-lime-500/30 text-xs font-sans text-slate-200 leading-relaxed space-y-1.5">
            <p>Determine the velocity of <strong>Section ${secIdx + 1}</strong> by finding the slope: <span class="font-mono text-lime-300 font-bold">v = Rise ÷ Run = Δx ÷ Δt</span></p>
            <div class="text-[11px] font-mono text-slate-300 bg-white/5 p-1.5 rounded">
              Δx = ${sec.dx} m, Δt = ${sec.dt} s
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-mono text-slate-300 mb-1">Velocity (Rise ÷ Run in m/s):</label>
              <div class="flex items-center gap-2">
                <input id="inpVel" type="number" step="0.5" placeholder="for example: 2 or -1.5" class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm font-mono text-white outline-none focus:border-[#ccff00]">
                <span class="font-mono text-xs text-slate-400">m/s</span>
              </div>
            </div>
            <button id="btnCheckVel" class="w-full py-2.5 rounded-xl bg-[#ccff00] text-slate-950 font-mono font-bold text-xs hover:bg-lime-300 transition-all shadow-[0_0_10px_rgba(204,255,0,0.3)]">
              Check Velocity
            </button>
          </div>

          <div id="stepFeedback" class="hidden p-3 rounded-xl text-xs font-sans"></div>
          <button id="btnNextStep" class="hidden w-full py-2.5 rounded-xl bg-[#ccff00] text-slate-950 font-mono font-bold text-xs hover:bg-lime-300 transition-all shadow-[0_0_10px_rgba(204,255,0,0.3)]">
            Next Slope ➜
          </button>
        </div>
      `;

      this.visualizer.setHighlightSection(secIdx);
      const seg = sc.segments[secIdx];
      this.visualizer.setSlopeTriangle(
        { t: seg.t0, x: seg.x0 },
        { t: seg.t1, x: seg.x1 },
        `${sec.dx}m`,
        `${sec.dt}s`
      );

      const checkBtn = document.getElementById('btnCheckVel');
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          if (!this.checkCarPlayed()) return;
          const val = parseFloat(document.getElementById('inpVel').value);
          const fb = document.getElementById('stepFeedback');
          const nextBtn = document.getElementById('btnNextStep');

          if (Math.abs(val - sec.v) < 0.05) {
            sfx.success();
            fb.className = 'p-3 rounded-xl text-xs font-sans bg-emerald-950/70 border border-emerald-500/40 text-emerald-200';
            fb.innerHTML = `<strong>⭐ Brilliant!</strong> ${sec.dx} m ÷ ${sec.dt} s = <strong>${sec.v} m/s</strong>.`;
            fb.classList.remove('hidden');
            nextBtn.classList.remove('hidden');

            if (!this.completedSteps[stepKey]) {
              this.completedSteps[stepKey] = true;
              this.levelScores[2] = Math.min(20, this.levelScores[2] + pts);
              this.updateScoreDisplay();
            }
          } else {
            this.triggerConceptReview(
              `Review: Calculating Velocity from Slope (Rise ÷ Run)`,
              `
                <p>The slope of a <strong>Position vs. Time</strong> line is its <strong>velocity</strong>:</p>
                <div class="my-2 p-2.5 rounded bg-black/40 border border-white/10 font-mono text-[11px] text-lime-300">
                  v = Rise ÷ Run = Δx ÷ Δt
                </div>
                <p>For Section ${secIdx + 1}:</p>
                <ul class="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                  <li>Displacement (Rise): <strong>${sec.dx} m</strong></li>
                  <li>Time Duration (Run): <strong>${sec.dt} s</strong></li>
                  <li>Velocity: ${sec.dx} m ÷ ${sec.dt} s = <strong>${sec.v} m/s</strong></li>
                </ul>
                <p class="text-rose-300 text-[11px] mt-1">If the line slopes downward, the rise (Δx) is negative, so velocity must also be <strong>negative</strong>!</p>
              `
            );
          }
        });
      }

      const nextBtn = document.getElementById('btnNextStep');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          this.visualizer.clearSlopeTriangle();
          if (this.currentStep < 2) {
            this.currentStep++;
            this.loadStep();
          } else {
            sfx.fanfare();
            this.switchLevel(4);
          }
        });
      }
    }

    // =========================================================================
    // LEVEL 4: VELOCITY VS TIME (v-t) BASICS (RED ALERT PARADIGM SHIFT)
    // =========================================================================
    renderLevel4(ws, sc) {
      const stepKey = `L4_S${this.currentStep}`;
      const secIdx = this.currentStep; // 0, 1, 2
      const sec = secIdx === 0 ? sc.sec1 : (secIdx === 1 ? sc.sec2 : sc.sec3);

      let qTitle = '';
      let qPrompt = '';
      let choices = [];
      let correctChoice = '';
      let explanation = '';

      if (secIdx === 0) {
        // Question 1: What do the horizontal flat bars on this graph represent?
        qTitle = 'Question 1 of 3: Flat Lines on v-t Graph';
        qPrompt = 'Take a look at the Velocity vs. Time (v-t) graph above. Each section is drawn as a horizontal flat line. What does a horizontal line mean on a <strong>Velocity</strong> graph?';
        choices = [
          { key: 'stopped', label: 'A) The car must be stopped at rest.' },
          { key: 'constant_v', label: 'B) The car is moving with CONSTANT velocity during that section.' },
          { key: 'speeding_up', label: 'C) The car is accelerating faster and faster.' }
        ];
        correctChoice = 'constant_v';
        explanation = 'On a Velocity vs. Time graph, a flat line means the velocity value stays the SAME number over time (constant speed), not that the car is stopped (unless the line is on 0 m/s)!';
      } else if (secIdx === 1) {
        // Question 2: Comparing Section Speeds directly from the active graph
        const absV1 = Math.abs(sc.sec1.v);
        const absV2 = Math.abs(sc.sec2.v);
        const absV3 = Math.abs(sc.sec3.v);
        const speeds = [
          { name: 'Section 1 (0-3s)', speed: absV1, v: sc.sec1.v },
          { name: 'Section 2 (3-6s)', speed: absV2, v: sc.sec2.v },
          { name: 'Section 3 (6-10s)', speed: absV3, v: sc.sec3.v }
        ];
        // Sort descending by speed
        speeds.sort((a, b) => b.speed - a.speed);
        const fastest = speeds[0];
        
        qTitle = 'Question 2 of 3: Identifying the Fastest Section';
        qPrompt = `Comparing the 3 sections on your active graph (Sec 1: ${sc.sec1.v} m/s, Sec 2: ${sc.sec2.v} m/s, Sec 3: ${sc.sec3.v} m/s), which section has the <strong>fastest speed</strong> (furthest distance from the 0 m/s axis line)?`;
        choices = [
          { key: 'sec1', label: `A) Section 1 (0-3s: ${sc.sec1.v} m/s)` },
          { key: 'sec2', label: `B) Section 2 (3-6s: ${sc.sec2.v} m/s)` },
          { key: 'sec3', label: `C) Section 3 (6-10s: ${sc.sec3.v} m/s)` }
        ];
        correctChoice = fastest.name.includes('Section 1') ? 'sec1' : (fastest.name.includes('Section 2') ? 'sec2' : 'sec3');
        explanation = `${fastest.name} has the greatest magnitude (|v| = ${fastest.speed} m/s). Speed is the distance away from zero on the velocity axis!`;
      } else {
        // Question 3: Direction & Negative Velocity on the active graph
        const negSec = [sc.sec1, sc.sec2, sc.sec3].find(s => s.v < 0);
        const zeroSec = [sc.sec1, sc.sec2, sc.sec3].find(s => s.v === 0);

        qTitle = 'Question 3 of 3: Negative Velocity & Direction';
        if (negSec) {
          qPrompt = `On your graph, there is a section plotted BELOW the 0 m/s line with a negative velocity (${negSec.v} m/s). What does a <strong>negative velocity</strong> tell you about the car's real motion?`;
        } else {
          qPrompt = `If a line on a Velocity vs. Time graph is plotted in the negative region (below 0 m/s), what does that negative sign represent?`;
        }
        choices = [
          { key: 'slowing_down', label: 'A) The car is slowing down and losing fuel.' },
          { key: 'backward', label: 'B) The car is moving in the NEGATIVE direction (backward / in reverse).' },
          { key: 'underground', label: 'C) The car is below ground level.' }
        ];
        correctChoice = 'backward';
        explanation = 'Velocity is a vector! A negative velocity indicates motion in the opposite/negative direction (backward toward 0m).';
      }

      ws.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-rose-500/20 pb-2">
            <div>
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">Level 4 • v-t Interpretation</span>
              <h2 class="text-base font-bold text-white">${qTitle}</h2>
            </div>
            <span class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-950 border border-rose-500/30 text-rose-300">5 pts</span>
          </div>

          <div class="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs font-sans text-rose-200 leading-relaxed space-y-1">
            <p>${qPrompt}</p>
          </div>

          <div class="space-y-2">
            ${choices.map(c => `
              <button class="choice-btn w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-left text-xs font-mono text-white transition-all flex items-center justify-between" data-choice="${c.key}">
                <span>${c.label}</span>
              </button>
            `).join('')}
          </div>

          <div id="stepFeedback" class="hidden p-3 rounded-xl text-xs font-sans"></div>
          <button id="btnNextStep" class="hidden w-full py-2.5 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#a855f7] text-slate-950 font-mono font-bold text-xs hover:brightness-110 transition-all shadow-[0_0_10px_rgba(56,189,248,0.3)]">
            ${secIdx < 2 ? 'Next v-t Concept ➜' : 'Level 4 Complete! Go to Level 5 ➜'}
          </button>
        </div>
      `;

      ws.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!this.checkCarPlayed()) return;
          const choice = btn.dataset.choice;
          const fb = document.getElementById('stepFeedback');
          const nextBtn = document.getElementById('btnNextStep');

          if (choice === correctChoice) {
            sfx.success();
            btn.classList.add('bg-emerald-950', 'border-emerald-500', 'text-emerald-300');
            fb.className = 'p-3 rounded-xl text-xs font-sans bg-emerald-950/70 border border-emerald-500/40 text-emerald-200';
            fb.innerHTML = `<strong>⭐ That's right!</strong> ${explanation}`;
            fb.classList.remove('hidden');
            nextBtn.classList.remove('hidden');

            if (!this.completedSteps[stepKey]) {
              this.completedSteps[stepKey] = true;
              this.levelScores[3] = Math.min(15, this.levelScores[3] + 5);
              this.updateScoreDisplay();
            }
          } else {
            btn.classList.add('bg-rose-950', 'border-rose-500', 'text-rose-300');
            this.triggerConceptReview(
              `Review: Interpreting Velocity vs. Time (v-t) Graphs`,
              `
                <p>On a <strong>Velocity vs. Time (v-t)</strong> graph, the vertical axis measures <strong>speed and direction</strong>, NOT position:</p>
                <div class="space-y-1.5 font-mono text-[11px] my-2 p-2.5 rounded bg-black/40 border border-white/10">
                  <div class="text-sky-300">― Horizontal Flat Line = Constant steady velocity (not speeding up or slowing down)</div>
                  <div class="text-lime-300">📏 Speed Magnitude = Distance away from 0 m/s (higher or lower = faster)</div>
                  <div class="text-rose-300">➕ Above 0 m/s = Moving Forward | ➖ Below 0 m/s = Moving Backward</div>
                </div>
                <p>A fresh motion scenario will be loaded so you can practice reading the velocity graph accurately!</p>
              `
            );
          }
        });
      });

      const nextBtn = document.getElementById('btnNextStep');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (this.currentStep < 2) {
            this.currentStep++;
            this.loadStep();
          } else {
            sfx.fanfare();
            this.switchLevel(5);
          }
        });
      }
    }

    // =========================================================================
    // =========================================================================
    // LEVEL 5: VELOCITY DATA TABLE COMPLETION (3 DISTINCT GRAPHS)
    // =========================================================================
    renderLevel5(ws, sc) {
      const stepKey = `L5_S${this.currentStep}`;
      const graphNum = this.currentStep + 1; // 1, 2, or 3
      const pts = 5; // 5 + 5 + 5 = 15 pts

      ws.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">Level 5 • Kinematic Data Table</span>
              <h2 class="text-base font-bold text-white">Graph ${graphNum} of 3: Read 3 Section Velocities</h2>
            </div>
            <span class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-950 border border-rose-500/30 text-rose-300">${pts} pts</span>
          </div>

          <div class="p-3 rounded-xl bg-slate-950/60 border border-rose-500/30 text-xs font-sans text-slate-200 leading-relaxed space-y-1">
            <p>Read the velocity for each interval directly from the <strong>Velocity vs. Time (v-t) graph</strong> above (Graph ${graphNum} of 3):</p>
            <p class="text-[11px] text-slate-400">💡 Look at the height of each horizontal line relative to the vertical velocity axis (m/s). Use negative values if the line is below 0 m/s!</p>
          </div>

          <!-- Structured Data Table -->
          <div class="rounded-xl border border-white/10 overflow-hidden text-xs font-mono">
            <div class="grid grid-cols-3 bg-white/5 p-2 font-bold text-slate-300 border-b border-white/10">
              <div>Interval</div>
              <div>Time Window</div>
              <div>Velocity (m/s)</div>
            </div>
            <div class="grid grid-cols-3 p-2 items-center border-b border-white/5">
              <div class="text-lime-300 font-bold">Section 1</div>
              <div class="text-slate-400">${sc.sec1.label}</div>
              <div><input id="tblV1" type="number" step="0.5" placeholder="v₁" class="w-20 px-2 py-1 rounded bg-white/5 border border-white/15 text-white outline-none focus:border-[#ccff00]"></div>
            </div>
            <div class="grid grid-cols-3 p-2 items-center border-b border-white/5">
              <div class="text-amber-300 font-bold">Section 2</div>
              <div class="text-slate-400">${sc.sec2.label}</div>
              <div><input id="tblV2" type="number" step="0.5" placeholder="v₂" class="w-20 px-2 py-1 rounded bg-white/5 border border-white/15 text-white outline-none focus:border-[#facc15]"></div>
            </div>
            <div class="grid grid-cols-3 p-2 items-center">
              <div class="text-sky-300 font-bold">Section 3</div>
              <div class="text-slate-400">${sc.sec3.label}</div>
              <div><input id="tblV3" type="number" step="0.5" placeholder="v₃" class="w-20 px-2 py-1 rounded bg-white/5 border border-white/15 text-white outline-none focus:border-[#38bdf8]"></div>
            </div>
          </div>

          <button id="btnCheckTable" class="w-full py-2.5 rounded-xl bg-[#ccff00] text-slate-950 font-mono font-bold text-xs hover:bg-lime-300 transition-all shadow-[0_0_10px_rgba(204,255,0,0.3)]">
            Check Data Table
          </button>

          <div id="stepFeedback" class="hidden p-3 rounded-xl text-xs font-sans"></div>
          <button id="btnNextStep" class="hidden w-full py-2.5 rounded-xl bg-[#ccff00] text-slate-950 font-mono font-bold text-xs hover:bg-lime-300 transition-all shadow-[0_0_10px_rgba(204,255,0,0.3)]">
            ${this.currentStep < 2 ? 'Next Graph Table ➜' : 'Level 5 Complete! Unlock Level 6: Dual Translation ➜'}
          </button>
        </div>
      `;

      const checkBtn = document.getElementById('btnCheckTable');
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          if (!this.checkCarPlayed()) return;
          const v1 = parseFloat(document.getElementById('tblV1').value);
          const v2 = parseFloat(document.getElementById('tblV2').value);
          const v3 = parseFloat(document.getElementById('tblV3').value);

          const fb = document.getElementById('stepFeedback');
          const nextBtn = document.getElementById('btnNextStep');

          if (Math.abs(v1 - sc.sec1.v) < 0.05 &&
              Math.abs(v2 - sc.sec2.v) < 0.05 &&
              Math.abs(v3 - sc.sec3.v) < 0.05) {
            sfx.success();
            fb.className = 'p-3 rounded-xl text-xs font-sans bg-emerald-950/70 border border-emerald-500/40 text-emerald-200';
            fb.innerHTML = `<strong>⭐ Graph ${graphNum} Correct!</strong> You've successfully read all 3 velocities: v₁ = ${sc.sec1.v} m/s, v₂ = ${sc.sec2.v} m/s, v₃ = ${sc.sec3.v} m/s.`;
            fb.classList.remove('hidden');
            nextBtn.classList.remove('hidden');

            if (!this.completedSteps[stepKey]) {
              this.completedSteps[stepKey] = true;
              this.levelScores[4] = Math.min(15, this.levelScores[4] + pts);
              this.updateScoreDisplay();
            }
          } else {
            this.triggerConceptReview(
              `Review: Reading the Velocity vs. Time (v-t) Graph`,
              `
                <p>On a <strong>Velocity vs. Time (v-t)</strong> graph, each section's velocity is found by tracing horizontally to the vertical axis:</p>
                <ul class="list-disc list-inside text-[11px] text-slate-300 space-y-1 my-2">
                  <li>Section 1 (${sc.sec1.label}): line is at <strong class="text-lime-300">${sc.sec1.v} m/s</strong></li>
                  <li>Section 2 (${sc.sec2.label}): line is at <strong class="text-amber-300">${sc.sec2.v} m/s</strong></li>
                  <li>Section 3 (${sc.sec3.label}): line is at <strong class="text-sky-300">${sc.sec3.v} m/s</strong></li>
                </ul>
                <p class="text-rose-300 text-[11px]">Notice: lines plotted below the 0 m/s axis line must have a <strong>negative (-) sign</strong>!</p>
              `
            );
          }
        });
      }

      const nextBtn = document.getElementById('btnNextStep');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (this.currentStep < 2) {
            this.currentStep++;
            this.loadStep();
          } else {
            sfx.fanfare();
            this.switchLevel(6);
          }
        });
      }
    }

    // =========================================================================
    // =========================================================================
    // LEVEL 6: DUAL-GRAPH TRANSLATION (3 DISTINCT GRAPHS TO DRAW)
    // =========================================================================
    renderLevel6(ws, sc) {
      const stepKey = `L6_S${this.currentStep}`;
      const graphNum = this.currentStep + 1; // 1, 2, or 3
      const pts = (this.currentStep === 2) ? 6 : 7; // 7 + 7 + 6 = 20 pts

      // Initialize student drag velocity bars on the right canvas
      this.visualizer.setupDualBars([
        { t0: sc.segments[0].t0, t1: sc.segments[0].t1, expectedV: sc.sec1.v },
        { t0: sc.segments[1].t0, t1: sc.segments[1].t1, expectedV: sc.sec2.v },
        { t0: sc.segments[2].t0, t1: sc.segments[2].t1, expectedV: sc.sec3.v }
      ]);

      ws.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-sky-500/20 pb-2">
            <div>
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">Level 6 • Authentic Translation</span>
              <h2 class="text-base font-bold text-white">Graph ${graphNum} of 3: Draw the Velocity-Time Graph</h2>
            </div>
            <span class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-sky-950 border border-sky-500/30 text-sky-300">${pts} pts</span>
          </div>

          <div class="p-3 rounded-xl bg-sky-950/50 border border-sky-500/30 text-xs font-sans text-sky-200 leading-relaxed space-y-1.5">
            <p><strong>How to Translate (Challenge ${graphNum} of 3):</strong></p>
            <ol class="list-decimal list-inside space-y-1 text-slate-200">
              <li>Calculate each section's slope (Rise ÷ Run) on the <strong>Left Graph (x-t)</strong>.</li>
              <li>Click and drag the horizontal velocity bars on the <strong>Right Graph (v-t)</strong> UP or DOWN until their speed values match!</li>
            </ol>
          </div>

          <!-- Live Bar Readout Chips -->
          <div class="p-3 rounded-xl bg-slate-950/70 border border-white/10 font-mono text-xs space-y-1.5">
            <div class="text-slate-400 text-[10px] uppercase font-bold">Your Plotted Velocities (Right Graph):</div>
            <div id="liveBarReadouts" class="grid grid-cols-3 gap-1.5 text-center">
              <div class="p-1.5 rounded bg-lime-950/60 border border-lime-500/30 text-lime-300 font-bold">v₁: 0 m/s</div>
              <div class="p-1.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 font-bold">v₂: 0 m/s</div>
              <div class="p-1.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-300 font-bold">v₃: 0 m/s</div>
            </div>
          </div>

          <button id="btnCheckTranslation" class="w-full py-3 rounded-xl bg-gradient-to-r from-[#ccff00] to-[#38bdf8] text-slate-950 font-mono font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(56,189,248,0.35)]">
            🎯 Check Dual Translation
          </button>

          <div id="stepFeedback" class="hidden p-3 rounded-xl text-xs font-sans"></div>
          <button id="btnNextStep" class="hidden w-full py-2.5 rounded-xl bg-[#ccff00] text-slate-950 font-mono font-bold text-xs hover:bg-lime-300 transition-all shadow-[0_0_10px_rgba(204,255,0,0.3)]">
            ${this.currentStep < 2 ? 'Next Translation Challenge ➜' : '🏆 Complete Studio & View Certificate!'}
          </button>
        </div>
      `;

      this.updateLiveBarReadouts();

      const checkBtn = document.getElementById('btnCheckTranslation');
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          if (!this.checkCarPlayed()) return;
          const bars = this.visualizer.studentVelocityBars;
          const isAllMatch = bars.every(b => Math.abs(b.v - b.expectedV) < 0.1);
          const fb = document.getElementById('stepFeedback');
          const nextBtn = document.getElementById('btnNextStep');

          if (isAllMatch) {
            sfx.fanfare();
            fb.className = 'p-3 rounded-xl text-xs font-sans bg-emerald-950/70 border border-emerald-500/40 text-emerald-200';
            fb.innerHTML = `<strong>🎉 Graph ${graphNum} Translation Accurate!</strong> Both graphs are in perfect kinematic alignment!`;
            fb.classList.remove('hidden');
            nextBtn.classList.remove('hidden');

            if (!this.completedSteps[stepKey]) {
              this.completedSteps[stepKey] = true;
              this.levelScores[5] = Math.min(20, this.levelScores[5] + pts);
              this.updateScoreDisplay();
            }
          } else {
            this.triggerConceptReview(
              `Review: Translating x-t Slopes into v-t Bars`,
              `
                <p>To translate a <strong>Position vs. Time (x-t)</strong> graph into a <strong>Velocity vs. Time (v-t)</strong> graph:</p>
                <div class="my-2 p-2.5 rounded bg-black/40 border border-white/10 font-mono text-[11px] text-sky-300 space-y-1">
                  <div>1. Find the slope (Rise ÷ Run = Δx ÷ Δt) of each section on the left graph.</div>
                  <div>2. Drag the horizontal bar on the right graph so its height equals that exact slope value!</div>
                </div>
                <ul class="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                  <li>Section 1 slope: <strong>${sc.sec1.v} m/s</strong> (bar should be at ${sc.sec1.v})</li>
                  <li>Section 2 slope: <strong>${sc.sec2.v} m/s</strong> (bar should be at ${sc.sec2.v})</li>
                  <li>Section 3 slope: <strong>${sc.sec3.v} m/s</strong> (bar should be at ${sc.sec3.v})</li>
                </ul>
                <p class="text-amber-300 text-[11px] mt-1">Check the signs carefully! Downward slopes must be dragged below the 0 m/s line.</p>
              `
            );
          }
        });
      }

      const nextBtn = document.getElementById('btnNextStep');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (this.currentStep < 2) {
            this.currentStep++;
            this.loadStep();
          } else {
            this.showCertificate();
          }
        });
      }
    }

    onVelocityBarMoved(bars) {
      this.updateLiveBarReadouts();
    }

    updateLiveBarReadouts() {
      const container = document.getElementById('liveBarReadouts');
      if (!container || !this.visualizer.studentVelocityBars.length) return;
      const bars = this.visualizer.studentVelocityBars;
      container.innerHTML = `
        <div class="p-1.5 rounded bg-lime-950/60 border border-lime-500/30 text-lime-300 font-bold">v₁: ${bars[0].v >= 0 ? '+' : ''}${bars[0].v} m/s</div>
        <div class="p-1.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 font-bold">v₂: ${bars[1].v >= 0 ? '+' : ''}${bars[1].v} m/s</div>
        <div class="p-1.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-300 font-bold">v₃: ${bars[2].v >= 0 ? '+' : ''}${bars[2].v} m/s</div>
      `;
    }

    showCertificate() {
      const modal = document.getElementById('certModal');
      const nameEl = document.getElementById('certStudentName');
      const scoreEl = document.getElementById('certScore');
      const dateEl = document.getElementById('certDate');
      const total = this.getTotalScore();

      if (modal) modal.classList.remove('hidden');
      if (scoreEl) scoreEl.textContent = total;
      if (dateEl) {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      if (nameEl && window.authManager) {
        nameEl.textContent = window.authManager.studentName || 'Student Investigator';
      }
      sfx.fanfare();
    }

    hideCertificate() {
      const modal = document.getElementById('certModal');
      if (modal) modal.classList.add('hidden');
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.dualStudioApp = new DualStudioApp();
    window.authManager = new StudioAuthManager();
  });

})();

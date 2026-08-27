/**
 * Accuracy & Precision: Emoji Finger Painting Art Studio
 * Interactive physics curriculum webapp for Quality of Measurement (HS-PS2-1)
 */

// Configuration & Constants
const ASSIGNMENT_ID = "Accuracy_Precision_Emoji_Art";

const QUADRANTS = [
  {
    id: "quad-1",
    num: 1,
    title: "Accurate & Precise",
    subtitle: "High Accuracy, High Precision",
    targetAccuracy: "High",
    targetPrecision: "High",
    color: "#10b981",
    bgClass: "quad-card-1",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    defaultCER: "All parts/stamps of my emoji are clustered tightly together (High Precision), and their average position is centered right in the bullseye target (High Accuracy)."
  },
  {
    id: "quad-2",
    num: 2,
    title: "Accurate, NOT Precise",
    subtitle: "High Accuracy, Low Precision",
    targetAccuracy: "High",
    targetPrecision: "Low",
    color: "#f59e0b",
    bgClass: "quad-card-2",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    defaultCER: "The marks are spread far apart all around the board (Low Precision), but if you calculate their average center, it balances out directly over the target (High Accuracy)."
  },
  {
    id: "quad-3",
    num: 3,
    title: "Precise, NOT Accurate",
    subtitle: "Low Accuracy, High Precision",
    targetAccuracy: "Low",
    targetPrecision: "High",
    color: "#06b6d4",
    bgClass: "quad-card-3",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    defaultCER: "All my paint strokes and emoji parts are clumped tightly in one tiny spot (High Precision), but they are far away in the corner and completely missed the target center (Low Accuracy)."
  },
  {
    id: "quad-4",
    num: 4,
    title: "Neither Accurate nor Precise",
    subtitle: "Low Accuracy, Low Precision",
    targetAccuracy: "Low",
    targetPrecision: "Low",
    color: "#ef4444",
    bgClass: "quad-card-4",
    badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    defaultCER: "The marks are completely scattered at random across the paper (Low Precision), and the cluster as a whole is drifted far away from the true target center (Low Accuracy)."
  }
];

// Curated emoji library
const POPULAR_EMOJIS = [
  "🎯", "😀", "🐱", "🚀", "🍕", "🌟", "👾", "🎨", "🦄", "🍩",
  "🔥", "⚽", "🐢", "🌺", "💎", "🥑", "🍔", "🎈", "⚡", "🤖"
];

// Color Palette Options
const COLOR_PALETTE = [
  { name: "Crimson Red", value: "#e11d48" },
  { name: "Sunny Gold", value: "#eab308" },
  { name: "Cobalt Blue", value: "#2563eb" },
  { name: "Emerald Green", value: "#10b981" },
  { name: "Neon Violet", value: "#8b5cf6" },
  { name: "Bubblegum Pink", value: "#ec4899" },
  { name: "Tangerine", value: "#f97316" },
  { name: "Charcoal Ink", value: "#0f172a" },
  { name: "Chalk White", value: "#f8fafc" },
  { name: "Rainbow", value: "rainbow" }
];

// State Management
const StudioState = {
  activeEmoji: "🎯",
  selectedColor: "#e11d48",
  selectedTool: "finger", // "finger", "splatter", "stamp", "eraser"
  brushSize: 18,
  brushOpacity: 0.9,
  showTargetGuides: true,
  rainbowHue: 0,
  activeFocusQuad: null, // null = 2x2 grid, 1..4 = focused single canvas
  studentName: "",
  classPeriod: "Period 1",
  canvases: {}, // quad-1..quad-4 canvas state and points history
  user: null
};

// Canvas State Class for each Quadrant
class QuadrantCanvas {
  constructor(quadConfig) {
    this.config = quadConfig;
    this.id = quadConfig.id;
    this.canvas = document.getElementById(`canvas-${this.id}`);
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.ghostOverlay = document.getElementById(`ghost-${this.id}`);
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.history = [];
    this.historyStep = -1;
    this.maxHistory = 15;
    this.samplePoints = []; // Track touch/point centers for statistical analysis
    this.inspectMode = false;

    this.initCanvasSize();
    this.bindEvents();
    this.saveState();
  }

  initCanvasSize() {
    // Internal coordinate resolution (square 600x600 for high resolution)
    this.canvas.width = 600;
    this.canvas.height = 600;
    
    // Fill with crisp canvas background
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, 600, 600);
  }

  saveState() {
    // Trim forward redo history
    if (this.historyStep < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyStep + 1);
    }
    // Limit stack size
    if (this.history.length >= this.maxHistory) {
      this.history.shift();
    } else {
      this.historyStep++;
    }
    this.history.push(this.ctx.getImageData(0, 0, 600, 600));
    this.updateUndoRedoUI();
  }

  undo() {
    if (this.historyStep > 0) {
      this.historyStep--;
      this.ctx.putImageData(this.history[this.historyStep], 0, 0);
      if (this.samplePoints.length > 0) {
        this.samplePoints.pop();
      }
      this.updateUndoRedoUI();
    }
  }

  redo() {
    if (this.historyStep < this.history.length - 1) {
      this.historyStep++;
      this.ctx.putImageData(this.history[this.historyStep], 0, 0);
      this.updateUndoRedoUI();
    }
  }

  clear() {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, 600, 600);
    this.samplePoints = [];
    this.saveState();
    this.clearInspectionUI();
  }

  updateUndoRedoUI() {
    const undoBtn = document.getElementById(`undo-${this.id}`);
    const redoBtn = document.getElementById(`redo-${this.id}`);
    if (undoBtn) undoBtn.disabled = this.historyStep <= 0;
    if (redoBtn) redoBtn.disabled = this.historyStep >= this.history.length - 1;
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  bindEvents() {
    // Universal Pointer Events (Chromebook touchscreen + mouse + stylus)
    this.canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    this.canvas.addEventListener("pointermove", (e) => this.onPointerMove(e));
    this.canvas.addEventListener("pointerup", (e) => this.onPointerUp(e));
    this.canvas.addEventListener("pointercancel", (e) => this.onPointerUp(e));
    this.canvas.addEventListener("pointerleave", (e) => this.onPointerUp(e));

    // Prevent touch scrolling gestures on the canvas
    this.canvas.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
    this.canvas.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  }

  getActivePaintColor() {
    if (StudioState.selectedColor === "rainbow") {
      StudioState.rainbowHue = (StudioState.rainbowHue + 12) % 360;
      return `hsl(${StudioState.rainbowHue}, 90%, 55%)`;
    }
    return StudioState.selectedColor;
  }

  onPointerDown(e) {
    this.isDrawing = true;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch (_) {}

    const coords = this.getCanvasCoords(e);
    this.lastX = coords.x;
    this.lastY = coords.y;

    // Record sample point for accuracy & precision statistical calculations
    this.samplePoints.push({ x: coords.x, y: coords.y, time: Date.now() });

    if (StudioState.selectedTool === "stamp") {
      this.drawEmojiStamp(coords.x, coords.y);
      this.saveState();
    } else if (StudioState.selectedTool === "splatter") {
      this.drawSplatter(coords.x, coords.y);
      this.saveState();
    } else {
      // Direct finger daub on initial tap
      this.drawFingerDaub(coords.x, coords.y, coords.x, coords.y);
    }
  }

  onPointerMove(e) {
    if (!this.isDrawing) return;
    const coords = this.getCanvasCoords(e);

    if (StudioState.selectedTool === "stamp") {
      // Don't drag stamps continuously to prevent overwhelming density
      return;
    }

    if (StudioState.selectedTool === "splatter") {
      // Light splatter trail
      if (Math.hypot(coords.x - this.lastX, coords.y - this.lastY) > 25) {
        this.drawSplatter(coords.x, coords.y, 0.4);
        this.samplePoints.push({ x: coords.x, y: coords.y, time: Date.now() });
        this.lastX = coords.x;
        this.lastY = coords.y;
      }
      return;
    }

    // Finger painting or Eraser
    this.drawFingerDaub(this.lastX, this.lastY, coords.x, coords.y);
    this.samplePoints.push({ x: coords.x, y: coords.y, time: Date.now() });
    this.lastX = coords.x;
    this.lastY = coords.y;
  }

  onPointerUp(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch (_) {}
    this.saveState();
  }

  drawFingerDaub(x0, y0, x1, y1) {
    const isEraser = StudioState.selectedTool === "eraser";
    const size = StudioState.brushSize * 1.5;
    const opacity = isEraser ? 1.0 : StudioState.brushOpacity;
    const color = isEraser ? "#ffffff" : this.getActivePaintColor();

    this.ctx.save();
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.lineWidth = size;
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = opacity;

    // Main smooth connecting stroke
    this.ctx.beginPath();
    this.ctx.moveTo(x0, y0);
    this.ctx.lineTo(x1, y1);
    this.ctx.stroke();

    // Finger daub texture: organic round pressure circle at touch point
    this.ctx.beginPath();
    this.ctx.arc(x1, y1, size / 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Subtle wet-paint highlight on non-eraser strokes for rich aesthetic
    if (!isEraser && size > 15) {
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      this.ctx.beginPath();
      this.ctx.arc(x1 - size * 0.18, y1 - size * 0.18, size * 0.18, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawSplatter(cx, cy, intensity = 1.0) {
    const color = this.getActivePaintColor();
    const dropletCount = Math.floor((14 + Math.random() * 12) * intensity);
    const radius = StudioState.brushSize * 2.8;

    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = StudioState.brushOpacity;

    // Center splash
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, StudioState.brushSize * 0.7, 0, Math.PI * 2);
    this.ctx.fill();

    // Micro droplets
    for (let i = 0; i < dropletCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const dropX = cx + Math.cos(angle) * dist;
      const dropY = cy + Math.sin(angle) * dist;
      const dropSize = (Math.random() * StudioState.brushSize * 0.25) + 1.5;

      this.ctx.beginPath();
      this.ctx.arc(dropX, dropY, dropSize, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawEmojiStamp(x, y) {
    const size = StudioState.brushSize * 3.5;
    this.ctx.save();
    this.ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.globalAlpha = StudioState.brushOpacity;
    this.ctx.fillText(StudioState.activeEmoji, x, y);
    this.ctx.restore();
  }

  // Statistical Physics Inspector: Centroid and Dispersion
  analyzeMeasurements() {
    if (this.samplePoints.length < 3) {
      return {
        sampleCount: this.samplePoints.length,
        accuracy: "Unknown",
        precision: "Unknown",
        centroidDist: null,
        spreadRadius: null,
        message: "Finger-paint or stamp at least a few marks on this canvas to analyze its accuracy and precision!"
      };
    }

    const targetCenter = { x: 300, y: 300 }; // 600x600 center
    const n = this.samplePoints.length;

    // 1. Calculate Centroid (Mean X, Mean Y)
    let sumX = 0;
    let sumY = 0;
    for (const pt of this.samplePoints) {
      sumX += pt.x;
      sumY += pt.y;
    }
    const centroid = { x: sumX / n, y: sumY / n };

    // 2. Accuracy: Distance from Centroid to True Target Center
    const centroidDist = Math.hypot(centroid.x - targetCenter.x, centroid.y - targetCenter.y);
    // Standard normalized threshold: < 90px (~15% radius) is High Accuracy
    const isAccurate = centroidDist <= 110;
    const accuracyGrade = centroidDist <= 75 ? "High" : (centroidDist <= 130 ? "Medium" : "Low");

    // 3. Precision: Mean Dispersion Radius from Centroid (Standard deviation / cluster tightness)
    let sumDistFromCentroid = 0;
    for (const pt of this.samplePoints) {
      sumDistFromCentroid += Math.hypot(pt.x - centroid.x, pt.y - centroid.y);
    }
    const spreadRadius = sumDistFromCentroid / n;
    // Standard normalized threshold: < 100px is High Precision
    const isPrecise = spreadRadius <= 95;
    const precisionGrade = spreadRadius <= 70 ? "High" : (spreadRadius <= 120 ? "Medium" : "Low");

    // Generate scientific diagnosis
    let diagnosis = "";
    if (accuracyGrade === "High" && precisionGrade === "High") {
      diagnosis = "🎯 Bullseye! High Accuracy (centered closely on target) and High Precision (tightly grouped marks).";
    } else if (accuracyGrade === "High" && precisionGrade !== "High") {
      diagnosis = "⚖️ Balanced! High Accuracy (average position is near center), but Low Precision (marks are scattered widely).";
    } else if (accuracyGrade !== "High" && precisionGrade === "High") {
      diagnosis = "🔒 Clustered Bias! High Precision (tightly grouped together), but Low Accuracy (missed the target center).";
    } else {
      diagnosis = "💥 Wild Drift! Low Accuracy (far from center) and Low Precision (widely scattered).";
    }

    return {
      sampleCount: n,
      centroid,
      centroidDist: Math.round(centroidDist),
      spreadRadius: Math.round(spreadRadius),
      accuracyGrade,
      precisionGrade,
      isAccurate,
      isPrecise,
      diagnosis
    };
  }

  renderInspectionHUD() {
    const analysis = this.analyzeMeasurements();
    const hudContainer = document.getElementById(`analysis-${this.id}`);
    if (!hudContainer) return;

    if (analysis.sampleCount < 3) {
      hudContainer.innerHTML = `
        <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60 text-xs text-slate-300">
          ${analysis.message}
        </div>
      `;
      return;
    }

    const accColor = analysis.accuracyGrade === "High" ? "text-emerald-400" : (analysis.accuracyGrade === "Medium" ? "text-amber-400" : "text-rose-400");
    const precColor = analysis.precisionGrade === "High" ? "text-emerald-400" : (analysis.precisionGrade === "Medium" ? "text-amber-400" : "text-rose-400");

    hudContainer.innerHTML = `
      <div class="p-3 bg-slate-900/95 backdrop-blur-md rounded-xl border border-cyan-500/30 text-xs space-y-2 shadow-xl animate-fade-in">
        <div class="flex items-center justify-between font-bold border-b border-slate-800 pb-1.5">
          <span class="text-cyan-300 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Live Physics Quality Analysis
          </span>
          <span class="text-slate-400 text-[10px]">${analysis.sampleCount} mark samples</span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-center pt-1">
          <div class="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
            <div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Accuracy</div>
            <div class="text-base font-black ${accColor}">${analysis.accuracyGrade}</div>
            <div class="text-[10px] text-slate-400">${analysis.centroidDist}px from target</div>
          </div>
          <div class="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
            <div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Precision</div>
            <div class="text-base font-black ${precColor}">${analysis.precisionGrade}</div>
            <div class="text-[10px] text-slate-400">${analysis.spreadRadius}px spread radius</div>
          </div>
        </div>

        <div class="text-[11px] text-slate-200 bg-slate-950/60 p-2 rounded-lg leading-snug">
          ${analysis.diagnosis}
        </div>

        <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span>Target Goal: <strong class="text-slate-200">${this.config.targetAccuracy} Acc, ${this.config.targetPrecision} Prec</strong></span>
          <span class="${analysis.accuracyGrade === this.config.targetAccuracy && (analysis.precisionGrade === this.config.targetPrecision || (this.config.targetPrecision === 'Low' && analysis.precisionGrade !== 'High')) ? 'text-emerald-400 font-bold' : 'text-amber-400'}">
            ${analysis.accuracyGrade === this.config.targetAccuracy && (analysis.precisionGrade === this.config.targetPrecision || (this.config.targetPrecision === 'Low' && analysis.precisionGrade !== 'High')) ? '✅ Matches Quadrant Goal!' : 'Adjust marks to match goal'}
          </span>
        </div>
      </div>
    `;
  }

  clearInspectionUI() {
    const hudContainer = document.getElementById(`analysis-${this.id}`);
    if (hudContainer) hudContainer.innerHTML = "";
  }
}

// Studio Application Controller
class EmojiArtStudio {
  constructor() {
    this.initDOM();
    this.initCanvases();
    this.initMiniLessonDarts();
    this.initAuth();
  }

  initDOM() {
    // Render Emoji Selection Carousel
    const emojiContainer = document.getElementById("emoji-picker-list");
    if (emojiContainer) {
      emojiContainer.innerHTML = POPULAR_EMOJIS.map(emoji => `
        <button type="button" class="emoji-select-btn text-2xl p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all ${emoji === StudioState.activeEmoji ? 'bg-cyan-500/20 ring-2 ring-cyan-400' : ''}" data-emoji="${emoji}">
          ${emoji}
        </button>
      `).join("");

      emojiContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".emoji-select-btn");
        if (btn) {
          this.setEmoji(btn.dataset.emoji);
        }
      });
    }

    // Custom Emoji Input
    const customEmojiInput = document.getElementById("custom-emoji-input");
    if (customEmojiInput) {
      customEmojiInput.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        if (val) {
          this.setEmoji(val);
        }
      });
    }

    // Color Palette Pots
    const paletteContainer = document.getElementById("color-palette-pots");
    if (paletteContainer) {
      paletteContainer.innerHTML = COLOR_PALETTE.map(c => `
        <button type="button" class="paint-pot ${c.value === 'rainbow' ? 'rainbow-pot' : ''} ${c.value === StudioState.selectedColor ? 'active' : ''}" 
                style="${c.value !== 'rainbow' ? `background-color: ${c.value}` : ''}" 
                data-color="${c.value}" 
                title="${c.name}">
        </button>
      `).join("");

      paletteContainer.addEventListener("click", (e) => {
        const pot = e.target.closest(".paint-pot");
        if (pot) {
          document.querySelectorAll(".paint-pot").forEach(p => p.classList.remove("active"));
          pot.classList.add("active");
          StudioState.selectedColor = pot.dataset.color;
        }
      });
    }

    // Tool Selection (Finger, Splatter, Stamp, Eraser)
    document.querySelectorAll("[data-tool]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-tool]").forEach(b => b.classList.remove("tool-btn-active"));
        btn.classList.add("tool-btn-active");
        StudioState.selectedTool = btn.dataset.tool;
      });
    });

    // Brush Size Slider
    const sizeSlider = document.getElementById("brush-size-slider");
    const sizeVal = document.getElementById("brush-size-val");
    if (sizeSlider && sizeVal) {
      sizeSlider.addEventListener("input", (e) => {
        StudioState.brushSize = parseInt(e.target.value, 10);
        sizeVal.textContent = `${StudioState.brushSize}px`;
      });
    }

    // Target Guide Ghost Overlay Toggle
    const ghostToggle = document.getElementById("toggle-target-guides");
    if (ghostToggle) {
      ghostToggle.addEventListener("click", () => {
        StudioState.showTargetGuides = !StudioState.showTargetGuides;
        ghostToggle.classList.toggle("tool-btn-active", StudioState.showTargetGuides);
        document.querySelectorAll(".target-ghost-overlay").forEach(overlay => {
          overlay.classList.toggle("ghost-hidden", !StudioState.showTargetGuides);
        });
      });
    }

    // Export Masterpiece Modal Trigger
    const exportBtn = document.getElementById("btn-export-poster");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.openExportModal());
    }

    // Download Poster PNG Button
    const downloadBtn = document.getElementById("btn-download-png");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => this.generateAndDownloadPoster());
    }

    // Modal Close
    const closeExport = document.getElementById("btn-close-export");
    if (closeExport) {
      closeExport.addEventListener("click", () => {
        document.getElementById("export-modal").classList.add("hidden");
      });
    }

    // View Mode Switcher (2x2 Grid vs Focus Mode)
    document.querySelectorAll("[data-view-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.viewMode;
        this.switchViewMode(mode === "grid" ? null : parseInt(mode, 10));
      });
    });
  }

  initCanvases() {
    QUADRANTS.forEach(quad => {
      const qCanvas = new QuadrantCanvas(quad);
      StudioState.canvases[quad.id] = qCanvas;

      // Undo button
      const undoBtn = document.getElementById(`undo-${quad.id}`);
      if (undoBtn) undoBtn.addEventListener("click", () => qCanvas.undo());

      // Redo button
      const redoBtn = document.getElementById(`redo-${quad.id}`);
      if (redoBtn) redoBtn.addEventListener("click", () => qCanvas.redo());

      // Clear button
      const clearBtn = document.getElementById(`clear-${quad.id}`);
      if (clearBtn) clearBtn.addEventListener("click", () => {
        if (confirm(`Clear all painting on "${quad.title}"?`)) {
          qCanvas.clear();
        }
      });

      // Analyze button
      const analyzeBtn = document.getElementById(`analyze-${quad.id}`);
      if (analyzeBtn) {
        analyzeBtn.addEventListener("click", () => {
          qCanvas.renderInspectionHUD();
        });
      }

      // Focus button
      const focusBtn = document.getElementById(`focus-${quad.id}`);
      if (focusBtn) {
        focusBtn.addEventListener("click", () => {
          this.switchViewMode(quad.num);
        });
      }
    });

    this.updateGhostOverlays();
  }

  setEmoji(emoji) {
    StudioState.activeEmoji = emoji;
    // Update active state in picker list
    document.querySelectorAll(".emoji-select-btn").forEach(btn => {
      btn.classList.toggle("bg-cyan-500/20", btn.dataset.emoji === emoji);
      btn.classList.toggle("ring-2", btn.dataset.emoji === emoji);
      btn.classList.toggle("ring-cyan-400", btn.dataset.emoji === emoji);
    });

    // Update active emoji previews across the page
    document.querySelectorAll(".current-emoji-display").forEach(el => {
      el.textContent = emoji;
    });

    this.updateGhostOverlays();
  }

  updateGhostOverlays() {
    QUADRANTS.forEach(quad => {
      const ghost = document.getElementById(`ghost-${quad.id}`);
      if (ghost) {
        ghost.innerHTML = `
          <div class="bullseye-rings w-[75%] h-[75%]"></div>
          <div class="bullseye-rings w-[50%] h-[50%]"></div>
          <div class="bullseye-rings w-[25%] h-[25%]"></div>
          <div class="absolute w-3 h-3 rounded-full bg-rose-500"></div>
          <div class="ghost-emoji">${StudioState.activeEmoji}</div>
        `;
      }
    });
  }

  switchViewMode(quadNum) {
    StudioState.activeFocusQuad = quadNum;
    const gridContainer = document.getElementById("quadrants-grid");
    const focusBar = document.getElementById("focus-nav-bar");

    if (quadNum === null) {
      // 2x2 Grid View
      gridContainer.className = "grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6";
      document.querySelectorAll(".quadrant-card").forEach(card => card.classList.remove("hidden"));
      if (focusBar) focusBar.classList.add("hidden");
    } else {
      // Single Focus Mode
      gridContainer.className = "grid grid-cols-1 gap-4";
      document.querySelectorAll(".quadrant-card").forEach(card => {
        const isTarget = card.id === `card-quad-${quadNum}`;
        card.classList.toggle("hidden", !isTarget);
      });
      if (focusBar) {
        focusBar.classList.remove("hidden");
        const focusTitle = document.getElementById("focus-quad-title");
        if (focusTitle) {
          const q = QUADRANTS.find(item => item.num === quadNum);
          focusTitle.textContent = `Focus Mode: Quadrant ${q.num} - ${q.title}`;
        }
      }
    }
  }

  // Mini Lesson Interactive Dartboard Demonstration
  initMiniLessonDarts() {
    const demos = [
      {
        id: "demo-accurate-precise",
        hits: [
          { x: 50, y: 50 }, { x: 52, y: 48 }, { x: 48, y: 52 }, { x: 51, y: 51 }
        ]
      },
      {
        id: "demo-accurate-not-precise",
        hits: [
          { x: 25, y: 35 }, { x: 75, y: 65 }, { x: 30, y: 70 }, { x: 70, y: 30 }
        ]
      },
      {
        id: "demo-precise-not-accurate",
        hits: [
          { x: 80, y: 20 }, { x: 82, y: 22 }, { x: 78, y: 19 }, { x: 81, y: 21 }
        ]
      },
      {
        id: "demo-neither",
        hits: [
          { x: 15, y: 80 }, { x: 85, y: 75 }, { x: 70, y: 20 }, { x: 30, y: 25 }
        ]
      }
    ];

    demos.forEach(demo => {
      const container = document.getElementById(demo.id);
      if (container) {
        container.innerHTML = `
          <div class="target-board">
            <div class="target-ring-outer"></div>
            <div class="target-ring-mid"></div>
            <div class="target-bullseye"></div>
            ${demo.hits.map((h, idx) => `
              <div class="sample-hit-dot" style="left: ${h.x}%; top: ${h.y}%; animation-delay: ${idx * 0.15}s;"></div>
            `).join("")}
          </div>
        `;
      }
    });
  }

  openExportModal() {
    const modal = document.getElementById("export-modal");
    if (!modal) return;

    // Set preview values
    const nameInput = document.getElementById("student-name-input");
    if (nameInput && StudioState.studentName) {
      nameInput.value = StudioState.studentName;
    }

    // Refresh dynamic thumbnail previews
    QUADRANTS.forEach(quad => {
      const thumbCanvas = document.getElementById(`thumb-${quad.id}`);
      const sourceCanvas = document.getElementById(`canvas-${quad.id}`);
      if (thumbCanvas && sourceCanvas) {
        thumbCanvas.width = 120;
        thumbCanvas.height = 120;
        const ctx = thumbCanvas.getContext("2d");
        ctx.drawImage(sourceCanvas, 0, 0, 120, 120);
      }
    });

    modal.classList.remove("hidden");
  }

  // Composite High-Resolution Gallery Poster Generation
  async generateAndDownloadPoster() {
    const nameInput = document.getElementById("student-name-input");
    const periodSelect = document.getElementById("student-period-select");

    const studentName = (nameInput && nameInput.value.trim()) || "Physics Student";
    const period = (periodSelect && periodSelect.value) || "Period 1";
    const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // Master High-Resolution Poster Canvas (2000 x 2400 pixels)
    const poster = document.createElement("canvas");
    poster.width = 2000;
    poster.height = 2400;
    const ctx = poster.getContext("2d");

    // 1. Dark Studio Gallery Background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, 2000, 2400);

    // Subtle background mesh pattern
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 2000; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 2400);
      ctx.stroke();
    }
    for (let y = 0; y < 2400; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(2000, y);
      ctx.stroke();
    }

    // 2. Poster Header
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 34px 'Orbitron', monospace";
    ctx.textAlign = "center";
    ctx.fillText("HIGH SCHOOL PHYSICS // QUALITY OF MEASUREMENT", 1000, 95);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 68px 'Fredoka', 'Inter', sans-serif";
    ctx.fillText("ACCURACY & PRECISION EMOJI ART", 1000, 175);

    // Student Info Subtitle Banner
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 32px 'Inter', sans-serif";
    ctx.fillText(`Scientist: ${studentName}  |  ${period}  |  ${todayStr}  |  Target Emoji: ${StudioState.activeEmoji}`, 1000, 235);

    // Top gold accent rule
    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(140, 270);
    ctx.lineTo(1860, 270);
    ctx.stroke();

    // 3. Render 4 Canvases in 2x2 Gallery Grid
    const canvasPositions = [
      { x: 140, y: 310, quad: QUADRANTS[0] }, // Top-Left: Accurate & Precise
      { x: 1040, y: 310, quad: QUADRANTS[1] }, // Top-Right: Accurate, Not Precise
      { x: 140, y: 1300, quad: QUADRANTS[2] }, // Bottom-Left: Precise, Not Accurate
      { x: 1040, y: 1300, quad: QUADRANTS[3] } // Bottom-Right: Neither
    ];

    for (const pos of canvasPositions) {
      const q = pos.quad;
      const srcCanvas = document.getElementById(`canvas-${q.id}`);
      const cerInput = document.getElementById(`cer-${q.id}`);
      const explanation = (cerInput && cerInput.value.trim()) || q.defaultCER;

      // Card Background Frame
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.strokeStyle = q.color;
      ctx.lineWidth = 3;
      this.drawRoundedRect(ctx, pos.x, pos.y, 820, 930, 24);
      ctx.fill();
      ctx.stroke();

      // Card Header Banner
      ctx.fillStyle = q.color;
      ctx.font = "bold 36px 'Inter', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${q.num}. ${q.title}`, pos.x + 30, pos.y + 55);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 24px 'Inter', sans-serif";
      ctx.fillText(q.subtitle, pos.x + 30, pos.y + 92);

      // Card Target Emoji Watermark
      ctx.font = "40px 'Noto Color Emoji', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(StudioState.activeEmoji, pos.x + 790, pos.y + 70);

      // The Painted Artwork
      if (srcCanvas) {
        ctx.save();
        this.drawRoundedRect(ctx, pos.x + 30, pos.y + 115, 760, 580, 16);
        ctx.clip();
        ctx.drawImage(srcCanvas, pos.x + 30, pos.y + 115, 760, 580);
        ctx.restore();

        // Border around artwork
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        this.drawRoundedRect(ctx, pos.x + 30, pos.y + 115, 760, 580, 16);
        ctx.stroke();
      }

      // Student Written Justification Block
      ctx.fillStyle = "#0f172a";
      this.drawRoundedRect(ctx, pos.x + 30, pos.y + 715, 760, 190, 14);
      ctx.fill();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 20px 'Orbitron', monospace";
      ctx.textAlign = "left";
      ctx.fillText("SCIENTIFIC JUSTIFICATION:", pos.x + 45, pos.y + 745);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "400 22px 'Inter', sans-serif";
      this.drawWrappedText(ctx, `"${explanation}"`, pos.x + 45, pos.y + 780, 730, 32);
    }

    // 4. Footer & NGSS Standards Citation
    ctx.fillStyle = "#64748b";
    ctx.font = "500 22px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("NGSS Standards: HS-PS2-1 (Forces and Motion / Quantitative Measurement) & HS-ETS1-2  •  Physics with Mr. Mudry", 1000, 2350);

    // 5. Download PNG
    const cleanFileName = `Accuracy_Precision_Emoji_Art_${studentName.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    const link = document.createElement("a");
    link.download = cleanFileName;
    link.href = poster.toDataURL("image/png");
    link.click();

    // 6. Submit Score to Firestore if signed in
    if (typeof submitAssignmentGrade === "function") {
      submitAssignmentGrade(100);
    }
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
        if (currentY > y + lineHeight * 4) { // Max lines safeguard
          ctx.fillText(line + "...", x, currentY);
          return;
        }
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  initAuth() {
    if (typeof firebase === "undefined") return;

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        const email = (user.email || "").toLowerCase();
        StudioState.user = user;
        StudioState.studentName = user.displayName || user.email.split("@")[0];

        const userStatusEl = document.getElementById("auth-user-status");
        if (userStatusEl) {
          userStatusEl.innerHTML = `
            <div class="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-full text-xs text-cyan-300">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Signed in: <strong>${StudioState.studentName}</strong></span>
            </div>
          `;
        }

        const nameInput = document.getElementById("student-name-input");
        if (nameInput) nameInput.value = StudioState.studentName;
      }
    });

    const googleBtn = document.getElementById("btn-google-login");
    if (googleBtn) {
      googleBtn.addEventListener("click", () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).catch(err => {
          console.error("Auth error:", err);
          alert("Login error: " + err.message);
        });
      });
    }
  }
}

// Firestore grade submission
async function submitAssignmentGrade(percentageScore) {
  if (typeof firebase === "undefined" || !firebase.auth().currentUser) return;
  const user = firebase.auth().currentUser;
  const email = (user.email || "").toLowerCase();
  const studentId = email.split("@")[0];
  const db = firebase.firestore();

  const scoreRef = db.collection("student_results")
                     .doc(ASSIGNMENT_ID)
                     .collection("students")
                     .doc(studentId);

  try {
    const doc = await scoreRef.get();
    if (!doc.exists || percentageScore > (doc.data().score || 0)) {
      await scoreRef.set({
        student_id: studentId,
        student_name: user.displayName || studentId,
        score: percentageScore,
        assignment_id: ASSIGNMENT_ID,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`Successfully recorded score of ${percentageScore}% in Firestore.`);
    }
  } catch (err) {
    console.error("Firestore submission error:", err);
  }
}

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  window.studio = new EmojiArtStudio();
});

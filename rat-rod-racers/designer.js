/**
 * Rat Rod Racers: Custom Car Body Designer Studio Logic
 * Handles interactive drawing, vector polygons, flood fill,
 * alignment rig guides, live composite car rig preview, and export/sync.
 */

(function () {
  'use strict';

  // --- Constants & Coordinate Transform ---
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;

  // Origin (0,0) in game coordinates maps to canvas center
  const ORIGIN_X = 400;
  const ORIGIN_Y = 230; // slightly lower than center to allow tall rooflines/blowers
  const GAME_SCALE = 5.2; // 1 game unit = 5.2 canvas pixels

  function gameToCanvas(gx, gy) {
    return {
      x: ORIGIN_X + gx * GAME_SCALE,
      y: ORIGIN_Y + gy * GAME_SCALE
    };
  }

  function canvasToGame(cx, cy) {
    return {
      x: (cx - ORIGIN_X) / GAME_SCALE,
      y: (cy - ORIGIN_Y) / GAME_SCALE
    };
  }

  // --- State ---
  const state = {
    currentTool: 'brush', // brush, polygon, line, bucket, eraser, eyedropper
    brushSize: 4,
    color: '#a04822',
    polyPoints: [],
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    undoStack: [],
    redoStack: [],
    maxUndo: 30,

    // Overlays
    showWheels: true,
    showFrame: true,
    showEngine: true,
    showGrid: true,
    templateOpacity: 0.35,

    // Active Template
    activeTemplate: null,

    // Rig preview options
    previewEngine: 'blower',
    previewWheels: 'slicks',
    animFrameId: null,
    wheelRotation: 0
  };

  // --- DOM Elements ---
  const drawingCanvas = document.getElementById('drawingCanvas');
  const drawCtx = drawingCanvas.getContext('2d', { willReadFrequently: true });

  const overlayCanvas = document.getElementById('overlayCanvas');
  const overlayCtx = overlayCanvas.getContext('2d');

  const templateCanvas = document.getElementById('templateCanvas');
  const templateCtx = templateCanvas.getContext('2d');

  const rigCanvas = document.getElementById('rigPreviewCanvas');
  const rigCtx = rigCanvas.getContext('2d');

  const brushSizeInput = document.getElementById('brushSize');
  const brushSizeVal = document.getElementById('brushSizeVal');
  const nativeColorPicker = document.getElementById('nativeColorPicker');
  const colorPreviewBox = document.getElementById('colorPreviewBox');
  const hexColorInput = document.getElementById('hexColorInput');
  const templateOpacityInput = document.getElementById('templateOpacity');
  const templateOpacityVal = document.getElementById('templateOpacityVal');
  const coordPill = document.getElementById('canvasCoordPill');

  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnClear = document.getElementById('btn-clear');
  const btnFinishPoly = document.getElementById('btn-finish-poly');
  const btnCancelPoly = document.getElementById('btn-cancel-poly');
  const btnTraceToDraw = document.getElementById('btn-trace-to-draw');
  const btnHideTemplate = document.getElementById('btn-hide-template');

  const btnSaveGarage = document.getElementById('btn-save-garage');
  const btnExportPng = document.getElementById('btn-export-png');
  const btnExportSvg = document.getElementById('btn-export-svg');
  const btnExportCode = document.getElementById('btn-export-code');
  const fileImportInput = document.getElementById('file-import-input');

  const codeModal = document.getElementById('codeModal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCopyCode = document.getElementById('btn-copy-code');
  const codeSnippetContent = document.getElementById('codeSnippetContent');
  const toastNotice = document.getElementById('toastNotice');
  const toastMsg = document.getElementById('toastMsg');

  // --- Initialize Studio ---
  function init() {
    setupToolButtons();
    setupColorPicker();
    setupSliders();
    setupCanvasEvents();
    setupTemplates();
    setupExportHandlers();
    setupKeyboardShortcuts();

    // Initial canvas save state
    saveState();

    // Draw initial overlays
    renderOverlays();

    // Start live rig preview animation loop
    startRigAnimation();

    // Load any previously saved custom chassis draft if available
    loadPreviousDraft();
  }

  // --- Undo / Redo Management ---
  function saveState() {
    state.undoStack.push(drawCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));
    if (state.undoStack.length > state.maxUndo) {
      state.undoStack.shift();
    }
    state.redoStack = []; // clear redo on new action
  }

  function undo() {
    if (state.undoStack.length > 1) {
      const current = state.undoStack.pop();
      state.redoStack.push(current);
      const prev = state.undoStack[state.undoStack.length - 1];
      drawCtx.putImageData(prev, 0, 0);
      triggerRigUpdate();
      showToast('Undo', '↩️');
    }
  }

  function redo() {
    if (state.redoStack.length > 0) {
      const next = state.redoStack.pop();
      state.undoStack.push(next);
      drawCtx.putImageData(next, 0, 0);
      triggerRigUpdate();
      showToast('Redo', '↪️');
    }
  }

  function clearDrawing() {
    if (confirm('Clear the current drawing? This cannot be undone.')) {
      saveState();
      drawCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      triggerRigUpdate();
      showToast('Canvas Cleared', '🗑️');
    }
  }

  // --- Tool Switching ---
  function setupToolButtons() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentTool = btn.dataset.tool;

        // If leaving polygon mode while points exist, cancel
        if (state.currentTool !== 'polygon' && state.polyPoints.length > 0) {
          cancelPolygon();
        }
      });
    });

    btnUndo.addEventListener('click', undo);
    btnRedo.addEventListener('click', redo);
    btnClear.addEventListener('click', clearDrawing);
  }

  // --- Color Selection ---
  function setColor(hex) {
    state.color = hex;
    colorPreviewBox.style.backgroundColor = hex;
    nativeColorPicker.value = hex;
    hexColorInput.value = hex.toUpperCase();

    document.querySelectorAll('.swatch-btn').forEach(s => {
      s.classList.toggle('active', s.dataset.color.toLowerCase() === hex.toLowerCase());
    });
  }

  function setupColorPicker() {
    nativeColorPicker.addEventListener('input', (e) => {
      setColor(e.target.value);
    });

    hexColorInput.addEventListener('change', (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        setColor(val);
      }
    });

    document.querySelectorAll('.swatch-btn').forEach(swatch => {
      swatch.addEventListener('click', () => {
        setColor(swatch.dataset.color);
      });
    });
  }

  // --- Sliders & Checkboxes ---
  function setupSliders() {
    brushSizeInput.addEventListener('input', (e) => {
      state.brushSize = parseInt(e.target.value, 10);
      brushSizeVal.textContent = `${state.brushSize} px`;
    });

    templateOpacityInput.addEventListener('input', (e) => {
      state.templateOpacity = parseInt(e.target.value, 10) / 100;
      templateOpacityVal.textContent = `${e.target.value}%`;
      templateCanvas.style.opacity = state.templateOpacity;
    });

    document.getElementById('chk-show-wheels').addEventListener('change', (e) => {
      state.showWheels = e.target.checked;
      renderOverlays();
    });
    document.getElementById('chk-show-frame').addEventListener('change', (e) => {
      state.showFrame = e.target.checked;
      renderOverlays();
    });
    document.getElementById('chk-show-engine').addEventListener('change', (e) => {
      state.showEngine = e.target.checked;
      renderOverlays();
    });
    document.getElementById('chk-show-grid').addEventListener('change', (e) => {
      state.showGrid = e.target.checked;
      renderOverlays();
    });

    document.getElementById('rig-engine-select').addEventListener('change', (e) => {
      state.previewEngine = e.target.value;
    });
    document.getElementById('rig-wheels-select').addEventListener('change', (e) => {
      state.previewWheels = e.target.value;
    });
  }

  // --- Canvas Interaction & Tools Implementation ---
  function getCanvasCoords(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    const scaleX = drawingCanvas.width / rect.width;
    const scaleY = drawingCanvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function setupCanvasEvents() {
    drawingCanvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    // Touch support
    drawingCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        onPointerDown(e.touches[0]);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && state.isDrawing) {
        onPointerMove(e.touches[0]);
      }
    });

    window.addEventListener('touchend', (e) => {
      if (state.isDrawing) {
        onPointerUp();
      }
    });

    btnFinishPoly.addEventListener('click', finishPolygon);
    btnCancelPoly.addEventListener('click', cancelPolygon);
  }

  function onPointerDown(e) {
    const pt = getCanvasCoords(e);
    if (pt.x < 0 || pt.x > CANVAS_WIDTH || pt.y < 0 || pt.y > CANVAS_HEIGHT) return;

    if (state.currentTool === 'eyedropper') {
      pickColorAt(pt.x, pt.y);
      return;
    }

    if (state.currentTool === 'bucket') {
      saveState();
      floodFill(Math.round(pt.x), Math.round(pt.y), hexToRgba(state.color));
      triggerRigUpdate();
      return;
    }

    if (state.currentTool === 'polygon') {
      handlePolygonClick(pt.x, pt.y);
      return;
    }

    // Freehand Brush, Eraser, or Line
    saveState();
    state.isDrawing = true;
    state.lastX = pt.x;
    state.lastY = pt.y;

    if (state.currentTool === 'brush' || state.currentTool === 'eraser') {
      drawDot(pt.x, pt.y);
    }
  }

  function onPointerMove(e) {
    const pt = getCanvasCoords(e);

    // Update coordinate status badge
    if (pt.x >= 0 && pt.x <= CANVAS_WIDTH && pt.y >= 0 && pt.y <= CANVAS_HEIGHT) {
      const g = canvasToGame(pt.x, pt.y);
      coordPill.textContent = `X: ${Math.round(g.x)}, Y: ${Math.round(g.y)} (Game Units)`;
    }

    if (!state.isDrawing) {
      if (state.currentTool === 'polygon' && state.polyPoints.length > 0) {
        renderOverlays(pt.x, pt.y);
      }
      return;
    }

    if (state.currentTool === 'brush') {
      drawCtx.save();
      drawCtx.strokeStyle = state.color;
      drawCtx.lineWidth = state.brushSize;
      drawCtx.lineCap = 'round';
      drawCtx.lineJoin = 'round';
      drawCtx.beginPath();
      drawCtx.moveTo(state.lastX, state.lastY);
      drawCtx.lineTo(pt.x, pt.y);
      drawCtx.stroke();
      drawCtx.restore();

      state.lastX = pt.x;
      state.lastY = pt.y;
    } else if (state.currentTool === 'eraser') {
      drawCtx.save();
      drawCtx.globalCompositeOperation = 'destination-out';
      drawCtx.lineWidth = state.brushSize * 2.5;
      drawCtx.lineCap = 'round';
      drawCtx.lineJoin = 'round';
      drawCtx.beginPath();
      drawCtx.moveTo(state.lastX, state.lastY);
      drawCtx.lineTo(pt.x, pt.y);
      drawCtx.stroke();
      drawCtx.restore();

      state.lastX = pt.x;
      state.lastY = pt.y;
    } else if (state.currentTool === 'line') {
      // Temporary line preview drawn on overlay layer
      renderOverlays();
      overlayCtx.save();
      overlayCtx.strokeStyle = state.color;
      overlayCtx.lineWidth = state.brushSize;
      overlayCtx.lineCap = 'round';
      overlayCtx.beginPath();
      overlayCtx.moveTo(state.lastX, state.lastY);
      overlayCtx.lineTo(pt.x, pt.y);
      overlayCtx.stroke();
      overlayCtx.restore();
    }
  }

  function onPointerUp(e) {
    if (!state.isDrawing) return;
    state.isDrawing = false;

    if (state.currentTool === 'line' && e) {
      const pt = getCanvasCoords(e);
      drawCtx.save();
      drawCtx.strokeStyle = state.color;
      drawCtx.lineWidth = state.brushSize;
      drawCtx.lineCap = 'round';
      drawCtx.beginPath();
      drawCtx.moveTo(state.lastX, state.lastY);
      drawCtx.lineTo(pt.x, pt.y);
      drawCtx.stroke();
      drawCtx.restore();
      renderOverlays();
    }

    triggerRigUpdate();
  }

  function drawDot(x, y) {
    drawCtx.save();
    if (state.currentTool === 'eraser') {
      drawCtx.globalCompositeOperation = 'destination-out';
      drawCtx.fillStyle = '#000';
      drawCtx.beginPath();
      drawCtx.arc(x, y, state.brushSize * 1.25, 0, Math.PI * 2);
      drawCtx.fill();
    } else {
      drawCtx.fillStyle = state.color;
      drawCtx.beginPath();
      drawCtx.arc(x, y, state.brushSize / 2, 0, Math.PI * 2);
      drawCtx.fill();
    }
    drawCtx.restore();
  }

  // --- Polygon Mode Logic ---
  function handlePolygonClick(x, y) {
    // If clicked near the first point and we have at least 3 points, auto-finish
    if (state.polyPoints.length >= 3) {
      const first = state.polyPoints[0];
      const dist = Math.hypot(x - first.x, y - first.y);
      if (dist < 15) {
        finishPolygon();
        return;
      }
    }

    state.polyPoints.push({ x, y });
    btnFinishPoly.classList.remove('hidden');
    btnCancelPoly.classList.remove('hidden');
    renderOverlays();
  }

  function finishPolygon() {
    if (state.polyPoints.length < 3) {
      cancelPolygon();
      return;
    }

    saveState();

    drawCtx.save();
    drawCtx.fillStyle = state.color;
    drawCtx.strokeStyle = '#12121c'; // Rat rod ink outline
    drawCtx.lineWidth = Math.max(2.5, state.brushSize);
    drawCtx.lineJoin = 'round';
    drawCtx.lineCap = 'round';

    drawCtx.beginPath();
    drawCtx.moveTo(state.polyPoints[0].x, state.polyPoints[0].y);
    for (let i = 1; i < state.polyPoints.length; i++) {
      drawCtx.lineTo(state.polyPoints[i].x, state.polyPoints[i].y);
    }
    drawCtx.closePath();
    drawCtx.fill();
    drawCtx.stroke();

    drawCtx.restore();

    state.polyPoints = [];
    btnFinishPoly.classList.add('hidden');
    btnCancelPoly.classList.add('hidden');
    renderOverlays();
    triggerRigUpdate();
    showToast('Polygon Shape Filled', '📐');
  }

  function cancelPolygon() {
    state.polyPoints = [];
    btnFinishPoly.classList.add('hidden');
    btnCancelPoly.classList.add('hidden');
    renderOverlays();
  }

  // --- Eyedropper & Flood Fill ---
  function pickColorAt(x, y) {
    const pixel = drawCtx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    if (pixel[3] > 0) {
      const hex = '#' + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
      setColor(hex);
      showToast(`Sampled ${hex.toUpperCase()}`, '🧪');
    }
  }

  function hexToRgba(hex) {
    const c = hex.replace('#', '');
    return [
      parseInt(c.substring(0, 2), 16),
      parseInt(c.substring(2, 4), 16),
      parseInt(c.substring(4, 6), 16),
      255
    ];
  }

  function floodFill(startX, startY, fillRgba) {
    const imgData = drawCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imgData.data;

    const startPos = (startY * CANVAS_WIDTH + startX) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    // Don't fill if color matches
    if (
      Math.abs(startR - fillRgba[0]) < 5 &&
      Math.abs(startG - fillRgba[1]) < 5 &&
      Math.abs(startB - fillRgba[2]) < 5 &&
      Math.abs(startA - fillRgba[3]) < 5
    ) {
      return;
    }

    const queue = [[startX, startY]];
    const visited = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
    const tolerance = 32;

    function match(x, y) {
      const pos = (y * CANVAS_WIDTH + x) * 4;
      const dr = Math.abs(data[pos] - startR);
      const dg = Math.abs(data[pos + 1] - startG);
      const db = Math.abs(data[pos + 2] - startB);
      const da = Math.abs(data[pos + 3] - startA);
      return (dr + dg + db + da) <= tolerance;
    }

    while (queue.length > 0) {
      const [x, y] = queue.pop();
      const idx = y * CANVAS_WIDTH + x;

      if (visited[idx]) continue;
      visited[idx] = 1;

      const pos = idx * 4;
      data[pos] = fillRgba[0];
      data[pos + 1] = fillRgba[1];
      data[pos + 2] = fillRgba[2];
      data[pos + 3] = fillRgba[3];

      if (x > 0 && !visited[idx - 1] && match(x - 1, y)) queue.push([x - 1, y]);
      if (x < CANVAS_WIDTH - 1 && !visited[idx + 1] && match(x + 1, y)) queue.push([x + 1, y]);
      if (y > 0 && !visited[idx - CANVAS_WIDTH] && match(x, y - 1)) queue.push([x, y - 1]);
      if (y < CANVAS_HEIGHT - 1 && !visited[idx + CANVAS_WIDTH] && match(x, y + 1)) queue.push([x, y + 1]);
    }

    drawCtx.putImageData(imgData, 0, 0);
  }

  // --- Rig Alignment Overlays Renderer ---
  function renderOverlays(cursorX = null, cursorY = null) {
    overlayCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Grid & Axes
    if (state.showGrid) {
      overlayCtx.save();
      overlayCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      overlayCtx.lineWidth = 1;

      // Vertical 10-unit game grid lines
      for (let gx = -60; gx <= 60; gx += 10) {
        const pt = gameToCanvas(gx, 0);
        overlayCtx.beginPath();
        overlayCtx.moveTo(pt.x, 0);
        overlayCtx.lineTo(pt.x, CANVAS_HEIGHT);
        overlayCtx.stroke();
      }

      // Horizontal 10-unit game grid lines
      for (let gy = -40; gy <= 30; gy += 10) {
        const pt = gameToCanvas(0, gy);
        overlayCtx.beginPath();
        overlayCtx.moveTo(0, pt.y);
        overlayCtx.lineTo(CANVAS_WIDTH, pt.y);
        overlayCtx.stroke();
      }

      // Center Origin Axes
      overlayCtx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      overlayCtx.setLineDash([4, 4]);
      overlayCtx.beginPath();
      overlayCtx.moveTo(ORIGIN_X, 0);
      overlayCtx.lineTo(ORIGIN_X, CANVAS_HEIGHT);
      overlayCtx.moveTo(0, ORIGIN_Y);
      overlayCtx.lineTo(CANVAS_WIDTH, ORIGIN_Y);
      overlayCtx.stroke();
      overlayCtx.setLineDash([]);
      overlayCtx.restore();
    }

    // 2. Ground Plane & Steel Frame Rails
    if (state.showFrame) {
      overlayCtx.save();

      // Ground Plane at gy = +26
      const ground = gameToCanvas(0, 26);
      overlayCtx.strokeStyle = '#ffbe0b';
      overlayCtx.lineWidth = 2;
      overlayCtx.setLineDash([8, 6]);
      overlayCtx.beginPath();
      overlayCtx.moveTo(20, ground.y);
      overlayCtx.lineTo(CANVAS_WIDTH - 20, ground.y);
      overlayCtx.stroke();
      overlayCtx.setLineDash([]);

      overlayCtx.fillStyle = '#ffbe0b';
      overlayCtx.font = 'bold 10px monospace';
      overlayCtx.fillText('GROUND LEVEL (y = +26)', 30, ground.y - 6);

      // Chassis Ladder Frame Rail from gx = -48 to +48 at gy = 6..12
      const f1 = gameToCanvas(-48, 6);
      const f2 = gameToCanvas(48, 12);
      overlayCtx.fillStyle = 'rgba(73, 80, 87, 0.35)';
      overlayCtx.strokeStyle = '#adb5bd';
      overlayCtx.lineWidth = 1.5;
      overlayCtx.strokeRect(f1.x, f1.y, f2.x - f1.x, f2.y - f1.y);
      overlayCtx.fillRect(f1.x, f1.y, f2.x - f1.x, f2.y - f1.y);

      overlayCtx.fillStyle = '#adb5bd';
      overlayCtx.font = '10px monospace';
      overlayCtx.fillText('FRAME RAIL BASELINE (y = +8)', f1.x + 8, f1.y - 4);

      overlayCtx.restore();
    }

    // 3. Axle Centers & Wheels Cutout Guides
    if (state.showWheels) {
      overlayCtx.save();

      // Rear Axle at [-32, 10], radius 18.4 game units
      const rearAxle = gameToCanvas(-32, 10);
      const rearRadius = 18.4 * GAME_SCALE;

      // Front Axle at [+32, 10], radius 15.2 game units
      const frontAxle = gameToCanvas(32, 10);
      const frontRadius = 15.2 * GAME_SCALE;

      // Draw Rear Wheel Cutout Envelope
      overlayCtx.strokeStyle = 'rgba(255, 107, 26, 0.8)';
      overlayCtx.lineWidth = 2;
      overlayCtx.setLineDash([5, 5]);
      overlayCtx.beginPath();
      overlayCtx.arc(rearAxle.x, rearAxle.y, rearRadius, 0, Math.PI * 2);
      overlayCtx.stroke();

      overlayCtx.fillStyle = 'rgba(255, 107, 26, 0.08)';
      overlayCtx.beginPath();
      overlayCtx.arc(rearAxle.x, rearAxle.y, rearRadius, 0, Math.PI * 2);
      overlayCtx.fill();

      // Rear Axle Center Crosshair
      drawCrosshair(overlayCtx, rearAxle.x, rearAxle.y, 8, '#ff6b1a');
      overlayCtx.fillStyle = '#ff6b1a';
      overlayCtx.font = 'bold 11px monospace';
      overlayCtx.textAlign = 'center';
      overlayCtx.fillText('REAR AXLE [-32, 10]', rearAxle.x, rearAxle.y - rearRadius - 6);

      // Draw Front Wheel Cutout Envelope
      overlayCtx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
      overlayCtx.lineWidth = 2;
      overlayCtx.setLineDash([5, 5]);
      overlayCtx.beginPath();
      overlayCtx.arc(frontAxle.x, frontAxle.y, frontRadius, 0, Math.PI * 2);
      overlayCtx.stroke();

      overlayCtx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      overlayCtx.beginPath();
      overlayCtx.arc(frontAxle.x, frontAxle.y, frontRadius, 0, Math.PI * 2);
      overlayCtx.fill();

      // Front Axle Center Crosshair
      drawCrosshair(overlayCtx, frontAxle.x, frontAxle.y, 8, '#00f0ff');
      overlayCtx.fillStyle = '#00f0ff';
      overlayCtx.font = 'bold 11px monospace';
      overlayCtx.fillText('FRONT AXLE [+32, 10]', frontAxle.x, frontAxle.y - frontRadius - 6);

      overlayCtx.restore();
    }

    // 4. Engine Bay Clearance Guide
    if (state.showEngine) {
      overlayCtx.save();
      const eng1 = gameToCanvas(10, -28);
      const eng2 = gameToCanvas(36, 8);

      overlayCtx.fillStyle = 'rgba(230, 57, 70, 0.12)';
      overlayCtx.strokeStyle = 'rgba(230, 57, 70, 0.6)';
      overlayCtx.lineWidth = 1.5;
      overlayCtx.setLineDash([4, 4]);
      overlayCtx.strokeRect(eng1.x, eng1.y, eng2.x - eng1.x, eng2.y - eng1.y);
      overlayCtx.fillRect(eng1.x, eng1.y, eng2.x - eng1.x, eng2.y - eng1.y);

      overlayCtx.fillStyle = '#e63946';
      overlayCtx.font = 'bold 10px monospace';
      overlayCtx.fillText('⚡ EXPOSED ENGINE ENVELOPE', eng1.x + 6, eng1.y + 14);
      overlayCtx.restore();
    }

    // 5. Door Roundel Decal Guide at (0, -4), radius 9
    const doorCenter = gameToCanvas(0, -4);
    const doorRadius = 9 * GAME_SCALE;
    overlayCtx.save();
    overlayCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    overlayCtx.lineWidth = 1.2;
    overlayCtx.setLineDash([3, 3]);
    overlayCtx.beginPath();
    overlayCtx.arc(doorCenter.x, doorCenter.y, doorRadius, 0, Math.PI * 2);
    overlayCtx.stroke();
    overlayCtx.restore();

    // 6. Active Polygon Drawing Guide Points
    if (state.polyPoints.length > 0) {
      overlayCtx.save();
      overlayCtx.strokeStyle = '#00f0ff';
      overlayCtx.fillStyle = 'rgba(0, 240, 255, 0.2)';
      overlayCtx.lineWidth = 2;

      overlayCtx.beginPath();
      overlayCtx.moveTo(state.polyPoints[0].x, state.polyPoints[0].y);
      for (let i = 1; i < state.polyPoints.length; i++) {
        overlayCtx.lineTo(state.polyPoints[i].x, state.polyPoints[i].y);
      }
      if (cursorX !== null && cursorY !== null) {
        overlayCtx.lineTo(cursorX, cursorY);
      }
      overlayCtx.stroke();

      // Draw point anchors
      state.polyPoints.forEach((p, idx) => {
        overlayCtx.fillStyle = idx === 0 ? '#ffbe0b' : '#00f0ff';
        overlayCtx.beginPath();
        overlayCtx.arc(p.x, p.y, idx === 0 ? 6 : 4, 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.stroke();
      });

      overlayCtx.restore();
    }
  }

  function drawCrosshair(ctx, x, y, size, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    ctx.restore();
  }

  // --- Starter Templates ---
  const TEMPLATES = {
    coupe32: [
      [-45, 8], [-26, 8], [-20, -18], [-12, -32], [12, -32], [16, -18], [26, -2], [44, 2], [44, 8], [-45, 8]
    ],
    roadster29: [
      [-44, 8], [-20, 8], [-14, -14], [16, -14], [26, 0], [44, 2], [44, 8], [-44, 8]
    ],
    sedan: [
      [-46, 8], [-24, 8], [-20, -26], [24, -26], [30, 2], [45, 4], [45, 8], [-46, 8]
    ],
    deliveryvan: [
      [-46, 8], [-46, -30], [10, -30], [24, -8], [44, -4], [44, 8], [-46, 8]
    ],
    lakester: [
      [-48, 4], [-40, -12], [-10, -22], [10, -22], [38, -12], [48, 2], [44, 8], [-44, 8], [-48, 4]
    ],
    gasser: [
      [-45, 4], [-24, 4], [-18, -24], [-6, -34], [14, -34], [24, -18], [34, -10], [46, -6], [46, 4], [-45, 4]
    ]
  };

  function setupTemplates() {
    document.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const key = card.dataset.template;
        loadTemplateSilhouette(key);
      });
    });

    btnTraceToDraw.addEventListener('click', () => {
      if (!state.activeTemplate || !TEMPLATES[state.activeTemplate]) {
        showToast('Select a template first!', '⚠️');
        return;
      }
      bakeTemplateToDrawingLayer(TEMPLATES[state.activeTemplate]);
    });

    btnHideTemplate.addEventListener('click', () => {
      templateCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      state.activeTemplate = null;
      document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
      showToast('Template cleared', '✕');
    });
  }

  function loadTemplateSilhouette(key) {
    if (key === 'jalopy2') {
      state.activeTemplate = 'jalopy2';
      templateCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const img = new Image();
      img.onload = () => {
        templateCtx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        showToast('Loaded JALOPY SPECIAL #2 template', '📐');
      };
      img.src = 'assets/jalopy_special_2.png';
      return;
    }

    const pts = TEMPLATES[key];
    if (!pts) return;
    state.activeTemplate = key;

    templateCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    templateCtx.save();
    templateCtx.fillStyle = '#ced4da';
    templateCtx.strokeStyle = '#12121c';
    templateCtx.lineWidth = 3;
    templateCtx.lineJoin = 'round';

    templateCtx.beginPath();
    const first = gameToCanvas(pts[0][0], pts[0][1]);
    templateCtx.moveTo(first.x, first.y);
    for (let i = 1; i < pts.length; i++) {
      const p = gameToCanvas(pts[i][0], pts[i][1]);
      templateCtx.lineTo(p.x, p.y);
    }
    templateCtx.closePath();
    templateCtx.fill();
    templateCtx.stroke();
    templateCtx.restore();

    showToast(`Loaded ${key.toUpperCase()} template`, '📐');
  }

  function bakeTemplateToDrawingLayer(pts) {
    if (state.activeTemplate === 'jalopy2') {
      saveState();
      const img = new Image();
      img.onload = () => {
        drawCtx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        triggerRigUpdate();
        showToast('Baked Jalopy Special #2 to drawing layer!', '✏️');
      };
      img.src = 'assets/jalopy_special_2.png';
      return;
    }

    saveState();
    drawCtx.save();
    drawCtx.fillStyle = state.color;
    drawCtx.strokeStyle = '#12121c';
    drawCtx.lineWidth = Math.max(3, state.brushSize);
    drawCtx.lineJoin = 'round';

    drawCtx.beginPath();
    const first = gameToCanvas(pts[0][0], pts[0][1]);
    drawCtx.moveTo(first.x, first.y);
    for (let i = 1; i < pts.length; i++) {
      const p = gameToCanvas(pts[i][0], pts[i][1]);
      drawCtx.lineTo(p.x, p.y);
    }
    drawCtx.closePath();
    drawCtx.fill();
    drawCtx.stroke();
    drawCtx.restore();

    triggerRigUpdate();
    showToast('Baked template to drawing layer!', '✏️');
  }

  // --- Live Assembled Rig Mini Viewport ---
  function startRigAnimation() {
    function animate() {
      state.wheelRotation += 0.05;
      renderLiveRig();
      state.animFrameId = requestAnimationFrame(animate);
    }
    animate();
  }

  function triggerRigUpdate() {
    renderLiveRig();
  }

  function renderLiveRig() {
    rigCtx.clearRect(0, 0, rigCanvas.width, rigCanvas.height);

    const cx = rigCanvas.width / 2;
    const cy = 85;
    const scale = 1.35; // mini scale

    rigCtx.save();
    rigCtx.translate(cx, cy);
    rigCtx.scale(scale, scale);

    // 1. Underbody Shadow & Road Track
    rigCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    rigCtx.beginPath();
    rigCtx.ellipse(0, 18, 55, 6, 0, 0, Math.PI * 2);
    rigCtx.fill();

    // 2. Chassis Ladder Frame
    rigCtx.fillStyle = '#1c1f26';
    rigCtx.strokeStyle = '#12121c';
    rigCtx.lineWidth = 2.4;
    rigCtx.beginPath();
    if (rigCtx.roundRect) {
      rigCtx.roundRect(-48, 6, 96, 6, 2);
    } else {
      rigCtx.rect(-48, 6, 96, 6);
    }
    rigCtx.fill();
    rigCtx.stroke();

    // 3. Powertrain (Engine)
    renderMiniPowertrain(rigCtx, state.previewEngine);

    // 4. THE CUSTOM BODY (Drawn by user!)
    renderCustomBodyOnRig(rigCtx);

    // 5. Wheels
    renderMiniWheel(rigCtx, state.previewWheels, -32, 10, state.wheelRotation, 1.15);
    renderMiniWheel(rigCtx, state.previewWheels, 32, 10, state.wheelRotation, 0.95);

    rigCtx.restore();
  }

  function renderCustomBodyOnRig(ctx) {
    // Map the 800x400 drawing canvas onto the rig coordinate system
    // Canvas (ORIGIN_X, ORIGIN_Y) corresponds to Rig (0, 0)
    // Canvas GAME_SCALE is 5.2, so 1 game unit on canvas = 5.2px.
    // To draw on rig space, scale is 1.0 / GAME_SCALE.
    ctx.save();
    ctx.scale(1.0 / GAME_SCALE, 1.0 / GAME_SCALE);
    ctx.drawImage(drawingCanvas, -ORIGIN_X, -ORIGIN_Y);
    ctx.restore();
  }

  function renderMiniPowertrain(ctx, type) {
    ctx.save();
    ctx.translate(22, -4);
    ctx.strokeStyle = '#12121c';
    ctx.lineWidth = 2;

    if (type === 'blower') {
      ctx.fillStyle = '#a82828';
      ctx.fillRect(-10, -6, 20, 14);
      ctx.strokeRect(-10, -6, 20, 14);
      ctx.fillStyle = '#ced4da';
      ctx.fillRect(-12, -18, 24, 12);
      ctx.strokeRect(-12, -18, 24, 12);
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.moveTo(-10, -18); ctx.lineTo(-4, -28); ctx.lineTo(14, -28); ctx.lineTo(10, -18);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (type === 'diesel') {
      ctx.fillStyle = '#2b2d42';
      ctx.fillRect(-12, -8, 24, 16); ctx.strokeRect(-12, -8, 24, 16);
      ctx.fillStyle = '#111';
      ctx.fillRect(-8, -26, 4, 18); ctx.strokeRect(-8, -26, 4, 18);
      ctx.fillRect(-1, -26, 4, 18); ctx.strokeRect(-1, -26, 4, 18);
    } else {
      ctx.fillStyle = '#e76f51';
      ctx.fillRect(-10, -6, 20, 14); ctx.strokeRect(-10, -6, 20, 14);
      ctx.fillStyle = '#ced4da';
      ctx.beginPath(); ctx.arc(-6, -10, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(6, -10, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function renderMiniWheel(ctx, type, x, y, angle, scale = 1.0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.rotate(angle);

    ctx.fillStyle = '#1c1f26';
    ctx.strokeStyle = '#12121c';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = (type === 'salt_discs') ? '#ced4da' : '#ffbe0b';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#12121c';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Sidewall notch indicator to visualize spin
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 0.4);
    ctx.stroke();

    ctx.restore();
  }

  // --- Export & In-Game Racing Sync ---
  function getCustomChassisMetadata() {
    const name = document.getElementById('bodyNameInput').value.trim() || 'Custom Jalopy';
    const archetype = document.getElementById('bodyArchetypeSelect').value;
    const mass = parseInt(document.getElementById('bodyMassInput').value, 10) || 160;
    const cdA = parseFloat(document.getElementById('bodyDragInput').value) || 0.32;
    const aeroScore = Math.max(20, Math.min(100, Math.round((0.60 - cdA) * 200)));

    return {
      id: 'BOD-CUSTOM',
      name: name,
      category: 'chassis',
      archetype: archetype,
      rarity: 'epic',
      cost: 4,
      aeroScore: aeroScore,
      cdA: cdA,
      hCG: 0.40,
      mass: mass,
      durability: 80,
      flex: 'Med',
      color: state.color,
      accent: '#ffbe0b',
      trait: 'Handmade Steel',
      traitDesc: 'Crafted in the custom chassis lab with tailored aerodynamic proportions.',
      renderType: 'custom_image',
      dataUrl: drawingCanvas.toDataURL('image/png')
    };
  }

  function setupExportHandlers() {
    // 1. Save to Garage & Race
    btnSaveGarage.addEventListener('click', () => {
      const chassisData = getCustomChassisMetadata();

      try {
        localStorage.setItem('ratrod_custom_chassis', JSON.stringify(chassisData));
        showToast('🏎️ Saved to Garage! Equipping...', '✅');

        setTimeout(() => {
          if (confirm('Chassis saved! Would you like to launch Rat Rod Racers and race it right now?')) {
            window.location.href = 'index.html?equip_custom=1';
          }
        }, 300);
      } catch (err) {
        alert('Could not save to localStorage (storage quota might be full). Try exporting PNG instead.');
      }
    });

    // 2. Export PNG
    btnExportPng.addEventListener('click', () => {
      // Export a clean, cropped 512x256 transparent PNG
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 512;
      exportCanvas.height = 256;
      const expCtx = exportCanvas.getContext('2d');

      // Center the drawing onto the 512x256 image
      // Target origin: (256, 147), scale factor: 512 / 800 * 5.2
      const targetScale = 512 / CANVAS_WIDTH;
      expCtx.drawImage(
        drawingCanvas,
        0, 0, CANVAS_WIDTH, CANVAS_HEIGHT,
        0, 0, 512, 256
      );

      const safeName = (document.getElementById('bodyNameInput').value.trim() || 'custom_body')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const link = document.createElement('a');
      link.download = `${safeName}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
      showToast(`Downloaded ${safeName}.png`, '⬇️');
    });

    // 3. Export SVG
    btnExportSvg.addEventListener('click', () => {
      const dataUrl = drawingCanvas.toDataURL('image/png');
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <image href="${dataUrl}" width="800" height="400" />
</svg>`;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.download = `ratrod_body_${Date.now()}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      showToast('Downloaded SVG', '⬇️');
    });

    // 4. Export Code Snippet
    let fullExportSnippet = '';
    btnExportCode.addEventListener('click', () => {
      const data = getCustomChassisMetadata();
      fullExportSnippet = `// Add this to RAT_ROD_ASSETS.chassis in assets.js:
'${data.id}': {
  id: '${data.id}',
  name: "${data.name}",
  category: 'chassis',
  archetype: '${data.archetype}',
  rarity: 'epic',
  cost: 4,
  aeroScore: ${data.aeroScore},
  cdA: ${data.cdA},
  hCG: ${data.hCG},
  mass: ${data.mass},
  durability: 80,
  flex: 'Med',
  trait: "${data.trait}",
  traitDesc: "${data.traitDesc}",
  color: '${data.color}',
  accent: '#ffbe0b',
  renderType: 'custom_image',
  dataUrl: "${data.dataUrl}"
}`;

      // In the modal preview, show a shortened preview so it doesn't freeze the DOM, but copy the full snippet
      const previewCode = `// Add this to RAT_ROD_ASSETS.chassis in assets.js:
'${data.id}': {
  id: '${data.id}',
  name: "${data.name}",
  category: 'chassis',
  archetype: '${data.archetype}',
  rarity: 'epic',
  cost: 4,
  aeroScore: ${data.aeroScore},
  cdA: ${data.cdA},
  hCG: ${data.hCG},
  mass: ${data.mass},
  durability: 80,
  flex: 'Med',
  trait: "${data.trait}",
  traitDesc: "${data.traitDesc}",
  color: '${data.color}',
  accent: '#ffbe0b',
  renderType: 'custom_image',
  dataUrl: "${data.dataUrl.substring(0, 60)}... [${Math.round(data.dataUrl.length / 1024)} KB base64 payload]"
}`;
      codeSnippetContent.textContent = previewCode;
      codeModal.classList.remove('hidden');
    });

    btnCloseModal.addEventListener('click', () => {
      codeModal.classList.add('hidden');
    });

    btnCopyCode.addEventListener('click', () => {
      navigator.clipboard.writeText(fullExportSnippet).then(() => {
        showToast('Copied full code snippet to clipboard!', '📋');
      });
    });

    // 5. Import File (Image/PNG)
    fileImportInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          saveState();
          // Draw imported image onto template layer for tracing
          templateCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          templateCtx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          showToast('Imported image to template layer!', '📂');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // --- Draft Persistence ---
  function loadPreviousDraft() {
    try {
      const saved = localStorage.getItem('ratrod_custom_chassis');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.dataUrl) {
          const img = new Image();
          img.onload = () => {
            drawCtx.drawImage(img, 0, 0);
            saveState();
            triggerRigUpdate();
          };
          img.src = parsed.dataUrl;

          if (parsed.name) document.getElementById('bodyNameInput').value = parsed.name;
          if (parsed.archetype) document.getElementById('bodyArchetypeSelect').value = parsed.archetype;
          if (parsed.mass) document.getElementById('bodyMassInput').value = parsed.mass;
          if (parsed.cdA) document.getElementById('bodyDragInput').value = parsed.cdA;
          if (parsed.color) setColor(parsed.color);
        }
      }
    } catch (e) {
      console.warn('Could not load previous chassis draft', e);
    }
  }

  // --- Keyboard Shortcuts ---
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't intercept when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'b' || e.key === 'B') {
        document.querySelector('[data-tool="brush"]').click();
      } else if (e.key === 'p' || e.key === 'P') {
        document.querySelector('[data-tool="polygon"]').click();
      } else if (e.key === 'e' || e.key === 'E') {
        document.querySelector('[data-tool="eraser"]').click();
      } else if (e.key === 'g' || e.key === 'G') {
        document.querySelector('[data-tool="bucket"]').click();
      }
    });
  }

  // --- Toast Notification Helper ---
  let toastTimer = null;
  function showToast(msg, icon = '✨') {
    toastMsg.textContent = msg;
    document.getElementById('toastIcon').textContent = icon;
    toastNotice.classList.remove('hidden');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotice.classList.add('hidden');
    }, 2800);
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

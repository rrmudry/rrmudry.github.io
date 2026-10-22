/**
 * ============================================================================
 * EPIC 3D TIC-TAC-TOE 2077 - ARCHITECTURE & GAME ENGINE
 * Features:
 *   - 3x3x3 Classic & 4x4x4 Qubic (Parker Brothers Grandmaster Rules)
 *   - Real 3D Hologram Cube with Touch / Mouse Drag Rotation & Auto-Spin
 *   - Exploded 2D Layer Slices with 1:1 Synchronized Cross-Highlighting
 *   - Split Dual View (3D + Slices simultaneously)
 *   - Unbeatable Cyber-Master AI (Minimax & Qubic Threat-Search) + 3 Difficulty Tiers
 *   - Local 2-Player Pass & Play mode
 *   - Real-time Threat Radar for 3D Spatial Scaffolding & Education
 *   - Zero-Asset Web Audio API Polyphonic Synthesizer
 *   - WCAG AAA High-Contrast Light Mode + Cyberpunk Dark Mode
 *   - Universal Root Font Scaling for Classroom Projectors & Chromebooks
 * ============================================================================
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
   * 1. WEB AUDIO SYNTHESIZER ENGINE (Zero external assets, firewall-safe)
   * -------------------------------------------------------------------------- */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = localStorage.getItem('epic_ttt_muted') === 'true';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    setMuted(muted) {
      this.isMuted = muted;
      localStorage.setItem('epic_ttt_muted', muted ? 'true' : 'false');
    }

    playMove(player) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        if (player === 'X') {
          // Bright cyan cyber-chime (800Hz -> 1200Hz)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, t);
          osc.frequency.exponentialRampToValueAtTime(1200, t + 0.12);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.14);
        } else {
          // Warm magenta pulse (550Hz -> 400Hz)
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(550, t);
          osc.frequency.exponentialRampToValueAtTime(400, t + 0.16);
          gain.gain.setValueAtTime(0.14, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.18);
        }
      } catch (e) {
        console.warn('Audio play failed', e);
      }
    }

    playThreat() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(950, t);
        osc.frequency.setValueAtTime(1350, t + 0.08);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      } catch (e) {}
    }

    playHint() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.exponentialRampToValueAtTime(980, t + 0.18);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      } catch (e) {}
    }

    playWin() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
        notes.forEach((freq, idx) => {
          const t = this.ctx.currentTime + idx * 0.1;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.35);
        });
      } catch (e) {}
    }

    playLoss() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      try {
        const notes = [400, 320, 240, 160];
        notes.forEach((freq, idx) => {
          const t = this.ctx.currentTime + idx * 0.12;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.25);
        });
      } catch (e) {}
    }

    playDraw() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        [300, 375, 450].forEach((freq) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.35);
        });
      } catch (e) {}
    }

    playTick() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, t);
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.02);
      } catch (e) {}
    }
  }

  /* --------------------------------------------------------------------------
   * 2. AMBIENT CYBER PARTICLE & GRID CANVAS
   * -------------------------------------------------------------------------- */
  class ParticleCanvas {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.particleCount = 50;
      this.animationId = null;
      this.isLight = document.documentElement.classList.contains('theme-light');

      this.resize();
      this.initParticles();
      this.start();

      window.addEventListener('resize', () => {
        this.resize();
        this.initParticles();
      });
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }

    initParticles() {
      this.particles = [];
      for (let i = 0; i < this.particleCount; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 2 + 1,
          color: Math.random() > 0.5 ? '#00f3ff' : '#ff007f'
        });
      }
    }

    setTheme(isLight) {
      this.isLight = isLight;
    }

    start() {
      const render = () => {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Grid lines connection
        const maxDist = 120;
        const lineColor = this.isLight ? 'rgba(2, 132, 199, 0.06)' : 'rgba(0, 243, 255, 0.08)';

        this.ctx.lineWidth = 0.6;
        for (let i = 0; i < this.particles.length; i++) {
          for (let j = i + 1; j < this.particles.length; j++) {
            const p1 = this.particles[i];
            const p2 = this.particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
              this.ctx.strokeStyle = lineColor;
              this.ctx.beginPath();
              this.ctx.moveTo(p1.x, p1.y);
              this.ctx.lineTo(p2.x, p2.y);
              this.ctx.stroke();
            }
          }
        }

        // Draw and update particles
        for (const p of this.particles) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = this.width;
          if (p.x > this.width) p.x = 0;
          if (p.y < 0) p.y = this.height;
          if (p.y > this.height) p.y = 0;

          this.ctx.fillStyle = this.isLight ? 'rgba(2, 132, 199, 0.3)' : p.color;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.animationId = requestAnimationFrame(render);
      };
      render();
    }
  }

  /* --------------------------------------------------------------------------
   * 3. 3D MATHEMATICAL GEOMETRY & WINNING LINES GENERATOR
   * -------------------------------------------------------------------------- */
  function generate3DLines(N) {
    const lines = [];
    const dirs = [];

    // All 3D directional vectors (normalized so first non-zero component is positive)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;
          const first = dx !== 0 ? dx : dy !== 0 ? dy : dz;
          if (first > 0) {
            dirs.push({ dx, dy, dz });
          }
        }
      }
    }

    for (const { dx, dy, dz } of dirs) {
      const nonZeroCount = (dx !== 0 ? 1 : 0) + (dy !== 0 ? 1 : 0) + (dz !== 0 ? 1 : 0);
      const category = nonZeroCount === 1 ? 'ortho' : nonZeroCount === 2 ? 'planeDiag' : 'spaceDiag';

      for (let z = 0; z < N; z++) {
        for (let y = 0; y < N; y++) {
          for (let x = 0; x < N; x++) {
            const endX = x + (N - 1) * dx;
            const endY = y + (N - 1) * dy;
            const endZ = z + (N - 1) * dz;

            if (endX >= 0 && endX < N && endY >= 0 && endY < N && endZ >= 0 && endZ < N) {
              const cells = [];
              for (let step = 0; step < N; step++) {
                const cx = x + step * dx;
                const cy = y + step * dy;
                const cz = z + step * dz;
                cells.push(cz * N * N + cy * N + cx);
              }
              lines.push({ cells, category, dx, dy, dz });
            }
          }
        }
      }
    }

    // Cell lookup map: which lines pass through each cell
    const cellLines = Array.from({ length: N * N * N }, () => []);
    lines.forEach((lineObj, idx) => {
      lineObj.cells.forEach((cell) => cellLines[cell].push(idx));
    });

    return { lines, cellLines };
  }

  /* --------------------------------------------------------------------------
   * 4. CYBER-MASTER AI & STRATEGY ENGINE
   * -------------------------------------------------------------------------- */
  class AIEngine {
    constructor(N, lines, cellLines) {
      this.N = N;
      this.lines = lines;
      this.cellLines = cellLines;
      this.totalCells = N * N * N;
    }

    // Immediate winning move for target player
    findImmediateWin(board, player) {
      for (let c = 0; c < this.totalCells; c++) {
        if (board[c] !== null) continue;
        for (const lIdx of this.cellLines[c]) {
          const line = this.lines[lIdx].cells;
          let count = 0, empty = 0;
          for (const cell of line) {
            if (board[cell] === player) count++;
            else if (board[cell] === null) empty++;
          }
          if (count === this.N - 1 && empty === 1) return c;
        }
      }
      return -1;
    }

    // Score a candidate move based on threats created & intersections
    scoreCandidate(board, cell, aiPlayer, humanPlayer) {
      let score = this.cellLines[cell].length * 2; // base intersection value
      let aiThreatsCreated = 0;
      let humanThreatsBlocked = 0;

      for (const lIdx of this.cellLines[cell]) {
        const line = this.lines[lIdx].cells;
        let aiCount = 0;
        let humanCount = 0;

        for (const c of line) {
          if (c === cell) continue;
          if (board[c] === aiPlayer) aiCount++;
          else if (board[c] === humanPlayer) humanCount++;
        }

        // Offense: If human has no marks in this line
        if (humanCount === 0) {
          if (aiCount === this.N - 2) {
            aiThreatsCreated++;
            score += 80;
          } else if (aiCount === this.N - 3) {
            score += 15;
          } else {
            score += 3;
          }
        }

        // Defense: If AI has no marks in this line, placing here blocks human
        if (aiCount === 0) {
          if (humanCount === this.N - 2) {
            humanThreatsBlocked++;
            score += 65;
          } else if (humanCount === this.N - 3) {
            score += 12;
          } else {
            score += 2;
          }
        }
      }

      // Massive bonus for creating forks (unblockable 2-way wins)
      if (aiThreatsCreated >= 2) {
        score += 3000;
      }
      // Blocking opponent's potential fork
      if (humanThreatsBlocked >= 2) {
        score += 1800;
      }

      return score;
    }

    // 3x3x3 Minimax with Alpha-Beta Pruning
    minimax3(board, depth, alpha, beta, isMax) {
      // Fast check terminal wins
      const w = this.checkTerminalWin(board);
      if (w === 'O') return 1000 - depth;
      if (w === 'X') return -1000 + depth;
      if (depth >= 3) return this.evaluateBoard3(board);

      const empties = [];
      for (let i = 0; i < 27; i++) {
        if (board[i] === null) empties.push(i);
      }
      if (empties.length === 0) return 0;

      if (isMax) {
        let maxEval = -Infinity;
        for (const c of empties) {
          board[c] = 'O';
          const evalScore = this.minimax3(board, depth + 1, alpha, beta, false);
          board[c] = null;
          maxEval = Math.max(maxEval, evalScore);
          alpha = Math.max(alpha, evalScore);
          if (beta <= alpha) break;
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (const c of empties) {
          board[c] = 'X';
          const evalScore = this.minimax3(board, depth + 1, alpha, beta, true);
          board[c] = null;
          minEval = Math.min(minEval, evalScore);
          beta = Math.min(beta, evalScore);
          if (beta <= alpha) break;
        }
        return minEval;
      }
    }

    checkTerminalWin(board) {
      for (const lineObj of this.lines) {
        const [a, b, c] = lineObj.cells;
        const mark = board[a];
        if (mark && mark === board[b] && mark === board[c]) {
          return mark;
        }
      }
      return null;
    }

    evaluateBoard3(board) {
      let score = 0;
      for (const lineObj of this.lines) {
        let oCount = 0, xCount = 0;
        for (const c of lineObj.cells) {
          if (board[c] === 'O') oCount++;
          else if (board[c] === 'X') xCount++;
        }
        if (xCount === 3) return -1000;
        if (oCount === 3) return 1000;
        if (xCount === 0 && oCount > 0) {
          score += oCount === 2 ? 35 : 4;
        } else if (oCount === 0 && xCount > 0) {
          score -= xCount === 2 ? 40 : 4;
        }
      }
      return score;
    }

    // Main AI decision coordinator
    computeMove(board, difficulty) {
      const openCells = [];
      for (let i = 0; i < this.totalCells; i++) {
        if (board[i] === null) openCells.push(i);
      }
      if (openCells.length === 0) return -1;

      // 1. Rookie (Easy): 55% random moves, but takes free wins
      if (difficulty === 'easy') {
        const win = this.findImmediateWin(board, 'O');
        if (win !== -1 && Math.random() > 0.3) return win;
        const block = this.findImmediateWin(board, 'X');
        if (block !== -1 && Math.random() > 0.5) return block;
        return openCells[Math.floor(Math.random() * openCells.length)];
      }

      // 2. Immediate Winning Move (All higher difficulties take instant win)
      const instantWin = this.findImmediateWin(board, 'O');
      if (instantWin !== -1) return instantWin;

      // 3. Immediate Block Opponent Win
      const instantBlock = this.findImmediateWin(board, 'X');
      if (instantBlock !== -1) return instantBlock;

      // 4. Tactician (Medium)
      if (difficulty === 'medium') {
        let bestScore = -Infinity;
        let candidates = [];
        for (const cell of openCells) {
          const score = this.scoreCandidate(board, cell, 'O', 'X');
          if (score > bestScore) {
            bestScore = score;
            candidates = [cell];
          } else if (score === bestScore) {
            candidates.push(cell);
          }
        }
        return candidates[Math.floor(Math.random() * candidates.length)];
      }

      // 5. Cyber-Master (Hard / Unbeatable)
      if (this.N === 3) {
        // First move center trick handling: center 13 is best
        if (openCells.length >= 26 && board[13] === null) {
          return 13;
        }

        let bestScore = -Infinity;
        let bestMove = openCells[0];

        // Evaluate top moves using alpha-beta
        for (const cell of openCells) {
          board[cell] = 'O';
          const evalScore = this.minimax3(board, 0, -Infinity, Infinity, false);
          board[cell] = null;
          if (evalScore > bestScore) {
            bestScore = evalScore;
            bestMove = cell;
          }
        }
        return bestMove;
      } else {
        // 4x4x4 Qubic Cyber-Master
        let bestScore = -Infinity;
        let candidates = [];

        for (const cell of openCells) {
          // Score cell with offensive threats & defensive blocks
          let score = this.scoreCandidate(board, cell, 'O', 'X');

          // Lookahead 1 step: simulate cell and check if it sets up winning threats
          board[cell] = 'O';
          const nextWin = this.findImmediateWin(board, 'O');
          if (nextWin !== -1) score += 500;
          board[cell] = null;

          if (score > bestScore) {
            bestScore = score;
            candidates = [cell];
          } else if (score === bestScore) {
            candidates.push(cell);
          }
        }
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    }
  }

  /* --------------------------------------------------------------------------
   * 5. MAIN CONTROLLER & APPLICATION STATE
   * -------------------------------------------------------------------------- */
  class EpicTicTacToeApp {
    constructor() {
      // Configuration
      this.N = 3; // 3 or 4
      this.gameMode = 'ai'; // 'ai' or 'pvp'
      this.aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
      this.viewMode = 'split'; // '3d', 'slices', 'split'
      this.threatRadar = true;
      this.layerGap = 95; // px

      // State
      this.board = [];
      this.currentTurn = 'X'; // X starts
      this.winner = null; // 'X', 'O', 'draw', or null
      this.winningLine = null; // array of indices
      this.moveHistory = [];
      this.hintCell = null;
      this.activeThreatLines = [];
      this.isAiThinking = false;

      // Stats
      this.stats = {
        winsX: 0,
        winsO: 0,
        draws: 0,
        streak: 0,
        bestStreak: 0
      };
      this.loadStats();

      // 3D Camera Rotation State
      this.camRotX = -24;
      this.camRotY = 36;
      this.isDragging = false;
      this.isAutoSpinning = false;
      this.lastPointerX = 0;
      this.lastPointerY = 0;

      // Services
      this.sound = new SoundEngine();
      this.bgCanvas = new ParticleCanvas(document.getElementById('bg-canvas'));

      // DOM Elements
      this.bindDOMElements();
      this.setupEventListeners();
      this.initThemeAndFont();

      // Start Game
      this.rebuildGeometryAndBoard();
      this.startAutoSpinLoop();
    }

    bindDOMElements() {
      // Header
      this.badgeMode = document.getElementById('badge-mode');
      this.btnRules = document.getElementById('btn-rules');
      this.btnSound = document.getElementById('btn-sound-toggle');
      this.btnTheme = document.getElementById('btn-theme-toggle');
      this.btnFontNormal = document.getElementById('btn-font-normal');
      this.btnFontLarge = document.getElementById('btn-font-large');
      this.btnFontHuge = document.getElementById('btn-font-huge');

      // Controls
      this.btnMode3 = document.getElementById('btn-mode-3');
      this.btnMode4 = document.getElementById('btn-mode-4');
      this.btnTypeAi = document.getElementById('btn-type-ai');
      this.btnTypePvp = document.getElementById('btn-type-pvp');
      this.cardAiDiff = document.getElementById('card-ai-difficulty');
      this.labelAiLevel = document.getElementById('label-ai-level');
      this.btnDiffEasy = document.getElementById('btn-diff-easy');
      this.btnDiffMed = document.getElementById('btn-diff-med');
      this.btnDiffHard = document.getElementById('btn-diff-hard');
      this.btnView3d = document.getElementById('btn-view-3d');
      this.btnViewSlices = document.getElementById('btn-view-slices');
      this.btnViewSplit = document.getElementById('btn-view-split');
      this.btnRadarToggle = document.getElementById('btn-radar-toggle');
      this.labelRadarStatus = document.getElementById('label-radar-status');
      this.labelOpponentStatus = document.getElementById('label-opponent-status');

      // HUD
      this.turnPill = document.getElementById('turn-pill');
      this.turnSymbol = document.getElementById('turn-symbol');
      this.turnText = document.getElementById('turn-text');
      this.threatAlert = document.getElementById('threat-alert');
      this.scoreX = document.getElementById('score-x');
      this.scoreO = document.getElementById('score-o');
      this.scoreDraws = document.getElementById('score-draws');
      this.scoreStreak = document.getElementById('score-streak');
      this.scoreLabelX = document.getElementById('score-label-x');
      this.scoreLabelO = document.getElementById('score-label-o');

      // Actions
      this.btnHint = document.getElementById('btn-hint');
      this.btnUndo = document.getElementById('btn-undo');
      this.btnRestart = document.getElementById('btn-restart');

      // Arena
      this.gameArena = document.getElementById('game-arena');
      this.stage3d = document.getElementById('stage-3d');
      this.stageSlices = document.getElementById('stage-slices');
      this.viewport3d = document.getElementById('viewport-3d');
      this.cubeScene = document.getElementById('cube-scene');
      this.slicesContainer = document.getElementById('slices-container');
      this.coordInspector = document.getElementById('coord-inspector');
      this.sliderElevation = document.getElementById('slider-elevation');
      this.valElevation = document.getElementById('val-elevation');

      // Camera Controls
      this.camIso = document.getElementById('cam-iso');
      this.camFront = document.getElementById('cam-front');
      this.camTop = document.getElementById('cam-top');
      this.camSpin = document.getElementById('cam-spin');
      this.camReset = document.getElementById('cam-reset');

      // Modal & Toast
      this.modalRules = document.getElementById('modal-rules');
      this.btnModalClose = document.getElementById('btn-modal-close');
      this.btnModalOk = document.getElementById('btn-modal-ok');
      this.toastNotice = document.getElementById('toast-notice');
      this.toastMsg = document.getElementById('toast-msg');
      this.toastIcon = document.getElementById('toast-icon');
    }

    setupEventListeners() {
      // 1. Grid Size (3x3x3 vs 4x4x4 Qubic)
      this.btnMode3.addEventListener('click', () => this.setGridSize(3));
      this.btnMode4.addEventListener('click', () => this.setGridSize(4));

      // 2. Opponent (AI vs Pass & Play)
      this.btnTypeAi.addEventListener('click', () => this.setOpponentMode('ai'));
      this.btnTypePvp.addEventListener('click', () => this.setOpponentMode('pvp'));

      // 3. AI Difficulty
      this.btnDiffEasy.addEventListener('click', () => this.setAiDifficulty('easy'));
      this.btnDiffMed.addEventListener('click', () => this.setAiDifficulty('medium'));
      this.btnDiffHard.addEventListener('click', () => this.setAiDifficulty('hard'));

      // 4. View Mode (3D, Slices, Split)
      this.btnView3d.addEventListener('click', () => this.setViewMode('3d'));
      this.btnViewSlices.addEventListener('click', () => this.setViewMode('slices'));
      this.btnViewSplit.addEventListener('click', () => this.setViewMode('split'));

      // 5. Threat Radar
      this.btnRadarToggle.addEventListener('click', () => this.toggleThreatRadar());

      // 6. HUD Actions
      this.btnRestart.addEventListener('click', () => this.resetMatch(true));
      this.btnUndo.addEventListener('click', () => this.undoMove());
      this.btnHint.addEventListener('click', () => this.requestHint());

      // 7. Layer Gap Slider
      this.sliderElevation.addEventListener('input', (e) => {
        this.layerGap = parseInt(e.target.value, 10);
        this.valElevation.textContent = `${this.layerGap}px`;
        this.update3DLayerPositions();
      });

      // 8. 3D Camera Controls
      this.camIso.addEventListener('click', () => this.setCameraPreset(-26, 38));
      this.camFront.addEventListener('click', () => this.setCameraPreset(0, 0));
      this.camTop.addEventListener('click', () => this.setCameraPreset(-75, 0));
      this.camReset.addEventListener('click', () => this.setCameraPreset(-24, 36));
      this.camSpin.addEventListener('click', () => this.toggleAutoSpin());

      // 9. 3D Viewport Gesture Controls (Pointer Events for Mouse & Touch)
      this.viewport3d.addEventListener('pointerdown', (e) => {
        this.isDragging = true;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        this.viewport3d.setPointerCapture(e.pointerId);
      });

      this.viewport3d.addEventListener('pointermove', (e) => {
        if (!this.isDragging) return;
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;

        this.camRotY += dx * 0.45;
        this.camRotX -= dy * 0.45;
        // Clamp vertical tilt
        this.camRotX = Math.max(-75, Math.min(75, this.camRotX));
        this.updateCubeTransform();
      });

      const endDrag = (e) => {
        if (this.isDragging) {
          this.isDragging = false;
          try {
            this.viewport3d.releasePointerCapture(e.pointerId);
          } catch (err) {}
        }
      };
      this.viewport3d.addEventListener('pointerup', endDrag);
      this.viewport3d.addEventListener('pointercancel', endDrag);

      // 10. Sound & Theming
      this.btnSound.addEventListener('click', () => {
        const nextMute = !this.sound.isMuted;
        this.sound.setMuted(nextMute);
        this.btnSound.textContent = nextMute ? '🔇 Sound: OFF' : '🔊 Sound: ON';
        this.showToast(nextMute ? 'Sound Muted' : 'Sound Enabled', '🔊');
      });
      if (this.sound.isMuted) {
        this.btnSound.textContent = '🔇 Sound: OFF';
      }

      this.btnTheme.addEventListener('click', () => this.toggleTheme());

      this.btnFontNormal.addEventListener('click', () => this.setFontSize('normal'));
      this.btnFontLarge.addEventListener('click', () => this.setFontSize('large'));
      this.btnFontHuge.addEventListener('click', () => this.setFontSize('huge'));

      // 11. Rules Modal
      this.btnRules.addEventListener('click', () => {
        this.modalRules.classList.add('active');
        this.sound.playTick();
      });
      this.btnModalClose.addEventListener('click', () => this.modalRules.classList.remove('active'));
      this.btnModalOk.addEventListener('click', () => this.modalRules.classList.remove('active'));
      this.modalRules.addEventListener('click', (e) => {
        if (e.target === this.modalRules) {
          this.modalRules.classList.remove('active');
        }
      });
    }

    /* ------------------------------------------------------------------------
     * Setup & State Initialization
     * ------------------------------------------------------------------------ */
    rebuildGeometryAndBoard() {
      // Build 3D Lines
      const { lines, cellLines } = generate3DLines(this.N);
      this.lines = lines;
      this.cellLines = cellLines;
      this.aiEngine = new AIEngine(this.N, this.lines, this.cellLines);

      // Reset Board Array
      const total = this.N * this.N * this.N;
      this.board = new Array(total).fill(null);
      this.currentTurn = 'X';
      this.winner = null;
      this.winningLine = null;
      this.moveHistory = [];
      this.hintCell = null;
      this.activeThreatLines = [];
      this.isAiThinking = false;

      // Update Labels
      this.badgeMode.textContent = this.N === 3 ? '3×3×3 CLASSIC' : '4×4×4 QUBIC';
      this.slicesContainer.className = `slices-container grid-${this.N}-slices`;

      // Render DOM Elements for 3D and Slices
      this.render3DCubeDOM();
      this.renderSlicesDOM();

      this.updateStatusHUD();
      this.updateScoreDisplay();
      this.updateCubeTransform();
      this.update3DLayerPositions();
      this.refreshThreatRadar();
    }

    render3DCubeDOM() {
      this.cubeScene.innerHTML = '';

      for (let z = 0; z < this.N; z++) {
        const deck = document.createElement('div');
        deck.className = 'layer-deck-3d';
        deck.dataset.grid = this.N;
        deck.dataset.layer = z;

        const label = document.createElement('div');
        label.className = 'layer-deck-label';
        label.textContent = `FLOOR ${z + 1} (Z=${z + 1})`;
        deck.appendChild(label);

        for (let y = 0; y < this.N; y++) {
          for (let x = 0; x < this.N; x++) {
            const idx = z * this.N * this.N + y * this.N + x;
            const btn = document.createElement('button');
            btn.className = 'cell-3d';
            btn.dataset.cell = idx;
            btn.setAttribute('aria-label', `3D Cell Z${z + 1} Y${y + 1} X${x + 1}`);

            btn.addEventListener('click', () => this.handleCellClick(idx));
            btn.addEventListener('mouseenter', () => this.handleCellHover(idx, true));
            btn.addEventListener('mouseleave', () => this.handleCellHover(idx, false));

            deck.appendChild(btn);
          }
        }
        this.cubeScene.appendChild(deck);
      }
    }

    renderSlicesDOM() {
      this.slicesContainer.innerHTML = '';

      for (let z = 0; z < this.N; z++) {
        const panel = document.createElement('div');
        panel.className = 'slice-panel';

        const title = document.createElement('div');
        title.className = 'slice-panel-title';
        const levelName =
          this.N === 3
            ? ['Floor 1 (Bottom)', 'Floor 2 (Middle)', 'Floor 3 (Top)'][z]
            : ['Floor 1 (Base)', 'Floor 2 (Mid-Low)', 'Floor 3 (Mid-High)', 'Floor 4 (Top)'][z];
        title.innerHTML = `<span>🔷</span> ${levelName}`;
        panel.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'slice-grid-2d';
        grid.dataset.grid = this.N;

        for (let y = 0; y < this.N; y++) {
          for (let x = 0; x < this.N; x++) {
            const idx = z * this.N * this.N + y * this.N + x;
            const btn = document.createElement('button');
            btn.className = 'cell-2d';
            btn.dataset.cell = idx;
            btn.setAttribute('aria-label', `Floor ${z + 1} Row ${y + 1} Col ${x + 1}`);

            btn.addEventListener('click', () => this.handleCellClick(idx));
            btn.addEventListener('mouseenter', () => this.handleCellHover(idx, true));
            btn.addEventListener('mouseleave', () => this.handleCellHover(idx, false));

            grid.appendChild(btn);
          }
        }

        panel.appendChild(grid);
        this.slicesContainer.appendChild(panel);
      }
    }

    update3DLayerPositions() {
      const decks = this.cubeScene.querySelectorAll('.layer-deck-3d');
      decks.forEach((deck) => {
        const z = parseInt(deck.dataset.layer, 10);
        // Distribute layers symmetrically around 0 along Z
        const offset = this.N === 3 ? (z - 1) * this.layerGap : (z - 1.5) * this.layerGap;
        deck.style.transform = `translateZ(${offset}px)`;
      });
    }

    updateCubeTransform() {
      this.cubeScene.style.transform = `rotateX(${this.camRotX}deg) rotateY(${this.camRotY}deg)`;
    }

    setCameraPreset(rotX, rotY) {
      this.camRotX = rotX;
      this.camRotY = rotY;
      this.updateCubeTransform();
      this.sound.playTick();
    }

    toggleAutoSpin() {
      this.isAutoSpinning = !this.isAutoSpinning;
      this.camSpin.classList.toggle('active', this.isAutoSpinning);
      this.showToast(this.isAutoSpinning ? 'Auto-Spin Activated' : 'Auto-Spin Paused', '🔄');
    }

    startAutoSpinLoop() {
      const loop = () => {
        if (this.isAutoSpinning && !this.isDragging) {
          this.camRotY += 0.28;
          this.updateCubeTransform();
        }
        requestAnimationFrame(loop);
      };
      loop();
    }

    /* ------------------------------------------------------------------------
     * Game Mechanics & Move Handling
     * ------------------------------------------------------------------------ */
    handleCellClick(cellIndex) {
      if (this.winner || this.isAiThinking) return;
      if (this.board[cellIndex] !== null) return;

      // Human move
      this.executeMove(cellIndex, this.currentTurn);

      // Check win/draw
      if (this.winner) return;

      // AI turn trigger
      if (this.gameMode === 'ai' && this.currentTurn === 'O') {
        this.triggerAiTurn();
      }
    }

    executeMove(cellIndex, player) {
      this.board[cellIndex] = player;
      this.moveHistory.push({ cell: cellIndex, player });
      this.hintCell = null;

      this.sound.playMove(player);

      // Update Cell DOMs
      this.updateCellVisual(cellIndex);

      // Check Win or Draw
      const winResult = this.checkWinOrDraw();
      if (winResult) {
        this.handleGameOver(winResult);
      } else {
        // Next Turn
        this.currentTurn = this.currentTurn === 'X' ? 'O' : 'X';
        this.updateStatusHUD();
        this.refreshThreatRadar();
      }

      this.btnUndo.disabled = this.moveHistory.length === 0 || !!this.winner || this.isAiThinking;
    }

    triggerAiTurn() {
      this.isAiThinking = true;
      this.turnPill.className = 'turn-pill turn-o';
      this.turnSymbol.textContent = '⚡';
      this.turnText.textContent = 'AI COMPUTING...';

      // Slight natural thinking delay (180ms - 400ms) for authentic cyber engagement
      setTimeout(() => {
        const move = this.aiEngine.computeMove(this.board, this.aiDifficulty);
        this.isAiThinking = false;

        if (move !== -1 && this.board[move] === null) {
          this.executeMove(move, 'O');
        }
      }, 260);
    }

    checkWinOrDraw() {
      // Check each winning line
      for (const lineObj of this.lines) {
        const first = this.board[lineObj.cells[0]];
        if (!first) continue;

        let allMatch = true;
        for (let i = 1; i < this.N; i++) {
          if (this.board[lineObj.cells[i]] !== first) {
            allMatch = false;
            break;
          }
        }

        if (allMatch) {
          return { winner: first, line: lineObj.cells, category: lineObj.category };
        }
      }

      // Check Draw (no empty cells left)
      if (this.board.every((c) => c !== null)) {
        return { winner: 'draw', line: null };
      }

      return null;
    }

    handleGameOver(result) {
      this.winner = result.winner;
      this.winningLine = result.line;

      if (this.winner === 'draw') {
        this.turnPill.className = 'turn-pill winner-banner';
        this.turnSymbol.textContent = '⚖️';
        this.turnText.textContent = "IT'S A DRAW!";
        this.stats.draws++;
        this.stats.streak = 0;
        this.sound.playDraw();
        this.showToast('Tactical Stalemate — Stalwart Defense!', '⚖️');
      } else {
        const isX = this.winner === 'X';
        this.turnPill.className = `turn-pill winner-banner`;
        this.turnSymbol.textContent = '🏆';

        if (this.gameMode === 'ai') {
          if (isX) {
            this.turnText.textContent = 'VICTORY! YOU DEFEATED THE AI!';
            this.stats.winsX++;
            this.stats.streak++;
            if (this.stats.streak > this.stats.bestStreak) {
              this.stats.bestStreak = this.stats.streak;
            }
            this.sound.playWin();
            this.showToast(`Grand Victory! Current Streak: ${this.stats.streak}🔥`, '🏆');
          } else {
            this.turnText.textContent = 'AI HAS SECURED VICTORY!';
            this.stats.winsO++;
            this.stats.streak = 0;
            this.sound.playLoss();
            this.showToast('AI Claimed the Grid! Try Qubic or Lower Difficulty.', '🤖');
          }
        } else {
          this.turnText.textContent = `PLAYER ${this.winner} WINS!`;
          if (isX) this.stats.winsX++;
          else this.stats.winsO++;
          this.sound.playWin();
          this.showToast(`Congratulations Player ${this.winner}!`, '🎉');
        }

        // Highlight Winning Cells
        if (this.winningLine) {
          this.winningLine.forEach((idx) => {
            const c3d = this.viewport3d.querySelector(`.cell-3d[data-cell="${idx}"]`);
            const c2d = this.slicesContainer.querySelector(`.cell-2d[data-cell="${idx}"]`);
            if (c3d) c3d.classList.add('winning-cell');
            if (c2d) c2d.classList.add('winning-cell');
          });
        }
      }

      this.saveStats();
      this.updateScoreDisplay();
      this.refreshThreatRadar();
    }

    undoMove() {
      if (this.moveHistory.length === 0 || this.isAiThinking) return;

      if (this.gameMode === 'ai') {
        // Undo both AI move and Player move
        if (this.moveHistory.length >= 2) {
          const m1 = this.moveHistory.pop();
          const m2 = this.moveHistory.pop();
          this.board[m1.cell] = null;
          this.board[m2.cell] = null;
          this.clearCellVisual(m1.cell);
          this.clearCellVisual(m2.cell);
        } else if (this.moveHistory.length === 1) {
          const m = this.moveHistory.pop();
          this.board[m.cell] = null;
          this.clearCellVisual(m.cell);
        }
        this.currentTurn = 'X';
      } else {
        // Undo single PvP move
        const m = this.moveHistory.pop();
        this.board[m.cell] = null;
        this.clearCellVisual(m.cell);
        this.currentTurn = m.player;
      }

      this.winner = null;
      this.winningLine = null;
      this.hintCell = null;

      // Clear any winning cell classes
      this.viewport3d.querySelectorAll('.winning-cell').forEach((el) => el.classList.remove('winning-cell'));
      this.slicesContainer.querySelectorAll('.winning-cell').forEach((el) => el.classList.remove('winning-cell'));

      this.sound.playTick();
      this.updateStatusHUD();
      this.refreshThreatRadar();
      this.btnUndo.disabled = this.moveHistory.length === 0;
      this.showToast('Move Undone', '↶');
    }

    requestHint() {
      if (this.winner || this.isAiThinking) return;

      const best = this.aiEngine.computeMove(this.board, 'hard');
      if (best !== -1) {
        this.hintCell = best;
        this.sound.playHint();

        // Remove old hint highlights
        this.viewport3d.querySelectorAll('.hint-cell').forEach((c) => c.classList.remove('hint-cell'));
        this.slicesContainer.querySelectorAll('.hint-cell').forEach((c) => c.classList.remove('hint-cell'));

        const c3d = this.viewport3d.querySelector(`.cell-3d[data-cell="${best}"]`);
        const c2d = this.slicesContainer.querySelector(`.cell-2d[data-cell="${best}"]`);
        if (c3d) c3d.classList.add('hint-cell');
        if (c2d) c2d.classList.add('hint-cell');

        const { x, y, z } = this.indexToCoord(best);
        this.showToast(`Tactical Suggestion: Floor ${z + 1}, Row ${y + 1}, Col ${x + 1}`, '🎯');
      }
    }

    resetMatch(userClicked = false) {
      const total = this.N * this.N * this.N;
      this.board = new Array(total).fill(null);
      this.currentTurn = 'X';
      this.winner = null;
      this.winningLine = null;
      this.moveHistory = [];
      this.hintCell = null;
      this.activeThreatLines = [];
      this.isAiThinking = false;

      // Clear all cell visual contents & classes
      this.viewport3d.querySelectorAll('.cell-3d').forEach((c) => {
        c.innerHTML = '';
        c.className = 'cell-3d';
      });
      this.slicesContainer.querySelectorAll('.cell-2d').forEach((c) => {
        c.innerHTML = '';
        c.className = 'cell-2d';
      });

      this.updateStatusHUD();
      this.refreshThreatRadar();
      this.btnUndo.disabled = true;

      if (userClicked) {
        this.sound.playTick();
        this.showToast('Match Reset — New Grid Ready', '⚡');
      }
    }

    /* ------------------------------------------------------------------------
     * Visual Representation & Synchronization
     * ------------------------------------------------------------------------ */
    updateCellVisual(idx) {
      const val = this.board[idx];
      const c3d = this.viewport3d.querySelector(`.cell-3d[data-cell="${idx}"]`);
      const c2d = this.slicesContainer.querySelector(`.cell-2d[data-cell="${idx}"]`);

      const glyphHTML = val
        ? `<span class="mark-glyph mark-${val.toLowerCase()}">${val}</span>`
        : '';

      if (c3d) {
        c3d.innerHTML = glyphHTML;
        c3d.classList.remove('hint-cell');
      }
      if (c2d) {
        c2d.innerHTML = glyphHTML;
        c2d.classList.remove('hint-cell');
      }
    }

    clearCellVisual(idx) {
      const c3d = this.viewport3d.querySelector(`.cell-3d[data-cell="${idx}"]`);
      const c2d = this.slicesContainer.querySelector(`.cell-2d[data-cell="${idx}"]`);
      if (c3d) c3d.innerHTML = '';
      if (c2d) c2d.innerHTML = '';
    }

    handleCellHover(idx, isHovering) {
      const c3d = this.viewport3d.querySelector(`.cell-3d[data-cell="${idx}"]`);
      const c2d = this.slicesContainer.querySelector(`.cell-2d[data-cell="${idx}"]`);

      if (isHovering) {
        if (c3d) c3d.classList.add('highlight-synced');
        if (c2d) c2d.classList.add('highlight-synced');

        const { x, y, z } = this.indexToCoord(idx);
        const val = this.board[idx];
        const status = val ? `Occupied by ${val}` : 'Open';
        this.coordInspector.innerHTML = `Floor ${z + 1} (Z:${z + 1}) • Row ${y + 1} (Y:${y + 1}) • Col ${x + 1} (X:${x + 1}) &nbsp;|&nbsp; <strong style="color:var(--accent-cyan);">${status}</strong> (Cell #${idx + 1})`;
      } else {
        if (c3d) c3d.classList.remove('highlight-synced');
        if (c2d) c2d.classList.remove('highlight-synced');
        this.coordInspector.textContent = 'Hover or tap any square to inspect 3D spatial coordinates';
      }
    }

    indexToCoord(idx) {
      const x = idx % this.N;
      const y = Math.floor(idx / this.N) % this.N;
      const z = Math.floor(idx / (this.N * this.N));
      return { x, y, z };
    }

    refreshThreatRadar() {
      // Clear previous threat borders
      this.viewport3d.querySelectorAll('.highlight-threat').forEach((c) => c.classList.remove('highlight-threat'));
      this.slicesContainer.querySelectorAll('.highlight-threat').forEach((c) => c.classList.remove('highlight-threat'));

      if (!this.threatRadar || this.winner) {
        this.threatAlert.classList.remove('visible');
        return;
      }

      let threatCount = 0;
      const threatenedCells = new Set();

      // Scan all lines for N-1 marks of any player and 1 empty space
      for (const lineObj of this.lines) {
        let xCount = 0;
        let oCount = 0;
        let emptyIdx = -1;

        for (const c of lineObj.cells) {
          if (this.board[c] === 'X') xCount++;
          else if (this.board[c] === 'O') oCount++;
          else emptyIdx = c;
        }

        if (emptyIdx !== -1) {
          if (xCount === this.N - 1 || oCount === this.N - 1) {
            threatCount++;
            lineObj.cells.forEach((c) => threatenedCells.add(c));
          }
        }
      }

      if (threatCount > 0) {
        this.threatAlert.classList.add('visible');
        document.getElementById('threat-text').textContent =
          threatCount === 1 ? '1 CRITICAL THREAT ACTIVE!' : `${threatCount} THREAT LINES DETECTED!`;

        threatenedCells.forEach((idx) => {
          const c3d = this.viewport3d.querySelector(`.cell-3d[data-cell="${idx}"]`);
          const c2d = this.slicesContainer.querySelector(`.cell-2d[data-cell="${idx}"]`);
          if (c3d) c3d.classList.add('highlight-threat');
          if (c2d) c2d.classList.add('highlight-threat');
        });
      } else {
        this.threatAlert.classList.remove('visible');
      }
    }

    toggleThreatRadar() {
      this.threatRadar = !this.threatRadar;
      this.btnRadarToggle.classList.toggle('active', this.threatRadar);
      this.btnRadarToggle.textContent = this.threatRadar ? '🛰️ Threat Radar: ON' : '🛰️ Threat Radar: OFF';
      this.labelRadarStatus.textContent = this.threatRadar ? 'Active' : 'Muted';
      this.labelRadarStatus.style.color = this.threatRadar ? 'var(--accent-emerald)' : 'var(--text-dim)';
      this.refreshThreatRadar();
      this.showToast(this.threatRadar ? 'Threat Radar Engaged' : 'Threat Radar Deactivated', '🛰️');
    }

    /* ------------------------------------------------------------------------
     * Mode & Difficulty Switchers
     * ------------------------------------------------------------------------ */
    setGridSize(size) {
      if (this.N === size) return;
      this.N = size;

      this.btnMode3.classList.toggle('active', size === 3);
      this.btnMode4.classList.toggle('active', size === 4);

      this.rebuildGeometryAndBoard();
      this.sound.playTick();
      this.showToast(`Switched to ${size}×${size}×${size} Grid Mode`, '📐');
    }

    setOpponentMode(mode) {
      if (this.gameMode === mode) return;
      this.gameMode = mode;

      this.btnTypeAi.classList.toggle('active', mode === 'ai');
      this.btnTypePvp.classList.toggle('active', mode === 'pvp');

      this.cardAiDiff.style.display = mode === 'ai' ? 'flex' : 'none';
      this.labelOpponentStatus.textContent = mode === 'ai' ? 'Solo vs AI' : 'Pass & Play';

      this.scoreLabelX.textContent = mode === 'ai' ? 'Player (X)' : 'Player 1 (X)';
      this.scoreLabelO.textContent = mode === 'ai' ? 'AI (O)' : 'Player 2 (O)';

      this.resetMatch(false);
      this.sound.playTick();
      this.showToast(mode === 'ai' ? 'Vs AI Mode Active' : 'Local 2-Player Pass & Play', '👥');
    }

    setAiDifficulty(diff) {
      this.aiDifficulty = diff;
      this.btnDiffEasy.classList.toggle('active', diff === 'easy');
      this.btnDiffMed.classList.toggle('active', diff === 'medium');
      this.btnDiffHard.classList.toggle('active', diff === 'hard');

      const labelMap = { easy: 'Rookie', medium: 'Tactician', hard: 'Cyber-Master' };
      this.labelAiLevel.textContent = labelMap[diff];
      this.sound.playTick();
      this.showToast(`AI Difficulty: ${labelMap[diff]}`, '🤖');
    }

    setViewMode(mode) {
      this.viewMode = mode;
      this.btnView3d.classList.toggle('active', mode === '3d');
      this.btnViewSlices.classList.toggle('active', mode === 'slices');
      this.btnViewSplit.classList.toggle('active', mode === 'split');

      this.gameArena.className = `game-arena view-mode-${mode}`;
      this.stage3d.style.display = mode === 'slices' ? 'none' : 'flex';
      this.stageSlices.style.display = mode === '3d' ? 'none' : 'flex';

      this.sound.playTick();
    }

    updateStatusHUD() {
      if (this.winner) return;

      const isX = this.currentTurn === 'X';
      this.turnPill.className = isX ? 'turn-pill turn-x' : 'turn-pill turn-o';
      this.turnSymbol.textContent = this.currentTurn;

      if (this.gameMode === 'ai') {
        this.turnText.textContent = isX ? 'YOUR TURN' : 'AI TURN';
      } else {
        this.turnText.textContent = isX ? 'PLAYER 1 TURN' : 'PLAYER 2 TURN';
      }
    }

    /* ------------------------------------------------------------------------
     * Theming & Font Scaling (Classroom Projector Standards)
     * ------------------------------------------------------------------------ */
    initThemeAndFont() {
      const savedTheme = localStorage.getItem('epic_ttt_theme') || 'dark';
      this.applyTheme(savedTheme);

      const savedFont = localStorage.getItem('epic_ttt_fontsize') || 'normal';
      this.setFontSize(savedFont);
    }

    applyTheme(theme) {
      const isLight = theme === 'light';
      document.documentElement.classList.toggle('theme-light', isLight);
      this.btnTheme.textContent = isLight ? '🌙 Dark' : '☀️ Light';
      this.bgCanvas.setTheme(isLight);
      localStorage.setItem('epic_ttt_theme', theme);
    }

    toggleTheme() {
      const isLight = document.documentElement.classList.contains('theme-light');
      const nextTheme = isLight ? 'dark' : 'light';
      this.applyTheme(nextTheme);
      this.sound.playTick();
      this.showToast(nextTheme === 'light' ? 'High-Contrast Light Mode Active' : 'Cyberpunk Dark Mode Active', '☀️');
    }

    setFontSize(size) {
      const root = document.documentElement;
      root.classList.remove('font-normal', 'font-large', 'font-huge');

      this.btnFontNormal.classList.toggle('active', size === 'normal');
      this.btnFontLarge.classList.toggle('active', size === 'large');
      this.btnFontHuge.classList.toggle('active', size === 'huge');

      if (size === 'large') root.classList.add('font-large');
      else if (size === 'huge') root.classList.add('font-huge');
      else root.classList.add('font-normal');

      localStorage.setItem('epic_ttt_fontsize', size);
    }

    /* ------------------------------------------------------------------------
     * Stats & Toast Notifications
     * ------------------------------------------------------------------------ */
    loadStats() {
      try {
        const raw = localStorage.getItem('epic_ttt_stats');
        if (raw) {
          this.stats = { ...this.stats, ...JSON.parse(raw) };
        }
      } catch (e) {}
    }

    saveStats() {
      try {
        localStorage.setItem('epic_ttt_stats', JSON.stringify(this.stats));
      } catch (e) {}
    }

    updateScoreDisplay() {
      this.scoreX.textContent = this.stats.winsX;
      this.scoreO.textContent = this.stats.winsO;
      this.scoreDraws.textContent = this.stats.draws;
      this.scoreStreak.textContent = this.stats.streak;
    }

    showToast(msg, icon = '⚡') {
      this.toastMsg.textContent = msg;
      this.toastIcon.textContent = icon;
      this.toastNotice.classList.add('show');

      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.toastNotice.classList.remove('show');
      }, 2400);
    }
  }

  // Initialize Application on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new EpicTicTacToeApp());
  } else {
    new EpicTicTacToeApp();
  }
})();

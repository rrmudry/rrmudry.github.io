/**
 * Monkeys vs Bats vs Frogs Tic-Tac-Toe
 * Pure Native Vanilla JavaScript Game Engine
 * Features: 3 Animals (Monkey 🐵, Bat 🦇, Frog 🐸), Web Audio API sound synthesizer,
 * 3-Tier Minimax AI, 3-Player Battle Royale mode, Particle celebrations, and SVG graphics.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Constants & Config ---
    const WINNING_COMBINATIONS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    // Coordinates on 300x300 SVG for strike-through line
    const WIN_LINE_COORDS = [
        { x1: 20, y1: 50, x2: 280, y2: 50 },    // Row 0
        { x1: 20, y1: 150, x2: 280, y2: 150 },  // Row 1
        { x1: 20, y1: 250, x2: 280, y2: 250 },  // Row 2
        { x1: 50, y1: 20, x2: 50, y2: 280 },    // Col 0
        { x1: 150, y1: 20, x2: 150, y2: 280 },  // Col 1
        { x1: 250, y1: 20, x2: 250, y2: 280 },  // Col 2
        { x1: 25, y1: 25, x2: 275, y2: 275 },   // Diagonal 0
        { x1: 275, y1: 25, x2: 25, y2: 275 }    // Diagonal 1
    ];

    // Vector Marker SVGs
    const MONKEY_MARKER_SVG = `
        <svg class="marker-svg monkey-marker" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="mFur" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stop-color="#d97706"/>
                    <stop offset="100%" stop-color="#92400e"/>
                </radialGradient>
                <radialGradient id="mSkin" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#fed7aa"/>
                    <stop offset="100%" stop-color="#fba863"/>
                </radialGradient>
            </defs>
            <circle cx="12" cy="30" r="9" fill="url(#mFur)"/>
            <circle cx="12" cy="30" r="5" fill="#fca5a5"/>
            <circle cx="52" cy="30" r="9" fill="url(#mFur)"/>
            <circle cx="52" cy="30" r="5" fill="#fca5a5"/>
            <circle cx="32" cy="32" r="22" fill="url(#mFur)"/>
            <ellipse cx="25" cy="27" rx="9" ry="11" fill="url(#mSkin)"/>
            <ellipse cx="39" cy="27" rx="9" ry="11" fill="url(#mSkin)"/>
            <ellipse cx="32" cy="37" rx="14" ry="11" fill="url(#mSkin)"/>
            <ellipse cx="26" cy="25" rx="3" ry="4.2" fill="#1e1b4b"/>
            <circle cx="27" cy="23.5" r="1.3" fill="#ffffff"/>
            <ellipse cx="38" cy="25" rx="3" ry="4.2" fill="#1e1b4b"/>
            <circle cx="39" cy="23.5" r="1.3" fill="#ffffff"/>
            <path d="M27 39 Q32 44 37 39" stroke="#92400e" stroke-width="2" stroke-linecap="round" fill="none"/>
            <path d="M29 9 C35 6, 44 11, 46 17 C41 15, 33 14, 29 9 Z" fill="#facc15"/>
        </svg>
    `;

    const BAT_MARKER_SVG = `
        <svg class="marker-svg bat-marker" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bWing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#a855f7"/>
                    <stop offset="100%" stop-color="#6366f1"/>
                </linearGradient>
            </defs>
            <path d="M8 26 C14 14, 24 18, 32 26 C40 18, 50 14, 56 26 C52 34, 46 44, 38 41 C35 48, 29 48, 26 41 C18 44, 12 34, 8 26 Z" fill="url(#bWing)"/>
            <path d="M12 28 C20 22, 28 26, 32 30" stroke="#c084fc" stroke-width="1.4" stroke-linecap="round" fill="none"/>
            <path d="M52 28 C44 22, 36 26, 32 30" stroke="#c084fc" stroke-width="1.4" stroke-linecap="round" fill="none"/>
            <polygon points="25,27 28,14 31,25" fill="#312e81"/>
            <polygon points="39,27 36,14 33,25" fill="#312e81"/>
            <ellipse cx="32" cy="33" rx="7.5" ry="9" fill="#1e1b4b"/>
            <ellipse cx="29" cy="31" rx="2.2" ry="2.5" fill="#06b6d4"/>
            <circle cx="29.5" cy="30.2" r="0.8" fill="#ffffff"/>
            <ellipse cx="35" cy="31" rx="2.2" ry="2.5" fill="#06b6d4"/>
            <circle cx="35.5" cy="30.2" r="0.8" fill="#ffffff"/>
            <polygon points="30,37 31,37 30.5,39.5" fill="#ffffff"/>
            <polygon points="33,37 34,37 33.5,39.5" fill="#ffffff"/>
        </svg>
    `;

    const FROG_MARKER_SVG = `
        <svg class="marker-svg frog-marker" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="fSkin" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stop-color="#4ade80"/>
                    <stop offset="100%" stop-color="#15803d"/>
                </radialGradient>
                <radialGradient id="fBelly" cx="50%" cy="60%" r="50%">
                    <stop offset="0%" stop-color="#fef9c3"/>
                    <stop offset="100%" stop-color="#86efac"/>
                </radialGradient>
                <radialGradient id="fEye" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stop-color="#fde047"/>
                    <stop offset="100%" stop-color="#ea580c"/>
                </radialGradient>
            </defs>
            <!-- Water Ripple Base -->
            <ellipse cx="32" cy="46" rx="24" ry="12" fill="#047857" opacity="0.35"/>
            <!-- Bulging Eyes Base -->
            <circle cx="21" cy="23" r="10.5" fill="url(#fSkin)"/>
            <circle cx="43" cy="23" r="10.5" fill="url(#fSkin)"/>
            <!-- Head / Body -->
            <ellipse cx="32" cy="36" rx="20" ry="16" fill="url(#fSkin)"/>
            <ellipse cx="32" cy="42" rx="12" ry="9" fill="url(#fBelly)"/>
            <!-- Big Golden Eyes -->
            <circle cx="21" cy="23" r="7.5" fill="url(#fEye)"/>
            <ellipse cx="21" cy="23" rx="2.2" ry="5.5" fill="#0f172a"/>
            <circle cx="22.5" cy="20.5" r="1.4" fill="#ffffff"/>
            <circle cx="43" cy="23" r="7.5" fill="url(#fEye)"/>
            <ellipse cx="43" cy="23" rx="2.2" ry="5.5" fill="#0f172a"/>
            <circle cx="44.5" cy="20.5" r="1.4" fill="#ffffff"/>
            <!-- Wide Frog Smile -->
            <path d="M19 40 Q32 49 45 40" stroke="#14532d" stroke-width="2" stroke-linecap="round" fill="none"/>
            <!-- Cute Rosy Cheek Spots -->
            <circle cx="16" cy="36" r="2.8" fill="#f43f5e" opacity="0.45"/>
            <circle cx="48" cy="36" r="2.8" fill="#f43f5e" opacity="0.45"/>
        </svg>
    `;

    // --- State Variables ---
    let boardState = Array(9).fill(null); // 'MONKEY', 'BAT', 'FROG', or null
    let currentPlayer = 'MONKEY';          // 'MONKEY', 'BAT', or 'FROG'
    let gameMode = 'ai';                  // 'ai', '2p', or '3p'
    let aiDifficulty = 'medium';          // 'easy', 'medium', 'hard'
    let humanSide = 'MONKEY';             // In AI mode: 'MONKEY', 'BAT', or 'FROG'
    let isGameOver = false;
    let isAiThinking = false;
    let focusedCellIndex = 0;

    let scores = {
        MONKEY: 0,
        BAT: 0,
        FROG: 0,
        STREAK: 0
    };

    let isMuted = localStorage.getItem('mvb_muted') === 'true';

    // --- DOM Elements ---
    const boardEl = document.getElementById('gameBoard');
    const cells = document.querySelectorAll('.cell');
    const statusMsgEl = document.getElementById('statusMessage');
    const streakDisplayEl = document.getElementById('streakDisplay');
    const monkeyScoreEl = document.getElementById('monkeyScore');
    const batScoreEl = document.getElementById('batScore');
    const frogScoreEl = document.getElementById('frogScore');
    const teamMonkeyCard = document.getElementById('teamMonkeyCard');
    const teamBatCard = document.getElementById('teamBatCard');
    const teamFrogCard = document.getElementById('teamFrogCard');
    const modeAiBtn = document.getElementById('modeAiBtn');
    const mode2pBtn = document.getElementById('mode2pBtn');
    const mode3pBtn = document.getElementById('mode3pBtn');
    const difficultyGroup = document.getElementById('aiDifficultyGroup');
    const difficultySelect = document.getElementById('difficultySelect');
    const playerChoiceContainer = document.getElementById('playerChoiceContainer');
    const chooseMonkeyBtn = document.getElementById('chooseMonkeyBtn');
    const chooseBatBtn = document.getElementById('chooseBatBtn');
    const chooseFrogBtn = document.getElementById('chooseFrogBtn');
    const muteBtn = document.getElementById('muteBtn');
    const soundIcon = document.getElementById('soundIcon');
    const restartBtn = document.getElementById('restartBtn');
    const resetScoreBtn = document.getElementById('resetScoreBtn');
    const winningLineSvg = document.getElementById('winningLineSvg');
    const winningLine = document.getElementById('winningLine');
    const particleCanvas = document.getElementById('particleCanvas');

    // Victory Modal Elements
    const victoryModal = document.getElementById('victoryModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    const modalPlayAgainBtn = document.getElementById('modalPlayAgainBtn');

    // --- Audio Synthesizer (Web Audio API) ---
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Monkey Move: Cheeky bouncy jungle chortle
    function playMonkeySound() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.16);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.17);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    // Bat Move: Nocturnal sonar echo chirp
    function playBatSound() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.18);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.19);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    // Frog Move: Deep resonant bubbling ribbit / croak!
    function playFrogSound() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            // Low resonant double-pulsed pitch slide simulating a throat-sac croak
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.exponentialRampToValueAtTime(280, now + 0.07);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

            gain.gain.setValueAtTime(0.32, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.20);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.21);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    // Victory Fanfare
    function playVictorySound(winner) {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;
            
            let notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // Monkey (C major)
            let waveType = 'triangle';

            if (winner === 'BAT') {
                notes = [293.66, 349.23, 440.00, 587.33, 698.46]; // Bat (D minor / modal)
                waveType = 'sine';
            } else if (winner === 'FROG') {
                notes = [220.00, 277.18, 329.63, 440.00, 554.37]; // Frog (A major bouncy)
                waveType = 'sawtooth';
            }

            notes.forEach((freq, index) => {
                const noteTime = now + (index * 0.1);
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = waveType;
                osc.frequency.setValueAtTime(freq, noteTime);

                const duration = (index === notes.length - 1) ? 0.45 : 0.14;
                gain.gain.setValueAtTime(0.26, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(noteTime);
                osc.stop(noteTime + duration);
            });
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    // Draw / Stalemate Sound
    function playDrawSound() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;
            const notes = [380, 320, 260];

            notes.forEach((freq, idx) => {
                const noteTime = now + (idx * 0.12);
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.15, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.15);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(noteTime);
                osc.stop(noteTime + 0.16);
            });
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    // Button Click Sound
    function playClickSound() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.06);
        } catch (e) {
            console.warn('Audio click error:', e);
        }
    }

    // --- Particle Celebration Engine ---
    let particles = [];
    let particleAnimationId = null;

    function resizeParticleCanvas() {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeParticleCanvas);
    resizeParticleCanvas();

    function launchCelebrationParticles(winner) {
        resizeParticleCanvas();
        particles = [];
        const count = 80;

        let emojis = ['🍌', '🌴', '⭐', '✨', '🐵'];
        let colors = ['#f59e0b', '#10b981', '#facc15', '#34d399', '#fbbf24'];

        if (winner === 'BAT') {
            emojis = ['🦇', '🌙', '💜', '⚡', '🌌'];
            colors = ['#a855f7', '#06b6d4', '#c084fc', '#38bdf8', '#f43f5e'];
        } else if (winner === 'FROG') {
            emojis = ['🐸', '🪷', '💧', '🍃', '✨'];
            colors = ['#22c55e', '#14b8a6', '#4ade80', '#38bdf8', '#86efac'];
        }

        for (let i = 0; i < count; i++) {
            particles.push({
                x: particleCanvas.width * (0.2 + Math.random() * 0.6),
                y: particleCanvas.height * (0.3 + Math.random() * 0.4),
                vx: (Math.random() - 0.5) * 14,
                vy: -(Math.random() * 12 + 6),
                gravity: 0.38 + Math.random() * 0.2,
                size: Math.random() * 18 + 14,
                emoji: Math.random() > 0.4 ? emojis[Math.floor(Math.random() * emojis.length)] : null,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                vRot: (Math.random() - 0.5) * 10,
                opacity: 1,
                decay: 0.012 + Math.random() * 0.008
            });
        }

        if (particleAnimationId) cancelAnimationFrame(particleAnimationId);
        animateParticles();
    }

    function animateParticles() {
        const ctx = particleCanvas.getContext('2d');
        ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

        let activeCount = 0;
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            if (p.opacity <= 0) continue;

            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.98;
            p.rotation += p.vRot;
            p.opacity -= p.decay;

            if (p.opacity > 0) {
                activeCount++;
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);

                if (p.emoji) {
                    ctx.font = `${p.size}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(p.emoji, 0, 0);
                } else {
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                }
                ctx.restore();
            }
        }

        if (activeCount > 0) {
            particleAnimationId = requestAnimationFrame(animateParticles);
        } else {
            ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        }
    }

    // --- Sound Mute UI Sync ---
    function updateSoundUi() {
        soundIcon.textContent = isMuted ? '🔇' : '🔊';
        muteBtn.setAttribute('title', isMuted ? 'Unmute Sound' : 'Mute Sound');
        muteBtn.setAttribute('aria-label', isMuted ? 'Unmute Sound' : 'Mute Sound');
        localStorage.setItem('mvb_muted', String(isMuted));
    }
    updateSoundUi();

    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        updateSoundUi();
        if (!isMuted) playClickSound();
    });

    // --- Active Animals in Match ---
    function getActiveAnimals() {
        if (gameMode === '3p') return ['MONKEY', 'BAT', 'FROG'];
        // In 2-animal modes (ai or 2p), if human is Frog, rival is Bat (or Monkey); otherwise Monkey vs Bat
        if (humanSide === 'FROG') return ['FROG', 'BAT'];
        if (humanSide === 'BAT') return ['BAT', 'MONKEY'];
        return ['MONKEY', 'BAT'];
    }

    // --- UI Update Functions ---
    function updateTurnIndicators() {
        if (isGameOver) {
            teamMonkeyCard.classList.remove('active-turn');
            teamBatCard.classList.remove('active-turn');
            teamFrogCard.classList.remove('active-turn');
            return;
        }

        teamMonkeyCard.classList.toggle('active-turn', currentPlayer === 'MONKEY');
        teamBatCard.classList.toggle('active-turn', currentPlayer === 'BAT');
        teamFrogCard.classList.toggle('active-turn', currentPlayer === 'FROG');

        const animalLabels = {
            MONKEY: "Monkey 🐵",
            BAT: "Bat 🦇",
            FROG: "Frog 🐸"
        };

        if (gameMode === 'ai') {
            const isHumanTurn = currentPlayer === humanSide;
            if (isHumanTurn) {
                statusMsgEl.textContent = `Your Turn (${animalLabels[currentPlayer]})`;
            } else {
                statusMsgEl.textContent = `AI Thinking… (${animalLabels[currentPlayer]})`;
            }
        } else if (gameMode === '3p') {
            statusMsgEl.textContent = `${animalLabels[currentPlayer]}'s Turn!`;
        } else {
            statusMsgEl.textContent = `${animalLabels[currentPlayer]}'s Turn!`;
        }
    }

    function updateScoreDisplay() {
        monkeyScoreEl.textContent = scores.MONKEY;
        batScoreEl.textContent = scores.BAT;
        frogScoreEl.textContent = scores.FROG;

        // In 2-player/1v1 modes, hide the inactive team card to keep board clean; in 3p show all 3
        const activeAnimals = getActiveAnimals();
        teamMonkeyCard.style.display = activeAnimals.includes('MONKEY') ? 'flex' : 'none';
        teamBatCard.style.display = activeAnimals.includes('BAT') ? 'flex' : 'none';
        teamFrogCard.style.display = activeAnimals.includes('FROG') ? 'flex' : 'none';

        if (gameMode === 'ai') {
            streakDisplayEl.style.display = 'block';
            streakDisplayEl.textContent = `🔥 Streak: ${scores.STREAK}`;
            streakDisplayEl.classList.toggle('active', scores.STREAK >= 2);
        } else {
            streakDisplayEl.style.display = 'none';
        }
    }

    // --- Core Game Logic ---
    function checkWinner(board) {
        for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
            const [a, b, c] = WINNING_COMBINATIONS[i];
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return { winner: board[a], combinationIndex: i, cells: [a, b, c] };
            }
        }
        if (board.every(cell => cell !== null)) {
            return { winner: 'DRAW' };
        }
        return null;
    }

    function renderCell(index) {
        const cellEl = cells[index];
        const val = boardState[index];

        cellEl.classList.remove('filled', 'monkey-cell', 'bat-cell', 'frog-cell', 'win-cell');

        if (val === 'MONKEY') {
            cellEl.innerHTML = MONKEY_MARKER_SVG;
            cellEl.classList.add('filled', 'monkey-cell');
            cellEl.setAttribute('aria-label', `Square ${index + 1}: Monkey`);
        } else if (val === 'BAT') {
            cellEl.innerHTML = BAT_MARKER_SVG;
            cellEl.classList.add('filled', 'bat-cell');
            cellEl.setAttribute('aria-label', `Square ${index + 1}: Bat`);
        } else if (val === 'FROG') {
            cellEl.innerHTML = FROG_MARKER_SVG;
            cellEl.classList.add('filled', 'frog-cell');
            cellEl.setAttribute('aria-label', `Square ${index + 1}: Frog`);
        } else {
            cellEl.innerHTML = '';
            cellEl.setAttribute('aria-label', `Square ${index + 1}: Empty`);
        }
    }

    function drawWinningLine(combIndex, winner) {
        const coords = WIN_LINE_COORDS[combIndex];
        winningLine.setAttribute('x1', coords.x1);
        winningLine.setAttribute('y1', coords.y1);
        winningLine.setAttribute('x2', coords.x2);
        winningLine.setAttribute('y2', coords.y2);

        let strokeColor = '#f59e0b';
        if (winner === 'BAT') strokeColor = '#a855f7';
        else if (winner === 'FROG') strokeColor = '#22c55e';

        winningLine.setAttribute('stroke', strokeColor);
        winningLineSvg.classList.add('visible');
    }

    function hideWinningLine() {
        winningLineSvg.classList.remove('visible');
    }

    function showVictoryModal(winner, isDraw) {
        if (isDraw) {
            modalIcon.textContent = '🌴';
            modalTitle.textContent = 'Canopy Stalemate!';
            modalTitle.className = 'modal-title draw-win';
            modalSubtitle.textContent = 'Tangled in the vines — perfect defense on all sides!';
        } else if (winner === 'MONKEY') {
            modalIcon.textContent = '🍌';
            modalTitle.textContent = 'Team Monkey Wins!';
            modalTitle.className = 'modal-title monkey-win';
            modalSubtitle.textContent = 'Banana Bonanza! The Jungle Troop rules the canopy!';
        } else if (winner === 'BAT') {
            modalIcon.textContent = '🦇';
            modalTitle.textContent = 'Team Bat Wins!';
            modalTitle.className = 'modal-title bat-win';
            modalSubtitle.textContent = 'Midnight Sovereignty! The Bat Colony takes the night!';
        } else if (winner === 'FROG') {
            modalIcon.textContent = '🐸';
            modalTitle.textContent = 'Team Frog Wins!';
            modalTitle.className = 'modal-title frog-win';
            modalSubtitle.textContent = 'Lilypad Dynasty! The Canopy Croakers leap to victory!';
        }

        victoryModal.classList.remove('hidden');
        modalPlayAgainBtn.focus();
    }

    function handleGameOver(result) {
        isGameOver = true;
        updateTurnIndicators();

        if (result.winner === 'DRAW') {
            statusMsgEl.textContent = 'Draw Game! 🌴';
            if (gameMode === 'ai') scores.STREAK = 0;
            playDrawSound();
            showVictoryModal('DRAW', true);
        } else {
            const winner = result.winner;
            scores[winner]++;

            if (gameMode === 'ai') {
                if (winner === humanSide) {
                    scores.STREAK++;
                } else {
                    scores.STREAK = 0;
                }
            }

            result.cells.forEach(idx => cells[idx].classList.add('win-cell'));
            drawWinningLine(result.combinationIndex, winner);

            const names = { MONKEY: 'Team Monkey', BAT: 'Team Bat', FROG: 'Team Frog' };
            statusMsgEl.textContent = `${names[winner]} Triumphs! 🏆`;
            playVictorySound(winner);
            launchCelebrationParticles(winner);

            setTimeout(() => {
                showVictoryModal(winner, false);
            }, 700);
        }

        updateScoreDisplay();
    }

    function makeMove(index) {
        if (isGameOver || isAiThinking || boardState[index] !== null) return false;

        boardState[index] = currentPlayer;
        renderCell(index);

        if (currentPlayer === 'MONKEY') {
            playMonkeySound();
        } else if (currentPlayer === 'BAT') {
            playBatSound();
        } else if (currentPlayer === 'FROG') {
            playFrogSound();
        }

        const gameResult = checkWinner(boardState);
        if (gameResult) {
            handleGameOver(gameResult);
            return true;
        }

        // Toggle Player according to active animals
        const active = getActiveAnimals();
        const currentIdx = active.indexOf(currentPlayer);
        currentPlayer = active[(currentIdx + 1) % active.length];
        updateTurnIndicators();

        // Trigger AI if in AI mode and it's AI's turn
        if (gameMode === 'ai' && currentPlayer !== humanSide) {
            triggerAiMove();
        }

        return true;
    }

    // --- Minimax AI Engine ---
    function getAvailableMoves(board) {
        const moves = [];
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) moves.push(i);
        }
        return moves;
    }

    function minimax(board, depth, isMaximizing, aiMark, humanMark) {
        const result = checkWinner(board);
        if (result) {
            if (result.winner === aiMark) return 10 - depth;
            if (result.winner === humanMark) return depth - 10;
            if (result.winner === 'DRAW') return 0;
        }

        const available = getAvailableMoves(board);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < available.length; i++) {
                const move = available[i];
                board[move] = aiMark;
                const score = minimax(board, depth + 1, false, aiMark, humanMark);
                board[move] = null;
                maxEval = Math.max(maxEval, score);
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < available.length; i++) {
                const move = available[i];
                board[move] = humanMark;
                const score = minimax(board, depth + 1, true, aiMark, humanMark);
                board[move] = null;
                minEval = Math.min(minEval, score);
            }
            return minEval;
        }
    }

    function findWinningMove(board, mark) {
        const available = getAvailableMoves(board);
        for (let i = 0; i < available.length; i++) {
            const move = available[i];
            board[move] = mark;
            const res = checkWinner(board);
            board[move] = null;
            if (res && res.winner === mark) return move;
        }
        return null;
    }

    function chooseAiMove() {
        const active = getActiveAnimals();
        const aiMark = active.find(a => a !== humanSide) || (humanSide === 'MONKEY' ? 'BAT' : 'MONKEY');
        const humanMark = humanSide;
        const available = getAvailableMoves(boardState);

        if (available.length === 0) return null;

        // Easy Level: 75% Random, 25% simple block
        if (aiDifficulty === 'easy') {
            if (Math.random() < 0.25) {
                const blockMove = findWinningMove(boardState, humanMark);
                if (blockMove !== null) return blockMove;
            }
            return available[Math.floor(Math.random() * available.length)];
        }

        // Medium Level: Always win if possible, always block immediate loss, 45% strategic
        if (aiDifficulty === 'medium') {
            const winMove = findWinningMove(boardState, aiMark);
            if (winMove !== null) return winMove;

            const blockMove = findWinningMove(boardState, humanMark);
            if (blockMove !== null) return blockMove;

            if (Math.random() < 0.45 && boardState[4] === null) {
                return 4;
            }

            return available[Math.floor(Math.random() * available.length)];
        }

        // Hard Level (Unbeatable Minimax): Optimal play in all positions
        let bestScore = -Infinity;
        let bestMove = available[0];

        const shuffled = available.slice().sort(() => Math.random() - 0.5);

        for (let i = 0; i < shuffled.length; i++) {
            const move = shuffled[i];
            boardState[move] = aiMark;
            const score = minimax(boardState, 0, false, aiMark, humanMark);
            boardState[move] = null;

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    function triggerAiMove() {
        isAiThinking = true;
        const delay = 350 + Math.random() * 250;

        setTimeout(() => {
            if (isGameOver) {
                isAiThinking = false;
                return;
            }

            const aiChosenIndex = chooseAiMove();
            isAiThinking = false;

            if (aiChosenIndex !== null) {
                makeMove(aiChosenIndex);
            }
        }, delay);
    }

    // --- Reset & Restart ---
    function resetRound() {
        boardState = Array(9).fill(null);
        isGameOver = false;
        isAiThinking = false;

        const active = getActiveAnimals();
        currentPlayer = active[0]; // First animal in the active match starts

        hideWinningLine();
        victoryModal.classList.add('hidden');

        cells.forEach((_, idx) => renderCell(idx));
        updateScoreDisplay();
        updateTurnIndicators();

        // If in AI mode and human isn't the first active animal, AI starts
        if (gameMode === 'ai' && humanSide !== currentPlayer) {
            triggerAiMove();
        }
    }

    function resetAllScores() {
        scores.MONKEY = 0;
        scores.BAT = 0;
        scores.FROG = 0;
        scores.STREAK = 0;
        updateScoreDisplay();
        resetRound();
        playClickSound();
    }

    // --- Event Listeners ---

    // Grid Cell Clicks
    cells.forEach((cell, idx) => {
        cell.addEventListener('click', () => {
            if (isGameOver || isAiThinking) return;
            if (gameMode === 'ai' && currentPlayer !== humanSide) return;
            makeMove(idx);
        });
    });

    // Keyboard Navigation across the grid
    boardEl.addEventListener('keydown', (e) => {
        if (isGameOver) return;

        let nextIndex = focusedCellIndex;
        if (e.key === 'ArrowRight') nextIndex = (focusedCellIndex % 3 < 2) ? focusedCellIndex + 1 : focusedCellIndex - 2;
        else if (e.key === 'ArrowLeft') nextIndex = (focusedCellIndex % 3 > 0) ? focusedCellIndex - 1 : focusedCellIndex + 2;
        else if (e.key === 'ArrowDown') nextIndex = (focusedCellIndex + 3) % 9;
        else if (e.key === 'ArrowUp') nextIndex = (focusedCellIndex + 6) % 9;
        else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            cells[focusedCellIndex].click();
            return;
        } else if (/^[1-9]$/.test(e.key)) {
            const numIndex = parseInt(e.key, 10) - 1;
            cells[numIndex].click();
            return;
        } else {
            return;
        }

        e.preventDefault();
        focusedCellIndex = nextIndex;
        cells[focusedCellIndex].focus();
    });

    // Mode Selector Buttons
    function setGameMode(newMode) {
        gameMode = newMode;
        modeAiBtn.classList.toggle('active', newMode === 'ai');
        modeAiBtn.setAttribute('aria-pressed', String(newMode === 'ai'));
        mode2pBtn.classList.toggle('active', newMode === '2p');
        mode2pBtn.setAttribute('aria-pressed', String(newMode === '2p'));
        mode3pBtn.classList.toggle('active', newMode === '3p');
        mode3pBtn.setAttribute('aria-pressed', String(newMode === '3p'));

        difficultyGroup.style.display = (newMode === 'ai') ? 'flex' : 'none';
        playerChoiceContainer.style.display = (newMode === 'ai') ? 'flex' : 'none';

        updateScoreDisplay();
        resetRound();
        playClickSound();
    }

    modeAiBtn.addEventListener('click', () => setGameMode('ai'));
    mode2pBtn.addEventListener('click', () => setGameMode('2p'));
    mode3pBtn.addEventListener('click', () => setGameMode('3p'));

    // AI Difficulty Select
    difficultySelect.addEventListener('change', (e) => {
        aiDifficulty = e.target.value;
        playClickSound();
        resetRound();
    });

    // Player Animal Choice (Solo Mode)
    function setHumanSide(side) {
        humanSide = side;
        chooseMonkeyBtn.classList.toggle('active', side === 'MONKEY');
        chooseMonkeyBtn.setAttribute('aria-pressed', String(side === 'MONKEY'));
        chooseBatBtn.classList.toggle('active', side === 'BAT');
        chooseBatBtn.setAttribute('aria-pressed', String(side === 'BAT'));
        chooseFrogBtn.classList.toggle('active', side === 'FROG');
        chooseFrogBtn.setAttribute('aria-pressed', String(side === 'FROG'));

        scores.STREAK = 0;
        playClickSound();
        resetRound();
    }

    chooseMonkeyBtn.addEventListener('click', () => setHumanSide('MONKEY'));
    chooseBatBtn.addEventListener('click', () => setHumanSide('BAT'));
    chooseFrogBtn.addEventListener('click', () => setHumanSide('FROG'));

    // Action Buttons
    restartBtn.addEventListener('click', () => {
        playClickSound();
        resetRound();
    });

    resetScoreBtn.addEventListener('click', () => {
        if (window.confirm('Reset all match scores and win streak?')) {
            resetAllScores();
        }
    });

    modalPlayAgainBtn.addEventListener('click', () => {
        playClickSound();
        resetRound();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !victoryModal.classList.contains('hidden')) {
            resetRound();
        }
    });

    // Initial Setup
    updateScoreDisplay();
    updateTurnIndicators();
});

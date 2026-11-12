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

    const BEAR_MARKER_SVG = `
        <svg class="marker-svg bear-marker" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="bPawGrad" cx="50%" cy="40%" r="55%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="60%" stop-color="#7dd3fc"/>
                    <stop offset="100%" stop-color="#0284c7"/>
                </radialGradient>
            </defs>
            <!-- Big Polar Bear Paw Pad -->
            <ellipse cx="32" cy="38" rx="16" ry="13" fill="url(#bPawGrad)"/>
            <!-- 4 Toe Pads -->
            <ellipse cx="16" cy="22" rx="4.8" ry="6.2" transform="rotate(-20 16 22)" fill="url(#bPawGrad)"/>
            <ellipse cx="27" cy="16" rx="4.8" ry="6.8" transform="rotate(-6 27 16)" fill="url(#bPawGrad)"/>
            <ellipse cx="37" cy="16" rx="4.8" ry="6.8" transform="rotate(6 37 16)" fill="url(#bPawGrad)"/>
            <ellipse cx="48" cy="22" rx="4.8" ry="6.2" transform="rotate(20 48 22)" fill="url(#bPawGrad)"/>
            <!-- Frost Snowflake Core Accent -->
            <path d="M32 30 L32 46 M24 38 L40 38 M26 32 L38 44 M26 44 L38 32" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
            <circle cx="32" cy="38" r="2.8" fill="#38bdf8"/>
        </svg>
    `;

    const DRAGON_MARKER_SVG = `
        <svg class="marker-svg dragon-marker" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="dFlameGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#fef08a"/>
                    <stop offset="35%" stop-color="#f97316"/>
                    <stop offset="75%" stop-color="#ef4444"/>
                    <stop offset="100%" stop-color="#991b1b"/>
                </radialGradient>
                <linearGradient id="dHornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fef08a"/>
                    <stop offset="100%" stop-color="#b45309"/>
                </linearGradient>
            </defs>
            <!-- Dynamic Dragon Wings / Horns -->
            <path d="M18 24 C10 14, 4 10, 2 8 C8 16, 12 24, 16 32 Z" fill="url(#dHornGrad)"/>
            <path d="M46 24 C54 14, 60 10, 62 8 C56 16, 52 24, 48 32 Z" fill="url(#dHornGrad)"/>
            <!-- Flaming Dragon Head Silhouette -->
            <path d="M16 32 C16 20, 48 20, 48 32 C54 42, 50 54, 44 56 C36 60, 28 60, 20 56 C14 54, 10 42, 16 32 Z" fill="url(#dFlameGrad)"/>
            <!-- Crest Ridge Spikes -->
            <polygon points="32,10 28,20 36,20" fill="url(#dHornGrad)"/>
            <!-- Glowing Eyes -->
            <polygon points="23,34 29,32 26,38" fill="#fef08a"/>
            <polygon points="41,34 35,32 38,38" fill="#fef08a"/>
            <!-- Fiery Snout Flare -->
            <ellipse cx="32" cy="46" rx="10" ry="7" fill="#dc2626"/>
            <!-- Nostril Sparks -->
            <circle cx="28" cy="45" r="1.5" fill="#fef08a"/>
            <circle cx="36" cy="45" r="1.5" fill="#fef08a"/>
            <!-- Fire Breath Flame Burst Out Bottom -->
            <path d="M26 51 Q32 62 32 60 Q32 62 38 51 Q32 55 26 51 Z" fill="#fbbf24"/>
        </svg>
    `;

    // --- State Variables ---
    let boardState = Array(9).fill(null); // 'MONKEY', 'BAT', 'FROG', 'BEAR', 'DRAGON', or null
    let currentPlayer = 'MONKEY';          // 'MONKEY', 'BAT', 'FROG', 'BEAR', or 'DRAGON'
    let gameMode = 'ai';                  // 'ai', '2p', '3p', '4p', or '5p'
    let aiDifficulty = 'medium';          // 'easy', 'medium', 'hard'
    let savedSide = 'MONKEY';
    try {
        const stored = localStorage.getItem('mvb_human_side');
        if (['MONKEY', 'BAT', 'FROG', 'BEAR', 'DRAGON'].includes(stored)) savedSide = stored;
    } catch (e) {}
    let humanSide = savedSide;            // Selected champion: 'MONKEY', 'BAT', 'FROG', 'BEAR', or 'DRAGON'
    let isGameOver = false;
    let isAiThinking = false;
    let focusedCellIndex = 0;

    let scores = {
        MONKEY: 0,
        BAT: 0,
        FROG: 0,
        BEAR: 0,
        DRAGON: 0,
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
    const bearScoreEl = document.getElementById('bearScore');
    const dragonScoreEl = document.getElementById('dragonScore');
    const teamMonkeyCard = document.getElementById('teamMonkeyCard');
    const teamBatCard = document.getElementById('teamBatCard');
    const teamFrogCard = document.getElementById('teamFrogCard');
    const teamBearCard = document.getElementById('teamBearCard');
    const teamDragonCard = document.getElementById('teamDragonCard');
    const modeAiBtn = document.getElementById('modeAiBtn');
    const mode2pBtn = document.getElementById('mode2pBtn');
    const mode3pBtn = document.getElementById('mode3pBtn');
    const mode4pBtn = document.getElementById('mode4pBtn');
    const mode5pBtn = document.getElementById('mode5pBtn');
    const difficultyGroup = document.getElementById('aiDifficultyGroup');
    const difficultySelect = document.getElementById('difficultySelect');
    const playerChoiceContainer = document.getElementById('playerChoiceContainer');
    const chooseMonkeyBtn = document.getElementById('chooseMonkeyBtn');
    const chooseBatBtn = document.getElementById('chooseBatBtn');
    const chooseFrogBtn = document.getElementById('chooseFrogBtn');
    const chooseBearBtn = document.getElementById('chooseBearBtn');
    const chooseDragonBtn = document.getElementById('chooseDragonBtn');
    const muteBtn = document.getElementById('muteBtn');
    const soundIcon = document.getElementById('soundIcon');
    const restartBtn = document.getElementById('restartBtn');
    const resetScoreBtn = document.getElementById('resetScoreBtn');
    const winningLineSvg = document.getElementById('winningLineSvg');
    const winningLine = document.getElementById('winningLine');
    const particleCanvas = document.getElementById('particleCanvas');
    const btnNumpadGrid = document.getElementById('btnNumpadGrid');
    const btnNumpadPhone = document.getElementById('btnNumpadPhone');

    let numpadMode = 'grid';
    try {
        numpadMode = localStorage.getItem('mvt_numpad_mode') || 'grid';
    } catch (e) {}

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

    // Polar Bear Move: Deep arctic growl / rumble with frosty ice crackle!
    function playBearSound() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            // Deep low-frequency sub-bass rumble
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.24);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320, now);
            filter.frequency.exponentialRampToValueAtTime(140, now + 0.24);
            filter.Q.value = 5;

            gain.gain.setValueAtTime(0.38, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.26);

            // Shimmering high ice crystal chime
            const iceOsc = ctx.createOscillator();
            const iceGain = ctx.createGain();
            iceOsc.type = 'sine';
            iceOsc.frequency.setValueAtTime(1046.50, now); // C6
            iceOsc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6
            iceGain.gain.setValueAtTime(0.12, now);
            iceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            iceOsc.connect(iceGain);
            iceGain.connect(ctx.destination);
            iceOsc.start(now);
            iceOsc.stop(now + 0.13);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    // Dragon Move: Deep fiery draconic roar with fire breath sizzle!
    function playDragonSound() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            // Deep draconic growl/roar
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.28);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(450, now);
            filter.frequency.exponentialRampToValueAtTime(160, now + 0.28);
            filter.Q.value = 4;

            gain.gain.setValueAtTime(0.42, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.29);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.30);

            // Fire Breath Sizzle / Spark Burst
            const sparkOsc = ctx.createOscillator();
            const sparkGain = ctx.createGain();
            sparkOsc.type = 'triangle';
            sparkOsc.frequency.setValueAtTime(880, now);
            sparkOsc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
            sparkGain.gain.setValueAtTime(0.18, now);
            sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            sparkOsc.connect(sparkGain);
            sparkGain.connect(ctx.destination);
            sparkOsc.start(now);
            sparkOsc.stop(now + 0.15);
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
            } else if (winner === 'BEAR') {
                notes = [130.81, 261.63, 329.63, 392.00, 523.25, 659.25]; // Bear (C major majestic sub-bass glacier fanfare)
                waveType = 'triangle';
            } else if (winner === 'DRAGON') {
                notes = [146.83, 220.00, 293.66, 370.00, 440.00, 587.33]; // Dragon (D Dorian / Epic Fire Brass Fanfare)
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
        } else if (winner === 'BEAR') {
            emojis = ['🐻‍❄️', '❄️', '🧊', '🐟', '🐾', '✨'];
            colors = ['#38bdf8', '#0284c7', '#e0f2fe', '#bae6fd', '#ffffff'];
        } else if (winner === 'DRAGON') {
            emojis = ['🐉', '🔥', '🌋', '💥', '✨', '⚡'];
            colors = ['#ef4444', '#f97316', '#fbbf24', '#f59e0b', '#dc2626'];
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
        if (gameMode === '5p') return ['MONKEY', 'BAT', 'FROG', 'BEAR', 'DRAGON'];
        if (gameMode === '4p') {
            if (humanSide === 'DRAGON') return ['DRAGON', 'MONKEY', 'BAT', 'BEAR'];
            return ['MONKEY', 'BAT', 'FROG', 'BEAR'];
        }
        if (gameMode === '3p') {
            if (humanSide === 'DRAGON') return ['DRAGON', 'BEAR', 'MONKEY'];
            if (humanSide === 'BEAR') return ['BEAR', 'MONKEY', 'BAT'];
            if (humanSide === 'FROG') return ['FROG', 'MONKEY', 'BAT'];
            return ['MONKEY', 'BAT', 'FROG'];
        }
        // In 2-animal modes (ai or 2p), if human is Dragon, rival is Bear (Fire vs Ice!); if Bear, rival is Monkey; if Frog, rival is Bat; etc.
        if (humanSide === 'DRAGON') return ['DRAGON', 'BEAR'];
        if (humanSide === 'BEAR') return ['BEAR', 'MONKEY'];
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
            teamBearCard.classList.remove('active-turn');
            teamDragonCard.classList.remove('active-turn');
            return;
        }

        teamMonkeyCard.classList.toggle('active-turn', currentPlayer === 'MONKEY');
        teamBatCard.classList.toggle('active-turn', currentPlayer === 'BAT');
        teamFrogCard.classList.toggle('active-turn', currentPlayer === 'FROG');
        teamBearCard.classList.toggle('active-turn', currentPlayer === 'BEAR');
        teamDragonCard.classList.toggle('active-turn', currentPlayer === 'DRAGON');

        const animalLabels = {
            MONKEY: "Monkey 🐵",
            BAT: "Bat 🦇",
            FROG: "Frog 🐸",
            BEAR: "Polar Bear 🐻‍❄️",
            DRAGON: "Dragon 🐉"
        };

        if (gameMode === 'ai') {
            const isHumanTurn = currentPlayer === humanSide;
            if (isHumanTurn) {
                statusMsgEl.textContent = `Your Turn (${animalLabels[currentPlayer]})`;
            } else {
                statusMsgEl.textContent = `AI Thinking… (${animalLabels[currentPlayer]})`;
            }
        } else {
            statusMsgEl.textContent = `${animalLabels[currentPlayer]}'s Turn!`;
        }
    }

    function updateScoreDisplay() {
        monkeyScoreEl.textContent = scores.MONKEY;
        batScoreEl.textContent = scores.BAT;
        frogScoreEl.textContent = scores.FROG;
        bearScoreEl.textContent = scores.BEAR;
        dragonScoreEl.textContent = scores.DRAGON;

        // Dim benched animal cards rather than hiding completely, so players can click any animal to draft them
        const activeAnimals = getActiveAnimals();
        teamMonkeyCard.classList.toggle('bench', !activeAnimals.includes('MONKEY'));
        teamBatCard.classList.toggle('bench', !activeAnimals.includes('BAT'));
        teamFrogCard.classList.toggle('bench', !activeAnimals.includes('FROG'));
        teamBearCard.classList.toggle('bench', !activeAnimals.includes('BEAR'));
        teamDragonCard.classList.toggle('bench', !activeAnimals.includes('DRAGON'));

        teamMonkeyCard.style.display = 'flex';
        teamBatCard.style.display = 'flex';
        teamFrogCard.style.display = 'flex';
        teamBearCard.style.display = 'flex';
        teamDragonCard.style.display = 'flex';

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

    function getCellKeyHint(index) {
        if (numpadMode === 'phone') {
            return index + 1; // 1-9 reading order
        } else {
            // standard PC physical numpad: 7 8 9 top, 4 5 6 mid, 1 2 3 bot
            const GRID_HINTS = [7, 8, 9, 4, 5, 6, 1, 2, 3];
            return GRID_HINTS[index];
        }
    }

    function setNumpadMode(mode) {
        numpadMode = (mode === 'phone') ? 'phone' : 'grid';
        try {
            localStorage.setItem('mvt_numpad_mode', numpadMode);
        } catch (e) {}

        if (btnNumpadGrid) {
            btnNumpadGrid.classList.toggle('active', numpadMode === 'grid');
            btnNumpadGrid.setAttribute('aria-checked', String(numpadMode === 'grid'));
        }
        if (btnNumpadPhone) {
            btnNumpadPhone.classList.toggle('active', numpadMode === 'phone');
            btnNumpadPhone.setAttribute('aria-checked', String(numpadMode === 'phone'));
        }

        cells.forEach((_, idx) => {
            if (boardState[idx] === null) {
                renderCell(idx);
            }
        });
    }

    function renderCell(index) {
        const cellEl = cells[index];
        const val = boardState[index];

        cellEl.classList.remove('filled', 'monkey-cell', 'bat-cell', 'frog-cell', 'bear-cell', 'dragon-cell', 'win-cell');

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
        } else if (val === 'BEAR') {
            cellEl.innerHTML = BEAR_MARKER_SVG;
            cellEl.classList.add('filled', 'bear-cell');
            cellEl.setAttribute('aria-label', `Square ${index + 1}: Polar Bear`);
        } else if (val === 'DRAGON') {
            cellEl.innerHTML = DRAGON_MARKER_SVG;
            cellEl.classList.add('filled', 'dragon-cell');
            cellEl.setAttribute('aria-label', `Square ${index + 1}: Fire Dragon`);
        } else {
            const hint = getCellKeyHint(index);
            cellEl.innerHTML = `<span class="cell-key-hint">${hint}</span>`;
            cellEl.setAttribute('aria-label', `Square ${index + 1}: Empty, Press ${hint}`);
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
        else if (winner === 'BEAR') strokeColor = '#38bdf8';
        else if (winner === 'DRAGON') strokeColor = '#ef4444';

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
        } else if (winner === 'BEAR') {
            modalIcon.textContent = '🐻‍❄️';
            modalTitle.textContent = 'Team Polar Bear Wins!';
            modalTitle.className = 'modal-title bear-win';
            modalSubtitle.textContent = 'Glacial Dominion! The Arctic Clan freezes the competition!';
        } else if (winner === 'DRAGON') {
            modalIcon.textContent = '🐉';
            modalTitle.textContent = 'Team Dragon Wins!';
            modalTitle.className = 'modal-title dragon-win';
            modalSubtitle.textContent = 'Infernal Mastery! The Fire Brood scorches the grid!';
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

            const names = { MONKEY: 'Team Monkey', BAT: 'Team Bat', FROG: 'Team Frog', BEAR: 'Team Polar Bear', DRAGON: 'Team Dragon' };
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
        } else if (currentPlayer === 'BEAR') {
            playBearSound();
        } else if (currentPlayer === 'DRAGON') {
            playDragonSound();
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
        scores.BEAR = 0;
        scores.DRAGON = 0;
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

    // Mode Selector Buttons
    function setGameMode(newMode) {
        gameMode = newMode;
        modeAiBtn.classList.toggle('active', newMode === 'ai');
        modeAiBtn.setAttribute('aria-pressed', String(newMode === 'ai'));
        mode2pBtn.classList.toggle('active', newMode === '2p');
        mode2pBtn.setAttribute('aria-pressed', String(newMode === '2p'));
        mode3pBtn.classList.toggle('active', newMode === '3p');
        mode3pBtn.setAttribute('aria-pressed', String(newMode === '3p'));
        if (mode4pBtn) {
            mode4pBtn.classList.toggle('active', newMode === '4p');
            mode4pBtn.setAttribute('aria-pressed', String(newMode === '4p'));
        }
        if (mode5pBtn) {
            mode5pBtn.classList.toggle('active', newMode === '5p');
            mode5pBtn.setAttribute('aria-pressed', String(newMode === '5p'));
        }

        difficultyGroup.style.display = (newMode === 'ai') ? 'flex' : 'none';
        playerChoiceContainer.style.display = (newMode === '5p') ? 'none' : 'flex';

        updateScoreDisplay();
        resetRound();
        playClickSound();
    }

    modeAiBtn.addEventListener('click', () => setGameMode('ai'));
    mode2pBtn.addEventListener('click', () => setGameMode('2p'));
    mode3pBtn.addEventListener('click', () => setGameMode('3p'));
    if (mode4pBtn) mode4pBtn.addEventListener('click', () => setGameMode('4p'));
    if (mode5pBtn) mode5pBtn.addEventListener('click', () => setGameMode('5p'));

    // AI Difficulty Select
    difficultySelect.addEventListener('change', (e) => {
        aiDifficulty = e.target.value;
        playClickSound();
        resetRound();
    });

    // Player Animal Choice / Champion Selection
    function setHumanSide(side, playSound = true) {
        if (!['MONKEY', 'BAT', 'FROG', 'BEAR', 'DRAGON'].includes(side)) return;
        humanSide = side;
        try { localStorage.setItem('mvb_human_side', side); } catch (e) {}

        chooseMonkeyBtn.classList.toggle('active', side === 'MONKEY');
        chooseMonkeyBtn.setAttribute('aria-pressed', String(side === 'MONKEY'));
        chooseBatBtn.classList.toggle('active', side === 'BAT');
        chooseBatBtn.setAttribute('aria-pressed', String(side === 'BAT'));
        chooseFrogBtn.classList.toggle('active', side === 'FROG');
        chooseFrogBtn.setAttribute('aria-pressed', String(side === 'FROG'));
        if (chooseBearBtn) {
            chooseBearBtn.classList.toggle('active', side === 'BEAR');
            chooseBearBtn.setAttribute('aria-pressed', String(side === 'BEAR'));
        }
        if (chooseDragonBtn) {
            chooseDragonBtn.classList.toggle('active', side === 'DRAGON');
            chooseDragonBtn.setAttribute('aria-pressed', String(side === 'DRAGON'));
        }

        scores.STREAK = 0;
        if (playSound) playClickSound();
        resetRound();
    }

    chooseMonkeyBtn.addEventListener('click', () => setHumanSide('MONKEY'));
    chooseBatBtn.addEventListener('click', () => setHumanSide('BAT'));
    chooseFrogBtn.addEventListener('click', () => setHumanSide('FROG'));
    if (chooseBearBtn) chooseBearBtn.addEventListener('click', () => setHumanSide('BEAR'));
    if (chooseDragonBtn) chooseDragonBtn.addEventListener('click', () => setHumanSide('DRAGON'));

    // Team Card Quick-Select (Click avatar in scoreboard to pick champion)
    teamMonkeyCard.addEventListener('click', () => setHumanSide('MONKEY'));
    teamBatCard.addEventListener('click', () => setHumanSide('BAT'));
    teamFrogCard.addEventListener('click', () => setHumanSide('FROG'));
    if (teamBearCard) teamBearCard.addEventListener('click', () => setHumanSide('BEAR'));
    if (teamDragonCard) teamDragonCard.addEventListener('click', () => setHumanSide('DRAGON'));

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

    if (btnNumpadGrid) {
        btnNumpadGrid.addEventListener('click', () => {
            playClickSound();
            setNumpadMode('grid');
        });
    }

    if (btnNumpadPhone) {
        btnNumpadPhone.addEventListener('click', () => {
            playClickSound();
            setNumpadMode('phone');
        });
    }

    // Global Keyboard Navigation (Numpad, Arrow Keys, Digits, Enter, Rematch)
    document.addEventListener('keydown', (e) => {
        // Ignore if user is inside an input or select
        if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

        // Modal controls: Escape, Enter, Space, or NumpadEnter to close modal and play again
        if (!victoryModal.classList.contains('hidden')) {
            if (e.key === 'Escape' || e.key === 'Enter' || e.code === 'NumpadEnter' || e.key === ' ') {
                e.preventDefault();
                playClickSound();
                resetRound();
            }
            return;
        }

        // Quick rematch / restart key: 'R'
        if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            playClickSound();
            resetRound();
            return;
        }

        // If game is over, Enter / Space / NumpadEnter starts next round
        if (isGameOver) {
            if (e.key === 'Enter' || e.code === 'NumpadEnter' || e.key === ' ') {
                e.preventDefault();
                playClickSound();
                resetRound();
            }
            return;
        }

        // Arrow keys to navigate cells
        if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            let nextIndex = focusedCellIndex;
            if (e.key === 'ArrowRight') nextIndex = (focusedCellIndex % 3 < 2) ? focusedCellIndex + 1 : focusedCellIndex - 2;
            else if (e.key === 'ArrowLeft') nextIndex = (focusedCellIndex % 3 > 0) ? focusedCellIndex - 1 : focusedCellIndex + 2;
            else if (e.key === 'ArrowDown') nextIndex = (focusedCellIndex + 3) % 9;
            else if (e.key === 'ArrowUp') nextIndex = (focusedCellIndex + 6) % 9;
            focusedCellIndex = nextIndex;
            cells[focusedCellIndex].focus();
            return;
        }

        // Enter or Space on currently focused cell
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'NumpadEnter') {
            if (document.activeElement && document.activeElement !== document.body && !document.activeElement.classList.contains('cell')) {
                return;
            }
            e.preventDefault();
            if (!isAiThinking && (gameMode !== 'ai' || currentPlayer === humanSide)) {
                cells[focusedCellIndex].click();
            }
            return;
        }

        // Direct Number / Numpad selection
        let targetCellIndex = null;

        // 1. Hardware Numpad key detection via e.code (works with NumLock ON and OFF)
        if (e.code && e.code.startsWith('Numpad')) {
            const NUMPAD_GRID_MAP = {
                'Numpad7': 0, 'Numpad8': 1, 'Numpad9': 2,
                'Numpad4': 3, 'Numpad5': 4, 'Numpad6': 5,
                'Numpad1': 6, 'Numpad2': 7, 'Numpad3': 8
            };
            const NUMPAD_PHONE_MAP = {
                'Numpad1': 0, 'Numpad2': 1, 'Numpad3': 2,
                'Numpad4': 3, 'Numpad5': 4, 'Numpad6': 5,
                'Numpad7': 6, 'Numpad8': 7, 'Numpad9': 8
            };
            const map = (numpadMode === 'phone') ? NUMPAD_PHONE_MAP : NUMPAD_GRID_MAP;
            if (map[e.code] !== undefined) {
                targetCellIndex = map[e.code];
            }
        }

        // 2. Hardware Numpad with NumLock OFF via e.location === 3
        if (targetCellIndex === null && e.location === 3) {
            const NUMLOCK_OFF_GRID = {
                'Home': 0, 'ArrowUp': 1, 'PageUp': 2,
                'ArrowLeft': 3, 'Clear': 4, 'ArrowRight': 5,
                'End': 6, 'ArrowDown': 7, 'PageDown': 8
            };
            const NUMLOCK_OFF_PHONE = {
                'End': 0, 'ArrowDown': 1, 'PageDown': 2,
                'ArrowLeft': 3, 'Clear': 4, 'ArrowRight': 5,
                'Home': 6, 'ArrowUp': 7, 'PageUp': 8
            };
            const map = (numpadMode === 'phone') ? NUMLOCK_OFF_PHONE : NUMLOCK_OFF_GRID;
            if (map[e.key] !== undefined) {
                targetCellIndex = map[e.key];
            }
        }

        // 3. Top-row number digits (Digit1 - Digit9)
        if (targetCellIndex === null && e.code && e.code.startsWith('Digit')) {
            const digit = parseInt(e.code.replace('Digit', ''), 10);
            if (digit >= 1 && digit <= 9) {
                if (numpadMode === 'phone') {
                    targetCellIndex = digit - 1;
                } else {
                    const DIGIT_GRID_MAP = { 7: 0, 8: 1, 9: 2, 4: 3, 5: 4, 6: 5, 1: 6, 2: 7, 3: 8 };
                    targetCellIndex = DIGIT_GRID_MAP[digit];
                }
            }
        }

        // 4. Fallback check on e.key if e.code was empty
        if (targetCellIndex === null && /^[1-9]$/.test(e.key)) {
            const num = parseInt(e.key, 10);
            if (numpadMode === 'phone') {
                targetCellIndex = num - 1;
            } else {
                const NUM_GRID_MAP = { 7: 0, 8: 1, 9: 2, 4: 3, 5: 4, 6: 5, 1: 6, 2: 7, 3: 8 };
                targetCellIndex = NUM_GRID_MAP[num];
            }
        }

        // Execute cell selection if mapped
        if (targetCellIndex !== null && targetCellIndex >= 0 && targetCellIndex <= 8) {
            e.preventDefault();
            if (isGameOver || isAiThinking) return;
            if (gameMode === 'ai' && currentPlayer !== humanSide) return;

            focusedCellIndex = targetCellIndex;
            cells[targetCellIndex].focus();
            cells[targetCellIndex].click();
        }
    });

    // Initial Setup
    setNumpadMode(numpadMode);
    setHumanSide(humanSide, false);
    updateScoreDisplay();
    updateTurnIndicators();
});

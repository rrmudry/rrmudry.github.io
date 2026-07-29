/**
 * Dogs vs Cats Tic-Tac-Toe
 * Pure JS Game Engine with Web Audio Sound Effects, Minimax AI & Animated Winning Line
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Constants & Config ---
    const WINNING_COMBINATIONS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    // SVG Icons for Markers
    const DOG_MARKER_SVG = `
        <svg class="marker-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Dog Paw Print -->
            <path d="M32 36C25.5 36 21 41 21 47C21 52.5 25.8 57 32 57C38.2 57 43 52.5 43 47C43 41 38.5 36 32 36Z" fill="currentColor"/>
            <ellipse cx="17.5" cy="30" rx="5.5" ry="7.5" fill="currentColor" transform="rotate(-20 17.5 30)"/>
            <ellipse cx="27" cy="21.5" rx="5.5" ry="8" fill="currentColor" transform="rotate(-5 27 21.5)"/>
            <ellipse cx="37" cy="21.5" rx="5.5" ry="8" fill="currentColor" transform="rotate(5 37 21.5)"/>
            <ellipse cx="46.5" cy="30" rx="5.5" ry="7.5" fill="currentColor" transform="rotate(20 46.5 30)"/>
        </svg>
    `;

    const CAT_MARKER_SVG = `
        <svg class="marker-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Cat Head Silhouette -->
            <path d="M12 18L20 32C20 32 25 29 32 29C39 29 44 32 44 32L52 18C52 18 54 44 48 51C42 58 32 58 32 58C32 58 22 58 16 51C10 44 12 18 12 18Z" fill="currentColor"/>
            <!-- Inner ears & details cutouts -->
            <polygon points="16,22 21,30 16,30" fill="rgba(15, 23, 42, 0.6)"/>
            <polygon points="48,22 43,30 48,30" fill="rgba(15, 23, 42, 0.6)"/>
            <!-- Whisker accents -->
            <path d="M8 40L20 42M8 47L20 46M56 40L44 42M56 47L44 46" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        </svg>
    `;

    // --- State Variables ---
    let boardState = Array(9).fill(null); // 'DOG', 'CAT', or null
    let currentPlayer = 'DOG'; // 'DOG' starts first
    let gameMode = 'ai'; // 'ai' or '2p'
    let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
    let humanSide = 'DOG'; // Player 1 choice in AI mode ('DOG' or 'CAT')
    let isGameOver = false;
    let isAiProcessing = false;
    let focusedCellIndex = 0;

    let scores = {
        DOG: 0,
        CAT: 0,
        STREAK: 0
    };

    let isMuted = false;

    // --- DOM Elements ---
    const boardEl = document.getElementById('gameBoard');
    const cells = document.querySelectorAll('.cell');
    const statusMsgEl = document.getElementById('statusMessage');
    const streakDisplayEl = document.getElementById('streakDisplay');
    const dogScoreEl = document.getElementById('dogScore');
    const catScoreEl = document.getElementById('catScore');
    const teamDogCard = document.getElementById('teamDogCard');
    const teamCatCard = document.getElementById('teamCatCard');
    const modeAiBtn = document.getElementById('modeAiBtn');
    const mode2pBtn = document.getElementById('mode2pBtn');
    const difficultyGroup = document.getElementById('aiDifficultyGroup');
    const difficultySelect = document.getElementById('difficultySelect');
    const playerChoiceContainer = document.getElementById('playerChoiceContainer');
    const chooseDogBtn = document.getElementById('chooseDogBtn');
    const chooseCatBtn = document.getElementById('chooseCatBtn');
    const muteBtn = document.getElementById('muteBtn');
    const soundIcon = document.getElementById('soundIcon');
    const restartBtn = document.getElementById('restartBtn');
    const resetScoreBtn = document.getElementById('resetScoreBtn');
    const winningLineSvg = document.getElementById('winningLineSvg');
    const winningLine = document.getElementById('winningLine');

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
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playDogBarkSound() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            // Oscillator for Woof tone
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            // Rapid pitch drop simulating bark
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.16);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    function playCatMeowSound() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            // Pitch glide upwards then soft drop
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);
            osc.frequency.exponentialRampToValueAtTime(550, now + 0.25);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.26);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    function playPopSound() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.06);
        } catch (e) {}
    }

    function playWinFanfare() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;
            const notes = [261.63, 329.63, 392.00, 523.25]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const noteTime = now + (idx * 0.1);

                osc.type = 'triangle';
                osc.frequency.value = freq;

                gain.gain.setValueAtTime(0.3, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.3);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(noteTime);
                osc.stop(noteTime + 0.35);
            });
        } catch (e) {}
    }

    // --- LocalStorage Utilities ---
    function loadSavedScores() {
        const saved = localStorage.getItem('dogs_vs_cats_ttt_scores');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                scores.DOG = parsed.DOG || 0;
                scores.CAT = parsed.CAT || 0;
                scores.STREAK = parsed.STREAK || 0;
            } catch (e) {}
        }
        updateScoreUI();
    }

    function saveScores() {
        localStorage.setItem('dogs_vs_cats_ttt_scores', JSON.stringify(scores));
        updateScoreUI();
    }

    function updateScoreUI() {
        dogScoreEl.textContent = scores.DOG;
        catScoreEl.textContent = scores.CAT;
        streakDisplayEl.textContent = `🔥 Streak: ${scores.STREAK}`;
    }

    // --- Initialization & Setup ---
    function initGame() {
        loadSavedScores();
        setupEventListeners();
        resetRound();
    }

    function setupEventListeners() {
        // Cell Clicks & Keydown
        cells.forEach((cell, index) => {
            cell.addEventListener('click', () => handleCellClick(index));
            cell.addEventListener('keydown', (e) => handleCellKeyDown(e, index));
        });

        // Mode Switching
        modeAiBtn.addEventListener('click', () => setMode('ai'));
        mode2pBtn.addEventListener('click', () => setMode('2p'));

        // Difficulty Select
        difficultySelect.addEventListener('change', (e) => {
            aiDifficulty = e.target.value;
            playPopSound();
        });

        // Player Side Choice in AI Mode
        chooseDogBtn.addEventListener('click', () => setHumanSide('DOG'));
        chooseCatBtn.addEventListener('click', () => setHumanSide('CAT'));

        // Mute Button
        muteBtn.addEventListener('click', toggleMute);

        // Reset Buttons
        restartBtn.addEventListener('click', () => {
            playPopSound();
            resetRound();
        });
        resetScoreBtn.addEventListener('click', resetAllScores);

        // Modal Play Again
        modalPlayAgainBtn.addEventListener('click', () => {
            playPopSound();
            victoryModal.classList.add('hidden');
            resetRound();
        });

        // Global Keyboard Controls (1-9 Numpad / Keys)
        window.addEventListener('keydown', handleGlobalKeyDown);
    }

    function toggleMute() {
        isMuted = !isMuted;
        soundIcon.textContent = isMuted ? '🔇' : '🔊';
        muteBtn.classList.toggle('muted', isMuted);
    }

    function setMode(mode) {
        if (gameMode === mode) return;
        playPopSound();
        gameMode = mode;
        if (mode === 'ai') {
            modeAiBtn.classList.add('active');
            mode2pBtn.classList.remove('active');
            difficultyGroup.style.display = 'flex';
            playerChoiceContainer.style.display = 'flex';
        } else {
            mode2pBtn.classList.add('active');
            modeAiBtn.classList.remove('active');
            difficultyGroup.style.display = 'none';
            playerChoiceContainer.style.display = 'none';
        }
        resetRound();
    }

    function setHumanSide(side) {
        if (humanSide === side) return;
        playPopSound();
        humanSide = side;
        if (side === 'DOG') {
            chooseDogBtn.classList.add('active');
            chooseCatBtn.classList.remove('active');
        } else {
            chooseCatBtn.classList.add('active');
            chooseDogBtn.classList.remove('active');
        }
        resetRound();
    }

    function resetRound() {
        boardState = Array(9).fill(null);
        isGameOver = false;
        isAiProcessing = false;
        currentPlayer = 'DOG'; // Dog always takes turn 1

        // Reset UI Cells
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.className = 'cell';
            cell.removeAttribute('aria-marked');
        });

        // Reset SVG Winning Line
        winningLineSvg.classList.remove('active');
        winningLine.setAttribute('x1', '0');
        winningLine.setAttribute('y1', '0');
        winningLine.setAttribute('x2', '0');
        winningLine.setAttribute('y2', '0');

        updateTurnUI();

        // If in AI mode and human chose CAT, AI (DOG) takes move 1!
        if (gameMode === 'ai' && humanSide === 'CAT') {
            triggerAiTurn();
        }
    }

    function resetAllScores() {
        if (confirm('Are you sure you want to reset all game scores?')) {
            playPopSound();
            scores.DOG = 0;
            scores.CAT = 0;
            scores.STREAK = 0;
            saveScores();
            resetRound();
        }
    }

    // --- Turn & Cell Handling ---
    function updateTurnUI() {
        const dogTurn = currentPlayer === 'DOG';
        teamDogCard.classList.toggle('active-turn', dogTurn);
        teamCatCard.classList.toggle('active-turn', !dogTurn);

        if (dogTurn) {
            statusMsgEl.textContent = gameMode === 'ai' && humanSide === 'CAT' ? "AI Dog is thinking..." : "Team Dog's Turn! 🐶";
            statusMsgEl.style.color = "var(--dog-color)";
        } else {
            statusMsgEl.textContent = gameMode === 'ai' && humanSide === 'DOG' ? "AI Cat is thinking..." : "Team Cat's Turn! 🐱";
            statusMsgEl.style.color = "var(--cat-color)";
        }
    }

    function handleCellClick(index) {
        if (isGameOver || isAiProcessing || boardState[index] !== null) {
            return;
        }

        // Make human move
        makeMove(index, currentPlayer);

        if (isGameOver) return;

        // Check if next turn is AI
        if (gameMode === 'ai' && currentPlayer !== humanSide) {
            triggerAiTurn();
        }
    }

    function makeMove(index, player) {
        boardState[index] = player;
        const cell = cells[index];
        cell.classList.add('marked');

        if (player === 'DOG') {
            cell.classList.add('dog-mark');
            cell.innerHTML = DOG_MARKER_SVG;
            cell.setAttribute('aria-marked', 'Dog');
            playDogBarkSound();
        } else {
            cell.classList.add('cat-mark');
            cell.innerHTML = CAT_MARKER_SVG;
            cell.setAttribute('aria-marked', 'Cat');
            playCatMeowSound();
        }

        // Check win or draw
        const winInfo = checkWinner(boardState);
        if (winInfo) {
            handleGameEnd(winInfo.winner, winInfo.line);
        } else if (isBoardFull(boardState)) {
            handleGameEnd('DRAW');
        } else {
            // Swap Turns
            currentPlayer = currentPlayer === 'DOG' ? 'CAT' : 'DOG';
            updateTurnUI();
        }
    }

    function isBoardFull(board) {
        return board.every(val => val !== null);
    }

    // --- AI Engine ---
    function triggerAiTurn() {
        isAiProcessing = true;
        updateTurnUI();

        // Slight artificial thinking delay for realistic game feel
        const delay = Math.floor(Math.random() * 200) + 350;
        setTimeout(() => {
            if (isGameOver) {
                isAiProcessing = false;
                return;
            }

            const aiPlayer = currentPlayer;
            const moveIndex = getAiMoveIndex(aiPlayer, aiDifficulty);
            isAiProcessing = false;

            if (moveIndex !== null && moveIndex !== undefined) {
                makeMove(moveIndex, aiPlayer);
            }
        }, delay);
    }

    function getAiMoveIndex(aiPlayer, difficulty) {
        const emptyIndices = getEmptyIndices(boardState);
        if (emptyIndices.length === 0) return null;

        const opponent = aiPlayer === 'DOG' ? 'CAT' : 'DOG';

        // 1. Easy Mode: Pick completely random empty cell
        if (difficulty === 'easy') {
            return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        }

        // 2. Medium Mode: Check immediate win or immediate block, else 50% minimax / 50% random
        if (difficulty === 'medium') {
            // Check immediate winning move
            for (let idx of emptyIndices) {
                const tempBoard = [...boardState];
                tempBoard[idx] = aiPlayer;
                if (checkWinner(tempBoard)) return idx;
            }
            // Check immediate blocking move
            for (let idx of emptyIndices) {
                const tempBoard = [...boardState];
                tempBoard[idx] = opponent;
                if (checkWinner(tempBoard)) return idx;
            }
            // 60% chance smart minimax, 40% random
            if (Math.random() < 0.6) {
                return minimax(boardState, aiPlayer, 0, true).index;
            } else {
                return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            }
        }

        // 3. Hard / Unbeatable Mode: Full Minimax algorithm
        return minimax(boardState, aiPlayer, 0, true).index;
    }

    function getEmptyIndices(board) {
        return board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    }

    // Minimax Recursive Engine
    function minimax(board, currentTurn, depth, isMaximizing) {
        const emptyIndices = getEmptyIndices(board);
        const winInfo = checkWinner(board);

        const aiPlayer = isMaximizing ? currentTurn : (currentTurn === 'DOG' ? 'CAT' : 'DOG');

        if (winInfo) {
            if (winInfo.winner === currentTurn) return { score: 10 - depth };
            else return { score: depth - 10 };
        } else if (emptyIndices.length === 0) {
            return { score: 0 };
        }

        let moves = [];

        for (let idx of emptyIndices) {
            let move = { index: idx };
            board[idx] = isMaximizing ? currentTurn : (currentTurn === 'DOG' ? 'CAT' : 'DOG');

            const nextTurn = isMaximizing ? (currentTurn === 'DOG' ? 'CAT' : 'DOG') : currentTurn;
            const result = minimax(board, currentTurn, depth + 1, !isMaximizing);

            move.score = result.score;
            board[idx] = null;
            moves.push(move);
        }

        let bestMove;
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let move of moves) {
                if (move.score > bestScore) {
                    bestScore = move.score;
                    bestMove = move;
                }
            }
        } else {
            let bestScore = Infinity;
            for (let move of moves) {
                if (move.score < bestScore) {
                    bestScore = move.score;
                    bestMove = move;
                }
            }
        }

        return bestMove;
    }

    // --- Win & Draw Handler ---
    function checkWinner(board) {
        for (let combo of WINNING_COMBINATIONS) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return { winner: board[a], line: combo };
            }
        }
        return null;
    }

    function handleGameEnd(winner, winningLineIndices = null) {
        isGameOver = true;

        if (winner === 'DRAW') {
            statusMsgEl.textContent = "It's a Pawsitive Tie! 🐾";
            statusMsgEl.style.color = "var(--text-secondary)";
            scores.STREAK = 0;
            saveScores();

            showVictoryModal('⚖️', "It's a Tie!", "Cat & Dog fought to a draw!");
        } else {
            const isDog = winner === 'DOG';
            const winnerText = isDog ? "Team Dog Wins!" : "Team Cat Wins!";
            const winnerSub = isDog ? "Bone-afide Victory! 🦴" : "Purr-fect Victory! 🐾";
            const icon = isDog ? "🐶" : "🐱";

            statusMsgEl.textContent = `${winnerText} 🎉`;
            statusMsgEl.style.color = isDog ? "var(--dog-color)" : "var(--cat-color)";

            // Highlight Winning Cells & Draw SVG Line
            if (winningLineIndices) {
                winningLineIndices.forEach(idx => {
                    cells[idx].classList.add('win-cell');
                });
                drawWinningLine(winningLineIndices, isDog);
            }

            // Update Score & Streaks
            scores[winner]++;
            if (gameMode === 'ai') {
                if (winner === humanSide) {
                    scores.STREAK++;
                } else {
                    scores.STREAK = 0;
                }
            } else {
                scores.STREAK++;
            }
            saveScores();

            // Sound & Confetti
            playWinFanfare();
            if (window.confetti) {
                window.confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

            // Scoreboard highscore integration if available
            if (window.Scoreboard && typeof window.Scoreboard.addWin === 'function') {
                const winnerName = prompt(`Congratulations ${isDog ? "Team Dog" : "Team Cat"}! Enter your name for the High Scores:`, isDog ? "Top Dog" : "Cool Cat");
                if (winnerName) {
                    window.Scoreboard.addWin('ticTacToe', winnerName);
                }
            }

            // Delayed Modal Pop
            setTimeout(() => {
                showVictoryModal(icon, winnerText, winnerSub);
            }, 700);
        }
    }

    function drawWinningLine(combo, isDog) {
        // Map 3x3 grid cells to SVG coordinates (0 to 300 scale)
        // Col: 0->50, 1->150, 2->250
        // Row: 0->50, 1->150, 2->250
        const getCoord = (idx) => {
            const col = idx % 3;
            const row = Math.floor(idx / 3);
            return {
                x: col * 100 + 50,
                y: row * 100 + 50
            };
        };

        const start = getCoord(combo[0]);
        const end = getCoord(combo[2]);

        winningLine.setAttribute('x1', start.x);
        winningLine.setAttribute('y1', start.y);
        winningLine.setAttribute('x2', end.x);
        winningLine.setAttribute('y2', end.y);
        winningLine.setAttribute('stroke', isDog ? 'var(--dog-color)' : 'var(--cat-color)');

        winningLineSvg.classList.add('active');
    }

    function showVictoryModal(icon, title, subtitle) {
        modalIcon.textContent = icon;
        modalTitle.textContent = title;
        modalSubtitle.textContent = subtitle;
        victoryModal.classList.remove('hidden');
    }

    // --- Keyboard Navigation ---
    function handleCellKeyDown(e, index) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCellClick(index);
        }
    }

    function handleGlobalKeyDown(e) {
        // Support Numpad / Number keys 1-9
        if (e.key >= '1' && e.key <= '9') {
            const numMap = [6, 7, 8, 3, 4, 5, 0, 1, 2]; // Numpad mapping (7-8-9 top row, etc)
            const keyNum = parseInt(e.key, 10);
            // Standard top row 1-9 vs numpad: let's map 1-9 direct: 1=0, 2=1... 9=8
            const cellIdx = keyNum - 1;
            if (cellIdx >= 0 && cellIdx < 9) {
                handleCellClick(cellIdx);
            }
        }
    }

    // Run Initialization
    initGame();
});

function shuffleArray(array) {
    const result = array.slice();
    let currentIndex = result.length, randomIndex;
    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [result[currentIndex], result[randomIndex]] = [result[randomIndex], result[currentIndex]];
    }
    return result;
}

if (typeof document !== 'undefined') {
document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const MAX_POWER = 560;
    const TIME_LIMIT = 300;
    const INITIAL_SURVIVAL = 10; // Still used internally for calculation
    const LOW_TIME_THRESHOLD = 120;
    const POWER_WARNING_THRESHOLD = 0.8; // 80% of MAX_POWER

    // --- System Data ---
    const systemsData = [ // Same data as before
        { id: 'guidance', name: 'Guidance Computer', power: 120, time: 30, survival: 25, essential: true },
        { id: 'imu', name: 'Inertial Measurement Unit', power: 80, time: 25, survival: 20, essential: true },
        { id: 'life_support', name: 'Life Support Monitor', power: 60, time: 20, survival: 15, essential: true },
        { id: 'comm_short', name: 'Short Range Comms', power: 50, time: 15, survival: 10 },
        { id: 'stabilizer', name: 'Stabilizer Fan', power: 30, time: 15, survival: 5 },
        { id: 'rcs_thrusters', name: 'RCS Thruster Control', power: 75, time: 20, survival: 15 },
        { id: 'radar', name: 'Landing Radar System', power: 100, time: 30, survival: 10 },
        { id: 'battery_heater', name: 'Battery Heater', power: 45, time: 10, survival: 3 },
        { id: 'cabin_lights', name: 'Cabin Lights', power: 20, time: 5, survival: 1 },
        { id: 'ext_lights', name: 'External Lights', power: 40, time: 10, survival: 0 },
        { id: 'cassette', name: 'Cassette Player', power: 25, time: 5, survival: 0 },
        { id: 'camera', name: 'External Camera Feed', power: 35, time: 12, survival: 0 },
        { id: 'espresso', name: 'Exp. Espresso Machine', power: 90, time: 40, survival: -5 },
        { id: 'lava_lamp', name: 'Zero-G Lava Lamp', power: 70, time: 20, survival: -10 },
        { id: 'duct_tape_warmer', name: 'Duct Tape Warmer', power: 50, time: 15, survival: -2 },
        { id: 'hologram', name: 'Holographic Projector', power: 110, time: 25, survival: -8 },
        { id: 'extra_sensor', name: 'Redundant Sensor Array', power: 65, time: 18, survival: -3 },
    ];

    // --- DOM Elements ---
    const timerDisplay = document.getElementById('timer');
    const distanceBar = document.getElementById('distance-bar');
    const spaceshipIcon = document.getElementById('spaceship-icon');
    const progressBarWrapper = document.querySelector('.progress-bar-wrapper');
    const powerLimitDisplay = document.getElementById('power-limit');
    const systemListContainer = document.getElementById('system-list');
    const powerDisplay = document.getElementById('power-display');
    // Survival display element is removed
    const powerMeterBar = document.getElementById('power-meter-bar'); // New power meter bar
    const powerMeterText = document.getElementById('power-meter-text'); // New power meter text
    const startReentryButton = document.getElementById('start-reentry');
    const logPanel = document.getElementById('log-panel');

    // Modal Elements
    const modal = document.getElementById('game-over-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalImage = document.getElementById('modal-image');
    const modalMessage = document.getElementById('modal-message');
    const modalPower = document.getElementById('modal-power');
    const modalTime = document.getElementById('modal-time');
    const modalSurvival = document.getElementById('modal-survival'); // Still needed for modal
    const playAgainButton = document.getElementById('play-again-button');

    // Outcome Image Arrays
    const successImageUrls = ['success1.png', 'success2.png', 'success3.png'];
    const failureImageUrls = ['failure1.png', 'failure2.png', 'failure3.png'];

    // --- Game State Variables ---
    let currentPower = 0;
    let currentSurvival = INITIAL_SURVIVAL; // Still track internally
    let remainingTime = TIME_LIMIT;
    let timerInterval = null;
    let gameActive = false;
    let activeSystems = new Set();

    // --- Utility Functions --- (shuffleArray, formatTime, logMessage remain the same)
    function formatTime(seconds) { /* ... */
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
     }
    function logMessage(message, type = 'info') { /* ... */
        const p = document.createElement('p');
        const timestamp = formatTime(TIME_LIMIT - remainingTime);
        p.innerHTML = `[${timestamp}] ${message}`;
        if (type === 'error') p.style.color = '#f8d7da';
        else if (type === 'success') p.style.color = '#d4edda';
        else if (type === 'warning') p.style.color = '#fff3cd';
        if (logPanel.firstChild) logPanel.insertBefore(p, logPanel.firstChild);
        else logPanel.appendChild(p);
     }

    // --- Core Game Logic ---

    // Updated updateDisplays to handle power meter and remove survival display
    function updateDisplays() {
        powerDisplay.textContent = currentPower;
        // survivalDisplay.textContent = currentSurvival; // Removed
        timerDisplay.textContent = formatTime(remainingTime);

        // Power Text Warning (redundant if bar has colors, but kept for clarity)
        powerDisplay.classList.toggle('warning', currentPower > MAX_POWER);

        // Update Power Meter Bar
        powerMeterBar.value = currentPower;
        powerMeterText.textContent = `${currentPower} / ${MAX_POWER} W`; // Update text label
        // Update Power Meter Bar Color Classes
        powerMeterBar.classList.remove('power-ok', 'power-warning', 'power-critical');
        if (currentPower > MAX_POWER) {
            powerMeterBar.classList.add('power-critical');
            powerMeterText.style.color = '#d9534f'; // Make text red too
        } else if (currentPower > MAX_POWER * POWER_WARNING_THRESHOLD) {
            powerMeterBar.classList.add('power-warning');
             powerMeterText.style.color = '#f0ad4e'; // Make text orange
        } else {
            powerMeterBar.classList.add('power-ok');
            powerMeterText.style.color = '#ccc'; // Reset text color
        }

        // Distance Bar Update (remains the same)
        const timeElapsed = TIME_LIMIT - remainingTime;
        const progress = Math.min(100, Math.max(0, (timeElapsed / TIME_LIMIT) * 100));
        distanceBar.value = progress;
        const clampedProgress = Math.min(98, Math.max(2, progress));
        spaceshipIcon.style.left = `${clampedProgress}%`;

        // Timer Color Update (remains the same)
        if (remainingTime <= 0) {
             timerDisplay.style.color = '#d9534f';
             progressBarWrapper.classList.remove('flash-red');
        } else if (remainingTime < LOW_TIME_THRESHOLD) {
            timerDisplay.style.color = '#d9534f';
            progressBarWrapper.classList.add('flash-red');
        } else {
            timerDisplay.style.color = '#6a9ff3';
            progressBarWrapper.classList.remove('flash-red');
        }
    }

    // calculateTotals still calculates survival internally
    function calculateTotals() {
        currentPower = 0;
        currentSurvival = INITIAL_SURVIVAL;
        activeSystems.forEach(systemId => {
            const system = systemsData.find(s => s.id === systemId);
            if (system) {
                currentPower += system.power;
                currentSurvival += system.survival; // Still calculate
            }
        });
        currentSurvival = Math.max(0, Math.min(100, currentSurvival)); // Clamp survival

        // Log power warning only once when exceeded (visual handled by bar color now)
        if (currentPower > MAX_POWER && !powerMeterBar.classList.contains('power-critical')) {
             logMessage(`WARNING: Power limit exceeded (${currentPower}/${MAX_POWER} W)!`, 'warning');
        }

        updateDisplays(); // Update visual elements
    }

    // toggleSystem, createSystemModule, populateSystemList, startTimer remain the same
     function toggleSystem(systemId, buttonElement) { /* ... */
        if (!gameActive) return;
        const system = systemsData.find(s => s.id === systemId);
        if (!system) return;
        if (activeSystems.has(systemId)) {
            activeSystems.delete(systemId);
            buttonElement.textContent = 'Activate';
            buttonElement.classList.remove('active');
            remainingTime = Math.min(remainingTime + system.time, TIME_LIMIT);
            logMessage(`System Deactivated: ${system.name}. (+${system.time}s time recovered)`);
            calculateTotals(); // Recalculates power AND internal survival
            updateDisplays();
        } else {
            if (remainingTime >= system.time) {
                remainingTime -= system.time;
                activeSystems.add(systemId);
                buttonElement.textContent = 'Deactivate';
                buttonElement.classList.add('active');
                logMessage(`System Activated: ${system.name}. (-${system.time}s time)`);
                calculateTotals(); // Recalculates power AND internal survival
                updateDisplays();
                if (remainingTime <= 0) {
                    clearInterval(timerInterval);
                    timerDisplay.textContent = "00:00";
                    logMessage("Time expired immediately after activating last system.", "warning");
                    endGame("time");
                }
            } else {
                logMessage(`ERROR: Not enough time (${formatTime(remainingTime)}) to activate ${system.name} (${system.time}s required).`, 'error');
                buttonElement.style.backgroundColor = '#d9534f';
                setTimeout(() => {
                    if(buttonElement && !buttonElement.classList.contains('active')) {
                         buttonElement.style.backgroundColor = '#5cb85c';
                    }
                }, 500);
            }
        }
     }
    function createSystemModule(system) { /* ... */
        const div = document.createElement('div');
        div.classList.add('system-module');
        div.dataset.systemId = system.id;
        const title = document.createElement('h3');
        title.textContent = system.name;
        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('system-details');
        detailsDiv.innerHTML = `
            <p>Power: <span>${system.power} W</span></p>
            <p>Activation Time: <span>${system.time} s</span></p>
        `;
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Activate';
        if (system.time > TIME_LIMIT) {
             toggleButton.disabled = true;
             toggleButton.title = "Activation time exceeds total mission time.";
        }
        toggleButton.addEventListener('click', () => toggleSystem(system.id, toggleButton));
        div.appendChild(title);
        div.appendChild(detailsDiv);
        div.appendChild(toggleButton);
        return div;
     }
    function populateSystemList() { /* ... */
        systemListContainer.innerHTML = '';
        const shuffledSystems = shuffleArray([...systemsData]);
        shuffledSystems.forEach(system => {
            const module = createSystemModule(system);
            systemListContainer.appendChild(module);
        });
     }
    function startTimer() { /* ... */
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!gameActive) {
                clearInterval(timerInterval); return;
            }
            remainingTime--;
            updateDisplays();
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                timerDisplay.textContent = "00:00";
                logMessage("Countdown timer reached zero.", "error");
                endGame("time");
            }
        }, 1000);
     }

    // Updated handleStartReentry for probabilistic outcome
    function handleStartReentry() {
        if (!gameActive) return;
        logMessage("Attempting Reentry Sequence...", "info");
        clearInterval(timerInterval);

        // 1. Check Power
        if (currentPower > MAX_POWER) {
            endGame("power"); return;
        }

        // 2. Check Essential Systems
        let essentialMissing = false;
        let missingSystemsLog = [];
        systemsData.forEach(sys => {
            if (sys.essential && !activeSystems.has(sys.id)) {
                essentialMissing = true;
                missingSystemsLog.push(sys.name);
            }
        });
        if (essentialMissing) {
             logMessage(`CRITICAL FAILURE: Essential systems offline: ${missingSystemsLog.join(', ')}!`, "error");
             endGame("essential"); return;
        }

        // 3. Check Survival Probability AND Perform Random Roll
        logMessage(`Final check. Power: ${currentPower}W. Calculating reentry stability...`, "info");

        // If survival chance is too low, it's a definite failure.
        if (currentSurvival < 50) {
            logMessage(`Calculated survival chance (${currentSurvival}%) too low. Reentry failed.`, "error");
            endGame("failure"); // Low survival failure
        } else {
            // Survival chance is 50% or higher, perform the probabilistic check
            const roll = Math.random() * 100; // Random number between 0 and 99.99...
            logMessage(`Calculated survival chance: ${currentSurvival}%. Stability roll: ${roll.toFixed(1)}`, "info");

            if (roll < currentSurvival) {
                // --- Success Roll ---
                // Passed the probability check, now determine if it's partial or full
                if (currentSurvival >= 80) {
                    endGame("success"); // Full success
                } else {
                    endGame("partial"); // Partial success (passed roll but base chance was < 80)
                }
            } else {
                // --- Failure Roll ---
                // Failed the probability check despite calculated chance >= 50%
                 logMessage(`WARNING: Systems unstable despite calculated ${currentSurvival}% chance! Reentry failed!`, "warning");
                 endGame("failure_rng"); // Probabilistic failure
            }
        }
    }


    // Updated endGame to handle 'failure_rng'
    function endGame(reason) {
        if (!gameActive) return;
        gameActive = false;
        clearInterval(timerInterval);
        startReentryButton.disabled = true;
        startReentryButton.textContent = 'Sequence Locked';

        systemListContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);

        remainingTime = Math.max(0, remainingTime);
        updateDisplays(); // Final display update

        let title = "Mission Result";
        let message = "";
        let messageType = "info";
        let selectedImageArray;

        const isSuccess = (reason === 'success' || reason === 'partial');
        selectedImageArray = isSuccess ? successImageUrls : failureImageUrls;

        // Randomly select an image from the chosen array
        let finalImageUrl = failureImageUrls[0] || ''; // Default fallback
        if (selectedImageArray && selectedImageArray.length > 0) {
            const randomIndex = Math.floor(Math.random() * selectedImageArray.length);
            finalImageUrl = selectedImageArray[randomIndex];
        } else {
            console.error("Outcome image array missing for", reason);
        }


        // Determine title, message, and log type based on specific reason
        switch (reason) {
            case "time":
                title = "Mission Failed: Out of Time!";
                message = "The startup sequence could not be completed before the critical reentry window closed. Mission lost.";
                messageType = "error";
                break;
            case "power":
                title = "Mission Failed: Power Overload!";
                message = `System power draw (${currentPower}W) exceeded the limit (${MAX_POWER}W). Catastrophic electrical failure!`;
                messageType = "error";
                break;
             case "essential":
                title = "Mission Failed: Essential Systems Offline!";
                message = "One or more critical systems required for reentry were not activated. The spacecraft could not be controlled.";
                messageType = "error";
                break;
            case "success":
                title = "Mission Success!";
                message = `Splashdown confirmed! The calculated ${currentSurvival}% survival probability held true. Excellent work, flight!`; // Adjusted msg
                messageType = "success";
                break;
            case "partial":
                title = "Partial Success: Rough Reentry";
                message = `The crew made it back, but it was touch and go. The calculated ${currentSurvival}% survival chance was just enough. A harrowing return.`; // Adjusted msg
                messageType = "warning";
                break;
            case "failure_rng": // New case for probabilistic failure
                 title = "Mission Failed: Systems Unstable!";
                 message = `Despite a calculated ${currentSurvival}% survival chance, random fluctuations led to system instability during reentry. Mission lost.`;
                 messageType = "error";
                 break;
            case "failure": // Low survival chance (original failure case)
            default:
                title = "Mission Failed: Low Survival Probability";
                message = `The configured systems yielded only ${currentSurvival}% survival probability. The spacecraft did not survive reentry stresses.`;
                messageType = "error";
                break;
        }

        logMessage(`--- ${title} ---`, messageType);

        // Update Modal Content (including survival % for review)
        modalTitle.textContent = title;
        modalImage.src = finalImageUrl;
        modalImage.alt = title;
        modalMessage.textContent = message;
        modalPower.textContent = currentPower;
        modalTime.textContent = formatTime(remainingTime);
        modalSurvival.textContent = currentSurvival; // Show calculated value here

        modal.style.display = 'block';
    }

    // initGame needs to reset the power meter display too
    function initGame() {
        logPanel.innerHTML = '<p>Initializing mission parameters...</p>';

        currentPower = 0;
        currentSurvival = INITIAL_SURVIVAL;
        remainingTime = TIME_LIMIT;
        activeSystems.clear();
        gameActive = true;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;

        powerLimitDisplay.textContent = MAX_POWER;
        modal.style.display = 'none';
        modalImage.src = '';
        modalImage.alt = '';
        startReentryButton.disabled = false;
        startReentryButton.textContent = 'Start Reentry';
        progressBarWrapper.classList.remove('flash-red');

        // Reset Power Meter
        powerMeterBar.value = 0;
        powerMeterText.textContent = `0 / ${MAX_POWER} W`;
        powerMeterBar.classList.remove('power-ok', 'power-warning', 'power-critical');
        powerMeterBar.classList.add('power-ok');
        powerMeterText.style.color = '#ccc';


        populateSystemList();
        calculateTotals(); // Includes internal survival calculation
        updateDisplays(); // Update power meter etc.
        startTimer();

        logMessage("Houston, we have a problem. Configure systems for emergency startup.", "info");
        logMessage(`Power limit: ${MAX_POWER}W. Time remaining: ${formatTime(TIME_LIMIT)}.`, "info");
    }

    // --- Event Listeners ---
    startReentryButton.addEventListener('click', handleStartReentry);
    playAgainButton.addEventListener('click', initGame);

    // --- Initial Game Start ---
    initGame();

}); // End DOMContentLoaded
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.shuffleArray = shuffleArray;
}

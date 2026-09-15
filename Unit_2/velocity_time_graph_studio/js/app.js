/**
 * Velocity-Time Graph Studio (v-t Studio)
 * Comprehensive physics kinematics engine, interactive v-t graphing canvas with draggable keyframe waypoints,
 * real-time 1D motion visualizer with vector overlays, strobe / oil-drop trail drops,
 * integrated position-time (x-t) drawer, and live diagnostic concept explanations.
 *
 * Strict Compliance:
 * - NO LaTeX (uses Unicode & HTML: Δv/Δt, m/s², m/s, m, ½at², etc.)
 * - Pointer Events API with touch-action: none & getBoundingClientRect for flawless iPad / Safari / mobile support
 * - Dynamic DPI canvas scaling
 */

(function () {
    'use strict';

    // --- Sound Effects System (Web Audio API) ---
    class SoundFX {
        constructor() {
            this.ctx = null;
            this.muted = false;
        }

        init() {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.ctx = new AudioContext();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playTone(freq, duration, type = 'sine', gainVal = 0.08) {
            if (this.muted) return;
            try {
                this.init();
                if (!this.ctx) return;
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
                // Ignore audio context errors
            }
        }

        playBlip() {
            this.playTone(600, 0.05, 'sine', 0.05);
        }

        playSnap() {
            this.playTone(850, 0.07, 'triangle', 0.09);
        }

        playReverse() {
            this.playTone(280, 0.15, 'sawtooth', 0.06);
        }

        playClick() {
            this.playTone(420, 0.04, 'sine', 0.04);
        }
    }

    const sound = new SoundFX();

    // --- Presets Definition ---
    const PRESETS = {
        constant: {
            title: 'Constant Velocity (a = 0)',
            desc: 'The object travels forward at a steady 6.0 m/s for the full 10 seconds. The line is completely flat (slope = 0 m/s²), resulting in a steady linear increase in position (Δx = 60 m).',
            keyframes: [
                { t: 0, v: 6 },
                { t: 10, v: 6 }
            ],
            notes: 'A horizontal line on a v-t graph represents zero acceleration. The object covers equal distances in equal time intervals, demonstrated by uniformly spaced strobe dots.'
        },
        speedup: {
            title: 'Speeding Up from Rest (Uniform Acceleration)',
            desc: 'Starting stationary (v = 0 m/s), the vehicle accelerates steadily at +2.5 m/s² for 4 seconds until reaching 10 m/s, then cruises at 10 m/s.',
            keyframes: [
                { t: 0, v: 0 },
                { t: 4, v: 10 },
                { t: 10, v: 10 }
            ],
            notes: 'A positive slope means positive acceleration. Notice how the strobe markers spread further apart each second as speed increases. Shaded triangular area = ½(4 s)(10 m/s) = 20 m.'
        },
        slowdown: {
            title: 'Slowing Down / Braking to a Stop',
            desc: 'Cruising initially at +8.0 m/s, the vehicle hits the brakes with a constant acceleration of -2.0 m/s², coming to a full halt at t = 4 s and resting until t = 10 s.',
            keyframes: [
                { t: 0, v: 8 },
                { t: 4, v: 0 },
                { t: 10, v: 0 }
            ],
            notes: 'A negative slope with positive velocity means the object is moving forward but slowing down (velocity vector points right, acceleration vector points left). The strobe dots get progressively closer together.'
        },
        trip: {
            title: 'Three-Phase Trip (Speed Up, Cruise, Brake)',
            desc: 'A classic stoplight-to-stoplight trip: accelerates from rest to 6 m/s in 3 s, cruises at 6 m/s for 4 s, then decelerates smoothly to rest in 3 s.',
            keyframes: [
                { t: 0, v: 0 },
                { t: 3, v: 6 },
                { t: 7, v: 6 },
                { t: 10, v: 0 }
            ],
            notes: 'Phase 1: positive slope (speeding up, a = +2.0 m/s²). Phase 2: zero slope (constant speed, a = 0). Phase 3: negative slope (slowing down, a = -2.0 m/s²). The area under the curve is a trapezoid: Δx = 9 + 24 + 9 = 42 m.'
        },
        reversal: {
            title: 'Ramp / Direction Reversal (Crossing v = 0)',
            desc: 'Moving forward at +6.0 m/s, the object undergoes a constant negative acceleration of -2.0 m/s². At t = 3.0 s, velocity momentarily hits 0 m/s, then reverses backward into negative velocity (-6.0 m/s).',
            keyframes: [
                { t: 0, v: 6 },
                { t: 6, v: -6 },
                { t: 10, v: -6 }
            ],
            notes: 'Crucial concept: crossing the horizontal v = 0 axis signifies an instantaneous change in direction! Area above v = 0 axis (+9 m) represents positive forward displacement; area below (-9 m) represents negative backward displacement. Net displacement at t = 6 s is 0 m!'
        },
        sandbox: {
            title: 'Complex Multi-Segment Motion',
            desc: 'A complex multi-stage journey with forward acceleration, cruising, hard braking into reverse motion, and stopping.',
            keyframes: [
                { t: 0, v: 0 },
                { t: 2, v: 5 },
                { t: 5, v: 5 },
                { t: 8, v: -3 },
                { t: 10, v: 0 }
            ],
            notes: 'Inspect each segment slope to find acceleration (a = Δv / Δt). Notice how the vehicle changes direction at t = 6.875 s when the line crosses the horizontal axis!'
        }
    };

    // --- Main Studio Application Controller ---
    class VTStudioApp {
        constructor() {
            // Canvases
            this.vtCanvas = document.getElementById('vtCanvas');
            this.trackCanvas = document.getElementById('trackCanvas');
            this.xtCanvas = document.getElementById('xtCanvas');

            this.vtCtx = this.vtCanvas.getContext('2d');
            this.trackCtx = this.trackCanvas.getContext('2d');
            this.xtCtx = this.xtCanvas ? this.xtCanvas.getContext('2d') : null;

            // Loupe elements
            this.loupeEl = document.getElementById('opticalLoupe');
            this.loupeValEl = document.getElementById('loupeValue');

            // Playback state
            this.currentTime = 0; // seconds [0, 10]
            this.isPlaying = false;
            this.playSpeed = 1.0;
            this.lastFrameTimestamp = null;
            this.animFrameId = null;

            // Kinematic Graph Boundaries
            this.tMin = 0;
            this.tMax = 10;
            this.vMin = -10;
            this.vMax = 10;

            // Draggable Keyframes: array of { t, v, id }
            this.keyframes = [];
            this.nextKeyframeId = 1;
            this.activePresetKey = 'constant';

            // Interaction state for vtCanvas
            this.draggedIndex = -1;
            this.hoveredIndex = -1;
            this.pointerDownPos = null;
            this.isDraggingTimeScrubber = false;

            // Visualizer Options
            this.showVectors = true;
            this.showStrobes = true;
            this.showArea = true;
            this.snapToGrid = true;
            this.strobeInterval = 0.5; // seconds
            this.strobeMarkers = []; // cached list of { t, x, v }

            // Dynamic layout rects (computed in resize)
            this.vtPlotRect = { x: 60, y: 30, width: 700, height: 360 };
            this.trackRect = { x: 50, y: 30, width: 720, height: 160 };
            this.xtPlotRect = { x: 60, y: 25, width: 700, height: 170 };

            this.initDOMRefs();
            this.bindEvents();
            this.loadPreset('constant');
            this.handleResize();
            this.startLoop();
        }

        initDOMRefs() {
            // Telemetry badges
            this.badgeTime = document.getElementById('badgeTime');
            this.badgeVelocity = document.getElementById('badgeVelocity');
            this.badgeAcceleration = document.getElementById('badgeAcceleration');
            this.badgePosition = document.getElementById('badgePosition');
            this.badgeDistance = document.getElementById('badgeDistance');
            this.motionStateBadge = document.getElementById('motionStateBadge');

            // Scrubber controls
            this.playPauseBtn = document.getElementById('playPauseBtn');
            this.playIcon = document.getElementById('playIcon');
            this.pauseIcon = document.getElementById('pauseIcon');
            this.timeScrubber = document.getElementById('timeScrubber');
            this.scrubberTimeLabel = document.getElementById('scrubberTimeLabel');
            this.speedBtn = document.getElementById('speedBtn');
            this.resetBtn = document.getElementById('resetBtn');
            this.jumpStartBtn = document.getElementById('jumpStartBtn');
            this.jumpEndBtn = document.getElementById('jumpEndBtn');

            // Preset Buttons
            this.presetButtons = document.querySelectorAll('.preset-pill');

            // Waypoints Table Body
            this.waypointsTableBody = document.getElementById('waypointsTableBody');
            this.addWaypointBtn = document.getElementById('addWaypointBtn');
            this.resetWaypointsBtn = document.getElementById('resetWaypointsBtn');

            // Toggles
            this.toggleAreaShading = document.getElementById('toggleAreaShading');
            this.toggleVectors = document.getElementById('toggleVectors');
            this.toggleStrobes = document.getElementById('toggleStrobes');
            this.toggleSnap = document.getElementById('toggleSnap');
            this.clearStrobesBtn = document.getElementById('clearStrobesBtn');

            // Theme toggle
            this.themeToggleBtn = document.getElementById('themeToggleBtn');
            this.soundToggleBtn = document.getElementById('soundToggleBtn');

            // Concept Callout
            this.conceptTitle = document.getElementById('conceptTitle');
            this.conceptDescription = document.getElementById('conceptDescription');
            this.conceptNotes = document.getElementById('conceptNotes');

            // Area breakdown
            this.areaPosValue = document.getElementById('areaPosValue');
            this.areaNegValue = document.getElementById('areaNegValue');
            this.netDispValue = document.getElementById('netDispValue');

            // Collapsible XT drawer
            this.toggleXtDrawerBtn = document.getElementById('toggleXtDrawerBtn');
            this.xtDrawerContainer = document.getElementById('xtDrawerContainer');
        }

        bindEvents() {
            // Window resize
            window.addEventListener('resize', () => this.handleResize());

            // Play / Pause
            this.playPauseBtn.addEventListener('click', () => {
                sound.init();
                this.togglePlay();
            });

            // Scrubber input
            this.timeScrubber.addEventListener('input', (e) => {
                this.currentTime = parseFloat(e.target.value);
                this.updateUI();
            });

            // Jump Buttons
            this.jumpStartBtn.addEventListener('click', () => {
                sound.playClick();
                this.setTime(0);
            });
            this.jumpEndBtn.addEventListener('click', () => {
                sound.playClick();
                this.setTime(this.tMax);
            });
            this.resetBtn.addEventListener('click', () => {
                sound.playClick();
                this.setTime(0);
                if (this.isPlaying) this.togglePlay();
            });

            // Speed cycle
            this.speedBtn.addEventListener('click', () => {
                sound.playClick();
                if (this.playSpeed === 1.0) {
                    this.playSpeed = 0.5;
                } else if (this.playSpeed === 0.5) {
                    this.playSpeed = 0.25;
                } else if (this.playSpeed === 0.25) {
                    this.playSpeed = 2.0;
                } else {
                    this.playSpeed = 1.0;
                }
                this.speedBtn.textContent = `${this.playSpeed}x Speed`;
            });

            // Presets
            this.presetButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const presetKey = btn.getAttribute('data-preset');
                    this.loadPreset(presetKey);
                });
            });

            // Add Waypoint
            this.addWaypointBtn.addEventListener('click', () => {
                this.addNewWaypoint();
            });
            this.resetWaypointsBtn.addEventListener('click', () => {
                sound.playClick();
                this.loadPreset(this.activePresetKey);
            });

            // Toggles
            this.toggleAreaShading.addEventListener('change', (e) => {
                this.showArea = e.target.checked;
            });
            this.toggleVectors.addEventListener('change', (e) => {
                this.showVectors = e.target.checked;
            });
            this.toggleStrobes.addEventListener('change', (e) => {
                this.showStrobes = e.target.checked;
            });
            this.toggleSnap.addEventListener('change', (e) => {
                this.snapToGrid = e.target.checked;
            });
            this.clearStrobesBtn.addEventListener('click', () => {
                sound.playClick();
                this.strobeMarkers = [];
            });

            // Sound Toggle
            this.soundToggleBtn.addEventListener('click', () => {
                sound.muted = !sound.muted;
                const icon = this.soundToggleBtn.querySelector('.sound-icon');
                if (icon) {
                    icon.textContent = sound.muted ? '🔇' : '🔊';
                }
                this.soundToggleBtn.classList.toggle('active', !sound.muted);
                if (!sound.muted) sound.playClick();
            });

            // Theme Toggle
            this.themeToggleBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', nextTheme);
                sound.playClick();
            });

            // Collapsible XT Drawer
            if (this.toggleXtDrawerBtn && this.xtDrawerContainer) {
                this.toggleXtDrawerBtn.addEventListener('click', () => {
                    sound.playClick();
                    const isCollapsed = this.xtDrawerContainer.classList.toggle('collapsed');
                    this.toggleXtDrawerBtn.classList.toggle('active', !isCollapsed);
                    const label = this.toggleXtDrawerBtn.querySelector('.btn-label');
                    if (label) {
                        label.textContent = isCollapsed ? 'Show Position (x-t) Graph' : 'Hide Position (x-t) Graph';
                    }
                    setTimeout(() => this.handleResize(), 50);
                });
            }

            // Keyboard Shortcuts
            window.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT') return;
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.togglePlay();
                } else if (e.code === 'ArrowLeft') {
                    e.preventDefault();
                    this.setTime(Math.max(0, this.currentTime - (e.shiftKey ? 1.0 : 0.1)));
                } else if (e.code === 'ArrowRight') {
                    e.preventDefault();
                    this.setTime(Math.min(this.tMax, this.currentTime + (e.shiftKey ? 1.0 : 0.1)));
                } else if (e.code === 'KeyR') {
                    this.setTime(0);
                }
            });

            // Canvas Pointer Interaction for vtCanvas
            this.initCanvasPointerEvents();
        }

        // --- Responsive Canvas Resizing ---
        handleResize() {
            const dpr = window.devicePixelRatio || 1;

            // Resize v-t Canvas
            const vtRect = this.vtCanvas.parentElement.getBoundingClientRect();
            const vtWidth = Math.max(320, vtRect.width);
            const vtHeight = Math.max(280, Math.min(420, window.innerHeight * 0.45));
            this.vtCanvas.width = vtWidth * dpr;
            this.vtCanvas.height = vtHeight * dpr;
            this.vtCanvas.style.width = `${vtWidth}px`;
            this.vtCanvas.style.height = `${vtHeight}px`;
            this.vtCtx.resetTransform();
            this.vtCtx.scale(dpr, dpr);
            this.vtPlotRect = {
                x: 65,
                y: 25,
                width: vtWidth - 90,
                height: vtHeight - 55
            };

            // Resize Track Canvas
            const trackRect = this.trackCanvas.parentElement.getBoundingClientRect();
            const trackWidth = Math.max(320, trackRect.width);
            const trackHeight = 160;
            this.trackCanvas.width = trackWidth * dpr;
            this.trackCanvas.height = trackHeight * dpr;
            this.trackCanvas.style.width = `${trackWidth}px`;
            this.trackCanvas.style.height = `${trackHeight}px`;
            this.trackCtx.resetTransform();
            this.trackCtx.scale(dpr, dpr);
            this.trackRect = {
                x: 55,
                y: 20,
                width: trackWidth - 110,
                height: trackHeight - 40
            };

            // Resize x-t Canvas if open
            if (this.xtCanvas && this.xtDrawerContainer && !this.xtDrawerContainer.classList.contains('collapsed')) {
                const xtRect = this.xtCanvas.parentElement.getBoundingClientRect();
                const xtWidth = Math.max(320, xtRect.width);
                const xtHeight = 220;
                this.xtCanvas.width = xtWidth * dpr;
                this.xtCanvas.height = xtHeight * dpr;
                this.xtCanvas.style.width = `${xtWidth}px`;
                this.xtCanvas.style.height = `${xtHeight}px`;
                this.xtCtx.resetTransform();
                this.xtCtx.scale(dpr, dpr);
                this.xtPlotRect = {
                    x: 65,
                    y: 25,
                    width: xtWidth - 90,
                    height: xtHeight - 55
                };
            }

            this.render();
        }

        // --- Preset Management ---
        loadPreset(presetKey) {
            const preset = PRESETS[presetKey];
            if (!preset) return;

            this.activePresetKey = presetKey;

            // Highlight preset button
            this.presetButtons.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-preset') === presetKey);
            });

            // Clone keyframes
            this.keyframes = preset.keyframes.map((kf, index) => ({
                id: index + 1,
                t: Number(kf.t),
                v: Number(kf.v)
            }));
            this.nextKeyframeId = this.keyframes.length + 1;
            this.sortKeyframes();

            // Update Concept description
            if (this.conceptTitle) this.conceptTitle.textContent = preset.title;
            if (this.conceptDescription) this.conceptDescription.textContent = preset.desc;
            if (this.conceptNotes) this.conceptNotes.textContent = preset.notes;

            // Reset motion state
            this.strobeMarkers = [];
            this.setTime(0);
            this.rebuildWaypointsTable();
            sound.playSnap();
        }

        // --- Waypoints Model & Table Synchronization ---
        sortKeyframes() {
            this.keyframes.sort((a, b) => a.t - b.t);
            // Ensure first is always at t=0 and last is at t=10
            if (this.keyframes.length > 0) {
                this.keyframes[0].t = 0;
                this.keyframes[this.keyframes.length - 1].t = 10;
            }
        }

        addNewWaypoint() {
            sound.playClick();
            // Find the widest time gap to insert a new waypoint
            let maxGap = 0;
            let insertIndex = 0;
            for (let i = 0; i < this.keyframes.length - 1; i++) {
                const gap = this.keyframes[i + 1].t - this.keyframes[i].t;
                if (gap > maxGap) {
                    maxGap = gap;
                    insertIndex = i;
                }
            }

            if (maxGap < 1.0) {
                alert('Maximum waypoint density reached. Delete or move existing waypoints to add new ones.');
                return;
            }

            const tNew = Math.round((this.keyframes[insertIndex].t + this.keyframes[insertIndex + 1].t) / 2 * 2) / 2;
            const vNew = Math.round((this.keyframes[insertIndex].v + this.keyframes[insertIndex + 1].v) / 2);

            this.keyframes.splice(insertIndex + 1, 0, {
                id: this.nextKeyframeId++,
                t: tNew,
                v: vNew
            });

            this.sortKeyframes();
            this.rebuildWaypointsTable();
            this.updateUI();
        }

        deleteWaypoint(index) {
            if (this.keyframes.length <= 2) {
                alert('A velocity graph must have at least two keyframe points (start and end).');
                return;
            }
            if (index === 0 || index === this.keyframes.length - 1) {
                alert('Start (t = 0s) and End (t = 10s) waypoints cannot be deleted.');
                return;
            }
            sound.playClick();
            this.keyframes.splice(index, 1);
            this.sortKeyframes();
            this.rebuildWaypointsTable();
            this.updateUI();
        }

        rebuildWaypointsTable() {
            if (!this.waypointsTableBody) return;
            this.waypointsTableBody.innerHTML = '';

            this.keyframes.forEach((kf, index) => {
                const tr = document.createElement('tr');
                if (index === this.draggedIndex || index === this.hoveredIndex) {
                    tr.classList.add('active-row');
                }

                // Point Label
                const tdName = document.createElement('td');
                tdName.innerHTML = `<span class="point-tag">P${index + 1}</span>`;
                tr.appendChild(tdName);

                // Time Input
                const tdTime = document.createElement('td');
                const timeInput = document.createElement('input');
                timeInput.type = 'number';
                timeInput.className = 'table-input';
                timeInput.min = '0';
                timeInput.max = '10';
                timeInput.step = '0.5';
                timeInput.value = kf.t.toFixed(1);
                if (index === 0 || index === this.keyframes.length - 1) {
                    timeInput.disabled = true;
                    timeInput.title = index === 0 ? 'Start time fixed at 0.0 s' : 'End time fixed at 10.0 s';
                } else {
                    timeInput.addEventListener('change', (e) => {
                        const val = parseFloat(e.target.value);
                        const prevT = this.keyframes[index - 1].t + 0.5;
                        const nextT = this.keyframes[index + 1].t - 0.5;
                        const clamped = Math.min(nextT, Math.max(prevT, val));
                        kf.t = clamped;
                        timeInput.value = clamped.toFixed(1);
                        this.sortKeyframes();
                        this.updateUI();
                    });
                }
                tdTime.appendChild(timeInput);
                tr.appendChild(tdTime);

                // Velocity Input
                const tdVel = document.createElement('td');
                const velInput = document.createElement('input');
                velInput.type = 'number';
                velInput.className = 'table-input';
                velInput.min = '-10';
                velInput.max = '10';
                velInput.step = '0.5';
                velInput.value = kf.v.toFixed(1);
                velInput.addEventListener('change', (e) => {
                    const val = parseFloat(e.target.value);
                    const clamped = Math.min(10, Math.max(-10, val));
                    kf.v = clamped;
                    velInput.value = clamped.toFixed(1);
                    this.updateUI();
                });
                tdVel.appendChild(velInput);
                tr.appendChild(tdVel);

                // Actions
                const tdAction = document.createElement('td');
                if (index > 0 && index < this.keyframes.length - 1) {
                    const delBtn = document.createElement('button');
                    delBtn.className = 'btn-delete-point';
                    delBtn.innerHTML = '✕';
                    delBtn.title = 'Delete Waypoint';
                    delBtn.addEventListener('click', () => this.deleteWaypoint(index));
                    tdAction.appendChild(delBtn);
                } else {
                    tdAction.innerHTML = `<span class="lock-indicator" title="Anchor point">🔒</span>`;
                }
                tr.appendChild(tdAction);

                this.waypointsTableBody.appendChild(tr);
            });
        }

        // --- Physics Kinematics Calculations ---
        /**
         * Returns instantaneous velocity v(t), acceleration a(t), position x(t),
         * total signed area, total distance traveled, and current segment acceleration.
         */
        getKinematicStateAt(t) {
            const clampedT = Math.max(0, Math.min(this.tMax, t));
            let totalX = 0;
            let totalDist = 0;
            let positiveArea = 0;
            let negativeArea = 0;

            let currentV = this.keyframes[0].v;
            let currentA = 0;
            let segmentFound = false;

            // Iterate through every segment to integrate displacement and distance
            for (let i = 0; i < this.keyframes.length - 1; i++) {
                const kf1 = this.keyframes[i];
                const kf2 = this.keyframes[i + 1];
                const dtSegment = kf2.t - kf1.t;
                if (dtSegment <= 0) continue;

                const aSegment = (kf2.v - kf1.v) / dtSegment;

                if (!segmentFound) {
                    if (clampedT >= kf1.t && (clampedT <= kf2.t || i === this.keyframes.length - 2)) {
                        const dtLocal = clampedT - kf1.t;
                        currentA = aSegment;
                        currentV = kf1.v + aSegment * dtLocal;
                        segmentFound = true;
                    }
                }

                // Integration up to clampedT
                const dtIntegrate = Math.max(0, Math.min(dtSegment, clampedT - kf1.t));
                if (dtIntegrate > 0) {
                    const vStart = kf1.v;
                    const vEnd = vStart + aSegment * dtIntegrate;
                    const dx = vStart * dtIntegrate + 0.5 * aSegment * dtIntegrate * dtIntegrate;
                    totalX += dx;

                    // Distance and area breakdown
                    if ((vStart >= 0 && vEnd >= 0) || (vStart <= 0 && vEnd <= 0)) {
                        // Same sign segment
                        const area = 0.5 * (vStart + vEnd) * dtIntegrate;
                        if (vStart >= 0) positiveArea += area;
                        else negativeArea += Math.abs(area);
                        totalDist += Math.abs(dx);
                    } else {
                        // Segment crosses v = 0 axis! Find crossover time tc
                        // 0 = vStart + aSegment * dtCross
                        const dtCross = Math.abs(vStart / aSegment);
                        const dx1 = 0.5 * vStart * dtCross;
                        const vFinal = vStart + aSegment * dtIntegrate;
                        const dtRemain = dtIntegrate - dtCross;
                        const dx2 = 0.5 * vFinal * dtRemain;

                        if (vStart > 0) {
                            positiveArea += dx1;
                            negativeArea += Math.abs(dx2);
                        } else {
                            negativeArea += Math.abs(dx1);
                            positiveArea += dx2;
                        }
                        totalDist += Math.abs(dx1) + Math.abs(dx2);
                    }
                }
            }

            return {
                t: clampedT,
                v: currentV,
                a: currentA,
                x: totalX,
                distance: totalDist,
                positiveArea: positiveArea,
                negativeArea: negativeArea,
                netDisplacement: totalX
            };
        }

        /**
         * Computes full trajectory path points for position-time curve
         */
        computePositionTrajectory(samples = 200) {
            const points = [];
            let minX = 0;
            let maxX = 0;

            for (let i = 0; i <= samples; i++) {
                const t = (i / samples) * this.tMax;
                const state = this.getKinematicStateAt(t);
                points.push({ t: state.t, x: state.x, v: state.v, a: state.a });
                if (state.x < minX) minX = state.x;
                if (state.x > maxX) maxX = state.x;
            }

            return { points, minX, maxX };
        }

        // --- Coordinate Conversions ---
        tToVtPx(t) {
            const frac = (t - this.tMin) / (this.tMax - this.tMin);
            return this.vtPlotRect.x + frac * this.vtPlotRect.width;
        }

        vToVtPy(v) {
            // Inverted Y: vMax at top, vMin at bottom
            const frac = (v - this.vMin) / (this.vMax - this.vMin);
            return this.vtPlotRect.y + (1 - frac) * this.vtPlotRect.height;
        }

        vtPxToT(px) {
            const frac = (px - this.vtPlotRect.x) / this.vtPlotRect.width;
            return this.tMin + frac * (this.tMax - this.tMin);
        }

        vtPyToV(py) {
            const frac = 1 - (py - this.vtPlotRect.y) / this.vtPlotRect.height;
            return this.vMin + frac * (this.vMax - this.vMin);
        }

        // Track X coordinate conversion (maps x meters to track canvas pixels)
        xToTrackPx(x, minX = -10, maxX = 70) {
            const range = Math.max(20, maxX - minX);
            const frac = (x - minX) / range;
            return this.trackRect.x + frac * this.trackRect.width;
        }

        // --- Unified Pointer Events & Draggable Reticle ---
        initCanvasPointerEvents() {
            const canvas = this.vtCanvas;

            const getCanvasCoords = (e) => {
                const rect = canvas.getBoundingClientRect();
                return {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    clientX: e.clientX,
                    clientY: e.clientY
                };
            };

            const findHitKeyframe = (px, py, threshold = 26) => {
                for (let i = 0; i < this.keyframes.length; i++) {
                    const kf = this.keyframes[i];
                    const kfPx = this.tToVtPx(kf.t);
                    const kfPy = this.vToVtPy(kf.v);
                    const dist = Math.hypot(px - kfPx, py - kfPy);
                    if (dist <= threshold) {
                        return i;
                    }
                }
                return -1;
            };

            canvas.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                canvas.setPointerCapture(e.pointerId);
                const coords = getCanvasCoords(e);
                sound.init();

                const hitIndex = findHitKeyframe(coords.x, coords.y, 32);
                if (hitIndex !== -1) {
                    this.draggedIndex = hitIndex;
                    this.pointerDownPos = coords;
                    this.showLoupe(coords.clientX, coords.clientY, this.keyframes[hitIndex]);
                    sound.playSnap();
                    this.render();
                } else {
                    // Clicking elsewhere sets the current time scrubber
                    const clickedT = Math.max(0, Math.min(this.tMax, this.vtPxToT(coords.x)));
                    this.isDraggingTimeScrubber = true;
                    this.setTime(clickedT);
                    sound.playBlip();
                }
            });

            canvas.addEventListener('pointermove', (e) => {
                const coords = getCanvasCoords(e);

                if (this.draggedIndex !== -1) {
                    e.preventDefault();
                    const kf = this.keyframes[this.draggedIndex];
                    let rawT = this.vtPxToT(coords.x);
                    let rawV = this.vtPyToV(coords.y);

                    // Clamp to domain & range
                    let clampedV = Math.min(this.vMax, Math.max(this.vMin, rawV));
                    let clampedT = rawT;

                    // Fixed boundary rules
                    if (this.draggedIndex === 0) {
                        clampedT = 0;
                    } else if (this.draggedIndex === this.keyframes.length - 1) {
                        clampedT = 10;
                    } else {
                        // Constrain between adjacent waypoints with 0.2s margin
                        const minT = this.keyframes[this.draggedIndex - 1].t + 0.2;
                        const maxT = this.keyframes[this.draggedIndex + 1].t - 0.2;
                        clampedT = Math.min(maxT, Math.max(minT, clampedT));
                    }

                    // Grid snap if enabled
                    if (this.snapToGrid) {
                        clampedV = Math.round(clampedV * 2) / 2; // snap to 0.5 m/s
                        if (this.draggedIndex > 0 && this.draggedIndex < this.keyframes.length - 1) {
                            clampedT = Math.round(clampedT * 2) / 2; // snap to 0.5 s
                        }
                    }

                    kf.t = clampedT;
                    kf.v = clampedV;

                    this.showLoupe(coords.clientX, coords.clientY, kf);
                    this.updateUI();
                } else if (this.isDraggingTimeScrubber) {
                    e.preventDefault();
                    const clickedT = Math.max(0, Math.min(this.tMax, this.vtPxToT(coords.x)));
                    this.setTime(clickedT);
                } else {
                    // Hover highlight check
                    const hit = findHitKeyframe(coords.x, coords.y, 20);
                    if (hit !== this.hoveredIndex) {
                        this.hoveredIndex = hit;
                        canvas.style.cursor = hit !== -1 ? 'grab' : 'crosshair';
                        this.render();
                    }
                }
            });

            const handlePointerUp = (e) => {
                if (this.draggedIndex !== -1) {
                    try {
                        canvas.releasePointerCapture(e.pointerId);
                    } catch (err) {}
                    this.draggedIndex = -1;
                    this.hideLoupe();
                    this.rebuildWaypointsTable();
                    sound.playSnap();
                    this.render();
                }
                this.isDraggingTimeScrubber = false;
            };

            canvas.addEventListener('pointerup', handlePointerUp);
            canvas.addEventListener('pointercancel', handlePointerUp);
            canvas.addEventListener('pointerleave', () => {
                if (this.draggedIndex === -1) {
                    this.hoveredIndex = -1;
                    this.hideLoupe();
                    this.render();
                }
            });
        }

        showLoupe(clientX, clientY, kf) {
            if (!this.loupeEl) return;
            const offsetX = 0;
            const offsetY = -80; // elevated above touch finger / mouse cursor
            this.loupeEl.style.display = 'flex';
            this.loupeEl.style.left = `${clientX + offsetX}px`;
            this.loupeEl.style.top = `${clientY + offsetY}px`;

            if (this.loupeValEl) {
                this.loupeValEl.textContent = `t = ${kf.t.toFixed(1)} s | v = ${kf.v >= 0 ? '+' : ''}${kf.v.toFixed(1)} m/s`;
            }
        }

        hideLoupe() {
            if (this.loupeEl) {
                this.loupeEl.style.display = 'none';
            }
        }

        // --- Playback Engine ---
        togglePlay() {
            this.isPlaying = !this.isPlaying;
            if (this.isPlaying) {
                if (this.currentTime >= this.tMax) {
                    this.currentTime = 0;
                    this.strobeMarkers = [];
                }
                this.playIcon.style.display = 'none';
                this.pauseIcon.style.display = 'inline';
                this.playPauseBtn.classList.add('playing');
                sound.playBlip();
            } else {
                this.playIcon.style.display = 'inline';
                this.pauseIcon.style.display = 'none';
                this.playPauseBtn.classList.remove('playing');
            }
        }

        setTime(t) {
            this.currentTime = Math.max(0, Math.min(this.tMax, t));
            this.updateUI();
        }

        startLoop() {
            const frame = (timestamp) => {
                if (!this.lastFrameTimestamp) this.lastFrameTimestamp = timestamp;
                const dtReal = (timestamp - this.lastFrameTimestamp) / 1000;
                this.lastFrameTimestamp = timestamp;

                if (this.isPlaying) {
                    const dtSim = dtReal * this.playSpeed;
                    const prevT = this.currentTime;
                    this.currentTime += dtSim;

                    // Strobe trail drop check: check every 0.5s boundary
                    if (this.showStrobes) {
                        const prevStep = Math.floor(prevT / this.strobeInterval);
                        const currStep = Math.floor(this.currentTime / this.strobeInterval);
                        if (currStep > prevStep) {
                            for (let s = prevStep + 1; s <= currStep; s++) {
                                const stT = s * this.strobeInterval;
                                if (stT <= this.tMax) {
                                    const state = this.getKinematicStateAt(stT);
                                    this.strobeMarkers.push({
                                        t: stT,
                                        x: state.x,
                                        v: state.v
                                    });
                                }
                            }
                        }
                    }

                    if (this.currentTime >= this.tMax) {
                        this.currentTime = this.tMax;
                        this.togglePlay();
                        sound.playSnap();
                    }

                    this.updateUI();
                }

                this.render();
                this.animFrameId = requestAnimationFrame(frame);
            };

            this.animFrameId = requestAnimationFrame(frame);
        }

        updateUI() {
            // Update scrubber input value
            if (this.timeScrubber) {
                this.timeScrubber.value = this.currentTime.toFixed(2);
            }
            if (this.scrubberTimeLabel) {
                this.scrubberTimeLabel.textContent = `${this.currentTime.toFixed(2)} s`;
            }

            // Kinematics at current time
            const state = this.getKinematicStateAt(this.currentTime);

            if (this.badgeTime) this.badgeTime.textContent = `${state.t.toFixed(2)} s`;
            if (this.badgeVelocity) this.badgeVelocity.textContent = `${state.v >= 0 ? '+' : ''}${state.v.toFixed(2)} m/s`;
            if (this.badgeAcceleration) this.badgeAcceleration.textContent = `${state.a >= 0 ? '+' : ''}${state.a.toFixed(2)} m/s²`;
            if (this.badgePosition) this.badgePosition.textContent = `${state.x >= 0 ? '+' : ''}${state.x.toFixed(2)} m`;
            if (this.badgeDistance) this.badgeDistance.textContent = `${state.distance.toFixed(2)} m`;

            // Area breakdown
            if (this.areaPosValue) this.areaPosValue.textContent = `+${state.positiveArea.toFixed(1)} m`;
            if (this.areaNegValue) this.areaNegValue.textContent = `-${state.negativeArea.toFixed(1)} m`;
            if (this.netDispValue) this.netDispValue.textContent = `${state.netDisplacement >= 0 ? '+' : ''}${state.netDisplacement.toFixed(1)} m`;

            // State Badge Classification
            if (this.motionStateBadge) {
                let statusText = 'Stationary (At Rest)';
                let statusClass = 'state-stopped';

                const eps = 0.05;
                if (Math.abs(state.v) < eps && Math.abs(state.a) < eps) {
                    statusText = 'At Rest (v = 0, a = 0)';
                    statusClass = 'state-stopped';
                } else if (Math.abs(state.a) < eps) {
                    statusText = `Constant Velocity (${state.v > 0 ? 'Forward ➔' : 'Backward ⬅'})`;
                    statusClass = 'state-constant';
                } else if ((state.v > eps && state.a > eps) || (state.v < -eps && state.a < -eps)) {
                    statusText = `Speeding Up (${state.v > 0 ? 'Forward ➔' : 'Backward ⬅'})`;
                    statusClass = 'state-speeding';
                } else if ((state.v > eps && state.a < -eps) || (state.v < -eps && state.a > eps)) {
                    statusText = `Slowing Down (Decelerating)`;
                    statusClass = 'state-slowing';
                } else if (Math.abs(state.v) < eps && Math.abs(state.a) >= eps) {
                    statusText = `Instantaneous Turnaround Point (v = 0)`;
                    statusClass = 'state-reversing';
                }

                this.motionStateBadge.textContent = statusText;
                this.motionStateBadge.className = `motion-state-badge ${statusClass}`;
            }
        }

        // --- Canvas Rendering Orchestration ---
        render() {
            this.renderVTGraph();
            this.renderTrackVisualizer();
            if (this.xtCanvas && this.xtDrawerContainer && !this.xtDrawerContainer.classList.contains('collapsed')) {
                this.renderXTGraph();
            }
        }

        // --- Render 1: Velocity vs Time Graph (vtCanvas) ---
        renderVTGraph() {
            const ctx = this.vtCtx;
            const w = this.vtCanvas.width / (window.devicePixelRatio || 1);
            const h = this.vtCanvas.height / (window.devicePixelRatio || 1);
            const rect = this.vtPlotRect;

            ctx.clearRect(0, 0, w, h);

            // Background grid & axes
            this.drawVTGrid(ctx, rect);

            // Shaded Integral Area (Displacement)
            if (this.showArea) {
                this.drawVTAreaShading(ctx, rect);
            }

            // Continuous Line Plot
            this.drawVTPath(ctx, rect);

            // Current Time Playhead Scrubber Line
            this.drawVTPlayhead(ctx, rect);

            // Interactive Waypoint Dots & Reticles
            this.drawVTWaypoints(ctx, rect);
        }

        drawVTGrid(ctx, rect) {
            ctx.save();

            // Background fills
            ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

            ctx.lineWidth = 1;

            // Vertical Gridlines (Time: every 1.0 s, subtle at 0.5 s)
            for (let t = this.tMin; t <= this.tMax; t += 0.5) {
                const px = this.tToVtPx(t);
                const isMajor = Math.abs(t % 1) < 0.01;

                ctx.beginPath();
                ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)';
                ctx.moveTo(px, rect.y);
                ctx.lineTo(px, rect.y + rect.height);
                ctx.stroke();

                if (isMajor) {
                    ctx.fillStyle = 'rgba(156, 163, 175, 0.9)';
                    ctx.font = '11px "JetBrains Mono", monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText(`${t}`, px, rect.y + rect.height + 6);
                }
            }

            // Horizontal Gridlines (Velocity: every 2 m/s, subtle at 1 m/s)
            for (let v = this.vMin; v <= this.vMax; v += 1) {
                const py = this.vToVtPy(v);
                const isZero = v === 0;
                const isMajor = v % 2 === 0;

                ctx.beginPath();
                if (isZero) {
                    ctx.strokeStyle = '#38bdf8'; // Highlight v = 0 axis
                    ctx.lineWidth = 2;
                } else if (isMajor) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
                    ctx.lineWidth = 1;
                } else {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                    ctx.lineWidth = 1;
                }
                ctx.moveTo(rect.x, py);
                ctx.lineTo(rect.x + rect.width, py);
                ctx.stroke();

                if (isMajor || isZero) {
                    ctx.fillStyle = isZero ? '#38bdf8' : 'rgba(156, 163, 175, 0.9)';
                    ctx.font = isZero ? 'bold 11px "JetBrains Mono", monospace' : '11px "JetBrains Mono", monospace';
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${v >= 0 ? '+' : ''}${v}`, rect.x - 8, py);
                }
            }

            // Outer Border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

            // Axis Title Labels
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Time t (seconds)', rect.x + rect.width / 2, rect.y + rect.height + 26);

            ctx.save();
            ctx.translate(rect.x - 44, rect.y + rect.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.fillText('Velocity v (m/s)', 0, 0);
            ctx.restore();

            ctx.restore();
        }

        drawVTAreaShading(ctx, rect) {
            ctx.save();
            const yZero = this.vToVtPy(0);

            // Shading only up to currentTime
            const tEnd = this.currentTime;
            if (tEnd <= 0) {
                ctx.restore();
                return;
            }

            // Step through segments and shade regions above and below v = 0
            for (let i = 0; i < this.keyframes.length - 1; i++) {
                const kf1 = this.keyframes[i];
                const kf2 = this.keyframes[i + 1];
                if (kf1.t >= tEnd) break;

                const segStartT = kf1.t;
                const segEndT = Math.min(kf2.t, tEnd);
                if (segEndT <= segStartT) continue;

                const a = (kf2.v - kf1.v) / (kf2.t - kf1.t);
                const vStart = kf1.v;
                const vEnd = vStart + a * (segEndT - segStartT);

                const x1 = this.tToVtPx(segStartT);
                const x2 = this.tToVtPx(segEndT);
                const y1 = this.vToVtPy(vStart);
                const y2 = this.vToVtPy(vEnd);

                // Does this segment cross v = 0?
                if ((vStart >= 0 && vEnd >= 0) || (vStart <= 0 && vEnd <= 0)) {
                    // Entirely on one side
                    const isPositive = vStart >= 0;
                    ctx.beginPath();
                    ctx.moveTo(x1, yZero);
                    ctx.lineTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x2, yZero);
                    ctx.closePath();

                    ctx.fillStyle = isPositive ? 'rgba(16, 185, 129, 0.22)' : 'rgba(239, 68, 68, 0.22)';
                    ctx.fill();

                    ctx.strokeStyle = isPositive ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else {
                    // Crosses v = 0 axis at tc
                    const dtCross = Math.abs(vStart / a);
                    const tCross = segStartT + dtCross;
                    const xCross = this.tToVtPx(tCross);

                    // Part 1: from segStartT to tCross
                    ctx.beginPath();
                    ctx.moveTo(x1, yZero);
                    ctx.lineTo(x1, y1);
                    ctx.lineTo(xCross, yZero);
                    ctx.closePath();
                    ctx.fillStyle = vStart > 0 ? 'rgba(16, 185, 129, 0.22)' : 'rgba(239, 68, 68, 0.22)';
                    ctx.fill();

                    // Part 2: from tCross to segEndT
                    ctx.beginPath();
                    ctx.moveTo(xCross, yZero);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x2, yZero);
                    ctx.closePath();
                    ctx.fillStyle = vEnd > 0 ? 'rgba(16, 185, 129, 0.22)' : 'rgba(239, 68, 68, 0.22)';
                    ctx.fill();
                }
            }

            ctx.restore();
        }

        drawVTPath(ctx, rect) {
            if (this.keyframes.length < 2) return;
            ctx.save();

            // Main path line
            ctx.beginPath();
            ctx.strokeStyle = '#06b6d4'; // vibrant cyan
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = 0; i < this.keyframes.length; i++) {
                const kf = this.keyframes[i];
                const px = this.tToVtPx(kf.t);
                const py = this.vToVtPy(kf.v);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();

            // Segment slope annotations (a = Δv / Δt)
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';

            for (let i = 0; i < this.keyframes.length - 1; i++) {
                const kf1 = this.keyframes[i];
                const kf2 = this.keyframes[i + 1];
                const dt = kf2.t - kf1.t;
                if (dt < 0.8) continue; // skip crowding

                const a = (kf2.v - kf1.v) / dt;
                const midT = (kf1.t + kf2.t) / 2;
                const midV = (kf1.v + kf2.v) / 2;
                const px = this.tToVtPx(midT);
                const py = this.vToVtPy(midV) - 12;

                const aStr = Math.abs(a) < 0.05 ? 'a = 0' : `a = ${a > 0 ? '+' : ''}${a.toFixed(1)} m/s²`;
                ctx.fillStyle = Math.abs(a) < 0.05 ? '#38bdf8' : (a > 0 ? '#10b981' : '#f43f5e');
                ctx.fillText(aStr, px, py);
            }

            ctx.restore();
        }

        drawVTPlayhead(ctx, rect) {
            ctx.save();
            const px = this.tToVtPx(this.currentTime);
            const state = this.getKinematicStateAt(this.currentTime);
            const py = this.vToVtPy(state.v);

            // Vertical beacon line
            ctx.beginPath();
            ctx.strokeStyle = '#f59e0b'; // amber playhead
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.moveTo(px, rect.y);
            ctx.lineTo(px, rect.y + rect.height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Current velocity tracker circle
            ctx.beginPath();
            ctx.arc(px, py, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#f59e0b';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Micro readout label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.textAlign = px > rect.x + rect.width - 60 ? 'right' : 'left';
            ctx.fillText(`v = ${state.v >= 0 ? '+' : ''}${state.v.toFixed(1)}`, px + (px > rect.x + rect.width - 60 ? -12 : 12), py - 4);

            ctx.restore();
        }

        drawVTWaypoints(ctx, rect) {
            ctx.save();

            for (let i = 0; i < this.keyframes.length; i++) {
                const kf = this.keyframes[i];
                const px = this.tToVtPx(kf.t);
                const py = this.vToVtPy(kf.v);
                const isDragging = (i === this.draggedIndex);
                const isHovered = (i === this.hoveredIndex);

                // Halo glow
                if (isDragging || isHovered) {
                    ctx.beginPath();
                    ctx.arc(px, py, isDragging ? 18 : 14, 0, Math.PI * 2);
                    ctx.fillStyle = isDragging ? 'rgba(56, 189, 248, 0.35)' : 'rgba(56, 189, 248, 0.2)';
                    ctx.fill();
                }

                // Inner core
                ctx.beginPath();
                ctx.arc(px, py, isDragging ? 8 : 6.5, 0, Math.PI * 2);
                ctx.fillStyle = isDragging ? '#38bdf8' : (isHovered ? '#67e8f9' : '#0284c7');
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Point tag
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.font = 'bold 10px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`P${i + 1}`, px, py - 13);
            }

            ctx.restore();
        }

        // --- Render 2: 1D Ground Track Motion Visualizer (trackCanvas) ---
        renderTrackVisualizer() {
            const ctx = this.trackCtx;
            const w = this.trackCanvas.width / (window.devicePixelRatio || 1);
            const h = this.trackCanvas.height / (window.devicePixelRatio || 1);
            const rect = this.trackRect;

            ctx.clearRect(0, 0, w, h);

            // Compute minX and maxX across whole 0..10 trajectory to anchor the camera viewport
            const traj = this.computePositionTrajectory(100);
            let viewportMinX = Math.floor(Math.min(-5, traj.minX - 5) / 10) * 10;
            let viewportMaxX = Math.ceil(Math.max(65, traj.maxX + 10) / 10) * 10;

            const currentState = this.getKinematicStateAt(this.currentTime);

            // Draw Highway Track Surface
            this.drawTrackSurface(ctx, rect, viewportMinX, viewportMaxX);

            // Draw Strobe / Oil-Drop Trail Markers
            if (this.showStrobes) {
                this.drawStrobeTrails(ctx, rect, viewportMinX, viewportMaxX);
            }

            // Draw Vehicle
            const carPx = this.xToTrackPx(currentState.x, viewportMinX, viewportMaxX);
            const trackCenterY = rect.y + rect.height * 0.45;
            this.drawVehicle(ctx, carPx, trackCenterY, currentState.v);

            // Draw Vector Arrows (Velocity & Acceleration)
            if (this.showVectors) {
                this.drawKinematicVectors(ctx, carPx, trackCenterY, currentState.v, currentState.a);
            }
        }

        drawTrackSurface(ctx, rect, minX, maxX) {
            ctx.save();
            const trackY = rect.y + rect.height * 0.45;

            // Road asphalt
            ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
            ctx.fillRect(rect.x, trackY - 22, rect.width, 44);

            // Curbs
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(rect.x, trackY - 22, rect.width, 44);

            // Dashed center line
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)'; // highway yellow
            ctx.lineWidth = 2;
            ctx.setLineDash([12, 10]);
            ctx.moveTo(rect.x, trackY);
            ctx.lineTo(rect.x + rect.width, trackY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Metric Ruler Markings below road
            const rulerY = trackY + 28;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
            ctx.lineWidth = 1;
            ctx.moveTo(rect.x, rulerY);
            ctx.lineTo(rect.x + rect.width, rulerY);
            ctx.stroke();

            // Interval ticks (every 10 m major, every 5 m minor)
            for (let xm = minX; xm <= maxX; xm += 5) {
                const px = this.xToTrackPx(xm, minX, maxX);
                if (px < rect.x || px > rect.x + rect.width) continue;

                const isMajor = xm % 10 === 0;
                ctx.beginPath();
                ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = isMajor ? 1.5 : 1;
                ctx.moveTo(px, rulerY);
                ctx.lineTo(px, rulerY + (isMajor ? 8 : 4));
                ctx.stroke();

                if (isMajor) {
                    ctx.fillStyle = xm === 0 ? '#38bdf8' : 'rgba(203, 213, 225, 0.85)';
                    ctx.font = xm === 0 ? 'bold 10px "JetBrains Mono", monospace' : '10px "JetBrains Mono", monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText(`${xm >= 0 ? '+' : ''}${xm} m`, px, rulerY + 11);
                }
            }

            // Origin Flag marker at x = 0
            const originPx = this.xToTrackPx(0, minX, maxX);
            if (originPx >= rect.x && originPx <= rect.x + rect.width) {
                ctx.beginPath();
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 2;
                ctx.moveTo(originPx, trackY - 32);
                ctx.lineTo(originPx, trackY + 22);
                ctx.stroke();

                ctx.fillStyle = '#38bdf8';
                ctx.font = 'bold 9px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('ORIGIN (x = 0)', originPx, trackY - 36);
            }

            ctx.restore();
        }

        drawStrobeTrails(ctx, rect, minX, maxX) {
            ctx.save();
            const trackY = rect.y + rect.height * 0.45;

            this.strobeMarkers.forEach((marker) => {
                const px = this.xToTrackPx(marker.x, minX, maxX);
                if (px < rect.x || px > rect.x + rect.width) return;

                // Oil drop marker dot
                ctx.beginPath();
                ctx.arc(px, trackY, 4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(244, 63, 94, 0.75)'; // vibrant rose
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Small timestamp caption
                ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
                ctx.font = '8px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`${marker.t.toFixed(1)}s`, px, trackY - 8);
            });

            ctx.restore();
        }

        drawVehicle(ctx, xPx, yCenter, v) {
            ctx.save();
            const w = 46;
            const h = 24;
            const x = xPx - w / 2;
            const y = yCenter - h / 2;

            // Vehicle Body
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(x, y, w, h, 6) : ctx.rect(x, y, w, h);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Cockpit windshield
            const facingRight = v >= 0;
            ctx.fillStyle = '#0f172a';
            const cabX = facingRight ? x + 24 : x + 6;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(cabX, y + 3, 16, h - 6, 3) : ctx.rect(cabX, y + 3, 16, h - 6);
            ctx.fill();

            // Headlights / Taillights
            if (facingRight) {
                // Headlight on right
                ctx.fillStyle = '#fde047';
                ctx.fillRect(x + w - 3, y + 5, 3, 5);
                // Taillight on left
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(x, y + 5, 3, 5);
            } else {
                // Headlight on left
                ctx.fillStyle = '#fde047';
                ctx.fillRect(x, y + 5, 3, 5);
                // Taillight on right
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(x + w - 3, y + 5, 3, 5);
            }

            // Wheels
            ctx.fillStyle = '#090d16';
            ctx.fillRect(x + 6, y + h - 2, 10, 4);
            ctx.fillRect(x + w - 16, y + h - 2, 10, 4);
            ctx.fillRect(x + 6, y - 2, 10, 4);
            ctx.fillRect(x + w - 16, y - 2, 10, 4);

            ctx.restore();
        }

        drawKinematicVectors(ctx, xPx, yCenter, v, a) {
            ctx.save();
            const arrowScale = 6; // px per m/s

            // 1. Velocity Vector (Green: points in direction of motion)
            if (Math.abs(v) > 0.1) {
                const vLen = v * arrowScale;
                const vY = yCenter - 26;
                this.drawArrow(ctx, xPx, vY, xPx + vLen, vY, '#10b981', 3, 'v');
            }

            // 2. Acceleration Vector (Amber: points in direction of acceleration)
            if (Math.abs(a) > 0.1) {
                const aLen = a * arrowScale * 2;
                const aY = yCenter + 26;
                this.drawArrow(ctx, xPx, aY, xPx + aLen, aY, '#f59e0b', 3, 'a');
            }

            ctx.restore();
        }

        drawArrow(ctx, x1, y1, x2, y2, color, lineWidth = 2, label = '') {
            const headlen = 8;
            const angle = Math.atan2(y2 - y1, x2 - x1);

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();

            if (label) {
                ctx.font = 'bold 11px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(label, (x1 + x2) / 2, y1 - 6);
            }
        }

        // --- Render 3: Optional Collapsible Position-Time Graph (xtCanvas) ---
        renderXTGraph() {
            if (!this.xtCtx) return;
            const ctx = this.xtCtx;
            const w = this.xtCanvas.width / (window.devicePixelRatio || 1);
            const h = this.xtCanvas.height / (window.devicePixelRatio || 1);
            const rect = this.xtPlotRect;

            ctx.clearRect(0, 0, w, h);

            // Compute trajectory points
            const traj = this.computePositionTrajectory(250);
            let yMin = Math.floor(Math.min(-5, traj.minX - 5) / 10) * 10;
            let yMax = Math.ceil(Math.max(30, traj.maxX + 10) / 10) * 10;

            const tToPx = (t) => rect.x + ((t - this.tMin) / (this.tMax - this.tMin)) * rect.width;
            const xToPy = (x) => rect.y + (1 - (x - yMin) / (yMax - yMin)) * rect.height;

            // Background & Grid
            ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

            // Vertical Time Grid
            for (let t = 0; t <= 10; t += 2) {
                const px = tToPx(t);
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.lineWidth = 1;
                ctx.moveTo(px, rect.y);
                ctx.lineTo(px, rect.y + rect.height);
                ctx.stroke();

                ctx.fillStyle = 'rgba(156, 163, 175, 0.8)';
                ctx.font = '10px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`${t}s`, px, rect.y + rect.height + 12);
            }

            // Horizontal Position Grid
            for (let pos = yMin; pos <= yMax; pos += 10) {
                const py = xToPy(pos);
                const isZero = pos === 0;

                ctx.beginPath();
                ctx.strokeStyle = isZero ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)';
                ctx.lineWidth = isZero ? 1.5 : 1;
                ctx.moveTo(rect.x, py);
                ctx.lineTo(rect.x + rect.width, py);
                ctx.stroke();

                ctx.fillStyle = isZero ? '#38bdf8' : 'rgba(156, 163, 175, 0.8)';
                ctx.font = '10px "JetBrains Mono", monospace';
                ctx.textAlign = 'right';
                ctx.fillText(`${pos}m`, rect.x - 6, py + 3);
            }

            // Outer border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

            // Curve Line
            ctx.beginPath();
            ctx.strokeStyle = '#a855f7'; // vibrant purple
            ctx.lineWidth = 2.5;

            traj.points.forEach((pt, index) => {
                const px = tToPx(pt.t);
                const py = xToPy(pt.x);
                if (index === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.stroke();

            // Playhead dot on x-t curve
            const currentState = this.getKinematicStateAt(this.currentTime);
            const curPx = tToPx(this.currentTime);
            const curPy = xToPy(currentState.x);

            ctx.beginPath();
            ctx.arc(curPx, curPy, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#f59e0b';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Axis labels
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Time t (s)', rect.x + rect.width / 2, rect.y + rect.height + 26);

            ctx.save();
            ctx.translate(rect.x - 42, rect.y + rect.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('Position x (m)', 0, 0);
            ctx.restore();
        }
    }

    // --- DOM Initialization ---
    window.addEventListener('DOMContentLoaded', () => {
        window.vtStudioApp = new VTStudioApp();

        // Auto-init NGSS Standard Modals if helper exists
        if (window.NGSSHelper && typeof window.NGSSHelper.autoInit === 'function') {
            window.NGSSHelper.autoInit();
        }
    });
})();

/**
 * Velocity vs. Time (v-t) Motion Visualizer & Graph Studio
 * Clean, reliable, and straightforward classroom presentation tool.
 *
 * Core Features:
 * - Constant Speed Examples (a = 0, flat horizontal line)
 * - Uniform Acceleration Examples (a = const, straight diagonal lines)
 * - 1D Motion Track with physical car, vector arrows, and 0.5s strobe drops
 * - Draggable keyframes on graph
 * - Strictly No-LaTeX math (plain Unicode/HTML)
 */

(function () {
    'use strict';

    // --- Web Audio Sound System ---
    class SoundFX {
        constructor() {
            this.ctx = null;
            this.muted = false;
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playTone(freq, duration, type = 'sine', vol = 0.08) {
            if (this.muted) return;
            try {
                this.init();
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                gain.gain.setValueAtTime(vol, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            } catch (e) {}
        }

        blip() { this.playTone(600, 0.05, 'sine', 0.05); }
        snap() { this.playTone(800, 0.06, 'triangle', 0.08); }
    }

    const sound = new SoundFX();

    // --- Clean Presets ---
    const PRESETS = {
        constant_fast: {
            title: 'Constant Fast Speed (+6.0 m/s)',
            body: 'A horizontal line at v = +6.0 m/s. Because the velocity is constant, the slope is 0 (acceleration a = 0 m/s²). The car cruises forward steadily, covering equal distances (3.0 m every 0.5 s) shown by evenly spaced strobe dots.',
            slopeNote: 'Slope = 0 m/s² (No acceleration)',
            areaNote: 'Area = base × height = 10 s × 6 m/s = +60 m',
            status: 'Constant Velocity (+6 m/s)',
            points: [
                { t: 0, v: 6 },
                { t: 10, v: 6 }
            ]
        },
        constant_slow: {
            title: 'Constant Slow Speed (+2.0 m/s)',
            body: 'A horizontal line at v = +2.0 m/s. The slope is still 0 (acceleration a = 0 m/s²), but notice how much closer together the strobe markers are compared to the fast car, and how much smaller the shaded rectangle is.',
            slopeNote: 'Slope = 0 m/s² (No acceleration)',
            areaNote: 'Area = base × height = 10 s × 2 m/s = +20 m',
            status: 'Constant Velocity (+2 m/s)',
            points: [
                { t: 0, v: 2 },
                { t: 10, v: 2 }
            ]
        },
        speeding_up: {
            title: 'Uniform Acceleration: Speeding Up from Rest',
            body: 'Starts at rest (v = 0 m/s) and steadily accelerates up to +10.0 m/s at t = 5 s. The straight upward diagonal line means uniform acceleration: a = Δv / Δt = (10 - 0)/(5 - 0) = +2.0 m/s². The strobe markers get further and further apart.',
            slopeNote: 'Slope = +2.0 m/s² (Speeding up)',
            areaNote: 'Triangle Area = ½(base)(height) = ½(5)(10) = 25 m, then cruise at 10 m/s (+50 m) = 75 m total',
            status: 'Speeding Up (+2.0 m/s²)',
            points: [
                { t: 0, v: 0 },
                { t: 5, v: 10 },
                { t: 10, v: 10 }
            ]
        },
        slowing_down: {
            title: 'Uniform Acceleration: Braking to a Stop',
            body: 'The car starts at +8.0 m/s, then hits the brakes with constant deceleration: a = -2.0 m/s², reaching a complete stop at t = 4 s. Notice the downward slope. The strobe markers get closer and closer together until the car halts.',
            slopeNote: 'Slope = -2.0 m/s² (Braking / slowing down)',
            areaNote: 'Triangle Area = ½(4 s)(8 m/s) = +16 m forward displacement before stopping',
            status: 'Braking / Slowing Down (-2.0 m/s²)',
            points: [
                { t: 0, v: 8 },
                { t: 4, v: 0 },
                { t: 10, v: 0 }
            ]
        },
        trip: {
            title: '3-Part Journey: Speed Up, Cruise, Brake to Stop',
            body: 'Part 1 (0 to 3s): Accelerates from rest to 6 m/s (a = +2.0 m/s²). Part 2 (3 to 7s): Cruises at constant 6 m/s (a = 0). Part 3 (7 to 10s): Brakes smoothly to rest (a = -2.0 m/s²). The total shaded area is a trapezoid.',
            slopeNote: 'Part 1: +2.0 m/s² | Part 2: 0 m/s² | Part 3: -2.0 m/s²',
            areaNote: 'Trapezoid Area = 9 m + 24 m + 9 m = +42 m total displacement',
            status: 'Multi-Phase Journey',
            points: [
                { t: 0, v: 0 },
                { t: 3, v: 6 },
                { t: 7, v: 6 },
                { t: 10, v: 0 }
            ]
        },
        reversing: {
            title: 'Reversing Direction: Crossing v = 0 Axis',
            body: 'The car moves forward at +4.0 m/s, slows down under constant negative acceleration (a = -1.6 m/s²), momentarily stops at t = 2.5 s (v = 0), and then reverses into negative velocity (-4.0 m/s). Area above = forward displacement (+5m), Area below = backward displacement (-12m).',
            slopeNote: 'Slope = -1.6 m/s² (Constant backward acceleration)',
            areaNote: 'Forward area: +5 m | Backward area: -12 m | Net Δx: -7 m',
            status: 'Reversing Direction',
            points: [
                { t: 0, v: 4 },
                { t: 5, v: -4 },
                { t: 10, v: -4 }
            ]
        }
    };

    class VelocityVisualizerApp {
        constructor() {
            // Canvases
            this.vtCanvas = document.getElementById('vtCanvas');
            this.trackCanvas = document.getElementById('trackCanvas');
            this.vtCtx = this.vtCanvas.getContext('2d');
            this.trackCtx = this.trackCanvas.getContext('2d');

            // DOM elements
            this.btnPlayPause = document.getElementById('btnPlayPause');
            this.btnReset = document.getElementById('btnReset');
            this.timeScrubber = document.getElementById('timeScrubber');
            this.scrubVal = document.getElementById('scrubVal');
            this.telTime = document.getElementById('telTime');
            this.telVelocity = document.getElementById('telVelocity');
            this.telAccel = document.getElementById('telAccel');
            this.telPosition = document.getElementById('telPosition');
            this.motionStatusBadge = document.getElementById('motionStatusBadge');

            this.noteTitle = document.getElementById('noteTitle');
            this.noteBody = document.getElementById('noteBody');
            this.takeawaySlope = document.getElementById('takeawaySlope');
            this.takeawayArea = document.getElementById('takeawayArea');

            this.chkArea = document.getElementById('chkArea');
            this.chkSlope = document.getElementById('chkSlope');
            this.chkStrobes = document.getElementById('chkStrobes');
            this.btnSound = document.getElementById('btnSound');

            // State
            this.tMax = 10;
            this.currentTime = 0;
            this.isPlaying = false;
            this.playSpeed = 1.0;
            this.lastFrameTime = null;

            // Draggable Points [ {t, v}, ... ]
            this.points = [];
            this.draggedPointIndex = -1;

            // Strobe markers dropped along track [ {t, x, v} ]
            this.strobeMarkers = [];

            // Graph bounds
            this.vMin = -8;
            this.vMax = 12;

            // Layout rects
            this.vtRect = { x: 55, y: 25, width: 700, height: 260 };
            this.trackRect = { x: 45, y: 20, width: 720, height: 80 };

            this.initEvents();
            this.loadPreset('constant_fast');
            this.resize();
            this.loop();
        }

        initEvents() {
            window.addEventListener('resize', () => this.resize());

            // Play / Pause
            this.btnPlayPause.addEventListener('click', () => {
                sound.init();
                this.togglePlay();
            });

            // Reset
            this.btnReset.addEventListener('click', () => {
                sound.blip();
                this.setTime(0);
                if (this.isPlaying) this.togglePlay();
            });

            // Time Scrubber
            this.timeScrubber.addEventListener('input', (e) => {
                this.setTime(parseFloat(e.target.value));
            });

            // Speed pills
            document.querySelectorAll('.speed-pill').forEach(pill => {
                pill.addEventListener('click', () => {
                    sound.blip();
                    document.querySelectorAll('.speed-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    this.playSpeed = parseFloat(pill.dataset.speed);
                });
            });

            // Preset buttons
            document.querySelectorAll('.preset-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.preset;
                    this.loadPreset(key);
                });
            });

            // Sound Toggle
            this.btnSound.addEventListener('click', () => {
                sound.muted = !sound.muted;
                this.btnSound.textContent = sound.muted ? '🔇 Sound Off' : '🔊 Sound On';
                if (!sound.muted) sound.snap();
            });

            // Checkbox changes trigger render
            [this.chkArea, this.chkSlope, this.chkStrobes].forEach(chk => {
                if (chk) chk.addEventListener('change', () => this.render());
            });

            // Pointer events for dragging graph dots
            this.initGraphPointerEvents();
        }

        loadPreset(key) {
            const preset = PRESETS[key];
            if (!preset) return;

            document.querySelectorAll('.preset-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.preset === key);
            });

            // Deep clone points
            this.points = preset.points.map(p => ({ t: p.t, v: p.v }));

            // Update Notes
            this.noteTitle.textContent = `Key Takeaway: ${preset.title}`;
            this.noteBody.innerHTML = preset.body;
            this.takeawaySlope.textContent = preset.slopeNote;
            this.takeawayArea.textContent = preset.areaNote;
            this.motionStatusBadge.textContent = preset.status;

            this.strobeMarkers = [];
            this.setTime(0);
            sound.snap();
        }

        togglePlay() {
            this.isPlaying = !this.isPlaying;
            if (this.isPlaying) {
                if (this.currentTime >= this.tMax) {
                    this.currentTime = 0;
                    this.strobeMarkers = [];
                }
                this.btnPlayPause.textContent = '⏸ Pause';
                this.btnPlayPause.classList.add('playing');
                sound.blip();
            } else {
                this.btnPlayPause.textContent = '▶ Play Motion';
                this.btnPlayPause.classList.remove('playing');
            }
        }

        setTime(t) {
            this.currentTime = Math.max(0, Math.min(this.tMax, t));
            this.timeScrubber.value = this.currentTime.toFixed(2);
            this.scrubVal.textContent = `${this.currentTime.toFixed(1)} s / 10.0 s`;
            this.updateTelemetry();
            this.render();
        }

        // --- Physics Calculations ---
        getKinematics(time) {
            const t = Math.max(0, Math.min(this.tMax, time));
            let v = this.points[0].v;
            let a = 0;
            let x = 0;

            for (let i = 0; i < this.points.length - 1; i++) {
                const p1 = this.points[i];
                const p2 = this.points[i + 1];
                const dt = p2.t - p1.t;
                if (dt <= 0) continue;

                const segA = (p2.v - p1.v) / dt;

                if (t >= p1.t) {
                    const segT = Math.min(dt, t - p1.t);
                    x += p1.v * segT + 0.5 * segA * segT * segT;
                    if (t <= p2.t || i === this.points.length - 2) {
                        a = segA;
                        v = p1.v + segA * segT;
                    }
                }
            }

            return { t, v, a, x };
        }

        updateTelemetry() {
            const state = this.getKinematics(this.currentTime);
            this.telTime.textContent = `${state.t.toFixed(1)} s`;
            this.telVelocity.textContent = `${state.v >= 0 ? '+' : ''}${state.v.toFixed(1)} m/s`;
            this.telAccel.textContent = `${state.a >= 0 ? '+' : ''}${state.a.toFixed(1)} m/s²`;
            this.telPosition.textContent = `${state.x >= 0 ? '+' : ''}${state.x.toFixed(1)} m`;

            // Update badge text if actively playing
            if (Math.abs(state.v) < 0.1 && Math.abs(state.a) < 0.1) {
                this.motionStatusBadge.textContent = 'Stopped (At Rest)';
            } else if (Math.abs(state.a) < 0.1) {
                this.motionStatusBadge.textContent = `Constant Speed (${state.v > 0 ? 'Forward ➔' : 'Backward ⬅'})`;
            } else if ((state.v > 0 && state.a > 0) || (state.v < 0 && state.a < 0)) {
                this.motionStatusBadge.textContent = 'Speeding Up 🚀';
            } else if ((state.v > 0 && state.a < 0) || (state.v < 0 && state.a > 0)) {
                this.motionStatusBadge.textContent = 'Slowing Down 🛑';
            } else if (Math.abs(state.v) < 0.2) {
                this.motionStatusBadge.textContent = 'Reversing Direction 🔄';
            }
        }

        // --- Animation Loop ---
        loop(timestamp) {
            if (!this.lastFrameTime) this.lastFrameTime = timestamp;
            const dtReal = (timestamp - this.lastFrameTime) / 1000;
            this.lastFrameTime = timestamp;

            if (this.isPlaying) {
                const prevT = this.currentTime;
                this.currentTime += dtReal * this.playSpeed;

                // Strobe dot check every 0.5s
                if (this.chkStrobes && this.chkStrobes.checked) {
                    const prevStep = Math.floor(prevT / 0.5);
                    const currStep = Math.floor(this.currentTime / 0.5);
                    if (currStep > prevStep) {
                        for (let s = prevStep + 1; s <= currStep; s++) {
                            const stT = s * 0.5;
                            if (stT <= this.tMax) {
                                const stState = this.getKinematics(stT);
                                this.strobeMarkers.push({ t: stT, x: stState.x, v: stState.v });
                            }
                        }
                    }
                }

                if (this.currentTime >= this.tMax) {
                    this.currentTime = this.tMax;
                    this.togglePlay();
                }

                this.setTime(this.currentTime);
            }

            requestAnimationFrame((ts) => this.loop(ts));
        }

        // --- Resize Handlers ---
        resize() {
            const dpr = window.devicePixelRatio || 1;

            // Track Canvas
            const trackBox = this.trackCanvas.parentElement.getBoundingClientRect();
            this.trackCanvas.width = trackBox.width * dpr;
            this.trackCanvas.height = trackBox.height * dpr;
            this.trackCtx.resetTransform();
            this.trackCtx.scale(dpr, dpr);
            this.trackRect = {
                x: 45,
                y: 15,
                width: trackBox.width - 90,
                height: trackBox.height - 30
            };

            // VT Canvas
            const vtBox = this.vtCanvas.parentElement.getBoundingClientRect();
            this.vtCanvas.width = vtBox.width * dpr;
            this.vtCanvas.height = vtBox.height * dpr;
            this.vtCtx.resetTransform();
            this.vtCtx.scale(dpr, dpr);
            this.vtRect = {
                x: 60,
                y: 20,
                width: vtBox.width - 85,
                height: vtBox.height - 45
            };

            this.render();
        }

        // --- Coordinate Helpers ---
        tToPx(t) {
            return this.vtRect.x + (t / this.tMax) * this.vtRect.width;
        }

        vToPy(v) {
            const frac = (v - this.vMin) / (this.vMax - this.vMin);
            return this.vtRect.y + (1 - frac) * this.vtRect.height;
        }

        pxToT(px) {
            const frac = (px - this.vtRect.x) / this.vtRect.width;
            return Math.max(0, Math.min(this.tMax, frac * this.tMax));
        }

        pyToV(py) {
            const frac = 1 - (py - this.vtRect.y) / this.vtRect.height;
            return Math.max(this.vMin, Math.min(this.vMax, this.vMin + frac * (this.vMax - this.vMin)));
        }

        // --- Interactive Dragging on Graph ---
        initGraphPointerEvents() {
            const canvas = this.vtCanvas;

            const getPos = (e) => {
                const rect = canvas.getBoundingClientRect();
                return {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            };

            canvas.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                canvas.setPointerCapture(e.pointerId);
                const pos = getPos(e);
                sound.init();

                // Find clicked point (threshold 22px)
                let hitIndex = -1;
                for (let i = 0; i < this.points.length; i++) {
                    const px = this.tToPx(this.points[i].t);
                    const py = this.vToPy(this.points[i].v);
                    if (Math.hypot(pos.x - px, pos.y - py) < 24) {
                        hitIndex = i;
                        break;
                    }
                }

                if (hitIndex !== -1) {
                    this.draggedPointIndex = hitIndex;
                    sound.snap();
                } else {
                    // Click sets playhead time
                    const t = this.pxToT(pos.x);
                    this.setTime(t);
                    sound.blip();
                }
            });

            canvas.addEventListener('pointermove', (e) => {
                const pos = getPos(e);

                if (this.draggedPointIndex !== -1) {
                    e.preventDefault();
                    const pt = this.points[this.draggedPointIndex];

                    // Drag velocity
                    let vNew = Math.round(this.pyToV(pos.y));
                    pt.v = Math.max(-6, Math.min(10, vNew));

                    // Drag time (only middle points can move horizontally)
                    if (this.draggedPointIndex > 0 && this.draggedPointIndex < this.points.length - 1) {
                        let tNew = Math.round(this.pxToT(pos.x) * 2) / 2; // snap to 0.5s
                        const minT = this.points[this.draggedPointIndex - 1].t + 0.5;
                        const maxT = this.points[this.draggedPointIndex + 1].t - 0.5;
                        pt.t = Math.max(minT, Math.min(maxT, tNew));
                    }

                    this.updateTelemetry();
                    this.render();
                } else {
                    // Hover check
                    let hover = false;
                    for (let p of this.points) {
                        if (Math.hypot(pos.x - this.tToPx(p.t), pos.y - this.vToPy(p.v)) < 18) {
                            hover = true;
                            break;
                        }
                    }
                    canvas.style.cursor = hover ? 'grab' : 'crosshair';
                }
            });

            const endDrag = (e) => {
                if (this.draggedPointIndex !== -1) {
                    try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
                    this.draggedPointIndex = -1;
                    sound.snap();
                    this.render();
                }
            };

            canvas.addEventListener('pointerup', endDrag);
            canvas.addEventListener('pointercancel', endDrag);
        }

        // --- Render System ---
        render() {
            this.renderTrack();
            this.renderVTGraph();
        }

        // --- Render 1D Track Canvas ---
        renderTrack() {
            const ctx = this.trackCtx;
            const w = this.trackCanvas.width / (window.devicePixelRatio || 1);
            const h = this.trackCanvas.height / (window.devicePixelRatio || 1);
            const rect = this.trackRect;

            ctx.clearRect(0, 0, w, h);

            // Compute max distance to fit viewport cleanly
            let maxPos = 60;
            for (let t = 0; t <= 10; t += 0.5) {
                const s = this.getKinematics(t);
                if (s.x > maxPos) maxPos = s.x;
            }
            maxPos = Math.ceil((maxPos + 10) / 10) * 10;

            const xToPx = (xm) => rect.x + (xm / maxPos) * rect.width;
            const trackY = rect.y + rect.height * 0.45;

            // Road surface
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(rect.x, trackY - 14, rect.width, 28);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.strokeRect(rect.x, trackY - 14, rect.width, 28);

            // Road center dashed line
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(rect.x, trackY);
            ctx.lineTo(rect.x + rect.width, trackY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Ruler markings
            ctx.strokeStyle = '#64748b';
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';

            for (let m = 0; m <= maxPos; m += 10) {
                const px = xToPx(m);
                ctx.beginPath();
                ctx.moveTo(px, trackY + 14);
                ctx.lineTo(px, trackY + 22);
                ctx.stroke();
                ctx.fillText(`${m}m`, px, trackY + 34);
            }

            // Strobe markers
            if (this.chkStrobes && this.chkStrobes.checked) {
                this.strobeMarkers.forEach(st => {
                    const spx = xToPx(st.x);
                    ctx.beginPath();
                    ctx.arc(spx, trackY, 4, 0, Math.PI * 2);
                    ctx.fillStyle = '#f43f5e';
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                });
            }

            // Draw Car
            const curState = this.getKinematics(this.currentTime);
            const carPx = xToPx(curState.x);
            this.drawCar(ctx, carPx, trackY, curState.v, curState.a);
        }

        drawCar(ctx, x, y, v, a) {
            ctx.save();
            const w = 38;
            const h = 20;

            // Car body
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(x - w / 2, y - h / 2, w, h);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - w / 2, y - h / 2, w, h);

            // Windshield
            ctx.fillStyle = '#0f172a';
            const cabX = v >= 0 ? x + 2 : x - 14;
            ctx.fillRect(cabX, y - h / 2 + 3, 12, h - 6);

            // Wheels
            ctx.fillStyle = '#000';
            ctx.fillRect(x - w / 2 + 4, y - h / 2 - 3, 8, 3);
            ctx.fillRect(x + w / 2 - 12, y - h / 2 - 3, 8, 3);
            ctx.fillRect(x - w / 2 + 4, y + h / 2, 8, 3);
            ctx.fillRect(x + w / 2 - 12, y + h / 2, 8, 3);

            // Velocity Vector Arrow (Green)
            if (Math.abs(v) > 0.2) {
                const arrowLen = v * 5;
                this.drawArrow(ctx, x, y - 20, x + arrowLen, y - 20, '#22c55e', 'v');
            }

            // Acceleration Vector Arrow (Amber)
            if (Math.abs(a) > 0.2) {
                const arrowLen = a * 10;
                this.drawArrow(ctx, x, y + 20, x + arrowLen, y + 20, '#f59e0b', 'a');
            }

            ctx.restore();
        }

        drawArrow(ctx, x1, y1, x2, y2, color, label) {
            const headlen = 6;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();

            if (label) {
                ctx.font = 'bold 11px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(label, (x1 + x2) / 2, y1 - 4);
            }
        }

        // --- Render Velocity vs Time Graph Canvas ---
        renderVTGraph() {
            const ctx = this.vtCtx;
            const w = this.vtCanvas.width / (window.devicePixelRatio || 1);
            const h = this.vtCanvas.height / (window.devicePixelRatio || 1);
            const rect = this.vtRect;

            ctx.clearRect(0, 0, w, h);

            // Grid background
            ctx.fillStyle = '#070c18';
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

            // Vertical Time Gridlines (every 1s)
            ctx.lineWidth = 1;
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';

            for (let t = 0; t <= 10; t += 1) {
                const px = this.tToPx(t);
                ctx.strokeStyle = t % 2 === 0 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)';
                ctx.beginPath();
                ctx.moveTo(px, rect.y);
                ctx.lineTo(px, rect.y + rect.height);
                ctx.stroke();

                ctx.fillStyle = '#94a3b8';
                ctx.fillText(`${t}s`, px, rect.y + rect.height + 16);
            }

            // Horizontal Velocity Gridlines (every 2 m/s)
            const yZero = this.vToPy(0);

            for (let v = this.vMin; v <= this.vMax; v += 2) {
                const py = this.vToPy(v);
                ctx.beginPath();
                if (v === 0) {
                    ctx.strokeStyle = '#38bdf8'; // Highlight v = 0 axis
                    ctx.lineWidth = 2;
                } else {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.lineWidth = 1;
                }
                ctx.moveTo(rect.x, py);
                ctx.lineTo(rect.x + rect.width, py);
                ctx.stroke();

                ctx.fillStyle = v === 0 ? '#38bdf8' : '#94a3b8';
                ctx.textAlign = 'right';
                ctx.fillText(`${v > 0 ? '+' : ''}${v}`, rect.x - 8, py + 4);
            }

            // Outer border
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

            // Axis labels
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '12px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Time t (seconds)', rect.x + rect.width / 2, rect.y + rect.height + 34);

            ctx.save();
            ctx.translate(rect.x - 38, rect.y + rect.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('Velocity v (m/s)', 0, 0);
            ctx.restore();

            // Shaded Area (Displacement Δx) up to currentTime
            if (this.chkArea && this.chkArea.checked && this.currentTime > 0) {
                this.drawAreaShading(ctx, yZero);
            }

            // Graph Line
            ctx.beginPath();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = 0; i < this.points.length; i++) {
                const px = this.tToPx(this.points[i].t);
                const py = this.vToPy(this.points[i].v);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();

            // Slope brackets / labels
            if (this.chkSlope && this.chkSlope.checked) {
                ctx.font = 'bold 11px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';

                for (let i = 0; i < this.points.length - 1; i++) {
                    const p1 = this.points[i];
                    const p2 = this.points[i + 1];
                    const dt = p2.t - p1.t;
                    if (dt <= 0) continue;

                    const a = (p2.v - p1.v) / dt;
                    const midT = (p1.t + p2.t) / 2;
                    const midV = (p1.v + p2.v) / 2;
                    const px = this.tToPx(midT);
                    const py = this.vToPy(midV) - 12;

                    const aText = Math.abs(a) < 0.05 ? 'a = 0 (Constant Speed)' : `a = ${a > 0 ? '+' : ''}${a.toFixed(1)} m/s²`;
                    ctx.fillStyle = Math.abs(a) < 0.05 ? '#38bdf8' : (a > 0 ? '#22c55e' : '#f43f5e');
                    ctx.fillText(aText, px, py);
                }
            }

            // Playhead Time Scrubber line
            const curPx = this.tToPx(this.currentTime);
            const curState = this.getKinematics(this.currentTime);
            const curPy = this.vToPy(curState.v);

            ctx.beginPath();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.moveTo(curPx, rect.y);
            ctx.lineTo(curPx, rect.y + rect.height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Dot at current velocity
            ctx.beginPath();
            ctx.arc(curPx, curPy, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#f59e0b';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draggable Keyframe Dots
            this.points.forEach((p, index) => {
                const px = this.tToPx(p.t);
                const py = this.vToPy(p.v);

                ctx.beginPath();
                ctx.arc(px, py, index === this.draggedPointIndex ? 9 : 7, 0, Math.PI * 2);
                ctx.fillStyle = index === this.draggedPointIndex ? '#facc15' : '#38bdf8';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Coordinate label
                ctx.fillStyle = '#fff';
                ctx.font = '10px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`(${p.t.toFixed(1)}s, ${p.v}m/s)`, px, py - 12);
            });
        }

        drawAreaShading(ctx, yZero) {
            ctx.save();
            const curT = this.currentTime;

            for (let i = 0; i < this.points.length - 1; i++) {
                const p1 = this.points[i];
                const p2 = this.points[i + 1];
                if (p1.t >= curT) break;

                const segStart = p1.t;
                const segEnd = Math.min(p2.t, curT);
                const dt = p2.t - p1.t;
                const a = (p2.v - p1.v) / dt;

                const vStart = p1.v;
                const vEnd = vStart + a * (segEnd - segStart);

                const x1 = this.tToPx(segStart);
                const x2 = this.tToPx(segEnd);
                const y1 = this.vToPy(vStart);
                const y2 = this.vToPy(vEnd);

                ctx.beginPath();
                ctx.moveTo(x1, yZero);
                ctx.lineTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x2, yZero);
                ctx.closePath();

                ctx.fillStyle = vStart >= 0 ? 'rgba(34, 197, 94, 0.25)' : 'rgba(244, 63, 94, 0.25)';
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // Initialize on page load
    window.addEventListener('DOMContentLoaded', () => {
        window.app = new VelocityVisualizerApp();
    });
})();

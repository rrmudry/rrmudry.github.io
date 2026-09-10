# Pattern: Two-Vehicle Kinematic Intercept Challenge & Dual-Engine Visualizer

> Architecture and implementation guide for multi-agent 1D motion simulations, real-time dual-curve graph synchronizers, procedural Web Audio SFX, and competitive classroom intercept challenges.

---

## 1. Overview & Pedagogical Purpose

The **Two-Vehicle Kinematic Intercept Challenge** transforms classic 1D kinematics word problems ("When and where will Car A and Car B meet?") into a high-engagement, projector-friendly team competition:
- **Core Standard**: NGSS `HS-PS2-1` (Analyze data to support the claim that Newton's second law of motion describes the mathematical relationship among net force, mass, and acceleration; 1D Kinematics and graphical analysis).
- **Core Concept**: System of linear kinematic equations:
  $$x_A(t) = x_{0A} + v_A \cdot t$$
  $$x_B(t) = x_{0B} + v_B \cdot t$$
  Equating $x_A(t_{meet}) = x_B(t_{meet})$ yields:
  $$(v_A - v_B) \cdot t_{meet} = x_{0B} - x_{0A} \implies t_{meet} = \frac{\Delta x}{\Delta v}$$
  $$x_{meet} = x_{0A} + v_A \cdot t_{meet}$$
- **Authentic Pedagogical Value**: Connects the physical motion on a 1D runway directly to the graphical representation of two lines intersecting on a Position vs. Time ($x-t$) coordinate plane.

---

## 2. Architecture & Canvas Synchronization

### A. Dual Synchronized Canvases
1. **Track Runway Canvas (`trackCanvas`)**:
   - Renders a 1D physical roadway from -20m to 220m (total span 240m), with $x = 0$ clearly designated by a checkered origin marker and finish line banner at 200m.
   - Distinctive car models:
     - **Car A (Cyan)**: Futuristic aerodynamic wedge speedster with glowing headlights and cyan exhaust glow.
     - **Car B (Amber / Rose)**: Compact rear-engine sports roadster with amber highlights and exhaust trail.
   - Vector arrows overlaid directly on top of each vehicle indicating instantaneous velocity $\mathbf{v}$.
   - Collision/Intercept shockwave burst triggered at $t = t_{meet}$.
2. **Position vs. Time Graph Canvas (`graphCanvas`)**:
   - X-axis: Time $t \in [0, 12\text{s}]$ with grid increments of 1s and 2s.
   - Y-axis: Position $x \in [-20\text{m}, 220\text{m}]$ with grid increments of 20m and 50m.
   - Color-coded solid linear trajectories for Car A (Cyan) and Car B (Amber).
   - Prominent intersection node marked with glowing concentric rings and coordinates: `(t_meet, x_meet)`.
   - Sweeping vertical time-cursor line synchronized with the active simulation clock.

---

## 3. Clean Randomized Challenge Generator

To support authentic whiteboard calculations without calculator artifacts or endless repeating decimals, random values must satisfy:
1. Integer or clean half-second times ($t_{meet} \in \{2.0, 2.5, 3.0, \dots, 8.0\}\text{ s}$).
2. Integer velocities ($v \in \{\pm 4, \pm 6, \dots, \pm 14\}\text{ m/s}$).
3. Starting positions and meeting points strictly bounded within $[0, 195\text{ m}]$.

```javascript
function generateChallenge(mode) {
    const cleanTimes = [2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 7.0, 8.0];
    
    if (mode === 'headon') {
        // Car A moves forward, Car B moves backward towards each other
        for (let attempt = 0; attempt < 100; attempt++) {
            const candidateT = cleanTimes[Math.floor(Math.random() * cleanTimes.length)];
            const candidateVA = (Math.floor(Math.random() * 5) + 3) * 2; // 6..14 m/s
            const candidateVB = -(Math.floor(Math.random() * 4) + 2) * 2; // -4..-10 m/s
            const candidateX0A = Math.floor(Math.random() * 4) * 10; // 0, 10, 20, 30 m
            const candidateX0B = candidateX0A + (candidateVA - candidateVB) * candidateT;
            const candidateXMeet = candidateX0A + candidateVA * candidateT;

            if (candidateX0B <= 195 && candidateXMeet <= 190 && candidateXMeet >= 15) {
                return { tMeet: candidateT, vA: candidateVA, vB: candidateVB, x0A: candidateX0A, x0B: candidateX0B, xMeet: candidateXMeet };
            }
        }
    }
    // ...
}
```

---

## 4. Procedural Web Audio Engine (Zero External Assets)

Never rely on external `.mp3` or `.wav` files that could fail due to CORS or slow CDNs. Use Web Audio API oscillators:

- **Engine Ignition / Rev**: Low frequency sawtooth oscillator ramping from 50Hz to 120Hz with soft lowpass filtering.
- **Success Chime**: Tri-tone arpeggio (C5 - E5 - G5) with exponential decay gain envelopes.
- **Error Buzzer**: Low square wave (110Hz to 85Hz) with rapid decay.
- **Crash / Intercept Burst**: White noise buffer generator paired with resonant bandpass filter and low frequency thud.
- **Stopwatch Tick**: Short 800Hz sine blip (0.015s duration) on each whole second.

---

## 5. Classroom Competition & Whiteboard Sprint Rules

1. Teacher projects the simulation on the main board in **Fullscreen Mode (`F`)**.
2. Teacher clicks **"New Challenge" (`N`)**; conditions ($x_{0A}, v_A, x_{0B}, v_B$) are displayed on large digital HUD cards and the stopwatch starts automatically.
3. Student teams work on handheld whiteboards using algebraic substitution:
   - Isolate $t$: $t = \frac{x_{0B} - x_{0A}}{v_A - v_B}$
   - Solve for position: $x = x_{0A} + v_A \cdot t$
4. First team to finish calls out or enters their predictions in the Team Competition HUD.
5. The webapp calculates relative error tolerance:
   - Accurate within $\pm 0.1\text{ s}$ and $\pm 1.5\text{ m}$ is scored as a **Perfect Match (Bullseye)**.
   - Accurate within $\pm 0.3\text{ s}$ and $\pm 3.0\text{ m}$ is scored as an **Acceptable Intercept**.
6. Leaderboard ranks teams dynamically by Accuracy then elapsed calculation time.
7. Click **"Run Simulation" (`Space`)** to verify prediction with live animated cars meeting at the exact crosshair on both the track and the graph!

---

## 6. Team Authentication, Anti-Cheating Lockout & Graph Gating

### A. Google Team Auth & Profile Bar
- Single member signs in with school Google account (`fbAuth.signInWithPopup(provider)`).
- Customizes Team Name, Collaborators, and Period (defaulting to Period 0 Honors Physics).
- Persisted locally in `localStorage['two_car_team_data']` and broadcast in the top navigation header.

### B. Graph Concealment during Calculation
- Problem: The Position vs. Time ($x-t$) graph visually displays the exact intersection point $(t_{meet}, x_{meet})$, which would allow students to bypass algebra.
- Solution: Shroud the graph canvas under a `#graph-lock-curtain` overlay with `backdrop-blur-md` during the calculation phase.
- Revelation: Unlocks dynamically with `unlockGraph()` when the student submits predictions or clicks **Run Verification Race**.

### C. Academic Integrity Tab/Window Switch Disqualification (0 Points)
- Detects `visibilitychange` (tab switch or browser minimize) and `window.blur` (switching to another desktop application or external solver) while the round calculation stopwatch is running.
- Immediately stops the timer, plays an alert buzzer, and records an automatic **0 points** score on the leaderboard and Firestore (`status: 'DISQUALIFIED (0 pts) ⚠️'`).
- Displays a non-blocking toast alert (`#disqualification-toast`) informing the student of the disqualification and instructing them to click **New Challenge** to attempt the next round.
- Removes teacher overhead: No PIN codes (`mudry2026`) or manual unlocks required; the team can immediately proceed to the next challenge while taking a zero for the compromised round.

### D. Real-Time Cloud Leaderboard
- Submissions written to Firestore collection `two_car_intercept_submissions`.
- Real-time `onSnapshot` query automatically streams class-wide rankings to the projector and student devices.


# Modular Vehicle Physics Game Pattern

## Overview
The **Modular Vehicle Physics Game** architecture models real-world 1D Newtonian dynamics ($F_{\text{net}} = m \cdot a$), kinematics, aerodynamic drag, and tire friction limits through an interactive drag racing loop. Students solve curriculum-aligned physics challenges in an academic proving grounds (Dyno Lab) to earn in-game cash, unlock mystery crates containing modular vehicle parts, upgrade and tune their build, and race head-to-head against ghost cars designed by other students.

---

## Key Architectural Components

### 1. Modular Vector & Canvas Asset Pipeline (`assets.js`)
* **Slot-Based Modularity**: 6 distinct component slots:
  - `chassis`: Base mass, frame geometry, aerodynamic frontal area.
  - `engines`: Drive force ($F_{\text{drive}}$), power curve, block mass.
  - `wheels`: Tire static friction coefficient ($\mu$), rotational inertia, mass.
  - `aero`: Downforce, aerodynamic drag area modifier ($C_d A$).
  - `exhaust`: Sound synthesis profile, flame/smoke particle effects, nitrous boost.
  - `charms`: Quirky decals, hood ornaments, dynamic mirror dice with acceleration sway.
* **Dual Rendering**:
  - Standalone SVG markup (`getPartSVG`) for responsive HTML cards and unboxing reveals.
  - Layered Canvas rendering (`drawRatRodCanvas`) with dynamic chassis squat under acceleration, wheel spin, and exhaust fire.

### 2. SI-Unit Physics Simulation Engine (`physics.js`)
* **Internal SI Standards**: Meters ($m$), seconds ($s$), kilograms ($kg$), and Newtons ($N$).
* **Newtonian Dynamics**:
  - $F_{\text{traction\_max}} = \mu \cdot m_{\text{total}} \cdot g$
  - Tire slip mechanic: If $F_{\text{drive}} > F_{\text{traction\_max}}$, wheels break traction, tires screech/smoke, and forward force is reduced to kinetic friction ($0.88 \cdot F_{\text{traction\_max}}$).
  - Aerodynamic drag: $F_{\text{drag}} = \frac{1}{2} \cdot \rho \cdot C_d A \cdot v^2$ (air density $\rho = 1.225\text{ kg/m}^3$).
  - Net force: $F_{\text{net}} = F_{\text{drive\_effective}} - F_{\text{drag}} - F_{\text{roll}}$.
  - Net acceleration: $a = F_{\text{net}} / m_{\text{total}}$.
  - Semi-implicit Euler integration with $dt$ capped at $0.05\text{ s}$.

### 3. Academic Proving Grounds Economy (`challenges.js`)
* **Core Competencies**:
  - Newton's 2nd Law ($F = ma$, $a = F/m$, $m = F/a$).
  - Kinematic Graphs ($x-t$ slope = velocity; $v-t$ slope = acceleration).
  - Multi-Trial Data Tables (varying mass with constant force).
  - Traction & Grip Thresholds ($F_{\text{grip}} = \mu m g$).
* **Gamified Economy**:
  - Bank cash rewards per problem ($75 to $200).
  - Streak multipliers ($1.25\times$, $1.5\times$, $2.0\times$) to incentivize careful work.
  - Step-by-step diagnostic feedback.

### 4. Asynchronous Peer Ghost Racing & Share Codes (`cars.js`)
* **Share Codes**: Compact base64-encoded strings (`ROD-...`) encoding part IDs and upgrade levels.
* **Opponent Ghosts**: Enables offline, classroom, and head-to-head racing against classmates or pre-configured student rivals.

### 5. Interactive Dual-Car Telemetry Viewer (`telemetry.js`)
* Post-race timeslip (Reaction Time, 60 ft, 330 ft, 1/8 mi, 1/4 mi ET & Trap Speed).
* Side-by-side comparative curves ($x-t$, $v-t$, $a-t$, $F_{\text{net}}-t$) with scrubbing cursor and physical annotations.

---

## Known Pitfalls & Best Practices
- **Audio Synthesis**: Use Web Audio API oscillators and bandpass filtered noise to synthesize rich engine rumbles, revs, and tire squeals without requiring external audio files.
- **Dyno Lab Multi-Click Exploit Prevention**:
  - In student economies where academic challenges award in-game currency, students will attempt rapid-fire button clicking or holding down the `Enter` key on number inputs to farm unlimited bank funds.
  - **Triple-Lock Patch**:
    1. **Model-Level Answer State**: Set `this.currentChallenge.answered = true` synchronously during the first evaluation in `checkAnswer()`. Return `{ alreadyAnswered: true, earnedCash: 0 }` on any subsequent evaluations of that same challenge.
    2. **UI Submission Lock & Immediate Button Hiding**: Flag `this.isSubmittingDyno = true`, disable the input field (`inputEl.disabled = true`), and immediately hide/disable the Check Answer button while displaying the Next Question button.
    3. **Keydown Enter Advancement**: In the `keydown` listener, test if the current challenge has already been answered. If already answered, treat `Enter` as advancing to the next challenge (`loadNextDynoChallenge()`) instead of re-submitting.
- **Student Google Authentication & Firestore Cloud Backup**:
  - Require sign-in through official school Google accounts (`@orangeusd.org`) using `firebase.auth.GoogleAuthProvider` with `{ hd: 'orangeusd.org', prompt: 'select_account' }`.
  - Back up student state to `student_results/Rat_Rod_Racers/students/{studentId}`:
    - Bank cash, owned parts with fusion levels, equipped car specifications, race records (best ET, best trap speed, win/loss count), and dyno answer streaks.
  - Maintain student-scoped local storage keys (`rat_rod_save_${studentId}`) alongside cloud persistence for instant load times and offline resiliency.
  - Trigger debounced auto-saves (`autoSave()`) whenever parts are equipped, upgraded, scrapped, crates are opened, races finish, or dyno challenges are answered.
- **Unified Visual Consistency (Preview vs Track)**:
  - When students customize a vehicle in a garage preview and subsequently race it on a track, they expect the visual assets to reasonably match. Avoid relying on disparate 3/4 isometric preview images that cannot seamlessly translate onto a 2D side-view physics canvas.
  - Implement a **Unified Vector & Canvas Cartoon Drawing Engine**:
    - **Bold Ink Outlines** (`#12121c`, 2.4–2.8px with rounded caps/joins) on all chassis bodies, scoops, wheels, and wings.
    - **Two-Tone Cel Shading**: Underbody dark tones coupled with high-contrast curved white gloss highlights along upper contours.
    - **Shared Composite Rendering**: Both the garage lift stand canvas and the dynamic drag strip canvas must execute the exact same composite function (`drawRatRodCanvas()`), ensuring identical proportions, rake angles, and animations (chassis squat, spinning wheels, opening butterfly valves, and spitting cartoon flames).
    - **Matching SVG Cards**: Mirror the stroke weights, cel shading, and color schemes in `getPartSVG()` so mystery crate drops and inventory cards 100% align with what is mounted on the vehicle.


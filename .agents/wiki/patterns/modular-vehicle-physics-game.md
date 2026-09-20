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

### 6. Driver Scoring & Championship Points (`inventory.js`)
* **Base Victory Points**: +30 pts for crossing the finish line first.
* **Underdog Bonus**: +0.15 pts per PI difference (up to +30 pts) when defeating a car with a higher Performance Index.
* **Reaction Time Holeshot Bonus**: +25 pts (< 0.20 s), +15 pts (< 0.35 s), +5 pts (< 0.50 s) for quick reaction off the green light.
* **Win Streak Bonus**: +5 pts (2 wins), +10 pts (3 wins), +20 pts (5+ wins).
* **Dyno Lab Academic Bonus**: +15 pts per successfully answered physics challenge.
* **Non-Punitive High School Gamification**: +5 participation points on losses (never deduct points) and streak resets to 0.

### 7. Performance Index (PI) & Dynamic Matchmaking (`cars.js`, `game.js`)
* **PI Metric (200 to 1000+)**:
  $PI = \text{round}\left(100 + \frac{F_{\text{peak}}}{m} \times 55 + (\mu \times 120) - (C_d A \times 100) + (\text{level\_sum} \times 15)\right)$
* **Class Tiers**:
  - Class D (200–449): Rookie Jalopy
  - Class C (450–599): Street Tuner
  - Class B (600–749): Hot Rod Custom
  - Class A (750–899): Pro Mod Gasser
  - Class S (900+): Top Fuel Rail
* **Matchmaking Logic (`autoMatchOpponent`)**:
  - Scans active opponent roster and selects the rival minimizing $|PI_{\text{opponent}} - PI_{\text{player}}|$.
  - Visual Matchup Difficulty Badge indicates `FAIR MATCH` ($|\Delta PI| \le 40$), `MODERATE` ($|\Delta PI| \le 100$), `UNDERDOG` ($PI_{\text{opp}} > PI_{\text{player}} + 100$), or `ADVANTAGE` ($PI_{\text{player}} > PI_{\text{opp}} + 100$).
  - One-click "Auto-Match" button allows students to instantly stage a closely-matched rival.

### 8. Cloud Leaderboard & Ghost Staging (`auth_manager.js`, `game.js`)
* Real-time query against Firestore collection `student_results/Rat_Rod_Racers/students`.
* In-memory sorting eliminates the requirement for composite Firestore indexes:
  - Toggle between **Championship Points** (descending) and **Fastest 1/4-Mile ET** (ascending).
* "Race Ghost" action button directly stages any leaderboard car (equipped parts & levels) into Lane 2 on the drag strip for immediate head-to-head racing.

### 9. Embedded Desmos Scientific Calculator Station (`index.html`, `style.css`, `game.js`)
* **Proving Grounds Side-by-Side Layout**:
  - Two-column responsive layout on desktop/Chromebooks (`1.15fr 0.85fr`, `max-width: 1240px`).
  - Challenge prompt, graphs, and data tables on the left; official CAST-aligned Desmos Scientific Calculator on the right.
  - Automatically collapses to stacked format with a smooth mobile jump toggle button on narrow screens (`< 960px`).
* **Dual Resilience (API + Embed Fallback)**:
  - Primary: Native `Desmos.ScientificCalculator` API instance (`apiKey=dcb31709b452b1cf9dc26972add0fda6`) with compact font sizing and native dark-frame aesthetic.
  - Fallback: Iframe embed (`https://www.desmos.com/scientific?embed`) automatically engaged if the script is blocked or offline.
* **Quick Telemetry Formula Reference**:
  - Displays plain text & Unicode formulas directly beneath the calculator:
    - Newton's 2nd Law: $a = F_{\text{net}} / m$, $F_{\text{net}} = m \cdot a$
    - Traction Limit: $F_{\text{max}} = \mu \cdot m \cdot g$ ($g = 9.8\text{ m/s}^2$)
    - Kinematic Slopes: $v = \Delta x / \Delta t$, $a = \Delta v / \Delta t$

---

## Known Pitfalls & Best Practices
- **Desmos Dimensioning & Resizing in Hidden Tabs**:
  - Initializing a Desmos calculator inside a container with `display: none` can lead to 0x0 initial canvas bounds. Always trigger `desmosCalculator.resize()` inside `switchTab('dyno')` after a short 50–60ms delay when the panel becomes visible.
  - Provide a collapsible container toggle (`#btn-dyno-calc-collapse`) so students can minimize the calculator if working on small laptop screens.
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
    - Bank cash, owned parts with fusion levels, equipped car specifications, race records (best ET, best trap speed, win/loss count), driver championship score, win streak, car PI, and car class.
  - Maintain student-scoped local storage keys (`rat_rod_save_${studentId}`) alongside cloud persistence for instant load times and offline resiliency.
  - Trigger debounced auto-saves (`autoSave()`) whenever parts are equipped, upgraded, scrapped, crates are opened, races finish, or dyno challenges are answered.
- **Instant Baseline Leaderboard & Tab Panel Nesting**:
  - In multi-tab webapps, omitting a closing `</section>` tag causes subsequent tab panels to be parsed as children of the preceding tab. When the parent tab is given `.hidden` (`display: none !important;`), the child tab is also completely hidden and appears blank/empty to the user. Always ensure all `<section class="tab-panel">` tags are strictly closed before opening the next tab panel.
  - To prevent an empty table or spinner stall while waiting for network/Firestore requests, render an **Instant Baseline Leaderboard** immediately using local player data and the benchmark student ghost roster. Race asynchronous Firestore requests against a 3.5s timeout, updating the table seamlessly when cloud data resolves.
- **Client-Side Leaderboard Sorting**:
  - Fetching the Firestore subcollection and performing sorting in JavaScript allows instant tab toggles between Points and 1/4-Mile ET without triggering Firestore index errors or requiring Google Cloud Console index creation.
- **Unified Visual Consistency (Preview vs Track)**:
  - When students customize a vehicle in a garage preview and subsequently race it on a track, they expect the visual assets to reasonably match. Avoid relying on disparate 3/4 isometric preview images that cannot seamlessly translate onto a 2D side-view physics canvas.
  - Implement a **Unified Vector & Canvas Cartoon Drawing Engine**:
    - **Bold Ink Outlines** (`#12121c`, 2.4–2.8px with rounded caps/joins) on all chassis bodies, scoops, wheels, and wings.
    - **Two-Tone Cel Shading**: Underbody dark tones coupled with high-contrast curved white gloss highlights along upper contours.
    - **Shared Composite Rendering**: Both the garage lift stand canvas and the dynamic drag strip canvas must execute the exact same composite function (`drawRatRodCanvas()`), ensuring identical proportions, rake angles, and animations (chassis squat, spinning wheels, opening butterfly valves, and spitting cartoon flames).
    - **Matching SVG Cards**: Mirror the stroke weights, cel shading, and color schemes in `getPartSVG()` so mystery crate drops and inventory cards 100% align with what is mounted on the vehicle.


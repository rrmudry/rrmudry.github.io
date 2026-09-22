# Modular Vehicle Physics Game Pattern

## Overview
The **Modular Vehicle Physics Game** architecture models real-world 1D Newtonian dynamics (F_net = m · a), kinematics, aerodynamic drag, tire friction limits, non-linear wheelspin penalties, and thermal degradation through an interactive drag racing loop. Students assemble custom rat rods under a strict 20-point Jalopy Budget Cap, race across 5 canonical track environments, inspect dual-car telemetry curves (including engine temperature and wheelspin loss), solve curriculum-aligned physics challenges in an academic proving grounds (Dyno Lab), and race against peer ghosts.

---

## Key Architectural Components

### 1. Five Canonical Slots & Jalopy Budget Cap (`assets.js`, `cars.js`)
* **5 Canonical Slots**:
  - `powertrain`: Drive force (F_drive), power curve, block mass, heat generation rate, front weight bias shift, and quirks (e.g. Blower Surge, Rolling Coal turbo lag, Boost Creep, Tractor Chug).
  - `chassis`: Base mass, frame geometry, center of gravity height (h_CG), aerodynamic drag area (CdA), structural durability, and flex.
  - `suspension`: Front/rear axle geometry, suspension travel, roll stiffness, weight transfer compliance (kappa), and rough ground tolerance.
  - `wheels`: Tire compound static friction coefficient (μ), tire width, sidewall compliance, rotational inertia, and track surface suitability.
  - `ancillary`: Quirks, cooling capacity (radiator area & grille airflow), front/rear weight ballast, lakester exhaust power boost, and mechanical belt sirens.
* **Jalopy Budget Cap (20 Points)**:
  - Enforces deck-building horizontal tradeoffs: overpowered components (e.g., 6-71 Blown 454 = 7 pts; Chopped '32 Coupe = 5 pts; Cheater Slicks = 4 pts; Suicide Spool = 4 pts) consume 20 / 20 points, leaving zero budget for cooling or rough terrain compliance.
  - Real-time garage budget meter and staging gate: cars exceeding 20 points are flagged invalid and cannot stage or race until balanced.

### 2. Coupled Non-Linear Physics Simulation Engine (`physics.js`)
* **Internal SI Standards**: Meters (m), seconds (s), kilograms (kg), and Newtons (N).
* **Launch Traction & Weight Transfer Equation**:
  - Dynamic weight transfer: ΔW_transfer = (a · h_CG / L_wheelbase) · M_total
  - Rear normal force: W_rear = M_total · (1 - Bias_front) + ΔW_transfer + M_total · sin(θ_grade)
  - Effective friction: μ_eff = μ_base · C_track_surface · C_tire_suitability · (1 + κ_susp · ΔW_transfer / M_total)
  - Static traction limit: F_traction_max = μ_eff · W_rear · g (with g = 10 m/s²)
* **Non-Linear Wheelspin Penalty**:
  - If F_engine > F_traction_max:
    - ΔF_excess = F_engine - F_traction_max
    - F_wheelspin = ΔF_excess · (1 - e^(-λ · ΔF_excess)) [λ ≈ 0.0012]
    - F_forward = max(0, F_traction_max - F_wheelspin)
    - Tire burnout actively reduces forward thrust BELOW the static traction limit, teaching students that excessive torque on skinny tires hurts launch performance!
* **Thermal Accumulation & Overheat Degradation**:
  - Combustion heat builds with throttle; cooled by radiator area, forward vehicle air velocity, and grille airflow:
    dT/dt = (P_heat - Q_cooling) / C_thermal
  - When engine temperature T > T_critical (225°F):
    Power Multiplier = max(0.35, 1.0 - 0.015 · (T - T_critical)^1.5)
* **Track Environmental Interplay**:
  - Incline gravitational resistance: F_grade = M_total · g · sin(θ_grade)
  - Surface roughness bottoming drag: F_bottoming = max(0, Roughness - Susp_Travel) · 1850 · (v / 18)

### 3. Five Canonical Track Environments (`assets.js`, `game.js`)
1. **Abandoned Airfield Drag**: Wide rubbered asphalt (Grip: 1.10, Roughness: 0.05, Flat). Favors Blown Gassers.
2. **Bonneville Salt Flats**: Polished salt bed (Grip: 0.82, Roughness: 0.02, Low air drag). Favors Salt Speedsters; overheats high-drag setups.
3. **Dead Man's Dirt Strip**: Rutted clay & mud (Grip: 0.55, Roughness: 0.85). Low-travel suspensions bottom out with massive drag; favors Moonshine Mud-Runners.
4. **Quarry Incline Drag**: Steep +7.5° uphill loose gravel (Grip: 0.75, Grade: +7.5°). Relentless torque and weight win; favors Junkyard Diesel Bruisers.
5. **Smokey Mountain Pass**: Undulating technical tarmac (Grip: 0.95, Roughness: 0.30). Agile 50/50 balance and low roll inertia excel; favors Chop-Top Rattlers.

### 4. Academic Proving Grounds Economy (`challenges.js`)
* **Core Competencies**:
  - Newton's 2nd Law (F = ma, a = F/m, m = F/a).
  - Kinematic Graphs (x-t slope = velocity; v-t slope = acceleration).
  - Multi-Trial Data Tables (varying mass with constant force).
  - Traction & Grip Thresholds (F_grip = μ · W_rear · g).
* **Gamified Economy**:
  - Bank cash rewards per problem ($75 to $200).
  - Streak multipliers (1.25x, 1.5x, 2.0x) to incentivize careful work.
  - Step-by-step diagnostic feedback.

### 5. Interactive Dual-Car Telemetry Viewer (`telemetry.js`)
* Post-race timeslip (Reaction Time, 60 ft, 330 ft, 1/8 mi, 1/4 mi ET & Trap Speed).
* 6 Comparative Telemetry Curves:
  - Position (x-t)
  - Velocity (v-t)
  - Acceleration (a-t)
  - Net Force (F_net-t)
  - Engine Temperature (T-t) with critical 225°F overheat threshold indicator
  - Wheelspin Loss (F_spin-t) showing launch traction blowout
* Interactive scrubbing cursor with exact physical unit readouts.

### 6. Driver Scoring & Championship Points (`inventory.js`)
* **Base Victory Points**: +30 pts for crossing finish line first.
* **Underdog Bonus**: +0.15 pts per PI difference (up to +30 pts) when defeating a higher-PI car.
* **Reaction Time Holeshot Bonus**: +25 pts (< 0.20 s), +15 pts (< 0.35 s), +5 pts (< 0.50 s).
* **Win Streak Bonus**: +5 pts (2 wins), +10 pts (3 wins), +20 pts (5+ wins).
* **Dyno Lab Academic Bonus**: +15 pts per successfully answered physics challenge.
* **Non-Punitive High School Gamification**: +5 participation points on losses (never deduct points).

### 7. Performance Index (PI) & Five-Class Classification (`cars.js`)
* **Class Tiers**:
  - Class D (200–449): Rookie Jalopy
  - Class C (450–599): Street Tuner
  - Class B (600–749): Hot Rod Custom
  - Class A (750–899): Pro Mod Gasser
  - Class S (900+): Top Fuel Rail

### 8. Cloud Leaderboard, Privacy Sanitization & Ghost Staging (`auth_manager.js`, `game.js`)
* Real-time query against Firestore collection `student_results/Rat_Rod_Racers/students`.
* In-memory sorting eliminates the requirement for composite Firestore indexes:
  - Toggle between Championship Points and Fastest 1/4-Mile ET.
* **FERPA-Compliant Student Name Sanitization**: All public leaderboards, opponent dropdowns, and ghost challenge staging strip student last names to First Name + Last Initial (e.g., `formatStudentDriverName("Johnathan Smith")` -> `"Johnathan S."`). Accurately parses school email prefixes (`john.smith@...` -> `John S.`), roster inversion (`Smith, John` -> `John S.`), and period tags (`Smith, John (Period 3)` -> `John S. (Period 3)`), protecting student privacy on shared classroom projector screens.
* "Race Ghost" action button directly stages any leaderboard car into Lane 2.

### 9. Embedded Desmos Scientific Calculator Station (`index.html`, `game.js`)
* Official CAST-aligned Desmos Scientific Calculator rendered side-by-side with challenge prompts.
* Automatic resize on tab reveal (`desmosCalculator.resize()`).
* Quick telemetry formula reference displaying clean plain text / Unicode formulas (strict No-LaTeX compliance).

### 10. Ambient Banner Background & Adaptive Tab Dimming (`style.css`, `game.js`, `index.html`)
* Fixed background compositor layer (`.app-bg-fixed > .app-bg-image + .app-bg-overlay`) renders `assets/banner.jpg` across the entire application viewport without interfering with scroll performance.
* **Tab-Specific Adaptive Dimming**:
  - Dense/academic tabs (`race`, `garage`, `leaderboard`, and especially `dyno`) automatically dial down banner opacity (0.13–0.18) with a soft blur and dark radial/linear vignette so formulas, customizers, and data tables remain crisp with zero contrast loss.
  - Showcase tabs (`crates`) increase opacity (0.38) and reduce blur to reveal the artwork during part unboxing.
* **User Control**: Optional header dimmer button allows manual cycling between `Auto (Tab-Adaptive)`, `Dark (High-Contrast Focus)`, and `Vibrant` saved to `localStorage`.

---

## Known Pitfalls & Best Practices
- **No LaTeX Math Notation**: Never use `$v = x/t$` or `\Delta` in HTML labels or telemetry. Use `Δx / Δt`, `m/s²`, and bold font weights for vectors (`<strong>F</strong> = m · <strong>a</strong>`).
- **Student Privacy & FERPA Compliance on Leaderboards**: Never render full student surnames on shared classroom screens or public leaderboard tables. Always apply `formatStudentDriverName` across Firestore data retrieval, local storage baseline population, and DOM rendering so all names display strictly as First Name + Last Initial.
- **Background Banner Readability in Educational Webapps**: When using rich scenic hot rod artwork as a global page backdrop, never leave it undimmed. Content-heavy interfaces (physics formulas, Desmos calculators, 5-slot customizers) require a minimum 80–90% dark vignette overlay and 0.14–0.18 image opacity to prevent visual clutter and eye strain.
- **Jalopy Budget Enforcement at Staging**: Never allow over-budget cars onto the track. Synchronize budget validation between the garage, HUD pill, and staging button. If over-budget, display clear diagnostic feedback showing the exact deficit so students can downgrade or tune parts.
- **Desmos Dimensioning in Hidden Tabs**: Trigger `desmosCalculator.resize()` on tab unhide after a 50–60ms delay to prevent 0x0 canvas collapse.
- **Dyno Lab Multi-Click Exploit Prevention**: Synchronously lock `challenge.answered = true`, disable input fields, and swap to the Next Question button immediately upon first submission.
- **Tire Suitability Scaling**: When introducing varied surfaces (mud, salt, gravel), always scale friction dynamically based on tire tread design (`_calcTireTrackMultiplier`) to avoid dominant universal builds.

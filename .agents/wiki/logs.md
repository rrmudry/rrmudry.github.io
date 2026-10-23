# Wiki Evolution Log

Append-only log tracking pattern changes across recent sessions.
> Historical evolution entries prior to September 23, 2026 are archived in [logs-archive-2026.md](logs-archive-2026.md).

## 2026-10-23 — Curriculum Progression: Day 40 CAST 3D Performance Task Bell-Ringer (`assets/lessons-data.js` & `Unit_2/outline.md`)
**Patterns Updated**: `bell-ringer-config.md`.
**Files Updated**: `assets/lessons-data.js`, `Unit_2/outline.md`, `unit2-dashboard.html`, `partials/footer.html`.

**Changes**:
- **Upgraded Day 40 Bell-Ringer to Authentic CAST 3D Performance Task**:
  - Replaced the passive "deep breath / formula check" text prompt on Day 40 with a multi-step **CAST 3D Performance Task: Autonomous Delivery Pod Emergency Braking & Stopping Distance Telemetry** (`cast_challenge`).
  - Aligned 3D components: `HS-PS2.A: Forces & Motion` (DCI), `SEP-5: Mathematical & Computational Thinking` (SEP), `CCC-2: Cause & Effect / Scale & Proportion` (CCC).
  - Configured 4 scaffolded performance steps:
    1. **Part 1 (Cloze Dropdown)**: Vector directions and signs (stopping force opposite forward motion, negative deceleration), and inverse mass scaling ($F_{\text{net}} = m \cdot a \implies$ doubling mass cuts acceleration in half and increases stopping distance).
    2. **Part 2 (Data Calculation)**: Quantitative deceleration calculation ($a = (v - v_0) / \Delta t = -6.0\text{ m/s}^2$, target magnitude $6.0\text{ m/s}^2$).
    3. **Part 3 (Data Calculation)**: Net horizontal braking force calculation ($F_{\text{net}} = m \cdot a = 800\text{ kg} \cdot 6.0\text{ m/s}^2 = 4,800\text{ N}$).
    4. **Part 4 (AI Reasoning Chat)**: Defending Newton's 3rd Law road-tire interaction pairs ($F_{\text{road on tires}} = -F_{\text{tires on road}}$) with the AI Physics Mentor.
  - Strictly enforced the site-wide No-LaTeX policy (Unicode `Δt`, `v₀`, `m/s²`, standard fractions).
  - Synchronized `Unit_2/outline.md` Day 40 documentation, bumped cache buster in `unit2-dashboard.html` (`v=20261023`), and refreshed footer deployment timestamp.

## 2026-10-22 — Interactive Game Architecture: Epic 3D Tic-Tac-Toe 2077 & 4×4×4 Qubic Rebuild (`epic-ttt/`)
**Patterns Added**: `epic-3d-ttt-and-qubic.md`.
**Patterns Updated**: `classroom-projection-and-high-contrast-theming.md`.
**Files Created/Updated**: `epic-ttt/index.html`, `epic-ttt/styles.css`, `epic-ttt/game.js`, `partials/footer.html`.

**Changes**:
- **Rebuilt Game Architecture from Bloated Vite Bundle to Clean Native Vanilla Stack**:
  - Replaced the fixed 400x500px React bundle with a modular, responsive vanilla webapp (`epic-ttt/index.html`, `epic-ttt/styles.css`, `epic-ttt/game.js`).
  - Added **4×4×4 Qubic Mode (64 cells, 76 lines)** alongside 3×3×3 Classic (27 cells, 49 lines), solving the first-player center-trick forced win and offering chess-like depth.
  - Implemented **3 AI Difficulty Tiers**: Rookie (Easy), Tactician (Medium), and Cyber-Master (Unbeatable / Expert) featuring Minimax Alpha-Beta pruning for 3x3x3 and 2-ply threat-lookahead with fork detection for 4x4x4 Qubic.
  - Added **Local 2-Player Pass & Play Mode** for peer challenges and classroom tournaments.
  - Added **Interactive Dual-View Board**: 3D perspective cube with mouse/touch drag rotation, camera quick-snaps, elevation/gap slider, auto-spin, alongside an exploded 2D layer slice view with synchronized cross-layer hover and coordinate inspector.
  - Integrated **Real-Time Threat Radar**: Highlights lines with $N-1$ marks to train 3D spatial reasoning.
  - Integrated zero-asset **Web Audio API polyphonic sound synthesizer** (move clicks, threat pings, win/loss fanfares).
  - Enforced full site compliance: WCAG AAA High-Contrast Light Mode (`#btn-theme-toggle`), universal root font scaling (Normal, Large, Projector), zero unpkg, zero Babel.

## 2026-10-22 — Curriculum Progression: Day 39 Differentiated Schedule (Rocket Launch P0,4,5,6 & Catch-Up Studio P1,2,3)
**Files Updated**: `assets/lessons-data.js`, `Unit_2/outline.md`, `unit2-dashboard.html`, `partials/footer.html`.

**Changes**:
- **Single Source of Truth (`assets/lessons-data.js`) Day 39 Alignment**:
  - Differentiated Day 39 (`2026-10-22`) curriculum for the two distinct cohort tracks:
    - **Periods 0, 4, 5, 6 (Physics & Honors Physics)**: **Cardstock Rocket Phase 2 Launch Operations**. Outdoor pneumatic launches at 80–100 PSI testing isolated engineering variables (mass ballast, fuselage length, fin profile, or nose cone), recording 3-timer flight telemetry (hang time, apogee altitude, ground range), and placing touchdown coordinates on the Leaflet campus recovery map (`Unit_2/rocket_phase2/index.html`).
    - **Periods 1, 2, 3 (Conceptual Physics)**: **Unit 2 Catch-Up & Lab Revision Studio**. Dedicated in-class work session for completing, revising, and submitting the **Hot Wheels Coasting Baseline Lab** (`Unit_2/hot_wheels_coasting/index.html`) and **Hot Wheels Wind Resistance & Air Brake Lab** (`Unit_2/hot_wheels_air_resistance/index.html`), supported by dual-layer local and cloud auto-save.
  - Formatted daily lesson card with clear track headers (`🚀 Periods 0, 4, 5, 6` and `🏎️ Periods 1, 2, 3`), distinct essential questions, structured assignments, and practice tools.
  - Included explicit NGSS standards array: `["HS-PS2-1", "HS-ETS1-2", "HS-PS2-2"]`.
  - Upheld all site policies: zero LaTeX syntax (plain text / Unicode formulas only), zero teacher keys exposed.
- **Coursework Outline & Dashboard Cache Busters**:
  - Updated `Unit_2/outline.md` Day 39 entry to document both tracks.
  - Bumped cache buster in `unit2-dashboard.html` to `v=20261022` to ensure immediate browser hydration.
  - Refreshed site footer deployment timestamp via `node scripts/update-timestamp.js`.

## 2026-10-21 — Curriculum Alignment: Day 31, Day 36 & Day 37 Dashboard & Outline Cleanup (`assets/lessons-data.js` & `Unit_2/outline.md`)
**Changes**:
- **Linked Cardstock Rocket Engineering Google Doc & Cleaned Day 31**:
  - Linked Google Doc `https://docs.google.com/document/d/1fsDiE0mtPhklifH_eB5T-gsIUCMKgAzTz2M_CIUKpMU/edit?usp=sharing` directly to the Day 31 assignment card (`Open Google Doc ↗`) in `assets/lessons-data.js` and in Day 31 links within `Unit_2/outline.md`.
  - Retained the printable 2-page student worksheet PDF in `resources` for physical classroom distribution.
  - Removed `Unit_2/Cardstock_Rocket_Physics_Tie_Ins.md` from Day 31 dashboard links, resources, and outline.
- **Removed Action-Reaction Collision Investigation Sheet from Day 36**:
  - Removed "Action-Reaction Collision Investigation Sheet" from Day 36 `assignments` in `assets/lessons-data.js` and from Day 36 Links in `Unit_2/outline.md`.
  - Day 36 is now focused purely on the two active inquiry webapps: Hot Wheels Coasting Baseline (Periods 1, 2, 3) and Cardstock Rocket Phase 2 (Periods 0, 4, 5, 6).
- **Removed Third Law Paradox & System Boundaries from Day 37**:
  - Removed legacy "Resolving the Third Law Paradox & System Boundaries" topic, "The Horse-and-Cart Dilemma" bell-ringer, "Resolving the Third Law Paradox Worksheet", and "System Boundaries & The Horse-Cart Paradox Guide" from Day 37.
  - Re-anchored Day 37 cleanly to actual dual-track classroom investigations:
    - **Periods 1, 2, 3**: Hot Wheels Wind Resistance & Air Brake Lab (`Unit_2/hot_wheels_air_resistance/index.html`), focusing on aerodynamic drag and net deceleration forces (`F_net = F_friction + F_drag`).
    - **Periods 0, 4, 5, 6**: Cardstock Rocket Phase 2 Controlled Variable Forensics Studio (`Unit_2/rocket_phase2/index.html`), focusing on Rocket A vs. B precision fabrication and flight stability balance.
  - Synchronized `Unit_2/outline.md` with `assets/lessons-data.js` single source of truth.
  - Refreshed site deployment timestamp in `partials/footer.html`.

## 2026-10-21 — Substitute Plan App: Unit 2 Physics Vocabulary & Concept Word Search Quest (`Unit_2/physics_word_search/`)
**Patterns Added**: `physics-word-search-quest.md`.
**Patterns Updated**: `student-task-engagement.md`, `assignment-registry.md`, `classroom-projection-and-high-contrast-theming.md`.

**Changes**:
- **Multi-Mission Aggregation & Live Cloud Backup**:
  - Enforced completion of **all 3 missions** (30 words total: Kinematics, Newton's Laws, Aerospace) to earn full 10/10 points and submit final grade.
  - Submitting before all 3 are completed is blocked with an informative breakdown modal displaying per-mission progress while preserving work in the cloud.
  - Continuous Firestore cloud auto-save (`student_results/unit2_day38_physics_word_search/students/{studentId}`) stores and restores all 3 missions' found words, coordinates, and hint usage.
  - Strictly limited free hints to 1 per mission with persistent lock (`💡 0 Hints Left (Used)`).
- **Engineered Interactive Physics Word Search Application (`Unit_2/physics_word_search/index.html` & `physics-word-search/index.html`)**:
  - Purpose-built substitute assignment for Day 38 (Wednesday, Oct 21) across all physics periods (Periods 0 through 6).
  - 3 Themed Missions:
    - **Mission 1: Kinematics & 1D Motion** (`VELOCITY`, `ACCELERATION`, `DISPLACEMENT`, `SCALAR`, `VECTOR`, `FREEFALL`, `TRAJECTORY`, `INTERVAL`, `ORIGIN`, `DECELERATION`).
    - **Mission 2: Newton's Laws & Dynamics** (`INERTIA`, `NETFORCE`, `FRICTION`, `NORMAL`, `ACTION`, `REACTION`, `EQUILIBRIUM`, `TERMINAL`, `AIRRESISTANCE`, `TENSION`).
    - **Mission 3: Aerospace & Safety** (`MOMENTUM`, `IMPULSE`, `APOGEE`, `AERODYNAMICS`, `BALLAST`, `CRUMPLE`, `STABILITY`, `PRESSURE`, `RESTORING`, `TOLERANCE`).
  - **Procedural Word Search Engine (`js/word-search-engine.js`)**: 8-directional placement (H, V, and 4 diagonals) with collision validation and weighted English letter filler.
  - **Touch & Pointer Drag Mechanics (`js/app.js`)**: Real-time vector angle snapping, `touch-action: none;` without scroll interference, and 10 high-contrast pastel found-word themes.
  - **Dual Gameplay Modes**: Standard "Word Bank Mode" and AVID-style "🕵️ Clue Mode" (shows physics definitions/formulas to deduce terms).
  - **Web Audio API Synthesizer (`js/audio-manager.js`)**: Zero audio file dependencies; synthesizes letter drag ticks, 4-note major chord discoveries, mistake thuds, and grand victory fanfares.
  - **Classroom Substitute Teacher Mode**: 1-click **🖨️ Print Worksheet** button generating a clean 1-page paper version with student name/period lines.
  - **Tamper-Resistant Digital Completion Certificate**: Cryptographic verification hash (`CAST-WS-XXXX-10PTS`) and score receipt.
- **Unified Classroom Deployment & Verification**:
  - Deployed to Google Classroom across all 7 periods (Periods 0 to 6) under `unit2_day38_physics_word_search`, Topic "Unit 2: Motion", 10 max points.
  - All 6 pre-flight gates passed with 100% green checks on `npm run verify -- --id unit2_day38_physics_word_search --app Unit_2/physics_word_search`.
- **District Web Filter & Security**:
  - 100% compliant with District Web Filter policy (zero unpkg.com, zero in-browser Babel).
  - Verified student-permission law: doc IDs = email prefix, zero parent writes, zero undefined values.
- **Curriculum Stores & Course Outline**:
  - Updated `Unit_2/outline.md` and `assets/lessons-data.js` Day 38 entry with substitute plan badge and app links.
  - Refreshed site footer deployment timestamp.

## 2026-10-20 — Google Classroom Deployment: Hot Wheels Wind Resistance & Air Brake Lab (Periods 1, 2, 3)
**Patterns Updated**: `hot-wheels-wind-resistance-air-brake-lab.md`, `assignment-registry.md`.

**Changes**:
- **Google Classroom Coursework Deployment**:
  - Deployed coursework titled **"Hot Wheels Wind Resistance & Air Brake Lab"** across Periods 1, 2, and 3 via `sync-classroom/deploy-assignment.js` under assignment ID `unit2_day37_hot_wheels_air_resistance`.
  - Max Points: 10 pts, Topic: "Unit 2: Motion", Activity URL: `https://rrmudry.github.io/Unit_2/hot_wheels_air_resistance/`.
  - Created coursework entries:
    - Period 1 (`875053274185`): Coursework ID `893484948804`
    - Period 2 (`819978306673`): Coursework ID `893486385506`
    - Period 3 (`875053206741`): Coursework ID `893486095431`
- **Firestore Registry & Pre-Flight Verification**:
  - Passed all 6 pre-flight gates via `npm run verify -- --id unit2_day37_hot_wheels_air_resistance --app Unit_2/hot_wheels_air_resistance`:
    - Roster schema compatibility verified (`class_period`).
    - Period 0 and standard period resolution verified.
    - Zero `undefined` payload values verified.
    - Real student token (`isStudentOwner`) tested against DEPLOYED security rules.
  - Registered single source of truth in `assignment_registry/unit2_day37_hot_wheels_air_resistance`, `student_results/unit2_day37_hot_wheels_air_resistance`, and `gradest_assignments`.
  - Validated dry-run grade sync via `npm run sync -- "Hot Wheels Wind Resistance & Air Brake Lab" --dry-run` discovering existing student submissions from today's in-class testing.
- **Curriculum Outline Alignment**:
  - Updated Day 37 in `Unit_2/outline.md` reflecting the Hot Wheels Wind Resistance & Air Brake inquiry lab and links for Periods 1, 2, 3 alongside Cardstock Rocket Phase 2 for Periods 0, 4, 5, 6.
  - Refreshed site footer deployment timestamp.

## 2026-10-20 — CAST Data Analysis Practice Suite: Multi-Dataset Tables & Comparative Multi-Series Graphing (`cast-data-practice/`)
**Patterns Updated**: `cast-data-analysis-practice-suite.md`.

**Problem Addressed**:
- Science teachers needed the ability to specify multiple datasets (e.g., 2 comparative series or 3-condition series) in the data table and plotted graph, matching authentic CAST comparative performance tasks (such as comparing rough vs. smooth surfaces, enzyme activity across multiple concentrations, or spreading rates across different mid-ocean ridges).

**Changes Implemented**:
- **Dataset Count Selector & Quick Presets**:
  - Added `#aiDatasetsSelect` (1 Single Series, 2 Comparative Multi-Series, 3 Three-Condition Comparative) to the AI Scenario Studio modal.
  - Added one-click quick presets: `📈 2 Datasets (Comparative)` and `📊 3 Datasets` to automatically set the selector and append instructional prompts.
  - Added `#teacherDatasetsSelect` to the Manual Scenario Builder with multi-dataset CSV format guidance (`X, Y1, Y2` or `X, Y1, Y2, Y3`).
- **Multi-Dataset Schema & AI Prompt Architecture**:
  - Updated `buildAiPromptPayload()` to accept `datasetCount` and generate explicit multi-series rules:
    - Data table schema with shared independent variable ($X$) column and $N$ dependent variable ($Y$) columns with `seriesId`.
    - Data table rows containing `trial`, `x`, and $y_1, y_2, y_3$.
    - `graphConfig.multiSeries: true` with series configurations (labels, IDs, distinct point styles).
    - Comparative prompt instructions for Question 3 (quantitative rate comparison) and Question 4 (comparative CER).
- **Dynamic Multi-Series Chart.js Graphing**:
  - Generalizing `renderChart()` to dynamically detect the X-axis (`isX: true`) and plot multi-series datasets without hardcoded column names (fixing previous bug where `distance` was hardcoded).
  - Implemented 5-color high-contrast saturated palette (`#0284c7`, `#ea580c`, `#10b981`, `#7c3aed`, `#e11d48`) with distinct point styles (`circle`, `triangle`, `rectRot`, `cross`, `star`) for projector readability and colorblind accessibility.
- **UI & 1-Page Printable Sync**:
  - Header displays `#multiSeriesBadge` (`📈 2 Datasets`) when a multi-dataset scenario is active.
  - Scenario dropdown prefixes `[2 Datasets]` or `[3 Datasets]` tag.
  - Honors 1-Page printable worksheet dynamically formats multi-column tables and captures multi-series graph canvas snapshots within the 10.36in height budget.
- **Verification**:
  - Added automated unit tests to `tests/test_cast_data_practice.js` covering 2-dataset and 3-dataset prompt payloads, presets, and resets.
  - Ran `audit-firestore-rules-coverage.js` and `audit-web-filter-cdn.js` (100% compliant).

## 2026-10-20 — CAST Data Analysis Practice Suite: AI Investigation Special Requests & Target Grade-Level Adaptation (`cast-data-practice/`)
**Patterns Updated**: `cast-data-analysis-practice-suite.md`.

**Problem Addressed**:
- Teachers needed the ability to customize AI-generated CAST investigations to match varying grade levels and student needs (e.g. lowering target grade level to 7th–8th grade, requiring integer data only, simplifying vocabulary for ELD learners, or selecting everyday household/kitchen lab contexts).

**Changes Implemented**:
- **Target Grade / Rigor Level Selector**:
  - Implemented dropdown selector in Scenario Studio (`#aiGradeLevelSelect`) supporting High School (9–12 Standard CAST), Middle School (6–8 Accessible Vocabulary & Clean Numbers), Upper Elementary (4–5), Honors / AP Science, and Foundations / ELD Support.
  - Automatically adapts `systemInstruction`: instructs Gemini to adjust reading level, describe intuitive classroom equipment (spring scales, beakers, stopwatches, ramps) instead of abstract electronic sensors, use clean integer or single-decimal numbers for easy slope calculations, and align with Middle School NGSS codes (`MS-PS2-2`, `MS-LS1-5`).
- **Special Customization Requests Input & Presets**:
  - Added free-form textarea (`#aiSpecialRequestsInput`) allowing teachers to specify arbitrary constraints and differentiation requests.
  - Added one-click quick preset pills: 🎒 *Lower to 7th-8th Grade*, 🔢 *Whole Numbers Only*, 🗣️ *ELD / Simple Vocabulary*, 🍳 *Everyday / Kitchen Lab*, 📉 *Inverse Trend*, 🎓 *Honors / AP Rigor*, and ✕ *Clear*.
  - Helper `setAiSpecialPreset()` automates updating the dropdown and appending instructions to the textarea.
  - Added `buildAiPromptPayload()` helper function that strictly incorporates teacher special requests with priority weighting in both system instructions and user prompt.
- **UI & Print Sync**:
  - Scenario dropdown prefixes grade-level indicator `[Middle School]` for non-standard scenarios.
  - Main investigation view displays `#gradeBadge` badge next to discipline badge.
  - Honors 1-page printable PDF layout incorporates target grade level in worksheet header subtitle.
  - Manual scenario builder includes `teacherGradeLevelSelect` for full parity.
- **Verification**:
  - Expanded `tests/test_cast_data_practice.js` to test `buildAiPromptPayload()`, `setAiSpecialPreset()`, and grade-level adaptations. 100% green tests. Zero audit violations.


## 2026-10-20 — Hot Wheels Multi-Day Continuous Autosave & Dual-Layer Persistence Fix (`Unit_2/hot_wheels_coasting/`, `Unit_2/hot_wheels_air_resistance/`)
**Patterns Updated**: `cast-aligned-webapp-design.md`, `assignment-registry.md`.

**Problem Resolved**:
- Students' laboratory trial measurements, vehicle specifications, and predictions from Day 36 (`Unit_2/hot_wheels_coasting/index.html`) were lost overnight when students closed their Chromebooks without submitting Stage 5.
- Root causes:
  1. No continuous input auto-save: Firestore writes were deferred entirely to the final Stage 5 submit button.
  2. No client-side `localStorage` caching for form state.
  3. Incomplete cloud restoration in `loadExistingSubmission` (`weight_data.t0` was omitted; custom car names, checklist state, and champion data were not re-hydrated; Stage 5 retention card remained blank; `points >= existingScore` gate prevented draft updates if a student hadn't beaten prior high score).
  4. Mismatched IDs in Day 37 fan lab (`test-car-name`, `test-card-orient` vs `car-name`, `card-orientation`) and non-functional prediction radios.

**Changes Implemented**:
- **Dual-Layer Persistence (Instant Local + Debounced Cloud)**:
  - Instant `localStorage` serialization (`hw_coasting_draft_*`, `hw_air_resistance_draft_*`) on every single keystroke/change, guaranteeing zero data loss even if the Chromebook is abruptly shut or network drops.
  - Debounced (1200ms) automatic Firestore cloud save on input for signed-in students with visual status dot indicators (`● Cloud Ready`, `● Saving Draft...`, `● Cloud Synced`, `● Saved Locally`).
  - Score preservation rule: draft updates and answers are always merged without reducing a previously achieved higher score (`Math.max(currentScore, existingScore)`).
  - Immediate local draft re-hydration on `DOMContentLoaded` before network latency, followed by cloud restoration on auth state resolution.
  - Zero-data migration: if a student worked offline or before signing in, their local draft is automatically pushed to Firestore as soon as they sign in.
- **Complete Re-hydration**:
  - Restored baseline `t0` distance, custom car names, checklist checkboxes, prediction choices, character counts, and Tuesday retention card.
- **Cross-Activity Continuity**:
  - Day 37 (`Unit_2/hot_wheels_air_resistance/index.html`) automatically looks up the student's Day 36 champion car and baseline coasting distance from `student_results/unit2_day36_hot_wheels_coasting/students/{studentId}` and displays an interactive banner to load their baseline car into Day 37 fan testing.

## 2026-10-20 — Hot Wheels Wind Resistance & Air Brake Lab (`Unit_2/hot_wheels_air_resistance/index.html`)
**Patterns Added**: `hot-wheels-wind-resistance-air-brake-lab.md`.
**Patterns Updated**: `classroom-projection-and-high-contrast-theming.md`, `cast-aligned-webapp-design.md`, `assignment-registry.md`.

**Changes**:
- **Constructed Hot Wheels Wind Resistance & Air Brake Web Application (`Unit_2/hot_wheels_air_resistance/index.html`) for Periods 1, 2, 3**:
  - Implemented 5 structured stages adapted for conceptual physics students exploring aerodynamic drag:
    1. **Stage 1 (Air Brake & Headwind Fan Setup)**: Mounting an index card taped vertically or horizontally across the roof of the Hot Wheels car, placing a variable-speed floor fan facing directly down the track toward the car, and establishing a fair testing release height.
    2. **Stage 2 (Predictions & Aerodynamic Hypotheses)**: Qualitative hypothesis selection (Hypothesis A: Higher fan speeds exert greater opposing air resistance force, stopping the car sooner; Hypothesis B: Car mass and momentum easily overpower wind; Hypothesis C: Wind only affects tall vehicles) with student-authored rationale and car/card spec tracking.
    3. **Stage 3 (Fan Speed Data Collection & Visualizer)**: 4 fan speed tiers (Fan Off 0 m/s, Speed 1 Low ~1.5 m/s, Speed 2 Med ~3.0 m/s, Speed 3 High ~4.5 m/s) with 3 release trials each, dynamic average calculation, interactive HTML5 Canvas animated track runner with rotating fan blades and headwind streamlines, and real-time comparative bar chart.
    4. **Stage 4 (Free-Body Diagram & Net Deceleration Force)**: Qualitative FBD highlighting that both rolling friction ($F_f$) and aerodynamic drag ($F_{\text{drag}}$) point backward in the same direction ($F_{\text{net}} = F_f + F_{\text{drag}}$), producing greater negative acceleration (deceleration) and tighter strobe dot spacing.
    5. **Stage 5 (Synthesis & Grade Submission)**: 3 synthesis questions linking fan speed to deceleration rate, cross-sectional area, and real-world automotive efficiency, coupled to a 10-point auto-grading engine submitting directly to Firestore `student_results/unit2_day37_hot_wheels_air_resistance/students/{studentId}`.
- **District Web Filter & Accessibility**:
  - Zero `unpkg.com` and zero in-browser Babel; 100% clean audit on `node scripts/audit-web-filter-cdn.js`.
  - High-Contrast Light Mode toggle (WCAG AAA) with dynamic canvas re-rendering.
  - Universal Root Font Scaling (Normal `16px`, Large `19px`, Projector `23px`).
  - Synthesized Web Audio API sound effects (no external audio assets).
- **Curriculum Stores & Course Outline**:
  - Updated Day 37 in `assets/lessons-data.js` with Hot Wheels Wind Resistance & Air Brake links, assignments, and resources.
  - Refreshed site footer deployment timestamp via `node scripts/update-timestamp.js`.

## 2026-10-19 — CAST Printable Worksheet: Gold-Standard Architecture & Spacing Blueprint (`cast-data-practice/`)

## 2026-10-18 — Hot Wheels Coasting Baseline: Deceleration & Friction Webapp (`Unit_2/hot_wheels_coasting/index.html`)
**Patterns Added**: `hot-wheels-coasting-deceleration-lab.md`.
**Patterns Updated**: `classroom-projection-and-high-contrast-theming.md`, `assignment-registry.md`, `cast-aligned-webapp-design.md`.

**Changes**:
- **Constructed & Refined Hot Wheels Coasting Baseline Web Application (`Unit_2/hot_wheels_coasting/index.html`) for Periods 1, 2, 3**:
  - Implemented 5 structured stages adapted for conceptual physics students:
    1. **Stage 1 (4-Track Launch Ramp Setup)**: 4 connected track pieces forming a launch ramp (20–30 cm high propped on chair/books) that curves onto the open classroom floor where cars coast to a stop. Removed station numbers (identified by period and partner names).
    2. **Stage 2 (The Car Shootout)**: 3-car comparison (Die-Cast Muscle, Light Plastic, Boxy Truck) with 3 release trials each across open floor, bumper tape markers, average stopping distance calculation, and interactive HTML5 Canvas animated track simulation.
    3. **Stage 3 (The Weight Challenge Hook)**: Pre-test conceptual prediction with 2 hypotheses (A: Stops sooner due to friction, B: Rolls farther due to momentum; removed C), empirical testing with +0, +2, +4, +6 pennies, dynamic scatter chart, and open-ended physics reflection.
    4. **Stage 4 (Understanding Deceleration / Slowing Down)**: Purely qualitative concepts without algebraic formulas or calculations (moving forward vs pushing backward friction, positive vs negative acceleration), with strobe/ticker-tape trail visualizer.
    5. **Stage 5 (Tuesday Wrap-Up & Synthesis)**: Directive banner to leave baseline stopping tape on the floor for Tuesday, 3-question synthesis ticket (Q1: Friction as backward force; Q2: Empirical penny observations & reasoning; Q3: Fair testing / controlled variables without pushing), and 10-point auto-grading engine submitting to Firestore.
- **Unified Classroom Deployment & Pre-Flight Verification**:
  - Deployed coursework across Periods 1, 2, and 3 via `sync-classroom/deploy-assignment.js` under assignment ID `unit2_day36_hot_wheels_coasting` with 10 max points and topic "Unit 2: Motion".
  - Created coursework entries for P1 (`874079718847`), P2 (`874079753513`), and P3 (`874079762233`) and linked in `assignment_registry`.
  - Executed `npm run verify -- --id unit2_day36_hot_wheels_coasting` with 100% green checks (registry verified, roster schema verified, synthetic student write tested, zero undefined values).
- **Security & Firestore Rules Alignment**:
  - Client-side submit workflow writes directly to subcollection `student_results/{id}/students/{student_id}` without attempting to write to the admin-only top-level parent doc, preventing student permission-denied errors.
- **District Web Filter & Accessibility**:
  - Zero `unpkg.com` and zero in-browser Babel; 100% clean audit on `node scripts/audit-web-filter-cdn.js`.
  - High-Contrast Light Mode toggle (WCAG AAA > 14:1 contrast ratio) with dynamic canvas re-rendering.
  - Universal Root Font Scaling (Normal `16px`, Large `19px`, Projector `23px`).
  - Synthesized Web Audio API sound effects (no external audio assets).
- **Curriculum Stores & Course Outline**:
  - Updated Day 36 in `assets/lessons-data.js` with Hot Wheels Coasting Baseline link, assignment, and resource entries.
  - Updated Day 36 in `Unit_2/outline.md` reflecting the lab activity and conceptual focus for Periods 1, 2, and 3.
  - Refreshed site footer deployment timestamp via `node scripts/update-timestamp.js`.

## 2026-10-18 — Cardstock Rocket Phase 2: Stage 2 Sticky Technical Blueprint Tracking (`Unit_2/rocket_phase2/index.html`)
**Patterns Updated**: `cardstock-rocket-phase2-forensics.md`.

**Changes**:
- **Stage 2 Sticky Technical Blueprint (`main.stage-2-active #dualBlueprintCard`)**:
  - Implemented dynamic sticky positioning (`position: sticky; top: 65px; z-index: 100`) on `#dualBlueprintCard` activated exclusively when Stage 2 is active.
  - When students scroll down the tall left column into the Fin Drafting Studio at the bottom of Stage 2, the Technical Blueprint smoothly moves down alongside them, keeping the 1cm × 1cm CAD projection and real-time Center of Mass/Center of Pressure stability meters continuously in view while dragging fin handles.
  - **Stage-Specific Isolation**: Strictly restricted to Stage 2 (`main.stage-2-active`). On Stage 4, `#dualBlueprintCard` reverts to `position: static` so that both the Blueprint and Satellite Recovery Map stack and scroll naturally beside the CER questions.
  - **Mobile Degradation**: Media query (`@media (max-width: 960px)`) resets `#dualBlueprintCard` to `position: static` on smaller screens and mobile viewports.

## 2026-10-18 — Cardstock Rocket Phase 2: Stage-Gated Tool Visibility & Student-Authored CER Evidence (`Unit_2/rocket_phase2/index.html`)
**Patterns Updated**: `cardstock-rocket-phase2-forensics.md`.

**Changes**:
- **Stage-Gated Right Column Tool Visibility (`switchStage`)**:
  - **Stage 1 (Squad & Variable)**: Both Technical Blueprint and Satellite Recovery Map hidden. Layout switches to focused single-column centered container (`main.single-col-stage`, `max-width: 980px`).
  - **Stage 2 (Measurements)**: Shows **Technical Blueprint ONLY** (Satellite map hidden) so students focus on metric teardown and CAD stability calibers.
  - **Stage 3 (Launch Operations)**: Shows **Satellite Recovery Map ONLY** (Blueprint hidden) so students focus on stopwatch timers, azimuths, and touchdown pins.
  - **Stage 4 (CER Conclusion)**: Shows **BOTH Technical Blueprint AND Satellite Map** stacked on the right column next to the CER response questions.
- **Student-Authored Evidence (Zero Pre-Filled Text)**:
  - Removed auto-populated prewritten paragraph from `cerEvidence` textarea. The textarea now starts empty so students write their own evaluation.
  - Added a read-only `cerDataRefBox` directly above the Evidence box showing live numbers (Mass A/B, Hang A/B, Range A/B, Apogee A/B, Stability Margins, Delta Range) for students to cite in their response.
  - Balanced Stage 4 completion scoring across Claim (6%), Evidence (7%), and Reasoning (7%).

## 2026-10-18 — Cardstock Rocket: 0 cm Cone Height & Blunt Nose Blueprint Rendering (`rocket_phase2` & `rocket_recovery`)
**Patterns Updated**: `cardstock-rocket-phase2-forensics.md`.

**Changes**:
- **Resolved Falsy 0 Fallback Defect (`0 || 6.5 => 6.5`)**:
  - In `Unit_2/rocket_phase2/index.html` and `Unit_2/rocket_recovery/index.html`, inputs were parsed using `parseFloat(...) || 6.5`. Entering `0` or `0.0` for cone height caused `0 || 6.5` to evaluate to `6.5`, incorrectly drawing a 6.5 cm pointed cone when students built and tested flat/blunt rockets.
  - Implemented `parseNumWithDefault(elId, fallback)` and `parseIntWithDefault(elId, fallback)` to verify if the trimmed input string is truly empty (`''`) before defaulting, safely preserving `0` as an authentic engineering specification.
  - Updated blueprint generation (`drawDualBlueprint`), Firestore payload serialization (`submitFinalReport`), and student draft restore logic (`loadStudentProgress`) to preserve `0` values across all numeric fields.
- **Blunt Nose Technical Blueprint Projection**:
  - When `specs.H_nose <= 0.5` (such as `0 cm`), the CAD engine suppresses the protruding conical polygon and instead renders a flat blunt cap line (`<line x1="50" ...>`) directly on the cylinder edge at 0 cm on the ruler.
  - Blueprint label badge updates dynamically to display `• BLUNT NOSE (0 cm)`.
  - Suppressed zero-length arrow dimension callouts when cone height is 0.
  - Enhanced scaffolded CER evidence generator to recognize `nose_shape` and explicitly describe blunt/flat vs pointed nose profiles.

## 2026-10-18 — Cardstock Rocket Phase 2: One-Click Fin Matching for Non-Fin Variables (`Unit_2/rocket_phase2/index.html`)
**Patterns Updated**: `cardstock-rocket-phase2-forensics.md`.

**Changes**:
- **Automatic & One-Click Fin Synchronization for Non-Fin Variables**:
  - Implemented `copyRocketAFinsToB()` to copy fin polygon coordinates (`phase2FinPointsA` to `phase2FinPointsB`), numeric dimensions (`finHeight`, `finWidth`), offset from tail (`finOffset`), and fin count from Rocket A to Rocket B in one click.
  - Added dedicated action buttons:
    - **In-page Stage 2 Fin Studio**: Displays `[🔄 Match Rocket B Fins to A]` inside a prominent `🔗 Matched Fin Rule` banner whenever the squad isolates a non-fin variable (e.g. Fuselage Length, Mass, Nose Cone).
    - **Fullscreen Fin CAD Studio Modal**: Added `[🔄 Match B to A]` in both the modal header actions and in the modal notice banner.
    - **Fin Target Toggle**: Added `[🔄 Reset B to Match A]` so squads testing fin shape/dimensions can quickly reset Rocket B to baseline before making variations.
  - Automatically mirrors Rocket A fins to Rocket B whenever the squad switches to a non-fin independent variable in Stage 1 or clicks `🔄 Sync Controls`.

## 2026-10-18 — Cardstock Rocket Phase 2: Restored Desktop 2-Column Layout & Integrated Fullscreen Fin CAD Studio (`Unit_2/rocket_phase2/index.html`)
**Patterns Updated**: `cardstock-rocket-phase2-forensics.md`, `cardstock-rocketry-engineering-and-telemetry.md`.

**Changes**:
- **Restored Desktop 2-Column Side-by-Side Layout**:
  - Resolved nesting defect at line 906 where an unclosed `<div>` in Rocket A specs caused the entire Right Column (Dual Blueprint & Satellite Map) to be swallowed inside the Left Column, collapsing the interface into a single vertical column.
  - Adjusted the grid media query breakpoint from `@media (max-width: 1100px)` to `@media (max-width: 960px)` so standard Chromebook screens ($1024\text{px}-1366\text{px}$) cleanly preserve the side-by-side console.
- **Ported Fullscreen Fin CAD Studio & Dimensional Specifier Modal from Phase 1 (`Unit_2/rocket_recovery/index.html`)**:
  - Reused the interactive modal architecture with live millimeter drag handles, grid dimension callouts (Root chord, Leading edge cut line, Trailing edge cut line, Outer flat edge), and manual centimeter input fields (`specRootChord`, `specSpan`, `specTipChord`, `specSweepOffset`, `specOffsetBottom`).
  - Added dedicated target toggle (`🔴 Rocket A` vs `🔵 Rocket B`) so students can shape fins individually when fin shape/dimensions is the isolated variable, or automatically synchronize both rockets when testing non-fin variables.
- **Connected Custom Fin Geometry Directly to Technical Engineering Blueprint**:
  - Implemented 1:1 true-to-scale mathematical fin projection in `drawDualBlueprint()` (`renderRocketSvg`), mapping the active polygon coordinates from `phase2FinPointsA` and `phase2FinPointsB` directly onto the fuselage tube on the 1cm × 1cm grid.
  - Custom swept, trapezoid, delta, straight, or hand-dragged fin profiles now render in real time on Rocket A and Rocket B blueprints.

## 2026-10-18 — Cardstock Rocket Phase 2: Controlled Variable Forensics Webapp & Deployment (`Unit_2/rocket_phase2/index.html`)
**Patterns Added**: `cardstock-rocket-phase2-forensics.md`.
**Patterns Updated**: `cardstock-rocketry-engineering-and-telemetry.md`, `assignment-registry.md`.

**Changes**:
- **Built Cardstock Rocket Phase 2 Web Application (`Unit_2/rocket_phase2/index.html`)**:
  - Implemented 4-stage engineering workflow: (1) Squad Formation (max 3) & Single-Variable Selection, (2) Dual Rocket Physical Teardown & CAD Specifications, (3) Launch Operations & Dual Touchdown Satellite Recovery Map, (4) Head-to-Head Comparative CER Synthesis.
  - **Single-Variable Control Isolation**: Rocket A acts as the baseline/control; modifying Rocket A parameters propagates automatically to Rocket B unless the property is the actively selected independent variable (highlighted with gold border and badge).
  - **Dual-Rocket Scaled 1cm × 1cm CAD Blueprint**: Real-time SVG rendering of Rocket A and B simultaneously (or focus-toggled), showing live Center of Mass (CM), Center of Pressure (CP), stability calibers, and gold variable callout tags.
  - **Dual-Pin Campus Recovery Map**: Leaflet satellite map of Orange High School quad with Green Launch Pad, Red Pin (Rocket A), Blue Pin (Rocket B), flight vector lines, ground range ($d_A, d_B$), flight azimuths, performance delta ($\Delta d$), and apogee altitudes.
  - **District Web Filter Compliance**: Zero `unpkg.com`, zero in-browser Babel, local vendored Leaflet, and inline SVG data URI layer switcher icons to eliminate 404s on missing PNGs.
  - **Security & Integrity**: Multi-event anti-paste blocking (`paste`, `drop`, `beforeinput`), client writes restricted to subdocument `students/{student_id}` to comply with Firestore rules.
- **Unified Classroom Deployment & Verification**:
  - Successfully deployed assignment `unit2_day36_rocket_phase2` to Periods 0, 4, 5, and 6 in Google Classroom with 10 max points and due date Oct 23.
  - Verified pre-flight student auth and synthetic student writes via `npm run verify -- --id unit2_day36_rocket_phase2` with 100% passing checks.
- **Curriculum Stores & Course Outline**:
  - Updated `assets/lessons-data.js` for Days 36, 37, and 38 with Phase 2 assignments, resources, practice tools, and NGSS standards (`HS-PS2-1`, `HS-ETS1-2`, `HS-ETS1-3`).
  - Updated `Unit_2/outline.md` documenting the 3-day Phase 2 project schedule, rain contingency notes for Wednesday, and links.
- **Period 0 (Honors) Launch Pad Correction**:
  - Calibrated Period 0 launch station GPS coordinates across `Unit_2/rocket_recovery/index.html`, `Unit_2/rocket_phase2/index.html`, and `Unit_2/worksheets/Cardstock_Rocket_Autopsy_Lab.html` to `33°47'50.5"N 117°50'48.7"W` (`33.797361, -117.846861`) labeled as **"Basketball Courts"**.
  - Recompiled printable PDF `Unit_2/worksheets/Cardstock_Rocket_Autopsy_Lab.pdf` via Puppeteer with updated launcher coordinates.
  - Refreshed site footer timestamp via `node scripts/update-timestamp.js`.

## 2026-10-16 — Firestore Security Rules: Drop Client-Side Parent Doc Writes (`Unit_2/rocket_recovery/index.html`)
**Patterns Updated**: `cast-aligned-webapp-design.md`, `proctor-assessment-question-bank.md`.

**Changes**:
- **Eliminated Client-Side Parent Document Write in Student Submit Flow**:
  - In `firestore.rules`, the top-level parent document `student_results/{ASSIGNMENT_ID}` is admin-write-only (`allow write: if isAdmin()`), while students only have permission to write their own subcollection document `student_results/{ASSIGNMENT_ID}/students/{student_id}`.
  - Removed client-side `db.collection('student_results').doc(ASSIGNMENT_ID).set(...)` from the student submission workflow in `Unit_2/rocket_recovery/index.html`.
  - Parent document creation is handled ahead of time during automated deployment via `sync-classroom/deploy-assignment.js` (running with Firebase Admin credentials). This ensures students never encounter `permission-denied` exceptions upon final score submission.

## 2026-10-19 — Department-Wide CAST Data Analysis & Graphing Practice Suite (`cast-data-practice/`)
**Patterns Added**: `cast-data-analysis-practice-suite.md`.
**Patterns Updated**: `index.md`.

**Changes**:
- **Department-Wide Assessment Suite Architecture (`cast-data-practice/index.html`)**:
  - Developed a standalone web application designed for high school science departments to consistently practice and evaluate CAST-style data analysis and scientific graphing.
  - Implemented 8 multi-disciplinary phenomena scenarios spanning **Physics** (Newton's 2nd Law, Braking Distance), **Biology** (Catalase Enzyme Kinetics, Photosynthesis Saturation), **Chemistry** (Reaction Rate vs. Concentration, Water Heating Curve), and **Earth & Space Science** (Seafloor Spreading, Atmospheric CO₂ vs. Temperature).
- **Real-Time Automated 4-Point Evidence & Rubric Checking Engine (`js/evidence-checker.js`)**:
  - Automatically analyzes free response student writing against a 4-point CAST rubric: (1) Scientific Claim, (2) Authentic numerical data cited ($\pm 3\%$ matching against table values), (3) Scientific measurement units, and (4) Comparative analysis & mechanism reasoning.
  - Generates live checklist badges (`✅ Claim`, `⏳ Cite Two Data Points`) and actionable guidance to help students achieve mastery.
- **Teacher Mode & Custom Scenario Builder**:
  - Modal drawer allowing department teachers to create, preview, and export custom inquiry scenarios in JSON format for common assessments.
- **Classroom Projector Mode & WCAG AAA High-Contrast Light Mode**:
  - Integrated 3-tier font scaling (Normal: 16px, Large: 20px, Projector: 24px) via root `rem` scaling, high-contrast ink-slate on white, and dynamic Chart.js theme re-rendering.
- **Firestore Student-Permission Law Compliance & Honors 1-Page Printable PDF**:
  - Direct student subdoc writes to `practice_results/cast_data_practice/students/{studentId}` with zero parent writes and sanitized payloads.
  - Implemented an uncluttered **1-Page Letter Portrait PDF** layout modeled after `Honors_Kinematics_Graphing_Challenges_1_and_2.html` (`height: 10.36in`, balanced side-by-side data table & graph snapshot, 4-point CER rubric pills, and student fill-in header fields) with zero spillover onto page 2.


## 2026-10-16 — Anti-Paste Response Protection, Fin Terminology Alignment & Web Filter Hardening (`Unit_2/rocket_recovery/index.html`)
**Patterns Updated**: `cast-aligned-webapp-design.md`, `classroom-projection-and-high-contrast-theming.md`.

**Changes**:
- **Multi-Layered Anti-Paste Response Box Protection (`initPastePrevention`)**:
  - Implemented anti-paste listeners intercepting `paste`, `drop`, and `beforeinput` (`insertFromPaste`, `insertFromDrop`) events across student response boxes (`qMassEffect`, `qFinEffect`, `cerClaim`, `cerEvidence`, `cerReasoning`, and all `<textarea>` elements).
  - Triggers a crimson shake border animation (`.paste-blocked`) and displays a fixed toast banner docked directly under the header: `🚫 Pasting is disabled on response boxes. Please type your response in your own words.`
  - Programmatic input assignments (e.g. claim scaffolding from behavior dropdowns) operate without firing paste events.
- **Fin Terminology Correction**:
  - Replaced `"hand-drawn fins"` with **`"cardstock fins"`** across the auto-generated CER Evidence synthesizer and Firestore schema restoration.
  - Simplified Step 1 fin group title and intro to focus on modeling rocket fin dimensions without misleading "drawn" terminology.
- **Launch Pressure Calibration & District Filter Compliance**:
  - Standardized launch pressure strictly to **80–100 PSI** across all telemetry HUDs, map markers, evidence generators, and worksheets.
  - Verified 100% compliance with district web filter policy: Leaflet assets locally vendored (`assets/vendor/leaflet/`), zero `unpkg.com` dependencies, and zero in-browser Babel.

## 2026-10-15 — Fin Placement Offset from Fuselage Bottom & Dynamic CP Shifting (`Unit_2/rocket_recovery/index.html`)
**Patterns Updated**: `cast-aligned-webapp-design.md`, `classroom-projection-and-high-contrast-theming.md`.

**Changes**:
- **Fin Placement Offset Input (`finOffsetBottom` & `specOffsetBottom`)**:
  - Added user input for distance from the bottom of the fuselage (cm) in both Step 1 Autopsy and the Fullscreen Fin CAD Studio modal.
  - Default `0.0 cm` corresponds to fins aligned flush with the fuselage bottom / tail; allows positive entries when students taped fins higher up the body tube.
- **Dynamic 1:1 Scaled Fin Projection on Blueprint**:
  - The SVG blueprint immediately slides the fins forward along the fuselage tube by the exact offset distance.
  - Displays a high-contrast gold dimension line (`+X.X cm from bottom`) with extension arrows and dashed guidelines whenever fins are not flush with the tail.
- **Authentic Center of Pressure (CP) Recalibration**:
  - Moving fins forward along the fuselage shifts the fin aerodynamic restoring force forward toward the nose ($\Delta CP = -0.75 \times \text{finOffset}$).
  - Live stability margin ($\text{Margin} = CP - CM$) updates in real time, demonstrating directly to students how attaching fins higher up shrinks the stability margin and induces tumble or corkscrew wobble.
- **Worksheet & Report Alignment**:
  - Added fin alignment checkboxes (`[ ] Flush with tail  [ ] Shifted _____ cm up from tail`) to Table 1 of `Cardstock_Rocket_Autopsy_Lab.html` and recompiled the print PDF.
  - Linked fin alignment to Step 2 Forensics explanations and Google Classroom clipboard synthesis.

## 2026-10-15 — Fullscreen Fin CAD Studio, Height/Width Terminology, 1cm x 1cm Blueprint Grid & Realistic Flight Forensics (`Unit_2/rocket_recovery/index.html`)
**Patterns Updated**: `cast-aligned-webapp-design.md`, `classroom-projection-and-high-contrast-theming.md`.

**Changes**:
- **Adopted 1 cm × 1 cm True-to-Scale Technical Engineering Blueprint Grid**:
  - Replaced the disconnected background CSS grid overlay with an authentic, SVG-native 1cm × 1cm coordinate grid pattern (`#bpGrid1cm`) locked directly to the rocket's longitudinal centerline and nose tip origin (`originX = 50`, `centerY = 120`).
  - Added major 5cm bold grid pattern (`#bpGrid5cm`) and an integrated bottom centimeter ruler axis with tick marks every 1cm and numeric labels at `0, 5, 10, 15, 20, 25, 30, 35, 40 cm`.
  - Every centimeter of drawn fin height, fin width, nose height, and fuselage length spans exactly 1 grid square (1 square = 1 cm × 1 cm).
  - Updated Section B of companion worksheet `Cardstock_Rocket_Autopsy_Lab.html` to physical `1cm 1cm` CSS grid paper (`background-size: 1cm 1cm`), allowing students to use standard classroom metric rulers directly on the printed paper.
- **Adopted Student-Accessible Fin Terminology (Zero Aerospace Jargon)**:
  - Eliminated unfamiliar aerospace jargon ("Root Chord", "Semi-Span", "Tip Chord", "Leading Sweep") across both the webapp and printable lab worksheet.
  - Replaced with high-school accessible terminology: **Fin Height (along body)**, **Fin Width (sticking out)**, **Outer Flat Edge**, and **Front Slant Offset**.
  - Updated CAD dimension callout tags to clean badges (`Height 4.0cm`, `Front 5.7cm`, `Back 4.0cm`, `Outer 2.0cm`).
- **Realized Authentic Flight Behavior Options**:
  - Replaced artificial flight behaviors with 6 typical cardstock rocket launch observations: High vertical climb with wind drift, Long arching flight across campus (boosted glide), Tight spiral / corkscrew spin, Hard banking curve / turn, End-over-end tumbling somersault, and Structural blowout (nose cone or fin ripped off at 40 PSI).
- **Replaced Irrelevant Mass & Balance Forensics**:
  - Replaced mass & ballast forensics with **Fuselage Fit & Pressure Seal Forensics** (Snug airtight seal vs. loose wobbly fit with air leakage vs. high pipe friction).
- **Removed Automatic Touchdown Zone Guessing**:
  - Replaced automated zone guessing with live, authentic **Touchdown GPS Coordinates** derived from the student's satellite map touchdown pin.

## 2026-10-13 — Prominent Video Tutorial Card & Thumbnail Pattern
**Patterns Updated**: `dashboard-layout.md`.

**Changes**:
- **Prominent Video Thumbnail on Today's Lesson Card (`index.html`)**:
  - Upgraded `#today-widget-container` / `today-card` on the homepage to detect companion video tutorials in daily lesson data (`day.video` or `day.imageType === 'video'`).
  - Renders a prominent 16:9 thumbnail preview with a glowing red play button overlay, "▶ YOUTUBE TUTORIAL" badge, video title bar, and "🎬 Watch Construction Video ↗" call to action.
- **Unit 2 Dashboard Pacing Card & Modal Video Player (`unit2-dashboard.html`)**:
  - Replaced the tiny `max-h-28` "🎨 EXEMPLAR" badge with a 16:9 video frame (`aspect-video`), red border glow, central play button, and title pill.
  - Upgraded `openLessonModal(day)` to embed an interactive 16:9 YouTube iframe player with "OPEN ON YOUTUBE ↗" header link.
- **Local Thumbnail Vendoring (`assets/images/better_paper_rockets_thumb.jpg`)**:
  - Downloaded `hqdefault.jpg` locally to prevent district Chromebook filter blocks on `img.youtube.com`, with automated online fallback.

## 2026-10-13 — Bell-Ringer: Period 4 Activity Excusal & Full Credit Protocol
**Patterns Updated**: `bell-ringer-config.md`.

**Changes**:
- **Granted Full Credit to All Period 4 Students in Firestore (`bellringers/{studentId}_2026-10-13`)**:
  - All 40 students in Period 4 were awarded 100% full credit (`effortScore: 100`, `score: 1`, `excused: true`, `isExcused: true`, `studentResponse: "Excused - In-Class Activity (Full Credit)"`) due to an in-class activity that prevented them from running the normal bell-ringer.
- **Added Excused Activity Quality Engine Bypass (`sync-classroom/sync-bellringers.js`)**:
  - `evaluateSubmission(sub)` immediately grants `{ isGenuine: true, type: ..., reason: 'excused_full_credit' }` when `sub.excused` or `sub.isExcused` is true, ensuring excused days count toward genuine totals for Google Classroom sync without tripping quality filters.
- **Added One-Click Teacher Dashboard Controls (`Bell-Ringer/dashboard.html` & `Bell-Ringer/teacher.html`)**:
  - Added single-click "✨ Excuse Period (Full Credit)" buttons and student tile badge support so any period can be excused on demand in real time.

## 2026-10-15 — Cardstock Rocket Recovery & Flight Forensics: Student Google Auth & Firestore Sync
**Patterns Updated**: `cardstock-rocketry-engineering-and-telemetry.md`, `cast-aligned-webapp-design.md`.

**Changes**:
- **Interactive Student Google Auth & School Domain Enforcement (`Unit_2/rocket_recovery/index.html`)**:
  - Integrated official Firebase Auth SDK loaded from `gstatic.com` (100% compliant with District Web Filter policy, zero unpkg/Babel).
  - Enforced `@orangeusd.org` Google Workspace authentication with teacher bypass for `rmudry@orangeusd.org` and `ryan.mudry@gmail.com`.
  - Added user profile chip in header showing student name, period, and ID with sign-out support.
- **Bi-Directional Firestore Persistence (`student_results/unit2_day35_rocket_recovery`)**:
  - Implemented automatic roster lookup checking `class_period ?? period` to auto-resolve student period (Period 0 Honors vs Periods 4–6 Physics) and dynamically relocate the launch pad marker to Period 0 coordinates (`33°47'50.6"N 117°50'48.7"W`) or Quad center (`33°47'48.8"N 117°50'48.4"W`).
  - Implemented debounced auto-saving (1.5s delay) capturing teardown measurements, fin geometry coordinates, satellite touchdown pin, trajectory style diagnostics, and CER scientific synthesis.
  - Added explicit "🚀 Submit to Google Classroom" button with high-contrast confirmation modal and grade recording.
  - Sanitized all Firestore payload properties to guarantee zero `undefined` values.
- **Launcher Pressure Calibration Update (80–100 PSI)**:
  - Corrected all occurrences of launcher pressure across the interactive studio (`rocket_recovery/index.html`), printable worksheet (`Cardstock_Rocket_Autopsy_Lab.html` & `.pdf`), curriculum outline (`outline.md`), lesson store (`lessons-data.js`), and tie-in references from 40 PSI to the actual operating pressure of 80–100 PSI.

## 2026-10-13 — Missing Work Tool: Eliminate unpkg/Babel Dependency (District Web Filter Hotfix)
**Patterns Updated**: `dashboard-layout.md`.

**Changes**:
- **Resolved Blank Screen & `ReferenceError: Babel is not defined` (`missing-work.html`)**:
  - Root cause: `missing-work.html` relied on React 18 and `@babel/standalone` loaded from `unpkg.com` with in-browser JSX transpilation (`<script type="text/babel">`). School district web filters and firewalls block `unpkg.com`, causing script load failures and an unhandled `ReferenceError: Babel is not defined` at line 15, leaving the page completely blank.
  - Converted the entire recovery tool to native Vanilla JavaScript with zero external script dependencies.
  - Retained the identical Tailwind design system, glass-panel cards, gradient animations, and 3-tier link categorization (Graded Work, Slide Decks, Practice).
  - Added full multi-unit filter dropdown (Units 1, 2, 4, 5, 6, 7) and URL query parameter auto-fill (`?start=YYYY-MM-DD&end=YYYY-MM-DD&unit=N`).

## 2026-10-12 — Bell-Ringer Concept Chat: Grading Fairness & Inverted Incentive Hotfix
**Patterns Updated**: `bell-ringer-config.md`.

**Changes**:
- **Eliminated 70% Default Score for Non-Responding Students (`Bell-Ringer/teacher.html`)**:
  - Root cause: `autoGradePendingSubmissions()` counted raw `sub.chatMessages.length`. Because every chat session is initialized with 1 AI tutor greeting prompt, a student who never typed anything had `msgCount = 1`, which fell through to `scoreVal = 70`. Non-responding students were awarded 70% passing credit.
  - Resolved by filtering strictly for student user messages (`m.role === 'user' || m.sender === 'user'`). Students with 0 user responses or explicit opt-outs receive 0% (zero credit).
  - Minor good-faith attempts (1 genuine response) receive 70% passing credit, 2 genuine turns receive 85%, and 3+ turns receive 100%.
- **Corrected Live Turn Counting on Classroom Dashboard (`Bell-Ringer/dashboard.html`)**:
  - Filtered turn count to student user messages so unstarted sessions accurately display `💬 0 turns (Waiting)` instead of falsely displaying `1 turns`.
  - Added explicit red `0% (❌)` failure status indicator for 0 scores.
- **Fixed AI Evaluation Rubric & Fallback Floor (`Bell-Ringer/index.html`)**:
  - Updated Gemini grading prompt rubric: 1 genuine attempt is explicitly designated as passing participation credit (70–79%), preventing the AI from penalizing honest minor attempts with failing grades (e.g. 60%).
  - Replaced hardcoded fallback score of 70 with deterministic user turn scoring (`0 turns = 0%, 1 turn = 70%, 2+ turns = 85%`).
- **Hardened Google Classroom Gradebook Sync (`sync-classroom/sync-bellringers.js`)**:
  - Replaced arbitrary `< 15` character penalty on single turns with opt-out dictionary validation, preventing legitimate short scientific answers (e.g. "stopwatch", "scale", "friction") from being rejected.
  - Flagged any submission with score < 70% or 0 user turns as ineligible for participation credit.

## 2026-10-11 — Week 7 Preparation: Cardstock Rocketry Capstone & AVID Reading Pattern
**Patterns Updated/Added**: `cardstock-rocketry-engineering-and-telemetry.md`.

**Changes**:
- **AVID Annotated Close Reading Worksheet (`Cardstock_Rocket_Annotated_Reading.html`, `.pdf`, and `.md`)**:
  - Re-architected to mirror the teacher's authentic Google Doc format: continuous text with generous annotation margins, no artificial UI boxes.
  - Exactly 5 paragraphs, 402 words in English and 462 words in Spanish, covering pneumatic seal tolerances, mass-to-thrust ratios ($a = F_{\text{net}} / m$), Center of Mass ($CM$) vs. Center of Pressure ($CP$) stability, the 20–30 g sweet spot, and inertia coasting through air drag.
  - Page 2 concludes with AVID reading checklist and a spacious rectangular reflection write-in box for FNT Phase 4.
  - Provided clean copy-paste markdown master and integrated the live teacher Google Doc link directly into `assets/lessons-data.js` Day 31.
- **Cardstock Rocket Lab Guide & Telemetry Log (`Cardstock_Rocket_Lab_Guide.html` & `.pdf`)**:
  - Designed and compiled a companion 2-page engineering lab guide.
  - Page 1: Step-by-step fabrication protocol, mass budget log ($g \to kg$), dimensional check, and 5-point teacher pre-flight certification badge.
  - Page 2: Launch squad roles banner, multi-timer data table (canceling human reaction time error), kinematics calculation matrix, and CER evaluation box.
- **Curriculum & Schedule Alignment**:
  - Updated `Unit_2/outline.md` to an 8-week (40-day) progression with Week 7 dedicated to Cardstock Rocketry and Week 8 dedicated to Newton's 3rd Law, Crash Engineering, and the Summative Assessment.
  - Updated `assets/lessons-data.js` for Days 31–35 (Cardstock Rocketry) and Days 36–40 (Third Law and Summative Exam) with full NGSS standards (`HS-PS2-1`, `HS-ETS1-2`), DOK levels, WICOR strategies, Bell-Ringers, and links.
  - Accounted for Wednesday's End of Quarter Minimum Day (30-min periods) by dedicating Wednesday to in-class assembly, ballast balance, and pre-flight QC, scheduling outdoor launch day for Thursday.
  - Updated site deployment timestamp.

## 2026-10-09 — Google Classroom: "Newton's 2nd Law Quiz" Multi-Period Deployment
**Patterns Updated**: `classroom-gradebook-sync.md`.

**Changes**:
- **Deployed Coursework Across All 7 Periods (`post-newtons-second-law-quiz.js`)**:
  - Generated Google Classroom coursework titled **"Newton's 2nd Law Quiz"** across all 7 courses.
  - Periods 0, 4, 5, 6: Configured with **20 points possible** linked to `newtons_second_law_quiz` results data.
  - Periods 1, 2, 3: Configured with **12 points possible** linked to `cp_newtons_second_law_quiz` results data.
  - Attached verified live Student Dashboard material link (`https://rrmudry.github.io/student_dashboard.html`).
- **Registered Single Source of Truth in Firestore**:
  - `assignment_registry`: Added entries for `newtons_second_law_quiz`, `cp_newtons_second_law_quiz`, and master `Newton's 2nd Law Quiz`.
  - `student_results` & `gradest_assignments`: Linked parent document coursework maps and max point values.
- **Enhanced `sync-cli.js` Scoring & Query Matching**:
  - Supported `data.total_points` alongside `maxPoints` to accurately calculate raw percentages for quiz documents.
  - Added normalized numeral-to-word matching (`2nd` ↔ `second`) so `npm run sync -- "Newton's 2nd Law Quiz"` resolves and synchronizes both Standard/Honors and CP quiz collections in a single command.
  - Verified dry-run execution with 100% success across all periods.

## 2026-10-09 — THE_PROCTOR Dashboard: CP Quiz Score Rendering & Firestore Restoration
**Patterns Updated**: `proctor-assessment-question-bank.md`.

**Changes**:
- **Resolved "LOCKED_BY_PROCTOR" Displayed as Score (`admin/proctor_dashboard.html`)**:
  - Root cause: The dashboard computed score via `isFinished && s.status ? s.status.replace('COMPLETED: ', '') : ...`. If `s.status` was `"LOCKED_BY_PROCTOR"` (from a previous period lock), `.replace('COMPLETED: ', '')` left the string unchanged, causing the card and report modal to literally display "LOCKED_BY_PROCTOR" as the student's score.
  - Added `getStudentScoreDisplay(s)` helper that prioritizes numeric `score` / `total_points` and strictly validates `COMPLETED:` prefixes before string extraction, ensuring system lock statuses are never displayed as scores.
  - Hardened `lockStudent` and `acknowledgeStudent` to check `isStudentFinished` and preserve completed test status and scores.
  - Removed duplicate `isCritical` condition in `updateGrid`.
- **Restored 36 Completed Student Records in `cp_newtons_second_law_quiz`**:
  - Restored `status: "COMPLETED: X / 12"`, `isCompleted: true`, and `details.status: "COMPLETED: X / 12"` for all 14 completed students in Period 3, 9 completed students in Period 1, and 13 completed students in Period 2.

## 2026-10-09 — THE_PROCTOR: Completed Status Preservation & Session Question Persistence
**Patterns Updated**: `proctor-assessment-question-bank.md`.

**Changes**:
- **Fixed Done Ribbon & Completed Status Erased on Dashboard (`proctor_dashboard.html`)**:
  - Identified that batch lock (`setBatchLock`), period lock (`togglePeriodLock`), and violation clear (`acknowledgeAll`) unconditionally overwrote student `status` to `LOCKED_BY_PROCTOR` or `CLASS_CLEARED`, stripping the `COMPLETED: X / Y` status and removing the emerald "Done" ribbon from completed cards across Periods 4, 5, and 6.
  - Updated lock and clear routines to preserve `status` for completed students, and prioritized `isFinished` in card rendering so submitted students maintain their score, green badge, and "Done" ribbon even under active classroom locks.
  - Backfilled and restored 90 completed student records across Periods 4, 5, and 6 in Firestore.
- **Fixed Test Resume Re-Shuffling Bug (`THE_PROCTOR_TEMPLATE.html`, `THE_PROCTOR_BETA.html`)**:
  - Identified that mid-test disconnections/reloads re-ran `fetchQuestions()`, re-shuffling the question bank and changing dynamic math variables, causing previously selected answers to fail re-attachment.
  - Persisted the active assigned question array inside `session_progress.questions` and updated `resumeSession()` to restore the exact question array upon reload.
  - Added explicit `isCompleted: true` and `completed_at` timestamp flags upon test submission.
- **Student Grade Adjustments**:
  - Updated a Period 6 student (`REDACTED`, Period 6) to `13 / 20` (`COMPLETED: 13 / 20`) per teacher verification.

## 2026-10-09 — THE_PROCTOR: Sync Pipeline Resilience, Watchdog, & Dashboard Period Normalization
**Patterns Updated**: `proctor-assessment-question-bank.md`.

**Changes**:
- **Resolved Sync Freeze on School Chromebooks (`THE_PROCTOR_TEMPLATE.html`, `THE_PROCTOR_BETA.html`)**:
  - Root cause: Intermittent Wi-Fi drops left Firestore `studentDocRef.set()` Promises pending indefinitely with no timeout. Because `isSyncing` was set to `true`, all subsequent answer submissions and heartbeat updates were discarded by `if (isSyncing) return;`.
  - Added an 8-second `Promise.race` rejection timeout on Firestore writes.
  - Added a 10-second watchdog timer to unconditionally reset `isSyncing = false` and recover the sync loop if a write hangs.
  - Enabled dynamic DOM score recalculation from checked radio inputs during every sync call to ensure current score is never stale.
  - Added offline retry queuing and an `online` window event listener to flush test progress immediately when Chromebook reconnects.
  - Strengthened `handleBlur` with a 300ms debounce, `document.hasFocus()` verification, and active element checks to prevent false focus penalties from ChromeOS notifications and Desmos interactions.
- **Proctor Dashboard Period 6 Normalization (`admin/proctor_dashboard.html`)**:
  - Replaced strict Firestore query filter `where('class_period', '==', 6)` with full roster fetching and in-memory regex normalization (`replace(/\D/g, '')`), handling both numbers and strings, and checking both `class_period` and `period`.
  - Added dual-key student matching (`s.id === liveStudent.id` or `s.student_id === liveStudent.id`) so students whose auth UID differs from roster ID are accurately displayed under Period 6.

## 2026-10-09 — THE_PROCTOR & Dashboard: Untimed Assessments & 15-Minute Timer Removal
**Patterns Updated**: `proctor-assessment-question-bank.md`.

**Changes**:
- **Eliminated Hardcoded 15-Minute Default Timer (`admin/THE_PROCTOR/THE_PROCTOR_TEMPLATE.html`, `THE_PROCTOR_BETA.html`)**:
  - Root cause: `TIME_LIMIT_MINS` was initialized to `15` and `fetchAssessmentConfig` used `parseFloat(data.time_limit_mins) || 15`, forcing untimed assessments (`time_limit_mins: null` in Firestore) to run a 15-minute countdown and auto-submit tests unexpectedly.
  - Initialized `TIME_LIMIT_MINS = null` and only activate countdown when `time_limit_mins` is an explicit positive number.
  - Added slug fallback in `fetchAssessmentConfig` matching `fetchQuestions` resolution (`altName = ASSIGNMENT_NAME.replace(/\s+/g, '_').toLowerCase()`).
  - Updated `startTimer()` to cleanly cancel intervals and display `Untimed` in muted slate (`text-slate-400 font-mono text-base font-bold`) when duration is null/0.
  - Hardened resume and session_progress synchronization to preserve untimed testing sessions without timer expiration.
- **Student Dashboard Label Clarity (`student_dashboard.html`)**:
  - Updated time limit badge to check `assessment.time_limit_mins || assessment.time_limit`, displaying "Untimed" when no time limit is specified.

## 2026-10-09 — Student Dashboard & THE_PROCTOR: Firestore Permissions Hotfix
**Patterns Updated**: `proctor-assessment-question-bank.md`.

**Changes**:
- **Resolved Firestore Permission-Denied for Students (`firestore.rules`)**:
  - Restored `allow read: if true;` for `assessments` and `questions` collections.
  - Previous audit had restricted `assessments` list and `questions` read to `isAdmin()`, causing `student_dashboard.html`'s `assessments.onSnapshot` listener to throw `[code=permission-denied]` and freeze student dashboard initialization.
  - Deployed updated rules directly to Firebase project `site-6e500`.
- **Dashboard Promise Resilience (`student_dashboard.html`)**:
  - Added explicit error handler to `db.collection('assessments').onSnapshot` ensuring initialization promise always resolves and never hangs student screens indefinitely.

## 2026-10-09 — THE_PROCTOR & Admin Suites: District Web Filter Lucide Resilience
**Patterns Updated**: `proctor-assessment-question-bank.md`.

**Changes**:
- **Multi-Tier Lucide Script Loaders (`admin/THE_PROCTOR/`, `admin/`)**:
  - Replaced single `unpkg.com` CDN script tags in `THE_PROCTOR_TEMPLATE.html`, `THE_PROCTOR_BETA.html`, `proctor_dashboard.html`, and `question_editor.html` with multi-tier fallbacks (`../../assets/lucide.min.js`, `../../assets/vendor/lucide.min.js`, jsDelivr, unpkg).
  - Eliminates failures when school Chromebook filters (Blocksi, GoGuardian, Securly) block unpkg.com.
- **Safe Icon Guard (`safeCreateIcons()`)**:
  - Wrapped all runtime `lucide.createIcons()` calls inside `safeCreateIcons()` in `THE_PROCTOR_TEMPLATE.html` and `THE_PROCTOR_BETA.html`.
  - Prevents `Uncaught ReferenceError: lucide is not defined` from throwing unhandled exceptions and halting test execution during authentication, camera setup, GPU warmup, and question rendering.

## 2026-10-08 — Hall's Carriage Modified Atwood Lab: Completion Certificate & Print System
**Patterns Updated**: `halls-carriage-modified-atwood-lab.md`.

**Changes**:
- **Added Completion Certificate Modal (`Unit_2/halls_carriage_lab/`)**:
  - Engineered anti-tamper **Certificate of Kinematic Mastery** modal for students completing the 5-configuration Modified Atwood Hall's Carriage lab (10/10 score).
  - Displays student investigator name, student ID, class period, verified mass configurations (5/5), experimental net force slope k (a vs. 1/M_total), theoretical pulling force (F_hang), completion timestamp, and unique security hash (`HC-XXXX-XXXX`).
  - Added **🖨️ Print / Save PDF Certificate** button calling `window.print()` and **📋 Copy Classroom Summary** button for Google Classroom turn-in comments.
  - Implemented `@media print` CSS rules in `style.css` to hide headers, HUD overlays, drawers, and buttons, rendering an ink-friendly double-bordered letter certificate.
  - Added persistent **📜 View Certificate** buttons in the bottom submission card and Google Auth completion handler.
- **Refreshed Timestamp**: Updated deployment timestamp via `scripts/update-timestamp.js`.

## 2026-10-08 — THE_PROCTOR: Newton's 2nd Law Quiz Bank Pruned (Pedagogical Alignment)
**Patterns Updated**: `proctor-assessment-question-bank.md`.

**Changes**:
- **Pruned 32 Out-of-Scope Questions from `newtons_second_law_quiz`**:
  - Removed questions introducing topics beyond foundational Newton's 2nd Law or possessing over-complicated/dense answer rationales:
    - *Free Fall & Vacuum Chamber*: Q329 (bowling ball vs. tennis ball $F/m$ ratio).
    - *Elevators & Apparent Weight*: Q319, Q320, Q321, Q368, Q369 (scale readings $N = m(g \pm a)$).
    - *Modified Atwood Systems*: Q323, Q324, Q372, Q373 (two-body system inertia and acceleration formulas).
    - *Multi-Step Kinematics Combinations*: Q340, Q364, Q365, Q366, Q367, Q376, Q377, Q378 (combining $F=ma$ with $v=at$, $\Delta x = \frac{1}{2}at^2$, $v^2=2ad$).
    - *Vertical Lifting*: Q370, Q371, Q375 (crane and rocket thrust against gravity).
    - *Drag / Terminal Velocity*: Q316, Q374.
    - *2D Perpendicular Vectors & Circular Motion*: Q330 (30 N + 40 N), Q336 (curve turning).
    - *Graph Slope Linearization*: Q311, Q312, Q313 ($F$ vs $a$, $a$ vs $F$, $a$ vs $1/m$).
    - *Off-Earth Gravitational Decimal Weight*: Q353, Q354 (Moon $1.6$, Mars $3.7$).
  - Bank pruned in Cloud Firestore `questions` collection and updated in `admin/scripts/populate_nsl_questions.js`.
  - Final bank size: 46 clean questions (23 static conceptual, 23 calculated $F=ma$ / 1D net force problems).
  - **Standardized Earth Gravity to Strictly $g = 10\text{ m/s}^2$**: Converted Q352, Q355, Q322, Q327, and Q410 to use $g = 10\text{ m/s}^2$ instead of $9.8$ across prompts, formulas, and distractors in both Firestore and local population scripts, permanently documenting the $g = 10\text{ m/s}^2$ classroom standard in `proctor-assessment-question-bank.md`.

## 2026-10-08 — THE_PROCTOR: CP Newton's 2nd Law Quiz (Accessible Bank & Static Option Shuffling)
**Patterns Updated**: `proctor-assessment-question-bank.md`.

**Changes**:
- **Created "CP Newton's 2nd Law Quiz" (`cp_newtons_second_law_quiz`)**:
  - Provisioned a dedicated lower-level Conceptual Physics assessment with a hard limit of `max_questions: 12`.
  - Synced assessment record to `assessments` and `gradest_assignments` with `maxScore: 12`.
- **40-Question Accessible Bank (IDs 401–440)**:
  - **20 Straightforward Conceptual MCQs (IDs 401–420)**: Clean, 1–2 sentence prompts focusing on core definitions ($F=ma$, units of N, kg, m/s²), direct relationships (push harder = faster acceleration, heavier = slower acceleration), direction of net force, balanced vs unbalanced forces, and mass vs weight.
  - **20 Low-Level Calculation Problems (IDs 421–440)**: Friendly, small integer arithmetic for $F = m \cdot a$, $a = F/m$, $m = F/a$, Earth weight ($W = m \cdot 10$ and $9.8$), opposing forces ($F_1 - F_2$), and push against friction.
  - All 40 questions have `has_calculator: true` with embedded Desmos calculator enabled and zero LaTeX notation.
- **Fixed Static Option Shuffling (All Questions Were Option A)**:
  - Identified that `processDynamicQuestions()` in `THE_PROCTOR_TEMPLATE.html` and `THE_PROCTOR_BETA.html` only shuffled options for `calculated` questions; static questions were returned with their original array order, which had the correct answer at index 0 (Option A).
  - Added runtime Fisher-Yates array shuffling for static questions in both proctor templates.
  - Randomized stored `options` order for all static questions across both `cp_newtons_second_law_quiz` and `newtons_second_law_quiz` in Firestore.

## 2026-10-07 — Kinematic Velocity Calculator: Auth Resilience & Lucide District Filter Armor
**Patterns Updated**: `dashboard-layout.md`, `mobile-responsive.md`.

**Changes**:
- **Resolved District Web Filter & Blocksi Lucide Crash**:
  - Replaced unpkg CDN script with local vendored `lucide.min.js`, multi-tier fallbacks (`assets/lucide.min.js`, jsDelivr), and an inline Unicode glyph shim in `kinematic_velocity_calculator/build-html.js`.
  - Added safety checks around all `lucide.createIcons()` invocations (`SpeechManager.updateSpeakButton`, `DOMContentLoaded`, level unlock modals), preventing `Uncaught ReferenceError: lucide is not defined` from halting login or preview mode.
- **Cross-Origin-Opener-Policy & Popup Auth Fallback**:
  - Configured Google Auth Provider with `hd: 'orangeusd.org'` domain hint.
  - Added automatic fallback to `fbAuth.signInWithRedirect(provider)` when popups are blocked or terminated by Chrome's `Cross-Origin-Opener-Policy` / Blocksi scanner.
  - Added `fbAuth.getRedirectResult()` handler on boot to complete sign-in smoothly upon redirection.
- **Chromebook Viewport Height & Vertical Scrolling Fix**:
  - Removed `overflow-hidden` from `<body>`, enabled `overflow-y: auto`, `my-auto` centering on view sections, and styled 8px high-contrast scrollbars.
  - Rebuilt `dist/index.html` and `index.html` via `build-html.js`.

## 2026-10-06 — Modified Atwood Hall's Carriage Lab
**Patterns Added**: `halls-carriage-modified-atwood-lab.md`.

**Changes**:
- **Hall's Carriage Modified Atwood Webapp (`Unit_2/halls_carriage_lab/`)**:
  - Engineered student lab activity modeled on `pull_back_toy_lab` for a horizontal modified Atwood machine setup using a blue plastic Hall's carriage and string laying over the table edge (no pulleys).
  - Maintained constant hanging pulling mass across 5 user-configurable carriage mass configurations.
  - Video timing protocol with precision digital stopwatch, fullscreen HUD, slow-mo 120/240 fps camera framing diagram, and time zeroing ($\Delta t = t_f - t_0$).
  - 3-step kinematic acceleration ladder ($v_{avg} = d/\Delta t$, $v_f = 2\cdot v_{avg}$, $a = v_f/\Delta t$) with 8% tolerance checking and instant feedback.
  - Dual-mode dynamic canvas graphs: $a$ vs. $M_{total}$ (inverse hyperbola) and $a$ vs. $1/M_{total}$ (linearized trendline through origin with slope $= F_{net}$).
  - Full WCAG AAA high-contrast light mode styling and updated curriculum integration in `assets/lessons-data.js` and `Unit_2/outline.md` under Day 28.

## 2026-10-06 — Transfer Student Baseline: [TRANSFER STUDENT] (STUDENT_ID, Period 1)
**Patterns Updated**: `classroom-gradebook-sync.md`.

**Changes**:
- **59% Benefit-of-the-Doubt Transfer Baseline**:
  - Identified transfer student [TRANSFER STUDENT] (`STUDENT_ID@orangeusd.org`) in Period 1 Conceptual Physics.
  - Tagged Firestore `roster` record with `transfer_student: true`, `isTransferBaseline: true`, `transfer_baseline_pct: 59`.
  - Populated 59% baseline scores across 17 Firestore assignment collections (`student_results` and `physics_labs`).
  - Patched Google Classroom gradebook across all 18 API-managed Period 1 coursework items (`5.9/10`, `11.8/20`, and `47.2/80`).
  - Updated `sync-classroom/sync-cli.js` so automated Conceptual Physics curves (`60 + 0.40 * rawPct`) respect `isTransferBaseline` and do not alter transfer baseline grades.

## 2026-10-06 — Roster Reconciliation & Dropped Student Pruning
**Patterns Updated**: `classroom-gradebook-sync.md`.

**Changes**:
- **Google Classroom vs Firestore Roster Reconciliation**:
  - Implemented `sync-classroom/compare-roster.js` (`npm run check:roster`) to reconcile Firestore `roster` collection against Google Classroom API enrollments across Periods 0–6.
  - Resolved dual-enrollment for Christian Ortiz Flores (confirmed removed from Period 2 Classroom course, active in Period 3).
  - Backed up all 8 dropped student documents to `sync-classroom/backup-pruned-students-2026-10-06.json` (safely `.gitignore`d for FERPA compliance) and pruned them from Firestore `roster`.
  - Re-ran comparison confirming 100% parity: exactly 177 active students across both systems with 0 missing, 0 extra, and 0 period mismatches.

## 2026-10-06 — Bell-Ringer Weekly Grading: Week 6 & Week 7 Deployed and Synced
**Patterns Updated**: `bell-ringer-config.md`, `classroom-gradebook-sync.md`.

**Changes**:
- **Dynamic School Week Calendar Resolution**: Enhanced `sync-classroom/sync-bellringers.js` with `WEEK_CALENDAR` date window mapping and automatic `--weekly` mode activation when `--week=N` is supplied.
- **Week 6 Synced & Returned**: Evaluated 534 submissions (Sep 21–25, 20 pts max), filtered zero-effort bypasses, generated Firestore `student_results/bell_ringer_week_6`, created Classroom coursework across all 7 periods under `Unit 2: Motion`, and pushed/returned 177 student grades.
- **Week 7 Synced & Returned**: Evaluated 543 submissions (Sep 28–Oct 02, 20 pts max), filtered zero-effort bypasses, generated Firestore `student_results/bell_ringer_week_7`, created Classroom coursework across all 7 periods, and pushed/returned 177 student grades.
- **Refreshed Timestamp**: Updated deployment timestamp in `partials/footer.html`.

## 2026-10-06 — Day 11 Curriculum Pruning: Removed Planned Graph Matching Worksheet
**Patterns Updated**: `dashboard-layout.md`.

**Changes**:
- **Removed Planned In-Class Worksheet Entry**: Pruned planned "Position vs. Time Graph Matching & Slope Worksheet" from Day 11 `assignments` in `assets/lessons-data.js`, keeping the graded and live "Position vs. Time Graphing Studio" webapp as the primary deliverable.
- **Refreshed Timestamp**: Updated deployment timestamp in `partials/footer.html`.

## 2026-10-06 — Day 22 Curriculum Pruning: Removed Galileo Thought Experiment Slides
**Patterns Updated**: `dashboard-layout.md`.

**Changes**:
- **Removed Stand-in Lecture Slides**: Pruned "Galileo vs. Aristotle Thought Experiments" resource link from Day 22 in `assets/lessons-data.js`, keeping the authentic "Inertia Presentation Slides" and Julius Sumner Miller demonstration video.
- **Refreshed Timestamp**: Updated site deployment timestamp in `partials/footer.html`.

## 2026-10-06 — Newton's 2nd Law Calculator: Chromebook Viewport & Vertical Scroll Restoration
**Patterns Updated**: `mobile-responsive.md`.

**Changes**:
- **Resolved Viewport Height Clipping & Missing Scrollbar**:
  - Removed Tailwind's `overflow-hidden` class from `<body>` in `newtons_second_law_calculator/src/template.html` (which was compiling to `overflow: hidden;` and completely disabling the browser window scrollbar).
  - Explicitly declared `overflow-x: hidden; overflow-y: auto;` on `body` and `overflow-x: hidden; scroll-behavior: smooth;` on `html`.
  - Added `my-auto` to top-level sections (`#view-register`, `#view-workspace`) within the flex container so content centers when ample vertical space is available, but smoothly collapses to top alignment when content exceeds the viewport height on 1366×768 Chromebooks (550–650px usable browser height).
  - Rebuilt both standalone `newtons_second_law_calculator/index.html` and `dist/index.html` via `build-html.js`.
- **High-Contrast Visible Custom Scrollbars**:
  - Upgraded scrollbar track and thumb styling to 8px width with high-contrast semi-transparent thumbs (`rgba(255, 255, 255, 0.25)` in dark mode, `rgba(15, 23, 42, 0.28)` in light mode, with accent glow on hover).
  - Added standard `scrollbar-width: thin; scrollbar-color: ...` CSS declarations for non-WebKit browsers.
- **Automated Viewport Validation**:
  - Verified scrolling across standard Chromebook (1366×650), Level 2 + Desmos Open (1366×650), Split-Screen (1000×580), and low-height viewports (1280×500) with 100% test pass.

## 2026-10-06 — PRIDE Time Console: Local HTML5-QRCode Vendor & Scanner Resilience
**Patterns Updated**: `dashboard-layout.md`.

**Changes**:
- **Local HTML5-QRCode & Barcode Engine Bundling**:
  - Downloaded and vendored `html5-qrcode.min.js`, `lucide.min.js`, and `JsBarcode.all.min.js` locally in `pride-time/vendor/` and `assets/vendor/`.
  - Replaced unpkg CDN tags in `admin/pride_time.html` with local paths and jsdelivr fallback, eliminating `Html5Qrcode is not defined` crashes caused by district web filters blocking unpkg.
- **ScannerEngine State Guarding (`pride-time/pride-app.js`)**:
  - Added existence guards for `typeof Html5Qrcode === 'undefined'` in `ScannerEngine.start()` and `populateCameraList()` to display a clean warning rather than throwing unhandled `ReferenceError`.
- **Google Auth Redirect Fallback**:
  - Added automatic fallback to `signInWithRedirect` if popup authentication is blocked or rejected, plus domain hinting via `hd: 'orangeusd.org'`.
- **Tailwind Notice Filter**:
  - Suppressed harmless Play CDN console warning banner in `admin/pride_time.html`.

## 2026-10-06 — Calculator Resilience: Local Lucide Bundling, NGSS Root Path Fix & Auth Fallback
**Patterns Updated**: `dashboard-layout.md`, `cast-aligned-webapp-design.md`.

**Changes**:
- **Local Lucide Vendor & Resilience Shim**:
  - Saved local `assets/lucide.min.js` and `newtons_second_law_calculator/lucide.min.js` to eliminate failures caused by district web filters blocking unpkg CDN.
  - Added safe fallback shim for `window.lucide.createIcons()` so missing CDN scripts never throw `ReferenceError: lucide is not defined` or abort page initialization.
  - Guarded all `lucide.createIcons()` invocations throughout `src/app.js`.
- **Directory Root Path Resolution Fix (`assets/ngss-helper.js` & `assets/partials.js`)**:
  - Fixed `rootPath` calculation when web apps are accessed via trailing-slash directory paths (e.g. `/newtons_second_law_calculator/`) rather than explicit `/index.html`.
  - Dynamically detects script tag location via `document.currentScript` or segment extension checks, completely eliminating 404s when loading `ngss-explorer/standards-data.js`.
- **Google Auth Popup Resilience & Redirect Fallback**:
  - Configured `hd: 'orangeusd.org'` in Google Auth provider to streamline student domain sign-in.
  - Added automatic fallback to `fbAuth.signInWithRedirect` when popups are blocked by school Chromebook security policies or Cross-Origin-Opener-Policy restrictions, with `getRedirectResult()` handling on boot.
- **Console Warning Cleanup**:
  - Suppressed harmless Tailwind Play CDN development warning banner in student consoles.

## 2026-10-06 — Day 26 Promotion: Newton's 2nd Law Studio & Planned Placeholder Pruning
**Patterns Updated**: `dashboard-layout.md`.

**Changes**:
- **Elevated Newton's 2nd Law Studio on Day 26**:
  - Promoted `Newton's 2nd Law Studio — Mastery Arena` to the #1 primary active graded assignment in `assets/lessons-data.js` and `Unit_2/outline.md` on Day 26.
  - Made the studio prominently visible under Graded Coursework in the lesson modal and on dashboard lesson cards, instead of being tucked away as a side note under practice tools.
- **Pruned Day 26 Planned Placeholders**:
  - Removed obsolete placeholder `Balanced & Unbalanced Forces Challenge (Periods 1–6)` (`status: planned`) from Day 26 deliverables.
- **Refreshed Deployment Timestamp**:
  - Ran `scripts/update-timestamp.js` to update `partials/footer.html`.

## 2026-10-05 — Dashboard Subscript Formatting Fix & Day 27 Stand-In Link Pruning
**Patterns Updated**: `dashboard-layout.md`.

**Changes**:
- **Modal Header Subscript Formatting**:
  - Replaced `modalTitle.innerText` with `modalTitle.innerHTML` in `unit2-dashboard.html` to prevent raw `<sub>` tags from leaking as literal strings.
  - Added CSS rule for `#modal-title sub, .bg-clip-text sub` ensuring subscripts inside gradient-clipped text remain visible with high-contrast accent coloring (`#ccff00`).
  - Switched `assets/lessons-data.js` Day 27 and Day 28 topic strings to standard Unicode subscripts (`Fₙₑₜ = m · a`), guaranteeing seamless rendering across gradient headings, cards, and plaintext tooltips/labels.
- **Day 27 Stand-In Link & Planned Handout Cleanup**:
  - Removed obsolete `Modified Atwood Track Lab Report` (planned placeholder) from Day 27 `assignments` in `assets/lessons-data.js` and `Unit_2/outline.md`.
  - Removed placeholder `Atwood Machine System Analysis Guide` (which pointed to a stand-in slides link) from Day 27 `resources`.
  - Cleaned deliverables to showcase the two verified live student webapps: `Newton's 2nd Law Studio — Mastery Arena` and `Newton's 2nd Law Calculator (Fₙₑₜ = m · a)`.
  - Updated site deployment timestamp in `partials/footer.html`.

## 2026-10-05 — Newton's 2nd Law Studio: Roster Resolution & Firestore Payload Sanitization
**Patterns Updated**: `newtons-second-law-atwood-studio.md`.

**Changes**:
- **Roster Period Resolution**: Fixed `lookupPeriod(email)` in `Unit_2/newtons_second_law_studio/js/auth.js` to look for `d.class_period` (matching Firestore schema) instead of `d.period`, ensuring Period 0 Honors students get `honorsRequired: true`.
- **Firestore Payload Sanitization**: Guarded `class_period` and profile fields against `undefined` values (defaulting to `null`), eliminating `Cannot use "undefined" as a Firestore value` errors that would crash student save requests.

## 2026-10-05 — Google Classroom Sync & Daily Update
**Patterns Updated**: `classroom-gradebook-sync.md`.

**Changes**:
- **Firestore Slash ID Resolution**: Fixed Firestore document resolution in `sync-classroom/sync-cli.js` for date-named assignments with forward slashes (e.g. `9/28` -> `9%2F28`) by expanding `possibleIds` to include URL encoded and decoded variants.
- **Google Classroom API Past Due Date Handling**: Omitted `dueDate` for retrospective coursework to satisfy the Google Classroom API constraint (`dueDate: Due date must be in the future`).
- **The Gradest `9/28` Synced**: Successfully deployed `9/28` (20 pts) across all 7 periods and synced 74 student scores with 0 errors.
- **Daily Site Update**: Refreshed deployment timestamp (`partials/footer.html`) and verified Day 26 & 27 curriculum alignments in `assets/lessons-data.js`.

## 2026-10-05 — The Gradest: Zero-Latency Master Roster Fallback & Manual Grading Prioritization

**Patterns Updated**: `cloud-sync-architecture.md`, `cast-aligned-webapp-design.md`.

**Changes**:
- **Manual Grade Entry Roster Resolution & Prioritization**:
  - Re-architected roster resolution across 4 robust tiers: assignment roster (`state.roster`), cloud roster (`state.globalRoster`), hardcoded bundled master roster (`DEFAULT_GLOBAL_ROSTER`), and graded records (`state.grades`).
  - Dropdown options in `#manual-student-select` are grouped into `<optgroup label="⏳ Ungraded Students (N)">` at the top and `<optgroup label="✓ Already Graded (M)">` at the bottom.
  - Added a one-click toggle button (`#btn-toggle-roster-filter`) allowing teachers to show Ungraded Students only or toggle back to All Students.
  - Fixed assignment load roster normalization in `loadAssignment(name)` and `createNewAssignment()` to eliminate Map conversion bugs on serialized object arrays.

## 2026-10-04 — Newton's 2nd Law Studio: Accounts, Grading & Honors Differentiation

**Pattern Updated**: `newtons-second-law-atwood-studio.md`.

**Changes**:
- Added `js/auth.js`: Google sign-in / guest gate, roster period lookup, Firestore progress + score at `student_results/unit2_day27_newtons_second_law_studio/students/{id}` (10 pts: 2 per step + 0.8 per Arena tier, best kept). Not yet registered in `assignment_registry` / Classroom.
- Step 1 rebuilt to the teacher's sequence (no-mass inertia → right weight, mass × g → balance with a 5 s test → net force teaching → 3 examples), plus the ⭐ Honors "Direction matters" signed net force section (required for Period 0, opt-in for Periods 1–6).
- Desmos calculator + one-at-a-time hints on every calculation; read-aloud; formulas never wrap; force diagrams always on screen at Chromebook size.

## 2026-10-04 — Newton's 2nd Law Studio: Guided One-Task Engine & Force Diagrams

**Pattern Updated**: `newtons-second-law-atwood-studio.md`.

**Changes** (teacher feedback: too much on one screen, students click through, need FBDs):
- Replaced the all-at-once checklist with a one-task-at-a-time card (`js/lessons.js`). Wrong answers load a new scenario with different values and restart that part. The Arena follows the same rule.
- Added `js/fbd.js`: "Forces on the cart" picture + technically correct free-body diagram (F_N, F_g, tensions, hand/bumper force, to scale), with a legend of what exerts each force.
- Track overlay now shows ΣF on the cart (T_R − T_L), not the system's net force.
- Physics symbols use real subscripts everywhere (`js/text.js`); kept the term "photogate" with an explainer.

## 2026-10-04 — Newton's 2nd Law Studio: Dual-Pulley Horizontal Atwood Machine

**Pattern Added**: `newtons-second-law-atwood-studio.md`.

**Changes**:
- Built `Unit_2/newtons_second_law_studio/` from `Unit_2/newtons_second_law_studio_plan.md`: Step 1 Equilibrium (release + nudge), Step 2 Isolate Force (token transfers, M_total locked at 500 g), Step 3 Isolate Mass (cargo/equal pairs, F_net locked at 0.50 N), and a 5-tier randomized Mastery Arena with certificate + Classroom summary.
- Used g = 10 m/s² (class convention) instead of the plan's 9.8.
- Linked in `assets/lessons-data.js` (Day 26 links + practice; Day 27 links, assignment, practice), `Unit_2/outline.md` (Days 26–27), and `unit2-dashboard.html`. Refreshed footer timestamp.

## 2026-10-04 — Day 26 Curriculum Differentiation & Honors Inertia Observation Log

**Patterns Updated**: `printable-graphing-worksheets.md`, `dashboard-layout.md`.

**Changes**:
- **New 2-Page Honors Observation Table Handout (`Unit_2/worksheets/Inertia_Demonstration_Observation_Log.html` & `.pdf`)**:
  - Re-architected into a 100% black-and-white laser printer friendly **15-demonstration observation ledger**:
    - Top instruction card on Page 1 defines observer protocol once at the top, directing students to record how each demonstration utilizes inertia to be successful (resistance to acceleration, Newton's 1st Law, zero forward force).
    - Removed score column and condensed widgets to eliminate visual clutter.
    - Widened Column 1 (34% width) with long underline blanks for Presenter(s), Demo Title, and category checkboxes (Rest, Motion, Direction).
    - Expanded Column 2 (66% width) dedicated entirely to "How the Demonstration Utilizes Inertia to be Successful" with 3 wide dotted writing lines per demo.
    - Page 1 hosts Demos 1–8; Page 2 hosts Demos 9–15 (15 demos total across 2 pages), followed by Section B Honors Synthesis (minimizing unwanted force transfer + mechanical equilibrium condition ΣF = 0) and teacher verification bar.
  - Built with Puppeteer generator script (`scripts/generate_inertia_observation_log.js`) adhering strictly to 2-page letter portrait print budget with zero overflow.
- **Unit 2 Day 26 Curriculum Differentiation (`assets/lessons-data.js`, `Unit_2/outline.md`, `unit2-dashboard.html`)**:
  - Differentiated Period 0 Honors (live student inertia demonstrations with 2-page Observation Log, transitioning into net force and mechanical equilibrium) vs. Periods 1–6 CP Physics (forces, contact vs. field, net force summation F_net = ΣF, balanced vs. unbalanced forces).
  - Added `Inertia Demonstration Peer Observation Log (Period 0 Honors)` to Day 26 assignments, resources, and links.
  - Updated dashboard script cache buster in `unit2-dashboard.html` (`v=20261005`).

## 2026-10-04 — Single-Page Performance Task: Inertia Demonstration Planner

**Patterns Updated**: `printable-graphing-worksheets.md`.

**Changes**:
- **Single-Page Worksheet Re-architecture (`Unit_2/worksheets/Inertia_Demonstration_Planner.html` & `.pdf`)**:
  - Re-engineered the Inertia Demonstration Planner from 2 pages into a compact, high-density, strictly 1-page letter portrait format (`height: 10.56in` budget, `0.22in` top/bottom margins, `0.28in` left/right margins).
  - Adopted a clean 2-column balanced layout:
    - **Left Column (Build & Protocol)**: Phase 1 (Category Selection & Codename), Phase 2 (Bill of Materials & Apparatus Inventory), Phase 3 (Setup Blueprint & Vector Diagram with 13mm dot grid), Phase 4 (4-step Execution Protocol).
    - **Right Column (Defense & Synthesis)**: Phase 5 (Free-Body Diagram defense proving equilibrium vs. dynamic split-second action with explicit misconception warning on forward forces), Phase 6 (Scaffolded CER Claim-Evidence-Reasoning), Phase 7 (Automotive 3-Point Inertia-Reel Seatbelt engineering synthesis), Phase 8 (Demonstration scoring checklist with 10-point rubric and teacher score box).
  - Removed obsolete `preview_Inertia_Planner-2.png` and regenerated `preview_Inertia_Planner-1.png` via `pdftoppm` for 100% vector-faithful thumbnail preview.
  - Updated `assets/lessons-data.js` Day 25 descriptions and submission metadata to reflect "Single-Page Printable Planner".
  - Updated `scripts/generate_inertia_demonstration_worksheet.js` to compile the single-page student planner and exemplar key with automated PDF generation.

## 2026-10-04 — Dashboard Cleanup: Unit 2 Day 25 Inertia Demonstration Planner & Master Key Prohibition

**Patterns Updated**: `dashboard-layout.md`, `printable-graphing-worksheets.md`.
**Workspace Rules Updated**: `.agents/AGENTS.md`.

**Changes**:
- **Unit 2 Day 25 Dashboard Lesson Cleanup (`assets/lessons-data.js`, `Unit_2/outline.md`, `unit2-dashboard.html`)**:
  - Cleaned up Day 25 to focus strictly on the **Inertia Demonstration & Physics Defense Planner** (`Inertia_Demonstration_Planner.pdf`).
  - Removed discordant elements: Whiteboard FBD Sprint planned handout, Force Toolkit presentation slides, and Speed & Distance Studio practice sandbox.
  - Set custom exemplar metadata (`exemplarTitle` and `exemplarDescription`) with preview thumbnail image (`preview_Inertia_Planner-1.png`).
  - Aligned bell-ringer to concept chat: "Inertia Defense & The 'Forward Force' Trap" using the standardized AI Physics Mentor master persona.
- **Strict Master Key Prohibition Standard**:
  - Established a strict workspace rule prohibiting `Teacher Master Key`, `Teacher Key`, or `Answer Key` entries in student-facing lesson information, curriculum stores (`assets/lessons-data.js`), unit dashboards, or course outlines.
  - Purged all Teacher Master Key entries from `assets/lessons-data.js` (Day 19 and Day 25) and `Unit_2/outline.md` (Day 25).
  - Codified policy in `.agents/AGENTS.md`, `dashboard-layout.md`, and `printable-graphing-worksheets.md`.


## 2026-10-02 — The Inertia Showcase: Demonstration & Physics Defense Planner (Unit 2 Day 25)

**Pattern Applied**: `printable-graphing-worksheets.md` (Strict 2-page letter print budget, Puppeteer rendering, zero-LaTeX).

**Changes**:
- **New 2-Page Performance Task Worksheet (`Unit_2/worksheets/Inertia_Demonstration_Planner.html` & `.pdf`)**:
  - High-school student planner for engineering and defending a live physical proof of Newton's First Law.
  - Page 1: Mission briefing, 3-category selection (Rest, Motion, Direction), 4-column Bill of Materials & safety checklist, 14 mm dot-grid setup blueprint sketch, and 4-step execution protocol.
  - Page 2: Free-Body Diagram vector proof (Equilibrium vs. Split-Second Action), scaffolded CER scientific defense (Claim, Evidence, Reasoning), authentic everyday life & engineering synthesis (automotive seatbelts, hammerheads, tangent throw), and a 16-point demonstration scoring rubric.
- **New 2-Page Teacher Master Key & Guide (`Unit_2/worksheets/Teacher_Master_Key_Inertia_Demonstration.html` & `.pdf`)**:
  - Zero-prep physics closet supplies guide (beakers, 3x5 cards, steel washers, carts, pie pans).
  - 3 fully worked exemplars (The Coin-Drop Beaker Snap, The Ejection Seat Crash Cart, and The Cut-Tether Tangent Slingshot).
  - Common student pitfalls, FBD grading criteria (penalizing unphysical "forward inertia force" arrows), and quick 30-second teacher defense check-in interview questions.
- **Site Integration**: Added to Day 25 in `assets/lessons-data.js` and `Unit_2/outline.md`. Regenerated with Puppeteer, validated exact 2-page letter budgets, and updated site footer timestamp.

## 2026-10-01 — Halloween Theme Redesign: "Night at Orange High: The Graveyard of Dead Theories"

**Pattern Rewritten**: `seasonal-theming-architecture.md`.

**Changes**:
- Replaced `assets/halloween.css` and `assets/halloween.js`. The old theme's neon geometric webs, nav spiders, zombie hand, skeleton, and Creepster card titles are gone. It also no longer dims the Bell-Ringer card.
- **New moonlit scene on every `.hero`** (one canvas): harvest moon, stars, clouds, fog, bat flocks, and will-o'-wisps that act like charged particles (1/r² repulsion from the cursor).
- **Physics toys at class conventions (g = 10 m/s², 100 px = 1 m)**: a spider on a silk spring (damped mass-on-a-spring you can grab and fling), and jack-o'-lanterns that launch projectile-motion candy.
- **Signature idea**: a graveyard of six debunked theories (Aristotle's falling bodies, impetus, caloric, luminiferous aether, phlogiston, geocentrism). Each tombstone is an accessible button that opens a historically accurate epitaph.
- The spooky font (`Jolly Lodger`) is used only for the hero title and section headings; all card text and buttons keep normal fonts.
- **Self-expiring**: `partials.js` and `halloween.js` load the theme only in October (`?halloween=on` previews it, `?halloween=off` hides it). Removed the hard-coded 🎃 and "Spooky Season" text from `partials/header.html` and `partials/footer.html`, plus the direct theme includes and Halloween card from `index.html`.
- Calm mode and `prefers-reduced-motion` give a still scene. Sound is off by default. The loop pauses off-screen. Verified 60 fps, no console errors, and no horizontal scroll on phones.

## 2026-10-01 — Spooky Season: Halloween Physics Architecture & Interactive Ghouls

**Pattern Added**: `seasonal-theming-architecture.md`.

**Changes**:
- **Halloween Theming System (`assets/halloween.css`, `assets/halloween.js`)**:
  - Implemented an October special edition theme delivering Jack-O'-Lanterns, skeletons, zombies, and spooky physics effects with zero performance regression and full preservation of core academic functionality.
  - **Flickering Jack-O'-Lanterns**: Detailed vector SVG carved pumpkins with `@keyframes hw-flicker` candle illumination perched on cards; clicking a pumpkin triggers synthesized audio and a kinematic candy drop.
  - **Harmonic Pendulum Skeleton**: Animated vector skeleton suspended from the top viewport rocking in simple harmonic motion ($\theta(t) = \theta_0 \cos(\omega t)$); clicking rattles bones with a synthesized Web Audio xylophone arpeggio and displays physics torque quips ($\tau = I \alpha$).
  - **Creeping Zombie & Undead Ground Hand**: Animated undead hand bursting from the soil at the footer; on-demand roaming zombie with outstretched arms who recites kinematics definitions ($v = \Delta x / \Delta t$) when clicked.
  - **Atmospheric Visuals**: Glowing Harvest Blood Moon in the midnight sky, flapping silhouette bats on bezier flight arcs, drifting graveyard fog ribbons, corner cobwebs, and dangling spiders.
  - **Zero-Dependency Web Audio API Synthesizer**: Custom oscillator sound effects (skeletal xylophone rattle, low zombie moan, witch chuckle, bat chirp, and bubbly candy bounce) generated on-the-fly without external audio file requests.
  - **Kinematic Physics Candy Drop**: Interactive particle burst applying gravitational acceleration ($g = 980\text{ px/s}^2$), floor collision detection, restitution bounces ($e \approx 0.62$), and rotation.
  - **Spooky HUD Controller**: Floating badge with toggles for Spooky Theme (ON/OFF), Audio (🔊 ON/🔇 OFF), Candy Drop, and Ghoul Summoning, persisting user preferences via `localStorage`.
- **Site-Wide Header & Footer Integration (`partials/header.html`, `partials/footer.html`, `assets/partials.js`, `index.html`)**:
  - Added pumpkin brand badge in the navigation bar and October edition copyright tag in the footer.
  - Dynamically injected theme through `assets/partials.js` while maintaining instant direct load on `index.html`.
- **Site Deployment Timestamp Updated**: Executed `scripts/update-timestamp.js` updating deployment timestamp in `partials/footer.html`.

## 2026-09-30 — Mass, Weight & Zero-G Inertia Studio (Unit 2 Day 24)

**Changes**:
- **New Interactive Webapp (`Unit_2/mass_weight_studio/`)**: Built from `Unit_2/mass_weight_studio_plan.md`. Vanilla HTML/CSS/JS, no dependencies.
  - Station 1 Volume Chamber: isometric laser calipers (L × W × H) and a displacement tank (60 × 60 cm footprint, 3.6 L per cm). Mass is never shown here.
  - Station 2 Planetary Gravity Platform: damped analog needle + LED readout for Earth, Moon, Mars, Jupiter, and Deep Space, with a locked-mass vs. changing-weight banner (W = m · g).
  - Station 3 Zero-G Inertia Chamber: Nudge Test (identical push, drift speed depends only on mass) and Airlock Catch (0 N forward force, barrier dent grows with mass, cargo is lost through the airlock if not caught). Stays qualitative, with no F = m · a.
  - Mastery Arena (Mythbusters: Deep Space Edition): 5 questions with randomized numbers and option order, one locked-in answer each. Q4 ranks 3 randomized sealed crates (the biggest crate is never the most massive). Passing is 4 / 5, which awards a certificate with a SHA-256 verification code (FNV fallback) and a Copy Submission Summary button for Google Classroom.
  - An evidence log fills in automatically. State persists in `localStorage` so a refresh can't re-roll the crates. Retake generates new crates and scenarios and increments the attempt counter.
  - Includes high-contrast light mode, 16/20/24 px root font scaling, and a sticky dock.
- **Google Sign-In & Firestore Grading (`js/auth.js`)**: A full-screen sign-in gate requires an `@orangeusd.org` account (or a teacher email). Progress (`studioState`) saves with a 1.5 s debounce to `student_results/unit2_day24_mass_weight_studio/students/{studentId}`, with a per-student `localStorage` copy as an offline fallback (whichever has the newer `savedAt` wins on load). Grade is 10 pts: 5 pts × (filled Evidence Log cells / 42), where the cells are 7 objects × volume, Earth/Mars/Deep-Space weight, nudge speed, and barrier dent ('lost' doesn't count), plus 1 pt per correct question. Both halves are kept as best-ever values, so retakes never lower the grade. Writes `score` (0–10), `maxScore`/`maxPoints: 10`, and `percentage` for `sync-cli.js` and `data_export.html`. The parent doc and registry come from `deploy-assignment.js --id unit2_day24_mass_weight_studio`.
- **Guest Mode**: "Continue as Guest" on the sign-in gate saves only to `localStorage` (`mws_state_guest`) and never writes to Firestore or the gradebook. "Sign in for credit" reloads the page into the student's account, and their guest progress carries over if the account has no saved progress yet.
- **Task Clarity Scaffolding (for students who stall at the start)**: A "Read this first" mission briefing appears on the first visit. A mission bar (always at the top) shows the task, per-station progress tiles (Volume 7, Weight 21, Inertia 14, Arena 5), and a 👉 NEXT STEP line with a Go → button that switches tab/object/planet/mode and pulses the button to press. Each station panel opens with a "✅ DO THIS" box, object chips show ✓ or n/3 progress for the current station, and a toast confirms each new Evidence Log cell. Verified: pressing only Go → (plus the pulsed button) fills all 42 cells.
- **Site Integration**: Day 24 in `assets/lessons-data.js` (activity, link, active assignment), `Unit_2/outline.md`, `unit2-dashboard.html`, and `resources.html`. Timestamp refreshed.

## 2026-09-30 — Daily Lesson Update & Concept Chat Persona Compliance

**Changes**:
- **Daily Site Timestamp Updated**: Executed `scripts/update-timestamp.js` updating site deployment timestamp in `partials/footer.html` to `Sep 30, 2026, 8:48 AM PDT`.
- **Master Persona Synchronization (`assets/lessons-data.js`)**: Updated Days 12, 13, and 23 `concept_chat` bell-ringers to inject the full standard AI Physics Mentor master persona (`chatSystemInstruction`), ensuring 100% compliance across all concept chat activities.
- **Curriculum & NGSS Alignment Audit**: Verified all 139 daily lesson objects in `assets/lessons-data.js` for explicit `standards` array tagging.

## 2026-09-29 — Sound Wave Studio: Chromebook Tuning Fork Oscilloscope & Desmos Fitter

**Pattern Added**: `tuning-fork-oscilloscope-sinusoidal-modeling.md`.

**Changes**:
- **New Standalone Web Application (`sound-wave-lab/index.html`)**:
  - Developed a Chromebook- and mobile-ready sound wave laboratory solving the deprecated Vernier Logger Pro / missing microphone dilemma for math and physics teachers.
  - **Chromebook Audio Processing Bypass**: Configured WebRTC `getUserMedia` to explicitly disable `echoCancellation`, `noiseSuppression`, and `autoGainControl`, preventing Chrome from squelching pure tuning fork sine waves as background fan/hum noise.
  - **Zero-Hardware Virtual Tone Generator**: Built-in Web Audio synthesizer with standard scientific tuning forks (256 Hz C4, 288 Hz D4, 320 Hz E4, 341.3 Hz F4, 384 Hz G4, 426.7 Hz A4, 440 Hz Concert A, 512 Hz C5) with 1-click Direct Sampling into the oscilloscope buffer for students without physical tuning forks or mic access.
  - **Auto-Trigger & Vernier Calipers**: Rising-edge zero-crossing auto-trigger locks waves in place; draggable Calipers 1 & 2 measure Period $T = \Delta t$, Frequency $f = 1/T$, Peak-to-Peak $\Delta y$, Amplitude $A$, and Midline $D$.
  - **Sinusoidal Modeling Workbench**: Interactive parameter builder for both $y = A \sin(B(t - C)) + D$ and $y = A \cos(B(t - C)) + D$, live curve overlay on real audio data, "Auto-Set from Calipers" synchronization, and real-time $R^2$ accuracy scoring.
  - **In-App Non-Linear Least-Squares Regression**: Grid-search and linearized least-squares engine solves for optimal regression curve in $<5\text{ ms}$, rendering a benchmark curve to compare with student work.
  - **1-Click Desmos Integration**: Copies TSV table to clipboard optimized for Desmos (~100 points, zero-time alignment) with 1-click regression formula copying (`y_1 ~ a*sin(b*(x_1-c))+d`).
  - **Classroom Accessibility & Projection**: High-contrast Light Mode (WCAG AAA $\ge 14:1$), dark oscilloscope mode, universal root font scaling (Normal, Large, Projector), dynamic canvas re-rendering, and zero-scroll sticky top bar.
- **Site Integration (`index.html`, `unit6-dashboard.html`)**:
  - Added launch cards on the homepage simulator grid and Unit 6 Waves & Radiation dashboard.
- **Timestamp Refreshed**: Executed `scripts/update-timestamp.js` updating site deployment timestamp in `partials/footer.html`.

## 2026-09-28 — Daily Lesson Update & Alignment Verification

**Changes**:
- **Day 21 Bell-Ringer Lower-Friction Formula & Number Alignment (`assets/lessons-data.js`, `Unit_2/outline.md`)**:
  - Aligned the free-fall kinematic formula and gravitational acceleration directly with the [P031 Reaction Time Masterclass Guide](file:///c:/Users/rmudry/rrmudry.github.io/Unit_2/reaction_time_guide/index.html) ($g = 10\text{ m/s}^2$, $x = \frac{1}{2}gt^2 = 5t^2 \implies t = \sqrt{x / 5}$).
  - Lowered student execution friction by switching to clean, round catch distances: $x = 20.0\text{ cm} \implies 0.20\text{ m} / 5 = 0.04 \implies t = \sqrt{0.04} = 0.20\text{ s}$ ($200\text{ ms}$) for visual reflex, and $x = 45.0\text{ cm} \implies 0.45\text{ m} / 5 = 0.09 \implies t = \sqrt{0.09} = 0.30\text{ s}$ ($300\text{ ms}$) for phone distraction.
  - Simplified highway reaction distance math ($v_0 = 30\text{ m/s}$): alert distance $= 6.0\text{ m}$, distracted distance $= 9.0\text{ m}$ ($\Delta d = 3.0\text{ m}$, exactly 1 full car length).
- **Daily Site Timestamp Updated**: Executed `scripts/update-timestamp.js` updating site deployment timestamp in `partials/footer.html` to `Sep 28, 2026, 4:44 PM PDT`.
- **NGSS Standards Alignment Verification**: Audited and confirmed all 139 daily lesson objects in `assets/lessons-data.js` have 100% explicit `standards` array tagging and zero LaTeX syntax errors.
- **Security & Privacy Audit & Hardening**:
  - **FERPA Student PII Protection**: Excluded `admin/reports/*_Report.*` and `*.pdf` from Git tracking via `.gitignore` and removed cached audit reports containing student names and 6-digit IDs.
  - **Teacher Master Key Protection**: Added `*Teacher_Master_Key*` to `.gitignore` and untracked all worked solutions and keys across `Unit_2/honors_worksheets/` and `Unit_2/worksheets/` to prevent answers from being publicly accessible on GitHub Pages.
  - **Firestore Security Rules Hardening (`firestore.rules`)**:
    - Disallowed unauthenticated collection enumeration (`list: if isAdmin()`) across `student_results`, `practice_results`, `physics_labs`, and `roster`. Verified via REST curl testing that public attempts to scrape student rosters/results receive HTTP 403 Forbidden, while legitimate individual student lookups (`get`) and lab submissions (`create`/`update`) remain operational.
    - Locked down `/questions` and `/assessments` collections so unauthenticated clients cannot read the test question bank.
    - Deployed hardened rules to Firebase project `site-6e500` via Firebase CLI.

## 2026-09-27 — Inertia Studio: 3 Physical Categories of Newton's First Law

**Pattern Added**: `inertia-studio-three-categories.md`.
**Pattern Updated**: `honors-kinematic-displacement-worksheet.md`.

**Changes**:
- **Honors Kinematic Displacement Practice Worksheet Subscripts & Vertical Page Space Upgrade (`scripts/generate_kinematic_displacement_worksheet.js`, `Unit_2/honors_worksheets/`, `Unit_2/worksheets/`)**:
  - Replaced all raw underscore notation (e.g. `x_f`, `v_0`, `d_coast`, `d_accel`, `d_total`, `Area_rect`, `Area_tri`) with clean HTML subscripts (`x<sub>f</sub>`, `v₀`, `d<sub>coast</sub>`, `d<sub>accel</sub>`, `d<sub>total</sub>`, `Area<sub>rect</sub>`, `Area<sub>tri</sub>`) across all prompts, formulas, GUESS tables, and teacher solutions.
  - Eliminated the top vertical clustering by implementing flexbox distribution (`.page-content { flex: 1 1 auto; display: flex; flex-direction: column; justify-content: space-between; }` and `.problem-box { flex: 1 1 auto; display: flex; flex-direction: column; justify-content: space-between; }`).
  - Greatly expanded student workspace heights (`min-height: 52px` to `60px`), stage card heights, and $v\text{-}t$ SVG dimensions (`290x142`) to utilize the full $10.50\text{ in}$ vertical printable page height on both pages while strictly keeping a 2-page Letter budget (zero 3rd page spillover).
  - Recompiled and verified PDF and HTML releases for both student worksheet and teacher master key.
- **New Interactive Webapp (`Unit_2/inertia_studio/`)**:
  - Developed a standalone, dark-cosmic glassmorphic physics studio directly targeting common student misconceptions in Newton's First Law across 3 distinct physical categories:
    1. **Inertia of Rest**: Tablecloth pull and coin-beaker snap with Coulomb static/kinetic friction modeling, slip acceleration thresholds ($a > \mu_s g$), and tall object tipping torque.
    2. **Inertia of Motion**: Crash cart and braking simulation with seatbelt restraint toggle and prominent real-time vector HUD proving unrestrained forward motion has zero forward force ($F_{\text{fwd}} = 0\text{ N}$).
    3. **Inertia of Direction**: Whirling tether in uniform circular motion with instant tangent release trajectory, directly refuting the curved outward spiral misconception.
- **Mastery Challenge Arena & Gamification**:
  - Built a 3-tier progressive challenge satisfying the Student Task Engagement Law, awarding up to 100 points and issuing a downloadable/printable Certificate of Newton's First Law Mastery.
- **Zero-Dependency Web Audio Synthesis**:
  - Synthesized tablecloth whips, card snaps, glass clinks, crash screech/thuds, and success fanfare using the Web Audio API.
- **Crash Barrier Impact & Continuous Ejection Kinematics (`sim-motion.js`, `audio.js`)**:
  - Fixed rigid barrier collision detection so the vehicle's front bumper stops firmly against the front face of the barrier with front-hood crumple deformation, completely eliminating barrier penetration.
  - Resolved animation freeze bug where setting `state = 'ejected'` prematurely halted the update loop; unrestrained dummy ejection now runs continuously in a single seamless pass (sliding across cabin $\to$ launching through windshield $\to$ arcing over barrier $\to$ sliding along pavement to a stop).
  - Added synthesized `playCrash()` dual-layer thud & crunch noise effect to `audio.js`.
- **Penny & Beaker Center Alignment & Vertical Free Fall (`sim-rest.js`, `app.js`)**:
  - Fixed coordinate misalignment where the beaker was centered at $50\%$ width while the penny and card were placed at $33\%$ width, causing the penny to start off-target and fly past the beaker.
  - Aligned beaker, index card, and penny along the canvas centerline ($x = w \times 0.50$), with the penny resting directly above the beaker opening.
  - Refined rapid flick slip dynamics so horizontal velocity transfer is negligible ($\Delta x < 1\text{ px}$), ensuring the penny falls in pure vertical free fall straight into the beaker mouth with a satisfying glass clink.
- **Realistic Cabin Containment vs. High-Speed Ejection Threshold (`sim-motion.js`, `index.html`)**:
  - Eliminated cartoonish behavior where unrestrained dummies always ejected through the windshield regardless of stopping type or speed.
  - Implemented 3 realistic automotive physical regimes:
    1. **Emergency ABS Braking**: Dummy slides forward across the seat by inertia until contacting the steering wheel and dashboard inside the cabin ($x_{\text{rel}} = 2.15\text{ m}$), remaining pinned against the dashboard inside the vehicle for the remainder of the deceleration skid (zero ejection).
    2. **Low/Moderate Speed Barrier Collision ($v_0 < 22\text{ m/s}$ / $< 50\text{ mph}$)**: Laminated shatter-resistant safety glass and steering column contain the dummy inside the vehicle cabin; head/chest impact causes windshield spiderweb fracture lines with interior contact force HUD warnings.
    3. **High-Speed Severe Impact ($v_0 \ge 22\text{ m/s}$ / $\ge 50\text{ mph}$)**: Extreme kinetic energy ($E_k \ge 17\text{ kJ}$) breaches the windshield, launching the dummy in parabolic free fall over the barrier and sliding onto pavement.
- **P031 Reaction Time Lab PDF Replacement (`assets/lessons-data.js`, `unit2-dashboard.html`, `Unit_2/outline.md`, `resources.html`)**:
  - Replaced the external OneDrive Word doc (`.docx`) links across Days 19, 20, and 21 with the new local PDF `Unit_2/worksheets/P031_Reaction_Time_2026.pdf`.
  - Added dedicated quick-launch button on the Unit 2 Dashboard hero banner and added link to the *Kinematics & Motion* section in `resources.html`.
- **New Masterclass Webpage: Reaction Time Calculations & Grouped Graphing Guide (`Unit_2/reaction_time_guide/`)**:
  - Developed a standalone, step-by-step masterclass tailored for classroom projection with large high-contrast typography and sticky font size controls (`font-normal` [18px], `font-large` [22px], and `font-huge` [26px Projector Mode]).
  - Covers all 4 core instructional goals:
    1. **Average Drop Distance ($\bar{d}$)**: 3-trial addition, division, order-of-operations trap warnings, and live interactive calculator.
    2. **SI Unit Conversion ($\text{cm} \to \text{m}$)**: Explaining why $g = 10\text{ m/s}^2$ demands meters ($x = \text{cm} / 100$), avoiding $10\times$ calculation errors.
    3. **Reaction Time Solver ($t = \sqrt{x / 5}$)**: Simplified free-fall kinematics using classroom standard $g = 10\text{ m/s}^2$ ($x = \frac{1}{2}(10)t^2 = 5t^2 \implies t = \sqrt{x / 5}$), 2-step keystroke guide, reflex benchmark tiers, and live millisecond outputs.
    4. **Grouped Column Graphs**: Anatomy of clustered bar charts (Person 1–4, Undistracted vs. Distracted) with live HTML5 Canvas generator, distance vs. time mode toggles, sample class data loader, and PNG download.
    5. **CER Analysis**: Sentence frames for fastest/slowest reflex claims, numerical evidence citations, and neural signal processing reasoning connected to highway vehicle stopping distances.
- **Reaction Time Guide UX Enhancements (Tabs, Root Font Scaling, Light Mode, Vertical Math, Sticky Zero-Scroll Nav)**:
  - Fixed font size controls by switching class targets from `document.body` to `document.documentElement` (`font-normal` [16px], `font-large` [20px], `font-huge` [25px]), ensuring universal scaling across all `rem` layout tokens for projector use.
  - Converted the scrolling wall of text into a clean slide-style tabbed presentation (`#pane-1` to `#pane-5`) with top tabs and bottom Prev/Next Step buttons.
  - Streamlined and reduced wordiness into punchy, high-contrast step cards, big formula banners, and live widgets.
  - Implemented an ultra-high-contrast Light Mode theme (`html.theme-light`) with ink-slate text (`#0f172a`), solid borders, and theme-adaptive canvas graph rendering.
  - Replaced horizontal equation wrapping with vertically stacked column addition (`.vertical-math-stack`), vertical fractions (`.math-fraction`), and CSS overline variables (`.var-overline`).
  - Aligned free-fall equation to classroom standard $g = 10\text{ m/s}^2$: $t = \sqrt{x / 5}$ across UI, solvers, step cards, benchmark tables, and canvas grouped graph engine.
  - **Eliminated Horizontal Scrollbar & Prevented Button Scroll Out of View**:
    - Integrated `<nav class="tab-nav-bar">` directly into the sticky top `<header class="site-header">` (`position: sticky; top: 0; z-index: 100`) so the step buttons remain permanently anchored in view at all times.
    - Converted `.tab-nav-inner` to a balanced 5-column CSS grid (`grid-template-columns: repeat(5, minmax(0, 1fr))`) and streamlined tab button labels (`1. Average (cm)`, `2. Convert (m)`, `3. Reaction Time`, `4. Graphs`, `5. Analysis & CER`), completely removing horizontal overflow and scrollbars.
    - Updated `switchTab()` in `guide.js` to scroll smoothly to `top: 0`, guaranteeing step buttons and header stay in full view upon clicking any step.
  - **Seamless Connected Square Root Radical (No-LaTeX Vinculum)**:
    - Replaced the disconnected Unicode `√` font character and floating detached overbar with a vertically stretching SVG radical (`.math-radical .radical-symbol` with `preserveAspectRatio="none"`) meeting a flush overbar (`border-top: 0.1em solid var(--accent-cyan); margin-left: -1px;`).
    - The radical hook dips down to the bottom of the fraction, ascends to the top corner, and connects seamlessly into the horizontal overbar across both tall fractions and short decimal values with zero gap across all font zoom levels.
- **New Workspace Rule & Pattern Added**:
  - `classroom-projection-and-high-contrast-theming.md` added to `.agents/wiki/patterns/` and indexed in `index.md`.
  - Added mandatory rule in `.agents/AGENTS.md` requiring High-Contrast Light Mode (WCAG AAA > 14:1), universal root font scaling (`html.font-huge` 25px Projector Mode), dynamic HTML5 canvas theme re-rendering, and sticky zero-scroll navigation across all future webapps and teacher masterclasses.
- **Inertia Studio High-Contrast Light Mode & Projector Mode Implementation (`Unit_2/inertia_studio/`)**:
  - Upgraded Inertia Studio to full compliance with the new Classroom Readability Standard (`WCAG AAA >= 14:1` contrast).
  - Replaced hardcoded dark background containers (`.telemetry-grid`, `.category-bar`, `.canvas-wrapper`) with theme-adaptive styling (`body.light-theme` with `#ffffff` cards, `#f1f5f9` canvas stage, `#cbd5e1` borders, and `#0f172a` ink-slate text).
  - Re-engineered `.category-bar` into a responsive 4-column CSS grid (`repeat(4, minmax(0, 1fr))`) without horizontal scrollbars, featuring high-contrast active category pills in Light Mode.
  - Added universal root font scaling controls (`Normal` [16px], `Large` [20px], `🖥️ Projector` [24px]) targeted on `document.documentElement` (`html.font-*`) with `localStorage('inertia_font_size')` persistence.
  - Added persistent light/dark theme toggle with `localStorage('inertia_theme')` that updates button icon/text spans and triggers canvas re-rendering.
  - Updated all 3 simulation modules (`sim-rest.js`, `sim-motion.js`, `sim-direction.js`) to dynamically re-render HUD status banners with pure white pill cards, deep saturated border/text accents, light-mode roadway/pavement markings, and clear orbit grid lines.
- **Honors Kinematic Displacement Practice Worksheet & Master Key (`Unit_2/honors_worksheets/`)**:
  - Developed a standalone, 2-page publication-quality worksheet targeting $x_f = x_0 + v_0 t + \frac{1}{2}at^2$ across 5 scaffolded tiers for Period 0 Honors Physics:
    1. **Tier 1 (Launch From Rest)**: Top Fuel Dragster ($a = 28.0\text{ m/s}^2$) and Maglev bullet train ($a = 1.25\text{ m/s}^2$) with dragstrip boundary decision ($x_f = 143.4\text{ m} < 305\text{ m}$).
    2. **Tier 2 (Moving + Acceleration)**: Highway passing maneuver ($v_0 = 18\text{ m/s}, a = 3.5\text{ m/s}^2$) and Boeing 737 runway takeoff roll ($1,142.4\text{ m}$) deconstructing inertial coasting ($v_0 t$) vs. acceleration bonus ($\frac{1}{2}at^2$).
    3. **Tier 3 (Deceleration & Emergency Braking)**: Highway emergency stop ($a = -6.50\text{ m/s}^2$) and carrier cable arresting trap ($a = -24.5\text{ m/s}^2, x_f = 97.4\text{ m}$), enforcing strict sign discipline where negative acceleration subtracts distance.
    4. **Tier 4 (Multi-Stage Autonomous Braking Challenge)**: Obstacle avoidance with $t_1 = 0.50\text{ s}$ perception delay ($d_1 = 12.0\text{ m}$) + emergency ABS braking to rest ($d_2 = 36.0\text{ m}$), deciding collision safety with $+14.0\text{ m}$ clearance.
    5. **Tier 5 (Geometric Area Proof under $v\text{-}t$ Curve)**: Integrating rectangular coasting area ($72.0\text{ m}$) and triangular acceleration area ($28.0\text{ m}$) to prove exact equivalence with algebraic output ($100.0\text{ m}$).
  - Accompanied by a 2-page Teacher Master Key PDF with full GUESS steps, intermediate arithmetic, and boxed solutions.
  - Automated generation script (`scripts/generate_kinematic_displacement_worksheet.js`) compiles clean, high-contrast HTML and exact 2-page Letter PDFs via Puppeteer into both `Unit_2/honors_worksheets/` and `Unit_2/worksheets/`.
  - Added new pattern `honors-kinematic-displacement-worksheet.md` to `.agents/wiki/patterns/` and indexed in `index.md`.
- **Curriculum Integration**:
  - Linked to `unit2-dashboard.html`, `resources.html`, `assets/lessons-data.js` (Days 18, 19, 21, 22, 23), and `Unit_2/outline.md`.
  - Refreshed footer deployment timestamp in `partials/footer.html`.

## 2026-09-26 — Differentiated Scoring Architecture for Conceptual Physics (Periods 1–3)

**Pattern Updated**: `classroom-gradebook-sync.md`.

**Changes**:
- **Implemented 60% Passing Base + 40% Scaled Mastery Model (`sync-classroom/sync-cli.js`, `sync-classroom/server.js`)**:
  - Added dedicated differentiated scoring engine for Periods 1, 2, and 3 (Conceptual Physics) using $\text{effectivePct} = 60 + 0.40 \times \text{rawPct}$.
  - Equitably rewards effort on lower levels and authentic lab data gathering (e.g. 15% raw Level 1 completion ➔ 66.0% [6.6/10 pts D+]; 50% raw data collection ➔ 80.0% [8.0/10 pts B solid passing/mastery grade]) while scaling smoothly to 100% (10/10 pts).
  - Preserved standard linear scoring for Periods 0 (Honors) and Periods 4–6 (Regular Physics).
  - Preserved Rule B protection for teacher manual grades.
- **Retroactive & Live Sync**:
  - Re-evaluated and updated 208 student scores across Periods 1–3 in Google Classroom, returning grades for immediate Aeries SIS gradebook sync.

## 2026-09-26 — Google Classroom Grade Sync: Studio Score Normalization & Grade Recovery

**Pattern Updated**: `classroom-gradebook-sync.md`.

**Changes**:
- **Fixed Studio Score Normalization Bug (`sync-classroom/sync-cli.js`)**:
  - Identified and removed faulty fallback heuristic `else if (numScore <= 15 && numScore > 0) { rawPct = Math.round((numScore / 10) * 100); }`.
  - In 100-point 6-mission studio apps (`Dual Graph Studio` and `Position Time Graph Studio`), completing Mission 1 awards 15 points (15%). The buggy heuristic assumed any score `<= 15` was a score out of 10, calculating 15/10 = 150% and posting an inflated grade of `15/10 pts` to Google Classroom.
  - Refactored scoring logic to only divide by `max` when `max > 0 && numScore <= max`. When `max` is undefined, `score` in studio webapps is treated directly as a percentage (15 ➔ 15% ➔ 1.5/10 pts).
- **Google Classroom Grade Recovery**:
  - Live updated and returned all 13 student submissions in Google Classroom previously inflated to `15/10 pts` back to their authentic `1.5/10 pts` score.
  - Preserved Rule B protection for all teacher manual adjustments and legitimate retakes.

## 2026-09-25 — Unit 2 Day 20: 2-Stage Stopping Distance Bell-Ringer Interactive Graph

**Pattern Updated**: `bell-ringer-config.md`, `cast-aligned-webapp-design.md`.

**Changes**:
- **Interactive Shaded Velocity-Time Graph Stimulus (`assets/lessons-data.js`)**:
  - Upgraded Day 20's CAST Challenge ("Two-Stage Stopping Distance Telemetry") from static tabular data to a dynamic, interactive shaded `v-t` graph using `CASTGraphEngine`.
  - Visualizes automated emergency braking (AEB) telemetry:
    - Phase 1 (Reaction time: $t = 0.0$ to $0.5\text{ s}$): flat horizontal constant-speed line at $+20.0\text{ m/s}$ ($a = 0$), forming a shaded rectangular area representing reaction distance ($\Delta x_1 = 10.0\text{ m}$).
    - Phase 2 (Braking deceleration: $t = 0.5$ to $4.5\text{ s}$): linear downward deceleration slope ($a = -5.0\text{ m/s}^2$) stopping at $t = 4.5\text{ s}$, forming a shaded triangular area representing braking distance ($\Delta x_2 = 40.0\text{ m}$).
    - Total shaded area under the curve equals total stopping distance ($\Delta x = 50.0\text{ m}$).
  - Connected the `"🔍 Inspect"` modal zoom trigger (`cast-expand-graph-btn`) to allow fullscreen analysis and metric inspection.
- **Teacher Publishing Safeguard (`Bell-Ringer/teacher.html`)**:
  - Ensured publishing a pre-planned CAST challenge with graph stimulus preserves rich series styling (`fill: true`, `backgroundColor`, marker styling) when packaging `timerPayload.graphData`.
- **Curriculum & Timestamp Sync**:
  - Synchronized across `assets/lessons-data.js` and `Unit_2/outline.md`.
  - Refreshed deployment timestamp in `partials/footer.html`.

## 2026-09-24 — Student Lab Data Audit & In-Class Intervention Protocol Standard

**Pattern Added**: `student-data-audit-report.md`.
**Workflow Added**: `.agent/workflows/audit-student-data.md` (`/audit-student-data`).
**Skill Added**: `.agents/skills/student-data-audit-report/SKILL.md`.

**Changes**:
- **Standardized 2-Page Lab Audit Architecture**:
  - Established persistent pattern and skill for auditing student digital telemetry from Firestore across 6–7 class sections.
  - **Page 1: Telemetry & Quality Forensics**: Header bar, 4 KPI boxes, quality distribution bar, Section 1 pacing matrix, and Section 2 Master Anomaly Directory strictly ordered by class period (P1 -> P6).
  - **Page 2: In-Class Teacher Intervention Protocol**: Dedicated printable clipboard/tablet dashboard organized into a 2-column layout (Morning Conceptual P1–P3 vs Afternoon Regular P4–P6). Each period card features explicit Problem Cited (red box), Flagged Students & IDs, Support Needed / Teacher Action with verbal coaching scripts (green box), and Pending Drafts Checklist (amber box).
- **Telemetry Pathology Catalog**:
  - Formally codified detection criteria and remediation steps for 9 established archetypes: video frame numbers vs seconds, synthetic integer placeholders, anti-validator skirting, shared quad-group typos, distance-as-time confusion, stopwatch double-tap teleportation, mid-table unit switches, and vehicle collision/stalls.
- **Print & PDF Automation**:
  - Exact Letter portrait CSS budget (`@page { size: letter portrait; margin: 0.22in 0.28in; }`) and headless Puppeteer render routine guaranteeing 2-page PDFs with zero overflow.

## 2026-09-24 — System Streamlining: Single Source of Truth & Wiki Log Archival

**Pattern Updated**: `dashboard-layout.md`.

**Changes**:
- **Curriculum Architecture**:
  - Deleted legacy duplicate stores `Unit_2/lesson.json` and `Unit_2/unit2_lessons.json` (6,600+ redundant lines removed).
  - Updated `unit2-dashboard.html` and `Bell-Ringer/teacher.html` to consume `assets/lessons-data.js` directly as the unified single source of truth across all 7 units.
  - Updated `.agents/AGENTS.md` to strictly mandate `assets/lessons-data.js` as the sole master curriculum store.
- **Wiki Log Archival**:
  - Archived 2,295 historical lines into `.agents/wiki/logs-archive-2026.md`.
  - Pruned active `logs.md` from 2,371 lines down to ~90 lines for maximum token efficiency and fast context loading.

## 2026-09-24 — Daily Update: Unit 2 Day 20 Stopping Distance Synthesis & CAST Engine Polish

**Pattern Updated**: `cast-aligned-webapp-design.md`, `dashboard-layout.md`.

**Changes**:
- **Curriculum Harmonization (`assets/lessons-data.js`, `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, `Unit_2/outline.md`)**:
  - Aligned Day 20 (Kinematic Acceleration Synthesis: 2-Stage Stopping Distance Performance Challenge) for Friday (2026-09-25) across all 4 central stores with 100% key parity and dual NGSS alignment (`HS-PS2-1`, `HS-ETS1-2`).
  - Refined Part 2 calculation prompt to preserve authentic pedagogical friction by removing inline calculation leaks from the prompt text while preserving formula references in hints.
  - Audited all 139 lessons confirming 100% explicit NGSS standards tagging and 0 LaTeX syntax.
- **CAST Engine Enhancement (`assets/js/cast-item-engine.js`)**:
  - Implemented `formatSafeText()` to safely render inline HTML formatting (`<sub>`, `<sup>`, `<b>`, `<strong>`, `<i>`, `<em>`, `<code>`) across phenomenon narratives, prompts, data table captions, headers, cells, and formula hints while safely escaping untrusted markup.
  - Extended `cleanPromptText()` regex to match subscripted delta variables (e.g. `Δx₂`).
  - Bumped script cache busters in `Bell-Ringer/index.html` (`v=2.7`) and `unit2-dashboard.html` (`v=20260924b`).
- **Site Deployment**:
  - Refreshed site footer deployment timestamp via `node scripts/update-timestamp.js`.

## 2026-09-24 — The Gradest: Manual Grade Entry for Webcam Scanner

**Pattern Added**: `the-gradest-bubble-scanner.md`.
**Pattern Updated**: `classroom-gradebook-sync.md`.

**Changes**:
- **Webcam Scanner Manual Grade Entry Modal (`index.html`, `style.css`, `app.js`)**:
  - Implemented manual grade entry on the webcam bubble scanner page (`tab-scan`) for students who completed their tests on paper without bubbling the answer sheet.
  - Added primary access points directly on the Webcam Scanner feed controls (`btn-manual-entry-scan`), the Scanner Output header (`btn-quick-manual-output`), the empty-state scanner card (`btn-scanner-empty-manual`), and the Grades Directory (`btn-grades-manual-entry`).
  - Added fast roster dropdown picker with live graded/ungraded tracking status (e.g. `✓ Graded: 92/100 (92%)` vs `[Not yet graded]`), auto-complete student name search on Student ID keystroke, and existing score overwrite warning.
  - Added live percentage readout with color thresholds, quick score percentage preset chips (`100%`, `90%`, `80%`, `70%`, `50%`, `0% Missing`), and a rapid batching workflow via `"Save & Add Another"`.
  - Persists directly into `state.grades` with status `"Manually Entered"` (styled with `.badge-manual`), renders into recent scans session log, and syncs immediately to local storage and Cloud Firestore collection `gradest_assignments`.
- **Repository Synchronization**:
  - Fixed unclosed `#dialog-edit-grade` backdrop container tag.
  - Committed and pushed changes to `https://github.com/rrmudry/The_Gradest.git` `main` branch and synchronized local clone in `admin/The_Gradest/`.
  - Refreshed site footer deployment timestamp via `node scripts/update-timestamp.js`.

## 2026-09-23 — Differentiated Curriculum: P031 Reaction Time Lab (Period 0) & Pull-Back Toy Lab (Periods 1–6)

**Pattern Updated**: `dashboard-layout.md`, `cast-aligned-webapp-design.md`.

**Changes**:
- **Day 18 Progress Documentation**:
  - Recorded section pacing divergence: Period 0 (Honors Physics) completed the full hands-on Pull-Back Toy Motion Lab and calculation verification.
  - Periods 1–6 utilized the instructional block to finalize the Kinematic Velocity Calculator (Day 17) and Acceleration Rate & Sign Studio (Day 16).
- **Day 19 Differentiated Hands-On Labs**:
  - Period 0 (Honors Physics): Runs the paper-and-ruler hands-on investigation `P031 Reaction Time Lab` (measuring human neural reaction times via free-fall metric ruler drops $t = \sqrt{2d/g}$, comparing visual vs. auditory stimulus, cell-phone distractions, and computing highway reaction distances).
  - Linked official OneDrive handout: `https://orangeusdorg-my.sharepoint.com/:w:/g/personal/rmudry_orangeusd_org/IQC56lu4HK0nRKxL2XhMmeZXAREUmHZaWstYUWZfSSPZ9N8?e=cQ1qok`.
  - Periods 1–6: Conduct the hands-on Pull-Back Toy Motion Lab with metric track calibration, slow-motion video telemetry, and x vs. t plotting.
  - Updated all 4 central curriculum files (`assets/lessons-data.js`, `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, `Unit_2/outline.md`) with dual NGSS standards (`HS-PS2-1`, `HS-PS2-2`), explicit assignments, and zero LaTeX formatting.

## 2026-09-23 — Graphing Speed Story: Google Classroom Deployment & Grade Sync

**Pattern Updated**: `classroom-gradebook-sync.md`, `assignment-registry.md`.

**Changes**:
- **Classroom Deployment (`sync-classroom/post-graphing-speed-story-assignment.js`)**:
  - Created "Graphing Speed Story" (10 pts) coursework across all 7 class periods (Period 0 to Period 6) placed under "Unit 2: Motion".
  - Attached both official student materials: Worksheet PDF (`Unit_2/worksheets/Graphing_Speed_Story.pdf`) and Student Exemplar Guide (`assets/images/graphing_speed_story_exemplar.jpg`).
  - Registered `assignment_registry/Graphing_Speed_Story` and updated `gradest_assignments/Graphing Speed Story`.
  - Mirrored all 66 student webcam-graded scores into individual documents in `student_results/Graphing_Speed_Story/students/{studentId}` with correct period metadata from `roster`.
- **Grade Sync & Return**:
  - Ran headless sync pushing and returning all 66 student grades (100% success rate: 65 at 10/10, 1 at 9/10) to Google Classroom ready for Aeries import.

## 2026-09-23 — Daily Update: Unit 2 Day 18 & 19 Curriculum Harmonization & Deployment

**Pattern Updated**: `cast-aligned-webapp-design.md`, `dashboard-layout.md`.

**Changes**:
- **Curriculum Synchronization (`Unit_2/lesson.json`, `Unit_2/unit2_lessons.json`, `Unit_2/outline.md`, `assets/lessons-data.js`)**:
  - Harmonized Day 18 (Graphing Pull-Back Toy Motion Lab: Uniform Acceleration from Rest) across all four curriculum stores with dual NGSS alignment (`HS-PS2-1`, `HS-PS2-2`), lab setup video walkthrough links, and interactive companion webapp links.
  - Verified Day 19 (Calculating Distance for Accelerated Motion: Geometric Area under v-t) standards (`HS-PS2-1`), 3-step CAST Challenge Bell-Ringer, and Dual-Graph Motion Studio links.
  - Performed site-wide NGSS standards audit confirming 100% of all 139 lessons have explicit `standards: [...]` arrays and 0 LaTeX syntax errors.
- **Site Deployment**:
  - Refreshed site footer deployment timestamp via `node scripts/update-timestamp.js`.

- 2026-10-15: physics_speed_calculator/dist/index.html - replaced unpkg Lucide with assets/vendor/lucide.min.js (+jsdelivr fallback), guarded all lucide.createIcons() calls. Audit still flags ~40 other unpkg/Babel pages.

- **2026-10-16**: firebase-auth-gotchas: added 'Admin/Teacher Testing Hides Rule Failures' section + live student-token rules check (sync-classroom/student-rules-check.js, Step 6 of npm run verify).
- **2026-10-16**: Added Firestore Student-Permission Law to AGENTS.md; scripts/audit-firestore-rules-coverage.js + .githooks/pre-commit; deploy-assignment.js now blocks on live student-token rules test.

- 2026-10-22: THE_PROCTOR Lucide fix. Removed unpkg (how_it_works) and the trailing jsdelivr lucide@latest tag (BETA/TEMPLATE). Load only ../../assets/vendor/lucide.min.js. Lesson: a CDN fallback placed AFTER the local copy can stall or override the working local build on filtered networks, so use the local copy only.

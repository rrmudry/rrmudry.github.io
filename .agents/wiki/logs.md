# Wiki Evolution Log

Append-only log tracking pattern changes across sessions.

---

## 2026-08-29 — Initial Seed (WikiSkill Architecture)

**Motivation**: Applied [WikiSkill](https://arxiv.org/html/2608.27454) three-layer architecture (Raw → Wiki → Skills) to the existing agent customization setup.

**Changes**:
- Created `wiki/index.md` catalog
- Created `wiki/logs.md` (this file)
- Created 6 initial pattern pages by analyzing the existing codebase:
  - `dashboard-layout.md` — from 6 unit dashboards (unit1–unit7, no unit3)
  - `firebase-auth-gotchas.md` — from workflow docs + webapp code
  - `ngss-integration.md` — from `assets/ngss-helper.js` + dashboard usage
  - `mobile-responsive.md` — from `assets/theme.css` + dashboard + game CSS
  - `phaser-game-structure.md` — from `skydiving-game/` and other game dirs
  - `bell-ringer-config.md` — from `Bell-Ringer/README.md` + Firestore schema

**Sources analyzed**:
- `assets/ngss-helper.js` (252 lines)
- `assets/partials.js` (79 lines)
- `assets/theme.css` (518 lines)
- `unit1-dashboard.html` through `unit7-dashboard.html` (6 files)
- `skydiving-game/` directory (7 files)
- `Bell-Ringer/README.md` (98 lines)
- `.agent/workflows/create-student-webapp.md`
- `.agent/workflows/create-secure-webapp.md`

---

## 2026-08-30 — Unit 2: 5-Week Kinematics & Newton's Laws Architecture

**Motivation**: Created the comprehensive 5-week (25 instructional days) Unit 2 curriculum following Option A (Kinematics First, Dynamics Second) to prevent the Aristotelian force=speed misconception.

**Changes**:
- Created `Unit_2/` directory
- Created `Unit_2/outline.md`: Full 5-week pedagogical blueprint, weekly learning goals, DOK levels, and materials checklist
- Created `Unit_2/Fantasy_Map_Quest_Project.md`: Printable student partner project guide for distance vs displacement
- Created `Unit_2/lesson.json`: Standard JSON array containing all 25 daily lesson objects with explicit NGSS tagging, WICOR strategies, and daily bell-ringer prompts (featuring Day 1 Fantasy Map Quest)
- Created `Unit_2/unit2_lessons.json`: JavaScript export (`const unit2Lessons = [...]`) matching `unit1_lessons.json` pattern
- Updated `unit2-dashboard.html` to load `Unit_2/unit2_lessons.json` directly with fallback to `lessonsData`
- Updated `Bell-Ringer/teacher.html` to add Unit 2 to the unit select dropdown and calendar loader
- Synchronized `assets/lessons-data.js` with the 25-day Unit 2 sequence
- Paced the Fantasy Map Quest across a 3-day arc (Days 1–3) to account for 45-minute periods (~30 min active work time), seamlessly integrating terrain travel-time speed calculations and the Homecoming Paradox.
- Linked official classroom resources (`Distance and Displacement with Fantasy Maps.pptx` and `Fantasy Map Measurements.docx`) directly across `outline.md`, `lesson.json`, `unit2_lessons.json`, `lessons-data.js`, `Fantasy_Map_Quest_Project.md`, and `unit2-dashboard.html`.
- Designated Day 6 (2026-08-07) as `Labor Day — No School` with `NO_SCHOOL` dashboard badge while preserving the 5-day weekly increment structure.

---

## 2026-08-30 — Fantasy Map Distance & Displacement Web App

**Motivation**: Created interactive student-facing web app in `Unit_2/Displacement_and_distance_map_app` (and linked from root `displacement_and_distance_maps_app`) for measuring scalar distance vs vector displacement.

**Changes**:
- Created `Unit_2/Displacement_and_distance_map_app/index.html`: Main interactive app container featuring parchment frame, toolbars, dual measurement inspector, quest log challenge drawer, and certificate print modal.
- Created `Unit_2/Displacement_and_distance_map_app/style.css`: Vintage cartography styling, marching dashed trails, golden metric ruler, burned edges, and print styles.
- Created `js/sound_fx.js`: Web Audio API synthesizer for parchment rustle, footsteps, string stretch, vector whoosh, and quest fanfare.
- Created `js/fantasy_map.js`: Canvas + SVG coordinate engine with 1 cm grid, origin `(0,0)`, 3 realms, landmarks, and compass rose.
- Created `js/traveler.js`: Adventurer path-follower along spline curves, particle effects, speed multipliers, and Homecoming journey.
- Created `js/measurement_tool.js`: Virtual string unrolling morph onto calibrated metric ruler and net displacement vector with right-triangle components.
- Created `js/quest_engine.js`: 5-step guided inquiry challenge scoring out of 100 with instant pedagogical feedback and certificate modal.
- Created `js/auth_manager.js`: Firebase Auth Google sign-in restricting to `@orangeusd.org` domain and writing high scores to Firestore `student_results/Fantasy_Map_Distance_Displacement/students/{studentId}`.
- Created root folder symlink `displacement_and_distance_maps_app/`.
- Updated `Unit_2/lesson.json` (Days 1 & 2) and `unit2-dashboard.html` with direct webapp launch links.
- Strictly maintained no-LaTeX policy using Unicode `Δr`, `Δx`, `Δy`, `v = d / t`.
- Resolved canvas framing & viewport clipping: replaced static `pxPerCm` with dynamic bounds-aware scaling (`this.pxPerCm = availableWidth / maxGridXCm`), ensuring Landmark D and all legs fit cleanly across narrow, tablet, and wide desktop resolutions.
- Relocated Map Scale Key from bottom-left to top-left to eliminate overlap with the unrolled string measuring ruler and X-axis labels.
- Dynamically centered unrolled string ruler in `measurement_tool.js`.
- Added responsive "⛶ Expand / Standard View" toggle to expand map canvas to 12 columns for enhanced measurement precision.
- Implemented user-specific procedural path generation (`mulberry32` PRNG keyed to `@orangeusd.org` student ID or persistent guest seed) + "🎲 New Path" toolbar generator.
- Constrained all procedural spline legs to strictly between 5.0 cm and 15.0 cm (verified across 100 random seed simulations).
- Standardized calibrated metric measuring ruler to always be 20.0 cm (`0 to 20 cm`) with millimeter (0.1 cm), half-cm (0.5 cm), and whole cm ticks.
- Extended string unroll duration to a smooth, slower 1.8 seconds (`easeInOutCubic`), aligning the straightened string precisely at 0 cm on the ruler with an exact measurement indicator.
- Added interactive hover highlights: hovering over any Leg measurement button illuminates that specific trail segment with a luminous golden glow halo.
- Upgraded Traveler motion system to a finite state machine (`IDLE`, `FORWARD`, `PAUSED_FORWARD`, `RETURN`, `PAUSED_RETURN`, `FINISHED`) guaranteeing instantaneous, reliable Pause and Resume behavior.
- Implemented multi-band targeted leg generator in `fantasy_map.js`: randomly allocates and shuffles short (~5.5–8.3 cm), medium (~8.5–11.3 cm), and long winding (~11.5–14.5 cm) target bands across the 3 legs, producing authentic variation across the entire 5.0–15.0 cm spectrum.
- Removed answer reveals across Step 2, Step 3, and Step 4 input placeholders and ruler tags; replaced with neutral prompts.
- Added 2.5x optical Magnifying Glass Loupe to the ruler endpoint in `measurement_tool.js` (brass bezel, magnified millimeter and centimeter ticks, red central reticle, and lens reflection) so students determine measurements authentically.
- Fixed initial path identicalness: `getInitialUserSeed()` now generates a fresh random seed on every session launch (`Math.random() * 9000000 + 100000`) instead of loading a static cached seed from `localStorage`, ensuring two students opening the webapp simultaneously in class always see completely different paths right away.
- Fixed Step 2 measurement validation: previously only checked Leg 1; now comprehensively checks all 3 legs (paper cm within ±0.35 cm and real distances) with individual red/green input border feedback and specific error callouts.
- Moved `← Previous`, `Check Answers ✓`, and `Next →` navigation bar directly to the top of the Quest card underneath the step title for immediate visibility without scrolling down.
- Added automatic unique path regeneration upon selecting any Realm via `setRealm(key, true)`.
- Rendered high-visibility pulsating dual emerald beacon rings and a `🚩 START HERE (0,0)` badge over Landmark A on the map canvas, paired with explicit "How to Begin" guidance in Step 1.
- Implemented the interactive **Realm Selection Overlay** directly over the map canvas area (`#realm-selection-overlay`), presenting students with a styled dropdown, quick-select biome cards (Dragon's Pass, Sunken Bayou, Coast of Eldoria), and an instant route generator upon selection.
- Added a `"🗺️ Realm: [Current] (▼)"` toolbar button allowing students to reopen the overlay and switch realms at any time.
- Resolved text collision around Landmark A (Origin): moved X-axis numbering to start at `cm = 2` (preventing `0 cm` from overlapping Landmark A), shifted the origin tag to `(origin.x - 10, origin.y + 16)`, raised the `🚩 START HERE (0,0)` banner to `pos.y - 58`, and added parchment backing pills to landmark names and coordinate tags for crisp contrast.
- Updated tomorrow's lesson (`2026-08-31`, Unit 2 Day 1: Fantasy Map Quest — Part 1) presentation slides to the active Google Slides link (`https://docs.google.com/presentation/d/10-afry9hEiN-b1U_qzE--Z5f7CUKvfde_nuPIWVNJgk/edit?usp=sharing`, "Fantasy Map Ideas and Tips") across `Unit_2/lesson.json`, `Unit_2/unit2_lessons.json`, `assets/lessons-data.js`, `unit2-dashboard.html`, `Unit_2/outline.md`, `Unit_2/Fantasy_Map_Quest_Project.md`, and the web app header in `Unit_2/Displacement_and_distance_map_app/index.html`.
- Removed `"Project Guide"` link (`Fantasy_Map_Quest_Project.md`) from Day 1 lesson objects across `Unit_2/lesson.json`, `Unit_2/unit2_lessons.json`, and `assets/lessons-data.js` to ensure the dashboard info panel only presents formatted student-facing tools and materials (Google Slides, Worksheet, Web App).
- Integrated dual slide presentation formats (Google Slides and OneDrive PowerPoint) and the quest narrative story document ("The Epic Tale of Caelum and the Starlight Gem in Rikterell", `https://docs.google.com/document/d/10pNCBkmnpn4LmwO6Fd8af0JH5ehHpj1akiyfmTqkDNA/edit?usp=sharing`) across lesson data objects, `unit2-dashboard.html` hero actions, and the Fantasy Map web app header.
- Upgraded the **Kinematic Vector & Slope Visualizer** in `unit2-dashboard.html` to a dual-panel system:
  1. Added a **Physical 1D Motion Runway** (`#trackCanvas`) above the graph featuring calibrated distance markers (`-25m` to `200m`), starting line, reference origin flag (`0m`), and an animated **Kinematic Rover Sprite** that drives strictly in 1D space with dynamically rotating wheels, headlights, and a real-time **Velocity Vector Arrow** (`v = +12.0 m/s`).
  2. Redesigned the **Position vs. Time Graph** (`#simCanvas`) to feature a **sweeping vertical Time Cursor (hairline)** advancing uniformly along the horizontal time axis (`dt/dt = 1`) and a tangent line slope triangle. This decisively eliminates the common misconception where students confuse a diagonal graph slope line with an inclined physical path or interpret a dot moving along the curve as object speed rather than uniform passage of time.

---

## 2026-08-31 — Unlocked Unit 2 Dashboard for All Site Visitors

**Motivation**: Open access to the 5-week Unit 2 (Kinematics & 1D Motion) Dashboard for all site visitors without requiring authentication.

**Changes**:
- Updated `lesson-plans.html`: Removed `locked-card` class, lock overlay element (`card-lock-overlay`), and `disabled-btn` launcher class from `#card-unit2`.
- Updated `lockedUnits` JS array in `lesson-plans.html` to `['unit3', 'unit4', 'unit5', 'unit6', 'unit7']`.
- Updated signed-out status message in `lesson-plans.html` to `"Units 1 & 2 are open. Sign in with Google credentials to unlock Units 3–7."`.
- Updated `index.html`: Added a direct `"Unit 2 Dashboard"` button to the home page CTA row alongside Unit 1.
- Committed and deployed to GitHub (`9b690dcf`).

---

## 2026-09-01 — Unit 2: Rocketry DOK 4 Ideas & Low-Logistics Frameworks

**Motivation**: Preserved comprehensive DOK 4 (Extended Thinking) rocketry projects and lesson ideas for Unit 2 (Kinematics & Newton's Laws), incorporating low-friction logistical adaptations for classroom constraints (field access, weather, safety, reproducibility).

**Changes**:
- Created `Unit_2/Rocketry_DOK4_Ideas.md`: Detailed breakdown of 4 DOK 4 rocketry frameworks (Project AeroMax, Target Coordinates Ballistics, Operation Egg-stronaut, Aerospace Contractor RFP) plus 4 high-reproducibility classroom adaptations (Single-Flight/Rich-Data, Hybrid Digital Sim Calibration, Indoor Bench/Hallway Testing, Class-Shared Parameter Matrix).

---

## 2026-09-01 — PRIDE Time: Continuous Barcode/QR Attendance & Behavior Tracker

**Motivation**: Replaced slow and cumbersome tutorial scanning workflow with a mobile-friendly continuous barcode & QR ID scanner, real-time live student attendance counter and room capacity gauge, automated behavior & access restriction enforcement (banning disruptive students), and responsive desktop dashboard.

**Changes**:
- Created `pride-time/` application directory.
- Created `pride-time/index.html`: Responsive single-page application featuring Mobile Scanner HUD, Session Monitor, Student Roster Directory, Discipline & Access Hub, Printable ID Passes & Barcode Generator, and Settings.
- Created `pride-time/pride-app.js`: Core ES6 application engine featuring continuous camera stream (`Html5Qrcode` with Code 128, Code 39, QR, UPC, EAN), intelligent 3.5s duplicate scan cooldown, Web Audio API harmonic sound synth (pleasant chime, duplicate ping, restriction buzzer), `navigator.vibrate` haptic cues, offline-first LocalStorage persistence, and BroadcastChannel multi-device sync.
- Created `pride-time/pride-style.css`: Cosmic glassmorphic styling, neon laser HUD with animated scanline, corner reticles, status indicators, and responsive touch controls (min 44px targets).
- Created `pride-time/favicon.svg`: Custom gradient vector favicon.
- Integrated PRIDE Time into `admin/index.html` navigation hub grid.

---

## 2026-09-01 — Google Classroom Sync Portal & Security Hardening

**Motivation**: Enabled automated Gradebook syncing between Firestore student webapp results (e.g. Unit Conversion Practice) and Google Classroom, resolved Google Classroom API ownership constraints, implemented high-speed parallel batch grading with Period 0–6 isolation, and hardened repository security.

**Changes**:
- Created `patterns/classroom-gradebook-sync.md`: Documented Google Classroom `@ProjectPermissionDenied` API security model, virtual parent collection enumeration (`listDocuments()`), and concurrent batch syncing architecture.
- Upgraded `sync-classroom/server.js`:
  - Added `db.collection('student_results').listDocuments()` auto-discovery for all practice webapps.
  - Added period inference mapping (`inferredPeriod`) supporting Period 0 through 6.
  - Normalized student period attributes with automatic `roster` collection fallback.
- Upgraded `sync-classroom/public/index.html` and `public/app.js`:
  - Added Dual Dropdown Coursework / Activity selector with fuzzy auto-matching.
  - Added One-Click "Copy to Deploy Form" helper for rapid assignment distribution.
  - Added Class Period Filter bar with automatic period isolation upon selecting a course.
  - Accelerated batch sync using a 4x concurrent promise pool (reduced sync time from 4 mins to ~5s).
- Hardened Repository Security:
  - Untracked `scratch/`, `student_submissions/`, and `roster_test.csv` from Git.
  - Enhanced `.gitignore` with strict exclusion rules for all environment files, private keys, service accounts, and student test artifacts.

---

## 2026-09-02 — PRIDE Time: Consecutive Check-In Limit & Streak Badges

**Motivation**: Prevent students from attending more than 3 PRIDE Time sessions in a row to ensure equitable tutorial room rotation, while surfacing visual status badges for students at 2 or 3 consecutive sessions and empowering teachers with an override mechanism.

**Changes**:
- Updated `admin/pride_time.html`:
  - Added `#modal-consecutive-limit-alert` displaying reason for restriction, exact dates of consecutive sessions attended, "Turn Away" decline button, and "Teacher Override" button.
  - Added `⚡ 2 in a row (Warning)` and `🛑 3+ in a row (At Limit)` filter options to `#roster-status-filter`.
  - Added configurable `Max Consecutive Sessions Limit` setting input in Tab 6.
- Updated `pride-time/pride-style.css`:
  - Added `.badge-streak-2` (amber glow pill badge with flame icon).
  - Added `.badge-streak-3` (rose glow alert pill badge with ban icon).
- Updated `pride-time/pride-app.js`:
  - Added `AttendanceEngine.getConsecutiveStreak(studentId, referenceDate)`: traverses backward through actual contiguous PRIDE session dates to determine prior streak, current session status, and limit breach.
  - Intercepted check-ins in `AttendanceEngine.processCheckIn`: students who have attended >= 3 consecutive sessions are blocked with a danger alert, scanner flash, toast notice, and `#modal-consecutive-limit-alert`.
  - Implemented teacher override action logging an override entry (`Limit override: Attended 3+ consecutive sessions`).
  - Added `UI.renderStreakBadge(consecutiveCount)`: surfaces badges in Student Roster table, Live Attendance table, and Scanner Recent Scans roll.
  - Added `exportAttendanceCsv` consecutive session column for administrative records.
  - Added `generateSampleAttendance()` and preloading in `FirestoreBridge` so past sessions persist across reloads and demo data showcases 1, 2, and 3-session streaks.

---

## 2026-09-02 — Secondary Web App: Fantasy Map Vector Displacement & Coordinate Calculator

**Motivation**: Created a dedicated secondary companion web app based on the Fantasy Map Quest template, specifically focused on calculating displacement vector lengths and components using Cartesian coordinates `(x, y)` and the Pythagorean theorem (`Δr = √(Δx² + Δy²)`).

**Changes**:
- Created `Unit_2/Vector_displacement_calculator_app/`:
  - `index.html`: Responsive workspace featuring parchment canvas, interactive right-triangle component visualizer, vector inspector tool, 5-step guided inquiry challenge, celebratory completion announcement modal, and printable Royal Cartographer Certificate.
  - `style.css`: Vintage cartography theme, right-triangle projection lines, animated dashed vector legs, and print styles.
  - `js/vector_map.js`: Canvas coordinate engine with 1 cm metric grid, procedural integer/half-cm landmark coordinates (Dragon's Fang Pass, Sunken Bayou, Coast of Eldoria), right-angle indicator `⦜`, and hypotenuse vector arrows.
  - `js/vector_tool.js`: Vector inspector toolbar with live math derivations for horizontal change `Δx = x₂ - x₁`, vertical change `Δy = y₂ - y₁`, Pythagorean magnitude `|Δr| = √(Δx² + Δy²)`, and real realm scaling.
  - `js/vector_quest_engine.js`: 5-step pedagogical challenge (Coordinate Deltas, Pythagorean Leg 1, Multi-leg with Directional Signs, Component Addition for Net Resultant, and Triangle Inequality proof `|Δr_net| ≤ Σ|Δr_i|`).
  - `js/auth_manager.js`: Domain-enforced Google Sign-In (`@orangeusd.org`) saving scores to `student_results/Fantasy_Map_Vector_Calculations`.
  - `js/sound_fx.js`: Web Audio API synthesizer for clicks, whooshes, chimes, and royal victory fanfare.
- Created root folder alias `vector_displacement_calculator_app/` with symlinks to `Unit_2/Vector_displacement_calculator_app/`.
- Integrated across Unit 2 curriculum:
  - Linked in `unit2-dashboard.html` interactive webapps matrix.
  - Linked in `Unit_2/lesson.json` and `Unit_2/unit2_lessons.json` (Day 4).
  - Linked in `assets/lessons-data.js` (Day 4).
  - Linked in `Unit_2/Fantasy_Map_Quest_Project.md`.


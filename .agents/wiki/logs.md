# Wiki Evolution Log

Append-only log tracking pattern changes across sessions.

## 2026-09-23 — Daily Update: Unit 2 Day 18 & 19 Curriculum Harmonization & Deployment

**Pattern Updated**: `cast-aligned-webapp-design.md`, `dashboard-layout.md`.

**Changes**:
- **Curriculum Synchronization (`Unit_2/lesson.json`, `Unit_2/unit2_lessons.json`, `Unit_2/outline.md`, `assets/lessons-data.js`)**:
  - Harmonized Day 18 (Graphing Pull-Back Toy Motion Lab: Uniform Acceleration from Rest) across all four curriculum stores with dual NGSS alignment (`HS-PS2-1`, `HS-PS2-2`), lab setup video walkthrough links, and interactive companion webapp links.
  - Verified Day 19 (Calculating Distance for Accelerated Motion: Geometric Area under v-t) standards (`HS-PS2-1`), 3-step CAST Challenge Bell-Ringer, and Dual-Graph Motion Studio links.
  - Performed site-wide NGSS standards audit confirming 100% of all 139 lessons have explicit `standards: [...]` arrays and 0 LaTeX syntax errors.
- **Site Deployment**:
  - Refreshed site footer deployment timestamp via `node scripts/update-timestamp.js`.

## 2026-09-22 — Unit 2 Day 18: Lab Setup Demonstration Video Integration

**Pattern Updated**: `cast-aligned-webapp-design.md`.

**Changes**:
- **Unit 2 Curriculum Data (`Unit_2/unit2_lessons.json` & `assets/lessons-data.js`)**:
  - Added "Pull-Back Toy Lab Setup Video" (`https://drive.google.com/file/d/1AzjHUlsL2X34YtQUKrtjvGBCyjtupQ-k/view`, type: "Demonstration Video") to the Day 18 `resources` array and `links` dictionary.
  - Ensures the video resource is visible across both the Unit 2 Dashboard (`unit2-dashboard.html`) and the site-wide lesson explorer.
- **Pull-Back Toy Lab Webapp (`Unit_2/pull_back_toy_lab/index.html`)**:
  - Embedded a direct `🎬 Watch Setup Video Protocol ↗` button in Stage 2 of Step 1 directly below the camera framing diagram, giving students immediate access to the video walkthrough while preparing their phone camera and metric track setup.

## 2026-09-22 — Pull-Back Toy Motion Lab: Real-Time Firestore Progress Backup & Cloud Sync Indicator

**Pattern Updated**: `cast-aligned-webapp-design.md`.

**Changes**:
- **Real-Time In-Progress Firestore Auto-Save (`Unit_2/pull_back_toy_lab/js/auth_manager.js`)**:
  - Implemented `autoSaveDraft(draftData)` with 600ms debouncing, writing real-time state (`rawTimes`, `times`, `currentStep`, `calcValues`, `calcStatus`) directly into Firestore document `student_results/unit2_day18_pull_back_toy_lab/students/{studentId}` as students work.
  - Lifted student metrics (`rawTimes`, `times`, `calcValues`, `calcStatus`) to the document root for instantaneous teacher gradebook inspection and headless CLI sync compatibility (`sync-cli.js`).
  - Added dual redundancy with immediate `localStorage` mirroring (`pull_back_toy_draft_{studentId}`).
- **Engine Auto-Save Hook (`Unit_2/pull_back_toy_lab/js/lab_engine.js`)**:
  - Connected `saveLocalDraft()` directly to `window.labAuth.autoSaveDraft(draft)` on every table time input, calculation verification, and step transition.
  - Enhanced `loadLocalDraft()` and `loadStudentLabData()` to restore in-progress state seamlessly across devices upon Google sign-in.
- **Visual Cloud Sync Indicator (`Unit_2/pull_back_toy_lab/index.html` & `style.css`)**:
  - Added `#firestore-save-indicator` pill in the app header (`Saving...` -> `Cloud Saved ✓` / `Cloud Synced ✓` / `Turned In (10/10) ✓`), giving students and teachers immediate visual confirmation that work is safely backed up to the cloud.

## 2026-09-22 — Pull-Back Toy Motion Lab: Dynamic Velocity Axis Scaling & Callout Layout Fix

**Pattern Updated**: `cast-aligned-webapp-design.md`.

**Changes**:
- **Smart Dynamic Velocity Axis Scaling (`Unit_2/pull_back_toy_lab/js/lab_engine.js`)**:
  - Implemented `getNiceVelocityAxis(rawMax)` using standard 1-2-5 decade partitioning to guarantee between 4 and 7 clean, round tick marks (e.g. intervals of 20, 50, 100, 200).
  - Eliminated the runaway tick bug where small fixed steps (`vStep = 25`) generated 30+ overlapping labels when speeds exceeded 600 cm/s.
  - Added dynamic left-padding calculation (`padLeft = 58..74px`) based on number digits to prevent collisions with the rotated `Velocity v (cm/s)` axis title.
- **Relocated Callouts to Top Plot Header Space**:
  - Relocated the green Displacement Area badge (`Area = Δx = 100 cm`) to the top-right header space, eliminating occlusion of student interval data points in the lower triangle.
  - Formatted the purple Acceleration Slope badge (`Slope = a = ...`) and green Area badge as cohesive, responsive HUD pills at `y = padTop - 26px`.
  - Shifted the final velocity $v_f$ callout to the right of the anchor dot whenever plot width permits, preventing it from crossing over the acceleration slope line.

## 2026-09-22 — Pull-Back Toy Motion Lab: Stopwatch Split/Lap Simplification

**Pattern Updated**: `cast-aligned-webapp-design.md`.

**Changes**:
- **Simplified In-App & Fullscreen Stopwatch (`Unit_2/pull_back_toy_lab/`)**:
  - Removed Split/Lap button, lap time list, and split keyboard shortcut (`L`) from the in-app card stopwatch in Step 1.
  - Removed Split Mark button, live splits strip, last-split badge, and "Apply Splits to Table" from the fullscreen overlay HUD.
  - Cleaned up `js/stopwatch.js` into a lightweight, high-precision Start/Pause/Resume and Reset timer with Spacebar and Escape key bindings.
  - Centered controls in fullscreen mode for large, high-visibility tap targets when filming a video alongside the track.
  - Removed obsolete `#btn-stopwatch-lap` rules from `style.css`.

## 2026-09-22 — Pull-Back Toy Motion Lab: Velocity vs. Time (v vs. t) Graph Generator

**Pattern Updated**: `cast-aligned-webapp-design.md`.

**Changes**:
- **Interactive Dual Motion Graph Switcher (`Unit_2/pull_back_toy_lab/`)**:
  - Added `.graph-tabs` pill switcher in Step 3 card header: `[📈 Distance (x-t)]` and `[⚡ Velocity (v-t)]`.
  - Implemented `renderVelocityGraph()` in `js/lab_engine.js`:
    - Synchronized time domain ($0 \le t \le \max(2.0, t_5 \cdot 1.25)$) with dynamic velocity scale up to peak speed.
    - Plots each interval speed $v_i = \Delta x / \Delta t$ at the interval's midpoint time $t_{\text{mid}} = (t_{i-1} + t_i) / 2$, demonstrating that average speed equals instantaneous speed at midpoint in uniform acceleration.
    - Renders the linear acceleration line $v(t) = a \cdot t$ passing through $(0, 0)$ and $(t_{\text{total}}, v_f)$ with an explicit slope callout: `Slope = a = XX.X cm/s² (Uniform Accel)`.
    - Renders the shaded triangular displacement area under the velocity curve with callout badge: `Area = Δx = 100 cm (Displacement)` computed via $\frac{1}{2} \cdot \text{base} \cdot \text{height} = 100\text{ cm}$.
    - Anchors initial velocity at $(0, 0)$ ($v_0 = 0$) and final velocity at $(t_{\text{total}}, v_f)$.
  - Added dynamic legend badge switcher and adaptive physics guidance description.
  - Fully integrated with high-contrast light mode (`#ffffff` canvas, emerald `#047857` area shading, purple `#7e22ce` slope line, sky blue `#0284c7` interval points) and dark mode.

## 2026-09-22 — Pull-Back Toy Motion Lab: Step 2 Compact Data Table Sizing (Zero Side-Scrolling)

**Pattern Updated**: `cast-aligned-webapp-design.md`.

**Changes**:
- **Eliminated Horizontal Table Overflow (`Unit_2/pull_back_toy_lab/`)**:
  - Reduced Data Table card padding to `p-3 sm:p-4 md:p-5`, reclaiming 16px–24px of horizontal room inside the 6-column split layout.
  - Replaced oversized 96px (`w-24`) table inputs with `.table-time-input` (68px–74px width, `0.25rem 0.35rem` padding, centered monospace numbers).
  - Shortened verbose column headers to crisp, student-friendly labels (`Mark`, `Dist (x)`, `Raw (t_raw)`, `Zeroed (Δt)`, `Speed`).
  - Compacted `.zeroed-time-cell` badge padding (`0.2rem 0.4rem`) and set table cells to `py-2 px-1` with `whitespace-nowrap`.
  - Updated `computeIntervalSpeeds()` in `js/lab_engine.js` to preserve compact padding and styling when dynamically injecting speed values.
  - Total table footprint reduced from >565px to ~355px, allowing all 5 columns to fit comfortably on 11-inch Chromebooks without requiring students to side-scroll.

## 2026-09-22 — Pull-Back Toy Motion Lab: Fullscreen Timer Relocated to Stopwatch Card

**Pattern Updated**: `cast-aligned-webapp-design.md`.

**Changes**:
- **Consolidated Stopwatch Tooling (`Unit_2/pull_back_toy_lab/`)**:
  - Moved `#btn-stopwatch-expand` ("⛶ Fullscreen Timer") from the Step 1 protocol card header into the `.stopwatch-card` inner header next to "⏱️ In-App Split Stopwatch".
  - Cleaned up Step 1 protocol header to provide uninterrupted title spacing.
  - Added subtle keyboard shortcut hint row (`Space: Start/Stop • L: Split`) below the primary stopwatch buttons.

## 2026-09-22 — Pull-Back Toy Motion Lab: Step 3 Header & Graph Legend Wrapping Fix

**Pattern Updated**: `cast-aligned-webapp-design.md`.

**Changes**:
- **Resolved Header & Legend Awkward Text Wrapping (`Unit_2/pull_back_toy_lab/`)**:
  - Replaced rigid `flex items-center justify-between` in Step 3 card with responsive `flex flex-wrap items-center justify-between gap-2.5 mb-2.5`.
  - Created `.graph-legend-badge` components (`points` and `secant`) with `white-space: nowrap`, dedicated pill backgrounds, soft borders, and high-contrast light-mode overrides (`#0369a1` on `#e0f2fe` for points, `#b45309` on `#fef3c7` for secant line).
  - Protected `(x vs. t)` from splitting across lines with `<span class="whitespace-nowrap">`.
  - Added global `white-space: nowrap` to `sub, sup` in `style.css` to prevent subscript symbols from disassociating from their parent variables or wrapping independently.
  - Added `flex-wrap` and `whitespace-nowrap` guards to Step 2, table headers, Step 4, and calculation formula titles.

## 2026-09-22 — Pull-Back Toy Motion Lab: Text-to-Speech Audio Reader for Step 1 Protocol

**Pattern Updated**: `cast-aligned-webapp-design.md`.

**Changes**:
- **Accessible Text-to-Speech Engine (`Unit_2/pull_back_toy_lab/js/tts.js`)**:
  - Implemented client-side `LabTTS` class wrapping browser-native `window.speechSynthesis` and `SpeechSynthesisUtterance`.
  - Added voice discovery and priority sorting (Google, Natural, and English system voices) with `onvoiceschanged` async lifecycle binding for Chromebook compatibility.
  - Curated natural phonetic transcripts across all 5 stages of Step 1 to pronounce physics notation cleanly (e.g., "centimeters" instead of "c-m", "t-zero" instead of raw Unicode symbols, and "x equals 0.0 centimeters").
- **Interactive UI Read-Aloud Controls (`index.html` & `style.css`)**:
  - Added prominent `🔊 Listen` / `⏹️ Stop` action buttons to each of the 5 Stage headers in Step 1.
  - Added inline mini speaker buttons (`🔊`) directly on every checklist item, with `e.stopPropagation()` and `e.preventDefault()` to ensure clicking the audio button never accidentally toggles the checklist checkbox.
  - Styled with glowing pulse animations (`@keyframes pulse-tts`) and active state switching when speech is playing.
  - Full high-contrast light mode support (`#0369a1` on `#e0f2fe`) for bright classroom environments.
  - Integrated into stepper navigation (`goToStep` in `lab_engine.js`) so advancing or switching stages immediately cancels ongoing speech.

## 2026-09-22 — Pull-Back Toy Motion Lab: Readability Typography Overhaul & High-Contrast Sizing

**Pattern Updated**: `cast-aligned-webapp-design.md`.

**Changes**:
- **Classroom Chromebook Typography Overhaul (`Unit_2/pull_back_toy_lab/`)**:
  - Replaced all sub-12px (`text-xs` / `text-[11px]`) text across instructions, step panels, checklists, and table explanations with bold, legible typography (`text-sm sm:text-base` and `text-base sm:text-lg`).
  - Enlarged interactive checklist cards (`padding: 0.7rem 0.95rem; font-size: 0.95rem;`) and scaled checkboxes to `1.35rem` to eliminate student difficulty reading on 11-inch classroom Chromebooks.
  - Enlarged stepper tab pills (`0.875rem`, `padding: 0.55rem 0.95rem`) with numbered badges.
  - Enlarged table headers, cell fonts, and data inputs (`.lab-input` to `1.05rem font-bold w-24`).
  - Strengthened light-mode typography overrides in `style.css` so student instructions remain dark, crisp (`#0f172a` / `#1e293b`), and easy to read under bright fluorescent classroom lighting.
  - Replaced all pseudo-subscript underscores (`v_avg`, `v_f`, `t_raw`, `t_total`) with standard HTML `<sub>` subscripts (`v<sub>avg</sub>`, `v<sub>f</sub>`, `t<sub>raw</sub>`, `t<sub>total</sub>`) across headers, data tables, graph legends, calculation cards, and feedback alerts, accompanied by a clean CSS baseline normalization reset for `sub` and `sup`.

## 2026-09-22 — Rat Rod Racers: Added "Jalopy Special #2" to Core Chassis Catalog & Starter Fleet

**Pattern Updated**: `modular-vehicle-physics-game.md`.

**Changes**:
- **Added BOD-06 "Jalopy Special #2"**:
  - Saved transparent high-res PNG asset (`rat-rod-racers/assets/jalopy_special_2.png`).
  - Added official catalog part definition in `RAT_ROD_ASSETS.chassis['BOD-06']` and alias `BOD-CUSTOM`.
  - Added to `_ensureStarterKit` in `inventory.js` so every player immediately has it unlocked in their garage.
  - Added template preset in `designer.html` and `designer.js` so users can load and customize Jalopy Special #2 in the studio.
  - Supported `imageSrc` along with `dataUrl` in `cars.js` and `assets.js` SVG renderers.

## 2026-09-22 — Rat Rod Racers: Custom Car Body Designer Studio & Rig Alignment Pipeline

**Pattern Updated**: `modular-vehicle-physics-game.md`.

**Changes**:
- **Interactive Car Body Designer Studio (`rat-rod-racers/designer.html`)**:
  - Developed full in-browser drawing environment tailored for custom rat rod vehicle chassis bodies.
  - Implemented dual drawing tools: freehand Ink Brush with comic smoothing and point-by-point Poly Panel vector tool for clean geometric automotive body lines, plus Straight Line, Flood Fill (Bucket), Eraser, Eyedropper, and 30-step Undo/Redo.
  - Curated Hot Rod color palette (Ink Black, Rust Oxide, Candy Red, Flamin' Orange, Gasser Gold, Primer Gray, etc.) with native color picker and hex support.
- **In-Game Physics Alignment Rig & Clearance Guides**:
  - Overlay math accurately maps in-game coordinate origin `(0, 0)` to canvas space (`scale = 5.2`, origin `[400, 230]`).
  - Displays front/rear axle centers (`x = ±32, y = +10`) with tire cutout safety envelopes to prevent clipping.
  - Displays chassis ladder frame baseline (`y = +8`), ground level (`y = +26`), exposed engine clearance envelope (`x = 10..36`), and door roundel decal guide (`[0, -4]`).
- **Live Assembled Rig Mini Viewport**:
  - Mini-canvas renders custom drawn body mounted onto the active vehicle chassis with rotating wheels and configurable engines (Roots Blower, Cummins Diesel Stacks, Twin Turbos, etc.).
- **Starter Silhouette Templates**:
  - Built-in trace silhouettes: '32 5-Window Coupe, '29 Roadster, Z'd Sedan, Delivery Van, Belly Tank Lakester, Willys Gasser Coupe.
- **Direct Game Integration & Multi-Format Export**:
  - Added "🏎️ Save to Garage & Race" button saving to `localStorage` (`ratrod_custom_chassis`) and launching `index.html?equip_custom=1`.
  - Added transparent PNG (512×256) and SVG export, plus code snippet modal for permanent inclusion into `assets.js`.
  - Updated `cars.js` (`_drawChassisCanvas`), `assets.js` (`RatRodSVG._chassisSVG`), and `game.js` (`_loadCustomChassis`) to render custom user bodies seamlessly.

## 2026-09-22 — Rat Rod Racers: Part Balancing, Synergy Math & 5-Slot Archetype Overhaul

**Pattern Updated**: `modular-vehicle-physics-game.md`.

**Changes**:
- **5 Canonical Slots & Jalopy Budget Cap**:
  - Replaced 6 ad-hoc slots with the 5 core slots from the design document: `powertrain` (ENG-01 to ENG-06), `chassis` (BOD-01 to BOD-05), `suspension` (SUS-01 to SUS-05), `wheels` (TIR-01 to TIR-05), and `ancillary` (ANC-01 to ANC-05).
  - Enforced a hard 20-point Jalopy Budget Cap across vehicles, preventing over-budget rigs from staging and rewarding clever horizontal tradeoffs.
  - Implemented automatic backward-compatibility migration for legacy player inventory saves.
- **Coupled Non-Linear Physics Simulation (`physics.js`)**:
  - Implemented dynamic longitudinal weight transfer (`ΔW = a · h_CG / L · m`), rear axle normal force, and effective friction scaling.
  - Added non-linear exponential wheelspin penalty equation (`F_wheelspin = ΔF_excess · (1 - e^(-λ · ΔF_excess))`), actively penalizing overpowered cars on skinny tires with thrust drop below the grip limit.
  - Added differential thermal accumulation (`dT/dt`) with speed/radiator cooling and non-linear power degradation curve when temperature exceeds critical threshold (225°F).
  - Added surface roughness chassis bottoming drag and incline gravitational resistance (`F_grade = m · g · sin(θ)`).
- **Five Canonical Track Environments & Visual Atmospheres**:
  - Implemented track selection across Abandoned Airfield Drag, Bonneville Salt Flats, Dead Man's Dirt Strip, Quarry Incline Drag, and Smokey Mountain Pass.
  - Added procedural track backgrounds (salt bed mirages, dirt track ruts, quarry cliffs, pine mountain passes) and environmental coefficients (grip, roughness, grade, air density).
- **Archetype Ghost Roster & Telemetry Viewer**:
  - Updated benchmark classmate ghost roster to embody the 5 distinct archetypes (Blown Gasser, Salt Speedster, Mud-Runner, Chop Rattler, Diesel Bruiser) plus Rookie benchmark.
  - Expanded dual-car telemetry graph viewer with Engine Temperature (`T-t`) with overheat line and Wheelspin Loss (`F_spin-t`) curves.
  - Added animated steam from radiator on overheat and tire smoke on wheelspin in canvas drawer.
- **FERPA Student Name Privacy Sanitization**:
  - Implemented `formatStudentDriverName` across `auth_manager.js` and `game.js` to strip full student last names on all public leaderboard tables, opponent dropdown menus, and ghost challenge staging buttons.
  - Automatically abbreviates names to First Name + Last Initial (e.g., `Johnathan Smith` -> `Johnathan S.`, `Smith, Jane (Period 2)` -> `Jane S. (Period 2)`, `john.smith@orangeusd.org` -> `John S.`), keeping single first names and archetype ghosts intact.
- **Ambient Banner Background & Adaptive Tab Dimming**:
  - Rendered `assets/banner.jpg` globally via fixed background compositor layer (`.app-bg-fixed > .app-bg-image + .app-bg-overlay`) with radial/linear dark vignette overlays and frosted glass headers.
  - Implemented tab-adaptive dimming (`body[data-active-tab="..."]`): heavily dimmed on academic/dense tabs (`race`, `garage`, `dyno`, `leaderboard` with 0.13–0.18 opacity and soft blur) to preserve high contrast for math and telemetry, and more vibrant on showcase tabs (`crates` at 0.38 opacity).
  - Added optional header dimmer preset button (`🖼️ BG: Auto / Dark / Vibrant`) persisted in `localStorage`.
  - Upgraded Crates hero section from duplicate nested image to a sleek glassmorphic banner header.

## 2026-09-22 — Bell-Ringer: Resilient Physics AI Mentor & CAST Reasoning Chat Fallback Engine

**Pattern Updated**: `bell-ringer-config.md`, `cast-aligned-webapp-design.md`.

**Changes**:
- **Resolved Unresponsive AI Mentor Chat**:
  - Identified that the Google Apps Script Gemini proxy configured in Firestore returned HTTP 200 with JSON code 402 ("prepayment credits are depleted" / `RESOURCE_EXHAUSTED`).
  - In `Bell-Ringer/index.html` (`handleCastChatSend`), `data.candidates` was undefined, which threw an error.
  - In `assets/js/cast-item-engine.js`, the error was previously caught silently, removing the typing dot without appending any mentor message to the chat or updating student state.
- **Pedagogical Fallback Engine (`generateCastMentorReply` & `generateConceptChatFallback`)**:
  - Implemented multi-turn, physics-aware response generators adhering strictly to the `AGENTS.md` Mentor Persona (1–3 sentences, warm SMS conversational style, no LaTeX, zero Socratic traps, immediate pivot to direct teaching).
  - Contextual awareness for constant velocity motion (Autonomous Highway Cruise Telemetry): validates 25 m/s, identifies 25 m per second, explains straight diagonal position-time graphs vs. horizontal velocity-time graphs, and corrects curvature/acceleration misconceptions.
  - Universal fallback for any CAST investigation deriving context from `castData.teacherKey` and `step.prompt`.
- **Fault-Tolerant Engine Safety**:
  - Added AbortController timeout handling (6s) and `data.error` interception.
  - Added safe fallback inside `cast-item-engine.js`'s `catch (err)` block so student chat turns are never lost even under severe network outages.
  - Autosaves every turn to Firestore `bellringers` document so student work and completion counts persist reliably.

## 2026-09-22 — Bell-Ringer: Teacher Student-Simulation Mode for Any Period

**Pattern Updated**: `bell-ringer-config.md`.

**Changes**:
- **Teacher Account Authorization**:
  - Expanded `isTeacherAdmin` in `Bell-Ringer/index.html` and `dashboard.html` to recognize all authorized teacher accounts (`rmudry@orangeusd.org`, `ryan.mudry@orangeusd.org`, `ryan.mudry@gmail.com`, `ryanmudry@gmail.com`).
- **Student Simulation Mode for Any Period**:
  - Added interactive "Test Period" selector in navbar (Periods 0-6), syncing with URL query params (`?period=X`) and `localStorage`.
  - Period access gate restriction now cleanly bypassed for teachers so they are never blocked by period mismatch or unassigned roster messages.
  - Added `#teacher-waiting-controls` to the waiting panel: allows teachers to launch "Enter & Complete Activity" even when the timer countdown is inactive on the main screen.
  - Granted a 15-minute open preview window during teacher simulation mode if the timer countdown has expired or is inactive, enabling full completion and testing across all activity types (Free Response, Connections, Concept Chat, CAST 3D).
  - Test submissions record `class_period: studentPeriod` to Firestore.
  - Added one-click `↺ Reset Test` button in the navbar and waiting panel to delete today's test record and restart cleanly.
- **Classroom Dashboard Sync**:
  - Updated `renderStudentGrid()` in `Bell-Ringer/dashboard.html` to merge non-roster test submissions matching `currentPeriod`, displaying a distinct `👨‍🏫 Test` badge on the grid.

## 2026-09-22 — Day 17 Bell-Ringer Update: Constant Speed Highway Cruise Telemetry

**Pattern Updated**: `cast-aligned-webapp-design.md`.

**Changes**:
- **Updated Day 17 Bell-Ringer across Central Curricula**:
  - Replaced the stopping train acceleration challenge with a constant speed telemetry challenge across `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, `assets/lessons-data.js`, and `Unit_2/outline.md`.
  - Configured 3 CAST challenge components:
    1. Cloze dropdown identifying that constant speed implies $a = 0\text{ m/s}^2$ and position change uses $\Delta x = v \cdot t$.
    2. Quantitative calculation for distance traveled ($25.0\text{ m/s} \times 16.0\text{ s} = 400.0\text{ m}$).
    3. AI Mentor reasoning chat exploring why constant velocity covers equal increments per second and produces a linear slope on position vs. time graphs.
  - Included single-prompt `promptQuestion` and `explanation` attributes for seamless fallback support in `Bell-Ringer/teacher.html`.


## 2026-09-21 — Unit Conversion Practice MaxPoints Scoring Fix & Classroom Grade Rescale

**Pattern Updated**: `classroom-sync-engine.md`.

**Changes**:
- **Resolved CourseWork MaxPoints Mismatch & Legacy Oversized Grades**:
  - Identified root cause where Google Classroom coursework `Unit Conversion Practice` was created with `maxPoints: 10`, but Firestore `assignment_registry` had `maxPoints: 100`.
  - When `sync-cli.js` previously pushed student raw percentage scores (0–100), scores like 100, 33, 17 were entered as out of 10 in Google Classroom (e.g. 100/10), distorting student grades in Classroom and Aeries.
- **Hardened `sync-cli.js`**:
  - Updated coursework resolution in `sync-classroom/sync-cli.js` so `matchingCw.maxPoints` dynamically and authoritatively pulls from Google Classroom's live coursework object if it exists, overriding any inaccurate Firestore registry max points.
- **Corrected Firestore Registries**:
  - Updated `assignment_registry/Unit_Conversion_Practice` and `graded_assignments/Unit_Conversion_Practice` in Firestore to set `maxPoints: 10`.
- **Rescaled and Returned Submissions**:
  - Created and executed `sync-classroom/rescale-unit-conversion.js` across Periods 0–6.
  - Successfully rescaled all 131 oversized student grades (e.g., 100 -> 10/10, 33 -> 3.3/10, 17 -> 1.7/10, 50 -> 5/10) and returned them via Classroom API.
  - Dry-run verification confirmed 0 oversized submissions remaining across all periods.


## 2026-09-21 — Day 17 Graded Assignment Deployment: Kinematic Velocity Calculator

**Pattern Updated**: `scaffolded-word-problem-engine.md`.

**Changes**:
- **Promoted Kinematic Velocity Calculator to Day 17 Active Graded Assignment**:
  - Replaced the placeholder "planned in class" handout preview (`The vf = vo + at Kinematic Velocity Equation Problem Set`, `status: "planned"`) with the live, graded webapp (`Kinematic Velocity Calculator`, `url: "kinematic_velocity_calculator/dist/index.html"`, `status: "active"`).
  - Updated all central curriculum sources: `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, `assets/lessons-data.js`, and `Unit_2/outline.md`.
- **Eliminated "Planned in Class" Preview Notice**:
  - Pacing list on `unit2-dashboard.html` now renders Day 17 with the prominent amber `GRADED` pill and active launcher (`📝 Kinematic Velocity Calculator ↗`).
  - Modal drawer now displays the full interactive card with `Auto-Saved ✓` / `Online Firestore Grade Sync` instead of the informational popup button (`📋 PLANNED · IN-CLASS`).
- **Verified via Puppeteer**:
  - Automated test verified that `unit2-dashboard.html` displays the active assignment card and no planned notice on Day 17 in both the pacing list and modal drawer.

## 2026-09-21 — Desmos Scientific Calculator Result Extraction & Paste Architecture Fix

**Pattern Updated**: `scaffolded-word-problem-engine.md`.

**Changes**:
- **Root-Cause Resolution of Stale / Incorrect Paste Result Bug**:
  - Identified why `pasteDesmosResult()` pasted `36` instead of the most recent calculation `44` when students chained operations with `ans`:
    1. Desmos Scientific Calculator uses `\ans` in LaTeX. The previous regex-based LaTeX parser stripped unknown characters, converting `\ans` into `as`, triggering a JavaScript reference error and falling through to older expressions.
    2. `Desmos.ScientificCalculator` does not use the graphing `HelperExpression` API. Instead, its internal state machine evaluates expressions inside `desmosCalculator.controller.model`.
- **Robust Multi-Tiered Result Extraction**:
  - Implemented 3-tier fallback in `getDesmosLatestCalculation()`:
    - **Tier 1 (Controller Model)**: Reads `model.getExpressionOrder()` in reverse and retrieves `model.getExpressionValue(id)` (or `model._evaluations[id].value`). Directly captures the true calculated value from Desmos's internal math engine, natively resolving `\ans`, chained calculations, fractions, and powers.
    - **Tier 2 (DOM Display Text)**: Scrapes `.dcg-basic-expression-value` elements to extract the visual `= [value]` result shown on the calculator interface.
    - **Tier 3 (State / Regex Parser)**: Clean fallback for static expressions.
- **Hooked `onEvaluationUpdate` for Instant Telemetry**:
  - Wrapped `model.onEvaluationUpdate` so asynchronous evaluations immediately refresh all header badges (`RESULT: 44`) and telemetry readiness states in real time.
- **Automated Puppeteer Verification**:
  - Verified the exact user calculation (`2.4 * 15 = 36`, followed by `ans + 8 = 44`) in a headless browser: Desmos header badge and pasted input box both registered `44` with 100% accuracy.

## 2026-09-21 — Kinematics Question Bank Terminology Audit & Physics Precision

**Pattern Updated**: `scaffolded-word-problem-engine.md`.

**Changes**:
- **Comprehensive 50-Question Terminology Audit in `questions.js`**:
  - Eliminated physical misnomers where acceleration ($m/s^2$) was colloquially referred to as a force or energy rate (e.g. replaced "with power rating" with "with a constant acceleration of", replaced "magnetic resistance" with "magnetic braking deceleration", and replaced "parachute drag" with "decelerating with parachutes").
  - Fixed ambiguous variable prompt phrasing (e.g., replaced "what is its speed through the arrestor?" with "What is its final velocity?", replaced run-on questions like "How many seconds does this sprint take?" with concise targets like "What is the elapsed time?").
  - Standardized all `unknownText` noun phrases across Level 1 and Level 2 (`"its final velocity"`, `"its initial velocity"`, `"its acceleration"`, `"the elapsed time"`) so slot drag-and-drop targets match formal physics vocabulary.
  - Hardened `loadQuestion(idx = state.currentQuestionIndex || 0)` default parameter in `build-html.js` against undefined argument calls.
  - Rebuilt `dist/index.html` and verified full question bank integrity (all 50 mathematical relations $v_f = v_o + at$ intact).

## 2026-09-21 — Kinematic Velocity Zero-Wrap Formula Layout & Instant Preview Mode

**Pattern Updated**: `scaffolded-word-problem-engine.md`.

**Changes**:
- **Zero-Wrap Formula Slot Architecture**:
  - Solved equation wrapping bug where the 4th term `[ t ]` was forced onto a second line under `[ vo ]` when constrained within multi-column containers.
  - Re-architected the Equation Board into a dedicated full-width card with `flex-nowrap`, `.equation-slot` with `flex-shrink: 0`, and `overflow-x-auto`.
  - Mathematically verified on Puppeteer across desktop (1280px), tablet (768px), and mobile (375px) viewports: all 4 slots maintain identical `y` coordinates with strictly zero vertical wrapping.
- **Instant Developer & Teacher Preview Bypass**:
  - Eliminated the slow GitHub commit/push cycle previously required to test and review webapps without Google Sign-In.
  - Added multi-path instant bypass: auto-activates when running locally (`file:`, `localhost`, `127.0.0.1`), via URL query parameters (`?preview=true`, `?test=true`, `?guest=true`), or via a dedicated button on the sign-in screen ("Teacher Preview / Test Mode (No Login)").
  - Instantly unlocks all 3 tiers (`Level 1`, `Level 2`, `Level 3`) for inspection, displays `Student: Teacher Preview` in HUD, and safely handles state without unauthorized Firestore network writes.

## 2026-09-21 — Scaffolded Word Problem Practice Standard Established

**Pattern Created**: `scaffolded-word-problem-engine.md`.

**Changes**:
- **Codified Canonical Word Problem Practice Standard**:
  - Analyzed and standardized `https://rrmudry.github.io/physics_speed_calculator/dist/index.html` as the official benchmark for all physics word problem practice.
  - Formulated the 3-Tier Scaffold Ladder: Tier 1 (identification & formula structure with 0 arithmetic), Tier 2 (embedded Desmos tool computation with telemetry verification), Tier 3 (evaluated mastery quiz & certification).
  - Documented core technical pillars: Dual-modality drag/tap input, Web Speech API TTS with unit expansion, zero-asset Web Audio synthesis, tamper-resistant certificate generation (`MUD-{LAB_ID}-{studentId}-{level}-{score}-{CHECKSUM}`), and dual-path Firestore synchronization (`physics_labs` + `student_results`).
  - Added extensible formula configuration blueprint for upcoming units (`a = Δv/Δt`, `F = ma`, `p = mv`, `W = Fd`, `KE = ½mv²`).

## 2026-09-21 — Bell-Ringer Quality Grading & Automated Google Classroom Sync

**Pattern Updated**: `bell-ringer-config.md`.

**Changes**:
- **Built Quality & Effort Evaluation Engine ("Half-Ass Filter")**:
  - Implemented multi-criteria quality scoring in `sync-classroom/sync-bellringers.js` across all 4 activity types:
    - `cast_challenge`: Requires `percentComplete >= 50%` or `completedSteps >= 2` (filters out students submitting 0% or blank).
    - `concept_chat`: Requires >= 2 user chat turns or substantive single message >= 15 chars (filters out students bypassing the chat by clicking "Finish Session" with 0 turns).
    - `free_response`: Requires >= 15 chars and not matching explicit opt-outs (`"idk"`, `"i don't know"`, or Gemini `effortScore: 0`).
    - `connections`: Requires >= 1 solved category.
- **Fairness Cushion Pattern**:
  - For cumulative Weeks 1–5 grading: 10 genuine submissions = 100% full credit (80/80 pts), providing 3–5 free drop days for excused absences, field trips, or block schedules.
  - Submissions failing the quality filter receive 0 points for that day.
- **Google Classroom API Unturned-in Submission Gotcha**:
  - Discovered and resolved `Precondition check failed` error: Google Classroom rejects `studentSubmissions.return` calls when `sub.state === 'CREATED'`. Script patches both `draftGrade` and `assignedGrade`, and only invokes `.return()` when `sub.state === 'TURNED_IN'`.
- **Roster Pagination Bug Fixed (`courses.students.list` 30-item cap)**:
  - Discovered that Google Classroom API silently ignores `pageSize: 100` and caps `courses.students.list` at 30 students per page.
  - Previously caused students 31–38 in Period 4 (including Anahi Naranjo) and students 31–42 in Period 5 to be truncated and marked unmatched.
  - Implemented `do ... while (pageToken)` pagination loops in `sync-bellringers.js` and `sync-cli.js`, ensuring 100% full-class rosters sync cleanly.
- **Automated Assignment Registry & Roster Sync**:
  - Created coursework `Bell-Ringer Check-In: Weeks 1–5` across all 7 periods (80 pts, Unit 2: Motion topic).
  - Registered IDs in `assignment_registry/bell_ringer_weeks_1_5`.
  - Wrote 183 student records to `student_results/bell_ringer_weeks_1_5`.
  - Pushed and returned grades to 155 active students in Google Classroom.
- **Weekly Grading Support**:
  - Added `--weekly` mode (4 pts/day = 20 pts/week) with `npm run bellringer:weekly` and `npm run bellringer:weekly:dry`.

**Pattern Updated**: `acceleration-rate-studio.md`.

**Changes**:
- **Exclusively Focused Tier 3 on Acceleration Calculations**:
  - Removed all peripheral questions asking for $\Delta t$ or $\Delta v$.
  - All questions in Tier 3 are dedicated solely to calculating acceleration $a$ ($a = \Delta v / \Delta t$) with metric units $m/s²$.
  - Procedurally generates 4 distinct directional archetypes per round (`Speeding Up Moving Right (+a)`, `Slowing Down Moving Right (-a)`, `Speeding Up Moving Left (-a)`, `Slowing Down Moving Left (+a)`) with clean integer values.
- **Implemented 3-in-a-Row Mastery System (Matching Tiers 1 and 2)**:
  - Requires students to achieve **3 consecutive correct problems** to earn 25 PTS and unlock Tier 4.
  - Added an inline streak banner (`.tier3-streak-banner`) in the top challenge badge header displaying `Streak: X / 3 🔥` and 3 responsive dot indicators.
  - Incorrect answers immediately reset the streak counter to 0 with diagnostic guidance reminding students of the 3-in-a-row requirement.
  - Reaching 3 in a row triggers `AudioEngine.playUnlockPing()`, updates the banner to `✓ 3/3 MASTERED`, awards 25 PTS, unlocks Tier 4, and surfaces a direct `🚀 Go to Tier 4 ➔` button.
- **Round Failure Regeneration Loop**:
  - Completing a 4-question round without achieving 3 in a row triggers automatic generation of a fresh round of randomized acceleration problems with an informative round notice and toast notification.
- **Chromebook 1280x768 Zero-Scroll Compliance**:
  - Compact inline header alignment and tight padding maintain exact `scrollHeight = 768px` with zero vertical scrollbars.
- **Automated Verification**:
  - Executed automated Puppeteer tests (`test_tier3_acceleration_mastery.js` and `test_tier3_regeneration.js`): verified 100% exclusive acceleration questions, 0->1 streak increment, 1->0 error reset, 3-in-a-row mastery unlocking Tier 4 (+25 PTS), round regeneration on failure, 0 console errors, and exact 768px scrollHeight.

## 2026-09-20 — Acceleration Studio: Tier 3 Question Bank Expansion & Tier 4 Wording Simplification

**Pattern Updated**: `acceleration-rate-studio.md`.

**Changes**:
- **Expanded Tier 3 Question Bank (10 Practice Problems)**:
  - Expanded `this.tier3Problems` from 4 problems to 10 diverse, accessible quantitative problems covering all three formula rearrangements:
    - $a = \Delta v / \Delta t$ (4 problems: subway launch, cart reverse thrusters, leftward mining shuttle, and speed limit transitions).
    - $\Delta t = \Delta v / a$ (3 problems: highway braking to halt, maglev launch sprint, and leftward buffer braking).
    - $\Delta v = a \cdot \Delta t$ (3 problems: cargo drone boost, retro-rocket drop, and hyperloop boost).
  - Maintained full property sets (`id`, `title`, `prompt`, `given`, `givenText`, `targetVar`, `unknownText`, `formula`, `correctVal`, `targetVal`, `tolerance`, `unit`, `correctUnit`, `hint`) preventing `undefined` display bugs.
- **Added Non-Destructive Navigation to Tier 3**:
  - Added header controls featuring `[◀ Prev]` button, `<select id="t3_selectProblem">` jump menu, and `[Next ▶]` button for jumping to any of the 10 practice problems.
  - Solving any problem awards 25 PTS and unlocks Tier 4, while preserving ability to solve remaining practice problems.
- **Simplified Tier 4 Wording for Below-Grade-Level Readers**:
  - Replaced intimidating prose (*"An autonomous passenger pod is hurtling rightward toward the terminal buffer... To prevent an emergency collision, the onboard navigation computer must fire retro-thrusters to bring the pod to a dead halt..."*) with clean, accessible high school language:
    - Title: `Safety Barrier Braking Challenge`.
    - Prompt: *"A test pod moves right at <strong>v₀ = +24.0 m/s</strong>. A safety barrier ahead closes in <strong>Δt = 6.0 seconds</strong>. The pod must brake to a complete stop (<strong>v<sub>f</sub> = 0 m/s</strong>) right when the barrier closes."*
    - Question 1: *"1. Braking Acceleration (a) to stop in 6.0 s:"* (Hint: `a = (vf - v₀) / Δt = (0 - 24.0) / 6.0 = -4.0 m/s²`).
    - Question 2: *"2. Reversal: If brakes push for 8.0 s total, what is the final velocity?"* (Hint: `Pod stops at 6.0 s (v = 0), then speeds up to the left for 2 more seconds.`).
    - Actions: `🚀 Test Braking Run` and `Reset Pod`.
  - Updated tab button label in `index.html` to `Tier 4: Braking & Reversal`.
- **Strict Chromebook 1280x768 Zero-Scroll Compliance**:
  - Scaled Tier 4 canvas height to 98px and fine-tuned card/feedback padding so both Tier 3 and Tier 4 measure exactly `scrollHeight = 768px` on standard 1280x768 screens.
- **Automated Verification**:
  - Executed Puppeteer test (`test_tier3_expanded_and_tier4.js`): verified all 10 problems with valid G.U.E.S.S. values, dropdown and Prev/Next problem switching, solution verification and scoring (+25 PTS), simplified Tier 4 wording, 2.5s retro-thrust braking simulation and reversal, score completion (100/100 PTS), 0 console errors, and exact 768px scrollHeight.

## 2026-09-20 — Acceleration Studio: Tier 2 Three-in-a-Row Mastery & Dynamic Problem Generation System

**Pattern Updated**: `acceleration-rate-studio.md`.

**Changes**:
- **Mirrored Tier 1's 3-in-a-Row Mastery Requirement**:
  - Configured Tier 2 to require **3 consecutive correct problems** to achieve mastery (+25 PTS, unlocking Tier 3).
  - Added live 3-dot streak banner (`.tier2-streak-banner`) tracking progress from `0 / 3` to `3 / 3 MASTERED` with responsive gold and emerald indicators.
  - Incorrect values immediately reset the streak to 0 with diagnostic feedback reminding students of the 3-in-a-row unlock requirement.
- **Dynamic 4-Archetype Problem Generation (`generateTier2Problems()`)**:
  - Implemented procedural generation across all 4 Cartesian 1D kinematic archetypes (`+v/+a`, `+v/-a`, `-v/-a`, `-v/+a`) with clean integer values avoiding decimal arithmetic traps and ensuring consistent velocity directions across the 3-second simulation.
- **Round Failure Regeneration Loop**:
  - At the conclusion of a 4-problem round without 3 in a row, dynamically generates a fresh set of randomized problems, increments round number, displays a left-column round notice, and shows a global floating toast notification.
- **Direct Navigation Button**:
  - Once Tier 2 is mastered, dynamically injects the emerald `🚀 Go to Tier 3 ➔` button in the action bar, switching directly to `tab-tier3`.
- **Chromebook Zero-Scroll Compliance**:
  - Optimized left/right column balance so that initial load, active flight, and round notices all maintain `scrollHeight = 768px` on standard 1280x768 viewports.
- **Automated Verification**:
  - Executed Puppeteer test (`test_tier2_streak.js`): verified initial 0/3 streak, increment to 1/3, reset to 0/3 on error, 3-in-a-row mastery unlocking Tier 3 (+25 PTS, score 50/100), direct button navigation, round regeneration, and 0 console errors.

## 2026-09-20 — Acceleration Studio: Tier 2 Text De-Cluttering & Integrated Mini Flight Track Animation

**Pattern Updated**: `acceleration-rate-studio.md`.

**Changes**:
- **Eliminated "How to Calculate" Text Clutter**:
  - Removed the verbose middle column from the Tier 2 table (`Start at +20, then add (-4) [or minus 4]`), reducing cognitive load and visual intimidation for students reading below grade level.
  - Replaced text clutter with an ultra-clean 2-column data table (`Time` and `Velocity`).
  - Embedded sleek visual step-rate badges between rows (`⬇ Change: -4.0 m/s each second`) to intuitively communicate rate of change without algebraic notation.
- **Integrated Live Mini Flight Track Animation**:
  - Built an integrated interactive canvas (`#tier2TrackCanvas`, 122px height) into the left column of the Tier 2 card running `MotionSimulator`.
  - Added playback controls (`▶ Run Flight (3s)` and `🔄 Reset`) with a live telemetry strip (`Time`, `Velocity (v)`, `Acceleration (a)`).
  - The vehicle pod accelerates across the metric track for 3.0 seconds, dropping purple strobe marks with timestamp tags (`0s, 1s, 2s, 3s`) and velocity values directly onto the track before automatically pausing at 3.0 seconds.
- **Chromebook 1280x768 Compact No-Scroll Optimization**:
  - Balanced 2-column grid (`grid-template-columns: 1.15fr 1fr`) and micro-tuned card padding so that initial load, active flight, and diagnostic/success feedback all fit comfortably within `document.documentElement.scrollHeight = 768px` (zero vertical scrollbar).
- **Automated Verification**:
  - Tested via Puppeteer (`scratch/test_tier2.js`): verified canvas rendering, 3.0-second auto-stop, table submissions, score updates, Tier 3 unlock, and 768px scrollHeight. 0 console errors.

## 2026-09-20 — Acceleration Studio: Strict Sequential Tier Locking & Adaptive 3-in-a-Row Mastery Loop

**Pattern Updated**: `acceleration-rate-studio.md`.

**Changes**:
- **Strict Sequential Tier Locking**:
  - Locked Tier 2, Tier 3, and Tier 4 sequentially behind mastery of their immediate predecessors (Tier 1 ➔ Tier 2 ➔ Tier 3 ➔ Tier 4).
  - Configured locked tab buttons with `.locked` CSS styling and `🔒 Locked` pill badges.
  - Intercepted click events on locked tabs: plays WebAudio error chime (`AudioEngine.playError()`), triggers a horizontal shake animation (`.tab-shake`), and displays an informative floating toast (`#appGlobalToast`) explaining the unlock requirements.
  - Dynamic unlocking (`updateTabLockStates()`): when mastery conditions are met, `.locked` is removed, the score pill reveals `25 pts`, a pulsing glow (`.ready-pulse`) highlights the unlocked tier, and an unlock celebration toast appears.
- **Adaptive Question Regeneration & 3-in-a-Row Mastery Loop**:
  - Implemented procedural question generation (`generateTier1Questions()`) covering the 4 primary 1D kinematic archetypes (`+v/+a`, `+v/-a`, `-v/-a`, `-v/+a`) with randomized pod names and values.
  - Required students to achieve **3 correct answers in a row** to earn 25 PTS and unlock Tier 2.
  - Incorrect answers immediately reset the live streak counter to 0.
  - If a student completes a 4-question round without answering 3 out of 4 correctly or without achieving 3 in a row, a brand new procedural round is generated dynamically and a notification informs them of their progress.
  - Added a direct `🚀 Go to Tier 2 ➔` button in both the card and the simulation modal upon achieving 3 in a row.
- **Automated Verification**:
  - Created and executed headless Puppeteer tests (`test_tier_locks_and_streak.js` and `test_tier1_regeneration.js`) verifying strict lock enforcement, shake/toast handling, error streak resets, round regeneration, and unlock state transitions. All tests passed with 0 console errors.

## 2026-09-20 — Acceleration Studio: Tier 2 Reading Level Optimization & Strict Right/Left Directional Convention

**Pattern Updated**: `acceleration-rate-studio.md`.

**Changes**:
- **Strict 1D Cartesian Directional Standard (Eliminated East/West)**:
  - Audited and eliminated all occurrences of "East", "Eastward", "West", "Westbound", and "Westward" across `challenges.js`, `index.html`, and `style.css`.
  - Replaced compass terminology with explicit Cartesian vectors: **Right (+)** and **Left (-)** to prevent mental mapping conflicts during 1D kinematics problem solving.
- **Low Reading Level & Cognitive Load Optimization for Tier 2**:
  - Renamed tab from confusing academic title `Tier 2: (m/s)/s Ticker Tape` to plain language `Tier 2: Speed Each Second`.
  - Renamed badge to `TIER 2: HOW SPEED CHANGES EACH SECOND (MISSION X OF 3)`.
  - Replaced abstract function formulas (`v(0) + a`) in table calculation columns with concrete math steps: `Start at +5, then add (+3)` and `Take velocity at 1 s, then add (+3)`.
  - Added integer arithmetic scaffolding for negative acceleration: `add -4 (or subtract 4) each second` to prevent struggling students from getting tripped up by negative addition.
  - Simplified $\Delta v$ label with clear formula reminder: `Total change in velocity after 3 seconds: Δv = [ ] m/s (Velocity at 3 s minus Starting velocity v₀)`.
- **Chromebook Compact No-Scroll Layout for Tier 2**:
  - Extended compact card styling (`#tab-tier2 .challenge-card`) and tightened `.ticker-table` vertical cell padding (`0.4rem 0.6rem`).
  - Validated via headless Puppeteer: card and feedback fit within standard 1280x768 viewports without scrolling.


## 2026-09-20 — Acceleration Studio: Automatic Flight Modal on Check Answer & Pre-Answer Simulation Gating

**Pattern Updated**: `acceleration-rate-studio.md`.

**Changes**:
- **Strict Pre-Answer Simulation Gating**:
  - Completely removed the pre-answer simulation launch button from the Telemetry HUD.
  - Students cannot view the flight simulation until they commit their predictions and click "Check Answers".
- **Automatic Modal Trigger on "Check Answers"**:
  - Clicking "Check Answers" automatically displays the interactive flight motion popup modal (`#tier1SimModal`).
  - Modal features a prominent result banner:
    - **Correct**: Emerald banner (`🎉 Correct Prediction!`) with physical reasoning, live simulation, and direct `Next Pod ➔` button.
    - **Incorrect**: Rose banner (`❌ Not Quite Right — Observe the Flight Simulation Below:`) detailing which specific direction or motion property was mismatched, accompanied by the live simulation showing the vectors in action and a `Try Again 🔄` button.
  - Once answered, students can also re-launch the simulation via a "Re-watch Flight Simulation" button in the feedback banner.


## 2026-09-20 — Acceleration Studio: Tier 1 No-Scroll Layout Optimization for Student Laptops

**Pattern Updated**: `acceleration-rate-studio.md`.

**Changes**:
- **Eliminated Vertical Scrolling on Tier 1 (Sign Detective)**:
  - Re-architected single-column vertical flow into a responsive two-column grid layout (`grid-template-columns: 1fr 1.35fr`).
  - Left column houses a compact 2x2 Telemetry HUD (vehicle name, velocity, acceleration, active status) and a high-readability "Quick Sign Rule" summary card.
  - Right column houses 3 scaffolded questions with 2-column and 3-column button grids, inline submit and next buttons, and compact diagnostic feedback.
  - Compacted `.mastery-progress-card` padding and margin to fit within standard Chromebook viewports (1280x768 and 1366x768).
  - Validated via Puppeteer: `scrollHeight = 768px` on a 768px viewport (both initial and with feedback rendered), achieving zero vertical scrollbar and a 0px vertical overflow.


## 2026-09-20 — Acceleration Studio: Sequential 10-Second Sign Matrix Observation Gate

**Pattern Updated**: `acceleration-rate-studio.md`.

**Changes**:
- **Enforced 10-Second Sequential Sign Matrix Gate (Productive Friction)**:
  - Required students to actively observe each quadrant of the 2x2 Velocity-Acceleration Sign Matrix for at least 10.0 seconds before unlocking the subsequent quadrant.
  - Progression order: Top-Left (`+v, +a`) ➔ Top-Right (`+v, -a`) ➔ Bottom-Left (`-v, -a`) ➔ Bottom-Right (`-v, +a`).
  - Active countdown timer badge (`⏳ 10.0s` ... `0.0s`), glowing card-bottom progress fill line, and overall progress tracking bar (`1/4 Studied`).
  - Pausing the simulation or switching tabs automatically pauses observation accumulation to enforce authentic viewing.
  - Clicking locked cards triggers tactile shake animation (`cardShake`), audio error cue, and toast notification indicating required remaining observation seconds.
  - Unlocking each quadrant plays an upbeat chime (`playUnlockPing()`) and pulses the newly available quadrant (`ready-pulse`).
  - Progress saved in `sessionStorage` so students retain unlock progress during classroom sessions while having full freedom to revisit unlocked quadrants.

## 2026-09-20 — Day 16 Acceleration Studio: Decomposed Learning Goals & 4-Tier Webapp

**Pattern Created**: `acceleration-rate-studio.md`.
**Pattern Updated**: `index.md`.

**Changes**:
- **Decomposed Day 16 Learning Goals (Low Floor ➔ High Ceiling)**:
  - **Level 1 (Low Floor - Conceptual)**: Vector Signs & 2x2 Matrix. Shatters the misconception that negative acceleration always means slowing down. Proves matching signs = speeding up, opposite signs = slowing down.
  - **Level 2 (Bridge - Concrete Units)**: The physical meaning of units—deconstructing `m/s²` as `(m/s) per second` via discrete second-by-second ticker-tape accumulation tables (`v(t+1) = v(t) + a`).
  - **Level 3 (Target Proficiency - GUESS Calculations)**: Computing signed velocity differences (`Δv = v<sub>f</sub> - v₀`), elapsed time (`Δt`), and rate of change (`a = Δv / Δt`) with double-negative arithmetic.
  - **Level 4 (High Ceiling - Synthesis)**: Directional reversal and instantaneous rest (`v = 0`), calculating turnaround times (`t = -v₀ / a`), and proving acceleration remains non-zero even when instantaneous velocity is zero.
- **Engineered New Webapp: Acceleration Rate & Sign Studio (`Unit_2/acceleration_studio/`)**:
  - `index.html`: Dark cyber-HUD theme, responsive layout, NGSS declarative badge (`HS-PS2-1`), and printable Certificate of Mastery modal.
  - `style.css`: Glassmorphic styling, glowing vector badges, telemetry meters, and print media rules.
  - `js/simulation.js`: 1D metric coordinate canvas, dynamic green velocity and cyan acceleration arrows, strobe/ticker-tape trail, and zero-crossing turnaround detection.
  - `js/challenges.js`: 4-tier challenge engine (Sign Detective, (m/s)/s Ticker Tape, GUESS Sprint, and Autonomous Pod Emergency Braking Intercept) with 100-point scoring.
  - `js/auth.js`: Google Sign-In domain filter (`@orangeusd.org`), Firestore high-score retention, and parent doc registration (`unit2_day16_acceleration_studio`).
  - `js/app.js`: Web Audio API sound synthesizer (tones, clicks, thrust whines, braking crashes), 2x2 matrix presets, and slider controllers.
  - **Single Celestial Sun Resolution**: Inpainted out repeating sun pixels in `layers/parallax-mountain-bg.png` so the cloud/sky gradient tiles seamlessly across any viewport width, and added a single celestial sun with atmospheric corona glow behind the mountain layers (`layers 1-4`). Eliminates multiple suns on wide responsive screens.
- **Curriculum & Site Synchronization**:
  - Linked new webapp into `Unit_2/outline.md`, `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `assets/lessons-data.js`.
  - Incremented cachebuster to `?v=20260920d` in `unit2-dashboard.html`.
  - Refreshed footer deployment timestamp via `node scripts/update-timestamp.js`.

## 2026-09-20 — Gravitational Acceleration Standardization: g = 10 m/s² (Round Numbers for Conceptual Clarity)


**Pattern Updated**: `modular-vehicle-physics-game.md`, `dashboard-layout.md`.

**Changes**:
- **Standardized Acceleration of Gravity to -10 m/s² (or g = 10 m/s²)**:
  - Replaced $9.8\text{ m/s}^2$ / $9.81\text{ m/s}^2$ with $10\text{ m/s}^2$ across Unit 2 outlines, daily lessons, elevator apparent weight challenges, motion presentations, and Rat Rod Racers telemetry/challenges.
  - **Pedagogical Rationale**: Using $g = 10\text{ m/s}^2$ makes mathematical patterns obvious to introductory physics students: velocity changes by exactly $-10\text{ m/s}$ every second (0, -10, -20, -30 m/s), distance fallen follows round quadratic multiples ($d = \frac{1}{2}gt^2 = 5t^2 \rightarrow 5, 20, 45, 80\text{ m}$), and weight calculations yield integers ($W = m \cdot 10$).
  - **Elevator Challenge (Day 24)**: Updated passenger mass ($70\text{ kg}$) to yield $W = 700\text{ N}$ (was $686\text{ N}$), scale reading $F_N = 840\text{ N}$ (was $826\text{ N}$), and net force $+140\text{ N}$ producing $a = 2.0\text{ m/s}^2$.
  - **Rat Rod Racers**: Updated tire grip calculations ($F_{\text{max}} = \mu \cdot m \cdot g$ with $g = 10\text{ m/s}^2$) and physics simulation engine (`this.gravity = 10.0`, `aG = this.a / 10.0`).
  - Refreshed site timestamp via `node scripts/update-timestamp.js`.

## 2026-09-20 — Curriculum-Wide Subscript Notation Standardization (No Underlines, No LaTeX)

**Pattern Updated**: `dashboard-layout.md`.

**Changes**:
- **Eliminated Underscore Subscripts across Unit 2 and Site Lesson Data**:
  - Replaced all code-style underscore variable conventions (`v_f`, `v_avg`, `t_react`, `t_brake`, `Δx_react`, `Δx_brake`, `Δx_total`, `x_initial`, `x_final`, `F_net`, `F_g`, `F_N`, `F_T`, `F_f`, `F_app`, `F_air`, `F_impact`, `m_cart`, `m_hang`, `m_sys`, `μ_s`, `μ_k`) with proper HTML `<sub>` tags (e.g. `v<sub>f</sub>`, `v<sub>avg</sub>`, `t<sub>react</sub>`, `t<sub>brake</sub>`, `Δx<sub>total</sub>`, `F<sub>net</sub>`) and Unicode subscripts (`v₀`, `x₀`, `Δx₁`, `Δx₂`).
  - Completely purged remaining LaTeX formatting in favor of plain text, Unicode symbols (`Δ`, `m/s²`, `½`, `·`), and native HTML subscripts across `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, `assets/lessons-data.js`, and `Unit_2/outline.md`.
  - Refreshed deployment timestamp via `node scripts/update-timestamp.js`.

## 2026-09-20 — Unit 2 Dashboard: Week 4 Uniform Acceleration Pedagogical Progression

**Pattern Updated**: `dashboard-layout.md`.

**Changes**:
- **Reconstructed Week 4 (Sep 21–25, 2026) for Gradual Acceleration Scaffolding**:
  - Replaced abrupt jump into Free Fall and Projectiles with a deliberate 5-day progression mastering 1D uniform acceleration:
    - **Day 16 (Mon Sep 21)**: Calculating Velocity Changes ($\Delta v = v - v_0$), Time Changes ($\Delta t$), Units ($\text{m/s}^2$), and Defining Acceleration ($a = \Delta v / \Delta t = (v - v_0)/t$) with the 4-Pod sign challenge.
    - **Day 17 (Tue Sep 22)**: The Kinematic Velocity Equation ($v_f = v_0 + at$), isolating variables ($v_f, v_0, a, t$), and solving GUESS word problems (train braking telemetry).
    - **Day 18 (Wed Sep 23)**: Velocity vs. Time ($v-t$) Graphing for Uniform Acceleration, reading initial velocity from $y$-intercept, calculating acceleration from slope ($m = a$), and drone launch rail telemetry.
    - **Day 19 (Thu Sep 24)**: Calculating Distance for Accelerated Motion: Geometric Area Integration under $v-t$ curve (partitioning rectangles and triangles to derive $\Delta x = v_0 t + \frac{1}{2}at^2$) with dragster acceleration telemetry.
    - **Day 20 (Fri Sep 25)**: Kinematic Acceleration Synthesis: 2-Stage Stopping Distance Performance Challenge (constant speed reaction time + uniform braking deceleration).
- **Synchronized Data Repositories**:
  - `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, `assets/lessons-data.js`, and `Unit_2/outline.md`.
  - Cache buster updated to `?v=20260920c` in `unit2-dashboard.html`.
  - Deployment timestamp updated in `partials/footer.html`.
## 2026-09-20 — Unit 2 Dashboard: Reorder Day 14 Studio Workshop & Week 4 Acceleration Sequence

**Pattern Updated**: `dashboard-layout.md`.

**Changes**:
- **Reordered Day 14 Curriculum Reflection (`Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, `assets/lessons-data.js`, `Unit_2/outline.md`)**:
  - Re-anchored Day 14 (Thu Sep 17, 2026) to reflect actual classroom instruction: "Kinematics Graphing Workshop & Mid-Unit Studio Work Day".
  - Dedicated Day 14 assignments to Kinematics Graphing Challenges 1 & 2 (`Kinematics_Graphing_Challenges_1_and_2.pdf` and Honors edition) for Physics/Honors, and Marble Ramp Lab completion / missing work for Conceptual Physics.
  - Added new CAST challenge bell-ringer to Day 14 focusing on constant velocity drone flight telemetry, slopes, and linear intercept time (`t = 12.0 s`, `x = 120.0 m`).
- **Shifted Week 4 Sequence (Sep 21–25, 2026)**:
  - **Day 16 (Mon Sep 21)**: "Introducing Acceleration: Slope of Velocity-Time (`a = Δv / Δt`)" with the original 4-pod velocity/acceleration sign CAST challenge and Acceleration Sign Detective activity.
  - **Day 17 (Tue Sep 22)**: "Free Fall & Acceleration due to Gravity (`g = 9.8 m/s²`)".
  - **Day 18 (Wed Sep 23)**: "Up-and-Down 1D Projectiles & Motion Symmetry" (Toss & Catch / Pop-Rocket Apogee).
  - **Day 19 (Thu Sep 24)**: "Galileo's Incline Ramp Acceleration Lab: Diluting Gravity".
  - **Day 20 (Fri Sep 25)**: "Kinematics Capstone: Multi-Stage Intercepts & Forensic Collision Reconstruction" (culminating synthesis before Week 5 Newton's Laws).
  - Days 21–35 remain unchanged, perfectly aligned with the calendar starting Monday, Sep 28.
- **Cache-Busting & Timestamp Deployment**:
  - Incremented version query strings in `unit2-dashboard.html` (`?v=20260920`).
  - Ran `node scripts/update-timestamp.js` to refresh footer deployment timestamp.
## 2026-09-20 — Rat Rod Racers: Embedded Desmos Scientific Calculator Station in Dyno Lab

**Pattern Updated**: `modular-vehicle-physics-game.md`.

**Changes**:
- **CAST-Aligned Desmos Scientific Calculator Station (`index.html`, `style.css`, `game.js`)**:
  - Embedded official Desmos Scientific Calculator directly into `#tab-dyno` ("Dyno Proving Grounds"), allowing students to solve Newton's 2nd Law ($F = ma$, $a = F/m$, $m = F/a$), friction traction limits ($F_{\text{max}} = \mu mg$), and kinematic acceleration slopes without switching browser tabs.
  - Implemented responsive two-column desktop/Chromebook layout (`.dyno-layout`, `1.15fr 0.85fr`) placing the interactive physics challenge side-by-side with the sticky calculator station.
  - Added collapsible toggle (`↕`) to tuck the calculator away when screen real estate is needed, and a mobile jump button (`🧮 Calculator`) to instantly scroll to the calculator on narrow mobile viewports.
  - Dual-path fallback architecture: dynamically initializes `Desmos.ScientificCalculator` via official API with automatic iframe fallback to `https://www.desmos.com/scientific?embed` if scripts are blocked.
  - Handled hidden tab canvas zero-dimension gotcha by dispatching `this.desmosCalculator.resize()` with a 60ms delay inside `switchTab('dyno')`.
  - Added quick-reference formula cheat sheet directly underneath the calculator adhering strictly to plain-text Unicode notation (No LaTeX).
- Updated automated DOM verification test suite (`scratch/test-leaderboard-dom.js`) verifying Desmos API instantiation, iframe fallback fallback path, and responsive toggle events.

## 2026-09-19 — Rat Rod Racers: Fix Empty Leaderboard Tab Nesting & Instant Baseline Roster

**Pattern Updated**: `modular-vehicle-physics-game.md`.

**Changes**:
- **Fixed Tab Panel Nesting in `index.html`**:
  - Found that `<section id="tab-dyno">` was missing a closing `</section>` tag, causing the browser DOM parser to nest `<section id="tab-leaderboard">` directly inside `tab-dyno`.
  - When switching to the Leaderboard tab, `tab-dyno` received the `.hidden` class (`display: none !important;`), hiding `tab-leaderboard` and causing the entire leaderboard screen to appear completely blank/empty.
  - Closed `tab-dyno` properly and validated tag balance across the entire DOM tree with zero mismatches.
- **Instant Baseline Leaderboard & Firestore Timeout Guard (`game.js`, `auth_manager.js`)**:
  - Added `getBaselineLeaderboard()` and `_drawLeaderboardTable()` to populate the table synchronously on page load and tab switch, guaranteeing that the leaderboard is never blank while waiting for network requests.
  - Added a 3.5s timeout promise to Firestore queries in `fetchLeaderboard()`, preventing hanging or silent network freezes on unauthenticated or slow connections.
  - Pre-load leaderboard in `_initUI()` and exported `window.RatRodGame`.
- Created automated test `scratch/test-leaderboard-dom.js` validating tab switching and DOM table row rendering.
## 2026-09-19 — Rat Rod Racers: Driver Scoring System, Cloud Leaderboard & PI-Based Matchmaking

**Pattern Updated**: `modular-vehicle-physics-game.md`.

**Changes**:
- **Driver Championship Scoring System (`inventory.js`)**:
  - Implemented an authentic high school gamification scoring model tracking `driverScore` (base 1000) and `winStreak`.
  - Added race victory points (+30 pts), underdog upset bonus (up to +30 pts for beating higher PI cars), holeshot reaction time bonuses (+5 to +25 pts), win streak bonuses (+5 to +20 pts), and Dyno Lab calculation bonus (+15 pts per physics challenge).
  - Adopted non-punitive participation points (+5 pts) on losses to encourage students without discouragement.
- **Performance Index (PI) & Car Classes (`cars.js`)**:
  - Engineered dynamic PI metric ($200 - 1000+$) calculated from power-to-weight ($F_{\text{peak}} / m$), tire grip ($\mu$), aerodynamic drag area ($C_d A$), and part fusion levels.
  - Classified vehicles into 5 tiers: Class D (Rookie Jalopy, 200–449), Class C (Street Tuner, 450–599), Class B (Hot Rod Custom, 600–749), Class A (Pro Mod Gasser, 750–899), and Class S (Top Fuel Rail, 900+).
- **Matchmaking Against Similar-Level Racers (`game.js`)**:
  - Built `autoMatchOpponent()` algorithm matching players against rivals with minimum PI delta ($|PI_{\text{opp}} - PI_{\text{player}}|$).
  - Added real-time "Auto-Match Similar Rival" button and dynamic Matchup Difficulty Badge (`FAIR MATCH`, `MODERATE`, `UNDERDOG`, `ADVANTAGE`).
- **Live Cloud Leaderboard & Ghost Staging (`auth_manager.js`, `index.html`, `style.css`)**:
  - Implemented `fetchLeaderboard()` aggregating Firestore student entries, local user scores, and benchmark student ghosts.
  - Enabled instant in-memory toggling between Championship Points and Fastest 1/4-Mile ET without requiring composite indexes.
  - Added "Race Ghost" action button allowing students to immediately stage any leaderboard rival's vehicle into Lane 2 on the drag strip.
- Updated automated test suite in `scratch/test-rat-rod.js` (Tests 8–11) with 100% pass rate.
## 2026-09-19 — Rat Rod Racers: Dyno Lab Cash Anti-Exploit Patch & Student Google Auth Firestore Sync

**Pattern Updated**: `modular-vehicle-physics-game.md`.

**Changes**:
- **Patched Dyno Lab Cash Exploit**:
  - Eliminated rapid-click spamming and `Enter` key-hold infinite cash exploits on the "Check Answer" button.
  - Implemented model-level synchronous answer locking in `challenges.js` (`answered = true`), awarding 0 cash and returning `alreadyAnswered: true` on duplicate evaluations.
  - Implemented UI-level submission lock (`isSubmittingDyno = true`), immediate button hiding/disabling, and mapped subsequent `Enter` keydowns to advancing cleanly to the next challenge (`loadNextDynoChallenge()`).
- **Student Google Authentication & Cloud Firestore Persistence**:
  - Created `RatRodAuthManager` in `auth_manager.js` with Firebase Auth and Firestore support (`site-6e500`).
  - Restricted logins to official `@orangeusd.org` accounts (plus teacher overrides).
  - Backed up student state (bank cash, owned parts with fusion levels, equipped car specifications, race records, dyno streaks) to `student_results/Rat_Rod_Racers/students/{studentId}`.
  - Added student-scoped `localStorage` keys (`rat_rod_save_${studentId}`) alongside Firestore cloud sync with real-time status pills (`☁️ Synced` / `🔄 Saving`).
  - Added `#loginGateModal` with Google Sign-In and "Explore as Guest" option.
  - Added debounced/immediate `autoSave()` hooks on part equips, upgrades, scrap recycling, crate drops, race finishes, and dyno calculations.
- Updated automated test suite in `scratch/test-rat-rod.js` verifying anti-exploit blocking and cloud inventory restoration.

## 2026-09-19 — Rat Rod Racers: Unified Cartoon Hot-Rod Art Engine (Garage Preview & Track Consistency)

**Pattern Updated**: `modular-vehicle-physics-game.md`.

**Changes**:
- Elevated `drawRatRodCanvas()` in `rat-rod-racers/cars.js` into a unified **Cartoon Comic Hot-Rod Art Engine** with bold ink outlines (`#12121c`, 2.4-2.8px), two-tone cel-shading, gloss specular streaks, chopped windshields with diagonal comic glare slashes, chunky cartoon drag wheels with white sidewall lettering, and dynamic multi-layer cartoon flames.
- Addressed user feedback to ensure the car in the Garage Lift Preview and the car driving down the Drag Strip track **reasonably and seamlessly match** across all 36 modular parts (chassis, engines, wheels, spoilers, exhausts, charms).
- Synchronized `RatRodSVG.getPartSVG()` in `rat-rod-racers/assets.js` with matching cartoon vector artwork for crate unboxing drops and inventory cards.
- Refined garage preview hydraulic lift stand geometry and car positioning to perfectly accommodate the hot-rod rake stance.
- All automated unit tests and combination rendering suites passing with 100% clean output.

## 2026-09-19 — Rat Rod Racers: Modular Vehicle Physics Drag Game

**Pattern Created**: `modular-vehicle-physics-game.md` & added to `index.md`.

**Changes**:
- Built complete, modular educational drag racing web application at `rat-rod-racers/` teaching Velocity, Acceleration, Mass, Force ($F = ma$), aerodynamic drag, and tire traction limits.
- Designed 36+ cute rat rod modular vector/SVG components across 6 categories (Chassis, Engines with animated flapping blower valves, Wheels, Aero/Spoilers, Exhausts with animated flames, and Charms with acceleration sway).
- Created authentic SI-unit physics engine with wheel slip traction limits ($\mu \cdot m \cdot g$), aerodynamic quadratic drag, and telemetry logging.
- Built Academic Proving Grounds ("Dyno Lab") with Newton's 2nd Law calculations, $x-t$ and $v-t$ graph interpretation, data table calibration, and bank cash rewards with streak multipliers.
- Built Junkyard Mystery Crate Shop with 3 tiers, rarity loot tables, animated card unboxing, duplicate part fusion (Level 1-3 upgrades), and scrap recycling.
- Built 2-lane drag strip with Christmas tree staging, reaction time tracking, dynamic canvas camera tracking, post-race timeslips, and dual-car telemetry graph viewer ($x-t$, $v-t$, $a-t$, $F_{\text{net}}-t$).
- Fixed engine audio lifecycle to smoothly ramp down and disconnect on race finish, false start, and tab switches, preventing droning background noise.
- Linked featured game card in `games.html` and updated site deployment timestamp.

## 2026-09-17 — Authentic Student Exemplar Integration: Leo Rodriguez (Day 15 Graphing Speed Story)

**Pattern Updated**: `printable-graphing-worksheets.md`.

**Changes**:
- Integrated authentic completed student exemplar (`assets/images/graphing_speed_story_exemplar.jpg`) for the Day 15 "Graphing Speed Story" assignment (Student: Leo Rodriguez, Score: 9/10).
- Dynamically generalized `unit2-dashboard.html` modal drawer so that lesson exemplar cards use `day.exemplarTitle` and `day.exemplarDescription` when provided, falling back gracefully to Day 10 constant-speed text.
- Day 15 pacing cards now display a crisp thumbnail preview with the `🎨 EXEMPLAR` badge on `unit2-dashboard.html`.
- Updated `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, `Unit_2/outline.md`, and `assets/lessons-data.js` to link directly to `assets/images/graphing_speed_story_exemplar.jpg` under resources, links, and card image preview.

## 2026-09-17 — Official Student Handout: Graphing Speed Story (1-Page with Bubble Grid & QR Code)

**Pattern Updated**: `printable-graphing-worksheets.md`.

**Changes**:
- Integrated official teacher-provided 1-page PDF (`Graphing Speed Story - Google Docs`) as the sole student-facing handout at `Unit_2/worksheets/Graphing_Speed_Story.pdf`.
- Document contains Student ID bubble sheet, Score /10 bubble sheet, QR code, and Dual-Graph Studio unnumbered grids.
- Overwrote `Constant_Speed_Dual_Graph_Story.pdf` with the official file to safeguard against stale links.
- Updated `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, `Unit_2/outline.md`, and `assets/lessons-data.js` to point exclusively to `Graphing_Speed_Story.pdf`.
- Removed Teacher Master Key links from student-facing dashboard resources and links.

## 2026-09-17 — Unnumbered Student-Calibrated Axes on Dual-Graph Worksheet

**Pattern Updated**: `printable-graphing-worksheets.md`.

**Changes**:
- Updated `generateStudioGridSVG` in `scripts/generate_dual_graph_story_worksheet.js` to support `showNumbers: false` for the student worksheet while retaining `showNumbers: true` on the Teacher Master Key.
- Suppressed numerical labels on both axes while generating prominent 6px ticks with generous write-in margins for student handwriting.
- Added compact Scale Calibration Planner banner above Graph 1 on Page 2 prompting students to declare time, position, and velocity scale factors per block.
- Rendered bold bottom-left $L$-coordinate frame on Graph 1 and bold center baseline ($v=0$) on Graph 2 with 4 divisions above and 4 divisions below.
- Replaced hardcoded "10.0s" on Page 1 with open blanks to give students flexibility in choosing their journey parameters.

## 2026-09-17 — Constant Speed Story: 3-Stage Dual-Graph Studio Edition

**Pattern Created & Updated**: `printable-graphing-worksheets.md` & added to `index.md`.

**Motivation**:
- For Day 15 (Friday, Sep 18), created an authentic student-authored dual-graph assignment similar to Day 10, structured with **3 distinct motion sections across 10.0 seconds** matching Level 3 of the **Dual-Graph Studio** webapp (`Unit_2/dual_graph_studio/`).
- Students invent an original 3-section scenario (e.g. forward, stopped, reverse over 10s), draw the journey, compose a 3-part narrative, calculate velocities for each section in a structured GUESS motion table, and plot both Position-Time ($x-t$) and Velocity-Time ($v-t$) graphs.

**Key Architecture & Highlights**:
- **Dual-Graph Studio Coordinate Alignment**: Direct visual synchronization with the web studio: Time $t \in [0, 10\text{s}]$, Position $x \in [-2\text{m}, 18\text{m}]$, and Velocity $v \in [-4\text{m/s}, +6\text{m/s}]$ with prominent baselines at $x = 0$ and $v = 0$.
- **1:1 Vertical Time Alignment**: Both $x-t$ and $v-t$ grids share identical horizontal plot widths (620px across 10s, 62px per second), ensuring Section 1, 2, and 3 start/end marks align seamlessly between slope and area.
- **Strict 2-Page Print Budget**: Tuned CSS (`height: 10.40in`, `page-break-after: always`) verified with headless Puppeteer to guarantee 0px vertical overflow across both student pages and the 1-page Teacher Master Key.
- **Strict No-LaTeX Notation**: Plain text and Unicode symbols throughout prompt instructions and math labels.
- **Accompanying Teacher Master Key**: 10-point holistic rubric and complete worked exemplar using Studio Scenario 1 (Rover reverse $-4\text{ m/s}$ for 3s, stop 3s, forward $+3\text{ m/s}$ for 4s; $\sum\text{Area} = 0\text{m}$).


## 2026-09-16 — Student Engagement Law: Explicit Completion vs. Genuine Fun

**Pattern Created**: `student-task-engagement.md` & added workspace rule to `AGENTS.md`.

**Core Rule**:
- Never design or suggest a lesson, activity, or assignment where high school students are simply given a URL and told to "experiment," "play around with," or "practice."
- High school students immediately disengage without structured anchors.
- Every student activity must satisfy at least one of two design archetypes:
  1. **Archetype A: Clear Completion Requirements & Deliverables**: Explicit "done" criteria (e.g. minimum score threshold like 85%, finite challenge levels, hard submit button to Firestore / Classroom, or companion handout).
  2. **Archetype B: Genuinely Fun & Competitive Game Dynamics**: Head-to-head showdowns, live prediction challenges, race simulations with real-time stakes (win/loss/crash), or leaderboards where students actively compete against each other or the clock.

## 2026-09-15 — Marble Ramp Lab: Cloud State Restoration & Checks Array Guard

**Pattern Updated**: `marble-ramp-graphing-lab.md` — Fixed cloud draft state merging.

**Changes**:
- Resolved `TypeError: Cannot read properties of undefined (reading '0')` at `lab_engine.js:438`.
- In `auth_manager.js`, `loadStudentLabData()` now passes `data.labState || data` to `loadExternalState()` so the full saved lab data is restored instead of the lifted dashboard summary.
- In `lab_engine.js`, `loadExternalState()` safely deep-merges level fields rather than replacing `this.levels`.
- Added defensive array initialization for `activeLvl.trials` and `activeLvl.checks` across `renderStep2DataCollection()` and `updateQualityCheck()`.
- Added inline SVG favicon to eliminate 404 console request.

## 2026-09-15 — Marble Ramp Lab: Mandatory Beginning Login Gate

**Pattern Updated**: `marble-ramp-graphing-lab.md` — Enforced mandatory Google login gateway prior to lab access.

**Changes**:
- Added `#loginGateModal` fullscreen backdrop blur overlay to `Unit_2/marble_ramp_lab/index.html`.
- Updated `auth_manager.js` to manage gate modal visibility and display inline validation errors if a non-`@orangeusd.org` account attempts sign-in.
- Added programmatic guard checks in `lab_engine.js` (`goToStep` and `validateCurrentStep`) ensuring students cannot bypass or advance through steps without active authentication.
- Immediate cloud state restoration via `loadStudentLabData()` upon login ensures seamless pickup from previous sessions.

## 2026-09-15 — Marble Ramp Lab: Firestore Continuous Progress Autosave

**Pattern Updated**: `marble-ramp-graphing-lab.md` — Added dual autosave architecture (localStorage + Firestore).

**Changes**:
- Added `autoSaveDraft()` method to `auth_manager.js` mirroring the Wind-Up Toy Lab pattern: saves student draft progress to `student_results/Marble_Ramp_Lab/students/{studentId}` with top-level field lifting for gradebook preview.
- Added `saveProgress()` method to `lab_engine.js` that calls `saveLocalStorage()` immediately and debounces `autoSaveDraft()` at 1.5s.
- Replaced all 18 `saveLocalStorage()` call sites with `saveProgress()` so every state change (trial capture, stack height entry, calculation verification, graph point placement, CER text edits, step navigation) triggers cloud persistence.
- Added `updateSaveIndicator()` visual feedback ("Saved ✓" / "Submitted ✓") in the header.
- Final submission via `saveLabProgress()` now uses `ensureParentDocument()` for consistent parent doc metadata.

## 2026-09-15 — Marble Ramp Motion & Graphing Lab (Click-to-Plot x-t & v-t Incline Inquiry)

**Motivation**: Modernized the paper marble ramp lab ("Determining the Acceleration of a Marble Rolling Down a Ramp") into an authentic step-by-step interactive web application (`Unit_2/marble_ramp_lab/`) modeled on the Wind-Up Toy Speed Lab. Upgraded the activity for empirical position vs. time and velocity vs. time data collection, replication averaging, and student click-to-plot graphing.

**Key Architecture & Highlights**:
- **Apparatus & Scaffolding**:
  - 30.0 cm wooden ruler ramp with center guide groove elevated by book stacks (Low, Medium, High).
  - Marble released from rest level with the top book; constant-speed rolling across a marked table distance ($d = 60.0\text{ cm}$).
  - 3 timing replications per height with built-in precision digital stopwatch (Spacebar shortcut and direct time capture) and outlier detection checks.
  - Plain-language averaging ($t_{\text{avg}}$) and speed calculations ($v = d / t_{\text{avg}}$) integrated with the slide-out Desmos scientific calculator drawer.
- **Click-to-Plot Graphing Engine (`graph_studio.js`)**:
  - High-DPI canvas engine supporting mouse, trackpad, and touchscreen pointer events.
  - **Position vs. Time ($x$ vs $t$)**: Students click to place start $(0, 0)$ and finish $(t_{\text{avg}}, d)$ points. Dynamic slope triangle overlay calculates $\text{Rise} = \Delta x$, $\text{Run} = \Delta t$, and $\text{Slope} = \Delta x / \Delta t = v$, verifying that steeper slope equals faster speed.
  - **Velocity vs. Time ($v$ vs $t$)**: Students click $(0, v)$ and $(t_{\text{avg}}, v)$ to construct flat horizontal lines representing constant speed. Interactive shaded area rectangle illustrates $\text{Area} = v \cdot t_{\text{avg}} = d$ (the table distance).
  - Generous snap assistance, drag-to-adjust point handles, and one-click PNG export.
- **Standards, Auth & Gradebook Sync**:
  - Tagged with `HS-PS2-1`, Firebase Auth with `@orangeusd.org` domain filter, and Firestore score submission to `ASSIGNMENT_ID = "Marble_Ramp_Lab"` with highest-attempt retention.
- **Wiki Pattern**: Documented in `.agents/wiki/patterns/marble-ramp-graphing-lab.md`.

---

## 2026-09-15 — Planned Activity Fallback Pattern (Eliminating Placeholder Document Redirects)

**Motivation**: Discovered that an authentic Day 10 Google Doc URL (`Constant Speed Story Handout`) was historically copied as a generic placeholder across 46 distinct assignment, lab, and handout slots (Days 11–35) when Unit 2 was first scaffolded, causing uncreated or future activities to erroneously open the Day 10 document.

**Key Architecture & Highlights**:
- **Data Cleanup**:
  - Preserved authentic Day 10 URL for "Constant Speed Story Handout".
  - Day 11 updated with primary link to `Unit_2/position_time_graph_studio/index.html`.
  - Day 12 updated with primary link to `Unit_2/dual_graph_studio/index.html`.
  - Day 13 updated with primary link to `Unit_2/velocity_time_graph_studio/index.html`.
  - Days 14–35: All 44 erroneous placeholder doc references removed across `assets/lessons-data.js`, `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `Unit_2/outline.md`. Flagged planned items with `status: "planned"`, omitting dead URLs.
- **Dynamic Planned Activity UX**:
  - Implemented `showPlannedActivityNotice(title, description, topic, dayNumber)` modal in `unit2-dashboard.html` with glassmorphic amber styling acknowledging that future lesson plans adapt dynamically based on classroom pacing, with official materials published on the morning of instruction.
  - Interactive cards render as `📋 PLANNED · IN-CLASS` buttons opening the modal notice rather than dead/confusing external hyperlinks.
  - Synchronized `missing-work.html` to display planned items gracefully as non-clickable status indicators.
- **Wiki Pattern**: Documented in `.agents/wiki/patterns/dashboard-layout.md`.

---

## 2026-09-15 — Velocity-Time Graph Studio (Constant Speed & Uniform Acceleration Engine)

**Motivation**: Created an interactive velocity vs. time ($v\text{-}t$) laboratory webapp featuring constant speed examples, uniform acceleration examples (speeding up, braking to a halt, multi-segment trips, direction reversals), and real-time 1D vehicle motion visualization.

**Key Architecture & Highlights**:
- **New Webapp (`Unit_2/velocity_time_graph_studio/`)**:
  - Interactive $v\text{-}t$ canvas with touch/mouse draggable waypoint keyframes, grid snapping (0.5s time, 0.5 m/s velocity), live slope annotations ($a = \Delta v / \Delta t$), and integral area shading for displacement ($\Delta x$).
  - 1D highway motion track with responsive metric ruler, direction-aware car sprite, dynamic velocity ($v$) and acceleration ($a$) vector arrows, and real-time oil-drop / strobe markers dropped every 0.5s.
  - Collapsible synchronized position-time ($x\text{-}t$) curve graph.
  - 6 educational presets covering constant velocity ($a = 0$), uniform positive acceleration, negative acceleration braking, 3-phase trips, and direction reversal crossing $v = 0$.
  - Dual-waypoint synchronization: interactive graph dragging updates table inputs; table numerical edits update graph immediately.
  - Strict compliance with No-LaTeX rules (plain Unicode/HTML), Pointer Events with elevated optical loupe reticles, and high-contrast Cosmic Theme design system.
- **Wiki Pattern**: Documented in `.agents/wiki/patterns/velocity-time-graphing-studio.md`.

---

## 2026-09-14 — Dual-Graph Motion Studio (Google Sign-In Button Binding & Classroom Posting)

**Motivation**: The "Sign in with Google" button on the mandatory login gate modal was unresponsive upon initial load, and coursework needed deployment to Google Classroom.

**Root Causes & Fixes**:
- **Button ID Mismatch & Null Gate Binding**: The gate modal button had `id="btnGateSignIn"`, while `auth_manager.js` only queried `btn-gate-google-login`. Furthermore, `app.js` checked `if (gateLoginBtn && window.authManager)` inside `new DualStudioApp()` before `window.authManager` was instantiated.
- **Resilient Binding & Dual Aliasing**:
  - `auth_manager.js` now queries both `btnGateSignIn` and `btn-gate-google-login`.
  - Exported and self-initialized `window.authManager` and `window.studioAuth` globally.
  - Resolved `auth/cancelled-popup-request` by removing duplicate listeners in `app.js` (giving `auth_manager.js` single ownership of auth triggers) and adding an `isSigningIn` lock with 1200ms debounce in `signIn()`.
  - Linked Unit 2 SVG favicon in `<head>` to prevent 404 console noise.
- **Classroom Deployment**: Published "Dual-Graph Velocity vs Time Practice" (10 pts, due 9/15 6:00PM PDT) across all 7 class periods with topic "Unit 2: Motion".

---

## 2026-09-14 — Dual-Graph Motion Studio (x-t to v-t Translation)

**Motivation**: Building on the high success of the Position vs. Time Graphing Practice (135 completions, ~9.3/10 avg), students needed intermediate practice with 3-segment piecewise motion (direction, interval displacement, and slope-to-velocity) before executing dual-graph translation into velocity-time graphs.

**Key Architectural Changes**:
- **New Webapp (`Unit_2/dual_graph_studio/`)**:
  - 6 progressive levels: Level 1 (3-Section Motion Direction), Level 2 (Section Displacement Δx), Level 3 (Slope to Velocity v = Rise/Run), Level 4 (Red Alert Transition to v-t), Level 5 (Velocity Data Table), Level 6 (Dual-Graph Interactive Translation with draggable velocity bars).
  - Dual canvas engine: Synchronized Position vs. Time (Left) and Velocity vs. Time (Right) with 1D number line Ground Track simulation.
  - Full Google Auth (`@orangeusd.org`), live autosave, and score retention.
- **Sync Integration**: Added `dualgraph` matching rule to `sync-classroom/sync-cli.js`.
- **Curriculum Integration**: Added to Day 12 practice and links in `assets/lessons-data.js`.

---

## 2026-09-14 — Universal Draggable Datapoints (Level 6 Plotting Studio)

**Motivation**: Students needed the ability to drag any plotted point directly on the graph grid across both desktop and touch devices, eliminating the frustration of having to click "Reset Points" if a single point was misaligned.

**Key Architectural Changes**:
- **Interactive Drag Engine (`Unit_2/position_time_graph_studio/js/app.js`)**:
  - Added `findPlottedPointAt(mx, my, isTouch)` with 22px mouse / 35px touch hit radii.
  - On `pointerdown`: Detects if an existing plotted point was targeted and initiates dragging mode.
  - On `pointermove`: Fluidly moves the active point and real-time connecting dashed path across the grid, updating the coordinate HUD with `Move: ts, xm → [snappedT, snappedX]`.
  - On `pointerup`: Snaps the dragged point to integer coordinates, deduplicates any matching time steps, sorts chronologically, and triggers live mission validation.
  - Cursor transitions: Dynamically transitions from `crosshair` to `grab` on hover and `grabbing` while dragging.
  - Visual styling: Rendered tactile 10px drag rings, glowing 14px hover halos, and 17px amber-yellow active drag auras.
- **Pattern Updated**: Documented Section 3B in `.agents/wiki/patterns/position-time-graphing-studio.md`.

---

## 2026-09-14 — Safari & iPadOS Touch/Pointer Event Precision Alignment (Level 6 Plotting)

**Motivation**: iPad users running Safari reported that the optical loupe crosshair and touch point were misaligned on `https://rrmudry.github.io/Unit_2/position_time_graph_studio/index.html`, making it impossible to complete Level 6 ("Draw the Drive!").

**Root Causes Identified**:
1. **Non-Standard CSS `body { zoom: 0.9; }`**: WebKit/Safari handles CSS `zoom` differently from Blink. In `app.js`, dividing offset `mx` by `zoom` multiplied coordinates by $1.111$, causing 50–60px of reticle drift while `click` calculated unscaled `mx`, guaranteeing failed point snapping.
2. **Missing Touch & Pointer Events on `#graphCanvas`**: The studio only listened to `mousemove` and `click`. On iPad Safari, finger drag initiates native page scrolling rather than `mousemove`, canceling taps and preventing students from aiming.
3. **Finger Occlusion**: On touchscreens, the user's fingertip and hand occluded the bottom coordinate badge (`bottom: -22px`).

**Key Architectural Changes**:
- **CSS (`Unit_2/position_time_graph_studio/style.css`)**:
  - Removed `zoom: 0.9;` from `body`.
  - Added `#graphCanvas { touch-action: none; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }`.
  - Added `.loupe-reticle.touch-aiming` styles: enlarges reticle to 76px and flips coordinate badge above finger (`top: -30px; bottom: auto;`).
- **HTML (`Unit_2/position_time_graph_studio/index.html`)**:
  - Added inline `style="touch-action: none;"` and `select-none` to `#graphCanvas`.
- **JS (`Unit_2/position_time_graph_studio/js/app.js`)**:
  - Unified mouse, touch, and Apple Pencil with the **Pointer Events API** (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerleave`).
  - Positioned reticle relative to positioned parent container: `loupe.style.left = `${e.clientX - parentRect.left}px``, guaranteeing 1:1 physical centering at `(e.clientX, e.clientY)`.
  - Added `plotPointAt(mx, my)` supporting both direct tapping and drag-to-aim with release-to-plot.
  - Added live snap preview text in Level 6 (e.g. `2.9s, 8.8m [Snaps: 3s, 9m]`).
  - Deduplicated synthetic `click` events with timestamp guard (`Date.now() - lastPointerActionTime < 650`).
  - Added `orientationchange` listener for iPad rotation.
- **Pattern Updated**: Added Section 10 to `.agents/wiki/patterns/position-time-graphing-studio.md`.

---

## 2026-09-14 — Daily Update & Presentation Link Fix

**Task**: Executed `/daily-update` routine for Monday, September 14, 2026 (Unit 2, Day 11).
- Synchronized local repository with remote GitHub commits (`aaa5b6c6`).
- Verified Day 11 lesson tagging (`HS-PS2-1`), CAST telemetry Bell-Ringer, and Position vs. Time Graphing Studio links in `assets/lessons-data.js`, `Unit_2/unit2_lessons.json`, and `Unit_2/lesson.json`.
- Fixed relative link in `Unit_2/constant-speed-presentation/index.html` navigating back to `../../unit2-dashboard.html`.

---

## 2026-09-14 — Pedagogy: Low Floor / High Ceiling Scaffolding for Day 11 Bell-Ringer

**Motivation**: The teacher flagged that the Day 11 CAST Bell-Ringer ("Motion Graph Intercept & Speed Analysis") was too challenging for many students to access independently without upfront scaffolding.

**Pedagogical Enhancements (Low Floor / High Ceiling)**:
- **Low Floor (Total Accessibility)**:
  - **Part 1 (Motion States & Velocities)**: Dropped confusing uncontextualized math distractor options (`+1.2 m/s`, `+16.0 m/s`). Replaced with intuitive rate calculations directly tied to table intervals:
    - `+4.0 m/s (moves +16 m in 4 s)`
    - `at rest / stopped (velocity = 0 m/s)`
    - `+2.0 m/s (steady forward)`
  - **Part 2 (Catch-Up Time)**: Re-framed abstract mathematical intercept syntax into an intuitive catch-up scenario: *"Rover Alpha travels forward at 4.0 m/s starting from 0 m. Rover Beta is stopped ahead at the 12.0 m mark. How many seconds does it take for Rover Alpha to catch up?"* Added an explicit formula guide: `Time = Distance / Velocity = 12.0 m / (4.0 m/s) = 3.0 s`.
  - **Part 3 (AI Conceptual Chat)**: Aligned directly to the visible telemetry table (removing confusing references to graph slope or graph lines that have not been taught yet):
    - Title: *"Part 3: Explaining the Data Pattern"*
    - Prompt: *"Discuss your observations with the AI Physics Mentor: How can you tell from the telemetry table which rover covered ground faster, and what was happening at t = 3.0 s when they met?"*
    - Opening: *"Nice job! Rover Alpha caught up to Rover Beta at t = 3.0 seconds. Looking at the telemetry table, how can you prove to someone that Rover Alpha was moving faster during the first 4 seconds? And what was Rover Beta doing while Alpha caught up?"*
- **High Ceiling (Deep Extension for Advanced Students)**:
  - Students connect visual steepness to quantitative slope (`v = Δx / Δt`) and graph intersections to simultaneous coordinate equations `x(t) = x_0 + v*t`.
- **Synchronized Across Platform**:
  - Updated `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, `assets/lessons-data.js`, and live Firestore active session in `system_config/bellringer_timer`.

---

## 2026-09-14 — Fix: CAST Telemetry & Data Table Stimulus Schema Resilience

**Motivation**: On Monday's Bell-Ringer, the Desert Sprint Relay telemetry table and scenario narrative were not rendering in the left stimulus container, showing a blank column.

**Root Cause**:
- Schema mismatch between lesson curriculum authoring and the item rendering engine:
  - Day 11 authored `phenomenon.description` and `phenomenon.stimulus: { type: "data_table", ... }`.
  - `assets/js/cast-item-engine.js` was specifically checking for `phenomenon.text` and `phenomenon.dataTable`.
  - As a result, narrative context was skipped and the stimulus container fell into the fallback `classList.add('hidden')`.
  - In addition, teacher launcher (`Bell-Ringer/teacher.html`) and live projection (`Bell-Ringer/dashboard.html`) lacked fallback handling for `description` and in-dashboard rendering for `data_table`.

**Key Changes**:
- **`assets/js/cast-item-engine.js`**:
  - Context narrative now checks `ch.phenomenon?.text || ch.phenomenon?.description || ch.phenomenon?.scenario`.
  - Stimulus detection now supports `phen.type === 'data_table' || phen.dataTable || (phen.stimulus && (phen.stimulus.type === 'data_table' || phen.stimulus.headers))`.
  - Extracts table metadata cleanly via `const table = phen.dataTable || phen.stimulus || {};`.
- **Curriculum Harmonization**:
  - Updated `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `assets/lessons-data.js` Day 11 definitions to provide both standard (`text`, `type: "data_table"`, `dataTable`) and legacy fields (`description`, `stimulus`) for full bidirectional compatibility.
- **Teacher UI & Projection Dashboard**:
  - `Bell-Ringer/teacher.html`: Populates and launches with both `text` and `description`.
  - `Bell-Ringer/dashboard.html`: Added dedicated data table rendering in `#dashboard-phenomenon-table` within the aspect-video anchor card.
- **Live Firestore Session**:
  - Directly patched the active `system_config/bellringer_timer` document so open client sessions instantly receive both the narrative and the telemetry table on refresh.

---

## 2026-09-14 — Classroom Deployment: "Position vs. Time Graphing Practice" (Periods 0–6)

**Motivation**: The teacher requested creating the Google Classroom assignment for Periods 0 through 6 for the newly built Position vs. Time Graphing Practice studio, scheduled for Monday, September 14 at 6:00 PM PDT, worth 10 points.

**Key Changes**:
- **Google Classroom API Deployment**:
  - Automatically iterated across active courses (`Period 0 - Physics H`, `Period 1 - Concept Phys`, `Period 2 - Concept Phys`, `Period 3 - Concept Phys`, `Period 4 - Physics`, `Period 5 - Physics`, `Period 6 - Physics`).
  - Created coursework with:
    - Title: `"Position vs. Time Graphing Practice"`
    - Due Date: `2026-09-15T01:00:00Z` (Monday, Sep 14, 2026 at 6:00 PM PDT)
    - Max Points: `10`
    - Materials Link: `https://rrmudry.github.io/Unit_2/position_time_graph_studio/index.html`
- **Unified Firestore Grade Sync Registration**:
  - Saved assignment metadata and deployment records into Firestore `gradest_assignments/Position vs. Time Graphing Practice`.
  - Enables automatic 1-click grade syncing with score normalization (100% → 10/10 pts) and submission returns via `/sync-grades`.

---

## 2026-09-14 — Infrastructure: Live Firestore State Backup & Automatic Session Resume

**Motivation**: Students frequently close Chromebook lids or refresh pages mid-session. The teacher requested ensuring performance is backed up live to Firestore so students can leave and return to their exact progress without losing points or completed questions.

**Key Changes**:
- **Live Background Autosave**:
  - `awardPoints()` now immediately snapshots `liveStatePayload` (`studentSeed`, `levelScores`, `completedSteps`, `currentLevelId`, `currentStep`, `lastActiveAt`) and calls `saveStudioGrade(..., isAutosave=true)`.
  - Saves in the background without modal alerts or interrupting student focus.
- **Seamless Session Resumption**:
  - Enhanced `restoreSavedState()` in `GameController`:
    - Automatically calculates the highest incomplete level and step.
    - Loads the student straight into their active question with their unique seeded variant parameters intact.
- **Guest-to-Student Cloud Migration**:
  - If a student begins working before signing in, their local progress is preserved and immediately synced to Firestore upon Google Sign-In.
- **Top Bar Sync Status Indicator (`#firestore-save-indicator`)**:
  - Added visual cloud pill in header (`Backing up...` pulsing amber, `Cloud Synced ✓` volt green, `Offline Backup` rose).

---

## 2026-09-14 — Pedagogy: Elimination of "Moving Up / Mountain Climb" Misconception Terminology

**Motivation**: A common student misconception on position-time graphs is believing that a positive slope means the vehicle is physically climbing upward or ascending an altitude incline, rather than moving forward horizontally along a 1D track. The teacher flagged that questions and clues referencing "going straight UP" or "climbing up like a steep mountain cliff" reinforced this spatial misconception.

**Key Changes**:
- **Level 3 (Rise over Run)**:
  - Replaced *"Look at the red Rise bracket going straight UP on the graph. How many meters did the car go UP from 0 to X?"* with:
    `"Look at the red Rise bracket (Δx) measuring change in position. Notice the car is moving forward along the horizontal track. How many meters forward did the car travel from 0m to Xm?"`
  - Explicitly labeled slope triangle annotations with physical kinematics definitions: `Δx = Xm` (Rise / Distance covered) and `Δt = Xs` (Run / Time elapsed).
- **Level 2 (Fast or Slow?)**:
  - Replaced *"One line climbs up quickly like a steep mountain cliff"* with:
    `"Both cars are moving forward horizontally along the track, but one line has a steeper slope (covering meters much faster in less time). Which line has the steeper slope?"`
  - Replaced option phrasing *"climbs up fast"* with *"steeper slope — covers distance fast"*.
  - Reframed diagnostic clues around covering meters across time intervals rather than climbing hills.
- **Level 1 (Finding Position)**:
  - Replaced *"moving higher up to bigger meters"* with *"moving forward to larger meter marks"*.
  - Replaced *"position would climb up quickly"* with *"would cover meters down the track quickly"*.

---

## 2026-09-14 — Pedagogy: Mandatory Fresh Scenario Reload on Errors & Dynamic Option Permutation

**Motivation**: The teacher requested that retrying questions after an incorrect answer in multiple-choice levels be mandatory rather than optional (preventing guessing by elimination on the same problem), and that correct answers not always be placed as the first choice (A).

**Key Changes**:
- **Mandatory Scenario Reload on Error**:
  - In `bindChoices()`, selecting an incorrect option immediately locks all choice buttons (`.disabled`) and displays the targeted diagnostic clue.
  - An interactive primary action button `[🔄 Load Fresh Scenario to Master This ➜]` is displayed, which the student must click to generate a fresh problem variant with new numerical values and graph lines.
  - Guessing by elimination on the same scenario is completely eliminated while maintaining zero penalty to student scores.
- **Seeded Dynamic Option Permutation (`renderChoiceButtons`)**:
  - Implemented `renderChoiceButtons(choices, seedSalt)` in `GameController` which deterministically rotates answer choices across positions using `(this.studentSeed / 7 + seedSalt) % choices.length`.
  - Automatically prepends clean `A)`, `B)`, `C)` labels.
  - Ensures correct answers are distributed evenly across choices A, B, and C across all students, problem variants, and retries.
- **Extended Coverage**:
  - Applied dynamic option permutation and mandatory error-reload workflows to Level 1, Level 2, and Level 4.

---

## 2026-09-14 — Pedagogy: Diagnostic Feedback, Anti-Click-Spam Disabling & Attentive Rewards (Levels 1 & 2)

**Motivation**: In Levels 1 and 2, multiple-choice questions previously permitted random guessing by clicking choices repeatedly with zero friction or penalty. Students could pass by rapid trial-and-error rather than engaging with the graph. The teacher requested that mistakes not hurt the student's score, but serve as authentic learning experiences while rewarding attentive reading.

**Key Changes**:
- **Tactile Card Disabling & Shake Animation**:
  - When an incorrect choice is selected, an error tone plays, the card shakes with a subtle red outline (`@keyframes card-shake`), and the choice is dimmed and disabled (`pointer-events: none; opacity: 0.4; border-style: dashed;`).
  - This immediately prevents rapid guess-by-elimination spam while keeping the wrong choice visible for comparison.
- **Contextual Diagnostic Clue Cards**:
  - Replaced generic "Try again" text with rich, tailored pedagogical clues in a high-contrast card (`.diagnostic-clue-card`):
    - *Level 1 Step 0*: Starting position (t=0s at left axis) vs. where the car moved later.
    - *Level 1 Step 1*: Flat horizontal lines mean time passes with zero change in position (resting at a standstill).
    - *Level 1 Step 2*: Downhill slope indicates returning backward toward the 0m starting line.
    - *Level 2 Step 0*: Mountain cliff vs. gentle ramp analogy for comparing slope steepness and meters climbed per second.
    - *Level 2 Step 1*: Checking who reaches the target finish line earliest on the horizontal time axis.
    - *Level 2 Step 2*: Steeper lines mean greater speed.
- **First-Try Mastery Recognition (`⭐ Attentive Reader!`)**:
  - Tracking attempts per question (`attempts`).
  - Students who read attentively and answer correctly on their first try receive an exclusive `⭐ Attentive Reader!` celebratory badge alongside full points.
- **Fresh Scenario Retry Mechanism ("🔄 Try a Fresh Scenario to Master This")**:
  - Students who make an error are never permanently penalized in their score.
  - Clicking the retry button rolls a fresh numerical variant and trajectory via prime seeding, clearing disabled cards and resetting the attempt counter so they can demonstrate genuine mastery and earn the attentive recognition.

---

## 2026-09-14 — Pedagogy: Multi-Dataset Requirement (3 Datasets Each) for Levels 5 & 6

**Motivation**: Deepen student fluency in translating between position-time graphs and data tables by requiring multiple rounds of authentic measurement and coordinate plotting rather than a single trial.

**Key Changes**:
- **Level 5: 3 Motion Log Datasets (15 pts: 3 @ 5 pts)**:
  - Students decode and verify 3 distinct graph-to-table datasets in sequence (`Dataset 1 of 3 (● ○ ○)`, `Dataset 2 of 3 (● ● ○)`, `Dataset 3 of 3 (● ● ●)`).
  - Each dataset features unique time intervals and car positions with synchronized `⚡ Jump` helper buttons.
  - Verifying each table awards 5 points and unlocks the transition button to the next dataset or Level 6.
- **Level 6: 3 Grid Plotting Missions (20 pts: 6, 7, 7 pts)**:
  - Students complete 3 distinct 4-waypoint table-to-graph grid plotting missions (`Mission 1 of 3 (● ○ ○)`, `Mission 2 of 3 (● ● ○)`, `Mission 3 of 3 (● ● ●)`).
  - Each mission tests drive playback and validation; completing the 3rd mission unlocks the printable Mastery Certificate.
- **Progress Tracking & State**:
  - Sub-steps tracked individually (`l5_s0`, `l5_s1`, `l5_s2` and `l6_s0`, `l6_s1`, `l6_s2`) for granular Firestore persistence and recovery.

---

## 2026-09-14 — Auth: Mandatory School Account Login Gate (@orangeusd.org)

**Motivation**: Ensure every student logs in with their official school Google account prior to interacting with the Graph Studio, ensuring automatic gradebook synchronization and proper student-specific variant generation.

**Key Changes**:
- **Full-Screen Blur Login Gate (`#loginGateModal`)**: Blocks view and interaction with the missions until the student signs in with an `@orangeusd.org` or teacher account.
- **Domain Enforcement**: Strict validation in `auth_manager.js` checks that the user's email ends with `@orangeusd.org` (or recognized teacher accounts). Non-school accounts are rejected with clear diagnostic error feedback and immediately signed out.
- **Automatic Seed & Mission Calibration**: Once authenticated, `onStudentLoggedIn(studentId)` triggers in `StudioEngine`, instantly configuring the student's unique permutation of graph missions, restoring past scores from Firestore, and dismissing the gate.

---

## 2026-09-14 — Anti-Copying: Parameterized Problem Variants & Deterministic Seeding

**Motivation**: Prevent students from copying answers from neighbors during class while preserving equivalent cognitive difficulty, whole-number division, and Low Floor High Ceiling pedagogical accessibility.

**Key Changes**:
- **4 Distinct Variants Across All 6 Levels (4^6 = 4,096 Unique Combinations)**:
  - **Level 1 (Finding Position)**: Randomized flat rest intervals (3s-6s, 4s-7s, 2s-5s) and target positions (6m, 8m, 12m).
  - **Level 2 (Fast or Slow?)**: Randomized race scenarios, finishing distances (14m, 16m, 18m, 20m), and race winners alternating between Green and Blue cars.
  - **Level 3 (Rise over Run)**: Box-counting slope triangles with distinct whole-number velocities (6m÷2s=3 m/s, 8m÷2s=4 m/s, 12m÷3s=4 m/s, 10m÷2s=5 m/s).
  - **Level 4 (Driving Backwards)**: Distinct reverse velocities (-2, -3, -4 m/s) and scalar speedometer verification checks.
  - **Level 5 (Motion Log Table)**: Randomized 4-row motion log time points and positions synchronized with one-click jump chips.
  - **Level 6 (Draw the Drive)**: Randomized 4-coordinate mission waypoints for interactive coordinate grid plotting.
- **Deterministic Student Seeding (FNV-1a 32-bit Hash)**:
  - Students signed in via Google (`@orangeusd.org`) receive a persistent seed based on `studentId`.
  - Guest users receive a persisted seed in `localStorage ('pvt_studio_guest_seed')`.
  - Variants across levels are decorrelated using prime multipliers (`[17, 31, 53, 71, 89, 107, 131]`), ensuring high permutation variety between adjacent students.
- **State & Seed Persistence**: `studentSeed` is stored and restored across sessions in Firestore grade records and guest `localStorage`.

---

## 2026-09-14 — UI/Viewport: 90% Global Scaling for Zero-Scroll 720p Display

**Motivation**: On Chromebook and standard 1280x720 / 1366x768 screens, browser chrome and OS bars left limited vertical space, causing the lower question workspace and ground track to require minor vertical scrolling.

**Key Changes**:
- **CSS `zoom: 0.9`**: Added to `body` in `Unit_2/position_time_graph_studio/style.css`, proportionally scaling all cards, canvases, fonts, and controls to 90%.
- **Zoom-Compensated Reticle Tracking**: Updated `js/app.js` to scale loupe absolute coordinates by the computed zoom factor (`mx / zoom`, `my / zoom`), preserving exact crosshair alignment under the mouse pointer.
- **Print Reset**: Preserved `zoom: 1 !important` for printable mastery certificates.
- **Result**: The entire UI (header + 6-level strip + dual visualizers + question workspace) fits seamlessly within 720p screens with zero scrolling.

---

## 2026-09-14 — UI/Accessibility: High-Contrast Light Theme Overhaul (WCAG AAA) for Graph Studio

**Motivation**: In light theme mode, white text classes (`text-white`), pale grays (`text-slate-200/300`), and neon volt/lime accents (`#ccff00`, `text-lime-300`) lacked sufficient contrast on light cards and canvas backgrounds, causing question headers, instructions, and multiple-choice options to wash out.

**Key Changes**:
- **WCAG AAA Text Mapping**: Overrode `.text-white` to `#0f172a` (Slate 900) and `.text-slate-100/200/300` to `#1e293b` (Slate 800) under `html:not(.dark)`.
- **Primary Accent Shift**: Neon volt (`#ccff00`) and yellow (`#facc15`) mapped to rich Emerald/Forest green (`#15803d`, 7.2:1 contrast) and warm amber (`#b45309`) across badges, buttons, and titles.
- **Card & Button Boundaries**: Replaced faint semi-transparent borders with crisp `1.5px solid #cbd5e1` on choice cards, level strip buttons, and inputs.
- **Dynamic Canvas Contrast**: Added `getContrastColor(color, isDark)` in `MotionVisualizer` so lines, runners, time cursor, ticks, and vehicle sprites render with high contrast on white canvas backgrounds.
- **Theme Persistence**: Theme preference stored in `localStorage` and restored automatically on load.

---

## 2026-09-14 — Graded Webapp: Position vs. Time Graphing Studio (`Unit_2/position_time_graph_studio`)

**Motivation**: Created a comprehensive, graded interactive physics web application for Unit 2 (Day 11: 2026-09-14) addressing all 6 required student learning targets:
1. Slope is velocity (Rise over Run: `Δx / Δt`)
2. Determining from a graph where along a 1D spatial number line a moving object is
3. Comparing fast and slow movements on graphs (steepness & multi-agent races)
4. Entering information into a data table based on a graph (reticle coordinate inspection)
5. Creating a graph based on data in a data table (interactive grid plotting & simulation)
6. Determining speed from a graph (scalar magnitude `|v|` vs directional velocity `v`)

**Key Architecture & Features**:
- **Dual-Canvas Synchronized Visualizer**: Upper (t, x) graph with reticle loupe and dynamic rise/run triangles, synchronized with lower 1D Number Line track featuring animated cyber rover and live velocity vector telemetry.
- **Low Floor, High Ceiling Design**: 1 bite-sized question at a time, 5th-grade accessible reading level, box-counting scaffolding, and zero Greek formula barriers.
- **Chromebook 1280x720 Zero-Scroll Optimization**: Compact single-bar header (44px), horizontal 6-level pill strip (34px), and height-capped canvases (graph: 185px-215px, track: 52px-64px). The entire interaction loop (dual canvases + question workspace + instant feedback) fits within standard 560px-600px Chromebook viewports with zero vertical scrolling needed.
- **6 Graded Mastery Missions (100 Points Total)**: Progressive challenges with constructive diagnostic feedback, local storage backup, and highest attempt score retention.
- **Interactive Grid Plotter (Mission 6)**: Point-to-grid snap plotting with line connecting and instant simulation playback.
- **Free-Play Motion Sandbox**: Piecewise journey builder with presets and journey metrics (total distance, displacement, speed).
- **Google Auth & Firestore Submission**: Hardcoded `ASSIGNMENT_ID = "Position_Time_Graph_Studio"` targeting `student_results`, `@orangeusd.org` domain enforcement, and printable Certificate of Kinematic Mastery.
- **Zero-LaTeX Compliance**: Plain text and Unicode notation (`Δx`, `Δt`, `v = Δx / Δt`, `m/s`) throughout.
- **Curriculum Integration**: Featured on `unit2-dashboard.html`, `assets/lessons-data.js`, `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `Unit_2/outline.md`.

---

## 2026-09-13 — Admin Data Export: Fully Dynamic Firestore Assignment Discovery

**Motivation**: The `admin/data_export.html` Assessments & Archive tab used hard-coded `PRESETS` objects (Unit 1/2/6 assignment name lists) that required manual updates every time a new assignment was scanned or synced. Student result counts from `student_results` subcollections were not being fetched, showing "0 Scores" even when records existed.

**Key Changes**:
- **Removed hard-coded PRESETS**: Replaced Unit 1/2/6 keyword-matching with dynamic source-based quick filters (`With Scores`, `Scanned (Gradest)`, `WebApp Labs`, `Assessments`, `All`).
- **Subcollection count fetching**: `student_results` listener now fetches actual `students` subcollection `.size` for accurate score badge counts.
- **Auto-select on load**: Assignments with scores are auto-selected on first page load via `applyPreset('with_scores')`.
- **Removed row caps**: Table previews no longer cap at 30 (SUM) or 50 (DETAILED) rows — all students are shown.

**Pattern**: Assignment discovery is fully driven by Firestore `onSnapshot` listeners on `gradest_assignments`, `student_results`, and `assessments` collections. No assignment names need to be hard-coded anywhere.

---

## 2026-09-13 — Data Architecture & Grade Sync: Google Classroom Grade Ingestion & Complete Firestore Sync for Constant Speed Story

**Motivation**: Scanned student grades for *Constant Speed Story: Author & Solve* from Friday had been entered into Google Classroom across Periods 0–6 (124 graded submissions), but because previous sync scripts operated only from Firestore to Google Classroom, the Firestore collections (`gradest_assignments` and `student_results`) remained unpopulated except for a single manual record. Furthermore, `sync-cli.js` evaluated raw 10-point scale scores as raw percentages (10/100 = 10%), risking inaccurate down-scaling.

**Key Changes**:
- **Bidirectional Grade Ingestion (`handlePullFromClassroom` & `--pull`)**:
  - Implemented `handlePullFromClassroom` in `sync-classroom/sync-cli.js` and added `npm run pull` / `npm run pull:dry` scripts.
  - Automatically queries Google Classroom coursework across active periods, handles student profile pagination and fallback direct lookups, maps student emails (`id@orangeusd.org`) to roster Perm IDs, and writes complete score arrays to both `gradest_assignments` and `student_results/{assignment}/students/{studentId}`.
  - Successfully ingested all **124 graded student records** for *Constant Speed Story: Author & Solve* across Periods 0–6 into Firestore with authentic scores (10/10, 9/10, 8/10).
- **Scale Normalization Fix in `sync-cli.js`**:
  - Fixed `fetchAssignmentScores()` in `sync-classroom/sync-cli.js` to inspect `data.percentage` before `data.score`, and dynamically normalize small-scale point values (<= 15 pts) to 0–100 percentage values, ensuring 10/10 scores evaluate to 100% rather than 10%.
- **Live Admin Data Export Tool (`admin/data_export.html`)**:
  - The dynamic real-time Firestore listener immediately registers all 124 students under *Constant Speed Story: Author & Solve* with the `[124 Scores]` badge, fully previewable and filterable by Period 0–6 for instant Aeries CSV export.

## 2026-09-13 — Data Architecture: Real-Time Dynamic Firestore Assignment & Gradebook Hub (`admin/data_export.html`)

**Motivation**: Previously, `admin/data_export.html` relied on static hardcoded arrays and only scanned legacy `student_results` documents via a one-off `.get()`, failing to detect assignments in `gradest_assignments` (like *Constant Speed Story*, *Fantasy Maps*, *Quiz 1*) or newly created teacher assignments.

**Key Changes**:
- **Real-Time Reactive Registry**:
  - Implemented real-time `onSnapshot` listeners on `gradest_assignments`, `student_results`, and `assessments`.
  - Any time a new assignment is created, saved, or graded in Firestore (via *The Gradest*, *Assessment Editor*, or *Google Classroom Sync*), it automatically appears in the assignment list in real time with a live score count badge.
- **Dynamic Score Aggregation (`fetchFilteredResults`)**:
  - Ingests student grades from `gradest_assignments` (via `grades: [{ id, name, score, percentage, period }]`), `student_results/{assignment}/students` subcollections, and `physics_labs` (`speed_calculator`).
  - Automatically enriches student records with names and class periods from `rosterCache`.
- **Enhanced Filtering & UI**:
  - Added Class Period filter (`Period 0` to `Period 6`) to Section 3 for single-period Aeries SIS gradebook exports.
  - Added dynamic assignment text search filter (`#assignment-search-input`) and smart presets (`Unit 1`, `Unit 2`, `Unit 6`, `With Scores`).

## 2026-09-13 — Curriculum Architecture: Embed Authentic DOK 4 Culminating Performance Tasks & Engineering Anchors in Unit 2


**Motivation**: The Cognitive Progression Chart on `unit2-dashboard.html` previously peaked at DOK 3, lacking authentic DOK 4 (Extended Thinking, Modeling, and Engineering Design) tasks. Rather than artificially inflating routine assignments, 4 culminating milestone lessons were pedagogically elevated into rigorous DOK 4 anchors featuring multi-step investigations, student-formulated empirical protocols, iterative engineering cycles under physical constraints, and peer defense under cross-examination.

**Key Changes**:
- **Elevated 4 Culminating DOK 4 Anchors**:
  - **Day 20 (2026-09-25)**: *Autonomous Vehicle Forensic Crash Reconstruction & Kinematic Synthesis* (`HS-PS2-1`, `HS-ETS1-2`, DOK 4). Forensic engineering case study: piecewise kinematic phase partitioning (cruise, sensor latency, ABS braking, post-impact skid), parameter sensitivity modeling (pavement friction and reaction latency), and authoring a formal legal liability report.
  - **Day 30 (2026-10-09)**: *Student-Designed Traction Investigation & Highway Curve Safety Specification* (`HS-PS2-1`, `HS-ETS1-2`, DOK 4). Materials engineering investigation: teams formulate two independent empirical protocols (horizontal force sensor drag vs. critical incline slip angle `μ_s = tan θ`), reconcile systematic errors (stick-slip, temperature, contact wear), and author a banked highway safety speed limit specification.
  - **Day 33 (2026-10-14)**: *Structural Crashworthiness Engineering: Crumple Zone Impulse Optimization* (`HS-PS2-1`, `HS-ETS1-2`, DOK 4). Iterative engineering design cycle on Operation Safe Heeler: testing physical/virtual bumper crumple structures under strict constraints (crumple depth < 15 cm, bumper mass < 150 g, budget < $25), optimizing impulse deceleration duration (`F_avg · Δt = m · Δv`), and cloud logging telemetry.
  - **Day 34 (2026-10-15)**: *Automotive Safety Symposium & Peer Defense Gallery Walk* (`HS-PS2-1`, `HS-ETS1-2`, DOK 4). Cross-disciplinary synthesis uniting 1D Kinematics and Newtonian Dynamics: teams present comprehensive engineering portfolios, defend physical models during structured peer cross-examinations, and author technical audit critiques.
- **Data Store Synchronization**:
  - Updated `Unit_2/lesson.json`, `Unit_2/unit2_lessons.json`, and `assets/lessons-data.js` with comprehensive titles, topics, summaries, DOK levels (`4`), activities, essential questions, WICOR strategies, and resource links.
  - Updated `Unit_2/outline.md` blueprints for Days 20, 30, 33, and 34.
  - Updated DOK 4 overview card and script cache busters (`?v=20260913f`) in `unit2-dashboard.html`.
- **Standards & Policy Compliance**:
  - All lessons retain explicit NGSS standards (`HS-PS2-1`, `HS-ETS1-2`).
  - Zero LaTeX math notation throughout all files; plain text and Unicode symbols only (`Δ`, `x₀`, `v₀`, `m/s²`, `μ`).

## 2026-09-13 — Bug Fix: Restore categorizeLessonLinks & Enrich Days 21–35 Rich Resources & Materials


**Motivation**: Resolved an issue where rich resource badges, modal popover cards, and the `#resources` section links (Labs & Activities, Assessments) were missing from `unit2-dashboard.html`.

**Root Cause**:
1. `categorizeLessonLinks(day)` was inadvertently omitted during an earlier file regeneration of `assets/lessons-data.js`. Because `window.categorizeLessonLinks` was undefined, calls across `unit2-dashboard.html` (`renderCategorizedLinksHtml`, modal drawers, and `#labs-list` / `#assessments-list`) defaulted to empty arrays `{ assignments: [], resources: [], practice: [] }`.
2. Days 21–35 in `Unit_2/unit2_lessons.json` and `assets/lessons-data.js` were missing explicit `assignments`, `resources`, `practice`, and `links` objects.

**Key Changes**:
- **Restored `categorizeLessonLinks`**:
  - Restored full heuristic classification in `assets/lessons-data.js`, exporting to both `window.categorizeLessonLinks` and `module.exports = { lessonsData, categorizeLessonLinks }`.
  - Added an inline defensive fallback definition of `window.categorizeLessonLinks` directly inside `unit2-dashboard.html` to guarantee availability regardless of script load order or caching.
- **Enriched Days 21–35 Across All Stores**:
  - Fully populated `assignments`, `resources`, `practice`, and `links` for all dynamics days (Days 21–35) across `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `assets/lessons-data.js`.
  - Linked interactive tools: PhET Forces and Motion Basics, Vector Displacement & Force Calculator (`Unit_2/Vector_displacement_calculator_app/index.html`), Two-Car Kinematic Intercept Challenge (`Unit_2/two_car_intercept/index.html`), Operation Safe Heeler Crash Lab (`operation-safe-heeler.html`), and Safe Heeler Results (`operation_safe_heeler_results.html`).
  - Added lab handouts, slide decks, CER writing guides, problem sets, and formula reference sheets for all days.
- **Dashboard UI & Cache Busting**:
  - Added Operation Safe Heeler and Safe Heeler Results to the featured button cluster in the Mission Briefing card.
  - Reset `#labs-list` and `#assessments-list` on `initDashboard()`.
  - Bumped script cache busters to `?v=20260913e`.


**Motivation**: Extended Unit 2 ("1D Kinematics & Newton's Laws of Motion") from 25 days (5 weeks) to 35 instructional days (7 weeks) through October 16, 2026. This extension provides robust instructional time for both 1D Kinematics (free fall, vertical projectiles, Galileo's incline lab, multi-vehicle intercepts) and Newtonian Dynamics (Newton's 1st, 2nd, and 3rd Laws, FBDs, mechanical equilibrium, static/kinetic friction measurement, crash safety crumple zone engineering).

**Key Changes**:
- **7-Week Curriculum Architecture (Days 1–35)**:
  - **Part 1: 1D Kinematics (Weeks 1–4, Days 1–20)**:
    - *Week 1 (Days 1–5)*: Reference Frames, Cartography, Vector Displacement vs Scalar Distance, Tumble Buggy Uniform Motion Lab.
    - *Week 2 (Days 6–10)*: Labor Day Holiday, Wind-Up Toy Speed Lab Wrap-Up, Constant Speed Formulas (`v = d/t`, `d = v·t`, `t = d/v`), Constant Speed Story Performance Task.
    - *Week 3 (Days 11–15)*: Position vs. Time (`x-t`) Slope as Velocity, Velocity vs. Time (`v-t`) Translation, Geometric Area Displacement Integration, Acceleration (`a = Δv/Δt`), Uniformly Accelerated Motion (UAM).
    - *Week 4 (Days 16–20)*: Gravitational Free Fall (`g = 9.8 m/s²`), Vertical Projectiles & Symmetry, Galileo Incline Ramp Lab (`Δx ∝ t²`), Two-Car Kinematic Intercept Challenge, Kinematics Mid-Unit Mastery Checkpoint.
  - **Part 2: Newtonian Dynamics (Weeks 5–7, Days 21–35)**:
    - *Week 5 (Days 21–25)*: Newton's 1st Law (Inertia Demonstrations), Mass as Inertia vs Gravitational Weight (`W = m·g`), Free-Body Diagrams (FBDs), Mechanical Equilibrium (`F_net = 0`), Static Rigging Challenges.
    - *Week 6 (Days 26–30)*: Newton's 2nd Law (`F_net = m·a`), Modified Atwood Machine Track Lab, Friction Physics (Static vs Kinetic), Friction Block Inquiry Lab (`μ = F_f / F_N`), Multi-Force Braking & Stopping Distances.
    - *Week 7 (Days 31–35)*: Newton's 3rd Law (Action-Reaction Pairs), System Boundaries & Horse-Cart Paradox, Vehicle Crash Safety & Impulse Engineering (`F·Δt = m·Δv`), Unit 2 Grand Synthesis & Poster Gallery Walk, Unit 2 Summative Examination.
- **Repository-Wide Synchronization**:
  - `Unit_2/unit2_lessons.json`: Extended to 35 full lesson objects with WICOR, NGSS standards, DOK levels, and CAST/AI bell-ringers.
  - `Unit_2/lesson.json`: Synchronized pure JSON store with all 35 lessons.
  - `assets/lessons-data.js`: Master calendar updated with 139 total lessons across the academic year.
  - `Unit_2/outline.md`: Rewritten to reflect the complete 7-week, 35-day blueprint.
  - `unit2-dashboard.html`: Header updated to "Unit 2: 1D Kinematics & Newton's Laws of Motion", overview updated, and cache-buster updated to `?v=20260913d`. Dynamic DOK chart and progress bar verified for 35 days.
  - Zero LaTeX math syntax guaranteed across all lessons and UI files.


**Motivation**: Redesigned Unit 2 Week 3 (Days 11–15: September 14–18, 2026) to transition from constant-speed kinematics into comprehensive graphical motion analysis (position-time and velocity-time graphs), geometric integration (displacement as area under `v-t`), and uniformly accelerated motion (UAM). Consolidated Newtonian dynamics into Weeks 4 and 5, maintaining a strict 25-day unit pacing.

**Key Changes**:
- **Week 3 Kinematics Progression (Days 11–15)**:
  - **Day 11 (2026-09-14)**: Position vs. Time (`x-t`) Graphing: Slope as Velocity (`v = Δx / Δt`), horizontal rest, direction, and intercept interpretations. Bell-Ringer: CAST Challenge (Desert sprint relay telemetry and runner intercept).
  - **Day 12 (2026-09-15)**: Velocity vs. Time (`v-t`) Graphing: Direction, zero velocity axis, and piecewise graph translation workshop (`x-t` into step-wise `v-t`). Bell-Ringer: AI Concept Chat ("The Sign and the Speed").
  - **Day 13 (2026-09-16)**: Geometric Integration: Displacement as the Area Under the `v-t` Curve (`Δx = Area`, rectangles for uniform motion, triangles for changing motion, signed area for reverse travel). Bell-Ringer: CAST Challenge (Subterranean drone telemetry & distance vs. displacement).
  - **Day 14 (2026-09-17)**: Introducing Acceleration: Slope of Velocity-Time (`a = Δv / Δt`), units (`m/s²`), speeding up vs. slowing down sign rules, and parabolic curvature on `x-t`. Bell-Ringer: CAST Matrix (Automated transit pod telemetry).
  - **Day 15 (2026-09-18)**: Uniformly Accelerated Motion (UAM) & Kinematic Relationships: Deriving `v = v₀ + at` and `x = x₀ + v₀t + ½at²`. Bell-Ringer: CAST Challenge (Autonomous emergency braking & stopping distance performance task).
- **Consolidated Dynamics Progression (Weeks 4 & 5)**:
  - **Week 4 (Days 16–20)**: Causes of Motion: Newton's 1st Law & Inertia Demos (Day 16), Mass vs. Weight & FBDs (Day 17), Newton's 2nd Law Lab `F_net = m · a` (Day 18), Friction (Day 19), and Connecting Dynamics to Kinematic Stopping Distances (Day 20).
  - **Week 5 (Days 21–25)**: Newton's 3rd Law, System Boundaries, Vehicle Crash Safety Engineering, Comprehensive Unit Synthesis, and Unit 2 Summative Assessment.
- **Repository-Wide Alignment**:
  - Updated `Unit_2/outline.md` curriculum blueprint.
  - Updated `Unit_2/unit2_lessons.json` with complete WICOR, essential questions, and CAST/AI bell-ringers.
  - Synchronized `assets/lessons-data.js` master calendar (129 lessons).
  - Verified 100% adherence to the strict No-LaTeX policy (plain text/Unicode symbols) and mandatory daily NGSS standards arrays.

## 2026-09-12 — Fix: Unit Conversion Practice maxPoints Rescaling (100 -> 10 pts) & Aeries Gradebook Alignment

**Motivation**: Resolved an issue where "Unit Conversion Practice" was originally created in Google Classroom as a 100-point assignment (10x normal assignment weight). When Google Classroom synced to Aeries, Aeries inherited `maxPoints: 100` and overwrote teacher manual score corrections (10/10) back to 100/100.

**Key Changes**:
- **Coursework maxPoints Rescaling**:
  - Used `classroom.courses.courseWork.patch` to update `maxPoints` from 100 to 10 across all 7 academic courses (Periods 0 through 6).
- **Rule B Legacy Oversized Grade Recovery (`sync-classroom/sync-cli.js`)**:
  - Enhanced Rule B with `isLegacyOversizedGrade = existingGrade !== null && maxPts < 100 && existingGrade > maxPts`.
  - Prevents stale 100-point grades from falsely passing the `existingGrade >= scaledScore` check.
  - Automatically rescaled and returned all 139 student submissions to 10-point grades (e.g. 100% -> 10/10, 33% -> 3.3/10, 17% -> 1.7/10).
- **UI Deploy Default Protection**:
  - Updated `sync-classroom/public/index.html`, `sync-classroom/public/app.js`, and `sync-classroom/server.js` to default `maxPoints` to 10 instead of 100 for all future deployments.
- **Documentation**:
  - Added Section 10 to `.agents/wiki/patterns/classroom-gradebook-sync.md`.

## 2026-09-12 — Grade Sync Upgrade: Automated All-Assignments Late Work Evaluation & Optimized Batch Sync

**Motivation**: Enhanced the grade synchronization tool (`sync-classroom/sync-cli.js`) and `/sync-grades` workflow to automatically sync all active assignments across all 7 periods by default. This ensures late student submissions and score updates across any assignment in the unit are captured and returned in Google Classroom for Aeries gradebook sync, while preserving targeted single-assignment and period-filtered syncs without breaking existing workflows.

**Key Changes**:
- **Automated All-Assignments Batch Sync**:
  - Running `npm run sync` (or `/sync-grades`) without arguments automatically scans all scored assignments in Firestore with `studentCount > 0` and matches active Classroom coursework across Periods 0 to 6.
  - Retained single-assignment targeting (e.g. `npm run sync -- "Constant Speed Story"`) and period filtering (e.g. `--period=0`) for maximum versatility.
- **Smart Redundant-Write Optimization & Rule B (Higher Score Wins)**:
  - Implemented batch submission retrieval (`studentSubmissions.list` with `pageSize: 100`) per period coursework, drastically reducing API calls from ~30 per period to 1.
  - Added **Rule B (Higher Score Wins / Never Lower a Grade)**: inspects existing Google Classroom grades (`assignedGrade` and `draftGrade`) before writing. If a teacher manually entered a score in Google Classroom that is greater than or equal to the app score, it is preserved and never lowered. The sync tool only updates when an app score is strictly higher (e.g. late work replacing a zero or improved retake) or if Classroom has no grade recorded yet.
  - Submissions already matching or exceeding the app score are skipped in 0ms (`✓ Up to date`), saving API quota and eliminating interface friction.
  - Added `--force` (`-f`) flag for forcing re-evaluation when necessary.
- **Cross-Assignment Matching Guard & Manual Assignment Exclusion**:
  - Strengthened `findMatchingCourseWork()` with distinguishing keyword guards (`vector`, `displacement`, `distance`, `speed`, `calculator`, `conversion`) to prevent false-positive cross-matches between thematic sub-tasks (e.g., preventing "Fantasy Map Vector Calculations" from matching "Distance Displacement").
  - Excluded manually created Classroom coursework (e.g. `Accuracy_Precision_Emoji_Art`) from automated API sync and added graceful `@ProjectPermissionDenied` handling (`MANUAL (UI ONLY)`) to prevent permission errors on assignments created by hand in the Google Classroom web UI.
- **Workflow & Reporting**:
  - Added Master Executive Summary reporting across all assignments and periods.
  - Updated `.agent/workflows/sync-grades.md` and added `sync:all` / `sync:all:dry` npm convenience scripts.

## 2026-09-12 — Daily Update: Week 3 Launch & Day 11 (2026-09-14) Readiness Audit

**Motivation**: Executed the `/daily-update` workflow following the weekend sync. Pulled remote changes (including the updated Dragon Sky-Mansion exemplar and `.gitignore` update), audited Day 11 ("The Big Question: What Keeps Things Moving? — Inertia Demos") for Monday launch, verified 100% NGSS standards alignment, and confirmed zero LaTeX violations across all 154 curriculum entries.

**Key Changes**:
- **Remote Synchronization**: Fast-forward pulled 3 commits (`7c1e2265`) incorporating the high-resolution Dragon Sky-Mansion student exemplar artwork (`assets/images/constant_speed_story_exemplar.jpg`) and decoupling `admin/The_Gradest/` via `.gitignore`.
- **Curriculum & Standards Audit**:
  - Validated all 129 lessons in `assets/lessons-data.js`, all 25 lessons in `Unit_2/unit2_lessons.json`, and all 25 in `Unit_2/lesson.json`. Confirmed 100% have explicit `standards: ["HS-PS..."]` arrays and 0 syntax errors.
  - Audited Day 11 (Monday, 2026-09-14): Confirmed free-response bell-ringer ("baseball thrown in deep outer space"), 4 hands-on inertia demonstration stations, and essential question.
- **LaTeX Policy Verification**: Confirmed 0 LaTeX math syntax violations across the repository.

## 2026-09-11 — Day 10 Student Exemplar Artwork Update (Dragon Sky-Mansion)

**Motivation**: Replaced the placeholder student exemplar artwork on the Unit 2 Day 10 card and modal preview with the teacher's illustrated "Dragon Sky-Mansion" exemplar showcasing the complete student workflow: fantasy illustration with speed, distance, and time problem formulation, and complete GUESS method solution proof.

**Key Changes**:
- **Asset Replacement**: Overwrote `assets/images/constant_speed_story_exemplar.jpg` with the new dragon artwork.
- **Metadata Alignment**: Updated resource descriptions in `assets/lessons-data.js` and `Unit_2/unit2_lessons.json` to describe the dragon sky-mansion scenario.
- **Deployment**: Verified syntax and pushed to GitHub Pages (`origin/main`).


## 2026-09-10 — Day 10 Assignment Refinement: "Constant Speed Story: Author & Solve" (Paper Performance Task)

**Motivation**: Replaced the confusing Day 10 (2026-09-11) "Speed, Distance & Time Mastery Quiz" link with a creative paper-based authoring assignment requested by the teacher ("Constant Speed Story: Author & Solve"). Avoided unwanted digital/database scaffolding and tailored dashboard card labels for an authentic paper workflow.

**Key Changes**:
- **Curriculum Synchronization**:
  - Renamed Day 10 assignment to **"Constant Speed Story: Author & Solve"** across `assets/lessons-data.js`, `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `Unit_2/outline.md`.
  - Tagged type as `In-Class Performance Task` with submission status `Turn In Completed Worksheet`.
  - Set description: students illustrate an original motion scenario, write a word problem targeting an unknown variable ($v$, $d$, or $t$), and solve using the GUESS method on paper.
- **Dashboard Dynamic Action Labels**:
  - Enhanced `unit2-dashboard.html` coursework card renderer to support optional `actionLabel` property (`${item.actionLabel || 'Launch & Record Score'}`), displaying **"View Handout"** for paper tasks.
- **Standards & LaTeX Compliance**:
  - Preserved explicit NGSS `HS-PS2-1` standard alignment.
  - Verified 100% adherence to the repository's strict No-LaTeX policy (pure Unicode and HTML notation).
- **Clean Database Footprint**:
  - Ensured no digital Firestore assets or collections were introduced for this paper assignment.

## 2026-09-10 — Daily Update: Day 10 (2026-09-11) Readiness & Intercept Simulator Curriculum Linking

**Motivation**: Executed the `/daily-update` workflow to pull remote fixes for the CAST 3D bell-ringer engine, verify Day 10 (Friday, 2026-09-11) readiness across all 7 periods, ensure 100% NGSS standards tagging and zero-LaTeX compliance, link the new Two-Car Kinematic Intercept Challenge to Day 10 practice/links for Honors Physics Period 0, and push to GitHub Pages.

**Key Changes**:
- **Remote Synchronization**: Fast-forward pulled commit `0169f519` containing Ryan's fixes for CAST 3D bell-ringer Firestore response syncing, sanitizer for nested arrays, and countdown auto-submission.
- **Curriculum Linking (`Two-Car Kinematic Intercept Challenge`)**:
  - Linked `Unit_2/two_car_intercept/index.html` to Day 10 (2026-09-11) `practice` and `links` across `assets/lessons-data.js`, `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `Unit_2/outline.md` so Period 0 Honors Physics and synthesis students can access the live simulator on Day 10 as well as Day 9.
- **Standards & LaTeX Auditing**:
  - Audited all 129 lessons in `assets/lessons-data.js` and all 25 lessons in `unit2_lessons.json` and `lesson.json`: verified 100% have explicit `standards: ["HS-PS..."]` arrays and 0 math LaTeX syntax violations.
- **Deployment**: Verified syntax across all modified files and pushed to GitHub Pages (`origin/main`).

## 2026-09-10 — Bell-Ringer CAST 3D Task Response Syncing & Firestore Resolution

**Motivation**: Audited and fixed an issue where student responses were not syncing to Cloud Firestore for Unit 2 Day 8 and Day 9 following the introduction of CAST 3D Performance Tasks (`cast_challenge`).

**Key Changes**:
- **`Bell-Ringer/index.html`**:
  - **`sanitizeForFirestore()`**: Added deep-sanitization helper preventing Firestore nested array violations (`summary.stepResults[i].state.chatMessages`) by converting inner arrays into maps (`{ item_0: ... }`) and purging `undefined` properties.
  - **`submitCastChallenge()`**: Fixed `chatMessages` extraction logic so it inspects `state.steps` and defaults to `[]` (preventing `Unsupported field value: undefined` exceptions). Extracted structured `castAnswers` object, `completedSteps`, `totalSteps`, and `percentComplete` at top-level.
  - **`handleCastChatSend()`**: Added `studentId`, `studentName`, `class_period`, and `date` to the background chat autosave payload so Firestore security rules pass on new document creation.
  - **Countdown Timer Auto-Submit**: Wired `activeCastEngine.submitAll()` into `runTimerCountdown()` when `diffMs <= 0`, ensuring students' progress is automatically recorded if the timer runs out.
  - **Submission Status Synchronization**: Enhanced `startSubmissionListener()` to keep student and CAST panels synchronized with verified progress upon reload.
- **`Bell-Ringer/dashboard.html`**:
  - Added dedicated `activeActivityType === 'cast_challenge'` branch in `renderTiles()`, displaying live progress badges (`✓ X/Y parts`, `🔬 X/Y parts`).
- **`assets/js/cast-item-engine.js`**:
  - Added tactile button feedback (`Submitting Task...`) to avoid duplicate clicks during network writes.
- **Wiki Pattern**:
  - Documented Firestore nested array, undefined value, and timer auto-submission pitfalls in `.agents/wiki/patterns/bell-ringer-config.md`.

## 2026-09-10 — Two-Vehicle Kinematic Intercept Challenge & Dual-Engine Visualizer (`Unit_2/two_car_intercept/`)

**Motivation**: Created an interactive web application for Period 0 Honors Physics based on the Unit 2 Kinematic Vector & Slope Visualizer. Designed to turn algebraic intercept word problems into an engaging classroom team competition with live physics simulation, graphical analysis, and instant scoring.

**Key Changes**:
- **`Unit_2/two_car_intercept/index.html`**:
  - Implemented dual synchronized HTML5 canvases: 1D motion runway (with animated cars, headlights, exhaust particles, velocity vectors, origin, finish line, and collision shockwave) and 2D Position vs. Time ($x-t$) coordinate graph with intersecting lines and sweeping time cursor.
  - Developed a robust randomized condition generator supporting Head-on, Pursuit, and Wildcard modes, guaranteeing clean integer or half-second meeting times ($t_{meet}$) and locations ($x_{meet}$) strictly within the $0\text{ m}$ to $200\text{ m}$ track bounds.
  - Built an integrated team competition HUD featuring team name input, time/position prediction fields, automated stopwatch timer, tolerance-based accuracy scoring (Bullseye / Acceptable), live leaderboard, and an expandable step-by-step algebraic proof drawer.
  - Implemented a zero-dependency Web Audio API procedural sound engine synthesizing engine revs, ignition, stopwatch ticks, success arpeggios, error buzzers, and collision impacts.
  - Fully aligned with NGSS `HS-PS2-1` and strictly compliant with the repository's No-LaTeX formatting policy.
- **`unit2-dashboard.html`**:
  - Added direct link buttons in the hero interactive tools banner and beside the Kinematic Vector & Slope Visualizer header.
- **`assets/lessons-data.js`**:
  - Registered the app under Day 9 (2026-09-10) practice and resource links for Period 0.
- **Team Authentication & Integrity Features (`Unit_2/two_car_intercept/index.html`)**:
  - Added Google Sign-In with Firebase Auth (`site-6e500`) and Team Registration modal (Team Name, Members, Period).
  - Built Calculation-Phase Graph Gating: Position vs. Time ($x-t$) graph is shrouded behind a glassmorphic lock curtain while students calculate, unlocking only upon prediction submission or "Run Verification Race" activation.
  - Implemented Academic Integrity Tab/Window Switch Disqualification: Detects tab switches and `window.blur` while the problem timer is running. Replaced intrusive full-screen teacher PIN lockout with an automatic **0 points** round score (`status: 'DISQUALIFIED (0 pts) ⚠️'`), unlocked solution graph, and a non-blocking toast alert instructing students to proceed to "New Challenge". Eliminates teacher unlock friction during competitive gameplay.
  - Built Prominent Post-Run Answer Display: Designed high-contrast projector HUD card (`#post-run-solution-card`) that automatically reveals after the verification race auto-pauses, displaying massive glowing numerals for Meeting Time ($t_{meet}$) and Meeting Position ($x_{meet}$), algebraic equality validation, prediction accuracy feedback, track/graph coordinate pills, and auto-expanding the step-by-step substitution proof drawer.
- **Teacher Host vs Student Client Architecture (`Unit_2/two_car_intercept/index.html` & `firestore.rules`)**:
  - Whitelisted teacher accounts (`rmudry@orangeusd.org`, `rrmudry@gmail.com`) for host control: only teacher accounts can generate new challenges, switch scenario modes, toggle simulation playback (Run, Pause, Reset), or clear the leaderboard.
  - Student and guest accounts receive read-only live sync views displaying active car initial conditions ($x_{0A}, v_A, x_{0B}, v_B$) and an interactive prediction submission form.
  - Submitting predictions locks input fields and shows a locked confirmation badge.
  - Student devices listen to Firestore document `two_car_intercept_state/active_session` via `onSnapshot`, automatically synchronizing challenge conditions, physical race animation, graph unlocking, and prominent post-run solution displays in real time when triggered by Mr. Mudry's host screen.
  - Added Section 11 to `firestore.rules` enforcing admin-only write access to `two_car_intercept_state` and deployed to Firebase project `site-6e500`.
- **Wiki**:
  - Created `.agents/wiki/patterns/two-agent-kinematic-intercept.md` (including Section 7 for Host vs Client Sync Architecture) and indexed in `.agents/wiki/index.md`.

## 2026-09-10 — Headless Daily Grade Sync CLI (`npm run sync`) & Automated Workflow

**Motivation**: Enable rapid, single-command gradebook synchronization from home across all 7 Google Classroom periods (Period 0 to Period 6), eliminating repetitive manual clicking in the web UI.

**Key Changes**:
- **`sync-classroom/sync-cli.js`**:
  - Implemented standalone Node CLI integrating Google Classroom API and Firebase Admin SDK.
  - Automatically queries all 7 academic courses while filtering out TA sections (`Jacob P5 TA`, etc.).
  - Matches coursework by title across all courses, scales scores to custom `maxPoints` (e.g. 10 pts), and concurrently synchronizes and returns submissions.
  - Generates a formatted executive summary table showing period-by-period progress, average scores, and completion status.
  - Supports `--dry-run` (`npm run sync:dry`), `--period=N`, and `--list`.
- **`sync-classroom/package.json`**:
  - Added `"sync": "node sync-cli.js"` and `"sync:dry": "node sync-cli.js --dry-run"`.
- **Workflows**:
  - Created `.agent/workflows/sync-grades.md` for `/sync-grades` slash command execution.
  - Added optional end-of-day grade sync step in `.agent/workflows/daily-update.md`.
- **Wiki Pattern**:
  - Added Section 5 to `.agents/wiki/patterns/classroom-gradebook-sync.md`.

## 2026-09-10 — Mudry Sync Dashboard: `physics_labs` Direct Integration & Period 0 Resolution

**Motivation**: The Google Classroom sync server (`sync-classroom`) was querying legacy collections (`student_results`, `gradest_assignments`, `assessments`, `assignments`) but lacked an adapter for the top-level `physics_labs` collection where the Physics Speed Calculator stores student progress. As a result, the Speed Calculator did not appear in the dashboard dropdown.

**Key Changes**:
- **`sync-classroom/server.js`**:
  - Added Section 5 in `GET /api/assignments`: Queries `physics_labs` and registers `Physics Speed Calculator (136 students)` in the assignment selector dropdown.
  - Added score resolver in `GET /api/assignments/:assignmentId/scores`: Joins student documents with `roster` to retrieve names and class periods, mapping Level 3 mastery (100%), Level 3 quiz scores, Level 2 practice (70%), and Level 1 setup (50%).
  - Fixed Period 0 falsy bug: Preserves `class_period: 0` for Honors Physics students instead of converting `0 || null` to `null` (`'---'`).
  - Added dynamic `maxPoints` scaling in `POST /api/sync-grade`: Automatically scales student percentage scores proportionally against target Google Classroom coursework points (e.g. 6, 10, or 100 pts).
- **`sync-classroom/public/app.js`**:
  - Updated "Copy to Deploy Form" helper to automatically populate the exact URL `https://rrmudry.github.io/physics_speed_calculator/dist/index.html` into assignment descriptions when deploying coursework to Classroom.
- **Wiki Pattern**:
  - Added Section 4 to `.agents/wiki/patterns/classroom-gradebook-sync.md`.

## 2026-09-10 — Physics Speed Calculator: Notation Alignment ($v = d / t$) & Sub-label Scaffolding

**Motivation**: Telemetry analysis of 136 student records revealed that 51 students were stalled in Level 1 due to symbolic cognitive interference between classroom notes ($v = d / t$ with distance on top of the Formula Triangle) and the app's coordinate notation ($v = x / t$). Students experienced the "algebra reflex," mistaking $x$ for the mystery unknown rather than distance.

**Key Changes**:
- **Equation Board & Slots (`physics_speed_calculator/dist/index.html`)**:
  - Replaced $v = x / t$ with $v = d / t$ across the main equation board.
  - Added persistent English sublabels to all slots ($v$ `speed`, $d$ `distance`, $t$ `time`) in both empty and populated states.
  - Level 2 & 3 inline solving now displays `d (distance) (solve)`.
- **Help Modal & Formula Guides**:
  - Updated variable selector button to `d` (Distance) and aligned dynamic formulas to $v = d / t$, $d = v \times t$, and $t = d / v$.
- **Certificate of Kinematic Mastery**:
  - Aligned certificate text to award mastery in Speed ($v = d / t$), Distance ($d = v \cdot t$), and Time ($t = d / v$).
- **Data Stability**:
  - Kept internal slot mapping (`data-slot="x"`) and Firestore schema 100% backward-compatible.
- **Wiki Pattern**:
  - Added Section D (Symbolic Consistency with Classroom Notation & Pacing) to `.agents/wiki/patterns/cast-aligned-webapp-design.md`.

## 2026-09-10 — Daily Update: Day 10 (2026-09-11) CAST 3D Bell-Ringer Upgrade & Remote Sync

**Motivation**: Executed the `/daily-update` workflow to fetch latest remote changes (incorporating the new Physics Labs & WebApps admin export hub), verify Day 9 readiness for class, upgrade Day 10 (2026-09-11, "Constant Speed Mastery & Kinematic Synthesis Review") to an authentic CAST 3D Performance Task, and push to GitHub Pages.

**Key Changes**:
- **Remote Synchronization**: Fast-forwarded local workspace to `origin/main` (`2266dc5f`), including the admin data export tab.
- **Day 10 CAST 3D Performance Task**:
  - Upgraded Day 10 bell-ringer in `assets/lessons-data.js`, `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `Unit_2/outline.md` from generic free-response to a 3-step CAST 3D challenge (`cast_challenge`).
  - Phenomenon: Transit Telemetry & Sensor Monitoring Hub comparing commuter train distance, sprinter speed, and ultrasonic echo pulse transit time.
  - Part 1: Cloze dropdown diagnosing the three formula triangle rearrangements (`d = v · t`, `v = d / t`, `t = d / v`).
  - Part 2: Math calculation solving transit time for Scenario C (`680 m / 340 m/s = 2.0 s`).
  - Part 3: AI Reasoning Chat ("Defending the Why with AI Mentor") explaining how target unknowns and dimensional analysis verify formula selection.
- **Standards & Policy Compliance**:
  - Confirmed 100% compliance with `standards: ["HS-PS2-1"]` across all 129 lessons in `lessons-data.js`.
  - Confirmed zero LaTeX syntax violations across updated lessons and curriculum files.
- **Deployment**: Verified runtime execution and pushed cleanly to GitHub Pages (`origin/main`).

## 2026-09-09 — Admin Data Export: Physics Labs & WebApps Hub Integration

**Motivation**: Enabled teacher monitoring and gradebook CSV export for the Physics Speed Calculator and all upcoming multi-level interactive physics webapps in `admin/data_export.html`. Previously, `data_export.html` only queried `bellringers` and legacy `student_results`, leaving the `physics_labs` collection unviewable in the UI.

**Key Changes**:
- **Admin Hub UI (`admin/data_export.html`)**:
  - Added a dedicated 3rd mode tab: `🚀 Physics Labs & WebApps`.
  - Added live querying against the `physics_labs` Firestore collection, joining records with `roster/{studentId}` for student names and class periods.
  - Added period filter (Period 0 through 6), student search, and KPI metrics (Total records, Level 3 Mastered count, Active Learners count).
  - Added one-click Gradebook CSV export with student ID, name, period, level, score, percentage, and verification tokens.
- **Persistent Wiki Pattern**:
  - Updated `.agents/wiki/patterns/firebase-auth-gotchas.md` with guidelines on the `physics_labs` schema so that all future interactive student webapps automatically integrate into `admin/data_export.html`.

## 2026-09-08 — Daily Update: Day 8 (2026-09-09) CAST Bell-Ringer Upgrade & Remote Sync

**Motivation**: Executed the `/daily-update` workflow to fetch latest remote commits (including PRIDE Time streak fixes and outline sync), prepare tomorrow's lesson (Day 8: 2026-09-09, "The Speed Equation: Calculating Speed & Solving for Distance"), upgrade its daily bell-ringer to an authentic CAST 3D Performance Task with pop-out Desmos Calculator integration, and deploy to GitHub Pages.

**Key Changes**:
- **Remote Synchronization**: Pulled latest commits (`7e7e51af`) incorporating PRIDE Time streak tracking and outline alignment.
- **Day 8 CAST 3D Bell-Ringer**:
  - Upgraded Day 8 bell-ringer in `assets/lessons-data.js`, `Unit_2/unit2_lessons.json`, and `Unit_2/lesson.json` from generic free-response to full CAST 3D performance task (`cast_challenge`).
  - Phenomenon: Track Athlete Constant-Speed Training Run (`v = 3.0 m/s`, `t = 12.0 s`).
  - Part 1: Cloze dropdown identifying formula rearrangement ($d = v \cdot t$) and unit cancellation ($(\text{m/s}) \cdot \text{s} = \text{m}$).
  - Part 2: Math calculation validating $36.0\text{ m}$ (tolerance $0.5$) with instant access to the pop-out Desmos Scientific Calculator.
  - Part 3: AI Reasoning Chat ("Defending the Why with AI Mentor") with low-bar/high-ceiling prompt probing why speed times time yields distance.
- **Standards & No-LaTeX Compliance**: Verified 100% compliance with `standards: ["HS-PS2-1"]` across all lessons and confirmed zero LaTeX notation.
- **Validation & Deployment**: Tested runtime evaluation of all lesson data files and pushed cleanly to GitHub Pages (`origin/main`).

## 2026-09-08 — Daily Update: Week 2 Bell-Ringers & Pacing Synchronization

**Motivation**: Executed the `/daily-update` workflow to synchronize local workspace with GitHub remote, verifying NGSS alignment (`HS-PS2-1`), No-LaTeX compliance, and full alignment between `assets/lessons-data.js` and `Unit_2/outline.md` for Day 7 (Wind-Up Toy Speed Lab Wrap-Up & Intro to Speed) and the rest of Week 2.

**Key Changes**:
- **Synced Outline & Lessons Data**: Updated `Unit_2/outline.md` with explicit Bell-Ringer entries for Days 7–10, mirroring the AI Concept Chat and CAST challenge activities in `assets/lessons-data.js`.
- **Validation**: Verified syntax and schema across all 134 active lessons via Node.js runtime check.
- **Deployment**: Pushed verified changes cleanly to GitHub Pages (`origin/main`).

## 2026-09-08 — Desmos Scientific Calculator Pop-Out Integration

**Motivation**: Equipped students with the official California Science Test (CAST) standard Desmos Scientific Calculator as an accessible pop-out tool across both the Bell-Ringer student portal and the Unit 2 Dashboard. Students can now perform authentic calculations (distance, time, speed, balanced forces) alongside the phenomenon data without leaving the page.

**Key Changes**:
- **Desmos API Integration**: Loaded official Desmos Scientific Calculator API (`v1.9`) with public API key across `Bell-Ringer/index.html` and `unit2-dashboard.html`.
- **Slide-Over Drawer**: Built high-performance slide-over drawer (`#desmos-calculator-drawer`) with smooth slide transitions (`translate-x-full` -> `translate-x-0`), lazy initialization, and automatic resize recalculation (`desmosCalculatorInstance.resize()`). Includes clear button and Escape key dismiss.
- **Copy / Autofill Helper**: Added a "📋 Copy Result" button that reads the calculated value from Desmos and automatically fills the active `#cast-math-input` field with event dispatch.
- **Contextual In-Problem Access**: In `assets/js/cast-item-engine.js` (`renderMathData`), added a direct `"🧮 Calculator"` button next to the input field so students can open the calculator with one tap right where they need it.
- **Header & Floating Triggers**: Provided a persistent header button (`#btn-toggle-calculator`) and floating action button (FAB) at the bottom right.
- **Unit 2 Dashboard**: Added matching themed drawer and floating trigger to `unit2-dashboard.html` for studying kinematics formulas and velocity calculations.

## 2026-09-08 — Page Width Maximization: CAST Bell-Ringer & Unit 2 Dashboard

**Motivation**: Maximized horizontal viewport utilization across widescreen displays, desktop monitors, and Chromebooks. Replaced artificial `max-w-5xl` (1024px) constraints in the Bell-Ringer student interface and `max-w-7xl` (1280px) in the Unit 2 Dashboard with responsive fluid layouts utilizing 95%–98% of the viewport (up to 1780px).

**Key Changes**:
- **Bell-Ringer Student Interface (`Bell-Ringer/index.html`)**:
  - Upgraded `<main>` container padding to `p-2 sm:p-4 md:p-6 w-full`.
  - Expanded `#cast-panel` from `max-w-5xl` to `w-full max-w-[98%] xl:max-w-[95%] 2xl:max-w-[1780px] mx-auto flex flex-col gap-4 sm:gap-5`, eliminating large dark gutters and giving the 2-column grid (5 cols stimulus vs. 7 cols question/AI reasoning chat) full horizontal room.
  - Expanded `#bellringer-panel` from `max-w-5xl` to `w-full max-w-[98%] xl:max-w-[95%] 2xl:max-w-[1780px] mx-auto`.
  - Enlarged fullscreen modals (`#enlarged-image-modal` and `#enlarged-graph-modal`) from `max-w-4xl` / `max-w-5xl` to `max-w-6xl 2xl:max-w-7xl`.
  - Bumped script cache-buster to `cast-item-engine.js?v=2.4`.
- **Unit 2 Dashboard (`unit2-dashboard.html`)**:
  - Expanded `#app-container` from `max-w-7xl` to `w-full max-w-[98%] xl:max-w-[95%] 2xl:max-w-[1780px] mx-auto px-3 sm:px-6 lg:px-8 py-8 md:py-12`, allowing the 5-day weekly pacing guide cards and data visualizations to breathe comfortably.
- **Responsiveness**:
  - Preserved 100% mobile and tablet responsive layouts using Tailwind responsive prefixes.

## 2026-09-08 — Fix: Bell-Ringer Countdown Timer & NaN Timestamp Resolution

**Issue**: Countdown timer was frozen or not displaying countdown progress on `index.html` and `dashboard.html`.
**Cause**:
1. In `teacher.html`, `sanitizeForFirestore` was applied to the entire `timerPayload`, inadvertently converting the `firebase.firestore.FieldValue.serverTimestamp()` sentinel on `startedAt` into an empty plain object `{}`.
2. When students on `index.html` called `getTrueExpiresAt(config)`, checking `config.startedAt` caused `new Date({}).getTime()`, producing `NaN`. The function returned `Invalid Date`, freezing `diffMs` calculation.
**Solution**:
1. Scoped `sanitizeForFirestore` in `teacher.html` exclusively to `timerPayload.castData` (where nested arrays lived), leaving `startedAt: FieldValue.serverTimestamp()` and `timerExpiresAt` untouched.
2. Added sentinel guard `if (val instanceof firebase.firestore.FieldValue) return val` in `sanitizeForFirestore`.
3. Hardened `getTrueExpiresAt(config)` in both `index.html` and `dashboard.html` to prioritize valid `config.timerExpiresAt` timestamps first, and explicitly validate that `startedMs` is a real number before computing duration offsets.

## 2026-09-08 — CAST Bell-Ringers: Chat Box Expansion & Removal of Scripted Chips

**Motivation**: Promoted authentic student inquiry and scientific argumentation by removing pre-scripted response buttons. Expanded the chat workspace height to eliminate cramped conversation bubbles and give students a comfortable, unobstructed dialogue area with the AI Physics Mentor.

**Key Changes**:
- **Removed Scripted Quick Chips**: Removed all pre-written suggestion chips from `assets/js/cast-item-engine.js`, `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `assets/lessons-data.js`. Students now formulate and type their reasoning in their own authentic voice rather than clicking pre-selected responses.
- **Significantly Expanded Chat Box Height**: Increased chat box container from fixed `h-[380px]` to `min-h-[480px] h-[540px] sm:h-[600px]`, granting the message feed ample vertical space so multi-sentence explanations and thoughts display without awkward cut-offs or cramped overflow.
- **Enhanced Input Bar**: Padded input bar with `px-4 py-3` input field and clear gradient send button (`bg-gradient-to-r from-cyan-600 to-teal-600`).
- **Cache-Buster Bump**: Updated `Bell-Ringer/index.html` to `cast-item-engine.js?v=2.3` to guarantee immediate client updates.

## 2026-09-08 — Fix: Firestore Nested Array Restriction in `bellringer_timer`

**Issue**: Starting the timer from `teacher.html` threw: `Failed to start timer: Function DocumentReference.set() called with invalid data. Nested arrays are not supported (found in document system_config/bellringer_timer)`.
**Cause**: Google Cloud Firestore strictly prohibits nested arrays (arrays inside arrays). The new CAST `dataTable.rows` structure was defined as a 2D matrix (`[ ["a", "b"], ["c", "d"] ]`), which crashed Firestore upon calling `.set(timerPayload)`.
**Solution**:
1. Added `sanitizeForFirestore(val)` to `Bell-Ringer/teacher.html`: Recursively detects any array inside an array and automatically maps it to a Firestore-safe plain map with column keys (`{ col_0: cell0, col_1: cell1, ... }`).
2. Updated `assets/js/cast-item-engine.js`: The table renderer now transparently supports both array-of-arrays and Firestore map objects (`{ col_0: ... }`, `{ cols: [...] }`, `{ cells: [...] }`).
3. Converted all data tables in `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `assets/lessons-data.js` to natively Firestore-safe object maps, guaranteeing zero nested arrays.

## 2026-09-08 — CAST Bell-Ringers: UI Font Scale Upgrade, Stimulus Deduplication & Data Tables

**Motivation**: Addressed visual clutter, tiny font sizes, wordy prompts, and duplicate phenomenon text in the CAST Bell-Ringer interface. Converted redundant narrative text into structured CAST Data Tables and enlarged font sizes across all question elements.

**Key Changes**:
- **Fixed Stimulus Duplicate Bug**: Resolved issue where `renderStimulus()` in `assets/js/cast-item-engine.js` fell back to re-rendering `phenomenon.text` inside `#cast-stimulus-container`, causing an exact duplicate of the narrative box in the left panel.
- **Integrated Rich Data Tables**: Replaced wordy narrative text with clean, high-contrast CAST data tables (SEP-4 / SEP-5) across Unit 2:
  - Day 1: Survey Sector Position & Scale Log (`Base Camp (0,0)` vs `Survey Drone Alpha (8,0)`).
  - Day 3: Mars Rover Mission Route Telemetry (Leg 1 Outbound 120 m vs Leg 2 Return 120 m).
  - Day 9: Vehicle Transport Route & Speed Comparison (Aerial Drone Alpha 600 m @ 20 m/s vs Ground Rover Beta 800 m @ 20 m/s).
  - Day 15: Cruising Train Force Telemetry (20,000 N thrust vs resistive forces).
- **Major Typography & Font Scale Upgrade**:
  - Cloze reading passage: upgraded from `text-xs sm:text-sm` (12-14px) to `text-base sm:text-lg` (16-18px) with `leading-loose`.
  - Dropdown `<select>` menus: upgraded from `text-xs font-mono` to `text-sm sm:text-base font-sans font-semibold px-3 py-1.5` with rounded borders and clear hover/focus states.
  - Phenomenon narrative: upgraded from `text-xs` to `text-sm sm:text-base text-slate-200`.
  - Data calculation inputs: upgraded from `text-sm` to `text-base sm:text-lg font-bold`, with `text-sm sm:text-base` labels and verify button.
  - AI reasoning chat bubbles: upgraded from `text-xs` to `text-sm sm:text-base leading-relaxed`.
- **Eliminated Prompt Wordiness**: Tightened cloze prompts and text to direct students to the data tables rather than repeating numbers multiple times.


**Motivation**: Calibrated the Unit 2 CAST 3D bell-ringers to match where students actually are in the learning progression. Implemented an intentional "low bar, high ceiling" design ensuring that *every* student feels empowered to engage immediately without math anxiety or confusion, while advanced students are intellectually stretched through high-order thought experiments in the AI Concept Chat.

**Pedagogical Calibration**:
- **Low Bar / Accessible Entry Points**:
  - Replaced abstract vector root calculations (e.g. `sqrt(12² + 16²)`) on Day 1 with straight-line scale calculations (`8 blocks · 2.5 km/block = 20 km`), matching what students are drawing on their paper fantasy maps.
  - Used accessible, single-step arithmetic with clear units and targeted hints (e.g. Day 3 net displacement on a round trip is `0 m`; Day 5 Tumble Buggy speed is `5.0 m / 10.0 s = 0.5 m/s`; Day 9 drone flight time is `600 m / 20 m/s = 30 s`; Day 15 balanced resistive force is `20,000 N`).
  - Scaffolds vocabulary in Part 1 dropdowns with intuitive everyday language before moving to quantitative calculations.
- **High Ceiling / Advanced Reasoning Extension**:
  - Integrated dedicated `🚀 Advanced Challenge` suggestion chips into Part 3 for every bell-ringer, inviting advanced students to explore counter-factual physics, Pythagorean hypotenuse vectors, reverse motion graphs, and vacuum tunnel thought experiments.
  - Upgraded the AI Concept Chat system instructions in `Bell-Ringer/index.html` to actively differentiate: gently validating intuitive logic and pivoting to teaching for struggling students, while actively counter-challenging advanced students with deeper questions and non-trivial physics scenarios.
- **Data Synchronization**:
  - Synchronized updated bell-ringer definitions across `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `assets/lessons-data.js`.
  - Zero LaTeX math formatting used across all questions, prompts, and teacher keys.


## 2026-09-08 — CAST 3D Bell-Ringers: Interactive Student Tasks & AI Reasoning Chat Integration

**Motivation**: Connected CAST performance tasks directly to the interactive AI Concept Chat mentor. Rather than isolated or passive responses, students perform hands-on investigations (graph analysis, calculations with units and tolerances, cloze dropdowns), followed by a focused AI mentor dialogue probing the "WHY" behind their chosen answers and challenging their reasoning.

**Changes**:
- Upgraded `assets/js/cast-item-engine.js` (v2.0):
  - Added `renderAIReasoningChat` interactive SMS-style dialogue step with typing indicator, quick-thought suggestion chips, bi-directional messaging, and context-aware opening prompts.
  - Implemented `getAllAnswers()` to pass prior student choices and calculations to the AI mentor.
  - Added support for flexible dropdown tokens (`{key}` and `[key]`), blanks/dropdowns mapping, and math data calculation tolerance checking.
- Updated `Bell-Ringer/index.html`:
  - Connected `onChatSend` to `ensureChatProxyUrl()` passing the master AI mentor persona (`.agents/AGENTS.md`) and rich task context (phenomenon + student answers).
  - Configured automatic Firestore autosaving of reasoning chat messages to `bellringers/{studentId}_{todayStr}.chatMessages`.
  - Updated `submitCastChallenge` to include chat logs in readable summaries and save `castState`.
- Updated `Bell-Ringer/dashboard.html` & `Bell-Ringer/teacher.html`:
  - Enhanced student detail modal and submission tables to render conversational AI reasoning dialogue bubbles.
  - Added "📋 Copy Reasoning Transcript" button supporting both message schemas.
- Upgraded Unit 2 Lessons (Days 1, 3, 5, 9, 15) in `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `assets/lessons-data.js`:
  - Part 1: Hands-on cloze dropdown / graph / kinematic proportions.
  - Part 2: Quantitative calculation with units, hints, and tolerances.
  - Part 3: Active AI Reasoning Chat (`ai_reasoning_chat`) challenging the student to defend the "WHY" behind their answers.
- Maintained 100% strict compliance with the No-LaTeX math notation policy.

---

## 2026-09-08 — California Science Test (CAST) Bell-Ringer Transformation

**Motivation**: Transformed the classroom Bell-Ringer system to align with California Science Test (CAST) items and NGSS three-dimensional performance task expectations (DCIs, SEPs, CCCs, phenomena-based contexts, Technology-Enhanced Items, and Claim-Evidence-Reasoning scaffolding).

**Changes**:
- Created `assets/js/cast-item-engine.js`: Modular client-side CAST question engine supporting DCI/SEP/CCC badges, stimulus rendering (`CASTGraphEngine`, images, data tables), and multiple TEI formats (`cloze_dropdown`, `data_calculation` with numerical tolerances, `categorize`, and `cer` 3-box scaffolding).
- Updated `Bell-Ringer/index.html`: Integrated `cast-item-engine.js`, added `#cast-panel` full-width 2-column workspace, dynamic countdown timer integration, and structured Firebase submission logic.
- Updated `Bell-Ringer/teacher.html`: Added `cast_challenge` option to Workspace Mode dropdown, integrated `#cast-challenge-fields` with live 3D metadata preview, multi-step breakdown, editable JSON configuration, and student submission table rendering.
- Updated `Bell-Ringer/dashboard.html`: Added projected CAST 3D standard badges, phenomenon anchor passage, interactive graph mounting, and multi-step progress inspector in the student grading modal.
- Upgraded 5 core Unit 2 daily bell-ringers (Days 1, 3, 5, 9, 15) in `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `assets/lessons-data.js` to full CAST 3D performance tasks.
- Preserved 100% backward compatibility with existing bell-ringer types (`free_response`, `concept_chat`, `connections`) and verified strict adherence to the No-LaTeX math formatting policy.


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

---

## 2026-09-02 — Interactive Presentation: Describing Motion (Vectors, Scalars, Distance, & Displacement)

**Motivation**: Built an interactive 10-slide educational presentation and learning web application in `Unit_2/describing-motion-presentation/` based on the kinematics curriculum outline, strictly adhering to the repository's No-LaTeX policy and NGSS HS-PS2-1 standard.

**Changes**:
- Created `Unit_2/describing-motion-presentation/index.html`:
  - Slide 1: Title & Learning Objectives with interactive Hero vector drawing canvas and telemetry (distance, displacement, angle).
  - Slide 2: Scalars vs. Vectors definitions with interactive classification sorting lab (8 physical quantities).
  - Slide 3: Distance (The Scalar) with properties and interactive Winding Road Detour Simulator.
  - Slide 4: Displacement (The Vector) with straight-line vector overlay and origin-return slider.
  - Slide 5: Coordinate Reference Systems with worked example (+5m East then -3m West = +2m East) on an animated 1D number line.
  - Slide 6: Special Motion Cases comparing Round-Trip (400m oval track) and Unidirectional (400m straight dragstrip).
  - Slide 7: 2D Displacement Vectors with draggable Cartesian coordinate plane, component vectors (&Delta;x, &Delta;y), and Quadrant I–IV identifier.
  - Slide 8: Magnitude & Direction Calculations featuring Pythagorean & trig formulas, the 3m West & 4m South worked example (5m, 217°), and a custom vector calculator.
  - Slide 9: Master Comparison Matrix table and animated Delivery Van (Odometer) vs. GPS Drone (Displacement) simulation.
  - Slide 10: Interactive 4-lap audience check challenge with confetti celebration, detailed proof, and FAQ misconceptions drawer.
- Created `Unit_2/describing-motion-presentation/style.css`: Cosmic dark glassmorphism, responsive styling, print-friendly rules, and custom slider thumb glow.
- Created `Unit_2/describing-motion-presentation/presentation.js`:
  - Keyboard navigation controller (`ArrowRight`, `ArrowLeft`, `Space`, `Home`, `End`, `f`, `m`, `n`, `s`).
  - Web Audio API synthesizer for UI clicks, slide whooshes, and victory chords.
  - Dual Mode Switcher (Slideshow Mode vs. All-in-One Study Mode).
  - Collapsible Presenter Notes drawer with timing cues, key talking points, and check-for-understanding questions.
- Integrated into `unit2-dashboard.html` hero action row (`📽️ Vectors & Scalars Presentation ↗`).
- Updated `Unit_2/unit2_lessons.json` and `Unit_2/lesson.json` for Days 1 and 3.
- Created `patterns/interactive-presentation-deck.md` documenting architecture, features, and strict No-LaTeX conventions.

---

## 2026-09-03 — CAST Science Test Alignment & Productive Pedagogical Friction

**Motivation**: Preserved high-leverage pedagogical conclusions regarding student struggle with interactive physics webapps. Identified the essential distinction between productive pedagogical friction (reading analog measurement instruments, estimating decimal fractions, applying unit scale conversions, reasoning with reference frames) vs. interface friction (clutter, trackpad fatigue, modal confusion). Productive struggle is vital for student readiness on the California Science Test (CAST) performance tasks and life skills.

**Changes**:
- Created `patterns/cast-aligned-webapp-design.md`: Comprehensive pattern page breaking down pedagogical friction vs. interface friction, CAST performance task alignment matrix, optical loupe and crosshair implementation, tolerant validation (`±0.3–0.4 cm`) with targeted diagnostic hints, and sequential cognitive scaffolding (phase gating).
- Updated `wiki/index.md`: Cataloged `cast-aligned-webapp-design` with tags `CAST`, `webapp`, `pedagogy`, `measurement`, `NGSS`, `SEP3`, `SEP5`.
- Updated `.agents/AGENTS.md`: Enshrined `## 🎯 CAST Science Test Alignment & Productive Pedagogical Friction` as a permanent workspace rule loaded into every agent session prompt.
- Updated `.agent/workflows/create-student-webapp.md`: Added CAST alignment, authentic student measurement, and top-level Firestore parent document creation to the mandatory pre-development checklist.

---

## 2026-09-04 — Wind-Up Toy Speed Lab: Precision Stopwatch, Outlier Detection & CAST Bar Charting

**Motivation**: Created an authentic student lab web application (`Unit_2/wind_up_toy_lab/`) for timing various wind-up toys traveling a fixed 20.0 cm distance across 3 replications, detecting timing outliers (>25% from median), scaffolding mean time and speed calculations with embedded Desmos Scientific Calculator, plotting results with `CASTGraphEngine`, and writing CER statements with quantitative data citations.

**Changes**:
- Created `Unit_2/wind_up_toy_lab/`:
  - `index.html`: 6-step guided wizard layout, Google Auth (`@orangeusd.org`), embedded digital stopwatch banner, quality control checklist for each run, Desmos drawer, CAST Bar Chart container, CER studio, and celebratory completion modal.
  - `style.css`: Cosmic dark glassmorphism, digital LED timer font and glow, `@keyframes outlierPulse` highlight animation for trials deviating >25% from median, and mobile responsiveness.
  - `js/sound_fx.js`: Web Audio API sound synthesizer for clicks, stopwatch start/stop, outlier alerts, and victory fanfare.
  - `js/stopwatch.js`: High-precision timer (`performance.now()`), Spacebar keyboard shortcut, tabular hundredths formatting, and trial bridge.
  - `js/auth_manager.js`: Firebase Google Auth with `@orangeusd.org` domain restriction and Firestore persistence (`student_results/Wind_Up_Toy_Speed_Lab/students/{studentId}`).
  - `js/lab_engine.js`: Step navigation, 3-toy replication manager, trial data bridge, quality assurance checks, outlier detection algorithm, scaffolded average verification, scaffolded speed verification ($v = d/t_{avg}$), `CASTGraphEngine` bar chart instantiation, and CER validation.
- Updated `admin/data_export.html`: Registered `"Wind_Up_Toy_Speed_Lab"` in `nestedAssignments` for teacher gradebook and dataset exports.
- Updated `unit2-dashboard.html`: Added hero launcher button (`🏎️ Wind-Up Toy Speed Lab ↗`).
- Updated curriculum lesson files: Linked `"Wind-Up Toy Speed Lab"` on Day 5 (`2026-09-04`) in `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `assets/lessons-data.js`.
- Adhered strictly to No-LaTeX policy (used plain text formulas and Unicode `Δ`, `v = d / t`, `t_avg`) and Productive Pedagogical Friction rules (calculator scaffolding without auto-completing student math).

---

## 2026-09-04 — Calculator Visibility & Plain-Language Math Scaffolding

**Motivation**: Students found modal backdrop blurring (`backdrop-blur-sm`) obstructed their ability to see their recorded trial numbers while entering values into the Desmos calculator. Furthermore, algebraic notation like $t_{avg} = (t_1 + t_2 + t_3) / 3$ and $v = d / t_{avg}$ presented unnecessary abstract cognitive load for 9th-grade physical science students.

**Changes**:
- Removed all modal backdrop overlays and background blurring (`#calculator-backdrop` / `backdrop-blur-sm`).
- Implemented responsive side-by-side workspace shifting (`body.calc-open main`) for tablets, Chromebooks, and desktops (`>= 768px`), ensuring main data cards remain 100% visible and interactive while calculating.
- Added live `#calculator-toy-pills` inside the Desmos drawer pinned directly above the keypad, displaying the active toy's times and the exact expression to type.
- Replaced abstract algebraic formulas across Step 2 (Averaging), Step 3 (Speed), and Step 5 (CER Reasoning) with plain English:
  - *"Step 1: Add your 3 times together. Step 2: Divide that total by 3."*
  - *"Speed tells you how many centimeters the toy traveled each second. Divide the 20.0 cm track distance by your average time."*
- Added targeted formative math diagnostics in `lab_engine.js`:
  - Order-of-operations warning when parentheses are omitted (e.g. `t1 + t2 + (t3 / 3)`).
  - Friendly prompt when a student adds all 3 numbers but forgets to divide by 3.
  - Divided-by-2 check (reminding students there are 3 trials).
  - Inverted speed division check (warning when time is divided by distance instead of distance by time).

---

## 2026-09-04 — Light Theme by Default for Low-Brightness Laptop Visibility

**Motivation**: High school students frequently dial laptop and Chromebook screen brightness down to 15%–30% to conserve battery or dim their screens in class. Dark glassmorphic themes become muddy and illegible under low backlit TN/IPS LCD conditions. A high-contrast light theme ensures crisp, effortless visibility across all steps.

**Changes**:
- Configured Light Theme as the primary default across `style.css`, `index.html`, and `lab_engine.js`.
- Implemented high-contrast pure white card surfaces (`#ffffff`) with `#cbd5e1` defined borders and deep slate primary text (`#0f172a`, WCAG AAA 15:1+ contrast ratio).
- Retained authentic digital stopwatch LED display in deep navy casing (`#090e1a`) with luminous cyan digits (`#38bdf8`), maximizing timer visibility in both bright and dim lighting.
- Set light-tinted instructional guidance boxes (Sky 50 `#f0f9ff` for Averaging; Emerald 50 `#ecfdf5` for Speed; Purple 50 `#faf5ff` for Desmos reference).
- Added header theme toggle button (`☀️` / `🌙`) with local storage persistence (`wind_up_lab_theme`), allowing optional switching to dark mode while always defaulting new visitors to light mode.
- Integrated dynamic `CASTGraphEngine` theme synchronization (`theme: isDark ? "dark" : "light"`).

---

## 2026-09-04 — Dual-Theme Parity: Full Restoration of Original Cosmic Dark Colorway

**Motivation**: After introducing the light theme default, dark mode was left broken due to hardcoded light utility classes (`bg-white`, `text-slate-900`, `border-slate-200`) overriding CSS variable cascades. Dark mode now 100% mirrors the original cosmic aesthetic when toggled, while light theme remains the crisp, high-contrast default.

**Changes**:
- Configured Tailwind CSS via `tailwind.config = { darkMode: 'class' };` in `Unit_2/wind_up_toy_lab/index.html`.
- Updated `window.setTheme` in `index.html` to toggle `'dark'` on `document.documentElement`, ensuring all `dark:` utility variants activate cleanly.
- Updated all UI cards, headers, buttons, inputs, stepper pills, slide-over drawer, and modal elements with paired light/dark classes (`dark:bg-slate-950/85`, `dark:text-white`, `dark:border-white/10`, `dark:bg-slate-900`, `dark:text-sky-200`, `dark:text-emerald-300`, `dark:text-purple-300`, etc.), perfectly restoring the exact `a578e6bc` cosmic colorway.
- Updated `js/lab_engine.js` template generators (`renderStep1DataCollection`, `renderStep2Averages`, `renderStep3Speeds`, `updateCalculatorNumbers`) to render paired dark classes and dynamically re-render on theme toggle.
- Ensured `CASTGraphEngine` checks `document.documentElement.classList.contains('dark')` to re-plot the comparative speed bar chart with glowing cyan bars (`#38bdf8`) on deep slate axes when dark mode is enabled.

---

## 2026-09-04 — Teacher-Restricted Demo Autofill & Interface Streamlining

**Motivation**: The "Demo Autofill" button is a convenient tool for teacher classroom demonstrations and projection setups, but presents an academic integrity risk if exposed to students. Additionally, removing external navigation arrows keeps student focus contained within the lab activity.

**Changes**:
- Removed the dashboard return link arrow (`&larr; Unit 2`) from the lab header in `index.html`.
- Updated calculator icons from abacus emojis (`🧮`) to standard calculator SVGs throughout the header, steps, drawer, and script sync.
- Added `isTeacher()` check to `js/auth_manager.js` identifying `rmudry@orangeusd.org` (and personal fallback `ryan.mudry@gmail.com`).
- Updated `js/lab_engine.js` so the "Demo Autofill" button is only rendered in the DOM if `window.labAuth.isTeacher()` evaluates to true.
- Added guard within `prefillSampleData()` preventing execution if invoked directly via developer console by a student account.
- Triggered dynamic re-render of Step 1 on auth state changes so the button appears immediately upon teacher login and disappears upon sign-out.

---

## 2026-09-05 — Touchscreen Math Facts Sprint & Open Firestore Leaderboard

**Motivation**: Created an interactive math facts fluency game in `math-facts/index.html` designed for 6th graders to practice and master multiplication facts with touchscreen compatibility, speed & consistency multipliers, and a live Cloud Firestore leaderboard without requiring school Google accounts.

**Changes**:
- Created `math-facts/index.html`: Fully interactive, touchscreen-optimized multiplication facts sprint with Web Audio synth sound effects, confetti animations, tactile virtual numpad with instant auto-advance on correct answers, physical keyboard support, and 4 game modes (60s Blitz, 100-Fact Sprint, Streak Survival, and Targeted Table Focus).
- Integrated Cloud Firestore backend under `student_results/math_facts_leaderboard/students` allowing unauthenticated player nickname progress recording and real-time top-rank podium leaderboard queries with highest-score retention and offline `localStorage` fallback.
- Added featured card for "⚡ Math Facts Sprint" to `games.html`.
- Created automated test suite in `tests/test_math_facts.js` validating touch tap emulation, virtual keypad entry, auto-advance, speed/streak multipliers, and leaderboard rendering.
- Created `wiki/patterns/touch-math-facts-engine.md` and updated `wiki/index.md`.

---

## 2026-09-05 — Mobile-Optimized Zero-Scroll Phone Format for Math Facts Sprint

**Motivation**: Added a dedicated mobile-optimized phone format option for smartphones (tested on iPhone SE 375×667 through iPhone 14/15 390×844) to provide a zero-scroll, thumb-friendly ergonomic layout that eliminates address bar clipping and scrolling during rapid multiplication sprints.

**Changes**:
- Added `.phone-mode` CSS suite in `math-facts/index.html` using `100dvh`, compact arena HUD, zero margins, and thumb-friendly `clamp(46px, 8vh, 58px)` numpad buttons with `touch-action: manipulation;`.
- Placed toggle triggers in both the global header (`#phone-mode-btn` 📱) and at the top of the welcome card (`#phone-format-toggle-chip` pill badge).
- Added automatic device detection (`window.innerWidth <= 640 || ('ontouchstart' in window && window.innerWidth <= 768)`) with `localStorage` persistence (`math_facts_phone_mode`).
- Created `tests/test_math_facts_mobile.js` verifying mobile viewport auto-detection, header/chip toggle synchronization, localStorage persistence, and 0px vertical scrolling (`window.scrollY === 0`) on phone viewports.
- Updated `wiki/patterns/touch-math-facts-engine.md` with Section 5 (Mobile-Optimized Zero-Scroll Phone Format).

---

## 2026-09-05 — Replaced Public Leaderboard with Personal Bests & Career Stats

**Motivation**: Removed the competitive public multiplayer leaderboard in favor of an individual growth-mindset "Personal Bests & Career Stats" system to eliminate social comparison anxiety while giving students visual progress milestones, personal records, and celebration banners.

**Changes**:
- Removed Cloud Firestore backend queries and external Firebase SDK scripts from `math-facts/index.html`.
- Implemented client-side Personal Bests engine in `localStorage` (`getRecordsStorageKey`, `getPersonalBests`, `savePersonalBests`, `recordGameRun`), partitioning records by player name.
- Added Personal Bests dashboard modal (`#view-records`) featuring:
  - Milestone cards (Career Facts Solved, All-Time Longest Streak, Sprints Played).
  - Mode records breakdown tabs (High Score, Most Solved in 60s, Best Streak, Best Accuracy, Fastest Average Speed, Date Achieved).
  - Chronological Recent Sprints Activity Log.
- Added animated "🌟 NEW PERSONAL BEST!" celebration banner on the results screen with baseline/differential score callouts and fanfare chimes.
- Added quick Personal Bests summary card on the Welcome screen.
- Replaced header `🏆 Leaderboard` button with `⭐ Personal Bests`.
- Updated `games.html` card description to reflect personal bests tracking.
---

## 2026-09-05 — Mario Kart Course Starring Badge System for Table Focus Drills

**Motivation**: Added a 1-, 2-, and 3-star badge system (`★`, `★★`, `★★★`) modeled after Mario Kart's course and cup mastery system to the "Focus on a Single Table" options (`2s` through `12s`), providing rewarding visual progression as players master individual multiplication tables.

**Changes**:
- Updated table focus pills (`2s` through `12s`) in `math-facts/index.html` to render individual 3-star indicators directly on each pill (`.pill-stars`), displaying earned gold stars (`#fbbf24`) with glow and faint unearned stars (`☆`).
- Added total course mastery counter (`⭐ 0 / 33 Stars`) in the focus filter section header that updates in real-time and turns into a celebratory `🏆 ALL 33 STARS MASTERED!` badge upon full completion.
- Implemented `calculateTableStars(run)` evaluating round accuracy, volume of facts solved, speed, and score to award 1 Star (Competent), 2 Stars (Proficient), or 3 Stars (Grand Master).
- Implemented monotonic rank upgrades: stars are permanently saved in player's `localStorage` profile and never downgrade.
- Added animated Results screen banner (`#table-star-banner`) announcing star rank unlocks and upgrades with fanfare sound effects and confetti bursts.
- Added Focus Table Mastery grid card to the Personal Bests modal (`#view-records`), showing all 11 tables with star ratings and a total star counter.
- Created `tests/test_math_facts_stars.js` E2E test verifying single-table fact generation, star evaluation, result banner activation, personal bests table grid, and welcome screen badge updates. All test suites pass 100%.
- Updated `wiki/patterns/touch-math-facts-engine.md` with Section 6 (Mario Kart Course Starring Badge System).

---

## 2026-09-07 — 4-Day Constant Speed Instructional Arc & Practice Suite

**Motivation**: Realigned the 4-day post-Labor Day week (Days 7–10, Sept 8–11) to explicitly teach, practice, and master constant speed calculations ($v = d / t$, $d = v · t$, $t = d / v$) connecting directly to empirical data from the Wind-Up Toy Speed Lab.

**Changes**:
- Created `Unit_2/speed_distance_time_app/`: Interactive student webapp featuring:
  - SVG Formula Triangle Explorer ($d$ over $v \cdot t$) with click-to-reveal equation derivations.
  - Live Canvas Motion Simulator with custom distance/speed sliders, animated runner/toy car, odometer track, and real-time elapsed timer.
  - 4-Tier Leveled GUESS Problem Solving Studio (Tier 1: Speed, Tier 2: Distance, Tier 3: Time, Tier 4: Mixed Master Challenge).
  - Target diagnostic hints addressing common inversions and unit omissions.
  - Printable Certificate of Kinematic Mastery upon achieving 5-streak or finishing Tier 4.
  - Symlinked root `speed_distance_time_app/` for convenience.
- Created `Unit_2/constant-speed-presentation/`: Interactive 10-slide presentation deck:
  - Dual-mode (Fullscreen Lecture Slideshow vs. Scrollable Student Study Mode).
  - Collapsible Presenter Notes drawer with talking points and pacing cues.
  - Web Audio API synthesizer for transitions, clicks, and chimes.
  - Interactive Audience Check (Slide 9) with instant vote card feedback.
  - Symlinked root `constant-speed-presentation/` for convenience.
- Updated `Unit_2/outline.md`: Aligned Week 2 (Days 7–10) with detailed pedagogical goals, essential questions, and resource links.
- Updated `Unit_2/lesson.json` & `Unit_2/unit2_lessons.json`: Synchronized Days 7–10 lesson objects with explicit NGSS `HS-PS2-1` alignment and daily bell-ringers.
- Updated `assets/lessons-data.js`: Aligned Days 7–10 across site-wide lesson data.
- Updated `unit2-dashboard.html`: Added quick-access hero cards for Speed Studio and Constant Speed Slide Deck.
- Strict No-LaTeX compliance verified across all files.

---

## 2026-09-07 — Classroom TV 25-Foot Legibility & Projection Scaling for Constant Speed Deck

**Motivation**: Teacher identified that default slide typography and standard container constraints (`1150px`) rendered text unreadable from 25 feet away on dual classroom TVs.

**Changes**:
- Updated `Unit_2/constant-speed-presentation/style.css`:
  - Expanded slide stage constraint to widescreen `min(1560px, 94vw)` to eliminate empty black bars on 16:9 1080p/4K TVs.
  - Implemented responsive fluid typography: Slide titles (`clamp(2.4rem, 3.4vw, 3.8rem)`), body & bullet points (`clamp(1.35rem, 1.6vw, 1.75rem)`), formulas (`clamp(4.2rem, 5.8vw, 6.2rem)` with glowing text-shadow).
  - Upgraded contrast with pure `#ffffff` and `#f1f5f9` against dark slate cards.
  - Added `.tv-mode` boost (`--font-scale: 1.18`, width `min(1760px, 96vw)`) with persistent `localStorage` preference.
  - Redesigned 5-card GUESS grid and 3-card real-world grid with prominent step badges.
  - Added Fullscreen optimizations for browser projection without OS/tab bars.
- Updated `Unit_2/constant-speed-presentation/index.html`:
  - Streamlined paragraphs into punchy, high-impact bulleted lists (`.slide-list`).
  - Scaled Formula Triangle SVG (`viewBox="0 0 360 310"`, font sizes `48px`, stroke `4px`, color-coded partitions).
  - Added top navbar controls: `📺 TV Mode`, `A-` / `A+` font zoom, and `⛶ Fullscreen` toggle.
  - Redesigned Audience Check vote cards with 48px circular badges (`A`, `B`, `C`, `D`) and `1.5rem` options.
- Updated `Unit_2/constant-speed-presentation/presentation.js`:
  - Added TV mode toggle, font zooming (`--font-scale`), Fullscreen API integration, and hotkeys (`T`, `F`, `+`, `-`, `0`).
- Updated `wiki/patterns/interactive-presentation-deck.md` with Section 5 (Classroom TV Projection & 25-Foot Legibility Standards).

---

## 2026-09-07 — Replaced Awkward Study Mode with Printable Student Guided Notes Handout

**Motivation**: The vertically scrolling "Study Mode" was confusing and did not fit classroom lecture dynamics. Replaced it with a dedicated printable student guided notes and problem-solving reference sheet optimized for physical interactive notebooks and PDF export.

**Changes**:
- Replaced `#btnStudyMode` with `📄 Student Handout` (`#btnHandout`) in `Unit_2/constant-speed-presentation/index.html`.
- Created `#handoutModal` and `.handout-sheet` formatted for 8.5" × 11" paper:
  - Student header line (Name, Date, Period).
  - Core concepts (scalar rate, constant speed, standard units table).
  - Formula triangle diagram with derivations for $v = d / t$, $d = v · t$, $t = d / v$.
  - 5-step GUESS protocol reference grid.
  - 3 guided class practice problems with step-by-step GUESS scaffolding.
- Added clean `@media print` CSS rules in `style.css` suppressing deck controls and isolating the handout sheet for crisp black-and-white printing.
- Added modal event handlers, backdrop dismissal, `window.print()` trigger, and hotkey `H` in `presentation.js`.
- Updated `wiki/patterns/interactive-presentation-deck.md` (Item 4).

---

## 2026-09-07 — Resolution of Root vs Unit_2 Displacement and Distance App Symlink Duplication

**Motivation**: Clarified duplicate directory structure between `Unit_2/Displacement_and_distance_map_app/` (canonical app) and root `displacement_and_distance_maps_app/` (prior symlinks). Root symlinks caused confusing duplicate listings in IDEs and broken relative back-navigation (`../../unit2-dashboard.html`).

**Changes**:
- Removed file symlinks (`index.html`, `js`, `style.css`) from `displacement_and_distance_maps_app/`.
- Replaced `displacement_and_distance_maps_app/index.html` with an instant `<meta http-equiv="refresh">` and `window.location.replace` redirect targeting `../Unit_2/Displacement_and_distance_map_app/index.html`.
- Preserved `Unit_2/Displacement_and_distance_map_app/` as the single canonical source of truth linked across `unit2-dashboard.html`, `lessons-data.js`, and `unit2_lessons.json`.

---

## 2026-09-07 — Physics Speed Calculator: Mandatory Desmos Integration & One-Click Result Paste

**Motivation**: Required students to use the embedded Desmos scientific calculator for calculating numerical values on Level 2 & 3, auto-expanding the calculator sidebar and adding a one-click paste button to transfer results into the answer input.

**Changes**:
- Integrated official Desmos Scientific Calculator API (`https://www.desmos.com/api/v1.9/calculator.js?apiKey=...`) replacing the previous static iframe.
- Updated `physics_speed_calculator/dist/index.html`:
  - Automatically expands the Desmos calculator sidebar on Level 2 & Level 3 in `changeLevel` and `loadQuestion`.
  - Added real-time Desmos state observer (`desmosCalculator.observeEvent('change', ...)`) and expression evaluation supporting LaTeX fractions, products, scientific notation, and roots.
  - Added one-click "Paste from Desmos" buttons in both the calculation telemetry panel and the Desmos header/footer to paste the evaluated number into the student answer box with sound and telemetry feedback.
  - Enforced mandatory Desmos calculation check in `checkCurrentAnswer`: students cannot submit answers on Level 2 & 3 without performing the calculation in Desmos.
  - Preserved strict No-LaTeX syntax in student UI and feedback messages.

---

## 2026-09-07 — Physics Speed Calculator: Firestore Progress Persistence & Completion Certificate

**Motivation**: Persist student progress in Firestore across sessions so students resume where they left off, replace legacy QR code turn-in modal with a formal Completion Certificate of Kinematic Mastery, and provide clear visual confirmation of automated gradebook recording.

**Changes**:
- Updated `physics_speed_calculator/dist/index.html`:
  - **State Persistence in Firestore (`saveState` / `loadProgressFromFirestore`)**:
    - Persisted `currentLevel`, `unlockedLevels`, `answered`, `streak`, `score`, `highScore`, `completed`, `completedAt`, and `certificateId` to `/physics_labs/{studentId}` on each question answered and level unlocked.
    - Updated `loadProgressFromFirestore` and `hudInitialize` to resume the student's saved level and progress without wiping counters.
  - **Real-Time HUD Telemetry**:
    - Added `#hud-cloud-status` badge indicating "Saving...", "Auto-Saved", or "Sync Offline".
    - Added `#btn-view-cert` ("🏆 View Certificate") button in the HUD header once Level 3 has been completed.
  - **Completion Certificate of Kinematic Mastery**:
    - Replaced the legacy QR code modal with a Certificate of Kinematic Mastery featuring student name, account ID, final score, completion date, and verification token.
    - Added an emerald confirmation callout: *"Score Automatically Saved to Teacher Gradebook (CONFIRMED ✓) — Your results have been automatically recorded in Firestore. No QR code, screenshot, or manual turn-in is required!"*
    - Added a Print / Save PDF action (`window.print()`) with print-optimized CSS rules.
    - Removed unused `qrcodejs` CDN dependency.

---

## 2026-09-07 — Unit Dashboard Pacing & Modal Clarification: Graded Coursework vs. Learning Resources

**Motivation**: Resolve student and teacher confusion on unit dashboards between reference resources for learning (slide decks, guided notes, reading handouts) and assignments that will be collected or graded. Ensure crystal clarity on the lesson calendar cards, in absent makeup modules, and within the daily lesson modal drawer.

**Changes**:
- **Link Classifier Engine (`assets/lessons-data.js`)**:
  - Implemented `categorizeLessonLinks(day)` with dual export (`window.categorizeLessonLinks` for browser and `module.exports` for Node).
  - Automatically segments lesson materials into 3 visual tiers:
    1. `assignments`: Graded deliverables requiring submission or automated cloud score saving.
    2. `resources`: Lesson slide decks, lecture notes, formula sheets (`NO TURN-IN NEEDED`).
    3. `practice`: Ungraded sandbox tools, PhET simulations, formative practice.
  - Full backwards compatibility with legacy flat `links: { "Label": "url" }` objects via robust keyword & URL regex classification, while supporting explicit structured schema objects (`assignments: []`, `resources: []`, `practice: []`).
- **Unit 2 Data Refinements (`assets/lessons-data.js` & `Unit_2/unit2_lessons.json`)**:
  - Synchronized structured assignments across Days 4, 7, 8, 9, 10, 23 (e.g. Day 4 Fantasy Map Quest challenge, Day 7 Physics Speed Calculator with `Cloud Auto-Saved ✓` status).
- **Unit Dashboard (`unit2-dashboard.html`)**:
  - Pacing calendar grid cards now display at-a-glance header badges: `📝 GRADED WORK`, `📖 LESSON & NOTES`, or `🧪 PRACTICE`.
  - Expanded detail modal drawer (`openLessonModal`) to `max-w-3xl` with custom scrolling (`max-h-[70vh]`).
  - Added `renderCategorizedLinksHtml(day)` producing distinct visual tiers:
    - Amber/gold bordered cards with `SUBMISSION REQUIRED` badge and submission method tags.
    - Slate/indigo bordered cards with `STUDY & REFERENCE ONLY · NO TURN-IN NEEDED` badge.
    - Cyan/teal bordered cards with `OPTIONAL · UNGRADED` badge.
- **Absent Student Makeup Module (`missing-work.html`)**:
  - Updated absent student assignment inspector to display separate labeled containers for Graded Work, Learning Slides/Notes, and Ungraded Practice.
- **Documentation**:
  - Updated `wiki/patterns/dashboard-layout.md` and `wiki/index.md`.

---

## 2026-09-07 — Resolution of Missing Work Date Collisions (Pruning Unit 1 Days 9–13)

**Motivation**: On `missing-work.html`, searching for dates covering early September caused an out-of-order sequence (Day 5 -> Day 13 -> Day 6). This was caused by overlapping dates between active Unit 2 lessons and obsolete placeholder draft lessons in Unit 1 (Days 9–13).

**Changes**:
- **Pruned Days 9–13 of Unit 1**:
  - Removed phantom draft Days 9–13 from `Unit_1_Introduction/unit1_lessons.json` and `assets/lessons-data.js`. Unit 1 now cleanly concludes with Day 8 (*The Measurement Olympics* on Aug 28), resolving all calendar date overlap with Unit 2 (which starts Aug 31).
- **Missing Work Tool Enhancements (`missing-work.html`)**:
  - Added a prominent `Unit {lesson.unit}` badge to every lesson card date banner.
  - Added an optional Unit Filter dropdown (`All Units`, `Unit 1: Foundations`, `Unit 2: Kinematics`).
  - Added multi-tier sorting: `date` ascending, followed by `unit` and `day` tie-breaking.

---

## 2026-09-07 — Unit 1 Day 7: Emoji Finger Painting Studio Classified as Required Assignment

**Motivation**: Explicitly classify the Emoji Finger Painting Studio on Day 7 of Unit 1 as a required graded lab project across `Unit_1_Introduction/unit1_lessons.json`, `assets/lessons-data.js`, `unit1-dashboard.html`, and `missing-work.html`.

**Changes**:
- Configured explicit `assignments` entry for Day 7: `Emoji Finger Painting Studio (Accuracy & Precision Project)` with `submission: "Export & Turn In Gallery Poster"`.
- Separated `The Quality of Measurement (Slides)` into the `resources` tier (`STUDY & REFERENCE ONLY`).
- Updated `categorizeLessonLinks` heuristics to recognize `accuracy-precision-art` and `emoji finger painting` as graded assignments.
- Updated `unit1-dashboard.html` with pacing grid badge (`📝 GRADED WORK`), widened detail modal dialog (`max-w-3xl`), and 3-tier categorized link rendering.

---

## 2026-09-07 — Unit 1 Day 8: Unit Conversion Practice Classified as Required Assignment

**Motivation**: Explicitly designate Unit Conversion Practice on Unit 1 Day 8 (*The Measurement Olympics (Unit 1 Finale)*) as a required practice assignment across `Unit_1_Introduction/unit1_lessons.json`, `assets/lessons-data.js`, `unit1-dashboard.html`, and `missing-work.html`.

**Changes**:
- Configured explicit `assignments` array for Day 8 with `Unit Conversion Practice` (`unit-conversion-practice/index.html`), `typeLabel: "Required Practice Assignment"`, and `submission: "Cloud Auto-Saved ✓"`.
- Kept `Printable Team Scorecard` in `resources` tier and `Measurement Olympics Leaderboard` in `practice` tier.
- Updated `categorizeLessonLinks` heuristic in `assets/lessons-data.js` to automatically classify `unit-conversion-practice` and `unit conversion` links as required assignments.

---

## 2026-09-07 — Unit 2 Days 1–4: Fantasy Map Worksheet Classified as Required Assignment

**Motivation**: Explicitly designate the Fantasy Map Worksheet across Unit 2 Days 1–4 as a required project assignment to be completed and turned in, ensuring it displays with glowing amber badges on `unit2-dashboard.html` and appears under required assignments on `missing-work.html`.

**Changes**:
- **Curriculum Lessons Data Sync**: Updated `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, and `assets/lessons-data.js` across Days 1–4:
  - Days 1–3: Configured explicit `assignments` arrays with `Fantasy Map Worksheet`, `typeLabel: "Required Project Worksheet"`, and `submission: "Turn In Completed Map & Handout"`. Kept classroom slide decks and lore documents in `resources` tier (`STUDY & REFERENCE ONLY`) and map app in `practice` tier (`OPTIONAL · UNGRADED`).
  - Day 4: Moved `Fantasy Map Analysis Worksheet` into `assignments` alongside the digital `Fantasy Map Quest Web App Challenge`.
- **Global Link Categorization Heuristics (`assets/lessons-data.js`)**:
  - Updated `categorizeLessonLinks` to recognize `fantasy map worksheet` and `worksheet` links as assignments.
  - Refined precedence so that worksheets or assignments hosted on OneDrive (`sharepoint.com`) or Google Docs are never demoted into `isResource`.

---

## 2026-09-08 — PRIDE Time: Thursday to Tuesday Attendance & Streak Tracker Fix

**Motivation**: Fixed an issue in the PRIDE Time Attendance & Behavior Tracker (`pride-time/pride-app.js`) where consecutive attendance streaks reset across the gap between Thursday and the following Tuesday (since PRIDE Time only runs on Tuesdays, Wednesdays, and Thursdays).

**Changes**:
- **Dynamic PRIDE Days Filtering**: Updated `AttendanceEngine.getConsecutiveStreak` in `pride-time/pride-app.js` to filter past attendance session dates against `State.settings.prideDays` (`['Tuesday', 'Wednesday', 'Thursday']`). Non-PRIDE days (Mondays, Fridays, Weekends) present in Firestore or local storage are excluded from consecutive streak evaluation.
- **Thursday-to-Tuesday Continuity**: Thursday's session and the following Tuesday's session are now correctly treated as adjacent, consecutive PRIDE Time sessions. A student attending Tue, Wed, Thu of week 1 who scans on Tue of week 2 is accurately flagged for 3 consecutive sessions in a row.
- **Dynamic Settings Fallback**: Updated `getPastPrideDates` and `updatePrideDayBanner` to dynamically respect `State.settings.prideDays` with safe fallback. 
---

## 2026-09-12 — Unit 2 Bell-Ringer Telemetry Audit & Executive PDF Report

**Motivation**: Conducted a comprehensive telemetry and safety audit of all student interactions across Unit 2 Bell-Ringers (Days 1–10: 2026-08-31 to 2026-09-11) and generated a professional, publication-grade 5-page PDF report (`admin/reports/Unit_2_Bell_Ringer_Audit_Report.pdf`) and standalone HTML report.

**Key Findings & Audit Results**:
- **Dataset Scope**: Analyzed 854 total submissions across 159 unique enrolled students across 6 periods.
- **Good-Faith Effort**: 99.2% overall good-faith effort rate across Free Response, AI Concept Chat, and CAST 3D Performance tasks.
- **Strict Authentic Student Telemetry**: Filtered pre-seeded AI prompts, system error strings, and 15 UI button click injections (`[System: Student is stuck...]`) from student work. Screened 612 authentic student chat turns and 449 written free responses (1,061 total student-authored items) with 100% safety/compliance (0 violations).
- **CAST Step 3 Dynamics**: Identified that on Day 10, 62% (71/114) authored authentic AI chat responses (19% multi-turn), while 38% (43/114) auto-submitted with prompt only (`Discussion logged`) due to timer expiration—informing a recommendation to extend timers on multi-step days.
- **Concept Chat Reply Distribution**: 84% (186/221) active reply rate (37% 1 reply, 16% 2 replies, 31% 3+ extended replies), while 16% submitted at the initial prompt.

**Tooling & Artifacts**:
- `sync-classroom/generate-bellringer-pdf.js`: Automated Puppeteer-based PDF rendering pipeline utilizing Inter typography, vector SVG data visualizers, custom KPI cards, and print CSS layout controls.
- `admin/reports/Unit_2_Bell_Ringer_Audit_Report.pdf`: 5-page Letter PDF formatted with zero overflow or orphaned lines.
## 2026-09-20 — Acceleration Rate & Sign Studio: Mandatory @orangeusd.org Login Gate, Guest Mode & Cloud Progress Backup

**Motivation**: Added mandatory student authentication gate, guest mode option, and continuous Cloud Firestore progress backup and restoration for the Acceleration Rate & Sign Studio (`Unit_2/acceleration_studio/`).

**Key Architectural Changes**:
- **Mandatory Activity Entry Gate (`#loginGateModal`)**:
  - Automatically activates upon initial page load if student is unauthenticated and has not chosen Guest Mode for the active session.
  - Prompts student to sign in with their `@orangeusd.org` school Google account or choose "Continue as Guest (Progress will NOT be saved)".
- **Domain Enforcement**:
  - Enforces `@orangeusd.org` and `@student.orangeusd.org` domain check (with instructor override `rmudry@orangeusd.org` and `ryan.mudry@gmail.com`).
  - Unauthorized accounts (e.g. personal `@gmail.com`) are rejected with clear error alert in `#loginGateError` and immediately signed out.
- **Guest Mode (`isGuest`)**:
  - Bypasses Firestore saves (`if (this.isGuest) return;`) while granting full interactive play across all tiers.
  - Header auth widget displays `👤 Guest Mode (Unsaved)` warning pill and a `Sign In` button for on-demand account linking.
- **Continuous Cloud Progress Backup & State Restoration**:
  - Saved under `student_results/unit2_day16_acceleration_studio/students/{studentId}` with parent document metadata for gradebook discoverability.
  - State payload stores `tierScores`, `tierCompleted`, and streaks (`tier1Streak`, `tier2Streak`, `tier3Streak`).
  - Restores previous progress seamlessly on login/reload via `challenges.restoreState()`, unlocking previously mastered tiers.
- **Verification**:
  - End-to-end headless Puppeteer suite (`scratch/test_auth_guest_firestore.js`) verified startup gating, guest mode bypass of Firestore writes, unauthorized domain rejection, and authenticated cloud progress restore with 0 console errors and exact 1280x768 viewport budget preservation.

## 2026-09-20 — Acceleration Rate & Sign Studio: Completion Screen Popup & Printer-Friendly Certificate

**Motivation**: Added an automatic completion screen popup, Cloud Firestore grade confirmation banner, and an official, ink-efficient certificate of mastery for students completing the 4-tier scaffold in the Acceleration Rate & Sign Studio (`Unit_2/acceleration_studio/`).

**Key Architectural Changes**:
- **Automatic Completion Popup (`#certModal`)**:
  - Automatically triggers `openCompletionModal()` 1.2s after completing the Tier 4 braking and directional reversal challenge (or on demand via the score bar's `🏆 Claim Badge & Cert` button).
- **Cloud Save Confirmation Indicator (`#certCloudSyncBox`)**:
  - Confirms Firestore backup status for authenticated `@orangeusd.org` students with an emerald `CONFIRMED ✓` badge, student ID, and reassurance that no manual turn-in is required.
  - Warns students in Guest Mode (`UNSAVED`) that their grade was not recorded and provides a one-click `Sign In with @orangeusd.org` button to save their progress.
- **Printer-Friendly Official Certificate (`#certDocument`)**:
  - Designed with an authentic classical double engraved border (`3px double #0f172a`), official Orange High School Science Department header, vector physics atom crest, 4-tier competency grid (25 pts each), official verification hash code (`ACCEL-[ID]-[HASH]`), and formal instructor signature line (`Ryan Mudry, M.S.`).
  - Strict `@media print` rules enforce pure white background (`background: #ffffff !important`), 0 toner waste, zero gradients, and total suppression of all non-print screen elements (`.no-print`, header, nav, buttons, close icons).
- **Verification**:
  - Tested with Puppeteer suite (`scratch/test_completion_cert.js`) validating authenticated Firestore confirmation, guest mode warning banner, print CSS zero-ink compliance (`rgb(255, 255, 255)`), PDF generation, and Tier 4 auto-popup with 0 console errors.

## 2026-09-21: Assignment Registry System
- **NEW**: Created `assignment-registry.md` wiki pattern documenting the `assignment_registry` Firestore collection schema, deployment workflow, sync resolution order, and known pitfalls.
- **UPDATED**: `classroom-gradebook-sync.md` — Added Section 11 documenting registry-first lookup and unified deployment script.
- **UPDATED**: `firebase-auth-gotchas.md` — Added cross-reference to `assignment_registry` in the Rule for Future Interactive Webapps.
- **UPDATED**: `wiki/index.md` — Added assignment-registry entry to the pattern table.

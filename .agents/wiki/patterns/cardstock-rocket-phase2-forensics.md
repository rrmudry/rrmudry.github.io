# Cardstock Rocket Phase 2: Controlled Variable Forensics & Dual Telemetry

## Overview
Cardstock Rocket Phase 2 challenges student engineering squads (max 3 students across Periods 0, 4, 5, 6) to build two rockets—**Rocket A (Control/Baseline)** and **Rocket B (Experimental Variant)**—that are identical in every physical dimension except exactly **ONE isolated independent variable** (e.g. fin geometry, fin offset, fin count, fuselage length, or nose ballast mass).

This project spans 3 instructional blocks:
- **Days 1–2 (Preparation & Precision Fabrication)**: Squad formation, single variable isolation, pre-flight hypothesis prediction, Rocket A & B teardown spec entry, and dual 1cm × 1cm CAD blueprint validation.
- **Day 3 (Launch & Comparative Recovery)**: Outdoor launch operations at constant **80–100 PSI pneumatic pressure**, satellite campus touchdown mapping (dual draggable pins), and Claim-Evidence-Reasoning (CER) performance synthesis. Includes built-in contingency protocols for rain.

---

## Architectural Patterns

### 1. Controlled Variable State Synchronization
To prevent students from inadvertently changing multiple variables:
- Rocket A serves as the Master Control.
- Whenever any specification for Rocket A is updated, the app automatically propagates that value to Rocket B *unless* that specific attribute is the designated independent variable.
- The active variable is highlighted with a gold border and badge (`--gold: #f59e0b`) across both input cards and the dual technical blueprint.

### 2. Dual-Rocket 1cm × 1cm CAD Blueprinting
- True-to-scale SVG coordinate grid where 1 grid block = 1.0 cm × 1.0 cm.
- Simultaneous rendering of Rocket A (red accent) and Rocket B (blue accent) stacked or focus-toggled.
- Dynamic aerodynamic stability calculations:
  - **Center of Mass (CM)**: Weighted balance point factoring fuselage length, nose cone, and tip ballast clay.
  - **Center of Pressure (CP)**: Barrowman approximation based on fuselage surface area and fin root/tip dimensions and offset.
  - **Stability Margin**: $CP - CM$ in centimeters. Positive values (e.g. +3.0 to +8.0 cm) indicate the Center of Pressure is comfortably behind the Center of Mass (STABLE); negative or small values indicate instability/tumble hazard. Displayed in intuitive centimeters and plain-English tags rather than abstract body calibers.
- **Blunt Nose & 0 cm Specification Handling (Critical Gotcha)**:
  - In JavaScript, using `parseFloat(input.value) || 6.5` converts `0` into `6.5` because `0` is falsy. This caused 0 cm blunt rockets to render as 6.5 cm cones on the blueprint!
  - Always use `parseNumWithDefault(elId, fallback)` which verifies `valStr === ''` before falling back, safely returning `0` when `0` or `0.0` is entered.
  - When `H_nose <= 0.5`, the CAD engine draws a flat blunt cap line (`<line x1="50" ...>`) flush at 0 cm on the ruler with label `• BLUNT NOSE (0 cm)`, and suppresses zero-length conical polygons and dimension callouts.

### 3. Dual-Pin Campus Satellite Recovery Map
- Leaflet map initialized with Orange High School center coordinates (`33.79688, -117.84678`).
- Launch Pad station selector (Periods 4–6 Science Building Pad: 33°47'48.8"N, 117°50'48.4"W vs Period 0 Honors Basketball Courts Pad: 33°47'50.5"N, 117°50'48.7"W).
- Two interactive draggable markers:
  - 🔴 **Red Pin A**: Rocket A Touchdown Spot
  - 🔵 **Blue Pin B**: Rocket B Touchdown Spot
- Dynamic flight vector lines connecting the Launch Pad to each pin.
- Live Telemetry HUD displaying ground range ($d$), flight azimuth (°), hang time ($t_{\text{hang}}$), apogee altitude ($h_{\max} = 5 \cdot (t_{\text{up}})^2$), and performance delta ($\Delta d = |d_B - d_A|$).

### 4. Stage-Gated Tool Visibility & CER Evidence Synthesis
To eliminate visual clutter and align tools directly to each stage's cognitive objective:
- **Stage 1 (Squad & Variable)**: Neither blueprint nor satellite map is displayed. Layout shifts to a focused, centered single column (`max-width: 980px`).
- **Stage 2 (Measurements)**: Shows **Technical Blueprint ONLY** on the right column (satellite map hidden) so students focus exclusively on metric teardown and CAD stability margins.
- **Stage 2 Sticky Blueprint Tracking**:
  - The left column on Stage 2 contains teardown specs for Rocket A, Rocket B, and the Interactive Fin Drafting Studio at the bottom.
  - When students scroll down into the Fin Studio, `#dualBlueprintCard` is dynamically styled with `position: sticky; top: 65px; z-index: 100` via the `main.stage-2-active` container class.
  - This allows the technical blueprint and real-time Center of Mass/Center of Pressure stability margins to float alongside students as they tweak fin geometries, providing instant visual feedback.
  - **Stage 2 Only**: The sticky behavior is strictly disabled on Stage 4 (`position: static`) so that both the Blueprint and Satellite Recovery Map stack and scroll naturally beside the CER writing prompts. On mobile/tablet screens ($\le 960\text{px}$), a media query resets the blueprint to `position: static`.
- **Stage 3 (Launch Operations)**: Shows **Satellite Recovery Map ONLY** on the right column (blueprint hidden) so students focus on stopwatch timers, azimuth vectors, and touchdown pins.
- **Stage 4 (CER Conclusion)**: Displays **BOTH Technical Blueprint AND Satellite Map** stacked on the right column, placing all physical dimensions, stability calibers, and recovery telemetry directly beside the CER writing prompts.
- **Student-Authored Evidence (Zero Pre-Filled Text)**:
  - The `cerEvidence` textarea is intentionally kept EMPTY so students write their own quantitative evaluation rather than accepting a prewritten robot sentence.
  - A compact read-only "📊 Live Data Reference" box sits above the textbox displaying live numbers (Mass A/B, Hang A/B, Range A/B, Apogee A/B, Stability Margins, and Δ Range) for students to cite.

### 5. District Web Filter & Security Hardening
- **Zero unpkg.com & Zero In-Browser Babel**: Uses native vanilla JavaScript and vendored Leaflet (`assets/vendor/leaflet/`).
- **Elimination of Leaflet Asset 404s**: Leaflet layer switcher default PNGs (`layers.png`) are replaced via CSS with inline data URI SVGs for both Dark and High-Contrast Light themes.
- **Anti-Paste Enforcement**: Prevents copy-pasting into hypothesis and CER response fields via multi-event interceptors (`paste`, `drop`, `beforeinput`).
- **Firestore Permission Structure**: Webapp writes exclusively to `student_results/{assignment_id}/students/{student_id}` to comply with security rules. The top-level doc `student_results/{assignment_id}` is created by the backend deploy script.

---

## Targeted Google Classroom Deployment
Phase 2 applies exclusively to Periods 0, 4, 5, and 6. Use the unified deploy script with `--periods`:

```bash
node deploy-assignment.js \
  --id "unit2_day36_rocket_phase2" \
  --title "Cardstock Rocket Phase 2: Controlled Variable Forensics" \
  --periods "0,4,5,6" \
  --points 10 \
  --topic "Unit 2: Motion" \
  --unit "Unit 2: Motion & Rocketry" \
  --standards "HS-PS2-1,HS-ETS1-2,HS-ETS1-3" \
  --url "https://rrmudry.github.io/Unit_2/rocket_phase2/index.html" \
  --description "Design and compare two identical cardstock rockets with exactly ONE isolated independent variable. Complete pre-flight predictions, teardown specs, dual 1cm × 1cm CAD blueprints, satellite touchdown mapping, and head-to-head comparative CER synthesis." \
  --due "2026-10-23T23:59:00-07:00"
```

Then verify with the pre-flight auth suite:
```bash
npm run verify -- --id unit2_day36_rocket_phase2
```

# Work & Simple Machines Practice Studio (Unit 3, Day 4)

> **Tags**: `work`, `simple-machines`, `pulley`, `ramp`, `mechanical-advantage`, `friction`, `guess-method`, `scaffolding`, `differentiation`, `desmos`, `firestore`, `monitor`, `inline-build`
> **Last Updated**: 2026-11-18

Code: `Unit_3/machines_practice/` (edit `src.html`, `js/`, `css/`; `index.html` is built via `node scripts/inline-studio.js Unit_3/machines_practice`). Monitor at `admin/machines_practice_monitor.html` (built from `admin/machines_practice_monitor.src.html`), tests in `tests/machinesPractice.test.js`.
Assignment ID: `unit3_day4_machines_practice`. Built on the `work_studio` framework (Desmos checking, step-by-step credit, certificate, teacher monitor) adapted for interactive **GUESS-method** problem solving.

## Why this replaced the 12-problem paper worksheet
- The Day 4 worksheet (`P304`) combined un-scaffolded two-step problems (including `m × g × h` before students formally studied gravitational potential energy) into one dense sheet, making it a "level 10" jump for students working at "level 6".
- **Bridge instead of `mgh` leaps:** Early ramp problems (`ramp_givenW_f`, `ramp_givenW_d`) display **`Work Needed (W)` directly on the dock meter** so students practice `F = W ÷ d` and `d = W ÷ F` cleanly without guessing `m × g × h`.
- **Multi-step box splitting:** Multi-part problems (Worksheet #5, #6, #8, #9, #10–11) split into 2–3 checked boxes (`Box 1 of 2`, `Box 2 of 2`) with completed answers carried forward as green chips (`✓ W = 600 J`) and revealed on the SVG picture.

## Lesson parts (6 pts guided + 4 pts Mastery Check = 10 pts)
1. **GUESS Setup (1× weight):**
   - Ungraded 1-rope vs. 3-rope pulley trade-off prediction + animated test (`▶ Test both pulleys`).
   - 4 zero-arithmetic GUESS sorting setups (`setup_w`, `setup_f`, `setup_d`, `setup_ma`): students tap/drag picture labels into **G (Givens)** and **U (Unknown)**, then choose **E (Equation)** (anti-guess: a wrong equation pick waits 6 s, deals fresh numbers, and requires 2 right in a row), followed by stacked Substitute & Solve reveal.
2. **Pulley Work (2× weight):** `pulley_w`, `pulley_f`, `pulley_d`, plus `pulley_2step` (CP) or `pulley_lift_h` (Honors). Conceptual gets the `W / (F · d)` formula triangle.
3. **Ramp Trade-Off (2× weight):** `ramp_givenW_f`, `ramp_givenW_d`, then `ramp_ratio_c` (Conceptual) or 2-step `F_g` / `mgh` ramp length & height (`cp`/`honors`), ending with the `compare_ab` Student A vs. Student B work conservation check.
4. **MA & Friction (2× weight):** `ma_find`, `ma_pull` (direct `F_out ÷ MA` for Conceptual, 2-box `F_out = m × g` → `F_in` for CP, combined for Honors), wheelchair ramp `d = MA × h` (CP/Honors), and rough-ramp friction (`rough_2box` for Conceptual/CP, `rough_3box_h` solving `W_in`, `W_f`, `F_f` for Honors).
5. **Mastery Check (4 pts):** 5 fresh situations (`q_pulley` tow truck winch, `q_ramp` boat trailer, `q_ma` theater fly rig, `q_rough` moving-van friction, and `q_carry0` Day 2 `0 J` perpendicular-force callback).

## Technical & UX patterns
- **Live 5-cell GUESS Strip (`#guessBoard`):** sits directly under the SVG scene showing `G | U | E | S | S` progress in real time (`now` / `done`) without cluttering the task card.
- **Zero-Cold-Equation Scaffolding:** every GUESS setup (`setup_w`, `setup_f`, `setup_d`, `setup_ma`) and calculation step with new symbols (`MA`, `F_out`, `F_in`, `W_in`, `W_out`, `W_f`) pairs plain-English symbol decoder pills (`.sym-key`) with a concept anchor box (`.teach-box`), a highlighted formula triangle (`Scene.triangleSVG(cover)` / `Scene.maTriangleSVG(cover)` with the unknown vertex circled), or a proportional energy-split bar (`Scene.frictionBarHTML`), plus 2 progressive hints on both Stage A and Stage B and number-specific wrong-equation explanations (`explainWrongEq`).
- **Taller Desmos Expression Display (`#calcPanel`):** Moves `📥 Use calculator answer` into the top-right corner of `.calc-head` globally (`grid-template: auto minmax(0, 1fr) auto / minmax(0, 1fr) auto`), widens `#calcPanel` to `min(29rem, calc(41vw - 1.5rem))`, sets `--calc-height: clamp(22.5rem, calc(100vh - 23.5rem), 36rem)` (`20.6rem` in `html.short`), uses Desmos medium default font size, and runs `requestAnimationFrame(() => desmos.resize())` so typed expressions and stacked fractions never clip (`148 px` screen at `768 px` height, `86 px` at `650 px` height) while `.task-top` stays single-line clear of Desmos.
- **Native `<dialog id="loginGate">`:** uses `showModal()`/`close()` with `overscroll-behavior: contain`, `display: flex` scoped strictly to `dialog.login-gate[open]`, and `cancel` prevention while sign-in is required.
- **Theme + `<meta name="color-scheme">` sync:** `:root` maps `color-scheme` via `:has(> head > meta[name="color-scheme"][content="dark"|"light"])` alongside `#btn-theme-toggle` and `#btn-projector-mode`.
- **SVG label spacing pitfall:** on pulley diagrams, `F` sits next to the angled pull arrow (`x=426, y=152`) while the vertical rope-distance `dim()` line sits at `x=556` so `F` and `d` plates never overlap.

## Status (as of 2026-11-18)
- Built, unit-tested (`tests/machinesPractice.test.js`, 11/11 Jest suites / 248 tests passing), audited (`audit-firestore-rules-coverage.js` and `audit-web-filter-cdn.js` clean), and verified end-to-end with Puppeteer across all 3 class tiers (`10.0 / 10`), guest reload resume, Desmos calculation checking, `1366 × 768` & `1366 × 650` non-overlapping layouts, and monitor demo.
- Not yet deployed to Google Classroom (`deploy-assignment.js` + `npm run verify`) or linked in `assets/lessons-data.js` (awaiting teacher review and due date confirmation).

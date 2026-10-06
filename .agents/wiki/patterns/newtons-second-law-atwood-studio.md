# Newton's 2nd Law Studio: Dual-Pulley Horizontal Atwood Machine

## Context
`Unit_2/newtons_second_law_studio/` (Days 26–27). Built from `Unit_2/newtons_second_law_studio_plan.md`. Three guided steps (Equilibrium → Isolate Force → Isolate Mass) plus a 5-tier Mastery Arena. Vanilla HTML/CSS/JS, plain `<script>` tags (no modules) so it runs from `file://` and offline.

## Architecture
```
index.html            sticky header + 4-tab grid, 2-column workbench, certificate modal
style.css             dark default + html.theme-light, html.font-normal/large/huge (16/20/24px), [hidden]{display:none!important}
js/text.js            subHTML() + SubText (canvas subscripts) — loaded first
js/audio.js           window.soundFx (click, nudge, clack, thud, beep, chime, buzzer, setRollSpeed)
js/physics.js         window.NSL constants + AtwoodPhysics (masses in grams, physics in SI)
js/atwood-canvas.js   AtwoodCanvas renderer (reads CSS vars via refreshPalette())
js/graphing.js        Graph (generic plotter) + Fits.throughOrigin / Fits.inverse
js/challenges.js      MasteryArena (5 randomized tiers, FNV-1a verification code)
js/app.js             controller: tabs, constraint-mode controls, trials, HUD, loop
```

## Physics decisions
- **g = 10 m/s²** (class convention), not 9.8 as written in the plan. Step 2/3 numbers become clean: Δm = 40 g → 0.40 N → 0.80 m/s² at 500 g.
- Euler-Cromer with 10 substeps per frame (dt = 1/600 s) so photogate edge times can be interpolated precisely. Measured a from gates matches theory to 4 decimals.
- Cart states: `held` | `running` | `stopped`. Held/stopped → tensions = m·g and the FBD shows "F_net = 0 N (hand/bumper holds cart)". Running → T_L = m_L(g + a), T_R = m_R(g − a). This contrast is what Tier 5 tests.
- Photogates: 5.0 cm flag; v = 0.050 / block time; a = (v_B − v_A) / (t_mid,B − t_mid,A). For constant a this is exact.
- Constraint modes are enforced by the *available controls*, not validation: Step 2 only offers token transfers (M_total invariant); Step 3 only offers cargo and equal pairs (Δm invariant).

## Rendering pitfalls
- **Subscripts, never underscores** (teacher preference). Source strings may say `F_net`, `m_L`, `T_R`; every visible string goes through `subHTML()` (HTML) or `SubText.fill/measure` (canvas). Only the symbol set F/M/m/T/v/t/a + net/total/cart/hang/L/R/A/B is converted, so code identifiers like `X_MAX` are safe.
- A 2.0 m track + 1.7 m of hanger travel can't fit at one scale. Vertical travel is compressed dynamically to fit between table and floor, and the canvas prints the actual percentage ("Hanger drop drawn at N% scale") so it stays honest.
- Hanger top must start below the table slab, or the hanger near its pulley collides with the scale labels.
- Clamp FBD and hanger labels inside the canvas width; on phones the cart sits near the edge at the start line.
- Cargo sits on top of the chassis in two stacks beside the flag; the FBD baseline rises with `cargoTop` so arrows never overlap the cargo.
- `.seg { display:inline-flex }` beats the `hidden` attribute. Keep the global `[hidden]{display:none!important}` rule.

## Guided task engine (low floor / high ceiling) — teacher-requested redesign
- The right column shows **one task at a time** (`js/lessons.js` content, engine in `js/app.js`). No long checklists: the original all-at-once mission panel overloaded students.
- Each step = rounds; each round = a random `scenario()` + tasks of type `info` | `do` (sim condition polled per frame) | `mc` | `num` (tolerance + `diagnose()` for common slips: grams vs kg, forgot × g, added instead of subtracted, cart-only mass).
- **A wrong answer is never free:** it shows the diagnosis, then "Get new values" regenerates the round's scenario (guaranteed different) and restarts that round. `keepSim` rounds (data collection) only regenerate question values, not the recorded trials.
- Tasks declare which sim buttons and mass controls appear (`run`, `controls`), so students only see what the current task needs. `hideValues` hides calculated quantities (T values, ΣF row) on the track overlay and free-body diagram until answered.
- `hideValues` is `true` (hide every number) or an array of symbols (e.g. `['F_hand', 'sum']`, where `'sum'` is the track's ΣF row), so a question can hide only its answer.
- **No m·g early (conceptual physics):** Steps 1–2 have students READ T_L and T_R in newtons from the free-body diagram and find net force as bigger pull − smaller pull. m·g only appears in the Arena's Tier 5 challenge.
- Runs pause at `NSL.MAX_T` = 10 s (`physics.timeUp`). The canvas stopwatch shows READY / RUNNING / PAUSED / STOPPED.
- **Every calculation task embeds Desmos** (`calc: true`): one `Desmos.ScientificCalculator` instance (same API key as the other Unit 2 labs) is re-parented into `#calcSlot` on each render, cleared with `setBlank()` on a new task, and `invertedColors` follows the theme. If Desmos fails to load (offline), the slot says to use your own calculator.
- **Hints** (`hints: ctx => [...]`) open one at a time, before answering, with no penalty. They walk through unit conversions students won't remember (5.0 cm = 0.05 m, 200 ms = 0.2 s, g → kg) and end with "Type ___ into the calculator."
- **Reading level:** prompts are written for Conceptual Physics students reading well below grade level: short sentences, everyday words, bullet lists for given values. 🔊 *Read to me* uses Web Speech and expands units (m/s → meters per second) and symbols (T_L → "T L", ÷ → "divided by").
- The photogate strip shows "light blocked ___ ms" plus speed. `hideValues: ['speed']` hides the speed so students calculate it from the flag length.
- **Step 1 sequence (teacher-specified, 7 parts):** (1) cart with NO masses, nudge → constant speed → "why?" = inertia; (2) right weight only, release → accelerates → force = weight = mass × g (hints: g→kg, ×10); (3) student adds LEFT weight to balance, release runs a 5 s test (`maxT: 5`), and a `fail(ctx)` condition makes rolling count as wrong (new values); (4) two teaching screens: balanced forces, net force = bigger − smaller (add forces that point the same way); (5–7) three net-force examples (whole numbers, decimals, ⭐ two forces on one side) drawn with an inline SVG `forcePic()`. The photogate explainer moved to Step 2.
- `do` tasks support `fail(ctx)` (returns a message → treated as a wrong answer), `doneText(ctx)`, and `maxT` (per-task clock limit). Saved-progress key is `nsl_v3`; bump it whenever lesson structure changes.
- **Formulas never wrap:** `subHTML()` also runs `glueMath()`, which turns the space between a number and its unit, and the spaces around = − + × ÷, into non-breaking spaces (text between tags only). Word formulas get `class="formula"` (nowrap). Long chained formulas are split at "=" with `<br>` so they still fit on a phone.
- **Layout rule (teacher):** the free-body diagram must always be on screen. Students won't scroll to find it. Left column: compact track (canvas H ≈ 0.34·W, run buttons in its toolbar, one-line photogate strip) → force diagrams card directly under it. Right column: task card (with Desmos) → weight controls → graph. Checked at 1245×700 and 1366×768 with puppeteer `getBoundingClientRect()` on `#fbdFree`.
- **Accounts + grading (`js/auth.js`, modeled on Mass & Weight Studio):** Google sign-in (@orangeusd.org + teacher emails) or ungraded guest (device only; carries over on first sign-in). Saves the whole lesson state to `student_results/unit2_day27_newtons_second_law_studio/students/{studentId}` (`studioState` field, debounced 1.5 s, flush on hide/unload, retries offline). Score /10 = 2 per finished step + 0.8 per Arena tier (best ever, `bestPoints` never lowered; cloud `score` folded back in on load). Arena session (values + tier tries) is saved too, so a reload can't escape a penalty. App boots only via `NSLApp.start(state, cloud, profile)`.
- **Differentiation:** `roster/{studentId}.period` 0 → `profile.honorsRequired` (teacher emails too). Lesson rounds marked `honors: true` run only when required or opted in. A round with `honorsGate: true` (task type `optin`) asks everyone else once ("⭐ Yes, I'll try it" / "No thanks"), stored in `state.optIn[step]`. ⭐ now means Honors only; regular challenges are labeled "Challenge:" without a star. Step 1 Honors = "Direction matters": right +, left −, net force = signed sum, plus 3 signed examples (wrong sign → "Check the sign").
- **Every step has a ⭐ Honors section** (teacher rule), each preceded by `honorsGate(stepName, topic, blurb)`:
  - Step 1 "Direction matters": signed net force.
  - Step 2 "Slowing down": `nudgeV: 0.75` big nudge with the left side heavier, so the cart slows, stops, and rolls back. Students compute a NEGATIVE a from the photogates, then predict a signed a = (m_R − m_L)·g ÷ M_total.
  - Step 3 "Mystery cargo": `hideCartMass` shows the cart as "? g" with a covered crate and hides the FBD scale bar. Students find a, then total mass = 0.50 N ÷ a, then cart = total − 150 g (`revealOnCorrect` shows the true mass after the last answer). Then a same-force ratio question.
  - Honors completion is stored per step in `state.honorsDoneSteps`.
- **Arena content (teacher-scoped, `ARENA_VERSION` 2):** 5 core tiers at the level of Steps 1–3 (balance it; double the force; net force from two weights via mass × g; a = F ÷ m; same force, which cart speeds up more). Each has hints, Desmos, and new values on a miss. Then 2 ⭐ Honors tiers (inertia penalty with the total mass; signed acceleration), required for Period 0 and opt-in for others, NOT graded (0.8 pts per core tier only). REMOVED as out of scope, even for Honors: target-speed tier (v² = 2·a·d) and the string-tension forensic tier (T_R = m_R·(g − a)).
- **Arena (teacher rules):** one tier at a time with 5 progress dots and "Next tier →" (no stacked list; students won't scroll). No name box: the name comes from the Google account. No "Copy Submission Summary": the score saves to Firestore automatically (`percentage` field, read by `.agent/workflows/sync-grades.md` / `sync-cli.js`). Intro uses plain words instead of ∝ ("More net force → more acceleration…").
- **Certificate:** shows the account name, gradebook points /10, steps, arena tiers, Honors steps, class period, date, and verification code. "🖨️ Print or Save as PDF" uses an ink-friendly `@media print` page (white, black text, thin black borders, letter size) and sets `document.title` so the PDF file name is `Newtons_2nd_Law_Certificate_<Name>`.
- `window.revealCard(el)` scrolls a newly shown task or tier below the sticky header (`scroll-margin-top`) whenever it isn't already in view.
- **Vocabulary:** the class says "net force" (not ΣF). The track overlay reads "Net force on cart".
- Wrong-answer feedback must be visible without scrolling: the calculator renders only while a question is open (`status === 'ask'`).
- The status line is deliberately neutral ("Rolling right…") so it never gives away an answer.
- Arena uses the same rule: a wrong tier attempt regenerates that tier's values.
- Progress, scenarios and trials persist in `localStorage['nsl_v2']` (per viewer), so reloading doesn't escape a penalty.

## Force diagrams (`js/fbd.js`)
- Two canvases side by side under the task card: **Forces on the cart** (forces drawn where they act) and a **free-body diagram** (dot, all forces from the dot, one common scale, scale bar). Includes F_N and F_g, plus F_hand / F_bumper whenever the cart is held, since it would otherwise be a false FBD with unbalanced tensions on a cart at rest.
- "What exerts it" text lives in an HTML legend under the canvases (narrow canvases can't fit it).
- The track overlay shows **ΣF on cart = T_R − T_L**, not the system's Δm·g. While accelerating these differ (0.72 N vs 1.20 N for 0.3 kg cart / 0.5 kg system). Lessons call Δm·g the net force on the *whole system*.

## Completion criteria (Engagement Law)
- A step is done when every task in every round has been answered correctly; its tab gets ✓ and the takeaway appears.
- Arena: 4 of 5 tiers unlock the certificate (name required). "Copy Submission Summary" puts the text on the clipboard for Google Classroom.

## Auth, Roster Resolution & Gradebook Sync (`js/auth.js`)
- **Firestore Subcollection Path**: `student_results/unit2_day27_newtons_second_law_studio/students/{studentId}`.
- **Roster Period Resolution**: Roster documents in `roster/{studentId}` store the field as `class_period` (integer 0–6), not `period`. `lookupPeriod()` checks both `class_period` and `period`, ensuring Period 0 Honors students get `honorsRequired: true`.
- **Payload Undefined-Field Guard**: Firestore client SDK strictly rejects documents containing `undefined` values (`Unsupported field value: undefined`). All fields in `auth.js` (`class_period`, `email`, `student_name`, etc.) must fall back to `null` or default values.
- **Teacher Account Exclusion from Student Courses**: Teacher accounts (`rmudry@orangeusd.org`) receive `class_period: 'T'`. Because Google Classroom only permits grading enrolled students in courses P0–P6, teacher accounts do not map to student submissions during `sync-cli.js`.

## Testing
Puppeteer is in `node_modules`. Drive the tabs, click `[data-action=...]` buttons, and screenshot at 1440 px and 390 px (check `scrollWidth - innerWidth === 0`).

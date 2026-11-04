# Projectile Range Studio (Three-Class Differentiation on One Flight)

> **Tags**: `projectile`, `hang-time`, `range`, `differentiation`, `svg`, `desmos`, `firestore`, `monitor`
> **Last Updated**: 2026-11-02

Code: `Unit_2/projectile_range_studio/`, monitor at `admin/projectile_range_monitor.html`, tests in `tests/projectileRange.test.js`.
Assignment ID: `unit2_day47_projectile_range_studio`.

## One flight, three ways in
All classes solve the same problem and see the same layout, colors and words. They differ only in where v<sub>ox</sub> and v<sub>oy</sub> come from and how hang time is found. The class comes from `roster/{id}.class_period` and is never shown to P1–6.

| Class | Periods | v<sub>ox</sub>, v<sub>oy</sub> | Hang time | Numbers |
|---|---|---|---|---|
| Conceptual | 1–3 | printed on the arrows | press Next second and count to v<sub>oy</sub> = 0, then up + down | v<sub>oy</sub> is a multiple of 10, so no division |
| CP | 4–6 | read from a vector diagram: squares × scale | t = 2 × v<sub>oy</sub> ÷ g | whole squares; scale is 2, 4, 5 or 10 m/s |
| Honors | 0 | v<sub>o</sub> × cos(θ), v<sub>o</sub> × sin(θ) | t = 2 × v<sub>oy</sub> ÷ g, tied to the notes' position equation | no angles near 45° |

Range is ΔX = v<sub>ox</sub> × t for everyone.

## Decisions worth keeping
- **Symbols use the letter o** (v<sub>ox</sub>, v<sub>oy</sub>), matching the Day 46 notes and how the teacher writes them. The Vector Decomposition Studio uses a zero (`v_0x`).
- **Fixed colors**: blue v<sub>ox</sub>, orange v<sub>oy</sub>, purple v<sub>o</sub>. The picture holds the numbers and the words never do, so a copied question gives an AI nothing to solve.
- **The fixed-size grid** (10 × 8 squares) keeps a square looking the same every time; only the scale key changes.
- **Arrow labels stay whole numbers while the ball moves.** Showing 8.28 m/s mid-animation between seconds was distracting.
- **Follow-through grading** on the Mastery Check: later steps are graded against the student's own earlier answers, so one slip costs one point. In guided parts a wrong answer restarts the problem with new numbers, while radian mode gets a retry with no penalty.
- **The picture never resizes.** The teacher disliked it shrinking when Start over wrapped the controls to a new line. The control, ladder and solved rows hold a fixed height on every page, even when empty, and Start over uses `visibility` at time 0 so Next second stays put.
- **Back is on every page** except the very first page and a page showing a wrong answer, whose only way forward is new numbers. Each replaced problem is pushed on `part.trail`, so Back restores its numbers and answers, and answered pages reopen answered. Going forward past a restored problem deals new numbers for the next one. Credit never drops.
- **Calculations are stacked, never chained.** The teacher said `ΔX = v_ox × t = 20 × 6 = 120 m` was hard for students to decode. `PR.stack` splits on ` = ` and draws one step per line with the equals signs aligned, and worked examples carry units.
- **Certificate**: same rule as the Vector Decomposition Studio: every part finished and 75% or higher on the Mastery Check, signed-in students only, downloaded as a PDF from `js/certificate.js`. Honors adds one line on the PDF; P1–6 get no class label. The monitor shows 🎓 from `certificate_code`.
- **Layout**: `body` is a 100vh flex column and the workbench takes the rest. A fixed `calc(100vh - header)` broke in projector mode, where the header height changes.

## Calculator reuse
`index.html` loads `../vector_decomposition_studio/js/engine.js` only for `Engine.readCalculator` and `Engine.parseCalc`. The studio's own `PR.workProblem` checks routes instead of an exact number list, so `2 × 30 ÷ 10`, `30 ÷ 5` and `2 × sin…` all pass, and carried rounding (16.3 for 16.31) is accepted. Changing `parseCalc` affects both studios.

## Teacher-only monitor
- Google OAuth through Firebase Auth. The page's email check only decides what to draw.
- The real lock is the existing `firestore.rules`: listing `student_results/*/students` and `roster` needs `isAdmin()`. Confirmed live on 2026-11-02: both lists return `permission-denied` when signed out.
- `?demo` sample data only runs on localhost, unlike older monitors, so the deployed page shows nothing without sign-in.
- No rules change was needed: the app only uses `student_results/{id}/students/{owner}` and `roster/{owner}`, both already covered for students.

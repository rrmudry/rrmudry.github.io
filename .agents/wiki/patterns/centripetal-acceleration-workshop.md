# Centripetal Acceleration Workshop (Turning Is Accelerating)

> **Tags**: `circular-motion`, `centripetal`, `tangent`, `differentiation`, `svg`, `desmos`, `firestore`, `monitor`, `inline-build`
> **Last Updated**: 2026-11-08

Code: `Unit_2/centripetal_workshop/` (edit `src.html`, `js/`, `css/`; `index.html` is built), monitor at `admin/centripetal_workshop_monitor.html` (built from `admin/centripetal_workshop_monitor.src.html`), tests in `tests/centripetalWorkshop.test.js`.
Assignment ID: `unit2_day51_centripetal_workshop`. Built from the Monkey Hunter Studio's saving, certificate and monitor.

## The teaching goal
Going around a circle at a steady speed is still accelerating, because velocity includes direction. The acceleration points to the center, and its size is a<sub>c</sub> = v² ÷ r. The idea comes before the math: direction first, then the let-go demo, then why the change points inward, and only then how big.

## Lesson order
1. **Turning:** step a car around a track with a fixed speedometer and watch the velocity arrow turn; the tangent line; which arrow is velocity.
2. **Let Go:** an ungraded prediction, then whirl and let go: the stopper leaves along the tangent, not straight out. Ties to the Friday spin-art day (paint leaving the sheet).
3. **Toward the Center:** two velocity arrows slid tail to tail; the change points to the center; v and a<sub>c</sub> are at a right angle.
4. **How Big?:** twice the speed makes a<sub>c</sub> 4 times as big, half the radius makes it twice as big, then practice.
5. **Mastery Check:** problems plus concept questions.

## One circle, three ways in
| Class | Periods | How a<sub>c</sub> is found | Mastery Check |
|---|---|---|---|
| Conceptual | 1–3 | Compare two circles: "how many times as big?" (typed reasoning), then old a<sub>c</sub> × that number in Desmos. No division. | 2 compare problems + 2 concept |
| CP | 4–6 | a<sub>c</sub> = v² ÷ r with v and r on the picture | 2 a<sub>c</sub> problems + 3 concept |
| Honors | 0 | the same, plus v = 2πr ÷ T from one lap, and the fastest safe speed v = √(a<sub>c</sub> × r) | lap problem (v, a<sub>c</sub>) + fastest speed + 2 concept |

## Decisions worth keeping
- **Fixed colors:** blue is velocity, rose is a<sub>c</sub>, purple is the radius. On the "which arrow" and "which path" questions every choice is the same gray, so color never gives the answer away.
- **Letters are shuffled onto directions** (`letterMap`), so the right letter changes each time. The options stay in A–D order because the letters live on the picture.
- **The picture never scales with the numbers.** The circle is always the same size; the labels carry r and v. The radius is drawn toward the lower left, away from the a<sub>c</sub> arrow, so their labels never collide.
- **Everything moves counterclockwise,** with a small "moves this way" arrow inside each circle.
- **Lettered questions use a smaller circle** (118 px) and paths are clipped by `fit()` so every arrow and letter stays inside the picture at all 12 spots.
- **The prediction page hides the velocity arrow,** so it doesn't give the answer away.
- **At most two hints per step,** and the calculator's minimum height is 19rem, so hints stay clear of it at 1366 × 650.
- **π is required** for the lap problem: `workProblem` checks the calculator line for `\pi`, since the parser doesn't record π as a number.

## Inline build
`node scripts/inline-studio.js Unit_2/centripetal_workshop` turns `src.html` into `index.html` with every local script and stylesheet inlined, the fix for GitHub Pages 404s on separate `js/` files (commit f6a036c2). It also takes a single file: `node scripts/inline-studio.js admin/centripetal_workshop_monitor.src.html`. Rebuild after every edit to `js/` or `css/`.

## Teacher-only monitor
Same lock as the Monkey Hunter monitor: `firestore.rules` lets only `isAdmin()` list `student_results/*/students` and `roster`. `?demo` sample data runs only on localhost. No rules change was needed, because the app only uses `student_results/{id}/students/{owner}` and `roster/{owner}`.

## Status (as of 2026-11-08)
- Posted to Classroom 2026-11-08 (all 7 periods, due 2026-11-09 6:00 PM); `npm run verify` fully green.
- Linked from Day 51 in `assets/lessons-data.js` after verify passed.

## Open Design Review: Closing Guessing Loopholes (Saved 2026-11-09 for Home Computer)
Three places where students can currently benefit from or brute-force via guessing in `Unit_2/centripetal_workshop/` (and similar studio apps):

1. **Follow-Through Credit on `newac` When `factor` Is Wrong (`js/physics.js`)**:
   - In the Conceptual track, each problem has two steps:
     1. `factor` (*"How many times as big is the new a<sub>c</sub>?"*) — a typed number (`2`, `4`, or `9`).
     2. `newac` (*"Now find the new a<sub>c</sub>"*) — currently uses follow-through grading (`sc.a1 * own(ans, 'factor', sc.factor)`).
   - Because of follow-through grading on the Mastery Check, if a student guesses the wrong factor on Step 1 (e.g., types `2` instead of `4` when speed doubles) and then multiplies `old a_c × 2` on Step 2, Step 2 is still marked 100% correct (allowing a 5/6 = 83% score even when missing the core pattern).
   - **Proposed Fix**: Remove follow-through credit on `newac` when `factor` is wrong, since identifying the factor (`2`, `4`, or `9`) is the core Conceptual physics idea.

2. **Zero Cooldown on "Try new numbers ▶" in Guided Parts (`js/app.js`)**:
   - Parts 1, 2, and 3 are primarily 3-option or 4-option multiple-choice questions (`accel_turn`, `v_dir`, `release_path`, `paint`, `a_dir`, `right_angle`).
   - Currently, when a student clicks a wrong choice, the `Try new numbers ▶` button is enabled immediately (0-second wait), allowing rapid click-guessing until hitting the 1-in-3 / 1-in-4 right answer.
   - **Proposed Fix**: Add a 6–8 second read-the-explanation countdown on wrong answers (`Read why first (6s)…`) before enabling `Try new numbers ▶` so rapid guessing is slower than reading.

3. **Instant Mastery Check Retakes & Single-Try Concept Checks (`js/app.js`)**:
   - Currently there is no cooldown before clicking `Retake with new numbers ▶` on the Mastery Check, and in the guided parts a single lucky click advances past a concept check.
   - **Proposed Fix**: Require 2 correct in a row after a miss on multiple-choice pages in guided parts (so a 1-in-3 lucky click after a miss cannot advance), and/or add a brief review pause before Mastery Check retakes.

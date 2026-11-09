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

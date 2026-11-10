# Centripetal Force Lab (What Does the Pulling?)

> **Tags**: `circular-motion`, `centripetal`, `net-force`, `investigation`, `data-table`, `graphing`, `differentiation`, `svg`, `desmos`, `firestore`, `monitor`, `inline-build`
> **Last Updated**: 2026-11-09

Code: `Unit_2/centripetal_force_lab/` (edit `src.html`, `js/`, `css/`; `index.html` is built), monitor at `admin/centripetal_force_lab_monitor.html` (built from `admin/centripetal_force_lab_monitor.src.html`), tests in `tests/centripetalForceLab.test.js`.
Assignment ID: `unit2_day52_centripetal_force_lab`. Built from the Centripetal Acceleration Workshop's saving, certificate and monitor.

This is the first studio built as an **investigation** under the measure → table → graph rules in [student-app-standards](student-app-standards.md). Use it as the model for the next one.

## The teaching goal
An object only moves in a circle while a net force pulls it toward the center. "Centripetal" is a direction, not a new kind of force: tension, friction, gravity or a normal force does the pulling. The size is F<sub>net</sub> = m × v² ÷ r. Students find that pattern in their own measurements before the formula is used.

## Lesson order
1. **The Pull:** an ungraded prediction, then a puck on a string on a table, seen from above. Aim the force arrow, cut the string, and aim the path it takes.
2. **Measure:** five trials (six in Period 0). Set the speed, read the force dial, record it in the table. The table checks each reading.
3. **Graph It:** plot each row of the student's own table by clicking the graph, then answer from the graph, predict a speed that was never tested, and run it to check.
4. **Who Pulls?:** four stations (rope, car on a curve, the Moon, a spinning ride). Find the one test that sends the object off in a straight line, then name the force.
5. **How Much?:** two or three problems with new numbers. Calculations are answered from the calculator.
6. **Mastery Check:** new situations (hammer throw, penny on a turntable, satellite, washer), new numbers, and a graph the student did not make.

Parts are worth 6 points and the Mastery Check 4, for 10. Measure and Graph It count double.

## One lab, three ways in
| | Periods 1–3 | Periods 4–6 | Period 0 |
|---|---|---|---|
| Speed | read from the speed display | read from the speed display | found from a stopwatch time for 10 laps |
| Each trial | speed and force | speed, force, then a<sub>c</sub> = v² ÷ r | time, force, then v |
| Graph | F against v (a curve) | F against a<sub>c</sub> (a line) | F against v, then chooses v² to straighten it |
| From the graph | twice the speed needs 4 times the force, 3 times needs 9 times | slope of the line = the mass, checked on a scale | slope → mass, then the speed that snaps the string |
| How Much? | 2 problems: the speed goes up 2 or 3 times, find the new force | 3 problems: F<sub>net</sub> = m × v² ÷ r for a rope, a car and a ride | 3 problems: F<sub>net</sub>, then the fastest safe speed twice (square root) |
| Math | no division | one formula at a time | rearranged formula, square root |

Periods 1–6 never see a class label. The first hint is already open for Periods 1–3.

## Decisions worth keeping
- **Every student gets their own puck and string,** so two tables side by side don't match and a copied reading fails the check.
- **The data is the student's own.** The graph shows only what they recorded, and a wrong answer later never erases the table.
- **The numbers live on the instruments.** The force is a needle on a dial with a close-up, the speed is on a display, and the Period 0 lap time is on a stopwatch. A wrong reading gets a reason ("that is the speed, not the force"), never the value.
- **The speeds are chosen on purpose.** Periods 1–3 run 2 m/s, then twice and three times as fast, so the 4× and 9× pattern is sitting in their table. Other classes must go slow, then fast, then fill in between, so the graph has spread.
- **The prediction is tested.** Every class predicts a case that is not in their table (8 m/s, or the snapping speed) and then runs it. The dial agreeing with the prediction is the payoff.
- **Trying every option fails.** A wrong answer starts a short wait that grows with each miss. A missed arrow or station brings a new one and asks for two right in a row. Each station has tests that change nothing, and only the real one shows the straight-line path. A slope needs two points that are far apart.
- **The notebook page** asks for the table, the graph sketch and one sentence on paper, and the button waits.
- **Graph labels are drawn last with a halo,** so a neighbouring point never hides the numbers of a picked point.
- **Short screens are measured in rem, not pixels.** A small script at the top of `src.html` (`window.flFit`) puts `compact` on `<html>` when the window is 75rem tall or less and `short` when it is 43.75rem or less, and measures again when Projector mode is switched. CSS height media queries can't see that Projector mode made the text bigger, so a 1080p projector was laid out as if it had room to spare.
- **What `compact` and `short` do:** in `compact`, feedback sits under the answer row and only the newest hint stays open while feedback shows. In `short` (1366 × 650) the header and tabs get slimmer, and the calculator's "Use calculator answer" button moves into its title bar, so the calculator still has room to show a whole fraction and its result.
- **Projector mode grows with the screen** (`clamp(16px, min(2.46vh, 1.17vw), 22px)`): large text on a large display, normal size on a Chromebook, so the calculator never covers the question.
- **Reloading resumes** on the same page with the same numbers, table and graph. The one exception is a reload during the cut-string animation, which replays that step.

## Inline build
`node scripts/inline-studio.js Unit_2/centripetal_force_lab` turns `src.html` into `index.html` with every local script and stylesheet inlined. The monitor builds with `node scripts/inline-studio.js admin/centripetal_force_lab_monitor.src.html`. Rebuild after every edit to `js/` or `css/`.

Preview without saving: `index.html?preview&view=conceptual` (or `cp`, `honors`).

## Teacher-only monitor
Same lock as the other monitors: `firestore.rules` lets only `isAdmin()` list `student_results/*/students` and `roster`. It shows each student's grade, first-try accuracy, trials recorded, minutes, parts done and Mastery Check attempts, and is linked from `admin/index.html` and the 3D Sprint Progress page. `?demo` sample data runs only on localhost. No rules change was needed.

## Status (as of 2026-11-09)
- Built and played through in preview for all three classes at 1366 × 768 and 1366 × 650, answering right and answering wrong first, in light, dark and Projector mode.
- Also played through on larger screens (1920 × 1080 and 2560 × 1440, normal and Projector mode) and at window heights on each side of the `compact` limit. A wrong answer with every hint open is the tightest screen, so that is the one to replay after any layout change.
- **Not yet posted to Classroom and not yet linked from Day 52** in `assets/lessons-data.js`. Both wait on a confirmed due date and a green `npm run verify`.
- Not tested yet: a real student sign-in with saving to Firestore (verify covers it after posting), and the monitor with real class data.

# Monkey Hunter Studio (Falling Below the Inertial Path)

> **Tags**: `projectile`, `monkey-hunter`, `inertial-path`, `strings`, `differentiation`, `svg`, `desmos`, `monitor`
> **Last Updated**: 2026-11-04

Code: `Unit_2/monkey_hunter_studio/`, monitor at `admin/monkey_hunter_monitor.html`, tests in `tests/monkeyHunter.test.js`.
Assignment ID: `unit2_monkey_hunter_studio`. Built from the Projectile Range Studio's layout, saving, certificate and monitor.

## The teaching goal
"Aim at the monkey" ends the classic demo as soon as a student knows the trick. The goal here is the reason: a projectile falls below its straight inertial path by exactly the distance a dropped ball falls in the same time. The picture is the teacher's meter stick: balls hang from evenly spaced marks on strings as long as each second's drop. Tilt the stick, and the balls still mark the path.

## Lesson order
1. **The Straight Line:** gravity off, equal steps along the stick, the term "inertial path."
2. **The Drop:** press Next second and read a ruler, building the student's own drop table (5, 20, 45, 80 m). Then the pattern, then a dropped ball beside a sideways ball.
3. **The Strings:** drag the balls down to match the table, launch through them, then tilt and change speed with a slider.
4. **The Monkey:** an ungraded prediction, then gravity off, then gravity on with matching strings under the stick and the branch.
5. **Hunts:** a monkey that holds on (aim high by one string), a shot that is too slow (drop greater than H), a normal hunt, and the Moon.
6. **Mastery Check:** 2 hunts and 2 concept questions.

## One hunt, three ways in
| Class | Periods | Time to the monkey | Drop | Adds |
|---|---|---|---|---|
| Conceptual | 1–3 | count the marks on the stick | read from their own drop table | no division; whole seconds only |
| CP | 4–6 | t = ΔX ÷ v<sub>ox</sub> | 5 × t² | |
| Honors | 0 | θ = tan⁻¹(H ÷ ΔX), v<sub>ox</sub> = v<sub>o</sub> × cos(θ), then t | 5 × t² | why speed cancels, smallest speed, monkey that lets go early |

## Decisions worth keeping
- **Fixed colors:** purple is the stick (along v<sub>o</sub>), rose is any drop, on the ball and on the monkey. Seeing two rose strings the same length is the whole argument.
- **The rig keeps one scale** (`RIG_SCALE`), so tilting or changing speed never changes how long a string looks. The launcher sits on a tower that shrinks as the stick tilts, so the balls stay above the ground.
- **Aiming high keeps v<sub>ox</sub> the same,** so the time doesn't change and aim height = H + drop is exact. The page says so.
- **A wrong ruler reading or wrong string does not deal new numbers,** because 5, 20, 45, 80 are the student's collected data and don't change. It explains, then has them redo that step. Everything else deals new numbers.
- **Marks are drawn last** so the monkey never hides the one a student needs to count.
- **The prediction is never graded.** It is saved as `prediction` on the student's record.

## Known limits
- Projector mode at 1366 × 768: the calculator covers the answer box until dragged aside, because the large text leaves too little room. The panel moves by its title bar.

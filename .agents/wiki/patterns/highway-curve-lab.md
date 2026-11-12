# Highway Curve Lab (How Fast Is Too Fast?)

> **Tags**: `circular-motion`, `friction`, `centripetal`, `investigation`, `data-table`, `graphing`, `differentiation`, `three.js`, `3d`, `webgl-fallback`, `desmos`, `firestore`, `monitor`, `inline-build`, `cer`, `engineering`
> **Last Updated**: 2026-11-11

Code: `Unit_2/highway_curve_lab/` (edit `src.html`, `js/`, `css/`; `index.html` is built), monitor at `admin/highway_curve_lab_monitor.html` (built from `admin/highway_curve_lab_monitor.src.html`), tests in `tests/highwayCurveLab.test.js`.
Assignment ID: `unit2_day54_highway_curve_lab`. Built on the Centripetal Force Lab's shell: saving, credit, wait timers, Desmos checking, certificate and monitor (see `centripetal-force-lab.md`).

## The teaching goal
On a flat curve, friction from the road is the only force that turns the car, and it points to the center. The friction needed is m × v² ÷ r. The most the road can give is μ × m × g. Go too fast, or lower μ with rain or ice, and the car slides off in a straight line along the tangent. Setting the two equal gives v<sub>max</sub> = √(μ × g × r), and the mass cancels: a heavy truck and a light car have the same fastest safe speed. Students find each of these in their own measurements before any formula is used.

## Lesson order
1. **The Skid (1 pt):** ungraded prediction on a top-down map, then a 3D drive onto an ice patch (the car slides along the tangent into the foam barrier). Aim the slide path and the friction at new spots. Name the force from a pictorial diagram and a free-body diagram side by side.
2. **Measure (1.5 pts):** five trials, read from the instruments (see the table below).
3. **Graph It (1.5 pts):** plot each row of the student's own table by clicking, answer from the graph, predict an untested case, then drive it.
4. **Mass & Weather (1 pt):** drive at one speed and twice that speed and read the grip gauge (2 kN, then 8 kN on the red line). Drive the car and the truck on ice at the same speed: 4 times the grip and 4 times the friction needed. Periods 1–3 answer "how many times the grip"; CP checks the truck's red mark with F<sub>max</sub> = μ × m × g; Honors uses v<sub>max</sub> = √(μ × g × r). CP and Honors then predict which lane is faster, drive the outer lane's fastest speed in both lanes (the inner lane, 4.5 m tighter, slides), and explain it: CP with F = m × v² ÷ r for the inner lane, Honors with the inner lane's v<sub>max</sub>.
5. **Engineer the Sign (1 pt):** read the wet-road fastest speed in mph on the speedometer, pick a yellow curve sign, test it in the rain (too fast and the car slides off) and on ice, then build a claim–evidence–reasoning argument from drop-downs filled with the student's own numbers. There is no notebook page. Period 0 also banks the curve (θ = tan⁻¹(v² ÷ (r × g))) and drives it on glare ice with the friction gauge at 0.
6. **Mastery Check (4 pts):** slide path, friction direction, a new curve from a table, an unfamiliar graph, and speed-counts-twice from Day 52.

## One lab, three ways in
| | Periods 1–3 | Periods 4–6 | Period 0 |
|---|---|---|---|
| Each trial | find the fastest speed that holds: dry, wet, icy car; dry and wet truck | drive 5 speeds on dry road, read speed and friction (kN); then read the dry, wet and icy grip limits | find v<sub>max</sub> for 5 roads (μ = 0.8, 0.2, 0.5, 0.3, 0.6) in 0.5 m/s steps, then v<sub>max</sub>² on the calculator |
| Graph | fastest safe speed by road column (car = circle, truck = square) | F against v with dashed grip lines | v<sub>max</sub> against μ, then straightened with v<sub>max</sub>² |
| From the graph | dry is twice icy; the truck matches the car; predict the truck on ice | click where the curve crosses each grip line | slope = g × r, so find r (the radius label shows “r = ? m” until then); predict gravel (μ = 0.4) |
| Untested case | truck on ice | wet road | gravel |
| Math | no division | read the graph, then v<sub>max</sub> = √(μ × g × r) in Part 4 | rearranged formula, square root, tan⁻¹ |

## Decisions worth keeping
- **Every off-ramp radius is 2k² (32, 50 or 72 m),** so dry and icy limits land on whole numbers (16/8, 20/10, 24/12 m/s) and ice exactly halves the speed. Each student gets one at random.
- **A fastest safe speed has to be proven:** the table only takes a speed that held when there is also a run one step faster that slid. The run log on the task card shows ✅/💥 for each speed tried. Guessing a number fails with a reason ("you have not run 14 m/s yet").
- **The grip gauge is in kN with a red grip-limit mark.** The car's gauge runs 0–10 kN (small marks 0.5), the truck's 0–40 kN (small marks 1), so the needle sits at the same angle for both at the same speed. While sliding, the needle sits on the limit and SLIP! flashes. After a run that holds, the gauge keeps its reading from the turn so it can be read.
- **Part 4 speeds are chosen so the readings land on marks:** v = √(2r) needs exactly 2 kN for the car and is exactly the icy limit for any mass; twice that is exactly the dry limit.
- **The speed sign is tested, not graded by rule:** a sign above the wet-road speed slides off in the test drive and waits before another pick; a sign more than 10 mph below is turned back as "drivers ignore signs that are far too low."
- **3D view:** Three.js r160 is vendored at `assets/vendor/three.min.js` (inlined into `index.html`, so no CDN request). Three camera buttons: 3D (whole curve), Follow (behind the car), Top (straight down). If WebGL can't start, `js/scene3d.js` draws the same world from above on a 2D canvas and only the Top button shows. The instruments are SVG over the 3D view; `A.fit3d()` sizes the 3D view to stop at the instrument panel.
- **Rendering only runs while something moves** (a drive, or rain and snow particles), with the pixel ratio capped at 1.5 and a low-power WebGL context, to go easy on Chromebooks.
- **`?fast` on localhost** speeds up drives 6× and wait timers 20×, for automated play-throughs.

## Math level for each class (audited 2026-11-11, enforced by a test)
- **Periods 1–3:** no calculator, no formulas, no division, no square roots, no μ on screen. Only reading instruments, tables and graphs, and "how many times as big" found by multiplying (× 2, × 3, × 4).
- **Periods 4–6:** one formula at a time, forward only (F<sub>max</sub> = μ × m × g, F = m × v² ÷ r, new F = old F × 4). No square roots or tan⁻¹, matching Day 52.
- **Period 0:** rearranged formulas, square roots, slope, tan⁻¹.

## More decisions
- **The car keeps to the outer (right-hand) lane;** r is that lane's radius, and the road's center line is half a lane inside it.
- **Every finished drive can be watched again** (↻ buttons, or a free-drive slider on finished trials). Replays never change the table.
- **The calculator's use-answer button lives in the title bar** so the keypad leaves room for the typed line. When the window is 37.5rem tall or less (a Chromebook at 125% display size), the calculator docks over the picture instead of the question.
- **The road runs far past the view** into the haze, so it never ends in mid-air.

## Inline build
`node scripts/inline-studio.js Unit_2/highway_curve_lab` and `node scripts/inline-studio.js admin/highway_curve_lab_monitor.src.html`. Rebuild after every edit. Preview without saving: `index.html?preview&view=conceptual` (or `cp`, `honors`). Teacher and preview get `View as`, `🧪 Simulated Data` and the step jumper, the same as the Centripetal Force Lab.

## Teacher-only monitor
Same lock as the other monitors (`isAdmin()` in `firestore.rules`). Shows grade, first-try accuracy, trials, minutes, parts, Mastery Check attempts and the most common mistakes, with a reteach line for each. Linked from `admin/index.html` and the 3D Sprint Progress page. `?demo` sample data runs only on localhost. Mastery Check skills are saved as `{ skill: { right, total } }`, the shape the monitor adds up.

## Status (as of 2026-11-11)
- Built. All three classes played through start to finish by an automated script in headless Chrome with WebGL (SwiftShader) at 1366 × 768: 10/10, certificate earned, no console errors. Unit tests pass (`npx jest tests/highwayCurveLab.test.js`).
- The 2D fallback was checked in a browser with no WebGL.
- Not done yet: posting to Classroom (`deploy-assignment.js`), `npm run verify`, and linking Day 54 in `assets/lessons-data.js` (only after verify passes). Not seen yet: a real Chromebook's WebGL frame rate, and the monitor with real class data.

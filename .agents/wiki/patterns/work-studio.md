# Mechanical Work Studio (Unit 3, Day 2)

> **Tags**: `work`, `energy`, `investigation`, `data-table`, `graphing`, `work-meter`, `differentiation`, `svg`, `desmos`, `firestore`, `monitor`, `inline-build`
> **Last Updated**: 2026-11-16

Code: `Unit_3/work_studio/` (edit `src.html`, `js/`, `css/`; `index.html` is built), monitor at `admin/work_studio_monitor.html` (built from `admin/work_studio_monitor.src.html`), tests in `tests/workStudio.test.js`.
Assignment ID: `unit3_day2_work_studio`. Built on the Centripetal Force Lab's saving, table, graph, Desmos checking, certificate and monitor. See [centripetal-force-lab](centripetal-force-lab.md).

## The teaching goal
A force does work only along the motion. Work can be positive, negative or zero, and its size is W = F × d in joules. Students find that work grows in step with distance in their own measurements before they use the formula on new problems. This is the first calculation day after the Day 1 reading and Eureka! videos. Day 1 did not include direction practice, so Day 2 opens with it.

## Lesson order
1. **Direction Check:** an ungraded prediction (hold still, carry flat, or hoist up), then two hoist tests where the student reads the work meter (holding still: 0 J; lifting 10 kg by 1.5 m: 150 J). Then four scenes, one force each, drawn on the picture with a plain label: pushing a sled (+W), lowering a crate (−W), carrying a box (0 J) and holding a crate still (0 J). Each scene plays its motion first, the student taps **+W**, **0 J** or **−W** on the work meter, then ▶ Play runs the meter.
2. **Measure:** five trials (six in Period 0). Set the pull distance, pull the crate, read the tape measure (m), spring scale (N) and work meter (J), and record the row. The table checks each reading.
3. **Graph It:** drag the "distance" and "work" labels onto the axes (the drop boxes say "bottom: what you SET" and "side: what CHANGED"), plot each row, answer from the graph, then lock in a prediction for a distance never tested and pull it to check.
4. **How Much?:** 6, 8 or 9 problems with the numbers on a picture, answered from the calculator. Multi-box problems keep every finished answer on screen.
5. **Mastery Check:** new situations (forklift, elevator, server with a tray, pushing a wall) in the same watch-and-tap format, a lift or angled-pull calculation, a W against d graph the student did not make, and brake or net work. One question is always a 0 J case.

Parts are worth 6 points and the Mastery Check 4, for 10. Measure, Graph It and How Much? count double.

## One studio, three ways in
| | Periods 1–3 | Periods 4–6 | Period 0 |
|---|---|---|---|
| Distances | 1, 2, 3, 4, 5 m, labeled on the slider | a stop cone with no numbers: short, long, then spread out | same as 4–6, six trials |
| Rope | level | level | at an angle θ (30°–60°) |
| From the graph | ratio tables from their own rows (1 m × 2 → 2 m, 20 J × ? → 40 J), read a value off the line, no division | slope = force, matched to the spring scale, read a value off the line | slope is less than the scale reading, so find F × cos θ |
| Prediction | 8 m from Trial 4 × 2 | 7.5 m from the slope | 7.5 m from the slope |
| How Much? | pull ×2, lift in two boxes ×2, 0 J carrying trap, net work | pull, F = W ÷ d, braking work, 0 J trap, lift, h = W ÷ (m × g), lift-walk-lift, net work | pull, F = W ÷ d, braking work, lift, h = W ÷ (m × g), lift-walk-lift, net work, angled pull, friction worked backward |

Periods 1–6 never see a class label. The first hint is already open for Periods 1–3.

## Decisions worth keeping
- **Every student gets their own rope force** (and angle in Period 0), so two tables side by side don't match.
- **Three instruments, all read by the student.** The tape has a close-up at the red pointer and the spring scale has a needle close-up. A wrong reading names the instrument mix-up ("that is the force in N, read the work meter in J"), never the value.
- **CP and Honors place a stop cone with no numbers on the slider,** so the distance has to be read from the tape. Distances must be at least half a meter apart.
- **Keep the Direction Check small.** An earlier version had free-body diagrams, dragging arrows for motion and force, two forces per scene (including a normal force) and "climbs/drops" wording. The teacher found it overbuilt and confusing. One force per scene, watch first, then tap +W / 0 J / −W.
- **The prediction is not graded when it is typed.** It is locked in, and the test pull checks it. A miss explains why and sends the student back with "Fix my prediction".
- **Say "rope", not "strap".**
- **Slope triangle & read-line guide:** `graph()` draws a dashed Rise/Run (`ΔW`, `Δd`) right triangle when `showTriangle: true` on `Find the slope`, and a vertical `readX` amber guide on `Read your line`.
- **No notebook page.** The handwritten question belongs on the day's handout (see below).

## Still to do
- Add a one-line exit question to `Unit_3/worksheets/Day2_Work_Calculation_Practice` that uses one row of the student's own table.

## Inline build
`node scripts/inline-studio.js Unit_3/work_studio` and `node scripts/inline-studio.js admin/work_studio_monitor.src.html`. Rebuild after every edit to `js/` or `css/`.

Preview without saving: `index.html?preview&view=conceptual` (or `cp`, `honors`). `?fast` on localhost shortens wait timers.

## Status (as of 2026-11-16)
- Built and reviewed with the teacher. A scripted honest play-through finishes every part for all three classes in headless Chrome, scoring 10/10, and the real save data has no values Firestore rejects (about 8 KB per student).
- No scrolling on the tightest pages at 1366 × 768 and 1366 × 650.
- Guest mode resumes after a reload on the same page with the same numbers.
- **Scheduled in Classroom on 2026-11-16** in all 7 periods as "Mechanical Work Studio" under the topic "Unit 3: Work and Energy", 10 points, due Tue 11/17 at 6:00 PM PST. Each period's copy posts itself at that period's start (P0 8:30, P1 9:20, P2 10:10, P3 11:10, P4 12:35, P5 1:55, P6 2:45, same as the Thursday PRIDE TIME schedule) with `deploy-assignment.js --schedule`. A first copy posted immediately was deleted before anyone turned it in. `npm run verify` passed every check, and Day 2 in `assets/lessons-data.js` links the studio.
- Checking a scheduled draft: `courseWork.get` answers "Precondition check failed" for drafts, so list with `courseWorkStates: ['DRAFT']` instead.
- Posting under a topic needed the `classroom.topics.readonly` scope, added to `sync-classroom/auth.js` and re-authorized with `npm run auth`. Earlier topics only worked because their IDs were hard-coded in `deploy-assignment.js`.
- Not seen yet: a real student session on a Chromebook and the monitor with real class data.

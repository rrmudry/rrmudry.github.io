# Student App Standards (How We Build for This Class)

> **Tags**: `standards`, `pedagogy`, `differentiation`, `notation`, `desmos`, `firestore`, `checklist`, `investigation`, `data-table`, `graphing`
> **Last Updated**: 2026-11-11

The teaching standards every student-facing app, worksheet and lesson follows. These came from the teacher's reviews of real apps. To check a finished app against them, use the "Definition of Done" in `.agent/workflows/create-student-webapp.md`.

Read these two pages with it: `student-task-engagement.md` (every activity needs a clear finish line or has to be genuinely fun) and `cast-aligned-webapp-design.md` (students read the instruments themselves).

This repo is a public website, so keep this page about how we teach. Don't describe students, and don't explain how records get flagged.

## Physics and wording
- **g = 10 m/s²** on Earth, with the unit written as m/s², never N/kg. Other worlds keep their real values (Moon 1.6, Mars 3.7, Jupiter 24.8 m/s²). Some older content uses 9.8. Point it out, but don't change it unless asked.
- **Say "net force"**, not ΣF. Honors uses signs: right +, left −.
- **Keep the real term and explain it.** Write "photogate" and define it in place. Don't swap in a friendlier name.
- **Use "Mr. Mudry"** on certificates and other student-facing materials.
- **Write for students who are still building reading and math confidence:** short sentences, everyday words and a read-aloud button.

## How math looks
- **Real subscripts:** F<sub>net</sub>, not F_net. Canvases draw a true lowered subscript. No LaTeX anywhere.
- **Stack calculations one step per line,** with the symbol repeated, the equals signs lined up and units on the numbers:

  ```text
  ΔX = vox × t
  ΔX = 20 m/s × 6 s
  ΔX = 120 m
  ```

  Never chain them, like ΔX = v<sub>ox</sub> × t = 20 × 6 = 120 m. Reference: `PR.stack` in `Unit_2/projectile_range_studio/js/physics.js`.
- **A formula line never wraps.** Keep each number with its unit and the spaces around =, −, +, ×, ÷ non-breaking. Reference: `subHTML` in `Unit_2/projectile_range_studio/js/text.js`.

## How a lesson moves
- **One instruction or question on screen at a time.** No long checklists.
- **Teach a new idea before asking about it.** Use a concrete example or picture first, then the math. Use position words like "touches θ" rather than "short side," and show the formula above any answer box.
- **Tie words to numbers and name look-alike symbols.** Say that "most" means 86.6%, and label symbols like v<sub>o</sub> and v<sub>ox</sub> by what they mean.
- **Force topics show two diagrams side by side:** a pictorial "forces on the object" diagram and a technically correct free-body diagram.
- **Start concrete:** observe, then one-step calculations, then prediction and transfer. Early on, have students read values off a picture and reason before they meet a formula.
- **Every teaching page ends with something to do,** not a bare Next button. The task should need the words on the page, such as "set the speed to 8 m/s and run it," so the page can't be passed without reading it.
- **Predict, measure, then explain.** Before a new idea is shown, ask for an ungraded prediction. Then the student tests it and says what was different.
- **A correct answer is needed to move forward.** A wrong answer explains why, then deals new numbers and restarts that problem. If the student's own collected data would be erased, explain and redo that step with new values instead.
- **Trying every option must not work.** After a miss, the explanation stays up for a few seconds before "Try new numbers" turns on, and the student redoes the observation where there is one. A missed choice question then needs 2 right in a row on new versions.
- **A later step gets no credit for carrying a wrong idea forward.** Follow-through credit is for arithmetic slips, not for the step that holds the main idea.
- **Back on every step.** Earlier numbers and answers return, and credit never drops. Hide Back while a wrong answer is showing.
- **Hints open one at a time, with no penalty,** and spell out conversions such as cm → m.
- **Everything needed for the question is on screen with it at Chromebook size (1366 × 768),** with no scrolling to find it.
- **The picture doesn't change size** from step to step, and buttons stay where they are.

## Student work has to be their own
- **Calculation answers come only from the embedded Desmos calculator,** and the calculator line has to show real work. Measurements and setup boxes can stay typed.
- **Numbers live on the picture or apparatus,** not in the question's words.
- **Answers are things the student does:** drag the arrow, click the point on the graph, set the apparatus, read the instrument. These have too many possible answers to guess. Multiple choice is the last resort, and never the main way a part is passed.
- **Answers depend on the student's own data.** Each student's trials use different values, and questions ask about their table or their graph. No single screen should hold the whole answer.
- **End with a short handwritten question** that uses the student's own numbers from the app, such as one row of their table and what it shows. Put it on the day's handout or exit card.
- **No "write it in your notebook" pages inside an app.** The teacher doesn't collect them, and students don't know where to write. Any handwritten question goes on the day's handout or exit card, never as an app page that waits for a button.

## Investigate first: measure, record, graph
Any activity that teaches how one quantity depends on another is built as an investigation, not as reading followed by questions. This applies to studios and workshops, not only labs.

1. **Set one variable and run a trial.** The student chooses the value. Everything else stays fixed and is labeled on the apparatus.
2. **Read an instrument:** a stopwatch, ruler, protractor, scale or sensor readout. The app never fills in the measurement.
3. **Record it in a data table.** The app checks each entry against the simulation within a fair tolerance and says what to re-read when it is off. It doesn't give the value.
4. **Repeat for 5 or 6 trials,** so there is enough data to see a pattern.
5. **Graph their own points.** Students place the points themselves, or watch their table rows appear one at a time. Axes carry labels and units.
6. **Answer from the graph or table:** read a value, click two points for a slope, pick the row that shows the pattern, or say what kind of line it is.
7. **Predict a case they didn't test, then test it.** This is the check that the pattern was understood.

- **Show where to look first, then fade that help.**
- **The same data, different ways in by class.** Periods 1–3 read the pattern straight off the table or graph ("twice the speed, 4 times as big") with no division. Periods 4–6 find a slope or use the formula. Period 0 also straightens a curve by changing what is graphed, such as a<sub>c</sub> against v².
- **Plan for most of a class period.** An activity that can be finished in a few minutes isn't asking for enough.

## One app, every class
Classes come from `roster/{id}.class_period`:

| Periods | Class | Approach |
|---|---|---|
| 0 | Honors Physics | Higher-level parts are required |
| 1–3 | Conceptual Physics | Worked rows, first hint open, multi-step work split into boxes, a visual route with no division |
| 4–6 | CP Physics | The standard path |

- When a lesson differs by class, use the same problem with different ways in. See `projectile-range-studio.md`.
- **No labels below Honors:** Periods 1–6 never see an Honors badge, toggle or mention. Extra support appears with no label.
- The teacher can preview each class with a "View as" switch.

## Saving and grades
- **School Google sign-in and Firestore,** with an ungraded guest mode. Student doc IDs are the email prefix.
- **Resume on any device** on the same page with the same numbers.
- **Credit grows step by step.** Don't hold a section's points until the whole section is finished.
- **The default grade** is points for the guided parts plus a Mastery Check. The best score counts and is never lowered.
- **Credit never drops, but moving on has to be earned.** Slow guessing down with streaks and redo steps, never by taking points away.
- **The Mastery Check uses new situations,** not the practice problems with new numbers. It brings back at least one idea from an earlier day. Before a retake, the student goes through a short review of what they missed.
- **Save the time spent on each page and the tries on each question.** The teacher monitor shows first-try accuracy next to the score.
- **Certificate:** a PDF for finishing every part and scoring 75% or higher on the Mastery Check. Signed-in students only. Reference: `Unit_2/projectile_range_studio/js/certificate.js`.
- **Teacher monitor:** progress is visible only to teacher accounts, enforced by `firestore.rules`.

## Lesson links on dashboards and outlines
- **Only link materials that exist and were made for that lesson.** If a day's worksheet, slides or app isn't built yet, leave `links` and `resources` empty in `assets/lessons-data.js` and write "None yet" in the outline. Never fill the gap with a loosely related app or an older deck.
- **Check what a link actually opens before reusing it.** Labels copied from older entries can be wrong. For example, the Google Slides deck `10-afry9hEiN…` is *Fantasy Map Ideas and Tips* (Unit 2 Day 1), not friction or equilibrium notes.
- **The first link becomes an embedded preview** in the dashboard's lesson modal, so a wrong link shows up front and center.

## Reference apps
- `Unit_2/centripetal_workshop/`: direction before size, lettered arrow/path picks, lap time and fastest curve speed for Honors, inline build (`scripts/inline-studio.js`). *(See `centripetal-acceleration-workshop.md` for the 2026-11-09 open design review on closing guessing loopholes: removing follow-through credit on `newac` when `factor` is wrong, adding a read-why cooldown on `Try new numbers`, and requiring 2 in a row after a multiple-choice miss.)*
- `Unit_2/projectile_range_studio/`: three-class lesson, Back, stacked math, certificate, monitor.
- `Unit_2/monkey_hunter_studio/`: drag-to-build apparatus, a slider on the picture, an ungraded prediction page.
- `Unit_2/vector_decomposition_studio/`: Desmos work checking, step-by-step credit.
- `Unit_2/centripetal_force_lab/`: the model investigation. Read a dial, fill a checked table, plot your own points, predict and test an untested case, with guess-proof picks. Start here for an investigation. *(See `centripetal-force-lab.md`.)*
- `Unit_2/horizontal_projectile_workbench/`: measure, table and graph tasks.
- `Unit_2/newtons_second_law_studio/`: guided lessons with force diagrams.

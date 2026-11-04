# Student App Standards (How We Build for This Class)

> **Tags**: `standards`, `pedagogy`, `differentiation`, `notation`, `desmos`, `firestore`, `checklist`
> **Last Updated**: 2026-11-03

The teaching standards every student-facing app, worksheet and lesson follows. These came from the teacher's reviews of real apps. To check a finished app against them, use the "Definition of Done" in `.agent/workflows/create-student-webapp.md`.

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
- **A correct answer is needed to move forward.** A wrong answer explains why, then deals new numbers and restarts that problem. If the student's own collected data would be erased, explain and redo that step with new values instead.
- **Back on every step.** Earlier numbers and answers return, and credit never drops. Hide Back while a wrong answer is showing.
- **Hints open one at a time, with no penalty,** and spell out conversions such as cm → m.
- **Everything needed for the question is on screen with it at Chromebook size (1366 × 768),** with no scrolling to find it.
- **The picture doesn't change size** from step to step, and buttons stay where they are.

## Student work has to be their own
- **Calculation answers come only from the embedded Desmos calculator,** and the calculator line has to show real work. Measurements and setup boxes can stay typed.
- **Numbers live on the picture or apparatus,** not in the question's words.
- **In labs, students measure, record, then graph their own data.** Questions need the table or graph, such as clicking a row or two points for a slope. Show where to look first, then fade that help.

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
- **Certificate:** a PDF for finishing every part and scoring 75% or higher on the Mastery Check. Signed-in students only. Reference: `Unit_2/projectile_range_studio/js/certificate.js`.
- **Teacher monitor:** progress is visible only to teacher accounts, enforced by `firestore.rules`.

## Reference apps
- `Unit_2/projectile_range_studio/`: three-class lesson, Back, stacked math, certificate, monitor.
- `Unit_2/vector_decomposition_studio/`: Desmos work checking, step-by-step credit.
- `Unit_2/horizontal_projectile_workbench/`: measure, table and graph tasks.
- `Unit_2/newtons_second_law_studio/`: guided lessons with force diagrams.

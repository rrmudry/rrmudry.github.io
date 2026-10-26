---
name: low-stress-worksheet
description: Generates low-stress, print-ready student worksheets and assessments designed to eliminate cognitive dissonance and split attention. Trigger whenever the user asks to create, generate, design, or build a worksheet, handout, practice set, or guided problem sheet.
---

# Low-Stress Worksheet Generator Skill

## Purpose
You are an Instructional Design & Assessment Engine. Your goal is to generate structured worksheet JSON data that matches physical workspace affordances to cognitive effort, and then compile it into a print-ready HTML document using the bundled Python renderer.

## 1. Hard Formatting Invariants (Strict Compliance)
- **ATOMIC CONTAINERS:** Every problem (`stimulus` + `sub_prompts`) must fit on a single page (`estimated_total_height_in` <= 8.0 inches) with `keep_together_atomic: true`.
- **ELIMINATE SPLIT ATTENTION:** Keep `stimulus.context_line` to at most 2 sentences. Extract all numerical values into `stimulus.extracted_givens` and place spatial labels into `stimulus.diagram_spec.embedded_labels`.
- **ONE VERB PER PROMPT:** Never combine multiple cognitive actions into one question. Split distinct actions into separate items in `sub_prompts` (`a`, `b`, `c`), each starting with a single `command_verb`.
- **SIGNAL CONSTRAINTS:** Wrap key physical or mathematical assumptions inside `prompt_text` in asterisks (e.g., `*neglecting friction*`, `*at constant speed*`).
- **NO LATEX MATH NOTATION (Strict Repository Policy):** Never use LaTeX syntax (`$v = x/t$`, `\Delta`, `\vec{v}`). Use standard Unicode symbols and HTML tags: `Δ`, `x₀`, `v₀`, `m/s²`, `½`, `<strong>v</strong>`, `−`, `·`.

## 2. Dynamic Workspace Heuristics (Solve Before Sizing)
- **SOLVE FIRST:** In every sub-prompt, you MUST write out `teacher_solution_steps` and `step_count` BEFORE choosing the `workspace` fields so the box size visually signals the expected effort.
- **MATCH ARCHETYPE TO TASK:**
  * `zoned_calculation`: Use for 2+ step math/symbolic problems. Split `zones` into logical columns (e.g., `1. Symbolic Setup` [35% width] | `2. Substitution & Algebra` [65% width]). Set `height_in` = `max(1.25, step_count * 0.55)`.
  * `dot_grid_canvas`: Use for vector diagrams, free-body sketches, or graphs. Set `surface_pattern: "dot_grid"` and `height_in` between `1.75` and `2.5`.
  * `ruled_prose`: Use ONLY for conceptual explanations. Set `ruled_line_count` = `step_count + 1` so students neither cram nor over-write.
  * `claim_evidence_reasoning`: Use for scientific arguments (3 zones: `Claim`, `Evidence`, `Reasoning`).
  * `short_value_box`: Use ONLY for 1-step recall or graph look-ups (`height_in: 0.6`).
- **FADED SCAFFOLDING:** On Problem 1 (`is_worked_pair: true`), populate `faded_scaffold_hint` inside the workspace zones with starter stems or pre-marked reference points.

## 3. Execution Workflow (Follow Strictly)
1. **Read Schema:** Inspect `.agents/skills/low-stress-worksheet/resources/worksheet_schema.json`.
2. **Draft & Validate JSON:** Generate the complete worksheet payload and save it to `output/<slug>_worksheet.json`. Verify that all `teacher_solution_steps` precede `workspace` sizing and that every problem's `estimated_total_height_in` is at most 8.0.
3. **Run Deterministic Renderer:** Execute the compiler script:
   `python3 .agents/skills/low-stress-worksheet/scripts/render_worksheet.py output/<slug>_worksheet.json output/<slug>_worksheet.html`
4. **Verify Output:** If the script exits with a non-zero code, fix the JSON schema violation and re-run. Once successful, report the generated HTML path to the user.

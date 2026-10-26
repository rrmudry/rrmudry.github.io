# Low-Stress Worksheet Generator Skill Pattern

> **Tags**: `worksheet`, `printable`, `pdf`, `cognitive-load`, `atomic-container`, `split-attention`, `skill`, `python-renderer`, `no-latex`  
> **Last Updated**: 2026-10-25

---

## 1. Overview & Pedagogical Philosophy

The **Low-Stress Worksheet Generator** (`.agents/skills/low-stress-worksheet/`) is an instructional design and assessment engine built on Antigravity's native Skill + Script architecture:
1. **The Brain (`SKILL.md`)**: Heuristics, cognitive load principles, prompt formatting rules, and dynamic workspace sizing formulas.
2. **The Contract (`resources/worksheet_schema.json`)**: Formal JSON schema specifying problem anatomy, stimulus decomposition, workspace archetypes, and print constraints.
3. **The Muscle (`scripts/render_worksheet.py`)**: Zero-dependency Python 3 compiler converting validated JSON payloads into print-ready, atomic HTML5 documents with CSS print media formatting.

### Core Cognitive Load Goals
- **Eliminate Split-Attention**: Students should never have to hunt across paragraphs for numerical givens or match detached figure labels to text. Givens are extracted into a structured card; diagram tags are embedded directly in visual specs.
- **Match Affordance to Effort**: The physical size and surface pattern of a workspace directly signals the expected solution depth. If a problem takes 3 steps, the box height is calculated precisely to fit 3 steps. If an explanation requires 2 ideas, exactly 3 ruled lines are provided—preventing both answer cramming and intimidation.
- **Atomic Problem Containers**: Every problem card is strictly self-contained. Problems never break awkwardly across physical page margins.
- **Signal Implicit Constraints**: Mathematical and physical boundary conditions (e.g., `*neglecting air resistance*`, `*at constant velocity*`) are highlighted with subtle styling to train students to notice constraints without visual clutter.

---

## 2. Directory Structure & Discovery

```text
rrmudry.github.io/
├── .agents/skills/low-stress-worksheet/
│   ├── SKILL.md                        # Frontmatter triggers & heuristics
│   ├── resources/
│   │   └── worksheet_schema.json       # JSON schema specification
│   └── scripts/
│       └── render_worksheet.py         # Deterministic HTML/Print compiler
├── .agent/skills/low-stress-worksheet  # Symlink to .agents/skills/
└── output/
    ├── <slug>_worksheet.json           # Agent-generated structured data
    └── <slug>_worksheet.html           # Compiled print-ready HTML
```

*Note: Antigravity native discovery supports `.agents/skills/`. A symlink at `.agent/skills/` ensures compatibility across naming conventions.*

---

## 3. Hard Formatting Invariants

| Rule | Specification | Rationale |
|---|---|---|
| **Atomic Containers** | `estimated_total_height_in <= 8.0` with `keep_together_atomic: true` | Prevents multi-page spillover when printed on standard Letter paper (8.5 × 11 in with 0.5 in margins). |
| **Split-Attention Elimination** | `context_line` <= 2 sentences; givens extracted into `extracted_givens` array | High school students lose working memory tracking narrative word problems. Separating context from numerical data focuses cognitive effort on physics modeling. |
| **One Verb Per Sub-Prompt** | Each sub-prompt starts with a single `command_verb` (e.g. `Calculate`, `Sketch`, `Identify`) | Prevents compound questions where students miss the second half of a prompt. |
| **Signal Constraints** | Wrap constraints in asterisks: `*neglecting friction*` | Compiles to `<em class="constraint">` with clean underline styling. |
| **No-LaTeX Math** | Standard Unicode (`Δ`, `²`, `³`, `·`, `−`, `x₀`) & HTML (`<strong>F</strong>_net`) | Strictly complies with repository-wide policy. LaTeX syntax renders broken glyph boxes on Chromebooks and browsers lacking KaTeX. |

---

## 4. Dynamic Workspace Heuristics ("Solve Before Sizing")

Before choosing workspace dimensions, the agent MUST write out the complete teacher solution steps and count the required steps:

### Archetype Selection Table

| Archetype | Surface Pattern | Height Formula | Default Zones / Structure |
|---|---|---|---|
| `zoned_calculation` | `blank_open` | `max(1.25, step_count * 0.55)` in | `1. Symbolic Setup` (35% width) + `2. Substitution & Algebra` (65% width) |
| `dot_grid_canvas` | `dot_grid` (14px radial gradient) | `1.75` to `2.5` in | Single open canvas for FBDs, coordinate vectors, or graphs |
| `ruled_prose` | `ruled_lines` (0.32 in spacing) | Automatic based on line count | `ruled_line_count = step_count + 1` |
| `claim_evidence_reasoning` | `ruled_lines` or `blank_open` | `2.5` to `3.2` in | 3 vertical zones: `Claim`, `Evidence`, `Reasoning` |
| `short_value_box` | `blank_open` | `0.6` in | 1-step recall, slope extraction, or single value lookup |

### Faded Scaffolding
On Problem 1 (`is_worked_pair: true`), the first calculation zone provides a `faded_scaffold_hint` (e.g., starter equation stem `F_net = m · a` or diagram coordinate origin) rendered in muted italic ink. Problem 2 removes scaffolding completely to assess independent mastery.

---

## 5. Compiler Script Features (`render_worksheet.py`)

- **Zero External Dependencies**: Uses standard Python 3 libraries (`html`, `json`, `re`, `sys`, `pathlib`).
- **Atomic Height Enforcement**: The script calculates/validates `estimated_total_height_in <= 8.0` for each problem. If a problem exceeds the 8.0 in threshold, compilation exits immediately with code `2`, alerting the agent to prune steps or split problems.
- **CSS Print Optimization**:
  ```css
  @page { size: letter; margin: 0.5in; }
  .problem-card {
    break-inside: avoid;
    page-break-inside: avoid;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 14px;
    margin-bottom: 20px;
    background: #ffffff;
  }
  ```
- **Interactive Teacher Key Toggle**: A screen-only toolbar button (`Toggle Teacher Key`) reveals step-by-step teacher solutions directly below each prompt for fast grading in class, automatically hidden during `@media print`.

---

## 6. Standard Agent Workflow

When invoked to generate a worksheet:
1. **Inspect Schema**: Verify input properties against `.agents/skills/low-stress-worksheet/resources/worksheet_schema.json`.
2. **Draft & Validate JSON**: Generate `output/<slug>_worksheet.json`. Solve all problems first, calculate heights, and confirm `estimated_total_height_in <= 8.0`.
3. **Run Compiler**:
   ```bash
   python3 .agents/skills/low-stress-worksheet/scripts/render_worksheet.py output/<slug>_worksheet.json output/<slug>_worksheet.html
   ```
4. **Inspect Output**: Verify exit code 0. If exit code 2, adjust sub-prompts or reduce heights and re-compile.

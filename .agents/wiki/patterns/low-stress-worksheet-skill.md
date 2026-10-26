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

---

## 7. Advanced Layout & Cognitive Dissonance Invariants

Derived from empirical print inspections of `Sea_Floor_Example_3` and `Newtons_2nd_Law_Example_2`:

1. **Two-Column Flex Prompt Row**: Structure every `.prompt-line` as a 2-column flex row (`display: flex; align-items: flex-start; gap: 8px;`). Place `☐ (N) VERB` in `.prompt-badge-group` (`flex-shrink: 0; white-space: nowrap;`) and prompt text in `.prompt-body` (`flex: 1; min-width: 0;`), preventing wrapped lines from overlapping numbering badges.
2. **Dynamic Symbolic Formula Generation**: Never hardcode generic `Δy / Δx = (y₂ − y₁) / (x₂ − x₁)` equations when the problem solves for inverse slope (e.g. `Speed = ΔDistance / ΔAge = (x₂ − x₁) / (y₂ − y₁)` in `km/Ma`), ratios, or differences. Derive formulas dynamically from target units.
3. **Student-Accessible Experimental Controls**: Limit Page 1 controls to at most 2 short, plain-English bullet points at an 8th-to-10th grade reading level; eliminate sensor tolerances and technical jargon.
4. **Clean Graph Axis Labels & Single Consistent Legend Markers**: Format axis labels as `[Variable Name] ([Unit Symbol])` (e.g. `Oceanic Crust Age (Ma)` and `Distance from Ridge Crest (km)`); use a single consistent marker per series across data table, graph legend, and prompt text. Regression trendlines with dashed strokes must render a dashed line segment (`- -`) in the legend key rather than an unrepresentative point/circle marker.
5. **Unpacked CER Checklists**: Limit the main Question 4 CER prompt to a single sentence; place specific criteria as checkable micro-items (`☐`) directly into `ZONE A`, `ZONE B`, and `ZONE C` headers.
6. **Clean Sub-Headers & Unicode Ballot Boxes**: Ensure headers are free of OCR typos (`ZONE C: REASONING (CONNECT EVIDENCE TO SCIENTIFIC PRINCIPLES & CAUSAL MECHANISMS)`) and use uniform `☐` for multiple-choice options instead of ASCII `[ ]`.
7. **Compact Running Header on Page 2**: Replace repeated multi-line banners with a single-line running header (`Title | Student: _____ | Period: ___ | Page 2 of 2`) to preserve 0.75+ inches of vertical workspace for student handwriting.
8. **Mathematical Subscripts & Banning Programmer Underscores**: Never use multi-letter underscore variables (`F_net`, `P_rate`, `F_net₂`) in student-facing equations or text. Use standard single-letter symbols with HTML subscripts (`F<sub>net</sub>`, `F₂ − F₁`, `R<sub>O₂</sub>`, `ΔO₂ / ΔIntensity`). Chemical formulas must always use subscripts (`O₂`, `CO₂`, `NaHCO₃`, `H₂O`). The rendering pipeline incorporates a regex sanitizer (`([A-Za-z]+)_([A-Za-z0-9]+) -> \1<sub>\2</sub>`) and strips duplicate prefix tokens like `F_ F_net`.
9. **CER Zone Header Spacing & Em-Dash Separators**: Use uniform separators with explicit spacing: `ZONE A — CLAIM:`, `ZONE B — EVIDENCE:`, `ZONE C — REASONING:`.
10. **Synchronized Table 1 Numbering**: Always label the primary data table on Page 1 as `Table 1: [Title]` so it matches the `"from Table 1"` reference in Question 4 Zone B across all scenarios.
11. **Single Ballot Boxes & 2-Column Options Grid**: Strip any leading `☐` or `[ ]` from JSON options before rendering; let the template prepend a single `<span class="mc-box">☐</span>`. Concise multiple choice options render in a balanced 2-column grid (`grid-template-columns: 1fr 1fr; gap: 4px 16px;`) rather than crowding onto a single line.
12. **Slashed Zero Suppression**: Enforce `font-variant-numeric: normal; font-feature-settings: "zero" 0;` and a clean sans-serif font stack (`Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) on coordinate boxes and values so zeros never render with a diagonal slash resembling Greek theta ($\theta$).
13. **Prompt Container Isolation & Dynamic Clearance**: Ensure `.prompt-line` has `height: auto; overflow: visible; margin-bottom: 8px; line-height: 1.35;` and `.ws-calc-box` has `margin-top: 6px; clear: both;`, preventing 2-line wrapped prompts (e.g., Chemical Kinetics Q3) from overlapping calculation workspace top borders.
14. **CER Zone Header Concatenation Guard (`ZONE BEVIDENCE` Fix)**: All code paths (default template and custom override branches) must enforce strict `"☐ ZONE [A-C] — [LABEL]: "` formatting with an em-dash and space. Custom zone criteria overrides must never strip or concatenate the header token into `"ZONE BEVIDENCE"` or `"ZONE CREASONING"`.
15. **Synchronized Numeric Precision Between Tables and Prompts**: Number formatting applied to data table cells must strictly match question text and prompt citations. If a trial data point has 2 decimal places of precision (e.g., `2.75 mL/s` in Chemical Kinetics Trial 5), Table 1 must render `2.75` (never truncating to `2.8` while Question 5 cites `2.75 mL/s`).
16. **Standardized Symmetrical Blank Substitution Fractions**: Blank fraction fill-in slots in calculation boxes must follow clean, symmetrical formatting: `= ( ____ − ____ ) / ( ____ − ____ )`. Workspace scratch watermark must read `"Show work: substitution, arithmetic & unit simplification"`.
17. **Chemical Equation Reaction String & Case-Sensitive Title Preservation**: Remove stray characters and ensure proper punctuation in chemical reactions (`+ Heat.`). Never apply `text-transform: uppercase` to table banners or captions containing chemical formulas, ensuring elements like `HCl` or `NaCl` do not corrupt into `HCL` or `NACL`.


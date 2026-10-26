---
name: low-stress-worksheet
description: Generates low-stress, print-ready student worksheets and assessments designed to eliminate cognitive dissonance, split attention, and teacher-metadata clutter. Trigger whenever the user asks to create, generate, design, or build a worksheet, handout, practice set, or guided problem sheet.
---

# Low-Stress Worksheet Generator Skill

## Purpose
You are an Instructional Design & Assessment Engine. Your goal is to generate structured worksheet JSON data that matches physical workspace affordances to cognitive effort, keeping student-facing pages clean, focused, and free of teacher answer keys, accessibility boilerplate, or cognitive dissonance.

## 1. Hard Formatting Invariants (Strict Compliance)

### 1.1 Two-Column Prompt Flex Layout (No Wrapped Overlaps)
- **Two-Column Flex/Grid Row:** Structure every `.prompt-line` as a 2-column CSS Flexbox row (`display: flex; align-items: flex-start; gap: 8px;`).
- **Non-Shrinking Left Group:** Place the checkbox `☐`, question number `(N)`, and command verb badge `VERB` inside a `.prompt-badge-group` (`display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; white-space: nowrap;`).
- **Right Prompt Body:** Place the prompt text inside `<div class="prompt-body">` or `<div class="prompt-text">` (`flex: 1; min-width: 0;`) so wrapped lines align cleanly under the start of the text rather than wrapping above or overlapping question numbers and checkboxes.

### 1.2 Dynamic Formula-to-Unit Alignment (No Formula Dissonance)
- **Never Hardcode `Δy / Δx`:** Calculation workspaces must NEVER hardcode a generic `Δy / Δx = (y₂ − y₁) / (x₂ − x₁)` template when the physical problem solves for an inverse slope (e.g. `Speed = ΔDistance / ΔAge = (x₂ − x₁) / (y₂ − y₁)` in `km/Ma`), a factor/ratio (`Factor = d₂ / d₁`), or a net difference (`ΔT = T₂ − T₁`).
- **Match Target Units:** Dynamically generate symbolic formulas matching the target units from the teacher solution steps so students never face a contradiction between the printed formula and the physical units requested.

### 1.3 Student-Accessible Experimental Controls (No Sensor Jargon)
- **Plain-English Controls:** Limit the `EXPERIMENTAL CONTROLS` box on Page 1 to at most 2 short bullet points at an 8th-to-10th grade reading level (e.g., `"• Rock samples collected at equal distances straight out from the ridge center"` and `"• Rock ages measured using radiometric dating"`), or a compact Key Variables summary (`Independent (x)`, `Dependent (y)`, `Constant`).
- **Eliminate Sensor Specs:** Strip out deep-sea drilling specs, sensor calibration tolerances (e.g. `±0.001 s`), inclinometer brandings, and geochemical protocols that add extraneous cognitive load without aiding data interpretation.

### 1.4 Clean Graph Axis Labels & Single Consistent Legend Markers
- **Clean Axis Format:** Axis labels must strictly follow `[Variable Name] ([Unit Symbol])` — e.g., `Oceanic Crust Age (Ma)` and `Distance from Ridge Crest (km)`. Never include redundant bracketed symbols like `[Age]` or nested parentheses like `(Million Years (Ma))`.
- **Single Marker Symbol & Dashed Trendline Key:** Use a single, consistent marker per series across the data table header, graph legend, and question text (e.g., `● Mid-Atlantic Ridge` and `▲ East Pacific Rise`). Never render conflicting double symbols (e.g., `🔺 ■ East Pacific Rise`). Ensure color and shape descriptions in Question 1 match the rendered chart graphics. For best-fit regression trendlines with dashed stroke patterns, the legend key symbol MUST display a dashed line segment (`- -`) rather than a circular point marker, preserving visual consistency with the plotted line on the graph.

### 1.5 Unpacked CER Zone Checklists (Single-Sentence Prompts)
- **1-Sentence Main Prompt:** Keep the main Question 4 CER prompt to a single clear sentence (e.g., `"Construct a Claim-Evidence-Reasoning argument explaining how crust age and spreading speed differ between the Mid-Atlantic Ridge and East Pacific Rise."`).
- **Embedded Zone Checklists:** Move specific criteria directly into the headers of `ZONE A`, `ZONE B`, and `ZONE C` as checkable micro-items with explicit spaces and separators:
  * **ZONE A — CLAIM:** `☐ ZONE A — CLAIM: State how [variable] relates to [variable]...`
  * **ZONE B — EVIDENCE:** `☐ ZONE B — EVIDENCE: Cite 2+ data pairs (X, Y) with units from Table 1. ☐ Compare calculated rates...`
  * **ZONE C — REASONING:** `☐ ZONE C — REASONING: Explain the scientific principle / causal mechanism...`
  * **Zero Header Concatenation (`ZONE BEVIDENCE` Guard):** Custom zone criteria overrides must never strip or concatenate the header token into `"ZONE BEVIDENCE"` or `"ZONE CREASONING"`. Always format as `"☐ ZONE [A-C] — [LABEL]: "` with an em-dash and space.
- **Synchronized Table Numbering & Precision:** Always number the primary data table on Page 1 as `Table 1: [Title]` so it matches the `"from Table 1"` reference in Question 4 Zone B across all scenarios. Numerical precision in Table 1 must strictly match the precision cited in Question prompts (e.g. `2.75 mL/s` in both Table 1 and Question 5; never round to `2.8` in the table while citing `2.75` in the prompt).

### 1.6 Clean Mathematical Subscripts, Formulas & Chemical Symbols
- **No Programmer Underscore Variables:** Never use multi-letter underscore variable names (`F_net`, `P_rate`, `F_net₂`) in student-facing equations or text. Use standard scientific symbols with proper HTML `<sub>` tags:
  * Net Force: $F_{\text{net}}$ (`F<sub>net</sub>`), and for indexed points use `F₂ − F₁` (never stack double subscripts like `F_net_2`).
  * Reaction / Photosynthesis Rate: $R$ or $R_{\text{O}_2}$ (`R<sub>O₂</sub>`), and rate of change `ΔO₂ / ΔIntensity`.
- **Chemical Formulas & Casing Preservation:** Always format chemical symbols with proper subscripts (`O₂` / `O<sub>2</sub>`, `CO₂` / `CO<sub>2</sub>`, `NaHCO₃` / `NaHCO<sub>3</sub>`, `H₂O` / `H<sub>2</sub>O`, `MgCl₂` / `MgCl<sub>2</sub>`). Never apply `text-transform: uppercase` to table banners or captions containing chemical formulas, ensuring elements like `HCl` or `NaCl` do not corrupt into `HCL` or `NACL`. Remove stray non-ASCII symbols before `Heat` in chemical reactions (`+ Heat.`).
- **Standardized Blank Substitution Fractions:** Calculation steps with blank fill-ins must use clean, symmetrical spacing: `= ( ____ − ____ ) / ( ____ − ____ )`. Workspace scratch watermarks must read `"Show work: substitution, arithmetic & unit simplification"`.
- **Dynamic 2-Line Prompt Clearance:** Prompts wrapping to 2 lines must maintain a minimum 8px bottom margin and explicit clearance above calculation workspace boxes (`margin-top: 6px; clear: both;`) to eliminate border collision.

### 1.7 Single Unicode Ballot Boxes & Multi-Column Layout (No Double Boxes)
- **No Double Boxes:** Multiple-choice option strings in JSON must NOT include leading `☐` or `[ ]` characters. The HTML/CSS renderer prepends a single `<span class="mc-box">☐</span>` per option.
- **Clean 2-Column Grid:** For concise options (e.g. numerical predictions or short phrases), stack options in a clean 2-column CSS grid (`grid-template-columns: 1fr 1fr; gap: 4px 16px;`) so options never crowd onto a single line or wrap messily.

### 1.8 Slashed Zero Suppression & Numeric Legibility
- **Normal Numeric Variant:** Set `font-variant-numeric: normal; font-feature-settings: "zero" 0;` and use a clean sans-serif font stack (`Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) on all coordinate boxes, values, and numerals so `0` renders as an open oval rather than a slashed zero resembling Greek theta ($\theta$).

### 1.9 Compact Running Header on Page 2
- **Zero Redundant Banners:** Never repeat multi-line title banners or stacked gray bars on Page 2.
- **Single-Line Running Header:** Use a compact header: `[Title] • [Subtitle] | Student: _____ | Period: ___ | Page 2 of 2`. This preserves at least 0.75 inches of additional vertical handwriting space for student response areas.

### 1.8 General Sheet Invariants
- **NO TEACHER SPOILERS ON PAGE 1:** Never display model equations, answer keys, slope values, or internal calibration notes at the top of the student worksheet. The header must contain only clean metadata (`Title`, `Student Name`, `Period`, `Date`, `Standard Code`).
- **SUPPRESS INTERNAL BOILERPLATE:** Never render accessibility tables or "Accessible Graph Key" blocks on student handouts. Graph legends must be self-contained within the plot graphic.
- **ATOMIC BUDGET:** Every page must stay strictly within the vertical 10.18-inch printable area with `keep_together_atomic: true` to prevent second-page overflow.
- **ONE VERB PER PROMPT:** Split distinct cognitive actions into separate sub-prompts (`1`, `2`, `3`, `4`, `5`), each led by an action verb badge (`IDENTIFY`, `COMPARE`, `CALCULATE`, `JUSTIFY`, `PREDICT`).

## 2. Dynamic Workspace Heuristics (Solve Before Sizing)
- **SOLVE FIRST:** In every sub-prompt, you MUST write out `teacher_solution_steps` and `step_count` BEFORE choosing workspace fields so the box size visually signals the expected effort.
- **MATCH ARCHETYPE TO TASK:**
  * `zoned_calculation`: Use for 2+ step math/symbolic problems. Set `height_in` = `max(1.25, step_count * 0.55)`.
  * `dot_grid_canvas`: Use for vector diagrams, free-body sketches, or graphs (`height_in` between `1.75` and `2.5`).
  * `ruled_prose`: Use ONLY for conceptual explanations (`ruled_line_count` = `step_count + 1`).
  * `claim_evidence_reasoning`: Use for scientific arguments (3 vertically stacked rows with embedded checkable criteria).
  * `short_value_box`: Use ONLY for 1-step coordinate look-ups (`height_in: 0.55`).
- **FADED SCAFFOLDING:** On Problem 1 (`is_worked_pair: true`), populate `faded_scaffold_hint` inside workspace zones with starter stems.

## 3. Execution Workflow
1. **Read Schema:** Inspect `.agents/skills/low-stress-worksheet/resources/worksheet_schema.json`.
2. **Draft & Validate JSON:** Generate the complete worksheet payload and save it to `output/<slug>_worksheet.json`.
3. **Run Compiler:** Execute `python3 .agents/skills/low-stress-worksheet/scripts/render_worksheet.py output/<slug>_worksheet.json output/<slug>_worksheet.html`.
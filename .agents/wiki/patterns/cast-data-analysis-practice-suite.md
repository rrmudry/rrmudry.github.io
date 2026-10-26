# CAST Data Analysis & Graphing Practice Suite

> **Status**: Department-Wide Practice & Evaluation Standard  
> **Target Assessment**: California Science Test (CAST) — High School Science (Grades 10–12)  
> **Relevant SEPs**: SEP 4 (Analyzing & Interpreting Data), SEP 5 (Using Mathematics & Computational Thinking), SEP 7 (Engaging in Argument from Evidence)  
> **Relevant CCCs**: CCC 1 (Patterns), CCC 2 (Cause & Effect)  
> **Last Updated**: 2026-10-19  

---

## 1. Overview & Departmental Goal

The **CAST Data Analysis & Graphing Practice Suite** (`cast-data-practice/`) provides a consistent, school-wide instructional and assessment tool for high school science departments. It presents authentic, phenomena-driven items that mirror CAST Performance Tasks, each containing:
1. **Background Information / Phenomenon Context** (independent, dependent, controlled variables).
2. **Scientific Data Table** (raw and analyzed data, units, trials, multi-series).
3. **Plotted Graph & Mathematical Model** (scatter, line, or bar charts with linear regression trendlines, slopes, and rate callouts).
4. **5-Part Scaffolded Pedagogical Question Progression (8 Points Total)**:
   - **Part 1 (Graph Reading & Anatomy - Decoding Mechanics, 1 pt)**: Independent/dependent variable identification, coordinate locator reading with tolerance check, and physical intercept meaning.
   - **Part 2 (Mathematical Trend Identification - SEP 4, 1 pt)**: Direct linear, inverse, quadratic growth, plateau saturation, or comparative rate.
   - **Part 3 (Guided Mathematical Modeling & Slope - SEP 5, 1 pt)**: Step-by-step slope setup (coordinate points, formula Δy / Δx, combined units, physical rate meaning) with calculation check.
   - **Part 4 (Scaffolded Scientific Argumentation - SEP 7, 4 pts)**: Scaffolded CER with toggleable sentence frames and real-time 4-point automated `EvidenceChecker` rubric (Claim, Evidence, Units, Reasoning).
   - **Part 5 (Synthesis & Misconception Diagnostics, 1 pt)**: Extrapolation beyond tested range + immediate formative diagnostic check with targeted misconception debunking.

---

## 2. Real-Time Automated Evidence & Rubric Analyzer

The centerpiece of student evaluation is the `EvidenceChecker` engine (`cast-data-practice/js/evidence-checker.js`). It grades free response writing against a standardized 4-point rubric:

| Criterion | Points | Evaluation Mechanism |
|---|:---:|---|
| **Scientific Claim** | 1 pt | Scans text for directional relationships (`increases`, `decreases`, `directly proportional`, `quadratic`, `plateaus`, `slower`, `faster`) and prompt alignment. |
| **Quantitative Evidence** | 1 pt | Extracts all numerical tokens (`-?\d+(\.\d+)?`) and matches them against target values in the scenario's data table within $\pm 3\%$ or $\pm 0.15$ tolerance. Requires at least **two authentic data pairs**. |
| **Scientific Units** | 1 pt | Regex word boundary matching against required domain units (`m/s²`, `N`, `mL/min`, `°C`, `ppm`, `Ma`, `km`, `M`). |
| **Comparative Reasoning** | 1 pt | Detects data comparison language (`from X to Y`, `compared to`, `increased by`, `double`, `ratio`) AND scientific reasoning connectors (`because`, `due to`, `collision theory`, `newton`, `kinetic energy`, `hydrogen bonds`, `denaturation`, `convection`). |

### Diagnostic Feedback Loop
Instead of punitive point loss, the engine displays:
- A live visual checklist with badges (`✅ Claim Stated`, `⏳ Cite Two Data Points`, `✅ Units Included`).
- An actionable bulleted tip box guiding students on what to add before final submission (e.g., *"Quote at least two specific data pairs from the table such as 10 N and 2.0 m/s²"*).

---

## 3. High-Contrast Light Mode & Projector Mode Compliance

In alignment with `classroom-projection-and-high-contrast-theming.md`:
1. **Light Mode (WCAG AAA $\ge 14:1$)**:
   - Ink slate (`#0f172a`) text on pure white card backgrounds.
   - Saturated accents: Cyan `#0284c7`, Emerald `#059669`, Purple `#7c3aed`, Rose `#e11d48`.
2. **Universal Root Font Scaling**:
   - Text Size controls: Normal (`16px`), Large (`20px`), Projector (`24px`).
   - Uses `rem` units across all cards, tables, inputs, and badges so the entire interface scales cleanly on overhead classroom projectors.
3. **Dynamic Canvas Re-Rendering**:
   - Chart.js adapts palette colors dynamically on theme toggling (gridlines, axis text, tooltip contrast).

---

## 4. Firestore Student-Permission Law Compliance

In adherence to repository security rules:
- **Write Target**: `practice_results/cast_data_practice/students/{studentId}` where `studentId = user.email.split('@')[0]`.
- **Zero Parent Writes**: The student client NEVER attempts to write or update the parent document `practice_results/cast_data_practice`.
- **Sanitized Payload**: All variables are sanitized (`val !== undefined && val !== null ? val : null`) to guarantee zero `undefined` Firestore errors.

---

## 5. Teacher Mode, Whitelist Auth & AI CAST Scenario Generator

1. **Teacher Mode & Whitelist Authentication**:
   - Access to **🛠️ Teacher Mode** is restricted to verified science faculty via Google authentication.
   - When clicking Teacher Mode, users not signed in are prompted to authenticate with their `@orangeusd.org` Google account.
   - Whitelist authorization check verifies against the 10 approved science teachers:
     `cchurney@orangeusd.org`, `ashue@orangeusd.org`, `avelasquez@orangeusd.org`, `egerbasi@orangeusd.org`, `jricupito@orangeusd.org`, `jbowling@orangeusd.org`, `lluna@orangeusd.org`, `oroot@orangeusd.org`, `scourtney@orangeusd.org`, `rmudry@orangeusd.org`.
   - Unauthorized attempts (such as students) are rejected with a clear access restriction dialog.

2. **AI CAST Scenario Generator (Gemini Powered - Option B) & Special Customization Requests**:
   - Teachers can input any science topic, lab experiment, or phenomenon (e.g. *Hooke's Law*, *Enzyme kinetics vs. pH*, *Ocean acidification*, *Boyle's Law*).
   - **Target Grade / Rigor Level Selector**:
     - *High School (Grades 9–12 / Standard CAST)* [Default].
     - *Middle School (Grades 6–8 / Accessible Vocabulary & Clean Numbers)*: Automatically instructs AI to use 7th-8th grade reading level, replace abstract electronics with intuitive classroom apparatus (spring scales, beakers, stopwatches, ramps, thermometers), provide clean integer or single-decimal data for easy slope calculations, and align with Middle School NGSS codes (`MS-PS2-2`, `MS-LS1-5`, etc.).
     - *Upper Elementary (Grades 4–5 / Foundational Science)*: Simplified reading and intuitive patterns.
     - *Honors / AP Science (Advanced Rigor & In-Depth CER)*: Precision apparatus (photogates, spectrophotometers) and analytical mechanism synthesis.
     - *Foundations / ELD Support (Plain English & Scaffolding)*: Direct language and explicit CER sentence starters.
   - **Special Teacher Requests & Custom Instructions**:
     - Dedicated input area for free-form instructions (e.g., *"Lower reading level for 8th graders"*, *"Use whole integer numbers only in the table"*, *"Set apparatus in a kitchen or home context"*, *"Question 3 slope must be a whole integer"*).
     - Prominently incorporated with priority weighting into both `systemInstruction` and `userPrompt`.
     - One-click preset pills: 🎒 *Lower to 7th-8th Grade*, 🔢 *Whole Numbers Only*, 🗣️ *ELD / Simple Vocabulary*, 🍳 *Everyday / Kitchen Lab*, 📉 *Inverse Trend*, 🎓 *Honors / AP Rigor*, and ✕ *Clear*.
   - Automatically connects to the shared Apps Script proxy configured in Firestore under `system_config/chat_config` (`chatProxyUrl`) with fallback to localStorage.
   - Prompts Gemini to synthesize a complete 5-part CAST performance task conforming to the repository's strict schema:
     - No-LaTeX plain text / Unicode (`Δ`, `²`, `³`, `°C`, bold).
     - Experimental background narrative and apparatus description.
     - Calibrated data table with 5–6 trials.
     - 5-part question architecture (Anatomy with locator & intercept decoding, Trend identification, Guided Slope calculation with step breakdown, Scaffolded CER with sentence frames & target evidence numbers, and Synthesis with diagnostic misconception check).
   - Auto-populates the builder form fields, adds the scenario to the active dropdown with grade tag prefix (e.g. `[Middle School]`), displays the grade level badge (`#gradeBadge`), saves to `localStorage`, and displays the target grade in 1-page printable worksheet headers.

3. **Department 2-Page Printable PDF Design & Height Budgeting**:
   - Upgraded from cramped 1-page format to a clean, spacious **2-Page Letter Portrait Standard** (`@page { size: letter portrait; margin: 0.38in 0.45in; }`):
     - **Page 1 (Experimental Evidence & Plotted Graph Key)**:
       - Header block with Title, Discipline & NGSS Expectation badge, Student Name, Period, Date, and Score (`X / 8 Pts` with `white-space: nowrap`).
       - Background Narrative callout box with blue left accent bar (`border-left: 3.5px solid #0284c7; background: #f8fafc; font-size: 8.8pt; line-height: 1.35;`).
       - **2-Row Sequential Investigation Layout**: Upgraded from vertical columns to an intuitive 2-row layout (Row 1: Data Table on left at 55–63% and Protocol Controls on right at 35–43%; Row 2: Full-width widescreen landscape Graph snapshot at 1000×460 and 3-column Accessible Key with zero text truncation).
       - **Accessible Graph Key (`#pGraphAccessLegend`)**: Dual-coded symbols (●, ■, ▲, ◆, ✕), line patterns (Solid, Dashed, Dotted), and individual trendline equations/slopes for 100% readability on black-and-white photocopiers.
       - Page 1 Footer bar with Science Department branding and `Page 1 of 2`.
     - **Page 2 (Scientific Data Analysis, Calculations & Structured CER)**:
       - Running Header block with Scenario Title, Student Name, Period, and Score fields so detached sheets remain identifiable.
       - Question 1: Graph Reading & Decoding with spacious fill-in blanks.
       - Question 2: Trend Selection with clean checkboxes (`[ ]`) rendered as dedicated stacked option rows with regular unbolded text (`font-weight: 400`).
       - Question 3: Quantitative Calculation with boxed Setup Work line (`blankSetupWork`, e.g. slope `Setup Work: ( _____ − _____ ) / ( _____ − _____ )`) and calculated rate.
       - Question 4: Structured 3-part CER writing sections:
         - **Claim**: Single-line prompt with writing line.
         - **Evidence**: 1.45in box with repeating ruled guide lines (`repeating-linear-gradient`) prompting for 2+ data points and units.
         - **Reasoning**: 1.30in box with repeating ruled guide lines prompting for scientific laws and mechanisms.
         - Compact 4-Point Evidence Rubric bar (`[ Claim: 1 pt | Evidence: 1 pt | Units: 1 pt | Reasoning: 1 pt ]` and `[ ____ / 4 Pts ]`).
       - Question 5: Model Synthesis & Misconception Diagnostics with regular unbolded options.
       - Page 2 Footer bar with Science Department branding and `Page 2 of 2`.
   - Guaranteed clean page break (`page-break-after: always` on Page 1, `page-break-before: always` on Page 2) with zero accidental 3rd page spillover.

---

## 6. AI Prompt Engineering & Data Sanitization Pitfalls
- **Raw HTML Tag Leakage**: If the AI prompt suggests HTML markup (e.g., `<strong>v</strong>`), the model may place literal tags into JSON string fields like `independentVar` or question prompts. When these are rendered via `.textContent`, the browser escapes them into visible text (e.g. `(<strong>F_N</strong>)`). The prompt now strictly enforces clean plain-text Unicode (`Δ`, `·`, `²`, `³`, `°C`), and client-side `stripHtml()` sanitizes all incoming fields during render.
- **Verbose AI Background Narratives**: Models often produce 200–300 word backgrounds that repeat the scenario title and consume excessive vertical space on 1-page prints. Prompts are constrained to 50–80 words, title prefixes are stripped automatically, and the container is CSS-clamped to `0.90in`.
- **Missing Data Table Units**: If the model supplies column headers without units (e.g. `Normal Force`), client-side normalization checks `col.isX` and `col.isY` against `xAxis.unit` and `yAxis.unit` and automatically appends ` (unit)` to guarantee complete scientific notation.
- **Mathematical Equations**: Equations with programming asterisks (e.g. `y = 0.35 * x`) are sanitized to use standard multiplication dots (`y = 0.35 · x`) or standard algebraic notation.

---

## 7. Gold-Standard 1-Page Printable Worksheet Architecture & Spacing Specifications

The printable student worksheet layout (`#printWorksheet`) represents the department standard for high-rigor, CAST-aligned performance tasks. It has been meticulously budgeted and formatted to fit comfortably on a single Letter Portrait page without crowding or visual overwhelm. All future worksheets, whether authored manually or generated by AI, MUST strictly adhere to these architectural standards:

### 1. Canvas Geometry & Fixed Vertical Budget (10.36 in Total)
- **CSS Page Rule**: `@page { size: letter portrait; margin: 0.32in 0.40in 0.32in 0.40in; }`
  - Top/Bottom Margins: `0.32in` (46px)
  - Left/Right Margins: `0.40in` (58px)
- **Page Container**: `.print-worksheet-page { height: 10.36in; max-height: 10.36in; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; page-break-after: avoid; page-break-inside: avoid; background: #ffffff; }`
- **Zero Spillover Guarantee**: Nothing may ever overflow onto Page 2. Vertical dimensions are dynamically self-balancing.

### 2. Header & Metadata Block (~0.55 in)
- **Layout**: `border-bottom: 2px solid #0f172a; padding-bottom: 3px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: flex-start;`
- **Title**: `font-size: 12.5pt; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 0 0 1px 0;`
- **NGSS Badge**: `font-size: 6.8pt; font-weight: 800; padding: 1px 5px; border-radius: 3px; border: 1px solid #bae6fd; background: #e0f2fe; color: #0369a1;`
- **Student Information Fields**: Name, Period, Date aligned with baseline borders (`border-bottom: 1.5px solid #334155; height: 1.15em; font-size: 7.8pt;`).
- **Score Capsule**: `[ Score: _____ / 8 Pts ]` styled with `white-space: nowrap;` so points never break across lines.

### 3. Investigation Procedure & Experimental Setup Box (~0.85 in)
- **Container**: `border-left: 3.5px solid #0284c7; background: #f8fafc; border-top/right/bottom: 1px solid #e2e8f0; border-radius: 0 4px 4px 0; padding: 3px 6px; font-size: 7.1pt; line-height: 1.22; max-height: 0.90in; overflow: hidden; margin-bottom: 4px;`
- **Header**: `INVESTIGATION PROCEDURE & EXPERIMENTAL SETUP` (`font-size: 7.6pt; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 1px;`) — functional and concise; never repeat the main scenario title.
- **Narrative Content Law**: Strictly describes the physical apparatus, materials tested, method of manipulating the independent variable, measurement instrument for the dependent variable, and controlled variables held constant. **Zero textbook definitions or philosophical filler.**

### 4. Balanced Evidence Grid (Exactly 2.25 in)
- **Container**: `.p-evidence-grid { display: grid; grid-template-columns: 48% 50%; gap: 2%; height: 2.25in; margin-bottom: 4px; align-items: stretch; }`
  - **Dynamic Multi-Series Column Balancing**: Adapts to multi-column tables automatically:
    - 3 Columns (Standard): `48% 50%`
    - 4 Columns (`.grid-cols-4`): `54% 44%` (gives table the extra width needed for 2 Y-series without compressing graph)
    - 5 Columns (`.grid-cols-5`): `58% 40%`
- **Data Table (Left Column)**:
  - Border: `1.5px solid #cbd5e1; border-radius: 5px; padding: 3px 5px; font-size: 6.7pt; line-height: 1.10;`
  - Header Row: Background `#f1f5f9; font-weight: 800; color: #0f172a; padding: 2px 3px; border: 1px solid #cbd5e1;`
  - **Mandatory Header Wrapping**: `white-space: normal; word-break: normal; overflow-wrap: break-word; vertical-align: bottom;` (NEVER use `nowrap` on `th` — allows descriptive multi-word titles like `Pressing Force (Normal Force) (N)` to wrap into 2 compact lines).
  - First Column (`Trial #`): Centered with compact width (`width: 12%`).
  - **Compact Multi-Dataset Mode (`.p-table-compact`)**:
    - Triggered automatically when table has $\ge 4$ columns.
    - Uses `font-size: 6.1pt; line-height: 1.08;` with `1.5px 2px` padding and shortens trial values from `"Trial 1"` to `"1"` (`width: 9%`) so all Y-columns fit comfortably without clipping.
  - Caption: Allows natural wrapping (`white-space: normal; overflow: visible; font-size: 6.8pt; font-weight: 800;`) with zero text cut-off.
  - Scientific Units: Column headers must include units in parentheses, e.g. `Normal Force (N)`.
- **Graph Snapshot (Right Column)**:
  - Border: `1.5px solid #cbd5e1; border-radius: 5px; padding: 3px 5px;`
  - Image: `max-height: 1.85in; width: 100%; height: 100%; object-fit: contain;` from base64 Chart.js canvas render.

### 5. CAST Task Questions Container (~6.50 in, Self-Balancing)
- **Container**: `.p-questions-container { border: 1.5px solid #cbd5e1; border-radius: 5px; padding: 7px 11px; flex: 1; display: flex; flex-direction: column; overflow: hidden; }`
- **Comfortable Non-Overwhelming Spacing**: `.p-q-item { margin-bottom: 12px; font-size: 7.4pt; line-height: 1.30; }`
  - Ensures comfortable breathing room between questions so students never feel overwhelmed by wall-to-wall text.
- **Prompts**: `.p-q-prompt { font-weight: 800; color: #0f172a; margin-bottom: 3px; }`
- **Question 1 (Decoding Mechanics)**:
  - Clean inline answer blanks: `.p-inline-blank { border-bottom: 1.5px solid #334155; min-width: 50px; height: 1.1em; font-weight: 700; text-align: center; }`
- **Question 2 (Pattern Identification — Unbolded Dedicated Rows)**:
  - **Unbolded Regular Weight**: Option text is regular body weight (`font-weight: 400; color: #1e293b;`), NOT bold.
  - **Monospace Checkboxes**: `[ &nbsp; ]` checkboxes are bold monospace (`font-family: monospace; font-weight: 700; font-size: 7.8pt; color: #0f172a;`).
  - **Dedicated Row Stacking**: Must NEVER wrap horizontally across a single line. Each option sits on its own line:
    - `.p-mc-options-list { display: flex; flex-direction: column; gap: 2.5px; margin-top: 2px; }`
    - `.p-mc-option { display: flex; align-items: baseline; gap: 6px; font-size: 7.3pt; line-height: 1.25; font-weight: 400; color: #1e293b; }`
- **Question 3 (Quantitative Calculation — Adaptive Setup Work)**:
  - **Authentic Formula Alignment**: Setup Work matches the authentic mathematical formula of the phenomenon rather than forcing a slope fraction bar:
    - Linear slope: `Setup Work: Δy / Δx = ( _____ − _____ ) / ( _____ − _____ )` with `Calculated Rate (Slope): ________ [units]`
    - Rate drop / difference: `Setup Work: Δy = Rate₁ − Rate₂ = ( _____ − _____ )` with `Calculated Drop (Δy): ________ [units]`
    - Ratio / factor: `Setup Work: Factor = d₂ / d₁ = ( _____ / _____ )` with `Calculated Factor: ________`
  - Dynamic `#pQ2Header`, `#pQ2Work`, and `#pQ2Label` adapt per scenario.
- **Question 4 (Scientific Explanation — CER Flex Absorption)**:
  - **Dynamic Space Absorber**: `.p-q-cer { flex: 1; display: flex; flex-direction: column; min-height: 0; }`
  - **Clean CER Box**: `.p-cer-box { border: 1.5px solid #94a3b8; border-radius: 4px; padding: 6px 8px; flex: 1; min-height: 1.35in; font-size: 7.2pt; line-height: 1.25; margin-top: 3px; background: #ffffff; }`
  - **No Dashed Lines**: Open solid border with clean white space (no artificial ruled or dashed lines).
  - Compact 4-Point Rubric Bar (`[ Claim: 1 pt | Evidence: 1 pt | Units: 1 pt | Reasoning: 1 pt ]` and `[ Score: ____ / 4 Pts ]`) docked directly under the prompt.
- **Question 5 (Synthesis & Misconception Diagnostics)**:
  - Docks cleanly at the bottom of `.p-questions-container` without leaving empty void space.
  - Multi-word options stack vertically via `.p-mc-options-list`; short numeric values remain inline. Unbolded regular weight (`font-weight: 400`).

### 6. Footer Bar (~0.20 in)
- `border-top: 1px solid #cbd5e1; padding-top: 2px; margin-top: 4px; font-size: 7pt; color: #64748b; display: flex; justify-content: space-between; align-items: center;`
- Displays Orange High School Science Department branding and `Page 1 of 1`.

---

## 7. Multi-Dataset Tables & Comparative Multi-Series Graphing Architecture

### 1. Pedagogical Rationale
Real-world science investigations and CAST performance tasks frequently require students to compare two or three experimental conditions (e.g., rough vs. smooth surfaces, warm vs. cold solutions, or spreading rates of the Mid-Atlantic Ridge vs. East Pacific Rise). To enable authentic comparative data analysis:
- Teachers can specify the number of datasets (1 Single Series, 2 Comparative Multi-Series, or 3 Three-Condition Comparative) directly in both the **AI Scenario Generator** and the **Manual Scenario Builder**.
- One-click presets (`📈 2 Datasets (Comparative)` and `📊 3 Datasets`) instantly configure the generator.

### 2. Multi-Dataset Schema Standard
When multiple datasets are requested:
- **`dataTable.columns`**: Contains 1 shared independent variable (X) column (`isX: true`) and $N$ separate dependent variable (Y) columns (`isY: true`), each stamped with scientific units and a matching `seriesId` (e.g. `series1`, `series2`, `series3`).
- **`dataTable.rows`**: Each row object contains `trial`, `x`, and $N$ corresponding values: `y1`, `y2`, `y3` (or named keys like `atlantic`, `pacific`).
- **`graphConfig.multiSeries: true`**:
  - `graphConfig.series`: Array of series configs defining `id`, `key`, `label`, and `pointStyle` (`circle`, `triangle`, `rectRot`, `cross`, `star`).
  - `equation`: Dual or comparative rate summary (e.g. `Condition A slope: m₁; Condition B slope: m₂`).
  - `slopeMeaning`: Comparative physical rate interpretation.
- **Comparative CER & Quantitative Prompts**: Prompt Question 3 and Question 4 specifically require students to compare the datasets and synthesize the contrasting trends.

### 3. Dynamic Chart.js Graphing Engine
`renderChart()` adapts dynamically without hardcoded column names:
- **Dynamic X-Axis Detection**: Identifies the X-axis via column attribute `isX: true` (or numeric non-Y column fallback).
- **Dynamic Y-Key Matching**: Extracts Y points by matching `sConfig.key`, `sConfig.id`, `yCols[idx].key`, or fallback `y1`/`y2`/`y3`.
- **Projector-Safe 5-Color Saturated Palette**:
  - Light mode: `["#0284c7", "#ea580c", "#10b981", "#7c3aed", "#e11d48"]` (ensures razor-sharp differentiation under overhead classroom projectors).
  - Dark mode: `["#38bdf8", "#fb923c", "#34d399", "#c084fc", "#f43f5e"]`.
- **Distinct Point Styles**: Circles, triangles, rotated rectangles, crosses, and stars ensure accessibility for colorblind students.

### 4. UI Indicators & 1-Page Printable Worksheet Sync
- **Metadata Badges**: Header displays `#multiSeriesBadge` (`📈 2 Datasets`) when a multi-series scenario is active.
- **Dropdown Tagging**: Scenario dropdown prefixes multi-dataset items with `[2 Datasets]` or `[3 Datasets]`.
- **Worksheet Print Engine**: Dynamically renders all Y-columns in `.p-table` and captures the multi-series Chart.js canvas snapshot into `#pGraphImg`.

---

## 8. Two-Page Accessible Printable Worksheet Architecture & B&W Photocopy Standards

To provide students with generous physical writing space for rigorous CER argumentation while ensuring 100% clarity on black-and-white school photocopiers:

### 1. Dual-Coded Semantic Visuals for Black & White Printing
- **Semantic Color Mapping (`resolveSeriesVisuals`)**: Maps organism/substrate keywords directly to natural colors (e.g. Green Prey `#15803d`, Red Prey `#dc2626`, Blue Prey `#1d4ed8`).
- **Geometric Marker Dual-Coding**: Points use distinct marker shapes:
  - Dataset 1: Solid Line with Circle (`●`)
  - Dataset 2: Dashed Line (`[8, 4]`) with Square (`■`)
  - Dataset 3: Dotted Line (`[3, 3]`) with Triangle (`▲`)
  - Dataset 4: Dash-Dot Line with Diamond (`◆`)
- **Point Sizing**: High-visibility `pointRadius: 9`, `pointBorderWidth: 3` with pure white border ensures points pop on low-contrast photocopies.

### 2. High-Resolution Dedicated Offscreen Canvas Snapshot (`renderPrintChartSnapshot`)
- Never snapshot the responsive on-screen canvas directly (which is widescreen 16:9 and small).
- An unattached, offscreen 720×640 canvas (nearly square 1.12:1 aspect ratio) is rendered synchronously with pure white background, 15px bold axis titles, 13px bold tick marks, and 14px bold legend.
- When placed into the 3.4-inch portrait `.p-graph-content` card, it completely fills the space without letterboxing.

### 3. Structured Accessible Legend Table (`.p-access-table`)
- Renders as a fixed 3-column table (`32%`, `40%`, `28%`):
  - Col 1: Symbol & Series Name (e.g. `● Green Prey`)
  - Col 2: Line & Marker Pattern (e.g. `Solid (Circle)`)
  - Col 3: Mathematical Model / Rate (e.g. `+5.0 org/gen`)
- Prevents awkward word wraps or text truncation.

### 4. Zero-Void Evidence Column
- Table 1 rows are spaced with generous 7px cell padding.
- Below Table 1, a dedicated **"🔬 Experimental Controls & Protocol Verification"** box renders controlled variables and calibrated instrumentation, turning empty white space into high-value CAST SEP-3 inquiry scaffolding.

### 5. Strict Blank Mode Friction Law (Question 3 Setup Work)
- In blank worksheet mode (`isBlank === true`), `#pQ2Work` strictly renders placeholder slots: `Setup Work: Δy / Δx = ( ___ − ___ ) / ( ___ − ___ )`.
- Specific coordinates and answers are NEVER leaked onto student worksheets.
- Full numerical solutions appear only in completed report mode.

### 6. Expanded Ruled Lines for CER (Page 2)
- Page 2 is budgeted at `10.18in` with `justify-content: space-between`.
- Evidence area has `min-height: 1.70in` (7 clean ruled writing lines).
- Reasoning area has `min-height: 1.45in` (6 clean ruled writing lines).
- Docks running header, Q1-Q5, 4-point rubric bar, and Page 2 footer cleanly without overflow.

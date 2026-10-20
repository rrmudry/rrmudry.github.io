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

2. **AI CAST Scenario Generator (Gemini Powered - Option B)**:
   - Teachers can input any science topic, lab experiment, or phenomenon (e.g. *Hooke's Law*, *Enzyme kinetics vs. pH*, *Ocean acidification*, *Boyle's Law*).
   - Automatically connects to the shared Apps Script proxy configured in Firestore under `system_config/chat_config` (`chatProxyUrl`) with fallback to localStorage.
   - Prompts Gemini to synthesize a complete 5-part CAST performance task conforming to the repository's strict schema:
     - No-LaTeX plain text / Unicode (`Δ`, `²`, `³`, `°C`, bold).
     - Experimental background narrative and apparatus description.
     - Calibrated data table with 5–6 trials.
     - 5-part question architecture (Anatomy with locator & intercept decoding, Trend identification, Guided Slope calculation with step breakdown, Scaffolded CER with sentence frames & target evidence numbers, and Synthesis with diagnostic misconception check).
   - Auto-populates the builder form fields, adds the scenario to the active dropdown, saves to `localStorage`, and allows immediate in-app testing or 1-page blank worksheet printing.

3. **Honors 1-Page Printable PDF Design & Height Budgeting**:
   - Structured after `Honors_Kinematics_Graphing_Challenges_1_and_2.html` with a strict **1-Page Letter Portrait budget** (`height: 10.36in; max-height: 10.36in; margin: 0.32in 0.40in;`).
   - Clean, uncluttered visual hierarchy:
     - Header block with Title, NGSS Performance Expectation badge, Student Name, Period, Date, and Score (`X / 8 Pts` with `white-space: nowrap`).
     - Background Phenomenon callout box with blue left accent bar (`border-left: 3.5px solid #0284c7; background: #f8fafc; font-size: 7.1pt; max-height: 0.90in; line-height: 1.22;`).
     - Evidence Grid (`height: 2.25in`): Balanced side-by-side with Data Table on left (46%) and high-resolution base64 Graph snapshot on right (52%, max-height `1.85in`). Reclaimed 0.50 vertical inches to ensure Question 5 options are never clipped.
     - Questions container with 5 parts (`justify-content: space-between; padding: 5px 8px; margin-bottom: 5px;`):
       - Question 1: Decoding Mechanics (Independent / Dependent variables + Coordinate Locator).
       - Question 2: Trend Selection with clean checkboxes (`[ ]`).
       - Question 3: Rate of Change Calculation with explicit Setup Work line (`Δy / Δx = ( ___ − ___ ) / ( ___ − ___ )`) to maintain productive pedagogical friction.
       - Question 4: Student written CER explanation box (`0.72in` height) and compact 4-Point Evidence Rubric (`[ ____ / 4 Pts ]`).
       - Question 5: Model Synthesis & Misconception Diagnostics with clean horizontal multiple-choice checkboxes (`[ ] A  [ ] B  [ ] C  [ ] D`).
     - Footer bar with Orange High School Science Department branding and `Page 1 of 1`.
   - Guarantees zero spillover onto page 2, whether printed with student answers or printed blank as a student classroom worksheet.

---

## 6. AI Prompt Engineering & Data Sanitization Pitfalls
- **Raw HTML Tag Leakage**: If the AI prompt suggests HTML markup (e.g., `<strong>v</strong>`), the model may place literal tags into JSON string fields like `independentVar` or question prompts. When these are rendered via `.textContent`, the browser escapes them into visible text (e.g. `(<strong>F_N</strong>)`). The prompt now strictly enforces clean plain-text Unicode (`Δ`, `·`, `²`, `³`, `°C`), and client-side `stripHtml()` sanitizes all incoming fields during render.
- **Verbose AI Background Narratives**: Models often produce 200–300 word backgrounds that repeat the scenario title and consume excessive vertical space on 1-page prints. Prompts are constrained to 50–80 words, title prefixes are stripped automatically, and the container is CSS-clamped to `0.90in`.
- **Missing Data Table Units**: If the model supplies column headers without units (e.g. `Normal Force`), client-side normalization checks `col.isX` and `col.isY` against `xAxis.unit` and `yAxis.unit` and automatically appends ` (unit)` to guarantee complete scientific notation.
- **Mathematical Equations**: Equations with programming asterisks (e.g. `y = 0.35 * x`) are sanitized to use standard multiplication dots (`y = 0.35 · x`) or standard algebraic notation.


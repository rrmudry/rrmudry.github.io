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
4. **4-Part Scaffolded Question Progression**:
   - **Part 1 (Trend Identification - SEP 4)**: Direct linear, inverse, quadratic growth, plateau saturation, or comparative rate.
   - **Part 2 (Quantitative Rate / Slope - SEP 5)**: Calculating interval rates ($\Delta y / \Delta x$) with unit validation and tolerant checking ($\pm 5\%$).
   - **Part 3 (Free Response CER - SEP 7 & SEP 4)**: Real-time automated 4-point rubric evaluation analyzing student text for Claim, authentic numerical citations, scientific units, and comparative reasoning.
   - **Part 4 (Synthesis & Extrapolation)**: Projecting new conditions or analyzing model limitations.

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

## 5. Teacher Mode & Honors 1-Page Printable Lab Report (`@media print`)

1. **Teacher Mode Modal**:
   - Allows department teachers to create custom inquiry scenarios with custom data rows, units, and CER rubrics.
   - Scenarios save locally and can be exported as `.json` files to share across the department.
2. **Honors 1-Page Printable PDF Design**:
   - Structured after `Honors_Kinematics_Graphing_Challenges_1_and_2.html` with a strict **1-Page Letter Portrait budget** (`height: 10.36in; max-height: 10.36in; margin: 0.32in 0.40in;`).
   - Clean, uncluttered visual hierarchy:
     - Header block with Title, NGSS Performance Expectation badge, Student Name, Period, Date, and Score (`X / 7 Pts`).
     - Background Phenomenon callout box with blue left accent bar (`border-left: 3.5px solid #0284c7; background: #f8fafc;`).
     - Evidence Grid (`height: 2.75in`): Balanced side-by-side with Data Table on left (46%) and high-resolution base64 Graph snapshot on right (52%).
     - Questions container with Parts 1–4, student's written CER explanation, and compact 4-Point Evidence Rubric pills (`[Claim: 1/1] [Evidence: 1/1] [Units: 1/1] [Reasoning: 1/1]`).
     - Footer bar with Orange High School Science Department branding and `Page 1 of 1`.
   - Guarantees zero spillover onto page 2, whether printed with student answers or printed blank as a student classroom worksheet.


---
description: Audit student lab submissions, detect unphysical or bogus data, and generate a 2-page report with in-class teacher intervention protocols
---

# Audit Student Data Workflow

Use this workflow to review student submissions for any interactive webapp or lab assignment (e.g. Pull-Back Toy Lab, Marble Ramp Lab, Reaction Time Lab, Free Fall Lab).

## Triggering the Workflow
Type this command in chat:
> **/audit-student-data** [Assignment URL or Assignment ID]

*(Example: `/audit-student-data https://rrmudry.github.io/Unit_2/pull_back_toy_lab/index.html`)*

---

## Standardized Execution Routine

### 1. Extract Submissions & Roster Telemetry
- Identify the target assignment ID (e.g. from URL path or `ASSIGNMENT_ID` constant).
- Query Cloud Firestore collection `student_results/{assignment_id}/students`.
- Cross-reference submissions with the active student roster to determine Period and completion status.
- Cache the payload in `scratch/{assignment_id}_students.json`.

### 2. Forensic Quality Categorization
Categorize all students into three buckets:
1. **Authentic Physical Runs**: Plausible physical values, expected kinematics distributions, non-zero acceleration curves.
2. **Incomplete / Drafts**: Students who opened the lab but entered partial or no split times, or completed data without pressing submit.
3. **Flagged Bogus / Corrupted Datasets**: Identify specific pathologies using established archetypes:
   - Video frame numbers (30fps/60fps) or hundredths entered as seconds.
   - Synthetic integer placeholders (`1, 2, 3, 4, 5`) or constant linear intervals (`0.25, 0.50, 0.75`).
   - Anti-validator tricks (e.g. `4.99` on final entry).
   - Shared group typos (e.g. `91.00 s` instead of `1.91 s`).
   - Metric distances typed into time columns (`20, 40, 60, 80, 100`).
   - Stopwatch double-taps (`0.01 s` splits / `0.18 s` total times).
   - Mid-table unit switches (seconds jumping to frame numbers).
   - Collisions, barrier strikes, or severe deceleration stalls.

### 3. Generate Standard 2-Page HTML Report
Write `admin/reports/{Activity_Name}_Data_Audit_Report.html` following the official pattern:
- **Page 1: Telemetry & Quality Forensics**:
  - Header with `Forensic Telemetry` badge, school meta, and student counts.
  - 4 KPI cards (Total, Authentic %, Flagged Bogus %, Incomplete %).
  - 3-color distribution progress bar.
  - Section 1: Section Pacing & Integrity Matrix (Periods 0 through 6).
  - Section 2: Master Anomaly Directory (**strictly ordered by period: P1 -> P6**).
  - Bottom transition banner guiding teacher to Page 2.
- **Page 2: In-Class Teacher Intervention Protocol**:
  - Header with honors/clean callout.
  - 2-column grid layout (Left: Morning Conceptual P1, P2, P3; Right: Afternoon Regular P4, P5, P6).
  - Standardized Period Action Cards containing:
    - **Problem Cited (Red Box)**: Explicit diagnosis and corrupted numbers.
    - **Flagged Students & IDs**: Bold, scannable student names and IDs.
    - **Support Needed / In-Class Action (Green Box)**: Conversational coaching prompts (60-second typo fixes, video scrubbing tutorials, draft reset requirements).
    - **Pending Drafts Checklist (Amber Box)**: Students with incomplete/blank drafts to monitor during class.

### 4. Compile Letter PDF via Puppeteer
Run Puppeteer in headless mode to render an exact 2-page Letter PDF:
```bash
node -e '
const puppeteer = require("puppeteer");
const path = require("path");
(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.goto("file://" + path.resolve("admin/reports/{Report_Name}.html"), { waitUntil: "networkidle0" });
  await page.pdf({
    path: path.resolve("admin/reports/{Report_Name}.pdf"),
    format: "Letter",
    printBackground: true,
    margin: { top: "0.22in", right: "0.28in", bottom: "0.22in", left: "0.28in" }
  });
  await browser.close();
})();
'
```
Verify page count equals exactly 2 using `pdfinfo`.

### 5. Document & Present
- Write the summary markdown artifact for persistent viewing.
- Provide direct clickable file links to both HTML and PDF reports.

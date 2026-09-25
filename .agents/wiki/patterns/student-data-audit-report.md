# Pattern: Student Data Audit Report & In-Class Intervention Protocol

> Standardized procedure for auditing student submissions from interactive physics labs, webapps, and simulations, detecting unphysical or fabricated datasets, and generating an actionable 2-page teacher intervention report.

---

## 1. Context & Purpose

High school physics labs frequently rely on student-collected digital telemetry (stopwatches, slow-motion video scrubbers, photogate timers, or coordinate measurements). When 100+ students submit data across 6–7 class sections, data integrity issues inevitably arise:
1. **Measurement Unit Misunderstandings**: Recording video frame counts (30fps/60fps) or hundredths as whole seconds.
2. **Fabricated Placeholders**: Entering sequential integers (`1, 2, 3, 4, 5`) or synthetic linear intervals (`0.25, 0.50, 0.75`) that yield unphysical constant velocity and zero acceleration.
3. **Data Entry Typos**: Partner pods sharing a single typo (e.g. `91.00 s` instead of `1.91 s`) that skews the velocity curve without students noticing.
4. **Dimension Confusion**: Copying metric track distances (`20, 40, 60, 80, 100 cm`) directly into time boxes.
5. **Human Reaction Glitches**: Double-tapping stopwatch buttons resulting in `0.01 s` splits (45 mph toy cars).

Rather than simply rejecting student work, this standard couples **forensic anomaly detection** directly to an **in-class teacher remediation protocol** that enables the teacher to intervene in real-time during the next class period.

---

## 2. Standard 2-Page Architecture

Every lab audit report must follow a strict **2-page Letter budget** (`8.5in x 11in` portrait):

```
┌──────────────────────────────────────────────────┐ ┌──────────────────────────────────────────────────┐
│ PAGE 1: TELEMETRY & DATA QUALITY FORENSICS      │ │ PAGE 2: IN-CLASS TEACHER INTERVENTION PROTOCOL   │
│                                                  │ │                                                  │
│ 1. Header Bar & Metadata Badge                   │ │ 1. Header Bar & Honors/Clean Callout             │
│ 2. KPI Summary Boxes (Total, Valid, Bogus, Draft)│ │ 2. 2-Column Responsive Period Intervention Grid  │
│ 3. 3-Color Quality Distribution Progress Bar     │ │    • Left Column: Morning (Conceptual) P1, P2, P3│
│ 4. Section 1: Section Pacing & Integrity Matrix  │ │    • Right Column: Afternoon (Regular) P4, P5, P6│
│ 5. Section 2: Master Anomaly Directory           │ │ 3. Standard Period Action Cards:                 │
│    • ORDERED STRICTLY BY PERIOD (P1 -> P6)       │ │    • Problem Cited (Red Box)                     │
│    • Students & IDs, Timestamps, Total, Diagnosis│ │    • Flagged Students & IDs                      │
│ 6. Bottom Transition Banner -> Turn to Page 2    │ │    • Support Needed / Teacher Action (Green Box) │
│ 7. Page 1 Footer (Page 1 of 2)                   │ │    • Incomplete Drafts Checklist (Amber Box)     │
│                                                  │ │ 4. Page 2 Footer (Page 2 of 2)                   │
└──────────────────────────────────────────────────┘ └──────────────────────────────────────────────────┘
```

---

## 3. Page 1: Telemetry & Quality Forensics

Page 1 provides a high-level administrative overview and catalogs every anomalous dataset:

### A. Header Bar & Metadata
* Title: `{Activity Name}: Student Data Audit`
* Subtitle: `{Unit Name} • Data Integrity & Systematic Anomaly Review`
* Meta Badge: `Forensic Telemetry` (Blue pill) + School name, active student count, date.

### B. KPI Cards (4 Metric Grid)
1. **Total Students**: Total records analyzed.
2. **Authentic Runs**: Count and percentage of physically plausible, accelerating runs.
3. **Flagged Bogus**: Count and percentage of unphysical, fabricated, or corrupted datasets.
4. **Incomplete / Draft**: Count and percentage of students with drafts in progress.

### C. Distribution Bar
A 3-color segmented bar (`#22c55e` authentic, `#f59e0b` draft, `#ef4444` bogus) with percentage indicators.

### D. Section 1: Section Pacing & Integrity Matrix
A table covering all class periods (Period 0 to Period 6):
* Columns: `Class Section`, `Roster`, `Turned In`, `Authentic`, `Flagged Bogus`, `Incomplete`, `Primary Anomaly Diagnostic`.
* Visual badges: `<span class="tag-clean">100% CLEAN</span>` or `<span class="tag-bogus">BOGUS DETECTED</span>`.

### E. Section 2: Master Anomaly Directory (Mandatory Period Ordering)
* **Critical Rule**: Rows must be ordered **strictly in order of class period** (Period 1 -> Period 2 -> Period 3 -> Period 5 -> Period 6). Never group arbitrarily by anomaly type on Page 1, as teachers need to review period-by-period.
* Columns:
  * `Per`: Period badge (`P1`, `P2`, etc.).
  * `Flagged Students & IDs`: Full names and student IDs.
  * `Recorded Timestamps`: Formatted array `[t0, t1, t2, t3, t4, t5]` with offending values highlighted in red.
  * `Total`: Total elapsed time or key metric.
  * `Pathology Type`: Tag badge (`Frame Numbers`, `Placeholders`, `Typo`, `Distance as Time`, `Teleportation`, etc.).
  * `Diagnostic Finding`: Concise explanation of what physically went wrong.

---

## 4. Page 2: In-Class Teacher Intervention Protocol

Page 2 is optimized for in-class mobility (clipboard, tablet, or laptop). It tells the teacher exactly who to talk to, what to ask, and how to fix the issue in under 2 minutes.

### A. Period Organization & Morning/Afternoon Split
To ensure rapid navigation and zero page-overflow, Page 2 organizes sections into a 2-column grid:
* **Left Column**: Morning Conceptual Physics sections (Periods 1, 2, 3).
* **Right Column**: Afternoon Regular/Honors sections (Periods 4, 5, 6).
* **Top Header Callout**: Highlights 100% clean sections (e.g. `Period 0 Honors: 14/14 Authentic • No Intervention Required`).

### B. Standard Period Action Card Structure
Every period card contains four distinct semantic modules:
1. **Card Header**: Period pill badge, course name, and count pill (`X Flagged • Y Incomplete`).
2. **Problem Cited (Red Box)**: Clear identification of the exact error and corrupted numbers (e.g. `Raw Video Frames [8, 27, 41, 51, 67] entered as seconds; total run = 67.0 s`).
3. **Flagged Students & IDs**: Bold, scannable student names and official 6-digit IDs.
4. **Support Needed / In-Class Action (Green Box)**: Direct, conversational coaching instructions:
   * *The 60-Second Quick Fix*: Step-by-step guidance for typos (e.g. "Check phone video at 100 cm mark; change `91.00` to `1.91`; webapp auto-corrects graph").
   * *Scrubbing Tutorial*: How to show students the decimal seconds overlay on iPhone/Android video players instead of frame ticks.
   * *Draft Invalidation & Reset*: When and how to reset fabricated drafts and require video proof before re-submission.
5. **Pending Drafts Checklist (Amber Box)**:
   * Lists students with valid timestamps who just need to complete calculations and submit.
   * Lists students with blank drafts who need lab partner assignment or equipment.

---

## 5. Catalog of Known Telemetry Pathologies

When analyzing lab submissions, test data against these established archetypes:

| Pathology Archetype | Signature Pattern | Physics Violation | Teacher Support Action |
|---|---|---|---|
| **Video Frame Numbers** | `totalTime > 20s`, integers like `[30, 47, 60, 65, 79]` | Toy car took 79 seconds (1.2 cm/s). | Teach student to read seconds display or divide frame counts by 100 (~0.79s). |
| **Integer Placeholders** | `[1.0, 2.0, 3.0, 4.0, 5.0]` | Exact 1.00s intervals = zero acceleration, constant speed. | Invalidate draft. Require slow-mo video proof before re-entry. |
| **Validator Skirting** | `[1, 2, 3, 4, 4.99]` | Modified last value to bypass duplicate check. | Invalidate draft. Enforce authentic lab measurement. |
| **Shared Typo Clones** | Identical broken split across 3–4 students (e.g. `91.00s`) | Final interval took 89.8 seconds (0.22 cm/s). | 60-sec fix: check video scrubber at 100cm (`01:91`) and enter `1.91s`. |
| **Distance as Time** | `[20, 40, 60, 80, 100]` | Copied track centimeters into time boxes (100s run). | Clarify distance vs time columns. Re-enter stopwatch seconds. |
| **Teleportation / Double-Tap** | `totalTime < 0.25s`, split `Δt = 0.01s` | Speed > 45 mph; human reaction limit (~0.20s). | Finger double-tapped stopwatch. Use phone video scrubber instead. |
| **Mid-Table Unit Switch** | Starts `0.92s`, then jumps to `[41, 65, 83, 120]` | Switched from decimal seconds to video frame numbers. | Convert frames 41–120 into decimal seconds. |
| **Collision / Severe Stall** | Initial `v = 400 cm/s`, final `v = 3.9 cm/s` | Violent deceleration on pull-back car. | Check if car hit ruler edge or friction tape. Re-film clean run. |
| **Synthetic Linear** | Exact `Δt = 0.25s` every split (stdev = 0.00s) | Constant velocity; zero acceleration. | Explain pull-back cars accelerate from rest (intervals must shorten). |

---

## 6. Technical Implementation & Print CSS Budget

To guarantee exact 2-page PDF generation without blank pages or overflow:

```css
@page {
  size: letter portrait;
  margin: 0.22in 0.28in;
}

* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

body {
  font-family: "Inter", -apple-system, sans-serif;
  color: #0f172a;
  background: #f1f5f9;
  margin: 0;
  padding: 0;
  font-size: 7.2pt;
  line-height: 1.25;
}

.page {
  width: 8.5in;
  min-height: 11in;
  max-height: 11in;
  margin: 0 auto;
  padding: 0.24in 0.3in;
  background: #ffffff;
  position: relative;
  page-break-after: always;
  break-after: page;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.page:last-child {
  page-break-after: auto;
  break-after: auto;
}

@media print {
  body { background: #ffffff; }
  .page {
    width: 100%;
    margin: 0;
    padding: 0;
    min-height: 10.5in;
    max-height: 10.5in;
    page-break-after: always;
    break-after: page;
  }
  .page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
}
```

### Puppeteer Automated PDF Render Script
```javascript
const puppeteer = require("puppeteer");
const path = require("path");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
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
```

---

## 7. Strict Formatting Policies

1. **Strictly NO LaTeX**: Never use LaTeX math syntax (`$v = x/t$`, `\Delta`). Use Unicode symbols (`Δx`, `Δt`, `cm/s`, `cm/s²`, `v_avg`, `v_final`).
2. **Period Sorting**: Section 2 of Page 1 must always be sorted by class period (P1, P2, P3, P4, P5, P6).
3. **Actionable Coaching Language**: Support boxes on Page 2 must provide direct conversational phrases for the teacher to speak to students, rather than passive commentary.

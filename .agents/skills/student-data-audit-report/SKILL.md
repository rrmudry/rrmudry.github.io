---
name: student-data-audit-report
description: Audit student lab submissions from Firestore, detect unphysical or bogus data, and generate a standardized 2-page report (Page 1 forensics ordered by period, Page 2 in-class teacher intervention protocol by period).
---

# Student Data Audit Report Skill

## When to Use
Activate this skill whenever:
- The user asks to review, audit, inspect, or check student data or lab submissions for an assignment.
- The user asks if any student datasets are bogus, unphysical, fabricated, or contain errors.
- The user requests a data audit report or in-class teacher intervention guide for a student webapp.

## Pre-Flight: Read Wiki Pattern
Before generating reports, read the established pattern:
- [.agents/wiki/patterns/student-data-audit-report.md](../../wiki/patterns/student-data-audit-report.md) — Exact 2-page architecture, Print CSS budget, known pathology archetypes, and Puppeteer PDF rendering instructions.

## Step-by-Step Procedure

### 1. Extract & Cache Telemetry
- Locate the assignment ID from the target URL or webapp JavaScript files.
- Query Cloud Firestore: `student_results/{assignment_id}/students`.
- Join with student roster to assign class periods (Period 0 to Period 6).
- Cache raw student data to `scratch/{assignment_id}_students.json`.

### 2. Forensic Quality Classification
Categorize each student into:
- **Authentic (60–80%)**: Physically plausible, accelerating kinematics.
- **Incomplete / Draft (15–20%)**: Partial data or completed times without clicking submit.
- **Flagged Bogus (10–20%)**: Match against known pathologies:
  - Raw video frames entered as seconds (e.g. `[8, 27, 41, 51, 67]` -> 67s).
  - Synthetic integer placeholders (`[1, 2, 3, 4, 5]` -> 0 accel).
  - Skirted validator numbers (`[1, 2, 3, 4, 4.99]`).
  - Shared decimal typos (`91.00s` instead of `1.91s`).
  - Distance marks copied into time boxes (`[20, 40, 60, 80, 100]`).
  - Stopwatch double-tap teleportation (`0.18s` total; `0.01s` splits).
  - Mid-table unit switches (seconds jumping to frame numbers).
  - Collisions and severe deceleration stalls.

### 3. Generate HTML Report
Write `admin/reports/{Activity_Name}_Data_Audit_Report.html`:
- Strict 2-page structure with `@page { size: letter portrait; margin: 0.22in 0.28in; }`.
- **Page 1**: Header, KPIs, distribution bar, Section 1 matrix, **Section 2 Master Anomaly Directory strictly sorted by period (P1 -> P6)**, transition banner.
- **Page 2**: Dedicated In-Class Teacher Action Protocol:
  - Top callout noting clean sections (e.g. Period 0 Honors).
  - 2-column grid (Left: Morning Conceptual P1–P3; Right: Afternoon Regular P4–P6).
  - Standardized period cards with Problem Cited (red box), Flagged Students & IDs, Support Needed / Teacher Action (green box with verbal coaching script), and Pending Drafts Checklist (amber box).

### 4. Compile Letter PDF with Puppeteer
Run Puppeteer to render `admin/reports/{Activity_Name}_Data_Audit_Report.pdf`:
- Verify page count using `pdfinfo`. Must equal exactly 2 pages.

### 5. Update Markdown Artifact & Present
- Write the summary artifact to the IDE brain.
- Provide direct markdown file links to both HTML and PDF reports.

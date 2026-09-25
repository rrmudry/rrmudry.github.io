# Wiki Evolution Log

Append-only log tracking pattern changes across recent sessions.
> Historical evolution entries prior to September 23, 2026 are archived in [logs-archive-2026.md](logs-archive-2026.md).

## 2026-09-24 — Student Lab Data Audit & In-Class Intervention Protocol Standard

**Pattern Added**: `student-data-audit-report.md`.
**Workflow Added**: `.agent/workflows/audit-student-data.md` (`/audit-student-data`).
**Skill Added**: `.agents/skills/student-data-audit-report/SKILL.md`.

**Changes**:
- **Standardized 2-Page Lab Audit Architecture**:
  - Established persistent pattern and skill for auditing student digital telemetry from Firestore across 6–7 class sections.
  - **Page 1: Telemetry & Quality Forensics**: Header bar, 4 KPI boxes, quality distribution bar, Section 1 pacing matrix, and Section 2 Master Anomaly Directory strictly ordered by class period (P1 -> P6).
  - **Page 2: In-Class Teacher Intervention Protocol**: Dedicated printable clipboard/tablet dashboard organized into a 2-column layout (Morning Conceptual P1–P3 vs Afternoon Regular P4–P6). Each period card features explicit Problem Cited (red box), Flagged Students & IDs, Support Needed / Teacher Action with verbal coaching scripts (green box), and Pending Drafts Checklist (amber box).
- **Telemetry Pathology Catalog**:
  - Formally codified detection criteria and remediation steps for 9 established archetypes: video frame numbers vs seconds, synthetic integer placeholders, anti-validator skirting, shared quad-group typos, distance-as-time confusion, stopwatch double-tap teleportation, mid-table unit switches, and vehicle collision/stalls.
- **Print & PDF Automation**:
  - Exact Letter portrait CSS budget (`@page { size: letter portrait; margin: 0.22in 0.28in; }`) and headless Puppeteer render routine guaranteeing 2-page PDFs with zero overflow.

## 2026-09-24 — System Streamlining: Single Source of Truth & Wiki Log Archival

**Pattern Updated**: `dashboard-layout.md`.

**Changes**:
- **Curriculum Architecture**:
  - Deleted legacy duplicate stores `Unit_2/lesson.json` and `Unit_2/unit2_lessons.json` (6,600+ redundant lines removed).
  - Updated `unit2-dashboard.html` and `Bell-Ringer/teacher.html` to consume `assets/lessons-data.js` directly as the unified single source of truth across all 7 units.
  - Updated `.agents/AGENTS.md` to strictly mandate `assets/lessons-data.js` as the sole master curriculum store.
- **Wiki Log Archival**:
  - Archived 2,295 historical lines into `.agents/wiki/logs-archive-2026.md`.
  - Pruned active `logs.md` from 2,371 lines down to ~90 lines for maximum token efficiency and fast context loading.

## 2026-09-24 — Daily Update: Unit 2 Day 20 Stopping Distance Synthesis & CAST Engine Polish

**Pattern Updated**: `cast-aligned-webapp-design.md`, `dashboard-layout.md`.

**Changes**:
- **Curriculum Harmonization (`assets/lessons-data.js`, `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, `Unit_2/outline.md`)**:
  - Aligned Day 20 (Kinematic Acceleration Synthesis: 2-Stage Stopping Distance Performance Challenge) for Friday (2026-09-25) across all 4 central stores with 100% key parity and dual NGSS alignment (`HS-PS2-1`, `HS-ETS1-2`).
  - Refined Part 2 calculation prompt to preserve authentic pedagogical friction by removing inline calculation leaks from the prompt text while preserving formula references in hints.
  - Audited all 139 lessons confirming 100% explicit NGSS standards tagging and 0 LaTeX syntax.
- **CAST Engine Enhancement (`assets/js/cast-item-engine.js`)**:
  - Implemented `formatSafeText()` to safely render inline HTML formatting (`<sub>`, `<sup>`, `<b>`, `<strong>`, `<i>`, `<em>`, `<code>`) across phenomenon narratives, prompts, data table captions, headers, cells, and formula hints while safely escaping untrusted markup.
  - Extended `cleanPromptText()` regex to match subscripted delta variables (e.g. `Δx₂`).
  - Bumped script cache busters in `Bell-Ringer/index.html` (`v=2.7`) and `unit2-dashboard.html` (`v=20260924b`).
- **Site Deployment**:
  - Refreshed site footer deployment timestamp via `node scripts/update-timestamp.js`.

## 2026-09-24 — The Gradest: Manual Grade Entry for Webcam Scanner

**Pattern Added**: `the-gradest-bubble-scanner.md`.
**Pattern Updated**: `classroom-gradebook-sync.md`.

**Changes**:
- **Webcam Scanner Manual Grade Entry Modal (`index.html`, `style.css`, `app.js`)**:
  - Implemented manual grade entry on the webcam bubble scanner page (`tab-scan`) for students who completed their tests on paper without bubbling the answer sheet.
  - Added primary access points directly on the Webcam Scanner feed controls (`btn-manual-entry-scan`), the Scanner Output header (`btn-quick-manual-output`), the empty-state scanner card (`btn-scanner-empty-manual`), and the Grades Directory (`btn-grades-manual-entry`).
  - Added fast roster dropdown picker with live graded/ungraded tracking status (e.g. `✓ Graded: 92/100 (92%)` vs `[Not yet graded]`), auto-complete student name search on Student ID keystroke, and existing score overwrite warning.
  - Added live percentage readout with color thresholds, quick score percentage preset chips (`100%`, `90%`, `80%`, `70%`, `50%`, `0% Missing`), and a rapid batching workflow via `"Save & Add Another"`.
  - Persists directly into `state.grades` with status `"Manually Entered"` (styled with `.badge-manual`), renders into recent scans session log, and syncs immediately to local storage and Cloud Firestore collection `gradest_assignments`.
- **Repository Synchronization**:
  - Fixed unclosed `#dialog-edit-grade` backdrop container tag.
  - Committed and pushed changes to `https://github.com/rrmudry/The_Gradest.git` `main` branch and synchronized local clone in `admin/The_Gradest/`.
  - Refreshed site footer deployment timestamp via `node scripts/update-timestamp.js`.

## 2026-09-23 — Differentiated Curriculum: P031 Reaction Time Lab (Period 0) & Pull-Back Toy Lab (Periods 1–6)

**Pattern Updated**: `dashboard-layout.md`, `cast-aligned-webapp-design.md`.

**Changes**:
- **Day 18 Progress Documentation**:
  - Recorded section pacing divergence: Period 0 (Honors Physics) completed the full hands-on Pull-Back Toy Motion Lab and calculation verification.
  - Periods 1–6 utilized the instructional block to finalize the Kinematic Velocity Calculator (Day 17) and Acceleration Rate & Sign Studio (Day 16).
- **Day 19 Differentiated Hands-On Labs**:
  - Period 0 (Honors Physics): Runs the paper-and-ruler hands-on investigation `P031 Reaction Time Lab` (measuring human neural reaction times via free-fall metric ruler drops $t = \sqrt{2d/g}$, comparing visual vs. auditory stimulus, cell-phone distractions, and computing highway reaction distances).
  - Linked official OneDrive handout: `https://orangeusdorg-my.sharepoint.com/:w:/g/personal/rmudry_orangeusd_org/IQC56lu4HK0nRKxL2XhMmeZXAREUmHZaWstYUWZfSSPZ9N8?e=cQ1qok`.
  - Periods 1–6: Conduct the hands-on Pull-Back Toy Motion Lab with metric track calibration, slow-motion video telemetry, and x vs. t plotting.
  - Updated all 4 central curriculum files (`assets/lessons-data.js`, `Unit_2/unit2_lessons.json`, `Unit_2/lesson.json`, `Unit_2/outline.md`) with dual NGSS standards (`HS-PS2-1`, `HS-PS2-2`), explicit assignments, and zero LaTeX formatting.

## 2026-09-23 — Graphing Speed Story: Google Classroom Deployment & Grade Sync

**Pattern Updated**: `classroom-gradebook-sync.md`, `assignment-registry.md`.

**Changes**:
- **Classroom Deployment (`sync-classroom/post-graphing-speed-story-assignment.js`)**:
  - Created "Graphing Speed Story" (10 pts) coursework across all 7 class periods (Period 0 to Period 6) placed under "Unit 2: Motion".
  - Attached both official student materials: Worksheet PDF (`Unit_2/worksheets/Graphing_Speed_Story.pdf`) and Student Exemplar Guide (`assets/images/graphing_speed_story_exemplar.jpg`).
  - Registered `assignment_registry/Graphing_Speed_Story` and updated `gradest_assignments/Graphing Speed Story`.
  - Mirrored all 66 student webcam-graded scores into individual documents in `student_results/Graphing_Speed_Story/students/{studentId}` with correct period metadata from `roster`.
- **Grade Sync & Return**:
  - Ran headless sync pushing and returning all 66 student grades (100% success rate: 65 at 10/10, 1 at 9/10) to Google Classroom ready for Aeries import.

## 2026-09-23 — Daily Update: Unit 2 Day 18 & 19 Curriculum Harmonization & Deployment

**Pattern Updated**: `cast-aligned-webapp-design.md`, `dashboard-layout.md`.

**Changes**:
- **Curriculum Synchronization (`Unit_2/lesson.json`, `Unit_2/unit2_lessons.json`, `Unit_2/outline.md`, `assets/lessons-data.js`)**:
  - Harmonized Day 18 (Graphing Pull-Back Toy Motion Lab: Uniform Acceleration from Rest) across all four curriculum stores with dual NGSS alignment (`HS-PS2-1`, `HS-PS2-2`), lab setup video walkthrough links, and interactive companion webapp links.
  - Verified Day 19 (Calculating Distance for Accelerated Motion: Geometric Area under v-t) standards (`HS-PS2-1`), 3-step CAST Challenge Bell-Ringer, and Dual-Graph Motion Studio links.
  - Performed site-wide NGSS standards audit confirming 100% of all 139 lessons have explicit `standards: [...]` arrays and 0 LaTeX syntax errors.
- **Site Deployment**:
  - Refreshed site footer deployment timestamp via `node scripts/update-timestamp.js`.

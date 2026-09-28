# Google Classroom Gradebook Synchronization Architecture

## 1. Google Classroom API Security & Ownership Model
- **`@ProjectPermissionDenied` Gotcha**:
  - Google Classroom enforces strict Developer Project isolation.
  - The Google Classroom API **only permits** modifying, patching (`draftGrade`, `assignedGrade`), or returning student submissions on coursework that was created by the **same Developer Project** via the API (`courses.courseWork.create`).
  - If a teacher creates an assignment manually via `classroom.google.com`, the API marks it as `associatedWithDeveloper: false` and will reject `studentSubmissions.patch` requests with `@ProjectPermissionDenied: The Developer Console project is not permitted to make this request.`
  - **Solution**: The sync portal features a built-in **"Deploy Classroom Coursework"** tool that programmatically creates assignments with `associatedWithDeveloper: true`.

## 2. Firestore Virtual Parent Document Enumeration
- **The Issue**:
  - Interactive student webapps store progress directly in subcollections:
    `student_results/{assignmentId}/students/{studentId}`
  - In Firestore, parent assignment documents that hold subcollections but have no document-level fields are "virtual" documents.
  - Calling `db.collection('student_results').get()` returns **0 documents**.
- **The Solution**:
  - Use `await db.collection('student_results').listDocuments()` with the Firebase Admin SDK to enumerate all virtual parent document references.
  - Count submissions using `ref.collection('students').count().get()`.

## 3. High-Speed Batch Synchronization & Period Isolation
- **Period Gating**:
  - Running a sync against a single course without period filtering forces the API to lookup all students across all periods, leading to 1-2s delay per non-enrolled student.
  - Always extract and isolate `inferredPeriod` (including **Period 0**) from course metadata (`section` / `name`).
  - Auto-filter the student score list to match the selected course's period before initiating batch sync.
- **Concurrent Request Pools**:
  - Run sync requests in parallel pools of 4–5 concurrent promises (`Promise.all(chunk)`).
  - This reduces synchronization time for a full classroom from ~4 minutes to ~4–6 seconds.

## 4. `physics_labs` Direct Collection Integration
- **Direct Document Keying**:
  - Unlike legacy `student_results/{assignmentId}/students/{studentId}` subcollections, modern physics webapps save directly to `physics_labs/{studentId}`.
  - The sync server detects active lab apps (such as `physics_speed_calculator`), enumerates student records, and joins with `roster` to pull student names and class periods.
- **Period 0 Falsy Preservation**:
  - JavaScript `rData.class_period || null` evaluates `0` to `null`. Always use strict `!== undefined && !== null` checks to preserve Period 0 (Honors Physics).
- **Proportional maxPoints Auto-Scaling**:
  - When syncing grades to coursework where `maxPoints` is non-standard (e.g. 6 pts or 10 pts instead of 100), the server dynamically fetches coursework `maxPoints` and scales percentage grades proportionally.

## 5. Headless Daily CLI Sync (`npm run sync`)
- **Daily Home Routine Automation**:
  - Teachers syncing grades from home daily can bypass the web portal completely by running `npm run sync` (or previewing with `npm run sync:dry`).
  - The script (`sync-cli.js`) automatically:
    1. Ignores TA sections (`Jacob P5 TA`, etc.).
    2. Maps academic periods 0 through 6 to their Google Classroom courses.
    3. Finds the matching coursework in each course by title.
    4. Auto-scales scores according to each course's `maxPoints`.
    5. Syncs and returns submissions, outputting an executive summary table across all 7 courses.

## 6. Multi-Assignment Batch Sync & Late Work Evaluation
- **All-Assignments Default Scanning**:
  - Running `npm run sync` without arguments queries all active scored assignments from Firestore (`physics_labs`, `student_results`, `gradest_assignments`) where `studentCount > 0`.
  - Because students turn in missing or late work on previous units and assignments continuously, the tool evaluates all assignments across all 7 periods in a single invocation.
  - Teachers can still target a specific assignment by passing its title as a positional argument: `npm run sync -- "Constant Speed Story"` or dry-run it with `npm run sync:dry -- "Constant Speed Story"`.

## 7. Rule B: Higher Score Wins & Manual Grade Protection
- **Protecting Teacher Manual Edits**:
  - Teachers frequently adjust grades manually in Google Classroom (e.g. granting partial credit, scoring paper makeups, or entering points for offline submissions like on `Digital Fantasy Map Distance Displacement`).
  - `sync-cli.js` implements **Rule B ("Higher Score Wins / Never Lower Manual Grades")**:
    1. Before patching or returning, it inspects both `assignedGrade` and `draftGrade` from the student's submission.
    2. If `existingGrade >= scaledScore` and the submission is not unreturned turned-in work, the tool preserves the higher Google Classroom grade in 0ms (`✓ Up to date: Preserved higher Classroom grade`).
    3. The tool only updates if the student's app score is strictly higher than what is recorded in Classroom (e.g. a late retake turning a 0 into a 10/10) or if Classroom has no grade recorded yet.
    4. This guarantees that manual grades are 100% safe from automated overwrites.

## 8. Distinguishing Keyword Guards & Manual Coursework Exclusion
- **Distinguishing Keyword Guards**:
  - When assignments have related names (e.g., "Fantasy Map Vector Calculations" vs "Fantasy Map Distance Displacement"), simple substring matching could accidentally match the wrong coursework.
  - `findMatchingCourseWork()` applies distinguishing keyword checks (`vector`, `displacement`, `distance`, `speed`, `calculator`, `conversion`) so that coursework matching requires matching specific sub-task keywords.
- **Manual Assignment Exclusion & `@ProjectPermissionDenied` Safety**:
  - Assignments created by hand in the Google Classroom web UI (such as `Accuracy_Precision_Emoji_Art`) are not associated with the Developer Console Project (`associatedWithDeveloper: false`). Attempting to patch them triggers `@ProjectPermissionDenied`.
  - The tool explicitly excludes known manual assignments from automated batch sync (`MANUAL_ASSIGNMENT_EXCLUSIONS`) and wraps submission patches in a try/catch block that marks any unexpected unowned coursework as `MANUAL (UI ONLY)` without crashing the batch run.

## 9. Pre-Flight Submission Prefetching & Quota Optimization
- **Batch Listing (`pageSize: 100`)**:
  - Instead of looking up student submissions individually (which caused 30+ network roundtrips per course per assignment), `sync-cli.js` calls `classroom.courses.courseWork.studentSubmissions.list` with `pageSize: 100` once per coursework.
  - Submissions are indexed by `userId` in memory.
- **Zero-Write Skipped Submissions**:
  - If a student's submission already has `assignedGrade === scaledScore` and `state === 'RETURNED'`, the script skips it without making an API write call.
  - For a typical full-roster check across 7 periods, ~590 out of 600 submissions are evaluated and verified as up-to-date in under 2 seconds, completely avoiding Google Classroom API rate limits.

## 10. Coursework maxPoints Rescaling & Legacy Oversized Grade Recovery
- **The Problem: Multiplied Scale Inversion in SIS Gradebooks (Aeries)**:
  - If coursework is mistakenly created with `maxPoints: 100` instead of the standard 10 points (e.g. `Unit Conversion Practice`), SIS gradebooks like Aeries inherit the 100-point value and overwrite teacher manual corrections back to 100 on every Aeries sync.
- **Automated Solution**:
  1. **Coursework Patching**: Use `classroom.courses.courseWork.patch({ courseId, id, updateMask: 'maxPoints', requestBody: { maxPoints: 10 } })` to update the assignment to 10 points across all active courses.
  2. **Legacy Oversized Grade Recovery in Rule B**:
     - Standard Rule B preserves `existingGrade >= scaledScore`. If a student had `100` from the old scale and the new scaled score is `10`, naive Rule B would falsely preserve `100` because `100 >= 10`.
     - `sync-cli.js` checks `const isLegacyOversizedGrade = existingGrade !== null && maxPts < 100 && existingGrade > maxPts;`.
     - When an oversized legacy grade is detected, it bypasses preservation, recalculates the scaled score (e.g. 10/10, 3.3/10), updates `draftGrade` and `assignedGrade`, and returns the submission.
  3. **UI Deploy Default**: The deployment form in `sync-classroom/public/index.html` and `server.js` defaults `maxPoints` to 10 to prevent accidental 100-point creation in the future.

## 11. Assignment Registry: Single Source of Truth
- **The Problem (Solved)**:
  - Before the registry, `sync-cli.js` relied on fragile string matching (`findMatchingCourseWork()`) to connect Firestore assignment IDs to Google Classroom coursework. Name mismatches between webapp `ASSIGNMENT_ID` constants (e.g. `unit2_day16_acceleration_studio`) and Classroom titles (e.g. `"Acceleration Studio Practice"`) caused grade sync failures.
- **The Solution: `assignment_registry` collection**:
  - A Firestore collection where each document is keyed by `ASSIGNMENT_ID` and contains a `coursework` map of `courseId → courseworkId`.
  - `sync-cli.js` now checks the registry **first** for a direct coursework ID lookup. If found, no string matching is needed. Legacy string matching is preserved as a fallback for older assignments.
  - See [`assignment-registry.md`](patterns/assignment-registry.md) for full schema and workflow details.
- **Unified Deployment Script (`deploy-assignment.js`)**:
  - Replaces per-assignment `post-*.js` scripts. Creates coursework across all 7 periods and writes the registry document atomically.
  - Usage: `npm run deploy -- --id "my_id" --title "My Title" --points 10 --topic "Unit 2: Motion" --url "https://..."`
## 12. Google Classroom Roster Pagination Gotcha (`pageSize: 100` Silently Caps at 30)
- **The Pitfall**:
  - Calling `classroom.courses.students.list({ courseId, pageSize: 100 })` ignores `pageSize: 100` and silently caps results at **30 students per page**.
  - Any course with > 30 enrolled students (e.g. Period 4 with 38 students, Period 5 with 42 students) truncates students on page 2 (students 31+).
  - This previously caused students sorted late in the alphabet or on page 2 (like Anahi Naranjo, David Banuelos Ulloa, etc.) to be marked as "unmatched/errors" during sync runs.
- **The Solution**:
  - Always implement a `do ... while (pageToken)` loop requesting `pageToken: pageToken || undefined` and re-querying until `nextPageToken` is falsy.
  - Fixed across `sync-classroom/sync-cli.js` and `sync-classroom/sync-bellringers.js`.

## 13. Studio Score Normalization: Erroneous `numScore <= 15` / 10 Heuristic
- **The Pitfall**:
  - Interactive studios (such as `Dual Graph Studio` and `Position Time Graph Studio`) have 6 sequential missions totaling 100 points, where Mission 1 awards 15 points (15%).
  - If a script assumes `numScore <= 15` without an explicit `maxScore` means "a score out of 10", a student who completed only Mission 1 (`score: 15`) will be calculated as `(15 / 10) * 100 = 150%`, resulting in an inflated grade of **15/10 pts** in Google Classroom.
- **The Solution**:
  - Scores in `student_results` and `gradest_assignments` should only be divided by `max` if `max > 0 && numScore <= max`.
  - When `max` is undefined, `score` in studio webapps is already on a 0–100 percentage scale and should be treated directly as `rawPct = numScore`.
  - Legacy oversized grades (`existingGrade > maxPts`) are automatically detected in Rule B and scaled back down to authentic values (e.g. 15/10 ➔ 1.5/10).

## 14. Differentiated Scoring Architecture for Conceptual Physics (Periods 1–3)
- **Pedagogical Rationale**:
  - Students in Conceptual Physics (Periods 1, 2, and 3) frequently complete the same inquiry labs and multi-level simulation studios as Regular (Periods 4–6) and Honors (Period 0) Physics.
  - In studios (e.g. 6 missions) and labs (e.g. 6 steps), the early stages represent authentic, high-value data collection, instrument reading, and core conceptual models. Later stages demand complex algebraic formulas, multi-step velocity/acceleration transformations, or trigonometric vectors.
  - To equitably reward foundational effort, lab data collection, and initial progression without punitive failure for struggling on advanced math, an active passing baseline model is applied exclusively to Periods 1–3.
- **60% Passing Base + 40% Scaled Mastery Model**:
  $$\text{effectivePct} = 60 + 0.40 \times \text{rawPct} \quad (\text{for } 0 < \text{rawPct} < 100)$$
  - **Zero Effort Protected**: $0\% \rightarrow 0\%$ ($0.0/10$).
  - **Authentic Effort & Data Gathering Rewarded (Passing Floor)**:
    - Level 1 Completion / Initial Setup ($15\%$ raw) $\rightarrow 60 + 0.40(15) = \mathbf{66.0\%} \rightarrow \mathbf{6.6 / 10\text{ pts}}$ (solid passing D+).
    - Level 1–2 / Basic Lab Setup ($25\%$ raw) $\rightarrow 60 + 0.40(25) = \mathbf{70.0\%} \rightarrow \mathbf{7.0 / 10\text{ pts}}$ (solid C-).
    - Levels 1–2 Mastery ($30\%$ raw) $\rightarrow 60 + 0.40(30) = \mathbf{72.0\%} \rightarrow \mathbf{7.2 / 10\text{ pts}}$ (solid C).
    - Complete Data Collection & Initial Analysis ($50\%$ raw) $\rightarrow 60 + 0.40(50) = \mathbf{80.0\%} \rightarrow \mathbf{8.0 / 10\text{ pts}}$ (solid B for full authentic lab data gathering).
    - Intermediate Algebraic Analysis ($65\%$ raw) $\rightarrow 60 + 0.40(65) = \mathbf{86.0\%} \rightarrow \mathbf{8.6 / 10\text{ pts}}$ (solid B+).
    - High Progression ($75\%$ raw) $\rightarrow 60 + 0.40(75) = \mathbf{90.0\%} \rightarrow \mathbf{9.0 / 10\text{ pts}}$ (solid A-).
    - Advanced Calculations ($85\%$ raw) $\rightarrow 60 + 0.40(85) = \mathbf{94.0\%} \rightarrow \mathbf{9.4 / 10\text{ pts}}$ (solid A).
    - Full Completion ($100\%$ raw) $\rightarrow \mathbf{100.0\%} \rightarrow \mathbf{10.0 / 10\text{ pts}}$ (100% full credit preserved).
- **Scope & Safety**:
  - Applied automatically in both CLI sync (`sync-classroom/sync-cli.js`) and UI single-grade sync (`sync-classroom/server.js`).
  - Periods 0 (Honors) and 4–6 (Regular) remain strictly on standard linear scaling.
  - Rule B protects all teacher manual adjustments and ensures grades are never lowered.


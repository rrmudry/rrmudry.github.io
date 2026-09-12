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



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


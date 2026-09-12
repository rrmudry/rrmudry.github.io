---
description: Synchronize student assignment grades to Google Classroom across all periods from home
---
# Sync Grades Workflow

Use this workflow as part of your daily routine from home to automatically push student activity grades from Firestore to Google Classroom and return submissions for Aeries gradebook sync.

Because students are allowed to submit work late, the workflow automatically evaluates **all active assignments** by default to push new scores, catch late submissions, and return work to students—while intelligently skipping submissions that are already up-to-date to save time and API quota.

## Option A: Chat Automation (Easiest)
Simply type this in chat:
> **/sync-grades**
or
> "Sync grades for all assignments"
or
> "Sync grades for [Assignment Name]"

I will:
1. Detect all active scored assignments in Firestore (`physics_labs`, `student_results`, `gradest_assignments`).
2. Match coursework across all 7 Google Classroom courses (Period 0 to Period 6).
3. Scale points proportionally to the assignment's max points (e.g. 10/10 pts or 100/100 pts).
4. Apply **Rule B (Higher Score Wins)**: check existing grades in Classroom. If you manually entered a grade or if an existing grade is higher than or equal to the app score, it is preserved and NEVER lowered. Only higher scores (e.g. late work replacing a zero or retakes) are updated.
5. Skip submissions already up-to-date in 0ms without consuming write quota.
6. Provide a Master Executive Summary table across all assignments and periods.

## 🛡️ Grade Protection: Rule B ("Higher Score Wins")
- **Manual Classroom Grades Are Safe**: Any score manually input into Google Classroom (for paper submissions, modified tasks, or teacher adjustments like on `Digital Fantasy Map Distance Displacement`) is protected. The sync will never overwrite a higher or equal manual grade with a lower app score.
- **Late Work & Retakes**: If a student turns in work late or retakes an assignment and achieves a higher score, the system automatically elevates the grade and returns it to the student.
- **Manual Assignments Excluded**: Assignments created manually in Google Classroom (without the API, such as `Accuracy_Precision_Emoji_Art`) are automatically bypassed so no `@ProjectPermissionDenied` errors occur.

## Option B: Fast Terminal Commands
From the root workspace or `sync-classroom/` directory:

### 1. Preview Sync for ALL Assignments (Dry Run)
Check student scores and see what would be updated without writing to Google Classroom:
```bash
cd sync-classroom
npm run sync:dry
```

### 2. Live Sync Across ALL Assignments (Default)
Push and return all student grades across all active assignments and periods:
```bash
cd sync-classroom
npm run sync
```

### 3. Target a Specific Assignment
If you only want to sync or update a single assignment:
```bash
cd sync-classroom
npm run sync -- "Constant Speed Story"
```
Or dry-run a single assignment:
```bash
npm run sync:dry -- "Constant Speed Story"
```

### 4. Sync a Single Period
If you only need to sync one class (e.g. Period 0 Honors) across all assignments:
```bash
cd sync-classroom
npm run sync -- --period=0
```
Or for a specific assignment and period:
```bash
npm run sync -- "Constant Speed Story" --period=0
```

### 5. Force Re-Sync
If you ever need to force a re-evaluation and re-return of all submissions regardless of current state:
```bash
npm run sync -- --force
```

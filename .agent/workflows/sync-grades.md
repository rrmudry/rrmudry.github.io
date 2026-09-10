---
description: Synchronize student assignment grades to Google Classroom across all periods from home
---
# Sync Grades Workflow

Use this workflow as part of your daily routine from home to automatically push student activity grades from Firestore to Google Classroom and return submissions for Aeries gradebook sync.

## Option A: Chat Automation (Easiest)
Simply type this in chat:
> **/sync-grades**
or
> "Sync grades for [Assignment Name]"

I will:
1. Detect scored assignments in Firestore (`physics_labs`, `student_results`, `gradest_assignments`).
2. Match coursework across all 7 Google Classroom courses (Period 0 to Period 6).
3. Scale points to the assignment's max points (e.g. 10/10 pts).
4. Synchronize and return submissions so students receive credit and Aeries can import grades.
5. Provide a summary breakdown table of all periods.

## Option B: Fast Terminal Command (1-Step)
From the root workspace or `sync-classroom/` directory:

### 1. Preview Sync (Dry Run)
Check student scores and email matching without modifying Google Classroom:
```bash
cd sync-classroom
npm run sync:dry
```

### 2. Live Sync Across All 7 Periods
Push and return all student grades to Google Classroom:
```bash
cd sync-classroom
npm run sync -- "Physics Speed Calculator"
```
*(If you omit the assignment title, it automatically defaults to the latest active student lab)*.

### 3. Sync a Single Period
If you only need to sync one class (e.g. Period 0 Honors):
```bash
cd sync-classroom
npm run sync -- --period=0
```

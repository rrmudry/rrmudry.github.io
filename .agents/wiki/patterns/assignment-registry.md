# Assignment Registry Pattern

## Overview
The `assignment_registry` Firestore collection is the **single source of truth** linking webapp `ASSIGNMENT_ID` constants to their Google Classroom coursework IDs across all class periods. It eliminates fragile string-matching during grade sync.

## Architecture

### Data Flow
```
deploy-assignment.js ──┐
                       ├──▶ assignment_registry/{ASSIGNMENT_ID}
                       │      • coursework: { courseId → courseworkId }
Student webapp ────────┤      • title, maxPoints, firestorePath
                       │
sync-cli.js ───────────┘
  └── Registry-first lookup (no string matching)
  └── Legacy string matching (fallback only)
```

### Firestore Schema: `assignment_registry/{ASSIGNMENT_ID}`
```javascript
{
  assignmentId: "unit2_day16_acceleration_studio",  // Same as doc ID
  title: "Acceleration Studio Practice",
  description: "...",
  maxPoints: 10,
  firestorePath: "student_results",   // Which collection holds scores
  coursework: {                       // courseId → courseworkId map
    "875053343151": "873261352229",    // Period 0
    "875053274185": "873261693561",    // Period 1
    // ... one entry per period
  },
  activityUrl: "https://rrmudry.github.io/...",
  unit: "Unit 2: Motion",
  standards: ["HS-PS2-1"],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Key Invariant
The webapp's `ASSIGNMENT_ID` constant **must exactly match** the `assignment_registry` doc ID. This is enforced by using the same `--id` value when running `deploy-assignment.js`.

## Sync Resolution Order
`sync-cli.js` resolves coursework IDs in this order:
1. **Registry lookup** — Direct `courseId → courseworkId` from `assignment_registry`
2. **Alternate ID forms** — Tries `_` ↔ space conversion on the assignment ID
3. **Title match** — Searches all registry entries by normalized title
4. **Legacy fallback** — `findMatchingCourseWork()` string matching against Classroom API

## Deployment Workflow

### New Assignment
```bash
cd sync-classroom
npm run deploy -- \
  --id "unit3_newtons_lab" \
  --title "Newton's Second Law Lab" \
  --points 10 \
  --topic "Unit 3: Forces" \
  --url "https://rrmudry.github.io/Unit_3/newtons_lab/index.html"
```

This single command:
1. Creates coursework in Google Classroom across all 7 periods
2. Writes `assignment_registry/unit3_newtons_lab` with all coursework IDs
3. Writes `gradest_assignments` entries (backwards compat)
4. Ensures `student_results/unit3_newtons_lab` parent doc exists

### Backfill Existing Assignments
```bash
node backfill-registry.js             # Live migration
node backfill-registry.js --dry-run   # Preview
```

## Known Pitfalls

### 1. Duplicate Registry Entries
If an assignment has multiple names in `gradest_assignments` (e.g. both `"Constant Speed Story"` and `"Constant_Speed_Story"`), the backfill deduplicates by normalized title and writes a single registry entry.

### 2. Orphaned student_results
The `backfill-registry.js` script reports student_results collections with no registry entry. These are typically:
- Assignments from other units not yet deployed to Classroom
- Manual-only assignments (e.g. `Accuracy_Precision_Emoji_Art`)
- Legacy test data

### 3. The `coursework` Map Uses Course IDs, Not Period Numbers
The `coursework` field maps **courseId** (Google's internal ID) to **courseworkId**, NOT period numbers. This is intentional — period numbers can be extracted from course metadata, but courseIds are stable.

### 4. Manual Classroom Assignments Cannot Be Registered
Assignments created manually in the Google Classroom web UI have `associatedWithDeveloper: false`. The registry can store their coursework IDs, but `sync-cli.js` cannot patch or return submissions for them (Google API restriction).

## Backwards Compatibility
- `gradest_assignments` continues to be written by `deploy-assignment.js`
- `sync-cli.js` falls back to legacy string matching when no registry entry exists
- Old `post-*.js` scripts still work but should be migrated to `deploy-assignment.js`

## Evidence
- Registry system implemented 2026-09-21
- Backfill successfully migrated 13 existing assignments
- Solves Acceleration Studio Practice sync failure (student_results/unit2_day16_acceleration_studio → Classroom "Acceleration Studio Practice")

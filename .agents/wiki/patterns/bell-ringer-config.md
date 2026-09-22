# Bell-Ringer Activity Configuration Patterns

## System Overview
The Bell-Ringer system is a three-page application:

| Page | Path | Purpose |
|---|---|---|
| **Student Portal** | `Bell-Ringer/index.html` | Student workspace: auth, timer, activity panels, submission |
| **Classroom Dashboard** | `Bell-Ringer/dashboard.html` | Projected grid showing live student status tiles |
| **Teacher Control Panel** | `Bell-Ringer/teacher.html` | Admin: period selector, activity config, manual overrides |

## Activity Types
Three activity types are configured via `activityType` in Firestore:

### 1. `free_response` — Written Explanation
- Student writes a physics explanation in a text box
- Firebase Gemini Extension auto-grades for "good-faith scientific effort"
- Scores: `1` (honest attempt) or `0` (gibberish/opt-out)

### 2. `connections` — Connections Grid Game
- NYT Connections-style word grouping game with physics terms
- Must follow `fair-connections.md` rules (see `.agents/rules/`)
- 4 categories, 16 words, max 1-2 red herrings

### 3. `concept_chat` — AI Concept Chat Mentor
- Text-message style AI conversation about a physics concept
- Uses the **standard persona** defined in AGENTS.md (CRITICAL: never alter)
- Key persona rules: no Socratic traps, pivot to teaching, 1-3 sentences max, never end conversation abruptly
- Student clicks "Finish Session" to submit

### 4. `cast_challenge` — CAST 3D Multi-Step Performance Tasks
- Technology-Enhanced Items (TEIs) modeled after California Science Test formats
- Integrates Disciplinary Core Ideas (DCIs), Science and Engineering Practices (SEPs), and Crosscutting Concepts (CCCs)
- Supported step formats via `assets/js/cast-item-engine.js`:
  - `cloze_dropdown`: Inline cloze sentence with drop-down concept selectors
  - `data_calculation`: Quantitative data analysis with tolerance checking and units
  - `categorize`: Tap-to-place / drag-and-drop category sorting
  - `cer`: Structured 3-field Claim, Evidence, and Reasoning argumentation
- Supports interactive phenomenon assets: `CASTGraphEngine` scatter/line/bar charts, images, and data tables
- Automatic effort scoring (`effortScore: 1` if steps completed > 0) preserves gradebook compatibility while logging full step-by-step answers in `castAnswers`
- Strictly conforms to No-LaTeX policy (`Δx / Δt`, `m/s²`, standard text formulas)

## Firestore Data Model

### `system_config/bellringer_timer` (Session Control)
```javascript
{
    isActive: true,                    // boolean
    targetPeriod: "3",                 // "all", "0"-"6"
    activityType: "free_response",     // "free_response"|"connections"|"concept_chat"
    promptQuestion: "Explain...",      // string
    timerExpiresAt: Timestamp,         // Firestore server timestamp
}
```

### `bellringers/{docId}` (Student Submissions)
```javascript
{
    studentId: "123456",               // email prefix
    studentName: "Jane Smith",
    studentResponse: "The force...",   // student's text response
    promptQuestion: "Explain...",      // echoed from session config
    timestamp: Timestamp,
    effortScore: "1",                  // Set by Gemini Extension ("1" or "0")
    class_period: 3                    // from roster lookup
}
```

### `roster/{studentId}` (Student Enrollment)
```javascript
{
    class_period: 3,                   // integer 0-6
    first_name: "Jane",
    last_name: "Smith"
}
```

## Period Access Gate Pattern
Students are gated by their enrolled class period:
1. Student logs in → system looks up `roster/{studentId}.class_period`
2. If `targetPeriod === "all"` OR student's period matches → grant access
3. If no match → show "wrong period" waiting screen

## Gemini Extension Configuration
The Firebase Extension uses `gemini-3.5-flash` (or `-lite` for quota savings):

```text
Prompt Template:
You are a physics teaching assistant grading for good-faith effort.
Review the student's answer: {{studentResponse}} to the prompt: {{promptQuestion}}.
Output exactly a '1' if they made an honest, good-faith attempt using scientific
context/English words (even if the physics logic is wrong).
Output a '0' if it is gibberish, letters mashed together, explicit opt-outs like 'idk',
or completely unrelated text. Return ONLY the digit 1 or 0.

Response Field: effortScore
Collection Path: bellringers
```

## Dashboard Status Tiles
The classroom dashboard shows color-coded tiles per student:
- **Gray**: Pending — not submitted or awaiting AI verification
- **Green (flash animation)**: Verified good-faith attempt → student may proceed to lab tables
- **Red**: Low effort / revision needed → student can resubmit before lockout

## Grading & Google Classroom Sync Architecture

Bell-Ringers can be graded cumulatively or on a weekly cadence using `sync-classroom/sync-bellringers.js`.

### Quality & Effort Evaluation Engine ("The Half-Ass Filter")
To ensure students who cut corners do not receive participation credit, each submission is evaluated by activity type:

| Activity Type | Genuine Effort (Earns Points) | Low Effort / Half-Assing (0 Credit) |
|---|---|---|
| **CAST Challenge** | `percentComplete >= 50%` or `completedSteps >= 2` | 0% completed, blank fields, or 0 steps answered |
| **Concept Chat** | >= 2 user chat turns (or 1 substantive message >= 15 chars) | 0 chat turns (bypassing to finish) or single-word replies (`"ok"`, `"idk"`) |
| **Free Response** | Genuine attempt >= 15 chars (scientific vocabulary or formula) | Blank, `< 15` chars, explicit opt-out (`"idk"`), or Gemini effortScore 0 |
| **Connections** | At least 1 category solved | 0 categories solved with no real attempt |

### Fairness Cushion Pattern
Due to block schedules (e.g. Thu/Fri alternate periods) and excused absences, different periods have different total possible sessions.
- **Retroactive Cumulative Model**: 10 genuine bell-ringers = 100% full credit (80/80 pts across Weeks 1–5). This builds in 3–5 free drop days per student.
- **Weekly Model**: 4 points per day = 20 points per week.

### CLI Sync Commands
```bash
# Preview retroactive grade (Weeks 1–5, 80 pts, 10 genuine = 100%)
npm run bellringer:dry

# Push retroactive grade to Google Classroom across all 7 periods
npm run bellringer:sync

# Preview current weekly grade (Mon–Fri, 20 pts)
npm run bellringer:weekly:dry

# Push current weekly grade
npm run bellringer:weekly
```

### Data Storage & Registry Linkage
- Aggregated student grades are recorded in `student_results/{assignmentId}/students/{studentId}`.
- Coursework IDs are tracked in `assignment_registry/{assignmentId}` across all courses.

## Known Pitfalls
- **Unturned-in Submissions Return Gotcha**: Google Classroom API throws `Precondition check failed` if `courses.courseWork.studentSubmissions.return` is called on a submission with `state: 'CREATED'`. Always patch `draftGrade` and `assignedGrade`, and only call `.return()` if `sub.state === 'TURNED_IN'`.
- **Concept chat persona**: NEVER modify the AI mentor persona rules in AGENTS.md. They were carefully tuned to prevent "Socratic fishing" and keep conversations flowing.
- **Timer sync**: The timer uses `timerExpiresAt` server timestamp, not client-side countdown. All clients read this timestamp and compute remaining time locally to stay synchronized.
- **Period "all"**: When `targetPeriod` is `"all"`, every authenticated student gets access regardless of period.
- **Gemini quota**: With 150+ students submitting in rapid succession, Gemini API quota can be exhausted. Use `gemini-2.5-flash-lite` if experiencing throttling.
- **Firestore Nested Array Restriction**: Cloud Firestore rejects nested arrays (arrays inside objects that are elements of arrays, such as `summary.stepResults[i].state.chatMessages` or `chatMessages[i].parts`). Always run `sanitizeForFirestore()` to convert nested arrays into maps (`{ item_0: ... }`) and keep message items flat (`{ sender, role, text }`).
- **Unsupported field value: undefined**: Passing `undefined` to `db.collection().set()` throws an immediate exception and halts document creation. Ensure all optional fields default to `null` or are omitted.
- **Timer Expiry Auto-Submit**: CAST 3D tasks require explicit auto-submission hooks (`activeCastEngine.submitAll()`) on countdown timer expiration so students' partially completed work is automatically saved if the timer runs out.

## Evidence
- Full system documented in `Bell-Ringer/README.md` (98 lines)
- Grading CLI implemented in `sync-classroom/sync-bellringers.js`
- Activity types from Firestore schema and teacher.html configuration
- Persona rules from `.agents/AGENTS.md` (lines 30-43)
- Fair connections rules from `.agents/rules/fair-connections.md`

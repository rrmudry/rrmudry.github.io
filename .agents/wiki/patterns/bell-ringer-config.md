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

## Known Pitfalls
- **Concept chat persona**: NEVER modify the AI mentor persona rules in AGENTS.md. They were carefully tuned to prevent "Socratic fishing" and keep conversations flowing.
- **Timer sync**: The timer uses `timerExpiresAt` server timestamp, not client-side countdown. All clients read this timestamp and compute remaining time locally to stay synchronized.
- **Period "all"**: When `targetPeriod` is `"all"`, every authenticated student gets access regardless of period.
- **Gemini quota**: With 150+ students submitting in rapid succession, Gemini API quota can be exhausted. Use `gemini-2.5-flash-lite` if experiencing throttling.

## Evidence
- Full system documented in `Bell-Ringer/README.md` (98 lines)
- Activity types from Firestore schema and teacher.html configuration
- Persona rules from `.agents/AGENTS.md` (lines 30-43)
- Fair connections rules from `.agents/rules/fair-connections.md`

# THE_PROCTOR Assessment Question Bank Architecture

## Overview
THE_PROCTOR examination system (`admin/THE_PROCTOR/THE_PROCTOR_TEMPLATE.html`, `admin/THE_PROCTOR/THE_PROCTOR_BETA.html`) and its administration nodes (`admin/assessment_editor.html`, `admin/question_editor.html`) manage secure student assessments through Cloud Firestore. 

Assessments are stored in `assessments/{assessment_id}`, and questions are stored in `questions/{question_id}` referencing `assignment_name: assessment_id`.

## Data Schema & Conventions

### 1. Assessment Document (`assessments/{id}`)
```javascript
{
  assignment_name: "Newton's 2nd Law Quiz", // Human-readable title
  max_questions: 20,                         // Number of questions sampled per student
  time_limit_mins: null,                     // null for untimed, integer for timed
  isProctorAssessment: true,
  sourceType: "the_proctor",
  updated_at: serverTimestamp()
}
```

### 2. Static Multiple Choice Question (`questions/{id}`)
```javascript
{
  id: 301,                                   // Unique integer sort ID
  assignment_name: "newtons_second_law_quiz",// Matches assessment document ID
  type: "static",
  text: "According to Newton's Second Law of Motion, what is...",
  options: [
    "F_net = m · a",
    "F_net = m / a",
    "F_net = a / m",
    "F_net = m + a"
  ],
  correct_answer: "F_net = m · a",
  correct_answers: ["F_net = m · a"],
  has_calculator: true,                      // Embedded Desmos calculator enabled
  config: null,
  updated_at: serverTimestamp()
}
```

### 3. Calculated Math Question (`questions/{id}`)
Calculated questions dynamically randomize variable values for every student attempt:
```javascript
{
  id: 341,
  assignment_name: "newtons_second_law_quiz",
  type: "calculated",
  text: "A sports car has a mass of {{m}} kg. If it accelerates forward at a rate of {{a}} m/s², what net force is acting on the car?",
  options: [],                               // Generated dynamically at test runtime
  correct_answer: "",
  correct_answers: [],
  has_calculator: true,                      // Embedded Desmos calculator enabled
  config: {
    vars: {
      m: { min: 800, max: 1500, step: 50 },
      a: { min: 2, max: 6, step: 1 }
    },
    calc: "m * a",                           // Evaluated as: new Function(...keys, `return ${calc}`)
    unit: "N"                                // Appended to options: "6000 N"
  },
  updated_at: serverTimestamp()
}
```

## Critical Runtime Pitfalls & Protections

### 1. Distractor Generation in `THE_PROCTOR`
In `THE_PROCTOR_TEMPLATE.html`, dynamic options are generated via:
```javascript
const options = [correctAnswer];
const modifiers = [0.5, 2, 1.5, 0.8, 1.2];
while (options.length < 4 && modifiers.length > 0) {
    const mod = modifiers.shift();
    const distractor = `${Number((answer * mod).toFixed(2))}${unit ? ' ' + unit : ''}`;
    if (!options.includes(distractor)) options.push(distractor);
}
```
- **Rule**: `calc` formulas MUST evaluate to strictly non-zero, positive values. If `answer == 0`, all `answer * mod` equal 0, failing to produce 4 distinct options and breaking question rendering.
- **Variable Bounds**: When defining subtractions (e.g., net force with friction `F_app - F_fric`, elevator tensions `T - m * g`), ensure minimum `F_app` is strictly greater than maximum `F_fric` so that acceleration is always positive.

### 2. Assignment Name / Slug Resolution
In `THE_PROCTOR_TEMPLATE.html`, students load tests via `?a={id}` or `?id={id}`.
- Always implement a fallback query in `fetchQuestions()`:
  1. Try `assignment_name == ASSIGNMENT_NAME`
  2. If empty, try `assignment_name == ASSIGNMENT_NAME.replace(/\s+/g, '_').toLowerCase()`
- Resolve header titles using `assessments/{id}.assignment_name` rather than raw URL slugs.

### 3. No LaTeX Rule
Never use `$`, `\Delta`, `\vec`, or `\frac`. Use plain text and Unicode symbols:
- `F_net = m · a`
- `Δv / Δt`
- `m/s²`
- `ΣF = 0`

### 4. Dynamic Static Option Shuffling
In `THE_PROCTOR_TEMPLATE.html`, `processDynamicQuestions()` initially only shuffled options for `calculated` questions. Because seeds typically define `options[0]` as the correct answer, static questions consistently rendered the correct answer as Choice A.
- **Fix**: In `processDynamicQuestions()`, static questions with `options.length > 1` must undergo Fisher-Yates array shuffling at runtime.
- **Scoring Resilience**: Scoring in `THE_PROCTOR` compares `radio.value === q.correct_answer` (matching the text value of the option), so shuffling positions across A, B, C, D does not alter scoring accuracy.

### 5. Classroom Standard: Earth Gravity is Strictly 10 m/s²
Across all high school physics assessments, webapps, and problem sets in this workspace:
- **Standard Value**: Always use `g = 10 m/s²` (or `10 N/kg`) for Earth gravity, **never** `9.8 m/s²`.
- **Pedagogical Rationale**: Eliminates gratuitous decimal arithmetic friction, supports quick mental math, and keeps students focused on physical relationships rather than rounding errors.
- **Formulas & Prompts**: Write prompts as `g = 10 m/s²` (e.g. `W = m · 10`), and avoid introducing `9.8` in formulas, prompts, or distractor answer choices.

### 6. Lucide Icon Resilience & Web Filter Armor
- **Multi-Tier Script Loaders**: Load local vendored `../../assets/lucide.min.js` and `../../assets/vendor/lucide.min.js` before CDN sources (`jsDelivr`, `unpkg`), preventing script load failures when district web filters block `unpkg.com`.
- **`safeCreateIcons()` Function Guard**: Wrap all `lucide.createIcons()` calls inside `safeCreateIcons()`. If `lucide` fails to load or is blocked, the function catches non-blocking errors, preventing unhandled `ReferenceError` crashes during quiz runtime.



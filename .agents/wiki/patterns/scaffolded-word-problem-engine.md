# Scaffolded Word Problem Engine: The Universal Practice Standard

## Overview & Standard Reference
**Canonical Implementation**: [`physics_speed_calculator/dist/index.html`](file:///home/ryan/My_Antigravity_Projects/rrmudry.github.io/physics_speed_calculator/dist/index.html)  
**Live URL**: `https://rrmudry.github.io/physics_speed_calculator/dist/index.html`

This architecture is the official classroom standard for all quantitative physics word problem practice across `rrmudry.github.io`. It directly fulfills **Student Task Engagement Archetype A (Clear Completion Requirements & Deliverables)** and preserves **Productive Pedagogical Friction** for CAST test preparation.

---

## 1. Pedagogical Architecture: The 3-Tier Scaffold Ladder

High school students struggle with physics word problems due to cognitive overload: simultaneously decoding linguistic phrasing, identifying variables, rearranging algebraic equations, and performing arithmetic computations.

This engine isolates and resolves each barrier sequentially:

```
┌────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: Variable Identification & Formula Anatomy (0 Arithmetic)      │
│ • Drag/tap values & unknown text into algebraic formula slots.         │
│ • Auto-computes answer upon correct placement.                        │
│ • Criteria: 6 questions answered + 4-streak.                           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LEVEL 2: Tool-Aided Computation (Desmos Scientific API)                │
│ • Drag/tap values into formula template.                               │
│ • Integrated Desmos drawer required to compute numerical result.        │
│ • "Paste from Desmos" 1-click clipboard transfer to answer box.        │
│ • Criteria: 6 questions answered + 4-streak + within ±0.05 tolerance.  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LEVEL 3: Mastery Evaluation & Certification Quiz                       │
│ • Timed/scored challenge across diverse, randomized word problems.      │
│ • Independent student computation with unit verification.              │
│ • Generates tamper-resistant Certificate of Kinematic Mastery.          │
│ • Criteria: 6 questions evaluated -> Auto-saves score to Firestore.    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Technical & UX Standards

### A. Dual-Input Modality (Mouse + Touchscreen)
- **HTML5 Drag-and-Drop**: Drag badges from problem text directly into equation drop targets (`.drag-target`).
- **Tap-to-Select / Tap-to-Place**: Tap a value badge to highlight (`.glow-neon`), then tap the target slot. Eliminates friction on school Chromebooks with worn trackpads or touchscreens.
- **Click-to-Clear**: Tapping an occupied slot returns the badge to the problem text.

### B. Embedded Desmos Scientific Calculator API
- Embed the official Desmos Scientific Calculator in a collapsible sidebar (`#modal-calculator`) using `Desmos.ScientificCalculator`.
- **Anti-Cheat / Tool-Use Telemetry**:
  - Automatically inspects `desmosCalculator.getState()` and `HelperExpression` to ensure students actually executed the calculation rather than guessing or looking up answers.
  - One-click `pasteDesmosResult()` bridges the calculator output directly into the answer input field.

### C. Web Speech API (Accessibility & Accommodations)
- Speech synthesis button reads the word problem aloud.
- **Mandatory Acronym Expansion**: Cleanly expands abbreviations before reading aloud:
  - `km/h` → `"kilometers per hour"`
  - `m/s` → `"meters per second"`
  - `mph` → `"miles per hour"`
  - `s` → `"seconds"`, `h` → `"hours"`

### D. Zero-Dependency Web Audio Synthesizer
- Uses native `AudioContext` oscillator for all sound effects (no external audio files to fail loading):
  - `playBeep()`: Sine wave chime for clicks/actions.
  - `playSuccess()`: Ascending 4-note major chord (C4, E4, G4, C5).
  - `playError()`: Sawtooth descending error buzz.
  - `playCombo()`: Exponential chirp for streaks.

### E. Tamper-Resistant Certification & Print Styles
- Generates a cryptographically hashed certificate ID:
  `MUD-{LAB_ID}-{studentId}-{level}-{score}-{CHECKSUM_HEX}`
- Verified print styles (`@media print`) format the certificate cleanly for PDF export or physical portfolio turn-in.

---

## 3. Data Persistence & Gradebook Sync Standards

Every word problem webapp based on this standard must implement dual-path persistence:

1. **Local Lab Resumption (`physics_labs` collection)**:
   - Stores current level, streak, score, unlocked levels, and certificate ID under `physics_labs/{studentId}`:
   ```javascript
   await fbDb.collection('physics_labs').doc(state.studentId).set({
     studentId: state.studentId,
     displayName: state.displayName,
     currentLevel: state.currentLevel,
     unlockedLevels: state.unlockedLevels,
     answered: state.answered,
     streak: state.streak,
     score: state.score,
     completed: state.completed,
     completedAt: state.completedAt,
     certificateId: state.certificateId,
     lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
   }, { merge: true });
   ```

2. **Standard Gradebook Sync Pipeline (`student_results` collection)**:
   - To integrate automatically with `sync-classroom/sync-cli.js` without requiring custom app-specific code branches:
   ```javascript
   const pct = state.completed ? 100 : (state.currentLevel === 3 ? Math.round((state.score / 6) * 100) : (state.currentLevel === 2 ? 70 : 50));
   await fbDb.collection('student_results').doc(ASSIGNMENT_ID).collection('students').doc(state.studentId).set({
     studentId: state.studentId,
     displayName: state.displayName,
     score: Math.round((pct / 100) * MAX_POINTS),
     maxScore: MAX_POINTS,
     percentage: pct,
     completed: state.completed,
     completedAt: state.completedAt || new Date().toISOString(),
     lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
   }, { merge: true });
   ```

---

## 4. Universal Formula Extensibility Template

When creating a new word problem webapp for other physics formulas, use this modular schema to generate the equation slots and solver logic:

```javascript
const FORMULA_CONFIG = {
  id: "acceleration_definition",
  title: "Acceleration Calculator",
  standard: "HS-PS2-1",
  formulaLatexText: "a = Δv / t", // Plain text only! No LaTeX backslashes in student UI
  variables: {
    a: { label: "acceleration", unit: "m/s²", symbol: "a" },
    v: { label: "change in velocity", unit: "m/s", symbol: "Δv" },
    t: { label: "time interval", unit: "s", symbol: "t" }
  },
  solve: {
    a: (vals) => vals.v / vals.t,
    v: (vals) => vals.a * vals.t,
    t: (vals) => vals.v / vals.a
  }
};
```

---

## 5. Checklist for Deploying New Word Problem Apps

- [ ] Gated Google Sign-In with `@orangeusd.org` domain restriction.
- [ ] 3-tier scaffold ladder: Tier 1 (identification), Tier 2 (Desmos calc), Tier 3 (evaluated mastery).
- [ ] Minimum 6 questions with required 4-streak for progression.
- [ ] Dual-input support: HTML5 drag-and-drop + click-to-select/click-to-place.
- [ ] Embedded Desmos Scientific Calculator with calculation telemetry verification.
- [ ] Web Speech API TTS with physical unit expansion.
- [ ] Web Audio native synthesizer for clicks, success, error, and streak cues.
- [ ] Real-time auto-saving with visible HUD cloud status indicator (`Saving...` / `Auto-Saved`).
- [ ] Certificate modal with verification token and print-ready CSS.
- [ ] Assignment registered in `assignment_registry` and synced via `sync-classroom`.
- [ ] Strict compliance with the No-LaTeX math notation rule.

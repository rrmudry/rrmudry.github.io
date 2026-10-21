# Physics Word Search Quest: Architecture & Substitute Plan Pattern

## Overview
The **Physics Word Search Quest** (`Unit_2/physics_word_search/` and `physics-word-search/`) is an interactive, auto-graded physics vocabulary and concept review studio designed for low-friction, high-accountability substitute days, test reviews, and differentiated concept practice.

## Core Architectural Pillars

### 1. The 3-Mission Structure & Differentiated Concept Clues
Rather than mindless letter hunting, students engage with physics definitions and formulas through two modes:
- **Word Bank Mode**: Standard term list with category chips and formulas.
- **Detective Clue Mode**: Terms are concealed behind numbered clues (e.g., *"The vector rate of displacement over time"*). Finding the word unlocks the clue, strikes through the card, and awards mastery points.
- **Missions**:
  - **Mission 1**: Kinematics & 1D Motion (`HS-PS2-1`)
  - **Mission 2**: Newton's Laws & Dynamics (`HS-PS2-1`)
  - **Mission 3**: Aerospace & Safety Engineering (`HS-PS2-2`)

### 2. Procedural Word Search Grid Generator (`js/word-search-engine.js`)
- Generates 14×14 grids supporting all 8 vector directions:
  - Horizontal (Left-to-Right, Right-to-Left)
  - Vertical (Top-to-Bottom, Bottom-to-Top)
  - Diagonal (Down-Right, Up-Left, Down-Left, Up-Right)
- Words are placed longest-first with letter-overlap collision validation.
- Unused cells are filled with English frequency-weighted letters (`AAAAAAAAABBCCDDDDEEEE...`) to maintain realistic, natural board layouts.

### 3. Pointer & Touch Drag Mechanics (`js/app.js`)
- **Chromebook Touchscreen Support**: Uses `document.elementFromPoint(e.clientX, e.clientY)` during `pointermove` to accurately detect tiles regardless of touch capture.
- **Vector Snapping**: Calculates `atan2(dr, dc)` and snaps drag paths to the nearest 45° angle.
- **Scroll Prevention**: Container uses `touch-action: none;` and `user-select: none;` to eliminate accidental browser pull-to-refresh or swipe gestures.
- **Color Differentiation**: Each found word is permanently tagged with a distinct high-contrast color class (`word-theme-0` through `word-theme-9`).

### 4. Zero-Asset Synthesized Web Audio (`js/audio-manager.js`)
- Generates all audio dynamically with the native Web Audio API (no external MP3/WAV files):
  - `playTick()`: Letter drag traversal
  - `playWordFound()`: Ascending 4-note major chord (C5, E5, G5, C6)
  - `playInvalid()`: Descending sawtooth buzz
  - `playHint()`: High-frequency sine bell
  - `playVictory()`: 5-note brass fanfare

### 5. High-Contrast Accessibility & Sub Print Mode
- **WCAG AAA Light Mode**: Ink-slate text on pure white card backgrounds (>14:1 contrast).
- **Universal Root Font Scaling**: Standard 16px, Large 19px, Projector 23px.
- **🖨️ Print Worksheet**: Hides all interactive headers, modals, and buttons, rendering a crisp 1-page paper worksheet with student name/period lines, grid, and definition checklist.

### 6. Multi-Mission Aggregation & Live Cloud Synchronization
- **All 3 Missions Required (30 Words Total)**:
  - Students must find all 10 terms across all 3 missions (30 words total) to submit their final grade for 10/10 points.
  - Submitting before all 3 are completed is strictly blocked with a diagnostic breakdown modal displaying remaining terms per mission.
  - The submit button remains disabled/unready (`Complete All 3 Missions (N/3 Done • X/30 Words)`) until all 30 words are found, when it animates green (`🚀 Submit Final Grade (10/10 Pts • 3/3 Complete!)`).
- **Continuous Multi-Mission Firestore Backup**:
  - Finding any word, using a hint, or changing periods immediately triggers a debounced cloud write to `student_results/unit2_day38_physics_word_search/students/{studentId}`.
  - The payload preserves the complete state of all 3 missions (`missions.kinematics`, `missions.dynamics`, `missions.aerospace`), including found word arrays, hint counts, and completion flags.
  - On page load or Google sign-in, `loadPriorSubmission()` fully restores all found words, coordinates, and styling across all 3 missions simultaneously.
- **Strict 1-Free-Hint Limit**:
  - Each mission permits strictly 1 free hint (`💡 Free Hint (1 left)` -> `💡 0 Hints Left (Used)`).
  - Hints used are backed up to Firestore and localStorage to prevent bypassing limits via reloads.

### 7. Security, Deployment & Verification
- Google Authentication with `@orangeusd.org` domain restriction.
- Auto-resolves period from `roster` collection.
- Deep payload sanitization eliminating `undefined` fields.
- Direct write to `student_results/unit2_day38_physics_word_search/students/{studentId}` (satisfies student-permission law).
- Verified via `sync-classroom/deploy-assignment.js` and `npm run verify`.

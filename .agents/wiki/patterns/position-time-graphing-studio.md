# Position vs. Time Graphing Studio Architecture

> **Status**: Active Architecture Pattern  
> **Tags**: `kinematics`, `position-time`, `graphing`, `slope`, `number-line`, `canvas`, `firestore`, `grading`  
> **Target Course**: High School Physics (Unit 2 Kinematics — Day 11)  
> **Last Updated**: 2026-09-14  

---

## 1. Overview & Pedagogical Purpose

Teaching position vs. time (x-t) graphs requires bridging the abstract coordinate plane (t horizontal, x vertical) with authentic physical motion in 1D space. Novice students often conflate:
1. The vertical graph axis (x) with "height" or "altitude" rather than 1D horizontal position along a track.
2. Steepness with "effort" rather than speed magnitude (|v| = |Δx / Δt|).
3. Negative slope with "slowing down" rather than moving backward toward/past the origin.
4. Velocity (directional rate) with speed (scalar rate).

The **Position vs. Time Graphing Studio** solves this with a **dual-canvas synchronized visualizer** paired with **6 graded mastery missions** totaling 100 points.

---

## 2. "Low Floor, High Ceiling" Architecture & Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    STUDIO ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. Dual Canvas Engine:                                          │
│    - Graph Canvas: (t, x) grid, dynamic slope triangle, loupe   │
│    - Track Canvas: 1D number line, animated car, vector arrow   │
│    - Time Scrubber: scrub/play sweeps t, updates both canvases   │
├─────────────────────────────────────────────────────────────────┤
│ 2. Six Sequential Levels (100 Points Total, 1 Question at a time):
│    - L1: Where is the Car? (15 pts) — 0 math, slider to track   │
│    - L2: Fast or Slow? (15 pts) — 0 math, steep cliff vs ramp   │
│    - L3: Rise over Run (20 pts) — Count boxes UP/ACROSS, divide │
│    - L4: Driving Backwards (15 pts) — Speedometer reading |v|   │
│    - L5: Read the Table (15 pts: 3 @ 5 pts) — 3 distinct datasets│
│    - L6: Draw the Drive! (20 pts: 6, 7, 7 pts) — 3 distinct missions │
├─────────────────────────────────────────────────────────────────┤
│ 3. Cognitive Scaffolding (Low Floor):                           │
│    - Exactly ONE question card at a time with step dots (● ○ ○) │
│    - 5th-grade accessible reading level (no Greek formulas)     │
│    - Big tactile choice buttons & large friendly number inputs  │
│    - Instant encouraging feedback + pulsating [Next ➜] button   │
├─────────────────────────────────────────────────────────────────┤
│ 4. Firestore & Auth Integration:                                │
│    - ASSIGNMENT_ID: "Position_Time_Graph_Studio"                │
│    - Target: student_results/{ASSIGNMENT_ID}/students/{id}      │
│    - Rule: Highest Attempt Wins (0-100%)                        │
│    - Certificate of Kinematic Mastery (print & PDF support)    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Implementation Details

### A. Dual Synchronized Rendering
Both canvases run off a shared state model:
- `getStateAtTime(t, segments)` computes current position x(t) and instantaneous velocity v(t).
- The graph canvas draws the cursor at `(timeToPixel(t), posToPixel(x))`.
- The track canvas translates the vehicle sprite along `trackPosToPixel(x)`.
- When an object stops (Δx = 0), the graph draws a horizontal line while the sprite halts on the track.
- When an object reverses (v < 0), the graph slopes downward while the sprite drives backward with a reversed vector arrow.

### B. Interactive Grid Plotting (Mission 6)
In Mission 6, `visualizer.enablePlottingMode()` allows students to click on the canvas:
- Raw pixel coordinates (mx, my) are mapped to mathematical coordinates (t, x).
- Snapping rounds to the nearest integer (t, x) to prevent fractional trackpad alignment frustration on Chromebooks.
- Plotted points sort chronologically by t, render connecting dashed lines, and once verified, animate the rover along the student's custom curve.

### C. Slope Triangle Overlay
During Mission 2, `setSlopeTriangle(p1, p2, labelRise, labelRun)` renders:
- A horizontal dashed cyan bracket showing Δt (Run).
- A vertical dashed red bracket showing Δx (Rise).
- Direct labels reinforcing v = Rise / Run = Δx / Δt.

---

## 4. Chromebook Viewport Optimization Pattern (1280x720 / 1366x768)

Standard student Chromebooks feature 1280x720 or 1366x768 physical screens. After subtracting the ChromeOS shelf (~48px), tab strip, and URL omnibox (~88px), the **effective vertical viewport is only ~560px to 600px**.

To eliminate cognitive-taxing vertical scrolling for struggling learners:
1. **Unified Top Bar (44px-48px)**: Consolidate branding, tabs, score readout, and auth controls into one single sticky header row. Never stack separate header, nav bar, and score progress banners.
2. **Horizontal Level Strip (32px-36px)**: Display progression levels as a single horizontal pill grid (6 columns on desktop/Chromebook).
3. **Height-Capped Canvases**: Cap the main graph canvas at `185px-215px` and track canvas at `52px-64px`. Never use unrestricted aspect ratio boxes that grow vertically on wide screens.
4. **Side-by-Side Grid (`lg:grid-cols-12`)**: On screens >= 1024px, position visualizers in columns 1–7 and the active question workspace in columns 8–12.
5. **Zero-Scroll Budget**: Total height of top bar + level strip + workspace card + margins is strictly budgeted under **480px**, providing 80px+ of comfortable vertical headroom with zero scroll.

---

## 5. High-Contrast Light Mode Pattern (WCAG AAA)

Many classrooms with projector displays or bright natural lighting prefer light theme mode. However, directly removing `.dark` from a Tailwind-driven dark interface can wash out light-colored text (e.g. `text-white`, `text-slate-200`, `text-lime-300`).

Key guidelines for bulletproof light mode contrast:
1. **Headings & Body Text**: Map all `.text-white` to `#0f172a` (Slate 900) and `.text-slate-100/200/300` to `#1e293b` (Slate 800) under `html:not(.dark)`.
2. **Primary Accent Adaptation**: Never use neon volt (`#ccff00`) or bright yellow on a light background. Map primary volt to `#15803d` (Emerald/Forest green, >7.2:1 contrast ratio) and yellow to `#b45309` (Amber 700).
3. **Card Boundaries**: On light cards (`#ffffff`), replace faint `rgba(255,255,255,0.1)` borders with crisp `1.5px solid #cbd5e1` to preserve clear button bounds and card distinction.
4. **Canvas Contrast Helper**: In dynamic canvas visualizers, implement `getContrastColor(color, isDark)` to convert neon line segments, runners, origin tick markers, time beacons, and car sprites into bold high-contrast colors when `isDark` is false.
5. **Theme Preference Persistence**: Always persist user theme selection to `localStorage.setItem('studio_theme', ...)` and restore prior to canvas initialization.

---

## 6. Anti-Copying Parameterized Problem Variants & Deterministic Seeding

To prevent students sitting side-by-side from copying numbers, graph shapes, and multiple-choice answers, the studio employs a deterministic per-student seeding engine:

### A. Architectural Principles
1. **Identical Cognitive Load & Low Reading Floor**: Every variant tests the exact same concept with clean whole-number math (no messy decimals, no fractions).
2. **Deterministic & Persistent**: A student's variant assignments are derived from their Google student ID hash (`@orangeusd.org`) or a persisted guest seed in `localStorage`. Refreshing the browser or resuming from home preserves their exact assigned problem set without scrambling mid-session.
3. **Multi-Level Permutation Space**: 4 variants across 6 levels yield **4⁶ = 4,096 unique problem combinations**, ensuring adjacent students in a classroom will have completely different numerical values, graph trajectories, and winning cars.

### B. Variant Distribution Formula
```javascript
// FNV-1a 32-bit hash on student ID
hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

// Prime decorrelation across progression levels
getVariant(levelIndex, totalVariants = 4) {
  const primes = [17, 31, 53, 71, 89, 107, 131];
  const p = primes[levelIndex % primes.length];
  return Math.abs(Math.floor(this.studentSeed / p) + levelIndex) % totalVariants;
}
```

### C. Level Parameterization Matrix
| Level | Learning Target | Parameterized Dimensions |
|---|---|---|
| **Level 1** | Finding Position | Flat rest intervals (3s-6s, 4s-7s, 2s-5s), target position (6m, 8m, 12m), choices |
| **Level 2** | Fast or Slow? | Steepness comparisons, finish line distances (14m, 16m, 18m, 20m), race winner (Green vs Blue) |
| **Level 3** | Rise over Run | Box-counting slope triangles with integer division (6m÷2s=3, 8m÷2s=4, 12m÷3s=4, 10m÷2s=5) |
| **Level 4** | Driving Backwards | Reverse speeds (-2, -3, -4 m/s), speedometer scalar readings, vehicle comparisons |
| **Level 5** | Reading the Table | 3 consecutive datasets (3 @ 5 pts = 15 pts): randomized 4-row motion log table coordinates and synchronized quick-jump button times |
| **Level 6** | Draw the Drive! | 3 consecutive missions (6, 7, 7 pts = 20 pts): randomized 4-waypoint coordinate grid target paths for student click-to-plot simulation |

---

## 7. Mindful Engagement & Diagnostic Mistake Reframing Pattern (Levels 1 & 2)

### A. The Pedagogical Problem
When multiple-choice options are unconstrained and zero penalties are applied, students can rapidly "click-spam" through options by process of elimination without engaging with the graph or reading the prompt. Conversely, penalizing mistakes with point deductions induces anxiety and discourages exploration.

### B. The Solution: Attentive Rewards + Diagnostic Clues + Mandatory Fresh Scenario Retries
1. **First-Try Recognition (`⭐ Attentive Reader!`)**:
   - Students who inspect the graph, read carefully, and select the correct answer on their first attempt receive a celebratory `⭐ Attentive Reader!` badge alongside full points.
2. **Tactile Error Feedback & Complete Choice Locking (Anti-Elimination)**:
   - When an incorrect choice is selected, an error tone sounds, the chosen card shakes (`card-shake`) in red, and **all choice cards are locked (`.disabled`)**.
   - This completely eliminates rapid guessing by clicking down a list of options.
3. **Targeted Diagnostic Clue Cards**:
   - Instead of generic "Incorrect, try again" messages, a high-contrast diagnostic card appears displaying a concrete pedagogical clue directing their eyes to the simulation:
     - *Starting vs Current Position*: Reminds them that t=0s is the left edge, but the question asks about where the car stopped later.
     - *Flat Horizontal Line*: Explains that flat means zero rise—the clock ticked forward but position stayed locked.
     - *Downhill Slope*: Clarifies that moving downward on position-time means returning backward toward 0m.
     - *Steep Cliff vs Gentle Ramp*: Compares steepness to climbing a mountain—the steeper line climbs meters much faster.
     - *Negative Velocity vs Speed*: Reminds students that speedometers only show positive values.
4. **Mandatory "🔄 Load Fresh Scenario to Master This" Progression**:
   - Rather than guessing on the same problem, students **must** click the primary `[🔄 Load Fresh Scenario to Master This ➜]` button to proceed.
   - The studio dynamically advances their seed (`(this.studentSeed + prime) % 99999`) and reloads a brand-new scenario with different trajectories and values.
   - This transforms errors into an authentic learning cycle with zero penalty: students reflect on the clue, test their improved understanding on a new case, and can still earn the `⭐ Attentive Reader!` badge.
5. **Seeded Option Permutation (`renderChoiceButtons`)**:
   - Correct answers are never fixed to option (A).
   - Multiple choice options are deterministically permuted using `(studentSeed / 7 + seedSalt) % choices.length`, distributing correct choices naturally across A, B, and C across different students and retries.

---

## 8. Live Background State Backup & Seamless Session Restore Pattern

### A. The Challenge
Students on school Chromebooks frequently close their browser tabs at the bell, switch classrooms, or lose Wi-Fi connectivity mid-activity. If state is only saved upon final submission (`🚀 Submit`), in-progress question responses and partial points would be lost.

### B. The Live Backup Architecture
1. **Per-Action Autosave (`awardPoints`)**:
   - Immediately whenever a step is answered correctly, `awardPoints()` packages a full snapshot of `liveStatePayload`:
     ```javascript
     {
       studentSeed: this.studentSeed,
       levelScores: this.levelScores,
       completedSteps: this.completedSteps,
       currentLevelId: this.currentLevelId,
       currentStep: this.currentStep,
       lastActiveAt: new Date().toISOString()
     }
     ```
   - Automatically invokes `saveStudioGrade(total, liveStatePayload, isAutosave=true)` in the background without modal interruptions.
2. **Dual-Layer Fallback (Cloud + LocalStorage)**:
   - When authenticated with an `@orangeusd.org` account, writes merge directly into Firestore:
     `student_results/Position_Time_Graph_Studio/students/{studentId}`.
   - If offline or unauthenticated, writes to `localStorage` (`pvt_studio_{studentId}` and `pvt_studio_guest_state`).
   - Upon subsequent Google login, guest progress is automatically migrated to Firestore.
3. **Seamless Session Restoration (`restoreSavedState`)**:
   - On page load or after sign-in, the latest Firestore document is fetched.
   - Reconstructs `studentSeed`, `levelScores`, and `completedSteps`.
   - Automatically navigates the student directly to their highest incomplete level and step so they can instantly resume work without re-doing completed questions.
4. **Visual Cloud Sync Pill (`#firestore-save-indicator`)**:
   - Displays real-time sync state in the top header row:
     - `Backing up...` (pulsing amber dot) during write operations.
     - `Cloud Synced ✓` (crisp volt dot) when confirmed by Firestore.
     - `Offline Backup` (rose dot) if running offline.

---

## 9. Grading & Compliance Checklist
- [x] Unique `ASSIGNMENT_ID`: `"Position_Time_Graph_Studio"`
- [x] Parent doc initialized in Firestore `student_results/{ASSIGNMENT_ID}`
- [x] Highest attempt score retention (`score = Math.max(existing, new)`)
- [x] Live Per-Action Background Backup to Firestore (`awardPoints`)
- [x] Automatic Session Resume at Saved Level/Step (`restoreSavedState`)
- [x] Google Auth with `@orangeusd.org` domain check and teacher bypass
- [x] Guest mode local storage auto-save fallback & login migration
- [x] High-contrast WCAG AAA light theme support
- [x] Strict No-LaTeX Compliance: all formulas use Unicode (`Δx`, `Δt`, `v = Δx / Δt`, `m/s`)
- [x] Anti-Copying Parameterized Seeding (4,096 unique combinations)
- [x] Declared NGSS Standard badge: `HS-PS2-1`
- [x] Chromebook 1280x720 Zero-Scroll Viewport Certified


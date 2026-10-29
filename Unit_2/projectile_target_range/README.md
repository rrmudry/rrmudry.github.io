# 🎯 Horizontal Projectile Target Range Lab & Real-Time Scoring Arena

A guided, single-Chromebook student inquiry slideshow and live teacher control dashboard for building cardstock projectile ramps, collecting empirical calibration data, and competing in a high-stakes 3-round target showdown.

Developed for **Honors & General High School Physics** (NGSS HS-PS2-1, HS-PS2-2).

---

## 📋 Table of Contents

- [Overview & Pedagogical Approach](#overview--pedagogical-approach)
- [Architecture & File Structure](#architecture--file-structure)
- [Student Guided Slideshow (`index.html`)](#student-guided-slideshow-indexhtml)
- [Teacher Control & Scoring Dashboard (`dashboard.html`)](#teacher-control--scoring-dashboard-dashboardhtml)
- [Classroom Progress & Pacing Runway Monitor (`monitor.html`)](#classroom-progress--pacing-runway-monitor-monitorhtml)
- [Group De-duplication & Conflict Resolution Engine](#group-de-duplication--conflict-resolution-engine)
- [Firestore Data Model & Security Architecture](#firestore-data-model--security-architecture)
- [Strict Design, Accessibility & Infrastructure Rules](#strict-design-accessibility--infrastructure-rules)
- [Local Development & Verification](#local-development--verification)

---

## 🔬 Overview & Pedagogical Approach

Traditional projectile motion labs often jump immediately into multi-variable kinematic equations:

y = ½gt²,  Δx = v₀ √(2y / g)

This creates heavy cognitive load, formula hunting, and abstract unit confusion for high school students before they understand the physical behavior. 

The **Horizontal Projectile Target Range Lab** flips this sequence:
1. **Physical Engineering**: Students cut and fold 6 cardstock strips to build a smooth, consistent marble track attached to a chair, exiting horizontally flush with their table edge.
2. **Empirical Calibration (Step 8)**: Students release a marble from known ramp marks (h = 10, 20, 30, 40, 50, 60 cm) and measure actual landing distances ($\Delta x$) along a floor meter stick.
3. **Square-Root Modeling (Step 9)**: Students observe that floor distance does not scale linearly, but rather follows a square-root curve ($Δx = k √h$, where $k = \sqrt{2 y_{\text{table}} / g}$).
4. **Target Competition (Rounds 1–4)**: The teacher places an open target cup at a secret or randomized distance on the floor. Students use their calibrated curve tracer to calculate their release height, lock in their prediction, and launch under authentic competition stakes.

---

## 📂 Architecture & File Structure

```text
Unit_2/projectile_target_range/
├── index.html           # Student-facing 9-step guided build slideshow & calibration studio
├── dashboard.html       # Teacher-only projector control room, checkpoint gates & live scoring
├── monitor.html         # Redirect shortcut to full-screen pacing & progress monitor
├── README.md            # Comprehensive architecture, pedagogical & operational guide
...
admin/
└── horizontal_projectile_ramp_monitor.html  # Full-screen pacing runway, customizable timer & approval gates
├── css/
│   └── style.css        # WCAG AAA high-contrast light/dark themes, projector scaling, modal grids
├── img/
│   └── curve-cut-guide.png  # Diagram illustrating scissor snips for gentle ramp bottom curve
└── js/
    ├── student-app.js   # Single-computer team formation, gate listening, canvas curve tracer
    ├── teacher-board.js # Live approval queue, group deduplication, target broadcasts, grade fan-out
    └── audio-synth.js   # Zero-asset Web Audio API sound generator (clinks, fanfares, buzzers)
```

---

## 🧑‍🎓 Student Guided Slideshow (`index.html`)

Students navigate a linear 10-slide progression (Step 0 Team Setup + Steps 1–9) with sticky step-rail navigation:

### Slide 0: Team Setup & Multi-Device Protection
* **School Google Authentication**: Requires `@orangeusd.org` sign-in. Automatically queries the student's Firestore `roster` document to resolve their official name and class period (`Period 0` through `Period 6`).
* **Autocomplete Teammate Addition**: Teammates are added by First & Last Name using `<datalist id="classmateSuggestions">`. Autocomplete options are populated from the period's verified roster.
* **Device Claim Detection (`#alreadyClaimedBanner`)**: If a teammate opens the lab link on their own Chromebook after another partner has already added them, the app detects their active registration, displays `👥 You are registered in [Partner]'s Group!`, and directs them to work together on the lead Chromebook.
* **Multi-Group Claim Prevention**: Students cannot add a classmate who has already been claimed by another team in the period.

### Steps 1–7: Step-by-Step Ramp Construction
* **Step 1 (Materials)**: Interactive checklist requiring all 5 items (6 cardstock strips, scissors, tape, 2 meter sticks, marble) before unlocking Step 2.
* **Step 2 (Channel Folding)**: Diagram showing how to fold 11 in × 2.83 in cardstock strips in thirds and nest them like shingles.
* **Step 3 (Curve Cut & Checkpoint 1 🛑)**: Embedded cut guide showing 4–5 small sidewall snips to create a gentle exit curve. **Hard Gate**: Students must click `✋ Request Mr. Mudry's Approval`. The table flashes on the teacher dashboard, and the student interface remains locked until approved.
* **Step 4 (Chair Mount)**: Attaching the top of the ramp to the chair back.
* **Step 5 (Table Alignment)**: Ensuring the ramp bottom exits perfectly horizontal and flush with the table lip.
* **Step 6 (Floor Meter Stick & Checkpoint 2 🛑)**: Taping the floor meter stick with `0 cm` positioned directly plumb under the table edge. **Hard Gate**: Requires teacher inspection and approval before launching marbles.
* **Step 7 (Interval Markings)**: Marking release points at 10, 20, 30, 40, 50, 60 cm.

### Step 8: Empirical Calibration Table
* Students drop marbles from marked heights and record floor landing distances ($\Delta x$).
* Debounced auto-save with echo-suppression prevents typing focus teardowns while syncing to Firestore.
* Requires $\ge 4$ valid data pairs before Step 9 unlocks.

### Step 9: Fitted Curve Tracer & Target Showdown
* **Interactive Canvas**: Renders student data points, grid lines, and fits $Δx = k √h$. Move cursor or touch along the x-axis to trace corresponding floor distances in real-time.
* **3 Target Rounds + Tie-Breaker**:
  * Round 1 (10 pts)
  * Round 2 (10 pts)
  * Round 3 (10 pts)
  * Round 4 (10 pts Tie-Breaker)
* Students enter their calculated release mark for the teacher's target distance, click `Lock In Prediction`, and prepare for the teacher-scored drop.

---

## 👨‍🏫 Teacher Control & Scoring Dashboard (`dashboard.html`)

Locked behind a strict teacher authentication gate (`rmudry@orangeusd.org`), the dashboard is optimized for projector display across the classroom:

```text
+----------------------------------------------------------------------------------------------------+
| 👨‍🏫 Ramp Lab Control  [P0 Honors] [Period 1] [Period 2] [Period 3] [Period 4] [Period 5] [Period 6] |
+----------------------------------------------------------------------------------------------------+
| 🛑 Live Build Checkpoint Queue (Steps 3 & 6)                   [✅ Approve All 3] [✅ Approve All 6]|
|   [ Table 1: Jaylene, Erica, Ajani (Step 3) -> Approve ]                                           |
+----------------------------------------------------------------------------------------------------+
| 🎯 Active Round: [Round 1] [Round 2] [Round 3] [🏆 TB]   Target: [ 110.0 cm ] [Broadcast Target]   |
|                                                          [🎲 Randomize Unique Targets for Groups]   |
+----------------------------------------------------------------------------------------------------+
| 📋 Student Groups: Roster, Step Approvals & Round 1–3 Scores                [🗑️ Clear Period Teams] |
| 👥 Group / Participants           | Step Progress | R1 (10) | R2 (10) | R3 (10) | Total | Drop Score|
| Table 1: Amie, Kaylee, Anh, Nicole| Step 9 (⚡5)  | 10 / 10 |  8 / 10 |  --     | 18/30 | [Score R3]|
+----------------------------------------------------------------------------------------------------+
| 🎯 Floor Landing Radar Visualizer (Bullseye <=1.5cm | Gold <=6cm | Silver <=12cm | Miss)            |
+----------------------------------------------------------------------------------------------------+
```

### Dashboard Capabilities
1. **Live Checkpoint Queue**: Groups requesting approval at Step 3 (curved bottom) or Step 6 (meter stick floor alignment) flash instantly in a top alert strip. Teachers can approve individual tables or click `Approve All`.
2. **Universal & Randomized Target Broadcasting**:
   * **Universal Target**: Set a single class distance (e.g. `115.0 cm`) and click `Broadcast Target`. Instantly updates Step 9 on all student Chromebooks in that period.
   * **Randomized Targets**: Click `🎲 Randomize Unique Targets for Groups` to distribute varied, un-droppable distances from calibrated pools (e.g., 95 cm to 168 cm), preventing copying between tables.
3. **Rapid 0–10 Point Scoring Modal**:
   * Open the score modal by clicking `Score Drop` or any individual round cell.
   * Click quick-accuracy buttons:
     * `10 pts`: Bullseye / Direct Cup Hit ($≤ 1.5 cm$)
     * `9 pts`: Lip / Rim-In ($≤ 3.5 cm$)
     * `8 pts`: Rim Graze ($≤ 6.0 cm$)
     * `7 pts`: Close Ring ($≤ 9.0 cm$)
     * `6 pts`: Mid Ring ($≤ 12.0 cm$)
     * `5 pts`: Within 16 cm
     * `4 pts`: Outer Ring ($≤ 20.0 cm$)
     * `3 pts`: Within 25 cm
     * `2 pts`: Near Miss ($≤ 30.0 cm$)
     * `1 pt`: Long Miss ($≤ 35.0 cm$)
     * `0 pts`: Complete Miss ($> 35 cm$)
   * Or enter exact floor landing distance in centimeters—the app auto-computes deviation and score.
4. **Automatic Roster Grade Fan-Out**:
   * Scoring a group or approving a checkpoint automatically writes the score, total score (/30), percentage, and approval status to **every group member's individual document in Firestore**.
5. **Interactive Floor Radar Visualizer**:
   * Displays landing pins positioned along the virtual floor meter stick relative to the target cup for whole-class visual excitement.

---

---

## ⏱️ Classroom Progress & Pacing Runway Monitor (`monitor.html`)

Designed specifically for whole-classroom overhead projection during the 50–90 minute lab period, the **Ramp Lab Progress & Pacing Monitor** (`admin/horizontal_projectile_ramp_monitor.html`, accessible via shortcut `Unit_2/projectile_target_range/monitor.html`) merges time management and station telemetry into a single high-visibility display:

```text
+----------------------------------------------------------------------------------------------------+
| ⏱️ RAMP LAB PACING MONITOR   [P0 Honors] [Period 1] [Period 2] [Period 3] [Period 4] [Period 5] [P6] |
+----------------------------------------------------------------------------------------------------+
|                                      +-----------------------+                                     |
|                                      |       24 : 18         |                                     |
|                                      |   REMAINING IN LAB    |                                     |
|                                      +-----------------------+                                     |
|           [Presets: 10m | 15m | 25m | 35m | 45m]   [+1m] [+5m] [-1m]   [Custom Min:Sec]            |
+----------------------------------------------------------------------------------------------------+
| 🛑 Live Checkpoint Approval Strip (Steps 3 & 6)                   [✅ Approve All 3] [✅ Approve All 6]|
|   [ Table 2: Erica, Ajani, Jaylene -> Approve Step 3 ]                                             |
+----------------------------------------------------------------------------------------------------+
| 🏃 Station Progress Runway (Milestones 0 through 9)                     [Toggle Runway / Grid Cards]|
| Step 0: Team Setup       | Step 3: Curve Checkpoint 🛑 | Step 6: Meter Stick 🛑 | Step 9: Showdown  |
| 🟢 Table 1 (Amie...)     | 🟡 Table 2 (Erica...)       | 🔵 Table 5 (Carlos...)  | 🟣 Table 4 (...) |
+----------------------------------------------------------------------------------------------------+
```

### Monitor Capabilities
1. **Giant High-Contrast Countdown Timer**:
   - Real-time countdown visible from anywhere in the classroom.
   - Dynamic urgency styling:
     - Normal (> 2 minutes): Cyan digital glow.
     - Warning (1–2 minutes): Amber pulsing alert.
     - Urgent (< 30 seconds): Urgent rose-red pulse.
     - Complete (00:00): Full-screen alert banner with optional zero-asset Web Audio buzzer chimes.
   - Flexible Controls: 1-click presets (10m, 15m, 25m, 35m, 45m), quick adjustments (+1m, +5m, -1m), or custom minute/second inputs.
2. **9-Stage Station Progress Runway View**:
   - Visual marble tracks representing each lab table advancing across the 9 discrete build and calibration milestones.
   - Distinct gate icons highlighting the two mandatory teacher checkpoints (Step 3 curved exit lip and Step 6 floor zero-alignment).
3. **Table Team Cards Grid View**:
   - Alternative card-based layout displaying team members, `⚡ N Devs` consolidation badges, Step 3 & 6 approval indicators, calibration trial counts, and round scores.
4. **Live Checkpoint Approval Queue**:
   - Integrated top strip for 1-click approvals of Step 3 and Step 6 without navigating away from the projector timer.
5. **Classroom Projection Theming**:
   - High-contrast Light Mode (WCAG AAA compliant with deep slate text on pure white) and Dark Mode.
   - Root font scaler (`🖥️ Normal / Large / Projector`) scaling all visual elements with `rem` units.

## ⚡ Group De-duplication & Conflict Resolution Engine

In active classrooms, high school students frequently open tabs on multiple laptops, creating competing documents for the same table. The system includes an automated de-duplication and resolution engine:

### 1. Normalized Roster Signatures
Each document extracts its verified student IDs, sorts them, and creates a deterministic signature:
```javascript
const memberIds = [...new Set(members.map(m => m.studentId))].sort();
const rosterSig = memberIds.join('::'); // e.g. "389976::392884::392979"
```
If 3 teammates at the same table (e.g. Erica, Jaylene, and Ajani) log in on separate Chromebooks, all 3 generate the exact same signature. The dashboard automatically collapses them into a single row displaying the highest step progress and data rows, tagged with `⚡ 3 Devices Synced`. Any score or approval fans out to all linked documents.

### 2. Smart Subset Absorption
When students begin working individually or in pairs before forming a full table (e.g. Matthew alone at Step 8, and Matthew + Josue at Step 8), larger groups automatically absorb smaller duplicate subsets. The smaller subset is collapsed without clobbering progress, reducing UI clutter.

### 3. Multi-Group Conflict Alerting (`#conflictAlertBanner`)
If a student claims membership in two distinct, non-subset teams (e.g., student added to Group A and Group B):
* The student's pill on the leaderboard turns red with an animated pulse: `⚠️ [Name] (In 2 Groups)`.
* A banner appears above the leaderboard: `⚠️ Multi-Group Conflicts Detected!`.
* Clicking `🔍 Resolve Conflicts` opens `#conflictModal`, showing which groups claim the student with 1-click buttons to `Remove Student` or `Disband Group`.

### 4. Per-Group Disband / Deletion
Teachers can delete a specific group document directly using the `🗑️` button on any row or inside `#groupModal`, avoiding the need to reset the entire class period with `Clear Period Teams`.

---

## 🗄️ Firestore Data Model & Security Architecture

### Parent Document: `student_results/unit2_projectile_target_range`
Accessible via `get` by students; writable only by teacher (`isAdmin()`):
```json
{
  "activePeriod": 0,
  "currentRound": 1,
  "universalTargetCm": 110.0,
  "roundTargets": { "1": 110.0, "2": 130.0, "3": 150.0, "4": 165.0 },
  "tableTargets_p0": { "table_1": 105.0, "table_2": 118.0 },
  "approvals_p0": { "table_1": { "step3Approved": true, "step6Approved": true } },
  "claimedStudents_p0": {
    "389976": {
      "primaryStudentId": "392979",
      "leadName": "Erica Mendoza",
      "groupNames": "Erica Mendoza, Ajani Rolon, Jaylene Ibanez",
      "currentStep": 3,
      "tableNum": 2
    }
  },
  "rosterDirectory": { "0": [ { "id": "389976", "name": "Jaylene Ibanez" } ] }
}
```

### Student Subcollection: `student_results/unit2_projectile_target_range/students/{studentId}`
Each signed-in student reads, creates, and updates only their own document (`studentId = request.auth.token.email.split('@')[0]`):
```json
{
  "studentId": "392979",
  "primaryStudentId": "392979",
  "period": 0,
  "class_period": "0",
  "tableNumber": 2,
  "teamMembers": "Erica Mendoza, Ajani Rolon, Jaylene Ibanez",
  "groupMembers": [
    { "studentId": "392979", "name": "Erica Mendoza", "isPrimary": true },
    { "studentId": "392884", "name": "Ajani Rolon", "isPrimary": false },
    { "studentId": "389976", "name": "Jaylene Ibanez", "isPrimary": false }
  ],
  "currentStep": 3,
  "maxUnlockedStep": 3,
  "step3Requested": false,
  "step3Approved": true,
  "step6Requested": false,
  "step6Approved": false,
  "dataRows": [ { "h": 10, "dx": "34.5" }, { "h": 20, "dx": "48.2" } ],
  "calibrationData": [ { "s": 10, "dx": 34.5 }, { "s": 20, "dx": 48.2 } ],
  "currentRound": 1,
  "rounds": {
    "1": { "targetDistCm": 110, "predictedReleaseHeightCm": 42.5, "score": 10, "shotResult": "swish", "status": "scored" },
    "2": { "targetDistCm": 130, "predictedReleaseHeightCm": 56.0, "score": null, "status": "pending" }
  },
  "totalScore": 10,
  "score": 10,
  "maxPoints": 30,
  "percentage": 33,
  "status": "scored",
  "updatedAt": "SERVER_TIMESTAMP"
}
```

---

## 📐 Strict Design, Accessibility & Infrastructure Rules

1. **Strictly Zero LaTeX Math**:
   - The site does not load MathJax or KaTeX. LaTeX syntax (e.g. `$v = x/t$`, `\Delta`) is strictly prohibited in HTML labels, lesson plans, and descriptions.
   - All formulas use Unicode and standard HTML tags: `Δx / Δt`, `v = k √h`, `m/s²`, `x₀`.
2. **WCAG AAA Light Mode & Projector Theming**:
   - Default Light Mode uses deep slate/black text (`#0f172a`) on white/light-slate cards (`contrast ratio >= 14:1`).
   - Saturated accents (`--accent-cyan: #0284c7`, `--accent-rose: #e11d48`) remain razor-sharp under washed-out overhead classroom projectors.
   - Root font scaling (`<html>` at `16px`, `20px`, or `25px`) scales all components via `rem` units using the `🖥️ Text: Normal/Large/Projector` toggle.
3. **District Web Filter Firewall Compliance**:
   - Zero `unpkg.com` and zero in-browser Babel transpilation. Loads only official gstatic CDNs and local assets.
4. **Zero-Loss Student Firestore Access**:
   - Students only write to their own owner document `students/{studentId}`. All parent document writes are wrapped in teacher guards so students never encounter `PERMISSION_DENIED`.

---

## 🛠️ Local Development & Verification

### Run Pre-Flight Rules Verification
Authenticate with real student tokens against deployed security rules:
```bash
cd sync-classroom
npm run verify -- --id unit2_projectile_target_range
```

### Static Rules & CDN Audits
Scan the codebase for firewall-vulnerable CDNs or unmapped Firestore collections:
```bash
node scripts/audit-firestore-rules-coverage.js
node scripts/audit-web-filter-cdn.js
```

### Update Footer Timestamp
Before committing changes or publishing to GitHub:
```bash
node scripts/update-timestamp.js
```


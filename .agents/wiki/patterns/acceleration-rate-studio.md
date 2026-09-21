# Acceleration Rate & Sign Studio Pattern

> Pattern for student-facing 1D uniform acceleration mastery webapps, combining dual-vector visualization, 2x2 sign matrix exploration, discrete (m/s)/s rate accumulation, and 4-tier scaffolded challenges.

## 🎯 Pedagogical Progression: Low Floor to High Ceiling

1. **Level 1 (Low Floor - Conceptual)**: Vector Direction vs. Push Direction
   - Distinguish velocity sign (heading: +x Right vs. -x Left) from acceleration sign (thrust/force: +a vs. -a).
   - Shatter the misconception that negative acceleration always means slowing down.
   - Golden Sign Rule:
     - **Matching Signs** (both + or both -): **Speeding Up** (thrust pushes in direction of motion).
     - **Opposite Signs** (+/- or -/+): **Slowing Down** (thrust fights against direction of motion).
     - **Zero Acceleration** (a = 0): **Constant Speed**.

2. **Level 2 (Bridge - Concrete Units)**: The Physical Meaning of Units ((m/s)/s)
   - Deconstruct `m/s²` as shorthand for `(m/s) per second`.
   - Discrete strobe/ticker-tape step tables: `v(t + 1) = v(t) + a`.
   - Resolves arithmetic double negatives when subtracting negative velocities (`Δv = v(3) - v₀`).

3. **Level 3 (Target Proficiency - GUESS Calculations)**: Rate of Change Problem Solving
   - Standard GUESS setup (Given, Unknown, Equation, Substitute, Solve with units).
   - Isolating each variable: `a = Δv / Δt`, `Δv = a · Δt`, and `Δt = Δv / a`.
   - Realistic transit scenarios (subway trains, highway cruising, cargo drones).

4. **Level 4 (High Ceiling - Synthesis)**: Directional Reversals & Emergency Braking
   - Analyze an object slowing down to `v = 0` (instantaneous rest) while `a` remains constant and non-zero.
   - Calculate turnaround time `t = -v₀ / a`.
   - Interactive high-stakes launch: testing retro-thruster acceleration to dock safely at an automated gate before an obstacle.

---

## 🛠️ Architecture & Core Components

```
Unit_2/acceleration_studio/
├── index.html        # Glassmorphic HUD interface, tab navigation, NGSS badge
├── style.css         # Cosmic Dark HUD theme, responsive grids, telemetry cards
└── js/
    ├── simulation.js # 1D coordinate canvas, vector arrows (v & a), strobe trails
    ├── challenges.js # 4-tier challenge engine, validation, and auto-scoring
    ├── auth.js       # @orangeusd.org Google Auth & Firestore high-score retention
    └── app.js        # Web Audio synthesizer, event dispatching, certificate modal
```

### 1. Dual-Vector Rendering
- **Velocity Vector (`v`)**: Green arrow rendered above vehicle, length proportional to speed, pointing along motion direction.
- **Acceleration Vector (`a`)**: Cyan/blue arrow rendered below vehicle, pointing in thrust/force direction.
- Real-time indicator flashes when `v` crosses zero: *"⚡ DIRECTION REVERSAL: v = 0 m/s (Acceleration still active!)"*.

### 2. Discrete Strobe Ticker-Tape
- Drops labeled dots on the 1D road every 1.0 s showing timestamp `t` and instantaneous speed `v`.
- Shows visually that uniform acceleration creates expanding or contracting spacing between strobe dots.

### 3. Student Engagement Law (Explicit Completion & Stakes)
- 4 tiers worth 25 points each (100 pts total).
- Clear pass threshold: $\ge 80\text{ pts}$ unlocks the **Kinematic Acceleration Specialist Badge** and enables score submission to Firestore.
- Printable / PDF-exportable Certificate of Mastery with student name, date, and `HS-PS2-1`.

### 4. Multi-Layer Parallax Background & Stutter Elimination
- **Root Cause of Animation Stutter**: Jumpy camera deadzone thresholds (`if (currentPodCanvasX < 100 || ...) trackCenterMeters += ...`) bounce back and forth every frame, producing high-frequency 60Hz jitter.
- **Solution & Architecture**:
  - Anchor the vehicle pod at a stable screen focus (`w * 0.5`).
  - Calculate world-to-screen coordinate mapping smoothly: `cx = w * 0.5 + (m - this.x) * pixelsPerMeter`.
  - Seamlessly tile 5-layer mountain parallax pack (from `Newton's Second Law`):
    - Sky (`speedModifier: 0.0`)
    - Far Mountains (`speedModifier: 0.08`)
    - Mid Mountains (`speedModifier: 0.18`)
    - Trees (`speedModifier: 0.38`)
    - Foreground Trees (`speedModifier: 0.58`)
  - Sub-pixel floating point modulo math handles continuous bidirectional scrolling (`+x` and `-x`) with zero gaps or pop-in.

### 5. No LaTeX Compliance
- Strictly plain text, Unicode (`Δ`, `m/s²`, `v₀`, `·`), and HTML `<sub>` tags.

### 6. Sequential Sign Matrix Observation Gate (Productive Friction)
- **Pedagogical Law (No Vague Practice)**: Students must not glance cursorily or click randomly between vector presets without observing rate accumulation.
- **Sequential Progression**:
  - Starts with Top-Left (`+v and +a` - Speeding Up Right) unlocked.
  - Quadrant 2 (`+v and -a`), Quadrant 3 (`-v and -a`), and Quadrant 4 (`-v and +a`) remain locked sequentially.
  - Requires **at least 10.0 seconds of active simulation observation** per quadrant before unlocking the next quadrant.
  - Timer pauses when the simulation is paused or when the tab is backgrounded.
  - Visual cues: live countdown badge (`⏳ 10.0s` ... `✓ Studied`), card bottom glowing fill track, and unlock pulse animation.
  - Clicking locked cards triggers gentle shake animation (`cardShake`), audio error cue, and toast explaining remaining required observation time.
  - State persisted to `sessionStorage` so tab navigation does not discard student progress. Once completed, students retain full sandbox freedom to explore all 4 quadrants.

### 7. Chromebook No-Scroll Compact Layout Pattern
- **Problem**: Long single-column vertical question flows force students to scroll down repeatedly to access answer buttons and feedback, causing interface friction and disengagement on standard 1366x768 / 1280x768 Chromebook screens.
- **Solution**:
  - **Two-Column Grid (`grid-template-columns: 1fr 1.35fr`)**:
    - **Left Column (`.tier1-left-col`)**: Houses the 2x2 Telemetry HUD (vehicle name, velocity, acceleration, status) and a compact **Quick Sign Rule** box.
    - **Right Column (`.tier1-right-col`)**: Houses the scaffolded questions with compact button grids (2-column grids for direction; 3-column grid for motion state), inline submit/next buttons, and inline diagnostic feedback.
  - **Vertical Budget Management**:
    - Pad `.mastery-progress-card` tightly (`0.55rem 1.1rem`, `margin-bottom: 0.75rem`).
    - Keep `#tab-tier1 .challenge-card` and `#tab-tier2 .challenge-card` padding at `0.75rem 1.1rem`.
    - Tighten `.ticker-table` vertical cell padding to `0.4rem 0.6rem`.
    - Total card height stays under 420px, ensuring `document.documentElement.scrollHeight <= 768px` with zero vertical scrolling needed even when active feedback is rendered.

### 8. Low Reading Level & Directional Consistency Pattern
- **Directional Precision**:
  - Strictly use **Right (+)** and **Left (-)** across all 1D kinematics tabs and challenges.
  - Avoid compass headings ("East" / "West") in 1D Cartesian problems to eliminate extraneous cognitive translation between maps and coordinate tracks.
- **Accessible Language for Below-Grade-Level Readers**:
  - Replace abstract physics jargon with concrete language:
    - Change "discrete rate accumulation ((m/s)/s)" to "How Speed Changes Each Second".
    - Change function notation like `v(0) + a` to concrete math steps: `Start at +5, then add (+3)` or `Start at +20, then add (-4) [or minus 4]`.
    - Change "instantaneous speed" to "speed right now".
  - **Integer Operation Scaffolding**: Many struggling students understand the physics concept of slowing down but falter when evaluating `20 + (-4)`. Providing dual guidance (`add -4 [or minus 4]`) eliminates non-physics arithmetic traps while reinforcing that negative acceleration is an additive change in velocity.

### 9. Strict Sequential Tier Locking & Anti-Skip Enforcement
- **Strict Gating Flow**: Tiers 2, 3, and 4 are strictly locked until their immediate predecessor is formally mastered:
  - Tier 1 ➔ Tier 2 ➔ Tier 3 ➔ Tier 4.
- **Locked Tab Interaction**:
  - Tabs carry `.locked` class and display `🔒 Locked` pill badges in the tab bar.
  - Clicking any locked tab button intercepts the click event, plays WebAudio error chime (`AudioEngine.playError()`), triggers a horizontal shake CSS keyframe animation (`.tab-shake`), and displays an informational toast (`#appGlobalToast`) specifying the required unlock condition (e.g. *"🔒 Complete Tier 1 (Sign Detective) with 3 correct in a row to unlock Tier 2!"*).
  - Upon mastering a tier, `updateTabLockStates()` dynamically strips `.locked`, reveals the score potential (`25 pts`), applies a pulsing glow (`.ready-pulse`), and displays an unlock celebration toast.

### 10. Adaptive Question Regeneration & 3-in-a-Row Mastery Loop
- **Pedagogical Requirement**: Rather than a static set of questions that allows students to memorize answers through trial and error, questions are procedurally generated from the 4 primary 1D kinematic archetypes:
  1. `+v, +a` (Moving Right, Pushed Right ➔ Speeding Up)
  2. `+v, -a` (Moving Right, Pushed Left ➔ Slowing Down)
  3. `-v, -a` (Moving Left, Pushed Left ➔ Speeding Up Left)
  4. `-v, +a` (Moving Left, Pushed Right ➔ Slowing Down)
- **Mastery Streak Mechanics**:
  - Students must answer **3 questions correctly in a row** to achieve mastery (+25 PTS and unlock Tier 2).
  - Any incorrect answer resets the streak to 0 immediately.
  - At the conclusion of a 4-question round, if the student failed to answer 3 out of 4 correctly or did not achieve 3 in a row, a brand new procedural round is generated with randomized pod names and values.
  - Students continue practicing dynamic rounds until achieving the 3-in-a-row mastery criterion.

### 11. Tier 2 Mini Flight Track & Clean 2-Column Table Pattern (Text De-Cluttering)
- **Problem**: A 3-column table with a verbose "How to Calculate" column (`Start at +20, then add (-4) [or minus 4]`) overwhelmed below-grade-level readers with dense algebraic text clutter. Furthermore, lack of a visual model severed the connection between numbers and physical vehicle motion.
- **Solution & Architecture**:
  - **2-Column Layout (`grid-template-columns: 1.15fr 1fr`)**:
    - **Left Column**: Integrated mini flight simulation track (`#tier2TrackCanvas`, 122px height) running an instance of `MotionSimulator`.
      - Provides `▶ Run Flight (3s)` and `🔄 Reset` controls.
      - Vehicle pod moves across the metric track for 3.0 seconds, dropping purple strobe markers with timestamp tags (`t = 0s, 1s, 2s, 3s`) and velocity tags.
      - Automatically pauses at $t = 3.0\text{ s}$ with audio completion chime.
      - Live telemetry strip below canvas updates `Time (0.0 / 3.0 s)`, `Velocity (v)`, and `Acceleration (a)` in real time.
    - **Right Column**: Ultra-clean 2-column table (`Time` and `Velocity`).
      - Stripped the verbose "How to Calculate" column completely.
      - Embedded elegant step-rate indicators between table rows (`⬇ Change: -4.0 m/s each second`) to visually indicate the additive delta.
      - Compact total change row (`Δv = [  ] m/s`).
  - **Chromebook 1280x768 Vertical Budget**:
    - Micro-tuned padding and canvas height so that initial presentation, active simulation, and success/diagnostic feedback all fit within `document.documentElement.scrollHeight = 768px` with zero vertical scrolling.

### 12. Tier 2 Three-in-a-Row Mastery & Dynamic Problem Generation Pattern
- **Mirroring Tier 1 Mechanics**:
  - Requires students to achieve **3 correct missions in a row** to earn 25 PTS and unlock Tier 3 (GUESS Sprint).
  - Any incorrect numerical input immediately resets the active streak to 0 (`Streak: 0 / 3 🔥`).
- **Dynamic 4-Archetype Procedural Problem Generation (`generateTier2Problems()`)**:
  - Generates 4 randomized problems per round from the 4 primary kinematic archetypes:
    1. `+v, +a` (Speeding up moving right)
    2. `+v, -a` (Slowing down moving right, calibrated so $v_3 > 0$)
    3. `-v, -a` (Speeding up moving left)
    4. `-v, +a` (Slowing down moving left, calibrated so $v_3 < 0$)
  - Integer numbers are strictly chosen to ensure clean mental addition without decimal messy fractions.
- **Round Regeneration & Continuous Practice Loop**:
  - If a student completes all 4 problems in a round without achieving 3 in a row, a brand new procedural round is generated.
  - A round notice (`.tier2-round-notice`) is displayed in the left column informing them of their previous round score and prompting them to get 3 in a row.
  - Positioning the notice in the left column prevents layout expansion in the right column, maintaining strict `scrollHeight <= 768px` compliance on Chromebook viewports.
- **Direct Tier 3 Navigation**:
  - Achieving 3 in a row unlocks Tier 3 in the navbar, triggers `AudioEngine.playUnlockPing()`, and surfaces a direct `🚀 Go to Tier 3 ➔` button in the action bar.

### 13. Tier 3 Acceleration-Exclusive Focus & 3-in-a-Row Mastery Loop Pattern
- **Pedagogical Requirement**: Tier 3 is dedicated exclusively to calculating acceleration ($a$). Removed all peripheral questions asking for $\Delta t$ or $\Delta v$. Mirroring Tiers 1 and 2, students must demonstrate authentic mastery by achieving **3 correct problems in a row**.
- **Dynamic 4-Archetype Acceleration Generation (`generateTier3Problems()`)**:
  - Every 4-problem round procedurally generates 1 problem from each of the 4 kinematic direction archetypes:
    1. `Speeding Up Moving Right (+a)`: $+v_0 \to +v_f$ (e.g. $0 \to +24\text{ m/s}$ in $8\text{ s} \implies a = +3.0\text{ m/s²}$)
    2. `Slowing Down Moving Right (-a)`: $+v_0 \to +v_f$ or $0$ (e.g. $+28 \to 0\text{ m/s}$ in $7\text{ s} \implies a = -4.0\text{ m/s²}$)
    3. `Speeding Up Moving Left (-a)`: $-v_0 \to -v_f$ (e.g. $0 \to -20\text{ m/s}$ in $5\text{ s} \implies a = -4.0\text{ m/s²}$)
    4. `Slowing Down Moving Left (+a)`: $-v_0 \to -v_f$ or $0$ (e.g. $-20 \to 0\text{ m/s}$ in $4\text{ s} \implies a = +5.0\text{ m/s²}$)
  - All problems isolate acceleration: Unknown is strictly `a (Acceleration rate)`, working formula is `a = Δv / Δt`, and unit is `m/s²`.
  - Clean integer values eliminate frustrating decimal calculation errors while reinforcing the sign conventions of acceleration.
- **Mastery Streak Mechanics**:
  - Requires **3 correct in a row** to achieve mastery (+25 PTS and unlock Tier 4).
  - An inline streak banner (`.tier3-streak-banner`) sits directly in the header row beside the challenge badge, displaying `Streak: X / 3 🔥` and 3 responsive dot indicators.
  - Any incorrect answer resets the streak to 0 immediately with clear diagnostic feedback.
  - At the conclusion of a 4-question round without 3 in a row, a new procedural round is generated with randomized transit scenarios, incrementing the round count and notifying the student.
  - Reaching 3 in a row triggers `AudioEngine.playUnlockPing()`, updates the banner to `✓ 3/3 MASTERED`, and injects the direct `🚀 Go to Tier 4 ➔` button.
- **Chromebook 1280x768 Zero-Scroll Compliance**:
  - Compact header alignment and tight G.U.E.S.S. container rows ensure `document.documentElement.scrollHeight = 768px` throughout both question solving and feedback presentation.

### 14. Tier 4 Low-Reading-Level Simplification & Zero-Scroll Layout Pattern
- **Problem**: High school students were intimidated by dense, wordy text ("An autonomous passenger pod is hurtling rightward toward the terminal buffer... To prevent an emergency collision, the onboard navigation computer must fire retro-thrusters to bring the pod to a dead halt...").
- **Solution**:
  - **Direct, Accessible Wording**:
    - Badge: `TIER 4: FINAL CHALLENGE — BRAKING & REVERSAL`
    - Title: `Safety Barrier Braking Challenge`
    - Prompt: *"A test pod moves right at <strong>v₀ = +24.0 m/s</strong>. A safety barrier ahead closes in <strong>Δt = 6.0 seconds</strong>. The pod must brake to a complete stop (<strong>v<sub>f</sub> = 0 m/s</strong>) right when the barrier closes."*
    - Question 1: *"1. Braking Acceleration (a) to stop in 6.0 s:"* (Hint: `a = (vf - v₀) / Δt = (0 - 24.0) / 6.0 = -4.0 m/s²`).
    - Question 2: *"2. Reversal: If brakes push for 8.0 s total, what is the final velocity?"* (Hint: `Pod stops at 6.0 s (v = 0), then speeds up to the left for 2 more seconds.`).
    - Action: `🚀 Test Braking Run` and `Reset Pod`.
  - **Chromebook 1280x768 Viewport Compliance**:
    - Canvas height set to 98px with dynamically proportional parallax rendering (`roadY = h * 0.72`).
### 15. Mandatory @orangeusd.org Login Gate, Guest Mode & Cloud Firestore Backup Pattern
- **Mandatory Activity Entry Gate (`#loginGateModal`)**:
  - Gated on initial startup if the student is unauthenticated and hasn't selected Guest Mode in their session.
  - Features cosmic glassmorphic branding, NGSS HS-PS2-1 badge, `@orangeusd.org` domain badge, and two primary options:
    1. **Primary**: `Sign In with School Google Account` (`@orangeusd.org`)
    2. **Secondary**: `Continue as Guest (Progress will NOT be saved)`
- **Strict Domain Filtering**:
  - GoogleAuthProvider custom parameters enforce `{ hd: 'orangeusd.org', prompt: 'select_account' }`.
  - Non-OUSD email logins (e.g. personal `@gmail.com` other than approved instructor accounts `rmudry@orangeusd.org` and `ryan.mudry@gmail.com`) are immediately rejected, signed out, and alerted with an inline error banner (`#loginGateError`).
- **Frictionless Guest Mode**:
  - Selecting Guest Mode sets `isGuest = true` and persists `sessionStorage.setItem('acceleration_guest_mode', 'true')`.
  - The modal closes immediately, unlocking the full interactive studio.
  - Header auth widget updates to a prominent `👤 Guest Mode (Unsaved)` warning pill and provides a `Sign In` button so guests can link their account at any time.
  - Any progress made while in Guest Mode explicitly skips Firestore write operations (`if (this.isGuest) return;`).
- **Continuous Firestore Progress Backup & Restoration**:
  - Firestore path: `student_results/unit2_day16_acceleration_studio/students/{studentId}` with parent document synchronization for Google Classroom gradebook discoverability.
  - **State Payload (`getState()`)**:
    - `tierScores`: `{ tier1: 0..25, tier2: 0..25, tier3: 0..25, tier4: 0..25 }`
    - `tierCompleted`: `{ tier1: bool, tier2: bool, tier3: bool, tier4: bool }`
    - `tier1Streak`, `tier2Streak`, `tier3Streak`
    - `totalScore`: sum of completed tiers (0 to 100)
    - `timestamp`: server timestamp
  - **Restoration Hook (`restoreState(savedState, score)`)**:
    - Invoked automatically on student login or page load.
    - Hydrates `tierScores`, `tierCompleted`, streak counters, and unlocks previously unlocked tiers.
    - Synchronizes tab badges (`25/25 ✓`), progress bar fill, and unlocks the Certificate button if score $\ge 80\%$.
### 16. Completion Screen Popup, Grade Confirmation & Printer-Friendly Certificate Pattern
- **Automatic Completion Triggering**:
  - Completing Tier 4 with authentic numerical inputs automatically schedules `openCompletionModal()` after a 1.2s delay following the visual pod deceleration/reversal animation.
  - An inline certificate button is rendered directly in the Tier 4 success feedback box, and the global score bar's `🏆 Claim Badge & Cert` button unlocks for any score $\ge 80\%$.
- **Cloud Save Confirmation Box (`#certCloudSyncBox`)**:
  - **Authenticated `@orangeusd.org` Students**: Displays a green/emerald verified container confirming that their 100/100 PTS score was automatically written to Firestore (`CONFIRMED ✓`) with their name and 6-digit student ID. Clarifies that no turn-in, screenshot, or email is needed.
  - **Guest Students**: Displays an amber alert notifying them that their progress was **NOT recorded** in the gradebook (`UNSAVED`) and provides an integrated `Sign In with @orangeusd.org` button to migrate and save their gradebook record.
- **Printer-Friendly Zero-Toner Certificate Architecture (`@media print`)**:
  - **Pure White Canvas (`background: #ffffff !important`)**: Strips all dark backgrounds, glow filters, box shadows, and gradients. Uses 0 background ink or toner.
  - **Engraved Double Border (`3px double #0f172a`)**: Classical diploma framing with inner hairline border (`1px solid #1e293b`).
  - **Authentic Physics Laboratory Branding**: Official Orange High School Science Department seal with vector physics orbital crest, course standard (`NGSS HS-PS2-1`), student verification code (`ACCEL-[ID]-[HASH]`), and formal instructor signature line (`Ryan Mudry, M.Ed.`).
  - **Full Suppression of Non-Print UI**: Headers, navigation bars, modal controls, buttons, close icons, and the cloud save notification box are strictly hidden via `.no-print` (`display: none !important`), ensuring an immaculately formatted 1-page Letter printout (`page-break-inside: avoid`).

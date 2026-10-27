# PRD & Architecture Specification: Horizontal Projectile Motion Workbench & Target Arena

**Target Lessons:** Unit 2 — Days 42–45: *Horizontal Projectiles, 2D Vector Independence & Target Range Kinematics*  
**NGSS Alignment:** `HS-PS2-1`, `SEP-3` (Planning & Carrying Out Investigations), `SEP-4` (Analyzing Data), `SEP-5` (Computational Thinking), `CCC-3` (Scale, Proportion & Quantity)  
**Target Platform:** 1:1 Student Chromebooks (ChromeOS 1366×768+), Desktop, and Overhead Classroom Projectors  
**Target Directory:** `Unit_2/horizontal_projectile_workbench/`  
**Author / Reviewer:** Ryan Mudry (Physics Instructor) // Reviewed by Antigravity AI  

---

## 1. Executive Summary & Pedagogical Architecture

### 1.1 The Core Instructional Problem
In Day 41 direct instruction, students learned the foundational laws of 2D motion:
1. **Vertical and Horizontal motions are completely independent.**
2. **Gravity acts only vertically ($g = 10\text{ m/s}^2$ downward),** dictating flight time according to $\Delta y = 5t^2 \iff t = \sqrt{\Delta y / 5}$.
3. **Horizontal motion has zero acceleration ($a_x = 0$),** coasting at constant velocity according to $\Delta x = v_x \cdot t$.

However, student performance falters during calculation practice due to two major traps:
- **Cockpit Sandboxes with Auto-Calculation:** Tools that automatically compute and display time and range turn students into passive button-clickers who learn nothing.
- **Cognitive Split & Calculator Paralysis:** When handed multi-step word problems without visual scaffolds, students freeze because they do not know whether to start with horizontal or vertical equations, and they fear being wrong.

### 1.2 The Solution: The "Target Arena" Design Pattern
This web application transforms passive calculation practice into an authentic **Data Gathering + 2-Step Calculation + High-Stakes Target Drop** experience:
```
┌────────────────────────────────────────────────────────────────────────┐
│  STEP 1: AUTHENTIC DATA GATHERING (The Physical Apparatus)             │
│  • Read cliff/table height (Δy) from high-contrast vertical ruler       │
│  • Read initial launch speed (vx) from digital photogate sensor       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Record Δy and vx into Workbench
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  STEP 2: 2-STEP SCAFFOLDED CALCULATION ENGINE (Zero Auto-Fill)         │
│  • Vertical Step: t = √(Δy / 5)     --> Student computes & enters t    │
│  • Horizontal Step: Δx = vx · t      --> Student computes & enters Δx   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Student drags Target Bucket to Δx
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  STEP 3: THE LAUNCH & DIAGNOSTIC VERIFICATION (The "Juice")           │
│  • Fire projectile! 60 FPS Canvas trajectory with 0.5s strobe ghosts   │
│  • Direct Hit: Clang sound FX, confetti burst, 2/2 points awarded      │
│  • Near Miss / Miss: Targeted diagnostic feedback (no generic "wrong") │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Hard Workspace & Engineering Constraints

Any implementation **MUST** strictly adhere to the following mandatory school-district engineering rules:

| Constraint | Requirement | Rationale / Failure Mode |
|---|---|---|
| **Zero `unpkg.com`** | NEVER include `<script>` or `<link>` referencing `unpkg.com`. | District firewalls (Securly, Blocksi, GoGuardian) block `unpkg.com`, resulting in a blank white screen on student Chromebooks. |
| **Zero In-Browser Babel** | Native Vanilla JavaScript (ES6+) ONLY. Never use `@babel/standalone` or `type="text/babel"`. | In-browser transpilation crashes on managed Chromebooks and creates massive CPU lag. |
| **No LaTeX Math Syntax** | Use plain Unicode symbols: `Δx`, `Δy`, `v₀`, `m/s²`, `½`, `t = √(Δy / 5)`. Never use `$...$`, `\frac{}{}`, or `\vec{}`. | The site does not use MathJax/KaTeX; combining diacritics render as broken glyph boxes. |
| **Standard Gravity ($g = 10$)** | ALWAYS use Earth gravity $g = 10\text{ m/s}^2$ downward (never $9.8$ or $9.81$). $\Delta y = 5t^2$. | District curriculum and California CAST tasks emphasize clean mental math and conceptual clarity over extraneous decimal arithmetic. |
| **High-Contrast Light Mode (WCAG AAA)** | Light Mode MUST feature extreme contrast: ink-slate (`#0f172a`) text on pure white (`#ffffff`) with saturated accents (`#0284c7`, `#d97706`). Include a `#btn-theme-toggle` (Light/Dark). | Washed-out light grays become unreadable on overhead classroom projectors. |
| **Zero-Scroll Sticky Navigation** | Simulation canvas and calculation cards must remain pinned or fit within standard Chromebook resolution (`1366×768`) without losing navigation buttons. | Students get lost when controls scroll out of the viewport. |
| **Web Audio API Synthesis** | Synthesize all sound effects (mechanical click, pneumatic launch, metal bucket clang, failure thud, victory chime) using the native browser `AudioContext`. | Zero external `.mp3` or `.wav` asset dependencies that can fail to load. |

---

## 3. Directory & File Architecture

```
Unit_2/horizontal_projectile_workbench/
├── index.html              # Single-page semantic UI: Header, Canvas Stage, Scaffolded Workbench, Modals
├── css/
│   └── style.css           # Vanilla CSS: Glassmorphism tokens, WCAG AAA light/dark themes, responsive layout
└── js/
    ├── audio.js            # Zero-dependency Web Audio synthesizer (click, launch, hit, miss, fanfare)
    ├── canvas-sim.js       # HTML5 Canvas 60 FPS physics renderer, trajectory tracer, strobe ghosts, bucket
    ├── measurement-tool.js # Metric floor ruler with draggable target bucket, 2.5x optical loupe crosshair
    ├── calculation-engine.js # 2-step verification logic, tolerance checking (±3%), diagnostic hint generator
    ├── missions.js         # 5-trial progression database (Conceptual, Regular, and Honors tiers)
    ├── auth.js             # Firebase auth gateway, school email domain filter, Firestore student sync
    └── app.js              # State manager, theme toggle, projector mode toggle, mission orchestration
```

---

## 4. Component Specifications

### 4.1 The Apparatus Stage (HTML5 Canvas: `js/canvas-sim.js`)
* **Visual Elements:**
  * **The Cliff / Launch Table:** A sturdy textured cliff on the left side of the screen at height $\Delta y$.
  * **Vertical Height Scale:** Metric ruler mounted to the face of the cliff with high-contrast graduation marks ($1.0\text{ m}$ major ticks, $0.1\text{ m}$ minor ticks).
  * **Pneumatic Spring Launcher:** Mounted horizontally atop the cliff ($0^\circ$ elevation angle).
  * **Digital Photogate Readout:** An LED display box on the launcher showing exit speed: e.g., `[ 8.0 m/s ]`.
  * **The Target Floor:** Gridded metric runway extending from the base of the cliff $(x = 0)$ to the right.
  * **Draggable Target Bucket:** A bright orange landing receptacle with a central catch sensor and measurement pointer.
  * **Strobe Ghost Trails:** When launched, the projectile drops faint semi-transparent position markers every $0.5\text{ s}$ along its parabolic arc, visually demonstrating constant horizontal spacing ($\Delta x = v_x \cdot 0.5$) alongside increasing vertical spacing ($\Delta y = 5t^2$).
* **Canvas Dimensions:** Dynamic full-width responsive canvas (minimum $800\text{ px} \times 380\text{ px}$, auto-scaling to device pixel ratio for razor-sharp projection).

### 4.2 The Authentic Measurement System (`js/measurement-tool.js`)
* To satisfy **CAST SEP-3 (Planning & Carrying Out Investigations)**, students cannot simply click "Auto-Measure":
  * **Wall Height Loupe:** Hovering or clicking on the cliff top activates an optical magnifying loupe ($2.5\times$ zoom) with a red reticle hairline, allowing students to read decimal table heights accurately (e.g., $1.25\text{ m}$ or $20.0\text{ m}$).
  * **Floor Runway Ruler & Bucket Placement:** Students drag the target bucket along the floor ruler. A precision readout displays the current bucket placement: `Target Position: 16.0 m`.
  * **Tolerance Window:** The bucket mouth has a physical radius corresponding to $\pm 3\%$ of the calculated range. Landing inside triggers a bullseye; clipping the rim triggers a near-miss.

### 4.3 The Scaffolded Calculation Engine (`js/calculation-engine.js`)
The workbench interface is split into a **T-Chart Scaffold** representing the two independent worlds of projectile motion:

```
┌──────────────────────────────────────┬──────────────────────────────────────┐
│       VERTICAL WORLD (Y-AXIS)        │      HORIZONTAL WORLD (X-AXIS)       │
│           (Free Fall: a = 10)        │       (Constant Speed: a = 0)        │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ Given: Δy = [ ___ ] m                │ Given: vx = [ ___ ] m/s              │
│ Formula: t = √(Δy / 5)               │ Formula: Δx = vx · t                 │
│                                      │                                      │
│ Calculate Hang Time (t):             │ Calculate Landing Range (Δx):        │
│ [  ____  ] seconds                   │ [  ____  ] meters                    │
│                                      │                                      │
│ [ Check Step 1 ]                     │ [ Check Step 2 & Unlock Target ]     │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

#### Progressive Unlocking Sequence:
1. **Input Data:** Student enters the observed $\Delta y$ and $v_x$ recorded from the apparatus.
2. **Solve Step 1 First (Vertical):** The student calculates $t = \sqrt{\Delta y / 5}$ and types it into the field.
   - If correct: Green checkmark, audio chime, and Step 2 activates.
   - If incorrect: Targeted hint appears (e.g., *"Remember to divide $\Delta y$ by $5$ BEFORE taking the square root"* or *"Check your mental math: $20 / 5 = 4$, and $\sqrt{4} = 2.0\text{ s}$"*).
3. **Solve Step 2 Second (Horizontal):** The student multiplies $v_x \times t$ and enters the predicted range $\Delta x$.
   - If correct: The bucket placement control unlocks: *"Target unlocked! Drag the landing bucket on the runway to your calculated distance."*
4. **Fire & Verify:** The `🚀 LAUNCH PROJECTILE` button pulses. The student fires, and the physical simulation executes.

---

## 5. Differentiated Mission Progression (`js/missions.js`)

The app includes 3 distinct mode presets selectable via a top banner pill selector, catering directly to Ryan's class roster:

### Preset A: Conceptual Physics Track (Periods 1, 2, 5, 6)
* **Design Focus:** Data gathering + clean mental math ($g = 10$). Eliminates square-root math anxiety by using perfect-square drop heights.
* **Mission 1:** $\Delta y = 5.0\text{ m}$ ($t = 1.0\text{ s}$), $v_x = 6.0\text{ m/s}$ $\implies \Delta x = 6.0\text{ m}$.
* **Mission 2:** $\Delta y = 20.0\text{ m}$ ($t = 2.0\text{ s}$), $v_x = 7.5\text{ m/s}$ $\implies \Delta x = 15.0\text{ m}$.
* **Mission 3:** $\Delta y = 45.0\text{ m}$ ($t = 3.0\text{ s}$), $v_x = 12.0\text{ m/s}$ $\implies \Delta x = 36.0\text{ m}$.
* **Mission 4 (The Speed Multiplier):** Keep $\Delta y = 20.0\text{ m}$ ($t$ stays $2.0\text{ s}$!), double $v_x$ from $5\text{ m/s}$ to $10\text{ m/s}$. Observe that flight time is unchanged, but range doubles!
* **Mission 5 (The Height Challenge):** $\Delta y = 80.0\text{ m}$ ($t = 4.0\text{ s}$), $v_x = 15.0\text{ m/s}$ $\implies \Delta x = 60.0\text{ m}$.

### Preset B: Regular Physics Track (Periods 4, 6)
* **Design Focus:** Authentic laboratory table drops with decimal calculator math + reverse problem solving.
* **Mission 1–2:** Tabletop heights ($\Delta y = 1.25\text{ m} \implies t = 0.50\text{ s}$; $\Delta y = 3.20\text{ m} \implies t = 0.80\text{ s}$).
* **Mission 3–4:** Forward range predictions with fractional speeds ($v_x = 4.6\text{ m/s}$).
* **Mission 5 (Reverse Problem — "The Target Hunter"):** The target bucket is locked in place at $\Delta x = 18.0\text{ m}$ from a cliff of $\Delta y = 20.0\text{ m}$. Students must calculate the required launch speed:
  $$t = \sqrt{20 / 5} = 2.0\text{ s} \implies v_x = \frac{\Delta x}{t} = \frac{18.0}{2.0} = 9.0\text{ m/s}$$
  The student dials the launcher knob to $9.0\text{ m/s}$ and fires to hit the target.

### Preset C: Honors Physics Track (Period 0)
* **Design Focus:** Multi-variable algebraic derivation + full 2D vector kinematics at impact.
* **Missions 1–3:** Variable cliff elevations, moving targets, and blind drops (canvas hidden behind a "cloud layer" until calculations are locked in).
* **Missions 4–5 (Vector Impact Telemetry):** In addition to predicting landing position $\Delta x$, Honors students must calculate the **final impact velocity vector**:
  1. Downward velocity component at impact: $v_y = g \cdot t = 10 \cdot t$.
  2. Total impact speed magnitude: $v_{\text{impact}} = \sqrt{v_x^2 + v_y^2}$.
  3. Impact angle with the horizontal: $\theta = \arctan(v_y / v_x)$.
  The simulation displays real-time vector component arrows ($v_x$ in blue, $v_y$ in orange, $v_{\text{resultant}}$ in purple) as the ball descends!

---

## 6. Feedback & Diagnostic Engine

Generic "Incorrect. Try Again." prompts destroy student confidence and cause classroom disengagement. The diagnostic engine evaluates student input against known misconception vectors:

| Student Error Pattern | Diagnostic Feedback Message |
|---|---|
| Student entered $t = \Delta y / 10$ instead of $\sqrt{\Delta y / 5}$ | *"Watch out: You used constant speed $(t = d/v)$ for the vertical drop! Gravity accelerates objects. Use $t = \sqrt{\Delta y / 5}$."* |
| Student forgot to take the square root ($t = \Delta y / 5$) | *"Almost there! You calculated $t^2 = [\text{value}]$, but forgot to take the square root $(\sqrt{\phantom{x}})$ to find time $t$."* |
| Student multiplied $v_x \times \Delta y$ instead of $v_x \times t$ | *"Check your variables: Horizontal distance depends on time in the air $(v_x \cdot t)$, not cliff height!"* |
| Bucket placed within $\pm 0.5\text{ m}$ of landing point | *"Rim Shot! Extremely close (missed by $[X]\text{ m}$). Double check your decimal rounding in Step 2."* |
| Perfect Bullseye | *"BULLSEYE! Direct hit in the center of the bucket! 2/2 Points Awarded."* |

---

## 7. Whole-Classroom Projector / Presentation Mode

To support Ryan's winning Period 1 strategy (projecting sections onto the front whiteboard and filling in blanks together):
* **Projector Mode Toggle (`#btn-projector-mode`):**
  * Automatically switches root font size to `22px` (rem-scaled typography).
  * Forces **WCAG AAA Ultra-Contrast Light Mode** (crisp white background, bold black `#000000` borders, `#0f172a` ink text).
  * Expands the Canvas simulation to `100vw` with giant photogate and distance readouts visible from 35 feet away at the back of the classroom.
  * **"Teacher Reveal" Buttons:** Beside each calculation step, a discreet `[ Reveal Answer ]` toggle allows the instructor to model the math live during whole-group instruction.

---

## 8. Firebase Student Sync & Security Rules Compliance

To ensure compliance with workspace rules (no lost student work; valid Firestore schema):
1. **Target Collection:** `student_results/horizontal_projectile_workbench/students/{emailPrefix}`
2. **Document ID:** Must be strictly the student's email prefix:
   ```javascript
   const emailPrefix = user.email.split('@')[0];
   const docRef = doc(db, 'student_results', 'horizontal_projectile_workbench', 'students', emailPrefix);
   ```
3. **Payload Sanitization:** No `undefined` values:
   ```javascript
   const payload = {
     email: user.email,
     displayName: user.displayName || emailPrefix,
     period: studentPeriod || 'T',
     score: currentScore,
     maxScore: 10,
     completedTrials: completedTrialsCount,
     track: currentTrack, // 'conceptual', 'regular', 'honors'
     completedAt: serverTimestamp(),
     updatedAt: serverTimestamp()
   };
   ```
4. **Security Rules Requirement:** Add explicit student-owner write rule in `firestore.rules`:
   ```text
   match /student_results/horizontal_projectile_workbench/students/{studentId} {
     allow read: if isSignedIn();
     allow write: if isStudentOwner(studentId) || isTeacher();
   }
   ```

---

## 9. Deliverables & Acceptance Checklist for Claude Opus

When reviewing Claude Opus's generated implementation, verify against this 10-point scorecard:

- [ ] **1. Zero unpkg.com**: Code uses standard CDNs (cdnjs / jsdelivr) or local assets with null safety guards.
- [ ] **2. Zero In-Browser Babel**: All script tags are plain `<script>` or `<script type="module">`.
- [ ] **3. Strict $g = 10$ & No LaTeX**: All formulas use $g = 10\text{ m/s}^2$ and plain text Unicode symbols (`Δx`, `Δy`, `t = √(Δy / 5)`).
- [ ] **4. Authentic Data Gathering**: Students must read height and speed from the apparatus rather than having inputs auto-populated.
- [ ] **5. Strict 2-Step Scaffold**: Step 1 (Vertical Time) must be answered correctly before Step 2 (Horizontal Range) unlocks.
- [ ] **6. Interactive Target Bucket**: Students physically position the landing bucket along the runway before firing.
- [ ] **7. Audio-Visual "Juice"**: Real-time 60 FPS Canvas parabola with 0.5s strobe markers, synthesized sound effects for launch, clang, and victory.
- [ ] **8. 3-Track Selector**: Easy toggle between Conceptual ($g = 10$ integers), Regular (decimal precision + reverse problems), and Honors (vector components).
- [ ] **9. High-Contrast Light Mode & Projector Mode**: Extreme-contrast light theme with `#btn-theme-toggle` and `#btn-projector-mode`.
- [ ] **10. Firestore Sync**: Clean student write path using `emailPrefix` doc ID and full variable sanitization.

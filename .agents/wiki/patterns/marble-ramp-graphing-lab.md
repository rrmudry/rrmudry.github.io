# Marble Ramp Motion & Graphing Lab Architecture

> **Status**: Active Architecture Pattern  
> **Tags**: `kinematics`, `marble-ramp`, `position-time`, `velocity-time`, `graphing`, `click-to-plot`, `low-floor-high-ceiling`, `cast`  
> **Target Course**: High School Physics (Unit 2 Kinematics — Days 11-12)  
> **Last Updated**: 2026-09-15  

---

## 1. Overview & Pedagogical Objective

The **Marble Ramp Motion & Graphing Lab** transforms traditional paper incline labs into an interactive, digital laboratory and graphing studio. Students investigate the motion of a marble as it rolls down an inclined wooden ruler ramp and travels across a flat table surface:

```
                  RELEASE (Rest, Level with Top Book)
                     ⚪ 
                      \  Ramp: 30.0 cm Wooden Ruler with Center Groove
      [BOOK 3]         \
      [BOOK 2]          \
      [BOOK 1]           \
 ─────────────────────────┴─────────────═════════════════════════► [Finish Tape]
 Flat Table Surface:     x = 0 cm       Constant Speed Zone (v)    x = d cm (60.0 cm)
 (Timer Starts)                                                    (Timer Stops)
```

### Core Physics Assumptions & Scaffolding:
1. **Incline Acceleration & Potential Energy**: Elevating the ramp creates acceleration down the 30.0 cm ruler groove. Steeper heights produce higher exit speeds.
2. **Constant Speed across the Flat Table**: Once the marble leaves the ramp and enters the flat table, friction is minimal and motion across the marked table track ($d = 60.0\text{ cm}$) is modeled as **constant speed** ($v = d / t_{\text{avg}}$).
3. **Replication**: Students record 3 stopwatch trials per height to reduce human timing error.

---

## 2. Low Floor / High Ceiling Interactive Graphing

Rather than viewing auto-generated plots, students construct their own graphs by **clicking to create datapoints**:

### A. Position vs. Time ($x$ vs $t$) Canvas:
- **Low Floor**:
  - The student clicks at $(0.0\text{ s}, 0\text{ cm})$ where the marble enters the table.
  - The student clicks at $(t_{\text{avg}}, d\text{ cm})$ where the marble crosses the finish tape.
  - Generous snap assistance and drag-to-adjust controls eliminate trackpad/mouse frustration.
- **High Ceiling**:
  - A dynamic **Slope Triangle** overlay renders:
    - $\text{Rise} = \Delta x = d\text{ cm}$
    - $\text{Run} = \Delta t = t_{\text{avg}}\text{ s}$
    - $\text{Slope} = \Delta x / \Delta t = v\text{ cm/s}$
  - As students compare Low, Medium, and High ramps on the same canvas, they visually observe that **steeper slope directly indicates higher velocity**.

### B. Velocity vs. Time ($v$ vs $t$) Canvas:
- **Low Floor**:
  - Students click to place $(0.0\text{ s}, v)$ and $(t_{\text{avg}}, v)$.
  - A flat horizontal line connects the points at height $v$.
- **High Ceiling**:
  - An interactive **Shaded Area** rectangle is rendered beneath each horizontal velocity line:
    $$\text{Area} = \text{base} \times \text{height} = t_{\text{avg}} \times v = d\text{ cm}$$
  - Students discover the foundational calculus/kinematic concept:
    1. A flat line on a velocity graph means **constant speed**.
    2. The geometric area under the velocity curve equals **distance traveled**.

---

## 3. Webapp Architecture & Components

```
Unit_2/marble_ramp_lab/
├── index.html          # Clean single-column 6-step wizard, stopwatch banner, Desmos drawer
├── style.css           # Glassmorphism, light/dark themes, canvas styling, WCAG AAA contrast
└── js/
    ├── sound_fx.js     # Web Audio API synthesizer (clicks, timer tones, point plotting, fanfare)
    ├── stopwatch.js    # Precision digital stopwatch (Spacebar shortcut, tenths/hundredths, capture hook)
    ├── graph_studio.js # Interactive canvas graphing engine (x-t and v-t, dragging, slope triangles, area shading)
    ├── auth_manager.js # Google Sign-In with @orangeusd.org domain check & Firestore sync (ASSIGNMENT_ID = "Marble_Ramp_Lab")
    └── lab_engine.js   # 6-step state machine, calculation verification, outlier flags, CER summary generator
```

---

## 4. Key Implementation Rules & Data Quality Accountability
- **No Manual Time Typing (Authentic Timing Enforced)**: Trial input fields are strictly `readonly`. Clicking or attempting to type inside them triggers an educational toast notification ("No, you need to use the stopwatch!"), shakes the stopwatch box, and highlights the Spacebar shortcut. Every data point must be captured authentically via the precision digital stopwatch.
- **Mandatory Physical Measurement of Stack Height**: Stack height is deliberately NOT pre-populated. Students must physically measure the book stack with their metric ruler and input the height before advancing or switching to another ramp level. Heights are validated to ensure `Low < Med < High`.
- **Rigorous Data Quality & Outlier Accountability**:
  - Outlier detection checks whether any replication deviates from the 3-trial median by $> 0.45\text{ s}$ or $> 22\%$.
  - Outliers trigger an animated `outlier-card` pulse, audio buzzer, and a `🔄 Repeat Trial` button.
  - Advancing requires that timing spread $\le 0.55\text{ s}$ and that physical progression is preserved (High Ramp average time must be faster than Low Ramp).
- **No LaTeX**: Formulas are formatted with plain Unicode and HTML (`v = d / t_avg`, `Δx / Δt`, `cm/s`).
- **Dual Autosave (localStorage + Firestore Cloud)**: Every meaningful state change (trial capture, calculation verification, graph point placement, CER text edits, step navigation) triggers `saveProgress()` which: (1) writes immediately to `localStorage` for instant tab-refresh recovery, and (2) debounces a Firestore `autoSaveDraft()` call at 1.5s to save progress to `student_results/Marble_Ramp_Lab/students/{studentId}`. This ensures student work is never lost even if the tab is closed or the browser crashes. Top-level Firestore document fields (levels summary, CER, currentStep) are lifted for instant gradebook preview. Final submission writes `isCompleted: true` and `score: 100`.
- **Mandatory Beginning Login Gate Overlay**: The lab requires signing in with an official school Google account (`@orangeusd.org` or authorized teacher account) immediately upon landing. An initial fullscreen modal (`#loginGateModal`) with backdrop blur blocks all interaction until authentication succeeds. If an unverified personal account is detected, an inline error is displayed and the session is signed out. Guard checks in `goToStep` and `validateCurrentStep` prevent any navigation bypass, ensuring that all data collection and graphing automatically link to the student's cloud portfolio from the start.
- **Domain Restriction**: Firebase Auth strictly checks `@orangeusd.org` or `ryan.mudry@gmail.com` / `rmudry@orangeusd.org`.
- **Highest Score Wins**: Lab mastery submissions save 100% to Firestore only if the score meets or exceeds previous attempts.

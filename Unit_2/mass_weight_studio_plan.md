# PRD & Implementation Plan: Mass, Weight & Zero-G Inertia Studio

**Target Lesson:** Unit 2 — Day 24: *Mass as the Quantitative Measure of Inertia*  
**Standard Alignment:** NGSS `HS-PS2-1` (Newton's First Law of Motion, Qualitative Inertia, Mass vs. Weight)  
**Target Platform:** 1:1 Student Chromebooks, Desktop, and Whole-Classroom Projector Screens  
**Target Directory:** `Unit_2/mass_weight_studio/`  
**Prerequisites:** Vanilla HTML5, CSS3, JavaScript (ES6+), Canvas API, Web Audio API. **No external JS/CSS frameworks, no Tailwind, no npm dependencies.**

---

## 1. Executive Summary & Pedagogical Guardrails

### 1.1 The Core Mission
Students frequently conflate three fundamentally distinct physical concepts:
1. **Mass ($m$, measured in $\text{kg}$):** The intrinsic quantity of matter in an object and the direct quantitative measure of its **inertia** (its stubbornness against any change to its state of motion). Mass is invariant across the entire universe.
2. **Weight ($W$ or $F_g$, measured in $\text{N}$):** The downward gravitational force exerted on an object by an astronomical body ($W = m \cdot g$). Weight depends entirely on local gravitational field strength and plunges to exactly $0\text{ N}$ in deep space or orbital free fall.
3. **Volume ($V$, measured in $\text{cm}^3$, $\text{m}^3$, or $\text{L}$):** The geometric 3D space an object occupies. It has no direct relationship to inertia (e.g., a massive anvil occupies far less space than an empty cardboard box or giant block of foam).

### 1.2 Strict Pedagogical Guardrail: NO Newton's Second Law Math ($F = m \cdot a$)
* **DO NOT** introduce thruster force calculations, force sensor newton readouts, or $a = F_{\text{net}} / m$ mathematical acceleration equations.
* **Why:** Newton's Second Law is officially scheduled for Day 27. Introducing quantitative acceleration math here overwhelms students before they have learned Free-Body Diagrams (Day 25) or Mechanical Equilibrium (Day 26).
* **Required Focus:** Qualitative Newton's First Law intuition:
  * Resistance to *starting* motion from rest.
  * Resistance to *stopping* motion while coasting.
  * Demonstrating that in deep space ($W = 0\text{ N}$), **mass and inertia DO NOT disappear**.

### 1.3 Classroom Constraints & Engagement Law Compliance
* **Zero Lab Prep & Zero Awkwardness:** Students work individually or side-by-side at their own Chromebooks. No blindfolds, no sharing delicate supplies, no physical contact.
* **No Vague "Play Around" Sandboxes:** Every student activity must have a tangible deliverable: a scored 5-question **Mastery Challenge Arena ("Mythbusters: Deep Space Edition")** with a minimum completion threshold (80% / 4 of 5) and an exportable completion certificate.
* **No LaTeX Notation:** All UI labels, HUD telemetry, and explanations must use standard Unicode symbols (`W = m · g`, `Δ`, `kg`, `N`, `m/s`, `cm³`). Never use LaTeX `$...$` delimiters or `\frac{}{}` syntax.

---

## 2. Architecture & File Structure

```
Unit_2/mass_weight_studio/
├── index.html           # Semantic HTML5 layout, header controls, 3 diagnostic stations, challenge modal
├── style.css            # Dark cosmic default theme, WCAG AAA high-contrast light mode, responsive layout
└── js/
    ├── audio.js         # Zero-dependency Web Audio API sound synthesizer (clicks, thuds, hums, fanfare)
    ├── objects.js       # Database of 5 contrasting test archetypes (Foam, Tungsten, Toolkit, Ingot, Mystery)
    ├── sim-volume.js    # Station 1: 3D bounding box dimension & volume displacement scanner
    ├── sim-weight.js    # Station 2: Planetary gravity platform (Earth, Moon, Mars, Jupiter, Deep Space)
    ├── sim-inertia.js   # Station 3: Deep-space zero-g nudge & barrier catch visualizer (Newton's 1st Law)
    ├── challenges.js    # 5-question Tiered Mastery Arena with anti-tamper score certificate
    └── app.js           # Master controller: tab routing, state management, root font scaling, theme toggling
```

---

## 3. Archetype Test Objects (`js/objects.js`)

The studio provides 5 carefully chosen objects specifically engineered to shatter student misconceptions:

| ID | Name | Mass ($m$) | Volume ($V$) | Earth Weight ($W_{\text{Earth}}$) | Pedagogical Purpose |
|---|---|---|---|---|---|
| `foam` | **Mega Space-Foam Block** | $0.8\text{ kg}$ | $80,000\text{ cm}^3$ ($80\text{ L}$) | $7.8\text{ N}$ | **Huge volume, tiny mass.** Proves that "big" does not mean "massive." |
| `tungsten` | **Compact Tungsten Anvil** | $50.0\text{ kg}$ | $2,600\text{ cm}^3$ ($2.6\text{ L}$) | $490.0\text{ N}$ | **Tiny volume, huge mass.** Proves that compact objects can have immense inertia. |
| `toolkit` | **Astronaut EVA Toolkit** | $12.0\text{ kg}$ | $15,000\text{ cm}^3$ ($15\text{ L}$) | $117.6\text{ N}$ | **Balanced baseline.** Everyday realistic space hardware. |
| `gold` | **Heavy Gold Relic Bar** | $19.3\text{ kg}$ | $1,000\text{ cm}^3$ ($1.0\text{ L}$) | $189.1\text{ N}$ | **Dense luxury item.** Classic gold bar intuition. |
| `mystery` | **Sealed Mystery Cargo Crate** | $35.0\text{ kg}$ | $45,000\text{ cm}^3$ ($45\text{ L}$) | $343.0\text{ N}$ | **Challenge Arena Target.** Values hidden until students test them. |

---

## 4. The Three Interactive Diagnostic Stations

The webapp is divided into three accessible tabs/stations plus the Mastery Arena:

### Station 1: The Spatial Volume Chamber (`sim-volume.js`)
* **Visual Presentation:** A high-tech laser scanning chamber with a 3D isometric perspective wireframe bounding box and a metric coordinate grid.
* **Interactive Tool:** A dual-mode scanner:
  1. **Bounding Calipers:** Displays Length $\times$ Width $\times$ Height in centimeters.
  2. **Liquid Immersion Displacement Tank (Submersion Tank):** Shows water level rise in Liters ($\text{L}$), reinforcing geometric displacement.
* **Telemetry HUD:**
  * Dimensions: e.g. `20 cm × 20 cm × 6.5 cm`
  * Total Volume: `2,600 cm³ (2.6 Liters)`
  * Visual Comparison Bar: Relative spatial footprint against a standard classroom backpack.
* **Key Misconception Addressed:** *"Large objects always have the most inertia."* (Contrasting the giant foam block with the small tungsten anvil instantly disproves this).

---

### Station 2: The Planetary Gravity Platform (`sim-weight.js`)
* **Visual Presentation:** An industrial hydraulic platform scale with both a digital LED readout and an analog dial gauge with an oscillating needle.
* **Celestial Location Selector Buttons:**
  1. 🌍 **Earth:** $g = 9.8\text{ N/kg}$
  2. 🌕 **Moon:** $g = 1.6\text{ N/kg}$
  3. 🔴 **Mars:** $g = 3.7\text{ N/kg}$
  4. 🪐 **Jupiter:** $g = 24.8\text{ N/kg}$
  5. 🛰️ **Deep Space / ISS Orbit:** $g = 0.0\text{ N/kg}$ (Weightless!)
* **Interactive Behavior:**
  * When the student selects a planet, the background skybox transitions (blue sky, gray craters, rusty dunes, gas storm, starry black void).
  * The scale platform responds with spring compression, and the needle oscillates with damping to the target Newton value ($W = m \cdot g$).
  * In **Deep Space**, the object lifts slightly off the scale platform and floats; the scale drops to **$0.0\text{ N}$**.
* **Crucial HUD Banner (Permanent Golden Rule):**
  ```
  MASS (Quantity of Matter): [  50.0 kg  ]  <-- LOCKED & UNCHANGED ACROSS THE UNIVERSE!
  WEIGHT (Gravitational Pull): [ 490.0 N ]  <-- FLUCTUATES WITH LOCAL GRAVITY (W = m · g)
  ```
* **Key Misconception Addressed:** *"Objects lose their mass when they float in space."* (The mass readout stays locked at 50 kg while weight drops to 0 N).

---

### Station 3: Zero-G Inertia Chamber — Newton's First Law (`sim-inertia.js`)
* **Setting:** The weightless, zero-gravity cargo bay of a space station ($W = 0.0\text{ N}$ for all objects).
* **Two Qualitative First-Law Interaction Modes:**

#### Mode A: Inertia of Rest ("The Zero-G Nudge Test")
* The selected object is floating stationary at rest in the center of the bay ($v = 0\text{ m/s}$).
* The student clicks **"Apply Standard Hand Push"** (a robotic astronaut glove extends to deliver a calibrated shove).
* **Physics & Visual Feedback:**
  * **Mega Space-Foam ($0.8\text{ kg}$):** Effortlessly flies across the room at high velocity with a soft breezy sound.
  * **Astronaut Toolkit ($12.0\text{ kg}$):** Smoothly drifts away at a moderate, manageable pace.
  * **Tungsten Anvil ($50.0\text{ kg}$):** Barely creeps forward ($0.1\text{ m/s}$); the robotic arm recoils and shakes with a mechanical straining groan!
* **HUD Telemetry Callout:**
  `INERTIA OF REST: High mass stubbornly resists starting motion—even when weight is exactly 0 Newtons!`

#### Mode B: Inertia of Motion ("The Airlock Catch Test")
* The object is already drifting smoothly across the screen at a constant cruising speed ($v = 1.0\text{ m/s}$) heading toward an open airlock.
* Crucial visual indicator: A persistent floating vector HUD over the object:
  `FORWARD FORCE = 0 N (Zero forward push! Moving purely by Newton's First Law!)`
* The student clicks **"Deploy Safety Catch Barrier"**:
  * **Mega Space-Foam ($0.8\text{ kg}$):** Cushions gently to a halt immediately upon contact.
  * **Tungsten Anvil ($50.0\text{ kg}$):** Smashes violently into the barrier, buckling the metal brackets with a loud industrial metallic crash before slowly halting!
* **HUD Telemetry Callout:**
  `INERTIA OF MOTION: An object in motion continues in motion unless acted upon by an external net force. Massive objects stubbornly resist being stopped!`

---

## 5. Tiered Mastery Arena: "Mythbusters: Deep Space Edition" (`challenges.js`)

To comply with the **Student Engagement Law**, the webapp culminates in a 5-question structured scenario challenge with randomized parameters and instant diagnostic feedback:

### Question 1: The Soda Can Crusher
* **Scenario:** An astronaut is floating weightlessly outside the space station ($W = 0\text{ N}$). They place an empty aluminum soda can between two floating $50\text{ kg}$ tungsten anvils and push the anvils together.
* **Question:** *Will the soda can be crushed, or will it remain unharmed because the anvils are "weightless"?*
* **Correct Answer:** The can is completely crushed! Even though weight is 0 N, the anvils retain all $50\text{ kg}$ of inertial mass. Once in motion, their inertia resists stopping, delivering destructive crushing force into the can upon contact.

### Question 2: The Bathroom Scale Dilemma
* **Scenario:** A space tourist packs a standard spring-loaded bathroom scale on their flight to the International Space Station to monitor their body mass.
* **Question:** *What happens when they step onto the scale while floating inside the ISS?*
* **Correct Answer:** The scale reads $0\text{ N}$ (or $0\text{ kg}$). The scale measures normal contact force from gravitational compression, but in orbit both tourist and scale are in free fall together ($W = 0\text{ N}$). An inertia balance or oscillating spring is required to measure mass in orbit.

### Question 3: The Deep-Space Satellite Kick
* **Scenario:** A stranded spacewalker tries to kick a floating $1,200\text{ kg}$ communications satellite to push it away.
* **Question:** *Why does the astronaut break their foot even though the satellite weighs zero Newtons?*
* **Correct Answer:** The satellite's massive inertia ($1,200\text{ kg}$) resists acceleration. Kicking it exerts a huge impact force back on the astronaut's foot, exactly as if kicking an anvil on Earth.

### Question 4: Mystery Crate Forensic Ranking
* **Scenario:** Students are given three sealed mystery containers ($A$, $B$, and $C$).
* **Task:** Using the 3 diagnostic stations, students must correctly rank them by:
  1. Greatest Volume
  2. Greatest Mass (Inertia)
  3. Greatest Weight on Mars
* **Validation:** Students must demonstrate that the highest volume crate is NOT necessarily the highest mass crate.

### Question 5: The Lunar Lander Fuel Paradox
* **Scenario:** A cargo transport ship travels from Earth to the Moon. In deep space, mid-way between worlds, the engines fire to slow the ship down.
* **Question:** *Does it take less rocket engine burn to stop a $10,000\text{ kg}$ spacecraft in deep space than it does on Earth?*
* **Correct Answer:** No! Stopping a moving ship depends entirely on its inertial mass ($10,000\text{ kg}$), which never changes. Weightlessness does not make a spacecraft easier to decelerate.

### Completion Deliverable & Certificate
* **Threshold:** Score at least 4 out of 5 (80%).
* **Reward:** A clean, tamper-resistant digital **"Deep Space Dynamics Specialist"** certificate displaying:
  * Student Name (entered at start).
  * Score (e.g. `5 / 5 (100%)`).
  * Completion Timestamp & Unique Verification Hash (`SHA-256` or base36 parity hash).
  * Direct 1-click **"Copy Submission Summary"** button formatted for pasting into Google Classroom.

---

## 6. UI/UX, Theming & Accessibility Standards

### 6.1 Mandatory High-Contrast Light Mode (WCAG AAA)
Per `.agents/wiki/patterns/classroom-projection-and-high-contrast-theming.md`:
* Provide a persistent `#btnTheme` toggle (`☀️ Light Mode` / `🌙 Dark Mode`) saved to `localStorage`.
* **Dark Theme (Default):** Deep slate-navy background (`#090d16`), translucent glass panels (`rgba(30, 41, 59, 0.7)`), cyan accents (`#38bdf8`), purple highlights (`#c084fc`).
* **Light Theme (High-Contrast Projection):**
  * Canvas and card backgrounds: Pure crisp white (`#ffffff`) or light slate (`#f8fafc`).
  * Body and header text: Ink slate / near-black (`#0f172a`), achieving contrast ratios $\ge 14:1$.
  * Primary accents: Deep ocean blue (`#0284c7`), rich royal purple (`#7e22ce`), and emerald green (`#15803d`). Never use washed-out pale pastels in light mode.

### 6.2 Universal Root Font Scaling (Projector Mode)
* Provide a 3-button font toggle group in the app header:
  * **Normal (16px):** Default Chromebook resolution.
  * **Large (20px):** Front-row classroom readability.
  * **🖥️ Projector (24px):** Back-row visibility under washed-out overhead classroom projectors.
* Implementation: Dynamically updates `document.documentElement.style.fontSize`. All layout cards, buttons, telemetry indicators, and margins must use `rem` units so the entire interface scales proportionally.

### 6.3 Responsive Navigation & Sticky Dock
* The top header and station category navigation bar must be `position: sticky; top: 0; z-index: 100` with `backdrop-filter: blur(12px)`.
* Tabs must use responsive CSS Grid (`repeat(4, minmax(0, 1fr))`) without horizontal scrollbars, ensuring navigation buttons never scroll out of view when switching steps.

### 6.4 Zero-Dependency Audio Engine (`js/audio.js`)
* Built purely with the native browser `AudioContext` (no external MP3/WAV assets to fail or load slowly).
* Synthesized effects:
  * `playClick()`: Short 800Hz sine blip.
  * `playThud()`: Low 65Hz decaying triangle wave with exponential pitch drop (for heavy inertia impacts).
  * `playWhoosh()`: Filtered white noise sweep (for zero-g object glide).
  * `playChime()`: 2-tone melodic major chord (for challenge success).
  * `playBuzzer()`: Low descending square wave (for incorrect challenge submission).
* Sound toggle button (`#btnSound`) with ON/OFF state persistence.

---

## 7. Curriculum & Site Integration Checklist

Once implemented, complete these integration steps to make the studio live across `rrmudry.github.io`:

1. **Update `assets/lessons-data.js` (Day 24 Object):**
   * Change `activity` text to: *"Zero-G Mass, Weight & Inertia Studio: Students isolate mass as the intrinsic measure of inertia using 3 interactive stations—Volume Chamber, Planetary Scale (Earth, Moon, Mars, Deep Space), and Zero-G Nudge/Catch Chamber—concluding with the 5-question Deep Space Mythbusters Arena."*
   * Add active link to `links` and `assignments`:
     ```javascript
     "Zero-G Inertia Studio": "Unit_2/mass_weight_studio/index.html"
     ```
   * Update assignment status from `"planned"` to `"active"`.

2. **Update `Unit_2/outline.md` (Day 24 Section):**
   * Replace the "Mystery Mass Shakers" text with the "Zero-G Mass, Weight & Inertia Studio" details and link.

3. **Update `unit2-dashboard.html` & `resources.html`:**
   * Add a featured webapp card for **Mass, Weight & Zero-G Inertia Studio** under the Dynamics / Newton's Laws section.

4. **Update Timestamp & Wiki Log:**
   * Run `node scripts/update-timestamp.js`.
   * Add a summary entry to `.agents/wiki/logs.md`.

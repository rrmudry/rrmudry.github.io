# PRD & Implementation Blueprint: Newton's Second Law Studio (Dual-Pulley Horizontal Atwood Machine)

**Project Name:** Newton's 2nd Law Interactive Studio (`newtons_second_law_studio`)  
**Target Lesson:** Unit 2 — Day 26 / Day 27: *Mechanical Equilibrium, Unbalanced Forces & Newton's Second Law*  
**NGSS Standards Alignment:** `HS-PS2-1` (Newton's Laws of Motion, $F_{\text{net}} = m \cdot a$, Equilibrium vs. Acceleration), `HS-ETS1-2`  
**Target Platform:** 1:1 Student Chromebooks, Desktop Browsers, and Whole-Classroom Overhead Projectors  
**Target Destination:** `Unit_2/newtons_second_law_studio/` on `rrmudry.github.io`  
**Core Technologies:** Vanilla HTML5, Vanilla CSS3 (Custom Properties), Modern Vanilla JavaScript (ES6+), HTML5 Canvas 2D Context, Web Audio API.  
**Strict Technical Constraint:** Zero external JavaScript/CSS frameworks (no React, no Vue, no Tailwind, no npm dependencies, no CDN bloat). Fully standalone and offline-capable.

---

## 1. Executive Summary & Pedagogical Architecture

### 1.1 The Core Educational Problem
Students struggle profoundly with Newton's Second Law because traditional curricula jump straight from descriptive kinematics ($v = \Delta x / \Delta t$) into algebraic formulas ($F = ma$) without isolating the two independent variables:
1. **Force ($F_{\text{net}}$):** Students frequently believe that "any mass difference creates the same speed," or confuse individual pulling forces with the **net** unbalanced force.
2. **Inertia / Resistance ($M_{\text{total}}$):** Students almost universally forget that when a hanging weight falls, it must accelerate **both itself and the cart**! They erroneously calculate acceleration as $a = (m_{\text{hang}} \cdot g) / m_{\text{cart}}$, ignoring the hanging mass's own inertia.
3. **The Equilibrium Bridge ($F_{\text{net}} = 0$):** Students struggle to see that Newton's First Law ($a = 0$ when $F_{\text{net}} = 0$) is merely the special equilibrium case of Newton's Second Law ($a = F_{\text{net}} / m$ when $F_{\text{net}} = 0$).

### 1.2 The Apparatus: Dual-Pulley Horizontal Modified Atwood Machine
Unlike a single-pulley Atwood machine (which cannot demonstrate horizontal zero-net-force equilibrium) or a standard vertical Atwood machine (which suffers from line-of-sight gravity confusion), the **Dual-Pulley Horizontal Table Machine** provides the cleanest possible mechanical visualization:

```
    [Left Hanger]                                                                [Right Hanger]
         |                                                                             |
     (Pulley L)===================[ CART (m_cart) ]===================(Pulley R)
         |               <--- T_L               T_R --->               |
       [m_L]                                                         [m_R]
         |                                                             |
       F_g,L                                                         F_g,R
```

* **Table Surface:** Horizontal, frictionless track of length $L = 2.0\text{ m}$.
* **Central Cart:** Low-friction rolling cart with a mass capacity bed ($m_{\text{cart}}$).
* **Left Pulley & Hanger ($m_L$):** Suspended off the left edge, exerting leftward string tension $T_L$.
* **Right Pulley & Hanger ($m_R$):** Suspended off the right edge, exerting rightward string tension $T_R$.
* **Interchangeable Token System:** Calibrated color-coded mass tokens ($10\text{ g}$, $20\text{ g}$, $50\text{ g}$, $100\text{ g}$) that students can transfer between the Left Hanger, Cart Bed, and Right Hanger.

---

## 2. The 3-Step Guided Inquiry Arc

The webapp is structured into three progressive guided investigation tabs, followed by a summative challenge arena:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  [ STEP 1: Equilibrium ]   [ STEP 2: Isolate Force ]   [ STEP 3: Isolate Mass ]   [ MASTERY ARENA ] │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Start with Equilibrium (Zero Net Force — Newton's 1st Law Bridge)
* **Physical Setup:** Equal masses placed on both hangers ($m_L = m_R$, e.g., $100\text{ g}$ on left, $100\text{ g}$ on right).
* **Governing Math:**
  $$F_{\text{net}} = (m_R - m_L) \cdot g = (0.100 - 0.100) \cdot 9.8 = 0.00\text{ N}$$
  $$a = \frac{F_{\text{net}}}{M_{\text{total}}} = \frac{0.00\text{ N}}{m_L + m_{\text{cart}} + m_R} = 0.00\text{ m/s}^2$$
* **Student Observations & Interactions:**
  1. **Static Equilibrium ($v = 0$, $a = 0$):** When released from rest, the cart sits perfectly motionless. Opposing tension arrows ($T_L \leftarrow$ and $\rightarrow T_R$) are equal in magnitude and glow green.
  2. **Dynamic Equilibrium ($v = \text{const} \neq 0$, $a = 0$):** Students click a **"Give Gentle Nudge"** button (which applies an instantaneous impulse of $+0.25\text{ m/s}$). The cart cruises smoothly across the track at constant velocity without speeding up or slowing down.
* **Core Takeaway:** Zero net force ($F_{\text{net}} = 0$) does NOT mean stationary; it means **zero acceleration** ($a = 0$). This reinforces Newton’s 1st Law before introducing $F_{\text{net}} \neq 0$.

---

### Step 2: Unbalance the Forces (Isolate Force — $a \propto F_{\text{net}}$ at Constant $M_{\text{total}}$)
* **The Experimental Control Rule:** To isolate force, the **total system mass ($M_{\text{total}}$) must remain strictly locked** (e.g., $M_{\text{total}} = 500.0\text{ g}$ constant).
* **Physical Setup:** Students move small weight tokens from the Left Hanger or Cart onto the Right Hanger so $m_R > m_L$.
  * *Trial A:* $m_L = 100\text{ g}$, $m_{\text{cart}} = 300\text{ g}$, $m_R = 100\text{ g} \implies \Delta m = 0\text{ g}$, $F_{\text{net}} = 0.00\text{ N} \implies a = 0.00\text{ m/s}^2$
  * *Trial B:* $m_L = 80\text{ g}$, $m_{\text{cart}} = 300\text{ g}$, $m_R = 120\text{ g} \implies \Delta m = 40\text{ g}$, $F_{\text{net}} = 0.392\text{ N} \implies a = 0.784\text{ m/s}^2$
  * *Trial C:* $m_L = 60\text{ g}$, $m_{\text{cart}} = 300\text{ g}$, $m_R = 140\text{ g} \implies \Delta m = 80\text{ g}$, $F_{\text{net}} = 0.784\text{ N} \implies a = 1.568\text{ m/s}^2$
  * *Trial D:* $m_L = 40\text{ g}$, $m_{\text{cart}} = 300\text{ g}$, $m_R = 160\text{ g} \implies \Delta m = 120\text{ g}$, $F_{\text{net}} = 1.176\text{ N} \implies a = 2.352\text{ m/s}^2$
* **Student Observations & Graphing:**
  * As the mass imbalance $\Delta m = (m_R - m_L)$ grows, the cart accelerates faster and faster.
  * Real-time $a$ vs. $F_{\text{net}}$ scatter plot plots each trial, rendering a crisp linear trendline through the origin with slope $= 1 / M_{\text{total}}$.
* **Core Takeaway:** Unbalanced net force creates acceleration. **More Net Force = More Acceleration ($a \propto F_{\text{net}}$).**

---

### Step 3: Change the Resistance (Isolate Mass — $a \propto 1/M_{\text{total}}$ at Constant $F_{\text{net}}$)
* **The Experimental Control Rule:** To isolate mass, the **net pulling force ($F_{\text{net}}$) must remain strictly locked** (e.g., fixed $\Delta m = 50.0\text{ g} \implies F_{\text{net}} = 0.490\text{ N}$ constant).
* **Physical Setup:** Students keep the difference between the two hangers fixed at $50\text{ g}$ ($m_R - m_L = 50\text{ g}$), but add heavy mass blocks directly into the cart bed or equal pairs of masses to both sides:
  * *Trial A:* $m_L = 25\text{ g}$, $m_{\text{cart}} = 150\text{ g}$, $m_R = 75\text{ g} \implies M_{\text{total}} = 250\text{ g}$, $F_{\text{net}} = 0.490\text{ N} \implies a = 1.96\text{ m/s}^2$
  * *Trial B:* $m_L = 25\text{ g}$, $m_{\text{cart}} = 450\text{ g}$, $m_R = 75\text{ g} \implies M_{\text{total}} = 550\text{ g}$, $F_{\text{net}} = 0.490\text{ N} \implies a = 0.89\text{ m/s}^2$
  * *Trial C:* $m_L = 25\text{ g}$, $m_{\text{cart}} = 950\text{ g}$, $m_R = 75\text{ g} \implies M_{\text{total}} = 1050\text{ g}$, $F_{\text{net}} = 0.490\text{ N} \implies a = 0.47\text{ m/s}^2$
  * *Trial D:* $m_L = 25\text{ g}$, $m_{\text{cart}} = 1950\text{ g}$, $m_R = 75\text{ g} \implies M_{\text{total}} = 2050\text{ g}$, $F_{\text{net}} = 0.490\text{ N} \implies a = 0.24\text{ m/s}^2$
* **Student Observations & Graphing:**
  * Even though the pulling force difference is identical across all trials ($0.490\text{ N}$), the heavier cart accelerates much more sluggishly!
  * Real-time $a$ vs. $M_{\text{total}}$ plot displays an inverse hyperbolic curve ($a \propto 1/m$).
  * A companion toggle displays $a$ vs. $1/M_{\text{total}}$, transforming the data into a perfect linear slope equal to $F_{\text{net}}$!
* **Core Takeaway:** Inertia (mass) resists changes in motion. **More Total System Mass = Less Acceleration ($a \propto 1/M_{\text{total}}$).**

---

### Step 4: Newton's 2nd Law Synthesis & Tiered Mastery Arena
Students synthesize the two independent relationships:
$$a \propto F_{\text{net}} \quad \text{and} \quad a \propto \frac{1}{M_{\text{total}}} \implies a = \frac{F_{\text{net}}}{M_{\text{total}}} \iff F_{\text{net}} = M_{\text{total}} \cdot a$$

To satisfy the **Student Engagement Law (Explicit Completion Criteria & Deliverables)**, the studio concludes with a 5-tier diagnostic challenge with randomized parameters:
1. **Tier 1 (Equilibrium Lock):** Identify the missing hanger mass to bring a moving or tilted system into static equilibrium ($F_{\text{net}} = 0$).
2. **Tier 2 (Force Doubling Prediction):** Predict the new acceleration when net force is doubled while system mass is preserved.
3. **Tier 3 (Inertia Penalty Calculation):** Calculate the acceleration drop when heavy cargo is loaded onto the cart under constant net force.
4. **Tier 4 (Target Speed Intercept):** Configure $m_L$, $m_{\text{cart}}$, and $m_R$ so the cart crosses Photogate B ($x = 1.50\text{ m}$) at exactly $v = 1.20\text{ m/s} \pm 0.05\text{ m/s}$.
5. **Tier 5 (CAST Forensic Trap):** Explain why the tension in the pulling string ($T_R$) is *less* than the hanging weight ($m_R \cdot g$) while the system accelerates downward.
* **Certificate:** Scoring $\ge 80\%$ (4 of 5) generates an anti-tamper **"Newtonian Dynamics Specialist"** certificate with student name, date, score, and verification hash, plus a 1-click **"Copy Submission Summary"** button for Google Classroom.

---

## 3. Directory Layout & Architecture

The application will reside in `Unit_2/newtons_second_law_studio/`:

```
Unit_2/newtons_second_law_studio/
├── index.html           # Semantic HTML5 shell, header controls, step tabs, challenge modal
├── style.css            # Dark cosmic theme + WCAG AAA high-contrast light mode, responsive layout
└── js/
    ├── audio.js         # Zero-dependency Web Audio API sound synthesizer (clicks, thuds, rolls, chords)
    ├── physics.js       # Core 2nd Law simulation engine: Euler/Verlet integration, string tensions, collisions
    ├── atwood-canvas.js # Canvas 2D renderer: horizontal track, rolling cart, pulleys, strings, FBD vector overlays
    ├── graphing.js      # Real-time multi-graph engine: x(t), v(t), a(F_net), a(1/m) with adaptive palette
    ├── challenges.js    # 5-Tier Mastery Arena with randomized parameters and anti-tamper certificate
    └── app.js           # Master controller: tab routing, state management, root font scaling, theme toggling
```

---

## 4. Technical Specifications & Governing Equations

### 4.1 Physics Engine (`js/physics.js`)
All physics calculations must use standard MKS units (Meters, Kilograms, Seconds, Newtons):

```javascript
// State Model
const state = {
  // Configurable Masses (in kg)
  mL: 0.100,       // Left hanger mass
  mCart: 0.300,    // Cart body mass
  mR: 0.100,       // Right hanger mass
  
  // Track Geometry (in meters)
  trackLength: 2.00,  // Total horizontal track length
  cartWidth: 0.20,    // Cart bounding box width
  cartX: 0.90,        // Cart center position (0 = left pulley, 2.0 = right pulley)
  cartV: 0.00,        // Cart velocity (m/s)
  cartA: 0.00,        // Cart acceleration (m/s^2)
  
  // Environmental Constants
  g: 9.80,            // Gravitational field strength (m/s^2)
  muK: 0.00,          // Kinetic friction coefficient (default 0.00 = frictionless)
  
  // Simulation State
  isRunning: false,
  simTime: 0.00,
  timeStep: 1 / 60
};

// Core Physics Step (Calculated every frame)
function computePhysics(state) {
  const mTotal = state.mL + state.mCart + state.mR;
  const F_gravity_L = state.mL * state.g;
  const F_gravity_R = state.mR * state.g;
  
  // Net accelerating force (positive = rightward)
  const F_net = F_gravity_R - F_gravity_L;
  
  // Acceleration by Newton's Second Law: a = F_net / M_total
  const acceleration = F_net / mTotal;
  
  // String Tensions (Internal constraint forces)
  // Left mass accelerating upward/downward:
  const tensionL = state.mL * (state.g + acceleration);
  // Right mass accelerating downward/upward:
  const tensionR = state.mR * (state.g - acceleration);
  
  return { mTotal, F_net, acceleration, tensionL, tensionR };
}
```

### 4.2 Numerical Integration & Boundary Collision
* **Euler-Cromer Integration:**
  $$\Delta t = 1/60\text{ s} \approx 0.0167\text{ s}$$
  $$v_{t+\Delta t} = v_t + a \cdot \Delta t$$
  $$x_{t+\Delta t} = x_t + v_{t+\Delta t} \cdot \Delta t$$
* **Bumper Limits:**
  * Left bumper stop: $x_{\text{min}} = \text{cartWidth} / 2 + 0.05\text{ m}$ (cart reaches left pulley).
  * Right bumper stop: $x_{\text{max}} = \text{trackLength} - \text{cartWidth} / 2 - 0.05\text{ m}$ (cart reaches right pulley).
  * When $x$ hits either boundary: $v = 0$, $a = 0$, audio triggers a soft bumper rubber thud `audio.playThud()`, and simulation pauses.

### 4.3 Canvas Rendering (`js/atwood-canvas.js`)
* **Aspect Ratio & Resolution:** Responsive HTML5 Canvas with high-DPI retina backing (`window.devicePixelRatio`).
* **Visual Components:**
  1. **Polished Aluminum Track:** Shaded horizontal rail with millimeter metric tick marks every $10\text{ cm}$.
  2. **Low-Friction Dynamic Cart:** Sleek anodized chassis with rotating spoke wheels, mass loading tray, and magnetic eyelet hooks for left and right cords.
  3. **Left and Right Flanged Pulleys:** Rotating grooved wheels at both ends of the track with radial spin animation proportional to cart speed.
  4. **Dynamic Strings:** Crisp taut cord drawn from cart eyelets over each pulley and hanging down vertically to the suspended mass trays.
  5. **Hanging Trays with Color-Coded Mass Tokens:**
     * $10\text{ g}$ (Bronze / Copper token)
     * $20\text{ g}$ (Silver / Aluminum token)
     * $50\text{ g}$ (Gold / Brass token)
     * $100\text{ g}$ (Steel barbell weight)
     * $200\text{ g}$ (Lead brick)
  6. **Interactive Vector HUD (Free-Body Diagram Overlay):**
     * Hovering directly over the cart:
       * Left vector arrow: $\mathbf{T}_L$ (labeled with exact Newtons, e.g., `0.98 N`).
       * Right vector arrow: $\mathbf{T}_R$ (labeled with exact Newtons, e.g., `1.47 N`).
       * Resultant net force vector: $\mathbf{F}_{\text{net}}$ (bold accent arrow pointing in acceleration direction).
     * Color coding: Green when $T_L = T_R$ ($F_{\text{net}} = 0$ equilibrium); Vivid Amber/Cyan when unbalanced.
  7. **Dual Optical Photogates:** Photogate A at $x = 0.50\text{ m}$ and Photogate B at $x = 1.50\text{ m}$ with infrared beam status LEDs (Green = clear, Red = triggered) and digital millisecond timers.

---

## 5. UI/UX, Theming & Accessibility Standards

To ensure universal compatibility across classroom projectors and Chromebooks, this webapp must strictly adhere to the established repository rules:

### 5.1 Mandatory High-Contrast Light Mode (WCAG AAA)
* **Persistent Theme Toggle (`#btnTheme`):** Switch between Dark Mode (default) and Light Mode, stored in `localStorage`.
* **Light Theme Specification:**
  * Body and container backgrounds: Pure crisp white (`#ffffff`) or light slate (`#f8fafc`).
  * Canvas background: Pure white (`#ffffff`) with ink-slate track (`#1e293b`) and dark coordinate grid (`#cbd5e1`).
  * Primary text: Near-black ink slate (`#0f172a`), achieving contrast ratios $\ge 14:1$.
  * Accents: Deep saturated ocean blue (`#0284c7`), forest emerald (`#15803d`), and royal violet (`#7c3aed`). Never use washed-out pale pastels that vanish under ambient classroom lighting.
* **Canvas Dynamic Re-rendering:** Any theme toggle event must trigger an immediate canvas redraw with updated color palettes.

### 5.2 Universal Root Font Scaling (Projector Mode)
* Provide a 3-tier font size controller in the header:
  * **Normal (`16px`):** Default 1:1 student Chromebook display.
  * **Large (`20px`):** Enhanced readability for small laptop screens.
  * **🖥️ Projector (`24px`):** Whole-classroom visibility from the back row under washed-out overhead projectors.
* Implementation: Dynamically updates `document.documentElement.style.fontSize`. All layout cards, buttons, telemetry indicators, and margins must use `rem` units so the entire interface scales proportionally.

### 5.3 Sticky Zero-Scroll Navigation Dock
* The top header and step navigation tabs must be `position: sticky; top: 0; z-index: 100` with `backdrop-filter: blur(12px)`.
* Tabs must use responsive CSS Grid (`repeat(4, minmax(0, 1fr))`) without horizontal scrollbars, ensuring navigation buttons never scroll out of view when switching steps.

### 5.4 Strict No LaTeX Math Notation
* **Never use LaTeX syntax** (`$F = ma$`, `\Delta`, `\vec{F}`, `\frac{}{}`) in UI labels, HUD telemetry, or instructions.
* Use standard plain text, Unicode symbols, and HTML markup:
  * Force & Acceleration: `F_net = m · a`, `a = F_net / m`
  * Net Force Summation: `ΣF = F₁ + F₂ = 0 N`
  * Delta & Units: `Δm`, `Δt`, `m/s²`, `kg`, `N`

### 5.5 Zero-Dependency Web Audio Synthesizer (`js/audio.js`)
* Uses native browser `AudioContext` (no external MP3/WAV files to load or fail):
  * `playClick()`: 800 Hz sine blip for buttons and tabs.
  * `playNudge()`: 250 Hz soft pneumatic puff for the dynamic equilibrium impulse.
  * `playClack()`: Metallic click for mass token transfers.
  * `playRoll()`: Continuous low-pass filtered noise proportional to cart velocity.
  * `playThud()`: Low 60 Hz damped impact for bumper collisions.
  * `playChime()`: 3-tone ascending major chord for mastery challenge success.
  * `playBuzzer()`: Low descending square wave for incorrect answers.
* Persistent audio toggle (`#btnAudio`) with ON/OFF state saved to `localStorage`.

---

## 6. Implementation Step-by-Step Task List for Claude Opus 5.5

When generating this webapp with Claude Opus 5.5, execute in the following modular sequence:

### Phase 1: Foundation & Theming (`index.html` & `style.css`)
1. Create semantic HTML5 structure with sticky header, root font scaling buttons (`Normal`, `Large`, `Projector`), theme toggle (`Light/Dark`), audio toggle, and the 4 navigation tabs (`Step 1: Equilibrium`, `Step 2: Isolate Force`, `Step 3: Isolate Mass`, `Mastery Arena`).
2. Build CSS custom properties design tokens (`--bg-primary`, `--text-primary`, `--accent-cyan`, `--border-color`, etc.) with full WCAG AAA Light Mode overrides.
3. Implement responsive 2-column workbench layout: Left Column (interactive canvas + simulation controls), Right Column (live telemetry HUD + real-time dual graphs + step guided instructions).

### Phase 2: Physics Engine & Web Audio (`js/physics.js` & `js/audio.js`)
1. Implement standard Euler-Cromer integration with precise string tension and boundary collision mechanics.
2. Build token transfer functions (`transferToken(from, to, mass)`) that enforce Step 2 (constant $M_{\text{total}}$) and Step 3 (constant $F_{\text{net}}$) constraint modes.
3. Build the zero-dependency Web Audio API synthesizer for all interaction sounds.

### Phase 3: Canvas Rendering & FBD Vector HUD (`js/atwood-canvas.js`)
1. Draw the high-resolution horizontal track, millimeter metric scale, cart chassis, spinning spoked wheels, left/right pulleys, and taut cords.
2. Render hanging mass trays with color-coded mass tokens.
3. Render live Free-Body Diagram vector arrows with real-time Newton readouts on top of the moving cart.
4. Render dual photogates with status LEDs and digital split-timer displays.

### Phase 4: Dual Graphing Engine (`js/graphing.js`)
1. Implement high-performance Canvas graphing component that plots:
   * Graph 1: Kinematic curves ($x$ vs $t$ or $v$ vs $t$).
   * Graph 2: Proportionality relationships ($a$ vs $F_{\text{net}}$ for Step 2; $a$ vs $M_{\text{total}}$ and $a$ vs $1/M_{\text{total}}$ for Step 3).
2. Ensure graphs listen to theme toggle events and immediately redraw with light/dark adaptive palettes.

### Phase 5: Step Controllers & Mastery Challenge Arena (`js/challenges.js` & `js/app.js`)
1. Wire up Step 1 (Equilibrium test and gentle nudge impulse).
2. Wire up Step 2 (Mass token shift with locked total system mass).
3. Wire up Step 3 (Ballast loading with locked net pulling force).
4. Implement the 5-tier randomized Mastery Challenge Arena with instant diagnostic hints, score tracking, anti-tamper certificate generation, and 1-click Google Classroom summary export.

---

## 7. Site & Curriculum Integration Checklist

Once the webapp is built and verified locally:
1. **Curriculum Store (`assets/lessons-data.js`):**
   * Add active link to Day 26 / Day 27 `links`, `assignments`, and `practice`:
     ```javascript
     "Newton's 2nd Law Studio": "Unit_2/newtons_second_law_studio/index.html"
     ```
2. **Course Outline (`Unit_2/outline.md`):**
   * Link the webapp in Day 26 and Day 27 activities.
3. **Unit Dashboard (`unit2-dashboard.html`):**
   * Add interactive studio card in the Unit 2 interactive tools grid.
4. **Site Footer Timestamp:**
   * Run `node scripts/update-timestamp.js`.
5. **Wiki Evolution Log (`.agents/wiki/logs.md`):**
   * Log the new pattern and deployment.

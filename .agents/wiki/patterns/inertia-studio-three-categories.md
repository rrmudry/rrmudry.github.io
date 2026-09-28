# Inertia Studio: 3 Physical Categories of Newton's First Law

## Context & Pedagogical Purpose
Students often find Newton's First Law deceptively simple or "obvious," yet persistently fail to apply it correctly when asked to identify forces on moving objects or predict post-release trajectories. The most prominent misconceptions include:
1. **Inertia of Rest**: Believing dishes stay put because "they are too heavy to move," rather than understanding static vs. kinetic friction force thresholds ($F_s \le \mu_s F_N$, requiring $a_{\text{cloth}} > \mu_s g$ to initiate slip).
2. **Inertia of Motion**: Believing that an unbelted passenger flying forward during a car crash is propelled by a "forward force of inertia" or momentum push, rather than having strictly **zero forward force ($F_{\text{fwd}} = 0\text{ N}$)** while the vehicle decelerates beneath them.
3. **Inertia of Direction**: Believing that an object whirled in a circle and released will spiral outward or curve away ("centrifugal force"), rather than departing along an exact, straight tangent line vector ($\mathbf{v}$).

The **Inertia Studio** (`Unit_2/inertia_studio/`) provides an interactive, mathematically rigorous physics visualizer and 3-tier Mastery Arena addressing these three regimes directly.

---

## Architecture & File Structure

```
Unit_2/inertia_studio/
├── index.html           # Semantic HTML5 layout, NGSS standard tags, telemetry HUD, modal
├── style.css            # Dark cosmic glassmorphic theme, responsive split-pane canvas/controls
└── js/
    ├── audio.js         # Zero-dependency Web Audio API sound synthesizer
    ├── sim-rest.js      # Tablecloth & coin drop simulation (Coulomb friction, slip acceleration, tipping torque)
    ├── sim-motion.js    # Crash cart & brake simulation (seatbelt restraint, F_fwd = 0 N HUD visualizer)
    ├── sim-direction.js # Uniform circular motion tether & wheel droplet spray (tangent vector vs spiral myth)
    ├── challenges.js   # 3-tier Mastery Challenge Arena with scoring and tamper-resistant certificate
    └── app.js           # Master controller (tab routing, 60fps loop, DPI scaling, slow motion)
```

---

## 1. Physics Engine Implementations

### A. Inertia of Rest (`sim-rest.js`)
- **Coulomb Friction Transition**:
  - While tablecloth acceleration $a_{\text{cloth}} \le \mu_s \cdot g$, static friction locks the dish to the cloth: $a_{\text{dish}} = a_{\text{cloth}}$.
  - When $a_{\text{cloth}} > \mu_s \cdot g$, the dish slips. Kinetic friction provides horizontal acceleration:
    $$a_{\text{dish}} = \mu_k \cdot g$$
  - Total slip displacement during pull duration $\Delta t$:
    $$\Delta x_{\text{slip}} = \tfrac{1}{2} (a_{\text{cloth}} - a_{\text{dish}}) \cdot (\Delta t)^2$$
- **Tipping Stability Torque**:
  - Tall items (like wine glasses or tall cylinders) experience overturning torque when inertial pseudo-force about the base exceeds gravitational restoring torque:
    $$m \cdot a \cdot (h / 2) > m \cdot g \cdot (w / 2) \implies a > g \cdot \frac{w}{h}$$
- **Tablecloth Boundary Geometry & Dynamic Drape**:
  - The tablecloth spans the entire tabletop width ($1.1\text{ m}$) and initially drapes over both the left and right ends of the table ($L_{\text{drape}} \approx 0.14\text{ m}$ / $55\text{ px}$).
  - As the cloth is yanked to the right, the left drape is dynamically pulled upward over the rounded left table corner ($y_{\text{drape}} = \max(0, L_{\text{drape}} - \Delta x_{\text{cloth}})$).
  - Once the cloth displacement exceeds the drape length ($\Delta x_{\text{cloth}} \ge L_{\text{drape}}$), the trailing edge transitions onto the horizontal tabletop surface without any phantom vertical cuts through the table wood.
- **Penny & Beaker Center Alignment & Vertical Free Fall**:
  - The glass beaker, index card, and penny are strictly co-aligned at the canvas horizontal centerline ($x = w \times 0.50$).
  - At rest, the card covers the beaker mouth and the penny rests on the card centered directly above the beaker opening.
  - Upon card flick ($a_{\text{card}} \approx 2000\text{ px/s}^2$), rapid slip minimizes horizontal impulse ($\Delta x < 1\text{ px}$), allowing the penny to experience pure vertical free fall into the beaker under gravity with an audible glass clink.
- **Modes**: Tablecloth Pull and Coin-on-Card Beaker Snap.

### B. Inertia of Motion (`sim-motion.js`)
- **Dual Reference Tracking**:
  - Simulates vehicle braking deceleration ($a_{\text{car}} = -\mu_{\text{brake}} \cdot g$) or rigid wall crash.
  - **Rigid Barrier Boundary**:
    - The vehicle's front bumper stops firmly against the front face of the barrier ($x_{\text{front}} = x_{\text{barrier}}$) upon impact, with front crumple deformation.
    - Prevents unphysical wall penetration where vehicles previously phased through solid obstacles.
  - **Seatbelt Latched**: Passenger decelerates synchronously with the vehicle ($F_{\text{belt}} = m_{\text{dummy}} \cdot a_{\text{car}}$) with realistic elastic belt flexion.
  - **Unbelted Kinematics & Realistic Containment Regimes**:
    - Rather than unphysically ejecting through the windshield during every braking event or low-speed fender-bender, realistic automotive containment is enforced across distinct regimes:
      1. **Emergency ABS Braking (`stopType === 'brake'`)**: The car decelerates on open road. The unbelted passenger slides forward across the seat by inertia ($F_{\text{fwd}} = 0\text{ N}$) until contacting the steering wheel and dashboard inside the cabin ($x_{\text{rel}} = 2.15\text{ m}$). The passenger remains pinned against the dashboard inside the vehicle until skidding to a complete halt (zero ejection).
      2. **Low/Moderate Speed Barrier Collision ($v_0 < 22\text{ m/s}$ / $< 50\text{ mph}$)**: Modern shatter-resistant laminated safety glass and the steering column contain the dummy inside the vehicle cabin. The dummy slams into the steering wheel and windshield with an interior thud, creating a spiderweb fracture pattern on the windshield, but remains contained inside the cabin.
      3. **High-Speed Severe Impact ($v_0 \ge 22\text{ m/s}$ / $\ge 50\text{ mph}$)**: Kinetic energy ($E_k = \frac{1}{2} m v^2 \ge 17,000\text{ J}$) exceeds structural containment limits. The windshield blows out and the unrestrained dummy is ejected through the glass, arcing over the hood and barrier in parabolic free fall ($v_y = -3.5\text{ m/s}$, $g = 9.8\text{ m/s}^2$), landing on pavement and skidding to rest under road friction.
- **Visual Misconception Buster**:
  - Real-time HUD and canvas overlays explicitly draw prominent zero-force and contact-force indicators:
    - Cruising / Sliding: `FORWARD FORCE = 0 N (Inertia is a Property of Mass, NOT a Force!)`
    - Interior Contact: `DASHBOARD CONTACT FORCE (Normal Force from Interior Surfaces)`
    - Belted: `F_seatbelt = m · a (Backward Restraining Force)`

### C. Inertia of Direction (`sim-direction.js`)
- **Uniform Circular Motion**:
  - Before release, centripetal string tension $F_T = m \cdot v^2 / r$ continuously redirects velocity toward the center.
  - At the exact millisecond of release ($F_T = 0$), the object leaves at tangent velocity vector $\mathbf{v} = \boldsymbol{\omega} \times \mathbf{r}$.
  - Overlay comparison toggle displays the **False Myth** (curving outward spiral) vs. **Observed Reality** (laser-straight tangent line).
- **Modes**: Whirling Ball on Tether, Water Droplet Spray from Spinning Wheel.

---

## 2. Mastery Challenge Arena (`challenges.js`)
To adhere strictly to the **Student Engagement Law (Explicit Completion or Genuine Fun)**:
- **Tier 1 (Rest)**: Students calculate the minimum pull acceleration needed to overcome static friction for silk ($\mu_s = 0.25$), linen ($\mu_s = 0.45$), or rubber ($\mu_s = 0.80$).
- **Tier 2 (Motion)**: Forensic investigation of a vehicle collision where students identify the true forces acting on an unrestrained driver and reject the phantom "forward push".
- **Tier 3 (Direction)**: Tangent-shot target challenge where students must time the release of a whirling satellite to strike an orbital docking station, proving velocity is strictly tangential.
- **Deliverable**: Earning 80+ points out of 100 unlocks the **Certificate of Newton's First Law Mastery** with verification hash, student name, and printable PDF styling.

---

## 3. Web Audio Synthesis (`audio.js`)
All sound effects are synthesized entirely in code using browser `AudioContext`:
- `playWhip()`: White noise burst with rapid exponential decay low-pass filter.
- `playCardSnap()`: Short high-frequency burst for card flick.
- `playClink()`: Dual sine waves (1200 Hz & 1800 Hz) simulating glass/ceramic resonance.
- `playCrash()`: Low-frequency sawtooth thud combined with screeching bandpass noise.
- `playStringCut()`: High sine sweep (600 Hz ➔ 1200 Hz).
- `playSuccess()`: 3-tone ascending major arpeggio fanfare (C5, E5, G5).

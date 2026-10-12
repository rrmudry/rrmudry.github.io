# Unit 2: Compressed Air Cardstock Rocket Build & Launch
## Comprehensive Physics Curriculum Tie-Ins & Pedagogical Alignment

**Target Activity:** Cardstock & Paper Pneumatic Rocket Engineering Challenge  
**Launcher Type:** Compressed Air / Pneumatic Launch Station (Pressurized Chamber & Quick-Release Valve)  
**Curriculum Alignment:** Unit 1 (Measurement & Calibration) & Unit 2 (1D Kinematics & Newtonian Dynamics)  
**Target Standards:** HS-PS2-1, HS-ETS1-2  

---

## 🚀 Executive Summary: The Rocket Flight Cycle

A compressed-air cardstock rocket launch provides a clean, experiential synthesis of every core physics concept taught during the first 38 instructional days of the year. The flight decomposes cleanly into three distinct physical phases:

```
[Phase 1: Pressurized Boost]       [Phase 2: Coasting Ascent]       [Phase 3: Free-Fall Descent]
On launch tube (0 to L_tube)       Exit tube to Apogee              Apogee to Ground Impact
Unbalanced F_net upwards           Unbalanced F_net downwards       Unbalanced F_net downwards
F_net = F_thrust - F_g             F_net = F_g (ignoring drag)      F_net = F_g (ignoring drag)
a >> 0 (rapid acceleration)        a = -10 m/s² (slowing down)      a = -10 m/s² (speeding up)
v increases from 0 to v₀           v decreases from +v₀ to 0        v becomes increasingly negative
```

---

## 📌 Phase-by-Phase Physics Tie-Ins

### Phase 1: Construction, Calibration & Mass Budget (Pre-Launch)

| Rocket Feature / Task | Physics Concept | Prior Class Tie-In & Day Reference |
| :--- | :--- | :--- |
| **Fuselage Tube Rolling & Fit** | Mechanical tolerances, tool calibration, diameter increments. | **Unit 1, Days 1–5**: The 1-Meter Challenge & Non-Standard Unit Challenge. Tube must fit the launcher mandrel snugly to trap air without binding. |
| **Rocket Mass Measurement** | SI base units vs. laboratory units: measuring mass in grams (g) on electronic balances and converting to kilograms (kg). | **Unit 1, Day 6**: Unit Conversions & Derived Units. Converting 25 g to 0.025 kg for standard Newton calculations (`1 N = 1 kg·m/s²`). |
| **Center of Mass (CM) vs. Fin Stability** | Mass distribution and aerodynamic torque. | **Unit 1, Day 7**: Density & Quality of Measurement. Adding clay to the nose cone shifts the CM forward, ensuring stable 1D vertical flight rather than chaotic tumbling. |
| **Repeated Hang-Time Protocol** | Mitigating measurement error and reaction time bias through trial averaging. | **Unit 1, Day 7 & Unit 2, Day 5**: Wind-Up Toy Speed Lab. Having 2–3 timers record each flight eliminates human reaction time variance (Unit 2, Day 20). |

---

### Phase 2: Launch Tube Pulse (Powered Acceleration Phase)

*Once the quick-release valve opens, high-pressure air acts on the cardstock fuselage inside the tube.*

* **Newton's 1st Law (State of Rest):**
  * *Tie-In:* **Unit 2, Days 22–25 (Inertia Studio)**.
  * The rocket sits at rest on the launch tube with balanced forces (F_support = F_g). It remains motionless until the release valve delivers an unbalanced pneumatic force.
* **Newton's 2nd Law Under Combined Vertical Forces (F_net = m · a):**
  * *Tie-In:* **Unit 2, Days 26–28 (Hall's Carriage Modified Atwood Lab)**.
  * While sliding up the tube of length L, the rocket experiences two opposing vertical forces:
    * Upward Pneumatic Thrust: F_thrust = P · A (pressure × cross-sectional area).
    * Downward Gravity: F_g = m · g.
    * Net Force: F_net = F_thrust - F_g.
    * Tube Acceleration: a_tube = F_net / m = (F_thrust - F_g) / m.
  * **The Mass Trade-Off:** Just like adding hanging masses in the Hall's Carriage lab, doubling the rocket's cardstock mass with excessive tape or heavy glue directly cuts its launch acceleration for any given launcher PSI.
* **Tube Friction & Pneumatic Seal:**
  * *Tie-In:* **Unit 2, Days 29–30 (Static vs. Kinetic Friction & Traction)**.
  * If the fuselage is too tight, kinetic friction with the launch tube resists upward motion. If it is too loose, pressurized air bypasses the tube and escapes, reducing F_thrust.

---

### Phase 3: Ascent Coasting Phase (Free-Fall Deceleration)

*The instant the rocket leaves the top of the launch tube, the compressed air is gone (F_thrust = 0).*

* **Newton's 1st Law (The Coasting Paradox):**
  * *Tie-In:* **Unit 2, Days 22–23 (Newton's 1st Law Close Reading & Inertia Demos)**.
  * **Core Conceptual Question:** *"Why does the rocket continue rising through the air when the launcher is no longer pushing it?"*
  * **Student Defense:** By Newton's First Law, an object in motion stays in motion. The rocket possesses upward inertia. It does **not** need a continuing upward force to maintain upward velocity.
* **Sign of Velocity vs. Sign of Acceleration (Slowing Down Rule):**
  * *Tie-In:* **Unit 2, Day 16 (Acceleration Rate & Sign Studio)**.
  * Taking upward as positive (+y):
    * Velocity is positive (v > 0, moving upward).
    * Acceleration is negative (a = -g = -10 m/s² downward due to gravity).
    * **Rule Verified:** When velocity and acceleration have **opposite signs**, the object is **slowing down**!
* **Newton's 2nd Law in Flight:**
  * *Tie-In:* **Unit 2, Days 26–28**.
  * The only significant vertical force acting on the rocket in flight is downward gravity (F_g = m · g).
  * Therefore: a = F_net / m = (-m · g) / m = -g = -10 m/s².
  * Notice that mass cancels out! Heavy and light rockets experience the exact same acceleration in free flight (ignoring air resistance).

---

### Phase 4: Apogee (Instantaneous Turnaround at Maximum Height)

*The rocket reaches its peak altitude (y_max).*

* **Zero Instantaneous Velocity with Non-Zero Acceleration:**
  * *Tie-In:* **Unit 2, Day 16 Level 4 Challenge (Directional Reversals)**.
  * **Top Misconception:** *"At the highest point, acceleration is zero because the rocket stops."*
  * **Physics Defense:** At apogee, instantaneous velocity is zero (v = 0 m/s), but acceleration is **still** -10 m/s² downward! If acceleration were zero at the peak, the rocket would hover frozen in mid-air and never fall back down.
* **1D Distance vs. Displacement:**
  * *Tie-In:* **Unit 2, Days 1–4 (Fantasy Map Quest & Vector Coordinates)**.
  * At apogee, net displacement is Δy = +h_max. Total distance traveled is also d = h_max.
  * Upon landing back at ground level:
    * Total distance traveled: d = 2 · h_max.
    * Net displacement: Δy = 0 m (the rocket returned to its starting origin).

---

### Phase 5: Descent Phase (Free-Fall Acceleration & Ground Return)

*The rocket falls from apogee back to the launch pad level.*

* **Sign Rule for Speeding Up:**
  * *Tie-In:* **Unit 2, Day 16 (Acceleration Studio)**.
  * Velocity is negative (v < 0, moving downward).
  * Acceleration is negative (a = -10 m/s² downward).
  * **Rule Verified:** When velocity and acceleration have the **same sign**, the object is **speeding up**!
* **Motion Symmetry & Time Division:**
  * *Tie-In:* **Unit 2, Days 17–20 (Reaction Time Free-Fall Lab)**.
  * For symmetrical 1D flight (neglecting aerodynamic differences):
    * Time to rise equals time to fall: t_up = t_down = t_hang / 2.
    * Speed upon return equals launch exit speed: v_impact = -v₀.

---

## 📊 Dual-Graph Kinematics Profile

Students can sketch and interpret the full rocket flight using the exact dual-graph methods mastered in **Unit 2, Days 11–15 (Graphing Speed Story & Marble Ramp Lab)**:

### 1. Position vs. Time (y-t) Graph
* **Shape:** A smooth, inverted parabola opening downward (y(t) = y₀ + v₀t - ½gt²).
* **Features:**
  * Starts at y = 0 on the ground.
  * The vertex of the parabola is the peak altitude (apogee).
  * Slope represents velocity: starts steep and positive (+v₀), flattens to zero slope at the vertex (v = 0 at apogee), and becomes steep and negative as it approaches impact.

### 2. Velocity vs. Time (v-t) Graph
* **Shape:** A single continuous straight line with a constant negative slope (slope = a = -10 m/s²).
* **Features:**
  * Y-intercept is the positive launch velocity (+v₀).
  * X-intercept (where v = 0) occurs exactly at t = t_up (halfway through the flight).
  * Impact occurs at t = t_hang with velocity -v₀.
  * **Geometric Area Tie-In (Day 12 & Day 15):** The area of the upper triangle between t = 0 and t = t_up represents the maximum apogee height:
    Area = ½ · base · height = ½ · t_up · v₀ = h_max

---

## 🧮 Student Launch-Day Calculations (No Complex Sensors Needed)

By timing total flight hang time (t_hang) with a stopwatch and measuring rocket mass (m) on a balance, students can perform full quantitative physics calculations using the exact equations from class:

### 1. Time to Apogee (t_up)
Assuming symmetrical ascent and descent:
`t_up = t_hang / 2`

### 2. Launch Exit Velocity (v₀)
Using the Kinematic Velocity Equation from **Day 17** (v_f = v₀ + at), knowing v = 0 at the top and a = -10 m/s²:
`0 = v₀ - (10) · t_up  -->  v₀ = 10 · t_up`  
*(Example: A 3.0-second total flight has t_up = 1.5 s, giving a launch exit velocity v₀ = 10 · 1.5 = 15 m/s or roughly 34 mph).*

### 3. Maximum Apogee Altitude (h_max)
Using the Kinematic Position Formula from **Day 18–20** (y = ½at² starting from rest at the top):
`h_max = ½ · g · (t_up)² = ½ · (10) · (t_up)² = 5 · (t_up)²`  
*(Example: For t_up = 1.5 s, h_max = 5 · (1.5)² = 5 · 2.25 = 11.25 meters).*

### 4. Average Acceleration Inside the Launch Tube (a_tube)
Using the launch tube length L (e.g., 0.40 m):
`v₀² = 2 · a_tube · L  -->  a_tube = v₀² / (2 · L)`  
*(Demonstrates that launch tube acceleration is often 100 to 300 m/s², or 10–30 g's, explaining the loud "pop" on launch).*

### 5. Net Thrust Force Delivered by the Air (F_thrust)
Using Newton's 2nd Law from **Days 26–28**:
`F_net = m · a_tube`  
`F_thrust = F_net + F_g = m · (a_tube + 10)`

---

## 🎯 Targeted Pre-Launch & Post-Launch Reflection Questions

1. **Inertia Probe (Newton's 1st Law):**
   * *"When the rocket is 5 meters above the launch tube, what upward force is keeping it moving upwards?"*  
   * **Answer:** *None! No upward force exists. The rocket moves upward due to its own inertia. Gravity is pulling it downward the entire time.*
2. **Acceleration at Apogee (Newton's 2nd Law):**
   * *"At the highest peak of flight, is the rocket's acceleration positive, negative, or zero? Defend your answer using Newton's Second Law."*  
   * **Answer:** *Negative (-10 m/s² downward). Gravity is still pulling down with force F_g = mg, so by a = F_net / m, acceleration must remain -10 m/s².*
3. **Mass vs. Altitude Prediction:**
   * *"If Team A builds a sleek 20-gram cardstock rocket and Team B builds a heavily taped 50-gram rocket, both launched at 40 PSI, which rocket will achieve a greater launch velocity? Explain using a = F_net / m."*  
   * **Answer:** *Team A's 20 g rocket. A smaller mass yields a larger acceleration inside the tube for the same pneumatic force, reaching a higher exit velocity v₀ and therefore higher apogee.*

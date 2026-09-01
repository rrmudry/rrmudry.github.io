# Unit 2: Rocketry DOK 4 Ideas & Low-Logistics Project Frameworks

> **Context:** 1D & 2D Kinematics, Projectile Motion, Newton's Laws of Motion, and Crash/Impact Engineering (`HS-PS2-1`, `HS-ETS1-2`, `HS-ETS1-3`).  
> **Purpose:** Bank of DOK 4 (Extended Thinking) performance tasks and rocketry frameworks, including adaptations for classrooms with constrained field time, safety, and launch logistics.

---

## 💡 Idea Bank: Rocketry DOK 4 Concepts

### 1. "Project AeroMax" — Hydro-Pneumatic Rocket Multi-Variable Optimization
* **Core Physics:** Newton's 2nd & 3rd Laws ($F_{net} = m \cdot a$, $F_{thrust} = \Delta m \cdot v_{exit} / \Delta t$), variable mass dynamics, and aerodynamic stability ($CM$ vs $CP$).
* **The Conflict:** Water provides essential reaction mass for thrust, but increases dead weight ($F_g = m(t) \cdot g$) and suppresses initial acceleration.
* **Student Task:** Teams model and predict the optimal water-to-air volume ratio (e.g., 20% vs 33% vs 50% fill) and aerodynamic fin stability ($CM$ at least 1-2 body diameters ahead of $CP$).
* **DOK 4 Deliverable:** Piecewise Velocity-Time ($v-t$) trajectory analysis distinguishing the powered boost phase ($a > 0$) from the unpowered coast phase ($a = -g - a_{drag}$), followed by a formal design defense.

---

### 2. "Target Coordinates" — Paper Rocket Ballistics & Drag Modeling
* **Core Physics:** 2D Kinematic projectile equations, initial exit velocity ($v_0$), angle optimization ($\theta$), and aerodynamic drag.
* **The Conflict:** Real-world paper rockets fall significantly short of idealized theoretical range formulas ($x = v_{0x} \cdot t$) due to non-zero air drag.
* **Student Task:** Students conduct calibration launches, determine an empirical drag correction factor ($\lambda$), and use their adjusted mathematical equations to land their rocket within a secret target coordinate grid revealed on launch day.
* **DOK 4 Deliverable:** Mathematical derivation sheets, model calibration graphs, and error-budget post-flight analysis.

---

### 3. "Operation Egg-stronaut" — Suborbital Payload & Impulse Mitigation
* **Core Physics:** Newton's 3rd Law liftoff thrust combined with impulse/momentum impact mitigation ($F_{impact} \cdot \Delta t = m \cdot \Delta v$).
* **The Conflict:** Protective structures add payload mass ($m$), reducing apogee, while lighter rockets experience higher peak impact forces upon landing.
* **Student Task:** Students design a dual-stage system (thrust generation + passive landing cushion or parachute deployment) to keep impact forces below the eggshell fracture threshold.
* **DOK 4 Deliverable:** Pre-flight mass budget, high-speed impact video telemetry review, and post-mission damage audit.

---

### 4. "Aerospace Contractor RFP" — Commercial Spaceflight Simulation
* **Core Physics:** Newton's Laws, payload mass trade-offs, stability margins, and cost-benefit engineering.
* **Student Task:** Student engineering teams bid on a simulated aerospace contract with rigid budget constraints (material costs per gram of tape/paper/plastic), flight stability certification requirements, and minimum payload targets.
* **DOK 4 Deliverable:** Formal bid proposal, flight data telemetry report, and presentation to a peer review board.

---

## 🛡️ Low-Logistics & High-Reproducibility Adaptations

To eliminate the logistical bottlenecks of multi-launch outdoor testing (weather, field access, lost rockets, pressure inconsistency, and time limits), use these high-leverage adaptations:

| Strategy | How It Works | Why It Saves Time & Eliminates Chaos |
|---|---|---|
| **1. "Single Flight, Rich Data" (One Official Launch Day)** | Students spend 2–3 days indoors completing bench testing (mass balances, $CM/CP$ string tests, fin angle jig builds, digital flight simulations), followed by **exactly one structured outdoor launch day** where slow-motion video and altimeter data are captured. | Avoids multiple trips outdoors; keeps launch day focused solely on data capture for post-flight analysis. |
| **2. Digital Sim Calibration (Hybrid Webapp)** | Students use a physics rocket simulator to test 50+ virtual iterations (varying PSI, water volume, fin sweep, drag). They calibrate the simulator's drag coefficient using a single class-wide demo launch dataset, then build their physical rocket based on their simulator predictions. | Replaces 20 physical trial-and-error launches with rapid digital modeling and math synthesis. |
| **3. Indoor Bench & Hallway Testing** | **Paper Rockets**: Launch horizontally down a closed hallway or gym using fixed angle guides and foam catchers.<br>**Water Rockets**: Test fin aerodynamic balance ($CM$ vs $CP$) on string pivots indoors without water/pressurization. | 100% weather-proof, reproducible, safe, and easily supervised inside the classroom. |
| **4. Class-Shared Parameter Matrix** | Instead of every group testing every variable, assign each group a distinct parameter slice (Group A tests 15% fill, Group B tests 30% fill, Group C tests 45% fill, etc.). Groups pool and analyze the master class dataset. | Each team only launches 1–2 times total, yet everyone gets a comprehensive 30-data-point multi-variable curve. |

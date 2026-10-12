# Pattern: Cardstock Rocketry Engineering, AVID Close Reading & Telemetry Modeling

> Architectural and pedagogical pattern for integrating pneumatic cardstock rocketry into high school physics, including 2-page AVID annotated reading worksheets, minimum-day fabrication pacing, multi-timer launch telemetry, and kinematic apogee derivations.

---

## 1. Pedagogical Rationale: Synthesizing Kinematics & Dynamics

Pneumatic cardstock rocketry provides a hands-on physical capstone uniting every major concept taught in 1D Kinematics and Newtonian Dynamics:
- **Newton's 1st Law (State of Rest & Coasting Paradox)**:
  - The rocket sits motionless on the launch tube with balanced forces ($F_{\text{support}} = F_g$).
  - Once exiting the launch tube, thrust ceases ($F_{\text{thrust}} = 0$). By Newton's First Law, upward inertia keeps the rocket climbing—no continuing upward force is needed.
- **Newton's 2nd Law & Mass Budget ($a = F_{\text{net}} / m$)**:
  - Net launch acceleration inside the tube is $a_{\text{tube}} = (F_{\text{thrust}} - F_g) / m$.
  - Doubling rocket mass with excessive tape or cardstock directly cuts launch acceleration in half for any given compressor PSI.
- **Kinetic Friction vs. Pneumatic Seal**:
  - A loose fuselage vents pressure prematurely ($F_{\text{thrust}} \to 0$); a tight fuselage produces high kinetic friction ($F_f = \mu_k F_N$), converting kinetic energy into heat. High performance requires an airtight sliding fit.
- **Aerodynamic Stability (Center of Mass vs. Center of Pressure)**:
  - **Center of Mass (CM)**: Balance point where mass is concentrated.
  - **Center of Pressure (CP)**: Aerodynamic centroid where lift and drag forces act.
  - **Stability Rule**: CM *must* be forward of CP by 1–2 body diameters. Adding clay ballast to the nose cone pulls CM forward; rear fins anchor CP backward. If CM is behind CP, aerodynamic drag flips the rocket end-over-end (tumbling flight).
- **Flight Kinematics Profile & Apogee Derivations**:
  - Symmetrical flight yields:
    - Time to Apogee: $t_{\text{up}} = t_{\text{hang}} / 2$
    - Launch Exit Velocity: $v_0 = 10 \cdot t_{\text{up}}$ (since $v_{\text{apogee}} = 0$)
    - Peak Altitude: $h_{\text{max}} = 5 \cdot (t_{\text{up}})^2$
    - Launch Tube Acceleration: $a_{\text{tube}} = v_0^2 / (2L)$

---

## 2. Weekly Pacing & Minimum Day Adaptation

Launching rockets outdoors requires sustained setup time (compressor/launch station setup, safety perimeter, timer coordination, recovery). When schedules include compact class periods (such as a 30-minute End of Quarter Minimum Day):
- **Monday (Day 31)**: AVID 5-Step Annotated Close Reading on key performance characteristics and physics rules (`Cardstock_Rocket_Annotated_Reading.pdf`).
- **Tuesday (Day 32)**: Precision Fabrication Day 1 — Fuselage rolling on 1/2" PVC mandrels, gravity drop tolerance test, cutting and beveling 3 or 4 symmetrical fins.
- **Wednesday (Day 33 - 30-Min Minimum Day)**: Dedicated In-Class Assembly Finishing & Quality Control — Attaching fins, molding nose cone with modeling clay ballast, string-loop balance test for CM vs CP, and earning the teacher Pre-Flight Quality Control Certification badge.
- **Thursday (Day 34)**: Full-Period Outdoor Launch Day — Dedicated field time with flight telemetry squads (Safety Officer, Pressurization Tech at 40 PSI, Trigger, 3 Stopwatch Timers, Recovery).
- **Friday (Day 35)**: Kinematics Telemetry Analysis & CER Defense — Calculating $t_{\text{up}}, v_0, h_{\text{max}}, a_{\text{tube}}$, and writing a formal Claim-Evidence-Reasoning technical synthesis.

---

## 3. Printable Worksheet Architecture (Strict 2-Page Letter Budget)

Worksheets must strictly conform to a 2-page print budget (`@page { size: letter portrait; margin: 0.24in 0.30in 0.24in 0.30in; }`):
1. **Annotated Reading Worksheet (`Cardstock_Rocket_Annotated_Reading.html`)**:
   - **Page 1**: Header, student fields, AVID 5-step checklist bar, 3-column reading grid (Left: 3-word gists; Center: Paras 1–3 on fuselage tolerance, mass budget, and CM vs CP; Right: Costa's Level 2/3 questions).
   - **Page 2**: Paras 4–5 (fins and kinematics), technical SVG aerodynamic schematic, 4-item engineering analysis problem set, and Phase 4 FNT Synthesis blueprint box.
2. **Lab Guide & Telemetry Log (`Cardstock_Rocket_Lab_Guide.html`)**:
   - **Page 1**: 4-step fabrication protocol, mass budget log ($g \to kg$), dimensional check, and 5-point teacher pre-flight certification stamp box.
   - **Page 2**: Launch squad roles banner, multi-timer data table (canceling $\pm 0.20\text{ s}$ reaction time error), 4-card kinematics calculation grid, and CER evaluation box.
3. **No LaTeX Rule**:
   - Formulas must use plain text and Unicode symbols ($a = F_{\text{net}} / m$, $v_0 = 10 \cdot t_{\text{up}}$, $h_{\text{max}} = 5 \cdot (t_{\text{up}})^2$, $\text{m/s}^2$).

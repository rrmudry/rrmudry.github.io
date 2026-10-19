# Hot Wheels Coasting Baseline: Deceleration & Friction Studio Pattern

> **Status**: Active Architecture Standard  
> **Tags**: `kinematics`, `dynamics`, `hot-wheels`, `deceleration`, `negative-acceleration`, `rolling-friction`, `momentum`, `conceptual-physics`  
> **Target Courses**: High School Conceptual Physics (Periods 1, 2, 3) & Physics (Unit 2 Kinematics/Dynamics — Day 36)  
> **Last Updated**: 2026-10-18  

---

## 1. Overview & Pedagogical Purpose

When introductory and conceptual physics students struggle with formal kinematic equations for acceleration ($a = \Delta v / \Delta t$ and $v_f^2 = v_i^2 + 2ad$), teaching deceleration mathematically often produces frustration and sign errors. 

The **Hot Wheels Coasting Baseline Lab** sneaks deceleration (negative acceleration) in through the back door visually and kinesthetically. By standardizing an 8-foot track apparatus and analyzing why cars coast to a stop, students directly experience that:
1. **Zero Forward Force**: On the flat coasting track, no engine or hand pushes the car forward.
2. **Backward Unbalanced Force**: Friction (rolling friction + air resistance) is the only horizontal force, pointing backward.
3. **Negative Acceleration**: Because net force is backward while velocity is forward, acceleration is negative ($a < 0$), causing the car to slow down.
4. **Stopping Distance as an Inverse Deceleration Metric**: Longer stopping distance means a gentler deceleration rate; shorter stopping distance means a sharper, more violent braking rate.

---

## 2. Standardized Laboratory Apparatus (4 Connected Track Pieces)

Each lab station standardizes the physical setup to ensure data repeatability across periods:
```
           [Starting Tape Mark]
                 🚗 RELEASE (Rest, No Pushing!)
                  \  4 Connected Track Pieces into Launch Ramp
  [Books/Chair]    \  Height: 20–30 cm off ground (Low to prevent bouncing)
  20–30 cm          \
─────────────────────┴────────────────────────────══════════════════► [Bumper Tape Mark]
Classroom Floor      x = 0 cm (Bottom of Ramp)     Open Floor Coasting Runway   Stop Point: d cm
                     (Transition to Floor)         (Backward Floor Friction F_f)
```

### Pro-Tip Constraints:
- **Low Angle**: The launch ramp must remain between 20 cm and 30 cm off the floor/table. Angles > 30 cm cause Hot Wheels cars to bottom out and bounce at the transition curve onto the floor, scrubbing off velocity and ruining data.
- **Starting Tape**: A piece of masking tape on the ramp provides a fixed release mark for all trials.
- **Baseline Floor Mark**: Students leave their champion stopping tape mark on the floor for Tuesday's investigation.

---

## 3. Laboratory Stages & Cognitive Workflow

### Stage 1: Setup & Calibration
- Team members record class period (Periods 1, 2, or 3) and partner names (station numbers removed).
- Physical verification checklist verifies 4 connected track pieces, 20–30 cm ramp height, starting tape, and clear open floor runway.

### Stage 2: The Car Shootout (15 mins)
- Groups test 3 distinct vehicles (e.g. Die-Cast Metal Muscle Car, Light Plastic Racer, Boxy Tall Truck).
- Release each car 3 times from the starting line without pushing.
- Place color-coded masking tape marks beside the floor at the front bumper.
- Automated average distance calculation crowns the **Champion Car**.
- Real-time HTML5 Canvas animation simulates the launch, transition curve, and deceleration, dropping color-coded bumper tape tags along the track scale.

### Stage 3: The Conceptual Hook & Weight Test (15 mins)
- **Conceptual Hook Question**: "If I tape pennies to the roof, the car presses down harder on the track (more downward force). Will it stop sooner, or will its extra momentum keep it rolling farther?"
- Students commit to a hypothesis (Hypothesis A: Stops sooner due to more friction, or Hypothesis B: Rolls farther due to more momentum) and write reasoning before testing.
- Empirical testing with +0, +2, +4, +6 pennies (~2.5 g per penny).
- **The Empirical Discovery**: For many cars, extra mass increases momentum to overcome rolling resistance; for other cars, extra weight increases wheel/axle friction.

### Stage 4: Understanding Deceleration (Conceptual Visualizer)
- Qualitative focus without algebraic formulas or calculations:
  1. Forward motion vs backward friction force (floor friction opposes motion like an invisible brake).
  2. Positive acceleration (speeding up forward) vs negative acceleration (slowing down while moving forward).
- Strobe / Ticker-Tape trail visualizer demonstrates dots spreading far apart during high speed and crowding closely together as the car slows down.

### Stage 5: Tuesday Baseline Retention & Synthesis
- Prominent directive: "🛑 LEAVE THE BASELINE STOPPING MARK TAPED TO THE FLOOR FOR TUESDAY!"
- Three targeted synthesis mastery questions:
  1. Q1: What specific force pushes backward on your car to make it slow down and stop? (Friction)
  2. Q2: Did adding pennies make your car roll farther or stop sooner? Why do you think that happened? (Empirical observation & reasoning)
  3. Q3: Why was it important that every car was released from the exact same tape line on the ramp without being pushed? (Fair testing / controlled variables)
- 10-point auto-grading engine submitting to Firestore (`unit2_day36_hot_wheels_coasting`).

---

## 4. Key Implementation Rules
- **Google Classroom Coursework Deployment**: Deployed across Periods 1, 2, and 3 via `node deploy-assignment.js --periods "1,2,3"`.
- **Pre-Flight Validation**: Passed 100% green via `npm run verify -- --id unit2_day36_hot_wheels_coasting`.
- **District Web Filter Safety**: Zero `unpkg.com` and Zero in-browser Babel. Built entirely with Vanilla CSS, native Vanilla JS, and official Google gstatic Firebase SDKs.
- **Universal Root Font Scaling**: Supports Normal (`16px`), Large (`19px`), and 🖥️ Projector (`23px`) for back-row classroom visibility.
- **Dynamic HTML5 Canvas Themes**: Automatically re-renders canvas physics tracks and data graphs on light/dark theme toggles.

# Hall's Carriage Modified Atwood Lab: Video Timing & Dynamic Mass Graphing

## Context
`Unit_2/halls_carriage_lab/` (Newton's 2nd Law, Day 28: Mass vs. Acceleration). Authentic laboratory activity using a blue plastic Hall's carriage on a horizontal lab bench pulled by a constant hanging mass over the table edge (no pulleys used). Students use slow-motion cellphone video and an in-app fullscreen digital stopwatch to record 5 mass configurations, execute the 3-step kinematic ladder, and analyze both inverse ($a$ vs. $m$) and linearized ($a$ vs. $1/m$) acceleration curves.

## Physical Apparatus & Setup Decisions
- **No Pulleys**: The string connecting the Hall's carriage to the hanging mass lays directly over the smooth, rounded edge of the table. Students observe realistic friction dynamics (experimental slope/acceleration slightly lower than ideal theoretical $m_{hang} \cdot g$).
- **Constant Pulling Force, Variable Carriage Cargo**: The hanging pulling mass is held constant across all 5 configurations (default 50.0 g, editable), while students vary the carriage mass across 5 configurations of their choice on an electronic balance.
- **Single-Shot Camera Framing**: Smartphone camera is positioned elevated/overhead to capture both the full 1.0 m track (Start Line 0.0 cm to Finish Line 100.0 cm) and the propped-up stopwatch in a single video frame at 120/240 fps slow motion.
- **Clock Pre-Roll & Time Zeroing**: Stopwatch is started several seconds before release so the clock ticks steadily in the video frame. Students scrub video to identify $t_0$ when the carriage first moves from rest and $t_f$ when the front bumper crosses 100 cm. The app calculates zeroed elapsed time $\Delta t = t_f - t_0$.

## 3-Step Kinematic Ladder & Productive Friction
Rather than auto-calculating acceleration, students complete a scaffolded 3-step calculation for each configuration:
1. **Average Speed**: $v_{avg} = d / \Delta t$
2. **Final Speed**: $v_f = 2 \cdot v_{avg}$ (since launching from rest $v_0 = 0$)
3. **Acceleration**: $a = v_f / \Delta t = (v_f - v_0) / \Delta t$
- Inputs accept values within an 8% tolerance and provide instant targeted diagnostic feedback on slips.
- Verified configurations receive green checkmark badges and dynamically update the canvas graphs.

## Dynamic Motion Graphing (CAST SEP 4 & SEP 5 Alignment)
- **Mode 1 ($a$ vs. $M_{total}$)**: Plots acceleration against total system mass ($m_{cart} + m_{hang}$), rendering the classic inverse hyperbolic curve predicted by $a \propto 1/m$.
- **Mode 2 ($a$ vs. $1/M_{total}$)**: Linearizes the inverse curve by plotting acceleration against inverse mass ($kg^{-1}$). Computes best-fit linear regression through origin ($y = k \cdot x$).
  - Slope $k = \sum(x \cdot y) / \sum(x^2)$ represents Experimental Net Force in Newtons.
  - Compares experimental slope against theoretical hanging pull $F_{hang} = m_{hang} \cdot g$.

## Accessibility & Theming
- High-contrast Light Mode (WCAG AAA contrast $> 14:1$) with explicit utility overrides for projector visibility.
- Dynamic canvas palette re-rendering on theme toggle.
- Integrated Web Speech API Text-to-Speech (TTS) for stage protocols and checklists.
- Integrated Web Audio sound effects synthesizer.
- Embedded Desmos Scientific Calculator slide-out drawer.
- Google Authentication with `@orangeusd.org` domain enforcement and auto-save to Firestore.

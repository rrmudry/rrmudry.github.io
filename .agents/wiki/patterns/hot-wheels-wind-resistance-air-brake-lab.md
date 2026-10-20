# Pattern: Hot Wheels Wind Resistance & Air Brake Investigation Webapp

## Context & Objectives
For Conceptual Physics (Periods 1, 2, 3), students investigate Newton's Laws and forces opposing motion. After establishing baseline rolling coasting distances, students tape an index card to the roof of their Hot Wheels car as an air brake and roll the car down a standardized launch ramp toward a variable-speed fan.

## Key Design Patterns

### 1. 5-Stage Step Navigation
- **Stage 1 (Air Brake & Headwind Setup)**: Visual checklist and SVG illustration demonstrating index card mounting, fan alignment directly along the track axis blowing toward the car, and release height calibration.
- **Stage 2 (Predictions & Hypotheses)**: Qualitative selection between 3 distinct hypotheses regarding the effect of opposing wind, with required 15+ character student justification and car specification tracking.
- **Stage 3 (Fan Speed Data Collection & Visualizer)**: 4 speed tiers (Off, Low, Med, High) with 3 trials each, automatic live averaging, an HTML5 Canvas simulation with dynamic fan rotation and wind streamlines, and a real-time bar graph comparing coasting distance across fan settings.
- **Stage 4 (Free-Body Diagram & Net Deceleration Force)**: Conceptual FBD demonstrating that friction ($F_f$) and drag ($F_{\text{drag}}$) act in the same backward direction, yielding $F_{\text{net}} = F_f + F_{\text{drag}}$ and steeper deceleration (compressed ticker tape / strobe dot spacing).
- **Stage 5 (Synthesis & Grade Submission)**: 3 synthesis prompts evaluating wind speed trends, air brake area orientation, and real-world fuel economy / aerodynamics, tied to a 10-point auto-grading engine submitting to Firestore.

### 2. Firestore Student Permissions Law
- Writes must target `student_results/unit2_day37_hot_wheels_air_resistance/students/{studentId}` where `studentId` is the district email prefix.
- Never write to parent doc `student_results/{assignmentId}` from client code.
- Always sanitize fields (`val !== undefined && val !== null ? val : null`).

### 3. High-Contrast WCAG AAA & District Web Filter Compliance
- Light and Dark modes with dynamic canvas palette adaptation.
- Root font scaling (`16px`, `19px`, `23px`).
- Zero `unpkg.com` and zero in-browser Babel.

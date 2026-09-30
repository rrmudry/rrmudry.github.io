# Tuning Fork Oscilloscope & Sinusoidal Modeling Pattern

## Context & Pedagogical Purpose
High school math (Algebra 2, Precalculus, Trigonometry) and physics (Waves & Sound) curricula often feature a cornerstone lab activity:
1. Strike an acoustic tuning fork (e.g. 256 Hz C4, 440 Hz A4, 512 Hz C5).
2. Sample the acoustic pressure wave using a microphone.
3. Measure the physical wave parameters: Period T, Frequency f = 1/T, Peak-to-Peak height, Amplitude A, and Midline D.
4. Formulate a sinusoidal model function:
   y = A sin(B(t - C)) + D   or   y = A cos(B(t - C)) + D
   where B = 2π / T = 2π f.
5. Transfer tabular data (t_i, y_i) into Desmos Graphing Calculator to perform statistical regression and compare student-derived models with computer best-fit curves.

### The Historical Bottleneck
Historically, schools relied on proprietary Vernier LabQuest or GoDirect hardware microphones running Logger Pro software. When schools transitioned to Chromebooks and web-based platforms, teachers found that:
1. Logger Pro is largely deprecated.
2. Web apps found online either lack data tables or perform poorly on Chromebooks/phones.
3. Chromebook built-in microphones appeared to yield distorted, choppy, non-sinusoidal results.

---

## Architectural Breakthroughs & Solutions

### 1. Chromebook / Mobile Audio Filter Bypass
**Root Cause of Poor Chromebook Audio**:
Modern browsers (Chrome, Edge, Safari) default `getUserMedia` to voice conferencing settings:
- `echoCancellation: true`
- `noiseSuppression: true`
- `autoGainControl: true`

A tuning fork emits a continuous, steady acoustic tone with zero vocal harmonics. Voice noise suppression algorithms classify this pure tone as steady background acoustic noise (such as an air conditioner or fan hum) and aggressively filter, warp, or squelch it!

**The Solution**:
Explicitly disable all voice pre-processing filters in `navigator.mediaDevices.getUserMedia`:
```javascript
const constraints = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
    sampleRate: { ideal: 44100 }
  }
};
```
By bypassing these filters, the raw, uncompressed 44.1 kHz / 48 kHz acoustic pressure wave from the Chromebook's physical microphone capsule is fed directly into the Web Audio API buffer unaltered, producing pristine mathematical sine waves.

### 2. Virtual Tone Sampler (Zero-Hardware Fallback)
For classrooms without physical tuning forks or students on devices with restricted microphone permissions, the app includes an internal Web Audio tone synthesizer (256 Hz, 288 Hz, 320 Hz, 341.3 Hz, 384 Hz, 426.7 Hz, 440 Hz, 512 Hz):
- **Speaker Playback**: Emits a reference acoustic pitch.
- **Direct Buffer Sampling**: Generates the exact mathematical sine wave with realistic natural exponential decay directly into the oscilloscope buffer with a single click, allowing 100% of students to complete the analytical activity.

### 3. Oscilloscope Edge Trigger & Vernier Calipers
- **Auto-Trigger**: Continuously samples the rolling buffer; once the input crosses a volume threshold (e.g., 12%), it locks onto a rising-edge zero crossing ($y_{i-1} \le 0$ and $y_i > 0$), freezing a stationary, centered wave.
- **Interactive Dual Calipers**: Vernier Logger Pro-style Caliper 1 and Caliper 2 can be dragged across the wave (or snapped to peaks/troughs via `🧲 Snap to Peaks`). Real-time HUD calculates:
  - Δt = t₂ - t₁ = Period T
  - Frequency f = 1 / T
  - Peak-to-Peak Δy = y_max - y_min
  - Amplitude A = Δy / 2
  - Midline D = (y_max + y_min) / 2
  - Angular frequency B = 2π / T = 2π f (rad/s)

### 4. Direct 1-Click Desmos Integration
Desmos accepts Tab-Separated Values (TSV) from the system clipboard.
- The app formats data points as:
  ```text
  0.000000\t0.01245
  0.000023\t0.04512
  ...
  ```
- **Downsampling to the "Desmos Sweet Spot"**: Exporting 44,000 raw points can lag browser tabs on student Chromebooks. The app downsamples the selected caliper span to ~80–120 points, providing perfect curve resolution while ensuring instantaneous Desmos regression execution.
- **Zero-Time Alignment**: A toggle allows aligning t = 0.0000 s at the start of the selection, simplifying horizontal phase shift calculations for students.
- **1-Click Paste Workflow**:
  1. Click **Copy Table for Desmos**.
  2. Click **Open Desmos** and press `Ctrl + V` (creates table x₁, y₁).
  3. Type `y_1 ~ a*sin(b*(x_1 - c)) + d` or `y_1 ~ a*cos(b*(x_1 - c)) + d`.

### 5. In-App Non-Linear Least-Squares Regression
To provide immediate formative feedback before or alongside Desmos, the studio includes a built-in regression engine:
1. Evaluates trial angular frequencies B in a window around the caliper-derived nominal frequency.
2. Solves the 3 x 3 linear least-squares system for α, β, D in:
   y_i = α sin(B t_i) + β cos(B t_i) + D
3. Converts α sin(Bt) + β cos(Bt) into amplitude A = √(α² + β²) and phase shift C, adjusting for minimal non-negative phase.
4. Renders the regression curve in emerald green alongside the student's pink model curve and displays R² fit quality.

### 6. Classroom Readability & Projection Standards
- Persistent High-Contrast Light Mode (WCAG AAA ≥ 14:1, ink-slate text on pure white, deep ocean accents `#0284c7`).
- Root font scaling (`font-normal`, `font-large`, `font-huge` / 🖥️ Projector mode).
- Dynamic canvas re-rendering upon theme or font toggle.
- Strictly NO LaTeX notation in HTML text (Unicode Δt, x₁, y₁, π, etc.).

# Unit 6: Interactive Assessment Web Apps (Development Plan)

This document outlines the specific development goals, anti-cheat mechanisms, and UI requirements for 5 interactive physics assessments designed for the Waves & Electromagnetic Radiation unit.

---

## 1. The "Unknown Signal" Analyzer
**Curriculum Focus:** Week 3 (EM Spectrum & Math)
**Learning Objective:** Measure wavelength/period from a graph, calculate wave speed/frequency, and classify EM radiation types based on energy.

* **Randomized Parameters (Anti-Cheat):**
  * Base frequency ($f$) chosen from a massive range ($10^4$ Hz to $10^{18}$ Hz).
  * Oscilloscope grid scale (e.g., 1 box = $0.1$ nm or 1 box = $500$ km).
* **Student Input / Action:**
  * Drag an overlay "caliper" tool to measure crest-to-crest distance on the screen.
  * Enter calculated wavelength ($\lambda$), frequency ($f$), and Energy ($E$) into a submission form.
  * Select the correct EM band (Radio, Micro, Infrared, Visible, UV, X-Ray, Gamma) from a dropdown based on their math.
* **Success Criteria & Validation:**
  * App checks student inputs against the hidden, randomized truth values (with a 5% margin of error for visual measuring).
  * If correct, the app generates a "Validation Code" (e.g., `ALPHA-9X-22B`) that the student copies into their LMS/worksheet to prove completion.
* **Core UI Elements:**
  * A central canvas drawing a dynamic, moving sine wave.
  * A background grid with dynamic axis labels.
  * Draggable measuring overlays (vertical and horizontal lines).
  * A "Control Panel" form for data entry.

---

## 2. Ripple Tank: Interference Node Hunter
**Curriculum Focus:** Week 2 (Superposition & Interference)
**Learning Objective:** Identify constructive vs. destructive interference spatially and prove it using path-length difference ($|L_1 - L_2| = n\lambda$ vs $(n+0.5)\lambda$).

* **Randomized Parameters (Anti-Cheat):**
  * Source Separation Distance ($d$) between $3\lambda$ and $10\lambda$.
  * Source Wavelength ($\lambda$).
* **Student Input / Action:**
  * The app displays a 2D top-down interference pattern (bright/dark fringing arcs).
  * The student gets a prompt: "Drag the probe to a 2nd-order Node (Destructive)" or "1st-order Antinode (Constructive)".
  * The student drags a "Detector Probe" onto the canvas. The app outputs the direct distance from Source 1 ($L_1$) and Source 2 ($L_2$).
  * The student uses $L_1$ and $L_2$ to prove the path-length difference condition is met in an input box.
* **Success Criteria & Validation:**
  * The app verifies the probe's $(x,y)$ coordinate falls within the mathematical bounds of the requested nodal/antinodal line.
  * The student's path-difference math must match the probe's location.
* **Core UI Elements:**
  * HTML5 Canvas rendering overlapping semi-transparent expanding circles to create Moire/interference patterns.
  * Draggable "Probe" icon that updates a distance readout panel in real-time.

---

## 3. The Digital Encoder (Analog-to-Digital Converter)
**Curriculum Focus:** Week 4 (Wave-Particle Duality & Tech)
**Learning Objective:** Demonstrate how continuous analog waves are sampled, quantized, and encoded into binary data for digital transmission.

* **Randomized Parameters (Anti-Cheat):**
  * The initial analog wave function (a composite of 2 random sine waves).
  * The sampling rate required by the prompt (e.g., "Sample every 2 milliseconds").
* **Student Input / Action:**
  * Students view an analog wave spanning 10 milliseconds.
  * They must place "Sample Points" (dots) on the wave exactly at the requested time intervals.
  * They read the voltage of each sample point and round it to the nearest integer (quantization).
  * They convert that integer into a 3-bit or 4-bit binary string (e.g., $5$V $\rightarrow$ `0101`).
* **Success Criteria & Validation:**
  * The app checks that sample points are placed on the correct X-axis intervals.
  * The final submitted binary string must perfectly match the digitized representation of the randomized analog wave.
* **Core UI Elements:**
  * A static, complex wave graph.
  * "Click-to-place" capability on the wave line to freeze a sample dot.
  * A sequenced input strip at the bottom where students type their binary 0s and 1s.

---

## 4. Snell's Law Mystery Prism
**Curriculum Focus:** Week 2 (Boundary Behaviors / Refraction)
**Learning Objective:** Measure angles of incidence/refraction and use Snell's Law ($n_1\sin\theta_1 = n_2\sin\theta_2$) to identify unknown materials.

* **Randomized Parameters (Anti-Cheat):**
  * The angle of the incoming laser beam ($\theta_1$).
  * The Index of Refraction ($n$) of the mystery block, pulled from a bank of 10 real materials.
* **Student Input / Action:**
  * Rotate and position a digital protractor over the "Normal Line" interface.
  * Visually measure $\theta_1$ and $\theta_2$.
  * Calculate $n_2$ (assuming $n_1 = 1.0$ for air).
  * Submit the calculated index and select the matching material from a provided digital table.
* **Success Criteria & Validation:**
  * The selection must match the hidden material assigned to that session ID.
* **Core UI Elements:**
  * A split-screen SVG/Canvas showing Air (top) and Mystery Material (bottom).
  * A red laser line that bends at the boundary.
  * A transparent, rotatable protractor tool overlay.

---

## 5. Doppler Radar Velocity Tracker
**Curriculum Focus:** Week 1 (Wave Characteristics & Relative Motion)
**Learning Objective:** Apply the Doppler equation to calculate the velocity of an object based on the compression/expansion of consecutive wave fronts.

* **Randomized Parameters (Anti-Cheat):**
  * The velocity of the moving object ($v_{obj}$).
  * The rest frequency ($f_{wave}$) of the emitted wave.
* **Student Input / Action:**
  * A car/star moves across the screen, emitting concentric circular waves (with compressed fronts ahead, expanded behind).
  * Students hit "Pause" to freeze the frame.
  * They use a ruler to measure the compressed wavelength ($\lambda_{observed}$).
  * They calculate the object's speed.
* **Success Criteria & Validation:**
  * Calculated $v_{obj}$ matches the background engine speed within a 5% tolerance.
* **Core UI Elements:**
  * A fast-refreshing Canvas animation loop drawing expanding circles from a moving point.
  * Pause/Play controls.
  * A draggable ruler that rotates.

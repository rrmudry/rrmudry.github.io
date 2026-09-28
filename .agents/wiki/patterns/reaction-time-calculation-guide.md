# Reaction Time Lab Calculations & Grouped Column Graphing Guide

## Context & Pedagogical Purpose
Following the hands-on data collection in the **P031 Reaction Time Lab**, students consistently stumble when translating raw drop measurements into calculated physical quantities and constructing grouped column graphs. The primary points of friction are:
1. **Order of Operations in Averages**: Students type `d1 + d2 + d3 / 3` directly into basic phone or search bar calculators, failing to hit equals first and inadvertently dividing only the third trial.
2. **SI Unit Neglect ($10\times$ Error)**: Distance must be in meters ($x$) because gravitational acceleration is $g = 10\text{ m/s}^2$ (in meters). Plugging centimeters directly into the formula yields unphysical reaction times ($10\times$ too large)!
3. **Classroom Free Fall Formula ($t = \sqrt{x / 5}$)**:
   - For educational clarity and mental math accessibility, the physics curriculum standardizes on $g = 10\text{ m/s}^2$ (or $-10\text{ m/s}^2$).
   - Starting from rest ($v_0 = 0$), free-fall kinematics simplifies to $x = \frac{1}{2}gt^2 = \frac{1}{2}(10)t^2 = 5t^2$.
   - Rearranging directly gives: $t = \sqrt{x / 5}$, eliminating the need for multi-step multiplications.
4. **Grouped Column Graph Construction**: Misunderstanding grouped bar charts by placing all undistracted trials together and all distracted trials together, rather than clustering paired bars by group member (Person 1, 2, 3, 4).

The **Reaction Time Calculation & Grouped Graphing Guide** (`Unit_2/reaction_time_guide/`) provides a step-by-step masterclass designed for high-contrast, large-font classroom projection and 1:1 student Chromebook reference.

---

## Architecture & Features

```
Unit_2/reaction_time_guide/
├── index.html   # High-readability step-by-step masterclass with projector mode font controls
├── style.css    # Cosmic glassmorphic styling, font size toggle classes, high-contrast cards
└── guide.js     # Live math steps engine, unit converter, kinematic solver, and canvas grouped bar grapher
```

### 1. Presentation & Readability Modes (Slide-Style Tabs & High-Contrast Light Mode)
To eliminate scrolling walls of text and accommodate whole-classroom front-of-room projection from the teacher station:
- **Slide-Style Tab Pages & Sticky Header Navigation**: Only one step/page is visible at a time (`#pane-1` to `#pane-5`). The 5-button step navigation menu is integrated directly into the sticky top header (`position: sticky; top: 0; z-index: 100`) as a balanced 5-column CSS grid (`grid-template-columns: repeat(5, minmax(0, 1fr))`). This completely eliminates horizontal scrollbars across all screen widths and projector zoom modes, and ensures navigation buttons never scroll out of view when switching steps or scrolling down long practice sections.
- **Universal Root Font Scaling**: Font buttons directly target `document.documentElement.className` (`font-normal` [16px], `font-large` [20px], `font-huge` [25px]). Because all UI cards, headers, formula banners, and buttons are defined in `rem` units, every dimension resizes proportionally.
- **High-Contrast Light Mode**: Fully contrasting light mode (`html.theme-light`) featuring ink slate `#0f172a` text (>14:1 contrast), crisp slate borders (`#cbd5e1`), white card backgrounds, and adaptive high-contrast canvas colors.
- **Seamless Connected Square Root Radical (No-LaTeX Vinculum Pattern)**: Replaced standard disconnected text `√` glyphs and detached floating overbars with a vertically stretching SVG radical (`.math-radical .radical-symbol` with `preserveAspectRatio="none"`) seamlessly meeting a flush overbar (`border-top: 0.1em solid var(--accent-cyan)` with `margin-left: -1px`). The hook starts on the left, plunges below the denominator, ascends to the top corner, and turns continuously into the horizontal vinculum spanning the radicand without any gap or misalignment across all font sizes.
- **Persistent State**: User preferences for text size and theme are stored in `localStorage('p031_font_size')` and `localStorage('p031_theme')`.

### 2. Five Step-by-Step Pedagogical Sections
1. **Step 1: Calculating the Average Drop Distance ($\bar{d}$ in cm)**:
   - Formulates $\text{Average} = (d_1 + d_2 + d_3) / 3$ with real student numbers.
   - Highlights the calculator order-of-operations trap.
   - Live interactive 3-trial calculator that dynamically computes sum and division with intermediate steps shown.
2. **Step 2: Converting Centimeters to Meters ($x$ in meters)**:
   - Explains the dimensional necessity: $g = 10\text{ m/s}^2$ contains meters.
   - Golden rule: Divide by 100 or shift the decimal point two places left ($\leftarrow\leftarrow$): $x = \text{cm} / 100$.
   - Quick reference table for common drop catch distances ($8.0\text{ cm} \to 0.080\text{ m}$, $15.0\text{ cm} \to 0.150\text{ m}$, $20\text{ cm} \to 0.200\text{ m}$, $30\text{ cm} \to 0.300\text{ m}$, $45\text{ cm} \to 0.450\text{ m}$).
   - Live interactive converter widget.
3. **Step 3: Calculating Reaction Time from Free Fall ($t = \sqrt{x / 5}$)**:
   - Derivation using $g = 10\text{ m/s}^2$: $x = 5t^2 \implies t = \sqrt{x / 5}$.
   - 2-step student calculation protocol: (1) divide meters by 5 ($x / 5$), (2) press square root ($\sqrt{\phantom{x}}$).
   - Human reflex benchmark scale:
     - Elite Athlete / Gamer: $0.12 - 0.16\text{ s}$ ($8 - 13\text{ cm}$)
     - Alert Human Baseline: $0.17 - 0.23\text{ s}$ ($15 - 26\text{ cm}$)
     - Mild Delay / Fatigue: $0.24 - 0.29\text{ s}$ ($28 - 42\text{ cm}$)
     - Distracted (Phone / Texting): $0.30+\text{ s}$ ($45+\text{ cm}$)
   - Live solver displaying both seconds ($0.197\text{ s}$) and milliseconds ($197\text{ ms}$) with benchmark feedback.
4. **Step 4: Grouped Column Graph Engine**:
   - Covers both worksheet graphs:
     - Graph 1: Average Drop Distance (Undistracted vs. Distracted)
     - Graph 2: Reaction Time in Seconds (Undistracted vs. Distracted)
   - Canvas-based High-DPI grouped column generator:
     - 4 Person groups with paired adjacent bars (Undistracted Cyan vs. Distracted Amber).
     - Values printed above each column, clean gridlines, uniform starting-zero scale, and legend.
     - "Load Sample Class Data" button for instantaneous teacher demonstration.
     - "Save Graph Image (PNG)" for student digital submissions.
5. **Step 5: Written Analysis & CER Writing**:
   - Structured sentence frames addressing the 3 lab synthesis prompts:
     1. Who was fastest?
     2. Who was slowest?
     3. Was the distraction effective?
   - Connects distraction latency to neural signal biology and highway vehicle reaction distances ($d_{\text{react}} = v_0 \cdot t$, demonstrating why 0.10s delay adds ~10 ft of uncontrolled motion at 65 mph).

---

## Curriculum Integration
- **Day 21 (2026-09-28)**: Linked in `assets/lessons-data.js` as the primary reference guide and practice tool.
- **Unit 2 Dashboard (`unit2-dashboard.html`)**: Added hero quick-launch button.
- **Unit 2 Outline (`Unit_2/outline.md`)**: Linked in Day 21 planning links.
- **Master Resources (`resources.html`)**: Listed under *Kinematics & Motion*.

# Pattern: Printable Graphing Worksheets & Student-Calibrated Dual Grids

> Architectural pattern for designing, rendering, and verifying printable student worksheets featuring open-ended authoring, SVG coordinate grids, and exact-page letter PDF exports.

---

## 1. Pedagogical Rationale: Student-Authored Dual-Graph Story

The **Constant Speed Story: Dual-Graph Edition** invites students to compose their own word problem and scenario, then prove their solution visually across two complementary graphs:
1. **Front Page (Creative Story & Algebraic Proof)**:
   - Scenario sketch/drawing box for visual grounding.
   - Student-authored narrative word problem establishing knowns ($v$, $d$, or $t$) and a single target unknown.
   - Structured 5-Step **GUESS** proof (Givens, Unknown, Equation, Substitute, Solve) with explicit unit tracking.
2. **Back Page (Dual-Graph Graphical Proof)**:
   - **Scale Planner Table**: Prevents scale errors before students draw their lines by having them calculate axis intervals (Total / Intervals = Unit per tick).
   - **Position vs. Time ($x-t$) Graph**: Linear line with positive slope, slope calculation box proving $\text{Slope} = \Delta x / \Delta t = v$.
   - **Velocity vs. Time ($v-t$) Graph**: Flat horizontal line at $v$, shaded rectangular box proving $\text{Area} = v \cdot \Delta t = \Delta x$.
   - **Dual-Graph Synthesis Questions**: Connecting the visual geometry (slope and area) to physical motion.

---

## 2. Open Student-Calibrated Grids vs Hardcoded Numbers

When students invent their own scenarios, they select vastly different speeds (e.g., $2\text{ m/s}$ walking vs. $25\text{ m/s}$ car) and times ($5\text{ s}$ to $60\text{ s}$).

### The Design Challenge
- If axis numbers are pre-printed, student values will frequently fall outside the grid bounds or cram into the bottom corner.
- If the grid is completely blank without ticks, students draw inconsistent spacing, crooked lines, and inaccurate slopes.

### The Solution: Open Tick Notches
1. **Pre-drawn SVG Grid Lines**: Standardized light gray subdivisions (`#e2e8f0`) with bold major grid lines (`#94a3b8`) and crisp axis baselines (`#1e293b`).
2. **Open Value Boxes / Ticks**: Small bracket lines along the axes leaving write-in space for student numbers.
3. **Aligned Horizontal Time Widths**: Both the $x-t$ and $v-t$ grids use identical horizontal coordinates (e.g., $W = 690\text{px}$, Left Margin $= 55\text{px}$, Right Margin $= 20\text{px}$, exactly 10 major time divisions). This aligns the elapsed time 1:1 vertically between the position change and the velocity duration.

```javascript
// Example SVG grid generator snippet with 10 horizontal time divisions
function generateGridSVG(width, height, xDivs, yDivs, xLabel, yLabel) {
    const padL = 55, padR = 20, padT = 20, padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    // Render major gridlines, minor subdivisions, tick marks, and axis titles
    // Leave axis number labels open for student calibration
}
```

---

## 3. Strict 2-Page Letter Print Budget (Puppeteer / Chrome PDF)

To ensure the student worksheet prints on a single double-sided sheet of standard US Letter paper without spilling onto a 3rd page:

### Page Budget Constraints
- **Target Height**: Standard Letter is $11.0\text{ in} \times 8.5\text{ in}$.
- With `@page { size: letter portrait; margin: 0.32in; }`, the usable content height is:
  $$11.0\text{ in} - 2 \times 0.32\text{ in} = 10.36\text{ in} \approx 994.56\text{ pt}$$
- Set `.page { height: 10.36in; max-height: 10.36in; box-sizing: border-box; overflow: hidden; page-break-after: always; }`.

### Automated Layout Clearance Validation
In generation scripts, inspect element client bounding rects via headless Puppeteer:
```javascript
const clearance = await page.evaluate(() => {
    const pages = document.querySelectorAll('.page');
    return Array.from(pages).map(p => p.scrollHeight - p.clientHeight);
});
// Verify that clearance is 0 for all pages (no vertical overflow)
```

---

## 4. No-LaTeX Notation Policy in HTML & Worksheets

As established across `rrmudry.github.io`, MathJax/KaTeX are not loaded on static worksheets to ensure instant rendering, offline reliability, and zero font-glyph corruption.
- Use Unicode and plain HTML tags:
  - $\Delta \rightarrow$ `Δ`
  - $v_0, x_0 \rightarrow$ `v₀`, `x₀`
  - Subscripts / Superscripts $\rightarrow$ `m/s²`, `½`
  - Fractions / Formulas $\rightarrow$ `v = Δx / Δt`, `Area = v · Δt`

---

## 5. Accompanying Teacher Master Key & 10-Point Rubric

Every student worksheet should be paired with a concise 1-page Teacher Master Key PDF (`Teacher_Master_Key_*.pdf`):
1. **Holistic 10-Point Scoring Breakdown**:
   - 2 pts: Scenario & Creative Problem (realistic numbers, units, clear unknown).
   - 3 pts: GUESS Algebraic Solution (all 5 steps complete with units).
   - 2 pts: Position vs. Time Graph (scaled axes, linear slope, slope proof matching $v$).
   - 2 pts: Velocity vs. Time Graph (aligned time axis, flat horizontal line, shaded area proof matching $d$).
   - 1 pt: Synthesis & Unit Cancellation Analysis.
2. **Complete Annotated Exemplar**: A fully worked reference scenario (e.g. Mars Rover traversing $120\text{ m}$ at $6\text{ m/s}$ in $20\text{ s}$) demonstrating student calculations and expected graph appearance.

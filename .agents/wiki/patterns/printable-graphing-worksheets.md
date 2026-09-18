# Pattern: Printable Graphing Worksheets & 3-Stage Dual-Graph Studio Modeling

> Architectural pattern for designing, rendering, and verifying printable student worksheets featuring 3-stage piecewise constant speed motion, Dual-Graph Studio alignment, SVG coordinate grids, and exact-page letter PDF exports.

---

## 1. Pedagogical Rationale: 3-Stage Dual-Graph Motion Modeling

The **Constant Speed Story: 3-Stage Dual-Graph Edition** invites students to compose their own multi-phase motion journey across $10.0\text{ seconds}$ (matching Level 3 of the **Dual-Graph Studio** webapp), then prove their mathematical calculations visually across two complementary graphs:
1. **Front Page (Creative Story, 3-Stage Path & GUESS Breakdown)**:
   - **3-Stage Scenario Drawing**: Sketching the moving object, reference origin ($x_0 = 0\text{m}$), turning/pause points, and final destination.
   - **3-Section Narrative Grid**: Three distinct side-by-side prompt boxes: Section 1 ($0\text{s}$ to $t_1$, initial motion), Section 2 ($t_1$ to $t_2$, mid-course action/pause), and Section 3 ($t_2$ to $10\text{s}$, final stretch).
   - **Structured 3-Stage Motion & GUESS Table**: Rows for Time Interval ($\Delta t$), Initial and Final Positions ($x_i \rightarrow x_f$), Signed Displacement ($\Delta x$), Direction checkboxes (Forward [+], Stopped [0], Backward [-]), and step-by-step GUESS Velocity calculations ($v = \Delta x / \Delta t$).
   - **Trip Totals**: Explicit summary of Total Time ($\Delta t_{\text{total}} = 10.0\text{s}$), Net Displacement ($\Delta x_{\text{net}} = x_{\text{final}} - x_{\text{initial}}$), and Total Distance ($|\Delta x_1| + |\Delta x_2| + |\Delta x_3|$).
2. **Back Page (Dual-Graph Graphical Proofs)**:
   - **Position vs. Time ($x-t$) Graph**: Standardized Studio coordinates (Time: $0$ to $10\text{s}$; Position: $-2$ to $18\text{m}$, step of $2\text{m}$, with bold $x=0$ axis). Students plot 3 connected segments and verify 3 individual slopes ($m = \Delta x / \Delta t = v$).
   - **Velocity vs. Time ($v-t$) Graph**: Stacked directly underneath with identical horizontal time width (Time: $0$ to $10\text{s}$; Velocity: $-4$ to $+6\text{m/s}$, with prominent $v = 0$ axis). Students draw 3 horizontal bars and shade the rectangular displacement areas to the zero baseline.
   - **Dual-Graph Synthesis & Proofs**: 3-part synthesis verifying that $\sum \text{Area} = \Delta x_{\text{net}}$, interpreting negative slope/velocity, and showing dimensional unit cancellation $[(\text{m/s}) \times (\text{s}) = \text{m}]$.

---

## 2. Coordinate Synchronization with Dual-Graph Studio Webapp

To ensure zero cognitive friction between the interactive webapp and the paper assignment:
- **Standardized Time Bounds**: $t \in [0, 10\text{s}]$ with integer tick marks at each second.
- **Position Bounds**: $x \in [-2\text{m}, 18\text{m}]$ (20m span, 10 major grid divisions, step of 2m) accommodating reverse motion, zero crossings, and stationary intervals.
- **Velocity Bounds**: $v \in [-4\text{m/s}, +6\text{m/s}]$ (10 m/s span, 5 major divisions of 2 m/s, minor grid at 1 m/s) with a prominent baseline at $v = 0\text{m/s}$.
- **1:1 Time Column Width**: $W = 690\text{px}$, Left Margin $= 52\text{px}$, Right Margin $= 18\text{px} \implies$ Plot Width $= 620\text{px}$. Each 1-second step is identically $62\text{px}$ wide on both graphs, ensuring that the start/end points of Section 1, 2, and 3 align 1:1 vertically between slope and area.

---

## 3. Unnumbered Student-Calibrated Axes & Scale Planner Pattern

When students author their own motion story, pre-printed numbers on axes can constrain their creativity or contradict their custom distances and speeds. To support authentic student scale selection:
- **Unnumbered Axes on Student Worksheet (`showNumbers: false`)**:
  - Suppress numerical text labels on both axes while rendering crisp 6px tick marks at every division along the horizontal (time) and vertical (position/velocity) axes.
  - Leave generous margins (e.g., $34\text{px}$ along the left Y-axis and $28\text{px}$ along the bottom X-axis) so students can comfortably handwrite their scale numbers ($0, 1, 2, 3...$, $0, 2, 4, 6...$, or $0, 5, 10, 15...$).
  - **Graph 1 ($x-t$)**: Bold baseline at the bottom horizontal axis and bold vertical axis forming an $L$-coordinate frame starting at $(0,0)$.
  - **Graph 2 ($v-t$)**: Prominent bold center baseline representing $v = 0\text{ m/s}$ with ticks across the center line, 4 divisions above ($+v$ forward), and 4 divisions below ($-v$ reverse).
- **Scale Calibration Planner Bar**:
  - Provide a compact calibration guide above Graph 1 prompting students to explicitly declare their scale factors before plotting:
    - *Time Axis ($t$)*: $1\text{ block} = \text{____ s}$
    - *Position Axis ($x$)*: $1\text{ block} = \text{____ m}$
    - *Velocity Axis ($v$)*: $1\text{ block} = \text{____ m/s}$
- **Teacher Master Key Retains Full Exemplar (`showNumbers: true`)**:
  - The Teacher Master Key retains complete pre-printed numbers, slope triangles, and shaded areas matching the reference scenario (e.g. Mars Rover), allowing teachers to grade against an established standard.


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

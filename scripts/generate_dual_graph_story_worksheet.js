/**
 * Generates Constant Speed Story: Dual-Graph Edition (x-t & v-t)
 * Unit 2: Kinematics — Day 15 (Friday, Sep 18, 2026)
 * 
 * Features:
 * - 2-Page Double-Sided Student Worksheet PDF (Page 1 = Author & Solve; Page 2 = Dual Graphs & Proofs)
 * - 1-Page Teacher Master Key / Exemplar PDF
 * - High-resolution SVG graph paper grids with student-calibrated tick boxes
 * - Strict Letter portrait CSS (10.36in page height, print-color-adjust, zero overflow)
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Generates an authentic, high-precision student-calibrated coordinate grid
function generateBlankPlotGrid({
  width = 690,
  height = 240,
  marginLeft = 55,
  marginBottom = 36,
  marginRight = 20,
  marginTop = 18,
  xBlocks = 10,
  yBlocks = 8,
  subdivisions = 5,
  xLabel = "Time t (seconds)",
  yLabel = "Position x (meters)",
  title = "Graph 1: Position vs. Time (x vs. t)"
}) {
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const dx = plotWidth / xBlocks;
  const dy = plotHeight / yBlocks;
  const subDx = dx / subdivisions;
  const subDy = dy / subdivisions;

  let gridLines = '';

  // Minor grid lines
  for (let i = 0; i <= xBlocks * subdivisions; i++) {
    if (i % subdivisions !== 0) {
      const x = marginLeft + i * subDx;
      gridLines += `<line x1="${x.toFixed(1)}" y1="${marginTop}" x2="${x.toFixed(1)}" y2="${marginTop + plotHeight}" stroke="#f1f5f9" stroke-width="0.75" />\n`;
    }
  }
  for (let j = 0; j <= yBlocks * subdivisions; j++) {
    if (j % subdivisions !== 0) {
      const y = marginTop + j * subDy;
      gridLines += `<line x1="${marginLeft}" y1="${y.toFixed(1)}" x2="${marginLeft + plotWidth}" y2="${y.toFixed(1)}" stroke="#f1f5f9" stroke-width="0.75" />\n`;
    }
  }

  // Major grid lines
  for (let i = 0; i <= xBlocks; i++) {
    const x = marginLeft + i * dx;
    gridLines += `<line x1="${x.toFixed(1)}" y1="${marginTop}" x2="${x.toFixed(1)}" y2="${marginTop + plotHeight}" stroke="#cbd5e1" stroke-width="1.2" />\n`;
    // Tick mark below axis
    gridLines += `<line x1="${x.toFixed(1)}" y1="${marginTop + plotHeight}" x2="${x.toFixed(1)}" y2="${marginTop + plotHeight + 5}" stroke="#334155" stroke-width="1.5" />\n`;
    // Write-in box for student scale number
    if (i === 0) {
      gridLines += `<text x="${x.toFixed(1)}" y="${marginTop + plotHeight + 15}" font-size="9" font-family="'Inter', sans-serif" font-weight="700" fill="#0f172a" text-anchor="middle">0</text>\n`;
    } else {
      gridLines += `<rect x="${(x - 12).toFixed(1)}" y="${marginTop + plotHeight + 6}" width="24" height="12" rx="2" fill="#ffffff" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="1.5 1.5" />\n`;
    }
  }

  for (let j = 0; j <= yBlocks; j++) {
    const y = marginTop + plotHeight - j * dy;
    gridLines += `<line x1="${marginLeft}" y1="${y.toFixed(1)}" x2="${marginLeft + plotWidth}" y2="${y.toFixed(1)}" stroke="#cbd5e1" stroke-width="1.2" />\n`;
    // Tick mark to the left of axis
    gridLines += `<line x1="${marginLeft - 5}" y1="${y.toFixed(1)}" x2="${marginLeft}" y2="${y.toFixed(1)}" stroke="#334155" stroke-width="1.5" />\n`;
    // Write-in box for student scale number
    if (j === 0) {
      gridLines += `<text x="${marginLeft - 7}" y="${(y + 3).toFixed(1)}" font-size="9" font-family="'Inter', sans-serif" font-weight="700" fill="#0f172a" text-anchor="end">0</text>\n`;
    } else {
      gridLines += `<rect x="${marginLeft - 30}" y="${(y - 6).toFixed(1)}" width="24" height="12" rx="2" fill="#ffffff" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="1.5 1.5" />\n`;
    }
  }

  // Axes with Arrowheads
  const originX = marginLeft;
  const originY = marginTop + plotHeight;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="plot-grid-svg">
      <defs>
        <marker id="arrow-right-${title.replace(/[^a-zA-Z0-9]/g, '')}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0f172a"/>
        </marker>
        <marker id="arrow-up-${title.replace(/[^a-zA-Z0-9]/g, '')}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 1.5 10 L 5 0 L 8.5 10 z" fill="#0f172a"/>
        </marker>
      </defs>
      <rect x="${marginLeft}" y="${marginTop}" width="${plotWidth}" height="${plotHeight}" fill="#ffffff" stroke="#64748b" stroke-width="1.2" />
      ${gridLines}
      <!-- Main Axes -->
      <line x1="${originX}" y1="${marginTop - 6}" x2="${originX}" y2="${originY}" stroke="#0f172a" stroke-width="2.2" marker-end="url(#arrow-up-${title.replace(/[^a-zA-Z0-9]/g, '')})" />
      <line x1="${originX}" y1="${originY}" x2="${marginLeft + plotWidth + 8}" y2="${originY}" stroke="#0f172a" stroke-width="2.2" marker-end="url(#arrow-right-${title.replace(/[^a-zA-Z0-9]/g, '')})" />
      
      <!-- Axis Labels -->
      <text x="${marginLeft + plotWidth / 2}" y="${height - 5}" font-size="10.5" font-family="'Inter', sans-serif" font-weight="700" fill="#0f172a" text-anchor="middle">${xLabel}</text>
      <text transform="rotate(-90)" x="${-(marginTop + plotHeight / 2)}" y="14" font-size="10.5" font-family="'Inter', sans-serif" font-weight="700" fill="#0f172a" text-anchor="middle">${yLabel}</text>
      
      <!-- Title -->
      <text x="${marginLeft + plotWidth / 2}" y="13" font-size="11" font-family="'Inter', sans-serif" font-weight="800" fill="#0f172a" text-anchor="middle">${title}</text>
    </svg>
  `;
}

// Strict Print CSS
const printCss = `
  @page {
    size: letter portrait;
    margin: 0.32in 0.42in 0.32in 0.42in;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    background: #ffffff;
    margin: 0;
    padding: 0;
    line-height: 1.25;
    font-size: 8.5pt;
  }

  .worksheet-page {
    width: 100%;
    height: 10.36in;
    max-height: 10.36in;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    page-break-after: always;
  }

  .worksheet-page:last-child {
    page-break-after: avoid;
  }

  /* Header */
  .worksheet-header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 4px;
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .header-titles h1 {
    font-size: 13pt;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 1px 0;
    text-transform: uppercase;
    letter-spacing: -0.3px;
  }

  .header-titles .sub {
    font-size: 7.8pt;
    font-weight: 700;
    color: #0284c7;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .header-meta {
    font-size: 8pt;
    text-align: right;
  }

  .student-fields {
    display: flex;
    gap: 12px;
    margin-top: 3px;
  }

  .field-line {
    border-bottom: 1px solid #475569;
    display: inline-block;
  }

  .field-label {
    font-weight: 700;
    color: #334155;
  }

  .score-box {
    border: 1.5px solid #0f172a;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 8pt;
    font-weight: 800;
    background: #f8fafc;
    display: inline-block;
    margin-top: 2px;
  }

  /* Directives Banner */
  .task-banner {
    background: #f1f5f9;
    border-left: 3.5px solid #0284c7;
    border-top: 1px solid #cbd5e1;
    border-right: 1px solid #cbd5e1;
    border-bottom: 1px solid #cbd5e1;
    border-radius: 0 4px 4px 0;
    padding: 4px 8px;
    font-size: 8pt;
    color: #1e293b;
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .badge {
    display: inline-block;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
  }
  .badge-blue { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
  .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

  /* Sections */
  .section-card {
    border: 1.5px solid #cbd5e1;
    border-radius: 5px;
    padding: 6px 8px;
    margin-bottom: 6px;
    background: #ffffff;
  }

  .section-card:last-child {
    margin-bottom: 0;
  }

  .section-header {
    font-weight: 800;
    color: #0f172a;
    font-size: 8.5pt;
    text-transform: uppercase;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 2px;
    margin-bottom: 4px;
  }

  .section-desc {
    font-size: 7.5pt;
    color: #64748b;
    font-weight: normal;
    text-transform: none;
  }

  /* Drawing Box */
  .drawing-box {
    border: 1.5px dashed #94a3b8;
    border-radius: 4px;
    height: 175px;
    background: #fafafa;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .drawing-watermark {
    font-size: 8pt;
    color: #94a3b8;
    font-style: italic;
    text-align: center;
    pointer-events: none;
    line-height: 1.4;
  }

  /* Word problem writing lines */
  .story-lines {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 6px;
    padding-bottom: 2px;
  }

  .story-line {
    border-bottom: 1px dashed #94a3b8;
    height: 16px;
    width: 100%;
  }

  /* GUESS Table */
  .guess-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
  }

  .guess-table td {
    padding: 3.5px 5px;
    border: 1px solid #cbd5e1;
    vertical-align: middle;
  }

  .guess-letter {
    width: 24px;
    text-align: center;
    font-weight: 900;
    font-size: 9.5pt;
    background: #f1f5f9;
    color: #0284c7;
  }

  .guess-label {
    width: 105px;
    font-weight: 700;
    color: #1e293b;
    background: #f8fafc;
  }

  .guess-content {
    background: #ffffff;
  }

  .blank-write {
    display: inline-block;
    border-bottom: 1px solid #475569;
    min-width: 100px;
  }

  /* Scale Planner */
  .scale-planner-grid {
    display: flex;
    gap: 8px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 4px 8px;
    margin-bottom: 5px;
    font-size: 7.5pt;
  }

  .scale-col {
    flex: 1;
  }
  .scale-col strong {
    display: block;
    color: #0f172a;
    margin-bottom: 1px;
    font-size: 7.8pt;
  }

  /* Analysis box under grid */
  .graph-analysis-bar {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 4px 8px;
    margin-top: 3px;
    margin-bottom: 5px;
    font-size: 8pt;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Footer */
  .footer-bar {
    border-top: 1px solid #cbd5e1;
    padding-top: 3px;
    font-size: 7.2pt;
    color: #64748b;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

function renderStudentWorksheet() {
  const grid1 = generateBlankPlotGrid({
    width: 690,
    height: 228,
    marginLeft: 55,
    marginBottom: 34,
    marginRight: 20,
    marginTop: 18,
    xBlocks: 10,
    yBlocks: 8,
    subdivisions: 5,
    xLabel: "Time t (seconds)",
    yLabel: "Position x (meters)",
    title: "Graph 1: Position vs. Time (x vs. t)"
  });

  const grid2 = generateBlankPlotGrid({
    width: 690,
    height: 198,
    marginLeft: 55,
    marginBottom: 34,
    marginRight: 20,
    marginTop: 18,
    xBlocks: 10,
    yBlocks: 6,
    subdivisions: 5,
    xLabel: "Time t (seconds)",
    yLabel: "Velocity v (m/s)",
    title: "Graph 2: Velocity vs. Time (v vs. t)"
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Constant Speed Story: Dual-Graph Edition</title>
  <style>${printCss}</style>
</head>
<body>

  <!-- ============================================================ -->
  <!-- PAGE 1 (FRONT): AUTHOR, ILLUSTRATE & GUESS SOLUTION           -->
  <!-- ============================================================ -->
  <div class="worksheet-page">
    <div>
      <!-- Header -->
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Constant Speed Story: Dual-Graph Edition</h1>
          <p class="sub">Unit 2: Kinematics &bull; Author, Illustrate, Solve &amp; Graph &bull; Day 15 Performance Task</p>
        </div>
        <div class="header-meta">
          <div class="student-fields">
            <div><span class="field-label">Name:</span> <span class="field-line" style="min-width:170px;"></span></div>
            <div><span class="field-label">Period:</span> <span class="field-line" style="min-width:35px;"></span></div>
            <div><span class="field-label">Date:</span> <span class="field-line" style="min-width:65px;"></span></div>
          </div>
          <div class="score-box">SCORE: _____ / 10 pts</div>
        </div>
      </div>

      <!-- Task Directive -->
      <div class="task-banner">
        <span>✏️ <strong>Mission:</strong> Invent an original character/vehicle in constant speed motion. Illustrate the scene, write your word problem, and solve using the GUESS method. On the back, plot both graphs to prove your solution!</span>
        <span class="badge badge-blue">HS-PS2-1 • Performance Task</span>
      </div>

      <!-- Part 1: Illustration -->
      <div class="section-card">
        <div class="section-header">
          <span>Part 1: Scenario Illustration</span>
          <span class="section-desc">Sketch your moving object with origin (x = 0) and motion arrow (→)</span>
        </div>
        <div class="drawing-box">
          <div class="drawing-watermark">
            [ Draw your character, vehicle, runner, robot, animal, or space probe in steady motion ]<br>
            Label: Starting Reference Point (x = 0 m) • Direction of Travel (→) • Estimated Speed (v)
          </div>
        </div>
      </div>

      <!-- Part 2: Story Problem -->
      <div class="section-card">
        <div class="section-header">
          <span>Part 2: Original Kinematics Word Problem</span>
          <span class="section-desc">Give 2 known values with units, and ask for the 3rd unknown variable</span>
        </div>
        <div style="font-size:7.8pt; color:#475569; margin-bottom:4px;">
          <em>Prompt: Write a clear word problem describing your scene. Choose which unknown to solve for: <strong>Speed (v)</strong>, <strong>Distance (d)</strong>, or <strong>Time (t)</strong>.</em>
        </div>
        <div class="story-lines">
          <div class="story-line"></div>
          <div class="story-line"></div>
          <div class="story-line"></div>
          <div class="story-line"></div>
        </div>
      </div>

      <!-- Part 3: GUESS Method Proof -->
      <div class="section-card">
        <div class="section-header">
          <span>Part 3: Mathematical Solution Proof (G.U.E.S.S. Method)</span>
          <span class="section-desc">Show complete algebraic steps with explicit units</span>
        </div>
        <table class="guess-table">
          <tr>
            <td class="guess-letter">G</td>
            <td class="guess-label">Givens (with units)</td>
            <td class="guess-content">
              Known #1: <span class="blank-write" style="min-width:140px;"></span> &nbsp;&nbsp;&nbsp;&nbsp;
              Known #2: <span class="blank-write" style="min-width:140px;"></span> &nbsp;&nbsp;&nbsp;&nbsp;
              Unit Conversions (if any): <span class="blank-write" style="min-width:100px;"></span>
            </td>
          </tr>
          <tr>
            <td class="guess-letter">U</td>
            <td class="guess-label">Target Unknown</td>
            <td class="guess-content">
              Variable to solve for: &nbsp;&nbsp;
              <label><input type="checkbox"> Speed (v)</label> &nbsp;&nbsp;&nbsp;&nbsp;
              <label><input type="checkbox"> Distance (d)</label> &nbsp;&nbsp;&nbsp;&nbsp;
              <label><input type="checkbox"> Time (t)</label>
            </td>
          </tr>
          <tr>
            <td class="guess-letter">E</td>
            <td class="guess-label">Equation (Formula)</td>
            <td class="guess-content">
              Circle formula used: &nbsp;&nbsp;
              <strong>v = d / t</strong> &nbsp;&nbsp;|&nbsp;&nbsp;
              <strong>d = v &bull; t</strong> &nbsp;&nbsp;|&nbsp;&nbsp;
              <strong>t = d / v</strong>
            </td>
          </tr>
          <tr>
            <td class="guess-letter">S</td>
            <td class="guess-label">Substitute</td>
            <td class="guess-content">
              Plug numbers and units into your formula: <span class="blank-write" style="min-width:380px;"></span>
            </td>
          </tr>
          <tr>
            <td class="guess-letter">S</td>
            <td class="guess-label">Solve &amp; Box</td>
            <td class="guess-content">
              Final numerical answer with units: 
              <span style="display:inline-block; border:1.5px solid #0f172a; padding:2px 14px; font-weight:800; border-radius:3px; margin-left:8px; min-width:160px; text-align:center;">
                &nbsp;
              </span>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer Page 1 -->
    <div class="footer-bar">
      <span>Orange High School &bull; Physics Department</span>
      <span>Constant Speed Story: Dual-Graph Edition &bull; Page 1 of 2 (Front)</span>
      <span>Turn over to plot both motion graphs &rarr;</span>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- PAGE 2 (BACK): DUAL-GRAPH MODELING & GEOMETRIC PROOFS         -->
  <!-- ============================================================ -->
  <div class="worksheet-page">
    <div>
      <!-- Header Page 2 -->
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Graphical Motion Modeling &bull; x-t and v-t Proofs</h1>
          <p class="sub">Slope as Physical Velocity &bull; Area under the Curve as Physical Displacement</p>
        </div>
        <div class="header-meta">
          <div class="student-fields">
            <div><span class="field-label">Name:</span> <span class="field-line" style="min-width:150px;"></span></div>
            <div><span class="field-label">Period:</span> <span class="field-line" style="min-width:35px;"></span></div>
          </div>
        </div>
      </div>

      <!-- Scale Planner -->
      <div class="scale-planner-grid">
        <div class="scale-col">
          <strong>⏱️ Horizontal Scale (Time t):</strong>
          Total Time = <span class="blank-write" style="min-width:40px;"></span> s &bull; Each grid block = <span class="blank-write" style="min-width:35px;"></span> s
        </div>
        <div class="scale-col">
          <strong>📏 Graph 1 Vertical (Position x):</strong>
          Total Dist = <span class="blank-write" style="min-width:40px;"></span> m &bull; Each grid block = <span class="blank-write" style="min-width:35px;"></span> m
        </div>
        <div class="scale-col">
          <strong>🏎️ Graph 2 Vertical (Velocity v):</strong>
          Speed v = <span class="blank-write" style="min-width:40px;"></span> m/s &bull; Each grid block = <span class="blank-write" style="min-width:35px;"></span> m/s
        </div>
      </div>

      <!-- Graph 1: Position vs. Time -->
      <div style="display:flex; justify-content:center;">
        ${grid1}
      </div>

      <!-- Graph 1 Analysis -->
      <div class="graph-analysis-bar">
        <span><strong>📐 Graph 1 Slope Proof:</strong> Slope = &Delta;x / &Delta;t = (<span class="blank-write" style="min-width:45px;"></span> m &minus; 0 m) / (<span class="blank-write" style="min-width:35px;"></span> s &minus; 0 s) = <strong><span class="blank-write" style="min-width:50px;"></span> m/s</strong></span>
        <span>Matches my story speed? <label><input type="checkbox"> YES</label> <label><input type="checkbox"> NO</label></span>
      </div>

      <!-- Graph 2: Velocity vs. Time -->
      <div style="display:flex; justify-content:center;">
        ${grid2}
      </div>

      <!-- Graph 2 Analysis -->
      <div class="graph-analysis-bar">
        <span><strong>🟨 Graph 2 Area Proof:</strong> Shaded Area = Height &times; Width = (<span class="blank-write" style="min-width:45px;"></span> m/s) &times; (<span class="blank-write" style="min-width:35px;"></span> s) = <strong><span class="blank-write" style="min-width:50px;"></span> meters</strong></span>
        <span>Matches my story distance? <label><input type="checkbox"> YES</label> <label><input type="checkbox"> NO</label></span>
      </div>

      <!-- Part 6: Dual-Graph Synthesis Card -->
      <div class="section-card" style="margin-top:4px;">
        <div class="section-header">
          <span>Dual-Graph Synthesis &bull; Connecting Slope and Area</span>
          <span class="badge badge-amber">Core Concept Check</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:7.8pt; line-height:1.25;">
          <div>
            <strong>1. Slope Physical Meaning:</strong><br>
            The visual steepness (slope) of your Position-Time line physically represents the object's <span class="blank-write" style="min-width:85px;"></span>.
          </div>
          <div>
            <strong>2. Area Physical Meaning:</strong><br>
            The shaded geometric area under the Velocity-Time line physically represents the total <span class="blank-write" style="min-width:85px;"></span> traveled.
          </div>
        </div>
        <div style="font-size:7.8pt; margin-top:4px; border-top:1px solid #e2e8f0; padding-top:3px;">
          <strong>3. What If Challenge:</strong> If your object traveled at <em>twice</em> its speed in the same time, describe what would happen to: (a) Graph 1's slope: <span class="blank-write" style="min-width:120px;"></span> &bull; (b) Graph 2's shaded area: <span class="blank-write" style="min-width:140px;"></span>
        </div>
      </div>
    </div>

    <!-- Footer Page 2 -->
    <div class="footer-bar">
      <span>Orange High School &bull; Physics Department</span>
      <span>Constant Speed Story: Dual-Graph Edition &bull; Page 2 of 2 (Back)</span>
      <span>Unit 2: Kinematics &bull; Teacher: Mr. Mudry</span>
    </div>
  </div>

</body>
</html>
  `;
}

function renderTeacherMasterKey() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Teacher Master Key: Constant Speed Dual-Graph Story</title>
  <style>
    ${printCss}
    .key-header { background: #0f172a; color: #ffffff; padding: 6px 12px; border-radius: 4px; margin-bottom: 8px; }
    .key-badge { background: #ccff00; color: #000; font-weight: 800; padding: 2px 6px; border-radius: 3px; font-size: 7.5pt; }
    .exemplar-box { background: #f8fafc; border: 1.5px solid #0284c7; border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; }
    .grid-preview { display: flex; gap: 10px; margin-top: 6px; }
    .grid-preview-box { flex: 1; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px; background: #ffffff; }
  </style>
</head>
<body>
  <div class="worksheet-page" style="height: 10.36in;">
    <div>
      <div class="key-header" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h1 style="font-size:12pt; margin:0; font-weight:900; letter-spacing:0.5px;">TEACHER MASTER KEY &amp; GRADING RUBRIC</h1>
          <p style="margin:0; font-size:8pt; color:#94a3b8;">Constant Speed Story: Dual-Graph Edition &bull; Day 15 Performance Task</p>
        </div>
        <div>
          <span class="key-badge">TEACHER REFERENCE KEY</span>
        </div>
      </div>

      <!-- Rubric Summary -->
      <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:5px; padding:6px 10px; font-size:8pt; margin-bottom:8px;">
        <strong style="color:#0f172a; text-transform:uppercase;">📊 10-Point Holistic Grading Rubric:</strong>
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:6px; margin-top:4px;">
          <div style="background:#fff; border:1px solid #cbd5e1; padding:4px; border-radius:3px;">
            <strong>1. Illustration (2 pts):</strong> Clear moving object, origin (0,0) labeled, motion direction vector arrow.
          </div>
          <div style="background:#fff; border:1px solid #cbd5e1; padding:4px; border-radius:3px;">
            <strong>2. Word Problem (2 pts):</strong> Authentic constant-speed story stating 2 knowns with units and 1 clear target unknown.
          </div>
          <div style="background:#fff; border:1px solid #cbd5e1; padding:4px; border-radius:3px;">
            <strong>3. GUESS Proof (3 pts):</strong> G, U, E, S, S completely filled out, algebra correct, final answer boxed with units.
          </div>
          <div style="background:#fff; border:1px solid #cbd5e1; padding:4px; border-radius:3px;">
            <strong>4. Dual Graphs (3 pts):</strong> Calibrated axes, straight line on x-t (slope = v), horizontal line on v-t (area = d).
          </div>
        </div>
      </div>

      <!-- Worked Exemplar -->
      <div class="exemplar-box">
        <div style="font-weight:800; color:#0284c7; font-size:9pt; margin-bottom:4px; text-transform:uppercase;">
          🌟 Complete Student Work Exemplar: "The Mars Rover Traverse"
        </div>
        
        <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:10px; font-size:8pt;">
          <div>
            <p style="margin:0 0 4px 0;"><strong>Student Story / Problem:</strong><br>
            <em>"NASA's autonomous Mars Recon Rover drives across the flat plains of Jezero Crater at a steady speed of <strong>15.0 m/s</strong> for a total time of <strong>40.0 seconds</strong>. How many meters of Martian terrain does the rover cross before its next sensor scan?"</em></p>
            
            <p style="margin:0 0 2px 0;"><strong>Complete GUESS Mathematical Proof:</strong></p>
            <table style="width:100%; border-collapse:collapse; font-size:7.5pt; background:#fff; border:1px solid #cbd5e1;">
              <tr><td style="padding:2px 4px; border:1px solid #e2e8f0; font-weight:bold; width:20px;">G</td><td style="padding:2px 4px; border:1px solid #e2e8f0;">Speed v = 15.0 m/s &bull; Time t = 40.0 s</td></tr>
              <tr><td style="padding:2px 4px; border:1px solid #e2e8f0; font-weight:bold;">U</td><td style="padding:2px 4px; border:1px solid #e2e8f0;">Distance d = ? meters</td></tr>
              <tr><td style="padding:2px 4px; border:1px solid #e2e8f0; font-weight:bold;">E</td><td style="padding:2px 4px; border:1px solid #e2e8f0;">d = v &bull; t</td></tr>
              <tr><td style="padding:2px 4px; border:1px solid #e2e8f0; font-weight:bold;">S</td><td style="padding:2px 4px; border:1px solid #e2e8f0;">d = (15.0 m/s) &bull; (40.0 s)</td></tr>
              <tr><td style="padding:2px 4px; border:1px solid #e2e8f0; font-weight:bold;">S</td><td style="padding:2px 4px; border:1px solid #e2e8f0; font-weight:bold; color:#0369a1;">d = 600 meters [Boxed]</td></tr>
            </table>
          </div>

          <div>
            <p style="margin:0 0 2px 0;"><strong>Scale Planning Choices:</strong></p>
            <ul style="margin:0; padding-left:14px; font-size:7.5pt; line-height:1.4;">
              <li><strong>Time (Horizontal):</strong> 10 blocks = 50 s (5 s per block). Point plotted at t = 40 s (8th line).</li>
              <li><strong>Position x (Graph 1):</strong> 8 blocks = 800 m (100 m per block). Plotted from (0, 0) to (40, 600).</li>
              <li><strong>Velocity v (Graph 2):</strong> 6 blocks = 30 m/s (5 m/s per block). Horizontal line at v = 15 m/s (3rd line).</li>
            </ul>

            <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:4px 6px; border-radius:3px; margin-top:5px; font-size:7.5pt;">
              <strong>Synthesis Answers:</strong><br>
              1. Slope = <strong>velocity / speed</strong> (600m / 40s = 15 m/s).<br>
              2. Area = <strong>distance / displacement</strong> (15 m/s &times; 40 s = 600 m).<br>
              3. If 2&times; speed: Slope doubles (steeper line); Area doubles (box is twice as tall = 1,200 m).
            </div>
          </div>
        </div>

        <div class="grid-preview">
          <div class="grid-preview-box">
            <strong style="color:#0369a1; font-size:8pt;">Graph 1: x vs. t Visual Check</strong>
            <div style="font-size:7.2pt; color:#475569; margin-top:2px;">
              • Line MUST be straight (not curved).<br>
              • Starts at origin (0, 0) and ends at (40 s, 600 m).<br>
              • Slope = Rise / Run = 600 / 40 = <strong>15.0 m/s</strong>.
            </div>
          </div>
          <div class="grid-preview-box">
            <strong style="color:#0369a1; font-size:8pt;">Graph 2: v vs. t Visual Check</strong>
            <div style="font-size:7.2pt; color:#475569; margin-top:2px;">
              • Line MUST be perfectly horizontal at height v = 15 m/s.<br>
              • Extends from t = 0 to t = 40 s.<br>
              • Shaded Rectangle Area = 15 m/s &times; 40 s = <strong>600 m</strong>.
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Feedback Reminders -->
      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:5px; padding:6px 10px; font-size:7.8pt;">
        <strong style="color:#0f172a;">Common Student Pitfalls to Watch For:</strong>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:3px; color:#475569;">
          <div>&bull; <em>Curved Lines:</em> Students drawing curves instead of straight lines (constant speed = linear x-t, horizontal v-t).</div>
          <div>&bull; <em>Slanted v-t line:</em> Students drawing a sloped line on v-t (remind: sloped v-t means accelerating!).</div>
          <div>&bull; <em>Unit Dropping:</em> Forgetting units on Givens or final answer (e.g. writing "600" instead of "600 m").</div>
          <div>&bull; <em>Misaligned Time Scale:</em> Using different time scales on Graph 1 and Graph 2. They should align!</div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Orange High School &bull; Physics Department</span>
      <span>Teacher Master Key &bull; Constant Speed Dual-Graph Story</span>
      <span>Teacher: Mr. Mudry</span>
    </div>
  </div>
</body>
</html>
  `;
}

async function compileWorksheets() {
  console.log('🚀 Compiling Constant Speed Dual-Graph Story Worksheets...');
  const outDir = path.join(__dirname, '..', 'Unit_2', 'worksheets');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const studentHtml = renderStudentWorksheet();
  const studentHtmlPath = path.join(outDir, 'Constant_Speed_Dual_Graph_Story.html');
  const studentPdfPath = path.join(outDir, 'Constant_Speed_Dual_Graph_Story.pdf');
  fs.writeFileSync(studentHtmlPath, studentHtml, 'utf8');

  const keyHtml = renderTeacherMasterKey();
  const keyHtmlPath = path.join(outDir, 'Teacher_Master_Key_Dual_Graph_Story.html');
  const keyPdfPath = path.join(outDir, 'Teacher_Master_Key_Dual_Graph_Story.pdf');
  fs.writeFileSync(keyHtmlPath, keyHtml, 'utf8');

  console.log('⏳ Launching Puppeteer to render PDFs...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Generate Student PDF (2 pages)
  await page.goto('file://' + studentHtmlPath, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: studentPdfPath,
    format: 'letter',
    printBackground: true,
    margin: { top: '0.32in', right: '0.42in', bottom: '0.32in', left: '0.42in' }
  });
  console.log(`✅ Generated Student Worksheet PDF: ${studentPdfPath}`);

  // 2. Generate Teacher Key PDF (1 page)
  await page.goto('file://' + keyHtmlPath, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: keyPdfPath,
    format: 'letter',
    printBackground: true,
    margin: { top: '0.32in', right: '0.42in', bottom: '0.32in', left: '0.42in' }
  });
  console.log(`✅ Generated Teacher Master Key PDF: ${keyPdfPath}`);

  await browser.close();
  console.log('🎉 Both PDFs successfully compiled!');
}

compileWorksheets().catch(err => {
  console.error('Fatal compilation error:', err);
  process.exit(1);
});

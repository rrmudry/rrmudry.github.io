/**
 * Generates Constant Speed Story: 3-Stage Dual-Graph Edition (x-t & v-t)
 * Unit 2: Kinematics — Day 15 (Friday, Sep 18, 2026)
 * 
 * Direct alignment with the Dual-Graph Studio (Level 3: Slope to Velocity):
 * - Motion is broken into 3 distinct sections across 10 seconds (e.g. forward, stopped, reverse)
 * - Page 1 (Front): 3-Stage Scenario Drawing, 3-Stage Narrative Prompts, and 3-Stage Motion & GUESS Analysis Table
 * - Page 2 (Back): Aligned 10s Position-Time Graph (-2m to 18m) with 3 slope proofs,
 *                  and 10s Velocity-Time Graph (-4 to +6 m/s) with 3 shaded area proofs
 * - Strict Letter portrait CSS (10.36in, zero overflow, prints on a single 2-sided sheet)
 * - Teacher Master Key with 10-pt rubric and complete worked exemplar matching Studio Scenario 1
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Generates an authentic Dual-Graph Studio Coordinate Grid for Student Worksheet
function generateStudioGridSVG({
  width = 690,
  height = 195,
  marginLeft = 52,
  marginBottom = 30,
  marginRight = 18,
  marginTop = 16,
  xMin = 0,
  xMax = 10,
  xStep = 1,
  yMin = -2,
  yMax = 18,
  yStep = 2,
  xLabel = "Time (seconds)",
  yLabel = "Position x (meters)",
  title = "Graph 1: Position vs. Time (x vs. t)",
  isVelocity = false,
  titleAnchor = "end",
  showNumbers = true
}) {
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;

  const toPxX = (val) => marginLeft + ((val - xMin) / xRange) * plotWidth;
  const toPxY = (val) => marginTop + plotHeight - ((val - yMin) / yRange) * plotHeight;

  let gridLines = '';

  // Minor vertical grid lines (midpoint between major divisions)
  for (let t = xMin + xStep / 2; t < xMax; t += xStep) {
    const px = toPxX(t);
    gridLines += `<line x1="${px.toFixed(1)}" y1="${marginTop}" x2="${px.toFixed(1)}" y2="${marginTop + plotHeight}" stroke="#f1f5f9" stroke-width="0.75" />\n`;
  }

  // Minor horizontal grid lines (midpoint between major divisions)
  for (let y = yMin + yStep / 2; y < yMax; y += yStep) {
    const py = toPxY(y);
    gridLines += `<line x1="${marginLeft}" y1="${py.toFixed(1)}" x2="${marginLeft + plotWidth}" y2="${py.toFixed(1)}" stroke="#f1f5f9" stroke-width="0.75" />\n`;
  }

  // Zero axis baseline position
  const zeroY = toPxY(0);

  // Major vertical grid lines (every 1 division)
  for (let t = xMin; t <= xMax; t += xStep) {
    const px = toPxX(t);
    gridLines += `<line x1="${px.toFixed(1)}" y1="${marginTop}" x2="${px.toFixed(1)}" y2="${marginTop + plotHeight}" stroke="#cbd5e1" stroke-width="1.1" />\n`;
    // Tick mark below the bottom axis (6px long for student write-in)
    gridLines += `<line x1="${px.toFixed(1)}" y1="${marginTop + plotHeight}" x2="${px.toFixed(1)}" y2="${marginTop + plotHeight + 6}" stroke="#0f172a" stroke-width="1.6" />\n`;

    // If velocity graph and center zero line exists, also draw ticks across the zero line
    if (isVelocity && zeroY >= marginTop && zeroY <= marginTop + plotHeight) {
      gridLines += `<line x1="${px.toFixed(1)}" y1="${(zeroY - 4).toFixed(1)}" x2="${px.toFixed(1)}" y2="${(zeroY + 4).toFixed(1)}" stroke="#0f172a" stroke-width="1.4" />\n`;
    }

    // Number label (ONLY if showNumbers is true!)
    if (showNumbers) {
      gridLines += `<text x="${px.toFixed(1)}" y="${marginTop + plotHeight + 14}" font-size="8.5" font-family="'Inter', sans-serif" font-weight="700" fill="#334155" text-anchor="middle">${t}s</text>\n`;
    }
  }

  // Major horizontal grid lines
  for (let y = yMin; y <= yMax; y += yStep) {
    const py = toPxY(y);
    const isZero = (y === 0);
    const strokeColor = isZero ? '#0f172a' : '#cbd5e1';
    const strokeWidth = isZero ? '2.0' : '1.1';

    gridLines += `<line x1="${marginLeft}" y1="${py.toFixed(1)}" x2="${marginLeft + plotWidth}" y2="${py.toFixed(1)}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />\n`;
    // Tick mark on left axis (6px long for student write-in)
    gridLines += `<line x1="${marginLeft - 6}" y1="${py.toFixed(1)}" x2="${marginLeft}" y2="${py.toFixed(1)}" stroke="#0f172a" stroke-width="1.6" />\n`;

    // Number label (ONLY if showNumbers is true!)
    if (showNumbers) {
      const fontWeight = isZero ? '800' : '600';
      const fillColor = isZero ? '#0f172a' : '#475569';
      gridLines += `<text x="${marginLeft - 8}" y="${(py + 3).toFixed(1)}" font-size="8.5" font-family="'Inter', sans-serif" font-weight="${fontWeight}" fill="${fillColor}" text-anchor="end">${y}</text>\n`;
    }
  }

  // Zero axis baseline highlight (for velocity center line)
  const zeroAxisHighlight = (zeroY >= marginTop && zeroY <= marginTop + plotHeight)
    ? `<line x1="${marginLeft}" y1="${zeroY.toFixed(1)}" x2="${marginLeft + plotWidth}" y2="${zeroY.toFixed(1)}" stroke="#0f172a" stroke-width="2.2" />\n`
    : '';

  // Bottom baseline highlight (for position-time graph)
  const bottomAxisHighlight = (!isVelocity)
    ? `<line x1="${marginLeft}" y1="${marginTop + plotHeight}" x2="${marginLeft + plotWidth}" y2="${marginTop + plotHeight}" stroke="#0f172a" stroke-width="2.0" />\n`
    : '';

  const titleX = (titleAnchor === 'start') ? (marginLeft + 6) : (marginLeft + plotWidth - 4);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="plot-grid-svg">
      <rect x="${marginLeft}" y="${marginTop}" width="${plotWidth}" height="${plotHeight}" fill="#ffffff" stroke="#64748b" stroke-width="1.2" />
      ${gridLines}
      ${zeroAxisHighlight}
      ${bottomAxisHighlight}
      <!-- Left Y-Axis line -->
      <line x1="${marginLeft}" y1="${marginTop}" x2="${marginLeft}" y2="${marginTop + plotHeight}" stroke="#0f172a" stroke-width="2.0" />
      
      <!-- Axis Labels -->
      <text x="${marginLeft + plotWidth / 2}" y="${height - 4}" font-size="9.5" font-family="'Inter', sans-serif" font-weight="700" fill="#0f172a" text-anchor="middle">${xLabel}</text>
      <text transform="rotate(-90)" x="${-(marginTop + plotHeight / 2)}" y="14" font-size="9.5" font-family="'Inter', sans-serif" font-weight="700" fill="#0f172a" text-anchor="middle">${yLabel}</text>
      
      <!-- Title Badge -->
      <text x="${titleX}" y="${marginTop + 11}" font-size="9.2" font-family="'Inter', sans-serif" font-weight="800" fill="#0284c7" text-anchor="${titleAnchor}">${title}</text>
    </svg>
  `;
}

// Generates Exemplar Plot 1 (Position vs. Time) with 3 colored sections and slope triangle
function generateExemplarPlot1SVG() {
  const width = 690, height = 185;
  const marginLeft = 52, marginBottom = 28, marginRight = 18, marginTop = 16;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const toPxX = (t) => marginLeft + (t / 10) * plotWidth;
  const toPxY = (x) => marginTop + plotHeight - ((x - (-2)) / 20) * plotHeight;

  const p0 = { x: toPxX(0), y: toPxY(14) };
  const p1 = { x: toPxX(3), y: toPxY(2) };
  const p2 = { x: toPxX(6), y: toPxY(2) };
  const p3 = { x: toPxX(10), y: toPxY(14) };

  // Base grid
  const baseGrid = generateStudioGridSVG({
    width, height, marginLeft, marginBottom, marginRight, marginTop,
    xMin: 0, xMax: 10, xStep: 1,
    yMin: -2, yMax: 18, yStep: 2,
    xLabel: "Time (seconds)",
    yLabel: "Position x (meters)",
    title: "Graph 1: Position vs. Time (x vs. t) — 3 Motion Sections"
  });

  // Overlay trajectories and slope triangle for Section 1
  const overlay = `
    <!-- Section 1 Shading Highlight (0s - 3s) -->
    <rect x="${toPxX(0)}" y="${marginTop}" width="${toPxX(3) - toPxX(0)}" height="${plotHeight}" fill="#f43f5e" opacity="0.08" />

    <!-- Section 1 Slope Triangle (0s-3s) -->
    <line x1="${p0.x}" y1="${p0.y}" x2="${p1.x}" y2="${p0.y}" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="3 3" />
    <line x1="${p1.x}" y1="${p0.y}" x2="${p1.x}" y2="${p1.y}" stroke="#e11d48" stroke-width="1.8" stroke-dasharray="3 3" />
    <text x="${(p0.x + p1.x) / 2}" y="${p0.y - 4}" font-size="8.5" font-family="'Inter', sans-serif" font-weight="700" fill="#0284c7" text-anchor="middle">&Delta;t = 3s</text>
    <text x="${p1.x + 5}" y="${(p0.y + p1.y) / 2 + 3}" font-size="8.5" font-family="'Inter', sans-serif" font-weight="700" fill="#e11d48" text-anchor="start">&Delta;x = -12m</text>

    <!-- Trajectory Line 1: 0-3s Reverse (Rose) -->
    <line x1="${p0.x}" y1="${p0.y}" x2="${p1.x}" y2="${p1.y}" stroke="#e11d48" stroke-width="3.2" stroke-linecap="round" />
    <!-- Trajectory Line 2: 3-6s Stopped (Amber) -->
    <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#d97706" stroke-width="3.2" stroke-linecap="round" />
    <!-- Trajectory Line 3: 6-10s Forward (Cyan/Blue) -->
    <line x1="${p2.x}" y1="${p2.y}" x2="${p3.x}" y2="${p3.y}" stroke="#0284c7" stroke-width="3.2" stroke-linecap="round" />

    <!-- Waypoint Nodes -->
    <circle cx="${p0.x}" cy="${p0.y}" r="4.5" fill="#e11d48" stroke="#ffffff" stroke-width="1.5" />
    <text x="${p0.x + 8}" y="${p0.y + 12}" font-size="8" font-family="'Inter', sans-serif" font-weight="800" fill="#e11d48">(0s, 14m)</text>

    <circle cx="${p1.x}" cy="${p1.y}" r="4.5" fill="#d97706" stroke="#ffffff" stroke-width="1.5" />
    <text x="${p1.x - 6}" y="${p1.y - 7}" font-size="8" font-family="'Inter', sans-serif" font-weight="800" fill="#d97706" text-anchor="end">(3s, 2m)</text>

    <circle cx="${p2.x}" cy="${p2.y}" r="4.5" fill="#d97706" stroke="#ffffff" stroke-width="1.5" />
    <text x="${p2.x + 6}" y="${p2.y - 7}" font-size="8" font-family="'Inter', sans-serif" font-weight="800" fill="#d97706">(6s, 2m)</text>

    <circle cx="${p3.x}" cy="${p3.y}" r="4.5" fill="#0284c7" stroke="#ffffff" stroke-width="1.5" />
    <text x="${p3.x - 8}" y="${p3.y - 6}" font-size="8" font-family="'Inter', sans-serif" font-weight="800" fill="#0284c7" text-anchor="end">(10s, 14m)</text>

    <!-- Labels on line segments -->
    <rect x="${(p0.x + p1.x)/2 - 38}" y="${(p0.y + p1.y)/2 + 6}" width="76" height="13" rx="2" fill="#ffffff" stroke="#e11d48" stroke-width="0.8" />
    <text x="${(p0.x + p1.x)/2}" y="${(p0.y + p1.y)/2 + 16}" font-size="7.5" font-family="'Inter', sans-serif" font-weight="800" fill="#e11d48" text-anchor="middle">Sec 1: m = -4 m/s</text>

    <rect x="${(p1.x + p2.x)/2 - 34}" y="${p1.y + 5}" width="68" height="13" rx="2" fill="#ffffff" stroke="#d97706" stroke-width="0.8" />
    <text x="${(p1.x + p2.x)/2}" y="${p1.y + 15}" font-size="7.5" font-family="'Inter', sans-serif" font-weight="800" fill="#d97706" text-anchor="middle">Sec 2: m = 0 m/s</text>

    <rect x="${(p2.x + p3.x)/2 - 38}" y="${(p2.y + p3.y)/2 - 18}" width="76" height="13" rx="2" fill="#ffffff" stroke="#0284c7" stroke-width="0.8" />
    <text x="${(p2.x + p3.x)/2}" y="${(p2.y + p3.y)/2 - 8}" font-size="7.5" font-family="'Inter', sans-serif" font-weight="800" fill="#0284c7" text-anchor="middle">Sec 3: m = +3 m/s</text>
  `;

  return baseGrid.replace('</svg>', `${overlay}</svg>`);
}

// Generates Exemplar Plot 2 (Velocity vs. Time) with 3 horizontal bars and shaded areas
function generateExemplarPlot2SVG() {
  const width = 690, height = 165;
  const marginLeft = 52, marginBottom = 28, marginRight = 18, marginTop = 16;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const toPxX = (t) => marginLeft + (t / 10) * plotWidth;
  const toPxY = (v) => marginTop + plotHeight - ((v - (-4)) / 10) * plotHeight;

  const zeroY = toPxY(0);

  // Base grid
  const baseGrid = generateStudioGridSVG({
    width, height, marginLeft, marginBottom, marginRight, marginTop,
    xMin: 0, xMax: 10, xStep: 1,
    yMin: -4, yMax: 6, yStep: 2,
    xLabel: "Time (seconds)",
    yLabel: "Velocity v (m/s)",
    title: "Graph 2: Velocity vs. Time (v vs. t) — Shaded Displacement Areas",
    isVelocity: true,
    titleAnchor: "start"
  });

  const overlay = `
    <!-- Section 1 Area Rectangle (-4 m/s for 3s = -12m) -->
    <rect x="${toPxX(0)}" y="${zeroY}" width="${toPxX(3) - toPxX(0)}" height="${toPxY(-4) - zeroY}" fill="#f43f5e" opacity="0.22" />
    <line x1="${toPxX(0)}" y1="${toPxY(-4)}" x2="${toPxX(3)}" y2="${toPxY(-4)}" stroke="#e11d48" stroke-width="3.2" stroke-linecap="round" />
    <text x="${(toPxX(0) + toPxX(3)) / 2}" y="${(zeroY + toPxY(-4)) / 2 + 3}" font-size="8.5" font-family="'Inter', sans-serif" font-weight="800" fill="#9f1239" text-anchor="middle">Area 1 = -12 m</text>

    <!-- Section 2 Line (0 m/s for 3s = 0m) -->
    <line x1="${toPxX(3)}" y1="${zeroY}" x2="${toPxX(6)}" y2="${zeroY}" stroke="#d97706" stroke-width="4" stroke-linecap="round" />
    <text x="${(toPxX(3) + toPxX(6)) / 2}" y="${zeroY - 5}" font-size="8" font-family="'Inter', sans-serif" font-weight="800" fill="#b45309" text-anchor="middle">Area 2 = 0 m (Stopped)</text>

    <!-- Section 3 Area Rectangle (+3 m/s for 4s = +12m) -->
    <rect x="${toPxX(6)}" y="${toPxY(3)}" width="${toPxX(10) - toPxX(6)}" height="${zeroY - toPxY(3)}" fill="#0284c7" opacity="0.20" />
    <line x1="${toPxX(6)}" y1="${toPxY(3)}" x2="${toPxX(10)}" y2="${toPxY(3)}" stroke="#0284c7" stroke-width="3.2" stroke-linecap="round" />
    <text x="${(toPxX(6) + toPxX(10)) / 2}" y="${(zeroY + toPxY(3)) / 2 + 3}" font-size="8.5" font-family="'Inter', sans-serif" font-weight="800" fill="#0369a1" text-anchor="middle">Area 3 = +12 m</text>

    <!-- Vertical dashed connection steps -->
    <line x1="${toPxX(3)}" y1="${toPxY(-4)}" x2="${toPxX(3)}" y2="${zeroY}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2 2" />
    <line x1="${toPxX(6)}" y1="${zeroY}" x2="${toPxX(6)}" y2="${toPxY(3)}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2 2" />

    <!-- Net Displacement Summary Callout -->
    <rect x="${width - 240}" y="${marginTop + 2}" width="220" height="15" rx="3" fill="#f8fafc" stroke="#0f172a" stroke-width="1" />
    <text x="${width - 130}" y="${marginTop + 13}" font-size="8" font-family="'Inter', sans-serif" font-weight="800" fill="#0f172a" text-anchor="middle">Total Net Area = (-12) + (0) + (+12) = 0 m</text>
  `;

  return baseGrid.replace('</svg>', `${overlay}</svg>`);
}

// Strict Print CSS
const printCss = `
  @page {
    size: letter portrait;
    margin: 0.30in 0.38in 0.30in 0.38in;
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
    line-height: 1.22;
    font-size: 8.2pt;
  }

  .worksheet-page {
    width: 100%;
    height: 10.40in;
    max-height: 10.40in;
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
    padding-bottom: 3px;
    margin-bottom: 5px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .header-titles h1 {
    font-size: 12.5pt;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 1px 0;
    text-transform: uppercase;
    letter-spacing: -0.3px;
  }

  .header-titles .sub {
    font-size: 7.5pt;
    font-weight: 700;
    color: #0284c7;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .header-meta {
    font-size: 7.8pt;
    text-align: right;
  }

  .student-fields {
    display: flex;
    gap: 10px;
    margin-top: 2px;
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
    padding: 4px 7px;
    font-size: 7.8pt;
    color: #1e293b;
    margin-bottom: 5px;
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
    border-radius: 4px;
    padding: 5px 7px;
    margin-bottom: 5px;
    background: #ffffff;
  }

  .section-header {
    font-weight: 800;
    color: #0f172a;
    font-size: 8.2pt;
    text-transform: uppercase;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 2px;
    margin-bottom: 3px;
  }

  .section-desc {
    font-size: 7.2pt;
    color: #64748b;
    font-weight: normal;
    text-transform: none;
  }

  /* Drawing Box */
  .drawing-box {
    border: 1.5px dashed #94a3b8;
    border-radius: 4px;
    height: 140px;
    background: #fafafa;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .drawing-watermark {
    font-size: 7.5pt;
    color: #94a3b8;
    font-style: italic;
    text-align: center;
    pointer-events: none;
    line-height: 1.35;
  }

  /* 3-Section Story Grid */
  .story-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
    margin-top: 3px;
  }

  .story-sec-box {
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 4px 6px;
    background: #f8fafc;
  }

  .story-sec-title {
    font-weight: 800;
    font-size: 7.5pt;
    color: #0f172a;
    margin-bottom: 3px;
    display: flex;
    justify-content: space-between;
  }

  .story-lines {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
  }

  .story-line {
    border-bottom: 1px dashed #94a3b8;
    height: 14px;
    width: 100%;
  }

  /* Motion Table */
  .motion-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.8pt;
  }

  .motion-table th {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 800;
    padding: 3.5px 4px;
    border: 1px solid #cbd5e1;
    text-align: center;
  }

  .motion-table td {
    padding: 3px 4px;
    border: 1px solid #cbd5e1;
    vertical-align: middle;
  }

  .col-label {
    font-weight: 700;
    color: #1e293b;
    background: #f8fafc;
    width: 140px;
  }

  .blank-write {
    display: inline-block;
    border-bottom: 1px solid #475569;
    min-width: 60px;
  }

  /* 3-Column Calculation Strips */
  .strip-3-col {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 5px;
    margin-top: 3px;
    margin-bottom: 4px;
  }

  .strip-box {
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 3.5px 6px;
    background: #f8fafc;
    font-size: 7.5pt;
  }

  .strip-box strong {
    color: #0f172a;
  }

  /* Scale Planner Banner */
  .scale-planner-banner {
    background: #f8fafc;
    border: 1.2px solid #cbd5e1;
    border-radius: 4px;
    padding: 3px 8px;
    margin-bottom: 4px;
    font-size: 7.5pt;
  }

  .scale-planner-grid {
    display: grid;
    grid-template-columns: 1.15fr 1fr 1fr;
    gap: 8px;
    margin-top: 2px;
    font-size: 7.4pt;
  }

  /* Footer */
  .footer-bar {
    border-top: 1px solid #cbd5e1;
    padding-top: 2px;
    font-size: 7pt;
    color: #64748b;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

function renderStudentWorksheet() {
  const grid1 = generateStudioGridSVG({
    width: 690,
    height: 185,
    marginLeft: 52,
    marginBottom: 28,
    marginRight: 18,
    marginTop: 16,
    xMin: 0,
    xMax: 10,
    xStep: 1,
    yMin: 0,
    yMax: 10,
    yStep: 1,
    xLabel: "Time t (seconds)",
    yLabel: "Position x (meters)",
    title: "Graph 1: Position vs. Time (x vs. t) — 10-Division Grid (Label Axes & Plot Segments)",
    showNumbers: false
  });

  const grid2 = generateStudioGridSVG({
    width: 690,
    height: 165,
    marginLeft: 52,
    marginBottom: 28,
    marginRight: 18,
    marginTop: 16,
    xMin: 0,
    xMax: 10,
    xStep: 1,
    yMin: -4,
    yMax: 4,
    yStep: 1,
    xLabel: "Time t (seconds)",
    yLabel: "Velocity v (m/s)",
    title: "Graph 2: Velocity vs. Time (v vs. t) — Center Line is v = 0 (Label Axes & Draw Bars)",
    isVelocity: true,
    showNumbers: false
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Constant Speed Story: 3-Stage Dual-Graph Edition</title>
  <style>${printCss}</style>
</head>
<body>

  <!-- ============================================================ -->
  <!-- PAGE 1 (FRONT): 3-STAGE NARRATIVE & GUESS MOTION TABLE       -->
  <!-- ============================================================ -->
  <div class="worksheet-page">
    <div>
      <!-- Header -->
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Constant Speed Story: 3-Stage Dual-Graph Edition</h1>
          <p class="sub">Unit 2: Kinematics &bull; 3-Stage Journey Modeling &bull; Day 15 Performance Task</p>
        </div>
        <div class="header-meta">
          <div class="student-fields">
            <div><span class="field-label">Name:</span> <span class="field-line" style="min-width:160px;"></span></div>
            <div><span class="field-label">Period:</span> <span class="field-line" style="min-width:35px;"></span></div>
            <div><span class="field-label">Date:</span> <span class="field-line" style="min-width:65px;"></span></div>
          </div>
          <div class="score-box">SCORE: _____ / 10 pts</div>
        </div>
      </div>

      <!-- Task Directive -->
      <div class="task-banner">
        <span>✏️ <strong>Mission:</strong> Invent an original character/vehicle journey across <strong>3 distinct motion sections</strong> (like the Dual-Graph Studio). Illustrate the scene, author your narrative, and calculate the velocities in the table. On the back, calibrate your axis scales and prove your math with both graphs!</span>
        <span class="badge badge-blue">HS-PS2-1 • Performance Task</span>
      </div>

      <!-- Part 1: Scenario Illustration -->
      <div class="section-card">
        <div class="section-header">
          <span>Part 1: 3-Stage Journey Illustration</span>
          <span class="section-desc">Sketch the object, path of motion, origin (x = 0m), pause/turning point, and final point</span>
        </div>
        <div class="drawing-box">
          <div class="drawing-watermark">
            [ Draw your character, vehicle, drone, rover, or athlete traveling across 3 distinct stages ]<br>
            Label: Starting Reference Point (x₀) &bull; Section 1 Path (&rarr; or &larr;) &bull; Section 2 Stop/Action Point &bull; Section 3 Final Destination
          </div>
        </div>
      </div>

      <!-- Part 2: 3-Section Story Narrative -->
      <div class="section-card">
        <div class="section-header">
          <span>Part 2: Original 3-Section Motion Narrative</span>
          <span class="section-desc">Describe what occurs in each phase of your object's motion:</span>
        </div>
        <div class="story-grid-3">
          <div class="story-sec-box">
            <div class="story-sec-title">
              <span>Section 1 (0s to t₁)</span>
              <span style="color:#e11d48;">Initial Motion</span>
            </div>
            <div style="font-size:7pt; color:#64748b;">Starts at x = <span class="blank-write" style="min-width:25px;"></span>m, travels to x = <span class="blank-write" style="min-width:25px;"></span>m:</div>
            <div class="story-lines">
              <div class="story-line"></div>
              <div class="story-line"></div>
              <div class="story-line"></div>
            </div>
          </div>

          <div class="story-sec-box">
            <div class="story-sec-title">
              <span>Section 2 (t₁ to t₂)</span>
              <span style="color:#d97706;">Mid-Course Action</span>
            </div>
            <div style="font-size:7pt; color:#64748b;">Action (e.g. stopped/waiting/steady):</div>
            <div class="story-lines">
              <div class="story-line"></div>
              <div class="story-line"></div>
              <div class="story-line"></div>
            </div>
          </div>

          <div class="story-sec-box">
            <div class="story-sec-title">
              <span>Section 3 (t₂ to t_final)</span>
              <span style="color:#0284c7;">Final Stretch</span>
            </div>
            <div style="font-size:7pt; color:#64748b;">Travels from x = <span class="blank-write" style="min-width:20px;"></span>m to x = <span class="blank-write" style="min-width:20px;"></span>m:</div>
            <div class="story-lines">
              <div class="story-line"></div>
              <div class="story-line"></div>
              <div class="story-line"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Part 3: Motion Data & GUESS Proof Table -->
      <div class="section-card">
        <div class="section-header">
          <span>Part 3: 3-Stage Motion Breakdown &amp; G.U.E.S.S. Mathematical Proof</span>
          <span class="section-desc">Compute displacement (&Delta;x) and velocity (v = &Delta;x / &Delta;t) for each section</span>
        </div>
        <table class="motion-table">
          <thead>
            <tr>
              <th class="col-label" style="text-align:left;">Measurement / Step</th>
              <th style="width:23%; color:#e11d48;">Section 1</th>
              <th style="width:23%; color:#d97706;">Section 2</th>
              <th style="width:23%; color:#0284c7;">Section 3</th>
              <th style="width:19%; background:#e2e8f0;">Whole Trip (Total)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="col-label"><strong>Time Interval (&Delta;t)</strong><br><span style="font-size:6.8pt; color:#64748b;">&Delta;t = t_final &minus; t_initial</span></td>
              <td>From <span class="blank-write" style="min-width:18px;"></span>s to <span class="blank-write" style="min-width:18px;"></span>s<br><strong>&Delta;t₁ = <span class="blank-write" style="min-width:25px;"></span> s</strong></td>
              <td>From <span class="blank-write" style="min-width:18px;"></span>s to <span class="blank-write" style="min-width:18px;"></span>s<br><strong>&Delta;t₂ = <span class="blank-write" style="min-width:25px;"></span> s</strong></td>
              <td>From <span class="blank-write" style="min-width:18px;"></span>s to <span class="blank-write" style="min-width:18px;"></span>s<br><strong>&Delta;t₃ = <span class="blank-write" style="min-width:25px;"></span> s</strong></td>
              <td style="background:#f8fafc; font-weight:800; text-align:center;">&Delta;t_total = <strong><span class="blank-write" style="min-width:28px;"></span> s</strong></td>
            </tr>
            <tr>
              <td class="col-label"><strong>Position Coordinates</strong><br><span style="font-size:6.8pt; color:#64748b;">Initial (x_i) &rarr; Final (x_f)</span></td>
              <td>x_i = <span class="blank-write" style="min-width:20px;"></span> m<br>x_f = <span class="blank-write" style="min-width:20px;"></span> m</td>
              <td>x_i = <span class="blank-write" style="min-width:20px;"></span> m<br>x_f = <span class="blank-write" style="min-width:20px;"></span> m</td>
              <td>x_i = <span class="blank-write" style="min-width:20px;"></span> m<br>x_f = <span class="blank-write" style="min-width:20px;"></span> m</td>
              <td style="background:#f8fafc; font-size:7pt;">Start x₀ = <span class="blank-write" style="min-width:22px;"></span> m<br>Final x_end = <span class="blank-write" style="min-width:22px;"></span> m</td>
            </tr>
            <tr>
              <td class="col-label"><strong>Displacement (&Delta;x)</strong><br><span style="font-size:6.8pt; color:#64748b;">&Delta;x = x_f &minus; x_i (include + / &minus;)</span></td>
              <td><strong>&Delta;x₁ = <span class="blank-write" style="min-width:35px;"></span> m</strong></td>
              <td><strong>&Delta;x₂ = <span class="blank-write" style="min-width:35px;"></span> m</strong></td>
              <td><strong>&Delta;x₃ = <span class="blank-write" style="min-width:35px;"></span> m</strong></td>
              <td style="background:#f8fafc; font-weight:800; font-size:7.2pt;">Net &Delta;x = <span class="blank-write" style="min-width:30px;"></span> m</td>
            </tr>
            <tr>
              <td class="col-label"><strong>Direction of Motion</strong></td>
              <td><label><input type="checkbox"> Forward (+)</label><br><label><input type="checkbox"> Stopped (0)</label><br><label><input type="checkbox"> Backward (&minus;)</label></td>
              <td><label><input type="checkbox"> Forward (+)</label><br><label><input type="checkbox"> Stopped (0)</label><br><label><input type="checkbox"> Backward (&minus;)</label></td>
              <td><label><input type="checkbox"> Forward (+)</label><br><label><input type="checkbox"> Stopped (0)</label><br><label><input type="checkbox"> Backward (&minus;)</label></td>
              <td style="background:#f8fafc; font-size:7pt;">Total Distance:<br><strong>d_total = <span class="blank-write" style="min-width:30px;"></span> m</strong></td>
            </tr>
            <tr>
              <td class="col-label"><strong>G.U.E.S.S. Velocity Formula</strong><br><span style="font-size:6.8pt; color:#64748b;">v = &Delta;x / &Delta;t (Substitute &amp; Solve)</span></td>
              <td>v₁ = <span class="blank-write" style="min-width:25px;"></span>m / <span class="blank-write" style="min-width:20px;"></span>s<br><strong>v₁ = <span class="blank-write" style="min-width:35px;"></span> m/s</strong></td>
              <td>v₂ = <span class="blank-write" style="min-width:25px;"></span>m / <span class="blank-write" style="min-width:20px;"></span>s<br><strong>v₂ = <span class="blank-write" style="min-width:35px;"></span> m/s</strong></td>
              <td>v₃ = <span class="blank-write" style="min-width:25px;"></span>m / <span class="blank-write" style="min-width:20px;"></span>s<br><strong>v₃ = <span class="blank-write" style="min-width:35px;"></span> m/s</strong></td>
              <td style="background:#f8fafc; font-weight:700; font-size:7pt;">Average Speed:<br>v_avg = d_tot / &Delta;t_tot<br>= <span class="blank-write" style="min-width:30px;"></span> m/s</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer Page 1 -->
    <div class="footer-bar">
      <span>Orange High School &bull; Physics Department</span>
      <span>Constant Speed Story: 3-Stage Dual-Graph Edition &bull; Page 1 of 2 (Front)</span>
      <span>Turn over to construct both motion graphs &rarr;</span>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- PAGE 2 (BACK): DUAL-GRAPH MODELING & 3-STAGE PROOFS          -->
  <!-- ============================================================ -->
  <div class="worksheet-page">
    <div>
      <!-- Header Page 2 -->
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Dual-Graph Motion Modeling &bull; 3-Stage Proofs</h1>
          <p class="sub">Slopes Equal Velocities &bull; Areas under the Curve Equal Displacements</p>
        </div>
        <div class="header-meta">
          <div class="student-fields">
            <div><span class="field-label">Name:</span> <span class="field-line" style="min-width:150px;"></span></div>
            <div><span class="field-label">Period:</span> <span class="field-line" style="min-width:35px;"></span></div>
          </div>
        </div>
      </div>

      <!-- Scale Calibration Planner -->
      <div class="scale-planner-banner">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>📏 <strong>Axis Scale Calibration:</strong> Choose your scale to fit your story &bull; Write your numbers along the axis tick marks before plotting:</span>
          <span style="font-size:7pt; color:#64748b;">(Aligned 10-Division Grid)</span>
        </div>
        <div class="scale-planner-grid">
          <div><strong>Time Axis (t):</strong> 1 block = <span class="blank-write" style="min-width:28px;"></span> s</div>
          <div><strong>Position Axis (x):</strong> 1 block = <span class="blank-write" style="min-width:28px;"></span> m</div>
          <div><strong>Velocity Axis (v):</strong> 1 block = <span class="blank-write" style="min-width:28px;"></span> m/s</div>
        </div>
      </div>

      <!-- Graph 1: Position vs. Time -->
      <div style="display:flex; justify-content:center;">
        ${grid1}
      </div>

      <!-- Graph 1 Analysis: 3 Slope Calculations -->
      <div class="strip-3-col">
        <div class="strip-box">
          <strong>Section 1 Slope Proof:</strong><br>
          m₁ = &Delta;x₁ / &Delta;t₁ = (<span class="blank-write" style="min-width:24px;"></span>m) / (<span class="blank-write" style="min-width:18px;"></span>s)<br>
          <strong>Slope₁ = <span class="blank-write" style="min-width:30px;"></span> m/s</strong> (Matches v₁?)
        </div>
        <div class="strip-box">
          <strong>Section 2 Slope Proof:</strong><br>
          m₂ = &Delta;x₂ / &Delta;t₂ = (<span class="blank-write" style="min-width:24px;"></span>m) / (<span class="blank-write" style="min-width:18px;"></span>s)<br>
          <strong>Slope₂ = <span class="blank-write" style="min-width:30px;"></span> m/s</strong> (Flat line = 0?)
        </div>
        <div class="strip-box">
          <strong>Section 3 Slope Proof:</strong><br>
          m₃ = &Delta;x₃ / &Delta;t₃ = (<span class="blank-write" style="min-width:24px;"></span>m) / (<span class="blank-write" style="min-width:18px;"></span>s)<br>
          <strong>Slope₃ = <span class="blank-write" style="min-width:30px;"></span> m/s</strong> (Matches v₃?)
        </div>
      </div>

      <!-- Graph 2: Velocity vs. Time -->
      <div style="display:flex; justify-content:center;">
        ${grid2}
      </div>

      <!-- Graph 2 Analysis: 3 Area Calculations -->
      <div class="strip-3-col">
        <div class="strip-box">
          <strong>Section 1 Area (&Delta;x₁):</strong><br>
          Area₁ = Height &times; Width = (v₁)(&Delta;t₁)<br>
          = (<span class="blank-write" style="min-width:22px;"></span> m/s) &times; (<span class="blank-write" style="min-width:18px;"></span> s) = <strong><span class="blank-write" style="min-width:25px;"></span> m</strong>
        </div>
        <div class="strip-box">
          <strong>Section 2 Area (&Delta;x₂):</strong><br>
          Area₂ = Height &times; Width = (v₂)(&Delta;t₂)<br>
          = (0 m/s) &times; (<span class="blank-write" style="min-width:18px;"></span> s) = <strong>0 m</strong>
        </div>
        <div class="strip-box">
          <strong>Section 3 Area (&Delta;x₃):</strong><br>
          Area₃ = Height &times; Width = (v₃)(&Delta;t₃)<br>
          = (<span class="blank-write" style="min-width:22px;"></span> m/s) &times; (<span class="blank-write" style="min-width:18px;"></span> s) = <strong><span class="blank-write" style="min-width:25px;"></span> m</strong>
        </div>
      </div>

      <!-- Part 4: Dual-Graph Synthesis & Geometric Proof -->
      <div class="section-card" style="margin-top:2px;">
        <div class="section-header">
          <span>Part 4: Dual-Graph Synthesis &amp; Net Displacement Verification</span>
          <span class="badge badge-amber">Core Concept Check</span>
        </div>
        <div style="display:grid; grid-template-columns: 1.15fr 1fr; gap:8px; font-size:7.6pt; line-height:1.25;">
          <div>
            <strong>1. Total Net Displacement Proof from Shaded Areas:</strong><br>
            Sum of all 3 areas: &Delta;x_total = Area₁ + Area₂ + Area₃<br>
            = (<span class="blank-write" style="min-width:25px;"></span> m) + (0 m) + (<span class="blank-write" style="min-width:25px;"></span> m) = <strong><span class="blank-write" style="min-width:35px;"></span> meters</strong><br>
            Does this match your position change on Graph 1 (x_final &minus; x_initial)? <label><input type="checkbox"> YES</label> <label><input type="checkbox"> NO</label>
          </div>
          <div>
            <strong>2. Physical Meaning of Negative Slope / Area:</strong><br>
            When a line on Graph 1 slopes downward (negative slope), what direction is the object moving? <span class="blank-write" style="min-width:110px;"></span><br>
            Where does its horizontal line appear on Graph 2? <span class="blank-write" style="min-width:90px;"></span>
          </div>
        </div>
        <div style="font-size:7.5pt; margin-top:3px; border-top:1px solid #e2e8f0; padding-top:2px;">
          <strong>3. Unit Cancellation Proof:</strong> In Graph 2, show mathematically how multiplying the height unit (m/s) by the width unit (s) cancels to prove that area MUST be distance: &nbsp;&nbsp; <strong>(m / s) &times; (s) = </strong> <span class="blank-write" style="min-width:80px;"></span>
        </div>
      </div>
    </div>

    <!-- Footer Page 2 -->
    <div class="footer-bar">
      <span>Orange High School &bull; Physics Department</span>
      <span>Constant Speed Story: 3-Stage Dual-Graph Edition &bull; Page 2 of 2 (Back)</span>
      <span>Unit 2: Kinematics &bull; Teacher: Mr. Mudry</span>
    </div>
  </div>

</body>
</html>
  `;
}

function renderTeacherMasterKey() {
  const plot1Exemplar = generateExemplarPlot1SVG();
  const plot2Exemplar = generateExemplarPlot2SVG();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Teacher Master Key &amp; Exemplar: Constant Speed Story (3-Stage Dual-Graph)</title>
  <style>
    ${printCss}
    .exemplar-badge {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 7.2pt;
      font-weight: 800;
      text-transform: uppercase;
    }
    .rubric-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.2pt;
      margin-bottom: 4px;
    }
    .rubric-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 2.5px 4px;
      font-weight: 800;
      text-align: left;
      border: 1px solid #0f172a;
    }
    .rubric-table td {
      padding: 2.5px 4px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }
  </style>
</head>
<body>

  <!-- ============================================================ -->
  <!-- TEACHER MASTER KEY & EXEMPLAR (1 PAGE)                        -->
  <!-- ============================================================ -->
  <div class="worksheet-page" style="height:10.40in; max-height:10.40in;">
    <div>
      <!-- Header -->
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Teacher Master Key &amp; Exemplar &bull; 3-Stage Dual-Graph Story</h1>
          <p class="sub">Unit 2: Kinematics &bull; Day 15 Performance Task &bull; Dual-Graph Studio Scenario 1 Exemplar</p>
        </div>
        <div class="header-meta">
          <span class="exemplar-badge">Teacher Grading Guide &bull; 10 Points</span>
        </div>
      </div>

      <!-- Rubric Table -->
      <table class="rubric-table">
        <thead>
          <tr>
            <th style="width:18%;">Criterion</th>
            <th style="width:10%;">Points</th>
            <th style="width:72%;">Mastery Indicators (Evidence of Full Credit)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Scenario &amp; Narrative</strong></td>
            <td><strong>2 pts</strong></td>
            <td>Original 3-stage story across 10.0s with clear object, reference origin (x=0m), realistic positions, and distinct stages (forward, stopped, or reverse).</td>
          </tr>
          <tr>
            <td><strong>2. 3-Stage Motion Table</strong></td>
            <td><strong>3 pts</strong></td>
            <td>All 3 time intervals sum to 10.0s; correct signs on displacements (&Delta;x); step-by-step GUESS velocity formulas (v = &Delta;x/&Delta;t) with correct units (m/s).</td>
          </tr>
          <tr>
            <td><strong>3. Graph 1 (x-t) &amp; Slopes</strong></td>
            <td><strong>2 pts</strong></td>
            <td>3 continuous connected line segments plotted accurately; slope calculations (Rise/Run) explicitly shown below graph matching table velocities.</td>
          </tr>
          <tr>
            <td><strong>4. Graph 2 (v-t) &amp; Areas</strong></td>
            <td><strong>2 pts</strong></td>
            <td>3 horizontal velocity bars drawn at correct heights; shaded rectangular regions between bars and v=0 axis; Area = v &times; &Delta;t proves displacement &Delta;x.</td>
          </tr>
          <tr>
            <td><strong>5. Dual-Graph Synthesis</strong></td>
            <td><strong>1 pt</strong></td>
            <td>Sum of shaded areas matches net displacement (x_final &minus; x_initial); correct physical meaning of negative slope/velocity; unit cancellation shown.</td>
          </tr>
        </tbody>
      </table>

      <!-- Exemplar Scenario Banner -->
      <div class="task-banner" style="background:#f0fdf4; border-left:3.5px solid #16a34a; border-color:#bbf7d0; margin-bottom:4px; padding:3px 6px;">
        <span><strong>Worked Exemplar (Mars Rover Telemetry):</strong> Rover starts at x = 14m. Section 1 (0-3s): Reverses at -4 m/s to x = 2m (&Delta;x = -12m). Section 2 (3-6s): Stops for 3s to analyze rock sample (&Delta;x = 0m). Section 3 (6-10s): Drives forward for 4s at +3 m/s back to x = 14m (&Delta;x = +12m). Net &Delta;x = 0m, Total Distance = 24m.</span>
      </div>

      <!-- Exemplar Graphs Display -->
      <div style="display:flex; justify-content:center; margin-bottom:3px;">
        ${plot1Exemplar}
      </div>

      <div style="display:flex; justify-content:center; margin-bottom:3px;">
        ${plot2Exemplar}
      </div>

      <!-- Exemplar Math Proof Box -->
      <div class="section-card" style="padding:4px 6px; margin-bottom:0; background:#f8fafc;">
        <div class="section-header" style="font-size:7.5pt; margin-bottom:2px; padding-bottom:1px;">
          <span>Mathematical Verification &bull; Slope = Velocity &amp; Area = Displacement</span>
          <span style="color:#0284c7; font-weight:800;">Dual-Graph Alignment Proof</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr 1.2fr; gap:6px; font-size:7.2pt; line-height:1.2;">
          <div style="border-right:1px solid #cbd5e1; padding-right:4px;">
            <strong style="color:#e11d48;">Section 1 (0s to 3s):</strong><br>
            &bull; x-t Slope: (-12m &minus; 0m) / (3s) = <strong>-4.0 m/s</strong><br>
            &bull; v-t Area: (-4 m/s) &times; (3 s) = <strong>-12.0 m</strong><br>
            <em>Negative slope &rarr; negative velocity bar below axis!</em>
          </div>
          <div style="border-right:1px solid #cbd5e1; padding-right:4px;">
            <strong style="color:#d97706;">Section 2 (3s to 6s):</strong><br>
            &bull; x-t Slope: (0m) / (3s) = <strong>0.0 m/s</strong><br>
            &bull; v-t Area: (0 m/s) &times; (3 s) = <strong>0.0 m</strong><br>
            <em>Flat horizontal position line &rarr; line rests on v=0 axis!</em>
          </div>
          <div>
            <strong style="color:#0284c7;">Section 3 (6s to 10s) &amp; Total:</strong><br>
            &bull; x-t Slope: (+12m) / (4s) = <strong>+3.0 m/s</strong><br>
            &bull; v-t Area: (+3 m/s) &times; (4 s) = <strong>+12.0 m</strong><br>
            &bull; <strong>Net Displacement:</strong> &sum;Area = -12m + 0m + 12m = <strong>0.0 m</strong><br>
            <em>Matches Graph 1: x_end (14m) &minus; x_start (14m) = 0 m!</em>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-bar">
      <span>Orange High School &bull; Physics Department</span>
      <span>Teacher Master Key &bull; Constant Speed 3-Stage Dual-Graph Story &bull; Day 15</span>
      <span>Curriculum Alignment: NGSS HS-PS2-1 &bull; Teacher: Mr. Mudry</span>
    </div>
  </div>

</body>
</html>
  `;
}

async function generateWorksheets() {
  const outputDir = path.join(__dirname, '../Unit_2/worksheets');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const studentHtmlPath = path.join(outputDir, 'Constant_Speed_Dual_Graph_Story.html');
  const studentPdfPath = path.join(outputDir, 'Constant_Speed_Dual_Graph_Story.pdf');

  const teacherHtmlPath = path.join(outputDir, 'Teacher_Master_Key_Dual_Graph_Story.html');
  const teacherPdfPath = path.join(outputDir, 'Teacher_Master_Key_Dual_Graph_Story.pdf');

  console.log('Writing updated HTML files for 3-Stage Dual-Graph Story...');
  fs.writeFileSync(studentHtmlPath, renderStudentWorksheet(), 'utf8');
  fs.writeFileSync(teacherHtmlPath, renderTeacherMasterKey(), 'utf8');

  console.log('Launching headless browser to compile PDFs...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

  // Render Student Worksheet
  console.log('Rendering Student Worksheet PDF...');
  await page.goto(`file://${studentHtmlPath}`, { waitUntil: 'networkidle0' });

  // Inspect page bounding box & overflow
  const studentMetrics = await page.evaluate(() => {
    const pages = document.querySelectorAll('.worksheet-page');
    return Array.from(pages).map((p, idx) => ({
      page: idx + 1,
      clientHeight: p.clientHeight,
      scrollHeight: p.scrollHeight,
      overflow: p.scrollHeight - p.clientHeight
    }));
  });
  console.log('Student Worksheet Page Metrics:', studentMetrics);

  await page.pdf({
    path: studentPdfPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.30in', right: '0.38in', bottom: '0.30in', left: '0.38in' }
  });

  // Render Teacher Master Key
  console.log('Rendering Teacher Master Key PDF...');
  await page.goto(`file://${teacherHtmlPath}`, { waitUntil: 'networkidle0' });

  const teacherMetrics = await page.evaluate(() => {
    const pages = document.querySelectorAll('.worksheet-page');
    return Array.from(pages).map((p, idx) => ({
      page: idx + 1,
      clientHeight: p.clientHeight,
      scrollHeight: p.scrollHeight,
      overflow: p.scrollHeight - p.clientHeight
    }));
  });
  console.log('Teacher Master Key Page Metrics:', teacherMetrics);

  await page.pdf({
    path: teacherPdfPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.30in', right: '0.38in', bottom: '0.30in', left: '0.38in' }
  });

  // Capture verification screenshots
  const brainDir = '/home/ryan/.gemini/antigravity-ide/brain/e5a49d5e-4953-4d8f-b70d-d7f09583700c';
  if (fs.existsSync(brainDir)) {
    await page.goto(`file://${studentHtmlPath}`, { waitUntil: 'networkidle0' });
    const studentPages = await page.$$('.worksheet-page');
    if (studentPages.length >= 2) {
      await studentPages[0].screenshot({ path: path.join(brainDir, 'dual_graph_3stage_page1.png') });
      await studentPages[1].screenshot({ path: path.join(brainDir, 'dual_graph_3stage_page2.png') });
    }
    await page.goto(`file://${teacherHtmlPath}`, { waitUntil: 'networkidle0' });
    const teacherPage = await page.$('.worksheet-page');
    if (teacherPage) {
      await teacherPage.screenshot({ path: path.join(brainDir, 'dual_graph_3stage_teacher_key.png') });
    }
  }

  await browser.close();
  console.log('Successfully generated:');
  console.log('  - Student HTML:', studentHtmlPath);
  console.log('  - Student PDF:', studentPdfPath);
  console.log('  - Teacher HTML:', teacherHtmlPath);
  console.log('  - Teacher PDF:', teacherPdfPath);
}

generateWorksheets().catch(err => {
  console.error('Fatal error generating worksheets:', err);
  process.exit(1);
});

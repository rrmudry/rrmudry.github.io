/**
 * Generates Combined 2-Page Honors Physics Graphing Worksheet (Challenges 1 & 2)
 * Unit 2: Kinematics (Period 0 Honors Physics)
 * 
 * Requirements:
 * - Single PDF file containing Challenge 1 (Page 1) and Challenge 2 (Page 2)
 * - Individual assignment: says "Name:" instead of "Names:"
 * - Scenario 3 left out
 * - Graph-first layout: students read scenario, plot on grid, solve from graph
 * - Clean SVG grids with NO legend inside the plot area
 * - Exactly 2 pages in the PDF (perfect for a single double-sided printout)
 * - Matching 1-page Teacher Master Key
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function generateCleanGrid({
  width = 690,
  height = 425,
  marginLeft = 60,
  marginBottom = 44,
  marginRight = 20,
  marginTop = 22,
  xMin = 0,
  xMax = 70,
  xMajor = 10,
  xMinor = 2,
  xLabel = "Time t (seconds)",
  yMin = 0,
  yMax = 800,
  yMajor = 100,
  yMinor = 20,
  yLabel = "Position x (meters)",
  title = "Position vs. Time Graph (x vs. t)"
}) {
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const xScale = val => marginLeft + ((val - xMin) / (xMax - xMin)) * plotWidth;
  const yScale = val => marginTop + plotHeight - ((val - yMin) / (yMax - yMin)) * plotHeight;

  let linesHtml = '';

  // Minor X lines
  if (xMinor) {
    for (let x = xMin; x <= xMax; x += xMinor) {
      if (Math.abs(x % xMajor) > 0.001) {
        const px = xScale(x);
        linesHtml += `<line x1="${px.toFixed(1)}" y1="${marginTop}" x2="${px.toFixed(1)}" y2="${marginTop + plotHeight}" stroke="#e2e8f0" stroke-width="0.75" />\n`;
      }
    }
  }

  // Minor Y lines
  if (yMinor) {
    for (let y = yMin; y <= yMax; y += yMinor) {
      if (Math.abs(y % yMajor) > 0.001) {
        const py = yScale(y);
        linesHtml += `<line x1="${marginLeft}" y1="${py.toFixed(1)}" x2="${marginLeft + plotWidth}" y2="${py.toFixed(1)}" stroke="#e2e8f0" stroke-width="0.75" />\n`;
      }
    }
  }

  // Major X lines & numbers
  for (let x = xMin; x <= xMax; x += xMajor) {
    const px = xScale(x);
    linesHtml += `<line x1="${px.toFixed(1)}" y1="${marginTop}" x2="${px.toFixed(1)}" y2="${marginTop + plotHeight}" stroke="#94a3b8" stroke-width="1.25" />\n`;
    linesHtml += `<line x1="${px.toFixed(1)}" y1="${marginTop + plotHeight}" x2="${px.toFixed(1)}" y2="${marginTop + plotHeight + 4}" stroke="#475569" stroke-width="1.5" />\n`;
    linesHtml += `<text x="${px.toFixed(1)}" y="${marginTop + plotHeight + 16}" font-size="10.5" font-family="'Inter', Arial, sans-serif" font-weight="600" fill="#334155" text-anchor="middle">${x}</text>\n`;
  }

  // Major Y lines & numbers
  for (let y = yMin; y <= yMax; y += yMajor) {
    const py = yScale(y);
    linesHtml += `<line x1="${marginLeft}" y1="${py.toFixed(1)}" x2="${marginLeft + plotWidth}" y2="${py.toFixed(1)}" stroke="#94a3b8" stroke-width="1.25" />\n`;
    linesHtml += `<line x1="${marginLeft - 4}" y1="${py.toFixed(1)}" x2="${marginLeft}" y2="${py.toFixed(1)}" stroke="#475569" stroke-width="1.5" />\n`;
    linesHtml += `<text x="${marginLeft - 7}" y="${(py + 3.5).toFixed(1)}" font-size="10.5" font-family="'Inter', Arial, sans-serif" font-weight="600" fill="#334155" text-anchor="end">${y}</text>\n`;
  }

  // Axes
  const originX = xScale(xMin);
  const originY = yScale(yMin);

  linesHtml += `
    <!-- Axes with Arrowheads -->
    <line x1="${originX}" y1="${marginTop - 8}" x2="${originX}" y2="${originY}" stroke="#0f172a" stroke-width="2.2" marker-end="url(#arrow-up)" />
    <line x1="${originX}" y1="${originY}" x2="${marginLeft + plotWidth + 12}" y2="${originY}" stroke="#0f172a" stroke-width="2.2" marker-end="url(#arrow-right)" />
    
    <!-- Axis Labels -->
    <text x="${marginLeft + plotWidth / 2}" y="${height - 7}" font-size="11.5" font-family="'Inter', Arial, sans-serif" font-weight="700" fill="#0f172a" text-anchor="middle">${xLabel}</text>
    <text transform="rotate(-90)" x="${-(marginTop + plotHeight / 2)}" y="17" font-size="11.5" font-family="'Inter', Arial, sans-serif" font-weight="700" fill="#0f172a" text-anchor="middle">${yLabel}</text>
    
    <!-- Title -->
    <text x="${marginLeft + plotWidth / 2}" y="15" font-size="12" font-family="'Inter', Arial, sans-serif" font-weight="800" fill="#0f172a" text-anchor="middle">${title}</text>
  `;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="coordinate-grid-svg">
      <defs>
        <marker id="arrow-right" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0f172a"/>
        </marker>
        <marker id="arrow-up" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 1.5 10 L 5 0 L 8.5 10 z" fill="#0f172a"/>
        </marker>
      </defs>
      <rect x="${marginLeft}" y="${marginTop}" width="${plotWidth}" height="${plotHeight}" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" />
      ${linesHtml}
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
    line-height: 1.3;
    font-size: 9pt;
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
    font-size: 8pt;
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

  /* Scenario Box */
  .scenario-container {
    background: #f8fafc;
    border-left: 3.5px solid #0284c7;
    border-top: 1px solid #e2e8f0;
    border-right: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    padding: 5px 9px;
    font-size: 8pt;
    margin-bottom: 4px;
    border-radius: 0 5px 5px 0;
  }

  .scenario-title {
    font-weight: 800;
    color: #0f172a;
    font-size: 8.5pt;
    margin-bottom: 2px;
    text-transform: uppercase;
  }

  .telemetry-row {
    display: flex;
    gap: 8px;
    margin-top: 3px;
  }

  .telemetry-pill {
    flex: 1;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 2px 5px;
    font-size: 7.5pt;
    line-height: 1.25;
  }

  .telemetry-pill strong {
    color: #0f172a;
    display: block;
    margin-bottom: 1px;
  }

  /* Task instructions bar */
  .task-bar {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 8pt;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
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
  .badge-green { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }

  /* Graph Container */
  .graph-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 1px 0 4px 0;
  }

  /* Questions Box */
  .questions-container {
    border: 1.5px solid #cbd5e1;
    border-radius: 6px;
    padding: 5px 9px;
    background: #ffffff;
  }

  .questions-title {
    font-size: 8.5pt;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    margin-bottom: 3px;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 2px;
  }

  .q-item {
    margin-bottom: 4px;
    font-size: 8.2pt;
    line-height: 1.25;
  }

  .q-item:last-child {
    margin-bottom: 0;
  }

  .q-prompt {
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 1px;
  }

  .answer-line {
    border-bottom: 1px solid #94a3b8;
    height: 16px;
    width: 100%;
    margin-top: 2px;
  }

  .inline-blank {
    display: inline-block;
    border-bottom: 1px solid #475569;
    min-width: 75px;
    text-align: center;
    font-weight: 700;
  }

  /* Footer */
  .footer-bar {
    border-top: 1px solid #cbd5e1;
    padding-top: 3px;
    font-size: 7.5pt;
    color: #64748b;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

function renderCombinedWorksheet() {
  // Grid 1: Ship & Drone (70s x 800m)
  const gridSvg1 = generateCleanGrid({
    width: 690,
    height: 380,
    marginLeft: 58,
    marginBottom: 40,
    marginRight: 20,
    marginTop: 20,
    xMin: 0,
    xMax: 70,
    xMajor: 10,
    xMinor: 2,
    xLabel: "Time Elapsed t (seconds)",
    yMin: 0,
    yMax: 800,
    yMajor: 100,
    yMinor: 20,
    yLabel: "Position from Dock x (meters)",
    title: "Position vs. Time: Rescue Ship & Medical Drone"
  });

  // Grid 2: Highway Intercept (100s x 1400m)
  const gridSvg2 = generateCleanGrid({
    width: 690,
    height: 380,
    marginLeft: 62,
    marginBottom: 40,
    marginRight: 20,
    marginTop: 20,
    xMin: 0,
    xMax: 100,
    xMajor: 10,
    xMinor: 2,
    xLabel: "Time Elapsed t (seconds)",
    yMin: 0,
    yMax: 1400,
    yMajor: 200,
    yMinor: 40,
    yLabel: "Highway Position x (meters)",
    title: "Position vs. Time: Target 3-Leg Journey & Patrol Intercept Options"
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Honors Physics: Kinematic Intercept Challenges 1 &amp; 2</title>
  <style>${printCss}</style>
</head>
<body>

  <!-- ============================================================ -->
  <!-- PAGE 1: CHALLENGE 1 (HARBOR SHIP & DRONE RENDEZVOUS)          -->
  <!-- ============================================================ -->
  <div class="worksheet-page">
    <div>
      <!-- Header -->
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Honors Physics: Kinematic Rendezvous Challenge</h1>
          <p class="sub">Unit 2: Constant Velocity &amp; Graphical Intercept Modeling &bull; Challenge 1 of 2</p>
        </div>
        <div class="header-meta">
          <span class="badge badge-blue">HS-PS2-1 • SEP-5</span>
          <div class="student-fields">
            <div><span class="field-label">Name:</span> <span class="field-line" style="min-width:180px;"></span></div>
            <div><span class="field-label">Period:</span> <span class="field-line" style="min-width:35px;">0</span></div>
            <div><span class="field-label">Date:</span> <span class="field-line" style="min-width:65px;"></span></div>
          </div>
        </div>
      </div>

      <!-- Scenario -->
      <div class="scenario-container">
        <div class="scenario-title">Mission Scenario: Emergency Harbor Air-Drop</div>
        A marine research ship is traveling straight out to sea away from the harbor dock (dock = <strong>x = 0 m</strong>). At <strong>t = 0 s</strong>, the ship is already <strong>300 meters</strong> out from the dock, traveling at a steady speed of <strong>6.0 m/s</strong>.<br>
        An urgent medical distress call requires dispatching an autonomous courier drone from the dock (<strong>x = 0 m</strong>). The drone flies at a steady speed of <strong>18.0 m/s</strong>, but requires a <strong>20-second preflight delay</strong> (boot &amp; rotor spin-up) before taking off at <strong>t = 20 s</strong>.
        
        <div class="telemetry-row">
          <div class="telemetry-pill">
            <strong>🚢 Research Vessel Telemetry</strong>
            • Initial Position: <strong>x₀ = 300 m</strong> at t = 0 s<br>
            • Constant Velocity: <strong>v = 6.0 m/s</strong> (+60 m every 10 s)
          </div>
          <div class="telemetry-pill">
            <strong>🚁 Medical Drone Telemetry</strong>
            • Initial Position: <strong>x₀ = 0 m</strong> (dock)<br>
            • Launch: Holds until <strong>t = 20 s</strong>, then flies at <strong>v = 18.0 m/s</strong> (+180 m every 10 s)
          </div>
        </div>
      </div>

      <!-- Graphing Directives Bar -->
      <div class="task-bar">
        <span>✏️ <strong>Graphing Task:</strong> Plot both motions on the grid. Label the <strong>Ship</strong> line and the <strong>Drone</strong> line. Circle the intersection point.</span>
        <span class="badge badge-green">Graph-First Analysis</span>
      </div>

      <!-- Large Clean Grid Area -->
      <div class="graph-wrapper">
        ${gridSvg1}
      </div>

      <!-- Questions from Graph -->
      <div class="questions-container">
        <div class="questions-title">
          <span>Graphical Analysis &amp; Mission Debrief</span>
          <span style="font-size:7.5pt; color:#64748b; font-weight:600;">Answer using your graph above</span>
        </div>

        <div class="q-item">
          <div class="q-prompt">1. Rendezvous Coordinates (From Graph):</div>
          At what exact time and position do the two lines intersect? &nbsp;
          <strong>Time (t):</strong> <span class="inline-blank"></span> seconds &nbsp;&nbsp;&nbsp;&nbsp;
          <strong>Position (x):</strong> <span class="inline-blank" style="min-width:85px;"></span> meters from dock
        </div>

        <div class="q-item">
          <div class="q-prompt">2. Slope &amp; Speed Verification:</div>
          Calculate the slope (Δx / Δt) of each graphed line to verify their speeds: &nbsp;
          Ship Slope: <span class="inline-blank" style="min-width:60px;"></span> m/s &nbsp;&nbsp;|&nbsp;&nbsp;
          Drone Slope (after t = 20 s): <span class="inline-blank" style="min-width:60px;"></span> m/s
        </div>

        <div class="q-item">
          <div class="q-prompt">3. Actual Drone Flight Duration:</div>
          The clock reads your rendezvous time when they meet, but the drone was delayed until t = 20 s. How many seconds was the drone actually flying in the air? <span class="inline-blank" style="min-width:65px;"></span> seconds
        </div>

        <div class="q-item">
          <div class="q-prompt">4. Battery Safety Audit (Honors Critical Question):</div>
          The drone has enough battery for a maximum round-trip flight distance of <strong>1,200 meters</strong> before complete depletion. Can the drone deliver the cargo and safely return to dock? Explain using numbers:
          <div class="answer-line"></div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-bar">
      <span>Orange High School • Period 0 Honors Physics</span>
      <span>Challenge 1: Ship &amp; Drone Rendezvous &bull; Page 1 of 2</span>
      <span>Teacher: Mr. Mudry</span>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- PAGE 2: CHALLENGE 2 (HIGHWAY SURVEILLANCE INTERCEPT)          -->
  <!-- ============================================================ -->
  <div class="worksheet-page">
    <div>
      <!-- Header -->
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Honors Physics: Tactical Highway Intercept</h1>
          <p class="sub">Unit 2: Piecewise 1D Motion, Rest Intervals &amp; Pursuit Slopes &bull; Challenge 2 of 2</p>
        </div>
        <div class="header-meta">
          <span class="badge badge-blue">HS-PS2-1 • Piecewise Graphs</span>
          <div class="student-fields">
            <div><span class="field-label">Name:</span> <span class="field-line" style="min-width:180px;"></span></div>
            <div><span class="field-label">Period:</span> <span class="field-line" style="min-width:35px;">0</span></div>
            <div><span class="field-label">Date:</span> <span class="field-line" style="min-width:65px;"></span></div>
          </div>
        </div>
      </div>

      <!-- Scenario -->
      <div class="scenario-container">
        <div class="scenario-title">Surveillance Dossier: Desert Highway Reconnaissance</div>
        A target vehicle heads east on a straight highway starting from <strong>x = 0 m</strong> at <strong>t = 0 s</strong> in 3 distinct legs:<br>
        • <strong>Leg 1 (t = 0 to 20 s):</strong> Drives at <strong>15.0 m/s</strong> (covers 15 m/s × 20 s = <strong>300 m</strong>, reaching <strong>x = 300 m</strong> at t = 20 s).<br>
        • <strong>Leg 2 (t = 20 to 50 s):</strong> Pulls over at a rest stop and remains <strong>completely stopped (v = 0 m/s)</strong> for 30 seconds.<br>
        • <strong>Leg 3 (t = 50 to 90 s):</strong> Re-enters the highway at <strong>25.0 m/s</strong> for 40 s (covers 25 m/s × 40 s = <strong>1,000 m</strong>, reaching <strong>x = 1,300 m</strong> at t = 90 s).<br>
        A Highway Patrol Cruiser is at <strong>x = 0 m</strong>, but is held at the station and <strong>cannot leave until t = 30 seconds</strong>.
      </div>

      <!-- Graphing Directives Bar -->
      <div class="task-bar">
        <span>✏️ <strong>Graphing Task:</strong> 1) Plot Target's 3-leg line (0 to 90s). 2) Draw <strong>Patrol Line A</strong> (from t=30s, x=0 to catch at rest stop at t=50s). 3) Draw <strong>Patrol Line B</strong> (to catch at t=90s).</span>
        <span class="badge badge-green">Slope as Velocity</span>
      </div>

      <!-- Large Clean Grid Area -->
      <div class="graph-wrapper">
        ${gridSvg2}
      </div>

      <!-- Questions from Graph -->
      <div class="questions-container">
        <div class="questions-title">
          <span>Graphical Analysis &amp; Pursuit Strategy</span>
          <span style="font-size:7.5pt; color:#64748b; font-weight:600;">Answer using your graph above</span>
        </div>

        <div class="q-item">
          <div class="q-prompt">1. Interpreting the Rest Stop (Leg 2):</div>
          What does the visual slope of the line represent between t = 20 s and t = 50 s? How does the graph show the car is stopped?
          <div class="answer-line"></div>
        </div>

        <div class="q-item">
          <div class="q-prompt">2. Cruiser Speed Calculations (From Slopes of Lines A and B):</div>
          • <strong>Strategy A (Catch at rest stop at t = 50 s):</strong> Cruiser travels 300 m in 20 s (from t=30 to 50s). Required speed: <span class="inline-blank"></span> m/s<br>
          • <strong>Strategy B (Catch at t = 90 s):</strong> Cruiser travels 1,300 m in 60 s (from t=30 to 90s). Required speed: <span class="inline-blank"></span> m/s
        </div>

        <div class="q-item">
          <div class="q-prompt">3. Speed Limit Constraint Analysis:</div>
          The patrol cruiser has a top safe speed cap of <strong>20.0 m/s (45 mph)</strong>. Which of the two strategies is physically possible? Defend with calculations:
          <div class="answer-line"></div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-bar">
      <span>Orange High School • Period 0 Honors Physics</span>
      <span>Challenge 2: Highway Surveillance Intercept &bull; Page 2 of 2</span>
      <span>Teacher: Mr. Mudry</span>
    </div>
  </div>

</body>
</html>
  `;
}

function renderCombinedKey() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Teacher Master Key: Honors Kinematics Challenges 1 &amp; 2</title>
  <style>
    @page { size: letter portrait; margin: 0.35in 0.45in; }
    body { font-family: "Inter", Arial, sans-serif; font-size: 8.5pt; line-height: 1.35; color: #0f172a; }
    .page { width: 100%; height: 10.2in; max-height: 10.2in; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
    .key-header { border-bottom: 2px solid #b91c1c; padding-bottom: 4px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { font-size: 13pt; margin: 0 0 2px 0; color: #b91c1c; text-transform: uppercase; font-weight: 900; }
    .badge { padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 7.5pt; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .card { border: 1.2px solid #cbd5e1; border-radius: 6px; padding: 7px 10px; margin-bottom: 8px; background: #ffffff; }
    .card-title { font-size: 9.5pt; font-weight: 800; color: #0f172a; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; display: flex; justify-content: space-between; }
    .ans-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 5px 8px; margin: 4px 0; font-family: monospace; font-size: 8.5pt; color: #166534; }
    .bold-lbl { font-weight: 700; color: #1e293b; }
    .footer { border-top: 1px solid #cbd5e1; padding-top: 3px; font-size: 7.5pt; color: #64748b; display: flex; justify-content: space-between; }
  </style>
</head>
<body>

  <div class="page">
    <div>
      <div class="key-header">
        <div>
          <h1>TEACHER MASTER KEY: HONORS CHALLENGES 1 &amp; 2</h1>
          <div style="font-size: 8pt; font-weight: 700; color: #475569;">Quick-Reference Answers, Coordinates &amp; Debrief Solutions</div>
        </div>
        <div><span class="badge">CONFIDENTIAL • MR. MUDRY</span></div>
      </div>

      <!-- CHALLENGE 1 KEY -->
      <div class="card">
        <div class="card-title"><span>Challenge 1: Ship &amp; Drone Kinematic Rendezvous</span><span>Page 1 of Student Sheet</span></div>
        <p><span class="bold-lbl">Plotted Points on Grid:</span><br>
          • <strong>Ship:</strong> (0s, 300m), (10s, 360m), (20s, 420m), (30s, 480m), (40s, 540m), (50s, 600m), (55s, 630m), (60s, 660m).<br>
          • <strong>Drone:</strong> (0 to 20s flat on dock at 0m), (30s, 180m), (40s, 360m), (50s, 540m), (55s, 630m), (60s, 720m).
        </p>
        <div class="ans-box">
          1. <strong>Rendezvous Coordinates:</strong> Time t = <strong>55.0 seconds</strong>, Position x = <strong>630.0 meters</strong> from dock.<br>
          2. <strong>Slopes (Speeds):</strong> Ship Slope = <strong>+6.0 m/s</strong> &bull; Drone Slope (after t=20s) = (540 - 0)/(50 - 20) = <strong>+18.0 m/s</strong>.<br>
          3. <strong>Actual Drone Flight Duration:</strong> 55 s - 20 s delay = <strong>35.0 seconds</strong> flying in the air.<br>
          4. <strong>Battery Safety Audit:</strong> Total round-trip distance = 630 m outbound + 630 m return = <strong>1,260 meters</strong>.<br>
             → Since battery max is 1,200 m, <strong>the drone cannot make it back</strong> (crashes 60 m short of the dock).
        </div>
      </div>

      <!-- CHALLENGE 2 KEY -->
      <div class="card">
        <div class="card-title"><span>Challenge 2: Tactical Highway Surveillance Intercept</span><span>Page 2 of Student Sheet</span></div>
        <p><span class="bold-lbl">Plotted Points on Grid:</span><br>
          • <strong>Target Car:</strong> (0s, 0m) → (20s, 300m) [Leg 1] → (50s, 300m) [Leg 2, flat line] → (90s, 1300m) [Leg 3].<br>
          • <strong>Patrol Line A:</strong> Starts at (30s, 0m), connects to rest stop at (50s, 300m).<br>
          • <strong>Patrol Line B:</strong> Starts at (30s, 0m), connects to final highway point at (90s, 1300m).
        </p>
        <div class="ans-box">
          1. <strong>Rest Stop Meaning:</strong> Slope is zero (Δx/Δt = 0), which means velocity is 0 m/s and position does not change (car is stationary).<br>
          2. <strong>Cruiser Speed Calculations:</strong><br>
             • <strong>Strategy A (Rest Stop at t=50s):</strong> Slope = (300 m - 0 m) / (50 s - 30 s) = 300 / 20 = <strong>15.0 m/s</strong> (33.6 mph).<br>
             • <strong>Strategy B (Highway End at t=90s):</strong> Slope = (1,300 m - 0 m) / (90 s - 30 s) = 1,300 / 60 = <strong>21.67 m/s ≈ 21.7 m/s</strong> (48.5 mph).<br>
          3. <strong>Speed Limit Constraint (Cruiser Top Speed = 20.0 m/s):</strong><br>
             • Strategy A requires 15.0 m/s ≤ 20.0 m/s → <strong>PHYSICALLY POSSIBLE ✓</strong><br>
             • Strategy B requires 21.7 m/s &gt; 20.0 m/s → <strong>EXCEEDS SPEED LIMIT / IMPOSSIBLE ✗</strong><br>
             → Therefore, <strong>Strategy A is the only viable option</strong> for the patrol interceptor.
        </div>
      </div>
    </div>

    <div class="footer">
      <span>Orange High School • Period 0 Honors Physics</span>
      <span>Teacher Single-Sheet Master Key (Challenges 1 &amp; 2)</span>
      <span>Teacher: Mr. Mudry</span>
    </div>
  </div>

</body>
</html>
  `;
}

async function run() {
  const outDir = path.join(__dirname, '../Unit_2/honors_worksheets');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('🚀 Launching Puppeteer to compile Combined 2-Page Worksheet & Key...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  // 1. Combined Worksheet (Page 1 = Challenge 1, Page 2 = Challenge 2)
  const wsHtml = renderCombinedWorksheet();
  const wsHtmlPath = path.join(outDir, 'Honors_Kinematics_Graphing_Challenges_1_and_2.html');
  const wsPdfPath = path.join(outDir, 'Honors_Kinematics_Graphing_Challenges_1_and_2.pdf');
  fs.writeFileSync(wsHtmlPath, wsHtml, 'utf8');

  const page1 = await browser.newPage();
  await page1.setContent(wsHtml, { waitUntil: 'networkidle0' });
  await page1.pdf({
    path: wsPdfPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '0.32in', bottom: '0.32in', left: '0.42in', right: '0.42in' }
  });
  await page1.close();
  console.log(`✅ Generated Combined 2-Page Worksheet PDF: ${wsPdfPath}`);

  // 2. Combined Teacher Key (1 Page)
  const keyHtml = renderCombinedKey();
  const keyHtmlPath = path.join(outDir, 'Teacher_Master_Key_Challenges_1_and_2.html');
  const keyPdfPath = path.join(outDir, 'Teacher_Master_Key_Challenges_1_and_2.pdf');
  fs.writeFileSync(keyHtmlPath, keyHtml, 'utf8');

  const page2 = await browser.newPage();
  await page2.setContent(keyHtml, { waitUntil: 'networkidle0' });
  await page2.pdf({
    path: keyPdfPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '0.35in', bottom: '0.35in', left: '0.45in', right: '0.45in' }
  });
  await page2.close();
  console.log(`✅ Generated Teacher Master Key PDF: ${keyPdfPath}`);

  await browser.close();
  console.log('🎉 Combined 2-Page Worksheet & Master Key compiled successfully!');
}

run().catch(err => {
  console.error('❌ Error compiling combined worksheet:', err);
  process.exit(1);
});

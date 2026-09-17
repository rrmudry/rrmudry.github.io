/**
 * Generates 3 Single-Page Honors Physics Graphing Worksheets & PDFs
 * Unit 2: Kinematics (Period 0 Honors Physics)
 * 
 * Design Criteria:
 * - EXACTLY 1 PAGE PER WORKSHEET (No flipping, clean single sheet)
 * - Graph-first pedagogy: Students read the scenario, plot the motion, and use the graph to solve the rendezvous
 * - No confusing algebra jargon (no "formulate continuous equation")
 * - NO legend inside the plot area (uncluttered, maximum drawing space)
 * - High-precision SVG coordinate grid with major & minor subdivisions
 * - Strictly No-LaTeX (plain text Unicode: Δ, x₀, v₀, m/s)
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function generateCleanGrid({
  width = 690,
  height = 420,
  marginLeft = 60,
  marginBottom = 44,
  marginRight = 25,
  marginTop = 24,
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

// Single-Page Strict Print CSS
const singlePageCss = `
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

  .single-page {
    width: 100%;
    height: 10.36in;
    max-height: 10.36in;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
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
    padding: 6px 10px;
    font-size: 8.5pt;
    margin-bottom: 5px;
    border-radius: 0 5px 5px 0;
  }

  .scenario-title {
    font-weight: 800;
    color: #0f172a;
    font-size: 9pt;
    margin-bottom: 2px;
    text-transform: uppercase;
  }

  .telemetry-row {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .telemetry-pill {
    flex: 1;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 8pt;
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
    padding: 4px 8px;
    font-size: 8.2pt;
    font-weight: 600;
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
  .badge-green { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }

  /* Graph Container */
  .graph-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 2px 0 5px 0;
  }

  /* Questions Box */
  .questions-container {
    border: 1.5px solid #cbd5e1;
    border-radius: 6px;
    padding: 6px 10px;
    background: #ffffff;
  }

  .questions-title {
    font-size: 8.8pt;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 2px;
  }

  .q-item {
    margin-bottom: 5px;
    font-size: 8.5pt;
  }

  .q-item:last-child {
    margin-bottom: 0;
  }

  .q-prompt {
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 2px;
  }

  .answer-line {
    border-bottom: 1px solid #94a3b8;
    height: 18px;
    width: 100%;
    margin-top: 1px;
  }

  .inline-blank {
    display: inline-block;
    border-bottom: 1px solid #475569;
    min-width: 80px;
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

// =========================================================================
// WORKSHEET 1: SINGLE-PAGE SHIP & DRONE RENDEZVOUS
// =========================================================================
function renderSinglePageWorksheet1() {
  const gridSvg = generateCleanGrid({
    width: 690,
    height: 425,
    marginLeft: 58,
    marginBottom: 44,
    marginRight: 20,
    marginTop: 22,
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

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Honors Physics: Ship & Drone Kinematic Rendezvous</title>
  <style>${singlePageCss}</style>
</head>
<body>

  <div class="single-page">
    <div>
      <!-- Header -->
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Honors Physics: Kinematic Rendezvous Challenge</h1>
          <p class="sub">Unit 2: Constant Velocity &amp; Graphical Intercept Modeling</p>
        </div>
        <div class="header-meta">
          <span class="badge badge-blue">HS-PS2-1 • SEP-5</span>
          <div class="student-fields">
            <div><span class="field-label">Names:</span> <span class="field-line" style="min-width:180px;"></span></div>
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
            • Starts at: <strong>x₀ = 300 m</strong> at t = 0 s<br>
            • Constant Speed: <strong>v = 6.0 m/s</strong> (gains 60 m every 10 s)
          </div>
          <div class="telemetry-pill">
            <strong>🚁 Medical Drone Telemetry</strong>
            • Starts at: <strong>x₀ = 0 m</strong> (dock)<br>
            • Launch Delay: At rest until <strong>t = 20 s</strong>, then cruises at <strong>v = 18.0 m/s</strong> (gains 180 m every 10 s)
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
        ${gridSvg}
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
          <strong>Time (t):</strong> <span class="inline-blank" style="min-width:70px;"></span> seconds &nbsp;&nbsp;&nbsp;&nbsp;
          <strong>Position (x):</strong> <span class="inline-blank" style="min-width:80px;"></span> meters from dock
        </div>

        <div class="q-item">
          <div class="q-prompt">2. Slope &amp; Speed Verification:</div>
          Calculate the slope (Δx / Δt) of each graphed line to verify their speeds: &nbsp;
          Ship Slope: <span class="inline-blank" style="min-width:60px;"></span> m/s &nbsp;&nbsp;|&nbsp;&nbsp;
          Drone Slope (after t = 20 s): <span class="inline-blank" style="min-width:60px;"></span> m/s
        </div>

        <div class="q-item">
          <div class="q-prompt">3. Actual Drone Flight Duration:</div>
          The clock reads your rendezvous time when they meet, but the drone was delayed until t = 20 s. How many seconds was the drone actually flying in the air? <span class="inline-blank" style="min-width:70px;"></span> seconds
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
      <span>Unit 2: Kinematics • Challenge 1</span>
      <span>Teacher: Mr. Mudry</span>
    </div>
  </div>

</body>
</html>
  `;
}

// =========================================================================
// WORKSHEET 2: SINGLE-PAGE HIGHWAY SURVEILLANCE INTERCEPT
// =========================================================================
function renderSinglePageWorksheet2() {
  const gridSvg = generateCleanGrid({
    width: 690,
    height: 425,
    marginLeft: 62,
    marginBottom: 44,
    marginRight: 20,
    marginTop: 22,
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
  <title>Honors Physics: Tactical Highway Intercept</title>
  <style>${singlePageCss}</style>
</head>
<body>

  <div class="single-page">
    <div>
      <!-- Header -->
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Honors Physics: Tactical Highway Intercept</h1>
          <p class="sub">Unit 2: Piecewise 1D Motion, Rest Intervals &amp; Pursuit Slopes</p>
        </div>
        <div class="header-meta">
          <span class="badge badge-blue">HS-PS2-1 • Piecewise Graphs</span>
          <div class="student-fields">
            <div><span class="field-label">Names:</span> <span class="field-line" style="min-width:180px;"></span></div>
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
        ${gridSvg}
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
          • <strong>Strategy A (Catch at rest stop at t = 50 s):</strong> Cruiser travels 300 m in 20 s (from t=30 to 50s). Required speed: <span class="inline-blank" style="min-width:70px;"></span> m/s<br>
          • <strong>Strategy B (Catch at t = 90 s):</strong> Cruiser travels 1,300 m in 60 s (from t=30 to 90s). Required speed: <span class="inline-blank" style="min-width:70px;"></span> m/s
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
      <span>Unit 2: Kinematics • Challenge 2</span>
      <span>Teacher: Mr. Mudry</span>
    </div>
  </div>

</body>
</html>
  `;
}

// =========================================================================
// WORKSHEET 3: SINGLE-PAGE MOUNTAIN RESCUE DISTANCE VS DISPLACEMENT
// =========================================================================
function renderSinglePageWorksheet3() {
  const gridSvg = generateCleanGrid({
    width: 690,
    height: 425,
    marginLeft: 62,
    marginBottom: 44,
    marginRight: 20,
    marginTop: 22,
    xMin: 0,
    xMax: 140,
    xMajor: 20,
    xMinor: 4,
    xLabel: "Elapsed Mission Time t (seconds)",
    yMin: 0,
    yMax: 2000,
    yMajor: 200,
    yMinor: 40,
    yLabel: "Distance Traveled d (meters)",
    title: "Distance vs. Time: Ground Rover vs. Autonomous Rescue Drone"
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Honors Physics: Mountain Rescue Relay</title>
  <style>${singlePageCss}</style>
</head>
<body>

  <div class="single-page">
    <div>
      <!-- Header -->
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Honors Physics: Alpine Rescue Relay</h1>
          <p class="sub">Unit 2: Scalar Path Distance vs. Vector Displacement &bull; Race Dynamics</p>
        </div>
        <div class="header-meta">
          <span class="badge badge-blue">HS-PS2-1 • Distance vs Time</span>
          <div class="student-fields">
            <div><span class="field-label">Names:</span> <span class="field-line" style="min-width:180px;"></span></div>
            <div><span class="field-label">Period:</span> <span class="field-line" style="min-width:35px;">0</span></div>
            <div><span class="field-label">Date:</span> <span class="field-line" style="min-width:65px;"></span></div>
          </div>
        </div>
      </div>

      <!-- Scenario -->
      <div class="scenario-container">
        <div class="scenario-title">Emergency Dispatch: Alpine Relief Operation</div>
        An injured climber activates a beacon at <strong>(800 m East, 600 m North)</strong> from Base Camp (origin = 0 m). Two rescue units depart at <strong>t = 0 s</strong>:<br>
        • <strong>Ground Rover Alpha:</strong> Must follow a curved switchback road with a total distance of <strong>1,800 meters</strong> at a steady speed of <strong>15.0 m/s</strong>.<br>
        • <strong>Rescue Drone Beta:</strong> Flies straight over the trees. Its straight-line displacement is <strong>1,000 meters</strong> (√(800² + 600²) = 1,000 m). It cruises at <strong>20.0 m/s</strong>, but must land on a ridge for a <strong>35-second thermal cooldown pause</strong> at the 500 m mark (from t = 25 s to 60 s).
      </div>

      <!-- Graphing Directives Bar -->
      <div class="task-bar">
        <span>✏️ <strong>Graphing Task:</strong> 1) Plot Rover line from (0s, 0m) to (120s, 1800m). 2) Plot Drone: 0-25s (up to 500m), flat line 25-60s (pause), 60-85s (up to 1000m).</span>
        <span class="badge badge-green">Race Telemetry</span>
      </div>

      <!-- Large Clean Grid Area -->
      <div class="graph-wrapper">
        ${gridSvg}
      </div>

      <!-- Questions from Graph -->
      <div class="questions-container">
        <div class="questions-title">
          <span>Graphical Analysis &amp; Margin of Victory</span>
          <span style="font-size:7.5pt; color:#64748b; font-weight:600;">Answer using your graph above</span>
        </div>

        <div class="q-item">
          <div class="q-prompt">1. Destination Arrival Times (From Graph):</div>
          At what time does Drone Beta reach its 1,000 m destination? <span class="inline-blank" style="min-width:60px;"></span> s &nbsp;|&nbsp;
          At what time does Rover Alpha reach its 1,800 m destination? <span class="inline-blank" style="min-width:60px;"></span> s
        </div>

        <div class="q-item">
          <div class="q-prompt">2. Margin of Victory:</div>
          Which vehicle reaches the climber first, and by how many seconds? <span class="inline-blank" style="min-width:110px;"></span> by <span class="inline-blank" style="min-width:50px;"></span> seconds
        </div>

        <div class="q-item">
          <div class="q-prompt">3. Path Distance vs. Net Displacement:</div>
          Why does the Rover travel 800 meters more distance than the Drone to reach the exact same destination?
          <div class="answer-line"></div>
        </div>

        <div class="q-item">
          <div class="q-prompt">4. Maximum Allowable Cooldown (Honors Critical Thinking):</div>
          What is the maximum duration the drone could spend cooling down on the ridge and still arrive at the climber before the rover? (Show math):
          <div class="answer-line"></div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-bar">
      <span>Orange High School • Period 0 Honors Physics</span>
      <span>Unit 2: Kinematics • Challenge 3</span>
      <span>Teacher: Mr. Mudry</span>
    </div>
  </div>

</body>
</html>
  `;
}

// =========================================================================
// SINGLE-PAGE TEACHER MASTER KEY
// =========================================================================
function renderSinglePageKey() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Teacher Master Key: Honors Kinematics Challenges</title>
  <style>
    @page { size: letter portrait; margin: 0.35in 0.45in; }
    body { font-family: "Inter", Arial, sans-serif; font-size: 8.5pt; line-height: 1.35; color: #0f172a; }
    .page { page-break-after: always; height: 10.2in; max-height: 10.2in; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
    .page:last-child { page-break-after: avoid; }
    .key-header { border-bottom: 2px solid #b91c1c; padding-bottom: 4px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { font-size: 13pt; margin: 0 0 2px 0; color: #b91c1c; text-transform: uppercase; font-weight: 900; }
    .badge { padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 7.5pt; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .card { border: 1.2px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; background: #ffffff; }
    .card-title { font-size: 9.5pt; font-weight: 800; color: #0f172a; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; display: flex; justify-content: space-between; }
    .ans-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 4px 8px; margin: 4px 0; font-family: monospace; font-size: 8.5pt; color: #166534; }
    .bold-lbl { font-weight: 700; color: #1e293b; }
    .footer { border-top: 1px solid #cbd5e1; padding-top: 3px; font-size: 7.5pt; color: #64748b; display: flex; justify-content: space-between; }
  </style>
</head>
<body>

  <!-- SINGLE MASTER REFERENCE PAGE -->
  <div class="page">
    <div>
      <div class="key-header">
        <div>
          <h1>TEACHER MASTER KEY: ALL 3 HONORS CHALLENGES</h1>
          <div style="font-size: 8pt; font-weight: 700; color: #475569;">Quick-Reference Answers, Coordinates &amp; Debrief Solutions</div>
        </div>
        <div><span class="badge">CONFIDENTIAL • MR. MUDRY</span></div>
      </div>

      <!-- CHALLENGE 1 -->
      <div class="card">
        <div class="card-title"><span>Challenge 1: Ship &amp; Drone Kinematic Rendezvous</span><span>Dock Origin (x = 0)</span></div>
        <p><span class="bold-lbl">Graphed Points:</span> Ship: (0s, 300m), (10s, 360m), (20s, 420m), (30s, 480m), (40s, 540m), (50s, 600m), (55s, 630m). Drone: (0 to 20s at 0m), (30s, 180m), (40s, 360m), (50s, 540m), (55s, 630m).</p>
        <div class="ans-box">
          • <strong>Rendezvous Coordinates:</strong> t = <strong>55.0 seconds</strong>, x = <strong>630.0 meters</strong> from dock.<br>
          • <strong>Slopes:</strong> Ship = +6.0 m/s &bull; Drone (after t=20s) = (540 - 0)/(50 - 20) = +18.0 m/s.<br>
          • <strong>Drone Flight Duration:</strong> 55 s - 20 s = <strong>35.0 seconds</strong> in the air.<br>
          • <strong>Battery Safety Audit:</strong> Round-trip = 630 m + 630 m = <strong>1,260 m</strong>. Battery limit is 1,200 m → <strong>FAIL (Will crash 60 m short of dock)</strong>.
        </div>
      </div>

      <!-- CHALLENGE 2 -->
      <div class="card">
        <div class="card-title"><span>Challenge 2: Tactical Highway Surveillance Intercept</span><span>Piecewise Motion</span></div>
        <p><span class="bold-lbl">Graphed Points:</span> Target: (0s, 0m) → (20s, 300m) [Leg 1] → (50s, 300m) [Leg 2, flat line] → (90s, 1300m) [Leg 3].</p>
        <div class="ans-box">
          • <strong>Rest Stop Meaning:</strong> Zero slope = zero velocity (car is stationary / not moving).<br>
          • <strong>Patrol Line A (Catch at Rest Stop at t=50s):</strong> Slope = (300 m - 0 m) / (50 s - 30 s) = 300 / 20 = <strong>15.0 m/s</strong>.<br>
          • <strong>Patrol Line B (Catch at Highway End at t=90s):</strong> Slope = (1,300 m - 0 m) / (90 s - 30 s) = 1,300 / 60 = <strong>21.7 m/s</strong>.<br>
          • <strong>Speed Limit Constraint (Cap = 20.0 m/s):</strong> Strategy A requires 15.0 m/s ≤ 20.0 m/s (<strong>VIABLE</strong>). Strategy B requires 21.7 m/s &gt; 20.0 m/s (<strong>TOO FAST / IMPOSSIBLE</strong>).
        </div>
      </div>

      <!-- CHALLENGE 3 -->
      <div class="card">
        <div class="card-title"><span>Challenge 3: Alpine Mountain Rescue Relay</span><span>Distance vs. Displacement</span></div>
        <p><span class="bold-lbl">Graphed Points:</span> Rover: (0s, 0m) → (120s, 1800m). Drone: (0s, 0m) → (25s, 500m) → (60s, 500m) [pause] → (85s, 1000m).</p>
        <div class="ans-box">
          • <strong>Arrival Times:</strong> Drone reaches 1,000 m at <strong>t = 85 seconds</strong> &bull; Rover reaches 1,800 m at <strong>t = 120 seconds</strong>.<br>
          • <strong>Margin of Victory:</strong> <strong>Drone Beta wins by 35.0 seconds</strong> (120 s - 85 s).<br>
          • <strong>Path Distance vs. Displacement:</strong> Rover travels winding switchback road (1,800 m); drone flies straight-line vector (1,000 m).<br>
          • <strong>Maximum Allowable Cooldown:</strong> Rover takes 120 s. Drone flies for 50 s total. 120 s - 50 s = <strong>70.0 seconds max pause</strong>.
        </div>
      </div>
    </div>

    <div class="footer">
      <span>Orange High School • Period 0 Honors Physics</span>
      <span>Teacher Single-Sheet Master Key</span>
      <span>Teacher: Mr. Mudry</span>
    </div>
  </div>

</body>
</html>
  `;
}

// Build runner
async function buildSinglePageWorksheets() {
  const outDir = path.join(__dirname, '../Unit_2/honors_worksheets');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const worksheets = [
    {
      name: 'Worksheet_1_Ship_Drone_Rendezvous',
      html: renderSinglePageWorksheet1()
    },
    {
      name: 'Worksheet_2_Highway_Surveillance_Intercept',
      html: renderSinglePageWorksheet2()
    },
    {
      name: 'Worksheet_3_Mountain_Rescue_Distance_Displacement',
      html: renderSinglePageWorksheet3()
    },
    {
      name: 'Teacher_Master_Key_All_3_Challenges',
      html: renderSinglePageKey()
    }
  ];

  console.log('🚀 Launching Puppeteer to compile Single-Page Worksheets & Key...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  for (const ws of worksheets) {
    const htmlPath = path.join(outDir, `${ws.name}.html`);
    const pdfPath = path.join(outDir, `${ws.name}.pdf`);

    fs.writeFileSync(htmlPath, ws.html, 'utf8');

    const page = await browser.newPage();
    await page.setContent(ws.html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: pdfPath,
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: '0.32in',
        bottom: '0.32in',
        left: '0.42in',
        right: '0.42in'
      }
    });

    await page.close();
    console.log(`✅ Generated Single-Page PDF: ${ws.name}.pdf`);
  }

  await browser.close();
  console.log('🎉 All 3 Single-Page Worksheets + Teacher Key compiled successfully!');
}

buildSinglePageWorksheets().catch(err => {
  console.error('❌ Error compiling single-page worksheets:', err);
  process.exit(1);
});

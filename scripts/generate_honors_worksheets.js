/**
 * Generates 3 High-Scaffolded Honors Physics Graphing Worksheets & PDFs
 * Unit 2: Kinematics & Velocity Vectors (Period 0 Honors Physics)
 * 
 * Strict compliance:
 * - No LaTeX notation (plain text Unicode: Δ, x₀, v₀, m/s, etc.)
 * - Letter size with crisp printable high-resolution SVG coordinate grids
 * - 2 pages per worksheet (Front: Scenario & Math modeling, Back: Full-width Graph & Analysis)
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function generateSvgGrid({
  width = 680,
  height = 460,
  marginLeft = 60,
  marginBottom = 50,
  marginRight = 30,
  marginTop = 30,
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
  title = "Position vs. Time Graph (x vs. t)",
  legendItems = []
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
        linesHtml += `<line x1="${px}" y1="${marginTop}" x2="${px}" y2="${marginTop + plotHeight}" stroke="#e2e8f0" stroke-width="0.75" />\n`;
      }
    }
  }

  // Minor Y lines
  if (yMinor) {
    for (let y = yMin; y <= yMax; y += yMinor) {
      if (Math.abs(y % yMajor) > 0.001) {
        const py = yScale(y);
        linesHtml += `<line x1="${marginLeft}" y1="${py}" x2="${marginLeft + plotWidth}" y2="${py}" stroke="#e2e8f0" stroke-width="0.75" />\n`;
      }
    }
  }

  // Major X lines & labels
  for (let x = xMin; x <= xMax; x += xMajor) {
    const px = xScale(x);
    linesHtml += `<line x1="${px}" y1="${marginTop}" x2="${px}" y2="${marginTop + plotHeight}" stroke="#94a3b8" stroke-width="1.2" />\n`;
    linesHtml += `<line x1="${px}" y1="${marginTop + plotHeight}" x2="${px}" y2="${marginTop + plotHeight + 5}" stroke="#475569" stroke-width="1.5" />\n`;
    linesHtml += `<text x="${px}" y="${marginTop + plotHeight + 18}" font-size="11" font-family="'Inter', Arial, sans-serif" font-weight="600" fill="#334155" text-anchor="middle">${x}</text>\n`;
  }

  // Major Y lines & labels
  for (let y = yMin; y <= yMax; y += yMajor) {
    const py = yScale(y);
    linesHtml += `<line x1="${marginLeft}" y1="${py}" x2="${marginLeft + plotWidth}" y2="${py}" stroke="#94a3b8" stroke-width="1.2" />\n`;
    linesHtml += `<line x1="${marginLeft - 5}" y1="${py}" x2="${marginLeft}" y2="${py}" stroke="#475569" stroke-width="1.5" />\n`;
    linesHtml += `<text x="${marginLeft - 9}" y="${py + 4}" font-size="11" font-family="'Inter', Arial, sans-serif" font-weight="600" fill="#334155" text-anchor="end">${y}</text>\n`;
  }

  // Axes
  const originX = xScale(xMin);
  const originY = yScale(yMin);

  linesHtml += `
    <!-- Axes -->
    <line x1="${originX}" y1="${marginTop - 10}" x2="${originX}" y2="${originY}" stroke="#0f172a" stroke-width="2.2" marker-end="url(#arrow-up)" />
    <line x1="${originX}" y1="${originY}" x2="${marginLeft + plotWidth + 15}" y2="${originY}" stroke="#0f172a" stroke-width="2.2" marker-end="url(#arrow-right)" />
    
    <!-- Axis Labels -->
    <text x="${marginLeft + plotWidth / 2}" y="${height - 10}" font-size="12" font-family="'Inter', Arial, sans-serif" font-weight="700" fill="#0f172a" text-anchor="middle">${xLabel}</text>
    <text transform="rotate(-90)" x="${-(marginTop + plotHeight / 2)}" y="18" font-size="12" font-family="'Inter', Arial, sans-serif" font-weight="700" fill="#0f172a" text-anchor="middle">${yLabel}</text>
    
    <!-- Title -->
    <text x="${marginLeft + plotWidth / 2}" y="18" font-size="13" font-family="'Inter', Arial, sans-serif" font-weight="800" fill="#0f172a" text-anchor="middle">${title}</text>
  `;

  // Optional legend box
  if (legendItems && legendItems.length > 0) {
    const legX = marginLeft + 15;
    const legY = marginTop + 15;
    const legW = 160;
    const legH = 20 + legendItems.length * 20;

    let legContent = `
      <rect x="${legX}" y="${legY}" width="${legW}" height="${legH}" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" opacity="0.95" />
      <text x="${legX + 10}" y="${legY + 15}" font-size="10" font-family="'Inter', Arial, sans-serif" font-weight="800" fill="#0f172a">KEY / LEGEND:</text>
    `;

    legendItems.forEach((item, idx) => {
      const iy = legY + 32 + idx * 18;
      legContent += `
        <line x1="${legX + 12}" y1="${iy - 4}" x2="${legX + 32}" y2="${iy - 4}" stroke="${item.color}" stroke-width="2.5" ${item.dash ? `stroke-dasharray="${item.dash}"` : ''} />
        <circle cx="${legX + 22}" cy="${iy - 4}" r="3" fill="${item.color}" />
        <text x="${legX + 38}" y="${iy}" font-size="10" font-family="'Inter', Arial, sans-serif" font-weight="600" fill="#1e293b">${item.label}</text>
      `;
    });

    linesHtml += legContent;
  }

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
      <!-- Plot Border Box -->
      <rect x="${marginLeft}" y="${marginTop}" width="${plotWidth}" height="${plotHeight}" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" />
      ${linesHtml}
    </svg>
  `;
}

// Common Shared Stylesheet
const commonCss = `
  @page {
    size: letter portrait;
    margin: 0.35in 0.45in 0.35in 0.45in;
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
    line-height: 1.35;
    font-size: 9.5pt;
  }

  .sheet-page {
    page-break-after: always;
    height: 10.1in;
    max-height: 10.1in;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }

  .sheet-page:last-child {
    page-break-after: avoid;
  }

  /* Header Box */
  .worksheet-header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 6px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .header-titles h1 {
    font-size: 14pt;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 2px 0;
    text-transform: uppercase;
    letter-spacing: -0.3px;
  }

  .header-titles .sub {
    font-size: 8.5pt;
    font-weight: 700;
    color: #0284c7;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .header-meta {
    font-size: 8.5pt;
    text-align: right;
  }

  .student-fields {
    display: flex;
    gap: 14px;
    margin-top: 4px;
  }

  .field-line {
    border-bottom: 1px solid #475569;
    min-width: 130px;
    display: inline-block;
  }

  .field-label {
    font-weight: 700;
    color: #334155;
  }

  /* Section Styling */
  .section-box {
    border: 1.5px solid #cbd5e1;
    border-radius: 6px;
    padding: 7px 10px;
    margin-bottom: 8px;
    background: #ffffff;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 3px;
  }

  .section-title {
    font-size: 10pt;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: -0.2px;
  }

  .badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
  }

  .badge-blue { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
  .badge-amber { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
  .badge-emerald { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }

  /* Scenario Box */
  .scenario-container {
    background: #f8fafc;
    border-left: 4px solid #0284c7;
    padding: 8px 12px;
    font-size: 9pt;
    margin-bottom: 8px;
    border-radius: 0 6px 6px 0;
  }

  .param-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 6px;
  }

  .param-card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 6px 8px;
    font-size: 8.5pt;
  }

  .param-card strong {
    color: #0f172a;
    display: block;
    margin-bottom: 2px;
  }

  /* Equation & Work Boxes */
  .math-step-box {
    border: 1px dashed #94a3b8;
    border-radius: 6px;
    padding: 6px 8px;
    margin-top: 4px;
    background: #fafafa;
    min-height: 52px;
  }

  .math-step-box.tall {
    min-height: 80px;
  }

  .step-prompt {
    font-weight: 700;
    color: #1e293b;
    font-size: 8.5pt;
    margin-bottom: 2px;
  }

  /* Data Table */
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
    font-size: 8.5pt;
  }

  table.data-table th, table.data-table td {
    border: 1px solid #cbd5e1;
    padding: 4px 6px;
    text-align: center;
  }

  table.data-table th {
    background: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
  }

  /* Graph Container */
  .graph-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 4px 0 6px 0;
  }

  /* Prompt list */
  .question-item {
    margin-bottom: 8px;
  }

  .question-item p {
    margin: 0 0 3px 0;
    font-weight: 600;
    font-size: 9pt;
    color: #0f172a;
  }

  .write-lines {
    border-bottom: 1px solid #94a3b8;
    height: 20px;
    width: 100%;
    margin-bottom: 4px;
  }

  .footer-bar {
    border-top: 1px solid #cbd5e1;
    padding-top: 4px;
    font-size: 7.5pt;
    color: #64748b;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

// =========================================================================
// WORKSHEET 1: RESCUE SHIP & DRONE RENDEZVOUS
// =========================================================================
function renderWorksheet1() {
  const gridSvg = generateSvgGrid({
    width: 680,
    height: 480,
    marginLeft: 60,
    marginBottom: 50,
    marginRight: 25,
    marginTop: 30,
    xMin: 0,
    xMax: 70,
    xMajor: 10,
    xMinor: 2,
    xLabel: "Mission Elapsed Time t (seconds)",
    yMin: 0,
    yMax: 800,
    yMajor: 100,
    yMinor: 20,
    yLabel: "Position From Harbor Dock x (meters)",
    title: "Position vs. Time Trajectory: Rescue Ship & Medical Drone",
    legendItems: [
      { label: "Rescue Ship: x(t) = 300 + 6.0·t", color: "#0284c7" },
      { label: "Medical Drone: x(t) = 18.0·(t - 20)", color: "#dc2626", dash: "4,3" },
      { label: "Rendezvous Node (t_meet, x_meet)", color: "#16a34a" }
    ]
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Honors Kinematics Challenge 1: Ship & Drone Rendezvous</title>
  <style>${commonCss}</style>
</head>
<body>

  <!-- PAGE 1: SCENARIO & MATHEMATICAL MODELING -->
  <div class="sheet-page">
    <div>
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Honors Physics: Kinematic Rendezvous Challenge</h1>
          <p class="sub">Unit 2: 1D Constant Velocity &amp; Delayed Intercept Modeling</p>
        </div>
        <div class="header-meta">
          <span class="badge badge-blue">HS-PS2-1 • SEP-5</span>
          <div class="student-fields">
            <div><span class="field-label">Names:</span> <span class="field-line" style="min-width:200px;"></span></div>
            <div><span class="field-label">Period:</span> <span class="field-line" style="min-width:40px;">0</span></div>
            <div><span class="field-label">Date:</span> <span class="field-line" style="min-width:70px;"></span></div>
          </div>
        </div>
      </div>

      <!-- Mission Briefing -->
      <div class="scenario-container">
        <strong>MISSION DIRECTIVE: HARBOR EMERGENCY MEDICAL AIR-DROP</strong><br>
        A marine research vessel has departed the harbor dock (designated as reference origin <strong>x = 0 m</strong>) and is steaming straight out into open waters. At mission start (<strong>t = 0 s</strong>), the vessel is already <strong>300 meters</strong> out from the dock and cruising steadily at <strong>v_ship = 6.0 m/s</strong>.<br>
        An urgent medical distress call requires dispatching an autonomous high-speed courier drone from the harbor dock (<strong>x_drone = 0 m</strong>). The drone cruises at a uniform speed of <strong>v_drone = 18.0 m/s</strong>, but requires a <strong>20-second flight-preflight delay</strong> (system reboot and rotor spin-up) before it launches from the dock at <strong>t = 20 s</strong>.
      </div>

      <div class="param-grid">
        <div class="param-card">
          <strong>🚢 Marine Research Vessel Telemetry</strong>
          • Reference Origin: Dock (x = 0 m)<br>
          • Initial Position at t = 0 s: <strong>x₀_ship = +300 m</strong><br>
          • Uniform Cruise Speed: <strong>v_ship = +6.0 m/s</strong><br>
          • Launch Delay: None (in motion at t = 0 s)
        </div>
        <div class="param-card">
          <strong>🚁 Autonomous Medical Drone Telemetry</strong>
          • Reference Origin: Dock (x = 0 m)<br>
          • Launch Position at t = 20 s: <strong>x₀_drone = 0 m</strong><br>
          • Uniform Cruise Speed: <strong>v_drone = +18.0 m/s</strong><br>
          • Preflight Delay: <strong>t_delay = 20.0 seconds</strong>
        </div>
      </div>

      <!-- Part 1: Algebraic Modeling -->
      <div class="section-box" style="margin-top:8px;">
        <div class="section-header">
          <span class="section-title">Part 1: Algebraic Kinematic Modeling &amp; Prediction</span>
          <span class="badge badge-amber">Team Algebraic Proof</span>
        </div>

        <div class="step-prompt">Step 1A: Formulate the continuous Position-Time equation for the Research Vessel:</div>
        <div class="math-step-box">
          Write x_ship(t) in terms of t: &nbsp;&nbsp;<strong>x_ship(t) = </strong> ____________________________________________
        </div>

        <div class="step-prompt" style="margin-top:6px;">Step 1B: Formulate the piecewise Position-Time equation for the Drone (for t ≥ 20 s):</div>
        <div class="math-step-box">
          Factored Form: <strong>x_drone(t) = 18.0 · (t - 20)</strong> &nbsp;&nbsp;→&nbsp;&nbsp; Expanded Form: <strong>x_drone(t) = </strong> ___________________________
        </div>

        <div class="step-prompt" style="margin-top:6px;">Step 1C: Equate positions (x_ship = x_drone) to solve for exact Rendezvous Time (t_meet) and Position (x_meet):</div>
        <div class="math-step-box tall">
          <em>Show step-by-step algebraic isolation of time t:</em><br><br><br>
          <strong>Rendezvous Time: t = </strong> ____________ seconds &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
          <strong>Rendezvous Position: x = </strong> ____________ meters from dock
        </div>
      </div>

      <!-- Part 2: Table of Values -->
      <div class="section-box">
        <div class="section-header">
          <span class="section-title">Part 2: Multi-Agent Coordinate Telemetry Table</span>
          <span class="badge badge-blue">Plotting Data Points</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>t = 0 s</th>
              <th>t = 10 s</th>
              <th>t = 20 s (Launch)</th>
              <th>t = 30 s</th>
              <th>t = 40 s</th>
              <th>t = 50 s</th>
              <th>t = 55 s (Meet)</th>
              <th>t = 60 s</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Ship Position x (m)</strong></td>
              <td>300 m</td>
              <td>360 m</td>
              <td>420 m</td>
              <td>480 m</td>
              <td>540 m</td>
              <td>600 m</td>
              <td>_______</td>
              <td>660 m</td>
            </tr>
            <tr>
              <td><strong>Drone Position x (m)</strong></td>
              <td><em>On Dock (0m)</em></td>
              <td><em>On Dock (0m)</em></td>
              <td>0 m</td>
              <td>180 m</td>
              <td>360 m</td>
              <td>540 m</td>
              <td>_______</td>
              <td>720 m</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer-bar">
      <span>Orange High School • Period 0 Honors Physics</span>
      <span>Page 1 of 2: Mathematical Derivation</span>
      <span>Unit 2: Kinematics &amp; Vector Intercept</span>
    </div>
  </div>

  <!-- PAGE 2: GRAPHING GRID & CRITICAL AUDIT -->
  <div class="sheet-page">
    <div>
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Part 3: Coordinate Trajectory Graph &amp; Flight Audit</h1>
          <p class="sub">Visual Proof of Rendezvous &bull; Slope Analysis &bull; Battery Feasibility</p>
        </div>
        <div class="header-meta">
          <span class="badge badge-emerald">Graphing &amp; Critical Thinking</span>
        </div>
      </div>

      <!-- Full Precision Graph Area -->
      <div class="graph-wrapper">
        ${gridSvg}
      </div>

      <!-- Part 4: Critical Engineering Analysis -->
      <div class="section-box">
        <div class="section-header">
          <span class="section-title">Part 4: Mission Engineering Audit &amp; Constraint Analysis</span>
          <span class="badge badge-amber">Honors Synthesis</span>
        </div>

        <div class="question-item">
          <p>1. Slope Comparison &amp; Visual Verification:</p>
          <div style="font-size:8.5pt; color:#334155; margin-bottom:2px;">
            Calculate the slope of each graphed line using (Δx / Δt). Does the intersection point on your graph exactly match your algebraic calculation from Page 1? Identify any differences:
          </div>
          <div class="write-lines"></div>
        </div>

        <div class="question-item">
          <p>2. Flight Duration vs. Mission Elapsed Time:</p>
          <div style="font-size:8.5pt; color:#334155; margin-bottom:2px;">
            The rendezvous occurs at mission clock t = 55 seconds. How many seconds was the drone actually flying in the air? Show the subtraction and explain why elapsed mission time differs from flight duration:
          </div>
          <div class="write-lines"></div>
        </div>

        <div class="question-item">
          <p>3. Battery Range Safety Audit (The Critical Failure Test):</p>
          <div style="font-size:8.5pt; color:#334155; margin-bottom:2px;">
            The drone's lithium-polymer battery pack certifies a maximum round-trip total flight distance of <strong>1,200 meters</strong> before complete depletion. Can the drone deliver the package to the ship at the rendezvous point and safely return to the dock? <strong>Prove your claim with numbers:</strong>
          </div>
          <div class="write-lines"></div>
          <div class="write-lines"></div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Orange High School • Period 0 Honors Physics</span>
      <span>Page 2 of 2: Graphing Verification &amp; Flight Safety Audit</span>
      <span>Teacher: Mr. Mudry</span>
    </div>
  </div>

</body>
</html>
  `;
}

// =========================================================================
// WORKSHEET 2: HIGHWAY SURVEILLANCE & PATROL INTERCEPT
// =========================================================================
function renderWorksheet2() {
  const gridSvg = generateSvgGrid({
    width: 680,
    height: 480,
    marginLeft: 65,
    marginBottom: 50,
    marginRight: 25,
    marginTop: 30,
    xMin: 0,
    xMax: 100,
    xMajor: 10,
    xMinor: 2,
    xLabel: "Time Elapsed t (seconds)",
    yMin: 0,
    yMax: 1500,
    yMajor: 150,
    yMinor: 30,
    yLabel: "Highway Position x (meters)",
    title: "Multi-Leg Piecewise Motion: Target Car vs. Highway Patrol Intercept",
    legendItems: [
      { label: "Target Car: 3-Leg Piecewise Journey", color: "#dc2626" },
      { label: "Patrol Option A: Rest Stop Intercept (v = 15.0 m/s)", color: "#0284c7", dash: "4,3" },
      { label: "Patrol Option B: Highway End Intercept (v = 21.7 m/s)", color: "#7c3aed" }
    ]
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Honors Kinematics Challenge 2: Highway Surveillance Intercept</title>
  <style>${commonCss}</style>
</head>
<body>

  <!-- PAGE 1: SCENARIO & MATHEMATICAL MODELING -->
  <div class="sheet-page">
    <div>
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Honors Physics: Tactical Highway Intercept</h1>
          <p class="sub">Unit 2: Piecewise 1D Motion, Rest Intervals &amp; Pursuit Velocity</p>
        </div>
        <div class="header-meta">
          <span class="badge badge-blue">HS-PS2-1 • Piecewise Graphs</span>
          <div class="student-fields">
            <div><span class="field-label">Names:</span> <span class="field-line" style="min-width:200px;"></span></div>
            <div><span class="field-label">Period:</span> <span class="field-line" style="min-width:40px;">0</span></div>
            <div><span class="field-label">Date:</span> <span class="field-line" style="min-width:70px;"></span></div>
          </div>
        </div>
      </div>

      <!-- Mission Briefing -->
      <div class="scenario-container">
        <strong>SURVEILLANCE DOSSIER: MULTI-STAGE RECONNAISSANCE TRACKING</strong><br>
        Highway traffic sensors and an overhead observation satellite track a suspect vehicle heading eastbound on a straight desert highway starting from coordinate <strong>x = 0 m</strong> at <strong>t = 0 s</strong>. The target's journey consists of three distinct kinematic legs:<br>
        • <strong>Leg 1 (t = 0 to 20 s):</strong> Drives at a steady speed of <strong>15.0 m/s</strong>.<br>
        • <strong>Leg 2 (t = 20 to 50 s):</strong> Pulls into an emergency turnout / rest stop and remains <strong>completely stationary (v = 0 m/s)</strong> for 30 seconds.<br>
        • <strong>Leg 3 (t = 50 to 90 s):</strong> Re-enters the highway and accelerates to a new uniform cruise speed of <strong>25.0 m/s</strong> for 40 seconds.<br>
        A Highway Patrol Interceptor is stationed at coordinate <strong>x = 0 m</strong>. Due to dispatch verification, the cruiser <strong>cannot roll until t = 30 seconds</strong>. Once dispatched, it travels at a single uniform speed.
      </div>

      <!-- Part 1: Segment Breakdown -->
      <div class="section-box">
        <div class="section-header">
          <span class="section-title">Part 1: Target Vehicle Segment Telemetry Breakdown</span>
          <span class="badge badge-amber">Displacement Calculations</span>
        </div>

        <div class="param-grid">
          <div class="param-card">
            <strong>Leg 1: Initial Highway Cruise (0 to 20 s)</strong>
            • Velocity: v₁ = +15.0 m/s &nbsp;&bull;&nbsp; Duration: Δt₁ = 20 s<br>
            • Displacement: Δx₁ = v₁ · Δt₁ = (15.0)(20) = <strong>+300 m</strong><br>
            • Coordinate at t = 20 s: <strong>(20 s, 300 m)</strong>
          </div>
          <div class="param-card">
            <strong>Leg 2: Rest Stop Turnout (20 to 50 s)</strong>
            • Velocity: v₂ = 0.0 m/s (At Rest) &nbsp;&bull;&nbsp; Duration: Δt₂ = 30 s<br>
            • Displacement: Δx₂ = 0 m<br>
            • Coordinate at t = 50 s: <strong>(50 s, 300 m)</strong>
          </div>
        </div>

        <div class="step-prompt" style="margin-top:6px;">Calculate Target Leg 3 Displacement &amp; Final Position:</div>
        <div class="math-step-box">
          Duration: Δt₃ = 90 s - 50 s = 40 s &nbsp;|&nbsp; Velocity: v₃ = +25.0 m/s<br>
          Displacement: Δx₃ = (v₃) · (Δt₃) = _________________________ = ____________ meters<br>
          Final Coordinate at t = 90 s: <strong>(90 s, ____________ m)</strong>
        </div>
      </div>

      <!-- Part 2: Cruiser Pursuit Windows -->
      <div class="section-box">
        <div class="section-header">
          <span class="section-title">Part 2: Highway Patrol Pursuit Strategies</span>
          <span class="badge badge-blue">Cruiser Dispatch: t = 30 s</span>
        </div>

        <div class="step-prompt">Strategy Alpha: Intercept the target while it is still stationary at the rest stop (at t = 50 s):</div>
        <div class="math-step-box">
          Available Time: Δt = 50 s - 30 s = <strong>20.0 seconds</strong> &nbsp;|&nbsp; Required Position: <strong>x = 300 meters</strong><br>
          Required Cruiser Constant Speed: <strong>v_alpha = Δx / Δt = </strong> ____________________________ = <strong>___________ m/s</strong>
        </div>

        <div class="step-prompt" style="margin-top:6px;">Strategy Beta: Intercept the target at the exact conclusion of Leg 3 (at t = 90 s):</div>
        <div class="math-step-box">
          Available Time: Δt = 90 s - 30 s = <strong>60.0 seconds</strong> &nbsp;|&nbsp; Required Position: <strong>x = 1,300 meters</strong><br>
          Required Cruiser Constant Speed: <strong>v_beta = Δx / Δt = </strong> ____________________________ = <strong>___________ m/s</strong>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Orange High School • Period 0 Honors Physics</span>
      <span>Page 1 of 2: Multi-Stage Kinematic Setup</span>
      <span>Unit 2: Kinematics &amp; Vector Intercept</span>
    </div>
  </div>

  <!-- PAGE 2: GRAPHING GRID & TACTICAL DEBRIEF -->
  <div class="sheet-page">
    <div>
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Part 3: Master Highway Trajectory Graph &amp; Analysis</h1>
          <p class="sub">Plotting Multi-Segment x-t Profiles &bull; Intersection Points &bull; Average vs. Instantaneous Speed</p>
        </div>
        <div class="header-meta">
          <span class="badge badge-emerald">High-Precision Graphing</span>
        </div>
      </div>

      <!-- Full Precision Graph Area -->
      <div class="graph-wrapper">
        ${gridSvg}
      </div>

      <!-- Part 4: Tactical Analysis -->
      <div class="section-box">
        <div class="section-header">
          <span class="section-title">Part 4: Graphical Analysis &amp; Speed Comparison</span>
          <span class="badge badge-amber">Honors Debrief</span>
        </div>

        <div class="question-item">
          <p>1. Slope Meaning on Position-Time Graph:</p>
          <div style="font-size:8.5pt; color:#334155; margin-bottom:2px;">
            Explain what the visual slope of the line represents during Leg 2 (t = 20 s to 50 s). How can a patrol officer tell instantly from an x-t graph that the target is stationary without looking at numbers?
          </div>
          <div class="write-lines"></div>
        </div>

        <div class="question-item">
          <p>2. Target Vehicle Overall Average Speed vs. Instantaneous Speeds:</p>
          <div style="font-size:8.5pt; color:#334155; margin-bottom:2px;">
            Calculate the target's <strong>Overall Average Speed</strong> across the entire 90-second mission (Total Distance / Total Time). Explain why this value is lower than both Leg 1 (15 m/s) and Leg 3 (25 m/s):
          </div>
          <div class="write-lines"></div>
          <div class="write-lines"></div>
        </div>

        <div class="question-item">
          <p>3. Speed Limit Constraint Analysis:</p>
          <div style="font-size:8.5pt; color:#334155; margin-bottom:2px;">
            The highway patrol interceptor has a maximum vehicle speed cap of <strong>20.0 m/s (45 mph)</strong>. Which of the two intercept strategies (Alpha or Beta) is physically possible? Defend with calculations:
          </div>
          <div class="write-lines"></div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Orange High School • Period 0 Honors Physics</span>
      <span>Page 2 of 2: Graphing Verification &amp; Tactical Analysis</span>
      <span>Teacher: Mr. Mudry</span>
    </div>
  </div>

</body>
</html>
  `;
}

// =========================================================================
// WORKSHEET 3: MOUNTAIN RESCUE DISTANCE VS DISPLACEMENT
// =========================================================================
function renderWorksheet3() {
  const gridSvg = generateSvgGrid({
    width: 680,
    height: 480,
    marginLeft: 65,
    marginBottom: 50,
    marginRight: 25,
    marginTop: 30,
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
    title: "Overland Mountain Rescue: Winding Road Distance vs. Drone Displacement",
    legendItems: [
      { label: "Ground Rover: 1,800 m Road (v = 15 m/s)", color: "#b45309" },
      { label: "Rescue Drone: 1,000 m Air Vector (with pause)", color: "#0284c7", dash: "4,3" },
      { label: "Target Climber Reached", color: "#16a34a" }
    ]
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Honors Kinematics Challenge 3: Mountain Rescue Race</title>
  <style>${commonCss}</style>
</head>
<body>

  <!-- PAGE 1: SCENARIO & MATHEMATICAL MODELING -->
  <div class="sheet-page">
    <div>
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Honors Physics: Alpine Rescue Relay</h1>
          <p class="sub">Unit 2: Scalar Path Distance vs. Vector Displacement &bull; Race Dynamics</p>
        </div>
        <div class="header-meta">
          <span class="badge badge-blue">HS-PS2-1 • Vectors &amp; Kinematics</span>
          <div class="student-fields">
            <div><span class="field-label">Names:</span> <span class="field-line" style="min-width:200px;"></span></div>
            <div><span class="field-label">Period:</span> <span class="field-line" style="min-width:40px;">0</span></div>
            <div><span class="field-label">Date:</span> <span class="field-line" style="min-width:70px;"></span></div>
          </div>
        </div>
      </div>

      <!-- Mission Briefing -->
      <div class="scenario-container">
        <strong>EMERGENCY DISPATCH: ALPINE MOUNTAIN RELIEF OPERATION</strong><br>
        A distress beacon is activated by an injured mountaineer located at coordinates <strong>(800 m East, 600 m North)</strong> from Base Camp (designated as origin <strong>0, 0</strong>). Two emergency response units depart Base Camp at the exact same moment (<strong>t = 0 s</strong>):<br>
        • <strong>All-Terrain Ground Rover Alpha:</strong> Must follow a treacherous, winding switchback canyon road to avoid ravines. The total odometer road distance is <strong>d_road = 1,800 meters</strong>. The rover maintains a maximum steady speed of <strong>v_rover = 15.0 m/s</strong> along the road.<br>
        • <strong>Autonomous Sky-Crane Drone Beta:</strong> Flies straight as an arrow directly from Base Camp over the forest canopy to the climber's coordinates at a cruise speed of <strong>v_drone = 20.0 m/s</strong>. However, due to high altitude rotor heating, the drone must land on a midway ridge for a mandatory <strong>35-second thermal cooldown pause</strong> (at the 500 m mark).
      </div>

      <!-- Part 1: Vector Displacement vs Scalar Distance -->
      <div class="section-box">
        <div class="section-header">
          <span class="section-title">Part 1: 2D Vector Displacement vs. 1D Scalar Distance</span>
          <span class="badge badge-amber">Pythagorean Theorem</span>
        </div>

        <div class="step-prompt">Step 1A: Calculate the straight-line displacement magnitude (Δr) for Drone Beta:</div>
        <div class="math-step-box">
          Components: Δx = 800 m (East), Δy = 600 m (North)<br>
          Δr = √[(Δx)² + (Δy)²] = √[(800)² + (600)²] = √[640,000 + 360,000] = √[1,000,000] = <strong>___________ meters</strong>
        </div>

        <div class="step-prompt" style="margin-top:6px;">Step 1B: Compare the path distances of both vehicles:</div>
        <div class="math-step-box">
          • Rover Alpha Total Path Distance (scalar): <strong>d = 1,800 meters</strong><br>
          • Drone Beta Total Path Distance (vector magnitude): <strong>Δr = 1,000 meters</strong><br>
          Why is the rover's path distance 800 meters greater than its net displacement? ___________________________________________
        </div>
      </div>

      <!-- Part 2: Travel Time Derivations -->
      <div class="section-box">
        <div class="section-header">
          <span class="section-title">Part 2: Step-by-Step Travel Time Calculations</span>
          <span class="badge badge-blue">Kinematic Derivation</span>
        </div>

        <div class="step-prompt">Step 2A: Calculate Rover Alpha's total transit time to reach the climber:</div>
        <div class="math-step-box">
          t_rover = (Total Road Distance) / (Rover Speed) = 1,800 m / (15.0 m/s) = <strong>___________ seconds</strong> ( _______ min)
        </div>

        <div class="step-prompt" style="margin-top:6px;">Step 2B: Calculate Drone Beta's multi-stage timeline (Leg 1 → Cooldown → Leg 2):</div>
        <div class="math-step-box tall">
          • Leg 1 Flight (0 to 500 m): t₁ = 500 m / 20.0 m/s = <strong>25.0 seconds</strong> (Clock time: 0 to 25 s)<br>
          • Thermal Battery Cooldown: Duration = <strong>35.0 seconds</strong> (Clock time: 25 s to 60 s)<br>
          • Leg 2 Flight (500 to 1,000 m): t₂ = 500 m / 20.0 m/s = <strong>25.0 seconds</strong> (Clock time: 60 s to 85 s)<br>
          <strong>Total Drone Arrival Time: t_drone = 25 s + 35 s + 25 s = </strong> <strong>___________ seconds</strong>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Orange High School • Period 0 Honors Physics</span>
      <span>Page 1 of 2: Path Distance &amp; Vector Displacement Modeling</span>
      <span>Unit 2: Kinematics &amp; Vector Intercept</span>
    </div>
  </div>

  <!-- PAGE 2: GRAPHING GRID & RACE AUDIT -->
  <div class="sheet-page">
    <div>
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Part 3: Distance vs. Time Graph &amp; Race Audit</h1>
          <p class="sub">Continuous vs. Staged Motion &bull; Margin of Victory &bull; Critical Thresholds</p>
        </div>
        <div class="header-meta">
          <span class="badge badge-emerald">Precision Distance Graphing</span>
        </div>
      </div>

      <!-- Full Precision Graph Area -->
      <div class="graph-wrapper">
        ${gridSvg}
      </div>

      <!-- Part 4: Critical Race Analysis -->
      <div class="section-box">
        <div class="section-header">
          <span class="section-title">Part 4: Mission Debrief &amp; Margin of Victory</span>
          <span class="badge badge-amber">Team Synthesis</span>
        </div>

        <div class="question-item">
          <p>1. Margin of Victory:</p>
          <div style="font-size:8.5pt; color:#334155; margin-bottom:2px;">
            Which vehicle delivers medical aid to the climber first? Calculate the exact margin of victory in seconds:
          </div>
          <div class="write-lines"></div>
        </div>

        <div class="question-item">
          <p>2. Interpreting the Flat Line on a Distance-Time Graph:</p>
          <div style="font-size:8.5pt; color:#334155; margin-bottom:2px;">
            On your graph, describe Drone Beta's trajectory between t = 25 s and t = 60 s. What does the zero slope represent physically, and how does distance accumulated change during this interval?
          </div>
          <div class="write-lines"></div>
        </div>

        <div class="question-item">
          <p>3. The Critical Breakdown Threshold (Honors Extension):</p>
          <div style="font-size:8.5pt; color:#334155; margin-bottom:2px;">
            Suppose high mountain winds increase the drone's thermal cooldown time. What is the <strong>maximum possible cooldown duration</strong> the drone could spend on the ridge and still arrive at the climber before the rover? <strong>Show your mathematical proof:</strong>
          </div>
          <div class="write-lines"></div>
          <div class="write-lines"></div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Orange High School • Period 0 Honors Physics</span>
      <span>Page 2 of 2: Graphing Verification &amp; Race Audit</span>
      <span>Teacher: Mr. Mudry</span>
    </div>
  </div>

</body>
</html>
  `;
}

// Main execution runner
async function main() {
  const outDir = path.join(__dirname, '../Unit_2/honors_worksheets');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const worksheets = [
    {
      name: 'Worksheet_1_Ship_Drone_Rendezvous',
      html: renderWorksheet1(),
      title: 'Challenge 1: Ship & Drone Rendezvous'
    },
    {
      name: 'Worksheet_2_Highway_Surveillance_Intercept',
      html: renderWorksheet2(),
      title: 'Challenge 2: Highway Surveillance Intercept'
    },
    {
      name: 'Worksheet_3_Mountain_Rescue_Distance_Displacement',
      html: renderWorksheet3(),
      title: 'Challenge 3: Mountain Rescue Distance vs. Displacement'
    }
  ];

  console.log('🚀 Launching Puppeteer for PDF generation...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  for (const ws of worksheets) {
    const htmlPath = path.join(outDir, `${ws.name}.html`);
    const pdfPath = path.join(outDir, `${ws.name}.pdf`);

    fs.writeFileSync(htmlPath, ws.html, 'utf8');
    console.log(`📄 Saved HTML: ${htmlPath}`);

    const page = await browser.newPage();
    await page.setContent(ws.html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: pdfPath,
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: '0.35in',
        bottom: '0.35in',
        left: '0.45in',
        right: '0.45in'
      }
    });

    console.log(`✅ Generated PDF: ${pdfPath}`);
    await page.close();
  }

  await browser.close();
  console.log('🎉 All 3 Honors Kinematics Worksheets generated successfully!');
}

main().catch(err => {
  console.error('❌ Error generating worksheets:', err);
  process.exit(1);
});

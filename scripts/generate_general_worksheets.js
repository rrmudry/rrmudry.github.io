/**
 * Generates General & Conceptual Physics Kinematics Graphing Challenges (Challenges 1 & 2)
 * Unit 2: Kinematics (General / Conceptual Physics)
 * 
 * Target Audience: General & Conceptual Physics (Periods 1-6)
 * - Header has blank "Period: _____" line (NO hardcoded period numbers)
 * - Scaffolding: Table-first coordinate plotting guidance, step-by-step slope reminders (rise/run)
 * - High accessibility, no complex algebra traps, clear visual cues
 * - Clean SVG coordinate grids
 * - Exactly 2 pages in PDF (Page 1 = Challenge 1: Coast Guard Rescue; Page 2 = Challenge 2: Highway Courier Intercept)
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
  xLabel = "Time Elapsed t (seconds)",
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

  // Major X lines & tick labels
  for (let x = xMin; x <= xMax; x += xMajor) {
    const px = xScale(x);
    linesHtml += `<line x1="${px.toFixed(1)}" y1="${marginTop}" x2="${px.toFixed(1)}" y2="${marginTop + plotHeight}" stroke="#94a3b8" stroke-width="1.25" />\n`;
    linesHtml += `<line x1="${px.toFixed(1)}" y1="${marginTop + plotHeight}" x2="${px.toFixed(1)}" y2="${marginTop + plotHeight + 4}" stroke="#475569" stroke-width="1.5" />\n`;
    linesHtml += `<text x="${px.toFixed(1)}" y="${marginTop + plotHeight + 16}" font-size="10.5" font-family="'Inter', Arial, sans-serif" font-weight="600" fill="#334155" text-anchor="middle">${x}</text>\n`;
  }

  // Major Y lines & tick labels
  for (let y = yMin; y <= yMax; y += yMajor) {
    const py = yScale(y);
    linesHtml += `<line x1="${marginLeft}" y1="${py.toFixed(1)}" x2="${marginLeft + plotWidth}" y2="${py.toFixed(1)}" stroke="#94a3b8" stroke-width="1.25" />\n`;
    linesHtml += `<line x1="${marginLeft - 4}" y1="${py.toFixed(1)}" x2="${marginLeft}" y2="${py.toFixed(1)}" stroke="#475569" stroke-width="1.5" />\n`;
    linesHtml += `<text x="${marginLeft - 7}" y="${(py + 3.5).toFixed(1)}" font-size="10.5" font-family="'Inter', Arial, sans-serif" font-weight="600" fill="#334155" text-anchor="end">${y}</text>\n`;
  }

  const cx = marginLeft + plotWidth / 2;

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
      <!-- Axes with Arrowheads -->
      <line x1="${marginLeft}" y1="${marginTop - 8}" x2="${marginLeft}" y2="${marginTop + plotHeight}" stroke="#0f172a" stroke-width="2.2" marker-end="url(#arrow-up)" />
      <line x1="${marginLeft}" y1="${marginTop + plotHeight}" x2="${marginLeft + plotWidth + 12}" y2="${marginTop + plotHeight}" stroke="#0f172a" stroke-width="2.2" marker-end="url(#arrow-right)" />
      
      <!-- Axis Labels -->
      <text x="${cx}" y="${height - 7}" font-size="11.5" font-family="'Inter', Arial, sans-serif" font-weight="700" fill="#0f172a" text-anchor="middle">${xLabel}</text>
      <text transform="rotate(-90)" x="-${(marginTop + plotHeight / 2).toFixed(1)}" y="17" font-size="11.5" font-family="'Inter', Arial, sans-serif" font-weight="700" fill="#0f172a" text-anchor="middle">${yLabel}</text>
      
      <!-- Title -->
      <text x="${cx}" y="${marginTop - 7}" font-size="12" font-family="'Inter', Arial, sans-serif" font-weight="800" fill="#0f172a" text-anchor="middle">${title}</text>
    </svg>
  `;
}

function renderGeneralWorksheet() {
  const printCss = `
  @page {
    size: letter portrait;
    margin: 0.30in 0.40in 0.30in 0.40in;
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
    line-height: 1.28;
    font-size: 8.8pt;
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
    padding-bottom: 4px;
    margin-bottom: 5px;
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
    flex: 1 1 50%;
    min-width: 0;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 7.5pt;
    line-height: 1.25;
  }

  .telemetry-pill strong {
    color: #0f172a;
    display: block;
    margin-bottom: 1px;
  }

  /* Data Table Helper */
  .data-table-helper {
    width: 100%;
    border-collapse: collapse;
    margin-top: 2px;
    font-size: 7.2pt;
    text-align: center;
  }

  .data-table-helper th {
    background: #e2e8f0;
    color: #1e293b;
    padding: 2px 4px;
    border: 1px solid #cbd5e1;
    font-weight: 700;
  }

  .data-table-helper td {
    padding: 2px 4px;
    border: 1px solid #cbd5e1;
    font-family: monospace;
    font-weight: 600;
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
    margin-bottom: 3px;
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
    margin: 0 0 3px 0;
  }

  /* Questions Box */
  .questions-container {
    border: 1.5px solid #cbd5e1;
    border-radius: 6px;
    padding: 5px 9px;
    background: #ffffff;
  }

  .questions-title {
    font-size: 8.3pt;
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
    margin-bottom: 3.5px;
    font-size: 8pt;
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
    height: 15px;
    width: 100%;
    margin-top: 2px;
  }

  .inline-blank {
    display: inline-block;
    border-bottom: 1px solid #475569;
    min-width: 70px;
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

  // Grid 1: Page 1 (Ship & Drone)
  const gridSvg1 = generateCleanGrid({
    width: 690,
    height: 375,
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
    title: "Position vs. Time: Rescue Boat & Emergency Drone"
  });

  // Grid 2: Page 2 (Highway Patrol)
  const gridSvg2 = generateCleanGrid({
    width: 690,
    height: 350,
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
    title: "Position vs. Time: Delivery Truck & Highway Patrol"
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Physics: Kinematic Motion &amp; Graphing Challenges 1 &amp; 2</title>
  <style>${printCss}</style>
</head>
<body>

  <!-- ============================================================ -->
  <!-- PAGE 1: CHALLENGE 1 (HARBOR RESCUE BOAT & DRONE RENDEZVOUS)   -->
  <!-- ============================================================ -->
  <div class="worksheet-page">
    <div>
      <!-- Header -->
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Physics: Kinematic Motion &amp; Graphing Challenge</h1>
          <p class="sub">Unit 2: Constant Speed, Coordinate Plotting &bull; Challenge 1 of 2</p>
        </div>
        <div class="header-meta">
          <span class="badge badge-blue">HS-PS2-1 • SEP-5</span>
          <div class="student-fields">
            <div><span class="field-label">Name:</span> <span class="field-line" style="min-width:180px;"></span></div>
            <div><span class="field-label">Period:</span> <span class="field-line" style="min-width:40px;"></span></div>
            <div><span class="field-label">Date:</span> <span class="field-line" style="min-width:65px;"></span></div>
          </div>
        </div>
      </div>

      <!-- Scenario with Scaffolded Plotting Table -->
      <div class="scenario-container">
        <div class="scenario-title">Mission Scenario 1: Harbor Coast Guard Air-Drop</div>
        A rescue boat leaves the harbor dock (<strong>x = 0 m</strong>) and cruises straight out to sea at a steady speed of <strong>6 m/s</strong>. At <strong>t = 0 s</strong>, the boat is already <strong>300 meters</strong> out.<br>
        A fast emergency drone is launched from the dock (<strong>x = 0 m</strong>). The drone must wait <strong>20 seconds</strong> for GPS lock, remaining on the dock (<strong>x = 0 m</strong> from t = 0 to 20 s), and then flies at a fast steady speed of <strong>18 m/s</strong> to deliver supplies.

        <div class="telemetry-row">
          <div class="telemetry-pill">
            <strong>🚢 Rescue Boat (Steady Speed = 6 m/s)</strong>
            Starts at 300 m at t = 0 s (+60 m every 10 s):
            <table class="data-table-helper">
              <tr><th>Time (s)</th><td>0</td><td>10</td><td>20</td><td>30</td><td>40</td><td>50</td><td>60</td></tr>
              <tr><th>Pos (m)</th><td>300</td><td>360</td><td>420</td><td>480</td><td>540</td><td>600</td><td>660</td></tr>
            </table>
          </div>
          <div class="telemetry-pill">
            <strong>🚁 Supply Drone (Delayed Takeoff, Speed = 18 m/s)</strong>
            Waits on dock (0 m) until t = 20 s, then adds +180 m every 10 s:
            <table class="data-table-helper">
              <tr><th>Time (s)</th><td>0</td><td>20</td><td>30</td><td>40</td><td>50</td><td>60</td></tr>
              <tr><th>Pos (m)</th><td>0</td><td>0</td><td>180</td><td>360</td><td>540</td><td>720</td></tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Graphing Directives Bar -->
      <div class="task-bar">
        <span>✏️ <strong>Graphing Step:</strong> Plot the coordinates from the tables above. Draw straight lines through the points. Circle the point where the two lines cross (meet)!</span>
        <span class="badge badge-green">Visual Graph Analysis</span>
      </div>

      <!-- Large Clean Grid Area -->
      <div class="graph-wrapper">
        ${gridSvg1}
      </div>

      <!-- Questions from Graph (Scaffolded for Conceptual / Regular Physics) -->
      <div class="questions-container">
        <div class="questions-title">
          <span>Graph Analysis Questions</span>
          <span style="font-size:7.5pt; color:#64748b; font-weight:600;">Use your graph above to find answers</span>
        </div>

        <div class="q-item">
          <div class="q-prompt">1. The Rendezvous Point (Where Lines Cross):</div>
          Look at where the Boat line and Drone line intersect on your graph:<br>
          • At what <strong>Time</strong> does the drone catch up to the boat? &nbsp;<span class="inline-blank"></span> seconds<br>
          • What is their <strong>Position</strong> (distance from dock) at that moment? &nbsp;<span class="inline-blank" style="min-width:80px;"></span> meters
        </div>

        <div class="q-item">
          <div class="q-prompt">2. Comparing Steepness &amp; Speed:</div>
          Which line is steeper on the graph (Boat or Drone)? <span class="inline-blank" style="min-width:65px;"></span> &nbsp;&bull;&nbsp; In physics, what does a <strong>steeper slope</strong> tell you about an object's speed?
          <div class="answer-line"></div>
        </div>

        <div class="q-item">
          <div class="q-prompt">3. Actual Flying Time:</div>
          The clock reads your meeting time when they meet, but the drone was waiting on the dock for the first 20 seconds. How many seconds was the drone actually flying in the air? (Meeting Time &minus; 20 s) = <span class="inline-blank"></span> seconds
        </div>

        <div class="q-item">
          <div class="q-prompt">4. Battery Range Check:</div>
          The drone battery allows a total round-trip distance of <strong>1,200 meters</strong> (to the boat and back to the dock). If the drone flies out to the meeting position and immediately flies back, what is its total round-trip distance (2 &times; position)? Can it make it back safely? Explain:
          <div class="answer-line"></div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-bar">
      <span>Physics • Motion &amp; Graphing Lab</span>
      <span>Challenge 1: Boat &amp; Drone Rendezvous &bull; Page 1 of 2</span>
      <span>Mr. Mudry's Physics</span>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- PAGE 2: CHALLENGE 2 (HIGHWAY COURIER & PATROL INTERCEPT)      -->
  <!-- ============================================================ -->
  <div class="worksheet-page">
    <div>
      <!-- Header -->
      <div class="worksheet-header">
        <div class="header-titles">
          <h1>Physics: Highway Motion &amp; Intercept Challenge</h1>
          <p class="sub">Unit 2: Moving, Stopping &amp; Speed Calculations &bull; Challenge 2 of 2</p>
        </div>
        <div class="header-meta">
          <span class="badge badge-blue">HS-PS2-1 • Motion Graphs</span>
          <div class="student-fields">
            <div><span class="field-label">Name:</span> <span class="field-line" style="min-width:180px;"></span></div>
            <div><span class="field-label">Period:</span> <span class="field-line" style="min-width:40px;"></span></div>
            <div><span class="field-label">Date:</span> <span class="field-line" style="min-width:65px;"></span></div>
          </div>
        </div>
      </div>

      <!-- Scenario with Scaffolded Plotting Table -->
      <div class="scenario-container">
        <div class="scenario-title">Mission Scenario 2: Highway Courier Journey &amp; Patrol Intercept</div>
        A delivery truck drives along a straight highway from the station (<strong>x = 0 m</strong>) in three distinct legs:<br>
        • <strong>Leg 1 (0 to 20 s):</strong> Drives forward at 15 m/s &rarr; Reaches <strong>x = 300 m</strong> at t = 20 s.<br>
        • <strong>Leg 2 (20 to 50 s):</strong> Stops at a rest area (speed = 0 m/s) &rarr; Remains at <strong>x = 300 m</strong> for 30 seconds.<br>
        • <strong>Leg 3 (50 to 90 s):</strong> Resumes driving at 25 m/s &rarr; Reaches <strong>x = 1,300 m</strong> at t = 90 s.

        <div class="telemetry-row">
          <div class="telemetry-pill">
            <strong>🚚 Delivery Truck Coordinates</strong>
            Plot these 4 checkpoints and connect with lines:
            <table class="data-table-helper">
              <tr><th>Time (s)</th><td>0</td><td>20</td><td>50</td><td>90</td></tr>
              <tr><th>Pos (m)</th><td>0</td><td>300</td><td>300</td><td>1,300</td></tr>
              <tr><th>Status</th><td>Start</td><td>Rest In</td><td>Rest Out</td><td>Finish</td></tr>
            </table>
          </div>
          <div class="telemetry-pill">
            <strong>🚓 Highway Patrol Intercept Lines</strong>
            Leaves station at <strong>t = 30 s</strong> (x = 0 m):
            <table class="data-table-helper">
              <tr><th>Target</th><th>Start Coordinate</th><th>Target Intercept</th></tr>
              <tr><td><strong>Line A</strong></td><td>(30 s, 0 m)</td><td>(50 s, 300 m) &bull; Rest Stop</td></tr>
              <tr><td><strong>Line B</strong></td><td>(30 s, 0 m)</td><td>(90 s, 1,300 m) &bull; Highway End</td></tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Graphing Directives Bar -->
      <div class="task-bar">
        <span>✏️ <strong>Graphing Step:</strong> 1) Plot the truck's 3-part journey. 2) Draw <strong>Patrol Line A</strong> (to rest stop). 3) Draw <strong>Patrol Line B</strong> (to end).</span>
        <span class="badge badge-green">Flat Line = Stopped</span>
      </div>

      <!-- Large Clean Grid Area -->
      <div class="graph-wrapper">
        ${gridSvg2}
      </div>

      <!-- Questions from Graph (Scaffolded for Conceptual / Regular Physics) -->
      <div class="questions-container">
        <div class="questions-title">
          <span>Graph Analysis Questions</span>
          <span style="font-size:7.5pt; color:#64748b; font-weight:600;">Use your graph and formulas to answer</span>
        </div>

        <div class="q-item">
          <div class="q-prompt">1. Understanding the Rest Stop (Flat Line):</div>
          What does the completely flat horizontal line between t = 20 s and t = 50 s tell you about the truck's motion? How do you know the truck is NOT moving?
          <div class="answer-line"></div>
        </div>

        <div class="q-item">
          <div class="q-prompt">2. Calculating Patrol Car Speeds (Speed = Distance / Time):</div>
          • <strong>Option A (Catch at rest stop):</strong> Car travels 300 m in 20 seconds (from 30 s to 50 s).<br>
          &nbsp;&nbsp;Speed = 300 m &divide; 20 s = <span class="inline-blank"></span> m/s<br>
          • <strong>Option B (Catch at end):</strong> Car travels 1,300 m in 60 seconds (from 30 s to 90 s).<br>
          &nbsp;&nbsp;Speed = 1,300 m &divide; 60 s = <span class="inline-blank"></span> m/s
        </div>

        <div class="q-item">
          <div class="q-prompt">3. Patrol Safe Speed Limit:</div>
          The patrol car has a maximum safe speed limit of <strong>20 m/s</strong> (about 45 mph). Which option can the patrol car safely choose (Option A or Option B)? Explain why using your speeds calculated above:
          <div class="answer-line"></div>
          <div class="answer-line"></div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-bar">
      <span>Physics • Motion &amp; Graphing Lab</span>
      <span>Challenge 2: Highway Intercept &bull; Page 2 of 2</span>
      <span>Mr. Mudry's Physics</span>
    </div>
  </div>

</body>
</html>
  `;
}

function renderGeneralKey() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Teacher Master Key: Physics Kinematics Challenges 1 &amp; 2</title>
  <style>
    @page { size: letter portrait; margin: 0.35in 0.45in; }
    body { font-family: "Inter", Arial, sans-serif; font-size: 8.5pt; line-height: 1.35; color: #0f172a; }
    .page { width: 100%; height: 10.2in; max-height: 10.2in; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
    .key-header { border-bottom: 2px solid #0284c7; padding-bottom: 4px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { font-size: 13pt; margin: 0 0 2px 0; color: #0284c7; text-transform: uppercase; font-weight: 900; }
    .badge { padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 7.5pt; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
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
          <h1>TEACHER MASTER KEY: GENERAL &amp; CONCEPTUAL PHYSICS</h1>
          <div style="font-size: 8pt; font-weight: 700; color: #475569;">Kinematics Graphing Challenges 1 &amp; 2 (Periods 1–6)</div>
        </div>
        <div><span class="badge">TEACHER KEY • MR. MUDRY</span></div>
      </div>

      <!-- CHALLENGE 1 KEY -->
      <div class="card">
        <div class="card-title"><span>Challenge 1: Harbor Boat &amp; Supply Drone Rendezvous</span><span>Page 1 of Student Sheet</span></div>
        <p><span class="bold-lbl">Plotted Points on Grid:</span><br>
          • <strong>Boat:</strong> (0s, 300m), (10s, 360m), (20s, 420m), (30s, 480m), (40s, 540m), (50s, 600m), (55s, 630m), (60s, 660m).<br>
          • <strong>Drone:</strong> (0 to 20s flat on dock at 0m), (30s, 180m), (40s, 360m), (50s, 540m), (55s, 630m), (60s, 720m).
        </p>
        <div class="ans-box">
          1. <strong>Rendezvous Coordinates:</strong> Time t = <strong>55 seconds</strong> &bull; Position x = <strong>630 meters</strong> from dock.<br>
          2. <strong>Steepness &amp; Speed:</strong> The <strong>Drone line is steeper</strong>. A steeper slope means a faster speed (covers more meters each second).<br>
          3. <strong>Actual Drone Flight Duration:</strong> 55 s &minus; 20 s delay = <strong>35 seconds</strong> in the air.<br>
          4. <strong>Battery Range Check:</strong> Round-trip distance = 630 m out + 630 m back = <strong>1,260 meters</strong>.<br>
             &rarr; Since max battery range is 1,200 m, <strong>No, the drone cannot make it back</strong> (crashes 60 m short of the dock).
        </div>
      </div>

      <!-- CHALLENGE 2 KEY -->
      <div class="card">
        <div class="card-title"><span>Challenge 2: Highway Courier Journey &amp; Patrol Intercept</span><span>Page 2 of Student Sheet</span></div>
        <p><span class="bold-lbl">Plotted Points on Grid:</span><br>
          • <strong>Delivery Truck:</strong> (0s, 0m) &rarr; (20s, 300m) &rarr; (50s, 300m, flat line) &rarr; (90s, 1,300m).<br>
          • <strong>Patrol Line A:</strong> Starts at (30s, 0m), connects to rest stop at (50s, 300m).<br>
          • <strong>Patrol Line B:</strong> Starts at (30s, 0m), connects to highway end at (90s, 1,300m).
        </p>
        <div class="ans-box">
          1. <strong>Understanding Rest Stop:</strong> The position stays at 300 m while time continues to tick forward (slope = 0 m/s). This proves the truck is stationary (stopped).<br>
          2. <strong>Patrol Car Speed Calculations:</strong><br>
             • <strong>Option A (Rest Stop at t = 50 s):</strong> Speed = 300 m / 20 s = <strong>15 m/s</strong>.<br>
             • <strong>Option B (Highway End at t = 90 s):</strong> Speed = 1,300 m / 60 s = <strong>21.7 m/s</strong>.<br>
          3. <strong>Patrol Safe Speed Limit (Max Limit = 20 m/s):</strong><br>
             • Option A needs 15 m/s (15 &le; 20 m/s) &rarr; <strong>SAFE &amp; POSSIBLE &check;</strong><br>
             • Option B needs 21.7 m/s (21.7 &gt; 20 m/s) &rarr; <strong>EXCEEDS SPEED LIMIT &cross;</strong><br>
             &rarr; The patrol car must choose <strong>Option A</strong> to intercept at the rest stop.
        </div>
      </div>
    </div>

    <div class="footer">
      <span>Orange High School • General &amp; Conceptual Physics (Periods 1–6)</span>
      <span>Teacher Single-Sheet Master Key (Challenges 1 &amp; 2)</span>
      <span>Teacher: Mr. Mudry</span>
    </div>
  </div>

</body>
</html>
  `;
}

async function run() {
  const outDir = path.join(__dirname, '../Unit_2/worksheets');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('🚀 Compiling General & Conceptual Physics Graphing Worksheet & Key...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  // 1. Combined Worksheet (Page 1 = Challenge 1, Page 2 = Challenge 2)
  const wsHtml = renderGeneralWorksheet();
  const wsHtmlPath = path.join(outDir, 'Kinematics_Graphing_Challenges_1_and_2.html');
  const wsPdfPath = path.join(outDir, 'Kinematics_Graphing_Challenges_1_and_2.pdf');
  fs.writeFileSync(wsHtmlPath, wsHtml, 'utf8');

  const page1 = await browser.newPage();
  await page1.setContent(wsHtml, { waitUntil: 'networkidle0' });
  await page1.pdf({
    path: wsPdfPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '0.30in', bottom: '0.30in', left: '0.40in', right: '0.40in' }
  });
  await page1.close();
  console.log(`✅ Generated General Physics 2-Page Worksheet PDF: ${wsPdfPath}`);

  // 2. Combined Teacher Key (1 Page)
  const keyHtml = renderGeneralKey();
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
  console.log('🎉 General & Conceptual Physics Worksheet & Master Key compiled successfully!');
}

run().catch(err => {
  console.error('❌ Error compiling general worksheet:', err);
  process.exit(1);
});

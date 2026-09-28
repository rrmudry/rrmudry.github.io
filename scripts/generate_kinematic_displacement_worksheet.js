/**
 * Script: generate_kinematic_displacement_worksheet.js
 * Generates 2-Page Honors Physics Worksheet & Teacher Master Key for:
 * x_f = x_0 + v_0·t + 1/2·a·t^2
 * 
 * Revisions:
 * - Proper HTML subscripts (<sub>f</sub>, <sub>0</sub>, <sub>coast</sub>, etc.) - NO underscores!
 * - Utilizes the full vertical space of the page with expanded student workspaces (min-height: 58-65px).
 * - Exact 2-page Letter budget per document.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function getBaseStyles() {
  return `
    @page {
      size: letter portrait;
      margin: 0.24in 0.36in 0.24in 0.36in;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.3;
      font-size: 8.8pt;
    }
    .worksheet-page {
      width: 100%;
      height: 10.50in;
      max-height: 10.50in;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      page-break-after: always;
      position: relative;
    }
    .worksheet-page:last-child {
      page-break-after: avoid;
    }
    .page-content {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1 1 auto;
      margin-bottom: 4px;
    }
    /* Headers */
    .worksheet-header {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 4px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-titles h1 {
      font-size: 13.5pt;
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
      letter-spacing: 0.4px;
    }
    .header-meta {
      font-size: 8.2pt;
      text-align: right;
    }
    .student-fields {
      display: flex;
      gap: 14px;
      margin-top: 4px;
    }
    .field-line {
      border-bottom: 1.5px solid #475569;
      display: inline-block;
    }
    .field-label {
      font-weight: 700;
      color: #334155;
    }
    .mini-header {
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
    }
    /* Formula Reference Banner */
    .formula-banner {
      background: #f8fafc;
      border: 1.5px solid #0284c7;
      border-radius: 6px;
      padding: 6px 10px;
      margin-bottom: 7px;
    }
    .formula-main-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 5px;
    }
    .formula-title {
      font-weight: 800;
      font-size: 8.8pt;
      color: #0f172a;
      text-transform: uppercase;
    }
    .formula-math {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5pt;
      font-weight: 800;
      color: #0284c7;
      letter-spacing: 0.4px;
    }
    .anatomy-cols {
      display: grid;
      grid-template-columns: 1fr 1.35fr 1.35fr 1.4fr;
      gap: 7px;
      font-size: 7.5pt;
    }
    .anatomy-col {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 4px 6px;
    }
    .anatomy-col strong {
      display: block;
      color: #0f172a;
      margin-bottom: 2px;
      font-size: 7.7pt;
    }
    /* Section Titles */
    .section-bar {
      background: #0f172a;
      color: #ffffff;
      font-size: 8.2pt;
      font-weight: 800;
      padding: 3.5px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      display: flex;
      justify-content: space-between;
    }
    /* Problem Box Cards */
    .problem-box {
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 9px;
      margin-bottom: 6px;
      background: #ffffff;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .problem-prompt {
      font-size: 8.5pt;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 5px;
      line-height: 1.28;
    }
    .problem-prompt strong.q-num {
      color: #0284c7;
      font-weight: 800;
    }
    /* GUESS Workspace Grid */
    .guess-grid {
      display: grid;
      grid-template-columns: 1.05fr 1.15fr 1.8fr 1.35fr;
      gap: 7px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 5px;
      padding: 5px 7px;
      font-size: 7.8pt;
      flex: 1 1 auto;
    }
    .guess-cell {
      display: flex;
      flex-direction: column;
    }
    .guess-tag {
      font-size: 7pt;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 3px;
      letter-spacing: 0.2px;
    }
    .workspace-area {
      min-height: 52px;
      position: relative;
      line-height: 1.35;
      flex: 1 1 auto;
    }
    .workspace-area.tall {
      min-height: 60px;
    }
    .answer-box {
      border: 1.5px solid #0f172a;
      border-radius: 4px;
      background: #ffffff;
      padding: 4px 6px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 26px;
    }
    .answer-box-label {
      font-size: 7pt;
      color: #64748b;
      font-family: 'Outfit', sans-serif;
      text-transform: uppercase;
      font-weight: 800;
    }
    /* Teacher Key Styles */
    .key-text {
      color: #b91c1c;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 7.8pt;
    }
    .key-box-val {
      color: #b91c1c;
      font-weight: 800;
      font-size: 9pt;
    }
    /* Note Box */
    .note-pill {
      background: #eff6ff;
      border-left: 3.5px solid #0284c7;
      padding: 4px 8px;
      font-size: 7.6pt;
      color: #1e3a8a;
      margin-bottom: 6px;
      border-radius: 0 4px 4px 0;
    }
    .note-pill strong {
      color: #0284c7;
    }
    .note-pill.warning {
      background: #fffbeb;
      border-left-color: #d97706;
      color: #92400e;
    }
    .note-pill.warning strong {
      color: #d97706;
    }
    /* Multi-stage layout */
    .stages-flex {
      display: grid;
      grid-template-columns: 1fr 1fr 1.25fr;
      gap: 7px;
      margin-top: 4px;
      flex: 1 1 auto;
    }
    .stage-card {
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 5px;
      padding: 5px 7px;
      font-size: 7.6pt;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .stage-title {
      font-weight: 800;
      color: #0284c7;
      margin-bottom: 3px;
      font-size: 7.6pt;
      text-transform: uppercase;
    }
    /* Footer */
    .worksheet-footer {
      border-top: 1.5px solid #cbd5e1;
      padding-top: 3px;
      display: flex;
      justify-content: space-between;
      font-size: 7.2pt;
      color: #64748b;
    }
    sub {
      font-size: 0.75em;
      line-height: 0;
      position: relative;
      vertical-align: baseline;
      bottom: -0.25em;
    }
  `;
}

function renderStudentWorksheet() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Honors Physics: Constant Acceleration & Kinematic Displacement</title>
  <style>
    ${getBaseStyles()}
  </style>
</head>
<body>

  <!-- ====================================================================
       PAGE 1: Foundations, Rest Launch & Forward Acceleration
       ==================================================================== -->
  <div class="worksheet-page">
    <div class="page-content">
      <!-- Header -->
      <header class="worksheet-header">
        <div class="header-titles">
          <h1>Honors Physics: Constant Acceleration &amp; Displacement</h1>
          <p class="sub">Unit 2: 1D Kinematics &bull; Mastering Quadratic Motion: x<sub>f</sub> = x₀ + v₀t + ½at²</p>
        </div>
        <div class="header-meta">
          <div><strong>Mr. Mudry</strong> &bull; Period 0 Honors</div>
          <div class="student-fields">
            <div><span class="field-label">Name:</span> <span class="field-line" style="width: 155px;">&nbsp;</span></div>
            <div><span class="field-label">Date:</span> <span class="field-line" style="width: 75px;">&nbsp;</span></div>
          </div>
        </div>
      </header>

      <!-- Formula Anatomy Reference Box -->
      <div class="formula-banner">
        <div class="formula-main-row">
          <div class="formula-title">📐 The 3 Physical Components of Kinematic Displacement</div>
          <div class="formula-math">x<sub>f</sub> = x₀ + v₀t + ½at²</div>
        </div>
        <div class="anatomy-cols">
          <div class="anatomy-col">
            <strong>1. x₀ (Origin Offset)</strong>
            Starting coordinate position at t = 0 s. Standard reference value is 0 m unless scenario defines an initial mark.
          </div>
          <div class="anatomy-col">
            <strong>2. v₀ &middot; t (Inertial Coasting)</strong>
            Displacement covered if velocity remained constant (geometric rectangle on v-t graph).
          </div>
          <div class="anatomy-col">
            <strong>3. ½ &middot; a &middot; t² (Acceleration Bonus)</strong>
            Additional distance gained (or lost) due to changing velocity (geometric triangle on v-t).
          </div>
          <div class="anatomy-col">
            <strong>⚡ Why is Time Squared (t²)?</strong>
            Velocity increases with time (v = at), AND distance = avg speed &times; time &rarr; t &times; t = t²!
          </div>
        </div>
      </div>

      <!-- SECTION 1: Accelerating From Rest -->
      <div class="section-bar">
        <span>Part 1: Accelerating From Rest (v₀ = 0, x₀ = 0 &rArr; x<sub>f</sub> = ½at²)</span>
        <span>Tier 1: Foundation</span>
      </div>

      <!-- Problem 1 -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num">Problem 1 &bull; Top Fuel Dragster:</strong> A nitromethane dragster launches from a dead stop (v₀ = 0 m/s) with a brutal, constant forward acceleration of <strong>a = +28.0 m/s²</strong> for <strong>t = 3.20 seconds</strong>.
        </div>
        <div class="guess-grid">
          <div class="guess-cell">
            <span class="guess-tag">Givens &amp; Unknown</span>
            <div class="workspace-area tall">
              v₀ = <br>
              a = <br>
              t = <br>
              x<sub>f</sub> = ?
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Formula Selected</span>
            <div class="workspace-area tall">
              x<sub>f</sub> = x₀ + v₀t + ½at²<br>
              <em>(Simplify for v₀ = 0)</em>
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Substitution with Units</span>
            <div class="workspace-area tall">
              x<sub>f</sub> = ½ (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)²<br><br>
              x<sub>f</sub> = 
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Calculated Output</span>
            <div class="workspace-area tall">
              <div class="answer-box" style="margin-top: 14px;">
                <span class="answer-box-label">Distance:</span>
                <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; m</span>
              </div>
            </div>
          </div>
        </div>
        <div style="font-size: 7.4pt; color: #475569; margin-top: 4px;">
          <em>Follow-up:</em> The official NHRA dragstrip length is <strong>305 meters</strong> (1,000 ft). Has the car crossed the finish line at 3.20 s? [ &nbsp; ] YES &nbsp;&nbsp; [ &nbsp; ] NO &mdash; Explain: ___________________________________________________________
        </div>
      </div>

      <!-- Problem 2 -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num">Problem 2 &bull; Superconducting Maglev Departure:</strong> A high-speed magnetic levitation bullet train accelerates smoothly from rest out of Tokyo Station at <strong>a = +1.25 m/s²</strong> for <strong>t = 24.0 seconds</strong> before reaching cruising speed. Calculate the distance traveled during this acceleration run.
        </div>
        <div class="guess-grid">
          <div class="guess-cell">
            <span class="guess-tag">Givens &amp; Unknown</span>
            <div class="workspace-area tall">
              v₀ = <br>
              a = <br>
              t = <br>
              x<sub>f</sub> = ?
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Formula Setup</span>
            <div class="workspace-area tall">
              x<sub>f</sub> = ½at²
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Substitution &amp; Arithmetic Steps</span>
            <div class="workspace-area tall">
              x<sub>f</sub> = ½ (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)²<br><br>
              x<sub>f</sub> = 
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Final Boxed Answer</span>
            <div class="workspace-area tall">
              <div class="answer-box" style="margin-top: 14px;">
                <span class="answer-box-label">Distance:</span>
                <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2: Accelerating with Initial Velocity -->
      <div class="section-bar" style="margin-top: 6px;">
        <span>Part 2: Accelerating With Initial Forward Speed (v₀ &gt; 0, a &gt; 0)</span>
        <span>Tier 2: Intermediate</span>
      </div>

      <div class="note-pill">
        <strong>Dual Component Strategy:</strong> When an object is already in motion, compute the two terms independently: <em>Coasting Distance</em> (v₀ &middot; t) + <em>Acceleration Bonus</em> (½at²), then sum them.
      </div>

      <!-- Problem 3 -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num">Problem 3 &bull; Highway Passing Maneuver:</strong> A sports car cruises behind a semi-truck at a steady <strong>v₀ = +18.0 m/s</strong> (40 mph). Opening the throttle, the driver accelerates at <strong>a = +3.50 m/s²</strong> for <strong>t = 4.00 seconds</strong> to pass.
        </div>
        <div class="guess-grid" style="grid-template-columns: 0.9fr 1.4fr 1.7fr 1.3fr;">
          <div class="guess-cell">
            <span class="guess-tag">Givens</span>
            <div class="workspace-area tall">
              v₀ = +18.0 m/s<br>
              a = +3.50 m/s²<br>
              t = 4.00 s<br>
              x<sub>f</sub> = ?
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Coasting Term (v₀t)</span>
            <div class="workspace-area tall">
              d<sub>coast</sub> = (18.0 m/s)(4.00 s)<br><br>
              d<sub>coast</sub> = <strong>___________ m</strong>
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Accel Bonus Term (½at²)</span>
            <div class="workspace-area tall">
              d<sub>accel</sub> = ½ (3.50 m/s²)(4.00 s)²<br>
              d<sub>accel</sub> = ½ (3.50)(16.0)<br>
              d<sub>accel</sub> = <strong>___________ m</strong>
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Total Distance x<sub>f</sub></span>
            <div class="workspace-area tall">
              <div class="answer-box" style="margin-top: 14px;">
                <span class="answer-box-label">Total x<sub>f</sub>:</span>
                <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Problem 4 -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num">Problem 4 &bull; Commercial Jetliner Takeoff Roll:</strong> A twin-engine jet enters the runway threshold already rolling at <strong>v₀ = +10.0 m/s</strong> (22 mph). The pilot sets full takeoff thrust, producing a constant acceleration of <strong>a = +2.20 m/s²</strong> for <strong>t = 28.0 seconds</strong> until rotation (liftoff). Calculate the total runway length consumed.
        </div>
        <div class="guess-grid">
          <div class="guess-cell">
            <span class="guess-tag">Givens &amp; Unknown</span>
            <div class="workspace-area tall">
              v₀ = <br>
              a = <br>
              t = <br>
              x<sub>f</sub> = ?
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Algebraic Formula</span>
            <div class="workspace-area tall">
              x<sub>f</sub> = v₀t + ½at²
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Step-by-Step Substitution</span>
            <div class="workspace-area tall">
              x<sub>f</sub> = (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) + ½(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)²<br><br>
              x<sub>f</sub> = (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; m) + (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; m)
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Liftoff Distance</span>
            <div class="workspace-area tall">
              <div class="answer-box" style="margin-top: 14px;">
                <span class="answer-box-label">Runway:</span>
                <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page 1 Footer -->
    <footer class="worksheet-footer">
      <span>Honors Physics &bull; Unit 2: Kinematics</span>
      <span>Page 1 of 2 &bull; Turn Over for Deceleration &amp; Multi-Stage Synthesis &rarr;</span>
      <span>Mr. Mudry's Physics Classroom</span>
    </footer>
  </div>

  <!-- ====================================================================
       PAGE 2: Braking / Deceleration, Multi-Stage Scenarios & Graphical Proof
       ==================================================================== -->
  <div class="worksheet-page">
    <div class="page-content">
      <!-- Mini Header -->
      <div class="mini-header">
        <span>Honors Physics &bull; Kinematic Displacement Workshop</span>
        <span>Page 2 of 2 &bull; Emergency Braking &amp; Honors Synthesis</span>
        <span>Period 0 Honors</span>
      </div>

      <!-- SECTION 3: Deceleration & Braking -->
      <div class="section-bar">
        <span>Part 3: Deceleration &amp; Emergency Braking (a &lt; 0)</span>
        <span>Tier 3: Sign Discipline</span>
      </div>

      <div class="note-pill warning">
        <strong>⚠️ Crucial Sign Rule:</strong> When brakes apply, acceleration points backwards opposite to motion (<strong>a &lt; 0</strong>). The ½at² term becomes <em>negative</em> and <strong>subtracts</strong> distance from what the vehicle would have coasted!
      </div>

      <!-- Problem 5 -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num">Problem 5 &bull; Interstate Emergency Braking:</strong> A sedan travels at highway speed <strong>v₀ = +32.0 m/s</strong> (72 mph). The driver observes stopped traffic and slams the brakes, causing an emergency deceleration of <strong>a = &minus;6.50 m/s²</strong> for <strong>t = 4.00 seconds</strong>.
        </div>
        <div class="guess-grid" style="grid-template-columns: 1fr 1.2fr 1.8fr 1.3fr;">
          <div class="guess-cell">
            <span class="guess-tag">Givens (Watch Signs!)</span>
            <div class="workspace-area tall">
              v₀ = +32.0 m/s<br>
              a = &minus;6.50 m/s²<br>
              t = 4.00 s<br>
              x<sub>f</sub> = ?
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Equation Setup</span>
            <div class="workspace-area tall">
              x<sub>f</sub> = v₀t + ½at²<br>
              <em>(Note minus sign!)</em>
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Calculation Steps</span>
            <div class="workspace-area tall">
              x<sub>f</sub> = (32.0)(4.00) + ½(&minus;6.50)(4.00)²<br><br>
              x<sub>f</sub> = (128.0 m) &minus; (52.0 m)
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Skid Distance x<sub>f</sub></span>
            <div class="workspace-area tall">
              <div class="answer-box" style="margin-top: 14px;">
                <span class="answer-box-label">Braking x<sub>f</sub>:</span>
                <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Problem 6 -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num">Problem 6 &bull; Aircraft Carrier Arrested Trap:</strong> An F/A-18 Hornet touches down on the flight deck at <strong>v₀ = +70.0 m/s</strong> (157 mph). The arresting tailhook catches the cross-deck pendant cable wire, exerting violent deceleration of <strong>a = &minus;24.5 m/s²</strong> for <strong>t = 2.40 seconds</strong>. Calculate the flight deck trap distance consumed.
        </div>
        <div class="guess-grid">
          <div class="guess-cell">
            <span class="guess-tag">Givens &amp; Unknown</span>
            <div class="workspace-area tall">
              v₀ = <br>
              a = <br>
              t = <br>
              x<sub>f</sub> = ?
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Equation Setup</span>
            <div class="workspace-area tall">
              x<sub>f</sub> = v₀t + ½at²
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Step-by-Step Substitution</span>
            <div class="workspace-area tall">
              x<sub>f</sub> = (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) + ½(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)²<br><br>
              x<sub>f</sub> = (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; m) &minus; (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; m)
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Trap Distance</span>
            <div class="workspace-area tall">
              <div class="answer-box" style="margin-top: 14px;">
                <span class="answer-box-label">Deck Run:</span>
                <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 4: Honors Synthesis & Multi-Stage Decision -->
      <div class="section-bar" style="margin-top: 5px;">
        <span>Part 4: Multi-Stage Kinematics &bull; Driver Reaction &amp; Collision Avoidance</span>
        <span>Tier 4: Synthesis</span>
      </div>

      <!-- Problem 7 -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num">Problem 7 &bull; Wildlife Obstacle Avoidance:</strong> An autonomous vehicle cruises along a dark mountain road at <strong>v₀ = +24.0 m/s</strong> (54 mph). At t = 0 s, sensors detect a fallen tree trunk blocking the road <strong>62.0 meters</strong> ahead!
        </div>

        <div class="stages-flex">
          <!-- Stage 1 -->
          <div class="stage-card">
            <div class="stage-title">Stage 1: Neural / Sensor Delay</div>
            <div>The computer processes the lidar image for <strong>t₁ = 0.50 s</strong>. During this delay, <strong>a = 0 m/s²</strong> (constant speed).</div>
            <div style="margin-top: 6px; border-top: 1.5px dashed #cbd5e1; padding-top: 5px;">
              d₁ = v₀ &middot; t₁ = (24.0 m/s)(0.50 s)<br><br>
              <strong>d₁ = ___________ m</strong>
            </div>
          </div>

          <!-- Stage 2 -->
          <div class="stage-card">
            <div class="stage-title">Stage 2: Emergency ABS Braking</div>
            <div>Brakes engage at maximum friction: <strong>a = &minus;8.00 m/s²</strong> for <strong>t₂ = 3.00 s</strong> until coming to a complete rest.</div>
            <div style="margin-top: 6px; border-top: 1.5px dashed #cbd5e1; padding-top: 5px;">
              d₂ = v₀t₂ + ½at₂²<br>
              d₂ = (24.0)(3.00) + ½(&minus;8.00)(3.00)²<br>
              <strong>d₂ = ___________ m</strong>
            </div>
          </div>

          <!-- Stage 3 -->
          <div class="stage-card" style="border-color: #0284c7; background: #ffffff;">
            <div class="stage-title" style="color: #0f172a;">Stage 3: Decision &amp; Margin</div>
            <div>Total stopping distance:<br><strong>d<sub>total</sub> = d₁ + d₂ = ___________ m</strong></div>
            <div style="margin-top: 6px; font-weight: 700; line-height: 1.35;">
              Does the car stop before the tree (62.0 m)?<br>
              [ &nbsp; ] SAFELY STOPS &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] CRASHES<br>
              Safety Clearance Margin: <strong>&plusmn; ___________ m</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 5: Graphical Connection -->
      <div class="section-bar" style="margin-top: 5px;">
        <span>Part 5: Geometric Integration &bull; Connecting x<sub>f</sub> = v₀t + ½at² to Velocity-Time Graphs</span>
        <span>DOK 3</span>
      </div>

      <!-- Problem 8 -->
      <div class="problem-box" style="margin-bottom: 0;">
        <div class="problem-prompt">
          <strong class="q-num">Problem 8 &bull; Geometric Area Proof:</strong> Refer back to <strong>Problem 3</strong> (Sports car: v₀ = 18 m/s, accelerating at a = 3.5 m/s² for 4.0 s to v<sub>f</sub> = 32 m/s). On the grid below, draw the line from (0 s, 18 m/s) to (4 s, 32 m/s). Shade the <strong>Rectangle</strong> and <strong>Triangle</strong> underneath.
        </div>
        <div style="display: flex; gap: 12px; align-items: center; margin-top: 4px; flex: 1 1 auto;">
          <!-- SVG v-t graph -->
          <div style="flex: 0 0 290px;">
            <svg width="290" height="142" viewBox="0 0 290 142" xmlns="http://www.w3.org/2000/svg" style="border: 1.5px solid #cbd5e1; border-radius: 5px; background: #ffffff;">
              <!-- Grid lines -->
              <line x1="40" y1="16" x2="40" y2="114" stroke="#0f172a" stroke-width="2" />
              <line x1="40" y1="114" x2="275" y2="114" stroke="#0f172a" stroke-width="2" />
              
              <!-- Horizontal ticks & labels (Time) -->
              <line x1="95" y1="16" x2="95" y2="114" stroke="#e2e8f0" stroke-width="1" />
              <line x1="150" y1="16" x2="150" y2="114" stroke="#e2e8f0" stroke-width="1" />
              <line x1="205" y1="16" x2="205" y2="114" stroke="#e2e8f0" stroke-width="1" />
              <line x1="260" y1="16" x2="260" y2="114" stroke="#e2e8f0" stroke-width="1" />
              
              <text x="40" y="126" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle" fill="#475569">0</text>
              <text x="95" y="126" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle" fill="#475569">1</text>
              <text x="150" y="126" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle" fill="#475569">2</text>
              <text x="205" y="126" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle" fill="#475569">3</text>
              <text x="260" y="126" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle" fill="#475569">4s</text>
              <text x="150" y="138" font-size="8.2" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle" fill="#0f172a">Time t (seconds)</text>

              <!-- Vertical ticks & labels (Velocity) -->
              <line x1="40" y1="92" x2="275" y2="92" stroke="#e2e8f0" stroke-width="1" />
              <line x1="40" y1="72" x2="275" y2="72" stroke="#e2e8f0" stroke-width="1" />
              <line x1="40" y1="44" x2="275" y2="44" stroke="#e2e8f0" stroke-width="1" />
              <line x1="40" y1="20" x2="275" y2="20" stroke="#e2e8f0" stroke-width="1" />
              
              <text x="34" y="117" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="end" fill="#475569">0</text>
              <text x="34" y="76" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="end" fill="#475569">18</text>
              <text x="34" y="48" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="end" fill="#475569">32</text>
              <text x="34" y="24" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="end" fill="#475569">40</text>
              <text transform="rotate(-90)" x="-65" y="11" font-size="8.2" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle" fill="#0f172a">Velocity v (m/s)</text>

              <!-- Prompt guidelines -->
              <circle cx="40" cy="72" r="3.5" fill="#0284c7" />
              <circle cx="260" cy="44" r="3.5" fill="#0284c7" />
              <text x="46" y="68" font-size="7.5" font-family="'Outfit', sans-serif" font-weight="700" fill="#0284c7">(0, 18)</text>
              <text x="228" y="38" font-size="7.5" font-family="'Outfit', sans-serif" font-weight="700" fill="#0284c7">(4, 32)</text>
            </svg>
          </div>

          <!-- Proof Calculation Cells -->
          <div style="flex: 1; font-size: 7.8pt; display: flex; flex-direction: column; justify-content: space-between; gap: 5px;">
            <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 4px; padding: 5px 8px;">
              <strong>1. Bottom Shaded Rectangle Area (Inertial Coasting):</strong><br>
              Area<sub>rect</sub> = base &times; height = (4.0 s) &times; (18.0 m/s) = <strong>___________ meters</strong>
            </div>
            <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 4px; padding: 5px 8px;">
              <strong>2. Top Shaded Triangle Area (Acceleration Bonus):</strong><br>
              Area<sub>tri</sub> = ½ &times; base &times; height = ½ &times; (4.0 s) &times; (32.0 &minus; 18.0 m/s) = ½(4)(14) = <strong>___________ meters</strong>
            </div>
            <div style="background: #ecfdf5; border: 1.5px solid #059669; border-radius: 4px; padding: 4px 8px; color: #065f46; font-weight: 700;">
              ✓ Synthesis: Total Area = Area<sub>rect</sub> + Area<sub>tri</sub> = <strong>___________ m</strong> &equiv; Exact Algebraic Match!
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page 2 Footer -->
    <footer class="worksheet-footer">
      <span>Honors Physics &bull; Unit 2: Kinematics</span>
      <span>Page 2 of 2 &bull; End of Kinematic Displacement Practice</span>
      <span>Mr. Mudry's Physics Classroom</span>
    </footer>
  </div>

</body>
</html>`;
}

function renderTeacherMasterKey() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Teacher Master Key: Constant Acceleration & Kinematic Displacement</title>
  <style>
    ${getBaseStyles()}
  </style>
</head>
<body>

  <!-- ====================================================================
       TEACHER KEY - PAGE 1
       ==================================================================== -->
  <div class="worksheet-page">
    <div class="page-content">
      <!-- Header -->
      <header class="worksheet-header">
        <div class="header-titles">
          <h1>TEACHER MASTER KEY: Constant Acceleration &amp; Displacement</h1>
          <p class="sub" style="color: #b91c1c;">Official Solution Guide &bull; Unit 2 Kinematics &bull; x<sub>f</sub> = x₀ + v₀t + ½at²</p>
        </div>
        <div class="header-meta">
          <div><strong style="color: #b91c1c;">TEACHER KEY</strong> &bull; Period 0 Honors</div>
          <div class="student-fields">
            <div><span class="field-label">Instructor:</span> <span class="field-line key-text" style="width: 155px; border-bottom-color: #b91c1c;">Mr. Ryan Mudry</span></div>
            <div><span class="field-label">Term:</span> <span class="field-line key-text" style="width: 75px; border-bottom-color: #b91c1c;">Fall 2026</span></div>
          </div>
        </div>
      </header>

      <!-- Formula Anatomy Reference Box -->
      <div class="formula-banner" style="border-color: #b91c1c;">
        <div class="formula-main-row">
          <div class="formula-title" style="color: #b91c1c;">📐 Key Concept Review &bull; Physical Meaning of Terms</div>
          <div class="formula-math" style="color: #b91c1c;">x<sub>f</sub> = x₀ + v₀t + ½at²</div>
        </div>
        <div class="anatomy-cols">
          <div class="anatomy-col">
            <strong>1. x₀ (Origin)</strong>
            Reference start point (0 m unless non-zero datum specified).
          </div>
          <div class="anatomy-col">
            <strong>2. v₀t (Coasting)</strong>
            Rectangular area under v-t graph (displacement if a = 0).
          </div>
          <div class="anatomy-col">
            <strong>3. ½at² (Acceleration)</strong>
            Triangular area under v-t graph added by changing velocity.
          </div>
          <div class="anatomy-col">
            <strong>⚡ Dimensional Proof</strong>
            (m/s)(s) + (m/s²)(s²) = m + m = <strong>meters (m)</strong>.
          </div>
        </div>
      </div>

      <!-- SECTION 1 -->
      <div class="section-bar" style="background: #991b1b;">
        <span>Part 1: Accelerating From Rest (v₀ = 0, x₀ = 0 &rArr; x<sub>f</sub> = ½at²)</span>
        <span>Tier 1 Solutions</span>
      </div>

      <!-- Problem 1 Key -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num" style="color: #b91c1c;">Problem 1 &bull; Top Fuel Dragster:</strong> v₀ = 0 m/s, a = +28.0 m/s², t = 3.20 s.
        </div>
        <div class="guess-grid">
          <div class="guess-cell">
            <span class="guess-tag">Givens &amp; Unknown</span>
            <div class="workspace-area tall key-text">
              v₀ = 0 m/s<br>
              a = +28.0 m/s²<br>
              t = 3.20 s<br>
              x<sub>f</sub> = ?
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Formula Selected</span>
            <div class="workspace-area tall key-text">
              x<sub>f</sub> = ½at²<br>
              <em>(since v₀ = 0)</em>
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Substitution with Units</span>
            <div class="workspace-area tall key-text">
              x<sub>f</sub> = ½(28.0 m/s²)(3.20 s)²<br><br>
              x<sub>f</sub> = (14.0)(10.24)
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Calculated Output</span>
            <div class="workspace-area tall">
              <div class="answer-box" style="border-color: #b91c1c; margin-top: 14px;">
                <span class="answer-box-label">Distance:</span>
                <span class="key-box-val">143.4 m</span>
              </div>
            </div>
          </div>
        </div>
        <div style="font-size: 7.4pt; color: #b91c1c; margin-top: 4px; font-weight: 600;">
          <em>Follow-up:</em> [ <strong>X</strong> ] NO &mdash; The car has traveled 143.4 m, which is less than half of the 305 m track (it crosses 305 m at t = &radic;(2(305)/28) &approx; 4.67 s).
        </div>
      </div>

      <!-- Problem 2 Key -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num" style="color: #b91c1c;">Problem 2 &bull; Superconducting Maglev Departure:</strong> v₀ = 0 m/s, a = +1.25 m/s², t = 24.0 s.
        </div>
        <div class="guess-grid">
          <div class="guess-cell">
            <span class="guess-tag">Givens &amp; Unknown</span>
            <div class="workspace-area tall key-text">
              v₀ = 0 m/s<br>
              a = +1.25 m/s²<br>
              t = 24.0 s<br>
              x<sub>f</sub> = ?
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Formula Setup</span>
            <div class="workspace-area tall key-text">
              x<sub>f</sub> = ½at²
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Substitution &amp; Arithmetic Steps</span>
            <div class="workspace-area tall key-text">
              x<sub>f</sub> = ½(1.25 m/s²)(24.0 s)²<br><br>
              x<sub>f</sub> = (0.625)(576.0)
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Final Boxed Answer</span>
            <div class="workspace-area tall">
              <div class="answer-box" style="border-color: #b91c1c; margin-top: 14px;">
                <span class="answer-box-label">Distance:</span>
                <span class="key-box-val">360.0 m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2 -->
      <div class="section-bar" style="background: #991b1b; margin-top: 6px;">
        <span>Part 2: Accelerating With Initial Forward Speed (v₀ &gt; 0, a &gt; 0)</span>
        <span>Tier 2 Solutions</span>
      </div>

      <!-- Problem 3 Key -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num" style="color: #b91c1c;">Problem 3 &bull; Highway Passing Maneuver:</strong> v₀ = +18.0 m/s, a = +3.50 m/s², t = 4.00 s.
        </div>
        <div class="guess-grid" style="grid-template-columns: 0.9fr 1.4fr 1.7fr 1.3fr;">
          <div class="guess-cell">
            <span class="guess-tag">Givens</span>
            <div class="workspace-area tall key-text">
              v₀ = +18.0 m/s<br>
              a = +3.50 m/s²<br>
              t = 4.00 s<br>
              x<sub>f</sub> = ?
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Coasting Term (v₀t)</span>
            <div class="workspace-area tall key-text">
              d<sub>coast</sub> = (18.0 m/s)(4.00 s)<br><br>
              d<sub>coast</sub> = <strong style="color: #047857;">72.0 m</strong>
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Accel Bonus Term (½at²)</span>
            <div class="workspace-area tall key-text">
              d<sub>accel</sub> = ½ (3.50 m/s²)(4.00 s)²<br>
              d<sub>accel</sub> = ½ (3.50)(16.0)<br>
              d<sub>accel</sub> = <strong style="color: #047857;">28.0 m</strong>
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Total Distance x<sub>f</sub></span>
            <div class="workspace-area tall">
              <div class="answer-box" style="border-color: #b91c1c; margin-top: 14px;">
                <span class="answer-box-label">Total x<sub>f</sub>:</span>
                <span class="key-box-val">100.0 m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Problem 4 Key -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num" style="color: #b91c1c;">Problem 4 &bull; Commercial Jetliner Takeoff Roll:</strong> v₀ = +10.0 m/s, a = +2.20 m/s², t = 28.0 s.
        </div>
        <div class="guess-grid">
          <div class="guess-cell">
            <span class="guess-tag">Givens &amp; Unknown</span>
            <div class="workspace-area tall key-text">
              v₀ = +10.0 m/s<br>
              a = +2.20 m/s²<br>
              t = 28.0 s<br>
              x<sub>f</sub> = ?
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Algebraic Formula</span>
            <div class="workspace-area tall key-text">
              x<sub>f</sub> = v₀t + ½at²
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Step-by-Step Substitution</span>
            <div class="workspace-area tall key-text">
              x<sub>f</sub> = (10.0 m/s)(28.0 s) + ½(2.20 m/s²)(28.0 s)²<br>
              x<sub>f</sub> = (280.0 m) + (1.10)(784.0)<br>
              x<sub>f</sub> = 280.0 m + 862.4 m
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Liftoff Distance</span>
            <div class="workspace-area tall">
              <div class="answer-box" style="border-color: #b91c1c; margin-top: 14px;">
                <span class="answer-box-label">Runway:</span>
                <span class="key-box-val">1,142.4 m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page 1 Footer -->
    <footer class="worksheet-footer">
      <span style="color: #b91c1c; font-weight: 700;">TEACHER MASTER KEY &bull; FOR INSTRUCTOR USE ONLY</span>
      <span>Page 1 of 2 &bull; Turn Over for Key Solutions to Page 2 &rarr;</span>
      <span>Mr. Mudry's Physics Classroom</span>
    </footer>
  </div>

  <!-- ====================================================================
       TEACHER KEY - PAGE 2
       ==================================================================== -->
  <div class="worksheet-page">
    <div class="page-content">
      <!-- Mini Header -->
      <div class="mini-header" style="border-bottom-color: #b91c1c; color: #b91c1c;">
        <span>TEACHER MASTER KEY &bull; Kinematic Displacement Workshop</span>
        <span>Page 2 of 2 &bull; Braking Solutions &amp; Geometric Integration Proof</span>
        <span>Period 0 Honors</span>
      </div>

      <!-- SECTION 3 -->
      <div class="section-bar" style="background: #991b1b;">
        <span>Part 3: Deceleration &amp; Emergency Braking (a &lt; 0)</span>
        <span>Tier 3 Solutions</span>
      </div>

      <!-- Problem 5 Key -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num" style="color: #b91c1c;">Problem 5 &bull; Interstate Emergency Braking:</strong> v₀ = +32.0 m/s, a = &minus;6.50 m/s², t = 4.00 s.
        </div>
        <div class="guess-grid" style="grid-template-columns: 1fr 1.2fr 1.8fr 1.3fr;">
          <div class="guess-cell">
            <span class="guess-tag">Givens</span>
            <div class="workspace-area tall key-text">
              v₀ = +32.0 m/s<br>
              a = &minus;6.50 m/s²<br>
              t = 4.00 s<br>
              x<sub>f</sub> = ?
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Equation Setup</span>
            <div class="workspace-area tall key-text">
              x<sub>f</sub> = v₀t + ½at²<br>
              <em>(Note negative sign!)</em>
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Calculation Steps</span>
            <div class="workspace-area tall key-text">
              x<sub>f</sub> = (32.0)(4.00) + ½(&minus;6.50)(4.00)²<br><br>
              x<sub>f</sub> = (128.0 m) + (&minus;52.0 m)<br>
              x<sub>f</sub> = 128.0 m &minus; 52.0 m
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Skid Distance x<sub>f</sub></span>
            <div class="workspace-area tall">
              <div class="answer-box" style="border-color: #b91c1c; margin-top: 14px;">
                <span class="answer-box-label">Braking x<sub>f</sub>:</span>
                <span class="key-box-val">76.0 m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Problem 6 Key -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num" style="color: #b91c1c;">Problem 6 &bull; Aircraft Carrier Arrested Trap:</strong> v₀ = +70.0 m/s, a = &minus;24.5 m/s², t = 2.40 s.
        </div>
        <div class="guess-grid">
          <div class="guess-cell">
            <span class="guess-tag">Givens &amp; Unknown</span>
            <div class="workspace-area tall key-text">
              v₀ = +70.0 m/s<br>
              a = &minus;24.5 m/s²<br>
              t = 2.40 s<br>
              x<sub>f</sub> = ?
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Equation Setup</span>
            <div class="workspace-area tall key-text">
              x<sub>f</sub> = v₀t + ½at²
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Step-by-Step Substitution</span>
            <div class="workspace-area tall key-text">
              x<sub>f</sub> = (70.0)(2.40) + ½(&minus;24.5)(2.40)²<br>
              x<sub>f</sub> = (168.0 m) &minus; (12.25)(5.76)<br>
              x<sub>f</sub> = 168.0 m &minus; 70.56 m
            </div>
          </div>
          <div class="guess-cell">
            <span class="guess-tag">Trap Distance</span>
            <div class="workspace-area tall">
              <div class="answer-box" style="border-color: #b91c1c; margin-top: 14px;">
                <span class="answer-box-label">Deck Run:</span>
                <span class="key-box-val">97.4 m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 4 -->
      <div class="section-bar" style="background: #991b1b; margin-top: 5px;">
        <span>Part 4: Multi-Stage Kinematics &bull; Driver Reaction &amp; Collision Avoidance</span>
        <span>Tier 4 Solutions</span>
      </div>

      <!-- Problem 7 Key -->
      <div class="problem-box">
        <div class="problem-prompt">
          <strong class="q-num" style="color: #b91c1c;">Problem 7 &bull; Wildlife Obstacle Avoidance:</strong> v₀ = +24.0 m/s, Obstacle at 62.0 m.
        </div>

        <div class="stages-flex">
          <!-- Stage 1 -->
          <div class="stage-card">
            <div class="stage-title" style="color: #b91c1c;">Stage 1: Sensor Delay (t₁ = 0.50 s)</div>
            <div>Vehicle travels at constant speed (a = 0):</div>
            <div class="key-text" style="margin-top: 6px; border-top: 1.5px dashed #cbd5e1; padding-top: 5px;">
              d₁ = v₀ &middot; t₁ = (24.0 m/s)(0.50 s)<br><br>
              <strong>d₁ = 12.0 meters</strong>
            </div>
          </div>

          <!-- Stage 2 -->
          <div class="stage-card">
            <div class="stage-title" style="color: #b91c1c;">Stage 2: ABS Braking (a = &minus;8.0 m/s²)</div>
            <div>Vehicle decelerates to a complete stop in 3.00 s:</div>
            <div class="key-text" style="margin-top: 6px; border-top: 1.5px dashed #cbd5e1; padding-top: 5px;">
              d₂ = (24.0)(3.00) + ½(&minus;8.00)(3.00)²<br>
              d₂ = 72.0 m &minus; 36.0 m<br>
              <strong>d₂ = 36.0 meters</strong>
            </div>
          </div>

          <!-- Stage 3 -->
          <div class="stage-card" style="border-color: #b91c1c; background: #ffffff;">
            <div class="stage-title" style="color: #b91c1c;">Stage 3: Collision Outcome</div>
            <div class="key-text" style="line-height: 1.35;">
              d<sub>total</sub> = d₁ + d₂ = 12.0 m + 36.0 m<br>
              <strong>d<sub>total</sub> = 48.0 meters</strong>
            </div>
            <div style="margin-top: 6px; font-weight: 700; color: #047857; font-size: 7.8pt;">
              [ <strong>X</strong> ] SAFELY STOPS WITH 14.0 m MARGIN!<br>
              (62.0 m &minus; 48.0 m = <strong>+14.0 meters clearance</strong>)
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 5 -->
      <div class="section-bar" style="background: #991b1b; margin-top: 5px;">
        <span>Part 5: Geometric Integration &bull; Connecting x<sub>f</sub> = v₀t + ½at² to Velocity-Time Graphs</span>
        <span>DOK 3 Solutions</span>
      </div>

      <!-- Problem 8 Key -->
      <div class="problem-box" style="margin-bottom: 0;">
        <div class="problem-prompt">
          <strong class="q-num" style="color: #b91c1c;">Problem 8 &bull; Geometric Area Proof:</strong> Graphical &amp; Algebraic Equivalence
        </div>
        <div style="display: flex; gap: 12px; align-items: center; margin-top: 4px; flex: 1 1 auto;">
          <!-- SVG v-t graph with colored areas -->
          <div style="flex: 0 0 290px;">
            <svg width="290" height="142" viewBox="0 0 290 142" xmlns="http://www.w3.org/2000/svg" style="border: 1.5px solid #b91c1c; border-radius: 5px; background: #ffffff;">
              <!-- Grid lines -->
              <line x1="40" y1="16" x2="40" y2="114" stroke="#0f172a" stroke-width="2" />
              <line x1="40" y1="114" x2="275" y2="114" stroke="#0f172a" stroke-width="2" />
              
              <!-- Shaded Rectangle (Coasting) -->
              <rect x="40" y="72" width="220" height="42" fill="rgba(2, 132, 199, 0.25)" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3,3" />
              
              <!-- Shaded Triangle (Acceleration) -->
              <polygon points="40,72 260,44 260,72" fill="rgba(245, 158, 11, 0.35)" stroke="#d97706" stroke-width="1.5" stroke-dasharray="3,3" />

              <!-- Sloped motion line -->
              <line x1="40" y1="72" x2="260" y2="44" stroke="#b91c1c" stroke-width="3" />

              <!-- Labels inside shapes -->
              <text x="150" y="96" font-size="8.2" font-family="'Outfit', sans-serif" font-weight="800" text-anchor="middle" fill="#0369a1">RECTANGLE: v₀t = 72 m</text>
              <text x="175" y="64" font-size="7.8" font-family="'Outfit', sans-serif" font-weight="800" text-anchor="middle" fill="#b45309">TRIANGLE: ½at² = 28 m</text>

              <!-- Axis labels -->
              <text x="40" y="126" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle" fill="#475569">0</text>
              <text x="260" y="126" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle" fill="#475569">4s</text>
              <text x="34" y="76" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="end" fill="#475569">18</text>
              <text x="34" y="48" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="end" fill="#475569">32</text>
              <text x="150" y="138" font-size="8.2" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle" fill="#0f172a">Time t (seconds)</text>
              <text transform="rotate(-90)" x="-65" y="11" font-size="8.2" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle" fill="#0f172a">Velocity v (m/s)</text>
            </svg>
          </div>

          <!-- Proof Calculation Cells -->
          <div style="flex: 1; font-size: 7.8pt; display: flex; flex-direction: column; justify-content: space-between; gap: 5px;">
            <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 4px; padding: 5px 8px;">
              <strong>1. Bottom Shaded Rectangle Area (Inertial Coasting):</strong><br>
              Area<sub>rect</sub> = base &times; height = (4.0 s) &times; (18.0 m/s) = <strong class="key-text" style="color: #0284c7;">72.0 meters</strong>
            </div>
            <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 4px; padding: 5px 8px;">
              <strong>2. Top Shaded Triangle Area (Acceleration Bonus):</strong><br>
              Area<sub>tri</sub> = ½ &times; base &times; height = ½ &times; (4.0 s) &times; (14.0 m/s) = <strong class="key-text" style="color: #d97706;">28.0 meters</strong>
            </div>
            <div style="background: #ecfdf5; border: 1.5px solid #059669; border-radius: 4px; padding: 5px 8px; color: #065f46; font-weight: 800;">
              ✓ Total Area = 72.0 m + 28.0 m = <span style="font-size: 9pt; color: #b91c1c;">100.0 m</span> &equiv; Exact Match with Problem 3!
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page 2 Footer -->
    <footer class="worksheet-footer">
      <span style="color: #b91c1c; font-weight: 700;">TEACHER MASTER KEY &bull; FOR INSTRUCTOR USE ONLY</span>
      <span>Page 2 of 2 &bull; End of Key Solutions</span>
      <span>Mr. Mudry's Physics Classroom</span>
    </footer>
  </div>

</body>
</html>`;
}

async function run() {
  const honorsDir = path.join(__dirname, '../Unit_2/honors_worksheets');
  const generalDir = path.join(__dirname, '../Unit_2/worksheets');

  if (!fs.existsSync(honorsDir)) fs.mkdirSync(honorsDir, { recursive: true });
  if (!fs.existsSync(generalDir)) fs.mkdirSync(generalDir, { recursive: true });

  const studentHtml = renderStudentWorksheet();
  const teacherKeyHtml = renderTeacherMasterKey();

  const studentHtmlFile = 'Honors_Kinematic_Displacement_Practice_Worksheet.html';
  const studentPdfFile = 'Honors_Kinematic_Displacement_Practice_Worksheet.pdf';
  const keyHtmlFile = 'Teacher_Master_Key_Kinematic_Displacement.html';
  const keyPdfFile = 'Teacher_Master_Key_Kinematic_Displacement.pdf';

  // Save HTML files to both honors_worksheets and worksheets directories
  fs.writeFileSync(path.join(honorsDir, studentHtmlFile), studentHtml, 'utf8');
  fs.writeFileSync(path.join(generalDir, studentHtmlFile), studentHtml, 'utf8');

  fs.writeFileSync(path.join(honorsDir, keyHtmlFile), teacherKeyHtml, 'utf8');
  fs.writeFileSync(path.join(generalDir, keyHtmlFile), teacherKeyHtml, 'utf8');

  console.log('🚀 Launching Puppeteer to compile publication-quality Letter PDFs with full vertical space...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Compile Student Worksheet PDF
  const pageStudent = await browser.newPage();
  await pageStudent.setContent(studentHtml, { waitUntil: 'networkidle0' });
  const studentPdfBuffer = await pageStudent.pdf({
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '0.24in', bottom: '0.24in', left: '0.36in', right: '0.36in' }
  });
  fs.writeFileSync(path.join(honorsDir, studentPdfFile), studentPdfBuffer);
  fs.writeFileSync(path.join(generalDir, studentPdfFile), studentPdfBuffer);
  await pageStudent.close();
  console.log(`✅ Generated Student Worksheet PDF with subscripts & full vertical space!`);

  // 2. Compile Teacher Key PDF
  const pageKey = await browser.newPage();
  await pageKey.setContent(teacherKeyHtml, { waitUntil: 'networkidle0' });
  const keyPdfBuffer = await pageKey.pdf({
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '0.24in', bottom: '0.24in', left: '0.36in', right: '0.36in' }
  });
  fs.writeFileSync(path.join(honorsDir, keyPdfFile), keyPdfBuffer);
  fs.writeFileSync(path.join(generalDir, keyPdfFile), keyPdfBuffer);
  await pageKey.close();
  console.log(`✅ Generated Teacher Master Key PDF with subscripts & full vertical space!`);

  await browser.close();
  console.log('🎉 All worksheets and master keys successfully generated and compiled!');
}

run().catch(err => {
  console.error('❌ Error generating worksheets:', err);
  process.exit(1);
});

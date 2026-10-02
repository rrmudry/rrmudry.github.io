/**
 * Generates the Inertia Demonstration & Physics Defense Planner Worksheet and Teacher Master Key
 * Unit 2: Dynamics & Newton's First Law (NGSS HS-PS2-1)
 * 
 * Target: High School Physics & Conceptual Physics
 * - Exactly 2 pages in PDF (Page 1 = Demonstration Blueprint & Protocol; Page 2 = Physics Defense & Real-World Synthesis)
 * - Matching 2-page Teacher Master Key & Exemplar Guide
 * - Zero LaTeX notation (plain text, Unicode symbols: Δ, W = m · g, F_net = 0)
 * - Strict letter portrait print budget (11.0 in x 8.5 in with 0.32in margins)
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function renderStudentWorksheet() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Inertia Showcase: Demonstration &amp; Physics Defense Planner</title>
  <style>
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
      line-height: 1.25;
      font-size: 8.5pt;
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
    .page-content {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1 1 auto;
      margin-bottom: 2px;
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
      font-size: 13pt;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 1px 0;
      text-transform: uppercase;
      letter-spacing: -0.3px;
    }
    .header-titles .sub {
      font-size: 8.2pt;
      font-weight: 700;
      color: #0284c7;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .header-meta {
      font-size: 8pt;
      text-align: right;
    }
    .student-fields {
      display: flex;
      gap: 12px;
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
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 3px;
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
    }

    /* Section Cards */
    .section-card {
      border: 1.5px solid #cbd5e1;
      border-radius: 4px;
      padding: 6px 8px;
      margin-bottom: 5px;
      background: #ffffff;
    }
    .section-title {
      font-size: 8.8pt;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    .badge {
      background: #0284c7;
      color: #ffffff;
      font-size: 7pt;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .badge-amber {
      background: #d97706;
    }
    .badge-emerald {
      background: #059669;
    }

    /* Mission Box */
    .mission-box {
      background: #f8fafc;
      border-left: 3.5px solid #0284c7;
      padding: 5px 8px;
      font-size: 8pt;
      color: #334155;
      margin-bottom: 5px;
      line-height: 1.3;
    }

    /* Category Choice Grid */
    .category-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-bottom: 5px;
    }
    .cat-box {
      border: 1.2px solid #94a3b8;
      border-radius: 3px;
      padding: 5px 6px;
      background: #f8fafc;
      font-size: 7.8pt;
    }
    .cat-box.active-preview {
      border-color: #0284c7;
      background: #f0f9ff;
    }
    .cat-title {
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 3px;
      font-size: 8.2pt;
    }
    .cat-desc {
      color: #475569;
      margin-bottom: 3px;
      line-height: 1.2;
    }
    .cat-sparks {
      font-size: 7.2pt;
      color: #64748b;
      font-style: italic;
    }

    /* Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.8pt;
      margin-top: 3px;
    }
    .data-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 800;
      text-align: left;
      padding: 3px 6px;
      border: 1px solid #cbd5e1;
      font-size: 7.5pt;
      text-transform: uppercase;
    }
    .data-table td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      vertical-align: top;
    }

    /* Diagram Sketch Box */
    .sketch-box {
      border: 1.5px dashed #94a3b8;
      background: #ffffff;
      border-radius: 3px;
      height: 125px;
      position: relative;
      background-image: radial-gradient(#cbd5e1 0.75px, transparent 0.75px);
      background-size: 14px 14px;
      padding: 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sketch-watermark {
      position: absolute;
      bottom: 4px;
      right: 6px;
      font-size: 7pt;
      color: #94a3b8;
      font-style: italic;
    }
    .sketch-guidelines {
      display: flex;
      gap: 12px;
      font-size: 7.3pt;
      color: #64748b;
      background: rgba(255, 255, 255, 0.85);
      padding: 2px 4px;
      border-radius: 2px;
      width: fit-content;
    }

    /* Procedure Steps */
    .procedure-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .step-box {
      border: 1px solid #cbd5e1;
      border-radius: 3px;
      padding: 4px 6px;
      background: #ffffff;
      font-size: 7.8pt;
    }
    .step-label {
      font-weight: 800;
      color: #0284c7;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .writing-line {
      border-bottom: 1px dotted #94a3b8;
      height: 14px;
      margin-top: 2px;
    }

    /* FBD Boxes */
    .fbd-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 3px;
    }
    .fbd-card {
      border: 1.2px solid #cbd5e1;
      border-radius: 4px;
      padding: 5px;
      background: #f8fafc;
      font-size: 7.8pt;
    }
    .fbd-head {
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 3px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
    }
    .fbd-canvas-space {
      height: 95px;
      border: 1px dashed #cbd5e1;
      background: #ffffff;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
      border-radius: 2px;
    }
    .fbd-dot {
      width: 10px;
      height: 10px;
      background: #0f172a;
      border-radius: 50%;
    }

    /* CER writing lines */
    .cer-block {
      margin-bottom: 4px;
    }
    .cer-label {
      font-weight: 800;
      color: #0f172a;
      font-size: 8pt;
      display: inline-block;
      min-width: 90px;
    }

    /* Rubric Table */
    .rubric-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.2pt;
      margin-top: 2px;
    }
    .rubric-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 3px 5px;
      border: 1px solid #0f172a;
      font-weight: 800;
      text-align: center;
      font-size: 7pt;
    }
    .rubric-table td {
      border: 1px solid #cbd5e1;
      padding: 3px 5px;
      vertical-align: top;
    }

    /* Footer */
    .worksheet-footer {
      border-top: 1.5px solid #cbd5e1;
      padding-top: 3px;
      font-size: 7pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>

  <!-- =====================================================================
       PAGE 1: BLUEPRINT, MATERIALS & EXECUTION PROTOCOL
       ===================================================================== -->
  <div class="worksheet-page">
    <div class="page-content">

      <!-- Header -->
      <header class="worksheet-header">
        <div class="header-titles">
          <h1>The Inertia Showcase: Demonstration &amp; Physics Defense Planner</h1>
          <div class="sub">Unit 2: Dynamics &amp; Newton's First Law · NGSS HS-PS2-1 · Performance Task Planner</div>
        </div>
        <div class="header-meta">
          <div><strong>Mr. Mudry · Physics</strong></div>
          <div>DOK Level 3 Inquiry</div>
        </div>
      </header>

      <!-- Student Fields Bar -->
      <div class="student-fields" style="margin-bottom: 5px; font-size: 8.5pt;">
        <div><span class="field-label">Lead Demonstrator:</span> <span class="field-line" style="width: 180px;">&nbsp;</span></div>
        <div><span class="field-label">Partner(s):</span> <span class="field-line" style="width: 180px;">&nbsp;</span></div>
        <div><span class="field-label">Period:</span> <span class="field-line" style="width: 45px;">&nbsp;</span></div>
        <div><span class="field-label">Date:</span> <span class="field-line" style="width: 80px;">&nbsp;</span></div>
      </div>

      <!-- Mission Briefing -->
      <div class="mission-box">
        <strong>🎯 THE MISSION BRIEFING:</strong> You are a Lead Science Demonstrator. Your mission is to plan, engineer, and defend a live, repeatable physical demonstration that vividly proves <strong>Newton's First Law of Motion</strong>. You cannot simply recite the law—your demonstration must make invisible inertia visible, dramatic, and scientifically undeniable to your audience.
      </div>

      <!-- Phase 1: Category Selection -->
      <div class="section-card">
        <div class="section-title">
          <span class="badge">Phase 1</span> Select Your Inertia Regime &amp; Phenomenon
        </div>
        <p style="margin: 0 0 4px 0; font-size: 7.8pt; color: #475569;">
          Choose <strong>one</strong> of the three physical categories of Newton's First Law to demonstrate. Check the box and write your demonstration title:
        </p>

        <div class="category-grid">
          <div class="cat-box">
            <div class="cat-title">
              <input type="checkbox"> 1. Inertia of Rest
            </div>
            <div class="cat-desc">A stationary mass stubbornly stays at rest when a supporting surface or barrier is accelerated out from underneath it.</div>
            <div class="cat-sparks"><strong>Idea Sparks:</strong> Tablecloth slip, coin-on-card beaker snap, embroidery hoop hex-nut drop, stacked block bottom-whip, pencil-on-ruler flick.</div>
          </div>

          <div class="cat-box">
            <div class="cat-title">
              <input type="checkbox"> 2. Inertia of Motion
            </div>
            <div class="cat-desc">A moving object stubbornly continues forward in a straight line at constant velocity when its carrier abruptly halts.</div>
            <div class="cat-sparks"><strong>Idea Sparks:</strong> Cart passenger obstacle barrier crash, skateboard curb stop, water inertia slosh cart, rolling marble barrier gap launch.</div>
          </div>

          <div class="cat-box">
            <div class="cat-title">
              <input type="checkbox"> 3. Inertia of Direction
            </div>
            <div class="cat-desc">An object in circular motion flies off along an exact, straight tangent line vector the instant the centripetal inward force is cut.</div>
            <div class="cat-sparks"><strong>Idea Sparks:</strong> Whirling string cutter, curved pie-pan marble exit gap, spinning bicycle wheel water throw, tetherball release.</div>
          </div>
        </div>

        <div style="font-size: 8pt; display: flex; gap: 8px; align-items: center; margin-top: 3px;">
          <strong>Demonstration Title / Codename:</strong>
          <span class="field-line" style="flex: 1;">&nbsp;</span>
        </div>
      </div>

      <!-- Phase 2: Bill of Materials & Safety -->
      <div class="section-card">
        <div class="section-title">
          <span class="badge">Phase 2</span> Bill of Materials &amp; Apparatus Inventory
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 25%;">Component Item</th>
              <th style="width: 35%;">Physics Role in Demonstration</th>
              <th style="width: 22%;">Source (Classroom/Home)</th>
              <th style="width: 18%;">Check / Verified</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1. The Inertial Mass:</strong></td>
              <td>Target object that resists acceleration (large mass = high inertia)</td>
              <td><span class="field-line" style="width: 100%;">&nbsp;</span></td>
              <td style="text-align: center;">[ &nbsp; ] Ready</td>
            </tr>
            <tr>
              <td><strong>2. The Support / Carrier:</strong></td>
              <td>Surface or vehicle accelerated out from under or halted</td>
              <td><span class="field-line" style="width: 100%;">&nbsp;</span></td>
              <td style="text-align: center;">[ &nbsp; ] Ready</td>
            </tr>
            <tr>
              <td><strong>3. The Force Device:</strong></td>
              <td>Applies the rapid external impulse (pull, strike, stop, cut)</td>
              <td><span class="field-line" style="width: 100%;">&nbsp;</span></td>
              <td style="text-align: center;">[ &nbsp; ] Ready</td>
            </tr>
            <tr>
              <td><strong>4. Safety Catch / Basin:</strong></td>
              <td>Cushion, container, or barrier to contain moving items</td>
              <td><span class="field-line" style="width: 100%;">&nbsp;</span></td>
              <td style="text-align: center;">[ &nbsp; ] Ready</td>
            </tr>
          </tbody>
        </table>
        <div style="font-size: 7.4pt; color: #475569; margin-top: 3px; display: flex; justify-content: space-between;">
          <span><strong>Safety Rule:</strong> No glass breakables or dangerous projectiles. Design a soft catch landing zone!</span>
          <span><strong>Inertia Maximizer:</strong> High mass (kg) + low friction (smooth surfaces) = clear proof!</span>
        </div>
      </div>

      <!-- Phase 3: Setup Diagram -->
      <div class="section-card">
        <div class="section-title">
          <span class="badge">Phase 3</span> Annotated Blueprint &amp; Setup Diagram
        </div>
        <div class="sketch-box">
          <div class="sketch-guidelines">
            <span>✓ Draw apparatus BEFORE action</span>
            <span>✓ Label Inertial Mass &amp; Support Surface</span>
            <span>✓ Draw arrow showing Applied Force direction</span>
            <span>✓ Draw dashed arrow showing final path</span>
          </div>
          <div class="sketch-watermark">Grid spacing: 14 mm · Draw neat, labeled vectors with a ruler</div>
        </div>
      </div>

      <!-- Phase 4: Step-by-Step Procedure -->
      <div class="section-card">
        <div class="section-title">
          <span class="badge">Phase 4</span> Execution Protocol (Step-by-Step Procedure)
        </div>
        <div class="procedure-grid">
          <div class="step-box">
            <div class="step-label"><span>1. Setup &amp; Baseline Alignment</span></div>
            <div style="color: #475569; font-size: 7.2pt;">How is the apparatus positioned before the demonstration begins?</div>
            <div class="writing-line"></div>
            <div class="writing-line"></div>
          </div>

          <div class="step-box">
            <div class="step-label"><span>2. The Action (Quick Impulse Trigger)</span></div>
            <div style="color: #475569; font-size: 7.2pt;">What exact physical action do you perform? (Speed, angle, snap)</div>
            <div class="writing-line"></div>
            <div class="writing-line"></div>
          </div>

          <div class="step-box">
            <div class="step-label"><span>3. Audience Observation (The Result)</span></div>
            <div style="color: #475569; font-size: 7.2pt;">What does the carrier do vs. what does the inertial mass do?</div>
            <div class="writing-line"></div>
            <div class="writing-line"></div>
          </div>

          <div class="step-box">
            <div class="step-label"><span>4. Repeatability &amp; Troubleshooting</span></div>
            <div style="color: #475569; font-size: 7.2pt;">What common mistake causes this to fail? How do you prevent it?</div>
            <div class="writing-line"></div>
            <div class="writing-line"></div>
          </div>
        </div>
      </div>

    </div>

    <!-- Footer Page 1 -->
    <footer class="worksheet-footer">
      <span>Unit 2: Dynamics · Newton's First Law Demonstration Planner</span>
      <span>Page 1 of 2 (Turn over for Physics Defense &amp; Real-World Connection)</span>
      <span>rrmudry.github.io/physics</span>
    </footer>
  </div>

  <!-- =====================================================================
       PAGE 2: THE PHYSICS DEFENSE & REAL-WORLD SYNTHESIS
       ===================================================================== -->
  <div class="worksheet-page">
    <div class="page-content">

      <!-- Header Page 2 -->
      <header class="mini-header">
        <span>Part II: Scientific Defense, Vector Modeling &amp; Everyday Life Synthesis</span>
        <span>Lead Demonstrator: <span class="field-line" style="width: 150px;">&nbsp;</span> · Period: <span class="field-line" style="width: 30px;">&nbsp;</span></span>
      </header>

      <!-- Phase 5: Free-Body Diagram Defense -->
      <div class="section-card">
        <div class="section-title">
          <span class="badge badge-amber">Phase 5</span> Free-Body Diagram (FBD) Defense: Proving Net Force
        </div>
        <p style="margin: 0 0 3px 0; font-size: 7.8pt; color: #475569;">
          Construct isolated Free-Body Diagrams for the <strong>Inertial Mass</strong> during the two critical phases. Draw labeled force vectors with proper relative arrow lengths:
        </p>

        <div class="fbd-container">
          <div class="fbd-card">
            <div class="fbd-head">
              <span>Diagram A: Initial State (At Rest or Uniform Motion)</span>
              <span><strong>ΣF = 0 (Equilibrium)</strong></span>
            </div>
            <div class="fbd-canvas-space">
              <div class="fbd-dot"></div>
              <span style="position: absolute; bottom: 4px; font-size: 6.8pt; color: #94a3b8;">Draw balanced vertical forces (Fg, FN)</span>
            </div>
            <div style="font-size: 7.3pt; color: #334155;">
              <strong>Vertical Balance:</strong> FN = Fg (Normal force cancels gravity)<br>
              <strong>Horizontal State:</strong> F_net = 0 N → Velocity is constant (v = 0 or v₀).
            </div>
          </div>

          <div class="fbd-card">
            <div class="fbd-head">
              <span>Diagram B: During Split-Second Action</span>
              <span><strong>Horizontal Force ≈ 0 N</strong></span>
            </div>
            <div class="fbd-canvas-space">
              <div class="fbd-dot"></div>
              <span style="position: absolute; bottom: 4px; font-size: 6.8pt; color: #94a3b8;">Draw forces acting ON THE MASS during action</span>
            </div>
            <div style="font-size: 7.3pt; color: #334155;">
              <strong>Key Misconception Buster:</strong> Inertia is a <em>property of mass</em>, NOT a force! There is ZERO forward force pushing the mass.
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 6: CER Explanation -->
      <div class="section-card">
        <div class="section-title">
          <span class="badge badge-emerald">Phase 6</span> Scientific Defense: Claim - Evidence - Reasoning (CER)
        </div>
        
        <div class="cer-block">
          <span class="cer-label">1. CLAIM:</span>
          <span style="font-size: 7.5pt; color: #475569;">State clearly how this demonstration proves Newton's First Law.</span>
          <div class="writing-line"></div>
          <div class="writing-line"></div>
        </div>

        <div class="cer-block">
          <span class="cer-label">2. EVIDENCE:</span>
          <span style="font-size: 7.5pt; color: #475569;">Describe the exact physical motion observed during your test trials.</span>
          <div class="writing-line"></div>
          <div class="writing-line"></div>
        </div>

        <div class="cer-block">
          <span class="cer-label">3. REASONING:</span>
          <span style="font-size: 7.5pt; color: #475569;">Explain the physics using core terms: <strong>Mass, Inertia, Net External Force (F_net), and Friction (Static vs. Kinetic)</strong>.</span>
          <div class="writing-line"></div>
          <div class="writing-line"></div>
          <div class="writing-line"></div>
        </div>
      </div>

      <!-- Phase 7: Real-World Connection -->
      <div class="section-card">
        <div class="section-title">
          <span class="badge">Phase 7</span> Everyday Life &amp; Modern Engineering Connection
        </div>
        <p style="margin: 0 0 4px 0; font-size: 7.8pt; color: #475569;">
          Newton's First Law governs human survival and engineering every day. Connect your demonstration category to an authentic real-world technology or daily experience:
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <div style="font-size: 7.8pt; font-weight: 700; color: #1e293b; margin-bottom: 2px;">
              A. Real-World System or Vehicle:
            </div>
            <div style="font-size: 7.2pt; color: #64748b; margin-bottom: 2px;">
              (e.g., Automotive seatbelt lock, airbag sensor, earthquake base-isolator, ketchup bottle tap, bicycle mud flap)
            </div>
            <div class="writing-line"></div>
            <div class="writing-line"></div>

            <div style="font-size: 7.8pt; font-weight: 700; color: #1e293b; margin-top: 4px; margin-bottom: 2px;">
              B. How Inertia Operates in this System:
            </div>
            <div style="font-size: 7.2pt; color: #64748b; margin-bottom: 2px;">
              What object stubbornly wants to stay at rest, keep moving, or travel straight?
            </div>
            <div class="writing-line"></div>
            <div class="writing-line"></div>
          </div>

          <div>
            <div style="font-size: 7.8pt; font-weight: 700; color: #1e293b; margin-bottom: 2px;">
              C. Engineering Solution or Consequence:
            </div>
            <div style="font-size: 7.2pt; color: #64748b; margin-bottom: 2px;">
              How did engineers design around this inertia to protect human life or accomplish work?
            </div>
            <div class="writing-line"></div>
            <div class="writing-line"></div>

            <div style="font-size: 7.8pt; font-weight: 700; color: #1e293b; margin-top: 4px; margin-bottom: 2px;">
              D. What Happens if Newton's First Law is Ignored?
            </div>
            <div style="font-size: 7.2pt; color: #64748b; margin-bottom: 2px;">
              What injury, mechanical failure, or disaster occurs without an external restraining force?
            </div>
            <div class="writing-line"></div>
            <div class="writing-line"></div>
          </div>
        </div>
      </div>

      <!-- Phase 8: Rubric -->
      <div class="section-card">
        <div class="section-title" style="margin-bottom: 2px;">
          <span class="badge">Phase 8</span> Demonstration Defense &amp; Scoring Rubric
        </div>
        <table class="rubric-table">
          <thead>
            <tr>
              <th style="width: 22%;">Criteria</th>
              <th style="width: 26%;">Exemplary (4 pts)</th>
              <th style="width: 26%;">Proficient (3 pts)</th>
              <th style="width: 26%;">Developing (1–2 pts)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1. Physical Setup &amp; Repeatability</strong></td>
              <td>Setup is elegant, completely safe, and successfully repeated 2+ times with clear dramatic effect.</td>
              <td>Setup works reliably; demonstrates the intended category with minor execution stumble.</td>
              <td>Fails on multiple attempts; apparatus unstable or pull speed too slow to overcome friction.</td>
            </tr>
            <tr>
              <td><strong>2. Free-Body Diagram Accuracy</strong></td>
              <td>Both FBDs have perfectly labeled arrows, correct relative lengths, and explicit net force notation.</td>
              <td>FBDs are correct with minor labeling omission; correctly shows absence of "forward inertia force."</td>
              <td>Draws unphysical forward force arrow or confuses normal force with inertia.</td>
            </tr>
            <tr>
              <td><strong>3. Scientific Defense (CER)</strong></td>
              <td>Seamlessly links evidence to Mass, Inertia, Friction, and F_net = 0; debunks common myths.</td>
              <td>Clear explanation using mass and inertia; minor imprecision with friction threshold.</td>
              <td>Vague explanation; describes what happened without scientific reasoning or Newton's 1st Law.</td>
            </tr>
            <tr>
              <td><strong>4. Real-World Synthesis</strong></td>
              <td>Deep, accurate connection to automotive safety or modern engineering with life-saving insight.</td>
              <td>Clear everyday connection explained with correct inertia principles.</td>
              <td>Superficial connection; fails to explain the physical mechanism or engineering response.</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- Footer Page 2 -->
    <footer class="worksheet-footer">
      <span>Unit 2: Dynamics · Newton's First Law Demonstration Planner</span>
      <span>Page 2 of 2 · Self-Check &amp; Teacher Defense Score: _____ / 16 pts</span>
      <span>rrmudry.github.io/physics</span>
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
  <title>Teacher Master Key &amp; Exemplar Guide: Inertia Demonstration Planner</title>
  <style>
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
      line-height: 1.25;
      font-size: 8.5pt;
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
    .page-content {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1 1 auto;
      margin-bottom: 2px;
    }
    .worksheet-header {
      border-bottom: 2.5px solid #b91c1c;
      padding-bottom: 4px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-titles h1 {
      font-size: 13pt;
      font-weight: 900;
      color: #b91c1c;
      margin: 0 0 1px 0;
      text-transform: uppercase;
      letter-spacing: -0.3px;
    }
    .header-titles .sub {
      font-size: 8.2pt;
      font-weight: 700;
      color: #475569;
      margin: 0;
      text-transform: uppercase;
    }
    .section-card {
      border: 1.5px solid #cbd5e1;
      border-radius: 4px;
      padding: 6px 8px;
      margin-bottom: 5px;
      background: #ffffff;
    }
    .section-title {
      font-size: 8.8pt;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    .badge-red {
      background: #b91c1c;
      color: #ffffff;
      font-size: 7pt;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .exemplar-text {
      color: #b91c1c;
      font-weight: 600;
    }
    .fbd-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .fbd-card {
      border: 1.2px solid #cbd5e1;
      border-radius: 4px;
      padding: 5px;
      background: #fef2f2;
      font-size: 7.8pt;
    }
    .worksheet-footer {
      border-top: 1.5px solid #cbd5e1;
      padding-top: 3px;
      font-size: 7pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>

  <!-- =====================================================================
       PAGE 1: TEACHER FACILITATION & EXEMPLAR PROTOCOL
       ===================================================================== -->
  <div class="worksheet-page">
    <div class="page-content">

      <header class="worksheet-header">
        <div class="header-titles">
          <h1>TEACHER MASTER KEY &amp; FACILITATION GUIDE</h1>
          <div class="sub">Inertia Demonstration &amp; Physics Defense Planner · Unit 2: Dynamics (NGSS HS-PS2-1)</div>
        </div>
        <div style="text-align: right; font-size: 8pt;">
          <div style="font-weight: 900; color: #b91c1c;">OFFICIAL TEACHER KEY</div>
          <div>Grading &amp; Defense Reference</div>
        </div>
      </header>

      <!-- Facilitation Checklist -->
      <div class="section-card" style="background: #fffbeb; border-color: #f59e0b;">
        <div class="section-title" style="color: #92400e;">
          <span style="background: #d97706; color: #fff; padding: 1px 5px; border-radius: 3px; font-size: 7pt; font-weight: 800;">QUICK START</span>
          Classroom Supply Bin Ideas (Zero-Prep Physics Closet Items)
        </div>
        <div style="font-size: 7.6pt; color: #78350f; line-height: 1.3;">
          <strong>Category 1 (Rest):</strong> Glass 250mL beakers, 3x5 index cards, heavy steel hex nuts or pennies, embroidery hoops, silk tablecloths, textbooks, roll of receipt paper.<br>
          <strong>Category 2 (Motion):</strong> Physics dynamics carts, clay figurines / toy passengers, wooden barrier blocks, track clamps, raw eggs in ziplock bags (optional for high stakes).<br>
          <strong>Category 3 (Direction):</strong> Whirling foam ball on string with razor cutter, curved metal/plastic track segments with side exits, pie tin with 1/4 slice cut out + rolling marble.
        </div>
      </div>

      <!-- Exemplar 1: Category 1 (Rest) -->
      <div class="section-card">
        <div class="section-title">
          <span class="badge-red">Exemplar A</span> Category 1: The Coin-on-Card Beaker Snap (Inertia of Rest)
        </div>
        <div style="font-size: 7.8pt; line-height: 1.35;">
          <strong>Demonstration Codename:</strong> <span class="exemplar-text">"Gravity Trap: The Unbothered Coin"</span><br>
          <strong>Bill of Materials:</strong> 250 mL glass beaker (rigid support), 3x5 index card (low-friction slip barrier), heavy steel washer/coin (inertial mass, m = 25 g), rubber band / finger flick.<br>
          <strong>Safety Catch:</strong> Water in bottom of beaker cushions the impact and prevents glass chipping.<br>
          <strong>Execution Protocol:</strong>
          <ol style="margin: 2px 0 4px 18px; padding: 0;">
            <li><strong>Setup:</strong> Center the index card flat over the mouth of the beaker. Place the heavy steel washer precisely over the geometric center of the beaker opening.</li>
            <li><strong>Action:</strong> Deliver a razor-sharp horizontal finger flick directly to the edge of the index card (a_card &gt; 2,000 m/s²).</li>
            <li><strong>Observation:</strong> The lightweight card accelerates horizontally out from under the washer. The washer remains stationary horizontally (x ≈ 0), then falls vertically straight down into the beaker with an audible clink.</li>
            <li><strong>Repeatability Note:</strong> Flicking at an upward angle lifts the coin; flicking too slowly allows static friction (Fs ≤ μs FN) to drag the coin off the beaker. Must exceed slip acceleration: a_card &gt; μs · g.</li>
          </ol>
        </div>
      </div>

      <!-- Exemplar 2: Category 2 (Motion) -->
      <div class="section-card">
        <div class="section-title">
          <span class="badge-red">Exemplar B</span> Category 2: Unrestrained Cart Passenger Crash (Inertia of Motion)
        </div>
        <div style="font-size: 7.8pt; line-height: 1.35;">
          <strong>Demonstration Codename:</strong> <span class="exemplar-text">"The Ejection Seat: Crash Forensics"</span><br>
          <strong>Bill of Materials:</strong> Dynamics cart, toy figurine / heavy wooden block passenger (m = 0.3 kg), rigid wooden wall / clamp stop, meter stick.<br>
          <strong>Execution Protocol:</strong>
          <ol style="margin: 2px 0 4px 18px; padding: 0;">
            <li><strong>Setup:</strong> Place the wooden block passenger loosely resting on top of the flat dynamics cart (unbelted, no tape).</li>
            <li><strong>Action:</strong> Launch the cart at constant speed (v₀ = 1.5 m/s) toward a rigid track bumper.</li>
            <li><strong>Observation:</strong> When the cart contacts the bumper, an external stopping force acts ON THE CART, halting it instantly. Because strictly zero horizontal stopping force acts on the passenger, the passenger continues moving forward at v₀ = 1.5 m/s, flying off the front of the cart and landing 0.45 m ahead.</li>
            <li><strong>Key Teaching Point:</strong> Point out to students that NO FORWARD FORCE pushed the block forward! It continued purely due to its own inertial mass.</li>
          </ol>
        </div>
      </div>

      <!-- Exemplar 3: Category 3 (Direction) -->
      <div class="section-card">
        <div class="section-title">
          <span class="badge-red">Exemplar C</span> Category 3: Cut-Tether Tangent Release (Inertia of Direction)
        </div>
        <div style="font-size: 7.8pt; line-height: 1.35;">
          <strong>Demonstration Codename:</strong> <span class="exemplar-text">"The Tangent Slingshot: Debunking Centrifugal Force"</span><br>
          <strong>Apparatus:</strong> Marble rolled inside a circular pie tin with a 90° wedge cut out of the rim.<br>
          <strong>Observation:</strong> While in the tin, the rim exerts an inward normal force (centripetal force) forcing the marble into a circular path. The instant the marble reaches the cut-out gap, that inward force drops to exactly 0 N. The marble does NOT curve outward or spiral—it departs along an exact, straight-line tangent vector (θ = 90° to radius) across the lab table.
        </div>
      </div>

    </div>

    <footer class="worksheet-footer">
      <span>Unit 2: Dynamics · Inertia Demonstration Planner · Teacher Master Key</span>
      <span>Page 1 of 2</span>
      <span>rrmudry.github.io/physics</span>
    </footer>
  </div>

  <!-- =====================================================================
       PAGE 2: TEACHER KEY - PHYSICS DEFENSE & REAL-WORLD SYNTHESIS
       ===================================================================== -->
  <div class="worksheet-page">
    <div class="page-content">

      <header class="mini-header" style="border-bottom-color: #b91c1c; color: #b91c1c;">
        <span>Teacher Master Key: Physics Defense (FBD, CER &amp; Real-World Synthesis)</span>
        <span>Newton's First Law (HS-PS2-1)</span>
      </header>

      <!-- Exemplar FBD Defense -->
      <div class="section-card">
        <div class="section-title">
          <span class="badge-red">Phase 5 Key</span> Free-Body Diagram Vector Defense
        </div>
        <div class="fbd-container">
          <div class="fbd-card">
            <div style="font-weight: 800; color: #991b1b; margin-bottom: 2px;">Diagram A: Initial State (At Rest)</div>
            <div style="font-size: 7.4pt; color: #334155; line-height: 1.3;">
              • <strong>Upward Arrow (FN):</strong> Normal contact force from card/surface.<br>
              • <strong>Downward Arrow (Fg):</strong> Gravitational pull of Earth (Fg = m · g).<br>
              • <strong>Arrow Lengths:</strong> Equal and opposite (|FN| = |Fg|).<br>
              • <strong>Net Force:</strong> ΣFx = 0, ΣFy = 0 → Net Force = 0 N. System is in static equilibrium.
            </div>
          </div>

          <div class="fbd-card">
            <div style="font-weight: 800; color: #991b1b; margin-bottom: 2px;">Diagram B: Split-Second Yank/Flick</div>
            <div style="font-size: 7.4pt; color: #334155; line-height: 1.3;">
              • <strong>Vertical:</strong> FN and Fg cancel during horizontal slip.<br>
              • <strong>Horizontal:</strong> Kinetic friction Fk = μk · FN acts briefly in pull direction, but impulse duration Δt is so tiny that Δvx ≈ 0.<br>
              • <strong>CRITICAL GRADING CHECK:</strong> If student draws a "Forward Force of Inertia" (F_inertia), deduct points immediately! Inertia is resistance to acceleration, not a force.
            </div>
          </div>
        </div>
      </div>

      <!-- Exemplar CER -->
      <div class="section-card">
        <div class="section-title">
          <span class="badge-red">Phase 6 Key</span> Scientific Defense: Claim - Evidence - Reasoning (CER)
        </div>
        <div style="font-size: 7.6pt; line-height: 1.35;">
          <strong>1. CLAIM:</strong> <span class="exemplar-text">An object at rest remains at rest when the supporting surface is rapidly accelerated, because the net external horizontal force on the mass is insufficient to overcome its inertia.</span><br>
          <strong>2. EVIDENCE:</strong> <span class="exemplar-text">When the index card was struck horizontally at high speed, the card flew 1.2 meters across the desk, while the 25-gram steel washer dropped vertically straight down into the beaker with zero detectable horizontal displacement.</span><br>
          <strong>3. REASONING:</strong> <span class="exemplar-text">According to Newton's First Law, an object's state of motion can only change if acted upon by an unbalanced net external force (F_net ≠ 0). The washer possesses inertial mass (m = 0.025 kg), which inherently resists changes in motion. Because the card accelerated rapidly, static friction broke away instantly into kinetic friction (Fk = μk · FN). The duration of contact (Δt) was so short that the horizontal impulse (J = F · Δt) transferred negligible momentum to the washer. With zero net horizontal force, the washer maintained its horizontal velocity (vx = 0 m/s), leaving gravity (Fg) as the only unbalanced force, accelerating it downward into the beaker.</span>
        </div>
      </div>

      <!-- Exemplar Real-World Synthesis -->
      <div class="section-card">
        <div class="section-title">
          <span class="badge-red">Phase 7 Key</span> Real-World &amp; Engineering Synthesis
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 7.5pt; line-height: 1.3;">
          <div>
            <strong>A. Real-World System:</strong> <span class="exemplar-text">Automotive 3-Point Inertia-Reel Seatbelts &amp; Pre-tensioners.</span><br><br>
            <strong>B. How Inertia Operates:</strong> <span class="exemplar-text">When a car cruising at 65 mph (29 m/s) collides with a barrier, the car experiences an immediate external braking force. The passenger's body has mass and inertia, so it stubbornly continues cruising forward at 65 mph in uniform motion unless acted upon by an external net force.</span>
          </div>

          <div>
            <strong>C. Engineering Solution:</strong> <span class="exemplar-text">Automotive engineers designed the inertia-reel mechanism: a weighted pendulum or centrifugal clutch locks the belt spool during rapid deceleration (a &gt; 0.7g), exerting a controlled backward normal force (F_belt) on the passenger's torso, safely slowing them synchronously with the car cabin.</span><br><br>
            <strong>D. If Ignored:</strong> <span class="exemplar-text">The unbelted occupant continues in straight-line motion at 65 mph until striking the dashboard or windshield, resulting in fatal trauma.</span>
          </div>
        </div>
      </div>

      <!-- Teacher Scoring Guide -->
      <div class="section-card" style="background: #f8fafc;">
        <div class="section-title" style="color: #1e293b;">
          <span class="badge-red">Grading Key</span> Quick Defense Interview Questions (30-Second Check-in)
        </div>
        <div style="font-size: 7.5pt; color: #334155; line-height: 1.35;">
          • <strong>Question 1:</strong> <em>"What would happen if we used an object with 10 times more mass? Would the trick get easier or harder?"</em><br>
          &nbsp;&nbsp;→ <strong>Answer:</strong> Easier! More mass means more inertia (stubbornness against moving), making it even less likely to move with the cloth/card.<br>
          • <strong>Question 2:</strong> <em>"Why do you have to pull the cloth/card quickly rather than slowly?"</em><br>
          &nbsp;&nbsp;→ <strong>Answer:</strong> Pulling slowly keeps static friction locked (Fs ≤ μs FN). Pulling with acceleration a &gt; μs · g breaks into kinetic friction, and small Δt gives near-zero impulse (J = F · Δt).<br>
          • <strong>Question 3:</strong> <em>"When the cart crashes, what force pushed the passenger forward?"</em><br>
          &nbsp;&nbsp;→ <strong>Answer:</strong> NONE! Trick question. No force pushes them forward; they continue moving by their own inertia.
        </div>
      </div>

    </div>

    <footer class="worksheet-footer">
      <span>Unit 2: Dynamics · Inertia Demonstration Planner · Teacher Master Key</span>
      <span>Page 2 of 2 · Standard: NGSS HS-PS2-1</span>
      <span>rrmudry.github.io/physics</span>
    </footer>
  </div>

</body>
</html>`;
}

async function run() {
  const outDir = path.join(__dirname, '../Unit_2/worksheets');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('🚀 Compiling Inertia Demonstration Planner Worksheet & Teacher Key...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  // 1. Student Worksheet (2 Pages)
  const wsHtml = renderStudentWorksheet();
  const wsHtmlPath = path.join(outDir, 'Inertia_Demonstration_Planner.html');
  const wsPdfPath = path.join(outDir, 'Inertia_Demonstration_Planner.pdf');
  fs.writeFileSync(wsHtmlPath, wsHtml, 'utf8');

  const page1 = await browser.newPage();
  await page1.setContent(wsHtml, { waitUntil: 'networkidle0' });
  await page1.pdf({
    path: wsPdfPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '0.30in', bottom: '0.30in', left: '0.38in', right: '0.38in' }
  });
  await page1.close();
  console.log(`✅ Generated Student Worksheet PDF: ${wsPdfPath}`);

  // 2. Teacher Master Key (2 Pages)
  const keyHtml = renderTeacherMasterKey();
  const keyHtmlPath = path.join(outDir, 'Teacher_Master_Key_Inertia_Demonstration.html');
  const keyPdfPath = path.join(outDir, 'Teacher_Master_Key_Inertia_Demonstration.pdf');
  fs.writeFileSync(keyHtmlPath, keyHtml, 'utf8');

  const page2 = await browser.newPage();
  await page2.setContent(keyHtml, { waitUntil: 'networkidle0' });
  await page2.pdf({
    path: keyPdfPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '0.30in', bottom: '0.30in', left: '0.38in', right: '0.38in' }
  });
  await page2.close();
  console.log(`✅ Generated Teacher Master Key PDF: ${keyPdfPath}`);

  await browser.close();
  console.log('🎉 Inertia Demonstration Worksheet & Master Key compiled successfully!');
}

run().catch(err => {
  console.error('❌ Error compiling worksheet:', err);
  process.exit(1);
});

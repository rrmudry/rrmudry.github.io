/**
 * Generates the Inertia Demonstration & Physics Defense Planner Worksheet and Teacher Master Key
 * Unit 2: Dynamics & Newton's First Law (NGSS HS-PS2-1)
 * 
 * Target: High School Physics & Conceptual Physics
 * - Exactly 1 single page in PDF for Student Worksheet
 * - Exactly 1 single page in PDF for Teacher Master Key & Exemplar Guide
 * - Zero LaTeX notation (plain text, Unicode symbols: Δ, ΣF = 0, F_net = 0, m/s²)
 * - Strict letter portrait print budget (11.0 in x 8.5 in with 0.22in top/bottom, 0.28in left/right margins)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

function renderStudentWorksheet() {
  const htmlPath = path.join(__dirname, '../Unit_2/worksheets/Inertia_Demonstration_Planner.html');
  return fs.readFileSync(htmlPath, 'utf8');
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
      margin: 0.22in 0.28in 0.20in 0.28in;
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
      font-size: 7.2pt;
    }
    .worksheet-page {
      width: 100%;
      height: 10.56in;
      max-height: 10.56in;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      page-break-after: avoid;
    }
    .worksheet-header {
      border-bottom: 2px solid #b91c1c;
      padding-bottom: 3px;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-titles h1 {
      font-size: 11pt;
      font-weight: 900;
      color: #b91c1c;
      margin: 0 0 1px 0;
      text-transform: uppercase;
      letter-spacing: -0.2px;
    }
    .header-titles .sub {
      font-size: 7.2pt;
      font-weight: 700;
      color: #0284c7;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .header-meta {
      font-size: 7.2pt;
      text-align: right;
      color: #b91c1c;
      font-weight: 800;
    }
    .student-fields {
      display: flex;
      gap: 10px;
      font-size: 7.5pt;
      margin-bottom: 4px;
    }
    .field-line {
      border-bottom: 1.2px solid #475569;
      display: inline-block;
      color: #b91c1c;
      font-weight: 700;
    }
    .field-label {
      font-weight: 700;
      color: #334155;
    }
    .mission-box {
      background: #fef2f2;
      border-left: 3px solid #b91c1c;
      padding: 3px 6px;
      font-size: 7pt;
      color: #991b1b;
      margin-bottom: 5px;
      line-height: 1.25;
    }
    .main-grid {
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 7px;
      flex: 1 1 auto;
      margin-bottom: 2px;
    }
    .column {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4px;
    }
    .section-card {
      border: 1.2px solid #cbd5e1;
      border-radius: 3px;
      padding: 4px 6px;
      background: #ffffff;
    }
    .section-title {
      font-size: 7.8pt;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 3px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
    }
    .badge {
      background: #0284c7;
      color: #ffffff;
      font-size: 6.2pt;
      font-weight: 800;
      padding: 1px 4px;
      border-radius: 2px;
      text-transform: uppercase;
    }
    .badge-amber { background: #d97706; }
    .badge-emerald { background: #059669; }
    .badge-red { background: #b91c1c; }
    .category-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
      margin-bottom: 3px;
    }
    .cat-box {
      border: 1px solid #94a3b8;
      border-radius: 2px;
      padding: 3px 4px;
      background: #f8fafc;
      font-size: 6.8pt;
      line-height: 1.15;
    }
    .cat-box.active {
      border: 1.5px solid #b91c1c;
      background: #fef2f2;
    }
    .cat-title {
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 3px;
      margin-bottom: 2px;
      font-size: 7.1pt;
    }
    .cat-desc {
      color: #475569;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 6.9pt;
      margin-top: 2px;
    }
    .data-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 800;
      text-align: left;
      padding: 2px 4px;
      border: 1px solid #cbd5e1;
      font-size: 6.6pt;
      text-transform: uppercase;
    }
    .data-table td {
      border: 1px solid #cbd5e1;
      padding: 2px 4px;
      vertical-align: middle;
    }
    .sketch-box {
      border: 1.2px dashed #94a3b8;
      background: #ffffff;
      border-radius: 3px;
      height: 98px;
      position: relative;
      background-image: radial-gradient(#cbd5e1 0.75px, transparent 0.75px);
      background-size: 13px 13px;
      padding: 3px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .procedure-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
    }
    .step-box {
      border: 1px solid #cbd5e1;
      border-radius: 2px;
      padding: 3px 4px;
      background: #ffffff;
      font-size: 6.8pt;
    }
    .step-label {
      font-weight: 800;
      color: #0284c7;
      margin-bottom: 1px;
      font-size: 6.9pt;
    }
    .key-text {
      color: #b91c1c;
      font-weight: 600;
      font-size: 6.7pt;
      line-height: 1.2;
    }
    .fbd-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      margin-top: 2px;
    }
    .fbd-card {
      border: 1px solid #cbd5e1;
      border-radius: 3px;
      padding: 3px 4px;
      background: #f8fafc;
      font-size: 6.8pt;
    }
    .fbd-head {
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 2px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1px;
      font-size: 6.8pt;
    }
    .fbd-canvas-space {
      height: 64px;
      border: 1px dashed #cbd5e1;
      background: #ffffff;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2px;
      border-radius: 2px;
    }
    .cer-block {
      margin-bottom: 2px;
    }
    .cer-label {
      font-weight: 800;
      color: #0f172a;
      font-size: 7.1pt;
      display: inline-block;
      min-width: 70px;
    }
    .score-grid {
      display: grid;
      grid-template-columns: 1fr 100px;
      gap: 6px;
      align-items: center;
    }
    .rubric-mini {
      font-size: 6.5pt;
      color: #334155;
      line-height: 1.2;
    }
    .score-box {
      border: 1.5px solid #b91c1c;
      border-radius: 3px;
      background: #fef2f2;
      padding: 3px;
      text-align: center;
    }
    .score-title {
      font-size: 6.2pt;
      font-weight: 800;
      color: #991b1b;
      text-transform: uppercase;
    }
    .score-digits {
      font-size: 11pt;
      font-weight: 900;
      color: #b91c1c;
      margin-top: 1px;
    }
    .worksheet-footer {
      border-top: 1.5px solid #cbd5e1;
      padding-top: 2px;
      font-size: 6.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>

  <div class="worksheet-page">
    
    <header class="worksheet-header">
      <div class="header-titles">
        <h1>[TEACHER MASTER KEY] Inertia Demonstration &amp; Physics Defense Planner</h1>
        <div class="sub">Unit 2: Dynamics &amp; Newton's First Law · NGSS HS-PS2-1 · Single-Page Exemplar</div>
      </div>
      <div class="header-meta">
        <div>CONFIDENTIAL TEACHER MASTER KEY</div>
        <div>DOK 3 Exemplar Guide</div>
      </div>
    </header>

    <div class="student-fields">
      <div><span class="field-label">Lead Demonstrator:</span> <span class="field-line" style="width: 170px;">Exemplar Master Key</span></div>
      <div><span class="field-label">Partner(s):</span> <span class="field-line" style="width: 170px;">Physics Department Team</span></div>
      <div><span class="field-label">Period:</span> <span class="field-line" style="width: 40px;">ALL</span></div>
      <div><span class="field-label">Date:</span> <span class="field-line" style="width: 75px;">Unit 2 Dynamics</span></div>
    </div>

    <div class="mission-box">
      <strong>🎯 TEACHER EVALUATION CRITERIA:</strong> Evaluate student designs for authentic physical isolation of inertia (Newton's 1st Law: ΣF = 0). Students must debunk the "forward force" error: <strong>Inertia is NOT an active force</strong> pushing objects forward; it is passive resistance to acceleration.
    </div>

    <div class="main-grid">

      <!-- LEFT COLUMN -->
      <div class="column">

        <div class="section-card">
          <div class="section-title">
            <span class="badge">Phase 1</span> Select Inertia Category &amp; Codename
          </div>
          <div class="category-grid">
            <div class="cat-box active">
              <div class="cat-title" style="color: #b91c1c;"><input type="checkbox" checked> 1. Inertia of Rest</div>
              <div class="cat-desc">Stationary mass stays at rest when supporting surface accelerates (e.g. tablecloth slip, coin-beaker snap).</div>
            </div>
            <div class="cat-box">
              <div class="cat-title"><input type="checkbox"> 2. Inertia of Motion</div>
              <div class="cat-desc">Moving mass continues straight at constant speed when carrier abruptly stops.</div>
            </div>
            <div class="cat-box">
              <div class="cat-title"><input type="checkbox"> 3. Inertia of Direction</div>
              <div class="cat-desc">Circular mass flies along straight tangent line when inward tether is cut.</div>
            </div>
          </div>
          <div style="font-size: 7.2pt; display: flex; gap: 6px; align-items: center;">
            <strong>Demonstration Title / Codename:</strong>
            <span class="field-line" style="flex: 1; color: #b91c1c;">Project Tablecloth Snap: 500g Brass Mass vs. High-Slip Silk</span>
          </div>
        </div>

        <div class="section-card">
          <div class="section-title">
            <span class="badge">Phase 2</span> Bill of Materials &amp; Apparatus Inventory
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30%;">Component Item</th>
                <th style="width: 44%;">Physics Role</th>
                <th style="width: 26%;">Source / Ready</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1. Inertial Mass:</strong></td>
                <td>Resists acceleration (large mass = high inertia)</td>
                <td><span class="key-text">500g Brass Mass</span> [ ✓ ]</td>
              </tr>
              <tr>
                <td><strong>2. Support / Carrier:</strong></td>
                <td>Surface accelerated or halted</td>
                <td><span class="key-text">Silky Fabric Strip</span> [ ✓ ]</td>
              </tr>
              <tr>
                <td><strong>3. Impulse Trigger:</strong></td>
                <td>Applies quick external force (yank, flick)</td>
                <td><span class="key-text">Downward Hand Yank</span> [ ✓ ]</td>
              </tr>
              <tr>
                <td><strong>4. Safety Catch:</strong></td>
                <td>Soft catch (no glass breakables!)</td>
                <td><span class="key-text">Beaker w/ Felt Base</span> [ ✓ ]</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section-card">
          <div class="section-title">
            <span class="badge">Phase 3</span> Setup Blueprint &amp; Vector Diagram
          </div>
          <div class="sketch-box" style="align-items: center; justify-content: center;">
            <svg width="280" height="90" viewBox="0 0 280 90" style="overflow: visible;">
              <!-- Table / Cup -->
              <rect x="90" y="45" width="100" height="40" fill="#f1f5f9" stroke="#334155" stroke-width="1.5" rx="3" />
              <text x="140" y="70" text-anchor="middle" font-size="7" fill="#64748b" font-weight="700">STURDY CUP BASE</text>
              <!-- Fabric strip -->
              <line x1="50" y1="44" x2="220" y2="44" stroke="#d97706" stroke-width="3" />
              <text x="52" y="38" font-size="6.5" fill="#d97706" font-weight="800">Silky Strip</text>
              <!-- Inertial Mass -->
              <circle cx="140" cy="32" r="12" fill="#e2e8f0" stroke="#0f172a" stroke-width="2" />
              <text x="140" y="35" text-anchor="middle" font-size="7" fill="#0f172a" font-weight="900">500g</text>
              <!-- Yank Vector -->
              <line x1="210" y1="44" x2="260" y2="70" stroke="#b91c1c" stroke-width="2.5" marker-end="url(#arrow-red)" />
              <text x="255" y="82" font-size="6.8" fill="#b91c1c" font-weight="800">F_yank (down &amp; away)</text>
              <!-- Gravity Drop arrow -->
              <line x1="140" y1="44" x2="140" y2="60" stroke="#0284c7" stroke-dasharray="3,2" stroke-width="1.5" />
              <text x="145" y="55" font-size="6" fill="#0284c7" font-weight="700">Straight Drop (Δx ≈ 0)</text>
              <defs>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#b91c1c" />
                </marker>
              </defs>
            </svg>
            <div style="position: absolute; bottom: 2px; right: 4px; font-size: 6pt; color: #b91c1c; font-weight: 700;">Exemplar Setup: Clean vertical drop into target</div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-title">
            <span class="badge">Phase 4</span> Execution Protocol (Step-by-Step)
          </div>
          <div class="procedure-grid">
            <div class="step-box">
              <div class="step-label">1. Initial Setup &amp; Alignment</div>
              <div class="key-text">Center 500g mass on slick cloth squarely over cup opening; ensure cloth lies flat without wrinkles.</div>
            </div>
            <div class="step-box">
              <div class="step-label">2. The Action (Quick Impulse)</div>
              <div class="key-text">Grasp cloth tail firmly; pull downward sharply at 45° angle with maximum hand velocity (minimize contact time Δt).</div>
            </div>
            <div class="step-box">
              <div class="step-label">3. Observed Motion (Mass vs Carrier)</div>
              <div class="key-text">Cloth accelerates away instantly; mass stays horizontally motionless, dropping straight into cup via gravity.</div>
            </div>
            <div class="step-box">
              <div class="step-label">4. Troubleshooting &amp; Low Friction</div>
              <div class="key-text">Avoid upward pull (adds vertical normal force). Ensure cloth has low kinetic friction (μk &lt; 0.15).</div>
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN -->
      <div class="column">

        <div class="section-card">
          <div class="section-title">
            <span class="badge badge-amber">Phase 5</span> Free-Body Diagram (FBD) Defense: Proving Net Force
          </div>
          <div class="fbd-container">
            <div class="fbd-card">
              <div class="fbd-head">
                <span>Diagram A: Initial State</span>
                <span style="color: #059669;"><strong>ΣF = 0 (Equilibrium)</strong></span>
              </div>
              <div class="fbd-canvas-space">
                <svg width="120" height="60" viewBox="0 0 120 60">
                  <circle cx="60" cy="30" r="4" fill="#0f172a" />
                  <!-- FN Up -->
                  <line x1="60" y1="30" x2="60" y2="8" stroke="#059669" stroke-width="2" marker-end="url(#arr-green)" />
                  <text x="65" y="14" font-size="6.5" fill="#059669" font-weight="800">F_N = +4.9 N</text>
                  <!-- Fg Down -->
                  <line x1="60" y1="30" x2="60" y2="52" stroke="#059669" stroke-width="2" marker-end="url(#arr-green)" />
                  <text x="65" y="50" font-size="6.5" fill="#059669" font-weight="800">F_g = -4.9 N</text>
                  <defs>
                    <marker id="arr-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#059669" />
                    </marker>
                  </defs>
                </svg>
              </div>
              <div style="font-size: 6.6pt; color: #059669; font-weight: 700;">
                Equilibrium: F_N + F_g = 0 N. No horizontal forces. Constant velocity v = 0 m/s.
              </div>
            </div>

            <div class="fbd-card">
              <div class="fbd-head">
                <span>Diagram B: Split-Second Action</span>
                <span style="color: #b91c1c;"><strong>F_fwd = 0 N (No Push!)</strong></span>
              </div>
              <div class="fbd-canvas-space">
                <svg width="120" height="60" viewBox="0 0 120 60">
                  <circle cx="60" cy="30" r="4" fill="#0f172a" />
                  <!-- Fg Down -->
                  <line x1="60" y1="30" x2="60" y2="52" stroke="#b91c1c" stroke-width="2" marker-end="url(#arr-red2)" />
                  <text x="65" y="50" font-size="6.5" fill="#b91c1c" font-weight="800">F_g (gravity)</text>
                  <!-- Tiny Friction right -->
                  <line x1="60" y1="30" x2="78" y2="30" stroke="#d97706" stroke-width="1.2" marker-end="url(#arr-amber)" />
                  <text x="62" y="24" font-size="5.8" fill="#d97706" font-weight="700">f_k ≈ 0 N</text>
                  <!-- Big NO FORWARD FORCE note -->
                  <line x1="20" y1="30" x2="52" y2="30" stroke="#cbd5e1" stroke-dasharray="2,2" stroke-width="1" />
                  <text x="22" y="26" font-size="5.5" fill="#94a3b8" font-style="italic">NO F_fwd</text>
                  <defs>
                    <marker id="arr-red2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#b91c1c" />
                    </marker>
                    <marker id="arr-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#d97706" />
                    </marker>
                  </defs>
                </svg>
              </div>
              <div style="font-size: 6.6pt; color: #b91c1c; font-weight: 700;">
                Zero forward force! Once support vanishes, F_net is solely downward gravity.
              </div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-title">
            <span class="badge badge-emerald">Phase 6</span> Scientific Defense: Claim - Evidence - Reasoning (CER)
          </div>
          <div class="cer-block">
            <span class="cer-label">1. CLAIM:</span>
            <span class="key-text">The 500g mass remains horizontally stationary because horizontal net force ΣF_x ≈ 0, satisfying Newton's 1st Law.</span>
          </div>
          <div class="cer-block">
            <span class="cer-label">2. EVIDENCE:</span>
            <span class="key-text">Cloth slid away at 4.2 m/s while mass exhibited &lt; 2 mm horizontal displacement before falling straight vertically into cup.</span>
          </div>
          <div class="cer-block">
            <span class="cer-label">3. REASONING:</span>
            <span class="key-text">Mass has high inertia resisting acceleration. The rapid yank minimized contact time Δt, making impulse J = F_friction · Δt negligible. With horizontal F_net ≈ 0, velocity stays at 0 m/s until cloth departs and gravity accelerates it downward.</span>
          </div>
        </div>

        <div class="section-card">
          <div class="section-title">
            <span class="badge">Phase 7</span> Automotive Safety &amp; Modern Engineering Connection
          </div>
          <div style="font-size: 6.8pt; color: #334155; margin-bottom: 2px;">
            <strong>System:</strong> Automotive 3-Point Inertia-Reel Seatbelts &amp; Pre-Tensioners.
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
            <div>
              <div style="font-weight: 700; color: #1e293b; font-size: 6.8pt;">How Inertia Operates:</div>
              <div class="key-text">Vehicle decelerates rapidly in crash; unrestrained passenger continues moving at cruising speed (e.g. 60 mph) by Newton's 1st Law.</div>
            </div>
            <div>
              <div style="font-weight: 700; color: #1e293b; font-size: 6.8pt;">Engineering Solution / Protection:</div>
              <div class="key-text">Weighted pendulum/clutch locks reel instantly; belt applies external backward force, decelerating passenger safely with chassis.</div>
            </div>
          </div>
        </div>

        <div class="section-card" style="background: #fef2f2; border-color: #fca5a5;">
          <div class="section-title" style="margin-bottom: 2px;">
            <span class="badge badge-red">Phase 8</span> Demonstration Scoring Rubric &amp; Exemplar Standard
          </div>
          <div class="score-grid">
            <div class="rubric-mini" style="color: #7f1d1d;">
              • <strong>Apparatus &amp; Protocol (3/3 pts):</strong> Repeatable, safe, itemized apparatus with crisp steps.<br>
              • <strong>FBD Vector Accuracy (3/3 pts):</strong> Equilibrium initial; NO forward force in dynamic action.<br>
              • <strong>CER Scientific Defense (2/2 pts):</strong> Valid claim, quantitative evidence, Newton 1st Law reasoning.<br>
              • <strong>Real-World Synthesis (2/2 pts):</strong> Flawless explanation of inertia-reel locking mechanism.
            </div>
            <div class="score-box">
              <div class="score-title">Teacher Exemplar</div>
              <div class="score-digits">10 / 10</div>
            </div>
          </div>
        </div>

      </div>

    </div>

    <footer class="worksheet-footer">
      <span>Unit 2: Dynamics · Inertia Demonstration Planner · Teacher Master Key</span>
      <span>Single-Page Exemplar Guide · Standard: NGSS HS-PS2-1</span>
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

  console.log('🚀 Compiling Single-Page Inertia Demonstration Planner Worksheet & Teacher Key...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  // 1. Student Worksheet (Single Page)
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
    margin: { top: '0.22in', bottom: '0.20in', left: '0.28in', right: '0.28in' }
  });
  await page1.close();
  console.log(`✅ Generated Single-Page Student Worksheet PDF: ${wsPdfPath}`);

  // Generate bitmap preview using pdftoppm for 100% fidelity
  try {
    const previewPrefix = path.join(outDir, 'preview_Inertia_Planner');
    execSync(`pdftoppm -png -r 150 "${wsPdfPath}" "${previewPrefix}"`);
    console.log(`✅ Rendered 1-page preview image: ${previewPrefix}-1.png`);
  } catch (err) {
    console.warn(`⚠️ pdftoppm preview generation notice:`, err.message);
  }

  // Remove obsolete preview-2 if it exists
  const preview2Path = path.join(outDir, 'preview_Inertia_Planner-2.png');
  if (fs.existsSync(preview2Path)) {
    fs.unlinkSync(preview2Path);
    console.log(`🗑️ Removed obsolete preview_Inertia_Planner-2.png`);
  }

  // 2. Teacher Master Key (Single Page - strictly gitignored)
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
    margin: { top: '0.22in', bottom: '0.20in', left: '0.28in', right: '0.28in' }
  });
  await page2.close();
  console.log(`✅ Generated Single-Page Teacher Master Key PDF: ${keyPdfPath}`);

  try {
    const keyPrefix = path.join(outDir, 'preview_Key_Inertia');
    execSync(`pdftoppm -png -r 150 "${keyPdfPath}" "${keyPrefix}"`);
    const keyPreview2Path = path.join(outDir, 'preview_Key_Inertia-2.png');
    if (fs.existsSync(keyPreview2Path)) {
      fs.unlinkSync(keyPreview2Path);
    }
  } catch (err) {
    // Ignore key preview error
  }

  await browser.close();
  console.log('🎉 Inertia Demonstration Planner compiled successfully into strictly 1-page format!');
}

run().catch(err => {
  console.error('❌ Error compiling worksheet:', err);
  process.exit(1);
});

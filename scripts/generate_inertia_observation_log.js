/**
 * Generates the 2-Page Inertia Demonstration Peer Observation & Synthesis Log for Period 0 Honors Physics
 * Unit 2: Dynamics & Newton's First Law (NGSS HS-PS2-1)
 * 
 * - Exactly 2 pages in PDF for Letter portrait print budget
 * - Generous writing lines and structured observation panels for 8 presentations
 * - Post-demo synthesis and bridge to Net Force (ΣF = 0) and Balanced vs Unbalanced Forces
 * - Zero LaTeX notation (plain text, Unicode symbols: ΣF = 0, F_net, m/s²)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

function renderObservationLogHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Inertia Showcase: Peer Observation &amp; Defense Log (Period 0 Honors)</title>
  <style>
    @page {
      size: letter portrait;
      margin: 0.28in 0.32in 0.26in 0.32in;
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
      font-size: 7.5pt;
    }
    .worksheet-page {
      width: 100%;
      height: 10.46in;
      max-height: 10.46in;
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
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-titles h1 {
      font-size: 11pt;
      font-weight: 900;
      color: #0f172a;
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
      color: #334155;
    }

    /* Meta Bar */
    .student-fields {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.6pt;
      margin-bottom: 4px;
    }
    .field-line {
      border-bottom: 1.2px solid #334155;
      display: inline-block;
    }
    .field-label {
      font-weight: 700;
      color: #1e293b;
    }
    .honors-badge {
      background: #0f172a;
      color: #38bdf8;
      font-size: 6.8pt;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 2px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Briefing Box */
    .briefing-box {
      background: #f8fafc;
      border-left: 3px solid #0284c7;
      padding: 3px 6px;
      font-size: 6.9pt;
      color: #334155;
      margin-bottom: 5px;
      line-height: 1.25;
    }

    /* Observation Panels */
    .panels-container {
      display: flex;
      flex-direction: column;
      gap: 5px;
      flex: 1 1 auto;
    }
    .panel-card {
      border: 1.2px solid #cbd5e1;
      border-radius: 3px;
      padding: 4px 6px;
      background: #ffffff;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
      margin-bottom: 3px;
      font-size: 7.2pt;
    }
    .panel-badge {
      background: #0284c7;
      color: #ffffff;
      font-size: 6.2pt;
      font-weight: 800;
      padding: 1px 4px;
      border-radius: 2px;
      text-transform: uppercase;
    }
    .regime-options {
      display: flex;
      gap: 8px;
      font-size: 6.8pt;
      color: #1e293b;
      font-weight: 600;
    }
    .panel-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 8px;
      row-gap: 3px;
      font-size: 7pt;
    }
    .col-title {
      font-weight: 700;
      color: #0f172a;
      font-size: 6.9pt;
      margin-bottom: 1px;
    }
    .sub-prompt {
      color: #64748b;
      font-size: 6.3pt;
    }
    .writing-line {
      border-bottom: 1px dotted #94a3b8;
      height: 14px;
      margin-top: 1px;
    }
    .rating-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.6pt;
      color: #475569;
      border-top: 1px solid #f1f5f9;
      padding-top: 2px;
      margin-top: 3px;
    }

    /* Page 2 Synthesis Section */
    .synthesis-section {
      border: 1.2px solid #0f172a;
      border-radius: 3px;
      padding: 5px 7px;
      background: #f8fafc;
      margin-top: 5px;
    }
    .synthesis-title {
      font-size: 7.6pt;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 4px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 2px;
      text-transform: uppercase;
    }
    .synthesis-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .synth-item {
      font-size: 7pt;
    }
    .synth-prompt {
      font-weight: 700;
      color: #1e293b;
    }

    /* Score Bar */
    .score-bar {
      border: 1.2px solid #0f172a;
      border-radius: 2px;
      padding: 3px 6px;
      background: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7pt;
      font-weight: 700;
      margin-top: 4px;
      margin-bottom: 2px;
    }

    /* Footer */
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

  <!-- ========================================================
       PAGE 1: PEER OBSERVATION PANELS 1 TO 4
       ======================================================== -->
  <div class="worksheet-page">
    <div style="display: flex; flex-direction: column; flex: 1 1 auto; justify-content: space-between;">
      
      <!-- Top Header -->
      <div>
        <header class="worksheet-header">
          <div class="header-titles">
            <h1>The Inertia Showcase: Live Demonstration &amp; Peer Defense Log</h1>
            <div class="sub">Unit 2: Dynamics &amp; Newton's First Law · NGSS HS-PS2-1 · Period 0 Honors Physics</div>
          </div>
          <div class="header-meta">
            <div><strong>Orange High School · Physics H</strong></div>
            <div>Peer Forensic Critique</div>
          </div>
        </header>

        <!-- Student Meta Bar -->
        <div class="student-fields">
          <div><span class="field-label">Student Observer:</span> <span class="field-line" style="width: 220px;">&nbsp;</span></div>
          <div><span class="field-label">Period:</span> <span class="honors-badge">Period 0 Honors</span></div>
          <div><span class="field-label">Date:</span> <span class="field-line" style="width: 85px;">&nbsp;</span></div>
        </div>

        <!-- Mission & Forensic Instructions -->
        <div class="briefing-box">
          <strong>🎯 OBSERVER PROTOCOL:</strong> As each classmate executes their live demonstration, record the setup and physical regime. In your defense notes, explain why the inertial mass behaved as observed and verify that <strong>zero forward force</strong> acted on it. Debunk any claims that "inertia pushed it."
        </div>
      </div>

      <!-- 4 Structured Panels for Presentations 1 - 4 -->
      <div class="panels-container">
        
        <!-- Panel 1 -->
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <span class="panel-badge">Demo 1</span>
              <strong style="margin-left: 4px;">Demonstrator:</strong> <span class="field-line" style="width: 130px;">&nbsp;</span>
              <strong style="margin-left: 8px;">Codename:</strong> <span class="field-line" style="width: 150px;">&nbsp;</span>
            </div>
            <div class="regime-options">
              <span>[ &nbsp; ] Rest</span>
              <span>[ &nbsp; ] Motion</span>
              <span>[ &nbsp; ] Direction</span>
            </div>
          </div>
          <div class="panel-body">
            <div>
              <div class="col-title">Apparatus &amp; Fast Impulse:</div>
              <div class="sub-prompt">Mass, support surface, and how impulse force was applied:</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
            <div>
              <div class="col-title">Observed Behavior &amp; Physics Defense:</div>
              <div class="sub-prompt">What did mass do? How does this prove Newton's 1st Law (ΣF = 0)?</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
          </div>
          <div class="rating-row">
            <span>Critical Check: Was any unphysical forward force claimed? [ &nbsp; ] Yes (Error) &nbsp; [ &nbsp; ] No (Scientifically Accurate)</span>
            <span>Defense Score: [ 1 ] [ 2 ] [ 3 ] [ 4 ] / 4 pts</span>
          </div>
        </div>

        <!-- Panel 2 -->
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <span class="panel-badge">Demo 2</span>
              <strong style="margin-left: 4px;">Demonstrator:</strong> <span class="field-line" style="width: 130px;">&nbsp;</span>
              <strong style="margin-left: 8px;">Codename:</strong> <span class="field-line" style="width: 150px;">&nbsp;</span>
            </div>
            <div class="regime-options">
              <span>[ &nbsp; ] Rest</span>
              <span>[ &nbsp; ] Motion</span>
              <span>[ &nbsp; ] Direction</span>
            </div>
          </div>
          <div class="panel-body">
            <div>
              <div class="col-title">Apparatus &amp; Fast Impulse:</div>
              <div class="sub-prompt">Mass, support surface, and how impulse force was applied:</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
            <div>
              <div class="col-title">Observed Behavior &amp; Physics Defense:</div>
              <div class="sub-prompt">What did mass do? How does this prove Newton's 1st Law (ΣF = 0)?</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
          </div>
          <div class="rating-row">
            <span>Critical Check: Was any unphysical forward force claimed? [ &nbsp; ] Yes (Error) &nbsp; [ &nbsp; ] No (Scientifically Accurate)</span>
            <span>Defense Score: [ 1 ] [ 2 ] [ 3 ] [ 4 ] / 4 pts</span>
          </div>
        </div>

        <!-- Panel 3 -->
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <span class="panel-badge">Demo 3</span>
              <strong style="margin-left: 4px;">Demonstrator:</strong> <span class="field-line" style="width: 130px;">&nbsp;</span>
              <strong style="margin-left: 8px;">Codename:</strong> <span class="field-line" style="width: 150px;">&nbsp;</span>
            </div>
            <div class="regime-options">
              <span>[ &nbsp; ] Rest</span>
              <span>[ &nbsp; ] Motion</span>
              <span>[ &nbsp; ] Direction</span>
            </div>
          </div>
          <div class="panel-body">
            <div>
              <div class="col-title">Apparatus &amp; Fast Impulse:</div>
              <div class="sub-prompt">Mass, support surface, and how impulse force was applied:</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
            <div>
              <div class="col-title">Observed Behavior &amp; Physics Defense:</div>
              <div class="sub-prompt">What did mass do? How does this prove Newton's 1st Law (ΣF = 0)?</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
          </div>
          <div class="rating-row">
            <span>Critical Check: Was any unphysical forward force claimed? [ &nbsp; ] Yes (Error) &nbsp; [ &nbsp; ] No (Scientifically Accurate)</span>
            <span>Defense Score: [ 1 ] [ 2 ] [ 3 ] [ 4 ] / 4 pts</span>
          </div>
        </div>

        <!-- Panel 4 -->
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <span class="panel-badge">Demo 4</span>
              <strong style="margin-left: 4px;">Demonstrator:</strong> <span class="field-line" style="width: 130px;">&nbsp;</span>
              <strong style="margin-left: 8px;">Codename:</strong> <span class="field-line" style="width: 150px;">&nbsp;</span>
            </div>
            <div class="regime-options">
              <span>[ &nbsp; ] Rest</span>
              <span>[ &nbsp; ] Motion</span>
              <span>[ &nbsp; ] Direction</span>
            </div>
          </div>
          <div class="panel-body">
            <div>
              <div class="col-title">Apparatus &amp; Fast Impulse:</div>
              <div class="sub-prompt">Mass, support surface, and how impulse force was applied:</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
            <div>
              <div class="col-title">Observed Behavior &amp; Physics Defense:</div>
              <div class="sub-prompt">What did mass do? How does this prove Newton's 1st Law (ΣF = 0)?</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
          </div>
          <div class="rating-row">
            <span>Critical Check: Was any unphysical forward force claimed? [ &nbsp; ] Yes (Error) &nbsp; [ &nbsp; ] No (Scientifically Accurate)</span>
            <span>Defense Score: [ 1 ] [ 2 ] [ 3 ] [ 4 ] / 4 pts</span>
          </div>
        </div>

      </div>

    </div>

    <!-- Page 1 Footer -->
    <footer class="worksheet-footer">
      <span>Unit 2: Dynamics · Inertia Peer Observation Log</span>
      <span>Page 1 of 2 · Period 0 Honors Physics</span>
      <span>rrmudry.github.io/physics</span>
    </footer>
  </div>

  <!-- ========================================================
       PAGE 2: PEER OBSERVATION PANELS 5 TO 8 + SYNTHESIS
       ======================================================== -->
  <div class="worksheet-page">
    <div style="display: flex; flex-direction: column; flex: 1 1 auto; justify-content: space-between;">
      
      <!-- Top Header Page 2 -->
      <header class="worksheet-header">
        <div class="header-titles">
          <h1>The Inertia Showcase: Peer Observation &amp; Synthesis Log</h1>
          <div class="sub">Unit 2: Dynamics · Demonstrations 5–8 &amp; Mechanical Equilibrium Synthesis</div>
        </div>
        <div class="header-meta">
          <div><strong>Period 0 Honors Physics</strong></div>
          <div>Page 2 of 2</div>
        </div>
      </header>

      <!-- 4 Structured Panels for Presentations 5 - 8 -->
      <div class="panels-container">
        
        <!-- Panel 5 -->
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <span class="panel-badge">Demo 5</span>
              <strong style="margin-left: 4px;">Demonstrator:</strong> <span class="field-line" style="width: 130px;">&nbsp;</span>
              <strong style="margin-left: 8px;">Codename:</strong> <span class="field-line" style="width: 150px;">&nbsp;</span>
            </div>
            <div class="regime-options">
              <span>[ &nbsp; ] Rest</span>
              <span>[ &nbsp; ] Motion</span>
              <span>[ &nbsp; ] Direction</span>
            </div>
          </div>
          <div class="panel-body">
            <div>
              <div class="col-title">Apparatus &amp; Fast Impulse:</div>
              <div class="sub-prompt">Mass, support surface, and how impulse force was applied:</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
            <div>
              <div class="col-title">Observed Behavior &amp; Physics Defense:</div>
              <div class="sub-prompt">What did mass do? How does this prove Newton's 1st Law (ΣF = 0)?</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
          </div>
          <div class="rating-row">
            <span>Critical Check: Was any unphysical forward force claimed? [ &nbsp; ] Yes (Error) &nbsp; [ &nbsp; ] No (Scientifically Accurate)</span>
            <span>Defense Score: [ 1 ] [ 2 ] [ 3 ] [ 4 ] / 4 pts</span>
          </div>
        </div>

        <!-- Panel 6 -->
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <span class="panel-badge">Demo 6</span>
              <strong style="margin-left: 4px;">Demonstrator:</strong> <span class="field-line" style="width: 130px;">&nbsp;</span>
              <strong style="margin-left: 8px;">Codename:</strong> <span class="field-line" style="width: 150px;">&nbsp;</span>
            </div>
            <div class="regime-options">
              <span>[ &nbsp; ] Rest</span>
              <span>[ &nbsp; ] Motion</span>
              <span>[ &nbsp; ] Direction</span>
            </div>
          </div>
          <div class="panel-body">
            <div>
              <div class="col-title">Apparatus &amp; Fast Impulse:</div>
              <div class="sub-prompt">Mass, support surface, and how impulse force was applied:</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
            <div>
              <div class="col-title">Observed Behavior &amp; Physics Defense:</div>
              <div class="sub-prompt">What did mass do? How does this prove Newton's 1st Law (ΣF = 0)?</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
          </div>
          <div class="rating-row">
            <span>Critical Check: Was any unphysical forward force claimed? [ &nbsp; ] Yes (Error) &nbsp; [ &nbsp; ] No (Scientifically Accurate)</span>
            <span>Defense Score: [ 1 ] [ 2 ] [ 3 ] [ 4 ] / 4 pts</span>
          </div>
        </div>

        <!-- Panel 7 -->
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <span class="panel-badge">Demo 7</span>
              <strong style="margin-left: 4px;">Demonstrator:</strong> <span class="field-line" style="width: 130px;">&nbsp;</span>
              <strong style="margin-left: 8px;">Codename:</strong> <span class="field-line" style="width: 150px;">&nbsp;</span>
            </div>
            <div class="regime-options">
              <span>[ &nbsp; ] Rest</span>
              <span>[ &nbsp; ] Motion</span>
              <span>[ &nbsp; ] Direction</span>
            </div>
          </div>
          <div class="panel-body">
            <div>
              <div class="col-title">Apparatus &amp; Fast Impulse:</div>
              <div class="sub-prompt">Mass, support surface, and how impulse force was applied:</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
            <div>
              <div class="col-title">Observed Behavior &amp; Physics Defense:</div>
              <div class="sub-prompt">What did mass do? How does this prove Newton's 1st Law (ΣF = 0)?</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
          </div>
          <div class="rating-row">
            <span>Critical Check: Was any unphysical forward force claimed? [ &nbsp; ] Yes (Error) &nbsp; [ &nbsp; ] No (Scientifically Accurate)</span>
            <span>Defense Score: [ 1 ] [ 2 ] [ 3 ] [ 4 ] / 4 pts</span>
          </div>
        </div>

        <!-- Panel 8 -->
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <span class="panel-badge">Demo 8</span>
              <strong style="margin-left: 4px;">Demonstrator:</strong> <span class="field-line" style="width: 130px;">&nbsp;</span>
              <strong style="margin-left: 8px;">Codename:</strong> <span class="field-line" style="width: 150px;">&nbsp;</span>
            </div>
            <div class="regime-options">
              <span>[ &nbsp; ] Rest</span>
              <span>[ &nbsp; ] Motion</span>
              <span>[ &nbsp; ] Direction</span>
            </div>
          </div>
          <div class="panel-body">
            <div>
              <div class="col-title">Apparatus &amp; Fast Impulse:</div>
              <div class="sub-prompt">Mass, support surface, and how impulse force was applied:</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
            <div>
              <div class="col-title">Observed Behavior &amp; Physics Defense:</div>
              <div class="sub-prompt">What did mass do? How does this prove Newton's 1st Law (ΣF = 0)?</div>
              <div class="writing-line"></div>
              <div class="writing-line"></div>
            </div>
          </div>
          <div class="rating-row">
            <span>Critical Check: Was any unphysical forward force claimed? [ &nbsp; ] Yes (Error) &nbsp; [ &nbsp; ] No (Scientifically Accurate)</span>
            <span>Defense Score: [ 1 ] [ 2 ] [ 3 ] [ 4 ] / 4 pts</span>
          </div>
        </div>

      </div>

      <!-- Synthesis & Post-Demo Bridge to Net Force -->
      <div class="synthesis-section">
        <div class="synthesis-title">
          <span>🧠 HONORS SYNTHESIS: BRIDGING INERTIA TO BALANCED FORCES (ΣF = 0)</span>
        </div>
        <div class="synthesis-grid">
          <div class="synth-item">
            <span class="synth-prompt">1. Forensic Analysis of Confounding Forces:</span> Which demonstration in class achieved the cleanest isolation of inertia? Explain how the presenter minimized contact time (Δt) and friction to prevent unwanted force transfer:
            <div class="writing-line"></div>
            <div class="writing-line"></div>
          </div>
          <div class="synth-item">
            <span class="synth-prompt">2. The Equilibrium Condition:</span> In every demonstration observed today, whenever the mass stayed at rest or moved at constant velocity, what was the horizontal net force acting on that mass? Write the equation: <strong>ΣF<sub>x</sub> = ____________ N</strong>. What would occur if an unbalanced net force acted?
            <div class="writing-line"></div>
          </div>
        </div>
      </div>

      <!-- Final Score Summary -->
      <div class="score-bar">
        <span>HONORS LOG DEFENSE SCORE:</span>
        <span>• Observation Panels (16 pts)</span>
        <span>• Synthesis &amp; Equilibrium Bridge (4 pts)</span>
        <span style="color: #0284c7; font-size: 8.5pt;">TOTAL: _____ / 20 pts</span>
        <span>Teacher Signature: _________________________</span>
      </div>

    </div>

    <!-- Page 2 Footer -->
    <footer class="worksheet-footer">
      <span>Unit 2: Dynamics · Inertia Peer Observation &amp; Synthesis Log</span>
      <span>Page 2 of 2 · Period 0 Honors Physics · NGSS HS-PS2-1</span>
      <span>rrmudry.github.io/physics</span>
    </footer>
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

  const html = renderObservationLogHtml();
  const htmlPath = path.join(outDir, 'Inertia_Demonstration_Observation_Log.html');
  const pdfPath = path.join(outDir, 'Inertia_Demonstration_Observation_Log.pdf');

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`📄 Wrote HTML template: ${htmlPath}`);

  console.log('🚀 Compiling 2-Page Inertia Observation Log PDF with Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '0.28in', bottom: '0.26in', left: '0.32in', right: '0.32in' }
  });

  await page.close();
  await browser.close();
  console.log(`✅ Generated PDF: ${pdfPath}`);

  // Generate previews using pdftoppm
  try {
    const previewPrefix = path.join(outDir, 'preview_Inertia_Observation_Log');
    execSync(`pdftoppm -png -r 150 "${pdfPath}" "${previewPrefix}"`);
    console.log(`✅ Rendered preview images: ${previewPrefix}-1.png, ${previewPrefix}-2.png`);
  } catch (err) {
    console.warn(`⚠️ pdftoppm preview notice:`, err.message);
  }

  // Verify page count
  const buf = fs.readFileSync(pdfPath);
  const matches = buf.toString('latin1').match(/\/Type\s*\/Page\b/g);
  console.log(`📊 Page Count: ${matches ? matches.length : 'unknown'} (Expected: 2)`);
}

run().catch(err => {
  console.error('❌ Error compiling observation log:', err);
  process.exit(1);
});

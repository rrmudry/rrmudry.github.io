/**
 * Generates the 2-Page Inertia Demonstration Peer Observation & Synthesis Log for Period 0 Honors Physics
 * Unit 2: Dynamics & Newton's First Law (NGSS HS-PS2-1)
 * 
 * - Exactly 2 pages in PDF for Letter portrait print budget
 * - Replaces repeating box panels with a clean, spacious Observation Table
 * - Clear instructions and rubric at top of Page 1
 * - Generous writing lines inside table cells for 10 presentations (5 on Page 1, 5 on Page 2)
 * - Post-demo synthesis and bridge to Net Force (ΣF = 0) and Balanced vs Unbalanced Forces
 * - Zero LaTeX notation (plain text, Unicode symbols: ΣF = 0, F_net, m/s²)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

function renderTableRow(demoNum, rowHeight) {
  return `
    <tr style="height: ${rowHeight}px;">
      <!-- Demo # & Presenter -->
      <td class="col-demo">
        <div class="demo-badge">Demo ${demoNum}</div>
        <div class="cell-field">
          <span class="field-lbl">Presenter:</span>
          <span class="field-blank">&nbsp;</span>
        </div>
        <div class="cell-field">
          <span class="field-lbl">Codename:</span>
          <span class="field-blank">&nbsp;</span>
        </div>
      </td>

      <!-- Category -->
      <td class="col-cat">
        <div class="cat-options">
          <label class="cat-opt"><span class="box-sq">[ &nbsp; ]</span> Rest</label>
          <label class="cat-opt"><span class="box-sq">[ &nbsp; ]</span> Motion</label>
          <label class="cat-opt"><span class="box-sq">[ &nbsp; ]</span> Direction</label>
        </div>
      </td>

      <!-- Apparatus & Applied Impulse -->
      <td class="col-apparatus">
        <div class="cell-writing-area">
          <div class="write-line"></div>
          <div class="write-line"></div>
          <div class="write-line"></div>
        </div>
      </td>

      <!-- Observed Motion & Physics Defense -->
      <td class="col-defense">
        <div class="cell-writing-area">
          <div class="write-line"></div>
          <div class="write-line"></div>
          <div class="write-line"></div>
        </div>
        <div class="fwd-check">
          <span class="fwd-lbl">Forward Force Claimed?</span>
          <span class="fwd-box">[ &nbsp; ] Yes <span class="err-tag">(Error)</span></span>
          <span class="fwd-box">[ &nbsp; ] No <span class="acc-tag">(Accurate)</span></span>
        </div>
      </td>

      <!-- Score -->
      <td class="col-score">
        <div class="score-val">____ / 4</div>
        <div class="score-pills">
          <span>[ 4 ]</span> <span>[ 3 ]</span><br>
          <span>[ 2 ]</span> <span>[ 1 ]</span>
        </div>
      </td>
    </tr>
  `;
}

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
      line-height: 1.25;
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
      font-size: 11.5pt;
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

    /* Student Meta Bar */
    .student-fields {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.6pt;
      margin-bottom: 5px;
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
      padding: 1.5px 6px;
      border-radius: 2px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Instructions & Rubric Banner */
    .instruction-card {
      background: #f8fafc;
      border: 1.2px solid #cbd5e1;
      border-left: 3.5px solid #0284c7;
      border-radius: 3px;
      padding: 4px 8px;
      margin-bottom: 6px;
    }
    .instruction-card-title {
      font-size: 7.3pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .instruction-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      column-gap: 10px;
      font-size: 6.7pt;
      color: #334155;
      line-height: 1.28;
    }
    .instruction-col strong {
      color: #0f172a;
    }
    .alert-tag {
      color: #b91c1c;
      font-weight: 700;
    }

    /* Observation Table */
    .table-container {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
    }
    table.obs-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: 1.5px solid #0f172a;
    }
    table.obs-table thead th {
      background: #0f172a;
      color: #ffffff;
      padding: 4px 6px;
      font-size: 7.2pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      border-right: 1px solid #334155;
      text-align: left;
      vertical-align: top;
    }
    table.obs-table thead th:last-child {
      border-right: none;
      text-align: center;
    }
    .th-sub {
      display: block;
      font-size: 6pt;
      font-weight: 500;
      color: #94a3b8;
      text-transform: none;
      margin-top: 1px;
      line-height: 1.15;
    }

    /* Table Rows & Cells */
    table.obs-table tbody tr {
      border-bottom: 1.5px solid #94a3b8;
    }
    table.obs-table tbody tr:last-child {
      border-bottom: none;
    }
    table.obs-table tbody td {
      border-right: 1px solid #cbd5e1;
      padding: 4px 6px;
      vertical-align: top;
      background: #ffffff;
    }
    table.obs-table tbody td:last-child {
      border-right: none;
    }

    /* Col 1: Demo & Presenter */
    .col-demo {
      width: 17%;
    }
    .demo-badge {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      font-size: 6.8pt;
      font-weight: 800;
      padding: 1.5px 5px;
      border-radius: 2px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .cell-field {
      font-size: 6.8pt;
      margin-bottom: 3px;
      display: flex;
      align-items: flex-end;
    }
    .field-lbl {
      font-weight: 700;
      color: #1e293b;
      margin-right: 3px;
    }
    .field-blank {
      flex: 1;
      border-bottom: 1px solid #64748b;
      height: 10px;
    }

    /* Col 2: Category */
    .col-cat {
      width: 11%;
    }
    .cat-options {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 6.8pt;
      font-weight: 600;
      color: #1e293b;
      padding-top: 2px;
    }
    .cat-opt {
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .box-sq {
      font-family: monospace;
      font-weight: 700;
    }

    /* Col 3 & 4: Writing Areas */
    .col-apparatus {
      width: 27%;
    }
    .col-defense {
      width: 36%;
    }
    .cell-writing-area {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .write-line {
      border-bottom: 1px dotted #94a3b8;
      height: 18px;
    }
    .fwd-check {
      margin-top: 4px;
      padding-top: 2px;
      border-top: 1px solid #f1f5f9;
      font-size: 6.4pt;
      display: flex;
      align-items: center;
      gap: 6px;
      color: #334155;
    }
    .fwd-lbl {
      font-weight: 700;
      color: #0f172a;
    }
    .fwd-box {
      font-family: monospace;
      font-weight: 600;
    }
    .err-tag {
      color: #b91c1c;
      font-weight: 700;
      font-family: sans-serif;
    }
    .acc-tag {
      color: #166534;
      font-weight: 700;
      font-family: sans-serif;
    }

    /* Col 5: Score */
    .col-score {
      width: 9%;
      text-align: center;
    }
    .score-val {
      font-size: 7.2pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 2px;
      margin-bottom: 4px;
    }
    .score-pills {
      font-size: 6.2pt;
      color: #475569;
      line-height: 1.35;
      font-weight: 700;
    }

    /* Page 2 Synthesis Section */
    .synthesis-section {
      border: 1.5px solid #0f172a;
      border-radius: 3px;
      padding: 5px 8px;
      background: #f8fafc;
      margin-top: 6px;
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
      gap: 5px;
    }
    .synth-item {
      font-size: 7pt;
      color: #1e293b;
      line-height: 1.25;
    }
    .synth-prompt {
      font-weight: 700;
      color: #0f172a;
    }

    /* Score Bar */
    .score-bar {
      border: 1.5px solid #0f172a;
      border-radius: 2px;
      padding: 3px 8px;
      background: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.2pt;
      font-weight: 700;
      margin-top: 5px;
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
       PAGE 1: INSTRUCTIONS & TABLE ROWS 1 TO 5
       ======================================================== -->
  <div class="worksheet-page">
    <div style="display: flex; flex-direction: column; flex: 1 1 auto;">
      
      <!-- Header -->
      <header class="worksheet-header">
        <div class="header-titles">
          <h1>The Inertia Showcase: Live Demonstration &amp; Peer Defense Log</h1>
          <div class="sub">Unit 2: Dynamics &amp; Newton's First Law · NGSS HS-PS2-1 · Period 0 Honors Physics</div>
        </div>
        <div class="header-meta">
          <div><strong>Orange High School · Physics H</strong></div>
          <div>Peer Forensic Evaluation Ledger</div>
        </div>
      </header>

      <!-- Student Meta Fields -->
      <div class="student-fields">
        <div>
          <span class="field-label">Student Observer:</span>
          <span class="field-line" style="width: 220px;">&nbsp;</span>
        </div>
        <div>
          <span class="field-label">Period:</span>
          <span class="honors-badge">Period 0 Honors</span>
        </div>
        <div>
          <span class="field-label">Date:</span>
          <span class="field-line" style="width: 100px;">&nbsp;</span>
        </div>
      </div>

      <!-- Top Instructions & Rubric Card -->
      <div class="instruction-card">
        <div class="instruction-card-title">
          <span>🎯 Observer Protocol &amp; Scientific Defense Criteria</span>
        </div>
        <div class="instruction-grid">
          <div class="instruction-col">
            <strong>1. Apparatus &amp; Applied Impulse:</strong> Record the object/mass used, surface interface, and how the sudden force was applied to minimize impulse time (Δt) and friction.
          </div>
          <div class="instruction-col">
            <strong>2. Newton's 1st Law Defense:</strong> Explain why the mass behaved as observed using <strong>ΣF = 0</strong>. <span class="alert-tag">CRITICAL CHECK:</span> Verify presenter does <strong>NOT</strong> claim an unphysical "forward force of inertia" pushed the mass!
          </div>
          <div class="instruction-col">
            <strong>3. Defense Score (1–4 pts):</strong><br>
            <strong>4:</strong> Flawless 1st Law defense, zero forward force.<br>
            <strong>3:</strong> Minor clarity gap. <strong>2:</strong> Claimed inertia force.<br>
            <strong>1:</strong> Incomplete or unphysical defense.
          </div>
        </div>
      </div>

      <!-- Observation Table: Demos 1 to 5 -->
      <div class="table-container">
        <table class="obs-table">
          <thead>
            <tr>
              <th style="width: 17%;">Demo &amp; Presenter<span class="th-sub">Name &amp; Demo Title</span></th>
              <th style="width: 11%;">Category<span class="th-sub">Regime (Check 1)</span></th>
              <th style="width: 27%;">Apparatus &amp; Applied Impulse<span class="th-sub">Mass, support surface &amp; how quick impulse was applied (Δt)</span></th>
              <th style="width: 36%;">Observed Motion &amp; Physics Defense (ΣF = 0)<span class="th-sub">What mass did, Newton's 1st Law defense &amp; check for forward force</span></th>
              <th style="width: 9%;">Score<span class="th-sub">1–4 pts</span></th>
            </tr>
          </thead>
          <tbody>
            ${renderTableRow(1, 138)}
            ${renderTableRow(2, 138)}
            ${renderTableRow(3, 138)}
            ${renderTableRow(4, 138)}
            ${renderTableRow(5, 138)}
          </tbody>
        </table>
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
       PAGE 2: TABLE ROWS 6 TO 10 + HONORS SYNTHESIS
       ======================================================== -->
  <div class="worksheet-page">
    <div style="display: flex; flex-direction: column; flex: 1 1 auto; justify-content: space-between;">
      
      <!-- Top Header Page 2 -->
      <header class="worksheet-header">
        <div class="header-titles">
          <h1>The Inertia Showcase: Peer Observation &amp; Synthesis Log</h1>
          <div class="sub">Unit 2: Dynamics · Demonstrations 6–10 &amp; Mechanical Equilibrium Synthesis</div>
        </div>
        <div class="header-meta">
          <div><strong>Period 0 Honors Physics</strong></div>
          <div>Page 2 of 2</div>
        </div>
      </header>

      <!-- Observation Table: Demos 6 to 10 -->
      <div class="table-container">
        <table class="obs-table">
          <thead>
            <tr>
              <th style="width: 17%;">Demo &amp; Presenter<span class="th-sub">Name &amp; Demo Title</span></th>
              <th style="width: 11%;">Category<span class="th-sub">Regime (Check 1)</span></th>
              <th style="width: 27%;">Apparatus &amp; Applied Impulse<span class="th-sub">Mass, support surface &amp; how quick impulse was applied (Δt)</span></th>
              <th style="width: 36%;">Observed Motion &amp; Physics Defense (ΣF = 0)<span class="th-sub">What mass did, Newton's 1st Law defense &amp; check for forward force</span></th>
              <th style="width: 9%;">Score<span class="th-sub">1–4 pts</span></th>
            </tr>
          </thead>
          <tbody>
            ${renderTableRow(6, 94)}
            ${renderTableRow(7, 94)}
            ${renderTableRow(8, 94)}
            ${renderTableRow(9, 94)}
            ${renderTableRow(10, 94)}
          </tbody>
        </table>
      </div>

      <!-- Synthesis & Post-Demo Bridge to Net Force -->
      <div class="synthesis-section">
        <div class="synthesis-title">
          <span>🧠 HONORS SYNTHESIS: BRIDGING INERTIA TO BALANCED FORCES (ΣF = 0)</span>
        </div>
        <div class="synthesis-grid">
          <div class="synth-item">
            <span class="synth-prompt">1. Forensic Analysis of Confounding Forces:</span> Which demonstration in class achieved the cleanest isolation of inertia? Explain how the presenter minimized contact time (Δt) and friction to prevent unwanted force transfer:
            <div class="write-line" style="margin-top: 2px;"></div>
            <div class="write-line"></div>
          </div>
          <div class="synth-item">
            <span class="synth-prompt">2. The Equilibrium Condition:</span> In every demonstration observed today, whenever the mass stayed at rest or moved at constant velocity, what was the horizontal net force acting on that mass? Write the equation: <strong>ΣF<sub>x</sub> = ____________ N</strong>. What would occur if an unbalanced net force acted?
            <div class="write-line" style="margin-top: 2px;"></div>
            <div class="write-line"></div>
          </div>
        </div>
      </div>

      <!-- Final Score Summary -->
      <div class="score-bar">
        <span>HONORS LOG DEFENSE SCORE:</span>
        <span>• Observation Table (16 pts)</span>
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

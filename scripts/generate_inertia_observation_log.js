/**
 * Generates the 2-Page Inertia Demonstration Peer Observation Log for Period 0 Honors Physics
 * Unit 2: Dynamics & Newton's First Law (NGSS HS-PS2-1)
 * 
 * - Exactly 2 pages in PDF for Letter portrait print budget
 * - 15 total demonstrations (8 on Page 1, 7 on Page 2)
 * - 100% Black-and-White Laser Printer Friendly (pure black text, crisp borders, no heavy dark ink fills)
 * - Widened Demo & Presenter column with generous writing space for Presenter and Demo Title
 * - Expansive dedicated column: "How the Demonstration Utilizes Inertia to be Successful"
 * - Removed score column per instructor requirement
 * - Clean Section B Synthesis on Page 2 bridging inertia to mechanical equilibrium (ΣF = 0)
 * - Zero LaTeX notation (plain text, Unicode symbols: ΣF = 0, F_net)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

function renderTableRow(demoNum, rowHeight) {
  return `
    <tr style="height: ${rowHeight}px;">
      <!-- Column 1: Demo # & Presenter Info (34% width) -->
      <td class="col-demo">
        <div class="demo-top-bar">
          <span class="demo-badge">DEMO ${demoNum}</span>
          <div class="cat-checks">
            <label class="cat-label"><span class="box-sq">[ &nbsp; ]</span> Rest</label>
            <label class="cat-label"><span class="box-sq">[ &nbsp; ]</span> Motion</label>
            <label class="cat-label"><span class="box-sq">[ &nbsp; ]</span> Direction</label>
          </div>
        </div>
        <div class="field-row presenter-row">
          <span class="field-tag">Presenter(s):</span>
          <span class="field-blank">&nbsp;</span>
        </div>
        <div class="field-row title-row">
          <span class="field-tag">Demo Title:</span>
          <span class="field-blank">&nbsp;</span>
        </div>
      </td>

      <!-- Column 2: How the Demo Utilizes Inertia to be Successful (66% width) -->
      <td class="col-inertia-desc">
        <div class="write-lines-wrap">
          <div class="write-line"></div>
          <div class="write-line"></div>
          <div class="write-line"></div>
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
  <title>The Inertia Showcase: Peer Observation Log (Period 0 Honors)</title>
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
      color: #000000;
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
      background: #ffffff;
    }
    .worksheet-page:last-child {
      page-break-after: avoid;
    }

    /* Header (100% Laser Printer Friendly) */
    .worksheet-header {
      border-bottom: 2px solid #000000;
      padding-bottom: 3px;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header-titles h1 {
      font-size: 11pt;
      font-weight: 900;
      color: #000000;
      margin: 0 0 1px 0;
      text-transform: uppercase;
      letter-spacing: -0.2px;
    }
    .header-titles .sub {
      font-size: 7.2pt;
      font-weight: 700;
      color: #000000;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .header-meta {
      font-size: 7.2pt;
      text-align: right;
      color: #000000;
      font-weight: 600;
    }

    /* Student Meta Bar */
    .student-fields {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.6pt;
      margin-bottom: 4px;
      padding-bottom: 3px;
      border-bottom: 1px solid #000000;
    }
    .field-line {
      border-bottom: 1.2px solid #000000;
      display: inline-block;
    }
    .field-label {
      font-weight: 700;
      color: #000000;
    }
    .honors-badge {
      border: 1.5px solid #000000;
      background: #ffffff;
      color: #000000;
      font-size: 7pt;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 2px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Instructions Box (High Contrast B&W) */
    .instruction-card {
      background: #ffffff;
      border: 1.5px solid #000000;
      border-radius: 2px;
      padding: 4px 6px;
      margin-bottom: 5px;
    }
    .instruction-card-title {
      font-size: 7.3pt;
      font-weight: 800;
      color: #000000;
      text-transform: uppercase;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .instruction-text {
      font-size: 6.8pt;
      color: #000000;
      line-height: 1.28;
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
      border: 1.5px solid #000000;
    }
    table.obs-table thead th {
      background: #f4f4f5;
      color: #000000;
      padding: 4px 6px;
      font-size: 7.2pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      border: 1.5px solid #000000;
      text-align: left;
      vertical-align: middle;
    }
    .th-sub {
      display: block;
      font-size: 6pt;
      font-weight: 500;
      color: #333333;
      text-transform: none;
      margin-top: 1px;
      line-height: 1.15;
    }

    /* Table Rows & Cells */
    table.obs-table tbody tr {
      border-bottom: 1.5px solid #000000;
    }
    table.obs-table tbody td {
      border: 1px solid #000000;
      padding: 3px 6px;
      vertical-align: top;
      background: #ffffff;
    }

    /* Column 1: Demo & Presenter */
    .col-demo {
      width: 34%;
    }
    .demo-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3px;
      padding-bottom: 2px;
      border-bottom: 1px dashed #666666;
    }
    .demo-badge {
      display: inline-block;
      border: 1.5px solid #000000;
      background: #000000;
      color: #ffffff;
      font-size: 6.8pt;
      font-weight: 900;
      padding: 1px 5px;
      border-radius: 2px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .cat-checks {
      display: flex;
      gap: 6px;
      font-size: 6.7pt;
      font-weight: 700;
      color: #000000;
    }
    .cat-label {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .box-sq {
      font-family: monospace;
      font-weight: 700;
      font-size: 7pt;
    }
    .field-row {
      font-size: 6.9pt;
      display: flex;
      align-items: flex-end;
    }
    .field-row.presenter-row {
      margin-top: 14px;
      margin-bottom: 0;
    }
    .field-row.title-row {
      margin-top: 18px;
      margin-bottom: 0;
    }
    .field-tag {
      font-weight: 700;
      color: #000000;
      margin-right: 4px;
      white-space: nowrap;
    }
    .field-blank {
      flex: 1;
      border-bottom: 1.2px solid #000000;
      height: 10px;
    }

    /* Column 2: Inertia Explanation */
    .col-inertia-desc {
      width: 66%;
    }
    .write-lines-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 1px;
    }
    .write-line {
      border-bottom: 1px dotted #444444;
      height: 17px;
    }

    /* Page 2 Synthesis Section */
    .synthesis-section {
      border: 1.5px solid #000000;
      border-radius: 2px;
      padding: 4px 6px;
      background: #ffffff;
      margin-top: 5px;
    }
    .synthesis-title {
      font-size: 7.4pt;
      font-weight: 800;
      color: #000000;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 3px;
      border-bottom: 1px solid #000000;
      padding-bottom: 2px;
      text-transform: uppercase;
    }
    .synthesis-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .synth-item {
      font-size: 6.9pt;
      color: #000000;
      line-height: 1.22;
    }
    .synth-prompt {
      font-weight: 700;
      color: #000000;
    }

    /* Verification Bar */
    .verify-bar {
      border: 1.5px solid #000000;
      border-radius: 2px;
      padding: 3px 6px;
      background: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.2pt;
      font-weight: 700;
      margin-top: 4px;
      margin-bottom: 2px;
    }

    /* Footer */
    .worksheet-footer {
      border-top: 1.5px solid #000000;
      padding-top: 2px;
      font-size: 6.5pt;
      color: #000000;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>

  <!-- ========================================================
       PAGE 1: INSTRUCTIONS & TABLE ROWS 1 TO 8 (8 DEMOS)
       ======================================================== -->
  <div class="worksheet-page">
    <div style="display: flex; flex-direction: column; flex: 1 1 auto;">
      
      <!-- Header -->
      <header class="worksheet-header">
        <div class="header-titles">
          <h1>The Inertia Showcase: Live Demonstration Observation Log</h1>
          <div class="sub">Unit 2: Dynamics &amp; Newton's First Law · Period 0 Honors Physics</div>
        </div>
        <div class="header-meta">
          <div><strong>Orange High School · Physics H</strong></div>
          <div>Inertia Peer Observation Ledger</div>
        </div>
      </header>

      <!-- Student Meta Fields -->
      <div class="student-fields">
        <div>
          <span class="field-label">Student Observer:</span>
          <span class="field-line" style="width: 230px;">&nbsp;</span>
        </div>
        <div>
          <span class="field-label">Period:</span>
          <span class="honors-badge">Period 0 Honors</span>
        </div>
        <div>
          <span class="field-label">Date:</span>
          <span class="field-line" style="width: 110px;">&nbsp;</span>
        </div>
      </div>

      <!-- Top Instructions Card -->
      <div class="instruction-card">
        <div class="instruction-card-title">
          <span>Observer Instructions:</span>
        </div>
        <div class="instruction-text">
          As each classmate performs their live demonstration, record the presenter(s), demo title, and physical category (Rest, Motion, or Direction). In the right column, <strong>explain how you believe the demonstration utilizes inertia to be successful</strong> (explain why the object maintains its state of rest or motion, how the quick action prevents unwanted force transfer, and verify that <em>no forward force</em> acts on the mass).
        </div>
      </div>

      <!-- Observation Table: Demos 1 to 8 -->
      <div class="table-container">
        <table class="obs-table">
          <thead>
            <tr>
              <th style="width: 34%;">
                Demo &amp; Presenter
                <span class="th-sub">Presenter Name(s), Demo Title &amp; Category</span>
              </th>
              <th style="width: 66%;">
                How the Demonstration Utilizes Inertia to be Successful
                <span class="th-sub">Explain why the mass behaves as observed using Newton's 1st Law (resistance to acceleration, ΣF = 0, zero forward force)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            ${renderTableRow(1, 95)}
            ${renderTableRow(2, 95)}
            ${renderTableRow(3, 95)}
            ${renderTableRow(4, 95)}
            ${renderTableRow(5, 95)}
            ${renderTableRow(6, 95)}
            ${renderTableRow(7, 95)}
            ${renderTableRow(8, 95)}
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
       PAGE 2: TABLE ROWS 9 TO 15 (7 DEMOS) + SYNTHESIS
       ======================================================== -->
  <div class="worksheet-page">
    <div style="display: flex; flex-direction: column; flex: 1 1 auto; justify-content: space-between;">
      
      <!-- Top Header Page 2 -->
      <header class="worksheet-header">
        <div class="header-titles">
          <h1>The Inertia Showcase: Live Demonstration Observation Log</h1>
          <div class="sub">Unit 2: Dynamics · Demonstrations 9–15 &amp; Equilibrium Synthesis</div>
        </div>
        <div class="header-meta">
          <div><strong>Period 0 Honors Physics</strong></div>
          <div>Page 2 of 2</div>
        </div>
      </header>

      <!-- Observation Table: Demos 9 to 15 -->
      <div class="table-container">
        <table class="obs-table">
          <thead>
            <tr>
              <th style="width: 34%;">
                Demo &amp; Presenter
                <span class="th-sub">Presenter Name(s), Demo Title &amp; Category</span>
              </th>
              <th style="width: 66%;">
                How the Demonstration Utilizes Inertia to be Successful
                <span class="th-sub">Explain why the mass behaves as observed using Newton's 1st Law (resistance to acceleration, ΣF = 0, zero forward force)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            ${renderTableRow(9, 93)}
            ${renderTableRow(10, 93)}
            ${renderTableRow(11, 93)}
            ${renderTableRow(12, 93)}
            ${renderTableRow(13, 93)}
            ${renderTableRow(14, 93)}
            ${renderTableRow(15, 93)}
          </tbody>
        </table>
      </div>

      <!-- Synthesis & Post-Demo Bridge to Net Force -->
      <div class="synthesis-section">
        <div class="synthesis-title">
          <span>Honors Synthesis: Bridging Inertia to Mechanical Equilibrium (ΣF = 0)</span>
        </div>
        <div class="synthesis-grid">
          <div class="synth-item">
            <span class="synth-prompt">1. Minimizing Unwanted Force Transfer:</span> Which demonstration observed today achieved the cleanest isolation of inertia? Explain how the presenter minimized contact time (Δt) and friction to prevent unwanted force from disturbing the mass:
            <div class="write-line" style="margin-top: 2px;"></div>
            <div class="write-line"></div>
          </div>
          <div class="synth-item">
            <span class="synth-prompt">2. The Equilibrium Condition:</span> In every demonstration observed today, whenever the mass stayed at rest or moved at constant velocity, what was the horizontal net force acting on that mass? Write the equation: <strong>ΣF<sub>x</sub> = ____________ N</strong>. What happens the instant an unbalanced net force acts?
            <div class="write-line" style="margin-top: 2px;"></div>
          </div>
        </div>
      </div>

      <!-- Verification Bar -->
      <div class="verify-bar">
        <span>Demonstrations Logged: _____ / 15</span>
        <span>Honors Synthesis Check: [ &nbsp; ] Complete</span>
        <span>Teacher Verification: _________________________</span>
      </div>

    </div>

    <!-- Page 2 Footer -->
    <footer class="worksheet-footer">
      <span>Unit 2: Dynamics · Inertia Peer Observation Log</span>
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

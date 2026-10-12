/**
 * Generates the Cardstock Rocket Annotated Reading Worksheet and Lab Guide PDFs
 * Unit 2: Kinematics & Newtonian Dynamics (NGSS HS-PS2-1, HS-ETS1-2)
 * 
 * Target: High School Physics & Conceptual Physics
 * - Exactly 2 pages in PDF for Annotated Reading Worksheet
 * - Exactly 2 pages in PDF for Rocket Engineering Lab Guide
 * - Zero LaTeX notation (plain text, Unicode symbols: Δ, a = F_net/m, m/s², v₀, h_max)
 * - Strict letter portrait print budget (11.0 in x 8.5 in with 0.24in top/bottom, 0.30in left/right margins)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

async function run() {
  const outDir = path.join(__dirname, '../Unit_2/worksheets');
  console.log('🚀 Compiling Cardstock Rocket Worksheets & Lab Guides into PDF...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  // 1. Cardstock Rocket Annotated Reading Worksheet (2 Pages)
  const readingHtmlPath = path.join(outDir, 'Cardstock_Rocket_Annotated_Reading.html');
  const readingPdfPath = path.join(outDir, 'Cardstock_Rocket_Annotated_Reading.pdf');
  const readingHtml = fs.readFileSync(readingHtmlPath, 'utf8');

  const page1 = await browser.newPage();
  await page1.setContent(readingHtml, { waitUntil: 'networkidle0' });
  await page1.pdf({
    path: readingPdfPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '0in', bottom: '0in', left: '0in', right: '0in' }
  });
  await page1.close();
  console.log(`✅ Generated Cardstock Rocket Annotated Reading PDF: ${readingPdfPath}`);

  // Generate bitmap preview using pdftoppm
  try {
    const previewPrefix = path.join(outDir, 'preview_Rocket_Reading');
    execSync(`pdftoppm -png -r 150 "${readingPdfPath}" "${previewPrefix}"`);
    console.log(`✅ Rendered Reading preview images: ${previewPrefix}-1.png, ${previewPrefix}-2.png`);
  } catch (err) {
    console.warn(`⚠️ pdftoppm preview generation notice:`, err.message);
  }

  // 2. Cardstock Rocket Lab Guide (2 Pages)
  const labHtmlPath = path.join(outDir, 'Cardstock_Rocket_Lab_Guide.html');
  const labPdfPath = path.join(outDir, 'Cardstock_Rocket_Lab_Guide.pdf');
  const labHtml = fs.readFileSync(labHtmlPath, 'utf8');

  const page2 = await browser.newPage();
  await page2.setContent(labHtml, { waitUntil: 'networkidle0' });
  await page2.pdf({
    path: labPdfPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '0.24in', bottom: '0.24in', left: '0.30in', right: '0.30in' }
  });
  await page2.close();
  console.log(`✅ Generated Cardstock Rocket Lab Guide PDF: ${labPdfPath}`);

  // Generate bitmap preview using pdftoppm
  try {
    const previewPrefixLab = path.join(outDir, 'preview_Rocket_Lab');
    execSync(`pdftoppm -png -r 150 "${labPdfPath}" "${previewPrefixLab}"`);
    console.log(`✅ Rendered Lab Guide preview images: ${previewPrefixLab}-1.png, ${previewPrefixLab}-2.png`);
  } catch (err) {
    console.warn(`⚠️ pdftoppm preview generation notice:`, err.message);
  }

  await browser.close();
  console.log('🎉 Cardstock Rocket worksheets successfully compiled!');
}

run().catch(err => {
  console.error('❌ Error compiling worksheets:', err);
  process.exit(1);
});

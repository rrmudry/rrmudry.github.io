/**
 * Generates the Cardstock Rocket Autopsy & Forensics Lab PDF
 * 
 * Target: High School Physics (Periods 0, 4, 5, 6)
 * Output: Unit_2/worksheets/Cardstock_Rocket_Autopsy_Lab.pdf
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { execSync } = require('child_process');

async function run() {
  const outDir = path.join(__dirname, '../Unit_2/worksheets');
  console.log('🚀 Compiling Cardstock Rocket Autopsy & Forensics Lab PDF...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const htmlPath = path.join(outDir, 'Cardstock_Rocket_Autopsy_Lab.html');
  const pdfPath = path.join(outDir, 'Cardstock_Rocket_Autopsy_Lab.pdf');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '0in', bottom: '0in', left: '0in', right: '0in' }
  });
  await page.close();
  await browser.close();

  console.log(`✅ Generated Cardstock Rocket Autopsy Lab PDF: ${pdfPath}`);

  // Generate bitmap preview using pdftoppm if available
  try {
    const previewPrefix = path.join(outDir, 'preview_Rocket_Autopsy');
    execSync(`pdftoppm -png -r 150 "${pdfPath}" "${previewPrefix}"`);
    console.log(`✅ Rendered Autopsy Lab preview images: ${previewPrefix}-1.png, ${previewPrefix}-2.png`);
  } catch (err) {
    console.warn(`⚠️ pdftoppm preview generation notice:`, err.message);
  }

  console.log('🎉 Cardstock Rocket Autopsy PDF compiled successfully!');
}

run().catch(err => {
  console.error('❌ Error compiling PDF:', err);
  process.exit(1);
});

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    const htmlPath = path.resolve(__dirname, '..', 'admin', 'reports', 'Hot_Wheels_Air_Brake_Lab_Data_Audit_Report.html');
    const pdfPath = path.resolve(__dirname, '..', 'admin', 'reports', 'Hot_Wheels_Air_Brake_Lab_Data_Audit_Report.pdf');
    
    console.log('Loading HTML from:', htmlPath);
    await page.goto('file://' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.22in', right: '0.28in', bottom: '0.22in', left: '0.28in' }
    });
    await browser.close();
    console.log('PDF rendered successfully to:', pdfPath);
    const stats = fs.statSync(pdfPath);
    console.log('File size:', stats.size, 'bytes');
  } catch (err) {
    console.error('Error rendering PDF:', err);
    process.exit(1);
  }
})();

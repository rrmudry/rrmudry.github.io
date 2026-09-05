const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const fs = require('fs');

(async () => {
  console.log("Starting Mobile Optimized Format E2E Test on Phone Viewport...");

  const rootDir = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const safePath = path.normalize(decodeURIComponent(req.url.split('?')[0]));
    const filePath = path.join(rootDir, safePath === '/' ? 'index.html' : safePath);
    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end("Not Found");
      }
      const ext = path.extname(filePath);
      const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`Internal test server listening on http://127.0.0.1:${port}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));

    // Emulate iPhone 13/14 (390 x 844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    const targetUrl = `http://127.0.0.1:${port}/math-facts/index.html`;
    console.log(`Navigating to ${targetUrl} as iPhone (390x844)...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });

    // 1. Verify Auto-Detection of Phone Mode
    const isPhoneMode = await page.evaluate(() => document.body.classList.contains('phone-mode'));
    console.log(`Auto-detected phone mode on mobile viewport: ${isPhoneMode}`);
    if (!isPhoneMode) throw new Error("Expected body to have .phone-mode automatically on mobile viewport");

    const toggleStatus = await page.$eval('#phone-toggle-status', el => el.textContent.trim());
    console.log(`Toggle status badge: ${toggleStatus}`);
    if (toggleStatus !== 'ACTIVE') throw new Error(`Expected toggle status ACTIVE, got ${toggleStatus}`);

    // 2. Test Toggling Off via Header Icon Button
    console.log("Toggling phone mode OFF via header button...");
    await page.tap('#phone-mode-btn');
    const isStillPhone = await page.evaluate(() => document.body.classList.contains('phone-mode'));
    const toggleStatusOff = await page.$eval('#phone-toggle-status', el => el.textContent.trim());
    console.log(`After toggle: phone-mode=${isStillPhone}, status=${toggleStatusOff}`);
    if (isStillPhone || toggleStatusOff !== 'OFF') throw new Error("Phone mode failed to toggle off");

    // 3. Test Toggling Back On via Welcome Screen Chip
    console.log("Toggling phone mode back ON via welcome screen chip...");
    await page.tap('#phone-format-toggle-chip');
    const isPhoneModeAgain = await page.evaluate(() => document.body.classList.contains('phone-mode'));
    const toggleStatusOn = await page.$eval('#phone-toggle-status', el => el.textContent.trim());
    console.log(`After toggle back: phone-mode=${isPhoneModeAgain}, status=${toggleStatusOn}`);
    if (!isPhoneModeAgain || toggleStatusOn !== 'ACTIVE') throw new Error("Phone mode failed to toggle back on");

    // 4. Check LocalStorage Persistence
    const savedPref = await page.evaluate(() => localStorage.getItem('math_facts_phone_mode'));
    console.log(`LocalStorage saved preference: ${savedPref}`);
    if (savedPref !== 'true') throw new Error("LocalStorage math_facts_phone_mode was not set to 'true'");

    // 4b. Check Mario Kart Table Mastery Badges in Phone Mode
    const phoneMasteryBadge = await page.$eval('#mastery-total-badge', el => el.textContent.trim());
    console.log(`Phone mode mastery badge: "${phoneMasteryBadge}"`);
    if (!phoneMasteryBadge.includes('/ 33 Stars')) throw new Error("Phone mode mastery badge missing");

    const artifactDir = '/home/ryan/.gemini/antigravity-ide/brain/686a1591-ef47-4508-a7c2-18fb7fdd9551';
    await page.screenshot({ path: path.join(artifactDir, 'mariokart_stars_phone.png') });
    console.log("Saved mobile phone mode screenshot!");

    // 5. Select Level 1, Enter Name, and Start Sprint
    await page.type('#player-name-input', 'Kobe');
    await page.tap('#start-game-btn');
    await page.waitForSelector('#view-arena.active', { timeout: 3000 });

    // 6. Verify Zero-Scroll Arena Ergonomics in Phone Mode
    console.log("Checking zero-scroll mobile arena geometry...");
    const scrollY = await page.evaluate(() => window.scrollY);
    if (scrollY !== 0) throw new Error(`Expected zero scroll in phone arena, but scrollY was ${scrollY}`);

    // Check numpad visibility and bounds
    const numpadBox = await page.$eval('#numpad', el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, height: rect.height, windowHeight: window.innerHeight };
    });
    console.log(`Numpad bounding box: top=${numpadBox.top}, bottom=${numpadBox.bottom}, windowHeight=${numpadBox.windowHeight}`);
    if (numpadBox.bottom > numpadBox.windowHeight + 20) {
      throw new Error(`Numpad bottom (${numpadBox.bottom}) exceeds viewport height (${numpadBox.windowHeight})`);
    }

    // 7. Solve questions with touch taps on numpad in phone mode
    for (let round = 1; round <= 3; round++) {
      const numA = parseInt(await page.$eval('#fact-num-a', el => el.textContent), 10);
      const numB = parseInt(await page.$eval('#fact-num-b', el => el.textContent), 10);
      const expectedAns = numA * numB;
      const ansStr = String(expectedAns);
      console.log(`Mobile Round ${round}: ${numA} × ${numB} = ${expectedAns}`);

      for (const digit of ansStr) {
        await page.tap(`button.key-btn[data-key="${digit}"]`);
        await new Promise(r => setTimeout(r, 60));
      }
      await new Promise(r => setTimeout(r, 250));
    }

    const streakVal = await page.$eval('#hud-streak-val', el => el.textContent);
    console.log(`Streak reached in phone mode: ${streakVal}`);
    if (parseInt(streakVal, 10) !== 3) throw new Error(`Expected streak 3, got ${streakVal}`);

    console.log("✅ Mobile-optimized phone format test passed with flying colors!");
  } finally {
    await browser.close();
    server.close();
  }
})();

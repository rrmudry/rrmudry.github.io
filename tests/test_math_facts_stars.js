const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const fs = require('fs');

(async () => {
  console.log("Starting Mario Kart Star System E2E Test...");

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
  console.log(`Test server listening on http://127.0.0.1:${port}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));
    await page.setViewport({ width: 768, height: 1024, isMobile: true, hasTouch: true });

    const targetUrl = `http://127.0.0.1:${port}/math-facts/index.html`;
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });

    // 1. Enter Player Name
    console.log("Setting player name to 'Mario'...");
    await page.type('#player-name-input', 'Mario');
    await page.tap('[data-avatar="⚡"]');

    // 2. Check Initial Mario Kart Focus Badges
    const initialBadgeText = await page.$eval('#mastery-total-badge', el => el.textContent.trim());
    console.log(`Initial Mastery Badge: "${initialBadgeText}"`);
    if (!initialBadgeText.includes('0 / 33')) {
      throw new Error(`Expected '0 / 33 Stars', got: ${initialBadgeText}`);
    }

    const pill7StarsInit = await page.$eval('.table-pill[data-table="7"] .pill-stars', el => el.textContent.trim());
    console.log(`Initial 7s Pill Stars: "${pill7StarsInit}"`);
    if (!pill7StarsInit.includes('☆☆☆')) {
      throw new Error(`Expected initial 7s stars to be '☆☆☆', got: ${pill7StarsInit}`);
    }

    // 3. Select 7s Focus Table Pill
    console.log("Selecting 7s focus table pill...");
    await page.tap('.table-pill[data-table="7"]');
    const isPill7Active = await page.$eval('.table-pill[data-table="7"]', el => el.classList.contains('active'));
    console.log(`7s Pill Active: ${isPill7Active}`);
    if (!isPill7Active) throw new Error("7s table pill failed to become active");

    // 4. Start Sprint
    await page.tap('#start-game-btn');
    await page.waitForSelector('#view-arena.active', { timeout: 3000 });

    // 5. Answer 8 questions from the 7s table with 100% accuracy
    console.log("Answering 8 questions from 7s table with 100% accuracy...");
    for (let round = 1; round <= 8; round++) {
      const numA = parseInt(await page.$eval('#fact-num-a', el => el.textContent), 10);
      const numB = parseInt(await page.$eval('#fact-num-b', el => el.textContent), 10);
      if (numA !== 7 && numB !== 7) {
        throw new Error(`Expected 7s table drill question to contain 7, got: ${numA} × ${numB}`);
      }

      const answer = String(numA * numB);
      console.log(`Round ${round}: ${numA} × ${numB} = ${answer}`);

      for (const d of answer) {
        await page.tap(`button.key-btn[data-key="${d}"]`);
        await new Promise(r => setTimeout(r, 40));
      }
      await new Promise(r => setTimeout(r, 180));
    }

    // 6. Abort Run / End Round to trigger Report Screen
    console.log("Ending round to evaluate stars...");
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await page.tap('#abort-run-btn');
    await page.waitForSelector('#view-results.active', { timeout: 5000 });

    // 7. Verify Results Screen Table Star Banner
    const isBannerActive = await page.$eval('#table-star-banner', el => el.classList.contains('active'));
    const bannerTitle = await page.$eval('#table-star-title', el => el.textContent.trim());
    const bannerDesc = await page.$eval('#table-star-desc', el => el.textContent.trim());
    console.log(`Table Star Banner Active: ${isBannerActive}`);
    console.log(`Table Star Banner Title: "${bannerTitle}"`);
    console.log(`Table Star Banner Desc: "${bannerDesc}"`);

    if (!isBannerActive) throw new Error("Expected #table-star-banner to be active on results screen");
    if (!bannerTitle.includes('7s Table') || !bannerTitle.includes('★')) {
      throw new Error(`Expected star rank banner for 7s table, got: ${bannerTitle}`);
    }

    const artifactDir = '/home/ryan/.gemini/antigravity-ide/brain/686a1591-ef47-4508-a7c2-18fb7fdd9551';
    await page.screenshot({ path: path.join(artifactDir, 'mariokart_stars_results.png') });
    console.log("Saved results screen screenshot!");

    // 8. Open Personal Bests and Verify Table Mastery Grid
    console.log("Checking Personal Bests Table Mastery Card...");
    await page.tap('#view-records-from-results');
    await page.waitForSelector('#view-records.active', { timeout: 3000 });

    const recMasteryCount = await page.$eval('#rec-mastery-count', el => el.textContent.trim());
    console.log(`Records Modal Mastery Count: "${recMasteryCount}"`);
    if (!recMasteryCount.includes('/ 33 ⭐')) {
      throw new Error(`Expected records modal mastery count to show '/ 33 ⭐', got: ${recMasteryCount}`);
    }

    const cell7Stars = await page.$eval('.mastery-cell:nth-child(6) .mastery-cell-stars', el => el.textContent.trim()); // 2,3,4,5,6,7 -> index 6
    console.log(`7s Cell in Mastery Grid Stars: "${cell7Stars}"`);
    if (!cell7Stars.includes('★')) {
      throw new Error(`Expected gold stars in 7s cell, got: ${cell7Stars}`);
    }

    await page.screenshot({ path: path.join(artifactDir, 'mariokart_stars_records.png') });
    console.log("Saved records screen screenshot!");

    // 9. Back to Welcome Screen & Check Focus Filter Badges
    console.log("Returning to Welcome Screen...");
    await page.tap('#close-records-btn');
    await page.waitForSelector('#view-welcome.active', { timeout: 3000 });

    // Wait a brief moment for confetti particles to finish
    await new Promise(r => setTimeout(r, 1200));

    const updatedTotalBadge = await page.$eval('#mastery-total-badge', el => el.textContent.trim());
    console.log(`Updated Welcome Mastery Badge: "${updatedTotalBadge}"`);
    if (updatedTotalBadge.includes('0 / 33')) {
      throw new Error("Mastery total badge was not updated on welcome screen");
    }

    const updated7sPillStars = await page.$eval('.table-pill[data-table="7"] .pill-stars', el => el.textContent.trim());
    console.log(`Updated 7s Pill Stars: "${updated7sPillStars}"`);
    if (!updated7sPillStars.includes('★')) {
      throw new Error(`Expected updated 7s pill to show earned stars, got: ${updated7sPillStars}`);
    }

    const has3StarsClass = await page.$eval('.table-pill[data-table="7"]', el => el.classList.contains('has-3-stars'));
    console.log(`7s Pill has .has-3-stars class: ${has3StarsClass}`);

    await page.screenshot({ path: path.join(artifactDir, 'mariokart_stars_welcome.png') });
    console.log("Saved welcome screen screenshot!");

    console.log("🌟 Mario Kart Starring Badge System E2E test passed with 100% success!");
  } finally {
    await browser.close();
    server.close();
  }
})();

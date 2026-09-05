const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const fs = require('fs');

(async () => {
  console.log("Starting Math Facts Puppeteer E2E Test...");

  // Start self-contained static file server
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
    await page.setViewport({ width: 768, height: 1024, isMobile: true, hasTouch: true }); // iPad Touch emulation

    const targetUrl = `http://127.0.0.1:${port}/math-facts/index.html`;
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });

    // 1. Verify Welcome Screen
    const title = await page.$eval('.welcome-header h1', el => el.textContent);
    console.log(`Page title: "${title}"`);
    if (!title.includes('Master Your Facts')) throw new Error("Welcome header not found");

    // 2. Enter Name & Choose Avatar
    console.log("Entering player name and selecting avatar...");
    await page.type('#player-name-input', 'Maya');
    await page.tap('[data-avatar="🚀"]');

    const selectedAvatar = await page.$eval('.avatar-option.selected', el => el.dataset.avatar);
    console.log(`Selected avatar: ${selectedAvatar}`);
    if (selectedAvatar !== '🚀') throw new Error("Avatar selection failed");

    // 3. Start Game via Touch Tap
    console.log("Starting Blitz sprint via touchscreen tap...");
    await page.tap('#start-game-btn');
    await page.waitForSelector('#view-arena.active', { timeout: 3000 });

    // 4. Verify Arena HUD Loaded
    const timerLabel = await page.$eval('#hud-timer-label', el => el.textContent);
    console.log(`HUD Timer label: ${timerLabel}`);
    if (timerLabel !== 'TIME') throw new Error("Arena HUD timer label incorrect");

    // 5. Read Current Question and answer using Virtual Numpad Taps
    for (let round = 1; round <= 3; round++) {
      const numA = parseInt(await page.$eval('#fact-num-a', el => el.textContent), 10);
      const numB = parseInt(await page.$eval('#fact-num-b', el => el.textContent), 10);
      if (numA > 10 || numB > 10) {
        throw new Error(`Level 1 (0 to 10) violation: ${numA} × ${numB}`);
      }
      const expectedAns = numA * numB;
      const ansStr = String(expectedAns);
      console.log(`Round ${round}: Question ${numA} × ${numB} = ${expectedAns}`);

      // Touch tap each digit on the tactile virtual numpad
      for (const digit of ansStr) {
        await page.tap(`button.key-btn[data-key="${digit}"]`);
        await new Promise(r => setTimeout(r, 60));
      }

      await new Promise(r => setTimeout(r, 250));

      const streakVal = await page.$eval('#hud-streak-val', el => el.textContent);
      console.log(`Current streak after answering: ${streakVal}`);
      if (parseInt(streakVal, 10) !== round) {
        throw new Error(`Expected streak ${round}, got ${streakVal}`);
      }
    }

    // 6. Test Hardware Keyboard Input (Chromebook/Desktop compatibility)
    console.log("Testing hardware keyboard input...");
    const keyNumA = parseInt(await page.$eval('#fact-num-a', el => el.textContent), 10);
    const keyNumB = parseInt(await page.$eval('#fact-num-b', el => el.textContent), 10);
    const keyAns = String(keyNumA * keyNumB);
    console.log(`Keyboard Round: ${keyNumA} × ${keyNumB} = ${keyAns}`);
    for (const ch of keyAns) {
      await page.keyboard.press(ch);
      await new Promise(r => setTimeout(r, 60));
    }
    await new Promise(r => setTimeout(r, 250));

    const streakAfterKey = await page.$eval('#hud-streak-val', el => el.textContent);
    console.log(`Streak after keyboard answer: ${streakAfterKey}`);
    if (parseInt(streakAfterKey, 10) !== 4) {
      throw new Error(`Expected streak 4 after keyboard input, got ${streakAfterKey}`);
    }

    // 7. Verify Score
    const currentScore = await page.$eval('#hud-score-val', el => el.textContent);
    console.log(`Current Score: ${currentScore}`);
    if (parseInt(currentScore.replace(/,/g, ''), 10) <= 0) {
      throw new Error("Score did not increase");
    }

    // 8. End game via Abort Run button
    console.log("Testing End Game & Results Screen...");
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await page.tap('#abort-run-btn');

    await page.waitForSelector('#view-results.active', { timeout: 5000 });
    const resScore = await page.$eval('#res-score', el => el.textContent);
    const resSolved = await page.$eval('#res-solved', el => el.textContent);
    const resAccuracy = await page.$eval('#res-accuracy', el => el.textContent);
    console.log(`Results Screen Loaded! Final Score: ${resScore}, Solved: ${resSolved}, Accuracy: ${resAccuracy}`);

    // 9. Verify New Personal Best Celebration Banner
    const isNewBest = await page.$eval('#new-best-banner', el => el.classList.contains('active'));
    console.log(`New Personal Best Banner Active: ${isNewBest}`);
    if (!isNewBest) throw new Error("Expected new personal best banner to be active on results");

    // 10. View Personal Bests Dashboard
    console.log("Testing Personal Bests & Career Stats view...");
    await page.tap('#view-records-from-results');
    await page.waitForSelector('#view-records.active', { timeout: 3000 });

    const heroName = await page.$eval('#rec-hero-name', el => el.textContent);
    console.log(`Records Hero Name: ${heroName}`);
    if (!heroName.includes("Maya")) throw new Error(`Expected Maya in records hero name, got: ${heroName}`);

    const careerSolved = await page.$eval('#rec-total-solved', el => el.textContent);
    console.log(`Career Solved Facts: ${careerSolved}`);
    if (parseInt(careerSolved, 10) < 4) throw new Error(`Expected at least 4 career solved, got: ${careerSolved}`);

    // Verify recent sprints list contains our run
    const recentRows = await page.$$eval('.recent-run-row', rows => rows.length);
    console.log(`Recent Sprints Logged: ${recentRows}`);
    if (recentRows < 1) throw new Error("Expected at least 1 recent run row");

    // 11. Test Returning to Welcome Screen and checking Personal Best Widget
    await page.tap('#close-records-btn');
    await page.waitForSelector('#view-welcome.active', { timeout: 3000 });
    const pbWelcomeSolved = await page.$eval('#pb-welcome-solved', el => el.textContent);
    console.log(`Welcome Screen Career Solved: ${pbWelcomeSolved}`);
    if (parseInt(pbWelcomeSolved, 10) < 4) throw new Error("Welcome PB widget did not reflect career solved");

    console.log("✅ All Puppeteer E2E tests passed successfully!");
  } finally {
    await browser.close();
    server.close();
  }
})();

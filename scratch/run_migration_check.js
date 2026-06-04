const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: "new"
        });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log(msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
        
        const filePath = 'file://' + path.resolve(__dirname, 'migration_check.html').replace(/\\/g, '/');
        console.log('Loading:', filePath);
        
        await page.goto(filePath);
        
        // Wait for the "COMPLETE" signal or a timeout
        let completed = false;
        const checkComplete = async () => {
            const logs = await page.evaluate(() => document.body.innerText);
            if (logs.includes('MIGRATION_CHECK_COMPLETE')) completed = true;
        };
        
        // Polling for completion
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 1000));
            // We'll trust the console.log output which is already being piped to our process.stdout
        }
        
        await browser.close();
    } catch (e) {
        console.error('PUPPETEER EXCEPTION:', e);
    }
})();

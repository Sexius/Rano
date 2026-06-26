const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://ragmaya.kr/v2/live', { waitUntil: 'networkidle2' });
  
  const html = await page.evaluate(() => document.documentElement.outerHTML);
  fs.writeFileSync('ragmaya.html', html);
  
  console.log("Successfully scraped ragmaya.kr/v2/live");
  
  await browser.close();
})();

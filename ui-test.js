const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[Console] ${msg.type().toUpperCase()}: ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PageError]: ${err.toString()}`));
  page.on('requestfailed', req => logs.push(`[NetworkError]: ${req.url()} - ${req.failure().errorText}`));

  try {
    console.log('Navigating to Dashboard...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Simulate some clicks
    console.log('Clicking Pain Points View...');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Pain-Point Clusters')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    console.log('Clicking Blueberry Copilot...');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Blueberry Copilot')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('Entering Customer War Room (ACC-002)...');
    await page.goto('http://localhost:3000/account/ACC-002', { waitUntil: 'networkidle0' });

    console.log('Checking Copilot action...');
    const warRoomButtons = await page.$$('button');
    for (const btn of warRoomButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Run Full Account Review')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 3000));
    
  } catch (err) {
    logs.push(`[ScriptError]: ${err.message}`);
  } finally {
    await browser.close();
  }
  
  fs.writeFileSync('ui_test_logs.txt', logs.join('\n'));
  console.log('Testing complete.');
}

run();

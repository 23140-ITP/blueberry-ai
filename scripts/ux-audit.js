const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCRATCH_DIR = 'C:\\Users\\yashd\\.gemini\\antigravity\\brain\\f6bb1ce4-f550-415d-bc72-c9bcdd52d8fe\\scratch';

async function runAudit() {
  const auditLogs = {
    consoleErrors: [],
    consoleWarnings: [],
    networkErrors: [],
    observations: []
  };

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Set viewport to a standard desktop size
  await page.setViewport({ width: 1440, height: 900 });

  // Listen for console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      auditLogs.consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      auditLogs.consoleWarnings.push(msg.text());
    }
  });

  // Listen for network errors
  page.on('requestfailed', request => {
    auditLogs.networkErrors.push({
      url: request.url(),
      errorText: request.failure()?.errorText
    });
  });

  try {
    auditLogs.observations.push("Navigating to http://localhost:3000 (Dashboard)");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Give it a moment to render client-side
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCRATCH_DIR, '01_dashboard_dark.png') });
    auditLogs.observations.push("Dashboard screenshot captured.");

    // Click on an account to navigate to the War Room
    auditLogs.observations.push("Attempting to navigate to an account War Room (e.g. ACC-002)...");
    
    // We can just navigate directly since it's easier and less brittle than relying on specific DOM structure for clicking rows
    await page.goto('http://localhost:3000/account/ACC-002', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCRATCH_DIR, '02_war_room_dark.png') });
    auditLogs.observations.push("Customer War Room screenshot captured.");

    // Look for the "Run Full Account Review" button and click it
    auditLogs.observations.push("Clicking 'Run Full Account Review' button...");
    const reviewButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.innerText.includes('Run Full Account Review'));
    });
    
    if (reviewButton) {
      await reviewButton.click();
      // Wait for copilot to stream response
      await new Promise(r => setTimeout(r, 10000));
      await page.screenshot({ path: path.join(SCRATCH_DIR, '03_after_account_review.png') });
      auditLogs.observations.push("Screenshot after 'Run Full Account Review' captured.");
    } else {
      auditLogs.consoleErrors.push("Could not find 'Run Full Account Review' button on the page.");
    }

    // Toggle Light Mode
    auditLogs.observations.push("Testing Theme Toggle functionality...");
    const themeButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.innerText.includes('Switch to Light Mode') || b.innerText.includes('Switch to Dark Mode'));
    });

    if (themeButton) {
      await themeButton.click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(SCRATCH_DIR, '04_war_room_light.png') });
      auditLogs.observations.push("Light Mode screenshot captured.");
    } else {
      auditLogs.consoleErrors.push("Could not find Theme Toggle button on the page.");
    }

  } catch (err) {
    auditLogs.consoleErrors.push(`Script exception: ${err.message}`);
  } finally {
    await browser.close();
  }

  // Save logs
  fs.writeFileSync(path.join(SCRATCH_DIR, 'ui_ux_audit_logs.json'), JSON.stringify(auditLogs, null, 2));
  console.log("UI/UX Audit complete! Logs and screenshots saved to scratch directory.");
}

runAudit();

const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const views = [
    { id: 'elser-search', name: '01_elser_search.png' },
    { id: 'apm-dashboard', name: '02_apm_dashboard.png' },
    { id: 'anomaly-detection', name: '03_anomaly_detection.png' },
    { id: 'hybrid-search', name: '04_hybrid_search.png' },
    { id: 'emerging-trends', name: '05_emerging_trends.png' },
    { id: 'agent-logs', name: '06_agent_logs.png' },
    { id: 'dls-simulator', name: '07_dls_simulator.png' },
    { id: 'ilm-tiering', name: '08_ilm_tiering.png' },
    { id: 'vector-search', name: '09_vector_search.png' },
    { id: 'cross-cluster', name: '10_cross_cluster.png' }
  ];

  for (const view of views) {
    console.log(`Taking screenshot for ${view.id}...`);
    await page.goto('http://localhost:3000');
    // Wait for the app to load
    await new Promise(r => setTimeout(r, 1000));
    
    // Click the sidebar link (we match by text or href... we can just inject JS to click it or change state)
    // Actually, we can just evaluate a script to click the exact button
    await page.evaluate((id) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        // Our buttons have an onclick that sets activeView
        // But since we can't easily click by ID if there's no ID attribute, let's find it by text content
        const texts = {
          'elser-search': 'ELSER Semantic Search',
          'apm-dashboard': 'Elastic APM Tracing',
          'anomaly-detection': 'Anomaly Detection',
          'hybrid-search': 'Hybrid Search (RRF)',
          'emerging-trends': 'Emerging Trends',
          'agent-logs': 'Agent Observability',
          'dls-simulator': 'DLS Access Control',
          'ilm-tiering': 'ILM Data Tiering',
          'vector-search': 'Vector Similarity',
          'cross-cluster': 'Cross-Cluster Search'
        };
        if (btn.innerText.includes(texts[id])) {
          btn.click();
          break;
        }
      }
    }, view.id);

    // Wait for animation
    await new Promise(r => setTimeout(r, 1000));
    
    await page.screenshot({ path: `C:/Users/yashd/.gemini/antigravity/brain/f6bb1ce4-f550-415d-bc72-c9bcdd52d8fe/artifacts/${view.name}` });
  }

  await browser.close();
  console.log('Screenshots done!');
}

run().catch(console.error);

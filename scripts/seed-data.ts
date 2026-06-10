import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  node: process.env.ELASTIC_URL,
  auth: {
    apiKey: process.env.ELASTIC_API_KEY as string,
  },
});

async function main() {
  console.log('Connecting to Elastic Cloud Serverless...');
  
  try {
    const info = await client.info();
    console.log(`Connected to Elasticsearch v${info.version.number}`);
  } catch (err) {
    console.error('Failed to connect to Elasticsearch. Is the API key valid?', err);
    process.exit(1);
  }

  const indices = ['accounts', 'tickets', 'health_notes', 'call_transcripts', 'agent_memory', 'knowledge_base'];
  
  for (const index of indices) {
    try {
      const exists = await client.indices.exists({ index });
      if (exists) {
        await client.indices.delete({ index });
        console.log(`Deleted existing index: ${index}`);
      }
    } catch (e) {
      console.log(`Error checking/deleting index ${index}:`, e);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Creating mappings...');

  await client.indices.create({
    index: 'accounts',
    mappings: {
      properties: {
        account_id: { type: 'keyword' },
        company_name: { type: 'text' },
        industry: { type: 'keyword' },
        arr: { type: 'float' },
        risk_score: { type: 'float' },
        status: { type: 'keyword' },
        last_contact_date: { type: 'date' }
      }
    }
  });

  await client.indices.create({
    index: 'tickets',
    mappings: {
      properties: {
        ticket_id: { type: 'keyword' },
        account_id: { type: 'keyword' },
        subject: { type: 'semantic_text' },
        description: { type: 'semantic_text' },
        status: { type: 'keyword' },
        priority: { type: 'keyword' },
        created_at: { type: 'date' }
      }
    }
  });

  await client.indices.create({
    index: 'health_notes',
    mappings: {
      properties: {
        note_id: { type: 'keyword' },
        account_id: { type: 'keyword' },
        author: { type: 'keyword' },
        note_text: { type: 'semantic_text' },
        sentiment: { type: 'keyword' },
        created_at: { type: 'date' }
      }
    }
  });

  await client.indices.create({
    index: 'call_transcripts',
    mappings: {
      properties: {
        call_id: { type: 'keyword' },
        account_id: { type: 'keyword' },
        transcript: { type: 'semantic_text' },
        summary: { type: 'semantic_text' },
        duration_minutes: { type: 'integer' },
        date: { type: 'date' }
      }
    }
  });

  await client.indices.create({
    index: 'agent_memory',
    mappings: {
      properties: {
        memory_id: { type: 'keyword' },
        account_id: { type: 'keyword' },
        content: { type: 'semantic_text' },
        category: { type: 'keyword' },
        created_at: { type: 'date' }
      }
    }
  });

  await client.indices.create({
    index: 'knowledge_base',
    mappings: {
      properties: {
        runbook_id: { type: 'keyword' },
        title: { type: 'semantic_text' },
        content: { type: 'semantic_text' },
        category: { type: 'keyword' }
      }
    }
  });

  console.log('Indices created successfully.');
  console.log('Seeding Comprehensive Demo Data...');

  const accounts = [
    { account_id: 'ACC-001', company_name: 'Acme Corp', industry: 'Retail', arr: 150000, risk_score: 0.1, status: 'Active', last_contact_date: '2026-06-01T10:00:00Z' },
    { account_id: 'ACC-002', company_name: 'TechFlow', industry: 'SaaS', arr: 500000, risk_score: 0.85, status: 'At Risk', last_contact_date: '2026-06-08T14:30:00Z' },
    { account_id: 'ACC-003', company_name: 'Global Industries', industry: 'Manufacturing', arr: 250000, risk_score: 0.3, status: 'Active', last_contact_date: '2026-05-15T09:00:00Z' },
    { account_id: 'ACC-004', company_name: 'Zenith Media', industry: 'Media', arr: 85000, risk_score: 0.05, status: 'Active', last_contact_date: '2026-06-05T11:00:00Z' },
    { account_id: 'ACC-005', company_name: 'Pinnacle Finance', industry: 'Finance', arr: 1200000, risk_score: 0.45, status: 'At Risk', last_contact_date: '2026-05-20T10:00:00Z' },
    { account_id: 'ACC-006', company_name: 'Vertex Logistics', industry: 'Logistics', arr: 310000, risk_score: 0.15, status: 'Active', last_contact_date: '2026-06-02T16:00:00Z' },
    { account_id: 'ACC-007', company_name: 'Quantum Health', industry: 'Healthcare', arr: 750000, risk_score: 0.92, status: 'Critical', last_contact_date: '2026-06-07T14:00:00Z' },
    { account_id: 'ACC-008', company_name: 'Nexus Education', industry: 'Education', arr: 95000, risk_score: 0.2, status: 'Active', last_contact_date: '2026-05-28T13:00:00Z' },
    { account_id: 'ACC-009', company_name: 'Horizon Energy', industry: 'Energy', arr: 2200000, risk_score: 0.6, status: 'At Risk', last_contact_date: '2026-06-04T09:30:00Z' },
    { account_id: 'ACC-010', company_name: 'Alpha Tech', industry: 'SaaS', arr: 420000, risk_score: 0.08, status: 'Active', last_contact_date: '2026-06-06T15:00:00Z' },
    { account_id: 'ACC-011', company_name: 'Omega Services', industry: 'Consulting', arr: 180000, risk_score: 0.35, status: 'Active', last_contact_date: '2026-05-22T10:00:00Z' },
    { account_id: 'ACC-012', company_name: 'Delta Data', industry: 'Data Analytics', arr: 650000, risk_score: 0.78, status: 'Critical', last_contact_date: '2026-06-01T11:30:00Z' }
  ];

  for (const account of accounts) {
    await client.index({ index: 'accounts', id: account.account_id, document: account });
  }

  // --- MOCK DATA GENERATORS ---
  const tickets: any[] = [];
  const notes: any[] = [];
  const calls: any[] = [];
  const memories: any[] = [];
  
  let ticketCounter = 100;
  let noteCounter = 1;
  let callCounter = 100;
  let memoryCounter = 1;

  // Specific high-risk scenarios for certain accounts (to maintain the story)
  const hardcodedScenarios = [
    // TechFlow (ACC-002) - Data Export Issues
    { type: 'ticket', accountId: 'ACC-002', subject: 'Data export failing constantly', desc: 'Every time we try to export the monthly report, it times out and crashes. This is critical for our board meeting next week. We are considering leaving if this is not fixed.', status: 'Open', priority: 'Urgent' },
    { type: 'note', accountId: 'ACC-002', author: 'Sarah (CSM)', text: 'Had a tough call with TechFlow. The engineering VP is furious about the report timeout bug. They are evaluating a competitor next week. Need engineering to patch this ASAP.', sentiment: 'Negative' },
    { type: 'call', accountId: 'ACC-002', transcript: 'CSM: Hi David, how are things?\nDavid: Terrible. The system crashed again during export. We are losing patience. If this isn\'t fixed by Friday, we are terminating the contract.', summary: 'Customer is extremely frustrated about export bugs. Threatened churn if not fixed by Friday.', duration: 15 },
    { type: 'memory', accountId: 'ACC-002', category: 'preference', content: 'David (TechFlow VP) is very sensitive to system downtime and prefers escalation updates sent directly via email rather than Slack.' },

    // Quantum Health (ACC-007) - HIPAA Compliance
    { type: 'ticket', accountId: 'ACC-007', subject: 'HIPAA Compliance Report Missing', desc: 'Our compliance auditors cannot generate the HIPAA access report. The module is completely grayed out.', status: 'Open', priority: 'Urgent' },
    { type: 'note', accountId: 'ACC-007', author: 'Sarah (CSM)', text: 'Quantum Health is highly frustrated. Compliance issues are a dealbreaker for them. If we don\'t fix the HIPAA report by end of month, they will legally have to churn.', sentiment: 'Negative' },
    { type: 'call', accountId: 'ACC-007', transcript: 'CSM: Hello Dr. Smith. I saw the ticket regarding the HIPAA report.\nSmith: Yes, this is unacceptable. Our auditors are here today. If the system cannot generate this compliance report, we are in violation of federal law and we will drop your software immediately.', summary: 'Customer threatened immediate churn due to missing compliance report. Extremely high risk.', duration: 22 },
    { type: 'memory', accountId: 'ACC-007', category: 'milestone', content: 'Quantum Health requires HIPAA compliance audit logs to be retained for 7 years.' },

    // Delta Data (ACC-012) - ML Model Drift
    { type: 'ticket', accountId: 'ACC-012', subject: 'Machine learning model drift', desc: 'Our predictive analytics module is outputting garbage predictions since the last platform update.', status: 'Open', priority: 'Urgent' },
    { type: 'note', accountId: 'ACC-012', author: 'John (CSM)', text: 'Delta Data data science team is very unhappy with the model drift. They feel our recent update broke their workflows. Risk is high.', sentiment: 'Negative' },
    { type: 'call', accountId: 'ACC-012', transcript: 'CSM: Tell me about the model drift.\nData Scientist: The predictions are entirely inaccurate since the v2.4 update. We are manually exporting data to run models in Python now, which defeats the purpose of paying for your platform.', summary: 'Data science team is reverting to manual workflows because of broken ML predictions in the platform.', duration: 35 },
  ];

  // Random Data Generators
  const ticketSubjects = ['SSO Login failure', 'Billing inquiry', 'Feature request: dark mode', 'API rate limit exceeded', 'Dashboard loading slowly', 'How to add users', 'Cannot reset password', 'Data sync delayed', 'Report generation failed', 'Missing invoice'];
  const ticketDescs = ['Experiencing issues when trying to perform this action. Need support.', 'This feature is critical for our team. When will it be available?', 'We are getting errors intermittently.', 'Please advise on how to proceed with the configuration.', 'The system is unresponsive during peak hours.'];
  
  const noteTexts = {
    Positive: ['Routine check-in completed. Customer is satisfied.', 'Training session completed for the new admins.', 'Discussed upcoming renewal. Some concerns about pricing, but generally positive.'],
    Neutral: ['Customer requested a feature that is on our Q3 roadmap.', 'Executive sponsor has changed, need to establish new relationship.', 'Scheduled a follow up call for next week.'],
    Negative: ['Escalated a support ticket regarding slow performance.', 'Customer is frustrated with the recent downtime.', 'User adoption is dropping, need to schedule a re-training.']
  };
  
  const callTopics = ['QBR Review', 'Onboarding Kickoff', 'Technical Troubleshooting', 'Renewal Discussion', 'Feature Walkthrough'];

  function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
  }

  // Generate 5-10 tickets, 5-8 notes, and 2-4 calls per account
  for (const account of accounts) {
    const numTickets = Math.floor(Math.random() * 6) + 5; // 5 to 10
    for (let i = 0; i < numTickets; i++) {
      tickets.push({
        ticket_id: `TKT-${ticketCounter++}`,
        account_id: account.account_id,
        subject: ticketSubjects[Math.floor(Math.random() * ticketSubjects.length)],
        description: ticketDescs[Math.floor(Math.random() * ticketDescs.length)],
        status: Math.random() > 0.3 ? 'Closed' : 'Open',
        priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        created_at: randomDate(new Date(2026, 0, 1), new Date(2026, 5, 10))
      });
    }

    const numNotes = Math.floor(Math.random() * 4) + 5; // 5 to 8
    for (let i = 0; i < numNotes; i++) {
      const generatedSentiment = account.risk_score > 0.6 ? (Math.random() > 0.3 ? 'Negative' : 'Neutral') : (Math.random() > 0.5 ? 'Positive' : 'Neutral');
      const texts = noteTexts[generatedSentiment as keyof typeof noteTexts];
      const text = texts[Math.floor(Math.random() * texts.length)];

      notes.push({
        note_id: `N-${noteCounter++}`,
        account_id: account.account_id,
        author: ['Sarah (CSM)', 'John (CSM)', 'Lisa (CSM)', 'Mark (CSM)'][Math.floor(Math.random() * 4)],
        note_text: text,
        sentiment: generatedSentiment,
        created_at: randomDate(new Date(2026, 0, 1), new Date(2026, 5, 10))
      });
    }

    const numCalls = Math.floor(Math.random() * 3) + 2; // 2 to 4
    for (let i = 0; i < numCalls; i++) {
      const topic = callTopics[Math.floor(Math.random() * callTopics.length)];
      calls.push({
        call_id: `C-${callCounter++}`,
        account_id: account.account_id,
        transcript: `CSM: Hello, let's start the ${topic}.\nCustomer: Sure, let's go over the agenda.\nCSM: How are things with the platform?\nCustomer: Overall good, but we had some minor issues recently.`,
        summary: `Conducted ${topic}. Customer raised some minor points but generally satisfied.`,
        duration_minutes: Math.floor(Math.random() * 45) + 15,
        date: randomDate(new Date(2026, 0, 1), new Date(2026, 5, 10))
      });
    }

    // Add a couple of generic memories
    memories.push({
      memory_id: `MEM-${memoryCounter++}`,
      account_id: account.account_id,
      category: 'preference',
      content: `Prefers communication via Slack for quick issues. Primary admin is located in EST timezone.`,
      created_at: randomDate(new Date(2025, 0, 1), new Date(2026, 0, 1))
    });
  }

  // Inject hardcoded scenarios to ensure demos work well
  for (const item of hardcodedScenarios) {
    if (item.type === 'ticket') {
      tickets.push({
        ticket_id: `TKT-${ticketCounter++}`,
        account_id: item.accountId,
        subject: item.subject,
        description: item.desc,
        status: item.status,
        priority: item.priority,
        created_at: new Date().toISOString() // Recent
      });
    } else if (item.type === 'note') {
      notes.push({
        note_id: `N-${noteCounter++}`,
        account_id: item.accountId,
        author: item.author,
        note_text: item.text,
        sentiment: item.sentiment,
        created_at: new Date().toISOString()
      });
    } else if (item.type === 'call') {
      calls.push({
        call_id: `C-${callCounter++}`,
        account_id: item.accountId,
        transcript: item.transcript,
        summary: item.summary,
        duration_minutes: item.duration,
        date: new Date().toISOString()
      });
    } else if (item.type === 'memory') {
      memories.push({
        memory_id: `MEM-${memoryCounter++}`,
        account_id: item.accountId,
        category: item.category,
        content: item.content,
        created_at: new Date().toISOString()
      });
    }
  }

  // Execute bulk indexing or individual index requests
  console.log(`Indexing ${tickets.length} tickets...`);
  for (const ticket of tickets) {
    await client.index({ index: 'tickets', id: ticket.ticket_id, document: ticket });
  }

  console.log(`Indexing ${notes.length} notes...`);
  for (const note of notes) {
    await client.index({ index: 'health_notes', id: note.note_id, document: note });
  }

  console.log(`Indexing ${calls.length} calls...`);
  for (const call of calls) {
    await client.index({ index: 'call_transcripts', id: call.call_id, document: call });
  }

  console.log(`Indexing ${memories.length} memories...`);
  for (const memory of memories) {
    await client.index({ index: 'agent_memory', id: memory.memory_id, document: memory });
  }

  const runbooks = [
    { runbook_id: 'RB-01', category: 'Export Issues', title: 'Resolving Report Data Export Timeout Crashes', content: 'Steps to resolve reports timing out during CSV/Excel export:\n1. Check if the query limits exceed 50,000 rows. If so, apply pagination or partition the export.\n2. Increase the database query timeout from the default 30s to 120s in the gateway config.\n3. Verify memory allocation on the export microservice. Temporarily double worker node memory to 4GB.\n4. Recommend the customer filter their date range to decrease the dataset size before executing the export.' },
    { runbook_id: 'RB-02', category: 'SSO Issues', title: 'Okta SSO 403 Forbidden Login Error', content: 'Troubleshooting Okta Single Sign-On authentication failures:\n1. Verify that the user is assigned to the active AD group linked in Okta admin console.\n2. Clear browser cache or run in incognito mode to clear expired session tokens.\n3. Check if the Okta certificate has expired. If so, renew the cert in Okta settings and upload the new public key metadata to Blueberry AI settings.\n4. Ensure users are logging in through the custom subdomain URL.' },
    { runbook_id: 'RB-03', category: 'Rate Limits', title: 'Increasing API Rate Limits for Customers', content: 'Standard operating procedure for API quota increases:\n1. Review the customer account tier. Enterprise accounts are entitled to up to 10,000 requests/minute.\n2. Check if the usage pattern is malicious or anomalous. If it is standard batch sync, proceed.\n3. Update the rate limiter Redis/Env config for the specific account ID by raising the limit threshold.\n4. Notify the account CSM once the deployment updates are completed.' },
    { runbook_id: 'RB-04', category: 'Compliance', title: 'Restoring Missing HIPAA Compliance Reports', content: 'Steps to restore the HIPAA reporting module if grayed out:\n1. Verify the customer has signed the updated BAA (Business Associate Agreement) for the current year.\n2. Check the feature flag `enable_hipaa_reporting` in LaunchDarkly for the specific account ID.\n3. If the BAA is signed but the flag is false, manually toggle the flag to true and invalidate the user session cache.' },
    { runbook_id: 'RB-05', category: 'Data Sync', title: 'Troubleshooting Slow EMR Data Syncs', content: 'If data syncs take longer than 6 hours:\n1. Check the RabbitMQ queue for backpressure or dead-letter exchanges.\n2. Verify that the external EMR API is not rate-limiting our ingest workers.\n3. Horizontally scale the `sync-worker` pods in Kubernetes to process the backlog.' }
  ];

  console.log(`Indexing ${runbooks.length} runbooks...`);
  for (const rb of runbooks) {
    await client.index({ index: 'knowledge_base', id: rb.runbook_id, document: rb });
  }

  console.log('Comprehensive Data seeded successfully!');
}

main().catch(console.error);

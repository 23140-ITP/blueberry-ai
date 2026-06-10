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

  const tickets = [
    // SSO & Login Issues
    { ticket_id: 'TKT-100', account_id: 'ACC-001', subject: 'Login issue with SSO', description: 'Users cannot log in via Okta. Error code 403.', status: 'Closed', priority: 'High', created_at: '2026-05-20T11:00:00Z' },
    { ticket_id: 'TKT-112', account_id: 'ACC-004', subject: 'SSO configuration failure', description: 'Our SAML configuration is failing validation on Azure AD.', status: 'Open', priority: 'Medium', created_at: '2026-06-09T09:00:00Z' },
    { ticket_id: 'TKT-113', account_id: 'ACC-011', subject: 'Locked out of account', description: 'Admin account is locked out after SSO integration attempt.', status: 'Open', priority: 'High', created_at: '2026-06-08T14:00:00Z' },

    // Data Export Issues
    { ticket_id: 'TKT-101', account_id: 'ACC-002', subject: 'Data export failing constantly', description: 'Every time we try to export the monthly report, it times out and crashes. This is critical for our board meeting next week. We are considering leaving if this is not fixed.', status: 'Open', priority: 'Urgent', created_at: '2026-06-08T10:00:00Z' },
    { ticket_id: 'TKT-114', account_id: 'ACC-008', subject: 'CSV Export formatting broken', description: 'The downloaded CSV has completely broken formatting in Excel.', status: 'Closed', priority: 'Low', created_at: '2026-05-28T10:00:00Z' },
    { ticket_id: 'TKT-115', account_id: 'ACC-012', subject: 'Export taking too long', description: 'Exporting our model training data is taking 4 hours to complete.', status: 'Open', priority: 'High', created_at: '2026-06-01T09:00:00Z' },
    
    // API Limits
    { ticket_id: 'TKT-102', account_id: 'ACC-002', subject: 'API Rate limit too low', description: 'We keep hitting the rate limit on the reporting API. Can we increase this?', status: 'Open', priority: 'Medium', created_at: '2026-06-05T13:00:00Z' },
    { ticket_id: 'TKT-116', account_id: 'ACC-005', subject: 'Hitting 429 Too Many Requests', description: 'Our nightly batch sync is failing due to 429 errors from your API.', status: 'Open', priority: 'High', created_at: '2026-06-09T02:00:00Z' },
    { ticket_id: 'TKT-117', account_id: 'ACC-009', subject: 'API Quota extension', description: 'We need to double our API quota for the next month due to an event.', status: 'Closed', priority: 'Medium', created_at: '2026-05-15T10:00:00Z' },

    // General Usability
    { ticket_id: 'TKT-103', account_id: 'ACC-003', subject: 'How to add new user', description: 'Where is the button to invite a new team member?', status: 'Closed', priority: 'Low', created_at: '2026-05-10T15:00:00Z' },
    { ticket_id: 'TKT-109', account_id: 'ACC-010', subject: 'Change branding colors', description: 'We updated our company logo, how do we change the primary color in the portal?', status: 'Closed', priority: 'Low', created_at: '2026-06-01T10:00:00Z' },
    { ticket_id: 'TKT-118', account_id: 'ACC-001', subject: 'Update billing email', description: 'Please update our billing contact email to finance@acmecorp.com.', status: 'Closed', priority: 'Low', created_at: '2026-06-02T10:00:00Z' },

    // Compliance / Reporting
    { ticket_id: 'TKT-104', account_id: 'ACC-007', subject: 'HIPAA Compliance Report Missing', description: 'Our compliance auditors cannot generate the HIPAA access report. The module is completely grayed out.', status: 'Open', priority: 'Urgent', created_at: '2026-06-06T09:00:00Z' },
    { ticket_id: 'TKT-119', account_id: 'ACC-007', subject: 'Audit logs retention query', description: 'Can you confirm our audit logs are retained for 7 years as per our BAA?', status: 'Closed', priority: 'High', created_at: '2026-05-01T11:00:00Z' },
    { ticket_id: 'TKT-120', account_id: 'ACC-005', subject: 'SOC2 Report request', description: 'Please provide the latest SOC2 Type 2 report for our vendor risk assessment.', status: 'Closed', priority: 'Medium', created_at: '2026-04-15T09:00:00Z' },

    // Performance / Sync
    { ticket_id: 'TKT-105', account_id: 'ACC-007', subject: 'Data sync taking 24 hours', description: 'The daily sync with our EMR system is taking over 24 hours to complete, meaning our dashboards are always a day behind.', status: 'Open', priority: 'High', created_at: '2026-06-07T11:00:00Z' },
    { ticket_id: 'TKT-107', account_id: 'ACC-009', subject: 'Sensor telemetry dropping', description: 'We are losing IoT telemetry data from our wind turbines. The ingestion endpoint is rejecting payloads with a 502 error.', status: 'Open', priority: 'Urgent', created_at: '2026-06-03T08:00:00Z' },
    { ticket_id: 'TKT-121', account_id: 'ACC-009', subject: 'Dashboard loading very slow', description: 'The real-time turbine dashboard takes over 30 seconds to load initially.', status: 'Open', priority: 'Medium', created_at: '2026-06-05T14:00:00Z' },

    // Billing Errors
    { ticket_id: 'TKT-106', account_id: 'ACC-005', subject: 'Billing reconciliation error', description: 'Our invoice for Q2 shows an overcharge of $15,000 for seats we never provisioned. Please refund.', status: 'Open', priority: 'High', created_at: '2026-05-19T14:00:00Z' },
    { ticket_id: 'TKT-122', account_id: 'ACC-011', subject: 'Charged twice this month', description: 'Our credit card was billed twice for the May subscription.', status: 'Open', priority: 'High', created_at: '2026-05-22T09:00:00Z' },

    // Analytics / ML
    { ticket_id: 'TKT-108', account_id: 'ACC-012', subject: 'Machine learning model drift', description: 'Our predictive analytics module is outputting garbage predictions since the last platform update.', status: 'Open', priority: 'Urgent', created_at: '2026-05-30T10:00:00Z' },
    { ticket_id: 'TKT-123', account_id: 'ACC-012', subject: 'Feature importance chart blank', description: 'The SHAP values chart on the model dashboard is completely empty.', status: 'Open', priority: 'Medium', created_at: '2026-06-02T11:00:00Z' },

    // App Crashes
    { ticket_id: 'TKT-110', account_id: 'ACC-006', subject: 'Driver app crashing on iOS 18', description: 'Several of our drivers reported the mobile app crashes on startup after updating their iPhones.', status: 'Closed', priority: 'High', created_at: '2026-05-25T14:00:00Z' },
    { ticket_id: 'TKT-124', account_id: 'ACC-006', subject: 'App freezing during delivery', description: 'The Android app freezes when capturing signature.', status: 'Open', priority: 'High', created_at: '2026-06-08T15:00:00Z' },

    // Missing Features
    { ticket_id: 'TKT-125', account_id: 'ACC-002', subject: 'Missing functionality: custom alerts', description: 'We need the ability to set custom alerting thresholds. Without this feature, the platform is not fully usable for us.', status: 'Open', priority: 'Medium', created_at: '2026-06-01T09:00:00Z' },
    { ticket_id: 'TKT-126', account_id: 'ACC-010', subject: 'Webhooks integration missing', description: 'Can we get webhooks support so we can integrate with our internal Slack channels?', status: 'Open', priority: 'Low', created_at: '2026-06-07T10:00:00Z' }
  ];

  for (const ticket of tickets) {
    await client.index({ index: 'tickets', id: ticket.ticket_id, document: ticket });
  }

  const notes = [
    { note_id: 'N-01', account_id: 'ACC-002', author: 'Sarah (CSM)', note_text: 'Had a tough call with TechFlow. The engineering VP is furious about the report timeout bug. They are evaluating a competitor next week. Need engineering to patch this ASAP.', sentiment: 'Negative', created_at: '2026-06-08T15:00:00Z' },
    { note_id: 'N-02', account_id: 'ACC-001', author: 'John (CSM)', note_text: 'Check-in went great. Acme loves the new dashboard update.', sentiment: 'Positive', created_at: '2026-06-01T11:00:00Z' },
    { note_id: 'N-03', account_id: 'ACC-007', author: 'Sarah (CSM)', note_text: 'Quantum Health is highly frustrated. Compliance issues are a dealbreaker for them. If we don\'t fix the HIPAA report by end of month, they will legally have to churn.', sentiment: 'Negative', created_at: '2026-06-07T16:00:00Z' },
    { note_id: 'N-04', account_id: 'ACC-005', author: 'Mark (CSM)', note_text: 'Pinnacle Finance CFO is upset about the billing error. We are issuing a credit, but trust is damaged. Needs executive sponsorship.', sentiment: 'Negative', created_at: '2026-05-20T11:00:00Z' },
    { note_id: 'N-05', account_id: 'ACC-009', author: 'Lisa (CSM)', note_text: 'Horizon Energy operations team is panicked about data loss. I escalated to engineering tier 3. They are calm for now but waiting on RCA.', sentiment: 'Neutral', created_at: '2026-06-04T10:00:00Z' },
    { note_id: 'N-06', account_id: 'ACC-012', author: 'John (CSM)', note_text: 'Delta Data data science team is very unhappy with the model drift. They feel our recent update broke their workflows. Risk is high.', sentiment: 'Negative', created_at: '2026-06-01T12:00:00Z' },
    { note_id: 'N-07', account_id: 'ACC-004', author: 'Lisa (CSM)', note_text: 'Zenith Media QBR went perfectly. They are interested in upgrading to the enterprise tier.', sentiment: 'Positive', created_at: '2026-06-05T12:00:00Z' },
    { note_id: 'N-08', account_id: 'ACC-010', author: 'Mark (CSM)', note_text: 'Alpha Tech is happy. No major issues, just standard feature requests.', sentiment: 'Positive', created_at: '2026-06-06T16:00:00Z' },
    { note_id: 'N-09', account_id: 'ACC-003', author: 'Sarah (CSM)', note_text: 'Global Industries is doing well. Onboarding was smooth.', sentiment: 'Positive', created_at: '2026-05-15T10:00:00Z' },
    { note_id: 'N-10', account_id: 'ACC-006', author: 'John (CSM)', note_text: 'Vertex Logistics resolved their app crashing issues. They are satisfied with our prompt response.', sentiment: 'Positive', created_at: '2026-06-02T10:00:00Z' },
    { note_id: 'N-11', account_id: 'ACC-008', author: 'Lisa (CSM)', note_text: 'Nexus Education had some minor export issues but overall they are neutral.', sentiment: 'Neutral', created_at: '2026-05-28T14:00:00Z' },
    { note_id: 'N-12', account_id: 'ACC-011', author: 'Mark (CSM)', note_text: 'Omega Services is slightly annoyed about the billing duplicate charge. I processed a refund immediately.', sentiment: 'Neutral', created_at: '2026-05-22T11:00:00Z' }
  ];

  for (const note of notes) {
    await client.index({ index: 'health_notes', id: note.note_id, document: note });
  }

  const calls = [
    { call_id: 'C-99', account_id: 'ACC-002', transcript: 'CSM: Hi David, how are things?\nDavid: Terrible. The system crashed again during export. We are losing patience. If this isn\'t fixed by Friday, we are terminating the contract.', summary: 'Customer is extremely frustrated about export bugs. Threatened churn if not fixed by Friday.', duration_minutes: 15, date: '2026-06-08T14:30:00Z' },
    { call_id: 'C-100', account_id: 'ACC-007', transcript: 'CSM: Hello Dr. Smith. I saw the ticket regarding the HIPAA report.\nSmith: Yes, this is unacceptable. Our auditors are here today. If the system cannot generate this compliance report, we are in violation of federal law and we will drop your software immediately.', summary: 'Customer threatened immediate churn due to missing compliance report. Extremely high risk.', duration_minutes: 22, date: '2026-06-07T14:00:00Z' },
    { call_id: 'C-101', account_id: 'ACC-005', transcript: 'CSM: Let\'s review the Q2 invoice.\nCFO: I\'m looking at it, and there is a $15k overcharge. We didn\'t authorize those seats. We expect a full refund, and frankly, this makes us question your entire billing system.', summary: 'CFO is upset over billing errors and demands a refund. Trust is shaky.', duration_minutes: 30, date: '2026-05-19T15:00:00Z' },
    { call_id: 'C-102', account_id: 'ACC-009', transcript: 'CSM: We are investigating the telemetry drops.\nEngineer: We have 500 turbines offline in your dashboard. We need a root cause analysis today, otherwise we\'ll switch back to our old on-prem system.', summary: 'Engineering team is demanding an RCA for dropped IoT telemetry. At risk of reverting to legacy system.', duration_minutes: 45, date: '2026-06-03T10:00:00Z' },
    { call_id: 'C-103', account_id: 'ACC-004', transcript: 'CSM: How did the recent campaign go?\nMarketing Lead: It was amazing. The new audience segmentation feature you rolled out helped us double our engagement rate. We love it.', summary: 'Customer is highly satisfied with new segmentation feature and seeing great ROI.', duration_minutes: 20, date: '2026-06-05T10:00:00Z' },
    { call_id: 'C-104', account_id: 'ACC-012', transcript: 'CSM: Tell me about the model drift.\nData Scientist: The predictions are entirely inaccurate since the v2.4 update. We are manually exporting data to run models in Python now, which defeats the purpose of paying for your platform.', summary: 'Data science team is reverting to manual workflows because of broken ML predictions in the platform.', duration_minutes: 35, date: '2026-05-30T11:00:00Z' },
    { call_id: 'C-105', account_id: 'ACC-006', transcript: 'CSM: I see the app crashing issue was resolved.\nFleet Manager: Yes, thank you for the quick patch. The drivers are back on the road and everything is functioning normally now.', summary: 'App issue resolved, customer is satisfied with the quick turnaround.', duration_minutes: 10, date: '2026-05-26T10:00:00Z' },
    { call_id: 'C-106', account_id: 'ACC-011', transcript: 'CSM: Sorry about the billing error.\nAccountant: That\'s fine, as long as it\'s refunded. We just need to make sure this doesn\'t happen again next month.', summary: 'Customer accepted apology for billing error but expects no future issues.', duration_minutes: 12, date: '2026-05-22T14:00:00Z' }
  ];

  for (const call of calls) {
    await client.index({ index: 'call_transcripts', id: call.call_id, document: call });
  }

  const memories = [
    { memory_id: 'MEM-01', account_id: 'ACC-002', category: 'preference', content: 'David (TechFlow VP) is very sensitive to system downtime and prefers escalation updates sent directly via email rather than Slack.', created_at: '2026-06-08T16:00:00Z' },
    { memory_id: 'MEM-02', account_id: 'ACC-002', category: 'escalation', content: 'Primary engineering owner assigned to TechFlow is Alex from the Platform team. Daily updates are scheduled.', created_at: '2026-06-09T09:00:00Z' },
    { memory_id: 'MEM-03', account_id: 'ACC-007', category: 'milestone', content: 'Quantum Health requires HIPAA compliance audit logs to be retained for 7 years.', created_at: '2026-05-01T08:00:00Z' },
    { memory_id: 'MEM-04', account_id: 'ACC-005', category: 'preference', content: 'Pinnacle Finance CFO requires all billing changes to be approved manually via DocuSign.', created_at: '2026-04-10T09:00:00Z' },
    { memory_id: 'MEM-05', account_id: 'ACC-009', category: 'escalation', content: 'Tier 3 network engineering is currently investigating the 502 errors on the IoT ingestion gateway.', created_at: '2026-06-04T08:00:00Z' }
  ];

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

  for (const rb of runbooks) {
    await client.index({ index: 'knowledge_base', id: rb.runbook_id, document: rb });
  }

  console.log('Comprehensive Data seeded successfully!');
}

main().catch(console.error);

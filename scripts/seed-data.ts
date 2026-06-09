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
  
  // Ping the cluster to check connection
  try {
    const info = await client.info();
    console.log(`Connected to Elasticsearch v${info.version.number}`);
  } catch (err) {
    console.error('Failed to connect to Elasticsearch. Is the API key valid?', err);
    process.exit(1);
  }

  // Define our indices
  const indices = ['accounts', 'tickets', 'health_notes', 'call_transcripts', 'agent_memory'];
  
  // Delete existing indices if they exist (for clean restart during testing)
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

  // Wait a moment for deletion to propagate in serverless
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Creating mappings...');

  // Accounts mapping (semantic_text not strictly needed here unless we search it semantically, but good for keyword and risk filtering)
  await client.indices.create({
    index: 'accounts',
    mappings: {
      properties: {
        account_id: { type: 'keyword' },
        company_name: { type: 'text' },
        industry: { type: 'keyword' },
        arr: { type: 'float' },
        risk_score: { type: 'float' }, // 0.0 to 1.0
        status: { type: 'keyword' },
        last_contact_date: { type: 'date' }
      }
    }
  });

  // Tickets mapping using semantic_text for semantic search!
  await client.indices.create({
    index: 'tickets',
    mappings: {
      properties: {
        ticket_id: { type: 'keyword' },
        account_id: { type: 'keyword' },
        subject: { type: 'semantic_text' }, // Requires ES 8.15+ Serverless default!
        description: { type: 'semantic_text' },
        status: { type: 'keyword' },
        priority: { type: 'keyword' },
        created_at: { type: 'date' }
      }
    }
  });

  // Health notes mapping
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

  // Call transcripts mapping
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

  // Agent memory mapping using semantic_text for semantic memory lookup
  await client.indices.create({
    index: 'agent_memory',
    mappings: {
      properties: {
        memory_id: { type: 'keyword' },
        account_id: { type: 'keyword' },
        content: { type: 'semantic_text' },
        category: { type: 'keyword' }, // preference, milestone, escalation
        created_at: { type: 'date' }
      }
    }
  });

  console.log('Indices created successfully.');

  console.log('Seeding Demo Data...');

  // Mock Accounts
  const accounts = [
    { account_id: 'ACC-001', company_name: 'Acme Corp', industry: 'Retail', arr: 150000, risk_score: 0.1, status: 'Active', last_contact_date: '2026-06-01T10:00:00Z' },
    { account_id: 'ACC-002', company_name: 'TechFlow', industry: 'SaaS', arr: 500000, risk_score: 0.85, status: 'At Risk', last_contact_date: '2026-06-08T14:30:00Z' },
    { account_id: 'ACC-003', company_name: 'Global Industries', industry: 'Manufacturing', arr: 250000, risk_score: 0.3, status: 'Active', last_contact_date: '2026-05-15T09:00:00Z' },
  ];

  for (const account of accounts) {
    await client.index({
      index: 'accounts',
      id: account.account_id,
      document: account
    });
  }

  // Mock Tickets
  const tickets = [
    { ticket_id: 'TKT-100', account_id: 'ACC-001', subject: 'Login issue with SSO', description: 'Users cannot log in via Okta. Error code 403.', status: 'Closed', priority: 'High', created_at: '2026-05-20T11:00:00Z' },
    { ticket_id: 'TKT-101', account_id: 'ACC-002', subject: 'Data export failing constantly', description: 'Every time we try to export the monthly report, it times out and crashes. This is critical for our board meeting next week. We are considering leaving if this is not fixed.', status: 'Open', priority: 'Urgent', created_at: '2026-06-08T10:00:00Z' },
    { ticket_id: 'TKT-102', account_id: 'ACC-002', subject: 'API Rate limit too low', description: 'We keep hitting the rate limit on the reporting API. Can we increase this?', status: 'Open', priority: 'Medium', created_at: '2026-06-05T13:00:00Z' },
    { ticket_id: 'TKT-103', account_id: 'ACC-003', subject: 'How to add new user', description: 'Where is the button to invite a new team member?', status: 'Closed', priority: 'Low', created_at: '2026-05-10T15:00:00Z' },
  ];

  for (const ticket of tickets) {
    await client.index({
      index: 'tickets',
      id: ticket.ticket_id,
      document: ticket
    });
  }

  // Mock Health Notes
  const notes = [
    { note_id: 'N-01', account_id: 'ACC-002', author: 'Sarah (CSM)', note_text: 'Had a tough call with TechFlow. The engineering VP is furious about the report timeout bug. They are evaluating a competitor next week. Need engineering to patch this ASAP.', sentiment: 'Negative', created_at: '2026-06-08T15:00:00Z' },
    { note_id: 'N-02', account_id: 'ACC-001', author: 'John (CSM)', note_text: 'Check-in went great. Acme loves the new dashboard update.', sentiment: 'Positive', created_at: '2026-06-01T11:00:00Z' }
  ];

  for (const note of notes) {
    await client.index({
      index: 'health_notes',
      id: note.note_id,
      document: note
    });
  }

  // Mock Call Transcripts
  const calls = [
    { call_id: 'C-99', account_id: 'ACC-002', transcript: 'CSM: Hi David, how are things?\nDavid: Terrible. The system crashed again during export. We are losing patience. If this isn\'t fixed by Friday, we are terminating the contract.', summary: 'Customer is extremely frustrated about export bugs. Threatened churn if not fixed by Friday.', duration_minutes: 15, date: '2026-06-08T14:30:00Z' }
  ];

  for (const call of calls) {
    await client.index({
      index: 'call_transcripts',
      id: call.call_id,
      document: call
    });
  }

  // Mock Agent Memories
  const memories = [
    { memory_id: 'MEM-01', account_id: 'ACC-002', category: 'preference', content: 'David (TechFlow VP) is very sensitive to system downtime and prefers escalation updates sent directly via email rather than Slack.', created_at: '2026-06-08T16:00:00Z' },
    { memory_id: 'MEM-02', account_id: 'ACC-002', category: 'escalation', content: 'Primary engineering owner assigned to TechFlow is Alex from the Platform team. Daily updates are scheduled.', created_at: '2026-06-09T09:00:00Z' }
  ];

  for (const memory of memories) {
    await client.index({
      index: 'agent_memory',
      id: memory.memory_id,
      document: memory
    });
  }

  console.log('Data seeded successfully!');
}

main().catch(console.error);

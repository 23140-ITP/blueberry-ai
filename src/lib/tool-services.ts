import { getElasticClient } from './elastic';

// Original Seed Data Constants for reset functionality
const SEED_ACCOUNTS = [
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

export async function listAllAccountsService() {
  const client = getElasticClient();
  const result = await client.search({
    index: 'accounts',
    query: { match_all: {} },
    size: 100
  });

  const accounts = result.hits.hits.map(hit => hit._source);
  accounts.sort((a: any, b: any) => b.risk_score - a.risk_score);

  const aggregations = (result.aggregations as any)?.industry_breakdown?.buckets?.map((bucket: any) => ({
    industry: bucket.key,
    count: bucket.doc_count,
    avgRisk: bucket.avg_risk?.value || 0,
    totalArr: bucket.total_arr?.value || 0
  })) || [];

  return { accounts, aggregations };
}

export async function getAccountContextService(accountId: string) {
  const client = getElasticClient();

  // 1. Fetch Account Details
  const accountResult = await client.search({
    index: 'accounts',
    query: { term: { account_id: accountId } }
  });

  if (accountResult.hits.hits.length === 0 || !accountResult.hits.hits[0]) {
    throw new Error(`Account with ID ${accountId} not found`);
  }

  const account = accountResult.hits.hits[0]._source;

  // 2. Fetch Tickets
  const ticketsResult = await client.search({
    index: 'tickets',
    query: { term: { account_id: accountId } },
    size: 50
  });
  const tickets = ticketsResult.hits.hits.map(hit => hit._source);

  // 3. Fetch Health Notes
  const notesResult = await client.search({
    index: 'health_notes',
    query: { term: { account_id: accountId } },
    size: 50
  });
  const healthNotes = notesResult.hits.hits.map(hit => hit._source);

  // 4. Fetch Call Transcripts
  const transcriptsResult = await client.search({
    index: 'call_transcripts',
    query: { term: { account_id: accountId } },
    size: 50
  });
  const callTranscripts = transcriptsResult.hits.hits.map(hit => hit._source);

  return {
    account,
    tickets,
    healthNotes,
    callTranscripts
  };
}

export async function searchIssuesService(query: string, accountId?: string) {
  const client = getElasticClient();

  // 1. Search Tickets
  const ticketsQuery: any = accountId
    ? {
        bool: {
          must: [
            { term: { account_id: accountId } }
          ],
          should: [
            { match: { subject: { query } } },
            { match: { description: { query } } }
          ],
          minimum_should_match: 1
        }
      }
    : {
        bool: {
          should: [
            { match: { subject: { query } } },
            { match: { description: { query } } }
          ],
          minimum_should_match: 1
        }
      };

  const ticketsResult = await client.search({
    index: 'tickets',
    query: ticketsQuery,
    size: 5
  });
  const tickets = ticketsResult.hits.hits.map(hit => ({
    _score: hit._score,
    ...(hit._source as any)
  }));

  // 2. Search Call Transcripts
  const transcriptsQuery: any = accountId
    ? {
        bool: {
          must: [
            { term: { account_id: accountId } }
          ],
          should: [
            { match: { transcript: { query } } },
            { match: { summary: { query } } }
          ],
          minimum_should_match: 1
        }
      }
    : {
        bool: {
          should: [
            { match: { transcript: { query } } },
            { match: { summary: { query } } }
          ],
          minimum_should_match: 1
        }
      };

  const transcriptsResult = await client.search({
    index: 'call_transcripts',
    query: transcriptsQuery,
    size: 5
  });
  const transcripts = transcriptsResult.hits.hits.map(hit => ({
    _score: hit._score,
    ...(hit._source as any)
  }));

  // 3. Search Health Notes
  const notesQuery: any = accountId
    ? {
        bool: {
          must: [
            { term: { account_id: accountId } },
            { match: { note_text: { query } } }
          ]
        }
      }
    : {
        match: { note_text: { query } }
      };

  const notesResult = await client.search({
    index: 'health_notes',
    query: notesQuery,
    size: 5
  });
  const healthNotes = notesResult.hits.hits.map(hit => ({
    _score: hit._score,
    ...(hit._source as any)
  }));

  return {
    tickets,
    transcripts,
    healthNotes
  };
}

export async function writeHealthNoteService(accountId: string, noteText: string, sentimentOverride?: string, author: string = 'Blueberry Copilot') {
  const client = getElasticClient();

  let detectedSentiment = sentimentOverride;
  if (!detectedSentiment) {
    try {
      const eisResponse: any = await client.transport.request({
        method: 'POST',
        path: '/_inference/text_classification/sentiment-analysis-model',
        body: { input: noteText }
      });
      if (eisResponse?.results?.[0]) {
        detectedSentiment = eisResponse.results[0].predicted_value;
      }
    } catch (err) {
      console.log("EIS model not available. Falling back to local NLP heuristics...");
      const textLower = noteText.toLowerCase();
      if (
        textLower.includes('angry') || 
        textLower.includes('furious') || 
        textLower.includes('churn') || 
        textLower.includes('crash') || 
        textLower.includes('fail') || 
        textLower.includes('bad') || 
        textLower.includes('terrible') || 
        textLower.includes('leave') ||
        textLower.includes('frustrated') ||
        textLower.includes('competitor')
      ) {
        detectedSentiment = 'Negative';
      } else if (
        textLower.includes('happy') || 
        textLower.includes('love') || 
        textLower.includes('great') || 
        textLower.includes('good') || 
        textLower.includes('awesome') || 
        textLower.includes('success') ||
        textLower.includes('excellent')
      ) {
        detectedSentiment = 'Positive';
      } else {
        detectedSentiment = 'Neutral';
      }
    }
  }

  const noteId = `N-${Date.now()}`;
  const createdAt = new Date().toISOString();

  const document = {
    note_id: noteId,
    account_id: accountId,
    author,
    note_text: noteText,
    sentiment: detectedSentiment || 'Neutral',
    created_at: createdAt
  };

  const response = await client.index({
    index: 'health_notes',
    id: noteId,
    document,
    refresh: true
  });

  return {
    success: true,
    note: document,
    result: response.result
  };
}

export async function getAgentMemoryService(accountId: string, query?: string) {
  const client = getElasticClient();

  const elasticQuery: any = {
    bool: {
      must: [
        { term: { account_id: accountId } }
      ]
    }
  };

  if (query && query.trim()) {
    elasticQuery.bool.should = [
      { match: { content: { query } } }
    ];
    elasticQuery.bool.minimum_should_match = 1;
  }

  const result = await client.search({
    index: 'agent_memory',
    query: elasticQuery,
    size: 50
  });

  return result.hits.hits.map(hit => ({
    _score: hit._score,
    ...(hit._source as any)
  }));
}

export async function writeAgentMemoryService(accountId: string, content: string, category: string = 'milestone') {
  const client = getElasticClient();

  const memoryId = `MEM-${Date.now()}`;
  const createdAt = new Date().toISOString();

  const document = {
    memory_id: memoryId,
    account_id: accountId,
    content,
    category,
    created_at: createdAt
  };

  const response = await client.index({
    index: 'agent_memory',
    id: memoryId,
    document,
    refresh: true
  });

  return {
    success: true,
    memory: document,
    result: response.result
  };
}

export async function getDynamicRiskScoreService(accountId: string, saveToDb: boolean = false) {
  const client = getElasticClient();

  // 1. Fetch account basics
  const accountResult = await client.search({
    index: 'accounts',
    query: { term: { account_id: accountId } }
  });

  if (accountResult.hits.hits.length === 0 || !accountResult.hits.hits[0]) {
    throw new Error(`Account ${accountId} not found`);
  }

  const accountDoc: any = accountResult.hits.hits[0]._source;

  // 2. Query tickets via ES|QL
  let openTicketsCount = 0;
  let urgentCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  try {
    const ticketsEsql: any = await client.esql.query({
      query: `FROM tickets | WHERE account_id == "${accountId}" AND status == "Open" | STATS count(ticket_id) by priority`
    });

    if (ticketsEsql && ticketsEsql.values) {
      for (const row of ticketsEsql.values) {
        // ES|QL returns [ count, priority ] for stats count(id) by priority
        const count = Number(row[0]);
        const priority = row[1];
        
        openTicketsCount += count;
        if (priority === 'Urgent') urgentCount += count;
        else if (priority === 'High') highCount += count;
        else if (priority === 'Medium') mediumCount += count;
        else if (priority === 'Low') lowCount += count;
      }
    }
  } catch (e) {
    console.error('ES|QL tickets query failed, falling back to search:', e);
    const fallbackTickets = await client.search({
      index: 'tickets',
      query: {
        bool: {
          must: [
            { term: { account_id: accountId } },
            { term: { status: 'Open' } }
          ]
        }
      }
    });
    openTicketsCount = fallbackTickets.hits.hits.length;
    fallbackTickets.hits.hits.forEach((hit: any) => {
      const priority = hit._source.priority;
      if (priority === 'Urgent') urgentCount++;
      else if (priority === 'High') highCount++;
      else if (priority === 'Medium') mediumCount++;
      else if (priority === 'Low') lowCount++;
    });
  }

  // 3. Query notes via ES|QL
  let negativeNotes = 0;
  let positiveNotes = 0;
  let neutralNotes = 0;

  try {
    const notesEsql: any = await client.esql.query({
      query: `FROM health_notes | WHERE account_id == "${accountId}" | STATS count(note_id) by sentiment`
    });

    if (notesEsql && notesEsql.values) {
      for (const row of notesEsql.values) {
        // ES|QL returns [ count, sentiment ]
        const count = Number(row[0]);
        const sentiment = row[1];
        
        if (sentiment === 'Negative') negativeNotes += count;
        else if (sentiment === 'Positive') positiveNotes += count;
        else if (sentiment === 'Neutral') neutralNotes += count;
      }
    }
  } catch (e) {
    console.error('ES|QL notes query failed, falling back to search:', e);
    const fallbackNotes = await client.search({
      index: 'health_notes',
      query: { term: { account_id: accountId } }
    });
    fallbackNotes.hits.hits.forEach((hit: any) => {
      const sentiment = hit._source.sentiment;
      if (sentiment === 'Negative') negativeNotes++;
      else if (sentiment === 'Positive') positiveNotes++;
      else if (sentiment === 'Neutral') neutralNotes++;
    });
  }

  // 4. Calculate dynamic risk score
  let score = 0.05; // 5% baseline risk
  const factors: any[] = [];

  // Ticket contributions
  if (openTicketsCount > 0) {
    const ticketRisk = (urgentCount * 0.35) + (highCount * 0.15) + (mediumCount * 0.05) + (lowCount * 0.01);
    score += ticketRisk;
    factors.push({
      name: 'Active Support Tickets',
      value: `${openTicketsCount} open tickets (${urgentCount} Urgent, ${highCount} High)`,
      riskAdded: Math.round(ticketRisk * 100)
    });
  }

  // Health note sentiment contributions
  if (negativeNotes > 0) {
    const negRisk = Math.min(0.50, negativeNotes * 0.25);
    score += negRisk;
    factors.push({
      name: 'Negative Sentiment Reports',
      value: `${negativeNotes} negative indicators logged`,
      riskAdded: Math.round(negRisk * 100)
    });
  }

  if (positiveNotes > 0) {
    const posOffset = -Math.min(0.30, positiveNotes * 0.15);
    score += posOffset;
    factors.push({
      name: 'Positive Customer Check-ins',
      value: `${positiveNotes} positive check-ins logged`,
      riskAdded: Math.round(posOffset * 100)
    });
  }

  // Removed daysSinceContact to keep the mock risk score deterministic
  // A deterministic score is necessary so it doesn't artificially inflate over time during the demo.

  // Clamp score between 0.02 and 0.99
  const finalScore = Math.min(0.99, Math.max(0.02, score));
  const formattedScore = parseFloat(finalScore.toFixed(2));
  const finalStatus = formattedScore >= 0.75 ? 'Critical' : formattedScore >= 0.25 ? 'At Risk' : 'Active';

  // Only update database index if explicitly requested (e.g. simulation or explicit recalculation)
  if (saveToDb) {
    await client.update({
      index: 'accounts',
      id: accountId,
      doc: {
        risk_score: formattedScore,
        status: finalStatus
      },
      refresh: true
    });
  }

  return {
    accountId,
    companyName: accountDoc.company_name,
    dynamicRiskScore: formattedScore,
    status: finalStatus,
    factors
  };
}

export async function detectChurnRiskService(accountId: string) {
  // Leverage the existing ES|QL risk scoring logic but format it specifically for agent analysis
  const riskAnalysis = await getDynamicRiskScoreService(accountId, false);
  
  return {
    success: true,
    toolContext: "This is a dedicated ES|QL churn risk analysis tool.",
    analysis: riskAnalysis,
    recommendation: riskAnalysis.dynamicRiskScore >= 0.75 
      ? `CRITICAL RISK. Immediate escalation required for ${riskAnalysis.companyName}.`
      : riskAnalysis.dynamicRiskScore >= 0.25
      ? `AT RISK. Monitor closely and schedule a check-in with ${riskAnalysis.companyName}.`
      : `HEALTHY. ${riskAnalysis.companyName} is currently at low risk of churn.`
  };
}

export async function recommendRunbookService(ticketId?: string, query?: string) {
  const client = getElasticClient();
  let queryText = '';
  let ticketDetail = null;

  if (ticketId) {
    const ticketResult = await client.search({
      index: 'tickets',
      query: { term: { ticket_id: ticketId } }
    });

    if (ticketResult.hits.hits.length > 0 && ticketResult.hits.hits[0]) {
      const ticket: any = ticketResult.hits.hits[0]._source;
      ticketDetail = ticket;
      queryText = `Subject: ${ticket.subject}. Description: ${ticket.description}`;
    } else {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }
  } else if (query) {
    queryText = query;
  } else {
    throw new Error('Either ticketId or query is required');
  }

  const searchResult = await client.search({
    index: 'knowledge_base',
    query: {
      semantic: {
        field: 'content',
        query: queryText
      }
    },
    size: 1
  });

  if (searchResult.hits.hits.length > 0 && searchResult.hits.hits[0]) {
    const match = searchResult.hits.hits[0];
    const runbook: any = match._source;
    const score = match._score || 0;

    return {
      success: true,
      ticket: ticketDetail,
      queryText,
      runbook: {
        runbookId: runbook.runbook_id,
        title: runbook.title,
        content: runbook.content,
        category: runbook.category
      },
      relevanceScore: Math.round(score * 100)
    };
  }

  return {
    success: false,
    message: 'No matching runbook found in the knowledge base.'
  };
}

export async function escalateAccountService(accountId: string) {
  const client = getElasticClient();

  // 1. Fetch Account Details
  const accountResult = await client.search({
    index: 'accounts',
    query: { term: { account_id: accountId } }
  });

  if (accountResult.hits.hits.length === 0 || !accountResult.hits.hits[0]) {
    throw new Error(`Account with ID ${accountId} not found`);
  }

  const account: any = accountResult.hits.hits[0]._source;

  // 2. Fetch Open Tickets
  const ticketsResult = await client.search({
    index: 'tickets',
    query: {
      bool: {
        must: [
          { term: { account_id: accountId } },
          { term: { status: 'Open' } }
        ]
      }
    },
    size: 50
  });
  const openTickets = ticketsResult.hits.hits.map((hit: any) => hit._source);

  // 3. Compile Escalation Digest
  const ticketSummaries = openTickets.map((t: any) => `- [${t.priority} Priority] ${t.subject}: ${t.description}`).join('\n');
  
  const digest = `### 🚨 ACCOUNT ESCALATION SUMMARY: ${account.company_name} (${accountId})
**Current ARR:** $${account.arr.toLocaleString()}
**Escalation Owner:** Blueberry AI Copilot
**Escalation Reason:** Unresolved critical support issues threatening account retention.

**Active Open Tickets:**
${openTickets.length > 0 ? ticketSummaries : '- No active open tickets. Escalation triggered due to negative CSM sentiment notes.'}
`;

  // 4. Save Milestone to Agent Memory
  const memoryId = `MEM-${Date.now()}`;
  const memoryContent = `Initiated emergency account escalation for ${account.company_name} due to open tickets regarding report data export timeouts. Assigned priority watch status.`;
  
  await client.index({
    index: 'agent_memory',
    id: memoryId,
    document: {
      memory_id: memoryId,
      account_id: accountId,
      category: 'escalation',
      content: memoryContent,
      created_at: new Date().toISOString()
    },
    refresh: true
  });

  // 5. Update Account risk score to Critical in Elasticsearch
  await client.update({
    index: 'accounts',
    id: accountId,
    doc: {
      risk_score: 0.99,
      status: 'Critical'
    },
    refresh: true
  });

  // 6. Generate Slack Layout Card (JSON Block Kit format)
  const slackCard = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🚨 EMERGENCY ESCALATION: ${account.company_name.toUpperCase()}`,
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Account ID:*\n${accountId}` },
          { type: "mrkdwn", text: `*Annual Recurring Revenue:*\n$${account.arr.toLocaleString()}` }
        ]
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Status:*\n:fire: CRITICAL RISK (99%)` },
          { type: "mrkdwn", text: `*Open Issues:*\n${openTickets.length} active tickets` }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Primary Issue Detail:*\n${openTickets.length > 0 ? openTickets[0].subject : 'Negative sentiment notes logged by CSM Sarah'}`
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Assign Dev Team", emoji: true },
            style: "danger",
            value: "assign_dev"
          },
          {
            type: "button",
            text: { type: "plain_text", text: "View Retention Dashboard", emoji: true },
            value: "view_radar"
          }
        ]
      }
    ]
  };

  // 7. Generate Email Template (Markdown format)
  const emailDraft = `Subject: URGENT: Churn Risk Escalation - ${account.company_name} (${accountId}) - ARR $${account.arr.toLocaleString()}

Hi Retention and Engineering Leads,

We are triggering an official emergency escalation for ${account.company_name} (${accountId}) effective immediately.

This customer is at critical risk of churning (Risk Score: 99%) due to active platform issues. Below is the digest of their unresolved support tickets:

${openTickets.length > 0 ? ticketSummaries : 'Negative customer sentiment notes logged by CSM.'}

Action Items Required:
1. Engineering team must assign a resource to debug the reports export timeout crashes.
2. CSM to schedule an emergency touchpoint with David (TechFlow VP) to reassure them of the patch timeline.

Please coordinate updates directly in the Blueberry AI Copilot memory bank.

Best regards,
Blueberry AI Copilot
`;

  return {
    success: true,
    accountId,
    companyName: account.company_name,
    digest,
    slackCard: JSON.stringify(slackCard, null, 2),
    emailDraft,
    memory: {
      memory_id: memoryId,
      content: memoryContent,
      category: 'escalation',
      created_at: new Date().toISOString()
    }
  };
}

export async function simulateEventService(body: any) {
  const client = getElasticClient();
  const { type, accountId } = body;
  const timestamp = new Date().toISOString();
  let indexedDoc: any = null;
  let indexName = '';
  let docId = '';

  // 1. Fetch Company Name for confirmation output
  const accountResult = await client.search({
    index: 'accounts',
    query: { term: { account_id: accountId } }
  });
  if (accountResult.hits.hits.length === 0 || !accountResult.hits.hits[0]) {
    throw new Error(`Account ${accountId} not found`);
  }
  const accountDoc: any = accountResult.hits.hits[0]._source;

  // 2. Ingest based on event type
  if (type === 'ticket') {
    const { subject, description, priority = 'Medium', status = 'Open' } = body;
    if (!subject || !description) {
      throw new Error('subject and description are required for ticket simulation');
    }

    indexName = 'tickets';
    docId = `TKT-${Date.now().toString().slice(-4)}`;
    indexedDoc = {
      ticket_id: docId,
      account_id: accountId,
      subject,
      description,
      priority,
      status,
      created_at: timestamp
    };

  } else if (type === 'call') {
    const { transcript, summary, durationMinutes = 15 } = body;
    if (!transcript || !summary) {
      throw new Error('transcript and summary are required for call simulation');
    }

    indexName = 'call_transcripts';
    docId = `C-${Date.now().toString().slice(-4)}`;
    indexedDoc = {
      call_id: docId,
      account_id: accountId,
      transcript,
      summary,
      duration_minutes: Number(durationMinutes),
      date: timestamp
    };

  } else if (type === 'note') {
    const { noteText, author = 'Sarah (CSM)' } = body;
    if (!noteText) {
      throw new Error('noteText is required for CSM note simulation');
    }

    const negativeWords = ['churn', 'angry', 'terrible', 'crash', 'timeout', 'cancel', 'frustrated', 'leave', 'competitor', 'broken'];
    const positiveWords = ['happy', 'love', 'great', 'awesome', 'solved', 'fixed', 'thank', 'delighted', 'renew', 'expansion'];
    
    const lowerText = noteText.toLowerCase();
    let sentiment = 'Neutral';
    
    if (negativeWords.some(w => lowerText.includes(w))) {
      sentiment = 'Negative';
    } else if (positiveWords.some(w => lowerText.includes(w))) {
      sentiment = 'Positive';
    }

    indexName = 'health_notes';
    docId = `N-${Date.now().toString().slice(-4)}`;
    indexedDoc = {
      note_id: docId,
      account_id: accountId,
      author,
      note_text: noteText,
      sentiment,
      created_at: timestamp
    };
  } else {
    throw new Error(`Invalid type '${type}'. Must be ticket, call, or note`);
  }

  // 3. Index the new document
  await client.index({
    index: indexName,
    id: docId,
    document: indexedDoc,
    refresh: true
  });

  // 4. Trigger dynamic risk recalculation and persist to database (saveToDb = true)
  let newRiskScore = null;
  let newStatus = null;
  try {
    const calcData = await getDynamicRiskScoreService(accountId, true);
    newRiskScore = calcData.dynamicRiskScore;
    newStatus = calcData.status;
  } catch (err) {
    console.error('Failed to trigger automatic risk re-computation:', err);
  }

  return {
    success: true,
    message: `Successfully simulated and indexed ${type} event.`,
    companyName: accountDoc.company_name,
    document: indexedDoc,
    healthUpdate: {
      accountId,
      newRiskScore,
      newStatus
    }
  };
}

export async function resetDemoDatabaseService() {
  const client = getElasticClient();

  // 1. Reset all accounts to their original seeded scores and statuses
  for (const account of SEED_ACCOUNTS) {
    await client.update({
      index: 'accounts',
      id: account.account_id,
      doc: {
        risk_score: account.risk_score,
        status: account.status
      },
      refresh: true
    });
  }

  // 2. Delete simulated tickets (keep only original seeded ones: TKT-100 to TKT-126)
  const validTicketIds = Array.from({ length: 27 }, (_, i) => `TKT-${100 + i}`);
  await client.deleteByQuery({
    index: 'tickets',
    query: {
      bool: {
        must_not: [
          { terms: { ticket_id: validTicketIds } }
        ]
      }
    },
    refresh: true
  });

  // 3. Delete simulated notes (keep only N-01 to N-12)
  const validNoteIds = Array.from({ length: 12 }, (_, i) => `N-${String(i + 1).padStart(2, '0')}`);
  await client.deleteByQuery({
    index: 'health_notes',
    query: {
      bool: {
        must_not: [
          { terms: { note_id: validNoteIds } }
        ]
      }
    },
    refresh: true
  });

  // 4. Delete simulated transcripts (keep C-99 to C-106)
  const validCallIds = Array.from({ length: 8 }, (_, i) => `C-${99 + i}`);
  await client.deleteByQuery({
    index: 'call_transcripts',
    query: {
      bool: {
        must_not: [
          { terms: { call_id: validCallIds } }
        ]
      }
    },
    refresh: true
  });

  // 5. Delete simulated agent memories (keep MEM-01 to MEM-05)
  const validMemoryIds = Array.from({ length: 5 }, (_, i) => `MEM-${String(i + 1).padStart(2, '0')}`);
  await client.deleteByQuery({
    index: 'agent_memory',
    query: {
      bool: {
        must_not: [
          { terms: { memory_id: validMemoryIds } }
        ]
      }
    },
    refresh: true
  });

  return {
    success: true,
    message: 'Demo database has been successfully reset to initial seed values.'
  };
}

export async function getPainPointsService() {
  const client = getElasticClient();

  // 1. Fetch all accounts
  const accountsResult = await client.search({
    index: 'accounts',
    query: { match_all: {} },
    size: 100
  });
  
  const accountsMap: Record<string, { companyName: string; arr: number }> = {};
  accountsResult.hits.hits.forEach((hit: any) => {
    const acc = hit._source;
    accountsMap[acc.account_id] = {
      companyName: acc.company_name,
      arr: acc.arr
    };
  });

  // 2. Fetch all open tickets
  const ticketsResult = await client.search({
    index: 'tickets',
    query: { term: { status: 'Open' } },
    size: 100
  });
  const tickets = ticketsResult.hits.hits.map((hit: any) => hit._source);

  // 3. Define categories with tickets array
  const categories = [
    {
      id: 'export',
      name: 'Data Export & Reports',
      keywords: ['export', 'report', 'timeout', 'csv', 'excel', 'crash', 'timeout', 'board meeting'],
      description: 'Timeouts and crashes encountered during monthly dashboard or data export operations.',
      count: 0,
      arrAtRisk: 0,
      affectedAccounts: new Set<string>(),
      tickets: [] as any[]
    },
    {
      id: 'sso',
      name: 'SSO & Okta Authentication',
      keywords: ['sso', 'okta', 'login', 'forbidden', 'password', 'authenticate', '403'],
      description: 'Authentication failures, Okta configuration bugs, and Single Sign-On lockout alerts.',
      count: 0,
      arrAtRisk: 0,
      affectedAccounts: new Set<string>(),
      tickets: [] as any[]
    },
    {
      id: 'api',
      name: 'API Rate Limits & Throttling',
      keywords: ['rate limit', 'api', 'quota', 'requests', 'throttle', 'limit too low'],
      description: 'Customers hitting rate limit blockages on transactional or synchronization APIs.',
      count: 0,
      arrAtRisk: 0,
      affectedAccounts: new Set<string>(),
      tickets: [] as any[]
    },
    {
      id: 'other',
      name: 'Setup & Usability Queries',
      keywords: [],
      description: 'Administrative requests, onboarding questions, and UI usability queries.',
      count: 0,
      arrAtRisk: 0,
      affectedAccounts: new Set<string>(),
      tickets: [] as any[]
    }
  ];

  // 4. Cluster tickets
  tickets.forEach((t: any) => {
    const subject = (t.subject || '').toLowerCase();
    const description = (t.description || '').toLowerCase();
    const text = `${subject} ${description}`;
    const accInfo = accountsMap[t.account_id];
    const companyName = accInfo ? accInfo.companyName : t.account_id;

    let matched = false;
    for (const cat of categories) {
      if (cat.id !== 'other' && cat.keywords.some(word => text.includes(word))) {
        cat.count++;
        cat.affectedAccounts.add(t.account_id);
        cat.tickets.push({
          ticket_id: t.ticket_id,
          subject: t.subject,
          priority: t.priority,
          account_id: t.account_id,
          companyName
        });
        matched = true;
        break;
      }
    }

    if (!matched) {
      const otherCat = categories.find(c => c.id === 'other');
      if (otherCat) {
        otherCat.count++;
        otherCat.affectedAccounts.add(t.account_id);
        otherCat.tickets.push({
          ticket_id: t.ticket_id,
          subject: t.subject,
          priority: t.priority,
          account_id: t.account_id,
          companyName
        });
      }
    }
  });

  // 5. Calculate financial impact
  const clusters = categories.map(cat => {
    let arrSum = 0;
    const accountNames: string[] = [];
    
    cat.affectedAccounts.forEach(accId => {
      const accInfo = accountsMap[accId];
      if (accInfo) {
        arrSum += accInfo.arr;
        accountNames.push(accInfo.companyName);
      }
    });

    return {
      id: cat.id,
      category: cat.name,
      description: cat.description,
      count: cat.count,
      arrAtRisk: arrSum,
      accounts: accountNames,
      tickets: cat.tickets
    };
  });

  clusters.sort((a, b) => b.arrAtRisk - a.arrAtRisk);
  return clusters;
}

export async function getPortfolioSummaryService() {
  const client = getElasticClient();
  const result = await client.search({
    index: 'accounts',
    query: { match_all: {} },
    size: 100
  });

  const accounts = result.hits.hits.map((hit: any) => hit._source);
  const totalAccounts = accounts.length;
  const totalARR = accounts.reduce((sum, acc) => sum + acc.arr, 0);
  const criticalCount = accounts.filter(acc => acc.risk_score >= 0.75).length;
  const warningCount = accounts.filter(acc => acc.risk_score >= 0.25 && acc.risk_score < 0.75).length;
  const healthyCount = accounts.filter(acc => acc.risk_score < 0.25).length;
  const avgHealthScore = totalAccounts
    ? Math.round(100 - (accounts.reduce((sum, acc) => sum + acc.risk_score, 0) / totalAccounts) * 100)
    : 100;

  return {
    success: true,
    totalAccounts,
    totalARR,
    criticalCount,
    warningCount,
    healthyCount,
    avgHealthScore,
    accounts: accounts.map((acc: any) => ({
      accountId: acc.account_id,
      companyName: acc.company_name,
      arr: acc.arr,
      riskScore: acc.risk_score,
      status: acc.status
    }))
  };
}

export async function supportResolutionAgentService(accountId: string) {
  // 1. Fetch tickets
  const client = getElasticClient();
  const ticketsResult = await client.search({
    index: 'tickets',
    query: { term: { account_id: accountId, status: 'Open' } },
    size: 5
  });
  const tickets = ticketsResult.hits.hits.map((hit: any) => hit._source);
  
  if (tickets.length === 0) {
    return { success: true, message: "No open tickets found for support resolution." };
  }

  // 2. Recommend runbook for the top ticket
  const topTicket = tickets[0];
  const runbookResult = await recommendRunbookService(topTicket.ticket_id);

  return {
    success: true,
    toolContext: "Support Resolution Agent analyzing open issues...",
    topIssue: topTicket,
    suggestedRunbook: runbookResult.success ? runbookResult.runbook : "No runbook found.",
    actionPlan: runbookResult.success ? `Apply runbook: ${runbookResult.runbook?.title}` : `Escalate to engineering: ${topTicket.subject}`
  };
}

export async function churnInvestigatorAgentService(accountId: string) {
  const riskAnalysis = await getDynamicRiskScoreService(accountId, false);
  return {
    success: true,
    toolContext: "Churn Investigator Agent computing Risk Drivers...",
    score: riskAnalysis.dynamicRiskScore,
    status: riskAnalysis.status,
    riskDrivers: riskAnalysis.factors
  };
}

export async function voiceOfCustomerAgentService(accountId: string) {
  const client = getElasticClient();
  const transcriptsResult = await client.search({
    index: 'call_transcripts',
    query: { term: { account_id: accountId } },
    size: 5
  });
  const calls = transcriptsResult.hits.hits.map((hit: any) => hit._source);
  
  const notesResult = await client.search({
    index: 'health_notes',
    query: { term: { account_id: accountId } },
    size: 10
  });
  const notes = notesResult.hits.hits.map((hit: any) => hit._source);

  const negativeNotes = notes.filter((n: any) => n.sentiment === 'Negative').length;
  
  return {
    success: true,
    toolContext: "Voice of Customer Agent clustering pain points...",
    recentCallsAnalyzed: calls.length,
    sentimentWarning: negativeNotes > 0 ? `${negativeNotes} negative health notes detected.` : `Customer sentiment is neutral/positive.`,
    productInsight: "Data export timeouts and SLA breaches are the primary friction points discussed in recent transcripts."
  };
}

export async function actionAgentService(accountId: string, briefContent: string) {
  return await writeAgentMemoryService(accountId, briefContent, 'executive_brief');
}


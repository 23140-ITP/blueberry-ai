import { NextResponse } from 'next/server';
import { getElasticClient } from '@/lib/elastic';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json({ error: 'accountId parameter is required in request body' }, { status: 400 });
    }

    const client = getElasticClient();

    // 1. Fetch Account Details
    const accountResult = await client.search({
      index: 'accounts',
      query: { term: { account_id: accountId } }
    });

    if (accountResult.hits.hits.length === 0 || !accountResult.hits.hits[0]) {
      return NextResponse.json({ error: `Account with ID ${accountId} not found` }, { status: 404 });
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
      }
    });

    // 5. Update Account risk score to Critical in Elasticsearch
    await client.update({
      index: 'accounts',
      id: accountId,
      doc: {
        risk_score: 0.99,
        status: 'Critical'
      }
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
            {
              type: "mrkdwn",
              text: `*Account ID:*\n${accountId}`
            },
            {
              type: "mrkdwn",
              text: `*Annual Recurring Revenue:*\n$${account.arr.toLocaleString()}`
            }
          ]
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Status:*\n:fire: CRITICAL RISK (99%)`
            },
            {
              type: "mrkdwn",
              text: `*Open Issues:*\n${openTickets.length} active tickets`
            }
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
              text: {
                type: "plain_text",
                text: "Assign Dev Team",
                emoji: true
              },
              style: "danger",
              value: "assign_dev"
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Retention Dashboard",
                emoji: true
              },
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

    return NextResponse.json({
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
    });

  } catch (error: any) {
    console.error('Error in account escalation endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

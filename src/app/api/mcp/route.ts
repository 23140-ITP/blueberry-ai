import { NextResponse } from 'next/server';
import { 
  getAccountContextService, 
  searchIssuesService, 
  writeHealthNoteService, 
  getAgentMemoryService, 
  writeAgentMemoryService, 
  getDynamicRiskScoreService, 
  recommendRunbookService, 
  escalateAccountService, 
  simulateEventService,
  resetDemoDatabaseService,
  getPortfolioSummaryService,
  detectChurnRiskService
} from '@/lib/tool-services';

export const dynamic = 'force-dynamic';

const TOOLS = [
  {
    name: 'getPortfolioSummary',
    description: 'Retrieve a portfolio-wide summary of customer accounts, total ARR, portfolio health distribution, and lists of critical/warning/healthy companies.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getAccountContext',
    description: 'Get support tickets, call transcripts, and CSM notes for a specific customer account to assess churn risk.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'The unique ID of the account (e.g. ACC-002)' }
      },
      required: ['accountId']
    }
  },
  {
    name: 'searchIssues',
    description: 'Semantically search tickets, transcripts, and notes across all accounts or for a specific account.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query related to customer issues or complaints' },
        accountId: { type: 'string', description: 'Optional account ID to restrict the search to' }
      },
      required: ['query']
    }
  },
  {
    name: 'writeHealthNote',
    description: 'Write a new CSM health note/check-in for a customer account. Automatically analyzes sentiment.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'The unique ID of the account' },
        noteText: { type: 'string', description: 'The detailed content of the CSM update' },
        sentiment: { type: 'string', description: 'Optional sentiment override (Positive, Neutral, Negative)' }
      },
      required: ['accountId', 'noteText']
    }
  },
  {
    name: 'getAgentMemory',
    description: 'Retrieve the long-term agent memories and notes remembered about a specific account.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'The unique ID of the account' },
        query: { type: 'string', description: 'Optional semantic query to retrieve specific memories' }
      },
      required: ['accountId']
    }
  },
  {
    name: 'writeAgentMemory',
    description: 'Save a key fact, preference, or escalation milestone to the long-term agent memory index.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'The unique ID of the account' },
        content: { type: 'string', description: 'The fact or preference to remember' },
        category: { type: 'string', description: 'Category of memory (preference, escalation, milestone)' }
      },
      required: ['accountId', 'content']
    }
  },
  {
    name: 'getDynamicRiskScore',
    description: 'Calculate and update a customer account risk score dynamically using ES|QL queries on live tickets and sentiment indicators.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'The unique ID of the account (e.g. ACC-002)' }
      },
      required: ['accountId']
    }
  },
  {
    name: 'detectChurnRisk',
    description: 'Calculate a dedicated churn risk analysis dynamically using ES|QL queries on live tickets and sentiment indicators.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'The unique ID of the account (e.g. ACC-002)' }
      },
      required: ['accountId']
    }
  },
  {
    name: 'recommendRunbook',
    description: 'Fetch and recommend resolution runbooks from the knowledge base using semantic search for a specific support ticket ID or query string.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string', description: 'Optional support ticket ID (e.g. TKT-101) to recommend a runbook for' },
        query: { type: 'string', description: 'Optional raw query to semantically match runbooks' }
      }
    }
  },
  {
    name: 'escalateAccount',
    description: 'Trigger an emergency escalation workflow for a customer account, flagging them as critical (99% risk) and generating Slack JSON block kit cards and copyable Email markdown drafts.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'The unique ID of the account' }
      },
      required: ['accountId']
    }
  },
  {
    name: 'simulateEvent',
    description: 'Simulate and ingest customer activity events (tickets, calls, notes) into Elasticsearch, recalculating the risk score automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Type of event: ticket, call, or note' },
        accountId: { type: 'string', description: 'The unique ID of the account' },
        subject: { type: 'string', description: 'For tickets: subject line' },
        description: { type: 'string', description: 'For tickets: detail description' },
        priority: { type: 'string', description: 'For tickets: priority level (Low, Medium, High, Urgent)' },
        transcript: { type: 'string', description: 'For calls: raw phone transcript text' },
        summary: { type: 'string', description: 'For calls: summary of call' },
        durationMinutes: { type: 'number', description: 'For calls: duration in minutes' },
        noteText: { type: 'string', description: 'For notes: CSM note content' },
        author: { type: 'string', description: 'For notes: CSM author name' }
      },
      required: ['type', 'accountId']
    }
  },
  {
    name: 'resetDemoDatabase',
    description: 'Reset all customer accounts, simulated support tickets, CSM notes, call transcripts, and agent memory back to original seed data.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

export async function GET() {
  return NextResponse.json({ tools: TOOLS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, params } = body;

    const reqMethod = method || body.method;
    
    if (reqMethod === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        result: { tools: TOOLS },
        id: body.id || null
      });
    }

    if (reqMethod === 'tools/call' || body.name) {
      const name = params?.name || body.name;
      const args = params?.arguments || body.arguments || {};
      let responseData: any = null;

      if (name === 'getPortfolioSummary') {
        responseData = await getPortfolioSummaryService();
      } else if (name === 'getAccountContext') {
        responseData = await getAccountContextService(args.accountId);
      } else if (name === 'searchIssues') {
        responseData = await searchIssuesService(args.query, args.accountId);
      } else if (name === 'writeHealthNote') {
        responseData = await writeHealthNoteService(args.accountId, args.noteText, args.sentiment, args.author);
      } else if (name === 'getAgentMemory') {
        responseData = await getAgentMemoryService(args.accountId, args.query);
      } else if (name === 'writeAgentMemory') {
        responseData = await writeAgentMemoryService(args.accountId, args.content, args.category);
      } else if (name === 'getDynamicRiskScore') {
        // Run standard risk score calculation and update DB
        responseData = await getDynamicRiskScoreService(args.accountId, true);
      } else if (name === 'detectChurnRisk') {
        responseData = await detectChurnRiskService(args.accountId);
      } else if (name === 'recommendRunbook') {
        responseData = await recommendRunbookService(args.ticketId, args.query);
      } else if (name === 'escalateAccount') {
        responseData = await escalateAccountService(args.accountId);
      } else if (name === 'simulateEvent') {
        responseData = await simulateEventService(args);
      } else if (name === 'resetDemoDatabase') {
        responseData = await resetDemoDatabaseService();
      } else {
        return NextResponse.json({
          jsonrpc: '2.0',
          error: { code: -32601, message: `Method '${name}' not found` },
          id: body.id || null
        }, { status: 404 });
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(responseData, null, 2)
            }
          ]
        },
        id: body.id || null
      });
    }

    return NextResponse.json({
      error: "Invalid MCP request. Expected 'tools/list' or 'tools/call' JSON-RPC method."
    }, { status: 400 });

  } catch (error: any) {
    console.error('Error in MCP server route:', error);
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: error.message || 'Internal error' },
      id: null
    }, { status: 500 });
  }
}

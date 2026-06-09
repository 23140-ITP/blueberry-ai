import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TOOLS = [
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
  }
];

export async function GET() {
  return NextResponse.json({ tools: TOOLS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, params } = body;

    // Handle standard MCP tools/list and tools/call
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

      const origin = new URL(request.url).origin;
      let responseData: any = null;

      if (name === 'getAccountContext') {
        const res = await fetch(`${origin}/api/tools/account-context?accountId=${args.accountId}`);
        responseData = await res.json();
      } else if (name === 'searchIssues') {
        const accountFilter = args.accountId ? `&accountId=${args.accountId}` : '';
        const res = await fetch(`${origin}/api/tools/search-issues?query=${encodeURIComponent(args.query)}${accountFilter}`);
        responseData = await res.json();
      } else if (name === 'writeHealthNote') {
        const res = await fetch(`${origin}/api/tools/write-note`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args)
        });
        responseData = await res.json();
      } else if (name === 'getAgentMemory') {
        const queryFilter = args.query ? `&query=${encodeURIComponent(args.query)}` : '';
        const res = await fetch(`${origin}/api/tools/agent-memory?accountId=${args.accountId}${queryFilter}`);
        responseData = await res.json();
      } else if (name === 'writeAgentMemory') {
        const res = await fetch(`${origin}/api/tools/agent-memory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args)
        });
        responseData = await res.json();
      } else if (name === 'getDynamicRiskScore') {
        const res = await fetch(`${origin}/api/tools/dynamic-risk?accountId=${args.accountId}`);
        responseData = await res.json();
      } else if (name === 'recommendRunbook') {
        const ticketParam = args.ticketId ? `ticketId=${args.ticketId}` : '';
        const queryParam = args.query ? `query=${encodeURIComponent(args.query)}` : '';
        const delim = ticketParam && queryParam ? '&' : '';
        const res = await fetch(`${origin}/api/tools/recommend-runbook?${ticketParam}${delim}${queryParam}`);
        responseData = await res.json();
      } else if (name === 'escalateAccount') {
        const res = await fetch(`${origin}/api/tools/escalate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args)
        });
        responseData = await res.json();
      } else if (name === 'simulateEvent') {
        const res = await fetch(`${origin}/api/tools/simulate-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args)
        });
        responseData = await res.json();
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

    // Default REST fallback if not strict JSON-RPC
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

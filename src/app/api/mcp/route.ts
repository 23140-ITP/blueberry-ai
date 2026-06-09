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

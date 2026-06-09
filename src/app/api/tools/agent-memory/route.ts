import { NextResponse } from 'next/server';
import { getElasticClient } from '@/lib/elastic';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const query = searchParams.get('query');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId parameter is required' }, { status: 400 });
    }

    const client = getElasticClient();

    let elasticQuery: any = {
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

    const memories = result.hits.hits.map(hit => ({
      _score: hit._score,
      ...(hit._source as any)
    }));

    return NextResponse.json({ memories });

  } catch (error: any) {
    console.error('Error in agent-memory tool GET:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, content, category = 'milestone' } = body;

    if (!accountId || !content) {
      return NextResponse.json({ error: 'accountId and content are required' }, { status: 400 });
    }

    const memoryId = `MEM-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const document = {
      memory_id: memoryId,
      account_id: accountId,
      content,
      category,
      created_at: createdAt
    };

    const client = getElasticClient();

    const response = await client.index({
      index: 'agent_memory',
      id: memoryId,
      document,
      refresh: true
    });

    return NextResponse.json({
      success: true,
      message: 'Agent memory logged successfully',
      memory: document,
      result: response.result
    });

  } catch (error: any) {
    console.error('Error in agent-memory tool POST:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

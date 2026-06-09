import { NextResponse } from 'next/server';
import { getAgentMemoryService, writeAgentMemoryService } from '@/lib/tool-services';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const query = searchParams.get('query') || undefined;

    if (!accountId) {
      return NextResponse.json({ error: 'accountId parameter is required' }, { status: 400 });
    }

    const memories = await getAgentMemoryService(accountId, query);
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

    const result = await writeAgentMemoryService(accountId, content, category);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in agent-memory tool POST:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

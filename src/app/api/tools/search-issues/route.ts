import { NextResponse } from 'next/server';
import { searchIssuesService } from '@/lib/tool-services';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const accountId = searchParams.get('accountId') || undefined;

    if (!query) {
      return NextResponse.json({ error: 'query parameter is required' }, { status: 400 });
    }

    const data = await searchIssuesService(query, accountId);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in search-issues tool:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

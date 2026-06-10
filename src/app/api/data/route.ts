import { NextResponse } from 'next/server';
import { getElasticClient } from '@/lib/elastic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const index = searchParams.get('index') || 'tickets';
    const accountId = searchParams.get('account_id');

    const client = getElasticClient();

    let query: any = { match_all: {} };
    if (accountId && accountId !== 'ALL') {
      query = { term: { account_id: accountId } };
    }

    const result = await client.search({
      index: index,
      query: query,
      size: 50,
      sort: [{ created_at: { order: 'desc', unmapped_type: 'date' } }]
    });

    const data = result.hits.hits.map(hit => hit._source);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching raw data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

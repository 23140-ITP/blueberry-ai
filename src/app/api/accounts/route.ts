import { NextResponse } from 'next/server';
import { getElasticClient } from '@/lib/elastic';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getElasticClient();
    const result = await client.search({
      index: 'accounts',
      query: {
        match_all: {}
      },
      size: 100
    });

    const accounts = result.hits.hits.map(hit => hit._source);
    
    // Sort accounts: At Risk and Critical first (higher risk score first)
    accounts.sort((a: any, b: any) => b.risk_score - a.risk_score);

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

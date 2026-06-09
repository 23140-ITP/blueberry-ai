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
      aggs: {
        industry_breakdown: {
          terms: {
            field: 'industry'
          },
          aggs: {
            avg_risk: {
              avg: {
                field: 'risk_score'
              }
            },
            total_arr: {
              sum: {
                field: 'arr'
              }
            }
          }
        }
      },
      size: 100
    });

    const accounts = result.hits.hits.map(hit => hit._source);
    
    // Sort accounts: At Risk and Critical first (higher risk score first)
    accounts.sort((a: any, b: any) => b.risk_score - a.risk_score);

    // Format the terms aggregations buckets for frontend visualization
    const aggregations = (result.aggregations as any)?.industry_breakdown?.buckets?.map((bucket: any) => ({
      industry: bucket.key,
      count: bucket.doc_count,
      avgRisk: bucket.avg_risk?.value || 0,
      totalArr: bucket.total_arr?.value || 0
    })) || [];

    return NextResponse.json({ accounts, aggregations });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

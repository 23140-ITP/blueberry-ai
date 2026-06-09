import { NextResponse } from 'next/server';
import { getPortfolioSummaryService } from '@/lib/tool-services';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getPortfolioSummaryService();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching portfolio summary:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

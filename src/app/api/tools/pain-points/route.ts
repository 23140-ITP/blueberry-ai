import { NextResponse } from 'next/server';
import { getPainPointsService } from '@/lib/tool-services';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clusters = await getPainPointsService();
    return NextResponse.json({
      success: true,
      clusters
    });
  } catch (error: any) {
    console.error('Error in pain points clustering endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

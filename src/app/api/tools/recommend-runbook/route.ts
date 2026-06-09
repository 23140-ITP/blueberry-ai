import { NextResponse } from 'next/server';
import { recommendRunbookService } from '@/lib/tool-services';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId') || undefined;
    const query = searchParams.get('query') || undefined;

    if (!ticketId && !query) {
      return NextResponse.json({ error: 'Either ticketId or query parameter is required' }, { status: 400 });
    }

    const data = await recommendRunbookService(ticketId, query);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in recommend-runbook tool:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

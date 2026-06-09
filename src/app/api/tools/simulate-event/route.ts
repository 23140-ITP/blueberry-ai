import { NextResponse } from 'next/server';
import { simulateEventService } from '@/lib/tool-services';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, accountId } = body;

    if (!type || !accountId) {
      return NextResponse.json({ error: 'type and accountId are required parameters' }, { status: 400 });
    }

    const data = await simulateEventService(body);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in event simulation endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

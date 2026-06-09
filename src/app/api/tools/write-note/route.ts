import { NextResponse } from 'next/server';
import { writeHealthNoteService } from '@/lib/tool-services';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, noteText, sentiment, author = 'Blueberry Copilot' } = body;

    if (!accountId || !noteText) {
      return NextResponse.json({ error: 'accountId and noteText are required' }, { status: 400 });
    }

    const data = await writeHealthNoteService(accountId, noteText, sentiment, author);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in write-note tool:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

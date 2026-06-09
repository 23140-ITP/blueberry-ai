import { NextResponse } from 'next/server';
import { getElasticClient } from '@/lib/elastic';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, noteText, sentiment, author = 'Blueberry Copilot' } = body;

    if (!accountId || !noteText || !sentiment) {
      return NextResponse.json({ error: 'accountId, noteText, and sentiment are required' }, { status: 400 });
    }

    const noteId = `N-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const document = {
      note_id: noteId,
      account_id: accountId,
      author,
      note_text: noteText,
      sentiment,
      created_at: createdAt
    };

    const client = getElasticClient();

    const response = await client.index({
      index: 'health_notes',
      id: noteId,
      document,
      refresh: true // Refresh to ensure it shows up in subsequent searches immediately
    });

    return NextResponse.json({
      success: true,
      message: 'Health note written to Elasticsearch successfully',
      note: document,
      result: response.result
    });

  } catch (error: any) {
    console.error('Error in write-note tool:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


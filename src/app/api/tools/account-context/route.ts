import { NextResponse } from 'next/server';
import { getElasticClient } from '@/lib/elastic';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId parameter is required' }, { status: 400 });
    }

    const client = getElasticClient();

    // 1. Fetch Account Details
    const accountResult = await client.search({
      index: 'accounts',
      query: {
        term: { account_id: accountId }
      }
    });

    if (accountResult.hits.hits.length === 0 || !accountResult.hits.hits[0]) {
      return NextResponse.json({ error: `Account with ID ${accountId} not found` }, { status: 404 });
    }

    const account = accountResult.hits.hits[0]._source;

    // 2. Fetch Tickets
    const ticketsResult = await client.search({
      index: 'tickets',
      query: {
        term: { account_id: accountId }
      },
      size: 50
    });
    const tickets = ticketsResult.hits.hits.map(hit => hit._source);

    // 3. Fetch Health Notes
    const notesResult = await client.search({
      index: 'health_notes',
      query: {
        term: { account_id: accountId }
      },
      size: 50
    });
    const healthNotes = notesResult.hits.hits.map(hit => hit._source);

    // 4. Fetch Call Transcripts
    const transcriptsResult = await client.search({
      index: 'call_transcripts',
      query: {
        term: { account_id: accountId }
      },
      size: 50
    });
    const callTranscripts = transcriptsResult.hits.hits.map(hit => hit._source);

    return NextResponse.json({
      account,
      tickets,
      healthNotes,
      callTranscripts
    });

  } catch (error: any) {
    console.error('Error in account-context tool:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getElasticClient } from '@/lib/elastic';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const accountId = searchParams.get('accountId') || undefined;

    if (!query) {
      return NextResponse.json({ error: 'query parameter is required' }, { status: 400 });
    }

    const client = getElasticClient();

    // 1. Search Tickets (semantically searching subject and description)
    const ticketsQuery = accountId
      ? {
          bool: {
            must: [
              { term: { account_id: accountId } }
            ],
            should: [
              { match: { subject: { query } } },
              { match: { description: { query } } }
            ],
            minimum_should_match: 1
          }
        }
      : {
          bool: {
            should: [
              { match: { subject: { query } } },
              { match: { description: { query } } }
            ],
            minimum_should_match: 1
          }
        };

    const ticketsResult = await client.search({
      index: 'tickets',
      query: ticketsQuery,
      size: 5
    });
    const tickets = ticketsResult.hits.hits.map(hit => ({
      _score: hit._score,
      ...(hit._source as any)
    }));

    // 2. Search Call Transcripts (semantically searching transcript and summary)
    const transcriptsQuery = accountId
      ? {
          bool: {
            must: [
              { term: { account_id: accountId } }
            ],
            should: [
              { match: { transcript: { query } } },
              { match: { summary: { query } } }
            ],
            minimum_should_match: 1
          }
        }
      : {
          bool: {
            should: [
              { match: { transcript: { query } } },
              { match: { summary: { query } } }
            ],
            minimum_should_match: 1
          }
        };

    const transcriptsResult = await client.search({
      index: 'call_transcripts',
      query: transcriptsQuery,
      size: 5
    });
    const transcripts = transcriptsResult.hits.hits.map(hit => ({
      _score: hit._score,
      ...(hit._source as any)
    }));

    // 3. Search Health Notes (semantically searching note_text)
    const notesQuery = accountId
      ? {
          bool: {
            must: [
              { term: { account_id: accountId } },
              { match: { note_text: { query } } }
            ]
          }
        }
      : {
          match: { note_text: { query } }
        };

    const notesResult = await client.search({
      index: 'health_notes',
      query: notesQuery,
      size: 5
    });
    const healthNotes = notesResult.hits.hits.map(hit => ({
      _score: hit._score,
      ...(hit._source as any)
    }));

    return NextResponse.json({
      tickets,
      transcripts,
      healthNotes
    });

  } catch (error: any) {
    console.error('Error in search-issues tool:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


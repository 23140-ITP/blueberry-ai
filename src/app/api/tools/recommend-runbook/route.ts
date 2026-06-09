import { NextResponse } from 'next/server';
import { getElasticClient } from '@/lib/elastic';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const query = searchParams.get('query');

    if (!ticketId && !query) {
      return NextResponse.json({ error: 'Either ticketId or query parameter is required' }, { status: 400 });
    }

    const client = getElasticClient();
    let queryText = '';
    let ticketDetail = null;

    // 1. If ticketId is provided, fetch ticket metadata to compile the query context
    if (ticketId) {
      const ticketResult = await client.search({
        index: 'tickets',
        query: { term: { ticket_id: ticketId } }
      });

      if (ticketResult.hits.hits.length > 0 && ticketResult.hits.hits[0]) {
        const ticket: any = ticketResult.hits.hits[0]._source;
        ticketDetail = ticket;
        queryText = `Subject: ${ticket.subject}. Description: ${ticket.description}`;
      } else {
        return NextResponse.json({ error: `Ticket with ID ${ticketId} not found` }, { status: 404 });
      }
    } else {
      queryText = query as string;
    }

    // 2. Perform semantic search over the knowledge_base index
    // Using the 'semantic_text' field mapped on the content
    const searchResult = await client.search({
      index: 'knowledge_base',
      query: {
        semantic: {
          field: 'content',
          query: queryText
        }
      },
      size: 1
    });

    if (searchResult.hits.hits.length > 0 && searchResult.hits.hits[0]) {
      const match = searchResult.hits.hits[0];
      const runbook: any = match._source;
      const score = match._score || 0;

      return NextResponse.json({
        success: true,
        ticket: ticketDetail,
        queryText,
        runbook: {
          runbookId: runbook.runbook_id,
          title: runbook.title,
          content: runbook.content,
          category: runbook.category
        },
        relevanceScore: Math.round(score * 100)
      });
    }

    return NextResponse.json({
      success: false,
      message: 'No matching runbook found in the knowledge base.'
    });

  } catch (error: any) {
    console.error('Error in recommend-runbook tool:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

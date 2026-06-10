import { NextResponse } from 'next/server';
import { getElasticClient } from '@/lib/elastic';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const mode = searchParams.get('mode') || 'hybrid';

    if (!q || !q.trim()) {
      return NextResponse.json({ matches: {} });
    }

    const client = getElasticClient();

    // Build query based on selected mode
    let queryObj: any = {};
    if (mode === 'keyword') {
      queryObj = {
        bool: {
          should: [
            { match: { company_name: { query: q } } },
            { match: { subject: { query: q } } },
            { match: { description: { query: q } } },
            { match: { note_text: { query: q } } },
            { match: { transcript: { query: q } } },
            { match: { summary: { query: q } } }
          ]
        }
      };
    } else if (mode === 'vector') {
      queryObj = {
        bool: {
          should: [
            { semantic: { field: 'subject', query: q } },
            { semantic: { field: 'description', query: q } },
            { semantic: { field: 'note_text', query: q } },
            { semantic: { field: 'transcript', query: q } },
            { semantic: { field: 'summary', query: q } }
          ]
        }
      };
    } else {
      // Hybrid mode combining BM25 keyword matching and dense vector semantic matches
      queryObj = {
        bool: {
          should: [
            // Keyword matches
            { match: { company_name: { query: q, boost: 2.0 } } },
            { match: { subject: { query: q, boost: 0.5 } } },
            { match: { description: { query: q, boost: 0.5 } } },
            { match: { note_text: { query: q, boost: 0.5 } } },
            { match: { transcript: { query: q, boost: 0.5 } } },
            { match: { summary: { query: q, boost: 0.5 } } },
            // Vector/Semantic matches
            { semantic: { field: 'subject', query: q, boost: 1.5 } },
            { semantic: { field: 'description', query: q, boost: 1.5 } },
            { semantic: { field: 'note_text', query: q, boost: 1.5 } },
            { semantic: { field: 'transcript', query: q, boost: 1.5 } },
            { semantic: { field: 'summary', query: q, boost: 1.5 } }
          ]
        }
      };
    }

    let searchResult: any = null;
    try {
      searchResult = await client.search({
        index: ['accounts', 'tickets', 'health_notes', 'call_transcripts'],
        query: queryObj,
        highlight: {
          fields: {
            company_name: {},
            subject: {},
            description: {},
            note_text: {},
            transcript: {},
            summary: {}
          },
          pre_tags: ['<mark style="background: rgba(59,130,246,0.35); color: #60a5fa; padding: 2px 4px; border-radius: 4px; font-weight: 600; border: 1px solid rgba(59,130,246,0.5);">'],
          post_tags: ['</mark>']
        },
        size: 50
      });
    } catch (searchErr) {
      console.log(`Failed query with mode ${mode}, falling back to keyword search:`, searchErr);
      const fallbackQuery = {
        bool: {
          should: [
            { match: { subject: { query: q } } },
            { match: { description: { query: q } } },
            { match: { note_text: { query: q } } },
            { match: { transcript: { query: q } } },
            { match: { summary: { query: q } } }
          ]
        }
      };
      searchResult = await client.search({
        index: ['accounts', 'tickets', 'health_notes', 'call_transcripts'],
        query: fallbackQuery,
        highlight: {
          fields: {
            company_name: {},
            subject: {},
            description: {},
            note_text: {},
            transcript: {},
            summary: {}
          },
          pre_tags: ['<mark style="background: rgba(59,130,246,0.35); color: #60a5fa; padding: 2px 4px; border-radius: 4px; font-weight: 600; border: 1px solid rgba(59,130,246,0.5);">'],
          post_tags: ['</mark>']
        },
        size: 50
      });
    }

    // Group matching records by account_id to filter the main radar dashboard
    const matches: Record<string, {
      relevanceScore: number;
      matchReason: string;
      matchType: string;
    }> = {};

    const maxScore = searchResult.hits.max_score || 1;

    searchResult.hits.hits.forEach((hit: any) => {
      const source = hit._source;
      let accountId = source.account_id;
      if (!accountId) return;

      // Calculate relative relevance percentage (0-100%)
      const scorePct = Math.min(100, Math.round((hit._score / maxScore) * 100));

      // Extract high-scoring highlighted snippet
      let snippet = '';
      let type = 'note';

      if (hit.highlight) {
        const highlights = Object.values(hit.highlight)[0] as string[];
        if (highlights && highlights.length > 0) {
          snippet = highlights[0];
        }
      }

      if (hit._index.includes('accounts')) {
        type = 'account';
        accountId = source.account_id;
        if (!snippet) snippet = `Account Match: ${source.company_name}`;
      } else if (hit._index.includes('tickets')) {
        type = 'ticket';
        if (!snippet) snippet = `Ticket: ${source.subject}`;
      } else if (hit._index.includes('health_notes')) {
        type = 'note';
        if (!snippet) snippet = `CSM Note: ${source.note_text}`;
      } else if (hit._index.includes('call_transcripts')) {
        type = 'call';
        if (!snippet) snippet = `Call Summary: ${source.summary}`;
      }

      // Keep only the highest matching score relevance per account
      if (!matches[accountId] || matches[accountId].relevanceScore < scorePct) {
        matches[accountId] = {
          relevanceScore: scorePct,
          matchReason: snippet,
          matchType: type
        };
      }
    });

    return NextResponse.json({ matches });

  } catch (error: any) {
    console.error('Error in semantic accounts search:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

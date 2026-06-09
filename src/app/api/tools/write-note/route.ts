import { NextResponse } from 'next/server';
import { getElasticClient } from '@/lib/elastic';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, noteText, sentiment, author = 'Blueberry Copilot' } = body;

    if (!accountId || !noteText) {
      return NextResponse.json({ error: 'accountId and noteText are required' }, { status: 400 });
    }

    const client = getElasticClient();

    // Determine sentiment using Elastic Inference Service (EIS) or fallback logic
    let detectedSentiment = sentiment;
    if (!detectedSentiment) {
      try {
        // Attempt to call Elastic Inference Service (EIS) sentiment-analysis-model
        const eisResponse: any = await client.transport.request({
          method: 'POST',
          path: '/_inference/text_classification/sentiment-analysis-model',
          body: {
            input: noteText
          }
        });
        if (eisResponse && eisResponse.results && eisResponse.results[0]) {
          detectedSentiment = eisResponse.results[0].predicted_value;
        }
      } catch (err) {
        console.log("Elastic Inference Service (EIS) model not deployed. Falling back to local NLP heuristics...");
        const textLower = noteText.toLowerCase();
        if (
          textLower.includes('angry') || 
          textLower.includes('furious') || 
          textLower.includes('churn') || 
          textLower.includes('crash') || 
          textLower.includes('fail') || 
          textLower.includes('bad') || 
          textLower.includes('terrible') || 
          textLower.includes('leave') ||
          textLower.includes('frustrated')
        ) {
          detectedSentiment = 'Negative';
        } else if (
          textLower.includes('happy') || 
          textLower.includes('love') || 
          textLower.includes('great') || 
          textLower.includes('good') || 
          textLower.includes('awesome') || 
          textLower.includes('success') ||
          textLower.includes('excellent')
        ) {
          detectedSentiment = 'Positive';
        } else {
          detectedSentiment = 'Neutral';
        }
      }
    }

    const noteId = `N-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const document = {
      note_id: noteId,
      account_id: accountId,
      author,
      note_text: noteText,
      sentiment: detectedSentiment || 'Neutral',
      created_at: createdAt
    };

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


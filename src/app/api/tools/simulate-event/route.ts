import { NextResponse } from 'next/server';
import { getElasticClient } from '@/lib/elastic';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, accountId } = body;

    if (!type || !accountId) {
      return NextResponse.json({ error: 'type and accountId are required parameters' }, { status: 400 });
    }

    const client = getElasticClient();
    const timestamp = new Date().toISOString();
    let indexedDoc: any = null;
    let indexName = '';
    let docId = '';

    // 1. Ingest based on event type
    if (type === 'ticket') {
      const { subject, description, priority = 'Medium', status = 'Open' } = body;
      if (!subject || !description) {
        return NextResponse.json({ error: 'subject and description are required for ticket simulation' }, { status: 400 });
      }

      indexName = 'tickets';
      docId = `TKT-${Date.now().toString().slice(-4)}`;
      indexedDoc = {
        ticket_id: docId,
        account_id: accountId,
        subject,
        description,
        priority,
        status,
        created_at: timestamp
      };

    } else if (type === 'call') {
      const { transcript, summary, durationMinutes = 15 } = body;
      if (!transcript || !summary) {
        return NextResponse.json({ error: 'transcript and summary are required for call simulation' }, { status: 400 });
      }

      indexName = 'call_transcripts';
      docId = `C-${Date.now().toString().slice(-4)}`;
      indexedDoc = {
        call_id: docId,
        account_id: accountId,
        transcript,
        summary,
        duration_minutes: Number(durationMinutes),
        date: timestamp
      };

    } else if (type === 'note') {
      const { noteText, author = 'Sarah (CSM)' } = body;
      if (!noteText) {
        return NextResponse.json({ error: 'noteText is required for CSM note simulation' }, { status: 400 });
      }

      // Simulate sentiment analysis (Elastic Inference Service model simulator)
      const negativeWords = ['churn', 'angry', 'terrible', 'crash', 'timeout', 'cancel', 'frustrated', 'leave', 'competitor', 'broken'];
      const positiveWords = ['happy', 'love', 'great', 'awesome', 'solved', 'fixed', 'thank', 'delighted', 'renew', 'expansion'];
      
      const lowerText = noteText.toLowerCase();
      let sentiment = 'Neutral';
      
      if (negativeWords.some(w => lowerText.includes(w))) {
        sentiment = 'Negative';
      } else if (positiveWords.some(w => lowerText.includes(w))) {
        sentiment = 'Positive';
      }

      indexName = 'health_notes';
      docId = `N-${Date.now().toString().slice(-4)}`;
      indexedDoc = {
        note_id: docId,
        account_id: accountId,
        author,
        note_text: noteText,
        sentiment,
        created_at: timestamp
      };

    } else {
      return NextResponse.json({ error: `Invalid type '${type}'. Must be ticket, call, or note` }, { status: 400 });
    }

    // 2. Index the new document
    await client.index({
      index: indexName,
      id: docId,
      document: indexedDoc
    });

    // 3. Trigger dynamic risk recalculation to propagate changes instantly to accounts index
    let newRiskScore = null;
    let newStatus = null;
    try {
      const origin = new URL(request.url).origin;
      const calcRes = await fetch(`${origin}/api/tools/dynamic-risk?accountId=${accountId}`);
      if (calcRes.ok) {
        const calcData = await calcRes.json();
        newRiskScore = calcData.dynamicRiskScore;
        newStatus = calcData.status;
      }
    } catch (err) {
      console.error('Failed to trigger automatic risk re-computation:', err);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully simulated and indexed ${type} event.`,
      document: indexedDoc,
      healthUpdate: {
        accountId,
        newRiskScore,
        newStatus
      }
    });

  } catch (error: any) {
    console.error('Error in event simulation endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

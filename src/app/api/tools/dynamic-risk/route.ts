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

    // 1. Fetch account basics
    const accountResult = await client.search({
      index: 'accounts',
      query: { term: { account_id: accountId } }
    });

    if (accountResult.hits.hits.length === 0 || !accountResult.hits.hits[0]) {
      return NextResponse.json({ error: `Account ${accountId} not found` }, { status: 404 });
    }

    const accountDoc: any = accountResult.hits.hits[0]._source;

    // 2. Query tickets via ES|QL
    let openTicketsCount = 0;
    let urgentCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    try {
      const ticketsEsql: any = await client.esql.query({
        query: `FROM tickets | WHERE account_id == "${accountId}" AND status == "Open" | STATS count(ticket_id) by priority`
      });

      if (ticketsEsql && ticketsEsql.values) {
        for (const row of ticketsEsql.values) {
          const priority = row[0];
          const count = Number(row[1]);
          openTicketsCount += count;
          if (priority === 'Urgent') urgentCount += count;
          else if (priority === 'High') highCount += count;
          else if (priority === 'Medium') mediumCount += count;
          else if (priority === 'Low') lowCount += count;
        }
      }
    } catch (e) {
      console.error('ES|QL tickets query failed, falling back to search:', e);
      // Fallback in case ES|QL has formatting errors
      const fallbackTickets = await client.search({
        index: 'tickets',
        query: {
          bool: {
            must: [
              { term: { account_id: accountId } },
              { term: { status: 'Open' } }
            ]
          }
        }
      });
      openTicketsCount = fallbackTickets.hits.hits.length;
      fallbackTickets.hits.hits.forEach((hit: any) => {
        const priority = hit._source.priority;
        if (priority === 'Urgent') urgentCount++;
        else if (priority === 'High') highCount++;
        else if (priority === 'Medium') mediumCount++;
        else if (priority === 'Low') lowCount++;
      });
    }

    // 3. Query notes via ES|QL
    let negativeNotes = 0;
    let positiveNotes = 0;
    let neutralNotes = 0;

    try {
      const notesEsql: any = await client.esql.query({
        query: `FROM health_notes | WHERE account_id == "${accountId}" | STATS count(note_id) by sentiment`
      });

      if (notesEsql && notesEsql.values) {
        for (const row of notesEsql.values) {
          const sentiment = row[0];
          const count = Number(row[1]);
          if (sentiment === 'Negative') negativeNotes += count;
          else if (sentiment === 'Positive') positiveNotes += count;
          else if (sentiment === 'Neutral') neutralNotes += count;
        }
      }
    } catch (e) {
      console.error('ES|QL notes query failed, falling back to search:', e);
      const fallbackNotes = await client.search({
        index: 'health_notes',
        query: { term: { account_id: accountId } }
      });
      fallbackNotes.hits.hits.forEach((hit: any) => {
        const sentiment = hit._source.sentiment;
        if (sentiment === 'Negative') negativeNotes++;
        else if (sentiment === 'Positive') positiveNotes++;
        else if (sentiment === 'Neutral') neutralNotes++;
      });
    }

    // 4. Calculate dynamic risk score
    let score = 0.05; // 5% baseline risk
    const factors: any[] = [];

    // Ticket contributions
    if (openTicketsCount > 0) {
      const ticketRisk = (urgentCount * 0.35) + (highCount * 0.15) + (mediumCount * 0.05) + (lowCount * 0.01);
      score += ticketRisk;
      factors.push({
        name: 'Active Support Tickets',
        value: `${openTicketsCount} open tickets (${urgentCount} Urgent, ${highCount} High)`,
        riskAdded: Math.round(ticketRisk * 100)
      });
    }

    // Health note sentiment contributions
    if (negativeNotes > 0) {
      const negRisk = Math.min(0.50, negativeNotes * 0.25);
      score += negRisk;
      factors.push({
        name: 'Negative Sentiment Reports',
        value: `${negativeNotes} negative indicators logged`,
        riskAdded: Math.round(negRisk * 100)
      });
    }

    if (positiveNotes > 0) {
      const posOffset = -Math.min(0.30, positiveNotes * 0.15);
      score += posOffset;
      factors.push({
        name: 'Positive Customer Check-ins',
        value: `${positiveNotes} positive check-ins logged`,
        riskAdded: Math.round(posOffset * 100)
      });
    }

    // Check last contact age
    const lastContactTime = new Date(accountDoc.last_contact_date).getTime();
    const daysSinceContact = Math.floor((Date.now() - lastContactTime) / (1000 * 60 * 60 * 24));
    if (daysSinceContact > 20) {
      const contactRisk = 0.15;
      score += contactRisk;
      factors.push({
        name: 'CSM Contact Latency',
        value: `No contact in ${daysSinceContact} days`,
        riskAdded: Math.round(contactRisk * 100)
      });
    }

    // Clamp score between 0.02 and 0.99
    const finalScore = Math.min(0.99, Math.max(0.02, score));
    const formattedScore = parseFloat(finalScore.toFixed(2));

    // Update parent account index to reflect the dynamic calculations
    const finalStatus = formattedScore >= 0.75 ? 'Critical' : formattedScore >= 0.25 ? 'At Risk' : 'Active';
    
    await client.update({
      index: 'accounts',
      id: accountId,
      doc: {
        risk_score: formattedScore,
        status: finalStatus
      }
    });

    return NextResponse.json({
      accountId,
      companyName: accountDoc.company_name,
      dynamicRiskScore: formattedScore,
      status: finalStatus,
      factors
    });

  } catch (error: any) {
    console.error('Error calculating dynamic risk:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

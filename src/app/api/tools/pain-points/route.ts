import { NextResponse } from 'next/server';
import { getElasticClient } from '@/lib/elastic';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getElasticClient();

    // 1. Fetch all accounts to build a lookup map for ARR and company name
    const accountsResult = await client.search({
      index: 'accounts',
      query: { match_all: {} },
      size: 100
    });
    
    const accountsMap: Record<string, { companyName: string; arr: number }> = {};
    accountsResult.hits.hits.forEach((hit: any) => {
      const acc = hit._source;
      accountsMap[acc.account_id] = {
        companyName: acc.company_name,
        arr: acc.arr
      };
    });

    // 2. Fetch all open tickets
    const ticketsResult = await client.search({
      index: 'tickets',
      query: { term: { status: 'Open' } },
      size: 100
    });
    const tickets = ticketsResult.hits.hits.map((hit: any) => hit._source);

    // 3. Define Pain-Point Categories and keywords
    const categories = [
      {
        id: 'export',
        name: 'Data Export & Reports',
        keywords: ['export', 'report', 'timeout', 'csv', 'excel', 'crash', 'timeout', 'board meeting'],
        description: 'Timeouts and crashes encountered during monthly dashboard or data export operations.',
        count: 0,
        arrAtRisk: 0,
        affectedAccounts: new Set<string>()
      },
      {
        id: 'sso',
        name: 'SSO & Okta Authentication',
        keywords: ['sso', 'okta', 'login', 'forbidden', 'password', 'authenticate', '403'],
        description: 'Authentication failures, Okta configuration bugs, and Single Sign-On lockout alerts.',
        count: 0,
        arrAtRisk: 0,
        affectedAccounts: new Set<string>()
      },
      {
        id: 'api',
        name: 'API Rate Limits & Throttling',
        keywords: ['rate limit', 'api', 'quota', 'requests', 'throttle', 'limit too low'],
        description: 'Customers hitting rate limit blockages on transactional or synchronization APIs.',
        count: 0,
        arrAtRisk: 0,
        affectedAccounts: new Set<string>()
      },
      {
        id: 'other',
        name: 'Setup & Usability Queries',
        keywords: [], // Catch-all fallback
        description: 'Administrative requests, onboarding questions, and UI usability queries.',
        count: 0,
        arrAtRisk: 0,
        affectedAccounts: new Set<string>()
      }
    ];

    // 4. Cluster tickets into categories
    tickets.forEach((t: any) => {
      const subject = (t.subject || '').toLowerCase();
      const description = (t.description || '').toLowerCase();
      const text = `${subject} ${description}`;

      let matched = false;
      for (const cat of categories) {
        if (cat.id !== 'other' && cat.keywords.some(word => text.includes(word))) {
          cat.count++;
          cat.affectedAccounts.add(t.account_id);
          matched = true;
          break;
        }
      }

      if (!matched) {
        const otherCat = categories.find(c => c.id === 'other');
        if (otherCat) {
          otherCat.count++;
          otherCat.affectedAccounts.add(t.account_id);
        }
      }
    });

    // 5. Calculate financial impact (ARR at risk) for each category
    const clusters = categories.map(cat => {
      let arrSum = 0;
      const accountNames: string[] = [];
      
      cat.affectedAccounts.forEach(accId => {
        const accInfo = accountsMap[accId];
        if (accInfo) {
          arrSum += accInfo.arr;
          accountNames.push(accInfo.companyName);
        }
      });

      return {
        id: cat.id,
        category: cat.name,
        description: cat.description,
        count: cat.count,
        arrAtRisk: arrSum,
        accounts: accountNames
      };
    });

    // Sort clusters: highest ARR at Risk first
    clusters.sort((a, b) => b.arrAtRisk - a.arrAtRisk);

    return NextResponse.json({
      success: true,
      clusters
    });

  } catch (error: any) {
    console.error('Error in pain points clustering endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

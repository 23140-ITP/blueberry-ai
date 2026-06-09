import { NextResponse } from 'next/server';
import { getAccountContextService } from '@/lib/tool-services';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId parameter is required' }, { status: 400 });
    }

    const data = await getAccountContextService(accountId);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in account-context tool:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

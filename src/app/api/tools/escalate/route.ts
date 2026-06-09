import { NextResponse } from 'next/server';
import { escalateAccountService } from '@/lib/tool-services';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json({ error: 'accountId parameter is required in request body' }, { status: 400 });
    }

    const data = await escalateAccountService(accountId);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in account escalation endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

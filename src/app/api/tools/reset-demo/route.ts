import { NextResponse } from 'next/server';
import { resetDemoDatabaseService } from '@/lib/tool-services';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await resetDemoDatabaseService();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error resetting demo database:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

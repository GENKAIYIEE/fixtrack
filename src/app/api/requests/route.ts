import { getActiveSession } from '@/lib/auth/access';
import { NextResponse } from 'next/server'

export async function GET() {
  if (!await getActiveSession(['STUDENT'])) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ message: 'Requests API route' })
}

export async function POST() {
  if (!await getActiveSession(['STUDENT'])) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ message: 'Requests API route' })
}

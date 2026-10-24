import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth/access';
export async function POST() {
  const session = await getActiveSession();
  if (!session?.user) return NextResponse.json({ message: 'Sign in with an approved account to continue.' }, { status: 401 });
  return NextResponse.json({ role: session.user.role });
}

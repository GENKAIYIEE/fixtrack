import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { accountMessage, isProtectedApi, portalForRole, requiredRouteRole } from '@/lib/auth/account-policy';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const api = isProtectedApi(path), role = requiredRouteRole(path);
  const authPage = path === '/login' || path === '/register';
  if (!api && !role && !authPage) return NextResponse.next();
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    if (api) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    if (role) return NextResponse.redirect(new URL('/login', request.url));
    return NextResponse.next();
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: token.id }, select: { role: true, accountStatus: true, verificationRejectionReason: true } });
    if (!user || user.accountStatus !== 'ACTIVE') {
      if (api) return NextResponse.json({ error: accountMessage(user?.accountStatus || '', user?.verificationRejectionReason).message }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
      return NextResponse.redirect(new URL('/account-status', request.url));
    }
    if (authPage) return NextResponse.redirect(new URL(portalForRole(user.role), request.url));
    if (role && role !== user.role) {
      if (api) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
      return NextResponse.redirect(new URL(portalForRole(user.role), request.url));
    }
    return NextResponse.next();
  } catch {
    // Database outages must not turn stale tokens into authorization.
    return api ? NextResponse.json({ error: 'Account access could not be verified. Please retry.' }, { status: 503 })
      : new NextResponse('Account access could not be verified. Please retry shortly.', { status: 503 });
  }
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { UserRole } from '@prisma/client';
/** Route-level guard, independent of proxy/token claims. No active-user cache. */
export async function getActiveSession(roles?: readonly UserRole[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: {
    id: true, email: true, firstName: true, lastName: true, role: true, specialization: true, accountStatus: true,
  } });
  if (!user || user.accountStatus !== 'ACTIVE' || (roles && !roles.includes(user.role))) return null;
  return { ...session, user: { ...session.user, ...user } };
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authUser = session?.user;

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (role) where.role = role;
    if (status) where.accountStatus = status;

    const users = await prisma.user.findMany({
      where,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        department: true,
        specialization: true,
        avatarUrl: true,
        accountStatus: true,
        _count: {
          select: {
            assignedRequests: {
              where: { status: 'ONGOING' }
            }
          }
        }
      },
      orderBy: { firstName: 'asc' }
    });

    // Format the count for the frontend which might expect tech.activeTaskCount or tech._count.assignedRequests
    const formattedUsers = users.map(user => ({
      ...user,
      activeTaskCount: user._count.assignedRequests
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('[GET /api/users]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

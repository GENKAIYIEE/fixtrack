import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = session.user.id;

    const [
      statusCounts,
      recentRequests,
      recentNotifications,
      unreadCount,
      student,
    ] = await Promise.all([
      prisma.maintenanceRequest.groupBy({
        by: ['status'],
        where: { submittedById: studentId },
        _count: { status: true },
      }),
      prisma.maintenanceRequest.findMany({
        where: { submittedById: studentId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          requestCode: true,
          issueType: true,
          building: true,
          roomNumber: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.notification.findMany({
        where: { userId: studentId },
        take: 3,
        orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.notification.count({
        where: { userId: studentId, isRead: false },
      }),
      prisma.user.findUnique({
        where: { id: studentId },
        select: { firstName: true, department: true }
      }),
    ]);

    const pendingCount = statusCounts.find(s => s.status === 'PENDING')?._count.status || 0;
    const ongoingCount = statusCounts.find(s => s.status === 'ONGOING')?._count.status || 0;
    const completedCount = statusCounts.find(s => s.status === 'COMPLETED')?._count.status || 0;
    const totalRequests = statusCounts.reduce((acc, curr) => acc + curr._count.status, 0);

    return NextResponse.json({
      student,
      kpis: { totalRequests, pendingCount, ongoingCount, completedCount },
      recentRequests,
      recentNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error('[user/dashboard] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

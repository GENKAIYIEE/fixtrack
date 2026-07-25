import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const technicianId = session.user.id;

    const [unreadNotifications, activeTasks] = await Promise.all([
      prisma.notification.count({
        where: { userId: technicianId, isRead: false },
      }),
      prisma.maintenanceRequest.count({
        where: {
          assignedToId: technicianId,
          status: { in: ['ONGOING', 'PENDING'] }
        }
      })
    ]);

    return NextResponse.json({
      notifications: unreadNotifications,
      tasks: activeTasks
    });

  } catch (error) {
    console.error('Error fetching technician badges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

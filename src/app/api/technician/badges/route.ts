import { requireTechnicianHead, workflowErrorResponse } from '@/lib/requests/assignment';
import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth/access';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getActiveSession(['TECHNICIAN']);
    if (!session?.user || session.user.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const technicianId = (await requireTechnicianHead(session.user.id)).id;

    const [unreadNotifications, activeTasks] = await Promise.all([
      prisma.notification.count({
        where: { userId: technicianId, isRead: false },
      }),
      prisma.maintenanceRequest.count({
        where: {
          assignedToId: technicianId,
          status: { in: ['ONGOING', 'ON_HOLD'] }
        }
      })
    ]);

    return NextResponse.json({
      notifications: unreadNotifications,
      tasks: activeTasks
    });

  } catch (error) {
    return workflowErrorResponse(error);
  }
}

import { requireTechnicianHead, workflowErrorResponse } from '@/lib/requests/assignment';
import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth/access';
// FIXED: MINOR #5 — Standardized to default import for consistency with all other routes
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getActiveSession(['TECHNICIAN']);
    const authUser = session?.user;

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await requireTechnicianHead(authUser.id);
    const technicianId = dbUser.id;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalAssigned,
      ongoing,
      onHold,
      completedToday,
      completedThisMonth,
      activeTasks,
      urgentTask,
    ] = await Promise.all([
      prisma.maintenanceRequest.count({
        where: { assignedToId: technicianId },
      }),
      prisma.maintenanceRequest.count({
        where: { assignedToId: technicianId, status: 'ONGOING' },
      }),
      prisma.maintenanceRequest.count({
        where: { assignedToId: technicianId, status: 'ON_HOLD' },
      }),
      prisma.maintenanceRequest.count({
        where: {
          assignedToId: technicianId,
          status: 'COMPLETED',
          completedAt: { gte: startOfToday },
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          assignedToId: technicianId,
          status: 'COMPLETED',
          completedAt: { gte: startOfMonth },
        },
      }),
      prisma.maintenanceRequest.findMany({
        where: { assignedToId: technicianId, status: { in: ['ONGOING', 'ON_HOLD'] } },
        take: 4,
        orderBy: [{ assignedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        include: {
          submitter: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.maintenanceRequest.findFirst({
        where: {
          assignedToId: technicianId,
          status: { in: ['ONGOING', 'ON_HOLD'] },
          priorityLevel: 'URGENT',
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      kpis: { totalAssigned, ongoing, onHold, completedToday, completedThisMonth },
      activeTasks,
      urgentTask,
      technician: {
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        specialization: dbUser.specialization,
      },
    });
  } catch (error) {
    return workflowErrorResponse(error);
  }
}

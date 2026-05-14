import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// FIXED: MINOR #5 — Standardized to default import for consistency with all other routes
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authUser = session?.user;

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        specialization: true,
      },
    });

    // FIXED: MINOR #1 — Corrected HTTP status from 401 to 403 for authenticated role mismatch
    if (!dbUser || dbUser.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const technicianId = dbUser.id;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalAssigned,
      ongoing,
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
        where: { assignedToId: technicianId, status: 'ONGOING' },
        take: 4,
        orderBy: [{ urgencyLevel: 'desc' }, { createdAt: 'asc' }],
        include: {
          submitter: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.maintenanceRequest.findFirst({
        where: {
          assignedToId: technicianId,
          status: { in: ['ONGOING', 'PENDING'] },
          urgencyLevel: 'URGENT',
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      kpis: { totalAssigned, ongoing, completedToday, completedThisMonth },
      activeTasks,
      urgentTask,
      technician: {
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        specialization: dbUser.specialization,
      },
    });
  } catch (error) {
    console.error('[GET /api/technician/dashboard]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

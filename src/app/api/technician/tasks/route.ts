import { requireTechnicianHead, workflowErrorResponse } from '@/lib/requests/assignment';
import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth/access';
import prisma from '@/lib/prisma';
import { RequestStatus, PriorityLevel, Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getActiveSession(['TECHNICIAN']);
    if (!session || session.user.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const date = searchParams.get('date') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const technicianId = (await requireTechnicianHead(session.user.id)).id;

    const where: Prisma.MaintenanceRequestWhereInput = {
      assignedToId: technicianId,
      ...(search && {
        OR: [
          { requestCode: { contains: search, mode: 'insensitive' } },
          { roomNumber: { contains: search, mode: 'insensitive' } },
          { workLocation: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(status && { status: status as RequestStatus }),
      ...(priority && { priorityLevel: priority as PriorityLevel }),
      ...(date && {
        assignedAt: {
          gte: new Date(date),
          lte: new Date(new Date(date).setHours(23, 59, 59, 999))
        }
      })
    };

    const [tasks, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ priorityLevel: 'desc' }, { assignedAt: 'desc' }],
        include: {
          submitter: { select: { firstName: true, lastName: true } }
        }
      }),
      prisma.maintenanceRequest.count({ where })
    ]);

    // Count active tasks (ONGOING + PENDING) for badge
    const activeCount = await prisma.maintenanceRequest.count({
      where: {
        assignedToId: technicianId,
        status: { in: ['ONGOING', 'ON_HOLD'] }
      }
    });

    return NextResponse.json({
      tasks,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      activeCount
    });

  } catch (error) {
    return workflowErrorResponse(error);
  }
}

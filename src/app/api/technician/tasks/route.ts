import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { RequestStatus, UrgencyLevel } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
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

    const technicianId = session.user.id;

    const where: any = {
      assignedToId: technicianId,
      ...(search && {
        OR: [
          { requestCode: { contains: search, mode: 'insensitive' } },
          { roomNumber: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(status && { status: status as RequestStatus }),
      ...(priority && { urgencyLevel: priority as UrgencyLevel }),
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
        orderBy: [{ urgencyLevel: 'desc' }, { assignedAt: 'desc' }],
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
        status: { in: ['ONGOING', 'PENDING'] }
      }
    });

    return NextResponse.json({
      tasks,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      activeCount
    });

  } catch (error) {
    console.error('Error fetching technician tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

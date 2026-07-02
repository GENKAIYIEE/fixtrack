import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const technicianId = session.user.id;

    const where = {
      assignedToId: technicianId,
      status: 'COMPLETED' as const,
    };

    const [history, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          completedAt: 'desc',
        },
        include: {
          submitter: { select: { firstName: true, lastName: true } },
          repairNote: true,
        },
      }),
      prisma.maintenanceRequest.count({ where })
    ]);

    return NextResponse.json({
      history,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });

  } catch (error) {
    console.error('Error fetching technician history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

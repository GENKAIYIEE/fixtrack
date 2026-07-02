import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = session.user.id;

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    
    const skip = (page - 1) * limit;

    const whereClause: any = { submittedById: userId };
    
    if (status && status !== 'All') {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause.OR = [
        { requestCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [requests, totalFiltered, totalRequests, statusGroup] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          requestCode: true,
          issueType: true,
          building: true,
          roomNumber: true,
          description: true,
          status: true,
          priorityLevel: true,
          urgencyLevel: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.maintenanceRequest.count({ where: whereClause }),
      prisma.maintenanceRequest.count({ where: { submittedById: userId } }),
      prisma.maintenanceRequest.groupBy({
        by: ['status'],
        where: { submittedById: userId },
        _count: true
      })
    ]);

    const summary = {
      total: totalRequests,
      pending: statusGroup.find(g => g.status === 'PENDING')?._count || 0,
      ongoing: statusGroup.find(g => g.status === 'ONGOING')?._count || 0,
      completed: statusGroup.find(g => g.status === 'COMPLETED')?._count || 0,
      rejected: statusGroup.find(g => g.status === 'REJECTED')?._count || 0,
      cancelled: statusGroup.find(g => g.status === 'CANCELLED')?._count || 0,
    };

    const mappedRequests = requests.map(req => ({
      ...req,
      title: req.description ? (req.description.length > 50 ? req.description.substring(0, 50) + '...' : req.description) : 'No description provided'
    }));

    return NextResponse.json({
      requests: mappedRequests,
      summary,
      pagination: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit)
      }
    });
  } catch (error) {
    console.error('[api/user/history] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

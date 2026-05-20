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

    if (session.user.role !== 'USER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = session.user.id;

    const requests = await prisma.maintenanceRequest.findMany({
      where: { submittedById: userId },
      orderBy: { createdAt: 'desc' },
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
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'PENDING').length;
    const ongoing = requests.filter((r) => r.status === 'ONGOING').length;
    const completed = requests.filter((r) => r.status === 'COMPLETED').length;
    const rejected = requests.filter((r) => r.status === 'REJECTED').length;
    const cancelled = requests.filter((r) => r.status === 'CANCELLED').length;

    const mappedRequests = requests.map(req => ({
      ...req,
      title: req.description ? (req.description.length > 50 ? req.description.substring(0, 50) + '...' : req.description) : 'No description provided'
    }));

    return NextResponse.json({
      requests: mappedRequests,
      summary: { total, pending, ongoing, completed, rejected, cancelled },
    });
  } catch (error) {
    console.error('[api/user/history] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BUILDING_LABELS: Record<string, string> = {
  IT_BUILDING: "IT Building",
  ADMIN_BUILDING: "Admin Building",
  LIBRARY: "Library",
  GYMNASIUM: "Gymnasium",
  CANTEEN: "Canteen",
  DORMITORY: "Dormitory",
  OTHERS: "Others",
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || 'month';

    const now = new Date();
    let rangeStart = new Date();

    if (range === 'week') {
      rangeStart.setDate(now.getDate() - 7);
    } else if (range === 'month') {
      rangeStart.setDate(now.getDate() - 30);
    } else if (range === 'year') {
      rangeStart.setDate(now.getDate() - 365);
    } else {
      rangeStart.setDate(now.getDate() - 30); // Default month
    }

    // 1. Total Requests
    const totalRequests = await prisma.maintenanceRequest.count({
      where: { createdAt: { gte: rangeStart } }
    });

    // 2. Avg Resolution Time
    const completedRequests = await prisma.maintenanceRequest.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: rangeStart },
        completedAt: { not: null }
      },
      select: { createdAt: true, completedAt: true }
    });

    let avgResolutionTimeHours = 0;
    if (completedRequests.length > 0) {
      const totalMs = completedRequests.reduce((acc, req) => {
        return acc + (req.completedAt!.getTime() - req.createdAt.getTime());
      }, 0);
      avgResolutionTimeHours = Number((totalMs / completedRequests.length / (1000 * 60 * 60)).toFixed(1));
    }

    // 3. Top Issue Type
    const topIssueTypes = await prisma.maintenanceRequest.groupBy({
      by: ['issueType'],
      _count: { issueType: true },
      where: { createdAt: { gte: rangeStart } },
      orderBy: { _count: { issueType: 'desc' } },
      take: 1
    });

    const topIssueType = topIssueTypes[0]?.issueType || 'None';
    const topIssueTypeCount = topIssueTypes[0]?._count.issueType || 0;

    // FIXED: BUG-06 — Removed two dead code loops:
    //   1. dailyVolumeMap loop (used "E dd" format with collision bug for ranges >7 days; values never used in output)
    //   2. Empty while-iterator loop (iterated dates but never pushed to dailyVolume)
    // Only the uniqueDaysMap pass below is kept — it correctly populates dailyVolume.

    // 4. Daily Volume — group by YYYY-MM-DD key to avoid cross-week collisions, then format for display
    // Single query fetches all requests in range; grouping done in application layer
    const allRequests = await prisma.maintenanceRequest.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true },
    });

    const dailyVolume: { date: string; count: number }[] = [];
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const uniqueDaysMap = new Map<string, number>();
    const iter = new Date(rangeStart);
    iter.setHours(0, 0, 0, 0);
    while (iter <= end) {
      const key = iter.toISOString().split('T')[0];
      uniqueDaysMap.set(key, 0);
      iter.setDate(iter.getDate() + 1);
    }

    allRequests.forEach(req => {
      const key = req.createdAt.toISOString().split('T')[0];
      if (uniqueDaysMap.has(key)) {
        uniqueDaysMap.set(key, uniqueDaysMap.get(key)! + 1);
      } else {
        uniqueDaysMap.set(key, 1);
      }
    });

    uniqueDaysMap.forEach((count, dateKey) => {
      const d = new Date(dateKey);
      let dateStr;
      if (range === 'year') {
        dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      } else {
        dateStr = d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit' });
      }
      dailyVolume.push({ date: dateStr, count });
    });

    // 5. Status Breakdown
    const statusGroup = await prisma.maintenanceRequest.groupBy({
      by: ['status'],
      _count: { status: true },
      where: { createdAt: { gte: rangeStart } }
    });

    const statusBreakdown = {
      completed: 0,
      ongoing: 0,
      pending: 0,
      rejected: 0,
      cancelled: 0,
      total: 0,
      resolvedPercentage: 0
    };

    statusGroup.forEach(s => {
      const count = s._count.status;
      statusBreakdown.total += count;
      if (s.status === 'COMPLETED') statusBreakdown.completed += count;
      else if (s.status === 'ONGOING') statusBreakdown.ongoing += count;
      else if (s.status === 'PENDING') statusBreakdown.pending += count;
      else if (s.status === 'REJECTED') statusBreakdown.rejected += count;
      else if (s.status === 'CANCELLED') statusBreakdown.cancelled += count;
    });

    if (statusBreakdown.total > 0) {
      statusBreakdown.resolvedPercentage = Math.round((statusBreakdown.completed / statusBreakdown.total) * 100);
    }

    // 6. Building Volume
    const buildingGroup = await prisma.maintenanceRequest.groupBy({
      by: ['building'],
      _count: { building: true },
      where: { createdAt: { gte: rangeStart } },
      orderBy: { _count: { building: 'desc' } },
      take: 5
    });

    const buildingVolume = buildingGroup.map(b => ({
      building: BUILDING_LABELS[b.building] || b.building,
      count: b._count.building
    }));

    return NextResponse.json({
      kpis: {
        totalRequests,
        avgResolutionTimeHours,
        topIssueType,
        topIssueTypeCount
      },
      dailyVolume,
      statusBreakdown,
      buildingVolume
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

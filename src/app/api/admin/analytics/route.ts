import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import { getBuildingLabel } from '@/lib/constants/buildings';

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
    rangeStart.setHours(0, 0, 0, 0);

    if (range === 'week') {
      rangeStart.setDate(rangeStart.getDate() - 6);
    } else if (range === 'month') {
      rangeStart.setDate(rangeStart.getDate() - 29);
    } else if (range === 'year') {
      rangeStart.setDate(rangeStart.getDate() - 364);
    } else {
      rangeStart.setDate(rangeStart.getDate() - 29); // Default month
    }

    // 1. Total Requests
    const totalRequests = await prisma.maintenanceRequest.count({
      where: { createdAt: { gte: rangeStart } }
    });

    // 2. Avg Resolution Time (Scalable Database Aggregation)
    const avgResResult = await prisma.$queryRaw<{ avg_hours: number }[]>`
      SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 3600) as avg_hours
      FROM "MaintenanceRequest"
      WHERE status::text = 'COMPLETED' AND "createdAt" >= ${rangeStart} AND "completedAt" IS NOT NULL
    `;
    
    const avgResolutionTimeHours = avgResResult[0]?.avg_hours 
      ? Number(Number(avgResResult[0].avg_hours).toFixed(1)) 
      : 0;

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

    // 4. Daily Volume — Aggregating in memory to guarantee local timezone accuracy
    const allRecentRequests = await prisma.maintenanceRequest.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true }
    });

    const dailyVolume: { date: string; count: number }[] = [];
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const uniqueDaysMap = new Map<string, number>();
    const iter = new Date(rangeStart);
    while (iter <= end) {
      // Local time string format YYYY-MM-DD
      const year = iter.getFullYear();
      const month = String(iter.getMonth() + 1).padStart(2, '0');
      const day = String(iter.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      uniqueDaysMap.set(key, 0);
      iter.setDate(iter.getDate() + 1);
    }

    allRecentRequests.forEach(req => {
      const year = req.createdAt.getFullYear();
      const month = String(req.createdAt.getMonth() + 1).padStart(2, '0');
      const day = String(req.createdAt.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      
      if (uniqueDaysMap.has(key)) {
        uniqueDaysMap.set(key, uniqueDaysMap.get(key)! + 1);
      }
    });

    uniqueDaysMap.forEach((count, dateKey) => {
      // Create date object carefully using local parts so it doesn't shift
      const [y, m, d] = dateKey.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      
      let dateStr;
      if (range === 'week') {
        dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit' });
      } else {
        // For month and year, use Month and Day to avoid duplicate weekdays
        dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
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
      building: getBuildingLabel(b.building),
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

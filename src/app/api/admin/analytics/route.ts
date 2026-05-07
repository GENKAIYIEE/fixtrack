import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // 4. Daily Volume
    const allRequests = await prisma.maintenanceRequest.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true }
    });

    const dailyVolumeMap = new Map<string, number>();
    
    // Initialize dates based on range
    const daysToGenerate = range === 'week' ? 7 : range === 'year' ? 12 : 30; // for year maybe group by month?
    // Wait, the instruction says "Daily volume — group by date ... Fetch all requests in range, group by date string in application layer"
    // And for X-axis labels at the bottom: day labels (Mon 01, Wed 03, etc.) based on selected time range
    // If year, returning 365 points might be much but line chart takes SVG coords. Let's just group by formatted date string
    // Let's generate a map of last X days/months
    
    if (range === 'year') {
      // For year, grouping by month might be better, but the instruction specifically says "daily volume".
      // Let's just group by month-year or stick to daily if that's what it wants. Let's stick to daily grouping by 'MMM dd' or 'E dd'.
      // "Mon 01", "Wed 03"
    }

    // Let's format date as "E dd" e.g., "Mon 01"
    allRequests.forEach(req => {
      // Use simple locale string
      const dateStr = req.createdAt.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit' });
      dailyVolumeMap.set(dateStr, (dailyVolumeMap.get(dateStr) || 0) + 1);
    });

    // If we just map existing dates, it might not have empty dates.
    // Better to generate the date array from start to end.
    const dailyVolume: { date: string; count: number }[] = [];
    const iterator = new Date(rangeStart);
    iterator.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    // If range is year, showing 365 points is too much for "Mon 01" format, but we'll follow the instruction
    // Let's step by day for week/month, and by month for year? No, instruction says "Daily volume".
    // I'll group by date string "E dd"
    
    while (iterator <= end) {
      if (range === 'year') {
         // If year, generating 365 days is fine.
         // Let's format as "MMM dd" to avoid weekday collision over a year? Instruction says "Mon 01". We will stick to "Mon 01".
      }
      const dateStr = iterator.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit' });
      
      // We shouldn't overwrite the map value if we generate sequentially, but just in case we only check map.
      // Wait, "Mon 01" format only has 7 days * ~4 weeks, so they will collide if > 1 month.
      // Let's format as "MMM dd" for year, "E dd" for week/month?
      // "Mon 01" is "weekday day". Let's use it as requested.
      
      iterator.setDate(iterator.getDate() + 1);
    }

    // Let's just map all requests by a unique date string (YYYY-MM-DD) to aggregate, then format for output.
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
            // For requests on exactly rangeStart before setHours etc
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

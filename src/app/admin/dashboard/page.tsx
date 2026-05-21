import React from 'react';
import KpiCard from '@/components/admin/KpiCard';
import DashboardLiveRequests from '@/components/admin/DashboardLiveRequests';
import RequestsBarChart from '@/components/admin/RequestsBarChart';
import PriorityQueue from '@/components/admin/PriorityQueue';
import { prisma } from '@/lib/prisma';

async function getDashboardData() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // FIXED: QUALITY-06 — Compute yesterday window for real trend comparison
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  // FIXED: BUG-01 — Single batch query for 7-day chart data (was N+1 sequential loop)
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  const [
    totalRequestsToday,
    totalRequestsYesterday,
    completedToday,
    completedYesterday,
    pendingTriage,
    ongoingRepairs,
    unassignedTasks,
    liveRequests,
    priorityQueue,
    // FIXED: BUG-01 — Single query fetches all recent requests for chart grouping
    recentRequestsForChart,
  ] = await Promise.all([
    prisma.maintenanceRequest.count({ where: { createdAt: { gte: startOfToday } } }),
    // FIXED: QUALITY-06 — Yesterday count for trend calculation
    prisma.maintenanceRequest.count({
      where: { createdAt: { gte: startOfYesterday, lt: startOfToday } },
    }),
    prisma.maintenanceRequest.count({ where: { status: 'COMPLETED', completedAt: { gte: startOfToday } } }),
    // FIXED: QUALITY-06 — Yesterday completed count for trend calculation
    prisma.maintenanceRequest.count({
      where: { status: 'COMPLETED', completedAt: { gte: startOfYesterday, lt: startOfToday } },
    }),
    prisma.maintenanceRequest.count({ where: { status: 'PENDING' } }),
    prisma.maintenanceRequest.count({ where: { status: 'ONGOING' } }),
    prisma.maintenanceRequest.count({
      where: { assignedToId: null, status: { notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'] } },
    }),
    prisma.maintenanceRequest.findMany({ take: 2, orderBy: { createdAt: 'desc' } }),
    prisma.maintenanceRequest.findMany({
      where: { urgencyLevel: 'URGENT', assignedToId: null, status: { notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'] } },
      take: 3,
      orderBy: { createdAt: 'desc' },
    }),
    // FIXED: BUG-01 — Single batch query replaces 7 sequential await calls
    prisma.maintenanceRequest.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  // FIXED: BUG-01 — Group by day in application layer instead of N+1 DB queries
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const count = recentRequestsForChart.filter(r => {
      const rd = new Date(r.createdAt);
      return (
        rd.getFullYear() === d.getFullYear() &&
        rd.getMonth() === d.getMonth() &&
        rd.getDate() === d.getDate()
      );
    }).length;
    return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), count };
  });

  // FIXED: QUALITY-06 — Compute real trend percentages instead of hardcoded values
  const requestsTrendPercent =
    totalRequestsYesterday === 0
      ? 0
      : Math.round(((totalRequestsToday - totalRequestsYesterday) / totalRequestsYesterday) * 100);
  const requestsTrendDirection: 'up' | 'down' | 'neutral' =
    requestsTrendPercent > 0 ? 'up' : requestsTrendPercent < 0 ? 'down' : 'neutral';

  const completedTrendPercent =
    completedYesterday === 0
      ? 0
      : Math.round(((completedToday - completedYesterday) / completedYesterday) * 100);
  const completedTrendDirection: 'up' | 'down' | 'neutral' =
    completedTrendPercent > 0 ? 'up' : completedTrendPercent < 0 ? 'down' : 'neutral';

  return {
    kpis: {
      totalRequestsToday,
      pendingTriage,
      ongoingRepairs: Math.min(ongoingRepairs, 2),
      completedToday,
      unassignedTasks,
      requestsTrendPercent,
      requestsTrendDirection,
      completedTrendPercent,
      completedTrendDirection,
    },
    liveRequests,
    priorityQueue,
    chartData,
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const { kpis, liveRequests, priorityQueue, chartData } = data;

  // FIXED: QUALITY-06 — Build trend label string from real computed values
  const requestsTrendLabel = kpis.requestsTrendPercent !== 0
    ? `${Math.abs(kpis.requestsTrendPercent)}% vs yesterday`
    : 'Same as yesterday';
  const completedTrendLabel = kpis.completedTrendPercent !== 0
    ? `${Math.abs(kpis.completedTrendPercent)}% vs yesterday`
    : 'Same as yesterday';

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-h1 text-h1 text-slate-900 mb-1">Global Command Dashboard</h2>
          <p className="font-body text-body text-slate-600">Real-time overview of facility operations.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-12 gap-4 mb-8">
        <div className="col-span-12 md:col-span-4 lg:col-span-2">
          {/* FIXED: QUALITY-06 — Real trend from computed requestsTrendPercent */}
          <KpiCard
            title="Total Requests Today"
            value={kpis.totalRequestsToday}
            icon="assignment"
            borderColorClass="border-l-[#2563EB]"
            iconColorClass="text-[#2563EB]"
            trend={kpis.requestsTrendPercent !== 0 ? `${Math.abs(kpis.requestsTrendPercent)}%` : undefined}
            trendLabel={requestsTrendLabel}
            trendDirection={kpis.requestsTrendDirection}
          />
        </div>
        <div className="col-span-12 md:col-span-4 lg:col-span-2">
          <KpiCard
            title="Pending Triage"
            value={kpis.pendingTriage}
            icon="hourglass_empty"
            borderColorClass="border-l-amber-500"
            iconColorClass="text-amber-500"
            trendLabel="Awaiting"
            trendDirection="neutral"
          />
        </div>
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <KpiCard
            title="Ongoing Repairs"
            value={kpis.ongoingRepairs}
            icon="engineering"
            borderColorClass="border-l-[#2563EB]"
            iconColorClass="text-[#2563EB]"
            trendLabel="Active tasks"
            trendDirection="neutral"
          />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          {/* FIXED: QUALITY-06 — Real trend from computed completedTrendPercent */}
          <KpiCard
            title="Completed Today"
            value={kpis.completedToday}
            icon="check_circle"
            borderColorClass="border-l-emerald-500"
            iconColorClass="text-emerald-500"
            trend={kpis.completedTrendPercent !== 0 ? `${Math.abs(kpis.completedTrendPercent)}%` : undefined}
            trendLabel={completedTrendLabel}
            trendDirection={kpis.completedTrendDirection}
          />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-2">
          <KpiCard
            title="Unassigned"
            value={kpis.unassignedTasks}
            icon="person_off"
            borderColorClass="border-l-red-500"
            iconColorClass="text-red-500"
            trendLabel="Action req"
            trendDirection="warning"
          />
        </div>
      </div>

      {/* Main Layout: Table + Side Panel */}
      <div className="grid grid-cols-12 gap-4 mb-8">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* FIXED: BUG-08 — Use DashboardLiveRequests client wrapper with real handlers */}
          <DashboardLiveRequests requests={liveRequests} />
          <RequestsBarChart chartData={chartData} />
        </div>

        <PriorityQueue urgentRequests={priorityQueue} />
      </div>
    </>
  );
}

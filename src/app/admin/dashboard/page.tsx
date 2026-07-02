import React from 'react';

export const dynamic = 'force-dynamic';

import KpiCard from '@/components/admin/KpiCard';
import DashboardLiveRequests from '@/components/admin/DashboardLiveRequests';
import RequestsBarChart from '@/components/admin/RequestsBarChart';
import PriorityQueue from '@/components/admin/PriorityQueue';
import AutoRefresh from '@/components/admin/AutoRefresh';
import { prisma } from '@/lib/prisma';

async function getDashboardData() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Compute yesterday window for real trend comparison
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  // Prepare 7 lightweight count queries using local time boundaries to match KPI logic.
  // This completely eliminates the severe memory crash risk from the previous implementation
  // which fetched potentially hundreds of thousands of records into Node.js memory.
  const chartQueries = Array.from({ length: 7 }, (_, i) => {
    const startOfDay = new Date(startOfToday);
    startOfDay.setDate(startOfDay.getDate() - (6 - i));
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return prisma.maintenanceRequest.count({
      where: { createdAt: { gte: startOfDay, lt: endOfDay } }
    }).then(count => ({
      // Label the day using local time since data boundaries are local
      day: startOfDay.toLocaleDateString('en-US', { weekday: 'short' }),
      count
    }));
  });

  const [
    totalRequestsToday,
    totalRequestsYesterday, // Available for future trend usage
    completedToday,
    completedYesterday, // Available for future trend usage
    pendingTriage,
    ongoingRepairs,
    unassignedTasks,
    liveRequests,
    priorityQueue,
    ...chartData
  ] = await Promise.all([
    prisma.maintenanceRequest.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.maintenanceRequest.count({
      where: { createdAt: { gte: startOfYesterday, lt: startOfToday } },
    }),
    prisma.maintenanceRequest.count({ where: { status: 'COMPLETED', completedAt: { gte: startOfToday } } }),
    prisma.maintenanceRequest.count({
      where: { status: 'COMPLETED', completedAt: { gte: startOfYesterday, lt: startOfToday } },
    }),
    prisma.maintenanceRequest.count({ where: { status: 'PENDING' } }),
    prisma.maintenanceRequest.count({ where: { status: 'ONGOING' } }),
    prisma.maintenanceRequest.count({
      where: { assignedToId: null, status: { notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'] } },
    }),
    prisma.maintenanceRequest.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.maintenanceRequest.findMany({
      where: { priorityLevel: 'URGENT', assignedToId: null, status: { notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'] } },
      take: 3,
      orderBy: { createdAt: 'desc' },
    }),
    ...chartQueries
  ]);

  return {
    kpis: {
      totalRequestsToday,
      pendingTriage,
      ongoingRepairs,
      completedToday,
      unassignedTasks,
    },
    liveRequests,
    priorityQueue,
    chartData,
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const { kpis, liveRequests, priorityQueue, chartData } = data;

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
          <KpiCard
            title="Total Requests Today"
            value={kpis.totalRequestsToday}
            icon="assignment"
            borderColorClass="border-l-[#2563EB]"
            iconColorClass="text-[#2563EB]"
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
          <KpiCard
            title="Completed Today"
            value={kpis.completedToday}
            icon="check_circle"
            borderColorClass="border-l-emerald-500"
            iconColorClass="text-emerald-500"
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

      {/* Real-time background polling every 15 seconds */}
      <AutoRefresh intervalMs={15000} />
    </>
  );
}

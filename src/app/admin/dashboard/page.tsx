import React from 'react';
import { headers } from 'next/headers';
import KpiCard from '@/components/admin/KpiCard';
import LiveRequestsTable from '@/components/admin/LiveRequestsTable';
import RequestsBarChart from '@/components/admin/RequestsBarChart';
import PriorityQueue from '@/components/admin/PriorityQueue';

async function getDashboardData() {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  const res = await fetch(`${protocol}://${host}/api/admin/dashboard`, {
    headers: {
      cookie: headersList.get('cookie') || '',
    },
    // We can use cache: 'no-store' to ensure fresh data
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  return res.json();
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
        <div className="flex gap-3">
          <button className="bg-white text-[#2563EB] border border-[#2563EB] font-label-md text-label-md px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span> Export Report
          </button>
          <button className="bg-[#2563EB] text-white font-label-md text-label-md px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-blue-700 transition-colors">
            <span className="material-symbols-outlined text-[18px]">add</span> New Request
          </button>
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
            trend="12%"
            trendLabel=""
            trendDirection="up"
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
            trend="4%"
            trendLabel=""
            trendDirection="up"
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
          <LiveRequestsTable requests={liveRequests} />
          <RequestsBarChart chartData={chartData} />
        </div>
        
        <PriorityQueue urgentRequests={priorityQueue} />
      </div>
    </>
  );
}

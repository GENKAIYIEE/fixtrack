import React from 'react';

interface Kpis {
  totalRequests: number;
  avgResolutionTimeHours: number;
  topIssueType: string;
  topIssueTypeCount: number;
}

export default function AnalyticsKpiRow({ kpis }: { kpis: Kpis }) {
  return (
    <>
      {/* Web UI Layout (Hidden on Print) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 print:hidden">
        {/* Total Requests */}
        <div className="bg-surface border-l-[4px] border-primary-container h-[120px] shadow-[0_4px_12px_rgba(30,58,138,0.04)] rounded-r-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-sidebar-label text-sidebar-label text-on-surface-variant uppercase tracking-wider">Total Requests</span>
            <span className="material-symbols-outlined text-primary-container/40">confirmation_number</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-kpi-value text-kpi-value text-on-surface">{kpis.totalRequests}</span>
          </div>
        </div>

        {/* Avg Resolution Time */}
        <div className="bg-surface border-l-[4px] border-secondary h-[120px] shadow-[0_4px_12px_rgba(30,58,138,0.04)] rounded-r-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-sidebar-label text-sidebar-label text-on-surface-variant uppercase tracking-wider">Avg Resolution Time</span>
            <span className="material-symbols-outlined text-secondary/40">timer</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-kpi-value text-kpi-value text-on-surface">{kpis.avgResolutionTimeHours}h</span>
            <span className="font-label-md text-label-md text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              {kpis.avgResolutionTimeHours > 24 ? 'High' : 'Stable'}
            </span>
          </div>
        </div>

        {/* Top Issue Category */}
        <div className="bg-surface border-l-[4px] border-error h-[120px] shadow-[0_4px_12px_rgba(30,58,138,0.04)] rounded-r-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-sidebar-label text-sidebar-label text-on-surface-variant uppercase tracking-wider">Top Issue Category</span>
            <span className="material-symbols-outlined text-error/40">warning</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-kpi-value text-[24px] font-bold text-on-surface truncate pr-2">{kpis.topIssueType.replace(/_/g, ' ')}</span>
            <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">
              {kpis.topIssueTypeCount} incidents
            </span>
          </div>
        </div>
      </div>

      {/* Clean Corporate Form Layout (Only on Print) */}
      <div className="hidden print:block mb-8 font-sans">
        {/* Section Header */}
        <div className="bg-[#1E3A8A] text-white font-bold text-sm px-3 py-1 mb-2 uppercase tracking-wide">
          SECTION 1 - KEY PERFORMANCE INDICATORS
        </div>
        
        {/* Data Table */}
        <table className="w-full border-collapse text-sm border border-slate-300">
          <tbody>
            <tr>
              <td className="border border-slate-300 bg-slate-50 p-2 font-semibold w-1/4">Total Requests</td>
              <td className="border border-slate-300 p-2 w-1/4 font-bold">{kpis.totalRequests}</td>
              <td className="border border-slate-300 bg-slate-50 p-2 font-semibold w-1/4">Avg Resolution Time</td>
              <td className="border border-slate-300 p-2 w-1/4 font-bold">{kpis.avgResolutionTimeHours} Hrs</td>
            </tr>
            <tr>
              <td className="border border-slate-300 bg-slate-50 p-2 font-semibold w-1/4">Top Issue Category</td>
              <td className="border border-slate-300 p-2 w-1/4 font-bold capitalize">{kpis.topIssueType.replace(/_/g, ' ').toLowerCase()}</td>
              <td className="border border-slate-300 bg-slate-50 p-2 font-semibold w-1/4">Incident Count</td>
              <td className="border border-slate-300 p-2 w-1/4 font-bold">{kpis.topIssueTypeCount}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

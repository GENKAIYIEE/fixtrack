'use client';

import React, { useState, useEffect } from 'react';
import AnalyticsKpiRow from '@/components/admin/AnalyticsKpiRow';
import DailyVolumeLineChart from '@/components/admin/DailyVolumeLineChart';
import StatusDonutChart from '@/components/admin/StatusDonutChart';
import BuildingsBarChart from '@/components/admin/BuildingsBarChart';
import Toast from '@/components/shared/Toast';

interface AnalyticsData {
  kpis: {
    totalRequests: number;
    avgResolutionTimeHours: number;
    topIssueType: string;
    topIssueTypeCount: number;
  };
  dailyVolume: { date: string; count: number }[];
  statusBreakdown: {
    completed: number;
    ongoing: number;
    pending: number;
    rejected: number;
    cancelled: number;
    total: number;
    resolvedPercentage: number;
  };
  buildingVolume: { building: string; count: number }[];
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchAnalytics = async (range: string, silent = false, signal?: AbortSignal) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`, { signal });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setAnalyticsData(data);
    } catch (error: any) {
      if (error.name === 'AbortError') return; // Ignore cancelled requests
      console.error(error);
      if (!silent) setToast({ message: 'Failed to load analytics data.', type: 'error' });
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAnalytics(timeRange, false, controller.signal);
    
    // Real-time background polling every 15 seconds
    const timer = setInterval(() => {
      fetchAnalytics(timeRange, true, controller.signal);
    }, 15000);
    
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [timeRange]);

  const handleExportExcel = () => {
    if (!analyticsData) return;

    // Build a comprehensive CSV spreadsheet structure
    const rows = [
      `"FIXTRACK ANALYTICS & OPERATIONS REPORT"`,
      `"Generated:",${new Date().toLocaleDateString()}`,
      `"Reporting Period:",${timeRange.toUpperCase()}`,
      '',
      `"--- SECTION 1: KEY PERFORMANCE INDICATORS ---"`,
      `"Metric","Value"`,
      `"Total Requests",${analyticsData.kpis.totalRequests}`,
      `"Avg Resolution Time",${analyticsData.kpis.avgResolutionTimeHours} Hrs`,
      `"Top Issue Category","${analyticsData.kpis.topIssueType.replace(/_/g, ' ')}"`,
      `"Top Issue Incident Count",${analyticsData.kpis.topIssueTypeCount}`,
      '',
      `"--- SECTION 2: STATUS BREAKDOWN ---"`,
      `"Status","Count"`,
      `"Completed",${analyticsData.statusBreakdown.completed}`,
      `"Ongoing",${analyticsData.statusBreakdown.ongoing}`,
      `"Pending",${analyticsData.statusBreakdown.pending}`,
      `"Resolution Rate","${analyticsData.statusBreakdown.resolvedPercentage}%"`,
      '',
      `"--- SECTION 3: BUILDING VOLUME SUMMARY ---"`,
      `"Building / Location","Total Requests"`,
      ...(analyticsData.buildingVolume.length > 0 
        ? analyticsData.buildingVolume.map(b => `"${b.building.replace(/_/g, ' ')}",${b.count}`)
        : [`"No building data available","0"`]),
      '',
      `"--- SECTION 4: DAILY VOLUME LOG ---"`,
      `"Date","Total Volume"`,
      ...analyticsData.dailyVolume.map(d => `"${d.date}",${d.count}`)
    ];

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FixTrack_Analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({ message: 'Exported to Excel successfully!', type: 'success' });
  };

  const currentDate = new Date().toISOString().split('T')[0];
  const currentPeriod = timeRange === 'week' ? 'This_Week' : timeRange.charAt(0).toUpperCase() + timeRange.slice(1);
  const reportFilename = `FixTrack_Analytics_Report_${currentPeriod}_${currentDate}`;

  const handleExportPDF = () => {
    const filename = reportFilename;
    const titleEl = document.head.querySelector('title');
    const originalTitle = document.title;
    let printing = true;

    // Force the filename on both the document.title property AND the raw DOM node.
    // Direct DOM mutation bypasses React's virtual DOM so Next.js Metadata API
    // cannot silently reset it before Edge captures it for the Save dialog.
    const forceFilename = () => {
      // Guard: only write when the value differs — prevents the MutationObserver
      // from triggering itself in an infinite feedback loop.
      if (document.title !== filename) document.title = filename;
      if (titleEl && titleEl.textContent !== filename) titleEl.textContent = filename;
    };

    // MutationObserver: actively guards the <title> node against any React
    // re-render that tries to restore the framework's own title while the print
    // dialog is still open. This is the definitive fix for the race condition
    // between React's concurrent renderer and the browser print flow.
    const observer = new MutationObserver(() => {
      if (printing) forceFilename();
    });
    if (titleEl) {
      observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    }

    const cleanup = (restoreOriginal = true) => {
      printing = false;
      observer.disconnect();
      if (restoreOriginal) {
        document.title = originalTitle;
        if (titleEl) titleEl.textContent = originalTitle;
      }
      window.removeEventListener('afterprint', onAfterPrint);
      window.removeEventListener('beforeprint', onBeforePrint);
    };

    // beforeprint: fires synchronously the instant window.print() is called —
    // last guaranteed hook before Edge renders the print preview / save dialog.
    const onBeforePrint = () => forceFilename();

    // afterprint: fires when the dialog is dismissed (saved or cancelled).
    const onAfterPrint = () => cleanup(true);

    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);

    // Safety net: auto-cleanup after 60 s in case afterprint never fires.
    const safetyTimer = setTimeout(() => cleanup(true), 60_000);

    // Apply immediately, then delay window.print() so all pending React renders
    // are flushed and the MutationObserver is fully active before the dialog opens.
    forceFilename();
    setTimeout(() => {
      clearTimeout(safetyTimer); // restart the safety timer relative to actual print
      setTimeout(() => cleanup(true), 60_000);
      window.print();
    }, 200);
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full print:max-w-none print:w-full print:bg-white">
      {/* Formal School Letterhead (Print Only) */}
      <div className="hidden print:block mb-6 text-black font-serif">
        {/* 3-Column Header: PCLU Logo | School Info | ISO Logo */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px', alignItems: 'center', borderBottom: '2px solid black', paddingBottom: '12px', marginBottom: '16px' }}>
          {/* Left: PCLU Logo */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Pclu-Logo.png" alt="PCLU Logo" className="h-20 w-auto object-contain" />
          </div>

          {/* Center: School Info */}
          <div style={{ textAlign: 'center', padding: '0 8px' }}>
            <p className="font-bold text-base uppercase">Polytechnic College of La Union (PCLU), Inc.</p>
            <p className="text-xs italic">(Formerly PAMETS COLLEGES)</p>
            <p className="text-xs mt-0.5">Don Pastor L. Panay Sr. Street, San Nicolas Sur, Agoo, La Union 2504</p>
            <p className="text-xs">Tel. No. (072) 2061761 Mobile No. 09171623141 / 09260953781</p>
            <p className="text-xs">Email: pclucollege@pclu.com.ph / https://www.facebook.com/PCLUOfficialpage</p>
            <p className="text-xs font-bold mt-0.5">Member: <span className="italic">Philippine Association of Colleges &amp; Universities</span></p>
          </div>

          {/* Right: ISO Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ISO-LOGO.png?v=2" alt="ISO Logo" className="h-16 w-auto object-contain" />
            <p className="text-xs mt-1" style={{ fontSize: '8px', whiteSpace: 'nowrap' }}>Reg. No.: 48Q12980</p>
          </div>
        </div>

        {/* Report Title Block */}
        <div className="text-center mb-3">
          <h1 className="text-sm font-bold uppercase">FixTrack Maintenance System</h1>
          <p className="text-xs">General Services Office</p>
          <h2 className="text-base font-bold uppercase mt-2 mb-1 underline">Official Analytics and Operations Report</h2>
        </div>

        {/* Document Metadata Row */}
        <div className="flex justify-between text-xs mb-2">
          <p><strong>Date Generated:</strong> {new Date().toLocaleDateString()}</p>
          <p className="capitalize"><strong>Reporting Period:</strong> {timeRange === 'week' ? 'This Week' : timeRange}</p>
          <p><strong>Control No:</strong> {Math.floor(Date.now() / 1000).toString(16).toUpperCase()}</p>
        </div>
      </div>

      {/* Page Header (Web UI Only) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
        <div>
          <h1 className="font-h1 text-primary-container mb-2">Reports & Analytics</h1>
          <p className="text-on-surface-variant font-body-lg max-w-2xl">
            Comprehensive overview of maintenance operations, asset performance, and administrative efficiency metrics.
          </p>
        </div>

        {/* Action Row */}
        <div className="flex flex-col items-end gap-4">
          {/* Time Range Toggle */}
          <div className="flex bg-surface-variant/30 rounded-lg p-1">
            {(['week', 'month', 'year'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 font-label-md rounded-md capitalize transition-all duration-200 ${
                  timeRange === range
                    ? 'bg-surface shadow-sm border border-outline-variant/20 text-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-variant/50'
                }`}
              >
                {range === 'week' ? 'This Week' : range}
              </button>
            ))}
          </div>

          {/* Export Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/90 rounded-lg px-4 py-2 transition-colors font-label-md shadow-sm"
            >
              <span className="material-symbols-outlined">picture_as_pdf</span>
              Export PDF
            </button>
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-surface hover:bg-surface-variant border border-outline-variant/50 text-on-surface rounded-lg px-4 py-2 transition-colors font-label-md shadow-sm"
            >
              <span className="material-symbols-outlined text-blue-500">table_chart</span>
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {isLoading || !analyticsData ? (
        <div className="animate-pulse space-y-6">
          <div className="h-[120px] bg-surface-variant/30 rounded-xl w-full"></div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 h-[380px] bg-surface-variant/30 rounded-xl"></div>
            <div className="col-span-4 h-[380px] bg-surface-variant/30 rounded-xl"></div>
          </div>
          <div className="h-[320px] bg-surface-variant/30 rounded-xl w-full"></div>
        </div>
      ) : (
        <>
          <AnalyticsKpiRow kpis={analyticsData.kpis} />

          {/* Visual Charts & Data (Hidden in Print) */}
          <div className="print:hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              <div className="lg:col-span-8">
                <DailyVolumeLineChart data={analyticsData.dailyVolume} />
              </div>
              <div className="lg:col-span-4">
                <StatusDonutChart data={analyticsData.statusBreakdown} />
              </div>
            </div>

            <div className="w-full">
              <BuildingsBarChart data={analyticsData.buildingVolume} />
            </div>
          </div>

          {/* Formal Text-Only Data Summary (Visible Only in Print) */}
          <div className="hidden print:block font-serif text-black">
            {/* SECTION 1: KPIs */}
            <div className="mb-8">
              <div className="border-b-2 border-black font-bold text-sm mb-2 uppercase tracking-wide pb-1">
                I. Key Performance Indicators
              </div>
              <table className="w-full border-collapse text-sm border border-black">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold w-1/4 uppercase text-xs">Total Requests</td>
                    <td className="border border-black p-2 w-1/4 text-base text-center">{analyticsData.kpis.totalRequests}</td>
                    <td className="border border-black p-2 font-bold w-1/4 uppercase text-xs">Avg Resolution Time</td>
                    <td className="border border-black p-2 w-1/4 text-base text-center">{analyticsData.kpis.avgResolutionTimeHours} Hrs</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold w-1/4 uppercase text-xs">Top Issue Category</td>
                    <td className="border border-black p-2 w-1/4 capitalize text-base text-center">{analyticsData.kpis.topIssueType.replace(/_/g, ' ').toLowerCase()}</td>
                    <td className="border border-black p-2 font-bold w-1/4 uppercase text-xs">Incident Count</td>
                    <td className="border border-black p-2 w-1/4 text-base text-center">{analyticsData.kpis.topIssueTypeCount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* SECTION 2: Status */}
              <div>
                <div className="border-b-2 border-black font-bold text-sm mb-2 uppercase tracking-wide pb-1">
                  II. Status Breakdown
                </div>
                <table className="w-full text-left text-sm border-collapse border border-black">
                  <tbody>
                    <tr>
                      <td className="border border-black p-2 w-2/3">Completed</td>
                      <td className="border border-black p-2 font-bold text-center">{analyticsData.statusBreakdown.completed}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 w-2/3">Ongoing</td>
                      <td className="border border-black p-2 font-bold text-center">{analyticsData.statusBreakdown.ongoing}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 w-2/3">Pending</td>
                      <td className="border border-black p-2 font-bold text-center">{analyticsData.statusBreakdown.pending}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 w-2/3">Rejected</td>
                      <td className="border border-black p-2 font-bold text-center">{analyticsData.statusBreakdown.rejected}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 w-2/3">Cancelled</td>
                      <td className="border border-black p-2 font-bold text-center">{analyticsData.statusBreakdown.cancelled}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold uppercase text-xs">Resolution Rate</td>
                      <td className="border border-black p-2 font-bold text-center">{analyticsData.statusBreakdown.resolvedPercentage}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SECTION 3: Building */}
              <div>
                <div className="border-b-2 border-black font-bold text-sm mb-2 uppercase tracking-wide pb-1">
                  III. Building Volume Summary
                </div>
                <table className="w-full text-left text-sm border-collapse border border-black">
                  <thead>
                    <tr>
                      <th className="border border-black p-2 font-bold text-xs uppercase text-center">Building / Location</th>
                      <th className="border border-black p-2 font-bold text-xs uppercase text-center w-24">Requests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.buildingVolume.length > 0 ? (
                      analyticsData.buildingVolume.map((b, i) => (
                        <tr key={i}>
                          <td className="border border-black p-2 capitalize">{b.building.replace(/_/g, ' ')}</td>
                          <td className="border border-black p-2 font-bold text-center">{b.count}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="border border-black p-2 text-center italic">No building data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 4: Daily Log */}
            <div>
              <div className="border-b-2 border-black font-bold text-sm mb-2 uppercase tracking-wide pb-1">
                IV. Daily Volume Log
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((colIndex) => {
                  const itemsPerCol = Math.ceil(analyticsData.dailyVolume.length / 3);
                  const colData = analyticsData.dailyVolume.slice(colIndex * itemsPerCol, (colIndex + 1) * itemsPerCol);
                  
                  if (colData.length === 0) return null;
                  
                  return (
                    <table key={colIndex} className="w-full text-left text-xs border-collapse border border-black">
                      <thead>
                        <tr>
                          <th className="border border-black p-1.5 font-bold uppercase text-center">Date</th>
                          <th className="border border-black p-1.5 font-bold uppercase text-center w-16">Vol</th>
                        </tr>
                      </thead>
                      <tbody>
                        {colData.map((d, i) => (
                          <tr key={i}>
                            <td className="border border-black p-1.5 text-center">{d.date}</td>
                            <td className="border border-black p-1.5 font-bold text-center">{d.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })}
              </div>
            </div>
            
            {/* Formal Signature Block (Removed for School Context) */}
            
            {/* Footer */}
            <div className="mt-12 text-center text-xs italic">
              <p>This is a system-generated report. No signature is required for internal reference.</p>
            </div>
          </div>

        </>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}

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

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
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

          {/* Visual Charts & Data */}
          <div>
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

'use client';

import React, { useState, useEffect } from 'react';
import AnalyticsKpiRow from '@/components/admin/AnalyticsKpiRow';
import DailyVolumeLineChart from '@/components/admin/DailyVolumeLineChart';
import StatusDonutChart from '@/components/admin/StatusDonutChart';
import BuildingsBarChart from '@/components/admin/BuildingsBarChart';
import ExportedReportsTable from '@/components/admin/ExportedReportsTable';
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

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  const fetchAnalytics = async (range: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to load analytics data.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!analyticsData) return;

    // Build a simple CSV structure
    const rows = [
      `Total Requests,${analyticsData.kpis.totalRequests}`,
      `Avg Resolution Time,${analyticsData.kpis.avgResolutionTimeHours}h`,
      '',
      'Date,Total Volume',
      ...analyticsData.dailyVolume.map(d => `${d.date},${d.count}`)
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
    <div className="p-8 max-w-[1400px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-h1 text-primary-container mb-2">Reports & Analytics</h1>
          <p className="text-on-surface-variant font-body-lg max-w-2xl">
            Comprehensive overview of maintenance operations, asset performance, and administrative efficiency metrics.
          </p>
        </div>

        {/* Action Row */}
        <div className="flex flex-col items-end gap-4 no-print">
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
              className="flex items-center gap-2 bg-surface hover:bg-surface-variant border border-outline-variant/50 text-on-surface rounded-lg px-4 py-2 transition-colors font-label-md shadow-sm"
            >
              <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            <div className="lg:col-span-8">
              <DailyVolumeLineChart data={analyticsData.dailyVolume} />
            </div>
            <div className="lg:col-span-4">
              <StatusDonutChart data={analyticsData.statusBreakdown} />
            </div>
          </div>

          <div className="w-full mb-6">
            <BuildingsBarChart data={analyticsData.buildingVolume} />
          </div>

          <div className="w-full">
            <ExportedReportsTable />
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

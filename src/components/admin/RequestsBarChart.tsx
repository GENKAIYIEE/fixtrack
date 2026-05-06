'use client';

import React from 'react';

type ChartData = {
  day: string;
  count: number;
};

type RequestsBarChartProps = {
  chartData: ChartData[];
};

export default function RequestsBarChart({ chartData }: RequestsBarChartProps) {
  // Ensure we have at least 1 for max to avoid division by zero
  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.08)] border border-slate-100 p-6">
      <h3 className="font-h2 text-h2 text-slate-900 mb-6">Maintenance Requests — Last 7 Days</h3>
      <div className="h-48 flex items-end justify-between gap-2 px-2">
        <div className="w-full flex items-end justify-between gap-4 h-full relative border-b border-slate-200 pb-2">
          {chartData.map((data, index) => {
            const heightPercent = Math.max((data.count / maxCount) * 100, 2); // At least 2% height so it's visible
            const isToday = index === chartData.length - 1; // Assuming last item is today
            
            return (
              <div key={data.day} className="flex flex-col items-center gap-2 w-full h-full justify-end">
                <div 
                  className={`w-full rounded-t-sm ${isToday ? 'bg-[#2563EB]' : 'bg-[#DBEAFE] hover:bg-[#2563EB] transition-colors'}`} 
                  style={{ height: `${heightPercent}%` }}
                  title={`${data.count} requests`}
                ></div>
                <span className={`text-xs ${isToday ? 'text-slate-900 font-semibold' : 'text-slate-500 font-medium'}`}>
                  {data.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

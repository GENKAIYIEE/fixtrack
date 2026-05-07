'use client';

import React from 'react';

interface StatusBreakdown {
  completed: number;
  ongoing: number;
  pending: number;
  rejected: number;
  cancelled: number;
  total: number;
  resolvedPercentage: number;
}

export default function StatusDonutChart({ data }: { data: StatusBreakdown }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // approx 251.2
  
  const statuses = [
    { label: 'Completed', value: data.completed, color: '#0051d5' }, // secondary
    { label: 'Ongoing', value: data.ongoing, color: '#1e3a8a' }, // primary-container
    { label: 'Pending', value: data.pending, color: '#f39461' }, // tertiary-container variant
    { label: 'Cancelled/Rejected', value: data.cancelled + data.rejected, color: '#e3e1e9' } // surface-variant
  ];

  let cumulativeOffset = 0;

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/20 p-6 h-[380px] flex flex-col items-center">
      <div className="w-full mb-2">
        <h3 className="font-h3 text-on-surface">Request Status</h3>
      </div>
      
      <div className="relative w-[200px] h-[200px] flex-shrink-0">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="-rotate-90">
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#f1f5f9"
            strokeWidth="14"
            fill="transparent"
          />
          
          {/* Arc segments */}
          {statuses.map((status, index) => {
            if (data.total === 0) return null;
            
            const percentage = status.value / data.total;
            if (percentage === 0) return null;
            
            const dashArray = `${percentage * circumference} ${circumference}`;
            const dashOffset = -cumulativeOffset;
            cumulativeOffset += percentage * circumference;
            
            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r={radius}
                stroke={status.color}
                strokeWidth="14"
                fill="transparent"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500 ease-in-out"
              />
            );
          })}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-kpi-value text-[24px] text-primary-container leading-tight">{data.resolvedPercentage}%</span>
          <span className="font-label-sm text-xs text-on-surface-variant">Resolved</span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-auto w-full px-4">
        {statuses.map((status, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />
            <div className="flex flex-col">
              <span className="font-label-sm text-xs text-on-surface-variant">{status.label}</span>
              <span className="font-label-md text-sm text-on-surface">{status.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

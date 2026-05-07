'use client';

import React from 'react';

interface DailyVolumeData {
  date: string;
  count: number;
}

export default function DailyVolumeLineChart({ data }: { data: DailyVolumeData[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 150); // Fallback to 150 to keep scale
  const scaleY = (val: number) => 250 - (val / maxCount) * 250;
  
  // Create a cubic bezier path
  let pathD = '';
  if (data.length > 0) {
    const stepX = 100 / Math.max(data.length - 1, 1);
    pathD = `M 0,${scaleY(data[0].count)}`;
    
    for (let i = 1; i < data.length; i++) {
      const prevX = (i - 1) * stepX;
      const prevY = scaleY(data[i - 1].count);
      const currX = i * stepX;
      const currY = scaleY(data[i].count);
      
      const cp1x = prevX + (stepX / 2);
      const cp1y = prevY;
      const cp2x = prevX + (stepX / 2);
      const cp2y = currY;
      
      pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${currX},${currY}`;
    }
  }

  // Generate fill path by closing the line path
  const fillPathD = pathD ? `${pathD} L 100,250 L 0,250 Z` : '';

  // Determine Y-axis ticks
  const yTicks = [maxCount, Math.round(maxCount * 0.66), Math.round(maxCount * 0.33), 0];

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/20 p-6 h-[380px] flex flex-col">
      <div className="mb-4">
        <h3 className="font-h3 text-on-surface">Daily Request Volume</h3>
      </div>
      
      <div className="flex-1 flex min-h-0 relative">
        {/* Y-axis labels */}
        <div className="w-[40px] flex flex-col justify-between border-r border-outline-variant/30 pr-2 py-4">
          {yTicks.map((tick, i) => (
            <div key={i} className="text-right text-xs text-on-surface-variant font-label-sm">
              {tick}
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="flex-1 relative ml-4 py-4">
          {/* Grid lines */}
          <div className="absolute inset-0 py-4 flex flex-col justify-between z-0">
            {yTicks.map((tick, i) => (
              <div 
                key={i} 
                className={`w-full ${tick === 0 ? 'border-t border-outline-variant/50' : 'border-t border-outline-variant/20 border-dashed'}`}
              />
            ))}
          </div>

          {/* SVG Line & Area */}
          <svg className="absolute inset-0 w-full h-full z-10 overflow-visible" viewBox="0 0 100 250" preserveAspectRatio="none">
            <defs>
              <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            
            {data.length > 0 && (
              <>
                <path
                  d={fillPathD}
                  fill="url(#blue-gradient)"
                  opacity="0.15"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>

          {/* Data nodes (rendered as HTML elements overlay to keep perfect circles without vector stretching) */}
          <div className="absolute inset-0 z-20 overflow-visible py-4 pointer-events-none">
            {data.map((point, i) => {
              const leftPercent = (i / Math.max(data.length - 1, 1)) * 100;
              const topPercent = (scaleY(point.count) / 250) * 100;
              // Only show nodes if not too many points
              if (data.length > 15 && i % Math.ceil(data.length / 10) !== 0 && i !== data.length - 1 && i !== 0) return null;
              
              return (
                <div 
                  key={i}
                  className="absolute w-2.5 h-2.5 bg-white border-2 border-[#2563EB] rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="h-6 flex justify-between ml-[56px] mt-2">
        {data.map((point, i) => {
           if (data.length > 10 && i % Math.ceil(data.length / 6) !== 0 && i !== data.length - 1 && i !== 0) return null;
           return (
            <div key={i} className="text-xs text-on-surface-variant font-label-sm" style={{ width: '40px', textAlign: 'center' }}>
              {point.date}
            </div>
           );
        })}
      </div>
    </div>
  );
}

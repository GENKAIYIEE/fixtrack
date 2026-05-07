'use client';

import React from 'react';

interface BuildingData {
  building: string;
  count: number;
}

export default function BuildingsBarChart({ data }: { data: BuildingData[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 400); // Base scale on 400 or max
  const yTicks = [maxCount, Math.round(maxCount / 2), 0];

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/20 p-6 h-[320px] flex flex-col">
      <div className="mb-6">
        <h3 className="font-h3 text-on-surface">Top Buildings by Volume</h3>
      </div>
      
      <div className="flex-1 flex min-h-0 relative">
        {/* Y-axis labels */}
        <div className="w-[40px] flex flex-col justify-between border-r border-outline-variant/30 pr-2 pb-6">
          {yTicks.map((tick, i) => (
            <div key={i} className="text-right text-xs text-on-surface-variant font-label-sm translate-y-1/2" style={i===0?{transform: 'translateY(-50%)'}: {}}>
              {tick}
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="flex-1 relative ml-4">
          {/* Grid lines */}
          <div className="absolute inset-0 pb-6 flex flex-col justify-between z-0">
            {yTicks.map((tick, i) => (
              <div 
                key={i} 
                className={`w-full ${tick === 0 ? 'border-t border-outline-variant/50' : 'border-t border-outline-variant/20 border-dashed'}`}
              />
            ))}
          </div>

          {/* Bars */}
          <div className="absolute inset-0 pb-6 pt-1 flex items-end justify-around z-10 px-4">
            {data.map((item, i) => {
              const heightPercent = (item.count / maxCount) * 100;
              return (
                <div key={i} className="flex flex-col items-center justify-end h-full w-[15%] group">
                  <div 
                    className="w-full bg-primary-container rounded-t-sm transition-colors duration-300 group-hover:bg-secondary flex items-end justify-center pb-2 relative"
                    style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-surface-container-highest text-on-surface text-xs py-1 px-2 rounded pointer-events-none transition-opacity whitespace-nowrap z-20 font-label-sm shadow-sm">
                      {item.count} requests
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 h-6 flex justify-around px-4">
             {data.map((item, i) => (
                <div key={i} className="w-[15%] text-center truncate px-1">
                  <span className="font-sidebar-label text-[10px] text-on-surface-variant uppercase" title={item.building}>
                    {item.building.replace(' Building', '')}
                  </span>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

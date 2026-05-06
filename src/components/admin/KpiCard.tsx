import React from 'react';

type KpiCardProps = {
  title: string;
  value: number | string;
  icon: string;
  borderColorClass: string;
  iconColorClass: string;
  trend?: string;
  trendLabel?: string;
  trendDirection?: 'up' | 'down' | 'neutral' | 'warning';
  className?: string;
};

export default function KpiCard({
  title,
  value,
  icon,
  borderColorClass,
  iconColorClass,
  trend,
  trendLabel,
  trendDirection = 'neutral',
  className = '',
}: KpiCardProps) {
  const getTrendStyles = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-emerald-600';
      case 'down':
        return 'text-red-600';
      case 'warning':
        return 'text-red-600';
      case 'neutral':
      default:
        return 'text-slate-500';
    }
  };

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return 'arrow_upward';
      case 'down':
        return 'arrow_downward';
      case 'warning':
        return 'warning';
      default:
        return null;
    }
  };

  const trendIconName = getTrendIcon();

  return (
    <div className={`bg-white rounded-xl p-5 shadow-[0_4px_12px_rgba(30,58,138,0.08)] border-l-4 ${borderColorClass} flex flex-col justify-between h-[120px] ${className}`}>
      <div className="flex justify-between items-start">
        <span className="font-sidebar-label text-sidebar-label text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <span className={`material-symbols-outlined opacity-80 ${iconColorClass}`}>
          {icon}
        </span>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="font-kpi-value text-kpi-value text-slate-900">{value}</span>
        
        {(trend || trendLabel) && (
          <span className={`text-sm font-medium flex items-center ${getTrendStyles()}`}>
            {trendIconName && (
              <span className="material-symbols-outlined text-[14px] mr-1">{trendIconName}</span>
            )}
            {trend} {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}

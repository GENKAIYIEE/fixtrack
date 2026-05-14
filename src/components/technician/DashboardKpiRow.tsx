'use client';

type KpiData = {
  totalAssigned: number;
  ongoing: number;
  completedToday: number;
  completedThisMonth: number;
};

type DashboardKpiRowProps = {
  kpis: KpiData;
  isLoading?: boolean;
};

const KpiSkeleton = () => (
  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_12px_rgba(30,58,138,0.08)] flex flex-col relative overflow-hidden animate-pulse">
    <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
    <div className="h-8 w-16 bg-slate-200 rounded" />
    <div className="absolute right-6 top-6 w-10 h-10 bg-slate-100 rounded-full" />
  </div>
);

export default function DashboardKpiRow({ kpis, isLoading }: DashboardKpiRowProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Assigned',
      value: kpis.totalAssigned,
      icon: 'assignment',
      borderColor: 'border-l-4 border-primary-container',
      iconColor: 'text-primary-container/20',
    },
    {
      label: 'Ongoing',
      value: kpis.ongoing,
      icon: 'pending_actions',
      borderColor: 'border-l-4 border-secondary-container',
      iconColor: 'text-secondary-container/20',
    },
    {
      label: 'Completed Today',
      value: kpis.completedToday,
      icon: 'task_alt',
      borderColor: 'border-l-4 border-tertiary-container',
      iconColor: 'text-tertiary-container/20',
    },
    {
      label: 'Completed This Month',
      value: kpis.completedThisMonth,
      icon: 'date_range',
      borderColor: 'border-l-4 border-[#6e2c00]/40',
      iconColor: 'text-[#6e2c00]/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_12px_rgba(30,58,138,0.08)] flex flex-col relative overflow-hidden ${card.borderColor}`}
        >
          <span className="font-sidebar-label text-sidebar-label text-outline uppercase mb-2">
            {card.label}
          </span>
          <span className="font-kpi-value text-kpi-value text-on-surface">{card.value}</span>
          <span
            className={`material-symbols-outlined absolute right-6 top-6 text-4xl ${card.iconColor}`}
            style={{ fontVariationSettings: "'FILL' 1", fontSize: '48px' }}
          >
            {card.icon}
          </span>
        </div>
      ))}
    </div>
  );
}

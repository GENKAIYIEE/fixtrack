'use client';

type KpiData = {
  totalRequests: number;
  pendingCount: number;
  ongoingCount: number;
  completedCount: number;
};

type Props = {
  data: KpiData | null;
  isLoading: boolean;
};

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_12px_rgba(30,58,138,0.08)] animate-pulse flex flex-col gap-3">
      <div className="h-3 w-28 bg-outline-variant/30 rounded" />
      <div className="h-9 w-16 bg-outline-variant/30 rounded" />
      <div className="h-3 w-36 bg-outline-variant/20 rounded" />
    </div>
  );
}

export default function StudentDashboardKpiRow({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const cards = [
    {
      label: 'TOTAL REQUESTS',
      value: data?.totalRequests ?? 0,
      icon: 'assignment',
      borderColor: 'border-primary-container',
      iconColor: 'text-primary-container/20',
      subtext: null,
    },
    {
      label: 'PENDING REVIEW',
      value: data?.pendingCount ?? 0,
      icon: 'pending_actions',
      borderColor: 'border-tertiary-container',
      iconColor: 'text-tertiary-container/20',
      subtext: 'Awaiting admin approval',
    },
    {
      label: 'IN PROGRESS',
      value: data?.ongoingCount ?? 0,
      icon: 'construction',
      borderColor: 'border-secondary-container',
      iconColor: 'text-secondary-container/20',
      subtext: 'Technician assigned',
    },
    {
      label: 'COMPLETED',
      value: data?.completedCount ?? 0,
      icon: 'task_alt',
      borderColor: 'border-secondary',
      iconColor: 'text-secondary/20',
      subtext: 'Successfully resolved',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_12px_rgba(30,58,138,0.08)] flex flex-col relative overflow-hidden border-l-4 ${card.borderColor}`}
        >
          {/* Background icon */}
          <span
            className={`material-symbols-outlined absolute right-6 top-6 text-4xl ${card.iconColor} select-none`}
            style={{ fontVariationSettings: "'FILL' 1", fontSize: '48px' }}
          >
            {card.icon}
          </span>

          {/* Label */}
          <span className="font-sidebar-label text-sidebar-label text-outline uppercase mb-2 tracking-widest text-[10px]">
            {card.label}
          </span>

          {/* Value */}
          <span className="font-kpi-value text-kpi-value text-on-surface text-4xl font-black leading-none">
            {card.value}
          </span>

          {/* Subtext */}
          {card.subtext && (
            <span className="font-body-sm text-body-sm text-outline mt-1 text-xs">
              {card.subtext}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

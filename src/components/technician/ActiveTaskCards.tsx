'use client';

import { useRouter } from 'next/navigation';

type Submitter = {
  firstName: string;
  lastName: string;
};

type ActiveTask = {
  id: string;
  requestCode: string;
  issueType: string;
  building: string;
  roomNumber: string;
  description: string;
  urgencyLevel: string;
  status: string;
  createdAt: string;
  submitter: Submitter;
};

type ActiveTaskCardsProps = {
  tasks: ActiveTask[];
  isLoading?: boolean;
};

const BUILDING_LABELS: Record<string, string> = {
  IT_BUILDING: 'IT Building',
  ADMIN_BUILDING: 'Admin Building',
  LIBRARY: 'Library',
  GYMNASIUM: 'Gymnasium',
  CANTEEN: 'Canteen',
  DORMITORY: 'Dormitory',
  OTHERS: 'Others',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

function UrgencyBadge({ level }: { level: string }) {
  if (level === 'URGENT') {
    return (
      <span className="bg-error text-on-error rounded-full px-3 py-1.5 font-sidebar-label text-sidebar-label uppercase flex items-center gap-1">
        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>warning</span>
        Urgent
      </span>
    );
  }
  if (level === 'HIGH') {
    return (
      <span className="bg-tertiary-container text-white rounded-full px-3 py-1.5 font-sidebar-label text-sidebar-label uppercase">
        High
      </span>
    );
  }
  return (
    <span className="bg-surface-variant text-on-surface-variant rounded-full px-3 py-1.5 font-sidebar-label text-sidebar-label uppercase">
      Standard
    </span>
  );
}

function CardSkeleton() {
  return (
    <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_rgba(30,58,138,0.06)] border border-surface-variant p-6 animate-pulse">
      <div className="border-b border-surface-variant pb-4 mb-4">
        <div className="h-5 w-32 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-48 bg-slate-100 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="col-span-2 h-16 w-full bg-slate-100 rounded" />
      </div>
      <div className="border-t border-surface-variant pt-4 flex justify-between">
        <div className="w-10 h-10 rounded-full bg-slate-200" />
        <div className="h-10 w-36 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

export default function ActiveTaskCards({ tasks, isLoading }: ActiveTaskCardsProps) {
  const router = useRouter();

  return (
    <section>
      <h2 className="font-h2 text-h2 text-on-surface mb-6">My Active Task Cards</h2>

      {isLoading ? (
        <div className="grid grid-cols-12 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm">
          <span
            className="material-symbols-outlined text-outline/40 mb-4"
            style={{ fontSize: '56px', fontVariationSettings: "'FILL' 1" }}
          >
            task_alt
          </span>
          <p className="font-label-md text-label-md text-outline">No active tasks right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="col-span-12 lg:col-span-6 bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_rgba(30,58,138,0.06)] border border-surface-variant p-6 flex flex-col justify-between hover:shadow-[0_12px_32px_rgba(30,58,138,0.1)] transition-all duration-300"
            >
              {/* Card Header */}
              <div className="border-b border-surface-variant pb-4 mb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-h2 text-[20px] text-on-surface font-bold leading-tight">
                      {task.requestCode}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-surface-container-high text-on-surface-variant font-sidebar-label text-sidebar-label px-2 py-1 rounded">
                        {task.issueType}
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">
                        Reported {timeAgo(task.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <UrgencyBadge level={task.urgencyLevel} />
                    <span className="bg-secondary-container text-white rounded-full px-3 py-1.5 font-sidebar-label text-sidebar-label uppercase">
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-outline">
                    <span className="material-symbols-outlined text-sm" style={{ fontSize: '16px' }}>
                      person
                    </span>
                    <span className="font-sidebar-label text-sidebar-label uppercase">Requester</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface">
                    {task.submitter.firstName} {task.submitter.lastName}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-outline">
                    <span className="material-symbols-outlined text-sm" style={{ fontSize: '16px' }}>
                      location_on
                    </span>
                    <span className="font-sidebar-label text-sidebar-label uppercase">Location</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface">
                    {BUILDING_LABELS[task.building] ?? task.building}
                    {task.roomNumber ? ` — ${task.roomNumber}` : ''}
                  </span>
                </div>

                <div className="col-span-2 bg-surface-container-low p-4 rounded-lg border border-surface-variant">
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                    {task.description}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t border-surface-variant pt-4 flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-on-primary-container"
                    style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}
                  >
                    engineering
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/technician/tasks/${task.id}`)}
                  className="bg-[#2563EB] hover:bg-[#1E3A8A] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors duration-200 font-label-md text-label-md"
                >
                  Update Status
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

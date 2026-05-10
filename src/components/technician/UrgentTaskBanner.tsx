'use client';

import { useRouter } from 'next/navigation';

type UrgentTask = {
  id: string;
  description: string;
  requestCode: string;
};

type UrgentTaskBannerProps = {
  urgentTask: UrgentTask | null;
};

export default function UrgentTaskBanner({ urgentTask }: UrgentTaskBannerProps) {
  const router = useRouter();

  if (!urgentTask) return null;

  const preview =
    urgentTask.description.length > 80
      ? urgentTask.description.slice(0, 80) + '…'
      : urgentTask.description;

  return (
    <div className="bg-error-container border border-error/20 rounded-xl p-4 flex items-center justify-between shadow-sm mb-6">
      <div className="flex items-center gap-4">
        {/* Red icon circle */}
        <div className="w-10 h-10 rounded-full bg-error flex items-center justify-center flex-shrink-0">
          <span
            className="material-symbols-outlined text-white text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            notifications_active
          </span>
        </div>
        <div>
          <p className="font-label-md text-label-md text-on-error-container font-bold leading-tight">
            New Urgent Task Assigned
          </p>
          <p className="font-body-sm text-body-sm text-on-error-container/80 mt-0.5">
            <span className="font-semibold">{urgentTask.requestCode}</span> — {preview}
          </p>
        </div>
      </div>

      {/* FIXED: BUG #4 — Navigate to task detail if id available; broken ?filter=urgent removed */}
      <button
        onClick={() => router.push(urgentTask.id ? `/technician/tasks/${urgentTask.id}` : '/technician/tasks')}
        className="bg-surface-container-lowest text-error font-label-md px-4 py-2 rounded-lg border border-error/20 hover:bg-surface-container-low transition-colors duration-200 flex-shrink-0 ml-4"
      >
        View Task
      </button>

    </div>
  );
}

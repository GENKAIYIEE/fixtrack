import React from 'react';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';

interface TimelineEvent {
  id: string;
  type: 'STATUS_CHANGE' | 'NOTES_UPDATED' | 'ASSIGNMENT';
  title: string;
  description: string;
  date: string;
  status?: string;
}

interface TaskActivityTimelineProps {
  task: any;
}

export const TaskActivityTimeline: React.FC<TaskActivityTimelineProps> = ({ task }) => {
  const events: TimelineEvent[] = [];

  if (task.assignedAt) {
    events.push({
      id: `assign-${task.id}`,
      type: 'ASSIGNMENT',
      title: 'Task Assigned',
      description: `Assigned to ${task.assignee?.firstName || ''} ${task.assignee?.lastName || ''}`.trim(),
      date: task.assignedAt,
    });
  }

  if (task.statusHistory && Array.isArray(task.statusHistory)) {
    const deduplicatedHistory = task.statusHistory.filter((entry: any, index: number, arr: any[]) => {
      return (
        index ===
        arr.findIndex(
          (e: any) =>
            e.newStatus === entry.newStatus &&
            Math.abs(new Date(e.changedAt).getTime() - new Date(entry.changedAt).getTime()) < 60000
        )
      );
    });

    deduplicatedHistory.forEach((history: any) => {
      events.push({
        id: history.id,
        type: 'STATUS_CHANGE',
        title: `Status Changed to ${history.newStatus}`,
        description: `Updated by ${history.actor?.firstName || 'System'} ${history.actor?.lastName || ''}`.trim(),
        date: history.changedAt,
        status: history.newStatus,
      });
    });
  }

  if (task.repairNote) {
    events.push({
      id: `note-${task.repairNote.id}`,
      type: 'NOTES_UPDATED',
      title: 'Notes Updated',
      description: `Repair notes updated by ${task.assignee?.firstName || ''} ${task.assignee?.lastName || ''}`.trim(),
      date: task.repairNote.updatedAt || task.repairNote.createdAt,
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getEventIconAndColor = (event: TimelineEvent) => {
    if (event.type === 'NOTES_UPDATED') {
      return { icon: 'edit_document', bg: 'bg-slate-100', text: 'text-slate-600' };
    }
    if (event.type === 'ASSIGNMENT') {
      return { icon: 'person_add', bg: 'bg-indigo-100', text: 'text-indigo-600' };
    }
    if (event.type === 'STATUS_CHANGE') {
      switch (event.status) {
        case 'ONGOING':
          return { icon: 'engineering', bg: 'bg-blue-100', text: 'text-blue-600' };
        case 'PENDING':
          return { icon: 'pause', bg: 'bg-amber-100', text: 'text-amber-600' };
        case 'COMPLETED':
          return { icon: 'check_circle', bg: 'bg-green-100', text: 'text-green-600' };
        default:
          return { icon: 'circle', bg: 'bg-slate-100', text: 'text-slate-600' };
      }
    }
    return { icon: 'circle', bg: 'bg-slate-100', text: 'text-slate-600' };
  };

  const formatEventDate = (dateString: string) => {
    const relativeTime = formatRelativeTime(dateString);
    const exactTime = new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${relativeTime} • ${exactTime}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.08)] border border-slate-100 p-6">
      <div className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#2563EB]">history</span>
        Activity Timeline
      </div>

      <div className="relative">
        {events.length > 0 && (
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
        )}

        <div>
          {events.length === 0 ? (
            <p className="text-slate-500 italic pl-10">No activity recorded yet.</p>
          ) : (
            events.map((event) => {
              const { icon, bg, text } = getEventIconAndColor(event);
              return (
                <div key={event.id} className="relative flex gap-4 pl-10 pb-5">
                  <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${bg} ${text} z-10`}>
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatEventDate(event.date)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

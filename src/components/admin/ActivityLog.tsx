import React from 'react';

interface ActivityLogProps {
  statusHistory: any[];
}

export default function ActivityLog({ statusHistory }: ActivityLogProps) {
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const timeFormat = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Today, ${timeFormat}`;
    }
    return `${date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, ${timeFormat}`;
  };

  const getActionDescription = (item: any) => {
    if (item.remarks) return item.remarks;
    if (item.previousStatus && item.newStatus) {
      return `Status changed from ${item.previousStatus} to ${item.newStatus}`;
    }
    if (!item.previousStatus && item.newStatus === 'PENDING') {
      return 'Request Submitted';
    }
    return `Status updated to ${item.newStatus}`;
  };

  return (
    <div className="bg-surface rounded-xl overflow-hidden border border-outline-variant shadow-sm p-6 mb-6">
      <h3 className="text-lg font-bold text-on-surface mb-6">Activity Log</h3>

      {statusHistory.length === 0 ? (
        <p className="text-on-surface-variant text-sm">No activity recorded yet.</p>
      ) : (
        <div className="relative pl-4 border-l-2 border-surface-container space-y-8">
          {statusHistory.map((item, index) => {
            const isMostRecent = index === 0;
            return (
              <div key={item.id} className="relative">
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-surface ${
                    isMostRecent ? 'bg-secondary-container' : 'bg-surface-container-highest'
                  }`}
                />

                {/* Log Content */}
                <div>
                  <p className="text-on-surface font-medium">{getActionDescription(item)}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {formatTimestamp(item.changedAt)}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    by {item.actor?.firstName} {item.actor?.lastName} {item.actor?.role ? `(${item.actor.role})` : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

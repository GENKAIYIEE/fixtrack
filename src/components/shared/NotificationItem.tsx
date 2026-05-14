import React from 'react';
import { NotifType } from '@prisma/client';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';

interface NotificationItemProps {
  notification: {
    id: string;
    type: NotifType;
    title: string;
    message: string;
    isRead: boolean;
    requestId: string | null;
    createdAt: string;
  };
  onMarkRead: (id: string) => void;
  onNavigate: (requestId: string | null, type: string) => void;
}

const getIconConfig = (type: NotifType, isRead: boolean) => {
  if (isRead) {
    return {
      icon: 'notifications', // Default read icon, but task says "Read notifications always use: bg-surface-container-highest text-on-surface-variant regardless of type", Wait, what icon for read? The prompt says "Read notifications always use: bg-surface-container-highest text-on-surface-variant regardless of type" but it doesn't say icon changes. Oh wait, it lists them for all types. Let's just use the same icon mapping but override color for read.
      bg: 'bg-surface-container-highest',
      text: 'text-on-surface-variant',
    };
  }

  switch (type) {
    case 'TASK_ASSIGNED':
      return { icon: 'warning', bg: 'bg-error-container', text: 'text-on-error-container', fill: 1 };
    case 'REMINDER':
      return { icon: 'schedule', bg: 'bg-tertiary-fixed', text: 'text-on-tertiary-fixed', fill: 1 };
    case 'STATUS_UPDATED':
      return { icon: 'check_circle', bg: 'bg-surface-container-highest', text: 'text-on-surface-variant', fill: 0 };
    case 'REQUEST_SUBMITTED':
      return { icon: 'assignment', bg: 'bg-primary-fixed', text: 'text-on-primary-fixed', fill: 0 };
    case 'REQUEST_APPROVED':
      return { icon: 'task_alt', bg: 'bg-secondary-fixed', text: 'text-on-secondary-fixed', fill: 0 };
    case 'REQUEST_REJECTED':
      return { icon: 'cancel', bg: 'bg-error-container', text: 'text-on-error-container', fill: 0 };
    case 'REQUEST_CANCELLED':
      return { icon: 'remove_circle', bg: 'bg-surface-container-highest', text: 'text-on-surface-variant', fill: 0 };
    case 'TASK_COMPLETED':
      return { icon: 'verified', bg: 'bg-secondary-fixed', text: 'text-on-secondary-fixed', fill: 0 };
    default:
      return { icon: 'notifications', bg: 'bg-surface-container-highest', text: 'text-on-surface-variant', fill: 0 };
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onNavigate,
}) => {
  const { id, type, title, message, isRead, requestId, createdAt } = notification;

  // Recompute icon config with the base type to get the icon string, then apply read styles if needed
  let config = getIconConfig(type, false);
  if (isRead) {
    config = { ...config, bg: 'bg-surface-container-highest', text: 'text-on-surface-variant' };
  }

  const handleClick = () => {
    if (!isRead) {
      onMarkRead(id);
    }
    if (requestId) {
      onNavigate(requestId, type);
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isRead) {
      onMarkRead(id);
    }
    if (requestId) {
      onNavigate(requestId, type);
    }
  };

  const renderMessage = () => {
    const parts = message.split(/(REQ-\d+)/g);
    return parts.map((part, index) => {
      if (/^REQ-\d+$/.test(part)) {
        return (
          <span key={index} className="font-medium text-on-surface">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const isUrgentTask = type === 'TASK_ASSIGNED' && message.toLowerCase().includes('urgent');

  return (
    <div
      onClick={handleClick}
      className={`
        rounded-xl p-5 flex gap-4 items-start relative
        ${
          !isRead
            ? 'bg-surface-container-lowest shadow-[0_4px_12px_rgba(30,58,138,0.08)] overflow-hidden hover:shadow-[0_8px_24px_rgba(30,58,138,0.12)] transition-shadow cursor-pointer'
            : 'bg-surface-container-lowest shadow-sm border border-outline-variant/30 opacity-75 hover:opacity-100 transition-opacity cursor-pointer'
        }
      `}
    >
      {!isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />}

      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${config.bg} ${config.text}`}
      >
        <span
          className="material-symbols-outlined"
          style={config.fill ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {config.icon}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1 gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`font-label-md text-label-md text-on-surface ${
                !isRead ? 'font-bold' : ''
              }`}
            >
              {title}
            </span>
            {isUrgentTask && !isRead && (
              <span className="inline-flex px-2 py-0.5 rounded-full bg-error text-on-error text-[10px] font-bold uppercase tracking-wide">
                Urgent
              </span>
            )}
          </div>
          <span className="text-xs text-outline shrink-0">{formatRelativeTime(createdAt)}</span>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">
          {renderMessage()}
        </p>

        {!isRead && (type === 'TASK_ASSIGNED' || type === 'REMINDER') && (
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleActionClick}
              className="px-4 py-1.5 bg-secondary text-on-secondary font-label-md text-label-md rounded-lg hover:opacity-90 transition-colors"
            >
              View Task
            </button>
          </div>
        )}
      </div>

      {!isRead && (
        <div className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0 mt-2 ml-auto" />
      )}
    </div>
  );
};

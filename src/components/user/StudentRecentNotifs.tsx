'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  requestId: string | null;
  createdAt: string;
};

type Props = {
  notifications: Notification[] | null;
  unreadCount: number;
  isLoading: boolean;
};

type IconConfig = {
  icon: string;
  bgColor: string;
  textColor: string;
};

const notifIconMap: Record<string, IconConfig> = {
  TASK_ASSIGNED: {
    icon: 'assignment',
    bgColor: 'bg-primary-fixed',
    textColor: 'text-on-primary-fixed',
  },
  REQUEST_SUBMITTED: {
    icon: 'assignment',
    bgColor: 'bg-primary-fixed',
    textColor: 'text-on-primary-fixed',
  },
  REQUEST_APPROVED: {
    icon: 'assignment',
    bgColor: 'bg-primary-fixed',
    textColor: 'text-on-primary-fixed',
  },
  STATUS_UPDATED: {
    icon: 'update',
    bgColor: 'bg-secondary-fixed',
    textColor: 'text-on-secondary-fixed',
  },
  TASK_COMPLETED: {
    icon: 'verified',
    bgColor: 'bg-secondary-fixed',
    textColor: 'text-on-secondary-fixed',
  },
  REQUEST_REJECTED: {
    icon: 'cancel',
    bgColor: 'bg-error-container',
    textColor: 'text-on-error-container',
  },
  REQUEST_CANCELLED: {
    icon: 'remove_circle',
    bgColor: 'bg-surface-container-highest',
    textColor: 'text-on-surface-variant',
  },
  REMINDER: {
    icon: 'schedule',
    bgColor: 'bg-tertiary-fixed',
    textColor: 'text-on-tertiary-fixed',
  },
};

const defaultIcon: IconConfig = {
  icon: 'notifications',
  bgColor: 'bg-surface-container-highest',
  textColor: 'text-on-surface-variant',
};

function SkeletonItem() {
  return (
    <div className="px-5 py-4 border-b border-outline-variant last:border-0 animate-pulse flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-outline-variant/20 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 w-3/4 bg-outline-variant/20 rounded" />
        <div className="h-3 w-full bg-outline-variant/15 rounded" />
        <div className="h-2 w-1/4 bg-outline-variant/10 rounded" />
      </div>
    </div>
  );
}

export default function StudentRecentNotifs({ notifications, unreadCount, isLoading }: Props) {
  const router = useRouter();

  const handleNotifClick = async (notif: Notification) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id }),
      });
    } catch {
      // silently fail
    }
    if (notif.requestId) {
      router.push(`/user/requests/${notif.requestId}`);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between gap-2">
        <span className="font-h2 text-[20px] text-on-surface font-semibold">Notifications</span>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="bg-error text-on-error text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
          <Link
            href="/user/notifications"
            className="font-label-md text-label-md text-secondary hover:underline underline-offset-4 text-sm"
          >
            View All →
          </Link>
        </div>
      </div>

      {/* Notification Items */}
      {isLoading ? (
        <>
          <SkeletonItem />
          <SkeletonItem />
          <SkeletonItem />
        </>
      ) : !notifications || notifications.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-3">
          <span
            className="material-symbols-outlined text-outline"
            style={{ fontSize: '40px' }}
          >
            notifications_off
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant text-sm">
            No notifications yet
          </span>
        </div>
      ) : (
        notifications.map((notif) => {
          const config = notifIconMap[notif.type] ?? defaultIcon;
          const isUnread = !notif.isRead;

          return (
            <div
              key={notif.id}
              onClick={() => handleNotifClick(notif)}
              className={`relative px-5 py-4 border-b border-outline-variant last:border-0 cursor-pointer
                hover:bg-surface-container-low transition-colors flex items-start gap-3
                ${!isUnread ? 'opacity-70 hover:opacity-100 transition-opacity' : ''}`}
            >
              {/* Unread accent bar */}
              {isUnread && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-r" />
              )}

              {/* Icon circle */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${config.bgColor} ${config.textColor}`}
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1", fontSize: '18px' }}>
                  {config.icon}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-label-md text-label-md text-on-surface text-sm leading-snug ${isUnread ? 'font-bold' : ''}`}>
                  {notif.title}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs line-clamp-1 mt-0.5">
                  {notif.message}
                </p>
                <p className="text-xs text-outline mt-1">
                  {formatRelativeTime(notif.createdAt)}
                </p>
              </div>

              {/* Unread dot */}
              {isUnread && (
                <div className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-1" />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

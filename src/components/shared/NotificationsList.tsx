import React from 'react';
import { NotificationItem } from './NotificationItem';
import { NotifType } from '@prisma/client';

export interface NotificationRow {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  isRead: boolean;
  requestId: string | null;
  createdAt: string;
}

interface NotificationsListProps {
  notifications: NotificationRow[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onMarkRead: (id: string) => void;
  onNavigate: (requestId: string | null, type: string) => void;
  onLoadMore: () => void;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  isLoading,
  isLoadingMore,
  hasMore,
  onMarkRead,
  onNavigate,
  onLoadMore,
}) => {
  if (isLoading) {
    return (
      <div className="max-w-4xl flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-container-lowest rounded-xl p-5 flex gap-4 items-start shadow-sm border border-outline-variant/30 animate-pulse"
          >
            <div className="w-10 h-10 rounded-full bg-surface-container-highest shrink-0 mt-0.5"></div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-surface-container-highest rounded w-1/3"></div>
                <div className="h-3 bg-surface-container-highest rounded w-16"></div>
              </div>
              <div className="h-3 bg-surface-container-highest rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-surface-container-highest rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="max-w-4xl flex flex-col items-center justify-center py-24 gap-4">
        <span className="material-symbols-outlined text-outline text-[64px]">
          notifications_off
        </span>
        <p className="font-h2 text-h2 text-on-surface-variant">No Notifications</p>
        <p className="font-body-sm text-body-sm text-outline text-center max-w-sm">
          You are all caught up. New notifications will appear here when there is activity on your tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl flex flex-col gap-4">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkRead={onMarkRead}
          onNavigate={onNavigate}
        />
      ))}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2.5 bg-surface text-on-surface border border-outline-variant font-label-md text-label-md rounded-lg hover:bg-surface-container-low hover:border-outline transition-all flex items-center gap-2"
          >
            <span className={`material-symbols-outlined text-[18px] ${isLoadingMore ? 'animate-spin' : ''}`}>
              refresh
            </span>
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

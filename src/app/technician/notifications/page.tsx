'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationsList, NotificationRow } from '@/components/shared/NotificationsList';

// FIXED: BUG #6 — Extracted as module-level constant; safe to omit from useCallback deps
const NOTIFICATIONS_LIMIT = 10;

export default function TechnicianNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // FIXED: BUG #6 — Wrapped in useCallback; NOTIFICATIONS_LIMIT is module-level so no stale closure
  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const res = await fetch(`/api/notifications?page=${pageNum}&limit=${NOTIFICATIONS_LIMIT}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');

      const data = await res.json();
      setNotifications(prev => append ? [...prev, ...data.notifications] : data.notifications);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // FIXED: BUG #6 — fetchNotifications is now stable via useCallback, safe in deps
  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {

    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n)).sort((a, b) => {
        // Re-sort: unread first, then by date
        if (a.isRead === b.isRead) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.isRead ? 1 : -1;
      })
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true })).sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
    );
    setUnreadCount(0);

    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  };

  const handleNavigate = (requestId: string | null, type: string) => {
    if (!requestId) return;
    router.push(`/technician/tasks/${requestId}`);
  };

  const handleLoadMore = () => {
    // FIXED: BUG #6 — Uses primitive currentPage/totalPages instead of stale pagination object
    if (currentPage < totalPages) {
      fetchNotifications(currentPage + 1, true);
    }
  };

  return (
    <div className="p-8 pb-24">
      <div className="max-w-4xl flex items-center justify-between mb-8">
        <h1 className="font-h1 text-h1 text-on-surface">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="font-label-md text-label-md text-secondary hover:text-on-secondary-fixed-variant transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Mark All as Read
          </button>
        )}
      </div>

      <NotificationsList
        notifications={notifications}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={currentPage < totalPages}
        onMarkRead={handleMarkRead}
        onNavigate={handleNavigate}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}

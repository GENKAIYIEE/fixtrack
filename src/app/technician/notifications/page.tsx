'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/shared/Toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  requestId: string | null;
  createdAt: string;
}

export default function TechnicianNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const fetchNotifications = useCallback(async (pageNum = 1, isSilentPoll = false) => {
    try {
      if (pageNum > 1) setIsFetchingMore(true);
      
      // If polling, fetch enough to cover currently loaded pages to maintain state
      const currentLimit = isSilentPoll ? page * 20 : 20;
      const fetchPage = isSilentPoll ? 1 : pageNum;

      const res = await fetch(`/api/notifications?page=${fetchPage}&limit=${currentLimit}`);
      if (res.ok) {
        const data = await res.json();
        
        if (isSilentPoll || pageNum === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => {
            // Filter out duplicates to be safe
            const existingIds = new Set(prev.map(n => n.id));
            const newNotifs = data.notifications.filter((n: Notification) => !existingIds.has(n.id));
            return [...prev, ...newNotifs];
          });
        }
        
        setHasMore(data.pagination.page < data.pagination.totalPages);
      } else {
        if (!isSilentPoll) showToast('Failed to load notifications.', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      if (!isSilentPoll) showToast('A network error occurred.', 'error');
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications(1);
    
    // Polling interval (30 seconds)
    const interval = setInterval(() => {
      fetchNotifications(1, true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const markAllAsRead = async () => {
    // Optimistic update
    const previous = [...notifications];
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
    
    try {
      const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      if (!res.ok) throw new Error('API failed');
    } catch (error) {
      console.error('Failed to mark all as read', error);
      setNotifications(previous);
      showToast('Failed to mark all as read.', 'error');
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      const previous = [...notifications];
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
      
      try {
        const res = await fetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notif.id }),
        });
        if (!res.ok) throw new Error('API failed');
      } catch (error) {
        console.error('Failed to mark notification as read', error);
        setNotifications(previous);
        showToast('Failed to update notification.', 'error');
      }
    }

    if (notif.requestId) {
      router.push(`/technician/tasks/${notif.requestId}`);
    }
  };

  const deleteNotification = async (id: string) => {
    const previous = [...notifications];
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('API failed');
    } catch (error) {
      console.error('Failed to delete notification', error);
      setNotifications(previous);
      showToast('Failed to delete notification.', 'error');
    }
  };

  const clearReadNotifications = async () => {
    const previous = [...notifications];
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    
    try {
      const res = await fetch('/api/notifications/delete-read', { method: 'POST' });
      if (!res.ok) throw new Error('API failed');
    } catch (error) {
      console.error('Failed to clear read notifications', error);
      setNotifications(previous);
      showToast('Failed to clear read notifications.', 'error');
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return { icon: 'warning', bg: 'bg-red-100', text: 'text-red-600', filled: true };
      case 'STATUS_UPDATED':
        return { icon: 'info', bg: 'bg-blue-100', text: 'text-blue-600', filled: true };
      case 'TASK_COMPLETED':
        return { icon: 'check_circle', bg: 'bg-green-100', text: 'text-green-600', filled: true };
      case 'REMINDER':
        return { icon: 'schedule', bg: 'bg-amber-100', text: 'text-amber-600', filled: false };
      default:
        return { icon: 'notifications', bg: 'bg-slate-100', text: 'text-slate-600', filled: false };
    }
  };

  return (
    <div className="max-w-5xl mx-auto font-['Inter'] relative pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
        <div className="flex items-center gap-6">
          <button 
            onClick={clearReadNotifications}
            className="flex items-center gap-2 text-slate-500 font-medium hover:text-red-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
            Clear Read
          </button>
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-[#2563EB] font-medium hover:text-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">done_all</span>
            Mark All as Read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-4">
        {loading && notifications.length === 0 ? (
          <div className="animate-pulse flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 h-28 w-full" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">notifications_off</span>
            <p className="text-slate-500 font-medium">You have no notifications yet.</p>
          </div>
        ) : (
          <>
            {notifications.map((notif) => {
              const iconConfig = getIconForType(notif.type);
              return (
                <div 
                  key={notif.id}
                  className={`relative bg-white rounded-xl p-6 shadow-sm flex items-start gap-5 transition-all ${
                    !notif.isRead 
                      ? 'border border-blue-200 border-l-4 border-l-[#2563EB]' 
                      : 'border border-slate-200 border-l-4 border-l-transparent'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconConfig.bg}`}>
                    <span 
                      className={`material-symbols-outlined ${iconConfig.text}`}
                      style={iconConfig.filled ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {iconConfig.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="font-bold text-slate-900 text-lg">{notif.title}</h3>
                      <div className="flex items-center gap-3 shrink-0 mt-1">
                        <span className="text-xs font-medium text-slate-400">
                          {getRelativeTime(notif.createdAt)}
                        </span>
                        {!notif.isRead && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors flex items-center justify-center rounded-full ml-1"
                          title="Delete notification"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 mb-4">{notif.message}</p>
                    
                    {notif.requestId && (
                      <button
                        onClick={() => handleNotificationClick(notif)}
                        className="bg-[#2563EB] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        View Task
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isFetchingMore}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isFetchingMore ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Loading...
                    </>
                  ) : (
                    'Load Older Notifications'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}

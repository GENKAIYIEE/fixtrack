'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=5');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // fail silently
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'REQUEST_SUBMITTED': return 'assignment';
      case 'REQUEST_APPROVED': return 'check_circle';
      case 'REQUEST_REJECTED': return 'cancel';
      case 'REQUEST_CANCELLED': return 'not_interested';
      case 'STATUS_UPDATED': return 'update';
      case 'TASK_ASSIGNED': return 'person_add';
      case 'TASK_COMPLETED': return 'task_alt';
      default: return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'REQUEST_SUBMITTED': return 'text-primary';
      case 'REQUEST_APPROVED': return 'text-green-600';
      case 'REQUEST_REJECTED': return 'text-error';
      case 'REQUEST_CANCELLED': return 'text-outline';
      case 'STATUS_UPDATED': return 'text-secondary';
      case 'TASK_ASSIGNED': return 'text-orange-500';
      case 'TASK_COMPLETED': return 'text-green-700';
      default: return 'text-outline';
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-surface-container rounded-full p-2 transition-all text-outline hover:text-on-surface"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] bg-error text-on-error rounded-full flex items-center justify-center border-2 border-surface shadow-sm font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-80 bg-surface rounded-2xl shadow-xl border border-surface-container-high overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center p-4 border-b border-surface-container-high bg-surface-container-low">
            <h3 className="font-label-md text-on-surface">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[12px] text-primary font-medium hover:text-primary-fixed-variant transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b border-surface-container-high hover:bg-surface-container-low transition-colors flex gap-3 ${!notif.isRead ? 'bg-primary-fixed/20' : ''}`}
                >
                  <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center bg-surface-container shrink-0 ${getIconColor(notif.type)}`}>
                    <span className="material-symbols-outlined text-[18px]">{getIcon(notif.type)}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${!notif.isRead ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-outline mt-1 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-outline mt-2 font-medium">{formatTime(notif.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">notifications_off</span>
                <p className="text-sm text-outline">No notifications yet</p>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-surface-container-high bg-surface-container-low text-center">
            <button 
              onClick={() => {
                setIsOpen(false);
                router.push('/user/notifications');
              }}
              className="text-sm text-primary font-medium hover:text-primary-fixed-variant transition-colors"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

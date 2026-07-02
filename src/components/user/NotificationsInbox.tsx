'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  requestId: string | null;
  createdAt: string;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ─── Icon / colour map ────────────────────────────────────────────────────────

type IconConfig = { icon: string; bgColor: string; textColor: string };

const notifIconMap: Record<string, IconConfig> = {
  TASK_ASSIGNED:      { icon: 'person_add',     bgColor: 'bg-primary-fixed',              textColor: 'text-on-primary-fixed' },
  REQUEST_SUBMITTED:  { icon: 'assignment',      bgColor: 'bg-primary-fixed',              textColor: 'text-on-primary-fixed' },
  REQUEST_APPROVED:   { icon: 'check_circle',    bgColor: 'bg-primary-fixed',              textColor: 'text-on-primary-fixed' },
  STATUS_UPDATED:     { icon: 'update',          bgColor: 'bg-secondary-fixed',            textColor: 'text-on-secondary-fixed' },
  TASK_COMPLETED:     { icon: 'verified',        bgColor: 'bg-secondary-fixed',            textColor: 'text-on-secondary-fixed' },
  REQUEST_REJECTED:   { icon: 'cancel',          bgColor: 'bg-error-container',            textColor: 'text-on-error-container' },
  REQUEST_CANCELLED:  { icon: 'remove_circle',   bgColor: 'bg-surface-container-highest',  textColor: 'text-on-surface-variant' },
  REMINDER:           { icon: 'schedule',        bgColor: 'bg-tertiary-fixed',             textColor: 'text-on-tertiary-fixed' },
};

const defaultIcon: IconConfig = {
  icon: 'notifications',
  bgColor: 'bg-surface-container-highest',
  textColor: 'text-on-surface-variant',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonItem() {
  return (
    <div className="px-6 py-4 border-b border-outline-variant last:border-0 animate-pulse flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-outline-variant/20 shrink-0" />
      <div className="flex-1 flex flex-col gap-2 pt-1">
        <div className="h-3.5 w-2/3 bg-outline-variant/20 rounded" />
        <div className="h-3 w-full bg-outline-variant/15 rounded" />
        <div className="h-2.5 w-1/4 bg-outline-variant/10 rounded" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const PAGE_LIMIT = 10;

export default function NotificationsInbox() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [confirmToast, setConfirmToast] = useState<{ show: boolean; targetId?: string; isAll?: boolean }>({ show: false });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async (targetPage = 1, isSilentPoll = false) => {
    if (!isSilentPoll) setIsLoading(true);
    try {
      const res = await fetch(
        `/api/notifications?page=${targetPage}&limit=${PAGE_LIMIT}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setPagination(data.pagination ?? null);
      setUnreadCount(data.unreadCount ?? 0);
      setPage(targetPage);
    } catch {
      // fail silently — network error
    } finally {
      if (!isSilentPoll) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
    
    // 30-second silent background poll for true real-time sync
    const interval = setInterval(() => {
      fetchNotifications(page, true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications, page]);

  // ── Mark single as read ────────────────────────────────────────────────────

  const handleNotifClick = async (notif: Notification) => {
    if (markingId) return; // debounce

    // Optimistic UI update
    if (!notif.isRead) {
      setMarkingId(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      try {
        await fetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notif.id }),
        });
      } catch {
        // revert on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: false } : n))
        );
        setUnreadCount((c) => c + 1);
      } finally {
        setMarkingId(null);
      }
    }

    if (notif.requestId) {
      router.push(`/requests/${notif.requestId}`);
    }
  };

  // ── Delete notification ───────────────────────────────────────────────────────

  const handleDeleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmToast({ show: true, targetId: id, isAll: false });
  };

  // ── Mark all as read ───────────────────────────────────────────────────────

  const handleMarkAllRead = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
    } catch {
      // revert
      fetchNotifications(page);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // ── Delete all read ────────────────────────────────────────────────────────

  const handleDeleteAllRead = async () => {
    const hasRead = notifications.some(n => n.isRead);
    if (!hasRead || isDeletingAll) return;
    setConfirmToast({ show: true, isAll: true });
  };

  const handleConfirmDelete = async () => {
    const { targetId, isAll } = confirmToast;
    setConfirmToast({ show: false });

    if (isAll) {
      setIsDeletingAll(true);
      // Optimistic delete
      setNotifications((prev) => prev.filter((n) => !n.isRead));

      try {
        await fetch('/api/notifications/delete-read', { method: 'POST' });
      } catch {
        fetchNotifications(page);
      } finally {
        setIsDeletingAll(false);
      }
    } else if (targetId) {
      // Optimistic delete
      setNotifications((prev) => prev.filter((n) => n.id !== targetId));

      try {
        await fetch(`/api/notifications/${targetId}`, { method: 'DELETE' });
      } catch {
        fetchNotifications(page);
      }
    }
  };

  // ── Pagination ─────────────────────────────────────────────────────────────

  const goToPage = (p: number) => {
    if (p < 1 || (pagination && p > pagination.totalPages)) return;
    fetchNotifications(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold text-on-surface">Inbox</h1>
          {unreadCount > 0 && (
            <span className="bg-error text-on-error text-xs font-bold px-2 py-0.5 rounded-full leading-none">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteAllRead}
            disabled={isDeletingAll || !notifications.some(n => n.isRead)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${!notifications.some(n => n.isRead)
                ? 'text-outline cursor-not-allowed opacity-50'
                : 'text-error hover:bg-error-container/40 active:scale-95'
              }`}
          >
            {isDeletingAll ? (
              <span className="material-symbols-outlined animate-spin text-base" style={{ fontSize: '16px' }}>progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-base" style={{ fontSize: '16px' }}>delete_sweep</span>
            )}
            Delete All Read
          </button>

          <button
            id="mark-all-read-btn"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll || unreadCount === 0}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${unreadCount === 0
                ? 'text-outline cursor-not-allowed opacity-50'
                : 'text-secondary hover:bg-secondary-container/40 active:scale-95'
              }`}
          >
          {isMarkingAll ? (
            <span
              className="material-symbols-outlined animate-spin text-base"
              style={{ fontSize: '16px' }}
            >
              progress_activity
            </span>
          ) : (
            <span className="material-symbols-outlined text-base" style={{ fontSize: '16px' }}>
              done_all
            </span>
          )}
          Mark all as read
        </button>
        </div>
      </div>

      {/* ── Card ── */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden">

        {isLoading ? (
          /* skeleton */
          <>
            {[...Array(6)].map((_, i) => <SkeletonItem key={i} />)}
          </>
        ) : notifications.length === 0 ? (
          /* empty state */
          <div className="py-20 flex flex-col items-center gap-3 text-center">
            <span
              className="material-symbols-outlined text-outline-variant"
              style={{ fontSize: '52px' }}
            >
              notifications_off
            </span>
            <p className="text-on-surface-variant font-medium text-base">
              You&apos;re all caught up
            </p>
            <p className="text-outline text-sm">
              New notifications will appear here.
            </p>
          </div>
        ) : (
          /* notification list */
          <ul role="list">
            {notifications.map((notif) => {
              const config = notifIconMap[notif.type] ?? defaultIcon;
              const isUnread = !notif.isRead;
              const isBeingMarked = markingId === notif.id;

              return (
                <li
                  key={notif.id}
                  id={`notif-${notif.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotifClick(notif)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNotifClick(notif)}
                  className={`relative flex items-start gap-4 px-6 py-4 border-b border-outline-variant
                    last:border-0 cursor-pointer select-none outline-none
                    transition-colors duration-150
                    focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset
                    ${isUnread
                      ? 'bg-primary-fixed/10 hover:bg-primary-fixed/20'
                      : 'bg-transparent hover:bg-surface-container-low opacity-80 hover:opacity-100'
                    }
                    ${isBeingMarked ? 'pointer-events-none' : ''}
                  `}
                >
                  {/* unread accent bar */}
                  {isUnread && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-secondary rounded-r" />
                  )}

                  {/* icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                      ${config.bgColor} ${config.textColor}`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}
                    >
                      {config.icon}
                    </span>
                  </div>

                  {/* content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug text-on-surface
                        ${isUnread ? 'font-semibold' : 'font-normal'}`}
                    >
                      {notif.title}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-outline mt-1.5 font-medium">
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>

                  {/* right-side indicators & actions */}
                  <div className="shrink-0 flex flex-col items-end gap-2 pt-1">
                    {isUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary block mb-1" />
                    )}
                    
                    <div className="flex items-center gap-2 mt-auto">
                      <button
                        onClick={(e) => handleDeleteNotif(e, notif.id)}
                        disabled={isUnread}
                        className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${
                          isUnread 
                            ? 'text-outline-variant opacity-50 cursor-not-allowed hidden' 
                            : 'text-outline hover:text-error hover:bg-error/10'
                        }`}
                        title={isUnread ? "Mark as read to delete" : "Delete notification"}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          delete
                        </span>
                      </button>

                      {notif.requestId && (
                        <span
                          className="material-symbols-outlined text-outline"
                          style={{ fontSize: '16px' }}
                        >
                          chevron_right
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-1 py-1">
          <p className="text-sm text-outline">
            Page <span className="font-medium text-on-surface-variant">{pagination.page}</span>{' '}
            of{' '}
            <span className="font-medium text-on-surface-variant">{pagination.totalPages}</span>
            {' '}·{' '}
            <span className="font-medium text-on-surface-variant">{pagination.total}</span> total
          </p>

          <div className="flex items-center gap-1">
            <button
              id="pagination-prev-btn"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1 || isLoading}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                text-on-surface-variant hover:bg-surface-container transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                chevron_left
              </span>
            </button>

            {[...Array(pagination.totalPages)].map((_, i) => {
              const p = i + 1;
              // show first, last, current ±1
              const show =
                p === 1 ||
                p === pagination.totalPages ||
                Math.abs(p - page) <= 1;

              if (!show) {
                if (p === 2 || p === pagination.totalPages - 1) {
                  return (
                    <span key={p} className="text-outline text-sm px-1">…</span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={p}
                  id={`pagination-page-${p}-btn`}
                  onClick={() => goToPage(p)}
                  disabled={isLoading}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                    disabled:cursor-not-allowed
                    ${p === page
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              id="pagination-next-btn"
              onClick={() => goToPage(page + 1)}
              disabled={page >= pagination.totalPages || isLoading}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                text-on-surface-variant hover:bg-surface-container transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Standard Confirmation Modal ── */}
      <ConfirmDeleteModal
        isOpen={confirmToast.show}
        onClose={() => setConfirmToast({ show: false })}
        onConfirm={handleConfirmDelete}
        isLoading={isDeletingAll}
        title={confirmToast.isAll ? "Delete All Read Notifications" : "Delete Notification"}
        description={confirmToast.isAll 
          ? "Are you sure you want to permanently delete all read notifications? This action cannot be undone."
          : "Are you sure you want to permanently delete this notification? This action cannot be undone."}
      />
    </div>
  );
}

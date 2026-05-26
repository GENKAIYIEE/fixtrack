'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

type RequestRecord = {
  id: string;
  requestCode: string;
  title: string;
  issueType: string;
  building: string;
  roomNumber: string;
  description: string;
  status: string;
  priorityLevel: string;
  urgencyLevel: string;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type Summary = {
  total: number;
  pending: number;
  ongoing: number;
  completed: number;
  rejected: number;
  cancelled: number;
};

const issueTypeLabels: Record<string, string> = {
  HVAC: 'HVAC',
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  CARPENTRY: 'Carpentry',
  STRUCTURAL: 'Structural',
  OTHERS: 'Others',
};

const buildingLabels: Record<string, string> = {
  IT_BUILDING: 'IT Building',
  ADMIN_BUILDING: 'Admin Building',
  LIBRARY: 'Library',
  GYMNASIUM: 'Gymnasium',
  CANTEEN: 'Canteen',
  DORMITORY: 'Dormitory',
  OTHERS: 'Others',
};

const STATUS_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  PENDING: {
    badge: 'bg-amber-100 text-amber-800 border border-amber-200',
    dot: 'bg-amber-500',
    label: 'Pending',
  },
  ONGOING: {
    badge: 'bg-blue-100 text-blue-800 border border-blue-200',
    dot: 'bg-blue-500',
    label: 'In Progress',
  },
  COMPLETED: {
    badge: 'bg-green-100 text-green-800 border border-green-200',
    dot: 'bg-green-500',
    label: 'Completed',
  },
  REJECTED: {
    badge: 'bg-red-100 text-red-800 border border-red-200',
    dot: 'bg-red-500',
    label: 'Rejected',
  },
  CANCELLED: {
    badge: 'bg-slate-100 text-slate-600 border border-slate-200',
    dot: 'bg-slate-400',
    label: 'Cancelled',
  },
};

const TAB_FILTERS = ['All', 'Pending', 'Ongoing', 'Completed', 'Rejected', 'Cancelled'] as const;
type TabFilter = (typeof TAB_FILTERS)[number];

const tabToStatus: Record<TabFilter, string | null> = {
  All: null,
  Pending: 'PENDING',
  Ongoing: 'ONGOING',
  Completed: 'COMPLETED',
  Rejected: 'REJECTED',
  Cancelled: 'CANCELLED',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function SkeletonRow() {
  return (
    <tr className="border-b border-outline-variant/30">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-outline-variant/20 rounded-md animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-on-surface leading-none">{value}</p>
        <p className="text-xs text-on-surface-variant mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function RequestHistoryPage() {
  const [records, setRecords] = useState<RequestRecord[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 10;
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  useEffect(() => {
    fetch('/api/user/history')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load history');
        return res.json();
      })
      .then((data) => {
        setRecords(data.requests);
        setSummary(data.summary);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!records) return [];
    let list = records;
    const statusFilter = tabToStatus[activeTab];
    if (statusFilter) {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.requestCode.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          (issueTypeLabels[r.issueType] ?? r.issueType).toLowerCase().includes(q) ||
          (buildingLabels[r.building] ?? r.building).toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, activeTab, search]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * PAGE_LIMIT;
    return filtered.slice(startIndex, startIndex + PAGE_LIMIT);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PAGE_LIMIT);

  // ── Delete handlers ──────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`/api/user/requests/${deleteConfirmId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete request');
      }
      setRecords((prev) => (prev ? prev.filter((r) => r.id !== deleteConfirmId) : null));
      setToast({ message: 'Request cancelled successfully.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ message: err.message || 'An error occurred.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface flex items-center gap-3">
            <span
              className="material-symbols-outlined text-[#2563EB]"
              style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}
            >
              history
            </span>
            Request History
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            View all your submitted maintenance requests — track the date, time, and current status.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon="inbox" label="Total" value={summary.total} color="bg-[#2563EB]" />
          <StatCard icon="schedule" label="Pending" value={summary.pending} color="bg-amber-500" />
          <StatCard icon="engineering" label="Ongoing" value={summary.ongoing} color="bg-blue-500" />
          <StatCard icon="check_circle" label="Completed" value={summary.completed} color="bg-green-500" />
          <StatCard icon="cancel" label="Rejected / Cancelled" value={summary.rejected + summary.cancelled} color="bg-red-500" />
        </div>
      )}

      {/* Card: Filter + Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {TAB_FILTERS.map((tab) => (
              <button
                key={tab}
                id={`history-tab-${tab.toLowerCase()}`}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  activeTab === tab
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-primary-fixed/20'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">
              search
            </span>
            <input
              id="history-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 focus:border-[#2563EB] transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#1E3A8A]/10 text-on-surface text-xs font-semibold uppercase tracking-wider">
                <th className="px-5 py-3">Request ID</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Issue Type</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Date Submitted</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {isLoading ? (
                [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-error" style={{ fontSize: '40px' }}>
                        error
                      </span>
                      <p className="text-on-surface-variant font-medium">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span
                        className="material-symbols-outlined text-outline/60"
                        style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}
                      >
                        history
                      </span>
                      <p className="text-on-surface font-semibold text-lg">
                        {records && records.length === 0 ? 'No requests yet' : 'No results found'}
                      </p>
                      <p className="text-on-surface-variant text-sm max-w-xs text-center">
                        {records && records.length === 0
                          ? 'Once you submit a maintenance request it will appear here.'
                          : 'Try adjusting your search or filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((req, idx) => {
                  const style = STATUS_STYLES[req.status] ?? STATUS_STYLES['CANCELLED'];
                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-[#2563EB]/5 transition-colors duration-100 ${
                        idx % 2 === 0 ? '' : 'bg-surface-container/30'
                      }`}
                    >
                      {/* Request Code */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/requests/${req.id}`}
                          className="font-semibold text-[#2563EB] hover:underline underline-offset-2 text-sm"
                        >
                          {req.requestCode}
                        </Link>
                      </td>

                      {/* Title */}
                      <td className="px-5 py-4 max-w-[180px]">
                        <p className="text-on-surface text-sm font-medium truncate" title={req.title}>
                          {req.title}
                        </p>
                      </td>

                      {/* Issue Type */}
                      <td className="px-5 py-4 text-on-surface-variant text-sm">
                        {issueTypeLabels[req.issueType] ?? req.issueType}
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4 text-on-surface-variant text-sm whitespace-nowrap">
                        {buildingLabels[req.building] ?? req.building}
                        {req.roomNumber ? (
                          <span className="text-outline"> — {req.roomNumber}</span>
                        ) : null}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-on-surface-variant text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-outline text-[15px]">calendar_month</span>
                          {formatDate(req.createdAt)}
                        </div>
                      </td>

                      {/* Time */}
                      <td className="px-5 py-4 text-on-surface-variant text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-outline text-[15px]">schedule</span>
                          {formatTime(req.createdAt)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {style.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/requests/${req.id}`}
                            id={`view-request-${req.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-[#2563EB]/10 hover:text-[#2563EB] hover:border-[#2563EB]/30 transition-all"
                            title="View details"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </Link>
                          {req.status === 'PENDING' && (
                            <button
                              onClick={() => handleDelete(req.id)}
                              id={`delete-request-${req.id}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-error/10 hover:text-error hover:border-error/30 transition-all"
                              title="Cancel request"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count & Pagination */}
        {!isLoading && !error && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3 border-t border-outline-variant/40 bg-surface-container/30 gap-4">
            <p className="text-xs text-on-surface-variant">
              Showing <span className="font-semibold text-on-surface">{(page - 1) * PAGE_LIMIT + 1}</span> to <span className="font-semibold text-on-surface">{Math.min(page * PAGE_LIMIT, filtered.length)}</span> of <span className="font-semibold text-on-surface">{filtered.length}</span>{' '}
              {activeTab !== 'All' ? `${activeTab.toLowerCase()} ` : ''}
              {filtered.length === 1 ? 'request' : 'requests'}
              {search.trim() ? ` matching "${search.trim()}"` : ''}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
                </button>
                
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                  if (!show) {
                    if (p === 2 || p === totalPages - 1) return <span key={p} className="text-outline text-sm px-1">…</span>;
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-[#2563EB] text-white'
                          : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actionable Warning Toast for Deletion */}
      {deleteConfirmId && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 bg-white border border-slate-200 text-slate-800 px-5 py-4 rounded-xl shadow-2xl max-w-sm animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-500 text-[24px]">warning</span>
            <p className="text-sm font-medium leading-snug">
              Are you sure you want to permanently delete this request? This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={cancelDelete}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Standard Toast for Success/Error */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl max-w-sm animate-in slide-in-from-bottom-5 ${
          toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-amber-500'
        } text-white`}>
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'warning'}
          </span>
          <p className="text-sm font-medium leading-snug">{toast.message}</p>
        </div>
      )}
    </div>
  );
}

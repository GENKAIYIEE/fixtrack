'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import RequestsFilterBar from '@/components/admin/RequestsFilterBar';
import AllRequestsTable, { type RequestRow } from '@/components/admin/AllRequestsTable';
import Pagination from '@/components/admin/Pagination';
import RejectRequestModal from '@/components/admin/RejectRequestModal';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import ToastNotification from '@/components/shared/ToastNotification';
// AutoRefresh removed to fix redundant polling
import BulkAssignModal from '@/components/admin/BulkAssignModal';

// ── Page Component ────────────────────────────────────────────────────────────

export default function AdminRequestsPage() {
  const router = useRouter();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // ── Selection state ─────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ── Filter state refs to prevent stale closures and keystroke DDOS ────────────
  const filtersRef = useRef({
    search, statusFilter, priorityFilter, buildingFilter,
    assignedToFilter, issueTypeFilter, dateFrom, dateTo, page
  });

  // Keep refs up to date without triggering re-renders of fetchRequests
  useEffect(() => {
    filtersRef.current = {
      search, statusFilter, priorityFilter, buildingFilter,
      assignedToFilter, issueTypeFilter, dateFrom, dateTo, page
    };
  }, [search, statusFilter, priorityFilter, buildingFilter, assignedToFilter, issueTypeFilter, dateFrom, dateTo, page]);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);

  // Bulk assign modal state
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);

  // Delete modal + toast state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Technicians list for More Filters ───────────────────────────────────────
  const [technicians, setTechnicians] = useState<
    { id: string; firstName: string; lastName: string }[]
  >([]);

  // ── Fetch technicians on mount ───────────────────────────────────────────────
  useEffect(() => {
    async function loadTechnicians() {
      try {
        const res = await fetch('/api/users?role=TECHNICIAN&limit=1000');
        if (res.ok) {
          const data = await res.json();
          setTechnicians(data.users ?? []);
        }
      } catch {
        // Silently fail — technician filter will just be empty
      }
    }
    loadTechnicians();
  }, []);

  // ── Core fetch function ──────────────────────────────────────────────────────
  // FIXED: BUG-02 & BUG-03 — fetchRequests accepts an explicit pageOverride so it
  // can be called with a known page number without waiting for React state to flush.
  const fetchRequests = useCallback(
    async (overridePage?: number, reset?: boolean, silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const currentFilters = filtersRef.current;
        const params = new URLSearchParams();
        params.set('page', String(overridePage ?? currentFilters.page));
        params.set('limit', '10');
        
        if (!reset) {
          if (currentFilters.search) params.set('search', currentFilters.search);
          if (currentFilters.statusFilter) params.set('status', currentFilters.statusFilter);
          if (currentFilters.priorityFilter) params.set('priority', currentFilters.priorityFilter);
          if (currentFilters.buildingFilter) params.set('building', currentFilters.buildingFilter);
          if (currentFilters.assignedToFilter) params.set('assignedTo', currentFilters.assignedToFilter);
          if (currentFilters.issueTypeFilter) params.set('issueType', currentFilters.issueTypeFilter);
          if (currentFilters.dateFrom) params.set('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) params.set('dateTo', currentFilters.dateTo);
        }

        const res = await fetch(`/api/admin/requests?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setRequests(data.requests ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? 1);
      } catch (err) {
        console.error('Failed to fetch requests:', err);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [] // Empty dependency array prevents the Keystroke DDOS bug
  );

  // FIXED: BUG-03 — Removed the broad [page] useEffect that caused double-fetches
  // when filter handlers also called fetchRequests(1). Page changes are now handled
  // exclusively via handlePageChange below.

  // ── Initial load & Real-time Polling ─────────────────────────────────────────
  useEffect(() => {
    fetchRequests(1);
    
    // Real-time background polling every 15 seconds
    const timer = setInterval(() => {
      fetchRequests(undefined, false, true);
    }, 15000);
    
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchRequests]);

  // ── Filter handlers ──────────────────────────────────────────────────────────
  const handleApply = () => {
    setSelectedIds([]);
    fetchRequests(1);
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setBuildingFilter('');
    setAssignedToFilter('');
    setIssueTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setSelectedIds([]);
    setPage(1);
    fetchRequests(1, true);
  };

  // FIXED: BUG-03 — Page changes call fetchRequests directly with the new page
  // so there is no double-fetch from a separate [page] useEffect.
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedIds([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchRequests(newPage);
  };

  // ── Selection handlers ───────────────────────────────────────────────────────
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? requests.map((r) => r.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((sid) => sid !== id)
    );
  };

  // ── Row action handlers ──────────────────────────────────────────────────────
  const handleView = (id: string) => {
    router.push(`/admin/requests/${id}`);
  };

  const handleAssign = (id: string) => {
    router.push(`/admin/assignments?requestId=${id}`);
  };

  const handleReject = (id: string) => {
    setRejectingRequestId(id);
    setRejectModalOpen(true);
  };

  // Open the delete confirmation modal
  const handleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteModalOpen(true);
  };

  // Execute permanent delete after user confirms in the modal
  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/requests/${deletingId}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteModalOpen(false);
        setDeletingId(null);
        showToast('Request permanently deleted.', 'success');
        fetchRequests(page);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error ?? 'Failed to delete request. Please try again.', 'error');
      }
    } catch (err) {
      console.error('[confirmDelete]', err);
      showToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Derive the request object needed by RejectRequestModal ───────────────────
  const rejectingRequest = rejectingRequestId
    ? requests.find((r) => r.id === rejectingRequestId) ?? null
    : null;

  // Map RequestRow → the shape RejectRequestModal expects
  const rejectModalRequest = rejectingRequest
    ? {
        id: rejectingRequest.id,
        requestCode: rejectingRequest.requestCode,
        submitter: {
          firstName: rejectingRequest.submitter?.firstName ?? '',
          lastName: rejectingRequest.submitter?.lastName ?? '',
        },
        issueType: rejectingRequest.issueType as 'HVAC' | 'ELECTRICAL' | 'PLUMBING' | 'CARPENTRY' | 'STRUCTURAL' | 'OTHERS',
        urgencyLevel: rejectingRequest.urgencyLevel as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
        building: rejectingRequest.building as 'COLLEGE_BUILDING' | 'BASIC_EDUCATION_BUILDING',
        roomNumber: rejectingRequest.roomNumber,
        priorityLevel: rejectingRequest.priorityLevel,
      }
    : null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* AutoRefresh removed to prevent redundant polling */}
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-h1 text-h1 text-slate-900 leading-tight">
            All Maintenance Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage and track all facility maintenance tickets.
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <RequestsFilterBar
        search={search}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        buildingFilter={buildingFilter}
        assignedToFilter={assignedToFilter}
        issueTypeFilter={issueTypeFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        technicians={technicians}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onBuildingChange={setBuildingFilter}
        onAssignedToChange={setAssignedToFilter}
        onIssueTypeChange={setIssueTypeFilter}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApply={handleApply}
        onReset={handleReset}
      />

      {/* ── Bulk Action Bar — appears when checkboxes are selected ── */}
      {selectedIds.length > 0 && (
        <div className="bg-[#DBEAFE] border border-[#BFDBFE] rounded-xl px-5 py-3 mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
          <div className="flex items-center gap-3 text-[#1E3A8A]">
            <span className="material-symbols-outlined text-[20px]">check_box</span>
            <span className="font-semibold text-sm">
              {selectedIds.length} request{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedIds([])}
              className="text-sm font-medium text-[#1E3A8A] hover:underline"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setBulkAssignModalOpen(true)}
              className="bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">group_add</span>
              Bulk Assign
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <AllRequestsTable
        requests={requests}
        selectedIds={selectedIds}
        isLoading={isLoading}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onView={handleView}
        onAssign={handleAssign}
        onReject={handleReject}
        onDelete={handleDelete}
      />

      {/* ── Pagination ── */}
      {!isLoading && total > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={10}
          onPageChange={handlePageChange}
        />
      )}

      <RejectRequestModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectingRequestId(null);
        }}
        onConfirmed={() => {
          setRejectModalOpen(false);
          setRejectingRequestId(null);
          fetchRequests(page);
        }}
        request={rejectModalRequest}
      />

      {/* Bulk Assign modal */}
      <BulkAssignModal
        isOpen={bulkAssignModalOpen}
        requests={requests}
        selectedIds={selectedIds}
        technicians={technicians}
        onClose={() => setBulkAssignModalOpen(false)}
        onAssigned={() => {
          setBulkAssignModalOpen(false);
          setSelectedIds([]);
          showToast(`Successfully assigned ${selectedIds.length} request(s).`, 'success');
          fetchRequests(page);
        }}
      />

      {/* Permanent delete confirmation modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteModalOpen(false);
            setDeletingId(null);
          }
        }}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        variant="delete"
        itemLabel={deletingId ? `REQ-${requests.find(r => r.id === deletingId)?.requestCode ?? ''}` : undefined}
      />

      {/* Toast feedback */}
      <ToastNotification
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        visible={!!toast}
      />
    </div>
  );
}

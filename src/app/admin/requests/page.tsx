'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import RequestsFilterBar from '@/components/admin/RequestsFilterBar';
import AllRequestsTable, { type RequestRow } from '@/components/admin/AllRequestsTable';
import Pagination from '@/components/admin/Pagination';
// FIXED: BUG-10 — Import the real RejectRequestModal component
import RejectRequestModal from '@/components/admin/RejectRequestModal';

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
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // FIXED: BUG-10 — Reject modal state (replaces alert() placeholder)
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);

  // ── Technicians list for More Filters ───────────────────────────────────────
  const [technicians, setTechnicians] = useState<
    { id: string; firstName: string; lastName: string }[]
  >([]);

  // ── Fetch technicians on mount ───────────────────────────────────────────────
  useEffect(() => {
    async function loadTechnicians() {
      try {
        const res = await fetch('/api/users?role=TECHNICIAN&limit=100');
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
    async (overridePage?: number) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(overridePage ?? page));
        params.set('limit', '10');
        if (search) params.set('search', search);
        if (statusFilter) params.set('status', statusFilter);
        if (urgencyFilter) params.set('urgency', urgencyFilter);
        if (buildingFilter) params.set('building', buildingFilter);
        if (assignedToFilter) params.set('assignedTo', assignedToFilter);
        if (issueTypeFilter) params.set('issueType', issueTypeFilter);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);

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
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, search, statusFilter, urgencyFilter, buildingFilter, assignedToFilter, issueTypeFilter, dateFrom, dateTo]
  );

  // FIXED: BUG-07 — Trigger token for reset; toggling this causes a re-fetch with
  // cleared filters after React has flushed all state updates.
  const [shouldFetch, setShouldFetch] = useState(false);

  // FIXED: BUG-02 — Listen to shouldFetch toggle instead of calling fetchRequests
  // inside setTimeout (which captured stale closure values).
  useEffect(() => {
    fetchRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFetch]);

  // FIXED: BUG-03 — Removed the broad [page] useEffect that caused double-fetches
  // when filter handlers also called fetchRequests(1). Page changes are now handled
  // exclusively via handlePageChange below.

  // ── Filter handlers ──────────────────────────────────────────────────────────
  const handleApply = () => {
    setSelectedIds([]);
    fetchRequests(1);
    setPage(1);
  };

  // FIXED: BUG-02 — Reset now toggles shouldFetch instead of using setTimeout to
  // avoid stale closure capturing old filter values.
  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    setUrgencyFilter('');
    setBuildingFilter('');
    setAssignedToFilter('');
    setIssueTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setSelectedIds([]);
    setPage(1);
    // Flip the token — the useEffect above will call fetchRequests(1) after flush
    setShouldFetch(prev => !prev);
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

  // FIXED: BUG-10 — Replaced alert() placeholder with real modal open
  const handleReject = (id: string) => {
    setRejectingRequestId(id);
    setRejectModalOpen(true);
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
        building: rejectingRequest.building as 'IT_BUILDING' | 'ADMIN_BUILDING' | 'LIBRARY' | 'GYMNASIUM' | 'CANTEEN' | 'DORMITORY' | 'OTHERS',
        roomNumber: rejectingRequest.roomNumber,
      }
    : null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
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
        urgencyFilter={urgencyFilter}
        buildingFilter={buildingFilter}
        assignedToFilter={assignedToFilter}
        issueTypeFilter={issueTypeFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        technicians={technicians}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onUrgencyChange={setUrgencyFilter}
        onBuildingChange={setBuildingFilter}
        onAssignedToChange={setAssignedToFilter}
        onIssueTypeChange={setIssueTypeFilter}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApply={handleApply}
        onReset={handleReset}
      />

      {/* ── Bulk Action Bar — appears when checkboxes are selected ── */}


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

      {/* FIXED: BUG-10 — Real RejectRequestModal instead of alert() */}
      <RejectRequestModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectingRequestId(null);
        }}
        onConfirmed={() => {
          setRejectModalOpen(false);
          setRejectingRequestId(null);
          // Refresh list so rejected request updates in place
          fetchRequests(page);
        }}
        request={rejectModalRequest}
      />
    </div>
  );
}

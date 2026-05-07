'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import RequestsFilterBar from '@/components/admin/RequestsFilterBar';
import AllRequestsTable, { type RequestRow } from '@/components/admin/AllRequestsTable';
import Pagination from '@/components/admin/Pagination';

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

  // ── On mount + page change ───────────────────────────────────────────────────
  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ── Filter handlers ──────────────────────────────────────────────────────────
  const handleApply = () => {
    setSelectedIds([]);
    fetchRequests(1);
    setPage(1);
  };

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
    // Re-fetch with no filters
    setTimeout(() => fetchRequests(1), 0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedIds([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    // Screen 23 (Reject/Cancel Modal) — placeholder until that screen is built
    console.log('[Reject] Request ID:', id);
    alert(`Reject Modal — Screen 23 not yet built. Request ID: ${id}`);
  };

  // ── Bulk export (placeholder) ────────────────────────────────────────────────
  const handleExport = () => {
    console.log('[Export] All requests');
  };

  const handleExportSelected = () => {
    console.log('[Export Selected]', selectedIds);
  };

  const handleBulkAssign = () => {
    console.log('[Bulk Assign]', selectedIds);
    alert(`Bulk Assign — ${selectedIds.length} request(s) selected. Assign UI coming in Screen 12.`);
  };

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
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#2563EB] text-[#2563EB] rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors shadow-sm"
            id="btn-export-all"
          >
            <span className="material-symbols-outlined text-[18px]">export_notes</span>
            Export
          </button>
          {/* Bulk Assign */}
          <button
            onClick={handleBulkAssign}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            id="btn-bulk-assign"
          >
            <span className="material-symbols-outlined text-[18px]">group_add</span>
            Bulk Assign
          </button>
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
      {selectedIds.length > 0 && (
        <div className="mb-4 px-5 py-3 bg-[#DBEAFE] border border-[#93c5fd] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <p className="text-sm font-semibold text-[#1E3A8A]">
            <span className="material-symbols-outlined text-[16px] mr-1 align-middle">check_circle</span>
            {selectedIds.length} {selectedIds.length === 1 ? 'request' : 'requests'} selected
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkAssign}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              id="btn-bulk-assign-selection"
            >
              <span className="material-symbols-outlined text-[16px]">group_add</span>
              Bulk Assign
            </button>
            <button
              onClick={handleExportSelected}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#2563EB] text-[#2563EB] rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
              id="btn-export-selected"
            >
              <span className="material-symbols-outlined text-[16px]">export_notes</span>
              Export Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium underline underline-offset-2 transition-colors"
              id="btn-clear-selection"
            >
              Clear Selection
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
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AuditLogsFilterBar from '@/components/admin/AuditLogsFilterBar';
import AuditLogsTable, { AuditLogRow } from '@/components/admin/AuditLogsTable';
import AuditLogsPagination from '@/components/admin/AuditLogsPagination';
import Toast from '@/components/shared/Toast';

const LIMIT = 15;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toastConfig, setToastConfig] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  // FIXED: BUG-07 — Separated pagination into primitive values to prevent the
  // infinite re-render loop caused by setPagination(data.pagination) creating a
  // new object reference that triggered the fetchLogs dependency on pagination.page.
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // FIXED: BUG-07 — Reset to page 1 on search (primitive, no object reference churn)
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // FIXED: BUG-07 — fetchLogs depends on primitive values (page, debouncedSearch, etc.)
  // not on the pagination object, so it won't re-trigger when a new object is returned.
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (actionFilter) params.append('action', actionFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('page', page.toString());
      params.append('limit', LIMIT.toString());

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch logs');

      const data = await res.json();
      setLogs(data.logs);
      // FIXED: BUG-07 — Set primitive state values instead of whole pagination object
      setTotal(data.pagination?.total ?? data.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? data.totalPages ?? 1);
    } catch (error) {
      console.error(error);
      setToastConfig({ show: true, message: 'Failed to load audit logs', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, actionFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleActionChange = (val: string) => {
    setActionFilter(val);
    setPage(1);
  };

  const handleDateFromChange = (val: string) => {
    setDateFrom(val);
    setPage(1);
  };

  const handleDateToChange = (val: string) => {
    setDateTo(val);
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setDebouncedSearch('');
    setActionFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // Build pagination object shape expected by AuditLogsPagination component
  const paginationShape = { total, page, limit: LIMIT, totalPages };

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-h2 text-h2 text-on-surface">Audit Logs</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            System Activity Trail &amp; Record History
          </p>
        </div>
      </div>

      <AuditLogsFilterBar
        search={search}
        onSearchChange={setSearch}
        actionFilter={actionFilter}
        onActionChange={handleActionChange}
        dateFrom={dateFrom}
        onDateFromChange={handleDateFromChange}
        dateTo={dateTo}
        onDateToChange={handleDateToChange}
        onReset={handleReset}
      />

      <div className="flex flex-col gap-0">
        <AuditLogsTable
          logs={logs}
          isLoading={isLoading}
        />
        <AuditLogsPagination
          pagination={paginationShape}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {toastConfig.show && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onDismiss={() => setToastConfig({ ...toastConfig, show: false })}
        />
      )}
    </div>
  );
}

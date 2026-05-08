'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AuditLogsFilterBar from '@/components/admin/AuditLogsFilterBar';
import AuditLogsTable, { AuditLogRow } from '@/components/admin/AuditLogsTable';
import AuditLogsPagination from '@/components/admin/AuditLogsPagination';
import Toast from '@/components/shared/Toast';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [toastConfig, setToastConfig] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(p => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (actionFilter) params.append('action', actionFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error(error);
      setToastConfig({ show: true, message: 'Failed to load audit logs', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, actionFilter, dateFrom, dateTo, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleActionChange = (val: string) => {
    setActionFilter(val);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleDateFromChange = (val: string) => {
    setDateFrom(val);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleDateToChange = (val: string) => {
    setDateTo(val);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleReset = () => {
    setSearch('');
    setDebouncedSearch('');
    setActionFilter('');
    setDateFrom('');
    setDateTo('');
    setPagination({ total: 0, page: 1, limit: 15, totalPages: 1 });
  };

  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  const formatAction = (action: string) => {
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (actionFilter) params.append('action', actionFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('export', 'true');

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to export logs');
      
      const data = await res.json();
      
      const headers = ['Timestamp', 'User', 'Action', 'Record Type', 'Record ID', 'IP Address', 'Details'];
      const rows = data.logs.map((log: AuditLogRow) => [
        formatTimestamp(log.createdAt),
        log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
        formatAction(log.action),
        log.affectedRecordType || '',
        log.affectedRecordId || '',
        log.ipAddress || '',
        log.details || ''
      ]);

      const csv = [headers, ...rows].map(r => r.map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FixTrack_AuditLogs_${Date.now()}.csv`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setToastConfig({ show: true, message: 'Audit logs exported successfully', type: 'success' });
    } catch (error) {
      console.error('Export failed:', error);
      setToastConfig({ show: true, message: 'Failed to export audit logs', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

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
        
        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          className="bg-surface-container-lowest border border-outline-variant px-4 py-2 rounded text-on-surface hover:bg-surface-container-low shadow-sm font-label-md text-label-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <svg className="animate-spin h-[18px] w-[18px] text-on-surface" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          ) : (
            <span className="material-symbols-outlined text-[18px]">download</span>
          )}
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
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
          pagination={pagination}
          onPageChange={(page) => setPagination(p => ({ ...p, page }))}
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

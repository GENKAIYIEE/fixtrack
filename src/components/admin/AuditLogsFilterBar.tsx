'use client';

import React from 'react';

export interface AuditLogsFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  actionFilter: string;
  onActionChange: (val: string) => void;
  dateFrom: string;
  onDateFromChange: (val: string) => void;
  dateTo: string;
  onDateToChange: (val: string) => void;
  onReset: () => void;
}

const auditActions = [
  { value: '', label: 'All Action Types' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'REQUEST_SUBMITTED', label: 'Request Submitted' },
  { value: 'REQUEST_APPROVED', label: 'Request Approved' },
  { value: 'REQUEST_REJECTED', label: 'Request Rejected' },
  { value: 'REQUEST_CANCELLED', label: 'Request Cancelled' },
  { value: 'TASK_ASSIGNED', label: 'Task Assigned' },
  { value: 'TASK_REASSIGNED', label: 'Task Reassigned' },
  { value: 'STATUS_UPDATED', label: 'Status Updated' },
  { value: 'TASK_COMPLETED', label: 'Task Completed' },
  { value: 'USER_CREATED', label: 'User Created' },
  { value: 'USER_UPDATED', label: 'User Updated' },
  { value: 'USER_DEACTIVATED', label: 'User Deactivated' },
  { value: 'PASSWORD_RESET', label: 'Password Reset' }
];

export default function AuditLogsFilterBar({
  search,
  onSearchChange,
  actionFilter,
  onActionChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onReset
}: AuditLogsFilterBarProps) {
  return (
    <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm mb-6 flex flex-wrap items-center gap-4">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search logs, IPs, or Request IDs..."
          className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body text-on-surface focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Date Range Picker */}
      <div className="flex items-center gap-2 border border-outline-variant rounded-lg p-1 bg-surface-container-low">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-2 text-outline-variant text-[16px]">
            calendar_today
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-36 pl-8 pr-2 py-1.5 bg-transparent text-body-sm text-on-surface focus:outline-none"
            aria-label="From Date"
          />
        </div>
        <span className="text-outline font-body-sm px-1">to</span>
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-2 text-outline-variant text-[16px]">
            calendar_today
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-36 pl-8 pr-2 py-1.5 bg-transparent text-body-sm text-on-surface focus:outline-none"
            aria-label="To Date"
          />
        </div>
      </div>

      {/* Action Type Dropdown */}
      <select
        value={actionFilter}
        onChange={(e) => onActionChange(e.target.value)}
        className="px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body text-on-surface focus:outline-none focus:border-primary appearance-none pr-10 relative cursor-pointer min-w-[180px]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%2364748B\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
      >
        {auditActions.map((action) => (
          <option key={action.value} value={action.value}>
            {action.label}
          </option>
        ))}
      </select>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="bg-surface-container-high text-on-surface px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-highest transition-colors"
      >
        Reset
      </button>
    </div>
  );
}

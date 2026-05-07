'use client';

import React, { useState } from 'react';

type FilterBarProps = {
  search: string;
  statusFilter: string;
  urgencyFilter: string;
  buildingFilter: string;
  assignedToFilter: string;
  issueTypeFilter: string;
  dateFrom: string;
  dateTo: string;
  technicians: { id: string; firstName: string; lastName: string }[];
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onUrgencyChange: (v: string) => void;
  onBuildingChange: (v: string) => void;
  onAssignedToChange: (v: string) => void;
  onIssueTypeChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onApply: () => void;
  onReset: () => void;
};

const selectClass =
  'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all';

const inputClass =
  'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all';

export default function RequestsFilterBar({
  search,
  statusFilter,
  urgencyFilter,
  buildingFilter,
  assignedToFilter,
  issueTypeFilter,
  dateFrom,
  dateTo,
  technicians,
  onSearchChange,
  onStatusChange,
  onUrgencyChange,
  onBuildingChange,
  onAssignedToChange,
  onIssueTypeChange,
  onDateFromChange,
  onDateToChange,
  onApply,
  onReset,
}: FilterBarProps) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 border-b-2 border-b-[#dce1ff] mb-6">
      <div className="px-6 pt-5 pb-4">
        {/* Primary Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          {/* Search — spans 2 columns */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Search
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ID, Submitter, or Keyword"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className={selectClass}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Urgency
            </label>
            <select
              value={urgencyFilter}
              onChange={(e) => onUrgencyChange(e.target.value)}
              className={selectClass}
            >
              <option value="">All Urgencies</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Building */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Building
            </label>
            <select
              value={buildingFilter}
              onChange={(e) => onBuildingChange(e.target.value)}
              className={selectClass}
            >
              <option value="">All Buildings</option>
              <option value="IT_BUILDING">IT Building</option>
              <option value="ADMIN_BUILDING">Admin Building</option>
              <option value="LIBRARY">Library</option>
              <option value="GYMNASIUM">Gymnasium</option>
              <option value="CANTEEN">Canteen</option>
              <option value="DORMITORY">Dormitory</option>
              <option value="OTHERS">Others</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 items-end">
            <button
              onClick={onReset}
              className="flex-1 bg-[#e3e1e9] hover:bg-slate-300 text-slate-700 text-sm font-medium px-3 py-2.5 rounded-lg transition-colors"
            >
              Reset
            </button>
            <button
              onClick={onApply}
              className="flex-1 bg-[#1E3A8A] hover:bg-blue-900 text-white text-sm font-medium px-3 py-2.5 rounded-lg transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* More Filters Toggle */}
        <div className="mt-3">
          <button
            onClick={() => setShowMore((p) => !p)}
            className="flex items-center gap-1 text-sm text-[#2563EB] font-medium hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">
              {showMore ? 'expand_less' : 'expand_more'}
            </span>
            {showMore ? 'Less Filters' : 'More Filters'}
          </button>
        </div>
      </div>

      {/* Expanded More Filters */}
      {showMore && (
        <div className="px-6 pb-5 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Assigned To */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Assigned To
              </label>
              <select
                value={assignedToFilter}
                onChange={(e) => onAssignedToChange(e.target.value)}
                className={selectClass}
              >
                <option value="">All Technicians</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Issue Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Issue Type
              </label>
              <select
                value={issueTypeFilter}
                onChange={(e) => onIssueTypeChange(e.target.value)}
                className={selectClass}
              >
                <option value="">All Types</option>
                <option value="HVAC">HVAC</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="CARPENTRY">Carpentry</option>
                <option value="STRUCTURAL">Structural</option>
                <option value="OTHERS">Others</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

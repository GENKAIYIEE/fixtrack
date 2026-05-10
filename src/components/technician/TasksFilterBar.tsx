'use client';
// FIXED: BUG #3 — Added missing 'use client' directive (uses useState, useEffect)

import { useState, useEffect } from 'react';

interface TasksFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  dateFilter: string;
  setDateFilter: (val: string) => void;
  onFilter: () => void;
}

export default function TasksFilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  dateFilter,
  setDateFilter,
  onFilter
}: TasksFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, setSearch]);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.04)] border border-surface-container p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Filter by ID, Type, Location..."
            className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative w-48">
          <select
            className="w-full appearance-none pl-4 pr-10 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ONGOING">Ongoing</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">
            expand_more
          </span>
        </div>

        {/* Priority Dropdown */}
        <div className="relative w-48">
          <select
            className="w-full appearance-none pl-4 pr-10 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">
            expand_more
          </span>
        </div>

        {/* Date Input */}
        <div className="w-48">
          <input
            type="date"
            className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={onFilter}
          className="bg-secondary-container hover:bg-secondary text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
        >
          <span className="material-symbols-outlined text-[20px]">filter_list</span>
          Filter
        </button>
      </div>
    </div>
  );
}

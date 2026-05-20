'use client';

import React, { useState, useEffect } from 'react';

export interface UsersFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

export default function UsersFilterBar({
  search,
  onSearchChange,
  roleFilter,
  onRoleChange,
  statusFilter,
  onStatusChange,
}: UsersFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, onSearchChange]);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Search Input */}
      <div className="relative w-full md:w-96">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
          search
        </span>
        <input
          type="text"
          placeholder="Search users by name, email, or ID..."
          className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface text-sm"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex w-full md:w-auto gap-4">
        <div className="relative w-full md:w-48">
          <select
            className="w-full appearance-none pl-4 pr-10 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface text-sm cursor-pointer"
            value={roleFilter}
            onChange={(e) => onRoleChange(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
            <option value="FACULTY">FACULTY</option>
            <option value="STAFF">STAFF</option>
            <option value="TECHNICIAN">TECHNICIAN</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
            arrow_drop_down
          </span>
        </div>

        <div className="relative w-full md:w-48">
          <select
            className="w-full appearance-none pl-4 pr-10 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface text-sm cursor-pointer"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING">Pending</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
            arrow_drop_down
          </span>
        </div>
      </div>
    </div>
  );
}

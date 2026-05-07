'use client';

import React from 'react';
import { format } from 'date-fns';

export interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  idNumber: string;
  department: string;
  role: string;
  specialization: string | null;
  accountStatus: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UsersTableProps {
  users: UserRow[];
  isLoading: boolean;
  onEdit: (user: UserRow) => void;
  onDeactivate: (user: UserRow) => void;
  onResetPassword: (user: UserRow) => void;
}

export default function UsersTable({
  users,
  isLoading,
  onEdit,
  onDeactivate,
  onResetPassword,
}: UsersTableProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold tracking-wide bg-primary-fixed text-on-primary-fixed">ADMIN</span>;
      case 'TECHNICIAN':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold tracking-wide bg-surface-variant text-on-surface-variant border border-outline-variant">TECHNICIAN</span>;
      case 'FACULTY':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold tracking-wide bg-secondary-fixed text-on-secondary-fixed">FACULTY</span>;
      case 'STAFF':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold tracking-wide bg-secondary-fixed text-on-secondary-fixed">STAFF</span>;
      case 'STUDENT':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold tracking-wide bg-tertiary-fixed text-on-tertiary-fixed">STUDENT</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold tracking-wide bg-surface-variant text-on-surface-variant">{role}</span>;
    }
  };

  const renderStatusPill = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary-fixed text-on-secondary-fixed border border-secondary/20">Active</span>;
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-tertiary-container text-on-tertiary-container border border-tertiary/20">Pending</span>;
      case 'INACTIVE':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-variant text-on-surface-variant border border-outline-variant">Inactive</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-variant text-on-surface-variant">{status}</span>;
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-primary-container text-on-primary font-table-header text-table-header">
              <th className="px-6 py-4 font-semibold text-sm">User</th>
              <th className="px-6 py-4 font-semibold text-sm">Contact</th>
              <th className="px-6 py-4 font-semibold text-sm">Role & Dept</th>
              <th className="px-6 py-4 font-semibold text-sm">ID Number</th>
              <th className="px-6 py-4 font-semibold text-sm">Status</th>
              <th className="px-6 py-4 font-semibold text-sm">Registered</th>
              <th className="px-6 py-4 font-semibold text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 10 }).map((_, index) => (
                <tr key={index} className="border-t border-outline-variant animate-pulse">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex-shrink-0" />
                      <div className="h-3 bg-surface-container-high rounded w-24" />
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="h-3 bg-surface-container-high rounded w-32" /></td>
                  <td className="px-6 py-4"><div className="h-3 bg-surface-container-high rounded w-20" /></td>
                  <td className="px-6 py-4"><div className="h-3 bg-surface-container-high rounded w-16" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-surface-container-high rounded-full w-16" /></td>
                  <td className="px-6 py-4"><div className="h-3 bg-surface-container-high rounded w-24" /></td>
                  <td className="px-6 py-4"></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-on-surface-variant">
                  No users found matching the current filters.
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr
                  key={user.id}
                  className={`border-t border-outline-variant group transition-colors ${
                    index % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low'
                  } hover:bg-secondary-fixed hover:text-on-secondary-fixed`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-10 h-10 rounded-full object-cover border border-outline-variant shadow-sm group-hover:border-secondary"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center font-label-md text-label-md text-on-surface-variant">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                      )}
                      <span className="font-label-md text-label-md text-on-surface group-hover:text-on-secondary-fixed whitespace-nowrap">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant group-hover:text-on-secondary-fixed">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      {renderRoleBadge(user.role)}
                      <span className="text-xs text-outline group-hover:text-secondary whitespace-nowrap">
                        {user.department}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-on-surface-variant group-hover:text-on-secondary-fixed">
                    {user.idNumber}
                  </td>
                  <td className="px-6 py-4">
                    {renderStatusPill(user.accountStatus)}
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant group-hover:text-on-secondary-fixed whitespace-nowrap">
                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(user)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low hover:text-secondary transition-colors"
                        title="Edit User"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => onDeactivate(user)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                          user.accountStatus === 'INACTIVE'
                            ? 'hover:bg-secondary-container hover:text-secondary'
                            : 'hover:bg-error-container hover:text-error'
                        }`}
                        title={user.accountStatus === 'INACTIVE' ? 'Reactivate User' : 'Deactivate User'}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {user.accountStatus === 'INACTIVE' ? 'check_circle' : 'block'}
                        </span>
                      </button>
                      <button
                        onClick={() => onResetPassword(user)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-fixed hover:text-primary transition-colors"
                        title="Reset Password"
                      >
                        <span className="material-symbols-outlined text-[20px]">key</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
    </div>
  );
}

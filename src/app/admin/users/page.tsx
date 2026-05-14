'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UsersFilterBar from '@/components/admin/UsersFilterBar';
import UsersTable, { UserRow } from '@/components/admin/UsersTable';
import UsersPagination from '@/components/admin/UsersPagination';
import DeactivateUserModal from '@/components/admin/DeactivateUserModal';
import ResetPasswordModal from '@/components/admin/ResetPasswordModal';
import Toast from '@/components/shared/Toast';

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [toastConfig, setToastConfig] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error(error);
      setToastConfig({ show: true, message: 'Failed to load users', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPagination(p => ({ ...p, page: 1 }));
  };
  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    setPagination(p => ({ ...p, page: 1 }));
  };
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPagination(p => ({ ...p, page: 1 }));
  };

  // FIXED: BUG-04 — Route to the correct edit page based on actual user role
  const handleEdit = (user: UserRow) => {
    if (user.role === 'TECHNICIAN') {
      router.push(`/admin/users/technicians/${user.id}/edit`);
    } else {
      router.push(`/admin/users/${user.id}/edit`);
    }
  };

  const handleDeactivate = (user: UserRow) => {
    setSelectedUser(user);
    setShowDeactivateModal(true);
  };

  const handleResetPassword = (user: UserRow) => {
    setSelectedUser(user);
    setShowResetModal(true);
  };

  const confirmDeactivate = async () => {
    if (!selectedUser) return;
    const newStatus = selectedUser.accountStatus === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountStatus: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      
      setToastConfig({ show: true, message: `User successfully ${newStatus === 'ACTIVE' ? 'reactivated' : 'deactivated'}`, type: 'success' });
      setShowDeactivateModal(false);
      fetchUsers();
    } catch (error) {
      setToastConfig({ show: true, message: 'Failed to update user status', type: 'error' });
    }
  };

  const confirmResetPassword = async (newPassword: string) => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) throw new Error('Failed to reset password');
      
      setToastConfig({ show: true, message: 'Password successfully reset', type: 'success' });
      setShowResetModal(false);
    } catch (error) {
      setToastConfig({ show: true, message: 'Failed to reset password', type: 'error' });
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="font-h1 text-h1 text-on-surface">User Management</h1>
        <Link
          href="/admin/users/technicians/create"
          className="inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-container text-on-secondary px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm w-fit"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Technician
        </Link>
      </div>

      <UsersFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        roleFilter={roleFilter}
        onRoleChange={handleRoleChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
      />

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
        <UsersTable
          users={users}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDeactivate={handleDeactivate}
          onResetPassword={handleResetPassword}
        />
        <UsersPagination
          pagination={pagination}
          onPageChange={(page) => setPagination(p => ({ ...p, page }))}
        />
      </div>

      <DeactivateUserModal
        user={selectedUser}
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={confirmDeactivate}
      />

      <ResetPasswordModal
        user={selectedUser}
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={confirmResetPassword}
      />

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

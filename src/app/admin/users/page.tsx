'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UsersFilterBar from '@/components/admin/UsersFilterBar';
import UsersTable, { UserRow } from '@/components/admin/UsersTable';
import UsersPagination from '@/components/admin/UsersPagination';
import DeactivateUserModal from '@/components/admin/DeactivateUserModal';
import ResetPasswordModal from '@/components/admin/ResetPasswordModal';
import UserSlideOverModal from '@/components/admin/UserSlideOverModal';
import Toast from '@/components/shared/Toast';

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // Slide-over state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined);

  const [toastConfig, setToastConfig] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  const fetchUsers = useCallback(async (silent = false, signal?: AbortSignal) => {
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await fetch(`/api/admin/users?${params.toString()}`, { signal });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users);
      
      setTotal(data.pagination?.total ?? data.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? data.totalPages ?? 1);
    } catch (error: any) {
      if (error.name === 'AbortError') return; // Ignore aborted requests
      console.error(error);
      if (!silent) setToastConfig({ show: true, message: 'Failed to load users', type: 'error' });
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(false, controller.signal);
    
    // Near Real-Time Background Polling
    const timer = setInterval(() => {
      fetchUsers(true, controller.signal);
    }, 15000);
    
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [fetchUsers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleEdit = (user: UserRow) => {
    setUserModalMode('edit');
    setEditingUserId(user.id);
    setIsUserModalOpen(true);
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
      fetchUsers(true);
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
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="font-h1 text-h1 text-on-surface">User Management</h1>
        <button
          onClick={() => {
            setUserModalMode('create');
            setEditingUserId(undefined);
            setIsUserModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-container text-on-secondary px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm w-fit"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Add User
        </button>
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
          pagination={{ total, page, limit: 10, totalPages }}
          onPageChange={(newPage) => setPage(newPage)}
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

      <UserSlideOverModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        mode={userModalMode}
        userId={editingUserId}
        onSuccess={() => {
          setToastConfig({
            show: true,
            message: `User successfully ${userModalMode === 'create' ? 'created' : 'updated'}`,
            type: 'success'
          });
          fetchUsers(true);
        }}
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

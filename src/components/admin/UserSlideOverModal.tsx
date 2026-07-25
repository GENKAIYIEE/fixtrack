'use client';

import React, { useEffect, useState } from 'react';
import UserForm, { UserFormData } from '@/components/admin/UserForm';

interface UserSlideOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  userId?: string;
  onSuccess: () => void;
}

export default function UserSlideOverModal({ isOpen, onClose, mode, userId, onSuccess }: UserSlideOverModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [initialData, setInitialData] = useState<Partial<UserFormData> | undefined>(undefined);
  const [error, setError] = useState('');

  // Reset form and fetch data if editing
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (mode === 'edit' && userId) {
        fetchUser(userId);
      } else {
        setInitialData(undefined);
      }
    } else {
      setTimeout(() => setInitialData(undefined), 300);
    }
  }, [isOpen, mode, userId]);

  const fetchUser = async (id: string) => {
    setIsLoadingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      const user = await res.json();
      setInitialData({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        idNumber: user.idNumber ?? '',
        department: user.department ?? '',
        contactNumber: user.contactNumber ?? '',
        role: user.role ?? '',
        specialization: user.specialization ?? '',
        password: '',
        accountStatus: user.accountStatus ?? 'PENDING',
      });
    } catch (err) {
      setError('Failed to load user data.');
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    setError('');
    try {
      const url = mode === 'create' ? '/api/admin/users' : `/api/admin/users/${userId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to save user.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !initialData && mode !== 'create') return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-surface z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/30 bg-surface-container-lowest">
          <div>
            <h2 className="font-h2 text-h2 text-on-surface">
              {mode === 'create' ? 'Create New User' : 'Edit User'}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              {mode === 'create'
                ? 'Fill out the details to provision a new account.'
                : 'Modify the existing user details below.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="px-6 py-3 bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-hidden relative bg-surface-container-lowest">
          {isLoadingUser ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant gap-3">
              <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="font-medium text-sm">Loading user data...</p>
            </div>
          ) : (mode === 'create' || initialData) ? (
            <UserForm
              mode={mode}
              initialData={initialData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={onClose}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}

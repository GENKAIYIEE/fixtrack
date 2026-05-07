'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import UserForm, { UserFormData } from '@/components/admin/UserForm';
import Toast from '@/components/shared/Toast';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = params?.id ?? '';

  const [initialData, setInitialData] = useState<Partial<UserFormData> | null>(null);
  const [fullName, setFullName] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  // Fetch user on mount
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      setIsLoadingUser(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        if (res.status === 404) {
          showToast('User not found.', 'error');
          setTimeout(() => router.push('/admin/users'), 1500);
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch user');

        const user = await res.json();
        setFullName(`${user.firstName} ${user.lastName}`);
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
      } catch {
        showToast('Failed to load user data.', 'error');
        setTimeout(() => router.push('/admin/users'), 1500);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, [userId, router]);

  const handleSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        showToast('User updated successfully!', 'success');
        setTimeout(() => router.back(), 800);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update user.', 'error');
        setIsSubmitting(false);
      }
    } catch {
      showToast('An unexpected error occurred.', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* Focused Top Bar */}
      <header className="bg-white/80 backdrop-blur-md fixed top-0 right-0 w-full z-40 border-b border-slate-200 shadow-sm flex justify-between items-center px-8 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-500 hover:text-slate-800 transition-colors p-1 rounded-lg hover:bg-slate-100"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="font-h2 text-h2 text-slate-900 truncate max-w-[500px]">
            {isLoadingUser
              ? 'Edit User'
              : fullName
              ? `Edit User — ${fullName}`
              : 'Edit User'}
          </h1>
        </div>
        <button
          className="text-slate-500 hover:bg-slate-50 rounded-full p-2 transition-colors"
          aria-label="Help"
        >
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="w-full pt-[80px] px-4 md:px-8 pb-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto mt-12 bg-white rounded-xl border-b-2 border-primary/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05),0_10px_30px_rgba(0,0,0,0.02)]">
          {isLoadingUser ? (
            <EditUserSkeleton />
          ) : initialData ? (
            <UserForm
              mode="edit"
              initialData={initialData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          ) : null}
        </div>
      </main>

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast((t) => ({ ...t, show: false }))}
        />
      )}
    </div>
  );
}

/** Loading skeleton while user data is being fetched */
function EditUserSkeleton() {
  const SkeletonBar = ({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) => (
    <div className={`${w} ${h} rounded-md bg-slate-200 animate-pulse`} />
  );

  return (
    <div className="px-8 py-6 flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="border-b border-slate-100 pb-6 flex flex-col gap-2">
        <SkeletonBar w="w-48" h="h-6" />
        <SkeletonBar w="w-72" h="h-4" />
      </div>

      {/* Section label */}
      <SkeletonBar w="w-36" h="h-3" />

      {/* Fields grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <SkeletonBar w="w-24" h="h-3" />
            <SkeletonBar h="h-10" />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-200 animate-pulse" />

      {/* Security section skeleton */}
      <SkeletonBar w="w-36" h="h-3" />
      <div className="h-16 rounded-lg bg-slate-200 animate-pulse" />

      {/* Button area */}
      <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
        <SkeletonBar w="w-24" h="h-10" />
        <SkeletonBar w="w-32" h="h-10" />
      </div>
    </div>
  );
}

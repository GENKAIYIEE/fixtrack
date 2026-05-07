'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import UserForm, { UserFormData } from '@/components/admin/UserForm';
import Toast from '@/components/shared/Toast';

export default function CreateUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const handleSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const created = await res.json();
        showToast('User created successfully!', 'success');

        // Role-based redirect
        setTimeout(() => {
          const role = created.role as string;
          if (role === 'ADMIN') {
            router.push('/admin/users?tab=administrators');
          } else if (role === 'TECHNICIAN') {
            router.push('/admin/users?tab=technicians');
          } else {
            router.push('/admin/users');
          }
        }, 800);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create user.', 'error');
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
          <h1 className="font-h2 text-h2 text-slate-900">Create New User</h1>
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
          <UserForm
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
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

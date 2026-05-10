'use client';

import React, { useState, useEffect } from 'react';
import { ProfileCard, TechnicianProfile } from '@/components/technician/ProfileCard';
import { ProfileSecurityCard } from '@/components/technician/ProfileSecurityCard';
import { ProfileEditCard, ProfileFormData } from '@/components/technician/ProfileEditCard';
import { ProfileNotifCard, NotifPreferences } from '@/components/technician/ProfileNotifCard';
// FIXED: MINOR #4 — Imported Toast to replace alert()
import Toast from '@/components/shared/Toast';

export default function TechnicianProfilePage() {
  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const [preferences, setPreferences] = useState<NotifPreferences>({
    taskAssigned: true,
    reminders: true,
    adminUpdates: false,
  });
  const [profileForm, setProfileForm] = useState<ProfileFormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // FIXED: MINOR #4 — Replaced alert() with Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/technician/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfile(data.user);
      setPreferences(data.preferences);
      setProfileForm({
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        contactNumber: data.user.contactNumber || '',
        specialization: data.user.specialization || 'GENERAL',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFormChange = (field: keyof ProfileFormData, value: string) => {
    if (profileForm) {
      setProfileForm({ ...profileForm, [field]: value });
    }
  };

  const handlePrefChange = (key: keyof NotifPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async () => {
    if (!profileForm) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/technician/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileForm, preferences }),
      });
      if (res.ok) {
        // FIXED: MINOR #4 — Toast replaces alert()
        setToast({ message: 'Profile updated successfully!', type: 'success' });
        await fetchProfile(); // refresh
      } else {
        const err = await res.json();
        setToast({ message: err.error || 'Failed to save changes', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'An error occurred while saving.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 pb-24">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-surface-variant rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 flex flex-col gap-8">
              <div className="h-80 bg-surface-variant rounded-xl"></div>
              <div className="h-40 bg-surface-variant rounded-xl"></div>
            </div>
            <div className="md:col-span-8 flex flex-col gap-8">
              <div className="h-96 bg-surface-variant rounded-xl"></div>
              <div className="h-64 bg-surface-variant rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !profileForm) {
    return (
      <div className="p-8 pb-24 flex justify-center text-on-surface-variant">
        Profile data could not be loaded.
      </div>
    );
  }

  return (
    <div className="p-8 pb-24 relative min-h-screen bg-slate-50">
      {/* Decorative ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.08)] border border-slate-100 px-8 py-6 mb-6 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A8A] flex items-center gap-2">
              My Profile & Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your personal information, security, and preferences.
            </p>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="bg-[#1E3A8A] hover:bg-[#1e40af] text-white px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 active:scale-95 duration-200"
          >
            {isSaving ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">save</span>
            )}
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left column */}
          <div className="md:col-span-4 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
            <div className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <ProfileCard user={profile} />
            </div>
            <div className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <ProfileSecurityCard />
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-8 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
            <div className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <ProfileEditCard formData={profileForm} onChange={handleFormChange} />
            </div>
            <div className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <ProfileNotifCard preferences={preferences} onChange={handlePrefChange} />
            </div>
          </div>
        </div>
      </div>

      {/* FIXED: MINOR #4 — Toast replaces alert() */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}

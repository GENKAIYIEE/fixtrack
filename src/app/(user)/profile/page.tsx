'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/shared/Toast';

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  idNumber: string;
  department: string | null;
  contactNumber: string | null;
  role: string;
  accountStatus: string;
  createdAt: string;
};

export default function UserProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ contactNumber: '' });

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ show: boolean, message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const fetchProfile = useCallback(async (isSilentPoll = false) => {
    if (!isSilentPoll) setIsLoading(true);
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        if (res.status === 401) window.location.href = '/login';
        throw new Error('Failed to load profile');
      }
      const data = await res.json();
      setUser(data);
    } catch (err: any) {
      if (!isSilentPoll) setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile(false);

    // 30-second silent background poll for true real-time sync
    const interval = setInterval(() => {
      fetchProfile(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchProfile]);

  const handleEditClick = () => {
    if (!user) return;
    setEditForm({
      contactNumber: user.contactNumber || ''
    });
    setIsEditModalOpen(true);
  };

  const handlePasswordChangeClick = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError(null);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSave = async () => {
    setPasswordError(null);
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/user/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      
      setIsPasswordModalOpen(false);
      showToast('Password changed successfully', 'success');
    } catch (err: any) {
      setPasswordError(err.message || 'An error occurred');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Optimistic Update
    const prevUser = user;
    setUser(prevUser ? {
      ...prevUser,
      contactNumber: editForm.contactNumber || null
    } : null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactNumber: editForm.contactNumber || null
        })
      });

      if (!res.ok) throw new Error('Failed to update profile');
      
      const updatedUser = await res.json();
      setUser(updatedUser);
      setIsEditModalOpen(false);
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      // Revert on failure
      setUser(prevUser);
      showToast(err.message || 'An error occurred', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex flex-col items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl mb-4">progress_activity</span>
        <p className="text-outline font-medium">Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex flex-col items-center text-center min-h-[400px] justify-center">
        <span className="material-symbols-outlined text-error text-6xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
        <h2 className="text-xl font-bold text-on-surface">User profile not found.</h2>
        <p className="text-outline mt-2">{error || "Please contact the administration."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-2">
        <h1 className="font-h1 text-h1 text-on-surface flex items-center gap-3 text-4xl font-extrabold tracking-tight">
          <span 
            className="material-symbols-outlined text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary" 
            style={{ fontVariationSettings: "'FILL' 1", fontSize: '36px' }}
          >
            person
          </span>
          My Profile
        </h1>
        <p className="text-on-surface-variant text-base font-medium">
          Manage your personal information and account settings.
        </p>
      </div>

      {/* ── Profile Card ── */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
        
        {/* Premium Header Banner Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary px-6 sm:px-8 py-8 sm:py-12">
          {/* Decorative background shapes */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-white opacity-10 blur-2xl"></div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5 sm:gap-8">
              {/* Premium Avatar */}
              <div className="relative group shrink-0">
                <div className="absolute inset-0 bg-white rounded-full opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300"></div>
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center text-3xl sm:text-4xl font-extrabold shrink-0 shadow-lg border-4 border-white/20 relative z-10">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 border-4 border-surface-container-lowest rounded-full z-20" title="Active"></div>
              </div>
              
              {/* Name and Status */}
              <div className="flex flex-col text-white">
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight drop-shadow-sm">
                  {user.firstName} {user.lastName}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 sm:mt-2">
                  <span className="text-white/80 text-sm sm:text-base font-medium tracking-wide flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">badge</span>
                    {user.idNumber}
                  </span>
                  <span className="hidden sm:block w-1 h-1 rounded-full bg-white/50"></span>
                  <span className="text-white/80 text-sm sm:text-base font-medium tracking-wide flex items-center gap-1.5 capitalize">
                    <span className="material-symbols-outlined text-sm">work</span>
                    {user.role.toLowerCase()}
                  </span>
                </div>
                
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full mt-3 sm:mt-4 self-start shadow-sm border border-white/10 transition-transform duration-300 cursor-default">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
                    verified_user
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">
                    {user.accountStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-row items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t border-white/20 md:border-none mt-2 md:mt-0">
              <button
                onClick={handlePasswordChangeClick}
                className="flex-1 md:flex-none justify-center bg-black/20 hover:bg-black/40 text-white backdrop-blur-md px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95 border border-white/10"
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">lock</span>
                Password
              </button>
              <button
                onClick={handleEditClick}
                className="flex-1 md:flex-none justify-center bg-white/20 hover:bg-white/30 text-white backdrop-blur-md px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95 border border-white/10"
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">edit</span>
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Details Grid Section */}
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12 bg-gradient-to-b from-surface-container-lowest to-surface-container-low/30">
          
          {/* Column 1: Personal Details */}
          <div className="flex flex-col gap-6 relative">
            <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">Personal Details</h3>
            </div>
            
            <div className="flex flex-col gap-6 mt-2">
              <div className="group transition-colors duration-200 hover:bg-surface-container-low p-3 -mx-3 rounded-xl">
                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-1.5">Full Name</label>
                <div className="text-on-surface font-semibold text-lg">{user.firstName} {user.lastName}</div>
              </div>
              
              <div className="group transition-colors duration-200 hover:bg-surface-container-low p-3 -mx-3 rounded-xl">
                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-1.5">Department</label>
                <div className="text-on-surface font-semibold text-lg">
                  {user.department || <span className="text-outline italic font-medium">Not assigned</span>}
                </div>
              </div>

              <div className="group transition-colors duration-200 hover:bg-surface-container-low p-3 -mx-3 rounded-xl">
                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-1.5">System Role</label>
                <div className="text-on-surface font-semibold text-lg capitalize flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  {user.role.toLowerCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Contact & Account Credentials */}
          <div className="flex flex-col gap-6 relative">
            <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-4">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>contact_mail</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">Contact & Credentials</h3>
            </div>
            
            <div className="flex flex-col gap-6 mt-2">
              <div className="group transition-colors duration-200 hover:bg-surface-container-low p-3 -mx-3 rounded-xl">
                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-1.5">Email Address</label>
                <div className="text-on-surface font-semibold text-lg flex items-center gap-2">
                  {user.email}
                </div>
              </div>

              <div className="group transition-colors duration-200 hover:bg-surface-container-low p-3 -mx-3 rounded-xl">
                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-1.5">Contact Number</label>
                <div className="text-on-surface font-semibold text-lg">
                  {user.contactNumber || <span className="text-outline italic font-medium">Not provided</span>}
                </div>
              </div>

              <div className="group transition-colors duration-200 hover:bg-surface-container-low p-3 -mx-3 rounded-xl">
                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-1.5">Member Since</label>
                <div className="text-on-surface font-semibold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>calendar_month</span>
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Edit Modal ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isSaving && setIsEditModalOpen(false)} />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md border border-outline-variant overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit</span>
                Edit Profile
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                disabled={isSaving}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-outline transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-4 bg-surface-container-lowest">
              <div className="space-y-1">
                <label htmlFor="contactNumber" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Contact Number</label>
                <input
                  id="contactNumber"
                  type="text"
                  value={editForm.contactNumber}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                  placeholder="e.g. 09123456789"
                  disabled={isSaving}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition disabled:opacity-50 text-on-surface"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/60 bg-surface-container/30 flex justify-end gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isChangingPassword && setIsPasswordModalOpen(false)} />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md border border-outline-variant overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">lock</span>
                Change Password
              </h2>
              <button 
                onClick={() => setIsPasswordModalOpen(false)} 
                disabled={isChangingPassword}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-outline transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-4 bg-surface-container-lowest">
              {passwordError && (
                <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm font-medium flex items-start gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                  <span>{passwordError}</span>
                </div>
              )}
              <div className="space-y-1">
                <label htmlFor="currentPassword" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  disabled={isChangingPassword}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition disabled:opacity-50 text-on-surface"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="newPassword" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  disabled={isChangingPassword}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition disabled:opacity-50 text-on-surface"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={isChangingPassword}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition disabled:opacity-50 text-on-surface"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/60 bg-surface-container/30 flex justify-end gap-3">
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                disabled={isChangingPassword}
                className="px-4 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSave}
                disabled={isChangingPassword}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
              >
                {isChangingPassword ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Updating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Update Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Toast for Success/Error */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}

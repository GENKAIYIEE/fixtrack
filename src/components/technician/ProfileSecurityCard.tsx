import React, { useState } from 'react';

export const ProfileSecurityCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/technician/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to change password');
      } else {
        // FIXED: MINOR #4 — Removed alert(); card collapses on success as visual confirmation
        setIsExpanded(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.08)] border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
        <span className="material-symbols-outlined text-[#2563EB]">lock</span>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Security Settings</h3>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
            Current Password
          </label>
          <input
            type="password"
            value="********"
            readOnly
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none transition-all placeholder:text-slate-400 cursor-not-allowed"
          />
        </div>

        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors mt-4"
          >
            Update Password
          </button>
        )}

        {isExpanded && (
          <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-4 fade-in duration-300">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all placeholder:text-slate-400"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showNewPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setError(null);
                }}
                className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                className="bg-[#2563EB] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                {isSaving ? <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> : null}
                Confirm Change
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

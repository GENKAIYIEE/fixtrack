'use client';

import React, { useState, useEffect } from 'react';
import { UserRow } from './UsersTable';

export interface ResetPasswordModalProps {
  user: UserRow | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newPassword: string) => void;
}

export default function ResetPasswordModal({
  user,
  isOpen,
  onClose,
  onConfirm,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setError('');
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-xl shadow-xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center mb-4 text-primary-container">
            <span className="material-symbols-outlined text-[40px]">key</span>
          </div>
          
          <h2 className="text-xl font-bold text-on-surface mb-2">
            Reset Password
          </h2>
          
          <p className="text-on-surface-variant text-center mb-6 text-sm">
            Set a new temporary password for {user.firstName} {user.lastName}. They should change it upon next login.
          </p>

          <div className="w-full space-y-4 mb-6">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface text-sm"
              />
            </div>

            {error && (
              <p className="text-error text-xs">{error}</p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-surface-container border border-outline-variant rounded-lg font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 px-4 bg-secondary text-on-secondary rounded-lg font-semibold hover:bg-secondary-container hover:text-on-secondary-container transition-colors"
            >
              Confirm Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

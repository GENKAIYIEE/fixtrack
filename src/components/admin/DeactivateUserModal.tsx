'use client';

import React from 'react';
import { UserRow } from './UsersTable';

export interface DeactivateUserModalProps {
  user: UserRow | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeactivateUserModal({
  user,
  isOpen,
  onClose,
  onConfirm,
}: DeactivateUserModalProps) {
  if (!isOpen || !user) return null;

  const isInactive = user.accountStatus === 'INACTIVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-xl shadow-xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isInactive ? 'bg-secondary-container/20' : 'bg-error-container/20'
          }`}>
            <span className={`material-symbols-outlined text-[40px] ${
              isInactive ? 'text-secondary' : 'text-error'
            }`}>
              {isInactive ? 'check_circle' : 'warning'}
            </span>
          </div>
          
          <h2 className="text-xl font-bold text-on-surface mb-2">
            {isInactive ? 'Reactivate User?' : 'Deactivate User?'}
          </h2>
          
          <p className="text-on-surface-variant mb-8">
            {isInactive 
              ? `This will set ${user.firstName} ${user.lastName}'s account status to Active. They will be able to log in again.`
              : `This will set ${user.firstName} ${user.lastName}'s account status to Inactive. They will no longer be able to log in.`
            }
          </p>

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-surface-container border border-outline-variant rounded-lg font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-colors ${
                isInactive
                  ? 'bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container'
                  : 'bg-error text-on-error hover:bg-error-container hover:text-on-error-container'
              }`}
            >
              {isInactive ? 'Confirm Reactivate' : 'Confirm Deactivate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

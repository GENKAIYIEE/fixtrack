'use client';

import React from 'react';

interface AssignmentConfirmModalProps {
  request: any;
  technician: any;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function AssignmentConfirmModal({
  request,
  technician,
  onConfirm,
  onCancel,
  isLoading,
}: AssignmentConfirmModalProps) {
  if (!request || !technician) return null;

  const initials = `${technician.firstName?.[0] || ''}${technician.lastName?.[0] || ''}`.toUpperCase();

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'URGENT':
        return 'bg-error text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'NORMAL':
        return 'bg-secondary text-white';
      case 'LOW':
        return 'bg-outline text-white';
      default:
        return 'bg-outline text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_10px_40px_rgba(30,58,138,0.15)] w-full max-w-md animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <h2 className="text-lg font-bold text-on-surface">Confirm Assignment</h2>
          <button onClick={onCancel} disabled={isLoading} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center gap-4 bg-surface">
          {/* Request Summary */}
          <div className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-outline uppercase tracking-wider">{request.requestCode}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getUrgencyBadge(request.urgencyLevel)}`}>
                  {request.urgencyLevel}
                </span>
              </div>
              <h3 className="text-sm font-bold text-on-surface">{request.issueType}</h3>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-3xl">build_circle</span>
          </div>

          {/* Arrow */}
          <div className="text-primary bg-primary-container w-10 h-10 rounded-full flex items-center justify-center -my-2 z-10 border-4 border-surface shadow-sm">
            <span className="material-symbols-outlined">arrow_downward</span>
          </div>

          {/* Technician Summary */}
          <div className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-container text-primary font-bold rounded-full flex items-center justify-center">
              {initials}
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                {technician.firstName} {technician.lastName}
              </h3>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">
                {technician.specialization || 'GENERAL'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-lowest rounded-b-xl">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2 text-sm font-bold text-on-surface hover:bg-surface-container rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-bold text-on-primary bg-primary rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            {isLoading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

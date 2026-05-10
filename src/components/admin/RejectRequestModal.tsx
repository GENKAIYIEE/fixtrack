'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/shared/Toast';

type IssueType = 'HVAC' | 'ELECTRICAL' | 'PLUMBING' | 'CARPENTRY' | 'STRUCTURAL' | 'OTHERS';
type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
type Building =
  | 'IT_BUILDING'
  | 'ADMIN_BUILDING'
  | 'LIBRARY'
  | 'GYMNASIUM'
  | 'CANTEEN'
  | 'DORMITORY'
  | 'OTHERS';

interface RejectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmed: () => void;
  request: {
    id: string;
    requestCode: string;
    submitter: {
      firstName: string;
      lastName: string;
    };
    issueType: IssueType;
    urgencyLevel: UrgencyLevel;
    building: Building;
    roomNumber: string;
  } | null;
}

const ISSUE_ICONS: Record<IssueType, string> = {
  HVAC: 'hvac',
  ELECTRICAL: 'bolt',
  PLUMBING: 'plumbing',
  CARPENTRY: 'handyman',
  STRUCTURAL: 'foundation',
  OTHERS: 'build',
};

const BUILDING_LABELS: Record<Building, string> = {
  IT_BUILDING: 'IT Building',
  ADMIN_BUILDING: 'Admin Building',
  LIBRARY: 'Library',
  GYMNASIUM: 'Gymnasium',
  CANTEEN: 'Canteen',
  DORMITORY: 'Dormitory',
  OTHERS: 'Others',
};

const PRESET_CHIPS = ['Duplicate Request', 'Out of Scope', 'Missing Information'];

export default function RejectRequestModal({
  isOpen,
  onClose,
  onConfirmed,
  request,
}: RejectRequestModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastConfig, setToastConfig] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToastConfig({ show: true, message, type });
  }, []);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setRejectionReason('');
      setSelectedChips([]);
      setHasSubmitted(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleChipToggle = (chipLabel: string) => {
    setSelectedChips((prev) => {
      const isSelected = prev.includes(chipLabel);
      const next = isSelected
        ? prev.filter((c) => c !== chipLabel)
        : [...prev, chipLabel];
      // Sync textarea to chip selections
      setRejectionReason(next.join(', '));
      return next;
    });
  };

  const handleConfirm = async () => {
    setHasSubmitted(true);
    if (!rejectionReason.trim()) return;
    if (!request) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (res.ok) {
        showToast(`Request ${request.requestCode} has been rejected.`, 'success');
        // Small delay so toast shows before modal closes
        setTimeout(() => {
          onClose();
          onConfirmed();
        }, 600);
      } else {
        const err = await res.json();
        showToast(err.message || err.error || 'Failed to reject request.', 'error');
        setIsSubmitting(false);
      }
    } catch {
      showToast('Failed to reject request.', 'error');
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !request) return null;

  const isHighUrgency =
    request.urgencyLevel === 'HIGH' || request.urgencyLevel === 'URGENT';

  const isEmpty = !rejectionReason.trim();

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm">
        {/* Modal Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_24px_48px_-12px_rgba(30,58,138,0.12)] w-full max-w-2xl border-t-2 border-t-error flex flex-col max-h-[90vh] mx-4">

          {/* ── Header ── */}
          <div className="px-8 py-6 border-b border-surface-variant flex items-center gap-4">
            <div className="bg-error-container text-on-error-container p-2 rounded-full flex items-center justify-center flex-shrink-0">
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
            </div>
            <div>
              <h2 className="font-h2 text-h2 text-on-surface">
                Reject Request — {request.requestCode}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                This action will notify the requester and close the ticket.
              </p>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-8 py-6 overflow-y-auto flex-1 bg-surface flex flex-col gap-6">

            {/* Request Summary Panel */}
            <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant flex flex-col gap-3 relative overflow-hidden">
              {/* Left accent bar */}
              <div className="absolute top-0 left-0 w-1 h-full bg-error" />

              {/* Top row */}
              <div className="flex items-start justify-between pl-3">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Requester
                  </span>
                  <span className="font-body text-body text-on-surface mt-1">
                    {request.submitter.firstName} {request.submitter.lastName}
                  </span>
                </div>

                {/* Urgency badge */}
                {isHighUrgency ? (
                  <span className="bg-error text-on-error px-3 py-1 rounded-full font-label-md text-label-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">priority_high</span>
                    {request.urgencyLevel}
                  </span>
                ) : (
                  <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-label-md text-label-md">
                    {request.urgencyLevel}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-outline-variant/30 mx-3" />

              {/* Bottom row */}
              <div className="grid grid-cols-2 gap-4 pl-3">
                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Category
                  </span>
                  <div className="flex items-center gap-1 text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-surface-tint">
                      {ISSUE_ICONS[request.issueType]}
                    </span>
                    <span className="font-body-sm text-body-sm">{request.issueType}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Location
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface">
                    {BUILDING_LABELS[request.building]}, {request.roomNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Rejection Reason Form */}
            <div className="flex flex-col gap-3">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1">
                Mandatory Reason
                <span className="text-error">*</span>
              </label>

              {/* Quick Select Chips */}
              <div className="flex flex-wrap gap-2">
                {PRESET_CHIPS.map((chip) => {
                  const selected = selectedChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleChipToggle(chip)}
                      className={`font-label-md text-label-md px-4 py-2 rounded-full transition-colors border ${
                        selected
                          ? 'bg-error text-on-error border-error'
                          : 'bg-surface-container-highest hover:bg-surface-dim text-on-surface-variant border-outline-variant'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>

              {/* Textarea */}
              <textarea
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  // Clear chip selections if user manually edits
                  if (selectedChips.length > 0) {
                    const chipsText = selectedChips.join(', ');
                    if (e.target.value !== chipsText) {
                      setSelectedChips([]);
                    }
                  }
                }}
                placeholder="Provide specific details for rejection..."
                className={`w-full bg-surface-container-lowest text-on-surface font-body-sm text-body-sm rounded-lg p-4 min-h-[120px] resize-none focus:outline-none focus:ring-2 transition-colors ${
                  hasSubmitted && isEmpty
                    ? 'border border-error focus:ring-error focus:border-error'
                    : 'border border-outline focus:ring-error focus:border-error'
                }`}
              />

              {/* Inline validation error */}
              {hasSubmitted && isEmpty && (
                <p className="text-error text-xs">Rejection reason is required.</p>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-8 py-5 border-t border-surface-variant bg-surface-container-lowest flex justify-end gap-3 rounded-b-xl">
            {/* Go Back */}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-surface-container-highest text-on-surface font-label-md text-label-md px-6 py-2.5 rounded-lg hover:bg-surface-dim transition-colors disabled:opacity-60"
            >
              Go Back
            </button>

            {/* Confirm Rejection */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isEmpty || isSubmitting}
              className={`font-label-md text-label-md px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
                isEmpty || isSubmitting
                  ? 'bg-surface-container-highest text-outline cursor-not-allowed'
                  : 'bg-error text-on-error hover:opacity-90 active:scale-95 shadow-sm'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  <span>Confirm Rejection</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastConfig.show && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onDismiss={() => setToastConfig((prev) => ({ ...prev, show: false }))}
        />
      )}
    </>
  );
}

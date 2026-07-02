'use client';

import React, { useState } from 'react';

type Technician = {
  id: string;
  firstName: string;
  lastName: string;
};

type BulkAssignModalProps = {
  isOpen: boolean;
  requests: any[];
  selectedIds: string[];
  technicians: Technician[];
  onClose: () => void;
  onAssigned: () => void;
};

export default function BulkAssignModal({
  isOpen,
  requests,
  selectedIds,
  technicians,
  onClose,
  onAssigned,
}: BulkAssignModalProps) {
  const [selectedTechId, setSelectedTechId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter the requests to only allow those that are APPROVED and unassigned
  const selectedRequests = requests.filter(r => selectedIds.includes(r.id));
  const validRequests = selectedRequests.filter(r => r.status === 'APPROVED' && !r.assignedToId);
  const invalidCount = selectedIds.length - validRequests.length;
  const eligibleIds = validRequests.map(r => r.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) {
      setError('Please select a technician.');
      return;
    }
    if (eligibleIds.length === 0) {
      setError('No eligible requests to assign.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulkAssign',
          requestIds: eligibleIds,
          technicianId: selectedTechId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to assign requests');
      }

      onAssigned();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-h2 text-h2 text-slate-900">Bulk Assign Tasks</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="px-6 py-6 bg-slate-50">
          {invalidCount > 0 && (
            <div className="flex items-start gap-3 mb-4 p-3 rounded-lg bg-orange-50 text-orange-800 border border-orange-200">
              <span className="material-symbols-outlined text-orange-600 mt-0.5">warning</span>
              <p className="text-sm font-medium">
                You selected <span className="font-bold">{selectedIds.length}</span> requests, but <span className="font-bold">{invalidCount}</span> of them are skipped because they are already assigned, rejected, or completed.
              </p>
            </div>
          )}

          {eligibleIds.length > 0 ? (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-blue-50 text-blue-800">
              <span className="material-symbols-outlined text-blue-600">info</span>
              <p className="text-sm font-medium">
                You are assigning <span className="font-bold">{eligibleIds.length}</span> eligible requests.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-red-50 text-red-800 border border-red-200">
              <span className="material-symbols-outlined text-red-600">block</span>
              <p className="text-sm font-medium">
                None of the selected requests are eligible for assignment.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Technician
            </label>
            <select
              value={selectedTechId}
              onChange={(e) => {
                setSelectedTechId(e.target.value);
                setError(null);
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all disabled:opacity-50"
              disabled={isSubmitting || eligibleIds.length === 0}
            >
              <option value="">-- Choose a Technician --</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>

            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedTechId || eligibleIds.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Assigning...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
                    Confirm Assignment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

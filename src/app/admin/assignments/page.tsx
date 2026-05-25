'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import UnassignedRequestsPanel, { UnassignedRequest } from '@/components/admin/UnassignedRequestsPanel';
import TechnicianAvailabilityBoard from '@/components/admin/TechnicianAvailabilityBoard';
import AssignmentConfirmModal from '@/components/admin/AssignmentConfirmModal';
import Toast from '@/components/shared/Toast';

interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string | null;
  activeTaskCount: number;
  accountStatus: string;
  avatarUrl?: string | null;
  department?: string | null;
}

interface FetchError {
  requests?: string;
  technicians?: string;
}

function AssignmentsContent() {
  const searchParams = useSearchParams();
  const requestIdParam = searchParams.get('requestId');

  const [requests, setRequests] = useState<UnassignedRequest[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchErrors, setFetchErrors] = useState<FetchError>({});

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(requestIdParam);
  const [prevRequestIdParam, setPrevRequestIdParam] = useState<string | null>(requestIdParam);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sync URL param changes without re-render loops
  if (requestIdParam !== prevRequestIdParam) {
    setPrevRequestIdParam(requestIdParam);
    setSelectedRequestId(requestIdParam);
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchRequests = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/assignments?type=unassigned');
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setFetchErrors((prev) => ({ ...prev, requests: body.error || `Failed to load requests (${res.status})` }));
        return false;
      }
      const data = await res.json();
      setRequests(data.requests ?? []);
      setFetchErrors((prev) => ({ ...prev, requests: undefined }));
      return true;
    } catch (error) {
      console.error('[AssignmentsPage] fetchRequests error:', error);
      setFetchErrors((prev) => ({ ...prev, requests: 'Network error loading requests.' }));
      return false;
    }
  }, []);

  const fetchTechnicians = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/assignments?type=technicians');
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setFetchErrors((prev) => ({ ...prev, technicians: body.error || `Failed to load technicians (${res.status})` }));
        return false;
      }
      const data = await res.json();
      setTechnicians(data.technicians ?? []);
      setFetchErrors((prev) => ({ ...prev, technicians: undefined }));
      return true;
    } catch (error) {
      console.error('[AssignmentsPage] fetchTechnicians error:', error);
      setFetchErrors((prev) => ({ ...prev, technicians: 'Network error loading technicians.' }));
      return false;
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchRequests(), fetchTechnicians()]);
    setLoading(false);
  }, [fetchRequests, fetchTechnicians]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // ── Event handlers ───────────────────────────────────────────────────────────
  const handleSelectRequest = (id: string) => {
    setSelectedRequestId(id);
    setSelectedTechnicianId(null);
  };

  const handleSelectTechnician = (id: string) => {
    if (!selectedRequestId) {
      showToast('Please select a request first before choosing a technician.', 'error');
      return;
    }
    setSelectedTechnicianId(id);
  };

  const handleCancelAssignment = () => {
    setSelectedRequestId(null);
    setSelectedTechnicianId(null);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedRequestId || !selectedTechnicianId) return;

    setIsAssigning(true);
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequestId,
          technicianId: selectedTechnicianId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const assignedReq = requests.find((r) => r.id === selectedRequestId);
        const assignedTech = technicians.find((t) => t.id === selectedTechnicianId);

        showToast(
          `Request ${assignedReq?.requestCode ?? ''} successfully assigned to ${assignedTech?.firstName ?? ''} ${assignedTech?.lastName ?? ''}.`,
          'success'
        );

        setSelectedRequestId(null);
        setSelectedTechnicianId(null);

        // Refresh both panels to reflect the new assignment
        await Promise.all([fetchRequests(), fetchTechnicians()]);
      } else {
        showToast(data.error || 'Failed to assign the request. Please try again.', 'error');
      }
    } catch (error) {
      console.error('[AssignmentsPage] assignment error:', error);
      showToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);
  const selectedTechnician = technicians.find((t) => t.id === selectedTechnicianId);

  const hasFetchErrors = Object.values(fetchErrors).some(Boolean);

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Task Assignment</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Assign approved maintenance requests to available technicians.
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={refreshAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-on-surface-variant bg-surface-container border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50"
          title="Refresh both panels"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          Refresh
        </button>
      </div>

      {/* Fetch Error Banner */}
      {hasFetchErrors && (
        <div className="mb-4 p-4 bg-error-container text-on-error-container rounded-xl flex items-start gap-3 border border-error/20">
          <span className="material-symbols-outlined text-error mt-0.5">warning</span>
          <div className="flex-1">
            <p className="font-semibold text-sm">Some data failed to load</p>
            {fetchErrors.requests && (
              <p className="text-xs mt-1">Requests: {fetchErrors.requests}</p>
            )}
            {fetchErrors.technicians && (
              <p className="text-xs mt-1">Technicians: {fetchErrors.technicians}</p>
            )}
          </div>
          <button
            onClick={refreshAll}
            className="text-xs font-bold underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        /* Skeleton loader */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1 animate-pulse min-h-[600px]">
          <div className="md:col-span-5 bg-surface-container rounded-xl h-[calc(100vh-12rem)]" />
          <div className="md:col-span-7 bg-surface-container rounded-xl h-[calc(100vh-12rem)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1 min-h-[600px]">
          {/* Left Panel — Unassigned Requests */}
          <div className="md:col-span-5 h-[calc(100vh-12rem)]">
            <UnassignedRequestsPanel
              requests={requests}
              selectedRequestId={selectedRequestId}
              onSelect={handleSelectRequest}
            />
          </div>

          {/* Right Panel — Technician Availability */}
          <div className="md:col-span-7 h-[calc(100vh-12rem)]">
            <TechnicianAvailabilityBoard
              technicians={technicians}
              selectedTechnicianId={selectedTechnicianId}
              onSelect={handleSelectTechnician}
              hasRequestSelected={!!selectedRequestId}
            />
          </div>
        </div>
      )}

      {/* Assignment Confirmation Modal */}
      {selectedRequest && selectedTechnician && (
        <AssignmentConfirmModal
          request={selectedRequest}
          technician={selectedTechnician}
          isLoading={isAssigning}
          onConfirm={handleConfirmAssignment}
          onCancel={handleCancelAssignment}
        />
      )}

      {/* Toast Notifications */}
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

export default function AssignmentsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
          <p className="text-sm font-medium">Loading Assignment Board...</p>
        </div>
      </div>
    }>
      <AssignmentsContent />
    </Suspense>
  );
}

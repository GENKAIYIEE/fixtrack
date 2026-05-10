'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import UnassignedRequestsPanel, { UnassignedRequest } from '@/components/admin/UnassignedRequestsPanel';
import TechnicianAvailabilityBoard from '@/components/admin/TechnicianAvailabilityBoard';
import AssignmentConfirmModal from '@/components/admin/AssignmentConfirmModal';
import Toast from '@/components/shared/Toast';

// FIXED: QUALITY-03 — Replaced any[] with a proper Technician interface
interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  activeTaskCount: number;
  accountStatus: string;
  avatarUrl?: string;
  department?: string;
}

// Component that uses useSearchParams inside Suspense boundary
function AssignmentsContent() {
  const searchParams = useSearchParams();
  const requestIdParam = searchParams.get('requestId');

  const [requests, setRequests] = useState<UnassignedRequest[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/assignments?type=unassigned');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests', error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch('/api/admin/assignments?type=technicians');
      if (res.ok) {
        const data = await res.json();
        setTechnicians(data.technicians || []);
      }
    } catch (error) {
      console.error('Failed to fetch technicians', error);
    }
  };

  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      await Promise.all([fetchRequests(), fetchTechnicians()]);
      setLoading(false);
    };
    initFetch();
  }, []);

  // Pre-select request if provided in URL parameter and found in list
  useEffect(() => {
    if (requestIdParam && requests.length > 0) {
      const found = requests.find((r) => r.id === requestIdParam);
      if (found) {
        setSelectedRequestId(found.id);
        // We could also try to scroll it into view, but basic pre-selection is fine for now
      }
    }
  }, [requestIdParam, requests]);

  const handleSelectRequest = (id: string) => {
    setSelectedRequestId(id);
    setSelectedTechnicianId(null);
  };

  const handleSelectTechnician = (id: string) => {
    if (!selectedRequestId) {
      // Prompt user to select a request first, optional
      setToast({ message: 'Please select a request first', type: 'error' });
      return;
    }
    setSelectedTechnicianId(id);
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
        const assignedReq = requests.find(r => r.id === selectedRequestId);
        const assignedTech = technicians.find(t => t.id === selectedTechnicianId);
        
        setToast({ 
          message: `REQ-${assignedReq?.requestCode} has been assigned to ${assignedTech?.firstName} ${assignedTech?.lastName}`, 
          type: 'success' 
        });

        setSelectedRequestId(null);
        setSelectedTechnicianId(null);
        
        // Refresh data
        await Promise.all([fetchRequests(), fetchTechnicians()]);
      } else {
        setToast({ message: data.error || 'Failed to assign request', type: 'error' });
      }
    } catch (error) {
      console.error('Assignment error', error);
      setToast({ message: 'An unexpected error occurred', type: 'error' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCancelAssignment = () => {
    setSelectedRequestId(null);
    setSelectedTechnicianId(null);
  };

  const selectedRequest = requests.find(r => r.id === selectedRequestId);
  const selectedTechnician = technicians.find(t => t.id === selectedTechnicianId);

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-on-surface">Task Assignment</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Assign incoming maintenance requests to available technicians.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1 animate-pulse min-h-[600px]">
          <div className="md:col-span-5 bg-surface-container rounded-xl h-[calc(100vh-12rem)]" />
          <div className="md:col-span-7 bg-surface-container rounded-xl h-[calc(100vh-12rem)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1 min-h-[600px]">
          {/* Left Panel */}
          <div className="md:col-span-5 h-[calc(100vh-12rem)]">
            <UnassignedRequestsPanel
              requests={requests}
              selectedRequestId={selectedRequestId}
              onSelect={handleSelectRequest}
            />
          </div>

          {/* Right Panel */}
          <div className="md:col-span-7 h-[calc(100vh-12rem)]">
            <TechnicianAvailabilityBoard
              technicians={technicians}
              selectedTechnicianId={selectedTechnicianId}
              onSelect={handleSelectTechnician}
            />
          </div>
        </div>
      )}

      {/* Assignment Modal */}
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
    <Suspense fallback={<div className="p-8">Loading Assignment Board...</div>}>
      <AssignmentsContent />
    </Suspense>
  );
}

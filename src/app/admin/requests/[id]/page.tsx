'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import RequestInfoCard from '@/components/admin/RequestInfoCard';
import RequestStatusStepper from '@/components/admin/RequestStatusStepper';
import AdminActionCard from '@/components/admin/AdminActionCard';
import ActivityLog from '@/components/admin/ActivityLog';
import RejectRequestModal from '@/components/admin/RejectRequestModal';

// FIXED: QUALITY-03 — Replaced any type for request state with proper interface
interface RequestDetail {
  id: string;
  requestCode: string;
  status: any;
  urgencyLevel: string;
  priorityLevel: string;
  issueType: any;
  building: string;
  roomNumber: string;
  description: string;
  adminNotes?: string;
  repairNote?: any;
  submittedBy: { firstName: string; lastName: string; department?: string };
  assignedTo?: { firstName: string; lastName: string; specialization?: string; activeTaskCount?: number };
  statusHistory: any[]; // Using any[] here just to keep the interface concise, or could define StatusHistoryEntry
  createdAt: string;
  submitter?: any;
}

export default function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchRequest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/requests/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading request details...</div>;
  }

  if (!request) {
    return <div className="p-8 text-center text-error font-medium">Request not found.</div>;
  }

  return (
    <div className="w-full">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <Link 
          href="/admin/requests"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-[#2563EB] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to All Requests
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-h1 text-h1 text-slate-900 leading-tight">
          Triage Request: REQ-{request.requestCode}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review details, update priority, and assign to a technician.
        </p>
      </div>

      {/* ── Main Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (Details & Log) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <RequestStatusStepper 
            status={request.status} 
            hasRepairNote={!!request.repairNote} 
          />
          <RequestInfoCard request={request} />
          <ActivityLog statusHistory={request.statusHistory || []} />
        </div>

        {/* Right Column (Actions) */}
        <div className="lg:col-span-1">
          <AdminActionCard request={request} onRefresh={fetchRequest} onReject={() => setShowRejectModal(true)} />
        </div>
      </div>

      <RejectRequestModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirmed={() => { setShowRejectModal(false); fetchRequest(); }}
        request={request ? ({
          id: request.id,
          requestCode: request.requestCode,
          submitter: request.submitter || request.submittedBy,
          issueType: request.issueType,
          urgencyLevel: request.urgencyLevel,
          building: request.building,
          roomNumber: request.roomNumber,
        } as any) : null}
      />
    </div>
  );
}

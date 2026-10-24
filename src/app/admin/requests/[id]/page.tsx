'use client';
import RequestRatings from '@/components/shared/RequestRatings';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RecordedWorkers from '@/components/shared/RecordedWorkers';
import type { RecordedWorker } from '@/lib/workers/types';
import RequestInfoCard from '@/components/admin/RequestInfoCard';
import RequestStatusStepper from '@/components/admin/RequestStatusStepper';
import ActivityLog from '@/components/admin/ActivityLog';
import RejectRequestModal from '@/components/admin/RejectRequestModal';
import { RequestStatus, UrgencyLevel } from '@prisma/client';

// Typed to match what /api/admin/requests/[id] actually returns
interface RequestDetail {
  id: string;
  requestCode: string;
  status: RequestStatus;
  urgencyLevel: UrgencyLevel;
  priorityLevel: string;
  issueType: string | null;
  workLocation?: string | null;
  requestDate?: string | null;
  requestingParty?: string | null;
  requestedPriority?: string | null;
  building: string | null;
  roomNumber: string | null;
  locationNotes?: string | null;
  description: string;
  adminNotes?: string | null;
  photoUrl?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  assignedToId?: string | null;
  assignedToDesignatedHead?: boolean;
  submittedById: string;
  // Relations (returned by the GET include)
  submitter?: {
    firstName: string;
    lastName: string;
    department?: string | null;
    avatarUrl?: string | null;
  } | null;
  assignee?: {
    email?: string;
    firstName: string;
    lastName: string;
    specialization?: string | null;
    avatarUrl?: string | null;
  } | null;
  repairNote?: unknown | null;
  statusHistory: unknown[];
  workerAssignments?: RecordedWorker[];
}

export default function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/requests/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
        router.refresh(); // Invalidate Next.js client router cache
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading request details...</div>;
  }

  if (!request) {
    return <div className="p-8 text-center text-error font-medium">Request not found.</div>;
  }

  // Shape passed to RejectRequestModal — strictly typed, no `as any`
  const modalRequest = {
    id: request.id,
    requestCode: request.requestCode,
    submitter: {
      firstName: request.submitter?.firstName ?? 'Unknown',
      lastName:  request.submitter?.lastName  ?? '',
    },
    issueType:     request.issueType,
    urgencyLevel:  request.urgencyLevel,
    building:      request.building,
    roomNumber:    request.roomNumber,
    priorityLevel: request.priorityLevel,
    workLocation: request.workLocation,
    description: request.description,
  };

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
          Review Request: {request.requestCode}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review the request. Approval automatically forwards it to the designated technician head.
        </p>
      </div>

      {/* ── Main Layout ── */}
      <div className="w-full flex flex-col gap-6">
        {request.status === 'REJECTED' || request.status === 'CANCELLED' ? (
          <div className={`w-full p-6 rounded-xl border flex flex-col items-center justify-center text-center ${
            request.status === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              request.status === 'REJECTED' ? 'bg-red-100' : 'bg-slate-200'
            }`}>
              <span className={`material-symbols-outlined text-3xl ${
                request.status === 'REJECTED' ? 'text-red-500' : 'text-slate-500'
              }`}>
                {request.status === 'REJECTED' ? 'cancel' : 'block'}
              </span>
            </div>
            <h3 className={`font-bold text-xl mb-1 ${
              request.status === 'REJECTED' ? 'text-red-700' : 'text-slate-700'
            }`}>
              {request.status === 'REJECTED' ? 'Request Rejected' : 'Request Cancelled'}
            </h3>
            <p className={`text-sm ${
              request.status === 'REJECTED' ? 'text-red-600/80' : 'text-slate-500'
            }`}>
              {request.status === 'REJECTED' 
                ? (request.rejectionReason ? `Reason: ${request.rejectionReason}` : 'This request has been rejected and will not be processed further.') 
                : (request.cancellationReason ? `Reason: ${request.cancellationReason}` : 'This request has been cancelled.')}
            </p>
          </div>
        ) : (
          <RequestStatusStepper
            status={request.status}
            hasRepairNote={!!request.repairNote}
          />
        )}
        {/* RequestInfoCard owns Approve + Reject for PENDING status.
            onReject opens the RejectRequestModal via parent state. */}
        <RequestInfoCard
          request={request}
          onRefresh={handleRefresh}
          onReject={() => setShowRejectModal(true)}
        />
        {request.assignee && <section aria-label="Request receiving account" className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">{request.assignedToDesignatedHead ? 'Receiving Technician Head' : 'Historical Assigned Account'}</h2>
          <p className="mt-2 text-slate-800">{request.assignee.firstName} {request.assignee.lastName}</p>
          <p className="mt-1 break-all text-sm text-slate-600">{request.assignee.email}</p>
          <p className="mt-3 text-sm text-slate-600">{request.assignedToDesignatedHead
            ? 'The head coordinates with maintenance workers outside FixTrack. External contact is not automatically tracked.'
            : 'This historical assignment is preserved. No account or assignment was automatically changed.'}</p>
        </section>}
        <RecordedWorkers assignments={request.workerAssignments || []} showHistory />
        {request.status === 'COMPLETED' && <RequestRatings requestId={id} />}
        <ActivityLog statusHistory={request.statusHistory ?? []} />
      </div>

      {/* Rejection modal — rendered at page level so it sits above everything */}
      <RejectRequestModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirmed={() => {
          setShowRejectModal(false);
          handleRefresh();
        }}
        request={modalRequest}
      />
    </div>
  );
}

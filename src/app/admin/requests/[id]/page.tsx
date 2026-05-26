'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RequestInfoCard from '@/components/admin/RequestInfoCard';
import RequestStatusStepper from '@/components/admin/RequestStatusStepper';
import ActivityLog from '@/components/admin/ActivityLog';
import RejectRequestModal from '@/components/admin/RejectRequestModal';
import { RequestStatus } from '@prisma/client';

// Typed to match what /api/admin/requests/[id] actually returns
interface RequestDetail {
  id: string;
  requestCode: string;
  status: string;
  urgencyLevel: string;
  priorityLevel: string;
  issueType: string;
  building: string;
  roomNumber: string;
  locationNotes?: string | null;
  description: string;
  adminNotes?: string | null;
  photoUrl?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  assignedToId?: string | null;
  submittedById: string;
  // Relations (returned by the GET include)
  submitter?: {
    firstName: string;
    lastName: string;
    department?: string | null;
    avatarUrl?: string | null;
  } | null;
  assignee?: {
    firstName: string;
    lastName: string;
    specialization?: string | null;
    avatarUrl?: string | null;
  } | null;
  repairNote?: unknown | null;
  statusHistory: unknown[];
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
    issueType:    request.issueType    as any,
    urgencyLevel: request.urgencyLevel as any,
    building:     request.building     as any,
    roomNumber:   request.roomNumber,
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
          Triage Request: REQ-{request.requestCode}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review details, set priority, then approve or reject the request.
        </p>
      </div>

      {/* ── Main Layout ── */}
      <div className="w-full flex flex-col gap-6">
        <RequestStatusStepper
          status={request.status as RequestStatus}
          hasRepairNote={!!request.repairNote}
        />
        {/* RequestInfoCard owns Approve + Reject for PENDING status.
            onReject opens the RejectRequestModal via parent state. */}
        <RequestInfoCard
          request={request}
          onRefresh={handleRefresh}
          onReject={() => setShowRejectModal(true)}
        />
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

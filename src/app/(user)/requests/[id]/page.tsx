'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import RequestStatusTimeline from '@/components/user/RequestStatusTimeline';
import PhotoGallery from '@/components/shared/PhotoGallery';

type Status = 'PENDING' | 'ONGOING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

interface RequestDetail {
  id: string;
  requestCode: string;
  status: Status;
  title?: string | null;
  issueType: string;
  building: string;
  roomNumber: string;
  locationNotes?: string | null;
  description: string;
  urgencyLevel: string;
  priorityLevel: string;
  photoUrl?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<Status, { badge: string; dot: string; label: string }> = {
  PENDING: {
    badge: 'bg-amber-100 text-amber-800 border border-amber-200',
    dot: 'bg-amber-500',
    label: 'Pending',
  },
  ONGOING: {
    badge: 'bg-blue-100 text-blue-800 border border-blue-200',
    dot: 'bg-blue-500',
    label: 'In Progress',
  },
  COMPLETED: {
    badge: 'bg-green-100 text-green-800 border border-green-200',
    dot: 'bg-green-500',
    label: 'Completed',
  },
  REJECTED: {
    badge: 'bg-red-100 text-red-800 border border-red-200',
    dot: 'bg-red-500',
    label: 'Rejected',
  },
  CANCELLED: {
    badge: 'bg-slate-100 text-slate-600 border border-slate-200',
    dot: 'bg-slate-400',
    label: 'Cancelled',
  },
};

const ISSUE_TYPE_LABELS: Record<string, string> = {
  HVAC: 'HVAC',
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  CARPENTRY: 'Carpentry',
  STRUCTURAL: 'Structural',
  OTHERS: 'Others',
};

import { getBuildingLabel } from '@/lib/constants/buildings';

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600 border border-slate-200',
  NORMAL: 'bg-blue-50 text-blue-700 border border-blue-200',
  HIGH: 'bg-orange-50 text-orange-700 border border-orange-200',
  URGENT: 'bg-red-50 text-red-700 border border-red-200',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-slate-400 text-[18px]">{icon}</span>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default function UserRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/requests/${id}`);
      if (!res.ok) {
        setError(res.status === 404 ? 'Request not found.' : 'Failed to load request.');
        return;
      }
      const data = await res.json();
      setRequest(data);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-32" />
          <div className="bg-slate-100 rounded-xl h-28" />
          <div className="bg-slate-100 rounded-xl h-52" />
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error || !request) {
    return (
      <div className="w-full max-w-4xl">
        <Link href="/history" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#2563EB] transition-colors mb-6">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to My Requests
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-red-400 text-[48px] mb-2 block">error_outline</span>
          <p className="text-red-700 font-semibold">{error ?? 'Request not found.'}</p>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[request.status] ?? STATUS_STYLES.PENDING;
  const displayTitle = request.title ?? `${ISSUE_TYPE_LABELS[request.issueType] ?? request.issueType} Issue`;

  return (
    <div className="w-full max-w-4xl">
      {/* ── Back ─────────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <Link
          href="/history"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#2563EB] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to My Requests
        </Link>
      </div>

      {/* ── Header Card ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Request #{request.requestCode}
            </p>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{displayTitle}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Submitted on {formatDate(request.createdAt)}
            </p>
          </div>
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border w-fit shrink-0 ${statusStyle.badge}`}>
            <div className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
            <span className="text-sm font-semibold">{statusStyle.label}</span>
          </div>
        </div>

        {/* ── Status Timeline ───────────────────────────────────────────────── */}
        <div className="pt-4 border-t border-slate-100">
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
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
                Request Progress
              </p>
              <RequestStatusTimeline status={request.status} />
            </>
          )}
        </div>
      </div>

      {/* ── Details Card ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Request Details</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InfoRow icon="build" label="Issue Type" value={ISSUE_TYPE_LABELS[request.issueType] ?? request.issueType} />
          <InfoRow icon="location_on" label="Location" value={`${getBuildingLabel(request.building)}, Room ${request.roomNumber}`} />
          {request.locationNotes && (
            <InfoRow icon="sticky_note_2" label="Location Notes" value={request.locationNotes} />
          )}
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Priority</p>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${PRIORITY_STYLES[request.priorityLevel] ?? 'bg-slate-100 text-slate-600'}`}>
              <span className="material-symbols-outlined text-[14px]">flag</span>
              {PRIORITY_LABELS[request.priorityLevel] ?? request.priorityLevel}
            </span>
          </div>
          <InfoRow icon="update" label="Last Updated" value={formatDate(request.updatedAt)} />
        </div>
      </div>

      {/* ── Description Card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Description</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{request.description}</p>
          <div className="mt-4">
            <PhotoGallery
              photoUrl={request.photoUrl || null}
              label="Your Submitted Photos"
            />
          </div>
        </div>
      </div>

    </div>
  );
}

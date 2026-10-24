'use client';
import { useState } from 'react';
import OfficialRequestDetails from '@/components/shared/OfficialRequestDetails';
import { getWorkLocation } from '@/lib/requests/display';
import PhotoGallery from '@/components/shared/PhotoGallery';
interface RequestInfoCardProps {
  request: { id: string; status: string; assignedToId?: string | null; photoUrl?: string | null; workLocation?: string | null; building?: string | null; roomNumber?: string | null; locationNotes?: string | null; requestDate?: string | null; requestingParty?: string | null; requestedPriority?: string | null; description?: string | null };
  onRefresh?: () => void; onReject?: () => void;
}
export default function RequestInfoCard({ request, onRefresh, onReject }: RequestInfoCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
  const handleReviewAction = async (action: 'approve' | 'assign') => {
    setIsUpdating(true);setActionError('');setSuccess('');
    try {
      const response = await fetch(`/api/admin/requests/${request.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Approval and forwarding failed. Please retry.');
      setSuccess(data.message || (action === 'assign' ? 'Previously approved request forwarded to the technician head.' : 'Request approved and automatically forwarded to the technician head.'));
      onRefresh?.();
    } catch (error) { setActionError(error instanceof Error ? error.message : 'Approval and forwarding failed.'); }
    finally { setIsUpdating(false); }
  };
  return <section className="mb-6 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm">
    <div className="bg-primary-container p-6"><h2 className="break-words text-2xl font-bold text-white">{getWorkLocation(request)}</h2></div>
    {actionError && <p role="alert" className="p-4 text-sm text-red-700">{actionError}</p>}
    {success && <p role="status" className="p-4 text-sm text-green-800">{success}</p>}
    <div className="space-y-6 p-6"><OfficialRequestDetails request={request} />{request.photoUrl && <PhotoGallery photoUrl={request.photoUrl} label="Previously Submitted Photos" />}</div>
    {request.status === 'APPROVED' && !request.assignedToId && <div className="space-y-3 border-t border-outline-variant p-6">
      <p className="text-sm text-on-surface-variant">This older request was approved before automatic forwarding and has no receiving account. Forwarding it preserves the original approval and history.</p>
      <button type="button" onClick={() => void handleReviewAction('assign')} disabled={isUpdating} className="rounded-lg bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">{isUpdating ? 'Forwarding…' : 'Forward previously approved request'}</button>
    </div>}
    {request.status === 'PENDING' && <div className="space-y-4 border-t border-outline-variant bg-surface-container-low p-6">
      <p className="text-sm text-on-surface-variant">Approval automatically forwards this request to the designated technician head. The requester’s selected priority is retained.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void handleReviewAction('approve')} disabled={isUpdating} className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-60">{isUpdating ? 'Approving and forwarding…' : 'Approve & forward to technician head'}</button>
        <button type="button" onClick={onReject} disabled={isUpdating} className="flex-1 rounded-xl bg-error px-4 py-3 font-bold text-white disabled:opacity-60">Reject Request</button>
      </div>
    </div>}
  </section>;
}

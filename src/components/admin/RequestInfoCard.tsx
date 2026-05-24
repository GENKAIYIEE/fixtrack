'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface RequestInfoCardProps {
  request: any;
  onRefresh?: () => void;
  onReject?: () => void;
}

export default function RequestInfoCard({ request, onRefresh, onReject }: RequestInfoCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [prioritySaved, setPrioritySaved] = useState(false);

  // Triage state — sent along with the approval
  const [priorityLevel, setPriorityLevel] = useState<string>(request.priorityLevel || 'NORMAL');
  const [adminNotes, setAdminNotes] = useState<string>(request.adminNotes || '');

  const handleApprove = async () => {
    setIsUpdating(true);
    try {
      await fetch(`/api/admin/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', priorityLevel, adminNotes }),
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to approve request', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Standalone priority update for non-PENDING requests
  const handleUpdatePriority = async () => {
    setIsUpdating(true);
    setPrioritySaved(false);
    try {
      const res = await fetch(`/api/admin/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updatePriority', priorityLevel }),
      });
      if (res.ok) {
        setPrioritySaved(true);
        setTimeout(() => setPrioritySaved(false), 2500);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error('Failed to update priority', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'URGENT':
        return 'bg-error text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'NORMAL':
        return 'bg-surface-variant text-on-surface-variant';
      case 'LOW':
        return 'bg-surface-variant text-on-surface-variant';
      default:
        return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'URGENT': return 'border-error text-error bg-error/10';
      case 'HIGH':   return 'border-orange-500 text-orange-600 bg-orange-50';
      case 'NORMAL': return 'border-secondary text-secondary bg-secondary/10';
      case 'LOW':    return 'border-outline text-outline bg-surface-variant';
      default:       return 'border-outline text-outline bg-surface-variant';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const openLightbox = (url: string) => {
    setLightboxImage(url);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage(null);
  };

  const isPending = request.status === 'PENDING';
  const isTerminal = request.status === 'REJECTED' || request.status === 'CANCELLED' || request.status === 'COMPLETED';
  const priorityChanged = priorityLevel !== (request.priorityLevel || 'NORMAL');

  return (
    <>
      <div className="bg-surface rounded-xl overflow-hidden border border-outline-variant shadow-sm mb-6">
        {/* Card Header */}
        <div className="bg-primary-container p-6 flex justify-between items-center">
          <h2 className="text-white text-2xl font-bold">{request.issueType} in {request.building}</h2>
          <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${getUrgencyBadge(request.urgencyLevel)}`}>
            {request.urgencyLevel}
          </span>
        </div>

        {/* Card Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Requester */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary text-on-primary flex items-center justify-center font-bold relative">
              {request.submitter?.avatarUrl ? (
                <Image src={request.submitter.avatarUrl} alt="Requester avatar" fill className="object-cover" />
              ) : (
                getInitials(request.submitter?.firstName, request.submitter?.lastName)
              )}
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">Requester</p>
              <p className="font-medium text-on-surface">
                {request.submitter?.firstName} {request.submitter?.lastName}
              </p>
              <p className="text-sm text-on-surface-variant">{request.submitter?.department}</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary mt-1">location_on</span>
            <div>
              <p className="text-sm text-on-surface-variant">Location</p>
              <p className="font-medium text-on-surface">{request.building}</p>
              <p className="text-sm text-on-surface-variant">Room: {request.roomNumber}</p>
              {request.locationNotes && (
                <p className="text-sm text-on-surface-variant mt-1 italic">{request.locationNotes}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <p className="text-sm text-on-surface-variant mb-2">Description</p>
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 text-on-surface">
              {request.description}
            </div>
          </div>

          {/* Attached Images */}
          {request.photoUrl && (
            <div className="md:col-span-2">
              <p className="text-sm text-on-surface-variant mb-2">Attached Images</p>
              <div className="flex gap-4">
                {request.photoUrl.split(',').map((url: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => openLightbox(url.trim())}
                    className="w-32 h-32 relative rounded-lg overflow-hidden border border-outline-variant hover:opacity-90 transition-opacity"
                  >
                    <img src={url.trim()} alt="Attached evidence" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Priority Management — always visible for active requests ── */}
        {!isTerminal && (
          <div className="border-t border-outline-variant bg-surface-container-low p-6 space-y-5">
            <p className="text-sm font-semibold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">flag</span>
              {isPending ? 'Triage Options' : 'Priority Management'}
            </p>

            {/* Priority Level */}
            <div>
              <p className="text-sm text-on-surface-variant font-medium mb-2">Priority Level</p>
              <div className="flex gap-2">
                {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPriorityLevel(p); setPrioritySaved(false); }}
                    disabled={isUpdating}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg border-2 transition-all ${
                      priorityLevel === p
                        ? getPriorityColor(p)
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {p === 'URGENT' && (
                      <span className="material-symbols-outlined text-[14px] mr-1 align-middle" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    )}
                    {p}
                  </button>
                ))}
              </div>
              {/* Urgent warning callout */}
              {priorityLevel === 'URGENT' && (
                <div className="mt-3 flex items-start gap-2 bg-error/10 border border-error/30 rounded-lg px-4 py-3">
                  <span className="material-symbols-outlined text-error text-[18px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <p className="text-xs text-error font-medium">
                    This request will be flagged as <strong>URGENT</strong> and prioritized above all other requests.
                  </p>
                </div>
              )}
            </div>

            {/* Admin Notes — only for PENDING triage */}
            {isPending && (
              <div>
                <p className="text-sm text-on-surface-variant font-medium mb-2">Admin Notes</p>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={isUpdating}
                  placeholder="Add internal triage notes (not visible to the requester)..."
                  className="w-full bg-surface border border-outline-variant rounded-lg p-3 text-sm text-on-surface h-24 resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Actions */}
            {isPending ? (
              /* ── Triage actions for PENDING ── */
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleApprove}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#10B981] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  {isUpdating ? 'Approving…' : 'Approve Request'}
                </button>
                <button
                  onClick={onReject}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-error text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  <span className="material-symbols-outlined">cancel</span>
                  Reject Request
                </button>
              </div>
            ) : (
              /* ── Standalone priority update for non-PENDING ── */
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleUpdatePriority}
                  disabled={isUpdating || !priorityChanged}
                  className={`flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-xl transition-all disabled:opacity-50 ${
                    priorityChanged
                      ? 'bg-primary text-white hover:opacity-90 shadow-sm'
                      : 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {isUpdating ? 'Saving…' : 'Update Priority'}
                </button>
                {prioritySaved && (
                  <span className="flex items-center gap-1 text-sm font-medium text-[#10B981] animate-fade-in">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Priority updated!
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Current Priority badge for terminal statuses ── */}
        {isTerminal && (
          <div className="border-t border-outline-variant bg-surface-container-low p-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">flag</span>
              <span className="text-sm text-on-surface-variant font-medium">Final Priority:</span>
              <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border-2 ${getPriorityColor(request.priorityLevel || 'NORMAL')}`}>
                {request.priorityLevel || 'NORMAL'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Overlay */}
      {lightboxOpen && lightboxImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white hover:text-gray-300"
          >
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>
          <img src={lightboxImage} alt="Enlarged evidence" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
    </>
  );
}

'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface RequestInfoCardProps {
  request: any;
}

export default function RequestInfoCard({ request }: RequestInfoCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
                {/* Assuming photoUrl is a single string or comma-separated. The DB schema shows it's a String (optional). We'll treat it as a single URL for now, but split by comma just in case. */}
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

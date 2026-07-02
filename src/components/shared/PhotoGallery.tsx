'use client'

import { useState } from 'react'

interface PhotoGalleryProps {
  photoUrl: string | null
  label?: string
}

export default function PhotoGallery({ photoUrl, label = 'Photo Evidence' }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  if (!photoUrl) return null

  // Parse photos — stored as JSON array of base64 strings
  let photos: string[] = []
  try {
    const parsed = JSON.parse(photoUrl)
    if (Array.isArray(parsed)) {
      photos = parsed
    } else if (typeof parsed === 'string') {
      photos = [parsed]
    }
  } catch {
    // Single base64 string stored directly
    if (photoUrl.startsWith('data:image')) {
      photos = [photoUrl]
    }
  }

  if (photos.length === 0) return null

  return (
    <>
      {/* Gallery Section */}
      <div className="flex flex-col gap-3">
        <span className="font-sidebar-label text-sidebar-label text-on-surface-variant uppercase">
          {label} ({photos.length} {photos.length === 1 ? 'photo' : 'photos'})
        </span>

        {/* Photo Grid */}
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-high border border-outline-variant cursor-pointer hover:opacity-90 hover:shadow-md transition-all group"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo}
                alt={`Evidence photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Expand icon on hover */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[24px]">
                  zoom_in
                </span>
              </div>
              {/* Photo number badge */}
              <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                {index + 1}/{photos.length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal — click photo to enlarge */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh]">
            {/* Close button */}
            <button
              className="absolute -top-10 right-0 text-white hover:text-surface-variant transition-colors flex items-center gap-1 font-label-md text-label-md"
              onClick={() => setSelectedPhoto(null)}
            >
              <span className="material-symbols-outlined">close</span>
              Close
            </button>

            {/* Full size image */}
            <img
              src={selectedPhoto}
              alt="Full size evidence"
              className="w-full h-full object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Navigation dots if multiple photos */}
            {photos.length > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPhoto(photo)
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      selectedPhoto === photo
                        ? 'bg-white scale-125'
                        : 'bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

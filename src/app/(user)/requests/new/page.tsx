'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BUILDINGS, BUILDING_AREAS } from '@/lib/constants/buildings';
import Toast from '@/components/shared/Toast';

function NewRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill from QR params
  const buildingParam = searchParams.get('building') || '';
  const roomParam = searchParams.get('room') || '';

  const [formData, setFormData] = useState({
    issueType: '',
    building: buildingParam,
    roomNumber: roomParam,
    locationNotes: '',
    title: '',
    description: ''
  });
  
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      ...(name === 'building' ? { roomNumber: '' } : {})
    }));
    if (hasSubmitted) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = e.target.files;
    const valid: File[] = [];
    let err = '';
    
    Array.from(files).forEach(file => {
      if (photos.length + valid.length >= 3) { err = 'Maximum 3 photos allowed.'; return; }
      if (file.size > 5 * 1024 * 1024) { err = `${file.name} exceeds 5MB limit.`; return; }
      if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { err = 'Only JPG, PNG, WEBP supported.'; return; }
      valid.push(file);
    });
    
    setPhotoError(err);
    setPhotos(prev => [...prev, ...valid]);
    setPhotoPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.issueType) e.issueType = 'Please select an issue type.';
    if (!formData.building) e.building = 'Please select a building.';
    if (!formData.roomNumber.trim()) e.roomNumber = 'Please enter the room or area.';
    if (!formData.title.trim()) e.title = 'Please provide a brief title.';
    if (formData.description.trim().length < 20) e.description = 'Description must be at least 20 characters.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    const validationErrors = validate();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      // Small timeout to allow DOM to update before selecting
      setTimeout(() => {
        document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const base64Photos = await Promise.all(
        photos.map(f => new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const max_size = 1200;

              if (width > height) {
                if (width > max_size) {
                  height = Math.round(height * (max_size / width));
                  width = max_size;
                }
              } else {
                if (height > max_size) {
                  width = Math.round(width * (max_size / height));
                  height = max_size;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) return rej('Context error');
              ctx.drawImage(img, 0, 0, width, height);
              res(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% JPEG
            };
            img.onerror = rej;
            img.src = e.target?.result as string;
          };
          reader.onerror = rej;
          reader.readAsDataURL(f);
        }))
      );
      
      const response = await fetch('/api/user/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, photos: base64Photos })
      });
      
      if (response.ok) {
        const data = await response.json();
        showToast(`${data.requestCode} submitted successfully!`, 'success');
        router.push(`/requests/${data.requestId}`);
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to submit request.', 'error');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      showToast('An unexpected error occurred.', 'error');
      setIsSubmitting(false);
    }
  };

  const inputClass = (name: string) => `w-full rounded-lg border bg-surface px-4 py-2.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 transition-all ${
    errors[name] 
      ? 'border-error focus:border-error focus:ring-error' 
      : 'border-outline-variant focus:border-secondary focus:ring-secondary'
  }`;

  const labelClass = "block font-label-md text-label-md text-on-surface-variant mb-1.5";
  const errorClass = "text-error text-xs mt-1";
  const sectionHeaderClass = "font-table-header text-table-header text-on-surface uppercase tracking-wider mb-4";
  const dividerClass = "border-t border-outline-variant my-6";

  return (
    <div className="min-h-screen bg-surface-container-lowest py-8 px-4">
      {/* Page Header */}
      <div className="max-w-3xl mx-auto mb-8">
        <h1 className="font-h1 text-h1 text-on-surface flex items-center gap-3 text-3xl font-bold">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            add_circle
          </span>
          Submit New Request
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Report an issue or describe a facility problem that needs attention.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* QR Pre-fill Banner */}
        {(buildingParam || roomParam) && (
          <div className="bg-primary-fixed text-on-primary-fixed px-4 py-3 rounded-lg flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>qr_code</span>
            <span className="font-body-sm text-body-sm">Location pre-filled from QR code scan. Please complete the remaining fields.</span>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast({ ...toast, show: false })}
          />
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_8px_24px_rgba(30,58,138,0.08)] p-8">
          
          {/* SECTION 1 — ISSUE DETAILS */}
          <div>
            <h2 className={sectionHeaderClass}>Issue Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Issue Type *</label>
                <select 
                  name="issueType" 
                  value={formData.issueType} 
                  onChange={handleChange} 
                  className={inputClass('issueType')}
                  data-error={!!errors.issueType}
                >
                  <option value="">Select Issue Type</option>
                  <option value="HVAC">HVAC</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="CARPENTRY">Carpentry</option>
                  <option value="STRUCTURAL">Structural</option>
                  <option value="OTHERS">Others</option>
                </select>
                {errors.issueType && <p className={errorClass}>{errors.issueType}</p>}
              </div>
            </div>
          </div>

          <hr className={dividerClass} />

          {/* SECTION 2 — LOCATION */}
          <div>
            <h2 className={sectionHeaderClass}>Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Building *</label>
                <select 
                  name="building" 
                  value={formData.building} 
                  onChange={handleChange} 
                  className={inputClass('building')}
                  data-error={!!errors.building}
                >
                  <option value="">Select Building</option>
                  {BUILDINGS.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
                {errors.building && <p className={errorClass}>{errors.building}</p>}
              </div>

              <div>
                <label className={labelClass}>Room / Area *</label>
                <select
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  disabled={!formData.building}
                  className={`${inputClass('roomNumber')} ${!formData.building ? 'opacity-60 cursor-not-allowed bg-surface-container-high' : ''}`}
                  data-error={!!errors.roomNumber}
                >
                  {!formData.building ? (
                    <option value="">Select a building first</option>
                  ) : (
                    <>
                      <option value="">Select Room / Area</option>
                      {BUILDING_AREAS[formData.building]?.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </>
                  )}
                </select>
                {errors.roomNumber && <p className={errorClass}>{errors.roomNumber}</p>}
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Additional Location Details (optional)</label>
                <textarea 
                  name="locationNotes" 
                  value={formData.locationNotes} 
                  onChange={handleChange} 
                  placeholder="Any extra details to help locate the issue (e.g. near the fire exit, second floor, left side of the room)" 
                  rows={2} 
                  className={`resize-none ${inputClass('locationNotes')}`}
                />
              </div>
            </div>
          </div>

          <hr className={dividerClass} />

          {/* SECTION 3 — DESCRIPTION */}
          <div>
            <h2 className={sectionHeaderClass}>Issue Description</h2>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Brief Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  placeholder="e.g. AC unit leaking water in ComLab" 
                  maxLength={100} 
                  className={inputClass('title')}
                  data-error={!!errors.title}
                />
                {errors.title ? (
                  <p className={errorClass}>{errors.title}</p>
                ) : (
                  <p className="font-body-sm text-outline text-xs mt-1">Write a short summary of the problem (max 100 characters)</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Detailed Description *</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  placeholder="Describe the issue in detail — when it started, how severe it is, what you observed, and any other relevant information..." 
                  rows={5} 
                  maxLength={500} 
                  className={`resize-none ${inputClass('description')}`}
                  data-error={!!errors.description}
                />
                <div className="flex justify-between items-start mt-1">
                  <div>
                    {errors.description && <p className={errorClass}>{errors.description}</p>}
                  </div>
                  <div className={`text-xs text-right ${formData.description.length > 400 ? 'text-error' : hasSubmitted && formData.description.length < 20 ? 'text-error' : 'text-outline'}`}>
                    {formData.description.length}/500 characters
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className={dividerClass} />

          {/* SECTION 4 — PHOTO EVIDENCE */}
          <div>
            <h2 className={sectionHeaderClass}>Photo Evidence</h2>
            <p className="font-body-sm text-body-sm text-outline mb-4">
              Upload up to 3 photos as proof of the issue. Supported formats: JPG, PNG, WEBP. Max 5MB each.
            </p>

            <div className="flex flex-wrap gap-4">
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden aspect-square bg-surface-container-high w-24 h-24 sm:w-32 sm:h-32">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => handleRemovePhoto(index)} 
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-error transition-colors"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                  
                  {photoPreviews.length < 3 && (
                    <div 
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="border-2 border-dashed border-outline-variant rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-secondary hover:bg-surface-container-low transition-all w-24 h-24 sm:w-32 sm:h-32"
                    >
                      <span className="material-symbols-outlined text-[32px] text-outline">add_photo_alternate</span>
                      <span className="text-xs text-outline mt-1">Add photo</span>
                    </div>
                  )}
                </div>
              )}

              {photoPreviews.length === 0 && (
                <div 
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  className="w-full border-2 border-dashed border-outline-variant rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-secondary hover:bg-surface-container-low transition-all"
                >
                  <span className="material-symbols-outlined text-outline text-[48px]">upload_file</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">Click to upload or drag and drop</span>
                  <span className="font-body-sm text-body-sm text-outline">JPG, PNG, WEBP — Max 5MB each (up to 3 photos)</span>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              id="photo-upload" 
              accept="image/jpeg,image/png,image/webp" 
              multiple 
              onChange={handlePhotoSelect} 
              className="hidden" 
            />
            {photoError && <p className={errorClass}>{photoError}</p>}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-outline-variant">
            <button 
              type="button" 
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="bg-surface border border-outline-variant text-on-surface hover:bg-surface-variant rounded-lg px-6 py-2.5 font-label-md text-label-md disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-secondary text-on-secondary hover:bg-primary active:scale-[0.98] rounded-lg px-8 py-3 font-label-md text-label-md shadow-md flex items-center gap-2 transition-all disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>progress_activity</span>
                  Submitting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                  Submit Request
                </>
              )}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <NewRequestContent />
    </Suspense>
  );
}
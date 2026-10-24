'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PhotoEvidenceUpload, { encodeEvidencePhoto } from './PhotoEvidenceUpload';
import { formatRequestDate, MAX_DESCRIPTION, MAX_WORK_LOCATION, REQUEST_PRIORITIES, validateRequestInput } from '@/lib/requests/form';

interface Props { requestDate: string; requestingParty: string; initialLocation: string }
export default function OfficialRequestForm({ requestDate, requestingParty, initialLocation }: Props) {
  const router = useRouter();
  const [workLocation, setWorkLocation] = useState(initialLocation);
  const [description, setDescription] = useState('');
  const [requestedPriority, setRequestedPriority] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);

  function clearFieldError(name: string) {
    setErrors(previous => {
      const next = { ...previous };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError('');
    const result = validateRequestInput({ workLocation, description, requestedPriority });
    if (result.errors) { setErrors(result.errors); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const encodedPhotos = await Promise.all(photos.map(encodeEvidencePhoto));
      const payload = JSON.stringify({ ...result.data, photos: encodedPhotos });
      if (new TextEncoder().encode(payload).byteLength > 4 * 1024 * 1024) throw new Error('The request is too large. Remove or resize photos and try again.');
      // Locked fields are deliberately not accepted from the browser.
      const response = await fetch('/api/user/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload,
      });
      if (response.status === 413) throw new Error('The request is too large. Remove or resize photos and try again.');
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.errors || {});
        throw new Error(data.error || 'Could not submit the request.');
      }
      router.push(`/requests/${data.requestId}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not submit the request.');
      setSubmitting(false);
    }
  }
  const inputStyle = 'mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 read-only:bg-slate-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500';
  return (
    <div className="mx-auto max-w-4xl pb-10 pt-6">
      <form onSubmit={handleSubmit} noValidate aria-labelledby="official-form-title" className="rounded-lg border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-12 sm:py-14">
        <h1 id="official-form-title" className="mb-12 text-center text-2xl font-medium leading-relaxed text-slate-800 sm:text-3xl">Maintenance / Custodial Work Request Form</h1>
        <div className="mb-7 grid gap-6 sm:grid-cols-[1fr_1.6fr]">
          <div>
            <label htmlFor="requestDate" className="text-sm font-medium text-slate-700">Date of Request:</label>
            <input id="requestDate" value={formatRequestDate(requestDate)} readOnly aria-readonly="true" className={inputStyle + ' cursor-default text-slate-600'} />
          </div>
          <div>
            <label htmlFor="requestingParty" className="text-sm font-medium text-slate-700">Requesting Party:</label>
            <input id="requestingParty" value={requestingParty} readOnly aria-readonly="true" className={inputStyle + ' cursor-default text-slate-600'} />
          </div>
        </div>
        <div className="mb-7">
          <label htmlFor="workLocation" className="text-sm font-medium text-slate-700">Work Location:</label>
          <input id="workLocation" name="workLocation" value={workLocation} onChange={e => { setWorkLocation(e.target.value); clearFieldError('workLocation'); }} maxLength={MAX_WORK_LOCATION} required aria-invalid={!!errors.workLocation} aria-describedby={errors.workLocation ? 'location-error' : undefined} className={inputStyle} />
          {errors.workLocation && <p id="location-error" role="alert" className="mt-2 text-sm text-red-700">{errors.workLocation}</p>}
        </div>
        <div className="mb-9">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">Description of work/repair:</label>
          <textarea id="description" name="description" value={description} onChange={e => { setDescription(e.target.value); clearFieldError('description'); }} maxLength={MAX_DESCRIPTION} required rows={6} aria-invalid={!!errors.description} aria-describedby={errors.description ? 'description-counter description-error' : 'description-counter'} className={inputStyle + ' min-h-44 resize-y text-base leading-relaxed'} />
          <p id="description-counter" role="status" aria-live="polite" aria-atomic="true" className={`mt-2 text-right text-xs tabular-nums ${description.length >= 450 ? 'text-amber-700' : 'text-slate-500'}`}>{description.length}/{MAX_DESCRIPTION}</p>
          {errors.description && <p id="description-error" role="alert" className="mt-2 text-sm text-red-700">{errors.description}</p>}
        </div>
        <fieldset className="space-y-5 border-b border-slate-400 pb-7" aria-describedby={errors.requestedPriority ? 'priority-error' : undefined}>
          <legend className="mb-6 text-sm font-medium text-slate-700">Requested Priority:</legend>
          {REQUEST_PRIORITIES.map(priority => (
            <label key={priority.value} className="flex cursor-pointer items-center gap-3 text-sm leading-6 text-slate-800 sm:text-base">
              <input type="radio" name="requestedPriority" value={priority.value} checked={requestedPriority === priority.value} onChange={e => { setRequestedPriority(e.target.value); clearFieldError('requestedPriority'); }} required className="h-5 w-5 shrink-0 appearance-none rounded-none border border-slate-500 checked:border-blue-800 checked:bg-blue-800 checked:shadow-[inset_0_0_0_3px_white] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
              {priority.label}
            </label>
          ))}
          {errors.requestedPriority && <p id="priority-error" role="alert" className="text-sm text-red-700">{errors.requestedPriority}</p>}
        </fieldset>
        <PhotoEvidenceUpload onChange={setPhotos} disabled={submitting} />
        {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <Link href="/requests" className="rounded-md border border-slate-300 px-5 py-3 text-sm text-slate-700">Cancel</Link>
          <button type="submit" disabled={submitting} className="rounded-md bg-blue-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit Request'}</button>
        </div>
      </form>
    </div>
  );
}

'use client';
/* Native img is intentional for browser-local blob previews, not remote Next Image optimization. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { evidenceFileError, EVIDENCE_MIME_TYPES, MAX_EVIDENCE_PHOTOS } from '@/lib/requests/photo-rules';
interface Props { onChange: (files: File[]) => void; disabled: boolean }
interface Preview { id: number; file: File; url: string }
export async function encodeEvidencePhoto(file: File): Promise<string> {
  // Same browser-side resizing/compression as the original FixTrack form.
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) { reject(new Error('Could not prepare the evidence photo.')); return; }
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      // Budget includes base64 overhead: three encoded photos fit below 4 MiB JSON.
      let encoded = '';
      for (let attempt = 0; attempt < 8; attempt++) {
        const ratio = Math.pow(0.8, Math.floor(attempt / 3));
        canvas.width = Math.max(1, Math.round(image.width * scale * ratio));
        canvas.height = Math.max(1, Math.round(image.height * scale * ratio));
        context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        encoded = canvas.toDataURL('image/jpeg', [0.7, 0.55, 0.4][attempt % 3]);
        if (encoded.length <= 1024 * 1024) { resolve(encoded); return; }
      }
      reject(new Error('This photo could not be resized for upload. Select a smaller image and retry.'));
    };
    image.onerror = () => reject(new Error(`${file.name} could not be opened as an image.`));
    image.src = original;
  });
}
export default function PhotoEvidenceUpload({ onChange, disabled }: Props) {
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [error, setError] = useState('');
  const items = useRef<Preview[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const sequence = useRef(0);
  useEffect(() => () => { items.current.forEach(item => URL.revokeObjectURL(item.url)); }, []);
  function selectFiles(files: File[]) {
    if (disabled) return;
    const next = [...items.current]; const errors: string[] = [];
    for (const file of files) {
      const invalid = evidenceFileError(file);
      if (invalid) { errors.push(invalid); continue; }
      if (next.length >= MAX_EVIDENCE_PHOTOS) { errors.push('Maximum 3 photos allowed.'); continue; }
      next.push({ id: ++sequence.current, file, url: URL.createObjectURL(file) });
    }
    items.current = next; setPreviews(next); onChange(next.map(item => item.file));
    setError([...new Set(errors)].join(' '));
  }
  function remove(id: number) {
    const removed = items.current.find(item => item.id === id);
    if (removed) URL.revokeObjectURL(removed.url);
    const next = items.current.filter(item => item.id !== id);
    items.current = next; setPreviews(next); onChange(next.map(item => item.file)); setError('');
  }
  return (
    <section aria-labelledby="photo-evidence-title" className="mt-8 border-b border-slate-300 pb-7">
      <h2 id="photo-evidence-title" className="text-sm font-semibold uppercase tracking-wide text-slate-800">Photo Evidence</h2>
      <p id="photo-evidence-help" className="mb-4 mt-2 text-sm leading-relaxed text-slate-500">Upload up to 3 photos as proof of the issue. Supported formats: JPG, PNG, WEBP. Max 5MB each. Photos are resized/compressed before submission for reliable hosted uploads.</p>
      {previews.length > 0 && <div className="mb-4 grid grid-cols-3 gap-3">
        {previews.map((photo, index) => <div key={photo.id} className="relative aspect-square min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <img src={photo.url} alt={`Evidence preview ${index + 1}`} className="h-full w-full object-cover" />
          <button type="button" disabled={disabled} aria-label={`Remove photo ${index + 1}`} onClick={() => remove(photo.id)} className="absolute right-1 top-1 h-7 w-7 rounded-full bg-black/70 text-lg text-white disabled:opacity-50">×</button>
          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-2 py-1 text-xs text-white">{index + 1}</span>
        </div>)}
      </div>}
      <button type="button" disabled={disabled} onClick={() => input.current?.click()}
        onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); selectFiles(Array.from(event.dataTransfer.files)); }}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white px-4 py-8 text-center hover:border-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50">
        <span className="material-symbols-outlined text-3xl text-slate-500" aria-hidden="true">upload_file</span>
        <span className="text-sm font-medium text-slate-700">{previews.length ? 'Add photos or drag and drop' : 'Click to upload or drag and drop'}</span>
        <span className="text-xs text-slate-500">JPG, PNG, WEBP — Max 5MB each (up to 3 photos)</span>
      </button>
      <input ref={input} id="photo-upload" aria-label="Photo evidence files" aria-describedby="photo-evidence-help" type="file" accept={EVIDENCE_MIME_TYPES.join(',')} multiple disabled={disabled} onChange={event => { selectFiles(Array.from(event.target.files || [])); event.target.value = ''; }} className="sr-only" />
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </section>
  );
}

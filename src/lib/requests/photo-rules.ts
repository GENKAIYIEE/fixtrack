export const MAX_EVIDENCE_PHOTOS = 3;
export const MAX_EVIDENCE_PHOTO_BYTES = 5 * 1024 * 1024;
export const EVIDENCE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export function evidenceFileError(file: { type: string; size: number; name: string }): string | null {
  if (!(EVIDENCE_MIME_TYPES as readonly string[]).includes(file.type)) return 'Only JPG, PNG, and WEBP photos are supported.';
  if (file.size > MAX_EVIDENCE_PHOTO_BYTES) return `${file.name} exceeds the 5MB limit.`;
  if (file.size === 0) return `${file.name} is empty.`;
  return null;
}

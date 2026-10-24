import { RequestPhotoStorageError } from './submission-errors';
import { randomUUID } from 'node:crypto';
import { EVIDENCE_MIME_TYPES, MAX_EVIDENCE_PHOTO_BYTES, MAX_EVIDENCE_PHOTOS } from './photo-rules';

export class PhotoEvidenceError extends Error {}
export interface EvidencePhoto { mimeType: string; buffer: Buffer; extension: string }
export function validateEvidencePhotos(value: unknown): EvidencePhoto[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_EVIDENCE_PHOTOS) throw new PhotoEvidenceError('Upload up to 3 photos.');
  return value.map((photo, index) => {
    if (typeof photo !== 'string' || photo.length > Math.ceil(MAX_EVIDENCE_PHOTO_BYTES / 3) * 4 + 100) {
      throw new PhotoEvidenceError(`Photo ${index + 1} is invalid or exceeds the 5MB limit.`);
    }
    const match = photo.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match || !(EVIDENCE_MIME_TYPES as readonly string[]).includes(match[1])) throw new PhotoEvidenceError('Only valid JPG, PNG, and WEBP photos are supported.');
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > MAX_EVIDENCE_PHOTO_BYTES || buffer.toString('base64') !== match[2]) throw new PhotoEvidenceError(`Photo ${index + 1} is invalid or exceeds the 5MB limit.`);
    const validSignature = match[1] === 'image/png'
      ? buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : match[1] === 'image/jpeg' ? buffer.subarray(0, 3).equals(Buffer.from([255,216,255]))
      : buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
    if (!validSignature) throw new PhotoEvidenceError(`Photo ${index + 1} does not match its declared image format.`);
    return { mimeType: match[1], extension: match[1].split('/')[1], buffer };
  });
}
export interface EvidenceStorage {
  upload(path: string, data: Buffer, options: { contentType: string; upsert: boolean }): Promise<{ error: { message: string } | null }>;
  remove(paths: string[]): Promise<{ error: { message: string } | null }>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
}
export async function uploadEvidencePhotos(photos: EvidencePhoto[], userId: string, requestCode: string, storage?: EvidenceStorage) {
  if (!photos.length) return { photoUrl: null, rollback: async () => {} };
  let bucket: EvidenceStorage;
  try {
    if (storage) bucket = storage;
    else {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new RequestPhotoStorageError('Photo evidence storage is not configured. Ask the administrator to check the Supabase API URL and server service-role key.', 'REQUEST_PHOTO_STORAGE_NOT_CONFIGURED');
      }
      const { supabaseAdmin } = await import('@/lib/supabase/admin');
      const { data: settings, error } = await supabaseAdmin.storage.getBucket('request-photos');
      if (error || !settings || settings.public !== true) {
        throw new RequestPhotoStorageError('Photo evidence storage is unavailable. Ask the administrator to check the request-photos bucket and its existing public-read configuration. Your request was not saved.', 'REQUEST_PHOTO_BUCKET_UNAVAILABLE');
      }
      bucket = supabaseAdmin.storage.from('request-photos');
    }
  } catch (error) {
    if (error instanceof RequestPhotoStorageError) throw error;
    throw new RequestPhotoStorageError('Photo evidence storage could not be reached. Check that local Supabase is running and its URL and service-role key match.', 'REQUEST_PHOTO_STORAGE_UNAVAILABLE');
  }
  const uploaded: string[] = [];
  const urls: string[] = [];
  const rollback = async () => {
    if (!uploaded.length) return;
    const { error } = await bucket.remove(uploaded);
    if (error) throw new Error('New request photo cleanup requires administrator review.');
    uploaded.length = 0;
  };
  try {
    for (const photo of photos) {
      const name = `${userId}-${requestCode}-${randomUUID()}.${photo.extension}`;
      const { error } = await bucket.upload(name, photo.buffer, { contentType: photo.mimeType, upsert: false });
      if (error) throw new RequestPhotoStorageError('Could not upload the photo evidence. Check local Supabase Storage and retry. Your request was not saved.', 'REQUEST_PHOTO_UPLOAD_FAILED');
      uploaded.push(name);
      urls.push(bucket.getPublicUrl(name).data.publicUrl);
    }
    return { photoUrl: JSON.stringify(urls), rollback };
  } catch (error) {
    try { await rollback(); } catch { console.error('[request photos] Cleanup of newly uploaded evidence requires administrator review.'); }
    if (error instanceof RequestPhotoStorageError) throw error;
    throw new RequestPhotoStorageError('Photo evidence upload was interrupted. Check local Supabase Storage and retry.', 'REQUEST_PHOTO_UPLOAD_FAILED');
  }
}

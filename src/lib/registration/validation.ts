import sharp from 'sharp';
import { RegistrationError } from './turnstile';
import { validateEvidencePhotos } from '@/lib/requests/photo-storage';
export const MAX_ID_PHOTO_BYTES = 3 * 1024 * 1024;
export const MAX_ID_IMAGE_PIXELS = 20_000_000;
export const ID_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const DEPARTMENTS = ['BSIT', 'BEED/BSE', 'BSBA', 'BSHM', 'BSTM', 'MARINE', 'CRIM'];
export function registrationFields(form: FormData) {
  const text = (name: string, max: number) => {
    const value = form.get(name);
    if (typeof value !== 'string' || !value.trim() || value.length > max) throw new RegistrationError(`Please enter a valid ${name}.`);
    return value.trim();
  };
  const firstName = text('firstName', 100), lastName = text('lastName', 100);
  const email = text('email', 254).toLowerCase(), department = text('department', 50);
  const password = form.get('password');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !DEPARTMENTS.includes(department)) throw new RegistrationError('Please enter a valid email and department.');
  if (typeof password !== 'string' || password.length < 8 || password.length > 128 ||
      [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(rule => rule.test(password)).length < 2) {
    throw new RegistrationError('Use a password of 8–128 characters with a mix of letters, numbers, or special characters.');
  }
  return { firstName, lastName, email, department, password };
}
export async function registrationIdPhoto(form: FormData) {
  const files = form.getAll('idPhoto');
  if (files.length !== 1 || !(files[0] instanceof File) || !files[0].size) throw new RegistrationError('Upload one photo of your valid ID.');
  const file = files[0];
  if (file.size > MAX_ID_PHOTO_BYTES || !(ID_PHOTO_TYPES as readonly string[]).includes(file.type)) throw new RegistrationError('ID photo must be JPG, PNG, or WEBP and no larger than 3MB.');
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    // Reuse signature checks, then actually decode: a MIME/header alone is not an image.
    validateEvidencePhotos([`data:${file.type};base64,${buffer.toString('base64')}`]);
    const image = sharp(buffer, { limitInputPixels: MAX_ID_IMAGE_PIXELS, failOn: 'warning' });
    const metadata = await image.metadata();
    const format = file.type === 'image/jpeg' ? 'jpeg' : file.type.split('/')[1];
    if (metadata.format !== format || !metadata.width || !metadata.height || metadata.width * metadata.height > MAX_ID_IMAGE_PIXELS || (metadata.pages || 1) !== 1) throw new Error('Unsupported or animated image');
    // Keep full resolution, apply orientation, strip EXIF/GPS/other metadata and trailing payloads.
    // No face analysis or identity authenticity decision is performed.
    const sanitized = await image.rotate().flatten({ background: '#ffffff' }).jpeg({ quality: 95 }).toBuffer();
    if (sanitized.length > MAX_ID_PHOTO_BYTES) throw new RegistrationError('The processed ID photo exceeds 3MB. Please use a smaller clear image.');
    return { mimeType: 'image/jpeg', buffer: sanitized, extension: 'jpg' };
  } catch (error) {
    if (error instanceof RegistrationError) throw error;
    throw new RegistrationError('Upload a valid, non-animated JPG, PNG, or WEBP image up to 20 megapixels.');
  }
}

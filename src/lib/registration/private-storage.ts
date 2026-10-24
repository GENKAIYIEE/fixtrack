import type { SupabaseClient } from '@supabase/supabase-js';
import { RegistrationError } from './turnstile';
export const REGISTRATION_BUCKET = 'registration-ids';
const unavailable = () => new RegistrationError('Private ID storage could not be reached. Ask the administrator to verify the Supabase project URL and server service-role key, then retry.', 503);
function missing(error: { status?: number | string; statusCode?: number | string; message?: string } | null) {
  const status = String(error?.statusCode ?? error?.status ?? '');
  return status === '404' || (status === '400' && /^bucket not found[.!]?$/i.test(error?.message || ''));
}
/** Never makes a bucket public or changes existing policies. Safe on concurrent first registrations. */
export async function privateIdBucket(client: Pick<SupabaseClient, 'storage'>, createMissing = false) {
  try {
    let result = await client.storage.getBucket(REGISTRATION_BUCKET);
    if (result.error && missing(result.error) && createMissing) {
      // A concurrent request may create it first; always reread and verify rather than trusting create.
      await client.storage.createBucket(REGISTRATION_BUCKET, { public: false, fileSizeLimit: 3145728, allowedMimeTypes: ['image/jpeg','image/png','image/webp'] });
      result = await client.storage.getBucket(REGISTRATION_BUCKET);
    }
    if (result.error || !result.data) throw unavailable();
    if (result.data.public !== false) throw new RegistrationError('Registration is paused because the ID bucket is not private. The administrator must review its privacy and access policies before registration can continue.', 503);
    return client.storage.from(REGISTRATION_BUCKET);
  } catch (error) { if (error instanceof RegistrationError) throw error; throw unavailable(); }
}

/** Explicit local-only setup for existing PUBLIC maintenance evidence, never private ID storage. */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export async function setupLocalRequestStorage(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch) {
  if (env.NODE_ENV === 'production' || env.FIXTRACK_ALLOW_LOCAL_REQUEST_STORAGE_SETUP !== '1') {
    throw new Error('Local setup only. Set FIXTRACK_ALLOW_LOCAL_REQUEST_STORAGE_SETUP=1 explicitly.');
  }
  if (env.FIXTRACK_ACK_PUBLIC_REQUEST_PHOTOS !== '1') throw new Error('Maintenance evidence uses existing public-read URLs. Set FIXTRACK_ACK_PUBLIC_REQUEST_PHOTOS=1 to acknowledge this for local synthetic test photos only. Private ID photos must never use this bucket.');
  let url: URL;
  try { url = new URL(env.NEXT_PUBLIC_SUPABASE_URL || ''); } catch { throw new Error('Set NEXT_PUBLIC_SUPABASE_URL to your local Supabase API URL.'); }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Only a localhost Supabase API URL is allowed. Hosted services are refused.');
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY to the service_role key from this local Supabase instance. Never use the anon key or a hosted key.');
  const client = createClient(url.toString(), env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: fetcher },
  });
  const inspect = await client.storage.getBucket('request-photos');
  let settings = inspect.data;
  if (inspect.error) {
    if (String(inspect.error.status) !== '404' && String(inspect.error.statusCode) !== '404') {
      throw new Error('Could not inspect local request-photo storage. Check Docker/Supabase is running and the API URL and service_role key belong to the same local instance.');
    }
    const created = await client.storage.createBucket('request-photos', {
      public: true, fileSizeLimit: 5242880, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
    if (created.error) throw new Error('Could not create the local request-photo bucket. Check local storage health and the local service_role key.');
    const verified = await client.storage.getBucket('request-photos');
    if (verified.error) throw new Error('The bucket was created but could not be verified. Check local storage before submitting a request.');
    settings = verified.data;
  }
  if (!settings || settings.public !== true) throw new Error('The existing request-photos bucket is not public as required by the current evidence viewer. Nothing was changed. Review its intended privacy before changing anything; never make registration-ids public.');
  return 'Local request-photos bucket verified for the existing public-read maintenance-photo viewer. No accounts, existing files, storage policies, or private registration-ids bucket were changed. Uploads still use the server service-role key; do not add anonymous upload policies.';
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/setup-local-request-storage.ts')) {
  setupLocalRequestStorage().then(message => console.log(message)).catch(error => {
    // Do not print provider responses, URLs, credentials, or uploaded document paths.
    console.error(error instanceof Error ? error.message : 'Local request-photo storage setup failed.');
    process.exitCode = 1;
  });
}

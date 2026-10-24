/** Explicit local-only bucket setup. Never changes an existing bucket or policies. */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export async function setupLocalIdStorage(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch) {
  if (env.NODE_ENV === 'production' || env.FIXTRACK_ALLOW_LOCAL_STORAGE_SETUP !== '1') {
    throw new Error('Local setup only. Set FIXTRACK_ALLOW_LOCAL_STORAGE_SETUP=1 explicitly.');
  }
  let url: URL;
  try { url = new URL(env.NEXT_PUBLIC_SUPABASE_URL || ''); } catch { throw new Error('Set NEXT_PUBLIC_SUPABASE_URL to your local Supabase API URL.'); }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Only a localhost Supabase API URL is allowed. Hosted services are refused.');
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY to the service_role key from this local Supabase instance. Never use the anon key or a hosted key.');
  const client = createClient(url.toString(), env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: fetcher },
  });
  const inspect = await client.storage.getBucket('registration-ids');
  let settings = inspect.data;
  if (inspect.error) {
    if (String(inspect.error.status) !== '404' && String(inspect.error.statusCode) !== '404') {
      throw new Error('Could not inspect local private storage. Check Docker/Supabase is running and the API URL and service_role key belong to the same local instance.');
    }
    const created = await client.storage.createBucket('registration-ids', {
      public: false, fileSizeLimit: 3145728, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
    if (created.error) throw new Error('Could not create the local private bucket. Check local storage health and the local service_role key.');
    const verified = await client.storage.getBucket('registration-ids');
    if (verified.error) throw new Error('The bucket was created but could not be verified. Check local storage before retrying registration.');
    settings = verified.data;
  }
  if (!settings || settings.public !== false) throw new Error('The existing registration-ids bucket is not private. Nothing was changed. Review its privacy and storage policies in local Supabase Studio; never allow public access to ID photos.');
  return 'Local registration-ids bucket verified as private. No accounts, existing files, or storage policies were changed. Review existing storage.objects policies separately; no broad client access should include this bucket.';
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/setup-local-id-storage.ts')) {
  setupLocalIdStorage().then(message => console.log(message)).catch(error => {
    // Do not print provider responses, URLs, credentials, or uploaded document paths.
    console.error(error instanceof Error ? error.message : 'Local private storage setup failed.');
    process.exitCode = 1;
  });
}

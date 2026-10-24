/** Explicit provisioning only. Reads private .env; never prints credentials/provider errors. */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { privateIdBucket } from '../src/lib/registration/private-storage';
async function main() {
  if (process.env.FIXTRACK_CONFIRM_PRIVATE_STORAGE_SETUP !== '1') throw new Error('Set FIXTRACK_CONFIRM_PRIVATE_STORAGE_SETUP=1 only after confirming the intended Supabase project in your private .env.');
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash || (url.protocol !== 'https:' && !['localhost','127.0.0.1','[::1]'].includes(url.hostname))) throw new Error('Use your Supabase project API URL, not a database connection URL.');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key || key.includes('REPLACE_')) throw new Error('Set the matching server service-role key privately. Never use the anon/publishable key.');
  const client = createClient(url.toString(),key,{auth:{persistSession:false,autoRefreshToken:false}});
  await privateIdBucket(client,true);
  console.log('Private registration-ids bucket verified. No existing files, accounts or policies were changed. Review Storage access policies separately before accepting real IDs.');
}
main().catch(e=>{console.error(e instanceof Error ? e.message : 'Private storage setup failed.');process.exitCode=1;});

# Local ID storage and simplified relay update

## Changes
- Removed the Designated Technician Head card from Admin > Task Assignment.
- Unassigned Approved Requests now uses the full width. Select a request and choose **Relay selected request**. The confirmation dialog identifies the configured receiving head; the existing server still enforces head-only assignment and duplicate/permission checks.
- Retained approved-task worker details and all worker-directory functionality.
- Added `scripts/setup-local-id-storage.ts`: an explicitly opted-in, localhost-only helper. It checks the private `registration-ids` bucket and creates it only when the provider reports it missing (404), with a 3 MiB limit and JPEG/PNG/WebP allowlist. It refuses an existing public bucket and never changes files, users, policies, or hosted services.

## Why registration reports “Private ID storage is unavailable”
The server checks Storage before uploading an ID. This message means the bucket could not be retrieved or it is not private. Typical causes are a missing bucket, stopped local Supabase Storage, or API URL/service_role credentials from different instances. Prisma migrations create application tables, not Storage buckets. A valid CAPTCHA does not configure storage.

## Apply this update
Stop Next.js (Ctrl+C), back up your project, then merge the patch into the project root. Keep your existing `.env` and Supabase configuration. No new Prisma migration, dependency, or required environment variable is introduced by this follow-up.

## Fix local Storage in PowerShell
Keep Docker and local Supabase running. Use the SAME PowerShell terminal where your local environment overrides are set. Verify `npx supabase status` shows the local API and database. Do not paste its private keys into chat.

```powershell
# These are local endpoint addresses, not hosted Supabase URLs.
$env:NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
# Set SUPABASE_SERVICE_ROLE_KEY to THIS local instance's service_role key,
# not its anon key, database password, or a hosted project's key.
$localServiceKey = Read-Host "Paste the local service_role key" -AsSecureString
$env:SUPABASE_SERVICE_ROLE_KEY = [System.Net.NetworkCredential]::new("", $localServiceKey).Password
$env:FIXTRACK_ALLOW_LOCAL_STORAGE_SETUP = "1"
npx tsx scripts/setup-local-id-storage.ts
Remove-Item Env:FIXTRACK_ALLOW_LOCAL_STORAGE_SETUP
Remove-Variable localServiceKey
npm run dev
```

The key remains a temporary environment variable in this terminal for the server; the helper does not edit `.env`. Also keep DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and CAPTCHA configuration set for the same local environment. Stop an existing Next.js server before restarting so it reads these values. Never expose the service_role key using a NEXT_PUBLIC variable.

Alternative: open local Supabase Studio (normally http://127.0.0.1:54323), choose SQL Editor, and run the existing `supabase/registration-id-storage.sql` ONLY on that local instance. Confirm Storage > registration-ids is private. Inspect existing storage.objects policies separately: no public/authenticated policy should grant client access to these ID files. Do not enable a public bucket or add broad read/write policies to work around errors.

If setup fails, check `npx supabase status`, Docker container health and the local key. The helper deliberately does not auto-repair a public bucket or create storage policies. It does not verify your computer remotely. Do not run Supabase reset or database reset.

## Privacy and limitations
Private ID uploads still use server-only service_role access. Authorized administrator review uses short-lived signed links. CAPTCHA remains mandatory and new accounts remain pending; this update does not bypass validation or approve accounts. Local Supabase must be configured on your own machine; the ZIP cannot contain its credentials. There is no local public-file fallback.

## Checks
See `LOCAL_ID_STORAGE_AND_RELAY_TEST_REPORT.md` for actual results. The setup helper's provider behavior is tested with synthetic HTTP responses, not your live Docker instance.

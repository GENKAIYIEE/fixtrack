# FixTrack — room reports, completion ratings and private registration storage

This update targets the **Next.js / Prisma / PostgreSQL / Supabase / Vercel** edition: `fixtrack-redeployment-update.zip` with the three files from `fixtrack-merge-conflict-fix.zip` applied. It is not the PHP/InfinityFree edition. No live site, database, hosting settings or repository was changed while preparing this release.

## Changes

### Reports & Analytics
New report-category selector, existing week/month/year period, room/work-location search, top-10 rankings:

1. **Most Frequently Repaired Rooms** — completed requests whose completion date is in the period.
2. **Rooms with the Most Reported Issues** — requests submitted during the period. This wording avoids claiming that every report proves damage. Includes rejected/cancelled submissions.
3. **Rooms with the Most Pending Requests** — period submissions currently awaiting review (PENDING only, not ongoing repairs).
4. **Rooms with the Longest Average Repair Time** — submission-to-completion hours for requests completed in the period. Invalid negative durations excluded.

Names are grouped ignoring letter case and repeated whitespace. Official workLocation is preferred; legacy building + room fields are the fallback. Blank locations are excluded. There is no canonical room directory in this original schema: use consistent names and include the building in a location when room numbers repeat between buildings. Top 10 only; the ranking is not a full raw-record export.

The selected room category is included in CSV and browser PDF/print. Rating summaries are independent: overall request average/count and up to 20 individual worker averages/counts. Rating summaries use the selected completion-date period, **not the room search**. Unrated requests/workers are not counted as zero.

### Ratings
- Active STUDENT/requester who owns a request can rate it only after COMPLETED.
- Whole stars only: **1–5**. No zero, fractions, negative values or >5, including direct API calls and database writes.
- One request score and separate optional scores for each worker still recorded on the task at completion. Previously removed workers and unrelated worker IDs are rejected.
- No worker account is created. Worker ratings refer to directory worker IDs, independent from the technician-head login and from the request's score.
- Requesters can update their ratings. Unique database constraints ensure updates replace scores rather than increasing vote counts.
- Other requesters cannot read/rate the request. Admin and receiving technician may view but not submit ratings on the requester's behalf.
- Worker directory shows each worker's own average/count. Completion ratings also appear on requester/admin/technician request-detail pages.
- Existing completed requests are eligible if the original requester is active; missing workers do not prevent rating the request itself.

### Private ID storage
CAPTCHA success and private-storage access are separate steps. A screenshot of successful CAPTCHA cannot establish whether the bucket is missing, public, inaccessible, or the server key points at another Supabase project.

Registration now checks the private `registration-ids` bucket and **creates it only when Supabase reports that it is missing**, with public=false, 3 MiB limit and JPG/PNG/WEBP only. It rereads privacy after creation, including concurrent first registrations. Existing public buckets are **not** silently converted; wrong credentials/outages are not bypassed. Existing files, account roles and policies are never reset.

The administrator ID-review endpoint uses the same verification without automatically creating storage. ID viewing still requires current administrator authorization and short-lived signed URLs. No ID URL/path is added to analytics or public pages.

## Apply to your local project

1. Keep your current project/private environment files. If you made later edits beyond the named source ZIPs, review the changed-file list and Git diff rather than blindly replacing them. Apply the patch ZIP contents into the project root, or use the full updated project with your private `.env` retained. The release does not contain a real `.env` or real keys.
2. Run from the project root:

   ```powershell
   npm ci
   npx prisma generate
   npx prisma migrate status
   ```

3. Before deployment, point your private migration connection at the intended hosted database and apply the new migration:

   ```powershell
   npx prisma migrate deploy
   npx prisma migrate status
   ```

   New migration: `20261025000000_request_worker_ratings`. It adds two rating tables, foreign keys, unique indexes, 1–5 CHECK constraints and server-only access. No data reset or seeded accounts. **Do not use migrate reset or db push to resolve an error.** If old baseline/previous migrations are unresolved, stop and inspect instead of marking anything applied blindly. Review/retain a database backup where available.

4. Run `npm run typecheck`, `npm run test:unit` and `npm run build`. Never run browser/workflow tests against your real database; those tests insert synthetic accounts/requests and require a disposable localhost `fixtrack_test...` database.
5. Configure hosted storage and variables as below, then commit/push to the already connected production branch. Confirm the Vercel deployment succeeds before testing the live URL.

## Fix hosted ID storage configuration

In the **same hosted Supabase project** that your app uses, verify:

- `NEXT_PUBLIC_SUPABASE_URL`: project API URL (`https://PROJECT.supabase.co`), **not** a PostgreSQL database URL.
- `SUPABASE_SERVICE_ROLE_KEY`: the matching **server-only service-role key**. Never an anon/publishable key and never a NEXT_PUBLIC variable. Keep it in Vercel's Production environment.
- Storage → `registration-ids`: **Private**. Never make IDs public to fix an upload error.
- Storage access policies: no anonymous/authenticated broad read/write policy may include this bucket. A private bucket blocks public-URL access, but broad authenticated policies can still expose IDs to clients; privacy and policies must both be reviewed.

Optional explicit setup from a terminal using your private `.env`:

```powershell
$env:FIXTRACK_CONFIRM_PRIVATE_STORAGE_SETUP = "1"
npm run storage:setup
Remove-Item Env:FIXTRACK_CONFIRM_PRIVATE_STORAGE_SETUP
```

This command can contact the configured hosted project. Confirm the intended project first; it only creates a missing private bucket and verifies privacy, never edits existing policies/files/accounts. Do not set the confirmation variable on Vercel.

If you prefer the dashboard, manually create `registration-ids` as Private with 3 MiB limit and JPEG/PNG/WEBP MIME types. Existing public bucket/files need a privacy/policy review by their administrator; do not delete the bucket or existing IDs. `supabase/inspect-registration-id-storage.sql` supplies read-only bucket/policy inspection queries; their output may need a knowledgeable administrator to interpret.

If the deployed error persists after configuring the matching key/URL, check Supabase Storage health and Vercel logs. Never send full logs containing secrets, passwords, ID paths or documents to chat.

## Cloudflare keys: paste here in your private .env

`CLOUDFLARE_ENV_BLOCK.txt` contains exactly this block:

```dotenv
NEXT_PUBLIC_TURNSTILE_SITE_KEY=PASTE_YOUR_CLOUDFLARE_TURNSTILE_SITE_KEY_HERE
TURNSTILE_SECRET_KEY=PASTE_YOUR_CLOUDFLARE_TURNSTILE_SECRET_KEY_HERE
TURNSTILE_ALLOWED_HOSTNAMES=fixtrack-theta.vercel.app
```

Use your widget's matching **Turnstile site key and secret**, not a general Cloudflare API token. Replace the hostname if your actual site uses another one; no `https://`, slash or port. Allow the same hostname in Cloudflare widget settings. Do not paste either key into source code, and never publish the secret.

- Local Next.js reads `.env` / `.env.local`; Prisma CLI reads `.env` or exported variables. Restart the local dev server after edits.
- **Vercel does not receive your private local .env when you push.** Add the same variables to Vercel Project Settings → Environment Variables → Production, then redeploy. The public site key is embedded at build time.
- Keep existing DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, Supabase and email variables; this block does not replace them. Never overwrite an existing `.env` with a blank template.
- Do not use Cloudflare development dummy keys on the deployed site. Account approval remains manual even after CAPTCHA.

## Live acceptance checklist
Use synthetic ID photos first: register → CAPTCHA → pending account → admin private ID review → approve → submit request → admin approval automatically forwards → head records multiple workers → completes → original requester rates repair and workers independently → admin analytics shows correct averages/counts and room rankings. Verify rejected/cancelled/ongoing requests cannot be rated, another requester cannot access ratings, and changes do not add votes.

The release is prepared and locally tested, not deployed. Real Vercel variables, Supabase bucket/policies, domain and real Turnstile keys still need live verification by the owner.

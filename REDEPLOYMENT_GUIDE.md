# Redeploy FixTrack to the SAME production URL

This package is prepared/tested locally. It is NOT proof your live environment is ready and it does not guarantee zero errors. Do not deploy until every release gate below is satisfied. Nothing here automatically pushes code, runs production migrations or creates accounts. In the latest update registration can create a missing private ID bucket after successful CAPTCHA; existing bucket privacy/policies/files are not changed.

## 1. Back up and identify the existing production services
- Use the SAME Vercel project (and connected repository/production branch) and SAME hosted Supabase project as the existing live system. Do not create a replacement project or change its domain.
- Record the current good Vercel deployment for rollback. Keep private copies of existing Vercel environment settings, hosted database backup and storage backup separately from Git/ZIP files.
- Test backup restoration into a separate staging database. Local Supabase users/uploads are not the hosted users/uploads; do not copy your synthetic local database over production.
- If Git pushes to the production branch trigger automatic deployment, do NOT push there while preparing. Prepare a release branch/preview and promote only after schema/config/storage verification. Preview builds must use a separate staging Supabase project/data, NOT production credentials.

## 2. Runtime and dependencies
- Node.js **24.x** (`.nvmrc` and `package.json` engines). Select 24.x in Vercel Project Settings if it is not inherited.
- Framework: Next.js; root directory: folder containing package.json; install `npm ci`; build `npm run build`; output directory: Next.js default; start locally with `npm run dev` or production-mode `npm run build` then `npm start`.
- This update upgrades Next.js/eslint-config-next to 16.4.3, NextAuth to 4.24.15, Sharp to 0.35.5 and Nodemailer to 10.2.1. The lockfile also updates compatible transitive packages (including Prisma within major 7).
- NextAuth's optional email-provider peer requests Nodemailer 7, which has unresolved advisories. An explicit package.json override uses the patched root Nodemailer 10. FixTrack uses CredentialsProvider, not NextAuth EmailProvider. Local OTP-style mail composition is tested; actual Gmail delivery still needs a staging SMTP test.
- Never run `npm audit fix --force` as a deployment step. Use this tested package-lock.json and `npm ci`.

## 3. Configure EXISTING Vercel environment variables
Use Production scope for production, separate staging values for Preview. Keep local `.env` private and unchanged; local PowerShell `$env:` overrides are not uploaded to Vercel.

| Variable | Production requirement |
| --- | --- |
| DATABASE_URL | Hosted Supabase PostgreSQL runtime pooler URL; trusted table-owner/BYPASSRLS server role. Never anon/authenticated or browser-visible. |
| DIRECT_URL | Hosted direct or session-mode migration connection from Supabase Connect; not transaction-mode pooler. Check IPv4/IPv6 connectivity of the machine doing migrations. |
| NEXTAUTH_URL | Exact existing https:// production origin, not localhost or a preview URL. |
| NEXTAUTH_SECRET | Existing strong random production secret; keep it stable. |
| NEXT_PUBLIC_BASE_URL | Same production origin as NEXTAUTH_URL. |
| NEXT_PUBLIC_SUPABASE_URL | API URL of the SAME hosted Supabase project. |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public anon key for that project. |
| SUPABASE_SERVICE_ROLE_KEY | Corresponding SERVER-ONLY service-role key; never NEXT_PUBLIC_. |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Real Cloudflare widget site key, not documented dummy test key. |
| TURNSTILE_SECRET_KEY | Matching real server-only widget secret. |
| TURNSTILE_ALLOWED_HOSTNAMES | Comma-separated exact hostnames, e.g. your-existing-domain.vercel.app; no https://, path or port. Include any other real production domains users actually visit. |
| TECHNICIAN_HEAD_EMAIL | Existing designated account, e.g. tech@gmail.com; must already be ACTIVE with TECHNICIAN role. |
| SMTP_USER / SMTP_PASS | Existing Gmail SMTP sender and app password for password-reset email; test delivery. |

Allow the same hostname(s) in the Cloudflare Turnstile widget's hostname settings. Browser-public NEXT_PUBLIC_* variables are built into the bundle; rebuild/redeploy after changes. Production intentionally refuses public dummy CAPTCHA keys.

Unset test/setup/seed/recovery variables: FIXTRACK_ALLOW_*, FIXTRACK_ACK_*, SEED_*, LEGACY_*; never set FIXTRACK_ALLOW_LOCAL_TESTS in production. Do not seed production or arbitrarily promote an account.

From a trusted private shell with the intended production values already exported, run:

```powershell
npm run release:check
```

This is offline: it prints variable names/errors, not credentials, and neither connects nor migrates. PASS verifies format/consistency only, not whether keys work or storage/schema/accounts are ready. Never paste `.env`, connection strings, keys or passwords into chat, screenshots or Git.

## 4. Existing production database: STOP before blindly applying migrations
This project now contains **8 migrations**. Migration eight, `20261025000000_request_worker_ratings`, adds separate request/worker scores with 1–5 checks and server-only access; see REPORTS_RATINGS_STORAGE_UPDATE.md. The first six came from previous updates; the seventh, `20261024000000_server_only_tables`, enables RLS and removes anon/authenticated direct-table grants. It deletes no data and preserves existing server-side roles/account states. Prisma must connect as the trusted table owner/BYPASSRLS role. Check any custom integrations before revoking their browser-role table access; this FixTrack UI uses authorized server APIs, not public table access.

Your earlier `P3018: UserRole already exists` means the baseline was attempted against a populated database. Installing packages or generating Prisma Client does NOT apply schema changes. Do not repeat migrate deploy until the actual history/schema has been reconciled.

Safe order:
1. Restore a production backup into a separate staging instance first. Keep the live site on its current release during preparation.
2. With DIRECT_URL pointing at that staging clone, inspect `npx prisma migrate status` and the actual `_prisma_migrations` records. Compare existing tables/types/constraints against `prisma/migrations/20261022000000_baseline/migration.sql` and all subsequent migration SQL. Check any failed migration for partial effects.
3. Only when the full baseline already exists and is verified, it may be recorded as applied with `prisma migrate resolve --applied 20261022000000_baseline`. This records history; it does not create missing objects. Do not mark later migrations applied unless ALL of their effects already exist. A failed partially applied migration needs individual reconciliation before resolving. Do not edit committed migration SQL/checksums.
4. After staging history is correct, apply ONLY the outstanding migrations using `npx prisma migrate deploy`. Never use migrate reset, db push --accept-data-loss or migrate dev on production. This package does NOT put migrate deploy in build/postinstall.
5. Confirm `npx prisma migrate status`, compare data counts/history, and test login, registration, old/new requests and approval/forwarding. Verify User registrationIdPath, requestDate and other new fields exist before running the new app.
6. Repeat the reviewed, backup-backed migration procedure on production in a planned maintenance window, then release the new code. Do not guess the production baseline state from your empty local database.

The new security migration is transaction-wrapped; old migrations are not rewritten. An app-code rollback does NOT roll back database changes. Do not drop new columns/tables or disable security to make an older deployment start. Test compatibility/forward-fix on staging before attempting rollback.

## 5. Hosted storage and privacy
Use Supabase Storage, not Vercel local disk. Private ID photos and maintenance evidence are separate:
- `registration-ids`: PRIVATE; max 3 MiB; image/jpeg, image/png, image/webp. No anonymous/authenticated read/list/upload policies, including broad existing storage.objects policies that accidentally match this bucket. Only server service_role uploads/cleans up; authorized ACTIVE admin receives short-lived signed viewing URLs.
- `request-photos`: existing PUBLIC-READ evidence architecture; max 5 MiB/image and the same MIME list; server-only uploads/deletes. This means anyone with an evidence URL can read it. Do not put IDs/secrets here. If school policy requires private maintenance evidence, STOP and implement signed/authenticated evidence viewing before releasing; do not simply flip the bucket private because existing public links would break.
- `avatars`: preserve its existing configuration/objects; verify the existing technician profile upload feature if used.

Create/review these buckets in the correct hosted project's dashboard as a separate authorized setup step. Existing files must not be deleted. Local-only setup scripts deliberately REFUSE remote hosts and must not be repurposed against production. `supabase/registration-id-storage.sql` documents private settings but was not run on your hosted database.

Evidence input still accepts up to 3 JPG/PNG/WebP files of 5 MiB each. The browser resizes/compresses each to at most 1 MiB of base64 text; total request JSON is capped at 4 MiB. The API independently bounds declared and streamed request sizes. Oversized direct calls get 413 rather than uploading partial photos. Stored images may be lower resolution/compressed. Registration ID uploads remain separately limited to 3 MiB with a 4 MiB multipart cap and server decode/re-encode.

## 6. Staging and local release checks
Use a separate staging database/project, real staging CAPTCHA widget keys and staging domain allowlists for hosted Preview. Never run synthetic workflow suites against hosted or existing user data; guards require a NEW localhost fixtrack_test* database.

```powershell
npm ci
npm run db:validate
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

Run browser/migration tests only with the documented guarded local test environment (README). See `REDEPLOYMENT_TEST_REPORT.md` for actual results and remaining lint findings. Typecheck may require a completed build to generate Next route types in a fresh checkout. Do not bypass release gates by disabling type checks.

## 7. Release to the existing URL, only after all gates pass
1. Confirm staging smoke tests and reviewed migration/storage/config checks pass. Preserve the known-good production deployment and backups.
2. Merge the prepared source into the SAME repository/root used by the EXISTING Vercel project. Keep `.env` and uploaded files out of Git. Review the diff before committing. This assistant has not pushed anything.
3. In the existing project, confirm production branch/domain and environment scopes. Deploy/promote the tested release through your existing Git/Vercel process. Do not create a new project or point the domain elsewhere.
4. Watch build/runtime logs without logging secrets. A successful build alone is not proof the live workflow works.
5. Verify at the SAME production URL: existing admin/head login; requester login; real CAPTCHA + ID registration pending; private admin ID review; approve/reject account; submit request with/without photos; approve once; head Dashboard/My Tasks receipt; worker selection/status/completion; unauthorized access blocked; password-reset email if used.
6. Check old request records/photos/history remain accessible. Old approved/unassigned requests are not silently backfilled; forward individually from their details if needed.

## Troubleshooting / release blockers
- P2022 or missing requestDate: schema is behind; inspect migration history, do not reset.
- P3018/UserRole already exists: unresolved existing-database baseline; stop and reconcile before deploy.
- Account access could not be verified: runtime database connectivity/schema/role problem; never bypass authorization.
- Private ID storage unavailable: wrong hosted project/key, missing bucket, bucket public, or provider failure.
- CAPTCHA not configured: dummy/missing keys, wrong production/preview scope, host allowlist mismatch, or stale build.
- Approved but no head task: check configured existing ACTIVE TECHNICIAN, saved assignedToId, same database in app/runtime, transaction error; refresh within 15 seconds. No manual relay is required for new approvals.
- Release is NOT authorized merely because this ZIP exists: unresolved hosted migration history, unverified backups, storage privacy, real CAPTCHA, SMTP, permissions or failing checks remain release gates.

Official references:
- https://vercel.com/docs/functions/limitations
- https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining
- https://nextjs.org/blog/nextjs-security-update-october-14-2026

### Existing avatar feature limitation
The legacy technician avatar route is not redesigned in this release; a near-5 MiB original is base64-expanded and may exceed Vercel's request limit. Use an image below 2 MiB and verify the existing avatar bucket in staging. If larger avatar uploads are required, resolve this separately before release. Do not confuse this unchanged profile behavior with the newly bounded request-evidence uploads.

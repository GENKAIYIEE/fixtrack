## Latest update — room reports, independent five-star ratings and private ID storage

Start with **REPORTS_RATINGS_STORAGE_UPDATE.md** and **REPORTS_RATINGS_STORAGE_TEST_REPORT.md**. This is the original Next.js/Supabase edition with the earlier merge fixes applied, not the PHP/InfinityFree edition.

Adds migration **20261025000000_request_worker_ratings** (now **8 migrations** total). Apply it to the intended hosted database before deploying the updated code. Existing `.env` files, users, records and worker history must be kept. Clear Cloudflare placeholders are in `.env.example` and `CLOUDFLARE_ENV_BLOCK.txt`; real keys belong only in your private environment and Vercel settings. Previous test reports below are historical. No live deployment was performed.

## Redeployment preparation — read this first

See **REDEPLOYMENT_GUIDE.md** for updating the SAME existing Vercel URL, separate hosted environment variables, real Turnstile keys, private ID/evidence storage, backups, staging, existing-database baseline reconciliation and smoke tests. **REDEPLOYMENT_TEST_REPORT.md** records actual local results and release gates. Node 24.x is selected. Security updates change package-lock.json: run `npm ci`.

This follow-up adds migration **20261024000000_server_only_tables** (RLS/browser-role grant hardening; no rows deleted). Do not blindly apply the baseline to an existing populated database. No production migration, push or deployment was performed. Earlier “no new migration” statements below refer to those earlier follow-ups, not this redeployment-preparation release.

## Latest update: automatic forwarding and simplified Task Assignment

Task Assignment is now a read-only overview of approved requests, receiving head, progress, evidence and workers. The Unassigned Approved Requests box and separate relay controls have been removed from that page. New approvals forward automatically in one transaction. See `TASK_ASSIGNMENT_SIMPLIFICATION_UPDATE.md` and its test report. No new migration, dependency or environment variable is required.

## Latest workflow: approval automatically forwards to the technician head

See `AUTOMATIC_APPROVAL_FORWARDING_UPDATE.md` for one-step request approval/forwarding, removal of admin triage controls, preserved requester priority, and legacy request compatibility. No new migration is required.

## Latest update: user table and request submission

See `USER_TABLE_REQUEST_SUBMISSION_UPDATE.md` for centered role/department, the removed table ID Number column, specific submission errors, and localhost request-photo bucket setup. This follow-up adds no schema migration.

## Latest follow-up: simplified relay and local private ID storage

See `LOCAL_ID_STORAGE_AND_RELAY_UPDATE.md` for the removed technician-head card, the retained confirmation flow, and localhost-only private bucket setup. No additional migration is needed beyond the worker-workflow release.

> **Latest local workflow update:** The admin dashboard no longer has a Priority Queue. Task Assignment still relays only to the single technician head, who now manages a no-login worker directory and can record multiple workers per task. See `WORKER_WORKFLOW_UPDATE.md` and `WORKER_WORKFLOW_TEST_REPORT.md` for the new migration, setup, history/availability rules and actual checks. This supplements/supersedes older worker-selection descriptions; no individual worker accounts are introduced.

# FixTrack — local-first workflow and manual account verification

Next.js 16 / React 19 / TypeScript / Prisma 7 / PostgreSQL / NextAuth.js / Tailwind CSS 4.
This project is prepared for **local development first**. No GitHub push, Vercel deployment,
live Supabase access, or production migration was performed for this revision. Public Cloudflare test-key verification was exercised; no production Turnstile credentials were used.

## Approved workflow

1. An authenticated requester submits the **Maintenance / Custodial Work Request Form**.
2. Admin reviews and approves or rejects it.
3. Approval automatically records approval and forwards the request to the configured ACTIVE technician head in one transaction; its saved status becomes `ONGOING`. No separate assignment step is required.
4. The head receives a task notification and handles the request in the existing technician portal.
5. The head contacts the appropriate worker **outside FixTrack** (phone or in person).
6. The head records progress, notes, and completion in FixTrack. No individual worker account is required.

The form retains the supplied reference's fields/order, **without letterhead/logos/certification marks**.
A later approved visual revision replaces the paper-style lines with normal bordered text boxes:

- Date of Request and Requesting Party (same row on wider screens; stacked on phones).
- Work Location.
- Description of work/repair (standard bordered multiline text box; maximum 500 characters with a live `0/500` counter).
- Requested Priority: High / Medium / Low, in that order, with the reference's wording.
- Photo Evidence (optional; restored from the original FixTrack version at the user's request).

Priorities use a mutually exclusive radio group with square checkbox-style visuals. Nothing is
preselected. Date and requesting party are read-only, derived again on the server at submission.
“Today” is the **Asia/Manila** calendar date. The server uses the signed-in account's current
first/last name and saves a snapshot. Browser-supplied dates, names, assignees, and admin priority
cannot override it. If a form is left open across midnight, the **submission date** is authoritative;
reload the page to refresh the displayed date before submission.

The new form does not collect issue type, separate building/room classifications, or location notes.
**Optional Photo Evidence is restored from the original FixTrack form:** up to 3 JPG/PNG/WEBP files,
5 MB per selected file, previews/removal, click-to-upload and drag/drop. Browser images are resized
to a maximum dimension of 1200 px and compressed to JPEG at quality 0.7, as in the original form.
**Previously stored values/photos remain available.** QR links with building/room
parameters prefill Work Location. Requester-selected priority is stored separately from the admin's
assessment; the legacy urgency field mirrors High/Medium/Low as HIGH/NORMAL/LOW for compatibility.
Existing enum values were not renamed.

## Prerequisites

- Node.js **20.19+** (or supported newer LTS), npm, PostgreSQL 16 recommended.
- An isolated local PostgreSQL database (or a local restored backup for upgrade verification).
- Local Supabase/SMTP only if exercising the existing registration, storage, profile, realtime,
  or mail flows. Task 3 adds private registration ID uploads and pending approval; live Supabase services were not tested here.
- Browser tests use Playwright Chromium: `npx playwright install chromium`.

## Install and configure

```sh
npm ci
cp .env.example .env.local
```

Edit `.env.local` privately; never commit it. `npm ci` generates the Prisma client via the existing
postinstall script; it does not migrate or seed the database. If generation needs the Prisma config,
export the local `DIRECT_URL` first.

**Prisma CLI loads `.env` by default, not `.env.local`.** Export your local environment variables
into the shell before running Prisma commands, or use a separate private `.env`. Do not copy
production credentials into the test environment.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Runtime PostgreSQL connection; localhost for local work |
| `DIRECT_URL` | Prisma CLI connection; localhost for local work |
| `NEXTAUTH_URL` | Local app origin, normally `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Long random private signing secret |
| `TECHNICIAN_HEAD_EMAIL` | Approved account: `tech@gmail.com` (default if omitted) |
| `NEXT_PUBLIC_SUPABASE_URL` | Local Supabase endpoint for existing features |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only local service key; never expose in browser code |
| `NEXT_PUBLIC_BASE_URL` | Existing QR/base-link configuration |
| `SMTP_USER`, `SMTP_PASS` | Existing mail integration; use development values |

Generate your own signing secret locally, for example with
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
No private production credentials or database dump are included in this archive.

### Technician-head account

The code reuses the existing `TECHNICIAN` role and technician dashboard. It **does not create,
reset, activate, or change any real account**. In your local restored database, verify that
`tech@gmail.com` exists, has role `TECHNICIAN`, and status `ACTIVE`.
All three assignment API paths validate the configured head on the server. A missing/inactive/
wrong-role account blocks relay with an explanatory error; there is no “first technician” fallback.
Historical assignees/accounts remain unchanged. Only the designated ACTIVE technician head can access
workflow dashboards, task lists/details, task history, badges, and task updates. Other technician accounts
are not deleted or promoted; unrelated profile/settings/inbox functionality is retained. Admin can inspect
historical requests and assignments. Outstanding requests assigned to older accounts are NOT silently
transferred: an administrator must review them and plan any explicit handover separately.

## Database setup — read before running commands

**Never use `prisma migrate reset`, `db push --accept-data-loss`, or recovery scripts for this upgrade.**
The unsafe `push-db` convenience script was removed. Do not seed an existing application database.
No migrations in this package have been applied to production.

### A. Brand-new, empty LOCAL database

Point both database URLs to a newly created localhost database, then:

```sh
npx prisma validate
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Open http://localhost:3000. `migrate deploy` applies the historical schema baseline, additive form migration, nullable registration-ID field migration, and Task 5 verification-decision migration. It does not create accounts. Use a local restored backup to work with your existing
accounts. The workflow test suite below creates synthetic accounts **only in a separate test DB**.

### B. Existing database — verify a restored LOCAL copy first

The supplied project had no migration history. The included baseline is generated from that exact
historical `prisma/schema.prisma`, also retained as `prisma/legacy-schema.prisma` for comparison.
**Do not run the baseline CREATE TABLE SQL on a database that already has those tables.**

1. Back up the existing PostgreSQL database separately and verify you can restore it.
2. Restore into a **separate local database**; point both URLs to that local copy.
3. Inspect `npx prisma migrate status`. If migration history already exists in the actual database,
   stop and reconcile it rather than overwriting or re-baselining it blindly.
4. Compare the local restored schema to the historical schema (read-only):

   ```sh
   npx prisma migrate diff --from-config-datasource --to-schema prisma/legacy-schema.prisma --exit-code
   ```

   Exit 0 means no schema difference. Exit 2 means differences: stop and review them. Do not reset.
   This command checks schema, not data or completeness of a backup.
5. **Only if there is no existing migration history and the historical schema matches**, mark the
   baseline as already applied on the local copy:

   ```sh
   npx prisma migrate resolve --applied 20261022000000_baseline
   npx prisma migrate deploy
   npx prisma generate
   ```

6. Verify original records, status histories, assignments, notes, notifications, audits and accounts
   before and after. Keep the backup. Test the local app before planning any later production work.

The second migration only creates a new RequestedPriority enum, adds four nullable columns, and
relaxes NOT NULL on the three legacy classification columns. It does not drop tables/columns,
rewrite records, fabricate historical form values, or reassign tasks. Legacy form fields show as
“not recorded” when appropriate; original location fields are used as display fallbacks.
The third migration adds only nullable User.registrationIdPath for private ID review; apply it to the verified local copy before running Task 3. Production schema differences and account existence have **not** been verified from this sandbox.

## Commands

```sh
npm run dev          # local Next.js development server
npm run lint         # full-project ESLint; inherited failures are reported in TEST_REPORT.md
npm run typecheck    # TypeScript, no emit
npm run db:validate  # Prisma schema validation, no data changes
npm run build        # Prisma client generation + production build; not a deployment
npm run start        # run the local production build
npm run test:unit    # pure form/date/compatibility checks; no database required
```

The pre-existing `seed`, `seed:technician`, `restore-users.ts`, `prisma/delete-admin.ts`, `scratch/`,
`scratch_test.*`, and `test-submit.ts` are **not upgrade steps or the new test suite**. Do not execute
them against existing data. The original `seed:technician` target was absent from the supplied ZIP.
Embedded passwords in legacy helpers were replaced with environment inputs; they were not run.
Optional `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` bootstrap a new admin only when explicitly supplied.
Archived recovery helpers require their own optional `LEGACY_*` inputs; leave them unset for normal work.
Registration now requires CAPTCHA and a private ID document; see Tasks 3 and 4 below. Legacy recovery helpers are not part of registration.

## Run isolated workflow and migration tests

The tests deliberately add synthetic records and retain them for inspection. Use a **new empty** local
DB for each workflow run, never a real application's DB. For example (adjust your local PostgreSQL user):

```sh
createdb fixtrack_test_run1
export DATABASE_URL=postgresql://YOUR_LOCAL_USER@127.0.0.1:5432/fixtrack_test_run1
export DIRECT_URL="$DATABASE_URL"
export NEXTAUTH_URL=http://localhost:3100
export NEXTAUTH_SECRET=YOUR_NEW_RANDOM_LOCAL_TEST_SECRET
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55433
export NEXT_PUBLIC_SUPABASE_ANON_KEY=local-test-placeholder
export SUPABASE_SERVICE_ROLE_KEY=local-test-placeholder
export TECHNICIAN_HEAD_EMAIL=tech@gmail.com
export FIXTRACK_ALLOW_LOCAL_TESTS=1
export NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
export TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
export TURNSTILE_ALLOWED_HOSTNAMES=localhost,127.0.0.1
npx prisma migrate deploy
npx playwright install chromium
npm run test:unit
npm run test:migration
npm run test:workflow
```

Tests refuse non-local URLs and database names not beginning `fixtrack_test`. The migration test
creates a new sibling local DB and needs local CREATEDB permission; it never resets/drops a DB.
Workflow tests start their own local app on port 3100 and a storage stub on port 55433 (keep both free);
for tests set NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55433 as shown above. The stub is not real Supabase.
Tests create random synthetic
passwords in memory, and refuse to overwrite a pre-existing head fixture. Use another new DB on rerun.
The synthetic `tech@gmail.com` test fixture **does not prove the real account exists**.

Coverage includes exact field order, date/name locks, one priority, QR prefill, mobile overflow,
server validation/tamper resistance, role/ownership checks, approval and all three relay paths,
head missing/inactive/wrong-role cases, bulk rollback, concurrent relay, head notes/status/completion,
notifications and history, and legacy-data preservation. Live registration/email/storage integrations are not exercised; photo evidence is tested against
a local storage stub.

## Delivery and known limitations

See `CHANGES.md` for the changed-file manifest and `TEST_REPORT.md` for actual executed results,
inherited lint failures, dependency audit findings, and earlier test-run failures/fixes.
The archive retains project structure and source/configuration/assets, but excludes dependency folders,
Next.js output, Git history, caches, test output, `.env` files (except `.env.example`), and diagnostic logs.
No production database contents or credentials are included. Reinstall dependencies and configure
private environment variables after unpacking.

## Restored Photo Evidence

Photo Evidence is optional and appears below Requested Priority. Files are checked in the browser
and again on the server (count, actual byte size, accepted MIME/encoding and format signature).
The server saves uploaded public URLs as the existing `photoUrl` JSON array, so requester/admin/head
galleries continue to work without schema changes. A failed photo upload does not silently create a
request without its selected photos; tracked partial objects are removed on upload or database failure.
Cleanup is best-effort if storage itself is unavailable; cleanup failures are logged for reconciliation.

The original `request-photos` bucket must already exist with the original public-read configuration,
and the existing server-side service role must be able to upload/remove objects. Do not expose the
service role key in browser code. No new environment variable or migration is required for this
restoration if the original photo upload configuration was working. Do not test against live storage.

Local automated tests use a localhost-only storage stub and synthetic fixtures; actual Supabase
permissions, bucket existence and network access must be verified separately in your local setup.

## Description counter follow-up

New descriptions are limited to 500 characters in both the browser and shared server-side validation.
The counter shows the current typed length (including whitespace), starting at 0/500.
Existing stored descriptions are not truncated or changed; no database migration is needed.


## Task 2: request handling and technician-head workflow

### What is reused and what is enforced

The existing request form, admin review, all three relay API paths, assignment/history/audit records,
notifications, galleries, technician dashboard and progress controls are reused, not duplicated.
Approval stays separate from relay: PENDING → APPROVED (unassigned) → ONGOING (assigned to head).
The head can hold/resume work (ON_HOLD/ONGOING) and mark it COMPLETED. Terminal tasks cannot be
reopened through the task API. Existing enum values and registration/authentication flows are unchanged.

Every task API checks the current database account, not only the signed-in token: it must match the
configured email, have TECHNICIAN role and be ACTIVE. Changing role, activation or designated email
revokes task access even for an existing session. Admin request-review/list/detail and assignment
endpoints likewise recheck the current ADMIN role and ACTIVE status. Serializable relay transactions,
conditional task updates and ownership checks prevent duplicate or unauthorized changes.

Admin request details show the receiving head name/email, or clearly label a preserved historical
assignee. An approved unassigned request has a direct relay link; the selection/confirmation screens
show the designated head. There is no fallback to another technician and no worker account picker.
The head's urgent-task banner/order follows the admin-assessed priority. On-hold tasks remain active
in task badges. Worker contact and attendance are NOT automatically tracked; notes are manually
recorded by the head based on their coordination or reported progress.

### Configuration and migration

No new configuration or Prisma migration is required specifically for Task 2. The existing optional
TECHNICIAN_HEAD_EMAIL setting defaults to tech@gmail.com when omitted. It identifies an existing
account; this update never creates, activates or promotes it. Existing private .env files need not be
edited just to use that approved default. Do not use production connections in local testing.

The earlier official-form migration IS STILL REQUIRED for a database that lacks requestDate,
requestingParty, workLocation or requestedPriority. Generating Prisma Client does not add columns.
The two included migrations and legacy schema are unchanged. Follow the safe local-restored-copy
baseline/status/diff procedure above; do not blindly apply the CREATE TABLE baseline to an existing DB.
No production schema/history has been inspected or migrated here.

### Source-only archive and private uploads

The delivery ZIP excludes existing public/uploads image files because they may contain user data.
The uploads directory is retained with an empty marker. No uploads were deleted from the working
project or original ZIP. When updating an existing installation, retain its uploads directory; if moving
to another machine, transfer any needed legacy uploads separately and securely. A source ZIP is not
a database or user-upload backup. Generated synthetic test fixtures under tests/fixtures are included.

See TASK2_CHANGES.md for the Task 2 file manifest and TEST_REPORT.md for executed checks and limitations.


## Task 3 — registration CAPTCHA, private ID upload and pending approval

### Inspection findings and implemented behavior

The prior registration page/API had the original seven fields (first/last name, email, ID number,
department, password and confirmation), but NO ID-photo input/storage field and NO CAPTCHA.
It explicitly created ACTIVE accounts. The User schema already supported PENDING; NextAuth already
blocked non-ACTIVE accounts; existing admin user management could approve/activate accounts.
Those working mechanisms are reused. No face recognition, comparison or selfie verification is added.

The registration form preserves its fields, department choices, strength feedback and overall layout.
It now requires one JPG/PNG/WEBP ID photo (maximum 3MB), then Turnstile. The photo is a document for
human review; the system checks size/type and decodes the image (Task 4), NOT whether an ID is genuine or belongs
to the registrant. New accounts are always STUDENT/PENDING regardless of client-supplied role/status.
Success explicitly says administrator review is required; no immediate login is offered.

The browser loads Cloudflare's official explicit-rendering script with action `register`, handles
script/widget errors, timeout, expiry and manual retries, and clears/remounts the CAPTCHA after every
submission attempt. Entered fields and selected ID are retained on failure. The API accepts multipart
FormData (`turnstileToken`, `idPhoto` plus original fields), not the former JSON-only registration body.
It bounds the total body to 4MB, including streamed requests; the ID is capped at 3MB.

Before any database query/account creation/storage upload, the API calls the fixed official endpoint
https://challenges.cloudflare.com/turnstile/v0/siteverify with a 10-second timeout. Missing/invalid/
expired/spent tokens, provider failures or missing configuration fail closed. Live keys bind success
to action `register` and an exact hostname allowlist. Tokens/secrets/passwords/ID paths are not logged.
There is no runtime CAPTCHA-disable flag or alternate verification URL. No CAPTCHA package was added.

### Required environment variables

| Variable | Value / purpose |
| --- | --- |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Public site key for the Cloudflare widget; compiled into client assets |
| TURNSTILE_SECRET_KEY | Matching server-only secret; never use a NEXT_PUBLIC prefix or commit it |
| TURNSTILE_ALLOWED_HOSTNAMES | Comma-separated exact hostnames without scheme/port; required in production |
| NEXT_PUBLIC_SUPABASE_URL | Existing LOCAL Supabase endpoint for manual local registration tests |
| SUPABASE_SERVICE_ROLE_KEY | Existing LOCAL server-only service-role key; no anon-key fallback for registration |

DATABASE_URL/DIRECT_URL, NEXTAUTH_URL and NEXTAUTH_SECRET retain their existing purposes. The original
private .env was not edited. Add configuration privately or export temporary shell values; never share
or commit secrets. Public site-key changes require restarting development / rebuilding production.

### Local-only Turnstile test configuration (no .env edit required)

Cloudflare publishes these dummy keys for testing; they are NOT production credentials. With database
and Supabase variables already pointing to LOCAL services, Windows PowerShell can set:

```powershell
$env:NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA"
$env:TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA"
$env:TURNSTILE_ALLOWED_HOSTNAMES = "localhost,127.0.0.1"
npm run dev
# If needed for the previously encountered Turbopack issue:
# npm run dev -- --webpack
```

Closing the terminal discards these overrides. No production key is guessed or automatically selected.
Official test secrets have deterministic success/failure/spent behavior and do not prove real bot
protection. The app rejects known test secrets in NODE_ENV=production and requires real production
configuration. Test secrets bypass action/hostname metadata binding ONLY in non-production because
the provider dummy responses do not carry real widget metadata consistently; Siteverify is still
called. The local test mode accepts only Cloudflare's documented dummy token.

For real credentials, create a Turnstile Managed widget in Cloudflare, configure allowed hostnames,
and set its matching public/secret key pair plus TURNSTILE_ALLOWED_HOSTNAMES privately. Use a separate
development widget if validating real keys on localhost; do not authorize localhost on a production
widget. The free Turnstile plan supports this integration; no paid/Enterprise-only feature is used.

### Local database and private storage setup

1. Back up/restore existing data into a separate LOCAL database and reconcile baseline/history using
   the earlier README procedure. Do not reset or run baseline CREATE TABLE SQL over existing tables.
2. **Apply the new migration before running the updated app.** The generated User model expects this column; skipping it can cause Prisma column-not-found errors, including in existing User queries. The new migration is `20261022000200_registration_id_document/migration.sql`. It adds only nullable
   `User.registrationIdPath`. Existing users remain unchanged with NULL; no status/role/data rewrite.
   Apply through Prisma only against the verified LOCAL copy, then regenerate the client:

   ```sh
   npx prisma migrate status
   # After the existing-database baseline/history checks above:
   npx prisma migrate deploy
   npx prisma generate
   ```

3. In a LOCAL Supabase instance, review/run `supabase/registration-id-storage.sql` to create a PRIVATE
   `registration-ids` bucket (3MB; JPG/PNG/WEBP). This is separate manual Supabase setup, not a Prisma
   migration; it is never run automatically. If the bucket exists, inspect it instead of recreating it.
4. Review storage.objects policies: no broad existing anonymous/authenticated read/write policy may
   include this bucket. Do NOT make it public or reuse the public request-photos bucket. Service-role
   upload/remove and authorized administrator signed URLs are the intended access paths.
5. Keep all existing storage/database credentials private. Neither live storage setup nor production
   migrations have been performed from this project environment.

The API verifies the bucket is private before accepting an ID. It retains the original Supabase Auth
creation integration, then saves the Prisma account as PENDING. Existing email_confirm behavior is
preserved; email confirmation is NOT administrator approval or permission to enter FixTrack. NextAuth
is the application's authentication authority and checks ACTIVE status before issuing a session.
If Auth/DB creation fails, newly created resources are cleaned up best-effort. Cleanup service failures
are logged generically for administrator reconciliation; existing users are never deleted by cleanup.

### Administrator review

In Admin → Users, filter Pending, edit the new account and click **Review ID photo**. The new endpoint
`GET /api/admin/users/[id]/id-photo` rechecks current ACTIVE ADMIN identity and returns a 60-second
signed link with a no-store response. The UI hides the preview after 60 seconds or when closed; a
copied link is a temporary bearer link, so do not share it. New IDs use random object paths and no
public URLs. The upload uses cacheControl 0. Review the ID manually, then use existing account-status
controls to approve (ACTIVE) or leave pending. Legacy users without an ID are not retroactively blocked
or forced to re-register. Approval routes now recheck live ACTIVE ADMIN status, not token claims alone.

### Tests

```sh
npm run test:unit                 # pure validation/verification tests; no service calls
npm run test:workflow             # isolated localhost DB + local service stubs; also public Turnstile test calls
npm run test:migration            # new localhost sibling DB; verifies all original rows/columns remain
npm run typecheck
npm run lint
npm run build
```

For workflow tests, use the same new-local-DB setup above plus the three documented Turnstile local
values, a localhost Supabase URL of http://127.0.0.1:55433 and placeholder local service keys. The tests
start that service stub themselves; it is NOT real Supabase. Suites use synthetic images, random fixture
passwords and new DBs, never real ID photos. Registration tests exercise the real official test widget
and Siteverify; deterministic widget mocks additionally cover expiry/errors/timeout/retry callbacks.
Run external provider-only tests explicitly (public keys; no DB/users) with:

```powershell
$env:FIXTRACK_ALLOW_PROVIDER_TESTS = "1"
npm run test:turnstile-provider
```

Live Cloudflare widget keys, genuine ID documents, real Supabase Auth/storage permissions and production
deployment were NOT exercised. Configure/verify those separately before any eventual release. Inspect
TEST_REPORT.md for exact results, inherited lint/audit failures and limitations, and TASK3_CHANGES.md
for the complete changed-file manifest.

Official implementation references:
- https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.cloudflare.com/turnstile/troubleshooting/testing/
- https://developers.cloudflare.com/turnstile/plans/


## Task 4 — secure ID review and current approval enforcement

Task 3 already supplied the registration ID field, CAPTCHA, private bucket, nullable file reference,
PENDING status and admin review UI. Task 4 reuses them; it does **not** introduce a second ID field,
route, approval flow, storage service, or biometric processing.

### ID validation and privacy

- One JPEG, PNG or WebP image, up to **3 MiB**, is required; the whole multipart body is bounded at 4 MiB.
- Server checks MIME/signature **and actually decodes** the file with the existing Sharp dependency.
  Invalid, truncated, animated, mismatched-format and over-20-megapixel images are rejected.
- Images are orientation-corrected and re-encoded as high-quality JPEG without EXIF/GPS/other metadata
  or appended payloads. Resolution is retained; transparent pixels become white. If the resulting
  JPEG exceeds 3 MiB, choose a smaller clear image. No authenticity/face decision is performed.
- User filenames are ignored. A random UUID path in the PRIVATE `registration-ids` Supabase bucket
  is saved in the existing nullable `User.registrationIdPath`; no binary data goes into PostgreSQL.
- Only a currently ACTIVE ADMIN may request a 60-second signed review link. A copied signed link is
  a temporary bearer credential; never share it. Review bucket policies as described above: any broad
  pre-existing storage policy must not grant anonymous or ordinary-user access to this bucket.
- Failed registration independently attempts removal of its newly created Auth user and ID object.
  Cleanup is best-effort when an external service is unavailable; generic reconciliation logs do not
  expose document paths, tokens or passwords. Keep operational review for persistent service failures.

Sharp 0.34.5 was already present through Next.js; it is now explicitly declared as a direct dependency
for security-critical image decoding. No existing package version was upgraded for this task.

### Approval and roles

New public registrations remain **STUDENT / PENDING**, regardless of submitted status/role values.
An authorized admin manually reviews the ID in Admin → Users → Edit User → Review ID photo and uses
existing status controls to approve (ACTIVE), leave PENDING, or decline/disable (INACTIVE).
The existing account enum has ACTIVE/PENDING/INACTIVE, not REJECTED: INACTIVE represents declined or
otherwise disabled accounts and the message deliberately does not pretend to distinguish them.
Request-level REJECTED is unrelated. Existing account roles, IDs and records are not rewritten.

Both the Next.js proxy and route/layout guards read the **current database** approval and role.
Pending/inactive accounts cannot use protected pages/APIs with an old ACTIVE JWT; role changes also
revoke stale privileges. No account-status caching is used. A database verification outage fails closed.
Blocked sessions go to `/account-status` with a clear explanation and a working sign-out control.
Blocked fresh logins receive a specific explanation only after their password is verified; no session
is issued. Public sign-in, sign-out, CAPTCHA registration, password recovery and public branding remain
available. The legacy `/api/auth/login` metadata endpoint returns only the currently active caller's
role, never a client-selected user's role. The general user directory and debug diagnostics require ADMIN.

### Configuration, migrations and local use

**No new Task 4 environment variables or database migrations.** Do not change a working private `.env`
just for Task 4. Existing Task 3 Turnstile keys, private local Supabase storage/service-role setup,
NextAuth configuration and local PostgreSQL connection are still required. Never expose service-role
or Turnstile secret keys. `.env.example` contains placeholders only and is retained unchanged.
The earlier nullable-ID migration is still necessary if not already applied. Check status/history on
an isolated restored local database and follow the earlier safe baseline instructions before
`npx prisma migrate deploy`; never apply the baseline blindly or reset the database.

```sh
npm ci
npx prisma generate
npm run dev
```

Export local Prisma connection variables first where needed. Open http://localhost:3000. Use the
existing Task 3 local Turnstile test-key instructions without editing `.env`, if preferred. A real local
Supabase instance/private bucket is needed for manual registration: the automated localhost storage
stub is **only** a test harness, not a replacement backend. IDs are not stored on Vercel's ephemeral
filesystem. No paid service was introduced; existing Supabase plan/storage quotas still apply.

Run `npm run test:unit`, `npm run test:workflow`, `npm run test:migration`, `npm run typecheck`,
`npm run db:validate`, `npm run lint` and `npm run build` as documented above, with a fresh isolated
local database for each full workflow run. See `TEST_REPORT.md` for actually executed results and
`TASK4_CHANGES.md` for the file manifest. Live Supabase policies, production CAPTCHA keys and a real
user-data restore require separate verification before eventual deployment; this ZIP is not a
production-readiness certification or a database/upload backup.


## Task 5 — manual administrator ID verification and decisions

### Where to review

Open **Admin Dashboard → Account verification**, or **User Management → Account verification**
(`/admin/users#account-verification`). The existing User Management page is reused, not duplicated.
The section starts with pending accounts, paginates 10 at a time, and filters Pending, Approved / active,
Rejected or Inactive. Each card shows name, email, existing role, PCLU ID number, department and Manila
registration date. The system has STUDENT/TECHNICIAN/ADMIN roles; no faculty role is invented.

Choose **Review registration → Review ID photo** to retrieve the existing private, 60-second signed
preview. Inspect the actual registration details/document yourself. Choose Approve or Reject and then
explicitly confirm. Rejection can include a **user-visible, optional plain-text reason up to 300 characters**;
do not enter internal notes, unnecessary ID data or private third-party information. Loading, no-record,
retry/error and decision-success states are included. The section and review panel work on mobile.

No biometric/face comparison or automatic judgment is performed. Viewing the image is an administrator's
manual responsibility; the system does not claim to prove that a person actually inspected it.

### Status, security and history

- Pending public registration remains STUDENT/PENDING. CAPTCHA and private ID validation are unchanged.
- Approve sets existing accountStatus to ACTIVE; reject sets it to the new REJECTED enum value.
  Role, credentials, ID object/reference, prior requests and historical records remain unchanged.
- The optional reason is stored only in User.verificationRejectionReason. There are no duplicate
  user/status tables. The existing AuditLog records the administrator ID, time, affected account and
  APPROVED/REJECTED decision without copying the reason or ID details into logs.
- Decision/status, audit and an in-app STATUS_UPDATED notification commit in one serializable
  PostgreSQL transaction. Repeated or conflicting decisions return 409 rather than changing state
  or creating duplicate decision records. No automatic email delivery is claimed.
- Only a currently ACTIVE ADMIN may list/review/decide. The decision transaction rechecks that role
  and status, rejects self-review, validates the account ID/action/reason and requires PENDING.
  It does not accept role/privilege inputs. Ordinary users and stale/revoked admin sessions are denied.
- Legacy PATCH status actions for pending users/technicians delegate to this same transaction;
  old full-edit forms cannot bypass it or reset rejected decisions. The diagnostic bulk-activation
  PATCH is retired and returns a clear 409 directing administrators to individual verification.
- ACTIVE/INACTIVE administration of previously active accounts is retained as an existing management
  feature. There is no new appeal, rejection reset, automatic reactivation or worker account feature.
- Existing INACTIVE accounts are NOT retroactively labeled rejected, because historical intent cannot
  be inferred. Legacy accounts without an uploaded ID are preserved; the verification interface leaves
  pending accounts without ID unresolved rather than fabricating documentation or silently approving.

A rejected user gets a clear rejection message plus the recorded user-facing reason **after a correct
password**. No login session is issued. Pending/inactive accounts keep their distinct existing messages.
An already signed-in user whose status changes is blocked by current database checks on protected APIs
and pages, and sees `/account-status` with a sign-out option. Approved users access only their existing
role; approving a technician does not designate them as the single technician head.

### Required LOCAL migration before starting the updated app

There are **no new environment variables or storage services**. Existing `.env` files were not edited;
the included `.env.example` remains placeholder-only. Keep your working NextAuth, local PostgreSQL,
Supabase private bucket/service-role and Turnstile settings. Do not replace them with test stubs for
manual development.

New migration: `prisma/migrations/20261022000300_account_verification_decisions/migration.sql`.
It only adds AccountStatus.REJECTED and nullable User.verificationRejectionReason. It does not rewrite
existing statuses, promote roles, remove users, delete ID photos or alter maintenance records.
**Run it before this version queries User records**, otherwise missing-column errors can occur.

On a backed-up, restored **LOCAL** copy with verified migration history (see the earlier baseline
instructions; do not blindly run CREATE TABLE baseline SQL over existing tables):

```sh
npm ci
npx prisma migrate status
# Only after verifying both connection URLs and reconciling existing migration history:
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Prisma CLI does not automatically read `.env.local`; export the local connection variables or use your
existing private `.env`. Never run migrate reset, destructive db push or these tests on production.
For a new empty local database, apply all four included migrations. No production migration has been
applied here. Do not delete an installation's private env or user-upload backup when replacing source.

### Private ID storage remains unchanged

Keep `registration-ids` PRIVATE and review existing Supabase RLS/storage policies so ordinary users
cannot read this bucket. The existing admin ID endpoint rechecks current ACTIVE ADMIN authorization
before issuing a short-lived signed link; no raw object path/permanent URL is returned in the account
list. A copied signed link remains a bearer link for up to 60 seconds, even if the issuing session is
subsequently revoked. Do not share it. Decisions do not delete IDs; no new retention policy was invented.
Live bucket/RLS configuration still requires verification in your own safe local Supabase setup.

### Tests / delivery

Run the existing isolated test setup with a NEW localhost test database, then `npm run test:unit`,
`npm run test:workflow`, `npm run test:migration`, `npm run typecheck`, `npm run db:validate`,
`npm run lint` and `npm run build`. The migration preservation test now includes the fourth migration
and verifies original ACTIVE/PENDING/INACTIVE users and all eight historical models remain unchanged.
New verification UI/API tests join the existing CAPTCHA, account-access and maintenance suites.
See the latest Task 5 section in TEST_REPORT.md and TASK5_CHANGES.md for actual outcomes and the manifest.
The ZIP contains source/configuration/migrations only, not a live database, real uploaded IDs, private
.env, dependencies, build output or deployment. Retain/transfer existing user uploads securely separately.


Task 5 packaging additionally omits the archived `restore-users.ts` (embedded recovery account profiles)
and destructive `prisma/delete-admin.ts`. They are not setup/upgrade steps and are not required for
application development. Original working copies were not deleted or executed. Do not use old helper
instructions to restore/promote accounts; retain backups and use the documented verified-local workflow.


## Task 5 follow-up — visible ID upload control and CAPTCHA setup

The registration form now has a clearly visible **Upload valid ID photo** button with filename/size,
Change and Remove controls, immediate browser type/size errors and mobile-friendly layout. Server-side
validation/private storage/CAPTCHA/pending approval are unchanged. No new migration or configuration
variable. See **ID_UPLOAD_CAPTCHA_SETUP.md** for patch installation and exact local PowerShell test-key
commands (no .env edits), and **ID_UPLOAD_CAPTCHA_TEST_REPORT.md** for executed checks. Preserve your
local Supabase config, credentials and database when merging the patch. A missing CAPTCHA public key
must be configured and Next.js restarted; it is not fixed by selecting an ID photo.

## Registration update: no ID number entry

Public registration no longer asks for an ID number. Existing numbers remain preserved; new registrations store NULL rather than an invented institutional ID. The required private ID photo, server-verified CAPTCHA, and administrator approval workflow are unchanged. Apply `20261022000400_optional_registration_id_number` to the LOCAL development database, then regenerate Prisma Client. See `REGISTRATION_NO_ID_NUMBER.md` for safe setup and patch instructions and `REGISTRATION_NO_ID_NUMBER_TEST_REPORT.md` for actual check results. Do not apply this migration to production during local testing.

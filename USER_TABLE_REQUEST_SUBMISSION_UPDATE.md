# User table and request-submission follow-up

## User Management
- Removed the ID Number column from the User Management table, including its loading/empty rows.
- Centered the Role & Dept header and centered the department directly beneath the role badge.
- Preserved existing stored ID numbers, accounts, registration ID photos and approval history. No database column was dropped. Other legacy profile/verification metadata is unchanged.

## Request submission
The old generic error did not distinguish photo-storage failures from database schema/connection errors. It did not prove that photos caused a failure.

The updated API returns safe specific messages and a stable `code`:
- `REQUEST_PHOTO_STORAGE_NOT_CONFIGURED`: server Supabase URL/service-role key missing.
- `REQUEST_PHOTO_BUCKET_UNAVAILABLE`: request-photos bucket missing, inaccessible, or incompatible with the existing public-read viewer.
- `REQUEST_PHOTO_STORAGE_UNAVAILABLE`: local storage could not be reached/initialized.
- `REQUEST_PHOTO_UPLOAD_FAILED`: upload failed. Any newly uploaded photos are rolled back where storage is reachable. No partial request is committed.
- `REQUEST_SCHEMA_OUTDATED`: Prisma P2021/P2022, such as missing requestDate. Check migrations on the correct local database.
- `REQUEST_DATABASE_UNAVAILABLE`: recognized Prisma connection/permission/pool failures.
- `REQUEST_SAVE_FAILED`: another failure, not automatically blamed on photo storage.

Requests without photos do not initialize or call Storage. No photos are silently discarded to force success. Request, timeline, notifications and audit still commit atomically; DB failure removes newly uploaded evidence where the storage service permits cleanup. Cleanup failures emit a safe administrator-reconciliation message; they cannot be guaranteed removable while Storage is down.

## Apply
Stop Next.js, back up the project, merge the patch on top of the preceding relay/private-storage release, and keep your `.env` and local Supabase configuration. No new dependency or migration is introduced. The complete ZIP also retains all six existing migrations and previous features.

## Local request-photo setup (PowerShell)
Registration ID photos and maintenance request photos are DIFFERENT buckets:
- `registration-ids`: PRIVATE. Never make public. Previous localhost helper remains available.
- `request-photos`: uses the project's existing PUBLIC-read URL format. Anonymous upload policies are not required; server service_role handles uploads. Use synthetic/non-sensitive photos for local testing. Do not put ID documents here. Changing evidence to private signed-link delivery would be a separate migration/architecture change, not silently included in this fix.

Keep Docker/local Supabase running. In the SAME PowerShell terminal configured for your LOCAL Supabase instance, stop Next.js with Ctrl+C and run:

```powershell
# Check the local API is running. Never paste service_role keys into chat.
npx supabase status
$env:NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
# SUPABASE_SERVICE_ROLE_KEY must already be THIS LOCAL instance's service_role key.
# It is not the anon key, database password, or a hosted project's key.
$env:FIXTRACK_ALLOW_LOCAL_REQUEST_STORAGE_SETUP = "1"
$env:FIXTRACK_ACK_PUBLIC_REQUEST_PHOTOS = "1"
npx tsx scripts/setup-local-request-storage.ts
Remove-Item Env:FIXTRACK_ALLOW_LOCAL_REQUEST_STORAGE_SETUP
Remove-Item Env:FIXTRACK_ACK_PUBLIC_REQUEST_PHOTOS
npm run dev
```

The helper refuses hosted URLs and production mode, inspects request-photos, and creates it ONLY when the provider reports it missing (404): public-read, 5 MiB per photo, JPEG/PNG/WebP. It rechecks the result. It never changes existing bucket privacy, uploaded files, users, policies, or registration-ids. Existing incompatible/private buckets require manual review; the helper does not make them public. Existing bucket size/type configuration is not automatically changed. No `.env` file is written.

If the key is not configured, use the hidden prompt instructions from `LOCAL_ID_STORAGE_AND_RELAY_UPDATE.md` for your local service_role key. Restart Next.js in the same terminal. Never put the service_role key into a NEXT_PUBLIC variable.

## If the error is a missing database column instead
First confirm `npx prisma migrate status` shows 127.0.0.1:54322 and the intended local database, not hosted Supabase. Only then apply the supplied pending migrations locally:

```powershell
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Do not reset a database, delete tables or mark failed migrations applied without verifying their state. An existing hosted database with a failed baseline needs separate migration recovery, not these local setup instructions. Migrations do not create Supabase Storage buckets.

## Tests
`npm run test:unit` includes the new storage-helper and error-classification tests (40 total). See `USER_TABLE_REQUEST_SUBMISSION_TEST_REPORT.md` for actual results and limitations. Tests use isolated local synthetic services; your own Windows Docker instance still requires setup. The screenshot alone cannot identify the exact original submission failure on your computer. If it persists, use the new error code and server log (redact credentials); do not assume a ZIP configures your machine's services.

# Local technician-head account setup

This is an optional manual bootstrap for a NEW local development database. It is not public registration, a production deployment script, a password reset tool, or a way to promote existing accounts.

## Install

Extract `fixtrack-local-technician-setup.zip` into your existing FixTrack project so `prisma/seed-technician-head.ts` is inside the existing `prisma` folder. Keep the rest of the project, migrations, .env and Supabase configuration unchanged. The archive also includes a synthetic test and this guide; it is not a complete project.

## Prerequisites

Docker and local Supabase must be running. Use the SAME PowerShell terminal in which you set the local environment variables. Closing that terminal loses temporary overrides and may cause .env cloud values to load again. The script refuses hosted URLs, production NODE_ENV, missing opt-in, different runtime/migration databases, weak/short passwords, and an email that does not match the configured head.

Confirm `npx prisma migrate status` reports a localhost database and all project migrations applied. Ensure DATABASE_URL and DIRECT_URL refer to that same local database, NEXT_PUBLIC_SUPABASE_URL refers to local Supabase (normally http://127.0.0.1:54321), and SUPABASE_SERVICE_ROLE_KEY is from local Supabase, not a hosted project. No credentials should be shared in chat.

## Run in PowerShell from the project folder

```powershell
$env:FIXTRACK_ALLOW_LOCAL_BOOTSTRAP = "1"
$env:TECHNICIAN_HEAD_EMAIL = "tech@gmail.com"
$env:SEED_TECHNICIAN_EMAIL = "tech@gmail.com"

$localPassword = Read-Host "Choose a technician password (at least 12 characters)" -AsSecureString
$env:SEED_TECHNICIAN_PASSWORD = [System.Net.NetworkCredential]::new("", $localPassword).Password

npx tsx prisma/seed-technician-head.ts
```

Type a unique strong test password; input is hidden. After seeing "Local technician head created successfully", clear temporary bootstrap/password variables and start the app in the same terminal:

```powershell
Remove-Item Env:SEED_TECHNICIAN_PASSWORD
Remove-Item Env:FIXTRACK_ALLOW_LOCAL_BOOTSTRAP
Remove-Variable localPassword
npm run dev
```

If Next.js was already running, stop it with Ctrl+C before restarting. Sign in at http://localhost:3000/login with tech@gmail.com and the password entered. Keep TECHNICIAN_HEAD_EMAIL set while testing. No .env edits, package installation, new migration, GitHub push, or Vercel deployment are required.

## Behavior and limitations

- Creates one local Supabase Auth account and one matching Prisma user with role TECHNICIAN, status ACTIVE, specialization GENERAL, and display name Technician Head. A synthetic LOCAL-TECH UUID reference is used instead of claiming a real institutional/employee ID. An administrator can edit the local profile later.
- Does not alter any existing account's password, status, role or request history. Re-running for an existing ACTIVE TECHNICIAN only reports that it exists; it does NOT reset the password. A conflicting STUDENT/PENDING/etc. account is refused and must be reviewed by an authorized administrator.
- A pre-existing Auth-only user is not adopted, deleted or promoted. Review such a conflict manually rather than repeatedly creating accounts.
- If the Prisma insert fails, the script attempts to remove only the newly created Auth account. A cleanup failure is reported for administrator reconciliation; provider errors, passwords, keys and connection strings are not printed.
- This account is the single designated coordinator. It does not create individual worker accounts or automatically track off-system phone/in-person coordination.
- No test script here should target production or an existing real-user database.

## Checks

See the delivery message for actual results. To execute the dedicated synthetic integration test, use a NEW localhost PostgreSQL database whose name begins fixtrack_test, apply all included project migrations, and configure the existing local test service stub environment as described in tests/local-safety.ts and tests/registration-services-stub.ts. Then run `npx tsx --test tests/technician-bootstrap.test.ts`. The test refuses a database already containing tech@gmail.com and does not drop databases or reset existing users. It uses a local Auth stub rather than real Supabase Auth; actual local Supabase service configuration must still be verified on your machine.

### Actual checks for this delivery

The dedicated integration test passed on a fresh, isolated localhost PostgreSQL database with all five existing migrations and a local Auth service stub. It exercised eight refused configurations, successful ACTIVE/TECHNICIAN creation with password hashing, duplicate-run preservation, refusal to promote an existing pending student, Auth failure without a Prisma user, and cleanup after a Prisma insert failure. Final project TypeScript and focused ESLint for the script/test passed. An initial TypeScript error in a test-only process environment annotation was corrected, then both the integration test and type check were rerun successfully. The complete app build/full workflow suite/full lint/audit were not rerun for this CLI-only addition; earlier inherited lint/audit issues remain. Real local Supabase Auth on your Windows computer has not been tested from this environment.

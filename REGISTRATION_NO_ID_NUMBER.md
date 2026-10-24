# Registration without an ID number

## Changes

Public registration no longer displays, submits, or requires an institutional ID number. The API ignores any client-supplied `idNumber` and stores NULL for new public registrations. Email uniqueness, names, department, password validation, private valid-ID photo upload, server-side Turnstile verification, and STUDENT/PENDING account creation remain in place.

Existing ID numbers and their unique index are preserved. Missing numbers display as "Not provided" in the account verification, users table, and profile views. Editing a user without supplying a number preserves the current value rather than generating a fictitious institutional ID. Existing administrator-created accounts and technician employee-ID requirements are otherwise unchanged.

## Apply the patch to an existing Task 5 project

1. Stop Next.js with Ctrl+C. Back up your current project.
2. Extract the patch into a temporary folder, then merge its `src`, `prisma`, and `tests` folders into the existing project. Replace matching source files. Keep all older migration folders.
3. Keep your existing `.env`, `supabase/config.toml`, and local Docker setup. No new environment variables or dependencies are required.
4. In the same PowerShell terminal, restore your LOCAL database and Supabase settings if necessary. Prisma CLI uses `DIRECT_URL`; the running app uses `DATABASE_URL`. Both must refer to the same local development database.
5. Run `npx prisma migrate status` and confirm the datasource is your LOCAL database (normally `127.0.0.1:54322`), NOT a hosted Supabase address.
6. Only after confirming the local target, run:

```powershell
npx prisma migrate deploy
npx prisma generate
npm run dev
```

The new migration is `20261022000400_optional_registration_id_number`. Its only SQL statement drops the NOT NULL constraint on `User.idNumber`; it does not drop a column, clear existing values, delete records, or change account roles/statuses. Keep the unique index for existing non-null values. No reset, database push, baseline resolution, production migration, GitHub push, or deployment is necessary for this local update.

If the database reports a failed baseline or another failed migration, stop: this update is not a repair for an inconsistent migration history. Do not reset an existing database or mark a baseline as applied without first verifying its schema and backing up its data.

## Local testing

Register with the remaining fields, a valid ID image, and CAPTCHA. Registration must succeed as PENDING without an ID number. An active administrator can still privately review the image and approve/reject the user. Existing ID numbers remain visible. Pending/rejected users remain blocked from protected features.

See `REGISTRATION_NO_ID_NUMBER_TEST_REPORT.md` for actual checks and limitations. The complete-project archive includes the existing README and prior setup guides; the small patch is intended only for the existing Task 5 codebase.

# Task 3 — registration CAPTCHA and pending-account review

## Inspection findings

The prior /register page and /api/auth/register route had no CAPTCHA or ID photo upload. They explicitly
created ACTIVE accounts. Existing User.accountStatus already supported PENDING; NextAuth already
rejected non-ACTIVE logins. Admin user management already had status/approval controls. There are no
registration server actions to duplicate. Existing original fields, Supabase Auth integration,
NextAuth approval gate, department choices, password feedback and admin controls were reused.

## Added files

- `prisma/migrations/20261022000200_registration_id_document/migration.sql`
- `src/app/api/admin/users/[id]/id-photo/route.ts`
- `src/components/admin/RegistrationIdReview.tsx`
- `src/components/auth/TurnstileWidget.tsx`
- `src/lib/registration/turnstile.ts`
- `src/lib/registration/validation.ts`
- `supabase/registration-id-storage.sql`
- `tests/registration-services-stub.ts`
- `tests/registration-unit.test.ts`
- `tests/registration.spec.ts`
- `tests/turnstile-provider.test.ts`

## Modified source / test files

- `prisma/schema.prisma`
- `src/app/(auth)/register/page.tsx`
- `src/app/api/admin/users/[id]/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/components/admin/UserSlideOverModal.tsx`
- `tests/migration-preservation.ts`

## Additional configuration/documentation changes

- package.json: expanded unit-test command; added explicit public-provider test command.
- playwright.config.ts: includes registration suite alongside existing maintenance workflow suite.
- .env.example: placeholder Turnstile keys/hostname allowlist and private storage comments.
- README.md: full setup, privacy, migration, manual approval, local testing and real-key instructions.
- CHANGES.md / TEST_REPORT.md / TASK3_CHANGES.md: implementation manifest, actual results and limitations.
- package-lock.json and dependencies are unchanged. No new packages were installed for CAPTCHA.

## Behavior and security

- Official Cloudflare script plus mandatory fixed-endpoint Siteverify; no client-only or runtime-disable
  path. Missing, invalid, expired/spent, failed and unavailable verification fails closed.
- Real keys require registration action and allowed hostname binding; production rejects public dummy
  secrets. Only non-production public test keys use the provider's dummy metadata behavior.
- Multipart registration: original fields + one ID image + turnstileToken. Total body is bounded at
  4MB, including streamed bodies; ID image is JPG/PNG/WEBP, max3MB, validated on client/server.
- New users are STUDENT/PENDING, not activated by CAPTCHA, client-supplied role/status, or the preserved
  Supabase email_confirm setting. Login remains blocked until authorized admin approval.
- IDs are private object paths, not avatars/request evidence or public URLs. Admin-only 60-second
  signed links are obtained on demand; account review/status routes recheck live ACTIVE ADMIN identity.
- Failed creation cleans up only newly owned Auth/storage resources, best-effort if services fail.
- No genuine IDs, production credentials, database resets, production migrations or deployments used.
- No face recognition, face comparison, selfie flow, worker-account changes or maintenance-workflow
  behavior changes. Existing users/records/statuses are not rewritten.

## Database and storage

The only new Prisma migration is 20261022000200_registration_id_document: nullable
User.registrationIdPath. Existing rows remain NULL and keep their existing statuses. Apply to a verified
LOCAL database copy before running this version; Prisma Client generation alone is not a migration.
Prior baseline/form migrations remain unchanged and included. Do not blindly baseline an existing DB.

The separate supabase/registration-id-storage.sql is MANUAL LOCAL Supabase setup only, not a Prisma
migration or automatic runtime operation. It creates a private registration-ids bucket if absent;
existing privacy/RLS policies must be inspected. No client anonymous/authenticated bucket policies
should grant access. Real Supabase permissions and production Cloudflare keys remain unverified.

## Credentials and packaging

Required new values: NEXT_PUBLIC_TURNSTILE_SITE_KEY (public), TURNSTILE_SECRET_KEY (server-only),
TURNSTILE_ALLOWED_HOSTNAMES (exact comma-separated domains; required in production). Existing server
Supabase service-role configuration is reused with no anonymous fallback. Private .env need not be
edited if shell overrides are used; credentials must never enter source control. README shows only
publicly documented dummy keys for local tests and placeholders for real credentials.

The complete source ZIP excludes .env/private keys, dependencies, generated outputs, Git history,
logs/test screenshots, real uploads and database dumps. Original user-upload files remain untouched
in the working project/original archive. Preserve legacy uploads separately when updating installations.

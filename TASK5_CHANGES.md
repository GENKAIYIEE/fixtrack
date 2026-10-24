# Task 5 — manual account verification

## Main changes

- Existing User Management now includes AccountVerification, linked from the admin dashboard:
  pending/approved-active/rejected/inactive filters, registration details, private review, explicit
  confirm actions, optional 300-character user-visible reason, pagination and error/empty states.
- `src/lib/verification/decisions.ts` and validation: current ACTIVE ADMIN + self/ID/action/status
  checks, one serializable status/audit/notification transaction, no role or ID-storage changes.
- New POST `/api/admin/users/[id]/verification`; existing private ID retrieval is reused.
- New additive AccountStatus.REJECTED / nullable User.verificationRejectionReason migration.
- Existing auth policy/login/account-status surfaces distinguish rejection and show its reason to
  the correctly authenticated owner. Stale tokens remain subject to live database checks.
- Generic and technician edits cannot bypass/reset decisions; diagnostic bulk activation retired.
- Tests and setup/report documentation extended. No dependency or environment-variable change.

## Complete changed/added source list

- `src/app/(auth)/login/LoginClient.tsx`
- `src/app/account-status/page.tsx`
- `src/app/admin/dashboard/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/api/admin/diagnostics/auth/route.ts`
- `src/app/api/admin/technicians/[id]/route.ts`
- `src/app/api/admin/users/[id]/id-photo/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `src/app/api/admin/users/[id]/verification/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/components/admin/AccountVerification.tsx`
- `src/components/admin/UserForm.tsx`
- `src/components/admin/UsersFilterBar.tsx`
- `src/components/admin/UsersTable.tsx`
- `src/lib/auth/account-policy.ts`
- `src/lib/auth.ts`
- `src/lib/verification/decisions.ts`
- `src/lib/verification/validation.ts`
- `src/proxy.ts`
- `tests/account-access.spec.ts`
- `tests/account-policy.test.ts`
- `tests/migration-preservation.ts`
- `tests/verification-unit.test.ts`
- `tests/verification.spec.ts`
- `prisma/migrations/20261022000300_account_verification_decisions/migration.sql`
- `prisma/schema.prisma`
- `package.json`
- `playwright.config.ts`
- `README.md`
- `CHANGES.md`
- `TEST_REPORT.md`
- `TASK5_CHANGES.md` (this manifest)

## Preserved / excluded

Existing users, roles, requests/history, credentials and ID objects are not rewritten/deleted.
.env.example and package-lock are unchanged. The earlier three migrations are unchanged and retained;
the fourth is additive. Existing CAPTCHA, registration upload and technician-head components are reused.
Source ZIP excludes real env/uploads/DB/generated artifacts and the nonessential archival recovery
profile/destructive-delete helpers (restore-users.ts, prisma/delete-admin.ts). Working originals remain.
No GitHub push, production migration or Vercel deployment was performed. See TEST_REPORT.md for actual
checks, inherited lint/dependency risks and remaining live-service verification.


## ID-upload follow-up to the released Task 5 ZIP

Additional changed/added files:
- `src/app/(auth)/register/page.tsx` — visible upload/change/remove, immediate local feedback; native picker.
- `tests/registration.spec.ts` — actual picker/selection/change/remove/type/size/mobile regression.
- `ID_UPLOAD_CAPTCHA_SETUP.md` — no-env-edit local CAPTCHA instructions and patch application.
- `ID_UPLOAD_CAPTCHA_TEST_REPORT.md` — actual follow-up check results and earlier failed attempts.
- `README.md`, `TEST_REPORT.md`, `TASK5_CHANGES.md` — follow-up documentation.

No new backend/schema/migration/config/dependency change. Existing server/private ID and approval
security is retained byte-for-byte. The small patch deliberately omits private settings, Supabase
config, SQL, dependency files and unrelated source, so it can be merged into a configured local project.

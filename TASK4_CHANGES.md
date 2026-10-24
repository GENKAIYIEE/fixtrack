# Task 4 — changed-file manifest

## Scope

Reused the existing ID upload, private Supabase storage, CAPTCHA, PENDING registration and admin
review. Added image decoding/sanitization and live account-status/role enforcement across protected
routes/layouts. No new role/status, worker accounts, biometric logic, schema field, migration or
environment variable. Existing private environment files and all Prisma migrations are unchanged.

## Main changes

- `src/lib/registration/validation.ts`: actual image decoding, pixel/frame bounds, safe JPEG output.
- `src/app/api/auth/register/route.ts`: independent best-effort cleanup of newly owned resources.
- `src/lib/auth/access.ts`, `account-policy.ts`, `src/proxy.ts`: current approval/role guards.
- `src/lib/auth.ts`, login client and `/account-status`: status explanations, blocked sessions/sign-out.
- Protected API handlers/layouts: shared active-session guard while preserving existing role/ownership
  and technician-head controls. Most route edits replace only session imports/reads, not feature logic.
- `/api/users`, admin diagnostics: current ACTIVE ADMIN only; `/api/auth/login`: caller-only metadata.
- Tests/config/dependency manifest and local setup/report documentation as listed below.

## Complete Task 4 changed/added files

- `src/app/(auth)/login/LoginClient.tsx`
- `src/app/(user)/layout.tsx`
- `src/app/(user)/requests/new/page.tsx`
- `src/app/account-status/SignOutButton.tsx`
- `src/app/account-status/page.tsx`
- `src/app/admin/layout.tsx`
- `src/app/api/admin/analytics/route.ts`
- `src/app/api/admin/assignments/route.ts`
- `src/app/api/admin/audit-logs/route.ts`
- `src/app/api/admin/diagnostics/auth/route.ts`
- `src/app/api/admin/requests/[id]/route.ts`
- `src/app/api/admin/requests/route.ts`
- `src/app/api/admin/settings/route.ts`
- `src/app/api/admin/technicians/[id]/route.ts`
- `src/app/api/admin/technicians/route.ts`
- `src/app/api/admin/users/[id]/id-photo/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/notifications/[id]/route.ts`
- `src/app/api/notifications/delete-read/route.ts`
- `src/app/api/notifications/mark-all-read/route.ts`
- `src/app/api/notifications/mark-read/route.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/requests/route.ts`
- `src/app/api/tasks/route.ts`
- `src/app/api/technician/badges/route.ts`
- `src/app/api/technician/dashboard/route.ts`
- `src/app/api/technician/history/route.ts`
- `src/app/api/technician/profile/change-password/route.ts`
- `src/app/api/technician/profile/route.ts`
- `src/app/api/technician/tasks/[id]/route.ts`
- `src/app/api/technician/tasks/route.ts`
- `src/app/api/user/dashboard/route.ts`
- `src/app/api/user/history/route.ts`
- `src/app/api/user/profile/password/route.ts`
- `src/app/api/user/profile/route.ts`
- `src/app/api/user/requests/[id]/route.ts`
- `src/app/api/user/requests/route.ts`
- `src/app/api/users/route.ts`
- `src/app/technician/layout.tsx`
- `src/components/technician/TechnicianWorkflowGate.tsx`
- `src/lib/auth/access.ts`
- `src/lib/auth/account-policy.ts`
- `src/lib/auth.ts`
- `src/lib/registration/validation.ts`
- `src/proxy.ts`
- `tests/account-access.spec.ts`
- `tests/account-policy.test.ts`
- `tests/registration-services-stub.ts`
- `tests/registration-unit.test.ts`
- `tests/registration.spec.ts`
- `package.json`
- `package-lock.json`
- `playwright.config.ts`
- `README.md`
- `CHANGES.md`
- `TEST_REPORT.md`
- `TASK4_CHANGES.md` (this manifest)

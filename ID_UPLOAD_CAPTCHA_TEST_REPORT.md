# Task 5 follow-up — ID upload control / CAPTCHA setup

## Scope

Only registration-page application code changed: visible blue Upload valid ID photo button, native
picker, filename/size, Change/Remove actions, immediate browser type/size feedback, keyboard focus style
and mobile layout. New browser coverage and setup docs were added. Independent server image checks,
private storage, mandatory Siteverify, STUDENT/PENDING defaults and admin decisions remain unchanged.
No migration, dependency, environment-variable, account/status/role or storage-policy change.

## Checks actually run

| Check | Actual result |
| --- | --- |
| Unit tests | 26 passed |
| Complete browser/API workflow rerun | 41 passed, none skipped, 3.6 minutes |
| Official public CAPTCHA provider tests | 3 passed, none skipped |
| Official public CAPTCHA widget | Passed, included in registration suite |
| Fresh isolated local DB, all four existing migrations | Applied successfully |
| Prisma schema validation | Passed |
| Local production build | Passed, not deployed |
| Standalone TypeScript after build | Passed |
| ESLint on changed registration page and registration suite | Passed, no findings |
| Full ESLint | FAIL: 61 inherited errors, 48 warnings; no per-file/rule/severity increases |
| Released Task 5 backend/CAPTCHA/schema/package/environment-template byte comparisons | Unchanged |
| Browser upload picker / selection / change / removal / invalid type / 3MB limit | Passed |
| Mobile width and generated mobile UI screenshot inspection | Passed / inspected |

All tests used isolated localhost PostgreSQL, synthetic users/images and local Auth/storage stubs;
Cloudflare calls used documented public test keys. No live Supabase, genuine ID, user database,
production secret, GitHub push or Vercel deployment was used. Existing dependency vulnerabilities
remain unresolved; no new audit or dependency upgrade was performed. Real production credentials,
RLS/storage and deployed/Windows behavior still need separate verification. Native picker interaction
was actually exercised through browser filechooser events, not only programmatic form assignment.

## Earlier attempts (not hidden)

The first attempt could not start because PostgreSQL tools/services were unavailable in the computer
workspace. Local-only tools were restored and a fresh test DB created. The first executed full suite
had 39 passed, 1 failed and 1 not run: the new test's global alert selector also matched Next.js's empty
accessibility route announcer. Scoped assertions to the registration form; no security bypass or
application workaround was added. A complete rerun on another NEW local DB then passed all 41 tests.
Only generated .next/dev cache was cleared before standalone TypeScript, after the test server stopped.

## Apply / configure

See ID_UPLOAD_CAPTCHA_SETUP.md. For an existing Task 5 local installation, merge the small patch into
its project root (registration page, registration tests and these two guides only); retain .env,
supabase/config.toml, database and uploaded objects. No SQL/migration rerun/reset is needed for this UI
follow-up. The complete-project archive is optional and retains all four existing migrations.

The screenshot's CAPTCHA-not-configured message indicates a missing public site-key configuration
in the running app, not a missing ID button. Restart Next.js in the same locally configured PowerShell
terminal after setting the documented test-key pair. Production must use real matching keys; public
test secrets remain rejected there. Successful CAPTCHA does not approve the registration account.

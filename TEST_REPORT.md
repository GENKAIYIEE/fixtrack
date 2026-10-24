# Local test report — FixTrack revisions (latest Task 5 results below)

> Latest release: Task 5 ID-upload follow-up — 26 unit tests, 41 browser/API workflow tests and 3 provider tests passed.
> Build, TypeScript and migration preservation passed. Full lint remains failing: 61 errors, 48 warnings.
> Earlier sections below are retained as historical results; see the final Task 5 section for this ZIP.

## Outcome

The implemented request-form/technician-head workflow passed its local checks listed below.
**This is not an all-green project or a production-readiness approval:** full-project ESLint fails
on inherited issues, and the dependency audit reports inherited vulnerabilities.

## Environment and boundaries

- Linux sandbox, Node v24.22.1, PostgreSQL 16.15 bound to `127.0.0.1` on a non-default local port.
- Locked Next.js 16.2.4, React 19.2.4, Prisma 7.8.0, NextAuth.js 4, Tailwind CSS 4.
- Playwright 1.58.2 with its downloaded Chromium; local Next.js development server on port 3100.
- Database URLs used in checks pointed only to fresh localhost test databases.
- Original ZIP and its private environment file were not modified. The original `.env` was not copied
  into the project, read into the app, or used for testing.
- Supabase configuration used localhost/placeholder values. No live database/storage/mail integration was exercised.
- Test account passwords were generated randomly in memory, not committed or packaged.
- No production migrations, database resets, account deletion, GitHub push or Vercel deployment occurred.
- Synthetic test records are retained in isolated local databases, not included in this source ZIP.

## Final executed checks

| Check | Actual outcome |
| --- | --- |
| `npm run test:unit` | PASS — 6 tests |
| `npm run test:migration` | PASS — every original row/column preserved across all 8 models in a synthetic historical database |
| `npm run test:workflow` | PASS — 10 browser/API tests; final complete run 25.9 seconds |
| `npm run db:validate` | PASS — Prisma schema is valid |
| `npm run typecheck` | PASS — TypeScript exit 0 |
| `npm run build` | PASS — optimized production build and route generation; no deployment |
| ESLint on newly written modules/tests | PASS — exit 0, no warnings/errors |
| `npm run lint` | FAIL — 70 errors, 49 warnings |
| `npm audit --json` | FAIL — 28 dependency vulnerabilities: 1 low, 5 moderate, 20 high, 2 critical |

The original source baseline was actually linted before implementation: **76 errors, 54 warnings**.
The archived lint/TypeScript logs supplied in the old ZIP were not treated as current test results.
Comparing current vs baseline lint counts **per file, rule and severity** found no increases. This
comparison does not mean the remaining violations are acceptable; they are still failures.
ESLint configuration was not weakened or disabled to make these results pass.

Remaining error-rule counts:

- `@typescript-eslint/no-explicit-any`: 45
- `prefer-const`: 1
- `react-hooks/immutability`: 1
- `react-hooks/purity`: 1
- `react-hooks/set-state-in-effect`: 20
- `react/no-unescaped-entities`: 2

## Workflow coverage that actually ran

1. Form title, exact field/priority order and labels, read-only date/name, one square-style priority,
   validation message clearing, QR location prefill, desktop and 390px mobile layouts without horizontal overflow.
2. Anonymous/wrong-role submission, malformed JSON, missing/non-string fields, invalid/multiple priorities.
3. Server-authoritative date/name and requester ID despite tampered client fields; `PENDING`/unassigned
   request creation, admin notifications, status history and audit creation.
4. Admin approval before relay; non-admin relay denial; all three assignment entry points reject a non-head.
5. Missing, inactive and wrong-role designated head failures, without changing request data.
6. Head-only assignment notification, duplicate relay prevention, task ownership/isolation and search by work location.
7. Head notes describing phone/in-person coordination, hold/resume transitions, completion, requester notification,
   no duplicate completion and no reopening through the task update route.
8. All-or-nothing bulk relay, alternate detail relay, concurrent relay conflict with only one assignment.
9. New/legacy requester/admin/head detail screens, request/history/dashboard pages, analytics endpoint,
   original technician assignments, original notes/history and NULL historical official-form fields.
10. Actual browser form submission and redirect to the saved request, displaying the submitted location/priority.

Desktop/mobile screenshots from the local test run were visually reviewed. Generated screenshots/test
outputs are not included in the source archive.

## Migration-preservation test

The test creates a NEW local synthetic database from the exact historical baseline. It inserts fixture
records in `User`, `MaintenanceRequest`, `RequestAssignment`, `RequestStatusHistory`, `RepairNote`,
`Notification`, `AuditLog`, and `SystemSettings`. It snapshots **every original column**, applies only
the additive migration, and compares all original rows/columns for exact equality. The four new fields
on the historical request remain NULL. No real dataset was available or queried, so this does not replace
backup/restore verification against your actual data and schema.

## Earlier attempts and corrections

Earlier workflow attempts were not all successful:

- The first attempt could not launch because the explicitly configured `/usr/bin/chromium` path did not exist.
  Playwright Chromium was installed locally and the suite was rerun.
- A responsive-layout assertion initially ran during the existing portal shell's resize animation. The test
  was corrected to wait for the transition/layout to settle; subsequent responsive checks passed.
- A legacy-display assertion initially matched two legitimate “not recorded” fields. The locator was scoped
  appropriately and the suite rerun.
- After a complete 10-test pass, validation-message clearing was polished and the full suite was rerun on
  another fresh local database: **10 passed**. The final unit/schema/type/build/lint checks were then rerun.

Non-failing build/dev warning: the existing Tailwind configuration's module type is not declared; Node
reparses it as ESM. The build still completed successfully. No unrelated module-system rewrite was made.

## Security/dependency limitations

The locked dependencies' audit includes critical advisories affecting **Next.js** and **next-auth**.
No blanket `npm audit fix --force`, framework upgrade or authentication redesign was performed, because
that would be unrelated and potentially breaking. Review and remediate these advisories in a separately
approved security update **before any production deployment**. The lockfile adds the development-only
Playwright tooling; it is not a claim that inherited dependency risks are fixed.

Hardcoded passwords in optional bootstrap/recovery/scratch helpers were replaced with explicit
private environment inputs. `.env.example` uses placeholders. Secret scanning found no literal private
keys, full bcrypt hashes, JWT credentials or non-placeholder database passwords in packaged source.
Remaining regex hits were reviewed as validation/error text or `.env.example` placeholders. A pattern
scan cannot guarantee absence of every possible secret; use your own secret scanner before publishing.

## Not tested / manual responsibilities

- Actual `tech@gmail.com` account existence/status was NOT checked in the real Supabase database. The
  tests use a synthetic account in a fresh local database. Verify the real account locally from a restored
  backup; it must be an existing ACTIVE TECHNICIAN.
- Actual production schema/migration history, real record counts and backup completeness were not verified.
- Live Supabase auth/storage, real email delivery, Vercel hosting and GitHub integration were not tested.
- Registration, verification, password recovery and auth/proxy application files were verified byte-for-byte
  unchanged from the original ZIP, but their external integrations were not retested in this task.
- Follow README's safe local baseline/migration procedure. Do not run the baseline CREATE TABLE migration
  on existing tables, reset a database, run recovery scripts, or seed an existing application database.
- The source ZIP contains no PostgreSQL dump. Keep your original database and backups separately.

## Follow-up: standard bordered text boxes

The form was visually revised at the user's request: date/name/location are ordinary bordered inputs;
description is a standard bordered multiline textarea, with no ruled background. Date/name locks,
fields/order, validation, priority choices and workflow remain unchanged. No schema or environment
change is needed to apply the one-component patch.

Executed again for this version:
- TypeScript: PASS.
- ESLint on the changed component and workflow test: PASS.
- Unit tests: 6 passed.
- Production build: PASS (local configuration only; not deployed).
- Browser/API workflow tests: 10 passed in 28.0 seconds, including borders on all four sides and no
  background ruling on all four text controls, read-only identity/date, single priority, responsive
  layout and the complete request/head workflow. Updated desktop screenshot visually reviewed.
- Full-project lint: FAIL — 70 inherited errors, 49 warnings (same counts as before this visual update).

An initial follow-up workflow attempt was blocked because this refreshed sandbox no longer had the
local PostgreSQL binaries/server available. No workflow tests passed in that blocked attempt. The
local tools were restored, a new isolated local database was created, and the full suite above passed.
Only synthetic local databases were used; no live Supabase service was accessed. The earlier dependency
audit findings remain unresolved; no dependency upgrade was part of this visual patch.

## Latest follow-up: original Photo Evidence restored

Optional photo evidence is restored below Requested Priority while retaining the normal bordered
text boxes, locked date/name, exactly one priority and designated technician-head workflow.
The original request-photos bucket, existing environment variable names and JSON photoUrl format
are reused. No additional migration or environment variable is introduced for this restoration.

### Actual final results for this version

- Unit tests: **11 passed**, including client/server file limits, all three supported formats, malformed
  evidence rejection, successful upload URL format, rollback and partial-upload cleanup.
- Workflow tests: **13 passed in 27.6 seconds**, including all previous workflow checks plus file picking,
  3-photo/5MB/type limits, previews, removal, actual drag/drop, browser compression/submission, saved
  photos in requester/admin/head galleries and lightbox, and failure cleanup with no partial request.
- Migration-preservation test: PASS on synthetic legacy records across all 8 models.
- Prisma schema validation: PASS.
- TypeScript: PASS on final retry.
- Production build: PASS; not deployed.
- Scoped lint (changed form/evidence modules/tests): PASS.
- Full-project lint: **FAIL — 70 inherited errors, 49 warnings**, with no new per-file/rule count increases.

All photo tests use generated image fixtures, fresh localhost PostgreSQL databases, and a purpose-built
localhost storage stub on port 55433. Actual uploads to live Supabase were NOT performed. The stub
returns controlled storage failures for cleanup tests; the expected server error log in that test is
not an unexpected test failure. The earlier dependency audit was not rerun for this UI/upload
restoration; no dependencies were upgraded and the earlier documented vulnerabilities remain.

Earlier follow-up test attempts honestly failed: one read the current /requests/new URL before redirect
and one clicked an image covered by the existing gallery's clickable zoom overlay. The tests now wait
for a successful POST/redirect and click the actual gallery container. The complete suite was rerun
and passed. A pre-build TypeScript attempt also found a syntax error in generated .next/dev/types;
the build completed and only generated development cache was removed before a passing TypeScript
retry. No source suppression or environment-file change was used to hide that error.

Storage cleanup is best-effort if the storage service itself cannot delete objects; failures are
logged for reconciliation. Production bucket permissions/existence still require separate verification.
If original uploads were already working, the existing private storage configuration is reused.
Do not include or share your .env file, and do not test against live storage/database connections.

## Follow-up: 500-character description and live counter

New request descriptions are limited to 500 characters in both the browser and server validation.
The form displays a live 0/500 counter. Validation counts the raw input before trimming, preventing
whitespace padding from bypassing the limit. Existing saved descriptions longer than 500 characters
are not truncated or rewritten. Photo Evidence remains available with its existing limits.

Actual checks run for this version:
- Unit tests: **12 passed** (including 500/501-character and whitespace boundaries).
- Local workflow tests: **14 passed in 39.5 seconds**, including the live counter, browser limit,
  direct API rejection of oversized descriptions, acceptance of exactly 500 characters, photo
  evidence, and preservation of a legacy description longer than 500 characters.
- Migration-preservation test, Prisma schema validation, production build, TypeScript, and scoped
  lint: **PASS**.
- Full-project lint: **FAIL — 70 inherited errors and 49 warnings**, with no new per-file/rule increases.

Tests used synthetic localhost PostgreSQL records and a localhost storage stub, not production or
live Supabase. No deployment, production migration, existing-data truncation, or private .env edit
was performed. No dependencies changed; previously documented audit findings remain unresolved.


## Task 2 — designated technician-head workflow

### Scope and safety

Inspected the existing form/schema, status logic, admin/technician UI and API routes, ownership/role
checks, and all three assignment entry points. Existing working components/transactions were reused.
The principal new enforcement is live ACTIVE designated-head identity for task reads and writes, plus
server page gates on task/dashboard/history routes and live ACTIVE ADMIN review/relay checks.
Admin receiver identification/relay navigation and manually recorded head coordination are explicit.
No worker account/login/assignment feature was introduced.

No production connections, production migration, GitHub push or Vercel deployment was performed.
Automated tests were limited to new localhost PostgreSQL databases and synthetic records, with the
existing local storage stub. Existing test databases were retained; none were reset or dropped. The
real tech@gmail.com account and production Supabase schema/storage have NOT been verified. No real
account was created, promoted, activated, removed or reassigned. Private project .env files were not
edited or packaged; test-only shell values were outside the project.

### Compatibility and schema

Task 2 introduces no new schema/migration/configuration variable. Byte comparisons confirm Prisma
schema/legacy schema, all supplied migrations, auth/proxy and registration/verification/recovery
application files are unchanged from the prior delivered version. The initial form migration is
still required wherever the new request fields do not yet exist. README.md describes local baseline
reconciliation; no baseline should be blindly applied to an existing database.

Historical assignees/history/notes are not rewritten. Non-designated technicians cannot access task
workflow pages/APIs, including old assigned records; admin retains historical review. The head also
cannot open another account's historical task. Outstanding old assignments require administrator
review and an explicitly planned handover, not an automatic transfer. Unrelated profile/settings/
inbox application routes are retained.

### Actual lint results

- Full-project lint: FAIL — **65 inherited errors, 48 warnings**.
- Lint scoped to Task 2 source/test files: FAIL — **6 inherited errors, 2 warnings**.
- Both compared against prior delivered lint results: **no new per-file/rule/severity count increases**.
- Remaining scoped errors are pre-existing effect/state rules and existing explicit-any typing in
  the admin detail API / technician detail page. No blanket lint/type suppression was added.
- A follow-up typing cleanup initially revealed an unknown-error catch variable in BulkAssignModal;
  it was fixed with an instanceof Error guard before release validation.

The earlier dependency audit findings remain unresolved (previously 28 vulnerabilities, including
2 critical). The audit was not rerun and no dependencies were upgraded in Task 2. Expected storage
failure logs come from the deliberate rollback test, not a live upload failure. The inherited
Tailwind module-type warning remains. Test/generated caches are not shipped.

### Delivery privacy

The ZIP excludes node_modules, .next, Git history, caches, reports/generated logs, private .env files,
keys and existing public/uploads image files. No database dump/test database is included. Original
upload files remain untouched locally; retain or transfer them securely when updating an installation.
The uploads directory marker, public application logos/assets and synthetic test fixtures are retained.
See TASK2_CHANGES.md for the complete Task 2 changed-file manifest.


### Final release validation — actual executed results

| Check | Result |
| --- | --- |
| Apply included migrations to a new localhost test DB | PASS |
| `npm run test:workflow` | **18 passed in 1.3 minutes** |
| `npm run test:unit` | **12 passed** |
| `npm run test:migration` | PASS — every original column/row preserved across 8 models |
| `npm run db:validate` | PASS |
| `npm run build` | PASS — local production build, not deployed |
| `npm run typecheck` | PASS |
| Full-project lint | FAIL — 65 inherited errors, 48 warnings; no new count increases |
| Task 2 scoped lint | FAIL — 6 inherited errors, 2 warnings; no new count increases |

Workflow coverage includes form/500-character limit, authentication and tamper rejection, authoritative
submission identity/date, admin notification/history, separate approval and relay, every relay API,
missing/inactive/wrong-role head, all-or-nothing bulk relay, concurrent duplicate relay, head receipt,
read/write ownership, non-head historical access denial without data changes, existing-session
revocation after head deactivation/email change, inactive admin denial, confirmed browser relay,
receiver display, admin-urgent dashboard task, browser hold/resume/completion, terminal transition
rejection, legacy history/details, photo picking/drop/limits/galleries and failure cleanup.

The final suite was rerun after fixing the catch-variable typing issue. Build ran after the workflow
server stopped. Only generated .next/dev cache was removed before standalone TypeScript verification;
no source suppression or private project environment changes were used. The final schema/migrations
and unchanged authentication sources passed byte-level compatibility comparison with the prior version.


## Task 3 — Cloudflare Turnstile registration, private ID review, pending accounts

### Inspection and scope

The previous registration page/API had no CAPTCHA or ID-upload implementation and explicitly created
ACTIVE accounts. PENDING status, the NextAuth non-ACTIVE login gate and administrator user-status
controls already existed and were reused. New registration keeps the original fields/department choices,
adds a private ID image, verifies Turnstile on the server, and creates only STUDENT/PENDING accounts.
No face recognition, face comparison, selfies, worker-account changes or deployment were added.

No new npm packages or dependency versions were introduced. package-lock.json is unchanged. The
existing Supabase Auth integration is reused; CAPTCHA succeeds before any database lookup/upload/auth
creation. The new registration endpoint requires multipart FormData; JSON alone cannot bypass CAPTCHA
or ID validation. The original Supabase email_confirm option does not activate the Prisma account or
permit a FixTrack session. Existing private .env was not edited; local test shell configuration stayed
outside the project and used localhost databases/service stubs plus public provider test keys only.

### Actual test configuration and coverage

- Fresh, newly created localhost PostgreSQL databases, synthetic accounts/passwords and generated image
  fixtures only. No production database, actual ID document, real user's account, or live Supabase used.
- A localhost service stub simulated Supabase Auth and private ID storage; the maintenance suite retained
  its separate request-evidence stub. Storage/Auth failures and bucket privacy checks were controlled.
- Cloudflare's actual official Siteverify endpoint was called with its publicly documented success,
  failure, and spent-token test secrets. The actual official test widget completed on localhost too.
- Missing/oversized/invalid tokens, configuration errors, provider outage/timeout/non-JSON responses,
  action/hostname binding, and production dummy-key rejection were covered by validation unit tests.
- Expiry/error/timeout callbacks were additionally simulated through a browser-only test widget to test
  UI recovery deterministically. Genuine production-token expiry/production bot detection was NOT tested.
- Direct registration API bypass attempts, malformed/oversized/unsupported ID images, client-forged
  ACTIVE/ADMIN values, pending login denial, private signed-ID review authorization, inactive-admin
  denial, authorized approval followed by successful login, safe upload/Auth failure handling, form/ID
  preservation and CAPTCHA reset on failed submission, script-load failure/retry, and mobile overflow
  were exercised through local API/browser tests.
- All previous request, counter, photo, admin relay, technician-head permissions/status/history tests
  were rerun in the same full suite. Original maintenance workflow source was not changed.

### Failures found and rerun honestly

An initial registration-only suite passed 8 tests. After adding one retry test, the first full run
had 23 passes, 2 failures and 2 skipped serial successors: the new retry assertion matched both the
form alert and Next.js route announcer, and an evidence-workflow request hit ECONNRESET. The alert
selector was scoped to the registration form. No application retry/suppression was added to conceal
the isolated connection failure. On another fresh local database the full suite passed **27/27 in
1.1 minutes**, including both failed cases. The subsequent release checks were rerun separately.
A newly introduced prefer-const lint finding was corrected before release; remaining lint findings
are inherited and were compared by file/rule/severity counts.

### Schema, storage and compatibility

New migration: 20261022000200_registration_id_document — adds nullable User.registrationIdPath only.
No existing user status/role/column value is rewritten. Prior migrations are unchanged. The migration-
preservation test now applies both additive migrations to historical synthetic records, comparing every
original row/column across 8 models and checking existing users' new ID paths remain NULL. The new
migration was applied only to isolated localhost databases; no production migration was run.

Manual local Supabase setup SQL for PRIVATE registration-ids is included separately. It was not run
against real Supabase. Existing broad bucket policies/privacy must be reviewed before real use. IDs
are never stored in request-photos/avatars/public uploads. Admin-only signed links expire in 60 seconds;
actual Supabase signed-link expiry/RLS were NOT verified against a real service, only requested TTL and
authorization in the local stub. The preview is hidden after 60 seconds; copied links are bearer links
and must not be shared. Cleanup of newly created resources is best-effort if services fail.

Byte-level checks confirmed NextAuth/session/proxy/password-reset/OTP sources, prior migrations, the
request form and technician-head relay helper are unchanged from Task 2. The legacy auth/login
metadata route now also rejects PENDING and stops returning debug stacks. Admin approval endpoints
now recheck live ACTIVE ADMIN status. Real CAPTCHA action/hostname metadata binding uses unit fixtures;
real widget credentials/production hostname deployment remain unverified. Public dummy keys are only
accepted in non-production, must still call Siteverify, and are never automatically selected.

### Privacy and remaining setup

No production/private credentials or real ID images are shipped. Private .env, user uploads, generated
logs/screenshots, database dumps, dependencies and caches are excluded. Real upload files in the local
working project/original archive remain untouched. No GitHub push, Vercel deployment or production
schema/data change was performed. Before manual use: apply migrations to a verified LOCAL database,
configure local Auth/private storage, and set the new Turnstile variables. Real keys and exact allowed
hostnames are required for eventual production; missing configuration fails closed.

The pre-existing dependency audit findings remain unresolved (previously 28 vulnerabilities, including
2 critical); no new audit was run and no dependencies were upgraded. The inherited Tailwind package
module-type warning remains. The build is not evidence of a production deployment or live-service test.


### Final Task 3 release results

| Check actually run | Result |
| --- | --- |
| Apply all migrations to fresh localhost test DB | PASS |
| Full browser/API workflow suite | **27 passed in 1.1 minutes** (9 registration + 18 maintenance) |
| Unit tests | **19 passed** |
| Official Siteverify public-provider tests | **3 passed**, none skipped |
| Official public test widget on localhost | PASS (included in registration suite) |
| Migration preservation, original 8 models + NULL legacy ID paths | PASS |
| Prisma schema validation | PASS |
| Local production build | PASS, not deployed |
| TypeScript | PASS |
| Full-project lint | FAIL — **64 inherited errors, 48 warnings**, no new per-file/rule increases |
| Task 3 scoped lint | FAIL — **5 inherited errors, 1 warning**, no new per-file/rule increases |
| Server test-secret value absent from generated client assets | PASS |
| Existing dependency versions / package-lock unchanged | PASS |

Scoped lint failures are existing admin API explicit-any and UserSlideOverModal effect/declaration rules;
its existing unused catch-variable warning also remains. New CAPTCHA modules/components and registration
API introduce no remaining lint finding. No blanket lint/type suppression was added. A narrow img rule
exception is used for the private administrator ID preview rather than routing identity images through
a shared optimized-image cache. Only generated .next/dev cache was removed before the final standalone
TypeScript check, after the workflow server had stopped. All earlier failed attempts are described above.


## Task 4 — final executed results (latest release)

### Isolation and inspection

Task 3 already implemented the registration ID/CAPTCHA/private-review flow, PENDING defaults and
administrator approval. Inspection found that several older routes/layouts still trusted token
role/status claims; Task 4 adds current database checks throughout protected pages/APIs. The account
schema has ACTIVE/PENDING/INACTIVE, so declined/disabled accounts reuse INACTIVE. No account enum,
Prisma schema, migration or environment-variable change was needed. Existing schema/migration files,
Turnstile verifier and widget were byte-compared to the Task 3 input and are unchanged.

All databases used here were newly created, isolated localhost PostgreSQL 16 databases. Registration
Auth/storage used a localhost-only synthetic service stub, not live Supabase. Cloudflare public dummy
widget/Siteverify tests were actually exercised. No production database connection, real ID, existing
account modification, database reset, GitHub push or Vercel deployment was performed. Synthetic test
rows were retained in their separate local databases and are excluded from the source archive.

| Check actually executed | Actual result |
| --- | --- |
| Apply all three existing migrations to fresh local DBs | PASS |
| `npm run test:unit` | **23 passed**, none skipped |
| `npm run test:workflow` final full run | **32 passed in 1.3 minutes**, none skipped (4 account-access + 10 registration + 18 maintenance) |
| `FIXTRACK_ALLOW_PROVIDER_TESTS=1 npm run test:turnstile-provider` | **3 passed**, none skipped; official success/failure/spent responses |
| Official public Turnstile test widget on localhost | PASS, included in registration suite |
| `npm run test:migration` | PASS; every original row/column across 8 models preserved; new legacy fields including ID path remain NULL |
| `npm run db:validate` | PASS |
| `npm run build` | PASS; production build and route generation, no deployment |
| `npm run typecheck` final standalone check | PASS, exit 0 |
| `npm run lint -- --format json` | **FAIL — 63 errors, 48 warnings** |
| Changed-file findings derived from full ESLint output | **20 inherited errors, 5 warnings**, no per-file/rule/severity increases |
| Full lint compared to Task 3 baseline (64 errors, 48 warnings) | No newly increased per-file/rule/severity findings; configuration not weakened |
| `npm ci --ignore-scripts --dry-run --no-audit --no-fund` in separate temporary directory | PASS; lock/package consistency only, not a fresh dependency installation |
| Existing dependency versions compared with Task 3 lock | PASS; no existing package version changed; Sharp 0.34.5 now a direct dependency |

The package-lock preparation command reported the existing **28 vulnerabilities (1 low, 5 moderate,
20 high, 2 critical)**. These remain unresolved; no blanket `npm audit fix --force` or unrelated
upgrade was performed. The inherited Tailwind module-type build warning remains. Full lint is NOT
passing, and passing tests/build are not a production-readiness certification.

### Coverage actually exercised

- Required ID; unsupported/MIME-spoofed/invalid and oversized uploads; valid JPEG/PNG/WebP decoding;
  metadata stripping, malicious filenames and over-limit decoded pixel dimensions.
- CAPTCHA missing/invalid/failed/spent responses and UI load/expiry/error/timeout/retry handling;
  direct API registration cannot bypass server verification.
- Successful public registration with forged client role/status still creates STUDENT/PENDING;
  pending login denied; private object has no public-read URL; only a current ACTIVE ADMIN reviews
  a 60-second signed ID link and approves through existing controls; approved login works.
- Failed bucket/upload/Auth creation and database write failure: no incomplete Prisma account;
  newly owned ID/Auth resources removed when cleanup services are available; existing account kept.
- PENDING and INACTIVE states for every role: **50 protected read/mutation paths per state/role**,
  including filename-suffix paths and ID review, return 403 even using previously ACTIVE JWTs.
  User/request/notification/audit row counts remain unchanged after denied operations.
- Blocked protected page navigation shows account-status explanations; sign-out works. Fresh blocked
  logins explain status after valid passwords and issue no session. Wrong-password login issues none.
- Existing approved role access still works; synthetic ADMIN demotion revokes stale-token privileges;
  directory/private ID access and caller-only metadata prevent cross-user/role lookup bypass.
- Existing official form/counter/photo evidence, admin review/all relay paths, technician-head-only
  receipt/progress/completion, duplicate/concurrent relay and historical compatibility regressions.

### Earlier failures and corrections (not hidden)

The initial full workflow attempt had **24 passed, 2 failed, 6 not run**. One new login test used an
exact button name that omitted its existing arrow icon. The new database-failure cleanup test used
an artificial CUID where Supabase's SDK requires a UUID, causing the synthetic Auth delete to be
rejected before an HTTP call. Fixed the test selector and used realistic UUID test fixtures; no
production account or application bypass was added. The complete rerun on a NEW local database
then passed all 32 tests. An initial TypeScript check also found a Buffer/BlobPart typing mismatch
in a new image test; changed it to an explicit Uint8Array and the final check passed. An initial npm
lock dry-run was launched from the wrong directory and had no input; rerun in the prepared separate
directory passed. A final extra pixel-limit unit test was added and all 23 unit tests rerun/passed.
Only generated `.next/dev` files were cleared before standalone TypeScript, with the test server stopped.

### Limits / manual verification still required

- Real Supabase Auth/private bucket/RLS permissions, live Turnstile keys/hostnames, genuine documents,
  email delivery, a production data restore and deployed behavior were NOT tested.
- Copied signed ID links are bearer links for up to 60 seconds. Do not share them; review existing
  broad storage policies manually to exclude registration-ids. Private bucket metadata alone cannot
  repair an unsafe pre-existing policy. No new paid service or Vercel filesystem storage was added.
- Cross-service cleanup is best-effort when a provider is unavailable; failed cleanup needs manual
  reconciliation. Service outages are not claimed to be fully atomic across PostgreSQL/Auth/Storage.
- No new Task 4 migration. Earlier request-form and nullable-ID migrations remain required on a
  verified restored LOCAL database. Follow README baseline/history checks, never reset/apply blindly.
- Existing .env files were not edited. Task 3 variables are still needed; .env.example has placeholders.
- The source ZIP excludes real uploads, environment files, generated outputs, test logs and databases.
  It is not a backup of an existing installation's user data; retain/transfer those securely separately.


## Task 5 — final executed results (latest release)

### Inspection / implementation scope

Reused existing User Management, administrator layout/proxy guards, private RegistrationIdReview,
User.accountStatus, User.registrationIdPath, AuditLog and Notification. No duplicate users/status table,
public ID bucket, worker account, faculty role, biometric check or automatic appeal was introduced.
Added an explicit decision service and UI. The previous ACTIVE/PENDING/INACTIVE enum could not reliably
distinguish rejection from deactivation, so an additive fourth migration adds REJECTED plus nullable
User.verificationRejectionReason. Existing INACTIVE records are not reclassified.

Current ACTIVE ADMIN authorization is checked before access and again within the decision transaction.
Only a PENDING account with an ID can be decided; self-review is denied. Status, audit and notification
commit together at serializable isolation. Role, credentials, ID file and request/history records are
untouched. Legacy user/technician status paths use the same decision service or reject conflicting
edits; diagnostic bulk activation was disabled because it bypassed individual review.

### Environment / actual outcomes

Fresh localhost-only PostgreSQL 16 test databases, localhost Next.js/Chromium, synthetic accounts and
images, local Supabase-compatible Auth/private-storage stubs. Official Cloudflare public test widget
and Siteverify endpoints were exercised; no production keys/services were used. No production DB,
existing account, real ID, real upload bucket or GitHub/Vercel deployment was touched. Test records
remain only in isolated local databases and are not packaged.

| Check actually run | Result |
| --- | --- |
| All four migrations on fresh localhost DBs | PASS |
| `npm run test:unit` | **26 passed**, none skipped |
| `npm run test:workflow` final full run | **40 passed in 1.3 minutes**, none skipped (4 account-access + 10 registration + 8 verification + 18 maintenance) |
| `FIXTRACK_ALLOW_PROVIDER_TESTS=1 npm run test:turnstile-provider` | **3 passed**, none skipped |
| Official public Turnstile widget | PASS, included in registration workflow tests |
| `npm run test:migration` | PASS; all original rows/columns across eight models preserved, including original ACTIVE/PENDING/INACTIVE accounts; both ID/reason fields NULL for legacy users |
| `npm run db:validate` | PASS |
| `npm run build` | PASS; local optimized build/route generation, NOT a deployment |
| `npm run typecheck` after build | PASS, exit 0 |
| `npm run lint -- --format json` | **FAIL — 61 errors, 48 warnings** |
| Full lint vs Task 4 baseline (63 errors, 48 warnings) | No increased per-file/rule/severity findings; no lint configuration/suppression changes |
| Changed-file lint from full output | 15 inherited errors, 12 warnings; no new/increased findings |
| Newly added verification service/UI/API/test modules from full lint output | 0 errors, 0 warnings |
| Package-lock/dependency/environment template comparison | Unchanged; no new dependency or environment variable |
| `npm ci --ignore-scripts --dry-run --no-audit --no-fund` in separate temporary directory | PASS; manifest consistency only, not a clean reinstallation |
| Server-only Turnstile test secret absent from generated client JavaScript | PASS |

The inherited Tailwind module-type warning remains. Dependency audit was not rerun or remediated in
Task 5: the previously reported 28 vulnerabilities (including 2 critical) remain an unresolved release
risk. Full lint is not green. No claim of complete security audit or production readiness is made.

### What was actually tested

- Pending account list contains name/email/existing role/PCLU ID/registration details/date and a
  has-ID flag, NOT a storage path or password hash. Private ID preview is admin-only. Mobile browser
  review/preview and no horizontal overflow were checked.
- Admin approval through the new UI persists ACTIVE with the same STUDENT role/ID file, one audit
  (actor/time/target/decision) and one notification. Actual sign-out and subsequent logins were tested;
  approved students can use their dashboard but cannot use admin routes.
- UI rejection stores the optional plain-text reason and REJECTED status, preserves role and ID,
  blocks old ACTIVE sessions and future logins, displays the reason on the owner's blocked-session
  page and after correct-password sign-in, and keeps sign-out working. No-reason rejection also tested.
- Ordinary/anonymous accounts cannot list/review/decide through direct APIs. Inactive/demoted admin
  JWTs are denied. Self-review, malformed IDs/actions/JSON, forged privilege fields, long/non-text
  reasons, missing users/IDs and old full-edit bypass attempts are rejected.
- Repeated/conflicting decisions return 409 and do not duplicate audit/notifications. Simultaneous
  approve/reject by two separate admins commits exactly one outcome. Rejected records cannot be
  reset by the generic or technician edit/status routes.
- Legacy PATCH approval delegates to the same audited transaction; legacy INACTIVE decision for a
  pending account becomes explicit REJECTED. Diagnostic bulk activation returns 409 without changing
  the pending technician. Approved non-head technicians still cannot manage head-only tasks.
- The broad stale-session suite now checks PENDING/INACTIVE/REJECTED for all three roles across 52
  protected read/mutation paths per combination, including verification and diagnostics. Denied
  operations leave user/request/notification/audit counts unchanged.
- Recoverable verification error/refresh and empty-list UI states. Loading state is implemented;
  deliberate slow-network loading behavior was not separately asserted.
- Existing CAPTCHA/private registration/cleanup, request form/counter/photo evidence, admin relay,
  technician-head receipt/progress/completion, legacy history and ownership regressions all passed.

### Iteration history and honest limits

An initial full run passed all 39 tests. After finding and closing the alternate technician-edit and
legacy diagnostic activation paths, an additional regression was added and a NEW localhost database
used for the final complete run: 40/40 passed. Initial new hook lint and unused test-variable findings
were corrected without rule disabling. All Task 5 TypeScript checks passed; no failed workflow test
is being hidden. Only generated .next/dev type cache was cleared before the standalone final check,
with the development test server stopped.

Not tested against real Supabase Auth/storage/RLS, genuine ID documents, real production Turnstile
keys/hostnames, SMTP/email delivery, Windows runtime, production migration history/data or deployed
Vercel behavior. Signed URLs are authorized at issuance and remain bearer links for up to 60 seconds;
revoking a session does not instantly revoke a previously issued storage link. Review private bucket
policies in a safe local Supabase instance before eventual release. Decision notifications are in-app,
not automatic email. Pending legacy accounts with no ID are preserved and left unresolved, not fabricated
or automatically approved. No automatic rejection appeal/reactivation flow was added.

### Packaging boundaries

Source/config/schema/all four migrations/tests/docs are included. No real env, user upload, database,
node_modules, .next, Git history, build cache or test output is included. The archived restore-users.ts
with embedded account profiles and destructive prisma/delete-admin.ts are additionally omitted from
this source ZIP; they are not required to run/develop the app. Neither working file was deleted or
executed. Retain an installation's existing credentials/uploads securely outside this archive. Source
packaging is not a user-data backup. See README for local history/baseline reconciliation before the
new migration, and TASK5_CHANGES.md for the complete changed-file list.


## Task 5 ID-upload follow-up — latest checks


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

## Latest follow-up: remove public registration ID number

See `REGISTRATION_NO_ID_NUMBER_TEST_REPORT.md`. This follow-up ran 27 unit tests and 41 browser/API tests (all passed), the five migrations on a new localhost database, migration preservation/nullable uniqueness tests, schema validation, optimized local build, and final TypeScript checks (all passed). Full lint retains 61 errors and 48 warnings, with no increased finding groups. Initial nullable-ID test assertion typing was fixed before the successful final checks. No production migrations, push, or deployment.

## Latest worker-directory and dashboard update

Final checks: 30 unit tests and 47 browser/API tests passed with zero skips; the six new worker scenarios also passed separately. All six migrations applied to a new localhost-only database; old eight-model values, new-table RLS/no-public-policy state, schema validation, production build (local only), and standalone TypeScript passed. Full ESLint remains 61 errors / 48 warnings with no new/increased finding groups. Early fixture, accessible-label and responsive-layout failures were corrected and rerun; see `WORKER_WORKFLOW_TEST_REPORT.md` for honest iteration results and remaining limitations. No hosted migrations, resets, GitHub push or deployment.

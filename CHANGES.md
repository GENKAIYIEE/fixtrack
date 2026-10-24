# Changed-file manifest

## Scope

Official request form; backward-compatible data model; single designated technician-head relay;
related request displays; isolated local tests; secret-free development handoff.
Authentication, authorization routing, registration and account-verification application code remain unchanged.
Legacy credential literals in optional scripts were replaced with explicit environment inputs solely for
secret-free packaging; those scripts were not executed.

## Modified files

- `.gitignore`
- `README.md`
- `package-lock.json`
- `package.json`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `restore-users.ts`
- `scratch_test.js`
- `scratch_test.ts`
- `src/app/(user)/dashboard/page.tsx`
- `src/app/(user)/history/page.tsx`
- `src/app/(user)/requests/[id]/page.tsx`
- `src/app/(user)/requests/new/page.tsx`
- `src/app/(user)/requests/page.tsx`
- `src/app/admin/assignments/page.tsx`
- `src/app/admin/requests/[id]/page.tsx`
- `src/app/admin/requests/page.tsx`
- `src/app/api/admin/analytics/route.ts`
- `src/app/api/admin/assignments/route.ts`
- `src/app/api/admin/requests/[id]/route.ts`
- `src/app/api/admin/requests/route.ts`
- `src/app/api/technician/tasks/[id]/route.ts`
- `src/app/api/technician/tasks/route.ts`
- `src/app/api/user/dashboard/route.ts`
- `src/app/api/user/history/route.ts`
- `src/app/api/user/requests/route.ts`
- `src/app/technician/dashboard/page.tsx`
- `src/app/technician/history/page.tsx`
- `src/app/technician/tasks/[id]/page.tsx`
- `src/components/admin/AllRequestsTable.tsx`
- `src/components/admin/AssignmentConfirmModal.tsx`
- `src/components/admin/BulkAssignModal.tsx`
- `src/components/admin/LiveRequestsTable.tsx`
- `src/components/admin/PriorityQueue.tsx`
- `src/components/admin/RejectRequestModal.tsx`
- `src/components/admin/RequestInfoCard.tsx`
- `src/components/admin/TechnicianAvailabilityBoard.tsx`
- `src/components/admin/UnassignedRequestsPanel.tsx`
- `src/components/technician/ActiveTaskCards.tsx`
- `src/components/technician/TaskRequestInfoCard.tsx`
- `src/components/technician/TasksTable.tsx`
- `src/components/user/RequestItem.tsx`
- `src/components/user/RequestStatusTimeline.tsx`
- `src/components/user/StudentRecentRequests.tsx`
- `src/lib/constants/buildings.ts`
- `src/types/index.ts`

## Added files

- `.env.example`
- `playwright.config.ts`
- `prisma/legacy-schema.prisma`
- `prisma/migrations/20261022000000_baseline/migration.sql`
- `prisma/migrations/20261022000100_official_request_form/migration.sql`
- `prisma/migrations/migration_lock.toml`
- `src/components/shared/OfficialRequestDetails.tsx`
- `src/components/user/OfficialRequestForm.tsx`
- `src/lib/requests/assignment.ts`
- `src/lib/requests/display.ts`
- `src/lib/requests/form.ts`
- `tests/local-safety.ts`
- `tests/migration-preservation.ts`
- `tests/unit.test.ts`
- `tests/workflow.spec.ts`
- `CHANGES.md` — this manifest.
- `TEST_REPORT.md` — executed checks and known limitations.

## Key implementation details

- `OfficialRequestForm.tsx`: the reference's fields/order and square single-choice priority visuals;
  read-only date/name; no letterhead or extra requester fields.
- `src/lib/requests/form.ts`: strict shared validation and Asia/Manila date handling.
- `src/app/api/user/requests/route.ts`: trusts server identity/date only; transactional submission,
  admin notifications, status history, audit log; keeps new requests unassigned for admin review.
- `src/lib/requests/assignment.ts`: the only relay implementation used by single, detail and bulk
  assignment routes; explicit head account validation, serializable transactions, concurrency guards.
- `OfficialRequestDetails.tsx` and display helpers: distinguish submitted priority from admin priority,
  preserve existing values/photos, display legacy missing fields honestly.
- Prisma migrations: exact historical baseline plus additive nullable form fields; no destructive SQL.
- Existing task portal reused; head coordinates workers outside the system.
- No historical request reassignment, account conversion, data reset, or production migration.

## Deliberate delivery exclusions

`node_modules`, `.next`, Git history, build/test caches, test output/screenshots, diagnostic logs,
`.env` and other private environment files are excluded. `.env.example` contains placeholders only.
Original public assets/uploads remain in the same project locations. The archive is source code,
not a database backup; retain and back up your existing PostgreSQL data separately.

## Follow-up: bordered text boxes

- `src/components/user/OfficialRequestForm.tsx`: replaced underline-only inputs and the lined description background with ordinary bordered inputs and a multiline text box. Date/name remain read-only. No database, environment, authentication, validation or workflow changes.
- `tests/workflow.spec.ts`: verifies all four text controls have borders on every side and no background ruling.
- `README.md` and `TEST_REPORT.md`: document this visual-only follow-up.

## Follow-up: original Photo Evidence restored

Runtime files for the incremental patch:
- `src/components/user/OfficialRequestForm.tsx`: keeps bordered text boxes and adds optional photo evidence to submission.
- `src/components/user/PhotoEvidenceUpload.tsx`: click/drop selection, previews/removal, original 3-photo/5MB JPG/PNG/WEBP limits, original resizing/compression.
- `src/lib/requests/photo-rules.ts`: shared client/server limits.
- `src/lib/requests/photo-storage.ts`: server checks, original bucket/URL format, cleanup on failures.
- `src/app/api/user/requests/route.ts`: persists evidence URLs with the existing transactional submission.

Test/docs additions: `tests/evidence-storage-stub.ts`, three small synthetic image fixtures in
`tests/fixtures`, photo tests in `tests/unit.test.ts` and `tests/workflow.spec.ts`, and updated
`README.md`, `.env.example`, `CHANGES.md`, `TEST_REPORT.md`.
No schema, migration, account, authentication or head-assignment changes were made for this follow-up.
No .env file was included or modified in the supplied project.

## Follow-up: 500-character description and live counter

- `src/lib/requests/form.ts`: changes the shared description limit to 500 and rejects raw over-limit
  descriptions (including whitespace padding) before trimming. Existing stored records are untouched.
- `src/components/user/OfficialRequestForm.tsx`: adds the live 0/500 counter; the existing maxlength
  attribute now follows the shared 500-character limit. Photo evidence remains in place.
- `tests/unit.test.ts`, `tests/workflow.spec.ts`: cover exactly 500, 501, whitespace padding, live
  counts/reset and input overflow.
- Documentation updated. No environment, migration, authentication or assignment changes.


## Task 2 — head-only handling and relay clarity

- Reused the existing form, review/relay transactions, notifications/history and technician progress UI.
- Enforced current ACTIVE designated TECHNICIAN identity on all task read/write APIs and server-gated
  dashboard/task/history pages; admin request/relay APIs recheck ACTIVE ADMIN identity.
- Preserved accounts, roles, all historical assignments/records and unrelated profile/auth features.
- Added clear receiving-head identity/email, direct approved-request relay navigation, clearer relay
  wording, backend error messages, manual coordination notice, admin urgency sorting and on-hold badges.
- Added tests for stale/unauthorized accounts, preserved legacy records, confirmed UI relay and browser
  hold/resume/completion. No new Prisma migration/configuration variable. See TASK2_CHANGES.md.


## Task 3 — Cloudflare Turnstile registration protection

- Inspected registration and found no existing CAPTCHA/ID upload; original registration auto-activated.
- Added official explicit Turnstile rendering and mandatory server Siteverify with action/hostname
  binding, timeouts, fail-closed errors and recovery; production rejects public test secrets.
- Preserved original registration fields/Supabase Auth integration, added private ID upload/manual
  administrator review, and enforced STUDENT/PENDING registration with login blocked until approval.
- Added nullable User.registrationIdPath migration and manual LOCAL private-bucket setup SQL.
- Reused existing admin approval controls with live ACTIVE ADMIN authorization. No face/selfie work.
- Added unit, provider, registration UI/API/privacy tests alongside existing maintenance regressions.
- Added environment placeholders/setup instructions; no CAPTCHA dependency, production keys or deploy.
- See TASK3_CHANGES.md and TEST_REPORT.md for complete details and actual check outcomes.


## Task 4 — secure private ID submission and pending-account enforcement

- Reused Task 3 registration form, required private ID upload, mandatory server CAPTCHA verification,
  STUDENT/PENDING defaults, nullable document reference and existing manual administrator review.
- Strengthened ID validation with real image decoding, a 20-megapixel limit, single-frame enforcement,
  orientation correction and metadata-free JPEG normalization; random paths/private bucket retained.
- Added fresh database approval/role checks to proxy, protected API handlers and server layouts,
  preventing stale ACTIVE JWTs from bypassing later pending/inactive states or role changes.
- Added clear status/login messages and sign-out; admin-only directory/diagnostics; caller-only login
  metadata. Existing ACTIVE/PENDING/INACTIVE enum is reused (INACTIVE for declined/disabled accounts).
- Made failed-registration Auth and ID cleanup independent. Preserved existing accounts/history.
- Declared the already-installed Sharp 0.34.5 dependency directly; no package versions upgraded.
- Added account-policy/access, stale-session, image decoding and database-failure cleanup tests.
- No new environment variable, schema change or migration. No production access/push/deployment.
- Full manifest and actual check results: TASK4_CHANGES.md and latest section of TEST_REPORT.md.


## Task 5 — administrator ID verification and approval/rejection

- Reused existing User Management and private ID-review component; added paginated/filterable
  Account verification cards, explicit review/confirm actions, optional user-facing reason and states.
- Added a single serializable decision service/API: live ACTIVE ADMIN, no self-review, PENDING-only,
  bounded validation, one status/audit/notification transaction, 409 for stale/conflicting decisions.
- Added AccountStatus.REJECTED and nullable User.verificationRejectionReason in one additive migration.
  Existing INACTIVE records/roles/history/ID files are unchanged; no automatic reclassification.
- Rejection messages/reasons appear only after correct credentials or in the owner's blocked session.
  Existing current-database access restrictions, CAPTCHA and technician-head permissions are preserved.
- Secured legacy user/technician update paths and retired diagnostic bulk activation as a review bypass.
- Added verification/persistence/concurrency/security/mobile/error-state tests and expanded preservation.
- No new environment variables/dependencies/storage services. No push, deployment or production access.
- Complete manifest/results: TASK5_CHANGES.md and latest Task 5 section in TEST_REPORT.md.

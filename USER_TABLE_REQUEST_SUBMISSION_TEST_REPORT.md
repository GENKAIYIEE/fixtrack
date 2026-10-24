# User table and request submission: actual results

## Checks run on this update
- `npm run test:unit`: **40 passed**, 0 failed/skipped. Includes the original 30 tests, four previous private-ID-storage setup tests, and six new request-submission/public-evidence setup tests.
- Full `tests/workflow.spec.ts`: **26 passed**, 0 failed/skipped. Includes authenticated submission with/without evidence; three valid image formats; count/type/size validation; user/admin/head image viewing; partial upload rollback; missing/denied/private request-photo bucket failures; submission without photos while bucket access fails; and missing-column P2022 reporting with evidence rollback. Relay, technician status, worker directory, multiple workers, concurrency, completion and history regressions also passed.
- `tests/account-access.spec.ts` + `tests/registration.spec.ts`: **15 passed**, 0 failed/skipped. Includes registration CAPTCHA/private ID behavior, pending status and server-side authorization. The official public Turnstile localhost test-widget scenario was actually executed.
- `tests/verification.spec.ts`: **9 passed**, 0 failed/skipped. Includes the new six-column user table, no rendered legacy ID Number, department centered under role on desktop/mobile, retained stored identifier, admin-only ID viewing and approval/rejection.
- **50 distinct browser/API scenarios passed across these three batches.** An additional focused five-request-scenario run and a separate one-test UI screenshot run also passed; these repeats are not counted as additional distinct scenarios.
- User-table screenshot captured and visually reviewed locally after the DOM geometry assertions passed.
- `npm run db:validate`: **passed**.
- `npm run build`: **passed**, local optimized build only.
- `npm run typecheck`: **passed**.
- Six existing migrations applied to fresh isolated local databases for browser-test batches. No new schema or migration is included in this follow-up.
- Full-project lint: **61 existing errors and 48 warnings**, with zero new/increased file/rule/severity groups compared with the preceding release. The original warnings/errors are not silently suppressed. Focused lint on the changed runtime files, setup helper and new unit tests found zero errors; UsersTable retains its existing next/no-img-element warning.

## Safety and limitations
All database tests used opted-in loopback databases named fixtrack_test_*, synthetic users and images. The missing-column regression temporarily renamed a column only in that isolated synthetic database and restored it in finally; it did not delete data or touch production. Tests use local Supabase-compatible Auth/Storage HTTP stubs and documented Turnstile test configuration. The setup helper's remote/prod/opt-in/key guards and create/read-only/refuse behavior were exercised with synthetic HTTP responses.

The user's Windows Docker/Supabase instance, real credentials and original submission failure were NOT inspected remotely. The old generic screenshot/message does not establish which provider or database operation failed. The patch adds explicit diagnostics and safe local bucket setup; configuring that local service remains a user setup step. The new helper was not run against a live hosted Supabase project. Nothing was pushed, deployed, reset, or migrated in production.

Maintenance evidence retains the pre-existing public-read request-photos format. This is NOT the private registration-ids bucket. The localhost helper requires separate acknowledgment before creating a public-read evidence bucket and refuses to change any existing bucket privacy or policy. Never upload actual ID photos to request-photos. Uploaded evidence is not silently dropped to allow a request to succeed; failed cleanup during a Storage outage requires administrator reconciliation.

## Main changed files
- src/components/admin/UsersTable.tsx
- src/app/api/user/requests/route.ts
- src/lib/requests/photo-storage.ts
- src/lib/requests/submission-errors.ts
- scripts/setup-local-request-storage.ts
- tests/evidence-storage-stub.ts
- tests/workflow.spec.ts
- tests/verification.spec.ts
- tests/request-submission.test.ts
- package.json (test command only; no dependency changes)
- README.md
- USER_TABLE_REQUEST_SUBMISSION_UPDATE.md
- this report

Packaging verifies ZIP CRC readability, equality of included source bytes and exclusion of real .env files, uploaded photos, credentials, dependencies, build caches and Git history. Full project includes .env.example, the prior features and all six existing migrations. Patch is for the immediately preceding relay/private-storage update.

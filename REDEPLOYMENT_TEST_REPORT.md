# Redeployment preparation — actual checks and remaining gates

## Verified locally
- Clean lockfile installation: `npm ci` passed, including Prisma client generation.
- Unit tests: **45 passed**, 0 failed/skipped. Includes production-config shape checks, missing/local/dummy/public-secret rejection, bounded JSON body and patched mailer JSON composition (no SMTP network delivery).
- **31 request/worker browser/API scenarios passed against `next start` using the optimized production build**. Covers authentication, authorization, automatic transactional approval/forwarding, rollback/concurrent decisions, head Dashboard/My Tasks, no manual assignment box, worker availability/history, legacy records, photos and size limits.
- Account access + registration: **15 passed** against local dev server, including the real provider's documented public Turnstile test widget, invalid/missing CAPTCHA/ID, cleanup, pending accounts and ID picker behavior.
- Admin verification: **9 passed** against local dev server, including private ID access, approval/rejection, stale sessions/roles, concurrency, layout and error states.
- Total distinct browser/API scenarios across these batches: **55 passed**. Only the 31 request/worker scenarios are claimed as production-build runtime tests. Production registration with real widget keys remains a staging gate.
- Migration-preservation test: **passed** on a newly created isolated localhost PostgreSQL database. All original columns/rows across the eight original models were unchanged after all seven migrations. New RLS was verified on original tables; an unprivileged synthetic reader with SELECT privilege could not see User rows. No production database was contacted.
- Prisma schema validation: passed.
- Optimized Next.js build and TypeScript: passed after fixing the new config test fixture's ProcessEnv type.
- Dependency security audit after upgrades: **0 reported vulnerabilities**, down from 23 (including 2 critical). This is the registry audit result at preparation time, not a penetration test or guarantee against future advisories.
- Production-config CLI correctly rejected the intentionally local/test environment (expected nonzero exit). It was not run with live production credentials and cannot certify hosted services.
- Full ESLint: **not clean — 58 errors, 49 warnings** remain. No extra error groups compared with the preceding release's 58 errors/48 warnings. The upgraded Next ESLint configuration adds one warning for an existing profile relative-location navigation. Broad unrelated lint remediation was not undertaken.

## Failures encountered, not hidden
The initial combined security update was rejected by npm because NextAuth 4's optional Nodemailer peer requested major 7. No force/legacy-peer-deps workaround was used. An explicit scoped package override selects patched Nodemailer 10; subsequent clean npm ci, credentials-login/registration tests, build and mail composition passed. Actual external SMTP delivery was NOT tested.

An earlier dev-server workflow attempt passed 29 cases, then hit ECONNRESET on a read during the worker UI test; the final case did not run. Another fresh dev attempt encountered navigation-context destruction in its first form assertion. The full workflow suite was subsequently run successfully against the optimized production server (31/31), and separate dev registration/verification batches passed. These earlier dev-run interruptions were not counted as clean passes or silently retried through assertion changes. The source was not modified to bypass permissions or suppress workflow failures.

The first build failed because the newly added unit fixture omitted Next's required NODE_ENV in a ProcessEnv type. The checker/fixture now accept partial environment records; subsequent type/build checks passed.

## Changes and scope
- Patched Next.js/eslint-config-next 16.4.3; NextAuth 4.24.15; Prisma/client/adapter-pg aligned to 7.10.1; Sharp 0.35.5; Nodemailer 10.2.1 plus compatible audited transitive updates. React remains 19.2.4.
- Node 24.x engine/.nvmrc, reproducible lockfile and offline `npm run release:check`.
- Evidence encoding retains 3 original files up to 5 MiB each, with adaptive JPEG resize/compression to <=1 MiB encoded text each; bounded 4 MiB JSON client/server. Tested with three deterministic noisy PNG originals larger than 3 MiB each; submission succeeded below the hosted payload budget. A forged oversized direct call returned 413 without creating a request.
- Removed Prisma initialization debug logging.
- New migration `20261024000000_server_only_tables`: RLS for eight original tables; removes anon/authenticated grants on application tables where those roles exist. No records, photos, accounts or migration history deleted. No columns removed and no account roles promoted.
- Local production-mode Playwright option is guarded by the existing localhost/test-database checks; no production test bypass is added to application code.

Main files: package.json/package-lock.json/.nvmrc; scripts/check-production-config.ts; src/lib/requests/body-limit.ts; src/app/api/user/requests/route.ts; src/components/user/PhotoEvidenceUpload.tsx; src/components/user/OfficialRequestForm.tsx; src/lib/prisma.ts; the new SQL migration; tests/deployment-unit.test.ts, tests/workflow.spec.ts, tests/migration-preservation.ts; playwright.config.ts; .env.example; README and release guides.

## Not verified / release gates
The existing live migration history (including the earlier failed baseline), real production credentials/domains/CAPTCHA, hosted storage grants/policies, external SMTP, current hosted users/head status, Vercel build settings and real production rollback have NOT been inspected or tested. Staging rehearsal, backup/restore, migration reconciliation, storage privacy and live smoke tests are required before promoting. Baseline reconciliation cannot be automated safely from an unknown hosted schema.

The legacy technician avatar upload route is unchanged: it can accept a 5 MiB image as base64 and therefore exceed a hosted function limit. Keep avatar uploads below 2 MiB and test this existing feature in staging; if larger avatars are required, revise that flow before release. Evidence uploads and registration ID uploads have the separate tested bounds documented above. Do not treat the package as a guarantee every unrelated feature is defect-free.

No GitHub push, Vercel deployment, production migration, production storage change, database reset or live-data test was performed. The archives exclude real .env files, uploads, database contents, caches, dependencies and Git history, and are checked for readability/CRC/source correspondence before handoff.

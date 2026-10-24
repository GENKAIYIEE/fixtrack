# Task Assignment: automatic forwarding, read-only overview

## What changed
- Removed the Unassigned Approved Requests box, technician selection card, relay confirmation and separate relay controls from Admin > Task Assignment.
- The page now displays approved requests with official form details, evidence, receiving account, progress, recorded workers and a request/history link. Refresh and pagination remain available.
- Admin approval automatically forwards a new pending request to the configured ACTIVE technician head. Approval, assignment, history, audit and notifications commit together in one database transaction; forwarding failure leaves the request pending.
- The head dashboard and My Tasks show saved assignments. An already-open dashboard polls every 15 seconds; reload to retrieve an assignment immediately.
- Only the technician head selects directory workers. Workers have no login accounts, and outside contact/work is not automatically tracked.

## Older records
Previously approved, unassigned records are not silently backfilled. Open their request details and use **Forward previously approved request**. This preserves the original approval metadata and records the assignment without approving again. Already assigned records and historical assignments remain untouched.

## Install locally
1. Stop Next.js with Ctrl+C and back up your project.
2. Merge the patch ZIP into your current FixTrack project (relative paths start at the project root), or extract the full project ZIP into a separate folder.
3. Preserve your existing `.env` and local Supabase configuration; no secrets are supplied in either archive.
4. Keep local Supabase/database running. For a fresh extracted project run `npm ci`; for the matching previous version this patch changes no dependencies.
5. Run `npm run dev` and open http://localhost:3000.

No new migration, environment variable, package or schema change is introduced. Existing earlier migrations are still required. Do not apply the baseline migration blindly to an already-populated hosted database. This update does not repair missing older migrations, stopped local services or incorrect credentials.

The configured head (`TECHNICIAN_HEAD_EMAIL`, existing default `tech@gmail.com`) must already exist as an ACTIVE TECHNICIAN. No account is created or promoted by approval.

## Manual check
1. Submit as an approved requester.
2. Admin > Maintenance Requests > open request > Approve & forward to technician head.
3. Confirm the receiving head appears; do not perform a separate relay step.
4. Sign into the configured head account and refresh Dashboard or My Tasks.
5. Admin > Task Assignment shows request/progress/worker details without an unassigned queue.

## Main files
- `src/app/admin/assignments/page.tsx`: simplified read-only page.
- `src/components/admin/ApprovedTaskAssignments.tsx`: overview and legacy guidance.
- `src/components/admin/RequestInfoCard.tsx`: one-step approval and record-specific legacy forwarding.
- `src/app/admin/requests/page.tsx` and `src/app/admin/requests/[id]/page.tsx`: legacy links open the request details, not a removed queue.
- `tests/workflow.spec.ts`: queue absence, readonly requests, mobile layout, automatic forwarding and legacy compatibility checks.
- `README.md`, this guide and test report; cumulative patch also includes the preceding automatic-approval backend/UI files listed in `AUTOMATIC_APPROVAL_FORWARDING_UPDATE.md`.

No GitHub push, Vercel deployment, production database migration or reset was performed.

# Dashboard and multi-worker coordination update

## What changed

- Removed the admin dashboard Priority Queue panel and its database query. The existing live requests and seven-day chart remain and use the full content width. Request priorities themselves are not deleted or changed.
- Reordered All Maintenance Requests to match the revised form: date, requesting party, work location, description, requested priority, photo evidence, followed by status, receiving technician head and actions. The request ID/selection controls remain at the start. The admin-assessed priority is separately labelled; historical form fields are not fabricated. The table scrolls inside its container on small screens.
- Task Assignment retains the working approved-request-to-head relay controls. The admin can select ONLY the single designated active technician-head account, never individual workers. A new paginated, auto-refreshing approved-task section shows the submitted form, evidence, receiving account and the worker details recorded by the head. Pending/rejected/cancelled requests do not enter that section. Completed records remain visible for reference.
- Added a Workers sidebar link and head-only directory: name, contact number, specialization and manual availability. These are `MaintenanceWorker` directory records, not `User` accounts: no email/password, sessions, registration, CAPTCHA, worker roles or worker login pages are created.
- Added multiple-worker selection on the head's relayed ongoing/on-hold task details. The head can add/remove multiple available workers and continue using the existing repair notes, hold/resume and completion controls. Selecting a worker does not call them, notify them outside the system, verify work, or change the task's account-level assignee.
- Admins see recorded worker contact/specialization information in Task Assignment and request details. They cannot create/manage the directory or choose task workers through the technician APIs. Ordinary users do not receive the worker directory/contact records.

## Availability and history rules

A directory worker is Busy while linked by a current selection to an ONGOING or ON_HOLD task. A worker cannot be newly selected for a second active task. Completing a task automatically removes its contribution to the Busy calculation without deleting the selection history. Removing a worker releases that selection and retains its historical record. Manually Unavailable/archived workers do not become available just because a task ends. Marking a busy worker manually Available does not override their active allocation.

The picker accepts up to 100 distinct worker records per task and supports search/pagination. Archived workers are hidden from new selection; the head may include archived records in the directory and restore them. Workers on active tasks cannot be archived until removed. No routine worker deletion endpoint is provided.

Selections store the name/contact/specialization as recorded at assignment time, with actor, timestamp and optional removal timestamp. Later directory edits do not rewrite those snapshots. Existing audit logs record directory changes and selection changes. The existing permanent request-delete feature still deletes that request and its associated worker-link rows; worker directory entries are not deleted. Normal completion, removal and archiving preserve history.

Availability is operational coordination data maintained by the head, not proof of external contact, attendance, worker activity or real-time physical availability.

## Security and concurrency

The migration enables row-level security on both new tables with no public client policies, keeping contacts inaccessible through anonymous/authenticated Supabase REST. Prisma must use the existing trusted server-side database connection, not an anonymous/client database role. Do not add broad read/write policies for these tables.

All new APIs require a current ACTIVE session and recheck the designated head server-side. Mutations recheck inside serializable transactions. Worker row updates serialize competing allocations and availability/archive edits; optimistic task/worker timestamps reject stale changes. A concurrent conflict returns 409 with refresh/retry guidance, not a second allocation. The database also prevents duplicate current worker/request pairs. Input bounds and JSON body limits apply server-side.

## Safe local setup

1. Back up your current project. Stop Next.js with Ctrl+C.
2. For the patch, extract into a temporary folder and merge its `src`, `prisma`, and `tests` folders plus matching project files into the existing cumulative FixTrack project. Replace matching source files, not entire folders. Keep prior migrations, your local Supabase config and .env. The full project ZIP is an alternative, not an additional patch.
3. Keep Docker/local Supabase running. Use the SAME PowerShell terminal that contains your local database, local Supabase service/anon keys, NextAuth secret and Turnstile test variables. Closing that terminal loses temporary overrides and may reload cloud .env values.
4. Run `npx prisma migrate status`. Confirm the datasource is the LOCAL database (normally 127.0.0.1:54322) and DATABASE_URL points to the same database as DIRECT_URL. Do not continue against hosted/production Supabase.
5. After confirming the local target, run:

```powershell
npx prisma migrate deploy
npx prisma generate
npm run dev
```

6. Sign in as your existing local admin, approve a test maintenance request and relay it to the existing local technician head (default configured email tech@gmail.com).
7. Sign in as the head, open Workers, add worker directory records, then open My Tasks -> task -> Choose workers. Select multiple available workers and save. The admin can refresh Task Assignment to see their recorded details.

No new environment variables, packages, account promotions, worker accounts or production migration are required. The existing TECHNICIAN_HEAD_EMAIL configuration still identifies the single head. Do not rerun admin/technician bootstraps to reset passwords or change existing roles. If migration history reports a failed baseline, stop and reconcile it safely rather than resetting the database.

## Migration

`20261023000000_worker_directory` adds only the MaintenanceWorker and TaskWorkerAssignment tables, indexes and foreign keys. It does not rename/drop existing columns, clear records, migrate workers into users, or change existing roles/statuses/assignments. All previous migrations remain included. Apply only to your development database during local testing.

See WORKER_WORKFLOW_TEST_REPORT.md for actual results, environment details and limitations. Do not interpret a successful local build as a deployment guarantee.

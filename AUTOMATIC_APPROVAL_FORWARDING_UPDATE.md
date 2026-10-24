# Automatic request approval and forwarding

## Current workflow
1. A requester submits the official form and chooses High, Medium or Low priority.
2. An ACTIVE administrator reviews the request and selects **Approve & forward to technician head** (or rejects it).
3. Approval and forwarding happen in ONE Serializable database transaction: review metadata, APPROVED history/audit, assignment to the configured ACTIVE technician head, ONGOING history/audit, and head/requester notifications all commit together.
4. The head sees the new active task in My Tasks and the dashboard's **Recently Forwarded Active Tasks**, with the existing request details and photo evidence. An already-open dashboard polls every 15 seconds; reloading retrieves the saved assignment immediately. No WebSocket or instantaneous push is claimed.
5. The head still records workers from the existing worker directory and coordinates with them outside FixTrack. No worker login accounts or automatic tracking of physical work were added.

The existing lifecycle is preserved: PENDING -> APPROVED -> ONGOING, then supported hold/resume/completion actions. APPROVED is an intermediate history event during automatic forwarding; ONGOING means the request is with the head in this system, not proof that an outside worker has begun work.

## Removed controls
- Admin-assessed Priority on the requester detail page and the extra admin-priority line in All Maintenance Requests.
- Admin Triage Options, editable priority controls, Priority Management, triage notes input and terminal Final Priority badge in the admin review card.
- Dashboard label Pending Triage is now Pending Review; the detail heading is Review Request.
- Admin priority-update API actions now reject direct calls. Approval accepts only `action: "approve"`; forged priority, admin notes, status, assignee and other override fields are rejected.
- Requester-selected priority remains visible. Admin request filtering now uses official High/Medium/Low requested priority.

## Data compatibility
No database fields, records, audit/history events, old notes or roles were deleted. Existing `priorityLevel` is retained for compatibility with older lists/reports; new requests and newly approved official requests mirror HIGH -> HIGH, MEDIUM -> NORMAL, LOW -> LOW. It is no longer an independently editable admin assessment. Existing historical records are not mass-rewritten; legacy requests without official requested priority preserve their existing compatibility value.

Old already-APPROVED/unassigned records are not silently changed during installation. The existing legacy relay service remains available for those records. Task Assignment no longer displays an unassigned queue or manual relay controls; open an older approved request's details and use Forward previously approved request. New approvals do not need a separate relay click. Existing assignments to other accounts and their history remain intact.

## Safety and failure behavior
- Only live ACTIVE ADMIN users can approve; identity/status is checked again inside the transaction.
- Only the configured ACTIVE TECHNICIAN account (`TECHNICIAN_HEAD_EMAIL`, existing default tech@gmail.com) receives new tasks.
- Missing, inactive or wrong-role heads return a clear conflict and leave the request PENDING, with no partial approval or assignment. No account is automatically promoted or created.
- Repeated/concurrent approval produces one assignment/decision/notification, not duplicates. Rejection uses a guarded transaction too, so a competing approve/reject cannot overwrite the winning decision.
- A downstream forwarding failure rolls back review status, history, assignment, notifications and audit together.

## Install locally
Stop Next.js with Ctrl+C, back up the project, then merge the patch into the immediately preceding user-table/request-submission release. Keep `.env`, local environment overrides and Supabase configuration. No new dependencies, environment variables, schema changes or migrations are introduced by this update.

```powershell
npm run dev
```

Keep the local database and Supabase running. Use the existing ACTIVE admin and ACTIVE configured technician head; do not register or promote a new admin/head through public registration. Existing local setup, CAPTCHA and both separate storage bucket instructions still apply. This update does not fix a stopped database, missing older migrations or incorrect credentials on the user's Windows machine.

## Test the flow
- Submit a request as an approved requester.
- Open it under Admin > Maintenance Requests; only requested priority is shown, without triage controls.
- Approve once; the page identifies the receiving head. Do not open Task Assignment for a new approval.
- Open/refresh the technician-head dashboard or My Tasks and confirm the request is present, then use the existing worker selection/progress actions.
- To review a historical approved/unassigned record, open its request details (also linked from Task Assignment) and use Forward previously approved request. Nothing is automatically backfilled.

See `AUTOMATIC_APPROVAL_FORWARDING_TEST_REPORT.md` for actual checks and limitations. No GitHub push, deployment, production migration or database reset was performed.

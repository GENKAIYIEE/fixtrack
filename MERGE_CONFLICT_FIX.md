# FixTrack: three resolved merge conflicts

This patch contains only the three conflicted source files, with their existing paths.

## Resolution decisions
- Request API: retain the official-form fields, locked server identity/date, current approval checks, requested-priority mapping, bounded JSON, photo validation/rollback and transactional history/admin notifications/audit. Do not restore the incoming older issueType/building/roomNumber submission contract: its variables are no longer defined in the revised route.
- RequestInfoCard: retain Approve & forward, pending-only review, old approved-record forwarding, official details and evidence. Do not restore admin triage/priority controls removed by the panel revisions.
- UsersTable: repair the partially merged JSX. Retain a role badge (including STUDENT), centered department below it, removed ID Number column, rejected status and pending/rejected action restrictions.
- Content outside the conflict hunks was retained except restoring the STUDENT badge required by the centered role/department design. The resulting three files match the prior tested redeployment release.

## Local checks actually run
- 45 unit tests passed (0 failed/skipped).
- Full Next.js optimized build passed in the retained local project.
- TypeScript check passed.
- ESLint on these three files: 0 errors, 1 existing Next img-element warning in UsersTable.
- No remaining Git conflict markers in these files. ZIP CRC and included source bytes verified.

Only these three uploaded files were available from your current merge. The other automatically merged files, current Windows working tree and hosted services were NOT tested. Build your actual merged project before committing/pushing.

## Install and finish the existing merge
1. Extract this ZIP outside the project. Copy its src folder into your existing fixtrack root; replace the three matching files. Do not replace .env or the rest of your project. Do not run another pull/merge or accept whole-side changes in VS Code afterward.
2. In the project terminal:

```powershell
git add -- "src/app/api/user/requests/route.ts" "src/components/admin/RequestInfoCard.tsx" "src/components/admin/UsersTable.tsx"
git diff --name-only --diff-filter=U
```

The second command must print nothing. If a filename remains, stop and resolve that file too.

3. Run npm ci, then npm run build and npm run typecheck. Stop at any error. No new migration is needed for this patch; do not reapply or edit already applied migration SQL.
4. Inspect git diff --cached --name-only for secrets or uploaded IDs. Do not rerun git add . because recovery/scratch changes were deliberately left unstaged.
5. If all checks pass, run git commit --no-edit to complete the current merge, then git push origin main. Never force-push. If another commit arrived remotely or any command fails, stop and inspect the error.
6. Check the Vercel deployment and live workflows separately. This patch does not deploy, set production variables, fix storage or change your database.

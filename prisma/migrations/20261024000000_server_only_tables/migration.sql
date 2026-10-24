-- FixTrack reads/writes these tables through authorized server-side Prisma only.
-- Enable RLS and remove browser-role grants; no rows, accounts, policies or roles are deleted.
-- The server DATABASE_URL must use the trusted table owner/BYPASSRLS role, not anon/authenticated.
BEGIN;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MaintenanceRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RequestAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RequestStatusHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RepairNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemSettings" ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE browser_role TEXT;
BEGIN
  FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role) THEN
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public."User", public."MaintenanceRequest", public."RequestAssignment", public."RequestStatusHistory", public."RepairNote", public."Notification", public."AuditLog", public."SystemSettings", public."MaintenanceWorker", public."TaskWorkerAssignment" FROM %I', browser_role);
    END IF;
  END LOOP;
END $$;
COMMIT;

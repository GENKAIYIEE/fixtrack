-- Additive only: no existing requests, users or workers are changed.
BEGIN;
CREATE TABLE "RequestRating" (
 "id" TEXT NOT NULL, "requestId" TEXT NOT NULL, "ratedById" TEXT NOT NULL,
 "score" INTEGER NOT NULL CHECK ("score" BETWEEN 1 AND 5),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "RequestRating_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "RequestRating_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "RequestRating_ratedById_fkey" FOREIGN KEY ("ratedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RequestRating_requestId_key" ON "RequestRating"("requestId");
CREATE INDEX "RequestRating_ratedById_idx" ON "RequestRating"("ratedById");
CREATE TABLE "WorkerRating" (
 "id" TEXT NOT NULL, "requestId" TEXT NOT NULL, "workerId" TEXT NOT NULL, "ratedById" TEXT NOT NULL,
 "score" INTEGER NOT NULL CHECK ("score" BETWEEN 1 AND 5),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WorkerRating_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "WorkerRating_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "WorkerRating_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "MaintenanceWorker"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "WorkerRating_ratedById_fkey" FOREIGN KEY ("ratedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WorkerRating_requestId_workerId_key" ON "WorkerRating"("requestId", "workerId");
CREATE INDEX "WorkerRating_workerId_idx" ON "WorkerRating"("workerId");
CREATE INDEX "WorkerRating_ratedById_idx" ON "WorkerRating"("ratedById");
ALTER TABLE "RequestRating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkerRating" ENABLE ROW LEVEL SECURITY;
-- No browser/anon/authenticated policies. Only the authorized server database role may use these tables.
REVOKE ALL ON "RequestRating", "WorkerRating" FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON "RequestRating", "WorkerRating" FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON "RequestRating", "WorkerRating" FROM authenticated; END IF;
END $$;

COMMIT;

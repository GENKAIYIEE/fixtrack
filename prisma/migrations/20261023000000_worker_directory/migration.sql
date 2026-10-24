-- Add directory records, not worker accounts. Existing users/requests are unchanged.
BEGIN;
CREATE TABLE "MaintenanceWorker" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "contactNumber" TEXT NOT NULL,
  "specialization" "Specialization" NOT NULL DEFAULT 'GENERAL',
  "isAvailable" BOOLEAN NOT NULL DEFAULT true, "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceWorker_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TaskWorkerAssignment" (
  "id" TEXT NOT NULL, "requestId" TEXT NOT NULL, "workerId" TEXT NOT NULL, "recordedById" TEXT NOT NULL,
  "workerName" TEXT NOT NULL, "contactNumber" TEXT NOT NULL, "specialization" "Specialization" NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "releasedAt" TIMESTAMP(3),
  CONSTRAINT "TaskWorkerAssignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MaintenanceWorker_isArchived_name_idx" ON "MaintenanceWorker"("isArchived", "name");
CREATE INDEX "TaskWorkerAssignment_requestId_releasedAt_idx" ON "TaskWorkerAssignment"("requestId", "releasedAt");
CREATE INDEX "TaskWorkerAssignment_workerId_releasedAt_idx" ON "TaskWorkerAssignment"("workerId", "releasedAt");
CREATE UNIQUE INDEX "TaskWorkerAssignment_current_pair_key" ON "TaskWorkerAssignment"("requestId", "workerId") WHERE "releasedAt" IS NULL;
ALTER TABLE "MaintenanceWorker" ADD CONSTRAINT "MaintenanceWorker_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskWorkerAssignment" ADD CONSTRAINT "TaskWorkerAssignment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskWorkerAssignment" ADD CONSTRAINT "TaskWorkerAssignment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "MaintenanceWorker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskWorkerAssignment" ADD CONSTRAINT "TaskWorkerAssignment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- No anonymous/authenticated REST access to private worker contact records.
-- Server-side Prisma uses the trusted owner/service database connection.
ALTER TABLE "MaintenanceWorker" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskWorkerAssignment" ENABLE ROW LEVEL SECURITY;
COMMIT;

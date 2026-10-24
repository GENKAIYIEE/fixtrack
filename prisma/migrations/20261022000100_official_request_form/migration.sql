-- CreateEnum
CREATE TYPE "RequestedPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "MaintenanceRequest" ADD COLUMN     "requestDate" DATE,
ADD COLUMN     "requestedPriority" "RequestedPriority",
ADD COLUMN     "requestingParty" TEXT,
ADD COLUMN     "workLocation" TEXT,
ALTER COLUMN "issueType" DROP NOT NULL,
ALTER COLUMN "building" DROP NOT NULL,
ALTER COLUMN "roomNumber" DROP NOT NULL;


-- Additive only: existing status values, users, roles and ID objects remain unchanged.
ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TABLE "User" ADD COLUMN "verificationRejectionReason" TEXT;

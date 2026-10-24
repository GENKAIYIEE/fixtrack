-- Nullable private-storage object path only; existing accounts and records stay unchanged.
ALTER TABLE "User" ADD COLUMN "registrationIdPath" TEXT;

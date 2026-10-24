-- Preserve all existing ID numbers and the unique index.
-- New public registrations do not collect an institutional ID number.
ALTER TABLE "User" ALTER COLUMN "idNumber" DROP NOT NULL;

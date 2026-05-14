UPDATE "User" SET role = 'TECHNICIAN', specialization = 'GENERAL' WHERE id = (SELECT id FROM "User" ORDER BY "createdAt" DESC LIMIT 1);

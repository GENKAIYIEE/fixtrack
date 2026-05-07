import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
  datasource: {
    // Prisma CLI (Migrations/Introspection) requires the direct connection URL
    url: process.env["DIRECT_URL"],
  },
});

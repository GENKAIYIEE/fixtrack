import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Prisma CLI (Migrations/Introspection) requires the direct connection URL
    url: process.env["DIRECT_URL"],
  },
});

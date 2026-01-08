// Prisma 7 configuration for Supabase (Pooler)
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Session pooler on port 5432 for migrations
    url: process.env["DIRECT_URL"],
  },
});

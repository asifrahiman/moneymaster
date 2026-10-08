import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { migrationDatabaseUrl, requireDatabaseUrl } from "./src/db/url";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Direct (non-pooled) connection for migrations when available.
  dbCredentials: { url: requireDatabaseUrl(migrationDatabaseUrl(), "migrations") },
  strict: true,
});

import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { appDatabaseUrl } from "./url";

const globalForDb = globalThis as unknown as { pool?: Pool };

function createPool() {
  // The pool connects lazily, so a missing DATABASE_URL only fails at query time
  // (not during `next build`).
  return new Pool({ connectionString: appDatabaseUrl(), max: 5 });
}

// Reuse one pool across hot reloads in development.
const pool = globalForDb.pool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export { schema };

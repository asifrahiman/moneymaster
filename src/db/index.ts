import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { appDatabaseUrl } from "./url";

const globalForDb = globalThis as unknown as { pool?: Pool };

function createPool() {
  // The pool connects lazily, so a missing DATABASE_URL only fails at query time
  // (not during `next build`).
  const pool = new Pool({
    connectionString: appDatabaseUrl(),
    max: 5,
    // pg's default closes idle connections after 10 s, so a save after a short
    // pause paid for a fresh TCP + TLS + auth handshake (several round trips).
    // Keep them warm for a few minutes instead.
    idleTimeoutMillis: 5 * 60_000,
  });
  // An idle connection can be dropped by the server (e.g. when Neon suspends);
  // the pool discards it and opens a new one. Log it rather than crash.
  pool.on("error", (e) => console.warn("Postgres idle connection closed:", e.message));
  return pool;
}

// Reuse one pool across hot reloads in development.
const pool = globalForDb.pool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export { schema };

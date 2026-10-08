/**
 * Finds the Postgres connection string in the environment.
 *
 * Accepts the plain names (DATABASE_URL, POSTGRES_URL, …) and the prefixed
 * names the Vercel/Neon integration creates when a custom prefix is set
 * (e.g. STORAGE_DATABASE_URL).
 */
type Env = Record<string, string | undefined>;

const POOLED = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL"];
const DIRECT = ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];

function find(env: Env, names: string[]): string | undefined {
  for (const name of names) if (env[name]) return env[name];
  // Prefixed variants, e.g. STORAGE_DATABASE_URL.
  for (const name of names) {
    const key = Object.keys(env).find((k) => k.endsWith(`_${name}`) && env[k]);
    if (key) return env[key];
  }
  return undefined;
}

/** Pooled URL for the running app (falls back to the direct one). */
export function appDatabaseUrl(env: Env = process.env): string | undefined {
  return find(env, POOLED) ?? find(env, DIRECT);
}

/** Direct (non-pooled) URL for migrations and scripts (falls back to the pooled one). */
export function migrationDatabaseUrl(env: Env = process.env): string | undefined {
  return find(env, DIRECT) ?? find(env, POOLED);
}

export function requireDatabaseUrl(url: string | undefined, purpose: string): string {
  if (url) return url;
  const seen = Object.keys(process.env).filter((k) => /DATABASE|POSTGRES|^PG/.test(k));
  throw new Error(
    `No Postgres connection string found for ${purpose}.\n` +
      `Set DATABASE_URL (and optionally DATABASE_URL_UNPOOLED).\n` +
      `On Vercel: Settings → Environment Variables – make sure they are enabled for this environment ` +
      `(Production / Preview), then redeploy.\n` +
      `Database-related variables visible right now: ${seen.length ? seen.join(", ") : "none"}`,
  );
}

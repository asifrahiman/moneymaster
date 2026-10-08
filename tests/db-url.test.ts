import { describe, expect, it } from "vitest";
import { appDatabaseUrl, migrationDatabaseUrl } from "@/db/url";

describe("database url resolution", () => {
  it("prefers pooled for the app and direct for migrations", () => {
    const env = { DATABASE_URL: "pooled", DATABASE_URL_UNPOOLED: "direct" };
    expect(appDatabaseUrl(env)).toBe("pooled");
    expect(migrationDatabaseUrl(env)).toBe("direct");
  });
  it("accepts Vercel Postgres names and custom prefixes", () => {
    expect(migrationDatabaseUrl({ POSTGRES_URL_NON_POOLING: "a" })).toBe("a");
    expect(appDatabaseUrl({ STORAGE_DATABASE_URL: "b" })).toBe("b");
    expect(migrationDatabaseUrl({ STORAGE_DATABASE_URL: "b", STORAGE_DATABASE_URL_UNPOOLED: "c" })).toBe("c");
  });
  it("returns undefined when nothing is set", () => {
    expect(appDatabaseUrl({})).toBeUndefined();
  });
});

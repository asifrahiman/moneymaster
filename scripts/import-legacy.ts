/**
 * Imports data from the legacy PHP/MySQL MoneyMaster app.
 *
 * Legacy schema (moneymaster DB):
 *   users(user)                       – display names, no passwords
 *   type(type)                        – global list of expense types
 *   expenses(id, user, type, amount, date, isCredit)
 *
 * Source (pick one):
 *   --csv <file>      CSV export of the `expenses` table (phpMyAdmin → Export → CSV,
 *                     tick "Put columns names in the first row").
 *   --mysql <url>     Read directly, e.g. mysql://root:@127.0.0.1/moneymaster
 *                     (shared hosts like InfinityFree block remote MySQL – use --csv there).
 *
 * Legacy users had no email, so map each name to the Google account that will own it:
 *   --map "Asif=asif@example.com,Sara=sara@example.com"
 *   --map-file map.json        ({ "Asif": "asif@example.com" })
 *
 * Other flags:
 *   --income-types Credit      legacy types to import as Income (default: Credit)
 *   --savings-types Savings    legacy types to import as Savings (default: Savings)
 *   --dry-run                  parse and report, write nothing
 *
 * Safe to re-run: rows are keyed by (user, legacy id) and skipped if already imported.
 *
 *   npm run import:legacy -- --csv expenses.csv --map "Asif=asif@gmail.com" --dry-run
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { parse } from "csv-parse/sync";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { migrationDatabaseUrl, requireDatabaseUrl } from "../src/db/url";
import { categories, transactions, users, type CategoryKind } from "../src/db/schema";
import { isIsoDate } from "../src/lib/dates";
import { nextSlot } from "../src/lib/palette";

type LegacyRow = { id: number; user: string; type: string; amount: string; date: string; isCredit: string };

const { values: args } = parseArgs({
  options: {
    csv: { type: "string" },
    mysql: { type: "string" },
    map: { type: "string" },
    "map-file": { type: "string" },
    "income-types": { type: "string", default: "Credit" },
    "savings-types": { type: "string", default: "Savings" },
    "dry-run": { type: "boolean", default: false },
  },
});

function fatal(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

/* ---------- read source ---------- */

async function readRows(): Promise<LegacyRow[]> {
  if (args.csv) {
    const records = parse(readFileSync(args.csv), {
      columns: (header: string[]) => header.map((h) => h.trim().replace(/^"|"$/g, "")),
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as Record<string, string>[];
    const required = ["id", "user", "type", "amount", "date"];
    const missing = required.filter((c) => !(c in (records[0] ?? {})));
    if (records.length && missing.length)
      fatal(`CSV is missing columns: ${missing.join(", ")}. Export with "Put columns names in the first row".`);
    return records.map((r) => ({
      id: Number(r.id),
      user: r.user,
      type: r.type,
      amount: r.amount,
      date: r.date,
      isCredit: r.isCredit ?? "0",
    }));
  }
  if (args.mysql) {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.createConnection(args.mysql);
    try {
      const [rows] = await conn.query(
        "SELECT id, `user`, `type`, CAST(amount AS CHAR) AS amount, CAST(`date` AS CHAR) AS `date`, CAST(isCredit AS CHAR) AS isCredit FROM expenses ORDER BY id",
      );
      return rows as LegacyRow[];
    } finally {
      await conn.end();
    }
  }
  fatal("Provide --csv <file> or --mysql <url>");
}

function readMap(): Map<string, string> {
  const map = new Map<string, string>();
  if (args["map-file"]) {
    const json = JSON.parse(readFileSync(args["map-file"], "utf8")) as Record<string, string>;
    for (const [k, v] of Object.entries(json)) map.set(k.trim(), v.trim().toLowerCase());
  }
  if (args.map) {
    for (const pair of args.map.split(",")) {
      const [name, email] = pair.split("=").map((s) => s?.trim());
      if (!name || !email) fatal(`Bad --map entry "${pair}". Use Name=email`);
      map.set(name, email.toLowerCase());
    }
  }
  for (const email of map.values()) if (!/^\S+@\S+\.\S+$/.test(email)) fatal(`"${email}" is not an email address`);
  return map;
}

/* ---------- normalise ---------- */

const list = (s: string) => new Set(s.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean));
const incomeTypes = list(args["income-types"]!);
const savingsTypes = list(args["savings-types"]!);

function kindFor(type: string): CategoryKind {
  const t = type.toLowerCase();
  if (incomeTypes.has(t)) return "income";
  if (savingsTypes.has(t)) return "savings";
  return "expense";
}

/** The legacy "Credit" type means income; give it a clearer name. */
function categoryNameFor(type: string): string {
  const name = type.trim().replace(/\s+/g, " ").slice(0, 40);
  return incomeTypes.has(name.toLowerCase()) && name.toLowerCase() === "credit" ? "Income" : name;
}

function parseLegacyDate(raw: string): string | null {
  const s = raw.trim().slice(0, 10);
  if (isIsoDate(s)) return s;
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(raw.trim());
  if (dmy) {
    const iso = `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
    if (isIsoDate(iso)) return iso;
  }
  return null;
}

function parseLegacyAmount(raw: string): string | null {
  const n = Number(String(raw).replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0 || n > 9_999_999_999.99) return null;
  return (Math.round(n * 100) / 100).toFixed(2);
}

/* ---------- main ---------- */

async function main() {
  const rows = await readRows();
  const map = readMap();
  console.log(`Read ${rows.length} legacy expense rows.`);

  const byUser = new Map<string, LegacyRow[]>();
  for (const r of rows) {
    const key = String(r.user ?? "").trim();
    byUser.set(key, [...(byUser.get(key) ?? []), r]);
  }

  const unmapped = [...byUser.keys()].filter((u) => !map.has(u));
  if (unmapped.length) {
    console.warn(`\n⚠ Skipping ${unmapped.length} legacy user(s) with no --map entry:`);
    for (const u of unmapped) console.warn(`   "${u}" (${byUser.get(u)!.length} rows)`);
  }

  const pool = new Pool({ connectionString: requireDatabaseUrl(migrationDatabaseUrl(), "the import") });
  const db = drizzle(pool, { schema });
  const dryRun = args["dry-run"];
  const summary: { user: string; email: string; inserted: number; existing: number; skipped: string[] }[] = [];

  try {
    for (const [legacyUser, email] of map) {
      const userRows = byUser.get(legacyUser) ?? [];
      const report = { user: legacyUser, email, inserted: 0, existing: 0, skipped: [] as string[] };
      summary.push(report);

      const valid: { row: LegacyRow; date: string; amount: string; category: string; kind: CategoryKind }[] = [];
      for (const row of userRows) {
        const date = parseLegacyDate(String(row.date));
        const amount = parseLegacyAmount(row.amount);
        const category = categoryNameFor(String(row.type ?? ""));
        if (!Number.isInteger(Number(row.id))) report.skipped.push(`row with no id (${row.type} ${row.amount})`);
        else if (!date) report.skipped.push(`#${row.id}: bad date "${row.date}"`);
        else if (!amount) report.skipped.push(`#${row.id}: bad amount "${row.amount}"`);
        else if (!category) report.skipped.push(`#${row.id}: empty type`);
        else valid.push({ row, date, amount, category, kind: kindFor(String(row.type)) });
      }
      if (dryRun) {
        report.inserted = valid.length;
        continue;
      }

      await db.transaction(async (tx) => {
        // Find or create the owner. On first Google sign-in with this email they get these rows.
        let user = await tx.query.users.findFirst({ where: eq(users.email, email) });
        if (!user) {
          [user] = await tx
            .insert(users)
            .values({ email, name: legacyUser, timezone: process.env.DEFAULT_TIMEZONE || "Asia/Kolkata" })
            .returning();
        }

        // Categories: reuse by case-insensitive name, create the rest.
        const existing = await tx.select().from(categories).where(eq(categories.userId, user.id));
        const catIds = new Map(existing.map((c) => [c.name.toLowerCase(), c.id]));
        const usedColors = existing.map((c) => c.color);
        const needed = new Map<string, { kind: CategoryKind; uses: number }>();
        for (const v of valid) {
          if (catIds.has(v.category.toLowerCase())) continue;
          const n = needed.get(v.category);
          needed.set(v.category, { kind: v.kind, uses: (n?.uses ?? 0) + 1 });
        }
        // Most-used expense categories first, so they get distinct colours.
        const order = [...needed].sort(
          ([, a], [, b]) => Number(a.kind !== "expense") - Number(b.kind !== "expense") || b.uses - a.uses,
        );
        for (const [name, { kind }] of order) {
          const color = nextSlot(usedColors);
          usedColors.push(color);
          const [c] = await tx.insert(categories).values({ userId: user.id, name, kind, color }).returning();
          catIds.set(name.toLowerCase(), c.id);
        }

        // Insert in batches; already-imported legacy ids are skipped.
        for (let i = 0; i < valid.length; i += 500) {
          const batch = valid.slice(i, i + 500);
          const inserted = await tx
            .insert(transactions)
            .values(
              batch.map((v) => ({
                userId: user.id,
                categoryId: catIds.get(v.category.toLowerCase())!,
                amount: v.amount,
                occurredOn: v.date,
                paidByCard: ["1", "true"].includes(String(v.row.isCredit).trim().toLowerCase()),
                legacyId: Number(v.row.id),
              })),
            )
            .onConflictDoNothing({ target: [transactions.userId, transactions.legacyId] })
            .returning({ id: transactions.id });
          report.inserted += inserted.length;
          report.existing += batch.length - inserted.length;
        }
      });

      const [{ n }] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(transactions)
        .innerJoin(users, eq(users.id, transactions.userId))
        .where(and(eq(users.email, email)));
      console.log(`  ${legacyUser} → ${email}: now ${n} transactions in total`);
    }
  } finally {
    await pool.end();
  }

  console.log(`\n${dryRun ? "DRY RUN – nothing written.\n" : ""}Summary:`);
  for (const s of summary) {
    console.log(
      `  ${s.user} → ${s.email}: ${dryRun ? "would import" : "imported"} ${s.inserted}` +
        (s.existing ? `, already present ${s.existing}` : "") +
        (s.skipped.length ? `, skipped ${s.skipped.length}` : ""),
    );
    for (const msg of s.skipped.slice(0, 20)) console.log(`     - ${msg}`);
    if (s.skipped.length > 20) console.log(`     … and ${s.skipped.length - 20} more`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

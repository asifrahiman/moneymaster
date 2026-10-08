/**
 * Imports data from the legacy PHP/MySQL MoneyMaster app.
 *
 * Legacy schema (moneymaster DB):
 *   users(user)                       – display names, no passwords
 *   type(type)                        – global list of expense types
 *   expenses(id, user, type, amount, date, isCredit)
 *
 * Source (pick one):
 *   --sql <file>      phpMyAdmin SQL export of the whole database (easiest; includes the `type` table).
 *   --csv <file>      CSV export of the `expenses` table (phpMyAdmin → Export → CSV,
 *                     tick "Put columns names in the first row").
 *   --mysql <url>     Read directly, e.g. mysql://root:@127.0.0.1/moneymaster
 *                     (shared hosts like InfinityFree block remote MySQL – use --sql there).
 *
 * Legacy users had no email, so map each name to the Google account that will own it:
 *   --map "Asif=asif@example.com,Sara=sara@example.com"
 *   --map-file map.json        ({ "Asif": "asif@example.com" })
 *
 * Categories:
 *   --categories saved         (default when the `type` table is available) your saved types become
 *                              categories; free-text "Others" labels go to one "Others" category and
 *                              the label is kept as the transaction note.
 *   --categories all           every distinct label becomes its own category.
 *   --others-name Others       name of the catch-all category (default: Others)
 *   --fix-typos                merge known misspellings/variants (Intrest→Interest, CarryForward→Carry forward …)
 *   --income-types Credit      legacy types to import as Income (default: Credit)
 *   --savings-types Savings    legacy types to import as Savings (default: Savings)
 *   --prune-unused             afterwards, delete this user's categories that have no transactions
 *                              (e.g. the starter set created on first sign-in)
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
import { and, eq, notInArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { migrationDatabaseUrl, requireDatabaseUrl } from "../src/db/url";
import { categories, transactions, users } from "../src/db/schema";
import { nextSlot } from "../src/lib/palette";
import {
  parseLegacyAmount,
  parseLegacyDate,
  planCategories,
  readSqlDump,
  type LegacyRow,
} from "./legacy-lib";

const { values: args } = parseArgs({
  options: {
    sql: { type: "string" },
    csv: { type: "string" },
    mysql: { type: "string" },
    map: { type: "string" },
    "map-file": { type: "string" },
    "income-types": { type: "string", default: "Credit" },
    "savings-types": { type: "string", default: "Savings" },
    categories: { type: "string" },
    "others-name": { type: "string", default: "Others" },
    "fix-typos": { type: "boolean", default: false },
    "prune-unused": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
});

function fatal(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

/* ---------- read source ---------- */

async function readSource(): Promise<{ rows: LegacyRow[]; savedTypes: string[] | null }> {
  if (args.sql) {
    // phpMyAdmin dumps of this DB are latin1; decoding as latin1 never fails.
    const { expenses, savedTypes } = readSqlDump(readFileSync(args.sql, "latin1"));
    return { rows: expenses, savedTypes };
  }
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
    const rows = records.map((r) => ({
      id: Number(r.id),
      user: r.user,
      type: r.type,
      amount: r.amount,
      date: r.date,
      isCredit: r.isCredit ?? "0",
    }));
    return { rows, savedTypes: null };
  }
  if (args.mysql) {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.createConnection(args.mysql);
    try {
      const [rows] = await conn.query(
        "SELECT id, `user`, `type`, CAST(amount AS CHAR) AS amount, CAST(`date` AS CHAR) AS `date`, CAST(isCredit AS CHAR) AS isCredit FROM expenses ORDER BY id",
      );
      const [types] = await conn.query("SELECT `type` FROM `type`");
      return { rows: rows as LegacyRow[], savedTypes: (types as { type: string }[]).map((t) => t.type) };
    } finally {
      await conn.end();
    }
  }
  fatal("Provide --sql <file>, --csv <file> or --mysql <url>");
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

const list = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);

/* ---------- main ---------- */

async function main() {
  const { rows, savedTypes } = await readSource();
  const map = readMap();
  console.log(`Read ${rows.length} legacy expense rows${savedTypes ? ` and ${savedTypes.length} saved types` : ""}.`);

  const mode = (args.categories ?? (savedTypes ? "saved" : "all")) as "saved" | "all";
  if (mode !== "saved" && mode !== "all") fatal(`--categories must be "saved" or "all"`);
  if (mode === "saved" && !savedTypes) fatal(`--categories saved needs the legacy \`type\` table: use --sql or --mysql`);
  console.log(`Category mode: ${mode}${args["fix-typos"] ? " (fixing typos)" : ""}`);

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

      const plan = planCategories({
        labels: userRows.map((r) => String(r.type ?? "")),
        savedTypes: savedTypes ?? [],
        mode,
        incomeTypes: list(args["income-types"]!),
        savingsTypes: list(args["savings-types"]!),
        othersName: args["others-name"]!,
        fixTypos: args["fix-typos"]!,
      });

      const valid: { row: LegacyRow; date: string; amount: string; category: string; note: string | null }[] = [];
      for (const row of userRows) {
        const date = parseLegacyDate(String(row.date));
        const amount = parseLegacyAmount(row.amount);
        const target = plan.labels.get(String(row.type ?? ""));
        if (!Number.isInteger(Number(row.id))) report.skipped.push(`row with no id (${row.type} ${row.amount})`);
        else if (!date) report.skipped.push(`#${row.id}: bad date "${row.date}"`);
        else if (!amount) report.skipped.push(`#${row.id}: amount "${row.amount}" (${row.type}) is not positive`);
        else if (!target) report.skipped.push(`#${row.id}: empty type`);
        else valid.push({ row, date, amount, category: target.category, note: target.note });
      }

      console.log(`\n  ${legacyUser}: ${plan.categories.length} categories`);
      for (const c of plan.categories) console.log(`     ${c.name.padEnd(24)} ${c.kind.padEnd(8)} ${c.uses} rows`);
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

        // Categories: reuse by case-insensitive name, create the rest (all saved types, even unused).
        const existing = await tx.select().from(categories).where(eq(categories.userId, user.id));
        const catIds = new Map(existing.map((c) => [c.name.toLowerCase(), c.id]));
        const usedColors = existing.map((c) => c.color);
        for (const { name, kind } of plan.categories) {
          if (catIds.has(name.toLowerCase())) continue;
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
                note: v.note,
                paidByCard: ["1", "true"].includes(String(v.row.isCredit).trim().toLowerCase()),
                legacyId: Number(v.row.id),
              })),
            )
            .onConflictDoNothing({ target: [transactions.userId, transactions.legacyId] })
            .returning({ id: transactions.id });
          report.inserted += inserted.length;
          report.existing += batch.length - inserted.length;
        }

        if (args["prune-unused"]) {
          const pruned = await tx
            .delete(categories)
            .where(
              and(
                eq(categories.userId, user.id),
                // Keep the categories this import just carried forward, even if unused.
                notInArray(
                  sql`lower(${categories.name})`,
                  plan.categories.map((c) => c.name.toLowerCase()),
                ),
                sql`not exists (select 1 from ${transactions} t where t.category_id = ${categories.id})`,
              ),
            )
            .returning({ name: categories.name });
          if (pruned.length) console.log(`  Removed unused categories: ${pruned.map((p) => p.name).join(", ")}`);
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

/**
 * Pure helpers for the legacy import (no I/O), kept separate so they can be unit-tested.
 */
import { isIsoDate } from "../src/lib/dates";

export type CategoryKind = "expense" | "income" | "savings";
export type LegacyRow = { id: number; user: string; type: string; amount: string; date: string; isCredit: string };

/* ------------------------------------------------------------------ */
/* phpMyAdmin / mysqldump .sql parsing                                  */
/* ------------------------------------------------------------------ */

type SqlValue = string | number | null;

/** Parses the VALUES tuples of every `INSERT INTO \`table\` (...) VALUES ...;` statement. */
export function parseSqlInserts(sql: string, table: string): Record<string, SqlValue>[] {
  const out: Record<string, SqlValue>[] = [];
  const header = new RegExp("INSERT INTO `" + table + "`\\s*\\(([^)]*)\\)\\s*VALUES\\s*", "gi");
  let m: RegExpExecArray | null;
  while ((m = header.exec(sql))) {
    const cols = m[1].split(",").map((c) => c.trim().replace(/`/g, ""));
    let i = header.lastIndex;
    // Walk tuples until the terminating semicolon, respecting quoted strings.
    while (i < sql.length) {
      while (/\s|,/.test(sql[i])) i++;
      if (sql[i] === ";") break;
      if (sql[i] !== "(") throw new Error(`Unexpected "${sql.slice(i, i + 20)}" in INSERT for ${table}`);
      i++;
      const values: SqlValue[] = [];
      while (true) {
        while (sql[i] === " ") i++;
        if (sql[i] === "'") {
          let s = "";
          i++;
          while (sql[i] !== "'" || sql[i + 1] === "'") {
            if (sql[i] === "\\") {
              const e = sql[i + 1];
              s += e === "n" ? "\n" : e === "r" ? "\r" : e === "t" ? "\t" : e === "0" ? "\0" : e;
              i += 2;
            } else if (sql[i] === "'") {
              s += "'";
              i += 2;
            } else s += sql[i++];
          }
          i++;
          values.push(s);
        } else {
          const end = sql.slice(i).search(/[,)]/);
          const raw = sql.slice(i, i + end).trim();
          i += end;
          values.push(raw.toUpperCase() === "NULL" ? null : Number(raw));
        }
        while (sql[i] === " ") i++;
        if (sql[i] === ",") {
          i++;
          continue;
        }
        if (sql[i] === ")") {
          i++;
          break;
        }
        throw new Error(`Malformed tuple in INSERT for ${table} near "${sql.slice(i, i + 20)}"`);
      }
      out.push(Object.fromEntries(cols.map((c, k) => [c, values[k] ?? null])));
    }
    header.lastIndex = i;
  }
  return out;
}

export function readSqlDump(sql: string) {
  const expenses: LegacyRow[] = parseSqlInserts(sql, "expenses").map((r) => ({
    id: Number(r.id),
    user: String(r.user ?? ""),
    type: String(r.type ?? ""),
    amount: String(r.amount ?? ""),
    date: String(r.date ?? ""),
    isCredit: String(r.isCredit ?? "0"),
  }));
  const savedTypes = parseSqlInserts(sql, "type").map((r) => String(r.type ?? ""));
  return { expenses, savedTypes };
}

/* ------------------------------------------------------------------ */
/* Labels → categories                                                  */
/* ------------------------------------------------------------------ */

/** Known typos / variants in the legacy data (lower-case key → canonical label). */
const TYPO_FIXES: Record<string, string> = {
  intrest: "Interest",
  interest: "Interest",
  "carry forward": "Carry forward",
  carryforward: "Carry forward",
  charges: "Charges",
  "electricity bill": "Electricity",
  maintainance: "Maintenance",
  flatmaintainance: "Flat maintenance",
};

/** Tidies whitespace and dash spacing ("Kada- steel" → "Kada - steel"); optionally fixes known typos. */
export function cleanLabel(raw: string, fixTypos: boolean): string {
  let s = raw.replace(/\s+/g, " ").trim();
  s = s.replace(/\s*-\s+|\s+-\s*/g, " - ");
  if (fixTypos) s = TYPO_FIXES[s.toLowerCase()] ?? s;
  return s;
}

export type Plan = {
  /** Categories to create (in order): saved ones appear in the picker, the rest are one-time labels. */
  categories: { name: string; kind: CategoryKind; uses: number; saved: boolean }[];
  /** Original legacy label → target category name. */
  labels: Map<string, string>;
};

/**
 * Decides which categories to create and where each legacy label goes.
 *
 * mode "saved": the legacy `type` table (+ income/savings types) become saved categories;
 *               every other free-text label becomes a one-time label (kept under its own name,
 *               but not shown in the category picker).
 * mode "all":   every distinct label becomes a saved category.
 */
export function planCategories(opts: {
  labels: string[]; // one per row (duplicates expected)
  savedTypes: string[];
  mode: "saved" | "all";
  incomeTypes: string[];
  savingsTypes: string[];
  fixTypos: boolean;
}): Plan {
  const lc = (s: string) => s.toLowerCase();
  const clean = (s: string) => cleanLabel(s, opts.fixTypos);
  const income = new Set(opts.incomeTypes.map((t) => lc(clean(t))));
  const savings = new Set(opts.savingsTypes.map((t) => lc(clean(t))));
  const kindOf = (name: string): CategoryKind =>
    income.has(lc(name)) ? "income" : savings.has(lc(name)) ? "savings" : "expense";

  // Canonical spelling per case-insensitive label: the saved-type spelling, else the most used one.
  const counts = new Map<string, Map<string, number>>();
  for (const raw of opts.labels) {
    const c = clean(raw);
    if (!c) continue;
    const spellings = counts.get(lc(c)) ?? new Map<string, number>();
    spellings.set(c, (spellings.get(c) ?? 0) + 1);
    counts.set(lc(c), spellings);
  }
  const canonical = new Map<string, string>();
  const uses = new Map<string, number>();
  for (const [key, spellings] of counts) {
    canonical.set(key, [...spellings].sort((a, b) => b[1] - a[1])[0][0]);
    uses.set(key, [...spellings.values()].reduce((a, b) => a + b, 0));
  }
  const savedKeys = new Set<string>();
  for (const t of opts.savedTypes) {
    const c = clean(t);
    if (!c) continue;
    canonical.set(lc(c), c);
    savedKeys.add(lc(c));
  }
  for (const key of counts.keys()) if (opts.mode === "all" || income.has(key) || savings.has(key)) savedKeys.add(key);

  const labels: Plan["labels"] = new Map();
  for (const raw of new Set(opts.labels)) {
    const key = lc(clean(raw));
    if (key) labels.set(raw, canonical.get(key)!.slice(0, 60));
  }

  const categories = [...canonical.keys()]
    .map((key) => {
      const name = canonical.get(key)!.slice(0, 60);
      return { name, kind: kindOf(name), uses: uses.get(key) ?? 0, saved: savedKeys.has(key) };
    })
    // Saved, most-used expense categories first so they get distinct colours.
    .sort(
      (a, b) =>
        Number(b.saved) - Number(a.saved) ||
        Number(a.kind !== "expense") - Number(b.kind !== "expense") ||
        b.uses - a.uses,
    );
  return { categories, labels };
}

/* ------------------------------------------------------------------ */
/* Field parsing                                                        */
/* ------------------------------------------------------------------ */

export function parseLegacyDate(raw: string): string | null {
  const s = raw.trim().slice(0, 10);
  if (isIsoDate(s)) return s;
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(raw.trim());
  if (dmy) {
    const iso = `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
    if (isIsoDate(iso)) return iso;
  }
  return null;
}

export function parseLegacyAmount(raw: string): string | null {
  const n = Number(String(raw).replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0 || n > 9_999_999_999.99) return null;
  return (Math.round(n * 100) / 100).toFixed(2);
}

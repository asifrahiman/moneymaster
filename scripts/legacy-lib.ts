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
  /** Categories to create (in order), with their type. */
  categories: { name: string; kind: CategoryKind; uses: number }[];
  /** For each original legacy label: target category name and the note to keep (if any). */
  labels: Map<string, { category: string; note: string | null }>;
};

/**
 * Decides which categories to create and where each legacy label goes.
 *
 * mode "saved": the legacy `type` table (+ income/savings types) become categories;
 *               every other free-text label goes to `othersName`, keeping the label as the note.
 * mode "all":   every distinct label becomes its own category.
 */
export function planCategories(opts: {
  labels: string[]; // one per row (duplicates expected)
  savedTypes: string[];
  mode: "saved" | "all";
  incomeTypes: string[];
  savingsTypes: string[];
  othersName: string;
  fixTypos: boolean;
}): Plan {
  const lc = (s: string) => s.toLowerCase();
  const income = new Set(opts.incomeTypes.map((t) => lc(cleanLabel(t, opts.fixTypos))));
  const savings = new Set(opts.savingsTypes.map((t) => lc(cleanLabel(t, opts.fixTypos))));
  const kindOf = (name: string): CategoryKind =>
    income.has(lc(name)) ? "income" : savings.has(lc(name)) ? "savings" : "expense";

  // Canonical spelling per case-insensitive label: the saved-type spelling, else the most used one.
  const counts = new Map<string, Map<string, number>>();
  for (const raw of opts.labels) {
    const c = cleanLabel(raw, opts.fixTypos);
    if (!c) continue;
    const spellings = counts.get(lc(c)) ?? new Map<string, number>();
    spellings.set(c, (spellings.get(c) ?? 0) + 1);
    counts.set(lc(c), spellings);
  }
  const canonical = new Map<string, string>();
  for (const [key, spellings] of counts) {
    canonical.set(key, [...spellings].sort((a, b) => b[1] - a[1])[0][0]);
  }
  for (const t of opts.savedTypes) {
    const c = cleanLabel(t, opts.fixTypos);
    if (c) canonical.set(lc(c), c);
  }

  const isCategory = new Set<string>();
  if (opts.mode === "all") for (const key of counts.keys()) isCategory.add(key);
  else {
    for (const t of opts.savedTypes) isCategory.add(lc(cleanLabel(t, opts.fixTypos)));
    for (const key of counts.keys()) if (income.has(key) || savings.has(key)) isCategory.add(key);
  }
  isCategory.delete("");

  const uses = new Map<string, number>();
  const labels: Plan["labels"] = new Map();
  for (const raw of new Set(opts.labels)) {
    const key = lc(cleanLabel(raw, opts.fixTypos));
    if (!key) continue;
    const target = isCategory.has(key) ? canonical.get(key)! : opts.othersName;
    labels.set(raw, { category: target, note: isCategory.has(key) ? null : canonical.get(key)!.slice(0, 200) });
  }
  for (const raw of opts.labels) {
    const t = labels.get(raw);
    if (t) uses.set(t.category, (uses.get(t.category) ?? 0) + 1);
  }

  const names = [...isCategory].map((k) => canonical.get(k)!);
  if ([...labels.values()].some((l) => l.category === opts.othersName) && !names.some((n) => lc(n) === lc(opts.othersName)))
    names.push(opts.othersName);

  const categories = names
    .map((name) => ({ name: name.slice(0, 40), kind: kindOf(name), uses: uses.get(name) ?? 0 }))
    // Most-used expense categories first so they get distinct colours.
    .sort((a, b) => Number(a.kind !== "expense") - Number(b.kind !== "expense") || b.uses - a.uses);
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

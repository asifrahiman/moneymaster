/**
 * Plain-text period summary for archiving (e.g. pasting into a notes file):
 *
 *   September 2026 - 121164.55
 *
 *   Car                     630.00
 *   Carry forward           508.29
 *   Credit               161672.84
 *   …
 *
 * The headline is the net expense: all expense categories, excluding savings,
 * income and carry-forward entries (which move a balance between months rather
 * than being spending).
 */
import { endOfMonth, formatDate } from "./dates";

export type SummaryRow = { name: string; kind: "expense" | "income" | "savings"; total: number };

/** "Carry forward", "CarryForward", "carry-forward"… */
export const isCarryForward = (name: string) => name.toLowerCase().replace(/[\s_-]/g, "") === "carryforward";

const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

export function netExpense(rows: SummaryRow[]): number {
  const sum = rows.filter((r) => r.kind === "expense" && !isCarryForward(r.name)).reduce((s, r) => s + r.total, 0);
  return Math.round(sum * 100) / 100;
}

/** "September 2026" for a whole calendar month, "All time" with no range, else "1 Sep 2026 to 15 Oct 2026". */
export function periodLabel(from?: string, to?: string): string {
  if (!from && !to) return "All time";
  if (from && to && from.endsWith("-01") && to === endOfMonth(from)) {
    return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(`${from}T00:00:00Z`),
    );
  }
  return `${from ? formatDate(from) : "Start"} to ${to ? formatDate(to) : "today"}`;
}

export function buildSummary(label: string, rows: SummaryRow[]): string {
  // Merge rows that share a name (case-insensitive) and sort alphabetically.
  const merged = new Map<string, SummaryRow>();
  for (const r of rows) {
    const key = r.name.toLowerCase();
    const prev = merged.get(key);
    merged.set(key, prev ? { ...prev, total: prev.total + r.total } : { ...r });
  }
  const list = [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));

  const nameWidth = Math.max(20, ...list.map((r) => r.name.length + 4));
  const amountWidth = Math.max(10, ...list.map((r) => money(r.total).length));
  const lines = list.map((r) => r.name.padEnd(nameWidth) + money(r.total).padStart(amountWidth));

  return [`${label} - ${money(netExpense(rows))}`, "", ...lines, ""].join("\n");
}

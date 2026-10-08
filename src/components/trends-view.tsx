"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import type { CategoryRow, MonthlyRow } from "@/server/queries";
import { formatMonthKey } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { IncomeVsSpendChart, CategoryLinesChart } from "./charts";
import { Card, CardHeader } from "./ui";

type Mode = "top" | "saved";
const TOP_N = 5;

/** Rounds to paise and turns -0 / float dust (e.g. -0.0000001) into a clean 0. */
const cents = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return Math.abs(r) < 0.005 ? 0 : r;
};

export function TrendsView({
  keys,
  rows,
  categories,
  currency,
  lifetime,
  openingBalance,
}: {
  keys: string[];
  rows: MonthlyRow[];
  categories: Pick<CategoryRow, "id" | "name" | "color" | "saved" | "kind">[];
  currency: string;
  /** All-time book: table shows a running balance at the end of each month. */
  lifetime: boolean;
  /** Balance before the first month shown (lifetime books). */
  openingBalance: number;
}) {
  const [mode, setMode] = useState<Mode>("top");
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Expense totals per category over the period (for ordering and the picker).
  const expenseTotals = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) if (r.kind === "expense") m.set(r.categoryId, (m.get(r.categoryId) ?? 0) + r.total);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const selected: string[] = useMemo(() => {
    if (mode === "top") return expenseTotals.slice(0, TOP_N).map(([id]) => id);
    return expenseTotals.filter(([id]) => byId.get(id)?.saved).map(([id]) => id);
  }, [mode, expenseTotals, byId]);

  // Everything not selected is folded into one grey "Other" / "One-time labels" line.
  const withOther = expenseTotals.length > selected.length;
  const otherLabel = mode === "saved" ? "One-time labels" : "Other";

  const { stacked, flow } = useMemo(() => {
    const sel = new Set(selected);
    const stacked = keys.map((k) => {
      const row: Record<string, string | number> = { label: formatMonthKey(k) };
      for (const id of selected) row[id] = 0;
      if (withOther) row.other = 0;
      return row;
    });
    const flow = keys.map((k) => ({ key: k, label: formatMonthKey(k), income: 0, spent: 0, saved: 0 }));
    for (const r of rows) {
      const i = keys.indexOf(r.month);
      if (i < 0) continue;
      if (r.kind === "expense") {
        flow[i].spent += r.total;
        const key = sel.has(r.categoryId) ? r.categoryId : withOther ? "other" : null;
        if (key) stacked[i][key] = cents((stacked[i][key] as number) + r.total);
      } else if (r.kind === "income") flow[i].income += r.total;
      else flow[i].saved += r.total;
    }
    return { stacked, flow };
  }, [keys, rows, selected, withOther]);

  const series = [
    ...selected.map((id) => ({ key: id, name: byId.get(id)?.name ?? "Unknown", color: byId.get(id)?.color ?? "other" })),
    ...(withOther ? [{ key: "other", name: otherLabel, color: "other" }] : []),
  ];

  // Table rows: rounded, with a running balance for lifetime books.
  const table = useMemo(() => {
    const out: (typeof flow[number] & { net: number; balance: number })[] = [];
    let running = openingBalance;
    for (const m of flow) {
      const net = cents(m.income - m.spent - m.saved);
      running = cents(running + net);
      out.push({ ...m, income: cents(m.income), spent: cents(m.spent), saved: cents(m.saved), net, balance: running });
    }
    return out;
  }, [flow, openingBalance]);

  const totalSpent = cents(flow.reduce((s, m) => s + m.spent, 0));
  const totalIncome = cents(flow.reduce((s, m) => s + m.income, 0));
  const activeMonths = flow.filter((m) => m.spent > 0).length || 1;
  const peak = flow.reduce((a, b) => (b.spent > a.spent ? b : a), flow[0]);
  const signed = (n: number) => `${n < 0 ? "−" : ""}${formatMoney(Math.abs(n), currency)}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Avg. monthly spend" value={formatMoney(totalSpent / activeMonths, currency)} />
        <Tile label={`Spent (${keys.length} months)`} value={formatMoney(totalSpent, currency)} />
        <Tile label={`Income (${keys.length} months)`} value={formatMoney(totalIncome, currency)} />
        <Tile label="Highest month" value={peak?.spent ? `${peak.label} · ${formatMoney(peak.spent, currency)}` : "—"} />
      </div>

      <Card>
        <CardHeader
          title="Monthly spending by category"
          subtitle={mode === "top" ? `Top ${TOP_N} categories over the period` : "All saved categories"}
          action={
            <div role="group" aria-label="Categories to show" className="inline-flex rounded-lg border border-line-strong bg-surface p-0.5">
              {(
                [
                  ["top", `Top ${TOP_N}`],
                  ["saved", "All saved"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={mode === v}
                  onClick={() => setMode(v)}
                  className={clsx(
                    "rounded-md px-2.5 py-1 text-sm whitespace-nowrap",
                    mode === v ? "bg-accent-soft font-medium text-accent" : "text-ink-2 hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        />
        <div className="px-3 pb-4 md:px-5">
          {series.length ? (
            <CategoryLinesChart data={stacked} series={series} currency={currency} />
          ) : (
            <p className="py-16 text-center text-sm text-muted">No spending in this period.</p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Income vs spending" />
        <div className="px-3 pb-4 md:px-5">
          <IncomeVsSpendChart data={flow} currency={currency} />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <CardHeader
          title="Monthly table"
          subtitle={lifetime ? "Balance is the running total at the end of each month." : undefined}
        />
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th scope="col" className="px-5 py-2 text-left font-medium">Month</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Income</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Spent</th>
              {lifetime ? (
                <th scope="col" className="px-3 py-2 text-right font-medium">Net</th>
              ) : (
                <th scope="col" className="px-3 py-2 text-right font-medium">Saved</th>
              )}
              <th scope="col" className="px-5 py-2 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody className="tabular divide-y divide-line border-t border-line">
            {[...table].reverse().map((m) => {
              const end = lifetime ? m.balance : m.net;
              return (
                <tr key={m.key}>
                  <td className="whitespace-nowrap px-5 py-2 text-ink">{m.label}</td>
                  <td className="px-3 py-2 text-right text-ink-2">{formatMoney(m.income, currency)}</td>
                  <td className="px-3 py-2 text-right text-ink-2">{formatMoney(m.spent, currency)}</td>
                  {lifetime ? (
                    <td className={clsx("px-3 py-2 text-right", m.net < 0 ? "text-negative" : "text-ink-2")}>{signed(m.net)}</td>
                  ) : (
                    <td className="px-3 py-2 text-right text-ink-2">{formatMoney(m.saved, currency)}</td>
                  )}
                  <td className={clsx("px-5 py-2 text-right font-medium", end < 0 ? "text-negative" : "text-ink")}>{signed(end)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="tabular mt-1 truncate text-base font-semibold tracking-tight text-ink sm:text-lg" title={value}>
        {value}
      </p>
    </div>
  );
}

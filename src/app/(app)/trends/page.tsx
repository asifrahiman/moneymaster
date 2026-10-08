import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { IncomeVsSpendChart, StackedMonthlyChart } from "@/components/charts";
import { Card, CardHeader, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { addMonths, endOfMonth, formatMonthKey, monthKeys, startOfMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { requireUser } from "@/server/dal";
import { listCategories, monthlyTotals } from "@/server/queries";

export const metadata: Metadata = { title: "Trends" };

const PERIODS = [6, 12, 24] as const;
const TOP_N = 5;

export default function TrendsPage({ searchParams }: PageProps<"/trends">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6" aria-busy>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      }
    >
      <Trends searchParams={searchParams} />
    </Suspense>
  );
}

async function Trends({ searchParams }: { searchParams: PageProps<"/trends">["searchParams"] }) {
  const user = await requireUser();
  const requested = Number((await searchParams).months);
  const months = (PERIODS as readonly number[]).includes(requested) ? requested : 12;

  const from = addMonths(startOfMonth(user.today), -(months - 1));
  const to = endOfMonth(user.today);
  const keys = monthKeys(user.today, months);

  const [categories, rows] = await Promise.all([listCategories(user.id), monthlyTotals(user.id, from, to)]);
  const byId = new Map(categories.map((c) => [c.id, c]));

  // Top expense categories over the whole period keep their own colour; the rest fold into "Other".
  const expenseTotals = new Map<string, number>();
  for (const r of rows) if (r.kind === "expense") expenseTotals.set(r.categoryId, (expenseTotals.get(r.categoryId) ?? 0) + r.total);
  const top = [...expenseTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_N).map(([id]) => id);
  const hasOther = expenseTotals.size > top.length;

  const stacked = keys.map((k) => {
    const row: Record<string, string | number> = { label: formatMonthKey(k) };
    for (const id of top) row[id] = 0;
    if (hasOther) row.other = 0;
    return row;
  });
  const flow = keys.map((k) => ({ label: formatMonthKey(k), income: 0, spent: 0, saved: 0 }));

  for (const r of rows) {
    const i = keys.indexOf(r.month);
    if (i < 0) continue;
    if (r.kind === "expense") {
      const key = top.includes(r.categoryId) ? r.categoryId : "other";
      stacked[i][key] = Math.round(((stacked[i][key] as number) + r.total) * 100) / 100;
      flow[i].spent += r.total;
    } else if (r.kind === "income") flow[i].income += r.total;
    else flow[i].saved += r.total;
  }

  const series = [
    ...top.map((id) => ({ key: id, name: byId.get(id)?.name ?? "Unknown", color: byId.get(id)?.color ?? "other" })),
    ...(hasOther ? [{ key: "other", name: "Other", color: "other" }] : []),
  ];

  const totalSpent = flow.reduce((s, m) => s + m.spent, 0);
  const totalIncome = flow.reduce((s, m) => s + m.income, 0);
  const activeMonths = flow.filter((m) => m.spent > 0).length || 1;
  const peak = flow.reduce((a, b) => (b.spent > a.spent ? b : a), flow[0]);

  return (
    <>
      <PageHeader
        title="Trends"
        description="How your spending moves month to month."
        actions={
          <div className="inline-flex rounded-lg border border-line-strong bg-surface p-0.5" role="group" aria-label="Period">
            {PERIODS.map((p) => (
              <Link
                key={p}
                href={`/trends?months=${p}`}
                aria-current={p === months ? "page" : undefined}
                className={clsx(
                  "rounded-md px-3 py-1.5 text-sm font-medium",
                  p === months ? "bg-accent-soft text-accent" : "text-ink-2 hover:text-ink",
                )}
              >
                {p}m
              </Link>
            ))}
          </div>
        }
      />

      {rows.length === 0 ? (
        <Card>
          <EmptyState title="Not enough data yet">Add a few transactions and come back.</EmptyState>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Avg. monthly spend" value={formatMoney(totalSpent / activeMonths, user.currency)} />
            <Tile label={`Spent (${months} months)`} value={formatMoney(totalSpent, user.currency)} />
            <Tile label={`Income (${months} months)`} value={formatMoney(totalIncome, user.currency)} />
            <Tile label="Highest month" value={peak.spent ? `${peak.label} · ${formatMoney(peak.spent, user.currency, { compact: true })}` : "—"} />
          </div>

          <Card>
            <CardHeader title="Monthly spending by category" subtitle={`Top ${TOP_N} categories over the period`} />
            <div className="px-3 pb-4 md:px-5">
              <StackedMonthlyChart data={stacked} series={series} currency={user.currency} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Income vs spending" />
            <div className="px-3 pb-4 md:px-5">
              <IncomeVsSpendChart data={flow} currency={user.currency} />
            </div>
          </Card>

          <Card className="overflow-x-auto">
            <CardHeader title="Monthly table" />
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th scope="col" className="px-5 py-2 text-left font-medium">Month</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Income</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Spent</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Saved</th>
                  <th scope="col" className="px-5 py-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody className="tabular divide-y divide-line border-t border-line">
                {[...flow].reverse().map((m) => {
                  const net = m.income - m.spent - m.saved;
                  return (
                    <tr key={m.label}>
                      <td className="whitespace-nowrap px-5 py-2 text-ink">{m.label}</td>
                      <td className="px-3 py-2 text-right text-ink-2">{formatMoney(m.income, user.currency)}</td>
                      <td className="px-3 py-2 text-right text-ink-2">{formatMoney(m.spent, user.currency)}</td>
                      <td className="px-3 py-2 text-right text-ink-2">{formatMoney(m.saved, user.currency)}</td>
                      <td className={clsx("px-5 py-2 text-right font-medium", net < 0 ? "text-negative" : "text-ink")}>
                        {net < 0 ? "−" : ""}
                        {formatMoney(Math.abs(net), user.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}

import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryDonut } from "@/components/charts";
import { FilterBar } from "@/components/filter-bar";
import { StatGrid } from "@/components/stats";
import { buttonClass, Card, CardHeader, CategoryDot, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { filtersToSearch, KINDS, parseFilters, type TxFilters } from "@/lib/filters";
import { formatMoney, formatPercent } from "@/lib/format";
import { requireUser, scopeOf } from "@/server/dal";
import { categoryBreakdown, getTotals, listCategories, type BreakdownRow } from "@/server/queries";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage({ searchParams }: PageProps<"/reports">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4" aria-busy>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      }
    >
      <Report searchParams={searchParams} />
    </Suspense>
  );
}

async function Report({ searchParams }: { searchParams: PageProps<"/reports">["searchParams"] }) {
  const user = await requireUser();
  const filters = parseFilters(await searchParams, user.today, user.book.period === "all" ? "all" : "this-month");
  const range: Partial<TxFilters> = { from: filters.from, to: filters.to, card: filters.card };

  const [categories, totals, breakdown] = await Promise.all([
    listCategories(scopeOf(user)),
    getTotals(scopeOf(user), range),
    categoryBreakdown(scopeOf(user), range),
  ]);

  const expenses = breakdown.filter((b) => b.kind === "expense");
  const top = expenses.slice(0, 6);
  const rest = expenses.slice(6).reduce((s, r) => s + r.total, 0);
  const donut = [...top, ...(rest > 0 ? [{ name: "Other", color: "other", total: rest }] : [])];

  return (
    <>
      <PageHeader
        title="Reports"
        description="Totals by category for any period."
        actions={
          <a href={`/api/export${filtersToSearch({ preset: filters.preset, from: filters.from, to: filters.to, card: filters.card })}`} className={buttonClass("secondary")} download>
            <Download className="size-4" aria-hidden /> Download CSV
          </a>
        }
      />
      <div className="flex flex-col gap-6">
        <FilterBar filters={filters} categories={categories} show={{ card: true }} />
        <StatGrid totals={totals} currency={user.currency} />

        {breakdown.length === 0 ? (
          <Card>
            <EmptyState title="No transactions in this period" />
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader title="Spending mix" subtitle="Top categories, rest grouped as Other" />
              <div className="px-5 pb-5">
                {expenses.length ? (
                  <CategoryDonut data={donut} total={totals.spent} currency={user.currency} />
                ) : (
                  <EmptyState title="No spending in this period" />
                )}
              </div>
            </Card>

            <Card className="overflow-hidden lg:col-span-2">
              {KINDS.map((k) => {
                const rows = breakdown.filter((b) => b.kind === k.value);
                if (!rows.length) return null;
                const sum = rows.reduce((s, r) => s + r.total, 0);
                return (
                  <BreakdownTable
                    key={k.value}
                    title={k.label}
                    rows={rows}
                    sum={sum}
                    currency={user.currency}
                    linkFor={(id) =>
                      `/transactions${filtersToSearch({ preset: filters.preset, from: filters.from, to: filters.to, categoryId: id, card: filters.card })}`
                    }
                  />
                );
              })}
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

function BreakdownTable({
  title,
  rows,
  sum,
  currency,
  linkFor,
}: {
  title: string;
  rows: BreakdownRow[];
  sum: number;
  currency: string;
  linkFor: (categoryId: string) => string;
}) {
  return (
    <table className="w-full text-sm [&+table]:border-t [&+table]:border-line">
      <caption className="px-5 pt-4 pb-2 text-left text-sm font-semibold text-ink">{title}</caption>
      <thead>
        <tr className="text-xs text-muted">
          <th scope="col" className="px-5 py-2 text-left font-medium">
            Category
          </th>
          <th scope="col" className="hidden px-3 py-2 text-right font-medium sm:table-cell">
            Count
          </th>
          <th scope="col" className="px-3 py-2 text-right font-medium">
            Share
          </th>
          <th scope="col" className="px-5 py-2 text-right font-medium">
            Total
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line border-t border-line">
        {rows.map((r) => (
          <tr key={r.categoryId} className="hover:bg-surface-2">
            <td className="px-5 py-2.5">
              <Link href={linkFor(r.categoryId)} className="flex items-center gap-2 text-ink hover:underline">
                <CategoryDot color={r.color} />
                {r.name}
              </Link>
            </td>
            <td className="tabular hidden px-3 py-2.5 text-right text-ink-2 sm:table-cell">{r.count}</td>
            <td className="tabular px-3 py-2.5 text-right text-ink-2">{formatPercent(sum ? r.total / sum : 0)}</td>
            <td className="tabular px-5 py-2.5 text-right font-medium text-ink">{formatMoney(r.total, currency)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t border-line-strong font-semibold">
          <td className="px-5 py-2.5">Total</td>
          <td className="hidden sm:table-cell" />
          <td />
          <td className="tabular px-5 py-2.5 text-right">{formatMoney(sum, currency)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

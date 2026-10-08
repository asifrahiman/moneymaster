import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TrendsView } from "@/components/trends-view";
import { Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { addDays, addMonths, endOfMonth, monthKeys, startOfMonth } from "@/lib/dates";
import { requireUser, scopeOf } from "@/server/dal";
import { getTotals, listCategories, monthlyTotals } from "@/server/queries";

export const metadata: Metadata = { title: "Trends" };

const PERIODS = [6, 12, 24] as const;

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

  const lifetime = user.book.period === "all";
  const [categories, rows, before] = await Promise.all([
    listCategories(scopeOf(user)),
    monthlyTotals(scopeOf(user), from, to),
    // Balance carried into the first month shown (for the running balance column).
    lifetime ? getTotals(scopeOf(user), { to: addDays(from, -1) }) : null,
  ]);

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
        <TrendsView
          keys={keys}
          rows={rows}
          categories={categories.map(({ id, name, color, saved, kind }) => ({ id, name, color, saved, kind }))}
          currency={user.currency}
          lifetime={lifetime}
          openingBalance={before?.net ?? 0}
        />
      )}
    </>
  );
}

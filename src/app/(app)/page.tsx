import Link from "next/link";
import { Suspense } from "react";
import { CategoryBars, StatGrid } from "@/components/stats";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { Card, CardHeader, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { requireUser } from "@/server/dal";
import {
  categoryBreakdown,
  firstTransactionDate,
  getTotals,
  listCategories,
  recentTransactions,
} from "@/server/queries";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await requireUser();
  // The dashboard is all-time: a running balance from the very first entry.
  const [categories, totals, since, breakdown, recent] = await Promise.all([
    listCategories(user.id),
    getTotals(user.id, {}),
    firstTransactionDate(user.id),
    categoryBreakdown(user.id, { kind: "expense" }),
    recentTransactions(user.id, 8),
  ]);

  const firstName = user.name?.split(" ")[0];

  return (
    <>
      <PageHeader title={firstName ? `Hi, ${firstName}` : "Dashboard"} description={since ? `All-time, since ${formatDate(since)}.` : "Add your first transaction below."} />

      <div className="flex flex-col gap-6">
        <StatGrid totals={totals} currency={user.currency} balance={{ since }} />

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader title="Add a transaction" />
            <div className="px-5 pb-5">
              <TransactionForm categories={categories} today={user.today} currency={user.currency} />
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Where it went"
              subtitle="All-time spending by category"
              action={
                <Link href="/reports" className="text-xs font-medium text-accent hover:underline">
                  Report
                </Link>
              }
            />
            {breakdown.length ? (
              <CategoryBars rows={breakdown} total={totals.spent} currency={user.currency} />
            ) : (
              <EmptyState title="No spending yet" />
            )}
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Recent transactions"
            action={
              <Link href="/transactions" className="text-xs font-medium text-accent hover:underline">
                View all
              </Link>
            }
          />
          {recent.length ? (
            <TransactionList rows={recent} categories={categories} today={user.today} currency={user.currency} />
          ) : (
            <EmptyState title="Nothing here yet">Add your first transaction above.</EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-72 rounded-2xl lg:col-span-3" />
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

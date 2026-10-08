import Link from "next/link";
import { Suspense } from "react";
import { CategoryBars, StatGrid } from "@/components/stats";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { Card, CardHeader, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { addMonths, presetRange } from "@/lib/dates";
import { requireUser } from "@/server/dal";
import { categoryBreakdown, getTotals, listCategories, recentTransactions } from "@/server/queries";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await requireUser();
  const thisMonth = presetRange("this-month", user.today);
  // Compare month-to-date with the same span of last month (a fair comparison mid-month).
  const lastMonthToDate = { from: presetRange("last-month", user.today).from, to: addMonths(user.today, -1) };

  const [categories, totals, previous, breakdown, recent] = await Promise.all([
    listCategories(user.id),
    getTotals(user.id, thisMonth),
    getTotals(user.id, lastMonthToDate),
    categoryBreakdown(user.id, { ...thisMonth, kind: "expense" }),
    recentTransactions(user.id, 8),
  ]);

  const firstName = user.name?.split(" ")[0];
  const monthName = new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(
    new Date(`${user.today}T00:00:00Z`),
  );

  return (
    <>
      <PageHeader title={firstName ? `Hi, ${firstName}` : "Dashboard"} description={`Here's ${monthName} so far.`} />

      <div className="flex flex-col gap-6">
        <StatGrid totals={totals} previous={previous} currency={user.currency} />

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
              subtitle={`${monthName} spending by category`}
              action={
                <Link href="/reports" className="text-xs font-medium text-accent hover:underline">
                  Report
                </Link>
              }
            />
            {breakdown.length ? (
              <CategoryBars rows={breakdown} total={totals.spent} currency={user.currency} />
            ) : (
              <EmptyState title="No spending yet this month" />
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

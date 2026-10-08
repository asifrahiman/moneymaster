import Link from "next/link";
import { Suspense } from "react";
import { MonthNav } from "@/components/month-nav";
import { CategoryBars, StatGrid } from "@/components/stats";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { Card, CardHeader, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { addMonths, endOfMonth, formatDate, isIsoDate } from "@/lib/dates";
import { filtersToSearch } from "@/lib/filters";
import { requireUser, scopeOf, type CurrentUser } from "@/server/dal";
import {
  categoryBreakdown,
  firstTransactionDate,
  getTotals,
  listCategories,
  recentTransactions,
  type BreakdownRow,
  type CategoryRow,
  type TxRow,
} from "@/server/queries";

export default function DashboardPage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const user = await requireUser();
  const scope = scopeOf(user);
  const firstName = user.name?.split(" ")[0];
  const greeting = firstName ? `Hi, ${firstName}` : "Dashboard";

  // An all-time book shows a running balance since the first entry.
  if (user.book.period === "all") {
    const [categories, totals, since, breakdown, recent] = await Promise.all([
      listCategories(scope),
      getTotals(scope, {}),
      firstTransactionDate(scope),
      categoryBreakdown(scope, { kind: "expense" }),
      recentTransactions(scope, 8),
    ]);
    return (
      <Layout
        user={user}
        header={
          <PageHeader
            title={greeting}
            description={`${user.book.name} · ${since ? `all-time, since ${formatDate(since)}` : "add your first transaction below"}`}
          />
        }
        stats={<StatGrid totals={totals} currency={user.currency} balance={{ since }} />}
        categories={categories}
        breakdown={breakdown}
        spent={totals.spent}
        breakdownSubtitle="All-time spending by category"
        recent={recent}
        recentTitle="Recent transactions"
        viewAllHref="/transactions?range=all"
      />
    );
  }

  // A monthly book shows one month at a time.
  const current = user.today.slice(0, 7);
  const requested = String((await searchParams).month ?? "");
  const month = isIsoDate(`${requested}-01`) && requested <= current ? requested : current;
  const from = `${month}-01`;
  const to = endOfMonth(from);
  const isCurrent = month === current;
  // Mid-month, compare with the same span of last month; otherwise with the whole previous month.
  const prevFrom = addMonths(from, -1);
  const previousRange = { from: prevFrom, to: isCurrent ? addMonths(user.today, -1) : endOfMonth(prevFrom) };

  const [categories, totals, previous, breakdown, recent] = await Promise.all([
    listCategories(scope),
    getTotals(scope, { from, to }),
    getTotals(scope, previousRange),
    categoryBreakdown(scope, { from, to, kind: "expense" }),
    recentTransactions(scope, 8, { from, to }),
  ]);
  const label = (iso: string) =>
    new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
  const monthLabel = label(from);

  return (
    <Layout
      user={user}
      header={
        <PageHeader
          title={greeting}
          description={`${user.book.name} · ${isCurrent ? `${monthLabel} so far` : monthLabel}`}
          actions={<MonthNav month={month} current={current} />}
        />
      }
      stats={
        <StatGrid
          totals={totals}
          previous={previous}
          compareLabel={isCurrent ? "than this point last month" : `than ${label(prevFrom)}`}
          currency={user.currency}
        />
      }
      categories={categories}
      breakdown={breakdown}
      spent={totals.spent}
      breakdownSubtitle={`${monthLabel} spending by category`}
      recent={recent}
      recentTitle={`Latest in ${monthLabel}`}
      viewAllHref={`/transactions${filtersToSearch({ preset: "custom", from, to })}`}
    />
  );
}

function Layout(props: {
  user: CurrentUser;
  header: React.ReactNode;
  stats: React.ReactNode;
  categories: CategoryRow[];
  breakdown: BreakdownRow[];
  spent: number;
  breakdownSubtitle: string;
  recent: TxRow[];
  recentTitle: string;
  viewAllHref: string;
}) {
  const { user } = props;
  return (
    <>
      {props.header}
      <div className="flex flex-col gap-6">
        {props.stats}

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader title="Add a transaction" subtitle={`to ${user.book.name}`} />
            <div className="px-5 pb-5">
              <TransactionForm categories={props.categories} today={user.today} currency={user.currency} />
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Where it went"
              subtitle={props.breakdownSubtitle}
              action={
                <Link href="/reports" className="text-xs font-medium text-accent hover:underline">
                  Report
                </Link>
              }
            />
            {props.breakdown.length ? (
              <CategoryBars rows={props.breakdown} total={props.spent} currency={user.currency} />
            ) : (
              <EmptyState title="No spending yet" />
            )}
          </Card>
        </div>

        <Card>
          <CardHeader
            title={props.recentTitle}
            action={
              <Link href={props.viewAllHref} className="text-xs font-medium text-accent hover:underline">
                View all
              </Link>
            }
          />
          {props.recent.length ? (
            <TransactionList rows={props.recent} categories={props.categories} today={user.today} currency={user.currency} />
          ) : (
            <EmptyState title="Nothing here yet">Add a transaction above.</EmptyState>
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

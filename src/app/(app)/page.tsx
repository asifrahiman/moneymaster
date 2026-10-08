import { Suspense } from "react";
import { AddTransactionButton } from "@/components/add-transaction-button";
import type { FilterValue } from "@/components/filter-controls";
import { Ledger } from "@/components/ledger";
import { TransactionForm } from "@/components/transaction-form";
import { Card, CardHeader, PageHeader, Skeleton } from "@/components/ui";
import { parseFilters } from "@/lib/filters";
import { requireUser, scopeOf } from "@/server/dal";
import { firstTransactionDate, getTotals, ledgerPage, listCategories } from "@/server/queries";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

async function Home({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const user = await requireUser();
  const scope = scopeOf(user);

  // Each book opens on its natural view: all time, or the current month.
  const defaults: FilterValue =
    user.book.period === "all" ? { preset: "all" } : { preset: "month", month: user.today.slice(0, 7) };
  const f = parseFilters(await searchParams, user.today, defaults.preset);
  const initialFilters: FilterValue = {
    preset: f.preset,
    month: f.month,
    // from/to are only part of the filter for a custom range; presets derive them.
    from: f.preset === "custom" ? f.from : undefined,
    to: f.preset === "custom" ? f.to : undefined,
    kind: f.kind,
    card: f.card,
    categoryId: f.categoryId,
    q: f.q,
  };

  const [categories, page, totals, since] = await Promise.all([
    listCategories(scope),
    ledgerPage(scope, f),
    getTotals(scope, f),
    f.from || f.to ? null : firstTransactionDate(scope),
  ]);

  const firstName = user.name?.split(" ")[0];
  return (
    <>
      <PageHeader
        title={firstName ? `Hi, ${firstName}` : "Home"}
        description={`${user.book.name} · ${user.book.period === "all" ? "all-time balance" : "month by month"}`}
      />
      <Ledger
        // A different book is a different ledger: remount so no state leaks across.
        key={user.book.id}
        initialFilters={initialFilters}
        initialData={{ ...page, totals, since }}
        defaults={defaults}
        categories={categories}
        today={user.today}
        currency={user.currency}
        balanceView={user.book.period === "all"}
      >
        <Card className="hidden md:block">
          <CardHeader title="Add a transaction" subtitle={`to ${user.book.name}`} />
          <div className="px-5 pb-5">
            <TransactionForm categories={categories} today={user.today} currency={user.currency} />
          </div>
        </Card>
      </Ledger>
      <AddTransactionButton fab categories={categories} today={user.today} currency={user.currency} />
    </>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="hidden h-56 rounded-2xl md:block" />
      <Skeleton className="h-[480px] rounded-2xl" />
    </div>
  );
}

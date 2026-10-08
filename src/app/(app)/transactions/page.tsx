import { Download } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AddTransactionButton } from "@/components/add-transaction-button";
import { FilterBar } from "@/components/filter-bar";
import { Pagination } from "@/components/pagination";
import { TransactionList } from "@/components/transaction-list";
import { buttonClass, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { filtersToSearch, parseFilters } from "@/lib/filters";
import { formatMoney } from "@/lib/format";
import { requireUser, scopeOf } from "@/server/dal";
import { listCategories, listTransactions } from "@/server/queries";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Transactions searchParams={searchParams} />
    </Suspense>
  );
}

async function Transactions({ searchParams }: { searchParams: PageProps<"/transactions">["searchParams"] }) {
  const user = await requireUser();
  const filters = parseFilters(await searchParams, user.today, user.book.period === "all" ? "all" : "this-month");
  const [categories, { rows, totals, pageCount }] = await Promise.all([
    listCategories(scopeOf(user)),
    listTransactions(scopeOf(user), filters),
  ]);

  return (
    <>
      <PageHeader
        title="Transactions"
        actions={
          <>
            <a
              href={`/api/export${filtersToSearch({ ...filters, page: 1 })}`}
              className={buttonClass("secondary")}
              download
            >
              <Download className="size-4" aria-hidden /> CSV
            </a>
            <AddTransactionButton categories={categories} today={user.today} currency={user.currency} />
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <FilterBar filters={filters} categories={categories} />

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-2">
          <span>
            <span className="tabular font-medium text-ink">{totals.count}</span> transactions
          </span>
          <span>
            Spent <span className="tabular font-medium text-ink">{formatMoney(totals.spent, user.currency)}</span>
          </span>
          <span>
            On card <span className="tabular font-medium text-ink">{formatMoney(totals.card, user.currency)}</span>
          </span>
          <span>
            Income <span className="tabular font-medium text-positive">{formatMoney(totals.income, user.currency)}</span>
          </span>
          {totals.saved > 0 && (
            <span>
              Saved <span className="tabular font-medium text-ink">{formatMoney(totals.saved, user.currency)}</span>
            </span>
          )}
        </div>

        <Card className="overflow-hidden">
          {rows.length ? (
            <>
              <TransactionList rows={rows} categories={categories} today={user.today} currency={user.currency} />
              <Pagination filters={filters} pageCount={pageCount} basePath="/transactions" />
            </>
          ) : (
            <EmptyState title="No transactions match">Try a wider date range or clear the filters.</EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-10 w-full max-w-2xl" />
      <Skeleton className="h-[480px] rounded-2xl" />
    </div>
  );
}

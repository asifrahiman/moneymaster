import type { Metadata } from "next";
import { Suspense } from "react";
import type { FilterValue } from "@/components/filter-controls";
import { ReportView } from "@/components/report-view";
import { PageHeader, Skeleton } from "@/components/ui";
import { parseFilters } from "@/lib/filters";
import { requireUser, scopeOf } from "@/server/dal";
import { categoryBreakdown, getTotals } from "@/server/queries";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage({ searchParams }: PageProps<"/reports">) {
  return (
    <>
      <PageHeader title="Reports" description="Totals by category. Filter, sort, and download a summary for any period." />
      <Suspense
        fallback={
          <div className="flex flex-col gap-4" aria-busy>
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        }
      >
        <Report searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Report({ searchParams }: { searchParams: PageProps<"/reports">["searchParams"] }) {
  const user = await requireUser();
  const scope = scopeOf(user);
  const defaults: FilterValue =
    user.book.period === "all" ? { preset: "all" } : { preset: "month", month: user.today.slice(0, 7) };
  const f = parseFilters(await searchParams, user.today, defaults.preset);
  const initialFilters: FilterValue = {
    preset: f.preset,
    month: f.month,
    from: f.preset === "custom" ? f.from : undefined,
    to: f.preset === "custom" ? f.to : undefined,
    kind: f.kind,
    card: f.card,
  };
  const [totals, breakdown] = await Promise.all([getTotals(scope, f), categoryBreakdown(scope, f)]);

  return (
    <ReportView
      key={user.book.id}
      initialFilters={initialFilters}
      initialData={{ totals, breakdown }}
      defaults={defaults}
      today={user.today}
      currency={user.currency}
    />
  );
}

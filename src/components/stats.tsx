import { ArrowDownRight, ArrowUpRight, CreditCard } from "lucide-react";
import type { Totals } from "@/server/queries";
import { formatDate } from "@/lib/dates";
import { formatMoney, formatPercent } from "@/lib/format";
import { CategoryDot } from "./ui";

function Stat({ label, value, sub, emphasis }: { label: string; value: string; sub?: React.ReactNode; emphasis?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3.5 md:px-5 md:py-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`tabular mt-1 truncate text-lg font-semibold tracking-tight sm:text-xl lg:text-2xl ${emphasis ?? "text-ink"}`} title={value}>
        {value}
      </p>
      {sub ? <div className="mt-1 text-xs text-ink-2">{sub}</div> : null}
    </div>
  );
}

export function StatGrid({
  totals,
  previous,
  currency,
  balance,
}: {
  totals: Totals;
  previous?: Totals;
  currency: string;
  /** Show the running balance first (all-time view) instead of "Net" last. */
  balance?: { since: string | null };
}) {
  let delta: React.ReactNode = null;
  if (previous && previous.spent > 0) {
    const change = (totals.spent - previous.spent) / previous.spent;
    const Arrow = change >= 0 ? ArrowUpRight : ArrowDownRight;
    delta = (
      <span className="inline-flex items-center gap-0.5">
        <Arrow className="size-3.5 shrink-0" aria-hidden />
        {formatPercent(Math.abs(change))} {change >= 0 ? "more" : "less"} than this point last month
      </span>
    );
  }
  // Whole rupees in the tiles so large all-time totals fit on a phone.
  const money = (v: number) => formatMoney(v, currency, { whole: true });
  const netValue = `${totals.net < 0 ? "−" : ""}${money(Math.abs(totals.net))}`;
  const net = (
    <Stat
      label={balance ? "Balance" : "Net"}
      value={netValue}
      emphasis={totals.net < 0 ? "text-negative" : "text-ink"}
      sub={balance ? `Income − spent − saved${balance.since ? ` since ${formatDate(balance.since)}` : ""}` : "Income − spent − saved"}
    />
  );
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {balance && net}
      <Stat
        label="Spent"
        value={money(totals.spent)}
        sub={
          <>
            <span className="flex items-center gap-1">
              <CreditCard className="size-3.5 shrink-0" aria-hidden /> {money(totals.card)} on card
            </span>
            {delta && <span className="mt-0.5 block text-muted">{delta}</span>}
          </>
        }
      />
      <Stat label="Income" value={money(totals.income)} />
      <Stat label="Saved" value={money(totals.saved)} />
      {!balance && net}
    </div>
  );
}

/** Horizontal bar list: one row per category, bar length = share of the largest. */
export function CategoryBars({
  rows,
  currency,
  total,
  limit = 6,
}: {
  rows: { categoryId: string; name: string; color: string; total: number }[];
  currency: string;
  total: number;
  limit?: number;
}) {
  const shown = rows.slice(0, limit);
  const rest = rows.slice(limit).reduce((s, r) => s + r.total, 0);
  const max = Math.max(...shown.map((r) => r.total), rest, 1);
  const items = rest > 0 ? [...shown, { categoryId: "other", name: "Other", color: "other", total: rest }] : shown;

  return (
    <ul className="flex flex-col gap-3 px-5 pb-5">
      {items.map((r) => (
        <li key={r.categoryId}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <CategoryDot color={r.color} />
              <span className="truncate text-ink">{r.name}</span>
            </span>
            <span className="tabular shrink-0 text-ink-2">
              {formatMoney(r.total, currency)}
              <span className="ml-2 inline-block w-11 text-right text-muted">
                {total > 0 ? formatPercent(r.total / total) : ""}
              </span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${Math.max(2, (r.total / max) * 100)}%`,
                background: `var(--series-${r.color}, var(--series-other))`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

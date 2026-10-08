"use client";

import { ArrowDown, ArrowUp, Download, FileText } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BreakdownRow } from "@/server/queries";
import { filtersToSearch, KINDS, resolveDuration } from "@/lib/filters";
import { formatMoney, formatPercent } from "@/lib/format";
import type { ReportResponse } from "@/lib/ledger-types";
import { netExpense, periodLabel } from "@/lib/summary";
import { CategoryDonut } from "./charts";
import { FilterControls, type FilterValue } from "./filter-controls";
import { StatGrid } from "./stats";
import { buttonClass, Card, CardHeader, CategoryDot, EmptyState, Select } from "./ui";

type SortBy = "total" | "name" | "count";
type Sort = { by: SortBy; dir: "asc" | "desc" };

const SORTS: { value: string; label: string; sort: Sort }[] = [
  { value: "total-desc", label: "Amount: high → low", sort: { by: "total", dir: "desc" } },
  { value: "total-asc", label: "Amount: low → high", sort: { by: "total", dir: "asc" } },
  { value: "name-asc", label: "Name: A → Z", sort: { by: "name", dir: "asc" } },
  { value: "name-desc", label: "Name: Z → A", sort: { by: "name", dir: "desc" } },
  { value: "count-desc", label: "Most transactions", sort: { by: "count", dir: "desc" } },
];

function sortRows(rows: BreakdownRow[], s: Sort) {
  const m = s.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (s.by === "name") return m * a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    const d = s.by === "count" ? a.count - b.count : a.total - b.total;
    return m * d || a.name.localeCompare(b.name);
  });
}

/** Reports with instant client-side filters (data from /api/report) and sorting. */
export function ReportView({
  initialFilters,
  initialData,
  defaults,
  today,
  currency,
}: {
  initialFilters: FilterValue;
  initialData: ReportResponse;
  defaults: FilterValue;
  today: string;
  currency: string;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<Sort>({ by: "total", dir: "desc" });
  const cache = useRef(new Map<string, ReportResponse>([[filtersToSearch(initialFilters), initialData]]));
  const abort = useRef<AbortController | null>(null);
  const key = filtersToSearch(filters);
  const first = useRef(true);

  const load = useCallback(async (search: string) => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    const cached = cache.current.get(search);
    if (cached) setData(cached);
    setLoading(true);
    try {
      const res = await fetch(`/api/report${search}`, { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const fresh = (await res.json()) as ReportResponse;
      cache.current.set(search, fresh);
      setData(fresh);
    } catch {
      /* aborted or offline: keep showing the last data */
    } finally {
      if (abort.current === ctrl) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.history.replaceState(null, "", `${window.location.pathname}${key}`);
    load(key);
  }, [key, load]);

  const range = resolveDuration(filters, today);
  const { totals, breakdown } = data;
  const expenses = breakdown.filter((b) => b.kind === "expense").sort((a, b) => b.total - a.total);
  const top = expenses.slice(0, 6);
  const rest = expenses.slice(6).reduce((s, r) => s + r.total, 0);
  const donut = [...top, ...(rest > 0 ? [{ name: "Other", color: "other", total: rest }] : [])];
  const homeLink = (categoryId: string) =>
    `/${filtersToSearch({ preset: filters.preset, month: filters.month, from: filters.from, to: filters.to, card: filters.card, categoryId })}`;
  const sortValue = `${sort.by}-${sort.dir}`;

  const toggle = (by: SortBy) =>
    setSort((s) => (s.by === by ? { by, dir: s.dir === "asc" ? "desc" : "asc" } : { by, dir: by === "name" ? "asc" : "desc" }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <FilterControls value={filters} onChange={setFilters} today={today} defaults={defaults} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-2">
            <span className="font-medium text-ink">{periodLabel(range.from, range.to)}</span> · net expense{" "}
            <span className="tabular font-medium text-ink">{formatMoney(netExpense(breakdown), currency)}</span>{" "}
            <span className="text-muted">(excl. savings &amp; carry forward)</span>
          </p>
          <div className="flex gap-2">
            <a href={`/api/summary${key}`} className={buttonClass("primary", "sm")} download>
              <FileText className="size-4" aria-hidden /> Summary (.txt)
            </a>
            <a href={`/api/export${key}`} className={buttonClass("secondary", "sm")} download>
              <Download className="size-4" aria-hidden /> CSV
            </a>
          </div>
        </div>
      </div>

      <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
        <StatGrid totals={totals} currency={currency} />
      </div>

      {breakdown.length === 0 ? (
        <Card>
          <EmptyState title="No transactions match">Try another duration or clear the filters.</EmptyState>
        </Card>
      ) : (
        <div className={`grid gap-6 lg:grid-cols-3 ${loading ? "opacity-60 transition-opacity" : "transition-opacity"}`}>
          <Card className="lg:col-span-1">
            <CardHeader title="Spending mix" subtitle="Top categories, rest grouped as Other" />
            <div className="px-5 pb-5">
              {expenses.length ? (
                <CategoryDonut data={donut} total={totals.spent} currency={currency} />
              ) : (
                <EmptyState title="No spending here" />
              )}
            </div>
          </Card>

          <Card className="overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-end gap-2 border-b border-line px-5 py-2.5">
              <label htmlFor="report-sort" className="text-xs text-muted">
                Sort
              </label>
              <Select
                id="report-sort"
                value={sortValue}
                onChange={(e) => setSort(SORTS.find((s) => s.value === e.target.value)!.sort)}
                className="h-8 w-auto! text-sm"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            {KINDS.map((k) => {
              const rows = breakdown.filter((b) => b.kind === k.value);
              if (!rows.length) return null;
              const sum = rows.reduce((s, r) => s + r.total, 0);
              return (
                <BreakdownTable
                  key={k.value}
                  title={k.label}
                  rows={sortRows(rows, sort)}
                  sum={sum}
                  sort={sort}
                  onSort={toggle}
                  currency={currency}
                  linkFor={homeLink}
                />
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}

function SortHeader({
  label,
  by,
  sort,
  onSort,
  align = "right",
  className = "",
}: {
  label: string;
  by: SortBy;
  sort: Sort;
  onSort: (by: SortBy) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sort.by === by;
  const Icon = sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`py-2 font-medium ${align === "left" ? "text-left" : "text-right"} ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(by)}
        className={`inline-flex items-center gap-1 hover:text-ink ${active ? "text-ink" : ""}`}
      >
        {label}
        {active && <Icon className="size-3" aria-hidden />}
      </button>
    </th>
  );
}

function BreakdownTable({
  title,
  rows,
  sum,
  sort,
  onSort,
  currency,
  linkFor,
}: {
  title: string;
  rows: BreakdownRow[];
  sum: number;
  sort: Sort;
  onSort: (by: SortBy) => void;
  currency: string;
  linkFor: (categoryId: string) => string;
}) {
  return (
    <table className="w-full text-sm [&+table]:border-t [&+table]:border-line">
      <caption className="px-5 pt-4 pb-2 text-left text-sm font-semibold text-ink">{title}</caption>
      <thead>
        <tr className="text-xs text-muted">
          <SortHeader label="Category" by="name" sort={sort} onSort={onSort} align="left" className="px-5" />
          <SortHeader label="Count" by="count" sort={sort} onSort={onSort} className="hidden px-3 sm:table-cell" />
          <th scope="col" className="px-3 py-2 text-right font-medium">
            Share
          </th>
          <SortHeader label="Total" by="total" sort={sort} onSort={onSort} className="px-5" />
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

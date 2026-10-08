"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CategoryRow } from "@/server/queries";
import { filtersToSearch, resolveDuration } from "@/lib/filters";
import { formatMoney } from "@/lib/format";
import { onLedgerChanged } from "@/lib/ledger-events";
import type { LedgerResponse } from "@/lib/ledger-types";
import { periodLabel } from "@/lib/summary";
import { FilterControls, type FilterValue } from "./filter-controls";
import { StatGrid } from "./stats";
import { TransactionList } from "./transaction-list";
import { Card, EmptyState } from "./ui";

type Data = LedgerResponse;

const searchOf = (f: FilterValue) => filtersToSearch(f);

/**
 * The home page's live transaction list: filters apply instantly on the client,
 * data is fetched from /api/ledger 100 rows at a time as you scroll, and results
 * are cached per filter so going back to a previous filter is immediate.
 */
export function Ledger({
  initialFilters,
  initialData,
  defaults,
  categories,
  today,
  currency,
  balanceView,
  children,
}: {
  initialFilters: FilterValue;
  initialData: Data;
  defaults: FilterValue;
  categories: CategoryRow[];
  today: string;
  currency: string;
  /** All-time book: show the running balance when no date range is applied. */
  balanceView: boolean;
  /** Rendered between the totals and the filters (the add form). */
  children?: ReactNode;
}) {
  const [filters, setFilters] = useState<FilterValue>(initialFilters);
  const [data, setData] = useState<Data>(initialData);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const cache = useRef(new Map<string, Data>([[searchOf(initialFilters), initialData]]));
  const abort = useRef<AbortController | null>(null);
  const key = searchOf(filters);
  // Latest filter key, for async callbacks to check whether their result is still wanted.
  const keyRef = useRef(key);
  useLayoutEffect(() => {
    keyRef.current = key;
  }, [key]);

  const fetchPage = useCallback(async (search: string, cursor: string | null, signal?: AbortSignal) => {
    const qs = new URLSearchParams(search.replace(/^\?/, ""));
    if (cursor) qs.set("cursor", cursor);
    const res = await fetch(`/api/ledger?${qs}`, { signal, cache: "no-store" });
    if (res.status === 401 || res.redirected) {
      router.push("/login");
      throw new Error("Signed out");
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Data;
  }, [router]);

  /** Loads the first page for the current filters (cached data shows immediately). */
  const load = useCallback(
    async (search: string, { force = false } = {}) => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      const cached = force ? undefined : cache.current.get(search);
      if (cached) setData(cached);
      setLoading(true);
      setError(null);
      try {
        const fresh = await fetchPage(search, null, ctrl.signal);
        cache.current.set(search, fresh);
        if (keyRef.current === search) setData(fresh);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Couldn't load transactions. Check your connection.");
      } finally {
        if (abort.current === ctrl) setLoading(false);
      }
    },
    [fetchPage],
  );

  // Keep the URL in sync (bookmarkable, survives reload) without a page navigation.
  useEffect(() => {
    const url = `${window.location.pathname}${key}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", url);
  }, [key]);

  // Fetch when filters change; typing in search is debounced, everything else is immediate.
  const lastQ = useRef(filters.q);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const typing = lastQ.current !== filters.q;
    lastQ.current = filters.q;
    const t = setTimeout(() => load(key), typing ? 250 : 0);
    return () => clearTimeout(t);
  }, [key, filters.q, load]);

  // After an add / edit / delete anywhere on the page: drop the cache and reload.
  useEffect(
    () =>
      onLedgerChanged(() => {
        cache.current.clear();
        load(keyRef.current, { force: true });
      }),
    [load],
  );

  // Infinite scroll: fetch the next 100 rows when the sentinel nears the viewport.
  const sentinel = useRef<HTMLDivElement>(null);
  const loadMore = useCallback(async () => {
    if (!data.nextCursor || loadingMore || loading) return;
    const search = keyRef.current;
    setLoadingMore(true);
    try {
      const more = await fetchPage(search, data.nextCursor);
      if (keyRef.current !== search) return;
      const merged = { ...data, rows: [...data.rows, ...more.rows], nextCursor: more.nextCursor };
      cache.current.set(search, merged);
      setData(merged);
    } catch {
      setError("Couldn't load more. Scroll again to retry.");
    } finally {
      setLoadingMore(false);
    }
  }, [data, loading, loadingMore, fetchPage]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !data.nextCursor) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), { rootMargin: "800px" });
    io.observe(el);
    return () => io.disconnect();
  }, [data.nextCursor, loadMore]);

  const range = resolveDuration(filters, today);
  const label = periodLabel(range.from, range.to);
  const totals = data.totals;
  const showBalance = balanceView && !range.from && !range.to;
  const exportSearch = useMemo(() => key, [key]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink-2">{label}</p>
        {totals && (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <StatGrid
              totals={totals}
              currency={currency}
              layout={balanceView ? "balance" : "full"}
              since={showBalance ? data.since : null}
            />
          </div>
        )}
      </div>

      {children}

      <Card className="overflow-visible">
        <div className="flex flex-col gap-3 px-5 pt-4 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">
              Transactions{" "}
              {totals && <span className="tabular font-normal text-muted">· {totals.count.toLocaleString("en-IN")}</span>}
            </h2>
            <div className="flex items-center gap-1">
              <a
                href={`/api/summary${exportSearch}`}
                download
                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
              >
                <FileText className="size-3.5" aria-hidden /> Summary
              </a>
              <a
                href={`/api/export${exportSearch}`}
                download
                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
              >
                <Download className="size-3.5" aria-hidden /> CSV
              </a>
            </div>
          </div>
          <FilterControls
            value={filters}
            onChange={setFilters}
            today={today}
            categories={categories}
            defaults={defaults}
            showCategory
            showSearch
          />
        </div>

        <div className="relative border-t border-line">
          {/* Thin progress bar while a filter change is loading; the old rows stay visible. */}
          <div
            aria-hidden
            className={`absolute inset-x-0 top-0 h-0.5 overflow-hidden ${loading ? "opacity-100" : "opacity-0"} transition-opacity`}
          >
            <div className="h-full w-1/3 animate-[mm-progress_1s_ease-in-out_infinite] bg-accent" />
          </div>
          {error && <p className="px-5 py-3 text-sm text-negative">{error}</p>}
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
            {data.rows.length ? (
              <TransactionList rows={data.rows} categories={categories} today={today} currency={currency} />
            ) : (
              !loading && <EmptyState title="No transactions match">Try another duration or clear the filters.</EmptyState>
            )}
          </div>
          <div ref={sentinel} />
          {data.nextCursor ? (
            <div className="flex justify-center border-t border-line py-3">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-ink-2 hover:bg-surface-2"
              >
                {loadingMore && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {loadingMore ? "Loading more…" : "Load more"}
              </button>
            </div>
          ) : (
            data.rows.length > 0 &&
            totals && (
              <p className="border-t border-line py-3 text-center text-xs text-muted">
                That&apos;s all · {totals.count.toLocaleString("en-IN")} transactions · net{" "}
                {formatMoney(totals.net, currency)}
              </p>
            )
          )}
        </div>
      </Card>
    </div>
  );
}

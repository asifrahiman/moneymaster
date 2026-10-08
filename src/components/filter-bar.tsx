"use client";

import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { CategoryRow } from "@/server/queries";
import { RANGE_PRESETS } from "@/lib/dates";
import { filtersToSearch, KINDS, type TxFilters } from "@/lib/filters";
import { Input, Select } from "./ui";

type Props = {
  filters: TxFilters;
  categories: CategoryRow[];
  /** Which optional controls to show. */
  show?: { category?: boolean; kind?: boolean; card?: boolean; search?: boolean };
};

export function FilterBar({ filters, categories, show = { category: true, kind: true, card: true, search: true } }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q ?? "");

  function update(next: Partial<TxFilters>) {
    // Any filter change resets to page 1.
    const search = filtersToSearch({ ...filters, ...next, page: 1 });
    startTransition(() => router.replace(`${pathname}${search}`, { scroll: false }));
  }

  // Debounced search box.
  useEffect(() => {
    if ((filters.q ?? "") === q) return;
    const t = setTimeout(() => update({ q: q.trim() || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [q]);

  const active = !!(filters.categoryId || filters.kind || filters.card || filters.q);

  return (
    <div className="flex flex-col gap-3" role="search">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Select
          aria-label="Date range"
          value={filters.preset}
          onChange={(e) => {
            const preset = e.target.value as TxFilters["preset"];
            update(preset === "custom" ? { preset, from: filters.from, to: filters.to } : { preset });
          }}
          className="sm:w-44"
        >
          {RANGE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom range…</option>
        </Select>

        {show.category && (
          <Select
            aria-label="Category"
            value={filters.categoryId ?? ""}
            onChange={(e) => update({ categoryId: e.target.value || undefined })}
            className="sm:w-48"
          >
            <option value="">All categories</option>
            {categories
              .filter((c) => c.saved)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            {categories.some((c) => !c.saved) && (
              <optgroup label="One-time labels">
                {categories
                  .filter((c) => !c.saved)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            )}
          </Select>
        )}

        {show.kind && (
          <Select
            aria-label="Type"
            value={filters.kind ?? ""}
            onChange={(e) => update({ kind: (e.target.value || undefined) as TxFilters["kind"] })}
            className="sm:w-36"
          >
            <option value="">All types</option>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        )}

        {show.card && (
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={!!filters.card}
              onChange={(e) => update({ card: e.target.checked || undefined })}
              className="size-4 accent-[var(--accent)]"
            />
            Card only
          </label>
        )}

        {show.search && (
          <div className="relative col-span-2 sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input
              type="search"
              aria-label="Search notes and categories"
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {active && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              update({ categoryId: undefined, kind: undefined, card: undefined, q: undefined });
            }}
            className="col-span-2 inline-flex h-10 items-center justify-center gap-1 rounded-lg px-3 text-sm text-ink-2 hover:bg-surface-2 sm:col-span-1"
          >
            <X className="size-4" aria-hidden /> Clear
          </button>
        )}
        {pending && <Loader2 className="size-4 animate-spin text-muted" aria-label="Loading" />}
      </div>

      {filters.preset === "custom" && (
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Input
            type="date"
            aria-label="From date"
            value={filters.from ?? ""}
            onChange={(e) => update({ from: e.target.value || undefined })}
            className="sm:w-44"
          />
          <Input
            type="date"
            aria-label="To date"
            value={filters.to ?? ""}
            onChange={(e) => update({ to: e.target.value || undefined })}
            className="sm:w-44"
          />
        </div>
      )}
    </div>
  );
}

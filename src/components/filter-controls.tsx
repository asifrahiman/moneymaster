"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import type { CategoryRow } from "@/server/queries";
import type { DurationPreset, Kind, TxFilters } from "@/lib/filters";
import { Input, Select } from "./ui";

export type FilterValue = Pick<TxFilters, "preset" | "month" | "from" | "to" | "kind" | "card" | "categoryId" | "q">;

const DURATIONS: { value: DurationPreset; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "this-year", label: "This year" },
  { value: "last-12-months", label: "Last 12 months" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
];

function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Small segmented control (like iOS) for a handful of options. */
function Segmented<T extends string | undefined>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex shrink-0 rounded-lg border border-line-strong bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "rounded-md px-2.5 py-1 text-sm whitespace-nowrap transition-colors",
            value === o.value ? "bg-accent-soft font-medium text-accent" : "text-ink-2 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function FilterControls({
  value,
  onChange,
  today,
  categories,
  defaults,
  showCategory = false,
  showSearch = false,
}: {
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  today: string;
  categories?: CategoryRow[];
  /** What "Clear" resets to (the book's default duration). */
  defaults: FilterValue;
  showCategory?: boolean;
  showSearch?: boolean;
}) {
  const set = (patch: Partial<FilterValue>) => onChange({ ...value, ...patch });
  const current = today.slice(0, 7);
  const month = value.month ?? current;
  const isDefault =
    value.preset === defaults.preset &&
    (value.preset !== "month" || month === (defaults.month ?? current)) &&
    !value.kind &&
    value.card === undefined &&
    !value.categoryId &&
    !value.q;

  return (
    <div className="flex flex-col gap-2" role="search">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Duration"
          value={value.preset}
          onChange={(e) => {
            const preset = e.target.value as DurationPreset;
            set({ preset, month: preset === "month" ? month : undefined, from: undefined, to: undefined });
          }}
          className="h-9 w-auto!"
        >
          {DURATIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>

        {value.preset === "month" && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => set({ month: shiftMonth(month, -1) })}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-line-strong bg-surface text-ink-2 hover:bg-surface-2"
            >
              <ChevronLeft className="size-4" />
            </button>
            <input
              type="month"
              aria-label="Month"
              value={month}
              max={current}
              onChange={(e) => e.target.value && set({ month: e.target.value })}
              className="h-9 rounded-lg border border-line-strong bg-surface px-2 text-sm text-ink"
            />
            <button
              type="button"
              aria-label="Next month"
              disabled={month >= current}
              onClick={() => set({ month: shiftMonth(month, 1) })}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-line-strong bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}

        {value.preset === "custom" && (
          <div className="flex items-center gap-1">
            <Input
              type="date"
              aria-label="From date"
              value={value.from ?? ""}
              onChange={(e) => set({ from: e.target.value || undefined })}
              className="h-9 w-auto!"
            />
            <span className="text-muted">–</span>
            <Input
              type="date"
              aria-label="To date"
              value={value.to ?? ""}
              onChange={(e) => set({ to: e.target.value || undefined })}
              className="h-9 w-auto!"
            />
          </div>
        )}

        {showSearch && (
          <div className="relative min-w-40 flex-1 sm:max-w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input
              type="search"
              aria-label="Search notes and categories"
              placeholder="Search…"
              value={value.q ?? ""}
              onChange={(e) => set({ q: e.target.value || undefined })}
              className="h-9 pl-9"
            />
          </div>
        )}
      </div>

      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <Segmented<Kind | undefined>
          label="Type"
          value={value.kind}
          onChange={(kind) => set({ kind })}
          options={[
            { value: undefined, label: "All" },
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
            { value: "savings", label: "Savings" },
          ]}
        />
        <Segmented<"any" | "card" | "nocard">
          label="Credit card"
          value={value.card === undefined ? "any" : value.card ? "card" : "nocard"}
          onChange={(v) => set({ card: v === "any" ? undefined : v === "card" })}
          options={[
            { value: "any", label: "Any payment" },
            { value: "card", label: "Card" },
            { value: "nocard", label: "Not card" },
          ]}
        />
        {showCategory && categories && (
          <Select
            aria-label="Category"
            value={value.categoryId ?? ""}
            onChange={(e) => set({ categoryId: e.target.value || undefined })}
            className="h-9 w-auto! max-w-48 shrink-0"
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
        {!isDefault && (
          <button
            type="button"
            onClick={() => onChange(defaults)}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-sm text-ink-2 hover:bg-surface-2"
          >
            <X className="size-4" aria-hidden /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

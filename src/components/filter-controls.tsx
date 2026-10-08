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
  className,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={clsx("flex rounded-lg border border-line-strong bg-surface p-0.5 sm:inline-flex sm:w-auto sm:shrink-0", className)}
    >
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "flex-1 rounded-md px-2 py-1 text-sm whitespace-nowrap transition-colors sm:flex-none sm:px-2.5",
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
  available,
  defaults,
  showCategory = false,
  showSearch = false,
}: {
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  today: string;
  categories?: CategoryRow[];
  /** Categories with transactions under the other filters (with counts); only these are offered. */
  available?: { id: string; count: number }[] | null;
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

  /*
   * One wrapping row. On phones the pieces stack into full-width rows with the
   * category first and nothing scrolls sideways; from `sm` up the `order-*`
   * classes put them back in a compact toolbar (duration … category, clear).
   */
  return (
    <div className="flex flex-wrap items-center gap-2" role="search">
      {showCategory && categories && (
        <CategorySelect
          categories={categories}
          available={available}
          value={value.categoryId}
          onChange={(categoryId) => set({ categoryId })}
        />
      )}

      <Select
        aria-label="Duration"
        value={value.preset}
        onChange={(e) => {
          const preset = e.target.value as DurationPreset;
          set({ preset, month: preset === "month" ? month : undefined, from: undefined, to: undefined });
        }}
        className={clsx(
          "h-9 sm:order-1 sm:w-auto! sm:flex-none",
          showSearch ? "w-auto! shrink-0" : "flex-1",
        )}
      >
        {DURATIONS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </Select>

      {showSearch && (
        <div className="relative min-w-0 flex-1 sm:order-3 sm:min-w-40 sm:max-w-64">
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

      {value.preset === "month" && (
        <div className="flex basis-full items-center gap-1 sm:order-2 sm:basis-auto">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => set({ month: shiftMonth(month, -1) })}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface text-ink-2 hover:bg-surface-2"
          >
            <ChevronLeft className="size-4" />
          </button>
          <input
            type="month"
            aria-label="Month"
            value={month}
            max={current}
            onChange={(e) => e.target.value && set({ month: e.target.value })}
            className="h-9 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-2 text-sm text-ink sm:flex-none"
          />
          <button
            type="button"
            aria-label="Next month"
            disabled={month >= current}
            onClick={() => set({ month: shiftMonth(month, 1) })}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {value.preset === "custom" && (
        <div className="grid basis-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 sm:order-2 sm:flex sm:basis-auto">
          <Input
            type="date"
            aria-label="From date"
            value={value.from ?? ""}
            onChange={(e) => set({ from: e.target.value || undefined })}
            className="h-9 min-w-0 px-2 sm:w-auto! sm:px-3"
          />
          <span className="text-muted">–</span>
          <Input
            type="date"
            aria-label="To date"
            value={value.to ?? ""}
            onChange={(e) => set({ to: e.target.value || undefined })}
            className="h-9 min-w-0 px-2 sm:w-auto! sm:px-3"
          />
        </div>
      )}

      {/* Toolbar break on wider screens: type / card / category / clear go on the next line. */}
      <div aria-hidden className="hidden sm:order-3 sm:block sm:basis-full" />

      <Segmented<Kind | undefined>
        label="Type"
        value={value.kind}
        onChange={(kind) => set({ kind })}
        className="basis-full sm:order-4 sm:basis-auto"
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
        className="min-w-0 flex-1 sm:order-5 sm:flex-none"
        options={[
          { value: "any", label: "Any payment" },
          { value: "card", label: "Card" },
          { value: "nocard", label: "Not card" },
        ]}
      />
      {!isDefault && (
        <button
          type="button"
          onClick={() => onChange(defaults)}
          aria-label="Clear filters"
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-sm text-ink-2 hover:bg-surface-2 sm:order-7 sm:px-2.5"
        >
          <X className="size-4" aria-hidden /> <span className="hidden sm:inline">Clear</span>
        </button>
      )}
    </div>
  );
}

/**
 * Only the categories that appear in the current list (for the chosen duration,
 * type, card and search), each with its count, most used first. The selected
 * category stays listed even if it no longer matches, so the control never
 * shows a value that isn't an option.
 */
function CategorySelect({
  categories,
  available,
  value,
  onChange,
}: {
  categories: CategoryRow[];
  available?: { id: string; count: number }[] | null;
  value?: string;
  onChange: (id: string | undefined) => void;
}) {
  const counts = new Map((available ?? []).map((a) => [a.id, a.count]));
  const shown = categories
    .filter((c) => counts.has(c.id) || c.id === value || !available)
    .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.name.localeCompare(b.name));
  const saved = shown.filter((c) => c.saved);
  const once = shown.filter((c) => !c.saved);
  const label = (c: CategoryRow) => (counts.has(c.id) ? `${c.name} (${counts.get(c.id)})` : c.name);
  const total = available?.reduce((s, a) => s + a.count, 0);

  return (
    <Select
      aria-label="Category"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="h-9 basis-full sm:order-6 sm:w-auto! sm:max-w-56 sm:basis-auto"
    >
      <option value="">
        {available ? `All categories (${shown.length - (value && !counts.has(value) ? 1 : 0)})` : "All categories"}
      </option>
      {saved.map((c) => (
        <option key={c.id} value={c.id}>
          {label(c)}
        </option>
      ))}
      {once.length > 0 && (
        <optgroup label="One-time labels">
          {once.map((c) => (
            <option key={c.id} value={c.id}>
              {label(c)}
            </option>
          ))}
        </optgroup>
      )}
      {available && shown.length === 0 && total === 0 && <option disabled>No categories in this period</option>}
    </Select>
  );
}

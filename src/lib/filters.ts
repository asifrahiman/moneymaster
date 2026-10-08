import { endOfMonth, isIsoDate, presetRange, RANGE_PRESETS, type RangePreset } from "./dates";

export type Kind = "expense" | "income" | "savings";
export const KINDS: { value: Kind; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "savings", label: "Savings" },
];

/** "month" = one calendar month (with ‹ › stepping), "custom" = from/to dates, else a preset. */
export type DurationPreset = RangePreset | "custom" | "month";

export type TxFilters = {
  preset: DurationPreset;
  /** YYYY-MM when preset is "month". */
  month?: string;
  from?: string;
  to?: string;
  categoryId?: string;
  kind?: Kind;
  /** true = paid by card only, false = not paid by card, undefined = any. */
  card?: boolean;
  q?: string;
  page?: number;
};

export const isMonthKey = (m: unknown): m is string => typeof m === "string" && /^\d{4}-\d{2}$/.test(m) && isIsoDate(`${m}-01`);

/** Resolves a duration to concrete from/to dates. */
export function resolveDuration(
  d: { preset: DurationPreset; month?: string; from?: string; to?: string },
  today: string,
): { from?: string; to?: string } {
  if (d.preset === "month") {
    const m = isMonthKey(d.month) ? d.month : today.slice(0, 7);
    return { from: `${m}-01`, to: endOfMonth(`${m}-01`) };
  }
  if (d.preset === "custom") return { from: d.from, to: d.to };
  return presetRange(d.preset, today);
}

type Params = Record<string, string | string[] | undefined>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function one(p: Params, k: string): string | undefined {
  const v = p[k];
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Parses filters from the URL. Filters live in the URL (not in component state)
 * so they survive reloads, can be bookmarked, and drive server-side queries.
 * Anything malformed is ignored instead of reaching SQL.
 */
export function parseFilters(params: Params, today: string, defaultPreset: DurationPreset = "month"): TxFilters {
  const rawPreset = one(params, "range");
  const from = one(params, "from");
  const to = one(params, "to");
  let preset: DurationPreset = defaultPreset;
  let month: string | undefined;
  let range: { from?: string; to?: string };

  if (rawPreset === "custom" || (!rawPreset && (isIsoDate(from) || isIsoDate(to)))) {
    preset = "custom";
    range = { from: isIsoDate(from) ? from : undefined, to: isIsoDate(to) ? to : undefined };
    if (range.from && range.to && range.from > range.to) range = { from: range.to, to: range.from };
  } else {
    if (rawPreset === "month" || RANGE_PRESETS.some((p) => p.value === rawPreset)) preset = rawPreset as DurationPreset;
    if (preset === "month") {
      const m = one(params, "month");
      month = isMonthKey(m) ? m : today.slice(0, 7);
    }
    range = resolveDuration({ preset, month }, today);
  }

  const categoryId = one(params, "category");
  const kind = one(params, "kind");
  const card = one(params, "card");
  const q = one(params, "q")?.trim().slice(0, 100);
  const page = Math.max(1, Math.min(10_000, Number.parseInt(one(params, "page") ?? "1", 10) || 1));

  return {
    preset,
    month,
    ...range,
    categoryId: categoryId && UUID.test(categoryId) ? categoryId : undefined,
    kind: KINDS.some((k) => k.value === kind) ? (kind as Kind) : undefined,
    card: card === "1" ? true : card === "0" ? false : undefined,
    q: q || undefined,
    page,
  };
}

/** Serialises filters back to a query string (used for links and the CSV export). */
export function filtersToSearch(f: Partial<TxFilters>, overrides: Record<string, string | undefined> = {}): string {
  const sp = new URLSearchParams();
  if (f.preset && f.preset !== "custom") sp.set("range", f.preset);
  if (f.preset === "month" && f.month) sp.set("month", f.month);
  if (f.preset === "custom") {
    sp.set("range", "custom");
    if (f.from) sp.set("from", f.from);
    if (f.to) sp.set("to", f.to);
  }
  if (f.categoryId) sp.set("category", f.categoryId);
  if (f.kind) sp.set("kind", f.kind);
  if (f.card !== undefined) sp.set("card", f.card ? "1" : "0");
  if (f.q) sp.set("q", f.q);
  if (f.page && f.page > 1) sp.set("page", String(f.page));
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) sp.delete(k);
    else sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

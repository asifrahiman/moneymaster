/**
 * Date helpers. All dates are plain "YYYY-MM-DD" strings (calendar dates) so
 * that nothing is ever shifted by a time zone — the root cause of the old
 * convertDate() bugs.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(s: unknown): s is string {
  if (typeof s !== "string" || !ISO_DATE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Today's calendar date in the given IANA time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUtc(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function fromUtc(dt: Date) {
  return dt.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const dt = toUtc(iso);
  dt.setUTCDate(dt.getUTCDate() + days);
  return fromUtc(dt);
}

export function startOfMonth(iso: string): string {
  return iso.slice(0, 8) + "01";
}

export function endOfMonth(iso: string): string {
  const dt = toUtc(startOfMonth(iso));
  dt.setUTCMonth(dt.getUTCMonth() + 1);
  dt.setUTCDate(0);
  return fromUtc(dt);
}

export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(d, last));
  return fromUtc(first);
}

/** "YYYY-MM" keys for the `count` months ending with the month of `iso`. */
export function monthKeys(iso: string, count: number): string[] {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) out.push(addMonths(startOfMonth(iso), -i).slice(0, 7));
  return out;
}

export function formatMonthKey(key: string, style: "short" | "long" = "short"): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: style, year: "2-digit", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(toUtc(iso));
}

export type RangePreset = "this-month" | "last-month" | "last-3-months" | "this-year" | "last-12-months" | "all";

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "this-year", label: "This year" },
  { value: "last-12-months", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

export function presetRange(preset: RangePreset, today: string): { from?: string; to?: string } {
  switch (preset) {
    case "this-month":
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case "last-month": {
      const prev = addMonths(startOfMonth(today), -1);
      return { from: prev, to: endOfMonth(prev) };
    }
    case "last-3-months":
      return { from: addMonths(startOfMonth(today), -2), to: endOfMonth(today) };
    case "this-year":
      return { from: today.slice(0, 4) + "-01-01", to: today.slice(0, 4) + "-12-31" };
    case "last-12-months":
      return { from: addMonths(startOfMonth(today), -11), to: endOfMonth(today) };
    case "all":
      return {};
  }
}

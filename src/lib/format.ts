const formatters = new Map<string, Intl.NumberFormat>();

/** Formats a money value (number or numeric string from Postgres). */
export function formatMoney(
  value: number | string,
  currency = "INR",
  opts: { compact?: boolean; whole?: boolean } = {},
): string {
  const n = typeof value === "string" ? Number(value) : value;
  // Indian short scale for compact INR (K / L / Cr) instead of en-IN's ambiguous "T".
  if (opts.compact && currency === "INR") {
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    const fmt = (x: number, unit: string) => `${sign}₹${Number(x.toFixed(x < 10 ? 1 : 0))}${unit}`;
    if (abs >= 1e7) return fmt(abs / 1e7, "Cr");
    if (abs >= 1e5) return fmt(abs / 1e5, "L");
    if (abs >= 1e3) return fmt(abs / 1e3, "K");
    return `${sign}₹${Math.round(abs)}`;
  }
  const key = `${currency}:${opts.compact ? "c" : opts.whole ? "w" : "f"}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en", {
      style: "currency",
      currency,
      notation: opts.compact ? "compact" : "standard",
      maximumFractionDigits: opts.compact ? 1 : opts.whole ? 0 : 2,
      minimumFractionDigits: opts.compact || opts.whole ? 0 : 2,
    });
    formatters.set(key, f);
  }
  return f.format(n);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD", "JPY"] as const;

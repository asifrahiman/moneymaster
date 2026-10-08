"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonClass } from "./ui";

/** ‹ Month › navigation for month-by-month books, with a native month picker to jump. */
export function MonthNav({ month, current }: { month: string; current: string }) {
  const router = useRouter();
  const shift = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  const next = shift(1);
  const href = (m: string) => (m === current ? "/" : `/?month=${m}`);

  return (
    <div className="flex items-center gap-1.5">
      <Link href={href(shift(-1))} className={buttonClass("secondary", "sm", "w-9 px-0")} aria-label="Previous month" scroll={false}>
        <ChevronLeft className="size-4" />
      </Link>
      <input
        type="month"
        aria-label="Jump to month"
        value={month}
        max={current}
        onChange={(e) => e.target.value && router.push(href(e.target.value), { scroll: false })}
        className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-sm text-ink"
      />
      {next <= current ? (
        <Link href={href(next)} className={buttonClass("secondary", "sm", "w-9 px-0")} aria-label="Next month" scroll={false}>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={buttonClass("secondary", "sm", "w-9 px-0 pointer-events-none opacity-40")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
      {month !== current && (
        <Link href="/" className={buttonClass("ghost", "sm")} scroll={false}>
          This month
        </Link>
      )}
    </div>
  );
}

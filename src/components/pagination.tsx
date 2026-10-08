import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { filtersToSearch, type TxFilters } from "@/lib/filters";
import { buttonClass } from "./ui";

export function Pagination({ filters, pageCount, basePath }: { filters: TxFilters; pageCount: number; basePath: string }) {
  if (pageCount <= 1) return null;
  const page = Math.min(filters.page, pageCount);
  const href = (p: number) => `${basePath}${filtersToSearch({ ...filters, page: p })}`;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
      {page > 1 ? (
        <Link href={href(page - 1)} className={buttonClass("secondary", "sm")} scroll={false}>
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </Link>
      ) : (
        <span className={buttonClass("secondary", "sm", "pointer-events-none opacity-40")}>
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </span>
      )}
      <span className="text-sm text-ink-2 tabular">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} className={buttonClass("secondary", "sm")} scroll={false}>
          Next <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={buttonClass("secondary", "sm", "pointer-events-none opacity-40")}>
          Next <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}

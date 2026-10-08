"use client";

import clsx from "clsx";
import { BookOpen, Check, ChevronsUpDown, Loader2, Settings2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { switchBook } from "@/server/actions";
import type { BookRef } from "@/server/dal";
import { toast } from "./toast";

const periodLabel = (p: BookRef["period"]) => (p === "all" ? "All-time balance" : "Month by month");

export function BookSwitcher({ books, active, compact = false }: { books: BookRef[]; active: BookRef; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={clsx("relative", compact ? "min-w-0" : "w-full")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(
          "flex w-full items-center gap-2 rounded-lg border border-line bg-surface text-left hover:bg-surface-2",
          compact ? "h-9 px-2.5" : "px-3 py-2",
        )}
      >
        {pending ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted" aria-hidden />
        ) : (
          <BookOpen className="size-4 shrink-0 text-accent" aria-hidden />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{active.name}</span>
          {!compact && <span className="block truncate text-[11px] text-muted">{periodLabel(active.period)}</span>}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className={clsx(
            "absolute z-50 mt-1 w-64 rounded-xl border border-line bg-surface py-1 shadow-lg",
            compact ? "right-0" : "left-0",
          )}
        >
          <p className="px-3 pt-1.5 pb-1 text-[11px] font-medium text-muted uppercase">Books</p>
          {books.map((b) => (
            <button
              key={b.id}
              type="button"
              role="menuitemradio"
              aria-checked={b.id === active.id}
              onClick={() => {
                setOpen(false);
                if (b.id === active.id) return;
                start(async () => {
                  const res = await switchBook(b.id);
                  if (!res.ok) toast(res.message ?? "Couldn't switch", "error");
                });
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{b.name}</span>
                <span className="block text-[11px] text-muted">{periodLabel(b.period)}</span>
              </span>
              {b.id === active.id && <Check className="size-4 text-accent" aria-hidden />}
            </button>
          ))}
          <div className="my-1 border-t border-line" />
          <Link
            href="/settings#books"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            <Settings2 className="size-4" aria-hidden /> Manage books
          </Link>
        </div>
      )}
    </div>
  );
}

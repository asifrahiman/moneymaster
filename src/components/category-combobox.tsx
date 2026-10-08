"use client";

import clsx from "clsx";
import { Plus } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import type { CategoryRow } from "@/server/queries";
import { KINDS } from "@/lib/filters";
import { CategoryDot, Input } from "./ui";

type Option =
  | { type: "category"; category: CategoryRow }
  | { type: "new"; name: string };

type Props = {
  id: string;
  categories: CategoryRow[];
  value: string;
  onChange: (name: string) => void;
  invalid?: boolean;
  describedBy?: string;
};

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * Type-to-pick category box. Suggests saved categories (grouped by type) and,
 * once you type, matching one-time labels you've used before. Any other text is
 * offered as a new name.
 */
export function CategoryCombobox({ id, categories, value, onChange, invalid, describedBy }: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = norm(value);
  const options = useMemo<Option[]>(() => {
    const matches = (c: CategoryRow) => !query || c.name.toLowerCase().includes(query);
    const saved = categories.filter((c) => c.saved && matches(c));
    // One-time labels only appear once you start typing, so the default list stays short.
    const oneTime = query
      ? categories
          .filter((c) => !c.saved && matches(c))
          .sort((a, b) => b.txCount - a.txCount)
          .slice(0, 6)
      : [];
    const exact = categories.some((c) => c.name.toLowerCase() === query);
    const opts: Option[] = [];
    // Saved ones in kind order (Expense, Income, Savings), then one-time labels, then
    // "Use <typed text>" last, so Enter picks the best existing match.
    for (const k of KINDS) for (const c of saved.filter((c) => c.kind === k.value)) opts.push({ type: "category", category: c });
    for (const c of oneTime) opts.push({ type: "category", category: c });
    if (query && !exact) opts.push({ type: "new", name: value.replace(/\s+/g, " ").trim() });
    return opts;
  }, [categories, query, value]);

  const activeIndex = Math.min(active, Math.max(0, options.length - 1));
  const show = open && options.length > 0;

  function choose(o: Option) {
    onChange(o.type === "new" ? o.name : o.category.name);
    setOpen(false);
  }

  let lastGroup = "";
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        name="category"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={show ? `${listId}-${activeIndex}` : undefined}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        autoComplete="off"
        placeholder="Type or pick a category"
        value={value}
        maxLength={60}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && show) {
            e.preventDefault();
            choose(options[activeIndex]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {show && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-surface py-1 shadow-lg"
        >
          {options.map((o, i) => {
            const group =
              o.type === "new"
                ? "New"
                : o.category.saved
                  ? KINDS.find((k) => k.value === o.category.kind)!.label
                  : "Used before (one-time)";
            const header = group && group !== lastGroup ? group : null;
            lastGroup = group;
            return (
              <li key={o.type === "new" ? "__new" : o.category.id} role="presentation">
                {header && <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-muted uppercase">{header}</div>}
                <div
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                  onMouseEnter={() => setActive(i)}
                  className={clsx(
                    "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                    i === activeIndex ? "bg-surface-2 text-ink" : "text-ink-2",
                  )}
                >
                  {o.type === "new" ? (
                    <>
                      <Plus className="size-3.5 text-accent" aria-hidden />
                      <span>
                        Use <span className="font-medium text-ink">“{o.name}”</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <CategoryDot color={o.category.color} />
                      <span className="flex-1 truncate">{o.category.name}</span>
                      {!o.category.saved && <span className="text-xs text-muted">{o.category.txCount}×</span>}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

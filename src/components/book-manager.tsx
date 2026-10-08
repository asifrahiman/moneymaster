"use client";

import { Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useCallback, useId, useState, useTransition } from "react";
import { clearFilterQuery } from "@/lib/book-switch";
import { deleteBook, saveBook, switchBook, type ActionState } from "@/server/actions";
import type { BookRef } from "@/server/dal";
import { Modal } from "./modal";
import { toast } from "./toast";
import { Button, Field, Input } from "./ui";

const PERIODS: { value: BookRef["period"]; label: string; hint: string }[] = [
  { value: "all", label: "All-time balance", hint: "Dashboard shows a running total since the first entry." },
  { value: "month", label: "Month by month", hint: "Dashboard shows one month at a time." },
];

export function BookManager({ books, activeId }: { books: BookRef[]; activeId: string }) {
  const [editing, setEditing] = useState<BookRef | "new" | null>(null);
  const [removing, setRemoving] = useState<BookRef | null>(null);
  const [pending, start] = useTransition();
  const close = useCallback(() => {
    setEditing(null);
    setRemoving(null);
  }, []);

  return (
    <>
      <ul className="divide-y divide-line border-t border-line">
        {books.map((b) => (
          <li key={b.id} className="flex items-center gap-3 px-5 py-3">
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                {b.name}
                {b.id === activeId && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
                    <Check className="size-3" aria-hidden /> Open
                  </span>
                )}
              </span>
              <span className="block text-xs text-muted">{PERIODS.find((p) => p.value === b.period)!.label}</span>
            </span>
            {b.id !== activeId && (
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    clearFilterQuery();
                    const res = await switchBook(b.id);
                    toast(res.message ?? "Switched", res.ok ? "success" : "error");
                  })
                }
              >
                Open
              </Button>
            )}
            <button
              type="button"
              onClick={() => setEditing(b)}
              className="rounded-lg p-2 text-ink-2 hover:bg-surface-2"
              aria-label={`Edit ${b.name}`}
            >
              <Pencil className="size-4" />
            </button>
            {books.length > 1 && (
              <button
                type="button"
                onClick={() => setRemoving(b)}
                className="rounded-lg p-2 text-ink-2 hover:bg-surface-2 hover:text-negative"
                aria-label={`Delete ${b.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="border-t border-line px-5 py-3">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="size-4" aria-hidden /> New book
        </Button>
      </div>

      <Modal open={editing !== null} onClose={close} title={editing === "new" ? "New book" : "Edit book"} size="sm">
        {editing !== null && (
          <BookForm key={editing === "new" ? "new" : editing.id} book={editing === "new" ? undefined : editing} onDone={close} />
        )}
      </Modal>
      <Modal open={removing !== null} onClose={close} title={`Delete “${removing?.name ?? ""}”?`} size="sm">
        {removing && <DeleteBook book={removing} onDone={close} />}
      </Modal>
    </>
  );
}

function BookForm({ book, onDone }: { book?: BookRef; onDone: () => void }) {
  const uid = useId();
  const [name, setName] = useState(book?.name ?? "");
  const [period, setPeriod] = useState<BookRef["period"]>(book?.period ?? "month");
  const [starter, setStarter] = useState(true);
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, form) => {
    const res = await saveBook(prev, form);
    if (res.ok) {
      toast(res.message ?? "Saved");
      onDone();
    } else if (res.message) toast(res.message, "error");
    return res;
  }, { ok: false });
  const err = state.ok ? undefined : state.fieldErrors;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {book && <input type="hidden" name="id" value={book.id} />}
      <Field label="Name" htmlFor={`${uid}-name`} error={err?.name}>
        <Input
          id={`${uid}-name`}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="e.g. Monthly, Household, Business"
          autoFocus
          aria-invalid={!!err?.name}
        />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-xs font-medium text-ink-2">View</legend>
        {PERIODS.map((p) => (
          <label
            key={p.value}
            className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-3 has-checked:border-accent has-checked:bg-accent-soft"
          >
            <input
              type="radio"
              name="period"
              value={p.value}
              checked={period === p.value}
              onChange={() => setPeriod(p.value)}
              className="mt-0.5 accent-[var(--accent)]"
            />
            <span>
              <span className="block text-sm font-medium text-ink">{p.label}</span>
              <span className="block text-xs text-muted">{p.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {!book && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="starter"
            checked={starter}
            onChange={(e) => setStarter(e.target.checked)}
            className="size-4 accent-[var(--accent)]"
          />
          Start with common categories
        </label>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {book ? "Save" : "Create & open"}
        </Button>
      </div>
    </form>
  );
}

function DeleteBook({ book, onDone }: { book: BookRef; onDone: () => void }) {
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-2">
        This permanently deletes the book with all its transactions and categories. Type{" "}
        <span className="font-medium text-ink">{book.name}</span> to confirm.
      </p>
      <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Book name" autoFocus />
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Cancel</Button>
        <Button
          variant="danger"
          disabled={pending || confirm.trim().toLowerCase() !== book.name.toLowerCase()}
          onClick={() =>
            start(async () => {
              const res = await deleteBook(book.id, confirm);
              toast(res.message ?? "Done", res.ok ? "success" : "error");
              if (res.ok) onDone();
            })
          }
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Delete book
        </Button>
      </div>
    </div>
  );
}

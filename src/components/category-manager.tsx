"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useCallback, useId, useState, useTransition } from "react";
import { deleteCategory, saveCategory, type ActionState } from "@/server/actions";
import type { CategoryRow } from "@/server/queries";
import { KINDS, type Kind } from "@/lib/filters";
import { SERIES_SLOTS, SLOT_NAMES } from "@/lib/palette";
import { Modal } from "./modal";
import { toast } from "./toast";
import { Button, CategoryDot, Field, Input, Select } from "./ui";

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [editing, setEditing] = useState<CategoryRow | "new" | null>(null);
  const [removing, setRemoving] = useState<CategoryRow | null>(null);
  const close = useCallback(() => {
    setEditing(null);
    setRemoving(null);
  }, []);

  return (
    <>
      <div className="divide-y divide-line">
        {KINDS.map((k) => {
          const items = categories.filter((c) => c.kind === k.value);
          if (!items.length) return null;
          return (
            <div key={k.value}>
              <h3 className="bg-surface-2/60 px-5 py-1.5 text-xs font-medium text-muted">{k.label}</h3>
              <ul className="divide-y divide-line">
                {items.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-2.5">
                    <CategoryDot color={c.color} />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{c.name}</span>
                    <span className="tabular text-xs text-muted">{c.txCount} txns</span>
                    <button
                      type="button"
                      onClick={() => setEditing(c)}
                      className="rounded-lg p-2 text-ink-2 hover:bg-surface-2"
                      aria-label={`Edit ${c.name}`}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoving(c)}
                      className="rounded-lg p-2 text-ink-2 hover:bg-surface-2 hover:text-negative"
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t border-line px-5 py-3">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="size-4" aria-hidden /> New category
        </Button>
      </div>

      <Modal open={editing !== null} onClose={close} title={editing === "new" ? "New category" : "Edit category"} size="sm">
        {editing !== null && (
          <CategoryForm key={editing === "new" ? "new" : editing.id} category={editing === "new" ? undefined : editing} onDone={close} />
        )}
      </Modal>

      <Modal open={removing !== null} onClose={close} title={`Delete “${removing?.name ?? ""}”?`} size="sm">
        {removing && <DeleteCategory category={removing} others={categories.filter((c) => c.id !== removing.id)} onDone={close} />}
      </Modal>
    </>
  );
}

function CategoryForm({ category, onDone }: { category?: CategoryRow; onDone: () => void }) {
  const uid = useId();
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, form) => {
    const res = await saveCategory(prev, form);
    if (res.ok) {
      toast(res.message ?? "Saved");
      onDone();
    } else if (res.message) toast(res.message, "error");
    return res;
  }, { ok: false });
  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<Kind>(category?.kind ?? "expense");
  const [color, setColor] = useState(category?.color ?? "");

  const err = state.ok ? undefined : state.fieldErrors;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {category && <input type="hidden" name="id" value={category.id} />}
      <Field label="Name" htmlFor={`${uid}-name`} error={err?.name}>
        <Input id={`${uid}-name`} name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus aria-invalid={!!err?.name} />
      </Field>
      <Field label="Type" htmlFor={`${uid}-kind`} hint="Income and savings are excluded from spending totals.">
        <Select id={`${uid}-kind`} name="kind" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </Select>
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-ink-2">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {SERIES_SLOTS.map((s) => (
            <label key={s} className="cursor-pointer" title={SLOT_NAMES[s]}>
              <input
                type="radio"
                name="color"
                value={s}
                checked={color === s}
                onChange={() => setColor(s)}
                className="peer sr-only"
              />
              <span
                className="block size-8 rounded-full ring-offset-2 ring-offset-[var(--surface)] peer-checked:ring-2 peer-checked:ring-[var(--ink)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)]"
                style={{ background: `var(--series-${s})` }}
              />
              <span className="sr-only">{SLOT_NAMES[s]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end gap-2 pt-1">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Save
        </Button>
      </div>
    </form>
  );
}

function DeleteCategory({ category, others, onDone }: { category: CategoryRow; others: CategoryRow[]; onDone: () => void }) {
  const [moveTo, setMoveTo] = useState(others.find((o) => o.kind === category.kind)?.id ?? others[0]?.id ?? "");
  const [pending, start] = useTransition();
  const needsMove = category.txCount > 0;

  return (
    <div className="flex flex-col gap-4">
      {needsMove ? (
        others.length ? (
          <Field label={`Move its ${category.txCount} transactions to`} htmlFor="move-to">
            <Select id="move-to" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
              {others.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="text-sm text-ink-2">Create another category first so its transactions have somewhere to go.</p>
        )
      ) : (
        <p className="text-sm text-ink-2">This category has no transactions.</p>
      )}
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Cancel</Button>
        <Button
          variant="danger"
          disabled={pending || (needsMove && !moveTo)}
          onClick={() =>
            start(async () => {
              const res = await deleteCategory(category.id, needsMove ? moveTo : undefined);
              toast(res.message ?? "Done", res.ok ? "success" : "error");
              if (res.ok) onDone();
            })
          }
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {needsMove ? "Move & delete" : "Delete"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useId, useRef, useState } from "react";
import { saveTransaction, type ActionState } from "@/server/actions";
import type { CategoryRow, TxRow } from "@/server/queries";
import { isFormula, parseAmount } from "@/lib/amount";
import { isOneOffCategory, KINDS, NEW_CATEGORY, ONE_OFF, type Kind } from "@/lib/filters";
import { formatMoney } from "@/lib/format";
import { Button, Field, Input, Select } from "./ui";
import { toast } from "./toast";

type Props = {
  categories: CategoryRow[];
  today: string;
  currency: string;
  transaction?: TxRow;
  onDone?: () => void;
  submitLabel?: string;
};

export function TransactionForm({ categories, today, currency, transaction, onDone, submitLabel }: Props) {
  const uid = useId();
  // The catch-all "Others" category isn't listed; it's reached through the "One-time…" option.
  const listed = categories.filter((c) => !isOneOffCategory(c.name));
  const [categoryId, setCategoryId] = useState(
    transaction ? (isOneOffCategory(transaction.categoryName) ? ONE_OFF : transaction.categoryId) : "",
  );
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<Kind>("expense");
  const [amount, setAmount] = useState(transaction ? String(Number(transaction.amount)) : "");
  const [date, setDate] = useState(transaction?.occurredOn ?? today);
  const [card, setCard] = useState(transaction?.paidByCard ?? false);
  const [note, setNote] = useState(transaction?.note ?? "");
  const amountRef = useRef<HTMLInputElement>(null);

  // Wrap the server action so success handling (toast, reset, close) runs in
  // the same transition instead of in an effect.
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, form) => {
    const res = await saveTransaction(prev, form);
    if (res.ok) {
      toast(res.message ?? "Saved");
      if (!transaction) {
        setAmount("");
        setNote("");
        setNewName("");
        setCard(false);
        if (categoryId === NEW_CATEGORY || categoryId === ONE_OFF) setCategoryId("");
        amountRef.current?.focus();
      }
      onDone?.();
    } else if (res.message) {
      toast(res.message, "error");
    }
    return res;
  }, { ok: false });

  const err = state.ok ? undefined : state.fieldErrors;
  const preview = amount && isFormula(amount) ? parseAmount(amount) : null;
  const oneOff = categoryId === ONE_OFF;
  const selectedKind =
    categoryId === NEW_CATEGORY ? newKind : categories.find((c) => c.id === categoryId)?.kind ?? "expense";
  const id = (name: string) => `${uid}-${name}`;

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
      {transaction && <input type="hidden" name="id" value={transaction.id} />}

      <Field label="Category" htmlFor={id("category")} error={err?.categoryId}>
        <Select
          id={id("category")}
          name="categoryId"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-invalid={!!err?.categoryId}
          required
        >
          <option value="" disabled>
            Choose…
          </option>
          {KINDS.map((k) => {
            const items = listed.filter((c) => c.kind === k.value);
            return items.length ? (
              <optgroup key={k.value} label={k.label}>
                {items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ) : null;
          })}
          <optgroup label="Other">
            <option value={ONE_OFF}>One-time (don&apos;t save as a category)…</option>
            <option value={NEW_CATEGORY}>+ New category…</option>
          </optgroup>
        </Select>
      </Field>

      <Field
        label="Amount"
        htmlFor={id("amount")}
        error={err?.amount}
        hint={
          preview ? (
            preview.ok ? (
              <span className="tabular text-ink-2">= {formatMoney(preview.value, currency)}</span>
            ) : (
              <span className="text-negative">{preview.error}</span>
            )
          ) : (
            "Tip: you can type a sum like 120+80"
          )
        }
      >
        <Input
          ref={amountRef}
          id={id("amount")}
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={!!err?.amount}
          className="tabular"
          required
        />
      </Field>

      {categoryId === NEW_CATEGORY && (
        <div className="grid grid-cols-2 gap-4 sm:col-span-2">
          <Field label="New category name" htmlFor={id("newName")} error={err?.newCategoryName}>
            <Input
              id={id("newName")}
              name="newCategoryName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={40}
              autoFocus
              aria-invalid={!!err?.newCategoryName}
            />
          </Field>
          <Field label="Type" htmlFor={id("newKind")}>
            <Select
              id={id("newKind")}
              name="newCategoryKind"
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as Kind)}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      <Field label="Date" htmlFor={id("date")} error={err?.occurredOn}>
        <Input
          id={id("date")}
          name="occurredOn"
          type="date"
          value={date}
          max="2100-12-31"
          onChange={(e) => setDate(e.target.value)}
          aria-invalid={!!err?.occurredOn}
          required
        />
      </Field>

      <Field
        label={oneOff ? "What was it?" : "Note (optional)"}
        htmlFor={id("note")}
        error={err?.note}
        hint={oneOff ? "Saved under “Others” — your category list stays the same." : undefined}
      >
        <Input
          id={id("note")}
          name="note"
          value={note}
          maxLength={200}
          placeholder={oneOff ? "e.g. Washing machine repair" : "e.g. Dinner with Sam"}
          onChange={(e) => setNote(e.target.value)}
          aria-invalid={!!err?.note}
          autoFocus={oneOff && !transaction}
          required={oneOff}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
        <label
          className={`flex cursor-pointer items-center gap-2.5 text-sm ${selectedKind === "expense" ? "text-ink" : "text-muted"}`}
        >
          <input
            type="checkbox"
            name="paidByCard"
            checked={card}
            onChange={(e) => setCard(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative h-5 w-9 rounded-full bg-line-strong transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
          />
          Paid by credit card
        </label>
        <Button type="submit" variant="primary" disabled={pending} className="min-w-32">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {submitLabel ?? (transaction ? "Save changes" : "Add transaction")}
        </Button>
      </div>
    </form>
  );
}

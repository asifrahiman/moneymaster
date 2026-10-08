"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useId, useRef, useState } from "react";
import { saveTransaction, type ActionState } from "@/server/actions";
import type { CategoryRow, TxRow } from "@/server/queries";
import { isFormula, parseAmount } from "@/lib/amount";
import { KINDS, type Kind } from "@/lib/filters";
import { formatMoney } from "@/lib/format";
import { notifyLedgerChanged } from "@/lib/ledger-events";
import { CategoryCombobox } from "./category-combobox";
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

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

export function TransactionForm({ categories, today, currency, transaction, onDone, submitLabel }: Props) {
  const uid = useId();
  const [category, setCategory] = useState(transaction?.categoryName ?? "");
  const [saveAsCategory, setSaveAsCategory] = useState(false);
  const [newKind, setNewKind] = useState<Kind>("expense");
  const [amount, setAmount] = useState(transaction ? String(Number(transaction.amount)) : "");
  const [date, setDate] = useState(transaction?.occurredOn ?? today);
  const [card, setCard] = useState(transaction?.paidByCard ?? false);
  const [note, setNote] = useState(transaction?.note ?? "");
  const amountRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Wrap the server action so success handling (toast, reset, close) runs in
  // the same transition instead of in an effect.
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, form) => {
    const res = await saveTransaction(prev, form);
    if (res.ok) {
      toast(res.message ?? "Saved");
      notifyLedgerChanged();
      // New category: update the pickers in the background without holding up the form.
      if (res.categoriesChanged) startTransition(() => router.refresh());
      if (!transaction) {
        setAmount("");
        setNote("");
        setCard(false);
        setSaveAsCategory(false);
        setCategory("");
      }
      onDone?.();
    } else if (res.message) {
      toast(res.message, "error");
    }
    return res;
  }, { ok: false });

  const err = state.ok ? undefined : state.fieldErrors;
  const preview = amount && isFormula(amount) ? parseAmount(amount) : null;
  const match = categories.find((c) => c.name.toLowerCase() === norm(category));
  const isNew = !!norm(category) && !match;
  const kind = match ? match.kind : newKind;
  const id = (name: string) => `${uid}-${name}`;

  let categoryHint: React.ReactNode = "Pick a saved category or type anything.";
  if (match?.saved) categoryHint = `${KINDS.find((k) => k.value === match.kind)!.label} category`;
  else if (match) categoryHint = `One-time · used ${match.txCount}× before`;
  else if (isNew) categoryHint = saveAsCategory ? "New category" : "One-time — won’t be added to your category list";

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
      {transaction && <input type="hidden" name="id" value={transaction.id} />}

      <Field label="Category" htmlFor={id("category")} error={err?.category} hint={categoryHint}>
        <CategoryCombobox
          id={id("category")}
          categories={categories}
          value={category}
          onChange={setCategory}
          invalid={!!err?.category}
        />
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

      {(isNew || (match && !match.saved)) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-surface-2 px-3 py-2.5 text-sm sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-ink">
            <input
              type="checkbox"
              name="saveCategory"
              checked={saveAsCategory}
              onChange={(e) => setSaveAsCategory(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Save “{category.trim()}” as a category
          </label>
          {isNew && (
            <label className="flex items-center gap-2 text-ink-2">
              Type
              <Select
                name="categoryKind"
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as Kind)}
                className="h-8 w-auto! py-0 text-sm"
                aria-label="Type"
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </label>
          )}
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

      <Field label="Note (optional)" htmlFor={id("note")}>
        <Input
          id={id("note")}
          name="note"
          value={note}
          maxLength={200}
          placeholder="e.g. Dinner with Sam"
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
        <label className={`flex cursor-pointer items-center gap-2.5 text-sm ${kind === "expense" ? "text-ink" : "text-muted"}`}>
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

"use client";

import { CreditCard, Loader2, Trash2 } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { deleteTransaction } from "@/server/actions";
import type { CategoryRow, TxRow } from "@/server/queries";
import { formatDate } from "@/lib/dates";
import { isOneOffCategory } from "@/lib/filters";
import { formatMoney } from "@/lib/format";
import { Modal } from "./modal";
import { toast } from "./toast";
import { TransactionForm } from "./transaction-form";
import { Button, CategoryDot } from "./ui";

type Props = {
  rows: TxRow[];
  categories: CategoryRow[];
  today: string;
  currency: string;
};

export function Amount({ value, kind, currency }: { value: string | number; kind: TxRow["kind"]; currency: string }) {
  return (
    <span className={`tabular font-medium ${kind === "income" ? "text-positive" : "text-ink"}`}>
      {kind === "income" ? "+" : kind === "expense" ? "−" : ""}
      {formatMoney(value, currency)}
    </span>
  );
}

export function TransactionList({ rows, categories, today, currency }: Props) {
  const [editing, setEditing] = useState<TxRow | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();
  const close = useCallback(() => {
    setEditing(null);
    setConfirming(false);
  }, []);

  // Group rows under date headings.
  const groups: { date: string; rows: TxRow[] }[] = [];
  for (const r of rows) {
    const last = groups.at(-1);
    if (last?.date === r.occurredOn) last.rows.push(r);
    else groups.push({ date: r.occurredOn, rows: [r] });
  }

  return (
    <>
      <div className="divide-y divide-line">
        {groups.map((g) => (
          <div key={g.date}>
            <h3 className="bg-surface-2/60 px-5 py-1.5 text-xs font-medium text-muted">
              {g.date === today ? "Today" : formatDate(g.date)}
            </h3>
            <ul>
              {g.rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setEditing(r)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2"
                    aria-label={`Edit ${r.categoryName} ${formatMoney(r.amount, currency)} on ${formatDate(r.occurredOn)}`}
                  >
                    <CategoryDot color={r.categoryColor} />
                    <span className="min-w-0 flex-1">
                      {isOneOffCategory(r.categoryName) && r.note ? (
                        // One-time entry: what it was matters more than the catch-all category.
                        <>
                          <span className="block truncate text-sm font-medium text-ink">{r.note}</span>
                          <span className="block truncate text-xs text-muted">{r.categoryName}</span>
                        </>
                      ) : (
                        <>
                          <span className="block truncate text-sm font-medium text-ink">{r.categoryName}</span>
                          {r.note && <span className="block truncate text-xs text-muted">{r.note}</span>}
                        </>
                      )}
                    </span>
                    {r.paidByCard && (
                      <span
                        className="inline-flex items-center gap-1 rounded-md border border-line px-1.5 py-0.5 text-[11px] text-ink-2"
                        title="Paid by credit card"
                      >
                        <CreditCard className="size-3" aria-hidden />
                        <span className="hidden sm:inline">Card</span>
                      </span>
                    )}
                    <Amount value={r.amount} kind={r.kind} currency={currency} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Modal open={!!editing && !confirming} onClose={close} title="Edit transaction">
        {editing && (
          <>
            <TransactionForm
              key={editing.id}
              categories={categories}
              today={today}
              currency={currency}
              transaction={editing}
              onDone={close}
            />
            <div className="mt-4 border-t border-line pt-4">
              <Button variant="ghost" size="sm" className="text-negative" onClick={() => setConfirming(true)}>
                <Trash2 className="size-4" aria-hidden /> Delete transaction
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!editing && confirming} onClose={close} title="Delete transaction?" size="sm">
        {editing && (
          <>
            <p className="text-sm text-ink-2">
              {editing.categoryName} · {formatMoney(editing.amount, currency)} on {formatDate(editing.occurredOn)}. This
              can&apos;t be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setConfirming(false)}>Cancel</Button>
              <Button
                variant="danger"
                disabled={deleting}
                onClick={() =>
                  startDelete(async () => {
                    const res = await deleteTransaction(editing.id);
                    toast(res.message ?? (res.ok ? "Deleted" : "Couldn't delete"), res.ok ? "success" : "error");
                    if (res.ok) close();
                  })
                }
              >
                {deleting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Delete
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

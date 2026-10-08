"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import type { CategoryRow } from "@/server/queries";
import { Modal } from "./modal";
import { TransactionForm } from "./transaction-form";
import { Button } from "./ui";

/**
 * Opens the add form in a dialog. `fab` renders a floating round button for
 * phones (sits above the bottom navigation; hidden on larger screens, where the
 * form is shown inline).
 */
export function AddTransactionButton({
  fab = false,
  ...props
}: {
  categories: CategoryRow[];
  today: string;
  currency: string;
  fab?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      {fab ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Add transaction"
          className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-lg shadow-black/20 active:scale-95 md:hidden"
        >
          <Plus className="size-6" aria-hidden />
        </button>
      ) : (
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus className="size-4" aria-hidden /> Add
        </Button>
      )}
      <Modal open={open} onClose={close} title="Add transaction">
        <TransactionForm {...props} onDone={close} />
      </Modal>
    </>
  );
}

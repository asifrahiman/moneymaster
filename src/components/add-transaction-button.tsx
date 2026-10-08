"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import type { CategoryRow } from "@/server/queries";
import { Modal } from "./modal";
import { TransactionForm } from "./transaction-form";
import { Button } from "./ui";

export function AddTransactionButton(props: { categories: CategoryRow[]; today: string; currency: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden /> Add
      </Button>
      <Modal open={open} onClose={close} title="Add transaction">
        <TransactionForm {...props} onDone={close} />
      </Modal>
    </>
  );
}

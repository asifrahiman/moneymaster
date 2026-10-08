"use server";

import { and, count, eq, ne, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { signOut } from "@/auth";
import { db } from "@/db";
import { categories, transactions, users } from "@/db/schema";
import { parseAmount } from "@/lib/amount";
import { isIsoDate } from "@/lib/dates";
import { CURRENCIES } from "@/lib/format";
import { isSlot, nextSlot } from "@/lib/palette";
import { requireUser } from "./dal";

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Changes on every successful submit so forms can reset themselves. */
  at?: number;
};

const kindSchema = z.enum(["expense", "income", "savings"]);
const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(60, "Keep it under 60 characters");

function fail(fieldErrors: Record<string, string>, message?: string): ActionState {
  return { ok: false, fieldErrors, message };
}

function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23505" || err?.cause?.code === "23505";
}

/* ------------------------------------------------------------------ */
/* Transactions                                                        */
/* ------------------------------------------------------------------ */

export async function saveTransaction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();

  const id = String(form.get("id") ?? "") || null;
  const amountRaw = String(form.get("amount") ?? "");
  const occurredOn = String(form.get("occurredOn") ?? "");
  const paidByCard = form.get("paidByCard") === "on";
  const note = String(form.get("note") ?? "").trim().slice(0, 200) || null;
  // The category is chosen by name: an existing category (saved or one-time) is reused;
  // a new name becomes a one-time label unless "save as category" is ticked.
  const categoryName = nameSchema.safeParse(String(form.get("category") ?? "").replace(/\s+/g, " "));
  const saveAsCategory = form.get("saveCategory") === "on";
  const kind = kindSchema.safeParse(form.get("categoryKind") ?? "expense");

  const errors: Record<string, string> = {};
  const amount = parseAmount(amountRaw);
  if (!amount.ok) errors.amount = amount.error;
  if (!isIsoDate(occurredOn)) errors.occurredOn = "Pick a valid date";
  if (!categoryName.success) errors.category = categoryName.error.issues[0].message;
  if (Object.keys(errors).length || !amount.ok || !categoryName.success) return fail(errors);
  const name = categoryName.data;

  try {
    await db.transaction(async (tx) => {
      let categoryId: string;
      const existing = await tx.query.categories.findFirst({
        where: and(eq(categories.userId, user.id), sql`lower(${categories.name}) = lower(${name})`),
      });
      if (existing) {
        categoryId = existing.id;
        if (saveAsCategory && !existing.saved) {
          await tx.update(categories).set({ saved: true }).where(eq(categories.id, existing.id));
        }
      } else {
        const used = await tx.select({ color: categories.color }).from(categories).where(eq(categories.userId, user.id));
        const [created] = await tx
          .insert(categories)
          .values({
            userId: user.id,
            name,
            kind: kind.success ? kind.data : "expense",
            saved: saveAsCategory,
            color: nextSlot(used.map((u) => u.color)),
          })
          .returning({ id: categories.id });
        categoryId = created.id;
      }

      const values = { categoryId, amount: amount.value.toFixed(2), occurredOn, paidByCard, note };
      if (id) {
        const updated = await tx
          .update(transactions)
          .set(values)
          .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
          .returning({ id: transactions.id });
        if (!updated.length) throw new FieldError("_", "That transaction no longer exists");
      } else {
        await tx.insert(transactions).values({ ...values, userId: user.id });
      }
    });
  } catch (e) {
    if (e instanceof FieldError) return fail({ [e.field]: e.message }, e.field === "_" ? e.message : undefined);
    console.error("saveTransaction failed", e);
    return { ok: false, message: "Couldn't save. Please try again." };
  }

  refresh();
  return { ok: true, message: id ? "Transaction updated" : "Transaction added", at: Date.now() };
}

export async function deleteTransaction(id: string): Promise<ActionState> {
  const user = await requireUser();
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Invalid id" };
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));
  refresh();
  return { ok: true, message: "Transaction deleted", at: Date.now() };
}

class FieldError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
  }
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export async function saveCategory(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(form.get("id") ?? "") || null;
  const name = nameSchema.safeParse(form.get("name") ?? "");
  const kind = kindSchema.safeParse(form.get("kind") ?? "expense");
  const colorRaw = form.get("color");

  if (!name.success) return fail({ name: name.error.issues[0].message });
  if (!kind.success) return fail({ kind: "Choose a type" });
  if (id && !z.uuid().safeParse(id).success) return { ok: false, message: "Invalid id" };

  try {
    if (id) {
      const updated = await db
        .update(categories)
        .set({ name: name.data, kind: kind.data, ...(isSlot(colorRaw) ? { color: colorRaw } : {}) })
        .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
        .returning({ id: categories.id });
      if (!updated.length) return { ok: false, message: "That category no longer exists" };
    } else {
      const used = await db.select({ color: categories.color }).from(categories).where(eq(categories.userId, user.id));
      await db.insert(categories).values({
        userId: user.id,
        name: name.data,
        kind: kind.data,
        color: isSlot(colorRaw) ? colorRaw : nextSlot(used.map((u) => u.color)),
      });
    }
  } catch (e) {
    if (isUniqueViolation(e)) return fail({ name: "You already have a category with that name" });
    console.error("saveCategory failed", e);
    return { ok: false, message: "Couldn't save. Please try again." };
  }

  refresh();
  return { ok: true, message: id ? "Category updated" : "Category added", at: Date.now() };
}

/** Turns a one-time label into a saved category (or back). */
export async function setCategorySaved(id: string, saved: boolean): Promise<ActionState> {
  const user = await requireUser();
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Invalid id" };
  const updated = await db
    .update(categories)
    .set({ saved })
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
    .returning({ name: categories.name });
  if (!updated.length) return { ok: false, message: "That category no longer exists" };
  refresh();
  return {
    ok: true,
    message: saved ? `“${updated[0].name}” saved as a category` : `“${updated[0].name}” is now one-time`,
    at: Date.now(),
  };
}

/**
 * Deletes a category. If it still has transactions they must be moved to
 * another category first (the old app silently orphaned rows instead).
 */
export async function deleteCategory(id: string, moveTo?: string): Promise<ActionState> {
  const user = await requireUser();
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Invalid id" };
  if (moveTo && (!z.uuid().safeParse(moveTo).success || moveTo === id))
    return { ok: false, message: "Choose a different category" };

  const result = await db.transaction(async (tx) => {
    const own = and(eq(categories.id, id), eq(categories.userId, user.id));
    const cat = await tx.query.categories.findFirst({ where: own, columns: { id: true } });
    if (!cat) return { ok: false, message: "That category no longer exists" } as ActionState;

    const [{ n }] = await tx
      .select({ n: count() })
      .from(transactions)
      .where(and(eq(transactions.categoryId, id), eq(transactions.userId, user.id)));

    if (n > 0) {
      if (!moveTo) return { ok: false, message: `This category has ${n} transactions. Choose where to move them.` };
      const target = await tx.query.categories.findFirst({
        where: and(eq(categories.id, moveTo), eq(categories.userId, user.id), ne(categories.id, id)),
        columns: { id: true },
      });
      if (!target) return { ok: false, message: "Choose a different category" };
      await tx
        .update(transactions)
        .set({ categoryId: moveTo })
        .where(and(eq(transactions.categoryId, id), eq(transactions.userId, user.id)));
    }
    await tx.delete(categories).where(own);
    return { ok: true, message: n > 0 ? `Deleted and moved ${n} transactions` : "Category deleted", at: Date.now() };
  });

  if (result.ok) refresh();
  return result;
}

/* ------------------------------------------------------------------ */
/* Settings & session                                                  */
/* ------------------------------------------------------------------ */

export async function saveSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const currency = String(form.get("currency") ?? "");
  const timezone = String(form.get("timezone") ?? "");

  const errors: Record<string, string> = {};
  if (!(CURRENCIES as readonly string[]).includes(currency)) errors.currency = "Unsupported currency";
  if (!Intl.supportedValuesOf("timeZone").includes(timezone) && timezone !== "UTC") errors.timezone = "Unknown time zone";
  if (Object.keys(errors).length) return fail(errors);

  await db.update(users).set({ currency, timezone }).where(eq(users.id, user.id));
  refresh();
  return { ok: true, message: "Settings saved", at: Date.now() };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

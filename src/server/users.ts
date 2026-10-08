import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, users, type CategoryKind } from "@/db/schema";
import { SERIES_SLOTS } from "@/lib/palette";

export const DEFAULT_CATEGORIES: { name: string; kind: CategoryKind }[] = [
  { name: "Food & Dining", kind: "expense" },
  { name: "Groceries", kind: "expense" },
  { name: "Rent", kind: "expense" },
  { name: "Transport", kind: "expense" },
  { name: "Bills & Utilities", kind: "expense" },
  { name: "Shopping", kind: "expense" },
  { name: "Entertainment", kind: "expense" },
  { name: "Health", kind: "expense" },
  { name: "Income", kind: "income" },
  { name: "Savings", kind: "savings" },
];

/**
 * Called from the Auth.js jwt callback on sign-in. Creates the user on first
 * sign-in (with a starter set of categories) and refreshes name/avatar after.
 */
export async function upsertUserOnSignIn(input: { email: string; name: string | null; image: string | null }) {
  const email = input.email.toLowerCase();
  return db.transaction(async (tx) => {
    const existing = await tx.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      await tx
        .update(users)
        .set({ name: input.name ?? existing.name, image: input.image ?? existing.image })
        .where(eq(users.id, existing.id));
      return existing;
    }
    const [created] = await tx
      .insert(users)
      .values({
        email,
        name: input.name,
        image: input.image,
        timezone: process.env.DEFAULT_TIMEZONE || "Asia/Kolkata",
        currency: process.env.DEFAULT_CURRENCY || "INR",
      })
      .onConflictDoNothing({ target: users.email })
      .returning();
    if (!created) {
      // Lost a race with a concurrent first sign-in.
      return (await tx.query.users.findFirst({ where: eq(users.email, email) }))!;
    }
    await tx.insert(categories).values(
      DEFAULT_CATEGORIES.map((c, i) => ({
        userId: created.id,
        name: c.name,
        kind: c.kind,
        color: SERIES_SLOTS[i % SERIES_SLOTS.length],
      })),
    );
    return created;
  });
}

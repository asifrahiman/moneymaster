import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { books, users, type BookPeriod } from "@/db/schema";
import { todayIn } from "@/lib/dates";
import { createBook } from "./users";

export type BookRef = { id: string; name: string; period: BookPeriod };

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  currency: string;
  timezone: string;
  today: string;
  /** The active book; every read and write is scoped to it. */
  book: BookRef;
  books: BookRef[];
};

/** What queries need to stay inside the user's active book. */
export type Scope = { userId: string; bookId: string };
export const scopeOf = (u: CurrentUser): Scope => ({ userId: u.id, bookId: u.book.id });

/**
 * Data Access Layer entry point: verifies the session and returns the current
 * user with their active book. Every page and server action calls this; all
 * queries are scoped by the user and book it returns, so nobody can read or
 * change data in someone else's book.
 */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  // Mark everything below as request-time: Auth.js uses crypto while decoding the
  // session, which Cache Components would otherwise flag during prerendering.
  await connection();
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");

  // Both queries only need the session's user id, so run them together: one
  // database round trip instead of two on every page, API call and action.
  const [user, found] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, id) }),
    db
      .select({ id: books.id, name: books.name, period: books.period })
      .from(books)
      .where(eq(books.userId, id))
      .orderBy(asc(books.createdAt)),
  ]);
  if (!user) redirect("/login");

  let list = found;
  if (list.length === 0) list = [await createBook(user.id, { name: "Personal", period: "month", starter: true })];
  // Only a book the user owns can be active; fall back to their first one.
  const book = list.find((b) => b.id === user.activeBookId) ?? list[0];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    currency: user.currency,
    timezone: user.timezone,
    today: todayIn(user.timezone),
    book,
    books: list,
  };
});

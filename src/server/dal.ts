import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { todayIn } from "@/lib/dates";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  currency: string;
  timezone: string;
  today: string;
};

/**
 * Data Access Layer entry point: verifies the session and returns the current
 * user. Every page and server action calls this; all queries are scoped by the
 * id it returns, so users can never read or change each other's data.
 */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  // Mark everything below as request-time: Auth.js uses crypto while decoding the
  // session, which Cache Components would otherwise flag during prerendering.
  await connection();
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");

  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) redirect("/login");

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    currency: user.currency,
    timezone: user.timezone,
    today: todayIn(user.timezone),
  };
});

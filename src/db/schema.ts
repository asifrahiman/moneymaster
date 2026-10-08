import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * What a category represents. Replaces the old convention of a magic
 * "Credit" type (income) and "Savings" type that were special-cased by name.
 */
export const categoryKind = pgEnum("category_kind", ["expense", "income", "savings"]);
export type CategoryKind = (typeof categoryKind.enumValues)[number];

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  currency: text("currency").notNull().default("INR"),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: categoryKind("kind").notNull().default("expense"),
    color: text("color").notNull(),
    /**
     * Saved categories appear in the category picker and Settings. Unsaved ones are
     * one-time labels: created on the fly when you type a new name and choose
     * "use once" (and for free-text types imported from the old app).
     */
    saved: boolean("saved").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Case-insensitive uniqueness per user ("Food" and "food" are the same category).
    uniqueIndex("categories_user_name_uq").on(t.userId, sql`lower(${t.name})`),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    // Exact decimal storage; never floats for money.
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    // Calendar date with no time zone, so a date never shifts by a day.
    occurredOn: date("occurred_on", { mode: "string" }).notNull(),
    paidByCard: boolean("paid_by_card").notNull().default(false),
    note: text("note"),
    /** Row id from the legacy PHP/MySQL app; makes the import idempotent. */
    legacyId: integer("legacy_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("transactions_user_date_idx").on(t.userId, t.occurredOn.desc()),
    index("transactions_user_category_idx").on(t.userId, t.categoryId),
    uniqueIndex("transactions_user_legacy_uq").on(t.userId, t.legacyId),
    check("transactions_amount_positive", sql`${t.amount} > 0`),
  ],
);

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;

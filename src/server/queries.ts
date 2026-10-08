import "server-only";
import { and, asc, count, desc, eq, gte, ilike, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import type { Kind, TxFilters } from "@/lib/filters";

export const PAGE_SIZE = 25;

/* All functions take the userId from requireUser(); every query is scoped by it. */

function txWhere(userId: string, f: Partial<TxFilters>): SQL {
  const conds: SQL[] = [eq(transactions.userId, userId)];
  if (f.from) conds.push(gte(transactions.occurredOn, f.from));
  if (f.to) conds.push(lte(transactions.occurredOn, f.to));
  if (f.categoryId) conds.push(eq(transactions.categoryId, f.categoryId));
  if (f.kind) conds.push(eq(categories.kind, f.kind));
  if (f.card) conds.push(eq(transactions.paidByCard, true));
  if (f.q) {
    const pattern = `%${f.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conds.push(sql`(${ilike(transactions.note, pattern)} or ${ilike(categories.name, pattern)})`);
  }
  return and(...conds)!;
}

const sumWhere = (cond: SQL) => sql<string>`coalesce(sum(${transactions.amount}) filter (where ${cond}), 0)`;

const totalsSelect = {
  spent: sumWhere(sql`${categories.kind} = 'expense'`),
  income: sumWhere(sql`${categories.kind} = 'income'`),
  saved: sumWhere(sql`${categories.kind} = 'savings'`),
  card: sumWhere(sql`${categories.kind} = 'expense' and ${transactions.paidByCard}`),
  count: count(),
};

export type Totals = { spent: number; income: number; saved: number; card: number; net: number; count: number };

function toTotals(r: { spent: string; income: string; saved: string; card: string; count: number }): Totals {
  const spent = Number(r.spent);
  const income = Number(r.income);
  const saved = Number(r.saved);
  // Rounded to paise to avoid float noise in the subtraction.
  const net = Math.round((income - spent - saved) * 100) / 100;
  return { spent, income, saved, card: Number(r.card), net, count: Number(r.count) };
}

export async function getTotals(userId: string, f: Partial<TxFilters>): Promise<Totals> {
  const [row] = await db
    .select(totalsSelect)
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(txWhere(userId, f));
  return toTotals(row);
}

export type CategoryRow = {
  id: string;
  name: string;
  kind: Kind;
  color: string;
  txCount: number;
};

export async function listCategories(userId: string): Promise<CategoryRow[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      kind: categories.kind,
      color: categories.color,
      txCount: sql<number>`count(${transactions.id})::int`,
    })
    .from(categories)
    .leftJoin(transactions, eq(transactions.categoryId, categories.id))
    .where(eq(categories.userId, userId))
    .groupBy(categories.id)
    .orderBy(asc(categories.kind), asc(sql`lower(${categories.name})`));
  return rows;
}

export type TxRow = {
  id: string;
  amount: string;
  occurredOn: string;
  paidByCard: boolean;
  note: string | null;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  kind: Kind;
};

const txSelect = {
  id: transactions.id,
  amount: transactions.amount,
  occurredOn: transactions.occurredOn,
  paidByCard: transactions.paidByCard,
  note: transactions.note,
  categoryId: categories.id,
  categoryName: categories.name,
  categoryColor: categories.color,
  kind: categories.kind,
};

export async function listTransactions(userId: string, f: TxFilters, pageSize = PAGE_SIZE) {
  const where = txWhere(userId, f);
  const [rows, [totalsRow]] = await Promise.all([
    db
      .select(txSelect)
      .from(transactions)
      .innerJoin(categories, eq(categories.id, transactions.categoryId))
      .where(where)
      .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt))
      .limit(pageSize)
      .offset((f.page - 1) * pageSize),
    db
      .select(totalsSelect)
      .from(transactions)
      .innerJoin(categories, eq(categories.id, transactions.categoryId))
      .where(where),
  ]);
  const totals = toTotals(totalsRow);
  return { rows: rows as TxRow[], totals, pageCount: Math.max(1, Math.ceil(totals.count / pageSize)) };
}

/** Unpaginated, for CSV export. Capped to keep a single response bounded. */
export async function exportTransactions(userId: string, f: Partial<TxFilters>, limit = 50_000) {
  return (await db
    .select(txSelect)
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(txWhere(userId, f))
    .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt))
    .limit(limit)) as TxRow[];
}

export async function recentTransactions(userId: string, limit = 8) {
  return (await db
    .select(txSelect)
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt))
    .limit(limit)) as TxRow[];
}

export type BreakdownRow = {
  categoryId: string;
  name: string;
  kind: Kind;
  color: string;
  total: number;
  count: number;
};

/** Totals per category for a date range (Reports page, dashboard). */
export async function categoryBreakdown(userId: string, f: Partial<TxFilters>): Promise<BreakdownRow[]> {
  const rows = await db
    .select({
      categoryId: categories.id,
      name: categories.name,
      kind: categories.kind,
      color: categories.color,
      total: sql<string>`sum(${transactions.amount})`,
      count: count(),
    })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(txWhere(userId, f))
    .groupBy(categories.id)
    .orderBy(desc(sql`sum(${transactions.amount})`));
  return rows.map((r) => ({ ...r, total: Number(r.total), count: Number(r.count) }));
}

export type MonthlyRow = { month: string; categoryId: string; kind: Kind; total: number };

/** Per-month, per-category totals for the Trends page. */
export async function monthlyTotals(userId: string, from: string, to: string): Promise<MonthlyRow[]> {
  const month = sql<string>`to_char(${transactions.occurredOn}, 'YYYY-MM')`;
  const rows = await db
    .select({
      month,
      categoryId: categories.id,
      kind: categories.kind,
      total: sql<string>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(txWhere(userId, { from, to }))
    .groupBy(month, categories.id);
  return rows.map((r) => ({ ...r, total: Number(r.total) }));
}

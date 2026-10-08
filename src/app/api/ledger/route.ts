import type { NextRequest } from "next/server";
import { requireUser, scopeOf } from "@/server/dal";
import { categoriesInView, firstTransactionDate, getTotals, ledgerPage } from "@/server/queries";
import { parseFilters } from "@/lib/filters";
import type { LedgerResponse } from "@/lib/ledger-types";

/**
 * GET /api/ledger?<filters>&cursor=…  → one page (100 rows) of the active book.
 * The first page (no cursor) also carries the totals for the whole filtered set.
 */
export async function GET(req: NextRequest) {
  const user = await requireUser();
  const scope = scopeOf(user);
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const filters = parseFilters(params, user.today, user.book.period === "all" ? "all" : "month");
  const cursor = req.nextUrl.searchParams.get("cursor");

  const [page, totals, since, available] = await Promise.all([
    ledgerPage(scope, filters, cursor),
    cursor ? null : getTotals(scope, filters),
    cursor || filters.from || filters.to ? null : firstTransactionDate(scope),
    cursor ? null : categoriesInView(scope, filters),
  ]);

  const body: LedgerResponse = { ...page, totals, since, available };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

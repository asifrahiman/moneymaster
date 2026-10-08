import type { NextRequest } from "next/server";
import { requireUser, scopeOf } from "@/server/dal";
import { categoryBreakdown, getTotals } from "@/server/queries";
import { parseFilters } from "@/lib/filters";
import type { ReportResponse } from "@/lib/ledger-types";

/** GET /api/report?<filters> → totals + per-category breakdown for the active book. */
export async function GET(req: NextRequest) {
  const user = await requireUser();
  const scope = scopeOf(user);
  const filters = parseFilters(
    Object.fromEntries(req.nextUrl.searchParams),
    user.today,
    user.book.period === "all" ? "all" : "month",
  );
  const [totals, breakdown] = await Promise.all([getTotals(scope, filters), categoryBreakdown(scope, filters)]);
  const body: ReportResponse = { totals, breakdown };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

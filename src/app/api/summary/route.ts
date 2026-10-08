import type { NextRequest } from "next/server";
import { requireUser, scopeOf } from "@/server/dal";
import { categoryBreakdown } from "@/server/queries";
import { parseFilters } from "@/lib/filters";
import { buildSummary, periodLabel } from "@/lib/summary";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "book";

/** Plain-text category summary for the selected period, for archiving in a notes file. */
export async function GET(req: NextRequest) {
  const user = await requireUser();
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const filters = parseFilters(params, user.today, user.book.period === "all" ? "all" : "month");
  const range = { from: filters.from, to: filters.to, card: filters.card };

  const rows = await categoryBreakdown(scopeOf(user), range);
  const label = periodLabel(filters.from, filters.to);
  const body = buildSummary(label, rows.map((r) => ({ name: r.name, kind: r.kind, total: r.total })));

  const stamp = label === "All time" ? "all-time" : slug(label);
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="moneymaster_${slug(user.book.name)}_${stamp}.txt"`,
      "Cache-Control": "no-store",
    },
  });
}

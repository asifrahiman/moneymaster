import type { NextRequest } from "next/server";
import { requireUser } from "@/server/dal";
import { exportTransactions } from "@/server/queries";
import { parseFilters } from "@/lib/filters";

/** Quotes a CSV field and neutralises spreadsheet formula injection (=, +, -, @). */
function csvField(v: string | number | boolean | null): string {
  let s = v === null ? "" : String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const filters = parseFilters(params, user.today, "all");
  const rows = await exportTransactions(user.id, filters);

  const header = ["Date", "Category", "Type", "Amount", "Paid by card", "Note"];
  const lines = rows.map((r) =>
    [r.occurredOn, r.categoryName, r.kind, r.amount, r.paidByCard ? "yes" : "no", r.note].map(csvField).join(","),
  );
  // BOM so Excel opens UTF-8 (₹, accents) correctly.
  const body = "﻿" + [header.join(","), ...lines].join("\r\n") + "\r\n";

  const stamp = filters.from || filters.to ? `${filters.from ?? "start"}_to_${filters.to ?? user.today}` : user.today;
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="moneymaster_${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

import type { Totals, TxRow } from "@/server/queries";

/** Shape of GET /api/ledger (shared by the route and the client). */
export type LedgerResponse = {
  rows: TxRow[];
  nextCursor: string | null;
  /** Only on the first page. */
  totals: Totals | null;
  /** First transaction date, only for an all-time first page. */
  since: string | null;
};

/** Shape of GET /api/report. */
export type ReportResponse = { totals: import("@/server/queries").Totals; breakdown: import("@/server/queries").BreakdownRow[] };

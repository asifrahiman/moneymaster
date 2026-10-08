import { describe, expect, it } from "vitest";
import { buildSummary, isCarryForward, netExpense, periodLabel, type SummaryRow } from "@/lib/summary";

// September 2026 from the monthly book.
const sept: SummaryRow[] = [
  ["Car", "expense", 630], ["Carry forward", "expense", 508.29], ["Credit", "income", 161672.84],
  ["Electricity", "expense", 1821], ["Entertainment", "expense", 1542.04], ["Food", "expense", 18937.45],
  ["Fuel", "expense", 6478.7], ["Groceries", "expense", 20260.94], ["Maid", "expense", 3750],
  ["Medical", "expense", 260], ["Misc", "expense", 137], ["Parents", "expense", 14000],
  ["Personal", "expense", 220], ["Recharge", "expense", 1703.82], ["Rent", "expense", 50000],
  ["Savings", "savings", 40000], ["Travel", "expense", 1423.6],
].map(([name, kind, total]) => ({ name, kind, total }) as SummaryRow);

describe("summary", () => {
  it("net expense excludes income, savings and carry forward", () => {
    expect(netExpense(sept)).toBe(121164.55);
  });
  it("recognises carry-forward spellings", () => {
    for (const n of ["Carry forward", "CarryForward", "carry-forward", "Carry Forward"]) expect(isCarryForward(n)).toBe(true);
    expect(isCarryForward("Carry")).toBe(false);
  });
  it("labels a whole month by name", () => {
    expect(periodLabel("2026-09-01", "2026-09-30")).toBe("September 2026");
    expect(periodLabel()).toBe("All time");
    expect(periodLabel("2026-09-01", "2026-10-15")).toMatch(/^1 Sept? 2026 to 15 Oct 2026$/);
  });
  it("prints an aligned, two-decimal, alphabetical list under the headline", () => {
    const text = buildSummary("September 2026", sept);
    const lines = text.split("\n");
    expect(lines[0]).toBe("September 2026 - 121164.55");
    expect(lines[1]).toBe("");
    expect(lines[2]).toBe("Car                     630.00");
    expect(lines).toContain("Food                  18937.45");
    expect(lines).toContain("Credit               161672.84");
    // Every amount ends in the same column.
    const ends = new Set(lines.slice(2).filter(Boolean).map((l) => l.length));
    expect(ends.size).toBe(1);
  });
});

import { describe, expect, it } from "vitest";
import { filtersToSearch, parseFilters } from "@/lib/filters";

const today = "2026-10-08";

describe("parseFilters", () => {
  it("defaults to the current month", () => {
    expect(parseFilters({}, today)).toMatchObject({ preset: "month", month: "2026-10", from: "2026-10-01", to: "2026-10-31" });
  });
  it("reads a specific month and ignores a malformed one", () => {
    expect(parseFilters({ range: "month", month: "2026-02" }, today)).toMatchObject({ from: "2026-02-01", to: "2026-02-28" });
    expect(parseFilters({ range: "month", month: "2026-13" }, today)).toMatchObject({ month: "2026-10" });
  });
  it("supports card / not-card / any", () => {
    expect(parseFilters({ card: "1" }, today).card).toBe(true);
    expect(parseFilters({ card: "0" }, today).card).toBe(false);
    expect(parseFilters({}, today).card).toBeUndefined();
    expect(filtersToSearch({ preset: "all", card: false })).toBe("?range=all&card=0");
  });
  it("uses the book's default duration", () => {
    const f = parseFilters({}, today, "all");
    expect(f.preset).toBe("all");
    expect(f.from ?? f.to).toBeUndefined();
  });
  it("accepts a custom range and swaps reversed dates", () => {
    expect(parseFilters({ range: "custom", from: "2026-05-31", to: "2026-05-01" }, today)).toMatchObject({
      preset: "custom",
      from: "2026-05-01",
      to: "2026-05-31",
    });
  });
  it("drops malformed values instead of passing them to SQL", () => {
    const f = parseFilters({ category: "' OR 1=1 --", kind: "admin", page: "-4", from: "2021-13-45", range: "custom" }, today);
    expect(f.categoryId).toBeUndefined();
    expect(f.kind).toBeUndefined();
    expect(f.from).toBeUndefined();
    expect(f.page).toBe(1);
  });
  it("round-trips through the query string", () => {
    const f = parseFilters({ range: "last-month", kind: "expense", card: "1", q: "uber", page: "3" }, today);
    const search = filtersToSearch(f, { page: undefined });
    expect(search).toBe("?range=last-month&kind=expense&card=1&q=uber");
    const m = parseFilters({ range: "month", month: "2025-12" }, today);
    expect(filtersToSearch(m)).toBe("?range=month&month=2025-12");
  });
});

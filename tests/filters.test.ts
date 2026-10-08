import { describe, expect, it } from "vitest";
import { filtersToSearch, parseFilters } from "@/lib/filters";

const today = "2026-10-08";

describe("parseFilters", () => {
  it("defaults to this month", () => {
    expect(parseFilters({}, today)).toMatchObject({ preset: "this-month", from: "2026-10-01", to: "2026-10-31", page: 1 });
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
  });
});

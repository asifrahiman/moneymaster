import { describe, expect, it } from "vitest";
import { addMonths, endOfMonth, isIsoDate, monthKeys, presetRange, todayIn } from "@/lib/dates";

describe("dates", () => {
  it("validates real calendar dates only", () => {
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2023-02-29")).toBe(false);
    expect(isIsoDate("2024-13-01")).toBe(false);
    expect(isIsoDate("08/10/2026")).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });
  it("computes today in the user's time zone, not the server's", () => {
    const instant = new Date("2026-03-31T20:00:00Z"); // 01:30 on Apr 1 in India
    expect(todayIn("Asia/Kolkata", instant)).toBe("2026-04-01");
    expect(todayIn("America/New_York", instant)).toBe("2026-03-31");
  });
  it("handles month arithmetic at month ends", () => {
    expect(endOfMonth("2024-02-10")).toBe("2024-02-29");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-01-15", -2)).toBe("2025-11-15");
    expect(monthKeys("2026-02-14", 3)).toEqual(["2025-12", "2026-01", "2026-02"]);
  });
  it("resolves range presets", () => {
    expect(presetRange("this-month", "2026-10-08")).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(presetRange("last-month", "2026-01-08")).toEqual({ from: "2025-12-01", to: "2025-12-31" });
    expect(presetRange("last-12-months", "2026-10-08")).toEqual({ from: "2025-11-01", to: "2026-10-31" });
    expect(presetRange("all", "2026-10-08")).toEqual({});
  });
});

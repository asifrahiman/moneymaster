import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/format";

describe("formatMoney", () => {
  it("formats INR with Indian digit grouping", () => {
    expect(formatMoney("1234567.5", "INR")).toBe("₹12,34,567.50");
  });
  it("uses K / L / Cr for compact INR", () => {
    expect(formatMoney(80000, "INR", { compact: true })).toBe("₹80K");
    expect(formatMoney(250000, "INR", { compact: true })).toBe("₹2.5L");
    expect(formatMoney(31000000, "INR", { compact: true })).toBe("₹3.1Cr");
    expect(formatMoney(0, "INR", { compact: true })).toBe("₹0");
  });
  it("can drop paise for summary tiles", () => {
    expect(formatMoney(11631856.9, "INR", { whole: true })).toBe("₹1,16,31,857");
  });
  it("formats other currencies", () => {
    expect(formatMoney(1234.5, "USD")).toBe("$1,234.50");
  });
});

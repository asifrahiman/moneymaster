import { describe, expect, it } from "vitest";
import { isFormula, parseAmount } from "@/lib/amount";

const ok = (s: string) => {
  const r = parseAmount(s);
  if (!r.ok) throw new Error(`${s}: ${r.error}`);
  return r.value;
};

describe("parseAmount", () => {
  it("parses plain numbers, commas and currency symbols", () => {
    expect(ok("250")).toBe(250);
    expect(ok("1,250.50")).toBe(1250.5);
    expect(ok("₹ 99.999")).toBe(100);
    expect(ok(".5")).toBe(0.5);
  });
  it("evaluates formulas with or without a leading =", () => {
    expect(ok("=100+50")).toBe(150);
    expect(ok("120+80*2")).toBe(280);
    expect(ok("(1200-200)/4")).toBe(250);
    expect(ok("3x45.5")).toBe(136.5);
    expect(ok("= 10 + -2")).toBe(8);
    expect(ok("0.1+0.2")).toBe(0.3);
  });
  it("rejects invalid input instead of sending null/NaN", () => {
    for (const bad of ["", "=", "abc", "1+", "2**3", "(1+2", "1/0", "alert(1)", "1e5"]) {
      expect(parseAmount(bad).ok, bad).toBe(false);
    }
  });
  it("rejects zero, negative and too-large results", () => {
    expect(parseAmount("0").ok).toBe(false);
    expect(parseAmount("5-10").ok).toBe(false);
    expect(parseAmount("99999999999").ok).toBe(false);
  });
  it("detects formulas for the live preview", () => {
    expect(isFormula("=5")).toBe(true);
    expect(isFormula("100+5")).toBe(true);
    expect(isFormula("1,250")).toBe(false);
    expect(isFormula("-5")).toBe(false);
  });

  it("accepts the symbols the amount keypad buttons and phone keyboards type", () => {
    expect(parseAmount("120×2")).toEqual({ ok: true, value: 240 });
    expect(parseAmount("90÷3")).toEqual({ ok: true, value: 30 });
    expect(parseAmount("500−20")).toEqual({ ok: true, value: 480 });
    expect(isFormula("500−20")).toBe(true);
  });
});

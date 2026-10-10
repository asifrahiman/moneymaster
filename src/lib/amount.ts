/**
 * Parses an amount typed by the user.
 *
 * Accepts plain numbers ("1,250.50") and simple arithmetic, with or without a
 * leading "=" ("=120+80", "3*45.5", "(1200-200)/4"), like the old app did with
 * math.js — but with a tiny hand-written parser instead of a 600 KB library,
 * and no way to evaluate anything other than + - * / and parentheses.
 */
export type AmountResult = { ok: true; value: number } | { ok: false; error: string };

export const MAX_AMOUNT = 9_999_999_999.99; // fits numeric(12,2)

export function parseAmount(input: string): AmountResult {
  const src = input
    .replace(/[,\s₹$€£]/g, "")
    .replace(/[×xX]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-") // typographic minus / en dash from some keyboards
    .replace(/^=/, "");
  if (src === "") return { ok: false, error: "Enter an amount" };

  let pos = 0;
  const peek = () => src[pos];

  function number(): number {
    const m = /^\d*\.?\d+|^\d+\./.exec(src.slice(pos));
    if (!m) throw new Error(`Unexpected "${peek() ?? "end"}"`);
    pos += m[0].length;
    return Number(m[0]);
  }
  function factor(): number {
    const c = peek();
    if (c === "+") return pos++, factor();
    if (c === "-") return pos++, -factor();
    if (c === "(") {
      pos++;
      const v = expr();
      if (peek() !== ")") throw new Error("Missing )");
      pos++;
      return v;
    }
    return number();
  }
  function term(): number {
    let v = factor();
    for (let c = peek(); c === "*" || c === "/" || c === "x"; c = peek()) {
      pos++;
      const rhs = factor();
      if (c === "/") {
        if (rhs === 0) throw new Error("Division by zero");
        v /= rhs;
      } else v *= rhs;
    }
    return v;
  }
  function expr(): number {
    let v = term();
    for (let c = peek(); c === "+" || c === "-"; c = peek()) {
      pos++;
      v = c === "+" ? v + term() : v - term();
    }
    return v;
  }

  let value: number;
  try {
    value = expr();
    if (pos !== src.length) throw new Error(`Unexpected "${src[pos]}"`);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  value = Math.round(value * 100) / 100;
  if (!Number.isFinite(value)) return { ok: false, error: "Invalid amount" };
  if (value <= 0) return { ok: false, error: "Amount must be greater than 0" };
  if (value > MAX_AMOUNT) return { ok: false, error: "Amount is too large" };
  return { ok: true, value };
}

/** True when the input is a formula rather than a plain number (used to show a preview). */
export function isFormula(input: string): boolean {
  return /^=|.\s*[-+*/x×÷−(]/.test(input.trim());
}

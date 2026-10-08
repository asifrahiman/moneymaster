import { describe, expect, it } from "vitest";
import { cleanLabel, parseSqlInserts, planCategories, readSqlDump } from "../scripts/legacy-lib";

const dump = `
INSERT INTO \`expenses\` (\`id\`, \`type\`, \`amount\`, \`user\`, \`date\`, \`isCredit\`) VALUES
(1, 'Food', 120.5, 'Asif', '2022-06-01', 0),
(2, 'Kada- steel', 900, 'Asif', '2022-06-02', 1),
(3, 'It\\'s ''quoted'', ok', 5, 'Asif', '2022-06-03', 0);
INSERT INTO \`expenses\` (\`id\`, \`type\`, \`amount\`, \`user\`, \`date\`, \`isCredit\`) VALUES
(4, 'Credit', 50000, 'Asif', '2022-06-01', 0),
(5, 'Intrest', 10, 'Asif', '2022-06-01', 0),
(6, 'Savings', 10, 'Asif', '2022-06-01', 0);
INSERT INTO \`type\` (\`id\`, \`type\`) VALUES
(1, 'Food'), (2, 'Credit'), (3, 'Intrest');
`;

describe("legacy SQL dump", () => {
  it("parses multi-statement inserts with escaped quotes", () => {
    const { expenses, savedTypes } = readSqlDump(dump);
    expect(expenses).toHaveLength(6);
    expect(expenses[2].type).toBe("It's 'quoted', ok");
    expect(expenses[1]).toMatchObject({ id: 2, amount: "900", isCredit: "1" });
    expect(savedTypes).toEqual(["Food", "Credit", "Intrest"]);
  });
  it("handles NULL values", () => {
    expect(parseSqlInserts("INSERT INTO `t` (`a`, `b`) VALUES (1, NULL);", "t")).toEqual([{ a: 1, b: null }]);
  });
});

describe("planCategories", () => {
  const labels = readSqlDump(dump).expenses.map((e) => e.type);
  const base = { labels, incomeTypes: ["Credit"], savingsTypes: ["Savings"], othersName: "Others" };

  it("saved mode: saved types + income/savings become categories, the rest go to Others with a note", () => {
    const plan = planCategories({ ...base, savedTypes: ["Food", "Credit", "Intrest"], mode: "saved", fixTypos: true });
    expect(plan.categories.map((c) => `${c.name}:${c.kind}`).sort()).toEqual(
      ["Credit:income", "Food:expense", "Interest:expense", "Others:expense", "Savings:savings"].sort(),
    );
    expect(plan.labels.get("Kada- steel")).toEqual({ category: "Others", note: "Kada - steel" });
    expect(plan.labels.get("Food")).toEqual({ category: "Food", note: null });
    expect(plan.labels.get("Intrest")).toEqual({ category: "Interest", note: null });
  });

  it("all mode: every label is a category", () => {
    const plan = planCategories({ ...base, savedTypes: [], mode: "all", fixTypos: false });
    expect(plan.categories).toHaveLength(6);
    expect(plan.categories.some((c) => c.name === "Others")).toBe(false);
  });

  it("cleans whitespace, dash spacing and known typos", () => {
    expect(cleanLabel("  Kada-  steel ", false)).toBe("Kada - steel");
    expect(cleanLabel("CarryForward", true)).toBe("Carry forward");
    expect(cleanLabel("Intrest", false)).toBe("Intrest");
  });
});

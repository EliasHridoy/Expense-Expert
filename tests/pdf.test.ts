import test from "node:test";
import { ok, equal } from "node:assert/strict";
import { initialState } from "../src/domain/mockData";
import { buildMonthlyStatementHtml, exportMonthlyStatement } from "../src/lib/pdf";

test("builds statement html", () => {
  const html = buildMonthlyStatementHtml({ ...initialState, categories: [] } as never, "2026-08");
  ok(html.includes("Expense Expert Statement"));
});

test("exports statement via web print fallback", async () => {
  const result = await exportMonthlyStatement(
    { ...initialState, categories: [] } as never,
    "2026-08",
    "web",
    {
      printAsync: async () => undefined
    }
  );
  equal(result.mode, "print");
});

test("exports statement via mobile sharing fallback", async () => {
  const result = await exportMonthlyStatement(
    { ...initialState, categories: [] } as never,
    "2026-08",
    "ios",
    {
      printToFileAsync: async () => ({ uri: "file://statement.pdf" }),
      isSharingAvailable: async () => true,
      shareAsync: async () => undefined
    }
  );
  equal(result.mode, "share");
});

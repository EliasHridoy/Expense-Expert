import test from "node:test";
import { deepEqual, equal, ok, strictEqual } from "node:assert/strict";
import { initialState } from "../src/domain/mockData";
import {
  applyDraftTemplate,
  buildCashflowSeries,
  buildStatementHtml,
  calculateSnapshot,
  computeSavingsGoalProgress,
  createExpenseRecord,
  filterExpenses,
  formatCurrency,
  monthFromDate,
  reconcileLoanRepayment
} from "../src/domain/finance";

test("formats currency and derives months", () => {
  equal(formatCurrency(1234.5), "$1,234.50");
  equal(monthFromDate("2026-08-15"), "2026-08");
});

test("creates and filters expenses", () => {
  const record = createExpenseRecord({
    id: "e-1",
    title: "Infra Bill",
    description: "Cloud invoice",
    amount: 100,
    category: "Infra",
    type: "EXPENSE",
    date: "2026-08-01"
  });
  equal(record.month, "2026-08");
  ok(record.isLoan === false);
  const filtered = filterExpenses([record], { search: "cloud", category: "ALL" });
  strictEqual(filtered.length, 1);
});

test("calculates dashboard snapshot", () => {
  const snapshot = calculateSnapshot(initialState);
  equal(snapshot.income, 12450);
  equal(snapshot.expenses, 3380.5);
  equal(snapshot.netCashflow, 9069.5);
  equal(snapshot.activeLoans, 3200);
  ok(snapshot.categories.length > 0);
});

test("builds cashflow series and statement html", () => {
  const series = buildCashflowSeries(initialState.expenses, ["2026-08"]);
  deepEqual(series[0], { label: "2026-08", income: 12450, expense: 3380.5 });
  const statement = buildStatementHtml(calculateSnapshot(initialState), "2026-08");
  ok(statement.includes("Expense Expert Statement"));
});

test("applies drafts and reconciles loans", () => {
  const result = applyDraftTemplate(initialState.drafts[0], "2026-08", "2026-08-15");
  strictEqual(result.expenses.length, 3);
  equal(result.application.status, "Completed");
  const loan = reconcileLoanRepayment(initialState.loans[0], 400);
  equal(loan.repaid, 7200);
  equal(loan.status, "partially_repaid");
});

test("computes savings goal progress", () => {
  const goal = initialState.savingGoals[0];
  const progress = computeSavingsGoalProgress(goal, initialState.savingEntries);
  equal(progress.savedAmount, 10200);
  ok(progress.progressRatio > 0);
});

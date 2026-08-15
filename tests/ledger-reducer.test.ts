import test from "node:test";
import { equal, ok } from "node:assert/strict";
import { initialState } from "../src/domain/mockData";
import {
  addExpenseToState,
  applyDraftToState,
  deleteExpenseFromState,
  logLoanRepaymentToState,
  setAccountIdInState,
  setAuthenticatedInState,
  setBiometricEnabledInState,
  updateExpenseInState
} from "../src/store/ledger-reducer";

test("adds edits deletes and toggles core ledger state", () => {
  const added = addExpenseToState(initialState, {
    id: "exp-new",
    title: "API bill",
    description: "Usage charge",
    amount: 75,
    category: "Infra",
    type: "EXPENSE",
    date: "2026-08-15",
    isLoan: false
  });
  equal(added.expenses[0].id, "exp-new");

  const edited = updateExpenseInState(added, "exp-new", { amount: 80 });
  equal(edited.expenses[0].amount, 80);

  const deleted = deleteExpenseFromState(edited, "exp-new");
  ok(deleted.expenses.every((entry) => entry.id !== "exp-new"));

  equal(setAuthenticatedInState(initialState, true).authenticated, true);
  equal(setBiometricEnabledInState(initialState, false).biometricEnabled, false);
  equal(setAccountIdInState(initialState, "secondary").accountId, "secondary");
});

test("applies drafts and logs loan repayments", () => {
  const drafted = applyDraftToState(initialState, "draft-fixed", "2026-08", "2026-08-15");
  ok(drafted.draftApplications.length > 0);
  ok(drafted.expenses.length > initialState.expenses.length);

  const repaid = logLoanRepaymentToState(initialState, { loanId: "loan-1", amount: 400, expenseId: "loan-exp-1" });
  equal(repaid.loans[0].repaid, 7200);
  ok(repaid.expenses[0].category === "Loan");
});

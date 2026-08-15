import { applyDraftTemplate, createExpenseRecord, reconcileLoanRepayment } from "../domain/finance";
import type { AppLedgerState, ExpenseDraftTemplate, ExpenseRecord } from "../domain/types";

export function addExpenseToState(state: AppLedgerState, input: Omit<ExpenseRecord, "createdAt" | "updatedAt" | "month">): AppLedgerState {
  const record = createExpenseRecord({
    id: input.id,
    title: input.title,
    description: input.description,
    amount: input.amount,
    category: input.category,
    type: input.type,
    date: input.date,
    isLoan: input.isLoan,
    loanPersonId: input.loanPersonId,
    loanCleared: input.loanCleared,
    loanRepaid: input.loanRepaid,
    draftId: input.draftId,
    installmentIndex: input.installmentIndex,
    tags: input.tags
  });
  return { ...state, expenses: [record, ...state.expenses] };
}

export function updateExpenseInState(state: AppLedgerState, id: string, changes: Partial<ExpenseRecord>): AppLedgerState {
  return {
    ...state,
    expenses: state.expenses.map((expense) => (expense.id === id ? { ...expense, ...changes, updatedAt: new Date().toISOString() } : expense))
  };
}

export function deleteExpenseFromState(state: AppLedgerState, id: string): AppLedgerState {
  return {
    ...state,
    expenses: state.expenses.filter((expense) => expense.id !== id)
  };
}

export function applyDraftToState(state: AppLedgerState, draftId: string, month: string, baseDate: string): AppLedgerState {
  const draft = state.drafts.find((entry) => entry.id === draftId);
  if (!draft) {
    return state;
  }
  const { application, expenses } = applyDraftTemplate(draft as ExpenseDraftTemplate, month, baseDate);
  return {
    ...state,
    expenses: [...expenses, ...state.expenses],
    draftApplications: [application, ...state.draftApplications]
  };
}

export function logLoanRepaymentToState(state: AppLedgerState, input: { loanId: string; amount: number; expenseId: string }): AppLedgerState {
  const loan = state.loans.find((entry) => entry.id === input.loanId);
  if (!loan) {
    return state;
  }
  const updatedLoan = reconcileLoanRepayment(loan, input.amount);
  const repayment = createExpenseRecord({
    id: input.expenseId,
    title: "Loan Repayment",
    description: loan.note,
    amount: input.amount,
    category: "Loan",
    type: "LOAN",
    date: new Date().toISOString().slice(0, 10),
    isLoan: true,
    loanPersonId: loan.personId,
    loanRepaid: input.amount
  });
  return {
    ...state,
    loans: state.loans.map((entry) => (entry.id === input.loanId ? updatedLoan : entry)),
    expenses: [repayment, ...state.expenses]
  };
}

export function setAuthenticatedInState(state: AppLedgerState, authenticated: boolean): AppLedgerState {
  return { ...state, authenticated };
}

export function setBiometricEnabledInState(state: AppLedgerState, biometricEnabled: boolean): AppLedgerState {
  return { ...state, biometricEnabled };
}

export function setAccountIdInState(state: AppLedgerState, accountId: string): AppLedgerState {
  return { ...state, accountId };
}

import { applyDraftTemplate, createExpenseRecord, reconcileLoanRepayment } from "./finance";
import type { ExpenseDraftTemplate, ExpenseRecord, LoanRecord } from "./types";

export function createExpenseFromForm(values: {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: ExpenseRecord["category"];
  type: ExpenseRecord["type"];
  date: string;
}): ExpenseRecord {
  return createExpenseRecord(values);
}

export function createEditedExpense(expense: ExpenseRecord, changes: Partial<ExpenseRecord>): ExpenseRecord {
  return {
    ...expense,
    ...changes,
    updatedAt: new Date().toISOString()
  };
}

export function applyMonthlyDraft(template: ExpenseDraftTemplate, month: string, baseDate: string) {
  return applyDraftTemplate(template, month, baseDate);
}

export function reconcileLoan(loan: LoanRecord, amount: number): LoanRecord {
  return reconcileLoanRepayment(loan, amount);
}

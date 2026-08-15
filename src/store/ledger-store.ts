import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateSnapshot, createExpenseRecord } from "../domain/finance";
import { initialState } from "../domain/mockData";
import type { AppLedgerState, ExpenseDraftTemplate, ExpenseRecord } from "../domain/types";
import { buildLoanRepaymentBatch } from "../lib/firebase";
import {
  addExpenseToState,
  applyDraftToState,
  deleteExpenseFromState,
  logLoanRepaymentToState,
  setAccountIdInState,
  setAuthenticatedInState,
  setBiometricEnabledInState,
  updateExpenseInState
} from "./ledger-reducer";

export interface LedgerActions {
  addExpense(input: Omit<ExpenseRecord, "createdAt" | "updatedAt" | "month">): void;
  updateExpense(id: string, changes: Partial<ExpenseRecord>): void;
  deleteExpense(id: string): void;
  applyDraft(draftId: string, month: string, baseDate: string): void;
  logLoanRepayment(input: { loanId: string; amount: number; expenseId: string }): void;
  setAuthenticated(value: boolean): void;
  setBiometricEnabled(value: boolean): void;
  setAccountId(accountId: string): void;
  markHydrated(): void;
}

export interface LedgerStore extends AppLedgerState, LedgerActions {
  _hasHydrated: boolean;
  snapshot(): ReturnType<typeof calculateSnapshot>;
}

function updateExpenseList(expenses: ExpenseRecord[], id: string, changes: Partial<ExpenseRecord>): ExpenseRecord[] {
  return expenses.map((expense) => (expense.id === id ? { ...expense, ...changes, updatedAt: new Date().toISOString() } : expense));
}

export const useLedgerStore = create<LedgerStore>()(
  persist(
    (set: any, get: any): LedgerStore => ({
      ...initialState,
      _hasHydrated: false,
      snapshot() {
        return calculateSnapshot(get());
      },
      addExpense(input: Omit<ExpenseRecord, "createdAt" | "updatedAt" | "month">) {
        set((state: LedgerStore) => addExpenseToState(state, input));
      },
      updateExpense(id: string, changes: Partial<ExpenseRecord>) {
        set((state: LedgerStore) => updateExpenseInState(state, id, changes));
      },
      deleteExpense(id: string) {
        set((state: LedgerStore) => deleteExpenseFromState(state, id));
      },
      applyDraft(draftId: string, month: string, baseDate: string) {
        set((state: LedgerStore) => applyDraftToState(state, draftId, month, baseDate));
      },
      logLoanRepayment({ loanId, amount, expenseId }: { loanId: string; amount: number; expenseId: string }) {
        const loan = get().loans.find((entry: LedgerStore["loans"][number]) => entry.id === loanId);
        if (!loan) {
          return;
        }
        buildLoanRepaymentBatch({
          userId: get().accountId,
          loanId,
          expenseId,
          amount,
          repaidBefore: loan.repaid,
          loanAmount: loan.amount
        });
        set((state: LedgerStore) => logLoanRepaymentToState(state, { loanId, amount, expenseId }));
      },
      setAuthenticated(value: boolean) {
        set((state: LedgerStore) => setAuthenticatedInState(state, value));
      },
      setBiometricEnabled(value: boolean) {
        set((state: LedgerStore) => setBiometricEnabledInState(state, value));
      },
      setAccountId(accountId: string) {
        set((state: LedgerStore) => setAccountIdInState(state, accountId));
      },
      markHydrated() {
        set({ _hasHydrated: true });
      }
    }),
    {
      name: "expense-expert-ledger",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state: LedgerStore | undefined) => {
        if (state) {
          state._hasHydrated = true;
        }
      }
    }
  )
);

export function getHydratedSnapshot(state: LedgerStore): ReturnType<typeof calculateSnapshot> {
  return calculateSnapshot(state);
}

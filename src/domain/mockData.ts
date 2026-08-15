import { createExpenseRecord } from "./finance";
import type {
  AppLedgerState,
  BankAccountRecord,
  ExpenseDraftTemplate,
  IncomeRecord,
  LoanRecord,
  PersonRecord,
  SavingEntryRecord,
  SavingGoalRecord
} from "./types";

export const initialState: AppLedgerState = {
  authenticated: false,
  offlineCached: true,
  biometricEnabled: true,
  accountId: "primary",
  expenses: [
    createExpenseRecord({
      id: "exp-1",
      title: "Equinix Bare Metal Cluster",
      description: "Infrastructure settlement",
      amount: 940,
      category: "Infra",
      type: "EXPENSE",
      date: "2026-08-14"
    }),
    createExpenseRecord({
      id: "exp-2",
      title: "Apartment Lease & Fiber",
      description: "Housing and utility bundle",
      amount: 1850,
      category: "Housing",
      type: "EXPENSE",
      date: "2026-08-12"
    }),
    createExpenseRecord({
      id: "exp-3",
      title: "Client Retainer Payment",
      description: "Monthly income settlement",
      amount: 12450,
      category: "Salary",
      type: "INCOME",
      date: "2026-08-10"
    }),
    createExpenseRecord({
      id: "exp-4",
      title: "Equipment Loan Installment",
      description: "Loan repayment installment",
      amount: 400,
      category: "Loan",
      type: "LOAN",
      date: "2026-08-08",
      isLoan: true,
      loanPersonId: "person-1",
      loanRepaid: 400
    }),
    createExpenseRecord({
      id: "exp-5",
      title: "Team Lunch & Coffee",
      description: "Food and beverage",
      amount: 190.5,
      category: "Food",
      type: "EXPENSE",
      date: "2026-08-05"
    })
  ],
  drafts: [
    {
      id: "draft-fixed",
      title: "Standard Monthly Fixed Expenses",
      targetAmount: 1850,
      category: "Housing",
      isLoan: false,
      installmentCount: 3,
      active: true,
      notes: "Rent, fiber, insurance"
    },
    {
      id: "draft-loan",
      title: "Loan Repayment Installment",
      targetAmount: 400,
      category: "Loan",
      isLoan: true,
      installmentCount: 1,
      active: true,
      notes: "Atomic loan balance decrement"
    }
  ] satisfies ExpenseDraftTemplate[],
  draftApplications: [],
  persons: [{ id: "person-1", name: "EquiFlex Capital" }] satisfies PersonRecord[],
  loans: [
    {
      id: "loan-1",
      personId: "person-1",
      note: "Equipment purchase",
      amount: 10000,
      repaid: 6800,
      status: "partially_repaid",
      month: "2026-08",
      date: "2026-08-08"
    }
  ] satisfies LoanRecord[],
  bankAccounts: [
    {
      id: "bank-1",
      accountName: "Operating Reserve",
      accountNumber: "****3489",
      bankName: "Atlas Bank"
    }
  ] satisfies BankAccountRecord[],
  savingGoals: [
    {
      id: "goal-1",
      purpose: "Emergency runway",
      targetAmount: 25000,
      savedAmount: 8600,
      durationValue: 12,
      durationUnit: "months",
      startMonth: "2026-01",
      endMonth: "2026-12",
      bankAccountId: "bank-1"
    }
  ] satisfies SavingGoalRecord[],
  savingEntries: [
    {
      id: "save-1",
      goalId: "goal-1",
      amount: 1600,
      type: "deposit",
      date: "2026-08-01",
      notes: "Operating surplus transfer"
    }
  ] satisfies SavingEntryRecord[],
  incomes: [
    {
      id: "inc-1",
      title: "Client Retainer Payment",
      amount: 12450,
      month: "2026-08",
      date: "2026-08-10"
    }
  ] satisfies IncomeRecord[]
};

export type EntryType = "EXPENSE" | "INCOME" | "LOAN";
export type Category =
  | "Infra"
  | "Housing"
  | "Loan"
  | "Food"
  | "Salary"
  | "Transport"
  | "Entertainment"
  | "Utilities"
  | "Savings"
  | "Other";

export interface ExpenseRecord {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: Category;
  type: EntryType;
  date: string;
  month: string;
  createdAt: string;
  updatedAt: string;
  isLoan: boolean;
  loanPersonId?: string;
  loanCleared?: boolean;
  loanRepaid?: number;
  draftId?: string;
  installmentIndex?: number;
  tags?: string[];
}

export interface ExpenseDraftTemplate {
  id: string;
  title: string;
  targetAmount: number;
  category: Category;
  isLoan: boolean;
  installmentCount: number;
  active: boolean;
  notes?: string;
}

export interface DraftApplication {
  id: string;
  draftId: string;
  month: string;
  status: "Pending" | "Partial" | "Completed";
  generatedExpenseIds: string[];
  createdAt: string;
}

export interface PersonRecord {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface LoanRecord {
  id: string;
  personId: string;
  note: string;
  amount: number;
  repaid: number;
  status: "active" | "partially_repaid" | "cleared";
  month: string;
  date: string;
}

export interface BankAccountRecord {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export interface SavingGoalRecord {
  id: string;
  purpose: string;
  targetAmount: number;
  savedAmount: number;
  durationValue: number;
  durationUnit: "months" | "years";
  startMonth: string;
  endMonth: string;
  bankAccountId?: string;
}

export interface SavingEntryRecord {
  id: string;
  goalId: string;
  amount: number;
  type: "deposit" | "withdrawal";
  date: string;
  notes?: string;
}

export interface IncomeRecord {
  id: string;
  title: string;
  amount: number;
  month: string;
  date: string;
}

export interface DashboardSnapshot {
  income: number;
  expenses: number;
  netCashflow: number;
  activeLoans: number;
  transactionCount: number;
  categories: Array<{ name: Category; amount: number; color: string }>;
}

export interface AppLedgerState {
  authenticated: boolean;
  offlineCached: boolean;
  biometricEnabled: boolean;
  accountId: string;
  expenses: ExpenseRecord[];
  drafts: ExpenseDraftTemplate[];
  draftApplications: DraftApplication[];
  persons: PersonRecord[];
  loans: LoanRecord[];
  bankAccounts: BankAccountRecord[];
  savingGoals: SavingGoalRecord[];
  savingEntries: SavingEntryRecord[];
  incomes: IncomeRecord[];
}

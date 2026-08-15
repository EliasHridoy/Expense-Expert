import { colors } from "../theme/tokens";
import type {
  AppLedgerState,
  Category,
  DashboardSnapshot,
  DraftApplication,
  ExpenseDraftTemplate,
  ExpenseRecord,
  LoanRecord,
  SavingEntryRecord,
  SavingGoalRecord
} from "./types";

export interface CashflowPoint {
  label: string;
  income: number;
  expense: number;
}

export interface FilterQuery {
  search?: string;
  category?: Category | "ALL";
  type?: ExpenseRecord["type"] | "ALL";
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function monthFromDate(date: string): string {
  return date.slice(0, 7);
}

export function createExpenseRecord(input: {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: Category;
  type: ExpenseRecord["type"];
  date: string;
  isLoan?: boolean;
  loanPersonId?: string;
  loanCleared?: boolean;
  loanRepaid?: number;
  draftId?: string;
  installmentIndex?: number;
  tags?: string[];
}): ExpenseRecord {
  const now = new Date(input.date || new Date().toISOString()).toISOString();
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    amount: input.amount,
    category: input.category,
    type: input.type,
    date: input.date,
    month: monthFromDate(input.date),
    createdAt: now,
    updatedAt: now,
    isLoan: input.isLoan ?? input.category === "Loan",
    loanPersonId: input.loanPersonId,
    loanCleared: input.loanCleared ?? false,
    loanRepaid: input.loanRepaid ?? 0,
    draftId: input.draftId,
    installmentIndex: input.installmentIndex,
    tags: input.tags ?? []
  };
}

export function filterExpenses(expenses: ExpenseRecord[], query: FilterQuery): ExpenseRecord[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  return expenses.filter((expense) => {
    const matchesCategory = !query.category || query.category === "ALL" || expense.category === query.category;
    const matchesType = !query.type || query.type === "ALL" || expense.type === query.type;
    const matchesSearch =
      !search ||
      expense.title.toLowerCase().includes(search) ||
      expense.description.toLowerCase().includes(search) ||
      expense.category.toLowerCase().includes(search) ||
      expense.tags?.some((tag) => tag.toLowerCase().includes(search)) === true;
    return matchesCategory && matchesType && matchesSearch;
  });
}

export function calculateSnapshot(state: AppLedgerState): DashboardSnapshot {
  const income = state.incomes.reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = state.expenses.reduce((sum, entry) => {
    if (entry.type === "INCOME") {
      return sum;
    }
    return sum + entry.amount;
  }, 0);
  const activeLoans = state.loans.reduce((sum, loan) => sum + Math.max(loan.amount - loan.repaid, 0), 0);
  const categories = aggregateCategories(state.expenses);
  return {
    income,
    expenses,
    netCashflow: income - expenses,
    activeLoans,
    transactionCount: state.expenses.length,
    categories
  };
}

export function aggregateCategories(expenses: ExpenseRecord[]): DashboardSnapshot["categories"] {
  const colorMap: Record<Category, string> = {
    Infra: colors.cobalt,
    Housing: colors.emerald,
    Loan: colors.amber,
    Food: colors.coral,
    Salary: colors.emerald,
    Transport: colors.cobalt,
    Entertainment: colors.amber,
    Utilities: colors.cobalt,
    Savings: colors.emerald,
    Other: colors.textSecondary
  };
  const totals = new Map<Category, number>();
  expenses.forEach((expense) => {
    const current = totals.get(expense.category) ?? 0;
    totals.set(expense.category, current + expense.amount);
  });
  return Array.from(totals.entries())
    .map(([name, amount]) => ({ name, amount, color: colorMap[name] }))
    .sort((left, right) => right.amount - left.amount);
}

export function buildCashflowSeries(expenses: ExpenseRecord[], months: string[]): CashflowPoint[] {
  return months.map((label) => {
    const monthExpenses = expenses.filter((entry) => entry.month === label);
    return {
      label,
      income: monthExpenses.filter((entry) => entry.type === "INCOME").reduce((sum, entry) => sum + entry.amount, 0),
      expense: monthExpenses.filter((entry) => entry.type !== "INCOME").reduce((sum, entry) => sum + entry.amount, 0)
    };
  });
}

export function applyDraftTemplate(template: ExpenseDraftTemplate, month: string, baseDate: string): {
  application: DraftApplication;
  expenses: ExpenseRecord[];
} {
  const generatedExpenseIds = Array.from({ length: template.installmentCount }, (_, index) => `${template.id}-${month}-${index + 1}`);
  const expenses = generatedExpenseIds.map((id, index) =>
    createExpenseRecord({
      id,
      title: `${template.title} ${index + 1}`,
      description: template.notes ?? template.title,
      amount: Number((template.targetAmount / template.installmentCount).toFixed(2)),
      category: template.category,
      type: template.isLoan ? "LOAN" : "EXPENSE",
      date: baseDate,
      draftId: template.id,
      installmentIndex: index + 1,
      isLoan: template.isLoan
    })
  );
  return {
    application: {
      id: `${template.id}-${month}`,
      draftId: template.id,
      month,
      status: "Completed",
      generatedExpenseIds,
      createdAt: new Date(baseDate).toISOString()
    },
    expenses
  };
}

export function reconcileLoanRepayment(loan: LoanRecord, paymentAmount: number): LoanRecord {
  const repaid = Number((loan.repaid + paymentAmount).toFixed(2));
  const status = repaid >= loan.amount ? "cleared" : repaid > 0 ? "partially_repaid" : "active";
  return {
    ...loan,
    repaid,
    status
  };
}

export function computeSavingsGoalProgress(goal: SavingGoalRecord, entries: SavingEntryRecord[]): {
  savedAmount: number;
  progressRatio: number;
} {
  const total = entries
    .filter((entry) => entry.goalId === goal.id)
    .reduce((sum, entry) => sum + (entry.type === "deposit" ? entry.amount : -entry.amount), 0);
  const savedAmount = Number((goal.savedAmount + total).toFixed(2));
  return {
    savedAmount,
    progressRatio: goal.targetAmount === 0 ? 0 : Math.min(1, savedAmount / goal.targetAmount)
  };
}

export function buildStatementHtml(snapshot: DashboardSnapshot, month: string): string {
  const categories = snapshot.categories
    .map((category) => `<tr><td>${category.name}</td><td>${formatCurrency(category.amount)}</td></tr>`)
    .join("");
  return `
    <html>
      <body style="font-family: JetBrains Mono, monospace; background:#0B0F17; color:#F8FAFC; padding:24px;">
        <h1 style="font-family: Plus Jakarta Sans, sans-serif;">Expense Expert Statement</h1>
        <p>Period: ${month}</p>
        <p>Total Income: ${formatCurrency(snapshot.income)}</p>
        <p>Total Expenses: ${formatCurrency(snapshot.expenses)}</p>
        <p>Net Cashflow: ${formatCurrency(snapshot.netCashflow)}</p>
        <p>Active Loan Liabilities: ${formatCurrency(snapshot.activeLoans)}</p>
        <table>${categories}</table>
      </body>
    </html>
  `;
}

export function offlineSnapshotFromCache(state: AppLedgerState): DashboardSnapshot {
  return calculateSnapshot(state);
}

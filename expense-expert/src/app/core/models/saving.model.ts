export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBankAccountDto {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export interface UpdateBankAccountDto {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
}

export interface SavingGoal {
  id: string;
  purpose: string;
  targetAmount: number;
  savedAmount: number;
  month: string; // "YYYY-MM"
  bankAccountId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSavingGoalDto {
  purpose: string;
  targetAmount: number;
  month: string;
  bankAccountId: string;
}

export interface UpdateSavingGoalDto {
  purpose?: string;
  targetAmount?: number;
  bankAccountId?: string;
}

export interface SavingEntry {
  id: string;
  goalId: string;
  amount: number;
  date: Date;
  month: string;
  note: string;
  createdAt: Date;
}

export interface CreateSavingEntryDto {
  goalId: string;
  amount: number;
  date: Date;
  note: string;
}

export interface SavingSummary {
  purpose: string;
  totalSaved: number;
  months: number;
}

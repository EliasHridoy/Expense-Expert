export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  createdAt?: any;
  updatedAt?: any;
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

export type DurationUnit = 'months' | 'years';

export interface SavingGoal {
  id: string;
  purpose: string;
  targetAmount: number; // Stored in dollars or integer cents depending on context
  savedAmount: number;
  durationValue: number;
  durationUnit: DurationUnit;
  startMonth: string; // "YYYY-MM"
  endMonth: string;   // "YYYY-MM"
  bankAccountId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface CreateSavingGoalDto {
  purpose: string;
  targetAmount: number;
  durationValue: number;
  durationUnit: DurationUnit;
  startMonth: string;
  bankAccountId?: string;
}

export interface UpdateSavingGoalDto {
  purpose?: string;
  targetAmount?: number;
  bankAccountId?: string;
  durationValue?: number;
  durationUnit?: DurationUnit;
  startMonth?: string;
  endMonth?: string;
  savedAmount?: number;
}

export type SavingEntryType = 'deposit' | 'withdrawal';

export interface SavingEntry {
  id: string;
  goalId: string;
  amount: number;
  type: SavingEntryType;
  date: string;
  month: string;
  note: string;
  createdAt?: any;
}

export interface CreateSavingEntryDto {
  goalId: string;
  amount: number;
  type: SavingEntryType;
  date: string;
  note?: string;
}

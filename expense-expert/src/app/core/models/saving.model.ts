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

export type DurationUnit = 'months' | 'years';

export interface SavingGoal {
  id: string;
  purpose: string;
  targetAmount: number;
  savedAmount: number;
  /** Duration value (e.g. 3, 6, 1) */
  durationValue: number;
  /** Duration unit: 'months' | 'years' */
  durationUnit: DurationUnit;
  /** Start month "YYYY-MM" */
  startMonth: string;
  /** End month "YYYY-MM" (computed from startMonth + duration) */
  endMonth: string;
  bankAccountId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSavingGoalDto {
  purpose: string;
  targetAmount: number;
  durationValue: number;
  durationUnit: DurationUnit;
  startMonth: string;
  bankAccountId: string;
}

export interface UpdateSavingGoalDto {
  purpose?: string;
  targetAmount?: number;
  bankAccountId?: string;
  durationValue?: number;
  durationUnit?: DurationUnit;
  startMonth?: string;
  endMonth?: string;
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

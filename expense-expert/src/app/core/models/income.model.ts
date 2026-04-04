export interface UserProfile {
  monthlySalary: number;
  updatedAt: Date;
}

export interface IncomeEntry {
  id: string;
  source: string;
  amount: number;
  month: string; // "YYYY-MM"
  note: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIncomeEntryDto {
  source: string;
  amount: number;
  date: Date;
  note: string;
}

export interface UpdateIncomeEntryDto {
  source?: string;
  amount?: number;
  date?: Date;
  note?: string;
}

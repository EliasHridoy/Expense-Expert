export interface UserProfile {
  monthlySalary: number;
  salaries?: { [month: string]: number };
  createdAt?: Date;
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

export interface IncomeDraft {
  id: string;
  source: string;
  amount: number;
  note: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIncomeDraftDto {
  source: string;
  amount: number;
  note: string;
}

export interface UpdateIncomeDraftDto {
  source?: string;
  amount?: number;
  note?: string;
  isActive?: boolean;
}

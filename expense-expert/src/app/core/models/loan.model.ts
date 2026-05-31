export type LoanStatus = 'active' | 'partially_repaid' | 'cleared';

export interface LoanTaken {
  id: string;
  personId: string; // References users/{uid}/persons/{id}
  amount: number; // Original amount borrowed
  note: string;
  month: string; // "YYYY-MM" - month the loan was taken
  date: Date;
  repaid: number; // Total amount repaid so far
  status: LoanStatus; // 'active' | 'partially_repaid' | 'cleared'
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLoanTakenDto {
  personId: string;
  amount: number;
  note: string;
  date: Date;
}

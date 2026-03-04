export interface ExpenseDraft {
  id: string;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  isLoan: boolean;
  loanPersonId: string | null;
  installmentCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDraftDto {
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  isLoan: boolean;
  loanPersonId: string | null;
  installmentCount: number;
}

export interface UpdateDraftDto {
  title?: string;
  description?: string;
  category?: string;
  targetAmount?: number;
  isLoan?: boolean;
  loanPersonId?: string | null;
  installmentCount?: number;
  isActive?: boolean;
}

export enum DraftApplicationStatus {
  Pending = 'pending',
  Partial = 'partial',
  Completed = 'completed',
}

export interface DraftPayment {
  amount: number;
  date: Date;
  expenseId: string;
}

export interface DraftApplication {
  id: string;
  draftId: string;
  month: string;
  targetAmount: number;
  paidAmount: number;
  installmentsPaid: number;
  totalInstallments: number;
  status: DraftApplicationStatus;
  payments: DraftPayment[];
  createdAt: Date;
  updatedAt: Date;
}

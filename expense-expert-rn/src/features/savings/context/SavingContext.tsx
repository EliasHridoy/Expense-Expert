import { createContext } from 'react';
import {
  BankAccount,
  CreateBankAccountDto,
  UpdateBankAccountDto,
  SavingGoal,
  CreateSavingGoalDto,
  UpdateSavingGoalDto,
  SavingEntry,
  CreateSavingEntryDto,
} from '../types/saving.types';

export interface SavingContextValue {
  bankAccounts: BankAccount[];
  goals: SavingGoal[];
  entries: SavingEntry[];
  isLoading: boolean;
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  refreshSavings: () => Promise<void>;
  addBankAccount: (dto: CreateBankAccountDto) => Promise<BankAccount>;
  updateBankAccount: (id: string, dto: UpdateBankAccountDto) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<void>;
  addGoal: (dto: CreateSavingGoalDto) => Promise<SavingGoal>;
  updateGoal: (id: string, dto: UpdateSavingGoalDto) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addEntry: (dto: CreateSavingEntryDto) => Promise<SavingEntry>;
}

export const SavingContext = createContext<SavingContextValue | null>(null);

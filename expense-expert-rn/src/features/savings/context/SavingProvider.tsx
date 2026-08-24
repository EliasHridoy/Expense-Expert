import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useExpenses } from '../../expenses/hooks/useExpenses';
import { ExpenseCategory } from '../../expenses/types/category.types';
import { SavingService } from '../services/saving.service';
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
import { SavingContext, SavingContextValue } from './SavingContext';

export interface SavingProviderProps {
  children: React.ReactNode;
}

export const SavingProvider: React.FC<SavingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { addExpense } = useExpenses();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [entries, setEntries] = useState<SavingEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMonth, setActiveMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );

  const refreshSavings = useCallback(async () => {
    if (!user) {
      setBankAccounts([]);
      setGoals([]);
      setEntries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [accountsData, goalsData, entriesData] = await Promise.all([
        SavingService.getBankAccounts(user.uid),
        SavingService.getGoals(user.uid),
        SavingService.getEntries(user.uid),
      ]);
      setBankAccounts(accountsData);
      setGoals(goalsData);
      setEntries(entriesData);
    } catch (err) {
      console.error('Failed to load savings data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshSavings();
  }, [refreshSavings]);

  const handleAddBankAccount = async (dto: CreateBankAccountDto): Promise<BankAccount> => {
    if (!user) throw new Error('Not authenticated');
    const created = await SavingService.addBankAccount(user.uid, dto);
    setBankAccounts((prev) => [...prev, created]);
    return created;
  };

  const handleUpdateBankAccount = async (id: string, dto: UpdateBankAccountDto): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    await SavingService.updateBankAccount(user.uid, id, dto);
    setBankAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...dto } : acc))
    );
  };

  const handleDeleteBankAccount = async (id: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    await SavingService.deleteBankAccount(user.uid, id);
    setBankAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  const handleAddGoal = async (dto: CreateSavingGoalDto): Promise<SavingGoal> => {
    if (!user) throw new Error('Not authenticated');
    const created = await SavingService.addGoal(user.uid, dto);
    setGoals((prev) => [...prev, created]);
    return created;
  };

  const handleUpdateGoal = async (id: string, dto: UpdateSavingGoalDto): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    await SavingService.updateGoal(user.uid, id, dto);
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...dto } : g))
    );
  };

  const handleDeleteGoal = async (id: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    await SavingService.deleteGoal(user.uid, id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleAddEntry = async (dto: CreateSavingEntryDto): Promise<SavingEntry> => {
    if (!user) throw new Error('Not authenticated');
    const targetGoal = goals.find((g) => g.id === dto.goalId);
    if (!targetGoal) throw new Error('Saving goal not found');

    const { entry, updatedGoal } = await SavingService.addEntry(user.uid, dto, targetGoal);
    setEntries((prev) => [entry, ...prev]);
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));

    // When saving/depositing, also log an Expense under category 'savings' (Angular parity)
    if (dto.type === 'deposit') {
      try {
        await addExpense({
          amount: dto.amount,
          category: ExpenseCategory.Savings,
          title: `Saving: ${targetGoal.purpose}`,
          description: dto.note || `Deposit to ${targetGoal.purpose}`,
          date: dto.date,
        });
      } catch (expErr) {
        console.warn('Could not mirror saving deposit into expense list:', expErr);
      }
    }

    return entry;
  };

  const value = useMemo<SavingContextValue>(
    () => ({
      bankAccounts,
      goals,
      entries,
      isLoading,
      activeMonth,
      setActiveMonth,
      refreshSavings,
      addBankAccount: handleAddBankAccount,
      updateBankAccount: handleUpdateBankAccount,
      deleteBankAccount: handleDeleteBankAccount,
      addGoal: handleAddGoal,
      updateGoal: handleUpdateGoal,
      deleteGoal: handleDeleteGoal,
      addEntry: handleAddEntry,
    }),
    [bankAccounts, goals, entries, isLoading, activeMonth, refreshSavings]
  );

  return <SavingContext.Provider value={value}>{children}</SavingContext.Provider>;
};

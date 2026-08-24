import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useExpenses } from '../../expenses/hooks/useExpenses';
import { ExpenseCategory } from '../../expenses/types/category.types';
import { DraftService } from '../services/draft.service';
import {
  ExpenseDraft,
  CreateDraftDto,
  UpdateDraftDto,
  DraftApplication,
} from '../types/draft.types';
import { DraftContext, DraftContextValue } from './DraftContext';

export interface DraftProviderProps {
  children: React.ReactNode;
}

export const DraftProvider: React.FC<DraftProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { addExpense } = useExpenses();
  const [drafts, setDrafts] = useState<ExpenseDraft[]>([]);
  const [applications, setApplications] = useState<DraftApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMonth, setActiveMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );

  const refreshDrafts = useCallback(async () => {
    if (!user) {
      setDrafts([]);
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [draftsData, appsData] = await Promise.all([
        DraftService.getDrafts(user.uid),
        DraftService.getApplications(user.uid, activeMonth),
      ]);
      setDrafts(draftsData);
      setApplications(appsData);
    } catch (err) {
      console.error('Failed to load drafts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeMonth]);

  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts]);

  const handleCreateDraft = async (dto: CreateDraftDto): Promise<ExpenseDraft> => {
    if (!user) throw new Error('Not authenticated');
    const created = await DraftService.createDraft(user.uid, dto);
    setDrafts((prev) => [...prev, created]);
    return created;
  };

  const handleUpdateDraft = async (id: string, dto: UpdateDraftDto): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    await DraftService.updateDraft(user.uid, id, dto);
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...dto } : d))
    );
  };

  const handleDeleteDraft = async (id: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    await DraftService.deleteDraft(user.uid, id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleApplyDraft = async (
    draft: ExpenseDraft,
    month: string
  ): Promise<DraftApplication> => {
    if (!user) throw new Error('Not authenticated');
    const app = await DraftService.applyDraftToMonth(user.uid, draft, month);
    setApplications((prev) => {
      const exists = prev.some((a) => a.id === app.id);
      if (exists) return prev.map((a) => (a.id === app.id ? app : a));
      return [...prev, app];
    });
    return app;
  };

  const handleRecordPayment = async (
    application: DraftApplication,
    amount: number,
    draft: ExpenseDraft
  ): Promise<string> => {
    if (!user) throw new Error('Not authenticated');

    // 1. Create real Expense transaction matching Angular parity
    const expense = await addExpense({
      title: `${draft.title} - Installment ${application.installmentsPaid + 1}`,
      description: `Payment for draft template: ${draft.title}`,
      amount,
      category: (draft.category as ExpenseCategory) || ExpenseCategory.Other,
      date: new Date().toISOString().substring(0, 10),
      isLoan: draft.isLoan,
      loanPersonId: draft.loanPersonId,
      draftId: draft.id,
    });

    // 2. Record payment on DraftApplication
    const updatedApp = await DraftService.recordPayment(
      user.uid,
      application,
      amount,
      expense.id
    );

    setApplications((prev) =>
      prev.map((a) => (a.id === updatedApp.id ? updatedApp : a))
    );

    return expense.id;
  };

  const value = useMemo<DraftContextValue>(
    () => ({
      drafts,
      applications,
      isLoading,
      activeMonth,
      setActiveMonth,
      refreshDrafts,
      createDraft: handleCreateDraft,
      updateDraft: handleUpdateDraft,
      deleteDraft: handleDeleteDraft,
      applyDraftToMonth: handleApplyDraft,
      recordPayment: handleRecordPayment,
    }),
    [drafts, applications, isLoading, activeMonth, refreshDrafts]
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
};

import { createContext } from 'react';
import {
  ExpenseDraft,
  CreateDraftDto,
  UpdateDraftDto,
  DraftApplication,
} from '../types/draft.types';

export interface DraftContextValue {
  drafts: ExpenseDraft[];
  applications: DraftApplication[];
  isLoading: boolean;
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  refreshDrafts: () => Promise<void>;
  createDraft: (dto: CreateDraftDto) => Promise<ExpenseDraft>;
  updateDraft: (id: string, dto: UpdateDraftDto) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  applyDraftToMonth: (draft: ExpenseDraft, month: string) => Promise<DraftApplication>;
  recordPayment: (application: DraftApplication, amount: number, draft: ExpenseDraft) => Promise<string>;
}

export const DraftContext = createContext<DraftContextValue | null>(null);

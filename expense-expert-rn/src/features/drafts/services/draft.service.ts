import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../config/firebase';
import {
  ExpenseDraft,
  CreateDraftDto,
  UpdateDraftDto,
  DraftApplication,
  DraftApplicationStatus,
} from '../types/draft.types';

const DRAFTS_CACHE = '@ee_expense_drafts';
const APPLICATIONS_CACHE = '@ee_draft_applications';

export const DraftService = {
  // --- Draft Templates ---
  async getDrafts(userId: string): Promise<ExpenseDraft[]> {
    try {
      const colRef = collection(db, 'users', userId, 'expense-drafts');
      const q = query(colRef, orderBy('title', 'asc'));
      const snap = await getDocs(q);
      const drafts = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ExpenseDraft[];

      await AsyncStorage.setItem(`${DRAFTS_CACHE}_${userId}`, JSON.stringify(drafts));
      return drafts;
    } catch (err) {
      console.warn('Falling back to cached drafts:', err);
      const cached = await AsyncStorage.getItem(`${DRAFTS_CACHE}_${userId}`);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async createDraft(userId: string, dto: CreateDraftDto): Promise<ExpenseDraft> {
    const id = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const docRef = doc(db, 'users', userId, 'expense-drafts', id);
    const newDraft: ExpenseDraft = {
      id,
      title: dto.title,
      description: dto.description || '',
      category: dto.category,
      targetAmount: dto.targetAmount,
      isLoan: dto.isLoan || false,
      loanPersonId: dto.loanPersonId || null,
      installmentCount: dto.installmentCount || 1,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, newDraft);
    return newDraft;
  },

  async updateDraft(userId: string, id: string, dto: UpdateDraftDto): Promise<void> {
    const docRef = doc(db, 'users', userId, 'expense-drafts', id);
    await setDoc(docRef, { ...dto, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteDraft(userId: string, id: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'expense-drafts', id);
    await deleteDoc(docRef);
  },

  // --- Monthly Draft Applications ---
  async getApplications(userId: string, month?: string): Promise<DraftApplication[]> {
    try {
      const colRef = collection(db, 'users', userId, 'draft-applications');
      const q = month
        ? query(colRef, where('month', '==', month))
        : query(colRef, orderBy('month', 'desc'));
      const snap = await getDocs(q);
      const apps = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as DraftApplication[];

      await AsyncStorage.setItem(`${APPLICATIONS_CACHE}_${userId}`, JSON.stringify(apps));
      return apps;
    } catch (err) {
      console.warn('Falling back to cached draft applications:', err);
      const cached = await AsyncStorage.getItem(`${APPLICATIONS_CACHE}_${userId}`);
      const list: DraftApplication[] = cached ? JSON.parse(cached) : [];
      return month ? list.filter((a) => a.month === month) : list;
    }
  },

  async applyDraftToMonth(
    userId: string,
    draft: ExpenseDraft,
    month: string
  ): Promise<DraftApplication> {
    const id = `app_${draft.id}_${month}`;
    const docRef = doc(db, 'users', userId, 'draft-applications', id);

    const newApp: DraftApplication = {
      id,
      draftId: draft.id,
      month,
      targetAmount: draft.targetAmount,
      paidAmount: 0,
      installmentsPaid: 0,
      totalInstallments: draft.installmentCount,
      status: DraftApplicationStatus.Pending,
      payments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, newApp);
    return newApp;
  },

  async recordPayment(
    userId: string,
    application: DraftApplication,
    amount: number,
    expenseId: string
  ): Promise<DraftApplication> {
    const docRef = doc(db, 'users', userId, 'draft-applications', application.id);
    const newPaid = application.paidAmount + amount;
    const newInstallments = application.installmentsPaid + 1;
    const newStatus =
      newPaid >= application.targetAmount
        ? DraftApplicationStatus.Completed
        : DraftApplicationStatus.Partial;

    const newPayments = [
      ...(application.payments || []),
      { amount, date: new Date().toISOString(), expenseId },
    ];

    const updatedApp: DraftApplication = {
      ...application,
      paidAmount: newPaid,
      installmentsPaid: newInstallments,
      status: newStatus,
      payments: newPayments,
    };

    await setDoc(
      docRef,
      {
        paidAmount: newPaid,
        installmentsPaid: newInstallments,
        status: newStatus,
        payments: newPayments,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return updatedApp;
  },
};

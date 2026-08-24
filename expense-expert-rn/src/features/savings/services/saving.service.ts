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
  BankAccount,
  CreateBankAccountDto,
  UpdateBankAccountDto,
  SavingGoal,
  CreateSavingGoalDto,
  UpdateSavingGoalDto,
  SavingEntry,
  CreateSavingEntryDto,
  DurationUnit,
} from '../types/saving.types';

const BANK_ACCOUNTS_CACHE = '@ee_bank_accounts';
const SAVING_GOALS_CACHE = '@ee_saving_goals';
const SAVING_ENTRIES_CACHE = '@ee_saving_entries';

export const SavingService = {
  computeEndMonth(startMonth: string, durationValue: number, durationUnit: DurationUnit): string {
    const [yearStr, monthStr] = startMonth.split('-');
    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    const month = parseInt(monthStr, 10) || (new Date().getMonth() + 1);
    const totalMonths = durationUnit === 'years' ? durationValue * 12 : durationValue;
    const endDate = new Date(year, month - 1 + totalMonths - 1, 1);
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    return `${endYear}-${endMonth}`;
  },

  // --- Bank Accounts ---
  async getBankAccounts(userId: string): Promise<BankAccount[]> {
    try {
      const colRef = collection(db, 'users', userId, 'bank-accounts');
      const q = query(colRef, orderBy('bankName', 'asc'));
      const snap = await getDocs(q);
      const accounts = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as BankAccount[];

      await AsyncStorage.setItem(`${BANK_ACCOUNTS_CACHE}_${userId}`, JSON.stringify(accounts));
      return accounts;
    } catch (err) {
      console.warn('Falling back to local cached bank accounts:', err);
      const cached = await AsyncStorage.getItem(`${BANK_ACCOUNTS_CACHE}_${userId}`);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async addBankAccount(userId: string, dto: CreateBankAccountDto): Promise<BankAccount> {
    const id = `bank_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const docRef = doc(db, 'users', userId, 'bank-accounts', id);
    const newAccount: BankAccount = {
      id,
      ...dto,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, newAccount);
    return newAccount;
  },

  async updateBankAccount(userId: string, id: string, dto: UpdateBankAccountDto): Promise<void> {
    const docRef = doc(db, 'users', userId, 'bank-accounts', id);
    await setDoc(docRef, { ...dto, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteBankAccount(userId: string, id: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'bank-accounts', id);
    await deleteDoc(docRef);
  },

  // --- Saving Goals ---
  async getGoals(userId: string): Promise<SavingGoal[]> {
    try {
      const colRef = collection(db, 'users', userId, 'saving-goals');
      const q = query(colRef, orderBy('purpose', 'asc'));
      const snap = await getDocs(q);
      const goals = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as SavingGoal[];

      await AsyncStorage.setItem(`${SAVING_GOALS_CACHE}_${userId}`, JSON.stringify(goals));
      return goals;
    } catch (err) {
      console.warn('Falling back to local cached saving goals:', err);
      const cached = await AsyncStorage.getItem(`${SAVING_GOALS_CACHE}_${userId}`);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async addGoal(userId: string, dto: CreateSavingGoalDto): Promise<SavingGoal> {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const endMonth = this.computeEndMonth(dto.startMonth, dto.durationValue, dto.durationUnit);
    const docRef = doc(db, 'users', userId, 'saving-goals', id);
    const newGoal: SavingGoal = {
      id,
      purpose: dto.purpose,
      targetAmount: dto.targetAmount,
      savedAmount: 0,
      durationValue: dto.durationValue,
      durationUnit: dto.durationUnit,
      startMonth: dto.startMonth,
      endMonth,
      bankAccountId: dto.bankAccountId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, newGoal);
    return newGoal;
  },

  async updateGoal(userId: string, id: string, dto: UpdateSavingGoalDto): Promise<void> {
    const docRef = doc(db, 'users', userId, 'saving-goals', id);
    const updatePayload: any = { ...dto, updatedAt: serverTimestamp() };

    if (dto.startMonth || dto.durationValue || dto.durationUnit) {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const current = snap.data() as SavingGoal;
        const startMonth = dto.startMonth ?? current.startMonth;
        const durationValue = dto.durationValue ?? current.durationValue;
        const durationUnit = dto.durationUnit ?? current.durationUnit;
        updatePayload.endMonth = this.computeEndMonth(startMonth, durationValue, durationUnit);
      }
    }

    await setDoc(docRef, updatePayload, { merge: true });
  },

  async deleteGoal(userId: string, id: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'saving-goals', id);
    await deleteDoc(docRef);
  },

  // --- Saving Entries (Deposits & Withdrawals) ---
  async getEntries(userId: string, goalId?: string): Promise<SavingEntry[]> {
    try {
      const colRef = collection(db, 'users', userId, 'saving-entries');
      const q = goalId
        ? query(colRef, where('goalId', '==', goalId), orderBy('date', 'desc'))
        : query(colRef, orderBy('date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SavingEntry[];
    } catch (err) {
      console.warn('Falling back to local cached saving entries:', err);
      const cached = await AsyncStorage.getItem(`${SAVING_ENTRIES_CACHE}_${userId}`);
      const list: SavingEntry[] = cached ? JSON.parse(cached) : [];
      return goalId ? list.filter((e) => e.goalId === goalId) : list;
    }
  },

  async addEntry(
    userId: string,
    dto: CreateSavingEntryDto,
    currentGoal: SavingGoal
  ): Promise<{ entry: SavingEntry; updatedGoal: SavingGoal }> {
    const id = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const month = dto.date.substring(0, 7);
    const docRef = doc(db, 'users', userId, 'saving-entries', id);

    const newEntry: SavingEntry = {
      id,
      goalId: dto.goalId,
      amount: dto.amount,
      type: dto.type,
      date: dto.date,
      month,
      note: dto.note || '',
      createdAt: serverTimestamp(),
    };

    await setDoc(docRef, newEntry);

    // Update goal's saved amount
    const delta = dto.type === 'withdrawal' ? -dto.amount : dto.amount;
    const newSavedAmount = Math.max(0, (currentGoal.savedAmount || 0) + delta);
    const goalRef = doc(db, 'users', userId, 'saving-goals', dto.goalId);
    await setDoc(goalRef, { savedAmount: newSavedAmount, updatedAt: serverTimestamp() }, { merge: true });

    const updatedGoal: SavingGoal = {
      ...currentGoal,
      savedAmount: newSavedAmount,
    };

    return { entry: newEntry, updatedGoal };
  },
};

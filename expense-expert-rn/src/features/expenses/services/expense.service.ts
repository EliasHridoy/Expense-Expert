import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import {
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  SyncStatus,
} from '../types/expense.types';
import { toCents, fromCents } from '../utils/currency.util';
import { formatMonth, toISODate } from '../utils/date.util';
import { OfflineQueueService } from './offline-queue.service';

/**
 * ExpenseService
 * 
 * Provides Firestore operations for transactions with offline mutation queueing
 * and idempotent background synchronization.
 */
export const ExpenseService = {
  /**
   * Helper to construct user expenses collection path.
   */
  getExpensesPath(userId: string): string {
    return `users/${userId}/expenses`;
  },

  /**
   * Generates a deterministic client-side ID for new transactions.
   */
  generateExpenseId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  },

  /**
   * Creates an expense. If online, writes directly to Firestore.
   * If offline or write fails, enqueues the mutation to AsyncStorage.
   */
  async addExpense(
    userId: string,
    dto: CreateExpenseDto,
    isOnline: boolean
  ): Promise<Expense> {
    const expenseId = this.generateExpenseId();
    const amountInCents = toCents(dto.amount);
    const amount = fromCents(amountInCents);
    const dateIso = toISODate(dto.date);
    const month = formatMonth(dto.date);
    const nowIso = new Date().toISOString();

    const expense: Expense = {
      id: expenseId,
      title: dto.title,
      description: dto.description || '',
      amount,
      amountInCents,
      category: dto.category,
      date: dateIso,
      month,
      isLoan: Boolean(dto.isLoan),
      loanPersonId: dto.loanPersonId ?? null,
      loanCleared: false,
      loanRepaid: 0,
      loanTakenId: dto.loanTakenId ?? null,
      draftId: dto.draftId ?? null,
      installmentIndex: dto.installmentIndex ?? null,
      createdAt: nowIso,
      updatedAt: nowIso,
      syncStatus: isOnline ? ('synced' as SyncStatus) : ('pending' as SyncStatus),
    };

    if (isOnline) {
      try {
        const docRef = doc(db, this.getExpensesPath(userId), expenseId);
        const { syncStatus: _, ...firestoreData } = expense;
        await setDoc(docRef, {
          ...firestoreData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return expense;
      } catch (_error) {
        // Fall back to offline queue on network error
        expense.syncStatus = 'pending';
        await OfflineQueueService.enqueue({
          type: 'CREATE_EXPENSE',
          userId,
          expenseId,
          payload: expense,
        });
        return expense;
      }
    }

    // Offline flow
    await OfflineQueueService.enqueue({
      type: 'CREATE_EXPENSE',
      userId,
      expenseId,
      payload: expense,
    });
    return expense;
  },

  /**
   * Updates an existing expense. Routes to Firestore or offline queue.
   */
  async updateExpense(
    userId: string,
    id: string,
    dto: UpdateExpenseDto,
    isOnline: boolean
  ): Promise<void> {
    const payload: Record<string, any> = { ...dto };

    if (dto.amount !== undefined) {
      const amountInCents = toCents(dto.amount);
      payload.amountInCents = amountInCents;
      payload.amount = fromCents(amountInCents);
    }

    if (dto.date !== undefined) {
      payload.date = toISODate(dto.date);
      payload.month = formatMonth(dto.date);
    }

    payload.updatedAt = new Date().toISOString();

    if (isOnline) {
      try {
        const docRef = doc(db, this.getExpensesPath(userId), id);
        await updateDoc(docRef, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        return;
      } catch (_error) {
        await OfflineQueueService.enqueue({
          type: 'UPDATE_EXPENSE',
          userId,
          expenseId: id,
          payload,
        });
        return;
      }
    }

    await OfflineQueueService.enqueue({
      type: 'UPDATE_EXPENSE',
      userId,
      expenseId: id,
      payload,
    });
  },

  /**
   * Deletes an expense by ID. Routes to Firestore or offline queue.
   */
  async deleteExpense(
    userId: string,
    id: string,
    isOnline: boolean
  ): Promise<void> {
    if (isOnline) {
      try {
        const docRef = doc(db, this.getExpensesPath(userId), id);
        await deleteDoc(docRef);
        return;
      } catch (_error) {
        await OfflineQueueService.enqueue({
          type: 'DELETE_EXPENSE',
          userId,
          expenseId: id,
          payload: { id },
        });
        return;
      }
    }

    await OfflineQueueService.enqueue({
      type: 'DELETE_EXPENSE',
      userId,
      expenseId: id,
      payload: { id },
    });
  },

  /**
   * Fetches expenses for a specific partition month from Firestore.
   */
  async getExpensesByMonth(userId: string, month: string): Promise<Expense[]> {
    const q = query(
      collection(db, this.getExpensesPath(userId)),
      where('month', '==', month),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const amountInCents = data.amountInCents ?? toCents(data.amount);
      const amount = data.amount ?? fromCents(amountInCents);

      return {
        id: docSnap.id,
        title: data.title || '',
        description: data.description || '',
        amount,
        amountInCents,
        category: data.category || 'General',
        date: data.date ? toISODate(data.date) : new Date().toISOString(),
        month: data.month || month,
        isLoan: Boolean(data.isLoan),
        loanPersonId: data.loanPersonId ?? null,
        loanCleared: Boolean(data.loanCleared),
        loanRepaid: data.loanRepaid ?? 0,
        loanTakenId: data.loanTakenId ?? null,
        draftId: data.draftId ?? null,
        installmentIndex: data.installmentIndex ?? null,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate().toISOString()
          : data.updatedAt || new Date().toISOString(),
        syncStatus: 'synced' as SyncStatus,
      };
    });
  },

  /**
   * Fetches a single expense doc by ID from Firestore.
   */
  async getExpenseById(userId: string, id: string): Promise<Expense | null> {
    const docRef = doc(db, this.getExpensesPath(userId), id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    const amountInCents = data.amountInCents ?? toCents(data.amount);
    const amount = data.amount ?? fromCents(amountInCents);

    return {
      id: snap.id,
      title: data.title || '',
      description: data.description || '',
      amount,
      amountInCents,
      category: data.category || 'General',
      date: data.date ? toISODate(data.date) : new Date().toISOString(),
      month: data.month || formatMonth(data.date || new Date()),
      isLoan: Boolean(data.isLoan),
      loanPersonId: data.loanPersonId ?? null,
      loanCleared: Boolean(data.loanCleared),
      loanRepaid: data.loanRepaid ?? 0,
      loanTakenId: data.loanTakenId ?? null,
      draftId: data.draftId ?? null,
      installmentIndex: data.installmentIndex ?? null,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString()
        : data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate().toISOString()
        : data.updatedAt || new Date().toISOString(),
      syncStatus: 'synced' as SyncStatus,
    };
  },

  /**
   * Processes all pending queued mutations for the user in FIFO order.
   * Uses idempotent Firestore write operations.
   */
  async processSyncQueue(userId: string): Promise<number> {
    const queue = await OfflineQueueService.getQueue();
    const userMutations = queue.filter((item) => item.userId === userId);
    let syncedCount = 0;

    for (const mutation of userMutations) {
      try {
        const docRef = doc(db, this.getExpensesPath(userId), mutation.expenseId);

        if (mutation.type === 'CREATE_EXPENSE') {
          const { syncStatus: _, ...payloadWithoutSync } = mutation.payload || {};
          await setDoc(
            docRef,
            {
              ...payloadWithoutSync,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } else if (mutation.type === 'UPDATE_EXPENSE') {
          const { syncStatus: _, ...payloadWithoutSync } = mutation.payload || {};
          await setDoc(
            docRef,
            {
              ...payloadWithoutSync,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } else if (mutation.type === 'DELETE_EXPENSE') {
          await deleteDoc(docRef);
        }

        await OfflineQueueService.remove(mutation.id);
        syncedCount++;
      } catch (error: any) {
        const errorMsg = error?.message || 'Sync failed';
        await OfflineQueueService.markFailed(mutation.id, errorMsg);
        // Break sync cycle on failure to preserve sequential dependency
        break;
      }
    }

    return syncedCount;
  },
};

import { ExpenseService } from '@/features/expenses/services/expense.service';
import { OfflineQueueService } from '@/features/expenses/services/offline-queue.service';
import {
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mock-collection-ref'),
  doc: jest.fn((_db, path, id) => `mock-doc-ref:${path}/${id}`),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(() => 'mock-query'),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}));

jest.mock('@/config/firebase', () => ({
  db: {},
}));

jest.mock('@/features/expenses/services/offline-queue.service', () => ({
  OfflineQueueService: {
    getQueue: jest.fn(),
    enqueue: jest.fn(),
    remove: jest.fn(),
    markFailed: jest.fn(),
    clearQueue: jest.fn(),
    getPendingCount: jest.fn(),
  },
}));

describe('ExpenseService', () => {
  const userId = 'user_test_123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addExpense', () => {
    it('writes to Firestore and returns expense with syncStatus "synced" when online', async () => {
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await ExpenseService.addExpense(
        userId,
        {
          title: 'Grocery Store',
          description: 'Weekly veggies',
          amount: 45.5,
          category: 'Food',
          date: '2026-08-23T10:00:00.000Z',
        },
        true
      );

      expect(result.id).toMatch(/^exp_\d+_[a-z0-9]+$/);
      expect(result.amount).toBe(45.5);
      expect(result.amountInCents).toBe(4550);
      expect(result.month).toBe('2026-08');
      expect(result.syncStatus).toBe('synced');
      expect(setDoc).toHaveBeenCalledTimes(1);
      expect(OfflineQueueService.enqueue).not.toHaveBeenCalled();
    });

    it('enqueues to OfflineQueueService and returns syncStatus "pending" when offline', async () => {
      (OfflineQueueService.enqueue as jest.Mock).mockResolvedValueOnce({});

      const result = await ExpenseService.addExpense(
        userId,
        {
          title: 'Offline Coffee',
          amount: 4.75,
          category: 'Food',
          date: '2026-08-23T10:00:00.000Z',
        },
        false
      );

      expect(result.syncStatus).toBe('pending');
      expect(result.amountInCents).toBe(475);
      expect(setDoc).not.toHaveBeenCalled();
      expect(OfflineQueueService.enqueue).toHaveBeenCalledTimes(1);
      expect(OfflineQueueService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CREATE_EXPENSE',
          userId,
          expenseId: result.id,
          payload: expect.objectContaining({
            title: 'Offline Coffee',
            amount: 4.75,
          }),
        })
      );
    });

    it('falls back to OfflineQueueService when online write rejects with network error', async () => {
      (setDoc as jest.Mock).mockRejectedValueOnce(new Error('Network offline'));
      (OfflineQueueService.enqueue as jest.Mock).mockResolvedValueOnce({});

      const result = await ExpenseService.addExpense(
        userId,
        {
          title: 'Failing Online Expense',
          amount: 20.0,
          category: 'Transport',
          date: '2026-08-23T10:00:00.000Z',
        },
        true
      );

      expect(result.syncStatus).toBe('pending');
      expect(OfflineQueueService.enqueue).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateExpense', () => {
    it('calls updateDoc when online', async () => {
      (updateDoc as jest.Mock).mockResolvedValueOnce(undefined);

      await ExpenseService.updateExpense(
        userId,
        'exp_123',
        { title: 'Updated Title', amount: 30.25 },
        true
      );

      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(OfflineQueueService.enqueue).not.toHaveBeenCalled();
    });

    it('enqueues UPDATE_EXPENSE when offline', async () => {
      (OfflineQueueService.enqueue as jest.Mock).mockResolvedValueOnce({});

      await ExpenseService.updateExpense(
        userId,
        'exp_123',
        { title: 'Updated Title' },
        false
      );

      expect(updateDoc).not.toHaveBeenCalled();
      expect(OfflineQueueService.enqueue).toHaveBeenCalledWith({
        type: 'UPDATE_EXPENSE',
        userId,
        expenseId: 'exp_123',
        payload: expect.objectContaining({ title: 'Updated Title' }),
      });
    });

    it('falls back to offline queue when updateDoc fails', async () => {
      (updateDoc as jest.Mock).mockRejectedValueOnce(new Error('Write timeout'));
      (OfflineQueueService.enqueue as jest.Mock).mockResolvedValueOnce({});

      await ExpenseService.updateExpense(
        userId,
        'exp_123',
        { title: 'Updated Title' },
        true
      );

      expect(OfflineQueueService.enqueue).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteExpense', () => {
    it('calls deleteDoc when online', async () => {
      (deleteDoc as jest.Mock).mockResolvedValueOnce(undefined);

      await ExpenseService.deleteExpense(userId, 'exp_123', true);

      expect(deleteDoc).toHaveBeenCalledTimes(1);
      expect(OfflineQueueService.enqueue).not.toHaveBeenCalled();
    });

    it('enqueues DELETE_EXPENSE when offline', async () => {
      (OfflineQueueService.enqueue as jest.Mock).mockResolvedValueOnce({});

      await ExpenseService.deleteExpense(userId, 'exp_123', false);

      expect(deleteDoc).not.toHaveBeenCalled();
      expect(OfflineQueueService.enqueue).toHaveBeenCalledWith({
        type: 'DELETE_EXPENSE',
        userId,
        expenseId: 'exp_123',
        payload: { id: 'exp_123' },
      });
    });

    it('falls back to offline queue when deleteDoc fails', async () => {
      (deleteDoc as jest.Mock).mockRejectedValueOnce(new Error('Delete error'));
      (OfflineQueueService.enqueue as jest.Mock).mockResolvedValueOnce({});

      await ExpenseService.deleteExpense(userId, 'exp_123', true);

      expect(OfflineQueueService.enqueue).toHaveBeenCalledTimes(1);
    });
  });

  describe('getExpensesByMonth', () => {
    it('queries and maps documents from Firestore', async () => {
      const mockDocs = [
        {
          id: 'exp_1',
          data: () => ({
            title: 'Dinner',
            amount: 50,
            amountInCents: 5000,
            category: 'Food',
            date: '2026-08-20T19:00:00.000Z',
            month: '2026-08',
            createdAt: { toDate: () => new Date('2026-08-20T19:00:00.000Z') },
            updatedAt: { toDate: () => new Date('2026-08-20T19:00:00.000Z') },
          }),
        },
      ];
      (getDocs as jest.Mock).mockResolvedValueOnce({ docs: mockDocs });

      const expenses = await ExpenseService.getExpensesByMonth(userId, '2026-08');

      expect(expenses).toHaveLength(1);
      expect(expenses[0].id).toBe('exp_1');
      expect(expenses[0].title).toBe('Dinner');
      expect(expenses[0].amountInCents).toBe(5000);
      expect(expenses[0].syncStatus).toBe('synced');
    });
  });

  describe('getExpenseById', () => {
    it('returns null if doc does not exist', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
      });

      const expense = await ExpenseService.getExpenseById(userId, 'non_existent');
      expect(expense).toBeNull();
    });

    it('returns mapped expense if doc exists', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        id: 'exp_123',
        data: () => ({
          title: 'Movie Night',
          amount: 15,
          amountInCents: 1500,
          category: 'Entertainment',
          date: '2026-08-21T20:00:00.000Z',
          month: '2026-08',
          isLoan: false,
        }),
      });

      const expense = await ExpenseService.getExpenseById(userId, 'exp_123');
      expect(expense).not.toBeNull();
      expect(expense?.title).toBe('Movie Night');
      expect(expense?.amount).toBe(15);
      expect(expense?.amountInCents).toBe(1500);
    });
  });

  describe('processSyncQueue', () => {
    it('processes queued mutations in FIFO order and removes them from queue', async () => {
      const mockQueue = [
        {
          id: 'mut_1',
          userId,
          expenseId: 'exp_1',
          type: 'CREATE_EXPENSE',
          payload: { title: 'Queued Coffee', amount: 4.5 },
          timestamp: 1000,
          retryCount: 0,
        },
        {
          id: 'mut_2',
          userId,
          expenseId: 'exp_1',
          type: 'UPDATE_EXPENSE',
          payload: { title: 'Queued Coffee Large', amount: 5.5 },
          timestamp: 2000,
          retryCount: 0,
        },
        {
          id: 'mut_3',
          userId,
          expenseId: 'exp_2',
          type: 'DELETE_EXPENSE',
          payload: { id: 'exp_2' },
          timestamp: 3000,
          retryCount: 0,
        },
      ];

      (OfflineQueueService.getQueue as jest.Mock).mockResolvedValueOnce(mockQueue);
      (setDoc as jest.Mock).mockResolvedValue(undefined);
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);
      (OfflineQueueService.remove as jest.Mock).mockResolvedValue(undefined);

      const count = await ExpenseService.processSyncQueue(userId);

      expect(count).toBe(3);
      expect(setDoc).toHaveBeenCalledTimes(2);
      expect(deleteDoc).toHaveBeenCalledTimes(1);
      expect(OfflineQueueService.remove).toHaveBeenCalledTimes(3);
      expect(OfflineQueueService.remove).toHaveBeenNthCalledWith(1, 'mut_1');
      expect(OfflineQueueService.remove).toHaveBeenNthCalledWith(2, 'mut_2');
      expect(OfflineQueueService.remove).toHaveBeenNthCalledWith(3, 'mut_3');
    });

    it('marks mutation failed and aborts processing if an error occurs', async () => {
      const mockQueue = [
        {
          id: 'mut_1',
          userId,
          expenseId: 'exp_1',
          type: 'CREATE_EXPENSE',
          payload: { title: 'Failing Item' },
          timestamp: 1000,
          retryCount: 0,
        },
        {
          id: 'mut_2',
          userId,
          expenseId: 'exp_2',
          type: 'CREATE_EXPENSE',
          payload: { title: 'Never reached' },
          timestamp: 2000,
          retryCount: 0,
        },
      ];

      (OfflineQueueService.getQueue as jest.Mock).mockResolvedValueOnce(mockQueue);
      (setDoc as jest.Mock).mockRejectedValueOnce(new Error('Network dropped'));
      (OfflineQueueService.markFailed as jest.Mock).mockResolvedValue(undefined);

      const count = await ExpenseService.processSyncQueue(userId);

      expect(count).toBe(0);
      expect(OfflineQueueService.markFailed).toHaveBeenCalledWith(
        'mut_1',
        'Network dropped'
      );
      expect(OfflineQueueService.remove).not.toHaveBeenCalled();
    });
  });
});

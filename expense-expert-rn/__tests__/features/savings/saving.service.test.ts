import { SavingService } from '@/features/savings/services/saving.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDocs, setDoc, deleteDoc } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mock-col-ref'),
  doc: jest.fn(() => 'mock-doc-ref'),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue(undefined),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  query: jest.fn(() => 'mock-query'),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}));

jest.mock('@/config/firebase', () => ({
  db: {},
}));

describe('SavingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('computeEndMonth', () => {
    it('computes end month for duration in months correctly', () => {
      // 2026-06 + 6 months -> 2026-11
      const end = SavingService.computeEndMonth('2026-06', 6, 'months');
      expect(end).toBe('2026-11');
    });

    it('computes end month spanning across year boundary', () => {
      // 2026-10 + 6 months -> 2027-03
      const end = SavingService.computeEndMonth('2026-10', 6, 'months');
      expect(end).toBe('2027-03');
    });

    it('computes end month for duration in years correctly', () => {
      // 2026-01 + 1 year -> 2026-12
      const end = SavingService.computeEndMonth('2026-01', 1, 'years');
      expect(end).toBe('2026-12');
    });
  });

  describe('CRUD offline cache fallbacks', () => {
    it('retrieves cached bank accounts when remote fails', async () => {
      (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const mockAccounts = [
        { id: 'bank_1', bankName: 'Chase', accountName: 'Savings', accountNumber: '1234' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockAccounts));

      const accounts = await SavingService.getBankAccounts('user_offline');
      expect(accounts).toEqual(mockAccounts);
    });

    it('retrieves cached saving goals when remote fails', async () => {
      (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const mockGoals = [
        {
          id: 'goal_1',
          purpose: 'Emergency Fund',
          targetAmount: 5000,
          savedAmount: 1200,
          durationValue: 12,
          durationUnit: 'months',
          startMonth: '2026-01',
          endMonth: '2026-12',
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockGoals));

      const goals = await SavingService.getGoals('user_offline');
      expect(goals).toEqual(mockGoals);
    });
  });
});

import { DraftService } from '@/features/drafts/services/draft.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDocs } from 'firebase/firestore';

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

describe('DraftService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retrieves cached drafts when remote fails', async () => {
    (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    const mockDrafts = [
      {
        id: 'draft_1',
        title: 'Electricity Bill',
        targetAmount: 120,
        category: 'utilities',
        installmentCount: 1,
        isActive: true,
      },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockDrafts));

    const drafts = await DraftService.getDrafts('user_offline');
    expect(drafts).toEqual(mockDrafts);
  });
});

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AuthProvider } from '@/features/auth/context/AuthProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthService } from '@/features/auth/services/auth.service';
import { RealtimeSyncManager } from '@/features/sync/services/RealtimeSyncManager';

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ type: 'firestore' })),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock('@/features/auth/services/auth.service', () => ({
  AuthService: {
    ensureUserDocument: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    signInWithGoogle: jest.fn(),
  },
}));

describe('Realtime Teardown Integration with AuthProvider', () => {
  let authCallback: ((user: User | null) => Promise<void>) | null = null;
  const unsubscribeMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    RealtimeSyncManager.teardownAll();

    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, callback) => {
      authCallback = callback;
      return unsubscribeMock;
    });
  });

  afterEach(() => {
    RealtimeSyncManager.teardownAll();
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(AuthProvider, null, children);

  it('tears down all active realtime subscriptions when auth state transitions to null', async () => {
    const unsubExp = jest.fn();
    const unsubCat = jest.fn();
    const unsubBud = jest.fn();

    // Setup active listeners in RealtimeSyncManager
    RealtimeSyncManager.register('expenses_user1_2026-08', () => unsubExp);
    RealtimeSyncManager.register('categories_user1', () => unsubCat);
    RealtimeSyncManager.register('budgets_user1_2026-08', () => unsubBud);

    expect(RealtimeSyncManager.getActiveCount()).toBe(3);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Transition auth state to null
    await act(async () => {
      if (authCallback) {
        await authCallback(null);
      }
    });

    expect(unsubExp).toHaveBeenCalledTimes(1);
    expect(unsubCat).toHaveBeenCalledTimes(1);
    expect(unsubBud).toHaveBeenCalledTimes(1);
    expect(RealtimeSyncManager.getActiveCount()).toBe(0);
    expect(result.current.user).toBeNull();
  });

  it('tears down all active realtime subscriptions when logout() is explicitly called', async () => {
    const unsubExp = jest.fn();
    const unsubCat = jest.fn();

    RealtimeSyncManager.register('expenses_user2_2026-08', () => unsubExp);
    RealtimeSyncManager.register('categories_user2', () => unsubCat);

    expect(RealtimeSyncManager.getActiveCount()).toBe(2);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(AuthService.logout).toHaveBeenCalled();
    expect(unsubExp).toHaveBeenCalledTimes(1);
    expect(unsubCat).toHaveBeenCalledTimes(1);
    expect(RealtimeSyncManager.getActiveCount()).toBe(0);
  });

  it('cleans up existing subscriptions when switching between user accounts', async () => {
    const user1Unsub = jest.fn();
    const user2Unsub = jest.fn();

    const mockUser1 = { uid: 'user_1', email: 'user1@test.com' } as unknown as User;
    const mockUser2 = { uid: 'user_2', email: 'user2@test.com' } as unknown as User;

    (AuthService.ensureUserDocument as jest.Mock).mockResolvedValue({
      uid: 'user_1',
      email: 'user1@test.com',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Login User 1
    await act(async () => {
      if (authCallback) {
        await authCallback(mockUser1);
      }
    });
    RealtimeSyncManager.register('expenses_user_1_2026-08', () => user1Unsub);
    expect(RealtimeSyncManager.getActiveCount()).toBe(1);

    // Logout User 1
    await act(async () => {
      await result.current.logout();
    });
    expect(user1Unsub).toHaveBeenCalledTimes(1);
    expect(RealtimeSyncManager.getActiveCount()).toBe(0);

    // Login User 2
    (AuthService.ensureUserDocument as jest.Mock).mockResolvedValue({
      uid: 'user_2',
      email: 'user2@test.com',
    });

    await act(async () => {
      if (authCallback) {
        await authCallback(mockUser2);
      }
    });
    RealtimeSyncManager.register('expenses_user_2_2026-08', () => user2Unsub);
    expect(RealtimeSyncManager.getActiveCount()).toBe(1);
    expect(RealtimeSyncManager.hasSubscription('expenses_user_2_2026-08')).toBe(true);
    expect(RealtimeSyncManager.hasSubscription('expenses_user_1_2026-08')).toBe(false);
  });
});

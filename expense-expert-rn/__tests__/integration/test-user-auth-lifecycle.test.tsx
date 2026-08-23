import React from 'react';
import { render, renderHook, act, fireEvent, waitFor } from '@testing-library/react-native';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { AuthProvider } from '../../src/features/auth/context/AuthProvider';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { AuthService } from '../../src/features/auth/services/auth.service';
import { LoginForm } from '../../src/features/auth/components/LoginForm';
import { getAuthErrorMessage } from '../../src/features/auth/utils/auth-errors';
import { RealtimeSyncManager } from '../../src/features/sync/services/RealtimeSyncManager';
import { resolveSalaryInCents } from '../../src/features/dashboard/utils/aggregation.util';

// Router Navigation Mocks
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Firebase Auth Mocks
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  signOut: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  getAuth: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(() => ({})),
}));

// Firebase Firestore Mocks
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ type: 'firestore' })),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => '2026-08-23T12:00:00.000Z'),
}));

// ============================================================================
// TEST USER FIXTURES (docs/instructions.md)
// ============================================================================

export const TEST_USER_7 = {
  credentials: {
    email: 'test-user-7@yopmail.com',
    password: 'Test@123',
    displayName: 'Test User 7',
  },
  firebaseUser: {
    uid: 'usr_test_user_7',
    email: 'test-user-7@yopmail.com',
    displayName: 'Test User 7',
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue('mock-jwt-token-usr-7'),
    getIdTokenResult: jest.fn().mockResolvedValue({
      token: 'mock-jwt-token-usr-7',
      claims: { role: 'authenticated' },
      expirationTime: '2026-08-24T12:00:00.000Z',
    }),
  } as unknown as User,
  firestoreDoc: {
    uid: 'usr_test_user_7',
    email: 'test-user-7@yopmail.com',
    displayName: 'Test User 7',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2026-08-23T12:00:00.000Z',
    monthlySalary: 5000,
    salaries: {
      '2025-01': 3500, // Initial salary step
      '2025-06': 4200, // Mid-year salary bump
      '2026-01': 5000, // Annual salary step-up
    },
    currency: 'USD',
    theme: 'dark',
    notifications: true,
  },
};

describe('Test User Authentication Lifecycle Integration Suite (`test-user-7@yopmail.com`)', () => {
  let authStateCallback: ((user: User | null) => Promise<void>) | null = null;
  const mockUnsubscribe = jest.fn();
  let inMemoryFirestore: Map<string, any> = new Map();

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    RealtimeSyncManager.teardownAll();
    inMemoryFirestore.clear();

    // Pre-populate Firestore with test-user-7 document
    inMemoryFirestore.set(
      `users/${TEST_USER_7.firebaseUser.uid}`,
      TEST_USER_7.firestoreDoc
    );

    // Mock onAuthStateChanged registration
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, callback) => {
      authStateCallback = callback;
      return mockUnsubscribe;
    });

    // Mock doc path builder
    (doc as jest.Mock).mockImplementation((_db, collection, docId) => ({
      path: `${collection}/${docId}`,
      id: docId,
    }));

    // Mock Firestore getDoc
    (getDoc as jest.Mock).mockImplementation((docRef) => {
      const data = inMemoryFirestore.get(docRef.path);
      return Promise.resolve({
        exists: () => !!data,
        data: () => data,
      });
    });

    // Mock Firestore setDoc
    (setDoc as jest.Mock).mockImplementation((docRef, payload) => {
      inMemoryFirestore.set(docRef.path, payload);
      return Promise.resolve();
    });

    // Default signOut implementation
    (signOut as jest.Mock).mockImplementation(async () => {
      if (authStateCallback) {
        await authStateCallback(null);
      }
    });
  });

  afterEach(() => {
    RealtimeSyncManager.teardownAll();
  });

  // ==========================================================================
  // SCENARIO 1: Login with `test-user-7@yopmail.com` and `Test@123`
  // ==========================================================================
  describe('1. Login with test-user-7 Credentials', () => {
    it('authenticates successfully via AuthService.login with exact credentials and ensures profile document', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: TEST_USER_7.firebaseUser,
      });

      const user = await AuthService.login({
        email: TEST_USER_7.credentials.email,
        password: TEST_USER_7.credentials.password,
      });

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test-user-7@yopmail.com',
        'Test@123'
      );
      expect(user).toBe(TEST_USER_7.firebaseUser);
      expect(getDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: `users/${TEST_USER_7.firebaseUser.uid}` })
      );
    });

    it('authenticates via useAuth hook, transitions state, and provides user context', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: TEST_USER_7.firebaseUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({
          email: TEST_USER_7.credentials.email,
          password: TEST_USER_7.credentials.password,
        });
      });

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        TEST_USER_7.credentials.email,
        TEST_USER_7.credentials.password
      );

      // Simulate Firebase Auth state transition after successful sign-in
      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(TEST_USER_7.firebaseUser);
        }
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBe(TEST_USER_7.firebaseUser);
      expect(result.current.isLoading).toBe(false);
    });

    it('renders LoginForm component, submits test-user-7 credentials, and navigates to home', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: TEST_USER_7.firebaseUser,
      });

      const { getByTestId, getByPlaceholderText } = render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      // Fill in test user credentials
      fireEvent.changeText(
        getByPlaceholderText('you@example.com'),
        TEST_USER_7.credentials.email
      );
      fireEvent.changeText(
        getByTestId('login-password-input'),
        TEST_USER_7.credentials.password
      );

      const submitButton = getByTestId('login-submit-button');
      expect(submitButton.props.accessibilityState.disabled).toBe(false);

      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          TEST_USER_7.credentials.email,
          TEST_USER_7.credentials.password
        );
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
    });

    it('sanitizes email with whitespace when logging in', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: TEST_USER_7.firebaseUser,
      });

      await AuthService.login({
        email: '   test-user-7@yopmail.com   ',
        password: TEST_USER_7.credentials.password,
      });

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test-user-7@yopmail.com',
        TEST_USER_7.credentials.password
      );
    });
  });

  // ==========================================================================
  // SCENARIO 2: Hydrate Firestore profile from users/{uid} (created timestamp & salary progression)
  // ==========================================================================
  describe('2. Hydrate Firestore profile from `users/{uid}` with created timestamp and salary progression', () => {
    it('hydrates full user profile from Firestore into AuthProvider including createdAt and salaries', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(TEST_USER_7.firebaseUser);
        }
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.profile).toBeDefined();
      expect(result.current.profile?.uid).toBe(TEST_USER_7.firebaseUser.uid);
      expect(result.current.profile?.email).toBe(TEST_USER_7.credentials.email);
      expect(result.current.profile?.displayName).toBe(TEST_USER_7.credentials.displayName);
      expect(result.current.profile?.createdAt).toBe('2025-01-01T00:00:00.000Z');
      expect(result.current.profile?.monthlySalary).toBe(5000);
      expect(result.current.profile?.salaries).toEqual({
        '2025-01': 3500,
        '2025-06': 4200,
        '2026-01': 5000,
      });
      expect(result.current.profile?.currency).toBe('USD');
      expect(result.current.profile?.theme).toBe('dark');
    });

    it('accurately resolves salary progression across historical and current months using resolveSalaryInCents', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(TEST_USER_7.firebaseUser);
        }
      });

      const profile = result.current.profile;
      expect(profile).not.toBeNull();

      // 1. Initial salary step at account inception (2025-01) -> $3,500 = 350000 cents
      expect(resolveSalaryInCents(profile, '2025-01')).toBe(350000);

      // 2. Month before mid-year bump (2025-05) -> should carry over 2025-01 step ($3,500 = 350000 cents)
      expect(resolveSalaryInCents(profile, '2025-05')).toBe(350000);

      // 3. Mid-year bump (2025-06) -> $4,200 = 420000 cents
      expect(resolveSalaryInCents(profile, '2025-06')).toBe(420000);

      // 4. End of 2025 (2025-12) -> should carry over 2025-06 step ($4,200 = 420000 cents)
      expect(resolveSalaryInCents(profile, '2025-12')).toBe(420000);

      // 5. Annual salary step-up (2026-01) -> $5,000 = 500000 cents
      expect(resolveSalaryInCents(profile, '2026-01')).toBe(500000);

      // 6. Current active month (2026-08) -> should carry over 2026-01 step ($5,000 = 500000 cents)
      expect(resolveSalaryInCents(profile, '2026-08')).toBe(500000);

      // 7. Month before all mapped steps (2024-10) -> should pick earliest step ($3,500 = 350000 cents)
      expect(resolveSalaryInCents(profile, '2024-10')).toBe(350000);
    });

    it('creates and initializes default Firestore document if document does not exist yet', async () => {
      const newTestUser = {
        uid: 'usr_new_test_7',
        email: 'new-test-7@yopmail.com',
        displayName: 'New Test 7',
      } as unknown as User;

      const profile = await AuthService.ensureUserDocument(newTestUser);

      expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'users/usr_new_test_7' }),
        expect.objectContaining({
          uid: 'usr_new_test_7',
          email: 'new-test-7@yopmail.com',
          displayName: 'New Test 7',
          createdAt: '2026-08-23T12:00:00.000Z',
          updatedAt: '2026-08-23T12:00:00.000Z',
        })
      );
      expect(profile.uid).toBe('usr_new_test_7');
      expect(profile.displayName).toBe('New Test 7');
    });
  });

  // ==========================================================================
  // SCENARIO 3: Token refresh and session persistence on cold reload
  // ==========================================================================
  describe('3. Token refresh and session persistence on cold reload', () => {
    it('restores persisted session for test-user-7 on app cold reload', async () => {
      // 1. Initial render before session is restored
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);

      // 2. Firebase Auth persistence emits cached test-user-7
      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(TEST_USER_7.firebaseUser);
        }
      });

      // 3. Verified hydrated session
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.uid).toBe(TEST_USER_7.firebaseUser.uid);
      expect(result.current.profile?.displayName).toBe('Test User 7');
      expect(result.current.profile?.monthlySalary).toBe(5000);
    });

    it('handles token refresh and rotation seamlessly without session disruption', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initial login
      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(TEST_USER_7.firebaseUser);
        }
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Simulate token refresh call
      const token = await TEST_USER_7.firebaseUser.getIdToken(true);
      const tokenResult = await TEST_USER_7.firebaseUser.getIdTokenResult();

      expect(token).toBe('mock-jwt-token-usr-7');
      expect(tokenResult.claims.role).toBe('authenticated');
      expect(TEST_USER_7.firebaseUser.getIdToken).toHaveBeenCalledWith(true);

      // Simulate auth event on token refresh
      const refreshedUser = {
        ...TEST_USER_7.firebaseUser,
        uid: 'usr_test_user_7',
      } as unknown as User;

      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(refreshedUser);
        }
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.uid).toBe('usr_test_user_7');
      expect(result.current.profile?.createdAt).toBe('2025-01-01T00:00:00.000Z');
    });

    it('gracefully handles Firestore network read timeout during cold reload while keeping user authenticated', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (getDoc as jest.Mock).mockRejectedValueOnce(new Error('Firestore connection timeout'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(TEST_USER_7.firebaseUser);
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.uid).toBe(TEST_USER_7.firebaseUser.uid);
      expect(result.current.profile).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // ==========================================================================
  // SCENARIO 4: Invalid password attempt (`WrongPassword!`) returns user-friendly error message
  // ==========================================================================
  describe('4. Invalid password attempt error handling and security mapping', () => {
    it('displays user-friendly error message on LoginForm when entering WrongPassword!', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
        code: 'auth/wrong-password',
      });

      const { getByTestId, getByPlaceholderText, findByText } = render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      fireEvent.changeText(
        getByPlaceholderText('you@example.com'),
        TEST_USER_7.credentials.email
      );
      fireEvent.changeText(getByTestId('login-password-input'), 'WrongPassword!');

      await act(async () => {
        fireEvent.press(getByTestId('login-submit-button'));
      });

      const errorBanner = await findByText('Invalid email or password');
      expect(errorBanner).toBeTruthy();
      expect(getByTestId('login-error-banner')).toBeTruthy();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('handles auth/invalid-credential code with user-friendly error', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
        code: 'auth/invalid-credential',
      });

      const { getByTestId, getByPlaceholderText, findByText } = render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      fireEvent.changeText(
        getByPlaceholderText('you@example.com'),
        TEST_USER_7.credentials.email
      );
      fireEvent.changeText(getByTestId('login-password-input'), 'WrongPassword!');

      await act(async () => {
        fireEvent.press(getByTestId('login-submit-button'));
      });

      const errorBanner = await findByText('Invalid email or password');
      expect(errorBanner).toBeTruthy();
    });

    it('validates comprehensive error code mappings via getAuthErrorMessage', () => {
      expect(getAuthErrorMessage('auth/wrong-password')).toBe('Invalid email or password');
      expect(getAuthErrorMessage('auth/invalid-credential')).toBe('Invalid email or password');
      expect(getAuthErrorMessage('auth/user-not-found')).toBe('Invalid email or password');
      expect(getAuthErrorMessage('auth/email-already-in-use')).toBe('An account with this email already exists');
      expect(getAuthErrorMessage('auth/weak-password')).toBe('Password must be at least 6 characters');
      expect(getAuthErrorMessage('auth/invalid-email')).toBe('Invalid email address');
      expect(getAuthErrorMessage('auth/too-many-requests')).toBe('Too many attempts. Please try again later.');
      expect(getAuthErrorMessage('auth/user-disabled')).toBe('This account has been disabled');
      expect(getAuthErrorMessage('auth/network-request-failed')).toBe('Network error. Please check your internet connection.');
      expect(getAuthErrorMessage('auth/popup-closed-by-user')).toBe('Sign-in cancelled');
      expect(getAuthErrorMessage('unknown-error-code')).toBe('Authentication failed. Please try again.');
    });
  });

  // ==========================================================================
  // SCENARIO 5: Clean logout triggering RealtimeSyncManager.teardownAll()
  // ==========================================================================
  describe('5. Clean logout triggering RealtimeSyncManager.teardownAll()', () => {
    it('tears down multi-domain real-time subscriptions and cleans state on explicit logout', async () => {
      const expensesUnsub = jest.fn();
      const budgetsUnsub = jest.fn();
      const categoriesUnsub = jest.fn();
      const dashboardUnsub = jest.fn();

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Authenticate test-user-7
      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(TEST_USER_7.firebaseUser);
        }
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Register active listeners across domains
      RealtimeSyncManager.register(
        `expenses_${TEST_USER_7.firebaseUser.uid}_2026-08`,
        () => expensesUnsub
      );
      RealtimeSyncManager.register(
        `budgets_${TEST_USER_7.firebaseUser.uid}_2026-08`,
        () => budgetsUnsub
      );
      RealtimeSyncManager.register(
        `categories_${TEST_USER_7.firebaseUser.uid}`,
        () => categoriesUnsub
      );
      RealtimeSyncManager.register(
        `dashboard_summary_${TEST_USER_7.firebaseUser.uid}_2026-08`,
        () => dashboardUnsub
      );

      expect(RealtimeSyncManager.getActiveCount()).toBe(4);
      expect(
        RealtimeSyncManager.hasSubscription(`expenses_${TEST_USER_7.firebaseUser.uid}_2026-08`)
      ).toBe(true);

      // Trigger Logout
      await act(async () => {
        await result.current.logout();
      });

      // Verify all listeners were cleaned up
      expect(expensesUnsub).toHaveBeenCalledTimes(1);
      expect(budgetsUnsub).toHaveBeenCalledTimes(1);
      expect(categoriesUnsub).toHaveBeenCalledTimes(1);
      expect(dashboardUnsub).toHaveBeenCalledTimes(1);
      expect(RealtimeSyncManager.getActiveCount()).toBe(0);
      expect(signOut).toHaveBeenCalledTimes(1);

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
    });

    it('triggers automatic teardown when auth state becomes null via external invalidation', async () => {
      const expensesUnsub = jest.fn();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(TEST_USER_7.firebaseUser);
        }
      });

      RealtimeSyncManager.register(
        `expenses_${TEST_USER_7.firebaseUser.uid}_2026-08`,
        () => expensesUnsub
      );
      expect(RealtimeSyncManager.getActiveCount()).toBe(1);

      // External token revocation / sign-out from another tab
      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(null);
        }
      });

      expect(expensesUnsub).toHaveBeenCalledTimes(1);
      expect(RealtimeSyncManager.getActiveCount()).toBe(0);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('ensures teardownAll is resilient when an unsubscription callback throws an error', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const faultyUnsub = jest.fn(() => {
        throw new Error('Listener cleanup failed');
      });
      const validUnsub = jest.fn();

      RealtimeSyncManager.register('key_faulty', () => faultyUnsub);
      RealtimeSyncManager.register('key_valid', () => validUnsub);

      expect(RealtimeSyncManager.getActiveCount()).toBe(2);

      expect(() => {
        RealtimeSyncManager.teardownAll();
      }).not.toThrow();

      expect(faultyUnsub).toHaveBeenCalledTimes(1);
      expect(validUnsub).toHaveBeenCalledTimes(1);
      expect(RealtimeSyncManager.getActiveCount()).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
